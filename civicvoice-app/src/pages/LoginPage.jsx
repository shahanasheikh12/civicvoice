// ============================================================
// LoginPage — Email + password login via Supabase Auth
// ============================================================
// HOW SUPABASE AUTH WORKS:
// - supabase.auth.signInWithPassword() sends the credentials
//   directly to Supabase's auth service
// - On success, Supabase stores a session token in localStorage
// - Our AuthContext's onAuthStateChange listener picks it up
//   and updates the global user state
// - We then redirect the user to the home feed
// ============================================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Call Supabase Auth — returns { data: { user, session }, error }
    const { error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim(),
      password: password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Success: AuthContext will update, redirect to feed
    navigate('/')
  }

  return (
    <div
      className="page-enter"
      style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
      }}
    >
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Card */}
        <div style={{
          background: '#fff',
          border: '1px solid var(--line)',
          borderRadius: '4px',
          padding: '32px',
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Log In</h1>
          <p style={{ color: 'var(--slate)', fontSize: '14px', marginBottom: '24px' }}>
            Welcome back to CivicVoice.
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '11px',
                  color: 'var(--slate)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '6px',
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{
                  width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '14px',
                  padding: '10px 12px', border: '1px solid var(--line)',
                  borderRadius: '4px', color: 'var(--ink)',
                }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: '11px',
                  color: 'var(--slate)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '6px',
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={{
                  width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '14px',
                  padding: '10px 12px', border: '1px solid var(--line)',
                  borderRadius: '4px', color: 'var(--ink)',
                }}
              />
            </div>

            {/* Error message */}
            {error && (
              <p style={{
                fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px',
                color: 'var(--red)', background: 'rgba(200,75,49,0.08)',
                padding: '8px 12px', borderRadius: '4px',
                border: '1px solid rgba(200,75,49,0.2)',
              }}>
                ❌ {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                fontFamily: 'Oswald, sans-serif', fontSize: '14px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: loading ? 'var(--slate)' : 'var(--ink)',
                color: 'var(--paper)', border: 'none',
                padding: '12px', borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600, marginTop: '4px',
              }}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>

          {/* Link to signup */}
          <p style={{
            marginTop: '20px', textAlign: 'center',
            fontSize: '14px', color: 'var(--slate)',
          }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color: 'var(--ink)', fontWeight: 500 }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
