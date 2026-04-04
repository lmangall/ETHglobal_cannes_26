import { createPublicClient, createWalletClient, http } from "viem";
import { worldchain } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";

export const publicClient = createPublicClient({
  chain: worldchain,
  transport: http(),
});

export function getWalletClient() {
  const key = process.env.DEPLOYER_PRIVATE_KEY;
  if (!key) throw new Error("DEPLOYER_PRIVATE_KEY not set");

  const account = privateKeyToAccount(key as `0x${string}`);
  return createWalletClient({
    account,
    chain: worldchain,
    transport: http(),
  });
}
