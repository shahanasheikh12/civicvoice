// ============================================================
// FeedPage — Home / Issue Feed
// ============================================================
// Fetches all issues from Supabase and displays them in a
// responsive grid with filter controls.
// ============================================================

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import FilterBar from '../components/ui/FilterBar'
import IssueGrid from '../components/ui/IssueGrid'

// Authority tags auto-assigned by category (rule-based, per PRD)
const AUTHORITY_MAP = {
  road:    'Municipal Roads Dept.',
  water:   'Water Board',
  garbage: 'Sanitation Dept.',
  light:   'Electricity Board',
}

export default function FeedPage() {
  const [issues,   setIssues]   = useState([])       // All fetched issues
  const [loading,  setLoading]  = useState(true)     // Loading state
  const [error,    setError]    = useState(null)     // Error message

  // Filter state
  const [filterCategory, setFilterCategory] = useState('')        // '' = all
  const [filterStatus,   setFilterStatus]   = useState('')        // '' = all
  const [filterLocation, setFilterLocation] = useState('')        // Text match
  const [sortBy,         setSortBy]         = useState('votes')   // 'votes' | 'recent' | 'nearest'

  // ── Fetch issues from Supabase ─────────────────────────────
  useEffect(() => {
    fetchIssues()
  }, [filterCategory, filterStatus]) // Note: text search and sort handled client-side for snappiness

  async function fetchIssues() {
    setLoading(true)
    setError(null)

    try {
      // Start building the query
      let query = supabase
        .from('issues')
        .select(`
          *,
          votes (vote_type, user_id)
        `)
        // votes is a related table — Supabase returns it as an array

      // Apply category filter if selected
      if (filterCategory) {
        query = query.eq('category', filterCategory)
      }

      // Apply status filter if selected
      if (filterStatus) {
        query = query.eq('status', filterStatus)
      }

      // We pull up to 100 recent issues for local filtering/sorting
      query = query.order('created_at', { ascending: false })

      const { data, error: err } = await query.limit(100)

      if (err) throw err

      // Calculate net vote count for each issue (upvotes - downvotes)
      const withCounts = (data ?? []).map(issue => ({
        ...issue,
        voteCount: (issue.votes ?? []).reduce(
          (sum, v) => sum + (v.vote_type === 'up' ? 1 : -1), 0
        ),
        // Fill in authority_tag if not set by AI yet
        authority_tag: issue.authority_tag ?? AUTHORITY_MAP[issue.category?.toLowerCase()] ?? '',
      }))

      setIssues(withCounts)
    } catch (err) {
      console.error('Error fetching issues:', err)
      setError('Could not load issues. Check your Supabase connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── Apply Client-side Filtering & Sorting ──────────────────
  const displayedIssues = [...issues].filter(issue => {
    // Location Text Match (search in title or description)
    if (filterLocation.trim()) {
      const search = filterLocation.toLowerCase()
      const titleMatch = issue.title?.toLowerCase().includes(search)
      const descMatch = issue.description?.toLowerCase().includes(search)
      if (!titleMatch && !descMatch) return false
    }
    return true
  })

  // Sort
  if (sortBy === 'votes') {
    displayedIssues.sort((a, b) => b.voteCount - a.voteCount)
  } else if (sortBy === 'recent') {
    displayedIssues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  } else if (sortBy === 'nearest') {
    // Very basic distance sorting placeholder if we had user coords
    // Without user coords, we just leave it as recent or random
    // In a real app, we'd prompt `navigator.geolocation` and sort by haversine distance
    displayedIssues.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      className="page-enter"
      style={{ maxWidth: '1180px', margin: '0 auto', padding: '28px 24px 60px' }}
    >
      {/* ── Feed Header ──────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: '16px',
          marginBottom: '20px',
          flexWrap: 'wrap',
        }}
      >
        <h1 style={{ fontSize: '30px' }}>Most urgent right now</h1>

        <FilterBar
          filterCategory={filterCategory} setFilterCategory={setFilterCategory}
          filterStatus={filterStatus} setFilterStatus={setFilterStatus}
          filterLocation={filterLocation} setFilterLocation={setFilterLocation}
          sortBy={sortBy} setSortBy={setSortBy}
        />
      </div>

      {/* ── Loading / Error / Empty States ───────────────── */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.4 }}>⏳</div>
          <div style={{ color: 'var(--slate)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px' }}>
            Loading issues...
          </div>
        </div>
      )}

      {error && (
        <div style={{
          textAlign: 'center', padding: '40px', color: 'var(--red)',
          fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px',
          background: 'var(--paper-2)', borderRadius: '4px', border: '1px solid var(--line)',
        }}>
          ⚠️ {error}
        </div>
      )}

      {!loading && !error && displayedIssues.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          background: '#fff', border: '1px solid var(--line)', borderRadius: '4px',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '14px', opacity: 0.5 }}>🗺️</div>
          <h3 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '20px', marginBottom: '8px', letterSpacing: '0.04em' }}>
            No issues found
          </h3>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)', maxWidth: '320px', margin: '0 auto 20px', lineHeight: 1.7 }}>
            No issues match your current filters. Try adjusting your search criteria or be the first to report something.
          </p>
          <a
            href="/report"
            style={{
              display: 'inline-block',
              fontFamily: 'Oswald, sans-serif', fontSize: '13px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'var(--ink)', color: 'var(--paper)',
              padding: '10px 22px', borderRadius: '4px',
              textDecoration: 'none', fontWeight: 600,
            }}
          >
            + Report an Issue
          </a>
        </div>
      )}

      {/* ── Issue Grid ────────────────────────────────────── */}
      {!loading && !error && displayedIssues.length > 0 && (
        <IssueGrid issues={displayedIssues} />
      )}
    </div>
  )
}
