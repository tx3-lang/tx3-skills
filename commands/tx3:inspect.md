---
description: Show the TIR (typed intermediate representation) for a single transaction in the current project.
argument-hint: "<tx_name>"
---

A transaction name is required as $1. If $1 is empty, ask which tx to inspect (call `mcp__tx3__tx3_inspect_project` first to enumerate available txs).

Find the nearest `trix.toml`, resolve `[protocol].main`, and read the file contents.

Call MCP tool `mcp__tx3__tx3_lower` with `{ "source": <main.tx3 contents>, "tx_name": "$1" }`.

If `ok: false`, render diagnostics like `/tx3:check` does and stop.

If `ok: true`, render the TIR JSON in a fenced ```json``` block, then summarize in 5–10 bullet points:
- Inputs: count, sources (party/policy/script address), datum types if typed
- Outputs: count, destinations, amounts (with `Ada(n)` and named assets), datums
- Mints / burns: which assets, by how much
- Redeemers used (per input/mint/withdrawal)
- Required signers
- Validity range (since/until slot) if set
- Any `cardano::*` blocks (withdrawals, certificates, treasury_donation, etc.)

Keep the summary jargon-light — the audience is someone reading TIR for the first time.
