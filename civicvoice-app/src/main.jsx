// ============================================================
// CivicVoice — App Entry Point
// ============================================================
// This is where React "mounts" the app into the DOM.
// We wrap everything in:
//   - ErrorBoundary: catches any unhandled rendering errors
//   - BrowserRouter:  enables client-side routing (React Router)
//   - AuthProvider:   provides auth state to the whole app
//   - ToastProvider:  provides global toast notification system
// ============================================================

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './components/ErrorBoundary'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
)
