#!/usr/bin/env node
// stoa/src/messages.ts — Inbound Message Handler
//
// Polls Telegram, Discord, and Slack for inbound messages.
// Routes messages to the appropriate agent based on keyword analysis.
// Executes via Claude CLI (same pattern as execute.ts).

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import { createHash } from "crypto";
import { loadConfig, getAgent } from "./config.js";
import { readJSON, writeJSON, appendJSON } from "./memory.js";
import { createLogger } from "./logger.js";
import type { MessageState, InboundMessage, StoaConfig } from "./types.js";

const log = createLogger("messages");

// --- State management ---

const DEFAULT_STATE: MessageState = {
  telegram_offset: 0,
  discord_last_ids: {},
  slack_last_ts: {},
  processed_hashes: [],
};

function loadMessageState(): MessageState {
  return readJSON<MessageState>("message-state.json", DEFAULT_STATE);
}

function saveMessageState(state: MessageState): void {
  // Keep processed_hashes bounded (last 500)
  if (state.processed_hashes.length > 500) {
    state.processed_hashes = state.processed_hashes.slice(-500);
  }
  writeJSON("message-state.json", state);
}

function hashMessage(msg: InboundMessage): string {
  return createHash("sha256")
    .update(`${msg.source}:${msg.text}:${msg.message_id || msg.timestamp}`)
    .digest("hex")
    .slice(0, 16);
}

// --- Channel polling ---

function pollTelegram(state: MessageState): InboundMessage[] {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return [];

  const messages: InboundMessage[] = [];
  try {
    const offset = state.telegram_offset || 0;
    const response = execSync(
      `curl -sf "https://api.telegram.org/bot${botToken}/getUpdates?timeout=0&offset=${offset}&allowed_updates=%5B%22message%22%5D"`,
      { encoding: "utf-8", timeout: 15_000, stdio: ["pipe", "pipe", "pipe"] }
    );
    const data = JSON.parse(response);
    if (!data.ok || !data.result) return [];

    let maxUpdateId = offset;
    for (const update of data.result) {
      const text = update.message?.text;
      const chat = String(update.message?.chat?.id);
      const updateId = update.update_id;

      if (text && chat === chatId) {
        messages.push({
          source: "telegram",
          text,
          sender: update.message?.from?.username || update.message?.from?.first_name,
          timestamp: new Date((update.message?.date || 0) * 1000).toISOString(),
          message_id: String(updateId),
        });
      }
      if (updateId > maxUpdateId) maxUpdateId = updateId;
    }

    // Acknowledge by setting offset to max+1
    if (data.result.length > 0) {
      state.telegram_offset = maxUpdateId + 1;
    }
  } catch (e) {
    log.warn("Telegram poll failed", { error: e instanceof Error ? e.message : String(e) });
  }
  return messages;
}

function pollDiscord(state: MessageState): InboundMessage[] {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!botToken || !channelId) return [];

  const messages: InboundMessage[] = [];
  try {
    const response = execSync(
      `curl -sf -H "Authorization: Bot ${botToken}" "https://discord.com/api/v10/channels/${channelId}/messages?limit=10"`,
      { encoding: "utf-8", timeout: 15_000, stdio: ["pipe", "pipe", "pipe"] }
    );
    const data = JSON.parse(response);
    if (!Array.isArray(data)) return [];

    const lastId = state.discord_last_ids[channelId] || "0";

    for (const msg of data) {
      if (!msg.content || msg.author?.bot) continue;
      // Skip already-processed messages (Discord IDs are snowflakes, comparable as strings)
      if (BigInt(msg.id) <= BigInt(lastId)) continue;

      messages.push({
        source: "discord",
        text: msg.content,
        sender: msg.author?.username,
        timestamp: msg.timestamp || new Date().toISOString(),
        message_id: msg.id,
      });

      // React with checkmark to acknowledge
      try {
        execSync(
          `curl -sf -X PUT -H "Authorization: Bot ${botToken}" "https://discord.com/api/v10/channels/${channelId}/messages/${msg.id}/reactions/%E2%9C%85/@me"`,
          { stdio: ["pipe", "pipe", "pipe"], timeout: 10_000 }
        );
      } catch {
        // Non-critical
      }
    }

    // Track the highest message ID
    if (messages.length > 0) {
      const maxId = messages.reduce((max, m) => {
        const mId = BigInt(m.message_id || "0");
        return mId > max ? mId : max;
      }, BigInt(lastId));
      state.discord_last_ids[channelId] = maxId.toString();
    }
  } catch (e) {
    log.warn("Discord poll failed", { error: e instanceof Error ? e.message : String(e) });
  }
  return messages;
}

function pollSlack(state: MessageState): InboundMessage[] {
  const botToken = process.env.SLACK_BOT_TOKEN;
  const channelId = process.env.SLACK_CHANNEL_ID;
  if (!botToken || !channelId) return [];

  const messages: InboundMessage[] = [];
  try {
    const oldest = state.slack_last_ts[channelId] || "0";
    const response = execSync(
      `curl -sf -H "Authorization: Bearer ${botToken}" "https://slack.com/api/conversations.history?channel=${channelId}&limit=10&oldest=${oldest}"`,
      { encoding: "utf-8", timeout: 15_000, stdio: ["pipe", "pipe", "pipe"] }
    );
    const data = JSON.parse(response);
    if (!data.ok || !data.messages) return [];

    let maxTs = oldest;
    for (const msg of data.messages) {
      if (!msg.text || msg.bot_id) continue;

      messages.push({
        source: "slack",
        text: msg.text,
        sender: msg.user,
        timestamp: new Date(parseFloat(msg.ts) * 1000).toISOString(),
        message_id: msg.ts,
      });

      // React with checkmark to acknowledge
      try {
        const payload = JSON.stringify({
          channel: channelId,
          timestamp: msg.ts,
          name: "white_check_mark",
        });
        execSync(
          `curl -sf -X POST -H "Authorization: Bearer ${botToken}" -H "Content-Type: application/json" -d '${payload}' "https://slack.com/api/reactions.add"`,
          { stdio: ["pipe", "pipe", "pipe"], timeout: 10_000 }
        );
      } catch {
        // Non-critical
      }

      if (parseFloat(msg.ts) > parseFloat(maxTs)) {
        maxTs = msg.ts;
      }
    }

    if (messages.length > 0) {
      state.slack_last_ts[channelId] = maxTs;
    }
  } catch (e) {
    log.warn("Slack poll failed", { error: e instanceof Error ? e.message : String(e) });
  }
  return messages;
}

// --- Message routing ---

const ROUTING_RULES: Record<string, string[]> = {
  executor: ["trading", "price", "trade", "buy", "sell", "swap", "execute", "dca"],
  analyst: ["research", "analyze", "analysis", "signal", "evaluate", "score", "thesis"],
  scout: ["monitor", "scan", "watch", "whale", "track", "pool", "token", "dex"],
  guardian: ["health", "risk", "status", "drawdown", "halt", "repair", "cost", "balance"],
};

export function routeMessage(text: string): string {
  const lower = text.toLowerCase();

  for (const [agent, keywords] of Object.entries(ROUTING_RULES)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        return agent;
      }
    }
  }

  // Default to scout for general queries
  return "scout";
}

// --- Prompt building ---

function buildMessagePrompt(
  msg: InboundMessage,
  agentName: string,
  agentMd: string,
  skillMds: string[]
): string {
  let prompt = agentMd;

  prompt += `\n\n---\n\n# Inbound Message\n\n`;
  prompt += `**Source:** ${msg.source}\n`;
  if (msg.sender) prompt += `**Sender:** ${msg.sender}\n`;
  prompt += `**Time:** ${msg.timestamp}\n`;
  prompt += `**Message:**\n\n> ${msg.text}\n`;

  if (skillMds.length > 0) {
    prompt += `\n\n---\n\n# Available Skills Reference\n\n`;
    for (const skillMd of skillMds) {
      prompt += `${skillMd}\n\n---\n\n`;
    }
  }

  prompt += `\n\n---\n\n# Instructions\n\n`;
  prompt += `You received the above message from a user via ${msg.source}. `;
  prompt += `You are the **${agentName}** agent. Interpret what the user wants and act on it:\n`;
  prompt += `- If they want information, research it using your available tools and data in memory/.\n`;
  prompt += `- If they want you to perform an action within your role, do it.\n`;
  prompt += `- Write any results or state changes to the appropriate memory/ files.\n`;
  prompt += `- Post mesh messages to other agents if coordination is needed.\n`;
  prompt += `- Always send your response back via ./notify so the user sees it on ${msg.source}.\n`;
  prompt += `\n# Runtime Context\n`;
  prompt += `- Current time: ${new Date().toISOString()}\n`;
  prompt += `- Agent: ${agentName}\n`;
  prompt += `- IMPORTANT: Do not fabricate data. If an API call fails, report the failure.\n`;
  prompt += `- IMPORTANT: Do not expose secrets in any output or committed file.\n`;

  return prompt;
}

// --- Execution ---

function executeWithClaude(prompt: string, model: string, agentName: string): {
  success: boolean;
  output: string;
  duration_ms: number;
} {
  const tmpFile = `/tmp/stoa-msg-prompt-${agentName}-${Date.now()}.md`;
  writeFileSync(tmpFile, prompt);

  const startTime = Date.now();
  let output = "";
  let success = false;

  try {
    output = execSync(
      `claude --model ${model} --allowedTools "Read,Write,Edit,Bash,Glob,Grep,Bash(./notify:*)" --print < ${tmpFile}`,
      {
        encoding: "utf-8",
        timeout: 300_000,
        maxBuffer: 10 * 1024 * 1024,
        env: {
          ...process.env,
          STOA_AGENT: agentName,
          STOA_SKILL: "message-handler",
        },
      }
    );
    success = true;
  } catch (e: unknown) {
    const err = e as { stdout?: string; stderr?: string; message?: string };
    output = err.stdout || err.stderr || err.message || "Unknown error";
    log.error("Claude execution failed for message", { agent: agentName, error: output.slice(0, 500) });
  } finally {
    try { unlinkSync(tmpFile); } catch {}
  }

  return { success, output, duration_ms: Date.now() - startTime };
}

// --- Main ---

async function main() {
  const mode = process.env.STOA_MSG_MODE || process.argv[2] || "poll";

  if (mode === "poll") {
    // Poll all channels, output messages as JSON for the workflow to dispatch
    log.info("Polling channels for inbound messages");
    const state = loadMessageState();

    const allMessages: InboundMessage[] = [
      ...pollTelegram(state),
      ...pollDiscord(state),
      ...pollSlack(state),
    ];

    // Dedup
    const newMessages: InboundMessage[] = [];
    for (const msg of allMessages) {
      const hash = hashMessage(msg);
      if (!state.processed_hashes.includes(hash)) {
        state.processed_hashes.push(hash);
        newMessages.push(msg);
      }
    }

    saveMessageState(state);

    // Log messages
    for (const msg of newMessages) {
      const routed = routeMessage(msg.text);
      appendJSON("message-log.json", { ...msg, routed_to: routed });
    }

    // Output for workflow consumption
    console.log(JSON.stringify(newMessages));
    log.info(`Polled ${newMessages.length} new message(s)`);

  } else if (mode === "handle") {
    // Handle a single message (passed via env vars)
    const source = (process.env.STOA_MSG_SOURCE || "manual") as InboundMessage["source"];
    const text = process.env.STOA_MSG_TEXT || "";
    const sender = process.env.STOA_MSG_SENDER;

    if (!text) {
      log.error("No message text provided");
      process.exit(1);
    }

    const msg: InboundMessage = {
      source,
      text,
      sender,
      timestamp: new Date().toISOString(),
    };

    const agentName = routeMessage(text);
    log.info("Routing message", { source, agent: agentName, text: text.slice(0, 100) });

    const config = loadConfig();
    const agentConfig = getAgent(config, agentName);
    const model = agentConfig.model || config.defaults.model;

    // Load agent markdown
    const agentMdPath = `agents/${agentName}/AGENT.md`;
    let agentMd = "";
    if (existsSync(agentMdPath)) {
      agentMd = readFileSync(agentMdPath, "utf-8");
    } else {
      agentMd = `# ${agentName}\n\nRole: ${agentConfig.role}`;
    }

    // Load first few skill markdowns for context
    const skillMds: string[] = [];
    for (const skillName of agentConfig.skills.slice(0, 3)) {
      const skillPath = `skills/${skillName}/SKILL.md`;
      if (existsSync(skillPath)) {
        skillMds.push(readFileSync(skillPath, "utf-8"));
      }
    }

    const prompt = buildMessagePrompt(msg, agentName, agentMd, skillMds);
    log.info("Executing message handler", { model, agent: agentName, prompt_length: prompt.length });

    const result = executeWithClaude(prompt, model, agentName);

    // Log result
    appendJSON("message-log.json", {
      ...msg,
      routed_to: agentName,
      response_success: result.success,
      response_duration_ms: result.duration_ms,
    });

    if (result.success) {
      log.info("Message handled successfully", { agent: agentName, duration_ms: result.duration_ms });
    } else {
      log.error("Message handling failed", { agent: agentName, duration_ms: result.duration_ms });
      process.exit(1);
    }
  } else {
    console.error(`Unknown mode: ${mode}. Use 'poll' or 'handle'.`);
    process.exit(1);
  }
}

main().catch((e) => {
  log.error("Fatal message handler error", { error: e instanceof Error ? e.message : String(e) });
  process.exit(1);
});
