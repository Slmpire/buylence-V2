import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, DollarSign,
  Truck, Settings, Bell, User,
  Search, Menu, X, ChevronRight,
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'

const NAV = [
  { label: 'Overview', to: '/vendor/dashboard', icon: <LayoutDashboard size={15} /> },
  { label: 'My Products', to: '/vendor/products', icon: <Package size={15} /> },
  { label: 'Earnings', to: '/vendor/earnings', icon: <DollarSign size={15} /> },
  { label: 'Hall Deliveries', to: '/vendor/delivery', icon: <Truck size={15} /> },
  { label: 'Settings', to: '/vendor/settings', icon: <Settings size={15} /> },
]

export default function VendorLayout({ children, searchPlaceholder = 'Search...' }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [search, setSearch] = useState('')
  const [showMobileNav, setShowMobileNav] = useState(false)

  const activeLabel = NAV.find(n => n.to === location.pathname)?.label || 'Overview'

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4EF',
      fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Top bar (always visible) ── */}
      <div style={{
        height: 52, padding: isMobile ? '0 16px' : '0 0 0 160px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        backgroundColor: '#F7F4EF',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Mobile: hamburger + page title */}
        {isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => setShowMobileNav(s => !s)}
              style={{
                background: 'none', border: 'none',
                cursor: 'pointer', color: '#1D1D1D',
                display: 'flex', padding: 2,
              }}
            >
              {showMobileNav ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div>
              <p style={{ fontSize: 9, color: '#BE864B', fontWeight: 700, letterSpacing: '0.08em', margin: 0 }}>
                VENDOR PORTAL
              </p>
              <p style={{ fontSize: 13, fontWeight: 800, color: '#1D1D1D', margin: 0 }}>
                {activeLabel}
              </p>
            </div>
          </div>
        )}

        {/* Desktop: search bar */}
        {!isMobile && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 8, padding: '7px 14px',
            flex: 1, maxWidth: 340,
            marginLeft: 28,
          }}>
            <Search size={13} color="#9C9488" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                border: 'none', outline: 'none',
                fontSize: 12, backgroundColor: 'transparent',
                color: '#1D1D1D', width: '100%',
                fontFamily: 'Inter, sans-serif',
              }}
            />
          </div>
        )}

        {/* Right icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Bell size={17} color="#7F766B" style={{ cursor: 'pointer' }} />
          <div
            onClick={handleLogout}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: '#E4DDD3',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', cursor: 'pointer',
              color: '#7F766B',
            }}
          >
            <User size={16} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── Desktop Sidebar ── */}
        {!isMobile && (
          <div style={{
            width: 160, flexShrink: 0,
            backgroundColor: '#F7F4EF',
            borderRight: '1px solid rgba(0,0,0,0.06)',
            display: 'flex', flexDirection: 'column',
            minHeight: 'calc(100vh - 52px)',
            position: 'sticky', top: 52,
          }}>
            {/* Brand */}
            <div style={{ padding: '18px 16px 14px' }}>
              <Link to="/" style={{
                fontWeight: 900, fontSize: 13,
                color: '#1D1D1D', textDecoration: 'none',
                letterSpacing: '-0.3px', display: 'block', marginBottom: 2,
              }}>
                Shop Buylence
              </Link>
              <p style={{ fontSize: 9, color: '#BE864B', letterSpacing: '0.08em', margin: 0, fontWeight: 700 }}>
                DUAL ACCOUNT STATUS
              </p>
            </div>

            {/* Nav */}
            <div style={{ flex: 1, paddingTop: 4 }}>
              {NAV.map(item => {
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to} to={item.to}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '10px 16px', textDecoration: 'none',
                      borderLeft: `3px solid ${active ? '#BE864B' : 'transparent'}`,
                      backgroundColor: active ? 'rgba(190,134,75,0.05)' : 'transparent',
                      color: active ? '#1D1D1D' : '#9C9488',
                      fontSize: 12, fontWeight: active ? 700 : 400,
                      transition: 'all 0.15s',
                    }}
                  >
                    <span style={{ color: active ? '#BE864B' : '#9C9488' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                )
              })}
            </div>

            {/* Switch to buyer */}
            <div style={{ padding: '16px' }}>
              <button
                onClick={() => navigate('/dashboard')}
                style={{
                  width: '100%', padding: '9px',
                  backgroundColor: '#BE864B', color: 'white',
                  border: 'none', borderRadius: 7,
                  fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.04em', cursor: 'pointer',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                Switch to Buyer
              </button>
            </div>
          </div>
        )}

        {/* ── Mobile Nav Drawer ── */}
        {isMobile && showMobileNav && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 40,
            top: 52,
          }}>
            {/* Overlay */}
            <div
              onClick={() => setShowMobileNav(false)}
              style={{
                position: 'absolute', inset: 0,
                backgroundColor: 'rgba(0,0,0,0.3)',
              }}
            />

            {/* Drawer */}
            <div style={{
              position: 'absolute', left: 0, top: 0, bottom: 0,
              width: 240, backgroundColor: '#F7F4EF',
              display: 'flex', flexDirection: 'column',
              boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
              zIndex: 41,
            }}>
              {/* Brand */}
              <div style={{ padding: '20px 16px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                <Link to="/" style={{
                  fontWeight: 900, fontSize: 14, color: '#1D1D1D',
                  textDecoration: 'none', letterSpacing: '-0.3px', display: 'block', marginBottom: 2,
                }}>
                  Shop Buylence
                </Link>
                <p style={{ fontSize: 9, color: '#BE864B', letterSpacing: '0.08em', margin: '0 0 12px', fontWeight: 700 }}>
                  VENDOR PORTAL
                </p>
                {/* User info */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: '50%',
                    backgroundColor: '#BE864B',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: 'white',
                    fontSize: 14, fontWeight: 800, flexShrink: 0,
                  }}>
                    {user?.fullName?.charAt(0) || 'V'}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#1D1D1D' }}>
                      {user?.fullName || 'Vendor'}
                    </p>
                    <p style={{ fontSize: 10, color: '#9C9488', margin: 0 }}>
                      {user?.storeName || 'My Store'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Nav links */}
              <div style={{ flex: 1, paddingTop: 8 }}>
                {NAV.map(item => {
                  const active = location.pathname === item.to
                  return (
                    <Link
                      key={item.to} to={item.to}
                      onClick={() => setShowMobileNav(false)}
                      style={{
                        display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '13px 16px', textDecoration: 'none',
                        borderLeft: `3px solid ${active ? '#BE864B' : 'transparent'}`,
                        backgroundColor: active ? 'rgba(190,134,75,0.05)' : 'transparent',
                        color: active ? '#1D1D1D' : '#7F766B',
                        fontSize: 14, fontWeight: active ? 700 : 500,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: active ? '#BE864B' : '#9C9488' }}>{item.icon}</span>
                        {item.label}
                      </div>
                      {active && <ChevronRight size={14} color="#BE864B" />}
                    </Link>
                  )
                })}
              </div>

              {/* Mobile search */}
              <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  backgroundColor: 'white',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 8, padding: '9px 12px',
                  marginBottom: 12,
                }}>
                  <Search size={13} color="#9C9488" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    style={{
                      border: 'none', outline: 'none',
                      fontSize: 13, backgroundColor: 'transparent',
                      color: '#1D1D1D', width: '100%',
                      fontFamily: 'Inter, sans-serif',
                    }}
                  />
                </div>

                <button
                  onClick={() => { navigate('/dashboard'); setShowMobileNav(false) }}
                  style={{
                    width: '100%', padding: '11px',
                    backgroundColor: '#BE864B', color: 'white',
                    border: 'none', borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    marginBottom: 8,
                  }}
                >
                  Switch to Buyer
                </button>

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', padding: '10px',
                    backgroundColor: '#FEF2F2', color: '#DC2626',
                    border: '1px solid #FECACA', borderRadius: 8,
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Page content ── */}
        <div style={{ flex: 1, padding: isMobile ? '20px 16px 64px' : '28px 28px 64px', overflowY: 'auto', minWidth: 0 }}>
          {children}
        </div>
      </div>
    </div>
  )
}