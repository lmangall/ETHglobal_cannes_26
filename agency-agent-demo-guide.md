# Feature 6 — Crew Agency AI Agent (AgentKit)

AgentKit-protected API endpoint that lets human-backed AI agents query on-chain crew attestations.

## Architecture

```
AI Agent (registered in AgentBook)
  → POST /api/agency-agent  { agentkit header + query }
  → AgentKit verification (parse → validate → verify signature → AgentBook lookup)
  → On-chain getCrewByRole(role, minRating) via viem
  → Structured crew recommendations
```

## Key Files

- `app/src/app/api/agency-agent/route.ts` — AgentKit-protected POST endpoint + GET discovery
- `app/src/lib/agentkit-storage.ts` — In-memory storage for free-trial counters and nonce replay
- `app/src/lib/contracts.ts` — CrewAttestation ABI with `getCrewByRole`
- `app/src/lib/viem.ts` — Public client on World Chain Mainnet

## Prize Qualification

This feature targets the **World AgentKit prize** ($20K pool):
- Integrates `@worldcoin/agentkit` SDK
- Uses `createAgentBookVerifier` to resolve agent wallets → anonymous human IDs
- Uses `parseAgentkitHeader` + `validateAgentkitMessage` + `verifyAgentkitSignature` (low-level helpers)
- Distinguishes human-backed agents from bots — core AgentKit requirement

## API Reference

### GET /api/agency-agent

Returns service discovery info (no auth required).

```bash
curl http://localhost:3000/api/agency-agent
```

Response:
```json
{
  "service": "Yacht Trust Network — Crew Agency Agent",
  "description": "AgentKit-protected endpoint for querying verified crew attestations...",
  "roles": ["CREW", "CAPTAIN", "OFFICER", "CHEF", "ENGINEER", "STEWARD"],
  "ratingRange": "1-5",
  "registration": "npx @worldcoin/agentkit-cli register <agent-address>"
}
```

### POST /api/agency-agent

Requires AgentKit header. Query crew by role and minimum rating.

```bash
curl -X POST http://localhost:3000/api/agency-agent \
  -H "Content-Type: application/json" \
  -H "agentkit: <base64-encoded-agentkit-payload>" \
  -d '{"query": "Find me a captain rated 4+ stars"}'
```

Response (authenticated):
```json
{
  "agentVerified": true,
  "humanId": "0xabc...def",
  "query": {
    "original": "Find me a captain rated 4+ stars",
    "parsed": { "role": "CAPTAIN", "minRating": 4 }
  },
  "results": {
    "total": 2,
    "crew": [
      {
        "id": 1,
        "vesselMmsi": "0x...",
        "role": "CAPTAIN",
        "rating": 5,
        "referenceText": "Excellent captain, 10 years experience",
        "confirmed": true,
        "disputed": false,
        "createdAt": 1712188800
      }
    ]
  },
  "recommendation": "Found 2 verified captain(s) rated 4+ stars."
}
```

Response (no AgentKit header):
```json
{
  "error": "Missing AgentKit header — agent must be registered in AgentBook",
  "hint": "Register with: npx @worldcoin/agentkit-cli register <agent-address>"
}
```

## Testing Without a Registered Agent

For demo purposes, test the unauthenticated paths:

```bash
# 1. Service discovery (always works)
curl http://localhost:3000/api/agency-agent | jq

# 2. Without AgentKit header → 401
curl -X POST http://localhost:3000/api/agency-agent \
  -H "Content-Type: application/json" \
  -d '{"query": "Find me an engineer"}' | jq

# 3. With invalid header → 400
curl -X POST http://localhost:3000/api/agency-agent \
  -H "Content-Type: application/json" \
  -H "agentkit: invalid-base64" \
  -d '{"query": "Find me a chef rated 3+ stars"}' | jq
```

## Query Examples

The natural language parser extracts role and minimum rating:

| Query | Parsed Role | Min Rating |
|-------|-------------|------------|
| "Find me a captain rated 4+ stars" | CAPTAIN | 4 |
| "I need an engineer with minimum 3 rating" | ENGINEER | 3 |
| "Looking for a chef" | CHEF | 1 |
| "Any crew rated 5 stars" | CREW | 5 |
| "Need a steward at least 4" | STEWARD | 4 |

## Agent Registration Flow

For a real agent to access this endpoint:

1. Generate an agent wallet (any EVM keypair)
2. Register in AgentBook: `npx @worldcoin/agentkit-cli register <agent-address>`
3. Complete World App verification (links wallet to human identity)
4. Sign requests with the registered wallet and include the `agentkit` header
5. The endpoint verifies: signature → AgentBook lookup → human ID resolution

## Seeding Test Data on Mainnet

The agency-agent endpoint reads from World Chain Mainnet. You need on-chain attestations for queries to return results.

### Step 1 — Set Variables

```bash
source contracts/deploy.sh  # loads DEPLOYER_PRIVATE_KEY

RPC=https://worldchain-mainnet.g.alchemy.com/public
CREW=0x9437434A19b47c6e4B73a4c78a9921AD9cbCCAEe
REGISTRY=0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9

# Demo identities (nullifiers as bytes32)
OWNER=0x00000000000000000000000000000000000000000000000000000000075bcd15
CAPTAIN_A=0x00000000000000000000000000000000000000000000000000000000deadbeef
OFFICER_B=0x00000000000000000000000000000000000000000000000000000000cafebabe
CHEF_C=0x000000000000000000000000000000000000000000000000000000001234abcd
CREW_D=0x0000000000000000000000000000000000000000000000000000000099887766

MMSI=$(cast --format-bytes32-string "249036000")
PK=$DEPLOYER_PRIVATE_KEY
```

### Step 2 — Check if Vessel is Already Registered

```bash
cast call $REGISTRY "getVessel(bytes32)" $MMSI --rpc-url $RPC
```

If it returns zeroes, the vessel needs to be registered via the CRE workflow or forwarder. If already registered, skip to Step 3.

### Step 3 — Seed Attestations

```bash
# Owner attests Captain A — 5 stars
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $CAPTAIN_A $MMSI 1 5 "Outstanding captain, 3 Mediterranean seasons" \
  --private-key $PK --rpc-url $RPC

# Captain A confirms (record 0)
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" 0 $CAPTAIN_A \
  --private-key $PK --rpc-url $RPC

# Owner attests Officer B — 4 stars
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $OFFICER_B $MMSI 2 4 "Reliable first officer, strong navigation" \
  --private-key $PK --rpc-url $RPC

# Officer B confirms (record 1)
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" 1 $OFFICER_B \
  --private-key $PK --rpc-url $RPC

# Owner attests Chef C — 5 stars
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $OWNER $CHEF_C $MMSI 3 5 "Michelin-level cuisine, guests loved every meal" \
  --private-key $PK --rpc-url $RPC

# Chef C confirms (record 2)
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" 2 $CHEF_C \
  --private-key $PK --rpc-url $RPC

# Captain A attests Crew D — 4 stars
cast send $CREW \
  "createAttestation(bytes32,bytes32,bytes32,uint8,uint8,string)" \
  $CAPTAIN_A $CREW_D $MMSI 0 4 "Solid deckhand, promoted to lead deck" \
  --private-key $PK --rpc-url $RPC

# Crew D confirms (record 3)
cast send $CREW \
  "confirmAttestation(uint256,bytes32)" 3 $CREW_D \
  --private-key $PK --rpc-url $RPC
```

### Step 4 — Verify Seeded Data

```bash
# Query captains rated 4+ → should return Captain A
cast call $CREW "getCrewByRole(uint8,uint8)" 1 4 --rpc-url $RPC

# Query all crew rated 3+ → should return Crew D
cast call $CREW "getCrewByRole(uint8,uint8)" 0 3 --rpc-url $RPC

# Query chefs rated 5 → should return Chef C
cast call $CREW "getCrewByRole(uint8,uint8)" 3 5 --rpc-url $RPC
```

Role enum: `CREW=0, CAPTAIN=1, OFFICER=2, CHEF=3, ENGINEER=4, STEWARD=5`

## End-to-End Demo Flow

After seeding, this is the full demo sequence:

```bash
# 1. Service discovery
curl http://localhost:3000/api/agency-agent | jq

# 2. Bot blocked (no AgentKit header)
curl -s -X POST http://localhost:3000/api/agency-agent \
  -H "Content-Type: application/json" \
  -d '{"query": "Find me a captain rated 4+ stars"}' | jq

# 3. Invalid agent blocked
curl -s -X POST http://localhost:3000/api/agency-agent \
  -H "Content-Type: application/json" \
  -H "agentkit: not-valid" \
  -d '{"query": "Find me a captain"}' | jq

# 4. Verify data exists on-chain (cast, bypassing AgentKit for demo)
cast call 0x9437434A19b47c6e4B73a4c78a9921AD9cbCCAEe \
  "getCrewByRole(uint8,uint8)" 1 4 \
  --rpc-url https://worldchain-mainnet.g.alchemy.com/public

# 5. Show the code — verification pipeline in route.ts:22-68
```

### Pitch Talking Points

1. **"Bots can't access crew data"** — show the 401/400 rejections
2. **"Only human-backed agents pass"** — walk through the 4-step verification: parse → validate → verify signature → AgentBook lookup
3. **"Real on-chain data"** — the cast call proves attestations are live on World Chain
4. **"Privacy preserved"** — agents see ratings and roles, never real identities (nullifier-based)

See also [crew-attestation-demo-guide.md](crew-attestation-demo-guide.md) for the Anvil fork flow and [profile-demo-guide.md](profile-demo-guide.md) for the full seeding reference.
