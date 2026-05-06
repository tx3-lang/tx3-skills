#!/usr/bin/env bash
# PostToolUse hook for tx3-skills.
#
# Reads a JSON event on stdin (Claude Code hook contract). If the edited file
# ends in `.tx3`, runs `trix check` from the nearest project root, or falls
# back to `tx3-mcp` for a single-file check. Emits hook output JSON on stdout.
#
# Always exits 0 (non-blocking) so the user's edit goes through; diagnostics
# are surfaced to the model as additional context for the next turn.
set -euo pipefail

# --- read event from stdin -------------------------------------------------
event="$(cat || true)"
if [[ -z "$event" ]]; then
    exit 0
fi

# Try jq first (fast, robust); fall back to grep if jq isn't available.
file_path=""
if command -v jq >/dev/null 2>&1; then
    file_path="$(printf '%s' "$event" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
else
    file_path="$(printf '%s' "$event" | sed -n 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
fi

# Only handle .tx3 edits.
case "$file_path" in
    *.tx3) ;;
    *) exit 0 ;;
esac

# --- find nearest trix.toml ------------------------------------------------
project_root=""
dir="$(dirname "$file_path")"
while [[ "$dir" != "/" && -n "$dir" ]]; do
    if [[ -f "$dir/trix.toml" ]]; then
        project_root="$dir"
        break
    fi
    dir="$(dirname "$dir")"
done

# --- run check -------------------------------------------------------------
diagnostics=""
if [[ -n "$project_root" ]] && command -v trix >/dev/null 2>&1; then
    diagnostics="$(cd "$project_root" && trix check 2>&1 || true)"
elif command -v tx3-mcp >/dev/null 2>&1; then
    # One-shot JSON-RPC: initialize → notifications/initialized → tools/call tx3_check
    init='{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"hook","version":"0"}}}'
    inited='{"jsonrpc":"2.0","method":"notifications/initialized"}'
    call="$(printf '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"tx3_check","arguments":{"path":"%s"}}}' "$file_path")"
    raw="$(printf '%s\n%s\n%s\n' "$init" "$inited" "$call" | tx3-mcp 2>/dev/null || true)"
    if command -v jq >/dev/null 2>&1; then
        diagnostics="$(printf '%s' "$raw" | jq -rs '.[] | select(.id==2) | .result.content[0].text' 2>/dev/null || true)"
    else
        diagnostics="$raw"
    fi
fi

# --- emit hook output ------------------------------------------------------
if [[ -z "$diagnostics" ]] || [[ "$diagnostics" == *"check passed"* ]]; then
    exit 0
fi

# Non-blocking: emit additionalContext-style output so the model sees diagnostics.
if command -v jq >/dev/null 2>&1; then
    jq -nc --arg msg "tx3 diagnostics for $file_path:\n$diagnostics" \
        '{hookSpecificOutput:{hookEventName:"PostToolUse",additionalContext:$msg}}'
else
    # Fallback: simple printf-shaped JSON. Newlines in diagnostics are escaped.
    escaped="$(printf '%s' "$diagnostics" | sed 's/\\/\\\\/g; s/"/\\"/g; s/$/\\n/' | tr -d '\n')"
    printf '{"hookSpecificOutput":{"hookEventName":"PostToolUse","additionalContext":"tx3 diagnostics for %s:\\n%s"}}\n' "$file_path" "$escaped"
fi

exit 0
