# AI Attribution

This document describes where and how AI tools were used in developing Yacht Trust Network (Yachtbook).

## Tools Used

- **Claude Code** (Anthropic) — AI-assisted coding via CLI, used throughout development

## Development Process

The project was built by a solo developer over the hackathon period. AI was used as a coding assistant — architecture decisions, feature scoping, prize strategy, and demo planning were human-driven.

### What was human-driven
- **Project concept & architecture** — maritime crew reputation on World Chain, targeting Chainlink CRE + World ID prizes
- **Feature scoping & prioritization** — which 6 features to build, in what order
- **Smart contract design** — YachtRegistry (ReceiverTemplate pattern), CrewAttestation (role/rating/dispute model)
- **CRE workflow design** — Datalastic API integration via Confidential HTTP, simulation/broadcast flow
- **Deployment & ops** — wallet management, mainnet migration, Developer Portal configuration, contract verification
- **Demo planning & pitch strategy** — which prize tracks to target, talking points per booth

### What was AI-assisted
- **Solidity implementation** — contract code written with AI assistance, all 27 tests co-developed
- **Next.js app code** — API routes, React components (MapView, ProfileView, ProfileCard, attestation UI), MiniKit integration
- **CRE workflow TypeScript** — main.ts workflow, project config, secret handling patterns
- **Documentation** — demo guides, implementation plan, pitch guide drafted with AI, reviewed/edited by human
- **Debugging** — type errors, config issues, chain migration (Sepolia→Mainnet) changes across codebase

### What was purely AI-generated
- **llms-txt/ directory** — provider documentation files fetched/formatted for development context (not part of the product)

## Commit History

The project has 22 incremental commits showing progressive development across all features. Each commit represents a working milestone, not a single bulk generation.

## Summary

AI was used as an accelerator for implementation, not as the sole creator. The developer directed all decisions, reviewed all code, and manually handled deployment, wallet ops, and platform configuration. The product concept, architecture, and strategy are original human work.
