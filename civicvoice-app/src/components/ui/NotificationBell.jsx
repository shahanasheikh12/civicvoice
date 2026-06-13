// ============================================================
// Notification Bell — Header dropdown for status change alerts
// ============================================================
// Polls the issues table for status changes on the current user's
// reported issues. Uses Supabase real-time subscription.
//
// Shows a badge count and a dropdown with recent notifications.
// ============================================================

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'

const STATUS_LABELS = {
  pending:     { label: 'Pending',     color: 'var(--red)'   },
  in_progress: { label: 'In Progress', color: 'var(--amber)' },
  resolved:    { label: 'Resolved',    color: 'var(--green)' },
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const dropdownRef = useRef(null)

  useEffect(() => {
    if (!user) return

    // Load initial notifications from localStorage (persisted across sessions)
    const stored = localStorage.getItem(`cv_notifs_${user.id}`)
    if (stored) setNotifications(JSON.parse(stored))

    // Subscribe to real-time changes on issues that this user reported
    const channel = supabase
      .channel(`user-issues-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'issues',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const updated = payload.new
          const prev    = payload.old

          // Only notify if STATUS changed
          if (updated.status !== prev.status) {
            const newNotif = {
              id:      Date.now(),
              issueId: updated.id,
              title:   updated.title,
              status:  updated.status,
              time:    new Date().toISOString(),
              read:    false,
            }

            setNotifications(cur => {
              const next = [newNotif, ...cur].slice(0, 20) // keep latest 20
              localStorage.setItem(`cv_notifs_${user.id}`, JSON.stringify(next))
              return next
            })
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user?.id])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function markAllRead() {
    setNotifications(cur => {
      const next = cur.map(n => ({ ...n, read: true }))
      if (user) localStorage.setItem(`cv_notifs_${user.id}`, JSON.stringify(next))
      return next
    })
  }

  if (!user) return null

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={() => { setOpen(o => !o); if (!open) markAllRead() }}
        aria-label="Notifications"
        style={{
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '4px',
          width: '38px', height: '38px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          color: 'var(--paper)',
          fontSize: '16px',
          transition: 'background 0.15s',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: '-6px', right: '-6px',
            background: 'var(--red)', color: '#fff',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '10px', fontFamily: 'IBM Plex Mono, monospace',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700,
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute', top: '46px', right: 0,
          width: '300px', background: '#fff',
          border: '1px solid var(--line)', borderRadius: '4px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 1000,
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '12px 14px', borderBottom: '1px solid var(--line)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontFamily: 'Oswald, sans-serif', fontSize: '14px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Notifications
            </span>
            {notifications.length > 0 && (
              <button
                onClick={markAllRead}
                style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', color: 'var(--slate)', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--slate)' }}>
                No notifications yet.<br />We'll notify you when your issues are updated.
              </div>
            ) : (
              notifications.map(n => (
                <Link
                  key={n.id}
                  to={`/issue/${n.issueId}`}
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'block', padding: '12px 14px',
                    borderBottom: '1px solid var(--line)',
                    textDecoration: 'none', color: 'var(--ink)',
                    background: n.read ? '#fff' : 'rgba(232,162,61,0.06)',
                    transition: 'background 0.15s',
                  }}
                >
                  <div style={{ fontSize: '13px', marginBottom: '4px', fontWeight: n.read ? 400 : 600 }}>
                    {n.title}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px' }}>
                    <span>Status changed to</span>
                    <span style={{ color: STATUS_LABELS[n.status]?.color ?? 'var(--slate)', fontWeight: 600 }}>
                      {STATUS_LABELS[n.status]?.label ?? n.status}
                    </span>
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', color: 'var(--slate)', marginTop: '4px' }}>
                    {new Date(n.time).toLocaleString()}
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
