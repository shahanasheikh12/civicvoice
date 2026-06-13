// ============================================================
// CivicVoice — Supabase Client
// ============================================================
// This file creates and exports a single Supabase client instance
// that is shared across the entire app. Importing it anywhere
// gives you access to auth, database, and storage.
//
// HOW IT WORKS:
// - createClient() takes your project URL and anon key
// - The anon key is safe to expose in the browser — RLS policies
//   in Supabase control what each user can actually read/write
// - import.meta.env reads from the .env file (Vite exposes any
//   variable starting with VITE_ to the browser automatically)
// ============================================================

import { createClient } from '@supabase/supabase-js'

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Safety check — tells you early if the .env is misconfigured
if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    '❌ Missing Supabase env vars. ' +
    'Copy .env.example to .env and fill in your Supabase project URL and anon key.'
  )
}

// Create the client — exported as a singleton so we reuse one connection
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
