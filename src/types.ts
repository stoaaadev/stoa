// stoa/src/types.ts — Core type definitions

export interface StoaConfig {
  version: number;
  defaults: {
    model: string;
    chain: string;
    rpc: string;
    gateway: string;
    commit: boolean;
  };
  notifications: {
    telegram?: { enabled: boolean; bot_token: string; chat_id: string };
    discord?: { enabled: boolean; webhook: string; bot_token?: string; channel_id?: string };
    slack?: { enabled: boolean; bot_token?: string; channel_id?: string; webhook?: string };
  };
  agents: Record<string, AgentConfig>;
  mesh: { max_history: number; ttl_hours: number };
  rules: string[];
}

export interface AgentConfig {
  role: string;
  skills: string[];
  schedule: string | null;
  triggers?: AgentTrigger[];
  model?: string;
  var?: Record<string, unknown>;
}

export interface AgentTrigger {
  on: "mesh" | "webhook";
  from?: string;
  type?: string;
}

export interface MeshMessage {
  from: string;
  to: string | string[];
  type: string;
  id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface CronState {
  agents: Record<
    string,
    {
      last_dispatch: string;
      last_status: "success" | "failed" | "skipped";
      run_count: number;
    }
  >;
  swarm_status: "active" | "cooldown" | "halted";
  cooldown_until?: string;
}

export interface Position {
  token: string;
  token_address: string;
  entry_price: number;
  amount: number;
  entry_time: string;
  stop_loss_pct: number;
  take_profit_pct: number;
  tx_signature: string;
  signal_id: string;
}

export interface PortfolioState {
  timestamp: string;
  total_value_usd: number;
  total_value_sol: number;
  peak_value_usd: number;
  drawdown_pct: number;
  open_positions: number;
  status: "active" | "cooldown" | "halted";
  alerts: string[];
}

// --- Chain types ---

export interface ChainDefinition {
  name: string;
  steps: Record<string, ChainStepDef>;
  on_failure: "stop" | "continue" | "retry";
  max_retries: number;
  schedule?: string;
}

export interface ChainStepDef {
  agent: string;
  skill: string;
  depends_on?: string[];
  condition?: string;
}

// --- Health types ---

export interface HealthReport {
  timestamp: string;
  overall_status: "healthy" | "degraded" | "critical";
  agents: Record<string, AgentHealthStatus>;
  recommendations: string[];
}

export interface AgentHealthStatus {
  status: "healthy" | "degraded" | "failing";
  avg_score: number;
  issues: string[];
}

// --- Extended config types ---

export interface StoaConfigV2 extends StoaConfig {
  chains?: Record<string, ChainDefinition>;
  health?: {
    scoring_model: string;
    repair_cooldown_minutes: number;
    max_repairs_per_hour: number;
  };
  security?: {
    scan_skills: boolean;
    tool_allowlists: Record<string, string[]>;
    protected_paths: string[];
  };
}

// --- Webhook types ---

export interface WebhookTrigger {
  on: "webhook";
  event_type: string;
  source?: string;
}

// --- Inbound messaging types ---

export interface MessageState {
  telegram_offset?: number;
  discord_last_ids: Record<string, string>;
  slack_last_ts: Record<string, string>;
  processed_hashes: string[];
}

export interface InboundMessage {
  source: "telegram" | "discord" | "slack" | "manual";
  text: string;
  sender?: string;
  timestamp: string;
  message_id?: string;
}
