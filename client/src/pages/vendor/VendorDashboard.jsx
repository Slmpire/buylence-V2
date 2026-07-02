import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import VendorLayout from '../../components/vendor/VendorLayout'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const STATUS = {
  PLACED: { label: 'PLACED', color: '#D97706', bg: '#FFFBEB' },
  PREPARING: { label: 'PREPARING', color: '#2563EB', bg: '#EFF6FF' },
  READY_FOR_PICKUP: { label: 'READY', color: '#C2410C', bg: '#FFF7ED' },
  ASSIGNED_TO_RIDER: { label: 'IN TRANSIT', color: '#7C3AED', bg: '#F5F3FF' },
  PICKED_UP: { label: 'IN TRANSIT', color: '#7C3AED', bg: '#F5F3FF' },
  DELIVERED_BY_RIDER: { label: 'DELIVERED', color: '#16A34A', bg: '#F0FDF4' },
  CONFIRMED_BY_BUYER: { label: 'COMPLETED', color: '#16A34A', bg: '#F0FDF4' },
  CANCELLED: { label: 'CANCELLED', color: '#DC2626', bg: '#FEF2F2' },
}

export function DashboardContent({ isPlus = false }) {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendors/me/dashboard')
      .then(res => setDashboard(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const firstName = user?.fullName?.split(' ')[0] || 'Vendor'
  const recentOrders = dashboard?.recentOrders || []
  const totalProducts = dashboard?.totalProducts || 0
  const activeOrders = dashboard?.activeOrders || 0
  const totalEarnings = dashboard?.totalEarnings || 0

  return (
    <div>
      {/* Add product button — mobile */}
      {isMobile && (
        <button
          onClick={() => navigate('/vendor/products/new')}
          style={{
            width: '100%', padding: '12px',
            backgroundColor: '#BE864B', color: 'white',
            border: 'none', borderRadius: 8,
            fontSize: 13, fontWeight: 700,
            cursor: 'pointer', letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6,
            marginBottom: 16,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <Plus size={15} /> Add New Product
        </button>
      )}

      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, #D4C4B0 0%, #C8B89A 50%, #B8A888 100%)',
        borderRadius: 14, padding: isMobile ? '22px 20px' : '28px 28px 24px',
        marginBottom: 20, position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', top: 0, right: 0, bottom: 0, width: '40%',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '60% 0 0 60%',
        }} />
        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>
          DAILY PERFORMANCE
        </p>
        <h2 style={{
          fontSize: isMobile ? 20 : 26, fontWeight: 900, color: 'white',
          lineHeight: 1.2, marginBottom: 10, letterSpacing: '-0.3px',
        }}>
          Hello, {firstName}.<br />
          Your shop is{' '}
          <span style={{ color: '#1D1D1D' }}>
            {activeOrders > 0 ? 'thriving' : 'ready'} today.
          </span>
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 1.6, margin: 0 }}>
          {loading
            ? 'Loading your store stats...'
            : activeOrders > 0
              ? `You have ${activeOrders} active order${activeOrders !== 1 ? 's' : ''} right now.`
              : 'No active orders right now. Share your store link to get orders!'
          }
        </p>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr',
        gap: isMobile ? 10 : 14, marginBottom: isMobile ? 20 : 28,
      }}>
        {[
          {
            label: 'TOTAL PRODUCTS', value: loading ? '—' : String(totalProducts),
            badge: 'IN STORE', badgeColor: '#16A34A', badgeBg: '#F0FDF4',
            icon: '📦', dark: false,
          },
          {
            label: 'ACTIVE ORDERS', value: loading ? '—' : String(activeOrders),
            badge: activeOrders > 5 ? 'HIGH VOLUME' : 'LIVE',
            badgeColor: '#2563EB', badgeBg: '#EFF6FF',
            icon: '🔄', dark: false,
          },
          {
            label: 'TOTAL EARNINGS', value: loading ? '—' : `₦${totalEarnings.toLocaleString()}`,
            badge: 'ALL TIME', badgeColor: 'rgba(255,255,255,0.7)', badgeBg: 'rgba(255,255,255,0.15)',
            icon: '💰', dark: true,
          },
        ].map((stat, i) => (
          <div
            key={stat.label}
            style={{
              backgroundColor: stat.dark ? '#BE864B' : 'white',
              borderRadius: 12, padding: isMobile ? '14px' : '18px 18px 20px',
              border: stat.dark ? 'none' : '1px solid rgba(0,0,0,0.06)',
              gridColumn: isMobile && i === 2 ? 'span 2' : 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: isMobile ? 10 : 14 }}>
              <span style={{ fontSize: isMobile ? 16 : 20 }}>{stat.icon}</span>
              <span style={{
                fontSize: isMobile ? 8 : 9, fontWeight: 800, letterSpacing: '0.06em',
                padding: '3px 7px', borderRadius: 4,
                backgroundColor: stat.badgeBg, color: stat.badgeColor,
              }}>
                {stat.badge}
              </span>
            </div>
            <p style={{
              fontSize: isMobile ? 9 : 10, fontWeight: 700, letterSpacing: '0.1em', marginBottom: 6,
              color: stat.dark ? 'rgba(255,255,255,0.7)' : '#9C9488',
            }}>
              {stat.label}
            </p>
            <p style={{
              fontSize: isMobile ? 22 : 30, fontWeight: 900, margin: 0,
              color: stat.dark ? 'white' : '#1D1D1D', letterSpacing: '-0.5px',
            }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: 14, padding: isMobile ? '16px' : '20px 22px',
        border: '1px solid rgba(0,0,0,0.06)',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <h2 style={{ fontSize: isMobile ? 14 : 15, fontWeight: 800, margin: 0 }}>Recent Orders</h2>
          <Link to="/vendor/delivery" style={{ fontSize: 11, color: '#BE864B', textDecoration: 'none', fontWeight: 700, letterSpacing: '0.06em' }}>
            VIEW ALL
          </Link>
        </div>
        {!isMobile && (
          <p style={{ fontSize: 11, color: '#9C9488', marginBottom: 16 }}>Managing your latest campus deliveries</p>
        )}

        {loading ? (
          <p style={{ fontSize: 12, color: '#9C9488', textAlign: 'center', padding: '20px 0' }}>Loading orders...</p>
        ) : recentOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: 13, color: '#9C9488', marginBottom: 12 }}>No orders yet.</p>
            <button
              onClick={() => navigate('/vendor/products/new')}
              style={{
                padding: '9px 20px', backgroundColor: '#1D1D1D', color: 'white',
                border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              ADD YOUR FIRST PRODUCT
            </button>
          </div>
        ) : isMobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 12 }}>
            {recentOrders.map((order, i) => {
              const st = STATUS[order.status] || STATUS.PLACED
              const img = order.items?.[0]?.product?.images?.[0] ||
                'https://images.unsplash.com/photo-1546173159-315724a31696?w=100&q=80'
              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 0', cursor: 'pointer',
                    borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                  }}
                >
                  <img src={img} alt="" style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                      {order.items?.[0]?.name || 'Order'}
                    </p>
                    <p style={{ fontSize: 11, color: '#7F766B', margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {order.buyer?.fullName || 'Customer'} · {order.deliveryHall}
                    </p>
                    <span style={{
                      fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                      padding: '3px 7px', borderRadius: 4,
                      backgroundColor: st.bg, color: st.color,
                    }}>
                      {st.label}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, fontWeight: 800, color: '#BE864B', margin: 0, flexShrink: 0 }}>
                    ₦{order.total?.toLocaleString()}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: '110px 1fr 1fr 90px 110px',
              padding: '8px 4px', borderBottom: '1px solid rgba(0,0,0,0.05)', marginBottom: 4,
            }}>
              {['ORDER ID', 'PRODUCT', 'CUSTOMER', 'AMOUNT', 'STATUS'].map(h => (
                <p key={h} style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#9C9488', margin: 0 }}>{h}</p>
              ))}
            </div>
            {recentOrders.map((order, i) => {
              const st = STATUS[order.status] || STATUS.PLACED
              const img = order.items?.[0]?.product?.images?.[0] ||
                'https://images.unsplash.com/photo-1546173159-315724a31696?w=100&q=80'
              return (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '110px 1fr 1fr 90px 110px',
                    padding: '12px 4px',
                    borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    alignItems: 'center', cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#FAFAF8'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#BE864B', margin: 0 }}>
                    {order.orderNumber}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={img} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                    <p style={{ fontSize: 12, fontWeight: 600, margin: 0, color: '#1D1D1D' }}>
                      {order.items?.[0]?.name || '—'}
                    </p>
                  </div>
                  <p style={{ fontSize: 12, color: '#7F766B', margin: 0 }}>
                    {order.buyer?.fullName || 'Customer'} · {order.deliveryHall}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1D', margin: 0 }}>
                    ₦{order.total?.toLocaleString()}
                  </p>
                  <span style={{
                    fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
                    padding: '4px 8px', borderRadius: 4,
                    backgroundColor: st.bg, color: st.color,
                    display: 'inline-block',
                  }}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>

      {/* Quick actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: 10,
      }}>
        {[
          { label: 'Add Product', emoji: '➕', to: '/vendor/products/new' },
          { label: 'My Products', emoji: '📦', to: '/vendor/products' },
          { label: 'Earnings', emoji: '💰', to: '/vendor/earnings' },
          { label: 'Settings', emoji: '⚙️', to: '/vendor/settings' },
        ].map(action => (
          <button
            key={action.label}
            onClick={() => navigate(action.to)}
            style={{
              padding: '14px 10px', backgroundColor: 'white',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 10, cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: 6,
              fontFamily: 'Inter, sans-serif',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#BE864B'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(0,0,0,0.07)'}
          >
            <span style={{ fontSize: 20 }}>{action.emoji}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1D1D1D' }}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default function VendorDashboard() {
  return (
    <VendorLayout searchPlaceholder="Search orders...">
      <DashboardContent />
    </VendorLayout>
  )
}