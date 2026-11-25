# Tx3 for Cursor

The Cursor plugin packages the two Tx3 Agent Skills and the local `tx3-mcp`
server for Cursor's agent:

- **`tx3-language`**: the Tx3 language surface, loaded when you read or write
  `.tx3` files.
- **`tx3-project`**: `trix.toml`, profiles, codegen, tests and the `trix`
  command surface, loaded in a directory with `trix.toml`.
- **`tx3` MCP server**: runs `tx3-mcp` over stdio on your machine and exposes
  `tx3_parse`, `tx3_check`, `tx3_lower`, `tx3_apply_args`,
  `tx3_inspect_project`, `tx3_invoke`, `tx3_examples_list` and
  `tx3_example_get`.

The manifest is [`.cursor-plugin/plugin.json`](../.cursor-plugin/plugin.json).
It uses the same `skills/` tree as the other hosts. The Claude Code slash
commands and save hook are not part of the Cursor plugin.

## 1. Install the Tx3 toolchain

The plugin starts `tx3-mcp` by name, so `tx3-mcp` (and `trix` for project
workflows) must be on the `PATH` Cursor runs with. Install them with
[`tx3up`](https://github.com/tx3-lang/tx3up):

```sh
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/tx3-lang/tx3up/releases/latest/download/tx3up-installer.sh | sh
tx3up install
```

`tx3up` installs into `~/.tx3/default/bin` and adds that directory to your
shell profile. Open a new terminal and check:

```sh
tx3-mcp --version
trix --version
tx3c --version
```

### PATH for the Cursor app

Cursor reads your login shell's environment when it starts, so a `PATH` set
in your shell profile usually reaches it. Quit Cursor completely and reopen it
after installing the toolchain. If the server still fails to start, launch
Cursor from a terminal where `tx3-mcp --version` works:

```sh
cursor /path/to/your/project
```

## 2. Install the plugin

**From the Cursor Marketplace:** search for **Tx3** in Cursor's plugin
marketplace and install it.

**From a local checkout** (to test a candidate before it is listed): Cursor
loads plugins from `~/.cursor/plugins/local/<name>/`. Link a checkout there
and restart Cursor:

```sh
git clone https://github.com/tx3-lang/tx3-skills
mkdir -p ~/.cursor/plugins/local
ln -s "$PWD/tx3-skills" ~/.cursor/plugins/local/tx3-skills
```

## 3. Enable the server

Open **Cursor Settings → Tools & MCP**. The server appears as
`plugin-tx3-skills-tx3`, since Cursor prefixes plugin servers with the plugin
name. Turn it on if it is off. Its tool list should show the `tx3_*` tools.
A red status means Cursor could not start `tx3-mcp`; see
[PATH for the Cursor app](#path-for-the-cursor-app).

The Skills appear under **Cursor Settings → Rules, Skills, Subagents** as
`tx3-language` and `tx3-project`.

## 4. Check it works

Open a Tx3 project (any directory with `trix.toml`) and ask the agent:

> What does my application have to supply to call `transfer`?

The agent should load the `tx3-project` Skill. It should call
`tx3_inspect_project` with the absolute project directory and answer from the
result: the parties and the parameters with their types and units. Expand
the tool call in the chat to see its input and the JSON it returned.

## Inspect the installed version

- Plugin: the `version` in `.cursor-plugin/plugin.json` of the installed copy.
  For a local install, run
  `grep '"version"' ~/.cursor/plugins/local/tx3-skills/.cursor-plugin/plugin.json`.
- Toolchain: `tx3-mcp --version`, `trix --version` and `tx3c --version`.
- Server output: open the **Output** panel and choose the MCP log channel
  for `plugin-tx3-skills-tx3` to see the server's start-up and errors.

## Compatibility

`tx3-skills` 0.2.0 is tested with Cursor 3.1.10, tx3-mcp 0.5.0, trix 0.28.0
and tx3c 0.25.0.

## Marketplace submission

The account holder submits the public repository at
<https://cursor.com/marketplace/publish> with:

| Field | Value |
|---|---|
| Repository | <https://github.com/tx3-lang/tx3-skills> |
| Source tag | `cursor-v0.2.0` |
| Plugin name | `tx3-skills` |
| Title | Tx3 |
| Version | 0.2.0 |
| License | Apache-2.0 ([LICENSE](../LICENSE)) |
| Publisher | TxPipe |
| Description | Tx3 language and trix project support for Cursor: two Agent Skills (`tx3-language`, `tx3-project`) and the local `tx3-mcp` server for checking, lowering and inspecting Tx3 protocols. Requires the Tx3 toolchain from tx3up. |
| Capabilities | Skills: `tx3-language`, `tx3-project`. MCP: one local stdio server (`tx3-mcp`). No rules, agents, commands, hooks or variables. |
| Prerequisites | `tx3-mcp` on `PATH`, installed by tx3up |
| Documentation | This page |

The `cursor-v0.2.0` tag lets the Cursor listing go through review on its own,
separate from the `v0.2.0` tag the other hosts use.
