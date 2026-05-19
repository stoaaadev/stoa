// stoa/src/security.ts — Security constraints and validation
//
// Multi-layered security: tool allowlists, command denylist, path protection,
// prompt injection detection (pattern + heuristic + structural analysis).

import { readFileSync, existsSync } from "fs";
import { createLogger } from "./logger.js";

const log = createLogger("security");

/** Tool allowlist per agent role — limits what each agent can do */
export const AGENT_TOOL_ALLOWLIST: Record<string, string[]> = {
  scout: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  analyst: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  executor: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  guardian: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
  researcher: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch", "WebSearch"],
  writer: ["Read", "Write", "Edit", "Bash", "Glob", "Grep", "WebFetch", "WebSearch"],
  ops: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
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
  "python.*-c.*import",
  "node.*-e.*require",
  "nc -l",
  "ncat",
  "socat",
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

  // Check for backgrounding + network exfiltration
  if (/&\s*$/.test(normalized) && /curl|wget|nc|ncat/.test(normalized)) {
    return { safe: false, reason: "Backgrounded network command not allowed" };
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

// ─── Prompt Injection Detection (multi-layer) ───

/** Layer 1: Known injection patterns (literal and regex) */
const INJECTION_PATTERNS: { pattern: RegExp; desc: string; severity: "high" | "medium" }[] = [
  // Direct instruction override
  { pattern: /ignore\s+(all\s+)?previous\s+instructions/i, desc: "Instruction override attempt", severity: "high" },
  { pattern: /ignore\s+(all\s+)?above\s+(instructions|text|context)/i, desc: "Instruction override attempt", severity: "high" },
  { pattern: /disregard\s+(all\s+)?(previous|prior|above|earlier)/i, desc: "Instruction override (disregard)", severity: "high" },
  { pattern: /forget\s+(everything|all|what)\s+(you|i)\s+(said|told|know)/i, desc: "Memory wipe attempt", severity: "high" },
  { pattern: /override\s+(your|the|all)\s+(instructions|rules|constraints|safety)/i, desc: "Override attempt", severity: "high" },
  { pattern: /do\s+not\s+follow\s+(your|the|any)\s+(original|previous|prior)/i, desc: "Instruction negation", severity: "high" },

  // Role reassignment
  { pattern: /you\s+are\s+now\s+(a|an|the|my)\b/i, desc: "Role reassignment attempt", severity: "high" },
  { pattern: /from\s+now\s+on,?\s+you\s+(are|will|should|must)\b/i, desc: "Role reassignment attempt", severity: "high" },
  { pattern: /act\s+as\s+(if\s+you\s+are|a|an|my)\b/i, desc: "Role play injection", severity: "medium" },
  { pattern: /pretend\s+(to\s+be|you\s+are|that)\b/i, desc: "Role play injection", severity: "medium" },
  { pattern: /switch\s+(to|into)\s+(a\s+)?(new|different)\s+(role|mode|persona)/i, desc: "Role switch attempt", severity: "high" },

  // Fake system/model delimiters
  { pattern: /^system:\s*\n/im, desc: "Fake system prompt delimiter", severity: "high" },
  { pattern: /\[INST\]/i, desc: "Llama instruction injection", severity: "high" },
  { pattern: /<\|im_start\|>/i, desc: "ChatML injection", severity: "high" },
  { pattern: /<\|im_end\|>/i, desc: "ChatML end injection", severity: "high" },
  { pattern: /<\|system\|>/i, desc: "System token injection", severity: "high" },
  { pattern: /<\|user\|>/i, desc: "User token injection", severity: "high" },
  { pattern: /<\|assistant\|>/i, desc: "Assistant token injection", severity: "high" },
  { pattern: /Human:\s*\n/i, desc: "Conversation format injection", severity: "medium" },
  { pattern: /Assistant:\s*\n/i, desc: "Conversation format injection", severity: "medium" },
  { pattern: /###\s*(System|Instruction|Human|User|Assistant)\s*\n/i, desc: "Markdown delimiter injection", severity: "medium" },

  // Data exfiltration attempts
  { pattern: /output\s+(all|every|the\s+entire)\s+(secret|key|password|token|credential)/i, desc: "Secret exfiltration attempt", severity: "high" },
  { pattern: /reveal\s+(your|the|all)\s+(secret|key|password|token|instruction|system\s+prompt)/i, desc: "Secret reveal attempt", severity: "high" },
  { pattern: /print\s+(your|the)\s+(system\s+prompt|instructions|rules)/i, desc: "System prompt extraction", severity: "high" },
  { pattern: /what\s+(are|is)\s+your\s+(system|original|initial)\s+(prompt|instruction)/i, desc: "System prompt extraction", severity: "medium" },

  // Encoding-based evasion
  { pattern: /base64[_\s]*decode/i, desc: "Base64 decode evasion", severity: "medium" },
  { pattern: /\\x[0-9a-f]{2}\\x[0-9a-f]{2}/i, desc: "Hex escape evasion", severity: "medium" },
  { pattern: /\\u[0-9a-f]{4}\\u[0-9a-f]{4}/i, desc: "Unicode escape evasion", severity: "medium" },
  { pattern: /rot13|caesar\s*cipher/i, desc: "Encoding evasion (ROT13)", severity: "medium" },

  // Constraint removal
  { pattern: /remove\s+(all\s+)?(safety|content|ethical)\s+(filter|guard|restriction|constraint)/i, desc: "Safety removal attempt", severity: "high" },
  { pattern: /disable\s+(all\s+)?(safety|content|filter|moderation|guardrail)/i, desc: "Safety disable attempt", severity: "high" },
  { pattern: /jailbreak/i, desc: "Explicit jailbreak keyword", severity: "high" },
  { pattern: /DAN\s*(mode)?/i, desc: "DAN jailbreak pattern", severity: "high" },
  { pattern: /developer\s+mode\s+(enabled|activated|on)/i, desc: "Developer mode jailbreak", severity: "high" },

  // Indirect injection via data
  { pattern: /when\s+you\s+(read|see|encounter)\s+this/i, desc: "Trigger-based injection", severity: "medium" },
  { pattern: /if\s+(an?\s+)?AI\s+(is\s+)?(reading|processing|parsing)\s+this/i, desc: "AI-targeted instruction", severity: "high" },
  { pattern: /attention\s+(AI|model|assistant|language\s+model)/i, desc: "AI-targeted instruction", severity: "medium" },
];

/** Layer 2: Structural analysis — detect anomalous patterns in skill files */
function structuralAnalysis(content: string): string[] {
  const issues: string[] = [];

  // Check for suspicious density of control phrases
  const controlPhrases = content.match(/\b(must|shall|always|never|important|critical|mandatory|override|ignore|forget|disregard)\b/gi) || [];
  const wordCount = content.split(/\s+/).length;
  const controlDensity = controlPhrases.length / wordCount;
  if (controlDensity > 0.05 && wordCount > 50) {
    issues.push(`High control-phrase density: ${(controlDensity * 100).toFixed(1)}% (${controlPhrases.length}/${wordCount} words)`);
  }

  // Check for hidden text using zero-width characters
  const zwcPatterns = /[\u200B\u200C\u200D\u2060\uFEFF]/g;
  const zwcMatches = content.match(zwcPatterns);
  if (zwcMatches && zwcMatches.length > 2) {
    issues.push(`Hidden zero-width characters detected: ${zwcMatches.length} occurrences`);
  }

  // Check for Unicode homoglyphs (Cyrillic/Greek lookalikes for Latin)
  const homoglyphRanges = /[\u0400-\u04FF\u0370-\u03FF]/g;
  const homoglyphMatches = content.match(homoglyphRanges);
  if (homoglyphMatches && homoglyphMatches.length > 0) {
    // Only flag if mixed with ASCII (pure Cyrillic/Greek text is fine)
    const hasAsciiLetters = /[a-zA-Z]/.test(content);
    if (hasAsciiLetters) {
      issues.push(`Mixed-script text with potential homoglyphs: ${homoglyphMatches.length} non-Latin chars in Latin text`);
    }
  }

  // Check for abnormally long single lines (may contain obfuscated payloads)
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].length > 2000 && !/^```/.test(lines[i])) {
      issues.push(`Abnormally long line ${i + 1}: ${lines[i].length} chars (possible obfuscated payload)`);
    }
  }

  // Check for markdown comments hiding instructions (HTML comments)
  const htmlComments = content.match(/<!--[\s\S]*?-->/g) || [];
  for (const comment of htmlComments) {
    // Check if comment contains instruction-like content
    if (/\b(execute|run|ignore|override|forget|system|instruction)\b/i.test(comment)) {
      issues.push("HTML comment contains suspicious instruction-like content");
    }
  }

  return issues;
}

/** Layer 3: Entropy check — detect base64/encoded blobs that may hide instructions */
function entropyCheck(content: string): string[] {
  const issues: string[] = [];

  // Find long stretches of high-entropy text (possible encoded payloads)
  // Exclude code blocks and known safe patterns (URLs, hashes, addresses)
  const strippedContent = content.replace(/```[\s\S]*?```/g, ""); // strip code blocks
  const chunks = strippedContent.match(/[A-Za-z0-9+/=]{80,}/g) || [];

  for (const chunk of chunks) {
    // Skip if it looks like a URL, file path, or known format
    if (/^https?:/.test(chunk) || /^[a-f0-9]+$/i.test(chunk)) continue;

    // Calculate Shannon entropy
    const freq = new Map<string, number>();
    for (const c of chunk) freq.set(c, (freq.get(c) || 0) + 1);
    let entropy = 0;
    for (const count of freq.values()) {
      const p = count / chunk.length;
      entropy -= p * Math.log2(p);
    }

    if (entropy > 4.5 && chunk.length > 100) {
      issues.push(`High-entropy blob detected (${chunk.length} chars, entropy=${entropy.toFixed(2)}) — possible encoded payload`);
    }
  }

  return issues;
}

/** Scan a skill file for potential prompt injection (all layers) */
export function scanSkillForInjection(skillPath: string): { safe: boolean; issues: string[] } {
  const issues: string[] = [];

  if (!existsSync(skillPath)) {
    return { safe: false, issues: ["Skill file not found"] };
  }

  const content = readFileSync(skillPath, "utf-8");

  // Layer 1: Pattern matching
  for (const { pattern, desc, severity } of INJECTION_PATTERNS) {
    if (pattern.test(content)) {
      issues.push(`[${severity}] ${desc}`);
    }
  }

  // Layer 2: Structural analysis
  issues.push(...structuralAnalysis(content));

  // Layer 3: Entropy analysis
  issues.push(...entropyCheck(content));

  // Determine safety: any high-severity finding = unsafe
  const hasHighSeverity = issues.some((i) => i.startsWith("[high]"));
  const safe = !hasHighSeverity && issues.length < 3; // multiple medium findings also flag

  if (issues.length > 0) {
    log.warn("Skill security scan found issues", { path: skillPath, issues, safe });
  }

  return { safe, issues };
}
