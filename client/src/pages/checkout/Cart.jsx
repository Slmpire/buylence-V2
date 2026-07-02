import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import useCartStore from '../../store/cartStore'
import { useIsMobile } from '../../hooks/useWindowSize'

export default function Cart() {
  const { items, removeItem, updateQty, clearCart } = useCartStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const delivery = 200
  const total = subtotal + delivery

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: 'var(--cream)' }}>
        <Navbar />
        <div style={{
          maxWidth: 600, margin: '0 auto',
          padding: '100px 24px', textAlign: 'center',
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            backgroundColor: 'var(--cream-dark)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <ShoppingBag size={28} color="var(--gray-muted)" />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
            Your cart is empty
          </h2>
          <p style={{
            fontSize: 14, color: 'var(--gray-muted)',
            marginBottom: 24, lineHeight: 1.6,
          }}>
            You haven't added anything yet. Browse the marketplace and add items to get started.
          </p>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              padding: '13px 28px',
              backgroundColor: 'var(--charcoal)', color: 'white',
              border: 'none', borderRadius: 'var(--radius-pill)',
              fontWeight: 700, fontSize: 13,
              letterSpacing: '0.06em', cursor: 'pointer',
            }}
          >
            BROWSE MARKETPLACE
          </button>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--cream)' }}>
      <Navbar />

      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: isMobile ? '24px 16px 100px' : '48px 24px 80px',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 24,
        }}>
          <div>
            <h1 style={{
              fontSize: isMobile ? 22 : 28,
              fontWeight: 900, letterSpacing: '-0.5px', marginBottom: 2,
            }}>
              Your Cart
            </h1>
            <p style={{ fontSize: 13, color: 'var(--gray-muted)', margin: 0 }}>
              {items.length} item{items.length > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={clearCart}
            style={{
              background: 'none', border: 'none',
              color: '#E74C3C', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', letterSpacing: '0.04em',
              padding: 0,
            }}
          >
            Clear all
          </button>
        </div>

        {/* Layout — stack on mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 360px',
          gap: 20, alignItems: 'start',
        }}>

          {/* Cart items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {items.map(item => (
              <div key={item.id} style={{
                backgroundColor: 'white',
                borderRadius: 'var(--radius-lg)',
                padding: isMobile ? '14px' : '16px',
                display: 'flex', alignItems: 'center',
                gap: isMobile ? 12 : 16,
                border: '1px solid var(--gray-border)',
              }}>
                {/* Image */}
                <img
                  src={item.img} alt={item.name}
                  style={{
                    width: isMobile ? 64 : 80,
                    height: isMobile ? 64 : 80,
                    objectFit: 'cover',
                    borderRadius: 'var(--radius-md)',
                    flexShrink: 0,
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 9, color: 'var(--gray-muted)',
                    letterSpacing: '0.06em', marginBottom: 2,
                  }}>
                    {item.tag}
                  </p>
                  <p style={{
                    fontSize: isMobile ? 13 : 15,
                    fontWeight: 800, marginBottom: 4,
                    letterSpacing: '-0.2px',
                    whiteSpace: 'nowrap', overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {item.name.toUpperCase()}
                  </p>
                  <p style={{
                    fontSize: isMobile ? 14 : 16,
                    fontWeight: 900, color: 'var(--amber)', margin: 0,
                  }}>
                    ₦{(item.price * item.qty).toLocaleString()}
                  </p>
                </div>

                {/* Qty + remove */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--gray-muted)',
                      display: 'flex', padding: 2,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#E74C3C'}
                    onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-muted)'}
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Qty controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => updateQty(item.id, item.qty - 1)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: '1.5px solid var(--gray-border)',
                        backgroundColor: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--charcoal)',
                      }}
                    >
                      <Minus size={12} />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.id, item.qty + 1)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: '1.5px solid var(--gray-border)',
                        backgroundColor: 'white', cursor: 'pointer',
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: 'var(--charcoal)',
                      }}
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order summary */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: 'var(--radius-lg)',
            padding: '22px',
            border: '1px solid var(--gray-border)',
            position: isMobile ? 'static' : 'sticky',
            top: 80,
          }}>
            <h2 style={{
              fontSize: 14, fontWeight: 900,
              letterSpacing: '-0.2px', marginBottom: 18,
            }}>
              ORDER SUMMARY
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {[
                { label: `Subtotal (${items.length} items)`, value: `₦${subtotal.toLocaleString()}` },
                { label: 'Gate delivery fee', value: `₦${delivery.toLocaleString()}` },
                { label: 'Escrow protection', value: 'FREE', green: true },
              ].map(r => (
                <div key={r.label} style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 13,
                }}>
                  <span style={{ color: 'var(--gray-muted)' }}>{r.label}</span>
                  <span style={{ fontWeight: 600, color: r.green ? '#16A34A' : 'inherit' }}>
                    {r.value}
                  </span>
                </div>
              ))}
            </div>

            <div style={{
              borderTop: '1px solid var(--gray-border)',
              paddingTop: 14, marginBottom: 16,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 20, fontWeight: 900, color: 'var(--amber)' }}>
                ₦{total.toLocaleString()}
              </span>
            </div>

            {/* Escrow notice */}
            <div style={{
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: 'var(--radius-md)',
              padding: '10px 12px',
              fontSize: 12, color: '#166534',
              lineHeight: 1.5, marginBottom: 16,
            }}>
              🔒 Payment held in escrow — released only after you confirm delivery.
            </div>

            <button
              onClick={() => navigate('/checkout')}
              style={{
                width: '100%', padding: '14px',
                backgroundColor: 'var(--charcoal)', color: 'white',
                border: 'none', borderRadius: 'var(--radius-md)',
                fontWeight: 700, fontSize: 13,
                letterSpacing: '0.08em', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8,
              }}
            >
              PROCEED TO CHECKOUT <ArrowRight size={16} />
            </button>

            <Link to="/marketplace" style={{
              display: 'block', textAlign: 'center',
              marginTop: 12, fontSize: 13,
              color: 'var(--gray-muted)', textDecoration: 'none',
            }}>
              Continue shopping
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile sticky checkout bar */}
      {isMobile && items.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid var(--gray-border)',
          padding: '14px 20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 12,
          zIndex: 50,
          boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        }}>
          <div>
            <p style={{ fontSize: 11, color: 'var(--gray-muted)', margin: '0 0 2px' }}>
              Total ({items.length} items)
            </p>
            <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--amber)', margin: 0 }}>
              ₦{total.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            style={{
              flex: 1, maxWidth: 200,
              padding: '13px',
              backgroundColor: 'var(--charcoal)', color: 'white',
              border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 13,
              letterSpacing: '0.06em', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}
          >
            CHECKOUT <ArrowRight size={15} />
          </button>
        </div>
      )}

      <Footer />
    </div>
  )
}