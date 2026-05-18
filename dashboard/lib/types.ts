/* ── Stoa Dashboard Type Definitions ── */

export type SwarmStatus = 'active' | 'cooldown' | 'halted'

export interface AgentDef {
  name: string
  role: string
  skills: string[]
  schedule: string | null
  triggers?: { on: string; from: string; type: string }[]
  var?: Record<string, unknown>
}

export interface CronState {
  agents: Record<string, unknown>
  swarm_status: SwarmStatus
  cooldown_until?: string
}

export interface Position {
  token: string
  token_address: string
  entry_price: number
  amount: number
  entry_time: string
  stop_loss_pct: number
  take_profit_pct: number
  tx_signature: string
  signal_id: string
}

export interface PortfolioState {
  timestamp: string
  total_value_usd: number
  total_value_sol: number
  peak_value_usd: number
  drawdown_pct: number
  open_positions: number
  status: string
  alerts: string[]
}

export interface MeshMessage {
  from: string
  to: string | string[]
  type: string
  data: Record<string, unknown>
  id: string
  timestamp: string
}

export interface TxLogEntry {
  timestamp: string
  action: string
  token: string
  amount: number
  price: number
  status: string
  tx_signature: string
}

export interface TokenUsageRow {
  timestamp: string
  agent: string
  skill: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  cost_usd: number
  duration_ms: number
}

export interface SkillHealthEntry {
  scores: number[]
  avg: number
  last_run?: string
}

export interface SkillConfig {
  name: string
  agent: string
  schedule: string | null
}

export interface ActivityEntry {
  timestamp: string
  agent: string
  type: string
  summary: string
}

export interface AnalyticsData {
  totalRuns: number
  totalTokens: number
  totalCost: number
  avgDuration: number
  byAgent: Record<string, { runs: number; tokens: number; cost: number }>
  bySkill: Record<string, { runs: number; tokens: number; cost: number }>
  costOverTime: { date: string; cost: number }[]
  tokenOverTime: { date: string; tokens: number }[]
}

export interface RunEntry {
  timestamp: string
  agent: string
  skill: string
  status: string
  duration_ms?: number
  tokens?: number
  cost?: number
}
