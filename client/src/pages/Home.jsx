import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import useCartStore from '../store/cartStore'
import { useIsMobile, useIsTablet } from '../hooks/useWindowSize'


const HERO_IMAGES = [
  '/vegetables.jpg',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1400&q=90',
  'https://images.unsplash.com/photo-1574316945092-d40ea64d7ad5?w=1400&q=90',
  'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=1400&q=90',
  'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=1400&q=90',
]

const CATEGORIES = [
  { label: 'All Items', to: '/marketplace' },
  { label: 'Grains & Cereals', to: '/category/grains' },
  { label: 'Snacks & Beverages', to: '/category/snacks' },
  { label: 'Oils & Spices', to: '/category/oils' },
  { label: 'Packaged Food', to: '/category/packaged' },
  { label: 'Tubers', to: '/category/tubers' },
  { label: 'Pepper & Vegetables', to: '/category/vegetables' },
  { label: 'Special Offers', to: '/marketplace?filter=special' },
  { label: 'Home Essentials', to: '/marketplace?filter=home' },
]

const BROWSE_CATEGORIES = [
  { label: 'Grains', to: '/category/grains', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80' },
  { label: 'Proteins', to: '/category/proteins', img: 'https://images.unsplash.com/photo-1534482421-64566f976cfa?w=400&q=80' },
  { label: 'Tubers', to: '/category/tubers', img: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=80' },
  { label: 'Pure Oils', to: '/category/oils', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { label: 'Vegetables', to: '/category/vegetables', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80' },
]

const STUDENT_FAVORITES = [
  { id: 1, name: 'Spaghetti', tag: 'FRESHLY PREPARED (500G)', price: 2500, sellers: 5, img: 'https://images.unsplash.com/photo-1551462147-37885acc36f1?w=400&q=80' },
  { id: 2, name: '10 Noodles Pack', tag: 'PLAIN & CREAMY (1L)', price: 3200, sellers: 12, img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80' },
  { id: 3, name: 'Whole Grain Oats', tag: 'ORGANIC IMPORT (800G)', price: 4800, sellers: 3, img: 'https://images.unsplash.com/photo-1614961233913-a5113a4a34ed?w=400&q=80' },
  { id: 4, name: 'Hollandia Yoghurt', tag: 'LOCAL HARVEST (250ML)', price: 1900, sellers: 8, img: 'https://images.unsplash.com/photo-1571212515416-fef01fc43637?w=400&q=80' },
]

const FEATURES = [
  { icon: <Truck size={20} />, title: 'Gate Delivery', desc: 'Standard ₦200 fee to all residence hall gates.' },
  { icon: <ShieldCheck size={20} />, title: 'Escrow Security', desc: 'Funds released only upon delivery confirmation.' },
]

function ProductCard({ product }) {
  const addItem = useCartStore(s => s.addItem)
  const isMobile = useIsMobile()

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '1px solid transparent',
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
      <div style={{ position: 'relative' }}>
        <img
          src={product.img} alt={product.name}
          style={{ width: '100%', height: isMobile ? 160 : 190, objectFit: 'cover', display: 'block' }}
        />
        <span style={{
          position: 'absolute', top: 10, left: 10,
          backgroundColor: 'rgba(0,0,0,0.72)',
          color: 'white', fontSize: 9, fontWeight: 700,
          letterSpacing: '0.06em',
          padding: '4px 8px', borderRadius: 'var(--radius-pill)',
        }}>
          {product.sellers} SELLERS
        </span>
      </div>
      <div style={{ padding: isMobile ? '12px' : '14px 16px 18px' }}>
        <p style={{ fontSize: 10, color: 'var(--gray-muted)', letterSpacing: '0.06em', marginBottom: 4 }}>
          {product.tag}
        </p>
        <p style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, letterSpacing: '-0.2px', marginBottom: 10 }}>
          {product.name.toUpperCase()}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 900, color: 'var(--amber)' }}>
            ₦{product.price.toLocaleString()}
          </span>
          <button
            onClick={() => addItem(product)}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: 'var(--charcoal)', color: 'white',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 20,
              transition: 'background 0.15s',
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

export default function Home() {
  const [activeTab, setActiveTab] = useState(0)
const [heroIndex, setHeroIndex] = useState(0)

useEffect(() => {
  const timer = setInterval(() => {
    setHeroIndex(prev => (prev + 1) % HERO_IMAGES.length)
  }, 4000)
  return () => clearInterval(timer)
}, [])

  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  const cols = isMobile ? 2 : isTablet ? 3 : 4
  const browseCols = isMobile ? 3 : 5

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--cream)' }}>
      <Navbar />

  
      {/* ── HERO ── */}
<section style={{
  padding: isMobile ? '12px' : '20px 24px',
  maxWidth: 1200,
  margin: '0 auto',
}}>
  {/* Outer cream wrapper */}
  <div style={{
    position: 'relative',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#EDEAE4',
    minHeight: isMobile ? 'auto' : 560,
    display: 'flex',
    alignItems: 'stretch',
    boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
  }}>

    {/* ── Right: full image ── */}
    <div style={{
      position: 'absolute',
      top: 0, right: 0, bottom: 0,
      width: '65%',
      zIndex: 0,
    }}>
      {/* IMAGE */}
      <img
  src={HERO_IMAGES[heroIndex]}
  alt="Fresh produce"
  style={{
    width: '100%', height: '100%',
    objectFit: 'cover', display: 'block',
    transition: 'opacity 0.8s ease-in-out',
  }}
/>

      {/* Fade gradient — left edge of image fades to white */}
      <div style={{
        position: 'absolute',
        top: 0, left: 0, bottom: 0,
        width: '45%',
        background: 'linear-gradient(to right, white 0%, rgba(255,255,255,0.85) 30%, rgba(255,255,255,0.3) 70%, transparent 100%)',
        zIndex: 1,
      }} />
    </div>

    {/* ── Left: white floating card ── */}
    <div style={{
      position: 'relative',
      zIndex: 2,
      backgroundColor: 'white',
      borderRadius: 18,
      margin: isMobile ? '200px 14px 14px' : '28px 0 28px 28px',
      padding: isMobile ? '28px 22px 32px' : '50px 56px 50px 44px',
      width: isMobile ? 'calc(100% - 28px)' : '44%',
      maxWidth: 500,
      flexShrink: 0,
      boxShadow: '0 4px 32px rgba(0,0,0,0.07)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}>

      {/* Badge */}
      <span style={{
        display: 'inline-block',
        backgroundColor: '#EDD9C0',
        color: '#7A4F28',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.13em',
        padding: '5px 14px',
        borderRadius: 999,
        marginBottom: 20,
        width: 'fit-content',
      }}>
        OAU EXCLUSIVE DELIVERY
      </span>

      {/* Heading — natural wrapping, no forced breaks */}
      <h1 style={{
        fontSize: isMobile ? 36 : 50,
        fontWeight: 900,
        lineHeight: 1.1,
        letterSpacing: '-1.5px',
        color: '#1A1A1A',
        margin: '0 0 22px',
        maxWidth: 360,
      }}>
        Freshness delivered to your{' '}
        <span style={{ color: '#BE6B1A' }}>hostel door.</span>
      </h1>

      {/* Description */}
      <p style={{
        fontSize: 14,
        color: '#7F766B',
        lineHeight: 1.7,
        margin: '0 0 32px',
        maxWidth: 360,
      }}>
        Elevated student living begins with better food. Sourced
        directly from local farmers around Ile-Ife, delivered with
        precision.
      </p>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => navigate('/marketplace')}
          style={{
            backgroundColor: '#BE6B1A',
            color: 'white',
            border: 'none',
            borderRadius: 999,
            padding: '14px 30px',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          SHOP NOW
        </button>
        <button
          onClick={() => navigate('/vendors')}
          style={{
            backgroundColor: 'white',
            color: '#1A1A1A',
            border: '1.5px solid #D0CBC4',
            borderRadius: 999,
            padding: '14px 30px',
            fontWeight: 700,
            fontSize: 12,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          LEARN MORE
        </button>
      </div>
    </div>
  </div>
</section>

      {/* ── CATEGORY TABS ── */}

<section style={{ padding: '24px 0 0', backgroundColor: 'var(--cream)' }}>
  <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
    <div style={{
      display: 'flex',
      flexWrap: 'nowrap',
      gap: 8,
      overflowX: 'auto',
      paddingBottom: 8,
      scrollbarWidth: 'none',
      msOverflowStyle: 'none',
    }}>
      <style>{`
        .category-scroll::-webkit-scrollbar { display: none; }
      `}</style>
      {CATEGORIES.map((cat, i) => (
        <button
          key={cat.label}
          onClick={() => { setActiveTab(i); navigate(cat.to) }}
          style={{
            padding: '8px 14px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--gray-border)',
            backgroundColor: activeTab === i ? 'var(--charcoal)' : 'white',
            color: activeTab === i ? 'white' : 'var(--charcoal)',
            fontWeight: 600, fontSize: 11,
            letterSpacing: '0.04em', cursor: 'pointer',
            transition: 'all 0.15s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {cat.label.toUpperCase()}
        </button>
      ))}
    </div>
  </div>
</section>

      {/* ── BROWSE CATEGORIES ── */}
      <section style={{ padding: isMobile ? '32px 0' : '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
                BROWSE CATEGORIES
              </h2>
              {!isMobile && (
                <p style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--gray-muted)', marginTop: 4 }}>
                  SELECTED FOR THE ACADEMIC COMMUNITY
                </p>
              )}
            </div>
            <Link to="/marketplace" style={{
              fontSize: 11, fontWeight: 700, color: 'var(--amber)',
              letterSpacing: '0.06em', textDecoration: 'none',
            }}>
              VIEW ALL
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${browseCols}, 1fr)`,
            gap: isMobile ? 10 : 16,
          }}>
            {BROWSE_CATEGORIES.slice(0, isMobile ? 3 : 5).map(cat => (
              <Link key={cat.label} to={cat.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div>
                  <div style={{
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    aspectRatio: '1', marginBottom: 8,
                  }}>
                    <img
                      src={cat.img} alt={cat.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                  <p style={{ fontSize: isMobile ? 10 : 12, fontWeight: 700, letterSpacing: '0.06em' }}>
                    {cat.label.toUpperCase()}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* Show all on mobile */}
          {isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {BROWSE_CATEGORIES.slice(3).map(cat => (
                <Link key={cat.label} to={cat.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', aspectRatio: '1', marginBottom: 6 }}>
                      <img src={cat.img} alt={cat.label} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em' }}>
                      {cat.label.toUpperCase()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BROWSE VENDORS strip ── */}
      <section style={{ padding: '0 0 32px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div
            onClick={() => navigate('/vendors')}
            style={{
              backgroundColor: 'white',
              border: '1px solid var(--gray-border)',
              borderRadius: 'var(--radius-lg)',
              padding: isMobile ? '14px 16px' : '16px 24px',
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: isMobile ? 36 : 44, height: isMobile ? 36 : 44,
                borderRadius: 10, backgroundColor: 'var(--amber-pale)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: 20,
              }}>
                🏪
              </div>
              <div>
                <p style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, margin: '0 0 2px' }}>
                  Browse Campus Vendors
                </p>
                <p style={{ fontSize: isMobile ? 11 : 12, color: 'var(--gray-muted)', margin: 0 }}>
                  6 verified vendors · Delivering to your hall gate
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--amber)', fontSize: 12, fontWeight: 700 }}>
              {!isMobile && 'View all'} <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STUDENT FAVORITES ── */}
      <section style={{ padding: '0 0 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 22 : 32, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
                STUDENT FAVORITES
              </h2>
              {!isMobile && (
                <p style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--gray-muted)', marginTop: 4 }}>
                  HIGH-DEMAND ESSENTIALS FOR CAMPUS LIVING
                </p>
              )}
            </div>
            <Link to="/marketplace" style={{
              fontSize: 11, fontWeight: 700, color: 'var(--amber)',
              letterSpacing: '0.06em', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              ALL <ArrowRight size={13} />
            </Link>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: isMobile ? 12 : 18,
          }}>
            {STUDENT_FAVORITES.slice(0, isMobile ? 4 : 4).map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ── PROMO GRID ── */}
      <section style={{ padding: '0 0 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: 16,
          }}>

            {/* Flash deal */}
            <div style={{
              backgroundColor: '#6B6B65',
              borderRadius: 16, padding: isMobile ? '28px 24px' : '36px',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'flex-end',
              minHeight: isMobile ? 220 : 260,
              position: 'relative', overflow: 'hidden',
            }}>
              <div style={{
                position: 'absolute', top: 16, right: 16,
                fontSize: isMobile ? 56 : 72, fontWeight: 900,
                color: 'rgba(255,255,255,0.07)',
                lineHeight: 1, userSelect: 'none',
              }}>
                FLASH
              </div>
              <span style={{
                backgroundColor: 'var(--amber)', color: 'white',
                fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                padding: '4px 10px', borderRadius: 4,
                width: 'fit-content', marginBottom: 10,
              }}>
                WEEKEND SPECIAL
              </span>
              <h3 style={{ fontSize: isMobile ? 22 : 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 8 }}>
                The Ultimate<br />Semester Kit
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
                Essential food bundle for the new semester.
              </p>
              <button
                onClick={() => navigate('/marketplace?filter=flash')}
                style={{
                  backgroundColor: 'white', color: 'var(--charcoal)',
                  border: 'none', borderRadius: 'var(--radius-pill)',
                  padding: '11px 20px', fontWeight: 700, fontSize: 12,
                  cursor: 'pointer', width: 'fit-content',
                }}
              >
                CLAIM DEAL ₦25,000
              </button>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Become a seller */}
              <div
                onClick={() => navigate('/vendor-onboarding')}
                style={{
                  backgroundColor: 'var(--amber)',
                  borderRadius: 16, padding: isMobile ? '20px' : '24px',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', flex: 1, cursor: 'pointer',
                  minHeight: isMobile ? 100 : 120,
                }}
              >
                <div>
                  <h3 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 6 }}>
                    BECOME A SELLER
                  </h3>
                  <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, lineHeight: 1.4, margin: 0 }}>
                    Turn your hostel room into a business.
                  </p>
                </div>
                <div style={{ fontSize: 36, opacity: 0.3 }}>🏪</div>
              </div>

              {/* Feature cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {FEATURES.map(f => (
                  <div key={f.title} style={{
                    backgroundColor: 'white', borderRadius: 14,
                    padding: isMobile ? '16px 14px' : '20px 18px',
                  }}>
                    <div style={{
                      width: 38, height: 38, borderRadius: '50%',
                      backgroundColor: 'var(--amber-pale)',
                      display: 'flex', alignItems: 'center',
                      justifyContent: 'center', color: 'var(--amber)',
                      marginBottom: 10,
                    }}>
                      {f.icon}
                    </div>
                    <h4 style={{ fontSize: isMobile ? 11 : 12, fontWeight: 800, letterSpacing: '0.04em', marginBottom: 4 }}>
                      {f.title.toUpperCase()}
                    </h4>
                    <p style={{ fontSize: isMobile ? 10 : 11, color: 'var(--gray-muted)', lineHeight: 1.5, margin: 0 }}>
                      {f.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}