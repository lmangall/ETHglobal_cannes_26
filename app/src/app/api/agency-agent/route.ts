import { NextResponse } from "next/server";
import {
  AGENTKIT,
  createAgentBookVerifier,
  parseAgentkitHeader,
  validateAgentkitMessage,
  verifyAgentkitSignature,
} from "@worldcoin/agentkit";
import { publicClient } from "@/lib/viem";
import { CREW_ATTESTATION_ADDRESS, crewAttestationAbi } from "@/lib/contracts";

const ROLES = ["CREW", "CAPTAIN", "OFFICER", "CHEF", "ENGINEER", "STEWARD"] as const;

// World Chain mainnet AgentBook contract
const AGENTBOOK_WORLD = "0xA23aB2712eA7BBa896930544C7d6636a96b944dA" as `0x${string}`;
const agentBook = createAgentBookVerifier({ contractAddress: AGENTBOOK_WORLD });

// --- AgentKit verification ---

interface VerifyResult {
  humanId: string;
}

async function verifyAgent(request: Request): Promise<VerifyResult | NextResponse> {
  const header = request.headers.get(AGENTKIT);
  if (!header) {
    return NextResponse.json(
      {
        error: "Missing AgentKit header — agent must be registered in AgentBook",
        hint: "Register with: npx @worldcoin/agentkit-cli register <agent-address>",
      },
      { status: 401 }
    );
  }

  let payload;
  try {
    payload = parseAgentkitHeader(header);
  } catch {
    return NextResponse.json({ error: "Invalid AgentKit header" }, { status: 400 });
  }

  const url = new URL(request.url);
  const resourceUri = `${url.origin}${url.pathname}`;

  const validation = await validateAgentkitMessage(payload, resourceUri);
  if (!validation.valid) {
    return NextResponse.json(
      { error: "AgentKit validation failed", detail: validation.error },
      { status: 403 }
    );
  }

  const verification = await verifyAgentkitSignature(payload);
  if (!verification.valid || !verification.address) {
    return NextResponse.json(
      { error: "AgentKit signature invalid", detail: verification.error },
      { status: 403 }
    );
  }

  const humanId = await agentBook.lookupHuman(verification.address, payload.chainId);
  if (!humanId) {
    return NextResponse.json(
      { error: "Agent is not registered in AgentBook — not human-backed" },
      { status: 403 }
    );
  }

  return { humanId };
}

// --- Query parsing ---

interface CrewQuery {
  role: number;
  minRating: number;
  roleLabel: string;
}

function parseCrewQuery(query: string): CrewQuery {
  const q = query.toLowerCase();

  // Match role
  let role = 0; // default: CREW (any)
  let roleLabel = "CREW";
  for (let i = 0; i < ROLES.length; i++) {
    if (q.includes(ROLES[i].toLowerCase())) {
      role = i;
      roleLabel = ROLES[i];
      break;
    }
  }

  // Match minimum rating (e.g., "rated 4+", "4+ stars", "minimum 3", "at least 4")
  let minRating = 1;
  const ratingMatch = q.match(/(?:rated?\s*|minimum\s*|at\s*least\s*|min\s*)(\d)/);
  if (ratingMatch) {
    minRating = Math.min(5, Math.max(1, parseInt(ratingMatch[1])));
  } else {
    const starsMatch = q.match(/(\d)\+?\s*star/);
    if (starsMatch) {
      minRating = Math.min(5, Math.max(1, parseInt(starsMatch[1])));
    }
  }

  return { role, minRating, roleLabel };
}

// --- On-chain query ---

interface CrewResult {
  id: number;
  vesselMmsi: string;
  role: string;
  rating: number;
  referenceText: string;
  confirmed: boolean;
  disputed: boolean;
  createdAt: number;
}

async function queryCrewByRole(role: number, minRating: number): Promise<CrewResult[]> {
  const records = await publicClient.readContract({
    address: CREW_ATTESTATION_ADDRESS,
    abi: crewAttestationAbi,
    functionName: "getCrewByRole",
    args: [role, minRating],
  });

  return (records as Array<{
    id: bigint;
    attesterNullifier: `0x${string}`;
    subjectNullifier: `0x${string}`;
    vesselMmsi: `0x${string}`;
    role: number;
    rating: number;
    referenceText: string;
    subjectConfirmed: boolean;
    createdAt: bigint;
    confirmedAt: bigint;
    disputeNote: string;
    disputed: boolean;
  }>).map((r) => ({
    id: Number(r.id),
    vesselMmsi: r.vesselMmsi,
    role: ROLES[r.role] ?? "UNKNOWN",
    rating: Number(r.rating),
    referenceText: r.referenceText,
    confirmed: r.subjectConfirmed,
    disputed: r.disputed,
    createdAt: Number(r.createdAt),
  }));
}

// --- Route handler ---

export async function POST(request: Request) {
  // Step 1: Verify the calling agent is human-backed via AgentKit
  const result = await verifyAgent(request);
  if (result instanceof NextResponse) return result;

  const { humanId } = result;

  // Step 2: Parse the query
  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body.query;
  if (!query || typeof query !== "string") {
    return NextResponse.json(
      { error: "Missing 'query' field", example: "Find me a captain rated 4+ stars" },
      { status: 400 }
    );
  }

  const parsed = parseCrewQuery(query);

  // Step 3: Query on-chain attestations
  let crew: CrewResult[];
  try {
    crew = await queryCrewByRole(parsed.role, parsed.minRating);
  } catch (err) {
    return NextResponse.json(
      { error: "On-chain query failed", detail: String(err) },
      { status: 502 }
    );
  }

  // Filter to confirmed, non-disputed records only
  const qualified = crew.filter((c) => c.confirmed && !c.disputed);

  // Step 4: Return structured response
  return NextResponse.json({
    agentVerified: true,
    humanId,
    query: {
      original: query,
      parsed: {
        role: parsed.roleLabel,
        minRating: parsed.minRating,
      },
    },
    results: {
      total: qualified.length,
      crew: qualified,
    },
    recommendation:
      qualified.length > 0
        ? `Found ${qualified.length} verified ${parsed.roleLabel.toLowerCase()}(s) rated ${parsed.minRating}+ stars.`
        : `No verified ${parsed.roleLabel.toLowerCase()}s found with ${parsed.minRating}+ star rating.`,
  });
}

// GET returns the AgentKit challenge info for agent discovery
export async function GET() {
  return NextResponse.json({
    service: "Yacht Trust Network — Crew Agency Agent",
    description:
      "AgentKit-protected endpoint for querying verified crew attestations. " +
      "Agents must be registered in AgentBook (human-backed) to access.",
    usage: {
      method: "POST",
      headers: { agentkit: "<base64-encoded AgentKit payload>" },
      body: { query: "Find me a captain rated 4+ stars" },
    },
    roles: ROLES,
    ratingRange: "1-5",
    registration: "npx @worldcoin/agentkit-cli register <agent-address>",
  });
}
