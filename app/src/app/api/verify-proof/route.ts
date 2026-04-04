import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  const { idkitResponse } = await req.json();

  const rpId = process.env.NEXT_PUBLIC_RP_ID;
  if (!rpId) {
    return NextResponse.json(
      { error: "RP_ID not configured" },
      { status: 500 }
    );
  }

  const verifyRes = await fetch(
    `https://developer.world.org/api/v4/verify/${rpId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(idkitResponse),
    }
  );

  if (!verifyRes.ok) {
    const error = await verifyRes.text();
    return NextResponse.json({ verified: false, error }, { status: 400 });
  }

  const data = await verifyRes.json();
  const nullifierHash = data.nullifier_hash;

  const cookieStore = await cookies();
  cookieStore.set("wld_nullifier", nullifierHash, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24,
    path: "/",
  });

  return NextResponse.json({ verified: true, nullifier_hash: nullifierHash });
}
