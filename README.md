<h1 align="center">
  <br>
  <img src="assets/stoa.png" alt="stoa" width="160">
  <br>
</h1>

<p align="center">
  <b>Multi-agent swarm framework for autonomous operations.</b><br>
  Seven agents. 122 skills. One shared mesh. Zero infrastructure.
</p>

<p align="center">
  <a href="https://github.com/stoaaadev/stoa/stargazers"><img src="https://img.shields.io/github/stars/stoaaadev/stoa?style=flat-square" alt="Stars"></a>
  <a href="https://github.com/stoaaadev/stoa/network/members"><img src="https://img.shields.io/github/forks/stoaaadev/stoa?style=flat-square" alt="Forks"></a>
  <a href="https://x.com/stoaframework"><img src="https://img.shields.io/badge/follow-%40stoaframework-black?style=flat-square&logo=x&logoColor=white" alt="X (Twitter)"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
  <a href="https://solana.com"><img src="https://img.shields.io/badge/chain-Solana-9945FF?style=flat-square&logo=solana&logoColor=white" alt="Solana"></a>
</p>

<p align="center">
  <img src="assets/demo.gif" alt="stoa demo" width="720">
</p>

---

Most agent frameworks give you a single brain with tools. That works until you need the brain to watch, think, act, research, write, and protect at the same time.

stoa is a **multi-agent swarm** where seven specialized agents coordinate autonomously. Each agent has a role, a personality, and skills. They communicate through a shared mesh. They run for free on GitHub Actions. State is git commits. Skills are markdown. Nothing to host, nothing to pay for (beyond LLM calls).

```
researcher ──research──→ analyst ──trade-signal──→ executor
     ↓                     ↑                         ↑
scout ──signal────────────┘      guardian ──halt──→───┘
     ↓                              ↓
writer ←── insight ──────── protects everything
     ↓
  ops ←── repo health, CI, deploys
```

## What's in the box

| | Count | Description |
|---|---|---|
| **Agents** | 7 | scout, analyst, executor, guardian, researcher, writer, ops |
| **Skills** | 122 | Trading, research, content, social, devops, data, automation |
| **Chains** | 6 | Multi-step pipelines with dependency graphs |
| **Dashboard** | 1 | Next.js operations UI with real-time swarm monitoring |
| **Messaging** | 3 | Telegram, Discord, Slack inbound + outbound |
| **LLM Providers** | 3 | Claude, OpenAI, Gemini with automatic failover |
| **Tests** | 39+ | Pipeline tests + Solana devnet integration tests |

## Why a swarm?

| | Single-agent | Off-chain swarm | **stoa** |
|---|---|---|---|
| Multi-agent coordination | No | Yes | **Yes (7 agents)** |
| Role specialization | No | Yes | **Yes** |
| On-chain verification | No | No | **Yes** (preflight + postflight) |
| Risk isolation | No | Partial | **Yes** (Guardian veto) |
| Infrastructure cost | Server | Server | **$0** (GitHub Actions) |
| State persistence | External DB | External DB | **Git commits** |
| Adding capabilities | Write code | Write code | **Write markdown** |
| LLM failover | Single provider | Single provider | **Multi-LLM gateway** |
| Inbound messaging | Custom | Custom | **Built-in** (Telegram/Discord/Slack) |
| Dashboard | Build it | Build it | **Included** |

## Quick start

```bash
# 1. Fork this repo
gh repo create my-stoa --template stoaaadev/stoa --private

# 2. Set secrets
gh secret set ANTHROPIC_API_KEY --body "sk-ant-..."
gh secret set SOLANA_RPC_URL --body "https://api.mainnet-beta.solana.com"  # optional
gh secret set SOLANA_PRIVATE_KEY --body "your-base58-key"                  # optional

# 3. Enable Actions
gh workflow enable tick.yml
gh workflow enable agent.yml
gh workflow enable messages.yml

# 4. Optional: enable messaging
gh secret set TELEGRAM_BOT_TOKEN --body "your-bot-token"
gh secret set TELEGRAM_CHAT_ID --body "your-chat-id"

# 5. Done. The swarm starts on the next cron tick.
```

Or run locally:

```bash
npm install
npx stoa status              # check swarm state
npx stoa dispatch            # run the dispatcher
npx stoa execute scout scan-tokens   # run one skill
npx stoa chain full-scan     # run a skill chain
npx stoa agents              # list all agents
npx stoa mesh scout          # view agent inbox
npx stoa messages            # view inbound messages
npx stoa health              # quality scores
npx stoa cost                # token usage
npx stoa gateway             # LLM provider status
npx stoa validate            # validate config

# Run the dashboard
cd dashboard && npm install && npm run dev
```

## Agents

### Scout — the eyes

Monitors Solana and the wider market for signals: token price movements, volume spikes, new pools, whale transactions, liquidity changes, news sentiment, social signals, bridge activity, airdrops. Runs every 30 minutes.

**9 skills:** `scan-tokens` `morning-brief` `whale-tracking` `liquidity-scan` `news-sentiment` `onchain-monitor` `social-signal` `bridge-monitor` `airdrop-tracker`

### Analyst — the brain

Evaluates signals from Scout and Researcher. Scores opportunities across multiple dimensions. Runs correlation analysis, portfolio models, market structure analysis, trend forecasting. Only signals above the confidence threshold generate trade theses.

**10 skills:** `analyze-signal` `correlation-analysis` `portfolio-rebalance` `risk-scoring` `narrative-tracker` `market-structure` `tokenomics-analysis` `trend-analysis` `trend-forecast` `benchmark-compare`

### Executor — the hands

Receives validated trade-signals from Analyst and executes via Jupiter. Supports single trades, DCA, and stop-loss triggers. Every transaction goes through preflight/postflight verification. Purely reactive — no cron schedule.

**3 skills:** `execute-trade` `dca-execute` `stop-loss-execute`

### Guardian — the immune system

Monitors all open positions, enforces stop-losses, checks drawdown, flags anomalies, tracks errors, monitors SLAs. Has **veto power** — a single `halt` message freezes the entire swarm. Runs self-healing routines automatically.

**10 skills:** `check-risk` `health-check` `self-repair` `self-improve` `cost-report` `anomaly-detection` `backup-state` `anomaly-report` `error-tracking` `sla-monitor`

### Researcher — the scholar

Conducts deep research across academic papers, protocol docs, governance proposals, competitive landscapes, funding rounds, developer activity. Synthesizes findings into structured intelligence for other agents.

**15 skills:** `arxiv-scan` `paper-summarize` `competitor-watch` `github-trending` `ecosystem-map` `protocol-deep-dive` `governance-tracker` `regulatory-scan` `tech-radar` `patent-scan` `funding-tracker` `developer-activity` `community-pulse` `security-audit-watch` `exploit-postmortem`

### Writer — the voice

Creates and publishes content across platforms. Articles, newsletters, social threads, blog posts, changelogs, tutorials. Fact-checks before publishing. Adapts tone to platform.

**20 skills:** `write-article` `write-thread` `write-newsletter` `daily-digest` `weekly-recap` `changelog-generate` `blog-draft` `tweet-compose` `discord-post` `telegram-broadcast` `content-calendar` `seo-optimize` `repurpose-content` `fact-check` `editorial-review` `press-release` `case-study` `tutorial-write` `comparison-post` `opinion-piece`

### Ops — the engineer

Manages repository health, CI pipelines, dependencies, security scanning, issue triage, PR reviews, automation workflows. Keeps the infrastructure running.

**28 skills:** `repo-health` `issue-triage` `pr-review` `dependency-audit` `ci-monitor` `changelog-update` `docs-sync` `code-quality` `test-coverage` `security-scan` `performance-monitor` `deployment-status` `infra-cost` `api-health` `auto-label` `auto-assign` `reminder-send` `report-schedule` `task-prioritize` `workflow-optimize` `notification-digest` `escalation-manage` `capacity-plan` `resource-optimize` `batch-process` `queue-manage` `cleanup-routine` `sync-external`

Plus 27 additional skills across data analytics, social monitoring, and more: `data-collect` `metric-dashboard` `kpi-track` `funnel-analyze` `cohort-analysis` `ab-test-report` `user-behavior` `retention-analysis` `revenue-track` `growth-forecast` `churn-predict` `data-quality` `social-listen` `sentiment-scan` `influencer-track` `community-growth` `engagement-report` `mention-monitor` `hashtag-track` `competitor-social` `audience-analyze` `viral-detect` `social-respond` `poll-create` `ama-prep` `community-health` `feedback-collect`

## Skills

Skills are markdown prompts. No code. Drop a `SKILL.md` in `skills/your-skill/` and reference it in an agent's config.

```
skills/                              # 122 skills across 7 domains
├── Trading (22)                     # scan-tokens, execute-trade, check-risk, ...
├── Research & Intelligence (20)     # arxiv-scan, github-trending, exploit-postmortem, ...
├── Content & Publishing (20)        # write-article, daily-digest, tweet-compose, ...
├── Social & Community (15)          # social-listen, influencer-track, viral-detect, ...
├── DevOps & Repo Management (15)    # repo-health, pr-review, security-scan, ...
├── Data & Analytics (15)            # kpi-track, cohort-analysis, growth-forecast, ...
└── Automation & Workflow (15)       # auto-label, workflow-optimize, cleanup-routine, ...
```

### Adding a skill

1. Create `skills/my-skill/SKILL.md`
2. Add it to the agent's skill list in `stoa.yml`
3. Push. The agent picks it up on its next tick.

### Skill format

```markdown
---
name: skill-name
agent: researcher
description: "One-line purpose"
schedule: "0 */4 * * *"
---

# skill-name

## Objective
What this skill does.

## Steps
1. Detailed step-by-step instructions
2. Include real API endpoints and data sources
3. Define output schemas

## Output
Files to write, messages to send via mesh.

## Exit Codes
- SKILL_OK: success
- SKILL_FAIL: failure
```

## Skill Chains

Skills compose into pipelines with dependency graphs:

```yaml
chains:
  morning-pipeline:
    steps:
      brief: { agent: scout, skill: morning-brief }
      research: { agent: researcher, skill: arxiv-scan }
      analysis: { agent: analyst, skill: analyze-signal, depends_on: [brief] }
      digest: { agent: writer, skill: daily-digest, depends_on: [brief, research, analysis] }
    schedule: "0 8 * * *"

  research-pipeline:
    steps:
      scan-papers: { agent: researcher, skill: arxiv-scan }
      scan-github: { agent: researcher, skill: github-trending }
      summarize: { agent: researcher, skill: paper-summarize, depends_on: [scan-papers] }
      write: { agent: writer, skill: write-newsletter, depends_on: [summarize, scan-github] }
      review: { agent: writer, skill: editorial-review, depends_on: [write] }
    schedule: "0 10 * * 1,4"
```

Six built-in chains: `full-scan`, `morning-pipeline`, `research-pipeline`, `weekly-maintenance`, `social-pipeline`, `security-audit`.

## Dashboard

The `dashboard/` directory contains a Next.js operations UI for monitoring and controlling the swarm.

**Features:**
- Real-time swarm status and agent health
- Skill execution history with quality scores
- Token usage and cost tracking
- Mesh message visualization
- Skill output feed
- Manual skill trigger
- Git sync

```bash
cd dashboard
npm install
npm run dev    # http://localhost:3000
```

Set `AUTH_PASSWORD` in `.env.local` to enable authentication.

## Messaging

The swarm accepts inbound messages from Telegram, Discord, and Slack. Messages are polled every 5 minutes via `messages.yml` and routed to the appropriate agent.

| Channel | Outbound | Inbound |
|---------|----------|---------|
| Telegram | `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` | Same (offset polling) |
| Discord | `DISCORD_WEBHOOK_URL` | `DISCORD_BOT_TOKEN` + `DISCORD_CHANNEL_ID` |
| Slack | `SLACK_WEBHOOK_URL` | `SLACK_BOT_TOKEN` + `SLACK_CHANNEL_ID` |

Message routing is keyword-based: trading terms go to executor, research terms to researcher, monitoring terms to scout, etc. Send a message to your bot and the swarm responds.

All agents use `./notify "message"` to send responses back across all configured channels.

## Multi-LLM Gateway

The gateway implements automatic failover across three providers:

```
Claude (primary) → OpenAI (fallback) → Gemini (fallback)
```

Set per-agent models in `stoa.yml`. Scout might use Haiku (fast, cheap) while Analyst uses Opus (deep reasoning).

## Safety Model

1. **Role separation** — the agent that discovers opportunities cannot execute trades
2. **Preflight gates** — halt check, balance verification, circuit breaker, position limits
3. **Postflight verification** — on-chain transaction confirmation via `@solana/web3.js`
4. **Circuit breaker** — skills that fail repeatedly are automatically blocked
5. **Guardian veto** — freezes the entire swarm instantly
6. **Confidence gating** — Analyst must score above threshold before generating trade-signals
7. **Position limits** — enforced in config, preflight, and Executor skill
8. **Stop-loss enforcement** — Guardian checks every 15 minutes
9. **Drawdown circuit breaker** — automatic cooldown on threshold breach
10. **Multi-LLM failover** — no single provider outage halts the swarm
11. **Output validation** — fabrication detection and secret leak prevention
12. **Prompt injection scanner** — blocks adversarial inputs
13. **Rate limiting** — token bucket limiter per API
14. **Dispatch deduplication** — prevents double-triggers
15. **Immutable audit trail** — all state changes are git commits
16. **Self-healing** — automatic repair of degrading skills

## Mesh Protocol

Agents communicate asynchronously via `memory/mesh/`. Each agent has an inbox. Messages are typed JSON with TTL-based expiry and acknowledgment:

```json
{
  "from": "scout",
  "to": "analyst",
  "type": "signal",
  "id": "scout-1716000000000-a3f2",
  "timestamp": "2026-05-18T12:00:00.000Z",
  "data": {
    "signal_type": "volume_spike",
    "token": "JUP",
    "details": "3.2x average volume in 1h"
  }
}
```

**Message types:** `signal` `feedback` `trade-signal` `execution-report` `halt` `cooldown` `research` `research-request` `insight` `content-ready` `review-request` `deploy-request` `repair-needed`

## MCP Server

The `mcp-server/` exposes the swarm as tools for Claude Desktop:

`stoa_status` `stoa_health` `stoa_dispatch` `stoa_execute` `stoa_mesh_read` `stoa_mesh_post` `stoa_positions` `stoa_cost` `stoa_chain` `stoa_halt` `stoa_resume` `stoa_validate` `stoa_gateway`

## Project Structure

```
stoa/
├── stoa.yml                    # swarm configuration
├── CLAUDE.md                   # agent identity
├── dashboard/                  # Next.js operations UI
│
├── agents/                     # 7 agent role definitions
│   ├── scout/AGENT.md
│   ├── analyst/AGENT.md
│   ├── executor/AGENT.md
│   ├── guardian/AGENT.md
│   ├── researcher/AGENT.md
│   ├── writer/AGENT.md
│   └── ops/AGENT.md
│
├── skills/                     # 122 skill prompts
│   ├── (22 trading skills)
│   ├── (20 research skills)
│   ├── (20 content skills)
│   ├── (15 social skills)
│   ├── (15 devops skills)
│   ├── (15 data skills)
│   └── (15 automation skills)
│
├── src/                        # TypeScript runtime
│   ├── index.ts                # CLI entry
│   ├── dispatch.ts             # cron dispatcher
│   ├── execute.ts              # agent executor
│   ├── messages.ts             # inbound message handler
│   ├── solana.ts               # Solana integration
│   ├── gateway.ts              # multi-LLM failover
│   ├── chain.ts                # skill chaining (DAG)
│   ├── mesh.ts                 # inter-agent messaging
│   ├── memory.ts               # state management
│   ├── security.ts             # runtime security
│   ├── health.ts               # quality scoring
│   ├── preflight.ts            # pre-execution checks
│   ├── postflight.ts           # post-execution verification
│   └── ...                     # 11 more modules
│
├── mcp-server/                 # MCP server for Claude Desktop
│
├── memory/                     # swarm state (git-committed)
│   ├── mesh/                   # agent inboxes
│   ├── skill-health/           # quality scores
│   └── ...
│
├── .github/workflows/
│   ├── tick.yml                # cron dispatcher
│   ├── agent.yml               # skill executor
│   ├── messages.yml            # inbound message handler
│   ├── chain-runner.yml        # skill chain executor
│   └── ci.yml                  # typecheck + test + validate
│
├── test-pipeline.ts            # 39 pipeline tests
└── test-devnet.ts              # Solana devnet tests
```

## Testing

```bash
npx tsx test-pipeline.ts        # 39 tests, no network
npx tsx test-devnet.ts          # Solana devnet integration
```

CI runs both automatically on push: `typecheck → pipeline tests → config validation → devnet integration`.

## Cost

| Component | Cost |
|-----------|------|
| GitHub Actions | Free (2,000 min/month) |
| Claude API | ~$0.01–0.05 per skill |
| Solana RPC | Free (public endpoints) |
| Hosting | $0 |

## Adding Agents

1. Create `agents/my-agent/AGENT.md`
2. Create skills in `skills/`
3. Add to `stoa.yml`
4. Push

## FAQ

**Is this a trading bot?**
stoa is a general-purpose multi-agent framework. The default config includes trading (scout → analyst → executor), but also research, content, social, devops, and automation pipelines. Enable what you need, disable what you don't.

**How is this different from aeon?**
aeon is a single-agent bash framework. stoa is a multi-agent TypeScript framework with mesh communication, DAG chaining, runtime security, and a dashboard. Different architecture, different tradeoffs.

**What if Claude is down?**
The gateway fails over to OpenAI, then Gemini. Set all three API keys.

**Do I need Solana?**
No. Solana is optional. Without `SOLANA_RPC_URL`, onchain skills are skipped. Research, content, devops, and automation skills work without any chain.

**Can I message the swarm?**
Yes. Set up a Telegram/Discord/Slack bot. Send a message and the swarm routes it to the right agent and responds.

## Philosophy

> *The Stoa Poikile was the painted porch in Athens where Zeno of Citium founded Stoic philosophy. The Stoics believed in rational agents acting within a shared logos — each autonomous, yet part of a greater order.*

> *stoa applies the same structure to autonomous agents. Scout observes. Analyst reasons. Researcher investigates. Writer communicates. Executor acts. Ops maintains. Guardian protects.*

## License

MIT
