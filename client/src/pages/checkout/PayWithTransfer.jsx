import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Copy, Check } from 'lucide-react'
import api from '../../lib/axios'
import useCartStore from '../../store/cartStore'
import { toast } from '../../store/toastStore'
import { Spinner, PageLoader } from '../../components/common/GlobalLoader'

const SHOW_SIMULATOR = import.meta.env.DEV || import.meta.env.VITE_ENABLE_SIMULATE === 'true'

function CopyRow({ label, value, big }) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(String(value))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {}
  }
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      gap: 12, padding: '14px 0', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
      <div>
        <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: '#9C9488', margin: '0 0 4px' }}>
          {label}
        </p>
        <p style={{ fontSize: big ? 26 : 15, fontWeight: 900, margin: 0, color: '#1D1D1D',
          letterSpacing: big ? '0.08em' : 0 }}>
          {value}
        </p>
      </div>
      <button onClick={copy} aria-label={`Copy ${label}`}
        style={{ background: '#F7F4EF', border: '1px solid #E4DDD3', borderRadius: 8, padding: '8px 10px',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
          fontWeight: 700, color: '#7F766B' }}>
        {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

export default function PayWithTransfer() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const clearCart = useCartStore(s => s.clearCart)
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [simulating, setSimulating] = useState(false)

  // Load once, then check every 5 seconds until the payment arrives
  useEffect(() => {
    let stop = false
    let timer

    async function check() {
      try {
        const res = await api.get(`/orders/${orderId}`, { silent: true })
        if (stop) return
        const o = res.data.order
        setOrder(o)

        if (o.paymentStatus !== 'PENDING') {
          clearCart()
          toast.success('Payment received! Your order is confirmed.')
          navigate('/order-confirmation', {
            replace: true,
            state: {
              form: { hall: o.deliveryHall, room: o.deliveryRoom },
              total: o.total,
              subtotal: o.subtotal,
              delivery: o.deliveryFee,
              items: o.items.map(i => ({
                name: i.name, price: i.price, qty: i.quantity, img: i.product?.images?.[0],
              })),
              orderId: o.orderNumber,
              paymentMethod: 'WEMA_TRANSFER',
            },
          })
          return
        }
      } catch (err) {
        if (!stop) setError(err.response?.data?.error || 'Could not load your order.')
      }
      if (!stop) timer = setTimeout(check, 5000)
    }

    check()
    return () => { stop = true; clearTimeout(timer) }
  }, [orderId])

  async function simulate() {
    setSimulating(true)
    try {
      await api.post('/wema/simulate', { orderId })
    } catch (err) {
      toast.error(err.response?.data?.error || 'Simulation failed.')
    } finally {
      setSimulating(false)
    }
  }

  if (error && !order) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 12, fontFamily: 'Inter, sans-serif', padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14, color: '#B53B2F' }}>{error}</p>
        <Link to="/orders" style={{ fontWeight: 700, color: '#1D1D1D' }}>Go to my orders</Link>
      </div>
    )
  }

  if (!order) return <PageLoader label="Loading your payment details…" minHeight="100vh" />

  if (!order.virtualAccount) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'Inter, sans-serif', padding: 24, textAlign: 'center' }}>
        <p style={{ fontSize: 14 }}>This order is not a bank transfer order. <Link to="/orders">My orders</Link></p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F4EF', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 16px 60px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-1px', margin: '0 0 6px', color: '#1D1D1D' }}>
          Complete your payment
        </h1>
        <p style={{ fontSize: 13, color: '#7F766B', margin: '0 0 20px', lineHeight: 1.6 }}>
          Transfer the exact amount below from any bank app. This page updates automatically once your payment arrives.
        </p>

        <div style={{ backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 14, padding: '6px 20px' }}>
          <CopyRow label="BANK" value="Wema Bank" />
          <CopyRow label="ACCOUNT NUMBER" value={order.virtualAccount} big />
          <CopyRow label="ACCOUNT NAME" value={`BUYLENCE ${order.orderNumber}`} />
          <CopyRow label="AMOUNT TO SEND" value={`₦${Number(order.total).toLocaleString()}`} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          marginTop: 22, color: '#7F766B', fontSize: 13, fontWeight: 600 }}>
          <Spinner size={16} color="#BE864B" /> Waiting for your transfer…
        </div>

        <p style={{ fontSize: 11, color: '#9C9488', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
          Order {order.orderNumber}. This account number is only for this order. Your money is held safely
          until you confirm delivery.
        </p>

        {SHOW_SIMULATOR && (
          <button onClick={simulate} disabled={simulating}
            style={{ width: '100%', marginTop: 22, padding: '12px', borderRadius: 10,
              border: '2px dashed #BE864B', background: 'transparent', color: '#9A662F',
              fontWeight: 700, fontSize: 13, cursor: simulating ? 'not-allowed' : 'pointer' }}>
            {simulating ? 'Simulating…' : '🧪 Demo: simulate payment received'}
          </button>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/orders" style={{ fontSize: 12, color: '#7F766B', fontWeight: 600 }}>
            I'll pay later, view my orders
          </Link>
        </div>
      </div>
    </div>
  )
}