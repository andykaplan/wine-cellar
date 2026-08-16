'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'same-origin',
      })
      if (res.ok) {
        // Read ?from= directly from window.location — no useSearchParams needed
        const params = new URLSearchParams(window.location.search)
        const from = params.get('from') || '/'
        window.location.href = from
      } else {
        const data = await res.json()
        setError(data.error || 'Invalid credentials')
      }
    } catch (_) {
      setError('Network error — please try again')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f7f2eb',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'Lora', Georgia, serif",
    }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Lora:ital,wght@0,400;0,600;1,400&display=swap');`}</style>

      <div style={{ textAlign: 'center', marginBottom: '36px' }}>
        <div style={{ fontSize: '48px', marginBottom: '8px' }}>🍷</div>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '28px', fontWeight: '700', color: '#2c1810', marginBottom: '4px',
        }}>Cave Personnelle</div>
        <div style={{
          fontSize: '13px', color: '#9a7060',
          letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>Your Personal Wine Journal</div>
      </div>

      <div style={{
        background: '#fff', borderRadius: '16px',
        border: '1px solid #e8ddd0', padding: '32px 28px',
        width: '100%', maxWidth: '360px',
        boxShadow: '0 4px 20px rgba(80,20,10,0.08)',
      }}>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '18px', fontWeight: '700', color: '#2c1810',
          marginBottom: '24px', textAlign: 'center',
        }}>Sign in to your cellar</div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: '#9a7060', letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: 'Georgia, serif',
              marginBottom: '6px',
            }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              required
              style={{
                width: '100%', padding: '11px 14px',
                borderRadius: '8px', border: '1px solid #ddd4c8',
                fontSize: '16px', color: '#2c1810',
                background: '#fdfaf7', outline: 'none',
                fontFamily: 'Georgia, serif', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block', fontSize: '11px', fontWeight: '700',
              color: '#9a7060', letterSpacing: '0.08em',
              textTransform: 'uppercase', fontFamily: 'Georgia, serif',
              marginBottom: '6px',
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: '100%', padding: '11px 14px',
                borderRadius: '8px', border: '1px solid #ddd4c8',
                fontSize: '16px', color: '#2c1810',
                background: '#fdfaf7', outline: 'none',
                fontFamily: 'Georgia, serif', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fff5f0', border: '1px solid #f0c8b8',
              borderRadius: '8px', padding: '10px 14px',
              color: '#8b2500', fontSize: '13px',
              fontFamily: 'Georgia, serif', marginBottom: '16px',
            }}>⚠️ {error}</div>
          )}

          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px',
            background: loading ? '#c0a090' : 'linear-gradient(135deg, #6b1a0e, #8b2500)',
            color: '#f5e6cc', border: 'none', borderRadius: '10px',
            fontSize: '15px', fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
            letterSpacing: '0.04em',
            boxShadow: loading ? 'none' : '0 4px 14px rgba(100,20,10,0.25)',
          }}>
            {loading ? 'Signing in…' : 'Enter the Cellar'}
          </button>
        </form>

        <div style={{
          marginTop: '20px', fontSize: '11px', color: '#b0a090',
          textAlign: 'center', fontFamily: 'Georgia, serif', lineHeight: 1.6,
        }}>
          You'll stay signed in for 30 days on this device.
        </div>
      </div>
    </div>
  )
}
