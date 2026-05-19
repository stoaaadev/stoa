// stoa/src/mesh.ts — Inter-agent message bus (git-backed)
//
// Agents communicate by reading/writing JSON files in memory/mesh/.
// Each agent has an inbox: memory/mesh/{agent-name}.json
// Messages are append-only, pruned by TTL and max_history.
//
// Concurrency safety: all writes use atomic file locking (mkdir-based)
// to prevent message loss when multiple agents write simultaneously.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, rmSync, renameSync } from "fs";
import { join, dirname } from "path";
import type { MeshMessage, StoaConfig } from "./types.js";

const MESH_DIR = "memory/mesh";
const LOCK_TIMEOUT_MS = 10_000;
const LOCK_RETRY_INTERVAL_MS = 50;
const LOCK_STALE_MS = 30_000;

function ensureDir(): void {
  if (!existsSync(MESH_DIR)) {
    mkdirSync(MESH_DIR, { recursive: true });
  }
}

function inboxPath(agent: string): string {
  return `${MESH_DIR}/${agent}.json`;
}

function lockPath(agent: string): string {
  return `${MESH_DIR}/.${agent}.lock`;
}

/**
 * Acquire an exclusive lock on an agent's inbox using mkdir (atomic on all OS).
 * Returns a release function. Throws if lock cannot be acquired within timeout.
 */
function acquireLock(agent: string): () => void {
  const lock = lockPath(agent);
  const deadline = Date.now() + LOCK_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      mkdirSync(lock);
      // Lock acquired — write a timestamp so stale locks can be detected
      writeFileSync(join(lock, "pid"), `${process.pid}:${Date.now()}`);
      return () => {
        try { rmSync(lock, { recursive: true, force: true }); } catch {}
      };
    } catch {
      // Lock exists — check if stale
      try {
        const pidFile = join(lock, "pid");
        if (existsSync(pidFile)) {
          const content = readFileSync(pidFile, "utf-8");
          const lockTime = parseInt(content.split(":")[1] || "0");
          if (Date.now() - lockTime > LOCK_STALE_MS) {
            // Stale lock — force remove and retry
            rmSync(lock, { recursive: true, force: true });
            continue;
          }
        }
      } catch {}

      // Wait and retry
      const waitUntil = Date.now() + LOCK_RETRY_INTERVAL_MS;
      while (Date.now() < waitUntil) { /* spin */ }
    }
  }

  throw new Error(`[stoa mesh] Failed to acquire lock for ${agent} inbox after ${LOCK_TIMEOUT_MS}ms`);
}

/**
 * Atomically write JSON to a file using write-to-temp + rename.
 * rename() is atomic on POSIX, preventing partial reads.
 */
function atomicWriteJSON(filePath: string, data: unknown): void {
  const dir = dirname(filePath);
  const tmpPath = join(dir, `.tmp-${process.pid}-${Date.now()}.json`);
  writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  renameSync(tmpPath, filePath);
}

/** Read all messages in an agent's inbox */
export function readInbox(agent: string): MeshMessage[] {
  const path = inboxPath(agent);
  if (!existsSync(path)) return [];

  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as MeshMessage[];
  } catch (e) {
    console.error(`[stoa mesh] failed to read inbox for ${agent}:`, e instanceof Error ? e.message : e);
    return [];
  }
}

/** Read only new messages (filter by type and/or sender) */
export function readMessages(
  agent: string,
  filter?: { from?: string; type?: string }
): MeshMessage[] {
  let messages = readInbox(agent);

  if (filter?.from) {
    messages = messages.filter((m) => m.from === filter.from);
  }
  if (filter?.type) {
    messages = messages.filter((m) => m.type === filter.type);
  }

  return messages;
}

/** Post a message to one or more agent inboxes (concurrency-safe) */
export function postMessage(
  message: Omit<MeshMessage, "id" | "timestamp">
): void {
  ensureDir();

  const fullMessage: MeshMessage = {
    ...message,
    id: `${message.from}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  const recipients = Array.isArray(message.to) ? message.to : [message.to];

  for (const recipient of recipients) {
    const release = acquireLock(recipient);
    try {
      const inbox = readInbox(recipient);
      inbox.push(fullMessage);
      atomicWriteJSON(inboxPath(recipient), inbox);
    } finally {
      release();
    }
  }
}

/** Prune old messages based on TTL and max history (concurrency-safe) */
export function pruneInbox(
  agent: string,
  config: StoaConfig["mesh"]
): void {
  const release = acquireLock(agent);
  try {
    const messages = readInbox(agent);
    const cutoff = Date.now() - config.ttl_hours * 60 * 60 * 1000;

    const pruned = messages
      .filter((m) => new Date(m.timestamp).getTime() > cutoff)
      .slice(-config.max_history);

    atomicWriteJSON(inboxPath(agent), pruned);
  } finally {
    release();
  }
}

/** Clear an agent's inbox after processing (concurrency-safe) */
export function clearInbox(agent: string): void {
  const release = acquireLock(agent);
  try {
    atomicWriteJSON(inboxPath(agent), []);
  } finally {
    release();
  }
}

/** Check if any agent has posted a halt message */
export function isHalted(agent: string): boolean {
  const messages = readInbox(agent);
  const halts = messages.filter((m) => m.type === "halt" && !m.data?._acknowledged);

  if (halts.length === 0) return false;

  // A halt is active if:
  // 1. No cooldown_until set (permanent halt until manually cleared), OR
  // 2. cooldown_until is in the future
  const latest = halts[halts.length - 1];
  const cooldownUntil = latest.data?.cooldown_until as string | undefined;

  if (!cooldownUntil) return true; // permanent halt — no expiry
  return new Date(cooldownUntil).getTime() > Date.now();
}

/** Acknowledge messages by marking them as processed (concurrency-safe) */
export function acknowledgeMessages(agent: string, messageIds: string[]): void {
  const release = acquireLock(agent);
  try {
    const messages = readInbox(agent);
    const idSet = new Set(messageIds);

    const updated = messages.map((m) => {
      if (idSet.has(m.id)) {
        return { ...m, data: { ...m.data, _acknowledged: true, _ack_at: new Date().toISOString() } };
      }
      return m;
    });

    atomicWriteJSON(inboxPath(agent), updated);
  } finally {
    release();
  }
}

/** Get only unacknowledged messages */
export function getUnacknowledgedMessages(agent: string): MeshMessage[] {
  const messages = readInbox(agent);
  return messages.filter((m) => !m.data?._acknowledged);
}

/** Get mesh statistics */
export function getMeshStats(): Record<string, { total: number; unread: number }> {
  const stats: Record<string, { total: number; unread: number }> = {};

  if (!existsSync(MESH_DIR)) return stats;

  const files: string[] = readdirSync(MESH_DIR).filter((f: string) => f.endsWith(".json"));
  for (const f of files) {
    const agent = f.replace(".json", "");
    const messages = readInbox(agent);
    const unread = messages.filter((m) => !m.data?._acknowledged).length;
    stats[agent] = { total: messages.length, unread };
  }

  return stats;
}
