import { NextResponse } from 'next/server'

export function middleware(request) {
  // Read credentials from environment variables
  const validUser = process.env.AUTH_USERNAME
  const validPass = process.env.AUTH_PASSWORD

  // If env vars not set, allow through (so local dev works without them)
  if (!validUser || !validPass) return NextResponse.next()

  const authHeader = request.headers.get('authorization')

  if (authHeader) {
    const base64 = authHeader.split(' ')[1]
    const [user, pass] = Buffer.from(base64, 'base64').toString().split(':')
    if (user === validUser && pass === validPass) {
      return NextResponse.next()
    }
  }

  // Return 401 with WWW-Authenticate header to trigger browser login prompt
  return new NextResponse('Unauthorized', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Cave Personnelle"',
    },
  })
}

// Protect all routes
export const config = {
  matcher: '/(.*)',
}
