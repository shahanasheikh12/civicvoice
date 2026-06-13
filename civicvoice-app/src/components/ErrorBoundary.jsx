// ============================================================
// ErrorBoundary — catches unhandled React rendering errors
// ============================================================
// Wraps the entire app. If any component throws during render,
// this shows a fallback UI instead of a blank white screen.
// ============================================================

import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // Log to console for debugging
    console.error('ErrorBoundary caught:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column',
          padding: '40px 24px', textAlign: 'center',
          background: 'var(--paper)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h1 style={{ fontSize: '24px', marginBottom: '10px', fontFamily: 'Oswald, sans-serif' }}>
            Something went wrong
          </h1>
          <p style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px',
            color: 'var(--slate)', maxWidth: '480px', lineHeight: 1.7, marginBottom: '24px',
          }}>
            An unexpected error occurred. Please try refreshing the page.
            If the issue persists, check the browser console for details.
          </p>
          <details style={{ marginBottom: '24px', textAlign: 'left', maxWidth: '480px', width: '100%' }}>
            <summary style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)', cursor: 'pointer' }}>
              Error details
            </summary>
            <pre style={{
              fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px',
              color: 'var(--red)', background: 'var(--paper-2)',
              border: '1px solid var(--line)', borderRadius: '4px',
              padding: '10px', marginTop: '8px', overflowX: 'auto',
              whiteSpace: 'pre-wrap',
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button
            onClick={() => window.location.href = '/'}
            style={{
              fontFamily: 'Oswald, sans-serif', fontSize: '14px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'var(--ink)', color: 'var(--paper)',
              border: 'none', padding: '12px 28px', borderRadius: '4px',
              cursor: 'pointer', fontWeight: 600,
            }}
          >
            ← Return to Home
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
