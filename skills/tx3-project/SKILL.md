---
name: tx3-project
description: Working with Tx3 projects managed by the `trix` toolchain. Covers `trix.toml` layout, the `main.tx3` entry point, profiles (dev/preview/preprod/mainnet), env files, devnet wallets, the test toml format, codegen bindings (typescript/rust/go/python), and the trix command surface (init, check, build, invoke, devnet, explore, codegen, inspect tir, test). Trigger when the user is in a directory containing `trix.toml`, asks about trix commands, project scaffolding, profiles, devnet setup, codegen, or test configuration.
license: Apache-2.0
---

# Tx3 projects with `trix`

`trix` is the project manager for Tx3. It scaffolds projects, validates code, generates client bindings, runs a local devnet (Dolos), and orchestrates transaction submission via CShell. This skill covers the project layout and the `trix` command surface — for language syntax inside `.tx3` files, load the **`tx3-language`** skill.

## Preflight

If `trix` is not on `PATH`, instruct the user to install [`tx3up`](https://github.com/tx3-lang/up) and run `tx3up`. The MCP tools (`mcp__tx3__*`) only depend on `tx3-mcp`, but the slash commands and full workflow assume `trix` is available.

## Project layout

```
my-protocol/
├── trix.toml              # Project config (protocol metadata, profiles, bindings, registry)
├── main.tx3               # Entry point (configurable via [protocol].main)
├── .env.<profile>         # Per-profile env values (loaded into the .tx3 `env { ... }` block)
├── tests/
│   └── basic.toml         # Test scenarios (see "Tests" below)
├── gen/
│   └── <binding>/         # Generated client code from `trix codegen`
└── dolos.toml             # Devnet config (only present when a profile uses devnet)
```

## `trix.toml`

```toml
[protocol]
name = "mydapp"
scope = "txpipe"
version = "0.1.0"
description = "Example dapp"
main = "main.tx3"

[registry]
url = "https://tx3.land"

[profile.dev]
env_file = ".env.dev"

[[profile.dev.wallets]]
name = "alice"
random_key = true
initial_balance = 3000

[profile.dev.network]
type = "devnet"
config = "dolos.toml"

[profile.dev.trp]
url = "http://localhost:3000/trp"

[profile.preview]
env_file = ".env.preview"

[[bindings]]
output_dir = "./gen/typescript"

[bindings.template]
repo = "tx3-lang/web-sdk"
path = ".trix/client-lib"
ref = "codegen-v1beta0"
```

Key tables:

- `[protocol]` — name, scope, version, description, main file path. Required.
- `[registry]` — Tx3 registry URL for type lookups (default: `https://tx3.land`).
- `[profile.<name>]` — per-environment config. Common values: `dev`, `preview`, `preprod`, `mainnet`. Each has `env_file`, optional `network` block, optional `trp` block, optional `wallets` for devnet.
- `[[bindings]]` (or `[[codegen]]` in older versions) — codegen targets. Each entry has `output_dir` and a `[bindings.template]` describing the source.

Full schema: `reference/trix-toml.md`.

## Command surface (workflow guide)

Grouped by intent rather than alphabetically. Slash command shortcuts where available.

### Scaffold a new project

```sh
trix init -y     # non-interactive defaults
trix init        # interactive prompts for name, scope, bindings
```

In Claude Code, prefer `/tx3:new` — it runs `trix init -y`, reads back the generated files, and applies any name/scope overrides.

### Validate `.tx3` source

```sh
trix check       # runs parser + analyzer over [protocol].main
```

Or use `/tx3:check` — it calls `mcp__tx3__tx3_check` which surfaces structured diagnostics with line/col spans.

### Build TII (Transaction Interface Information)

```sh
trix build                    # writes JSON to stdout
trix build -o tii.json        # writes to file
trix build -p preview         # uses the `preview` profile's env values
```

TII is the contract between Tx3 and downstream client code — it describes every transaction's parameters and shape. Codegen reads it.

### Inspect TIR (typed intermediate representation)

```sh
trix inspect tir --tx swap            # dump TIR JSON for the named tx
trix inspect tir --tx swap --pretty   # human-readable formatting
```

Or use `/tx3:inspect <tx_name>` — wraps `mcp__tx3__tx3_lower` and produces a TIR dump plus a 5–10 bullet summary.

### Run end-to-end (devnet → invoke)

```sh
trix devnet -b                # start Dolos devnet in background
trix invoke --args-json '{"quantity": 2000000, "sender": "@alice", "receiver": "@bob"}'
trix explore                  # interactive chain inspector via CShell
```

`trix invoke` opens an interactive prompt if `--args-json` is omitted. Use `@<wallet_name>` placeholders to refer to wallets defined in `[[profile.<name>.wallets]]`.

### Generate client code

```sh
trix codegen     # reads [[bindings]] / [[codegen]] in trix.toml
```

Each binding emits a client SDK in its `output_dir` (e.g. `./gen/typescript`). Templates are pulled from a git repo declared in `[bindings.template]`.

### Test

```sh
trix test tests/basic.toml
```

See "Tests" below.

### Telemetry

```sh
trix telemetry on    # opt in
trix telemetry off
trix telemetry status
```

## Profiles and env files

Each `profile` has an `env_file` (default: `.env.<profile_name>`). The file is dotenv-format:

```
mydapp_address=0xABCDEF...
oracle_ref=0xORACLEHASH#0
maximum_amount=1000000
```

Variables here populate the `env { ... }` block at the top of `main.tx3`. Type checking is done against the `env` declaration in the .tx3 file, so values must parse to the declared types (numbers as decimal, bytes as `0x...`, booleans as `true`/`false`).

To run with a profile: `trix build -p preview`, `trix invoke -p preview`, etc.

## Tests

Test files are TOML; one file = one scenario. Run with `trix test path/to/test.toml`.

```toml
file = "./main.tx3"

[[wallets]]
name = "bob"
balance = 10000000

[[wallets]]
name = "alice"
balance = 5000000

[[transactions]]
description = "bob sends 2 Ada to alice"
template = "transfer"
signers = ["bob"]
args = { quantity = 2000000, sender = "@bob", receiver = "@alice" }

[[expect]]
from = "@bob"

[[expect.min_amount]]
amount = 9638899
```

`@walletname` placeholders resolve to that wallet's address. `[[expect]]` blocks check the post-state (balance constraints, UTxO presence). Full reference: `reference/tests.md`.

## Common workflows

**Start a new protocol from scratch**
1. `/tx3:new` (or `trix init`)
2. Edit `main.tx3` — define your parties, types, and transactions
3. `/tx3:check` to validate as you go
4. `trix devnet -b` to start a local chain
5. `trix invoke --args-json '...'` to exercise a transaction

**Add a new transaction to an existing project**
1. Edit `main.tx3`
2. `/tx3:check`
3. `/tx3:inspect <new_tx>` to see the TIR
4. `trix build` to refresh TII
5. If clients are codegen'd, `trix codegen`

**Test before committing**
1. Write `tests/feature.toml`
2. `trix test tests/feature.toml`
3. Watch the per-tx output for unexpected balances or failed assertions

## Where to look

- `reference/trix-toml.md` — full `trix.toml` schema with every key
- `reference/workflows.md` — extended workflows including codegen and CI integration
- `reference/tests.md` — test toml format with all assertion kinds
- `reference/profiles.md` — profile config, env files, network blocks, TRP

For language syntax inside `main.tx3`, load the **`tx3-language`** skill.
