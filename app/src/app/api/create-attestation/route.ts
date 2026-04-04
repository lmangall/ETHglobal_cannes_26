import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { toHex, pad } from "viem";
import { publicClient, getWalletClient } from "@/lib/viem";
import { CREW_ATTESTATION_ADDRESS, crewAttestationAbi } from "@/lib/contracts";

const ROLES = ["CREW", "CAPTAIN", "OFFICER", "CHEF", "ENGINEER", "STEWARD"] as const;

export async function POST(req: NextRequest) {
  const { subject_nullifier, vessel_mmsi, role, rating, reference_text } =
    await req.json();

  // Validate inputs
  if (!subject_nullifier || !vessel_mmsi || role === undefined || !rating) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const roleIndex = typeof role === "string" ? ROLES.indexOf(role as typeof ROLES[number]) : role;
  if (roleIndex < 0 || roleIndex > 5) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  if (rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Rating must be 1-5" }, { status: 400 });
  }

  // Get attester nullifier from verified session cookie
  const cookieStore = await cookies();
  const attesterNullifier = cookieStore.get("wld_nullifier")?.value;
  if (!attesterNullifier) {
    return NextResponse.json(
      { error: "Not verified — complete World ID verification first" },
      { status: 401 }
    );
  }

  const walletClient = getWalletClient();

  const attesterBytes = pad(toHex(BigInt(attesterNullifier)), { size: 32 });
  const subjectBytes = pad(toHex(BigInt(subject_nullifier)), { size: 32 });
  const mmsiBytes = pad(toHex(BigInt(vessel_mmsi)), { size: 32 });

  const hash = await walletClient.writeContract({
    address: CREW_ATTESTATION_ADDRESS,
    abi: crewAttestationAbi,
    functionName: "createAttestation",
    args: [
      attesterBytes,
      subjectBytes,
      mmsiBytes,
      roleIndex,
      rating,
      reference_text || "",
    ],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return NextResponse.json({
    success: true,
    tx_hash: hash,
    block_number: Number(receipt.blockNumber),
  });
}
