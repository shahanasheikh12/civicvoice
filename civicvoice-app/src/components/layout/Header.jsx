// ============================================================
// Header — persistent top navigation bar
// Design: dark ink background, Oswald logo, pill nav, CTA button
// ============================================================
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import NotificationBell from '../ui/NotificationBell'
import { useEffect } from 'react'

// The amber diamond logo mark (clip-path shape)
function LogoDot() {
  return (
    <span
      className="inline-block w-2.5 h-2.5"
      style={{
        background: 'var(--amber)',
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
      }}
    />
  )
}

export default function Header() {
  const location = useLocation()
  const navigate  = useNavigate()
  const { user }  = useAuth()

  // Sync user role based on email (auto-upgrade the admin, auto-downgrade others)
  useEffect(() => {
    if (user) {
      const shouldBeAdmin = user.email === 'sanasheikh1226@gmail.com'
      const isCurrentlyAdmin = user.role === 'admin'
      
      if (shouldBeAdmin && !isCurrentlyAdmin) {
        supabase.from('users').update({ role: 'admin' }).eq('id', user.id)
          .then(({ error }) => { if (!error) window.location.reload() })
      } else if (!shouldBeAdmin && isCurrentlyAdmin) {
        supabase.from('users').update({ role: 'user' }).eq('id', user.id)
          .then(({ error }) => { if (!error) window.location.reload() })
      }
    }
  }, [user])

  // Highlight the nav button that matches the current URL
  const isActive = (path) => location.pathname === path

  // Sign the user out via Supabase Auth, then go to home
  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  // Nav items: label + route path
  const navItems = [
    { label: 'Feed',   path: '/'      },
    { label: 'Report', path: '/report'},
    { label: 'Map',    path: '/map'   },
  ]

  return (
    <header
      style={{
        background: 'var(--ink)', color: 'var(--paper)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px', minHeight: '60px',
      }}
    >
      {/* Logo */}
      <Link
        to="/"
        style={{
          fontFamily: 'Oswald, sans-serif',
          fontWeight: 700,
          fontSize: '22px',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--paper)',
          textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: '8px',
        }}
      >
        <LogoDot />
        CivicVoice
      </Link>

      {/* Navigation pill group */}
      <nav
        style={{
          display: 'flex', gap: '2px', padding: '4px',
          background: 'rgba(255,255,255,0.06)',
          borderRadius: '999px',
        }}
      >
        {navItems.map(({ label, path }) => (
          <Link
            key={path}
            to={path}
            style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '7px 16px',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: isActive(path) ? 600 : 400,
              background: isActive(path) ? 'var(--amber)' : 'transparent',
              color: isActive(path) ? 'var(--ink)' : 'var(--paper)',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            {label}
          </Link>
        ))}

        {/* Admin nav link — only visible to admins */}
        {user?.role === 'admin' && (
          <Link
            to="/admin"
            style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '13px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding: '7px 16px',
              borderRadius: '999px',
              textDecoration: 'none',
              fontWeight: isActive('/admin') ? 600 : 400,
              background: isActive('/admin') ? 'var(--red)' : 'transparent',
              color: isActive('/admin') ? '#fff' : 'var(--red)',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            Admin ◆
          </Link>
        )}
      </nav>

      {/* Right side: notification bell + auth buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Bell icon for logged-in users */}
        <NotificationBell />

        {user ? (
          // Logged in → show username + logout
          <>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
              {user.email?.split('@')[0]}
            </span>
            <button
              onClick={handleLogout}
              style={{
                fontFamily: 'Oswald, sans-serif',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                fontSize: '13px',
                background: 'transparent',
                color: 'var(--paper)',
                border: '1px solid rgba(255,255,255,0.3)',
                padding: '7px 16px',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          // Logged out → show login link
          <Link
            to="/login"
            style={{
              fontFamily: 'Oswald, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontSize: '13px',
              color: 'var(--paper)',
              textDecoration: 'none',
              padding: '7px 16px',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '4px',
            }}
          >
            Log In
          </Link>
        )}

        {/* New Report CTA — red button */}
        <Link
          to="/report"
          style={{
            fontFamily: 'Oswald, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            fontSize: '13px',
            background: 'var(--red)',
            color: 'var(--paper)',
            padding: '9px 18px',
            borderRadius: '4px',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          + Report
        </Link>
      </div>
    </header>
  )
}
