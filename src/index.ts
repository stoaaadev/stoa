#!/usr/bin/env node
// stoa/src/index.ts — CLI entry point

const command = process.argv[2];

const HELP = `
stoa — Solana-native multi-agent swarm framework

Usage:
  stoa dispatch          Run the cron dispatcher (check schedules, trigger agents)
  stoa execute <agent> <skill>   Execute a specific agent's skill
  stoa chain <chain-id>  Execute a skill chain/pipeline
  stoa messages          Show recent inbound messages
  stoa status            Show swarm status
  stoa health            Show skill health reports
  stoa cost              Show token usage and cost summary
  stoa gateway            Show LLM provider status
  stoa agents            List all agents and their config
  stoa mesh <agent>      Show an agent's inbox
  stoa validate          Validate config and skills
  stoa reset             Reset swarm state (clear memory/mesh)
  stoa help              Show this help

Environment:
  ANTHROPIC_API_KEY      Required for Claude Code execution
  SOLANA_RPC_URL         Solana RPC endpoint (default: mainnet public)
  SOLANA_PRIVATE_KEY     Wallet private key (required for executor agent)
  HELIUS_API_KEY         Optional: Helius API for enriched data
  TELEGRAM_BOT_TOKEN     Optional: Telegram notifications
  TELEGRAM_CHAT_ID       Optional: Telegram chat ID
  DISCORD_WEBHOOK_URL    Optional: Discord webhook
  DISCORD_BOT_TOKEN      Optional: Discord bot token (inbound messages)
  DISCORD_CHANNEL_ID     Optional: Discord channel ID (inbound messages)
  SLACK_BOT_TOKEN        Optional: Slack bot token (inbound messages)
  SLACK_CHANNEL_ID       Optional: Slack channel ID (inbound messages)
  SLACK_WEBHOOK_URL      Optional: Slack webhook (outbound notifications)
  STOA_LOG_LEVEL         Log level: debug|info|warn|error (default: info)

GitHub Actions:
  The swarm runs autonomously via GitHub Actions cron.
  Configure secrets in your repo settings, then push.
`;

async function main() {
  switch (command) {
    case "dispatch":
    case "tick":
      await import("./dispatch.js");
      break;

    case "execute":
    case "run":
      await import("./execute.js");
      break;

    case "status": {
      const { getCronState, getPortfolioState, getPositions } = await import(
        "./memory.js"
      );
      const state = getCronState();
      const portfolio = getPortfolioState();
      const positions = getPositions();

      console.log("=== stoa swarm status ===");
      console.log(`Status: ${state.swarm_status}`);
      if (state.cooldown_until) {
        console.log(`Cooldown until: ${state.cooldown_until}`);
      }
      console.log("");
      console.log("Agents:");
      for (const [name, info] of Object.entries(state.agents)) {
        console.log(
          `  ${name}: last=${info.last_dispatch || "never"} status=${info.last_status || "unknown"} runs=${info.run_count || 0}`
        );
      }
      console.log("");
      console.log("Portfolio:");
      console.log(`  Value: $${portfolio.total_value_usd} (${portfolio.total_value_sol} SOL)`);
      console.log(`  Drawdown: ${portfolio.drawdown_pct}%`);
      console.log(`  Positions: ${positions.length}`);
      break;
    }

    case "agents": {
      const { loadConfig } = await import("./config.js");
      const config = loadConfig();
      console.log("=== stoa agents ===");
      for (const [name, agent] of Object.entries(config.agents)) {
        console.log(`\n[${name}]`);
        console.log(`  Role: ${agent.role}`);
        console.log(`  Skills: ${agent.skills.join(", ")}`);
        console.log(`  Schedule: ${agent.schedule || "reactive"}`);
        if (agent.triggers) {
          console.log(
            `  Triggers: ${agent.triggers.map((t) => `${t.on}:${t.from}:${t.type}`).join(", ")}`
          );
        }
      }
      break;
    }

    case "mesh": {
      const agentName = process.argv[3];
      if (!agentName) {
        console.error("Usage: stoa mesh <agent>");
        process.exit(1);
      }
      const { readInbox } = await import("./mesh.js");
      const messages = readInbox(agentName);
      console.log(`=== ${agentName} inbox (${messages.length} messages) ===`);
      for (const msg of messages) {
        console.log(
          `  [${msg.timestamp}] ${msg.from} -> ${msg.type}: ${JSON.stringify(msg.data).slice(0, 100)}`
        );
      }
      break;
    }

    case "messages": {
      const { readJSON } = await import("./memory.js");
      const msgState = readJSON("message-state.json", {
        telegram_offset: 0,
        discord_last_ids: {},
        slack_last_ts: {},
        processed_hashes: [],
      });

      console.log("=== stoa inbound messages ===");
      console.log(`Telegram offset: ${msgState.telegram_offset || 0}`);
      console.log(`Discord tracked channels: ${Object.keys(msgState.discord_last_ids).length}`);
      console.log(`Slack tracked channels: ${Object.keys(msgState.slack_last_ts).length}`);
      console.log(`Processed message hashes: ${msgState.processed_hashes.length}`);
      console.log("");

      // Show recent message log if available
      const msgLog = readJSON("message-log.json", [] as Array<{
        source: string; text: string; sender?: string;
        timestamp: string; routed_to?: string;
      }>);
      const recent = msgLog.slice(-20);
      if (recent.length > 0) {
        console.log(`Recent messages (last ${recent.length}):`);
        for (const msg of recent) {
          const agent = msg.routed_to ? ` -> ${msg.routed_to}` : "";
          console.log(
            `  [${msg.timestamp}] ${msg.source}${msg.sender ? ` (${msg.sender})` : ""}${agent}: ${msg.text.slice(0, 80)}`
          );
        }
      } else {
        console.log("No messages received yet.");
      }
      break;
    }

    case "chain": {
      await import("./chain-cli.js");
      break;
    }

    case "health": {
      const { getAllHealthReports, getFailingSkills } = await import("./health.js");
      const reports = getAllHealthReports();
      const failing = getFailingSkills();

      console.log("=== stoa skill health ===");
      console.log(`Total tracked: ${reports.length}`);
      console.log(`Failing: ${failing.length}`);
      console.log("");

      for (const r of reports) {
        const icon = r.needs_repair ? "!" : r.trend === "improving" ? "^" : r.trend === "degrading" ? "v" : "-";
        console.log(
          `  [${icon}] ${r.agent}/${r.skill}: avg=${r.avg_score} runs=${r.total_runs} trend=${r.trend}${r.needs_repair ? " NEEDS REPAIR" : ""}`
        );
      }

      if (failing.length > 0) {
        console.log("\nFailing skills:");
        for (const f of failing) {
          console.log(`  - ${f.agent}/${f.skill}: avg=${f.avg_score}, ${f.recent_failures} recent failures`);
        }
      }
      break;
    }

    case "cost": {
      const { getTotalCost } = await import("./tokens.js");
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const cost = getTotalCost(weekAgo);

      console.log("=== stoa cost report (last 7 days) ===");
      console.log(`Total: $${cost.total_usd.toFixed(4)}`);
      console.log("\nBy agent:");
      for (const [agent, c] of Object.entries(cost.by_agent)) {
        console.log(`  ${agent}: $${c.toFixed(4)}`);
      }
      console.log("\nBy model:");
      for (const [model, c] of Object.entries(cost.by_model)) {
        console.log(`  ${model}: $${c.toFixed(4)}`);
      }
      break;
    }

    case "validate": {
      await import("./validate-config.js");
      break;
    }

    case "gateway": {
      const { getGatewayStatus } = await import("./gateway.js");
      const status = getGatewayStatus();
      console.log("=== stoa LLM gateway ===");
      console.log("\nAvailable providers:");
      for (const p of status.available) {
        console.log(`  ✓ ${p}`);
      }
      console.log("\nUnavailable:");
      for (const p of status.unavailable) {
        console.log(`  ✗ ${p}`);
      }
      break;
    }

    case "reset": {
      const { writeJSON } = await import("./memory.js");
      const { clearInbox } = await import("./mesh.js");
      const { loadConfig } = await import("./config.js");
      const config = loadConfig();

      writeJSON("cron-state.json", { agents: {}, swarm_status: "active" });
      writeJSON("positions.json", []);
      writeJSON("portfolio-state.json", {
        timestamp: new Date().toISOString(),
        total_value_usd: 0,
        total_value_sol: 0,
        peak_value_usd: 0,
        drawdown_pct: 0,
        open_positions: 0,
        status: "active",
        alerts: [],
      });

      for (const name of Object.keys(config.agents)) {
        clearInbox(name);
      }

      console.log("Swarm state reset.");
      break;
    }

    case "help":
    case "--help":
    case "-h":
    case undefined:
      console.log(HELP);
      break;

    default:
      console.error(`Unknown command: ${command}`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
