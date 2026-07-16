import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_DAYS = 30

function signToken(payload) {
  const secret = process.env.AUTH_SECRET
  const data = JSON.stringify(payload)
  const sig = createHmac('sha256', secret).update(data).digest('hex')
  return Buffer.from(JSON.stringify({ data, sig })).toString('base64url')
}

export function verifyToken(token) {
  try {
    const secret = process.env.AUTH_SECRET
    if (!secret) return null
    const { data, sig } = JSON.parse(Buffer.from(token, 'base64url').toString())
    const expected = createHmac('sha256', secret).update(data).digest('hex')
    // Timing-safe comparison to prevent timing attacks
    const sigBuf = Buffer.from(sig, 'hex')
    const expBuf = Buffer.from(expected, 'hex')
    if (sigBuf.length !== expBuf.length) return null
    if (!timingSafeEqual(sigBuf, expBuf)) return null
    const payload = JSON.parse(data)
    // Check expiry
    if (payload.exp && Date.now() > payload.exp) return null
    return payload
  } catch (_) { return null }
}

export async function POST(request) {
  try {
    const { username, password } = await request.json()

    const validUser = process.env.AUTH_USERNAME
    const validPass = process.env.AUTH_PASSWORD
    const secret    = process.env.AUTH_SECRET

    if (!validUser || !validPass || !secret) {
      return Response.json({ error: 'Auth not configured' }, { status: 500 })
    }

    // Timing-safe string comparison
    const userMatch = timingSafeEqual(
      Buffer.from(username || ''),
      Buffer.from(validUser)
    )
    const passMatch = timingSafeEqual(
      Buffer.from(password || ''),
      Buffer.from(validPass)
    )

    if (!userMatch || !passMatch) {
      // Small delay to slow brute force
      await new Promise(r => setTimeout(r, 500))
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({
      user: validUser,
      exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    })

    const maxAge = SESSION_DAYS * 24 * 60 * 60

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': [
          `cave_session=${token}`,
          'Path=/',
          `Max-Age=${maxAge}`,
          'HttpOnly',
          'SameSite=Strict',
          'Secure',
        ].join('; '),
      },
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
