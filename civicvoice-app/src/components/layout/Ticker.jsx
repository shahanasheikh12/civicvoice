// ============================================================
// Ticker — amber scrolling news bar
// Shows live urgent alerts and in-progress updates
// Uses CSS animation for infinite horizontal scroll
// ============================================================

// Sample ticker items — in a real app these would come from Supabase
const TICKER_ITEMS = [
  { bold: 'Urgent now —', text: 'Pothole, MG Road junction · 142 votes' },
  { bold: 'In progress —', text: 'Water pipeline leak, Lake Road · crew dispatched' },
  { bold: 'Hotspot —', text: '6 garbage complaints near Sector 12 market this week' },
  { bold: 'Resolved —', text: 'Streetlights fixed on Park Avenue' },
]

export default function Ticker() {
  // We duplicate the items so the scroll loops seamlessly
  // (the animation moves -50%, which lands exactly at the start of the duplicate)
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div
      className="overflow-hidden whitespace-nowrap"
      style={{
        background: 'var(--amber)',
        color: 'var(--ink)',
        borderBottom: '1px solid var(--ink)',
      }}
    >
      {/* ticker-animate class applies the CSS scroll animation from index.css */}
      <div className="ticker-animate inline-block py-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="mr-12"
            style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', fontWeight: 500 }}
          >
            {/* Bold label in Oswald */}
            <b style={{ fontFamily: 'Oswald, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {item.bold}
            </b>{' '}
            {item.text}
          </span>
        ))}
      </div>
    </div>
  )
}
