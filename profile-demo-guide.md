# Profile & Demo Data Seeding Guide

The Profile view (Feature 5) reads on-chain attestation data via `/api/profile`. For demos and pitches, you need seeded data so the profile isn't empty.

---

## Quick Test — Profile API

The profile endpoint reads the `wld_nullifier` cookie and queries CrewAttestation on-chain.

```bash
# Test with a specific nullifier (decimal format, as stored in cookie)
curl -b "wld_nullifier=123456789" http://localhost:3000/api/profile
```

Expected response shape:
```json
{
  "nullifier": "123456789",
  "attestationsReceived": [...],
  "attestationsGiven": [...],
  "stats": {
    "totalVoyages": 3,
    "avgRating": 4.3,
    "rolesHeld": ["CAPTAIN", "OFFICER"],
    "vesselMmsis": ["0x..."],
    "yearsExperience": 1,
    "totalAttestationsGiven": 2
  }
}
```

If no cookie → 401. If no attestations → empty arrays with zero stats.

---

## Seeding Demo Data — Anvil Fork

Use this for local demos. Seed multiple crew members with varied roles, ratings, and statuses.

### Step 1 — Start Anvil Fork

```bash
cd contracts
anvil --fork-url https://worldchain-mainnet.g.alchemy.com/public
```

### Step 2 — Set Variables

```bash
RPC=http://127.0.0.1:8545
CREW=0x9437434A19b47c6e4B73a4c78a9921AD9cbCCAEe
REGISTRY=0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9
FORWARDER=0xDC7D67Fc543D3737Fd200B443cE25821501B5caf
SENDER=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Demo identities (nullifiers as bytes32)
OWNER=0x00000000000000000000000000000000000000000000000000000000075bcd15
CAPTAIN_A=0x00000000000000000000000000000000000000000000000000000000deadbeef
OFFICER_B=0x00000000000000000000000000000000000000000000000000000000cafebabe
CHEF_C=0x000000000000000000000000000000000000000000000000000000001234abcd
CREW_D=0x0000000000000000000000000000000000000000000000000000000099887766

# Vessel
MMSI=$(cast --format-bytes32-string "249036000")
```

### Step 3 — Register Vessel

```bash
cast rpc anvil_impersonateAccount $FORWARDER --rpc-url $RPC

cast send $REGISTRY \
  "registerVessel(bytes32,bytes32,address)" \
  $MMSI $OWNER $SENDER \
  --from $FORWARDER --unlocked --rpc-url $RPC
```

### Step 4 — Seed Attestations (Varied Roles & Ratings)

```bash
# Owner attests Captain A — 5 stars
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $CAPTAIN_A $MMSI 1 5 "Outstanding captain, 3 Mediterranean seasons" \
  --from $SENDER --unlocked --rpc-url $RPC

# Captain A confirms (record 0)
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" 0 $CAPTAIN_A \
  --from $SENDER --unlocked --rpc-url $RPC

# Owner attests Officer B — 4 stars
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $OFFICER_B $MMSI 2 4 "Reliable first officer, strong navigation skills" \
  --from $SENDER --unlocked --rpc-url $RPC

# Officer B confirms (record 1)
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" 1 $OFFICER_B \
  --from $SENDER --unlocked --rpc-url $RPC

# Owner attests Chef C — 5 stars
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $CHEF_C $MMSI 3 5 "Michelin-level cuisine, guests loved every meal" \
  --from $SENDER --unlocked --rpc-url $RPC

# Chef C confirms (record 2)
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" 2 $CHEF_C \
  --from $SENDER --unlocked --rpc-url $RPC

# Captain A attests Crew D — 3 stars (captain can attest after being confirmed)
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $CAPTAIN_A $CREW_D $MMSI 0 3 "Solid deckhand, still learning the ropes" \
  --from $SENDER --unlocked --rpc-url $RPC

# Crew D confirms (record 3)
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" 3 $CREW_D \
  --from $SENDER --unlocked --rpc-url $RPC

# Owner attests Crew D again on a different rating — 4 stars (improvement)
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $CREW_D $MMSI 0 4 "Big improvement this season, promoted to lead deck" \
  --from $SENDER --unlocked --rpc-url $RPC

# Crew D confirms (record 4)
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" 4 $CREW_D \
  --from $SENDER --unlocked --rpc-url $RPC

# A disputed record — Owner attests, then disputes
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $CREW_D $MMSI 4 2 "Engineer role trial — did not meet standards" \
  --from $SENDER --unlocked --rpc-url $RPC

cast send $CREW \
  "disputeAttestation(uint256,bytes32,string)" \
  5 $CREW_D "Rating was unfair, only had 1 week of training" \
  --from $SENDER --unlocked --rpc-url $RPC
```

### Step 5 — Verify Seeded Data

```bash
# Check Captain A's history
cast call $CREW "getCrewHistory(bytes32)" $CAPTAIN_A --rpc-url $RPC

# Check Crew D's history (should have 3 records: 2 confirmed, 1 disputed)
cast call $CREW "getCrewHistory(bytes32)" $CREW_D --rpc-url $RPC

# Query all confirmed crew with rating >= 4
cast call $CREW "getCrewByRole(uint8,uint8)" 0 4 --rpc-url $RPC
```

### Step 6 — Test Profile API

Point the Next.js app at the Anvil fork by setting the RPC in `.env.local`:

```env
# Temporarily override for local demo
NEXT_PUBLIC_WORLDCHAIN_RPC=http://127.0.0.1:8545
```

Then test the profile endpoint with seeded nullifiers (convert bytes32 to decimal):

```bash
# Crew D's nullifier 0x99887766 = 2575271782 in decimal
curl -b "wld_nullifier=2575271782" http://localhost:3000/api/profile | jq .

# Captain A's nullifier 0xdeadbeef = 3735928559 in decimal
curl -b "wld_nullifier=3735928559" http://localhost:3000/api/profile | jq .
```

---

## Seeding on World Chain Mainnet (Persistent)

For a live demo against mainnet, use the deployer wallet:

```bash
source contracts/deploy.sh  # loads DEPLOYER_PRIVATE_KEY

RPC=https://worldchain-mainnet.g.alchemy.com/public
CREW=0x9437434A19b47c6e4B73a4c78a9921AD9cbCCAEe

# Same cast send commands as above, but replace:
#   --from $SENDER --unlocked
# with:
#   --private-key $DEPLOYER_PRIVATE_KEY
```

---

## Demo Nullifier ↔ Decimal Reference

| Identity   | Bytes32 (hex)         | Decimal        |
|-----------|----------------------|----------------|
| Owner     | `0x...75bcd15`       | 123456789      |
| Captain A | `0x...deadbeef`      | 3735928559     |
| Officer B | `0x...cafebabe`      | 3405691582     |
| Chef C    | `0x...1234abcd`      | 305441741      |
| Crew D    | `0x...99887766`      | 2575271782     |

---

## Mini App Navigation

The mini app now has a bottom tab bar:
- **Map** tab (default) — vessel positions from Datalastic AIS feed, 3 tile modes (dark/light/satellite)
- **Profile** tab — dual-mode profile with Pro/Social toggle, reads from `/api/profile`

Map tile themes cycle: dark → light → satellite (button bottom-right of map).

---

## Key Files

```
app/src/app/api/profile/route.ts           ← Profile API (GET, reads cookie)
app/src/app/miniapp/components/ProfileView.tsx  ← Full profile (Pro/Social modes)
app/src/app/miniapp/components/ProfileCard.tsx  ← Compact crew card
app/src/app/miniapp/page.tsx               ← Tab navigation (Map + Profile)
```
