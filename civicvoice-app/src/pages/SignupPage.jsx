// ============================================================
// SignupPage — New user registration via Supabase Auth
// ============================================================
// HOW IT WORKS:
// 1. supabase.auth.signUp() creates the user in Supabase Auth
// 2. Our database trigger (handle_new_user in migration.sql)
//    automatically inserts a row in public.users with the name
// 3. On success we show a "check your email" message
//    (Supabase sends a verification email by default)
// ============================================================

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function SignupPage() {
  const navigate = useNavigate()

  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [success,  setSuccess]  = useState(false)

  async function handleSignup(e) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setError(null)

    // Step 1: Create the auth account
    // We pass the name in user_metadata so the trigger can read it
    const { error: authError } = await supabase.auth.signUp({
      email:    email.trim(),
      password: password,
      options: {
        data: { full_name: name.trim() },    // Read by handle_new_user trigger
      },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Success — show confirmation message (email verification pending)
    setSuccess(true)
    setLoading(false)
  }

  // ── Verification pending screen ───────────────────────────
  if (success) {
    return (
      <div className="page-enter" style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
      }}>
        <div style={{
          background: '#fff', border: '1px solid var(--line)',
          borderRadius: '4px', padding: '32px', maxWidth: '400px', width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>📬</div>
          <h1 style={{ fontSize: '22px', marginBottom: '10px' }}>Check your email</h1>
          <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            We sent a verification link to <strong>{email}</strong>.
            Click it to activate your account, then log in.
          </p>
          <Link
            to="/login"
            style={{
              display: 'inline-block',
              fontFamily: 'Oswald, sans-serif', fontSize: '13px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'var(--ink)', color: 'var(--paper)',
              padding: '10px 20px', borderRadius: '4px', textDecoration: 'none', fontWeight: 600,
            }}
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  // ── Sign up form ──────────────────────────────────────────
  return (
    <div className="page-enter" style={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{
          background: '#fff', border: '1px solid var(--line)',
          borderRadius: '4px', padding: '32px',
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '6px' }}>Create account</h1>
          <p style={{ color: 'var(--slate)', fontSize: '14px', marginBottom: '24px' }}>
            Join CivicVoice. Report issues, vote, and make a difference.
          </p>

          <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Name */}
            {[
              { id: 'name',     label: 'Your name', type: 'text',     value: name,     set: setName,     auto: 'name' },
              { id: 'email',    label: 'Email',      type: 'email',    value: email,    set: setEmail,    auto: 'email' },
              { id: 'password', label: 'Password (min 6 characters)', type: 'password', value: password, set: setPassword, auto: 'new-password' },
            ].map(field => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  style={{
                    display: 'block',
                    fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px',
                    color: 'var(--slate)', textTransform: 'uppercase',
                    letterSpacing: '0.08em', marginBottom: '6px',
                  }}
                >
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type={field.type}
                  required
                  autoComplete={field.auto}
                  value={field.value}
                  onChange={e => field.set(e.target.value)}
                  style={{
                    width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '14px',
                    padding: '10px 12px', border: '1px solid var(--line)',
                    borderRadius: '4px', color: 'var(--ink)',
                  }}
                />
              </div>
            ))}

            {/* Error */}
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

            <button
              type="submit"
              disabled={loading}
              style={{
                fontFamily: 'Oswald, sans-serif', fontSize: '14px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: loading ? 'var(--slate)' : 'var(--red)',
                color: '#fff', border: 'none',
                padding: '12px', borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 600, marginTop: '4px',
              }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '14px', color: 'var(--slate)' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--ink)', fontWeight: 500 }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
