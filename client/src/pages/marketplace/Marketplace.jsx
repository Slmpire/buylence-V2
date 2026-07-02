import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import ProductCard from '../../components/product/ProductCard'
import api from '../../lib/axios'

const CATEGORIES = [
  'All', 'Grains & Cereals', 'Proteins & Meat', 'Tubers & Roots',
  'Snacks & Beverages', 'Oils & Spices', 'Bread & Bakery', 'Beverages & Drinks',
]

export default function Marketplace() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeCategory, setActiveCategory] = useState('All')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchProducts()
  }, [activeCategory, sort, page])

  async function fetchProducts() {
    setLoading(true)
    try {
      const params = {
        page,
        limit: 12,
        ...(activeCategory !== 'All' && { category: activeCategory }),
        ...(search.trim() && { search: search.trim() }),
      }
      const res = await api.get('/products', { params })
      setProducts(res.data.products)
      setTotal(res.data.total)
    } catch (err) {
      setError('Failed to load products.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    fetchProducts()
  }

  // Keep all your existing UI — just replace the mock PRODUCTS array
  // with the `products` state above, and wrap the grid with:
  // {loading ? <LoadingGrid /> : products.map(...)}

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2ED', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      {/* ── Hero ── */}
      <div style={{
        backgroundColor: '#1A1A1A', padding: '40px 32px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#BE864B', marginBottom: 10 }}>
          OAU CAMPUS MARKETPLACE
        </p>
        <h1 style={{
          fontSize: 36, fontWeight: 900, color: 'white',
          letterSpacing: '-0.8px', marginBottom: 10, lineHeight: 1.1,
        }}>
          Campus essentials,<br />delivered to your hall
        </h1>
        <form onSubmit={handleSearch} style={{
          maxWidth: 480, margin: '20px auto 0',
          display: 'flex', gap: 0,
          backgroundColor: 'white', borderRadius: 10,
          padding: '4px 4px 4px 16px',
        }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search products..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, backgroundColor: 'transparent',
              fontFamily: 'Inter, sans-serif', color: '#1D1D1D',
            }}
          />
          <button type="submit" style={{
            padding: '10px 20px', backgroundColor: '#BE864B',
            color: 'white', border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}>
            SEARCH
          </button>
        </form>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 28px 64px' }}>

        {/* Category pills */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          marginBottom: 24,
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setPage(1) }}
              style={{
                padding: '8px 16px', borderRadius: 999,
                border: '1.5px solid',
                borderColor: activeCategory === cat ? '#1A1A1A' : '#E4DDD3',
                backgroundColor: activeCategory === cat ? '#1A1A1A' : 'white',
                color: activeCategory === cat ? 'white' : '#7F766B',
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.15s',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Results bar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20,
        }}>
          <p style={{ fontSize: 13, color: '#9C9488', margin: 0 }}>
            {loading ? 'Loading...' : (
              <><strong style={{ color: '#1D1D1D' }}>{total}</strong> products
              {activeCategory !== 'All' && ` in ${activeCategory}`}</>
            )}
          </p>
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
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* Product grid */}
        {loading ? (
          // Loading skeleton
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 18,
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                backgroundColor: 'white',
                borderRadius: 12, overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{
                  height: 160, backgroundColor: '#F0EDE8',
                  animation: 'pulse 1.5s ease-in-out infinite',
                }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 12, backgroundColor: '#F0EDE8', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 12, backgroundColor: '#F0EDE8', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>⚠️</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>Failed to load products</h3>
            <p style={{ fontSize: 13, color: '#9C9488', marginBottom: 20 }}>{error}</p>
            <button
              onClick={fetchProducts}
              style={{
                padding: '10px 24px', backgroundColor: '#1A1A1A',
                color: 'white', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              Try Again
            </button>
          </div>
        ) : products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No products found</h3>
            <p style={{ fontSize: 13, color: '#9C9488' }}>
              Try a different category or search term.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 18,
          }}>
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 12 && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            gap: 8, marginTop: 40,
          }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '9px 18px',
                border: '1px solid #E4DDD3',
                backgroundColor: 'white', borderRadius: 8,
                fontSize: 12, fontWeight: 600,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: page === 1 ? '#C8B89A' : '#1D1D1D',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              ← Previous
            </button>
            <span style={{
              padding: '9px 16px', fontSize: 12,
              color: '#9C9488', fontWeight: 600,
            }}>
              Page {page} of {Math.ceil(total / 12)}
            </span>
            <button
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(total / 12)}
              style={{
                padding: '9px 18px',
                border: '1px solid #E4DDD3',
                backgroundColor: 'white', borderRadius: 8,
                fontSize: 12, fontWeight: 600,
                cursor: page >= Math.ceil(total / 12) ? 'not-allowed' : 'pointer',
                color: page >= Math.ceil(total / 12) ? '#C8B89A' : '#1D1D1D',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}