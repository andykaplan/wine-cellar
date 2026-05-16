'use client'

import { useState, useEffect, useRef } from 'react'

// ── Storage helpers ───────────────────────────────────────────────────────────
async function loadEntries() {
  try {
    const res = await fetch(window.location.origin + '/api/cellar')
    if (!res.ok) return []
    return await res.json()
  } catch (_) { return [] }
}

async function saveEntries(entries) {
  try {
    await fetch(window.location.origin + '/api/cellar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entries),
    })
  } catch (_) {}
}

async function loadHistory() {
  try {
    const res = await fetch(window.location.origin + '/api/history')
    if (!res.ok) return []
    return await res.json()
  } catch (_) { return [] }
}

async function saveHistoryEntry(entry) {
  try {
    await fetch(window.location.origin + '/api/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    })
  } catch (_) {}
}

// ── Constants ─────────────────────────────────────────────────────────────────
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

// ── WineCard ──────────────────────────────────────────────────────────────────
function WineCard({ entry, onDelete, onMarkDrunk, onQuantityChange, isHighlighted }) {
  const [expanded, setExpanded] = useState(false)
  const [ratingMode, setRatingMode] = useState(false)
  const [hoveredRating, setHoveredRating] = useState(0)
  const verdict = VERDICT_CONFIG[entry.verdict] || VERDICT_CONFIG['UNKNOWN']
  const qty = entry.quantity || 1

  useEffect(() => { if (isHighlighted) setExpanded(true) }, [isHighlighted])

  const handleRate = async (rating) => {
    setRatingMode(false)
    await onMarkDrunk(entry, rating)
  }

  return (
    <div style={{
      background: '#fff',
      border: isHighlighted ? '2px solid #8b2500' : '1px solid #e8ddd0',
      borderRadius: '12px', marginBottom: '12px', overflow: 'hidden',
      boxShadow: isHighlighted ? '0 4px 20px rgba(100,20,10,0.18)' : '0 2px 8px rgba(80,30,20,0.06)',
      transition: 'border 0.3s, box-shadow 0.3s',
    }}>
      <div onClick={() => !ratingMode && setExpanded(!expanded)} style={{
        padding: '14px 16px', cursor: ratingMode ? 'default' : 'pointer',
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
          <div style={{ fontSize: '12px', color: '#7a6055', fontFamily: "'Lora', Georgia, serif", marginBottom: '6px' }}>
            {entry.vintage} · {entry.region}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: verdict.bg, color: verdict.color,
              fontSize: '11px', fontWeight: '700', padding: '2px 8px',
              borderRadius: '20px', letterSpacing: '0.04em', fontFamily: 'Georgia, serif',
            }}>{verdict.icon} {verdict.label}</span>
            <span style={{ fontSize: '12px', color: '#8b4513', fontFamily: "'Lora', Georgia, serif", fontWeight: '600' }}>
              {entry.estimatedValue}
            </span>
          </div>
        </div>
        {/* Quantity badge */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          gap: '4px', flexShrink: 0,
        }}>
          <div style={{
            background: qty > 1 ? 'linear-gradient(135deg, #3d0c02, #6b1a0e)' : '#f0e8de',
            color: qty > 1 ? '#f5e6cc' : '#9a7060',
            borderRadius: '10px', padding: '3px 8px', minWidth: '32px', textAlign: 'center',
            fontFamily: "'Playfair Display', Georgia, serif", fontSize: '14px', fontWeight: '700',
          }}>
            {qty > 1 ? `×${qty}` : '×1'}
          </div>
          {!ratingMode && (
            <div style={{ fontSize: '16px', color: '#c0a080', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</div>
          )}
        </div>
      </div>

      {/* Rating mode */}
      {ratingMode && (
        <div style={{ borderTop: '1px solid #f0e8de', padding: '14px 16px', background: '#fdfaf7' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '15px', fontWeight: '700', color: '#2c1810', marginBottom: '4px' }}>
            How was it?
          </div>
          <div style={{ fontSize: '12px', color: '#9a7060', fontFamily: 'Georgia, serif', marginBottom: '12px' }}>
            {qty > 1 ? `This will use one bottle (${qty - 1} remaining after)` : 'This will remove the last bottle from your cellar'}
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <button key={n} onClick={() => handleRate(n)}
                onMouseEnter={() => setHoveredRating(n)}
                onMouseLeave={() => setHoveredRating(0)}
                style={{
                  width: '40px', height: '40px', borderRadius: '8px', border: 'none',
                  background: n <= hoveredRating ? 'linear-gradient(135deg, #6b1a0e, #8b2500)' : '#f0e8de',
                  color: n <= hoveredRating ? '#f5e6cc' : '#5c3a28',
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '15px', fontWeight: '700', cursor: 'pointer', transition: 'all 0.1s',
                }}>{n}</button>
            ))}
          </div>
          <button onClick={() => setRatingMode(false)} style={{
            background: 'none', border: '1px solid #ddd', borderRadius: '6px',
            padding: '6px 14px', fontSize: '12px', color: '#9a7060',
            cursor: 'pointer', fontFamily: 'Georgia, serif',
          }}>Cancel</button>
        </div>
      )}

      {expanded && !ratingMode && (
        <div style={{ borderTop: '1px solid #f0e8de', padding: '14px 16px', background: '#fdfaf7' }}>

          {/* Quantity adjuster */}
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Bottles in Cellar</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px' }}>
              <button onClick={(e) => { e.stopPropagation(); onQuantityChange(entry.id, qty - 1) }}
                disabled={qty <= 1}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e0c8b8',
                  background: qty <= 1 ? '#f8f4f0' : '#fff', color: qty <= 1 ? '#c0b0a0' : '#6b1a0e',
                  fontSize: '20px', cursor: qty <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700',
                  lineHeight: 1,
                }}>−</button>
              <div style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '22px', fontWeight: '700', color: '#2c1810', minWidth: '24px', textAlign: 'center',
              }}>{qty}</div>
              <button onClick={(e) => { e.stopPropagation(); onQuantityChange(entry.id, qty + 1) }}
                style={{
                  width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e0c8b8',
                  background: '#fff', color: '#6b1a0e', fontSize: '20px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700',
                  lineHeight: 1,
                }}>+</button>
              <div style={{ fontSize: '12px', color: '#9a7060', fontFamily: 'Georgia, serif' }}>
                {qty === 1 ? 'bottle' : 'bottles'}
              </div>
            </div>
          </div>

          <Row label="Producer" value={entry.producer} />
          <Row label="Varietal" value={entry.varietal} />
          <Row label="Drinking Window" value={entry.drinkingWindow} />
          <Row label="Verdict" value={entry.verdictReason} />
          <div style={{ marginBottom: '10px' }}>
            <div style={labelStyle}>Characteristics</div>
            <div style={{ ...valueStyle, fontStyle: 'italic', lineHeight: 1.6 }}>{entry.characteristics}</div>
          </div>
          {entry.confidence && <Row label="ID Confidence" value={entry.confidence} />}
          <Row label="Scanned" value={new Date(entry.scannedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />

          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button onClick={(e) => { e.stopPropagation(); setRatingMode(true) }} style={{
              flex: 2, padding: '8px 12px',
              background: 'linear-gradient(135deg, #1a3d1a, #2d6a2d)',
              color: '#d8f3d8', border: 'none', borderRadius: '6px',
              fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', fontWeight: '600',
            }}>🍷 I drank one</button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(entry.id) }} style={{
              flex: 1, background: 'none', border: '1px solid #e0c8b8',
              color: '#b05030', borderRadius: '6px', padding: '8px 12px',
              fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif',
            }}>Remove all</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── HistoryCard ───────────────────────────────────────────────────────────────
function HistoryCard({ entry }) {
  const [expanded, setExpanded] = useState(false)
  const ratingColor = entry.rating >= 8 ? '#1a5c38' : entry.rating >= 6 ? '#6b4c11' : '#7a1a1a'
  const ratingBg   = entry.rating >= 8 ? '#d4edda' : entry.rating >= 6 ? '#f5e6c8' : '#f8d7d7'

  return (
    <div style={{
      background: '#fff', border: '1px solid #e8ddd0', borderRadius: '12px',
      marginBottom: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(80,30,20,0.06)',
    }}>
      <div onClick={() => setExpanded(!expanded)} style={{
        padding: '14px 16px', cursor: 'pointer',
        display: 'flex', alignItems: 'flex-start', gap: '12px',
      }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '10px', flexShrink: 0,
          background: ratingBg, color: ratingColor,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${ratingColor}30`,
        }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', fontWeight: '700', lineHeight: 1 }}>{entry.rating}</div>
          <div style={{ fontSize: '9px', fontFamily: 'Georgia, serif', opacity: 0.7, letterSpacing: '0.05em' }}>/10</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '15px', fontWeight: '700', color: '#2c1810', lineHeight: 1.3, marginBottom: '3px' }}>{entry.name}</div>
          <div style={{ fontSize: '12px', color: '#7a6055', fontFamily: "'Lora', Georgia, serif", marginBottom: '4px' }}>{entry.vintage} · {entry.region}</div>
          <div style={{ fontSize: '11px', color: '#a08070', fontFamily: 'Georgia, serif' }}>
            Drunk {new Date(entry.drunkOn).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </div>
        </div>
        <div style={{ fontSize: '18px', color: '#c0a080', flexShrink: 0, marginTop: '2px', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid #f0e8de', padding: '14px 16px', background: '#fdfaf7' }}>
          {entry.producer && <Row label="Producer" value={entry.producer} />}
          {entry.varietal && <Row label="Varietal" value={entry.varietal} />}
          {entry.characteristics && (
            <div style={{ marginBottom: '8px' }}>
              <div style={labelStyle}>Characteristics</div>
              <div style={{ fontSize: '13px', color: '#2c1810', fontFamily: "'Lora', Georgia, serif", fontStyle: 'italic', lineHeight: 1.6 }}>{entry.characteristics}</div>
            </div>
          )}
          {entry.verdict && <Row label="Was" value={entry.verdict} />}
          <div style={{ marginTop: '6px' }}>
            <div style={labelStyle}>Your Rating</div>
            <div style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
              {[1,2,3,4,5,6,7,8,9,10].map(n => (
                <div key={n} style={{
                  width: '22px', height: '22px', borderRadius: '4px',
                  background: n <= entry.rating ? ratingBg : '#f0e8de',
                  border: `1px solid ${n <= entry.rating ? ratingColor + '60' : '#e0d4c4'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '10px', color: n <= entry.rating ? ratingColor : '#c0b0a0',
                  fontFamily: 'Georgia, serif', fontWeight: '700',
                }}>{n}</div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── HistoryView ───────────────────────────────────────────────────────────────
function HistoryView({ history }) {
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('date')

  const filtered = history
    .filter(e => {
      const q = search.toLowerCase()
      return !q || [e.name, e.producer, e.region, e.varietal, e.vintage].some(f => f?.toLowerCase().includes(q))
    })
    .sort((a, b) => sort === 'rating' ? (b.rating || 0) - (a.rating || 0) : new Date(b.drunkOn) - new Date(a.drunkOn))

  const avgRating = history.length > 0
    ? (history.reduce((sum, e) => sum + (e.rating || 0), 0) / history.length).toFixed(1)
    : null

  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: '700', color: '#2c1810', marginBottom: '4px' }}>Drinking History</div>
      <div style={{ fontSize: '13px', color: '#9a7060', fontFamily: 'Georgia, serif', marginBottom: '16px' }}>Bottles you have enjoyed from your cellar</div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9a7060' }}>
          <div style={{ fontSize: '52px', marginBottom: '12px' }}>📖</div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#5c3a28', marginBottom: '8px' }}>No history yet</div>
          <div style={{ fontSize: '14px' }}>Mark bottles as drunk from your cellar to build your tasting history</div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
            <div style={{ flex: 1, background: '#fff', border: '1px solid #e8ddd0', borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: '700', color: '#2c1810' }}>{history.length}</div>
              <div style={{ fontSize: '11px', color: '#9a7060', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bottles</div>
            </div>
            {avgRating && (
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e8ddd0', borderRadius: '10px', padding: '10px 14px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '22px', fontWeight: '700', color: '#2c1810' }}>{avgRating}</div>
                <div style={{ fontSize: '11px', color: '#9a7060', fontFamily: 'Georgia, serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Avg Rating</div>
              </div>
            )}
          </div>

          <input type="text" placeholder="Search history…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ddd4c8', background: '#fff', fontSize: '16px', color: '#2c1810', marginBottom: '8px', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            {[['date', 'Most Recent'], ['rating', 'Highest Rated']].map(([val, label]) => (
              <button key={val} onClick={() => setSort(val)} style={{
                flex: 1, padding: '7px', borderRadius: '8px', cursor: 'pointer',
                fontFamily: 'Georgia, serif', fontSize: '12px', fontWeight: sort === val ? '700' : '400',
                background: sort === val ? '#2c1810' : 'none',
                color: sort === val ? '#f5e6cc' : '#7a6055',
                border: sort === val ? 'none' : '1px solid #ddd4c8',
              }}>{label}</button>
            ))}
          </div>
          <div style={{ fontSize: '12px', color: '#9a7060', fontFamily: 'Georgia, serif', marginBottom: '10px', textAlign: 'right' }}>
            {filtered.length} of {history.length} bottle{history.length !== 1 ? 's' : ''}
          </div>
          {filtered.length === 0
            ? <div style={{ textAlign: 'center', color: '#9a7060', padding: '24px', fontSize: '14px' }}>No wines match "{search}"</div>
            : filtered.map((entry, i) => <HistoryCard key={entry.id + '-' + i} entry={entry} />)
          }
        </>
      )}
    </div>
  )
}

// ── RecoCard ──────────────────────────────────────────────────────────────────
function RecoCard({ wine, rank, onGoToEntry }) {
  const isFirst = rank === 1
  return (
    <div style={{
      background: '#fff', border: isFirst ? '2px solid #8b2500' : '1px solid #e8ddd0',
      borderRadius: '14px', marginBottom: '14px', overflow: 'hidden',
      boxShadow: isFirst ? '0 4px 20px rgba(100,20,10,0.14)' : '0 2px 8px rgba(80,30,20,0.06)',
    }}>
      <div style={{
        background: isFirst ? 'linear-gradient(135deg, #3d0c02, #6b1a0e)' : 'linear-gradient(135deg, #4a3828, #6b5040)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        <div style={{
          background: isFirst ? '#f5e6cc' : 'rgba(245,230,200,0.3)', color: isFirst ? '#6b1a0e' : '#f5e6cc',
          borderRadius: '50%', width: '28px', height: '28px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '700', fontSize: '14px', flexShrink: 0,
        }}>{rank}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '15px', fontWeight: '700', color: '#f5e6cc', lineHeight: 1.3 }}>{wine.name}</div>
          <div style={{ fontSize: '12px', color: 'rgba(245,230,200,0.7)' }}>{wine.vintage}</div>
        </div>
        {isFirst && (
          <div style={{ fontSize: '11px', background: '#f5e6cc', color: '#6b1a0e', padding: '3px 8px', borderRadius: '12px', fontFamily: 'Georgia, serif', fontWeight: '700', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
            TONIGHT'S PICK
          </div>
        )}
      </div>
      <div style={{ padding: '14px 16px' }}>
        <div style={{ fontSize: '13px', color: '#2c1810', fontFamily: "'Lora', Georgia, serif", lineHeight: 1.7, marginBottom: '12px' }}>{wine.reason}</div>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
          <div style={{ flex: 1, background: '#fdfaf7', borderRadius: '8px', padding: '8px 10px', border: '1px solid #f0e8de' }}>
            <div style={labelStyle}>Serve at</div>
            <div style={{ fontSize: '12px', color: '#2c1810', fontFamily: 'Georgia, serif' }}>{wine.serveTemp}</div>
          </div>
          <div style={{ flex: 1, background: '#fdfaf7', borderRadius: '8px', padding: '8px 10px', border: '1px solid #f0e8de' }}>
            <div style={labelStyle}>Decant</div>
            <div style={{ fontSize: '12px', color: '#2c1810', fontFamily: 'Georgia, serif' }}>{wine.decant}</div>
          </div>
        </div>
        {wine.id && (
          <button onClick={() => onGoToEntry(wine.id)} style={{
            width: '100%', padding: '8px', background: 'none',
            border: '1px solid #c8b09a', borderRadius: '8px', color: '#6b3a2a',
            fontSize: '12px', cursor: 'pointer', fontFamily: 'Georgia, serif', letterSpacing: '0.02em',
          }}>📋 View this bottle in my cellar</button>
        )}
      </div>
    </div>
  )
}

// ── TonightView ───────────────────────────────────────────────────────────────
function TonightView({ entries, history, preference, setPreference, foodPairing, setFoodPairing,
  reco, setReco, recoLoading, setRecoLoading, recoError, setRecoError, goToEntry }) {

  const getRecommendation = async () => {
    if (entries.length === 0) { setRecoError('Your cellar is empty — scan some labels first!'); return }
    setRecoLoading(true); setRecoError(null); setReco(null)
    try {
      const res = await fetch(window.location.origin + '/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cellar: entries, preference, foodPairing, history }),
      })
      const data = await res.json()
      if (data.error) setRecoError(data.error)
      else setReco(data)
    } catch (e) { setRecoError('Request failed: ' + e.message) }
    setRecoLoading(false)
  }

  const btnBase = { flex: 1, padding: '10px 6px', border: '2px solid #c8b09a', borderRadius: '8px', background: 'none', cursor: 'pointer', fontFamily: "'Playfair Display', Georgia, serif", fontSize: '13px', fontWeight: '600' }

  return (
    <div>
      <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '20px', fontWeight: '700', color: '#2c1810', marginBottom: '4px' }}>What should I drink tonight?</div>
      <div style={{ fontSize: '13px', color: '#9a7060', fontFamily: 'Georgia, serif', marginBottom: '20px' }}>The sommelier will choose from your cellar, prioritizing bottles that need drinking soon.</div>

      <div style={labelStyle}>I am in the mood for</div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {[['', 'Either'], ['red', '🍷 Red'], ['white', '🥂 White']].map(([val, label]) => (
          <button key={val} onClick={() => setPreference(val)} style={{
            ...btnBase,
            background: preference === val ? 'linear-gradient(135deg, #6b1a0e, #8b2500)' : 'none',
            color: preference === val ? '#f5e6cc' : '#7a5040',
            borderColor: preference === val ? '#8b2500' : '#c8b09a',
          }}>{label}</button>
        ))}
      </div>

      <div style={labelStyle}>Food pairing (optional)</div>
      <input type="text" placeholder="e.g. grilled salmon, pasta, cheese board…"
        value={foodPairing} onChange={e => setFoodPairing(e.target.value)}
        style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', border: '1px solid #ddd4c8', background: '#fff', fontSize: '16px', color: '#2c1810', marginBottom: '18px', outline: 'none' }}
      />

      <button onClick={getRecommendation} disabled={recoLoading} style={{
        width: '100%', padding: '15px',
        background: recoLoading ? '#c0a090' : 'linear-gradient(135deg, #6b1a0e, #8b2500)',
        color: '#f5e6cc', border: 'none', borderRadius: '10px',
        fontSize: '15px', fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: '700', cursor: recoLoading ? 'not-allowed' : 'pointer',
        letterSpacing: '0.04em', marginBottom: '20px', boxShadow: '0 4px 14px rgba(100,20,10,0.25)',
      }}>
        {recoLoading ? 'The sommelier is thinking…' : 'Ask the Sommelier'}
      </button>

      {recoError && (
        <div style={{ background: '#fff5f0', border: '1px solid #f0c8b8', borderRadius: '10px', padding: '14px 16px', color: '#8b2500', fontSize: '14px', fontFamily: 'Georgia, serif', marginBottom: '16px' }}>⚠️ {recoError}</div>
      )}

      {reco && (
        <div>
          {reco.sommelierNote && (
            <div style={{ background: '#fdfaf7', border: '1px solid #e8ddd0', borderRadius: '10px', padding: '12px 14px', fontSize: '13px', color: '#5c3a28', fontFamily: "'Lora', Georgia, serif", fontStyle: 'italic', marginBottom: '16px', lineHeight: 1.6 }}>
              🧑‍🍳 {reco.sommelierNote}
            </div>
          )}
          <RecoCard wine={reco.firstChoice} rank={1} onGoToEntry={goToEntry} />
          {reco.secondChoice && <RecoCard wine={reco.secondChoice} rank={2} onGoToEntry={goToEntry} />}
        </div>
      )}
    </div>
  )
}

// ── Image resize ──────────────────────────────────────────────────────────────
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

// ── Main App ──────────────────────────────────────────────────────────────────
export default function WineCellar() {
  const [view, setView]                   = useState('scan')
  const [imageData, setImageData]         = useState(null)
  const [extraImages, setExtraImages]     = useState([])
  const [loading, setLoading]             = useState(false)
  const [result, setResult]               = useState(null)
  const [error, setError]                 = useState(null)
  const [clarifying, setClarifying]       = useState(false)
  const [clarifyText, setClarifyText]     = useState('')
  const [entries, setEntries]             = useState([])
  const [history, setHistory]             = useState([])
  const [storageReady, setStorageReady]   = useState(false)
  const [activeEntryId, setActiveEntryId] = useState(null)
  const [search, setSearch]               = useState('')
  const [preference, setPreference]       = useState('')
  const [foodPairing, setFoodPairing]     = useState('')
  const [reco, setReco]                   = useState(null)
  const [recoLoading, setRecoLoading]     = useState(false)
  const [recoError, setRecoError]         = useState(null)
  // duplicate detection
  const [pendingResult, setPendingResult] = useState(null)
  const [duplicateEntry, setDuplicateEntry] = useState(null)
  const fileRef  = useRef()
  const extraRef = useRef()

  useEffect(() => {
    Promise.all([loadEntries(), loadHistory()]).then(([data, hist]) => {
      setEntries(data); setHistory(hist); setStorageReady(true)
    })
  }, [])

  const persistAndSet = async (updated) => { setEntries(updated); await saveEntries(updated) }

  const handleImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageData(e.target.result)
      setResult(null); setError(null); setClarifying(false)
      setExtraImages([]); setClarifyText('')
      setPendingResult(null); setDuplicateEntry(null)
    }
    reader.readAsDataURL(file)
  }

  const handleExtraImage = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => setExtraImages(prev => [...prev, e.target.result])
    reader.readAsDataURL(file)
  }

  // Simple duplicate check: same name + vintage
  const findDuplicate = (wine) => {
    if (!wine || !wine.name) return null
    return entries.find(e =>
      e.name?.toLowerCase().trim() === wine.name?.toLowerCase().trim() &&
      e.vintage === wine.vintage
    ) || null
  }

  const analyze = async (withExtras = false) => {
    if (!imageData) return
    setLoading(true); setError(null); setResult(null)
    setPendingResult(null); setDuplicateEntry(null)
    try {
      const primaryResized = await resizeImage(imageData)
      const images = [primaryResized.split(',')[1]]
      if (withExtras) {
        for (const img of extraImages) { const r = await resizeImage(img); images.push(r.split(',')[1]) }
      }
      const res = await fetch(window.location.origin + '/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images, clarificationText: withExtras && clarifyText.trim() ? clarifyText.trim() : null }),
      })
      const parsed = await res.json()
      if (parsed.error) { setError(parsed.error); setClarifying(false) }
      else if (parsed.confidence === 'LOW' && parsed.clarificationNeeded && !withExtras) { setResult(parsed); setClarifying(true) }
      else {
        // Check for duplicate before showing result
        const dup = findDuplicate(parsed)
        if (dup) { setPendingResult(parsed); setDuplicateEntry(dup) }
        else { setResult(parsed) }
      }
    } catch (e) { setError('Request failed: ' + e.message) }
    setLoading(false)
  }

  const addToCellar = async () => {
    if (!result) return
    const entry = { ...result, quantity: 1, id: Date.now().toString(), imageData, scannedAt: new Date().toISOString() }
    await persistAndSet([entry, ...entries])
    setResult(null); setImageData(null); setExtraImages([]); setClarifyText(''); setClarifying(false)
    setView('cellar')
  }

  const incrementDuplicate = async () => {
    if (!duplicateEntry) return
    const updated = entries.map(e =>
      e.id === duplicateEntry.id ? { ...e, quantity: (e.quantity || 1) + 1 } : e
    )
    await persistAndSet(updated)
    setPendingResult(null); setDuplicateEntry(null)
    setResult(null); setImageData(null); setExtraImages([]); setClarifyText(''); setClarifying(false)
    setView('cellar')
  }

  const addAsNewEntry = async () => {
    if (!pendingResult) return
    const entry = { ...pendingResult, quantity: 1, id: Date.now().toString(), imageData, scannedAt: new Date().toISOString() }
    await persistAndSet([entry, ...entries])
    setPendingResult(null); setDuplicateEntry(null)
    setResult(null); setImageData(null); setExtraImages([]); setClarifyText(''); setClarifying(false)
    setView('cellar')
  }

  const deleteEntry = async (id) => await persistAndSet(entries.filter(e => e.id !== id))

  const handleQuantityChange = async (id, newQty) => {
    if (newQty < 1) return
    const updated = entries.map(e => e.id === id ? { ...e, quantity: newQty } : e)
    await persistAndSet(updated)
  }

  const markAsDrunk = async (entry, rating) => {
    const histEntry = {
      id: entry.id + '-' + Date.now(),
      cellarId: entry.id,
      name: entry.name, vintage: entry.vintage, producer: entry.producer,
      region: entry.region, varietal: entry.varietal, verdict: entry.verdict,
      characteristics: entry.characteristics, rating,
      drunkOn: new Date().toISOString(),
    }
    await saveHistoryEntry(histEntry)
    setHistory(prev => [histEntry, ...prev])
    const newQty = (entry.quantity || 1) - 1
    if (newQty <= 0) {
      await persistAndSet(entries.filter(e => e.id !== entry.id))
    } else {
      await persistAndSet(entries.map(e => e.id === entry.id ? { ...e, quantity: newQty } : e))
    }
  }

  const goToEntry = (id) => {
    setActiveEntryId(id); setView('cellar')
    setTimeout(() => setActiveEntryId(null), 3000)
  }

  const reset = () => {
    setImageData(null); setResult(null); setError(null)
    setClarifying(false); setExtraImages([]); setClarifyText('')
    setPendingResult(null); setDuplicateEntry(null)
  }

  const filtered = entries.filter(e => {
    const q = search.toLowerCase()
    return !q || [e.name, e.producer, e.region, e.varietal, e.vintage, e.verdict, e.characteristics].some(f => f?.toLowerCase().includes(q))
  })

  const verdict = result ? (VERDICT_CONFIG[result.verdict] || VERDICT_CONFIG['UNKNOWN']) : null

  return (
    <div style={{ minHeight: '100vh', background: '#f7f2eb', fontFamily: "'Lora', Georgia, serif", maxWidth: '480px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #3d0c02 0%, #6b1a0e 60%, #8b2500 100%)', padding: '44px 20px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 0, transparent 50%)', backgroundSize: '12px 12px' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '26px', color: '#f5e6cc', fontWeight: '700', letterSpacing: '0.02em', marginBottom: '2px' }}>🍷 Cave Personnelle</div>
          <div style={{ fontSize: '12px', color: 'rgba(245,230,200,0.65)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Your Personal Wine Journal</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '2px solid #e8ddd0', position: 'sticky', top: 0, zIndex: 10 }}>
        {['scan', 'tonight', 'cellar', 'history'].map(tab => (
          <button key={tab} onClick={() => setView(tab)} style={{
            flex: 1, padding: '11px 4px', background: 'none', border: 'none',
            borderBottom: view === tab ? '2px solid #8b2500' : '2px solid transparent',
            marginBottom: '-2px', color: view === tab ? '#8b2500' : '#9a7060',
            fontFamily: "'Playfair Display', Georgia, serif", fontSize: '11px',
            fontWeight: view === tab ? '700' : '400', cursor: 'pointer', letterSpacing: '0.02em',
          }}>
            {tab === 'scan' ? '📸 Scan' : tab === 'tonight' ? '🍾 Tonight' : tab === 'cellar' ? `📚 Cellar (${entries.length})` : `📖 History (${history.length})`}
          </button>
        ))}
      </div>

      <div style={{ padding: '20px 16px' }}>

        {/* SCAN VIEW */}
        {view === 'scan' && (
          <div>
            <div onClick={() => !imageData && fileRef.current?.click()} style={{
              border: '2px dashed #c8b09a', borderRadius: '14px',
              padding: imageData ? '12px' : '28px 20px',
              textAlign: 'center', cursor: imageData ? 'default' : 'pointer',
              background: '#fff', marginBottom: '12px', overflow: 'hidden',
            }}>
              {imageData
                ? <img src={imageData} alt="label" style={{ maxHeight: '220px', maxWidth: '100%', borderRadius: '8px', display: 'block', margin: '0 auto', boxShadow: '0 4px 16px rgba(80,20,10,0.18)' }} />
                : <>
                    <div style={{ fontSize: '44px', marginBottom: '10px' }}>🏷️</div>
                    <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#5c3a28', marginBottom: '4px' }}>Tap to photograph a wine label</div>
                    <div style={{ fontSize: '12px', color: '#a08070' }}>Or choose from your camera roll</div>
                  </>
              }
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleImage(e.target.files[0])} />
            <input ref={extraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={e => handleExtraImage(e.target.files[0])} />

            {imageData && !result && !clarifying && !pendingResult && (
              <button onClick={() => analyze(false)} disabled={loading} style={{
                width: '100%', padding: '15px',
                background: loading ? '#c0a090' : 'linear-gradient(135deg, #6b1a0e, #8b2500)',
                color: '#f5e6cc', border: 'none', borderRadius: '10px',
                fontSize: '15px', fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.04em', marginBottom: '10px', boxShadow: '0 4px 14px rgba(100,20,10,0.25)',
              }}>
                {loading ? 'Consulting the sommelier…' : 'Analyze This Wine'}
              </button>
            )}

            {imageData && !loading && (
              <button onClick={reset} style={{ width: '100%', padding: '10px', background: 'none', border: '1px solid #ddd', borderRadius: '8px', color: '#9a7060', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif', marginBottom: '14px' }}>
                Choose a different photo
              </button>
            )}

            {error && (
              <div style={{ background: '#fff5f0', border: '1px solid #f0c8b8', borderRadius: '10px', padding: '14px 16px', color: '#8b2500', fontSize: '14px', fontFamily: 'Georgia, serif', marginBottom: '16px' }}>⚠️ {error}</div>
            )}

            {/* Duplicate detected */}
            {pendingResult && duplicateEntry && (
              <div style={{ background: '#fffbf2', border: '2px solid #e8c870', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: '700', color: '#7a4f00', marginBottom: '8px' }}>
                  🍾 Already in your cellar
                </div>
                <div style={{ fontSize: '13px', color: '#5a3a00', lineHeight: 1.6, fontFamily: 'Georgia, serif', marginBottom: '16px' }}>
                  <strong>{duplicateEntry.name} {duplicateEntry.vintage}</strong> is already in your cellar
                  {(duplicateEntry.quantity || 1) > 1 ? ` (×${duplicateEntry.quantity})` : ''}. What would you like to do?
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={incrementDuplicate} style={{
                    flex: 2, padding: '12px',
                    background: 'linear-gradient(135deg, #6b1a0e, #8b2500)',
                    color: '#f5e6cc', border: 'none', borderRadius: '8px',
                    fontSize: '13px', fontFamily: "'Playfair Display', Georgia, serif",
                    fontWeight: '700', cursor: 'pointer',
                  }}>+ Add another bottle</button>
                  <button onClick={addAsNewEntry} style={{
                    flex: 1, padding: '12px', background: 'none',
                    border: '1px solid #d4a830', borderRadius: '8px',
                    color: '#7a4f00', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif',
                  }}>Add separately</button>
                </div>
              </div>
            )}

            {/* Clarification */}
            {clarifying && result && (
              <div style={{ background: '#fffbf2', border: '2px solid #e8c870', borderRadius: '14px', padding: '16px', marginBottom: '16px' }}>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', fontWeight: '700', color: '#7a4f00', marginBottom: '8px' }}>🔍 I need a little more to go on…</div>
                <div style={{ fontSize: '13px', color: '#5a3a00', lineHeight: 1.6, fontFamily: 'Georgia, serif', marginBottom: '14px' }}>I can see a wine label but I am not confident in my identification. Here is what would help:</div>
                {result.clarificationQuestions?.map((q, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ color: '#b5851b', fontWeight: '700', flexShrink: 0 }}>•</span>
                    <div style={{ fontSize: '13px', color: '#5a3a00', fontFamily: 'Georgia, serif', lineHeight: 1.5 }}>{q}</div>
                  </div>
                ))}
                {extraImages.length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', margin: '12px 0' }}>
                    {extraImages.map((img, i) => <img key={i} src={img} alt={`extra ${i + 1}`} style={{ width: '60px', height: '80px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #e8c870' }} />)}
                  </div>
                )}
                <button onClick={() => extraRef.current?.click()} style={{ width: '100%', padding: '11px', background: 'none', border: '2px dashed #d4a830', borderRadius: '8px', color: '#7a4f00', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif', marginBottom: '10px' }}>
                  📷 Add another photo{extraImages.length > 0 ? ` (${extraImages.length} added)` : ''}
                </button>
                <textarea placeholder="Or type anything helpful: vintage, where you bought it, what's on the back label…"
                  value={clarifyText} onChange={e => setClarifyText(e.target.value)} rows={3}
                  style={{ width: '100%', padding: '10px 12px', border: '1px solid #d4a830', borderRadius: '8px', fontSize: '16px', fontFamily: 'Georgia, serif', color: '#2c1810', background: '#fff', resize: 'none', outline: 'none', marginBottom: '12px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => analyze(true)} disabled={loading} style={{ flex: 2, padding: '12px', background: loading ? '#c0a090' : 'linear-gradient(135deg, #7a4f00, #b5851b)', color: '#fff8e6', border: 'none', borderRadius: '8px', fontSize: '13px', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                    {loading ? 'Re-analyzing…' : 'Re-analyze with More Info'}
                  </button>
                  <button onClick={() => setClarifying(false)} style={{ flex: 1, padding: '12px', background: 'none', border: '1px solid #d4a830', borderRadius: '8px', color: '#7a4f00', fontSize: '13px', cursor: 'pointer', fontFamily: 'Georgia, serif' }}>Show Anyway</button>
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
                    <div style={{ ...valueStyle, fontStyle: 'italic', lineHeight: 1.7, background: '#fdfaf7', padding: '10px 12px', borderRadius: '8px', border: '1px solid #f0e8de', marginTop: '2px' }}>{result.characteristics}</div>
                  </div>
                  {result.confidence && <Row label="Identification Confidence" value={result.confidence} />}
                  <button onClick={addToCellar} style={{ width: '100%', padding: '13px', background: 'linear-gradient(135deg, #1a3d1a, #2d6a2d)', color: '#d8f3d8', border: 'none', borderRadius: '10px', fontSize: '14px', fontFamily: "'Playfair Display', Georgia, serif", fontWeight: '700', cursor: 'pointer', letterSpacing: '0.04em', marginTop: '4px' }}>
                    + Add to My Cellar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TONIGHT VIEW */}
        {view === 'tonight' && (
          <TonightView entries={entries} history={history}
            preference={preference} setPreference={setPreference}
            foodPairing={foodPairing} setFoodPairing={setFoodPairing}
            reco={reco} setReco={setReco}
            recoLoading={recoLoading} setRecoLoading={setRecoLoading}
            recoError={recoError} setRecoError={setRecoError}
            goToEntry={goToEntry}
          />
        )}

        {/* CELLAR VIEW */}
        {view === 'cellar' && (
          <div>
            {!storageReady ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9a7060' }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>🍷</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '16px', color: '#7a6055' }}>Loading your cellar…</div>
              </div>
            ) : entries.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 20px', color: '#9a7060' }}>
                <div style={{ fontSize: '52px', marginBottom: '12px' }}>🏚️</div>
                <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '18px', color: '#5c3a28', marginBottom: '8px' }}>Your cellar is empty</div>
                <div style={{ fontSize: '14px' }}>Scan a wine label to start your collection</div>
              </div>
            ) : (
              <>
                <input type="text" placeholder="Search by name, region, varietal, characteristics…"
                  value={search} onChange={e => setSearch(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ddd4c8', background: '#fff', fontSize: '16px', color: '#2c1810', marginBottom: '6px', outline: 'none' }}
                />
                <div style={{ fontSize: '12px', color: '#9a7060', fontFamily: 'Georgia, serif', marginBottom: '12px', textAlign: 'right' }}>
                  {filtered.length} of {entries.length} wine{entries.length !== 1 ? 's' : ''} · {entries.reduce((s, e) => s + (e.quantity || 1), 0)} bottle{entries.reduce((s, e) => s + (e.quantity || 1), 0) !== 1 ? 's' : ''}
                </div>
                {filtered.length === 0
                  ? <div style={{ textAlign: 'center', color: '#9a7060', padding: '24px', fontSize: '14px' }}>No wines match "{search}"</div>
                  : filtered.map(entry => (
                    <WineCard key={entry.id} entry={entry}
                      onDelete={deleteEntry} onMarkDrunk={markAsDrunk}
                      onQuantityChange={handleQuantityChange}
                      isHighlighted={activeEntryId === entry.id}
                    />
                  ))
                }
              </>
            )}
          </div>
        )}

        {/* HISTORY VIEW */}
        {view === 'history' && <HistoryView history={history} />}

      </div>
    </div>
  )
}
