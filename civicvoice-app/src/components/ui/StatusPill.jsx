// ============================================================
// StatusPill — colored status badge
// ============================================================
// The design uses color to communicate status at a glance:
//   pending     = red    (#C84B31)
//   in_progress = amber  (#E8A23D)
//   resolved    = green  (#4C8C5B)
//
// Props:
//   status - 'pending' | 'in_progress' | 'resolved'
// ============================================================

const STATUS_CONFIG = {
  pending: {
    label: 'Pending',
    bg: 'var(--red)',
    color: '#fff',
  },
  in_progress: {
    label: 'In Progress',
    bg: 'var(--amber)',
    color: 'var(--ink)',   // Dark text on amber for contrast
  },
  resolved: {
    label: 'Resolved',
    bg: 'var(--green)',
    color: '#fff',
  },
}

export default function StatusPill({ status = 'pending' }) {
  // Normalize: handle 'in progress' (with space) as well as 'in_progress'
  const key = status?.toLowerCase().replace(' ', '_')
  const config = STATUS_CONFIG[key] ?? STATUS_CONFIG.pending

  return (
    <span
      style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '10px',
        letterSpacing: '0.05em',
        padding: '4px 9px',
        borderRadius: '999px',
        background: config.bg,
        color: config.color,
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}
    >
      {config.label}
    </span>
  )
}
