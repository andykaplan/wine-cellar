import { createHmac, timingSafeEqual } from 'crypto'

const SESSION_DAYS = 30

function signToken(payload, secret) {
  const data = JSON.stringify(payload)
  const sig = createHmac('sha256', secret).update(data).digest('hex')
  const json = JSON.stringify({ data, sig })
  return Buffer.from(json).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || ''

    let username, password, from

    // Handle both JSON (fetch) and form POST
    if (contentType.includes('application/json')) {
      const body = await request.json()
      username = body.username
      password = body.password
      from = body.from || '/'
    } else {
      const form = await request.formData()
      username = form.get('username')
      password = form.get('password')
      from = form.get('from') || '/'
    }

    const validUser = process.env.AUTH_USERNAME
    const validPass = process.env.AUTH_PASSWORD
    const secret    = process.env.AUTH_SECRET

    if (!validUser || !validPass || !secret) {
      return Response.json({ error: 'Auth not configured' }, { status: 500 })
    }

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
    const userOk = userMatch && (username === validUser)
    const passOk = passMatch && (password === validPass)

    if (!userOk || !passOk) {
      await new Promise(r => setTimeout(r, 500))
      // For form POST, redirect back to login with error
      if (!contentType.includes('application/json')) {
        return Response.redirect(new URL('/login?error=1', request.url), 303)
      }
      return Response.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = signToken({
      user: validUser,
      exp: Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000,
    }, secret)

    const maxAge = SESSION_DAYS * 24 * 60 * 60
    const cookie = `cave_session=${token}; Path=/; Max-Age=${maxAge}; HttpOnly; SameSite=Lax; Secure`

    // For form POST: server-side redirect WITH cookie already set
    if (!contentType.includes('application/json')) {
      return new Response(null, {
        status: 303,
        headers: {
          'Location': from.startsWith('/') ? from : '/',
          'Set-Cookie': cookie,
        },
      })
    }

    // For JSON fetch
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': cookie,
      },
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
