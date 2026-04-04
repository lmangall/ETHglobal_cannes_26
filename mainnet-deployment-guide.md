# World Chain Mainnet Deployment Guide

Research findings for deploying Yacht Trust Network to World Chain mainnet (chain ID 480).

## 1. Gas Costs / Who Pays

### End Users: Zero Gas (Paymaster + ERC-4337)

World App sponsors gas for verified users automatically via a paymaster contract.

> "World App sponsors gas fees for most transactions on Worldchain, subject to transaction minimums and restrictions. When someone verifies their identity with World ID and uses the World App, their transactions on Worldchain are automatically covered by the network. This means users don't need to hold or spend ETH to interact with mini apps, send tokens, or perform on-chain actions. The sponsorship is handled behind the scenes with a paymaster contract that pays the gas fees whenever a verified user initiates a transaction."
> — https://docs.world.org/mini-apps/faq

**Mechanism:** World ID-gatekept ERC-4337 paymaster. `MiniKit.sendTransaction()` submits `UserOperations` (not raw txs). World App bundler + paymaster handle gas. No developer config needed.

> "The simplest one is to implement a World ID gatekept EIP4337 paymaster where each userOp or group of userOps per user requires a World ID proof."
> — https://docs.world.org/world-chain/quick-start/features

**Stipend:** Funded by the World Foundation. Exact per-user limits not publicly documented yet ("More details on gas allowance for humans coming soon").

### Custom Contracts: Must Be Allowlisted

Gas sponsorship applies to our contracts BUT they must be registered in the Developer Portal:

> "Before your mini app can send transactions, you must allowlist the contracts and tokens it interacts with. Navigate to Developer Portal > Mini App > Permissions and add: Permit2 Tokens — every ERC-20 token your app transfers via Permit2; Contract Entrypoints — every contract your app calls directly."
> — https://docs.world.org/mini-apps/commands/send-transaction

> "Transactions that touch non-whitelisted contracts or tokens will be blocked by the backend with an `invalid_contract` error."

**Action:** Add both `YachtRegistry` and `CrewAttestation` mainnet addresses to Developer Portal > Permissions after deployment.

### Deployer: We Pay Gas for Deployment

> "Gas is covered in the World App, so there's only deployment costs for you to develop on mainnet."
> — https://docs.world.org/mini-apps/faq

Budget ~0.02 ETH (~$50) for both contract deployments + verification + test calls. OP Stack L2 gas is very cheap.

## 2. MiniKit: Mainnet Only

**Critical:** MiniKit does NOT support testnet for end-to-end testing in World App.

> "No, mini app needs to be developed on mainnet (we don't support testnet). Gas is covered in the World App, so there's only deployment costs for you to develop on mainnet. Deploy 'test' contracts to mainnet, and then redeploy 'prod' mainnet contracts."
> — https://docs.world.org/mini-apps/faq

`MiniKit.sendTransaction()` expects `chainId: 480` (mainnet). The project now targets mainnet.

### sendTransaction Returns userOpHash

Returns `userOpHash`, NOT a transaction hash. Resolve via:
- React: `useUserOperationReceipt` hook from `@worldcoin/minikit-react`
- API: `GET https://developer.world.org/api/v2/minikit/userop/{userOpHash}`

## 3. Network Config: Sepolia vs Mainnet

| Config | Sepolia (current) | Mainnet (target) |
|---|---|---|
| Chain ID | `4801` | `480` |
| viem chain import | `worldchainSepolia` | `worldchain` |
| RPC URL | `worldchain-sepolia.g.alchemy.com/public` | `worldchain-mainnet.g.alchemy.com/public` |
| Block Explorer | `worldchain-sepolia.explorer.alchemy.com` | `worldscan.org` / `worldchain-mainnet.explorer.alchemy.com` |
| Bridge | `worldchain-sepolia.bridge.alchemy.com` | `worldchain-mainnet.bridge.alchemy.com` |
| Gas Limit | 30M | 80M |
| Block Time | 2s | 2s |

### CRE Forwarder Addresses

| Network | KeystoneForwarder | MockForwarder (sim) |
|---|---|---|
| **World Chain Mainnet** | `0x98B8335d29Aca40840Ed8426dA1A0aAa8677d8D1` | `0x6E9EE680ef59ef64Aa8C7371279c27E496b5eDc1` |
| World Chain Sepolia | `0x76c9cf548b4179F8901cda1f8623568b58215E62` | `0x6E9EE680ef59ef64Aa8C7371279c27E496b5eDc1` |

Source: https://docs.chain.link/cre/guides/workflow/using-evm-client/forwarder-directory

## 4. Files to Update

1. **`app/src/lib/viem.ts`** — `worldchainSepolia` → `worldchain` (lines 2, 6, 17)
2. **`app/.env.local`** — new contract addresses after mainnet deploy
3. **`contracts/deploy.sh`** — RPC_URL, verifier-url, forwarder address
4. **CRE `cre.toml`** — mainnet contract address + forwarder

## 5. Contract Verification (Mainnet)

Same Blockscout flow as Sepolia:

```bash
forge verify-contract $ADDRESS src/YachtRegistry.sol:YachtRegistry \
  --constructor-args "$(cast abi-encode 'constructor(address)' 0x98B8335d29Aca40840Ed8426dA1A0aAa8677d8D1)" \
  --rpc-url https://worldchain-mainnet.g.alchemy.com/public \
  --verifier blockscout \
  --verifier-url "https://worldchain-mainnet.explorer.alchemy.com/api"
```

Alternatively verify on Worldscan (worldscan.org) with `--etherscan-api-key`.

## 6. World ID: No Re-registration Needed

`app_id` and `rp_id` are app-level, not chain-specific. Verification happens off-chain via `POST /api/v4/verify/{rp_id}`. The existing Yachtbook registration works on mainnet.

## 7. Bridging ETH to World Chain Mainnet

- **Native bridge (Alchemy):** https://worldchain-mainnet.bridge.alchemy.com (7-day withdrawal)
- **Fast bridges:** [Superbridge Fast](https://superbridge.app/fast), [Across](https://app.across.to/bridge?), [Brid.gg](https://brid.gg/)
- **Exchange:** Some exchanges support direct World Chain deposits

## 8. App Review for Production

Must submit via [Developer Portal](https://developer.worldcoin.org/). Requirements:
- Live IDKit or MiniKit integration
- Complete app info + accurate submission
- Complies with app guidelines + smart contract guidelines
- Contact @MateoSauton on Telegram for rejection questions

## 9. Deployment Checklist

- [x] Bridge ETH to deployer `0xDC7D67Fc543D3737Fd200B443cE25821501B5caf` on World Chain mainnet
- [x] Update `app/src/lib/viem.ts`: `worldchainSepolia` → `worldchain`
- [x] Deploy YachtRegistry: `0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9` (forwarder: deployer wallet)
- [x] Deploy CrewAttestation: `0x9437434A19b47c6e4B73a4c78a9921AD9cbCCAEe` (registry: YachtRegistry)
- [x] Verify both contracts on Blockscout
- [ ] Allowlist both contracts in Developer Portal > Permissions
- [x] Update `deploy.sh`, CRE workflow config, and all docs for mainnet
- [x] Update `.env.local` + `contracts.ts` with new mainnet contract addresses
- [ ] Submit app for review in Developer Portal
