# tx3-skills

A [Claude Code](https://claude.com/claude-code) plugin that makes the [Tx3](https://github.com/tx3-lang/tx3) language and the [`trix`](https://github.com/tx3-lang/trix) toolchain first-class in any Claude Code session.

## What's inside

- **`tx3-language`** skill — auto-loads when you open or edit `.tx3` files. Teaches the language surface (top-level definitions, tx blocks, types, Cardano-specific blocks, expressions, gotchas).
- **`tx3-project`** skill — auto-loads when you're in a directory with `trix.toml`. Covers project layout, profiles, env files, codegen, the test toml format, and the trix command surface as a workflow guide.
- **`tx3-mcp`** MCP server — exposes seven structured tools (`tx3_parse`, `tx3_check`, `tx3_lower`, `tx3_apply_args`, `tx3_inspect_project`, `tx3_examples_list`, `tx3_example_get`) backed by the same `tx3-lang` and `tx3-cardano` crates that power `trix`.
- **Slash commands** — `/tx3:new`, `/tx3:check`, `/tx3:inspect <tx>`, `/tx3:explain [tx]`.
- **Save hook** — non-blocking PostToolUse hook on `Edit`/`Write`/`MultiEdit` for `*.tx3` files. Runs `trix check` (falling back to `tx3-mcp` directly) and surfaces diagnostics in the next turn.

## Prerequisite: install the toolchain via `tx3up`

This plugin assumes `tx3-mcp` and `trix` are on your `PATH`. The recommended way to install both is via [`tx3up`](https://github.com/tx3-lang/tx3up):

```sh
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/tx3-lang/tx3up/releases/latest/download/tx3up-installer.sh | sh
tx3up
```

`tx3up` places binaries in `~/.tx3/<channel>/bin/` and adds that directory to your shell's `PATH`. Verify with:

```sh
which tx3-mcp
tx3-mcp --version
```

## Install the plugin

```sh
claude plugin install https://github.com/tx3-lang/tx3-skills
```

That's the whole installation. The plugin manifest references `tx3-mcp` by name; Claude Code resolves it via `PATH`.

## Verify

In a fresh Claude Code session:

1. Open a directory containing a `.tx3` file → ask "what does this transaction do?" — the `tx3-language` skill should activate.
2. In a directory with `trix.toml` → ask "how do I add a preview profile?" — the `tx3-project` skill should activate.
3. Run `/tx3:check` in a project directory → the slash command resolves the project's `main.tx3` and runs `tx3_check`.
4. Run `claude --debug` and call `mcp__tx3__tx3_examples_list` directly → confirm 10 bundled examples are listed.

## Compatibility

`tx3-skills` 0.1.x is compatible with **tx3 0.17.x** (via `tx3-mcp` 0.1.x, which pins `tx3-lang = "=0.17"`). When tx3 ships a new minor release, expect a matching `tx3-skills` release with updated skill content; re-run `tx3up` to refresh the toolchain binaries alongside.

## License

Apache-2.0
