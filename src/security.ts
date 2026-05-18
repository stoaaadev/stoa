// stoa/src/security.ts — Security constraints and validation
import { readFileSync, existsSync } from "fs";
import { createLogger } from "./logger.js";

const log = createLogger("security");

/** Tool allowlist per agent role — limits what each agent can do */
export const AGENT_TOOL_ALLOWLIST: Record<string, string[]> = {
  scout: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  analyst: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  executor: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  guardian: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
};

/** Bash command denylist — commands that should never be executed */
const DENIED_COMMANDS = [
  "rm -rf /",
  "rm -rf /*",
  "dd if=",
  "mkfs",
  ":(){:|:&};:",
  "chmod 777",
  "curl.*|.*sh",
  "wget.*|.*sh",
  "eval.*base64",
];

/** File paths that agents should never modify */
const PROTECTED_PATHS = [
  "src/",
  ".github/",
  "stoa.yml",
  "package.json",
  "tsconfig.json",
  ".gitignore",
  ".env",
];

export function getToolAllowlist(agent: string): string[] {
  return AGENT_TOOL_ALLOWLIST[agent] || ["Read", "Glob", "Grep"];
}

export function isCommandSafe(command: string): { safe: boolean; reason?: string } {
  const normalized = command.toLowerCase().trim();

  for (const denied of DENIED_COMMANDS) {
    if (new RegExp(denied, "i").test(normalized)) {
      log.error("Blocked dangerous command", { command: normalized, pattern: denied });
      return { safe: false, reason: `Matches denied pattern: ${denied}` };
    }
  }

  // Check for piping to shell
  if (/\|\s*(ba)?sh/.test(normalized) || /\|\s*source/.test(normalized)) {
    return { safe: false, reason: "Piping to shell is not allowed" };
  }

  return { safe: true };
}

export function isPathAllowed(agent: string, path: string): { allowed: boolean; reason?: string } {
  // All agents can write to memory/ and mesh/
  if (path.startsWith("memory/") || path.startsWith("mesh/")) {
    return { allowed: true };
  }

  // Check protected paths
  for (const protected_path of PROTECTED_PATHS) {
    if (path.startsWith(protected_path)) {
      return { allowed: false, reason: `Path ${protected_path} is protected` };
    }
  }

  // .outputs/ is allowed for chain operations
  if (path.startsWith(".outputs/")) {
    return { allowed: true };
  }

  return { allowed: false, reason: `Path not in allowed directories for agent ${agent}` };
}

/** Scan a skill file for potential prompt injection */
export function scanSkillForInjection(skillPath: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!existsSync(skillPath)) {
    return { safe: false, issues: ["Skill file not found"] };
  }

  const content = readFileSync(skillPath, "utf-8");

  // Check for common injection patterns
  const injectionPatterns = [
    { pattern: /ignore.*previous.*instructions/i, desc: "Instruction override attempt" },
    { pattern: /you are now/i, desc: "Role reassignment attempt" },
    { pattern: /^system:\s*\n\s*(you are|ignore|forget|override)/im, desc: "Fake system prompt" },
    { pattern: /\[INST\]/i, desc: "Model-specific instruction injection" },
    { pattern: /<\|im_start\|>/i, desc: "ChatML injection" },
    { pattern: /Human:|Assistant:/i, desc: "Conversation injection" },
  ];

  for (const { pattern, desc } of injectionPatterns) {
    if (pattern.test(content)) {
      issues.push(desc);
    }
  }

  if (issues.length > 0) {
    log.warn("Skill security scan found issues", { path: skillPath, issues });
  }

  return { safe: issues.length === 0, issues };
}
