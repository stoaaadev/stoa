'use client'

import { useState, useEffect } from 'react'
import { agentColor } from '@/lib/utils'

interface MeshMessage {
  from: string
  to: string | string[]
  type: string
  data: Record<string, unknown>
  id: string
  timestamp: string
}

interface MeshViewProps {
  agents: string[]
}

export function MeshView({ agents }: MeshViewProps) {
  const [mesh, setMesh] = useState<Record<string, MeshMessage[]>>({})

  useEffect(() => {
    fetch('/api/memory')
      .then(r => r.ok ? r.json() : {})
      .then((d: Record<string, unknown>) => { if (d.mesh) setMesh(d.mesh as Record<string, MeshMessage[]>) })
      .catch(() => {})
  }, [])

  // Collect all edges (from -> to)
  const edges: Array<{ from: string; to: string; type: string; summary: string }> = []
  for (const [, messages] of Object.entries(mesh)) {
    for (const msg of messages) {
      const targets = Array.isArray(msg.to) ? msg.to : [msg.to]
      for (const target of targets) {
        edges.push({
          from: msg.from,
          to: target,
          type: msg.type,
          summary: msg.type === 'halt'
            ? `HALT: ${String(msg.data?.reason || '').slice(0, 50)}`
            : `${msg.type}: ${String(msg.data?.signal_id || msg.data?.verdict || msg.id || '').slice(0, 40)}`,
        })
      }
    }
  }

  // Position agents in a circle layout
  const nodeCount = agents.length || 4
  const cx = 160
  const cy = 120
  const radius = 80

  const positions = agents.map((name, i) => {
    const angle = (i / nodeCount) * Math.PI * 2 - Math.PI / 2
    return {
      name,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    }
  })

  const getPos = (name: string) => positions.find(p => p.name === name) || { x: cx, y: cy }

  const typeColors: Record<string, string> = {
    halt: '#f87171',
    feedback: '#34d399',
    signal: '#60a5fa',
    'trade-signal': '#f472b6',
    'stop-loss-trigger': '#fbbf24',
  }

  return (
    <div className="p-4 rounded-lg bg-surface-raised border border-border-dim">
      <svg viewBox="0 0 320 240" className="w-full max-w-md mx-auto">
        {/* Edges */}
        {edges.map((edge, i) => {
          const from = getPos(edge.from)
          const to = getPos(edge.to)
          const color = typeColors[edge.type] || '#71717a'

          // Offset for parallel edges
          const midX = (from.x + to.x) / 2
          const midY = (from.y + to.y) / 2
          const dx = to.x - from.x
          const dy = to.y - from.y
          const len = Math.sqrt(dx * dx + dy * dy) || 1
          const offsetX = (-dy / len) * 8
          const offsetY = (dx / len) * 8

          return (
            <g key={i}>
              <path
                d={`M ${from.x} ${from.y} Q ${midX + offsetX} ${midY + offsetY} ${to.x} ${to.y}`}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeOpacity="0.5"
                markerEnd="url(#arrowhead)"
              />
            </g>
          )
        })}

        {/* Arrow marker */}
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="6" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#71717a" fillOpacity="0.7" />
          </marker>
        </defs>

        {/* Nodes */}
        {positions.map(pos => {
          const color = agentColor(pos.name)
          return (
            <g key={pos.name}>
              <circle cx={pos.x} cy={pos.y} r="20" fill={`${color}15`} stroke={color} strokeWidth="1.5" />
              <text
                x={pos.x}
                y={pos.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize="9"
                fontWeight="bold"
                fontFamily="monospace"
              >
                {pos.name.slice(0, 3).toUpperCase()}
              </text>
            </g>
          )
        })}
      </svg>

      {/* Edge legend */}
      {edges.length > 0 && (
        <div className="mt-3 space-y-1">
          {edges.slice(0, 5).map((edge, i) => (
            <div key={i} className="flex items-center gap-2 text-[10px]">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: typeColors[edge.type] || '#71717a' }}
              />
              <span className="text-text-muted">
                {edge.from} → {edge.to}
              </span>
              <span className="text-text-secondary truncate">{edge.summary}</span>
            </div>
          ))}
        </div>
      )}

      {edges.length === 0 && (
        <div className="text-xs text-text-muted text-center mt-2">No mesh messages</div>
      )}
    </div>
  )
}
