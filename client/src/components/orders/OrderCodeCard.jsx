import { useState, useEffect, useCallback } from 'react'
import { KeyRound, Copy, Check, ShieldCheck, RefreshCw } from 'lucide-react'
import api from '../../lib/axios'
import { toast } from '../../store/toastStore'

const COPY = {
  vendor: {
    title: 'PICKUP CODE',
    text: 'Give this code to the rider when they arrive to collect the order. They must type it in to confirm pickup.',
    done: 'Pickup confirmed. The rider has collected this order.',
    renew: 'the rider has not collected it yet',
  },
  buyer: {
    title: 'YOUR DELIVERY CODE',
    text: 'Give this code to the rider only when you have received your order. The delivery cannot be completed without it.',
    done: 'Delivery code accepted. Please confirm receipt below to release the payment.',
    renew: 'you have not received your order yet',
  },
}

// role: 'vendor' (sees the pickup code) or 'buyer' (sees the delivery code)
export default function OrderCodeCard({ orderId, role, status }) {
  const [codes, setCodes] = useState(null)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await api.get(`/orders/${orderId}/codes`, { silent: true })
      setCodes(res.data.codes)
    } catch {
      setCodes(null)
    }
  }, [orderId])

  // Look again whenever the order moves to a new stage, and every 20 seconds
  useEffect(() => { load() }, [load, status])
  useEffect(() => {
    const timer = setInterval(load, 20000)
    return () => clearInterval(timer)
  }, [load])

  if (!codes || codes.role !== role) return null

  const text = COPY[role]
  const verified = role === 'vendor' ? codes.pickupVerified : codes.deliveryVerified

  // Nothing to show at this stage
  if (!codes.code && !verified) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }

  async function renew() {
    if (!window.confirm(`Get a new code? The old one will stop working. Only do this if ${text.renew}.`)) return
    setBusy(true)
    try {
      const res = await api.post(`/orders/${orderId}/codes/regenerate`)
      setCodes(res.data.codes)
      toast.success('Here is your new code.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not get a new code.')
    } finally {
      setBusy(false)
    }
  }

  // Already confirmed
  if (!codes.code && verified) {
    return (
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center',
        backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
        borderRadius: 10, padding: '10px 14px', marginBottom: 12,
        fontFamily: 'Inter, sans-serif',
      }}>
        <ShieldCheck size={15} color="#16A34A" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: '#166534', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
          {text.done}
        </p>
      </div>
    )
  }

  const digits = codes.code.replace(/(\d{3})(\d{3})/, '$1 $2')

  return (
    <div style={{
      backgroundColor: '#FFF8F2', border: '1px solid #F0D9C0',
      borderRadius: 14, padding: '16px 18px', marginBottom: 14,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <KeyRound size={15} color="#BE864B" />
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#BE864B', margin: 0 }}>
          {text.title}
        </p>
      </div>

      <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 14px', lineHeight: 1.6 }}>{text.text}</p>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: 'white', border: '1px solid #E5DFD5',
        borderRadius: 12, padding: '12px 16px', gap: 12,
      }}>
        <span style={{
          fontSize: 32, fontWeight: 900, letterSpacing: '0.18em',
          color: codes.locked ? '#9C9488' : '#1D1D1D',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        }}>
          {digits}
        </span>
        <button
          onClick={copy}
          aria-label="Copy code"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '8px 12px', borderRadius: 8, border: '1px solid #E4DDD3',
            backgroundColor: '#F7F4EF', color: '#7F766B',
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy'}
        </button>
      </div>

      {codes.locked && (
        <p style={{ fontSize: 12, color: '#B91C1C', fontWeight: 700, margin: '10px 0 0', lineHeight: 1.5 }}>
          Too many wrong tries, so this code is locked. Get a new code to unlock it.
        </p>
      )}

      <button
        onClick={renew}
        disabled={busy}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          marginTop: 12, background: 'none', border: 'none', padding: 0,
          fontSize: 11, fontWeight: 700, color: '#BE864B',
          cursor: busy ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
        }}
      >
        <RefreshCw size={11} /> {busy ? 'Getting a new code…' : 'Get a new code'}
      </button>
    </div>
  )
}