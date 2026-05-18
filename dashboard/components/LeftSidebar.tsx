'use client'

type View = 'overview' | 'agents' | 'skills' | 'memory' | 'runs' | 'analytics' | 'settings'

interface LeftSidebarProps {
  view: View
  setView: (v: View) => void
  agentCount: number
  skillCount: number
}

const NAV_ITEMS: { key: View; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '\u25A0' },    // ■
  { key: 'agents', label: 'Agents', icon: '\u25C9' },        // ◉
  { key: 'skills', label: 'Skills', icon: '\u2726' },        // ✦
  { key: 'memory', label: 'Memory', icon: '\u2261' },        // ≡
  { key: 'runs', label: 'Runs', icon: '\u25B6' },            // ▶
  { key: 'analytics', label: 'Analytics', icon: '\u25E2' },  // ◢
  { key: 'settings', label: 'Settings', icon: '\u2699' },    // ⚙
]

export function LeftSidebar({ view, setView, agentCount, skillCount }: LeftSidebarProps) {
  return (
    <aside className="w-52 shrink-0 flex flex-col border-r border-border-dim bg-surface">
      {/* Top spacer matching topbar height */}
      <div className="h-14 shrink-0 flex items-center px-4 border-b border-border-dim">
        <span className="text-xs text-text-muted uppercase tracking-widest">Navigation</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const isActive = view === item.key
          return (
            <button
              key={item.key}
              onClick={() => setView(item.key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent border border-accent/20'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-raised border border-transparent'
              }`}
            >
              <span className="text-sm w-4 text-center">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
              {item.key === 'agents' && (
                <span className="ml-auto text-text-muted bg-surface-overlay rounded px-1.5 py-0.5 text-[10px]">
                  {agentCount}
                </span>
              )}
              {item.key === 'skills' && (
                <span className="ml-auto text-text-muted bg-surface-overlay rounded px-1.5 py-0.5 text-[10px]">
                  {skillCount}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom info */}
      <div className="px-4 py-3 border-t border-border-dim">
        <div className="text-[10px] text-text-muted">
          stoa v2 &middot; solana
        </div>
        <div className="text-[10px] text-text-muted mt-0.5">
          file-based ops dashboard
        </div>
      </div>
    </aside>
  )
}
