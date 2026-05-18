export function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export function formatUSD(n: number): string {
  return `$${n.toFixed(2)}`
}

export function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export function statusColor(status: string): string {
  switch (status) {
    case 'active': return 'text-emerald-400'
    case 'cooldown': return 'text-amber-400'
    case 'halted': return 'text-red-400'
    case 'filled': return 'text-emerald-400'
    case 'failed': return 'text-red-400'
    default: return 'text-zinc-400'
  }
}

export function statusBg(status: string): string {
  switch (status) {
    case 'active': return 'bg-emerald-400/10 border-emerald-400/30'
    case 'cooldown': return 'bg-amber-400/10 border-amber-400/30'
    case 'halted': return 'bg-red-400/10 border-red-400/30'
    default: return 'bg-zinc-400/10 border-zinc-400/30'
  }
}

export function agentColor(agent: string): string {
  switch (agent) {
    case 'scout': return '#34d399'
    case 'analyst': return '#60a5fa'
    case 'executor': return '#f472b6'
    case 'guardian': return '#fbbf24'
    default: return '#a1a1aa'
  }
}

export function agentIcon(agent: string): string {
  switch (agent) {
    case 'scout': return '\u25C9'    // ◉
    case 'analyst': return '\u25B3'   // △
    case 'executor': return '\u25C7'  // ◇
    case 'guardian': return '\u25A3'  // ▣
    default: return '\u25CB'          // ○
  }
}

export function clamp(val: number, min: number, max: number): number {
  return Math.min(Math.max(val, min), max)
}

export function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '...' : str
}
