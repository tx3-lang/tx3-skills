# Cardano-specific blocks

All blocks below are namespaced `cardano::*` and may appear any number of times within a `tx`.

## `cardano::withdrawal`

Withdraw staking rewards from a stake credential.

```tx3
cardano::withdrawal {
    from: MyParty,                        // stake address
    amount: 100,                          // in Lovelace
    redeemer: (),                         // required if stake credential is script-controlled
}
```

For pubkey stake credentials, omit `redeemer` (or use `()`). For script-controlled stake credentials, `redeemer` is mandatory and the witness is supplied by `cardano::plutus_witness` or a referenced script.

## `cardano::stake_delegation_certificate`

Delegate a stake credential to a stake pool.

```tx3
cardano::stake_delegation_certificate {
    pool: 0xPOOL_ID_HASH,
    stake: 0xSTAKE_KEY_HASH,
}
```

## `cardano::vote_delegation_certificate`

Conway-era: delegate voting rights to a DRep (delegated representative).

```tx3
cardano::vote_delegation_certificate {
    drep: 0xDREP_ID,
    stake: 0xSTAKE_KEY_HASH,
}
```

## `cardano::plutus_witness`

Attach an inline Plutus script witness when the script isn't supplied via a reference UTxO.

```tx3
cardano::plutus_witness {
    version: 2,                           // 1=PlutusV1, 2=PlutusV2, 3=PlutusV3
    script: 0xSCRIPT_BYTES,
}
```

Prefer `reference` blocks pointing at a published script (CIP-31) when possible — inline witnesses bloat the tx. Use `cardano::plutus_witness` only when the script isn't published.

## `cardano::native_witness`

Attach a native script witness.

```tx3
cardano::native_witness {
    script: 0xNATIVE_SCRIPT_BYTES,
}
```

Native scripts are Cardano's pre-Plutus simple multisig / time-lock language.

## `cardano::publish`

Publish a script as a reference UTxO so other transactions can use `reference { ref: ... }` instead of inlining the script.

```tx3
cardano::publish my_script_ref {
    to: MyParty,                          // address that will hold the reference UTxO
    amount: Ada(min_utxo(my_script_ref)),
    version: 2,                           // optional; required if script is supplied
    script: 0xSCRIPT_BYTES,               // optional; either inline bytes or `ref:` from a policy
}
```

The published reference UTxO can be consumed normally to clean it up later, but typically it's left at the address indefinitely.

## `cardano::treasury_donation`

Donate to the protocol treasury.

```tx3
cardano::treasury_donation {
    coin: 500,                            // Lovelace amount
}
```

This is a one-way transfer — the funds become unspendable. Rare in user-facing protocols; mostly used by foundations/grants.

## What's NOT yet supported

- Stake registration / deregistration certificates (use `trix` directly via TRP for now).
- Pool registration certificates.
- Governance action proposals (Conway).
- Multi-asset minting via reference scripts in a single block (workaround: split into multiple `mint` blocks).

If you need any of these, the workaround is to construct the tx with the Cardano CLI or through `trix invoke` against a hand-crafted JSON, rather than expressing it in Tx3.
