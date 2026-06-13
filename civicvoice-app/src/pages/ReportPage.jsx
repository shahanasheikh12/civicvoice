import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import CategoryShape from '../components/ui/CategoryShape'

// Auto-assign authority based on category (rule-based, per PRD §3.4)
const AUTHORITY_MAP = {
  road:    'Municipal Roads Dept.',
  water:   'Water Board',
  garbage: 'Sanitation Dept.',
  light:   'Electricity Board',
  other:   'Municipal Corporation',
}

// Step label component with numbered circle
function StepLabel({ number, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
      <span style={{
        width: '18px', height: '18px', borderRadius: '50%',
        background: 'var(--ink)', color: 'var(--paper)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px',
        flexShrink: 0,
      }}>{number}</span>
      <span style={{
        fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px',
        color: 'var(--slate)', textTransform: 'uppercase', letterSpacing: '0.08em',
      }}>{label}</span>
    </div>
  )
}

// Card/step wrapper
function StepCard({ children }) {
  return (
    <div style={{
      background: '#fff',
      border: '1px solid var(--line)',
      borderRadius: '4px',
      padding: '18px 20px',
      marginBottom: '14px',
    }}>
      {children}
    </div>
  )
}

export default function ReportPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // ── Form state ─────────────────────────────────────────────
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [category,    setCategory]    = useState('road')
  const [imageFile,   setImageFile]   = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [coords,      setCoords]      = useState(null)    // { lat, lng }
  const [locError,    setLocError]    = useState(null)

  // AI state
  const [aiCategory,   setAiCategory]   = useState(null)
  const [aiSuggestion, setAiSuggestion] = useState(null)  // { category, label, confidence }
  const [urgencyData,  setUrgencyData]  = useState(null)  // { urgency_level, urgency_score }
  const [urgencyLoading, setUrgencyLoading] = useState(false)
  
  const [submitting,   setSubmitting]   = useState(false)
  const [submitError,  setSubmitError]  = useState(null)
  const [showSuccess,  setShowSuccess]  = useState(false)

  // ── Handle photo selection ─────────────────────────────────
  async function handleFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    
    // Validation: Image size limit (e.g., 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB.')
      e.target.value = null // reset
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file)) // Preview in browser
    setAiSuggestion(null)

    // Call ML Microservice for Category Prediction
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const res = await fetch('http://localhost:8000/predict-category', {
        method: 'POST',
        body: formData
      })
      
      if (!res.ok) throw new Error("Failed to fetch")
      const data = await res.json()
      
      if (data.category) {
        setAiSuggestion({
          category: data.category,
          label: data.category,
          confidence: data.confidence
        })
        // Auto-select it in the UI and save to aiCategory
        setCategory(data.category)
        setAiCategory(data.category)
      }
    } catch (err) {
      console.error("AI service error:", err)
      // If AI fails, no big deal, user can select manually
    }
  }

  // ── Debounced Urgency Detection ────────────────────────────
  useEffect(() => {
    if (!description.trim()) {
      setUrgencyData(null)
      return
    }

    setUrgencyLoading(true)
    const timeoutId = setTimeout(async () => {
      try {
        const res = await fetch('http://localhost:8000/predict-urgency', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ description })
        })
        if (!res.ok) throw new Error("Failed to fetch urgency")
        const data = await res.json()
        setUrgencyData(data)
      } catch (err) {
        console.error("Urgency AI error:", err)
      } finally {
        setUrgencyLoading(false)
      }
    }, 1000)

    return () => clearTimeout(timeoutId)
  }, [description])

  // ── Get current GPS location ───────────────────────────────
  function handleGetLocation() {
    setLocError(null)
    if (!navigator.geolocation) {
      setLocError('Geolocation is not supported by your browser.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => setLocError('Could not get location. Please allow location access.')
    )
  }

  // ── Handle form submission ─────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    if (!user) { alert('Please log in first.'); return }
    
    // Basic validations
    if (!imageFile) { alert('Please add a photo of the issue.'); return }
    if (!title.trim()) { alert('Please add a title.'); return }
    if (!description.trim()) { alert('Please add a description.'); return }
    if (!coords) { alert('Please provide the location.'); return }

    setSubmitting(true)
    setSubmitError(null)

    try {
      let imageUrl = null

      // Step A: Upload image to Supabase Storage
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('issue-images')          // Bucket name — must exist in Supabase dashboard
          .upload(fileName, imageFile, { upsert: false })

        if (uploadError) throw uploadError

        // Get the public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('issue-images')
          .getPublicUrl(fileName)
        imageUrl = urlData.publicUrl
      }

      // Step B: Insert the issue into the database
      const { data, error: insertError } = await supabase
        .from('issues')
        .insert({
          user_id:       user.id,
          title:         title.trim(),
          description:   description.trim(),
          category:      category,
          image_url:     imageUrl,
          latitude:      coords.lat,
          longitude:     coords.lng,
          status:        'pending',
          authority_tag: AUTHORITY_MAP[category] ?? AUTHORITY_MAP.other,
          // AI fields populated from our FastAPI Microservice
          ai_category:   aiCategory,
          urgency_score: urgencyData ? urgencyData.urgency_score : null,
          severity_score: null, // Left for a future feature
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Success → show success message, then redirect to feed
      setShowSuccess(true)
      setTimeout(() => {
        navigate('/')
      }, 2000)

    } catch (err) {
      console.error('Submit error:', err)
      setSubmitError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success View ───────────────────────────────────────────
  if (showSuccess) {
    return (
      <div className="page-enter" style={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
      }}>
        <div style={{
          background: '#fff', border: '1px solid var(--line)',
          borderRadius: '4px', padding: '32px', maxWidth: '400px', width: '100%',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '40px', marginBottom: '16px' }}>✅</div>
          <h1 style={{ fontSize: '22px', marginBottom: '10px' }}>Report Submitted!</h1>
          <p style={{ color: 'var(--slate)', fontSize: '14px', lineHeight: 1.6, marginBottom: '20px' }}>
            Thank you for helping improve the community. Your report has been successfully recorded.
          </p>
          <p style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)' }}>
            Redirecting to Feed...
          </p>
        </div>
      </div>
    )
  }

  // ── Render ─────────────────────────────────────────────────
  return (
    <div
      className="page-enter"
      style={{ maxWidth: '1180px', margin: '0 auto', padding: '28px 24px 60px' }}
    >
      <div style={{ maxWidth: '620px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '28px', marginBottom: '6px' }}>Report an issue</h1>
        <p style={{ color: 'var(--slate)', fontSize: '14px', marginBottom: '28px' }}>
          Takes about a minute. The more detail you give, the faster it reaches the right department.
        </p>

        <form onSubmit={handleSubmit}>

          {/* ── Step 1: Photo ──────────────────────────────── */}
          <StepCard>
            <StepLabel number="1" label="Add a photo" />

            {imagePreview ? (
              <div style={{ position: 'relative' }}>
                <img
                  src={imagePreview}
                  alt="Preview"
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--line)' }}
                />
                <button
                  type="button"
                  onClick={() => { setImageFile(null); setImagePreview(null); setAiSuggestion(null); }}
                  style={{
                    position: 'absolute', top: '10px', right: '10px',
                    background: 'rgba(28,49,68,0.8)', color: '#fff', border: 'none',
                    borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Inter, sans-serif', fontSize: '14px', lineHeight: 1
                  }}
                  title="Remove photo"
                >
                  &times;
                </button>
              </div>
            ) : (
              // Dropzone / file picker
              <label
                htmlFor="image-upload"
                style={{
                  display: 'block',
                  border: '1.5px dashed var(--line)',
                  borderRadius: '4px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  color: 'var(--slate)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                  background: 'var(--paper-2)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--ink)'; e.currentTarget.style.background = '#e6dec9' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--line)'; e.currentTarget.style.background = 'var(--paper-2)' }}
              >
                <div style={{ fontSize: '24px', marginBottom: '8px' }}>📷</div>
                <div style={{ fontFamily: 'Oswald, sans-serif', fontSize: '14px', letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--ink)', marginBottom: '4px' }}>
                  Tap to upload photo
                </div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>
                  Max size: 5MB
                </div>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </label>
            )}

            {/* AI Suggestion Box — shown after photo is picked */}
            {aiSuggestion && (
              <div style={{
                marginTop: '12px',
                background: 'var(--paper-2)',
                border: '1px solid var(--line)',
                borderRadius: '4px',
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px',
                flexWrap: 'wrap',
                gap: '8px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CategoryShape category={aiSuggestion.category} size={14} />
                  <span>
                    AI suggests: <b style={{ fontFamily: 'Oswald, sans-serif', letterSpacing: '0.04em' }}>{aiSuggestion.label}</b>
                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', color: 'var(--slate)', marginLeft: '8px' }}>
                      {(aiSuggestion.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSuggestion(null)}
                  style={{
                    fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px',
                    color: 'var(--ink)', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer',
                  }}
                >
                  Not right? Edit
                </button>
              </div>
            )}
          </StepCard>

          {/* ── Step 2: Title + Description ────────────────── */}
          <StepCard>
            <StepLabel number="2" label="Describe the issue" />
            <input
              type="text"
              placeholder="Short title — e.g. Deep pothole at MG Road junction"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
              style={{
                width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '14px',
                padding: '10px 12px', border: '1px solid var(--line)', borderRadius: '4px',
                color: 'var(--ink)', marginBottom: '10px',
              }}
            />
            <textarea
              rows={4}
              placeholder="What's the problem? Include size, how long it's been there, who it affects..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              required
              style={{
                width: '100%', fontFamily: 'Inter, sans-serif', fontSize: '14px',
                padding: '10px 12px', border: '1px solid var(--line)', borderRadius: '4px',
                resize: 'vertical', color: 'var(--ink)',
              }}
            />
            {/* AI urgency detection from our FastAPI Microservice */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px',
              fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)',
            }}>
              AI urgency: 
              {urgencyLoading ? (
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: 'var(--line)', color: 'var(--slate)' }}>Analyzing...</span>
              ) : urgencyData ? (
                <span style={{ 
                  fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '3px 10px', borderRadius: '999px', 
                  background: urgencyData.urgency_level === 'High' ? 'rgba(200,75,49,0.1)' : urgencyData.urgency_level === 'Medium' ? 'rgba(232,162,61,0.1)' : 'rgba(76,140,91,0.1)', 
                  color: urgencyData.urgency_level === 'High' ? 'var(--red)' : urgencyData.urgency_level === 'Medium' ? 'var(--amber)' : 'var(--green)' 
                }}>
                  {urgencyData.urgency_level} ({(urgencyData.urgency_score * 100).toFixed(0)}%)
                </span>
              ) : (
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '11px', padding: '3px 10px', borderRadius: '999px', background: 'var(--line)', color: 'var(--slate)' }}>Pending description...</span>
              )}
            </div>
          </StepCard>

          {/* ── Step 3: Location ───────────────────────────── */}
          <StepCard>
            <StepLabel number="3" label="Location" />
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleGetLocation}
                style={{
                  fontFamily: 'Oswald, sans-serif', fontSize: '12px',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  border: '1px solid var(--ink)', background: coords ? 'var(--ink)' : '#fff', color: coords ? 'var(--paper)' : 'var(--ink)',
                  padding: '9px 16px', borderRadius: '4px', cursor: 'pointer',
                  transition: 'background 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { if(!coords) { e.currentTarget.style.background = 'var(--ink)'; e.currentTarget.style.color = 'var(--paper)' } }}
                onMouseLeave={e => { if(!coords) { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = 'var(--ink)' } }}
              >
                {coords ? 'Location Captured ✓' : 'Use my current location'}
              </button>
              {coords && (
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--slate)' }}>
                  {coords.lat.toFixed(4)}° N, {coords.lng.toFixed(4)}° E
                </span>
              )}
              {locError && (
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px', color: 'var(--red)' }}>
                  {locError}
                </span>
              )}
            </div>
            {!coords && !locError && (
              <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--slate)' }}>Location is required to submit a report.</p>
            )}
          </StepCard>

          {/* ── Step 4: Category ───────────────────────────── */}
          <StepCard>
            <StepLabel number="4" label="Category" />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {[
                { key: 'road',    label: 'Road'        },
                { key: 'water',   label: 'Water'       },
                { key: 'garbage', label: 'Garbage'     },
                { key: 'light',   label: 'Streetlight' },
                { key: 'other',   label: 'Other'       },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    border: `1px solid ${category === key ? 'var(--ink)' : 'var(--line)'}`,
                    borderRadius: '999px',
                    padding: '6px 14px',
                    fontFamily: 'Oswald, sans-serif', fontSize: '12px',
                    letterSpacing: '0.05em', textTransform: 'uppercase',
                    cursor: 'pointer',
                    background: category === key ? 'var(--ink)' : '#fff',
                    color: category === key ? 'var(--paper)' : 'var(--ink)',
                    transition: 'all 0.15s',
                  }}
                >
                  {key !== 'other' && <CategoryShape category={key} size={10} />}
                  {label}
                </button>
              ))}
            </div>
          </StepCard>

          {/* ── Submit Error ────────────────────────────────── */}
          {submitError && (
            <div style={{
              background: 'rgba(200,75,49,0.08)', border: '1px solid rgba(200,75,49,0.2)',
              borderRadius: '4px', padding: '10px 12px', marginBottom: '14px',
              color: 'var(--red)', fontFamily: 'IBM Plex Mono, monospace', fontSize: '12px',
            }}>
              ❌ {submitError}
            </div>
          )}

          {/* ── Submit Button ───────────────────────────────── */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              fontFamily: 'Oswald, sans-serif', fontSize: '15px',
              letterSpacing: '0.08em', textTransform: 'uppercase',
              background: submitting ? 'var(--slate)' : 'var(--red)',
              color: '#fff', border: 'none',
              padding: '14px', borderRadius: '4px',
              cursor: submitting ? 'not-allowed' : 'pointer',
              fontWeight: 600, marginTop: '6px',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting Report...' : 'Submit Report'}
          </button>
        </form>
      </div>
    </div>
  )
}
