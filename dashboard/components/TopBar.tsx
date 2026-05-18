'use client'

interface TopBarProps {
  swarmStatus: string
  syncing: boolean
  authenticated: boolean
  onSync: () => void
  onAuth: () => void
}

export function TopBar({ swarmStatus, syncing, onSync, onAuth, authenticated }: TopBarProps) {
  const statusConfig: Record<string, { label: string; color: string; dotClass: string }> = {
    active: { label: 'ACTIVE', color: 'text-emerald-400', dotClass: 'bg-emerald-400 glow-emerald' },
    cooldown: { label: 'COOLDOWN', color: 'text-amber-400', dotClass: 'bg-amber-400 animate-pulse-dot glow-amber' },
    halted: { label: 'HALTED', color: 'text-red-400', dotClass: 'bg-red-400 glow-red' },
  }

  const status = statusConfig[swarmStatus] || statusConfig.halted

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-border-dim bg-surface/80 backdrop-blur-sm">
      {/* Left: Logo + Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-accent font-bold text-xs">S</span>
          </div>
          <span className="text-sm font-bold tracking-tight">STOA</span>
          <span className="text-xs text-text-muted">Command</span>
        </div>

        <div className="h-4 w-px bg-border-dim" />

        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.dotClass}`} />
          <span className={`text-xs font-bold uppercase tracking-wider ${status.color}`}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onSync}
          disabled={syncing}
          className="px-3 py-1.5 text-xs rounded border border-border-dim hover:border-accent/40 text-text-secondary hover:text-accent transition-colors disabled:opacity-50"
        >
          {syncing ? 'Syncing...' : 'Sync'}
        </button>

        <button
          onClick={onAuth}
          className={`px-3 py-1.5 text-xs rounded border transition-colors ${
            authenticated
              ? 'border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/10'
              : 'border-border-dim text-text-muted hover:border-accent/40 hover:text-accent'
          }`}
        >
          {authenticated ? 'Authed' : 'Auth'}
        </button>
      </div>
    </header>
  )
}
