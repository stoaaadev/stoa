'use client'

import { agentColor, agentIcon } from '@/lib/utils'

interface AgentInfo {
  name: string
  role: string
  skills: string[]
  schedule: string | null
  health: number
  lastActivity: string
}

interface AgentCardProps {
  agent: AgentInfo
  onClick: () => void
}

export function AgentCard({ agent, onClick }: AgentCardProps) {
  const color = agentColor(agent.name)
  const icon = agentIcon(agent.name)

  // Health bar color
  const healthColor = agent.health >= 70
    ? 'bg-emerald-400'
    : agent.health >= 40
    ? 'bg-amber-400'
    : agent.health > 0
    ? 'bg-red-400'
    : 'bg-zinc-700'

  const lastTime = agent.lastActivity
    ? formatRelative(agent.lastActivity)
    : 'No activity'

  return (
    <button
      onClick={onClick}
      className="text-left p-4 rounded-lg bg-surface-raised border border-border-dim hover:border-border-bright transition-all group"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg border"
          style={{
            backgroundColor: `${color}10`,
            borderColor: `${color}30`,
            color,
          }}
        >
          {icon}
        </div>
        <div>
          <div className="text-sm font-bold capitalize group-hover:text-accent transition-colors">
            {agent.name}
          </div>
          <div className="text-[10px] text-text-muted">
            {agent.schedule || 'reactive'}
          </div>
        </div>
      </div>

      {/* Role */}
      <div className="text-xs text-text-secondary mb-3 line-clamp-2 leading-relaxed">
        {agent.role}
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-[10px] text-text-muted mb-3">
        <span>{agent.skills.length} skills</span>
        <span>{lastTime}</span>
      </div>

      {/* Health bar */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-text-muted w-8">HP</span>
        <div className="flex-1 h-1.5 rounded-full bg-surface-overlay overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${healthColor}`}
            style={{ width: `${agent.health}%` }}
          />
        </div>
        <span className="text-[10px] text-text-muted w-8 text-right">
          {agent.health > 0 ? `${agent.health}%` : '--'}
        </span>
      </div>
    </button>
  )
}

function formatRelative(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}
