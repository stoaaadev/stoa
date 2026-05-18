'use client'

interface CostTrackerProps {
  data: Record<string, unknown>
}

export function CostTracker({ data }: CostTrackerProps) {
  const costOverTime = ((data as Record<string, unknown>).costOverTime || []) as Array<{ date: string; cost: number }>
  const byAgent = ((data as Record<string, unknown>).byAgent || {}) as Record<string, { runs: number; tokens: number; cost: number }>
  const totalCost = (data as Record<string, unknown>).totalCost as number || 0

  const agentColors: Record<string, string> = {
    scout: '#34d399',
    analyst: '#60a5fa',
    executor: '#f472b6',
    guardian: '#fbbf24',
  }

  // Find max cost for scaling the bar chart
  const maxCost = Math.max(...costOverTime.map(d => d.cost), 0.001)

  return (
    <div className="p-5 rounded-lg bg-surface-raised border border-border-dim">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">Cost Breakdown</h3>
        <span className="text-xs text-accent font-bold">${totalCost.toFixed(4)} total</span>
      </div>

      {/* Cost by agent */}
      <div className="space-y-2 mb-5">
        {Object.entries(byAgent).map(([agent, stats]) => {
          const pct = totalCost > 0 ? (stats.cost / totalCost) * 100 : 0
          return (
            <div key={agent}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="capitalize text-text-secondary">{agent}</span>
                <span className="text-text-muted tabular-nums">
                  ${stats.cost.toFixed(4)} ({stats.runs} runs)
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-overlay overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: agentColors[agent] || '#71717a',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Cost timeline */}
      {costOverTime.length > 0 && (
        <>
          <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Daily Cost</h4>
          <div className="flex items-end gap-1 h-16">
            {costOverTime.map((d, i) => {
              const height = (d.cost / maxCost) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-sm bg-accent/60 transition-all hover:bg-accent"
                    style={{ height: `${height}%`, minHeight: '2px' }}
                    title={`${d.date}: $${d.cost.toFixed(4)}`}
                  />
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[9px] text-text-muted">{costOverTime[0]?.date}</span>
            <span className="text-[9px] text-text-muted">{costOverTime[costOverTime.length - 1]?.date}</span>
          </div>
        </>
      )}

      {costOverTime.length === 0 && (
        <div className="text-xs text-text-muted text-center py-3">No cost data available</div>
      )}
    </div>
  )
}
