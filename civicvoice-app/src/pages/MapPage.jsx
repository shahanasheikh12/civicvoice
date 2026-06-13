import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import { supabase } from '../lib/supabaseClient'
import 'leaflet/dist/leaflet.css'
import CategoryShape from '../components/ui/CategoryShape'

// Helper to create a custom HTML marker for each category using Leaflet's divIcon
const getCategoryIcon = (categoryStr) => {
  const category = categoryStr?.toLowerCase() || 'road'
  let color = 'var(--slate)'
  let shapeStyle = 'border-radius: 50%;' // circle by default
  let label = '?'

  if (category === 'road') { color = 'var(--red)'; shapeStyle = 'transform: rotate(45deg);'; label = 'R' } // diamond
  if (category === 'water') { color = 'var(--ink)'; label = 'W' } // circle
  if (category === 'garbage') { color = 'var(--green)'; shapeStyle = 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%); border-radius: 0;'; label = 'G' } // triangle
  if (category === 'light') { color = 'var(--amber)'; label = 'L' } // octagon

  const htmlString = `
    <div style="
      width: 28px; height: 28px; 
      background-color: ${color}; 
      ${shapeStyle}
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      color: white; font-family: monospace; font-size: 11px; font-weight: bold;
    ">
      <span style="${category === 'road' ? 'transform: rotate(-45deg);' : ''}">${label}</span>
    </div>
  `

  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: htmlString,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  })
}

export default function MapPage() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchMapIssues() {
      // Only fetch issues that have coordinates
      const { data, error } = await supabase
        .from('issues')
        .select('id, title, category, status, latitude, longitude, created_at')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setIssues(data)
      }
      setLoading(false)
    }
    fetchMapIssues()
  }, [])

  // Provide a default center (e.g., India generic or bounding box of first issue)
  const defaultCenter = issues.length > 0 ? [issues[0].latitude, issues[0].longitude] : [20.5937, 78.9629] // India
  const defaultZoom = issues.length > 0 ? 12 : 5

  return (
    <div className="page-enter" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)' }}>
      
      {/* ── Map Header & Legend ──────────────────────────────────── */}
      <div style={{ 
        padding: '16px 24px', background: '#fff', borderBottom: '1px solid var(--line)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' 
      }}>
        <div>
          <h1 style={{ fontSize: '24px', marginBottom: '4px' }}>Issue Map</h1>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--slate)' }}>
            Showing {issues.length} reported locations
          </p>
        </div>
        
        {/* Legend */}
        <div style={{ 
          display: 'flex', gap: '16px', background: 'var(--paper-2)', padding: '8px 16px', 
          borderRadius: '4px', border: '1px solid var(--line)', flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
            <CategoryShape category="road" size={12} /> Road
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
            <CategoryShape category="water" size={12} /> Water
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
            <CategoryShape category="garbage" size={12} /> Garbage
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontFamily: 'Inter, sans-serif' }}>
            <CategoryShape category="light" size={12} /> Streetlight
          </div>
        </div>
      </div>

      {/* ── Map Container ────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', background: 'var(--paper-2)', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ 
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', 
            fontFamily: 'IBM Plex Mono, monospace', fontSize: '13px', color: 'var(--slate)' 
          }}>
            Loading map data...
          </div>
        ) : (
          <MapContainer 
            center={defaultCenter} 
            zoom={defaultZoom} 
            style={{ width: '100%', height: '100%', zIndex: 0 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {issues.map(issue => (
              <Marker 
                key={issue.id} 
                position={[issue.latitude, issue.longitude]}
                icon={getCategoryIcon(issue.category)}
              >
                <Popup className="custom-popup">
                  <div style={{ fontFamily: 'Inter, sans-serif', padding: '4px', minWidth: '180px' }}>
                    <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '16px', marginBottom: '8px', lineHeight: 1.2, color: 'var(--ink)' }}>
                      {issue.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', textTransform: 'uppercase', color: 'var(--slate)', background: 'var(--paper-2)', padding: '2px 6px', borderRadius: '4px' }}>
                        {issue.category}
                      </span>
                      <span style={{ 
                        fontFamily: 'IBM Plex Mono, monospace', fontSize: '10px', textTransform: 'uppercase', 
                        color: issue.status === 'resolved' ? 'var(--green)' : issue.status === 'in_progress' ? 'var(--amber)' : 'var(--red)'
                      }}>
                        • {issue.status.replace('_', ' ')}
                      </span>
                    </div>
                    <Link to={`/issue/${issue.id}`} style={{ 
                      display: 'block', textAlign: 'center', background: 'var(--ink)', color: 'var(--paper)',
                      padding: '8px', borderRadius: '4px', textDecoration: 'none', fontSize: '12px', fontWeight: 500,
                      fontFamily: 'Oswald, sans-serif', letterSpacing: '0.04em', textTransform: 'uppercase'
                    }}>
                      View Details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* Global CSS overrides for Leaflet Popups to match our theme */}
      <style>{`
        .leaflet-popup-content-wrapper {
          border-radius: 4px;
          border: 1px solid var(--line);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .leaflet-popup-content {
          margin: 10px;
        }
        .leaflet-container a.leaflet-popup-close-button {
          color: var(--slate);
        }
        .leaflet-container a.leaflet-popup-close-button:hover {
          color: var(--red);
        }
      `}</style>
    </div>
  )
}
