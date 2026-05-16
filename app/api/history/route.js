import { put, list } from '@vercel/blob'

const BLOB_PATHNAME = 'cellar/wine-history-v1.json'

export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_PATHNAME })
    if (!blobs || blobs.length === 0) return Response.json([])
    const res = await fetch(blobs[0].url, { cache: 'no-store' })
    if (!res.ok) return Response.json([])
    const history = await res.json()
    return Response.json(history || [])
  } catch (err) {
    console.error('History GET error:', err)
    return Response.json([])
  }
}

export async function POST(request) {
  try {
    const entry = await request.json()

    // Load existing history first
    let history = []
    const { blobs } = await list({ prefix: BLOB_PATHNAME })
    if (blobs && blobs.length > 0) {
      const res = await fetch(blobs[0].url, { cache: 'no-store' })
      if (res.ok) history = await res.json()
    }

    // Append new entry
    history = [entry, ...history]

    await put(BLOB_PATHNAME, JSON.stringify(history), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('History POST error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
