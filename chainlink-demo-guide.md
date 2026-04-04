# Yacht Trust Network — Chainlink CRE Demo Guide

## Elevator Pitch

Maritime vessel verification oracle built with **CRE Workflows + Confidential HTTP + EVM Write** on **World Chain**.
Users register real-world yachts on-chain — the CRE workflow verifies vessel identity via the Datalastic AIS API before writing to the YachtRegistry smart contract.

---

## Architecture

```
User (World Mini App)
  │
  ▼
Next.js API (/api/register-vessel)
  │
  ▼
CRE Workflow (HTTP Trigger)
  │
  ├── 1. runtime.getSecret("AIS_API_KEY")     ← Vault / Confidential
  ├── 2. HTTPClient → Datalastic AIS API      ← Confidential HTTP
  ├── 3. consensusIdenticalAggregation()       ← DON Consensus
  ├── 4. encodeFunctionData (viem)             ← ABI Encode
  ├── 5. runtime.report(prepareReportRequest)  ← Signed Report
  └── 6. EVMClient.writeReport()               ← On-chain Write
          │
          ▼
    YachtRegistry (World Chain Sepolia)
    0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9
```

---

## Chainlink Services Used

| Service | Purpose | Prize Track |
|---------|---------|-------------|
| **CRE Workflows** | Orchestrates the full verification-to-registration pipeline | Best workflow with CRE ($4K) |
| **Confidential HTTP** | API key + request/response data stay private in enclave | Privacy standard ($2K) |
| **EVM Write** | Oracle-signed tx writes verified vessel data on-chain | Connect the World ($1K) |

---

## Run the Simulation

From the repo root:

```bash
cd cre-workflows/ais-oracle
cre workflow simulate .
```

### Broadcast Mode (on-chain)

To actually write the result on-chain (no deploy access needed):

```bash
cre workflow simulate . --target staging-settings --broadcast
```

This submits the signed transaction to World Chain Sepolia via the MockKeystoneForwarder.
Requires `CRE_ETH_PRIVATE_KEY` in `.env` (funded wallet for gas).

**Proven on-chain tx:** [`0x2ea63856d3fa0110b05051f41d1b2df27f3074714447b2830b240a9d3691a68b`](https://worldchain-sepolia.explorer.alchemy.com/tx/0x2ea63856d3fa0110b05051f41d1b2df27f3074714447b2830b240a9d3691a68b)

When prompted for HTTP trigger payload, use any of these real yachts:

### Test Vessels

| Yacht | MMSI | Flag | Length |
|-------|------|------|--------|
| MOONSTONE | 319093200 | — | — |
| HATT MILL | 249036000 | Malta | 46m |
| THUMPER | 229942000 | Malta | 40m |
| ANYA | 215702000 | Malta | 40m |

### Example Payloads

**MOONSTONE:**
```json
{"mmsi":"319093200","owner_nullifier":"0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef","owner_wallet":"0xDC7D67Fc543D3737Fd200B443cE25821501B5caf"}
```

**HATT MILL:**
```json
{"mmsi":"249036000","owner_nullifier":"0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890","owner_wallet":"0xDC7D67Fc543D3737Fd200B443cE25821501B5caf"}
```

**THUMPER:**
```json
{"mmsi":"229942000","owner_nullifier":"0x567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234","owner_wallet":"0xDC7D67Fc543D3737Fd200B443cE25821501B5caf"}
```

**ANYA:**
```json
{"mmsi":"215702000","owner_nullifier":"0xfedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321","owner_wallet":"0xDC7D67Fc543D3737Fd200B443cE25821501B5caf"}
```

### What to expect

1. Workflow compiles to WASM
2. Secret fetched via `runtime.getSecret`
3. Real HTTP call to Datalastic AIS API — vessel data returned
4. Consensus aggregation passes
5. `registerVessel(mmsi, nullifier, wallet)` ABI-encoded
6. Signed report created + EVM write (simulated dry-run, or broadcast on-chain with `--broadcast`)

---

## Deployed Contract

- **YachtRegistry:** [`0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9`](https://worldchain-sepolia.explorer.alchemy.com/address/0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9) on World Chain Sepolia (chain ID 4801)
- Forwarder: `0xDC7D67Fc543D3737Fd200B443cE25821501B5caf` (deployer wallet, used as forwarder for CRE simulation/broadcast)
- `registerVessel()` emits `VesselRegistered` event on-chain
- 8/8 Foundry tests passing

---

## Ask for the Chainlink Team

> I'm building a maritime vessel verification oracle with CRE. My simulation passes end-to-end with real Datalastic API data, and `--broadcast` mode produces real on-chain transactions on World Chain Sepolia. I use Confidential HTTP for private API credentials and EVM Write to World Chain.
>
> I requested deploy access under **l.mangallon@gmail.com** (org **org_d6iylYyvWEMqoZf0**) — can you expedite it so I can do a full DON deployment for the demo?

---

## Key Files

```
cre-workflows/ais-oracle/
├── main.ts              ← Full CRE workflow
├── cre.toml             ← Workflow config (trigger, secrets, target chain+contract)
├── project.yaml         ← RPC endpoints (World Chain Sepolia)
├── workflow.yaml        ← Staging/production workflow config
├── secrets.yaml         ← AIS_API_KEY mapping
├── config.staging.json  ← Gas limit config for --broadcast
├── config.production.json ← Cron schedule (every 30s)
└── .env                 ← API key + CRE_ETH_PRIVATE_KEY for broadcast

contracts/
├── src/YachtRegistry.sol    ← On-chain vessel registry
└── test/YachtRegistry.t.sol ← 8/8 tests
```
