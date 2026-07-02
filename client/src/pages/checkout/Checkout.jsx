import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Bell, User, ShieldCheck, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const HALLS = ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'Mozambique Hall', 'Angola Hall', 'ETF Hall', 'Awolowo Hall']

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

export default function Checkout() {
  const { items, clearCart } = useCartStore()
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    hall: '', room: '',
    paymentMethod: 'NOMBA',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState('form')

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const delivery = 200
  const total = subtotal + delivery

  const displayItems = items.length > 0 ? items : [
    { id: 1, name: 'Salad Bowl', tag: 'Qty: 1 · Large', price: 4500, qty: 1 },
    { id: 2, name: 'Glazed Donut', tag: 'Qty: 2 · Small', price: 1100, qty: 2 },
  ]
  const displaySubtotal = items.length > 0 ? subtotal : 6700
  const displayTotal = items.length > 0 ? total : 6900

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

  function handleReview() {
    if (!form.fullName) return setError('Please enter your full name.')
    if (!form.phone) return setError('Please enter your WhatsApp number.')
    if (!form.hall) return setError('Please select your hall.')
    setError('')
    setStep('review')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handlePlaceOrder() {
    setStep('processing')
    setLoading(true)
    try {
      // Group items by vendor — take first vendor in cart
      const vendorId = items[0]?.vendorId
      if (!vendorId) throw new Error('Cart items are missing vendor info.')

      // Create the real order in the backend
      const res = await api.post('/orders', {
        vendorId,
        items: items.map(item => ({
          productId: item.id,
          quantity: item.qty,
        })),
        deliveryHall: form.hall,
        deliveryRoom: form.room || '',
        recipientName: form.fullName,
        recipientPhone: form.phone,
        paymentMethod: form.paymentMethod === 'paystack' ? 'NOMBA' : 'PAY_ON_DELIVERY',
      })

      const order = res.data.order

      // If NOMBA, initialize payment and redirect to NOMBA
      if (form.paymentMethod === 'NOMBA') {
        const payRes = await api.post('/payments/initialize', { orderId: order.id })
        clearCart()
        window.location.href = payRes.data.checkoutLink
        return
      }

      // Pay on delivery — go straight to confirmation
      clearCart()
      navigate('/order-confirmation', {
        state: {
          form,
          total: order.total,
          subtotal: order.subtotal,
          delivery: order.deliveryFee,
          items: displayItems,
          orderId: order.orderNumber,
          paymentMethod: form.paymentMethod,
        }
      })
    } catch (err) {
      console.error(err)
      const msg = err.response?.data?.error || 'Something went wrong. Please try again.'
      setError(msg)
      setStep('review')
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
            Securing your payment via NOMBA escrow
          </p>
        </div>
      </div>
    )
  }

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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={lbl}>SELECT OAU HALL</label>
                      <select
                        value={form.hall}
                        onChange={e => handleChange('hall', e.target.value)}
                        style={{ ...inp, cursor: 'pointer' }}
                        onFocus={e => e.target.style.borderColor = '#BE864B'}
                        onBlur={e => e.target.style.borderColor = '#E4DDD3'}
                      >
                        <option value="">Choose your hall...</option>
                        {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={lbl}>ROOM / BLOCK (OPTIONAL)</label>
                      <input
                        type="text" value={form.room}
                        onChange={e => handleChange('room', e.target.value)}
                        placeholder="e.g. Block A, Room 201"
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
                    {[
                      {
                        id: 'NOMBA', label: 'Pay with NOMBA',
                        desc: 'Card, bank transfer or USSD. Held in escrow.',
                        badge: 'RECOMMENDED', icon: '💳',
                      },
                      {
                        id: 'delivery', label: 'Pay on Delivery',
                        desc: 'Cash or POS at your hall gate.',
                        badge: null, icon: '🏠',
                      },
                    ].map(pm => (
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
                      <strong style={{ color: '#1D1D1D' }}>Buylence Escrow:</strong> Payment released only after both parties confirm delivery.
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

                {/* On mobile show review button here, else below */}
                {!isMobile && (
                  <button
                    onClick={handleReview}
                    style={{
                      width: '100%', padding: '14px',
                      background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                      color: 'white', border: 'none', borderRadius: 10,
                      fontWeight: 700, fontSize: 14, cursor: 'pointer',
                      letterSpacing: '0.04em',
                    }}
                  >
                    REVIEW ORDER →
                  </button>
                )}
              </>
            ) : (
              <>
                <ReviewCard title="CONTACT INFORMATION" onEdit={() => setStep('form')}>
                  <ReviewRow label="Name" value={form.fullName} />
                  <ReviewRow label="WhatsApp" value={form.phone} />
                </ReviewCard>

                <ReviewCard title="DELIVERY POINT" onEdit={() => setStep('form')}>
                  <ReviewRow label="Hall" value={form.hall} />
                  <ReviewRow label="Room" value={form.room || '—'} />
                </ReviewCard>

                <ReviewCard title="PAYMENT METHOD" onEdit={() => setStep('form')}>
                  <ReviewRow
                    label="Method"
                    value={form.paymentMethod === 'NOMBA' ? '💳 NOMBA' : '🏠 Pay on Delivery'}
                  />
                  <ReviewRow label="Escrow" value="✓ Protected" />
                </ReviewCard>

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
                    1. You place order → payment held in escrow<br />
                    2. Vendor confirms & dispatches<br />
                    3. You confirm receipt<br />
                    4. Funds released to vendor
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
                    disabled={loading}
                    style={{
                      width: '100%', padding: '15px',
                      background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                      color: 'white', border: 'none', borderRadius: 10,
                      fontWeight: 700, fontSize: 15,
                      cursor: 'pointer', letterSpacing: '0.04em',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 8,
                    }}
                  >
                    <ShieldCheck size={18} />
                    {form.paymentMethod === 'paystack'
                      ? 'PLACE ORDER & PAY SECURELY'
                      : 'PLACE ORDER (PAY ON DELIVERY)'
                    }
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
                {displayItems.map((item, i) => (
                  <div key={item.id || i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: 7,
                      backgroundColor: '#F0EDE8', flexShrink: 0,
                      overflow: 'hidden',
                    }}>
                      {item.img && (
                        <img src={item.img} alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{item.name}</p>
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
                  { label: 'SUBTOTAL', value: `₦${displaySubtotal.toLocaleString()}` },
                  { label: 'DELIVERY', value: `₦${delivery}` },
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
                  ₦{displayTotal.toLocaleString()}
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
              ₦{displayTotal.toLocaleString()}
            </p>
          </div>
          <button
            onClick={step === 'form' ? handleReview : handlePlaceOrder}
            disabled={loading}
            style={{
              flex: 1, maxWidth: 220, padding: '13px',
              background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
              color: 'white', border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 13,
              cursor: 'pointer', letterSpacing: '0.04em',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}
          >
            <ShieldCheck size={15} />
            {step === 'form' ? 'REVIEW ORDER' : 'PLACE ORDER'}
          </button>
        </div>
      )}
    </div>
  )
}