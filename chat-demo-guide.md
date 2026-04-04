# World Chat Integration — Demo Guide

MiniKit.chat() opens World App native chat with a prefilled message. Used for crew-to-crew, viewer-to-owner, and captain-to-crew messaging.

---

## Architecture

```
User taps "Message Owner" / "Say Hi" / "Request Position"
  |
  v
useChatWithUser(walletAddress)          <-- app/src/lib/use-chat.ts
  |
  |-- 1. MiniKit.getUserByAddress(wallet)   <-- Resolve wallet -> World username
  |
  |-- 2. MiniKit.chat({ message, to: [username] })
  |       Opens World Chat with prefilled message
  |
  v
World App native chat opens
```

## API Reference

### MiniKit.chat()

```ts
import { MiniKit } from "@worldcoin/minikit-js";

type MiniKitChatOptions = {
  message: string;     // Required — prefilled draft text
  to?: string[];       // Optional — array of World usernames
  fallback?: () => unknown;
};

const result = await MiniKit.chat({ message, to: ["username"] });
// result.data.count = number of recipients
```

- **`to` provided**: opens chat draft addressed to those usernames
- **`to` omitted**: opens share picker — user chooses recipient

### Username Resolution

| Method | Use case |
|--------|----------|
| `MiniKit.user.username` | Current user's username (after `walletAuth()`) |
| `MiniKit.getUserByAddress(wallet)` | Any wallet address -> World username + profile |
| `MiniKit.getUserByUsername(name)` | Reverse lookup |

Docs: https://docs.world.org/mini-apps/commands/chat

## Chat Entry Points

### 1. VesselSheet — "Message Owner"

**File:** `app/src/app/miniapp/components/VesselSheet.tsx`

**Appears when:** vessel is registered on-chain AND has an `ownerWallet`

**Prefilled message:** `"Hi — I'm interested in daywork opportunities on {vesselName}"`

**Data flow:** `vessel.ownerWallet` -> `getUserByAddress` -> `MiniKit.chat`

### 2. ProfileView Social Mode — "Say Hi"

**File:** `app/src/app/miniapp/components/ProfileView.tsx`

**Appears when:** `targetWallet` prop is provided (viewing someone else's profile)

**Prefilled message:** `"Hey from Yacht Trust!"`

### 3. ProfileView Pro Mode — "Request for Position"

**File:** `app/src/app/miniapp/components/ProfileView.tsx`

**Appears when:** `targetWallet` prop is provided (viewing someone else's profile)

**Prefilled message:** `"Hi — I'd like to discuss a crew position opportunity with you"`

## Hook: useChatWithUser

**File:** `app/src/lib/use-chat.ts`

```ts
const { sendChat, loading, error } = useChatWithUser(walletAddress);
await sendChat("Your message here");
```

Handles wallet -> username resolution and error states. Returns `loading` and `error` for UI feedback.

## Testing

Chat only works inside the World App webview (MiniKit must be installed). For local dev:

1. The buttons render and are tappable
2. `getUserByAddress` will fail outside World App — the error state displays gracefully
3. To test the full flow, deploy to a staging URL and open via World App

### Quick smoke test (local)

```bash
# Start dev server
cd app && npm run dev

# Open the map, tap a registered vessel -> VesselSheet should show "Message Owner"
# Navigate to Profile tab -> Social mode placeholder shows when no targetWallet
```

## No Backend Required

Username resolution is fully client-side via MiniKit SDK. No new API routes or contract changes needed.
