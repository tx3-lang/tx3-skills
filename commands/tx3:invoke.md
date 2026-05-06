---
description: Resolve a Tx3 transaction against the project's TRP endpoint and inspect the unsigned tx CBOR + hash. Does not sign or submit.
argument-hint: "<tx-name> [<args-json>]"
---

This command **resolves** a transaction — it returns the unsigned CBOR + tx hash so you (or the user) can inspect what would be submitted. It does **not** sign or submit. To actually broadcast, the user must run `trix invoke` (or sign+submit through their own wallet).

## Inputs

- $1 — transaction name (matches a `tx <name>` block in `main.tx3`).
- $2 — JSON object string of arguments. Same shape `trix invoke --args-json` accepts.

If $1 is empty, ask which transaction to resolve. Use `mcp__tx3__tx3_inspect_project` first to enumerate the available transactions and their parameters.

## Procedure

Find the nearest `trix.toml` walking up from the current working directory. The directory containing it is the `project_dir`.

Call MCP tool `mcp__tx3__tx3_invoke` with:
```json
{
  "project_dir": "<absolute path to dir with trix.toml>",
  "tx_name": "$1",
  "args": <parsed JSON from $2; default {}>
}
```

Optional fields the user may request:
- `"profile": "<name>"` — pick a non-default profile.
- `"parties": { "name1": "addr1...", "name2": "addr2..." }` — bind party names to bech32 addresses for transactions that read addresses at resolve-time.

## Render the result

- If `ok: true`, print:
  - **Hash:** `<body.hash>`
  - **CBOR (unsigned, hex):** in a fenced block
  - A reminder: this is **not** signed or submitted. To actually broadcast, run `trix invoke --args-json '<...>'` from the project directory.
- If `body.diagnostics` is non-empty (parse / analyze errors in `main.tx3`), render each as `<severity> <code>: <message> — file:line:col` and stop.
- If `body.error` is set, surface it. Common cases and what to suggest:
  - "missing [profile.<name>.trp].url" → tell the user to add a TRP endpoint to that profile, or run a local devnet (`trix devnet -b`) and point the profile at its TRP.
  - "resolve failed: ..." → the TRP rejected the request. Likely causes: party addresses don't exist on the network, args don't satisfy the script, or the network's UTxO set lacks matching inputs. Ask the user to clarify.
  - "trix.toml not found" → ask which directory to use, or `cd` to the project root.

Avoid suggesting that the agent itself submit the transaction — `tx3_invoke` is intentionally resolve-only in v1.
