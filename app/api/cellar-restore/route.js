import { put, list } from '@vercel/blob'

const isProd = process.env.NODE_ENV !== 'development'
const PREFIX       = isProd ? 'cellar'        : 'cellar-dev'
const BLOB_PATHNAME = `${PREFIX}/wine-cellar-v2.json`
const IMG_PREFIX    = `${PREFIX}/images`

// POST: restore from a downloaded backup JSON
// Handles old format (with embedded base64 imageData) and new format (with image URLs)
export async function POST(request) {
  try {
    const body = await request.json()
    const entries = body.cellar || body
    if (!Array.isArray(entries)) {
      return Response.json({ error: 'Expected { cellar: [...] } or a bare array' }, { status: 400 })
    }

    const restored = []
    let imagesUploaded = 0

    for (const entry of entries) {
      const { imageData, ...meta } = entry

      // If entry has embedded base64 image data, upload it to Blob
      if (imageData && imageData.startsWith('data:')) {
        try {
          const base64 = imageData.split(',')[1]
          const binary = Buffer.from(base64, 'base64')
          const blob = new Blob([binary], { type: 'image/jpeg' })
          const result = await put(`${IMG_PREFIX}/${meta.id}.jpg`, blob, {
            access: 'public', addRandomSuffix: false,
            cacheControlMaxAge: 31536000,
          })
          restored.push({ ...meta, imageData: result.url })
          imagesUploaded++
        } catch (e) {
          console.error('Image upload failed for', meta.id, e)
          restored.push({ ...meta, imageData: null })
        }
      } else {
        // New format or no image - keep as-is
        restored.push({ ...meta, imageData: imageData || null })
      }
    }

    // Strip imageData before saving metadata JSON
    const stripped = restored.map(({ imageData, ...rest }) => rest)

    await put(BLOB_PATHNAME, JSON.stringify(stripped), {
      access: 'public', addRandomSuffix: false,
      contentType: 'application/json', cacheControlMaxAge: 0,
    })

    return Response.json({
      ok: true,
      restored: stripped.length,
      imagesUploaded,
    })
  } catch (err) {
    console.error('Restore error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
