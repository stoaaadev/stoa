#!/usr/bin/env node
// stoa/src/execute.ts — Agent Executor (Production Grade)
//
// Runs a single agent's skill with full production instrumentation:
// - Quality scoring (1-5 scale with rolling history)
// - Retry with exponential backoff
// - LLM output validation
// - Token usage tracking
// - Structured logging
// - Security enforcement (tool allowlists, path protection)
// - Notification deduplication

import { readFileSync, writeFileSync, existsSync, unlinkSync } from "fs";
import { execSync } from "child_process";
import { loadConfig, getAgent } from "./config.js";
import { readInbox, pruneInbox, acknowledgeMessages } from "./mesh.js";
import { getCronState, setCronState } from "./memory.js";
import { createLogger } from "./logger.js";
import { recordScore, SkillScore } from "./health.js";
import { withRetry, withGitRetry } from "./retry.js";
import { validateOutput } from "./validate.js";
import { getToolAllowlist, scanSkillForInjection } from "./security.js";
import { recordUsage, estimateCost, TokenUsage } from "./tokens.js";
import { isNotificationDuplicate } from "./dedup.js";
import { runPreflight } from "./preflight.js";
import { runPostflight } from "./postflight.js";

const log = createLogger("execute");

const AGENT_NAME = process.env.STOA_AGENT || process.argv[2];
const SKILL_NAME = process.env.STOA_SKILL || process.argv[3];

if (!AGENT_NAME || !SKILL_NAME) {
  console.error("Usage: stoa execute <agent> <skill>");
  console.error("  or set STOA_AGENT and STOA_SKILL env vars");
  process.exit(1);
}

function loadMarkdown(path: string): string {
  if (!existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }
  return readFileSync(path, "utf-8");
}

function buildPrompt(
  agentMd: string,
  skillMd: string,
  inbox: string,
  vars: Record<string, unknown>
): string {
  let prompt = `${agentMd}\n\n---\n\n# Current Skill Execution\n\n${skillMd}`;

  // Inject variables
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = `{${key}}`;
    prompt = prompt.replaceAll(
      placeholder,
      typeof value === "string" ? value : JSON.stringify(value)
    );
  }

  // Append inbox context
  if (inbox && inbox !== "[]") {
    prompt += `\n\n---\n\n# Inbox Messages\n\nThe following messages are in your inbox:\n\`\`\`json\n${inbox}\n\`\`\``;
  }

  // Append runtime context with safety reminders
  prompt += `\n\n---\n\n# Runtime Context\n- Current time: ${new Date().toISOString()}\n- Agent: ${AGENT_NAME}\n- Skill: ${SKILL_NAME}`;
  prompt += `\n- IMPORTANT: Do not fabricate data. If an API call fails, report the failure.`;
  prompt += `\n- IMPORTANT: Do not expose secrets in any output or committed file.`;

  return prompt;
}

interface ExecutionResult {
  success: boolean;
  output: string;
  duration_ms: number;
  exit_code: number;
}

function executeWithClaude(prompt: string, model: string): ExecutionResult {
  const tmpFile = `/tmp/stoa-prompt-${AGENT_NAME}-${Date.now()}.md`;
  const outputFile = `/tmp/stoa-output-${AGENT_NAME}-${Date.now()}.txt`;
  writeFileSync(tmpFile, prompt);

  // Use agent-specific tool allowlist
  const allowedTools = getToolAllowlist(AGENT_NAME).join(",");

  const startTime = Date.now();
  let output = "";
  let exitCode = 0;

  try {
    output = execSync(
      `claude --model ${model} --allowedTools ${allowedTools} --print < ${tmpFile}`,
      {
        encoding: "utf-8",
        timeout: 300_000, // 5 min max
        maxBuffer: 10 * 1024 * 1024, // 10MB output buffer
        env: {
          ...process.env,
          STOA_AGENT: AGENT_NAME,
          STOA_SKILL: SKILL_NAME,
        },
      }
    );

    // Save output for validation
    writeFileSync(outputFile, output);
  } catch (e: unknown) {
    exitCode = 1;
    const err = e as { stdout?: string; stderr?: string; message?: string };
    output = err.stdout || err.stderr || err.message || "Unknown error";
    log.error("Claude execution failed", { error: output.slice(0, 500) });
  } finally {
    try { unlinkSync(tmpFile); } catch {}
    try { unlinkSync(outputFile); } catch {}
  }

  return {
    success: exitCode === 0,
    output,
    duration_ms: Date.now() - startTime,
    exit_code: exitCode,
  };
}

function scoreOutput(result: ExecutionResult): number {
  if (!result.success) return 1;

  let score = 4; // Base score for successful execution

  // Bonus for substantive output
  if (result.output.length > 500) score = Math.min(5, score + 0.5);

  // Penalty for validation warnings
  const validation = validateOutput(result.output, { agent: AGENT_NAME, skill: SKILL_NAME });
  if (validation.warnings.length > 0) score -= 0.5 * validation.warnings.length;
  if (!validation.valid) score = Math.max(1, score - 2);

  // Penalty for very short output (might indicate incomplete execution)
  if (result.output.length < 50 && result.success) score = Math.max(2, score - 1);

  // Penalty for slow execution (> 4 min of 5 min budget)
  if (result.duration_ms > 240_000) score = Math.max(2, score - 0.5);

  return Math.round(Math.max(1, Math.min(5, score)) * 10) / 10;
}

function gitCommit(message: string): void {
  // Use heredoc-style commit to prevent shell injection
  const safeMessage = message.replace(/["\$`\\!]/g, "");

  try {
    execSync("git add memory/ 2>/dev/null || true", { stdio: "pipe" });

    // Check if there are staged changes
    try {
      execSync("git diff --staged --quiet", { stdio: "pipe" });
      return; // No changes
    } catch {
      // Staged changes exist, proceed
    }

    execSync(`git commit -m '${safeMessage}'`, { stdio: "pipe" });

    // Push with retry (5 attempts with exponential backoff)
    for (let attempt = 1; attempt <= 5; attempt++) {
      try {
        execSync("git pull --rebase origin main 2>/dev/null || true", { stdio: "pipe" });
        execSync("git push", { stdio: "pipe" });
        log.info("Git push succeeded", { attempt });
        break;
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        log.warn(`Git push attempt ${attempt}/5 failed`, { error: errMsg });
        if (attempt === 5) {
          log.error("Git push failed after 5 attempts");
        } else {
          // Exponential backoff: 2s, 4s, 8s, 16s
          execSync(`sleep ${Math.pow(2, attempt)}`, { stdio: "pipe" });
        }
      }
    }
  } catch (e) {
    log.error("gitCommit error", { error: e instanceof Error ? e.message : String(e) });
  }
}

function notify(config: ReturnType<typeof loadConfig>, message: string): void {
  // Check notification dedup
  if (isNotificationDuplicate(message, 30)) {
    log.info("Notification deduplicated, skipping");
    return;
  }

  const safeMsg = message.replace(/[^\w\s\-.*|`@:$%()\/]/g, "").slice(0, 500);

  if (config.notifications?.telegram?.enabled) {
    const { bot_token, chat_id } = config.notifications.telegram;
    if (bot_token && chat_id && !bot_token.includes("${")) {
      try {
        execSync(
          `curl -s -X POST "https://api.telegram.org/bot${bot_token}/sendMessage" ` +
            `--data-urlencode "chat_id=${chat_id}" ` +
            `--data-urlencode "text=${safeMsg}" ` +
            `--data-urlencode "parse_mode=Markdown"`,
          { stdio: "pipe", timeout: 10_000 }
        );
      } catch (e) {
        log.warn("Telegram notify failed", { error: e instanceof Error ? e.message : String(e) });
      }
    }
  }

  if (config.notifications?.discord?.enabled) {
    const webhook = config.notifications.discord.webhook;
    if (webhook && !webhook.includes("${")) {
      try {
        const payload = JSON.stringify({ content: safeMsg });
        execSync(
          `curl -s -X POST "${webhook}" -H "Content-Type: application/json" -d @-`,
          { input: payload, stdio: ["pipe", "pipe", "pipe"], timeout: 10_000 }
        );
      } catch (e) {
        log.warn("Discord notify failed", { error: e instanceof Error ? e.message : String(e) });
      }
    }
  }
}

// --- Main ---
async function main() {
  const executionStart = Date.now();
  log.info("Starting execution", { agent: AGENT_NAME, skill: SKILL_NAME });

  const config = loadConfig();
  const agentConfig = getAgent(config, AGENT_NAME);
  const model = agentConfig.model || config.defaults.model;

  // Security: scan skill for injection before execution
  const skillPath = `skills/${SKILL_NAME}/SKILL.md`;
  const scanResult = scanSkillForInjection(skillPath);
  if (!scanResult.safe) {
    log.error("Skill failed security scan — aborting", { issues: scanResult.issues });
    process.exit(1);
  }

  // Preflight checks
  const preflight = await runPreflight(AGENT_NAME, SKILL_NAME);
  if (!preflight.pass) {
    log.error("Preflight failed", {
      agent: AGENT_NAME,
      skill: SKILL_NAME,
      reason: preflight.blocking_reason,
      checks: preflight.checks.filter(c => !c.passed)
    });
    // Record as skipped, not failed
    const state = getCronState();
    state.agents[AGENT_NAME] = {
      ...state.agents[AGENT_NAME],
      last_dispatch: new Date().toISOString(),
      last_status: "skipped",
      run_count: (state.agents[AGENT_NAME]?.run_count || 0) + 1,
    };
    setCronState(state);
    console.log(`[stoa] Preflight blocked: ${preflight.blocking_reason}`);
    process.exit(0); // Clean exit, not a failure
  }
  log.info("Preflight passed", { checks: preflight.checks.length });

  // Load agent definition and skill
  const agentMd = loadMarkdown(`agents/${AGENT_NAME}/AGENT.md`);
  const skillMd = loadMarkdown(skillPath);

  // Load inbox and acknowledge messages
  const inboxMessages = readInbox(AGENT_NAME);
  const inbox = JSON.stringify(inboxMessages, null, 2);

  // Build prompt
  const vars = agentConfig.var || {};
  const prompt = buildPrompt(agentMd, skillMd, inbox, vars);

  log.info("Executing with Claude", { model, prompt_length: prompt.length });

  // Execute with retry on transient failures
  let result: ExecutionResult;
  try {
    result = await withRetry(
      async () => {
        const r = executeWithClaude(prompt, model);
        if (!r.success && r.output.includes("rate_limit")) {
          throw new Error("Rate limited — retrying");
        }
        return r;
      },
      `${AGENT_NAME}/${SKILL_NAME}`,
      { maxAttempts: 2, baseDelay: 5000 }
    );
  } catch {
    result = { success: false, output: "All retry attempts failed", duration_ms: Date.now() - executionStart, exit_code: 1 };
  }

  // Validate output
  const validation = validateOutput(result.output, { agent: AGENT_NAME, skill: SKILL_NAME });
  if (!validation.valid) {
    log.error("Output validation failed — results may be unreliable", { errors: validation.errors });
  }

  // Score output quality
  const score = scoreOutput(result);
  const skillScore: SkillScore = {
    timestamp: new Date().toISOString(),
    agent: AGENT_NAME,
    skill: SKILL_NAME,
    score,
    duration_ms: result.duration_ms,
    error: result.success ? undefined : result.output.slice(0, 200),
    output_size: result.output.length,
  };
  recordScore(skillScore);

  // Record token usage (estimated from output size)
  const estimatedInputTokens = Math.round(prompt.length / 4);
  const estimatedOutputTokens = Math.round(result.output.length / 4);
  const usage: TokenUsage = {
    timestamp: new Date().toISOString(),
    agent: AGENT_NAME,
    skill: SKILL_NAME,
    model,
    input_tokens: estimatedInputTokens,
    output_tokens: estimatedOutputTokens,
    total_tokens: estimatedInputTokens + estimatedOutputTokens,
    cost_usd: estimateCost(model, estimatedInputTokens, estimatedOutputTokens),
    duration_ms: result.duration_ms,
  };
  recordUsage(usage);

  // Postflight verification
  if (result.success) {
    const postflight = await runPostflight(AGENT_NAME, SKILL_NAME, result.output);
    if (!postflight.verified) {
      log.warn("Postflight verification failed", {
        checks: postflight.checks.filter(c => !c.passed),
        warnings: postflight.warnings
      });
      // Don't block, but downgrade score
      skillScore.score = Math.max(1, skillScore.score - 1);
    }
    if (postflight.warnings.length > 0) {
      log.warn("Postflight warnings", { warnings: postflight.warnings });
    }
  }

  // Acknowledge processed inbox messages
  if (inboxMessages.length > 0) {
    acknowledgeMessages(AGENT_NAME, inboxMessages.map(m => m.id));
  }

  // Post-execution
  pruneInbox(AGENT_NAME, config.mesh);

  // Update cron state with enriched data
  const state = getCronState();
  state.agents[AGENT_NAME] = {
    last_dispatch: new Date().toISOString(),
    last_status: result.success ? "success" : "failed",
    run_count: (state.agents[AGENT_NAME]?.run_count || 0) + 1,
  };
  setCronState(state);

  // Git commit
  const commitMsg = `${AGENT_NAME}: ${SKILL_NAME} [${score}/5] @ ${new Date().toISOString()}`;
  if (config.defaults.commit) {
    gitCommit(commitMsg);
  }

  // Notify (include score in notification)
  const statusEmoji = result.success ? "ok" : "FAILED";
  notify(config, `*stoa* | \`${AGENT_NAME}\` ran \`${SKILL_NAME}\` — ${statusEmoji} (${score}/5)`);

  log.info("Execution complete", {
    agent: AGENT_NAME,
    skill: SKILL_NAME,
    success: result.success,
    score,
    duration_ms: result.duration_ms,
    cost_usd: usage.cost_usd.toFixed(4),
  });
}

main().catch((e) => {
  log.error("Fatal execution error", { agent: AGENT_NAME, skill: SKILL_NAME, error: e instanceof Error ? e.message : String(e) });

  // Record failure
  try {
    const state = getCronState();
    state.agents[AGENT_NAME] = {
      ...state.agents[AGENT_NAME],
      last_status: "failed",
    };
    setCronState(state);

    // Record failing score
    recordScore({
      timestamp: new Date().toISOString(),
      agent: AGENT_NAME,
      skill: SKILL_NAME,
      score: 1,
      duration_ms: 0,
      error: e instanceof Error ? e.message : String(e),
      output_size: 0,
    });

    const config = loadConfig();
    if (config.defaults.commit) {
      gitCommit(`${AGENT_NAME}: ${SKILL_NAME} FAILED`);
    }
  } catch (innerErr) {
    log.error("Failed to record failure state", { error: innerErr instanceof Error ? innerErr.message : String(innerErr) });
  }

  process.exit(1);
});
