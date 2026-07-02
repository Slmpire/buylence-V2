import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Phone, ShieldCheck, CheckCircle, AlertCircle } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const STATUS_TO_STEP = {
  PLACED: 0,
  PREPARING: 1,
  READY_FOR_PICKUP: 1,
  ASSIGNED_TO_RIDER: 2,
  PICKED_UP: 2,
  DELIVERED_BY_RIDER: 3,
  CONFIRMED_BY_BUYER: 3,
}

const STATUS_STEPS = [
  { key: 'received', label: 'Order received', desc: 'Your order has been placed and payment secured' },
  { key: 'confirmed', label: 'Vendor confirmed', desc: 'Vendor has accepted and is preparing your order' },
  { key: 'out_for_delivery', label: 'Out for delivery', desc: 'Rider is on the way to your gate' },
  { key: 'delivered', label: 'Delivered', desc: 'Confirm receipt to release escrow payment' },
]

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get(`/orders/${id}`)
      .then(res => setOrder(res.data.order))
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true)
        else setError('Failed to load order.')
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleConfirmDelivery() {
    setConfirming(true)
    try {
      await api.post(`/orders/${id}/confirm-receipt`)
      setConfirmed(true)
      const res = await api.get(`/orders/${id}`)
      setOrder(res.data.order)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm delivery.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F2ED', fontFamily: 'Inter, sans-serif' }}>
        <Navbar />
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid #BE864B', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: 13, color: '#9C9488' }}>Loading order...</p>
        </div>
      </div>
    )
  }

  if (notFound || !order) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F2ED', fontFamily: 'Inter, sans-serif' }}>
        <Navbar />
        <div style={{ maxWidth: 600, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>📦</p>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Order not found</h2>
          <p style={{ fontSize: 14, color: '#9C9488', marginBottom: 24 }}>
            We couldn't find order <strong>{id}</strong>.
          </p>
          <button
            onClick={() => navigate('/orders')}
            style={{
              padding: '12px 24px', backgroundColor: '#1D1D1D',
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            BACK TO ORDERS
          </button>
        </div>
      </div>
    )
  }

  const activeStep = STATUS_TO_STEP[order.status] ?? 0
  const vendorConfirmed = ['READY_FOR_PICKUP', 'ASSIGNED_TO_RIDER', 'PICKED_UP', 'DELIVERED_BY_RIDER', 'CONFIRMED_BY_BUYER'].includes(order.status)
  const buyerConfirmed = order.status === 'CONFIRMED_BY_BUYER' || confirmed
  const bothConfirmed = vendorConfirmed && buyerConfirmed
  const date = new Date(order.createdAt).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

  const badge = {
    PLACED: { label: 'PLACED', color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' },
    PREPARING: { label: 'PREPARING', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    READY_FOR_PICKUP: { label: 'READY FOR PICKUP', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
    ASSIGNED_TO_RIDER: { label: 'IN TRANSIT', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    PICKED_UP: { label: 'IN TRANSIT', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    DELIVERED_BY_RIDER: { label: 'DELIVERED', color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    CONFIRMED_BY_BUYER: { label: 'COMPLETED', color: '#16A34A', bg: '#F0FDF4', border: '#BBF7D0' },
    CANCELLED: { label: 'CANCELLED', color: '#DC2626', bg: '#FEF2F2', border: '#FECACA' },
  }[order.status] || { label: order.status, color: '#6B7280', bg: '#F9FAFB', border: '#E5E7EB' }

  const cardStyle = {
    backgroundColor: 'white',
    border: '1px solid rgba(0,0,0,0.07)',
    borderRadius: 14,
    padding: isMobile ? '18px 16px' : '24px 26px',
    marginBottom: 14,
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2ED', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      <div style={{
        maxWidth: 780, margin: '0 auto',
        padding: isMobile ? '20px 16px 80px' : '36px 24px 80px',
      }}>

        {/* Back */}
        <button
          onClick={() => navigate('/orders')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none',
            color: '#7F766B', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            letterSpacing: '0.08em', marginBottom: 20, padding: 0,
          }}
        >
          <ArrowLeft size={14} /> BACK TO ORDERS
        </button>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: 20, gap: 12,
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? 20 : 26,
              fontWeight: 900, letterSpacing: '-0.5px',
              margin: '0 0 6px', color: '#1D1D1D',
            }}>
              {order.orderNumber}
            </h1>
            <p style={{ fontSize: 12, color: '#9C9488', margin: 0 }}>{date}</p>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{
              fontSize: isMobile ? 18 : 22,
              fontWeight: 900, color: '#BE864B',
              margin: '0 0 6px', letterSpacing: '-0.5px',
            }}>
              ₦{order.total.toLocaleString()}
            </p>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.08em',
              padding: '3px 10px', borderRadius: 6,
              backgroundColor: badge.bg, color: badge.color,
              border: `1px solid ${badge.border}`,
            }}>
              {badge.label}
            </span>
          </div>
        </div>

        {/* Order Progress */}
        <div style={cardStyle}>
          <h2 style={{
            fontSize: 11, fontWeight: 800,
            letterSpacing: '0.12em', color: '#9C9488', marginBottom: 20,
          }}>
            ORDER PROGRESS
          </h2>
          {STATUS_STEPS.map((step, i) => {
            const done = i <= activeStep
            const isLast = i === STATUS_STEPS.length - 1
            return (
              <div key={step.key} style={{ display: 'flex', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    backgroundColor: done ? '#16A34A' : '#F0EDE8',
                    border: `2px solid ${done ? '#16A34A' : '#E4DDD3'}`,
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', flexShrink: 0,
                  }}>
                    {done
                      ? <CheckCircle size={15} color="white" strokeWidth={2.5} />
                      : <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D3D1C7' }} />
                    }
                  </div>
                  {!isLast && (
                    <div style={{
                      width: 2, minHeight: 24,
                      backgroundColor: done && i < activeStep ? '#16A34A' : '#E4DDD3',
                      margin: '4px 0', borderRadius: 1,
                    }} />
                  )}
                </div>
                <div style={{ paddingBottom: isLast ? 0 : 16, paddingTop: 2 }}>
                  <p style={{
                    fontSize: isMobile ? 13 : 14, fontWeight: 700,
                    color: done ? '#1D1D1D' : '#9C9488', margin: '0 0 2px',
                  }}>
                    {step.label}
                  </p>
                  <p style={{ fontSize: 12, color: '#9C9488', margin: 0 }}>{step.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Items Ordered */}
        <div style={cardStyle}>
          <h2 style={{
            fontSize: 11, fontWeight: 800,
            letterSpacing: '0.12em', color: '#9C9488', marginBottom: 16,
          }}>
            ITEMS ORDERED
          </h2>
          {order.items.map((item, i) => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 0',
              borderBottom: i < order.items.length - 1
                ? '1px solid rgba(0,0,0,0.05)' : 'none',
            }}>
              <div style={{
                width: isMobile ? 44 : 52,
                height: isMobile ? 44 : 52,
                borderRadius: 8, overflow: 'hidden',
                flexShrink: 0,
                border: '1px solid rgba(0,0,0,0.06)',
                backgroundColor: '#F0EDE8',
              }}>
                {item.product?.images?.[0] && (
                  <img
                    src={item.product.images[0]} alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: isMobile ? 13 : 14, fontWeight: 700, margin: '0 0 2px' }}>
                  {item.name}
                </p>
                <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                  ×{item.quantity}
                </p>
              </div>
              <p style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, color: '#BE864B', margin: 0, flexShrink: 0 }}>
                ₦{(item.price * item.quantity).toLocaleString()}
              </p>
            </div>
          ))}

          {/* Totals */}
          <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 8, paddingTop: 14 }}>
            {[
              { label: 'Subtotal', value: `₦${order.subtotal.toLocaleString()}` },
              { label: 'Gate delivery fee', value: `₦${order.deliveryFee.toLocaleString()}` },
            ].map(r => (
              <div key={r.label} style={{
                display: 'flex', justifyContent: 'space-between',
                fontSize: 13, marginBottom: 7,
              }}>
                <span style={{ color: '#9C9488' }}>{r.label}</span>
                <span style={{ fontWeight: 600 }}>{r.value}</span>
              </div>
            ))}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', paddingTop: 8,
              borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 4,
            }}>
              <span style={{ fontSize: 15, fontWeight: 800 }}>Total</span>
              <span style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: '#BE864B' }}>
                ₦{order.total.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
              <ShieldCheck size={13} color="#BE864B" />
              <span style={{ fontSize: 11, color: '#7F766B' }}>
                {order.paymentMethod === 'PAYSTACK'
                  ? 'Paid via Paystack · Held in escrow'
                  : 'Pay on delivery · Escrow pending'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Delivery + Vendor */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 12, marginBottom: 14,
        }}>
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 14, padding: isMobile ? '16px' : '20px 22px',
          }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#9C9488', marginBottom: 12 }}>
              DELIVERY DETAILS
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <MapPin size={13} color="#BE864B" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>
                  {order.deliveryHall}{order.deliveryRoom ? ` · ${order.deliveryRoom}` : ''}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Phone size={13} color="#BE864B" />
                <span style={{ fontSize: 13, fontWeight: 600 }}>{order.recipientPhone}</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 14, padding: isMobile ? '16px' : '20px 22px',
          }}>
            <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#9C9488', marginBottom: 12 }}>
              VENDOR
            </h3>
            <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 3px' }}>
              {order.vendor?.storeName || '—'}
            </p>
            <p style={{ fontSize: 12, color: '#9C9488', margin: '0 0 3px' }}>
              {order.vendor?.hall || '—'}
            </p>
            {order.vendor?.rating && (
              <p style={{ fontSize: 12, color: '#BE864B', fontWeight: 700 }}>
                ★ {order.vendor.rating}
              </p>
            )}
          </div>
        </div>

        {/* Escrow confirmation */}
        <div style={cardStyle}>
          <h2 style={{
            fontSize: 11, fontWeight: 800,
            letterSpacing: '0.12em', color: '#9C9488', marginBottom: 6,
          }}>
            ESCROW CONFIRMATION
          </h2>
          <p style={{ fontSize: 13, color: '#7F766B', marginBottom: 16, lineHeight: 1.6 }}>
            Payment of <strong style={{ color: '#1D1D1D' }}>₦{order.total.toLocaleString()}</strong> held securely. Both parties must confirm before funds are released.
          </p>

          {error && (
            <div style={{
              padding: '10px 14px', backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA', borderRadius: 8,
              fontSize: 12, color: '#DC2626', marginBottom: 14,
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 10, marginBottom: 16,
          }}>
            {[
              {
                label: 'Vendor Confirmation',
                confirmed: vendorConfirmed,
                note: vendorConfirmed ? 'Vendor confirmed dispatch ✓' : 'Awaiting vendor dispatch',
              },
              {
                label: 'Buyer Confirmation',
                confirmed: buyerConfirmed,
                note: buyerConfirmed ? 'You confirmed receipt ✓' : 'Confirm once items received',
              },
            ].map(side => (
              <div key={side.label} style={{
                padding: '14px', borderRadius: 10,
                border: `1.5px solid ${side.confirmed ? '#BBF7D0' : '#E4DDD3'}`,
                backgroundColor: side.confirmed ? '#F0FDF4' : '#FAFAF8',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  backgroundColor: side.confirmed ? '#16A34A' : '#F0EDE8',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', flexShrink: 0,
                }}>
                  {side.confirmed
                    ? <CheckCircle size={16} color="white" />
                    : <div style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#C8B89A' }} />
                  }
                </div>
                <div>
                  <p style={{
                    fontSize: 12, fontWeight: 700, margin: '0 0 2px',
                    color: side.confirmed ? '#16A34A' : '#9C9488',
                  }}>
                    {side.label}
                  </p>
                  <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>{side.note}</p>
                </div>
              </div>
            ))}
          </div>

          {bothConfirmed ? (
            <div style={{
              backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: 10, padding: '14px',
              display: 'flex', gap: 10, alignItems: 'center',
            }}>
              <CheckCircle size={18} color="#16A34A" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', margin: '0 0 2px' }}>
                  Payment released
                </p>
                <p style={{ fontSize: 12, color: '#16A34A', margin: 0 }}>
                  ₦{order.total.toLocaleString()} sent to {order.vendor?.storeName}.
                </p>
              </div>
            </div>
          ) : !vendorConfirmed ? (
            <div style={{
              backgroundColor: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 10, padding: '12px 14px',
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <AlertCircle size={15} color="#D97706" />
              <p style={{ fontSize: 12, color: '#92400E', margin: 0, lineHeight: 1.5 }}>
                Waiting for vendor to confirm dispatch.
              </p>
            </div>
          ) : !buyerConfirmed ? (
            <div>
              <div style={{
                backgroundColor: '#FFF8F2', border: '1px solid #F0D9C0',
                borderRadius: 10, padding: '11px 14px', marginBottom: 12,
                display: 'flex', gap: 8, alignItems: 'flex-start',
              }}>
                <AlertCircle size={14} color="#BE864B" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 11, color: '#7F766B', margin: 0, lineHeight: 1.6 }}>
                  <strong style={{ color: '#1D1D1D' }}>Only confirm</strong> after physically receiving all items. This releases payment and <strong>cannot be undone</strong>.
                </p>
              </div>
              <button
                onClick={handleConfirmDelivery}
                disabled={confirming}
                style={{
                  width: '100%', padding: isMobile ? '15px' : '14px',
                  background: confirming ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                  color: 'white', border: 'none', borderRadius: 10,
                  fontWeight: 700, fontSize: isMobile ? 15 : 14,
                  cursor: confirming ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <ShieldCheck size={17} />
                {confirming ? 'Confirming...' : 'CONFIRM DELIVERY & RELEASE PAYMENT'}
              </button>
            </div>
          ) : null}
        </div>

        {/* Escrow info */}
        <div style={{
          backgroundColor: '#F7F4EF',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 10,
          padding: isMobile ? '12px 14px' : '14px 18px',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <ShieldCheck size={14} color="#BE864B" style={{ flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 11, color: '#7F766B', lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: '#1D1D1D' }}>Buylence Escrow:</strong> Your payment is held securely and only released when both parties confirm. Contact support before confirming if there's an issue.
          </p>
        </div>
      </div>
    </div>
  )
}