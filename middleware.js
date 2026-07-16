import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'

function verifyToken(token) {
  try {
    const secret = process.env.AUTH_SECRET
    if (!secret || !token) return false
    const { data, sig } = JSON.parse(Buffer.from(token, 'base64url').toString())
    const expected = createHmac('sha256', secret).update(data).digest('hex')
    const sigBuf = Buffer.from(sig, 'hex')
    const expBuf = Buffer.from(expected, 'hex')
    if (sigBuf.length !== expBuf.length) return false
    if (!timingSafeEqual(sigBuf, expBuf)) return false
    const payload = JSON.parse(data)
    if (payload.exp && Date.now() > payload.exp) return false
    return true
  } catch (_) { return false }
}

export function middleware(request) {
  const validUser = process.env.AUTH_USERNAME
  const validPass = process.env.AUTH_PASSWORD

  // Auth not configured — allow through (local dev)
  if (!validUser || !validPass) return NextResponse.next()

  // Always allow the login page and login API through unauthenticated
  const path = request.nextUrl.pathname
  if (path === '/login' || path === '/api/login') return NextResponse.next()

  // Check for valid session cookie first
  const sessionCookie = request.cookies.get('cave_session')
  if (sessionCookie && verifyToken(sessionCookie.value)) {
    return NextResponse.next()
  }

  // Fall back to HTTP Basic Auth for API clients (curl, restore script)
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const [user, pass] = Buffer.from(authHeader.split(' ')[1], 'base64').toString().split(':')
      const userMatch = user === validUser
      const passMatch = pass === validPass
      if (userMatch && passMatch) return NextResponse.next()
    } catch (_) {}
  }

  // No valid auth — redirect to login page (for browser) or 401 (for API)
  const isApiRequest = path.startsWith('/api/')
  if (isApiRequest) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  // Redirect browser to login page
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', path)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: '/(.*)',
}
