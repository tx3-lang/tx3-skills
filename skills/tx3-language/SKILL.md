---
name: tx3-language
description: Authoring guide for the Tx3 transaction DSL. Covers top-level definitions (env, asset, party, policy, type), tx blocks (input, output, mint, burn, reference, validity, signers, metadata, locals, collateral), the type system (records, variants, lists, maps), Cardano-specific constructs (cardano::withdrawal, cardano::plutus_witness, cardano::native_witness, cardano::treasury_donation, certificates), and expression syntax. Trigger when reading or writing .tx3 files, on Tx3 syntax errors, when modeling a Cardano transaction in Tx3, or when the user asks about Tx3 keywords/syntax.
license: Apache-2.0
---

# Tx3 language

Tx3 is a declarative DSL for **transaction templates** that compile to chain-specific transaction bytes. It is **not** a smart-contract language — Plutus/Aiken still author the on-chain validators; Tx3 specifies how off-chain transactions are constructed to interact with them. The current backend is Cardano; protocols compile via `tx3-cardano` to a CBOR transaction body.

## Preflight

If MCP tools `mcp__tx3__tx3_*` are not available in this session, the `tx3-mcp` binary isn't on `PATH`. Run `which tx3-mcp` — if missing, instruct the user to install [`tx3up`](https://github.com/tx3-lang/tx3up) and run `tx3up`. Without MCP you can still answer language questions from this skill, but you cannot validate code.

## File anatomy

A `.tx3` file contains only top-level items. There are no imports, no functions, no module system in v0.17. Items can appear in any order:

- `env { ... }` — typed configuration values usable inside any tx block
- `party Name;` — declared participant (wallet, script, or contract)
- `policy Name = 0x...;` or `policy Name { hash, script, ref }` — minting/spending policies
- `asset Name = policy_hash."asset_name";` — named assets bound to a policy
- `type Name { ... }` — records (with named fields) or variants (sum types)
- `type Name = OtherType;` — type aliases
- `tx Name(params...) { ... }` — transaction templates

## Top-level definitions

```tx3
env {
    field_a: Int,
    field_b: Bytes,
    field_c: Bool,
    field_d: List<Bytes>,
}

party MyParty;

type MyRecord {
    field1: Int,
    field2: Bytes,
    field4: List<Int>,
    field5: Map<Int, Bytes>,
}

type MyVariant {
    Case1 { field1: Int, field2: Bytes },
    Case2,
}

policy OnlyHashPolicy = 0xABCDEF1234;
policy FullyDefinedPolicy {
    hash: 0xABCDEF1234,
    script: 0xABCDEF1234,
    ref: 0xABCDEF1234,
}

asset StaticAsset = 0xABCDEF1234."MYTOKEN";
```

`env` fields are populated at resolve-time from a profile's `.env.<profile>` file. `policy` accepts either an inline hash or a `{ hash, script, ref }` block (use the latter when the policy needs a reference script). Variants can have either a record body (`{ ... }`) or be unit-only.

## The `tx` block

```tx3
tx swap(quantity: Int, validUntil: Int) {
    input source { from: ..., datum_is: ..., min_amount: ..., redeemer: ... }
    reference name { ref: ..., datum_is: ... }     // optional
    collateral { ref: ..., min_amount: ... }       // optional
    output named { to: ..., amount: ..., datum: ... }
    mint { amount: ..., redeemer: ... }            // any number; same shape for burn
    burn { amount: ..., redeemer: ... }
    validity { since_slot: ..., until_slot: ... }  // optional
    signers { Party1, 0xPubKeyHash, ... }          // optional
    metadata { 1: ..., 2: ..., ... }               // optional
    locals { name: expr, ... }                     // optional
    cardano::* { ... }                             // any number; see "Cardano-specific" below
}
```

Sub-block summary (full reference: `reference/tx-blocks.md`):

| Block | Required fields | Notes |
| --- | --- | --- |
| `input <name>` | `from` | `datum_is: T` enables typed datum field access on the consumed UTxO. `redeemer` required for script inputs. `*N` multiplier and `ref` for reference UTxOs. |
| `reference <name>` | `ref` | UTxO consumed for read-only context. `datum_is: T` for typed access. |
| `collateral` | one of `ref` / `from` | Funds plutus exec failure. Optional but required when the tx has any plutus_witness. |
| `output <name>?` | `to`, `amount` | `datum:` optional. Name is optional but lets later blocks refer to it (e.g. `min_utxo(named)`). |
| `mint` / `burn` | `amount` | `redeemer` required when the policy is a Plutus script. Multiple blocks aggregate. |
| `validity` | `since_slot` and/or `until_slot` | Slots, not POSIX time. Use `tip_slot()` for "now". |
| `signers` | list | Parties or 28-byte pubkey hashes. Required for native scripts and for any tx the wallet must sign. |
| `metadata` | `<int>: <value>` pairs | Strings >64 bytes are split per CIP-25. |
| `locals` | `name: expr` pairs | Computed once; reusable in this tx. |
| `cardano::<X>` | varies | See next section. |

## Type system

Primitives:

- `Int` — arbitrary-precision integer (wire type is i128)
- `Bytes` — hex literal (`0x...`) or string interpreted as UTF-8 bytes
- `Bool` — `true` / `false`
- `Address` — 28-byte pubkey hash or full bech32 address
- `AnyAsset` — `(policy: Bytes, name: Bytes, qty: Int)` triple; properties: `.policy`, `.asset_name`, `.amount`
- `UtxoRef` — UTxO pointer; literal syntax is `0x<txhash>#<output_index>`. Properties: `.tx_hash`, `.output_index`
- `Unit` / `()` — empty redeemer

Compound:

- `List<T>` — `[1, 2, 3]`; index with `list[0]`
- `Map<K, V>` — `{1: "a", 2: "b"}`; index with `map[key]`. Note: empty `{}` parses as an empty struct constructor, not an empty map — provide at least one entry.
- Record types — declared with `type T { field: Type, ... }`; constructed with `T { field: value, ... }`
- Variant types — declared with `type T { Case1 { fields }, Case2, ... }`; constructed with `T::Case1 { ... }`

For details on data expressions (operators, struct spread, builtins), see `reference/expressions.md`.

## Cardano-specific blocks

All have a `cardano::` prefix and may appear any number of times in a tx:

| Block | Fields | Purpose |
| --- | --- | --- |
| `cardano::withdrawal` | `from: Address`, `amount: Int`, `redeemer?` | Withdraw staking rewards. `redeemer` required for script-controlled stake credentials. |
| `cardano::stake_delegation_certificate` | `pool: Bytes`, `stake: Address` | Delegate stake to a pool. |
| `cardano::vote_delegation_certificate` | `drep: Bytes`, `stake: Address` | Delegate Conway-era voting rights to a DRep. |
| `cardano::plutus_witness` | `version: Int`, `script: Bytes` | Attach an inline Plutus script witness (when not using a reference script). |
| `cardano::native_witness` | `script: Bytes` | Attach a native script witness. |
| `cardano::publish` | `to: Address`, `amount`, optional `datum`, `version`, `script` | Publish a script as a reference (CIP-31). |
| `cardano::treasury_donation` | `coin: Int` | Donate to the protocol treasury. |

Full per-block syntax in `reference/cardano.md`.

## Expressions and built-ins

```tx3
Ada(40)                                    // Lovelace amount as AnyAsset
AnyAsset(policy, name, qty)                // arbitrary token amount
StaticAsset(qty)                           // shorthand for a declared `asset`
fees                                       // implicit fee value (in outputs)
tip_slot()                                 // current chain tip slot
slot_to_time(slot)  /  time_to_slot(t)     // slot ↔ POSIX ms conversion
min_utxo(out_name)                         // min Lovelace for an output
concat(a, b, ...)                          // bytes/list concatenation; use `++` operator too
```

Operators: `+`, `-`, `*` (numeric and asset arithmetic; `*` scales an `AnyAsset` by an `Int` and binds tighter than `+`/`-`), `++` (concat), `!` (negate), `.field` (property access), `[index]` (list/map access).

Struct construction supports spread: `T { ...source, field: value }` copies fields from `source` and overrides `field`.

## Common gotchas

These are the things that are non-obvious and most-frequently break user code:

1. **Typed datum access requires `datum_is: T`**. If you read fields off `input` or `reference`, you must declare the datum type — `input src { from: P, datum_is: MyDatum, ... }` and then `src.field1` works. Without `datum_is`, datum is opaque `Bytes`.
2. **Record field shadowing**: a parameter named `field1` will shadow a same-named field when constructing the record. To use the field's existing value, prefix with the source: `... source.field1`. This was tightened in v0.17 (#316).
3. **Withdrawal redeemer indexing**: `cardano::withdrawal { redeemer: ... }` compiles correctly only when withdrawals are listed in deterministic order. Don't assume your hand-rolled redeemer indices match if you're cross-referencing CBOR. Fixed in v0.17 (#317).
4. **Empty maps**: `{}` is a struct constructor with no fields, not an empty map. If you need an empty map, the type system requires at least one entry — re-think the model.
5. **Output names are referable**: `output named { ... }` can be referenced later via `named` (e.g. for `min_utxo(named)`). Anonymous outputs can't.
6. **Validity uses slots, not POSIX time**: convert with `time_to_slot()` if your input is a wall-clock time. The slot ↔ time relationship requires the chain's protocol parameters and is set during resolve.
7. **`metadata` keys are integers** (CIP-25 conventions); string keys are not allowed.
8. **`collateral` is required if any plutus_witness or input redeemer exists** — Cardano demands collateral for any tx with Plutus execution.

More gotchas: `reference/gotchas.md`.

## Where to look

- Worked examples: call MCP `mcp__tx3__tx3_examples_list` to see all 10 bundled examples, then `mcp__tx3__tx3_example_get` with a name (e.g. `lang_tour` for a complete syntax tour).
- Deeper reference per topic:
  - `reference/top-level.md` — env, party, policy, asset, type
  - `reference/tx-blocks.md` — every sub-block with full syntax
  - `reference/types.md` — type system details
  - `reference/cardano.md` — every `cardano::*` block
  - `reference/expressions.md` — operators, builtins, spread, type coercions
  - `reference/gotchas.md` — surprises beyond the SKILL.md list

## Working with projects

If the user is working in a directory with `trix.toml` (a Tx3 project managed by `trix`), also load the **`tx3-project`** skill — it covers the project layout, profiles, env files, codegen, and the `trix` CLI workflow.

## Validating your edits

After writing or editing a `.tx3` file, call `mcp__tx3__tx3_check` with `{ "path": "<absolute path>" }` to surface parse and analyze diagnostics. Each diagnostic carries `severity`, `message`, `code`, optional `help`, and `spans[]` with `start_line`/`start_col` — quote those when offering fixes.
