# Expressions and built-ins

## Operators

| Operator | Types | Notes |
| --- | --- | --- |
| `+` | `Int + Int`, `AnyAsset + AnyAsset` | Asset addition aggregates by policy. |
| `-` | `Int - Int`, `AnyAsset - AnyAsset` | |
| `*` | `Int * Int`, `AnyAsset * Int`, `Int * AnyAsset` | Multiplication; scales asset quantities. Binds tighter than `+`/`-`. |
| `++` | `Bytes ++ Bytes`, `List<T> ++ List<T>` | Concatenation. |
| `!` | `! Bool` | Logical not. |
| `.field` | record / `AnyAsset` / `UtxoRef` | Property access. |
| `[i]` | `List<T>[Int]`, `Map<K,V>[K]` | Indexing. |
| `T { ... }` | record/variant constructor | See struct construction below. |

Tx3 has no comparison operators (`<`, `>`, `==`) in `tx` bodies — control flow is fixed at compile time. You parameterise behaviour through tx parameters and let validators do runtime checks.

## Built-in functions

```tx3
Ada(n)                             // n Lovelace as AnyAsset(<ada policy>, "", n)
AnyAsset(policy, name, qty)        // arbitrary multi-asset value
StaticAsset(qty)                   // shorthand: declared `asset Name = ...` becomes Name(qty)
fees                               // implicit fee value (use in outputs to leave room for fees)
tip_slot()                         // current chain tip slot at resolve-time
slot_to_time(slot)                 // slot → POSIX milliseconds
time_to_slot(time)                 // POSIX milliseconds → slot
min_utxo(out_name)                 // min Lovelace required for a named output
concat(a, b, ...)                  // bytes/list concatenation; same as `++`
```

`tip_slot()`, `slot_to_time`, and `time_to_slot` evaluate at resolve-time using the current protocol parameters; they're not constants.

## Struct construction with spread

```tx3
output {
    to: MyParty,
    amount: ...,
    datum: MyRecord {
        ...source,                 // copy all fields from `source`
        field1: new_value,         // override one
        field5: { 1: "x" },        // and another
    },
}
```

The spread (`...source`) and explicit field overrides are merged at construction time. If a parameter has the same name as a record field, the parameter shadows the field — write `...source, field: source.field` if you intended to keep the original.

## Numeric literals

- Decimal: `42`, `-1`, `1_000_000`
- Underscores allowed as digit separators: `1_000` and `1000` are equivalent.
- No hex/octal/binary literals for `Int` — use `Bytes` if you want to express raw bits.

## Bytes literals

- Hex: `0xDEADBEEF` (lowercase or uppercase, even number of digits)
- String: `"hello"` is interpreted as the UTF-8 bytes
- Concat: `0xAB ++ "rest"` works (both sides become `Bytes`)

## Lists and maps

```tx3
[1, 2, 3]                          // List<Int>
[a, b, c]                          // empty type inferred from context
[1, 2, source.field1]              // mix of literals and references

{1: "a", 2: "b"}                   // Map<Int, Bytes>
{ name: "x", count: 1 }            // ⚠️ this parses as a struct constructor, not a map
```

The map/struct ambiguity at empty `{}` and at single-name keys means: prefer integer keys for maps, and avoid bare `name:` in map literals.

## UtxoRef literals

```tx3
0xABCDEF#0                         // tx hash 0xABCDEF, output index 0
0xABCDEF#1
```

The `#index` suffix is part of the literal, not an operator.
