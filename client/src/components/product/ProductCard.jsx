import { useState } from 'react'
import useCartStore from '../../store/cartStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import ProductModal from './ProductModal'

// Inline picture so a missing photo can never fail to load
const FALLBACK_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300">
      <rect width="100%" height="100%" fill="#F0D9C0"/>
      <text x="50%" y="50%" font-family="Arial" font-size="18" fill="#BE864B"
            text-anchor="middle" dominant-baseline="middle">No image yet</text>
    </svg>`
  )

export default function ProductCard({ product, onSelectProduct }) {
  const addItem = useCartStore(s => s.addItem)
  const isMobile = useIsMobile()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [added, setAdded] = useState(false)

  if (!product) return null

  // Ways to buy (Sachet / Pack / Carton ...). Demo products have none.
  const units = Array.isArray(product.units) && product.units.length > 0 ? product.units : null
  const defaultUnit = units ? (units.find(u => u.stock > 0) || units[0]) : null

  const price = defaultUnit ? defaultUnit.price : product.price
  const comparePrice = defaultUnit ? defaultUnit.comparePrice : product.comparePrice

  const soldOut = units
    ? units.every(u => u.stock <= 0)
    : typeof product.stock === 'number' && product.stock <= 0

  // Support both mock (product.img) and real DB (product.images array)
  const image = product.img || product.images?.[0] || FALLBACK_IMG

  // Line above the name: how it is sold
  const tag = units
    ? (units.length === 1
        ? `Per ${units[0].label.toLowerCase()}`
        : units.slice(0, 3).map(u => u.label).join(' · ') + (units.length > 3 ? ' …' : ''))
    : (product.tag || product.unit || product.vendor?.storeName || 'CAMPUS VENDOR')

  const badge = product.sellers
    ? `${product.sellers} SELLERS`
    : product.flashDeal
      ? 'FLASH DEAL'
      : comparePrice && comparePrice > price
        ? `${Math.round((1 - price / comparePrice) * 100)}% OFF`
        : null

  // Where this can be delivered
  const places = Array.isArray(product.availableHalls) ? product.availableHalls : []
  const locationLabel = places.length === 0
    ? '📍 All areas'
    : places.length === 1
      ? `📍 ${places[0]}`
      : `📍 ${places.length} places`

  function handleCardClick() {
    if (onSelectProduct) onSelectProduct(product)
    else setIsModalOpen(true)
  }

  function handleQuickAdd(e) {
    e.stopPropagation()
    if (soldOut) return

    // Several options: the buyer has to choose one first
    if (units && units.length > 1) {
      handleCardClick()
      return
    }

    addItem(product, 1, defaultUnit)
    setAdded(true)
    setTimeout(() => setAdded(false), 1200)
  }

  return (
    <>
      <div
        onClick={handleCardClick}
        style={{
          backgroundColor: 'white',
          borderRadius: 'var(--radius-lg, 12px)',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'transform 0.15s, box-shadow 0.15s',
          border: '1px solid rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-3px)'
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <img
            src={image}
            alt={product.name}
            referrerPolicy="no-referrer"
            style={{
              width: '100%',
              height: isMobile ? 140 : 190,
              objectFit: 'cover',
              display: 'block',
              backgroundColor: '#F0EDE8',
              opacity: soldOut ? 0.55 : 1,
            }}
            onError={e => {
              e.currentTarget.onerror = null
              e.currentTarget.src = FALLBACK_IMG
            }}
          />

          {soldOut ? (
            <span style={{
              position: 'absolute', top: 8, left: 8,
              backgroundColor: '#DC2626', color: 'white',
              fontSize: isMobile ? 10 : 11, fontWeight: 800,
              letterSpacing: '0.06em', padding: '3px 8px', borderRadius: 20,
            }}>
              SOLD OUT
            </span>
          ) : badge && (
            <span style={{
              position: 'absolute', top: 8, left: 8,
              backgroundColor: product.flashDeal ? '#BE864B' : 'rgba(0,0,0,0.72)',
              color: 'white',
              fontSize: isMobile ? 10 : 11,
              fontWeight: 700, letterSpacing: '0.06em',
              padding: '3px 8px',
              borderRadius: 20,
            }}>
              {badge}
            </span>
          )}

          {!soldOut && comparePrice && comparePrice > price && (
            <span style={{
              position: 'absolute', top: 8, right: 8,
              backgroundColor: '#BE864B', color: 'white',
              fontSize: isMobile ? 10 : 11, fontWeight: 800, letterSpacing: '0.06em',
              padding: '3px 7px', borderRadius: 4,
            }}>
              SALE
            </span>
          )}
        </div>

        {/* Info */}
        <div style={{
          padding: isMobile ? '12px 12px 14px' : '14px 16px 18px',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', gap: 6, marginBottom: 4,
            }}>
              <p style={{
                fontSize: isMobile ? 10 : 11,
                color: 'var(--gray-muted, #9C9488)',
                letterSpacing: '0.07em',
                fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                margin: 0,
              }}>
                {tag.toUpperCase()}
              </p>
              <span style={{
                fontSize: isMobile ? 10 : 11,
                color: '#BE864B',
                fontWeight: 700,
                backgroundColor: '#FAF4EB',
                padding: '2px 6px',
                borderRadius: 4,
                whiteSpace: 'nowrap',
              }}>
                {locationLabel}
              </span>
            </div>
            <p style={{
              fontSize: isMobile ? 13 : 14,
              fontWeight: 800, letterSpacing: '-0.2px',
              marginBottom: isMobile ? 8 : 12,
              lineHeight: 1.3,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              color: '#1D1D1D',
            }}>
              {product.name.toUpperCase()}
            </p>
          </div>

          <div style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'auto',
          }}>
            <div>
              <span style={{
                fontSize: isMobile ? 15 : 18,
                fontWeight: 900, color: 'var(--amber, #BE864B)',
              }}>
                ₦{price.toLocaleString()}
              </span>
              {defaultUnit && (
                <span style={{ fontSize: 11, color: '#9C9488', marginLeft: 4 }}>
                  / {defaultUnit.label.toLowerCase()}
                </span>
              )}
              {comparePrice && comparePrice > price && (
                <span style={{
                  fontSize: 11, color: '#9C9488',
                  textDecoration: 'line-through', marginLeft: 5,
                }}>
                  ₦{comparePrice.toLocaleString()}
                </span>
              )}
              {units && units.length > 1 && (
                <p style={{ fontSize: 10, color: '#BE864B', fontWeight: 700, margin: '2px 0 0' }}>
                  {units.length} sizes available
                </p>
              )}
            </div>
            <button
              onClick={handleQuickAdd}
              disabled={soldOut}
              aria-label={`Add ${product.name} to cart`}
              style={{
                width: isMobile ? 32 : 36,
                height: isMobile ? 32 : 36,
                borderRadius: '50%',
                backgroundColor: soldOut ? '#DCD6CD' : added ? '#16A34A' : 'var(--charcoal, #1D1D1D)',
                color: 'white',
                border: 'none', cursor: soldOut ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: added ? 15 : 18, fontWeight: added ? 800 : 400,
                transform: added ? 'scale(1.18)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                flexShrink: 0,
                boxShadow: added ? '0 4px 12px rgba(22, 163, 74, 0.4)' : 'none',
              }}
              onMouseEnter={e => {
                if (!added && !soldOut) e.currentTarget.style.backgroundColor = 'var(--amber, #BE864B)'
              }}
              onMouseLeave={e => {
                if (!added && !soldOut) e.currentTarget.style.backgroundColor = 'var(--charcoal, #1D1D1D)'
              }}
            >
              {added ? '✓' : '+'}
            </button>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      {!onSelectProduct && (
        <ProductModal
          product={product}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  )
}