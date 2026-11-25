# Tx3 for OpenCode

The `opencode-tx3` npm package adds Tx3 support to [OpenCode](https://opencode.ai):

- the **`tx3-language`** and **`tx3-project`** Skills, loaded from the installed package;
- the local **`tx3-mcp`** server, registered as the MCP server `tx3`. OpenCode prefixes its
  tools with the server name, so they appear as `tx3_tx3_inspect_project`, `tx3_tx3_check`,
  `tx3_tx3_lower` and so on.

Tested with OpenCode 1.17.14, tx3-mcp 0.5.0, trix 0.28.0 and tx3c 0.25.0. The package
declares `engines.opencode` `>=1.17.14 <2`.

## 1. Install the toolchain

The plugin starts `tx3-mcp` from the `PATH` of the OpenCode process. Install it, with `trix`
and `tx3c`, through [`tx3up`](https://github.com/tx3-lang/tx3up):

```sh
curl --proto '=https' --tlsv1.2 -LsSf \
  https://github.com/tx3-lang/tx3up/releases/latest/download/tx3up-installer.sh | sh
tx3up
```

`tx3up` installs into `~/.tx3/<channel>/bin` and adds `~/.tx3/default/bin` to your shell
profile. Open a new shell, then check the versions:

```sh
tx3-mcp --version   # tx3-mcp 0.5.0
trix --version      # trix 0.28.0
tx3c --version      # tx3c 0.25.0
```

## 2. Add the plugin

Pin the package in your OpenCode config, either globally in
`~/.config/opencode/opencode.json` or per project in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-tx3@0.2.0"]
}
```

OpenCode installs the package from npm the next time it starts. No other configuration is
needed. The plugin adds `mcp.tx3` (`{"type": "local", "command": ["tx3-mcp"]}`) and the
package's `skills/` directory to `skills.paths`, and keeps everything else in your config.

If `tx3-mcp` is not on the `PATH` OpenCode sees (a GUI launch, for example), define the
server yourself with an absolute path. The plugin keeps any `mcp.tx3` entry that runs `tx3-mcp`:

```json
{
  "plugin": ["opencode-tx3@0.2.0"],
  "mcp": { "tx3": { "type": "local", "command": ["/home/me/.tx3/default/bin/tx3-mcp"] } }
}
```

## 3. Check a clean session

Run these from a Tx3 project directory (one containing `trix.toml`):

```sh
opencode debug skill   # lists tx3-language and tx3-project, located under .../opencode-tx3/skills/
opencode mcp list      # shows the tx3 server as connected, running tx3-mcp
opencode debug config  # shows plugin, mcp.tx3 and skills.paths
```

To check from a fresh profile with no other Tx3 server or Skills installed, point `HOME` and the
XDG directories at an empty directory for the check. OpenCode reads Skills from
`~/.claude/skills` and `~/.agents/skills` too, so a fresh `HOME` keeps those out:

```sh
export HOME="$(mktemp -d)"
export XDG_CONFIG_HOME="$HOME/.config" XDG_DATA_HOME="$HOME/.local/share" \
       XDG_CACHE_HOME="$HOME/.cache" XDG_STATE_HOME="$HOME/.local/state"
mkdir -p "$XDG_CONFIG_HOME/opencode"
echo '{"plugin":["opencode-tx3@0.2.0"]}' > "$XDG_CONFIG_HOME/opencode/opencode.json"
opencode debug skill && opencode mcp list
```

Then try it in a project, for example the
[Transfer protocol](https://github.com/open-tx3/acme-protocols/tree/main/transfer):

```text
What must my application supply to call the transfer transaction in this project?
```

The session loads the `tx3-project` Skill and calls `tx3_tx3_inspect_project` with the
project's absolute directory. The answer names the `quantity: Int` parameter (in lovelace)
and the `Sender` and `Receiver` parties.

## Conflicts

If your config already defines an MCP server named `tx3` that does not run `tx3-mcp`, the
plugin leaves it alone, still registers the Skills, and logs a warning:

```text
opencode-tx3: MCP server "tx3" is already configured and does not run tx3-mcp, so the Tx3
tools were not registered. Remove or rename "mcp.tx3" in your opencode config, or point it
at {"type":"local","command":["tx3-mcp"]}.
```

Rename or remove that entry and restart OpenCode. Loading the plugin more than once, from
both global and project config for example, registers the server and the Skills once.

## Remove

Delete `opencode-tx3@0.2.0` from `plugin` and restart OpenCode.
