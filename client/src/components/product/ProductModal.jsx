import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, MapPin, Store, Check, Minus, Plus, ShoppingBag, ShieldCheck, ArrowLeft } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import UnitPicker from './UnitPicker'
import DealCountdown from './DealCountdown'

const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
      <rect width="100%" height="100%" fill="#F0D9C0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="32" fill="#BE864B"
            text-anchor="middle" dominant-baseline="middle">No image yet</text>
    </svg>`
  )

function Stepper({ quantity, setQuantity, max, disabled, compact }) {
  const canMinus = quantity > 1 && !disabled
  const canPlus = !disabled && (max <= 0 ? true : quantity < max)
  const size = 32

  const btn = (enabled, bg) => ({
    width: size, height: size, borderRadius: 6, border: 'none',
    backgroundColor: bg,
    color: enabled ? '#1D1D1D' : '#C8B89A',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: enabled ? 'pointer' : 'not-allowed',
  })

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      backgroundColor: compact ? '#FAF8F5' : 'white',
      border: '1.5px solid #E5DFD5',
      borderRadius: compact ? 8 : 10,
      padding: compact ? 2 : 4,
    }}>
      <button
        onClick={() => setQuantity(q => Math.max(1, q - 1))}
        disabled={!canMinus}
        aria-label="Decrease quantity"
        style={btn(canMinus, compact || !canMinus ? 'transparent' : '#F0EDE8')}
      >
        <Minus size={14} />
      </button>
      <span style={{
        minWidth: compact ? 28 : 36, textAlign: 'center',
        fontSize: compact ? 13 : 14, fontWeight: 800, color: '#1D1D1D',
      }}>
        {quantity}
      </span>
      <button
        onClick={() => setQuantity(q => (max > 0 ? Math.min(max, q + 1) : q + 1))}
        disabled={!canPlus}
        aria-label="Increase quantity"
        style={btn(canPlus, compact ? 'transparent' : '#F0EDE8')}
      >
        <Plus size={14} />
      </button>
    </div>
  )
}

function AddButton({ isAdded, isOutOfStock, total, onClick, compact }) {
  return (
    <button
      onClick={onClick}
      disabled={isOutOfStock}
      style={{
        flex: 1,
        padding: compact ? '12px 14px' : '13px 20px',
        backgroundColor: isAdded ? '#16A34A' : isOutOfStock ? '#DCD6CD' : '#1D1D1D',
        color: 'white', border: 'none',
        borderRadius: compact ? 8 : 10,
        fontWeight: 800, fontSize: compact ? 12 : 13,
        letterSpacing: '0.03em',
        cursor: isOutOfStock ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: compact ? 6 : 8,
        transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
      }}
      onMouseEnter={e => {
        if (!isAdded && !isOutOfStock) e.currentTarget.style.backgroundColor = '#BE864B'
      }}
      onMouseLeave={e => {
        if (!isAdded && !isOutOfStock) e.currentTarget.style.backgroundColor = '#1D1D1D'
      }}
    >
      {isAdded ? (
        <><Check size={compact ? 16 : 18} /> {compact ? 'ADDED' : 'ADDED TO CART'}</>
      ) : isOutOfStock ? (
        'OUT OF STOCK'
      ) : (
        <><ShoppingBag size={compact ? 15 : 16} /> {compact ? 'ADD' : 'ADD TO CART'} — ₦{total.toLocaleString()}</>
      )}
    </button>
  )
}

// onBack        : shows a "← All sellers" button (used when coming from the sellers list)
// deliveryNote  : one line under the store name, e.g. "📍 1.2 km from Awo Hall · 🚚 Delivery ₦300"
// initialUnitKey: lowercase option name to pre-select (e.g. "carton")
export default function ProductModal({ product, isOpen, onClose, onBack, deliveryNote, initialUnitKey }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const addItem = useCartStore(s => s.addItem)

  const [selectedImgIdx, setSelectedImgIdx] = useState(0)
  const [selectedUnitId, setSelectedUnitId] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [isAdded, setIsAdded] = useState(false)

  // Reset state when the product changes or the modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImgIdx(0)
      setQuantity(1)
      setIsAdded(false)

      const list = Array.isArray(product?.units) ? product.units : []
      const preferred = initialUnitKey
        ? list.find(u => u.stock > 0 && String(u.label).trim().toLowerCase() === initialUnitKey)
        : null
      // Otherwise start on an option that is on deal, then the first one in stock
      const first = preferred
        || list.find(u => u.onDeal && u.stock > 0)
        || list.find(u => u.stock > 0)
        || list[0]
      setSelectedUnitId(first?.id ?? null)

      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, product, initialUnitKey])

  // ESC key to close
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape' && isOpen) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen || !product) return null

  // Ways to buy. Demo products have none, so they fall back to their own price.
  const units = Array.isArray(product.units) && product.units.length > 0 ? product.units : null
  const unit = units
    ? (units.find(u => u.id === selectedUnitId) || units.find(u => u.stock > 0) || units[0])
    : null

  const price = unit ? unit.price : product.price
  const comparePrice = unit ? unit.comparePrice : product.comparePrice
  const onDeal = !!unit?.onDeal

  const stockCount = unit
    ? unit.stock
    : (product.stock !== undefined && product.stock !== null ? product.stock : (product.sellers ? 10 : 0))
  const isOutOfStock = stockCount <= 0

  const images = product.images && product.images.length > 0
    ? product.images
    : product.img ? [product.img] : [FALLBACK_IMG]
  const activeImage = images[selectedImgIdx] || images[0]

  const vendorName = product.vendor?.storeName || product.tag || 'Campus Vendor'
  const vendorId = product.vendorId || product.vendor?.id
  const vendorHall = product.vendor?.hall || 'OAU Campus'

  const places = Array.isArray(product.availableHalls) ? product.availableHalls : []

  const discountPercent = comparePrice && comparePrice > price
    ? Math.round((1 - price / comparePrice) * 100)
    : null

  const totalPrice = price * quantity

  function pickUnit(id) {
    setSelectedUnitId(id)
    setQuantity(1)
    setIsAdded(false)
  }

  function handleAddToCart() {
    if (isOutOfStock) return
    addItem(product, quantity, unit)
    setIsAdded(true)
    setTimeout(() => setIsAdded(false), 1500)
  }

  function handleVendorClick(e) {
    e.stopPropagation()
    onClose()
    navigate(vendorId ? `/vendor/${vendorId}` : '/marketplace')
  }

  const label = { fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: '#9C9488', margin: '0 0 2px' }
  const heading = { fontSize: 11, fontWeight: 800, letterSpacing: '0.06em', color: '#1D1D1D' }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
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
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
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
          display: 'flex', flexDirection: 'column',
          position: 'relative',
          border: '1px solid rgba(0,0,0,0.08)',
          animation: isMobile
            ? 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            : 'popIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Mobile drag indicator */}
        {isMobile && (
          <div style={{
            width: '100%', padding: '12px 0 6px',
            display: 'flex', justifyContent: 'center',
            backgroundColor: '#FAF8F5', flexShrink: 0,
          }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, backgroundColor: '#DCD6CD' }} />
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close product details"
          style={{
            position: 'absolute',
            top: isMobile ? 12 : 16, right: isMobile ? 12 : 16,
            zIndex: 10, width: 36, height: 36, borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#1D1D1D',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}
        >
          <X size={18} />
        </button>

        {/* Scrollable content */}
        <div style={{
          overflowY: 'auto', flex: 1,
          padding: isMobile ? '8px 16px 24px' : '28px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
          gap: isMobile ? 16 : 28,
        }}>

          {/* Left: images */}
          <div>
            {onBack && (
              <button
                onClick={onBack}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 800, color: '#BE864B',
                  fontFamily: 'Inter, sans-serif', padding: '0 0 10px',
                }}
              >
                <ArrowLeft size={14} /> All sellers
              </button>
            )}

            <div style={{
              position: 'relative', borderRadius: 14, overflow: 'hidden',
              backgroundColor: '#F0EDE8', aspectRatio: '1',
              border: '1px solid rgba(0,0,0,0.06)',
            }}>
              <img
                src={activeImage}
                alt={product.name}
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                onError={e => {
                  e.currentTarget.onerror = null
                  e.currentTarget.src = FALLBACK_IMG
                }}
              />

              <div style={{
                position: 'absolute', top: 10, left: 10,
                display: 'flex', flexDirection: 'column', gap: 6,
              }}>
                {onDeal && (
                  <span style={{
                    backgroundColor: '#C2410C', color: 'white',
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.08em',
                    padding: '4px 8px', borderRadius: 6,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  }}>
                    🔥 SPECIAL DEAL
                  </span>
                )}
                {discountPercent && (
                  <span style={{
                    backgroundColor: '#1D1D1D', color: 'white',
                    fontSize: 11, fontWeight: 800, letterSpacing: '0.06em',
                    padding: '4px 8px', borderRadius: 6,
                  }}>
                    {discountPercent}% OFF
                  </span>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4 }}>
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImgIdx(idx)}
                    style={{
                      width: 52, height: 52, borderRadius: 8, overflow: 'hidden',
                      border: selectedImgIdx === idx ? '2px solid #BE864B' : '1px solid #E4DDD3',
                      padding: 0, cursor: 'pointer', backgroundColor: '#F0EDE8',
                      flexShrink: 0, opacity: selectedImgIdx === idx ? 1 : 0.6,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <img src={img} alt="" referrerPolicy="no-referrer" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: details */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>

            {/* Vendor */}
            <div
              onClick={handleVendorClick}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                backgroundColor: 'white', border: '1px solid #E5DFD5',
                borderRadius: 8, padding: '6px 12px', marginBottom: deliveryNote ? 6 : 12,
                cursor: 'pointer', width: 'fit-content',
                transition: 'border-color 0.15s', flexWrap: 'wrap',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#BE864B' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5DFD5' }}
            >
              <Store size={14} color="#BE864B" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1D' }}>{vendorName}</span>
              <span style={{ fontSize: 11, color: '#9C9488' }}>• {vendorHall}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#BE864B', marginLeft: 4 }}>
                View Store →
              </span>
            </div>

            {deliveryNote && (
              <p style={{ fontSize: 12, color: '#5A5550', fontWeight: 600, margin: '0 0 12px', lineHeight: 1.5 }}>
                {deliveryNote}
              </p>
            )}

            {/* Title */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                  color: '#BE864B', backgroundColor: '#F7EFE5',
                  padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase',
                }}>
                  {product.category || 'MARKETPLACE'}
                </span>
                {!units && product.unit && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, color: '#7F766B',
                    backgroundColor: '#EFECE6', padding: '3px 8px', borderRadius: 4,
                  }}>
                    {product.unit}
                  </span>
                )}
              </div>
              <h2 style={{
                fontSize: isMobile ? 18 : 22, fontWeight: 900, color: '#1D1D1D',
                letterSpacing: '-0.4px', lineHeight: 1.25, margin: 0,
              }}>
                {product.name}
              </h2>
            </div>

            {/* Option picker (only when there is more than one) */}
            <UnitPicker units={units} selectedId={unit?.id} onSelect={pickUnit} />

            {/* Price & stock */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              backgroundColor: onDeal ? '#FFF7ED' : 'white',
              padding: '12px 16px', borderRadius: 12,
              border: `1px solid ${onDeal ? '#FDBA74' : '#E5DFD5'}`,
              marginBottom: 16, gap: 10,
            }}>
              <div>
                <p style={label}>PRICE{unit ? ` PER ${unit.label.toUpperCase()}` : ''}</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: isMobile ? 20 : 24, fontWeight: 900, color: onDeal ? '#C2410C' : '#BE864B' }}>
                    ₦{price.toLocaleString()}
                  </span>
                  {comparePrice && comparePrice > price && (
                    <span style={{ fontSize: 13, color: '#9C9488', textDecoration: 'line-through' }}>
                      ₦{comparePrice.toLocaleString()}
                    </span>
                  )}
                </div>
                {onDeal && unit.dealEndsAt && (
                  <div style={{ marginTop: 6 }}>
                    <DealCountdown endsAt={unit.dealEndsAt} />
                  </div>
                )}
              </div>

              <div style={{ textAlign: 'right' }}>
                <p style={label}>AVAILABILITY</p>
                {isOutOfStock ? (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: '#DC2626',
                    backgroundColor: '#FEE2E2', padding: '4px 10px', borderRadius: 20,
                  }}>
                    Out of Stock
                  </span>
                ) : (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    fontSize: 11, fontWeight: 700, color: '#16A34A',
                    backgroundColor: '#DCFCE7', padding: '4px 10px', borderRadius: 20,
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#16A34A' }} />
                    {stockCount} {unit ? unit.label.toLowerCase() : ''} available
                  </span>
                )}
              </div>
            </div>

            {/* Delivery areas */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <MapPin size={13} color="#BE864B" />
                <span style={heading}>DELIVERY AREAS</span>
              </div>
              {places.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {places.map(place => (
                    <span
                      key={place}
                      style={{
                        fontSize: 11, fontWeight: 600, color: '#5A5550',
                        backgroundColor: 'white', border: '1px solid #E5DFD5',
                        padding: '4px 10px', borderRadius: 20,
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      📍 {place}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{
                  fontSize: 12, color: '#16A34A', backgroundColor: '#F0FDF4',
                  border: '1px solid #DCFCE7', borderRadius: 8, padding: '8px 12px',
                  margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <ShieldCheck size={14} color="#16A34A" />
                  Delivered to all of this store's delivery areas.
                </p>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 20, flex: 1 }}>
              <span style={{ ...heading, display: 'block', marginBottom: 6 }}>DESCRIPTION</span>
              <p style={{
                fontSize: 13, color: '#5A5550', lineHeight: 1.6, margin: 0,
                backgroundColor: 'white', padding: '12px 14px', borderRadius: 10,
                border: '1px solid #E5DFD5', whiteSpace: 'pre-line',
              }}>
                {product.description || 'Fresh, authentic campus product sourced directly from verified vendors. Order with confidence with escrow payment protection.'}
              </p>
            </div>

            {/* Desktop actions */}
            {!isMobile && (
              <div style={{
                display: 'flex', gap: 12, alignItems: 'center',
                paddingTop: 14, borderTop: '1px solid #E5DFD5', marginTop: 'auto',
              }}>
                <Stepper
                  quantity={quantity} setQuantity={setQuantity}
                  max={stockCount} disabled={isOutOfStock}
                />
                <AddButton
                  isAdded={isAdded} isOutOfStock={isOutOfStock}
                  total={totalPrice} onClick={handleAddToCart}
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile sticky bottom bar */}
        {isMobile && (
          <div style={{
            padding: '12px 16px 20px', backgroundColor: 'white',
            borderTop: '1px solid #E5DFD5',
            display: 'flex', gap: 10, alignItems: 'center',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.05)', flexShrink: 0,
          }}>
            <Stepper
              quantity={quantity} setQuantity={setQuantity}
              max={stockCount} disabled={isOutOfStock} compact
            />
            <AddButton
              isAdded={isAdded} isOutOfStock={isOutOfStock}
              total={totalPrice} onClick={handleAddToCart} compact
            />
          </div>
        )}
      </div>
    </div>
  )
}