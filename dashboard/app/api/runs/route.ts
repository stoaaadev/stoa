import { NextResponse } from 'next/server'
import fs from 'fs'
import yaml from 'yaml'
import { PATHS } from '@/lib/config'
import {
  getCronState, getTokenUsage, getRecentActivity,
  getPortfolioState, getSkillHealth,
} from '@/lib/memory'
import type { AgentDef } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cronState = getCronState()
    const usage = getTokenUsage()
    const activities = getRecentActivity(30)
    const portfolio = getPortfolioState()
    const healthMap = getSkillHealth()

    // Parse agents from stoa.yml
    let agentDefs: Record<string, AgentDef> = {}
    try {
      const raw = fs.readFileSync(PATHS.stoaYml, 'utf-8')
      const config = yaml.parse(raw)
      agentDefs = config.agents || {}
    } catch { /* ignore */ }

    const agents = Object.entries(agentDefs).map(([name, def]) => {
      // Compute agent health from skill health scores
      const agentSkills = (def.skills || []) as string[]
      const healthScores = agentSkills
        .map(s => healthMap[`${name}-${s}`]?.avg || healthMap[s]?.avg || 0)
        .filter(s => s > 0)
      const avgHealth = healthScores.length > 0
        ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length
        : 0

      // Last activity for this agent
      const agentActivities = activities.filter(a => a.agent === name)
      const lastActivity = agentActivities.length > 0 ? agentActivities[0].timestamp : ''

      return {
        name,
        role: def.role || '',
        skills: agentSkills,
        schedule: def.schedule || null,
        health: Math.round(avgHealth * 20), // convert 0-5 scale to 0-100
        lastActivity,
      }
    })

    // Compute success rate from usage data
    const totalRuns = usage.length
    const successRate = totalRuns > 0 ? 100 : 0 // All recorded runs in CSV were completed

    // Build runs list from token usage + dedup
    const runs = usage.map(row => ({
      timestamp: row.timestamp,
      agent: row.agent,
      skill: row.skill,
      status: 'completed',
      duration_ms: row.duration_ms,
      tokens: row.total_tokens,
      cost: row.cost_usd,
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    const totalSkills = Object.values(agentDefs).reduce(
      (sum, a) => sum + ((a.skills as string[])?.length || 0), 0
    )

    return NextResponse.json({
      status: cronState.swarm_status,
      cooldown_until: cronState.cooldown_until,
      agents,
      activities,
      runs,
      totalSkills,
      successRate,
      portfolio: {
        total_value_usd: portfolio.total_value_usd,
        drawdown_pct: portfolio.drawdown_pct,
        open_positions: portfolio.open_positions,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
