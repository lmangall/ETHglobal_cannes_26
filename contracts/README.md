# Contracts — Yacht Trust Network

Solidity contracts deployed on World Chain Mainnet (chain ID 480).

## Contracts

| Contract | Address | Tests |
|----------|---------|-------|
| YachtRegistry | `0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9` | 8/8 |
| CrewAttestation | `0x9437434A19b47c6e4B73a4c78a9921AD9cbCCAEe` | 27/27 |

## Build & Test

```bash
forge build
forge test -vv
```

## Deploy

```bash
bash deploy.sh
```

See [../crew-attestation-demo-guide.md](../crew-attestation-demo-guide.md) for local fork testing with Anvil.
