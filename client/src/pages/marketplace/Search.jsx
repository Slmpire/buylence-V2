import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { Search as SearchIcon, X, ShoppingBag, User } from 'lucide-react'
import useCartStore from '../../store/cartStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const CATEGORIES = ['Grains & Cereals', 'Proteins & Meat', 'Tubers & Roots', 'Snacks & Beverages', 'Oils & Spices', 'Bread & Bakery', 'Beverages & Drinks']
const HALLS = ['Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'ETF Hall', 'Angola Hall', 'Mozambique Hall']
const SORT_OPTIONS = ['Most Relevant', 'Price: Low to High', 'Price: High to Low']

function ProductCard({ product }) {
  const navigate = useNavigate()
  const addItem = useCartStore(s => s.addItem)
  const isMobile = useIsMobile()

  return (
    <div
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 12, overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s',
      }}
      onClick={() => navigate(`/marketplace`)}
      onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'}
      onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
    >
      <div style={{ position: 'relative', height: isMobile ? 160 : 200, overflow: 'hidden' }}>
        <img
          src={product.images?.[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80'}
          alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        {product.flashDeal && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            backgroundColor: '#BE864B', color: 'white',
            fontSize: 8, fontWeight: 800, letterSpacing: '0.08em',
            padding: '3px 7px', borderRadius: 4,
          }}>
            FLASH DEAL
          </div>
        )}
        {product.comparePrice && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: 'rgba(0,0,0,0.75)', color: 'white',
            fontSize: 8, fontWeight: 800, letterSpacing: '0.06em',
            padding: '3px 7px', borderRadius: 4,
          }}>
            {Math.round((1 - product.price / product.comparePrice) * 100)}% OFF
          </div>
        )}
      </div>
      <div style={{ padding: isMobile ? '10px 12px 12px' : '14px' }}>
        <p style={{ fontSize: 10, color: '#9C9488', margin: '0 0 2px', letterSpacing: '0.04em' }}>
          {product.vendor?.storeName?.toUpperCase() || 'CAMPUS VENDOR'}
        </p>
        <p style={{
          fontSize: isMobile ? 12 : 13, fontWeight: 800,
          margin: '0 0 4px', color: '#1D1D1D', lineHeight: 1.3,
        }}>
          {product.name}
        </p>
        <p style={{ fontSize: 10, color: '#9C9488', margin: '0 0 8px' }}>
          {product.unit}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: '#BE864B' }}>
              ₦{product.price.toLocaleString()}
            </span>
            {product.comparePrice && (
              <span style={{ fontSize: 11, color: '#9C9488', textDecoration: 'line-through', marginLeft: 6 }}>
                ₦{product.comparePrice.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={e => { e.stopPropagation(); addItem(product) }}
            style={{
              padding: '5px 10px',
              backgroundColor: '#1D1D1D', color: 'white',
              border: 'none', borderRadius: 6,
              fontSize: 10, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            ADD
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [inputVal, setInputVal] = useState(searchParams.get('q') || '')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [selectedHalls, setSelectedHalls] = useState([])
  const [sort, setSort] = useState('Most Relevant')
  const [showFilters, setShowFilters] = useState(false)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) { setQuery(q); setInputVal(q) }
  }, [searchParams])

  useEffect(() => {
    if (!query.trim()) { setResults([]); setTotal(0); return }
    const timeout = setTimeout(() => {
      setLoading(true)
      api.get('/products', {
        params: {
          search: query.trim(),
          ...(selectedCategories.length === 1 && { category: selectedCategories[0] }),
          ...(selectedHalls.length === 1 && { hall: selectedHalls[0] }),
          limit: 30,
        }
      })
        .then(res => {
          let products = res.data.products || []
          if (priceMin) products = products.filter(p => p.price >= Number(priceMin))
          if (priceMax) products = products.filter(p => p.price <= Number(priceMax))
          if (sort === 'Price: Low to High') products.sort((a, b) => a.price - b.price)
          if (sort === 'Price: High to Low') products.sort((a, b) => b.price - a.price)
          setResults(products)
          setTotal(products.length)
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [query, selectedCategories, selectedHalls, priceMin, priceMax, sort])

  function handleSearch(e) {
    e.preventDefault()
    if (inputVal.trim()) {
      setQuery(inputVal.trim())
      setSearchParams({ q: inputVal.trim() })
    }
  }

  function toggleCategory(cat) {
    setSelectedCategories(p => p.includes(cat) ? p.filter(c => c !== cat) : [...p, cat])
  }

  function toggleHall(hall) {
    setSelectedHalls(p => p.includes(hall) ? p.filter(h => h !== hall) : [...p, hall])
  }

  function resetFilters() {
    setSelectedCategories([])
    setPriceMin('')
    setPriceMax('')
    setSelectedHalls([])
  }

  const col1 = results.filter((_, i) => i % 2 === 0)
  const col2 = results.filter((_, i) => i % 2 !== 0)

  const FilterPanel = () => (
    <div style={{ backgroundColor: isMobile ? '#F7F4EF' : 'transparent', padding: isMobile ? '20px' : 0 }}>
      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#9C9488', margin: '0 0 10px' }}>
          CATEGORY
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CATEGORIES.map(cat => (
            <label key={cat} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              cursor: 'pointer', fontSize: 13, color: '#1D1D1D',
              fontWeight: selectedCategories.includes(cat) ? 700 : 400,
            }}>
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                style={{ accentColor: '#BE864B', width: 14, height: 14, cursor: 'pointer' }}
              />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#9C9488', margin: '0 0 10px' }}>
          PRICE RANGE (₦)
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { val: priceMin, set: setPriceMin, placeholder: 'Min' },
            { val: priceMax, set: setPriceMax, placeholder: 'Max' },
          ].map(f => (
            <input
              key={f.placeholder}
              type="number" value={f.val}
              onChange={e => f.set(e.target.value)}
              placeholder={f.placeholder}
              style={{
                flex: 1, padding: '8px 10px',
                border: '1px solid #E4DDD3', borderRadius: 6,
                fontSize: 12, outline: 'none',
                fontFamily: 'Inter, sans-serif',
                backgroundColor: 'white', color: '#1D1D1D',
              }}
              onFocus={e => e.target.style.borderColor = '#BE864B'}
              onBlur={e => e.target.style.borderColor = '#E4DDD3'}
            />
          ))}
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#9C9488', margin: '0 0 10px' }}>
          HALL AVAILABILITY
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {HALLS.map(hall => {
            const selected = selectedHalls.includes(hall)
            return (
              <button
                key={hall} onClick={() => toggleHall(hall)}
                style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: '1.5px solid',
                  borderColor: selected ? 'transparent' : '#E4DDD3',
                  backgroundColor: selected ? '#BE864B' : 'white',
                  color: selected ? 'white' : '#7F766B',
                  fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                {hall}
              </button>
            )
          })}
        </div>
      </div>

      <button
        style={{
          width: '100%', padding: '11px',
          background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
          color: 'white', border: 'none', borderRadius: 8,
          fontWeight: 700, fontSize: 12, cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', marginBottom: 8,
        }}
        onClick={() => setShowFilters(false)}
      >
        Apply Filters
      </button>
      <button
        onClick={() => { resetFilters(); setShowFilters(false) }}
        style={{
          width: '100%', padding: '9px', background: 'none', border: 'none',
          color: '#9C9488', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', textDecoration: 'underline', textUnderlineOffset: 2,
        }}
      >
        Reset Selection
      </button>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4EF',
      fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column',
    }}>

      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: isMobile ? '0 16px' : '0 28px', height: 52,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: '#F7F4EF', position: 'sticky', top: 0, zIndex: 50, gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 28 }}>
          <Link to="/" style={{
            fontWeight: 900, fontSize: isMobile ? 12 : 13,
            letterSpacing: '0.06em', color: '#1D1D1D',
            textDecoration: 'none', flexShrink: 0,
          }}>
            BUYLENCE ARCHIVE
          </Link>
          {!isMobile && ['Collection', 'Marketplace', 'Archives'].map(l => (
            <Link key={l} to="/marketplace" style={{
              fontSize: 13, color: l === 'Marketplace' ? '#BE864B' : '#7F766B',
              textDecoration: 'none', fontWeight: 500,
            }}>
              {l}
            </Link>
          ))}
        </div>

        {/* Search bar */}
        <form
          onSubmit={handleSearch}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 8, padding: '6px 12px',
            flex: 1, maxWidth: isMobile ? '100%' : 300,
          }}
        >
          <SearchIcon size={13} color="#9C9488" />
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            placeholder="Search products..."
            autoFocus={!isMobile}
            style={{
              border: 'none', outline: 'none', fontSize: isMobile ? 14 : 12,
              backgroundColor: 'transparent', color: '#1D1D1D', width: '100%',
              fontFamily: 'Inter, sans-serif',
            }}
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => { setInputVal(''); setQuery(''); setSearchParams({}) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9C9488', display: 'flex', padding: 0 }}
            >
              <X size={13} />
            </button>
          )}
        </form>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
          <Link to="/cart" style={{ color: '#1D1D1D', display: 'flex' }}><ShoppingBag size={18} /></Link>
          <Link to="/dashboard" style={{ color: '#1D1D1D', display: 'flex' }}><User size={18} /></Link>
        </div>
      </div>

      {/* Mobile filter sheet */}
      {isMobile && showFilters && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, top: 52 }}>
          <div
            onClick={() => setShowFilters(false)}
            style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            backgroundColor: '#F7F4EF', borderRadius: '20px 20px 0 0',
            padding: '20px 20px 40px', maxHeight: '80vh', overflowY: 'auto', zIndex: 61,
          }}>
            <div style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: '#E4DDD3', margin: '0 auto 20px',
            }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>Refine Results</h2>
              <button
                onClick={() => setShowFilters(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9C9488' }}
              >
                <X size={20} />
              </button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      {/* Body */}
      <div style={{
        display: 'flex', flex: 1,
        maxWidth: isMobile ? '100%' : 1000,
        margin: '0 auto', width: '100%',
        padding: isMobile ? '20px 16px 48px' : '32px 24px 64px',
        gap: 28,
      }}>

        {/* Desktop sidebar */}
        {!isMobile && (
          <div style={{ width: 210, flexShrink: 0, paddingTop: 4 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 18px', color: '#1D1D1D' }}>
              Refine Results
            </h2>
            <FilterPanel />
          </div>
        )}

        {/* Results */}
        <div style={{ flex: 1 }}>

          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 10 : 0, marginBottom: 20,
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? 20 : 22, fontWeight: 900,
                letterSpacing: '-0.3px', margin: '0 0 4px', color: '#1D1D1D',
              }}>
                {query ? `Search: "${query}"` : 'Search Products'}
              </h1>
              <p style={{ fontSize: 12, color: '#9C9488', margin: 0 }}>
                {loading ? 'Searching...' : `${total} products found across OAU Campus`}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isMobile && (
                <button
                  onClick={() => setShowFilters(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '8px 14px', border: '1.5px solid #E4DDD3',
                    borderRadius: 20, backgroundColor: 'white',
                    color: '#7F766B', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  🔧 Filters
                  {(selectedCategories.length + selectedHalls.length) > 0 && (
                    <span style={{
                      backgroundColor: '#BE864B', color: 'white',
                      width: 16, height: 16, borderRadius: '50%',
                      fontSize: 9, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {selectedCategories.length + selectedHalls.length}
                    </span>
                  )}
                </button>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {!isMobile && <span style={{ fontSize: 12, color: '#9C9488' }}>Sort by:</span>}
                <select
                  value={sort} onChange={e => setSort(e.target.value)}
                  style={{
                    padding: '7px 10px', border: '1px solid #E4DDD3',
                    borderRadius: 6, fontSize: 12, backgroundColor: 'white',
                    cursor: 'pointer', outline: 'none', color: '#1D1D1D',
                    fontFamily: 'Inter, sans-serif', maxWidth: isMobile ? 140 : 'none',
                  }}
                >
                  {SORT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                border: '3px solid #BE864B', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <p style={{ fontSize: 13, color: '#9C9488' }}>Searching products...</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && query && results.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🔍</p>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No products found</h3>
              <p style={{ fontSize: 13, color: '#9C9488', marginBottom: 20 }}>
                Try different keywords or clear your filters.
              </p>
              <button
                onClick={resetFilters}
                style={{
                  padding: '10px 22px',
                  background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                  color: 'white', border: 'none', borderRadius: 8,
                  fontWeight: 700, fontSize: 12, cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Clear Filters
              </button>
            </div>
          )}

          {/* No query yet */}
          {!loading && !query && (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>🛒</p>
              <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Search for products</h3>
              <p style={{ fontSize: 13, color: '#9C9488' }}>
                Type in the search bar above to find campus essentials.
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && results.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 10 : 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16 }}>
                {col1.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <div style={{
                display: 'flex', flexDirection: 'column',
                gap: isMobile ? 10 : 16, marginTop: isMobile ? 20 : 40,
              }}>
                {col2.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}