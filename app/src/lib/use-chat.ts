"use client";

import { useState, useCallback } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

/**
 * Resolve a wallet address to a World username, then open World Chat
 * with a prefilled message via MiniKit.chat().
 */
export function useChatWithUser(walletAddress: string | undefined) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendChat = useCallback(
    async (message: string) => {
      if (!walletAddress) {
        setError("No wallet address available");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Resolve wallet → World username
        const user = await MiniKit.getUserByAddress(walletAddress);
        if (!user?.username) {
          setError("Could not resolve username");
          return;
        }

        await MiniKit.chat({
          message,
          to: [user.username],
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Chat failed");
      } finally {
        setLoading(false);
      }
    },
    [walletAddress]
  );

  return { sendChat, loading, error };
}
