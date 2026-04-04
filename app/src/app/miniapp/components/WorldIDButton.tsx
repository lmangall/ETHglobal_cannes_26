"use client";

import { useState } from "react";
import { IDKit, orbLegacy, IDKitErrorCodes } from "@worldcoin/idkit-core";

interface WorldIDButtonProps {
  action: string;
  signal?: string;
  onVerified: (nullifierHash: string) => void;
}

export function WorldIDButton({
  action,
  signal,
  onVerified,
}: WorldIDButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify() {
    setLoading(true);
    setError(null);
    try {
      // Step 1: Get RP signature from backend
      const sigRes = await fetch("/api/rp-signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!sigRes.ok) {
        throw new Error("Failed to get RP signature");
      }
      const rpSig = await sigRes.json();

      // Step 2: Launch IDKit verification with orbLegacy preset
      const request = await IDKit.request({
        app_id: process.env.NEXT_PUBLIC_APP_ID! as `app_${string}`,
        action,
        rp_context: {
          rp_id: process.env.NEXT_PUBLIC_RP_ID!,
          nonce: rpSig.nonce,
          created_at: rpSig.created_at,
          expires_at: rpSig.expires_at,
          signature: rpSig.sig,
        },
        allow_legacy_proofs: true,
      }).preset(orbLegacy({ signal }));

      const completion = await request.pollUntilCompletion({
        pollInterval: 2_000,
        timeout: 120_000,
      });

      if (!completion.success) {
        if (completion.error === IDKitErrorCodes.Timeout) {
          throw new Error("Verification timed out");
        }
        if (completion.error === IDKitErrorCodes.Cancelled) {
          throw new Error("Verification cancelled");
        }
        throw new Error("Verification failed");
      }

      // Step 3: Verify proof on backend
      const verifyRes = await fetch("/api/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idkitResponse: completion.result }),
      });
      const { verified, nullifier_hash, error: verifyError } =
        await verifyRes.json();

      if (verified) {
        onVerified(nullifier_hash);
      } else {
        throw new Error(verifyError || "Backend verification failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleVerify}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 py-3 text-white font-medium disabled:opacity-50"
      >
        {loading ? "Verifying..." : "Verify with World ID"}
      </button>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
