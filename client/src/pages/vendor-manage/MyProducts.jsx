import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2, Plus } from 'lucide-react'
import VendorLayout from '../../components/vendor/VendorLayout'
import api from '../../lib/axios'

const TABS = ['All Items', 'Grains & Cereals', 'Proteins & Meat', 'Tubers & Roots', 'Snacks & Beverages', 'Oils & Spices', 'Bread & Bakery', 'Beverages & Drinks']

const STATUS_STYLE = {
  instock: { label: 'Instock', color: '#16A34A', dot: '#16A34A' },
  lowstock: { label: 'Low Stock', color: '#D97706', dot: '#D97706' },
  outofstock: { label: 'Out of Stock', color: '#DC2626', dot: '#DC2626' },
}

function getStockStatus(stock) {
  if (stock === 0) return 'outofstock'
  if (stock <= 5) return 'lowstock'
  return 'instock'
}

export default function MyProducts() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('All Items')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    fetchProducts()
  }, [])

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
    if (!confirm('Delete this product? This cannot be undone.')) return
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

  return (
    <VendorLayout searchPlaceholder="Search inventory...">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: '#1D1D1D', letterSpacing: '-0.3px' }}>
            Inventory Management
          </h1>
          <p style={{ fontSize: 13, color: '#7F766B', margin: 0, maxWidth: 460 }}>
            Manage your campus store products.
          </p>
        </div>
        <button
          onClick={() => navigate('/vendor/products/new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
            color: 'white', border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            letterSpacing: '0.04em', fontFamily: 'Inter, sans-serif', flexShrink: 0,
          }}
        >
          <Plus size={14} /> Add New Product
        </button>
      </div>

      {/* Category tabs */}
      <div style={{
        display: 'flex', gap: 6, marginBottom: 20,
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '7px 14px', borderRadius: 20,
              border: '1.5px solid',
              borderColor: activeTab === tab ? 'transparent' : '#E4DDD3',
              backgroundColor: activeTab === tab ? '#BE864B' : 'white',
              color: activeTab === tab ? 'white' : '#7F766B',
              fontSize: 11, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
              fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Products table */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 12, overflow: 'hidden',
        marginBottom: 20,
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
          padding: '10px 20px',
          backgroundColor: '#F7F4EF',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          {['Product Details', 'Category', 'Status', 'Price', 'Actions'].map(h => (
            <p key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', margin: 0 }}>
              {h}
            </p>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid #BE864B', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ fontSize: 13, color: '#9C9488' }}>Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📦</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1D', marginBottom: 6 }}>
              {activeTab === 'All Items' ? 'No products yet' : `No products in ${activeTab}`}
            </p>
            <p style={{ fontSize: 12, color: '#9C9488', marginBottom: 16 }}>
              {activeTab === 'All Items' ? 'Add your first product to start selling.' : 'Try a different category.'}
            </p>
            {activeTab === 'All Items' && (
              <button
                onClick={() => navigate('/vendor/products/new')}
                style={{
                  padding: '10px 20px', backgroundColor: '#1D1D1D', color: 'white',
                  border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                ADD PRODUCT
              </button>
            )}
          </div>
        ) : (
          filtered.map((product, i) => {
            const stockStatus = getStockStatus(product.stock)
            const st = STATUS_STYLE[stockStatus]
            return (
              <div
                key={product.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 80px',
                  padding: '14px 20px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  alignItems: 'center',
                }}
              >
                {/* Product details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 8,
                    overflow: 'hidden', flexShrink: 0,
                    border: '1px solid rgba(0,0,0,0.06)',
                    backgroundColor: '#F0EDE8',
                  }}>
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]} alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                      {product.name}
                    </p>
                    <p style={{ fontSize: 10, color: '#9C9488', margin: 0, letterSpacing: '0.04em' }}>
                      {product.sku || `SKU: ${product.id.slice(0, 8).toUpperCase()}`}
                    </p>
                  </div>
                </div>

                {/* Category */}
                <p style={{ fontSize: 12, color: '#7F766B', margin: 0 }}>{product.category}</p>

                {/* Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: st.dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: st.color, fontWeight: 600 }}>
                    {st.label}
                    {stockStatus !== 'outofstock' && (
                      <span style={{ color: '#9C9488', fontWeight: 400 }}> ({product.stock})</span>
                    )}
                  </span>
                </div>

                {/* Price */}
                <p style={{ fontSize: 13, fontWeight: 700, color: '#BE864B', margin: 0 }}>
                  ₦{product.price.toLocaleString()}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <button
                    onClick={() => navigate(`/vendor/products/edit/${product.id}`)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#9C9488', display: 'flex', padding: 2,
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = '#BE864B'}
                    onMouseLeave={e => e.currentTarget.style.color = '#9C9488'}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => deleteProduct(product.id)}
                    disabled={deleting === product.id}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: deleting === product.id ? '#E4DDD3' : '#9C9488',
                      display: 'flex', padding: 2,
                    }}
                    onMouseEnter={e => { if (deleting !== product.id) e.currentTarget.style.color = '#DC2626' }}
                    onMouseLeave={e => { if (deleting !== product.id) e.currentTarget.style.color = '#9C9488' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Bottom insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16 }}>
        <div style={{
          backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 12, padding: '20px 22px',
        }}>
          <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: '#BE864B', margin: '0 0 8px' }}>
            STORE INSIGHTS
          </p>
          <p style={{ fontSize: 15, fontWeight: 800, color: '#1D1D1D', margin: '0 0 14px', lineHeight: 1.4 }}>
            {products.length} products in your store.
          </p>
          <div style={{ display: 'flex', gap: 28 }}>
            {[
              { label: 'In Stock', value: String(products.filter(p => p.stock > 5).length) },
              { label: 'Low / Out', value: String(products.filter(p => p.stock <= 5).length) },
            ].map(s => (
              <div key={s.label}>
                <p style={{ fontSize: 10, color: '#9C9488', margin: '0 0 3px', fontWeight: 600 }}>{s.label}</p>
                <p style={{ fontSize: 18, fontWeight: 900, color: '#BE864B', margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{
          backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 12, padding: '20px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>✦</span>
            <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#1D1D1D' }}>Quick Tip</p>
          </div>
          <p style={{ fontSize: 12, color: '#7F766B', margin: 0, lineHeight: 1.6 }}>
            Products with photos sell 3x faster. Make sure all your listings have clear images.
          </p>
        </div>
      </div>
    </VendorLayout>
  )
}