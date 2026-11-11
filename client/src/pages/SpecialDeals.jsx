import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import ProductCard from '../components/product/ProductCard'
import { Spinner } from '../components/common/GlobalLoader'
import { useIsMobile } from '../hooks/useWindowSize'
import api from '../lib/axios'

const SORTS = [
  { id: 'ending', label: 'Ending soon' },
  { id: 'discount', label: 'Biggest discount' },
  { id: 'price', label: 'Lowest price' },
]

const PAGE_SIZE = 12

const chip = (active) => ({
  padding: '7px 14px', borderRadius: 999,
  border: `1.5px solid ${active ? '#BE864B' : '#E5DFD5'}`,
  backgroundColor: active ? '#BE864B' : 'white',
  color: active ? 'white' : '#7F766B',
  fontSize: 12, fontWeight: 700, cursor: 'pointer',
  fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
})

export default function SpecialDeals() {
  const isMobile = useIsMobile()

  const [deals, setDeals] = useState([])
  const [categories, setCategories] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('ending')
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  // Start again from page 1 whenever the filter or sort changes
  useEffect(() => {
    let stop = false
    setLoading(true)
    setError('')

    api.get('/products/deals', {
      params: { category: category || undefined, sort, page: 1, limit: PAGE_SIZE },
      silent: true,
    })
      .then(res => {
        if (stop) return
        setDeals(res.data.products || [])
        setCategories(res.data.categories || [])
        setTotal(res.data.total || 0)
        setPages(res.data.pages || 1)
        setPage(1)
      })
      .catch(() => {
        if (!stop) setError('Could not load the deals. Please try again.')
      })
      .finally(() => {
        if (!stop) setLoading(false)
      })

    return () => { stop = true }
  }, [category, sort])

  async function loadMore() {
    setLoadingMore(true)
    try {
      const next = page + 1
      const res = await api.get('/products/deals', {
        params: { category: category || undefined, sort, page: next, limit: PAGE_SIZE },
        silent: true,
      })
      setDeals(prev => [...prev, ...(res.data.products || [])])
      setPage(next)
      setPages(res.data.pages || 1)
    } catch {
      setError('Could not load more deals.')
    } finally {
      setLoadingMore(false)
    }
  }

  const allCount = categories.reduce((sum, c) => sum + c.count, 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F7F4EF', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #1D1D1D 0%, #3A2A1A 100%)',
        padding: isMobile ? '28px 16px' : '44px 28px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', color: '#FDBA74', margin: '0 0 8px' }}>
            🔥 SPECIAL DEALS
          </p>
          <h1 style={{
            fontSize: isMobile ? 28 : 40, fontWeight: 900, letterSpacing: '-1px',
            color: 'white', margin: '0 0 8px', lineHeight: 1.1,
          }}>
            Lower prices from campus sellers
          </h1>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.6, maxWidth: 520 }}>
            Sellers set these prices for a limited time. They go back to normal on their own, so grab
            what you need while a deal is live.
          </p>
          {!loading && (
            <p style={{ fontSize: 12, fontWeight: 800, color: '#FDBA74', margin: '14px 0 0' }}>
              {total} live deal{total === 1 ? '' : 's'} right now
            </p>
          )}
        </div>
      </div>

      <div style={{
        maxWidth: 1200, margin: '0 auto',
        padding: isMobile ? '20px 16px 60px' : '28px 28px 72px',
      }}>

        {/* Categories */}
        {categories.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              <button onClick={() => setCategory('')} style={chip(category === '')}>
                All ({allCount})
              </button>
              {categories.map(c => (
                <button
                  key={c.name}
                  onClick={() => setCategory(c.name)}
                  style={chip(category === c.name)}
                >
                  {c.name} ({c.count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sort */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          flexWrap: 'wrap', marginBottom: 20,
        }}>
          <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', color: '#9C9488' }}>
            SORT BY
          </span>
          {SORTS.map(s => (
            <button key={s.id} onClick={() => setSort(s.id)} style={chip(sort === s.id)}>
              {s.label}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '70px 0' }}>
            <Spinner size={28} color="#BE864B" />
            <p style={{ fontSize: 13, color: '#9C9488', marginTop: 12 }}>Finding deals…</p>
          </div>
        ) : error && deals.length === 0 ? (
          <div style={{
            backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 14, padding: '48px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 14, color: '#B91C1C', margin: '0 0 14px' }}>{error}</p>
            <button
              onClick={() => setSort(s => s)}
              style={{
                padding: '10px 22px', borderRadius: 8, border: 'none',
                backgroundColor: '#1D1D1D', color: 'white', fontWeight: 700,
                fontSize: 12, cursor: 'pointer',
              }}
            >
              TRY AGAIN
            </button>
          </div>
        ) : deals.length === 0 ? (
          <div style={{
            backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 14, padding: '56px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, margin: '0 0 12px' }}>🏷️</p>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px' }}>No live deals right now</h3>
            <p style={{ fontSize: 13, color: '#9C9488', margin: '0 0 18px', lineHeight: 1.6 }}>
              {category
                ? 'There are no deals in this category at the moment. Try another one.'
                : 'Sellers add new deals all the time. Check back soon, or browse everything in the meantime.'}
            </p>
            <Link
              to="/marketplace"
              style={{
                display: 'inline-block', padding: '11px 24px', borderRadius: 999,
                backgroundColor: '#1D1D1D', color: 'white', fontWeight: 700,
                fontSize: 12, letterSpacing: '0.06em', textDecoration: 'none',
              }}
            >
              BROWSE MARKETPLACE
            </Link>
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? 150 : 220}px, 1fr))`,
              gap: isMobile ? 12 : 18,
            }}>
              {deals.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {page < pages && (
              <div style={{ textAlign: 'center', marginTop: 28 }}>
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  style={{
                    padding: '12px 30px', borderRadius: 999,
                    border: '1.5px solid #1D1D1D', backgroundColor: 'transparent',
                    color: '#1D1D1D', fontWeight: 800, fontSize: 12, letterSpacing: '0.06em',
                    cursor: loadingMore ? 'not-allowed' : 'pointer',
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {loadingMore && <Spinner size={14} color="#1D1D1D" />}
                  {loadingMore ? 'LOADING…' : 'SHOW MORE DEALS'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  )
}