import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { toHex, pad } from "viem";
import { publicClient, getWalletClient } from "@/lib/viem";
import { CREW_ATTESTATION_ADDRESS, crewAttestationAbi } from "@/lib/contracts";

export async function POST(req: NextRequest) {
  const { record_id } = await req.json();

  if (record_id === undefined || record_id === null) {
    return NextResponse.json(
      { error: "record_id is required" },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const callerNullifier = cookieStore.get("wld_nullifier")?.value;
  if (!callerNullifier) {
    return NextResponse.json(
      { error: "Not verified — complete World ID verification first" },
      { status: 401 }
    );
  }

  const walletClient = getWalletClient();
  const callerBytes = pad(toHex(BigInt(callerNullifier)), { size: 32 });

  const hash = await walletClient.writeContract({
    address: CREW_ATTESTATION_ADDRESS,
    abi: crewAttestationAbi,
    functionName: "confirmAttestation",
    args: [BigInt(record_id), callerBytes],
  });

  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  return NextResponse.json({
    confirmed: true,
    tx_hash: hash,
    block_number: Number(receipt.blockNumber),
  });
}
