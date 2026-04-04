import type { AgentKitStorage } from "@worldcoin/agentkit";

/**
 * In-memory AgentKit storage for demo/hackathon use.
 * Tracks free-trial usage counters and nonce replay protection.
 * Resets on server restart — fine for demos, not production.
 */
const usageCounts = new Map<string, number>();
const usedNonces = new Set<string>();

export const agentKitStorage: AgentKitStorage = {
  async tryIncrementUsage(endpoint: string, humanId: string, limit: number) {
    const key = `${endpoint}:${humanId}`;
    const current = usageCounts.get(key) ?? 0;
    if (current >= limit) return false;
    usageCounts.set(key, current + 1);
    return true;
  },

  async hasUsedNonce(nonce: string) {
    return usedNonces.has(nonce);
  },

  async recordNonce(nonce: string) {
    usedNonces.add(nonce);
  },
};
