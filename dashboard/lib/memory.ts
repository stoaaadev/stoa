import fs from 'fs'
import path from 'path'
import { PATHS } from './config'
import type {
  CronState, Position, PortfolioState, MeshMessage,
  TxLogEntry, TokenUsageRow, SkillHealthEntry, ActivityEntry,
} from './types'

function readJSON<T>(filePath: string, fallback: T): T {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function getCronState(): CronState {
  return readJSON<CronState>(PATHS.cronState, {
    agents: {},
    swarm_status: 'halted',
  })
}

export function getPositions(): Position[] {
  return readJSON<Position[]>(PATHS.positions, [])
}

export function getPortfolioState(): PortfolioState {
  return readJSON<PortfolioState>(PATHS.portfolioState, {
    timestamp: '',
    total_value_usd: 0,
    total_value_sol: 0,
    peak_value_usd: 0,
    drawdown_pct: 0,
    open_positions: 0,
    status: 'unknown',
    alerts: [],
  })
}

export function getTxLog(): TxLogEntry[] {
  return readJSON<TxLogEntry[]>(PATHS.txLog, [])
}

export function getMeshMessages(): Record<string, MeshMessage[]> {
  const result: Record<string, MeshMessage[]> = {}
  try {
    const files = fs.readdirSync(PATHS.mesh)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const agent = file.replace('.json', '')
      result[agent] = readJSON<MeshMessage[]>(path.join(PATHS.mesh, file), [])
    }
  } catch { /* empty */ }
  return result
}

export function getTokenUsage(): TokenUsageRow[] {
  try {
    const raw = fs.readFileSync(PATHS.tokenUsage, 'utf-8')
    const lines = raw.trim().split('\n')
    if (lines.length < 2) return []
    return lines.slice(1).map(line => {
      const parts = line.split(',')
      return {
        timestamp: parts[0],
        agent: parts[1],
        skill: parts[2],
        model: parts[3],
        input_tokens: parseInt(parts[4]) || 0,
        output_tokens: parseInt(parts[5]) || 0,
        total_tokens: parseInt(parts[6]) || 0,
        cost_usd: parseFloat(parts[7]) || 0,
        duration_ms: parseInt(parts[8]) || 0,
      }
    })
  } catch {
    return []
  }
}

export function getSkillHealth(): Record<string, SkillHealthEntry> {
  const result: Record<string, SkillHealthEntry> = {}
  try {
    const files = fs.readdirSync(PATHS.skillHealth)
    for (const file of files) {
      if (!file.endsWith('.json')) continue
      const name = file.replace('.json', '')
      result[name] = readJSON(path.join(PATHS.skillHealth, file), { scores: [], avg: 0 })
    }
  } catch { /* empty */ }
  return result
}

export function getRecentActivity(limit = 20): ActivityEntry[] {
  const activities: ActivityEntry[] = []

  // From mesh messages
  const mesh = getMeshMessages()
  for (const [agent, messages] of Object.entries(mesh)) {
    for (const msg of messages) {
      activities.push({
        timestamp: msg.timestamp,
        agent: typeof msg.from === 'string' ? msg.from : agent,
        type: msg.type,
        summary: summarizeMessage(msg),
      })
    }
  }

  // From tx log
  const txLog = getTxLog()
  for (const tx of txLog) {
    activities.push({
      timestamp: tx.timestamp,
      agent: 'executor',
      type: 'trade',
      summary: `${tx.action.toUpperCase()} ${tx.amount} ${tx.token} @ $${tx.price} — ${tx.status}`,
    })
  }

  // From token usage (as run records)
  const usage = getTokenUsage()
  for (const row of usage) {
    activities.push({
      timestamp: row.timestamp,
      agent: row.agent,
      type: 'run',
      summary: `${row.skill} completed (${row.total_tokens} tokens, $${row.cost_usd.toFixed(4)})`,
    })
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  return activities.slice(0, limit)
}

function summarizeMessage(msg: MeshMessage): string {
  const data = msg.data || {}
  switch (msg.type) {
    case 'halt':
      return `HALT: ${data.reason || 'Unknown reason'}`
    case 'feedback':
      return `Feedback on ${data.signal_id}: ${data.verdict} (score: ${data.score})`
    case 'signal':
      return `Signal: ${data.token || data.signal_id || 'unknown'}`
    case 'trade-signal':
      return `Trade signal: ${data.action || 'unknown'} ${data.token || ''}`
    default:
      return `${msg.type} message from ${msg.from}`
  }
}

export function getLogFiles(): string[] {
  try {
    return fs.readdirSync(PATHS.logs).filter(f => f.endsWith('.json') || f.endsWith('.md'))
  } catch {
    return []
  }
}

export function getDedupState(): Array<{ hash: string; agent: string; skill: string; dispatched_at: string }> {
  return readJSON(PATHS.dedupState, [])
}

export function getOutputFiles(): Array<{ name: string; content: string; modified: string }> {
  try {
    const files = fs.readdirSync(PATHS.outputs).filter(f => f !== '.gitkeep')
    return files.map(f => {
      const filePath = path.join(PATHS.outputs, f)
      const stat = fs.statSync(filePath)
      return {
        name: f,
        content: fs.readFileSync(filePath, 'utf-8'),
        modified: stat.mtime.toISOString(),
      }
    }).sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime())
  } catch {
    return []
  }
}
