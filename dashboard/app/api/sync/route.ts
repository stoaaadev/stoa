import { NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { PATHS } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cwd = PATHS.root

    // Check git status
    let hasChanges = false
    let behind = 0
    let branch = 'unknown'

    try {
      const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' })
      hasChanges = status.trim().length > 0
    } catch { /* not a git repo */ }

    try {
      branch = execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim()
    } catch { /* ignore */ }

    try {
      execSync('git fetch --quiet', { cwd, encoding: 'utf-8', timeout: 10000 })
      const behindStr = execSync('git rev-list --count HEAD..@{upstream}', { cwd, encoding: 'utf-8' }).trim()
      behind = parseInt(behindStr) || 0
    } catch { /* no upstream or offline */ }

    return NextResponse.json({ hasChanges, behind, branch })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Sync check failed' },
      { status: 500 }
    )
  }
}
