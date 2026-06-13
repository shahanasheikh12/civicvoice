// ============================================================
// Footer — simple monospace footer
// ============================================================
export default function Footer() {
  return (
    <footer
      className="text-center py-6 px-6"
      style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontSize: '11px',
        color: 'var(--slate)',
        borderTop: '1px solid var(--line)',
      }}
    >
      CIVICVOICE — CIVIC ISSUE REPORTING &amp; VOTING PLATFORM ·
      SHAPES = CATEGORY SYSTEM · COLOR = STATUS
    </footer>
  )
}
