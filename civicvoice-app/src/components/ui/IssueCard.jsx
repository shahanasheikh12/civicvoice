// ============================================================
// IssueCard — displays a single civic issue in the feed grid
// ============================================================
// Design: white card, 1px line border, 4px radius
// - Card image area: gradient bg + category badge + status pill
// - Card body: Oswald title, IBM Plex Mono meta, upvote/downvote
//
// Props:
//   issue - object from Supabase issues table
//   voteCount - total net votes (calculated from votes table)
// ============================================================

import { Link } from 'react-router-dom'
import CategoryShape from './CategoryShape'
import StatusPill from './StatusPill'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { useState } from 'react'

// Maps category to a readable label
const CATEGORY_LABELS = {
  road: 'Road', water: 'Water', garbage: 'Garbage', light: 'Streetlight',
}

// Maps category to a gradient for the card image placeholder
const CATEGORY_GRADIENTS = {
  road:    'linear-gradient(135deg, #c9cfd3, #8fa3b0)',
  water:   'linear-gradient(135deg, #b0c4d8, #6fa3cc)',
  garbage: 'linear-gradient(135deg, #b0cdb5, #6fa87c)',
  light:   'linear-gradient(135deg, #d4c9a8, #c8a84b)',
}

export default function IssueCard({ issue, voteCount = 0 }) {
  const { user } = useAuth()
  const [localVotes, setLocalVotes] = useState(voteCount)
  
  // Compute initial user vote from the passed-in issue.votes array
  const [userVote, setUserVote] = useState(() => {
    if (!user || !issue.votes) return null
    const v = issue.votes.find(vote => vote.user_id === user.id)
    return v ? v.vote_type : null
  })

  // Normalize category to lowercase key
  const category = issue.category?.toLowerCase() ?? 'road'

  // ── Vote handler ──────────────────────────────────────────
  async function handleVote(voteType) {
    if (!user) {
      alert('Please log in to vote.')
      return
    }

    const existingVote = userVote;

    // Optimistic UI updates
    if (existingVote) {
      if (existingVote === voteType) {
        // Same vote again → remove vote (toggle off)
        setUserVote(null)
        setLocalVotes(v => voteType === 'up' ? v - 1 : v + 1)
        await supabase.from('votes').delete().eq('issue_id', issue.id).eq('user_id', user.id)
      } else {
        // Changed vote direction
        setUserVote(voteType)
        setLocalVotes(v => voteType === 'up' ? v + 2 : v - 2)
        await supabase.from('votes').update({ vote_type: voteType }).eq('issue_id', issue.id).eq('user_id', user.id)
      }
    } else {
      // New vote
      setUserVote(voteType)
      setLocalVotes(v => voteType === 'up' ? v + 1 : v - 1)
      await supabase.from('votes').insert({ issue_id: issue.id, user_id: user.id, vote_type: voteType })
    }
  }

  // Relative time display (e.g. "2 days ago")
  function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
  }

  return (
    <article
      style={{
        background: '#fff',
        border: '1px solid var(--line)',
        borderRadius: '4px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Card Image Area ──────────────────────────────── */}
      <div
        style={{
          height: '130px',
          background: issue.image_url
            ? `url(${issue.image_url}) center/cover no-repeat`
            : (CATEGORY_GRADIENTS[category] ?? CATEGORY_GRADIENTS.road),
          position: 'relative',
        }}
      >
        {/* Category Badge — bottom-left overlay */}
        <span
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(28,49,68,0.85)',
            color: 'var(--paper)',
            fontFamily: 'Oswald, sans-serif',
            fontSize: '11px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '5px 10px 5px 6px',
            borderRadius: '999px',
          }}
        >
          <CategoryShape category={category} size={12} />
          {CATEGORY_LABELS[category] ?? issue.category}
        </span>

        {/* Status Pill — top-right overlay */}
        <span style={{ position: 'absolute', top: '10px', right: '10px' }}>
          <StatusPill status={issue.status} />
        </span>
      </div>

      {/* ── Card Body ────────────────────────────────────── */}
      <div
        style={{
          padding: '14px 14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flex: 1,
        }}
      >
        {/* Title — clickable, links to detail page */}
        <Link
          to={`/issue/${issue.id}`}
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <h3
            style={{
              fontFamily: 'Oswald, sans-serif',
              fontSize: '15px',
              letterSpacing: '0.02em',
              lineHeight: 1.3,
            }}
          >
            {issue.title}
          </h3>
        </Link>

        {/* Description Preview */}
        {issue.description && (
          <p
            style={{
              fontSize: '13px',
              color: 'var(--slate)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              lineHeight: 1.5,
              marginTop: '2px',
            }}
          >
            {issue.description}
          </p>
        )}

        {/* AI Tag — shown if AI has assessed the issue */}
        {issue.severity_score != null && (
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '9px' }}>◆</span>
            AI severity: {issue.severity_score >= 0.7 ? 'High' : issue.severity_score >= 0.4 ? 'Medium' : 'Low'}
            {issue.urgency_score != null && ` · Urgency: ${(issue.urgency_score * 100).toFixed(0)}%`}
          </div>
        )}

        {/* Metadata */}
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--slate)' }}>
          {timeAgo(issue.created_at)}
          {issue.authority_tag && ` · ${issue.authority_tag}`}
        </div>

        {/* ── Card Footer: votes + authority ─────────────── */}
        <div
          style={{
            marginTop: 'auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--line)',
            paddingTop: '10px',
          }}
        >
          {/* Vote buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => handleVote('up')}
              aria-label="Upvote"
              style={{
                border: '1px solid var(--line)',
                background: userVote === 'up' ? 'var(--ink)' : '#fff',
                borderRadius: '4px',
                width: '30px',
                height: '30px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: userVote === 'up' ? '#fff' : 'var(--ink)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (userVote !== 'up') e.target.style.background = 'var(--paper-2)' }}
              onMouseLeave={e => { if (userVote !== 'up') e.target.style.background = '#fff' }}
            >
              ▲
            </button>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, minWidth: '28px', textAlign: 'center' }}>
              {localVotes}
            </span>
            <button
              onClick={() => handleVote('down')}
              aria-label="Downvote"
              style={{
                border: '1px solid var(--line)',
                background: userVote === 'down' ? 'var(--red)' : '#fff',
                borderRadius: '4px',
                width: '30px',
                height: '30px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: userVote === 'down' ? '#fff' : 'var(--ink)',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { if (userVote !== 'down') e.target.style.background = 'var(--paper-2)' }}
              onMouseLeave={e => { if (userVote !== 'down') e.target.style.background = '#fff' }}
            >
              ▼
            </button>
          </div>

          {/* Authority tag */}
          {issue.authority_tag && (
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--slate)' }}>
              → {issue.authority_tag}
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
