import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ShieldCheck, Truck } from 'lucide-react'
import Navbar from '../components/common/Navbar'
import Footer from '../components/common/Footer'
import useCartStore from '../store/cartStore'
import { useIsMobile, useIsTablet } from '../hooks/useWindowSize'
import useAuthStore from '../store/authStore'
import ProductCard from '../components/product/ProductCard'

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
  { label: 'Tubers', to: '/category/tubers' },
  { label: 'Pepper & Vegetables', to: '/category/vegetables' },
  { label: 'Proteins', to: '/category/proteins' },
  { label: 'Special Offers', to: '/marketplace?filter=special' },
]

const BROWSE_CATEGORIES = [
  { label: 'Grains', to: '/category/grains', img: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b516?w=400&q=80' },
  { label: 'Proteins', to: '/category/proteins', img: 'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=400&q=80' },
  { label: 'Tubers', to: '/category/tubers', img: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&q=80' },
  { label: 'Pure Oils', to: '/category/oils', img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { label: 'Vegetables', to: '/category/vegetables', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80' },
]

const STUDENT_FAVORITES = [
  { id: 1, name: 'Ofada Rice (1kg)', tag: 'LOCAL HARVEST', price: 3200, sellers: 7, img: 'https://images.unsplash.com/photo-1536304993881-ff86e0c9b516?w=400&q=80' },
  { id: 2, name: 'Garri (5kg)', tag: 'IJEBU WHITE', price: 5500, sellers: 11, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=80' },
  { id: 3, name: 'Groundnut Oil (75cl)', tag: 'COLD PRESSED', price: 2400, sellers: 4, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=400&q=80' },
  { id: 4, name: 'Zobo Drink (1L)', tag: 'FRESH DAILY', price: 1000, sellers: 3, img: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80' },
]

const FEATURES = [
  { icon: <Truck size={20} />, title: 'Gate Delivery', desc: 'Standard ₦200 fee to all residence hall gates.' },
  { icon: <ShieldCheck size={20} />, title: 'Escrow Security', desc: 'Funds released only upon delivery confirmation.' },
]

export default function Home() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()
  const { user } = useAuthStore()

  const [heroIdx, setHeroIdx] = useState(0)
  const [heroOpacity, setHeroOpacity] = useState(1)
  const [activeTab, setActiveTab] = useState(0)

  const cols = isMobile ? 2 : isTablet ? 3 : 4
  const browseCols = isMobile ? 3 : 5

  useEffect(() => {
    const interval = setInterval(() => {
      setHeroOpacity(0)
      setTimeout(() => {
        setHeroIdx(i => (i + 1) % HERO_IMAGES.length)
        setHeroOpacity(1)
      }, 400)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', backgroundColor: 'var(--cream)' }}>
      <Navbar />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', overflow: 'hidden',
        minHeight: isMobile ? 460 : 560, backgroundColor: '#E8E2DA',
      }}>
        <img
          src={HERO_IMAGES[heroIdx]} alt="hero"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%', objectFit: 'cover',
            opacity: heroOpacity * 0.35, transition: 'opacity 0.4s ease',
          }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          background: isMobile
            ? 'linear-gradient(to bottom, rgba(232,226,218,0.3) 0%, rgba(232,226,218,0.95) 55%)'
            : 'linear-gradient(to right, rgba(232,226,218,1) 40%, rgba(232,226,218,0) 100%)',
        }} />
        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: 1200, margin: '0 auto',
          padding: isMobile ? '36px 16px 36px' : '28px 28px',
          minHeight: isMobile ? 460 : 560,
          display: 'flex', alignItems: isMobile ? 'flex-end' : 'center',
        }}>
          <div style={{
            maxWidth: isMobile ? '100%' : 480,
            padding: isMobile ? '24px 20px 28px' : '50px 56px 50px 44px',
            backgroundColor: 'rgba(255,255,255,0.88)',
            borderRadius: isMobile ? 16 : 20,
            backdropFilter: 'blur(8px)',
            boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
            width: '100%',
          }}>
            <span style={{
              display: 'inline-block', backgroundColor: '#F5E6CC', color: '#7A4F28',
              fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: '0.13em',
              padding: '5px 14px', borderRadius: 999, marginBottom: isMobile ? 12 : 20,
            }}>
              OAU EXCLUSIVE DELIVERY
            </span>
            <h1 style={{
              fontSize: isMobile ? 26 : 50, fontWeight: 900, lineHeight: 1.1,
              letterSpacing: '-1.5px', color: '#1A1A1A', margin: '0 0 14px',
            }}>
              Freshness delivered to your{' '}
              <span style={{ color: '#BE6B1A' }}>hostel door.</span>
            </h1>
            <p style={{
              fontSize: isMobile ? 13 : 14, color: '#7F766B',
              lineHeight: 1.7, margin: '0 0 22px',
            }}>
              Sourced directly from local farmers around Ile-Ife, delivered with precision to your hall gate.
            </p>
            <div style={{ display: 'flex', gap: isMobile ? 8 : 10 }}>
              <button
                onClick={() => navigate('/marketplace')}
                style={{
                  backgroundColor: '#BE6B1A', color: 'white', border: 'none',
                  borderRadius: 999, padding: isMobile ? '12px 22px' : '14px 30px',
                  fontWeight: 700, fontSize: isMobile ? 11 : 12,
                  letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                SHOP NOW
              </button>
              <button
                onClick={() => navigate('/vendors')}
                style={{
                  backgroundColor: 'white', color: '#1A1A1A',
                  border: '1.5px solid #D0CBC4', borderRadius: 999,
                  padding: isMobile ? '12px 22px' : '14px 30px',
                  fontWeight: 700, fontSize: isMobile ? 11 : 12,
                  letterSpacing: '0.1em', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                VENDORS
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CATEGORY TABS ── */}
      <section style={{ padding: '20px 0 0', backgroundColor: 'var(--cream)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{
            display: 'flex', flexWrap: 'nowrap', gap: 8,
            overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none',
          }}>
            {CATEGORIES.map((cat, i) => (
              <button
                key={cat.label}
                onClick={() => { setActiveTab(i); navigate(cat.to) }}
                style={{
                  padding: isMobile ? '7px 12px' : '8px 14px',
                  borderRadius: 'var(--radius-pill)',
                  border: '1px solid var(--gray-border)',
                  backgroundColor: activeTab === i ? 'var(--charcoal)' : 'white',
                  color: activeTab === i ? 'white' : 'var(--charcoal)',
                  fontWeight: 600, fontSize: isMobile ? 10 : 11,
                  letterSpacing: '0.04em', cursor: 'pointer',
                  transition: 'all 0.15s', whiteSpace: 'nowrap', flexShrink: 0,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {cat.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── BROWSE CATEGORIES ── */}
      <section style={{ padding: isMobile ? '24px 0' : '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: isMobile ? 14 : 20,
          }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 18 : 26, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
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
            gridTemplateColumns: `repeat(${isMobile ? 3 : browseCols}, 1fr)`,
            gap: isMobile ? 10 : 16,
          }}>
            {BROWSE_CATEGORIES.slice(0, isMobile ? 3 : 5).map(cat => (
              <Link key={cat.label} to={cat.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div>
                  <div style={{
                    borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                    aspectRatio: '1', marginBottom: isMobile ? 6 : 8,
                  }}>
                    <img src={cat.img} alt={cat.label}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <p style={{
                    fontSize: isMobile ? 10 : 12, fontWeight: 700,
                    letterSpacing: '0.06em', margin: 0, textAlign: 'center',
                  }}>
                    {cat.label.toUpperCase()}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {isMobile && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              {BROWSE_CATEGORIES.slice(3).map(cat => (
                <Link key={cat.label} to={cat.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div>
                    <div style={{
                      borderRadius: 'var(--radius-lg)', overflow: 'hidden',
                      aspectRatio: '1', marginBottom: 6,
                    }}>
                      <img src={cat.img} alt={cat.label}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    </div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', margin: 0, textAlign: 'center' }}>
                      {cat.label.toUpperCase()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── BROWSE VENDORS ── */}
      <section style={{ padding: '0 0 28px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div
            onClick={() => navigate('/vendors')}
            style={{
              backgroundColor: 'white', border: '1px solid var(--gray-border)',
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
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
              }}>
                🏪
              </div>
              <div>
                <p style={{ fontSize: isMobile ? 13 : 14, fontWeight: 800, margin: '0 0 2px' }}>
                  Browse Campus Vendors
                </p>
                <p style={{ fontSize: isMobile ? 11 : 12, color: 'var(--gray-muted)', margin: 0 }}>
                  Verified vendors · Delivering to your hall gate
                </p>
              </div>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4,
              color: 'var(--amber)', fontSize: 12, fontWeight: 700,
            }}>
              {!isMobile && 'View all'} <ArrowRight size={14} />
            </div>
          </div>
        </div>
      </section>

      {/* ── STUDENT FAVORITES ── */}
      <section style={{ padding: '0 0 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 16px' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', marginBottom: isMobile ? 14 : 20,
          }}>
            <div>
              <h2 style={{ fontSize: isMobile ? 18 : 32, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
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
            gap: isMobile ? 10 : 18,
          }}>
            {STUDENT_FAVORITES.map(p => (
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
              borderRadius: 16,
              padding: isMobile ? '24px 20px' : '36px',
              display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
              minHeight: isMobile ? 220 : 280,
              position: 'relative', overflow: 'hidden',
            }}>
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=900&q=80"
                alt="Semester Kit"
                style={{
                  position: 'absolute', inset: 0,
                  width: '100%', height: '100%', objectFit: 'cover',
                  display: 'block',
                }}
              />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(20,20,20,0.92) 0%, rgba(20,20,20,0.4) 60%, rgba(20,20,20,0.2) 100%)',
              }} />
              <div style={{
                position: 'absolute', top: 16, right: 16,
                fontSize: isMobile ? 48 : 72, fontWeight: 900,
                color: 'rgba(255,255,255,0.12)', lineHeight: 1, userSelect: 'none',
              }}>
                FLASH
              </div>
              <div style={{ position: 'relative', zIndex: 2 }}>
                <span style={{
                  backgroundColor: 'var(--amber)', color: 'white',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
                  padding: '4px 10px', borderRadius: 4,
                  width: 'fit-content', marginBottom: 10, display: 'inline-block',
                }}>
                  WEEKEND SPECIAL
                </span>
                <h3 style={{
                  fontSize: isMobile ? 20 : 26, fontWeight: 900,
                  color: 'white', lineHeight: 1.2, marginBottom: 8,
                }}>
                  The Ultimate<br />Semester Kit
                </h3>
                <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, marginBottom: 16, lineHeight: 1.5 }}>
                  Essential food bundle for the new semester.
                </p>
                <button
                  onClick={() => navigate('/marketplace?filter=flash')}
                  style={{
                    backgroundColor: 'white', color: 'var(--charcoal)',
                    border: 'none', borderRadius: 'var(--radius-pill)',
                    padding: '11px 20px', fontWeight: 700, fontSize: 12,
                    cursor: 'pointer', width: 'fit-content', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  CLAIM DEAL ₦25,000
                </button>
              </div>
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Become a seller — hide for vendors */}
              {user?.role !== 'VENDOR' && (
                <div
                  onClick={() => navigate('/vendor-onboarding')}
                  style={{
                    backgroundColor: 'var(--amber)', borderRadius: 16,
                    padding: isMobile ? '18px 20px' : '24px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flex: 1, cursor: 'pointer',
                    minHeight: isMobile ? 90 : 120,
                  }}
                >
                  <div>
                    <h3 style={{
                      fontSize: isMobile ? 16 : 22, fontWeight: 900,
                      color: 'white', lineHeight: 1.2, marginBottom: 6,
                    }}>
                      BECOME A SELLER
                    </h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.85)',
                      fontSize: isMobile ? 11 : 12, lineHeight: 1.4, margin: 0,
                    }}>
                      Turn your hostel room into a business.
                    </p>
                  </div>
                  <div style={{ fontSize: isMobile ? 28 : 36, opacity: 0.3 }}>🏪</div>
                </div>
              )}

              {/* Vendor dashboard shortcut */}
              {user?.role === 'VENDOR' && (
                <div
                  onClick={() => navigate('/vendor/dashboard')}
                  style={{
                    backgroundColor: '#1A1A1A', borderRadius: 16,
                    padding: isMobile ? '18px 20px' : '24px',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flex: 1, cursor: 'pointer',
                    minHeight: isMobile ? 90 : 120,
                  }}
                >
                  <div>
                    <h3 style={{
                      fontSize: isMobile ? 16 : 22, fontWeight: 900,
                      color: 'white', lineHeight: 1.2, marginBottom: 6,
                    }}>
                      YOUR STORE
                    </h3>
                    <p style={{
                      color: 'rgba(255,255,255,0.6)',
                      fontSize: isMobile ? 11 : 12, lineHeight: 1.4, margin: 0,
                    }}>
                      Manage products, orders and earnings.
                    </p>
                  </div>
                  <ArrowRight size={24} color="rgba(255,255,255,0.4)" />
                </div>
              )}

              {/* Feature cards */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 10 : 12 }}>
                {FEATURES.map(f => (
                  <div key={f.title} style={{
                    backgroundColor: 'white', borderRadius: 14,
                    padding: isMobile ? '14px 12px' : '20px 18px',
                  }}>
                    <div style={{
                      width: isMobile ? 32 : 38, height: isMobile ? 32 : 38,
                      borderRadius: '50%', backgroundColor: 'var(--amber-pale)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--amber)', marginBottom: isMobile ? 8 : 10,
                    }}>
                      {f.icon}
                    </div>
                    <h4 style={{
                      fontSize: isMobile ? 10 : 12, fontWeight: 800,
                      letterSpacing: '0.04em', marginBottom: 4,
                    }}>
                      {f.title.toUpperCase()}
                    </h4>
                    <p style={{
                      fontSize: isMobile ? 10 : 11,
                      color: 'var(--gray-muted)', lineHeight: 1.5, margin: 0,
                    }}>
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