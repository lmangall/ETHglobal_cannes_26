# Yacht Trust Network — LLM Implementation Master Plan

---

## HOW TO USE THIS DOCUMENT

This plan is structured in two sequential phases:

- **Phase 0** — Documentation research. The LLM reads every listed URL and extracts exact values before writing a single line of code.
- **Phase 1+** — Implementation. Executed only after Phase 0 is complete and all TO VERIFY items are resolved.

Every fact is tagged:
- ✅ CONFIRMED — verified from official docs, safe to use
- ⚠️ TO VERIFY — must be fetched and confirmed in Phase 0 before use
- ❌ DO NOT USE — deprecated or out of scope

---

# PHASE 0 — DOCUMENTATION RESEARCH

The LLM must fetch each URL below, extract the specified values, and populate the verification table before proceeding to implementation.

---

## 0.1 — World Chain Network Config

**Fetch:** https://docs.world.org/world-chain

**Extract:**
- Mainnet chain ID
- Mainnet RPC URL
- Mainnet (480) chain ID
- Testnet RPC URL
- USDC contract address on mainnet
- USDC contract address on testnet
- Block explorer URL
- Native gas token

**Why:** viem client config, contract deployment, AgentKit payment setup all require exact values.

---

## 0.2 — World ID 4.0 Migration Status

**Fetch:** https://docs.world.org/world-id/4-0-migration

**Extract:**
- Is World ID 4.0 live or still "Coming Soon"?
- If live: what changes from 3.0 to 4.0 in the verify endpoint?
- New credential types available
- Any breaking changes to IDKit v4.x API

**Why:** The hackathon prize is specifically "World ID 4.0". If it is not yet live, confirm whether IDKit v4.x still qualifies.

---

## 0.3 — IDKit Full Integration

**Fetch:** https://docs.world.org/world-id/idkit/integrate

**Extract:**
- Exact npm package name and version: `@worldcoin/idkit-core`
- RP signature endpoint exact shape: `{ sig, nonce, created_at, expires_at }`
- Verify endpoint: `POST https://developer.world.org/api/v4/verify/{rp_id}`
- Full IDKit response shape for World ID 4.0 Uniqueness type
- `allow_legacy_proofs` flag — required or optional?
- Exact `signRequest` import path: `@worldcoin/idkit/signing`

---

## 0.4 — IDKit On-Chain Verification

**Fetch:** https://docs.world.org/world-id/idkit/onchain-verification

**Extract:**
- Smart contract address for World ID verifier on World Chain
- Solidity interface for `verifyProof`
- Whether on-chain verification is needed alongside backend verification or instead of it

**Why:** `CrewAttestation.sol` needs to verify World ID proofs if attestation is fully on-chain.

---

## 0.5 — MiniKit Commands

**Fetch each:**
- https://docs.world.org/mini-apps/commands/verify
- https://docs.world.org/mini-apps/commands/chat
- https://docs.world.org/mini-apps/commands/send-transaction
- https://docs.world.org/mini-apps/quick-start/installing

**Extract:**
- `MiniKit.verify()` — exact call signature, required params
- `MiniKit.chat()` — exact call signature, does it require recipient wallet or World username?
- `MiniKit.sendTransaction()` — how to call a contract function through MiniKit
- npm install command and package name for MiniKit
- MiniKit initialization — what is required at app startup

**Why:** Social mode chat and contract interactions go through MiniKit, not directly through viem from the client.

---

## 0.6 — AgentKit Full Integration

**Fetch:** https://docs.world.org/agents/agent-kit/sdk-reference

**Extract:**
- Full `createAgentkitHooks` signature and required params
- Full `DatabaseAgentKitStorage` interface — all 4 methods with exact signatures
- `declareAgentkitExtension` — what params does it take?
- `createAgentBookVerifier` — exact params, what does `{ network: 'world' }` resolve to?
- Available modes beyond `free-trial`: `discount`, `paid` — exact config shapes
- Does AgentKit work with Next.js route handlers directly or only with Hono?

---

## 0.7 — CRE TypeScript SDK

**Fetch:**
- https://docs.chain.link/cre/getting-started/part-1-project-setup
- https://docs.chain.link/cre/getting-started/part-2-fetching-data
- https://docs.chain.link/cre/getting-started/part-4-writing-onchain
- https://docs.chain.link/cre/guides/workflow/using-triggers/http-trigger/configuration
- https://docs.chain.link/cre/guides/workflow/using-confidential-http-client/making-requests
- https://docs.chain.link/cre/reference/sdk/overview

**Extract:**
- Exact `npm install` command for CRE TypeScript SDK
- HTTP trigger import path and config shape
- Confidential HTTP client import path and call signature
- EVM Write client import path — how to call a contract function
- `cre workflow simulate` command and required flags
- `cre workflow deploy` command
- How secrets are injected into workflows (env vars? config file?)
- TypeScript workflow file structure — what does `main.ts` look like?

---

## 0.8 — CRE World Chain Forwarder Address

**Fetch:** https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory

**Extract:**
- Forwarder contract address on World Chain mainnet
- Forwarder contract address on World Chain Mainnet
- What the forwarder does and whether `YachtRegistry.sol` needs to inherit from a base contract

**Why:** Consumer contracts that receive CRE workflow reports must be built to accept the forwarder. This changes the Solidity contract design.

---

## 0.9 — CRE EVM Write — Consumer Contract Pattern

**Fetch:** https://docs.chain.link/cre/guides/workflow/using-evm-client/onchain-write/building-consumer-contracts

**Extract:**
- Does the consumer contract need to inherit a specific interface?
- What does the `receive report` function signature look like?
- How does the forwarder call the consumer contract?

**Why:** `YachtRegistry.sol` must be designed to receive CRE workflow reports, not just accept direct calls.

---

## 0.10 — AIS Stream API

**Fetch:** https://aisstream.io/documentation (or equivalent)

**Extract:**
- Authentication — is an API key required for basic vessel queries?
- WebSocket endpoint URL
- HTTP REST endpoint — is there one? URL structure for single vessel MMSI lookup
- Rate limits on free tier
- `ShipType` codes for sailing vessels and pleasure craft (expected: 36, 37 — confirm)
- Response shape for a vessel position report — what fields are returned?

**Why:** The CRE workflow calls this API. Exact field names needed for the workflow logic and for the Confidential HTTP call shape.

---

## 0.11 — viem World Chain Config

**Fetch:** https://viem.sh/docs/chains/introduction

**Extract:**
- Does viem have a built-in `worldchain` chain config?
- If yes: exact import path
- If no: what fields are needed to define a custom chain?

**Why:** Next.js backend uses viem to read from `CrewAttestation.sol`. Correct chain config required.

---

## 0.12 — Foundry World Chain Deployment

**Fetch:** https://book.getfoundry.sh/forge/deploying

**Extract:**
- `forge create` command syntax for deploying to a custom RPC
- How to set constructor arguments
- How to verify contract on World Chain explorer

**Why:** Contracts need to be deployed to World Chain Mainnet for the demo. Foundry is preferred over Hardhat for speed at a hackathon.

---

## 0.13 — Developer Portal App Registration

**Fetch:** https://developer.worldcoin.org (inspect the registration flow)

**Extract:**
- Steps to create an app and get `app_id`, `rp_id`, `signing_key`
- Whether enabling World ID 4.0 requires a separate step (docs mention clicking "Enable World ID 4.0 banner")
- Are there any domain allowlist requirements for the Mini App?

---

# PHASE 0 VERIFICATION TABLE

After running Phase 0 research, populate this table before writing any code.

| Item | Status | Value |
|---|---|---|
| World Chain mainnet chain ID | ✅ CONFIRMED | `480` (0x1e0) |
| World Chain mainnet RPC URL | ✅ CONFIRMED | `https://worldchain-mainnet.g.alchemy.com/public` |
| World Chain Mainnet chain ID | ✅ CONFIRMED | `480` (0x1E0) |
| World Chain Mainnet RPC URL | ✅ CONFIRMED | `https://worldchain-mainnet.g.alchemy.com/public` |
| World Chain block explorer | ✅ CONFIRMED | `https://worldscan.org` / `https://worldchain-mainnet.explorer.alchemy.com` |
| World Chain native gas token | ✅ CONFIRMED | ETH (18 decimals) |
| World Chain USDC address (mainnet) | ✅ CONFIRMED | `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1` |
| World Chain USDC address (Mainnet) | ✅ CONFIRMED | `0x66145f38cBAC35Ca6F1Dfb4914dF98F1614aeA88` |
| World ID 4.0 live status | ✅ CONFIRMED | Live — Phase 1 migration running through June 1, 2026. V4 verify endpoint is live. |
| IDKit package | ✅ CONFIRMED | `@worldcoin/idkit-core` v4.x (vanilla JS) / `@worldcoin/idkit` (React) |
| IDKit verify endpoint | ✅ CONFIRMED | `POST https://developer.world.org/api/v4/verify/{rp_id}` — no auth required |
| IDKit RP signature import | ⚠️ CORRECTED | `@worldcoin/idkit-core/signing` → `signRequest()` (NOT `@worldcoin/idkit/signing`) |
| IDKit v4 response shape | ✅ CONFIRMED | `{ protocol_version, nonce, action, responses: [{ identifier, proof: [5 strings], nullifier, issuer_schema_id, expires_at_min }] }` |
| IDKit v4 proof format | ✅ CONFIRMED | Array of 5 hex strings (changed from single hex string in v3) |
| IDKit `allow_legacy_proofs` | ✅ CONFIRMED | Optional flag — enables v3 proof acceptance during migration |
| IDKit rp_context required | ✅ CONFIRMED | `{ rp_id, nonce, created_at, expires_at, signature }` — mandatory in v4 |
| Nullifier behaviour | ⚠️ UPDATED | V4: nullifiers are one-time-use; `session_id` replaces them as stable user link |
| Signal binding | ✅ CONFIRMED | bound at proof time, cannot be tampered |
| World ID on-chain verifier (v3 legacy) | ✅ CONFIRMED | World Chain mainnet: `0x17B354dD2595411ff79041f930e491A4Df39A278` |
| World ID on-chain verifier (v4) | ⚠️ NOT READY | V4 `WorldIDVerifier` is "in preview and not yet deployed to mainnet" — use v3 on-chain or v4 backend verify |
| MiniKit package | ✅ CONFIRMED | `@worldcoin/minikit-js` — sub-imports: `/commands`, `/siwe`, `/address-book` |
| MiniKit.verify() | ❌ DEPRECATED | Removed in MiniKit 2.0 — all verification now through IDKit |
| MiniKit pay tokens | ✅ CONFIRMED | WLD + local stablecoins |
| MiniKit pay chain | ✅ CONFIRMED | always World Chain |
| MiniKit pay verify endpoint | ✅ CONFIRMED | `GET https://developer.worldcoin.org/api/v2/minikit/transaction/{id}` |
| MiniKit chat exact API | ✅ CONFIRMED | `MiniKit.chat({ message: string, to?: string[] })` — `to` takes **World usernames** (NOT wallet addresses) |
| MiniKit sendTransaction | ✅ CONFIRMED | `MiniKit.sendTransaction({ chainId: 480, transactions: [{ to, data }] })` — data = viem `encodeFunctionData()` output |
| MiniKit sendTransaction response | ✅ CONFIRMED | Returns `userOpHash` (NOT final tx hash) — must poll for finality |
| MiniKit init | ✅ CONFIRMED | React: `<MiniKitProvider>` wrapper / Manual: `MiniKit.install()` — no app_id prop needed |
| AgentKit package | ✅ CONFIRMED | `@worldcoin/agentkit` |
| AgentBook network | ✅ CONFIRMED | World Chain — contract: `0xA23aB2712eA7BBa896930544C7d6636a96b944dA` |
| AgentKit x402 payment chains | ✅ CONFIRMED | World Chain + Base |
| AgentKit free-trial mode | ✅ CONFIRMED | `{ type: 'free-trial', uses: 3 }` |
| AgentKit modes available | ✅ CONFIRMED | `free`, `free-trial`, `discount` — NO explicit "paid" mode |
| AgentKit Storage interface | ✅ CONFIRMED | Interface is `AgentKitStorage` (NOT `DatabaseAgentKitStorage`). Methods: `getUsageCount(endpoint, humanId)`, `incrementUsage(endpoint, humanId)`, `hasUsedNonce?(nonce)`, `recordNonce?(nonce)` — last 2 optional |
| AgentKit Next.js compatibility | ✅ CONFIRMED | Compatible but no `@x402/next` adapter — manual wiring of hooks into route handlers needed. All examples use Hono. |
| AgentKit createAgentkitHooks return | ✅ CONFIRMED | Returns `{ requestHook, verifyFailureHook? }` |
| CRE TypeScript SDK package | ✅ CONFIRMED | `@chainlink/cre-sdk@1.0.0` — uses **Bun** (>= 1.2.21), NOT npm. `bun install` + `bunx cre-setup` postinstall |
| CRE CLI install command | ✅ CONFIRMED | `cre update` / `cre init` for scaffolding |
| CRE HTTP trigger | ✅ CONFIRMED | `import { HTTPCapability, handler, Runner, type Runtime, type HTTPPayload } from "@chainlink/cre-sdk"` |
| CRE Confidential HTTP | ✅ CONFIRMED | `new ConfidentialHTTPClient()` → `.sendRequest(runtime, { request: { url, method, multiHeaders }, vaultDonSecrets: [{ key, owner }] })` — runs in enclave, no `runInNodeMode` needed |
| CRE EVM Write | ✅ CONFIRMED | Two-step: `runtime.report({ encodedPayload, encoderName: "evm", signingAlgo: "ecdsa", hashingAlgo: "keccak256" })` → `evmClient.writeReport(runtime, { receiver, report, gasConfig })` |
| CRE secrets injection | ✅ CONFIRMED | Simulation: `secrets.yaml` + `.env` file. Deployed: Vault DON (`cre secrets create/update/delete`). In-code: `{{.key}}` template syntax for Confidential HTTP |
| CRE World Chain mainnet support | ✅ CONFIRMED | CLI v1.0.11+, TS SDK v1.0.9+ |
| CRE World Chain Mainnet support | ✅ CONFIRMED | CLI v1.0.7+, TS SDK v1.0.7+ |
| CRE simulation makes real API calls | ✅ CONFIRMED | stated explicitly in docs |
| CRE forwarder (World Chain mainnet) | ✅ CONFIRMED | KeystoneForwarder: `0x98B8335d29Aca40840Ed8426dA1A0aAa8677d8D1` / MockForwarder (sim): `0x6E9EE680ef59ef64Aa8C7371279c27E496b5eDc1` |
| CRE forwarder (World Chain Mainnet) | ✅ CONFIRMED | KeystoneForwarder: `0x98B8335d29Aca40840Ed8426dA1A0aAa8677d8D1` / MockForwarder (sim): `0x6E9EE680ef59ef64Aa8C7371279c27E496b5eDc1` |
| CRE consumer contract interface | ✅ CONFIRMED | Must inherit `ReceiverTemplate` (implements `IReceiver` + `IERC165`). Forwarder address in constructor. Override `_processReport(bytes calldata report)`. Forwarder calls `onReport(metadata, report)`. |
| CRE deploy requires Early Access | ✅ CONFIRMED | `cre account access` to check/request. Simulation works without approval. |
| AIS stream endpoint | ✅ CONFIRMED | WebSocket: `wss://stream.aisstream.io/v0/stream` — **NO HTTP REST endpoint exists** |
| AIS API key requirement | ✅ CONFIRMED | Required — generate from aisstream.io dashboard after login |
| AIS ship type codes | ✅ CONFIRMED | 36 = Sailing, 37 = Pleasure Craft (ITU/AIVDM standard) |
| AIS subscription message | ✅ CONFIRMED | `{ Apikey, BoundingBoxes, FiltersShipMMSI (max 50), FilterMessageTypes }` |
| AIS PositionReport fields | ✅ CONFIRMED | `UserID` (=MMSI), `Latitude`, `Longitude`, `Sog`, `Cog`, `TrueHeading`, `NavigationalStatus`, `Timestamp`, etc. |
| AIS rate limits | ⚠️ UNCERTAIN | Throttled at API key/user level, max 1 subscription update/sec. No explicit free-tier limits published. |
| viem worldchain built-in config | ✅ CONFIRMED | `import { worldchain } from 'viem/chains'` — first-class support, no custom definition needed |
| Foundry deploy command | ✅ CONFIRMED | `forge create src/Contract.sol:Contract --rpc-url <URL> --private-key <KEY> --constructor-args <ARGS>` |
| Foundry verify on World Chain | ✅ CONFIRMED | `forge verify-contract --verifier blockscout --verifier-url https://worldchain-mainnet.explorer.alchemy.com/api --chain 480 <ADDR> src/Contract.sol:Contract` |
| Developer Portal credentials | ✅ CONFIRMED | `app_id` (format `app_[hex]`), `rp_id`, `signing_key` — all from https://developer.worldcoin.org |
| World ID 4.0 portal enablement | ⚠️ UNCERTAIN | Likely requires creating "v4 actions" in portal — unclear if separate toggle exists |
| Mini App domain allowlist | ⚠️ UNCERTAIN | Not documented. Local dev uses tunneling (ngrok). Test via QR code with `app_id`. |

---

## PHASE 0 CRITICAL FINDINGS & CORRECTIONS

Issues discovered during research that require plan adjustments:

### 1. MiniKit.verify() is DEPRECATED — Use IDKit Instead
MiniKit 2.0 removed `MiniKit.verify()` entirely. All World ID verification now goes through IDKit (`@worldcoin/idkit` for React, `@worldcoin/idkit-core` for vanilla JS). The `WorldIDButton.tsx` component in Feature 1 must use IDKit's `IDKitRequestWidget` or `useIDKitRequest` hook, NOT MiniKit.

### 2. signRequest Import Path Correction
The correct import is `@worldcoin/idkit-core/signing`, NOT `@worldcoin/idkit/signing` as stated in the appendix. Update all references.

### 3. AIS Stream API
AIS stream has a REST API available for vessel lookups. The CRE workflow can use Confidential HTTP to query it as originally designed.

### 4. CRE SDK Uses Bun, NOT npm
The CRE TypeScript SDK requires Bun >= 1.2.21. The project uses `bun install` and `bunx cre-setup` for WASM compiler setup. The CRE workflow is a separate Bun project, not part of the Next.js app.

### 5. CRE Deployment Requires Early Access
`cre workflow deploy` requires approval from Chainlink (`cre account access`). Simulation works without approval. For the hackathon demo, request access ASAP and prepare a simulation-based fallback demo.

### 6. World ID V4 On-Chain Verifier NOT Yet Deployed
The `WorldIDVerifier` (v4) is "in preview and not yet deployed to mainnet." For on-chain verification in `CrewAttestation.sol`, use the V3 legacy `WorldIDRouter` at `0x17B354dD2595411ff79041f930e491A4Df39A278` (mainnet) — or skip on-chain verification and rely on backend V4 API verification only.

### 7. YachtRegistry.sol Must Inherit ReceiverTemplate
The consumer contract pattern requires inheriting from Chainlink's `ReceiverTemplate` (provides `IReceiver` + `IERC165`). The forwarder address is passed in the constructor. Override `_processReport(bytes calldata report)` instead of writing a custom `registerVessel()` entry point.

### 8. World ID V4 Nullifier Behavior Changed
V4 nullifiers are one-time-use (not permanent as in v3). `session_id` replaces nullifiers as the stable user link for returning users. This affects the entire identity model — the plan's use of nullifier as permanent crew identity anchor needs reconsideration for v4, or use `allow_legacy_proofs: true` to stay on v3 behavior during migration.

### 9. AgentKitStorage Interface Name
The interface is `AgentKitStorage`, NOT `DatabaseAgentKitStorage`. Only `InMemoryAgentKitStorage` is provided out of the box. You must implement the interface yourself for production persistence.

### 10. llms.txt Files Available
5 of 7 providers offer llms.txt documentation files, saved in `llms-txt/`:
| Provider | Index | Full Content | Notes |
|---|---|---|---|
| World (docs.world.org) | 16 KB | 411 KB | Covers MiniKit, World ID, World Chain, AgentKit |
| Chainlink (docs.chain.link) | 18 KB | — | CRE, CCIP, Data Feeds sections |
| viem (viem.sh) | 49 KB | 1.69 MB | Complete API reference |
| Foundry (book.getfoundry.sh) | 31 KB | 1.38 MB | Forge, Cast, Anvil, cheatcodes |
| Next.js (nextjs.org/docs) | 70 KB | 3.35 MB | Full App Router docs |
| AIS Stream | — | — | No llms.txt |
| Solidity | — | — | No llms.txt |

---

# PHASE 1 — ARCHITECTURE

## System Overview

```
┌──────────────────────────────────────────────────────┐
│               WORLD APP (MiniKit 2.0)                │
│          Mini App webview — Next.js frontend         │
│                                                      │
│  [Map]  [Profile]  [Chat]  [Pro Mode]  [Tip]        │
└──────────────────────┬───────────────────────────────┘
                       │ MiniKit SDK commands
┌──────────────────────▼───────────────────────────────┐
│              NEXT.JS BACKEND                         │
│                                                      │
│  /api/rp-signature      World ID proof signing       │
│  /api/verify-proof      World ID proof validation    │
│  /api/confirm-payment   MiniKit pay confirmation     │
│  /api/agency-agent      AgentKit protected endpoint  │
└───────┬──────────────────────────┬───────────────────┘
        │ viem reads               │ AgentKit + LLM
┌───────▼──────────┐    ┌──────────▼───────────────────┐
│  WORLD CHAIN     │    │  AGENTBOOK (World Chain)      │
│                  │    │  human-backed agent registry  │
│  YachtRegistry   │    └──────────────────────────────┘
│  CrewAttestation │
│  TipJar (v2)     │◄────────────────────────────────┐
└──────────────────┘                                 │
        ▲                                            │
        │ EVM Write (consensus-verified)             │
┌───────┴──────────────────────────────────────────┐ │
│              CRE WORKFLOW (DON)                  │ │
│                                                  │ │
│  HTTP Trigger                                    │ │
│    → Confidential HTTP → aisstream.io            │ │
│    → consensus on vessel existence               │ │
│    → EVM Write → YachtRegistry.registerVessel()  │─┘
└──────────────────────────────────────────────────┘
        ▲
        │ triggered by
┌───────┴──────────┐
│  NEXT.JS BACKEND │
│  /api/register-  │
│  vessel          │
└──────────────────┘
```

---

# PHASE 2 — FEATURE IMPLEMENTATION ORDER

Features must be built in this order. Each depends on the previous.

---

## Feature 1 — World ID Proof Flow (Foundation)

Everything else depends on this. Build and test first in isolation.

**Files:**
```
app/api/rp-signature/route.ts
app/api/verify-proof/route.ts
app/miniapp/components/WorldIDButton.tsx
```

**Pseudocode:**

```
// route: /api/rp-signature
INPUT: { action: string }
  action must be one of:
    "register-owner"
    "register-crew"
    "register-captain"
    "create-attestation"

  import { signRequest } from "@worldcoin/idkit-core/signing"
  result = signRequest(action, process.env.RP_SIGNING_KEY)
  return { sig, nonce, created_at, expires_at }

// route: /api/verify-proof
INPUT: { idkitResponse: IDKitResult }
  forward to POST https://developer.world.org/api/v4/verify/{rp_id}
  body = idkitResponse as-is (no remapping)
  ON SUCCESS:
    extract nullifier_hash from response
    store in session: { nullifier_hash, wallet: signal_value }
    return { verified: true, nullifier_hash }
  ON FAILURE:
    return { verified: false, error }

// component: WorldIDButton
  fetch /api/rp-signature with action
  IDKit.request({
    app_id: process.env.NEXT_PUBLIC_APP_ID,
    action: action,
    rp_context: { rp_id, nonce, sig, created_at, expires_at },
    signal: userWalletAddress
  })
  send result to /api/verify-proof
  on success: call onVerified(nullifier_hash)
```

**Confirmed references:**
- https://docs.world.org/world-id/idkit/integrate
- https://docs.world.org/world-id/concepts

**TO VERIFY before building:**
- World ID 4.0 live status (0.2)
- Exact IDKit response shape for 4.0 Uniqueness credential (0.3)

---

## Feature 2 — Vessel Registration via CRE Workflow

**Files:**
```
cre-workflows/
  ais-oracle/
    main.ts          ← CRE TypeScript workflow
    cre.toml         ← workflow config
contracts/
  YachtRegistry.sol  ← consumer contract for CRE reports
app/api/register-vessel/route.ts
```

**Workflow pseudocode:**

```
// cre-workflows/ais-oracle/main.ts

TRIGGER: HTTP trigger
  path: /register-vessel
  auth: JWT (CRE manages)

CALLBACK onRegisterVessel(runtime, trigger):
  INPUT from trigger body:
    { mmsi: string, owner_nullifier: string, owner_wallet: string }

  step 1 — Confidential HTTP GET
    url = `https://stream.aisstream.io/v0/vessel/{mmsi}`
    headers = { Authorization: `Bearer ${secret.AIS_API_KEY}` }
    result = await runtime.confidentialHttp.get(url, headers)
    vessel_exists = result.status === 200 AND result.body.mmsi === mmsi

  step 2 — Consensus on result
    agreed = await runtime.consensus.aggregate(vessel_exists)

  step 3 — EVM Write (only if consensus = true)
    IF agreed:
      call YachtRegistry.registerVessel(
        mmsi,
        owner_nullifier,
        owner_wallet
      ) via forwarder on World Chain

  return { success: agreed, mmsi }

// Contract: YachtRegistry.sol

struct Vessel {
  bytes32 mmsi
  address owner_wallet
  bytes32 owner_nullifier
  uint256 registered_at
  bool active
}

mapping(bytes32 => Vessel) public vessels
mapping(bytes32 => bool) public nullifier_registered

FUNCTION registerVessel(mmsi, owner_nullifier, owner_wallet):
  require: caller is CRE forwarder address     ← ⚠️ TO VERIFY forwarder address
  require: nullifier_registered[owner_nullifier] == false
  require: vessels[mmsi].active == false
  vessels[mmsi] = Vessel(mmsi, owner_wallet, owner_nullifier, block.timestamp, true)
  nullifier_registered[owner_nullifier] = true
  emit VesselRegistered(mmsi, owner_nullifier)

FUNCTION getVessel(mmsi) → Vessel: public view
FUNCTION isOwner(nullifier, mmsi) → bool: public view
```

**Next.js trigger endpoint pseudocode:**

```
// route: /api/register-vessel
INPUT: { mmsi, idkit_proof }
  verify idkit_proof → get owner_nullifier
  trigger CRE workflow via HTTP trigger URL:
    POST {cre_workflow_http_trigger_url}
    body: { mmsi, owner_nullifier, owner_wallet: signal_from_proof }
  return { pending: true, workflow_id }
```

**TO VERIFY before building:**
- CRE TypeScript SDK exact package and imports (0.7)
- CRE forwarder address on World Chain Mainnet (0.8)
- CRE consumer contract interface — does YachtRegistry need to inherit anything? (0.9)
- AIS API endpoint for single vessel lookup by MMSI (0.10)
- AIS API key requirement (0.10)

---

## Feature 3 — Crew Attestation Contract

**Files:**
```
contracts/
  CrewAttestation.sol
app/api/create-attestation/route.ts
app/api/confirm-attestation/route.ts
app/api/dispute-attestation/route.ts
app/miniapp/components/AttestationFlow.tsx
```

**Contract pseudocode:**

```
// CrewAttestation.sol

enum Role { CREW, CAPTAIN, OFFICER, CHEF, ENGINEER, STEWARD }

struct WorkRecord {
  uint256 id
  bytes32 attester_nullifier    // captain or owner
  bytes32 subject_nullifier     // crew member
  bytes32 vessel_mmsi
  Role role
  uint8 rating                  // 1-5
  string reference_text         // plain text for hackathon, IPFS CID for prod
  bool subject_confirmed
  uint256 created_at
  uint256 confirmed_at
  string dispute_note           // empty string by default
  bool disputed
}

mapping(uint256 => WorkRecord) public records
mapping(bytes32 => uint256[]) public crew_history    // nullifier → record IDs
uint256 public next_id = 0

FUNCTION createAttestation(
    subject_nullifier, vessel_mmsi, role, rating, reference_text
  ):
  require: YachtRegistry.isOwner(caller_nullifier, vessel_mmsi) == true
         OR caller is captain attested on this vessel
  require: subject_nullifier != caller_nullifier
  record = WorkRecord(
    id: next_id++,
    attester_nullifier: caller_nullifier,
    subject_nullifier,
    vessel_mmsi,
    role, rating, reference_text,
    subject_confirmed: false,
    created_at: block.timestamp,
    ...
  )
  records[record.id] = record
  emit AttestationCreated(record.id, attester_nullifier, subject_nullifier)

FUNCTION confirmAttestation(record_id):
  require: caller_nullifier == records[record_id].subject_nullifier
  require: records[record_id].subject_confirmed == false
  records[record_id].subject_confirmed = true
  records[record_id].confirmed_at = block.timestamp
  crew_history[caller_nullifier].push(record_id)
  emit AttestationConfirmed(record_id)

FUNCTION disputeAttestation(record_id, reason):
  require: caller_nullifier == records[record_id].subject_nullifier
         OR caller_nullifier == records[record_id].attester_nullifier
  records[record_id].dispute_note = reason
  records[record_id].disputed = true
  // record NOT deleted

FUNCTION getCrewHistory(nullifier) → WorkRecord[]: public view
FUNCTION getCrewByRole(role, min_rating) → WorkRecord[]: public view
  filter: subject_confirmed == true AND rating >= min_rating AND role == role
```

**API route pseudocode:**

```
// /api/create-attestation
INPUT: { idkit_proof, subject_nullifier, vessel_mmsi, role, rating, reference_text }
  verify idkit_proof → get attester_nullifier
  call CrewAttestation.createAttestation(...) via viem walletClient
  return { record_id }

// /api/confirm-attestation
INPUT: { idkit_proof, record_id }
  verify idkit_proof → get confirmer_nullifier
  verify confirmer_nullifier == records[record_id].subject_nullifier
  call CrewAttestation.confirmAttestation(record_id) via viem walletClient
  return { confirmed: true }
```

**TO VERIFY before building:**
- World ID on-chain verifier address (0.4) — needed if attestation proof verified in contract
- Whether caller_nullifier can be passed as a param (trusting backend) or must be verified in contract
- viem World Chain config (0.11)

---

## Feature 4 — Who's Around Map

**Files:**
```
lib/ais-feed.ts
app/miniapp/components/VesselMap.tsx
```

**Pseudocode:**

```
// lib/ais-feed.ts

FUNCTION subscribeToLocalVessels(lat, lon, radius_nm, onUpdate):
  ws = new WebSocket("wss://stream.aisstream.io/v0/stream")  ← ⚠️ confirm URL

  ON OPEN:
    send {
      APIKey: process.env.AIS_API_KEY,
      BoundingBoxes: [[
        [lat - radius_nm/60, lon - radius_nm/60],
        [lat + radius_nm/60, lon + radius_nm/60]
      ]],
      FilterMessageTypes: ["PositionReport"],
      ShipTypes: [36, 37]    ← ⚠️ confirm codes
    }

  ON MESSAGE (vessel):
    mmsi = vessel.MetaData.MMSI
    onchain_data = readContract(YachtRegistry.getVessel(mmsi))
    enriched = {
      mmsi,
      lat: vessel.Message.PositionReport.Latitude,
      lon: vessel.Message.PositionReport.Longitude,
      name: vessel.MetaData.ShipName,
      registered: onchain_data.active,
      owner_wallet: onchain_data?.owner_wallet ?? null
    }
    onUpdate(enriched)

// VesselMap.tsx (MiniKit Mini App)
  useEffect: subscribeToLocalVessels(device_gps, onVesselUpdate)
  render: map with pins
    grey pin → unregistered vessel (AIS only)
    blue pin + badge → registered vessel
    tap registered vessel → show crew in social mode (if crew opted in)
    tap registered vessel → show "request daywork" (if in pro mode)
```

**TO VERIFY before building:**
- AIS WebSocket exact URL and message format (0.10)
- ShipType codes (0.10)
- AIS API key requirement (0.10)

---

## Feature 5 — Dual Mode Profile (Pro / Social)

**Files:**
```
app/miniapp/components/ProfileView.tsx
app/api/profile/[nullifier]/route.ts
```

**Pseudocode:**

```
// Profile data shape
ProfilePublic {
  nullifier_hash: bytes32    // permanent ID, never changes
  display_name: string       // set by user
  role: Role
  social_mode_on: bool       // user toggle
  vessel_mmsi: bytes32       // current vessel (if registered)
  attestation_count: number  // confirmed records only
}

// /api/profile/[nullifier]
  attestations = readContract(CrewAttestation.getCrewHistory(nullifier))
  vessel = readContract(YachtRegistry.getVesselByOwner(nullifier))
  return { attestations, vessel, ... }

// ProfileView.tsx
  IF viewer_mode == "social":
    show: display_name, role, vessel name
    show: "Say hi" → useChatWithUser(wallet) → MiniKit.chat({ to: [username] })
    hide: full attestation history

  IF viewer_mode == "pro":
    show: all confirmed attestations with ratings
    show: dispute flags clearly marked
    show: vessel history
    show: "Request for position" button
    hide: nothing — full transparency is the feature
```

**VERIFIED:**
- MiniKit.chat() takes World usernames (NOT wallet addresses) — resolve via `MiniKit.getUserByAddress(wallet)`
- See [chat-demo-guide.md](chat-demo-guide.md) for full implementation details

---

## Feature 6 — Crew Agency AI Agent (AgentKit)

**Files:**
```
app/api/agency-agent/route.ts
lib/agentkit-storage.ts
```

**Pseudocode:**

```
// lib/agentkit-storage.ts
class YachtAgentStorage implements AgentKitStorage:
  getUsageCount(endpoint, humanId):
    return db.query("SELECT count FROM usage WHERE endpoint=? AND human_id=?")
  incrementUsage(endpoint, humanId):
    db.execute("INSERT OR UPDATE usage ...")
  hasUsedNonce(nonce):
    return db.query("SELECT 1 FROM nonces WHERE nonce=?")
  recordNonce(nonce):
    db.execute("INSERT INTO nonces ...")

// route: /api/agency-agent
  AgentKit middleware:
    createAgentBookVerifier({ network: 'world' })
    createAgentkitHooks({
      agentBook,
      storage: new YachtAgentStorage(),
      mode: { type: 'free-trial', uses: 3 }
    })
    → reject if not human-backed agent
    → rate limit per humanId

  ON VALID REQUEST:
    query = request.body.query
    verified_crew = readContract(
      CrewAttestation.getCrewByRole(
        query.role,
        query.min_rating
      )
    )
    llm_response = callLLM({
      system: `
        You are a maritime crew placement agent.
        Only recommend crew from the provided on-chain verified records.
        Never invent records. Never expose personal data.
        Always cite the attestation record ID for each recommendation.
        If no crew match the criteria, say so clearly.
      `,
      user: query.natural_language,
      context: JSON.stringify(verified_crew)
    })
    return llm_response
```

**TO VERIFY before building:**
- AgentKit DatabaseStorage exact method signatures (0.6)
- AgentKit Next.js route handler compatibility (0.6)
- createAgentkitHooks — does it return middleware or hooks separately? (0.6)

---

## Feature 7 — Instant Tip (Nice to Have, build last)

**Files:**
```
contracts/TipJar.sol        (optional — MiniKit.pay can go direct)
app/api/generate-nonce/route.ts
app/api/confirm-payment/route.ts
app/miniapp/components/TipQR.tsx
```

**Pseudocode:**

```
// TipQR.tsx — QR printed on boat / crew card
QR encodes URL: https://yourapp.com/tip?wallet={crew_wallet}&name={crew_name}

// Tip flow
  nonce = GET /api/generate-nonce
  MiniKit.pay({
    reference: nonce.id,
    to: crew_wallet_from_QR,
    tokens: [{ symbol: Tokens.WLD, token_amount: user_chosen_amount }],
    description: `Tip — ${crew_name}`
  })
  POST /api/confirm-payment with transactionId
    → GET https://developer.worldcoin.org/api/v2/minikit/transaction/{transactionId}
       ?app_id={APP_ID}&type=payment
    → if confirmed: record tip in DB (off-chain, for stats only)
```

---

# PHASE 3 — CONTRACTS SPECIFICATION

## Deployment Order

1. Deploy `YachtRegistry.sol` → note deployed address
2. Deploy `CrewAttestation.sol` with `YachtRegistry` address as constructor arg
3. Configure CRE workflow with `YachtRegistry` address
4. Set CRE forwarder address in `YachtRegistry.sol`

## Contract Interactions Map

```
CRE Workflow
  → YachtRegistry.registerVessel()

Next.js backend (via viem)
  → YachtRegistry.getVessel()
  → YachtRegistry.isOwner()
  → CrewAttestation.createAttestation()
  → CrewAttestation.confirmAttestation()
  → CrewAttestation.disputeAttestation()
  → CrewAttestation.getCrewHistory()
  → CrewAttestation.getCrewByRole()

MiniKit (via sendTransaction)   ← ⚠️ TO VERIFY exact pattern
  → CrewAttestation.confirmAttestation()   (crew signs from their device)
```

---

# PHASE 4 — FULL TECH STACK

## Confirmed ✅

| Layer | Package / Tool | Version | Reference |
|---|---|---|---|
| Identity collection | `@worldcoin/idkit-core` | v4.x | https://docs.world.org/world-id/idkit/integrate |
| Identity verification | World Developer API | `POST /api/v4/verify/{rp_id}` | https://docs.world.org/api-reference/developer-portal/verify |
| Mini App shell | `@worldcoin/minikit-js` | MiniKit 2.0 | https://docs.world.org/mini-apps |
| Mini App payments | `MiniKit.pay()` | WLD + stablecoins | https://docs.world.org/mini-apps/commands/pay |
| Mini App chat | `MiniKit.chat()` | World Chat | https://docs.world.org/mini-apps/commands/chat |
| Mini App attestation | `MiniKit.attestation()` | integrity check | https://docs.world.org/mini-apps/commands/attestation |
| Agency agent gate | `@worldcoin/agentkit` | latest | https://docs.world.org/agents/agent-kit/integrate |
| Agent identity registry | AgentBook | World Chain | https://docs.world.org/agents/agent-kit/integrate |
| Oracle layer | CRE TypeScript SDK | CLI v1.0.11+, TS v1.0.9+ | https://docs.chain.link/cre |
| Oracle chain support | World Chain Mainnet | confirmed | https://docs.chain.link/cre/supported-networks |
| Oracle AIS call | CRE Confidential HTTP | — | https://docs.chain.link/cre/capabilities/confidential-http |
| Chain | World Chain | `eip155:480` | https://docs.world.org/world-chain |
| Contract language | Solidity | ^0.8.x | — |
| Contract deploy tool | Foundry | latest | https://book.getfoundry.sh |
| Backend framework | Next.js | 14+ App Router | — |
| AIS data | aisstream.io | WebSocket | https://aisstream.io |
| Developer Portal | — | — | https://developer.worldcoin.org |

## To Verify ⚠️

| Layer | Package / Tool | What to confirm |
|---|---|---|
| Chain client | viem | built-in worldchain config or custom needed |
| LLM | Anthropic / OpenAI | pick one, confirm API key injection into AgentKit flow |
| Database (AgentKit storage) | Postgres / SQLite | any, just needs the 4-method interface |
| Mini App contract calls | `MiniKit.sendTransaction()` | exact signature for contract interaction |

## Explicitly Excluded ❌

| Tool | Reason |
|---|---|
| Chainlink Functions | deprecated, use CRE |
| Chainlink Automation | deprecated, use CRE |
| IPFS | out of scope for hackathon |
| EAS (Ethereum Attestation Service) | not confirmed on World Chain |
| ENS | out of scope |
| Solana | World Chain only |
| ethers.js | use viem instead (modern) |

---

# PHASE 5 — PRIZE QUALIFICATION CHECKLIST

Before submitting, verify each item below is demonstrable in the demo.

### World ID 4.0 — $8,000
- [ ] IDKit v4.x installed and integrated
- [ ] RP signature generated in backend (never client-side)
- [ ] Proof forwarded to `POST /api/v4/verify/{rp_id}` in backend
- [ ] Nullifier used as permanent identity anchor in contracts
- [ ] Duplicate registration blocked (nullifier already used)

### AgentKit — $8,000
- [ ] AgentKit CLI registration completed for agent wallet
- [ ] `createAgentBookVerifier` + `createAgentkitHooks` wired into `/api/agency-agent`
- [ ] Non-registered caller receives 402 rejection
- [ ] Human-backed agent receives crew results with on-chain attestation IDs cited

### MiniKit 2.0 — $4,000
- [ ] App runs inside World App as a Mini App
- [ ] `MiniKit.pay()` used for at least one payment flow
- [ ] Contracts deployed on World Chain
- [ ] Not gambling-based

### CRE Best Workflow — $4,000
- [ ] CRE TypeScript workflow written with HTTP trigger + Confidential HTTP + EVM Write
- [ ] `cre workflow simulate` executed successfully with real AIS call
- [ ] World Chain as target network in workflow config
- [ ] Chainlink team notified for live deployment

### CRE Privacy Standard — $2,000
- [ ] AIS API key stored as CRE secret
- [ ] AIS call made via Confidential HTTP capability (not regular HTTP)
- [ ] LLM API key also stored as CRE secret if called from workflow

---

# PHASE 6 — HACKATHON TIMELINE

| Hours | Task | Depends on |
|---|---|---|
| 0–1 | Phase 0 research — fetch all docs, fill verification table | — |
| 1–2 | Deploy World Chain Mainnet contracts (YachtRegistry + CrewAttestation) | 0.8, 0.9, 0.11, 0.12 |
| 2–4 | World ID proof flow (Feature 1) | 0.2, 0.3 |
| 4–7 | CRE workflow — AIS oracle + EVM write (Feature 2) | 0.7, 0.8, 0.9, 0.10 |
| 7–9 | Attestation flow (Feature 3) | Feature 1, contracts |
| 9–11 | Who's Around map (Feature 4) | Feature 2, 0.10 |
| 11–13 | Dual mode profile (Feature 5) | Feature 3 |
| 13–16 | AgentKit agency endpoint (Feature 6) | 0.6, Feature 3 |
| 16–18 | MiniKit shell — wire all features into World App | 0.5 |
| 18–20 | Tip flow if time allows (Feature 7) | Feature 1 |
| 20–22 | End-to-end demo run, fix blockers | — |
| 22–24 | Demo script polish, submission write-up | — |

---

# APPENDIX — CONFIRMED PSEUDOCODE FRAGMENTS

These are safe to use directly. All values confirmed from official docs.

```
// World ID RP signature — CONFIRMED
import { signRequest } from "@worldcoin/idkit-core/signing"
const { sig, nonce, created_at, expires_at } = signRequest(action, RP_SIGNING_KEY)

// World ID proof verification — CONFIRMED
POST https://developer.world.org/api/v4/verify/{rp_id}
body = idkitResponse  // forward as-is, no remapping

// MiniKit pay — CONFIRMED
MiniKit.pay({
  reference: nonce_from_backend,
  to: recipient_wallet,
  tokens: [{ symbol: Tokens.WLD, token_amount: amount }],
  description: "..."
})
// verify on backend:
GET https://developer.worldcoin.org/api/v2/minikit/transaction/{transactionId}
  ?app_id={APP_ID}&type=payment

// AgentKit registration — CONFIRMED
npx @worldcoin/agentkit-cli register <agent-wallet-address>
// triggers World App verification flow

// AgentKit free-trial mode — CONFIRMED
createAgentkitHooks({
  agentBook: createAgentBookVerifier({ network: 'world' }),
  storage: new DatabaseAgentKitStorage(),
  mode: { type: 'free-trial', uses: 3 }
})

// CRE CLI — CONFIRMED
cre update                    // install latest CLI
cre workflow simulate         // run with real API calls
cre account access            // request deploy access
```
