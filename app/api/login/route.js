// Note: this runs in Node.js serverless (not Edge), so Node crypto is fine here
import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_DAYS = 30

function signToken(payload, secret) {
  const data = JSON.stringify(payload)
  const sig = createHmac('sha256', secret).update(data).digest('hex')
  const json = JSON.stringify({ data, sig })
  // base64url encode
  return Buffer.from(json).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
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

    // Pad to equal length before timing-safe compare to avoid length leaks
    const userBuf = Buffer.alloc(256)
    const validUserBuf = Buffer.alloc(256)
    Buffer.from(username || '').copy(userBuf)
    Buffer.from(validUser).copy(validUserBuf)

    const passBuf = Buffer.alloc(256)
    const validPassBuf = Buffer.alloc(256)
    Buffer.from(password || '').copy(passBuf)
    Buffer.from(validPass).copy(validPassBuf)

    const userMatch = timingSafeEqual(userBuf, validUserBuf)
    const passMatch = timingSafeEqual(passBuf, validPassBuf)

    // Also verify actual content matches (not just padded buffers)
    const userOk = userMatch && (username === validUser)
    const passOk = passMatch && (password === validPass)

    if (!userOk || !passOk) {
      await new Promise(r => setTimeout(r, 500))
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({
      user: validUser,
      exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    }, secret)

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
