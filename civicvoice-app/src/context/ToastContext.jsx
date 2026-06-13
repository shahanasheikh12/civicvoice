// ============================================================
// Toast Notification System
// ============================================================
// A global toast context that lets any component trigger
// a floating notification at the bottom of the screen.
//
// Usage:
//   const { showToast } = useToast()
//   showToast('Issue updated!', 'success')  // or 'error' | 'info'
// ============================================================

import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext({})

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  // Add a new toast; auto-remove after 4 seconds
  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id) => setToasts(prev => prev.filter(t => t.id !== id))

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container — fixed bottom-right */}
      <div style={{
        position: 'fixed', bottom: '24px', right: '24px',
        display: 'flex', flexDirection: 'column', gap: '10px',
        zIndex: 9999, maxWidth: '340px',
      }}>
        {toasts.map(toast => (
          <div
            key={toast.id}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
              padding: '12px 16px',
              background: toast.type === 'error' ? 'var(--red)' : toast.type === 'success' ? 'var(--green)' : 'var(--ink)',
              color: '#fff',
              borderRadius: '4px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              lineHeight: 1.4,
              animation: 'slideInRight 0.25s ease',
            }}
          >
            <span>{toast.message}</span>
            <button
              onClick={() => dismiss(toast.id)}
              style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px', lineHeight: 1, padding: 0, opacity: 0.7 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
