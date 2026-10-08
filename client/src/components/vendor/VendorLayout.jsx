import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import NotificationDrawer from '../common/NotificationDrawer'
import useUnreadCount from '../../hooks/useUnreadCount'

import {
  LayoutDashboard, Package, DollarSign,
  Truck, Settings, Bell, User,
  Search, Menu, X, ChevronRight, LogOut, Store, ArrowLeftRight,
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
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileRef = useRef(null)
    const [showNotifications, setShowNotifications] = useState(false)
  const { unreadCount, setUnreadCount } = useUnreadCount()

  const activeLabel = NAV.find(n => n.to === location.pathname)?.label || 'Overview'
  const storeName = user?.vendor?.storeName || user?.storeName || 'My Store'
  const initial = user?.fullName?.charAt(0)?.toUpperCase() || 'V'

  // Close the profile menu when clicking outside it or pressing Escape
  useEffect(() => {
    if (!showProfileMenu) return
    function onPointerDown(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false)
      }
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setShowProfileMenu(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [showProfileMenu])

  async function handleLogout() {
    setShowProfileMenu(false)
    setShowMobileNav(false)
    await logout()
    navigate('/login')
  }

  function go(path) {
    setShowProfileMenu(false)
    setShowMobileNav(false)
    navigate(path)
  }

  const menuItemStyle = {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '10px 14px', background: 'none', border: 'none',
    fontSize: 13, fontWeight: 600, color: '#1D1D1D',
    cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter, sans-serif',
  }

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4EF',
      fontFamily: 'Inter, sans-serif',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Top bar (always visible) ── */}
      <div style={{
        height: 52, padding: isMobile ? '0 16px' : '0 16px 0 160px',
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
              aria-label="Toggle menu"
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
                    <button
            onClick={() => setShowNotifications(true)}
            aria-label="Notifications"
            style={{
              position: 'relative', background: 'none', border: 'none',
              cursor: 'pointer', display: 'flex', padding: 2,
            }}
          >
            <Bell size={17} color="#7F766B" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -7,
                minWidth: 18, height: 18, padding: '0 4px',
                boxSizing: 'border-box',
                borderRadius: 9, backgroundColor: '#DC2626', color: 'white',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid #F7F4EF',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Profile menu */}
          <div ref={profileRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowProfileMenu(s => !s)}
              aria-label="Account menu"
              aria-expanded={showProfileMenu}
              style={{
                width: 32, height: 32, borderRadius: '50%',
                backgroundColor: showProfileMenu ? '#BE864B' : '#E4DDD3',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer',
                color: showProfileMenu ? 'white' : '#7F766B',
                border: 'none', padding: 0,
                transition: 'all 0.15s',
              }}
            >
              <User size={16} />
            </button>

            {showProfileMenu && (
              <div style={{
                position: 'absolute', right: 0, top: 40,
                width: 220, backgroundColor: 'white',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
                overflow: 'hidden', zIndex: 60,
              }}>
                {/* Who is signed in */}
                <div style={{ padding: '14px', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                  <p style={{ fontSize: 13, fontWeight: 800, margin: '0 0 2px', color: '#1D1D1D' }}>
                    {user?.fullName || 'Vendor'}
                  </p>
                  <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>{storeName}</p>
                </div>

                <button style={menuItemStyle} onClick={() => go('/profile')}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F4EF'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <User size={15} color="#9C9488" /> My profile
                </button>
                <button style={menuItemStyle} onClick={() => go('/vendor/settings')}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F4EF'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <Store size={15} color="#9C9488" /> Store settings
                </button>
                <button style={menuItemStyle} onClick={() => go('/dashboard')}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F4EF'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <ArrowLeftRight size={15} color="#9C9488" /> Switch to Buyer
                </button>

                <div style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                  <button style={{ ...menuItemStyle, color: '#DC2626' }} onClick={handleLogout}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <LogOut size={15} color="#DC2626" /> Sign out
                  </button>
                </div>
              </div>
            )}
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

            {/* Switch to buyer + sign out */}
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
                  marginBottom: 8,
                }}
              >
                Switch to Buyer
              </button>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '8px',
                  backgroundColor: 'transparent', color: '#DC2626',
                  border: '1px solid #FECACA', borderRadius: 7,
                  fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                Sign Out
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
                    {initial}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#1D1D1D' }}>
                      {user?.fullName || 'Vendor'}
                    </p>
                    <p style={{ fontSize: 10, color: '#9C9488', margin: 0 }}>
                      {storeName}
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
            <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationChange={setUnreadCount}
      />
    </div>
  )
}