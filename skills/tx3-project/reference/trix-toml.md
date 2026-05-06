# `trix.toml` schema

Top-level tables and the keys each accepts.

## `[protocol]`

| Key | Type | Notes |
| --- | --- | --- |
| `name` | string | Required. Used as default codegen package name. |
| `scope` | string | Optional. Owner identifier (e.g. github org). Used by the registry. |
| `version` | string | Semver. Required for registry uploads. |
| `description` | string | Optional. |
| `main` | string | Path to the main `.tx3` file. Default: `main.tx3`. |

## `[registry]`

| Key | Type | Notes |
| --- | --- | --- |
| `url` | string | Registry endpoint. Default: `https://tx3.land`. |

## `[profile.<name>]`

`<name>` is freeform; common values are `dev`, `preview`, `preprod`, `mainnet`.

| Key | Type | Notes |
| --- | --- | --- |
| `env_file` | string | Path to the dotenv file with `env { ... }` values. Default: `.env.<name>`. |
| `chain` | string | One of `CardanoMainnet`, `CardanoPreprod`, `CardanoPreview`, `CardanoDevnet`. Used by some commands when `network` is absent. |

### `[profile.<name>.network]`

| Key | Type | Notes |
| --- | --- | --- |
| `type` | string | `devnet`, `preview`, `preprod`, `mainnet`. |
| `config` | string | Path to chain-specific config (e.g. `dolos.toml` for devnet). |

### `[profile.<name>.trp]`

| Key | Type | Notes |
| --- | --- | --- |
| `url` | string | TRP (Tx3 Resolve Protocol) endpoint. Used by `trix invoke`. |

### `[[profile.<name>.wallets]]` (devnet only)

Pre-funded wallets for the devnet:

| Key | Type | Notes |
| --- | --- | --- |
| `name` | string | Wallet identifier. Refer to as `@name` in invoke args. |
| `random_key` | bool | If true, generate a fresh keypair on devnet start. |
| `initial_balance` | int | Lovelace balance to seed at devnet genesis. |
| `key_file` | string | Path to a key file (alternative to `random_key`). |

## `[[bindings]]` (or `[[codegen]]`)

Each entry generates one client binding. The key name was `[[codegen]]` before v0.16; `[[bindings]]` is the current preferred form. Both still work.

| Key | Type | Notes |
| --- | --- | --- |
| `output_dir` | string | Where the generated code is written. |

### `[bindings.template]`

| Key | Type | Notes |
| --- | --- | --- |
| `repo` | string | GitHub repo (e.g. `tx3-lang/web-sdk`). |
| `path` | string | Subdirectory inside the repo containing the template. |
| `ref` | string | Branch, tag, or commit. |

## Older / deprecated keys

| Key | Status | Replacement |
| --- | --- | --- |
| `[[wallets]]` (top-level) | Deprecated as of v0.16.4 | Use `[[profile.<name>.wallets]]` |
| `[[codegen]]` | Soft-deprecated as of v0.16 | Use `[[bindings]]` |
