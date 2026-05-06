---
description: Run the Tx3 parser and analyzer over the current project's main file and surface diagnostics.
---

Find the nearest `trix.toml` walking up from the current working directory. Read its `[protocol].main` value (default: `main.tx3`) and resolve the absolute path of the main file relative to the `trix.toml` directory.

Call MCP tool `mcp__tx3__tx3_check` with `{ "path": "<absolute path to main.tx3>" }`.

Render the result:
- If `ok: true` and `diagnostics` is empty → say "check passed" and stop.
- Otherwise, for each diagnostic, print one line:
  `<severity> <code>: <message> — <source_path>:<spans[0].start_line>:<spans[0].start_col>`
  followed by any `help` indented under it.

If the user asks for a fix, propose one based on the diagnostic's span and any reference materials in the `tx3-language` skill. Don't apply fixes without confirmation.

If no `trix.toml` is found, ask the user which `.tx3` file to check and call `tx3_check` with `{ "source": "<file contents>", "path": "<file path>" }` instead.
