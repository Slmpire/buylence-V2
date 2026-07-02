import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Star, ShieldCheck, Search } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import ProductCard from '../../components/product/ProductCard'
import api from '../../lib/axios'

const SORT_OPTIONS = [
  { label: 'Popular', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

function StarRating({ rating, size = 14 }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i} size={size}
          fill={i <= Math.round(rating) ? '#BE864B' : 'none'}
          color={i <= Math.round(rating) ? '#BE864B' : '#D3D1C7'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}

export default function VendorPage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [vendor, setVendor] = useState(null)
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [activeCategory, setActiveCategory] = useState('All')
  const [sort, setSort] = useState('popular')
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('products')

  useEffect(() => {
    Promise.all([
      api.get(`/vendors/${id}`),
      api.get(`/products?vendorId=${id}&limit=50`),
    ])
      .then(([vendorRes, productsRes]) => {
        setVendor(vendorRes.data.vendor)
        setProducts(productsRes.data.products || [])
      })
      .catch(err => {
        if (err.response?.status === 404) setNotFound(true)
        console.error(err)
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F2ED', fontFamily: 'Inter, sans-serif' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '3px solid #BE864B', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: 13, color: '#9C9488' }}>Loading store...</p>
        </div>
      </div>
    )
  }

  if (notFound || !vendor) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#F5F2ED', fontFamily: 'Inter, sans-serif' }}>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '80px 24px' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏪</p>
          <h2 style={{ fontSize: 22, fontWeight: 900, marginBottom: 10 }}>Vendor not found</h2>
          <button
            onClick={() => navigate('/vendors')}
            style={{
              padding: '12px 24px', backgroundColor: '#1D1D1D', color: 'white',
              border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer',
            }}
          >
            BROWSE VENDORS
          </button>
        </div>
      </div>
    )
  }

  const avatar = vendor.storeName?.charAt(0)?.toUpperCase() || 'V'
  const banner = vendor.bannerUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=80'
  const categories = vendor.categories || []
  const allCategories = ['All', ...categories]

  const filteredProducts = products
    .filter(p => activeCategory === 'All' || p.category === activeCategory)
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price
      if (sort === 'price_desc') return b.price - a.price
      return 0
    })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2ED', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      {/* Banner */}
      <div style={{ position: 'relative', height: 220, overflow: 'hidden' }}>
        <img
          src={banner} alt={vendor.storeName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)',
        }} />
      </div>

      {/* Vendor header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 28px' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end',
            gap: 20, paddingBottom: 20,
            marginTop: -40, position: 'relative', zIndex: 2,
          }}>

            {/* Avatar */}
            <div style={{
              width: 80, height: 80, borderRadius: 16,
              backgroundColor: '#BE864B',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontSize: 28, fontWeight: 900,
              border: '3px solid white', flexShrink: 0,
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            }}>
              {avatar}
            </div>

            {/* Info */}
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.3px', margin: 0, color: '#1D1D1D' }}>
                  {vendor.storeName}
                </h1>
                {vendor.verified && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0',
                    borderRadius: 6, padding: '3px 8px',
                  }}>
                    <ShieldCheck size={12} color="#16A34A" />
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#16A34A', letterSpacing: '0.06em' }}>
                      VERIFIED
                    </span>
                  </div>
                )}
              </div>
              {vendor.description && (
                <p style={{ fontSize: 13, color: '#7F766B', margin: '0 0 8px', lineHeight: 1.5 }}>
                  {vendor.description}
                </p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                {vendor.rating > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <StarRating rating={vendor.rating} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#1D1D1D' }}>{vendor.rating}</span>
                    <span style={{ fontSize: 12, color: '#9C9488' }}>({vendor.totalReviews || 0} reviews)</span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <MapPin size={12} color="#9C9488" />
                  <span style={{ fontSize: 12, color: '#9C9488' }}>{vendor.hall}</span>
                </div>
                <span style={{ fontSize: 12, color: '#9C9488' }}>
                  {vendor.totalSales || 0} sales
                </span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 12, paddingBottom: 4, flexShrink: 0 }}>
              {[
                { label: 'DELIVERY', value: `₦${vendor.deliveryFee || 200}` },
                { label: 'PRODUCTS', value: products.length },
              ].map(s => (
                <div key={s.label} style={{
                  backgroundColor: '#F7F4EF',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 10, padding: '10px 16px',
                  textAlign: 'center', minWidth: 80,
                }}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#9C9488', margin: '0 0 4px' }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 900, color: '#1D1D1D', margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
            {['products', 'about'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '14px 20px', background: 'none', border: 'none',
                  borderBottom: `2px solid ${activeTab === tab ? '#BE864B' : 'transparent'}`,
                  color: activeTab === tab ? '#BE864B' : '#7F766B',
                  fontSize: 13, fontWeight: activeTab === tab ? 700 : 500,
                  cursor: 'pointer', textTransform: 'capitalize',
                  transition: 'all 0.15s', marginBottom: -1,
                }}
              >
                {tab === 'products' ? `Products (${products.length})` : 'About'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px 64px' }}>

        {/* Products tab */}
        {activeTab === 'products' && (
          <div>
            {/* Toolbar */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12,
            }}>
              {/* Category pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {allCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '7px 14px', borderRadius: 999,
                      border: '1.5px solid',
                      borderColor: activeCategory === cat ? '#1D1D1D' : '#E4DDD3',
                      backgroundColor: activeCategory === cat ? '#1D1D1D' : 'white',
                      color: activeCategory === cat ? 'white' : '#7F766B',
                      fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search + sort */}
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  backgroundColor: 'white', border: '1px solid #E4DDD3',
                  borderRadius: 8, padding: '8px 12px',
                }}>
                  <Search size={13} color="#9C9488" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search products..."
                    style={{
                      border: 'none', outline: 'none', fontSize: 12,
                      backgroundColor: 'transparent', color: '#1D1D1D',
                      width: 140, fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>
                <select
                  value={sort}
                  onChange={e => setSort(e.target.value)}
                  style={{
                    padding: '8px 12px', border: '1px solid #E4DDD3',
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    backgroundColor: 'white', cursor: 'pointer',
                    outline: 'none', color: '#1D1D1D',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {SORT_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <p style={{ fontSize: 12, color: '#9C9488', marginBottom: 16 }}>
              Showing <strong style={{ color: '#1D1D1D' }}>{filteredProducts.length}</strong> products
              {activeCategory !== 'All' && ` in ${activeCategory}`}
            </p>

            {filteredProducts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18 }}>
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
                <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No products found</h3>
                <p style={{ fontSize: 13, color: '#9C9488' }}>Try a different category or search term.</p>
              </div>
            )}
          </div>
        )}

        {/* About tab */}
        {activeTab === 'about' && (
          <div style={{ maxWidth: 640 }}>
            <div style={{
              backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 14, padding: '28px', marginBottom: 16,
            }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, marginBottom: 16, color: '#1D1D1D' }}>
                About {vendor.storeName}
              </h2>
              <p style={{ fontSize: 14, color: '#5A5550', lineHeight: 1.7, marginBottom: 20 }}>
                {vendor.description || `${vendor.storeName} is a verified campus vendor on Buylence, serving students across OAU.`}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Location', value: vendor.hall },
                  { label: 'Store Type', value: vendor.storeType || 'Campus Vendor' },
                  { label: 'Delivery Fee', value: `₦${vendor.deliveryFee || 200} flat rate` },
                  { label: 'Total Sales', value: `${vendor.totalSales || 0} orders` },
                  { label: 'Rating', value: vendor.rating ? `${vendor.rating} / 5.0` : 'No ratings yet' },
                  { label: 'Status', value: vendor.verified ? '✓ Verified Vendor' : 'Unverified' },
                ].map(info => (
                  <div key={info.label} style={{ backgroundColor: '#F7F4EF', borderRadius: 8, padding: '12px 14px' }}>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9C9488', margin: '0 0 4px' }}>
                      {info.label.toUpperCase()}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1D1D1D', margin: 0 }}>
                      {info.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {categories.length > 0 && (
              <div style={{
                backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
                borderRadius: 14, padding: '24px 28px',
              }}>
                <h2 style={{ fontSize: 14, fontWeight: 800, marginBottom: 14, color: '#1D1D1D' }}>
                  Product Categories
                </h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {categories.map(cat => (
                    <span key={cat} style={{
                      padding: '8px 14px', borderRadius: 999,
                      backgroundColor: '#F0EDE8', border: '1px solid #E4DDD3',
                      fontSize: 12, fontWeight: 600, color: '#5A5550',
                    }}>
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}