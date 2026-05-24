import { put, list, del } from '@vercel/blob'

const isProd = process.env.NODE_ENV !== 'development'
const PREFIX = isProd ? 'cellar/images' : 'cellar-dev/images'

// GET /api/image?id=xxx — fetch a single image URL
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

    const { blobs } = await list({ prefix: `${PREFIX}/${id}` })
    if (!blobs || blobs.length === 0) return Response.json({ url: null })

    return Response.json({ url: blobs[0].url })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// POST /api/image — save an image
// Body: { id: string, imageData: base64DataUrl }
export async function POST(request) {
  try {
    const { id, imageData } = await request.json()
    if (!id || !imageData) return Response.json({ error: 'Missing id or imageData' }, { status: 400 })

    // Convert base64 data URL to binary — handle both 'data:...;base64,XXX' and raw base64
    const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData
    if (!base64) return Response.json({ error: 'Invalid image data' }, { status: 400 })
    const binary = Buffer.from(base64, 'base64')
    const blob = new Blob([binary], { type: 'image/jpeg' })

    const result = await put(`${PREFIX}/${id}.jpg`, blob, {
      access: 'public',
      addRandomSuffix: false,
      cacheControlMaxAge: 31536000, // images are immutable by id
    })

    return Response.json({ ok: true, url: result.url })
  } catch (err) {
    console.error('Image POST error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// DELETE /api/image?id=xxx
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

    const { blobs } = await list({ prefix: `${PREFIX}/${id}` })
    if (blobs && blobs.length > 0) {
      await del(blobs[0].url)
    }
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
