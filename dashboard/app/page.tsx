'use client'

import { useState, useEffect, useCallback } from 'react'
import { TopBar } from '@/components/TopBar'
import { LeftSidebar } from '@/components/LeftSidebar'
import { AgentCard } from '@/components/AgentCard'
import { SkillDetail } from '@/components/SkillDetail'
import { RunLog } from '@/components/RunLog'
import { MeshView } from '@/components/MeshView'
import { HealthChart } from '@/components/HealthChart'
import { CostTracker } from '@/components/CostTracker'
import { OutputFeed } from '@/components/OutputFeed'
import { AuthModal } from '@/components/AuthModal'

type View = 'overview' | 'agents' | 'skills' | 'memory' | 'runs' | 'analytics' | 'settings'

interface AgentInfo {
  name: string
  role: string
  skills: string[]
  schedule: string | null
  health: number
  lastActivity: string
}

interface SwarmData {
  status: string
  cooldown_until?: string
  agents: AgentInfo[]
  activities: Array<{ timestamp: string; agent: string; type: string; summary: string }>
  totalSkills: number
  successRate: number
  portfolio: { total_value_usd: number; drawdown_pct: number; open_positions: number }
}

export default function Dashboard() {
  const [view, setView] = useState<View>('overview')
  const [authenticated, setAuthenticated] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [data, setData] = useState<SwarmData | null>(null)
  const [skills, setSkills] = useState<Array<{ name: string; agent: string; schedule: string | null }>>([])
  const [runs, setRuns] = useState<Array<Record<string, unknown>>>([])
  const [analytics, setAnalytics] = useState<Record<string, unknown> | null>(null)
  const [outputs, setOutputs] = useState<Array<{ name: string; content: string; modified: string }>>([])
  const [memory, setMemory] = useState<Record<string, unknown> | null>(null)
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [toast, setToast] = useState('')

  const flash = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchOverview = useCallback(async () => {
    try {
      const [runsRes, skillsRes] = await Promise.all([
        fetch('/api/runs'),
        fetch('/api/skills'),
      ])
      if (runsRes.ok) {
        const d = await runsRes.json()
        setData(d)
        setRuns(d.runs || [])
      }
      if (skillsRes.ok) {
        const d = await skillsRes.json()
        setSkills(d.skills || [])
      }
    } catch { /* ignore */ }
  }, [])

  const fetchAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) setAnalytics(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchMemory = useCallback(async () => {
    try {
      const res = await fetch('/api/memory')
      if (res.ok) setMemory(await res.json())
    } catch { /* ignore */ }
  }, [])

  const fetchOutputs = useCallback(async () => {
    try {
      const res = await fetch('/api/outputs')
      if (res.ok) {
        const d = await res.json()
        setOutputs(d.outputs || [])
      }
    } catch { /* ignore */ }
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth')
      if (res.ok) {
        const d = await res.json()
        setAuthenticated(d.authenticated)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => {
    checkAuth()
    fetchOverview()
  }, [checkAuth, fetchOverview])

  useEffect(() => {
    if (view === 'analytics') fetchAnalytics()
    if (view === 'memory') fetchMemory()
    if (view === 'overview' || view === 'runs') fetchOverview()
  }, [view, fetchAnalytics, fetchMemory, fetchOverview])

  useEffect(() => { fetchOutputs() }, [fetchOutputs])
  useEffect(() => {
    const interval = setInterval(fetchOverview, 15_000)
    return () => clearInterval(interval)
  }, [fetchOverview])

  const handleSync = async () => {
    setSyncing(true)
    try {
      const res = await fetch('/api/sync')
      if (res.ok) {
        flash('Synced from git')
        fetchOverview()
      }
    } finally { setSyncing(false) }
  }

  const handleRunSkill = async (name: string) => {
    try {
      const res = await fetch(`/api/skills/${name}/run`, { method: 'POST' })
      if (res.ok) {
        flash(`Triggered ${name}`)
        setTimeout(fetchOverview, 3000)
      } else {
        const d = await res.json()
        flash(d.error || 'Failed to trigger skill')
      }
    } catch { flash('Network error') }
  }

  const swarmStatus = data?.status || 'halted'
  const agents = data?.agents || []
  const activities = data?.activities || []
  const totalSkills = data?.totalSkills || skills.length
  const successRate = data?.successRate || 0
  const portfolio = data?.portfolio || { total_value_usd: 0, drawdown_pct: 0, open_positions: 0 }

  return (
    <div className="h-screen flex bg-surface bg-grid overflow-hidden">
      <LeftSidebar view={view} setView={setView} agentCount={agents.length} skillCount={totalSkills} />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          swarmStatus={swarmStatus}
          syncing={syncing}
          onSync={handleSync}
          onAuth={() => setShowAuth(true)}
          authenticated={authenticated}
        />

        <main className="flex-1 overflow-y-auto p-6">
          {view === 'overview' && (
            <OverviewPanel
              agents={agents}
              activities={activities}
              totalSkills={totalSkills}
              successRate={successRate}
              swarmStatus={swarmStatus}
              portfolio={portfolio}
              cooldownUntil={data?.cooldown_until}
              onAgentClick={(name) => { setView('agents'); setSelectedSkill(name) }}
            />
          )}

          {view === 'agents' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight">Agent Fleet</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {agents.map(a => (
                  <AgentCard key={a.name} agent={a} onClick={() => setSelectedSkill(a.name)} />
                ))}
              </div>
              {selectedSkill && (
                <MeshView agents={agents.map(a => a.name)} />
              )}
            </div>
          )}

          {view === 'skills' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight">Skills Registry</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {skills.map(s => (
                  <button
                    key={s.name}
                    onClick={() => setSelectedSkill(s.name)}
                    className="text-left p-4 rounded-lg bg-surface-raised border border-border-dim hover:border-accent/40 transition-colors"
                  >
                    <div className="text-sm font-bold text-text-primary">{s.name}</div>
                    <div className="text-xs text-text-muted mt-1">Agent: {s.agent}</div>
                    <div className="text-xs text-text-muted">Schedule: {s.schedule || 'reactive'}</div>
                  </button>
                ))}
              </div>
              {selectedSkill && (
                <SkillDetail
                  skillName={selectedSkill}
                  skills={skills}
                  runs={runs}
                  onRun={handleRunSkill}
                  onClose={() => setSelectedSkill(null)}
                />
              )}
            </div>
          )}

          {view === 'memory' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight">Memory Explorer</h2>
              {memory ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(memory).map(([key, val]) => (
                    <div key={key} className="p-4 rounded-lg bg-surface-raised border border-border-dim">
                      <h3 className="text-sm font-bold text-accent mb-2">{key}</h3>
                      <pre className="text-xs text-text-secondary overflow-auto max-h-64 whitespace-pre-wrap">
                        {typeof val === 'string' ? val : JSON.stringify(val, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-text-muted text-sm">Loading memory files...</div>
              )}
            </div>
          )}

          {view === 'runs' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight">Run History</h2>
              <RunLog runs={runs} />
            </div>
          )}

          {view === 'analytics' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight">Analytics</h2>
              {analytics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <HealthChart data={analytics} />
                    <CostTracker data={analytics} />
                  </div>
                  <OutputFeed outputs={outputs} />
                </div>
              ) : (
                <div className="text-text-muted text-sm">Loading analytics...</div>
              )}
            </div>
          )}

          {view === 'settings' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold tracking-tight">Settings</h2>
              <div className="p-6 rounded-lg bg-surface-raised border border-border-dim max-w-lg">
                <h3 className="text-sm font-bold mb-4">Authentication</h3>
                <p className="text-xs text-text-secondary mb-4">
                  {authenticated
                    ? 'Authenticated. You have full access to dashboard operations.'
                    : 'Not authenticated. Some operations may be restricted.'}
                </p>
                <button
                  onClick={() => setShowAuth(true)}
                  className="px-4 py-2 text-xs rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors"
                >
                  {authenticated ? 'Re-authenticate' : 'Authenticate'}
                </button>
              </div>
              <div className="p-6 rounded-lg bg-surface-raised border border-border-dim max-w-lg">
                <h3 className="text-sm font-bold mb-4">Swarm Configuration</h3>
                <p className="text-xs text-text-secondary">
                  Configuration is read from <code className="text-accent">stoa.yml</code> in the repository root.
                  Edit that file directly to change agent definitions, schedules, and rules.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-lg bg-surface-raised border border-accent/30 text-accent text-xs font-mono shadow-xl">
          {toast}
        </div>
      )}

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onAuth={(ok) => { setAuthenticated(ok); setShowAuth(false); if (ok) flash('Authenticated') }}
        />
      )}
    </div>
  )
}

/* ── Overview Sub-panel (inlined to keep page.tsx self-contained) ── */

function OverviewPanel({
  agents, activities, totalSkills, successRate, swarmStatus, portfolio, cooldownUntil, onAgentClick,
}: {
  agents: AgentInfo[]
  activities: Array<{ timestamp: string; agent: string; type: string; summary: string }>
  totalSkills: number
  successRate: number
  swarmStatus: string
  portfolio: { total_value_usd: number; drawdown_pct: number; open_positions: number }
  cooldownUntil?: string
  onAgentClick: (name: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {swarmStatus === 'halted' && (
        <div className="p-4 rounded-lg bg-red-400/5 border border-red-400/20 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 glow-red" />
          <div>
            <div className="text-sm font-bold text-red-400">Swarm Halted</div>
            <div className="text-xs text-red-400/70">
              {cooldownUntil
                ? `Cooldown until ${new Date(cooldownUntil).toLocaleString()}`
                : 'All agents are stopped'}
            </div>
          </div>
        </div>
      )}
      {swarmStatus === 'cooldown' && (
        <div className="p-4 rounded-lg bg-amber-400/5 border border-amber-400/20 flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse-dot glow-amber" />
          <div>
            <div className="text-sm font-bold text-amber-400">Cooldown Active</div>
            <div className="text-xs text-amber-400/70">
              {cooldownUntil ? `Resumes at ${new Date(cooldownUntil).toLocaleString()}` : 'Agents paused'}
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Active Agents" value={String(agents.length)} accent />
        <StatCard label="Total Skills" value={String(totalSkills)} />
        <StatCard label="Success Rate" value={`${successRate.toFixed(0)}%`} />
        <StatCard label="Portfolio" value={`$${portfolio.total_value_usd.toFixed(2)}`} />
      </div>

      {/* Agent Cards */}
      <div>
        <h2 className="text-sm font-bold text-text-secondary mb-3 uppercase tracking-wider">Agent Fleet</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {agents.map(a => (
            <AgentCard key={a.name} agent={a} onClick={() => onAgentClick(a.name)} />
          ))}
        </div>
      </div>

      {/* Mesh + Activity split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-bold text-text-secondary mb-3 uppercase tracking-wider">Agent Mesh</h2>
          <MeshView agents={agents.map(a => a.name)} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-text-secondary mb-3 uppercase tracking-wider">Recent Activity</h2>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {activities.length === 0 && (
              <div className="text-xs text-text-muted p-3">No recent activity</div>
            )}
            {activities.map((a, i) => (
              <ActivityRow key={i} activity={a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="p-4 rounded-lg bg-surface-raised border border-border-dim">
      <div className="text-xs text-text-muted uppercase tracking-wider mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent ? 'text-accent' : 'text-text-primary'}`}>{value}</div>
    </div>
  )
}

function ActivityRow({ activity }: { activity: { timestamp: string; agent: string; type: string; summary: string } }) {
  const typeColors: Record<string, string> = {
    halt: 'text-red-400',
    trade: 'text-pink-400',
    signal: 'text-blue-400',
    feedback: 'text-emerald-400',
    run: 'text-zinc-400',
  }
  return (
    <div className="flex items-start gap-3 px-3 py-2 rounded bg-surface-raised/50 border border-border-dim/50 text-xs">
      <span className={`shrink-0 uppercase font-bold ${typeColors[activity.type] || 'text-text-muted'}`}>
        {activity.agent}
      </span>
      <span className="text-text-secondary flex-1 break-words">{activity.summary}</span>
      <span className="text-text-muted shrink-0 tabular-nums">
        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  )
}
