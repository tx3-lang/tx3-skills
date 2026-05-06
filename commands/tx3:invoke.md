---
description: Assemble, sign, and submit a Tx3 transaction by shelling out to `trix invoke`.
argument-hint: "<args-json>"
---

The first argument $1 is a JSON object string of transaction arguments — the same shape `trix invoke --args-json` accepts. Use `@walletname` placeholders to refer to wallets defined in the active profile's `[[wallets]]` block.

If $1 is empty, ask the user which transaction to invoke and what args to pass. Use `mcp__tx3__tx3_inspect_project` first to enumerate available transactions and their parameters.

Find the nearest `trix.toml` walking up from the current working directory. The directory containing it is the `project_dir`.

Call MCP tool `mcp__tx3__tx3_invoke` with:
```json
{
  "project_dir": "<absolute path>",
  "args": <parsed JSON from $1>,
  "skip_submit": false
}
```

Pass through additional flags if the user requests:
- `--skip-submit` → `"skip_submit": true` (assemble + sign only, don't broadcast)
- `--profile <name>` → `"profile": "<name>"`

Render the result:
- If `ok: true`, summarize stdout (transaction hash, fee, status). If `skip_submit` was set, mention the tx was assembled but not submitted.
- If `ok: false`, surface stderr verbatim. The most common failure modes:
  - `cshell waiting for an interactive prompt` → args don't fully specify the transaction or signer; ask the user to provide the missing piece.
  - `trix not on PATH` → ask user to run `tx3up`.
  - `connection refused` → devnet not running; suggest `trix devnet -b` in a separate terminal.
- If the response has no `error` and `exit_code` is non-zero, dump stderr in a fenced block — the model can usually diagnose from there.

Important: this tool actually submits to the chain (devnet, testnet, or mainnet depending on the active profile). Double-check the user's intent before invoking against `mainnet`. For exploration, prefer `skip_submit: true` and inspect the assembled tx in stdout.
