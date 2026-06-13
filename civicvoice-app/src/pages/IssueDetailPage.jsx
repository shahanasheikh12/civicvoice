// ============================================================
// IssueDetailPage — Full view of a single civic issue
// ============================================================
// Shows:
//   - Issue image, category, status, AI data
//   - Full description and metadata
//   - Vote buttons
//   - Comment thread with input form
//
// URL: /issue/:id  (the :id is from React Router's useParams)
// ============================================================

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import CategoryShape from '../components/ui/CategoryShape'
import StatusPill from '../components/ui/StatusPill'

// Relative time helper
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function StatusTimeline({ currentStatus, createdAt, updatedAt }) {
  const stages = [
    { key: 'pending', label: 'Pending' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'resolved', label: 'Resolved' },
  ]
  const currentIndex = stages.findIndex(s => s.key === currentStatus)
  const cIndex = currentIndex === -1 ? 0 : currentIndex

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px',
      background: '#fff', border: '1px solid var(--line)', borderRadius: '4px', padding: '16px 20px'
    }}>
      {stages.map((stage, idx) => {
        const isPast = idx < cIndex
        const isCurrent = idx === cIndex
        const isFuture = idx > cIndex
        
        let color = 'var(--slate)'
        if (isPast || isCurrent) {
          if (stage.key === 'pending') color = 'var(--red)'
          if (stage.key === 'in_progress') color = 'var(--amber)'
          if (stage.key === 'resolved') color = 'var(--green)'
        }
        
        return (
          <div key={stage.key} style={{ display: 'flex', alignItems: 'center', flex: 1, opacity: isFuture ? 0.4 : 1 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '60px' }}>
              <div style={{
                width: '12px', height: '12px', borderRadius: '50%', background: color,
                outline: isCurrent ? `2px solid ${color}` : 'none',
                outlineOffset: '2px',
                margin: '2px 0',
              }}></div>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', textTransform: 'uppercase', color: 'var(--ink)' }}>
                {stage.label}
              </span>
              {(isCurrent || isPast) && (
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '9px', color: 'var(--slate)' }}>
                  {stage.key === 'pending' ? new Date(createdAt).toLocaleDateString() : (isCurrent ? new Date(updatedAt).toLocaleDateString() : '—')}
                </span>
              )}
            </div>
            {idx < stages.length - 1 && (
              <div style={{
                flex: 1, height: '2px', background: isPast ? color : 'var(--line)',
                margin: '0 12px', alignSelf: 'flex-start', marginTop: '7px'
              }}></div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function IssueDetailPage() {
  const { id }    = useParams()         // Get the issue ID from the URL
  const { user }  = useAuth()

  const [issue,       setIssue]       = useState(null)
  const [comments,    setComments]    = useState([])
  const [voteCount,   setVoteCount]   = useState(0)
  const [userVote,    setUserVote]    = useState(null)
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(null)
  const [commentText, setCommentText] = useState('')
  const [posting,     setPosting]     = useState(false)

  // ── Fetch issue + comments + votes ────────────────────────
  useEffect(() => {
    async function fetchAll() {
      setLoading(true)

      // Fetch the issue row
      const { data: issueData, error: issueErr } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single()

      if (issueErr) { setError('Issue not found.'); setLoading(false); return }
      setIssue(issueData)

      // Fetch votes and calculate net count + user vote
      const { data: votesData } = await supabase
        .from('votes')
        .select('vote_type, user_id')
        .eq('issue_id', id)
        
      setVoteCount((votesData ?? []).reduce((s, v) => s + (v.vote_type === 'up' ? 1 : -1), 0))
      
      if (user) {
        const uv = (votesData ?? []).find(v => v.user_id === user.id)
        setUserVote(uv ? uv.vote_type : null)
      }

      // Fetch comments + join with user names
      const { data: commentsData } = await supabase
        .from('comments')
        .select(`*, users (name, email)`)
        .eq('issue_id', id)
        .order('created_at', { ascending: true })
      setComments(commentsData ?? [])

      setLoading(false)
    }
    fetchAll()
  }, [id, user?.id])

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
        setVoteCount(v => voteType === 'up' ? v - 1 : v + 1)
        await supabase.from('votes').delete().eq('issue_id', id).eq('user_id', user.id)
      } else {
        // Changed vote direction
        setUserVote(voteType)
        setVoteCount(v => voteType === 'up' ? v + 2 : v - 2)
        await supabase.from('votes').update({ vote_type: voteType }).eq('issue_id', id).eq('user_id', user.id)
      }
    } else {
      // New vote
      setUserVote(voteType)
      setVoteCount(v => voteType === 'up' ? v + 1 : v - 1)
      await supabase.from('votes').insert({ issue_id: id, user_id: user.id, vote_type: voteType })
    }
  }

  // ── Post a new comment ─────────────────────────────────────
  async function handleComment(e) {
    e.preventDefault()
    if (!user) { alert('Please log in to comment.'); return }
    if (!commentText.trim()) return

    setPosting(true)
    const { data, error: err } = await supabase
      .from('comments')
      .insert({ issue_id: id, user_id: user.id, text: commentText.trim() })
      .select(`*, users (name, email)`)
      .single()

    if (!err && data) {
      setComments(prev => [...prev, data])
      setCommentText('')
    }
    setPosting(false)
  }

  // ── Update Status handler (for issue owner) ───────────────
  async function updateStatus(newStatus) {
    if (!user || user.id !== issue.user_id) return
    const { error } = await supabase.from('issues').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', issue.id)
    if (!error) {
      setIssue({ ...issue, status: newStatus, updated_at: new Date().toISOString() })
    } else {
      alert("Error updating status")
    }
  }

  // ── Loading / Error states ─────────────────────────────────
  if (loading) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: 'var(--slate)' }}>
      Loading issue...
    </div>
  )

  if (error) return (
    <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: 'var(--red)' }}>
      {error} — <Link to="/" style={{ color: 'var(--ink)' }}>Back to feed</Link>
    </div>
  )

  const category = issue.category?.toLowerCase() ?? 'road'

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="page-enter" style={{ maxWidth: '800px', margin: '0 auto', padding: '28px 24px 60px' }}>

      {/* Back link */}
      <Link
        to="/"
        style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px',
          color: 'var(--slate)', textDecoration: 'none', marginBottom: '20px', display: 'inline-block',
        }}
      >
        ← Back to feed
      </Link>

      {/* ── Issue Header ──────────────────────────────────── */}
      <div style={{
        background: '#fff', border: '1px solid var(--line)',
        borderRadius: '4px', overflow: 'hidden', marginBottom: '20px',
      }}>
        {/* Image */}
        {issue.image_url && (
          <img
            src={issue.image_url}
            alt={issue.title}
            style={{ width: '100%', height: '280px', objectFit: 'cover' }}
          />
        )}
        {!issue.image_url && (
          <div style={{
            height: '180px',
            background: 'linear-gradient(135deg, var(--paper-2), var(--line))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)' }}>
              No photo attached
            </span>
          </div>
        )}

        <div style={{ padding: '20px 24px' }}>
          {/* Category + Status row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(28,49,68,0.08)', padding: '5px 10px',
              borderRadius: '999px', fontSize: '12px',
              fontFamily: 'Oswald, sans-serif', letterSpacing: '0.06em', textTransform: 'uppercase',
            }}>
              <CategoryShape category={category} size={12} />
              {issue.category}
            </span>
            <StatusPill status={issue.status} />
            
            {/* Status Edit Dropdown (if owner) */}
            {user && user.id === issue.user_id && (
              <select 
                value={issue.status}
                onChange={e => updateStatus(e.target.value)}
                style={{
                  fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px',
                  padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--line)', background: 'var(--paper)', cursor: 'pointer',
                  marginLeft: 'auto'
                }}
              >
                <option value="pending">Set Pending</option>
                <option value="in_progress">Set In Progress</option>
                <option value="resolved">Set Resolved</option>
              </select>
            )}
          </div>

          {/* Title */}
          <h1 style={{ fontSize: '26px', lineHeight: 1.2, marginBottom: '12px' }}>
            {issue.title}
          </h1>

          {/* Meta */}
          <div style={{
            fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px',
            color: 'var(--slate)', marginBottom: '16px',
          }}>
            Reported {timeAgo(issue.created_at)}
            {issue.authority_tag && ` · → ${issue.authority_tag}`}
            {issue.latitude && ` · ${issue.latitude.toFixed(4)}° N, ${issue.longitude.toFixed(4)}° E`}
          </div>

          {/* Description */}
          {issue.description && (
            <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--ink)', marginBottom: '16px' }}>
              {issue.description}
            </p>
          )}

          {/* AI Data */}
          {(issue.severity_score != null || issue.urgency_score != null || issue.ai_category) && (
            <div style={{
              background: 'var(--paper-2)', border: '1px solid var(--line)',
              borderRadius: '4px', padding: '12px 14px', marginBottom: '16px',
              fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--green)',
            }}>
              <div style={{ marginBottom: '4px' }}>◆ AI Analysis</div>
              {issue.ai_category && <div style={{ color: 'var(--slate)' }}>Category: {issue.ai_category}</div>}
              {issue.severity_score != null && <div style={{ color: 'var(--slate)' }}>Severity: {(issue.severity_score * 100).toFixed(0)}%</div>}
              {issue.urgency_score != null && <div style={{ color: 'var(--slate)' }}>Urgency: {(issue.urgency_score * 100).toFixed(0)}%</div>}
            </div>
          )}

          {/* ── Status Timeline ──────────────────────────────── */}
          <StatusTimeline currentStatus={issue.status} createdAt={issue.created_at} updatedAt={issue.updated_at} />

          {/* Vote row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--line)',
          }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)' }}>
              Community votes:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => handleVote('up')}
                aria-label="Upvote"
                style={{
                  border: '1px solid var(--line)',
                  background: userVote === 'up' ? 'var(--ink)' : '#fff',
                  borderRadius: '4px',
                  width: '32px',
                  height: '32px',
                  fontSize: '15px',
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
              <span style={{
                fontFamily: 'IBM Plex Mono, monospace', fontWeight: 500, fontSize: '18px',
                color: voteCount >= 0 ? 'var(--green)' : 'var(--red)',
                minWidth: '32px', textAlign: 'center'
              }}>
                {voteCount >= 0 ? `+${voteCount}` : voteCount}
              </span>
              <button
                onClick={() => handleVote('down')}
                aria-label="Downvote"
                style={{
                  border: '1px solid var(--line)',
                  background: userVote === 'down' ? 'var(--red)' : '#fff',
                  borderRadius: '4px',
                  width: '32px',
                  height: '32px',
                  fontSize: '15px',
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
          </div>
        </div>
      </div>

      {/* ── Comments Section ──────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: '18px', marginBottom: '14px' }}>
          Discussion ({comments.length})
        </h2>

        {/* Comment list */}
        {comments.map(c => (
          <div
            key={c.id}
            style={{
              background: '#fff', border: '1px solid var(--line)',
              borderRadius: '4px', padding: '14px', marginBottom: '10px',
            }}
          >
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: '8px',
              fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--slate)',
            }}>
              <span>{c.users?.name || c.users?.email || 'Anonymous'}</span>
              <span>{timeAgo(c.created_at)}</span>
            </div>
            <p style={{ fontSize: '14px', lineHeight: 1.6 }}>{c.text}</p>
          </div>
        ))}

        {comments.length === 0 && (
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)', marginBottom: '16px' }}>
            No comments yet. Be the first to add context or updates.
          </p>
        )}

        {/* Comment input */}
        {user ? (
          <form onSubmit={handleComment} style={{ marginTop: '14px' }}>
            <textarea
              rows={3}
              placeholder="Add a comment — updates, observations, or follow-up info..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              style={{
                width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '14px',
                padding: '10px 12px', border: '1px solid var(--line)',
                borderRadius: '4px', resize: 'vertical', color: 'var(--ink)',
                marginBottom: '10px',
              }}
            />
            <button
              type="submit"
              disabled={posting || !commentText.trim()}
              style={{
                fontFamily: 'Oswald, sans-serif', fontSize: '13px',
                letterSpacing: '0.08em', textTransform: 'uppercase',
                background: posting ? 'var(--slate)' : 'var(--ink)',
                color: 'var(--paper)', border: 'none',
                padding: '10px 20px', borderRadius: '4px',
                cursor: posting ? 'not-allowed' : 'pointer',
                fontWeight: 600,
              }}
            >
              {posting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)' }}>
            <Link to="/login" style={{ color: 'var(--ink)' }}>Log in</Link> to leave a comment.
          </p>
        )}
      </div>
    </div>
  )
}
