# Yacht Trust Network — ETHcc Hackathon Project

## Project Overview
A maritime crew reputation and vessel verification platform built as a World App Mini App, using Chainlink CRE for oracle data and World ID for identity.

## Key Documentation
- [yacht-implementation-plan.md](yacht-implementation-plan.md) — Full implementation plan with phases, pseudocode, verification table, and tech stack
- [prizes.md](prizes.md) — Target hackathon prizes (Chainlink $7K + World $20K) with qualification requirements and strategy
- [chainlink-demo-guide.md](chainlink-demo-guide.md) — CRE workflow demo: simulation, broadcast, test payloads
- [crew-attestation-demo-guide.md](crew-attestation-demo-guide.md) — Crew attestation demo: Anvil fork testing with cast commands
- [map-demo-guide.md](map-demo-guide.md) — Who's Around Map demo: API testing, Web2/Web3 flow, curl examples
- [llms-txt/](llms-txt/) — LLM-friendly documentation files from providers (World, Chainlink, viem, Foundry, Next.js)

## Tech Stack
- **Frontend:** Next.js 14+ App Router, MiniKit 2.0
- **Identity:** World ID 4.0 (IDKit v4.x), AgentKit
- **Oracle:** Chainlink CRE (TypeScript SDK, Bun runtime) with Confidential HTTP
- **Chain:** World Chain (eip155:480), viem chain: `worldchain` / `worldchainSepolia`
- **Contracts:** Solidity (Foundry), YachtRegistry (inherits ReceiverTemplate) + CrewAttestation
- **Data:** Datalastic API (api.datalastic.com) for vessel tracking & port data
- **Client:** viem (not ethers.js)

## Important Constraints
- Do NOT use Chainlink Functions or Automation (deprecated) — use CRE instead
- Do NOT use ethers.js — use viem
- MiniKit apps must NOT be gambling-based
- All proof validation must occur in backend or smart contract, never client-only
- MiniKit.verify() is DEPRECATED — use IDKit (`@worldcoin/idkit` / `@worldcoin/idkit-core`) for World ID verification
- signRequest import: `@worldcoin/idkit-core/signing` (NOT `@worldcoin/idkit/signing`)
- CRE workflows are a separate Bun project (>= 1.2.21), NOT part of the Next.js app
- CRE deployment requires Early Access approval (`cre account access`), but `--broadcast` mode works without it
- YachtRegistry current deployment: `0xdEd817861eD9d2E5a8d0301C537E122a797C3EC9` (forwarder: deployer wallet `0xDC7D67...`)
- CrewAttestation current deployment: `0x408B8eb461E41070eEEE3c6d02E89500C94ce7c5` (registry: YachtRegistry)

## Coding Conventions

### TypeScript / Next.js
- RSC (React Server Components) by default, `'use client'` only when needed for state/effects/browser APIs
- `as const` arrays for fixed value sets, never enums
- Zod for validation schemas
- `cn()` utility for conditional Tailwind classes (if using shadcn)
- Prefer `interface` over `type` for object shapes
- Avoid `any` — use `unknown` and narrow

### Solidity
- Use Foundry (forge) for compilation, testing, deployment
- Deploy with `forge create` or `forge script`
- Verify on World Chain with `--verifier blockscout --verifier-url https://worldchain-mainnet.explorer.alchemy.com/api`
- YachtRegistry must inherit `ReceiverTemplate` and accept forwarder address in constructor

### Git & Commits
- One-line conventional commits: `type: description` or `type(scope): description`
- Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `style`, `test`, `perf`
- NO Claude mentions, NO Co-Authored-By, NO "Generated with Claude Code"
- Do NOT ask for confirmation — just commit directly
- Stage specific files, not `git add -A` (except in `/commit-push`)
- SSH alias: `github.com-personal`

### Progress Tracking
- At the end of each conversation, save progress to auto-memory (`~/.claude/projects/-Users-lmangall-Repos-P-ETH/memory/`)
- Update or create a memory file summarizing what was completed, what's next, and any blockers
- Update MEMORY.md index accordingly

### Database Safety
- Never run destructive operations without explicit user confirmation

## LLM Documentation References
When implementing features, these llms.txt files provide accurate API references:
- World: `llms-txt/world-docs-llms-full.txt` (411 KB — MiniKit, World ID, AgentKit, World Chain)
- Chainlink: `llms-txt/chainlink-docs-llms.txt` (18 KB — CRE SDK, workflows)
- viem: `llms-txt/viem-llms-full.txt` (1.69 MB — complete chain interaction API)
- Foundry: `llms-txt/foundry-llms-full.txt` (1.38 MB — forge, cast, anvil)
- Next.js: `llms-txt/nextjs-docs-llms-full.txt` (3.35 MB — App Router, API routes)
- Datalastic: `llms-txt/datalastic-api-reference.txt` (vessel tracking, port data, AIS)
