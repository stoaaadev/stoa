import { NextResponse } from 'next/server'
import { GITHUB_TOKEN } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params

  if (!GITHUB_TOKEN) {
    return NextResponse.json(
      { error: 'GITHUB_TOKEN not configured. Set it in .env to trigger workflows.' },
      { status: 400 }
    )
  }

  try {
    // Trigger a GitHub Actions workflow dispatch
    // This assumes a workflow file that accepts a skill name input
    const repoSlug = process.env.GITHUB_REPOSITORY || ''
    if (!repoSlug) {
      return NextResponse.json(
        { error: 'GITHUB_REPOSITORY not set. Cannot determine repo for workflow dispatch.' },
        { status: 400 }
      )
    }

    const [owner, repo] = repoSlug.split('/')
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/workflows/stoa.yml/dispatches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ref: 'main',
          inputs: { skill: name },
        }),
      }
    )

    if (res.status === 204 || res.ok) {
      return NextResponse.json({ success: true, skill: name })
    }

    const body = await res.text()
    return NextResponse.json(
      { error: `GitHub API error: ${res.status} — ${body}` },
      { status: res.status }
    )
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to trigger workflow' },
      { status: 500 }
    )
  }
}
