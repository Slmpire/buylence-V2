import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, User, MapPin, ArrowRight } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const STATUS_STYLE = {
  PLACED: { label: '● Placed', color: '#D97706' },
  PREPARING: { label: '● Preparing', color: '#2563EB' },
  READY_FOR_PICKUP: { label: '● Ready', color: '#C2410C' },
  ASSIGNED_TO_RIDER: { label: '● In Transit', color: '#D97706' },
  PICKED_UP: { label: '● In Transit', color: '#D97706' },
  DELIVERED_BY_RIDER: { label: '● Delivered', color: '#16A34A' },
  CONFIRMED_BY_BUYER: { label: '● Completed', color: '#16A34A' },
  CANCELLED: { label: '● Cancelled', color: '#DC2626' },
}

const ARCHIVE_IMGS = [
  'https://images.unsplash.com/photo-1574484284002-952d92456975?w=300&q=80',
  'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=300&q=80',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&q=80',
  'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=300&q=80',
]

export default function BuyerDashboard() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/orders?limit=5')
      .then(res => setOrders(res.data.orders || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const firstName = user?.fullName?.split(' ')[0] || 'Student'
  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0)
  const recentOrders = orders.slice(0, 3)

  // Build "order again" from most recent delivered orders
  const orderAgain = orders
    .filter(o => o.status === 'CONFIRMED_BY_BUYER')
    .slice(0, 2)
    .map(o => ({
      id: o.id,
      name: o.items?.[0]?.name || 'Previous order',
      vendor: o.vendor?.storeName || 'Campus Vendor',
      img: o.items?.[0]?.product?.images?.[0] ||
        'https://images.unsplash.com/photo-1574484284002-952d92456975?w=200&q=80',
      date: new Date(o.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }),
    }))

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4EF',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: isMobile ? '0 16px' : '0 32px',
        height: 52,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F7F4EF',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 16 : 32 }}>
          <Link to="/" style={{
            fontWeight: 900, fontSize: 13,
            letterSpacing: '0.06em', color: '#1D1D1D',
            textDecoration: 'none',
          }}>
            BUYLENCE ARCHIVE
          </Link>
          {!isMobile && ['Collections', 'Marketplace', 'Archives'].map(l => (
            <Link key={l} to="/marketplace" style={{
              fontSize: 13, color: '#7F766B',
              textDecoration: 'none', fontWeight: 500,
            }}>
              {l}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link to="/cart" style={{ color: '#1D1D1D', display: 'flex' }}>
            <ShoppingBag size={18} />
          </Link>
          <Link to="/profile" style={{ color: '#1D1D1D', display: 'flex' }}>
            <User size={18} />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{
        flex: 1,
        maxWidth: isMobile ? '100%' : 900,
        margin: '0 auto', width: '100%',
        padding: isMobile ? '24px 16px 48px' : '48px 32px',
      }}>

        {/* Hero */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr auto',
          gap: isMobile ? 20 : 32,
          alignItems: 'start', marginBottom: isMobile ? 24 : 40,
        }}>
          <div>
            <p style={{
              fontSize: 11, fontWeight: 700,
              letterSpacing: '0.12em', color: '#9C9488', marginBottom: 8,
            }}>
              THE STUDENT ARCHIVE
            </p>
            <h1 style={{
              fontSize: isMobile ? 28 : 40,
              fontWeight: 900, lineHeight: 1.05,
              letterSpacing: '-1px', margin: 0,
            }}>
              Welcome back,{' '}
              <span style={{ color: '#BE864B' }}>{firstName}.</span>
            </h1>
          </div>

          {/* Residence card */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 10,
            padding: isMobile ? '14px 16px' : '16px 20px',
            minWidth: isMobile ? 'auto' : 200,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <MapPin size={11} color="#BE864B" />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#9C9488' }}>
                CURRENT RESIDENCE
              </span>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, marginBottom: isMobile ? 8 : 10, color: '#1D1D1D' }}>
              {user?.hall || 'OAU Campus'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'TOTAL SPENT', val: `₦${totalSpent.toLocaleString()}` },
                { label: 'ORDERS', val: `${orders.length} Total` },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: 9, color: '#9C9488', letterSpacing: '0.08em', marginBottom: 2 }}>{s.label}</p>
                  <p style={{ fontSize: isMobile ? 12 : 13, fontWeight: 800, color: '#1D1D1D', margin: 0 }}>{s.val}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Again + Curated Archive */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 16, marginBottom: isMobile ? 28 : 40,
        }}>

          {/* Order Again */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12,
            padding: isMobile ? '16px' : '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Order Again</h2>
              <Link to="/orders" style={{ fontSize: 11, color: '#BE864B', textDecoration: 'none', fontWeight: 700 }}>
                VIEW HISTORY
              </Link>
            </div>

            {loading ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#9C9488' }}>Loading...</p>
              </div>
            ) : orderAgain.length === 0 ? (
              <div style={{ padding: '20px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#9C9488', marginBottom: 12 }}>No completed orders yet.</p>
                <button
                  onClick={() => navigate('/marketplace')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#1D1D1D', color: 'white',
                    border: 'none', borderRadius: 6,
                    fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  BROWSE MARKETPLACE
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {orderAgain.map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={item.img} alt={item.name}
                      style={{
                        width: isMobile ? 44 : 52,
                        height: isMobile ? 44 : 52,
                        borderRadius: 8, objectFit: 'cover', flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 11, color: '#9C9488', letterSpacing: '0.06em', marginBottom: 1 }}>
                        FROM {item.vendor.toUpperCase()}
                      </p>
                      <p style={{ fontSize: 13, fontWeight: 700, marginBottom: 1 }}>{item.name}</p>
                      <p style={{ fontSize: 11, color: '#9C9488' }}>Ordered {item.date}</p>
                    </div>
                    <button
                      onClick={() => navigate('/marketplace')}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1D1D1D', color: 'white',
                        border: 'none', borderRadius: 6,
                        fontSize: 10, fontWeight: 700,
                        cursor: 'pointer', flexShrink: 0,
                        fontFamily: 'Inter, sans-serif',
                      }}
                    >
                      ADD
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Curated Archive */}
          <div style={{
            backgroundColor: '#1D1D1D',
            borderRadius: 12,
            padding: isMobile ? '16px' : '20px',
            display: 'flex', flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: 180,
          }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#BE864B', marginBottom: 8 }}>
                CURATED ARCHIVE
              </p>
              <h2 style={{
                fontSize: isMobile ? 16 : 18,
                fontWeight: 900, color: 'white',
                lineHeight: 1.3, margin: '0 0 12px',
              }}>
                Your campus essentials,<br />always fresh.
              </h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {ARCHIVE_IMGS.map((img, i) => (
                <div key={i} style={{
                  height: 52, borderRadius: 6, overflow: 'hidden',
                }}>
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
            <button
              onClick={() => navigate('/marketplace')}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '10px',
                backgroundColor: '#BE864B', color: 'white',
                border: 'none', borderRadius: 8,
                fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.04em',
              }}
            >
              BROWSE MARKETPLACE <ArrowRight size={13} />
            </button>
          </div>
        </div>

        {/* Recent Orders */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 12,
          padding: isMobile ? '16px' : '20px 24px',
          marginBottom: 20,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0 }}>Recent Orders</h2>
            <Link to="/orders" style={{ fontSize: 11, color: '#BE864B', textDecoration: 'none', fontWeight: 700 }}>
              VIEW ALL
            </Link>
          </div>

          {loading ? (
            <p style={{ fontSize: 12, color: '#9C9488', textAlign: 'center', padding: '20px 0' }}>Loading...</p>
          ) : recentOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 13, color: '#9C9488', marginBottom: 12 }}>
                No orders yet. Start shopping!
              </p>
              <button
                onClick={() => navigate('/marketplace')}
                style={{
                  padding: '9px 20px',
                  backgroundColor: '#1D1D1D', color: 'white',
                  border: 'none', borderRadius: 7,
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                }}
              >
                BROWSE MARKETPLACE
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {recentOrders.map((order, i) => {
                const st = STATUS_STYLE[order.status] || STATUS_STYLE.PLACED
                const date = new Date(order.createdAt).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
                return (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    style={{
                      display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', padding: '13px 0',
                      borderBottom: i < recentOrders.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 3px', color: '#1D1D1D' }}>
                        {order.vendor?.storeName || 'Buylence Order'}
                      </p>
                      <p style={{ fontSize: 11, color: '#9C9488', margin: '0 0 3px' }}>
                        {order.orderNumber} · {date}
                      </p>
                      <p style={{ fontSize: 11, fontWeight: 600, color: st.color, margin: 0 }}>
                        {st.label}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: '#1D1D1D', margin: '0 0 4px' }}>
                        ₦{order.total?.toLocaleString()}
                      </p>
                      <ArrowRight size={13} color="#9C9488" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
          gap: 10,
        }}>
          {[
            { label: 'Browse Market', emoji: '🛒', to: '/marketplace' },
            { label: 'My Orders', emoji: '📦', to: '/orders' },
            { label: 'Find Vendors', emoji: '🏪', to: '/vendors' },
            { label: 'My Profile', emoji: '👤', to: '/profile' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              style={{
                padding: '14px 10px',
                backgroundColor: 'white',
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
    </div>
  )
}