# Top-level definitions

A `.tx3` file contains only top-level items — there are no imports, no functions, no module system in v0.17. Items can appear in any order; the analyzer resolves names by full-file scope.

## `env { ... }`

Typed configuration. Fields are populated at resolve-time from `.env.<profile>` files (managed by `trix`). Inside a `tx`, env fields are referenced by bare name.

```tx3
env {
    field_a: Int,
    field_b: Bytes,
    field_c: Bool,
    field_d: List<Bytes>,
}
```

Field types must be primitives or `List<T>` of primitives — no nested records in `env` (v0.17). `env` may appear at most once per file.

## `party Name;`

A declared participant. Resolved at runtime to a wallet address or a script address depending on profile config. Used as `from:` / `to:` in inputs and outputs and in `signers`.

```tx3
party MyParty;
party Buyer;
party Vault;
```

Parties are bare declarations — no parameters, no body. Their actual addresses are bound by the resolver.

## `policy Name = ...;`

A minting / spending policy. Two forms:

```tx3
// Hash only — sufficient when the policy is referenced via reference script or witness
policy OnlyHashPolicy = 0xABCDEF1234;

// Full definition — when the policy must be inlined or otherwise self-described
policy FullyDefinedPolicy {
    hash: 0xABCDEF1234,
    script: 0xABCDEF1234,
    ref: 0xABCDEF1234,
}
```

`hash` is the policy hash. `script` is the script bytes (Plutus or native). `ref` is a UTxO ref where the script lives as a reference script (CIP-31). Use the block form when you want Tx3 to resolve `ref:` to a `cardano::publish`'d UTxO automatically.

## `asset Name = policy."asset_name";`

A named token. Binds a (policy, asset_name) pair to an identifier so you can write `MyToken(qty)` instead of `AnyAsset(0x..., "MYTOKEN", qty)`.

```tx3
asset StaticAsset = 0xABCDEF1234."MYTOKEN";
```

The asset name (between the quotes) is treated as bytes; non-ASCII names should be hex-escaped as `\xNN`.

Once declared, use as a constructor:

```tx3
mint { amount: StaticAsset(100), redeemer: () }
```

## `type Name { ... }`

Declares a record type:

```tx3
type MyRecord {
    field1: Int,
    field2: Bytes,
    field3: Bytes,
    field4: List<Int>,
    field5: Map<Int, Bytes>,
}
```

Used for datums and redeemers. Fields are constructed with `MyRecord { field1: ..., field2: ..., ... }`. Spread is supported: `MyRecord { ...source, field1: new_value }`.

Or declares a variant (sum type):

```tx3
type MyVariant {
    Case1 {
        field1: Int,
        field2: Bytes,
    },
    Case2,
    Case3 { only: Int },
}
```

Variants are constructed with `MyVariant::Case1 { field1: ..., field2: ... }` or just `MyVariant::Case2` for unit cases.

## `type Name = OtherType;`

Type alias.

```tx3
type Lovelace = Int;
type Beneficiaries = List<Address>;
```

Aliases participate in type checking by structural identity — `Lovelace` is interchangeable with `Int` everywhere.

## `tx Name(params...) { ... }`

Transaction template. Detailed in `tx-blocks.md`.

```tx3
tx swap(buyer: Address, qty: Int) {
    input ...
    output ...
}
```

Parameters are typed and become arguments at resolve-time (passed via `--args-json` to `trix invoke`).
