#!/usr/bin/env bash
set -euo pipefail

# Deploy YachtRegistry to World Chain Mainnet and wire up all config files.
# Usage: ./deploy.sh
#
# Prerequisites:
#   1. Fund deployer 0xDC7D67Fc543D3737Fd200B443cE25821501B5caf with ~0.02 ETH
#      on World Chain mainnet (bridge from Ethereum L1 or use a fast bridge)
#   2. Run this script from the contracts/ directory

RPC_URL="https://worldchain-mainnet.g.alchemy.com/public"
PRIVATE_KEY="${DEPLOYER_PRIVATE_KEY:?Set DEPLOYER_PRIVATE_KEY in your environment or .env}"
DEPLOYER="0xDC7D67Fc543D3737Fd200B443cE25821501B5caf"
ENV_FILE="../app/.env.local"
CRE_TOML="../cre-workflows/ais-oracle/cre.toml"

echo "=== Deployer balance ==="
BALANCE=$(cast balance "$DEPLOYER" --rpc-url "$RPC_URL" --ether)
echo "$BALANCE ETH"

if [ "$BALANCE" = "0.000000000000000000" ]; then
  echo "ERROR: Deployer has no funds. Fund it first:"
  echo "  Address: $DEPLOYER"
  echo "  Bridge:  https://worldchain-mainnet.bridge.alchemy.com"
  exit 1
fi

echo ""
echo "=== Deploying YachtRegistry ==="
# Deploy with deployer as temporary forwarder (replace after CRE deployment)
OUTPUT=$(DEPLOYER_ADDRESS="$DEPLOYER" forge script script/DeployYachtRegistry.s.sol:DeployYachtRegistry \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVATE_KEY" \
  --broadcast 2>&1)

echo "$OUTPUT"

# Extract deployed address from forge output
REGISTRY_ADDRESS=$(echo "$OUTPUT" | grep "YachtRegistry deployed at:" | awk '{print $NF}')

if [ -z "$REGISTRY_ADDRESS" ]; then
  echo "ERROR: Could not extract deployed address"
  exit 1
fi

echo ""
echo "=== Verifying on Blockscout ==="
forge verify-contract "$REGISTRY_ADDRESS" src/YachtRegistry.sol:YachtRegistry \
  --constructor-args "$(cast abi-encode 'constructor(address)' "$DEPLOYER")" \
  --rpc-url "$RPC_URL" \
  --verifier blockscout \
  --verifier-url "https://worldchain-mainnet.explorer.alchemy.com/api" 2>&1 || echo "(Verification may take a moment)"

echo ""
echo "=== Updating config files ==="

# Update app/.env.local
if [ -f "$ENV_FILE" ]; then
  sed -i '' "s|^NEXT_PUBLIC_YACHT_REGISTRY_ADDRESS=.*|NEXT_PUBLIC_YACHT_REGISTRY_ADDRESS=$REGISTRY_ADDRESS|" "$ENV_FILE"
  echo "Updated $ENV_FILE"
fi

# Update cre.toml
if [ -f "$CRE_TOML" ]; then
  sed -i '' "s|^contract = .*|contract = \"$REGISTRY_ADDRESS\"|" "$CRE_TOML"
  echo "Updated $CRE_TOML"
fi

echo ""
echo "=== Done ==="
echo "YachtRegistry: $REGISTRY_ADDRESS"
echo "Chain: World Chain Mainnet (480)"
echo "Forwarder: $DEPLOYER (temporary — update after CRE deployment)"
echo "Explorer: https://worldscan.org/address/$REGISTRY_ADDRESS"
