'use client'

interface OutputFeedProps {
  outputs: Array<{ name: string; content: string; modified: string }>
}

export function OutputFeed({ outputs }: OutputFeedProps) {
  if (outputs.length === 0) {
    return (
      <div className="p-5 rounded-lg bg-surface-raised border border-border-dim">
        <h3 className="text-sm font-bold mb-3">Skill Outputs</h3>
        <div className="text-xs text-text-muted text-center py-4">
          No outputs yet. Skill outputs will appear here as files in dashboard/outputs/.
        </div>
      </div>
    )
  }

  return (
    <div className="p-5 rounded-lg bg-surface-raised border border-border-dim">
      <h3 className="text-sm font-bold mb-4">Skill Outputs</h3>
      <div className="space-y-3">
        {outputs.map((output, i) => {
          // Try to parse as JSON for structured display
          let parsed: Record<string, unknown> | null = null
          try {
            parsed = JSON.parse(output.content)
          } catch { /* not json */ }

          return (
            <div key={i} className="p-3 rounded bg-surface/50 border border-border-dim/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-accent">{output.name}</span>
                <span className="text-[10px] text-text-muted">
                  {new Date(output.modified).toLocaleString()}
                </span>
              </div>
              <pre className="text-xs text-text-secondary overflow-auto max-h-48 whitespace-pre-wrap leading-relaxed">
                {parsed
                  ? JSON.stringify(parsed, null, 2)
                  : output.content.slice(0, 500)}
                {!parsed && output.content.length > 500 ? '...' : ''}
              </pre>
            </div>
          )
        })}
      </div>
    </div>
  )
}
