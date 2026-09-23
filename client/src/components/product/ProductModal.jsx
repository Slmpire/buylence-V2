import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, MapPin, Store, Check, Minus, Plus, ShoppingBag, ShieldCheck, Tag, Package } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import { useIsMobile } from '../../hooks/useWindowSize'

export default function ProductModal({ product, isOpen, onClose }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const addItem = useCartStore(s => s.addItem)

  const [selectedImgIdx, setSelectedImgIdx] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)

  // Reset state when product changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImgIdx(0)
      setQuantity(1)
      setIsAdded(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, product])

  // ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  // Normalize image sources
  const images = product.images && product.images.length > 0
    ? product.images
    : product.img
      ? [product.img]
      : ['https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80']

  const activeImage = images[selectedImgIdx] || images[0]

  // Vendor details
  const vendorName = product.vendor?.storeName || product.tag || 'Campus Vendor'
  const vendorId = product.vendorId || product.vendor?.id
  const vendorHall = product.vendor?.hall || 'OAU Campus'

  // Stock status
  const stockCount = product.stock !== undefined && product.stock !== null ? product.stock : (product.sellers ? 10 : 0)
  const isOutOfStock = stockCount <= 0

  // Available halls
  const halls = Array.isArray(product.availableHalls) && product.availableHalls.length > 0
    ? product.availableHalls
    : []

  // Price calculations
  const discountPercent = product.comparePrice && product.comparePrice > product.price
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null

  const totalPrice = product.price * quantity

  function handleAddToCart() {
    if (isOutOfStock) return
    addItem(product, quantity)
    setIsAdded(true)
    setTimeout(() => {
      setIsAdded(false)
    }, 1500)
  }

  function handleVendorClick(e) {
    e.stopPropagation()
    onClose()
    if (vendorId) {
      navigate(`/vendor/${vendorId}`)
    } else {
      navigate('/marketplace')
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: isMobile ? 0 : '24px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* Modal Card / Bottom Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#FAF8F5',
          width: '100%',
          maxWidth: isMobile ? '100%' : 780,
          maxHeight: isMobile ? '88vh' : '90vh',
          borderRadius: isMobile ? '24px 24px 0 0' : 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          border: '1px solid rgba(0,0,0,0.08)',
          animation: isMobile ? 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Mobile Drag Indicator */}
        {isMobile && (
          <div style={{
            width: '100%',
            padding: '12px 0 6px',
            display: 'flex',
            justifyContent: 'center',
            backgroundColor: '#FAF8F5',
            flexShrink: 0,
          }}>
            <div style={{
              width: 38,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#DCD6CD',
            }} />
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close product details"
          style={{
            position: 'absolute',
            top: isMobile ? 12 : 16,
            right: isMobile ? 12 : 16,
            zIndex: 10,
            width: 36,
            height: 36,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#1D1D1D',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'transform 0.15s, backgroundColor 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = '#ffffff'}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.9)'}
        >
          <X size={18} />
        </button>

        {/* Scrollable Modal Content */}
        <div style={{
          overflowY: 'auto',
          flex: 1,
          padding: isMobile ? '8px 16px 24px' : '28px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
          gap: isMobile ? 16 : 28,
        }}>

          {/* Left Column: Image Gallery */}
          <div>
            <div style={{
              position: 'relative',
              borderRadius: 14,
              overflow: 'hidden',
              backgroundColor: '#F0EDE8',
              aspectRatio: '1',
              border: '1px solid rgba(0,0,0,0.06)',
            }}>
              <img
                src={activeImage}
                alt={product.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
                onError={e => {
                  e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80'
                }}
              />

              {/* Discount / Flash Deal Badges */}
              <div style={{
                position: 'absolute',
                top: 10,
                left: 10,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}>
                {product.flashDeal && (
                  <span style={{
                    backgroundColor: '#BE864B',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    padding: '4px 8px',
                    borderRadius: 6,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}>
                    FLASH DEAL
                  </span>
                )}
                {discountPercent && (
                  <span style={{
                    backgroundColor: '#1D1D1D',
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.06em',
                    padding: '4px 8px',
                    borderRadius: 6,
                  }}>
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {/* Thumbnail Selector (if multiple images) */}
            {images.length > 1 && (
              <div style={{
                display: 'flex',
                gap: 8,
                marginTop: 10,
                overflowX: 'auto',
                paddingBottom: 4,
              }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIdx(idx)}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: selectedImgIdx === idx ? '2px solid #BE864B' : '1px solid #E4DDD3',
                      padding: 0,
                      cursor: 'pointer',
                      backgroundColor: '#F0EDE8',
                      flexShrink: 0,
                      opacity: selectedImgIdx === idx ? 1 : 0.6,
                      transition: 'opacity 0.15s, borderColor 0.15s',
                    }}
                  >
                    <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Vendor Banner Header */}
            <div
              onClick={handleVendorClick}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'white',
                border: '1px solid #E5DFD5',
                borderRadius: 8,
                padding: '6px 12px',
                marginBottom: 12,
                cursor: 'pointer',
                width: 'fit-content',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = '#BE864B'}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#E5DFD5'}
            >
              <Store size={14} color="#BE864B" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1D' }}>
                {vendorName}
              </span>
              <span style={{ fontSize: 11, color: '#9C9488' }}>• {vendorHall}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#BE864B', marginLeft: 4 }}>
                View Store →
              </span>
            </div>

            {/* Product Title & Category */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: '#BE864B',
                  backgroundColor: '#F7EFE5',
                  padding: '3px 8px',
                  borderRadius: 4,
                  textTransform: 'uppercase',
                }}>
                  {product.category || 'MARKETPLACE'}
                </span>
                {product.unit && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: '#7F766B',
                    backgroundColor: '#EFECE6',
                    padding: '3px 8px',
                    borderRadius: 4,
                  }}>
                    {product.unit}
                  </span>
                )}
              </div>
              <h2 style={{
                fontSize: isMobile ? 18 : 22,
                fontWeight: 900,
                color: '#1D1D1D',
                letterSpacing: '-0.4px',
                lineHeight: 1.25,
                margin: 0,
              }}>
                {product.name}
              </h2>
            </div>

            {/* Price & Stock Section */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'white',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid #E5DFD5',
              marginBottom: 16,
            }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#9C9488', margin: '0 0 2px' }}>
                  PRICE
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: '#BE864B' }}>
                    ₦{product.price.toLocaleString()}
                  </span>
                  {product.comparePrice && (
                    <span style={{ fontSize: 13, color: '#9C9488', textDecoration: 'line-through' }}>
                      ₦{product.comparePrice.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock Status Badge */}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#9C9488', margin: '0 0 2px' }}>
                  AVAILABILITY
                </p>
                {isOutOfStock ? (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#DC2626',
                    backgroundColor: '#FEE2E2',
                    padding: '4px 10px',
                    borderRadius: 20,
                  }}>
                    Out of Stock
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#16A34A',
                    backgroundColor: '#DCFCE7',
                    padding: '4px 10px',
                    borderRadius: 20,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16A34A' }} />
                    In Stock ({stockCount} available)
                  </span>
                )}
              </div>
            </div>

            {/* Hall Availability Section */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MapPin size={13} color="#BE864B" />
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: '#1D1D1D' }}>
                  HALL DELIVERY AVAILABILITY
                </span>
              </div>
              {halls.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {halls.map(hall => (
                    <span
                      key={hall}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: '#5A5550',
                        backgroundColor: 'white',
                        border: '1px solid #E5DFD5',
                        padding: '4px 10px',
                        borderRadius: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      🏛️ {hall}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{
                  fontSize: 12,
                  color: '#16A34A',
                  backgroundColor: '#F0FDF4',
                  border: '1px solid #DCFCE7',
                  borderRadius: 8,
                  padding: '8px 12px',
                  margin: 0,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <ShieldCheck size={14} color="#16A34A" />
                  Available for gate delivery to ALL residence halls in OAU.
                </p>
              )}
            </div>

            {/* Description Section */}
            <div style={{ marginBottom: 20, flex: 1 }}>
              <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: '#1D1D1D', display: 'block', marginBottom: 6 }}>
                DESCRIPTION
              </span>
              <p style={{
                fontSize: 13,
                color: '#5A5550',
                lineHeight: 1.6,
                margin: 0,
                backgroundColor: 'white',
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #E5DFD5',
                whiteSpace: 'pre-line',
              }}>
                {product.description || 'Fresh, authentic campus product sourced directly from verified OAU vendors. Order with confidence with escrow payment protection.'}
              </p>
            </div>

            {/* Desktop Action Area */}
            {!isMobile && (
              <div style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                paddingTop: 14,
                borderTop: '1px solid #E5DFD5',
                marginTop: 'auto',
              }}>
                {/* Quantity Stepper */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'white',
                  border: '1.5px solid #E5DFD5',
                  borderRadius: 10,
                  padding: '4px',
                }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    disabled={quantity <= 1 || isOutOfStock}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: quantity <= 1 ? 'transparent' : '#F0EDE8',
                      color: quantity <= 1 ? '#C8B89A' : '#1D1D1D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{
                    minWidth: 36,
                    textAlign: 'center',
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#1D1D1D',
                  }}>
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(q => (stockCount ? Math.min(stockCount, q + 1) : q + 1))}
                    disabled={isOutOfStock || (stockCount > 0 && quantity >= stockCount)}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      border: 'none',
                      backgroundColor: '#F0EDE8',
                      color: '#1D1D1D',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add to Cart Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  style={{
                    flex: 1,
                    padding: '13px 20px',
                    backgroundColor: isAdded ? '#16A34A' : isOutOfStock ? '#DCD6CD' : '#1D1D1D',
                    color: 'white',
                    border: 'none',
                    borderRadius: 10,
                    fontWeight: 800,
                    fontSize: 13,
                    letterSpacing: '0.04em',
                    cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif',
                  }}
                  onMouseEnter={e => {
                    if (!isAdded && !isOutOfStock) e.currentTarget.style.backgroundColor = '#BE864B'
                  }}
                  onMouseLeave={e => {
                    if (!isAdded && !isOutOfStock) e.currentTarget.style.backgroundColor = '#1D1D1D'
                  }}
                >
                  {isAdded ? (
                    <>
                      <Check size={18} /> ADDED TO CART
                    </>
                  ) : isOutOfStock ? (
                    'OUT OF STOCK'
                  ) : (
                    <>
                      <ShoppingBag size={16} /> ADD TO CART — ₦{totalPrice.toLocaleString()}
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Sticky Bottom Action Bar */}
        {isMobile && (
          <div style={{
            padding: '12px 16px 20px',
            backgroundColor: 'white',
            borderTop: '1px solid #E5DFD5',
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.05)',
            flexShrink: 0,
          }}>
            {/* Mobile Quantity Stepper */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FAF8F5',
              border: '1.5px solid #E5DFD5',
              borderRadius: 8,
              padding: '2px',
            }}>
              <button
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1 || isOutOfStock}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: quantity <= 1 ? '#C8B89A' : '#1D1D1D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: quantity <= 1 ? 'not-allowed' : 'pointer',
                }}
              >
                <Minus size={14} />
              </button>
              <span style={{
                minWidth: 28,
                textAlign: 'center',
                fontSize: 13,
                fontWeight: 800,
                color: '#1D1D1D',
              }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(q => (stockCount ? Math.min(stockCount, q + 1) : q + 1))}
                disabled={isOutOfStock || (stockCount > 0 && quantity >= stockCount)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#1D1D1D',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Mobile Add to Cart Button */}
            <button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              style={{
                flex: 1,
                padding: '12px 14px',
                backgroundColor: isAdded ? '#16A34A' : isOutOfStock ? '#DCD6CD' : '#1D1D1D',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: '0.02em',
                cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {isAdded ? (
                <>
                  <Check size={16} /> ADDED
                </>
              ) : isOutOfStock ? (
                'OUT OF STOCK'
              ) : (
                <>
                  <ShoppingBag size={15} /> ADD — ₦{totalPrice.toLocaleString()}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
