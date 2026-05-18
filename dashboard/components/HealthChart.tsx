'use client'

interface HealthChartProps {
  data: Record<string, unknown>
}

interface HealthEntry {
  name: string
  avgScore: number
  recentScores: number[]
}

export function HealthChart({ data }: HealthChartProps) {
  const healthData = ((data as Record<string, unknown>).skillHealth || []) as HealthEntry[]

  if (healthData.length === 0) {
    // Show aggregate stats if no skill health data
    const totalRuns = (data as Record<string, unknown>).totalRuns as number || 0
    const totalTokens = (data as Record<string, unknown>).totalTokens as number || 0
    const totalCost = (data as Record<string, unknown>).totalCost as number || 0
    const avgDuration = (data as Record<string, unknown>).avgDuration as number || 0

    return (
      <div className="p-5 rounded-lg bg-surface-raised border border-border-dim">
        <h3 className="text-sm font-bold mb-4">System Health</h3>
        <div className="grid grid-cols-2 gap-4">
          <MiniStat label="Total Runs" value={String(totalRuns)} />
          <MiniStat label="Total Tokens" value={totalTokens.toLocaleString()} />
          <MiniStat label="Total Cost" value={`$${totalCost.toFixed(4)}`} />
          <MiniStat label="Avg Duration" value={`${avgDuration.toFixed(0)}ms`} />
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 rounded-lg bg-surface-raised border border-border-dim">
      <h3 className="text-sm font-bold mb-4">Skill Health Scores</h3>
      <div className="space-y-3">
        {healthData.map(entry => (
          <div key={entry.name}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-text-secondary">{entry.name}</span>
              <span className="text-xs text-text-muted">{entry.avgScore.toFixed(1)}/5</span>
            </div>

            {/* Score trend as mini bar chart */}
            <div className="flex items-end gap-px h-6">
              {entry.recentScores.map((score, i) => {
                const height = (score / 5) * 100
                const barColor = score >= 4
                  ? 'bg-emerald-400'
                  : score >= 3
                  ? 'bg-amber-400'
                  : 'bg-red-400'
                return (
                  <div
                    key={i}
                    className={`flex-1 rounded-sm ${barColor} transition-all`}
                    style={{ height: `${height}%`, minHeight: '2px' }}
                    title={`Score: ${score}`}
                  />
                )
              })}
              {/* Pad empty slots */}
              {Array.from({ length: Math.max(0, 10 - entry.recentScores.length) }).map((_, i) => (
                <div key={`empty-${i}`} className="flex-1 h-px bg-border-dim rounded-sm" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-text-muted uppercase tracking-wider">{label}</div>
      <div className="text-lg font-bold text-text-primary mt-0.5">{value}</div>
    </div>
  )
}
