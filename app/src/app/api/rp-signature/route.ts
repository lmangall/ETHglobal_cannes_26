import { NextRequest, NextResponse } from "next/server";
import { signRequest } from "@worldcoin/idkit-core/signing";

const VALID_ACTIONS = [
  "register-owner",
  "register-crew",
  "register-captain",
  "create-attestation",
] as const;

type Action = (typeof VALID_ACTIONS)[number];

export async function POST(req: NextRequest) {
  const { action } = (await req.json()) as { action: string };

  if (!VALID_ACTIONS.includes(action as Action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const rpSigningKey = process.env.RP_SIGNING_KEY;
  if (!rpSigningKey) {
    return NextResponse.json(
      { error: "RP_SIGNING_KEY not configured" },
      { status: 500 }
    );
  }

  const { sig, nonce, createdAt, expiresAt } = signRequest({
    action,
    signingKeyHex: rpSigningKey,
  });

  return NextResponse.json({
    sig,
    nonce,
    created_at: createdAt,
    expires_at: expiresAt,
  });
}
