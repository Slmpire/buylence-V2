import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Clock, DollarSign, Bell, User, Menu, X } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'

const NAV = [
  { label: 'Dashboard', to: '/rider/dashboard', icon: <LayoutDashboard size={15} /> },
  { label: 'History', to: '/rider/history', icon: <Clock size={15} /> },
  { label: 'Earnings', to: '/rider/earnings', icon: <DollarSign size={15} /> },
]

export default function RiderLayout({ children }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const isMobile = useIsMobile()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const firstName = user?.fullName?.split(' ')[0] || 'Rider'

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4EF',
      display: 'flex', fontFamily: 'Inter, sans-serif',
    }}>
      {/* ── Sidebar (desktop) ── */}
      {!isMobile && (
        <div style={{
          width: 180, flexShrink: 0,
          backgroundColor: '#1A1A1A',
          display: 'flex', flexDirection: 'column',
          minHeight: '100vh', position: 'sticky', top: 0,
        }}>
          {/* Brand */}
          <div style={{ padding: '20px 16px 16px' }}>
            <Link to="/" style={{
              fontWeight: 900, fontSize: 14,
              color: 'white', textDecoration: 'none',
              letterSpacing: '-0.3px', display: 'block', marginBottom: 2,
            }}>
              BUYLENCE
            </Link>
            <p style={{ fontSize: 9, color: '#BE864B', letterSpacing: '0.1em', margin: 0, fontWeight: 700 }}>
              RIDER PORTAL
            </p>
          </div>

          {/* Rider info */}
          <div style={{
            margin: '0 12px 16px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 10, padding: '12px',
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: '#BE864B',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: 'white',
              fontSize: 14, fontWeight: 900, marginBottom: 8,
            }}>
              {firstName.charAt(0)}
            </div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'white', margin: '0 0 2px' }}>
              {user?.fullName || 'Rider'}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Campus Rider
            </p>
          </div>

          {/* Nav */}
          <div style={{ flex: 1 }}>
            {NAV.map(item => {
              const active = location.pathname === item.to
              return (
                <Link
                  key={item.to} to={item.to}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 16px', textDecoration: 'none',
                    borderLeft: `3px solid ${active ? '#BE864B' : 'transparent'}`,
                    backgroundColor: active ? 'rgba(190,134,75,0.1)' : 'transparent',
                    color: active ? '#BE864B' : 'rgba(255,255,255,0.6)',
                    fontSize: 13, fontWeight: active ? 700 : 400,
                    transition: 'all 0.15s',
                  }}
                >
                  {item.icon} {item.label}
                </Link>
              )
            })}
          </div>

          {/* Logout */}
          <div style={{ padding: '16px' }}>
            <button
              onClick={handleLogout}
              style={{
                width: '100%', padding: '9px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)',
                border: 'none', borderRadius: 7,
                fontSize: 12, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* Top bar */}
        <div style={{
          height: 52, padding: '0 20px',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
          backgroundColor: '#F7F4EF',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          {isMobile ? (
            <>
              <div>
                <p style={{ fontSize: 13, fontWeight: 900, margin: 0, letterSpacing: '-0.3px' }}>
                  BUYLENCE <span style={{ color: '#BE864B', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em' }}>RIDER</span>
                </p>
              </div>
              <button
                onClick={() => setMenuOpen(o => !o)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1A1A1A', display: 'flex' }}
              >
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 13, color: '#9C9488', margin: 0 }}>
                Welcome back, <strong style={{ color: '#1A1A1A' }}>{firstName}</strong>
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Bell size={17} color="#7F766B" style={{ cursor: 'pointer' }} />
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  backgroundColor: '#BE864B',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'white',
                  fontSize: 12, fontWeight: 900, cursor: 'pointer',
                }}>
                  {firstName.charAt(0)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mobile menu overlay */}
        {isMobile && menuOpen && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            backgroundColor: '#1A1A1A',
            display: 'flex', flexDirection: 'column',
            padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
              <p style={{ fontSize: 16, fontWeight: 900, color: 'white', margin: 0 }}>BUYLENCE RIDER</p>
              <button
                onClick={() => setMenuOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', display: 'flex' }}
              >
                <X size={24} />
              </button>
            </div>
            {NAV.map(item => (
              <Link
                key={item.to} to={item.to}
                onClick={() => setMenuOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 0', textDecoration: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  color: location.pathname === item.to ? '#BE864B' : 'rgba(255,255,255,0.7)',
                  fontSize: 16, fontWeight: location.pathname === item.to ? 700 : 400,
                }}
              >
                {item.icon} {item.label}
              </Link>
            ))}
            <button
              onClick={handleLogout}
              style={{
                marginTop: 32, padding: '14px',
                backgroundColor: 'rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)',
                border: 'none', borderRadius: 10,
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Page content */}
        <div style={{ flex: 1, padding: '28px 24px 64px', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}