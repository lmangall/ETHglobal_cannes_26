import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { pad, toHex, fromHex } from "viem";
import { publicClient } from "@/lib/viem";
import {
  CREW_ATTESTATION_ADDRESS,
  YACHT_REGISTRY_ADDRESS,
  crewAttestationAbi,
  yachtRegistryAbi,
} from "@/lib/contracts";

const ROLES = ["CREW", "CAPTAIN", "OFFICER", "CHEF", "ENGINEER", "STEWARD"] as const;

interface AttestationRecord {
  id: number;
  attesterNullifier: string;
  subjectNullifier: string;
  vesselMmsi: string;
  role: string;
  rating: number;
  referenceText: string;
  subjectConfirmed: boolean;
  createdAt: number;
  confirmedAt: number;
  disputeNote: string;
  disputed: boolean;
}

export async function GET() {
  const cookieStore = await cookies();
  const nullifier = cookieStore.get("wld_nullifier")?.value;
  if (!nullifier) {
    return NextResponse.json(
      { error: "Not verified — complete World ID verification first" },
      { status: 401 }
    );
  }

  const nullifierBytes = pad(toHex(BigInt(nullifier)), { size: 32 });

  // Query crew history and vessel ownership in parallel
  const [crewHistoryRaw, vesselData] = await Promise.all([
    publicClient.readContract({
      address: CREW_ATTESTATION_ADDRESS,
      abi: crewAttestationAbi,
      functionName: "getCrewHistory",
      args: [nullifierBytes],
    }).catch(() => [] as unknown[]),
    // Check a few common MMSIs for ownership — in production this would be an indexed query
    // For now we return vessel data if found in attestation history
    Promise.resolve(null),
  ]);

  // Parse attestation records
  const history = crewHistoryRaw as Array<{
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
  }>;

  const attestations: AttestationRecord[] = (history ?? []).map((r) => ({
    id: Number(r.id),
    attesterNullifier: r.attesterNullifier,
    subjectNullifier: r.subjectNullifier,
    vesselMmsi: r.vesselMmsi,
    role: ROLES[r.role] ?? "UNKNOWN",
    rating: Number(r.rating),
    referenceText: r.referenceText,
    subjectConfirmed: r.subjectConfirmed,
    createdAt: Number(r.createdAt),
    confirmedAt: Number(r.confirmedAt),
    disputeNote: r.disputeNote,
    disputed: r.disputed,
  }));

  // Separate attestations given vs received
  const received = attestations.filter((a) => a.subjectNullifier === nullifierBytes);
  const given = attestations.filter((a) => a.attesterNullifier === nullifierBytes);

  // Compute stats
  const confirmedReceived = received.filter((a) => a.subjectConfirmed && !a.disputed);
  const avgRating =
    confirmedReceived.length > 0
      ? confirmedReceived.reduce((sum, a) => sum + a.rating, 0) / confirmedReceived.length
      : 0;

  // Unique roles held
  const rolesHeld = [...new Set(received.map((a) => a.role))];

  // Unique vessels worked on
  const vesselMmsis = [...new Set(received.map((a) => a.vesselMmsi))];

  // Years of experience (from earliest attestation to now)
  const earliest = received.reduce(
    (min, a) => (a.createdAt < min && a.createdAt > 0 ? a.createdAt : min),
    Math.floor(Date.now() / 1000)
  );
  const yearsExperience =
    received.length > 0
      ? Math.max(1, Math.round((Date.now() / 1000 - earliest) / (365.25 * 86400)))
      : 0;

  return NextResponse.json({
    nullifier,
    attestationsReceived: received,
    attestationsGiven: given,
    stats: {
      totalVoyages: confirmedReceived.length,
      avgRating: Math.round(avgRating * 10) / 10,
      rolesHeld,
      vesselMmsis,
      yearsExperience,
      totalAttestationsGiven: given.length,
    },
  });
}
