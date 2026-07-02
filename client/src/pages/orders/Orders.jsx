import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ShoppingBag, User, MapPin, Calendar } from 'lucide-react'
import useAuthStore from '../../store/authStore'
import api from '../../lib/axios'

const STATUS_STYLES = {
  PLACED: { bg: '#E8E4DE', color: '#7F766B', label: 'PLACED' },
  PREPARING: { bg: '#EFF6FF', color: '#2563EB', label: 'PREPARING' },
  READY_FOR_PICKUP: { bg: '#FFF7ED', color: '#C2410C', label: 'READY' },
  ASSIGNED_TO_RIDER: { bg: '#BE864B', color: 'white', label: 'IN TRANSIT' },
  PICKED_UP: { bg: '#BE864B', color: 'white', label: 'IN TRANSIT' },
  DELIVERED_BY_RIDER: { bg: '#FFFBEB', color: '#D97706', label: 'DELIVERED' },
  CONFIRMED_BY_BUYER: { bg: '#1D1D1D', color: 'white', label: 'COMPLETED' },
  CANCELLED: { bg: '#FEF2F2', color: '#DC2626', label: 'CANCELLED' },
}

export default function Orders() {
  const { user, isLoggedIn } = useAuthStore()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isLoggedIn) return
    fetchOrders()
  }, [isLoggedIn])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await api.get('/orders')
      setOrders(res.data.orders)
    } catch (err) {
      setError('Failed to load orders.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const totalSpent = orders.reduce((s, o) => s + (o.total || 0), 0)

  return (
    <div style={{
      minHeight: '100vh', backgroundColor: '#F7F4EF',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif',
    }}>

      {/* Nav */}
      <div style={{
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '0 32px', height: 52,
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F7F4EF',
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <Link to="/" style={{
            fontWeight: 900, fontSize: 13,
            letterSpacing: '0.06em', color: '#1D1D1D',
            textDecoration: 'none',
          }}>
            BUYLENCE ARCHIVE
          </Link>
          {[
            { label: 'Collections', to: '/marketplace' },
            { label: 'Marketplace', to: '/marketplace' },
            { label: 'Archives', to: '/orders', active: true },
          ].map(l => (
            <Link key={l.label} to={l.to} style={{
              fontSize: 13,
              color: l.active ? '#BE864B' : '#7F766B',
              textDecoration: l.active ? 'underline' : 'none',
              textUnderlineOffset: 3, fontWeight: 500,
            }}>
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link to="/cart" style={{ color: '#1D1D1D', display: 'flex' }}>
            <ShoppingBag size={18} />
          </Link>
          <Link to="/dashboard" style={{ color: '#1D1D1D', display: 'flex' }}>
            <User size={18} />
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, maxWidth: 700, margin: '0 auto', width: '100%', padding: '48px 32px' }}>

        <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: '#9C9488', marginBottom: 10 }}>
          HISTORICAL RECORD
        </p>
        <h1 style={{
          fontSize: 42, fontWeight: 900, letterSpacing: '-1px',
          marginBottom: 6, color: '#1D1D1D', lineHeight: 1,
        }}>
          Order Archive
        </h1>
        <div style={{
          width: 40, height: 3, backgroundColor: '#BE864B',
          borderRadius: 2, marginBottom: 32,
        }} />

        {/* Stats bar */}
        <div style={{
          backgroundColor: 'white',
          border: '1px solid rgba(0,0,0,0.06)',
          borderRadius: 10, padding: '16px 24px',
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 16, marginBottom: 36,
        }}>
          {[
            { label: 'TOTAL ACQUISITIONS', value: String(orders.length) },
            { label: 'GOLD INVOICE', value: `₦${totalSpent.toLocaleString()}` },
            { label: 'STATUS', value: '✦ Active Archivist', amber: true },
          ].map(s => (
            <div key={s.label}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#9C9488', marginBottom: 6 }}>
                {s.label}
              </p>
              <p style={{ fontSize: 16, fontWeight: 800, color: s.amber ? '#BE864B' : '#1D1D1D', margin: 0 }}>
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid #BE864B', borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            <p style={{ fontSize: 13, color: '#9C9488' }}>Loading your orders...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 13, color: '#DC2626' }}>{error}</p>
            <button onClick={fetchOrders} style={{
              marginTop: 12, padding: '10px 20px',
              backgroundColor: '#1D1D1D', color: 'white',
              border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 12, cursor: 'pointer',
            }}>
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📦</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No orders yet</h3>
            <p style={{ fontSize: 13, color: '#9C9488', marginBottom: 20 }}>
              Your order archive is empty. Start shopping!
            </p>
            <Link to="/marketplace" style={{
              padding: '11px 24px',
              backgroundColor: '#1D1D1D', color: 'white',
              textDecoration: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13,
            }}>
              BROWSE MARKETPLACE
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {orders.map((order, i) => {
              const st = STATUS_STYLES[order.status] || STATUS_STYLES.PLACED
              const firstItem = order.items?.[0]
              const img = firstItem?.product?.images?.[0] ||
                'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80'
              const date = new Date(order.createdAt).toLocaleDateString('en-NG', {
                day: 'numeric', month: 'short', year: 'numeric',
              })

              return (
                <div
                  key={order.id}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 16,
                    padding: '24px 0',
                    borderBottom: i < orders.length - 1 ? '1px solid rgba(0,0,0,0.06)' : 'none',
                    cursor: 'pointer', transition: 'opacity 0.15s',
                  }}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {/* Image */}
                  <div style={{ width: 90, height: 90, flexShrink: 0, borderRadius: 8, overflow: 'hidden' }}>
                    <img
                      src={img} alt={order.orderNumber}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(1)' }}
                    />
                  </div>

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                        padding: '3px 7px', borderRadius: 4,
                        backgroundColor: '#E8E4DE', color: '#7F766B',
                      }}>
                        {order.orderNumber}
                      </span>
                      <span style={{
                        fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                        padding: '3px 7px', borderRadius: 4,
                        backgroundColor: st.bg, color: st.color,
                      }}>
                        {st.label}
                      </span>
                    </div>
                    <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 5px', color: '#1D1D1D' }}>
                      {order.vendor?.storeName || 'Buylence Order'}
                    </h3>
                    <p style={{ fontSize: 12, color: '#7F766B', margin: '0 0 10px', lineHeight: 1.5 }}>
                      {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} ·{' '}
                      {order.items?.map(i => i.name).slice(0, 2).join(', ')}
                      {order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
                    </p>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <MapPin size={11} color="#9C9488" />
                        <span style={{ fontSize: 10, color: '#9C9488', fontWeight: 600 }}>
                          {order.deliveryHall?.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <Calendar size={11} color="#9C9488" />
                        <span style={{ fontSize: 10, color: '#9C9488' }}>{date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Price */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 18, fontWeight: 900, color: '#1D1D1D', margin: '0 0 6px' }}>
                      ₦{order.total?.toLocaleString()}
                    </p>
                    <button
                      onClick={e => { e.stopPropagation(); navigate(`/orders/${order.id}`) }}
                      style={{
                        background: 'none', border: 'none',
                        fontSize: 10, color: '#BE864B',
                        fontWeight: 700, cursor: 'pointer',
                        letterSpacing: '0.06em', padding: 0,
                      }}
                    >
                      VIEW FULL INVOICE
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}