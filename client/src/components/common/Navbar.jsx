import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, ShoppingCart, Bell, User, LogOut, Menu, X,
  Store, LayoutDashboard, Bike, ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import useUnreadCount from '../../hooks/useUnreadCount'
import NotificationDrawer from './NotificationDrawer'
import Logo from './Logo'

// The "go to my area" shortcut depends on who is signed in
function getPortalLink(user) {
  switch (user?.role) {
    case 'VENDOR':
      return { label: 'Vendor Dashboard', to: '/vendor/dashboard', icon: <LayoutDashboard size={14} /> }
    case 'RIDER':
      return { label: 'Rider Portal', to: '/rider/dashboard', icon: <Bike size={14} /> }
    case 'ADMIN':
      return { label: 'Admin', to: '/admin/dashboard', icon: <ShieldCheck size={14} /> }
    default:
      return { label: 'Sell on Buylence', to: '/vendor-onboarding', icon: <Store size={14} /> }
  }
}

function BellButton({ count, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Notifications"
      style={{
        position: 'relative', background: 'none', border: 'none',
        cursor: 'pointer', display: 'flex', padding: 0,
      }}
    >
      <Bell size={20} strokeWidth={1.8} color="#555" />
      {count > 0 && (
        <span style={{
          position: 'absolute', top: -6, right: -8,
          minWidth: 18, height: 18, padding: '0 4px',
          boxSizing: 'border-box',
          borderRadius: 9, backgroundColor: '#DC2626', color: 'white',
          fontSize: 9, fontWeight: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid white',
        }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </button>
  )
}

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)

  const navigate = useNavigate()
  const location = useLocation()
  const cartCount = useCartStore(s => s.items.reduce((t, i) => t + i.qty, 0))
  const { isLoggedIn, user, logout } = useAuthStore()
  const { unreadCount, setUnreadCount } = useUnreadCount()
  const isMobile = useIsMobile()

  const portal = getPortalLink(user)

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setShowMobileMenu(false)
  }

  async function handleLogout() {
    setShowUserMenu(false)
    setShowMobileMenu(false)
    await logout()
    navigate('/')
  }

  // "SPECIAL DEALS" points at the marketplace until it gets its own page
  const NAV_LINKS = [
    {
      label: 'MARKETPLACE',
      to: '/marketplace',
      active: location.pathname === '/marketplace' || location.pathname.startsWith('/category'),
    },
    { label: 'SPECIAL DEALS', to: '/marketplace', active: location.pathname === '/special-deals' },
    { label: 'VENDORS', to: '/vendors', active: location.pathname.startsWith('/vendor/') || location.pathname === '/vendors' },
  ]

  const userMenuItems = [
    { label: 'My Profile', to: '/profile' },
    { label: 'My Dashboard', to: '/dashboard' },
    { label: 'My Orders', to: '/orders' },
    { label: 'Account Settings', to: '/user-settings' },
    ...(user?.role === 'VENDOR'
      ? [
          { label: 'Vendor Dashboard', to: '/vendor/dashboard' },
          { label: 'My Products', to: '/vendor/products' },
        ]
      : user?.role === 'RIDER'
        ? [{ label: 'Rider Portal', to: '/rider/dashboard' }]
        : user?.role === 'ADMIN'
          ? [{ label: 'Admin Dashboard', to: '/admin/dashboard' }]
          : [{ label: 'Become a Vendor', to: '/vendor-onboarding' }]),
  ]

  const mobileLinks = [
    { label: 'Home', to: '/' },
    { label: 'Marketplace', to: '/marketplace' },
    { label: 'Special Deals', to: '/marketplace' },
    { label: 'Vendors', to: '/vendors' },
    { label: portal.label, to: portal.to },
    ...(isLoggedIn
      ? [
          { label: 'My Orders', to: '/orders' },
          { label: 'My Profile', to: '/profile' },
          { label: 'My Dashboard', to: '/dashboard' },
          { label: 'Account Settings', to: '/user-settings' },
        ]
      : []),
  ]

  return (
    <>
      <nav style={{
        backgroundColor: 'white',
        borderBottom: '1px solid #F0EDE8',
        position: 'sticky', top: 0, zIndex: 100,
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          padding: isMobile ? '0 16px' : '0 28px', height: 60,
          display: 'flex', alignItems: 'center',
          gap: isMobile ? 12 : 28,
        }}>

          {/* ── Logo (always goes home) ── */}
          <Logo size={isMobile ? 30 : 34} textSize={isMobile ? 15 : 17} />

          {/* ── Desktop nav links ── */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', flexShrink: 0 }}>
              {NAV_LINKS.map(({ label, to, active }) => (
                <Link
                  key={label}
                  to={to}
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: active ? '#BE6B1A' : '#888',
                    textDecoration: 'none',
                    letterSpacing: '0.04em',
                    paddingBottom: 4,
                    borderBottom: active ? '2px solid #BE6B1A' : '2px solid transparent',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = '#1A1A1A' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = '#888' }}
                >
                  {label}
                </Link>
              ))}
            </div>
          )}

          {/* ── Search bar ── */}
          {!isMobile && (
            <form
              onSubmit={handleSearch}
              style={{
                flex: 1,
                display: 'flex', alignItems: 'center', gap: 10,
                backgroundColor: '#F5F3F0',
                borderRadius: 999,
                padding: '10px 18px',
                maxWidth: 380,
              }}
            >
              <Search size={15} color="#AAAAAA" style={{ flexShrink: 0 }} />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search campus fresh produce..."
                style={{
                  border: 'none', outline: 'none',
                  fontSize: 13, color: '#1A1A1A',
                  backgroundColor: 'transparent',
                  width: '100%',
                  fontFamily: 'Inter, sans-serif',
                }}
              />
            </form>
          )}

          {/* ── Right side ── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: isMobile ? 14 : 18, marginLeft: 'auto',
            flexShrink: 0,
          }}>

            {/* Portal shortcut: Vendor Dashboard / Rider Portal / Admin / Sell */}
            {!isMobile && (
              <Link
                to={portal.to}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 999,
                  border: '1.5px solid #BE6B1A',
                  color: '#BE6B1A', fontSize: 12, fontWeight: 800,
                  textDecoration: 'none', letterSpacing: '0.03em',
                  whiteSpace: 'nowrap', transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#BE6B1A'
                  e.currentTarget.style.color = 'white'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.color = '#BE6B1A'
                }}
              >
                {portal.icon} {portal.label}
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              aria-label="Cart"
              style={{ position: 'relative', color: '#1A1A1A', display: 'flex', textDecoration: 'none' }}
            >
              <ShoppingCart size={20} strokeWidth={1.8} color="#555" />
              {cartCount > 0 && (
                <span style={{
                  position: 'absolute', top: -5, right: -6,
                  backgroundColor: '#BE6B1A', color: 'white',
                  fontSize: 9, fontWeight: 800,
                  width: 15, height: 15, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Bell */}
            {isLoggedIn && (
              <BellButton count={unreadCount} onClick={() => setShowNotifications(true)} />
            )}

            {/* User / Auth (desktop) */}
            {!isMobile && (
              isLoggedIn ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowUserMenu(s => !s)}
                    aria-label="Account menu"
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', display: 'flex',
                      padding: 0,
                    }}
                  >
                    <User size={20} strokeWidth={1.8} color="#555" />
                  </button>

                  {showUserMenu && (
                    <>
                      {/* click-away layer */}
                      <div
                        onClick={() => setShowUserMenu(false)}
                        style={{ position: 'fixed', inset: 0, zIndex: 150 }}
                      />
                      <div style={{
                        position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                        backgroundColor: 'white',
                        border: '1px solid #F0EDE8',
                        borderRadius: 12, padding: '8px 0',
                        minWidth: 210,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                        zIndex: 200,
                      }}>
                        <div style={{ padding: '10px 16px 12px', borderBottom: '1px solid #F0EDE8' }}>
                          <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#1A1A1A' }}>
                            {user?.fullName}
                          </p>
                          <p style={{ fontSize: 11, color: '#9C9488', margin: '2px 0 0' }}>
                            {user?.email}
                          </p>
                        </div>

                        {userMenuItems.map(item => (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={() => setShowUserMenu(false)}
                            style={{
                              display: 'block', padding: '10px 16px',
                              fontSize: 13, fontWeight: 500,
                              color: '#1A1A1A', textDecoration: 'none',
                              transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F7F4EF'}
                            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            {item.label}
                          </Link>
                        ))}

                        <div style={{ borderTop: '1px solid #F0EDE8', margin: '6px 0' }} />
                        <button
                          onClick={handleLogout}
                          style={{
                            width: '100%', padding: '10px 16px',
                            background: 'none', border: 'none',
                            textAlign: 'left', cursor: 'pointer',
                            fontSize: 13, fontWeight: 500, color: '#E74C3C',
                            display: 'flex', alignItems: 'center', gap: 8,
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          <LogOut size={14} /> Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <Link
                  to="/login"
                  style={{
                    padding: '8px 16px', borderRadius: 999,
                    backgroundColor: '#1A1A1A', color: 'white',
                    fontSize: 12, fontWeight: 700, textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Log in
                </Link>
              )
            )}

            {/* Mobile hamburger */}
            {isMobile && (
              <button
                onClick={() => setShowMobileMenu(s => !s)}
                aria-label="Toggle menu"
                style={{
                  background: 'none', border: 'none',
                  cursor: 'pointer', color: '#1A1A1A',
                  display: 'flex', padding: 4,
                }}
              >
                {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile menu overlay ── */}
      {isMobile && showMobileMenu && (
        <div style={{
          position: 'fixed', top: 60, left: 0, right: 0, bottom: 0,
          zIndex: 99,
          backgroundColor: 'white',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          padding: '20px 20px 40px',
        }}>

          {/* Mobile search */}
          <form onSubmit={handleSearch} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            backgroundColor: '#F5F3F0',
            borderRadius: 999, padding: '11px 16px',
            marginBottom: 24,
          }}>
            <Search size={15} color="#AAAAAA" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search campus fresh produce..."
              style={{
                flex: 1, border: 'none', outline: 'none',
                fontSize: 14, backgroundColor: 'transparent',
                fontFamily: 'Inter, sans-serif', color: '#1A1A1A',
              }}
            />
          </form>

          {/* Mobile nav links */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 24 }}>
            {mobileLinks.map(item => (
              <Link
                key={item.to + item.label}
                to={item.to}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '14px 4px',
                  fontSize: 16, fontWeight: 600,
                  color: item.label === portal.label ? '#BE6B1A' : '#1A1A1A',
                  textDecoration: 'none',
                  borderBottom: '1px solid #F0EDE8',
                  display: 'block',
                }}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Mobile auth */}
          {isLoggedIn ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: '50%',
                  backgroundColor: '#BE6B1A',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'white',
                  fontSize: 18, fontWeight: 700,
                }}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{user?.fullName}</p>
                  <p style={{ fontSize: 12, color: '#9C9488', margin: 0 }}>{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                style={{
                  width: '100%', padding: '13px',
                  backgroundColor: '#FEF2F2', color: '#DC2626',
                  border: '1px solid #FECACA', borderRadius: 8,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8,
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                <LogOut size={16} /> Sign Out
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link
                to="/login"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '13px', textAlign: 'center',
                  border: '1.5px solid #E4DDD3', borderRadius: 8,
                  fontWeight: 700, fontSize: 14, color: '#1A1A1A',
                  textDecoration: 'none', backgroundColor: 'white',
                }}
              >
                Login
              </Link>
              <Link
                to="/signup"
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '13px', textAlign: 'center',
                  backgroundColor: '#1A1A1A', borderRadius: 8,
                  fontWeight: 700, fontSize: 14, color: 'white',
                  textDecoration: 'none',
                }}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}

      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationChange={setUnreadCount}
      />
    </>
  )
}