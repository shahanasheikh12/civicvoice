import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import StatusPill from '../components/ui/StatusPill'

export default function AdminDashboard() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch all issues + votes for the admin view
  useEffect(() => {
    async function fetchAdminData() {
      setLoading(true)
      const { data: issuesData, error } = await supabase
        .from('issues')
        .select(`
          id, title, category, status, authority_tag, created_at,
          votes (vote_type)
        `)
        .order('created_at', { ascending: false })

      if (!error && issuesData) {
        // Calculate net votes client-side
        const issuesWithVotes = issuesData.map(issue => {
          const voteCount = (issue.votes || []).reduce((sum, v) => sum + (v.vote_type === 'up' ? 1 : -1), 0)
          return { ...issue, voteCount }
        })
        setIssues(issuesWithVotes)
      }
      setLoading(false)
    }
    fetchAdminData()
  }, [])

  // Status updater
  async function updateIssueStatus(issueId, newStatus) {
    const { error } = await supabase
      .from('issues')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', issueId)

    if (!error) {
      setIssues(prev => prev.map(iss => 
        iss.id === issueId ? { ...iss, status: newStatus } : iss
      ))
    } else {
      alert("Failed to update status")
    }
  }

  // --- Analytics Calculations ---
  const totalIssues = issues.length
  const statusCounts = issues.reduce((acc, iss) => {
    acc[iss.status] = (acc[iss.status] || 0) + 1
    return acc
  }, { pending: 0, in_progress: 0, resolved: 0 })
  
  const categoryCounts = issues.reduce((acc, iss) => {
    const cat = iss.category?.toLowerCase() || 'other'
    acc[cat] = (acc[cat] || 0) + 1
    return acc
  }, {})

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: 'var(--slate)' }}>
        Loading admin dashboard...
      </div>
    )
  }

  return (
    <div className="page-enter" style={{ maxWidth: '1000px', margin: '0 auto', padding: '40px 24px 80px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px', color: 'var(--ink)' }}>Admin Dashboard</h1>

      {/* --- Analytics Section --- */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '40px', flexWrap: 'wrap' }}>
        {/* Total Card */}
        <div style={{ flex: 1, minWidth: '200px', background: '#fff', border: '1px solid var(--line)', borderRadius: '4px', padding: '20px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)', textTransform: 'uppercase', marginBottom: '8px' }}>
            Total Issues
          </div>
          <div style={{ fontSize: '36px', fontWeight: 600, fontFamily: 'Oswald, sans-serif' }}>
            {totalIssues}
          </div>
        </div>

        {/* Status Card */}
        <div style={{ flex: 1, minWidth: '200px', background: '#fff', border: '1px solid var(--line)', borderRadius: '4px', padding: '20px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)', textTransform: 'uppercase', marginBottom: '12px' }}>
            By Status
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--red)' }}>Pending</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{statusCounts.pending || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--amber)' }}>In Progress</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{statusCounts.in_progress || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--green)' }}>Resolved</span>
              <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{statusCounts.resolved || 0}</span>
            </div>
          </div>
        </div>

        {/* Category Card */}
        <div style={{ flex: 1, minWidth: '200px', background: '#fff', border: '1px solid var(--line)', borderRadius: '4px', padding: '20px' }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)', textTransform: 'uppercase', marginBottom: '12px' }}>
            By Category
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
            {Object.entries(categoryCounts).map(([cat, count]) => (
              <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', textTransform: 'capitalize' }}>
                <span>{cat}</span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{count}</span>
              </div>
            ))}
            {Object.keys(categoryCounts).length === 0 && <div style={{ color: 'var(--slate)' }}>No data</div>}
          </div>
        </div>
      </div>

      {/* --- Issues Table --- */}
      <h2 style={{ fontSize: '20px', marginBottom: '16px' }}>Manage Issues</h2>
      <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '4px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'var(--paper-2)', borderBottom: '1px solid var(--line)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)' }}>
              <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Title</th>
              <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Category</th>
              <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Authority</th>
              <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Votes</th>
              <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Status</th>
              <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Created</th>
              <th style={{ padding: '12px 16px', fontWeight: 'normal' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(iss => (
              <tr key={iss.id} style={{ borderBottom: '1px solid var(--line)', transition: 'background 0.2s' }}>
                <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                  <Link to={`/issue/${iss.id}`} style={{ color: 'var(--ink)', textDecoration: 'none', fontWeight: 500 }}>
                    {iss.title}
                  </Link>
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', textTransform: 'capitalize' }}>
                  {iss.category}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--slate)' }}>
                  {iss.authority_tag || '—'}
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: iss.voteCount >= 0 ? 'var(--green)' : 'var(--red)' }}>
                  {iss.voteCount >= 0 ? `+${iss.voteCount}` : iss.voteCount}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <StatusPill status={iss.status} />
                </td>
                <td style={{ padding: '12px 16px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--slate)' }}>
                  {new Date(iss.created_at).toLocaleDateString()}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <select 
                    value={iss.status}
                    onChange={(e) => updateIssueStatus(iss.id, e.target.value)}
                    style={{
                      fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px',
                      padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--line)', 
                      background: 'var(--paper)', cursor: 'pointer', outline: 'none'
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </td>
              </tr>
            ))}
            {issues.length === 0 && (
              <tr>
                <td colSpan="7" style={{ padding: '20px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)' }}>
                  No issues reported yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
