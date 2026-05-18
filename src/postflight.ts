// stoa/src/postflight.ts — Post-execution verification after agent skill execution

import { createLogger } from "./logger.js";
import { loadConfig } from "./config.js";
import { validateOutput } from "./validate.js";
import { readJSON } from "./memory.js";
import { execSync } from "child_process";

const log = createLogger("postflight");

export interface PostflightResult {
  verified: boolean;
  checks: { name: string; passed: boolean; detail?: string }[];
  warnings: string[];
}

export async function runPostflight(
  agent: string,
  skill: string,
  output: string
): Promise<PostflightResult> {
  const checks: { name: string; passed: boolean; detail?: string }[] = [];
  const warnings: string[] = [];

  // 1. If output contains a tx_signature pattern (base58, 87-88 chars), verify on-chain
  const sigPattern = /[1-9A-HJ-NP-Za-km-z]{87,88}/g;
  const signatures = output.match(sigPattern) || [];

  if (signatures.length > 0) {
    const verified = await verifySignaturesOnChain(signatures);
    checks.push({
      name: "tx_signature_verification",
      passed: verified.allValid,
      detail: verified.allValid
        ? `${signatures.length} signature(s) confirmed on-chain`
        : `Failed to verify: ${verified.invalid.join(", ")}`,
    });
    if (!verified.allValid) {
      warnings.push(`Unverified transaction signatures: ${verified.invalid.join(", ")}`);
    }
  }

  // 2. If output claims a position was opened, verify it appears in memory or mesh
  if (/position.*opened|opened.*position|trade.*executed/i.test(output)) {
    const positions = readJSON<unknown[]>("positions.json", []);
    const meshMessages = readJSON<unknown[]>("mesh/executor.json", []);
    const hasEvidence = positions.length > 0 || meshMessages.length > 0;
    checks.push({
      name: "position_evidence",
      passed: hasEvidence,
      detail: hasEvidence
        ? undefined
        : "Output claims position opened but no evidence in memory or mesh",
    });
    if (!hasEvidence) {
      warnings.push("Position claimed but not found in memory state");
    }
  }

  // 3. Check that no protected files were modified
  const config = loadConfig();
  const security = (config as unknown as Record<string, unknown>).security as
    | { protected_paths?: string[] }
    | undefined;
  const protectedPaths = security?.protected_paths || [
    "src/",
    ".github/",
    "stoa.yml",
    "package.json",
    "tsconfig.json",
  ];
  const protectedCheck = checkProtectedFiles(protectedPaths);
  checks.push({
    name: "protected_files_intact",
    passed: protectedCheck.passed,
    detail: protectedCheck.passed
      ? undefined
      : `Modified protected files: ${protectedCheck.modified.join(", ")}`,
  });
  if (!protectedCheck.passed) {
    warnings.push(`Protected files were modified: ${protectedCheck.modified.join(", ")}`);
  }

  // 4. If agent is executor, validate output for hallucinated transactions
  if (agent === "executor") {
    const validation = validateOutput(output, { agent, skill });
    checks.push({
      name: "output_validation",
      passed: validation.valid,
      detail: validation.valid
        ? undefined
        : `Validation errors: ${validation.errors.join("; ")}`,
    });
    if (validation.warnings.length > 0) {
      warnings.push(...validation.warnings);
    }
    if (!validation.valid) {
      warnings.push("Executor output failed validation — possible hallucinated transaction");
    }
  }

  const verified = checks.every((c) => c.passed);

  if (!verified) {
    log.warn(`Postflight FAILED for ${agent}/${skill}`, { checks, warnings });
  } else {
    log.info(`Postflight verified for ${agent}/${skill}`, {
      warnings_count: warnings.length,
    });
  }

  return { verified, checks, warnings };
}

async function verifySignaturesOnChain(
  signatures: string[]
): Promise<{ allValid: boolean; invalid: string[] }> {
  const rpcUrl = process.env.SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
  const invalid: string[] = [];

  try {
    const body = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getSignatureStatuses",
      params: [signatures, { searchTransactionHistory: true }],
    });

    const result = execSync(
      `curl -s -X POST "${rpcUrl}" -H "Content-Type: application/json" -d '${body}'`,
      { timeout: 10000, encoding: "utf-8" }
    );

    const parsed = JSON.parse(result);
    const statuses = parsed?.result?.value || [];

    for (let i = 0; i < signatures.length; i++) {
      const status = statuses[i];
      if (!status || status.err !== null) {
        invalid.push(signatures[i].slice(0, 16) + "...");
      }
    }
  } catch (err) {
    log.warn("Failed to verify signatures on-chain", {
      error: String(err),
    });
    // If we can't reach RPC, don't block — just warn
    return { allValid: true, invalid: [] };
  }

  return { allValid: invalid.length === 0, invalid };
}

function checkProtectedFiles(protectedPaths: string[]): {
  passed: boolean;
  modified: string[];
} {
  try {
    const diff = execSync("git diff --name-only HEAD~1 HEAD 2>/dev/null || echo ''", {
      encoding: "utf-8",
      timeout: 5000,
    }).trim();

    if (!diff) {
      return { passed: true, modified: [] };
    }

    const changedFiles = diff.split("\n").filter(Boolean);
    const modified = changedFiles.filter((file) =>
      protectedPaths.some((p) => file.startsWith(p))
    );

    return { passed: modified.length === 0, modified };
  } catch {
    // If git is not available or fails, skip this check
    return { passed: true, modified: [] };
  }
}
