import { useNavigate } from 'react-router-dom'
import useCartStore from '../../store/cartStore'
import { useIsMobile } from '../../hooks/useWindowSize'

export default function ProductCard({ product }) {
  const addItem = useCartStore(s => s.addItem)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

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

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
        border: '1px solid transparent',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)'
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'
        e.currentTarget.style.borderColor = 'var(--gray-border)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.borderColor = 'transparent'
      }}
    >
      {/* Image */}
      <div
        style={{ position: 'relative' }}
        onClick={() => navigate('/marketplace')}
      >
        <img
          src={image}
          alt={product.name}
          style={{
            width: '100%',
            height: isMobile ? 140 : 190,
            objectFit: 'cover', display: 'block',
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
            fontSize: isMobile ? 8 : 10,
            fontWeight: 700, letterSpacing: '0.06em',
            padding: '3px 7px',
            borderRadius: 'var(--radius-pill)',
          }}>
            {badge}
          </span>
        )}
        {product.comparePrice && (
          <span style={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: '#BE864B', color: 'white',
            fontSize: 8, fontWeight: 800, letterSpacing: '0.06em',
            padding: '3px 7px', borderRadius: 4,
          }}>
            SALE
          </span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: isMobile ? '10px 12px 14px' : '14px 16px 18px' }}>
        <p style={{
          fontSize: isMobile ? 9 : 10,
          color: 'var(--gray-muted)',
          letterSpacing: '0.07em',
          marginBottom: 3, fontWeight: 600,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {tag.toUpperCase()}
        </p>
        <p style={{
          fontSize: isMobile ? 12 : 14,
          fontWeight: 800, letterSpacing: '-0.2px',
          marginBottom: isMobile ? 8 : 12,
          lineHeight: 1.3,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {product.name.toUpperCase()}
        </p>
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <span style={{
              fontSize: isMobile ? 15 : 18,
              fontWeight: 900, color: 'var(--amber)',
            }}>
              ₦{product.price.toLocaleString()}
            </span>
            {product.comparePrice && (
              <span style={{
                fontSize: 10, color: '#9C9488',
                textDecoration: 'line-through', marginLeft: 5,
              }}>
                ₦{product.comparePrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); addItem(product) }}
            style={{
              width: isMobile ? 30 : 34,
              height: isMobile ? 30 : 34,
              borderRadius: '50%',
              backgroundColor: 'var(--charcoal)', color: 'white',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18, fontWeight: 300,
              transition: 'background 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--amber)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--charcoal)'}
          >
            +
          </button>
        </div>
      </div>
    </div>
  )
}