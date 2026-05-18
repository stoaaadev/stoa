import { NextResponse } from 'next/server'
import fs from 'fs'
import yaml from 'yaml'
import { PATHS } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const raw = fs.readFileSync(PATHS.stoaYml, 'utf-8')
    const config = yaml.parse(raw)
    const agents = config.agents || {}

    const skills: Array<{ name: string; agent: string; schedule: string | null }> = []

    for (const [agentName, agentDef] of Object.entries(agents)) {
      const def = agentDef as { skills?: string[]; schedule?: string }
      const agentSkills = def.skills || []
      for (const skillName of agentSkills) {
        skills.push({
          name: skillName,
          agent: agentName,
          schedule: def.schedule || null,
        })
      }
    }

    return NextResponse.json({
      skills,
      agents: Object.keys(agents),
      chains: config.chains || {},
      defaults: config.defaults || {},
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to read config' },
      { status: 500 }
    )
  }
}
