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
        const params = new URLSearchParams(window.location.search)
        window.location.href = params.get('from') || '/'
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
      minHeight: '100vh',
      background: '#f7f2eb',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍷</div>

      <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#2c1810' }}>
        Cave Personnelle
      </div>

      <div style={{ fontSize: '13px', color: '#9a7060', marginBottom: '32px' }}>
        Sign in to your cellar
      </div>

      <div style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #e8ddd0',
        padding: '28px',
        width: '100%',
        maxWidth: '340px',
        boxShadow: '0 4px 16px rgba(80,20,10,0.08)',
      }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', color: '#9a7060', marginBottom: '5px' }}>Username</div>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd4c8',
                fontSize: '16px',
                color: '#2c1810',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#9a7060', marginBottom: '5px' }}>Password</div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd4c8',
                fontSize: '16px',
                color: '#2c1810',
                background: '#fff',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fff5f0',
              border: '1px solid #f0c8b8',
              borderRadius: '8px',
              padding: '10px 12px',
              color: '#8b2500',
              fontSize: '13px',
              marginBottom: '14px',
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#c0a090' : '#8b2500',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Signing in…' : 'Enter the Cellar'}
          </button>
        </form>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#b0a090', textAlign: 'center' }}>
          You'll stay signed in for 30 days on this device.
        </div>
      </div>
    </div>
  )
}
