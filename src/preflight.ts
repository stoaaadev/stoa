// stoa/src/preflight.ts — Pre-execution checks before agent skill execution

import { getCronState, getPositions, getPortfolioState } from "./memory.js";
import { getHealthReport } from "./health.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import { canRequest } from "./ratelimit.js";

const log = createLogger("preflight");

export interface PreflightResult {
  pass: boolean;
  checks: { name: string; passed: boolean; detail?: string }[];
  blocking_reason?: string;
}

export async function runPreflight(agent: string, skill: string): Promise<PreflightResult> {
  const checks: { name: string; passed: boolean; detail?: string }[] = [];
  let blocking_reason: string | undefined;

  // 1. Is the swarm halted? (only guardian can run during halt)
  const cronState = getCronState();
  const isHalted = cronState.swarm_status === "halted" || cronState.swarm_status === "cooldown";
  const haltCheck = !isHalted || agent === "guardian";
  checks.push({
    name: "swarm_not_halted",
    passed: haltCheck,
    detail: isHalted ? `Swarm status: ${cronState.swarm_status}` : undefined,
  });
  if (!haltCheck) {
    blocking_reason = `Swarm is ${cronState.swarm_status} — only guardian may execute`;
  }

  // 2. Is balance sufficient for the intended operation?
  const portfolio = getPortfolioState();
  const balanceOk = portfolio.total_value_sol > 0 || agent !== "executor";
  checks.push({
    name: "balance_sufficient",
    passed: balanceOk,
    detail: balanceOk ? undefined : `Portfolio SOL balance: ${portfolio.total_value_sol}`,
  });
  if (!balanceOk && !blocking_reason) {
    blocking_reason = "Insufficient SOL balance for executor operations";
  }

  // 3. Circuit breaker: has the skill been failing too often?
  const healthReport = getHealthReport(agent, skill);
  const consecutiveFailures = healthReport.recent_failures;
  const circuitOpen = consecutiveFailures >= 3 && healthReport.avg_score <= 2;
  checks.push({
    name: "circuit_breaker",
    passed: !circuitOpen,
    detail: circuitOpen
      ? `Skill ${agent}/${skill} has ${consecutiveFailures} recent failures (avg score: ${healthReport.avg_score})`
      : undefined,
  });
  if (circuitOpen && !blocking_reason) {
    blocking_reason = `Circuit breaker open: ${agent}/${skill} has failed ${consecutiveFailures} times consecutively (avg score ${healthReport.avg_score})`;
    log.warn(`Circuit breaker tripped for ${agent}/${skill}`, {
      recent_failures: consecutiveFailures,
      avg_score: healthReport.avg_score,
    });
  }

  // 4. Is the rate limit OK?
  const rateLimitOk = canRequest("solana_rpc");
  checks.push({
    name: "rate_limit",
    passed: rateLimitOk,
    detail: rateLimitOk ? undefined : "Rate limit exhausted for solana_rpc",
  });
  if (!rateLimitOk && !blocking_reason) {
    blocking_reason = "Rate limit exhausted — retry later";
  }

  // 5. For executor + execute-trade: check position limits
  if (agent === "executor" && skill === "execute-trade") {
    const positions = getPositions();
    const positionCountOk = positions.length < 5;
    checks.push({
      name: "position_count_limit",
      passed: positionCountOk,
      detail: positionCountOk
        ? undefined
        : `Current positions: ${positions.length} (max: 5)`,
    });
    if (!positionCountOk && !blocking_reason) {
      blocking_reason = `Position count limit reached: ${positions.length}/5`;
    }

    // Check total position value against max configured in stoa.yml
    const config = loadConfig();
    const executorConfig = config.agents["executor"];
    const maxPositionUsd = (executorConfig?.var?.max_position_usd as number) || 100;
    const totalPositionValue = positions.reduce((sum, p) => {
      const value = (p as unknown as Record<string, unknown>).value_usd as number || 0;
      return sum + value;
    }, 0);
    const positionValueOk = totalPositionValue < maxPositionUsd * 5;
    checks.push({
      name: "position_value_limit",
      passed: positionValueOk,
      detail: positionValueOk
        ? undefined
        : `Total position value: $${totalPositionValue} (max: $${maxPositionUsd * 5})`,
    });
    if (!positionValueOk && !blocking_reason) {
      blocking_reason = `Total position value exceeds limit: $${totalPositionValue}`;
    }
  }

  const pass = checks.every((c) => c.passed);

  if (!pass) {
    log.warn(`Preflight FAILED for ${agent}/${skill}`, { blocking_reason, checks });
  } else {
    log.info(`Preflight passed for ${agent}/${skill}`);
  }

  return { pass, checks, blocking_reason };
}
