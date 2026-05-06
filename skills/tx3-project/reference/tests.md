# Test toml format

Test files describe a scenario: a fresh devnet, a sequence of transactions, and assertions about the resulting chain state.

## Top-level

| Key | Type | Notes |
| --- | --- | --- |
| `file` | string | Path to the `.tx3` file under test (default: `./main.tx3`). |

## `[[wallets]]`

Pre-funded wallets for the test. Reference as `@<name>` in transaction args.

| Key | Type | Notes |
| --- | --- | --- |
| `name` | string | Wallet identifier. |
| `balance` | int | Initial Lovelace balance at devnet genesis. |

## `[[transactions]]`

Run in declaration order. Each block exercises one tx.

| Key | Type | Notes |
| --- | --- | --- |
| `description` | string | Human label, shown in the test runner output. |
| `template` | string | Name of a `tx <name>` block in the .tx3 file. |
| `signers` | string[] | Wallet names that must sign. |
| `args` | inline table | Map of tx parameter name to value. Use `@walletname` for addresses. |

## `[[expect]]`

Assertions about a wallet's post-state.

| Key | Type | Notes |
| --- | --- | --- |
| `from` | string | Wallet to inspect (e.g. `@alice`). |

### `[[expect.min_amount]]`

Sub-block — at least one of these must hold for the parent `[[expect]]`.

| Key | Type | Notes |
| --- | --- | --- |
| `amount` | int | Minimum Lovelace balance. |
| `policy` | string | Optional: minimum amount of a specific policy's tokens. |
| `name` | string | Optional: minimum amount of a specific named asset. |

## Worked example

```toml
file = "./main.tx3"

[[wallets]]
name = "bob"
balance = 10000000          # 10 Ada (in Lovelace)

[[wallets]]
name = "alice"
balance = 5000000

[[transactions]]
description = "bob sends 2 Ada to alice"
template = "transfer"
signers = ["bob"]
args = { quantity = 2000000, sender = "@bob", receiver = "@alice" }

[[transactions]]
description = "alice sends 2 Ada to bob"
template = "transfer"
signers = ["alice"]
args = { quantity = 2000000, sender = "@alice", receiver = "@bob" }

[[expect]]
from = "@bob"

[[expect.min_amount]]
amount = 9638899        # net of fees both ways

[[expect]]
from = "@alice"

[[expect.min_amount]]
amount = 4638899
```

## What's not (yet) supported

- Negative assertions (`max_amount`, `not_present`).
- UTxO-set assertions (matching by datum or asset class).
- Time-based assertions (validity windows). Workaround: split into multiple test files with profile-specific slot offsets.

For richer tests today, use a real client SDK (codegen'd) and write integration tests in TypeScript / Rust / Python.
