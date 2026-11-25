# tx3-skills

A [Claude Code](https://claude.com/claude-code) plugin that makes the [Tx3](https://github.com/tx3-lang/tx3) language and the [`trix`](https://github.com/tx3-lang/trix) toolchain first-class in any Claude Code session.

## What's inside

- **`tx3-language`** skill — auto-loads when you open or edit `.tx3` files. Teaches the language surface (top-level definitions, tx blocks, types, Cardano-specific blocks, expressions, gotchas).
- **`tx3-project`** skill — auto-loads when you're in a directory with `trix.toml`. Covers project layout, profiles, env files, codegen, the test toml format, and the trix command surface as a workflow guide.
- **`tx3-mcp`** MCP server — exposes structured tools (`tx3_parse`, `tx3_check`, `tx3_lower`, `tx3_apply_args`, `tx3_inspect_project`, `tx3_invoke`, `tx3_examples_list`, `tx3_example_get`) backed by the same `tx3-lang` and `tx3-cardano` crates that power `trix`.
- **Slash commands** — `/tx3:new`, `/tx3:check`, `/tx3:inspect <tx>`, `/tx3:explain [tx]`, `/tx3:invoke <tx> [args-json]`.
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

The repository is also the `tx3` plugin marketplace. Add it at the release tag, then install the plugin from it:

```sh
claude plugin marketplace add https://github.com/tx3-lang/tx3-skills.git#v0.2.0
claude plugin install tx3-skills@tx3
```

Inside a session the same two steps are `/plugin marketplace add https://github.com/tx3-lang/tx3-skills.git#v0.2.0` and `/plugin install tx3-skills@tx3`. The catalog pins `tx3-skills` to the `v0.2.0` tag. The plugin starts `tx3-mcp` by name, so Claude Code must be launched from a shell whose `PATH` includes `~/.tx3/default/bin`; restart it after running `tx3up`. Check the result with:

```sh
claude plugin list        # tx3-skills@tx3, Version 0.2.0, enabled
claude mcp list           # plugin:tx3-skills:tx3: tx3-mcp - ✔ Connected
```

Claude Code namespaces plugin MCP tools by plugin and server, so the tools appear as `mcp__plugin_tx3-skills_tx3__tx3_check` and so on. The commands use those names; the Skills use the bare tool names, which work under any prefix.

## Verify

In a fresh Claude Code session, inside a Tx3 project such as [`transfer`](https://github.com/open-tx3/acme-protocols/tree/main/transfer):

1. Ask "what must my application supply to call `transfer`?" → the `tx3-project` skill activates, calls `tx3_inspect_project` with the directory holding `trix.toml`, and names the `Sender` and `Receiver` addresses and `quantity` in lovelace.
2. Open `main.tx3` and ask "what does this transaction do?" → the `tx3-language` skill activates.
3. Type `/tx3:` → the `/tx3:*` commands from this plugin are listed. Run `/tx3:check` → it resolves `[protocol].main` and reports "check passed".
4. Introduce a syntax error in `main.tx3` through an edit → the save hook adds the `trix check` diagnostics to the next turn.

## Compatibility

`tx3-skills` 0.2.x targets the tx3up stable channel: **tx3-mcp 0.5.x**, **trix 0.28.x** and **tx3c 0.25.x**. It was checked with Claude Code 2.1.331. When the toolchain ships a new minor release, expect a matching `tx3-skills` release with updated skill content; re-run `tx3up` to refresh the binaries alongside.

## License

Apache-2.0
