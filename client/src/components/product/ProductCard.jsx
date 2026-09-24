import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useCartStore from '../../store/cartStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import ProductModal from './ProductModal'

export default function ProductCard({ product, onSelectProduct }) {
  const addItem = useCartStore(s => s.addItem)
  const isMobile = useIsMobile()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [added, setAdded] = useState(false)

  if (!product) return null

  // Support both mock (product.img) and real DB (product.images array)
  const image = product.img ||
    product.images?.[0] ||
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'

  // Support both mock (product.tag) and real DB (product.unit or vendor name)
  const tag = product.tag ||
    product.unit ||
    product.vendor?.storeName ||
    'CAMPUS VENDOR'

  // Support both mock (product.sellers) and real DB (product.stock)
  const badge = product.sellers
    ? `${product.sellers} SELLERS`
    : product.flashDeal
      ? 'FLASH DEAL'
      : product.comparePrice
        ? `${Math.round((1 - product.price / product.comparePrice) * 100)}% OFF`
        : null

  // Hall availability label preview
  const availableHallsList = Array.isArray(product.availableHalls) ? product.availableHalls : []
  const hallLabel = availableHallsList.length > 0
    ? (availableHallsList.length === 1 ? `🏛️ ${availableHallsList[0]}` : `🏛️ ${availableHallsList.length} Halls`)
    : '🏛️ All Halls'

  function handleCardClick() {
    if (onSelectProduct) {
      onSelectProduct(product)
    } else {
      setIsModalOpen(true)
    }
  }

  function handleQuickAdd(e) {
    e.stopPropagation()
    addItem(product)
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
            style={{
              width: '100%',
              height: isMobile ? 140 : 190,
              objectFit: 'cover',
              display: 'block',
              backgroundColor: '#F0EDE8',
            }}
            onError={e => {
              e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80'
            }}
          />
          {badge && (
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
          {product.comparePrice && (
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, marginBottom: 4 }}>
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
                {hallLabel}
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
                ₦{product.price.toLocaleString()}
              </span>
              {product.comparePrice && (
                <span style={{
                  fontSize: isMobile ? 11 : 11, color: '#9C9488',
                  textDecoration: 'line-through', marginLeft: 5,
                }}>
                  ₦{product.comparePrice.toLocaleString()}
                </span>
              )}
            </div>
            <button
              onClick={handleQuickAdd}
              aria-label={`Add ${product.name} to cart`}
              style={{
                width: isMobile ? 32 : 36,
                height: isMobile ? 32 : 36,
                borderRadius: '50%',
                backgroundColor: added ? '#16A34A' : 'var(--charcoal, #1D1D1D)',
                color: 'white',
                border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center',
                fontSize: added ? 15 : 18, fontWeight: added ? 800 : 400,
                transform: added ? 'scale(1.18)' : 'scale(1)',
                transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                flexShrink: 0,
                boxShadow: added ? '0 4px 12px rgba(22, 163, 74, 0.4)' : 'none',
              }}
              onMouseEnter={e => {
                if (!added) e.currentTarget.style.backgroundColor = 'var(--amber, #BE864B)'
              }}
              onMouseLeave={e => {
                if (!added) e.currentTarget.style.backgroundColor = 'var(--charcoal, #1D1D1D)'
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