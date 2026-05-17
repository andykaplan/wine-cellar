import { put, list } from '@vercel/blob'

const BLOB_PATHNAME = process.env.NODE_ENV === 'development' ? 'cellar/dev-wine-cellar-v2.json' : 'cellar/wine-cellar-v2.json'

export async function GET() {
  try {
    // List blobs to find our cellar file and get its URL
    const { blobs } = await list({ prefix: BLOB_PATHNAME })
    if (!blobs || blobs.length === 0) return Response.json([])

    const res = await fetch(blobs[0].url, { cache: 'no-store' })
    if (!res.ok) return Response.json([])

    const entries = await res.json()
    return Response.json(entries || [])
  } catch (err) {
    console.error('Cellar GET error:', err)
    return Response.json([])
  }
}

export async function POST(request) {
  try {
    const entries = await request.json()

    await put(BLOB_PATHNAME, JSON.stringify(entries), {
      access: 'public',
      addRandomSuffix: false,
      contentType: 'application/json',
      cacheControlMaxAge: 0,
    })

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Cellar save error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
