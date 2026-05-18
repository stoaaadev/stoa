import { NextResponse } from 'next/server'
import { AUTH_PASSWORD } from '@/lib/config'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const cookie = request.headers.get('cookie') || ''
  const token = cookie
    .split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('stoa_auth='))
    ?.split('=')[1]

  const authenticated = AUTH_PASSWORD
    ? token === AUTH_PASSWORD
    : true // No password set = open access

  return NextResponse.json({ authenticated })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { password } = body

    if (!AUTH_PASSWORD) {
      // No password configured, auto-authenticate
      const response = NextResponse.json({ authenticated: true })
      response.cookies.set('stoa_auth', 'open', {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      })
      return response
    }

    if (password === AUTH_PASSWORD) {
      const response = NextResponse.json({ authenticated: true })
      response.cookies.set('stoa_auth', AUTH_PASSWORD, {
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7,
      })
      return response
    }

    return NextResponse.json({ authenticated: false, error: 'Invalid password' }, { status: 401 })
  } catch {
    return NextResponse.json({ authenticated: false, error: 'Invalid request' }, { status: 400 })
  }
}
