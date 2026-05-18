import { NextResponse } from 'next/server'
import { getTokenUsage, getSkillHealth } from '@/lib/memory'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const usage = getTokenUsage()
    const healthMap = getSkillHealth()

    const totalRuns = usage.length
    const totalTokens = usage.reduce((s, r) => s + r.total_tokens, 0)
    const totalCost = usage.reduce((s, r) => s + r.cost_usd, 0)
    const avgDuration = totalRuns > 0
      ? usage.reduce((s, r) => s + r.duration_ms, 0) / totalRuns
      : 0

    // Aggregate by agent
    const byAgent: Record<string, { runs: number; tokens: number; cost: number }> = {}
    for (const row of usage) {
      if (!byAgent[row.agent]) byAgent[row.agent] = { runs: 0, tokens: 0, cost: 0 }
      byAgent[row.agent].runs++
      byAgent[row.agent].tokens += row.total_tokens
      byAgent[row.agent].cost += row.cost_usd
    }

    // Aggregate by skill
    const bySkill: Record<string, { runs: number; tokens: number; cost: number }> = {}
    for (const row of usage) {
      if (!bySkill[row.skill]) bySkill[row.skill] = { runs: 0, tokens: 0, cost: 0 }
      bySkill[row.skill].runs++
      bySkill[row.skill].tokens += row.total_tokens
      bySkill[row.skill].cost += row.cost_usd
    }

    // Cost over time (grouped by date)
    const costByDate: Record<string, number> = {}
    const tokensByDate: Record<string, number> = {}
    for (const row of usage) {
      const date = row.timestamp.split('T')[0]
      costByDate[date] = (costByDate[date] || 0) + row.cost_usd
      tokensByDate[date] = (tokensByDate[date] || 0) + row.total_tokens
    }
    const costOverTime = Object.entries(costByDate)
      .map(([date, cost]) => ({ date, cost }))
      .sort((a, b) => a.date.localeCompare(b.date))
    const tokenOverTime = Object.entries(tokensByDate)
      .map(([date, tokens]) => ({ date, tokens }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Skill health summary
    const healthSummary = Object.entries(healthMap).map(([name, entry]) => ({
      name,
      avgScore: entry.avg,
      recentScores: entry.scores?.slice(-10) || [],
      lastRun: entry.last_run || null,
    }))

    return NextResponse.json({
      totalRuns,
      totalTokens,
      totalCost,
      avgDuration,
      byAgent,
      bySkill,
      costOverTime,
      tokenOverTime,
      skillHealth: healthSummary,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to compute analytics' },
      { status: 500 }
    )
  }
}
