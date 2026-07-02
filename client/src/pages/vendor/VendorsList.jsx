import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Search, MapPin, Star, ShieldCheck, ArrowRight } from 'lucide-react'
import Navbar from '../../components/common/Navbar'
import Footer from '../../components/common/Footer'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const HALLS = ['All Halls', 'Awo Hall', 'Moremi Hall', 'Fajuyi Hall', 'ETF Hall', 'Angola Hall']
const CATEGORIES = ['All Categories', 'Grains & Cereals', 'Proteins', 'Tubers', 'Vegetables', 'Oils & Spices', 'Snacks & Beverages']

function StarRating({ rating, size = 12 }) {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={size}
          fill={i <= Math.round(rating) ? '#BE864B' : 'none'}
          color={i <= Math.round(rating) ? '#BE864B' : '#D3D1C7'}
          strokeWidth={1.5}
        />
      ))}
    </div>
  )
}

function VendorCard({ vendor }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // Map DB vendor to display fields
  const avatar = vendor.storeName?.charAt(0)?.toUpperCase() || 'V'
  const avatarBg = vendor.avatarBg || '#BE864B'
  const banner = vendor.banner || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80'
  const categories = vendor.categories || []
  const featured = vendor.featured || false
  const tagline = vendor.description || 'Campus vendor on Buylence'
  const responseTime = '< 15 mins'

  return (
    <div
      onClick={() => navigate(`/vendor/${vendor.id}`)}
      style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 14, overflow: 'hidden',
        cursor: 'pointer',
        transition: 'transform 0.15s, box-shadow 0.15s',
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
      {/* Banner */}
      <div style={{ position: 'relative', height: isMobile ? 90 : 110, overflow: 'hidden' }}>
        <img
          src={banner} alt={vendor.storeName}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35) 100%)',
        }} />
        {featured && (
          <div style={{
            position: 'absolute', top: 8, left: 8,
            backgroundColor: '#BE864B', color: 'white',
            fontSize: 8, fontWeight: 800, letterSpacing: '0.08em',
            padding: '2px 7px', borderRadius: 4,
          }}>
            FEATURED
          </div>
        )}
        {vendor.verified && (
          <div style={{
            position: 'absolute', top: 8, right: 8,
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 4, padding: '2px 6px',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <ShieldCheck size={9} color="#4ADE80" />
            <span style={{ fontSize: 8, color: 'white', fontWeight: 700 }}>VERIFIED</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: isMobile ? '12px' : '16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
          <div style={{
            width: isMobile ? 34 : 40,
            height: isMobile ? 34 : 40,
            borderRadius: 8, backgroundColor: avatarBg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontSize: isMobile ? 14 : 16,
            fontWeight: 900, flexShrink: 0,
            marginTop: isMobile ? -24 : -28,
            border: '2px solid white',
          }}>
            {avatar}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
              <h3 style={{
                fontSize: isMobile ? 13 : 14,
                fontWeight: 800, margin: 0, color: '#1D1D1D',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {vendor.storeName}
              </h3>
              {vendor.verified && <ShieldCheck size={12} color="#16A34A" />}
            </div>
            <p style={{
              fontSize: 11, color: '#7F766B', margin: 0,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {tagline}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <StarRating rating={vendor.rating || 0} size={10} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1D' }}>
              {vendor.rating ? vendor.rating.toFixed(1) : '—'}
            </span>
            {!isMobile && (
              <span style={{ fontSize: 11, color: '#9C9488' }}>
                ({vendor.totalReviews || 0})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <MapPin size={10} color="#9C9488" />
            <span style={{ fontSize: 10, color: '#9C9488' }}>
              {isMobile ? vendor.hall?.split(' ')[0] : vendor.hall}
            </span>
          </div>
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: isMobile ? 8 : 10 }}>
          {categories.slice(0, isMobile ? 1 : 2).map(cat => (
            <span key={cat} style={{
              fontSize: 9, fontWeight: 600,
              padding: '2px 7px', borderRadius: 4,
              backgroundColor: '#F0EDE8', color: '#7F766B',
            }}>
              {cat}
            </span>
          ))}
          {categories.length > (isMobile ? 1 : 2) && (
            <span style={{
              fontSize: 9, fontWeight: 600,
              padding: '2px 7px', borderRadius: 4,
              backgroundColor: '#F0EDE8', color: '#9C9488',
            }}>
              +{categories.length - (isMobile ? 1 : 2)}
            </span>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', paddingTop: 8,
          borderTop: '1px solid rgba(0,0,0,0.05)',
        }}>
          <span style={{ fontSize: 10, color: '#9C9488' }}>
            ⏱ {responseTime}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#BE864B', fontSize: 11, fontWeight: 700 }}>
            Visit <ArrowRight size={11} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function VendorsList() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [hall, setHall] = useState('All Halls')
  const [category, setCategory] = useState('All Categories')
  const [sort, setSort] = useState('featured')

  useEffect(() => {
    api.get('/vendors')
      .then(res => setVendors(res.data.vendors || []))
      .catch(err => {
        console.error(err)
        setError('Failed to load vendors.')
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = vendors
    .filter(v => !search ||
      v.storeName?.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase())
    )
    .filter(v => hall === 'All Halls' || v.hall === hall)
    .filter(v => category === 'All Categories' || v.categories?.includes(category))
    .sort((a, b) => {
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0)
      if (sort === 'sales') return (b.totalSales || 0) - (a.totalSales || 0)
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0)
    })

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F2ED', fontFamily: 'Inter, sans-serif' }}>
      <Navbar />

      {/* Hero */}
      <div style={{
        backgroundColor: '#1D1D1D',
        padding: isMobile ? '36px 20px 28px' : '52px 32px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#BE864B', marginBottom: 10 }}>
          CAMPUS VENDOR NETWORK
        </p>
        <h1 style={{
          fontSize: isMobile ? 26 : 38,
          fontWeight: 900, color: 'white',
          letterSpacing: '-0.8px', marginBottom: 10, lineHeight: 1.1,
        }}>
          Shop from trusted<br />campus vendors
        </h1>
        <p style={{
          fontSize: isMobile ? 13 : 14,
          color: 'rgba(255,255,255,0.6)',
          marginBottom: 24, maxWidth: 400, margin: '0 auto 24px',
          lineHeight: 1.6,
        }}>
          {loading ? '...' : `${vendors.length} verified vendors across OAU campus.`}
        </p>

        {/* Search */}
        <div style={{
          maxWidth: 440, margin: '0 auto',
          display: 'flex', alignItems: 'center',
          backgroundColor: 'white', borderRadius: 10,
          padding: '4px 4px 4px 14px',
        }}>
          <Search size={15} color="#9C9488" style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search vendors..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              fontSize: 14, padding: '9px 10px',
              backgroundColor: 'transparent',
              fontFamily: 'Inter, sans-serif', color: '#1D1D1D',
            }}
          />
          <button style={{
            padding: '9px 16px',
            backgroundColor: '#BE864B', color: 'white',
            border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
          }}>
            SEARCH
          </button>
        </div>
      </div>

      {/* Filters + grid */}
      <div style={{
        maxWidth: 1100, margin: '0 auto',
        padding: isMobile ? '20px 16px 48px' : '32px 32px 64px',
      }}>

        {/* Filter bar */}
        <div style={{
          display: 'flex', gap: 8,
          alignItems: 'center', marginBottom: 20,
          flexWrap: isMobile ? 'nowrap' : 'wrap',
          overflowX: isMobile ? 'auto' : 'visible',
          scrollbarWidth: 'none',
          justifyContent: isMobile ? 'flex-start' : 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <select
              value={hall} onChange={e => setHall(e.target.value)}
              style={{
                padding: '8px 10px', border: '1.5px solid #E4DDD3',
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                backgroundColor: 'white', cursor: 'pointer',
                outline: 'none', color: '#1D1D1D',
                fontFamily: 'Inter, sans-serif', flexShrink: 0,
              }}
            >
              {HALLS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>

            {!isMobile && (
              <select
                value={category} onChange={e => setCategory(e.target.value)}
                style={{
                  padding: '8px 10px', border: '1.5px solid #E4DDD3',
                  borderRadius: 8, fontSize: 12, fontWeight: 600,
                  backgroundColor: 'white', cursor: 'pointer',
                  outline: 'none', color: '#1D1D1D',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <span style={{ fontSize: 12, color: '#9C9488', whiteSpace: 'nowrap' }}>
              <strong style={{ color: '#1D1D1D' }}>{filtered.length}</strong> vendors
            </span>
            <select
              value={sort} onChange={e => setSort(e.target.value)}
              style={{
                padding: '8px 10px', border: '1.5px solid #E4DDD3',
                borderRadius: 8, fontSize: 12, fontWeight: 600,
                backgroundColor: 'white', cursor: 'pointer',
                outline: 'none', color: '#1D1D1D',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              <option value="featured">Featured</option>
              <option value="rating">Top Rated</option>
              <option value="sales">Most Sales</option>
            </select>
          </div>
        </div>

        {/* States */}
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? 12 : 20,
          }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} style={{
                backgroundColor: 'white', borderRadius: 14,
                overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)',
              }}>
                <div style={{ height: 110, backgroundColor: '#F0EDE8' }} />
                <div style={{ padding: 16 }}>
                  <div style={{ height: 12, backgroundColor: '#F0EDE8', borderRadius: 4, marginBottom: 8 }} />
                  <div style={{ height: 12, backgroundColor: '#F0EDE8', borderRadius: 4, width: '60%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 13, color: '#DC2626', marginBottom: 16 }}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 24px', backgroundColor: '#1D1D1D',
                color: 'white', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              RETRY
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? 12 : 20,
          }}>
            {filtered.map(v => <VendorCard key={v.id} vendor={v} />)}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 14 }}>🏪</p>
            <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>No vendors found</h3>
            <p style={{ fontSize: 13, color: '#9C9488', marginBottom: 20 }}>
              Try adjusting your search or filters.
            </p>
            <button
              onClick={() => { setSearch(''); setHall('All Halls'); setCategory('All Categories') }}
              style={{
                padding: '11px 24px', backgroundColor: '#1D1D1D',
                color: 'white', border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: 13, cursor: 'pointer',
              }}
            >
              CLEAR FILTERS
            </button>
          </div>
        )}

        {/* Become a vendor CTA */}
        <div style={{
          backgroundColor: '#1D1D1D',
          borderRadius: 16,
          padding: isMobile ? '28px 20px' : '40px 48px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? 20 : 32,
          marginTop: isMobile ? 32 : 48,
        }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#BE864B', marginBottom: 8 }}>
              BECOME A VENDOR
            </p>
            <h2 style={{
              fontSize: isMobile ? 20 : 24,
              fontWeight: 900, color: 'white',
              letterSpacing: '-0.4px', marginBottom: 8, lineHeight: 1.2,
            }}>
              Turn your hostel room<br />into a business.
            </h2>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, maxWidth: 340, margin: 0 }}>
              Join 120+ campus vendors already earning on Buylence.
            </p>
          </div>
          <button
            onClick={() => navigate('/vendor-onboarding')}
            style={{
              padding: '13px 24px',
              backgroundColor: '#BE864B', color: 'white',
              border: 'none', borderRadius: 10,
              fontWeight: 700, fontSize: 13,
              cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap', width: isMobile ? '100%' : 'auto',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: 8,
            }}
          >
            START SELLING <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <Footer />
    </div>
  )
}