import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { Spinner } from '../common/GlobalLoader'

// onSubmit(code) should throw an Error with a readable message when the code is wrong
export default function CodeEntryModal({ open, title, subtitle, onSubmit, onClose }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setCode('')
      setError('')
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  if (!open) return null

  async function submit(e) {
    e.preventDefault()
    if (code.length !== 6) return setError('Enter all 6 digits.')

    setLoading(true)
    setError('')
    try {
      await onSubmit(code)
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      onClick={() => !loading && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, fontFamily: 'Inter, sans-serif',
      }}
    >
      <form
        onSubmit={submit}
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#FAF8F5', borderRadius: 18,
          width: '100%', maxWidth: 380, padding: '22px 22px 20px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, margin: 0, color: '#1D1D1D', lineHeight: 1.3 }}>
            {title}
          </h2>
          <button
            type="button" onClick={onClose} disabled={loading} aria-label="Close"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7F766B', display: 'flex', padding: 2 }}
          >
            <X size={18} />
          </button>
        </div>

        <p style={{ fontSize: 13, color: '#7F766B', margin: '0 0 16px', lineHeight: 1.6 }}>{subtitle}</p>

        <input
          ref={inputRef}
          value={code}
          onChange={e => {
            setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
            setError('')
          }}
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="••••••"
          maxLength={6}
          aria-label="6-digit code"
          style={{
            width: '100%', boxSizing: 'border-box', textAlign: 'center',
            fontSize: 30, fontWeight: 900, letterSpacing: '0.35em',
            padding: '14px 10px', borderRadius: 12,
            border: `2px solid ${error ? '#FCA5A5' : '#E4DDD3'}`,
            outline: 'none', backgroundColor: 'white', color: '#1D1D1D',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        />

        {error && (
          <p style={{ fontSize: 12, color: '#B91C1C', fontWeight: 600, margin: '10px 0 0', lineHeight: 1.5 }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          style={{
            width: '100%', marginTop: 16, padding: '13px',
            background: loading || code.length !== 6 ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
            color: 'white', border: 'none', borderRadius: 10,
            fontWeight: 800, fontSize: 13, letterSpacing: '0.04em',
            cursor: loading || code.length !== 6 ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {loading && <Spinner size={14} color="white" />}
          {loading ? 'Checking…' : 'CONFIRM'}
        </button>
      </form>
    </div>
  )
}