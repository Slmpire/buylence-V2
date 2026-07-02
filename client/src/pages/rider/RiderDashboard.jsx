import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import RiderLayout from './RiderLayout'
import api from '../../lib/axios'

const STATUS_STYLE = {
  READY_FOR_PICKUP: { label: 'READY FOR PICKUP', color: '#C2410C', bg: '#FFF7ED', border: '#FED7AA' },
  ASSIGNED_TO_RIDER: { label: 'CLAIMED', color: '#7C3AED', bg: '#F5F3FF', border: '#DDD6FE' },
  PICKED_UP: { label: 'PICKED UP', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
}

function OrderCard({ order, onClaim, onPickUp, onDeliver, claiming, isMobile }) {
  const st = STATUS_STYLE[order.status] || STATUS_STYLE.READY_FOR_PICKUP
  const isWorking = claiming === order.id

  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 14, overflow: 'hidden',
      marginBottom: 14,
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 18px',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        backgroundColor: '#F7F4EF',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#BE864B' }}>
            {order.orderNumber}
          </span>
          <span style={{
            fontSize: 9, fontWeight: 800, letterSpacing: '0.06em',
            padding: '3px 8px', borderRadius: 4,
            backgroundColor: st.bg, color: st.color,
            border: `1px solid ${st.border}`,
          }}>
            {st.label}
          </span>
        </div>
        <p style={{ fontSize: 16, fontWeight: 900, color: '#BE864B', margin: 0 }}>
          ₦{order.deliveryFee?.toLocaleString() || '200'}
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: '16px 18px' }}>
        {/* Pickup + Dropoff */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: '#F0EDE8', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Package size={13} color="#BE864B" />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9C9488', letterSpacing: '0.08em', margin: '0 0 2px' }}>
                PICKUP FROM
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1D', margin: 0 }}>
                {order.vendor?.storeName || 'Vendor'}
              </p>
              <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                {order.vendor?.hall || '—'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              backgroundColor: '#F0EDE8', flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MapPin size={13} color="#BE864B" />
            </div>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#9C9488', letterSpacing: '0.08em', margin: '0 0 2px' }}>
                DELIVER TO
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1D1D1D', margin: 0 }}>
                {order.deliveryHall}
              </p>
              <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                {order.deliveryRoom || 'No room specified'} · {order.recipientPhone}
              </p>
            </div>
          </div>
        </div>

        {/* Items summary */}
        <div style={{
          backgroundColor: '#F7F4EF', borderRadius: 8,
          padding: '10px 12px', marginBottom: 14,
        }}>
          <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>
            {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''} ·{' '}
            {order.items?.slice(0, 2).map(i => `${i.quantity}x ${i.name}`).join(', ')}
            {order.items?.length > 2 ? ` +${order.items.length - 2} more` : ''}
          </p>
        </div>

        {/* Action buttons */}
        {order.status === 'READY_FOR_PICKUP' && (
          <button
            onClick={() => onClaim(order.id)}
            disabled={isWorking}
            style={{
              width: '100%', padding: '12px',
              background: isWorking ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13,
              cursor: isWorking ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {isWorking ? 'Claiming...' : '🛵 CLAIM THIS DELIVERY'}
          </button>
        )}

        {order.status === 'ASSIGNED_TO_RIDER' && (
          <button
            onClick={() => onPickUp(order.id)}
            disabled={isWorking}
            style={{
              width: '100%', padding: '12px',
              backgroundColor: isWorking ? '#E4DDD3' : '#1D1D1D',
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13,
              cursor: isWorking ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {isWorking ? 'Updating...' : '📦 CONFIRM PICKED UP FROM VENDOR'}
          </button>
        )}

        {order.status === 'PICKED_UP' && (
          <button
            onClick={() => onDeliver(order.id)}
            disabled={isWorking}
            style={{
              width: '100%', padding: '12px',
              background: isWorking ? '#E4DDD3' : 'linear-gradient(90deg, #166534 0%, #16A34A 100%)',
              color: 'white', border: 'none', borderRadius: 8,
              fontWeight: 700, fontSize: 13,
              cursor: isWorking ? 'not-allowed' : 'pointer',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {isWorking ? 'Updating...' : '✅ MARK DELIVERED TO STUDENT'}
          </button>
        )}
      </div>
    </div>
  )
}

export default function RiderDashboard() {
  const navigate = useNavigate()
  const [pool, setPool] = useState([])
  const [active, setActive] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(null)
  const [tab, setTab] = useState('pool')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [poolRes, activeRes, profileRes] = await Promise.all([
        api.get('/orders/rider/pool'),
        api.get('/orders/rider/my-deliveries'),
        api.get('/riders/me/profile'),
      ])
      setPool(poolRes.data.orders || [])
      setActive(activeRes.data.orders || [])
      setProfile(profileRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function claimOrder(orderId) {
    setClaiming(orderId)
    try {
      await api.post(`/orders/${orderId}/claim`)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to claim order.')
    } finally {
      setClaiming(null)
    }
  }

  async function markPickedUp(orderId) {
    setClaiming(orderId)
    try {
      await api.post(`/orders/${orderId}/picked-up`)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order.')
    } finally {
      setClaiming(null)
    }
  }

  async function markDelivered(orderId) {
    setClaiming(orderId)
    try {
      await api.post(`/orders/${orderId}/delivered`)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to update order.')
    } finally {
      setClaiming(null)
    }
  }

  const stats = profile?.stats || {}

  return (
    <RiderLayout>
      {/* Stats bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'TOTAL DELIVERIES', value: stats.totalDeliveries || 0, icon: '🛵' },
          { label: 'ACTIVE NOW', value: active.length, icon: '📦' },
          { label: 'POOL AVAILABLE', value: pool.length, icon: '⏳' },
        ].map(s => (
          <div key={s.label} style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: '16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#9C9488', margin: '0 0 4px' }}>
              {s.label}
            </p>
            <p style={{ fontSize: 26, fontWeight: 900, color: '#1D1D1D', margin: 0 }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        backgroundColor: '#F0EDE8', borderRadius: 10,
        padding: 4, marginBottom: 20,
      }}>
        {[
          { key: 'pool', label: `Pending Pool (${pool.length})` },
          { key: 'active', label: `My Deliveries (${active.length})` },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px', borderRadius: 8, border: 'none',
              backgroundColor: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#1D1D1D' : '#9C9488',
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: 13, cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              boxShadow: tab === t.key ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid #BE864B', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: 13, color: '#9C9488' }}>Loading orders...</p>
        </div>
      ) : tab === 'pool' ? (
        pool.length === 0 ? (
          <div style={{
            backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 14, padding: '60px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🎉</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No orders in the pool</h3>
            <p style={{ fontSize: 13, color: '#9C9488' }}>
              All current orders have been claimed. Check back soon!
            </p>
            <button
              onClick={fetchData}
              style={{
                marginTop: 16, padding: '10px 24px',
                backgroundColor: '#1D1D1D', color: 'white',
                border: 'none', borderRadius: 8,
                fontWeight: 700, fontSize: 12, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              REFRESH
            </button>
          </div>
        ) : (
          <>
            <div style={{
              backgroundColor: '#FFFBEB', border: '1px solid #FDE68A',
              borderRadius: 10, padding: '12px 16px', marginBottom: 16,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <AlertCircle size={14} color="#D97706" />
              <p style={{ fontSize: 12, color: '#92400E', margin: 0 }}>
                Orders auto-release back to pool if not picked up within 15 minutes of claiming.
              </p>
            </div>
            {pool.map(order => (
              <OrderCard
                key={order.id} order={order}
                onClaim={claimOrder} onPickUp={markPickedUp} onDeliver={markDelivered}
                claiming={claiming}
              />
            ))}
          </>
        )
      ) : (
        active.length === 0 ? (
          <div style={{
            backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 14, padding: '60px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📭</p>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No active deliveries</h3>
            <p style={{ fontSize: 13, color: '#9C9488' }}>
              Claim an order from the pool to start delivering.
            </p>
          </div>
        ) : (
          active.map(order => (
            <OrderCard
              key={order.id} order={order}
              onClaim={claimOrder} onPickUp={markPickedUp} onDeliver={markDelivered}
              claiming={claiming}
            />
          ))
        )
      )}
    </RiderLayout>
  )
}