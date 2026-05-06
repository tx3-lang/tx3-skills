---
description: Explain the current Tx3 project (or one transaction) in plain language.
argument-hint: "[tx_name]"
---

Find the nearest `trix.toml`. Call MCP tool `mcp__tx3__tx3_inspect_project` with `{ "project_dir": "<absolute path to project root>" }`.

Render a human-readable explanation:

**Project overview** (always):
- Project name, version, scope (from `trix_toml.protocol`)
- Parties: list each, noting which look like user wallets vs script addresses
- Assets and policies: list each with one-line context if the name is descriptive

**Per transaction** (filter to $1 if provided, else all):
- Name and one-sentence purpose inferred from the name + structure
- Parameters (`name: type` list)
- What it consumes (inputs and references — including any typed datum reads)
- What it produces (outputs, mints, burns)
- Cardano-specific actions (withdrawals, certificates, treasury donations, witnesses)
- Required signers
- Validity window if set

Audience: an end user trying to understand what a transaction does without reading Tx3 syntax. Avoid Tx3 jargon (no "TIR", no "lowering"). Use Cardano terminology where applicable (UTxO, datum, redeemer, validator, native script).

If diagnostics are present in the response, mention them as a brief warning at the top — but still produce the explanation based on whatever AST the workspace was able to build.
