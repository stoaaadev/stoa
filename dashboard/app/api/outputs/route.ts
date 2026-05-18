import { NextResponse } from 'next/server'
import { getOutputFiles } from '@/lib/memory'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const outputs = getOutputFiles()
    return NextResponse.json({ outputs })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to read outputs' },
      { status: 500 }
    )
  }
}
