import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { mmsi, owner_wallet } = await req.json();

  if (!mmsi || typeof mmsi !== "string") {
    return NextResponse.json({ error: "mmsi is required" }, { status: 400 });
  }

  if (!owner_wallet || typeof owner_wallet !== "string") {
    return NextResponse.json(
      { error: "owner_wallet is required" },
      { status: 400 }
    );
  }

  // Read nullifier_hash from httpOnly cookie set by /api/verify-proof
  const cookieStore = await cookies();
  const nullifierHash = cookieStore.get("wld_nullifier")?.value;

  if (!nullifierHash) {
    return NextResponse.json(
      { error: "Not verified — complete World ID verification first" },
      { status: 401 }
    );
  }

  const creUrl = process.env.CRE_WORKFLOW_TRIGGER_URL;
  if (!creUrl) {
    return NextResponse.json(
      { error: "CRE_WORKFLOW_TRIGGER_URL not configured" },
      { status: 500 }
    );
  }

  // Trigger CRE workflow via HTTP
  const creRes = await fetch(creUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      mmsi,
      owner_nullifier: nullifierHash,
      owner_wallet,
    }),
  });

  if (!creRes.ok) {
    const error = await creRes.text();
    return NextResponse.json(
      { error: "CRE workflow trigger failed", details: error },
      { status: 502 }
    );
  }

  return NextResponse.json({ pending: true, mmsi });
}
