# AIS Oracle — CRE Workflow

Chainlink CRE workflow that verifies yacht identity via the Datalastic AIS API and writes to YachtRegistry on World Chain Mainnet.

## Run Simulation

```bash
bun install
cre workflow simulate .
```

## Broadcast (on-chain write)

```bash
cre workflow simulate . --target staging-settings --broadcast
```

Requires `CRE_ETH_PRIVATE_KEY` and `AIS_API_KEY` in `.env`.

See [../../chainlink-demo-guide.md](../../chainlink-demo-guide.md) for full demo walkthrough and test payloads.
