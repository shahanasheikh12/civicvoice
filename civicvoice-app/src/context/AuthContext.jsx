// ============================================================
// CivicVoice — Auth Context
// ============================================================
// React Context pattern: we create a global "store" for the
// logged-in user, so any component can access it with:
//   const { user, loading } = useAuth()
//
// HOW IT WORKS:
// 1. AuthProvider wraps the whole app (in main.jsx)
// 2. It listens to Supabase's onAuthStateChange event
// 3. When the user logs in or out, it updates the `user` state
// 4. All child components get the updated user via useAuth()
// ============================================================

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Step 1: Create the context object (starts empty)
const AuthContext = createContext({})

// Step 2: Provider component — wraps the app and provides auth state
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)   // The logged-in user object (or null)
  const [loading, setLoading] = useState(true)   // True while we check the session on page load

  useEffect(() => {
    async function loadUser(session) {
      if (!session?.user) {
        setUser(null)
        setLoading(false)
        return
      }

      // Fetch additional profile data (role, reputation_score) from public.users
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      // Merge the auth.users data with public.users profile
      setUser({ ...session.user, ...profile })
      setLoading(false)
    }

    // On mount: check if there's already an active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      loadUser(session)
    })

    // Subscribe to future auth events (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        loadUser(session)
      }
    )

    // Cleanup: unsubscribe when the component unmounts
    return () => subscription.unsubscribe()
  }, [])

  // Expose user and loading state to all child components
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// Step 3: Custom hook — easy way to consume the context
// Usage: const { user, loading } = useAuth()
export function useAuth() {
  return useContext(AuthContext)
}
