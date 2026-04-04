# ETHcc Hackathon — Target Prizes

## Chainlink — $7,000 Total

### Best Workflow with Chainlink CRE — $4,000
- **Prize:** Up to 2 teams x $2,000
- **Goal:** Build, simulate, or deploy a CRE Workflow used as an orchestration layer
- **Requirements:**
  - Integrate at least one blockchain with an external API, system, data source, LLM, or AI agent
  - Demonstrate a successful simulation (via CRE CLI) or live deployment on CRE network
  - Workflow must be meaningfully used in the project
- **Note:** If simulation is successful, Chainlink team will deploy to live CRE network during hackathon
- **Resources:**
  - [CRE Documentation](https://docs.chain.link/cre)
  - [CRE Bootcamp](https://smartcontractkit.github.io/cre-bootcamp-2026/)
  - [CRE Templates](https://github.com/smartcontractkit/cre-templates/)

### Connect the World with Chainlink — $1,000
- **Goal:** Build something using Chainlink services (CCIP, Price Feeds, Data Streams, PoR, or VRF)
- **Requirements:**
  - Must use a Chainlink service to make a state change on a blockchain (reading data feeds from frontend doesn't count)
  - Using Chainlink inside smart contracts is required
  - Bonus points for using multiple Chainlink services meaningfully
- **Note:** Do NOT use Chainlink Functions or Automation (deprecated) — use CRE instead
- **Resources:** [Chainlink Documentation](http://docs.chain.link)

### Best Usage of Chainlink Privacy Standard — $2,000
- **Prize:** Up to 2 teams x $1,000
- **Goal:** Use Chainlink Confidential Compute and/or CRE's Confidential HTTP for privacy-preserving workflows
- **Requirements:**
  - Build, simulate, or deploy a CRE Workflow with Confidential Compute and/or Confidential HTTP
  - API credentials, selected request/response data, and value flows must be protected
  - Sensitive application logic executes offchain
- **Example use cases:**
  - Private governance payouts & incentives
  - Private treasury and fund operations
  - Secure Web2 API integration for decentralized workflows
  - Protected request-driven automation
  - Credential-secure data ingestion and processing
- **Resources:**
  - [Confidential HTTP](https://docs.chain.link/cre/capabilities/confidential-http-ts)
  - [Compliant Private Transfer Demo](https://github.com/smartcontractkit/Compliant-Private-Transfer-Demo)
  - [Confidential HTTP Workflow](https://github.com/smartcontractkit/conf-http-demo)

---

## World — $20,000 Total

### Best Use of Agent Kit — $8,000
- **Prizes:** 1st $4,000 / 2nd $2,500 / 3rd $1,500
- **Goal:** Apps that use AgentKit to ship agentic experiences where World ID improves safety, fairness, or trust
- **Requirements:**
  - Must integrate World's Agent Kit to meaningfully distinguish human-backed agents from bots
  - Submissions using only World ID or MiniKit without AgentKit do NOT qualify
- **Resources:** [Agent Kit Docs](https://docs.world.org/agents/agent-kit/integrate)

### Best Use of World ID 4.0 — $8,000
- **Prizes:** 1st $4,000 / 2nd $2,500 / 3rd $1,500
- **Goal:** Leverage World ID 4.0 building products that break without proof of human
- **Requirements:**
  - Uses World ID 4.0 as a real constraint (eligibility, uniqueness, fairness, reputation, rate limits)
  - Proof validation is required — must occur in a web backend or smart contract
- **Resources:** [World ID Docs](https://docs.world.org/world-id/overview)

### Best Use of MiniKit 2.0 — $4,000
- **Prizes:** 1st $2,000 / 2nd $1,250 / 3rd $750
- **Goal:** Mini apps that make World ID and World App work smoothly with broader Ethereum/Solana ecosystems
- **Requirements:**
  - Build a Mini App with MiniKit 2.0
  - Integrate any MiniKit SDK Commands
  - If using on-chain activity, deploy contracts to World Chain
  - Must NOT be gambling or chance-based
  - Proof validation is required — must occur in a web backend or smart contract
- **Resources:** [Mini App Docs](https://docs.world.org/mini-apps)

### General World Resources
- [World Docs](https://docs.world.org/)
- [Mini App Docs](https://docs.world.org/mini-apps)
- [ID Kit Docs](https://docs.world.org/world-id/overview)
- [Agent Kit Docs](https://docs.world.org/agents/agent-kit/integrate)

---

## Prize Strategy — Yacht Trust Network

Our project (Yacht Trust Network) targets **all prizes simultaneously** ($27,000 total potential):

| Prize | How We Qualify |
|---|---|
| CRE Best Workflow ($4K) | AIS oracle workflow: HTTP trigger + Confidential HTTP + EVM Write to World Chain |
| CRE Privacy ($2K) | AIS API key via Confidential HTTP, sensitive vessel data never exposed on-chain |
| Connect the World ($1K) | CRE workflow makes state change on World Chain via YachtRegistry contract |
| World ID 4.0 ($8K) | Nullifier as permanent identity anchor, duplicate registration blocked, proof validated in backend |
| AgentKit ($8K) | Crew agency AI agent gated by AgentKit, distinguishes human-backed agents from bots |
| MiniKit 2.0 ($4K) | Full Mini App in World App with pay, chat, contracts on World Chain, not gambling |
