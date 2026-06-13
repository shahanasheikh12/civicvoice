// ============================================================
// 404 Page — shown when a route doesn't match
// ============================================================
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 200px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', flexDirection: 'column', textAlign: 'center',
    }}>
      {/* Large 404 display */}
      <div style={{
        fontFamily: 'Oswald, sans-serif',
        fontSize: 'clamp(80px, 15vw, 160px)',
        fontWeight: 700,
        letterSpacing: '-0.02em',
        color: 'var(--line)',
        lineHeight: 1,
        marginBottom: '12px',
        userSelect: 'none',
      }}>
        404
      </div>

      <h1 style={{ fontSize: '24px', marginBottom: '10px', color: 'var(--ink)' }}>
        Page not found
      </h1>
      <p style={{
        fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px',
        color: 'var(--slate)', marginBottom: '32px', maxWidth: '380px', lineHeight: 1.7,
      }}>
        This page doesn't exist or may have been moved.
        Check the URL or head back to the feed.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          style={{
            fontFamily: 'Oswald, sans-serif', fontSize: '14px',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'var(--ink)', color: 'var(--paper)',
            padding: '12px 24px', borderRadius: '4px',
            textDecoration: 'none', fontWeight: 600,
          }}
        >
          ← Back to Feed
        </Link>
        <Link
          to="/report"
          style={{
            fontFamily: 'Oswald, sans-serif', fontSize: '14px',
            letterSpacing: '0.08em', textTransform: 'uppercase',
            background: 'transparent', color: 'var(--ink)',
            border: '1px solid var(--line)',
            padding: '12px 24px', borderRadius: '4px',
            textDecoration: 'none', fontWeight: 600,
          }}
        >
          Report an Issue
        </Link>
      </div>
    </div>
  )
}
