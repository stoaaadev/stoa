'use client'

interface RunLogProps {
  runs: Array<Record<string, unknown>>
}

export function RunLog({ runs }: RunLogProps) {
  if (runs.length === 0) {
    return (
      <div className="text-xs text-text-muted p-6 text-center bg-surface-raised rounded-lg border border-border-dim">
        No runs recorded yet. Runs appear here once agents execute skills.
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border-dim overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_100px_100px_100px_120px] gap-2 px-4 py-2.5 bg-surface-overlay text-[10px] text-text-muted uppercase tracking-wider font-bold">
        <span>Agent</span>
        <span>Skill</span>
        <span>Status</span>
        <span className="text-right">Tokens</span>
        <span className="text-right">Cost</span>
        <span className="text-right">Time</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border-dim/50">
        {runs.map((run, i) => {
          const status = String(run.status || 'unknown')
          const statusColor = status === 'completed'
            ? 'text-emerald-400'
            : status === 'failed'
            ? 'text-red-400'
            : 'text-amber-400'

          return (
            <div
              key={i}
              className="grid grid-cols-[1fr_1fr_100px_100px_100px_120px] gap-2 px-4 py-2.5 text-xs hover:bg-surface-raised/50 transition-colors"
            >
              <span className="text-text-secondary capitalize font-medium">{String(run.agent || '')}</span>
              <span className="text-text-primary">{String(run.skill || '')}</span>
              <span className={`font-bold ${statusColor}`}>{status}</span>
              <span className="text-text-muted text-right tabular-nums">
                {typeof run.tokens === 'number' ? run.tokens.toLocaleString() : '--'}
              </span>
              <span className="text-text-muted text-right tabular-nums">
                {typeof run.cost === 'number' ? `$${Number(run.cost).toFixed(4)}` : '--'}
              </span>
              <span className="text-text-muted text-right tabular-nums">
                {run.timestamp
                  ? new Date(String(run.timestamp)).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : '--'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
