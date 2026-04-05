# Yacht Trust Network — Pitch Guide

Three audiences, three angles. Tailor the pitch to what each cares about.

---

## 1. Chainlink Booth

### Recommended Tracks

**Go for two tracks, not three.** The "Connect the World" track ($1K) overlaps heavily with "Best Workflow" and diluting across three pitches weakens each. Focus on:

| Track | Prize | Why You're Strong |
|-------|-------|-------------------|
| **Best Workflow with CRE** | $2,000 | Full end-to-end workflow: HTTP trigger → real AIS API → consensus → signed report → EVM write to World Chain. Broadcast-verified on-chain. |
| **Best Privacy Standard** | $1,000 | API key fetched via `runtime.getSecret` (never exposed), vessel data flows through Confidential HTTP, sensitive request/response stays in enclave. |

### What to Show

1. Run `cre workflow simulate . --target staging-settings --broadcast` live
2. Point to the on-chain tx (Sepolia proof): [`0x2ea638...`](https://worldchain-sepolia.explorer.alchemy.com/tx/0x2ea63856d3fa0110b05051f41d1b2df27f3074714447b2830b240a9d3691a68b)
3. Walk through `main.ts` — 172 lines, clean pipeline, real external API

### Key Talking Points

- **"We connect real-world maritime data to on-chain identity."** The Datalastic AIS API is a live vessel tracking system — this isn't a toy API. CRE verifies a ship exists before it can be registered.
- **"Confidential HTTP protects our API credentials and vessel data."** The API key never touches the blockchain or user-facing code. Request/response data stays in the enclave.
- **"This is a real use case for CRE."** Maritime registries are opaque, centralized, and expensive. An oracle-verified on-chain registry is a genuine improvement.
- **Why CRE over alternatives:** No other oracle framework gives you confidential HTTP + consensus + EVM write in a single TypeScript workflow. Functions is deprecated, Automation is too simple. CRE is the only way to build this pipeline with privacy guarantees.

### What NOT to Over-Claim

- The MockKeystoneForwarder handles the broadcast, not the full DON. Be upfront: "We're pending deploy access, but broadcast proves the full pipeline works end-to-end including on-chain state changes."
- Don't claim "production-ready" — this is a hackathon prototype with a real architecture.

---

## 2. World Booth

### Recommended Tracks

| Track | Prize | Status |
|-------|-------|--------|
| **Best Use of World ID 4.0** | $4,000 / $2,500 / $1,500 | Implemented — IDKit verification, nullifier-based identity, backend proof validation |
| **Best Use of MiniKit 2.0** | $2,000 / $1,250 / $750 | Implemented — Mini App with MiniKit SDK, contracts on World Chain |

**Skip AgentKit ($8K).** It's not integrated and bolting it on last-minute will look weak. Better to have two strong entries than three weak ones.

### What to Show

1. World ID verification flow in the Mini App (scan → verify → register)
2. Nullifier as permanent identity anchor — same person can't register twice
3. YachtRegistry and CrewAttestation contracts live on World Chain Mainnet
4. Crew reputation system: attestations are tied to World ID nullifiers, not wallets

### Key Talking Points

- **"World ID is the core constraint, not a bolt-on."** Without proof of human, anyone could register fake vessels or spam attestations. The nullifier is the identity anchor for the entire reputation system.
- **"Nullifier uniqueness prevents Sybil attacks."** One human = one vessel registration. One human = one crew identity. This breaks without World ID.
- **"We deploy on World Chain because that's where the users are."** World App users are the target audience — yacht crew looking for verified work history.
- **"Crew attestations create portable, human-verified reputation."** A captain attests to a crew member's work. The crew member confirms. Both are World ID-verified humans. This is reputation that follows you across vessels and employers.

---

## 3. Overall ETHcc Judges

### Elevator Pitch (30 seconds)

> "Yacht Trust Network is a maritime crew reputation platform. Yacht owners register vessels through a Chainlink oracle that verifies them against real-world AIS tracking data. Crew members build verified work histories through mutual attestations — all anchored to World ID so every participant is a proven human. It's LinkedIn for yacht crew, but on-chain and Sybil-resistant."

### Why This Project Matters

- **Real problem:** Maritime crew have no portable reputation. References are informal, unverifiable, and lost between jobs. Yacht owners have no way to verify crew history.
- **Real data:** The Datalastic AIS API provides live vessel tracking for 300K+ ships. This isn't synthetic data.
- **Real identity:** World ID ensures one person = one identity. No fake reviews, no Sybil attacks.
- **Real architecture:** Oracle-verified vessel data + human-verified attestations = trust from both directions.

### Technical Highlights for Judges

- CRE workflow: TypeScript → WASM → consensus → on-chain write (not a simple API call)
- Two smart contracts: YachtRegistry (oracle-fed) + CrewAttestation (human-fed)
- World ID nullifiers as identity primitives throughout
- Privacy: API credentials and vessel data stay confidential via CRE enclave

---

## General Tips

- **Lead with the problem, not the tech.** "Maritime crew have no portable reputation" lands better than "We built a CRE workflow."
- **Show the tx.** An on-chain transaction is worth a thousand slides.
- **Be honest about scope.** This is a hackathon project. The architecture is real, the implementation is focused, and the demo works.
- **Don't read from notes.** Know the three talking points for each audience cold.
