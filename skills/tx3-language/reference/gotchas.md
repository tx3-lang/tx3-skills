# Tx3 gotchas (v0.17)

The non-obvious things that most often produce wrong code or confusing errors. Update this file when the upstream `tx3/CHANGELOG.md` ships new "Bug Fixes".

## Typed datum access requires `datum_is: T`

Without it, `input src.field1` fails with a "no field on opaque Bytes" error.

```tx3
// ✅
input src {
    from: MyParty,
    datum_is: MyDatum,
    redeemer: ...,
}
output { datum: src.field1 }

// ❌ src.field1 is undefined
input src {
    from: MyParty,
    redeemer: ...,
}
output { datum: src.field1 }
```

Same applies to `reference` blocks for typed read-only access.

## Record field shadowing (#316, fixed in v0.17)

A parameter named the same as a record field shadows the field during struct construction. To keep the original field's value, qualify it explicitly.

```tx3
type Datum { quantity: Int, price: Int }

tx update(quantity: Int, source_ref: UtxoRef) {
    input source { from: ..., datum_is: Datum, ref: source_ref, redeemer: ... }

    // 🟡 The `quantity` here is the *parameter*, NOT source.quantity
    output {
        to: ...,
        datum: Datum {
            ...source,
            quantity: quantity,         // parameter — shadowing source.quantity
        },
    }

    // ✅ If you wanted to preserve source.quantity, write it out
    output {
        to: ...,
        datum: Datum {
            ...source,
            quantity: source.quantity,
        },
    }
}
```

## Withdrawal redeemer indexing (#317, fixed in v0.17)

`cardano::withdrawal { redeemer: ... }` now compiles with the correct index in the script context. If you were hand-rolling redeemers based on a previous version's behavior, regenerate.

## `reference { ref: ..., datum_is: T }` (added in v0.17, #318)

You can now declare a typed datum on reference UTxOs (e.g. oracles). Before v0.17, you had to consume oracle UTxOs as `input` to get typed access.

```tx3
reference price {
    ref: 0xORACLEHASH#0,
    datum_is: OraclePrice,
}
output { datum: ConsumerDatum { current: price.value } }
```

## Empty `{}` is not an empty map

`{}` parses as an empty struct constructor. The type system has no representation for an empty map at runtime — re-shape your model so the data structure has at least one default key, or use `List<T>` for opt-out cases.

## `metadata` keys must be integers

```tx3
// ✅
metadata { 1: "note", 721: nft_meta }

// ❌
metadata { "label": "value" }
```

This matches CIP-25 / CIP-20 conventions. Use a `type` to wrap richer metadata under a single integer key.

## `validity` uses slots, not POSIX time

```tx3
validity {
    since_slot: tip_slot(),               // current tip
    until_slot: time_to_slot(deadline),   // deadline is POSIX ms
}
```

Mixing the two will silently produce a tx that's valid in the wrong window because `since_slot: 1700000000` (a POSIX timestamp) is some far-future slot.

## Strings >64 bytes in metadata get auto-split

CIP-25 limits string values in metadata to 64 bytes. Tx3 splits longer strings into a list of strings automatically; clients that read the metadata back must reassemble.

## `collateral` is required for any tx with Plutus execution

If a tx has any `cardano::plutus_witness` OR any `input` with a non-`()` redeemer (assuming the input is script-locked), you must include a `collateral` block. The analyzer warns; the chain rejects.

## Outputs without explicit `amount` get auto-balanced

If exactly one output omits `amount`, the resolver makes it the change output. Two outputs missing `amount` is an error.

## `Ada(n)` is `AnyAsset`, not `Int`

```tx3
// ❌ Ada(n) + 5 — type error: AnyAsset + Int
amount: Ada(n) + 5

// ✅
amount: Ada(n + 5)
amount: Ada(n) + Ada(5)
```

## Asset arithmetic aggregates by policy

```tx3
amount: StaticAsset(10) + Ada(40) + StaticAsset(5)
// equivalent to: StaticAsset(15) + Ada(40)
```

Negative quantities of the same policy cancel out (e.g. `StaticAsset(10) - StaticAsset(3)` is `StaticAsset(7)`). The resulting value must have non-negative quantities everywhere or compilation fails.

## `min_utxo(out_name)` requires the output to have a name

```tx3
// ✅
output named { to: ..., amount: Ada(40) + min_utxo(named) }

// ❌ — anonymous output can't be referenced
output { to: ..., amount: Ada(40) + min_utxo(???) }
```

Use named outputs when you need self-references.
