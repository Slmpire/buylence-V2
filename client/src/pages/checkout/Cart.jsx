import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, AlertCircle, Bookmark } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import ProductModal from '../../components/product/ProductModal'
import useCartStore from '../../store/cartStore'
import { useIsMobile } from '../../hooks/useWindowSize'

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
      <rect width="100%" height="100%" fill="#F0D9C0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="14" fill="#BE864B"
            text-anchor="middle" dominant-baseline="middle">No image</text>
    </svg>`
  )

const linkBtn = {
  background: 'none', border: 'none', padding: 0,
  fontSize: 11, fontWeight: 700, color: '#BE864B',
  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
  display: 'inline-flex', alignItems: 'center', gap: 4,
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

export default function Cart() {
  const {
    items, saved, removeItem, updateQty, clearCart,
    saveForLater, moveToCart, removeSaved, refreshCart,
  } = useCartStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // The line shown in the popup (null = closed)
  const [viewing, setViewing] = useState(null)

  // Check today's prices and stock whenever the cart opens
  useEffect(() => {
    refreshCart()
  }, [])

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  // Uses the store's real delivery fee when the cart item has it (falls back to 200
  // for items added before it was saved). The server calculates the final total.
  const delivery = items[0]?.vendor?.deliveryFee ?? 200
  const total = subtotal + delivery

  // An order can only contain products from one store
  const vendorIds = new Set(items.map(i => i.vendorId))
  const multiVendor = vendorIds.size > 1

  const problems = items.filter(i => problemOf(i))
  const canCheckout = !multiVendor && problems.length === 0

  function goToCheckout() {
    if (canCheckout) navigate('/checkout')
  }

  // The popup should show exactly the option in this cart line
  function popupProduct(item) {
    return {
      ...item,
      stock: item.stock ?? 50,
      units: item.unitId
        ? [{
            id: item.unitId,
            label: item.unitLabel || 'Piece',
            price: item.price,
            comparePrice: item.comparePrice ?? null,
            stock: item.stock ?? 50,
          }]
        : undefined,
    }
  }

  // Nothing in the cart and nothing saved
  if (items.length === 0 && saved.length === 0) {
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
              {items.length} item{items.length === 1 ? '' : 's'}
              {saved.length > 0 && ` · ${saved.length} saved for later`}
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clearCart}
              style={{
                background: 'none', border: 'none',
                color: '#E74C3C', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', letterSpacing: '0.04em',
                padding: 0,
              }}
            >
              Clear cart
            </button>
          )}
        </div>

        {/* One-store-per-order warning */}
        {multiVendor && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            backgroundColor: '#FFF7ED', border: '1px solid #FED7AA',
            borderRadius: 10, padding: '12px 14px', marginBottom: 16,
            fontSize: 13, color: '#9A3412', lineHeight: 1.5,
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              Your cart has items from {vendorIds.size} different stores. You can only order from
              one store at a time. Use <strong>Save for later</strong> on the items you want to buy another time.
            </span>
          </div>
        )}

        {/* Items that need attention */}
        {problems.length > 0 && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'flex-start',
            backgroundColor: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 10, padding: '12px 14px', marginBottom: 16,
            fontSize: 13, color: '#B91C1C', lineHeight: 1.5,
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <span>
              {problems.length === 1 ? 'One item needs' : `${problems.length} items need`} your attention
              before you can check out. Lower the quantity, remove it, or save it for later.
            </span>
          </div>
        )}

        {/* Layout — stack on mobile */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile || items.length === 0 ? '1fr' : '1fr 360px',
          gap: 20, alignItems: 'start',
        }}>

          {/* Left column: cart items, then saved for later */}
          <div>
            {items.length === 0 ? (
              <div style={{
                backgroundColor: 'white', borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--gray-border)', padding: '28px 20px',
                textAlign: 'center', marginBottom: 24,
              }}>
                <p style={{ fontSize: 15, fontWeight: 800, margin: '0 0 6px' }}>Your cart is empty</p>
                <p style={{ fontSize: 13, color: 'var(--gray-muted)', margin: '0 0 16px' }}>
                  Move something back from your saved items below, or keep browsing.
                </p>
                <button
                  onClick={() => navigate('/marketplace')}
                  style={{
                    padding: '11px 22px', backgroundColor: 'var(--charcoal)', color: 'white',
                    border: 'none', borderRadius: 'var(--radius-pill)',
                    fontWeight: 700, fontSize: 12, letterSpacing: '0.06em', cursor: 'pointer',
                  }}
                >
                  BROWSE MARKETPLACE
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
                {items.map(item => {
                  const problem = problemOf(item)
                  const atMax = typeof item.stock === 'number' && item.qty >= item.stock
                  const dimmed = item.unavailable || (typeof item.stock === 'number' && item.stock <= 0)

                  return (
                    <div key={item.key} style={{
                      backgroundColor: 'white',
                      borderRadius: 'var(--radius-lg)',
                      padding: isMobile ? '14px' : '16px',
                      display: 'flex', alignItems: 'center',
                      gap: isMobile ? 12 : 16,
                      border: `1px solid ${problem ? '#FECACA' : 'var(--gray-border)'}`,
                    }}>
                      {/* Image (tap to see details) */}
                      <img
                        src={item.images?.[0] || item.img || FALLBACK_IMG}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        onClick={() => setViewing(item)}
                        onError={e => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = FALLBACK_IMG
                        }}
                        style={{
                          width: isMobile ? 64 : 80,
                          height: isMobile ? 64 : 80,
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          flexShrink: 0,
                          cursor: 'pointer',
                          opacity: dimmed ? 0.5 : 1,
                        }}
                      />

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div onClick={() => setViewing(item)} style={{ cursor: 'pointer' }}>
                          <p style={{
                            fontSize: 9, color: 'var(--gray-muted)',
                            letterSpacing: '0.06em', marginBottom: 2,
                          }}>
                            {item.vendor?.storeName || item.tag || ''}
                          </p>
                          <p style={{
                            fontSize: isMobile ? 13 : 15,
                            fontWeight: 800, marginBottom: 2,
                            letterSpacing: '-0.2px',
                            whiteSpace: 'nowrap', overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {item.name.toUpperCase()}
                          </p>
                          {item.unitLabel && (
                            <p style={{ fontSize: 11, color: '#7F766B', fontWeight: 600, margin: '0 0 4px' }}>
                              {item.unitLabel} · ₦{item.price.toLocaleString()} each
                            </p>
                          )}
                          <p style={{
                            fontSize: isMobile ? 14 : 16,
                            fontWeight: 900, color: 'var(--amber)', margin: 0,
                          }}>
                            ₦{(item.price * item.qty).toLocaleString()}
                          </p>
                        </div>

                        {item.priceWas && item.priceWas !== item.price && (
                          <p style={{
                            fontSize: 11, fontWeight: 700, margin: '4px 0 0',
                            color: item.price < item.priceWas ? '#16A34A' : '#B45309',
                          }}>
                            Price {item.price < item.priceWas ? 'dropped' : 'went up'}: was ₦{item.priceWas.toLocaleString()}
                          </p>
                        )}

                        {problem && (
                          <p style={{ fontSize: 11, fontWeight: 800, color: '#DC2626', margin: '4px 0 0' }}>
                            {problem}
                          </p>
                        )}

                        <button
                          onClick={() => saveForLater(item.key)}
                          style={{ ...linkBtn, marginTop: 8 }}
                        >
                          <Bookmark size={12} /> Save for later
                        </button>
                      </div>

                      {/* Qty + remove */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <button
                          onClick={() => removeItem(item.key)}
                          aria-label={`Remove ${item.name}`}
                          style={{
                            background: 'none', border: 'none',
                            cursor: 'pointer', color: 'var(--gray-muted)',
                            display: 'flex', padding: 2,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.color = '#E74C3C' }}
                          onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray-muted)' }}
                        >
                          <Trash2 size={14} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <button
                            onClick={() => updateQty(item.key, item.qty - 1)}
                            aria-label="Decrease quantity"
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
                            onClick={() => !atMax && updateQty(item.key, item.qty + 1)}
                            disabled={atMax}
                            aria-label="Increase quantity"
                            style={{
                              width: 28, height: 28, borderRadius: '50%',
                              border: '1.5px solid var(--gray-border)',
                              backgroundColor: 'white',
                              cursor: atMax ? 'not-allowed' : 'pointer',
                              opacity: atMax ? 0.4 : 1,
                              display: 'flex', alignItems: 'center',
                              justifyContent: 'center', color: 'var(--charcoal)',
                            }}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Saved for later */}
            {saved.length > 0 && (
              <div>
                <h2 style={{
                  fontSize: 12, fontWeight: 900, letterSpacing: '0.08em',
                  color: '#7F766B', margin: '0 0 10px',
                }}>
                  SAVED FOR LATER ({saved.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {saved.map(item => (
                    <div key={item.key} style={{
                      backgroundColor: '#FBFAF8',
                      borderRadius: 'var(--radius-lg)',
                      padding: isMobile ? '12px' : '14px 16px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      border: '1px dashed var(--gray-border)',
                    }}>
                      <img
                        src={item.images?.[0] || item.img || FALLBACK_IMG}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        onClick={() => setViewing(item)}
                        onError={e => {
                          e.currentTarget.onerror = null
                          e.currentTarget.src = FALLBACK_IMG
                        }}
                        style={{
                          width: 52, height: 52, objectFit: 'cover',
                          borderRadius: 'var(--radius-md)', flexShrink: 0, cursor: 'pointer',
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                          fontSize: 13, fontWeight: 800, margin: '0 0 2px',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {item.name}
                        </p>
                        <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>
                          {item.unitLabel ? `${item.unitLabel} · ` : ''}×{item.qty} · ₦{(item.price * item.qty).toLocaleString()}
                        </p>
                        <p style={{ fontSize: 10, color: '#9C9488', margin: '2px 0 0' }}>
                          {item.vendor?.storeName || ''}
                        </p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                        <button onClick={() => moveToCart(item.key)} style={linkBtn}>
                          <ShoppingBag size={12} /> Move to cart
                        </button>
                        <button
                          onClick={() => removeSaved(item.key)}
                          style={{ ...linkBtn, color: '#9C9488' }}
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          {items.length > 0 && (
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
                  { label: `Subtotal (${items.length} item${items.length === 1 ? '' : 's'})`, value: `₦${subtotal.toLocaleString()}` },
                  { label: 'Delivery fee', value: `₦${delivery.toLocaleString()}` },
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
                🔒 Your payment is held in escrow and released only after you confirm delivery.
              </div>

              <button
                onClick={goToCheckout}
                disabled={!canCheckout}
                style={{
                  width: '100%', padding: '14px',
                  backgroundColor: 'var(--charcoal)', color: 'white',
                  border: 'none', borderRadius: 'var(--radius-md)',
                  fontWeight: 700, fontSize: 13,
                  letterSpacing: '0.08em',
                  cursor: canCheckout ? 'pointer' : 'not-allowed',
                  opacity: canCheckout ? 1 : 0.5,
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
          )}
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
              Total ({items.length} item{items.length === 1 ? '' : 's'})
            </p>
            <p style={{ fontSize: 18, fontWeight: 900, color: 'var(--amber)', margin: 0 }}>
              ₦{total.toLocaleString()}
            </p>
          </div>
          <button
            onClick={goToCheckout}
            disabled={!canCheckout}
            style={{
              flex: 1, maxWidth: 200,
              padding: '13px',
              backgroundColor: 'var(--charcoal)', color: 'white',
              border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 13,
              letterSpacing: '0.06em',
              cursor: canCheckout ? 'pointer' : 'not-allowed',
              opacity: canCheckout ? 1 : 0.5,
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 6,
            }}
          >
            CHECKOUT <ArrowRight size={15} />
          </button>
        </div>
      )}

      {/* Product details popup */}
      <ProductModal
        product={viewing ? popupProduct(viewing) : null}
        isOpen={!!viewing}
        onClose={() => setViewing(null)}
      />

      <Footer />
    </div>
  )
}