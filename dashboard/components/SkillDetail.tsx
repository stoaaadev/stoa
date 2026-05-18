'use client'

interface SkillDetailProps {
  skillName: string
  skills: Array<{ name: string; agent: string; schedule: string | null }>
  runs: Array<Record<string, unknown>>
  onRun: (name: string) => void
  onClose: () => void
}

export function SkillDetail({ skillName, skills, runs, onRun, onClose }: SkillDetailProps) {
  const skill = skills.find(s => s.name === skillName)
  if (!skill) return null

  const skillRuns = runs.filter(r => r.skill === skillName)
    .slice(0, 10)

  return (
    <div className="mt-6 p-6 rounded-lg bg-surface-raised border border-accent/20">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-accent">{skill.name}</h3>
          <div className="text-xs text-text-muted mt-1">
            Agent: <span className="text-text-secondary capitalize">{skill.agent}</span>
            {' \u00b7 '}
            Schedule: <span className="text-text-secondary">{skill.schedule || 'reactive (trigger-based)'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onRun(skill.name)}
            className="px-3 py-1.5 text-xs rounded bg-accent/20 text-accent border border-accent/30 hover:bg-accent/30 transition-colors"
          >
            Run Now
          </button>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs rounded border border-border-dim text-text-muted hover:text-text-primary hover:border-border-bright transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Recent runs for this skill */}
      <div>
        <h4 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">Recent Runs</h4>
        {skillRuns.length === 0 ? (
          <div className="text-xs text-text-muted py-2">No recorded runs for this skill</div>
        ) : (
          <div className="space-y-1">
            {skillRuns.map((r, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded bg-surface/50 border border-border-dim/50 text-xs">
                <span className="text-emerald-400 font-bold w-20">{String(r.status || 'completed')}</span>
                <span className="text-text-secondary flex-1">
                  {typeof r.tokens === 'number' ? `${r.tokens} tokens` : ''}
                  {typeof r.cost === 'number' ? ` \u00b7 $${Number(r.cost).toFixed(4)}` : ''}
                </span>
                <span className="text-text-muted">
                  {r.timestamp ? new Date(String(r.timestamp)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
