# Crew Attestation — Local Fork Demo Guide

Crew Attestation is a **pure Solidity** reputation system (no Chainlink). Vessel owners and confirmed captains attest crew work records. Subjects confirm or dispute. All identity is anchored to World ID nullifiers.

This guide walks through testing the full flow on a local Anvil fork of World Chain Sepolia.

---

## What is Anvil?

Anvil is Foundry's local Ethereum node (like Hardhat Network / Ganache). With `--fork-url` it clones live chain state into a local instance — you get:

- **Real deployed contracts** (YachtRegistry already on World Chain Sepolia)
- **10 pre-funded accounts** with 10K ETH each (no real gas)
- **Instant blocks** (no waiting for confirmations)
- **Impersonation** — send transactions as any address via `anvil_impersonateAccount`

Fork state is ephemeral: kill anvil and it's all gone.

---

## Prerequisites

- Foundry installed (`~/.foundry/bin/` on PATH)
- Two terminal tabs open

---

## Step 1 — Start Anvil (Terminal 1)

```bash
cd contracts
anvil --fork-url https://worldchain-sepolia.g.alchemy.com/public
```

Leave this running. All subsequent commands go in **Terminal 2**.

---

## Step 2 — Deploy CrewAttestation (Terminal 2)

```bash
cd contracts

# Get creation bytecode + encode constructor arg (YachtRegistry address)
BYTECODE=$(forge inspect src/CrewAttestation.sol:CrewAttestation bytecode)
ARGS=$(cast abi-encode "x(address)" 0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9)

# Deploy (anvil account 0, already unlocked)
cast send \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --unlocked \
  --rpc-url http://127.0.0.1:8545 \
  --create "${BYTECODE}${ARGS:2}"
```

Note the `contractAddress` from output.

> **Why `cast send --create` instead of `forge create`?** Foundry 1.5.1 broke `--private-key` on `forge create`. This workaround uses anvil's unlocked accounts.

---

## Step 3 — Register a Test Vessel

YachtRegistry requires `msg.sender == forwarder`. The forwarder is `0xDC7D67Fc543D3737Fd200B443cE25821501B5caf`. Impersonate it:

```bash
# Unlock the forwarder address
cast rpc anvil_impersonateAccount 0xDC7D67Fc543D3737Fd200B443cE25821501B5caf \
  --rpc-url http://127.0.0.1:8545

# Register HATT MILL (MMSI 249036000)
cast send 0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9 \
  "registerVessel(bytes32,bytes32,address)" \
  $(cast --format-bytes32-string "249036000") \
  0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890 \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --from 0xDC7D67Fc543D3737Fd200B443cE25821501B5caf \
  --unlocked \
  --rpc-url http://127.0.0.1:8545
```

---

## Step 4 — Set Variables

```bash
CREW=<deployed CrewAttestation address from step 2>
OWNER=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890
SUBJECT=0x0000000000000000000000000000000000000000000000000000000000001234
MMSI=$(cast --format-bytes32-string "249036000")
RPC=http://127.0.0.1:8545
```

---

## Step 5 — Create Attestation

Owner attests subject as CREW with rating 4/5:

```bash
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $SUBJECT $MMSI 0 4 "Good deckhand" \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --unlocked --rpc-url $RPC
```

Role enum: `CREW=0, CAPTAIN=1, OFFICER=2, CHEF=3, ENGINEER=4, STEWARD=5`

---

## Step 6 — Confirm Attestation

Subject confirms their work record:

```bash
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" \
  0 $SUBJECT \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --unlocked --rpc-url $RPC
```

Only the subject can confirm. Adds to `crewHistory[subject]`.

---

## Step 7 — Read Crew History

```bash
cast call $CREW "getCrewHistory(bytes32)" $SUBJECT --rpc-url $RPC
```

Decode:

```bash
cast abi-decode \
  "getCrewHistory(bytes32)((uint256,bytes32,bytes32,bytes32,uint8,uint8,string,bool,uint256,uint256,string,bool)[])" \
  <paste raw output>
```

Fields: `(id, attesterNullifier, subjectNullifier, vesselMmsi, role, rating, referenceText, subjectConfirmed, createdAt, confirmedAt, disputeNote, disputed)`

---

## Step 8 — Dispute Attestation

Either party (attester or subject) can dispute once:

```bash
cast send $CREW \
  "disputeAttestation(uint256,bytes32,string)" \
  0 $SUBJECT "Rating was unfair" \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --unlocked --rpc-url $RPC
```

Flags the record (`disputed=true`). Does NOT delete it.

---

## Step 9 — Captain-Can-Attest Flow

A confirmed, undisputed captain on a vessel inherits attestation rights:

```bash
CAPTAIN=0x0000000000000000000000000000000000000000000000000000000000005678
CREW_MEMBER=0x0000000000000000000000000000000000000000000000000000000000009999

# Owner attests captain
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $CAPTAIN $MMSI 1 5 "Great captain" \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --unlocked --rpc-url $RPC

# Captain confirms
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" \
  1 $CAPTAIN \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --unlocked --rpc-url $RPC

# Captain can now attest crew
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $CAPTAIN $CREW_MEMBER $MMSI 0 4 "Reliable crew" \
  --from 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --unlocked --rpc-url $RPC
```

---

## Step 10 — Query by Role

```bash
# All confirmed, undisputed CREW records with rating >= 3
cast call $CREW "getCrewByRole(uint8,uint8)" 0 3 --rpc-url $RPC
```

---

## Revert Scenarios

| Action | Expected Revert |
|--------|----------------|
| Attest with random nullifier (not owner/captain) | `NotAuthorized()` |
| Self-attest (attester == subject) | `CannotAttestSelf()` |
| Rating 0 or 6 | `InvalidRating()` |
| Confirm as non-subject | `NotSubject()` |
| Confirm already confirmed | `AlreadyConfirmed()` |
| Dispute as non-party | `NotParty()` |
| Dispute already disputed | `AlreadyDisputed()` |

---

## Cleanup

Kill anvil in Terminal 1 (`Ctrl+C`). All fork state is gone.

---

## Key Files

```
contracts/
├── src/CrewAttestation.sol  ← Contract (27 Foundry tests)
├── test/CrewAttestation.t.sol

app/
├── src/app/api/create-attestation/route.ts   ← Next.js API routes
├── src/app/api/confirm-attestation/route.ts
├── src/app/api/dispute-attestation/route.ts
├── src/app/miniapp/components/AttestationFlow.tsx ← UI component
└── src/lib/contracts.ts                      ← ABI + addresses
```

## Contract Addresses (World Chain Sepolia)

| Contract | Address |
|----------|---------|
| YachtRegistry | `0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9` |
| CrewAttestation | Not yet deployed on-chain (tested locally via anvil fork) |
