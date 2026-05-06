# Profiles, env files, networks

Profiles let one project target multiple environments — local devnet, preview testnet, mainnet — without code changes. They control three things: env values, network endpoint, and wallets.

## Picking a profile

Most commands take `-p / --profile <name>`. Defaults:
- `trix invoke` → uses the first profile defined in `trix.toml`.
- `trix build` → defaults to no profile (env values must be supplied explicitly).
- `trix devnet` → uses whichever profile has a `[profile.<name>.network]` of type `devnet`.

## Env files

Each profile declares `env_file = ".env.<name>"`. The file is dotenv format:

```
oracle_ref=0xORACLEHASH#0
maximum_amount=1000000
treasury_address=0xTREASURY...
```

Values are typed against the `env { ... }` block in `main.tx3`. Numbers parse as decimal `Int`; bytes as `0x...`; booleans as `true`/`false`; lists as JSON arrays.

If the env file is missing or a declared key is absent, `trix build -p <name>` fails with a clear "missing env var" error pointing at the .tx3 declaration.

### Common pattern: per-profile constants

```tx3
// main.tx3
env {
    oracle_ref: UtxoRef,
    treasury_address: Address,
    maximum_amount: Int,
}
```

```
# .env.preview
oracle_ref=0xPREVIEWORACLE#0
treasury_address=addr_test1...
maximum_amount=1000000

# .env.mainnet
oracle_ref=0xMAINNETORACLE#0
treasury_address=addr1...
maximum_amount=10000000000
```

## Network blocks

```toml
[profile.dev.network]
type = "devnet"
config = "dolos.toml"

[profile.preview.network]
type = "preview"

[profile.mainnet.network]
type = "mainnet"
```

`type = "devnet"` requires a `config` pointing at a Dolos config file; the other types use defaults.

## TRP endpoints

```toml
[profile.dev.trp]
url = "http://localhost:3000/trp"

[profile.preview.trp]
url = "https://preview.trp.tx3.land"
```

`trix invoke` posts the resolved tx to the TRP endpoint, which signs (with the right wallet) and submits.

## Devnet wallets

Wallets in `[[profile.dev.wallets]]` are pre-funded at devnet genesis. They live in `.dolos/wallets/<name>.skey`. Use `@<name>` in `--args-json` to refer to them.

```toml
[[profile.dev.wallets]]
name = "alice"
random_key = true
initial_balance = 3000

[[profile.dev.wallets]]
name = "oracle"
key_file = ".keys/oracle.skey"
initial_balance = 100
```

Two key sources:
- `random_key = true` — fresh keypair generated on devnet start. Lost on `rm -rf .dolos/`.
- `key_file = "..."` — load an existing key (useful for stable test addresses).

## Profile inheritance

There's no inheritance — each profile is fully specified. If you want shared values, put them in the .tx3 file (literals or env defaults) rather than in the profile config.

## Switching the active profile (no command-line flag)

`trix invoke` and `trix build` default to the first profile when `-p` is omitted. Order in `trix.toml` matters; put your local-dev profile first if you want it as default.
