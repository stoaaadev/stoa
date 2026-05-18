import { NextResponse } from 'next/server'
import {
  getCronState, getPositions, getPortfolioState,
  getTxLog, getMeshMessages, getDedupState,
} from '@/lib/memory'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cronState = getCronState()
    const positions = getPositions()
    const portfolio = getPortfolioState()
    const txLog = getTxLog()
    const mesh = getMeshMessages()
    const dedup = getDedupState()

    return NextResponse.json({
      'cron-state': cronState,
      positions,
      'portfolio-state': portfolio,
      'tx-log': txLog,
      mesh,
      'dedup-state': dedup,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to read memory' },
      { status: 500 }
    )
  }
}
