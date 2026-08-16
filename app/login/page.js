'use client'

import { useState } from 'react'

export default function LoginPage() {
  const [error, setError] = useState(
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('error')
      : null
  )

  // Get the ?from= param for the hidden field
  const from = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('from') || '/'
    : '/'

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
        Your Personal Wine Journal
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
        <div style={{
          fontSize: '18px', fontWeight: 'bold', color: '#2c1810',
          marginBottom: '20px', textAlign: 'center',
        }}>
          Sign in to your cellar
        </div>

        {/* Native form POST — server sets cookie before any redirect */}
        <form method="POST" action="/api/login">
          <input type="hidden" name="from" value={from} />

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '12px', color: '#9a7060', marginBottom: '5px' }}>Username</div>
            <input
              type="text"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              required
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: '8px', border: '1px solid #ddd4c8',
                fontSize: '16px', color: '#2c1810',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', color: '#9a7060', marginBottom: '5px' }}>Password</div>
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
              style={{
                width: '100%', padding: '10px 12px',
                borderRadius: '8px', border: '1px solid #ddd4c8',
                fontSize: '16px', color: '#2c1810',
                background: '#fff', outline: 'none', boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fff5f0', border: '1px solid #f0c8b8',
              borderRadius: '8px', padding: '10px 12px',
              color: '#8b2500', fontSize: '13px', marginBottom: '14px',
            }}>
              ⚠️ Invalid username or password
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%', padding: '12px',
              background: '#8b2500', color: '#fff',
              border: 'none', borderRadius: '8px',
              fontSize: '15px', fontWeight: 'bold', cursor: 'pointer',
            }}
          >
            Enter the Cellar
          </button>
        </form>

        <div style={{ marginTop: '16px', fontSize: '11px', color: '#b0a090', textAlign: 'center' }}>
          You'll stay signed in for 30 days on this device.
        </div>
      </div>
    </div>
  )
}
