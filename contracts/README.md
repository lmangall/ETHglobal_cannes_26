# Contracts — Yacht Trust Network

Solidity contracts deployed on World Chain Sepolia (chain ID 4801).

## Contracts

| Contract | Address | Tests |
|----------|---------|-------|
| YachtRegistry | `0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9` | 8/8 |
| CrewAttestation | `0x408B8eb461E41070eEEE3c6d02E89500C94ce7c5` | 27/27 |

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
