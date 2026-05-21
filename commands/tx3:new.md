---
description: Scaffold a new Tx3 project in the current directory using `trix init`.
argument-hint: "[project_name]"
---

Run `trix init -y` to scaffold a Tx3 project in the current working directory. The command creates `trix.toml`, `main.tx3`, and a starter `tests/` directory.

After scaffolding:
1. Read `trix.toml` and `main.tx3` to confirm what was created.
2. If a project name was provided as $1 and `trix.toml`'s `[protocol].name` doesn't match, edit `trix.toml` to set it (use the Edit tool, not a shell rewrite).
3. Summarize for the user: project name, version, scope, and the txs defined in `main.tx3`.
4. Suggest the next step: `/tx3:check` to validate, then edit `main.tx3` to define real transactions.

If `trix` is not on `PATH`, tell the user to install it via `tx3up` (https://github.com/tx3-lang/tx3up).
