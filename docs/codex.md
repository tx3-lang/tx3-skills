# Install tx3-skills in Codex

The Codex adapter of `tx3-skills` ships the two Tx3 Skills (`tx3-language` and
`tx3-project`) and the local `tx3-mcp` server. It is published from this
repository's Tx3 catalog, `.agents/plugins/marketplace.json`. The Claude Code
slash commands and save hook stay specific to Claude Code and are not loaded in
Codex.

Tested with Codex CLI 0.160.1, tx3-mcp 0.5.0, trix 0.28.0 and tx3c 0.25.0.

## 1. Install the Tx3 toolchain

The plugin starts `tx3-mcp` by name, so it must be on the `PATH` of the process
that runs Codex. Install it, with `trix` and `tx3c`, through
[`tx3up`](https://github.com/tx3-lang/tx3up):

```sh
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/tx3-lang/tx3up/releases/latest/download/tx3up-installer.sh | sh
tx3up
```

`tx3up` installs the binaries in `~/.tx3/default/bin`. Make sure that directory
is on your `PATH` in the shell you start Codex from, then check:

```sh
tx3-mcp --version   # tx3-mcp 0.5.0
trix --version      # trix 0.28.0
tx3c --version      # tx3c 0.25.0
```

## 2. Add the Tx3 catalog and install the plugin

```sh
codex plugin marketplace add tx3-lang/tx3-skills --ref v0.2.0
codex plugin add tx3-skills@tx3
codex plugin list
```

`codex plugin list` should show `tx3-skills@tx3` as `installed, enabled` at
version `0.2.0`.

## 3. Check it in a project

Open a Tx3 project (a directory with `trix.toml`) and trust it when Codex asks.
The plugin's server should be configured as a local stdio server:

```sh
codex mcp get tx3
# tx3
#   enabled: true
#   transport: stdio
#   command: tx3-mcp
```

Then start `codex` in the project and try:

- "What must my application supply to call `transfer`?" — Codex loads the
  `tx3-skills:tx3-project` skill and calls the `tx3` server's
  `tx3_inspect_project` tool with the absolute project directory. For the
  [Transfer example](https://github.com/open-tx3/acme-protocols/tree/065cb91a24893ea795027349386ce4da07e69229/transfer)
  the answer names the `Sender` and `Receiver` parties and `quantity` in
  lovelace.
- "Check this Tx3 project for errors." — calls `tx3_check` on the main file.
- "Explain this transaction" in a `.tx3` file — loads `tx3-skills:tx3-language`.

## Troubleshooting

**`MCP client for tx3 failed to start: ... No such file or directory`** —
`tx3-mcp` is not on the `PATH` Codex inherited. Run `tx3up`, add
`~/.tx3/default/bin` to your `PATH`, and start a new Codex session. The Skills
still answer language questions without the server, but cannot check or inspect
your project.

**The Tx3 tools or Skills do not appear** — the project may not be trusted, or
the plugin may be disabled. Check `codex plugin list` and trust the project.

## Upgrade or remove

```sh
codex plugin marketplace upgrade tx3
codex plugin remove tx3-skills@tx3
codex plugin marketplace remove tx3
```
