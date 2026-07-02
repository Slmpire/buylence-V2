import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Search, ShoppingCart, Bell, User, LogOut, Menu, X } from 'lucide-react'
import { useState } from 'react'
import useCartStore from '../../store/cartStore'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'

export default function Navbar() {
  const [query, setQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const cartCount = useCartStore(s => s.items.reduce((t, i) => t + i.qty, 0))
  const { isLoggedIn, user, logout } = useAuthStore()
  const isMobile = useIsMobile()

  function handleSearch(e) {
    e.preventDefault()
    if (query.trim()) navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setShowMobileMenu(false)
  }

  function handleLogout() {
    logout()
    setShowUserMenu(false)
    setShowMobileMenu(false)
    navigate('/')
  }

  const NAV_LINKS = [
    { label: 'MARKETPLACE', to: '/marketplace' },
    { label: 'SPECIAL DEALS', to: '/marketplace' },
    { label: 'VENDORS', to: '/vendors' },
  ]

  const isActive = (to) => location.pathname === to

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
          padding: '0 28px', height: 60,
          display: 'flex', alignItems: 'center',
          gap: 32,
        }}>

          {/* ── Logo ── */}
          <Link to="/" style={{
            fontWeight: 900, fontSize: 17,
            letterSpacing: '-0.5px', color: '#1A1A1A',
            textDecoration: 'none', flexShrink: 0,
          }}>
            BUYLENCE
          </Link>

          {/* ── Desktop nav links ── */}
          {!isMobile && (
            <div style={{ display: 'flex', gap: 28, alignItems: 'center', flexShrink: 0 }}>
              {NAV_LINKS.map(({ label, to }) => {
                const active = label === 'SHOP'
                  ? location.pathname === '/marketplace' || location.pathname === '/'
                  : location.pathname === to

                return (
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
                    onMouseEnter={e => {
                      if (!active) {
                        e.currentTarget.style.color = '#1A1A1A'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!active) {
                        e.currentTarget.style.color = '#888'
                      }
                    }}
                  >
                    {label}
                  </Link>
                )
              })}
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
                maxWidth: 420,
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

          {/* ── Right icons ── */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: isMobile ? 14 : 20, marginLeft: 'auto',
            flexShrink: 0,
          }}>

            {/* Cart */}
            <Link
              to="/cart"
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
            {!isMobile && (
              <Bell size={20} strokeWidth={1.8} color="#555" style={{ cursor: 'pointer' }} />
            )}

            {/* User / Auth */}
            {!isMobile && (
              isLoggedIn ? (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowUserMenu(s => !s)}
                    style={{
                      background: 'none', border: 'none',
                      cursor: 'pointer', display: 'flex',
                      padding: 0,
                    }}
                  >
                    <User size={20} strokeWidth={1.8} color="#555" />
                  </button>

                  {showUserMenu && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 12px)', right: 0,
                      backgroundColor: 'white',
                      border: '1px solid #F0EDE8',
                      borderRadius: 12, padding: '8px 0',
                      minWidth: 210,
                      boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
                      zIndex: 200,
                    }}>
                      {/* User info header */}
                      <div style={{ padding: '10px 16px 12px', borderBottom: '1px solid #F0EDE8' }}>
                        <p style={{ fontSize: 13, fontWeight: 700, margin: 0, color: '#1A1A1A' }}>
                          {user?.fullName}
                        </p>
                        <p style={{ fontSize: 11, color: '#9C9488', margin: '2px 0 0' }}>
                          {user?.email}
                        </p>
                      </div>

                      {[
                        { label: 'My Profile', to: '/profile' },
                        { label: 'My Dashboard', to: '/dashboard' },
                        { label: 'My Orders', to: '/orders' },
                        { label: 'Account Settings', to: '/user-settings' },
                        ...(user?.role === 'vendor' ? [
                          { label: 'Vendor Dashboard', to: '/vendor/dashboard' },
                          { label: 'My Products', to: '/vendor/products' },
                        ] : [
                          { label: 'Become a Vendor', to: '/vendor-onboarding' },
                        ]),
                      ].map(item => (
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
                  )}
                </div>
              ) : (
                <Link to="/login" style={{ display: 'flex', textDecoration: 'none' }}>
                  <User size={20} strokeWidth={1.8} color="#555" />
                </Link>
              )
            )}

            {/* Mobile hamburger */}
            {isMobile && (
              <button
                onClick={() => setShowMobileMenu(s => !s)}
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
            {[
              { label: 'Home', to: '/' },
              { label: 'Shop', to: '/marketplace' },
              { label: 'Categories', to: '/marketplace' },
              { label: 'Vendors', to: '/vendors' },
              ...(isLoggedIn ? [
                { label: 'My Orders', to: '/orders' },
                { label: 'My Profile', to: '/profile' },
                { label: 'My Dashboard', to: '/dashboard' },
                { label: 'Account Settings', to: '/user-settings' },
              ] : []),
              ...(isLoggedIn && user?.role === 'vendor' ? [
                { label: 'Vendor Dashboard', to: '/vendor/dashboard' },
                { label: 'My Products', to: '/vendor/products' },
              ] : []),
            ].map(item => (
              <Link
                key={item.to + item.label}
                to={item.to}
                onClick={() => setShowMobileMenu(false)}
                style={{
                  padding: '14px 4px',
                  fontSize: 16, fontWeight: 600,
                  color: '#1A1A1A', textDecoration: 'none',
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
    </>
  )
}