# Workflows

Beyond the SKILL.md command summary — workflows that combine multiple commands.

## Bootstrap and ship a protocol

```sh
trix init -y
# Edit main.tx3 to define your protocol
trix check
trix devnet -b
trix invoke --args-json '{"quantity": 2000000}'
# When happy, generate clients
trix codegen
git add . && git commit -m "initial protocol"
```

## Iterate on a tx

```sh
# Edit main.tx3
trix check                          # fast, parser + analyzer only
trix inspect tir --tx my_new_tx     # see the TIR
trix build -o tii.json              # refresh the interface artifact
trix codegen                        # regenerate clients (only if tii.json changed)
```

## Switch profiles

```sh
trix build -p preview
trix invoke -p preview --args-json '...'
```

The active profile selects: env file, network type, TRP endpoint, and wallets. Swapping profile is enough to retarget from devnet to a public testnet.

## Hook codegen into CI

```yaml
# .github/workflows/check.yml
- name: trix check
  run: trix check
- name: trix build
  run: trix build -o tii.json
- name: codegen
  run: |
    trix codegen
    git diff --exit-code gen/    # fail if codegen drifted
```

## Run a test scenario

```sh
trix test tests/transfer_basic.toml
```

This:
1. Spins up a fresh devnet with the wallets declared in the test file.
2. Runs each `[[transactions]]` block in order.
3. Verifies post-state against `[[expect]]` blocks.

Tests are the cleanest way to lock in behavior — they exercise the full resolve+compile+submit path.

## Use multiple .tx3 files

v0.17 doesn't have an import system. The `[protocol].main` file is the only file `trix` reads. To organize large protocols:
- Keep all definitions in `main.tx3` and use comments / blank lines for sections.
- Or: pre-process — concatenate multiple files at build time before invoking `trix`.

## Resetting devnet

```sh
pkill -f dolos             # if you started it backgrounded
rm -rf .dolos/             # wipe the chain state
trix devnet -b             # restart fresh
```

## When something fails

| Symptom | Likely cause |
| --- | --- |
| `trix check` errors with line/col span | Syntax or analyzer error — load `tx3-language` and read the diagnostic. |
| `trix invoke` hangs after submit | Devnet not running. `pgrep dolos` or `trix devnet -b`. |
| Codegen produces empty output | Missing `[[bindings]]` block or invalid `[bindings.template]`. |
| `trix build -p X` errors on missing env vars | `.env.X` doesn't exist or is missing keys declared in `env { ... }`. |
