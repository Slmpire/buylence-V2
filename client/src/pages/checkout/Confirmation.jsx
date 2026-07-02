import { useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useIsMobile } from '../../hooks/useWindowSize'

export default function Confirmation() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const orderId = state?.orderId || `BUY-${Math.random().toString(36).substring(2, 7).toUpperCase()}`
  const form = state?.form || {}
  const total = state?.total || 0
  const subtotal = state?.subtotal || 0
  const delivery = state?.delivery || 200
  const items = state?.items || []

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
      }}>
        <Link to="/" style={{
          fontWeight: 900, fontSize: isMobile ? 14 : 15,
          color: '#1D1D1D', textDecoration: 'none',
        }}>
          BUYLENCE
        </Link>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/cart" style={{ color: '#1D1D1D', fontSize: 18, textDecoration: 'none' }}>🛒</Link>
          <Link to="/dashboard" style={{ color: '#1D1D1D', fontSize: 18, textDecoration: 'none' }}>👤</Link>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1, maxWidth: 760, margin: '0 auto',
        width: '100%',
        padding: isMobile ? '36px 16px 80px' : '60px 32px 64px',
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
            fontSize: isMobile ? 28 : 36,
            fontWeight: 900, letterSpacing: '-0.8px',
            marginBottom: 8, color: '#1D1D1D',
          }}>
            Order Confirmed!
          </h1>
          <p style={{
            fontSize: 13, color: '#7F766B',
            lineHeight: 1.6, maxWidth: 360, margin: '0 auto',
          }}>
            Your curated selection is being prepared for hall delivery.
          </p>
        </div>

        {/* Order ID card */}
        <div style={{
          backgroundColor: '#1D1D1D',
          borderRadius: 12, padding: '16px 20px',
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 16,
        }}>
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', margin: '0 0 4px' }}>
              ORDER ID
            </p>
            <p style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color: 'white', margin: 0 }}>
              {orderId}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', margin: '0 0 4px' }}>
              TOTAL PAID
            </p>
            <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: '#BE864B', margin: 0 }}>
              ₦{total.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Two column on desktop, stack on mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16, marginBottom: 16,
        }}>

          {/* Delivery details */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: '18px 20px',
          }}>
            <h2 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, color: '#1D1D1D' }}>
              Delivery Details
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Destination', value: `${form.hall || 'Hall gate'}\n${form.room || ''}` },
                { label: 'Est. Arrival', value: 'Today, 4:30 PM – 5:15 PM' },
                { label: 'Order ID', value: orderId },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                  <span style={{ fontSize: 12, color: '#9C9488', flexShrink: 0 }}>{r.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, textAlign: 'right', whiteSpace: 'pre-line' }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div style={{ marginTop: 14, borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 12 }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', marginBottom: 10 }}>
                  ITEMS
                </p>
                {items.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      backgroundColor: '#E8E4DE', flexShrink: 0, overflow: 'hidden',
                    }}>
                      {item.img && (
                        <img src={item.img} alt={item.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, margin: 0 }}>{item.name}</p>
                      <p style={{ fontSize: 10, color: '#9C9488', margin: 0 }}>×{item.qty}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>
                      ₦{(item.price * item.qty).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financial summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              backgroundColor: 'white',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 12, padding: '18px 20px',
            }}>
              <h2 style={{ fontSize: 13, fontWeight: 800, marginBottom: 14, color: '#1D1D1D' }}>
                Financial Summary
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 12 }}>
                {[
                  { label: 'Subtotal', value: `₦${subtotal.toLocaleString()}` },
                  { label: 'Hall Delivery Fee', value: `₦${delivery}` },
                  { label: 'Campus Tax', value: '₦0' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: '#9C9488' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <div style={{
                borderTop: '1px solid rgba(0,0,0,0.06)', paddingTop: 10,
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: 14,
              }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Total</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: '#BE864B' }}>
                  ₦{total.toLocaleString()}
                </span>
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

            {/* Member perks */}
            <div style={{
              backgroundColor: 'white',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 12, padding: '14px 16px',
              display: 'flex', gap: 10, alignItems: 'flex-start',
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>🎁</span>
              <p style={{ fontSize: 12, color: '#7F766B', lineHeight: 1.6, margin: 0 }}>
                <strong style={{ color: '#1D1D1D' }}>Member Perk:</strong>{' '}
                You earned 36 Curator Points with this order!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#EDEAE4',
        borderTop: '1px solid rgba(0,0,0,0.06)',
        padding: isMobile ? '24px 20px' : '32px 32px 0',
      }}>
        <div style={{
          maxWidth: 760, margin: '0 auto',
          display: isMobile ? 'block' : 'grid',
          gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
          gap: 24, paddingBottom: isMobile ? 0 : 28,
        }}>
          <div style={{ marginBottom: isMobile ? 16 : 0 }}>
            <p style={{ fontSize: 13, fontWeight: 900, letterSpacing: '-0.3px', marginBottom: 6 }}>
              BUYLENCE
            </p>
            <p style={{ fontSize: 11, color: '#9C9488', lineHeight: 1.7, maxWidth: 220 }}>
              The premium campus marketplace. Elevating student living one delivery at a time.
            </p>
          </div>
          {!isMobile && (
            <>
              {[
                { title: 'Explore', links: ['Shop All', 'Hall Deliveries', 'Vendor Portal'] },
                { title: 'Assistance', links: ['Order Tracking', 'Campus Support', 'Privacy'] },
                { title: 'Connect', links: ['Instagram', 'Twitter', 'WhatsApp'] },
              ].map(col => (
                <div key={col.title}>
                  <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', color: '#9C9488', marginBottom: 10 }}>
                    {col.title}
                  </p>
                  {col.links.map(l => (
                    <Link key={l} to="/" style={{
                      display: 'block', fontSize: 12,
                      color: '#7F766B', textDecoration: 'none', marginBottom: 6,
                    }}>
                      {l}
                    </Link>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
        <div style={{
          borderTop: '1px solid rgba(0,0,0,0.06)',
          maxWidth: 760, margin: '0 auto',
          padding: '12px 0',
          textAlign: isMobile ? 'left' : 'center',
        }}>
          <p style={{ fontSize: 10, color: '#9C9488', margin: 0 }}>
            © 2026 Buylence. A Premium Campus Initiative.
          </p>
        </div>
      </div>
    </div>
  )
}