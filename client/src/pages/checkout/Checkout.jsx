import { useState, useEffect } from 'react'
import { useNavigate, Link, Navigate } from 'react-router-dom'
import {
  ShoppingCart, User, ShieldCheck, AlertCircle, ArrowLeft, Clock,
  Plus, Minus, Trash2, Bookmark,
} from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import useDeliveryLocation from '../../store/deliveryLocationStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'
import { toast } from '../../store/toastStore'
import LocationPicker from '../../components/common/LocationPicker'

// Keep this the same as UNPAID_ORDER_MINUTES on the server (default 30)
const PAYMENT_WINDOW_MINUTES = 30

const PAYMENT_OPTIONS = [
  {
    id: 'PAYSTACK',
    label: 'Pay with Paystack',
    desc: 'Card, bank transfer or USSD. Held safely in escrow until you confirm delivery.',
    badge: 'RECOMMENDED',
    icon: '💳',
  },
  {
    id: 'OPAY',
    label: 'Pay with OPay',
    desc: 'OPay wallet, card or bank transfer. Held safely in escrow until you confirm delivery.',
    badge: null,
    icon: '🟢',
  },
]

const METHOD_LABEL = {
  PAYSTACK: '💳 Paystack',
  OPAY: '🟢 OPay',
}

// What is wrong with a cart line, if anything
function problemOf(item) {
  if (item.unavailable) return 'No longer available'
  if (typeof item.stock === 'number') {
    if (item.stock <= 0) return 'Out of stock'
    if (item.qty > item.stock) return `Only ${item.stock} left`
  }
  return null
}

function Section({ number, title, children }) {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: '18px 18px 20px',
      marginBottom: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{
          width: 24, height: 24, borderRadius: '50%',
          backgroundColor: '#BE864B',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: 'white',
          fontSize: 11, fontWeight: 800, flexShrink: 0,
        }}>
          {number}
        </div>
        <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', margin: 0 }}>
          {title}
        </h2>
      </div>
      {children}
    </div>
  )
}

function ReviewCard({ title, onEdit, children }) {
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: '16px 18px',
      marginBottom: 10,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
      }}>
        <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', margin: 0, color: '#9C9488' }}>
          {title}
        </h3>
        <button
          onClick={onEdit}
          style={{
            background: 'none', border: 'none',
            fontSize: 11, color: '#BE864B',
            fontWeight: 700, cursor: 'pointer',
            letterSpacing: '0.06em', padding: 0,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          EDIT
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {children}
      </div>
    </div>
  )
}

function ReviewRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
      <span style={{ fontSize: 12, color: '#9C9488', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#1D1D1D', textAlign: 'right' }}>{value}</span>
    </div>
  )
}

// Editable list of what is being bought (review step)
function ItemsCard({ items, addMoreTo, onQty, onRemove, onSave }) {
  const round = {
    width: 26, height: 26, borderRadius: '50%',
    border: '1.5px solid #E4DDD3', backgroundColor: 'white',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#1D1D1D', padding: 0,
  }
  const linkBtn = {
    background: 'none', border: 'none', padding: 0,
    fontSize: 11, fontWeight: 700, color: '#BE864B',
    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
    display: 'inline-flex', alignItems: 'center', gap: 4,
  }

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: '16px 18px',
      marginBottom: 10,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: 12,
      }}>
        <h3 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', margin: 0, color: '#9C9488' }}>
          YOUR ITEMS ({items.length})
        </h3>
        <Link to={addMoreTo} style={{ ...linkBtn, textDecoration: 'none' }}>
          + ADD MORE
        </Link>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {items.map(item => {
          const problem = problemOf(item)
          const atMax = typeof item.stock === 'number' && item.qty >= item.stock

          return (
            <div key={item.key} style={{
              display: 'flex', alignItems: 'center', gap: 12,
              paddingBottom: 14, borderBottom: '1px solid rgba(0,0,0,0.05)',
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 8, overflow: 'hidden',
                backgroundColor: '#F0EDE8', flexShrink: 0,
              }}>
                {(item.img || item.images?.[0]) && (
                  <img
                    src={item.img || item.images[0]}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px' }}>
                  {item.name}{item.unitLabel ? ` (${item.unitLabel})` : ''}
                </p>
                <p style={{ fontSize: 11, color: '#9C9488', margin: '0 0 6px' }}>
                  ₦{item.price.toLocaleString()} each
                  {item.priceWas && item.priceWas !== item.price && (
                    <span style={{ color: item.price < item.priceWas ? '#16A34A' : '#B45309', fontWeight: 700 }}>
                      {' '}· was ₦{item.priceWas.toLocaleString()}
                    </span>
                  )}
                </p>
                {problem && (
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', margin: '0 0 6px' }}>
                    {problem}
                  </p>
                )}
                <button onClick={() => onSave(item.key)} style={linkBtn}>
                  <Bookmark size={11} /> Save for later
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 800, margin: 0 }}>
                  ₦{(item.price * item.qty).toLocaleString()}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => onQty(item.key, item.qty - 1)}
                    aria-label="Decrease quantity"
                    style={{ ...round, cursor: 'pointer' }}
                  >
                    <Minus size={11} />
                  </button>
                  <span style={{ fontSize: 13, fontWeight: 700, minWidth: 16, textAlign: 'center' }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => !atMax && onQty(item.key, item.qty + 1)}
                    disabled={atMax}
                    aria-label="Increase quantity"
                    style={{ ...round, cursor: atMax ? 'not-allowed' : 'pointer', opacity: atMax ? 0.4 : 1 }}
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    onClick={() => onRemove(item.key)}
                    aria-label={`Remove ${item.name}`}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9C9488', display: 'flex', padding: 2 }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Checkout() {
  const { items, clearCart, updateQty, removeItem, saveForLater, refreshCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // The delivery location the buyer picked while browsing (if any)
  const savedLocation = useDeliveryLocation.getState().location

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    hall: savedLocation?.name || user?.hall || '', // the delivery location name (any place)
    latitude: savedLocation?.latitude ?? null,
    longitude: savedLocation?.longitude ?? null,
    room: '',
    paymentMethod: 'PAYSTACK',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form')

  // Make sure the prices and stock on screen are today's
  useEffect(() => {
    refreshCart()
  }, [])

  // If the buyer comes back with the browser Back button from the payment page,
  // some browsers restore this page frozen on the "processing" screen. Reset it.
  useEffect(() => {
    const onShow = (e) => {
      if (e.persisted) {
        setStep('review')
        setLoading(false)
      }
    }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  // Uses the vendor's real delivery fee when the cart item has it (falls back to 200
  // for items added before it was saved). The server calculates the final total.
  const delivery = items[0]?.vendor?.deliveryFee ?? 200
  const total = subtotal + delivery

  const problems = items.filter(i => problemOf(i))
  const multiVendor = new Set(items.map(i => i.vendorId)).size > 1
  const blocked = problems.length > 0 || multiVendor
  const addMoreTo = items[0]?.vendorId ? `/vendor/${items[0].vendorId}` : '/marketplace'

  const inp = {
    width: '100%', padding: '11px 14px',
    border: '1px solid #E4DDD3', borderRadius: 8,
    fontSize: isMobile ? 15 : 13, outline: 'none',
    backgroundColor: 'white', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif', color: '#2B2B2B',
    transition: 'border-color 0.15s',
  }

  const lbl = {
    fontSize: 10, fontWeight: 800,
    letterSpacing: '0.12em', color: '#39332E',
    marginBottom: 5, display: 'block',
  }

  function handleChange(k, v) {
    setForm(p => ({ ...p, [k]: v }))
    setError('')
  }

  function handleLocationChange(loc) {
    setForm(p => ({
      ...p,
      hall: loc.name,
      latitude: loc.latitude ?? null,
      longitude: loc.longitude ?? null,
    }))
    setError('')
  }

  function handleReview() {
    if (!form.fullName) return setError('Please enter your full name.')
    if (!form.phone) return setError('Please enter your WhatsApp number.')
    if (!form.hall.trim()) return setError('Please choose or type your delivery location.')
    if (blocked) return setError('Some items in your cart need attention. Please fix them first.')
    setError('')
    setStep('review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handlePlaceOrder() {
    if (blocked) {
      setError('Some items in your cart need attention. Please fix them first.')
      return
    }

    setStep('processing')
    setLoading(true)

    let order = null
    try {
      const vendorId = items[0]?.vendorId
      if (!vendorId) throw new Error('Cart items are missing vendor info.')

      const res = await api.post('/orders', {
        vendorId,
        items: items.map(item => ({
          productId: item.id,
          unitId: item.unitId || null,
          quantity: item.qty,
        })),
        deliveryHall: form.hall.trim(),
        deliveryLat: form.latitude,
        deliveryLng: form.longitude,
        deliveryRoom: form.room || '',
        recipientName: form.fullName,
        recipientPhone: form.phone,
        paymentMethod: form.paymentMethod, // 'PAYSTACK' | 'OPAY'
      })
      order = res.data.order

      // Go to the payment page. The cart is cleared once payment is confirmed.
      if (form.paymentMethod === 'OPAY') {
        const payRes = await api.post('/payments/opay/initialize', { orderId: order.id })
        window.location.href = payRes.data.cashierUrl
      } else {
        const payRes = await api.post('/payments/initialize', { orderId: order.id })
        window.location.href = payRes.data.authorizationUrl
      }
      return
    } catch (err) {
      console.error(err)

      // The order exists but the payment page would not open: let them retry from the order page
      if (order) {
        toast.error('Your order is saved, but the payment page would not open. You can complete payment from your order.')
        navigate(`/orders/${order.id}`)
        return
      }

      setError(err.response?.data?.error || err.message || 'Something went wrong. Please try again.')
      setStep('review')
      refreshCart() // stock or prices may have just changed
    } finally {
      setLoading(false)
    }
  }

  if (step === 'processing') {
    return (
      <div style={{
        minHeight: '100vh', backgroundColor: '#F7F4EF',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexDirection: 'column',
        fontFamily: 'Inter, sans-serif', gap: 20,
        padding: '24px',
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '3px solid #BE864B', borderTopColor: 'transparent',
          animation: 'spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8, color: '#1D1D1D' }}>
            Processing your order...
          </h2>
          <p style={{ fontSize: 14, color: '#9C9488' }}>
            {form.paymentMethod === 'OPAY' ? 'Taking you to OPay...' : 'Taking you to Paystack...'}
          </p>
        </div>
      </div>
    )
  }

  // Nothing to check out: send the buyer back to the cart.
  // (After the processing block on purpose, so this doesn't fire mid-payment.)
  if (items.length === 0) return <Navigate to="/cart" replace />

  const attentionBox = (blocked && (
    <div style={{
      display: 'flex', gap: 8, alignItems: 'flex-start',
      padding: '11px 14px', backgroundColor: '#FEF2F2',
      border: '1px solid #FECACA', borderRadius: 8,
      fontSize: 12, color: '#B91C1C', fontWeight: 500, marginBottom: 12, lineHeight: 1.5,
    }}>
      <AlertCircle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
      <span>
        {multiVendor
          ? 'Your cart has items from more than one store. Go back to the cart and save the others for later.'
          : 'Some items are sold out or over the available stock. Fix them in the Your items list on the review step, or in your cart.'}
      </span>
    </div>
  ))

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4EF',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: isMobile ? '0 16px' : '0 32px',
        height: 52,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F7F4EF',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link to="/" style={{
          fontWeight: 900, fontSize: isMobile ? 14 : 15,
          color: '#1D1D1D', textDecoration: 'none',
        }}>
          BUYLENCE
        </Link>
        {!isMobile && (
          <div style={{ display: 'flex', gap: 24 }}>
            {[{ label: 'Shop', to: '/marketplace' }, { label: 'Cart', to: '/cart' }, { label: 'Orders', to: '/orders' }].map(l => (
              <Link key={l.label} to={l.to} style={{ fontSize: 13, color: '#7F766B', textDecoration: 'none', fontWeight: 500 }}>
                {l.label}
              </Link>
            ))}
          </div>
        )}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <Link to="/cart"><ShoppingCart size={18} color="#1D1D1D" /></Link>
          <Link to="/dashboard"><User size={18} color="#1D1D1D" /></Link>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, maxWidth: 900, margin: '0 auto',
        width: '100%',
        padding: isMobile ? '20px 16px 100px' : '36px 32px 64px',
      }}>

        {/* Back */}
        <button
          onClick={() => step === 'review' ? setStep('form') : navigate('/cart')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none',
            color: '#7F766B', cursor: 'pointer',
            fontSize: 12, fontWeight: 600,
            letterSpacing: '0.08em', marginBottom: 20, padding: 0,
          }}
        >
          <ArrowLeft size={14} />
          {step === 'review' ? 'BACK TO DETAILS' : 'BACK TO CART'}
        </button>

        {/* Heading */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontSize: isMobile ? 32 : 44,
            fontWeight: 900, letterSpacing: '-2px',
            margin: '0 0 4px', color: '#1D1D1D', lineHeight: 1,
          }}>
            {step === 'review' ? 'REVIEW' : 'CHECKOUT'}
          </h1>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#9C9488' }}>
            {step === 'review' ? 'CONFIRM BEFORE PAYMENT' : 'SECURE YOUR CAMPUS ESSENTIALS'}
          </p>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
          {['Details', 'Review', 'Confirmed'].map((s, i) => {
            const stepNum = step === 'form' ? 0 : step === 'review' ? 1 : 2
            const done = i <= stepNum
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    backgroundColor: done ? '#BE864B' : '#E4DDD3',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: done ? 'white' : '#9C9488',
                    fontSize: 10, fontWeight: 800, flexShrink: 0,
                  }}>
                    {i + 1}
                  </div>
                  {!isMobile && (
                    <span style={{
                      fontSize: 11, fontWeight: done ? 700 : 500,
                      color: done ? '#1D1D1D' : '#9C9488', whiteSpace: 'nowrap',
                    }}>
                      {s}
                    </span>
                  )}
                </div>
                {i < 2 && (
                  <div style={{
                    flex: 1, height: 1,
                    margin: isMobile ? '0 6px' : '0 10px',
                    backgroundColor: i < stepNum ? '#BE864B' : '#E4DDD3',
                  }} />
                )}
              </div>
            )
          })}
        </div>

        {/* Main grid — stack on mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 300px',
          gap: 20, alignItems: 'start',
        }}>

          {/* Left */}
          <div>
            {step === 'form' ? (
              <>
                {attentionBox}

                {/* Contact */}
                <Section number="01" title="CONTACT INFORMATION">
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                    gap: 12,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={lbl}>FULL NAME</label>
                      <input
                        type="text" value={form.fullName}
                        onChange={e => handleChange('fullName', e.target.value)}
                        placeholder="Adewole Johnson"
                        style={inp}
                        onFocus={e => e.target.style.borderColor = '#BE864B'}
                        onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={lbl}>WHATSAPP PHONE</label>
                      <input
                        type="tel" value={form.phone}
                        onChange={e => handleChange('phone', e.target.value)}
                        placeholder="+234 812 345 6789"
                        style={inp}
                        onFocus={e => e.target.style.borderColor = '#BE864B'}
                        onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                      />
                    </div>
                  </div>
                </Section>

                {/* Delivery */}
                <Section number="02" title="DELIVERY POINT">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <LocationPicker
                      value={form.hall}
                      onChange={handleLocationChange}
                      label="DELIVERY LOCATION"
                      placeholder="Choose where we should deliver..."
                      inputStyle={inp}
                      labelStyle={lbl}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={lbl}>ROOM / BLOCK / DIRECTIONS (OPTIONAL)</label>
                      <input
                        type="text" value={form.room}
                        onChange={e => handleChange('room', e.target.value)}
                        placeholder="e.g. Block A, Room 201, or 'opposite the cafeteria'"
                        style={inp}
                        onFocus={e => e.target.style.borderColor = '#BE864B'}
                        onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                      />
                    </div>
                  </div>
                </Section>

                {/* Payment */}
                <Section number="03" title="PAYMENT METHOD">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {PAYMENT_OPTIONS.map(pm => (
                      <div
                        key={pm.id}
                        onClick={() => handleChange('paymentMethod', pm.id)}
                        style={{
                          padding: '14px',
                          border: `2px solid ${form.paymentMethod === pm.id ? '#BE864B' : '#E4DDD3'}`,
                          borderRadius: 10,
                          backgroundColor: form.paymentMethod === pm.id ? '#FFF8F2' : 'white',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <div style={{
                            width: 16, height: 16, borderRadius: '50%',
                            border: `2px solid ${form.paymentMethod === pm.id ? '#BE864B' : '#C8B89A'}`,
                            backgroundColor: form.paymentMethod === pm.id ? '#BE864B' : 'white',
                            flexShrink: 0, marginTop: 2,
                          }} />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                              <span style={{ fontSize: 16 }}>{pm.icon}</span>
                              <span style={{ fontSize: 13, fontWeight: 700 }}>{pm.label}</span>
                              {pm.badge && (
                                <span style={{
                                  fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                                  padding: '2px 6px', borderRadius: 4,
                                  backgroundColor: '#F0FDF4', color: '#16A34A',
                                }}>
                                  {pm.badge}
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>{pm.desc}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Escrow notice */}
                  <div style={{
                    marginTop: 12, backgroundColor: '#F7F4EF',
                    border: '1px solid rgba(0,0,0,0.06)',
                    borderRadius: 8, padding: '10px 12px',
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <ShieldCheck size={13} color="#BE864B" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ fontSize: 11, color: '#7F766B', margin: 0, lineHeight: 1.6 }}>
                      <strong style={{ color: '#1D1D1D' }}>Buylence Escrow:</strong>{' '}
                      Your payment is held safely and only released to the vendor after you confirm delivery.
                    </p>
                  </div>
                </Section>

                {error && (
                  <div style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    padding: '11px 14px', backgroundColor: '#FDECEC',
                    borderRadius: 8, fontSize: 12, color: '#B53B2F',
                    fontWeight: 500, marginBottom: 12,
                  }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                {/* On mobile the review button is in the bottom bar */}
                {!isMobile && (
                  <button
                    onClick={handleReview}
                    disabled={blocked}
                    style={{
                      width: '100%', padding: '14px',
                      background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                      color: 'white', border: 'none', borderRadius: 10,
                      fontWeight: 700, fontSize: 14,
                      cursor: blocked ? 'not-allowed' : 'pointer',
                      opacity: blocked ? 0.5 : 1,
                      letterSpacing: '0.04em',
                    }}
                  >
                    REVIEW ORDER →
                  </button>
                )}
              </>
            ) : (
              <>
                {attentionBox}

                {/* Editable items */}
                <ItemsCard
                  items={items}
                  addMoreTo={addMoreTo}
                  onQty={updateQty}
                  onRemove={removeItem}
                  onSave={saveForLater}
                />

                <ReviewCard title="CONTACT INFORMATION" onEdit={() => setStep('form')}>
                  <ReviewRow label="Name" value={form.fullName} />
                  <ReviewRow label="WhatsApp" value={form.phone} />
                </ReviewCard>

                <ReviewCard title="DELIVERY POINT" onEdit={() => setStep('form')}>
                  <ReviewRow label="Location" value={form.hall} />
                  <ReviewRow label="Details" value={form.room || '—'} />
                  {form.latitude !== null && (
                    <ReviewRow label="GPS" value="Shared ✓" />
                  )}
                </ReviewCard>

                <ReviewCard title="PAYMENT METHOD" onEdit={() => setStep('form')}>
                  <ReviewRow label="Method" value={METHOD_LABEL[form.paymentMethod]} />
                  <ReviewRow label="Escrow" value="✓ Protected" />
                </ReviewCard>

                {/* Mobile has no side summary, so show the totals here */}
                {isMobile && (
                  <div style={{
                    backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
                    borderRadius: 12, padding: '16px 18px', marginBottom: 10,
                  }}>
                    <ReviewRow label="Subtotal" value={`₦${subtotal.toLocaleString()}`} />
                    <div style={{ height: 7 }} />
                    <ReviewRow label="Delivery" value={`₦${delivery.toLocaleString()}`} />
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      borderTop: '1px solid rgba(0,0,0,0.06)', marginTop: 10, paddingTop: 10,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800 }}>TOTAL</span>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#BE864B' }}>
                        ₦{total.toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}

                {/* How confirmation works */}
                <div style={{
                  backgroundColor: '#FFF8F2',
                  border: '1px solid #F0D9C0',
                  borderRadius: 10, padding: '14px',
                  marginBottom: 14,
                }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1D', margin: '0 0 6px' }}>
                    How confirmation works
                  </p>
                  <p style={{ fontSize: 11, color: '#7F766B', margin: 0, lineHeight: 1.8 }}>
                    1. You pay now → money held in escrow<br />
                    2. Vendor confirms & dispatches<br />
                    3. You confirm receipt<br />
                    4. Funds released to vendor
                  </p>
                </div>

                {/* Payment window */}
                <div style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start',
                  backgroundColor: '#FFFBEB', border: '1px solid #FDE68A',
                  borderRadius: 10, padding: '12px 14px', marginBottom: 14,
                }}>
                  <Clock size={14} color="#B45309" style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: '#92400E', margin: 0, lineHeight: 1.6 }}>
                    Your order is held for <strong>{PAYMENT_WINDOW_MINUTES} minutes</strong> while you pay.
                    If payment isn't completed in time, the order is cancelled and the items go back on sale.
                  </p>
                </div>

                {error && (
                  <div style={{
                    display: 'flex', gap: 8, alignItems: 'center',
                    padding: '11px 14px', backgroundColor: '#FDECEC',
                    borderRadius: 8, fontSize: 12, color: '#B53B2F',
                    fontWeight: 500, marginBottom: 14,
                  }}>
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                {!isMobile && (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading || blocked}
                    style={{
                      width: '100%', padding: '15px',
                      background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                      color: 'white', border: 'none', borderRadius: 10,
                      fontWeight: 700, fontSize: 15,
                      cursor: loading || blocked ? 'not-allowed' : 'pointer',
                      opacity: loading || blocked ? 0.5 : 1,
                      letterSpacing: '0.04em',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 8,
                    }}
                  >
                    <ShieldCheck size={18} />
                    PLACE ORDER & PAY SECURELY
                  </button>
                )}
              </>
            )}
          </div>

          {/* Right — summary (desktop only) */}
          {!isMobile && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 12, padding: '20px',
              position: 'sticky', top: 68,
            }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', marginBottom: 14, color: '#1D1D1D' }}>
                ORDER SUMMARY
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                {items.map((item, i) => (
                  <div key={item.key || item.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 7,
                      backgroundColor: '#F0EDE8', flexShrink: 0,
                      overflow: 'hidden',
                    }}>
                      {(item.img || item.images?.[0]) && (
                        <img
                          src={item.img || item.images[0]}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>
                        {item.name}{item.unitLabel ? ` (${item.unitLabel})` : ''}
                      </p>
                      <p style={{ fontSize: 10, color: '#9C9488', margin: 0 }}>×{item.qty}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      ₦{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12, marginBottom: 12 }}>
                {[
                  { label: 'SUBTOTAL', value: `₦${subtotal.toLocaleString()}` },
                  { label: 'DELIVERY', value: `₦${delivery.toLocaleString()}` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 7 }}>
                    <span style={{ color: '#9C9488', fontWeight: 700, letterSpacing: '0.06em' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12, marginBottom: 14,
              }}>
                <span style={{ fontSize: 13, fontWeight: 800 }}>TOTAL</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#BE864B' }}>
                  ₦{total.toLocaleString()}
                </span>
              </div>

              {form.hall && (
                <div style={{
                  backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
                  borderRadius: 8, padding: '9px 12px',
                  fontSize: 12, color: '#166534',
                }}>
                  📍 {form.hall}{form.room && ` · ${form.room}`}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky bottom bar */}
      {isMobile && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
          zIndex: 50,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}>
          <div>
            <p style={{ fontSize: 11, color: '#9C9488', margin: '0 0 2px' }}>Total</p>
            <p style={{ fontSize: 18, fontWeight: 900, color: '#BE864B', margin: 0 }}>
              ₦{total.toLocaleString()}
            </p>
          </div>
          <button
            onClick={step === 'form' ? handleReview : handlePlaceOrder}
            disabled={loading || blocked}
            style={{
              flex: 1, maxWidth: 220, padding: '13px',
              background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
              color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 13,
              cursor: loading || blocked ? 'not-allowed' : 'pointer',
              opacity: loading || blocked ? 0.5 : 1,
              letterSpacing: '0.04em',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}
          >
            <ShieldCheck size={15} />
            {step === 'form' ? 'REVIEW ORDER' : 'PAY & PLACE ORDER'}
          </button>
        </div>
      )}
    </div>
  )
}