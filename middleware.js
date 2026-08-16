import { NextResponse } from 'next/server'

export const runtime = 'edge'

// Web Crypto API — works in Vercel Edge Runtime (unlike Node crypto module)
async function verifyToken(token, secret) {
  try {
    if (!token || !secret) return false
    const enc = new TextEncoder()
    // base64url decode
    const b64 = token.replace(/-/g, '+').replace(/_/g, '/') + '=='.slice((token.length * 3) % 4 || 4)
    const { data, sig } = JSON.parse(atob(b64))
    const key = await crypto.subtle.importKey(
      'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    const sigBytes = new Uint8Array(sig.match(/.{2}/g).map(b => parseInt(b, 16)))
    const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(data))
    if (!valid) return false
    const payload = JSON.parse(data)
    if (payload.exp && Date.now() > payload.exp) return false
    return true
  } catch (_) { return false }
}

export async function middleware(request) {
  const validUser = process.env.AUTH_USERNAME
  const validPass = process.env.AUTH_PASSWORD
  const secret    = process.env.AUTH_SECRET

  // Auth not configured — allow through (local dev without env vars)
  if (!validUser || !validPass || !secret) return NextResponse.next()

  const path = request.nextUrl.pathname

  // Login page and login API are always public
  if (path === '/login' || path === '/api/login') return NextResponse.next()

  // Check for valid session cookie
  const sessionCookie = request.cookies.get('cave_session')
  if (sessionCookie && await verifyToken(sessionCookie.value, secret)) {
    return NextResponse.next()
  }

  // Fall back to HTTP Basic Auth for curl/restore script
  const authHeader = request.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Basic ')) {
    try {
      const decoded = atob(authHeader.split(' ')[1])
      const colon = decoded.indexOf(':')
      const user = decoded.slice(0, colon)
      const pass = decoded.slice(colon + 1)
      if (user === validUser && pass === validPass) return NextResponse.next()
    } catch (_) {}
  }

  // Not authenticated
  if (path.startsWith('/api/')) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const loginUrl = new URL('/login', request.url)
  loginUrl.searchParams.set('from', path)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: '/(.*)',
}
