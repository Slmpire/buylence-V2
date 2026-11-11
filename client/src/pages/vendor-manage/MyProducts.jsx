import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Plus, Package } from 'lucide-react'
import VendorLayout from '../../components/vendor/VendorLayout'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const TABS = [
  'All Items', 'Grains & Cereals', 'Proteins & Meat', 'Tubers & Roots',
  'Snacks & Beverages', 'Oils & Spices', 'Bread & Bakery', 'Beverages & Drinks',
]

const STATUS_STYLE = {
  instock:    { label: 'In Stock',     color: '#16A34A', bg: '#F0FDF4', dot: '#16A34A' },
  lowstock:   { label: 'Low Stock',    color: '#D97706', bg: '#FFFBEB', dot: '#D97706' },
  outofstock: { label: 'Out of Stock', color: '#DC2626', bg: '#FEF2F2', dot: '#DC2626' },
}

function getStockStatus(product) {
  // Prefer units array if available
  const units = Array.isArray(product.units) && product.units.length > 0 ? product.units : null
  const totalStock = units
    ? units.filter(u => u.isActive !== false).reduce((s, u) => s + (u.stock || 0), 0)
    : (product.stock ?? 0)

  if (totalStock === 0) return 'outofstock'
  if (totalStock <= 5) return 'lowstock'
  return 'instock'
}

function getPrice(product) {
  const units = Array.isArray(product.units) && product.units.length > 0 ? product.units : null
  if (units) {
    const active = units.filter(u => u.isActive !== false)
    if (active.length === 0) return product.price || 0
    const min = Math.min(...active.map(u => u.price))
    const max = Math.max(...active.map(u => u.price))
    return min === max ? `₦${min.toLocaleString()}` : `₦${min.toLocaleString()} – ₦${max.toLocaleString()}`
  }
  return `₦${(product.price || 0).toLocaleString()}`
}

// ─── Mobile product card ───────────────────────────────────────────────────
function ProductCardMobile({ product, onEdit, onDelete, deleting }) {
  const stockStatus = getStockStatus(product)
  const st = STATUS_STYLE[stockStatus]
  const price = getPrice(product)
  const units = Array.isArray(product.units) && product.units.length > 0 ? product.units : null

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '14px 16px',
      borderBottom: '1px solid rgba(0,0,0,0.05)',
    }}>
      {/* Thumbnail */}
      <div style={{
        width: 52, height: 52, borderRadius: 8, flexShrink: 0,
        overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)',
        backgroundColor: '#F0EDE8',
      }}>
        {product.images?.[0] && (
          <img src={product.images[0]} alt={product.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: 13, fontWeight: 700, margin: '0 0 2px',
          color: '#1D1D1D', overflow: 'hidden',
          whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {product.name}
        </p>
        <p style={{ fontSize: 11, color: '#9C9488', margin: '0 0 6px' }}>
          {product.category}
          {units && units.length > 1 && ` · ${units.length} options`}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Status badge */}
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            backgroundColor: st.bg, color: st.color,
            fontSize: 10, fontWeight: 700,
            padding: '3px 8px', borderRadius: 20,
          }}>
            <span style={{
              width: 5, height: 5, borderRadius: '50%',
              backgroundColor: st.dot, flexShrink: 0,
            }} />
            {st.label}
          </span>

          {/* Price */}
          <span style={{ fontSize: 13, fontWeight: 800, color: '#BE864B' }}>
            {price}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, paddingTop: 2 }}>
        <button
          onClick={() => onEdit(product.id)}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid #E4DDD3', backgroundColor: 'white',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Pencil size={13} color="#7F766B" />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          disabled={deleting === product.id}
          style={{
            width: 32, height: 32, borderRadius: 8,
            border: '1px solid #E4DDD3', backgroundColor: 'white',
            cursor: deleting === product.id ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: deleting === product.id ? 0.4 : 1,
          }}
        >
          <Trash2 size={13} color="#DC2626" />
        </button>
      </div>
    </div>
  )
}

// ─── Desktop table row ─────────────────────────────────────────────────────
function ProductRowDesktop({ product, index, total, onEdit, onDelete, deleting }) {
  const stockStatus = getStockStatus(product)
  const st = STATUS_STYLE[stockStatus]
  const price = getPrice(product)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 80px',
      padding: '14px 20px',
      borderBottom: index < total - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
      alignItems: 'center',
    }}>
      {/* Product details */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 8, flexShrink: 0,
          overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)',
          backgroundColor: '#F0EDE8',
        }}>
          {product.images?.[0] && (
            <img src={product.images[0]} alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>
            {product.name}
          </p>
          <p style={{ fontSize: 10, color: '#9C9488', margin: 0, letterSpacing: '0.04em' }}>
            {product.sku || `SKU: ${product.id.slice(0, 8).toUpperCase()}`}
          </p>
        </div>
      </div>

      {/* Category */}
      <p style={{
        fontSize: 12, color: '#7F766B', margin: 0,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {product.category}
      </p>

      {/* Status */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          backgroundColor: st.bg, color: st.color,
          fontSize: 10, fontWeight: 700,
          padding: '3px 8px', borderRadius: 20,
          whiteSpace: 'nowrap',
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            backgroundColor: st.dot, flexShrink: 0,
          }} />
          {st.label}
        </span>
      </div>

      {/* Price */}
      <p style={{ fontSize: 13, fontWeight: 700, color: '#BE864B', margin: 0 }}>
        {price}
      </p>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={() => onEdit(product.id)}
          title="Edit product"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9C9488', display: 'flex', padding: 4, borderRadius: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#BE864B'}
          onMouseLeave={e => e.currentTarget.style.color = '#9C9488'}
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={() => onDelete(product.id)}
          disabled={deleting === product.id}
          title="Delete product"
          style={{
            background: 'none', border: 'none',
            cursor: deleting === product.id ? 'not-allowed' : 'pointer',
            color: deleting === product.id ? '#E4DDD3' : '#9C9488',
            display: 'flex', padding: 4, borderRadius: 6,
          }}
          onMouseEnter={e => { if (deleting !== product.id) e.currentTarget.style.color = '#DC2626' }}
          onMouseLeave={e => { if (deleting !== product.id) e.currentTarget.style.color = '#9C9488' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────
export default function MyProducts() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState('All Items')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchProducts() }, [])

  async function fetchProducts() {
    setLoading(true)
    try {
      const res = await api.get('/products/mine')
      setProducts(res.data.products || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function deleteProduct(id) {
    if (!window.confirm('Remove this product from your store?')) return
    setDeleting(id)
    try {
      await api.delete(`/products/${id}`)
      setProducts(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error(err)
      alert('Failed to delete product.')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = activeTab === 'All Items'
    ? products
    : products.filter(p => p.category === activeTab)

  const inStock  = products.filter(p => getStockStatus(p) === 'instock').length
  const lowOut   = products.filter(p => getStockStatus(p) !== 'instock').length

  return (
    <VendorLayout searchPlaceholder="Search inventory...">

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: isMobile ? 'center' : 'flex-start',
        gap: 12, marginBottom: isMobile ? 16 : 24,
      }}>
        <div>
          <h1 style={{
            fontSize: isMobile ? 20 : 24, fontWeight: 900,
            margin: '0 0 4px', color: '#1D1D1D', letterSpacing: '-0.3px',
          }}>
            {isMobile ? 'My Products' : 'Product Management'}
          </h1>
          {!isMobile && (
            <p style={{ fontSize: 13, color: '#7F766B', margin: 0 }}>
              Manage your campus store products.
            </p>
          )}
        </div>
        <button
          onClick={() => navigate('/vendor/products/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: isMobile ? '9px 14px' : '10px 18px',
            background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
            color: 'white', border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif',
            flexShrink: 0, whiteSpace: 'nowrap',
          }}
        >
          <Plus size={14} />
          {isMobile ? 'Add' : 'Add New Product'}
        </button>
      </div>

      {/* ── Category tabs (scrollable) ── */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 16,
        overflowX: 'auto', scrollbarWidth: 'none',
        WebkitOverflowScrolling: 'touch',
        paddingBottom: 2,
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 14px', borderRadius: 20,
              border: `1.5px solid ${activeTab === tab ? 'transparent' : '#E4DDD3'}`,
              backgroundColor: activeTab === tab ? '#BE864B' : 'white',
              color: activeTab === tab ? 'white' : '#7F766B',
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Product list / table ── */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 12,
        overflow: isMobile ? 'visible' : 'hidden',
        marginBottom: 20,
      }}>
        {/* Desktop table header */}
        {!isMobile && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.5fr 1.2fr 1fr 1fr 80px',
            padding: '10px 20px',
            backgroundColor: '#F7F4EF',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}>
            {['Product Details', 'Category', 'Status', 'Price', 'Actions'].map(h => (
              <p key={h} style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                color: '#9C9488', margin: 0,
              }}>
                {h}
              </p>
            ))}
          </div>
        )}

        {/* Mobile column labels */}
        {isMobile && (
          <div style={{
            padding: '10px 16px',
            backgroundColor: '#F7F4EF',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            borderRadius: '12px 12px 0 0',
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', margin: 0 }}>
              {filtered.length} {filtered.length === 1 ? 'PRODUCT' : 'PRODUCTS'}
              {activeTab !== 'All Items' && ` · ${activeTab.toUpperCase()}`}
            </p>
          </div>
        )}

        {/* Body */}
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid #BE864B', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ fontSize: 13, color: '#9C9488' }}>Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{
              width: 56, height: 56, borderRadius: 14, backgroundColor: '#F0EDE8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 14px',
            }}>
              <Package size={24} color="#BE864B" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1D', marginBottom: 6 }}>
              {activeTab === 'All Items' ? 'No products yet' : `No products in ${activeTab}`}
            </p>
            <p style={{ fontSize: 12, color: '#9C9488', marginBottom: 16 }}>
              {activeTab === 'All Items'
                ? 'Add your first product to start selling.'
                : 'Try a different category.'}
            </p>
            {activeTab === 'All Items' && (
              <button
                onClick={() => navigate('/vendor/products/new')}
                style={{
                  padding: '10px 24px', backgroundColor: '#1D1D1D', color: 'white',
                  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                ADD PRODUCT
              </button>
            )}
          </div>
        ) : isMobile ? (
          filtered.map(product => (
            <ProductCardMobile
              key={product.id}
              product={product}
              onEdit={id => navigate(`/vendor/products/edit/${id}`)}
              onDelete={deleteProduct}
              deleting={deleting}
            />
          ))
        ) : (
          filtered.map((product, i) => (
            <ProductRowDesktop
              key={product.id}
              product={product}
              index={i}
              total={filtered.length}
              onEdit={id => navigate(`/vendor/products/edit/${id}`)}
              onDelete={deleteProduct}
              deleting={deleting}
            />
          ))
        )}
      </div>

      {/* ── Bottom insights ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 240px',
        gap: 16,
      }}>
        {/* Store insights */}
        <div style={{
          backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 12, padding: '20px 22px',
        }}>
          <p style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.12em',
            color: '#BE864B', margin: '0 0 6px',
          }}>
            STORE INSIGHTS
          </p>
          <p style={{
            fontSize: isMobile ? 16 : 15, fontWeight: 800,
            color: '#1D1D1D', margin: '0 0 14px', lineHeight: 1.4,
          }}>
            {products.length} {products.length === 1 ? 'product' : 'products'} in your store.
          </p>
          <div style={{ display: 'flex', gap: 28 }}>
            {[
              { label: 'In Stock',  value: inStock },
              { label: 'Low / Out', value: lowOut },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: 10, color: '#9C9488', margin: '0 0 3px', fontWeight: 600 }}>
                  {s.label}
                </p>
                <p style={{ fontSize: 20, fontWeight: 900, color: '#BE864B', margin: 0 }}>
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick tip */}
        <div style={{
          backgroundColor: '#FFF8F2',
          border: '1px solid #F0D9C0',
          borderRadius: 12, padding: '20px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>💡</span>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#1D1D1D' }}>
              Quick Tip
            </p>
          </div>
          <p style={{ fontSize: 12, color: '#7F766B', margin: 0, lineHeight: 1.6 }}>
            Products with photos sell 3× faster. Make sure all your listings have clear images.
          </p>
        </div>
      </div>

    </VendorLayout>
  )
}
