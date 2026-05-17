#!/usr/bin/env node

// restore.js — run locally to restore your cellar from a backup JSON
// Usage: node restore.js backup.json https://your-app.vercel.app

const fs = require('fs')
const path = require('path')

const backupFile = process.argv[2]
const baseUrl    = process.argv[3]

if (!backupFile || !baseUrl) {
  console.error('Usage: node restore.js <backup.json> <https://your-app.vercel.app>')
  process.exit(1)
}

const raw  = fs.readFileSync(path.resolve(backupFile), 'utf8')
const data = JSON.parse(raw)
const entries = data.cellar || data

if (!Array.isArray(entries)) {
  console.error('Could not find a cellar array in the backup file')
  process.exit(1)
}

console.log(`Found ${entries.length} entries in backup\n`)

async function uploadImage(id, imageData) {
  const res = await fetch(`${baseUrl}/api/image`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, imageData }),
  })
  const json = await res.json()
  if (!json.ok) throw new Error(JSON.stringify(json))
  return json.url
}

async function saveCellar(stripped) {
  const res = await fetch(`${baseUrl}/api/cellar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stripped),
  })
  return res.json()
}

async function main() {
  const restored = []
  let imagesUploaded = 0
  let imagesFailed   = 0

  for (let i = 0; i < entries.length; i++) {
    const { imageData, ...meta } = entries[i]
    process.stdout.write(`[${i + 1}/${entries.length}] ${(meta.name || 'Unknown').slice(0,40).padEnd(40)} `)

    let imgUrl = null

    if (imageData && imageData.startsWith('data:')) {
      try {
        imgUrl = await uploadImage(meta.id, imageData)
        imagesUploaded++
        process.stdout.write('📷 ✓\n')
      } catch (e) {
        imagesFailed++
        process.stdout.write(`📷 ✗  ${e.message}\n`)
      }
    } else if (imageData && imageData.startsWith('http')) {
      imgUrl = imageData
      process.stdout.write('URL kept\n')
    } else {
      process.stdout.write('no photo\n')
    }

    restored.push({ ...meta })
    // Small delay to avoid hammering the API
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('\nSaving cellar metadata...')
  const result = await saveCellar(restored)
  console.log('Result:', result)

  console.log('\n─── Restore complete ───────────────────')
  console.log(`Entries restored : ${restored.length}`)
  console.log(`Photos uploaded  : ${imagesUploaded}`)
  console.log(`Photos failed    : ${imagesFailed}`)
  if (imagesFailed > 0) {
    console.log('\nFailed photos can be re-added by using Re-analyze on each card.')
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
