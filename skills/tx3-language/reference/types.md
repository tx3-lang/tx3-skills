# Type system

## Primitives

| Type | Wire | Literals | Notes |
| --- | --- | --- | --- |
| `Int` | i128 | `42`, `-1`, `1_000_000` | Arbitrary-precision in semantics; serialized as i128. |
| `Bool` | bool | `true`, `false` | |
| `Bytes` | Vec\<u8> | `0xDEADBEEF`, `"hello"` | Hex literal or string-as-UTF-8. Concat with `++` or `concat(...)`. |
| `Address` | Vec\<u8> | bech32 `addr1...` or `0xPubKeyHash` | 28-byte payment key hash for parties, full address for outputs. |
| `AnyAsset` | (Bytes, Bytes, Int) | `AnyAsset(policy, name, qty)` | Properties: `.policy`, `.asset_name`, `.amount`. |
| `UtxoRef` | (Bytes, Int) | `0xTXHASH#OUTPUT_INDEX` | Properties: `.tx_hash`, `.output_index`. |
| `Unit` | () | `()` | Empty redeemer. |

## Compounds

### `List<T>`

```tx3
[1, 2, 3, source.field1]
```

Index with `list[i]`. Concat with `++` or `concat(a, b)`.

### `Map<K, V>`

```tx3
{ 1: "Value1", 2: "Value2" }
```

Index with `map[key]`. **An empty `{}` parses as an empty struct constructor, not an empty map.** If you need an empty map, the type system requires at least one entry — re-shape your model.

### `Tuple<T1, ..., Tn>`

Fixed-arity, positionally-typed product; each position can have a different type. **Arity is always ≥ 2.**

```tx3
type Datum {
    pair: Tuple<Int, Bytes>,
    triple: Tuple<Int, Bytes, Bool>,
}

// Construct: two-or-more comma-separated exprs in parentheses
(42, 0xFF)
(quantity, name, true)
```

- `(e)` is **grouping**, not a one-tuple; `()` is `Unit`. Tuples need ≥ 2 elements.
- Index with `tuple[i]` where `i` is an **integer literal in range**; the result has that position's type. A tuple cannot be indexed by a runtime value (positions have different types), and an out-of-range index is a compile error. There is no `.0`/`.1` syntax — the `.` postfix is for named fields, and `.<number>` would collide with the `policy.asset_name` separator in `asset` definitions.
- Equivalence is structural, ordered, and arity-sensitive: `Tuple<Int, Bytes>` ≠ `Tuple<Bytes, Int>` ≠ `Tuple<Int, Bytes, Bool>`.

### Records

```tx3
type MyRecord {
    field1: Int,
    field2: Bytes,
    field3: List<Int>,
}

// Construct
MyRecord { field1: 1, field2: 0xAB, field3: [1, 2, 3] }

// With spread
MyRecord { ...source, field1: new_value }
```

Field order in construction doesn't matter; all fields must be set unless using spread.

### Variants

```tx3
type Action {
    Open { collateral: Int },
    Close,
    Transfer { recipient: Address, amount: Int },
}

// Construct
Action::Open { collateral: 100 }
Action::Close
Action::Transfer { recipient: MyParty, amount: 50 }
```

## Type aliases

```tx3
type Lovelace = Int;
type Beneficiaries = List<Address>;
```

Aliases are structurally identical to their RHS — fully interchangeable.

## Type coercion

Tx3 does not auto-coerce. Each function/operator has a signature; mismatches are reported by the analyzer with a span pointing at the offending expression.

Common cases:

- `Bytes` literal `0xAB` and `Address` are both bytes but distinct types — pass an `Address` field where `Bytes` is expected by spelling it out.
- `Ada(n)` returns `AnyAsset`, not `Int`. Use `Int` arithmetic separately and wrap in `Ada(...)` at the boundary.
- Arithmetic on assets aggregates by policy: `Ada(40) + StaticAsset(10)` yields a value with both entries.

## Datums and redeemers

Inputs and references can declare a typed datum:

```tx3
input src {
    from: MyParty,
    datum_is: OracleDatum,
    redeemer: ConsumeAction::Spend,
}

// Now src.field is a typed projection of the consumed UTxO's datum
output { to: MyParty, amount: Ada(src.amount), datum: ... }
```

Without `datum_is`, the datum is opaque `Bytes` — you cannot dot-access fields. Add `datum_is` whenever you read into the datum, even if the type is a single field.
