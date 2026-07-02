import { useState, useEffect } from 'react'
import Navbar from '../common/Navbar'
import Footer from '../common/Footer'
import ProductCard from './ProductCard'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const SORT_OPTIONS = [
  { label: 'Most Popular', value: 'popular' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
]

export default function CategoryPage({ name, description, emoji, category }) {
  const navigate = useNavigate()
  const [sort, setSort] = useState('popular')
  const isMobile = useIsMobile()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!category) return
    setLoading(true)
    api.get('/products', { params: { category, limit: 50 } })
      .then(res => setProducts(res.data.products || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [category])

  const sorted = [...products].sort((a, b) => {
    if (sort === 'price_asc') return a.price - b.price
    if (sort === 'price_desc') return b.price - a.price
    return 0
  })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2ED', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      {/* Header */}
      <div style={{
        backgroundColor: '#1A1A1A',
        padding: isMobile ? '28px 20px 32px' : '40px 24px 48px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.55)', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              letterSpacing: '0.06em', marginBottom: 16, padding: 0,
            }}
          >
            <ArrowLeft size={14} /> BACK TO MARKETPLACE
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: isMobile ? 36 : 44 }}>{emoji}</span>
            <div>
              <h1 style={{
                fontSize: isMobile ? 22 : 30, fontWeight: 900,
                color: 'white', letterSpacing: '-0.5px', marginBottom: 4,
              }}>
                {name}
              </h1>
              <p style={{ fontSize: isMobile ? 12 : 14, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                {description}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '20px 16px 48px' : '36px 24px 64px',
      }}>

        {/* Toolbar */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: 20,
        }}>
          <p style={{ fontSize: 13, color: '#9C9488', margin: 0 }}>
            {loading ? 'Loading...' : (
              <><strong style={{ color: '#1A1A1A' }}>{sorted.length}</strong> products</>
            )}
          </p>
          <select
            value={sort} onChange={e => setSort(e.target.value)}
            style={{
              padding: isMobile ? '8px 10px' : '9px 14px',
              border: '1.5px solid #E4DDD3', borderRadius: 20,
              fontSize: 12, fontWeight: 600, backgroundColor: 'white',
              cursor: 'pointer', outline: 'none', color: '#1A1A1A',
              fontFamily: 'Inter, sans-serif', maxWidth: isMobile ? 160 : 'none',
            }}
          >
            {SORT_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? 12 : 20,
          }}>
            {[...Array(8)].map((_, i) => (
              <div key={i} style={{
                backgroundColor: 'white', borderRadius: 12,
                overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{ height: 160, backgroundColor: '#F0EDE8' }} />
                <div style={{ padding: 14 }}>
                  <div style={{ height: 12, backgroundColor: '#F0EDE8', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 12, backgroundColor: '#F0EDE8', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No products yet</h3>
            <p style={{ fontSize: 13, color: '#9C9488', marginBottom: 20 }}>
              No products in this category yet. Check back soon!
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              style={{
                padding: '11px 24px', backgroundColor: '#1A1A1A', color: 'white',
                border: 'none', borderRadius: 8, fontWeight: 700, fontSize: 13,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              BROWSE ALL PRODUCTS
            </button>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? 12 : 20,
          }}>
            {sorted.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}