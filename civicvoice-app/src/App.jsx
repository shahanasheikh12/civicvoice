// ============================================================
// CivicVoice — Root App Component & Router
// ============================================================
// Defines all the routes/pages of the app using React Router v6.
//
// Routes:
//   /          → Home / Issue Feed
//   /report    → Submit a new issue
//   /map       → Map view of all issues
//   /login     → Login page
//   /signup    → Sign up page
//   /issue/:id → Detail view for a single issue
//
// ProtectedRoute: wraps routes that require a logged-in user.
// If user is not logged in, it redirects them to /login.
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Layout
import Header  from './components/layout/Header'
import Ticker  from './components/layout/Ticker'
import Footer  from './components/layout/Footer'

// Pages
import FeedPage    from './pages/FeedPage'
import ReportPage  from './pages/ReportPage'
import MapPage     from './pages/MapPage'
import LoginPage   from './pages/LoginPage'
import SignupPage  from './pages/SignupPage'
import IssueDetailPage from './pages/IssueDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import AdminDashboard from './pages/AdminDashboard'

// ============================================================
// ProtectedRoute — wraps private pages
// If user is null (not logged in), redirect to /login
// ============================================================
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()

  // While checking session, show nothing (avoids flash of wrong content)
  if (loading) return null

  // Not logged in → send to login page
  if (!user) return <Navigate to="/login" replace />

  // Logged in → render the page normally
  return children
}

// ============================================================
// AdminRoute — wraps admin-only pages
// If user is not an admin, redirect to home
// ============================================================
function AdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user || user.role !== 'admin') return <Navigate to="/" replace />

  return children
}

// ============================================================
// App — main component with route definitions
// ============================================================
export default function App() {
  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--paper)' }}>
      {/* Persistent layout: header and ticker appear on all pages */}
      <Header />
      <Ticker />

      {/* Page content area */}
      <main className="flex-1">
        <Routes>
          {/* Public routes — anyone can view */}
          <Route path="/"          element={<FeedPage />} />
          <Route path="/map"       element={<MapPage />} />
          <Route path="/issue/:id" element={<IssueDetailPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/signup"    element={<SignupPage />} />

          {/* Protected route — must be logged in to report an issue */}
          <Route
            path="/report"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin route — must be an admin */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          {/* Catch-all: show 404 page for unknown URLs */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}
