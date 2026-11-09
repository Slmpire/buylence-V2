import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link, Navigate } from 'react-router-dom'
import { CheckCircle, ShieldCheck } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { PageLoader } from '../../components/common/GlobalLoader'
import useCartStore from '../../store/cartStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

export default function Confirmation() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [params] = useSearchParams()
  const clearCart = useCartStore(s => s.clearCart)

  // What the payment page sent us back with
  const reference = params.get('reference') || params.get('trxref') // Paystack
  const groupId = params.get('groupId')
  const orderId = params.get('orderId') // older single orders

  const [status, setStatus] = useState('verifying') // verifying | done | failed
  const [orders, setOrders] = useState([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!reference && !groupId && !orderId) return

    let stop = false
    let timer
    let tries = 0

    function finish(list) {
      if (stop) return
      setOrders(list)
      clearCart() // payment confirmed, so the cart can be emptied now
      setStatus('done')
    }

    function fail(text) {
      if (stop) return
      setMessage(text)
      setStatus('failed')
    }

    async function confirmWithPaystack() {
      try {
        const res = await api.post(`/payments/verify/${reference}`)
        const list = res.data.orders || (res.data.order ? [res.data.order] : [])

        // Load the full orders (items, store names)
        if (res.data.group?.id) {
          const full = await api.get(`/orders/group/${res.data.group.id}`)
          finish(full.data.orders)
        } else if (list[0]?.id) {
          const full = await api.get(`/orders/${list[0].id}`)
          finish([full.data.order])
        } else {
          finish(list)
        }
      } catch (err) {
        fail(err.response?.data?.error || 'We could not confirm your payment yet.')
      }
    }

    // OPay (and any return without a reference): the result reaches the server by callback,
    // so look again every few seconds
    async function waitForPayment() {
      try {
        if (groupId) {
          const res = await api.get(`/orders/group/${groupId}`, { silent: true })
          if (stop) return
          if (res.data.group.status === 'PAID') return finish(res.data.orders)
          if (['EXPIRED', 'CANCELLED'].includes(res.data.group.status)) {
            return fail('This payment expired and the orders were cancelled.')
          }
        } else {
          const res = await api.get(`/orders/${orderId}`, { silent: true })
          if (stop) return
          if (res.data.order.paymentStatus !== 'PENDING') return finish([res.data.order])
          if (res.data.order.status === 'CANCELLED') {
            return fail('This order was cancelled.')
          }
        }
      } catch {
        // try again below
      }

      tries += 1
      if (tries >= 20) { // about 60 seconds
        return fail('We have not received the payment confirmation yet.')
      }
      if (!stop) timer = setTimeout(waitForPayment, 3000)
    }

    if (reference) confirmWithPaystack()
    else waitForPayment()

    return () => {
      stop = true
      clearTimeout(timer)
    }
  }, [reference, groupId, orderId])

  // Opened without anything to confirm
  if (!reference && !groupId && !orderId) return <Navigate to="/orders" replace />

  if (status === 'verifying') {
    return <PageLoader label="Confirming your payment…" minHeight="100vh" />
  }

  if (status === 'failed') {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 14,
        padding: 24, textAlign: 'center', fontFamily: 'Inter, sans-serif',
        backgroundColor: '#F7F4EF',
      }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>Payment not confirmed</h1>
        <p style={{ fontSize: 14, color: '#7F766B', maxWidth: 380, margin: 0, lineHeight: 1.6 }}>
          {message} If money left your account, don't worry: it will show on your order once your
          payment provider confirms it.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 20px', borderRadius: 10, border: 'none',
              backgroundColor: '#1D1D1D', color: 'white', fontWeight: 700, cursor: 'pointer',
            }}
          >
            Check again
          </button>
          <Link to="/orders" style={{
            padding: '12px 20px', borderRadius: 10, border: '1px solid #E4DDD3',
            color: '#1D1D1D', fontWeight: 700, textDecoration: 'none',
          }}>
            My orders
          </Link>
        </div>
      </div>
    )
  }

  // ── Paid ──
  const grandTotal = orders.reduce((sum, o) => sum + o.total, 0)
  const subtotal = orders.reduce((sum, o) => sum + o.subtotal, 0)
  const deliveryTotal = orders.reduce((sum, o) => sum + o.deliveryFee, 0)
  const first = orders[0] || {}
  const many = orders.length > 1

  const card = {
    backgroundColor: 'white',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 12, padding: '18px 20px',
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4EF',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      <Navbar />

      <div style={{
        flex: 1, maxWidth: 760, margin: '0 auto', width: '100%',
        padding: isMobile ? '28px 16px 60px' : '48px 32px 64px',
      }}>

        {/* Success */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32 }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            backgroundColor: '#BE864B',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <CheckCircle size={24} color="white" />
          </div>
          <h1 style={{
            fontSize: isMobile ? 28 : 36, fontWeight: 900,
            letterSpacing: '-0.8px', marginBottom: 8, color: '#1D1D1D',
          }}>
            {many ? 'Orders Confirmed!' : 'Order Confirmed!'}
          </h1>
          <p style={{ fontSize: 13, color: '#7F766B', lineHeight: 1.6, maxWidth: 380, margin: '0 auto' }}>
            {many
              ? `Your payment is held safely and ${orders.length} stores are now preparing your orders.`
              : 'Your payment is held safely and the store is now preparing your order.'}
          </p>
        </div>

        {/* Total card */}
        <div style={{
          backgroundColor: '#1D1D1D', borderRadius: 12, padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16, gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', margin: '0 0 4px' }}>
              {many ? `${orders.length} ORDERS` : 'ORDER ID'}
            </p>
            <p style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color: 'white', margin: 0 }}>
              {many ? orders.map(o => o.orderNumber).join(' · ') : first.orderNumber}
            </p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', margin: '0 0 4px' }}>
              TOTAL PAID
            </p>
            <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#BE864B', margin: 0 }}>
              ₦{grandTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Delivery */}
        <div style={{ ...card, marginBottom: 16 }}>
          <h2 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 12px', color: '#1D1D1D' }}>
            Delivery Details
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Destination', value: first.deliveryHall || '—' },
              { label: 'Details', value: first.deliveryRoom || '—' },
              { label: 'Receiver', value: first.recipientName || '—' },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span style={{ fontSize: 12, color: '#9C9488', flexShrink: 0 }}>{r.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right' }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* One card per store */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          {orders.map(order => (
            <div key={order.id} style={card}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'flex-start', gap: 12, marginBottom: 12,
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, margin: '0 0 2px' }}>
                    {order.vendor?.storeName || 'Store'}
                  </p>
                  <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>{order.orderNumber}</p>
                </div>
                <Link
                  to={`/orders/${order.id}`}
                  style={{ fontSize: 11, fontWeight: 800, color: '#BE864B', textDecoration: 'none', whiteSpace: 'nowrap' }}
                >
                  TRACK →
                </Link>
              </div>

              {order.items.map(item => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 6,
                    backgroundColor: '#E8E4DE', flexShrink: 0, overflow: 'hidden',
                  }}>
                    {item.product?.images?.[0] && (
                      <img
                        src={item.product.images[0]} alt={item.name}
                        referrerPolicy="no-referrer"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>
                      {item.name}{item.unitLabel ? ` (${item.unitLabel})` : ''}
                    </p>
                    <p style={{ fontSize: 10, color: '#9C9488', margin: 0 }}>×{item.quantity}</p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700 }}>
                    ₦{(item.price * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}

              <div style={{
                borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 10, paddingTop: 10,
                display: 'flex', justifyContent: 'space-between', fontSize: 12,
              }}>
                <span style={{ color: '#9C9488' }}>
                  Subtotal ₦{order.subtotal.toLocaleString()} + delivery ₦{order.deliveryFee.toLocaleString()}
                </span>
                <span style={{ fontWeight: 800 }}>₦{order.total.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Summary + actions */}
        <div style={card}>
          <h2 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 14px', color: '#1D1D1D' }}>
            Payment Summary
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
            {[
              { label: 'Items', value: `₦${subtotal.toLocaleString()}` },
              { label: many ? 'Delivery (all stores)' : 'Delivery', value: `₦${deliveryTotal.toLocaleString()}` },
            ].map(r => (
              <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#9C9488' }}>{r.label}</span>
                <span style={{ fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
          </div>
          <div style={{
            borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700 }}>Total paid</span>
            <span style={{ fontSize: 20, fontWeight: 900, color: '#BE864B' }}>
              ₦{grandTotal.toLocaleString()}
            </span>
          </div>

          <div style={{
            display: 'flex', gap: 8, alignItems: 'flex-start',
            backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
            borderRadius: 8, padding: '10px 12px', marginBottom: 14,
          }}>
            <ShieldCheck size={14} color="#16A34A" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: '#166534', margin: 0, lineHeight: 1.6 }}>
              {many
                ? 'Your money is held in escrow. Each store is paid only after you confirm that order was delivered.'
                : 'Your money is held in escrow and released to the store only after you confirm delivery.'}
            </p>
          </div>

          <button
            onClick={() => navigate('/marketplace')}
            style={{
              width: '100%', padding: '12px',
              background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              marginBottom: 8, fontFamily: 'Inter, sans-serif',
            }}
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/orders')}
            style={{
              width: '100%', padding: '10px',
              backgroundColor: 'transparent', color: '#7F766B',
              border: 'none', fontWeight: 600, fontSize: 12,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            VIEW ORDER STATUS
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}