'use client'

import { useState, useEffect, useRef } from 'react'

const STORE_KEY = 'wine-cellar-v2'

function loadEntries() {
  try {
    const saved = localStorage.getItem(STORE_KEY)
    if (saved) return JSON.parse(saved)
  } catch (_) {}
  return []
}

function saveEntries(entries) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(entries))
  } catch (_) {}
}

const VERDICT_CONFIG = {
  'DRINK NOW':            { color: '#1a5c38', bg: '#d4edda', icon: '🍷', label: 'Drink Now' },
  'PEAK SOON':            { color: '#b5451b', bg: '#fde8d8', icon: '⏳', label: 'Peak Soon' },
  'HOLD':                 { color: '#1d3557', bg: '#d6e8f7', icon: '🔒', label: 'Hold' },
  'PAST PEAK':            { color: '#6b4c11', bg: '#f5e6c8', icon: '📉', label: 'Past Peak' },
  'PROBABLY UNDRINKABLE': { color: '#7a1a1a', bg: '#f8d7d7', icon: '💀', label: 'Probably Undrinkable' },
  'UNKNOWN':              { color: '#555',    bg: '#eeeeee', icon: '❓', label: 'Unknown' },
}

const labelStyle = {
  fontSize: '11px', fontWeight: '700', color: '#9a7060',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  fontFamily: 'Georgia, serif', marginBottom: '2px',
}
const valueStyle = {
  fontSize: '13px', color: '#2c1810',
  fontFamily: "'Lora', Georgia, serif", marginBottom: '8px',
}

function Row({ label, value }) {
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={labelStyle}>{label}</div>
      <div style={valueStyle}>{value}</div>
    </div>
  )
}

function WineCard({ entry, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const verdict = VERDICT_CONFIG[entry.verdict] || VERDICT_CONFIG['UNKNOWN']

  return (
    <div style={{
      background: '#fff', border: '1px solid #e8ddd0', borderRadius: '12px',
      marginBottom: '12px', overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(80,30,20,0.06)',
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: '14px 16px', cursor: 'pointer',
        display: 'flex', alignItems: 'flex-start', gap: '12px',
      }}>
        {entry.imageData && (
          <img src={entry.imageData} alt="label" style={{
            width: '44px', height: '60px', objectFit: 'cover',
            borderRadius: '6px', border: '1px solid #e0d4c4', flexShrink: 0,
          }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '15px', fontWeight: '700', color: '#2c1810',
            lineHeight: 1.3, marginBottom: '3px',
          }}>{entry.name}</div>
          <div style={{
            fontSize: '12px', color: '#7a6055',
            fontFamily: "'Lora', Georgia, serif", marginBottom: '6px',
          }}>{entry.vintage} · {entry.region}</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: verdict.bg, color: verdict.color,
              fontSize: '11px', fontWeight: '700', padding: '2px 8px',
              borderRadius: '20px', letterSpacing: '0.04em', fontFamily: 'Georgia, serif',
            }}>{verdict.icon} {verdict.label}</span>
            <span style={{
              fontSize: '12px', color: '#8b4513',
              fontFamily: "'Lora', Georgia, serif", fontWeight: '600',
            }}>{entry.estimatedValue}</span>
          </div>
        </div>
        <div style={{
          fontSize: '18px', color: '#c0a080', flexShrink: 0, marginTop: '2px',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s',
        }}>▾</div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #f0e8de', padding: '14px 16px', background: '#fdfaf7' }}>
          <Row label="Producer" value={entry.producer} />
          <Row label="Varietal" value={entry.varietal} />
          <Row label="Drinking Window" value={entry.drinkingWindow} />
          <Row label="Verdict" value={entry.verdictReason} />
          <div style={{ marginBottom: '10px' }}>
            <div style={labelStyle}>Characteristics</div>
            <div style={{ ...valueStyle, fontStyle: 'italic', lineHeight: 1.6 }}>
              {entry.characteristics}
            </div>
          </div>
          {entry.confidence && <Row label="ID Confidence" value={entry.confidence} />}
          <Row label="Scanned" value={new Date(entry.scannedAt).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric'
          })} />
          <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }} style={{
            marginTop: '8px', background: 'none', border: '1px solid #e0c8b8',
            color: '#b05030', borderRadius: '6px', padding: '5px 12px',
            fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif',
          }}>Remove from cellar</button>
        </div>
      )}
    </div>
  )
}

// Resize image to max 1568px and re-encode as JPEG
function resizeImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const MAX = 1568
      let { width, height } = img
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX }
        else { width = Math.round(width * MAX / height); height = MAX }
      }
      const canvas = document.createElement('canvas')
      canvas.width = width; canvas.height = height
      canvas.getContext('2d').drawImage(img, 0, 0, width, height)
      resolve(canvas.toDataURL('image/jpeg', 0.82))
    }
    img.src = dataUrl
  })
}

export default function WineCellar() {
  const [view, setView]               = useState('scan')
  const [imageData, setImageData]     = useState(null)
  const [extraImages, setExtraImages] = useState([])
  const [loading, setLoading]         = useState(false)
  const [result, setResult]           = useState(null)
  const [error, setError]             = useState(null)
  const [clarifying, setClarifying]   = useState(false)
  const [clarifyText, setClarifyText] = useState('')
  const [entries, setEntries]         = useState([])
  const [search, setSearch]           = useState('')
  const fileRef  = useRef()
  const extraRef = useRef()

  useEffect(() => {
    setEntries(loadEntries())
  }, [])

  const persistAndSet = (updated) => {
    setEntries(updated)
    saveEntries(updated)
  }

  const handleImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageData(e.target.result)
      setResult(null); setError(null)
      setClarifying(false); setExtraImages([]); setClarifyText('')
    }
    reader.readAsDataURL(file)
  }

  const handleExtraImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setExtraImages(prev => [...prev, e.target.result])
    reader.readAsDataURL(file)
  }

  const analyze = async (withExtras = false) => {
    if (!imageData) return
    setLoading(true); setError(null); setResult(null)

    try {
      // Resize all images before sending
      const primaryResized = await resizeImage(imageData)
      const images = [primaryResized.split(',')[1]]

      if (withExtras) {
        for (const img of extraImages) {
          const r = await resizeImage(img)
          images.push(r.split(',')[1])
        }
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images,
          clarificationText: withExtras && clarifyText.trim() ? clarifyText.trim() : null,
        }),
      })

      const parsed = await res.json()

      if (parsed.error) {
        setError(parsed.error); setClarifying(false)
      } else if (parsed.confidence === 'LOW' && parsed.clarificationNeeded && !withExtras) {
        setResult(parsed); setClarifying(true)
      } else {
        setResult(parsed); setClarifying(false)
      }
    } catch (e) {
      setError('Request failed: ' + e.message)
    }
    setLoading(false)
  }

  const addToCellar = () => {
    if (!result) return
    const entry = { ...result, id: Date.now().toString(), imageData, scannedAt: new Date().toISOString() }
    persistAndSet([entry, ...entries])
    setResult(null); setImageData(null)
    setExtraImages([]); setClarifyText(''); setClarifying(false)
    setView('cellar')
  }

  const deleteEntry = (id) => persistAndSet(entries.filter(e => e.id !== id))

  const reset = () => {
    setImageData(null); setResult(null); setError(null)
    setClarifying(false); setExtraImages([]); setClarifyText('')
  }

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    return !q || [e.name, e.producer, e.region, e.varietal, e.vintage, e.verdict, e.characteristics]
      .some(f => f?.toLowerCase().includes(q))
  })

  const verdict = result ? (VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG['UNKNOWN']) : null

  return (
    <div style={{ minHeight: '100vh', background: '#f7f2eb', fontFamily: "'Lora', Georgia, serif", maxWidth: '480px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #3d0c02 0%, #6b1a0e 60%, #8b2500 100%)',
        padding: '44px 20px 20px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#f5e6cc', fontWeight: '700', letterSpacing: '0.02em', marginBottom: '2px' }}>
            🍷 Cave Personnelle
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(245,230,200,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Your Personal Wine Journal
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #e8ddd0', position: 'sticky', top: 0, zIndex: 10 }}>
        {['scan', 'cellar'].map(tab => (
          <button key={tab} onClick={() => setView(tab)} style={{
            flex: 1, padding: '13px', background: 'none', border: 'none',
            borderBottom: view === tab ? '2px solid #8b2500' : '2px solid transparent',
            marginBottom: '-2px', color: view === tab ? '#8b2500' : '#9a7060',
            fontFamily: "'Playfair Display', Georgia, serif", fontSize: '14px',
            fontWeight: view === tab ? '700' : '400', cursor: 'pointer', letterSpacing: '0.03em',
          }}>
            {tab === 'scan' ? '📸 Scan Label' : `📚 My Cellar (${entries.length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* SCAN VIEW */}
        {view === 'scan' && (
          <div>
            {/* Upload area */}
            <div onClick={() => !imageData && fileRef.current?.click()} style={{
              border: '2px dashed #c8b09a', borderRadius: '14px',
              padding: imageData ? '12px' : '28px 20px',
              textAlign: 'center', cursor: imageData ? 'default' : 'pointer',
              background: '#fff', marginBottom: '12px', overflow: 'hidden',
            }}>
              {imageData ? (
                <img src={imageData} alt="label" style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: '8px', display: 'block', margin: '0 auto', boxShadow: '0 4px 16px rgba(80,20,10,0.18)' }} />
              ) : (
                <>
                  <div style={{ fontSize: '44px', marginBottom: '10px' }}>🏷️</div>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#5c3a28', marginBottom: '4px' }}>Tap to photograph a wine label</div>
                  <div style={{ fontSize: '12px', color: '#a08070' }}>Or choose from your camera roll</div>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleImage(e.target.files[0])} />
            <input ref={extraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleExtraImage(e.target.files[0])} />

            {imageData && !result && !clarifying && (
              <button onClick={() => analyze(false)} disabled={loading} style={{
                width: '100%', padding: '15px',
                background: loading ? '#c0a090' : 'linear-gradient(135deg, #6b1a0e, #8b2500)',
                color: '#f5e6cc', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em', marginBottom: '10px',
                boxShadow: '0 4px 14px rgba(100,20,10,0.25)',
              }}>
                {loading ? 'Consulting the sommelier…' : 'Analyze This Wine'}
              </button>
            )}

            {imageData && !loading && (
              <button onClick={reset} style={{
                width: '100%', padding: '10px', background: 'none',
                border: '1px solid #ddd', borderRadius: '8px', color: '#9a7060',
                fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif', marginBottom: '14px',
              }}>Choose a different photo</button>
            )}

            {error && (
              <div style={{ background: '#fff5f0', border: '1px solid #f0c8b8', borderRadius: '10px', padding: '14px 16px', color: '#8b2500', fontSize: '14px', fontFamily: 'Georgia, serif', marginBottom: '16px' }}>
                ⚠️ {error}
              </div>
            )}

            {/* Clarification panel */}
            {clarifying && result && (
              <div style={{ background: '#fffbf2', border: '2px solid #e8c870', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: '700', color: '#7a4f00', marginBottom: '8px' }}>
                  🔍 I need a little more to go on…
                </div>
                <div style={{ fontSize: '13px', color: '#5a3a00', lineHeight: 1.6, fontFamily: 'Georgia, serif', marginBottom: '14px' }}>
                  I can see a wine label but I am not confident in my identification. Here is what would help:
                </div>
                {result.clarificationQuestions?.map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ color: '#b5851b', fontWeight: '700', flexShrink: 0 }}>•</span>
                    <div style={{ fontSize: '13px', color: '#5a3a00', fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>{q}</div>
                  </div>
                ))}
                {extraImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
                    {extraImages.map((img, i) => (
                      <img key={i} src={img} alt={`extra ${i + 1}`} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #e8c870' }} />
                    ))}
                  </div>
                )}
                <button onClick={() => extraRef.current?.click()} style={{
                  width: '100%', padding: '11px', background: 'none',
                  border: '2px dashed #d4a830', borderRadius: '8px',
                  color: '#7a4f00', fontSize: '13px', cursor: 'pointer',
                  fontFamily: 'Georgia, serif', marginBottom: '10px',
                }}>
                  📷 Add another photo{extraImages.length > 0 ? ` (${extraImages.length} added)` : ''}
                </button>
                <textarea
                  placeholder="Or type anything helpful: vintage, where you bought it, what's on the back label…"
                  value={clarifyText}
                  onChange={e => setClarifyText(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px',
                    border: '1px solid #d4a830', borderRadius: '8px',
                    fontSize: '13px', fontFamily: 'Georgia, serif',
                    color: '#2c1810', background: '#fff', resize: 'none',
                    outline: 'none', marginBottom: '12px',
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => analyze(true)} disabled={loading} style={{
                    flex: 2, padding: '12px',
                    background: loading ? '#c0a090' : 'linear-gradient(135deg, #7a4f00, #b5851b)',
                    color: '#fff8e6', border: 'none', borderRadius: '8px',
                    fontSize: '13px', fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                  }}>
                    {loading ? 'Re-analyzing…' : 'Re-analyze with More Info'}
                  </button>
                  <button onClick={() => setClarifying(false)} style={{
                    flex: 1, padding: '12px', background: 'none',
                    border: '1px solid #d4a830', borderRadius: '8px',
                    color: '#7a4f00', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif',
                  }}>Show Anyway</button>
                </div>
              </div>
            )}

            {/* Result card */}
            {result && !clarifying && verdict && (
              <div style={{ background: '#fff', borderRadius: '14px', border: '1px solid #e8ddd0', overflow: 'hidden', boxShadow: '0 4px 20px rgba(80,20,10,0.1)' }}>
                <div style={{ background: 'linear-gradient(135deg, #3d0c02, #6b1a0e)', padding: '16px', color: '#f5e6cc' }}>
                  <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: '700', marginBottom: '3px' }}>{result.name}</div>
                  <div style={{ fontSize: '13px', opacity: 0.75 }}>{result.vintage} · {result.region}</div>
                </div>
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: verdict.bg, color: verdict.color, padding: '6px 14px', borderRadius: '24px', fontSize: '13px', fontWeight: '700', fontFamily: 'Georgia, serif', marginBottom: '14px', letterSpacing: '0.03em' }}>
                    {verdict.icon} {verdict.label}
                  </div>
                  {result.confidence === 'LOW' && (
                    <div style={{ background: '#fffbf2', border: '1px solid #e8c870', borderRadius: '8px', padding: '8px 12px', fontSize: '12px', color: '#7a4f00', fontFamily: 'Georgia, serif', marginBottom: '12px' }}>
                      ⚠️ Low confidence identification — results may be approximate
                    </div>
                  )}
                  <Row label="Producer" value={result.producer} />
                  <Row label="Varietal" value={result.varietal} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <Row label="Est. Value" value={result.estimatedValue} />
                    <Row label="Drinking Window" value={result.drinkingWindow} />
                  </div>
                  <Row label="Why" value={result.verdictReason} />
                  <div style={{ marginBottom: '14px' }}>
                    <div style={labelStyle}>Characteristics</div>
                    <div style={{ ...valueStyle, fontStyle: 'italic', lineHeight: 1.7, background: '#fdfaf7', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f0e8de', marginTop: '2px' }}>
                      {result.characteristics}
                    </div>
                  </div>
                  {result.confidence && <Row label="Identification Confidence" value={result.confidence} />}
                  <button onClick={addToCellar} style={{
                    width: '100%', padding: '13px',
                    background: 'linear-gradient(135deg, #1a3d1a, #2d6a2d)',
                    color: '#d8f3d8', border: 'none', borderRadius: '10px',
                    fontSize: '14px', fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: '700', cursor: 'pointer', letterSpacing: '0.04em', marginTop: '4px',
                  }}>+ Add to My Cellar</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CELLAR VIEW */}
        {view === 'cellar' && (
          <div>
            {entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9a7060' }}>
                <div style={{ fontSize: '52px', marginBottom: '12px' }}>🏚️</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#5c3a28', marginBottom: '8px' }}>Your cellar is empty</div>
                <div style={{ fontSize: '14px' }}>Scan a wine label to start your collection</div>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search by name, region, varietal, characteristics…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '10px',
                    border: '1px solid #ddd4c8', background: '#fff',
                    fontSize: '14px', color: '#2c1810',
                    marginBottom: '6px', outline: 'none',
                  }}
                />
                <div style={{ fontSize: '12px', color: '#9a7060', fontFamily: 'Georgia, serif', marginBottom: '12px', textAlign: 'right' }}>
                  {filtered.length} of {entries.length} bottle{entries.length !== 1 ? 's' : ''}
                </div>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#9a7060', padding: '24px', fontSize: '14px' }}>No wines match "{search}"</div>
                ) : (
                  filtered.map(entry => <WineCard key={entry.id} entry={entry} onDelete={deleteEntry} />)
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
