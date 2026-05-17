import { put, list } from '@vercel/blob'

const isProd = process.env.NODE_ENV !== 'development'
const PREFIX = isProd ? 'cellar' : 'cellar-dev'
const BLOB_PATHNAME   = `${PREFIX}/wine-cellar-v2.json`
const BACKUP_PATHNAME = `${PREFIX}/wine-cellar-v2.backup.json`

async function readBlob(pathname) {
  try {
    const { blobs } = await list({ prefix: pathname })
    if (!blobs || blobs.length === 0) return null
    blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
    const res = await fetch(blobs[0].url + '?t=' + Date.now(), { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch (_) { return null }
}

export async function GET() {
  try {
    const entries = await readBlob(BLOB_PATHNAME)
    if (entries !== null) return Response.json(entries)
    const backup = await readBlob(BACKUP_PATHNAME)
    if (backup !== null) return Response.json(backup)
    return Response.json([])
  } catch (err) {
    console.error('Cellar GET error:', err)
    return Response.json([])
  }
}

export async function POST(request) {
  try {
    const entries = await request.json()
    if (!Array.isArray(entries)) {
      return Response.json({ error: 'Invalid data format' }, { status: 400 })
    }

    // Strip imageData — images stored separately
    const stripped = entries.map(({ imageData, ...rest }) => rest)

    // Safety: never overwrite real data with empty
    if (stripped.length === 0) {
      const current = await readBlob(BLOB_PATHNAME)
      if (current && current.length > 0) {
        console.warn('Refusing to overwrite', current.length, 'entries with empty array')
        return Response.json({ ok: true, skipped: true })
      }
    }

    // Backup before overwriting
    const current = await readBlob(BLOB_PATHNAME)
    if (current && current.length > 0) {
      await put(BACKUP_PATHNAME, JSON.stringify(current), {
        access: 'public', addRandomSuffix: false,
        contentType: 'application/json', cacheControlMaxAge: 0,
      }).catch(e => console.error('Backup failed:', e))
    }

    await put(BLOB_PATHNAME, JSON.stringify(stripped), {
      access: 'public', addRandomSuffix: false,
      contentType: 'application/json', cacheControlMaxAge: 0,
    })

    return Response.json({ ok: true, count: stripped.length })
  } catch (err) {
    console.error('Cellar POST error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
