# Transaction sub-blocks

A `tx Name(params) { ... }` body is a free-form sequence of these sub-blocks. Order doesn't matter for semantics; group related blocks together for readability.

## `locals { name: expr, ... }`

Compute reusable values once.

```tx3
locals {
    full_amount: Ada(quantity) + min_utxo(out),
    label: concat("user-", quantity),
}
```

Local names are visible in any block in the same `tx`.

## `input <name> { ... }`

Specifies a UTxO to consume.

```tx3
input source {
    from: MyParty,                        // required: party or address
    datum_is: MyRecord,                   // optional: enables typed `source.field` access
    min_amount: Ada(10),                  // optional: filter UTxOs by minimum amount
    redeemer: MyRedeemer { ... },         // required for script-locked UTxOs
    ref: 0xABC#0,                         // optional: use a specific UTxO ref instead of resolving
}
```

`input * 3 { ... }` (with a `*N` multiplier) consumes N matching UTxOs. Without `datum_is`, the input's datum is opaque `Bytes`.

If `from` is a [policy](./top-level) that carries a `ref`, that reference-script UTxO is added to the transaction's reference inputs automatically — no separate `reference` block needed.

## `reference <name> { ... }`

A read-only UTxO reference (CIP-31 / CIP-32).

```tx3
reference oracle {
    ref: 0xORACLEHASH#0,
    datum_is: OraclePrice,                // typed access: oracle.price, oracle.timestamp
}
```

Use for inline scripts and oracle data. Reference UTxOs are not consumed.

## `collateral { ... }`

Funds Plutus execution failures. Required if the tx has any Plutus witness.

```tx3
collateral {
    ref: 0xMYUTXO#0,
}
```

Or:

```tx3
collateral {
    from: MyParty,
    min_amount: Ada(5),
}
```

## `output <name>? { ... }`

Produces a UTxO. Name is optional but enables references like `min_utxo(named)`.

```tx3
output payment {
    to: MyParty,                          // required: party or address
    amount: Ada(40) + StaticAsset(10),    // required: total value
    datum: MyDatum { field1: 1 },         // optional: inline datum
}
```

For multi-output txs, repeat the block. To create change automatically, omit one output's amount and the resolver will fill it.

## `mint { ... }` / `burn { ... }`

Create or destroy tokens.

```tx3
mint {
    amount: StaticAsset(100),
    redeemer: (),                         // required for Plutus policies; () for native scripts
}

burn {
    amount: StaticAsset(50),
    redeemer: MyRedeemer::Burn,
}
```

Multiple mint/burn blocks aggregate by policy — a tx that mints and burns the same asset will net out. If the minted or burned asset's policy carries a `ref`, that reference-script UTxO is added to the transaction's reference inputs automatically.

## `validity { ... }`

```tx3
validity {
    since_slot: tip_slot(),               // valid from current tip
    until_slot: validUntil,               // valid until this slot
}
```

Both fields optional individually but at least one required. Slots, not POSIX time — convert with `time_to_slot(t)` if you have a wall-clock time.

## `signers { ... }`

```tx3
signers {
    MyParty,
    Buyer,
    0x0F5B22E57FEEB5B4FD1D501B007A427C56A76884D4978FAFEF979D9C,
}
```

List of parties or 28-byte pubkey hashes. Required for native scripts and any tx the wallet must sign.

## `metadata { ... }`

CIP-25 / CIP-721 transaction metadata. Keys must be integers.

```tx3
metadata {
    1: "human-readable note",
    721: NftMetadata { name: ..., image: ... },
}
```

Strings longer than 64 bytes are auto-split per CIP-25.

## `cardano::*` blocks

Chain-specific extensions. See `cardano.md` for the full set.

## Order independence

The parser accepts blocks in any order. The analyzer treats each kind as a collection (e.g. all `input`s are gathered) so nothing breaks if you write `output` before `input`. Conventional order: `locals` → `reference` → `collateral` → `input` → `output` → `mint`/`burn` → `cardano::*` → `validity` → `signers` → `metadata`.
