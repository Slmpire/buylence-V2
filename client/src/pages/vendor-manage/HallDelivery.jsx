import { useState, useEffect } from 'react'
import VendorLayout from '../../components/vendor/VendorLayout'
import { useIsMobile } from '../../hooks/useWindowSize'
import api from '../../lib/axios'

const STATUS_STYLE = {
  PLACED: { label: 'Placed', color: '#D97706', bg: '#FFFBEB' },
  PREPARING: { label: 'Preparing', color: '#2563EB', bg: '#EFF6FF' },
  READY_FOR_PICKUP: { label: 'Ready for Pickup', color: '#C2410C', bg: '#FFF7ED' },
  ASSIGNED_TO_RIDER: { label: 'Rider Assigned', color: '#7C3AED', bg: '#F5F3FF' },
  PICKED_UP: { label: 'Picked Up', color: '#7C3AED', bg: '#F5F3FF' },
  DELIVERED_BY_RIDER: { label: 'Delivered', color: '#16A34A', bg: '#F0FDF4' },
  CONFIRMED_BY_BUYER: { label: 'Completed', color: '#16A34A', bg: '#F0FDF4' },
  CANCELLED: { label: 'Cancelled', color: '#DC2626', bg: '#FEF2F2' },
}

const ACTIVE_STATUSES = ['PLACED', 'PREPARING', 'READY_FOR_PICKUP', 'ASSIGNED_TO_RIDER', 'PICKED_UP']

export default function HallDelivery() {
  const isMobile = useIsMobile()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await api.get('/orders/vendor/all')
      setOrders(res.data.orders || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function confirmPreparing(orderId) {
    setConfirming(orderId)
    try {
      await api.post(`/orders/${orderId}/confirm-preparing`)
      await fetchOrders()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to confirm order.')
    } finally {
      setConfirming(null)
    }
  }

  async function markReady(orderId) {
    setConfirming(orderId)
    try {
      await api.post(`/orders/${orderId}/ready-for-pickup`)
      await fetchOrders()
    } catch (err) {
      console.error(err)
      alert(err.response?.data?.error || 'Failed to mark ready.')
    } finally {
      setConfirming(null)
    }
  }

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status))
  const completedOrders = orders.filter(o => !ACTIVE_STATUSES.includes(o.status))

  // Group active orders by hall
  const byHall = activeOrders.reduce((acc, order) => {
    const hall = order.deliveryHall || 'Unknown Hall'
    if (!acc[hall]) acc[hall] = []
    acc[hall].push(order)
    return acc
  }, {})

  const totalPending = activeOrders.filter(o => o.status === 'PLACED' || o.status === 'PREPARING').length
  const totalInTransit = activeOrders.filter(o => ['ASSIGNED_TO_RIDER', 'PICKED_UP'].includes(o.status)).length

  return (
    <VendorLayout searchPlaceholder="Search orders, halls, or IDs...">
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 220px',
        gap: 20,
      }}>
        {/* Left */}
        <div>
          {/* Hero card */}
          <div style={{
            background: 'linear-gradient(135deg, #F0EDE8 0%, #E8E2DA 100%)',
            borderRadius: 14, padding: isMobile ? '20px 18px' : '24px 26px',
            marginBottom: 20, position: 'relative', overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute', top: -10, right: -10,
              width: 80, height: 80, borderRadius: '50%',
              backgroundColor: 'rgba(190,134,75,0.1)',
            }} />
            <h1 style={{ fontSize: isMobile ? 18 : 22, fontWeight: 900, margin: '0 0 4px', color: '#1D1D1D' }}>
              Hall Deliveries
            </h1>
            <p style={{ fontSize: 13, color: '#7F766B', margin: '0 0 16px', lineHeight: 1.5 }}>
              Confirm and prepare orders. Riders handle campus delivery.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              {[
                { label: 'PENDING', value: loading ? '—' : String(totalPending) },
                { label: 'IN TRANSIT', value: loading ? '—' : String(totalInTransit) },
                { label: 'TOTAL TODAY', value: loading ? '—' : String(activeOrders.length) },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.1em', color: '#9C9488', margin: '0 0 2px' }}>
                    {s.label}
                  </p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#1D1D1D', margin: 0 }}>{s.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rider notice */}
          <div style={{
            backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE',
            borderRadius: 10, padding: '12px 16px',
            marginBottom: 20,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>🛵</span>
            <p style={{ fontSize: 12, color: '#1D4ED8', margin: 0, lineHeight: 1.6 }}>
              <strong>Rider-handled delivery:</strong> Once you mark an order as Ready for Pickup, our campus riders will claim and deliver it to the student's hall gate. You only need to prepare and hand off.
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '3px solid #BE864B', borderTopColor: 'transparent',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              <p style={{ fontSize: 13, color: '#9C9488' }}>Loading orders...</p>
            </div>
          ) : Object.keys(byHall).length === 0 ? (
            <div style={{
              backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 12, padding: '48px', textAlign: 'center',
            }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>📭</p>
              <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No active orders</h3>
              <p style={{ fontSize: 13, color: '#9C9488' }}>
                New orders will appear here when students place them.
              </p>
            </div>
          ) : (
            Object.entries(byHall).map(([hall, hallOrders]) => (
              <div
                key={hall}
                style={{
                  backgroundColor: 'white',
                  border: '1px solid rgba(0,0,0,0.07)',
                  borderRadius: 14, overflow: 'hidden',
                  marginBottom: 16,
                }}
              >
                {/* Hall header */}
                <div style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  backgroundColor: '#F7F4EF',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🏛</span>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#1D1D1D' }}>{hall}</p>
                      <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                        {hallOrders.length} active order{hallOrders.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: '4px 10px',
                    backgroundColor: '#BE864B', color: 'white', borderRadius: 6,
                  }}>
                    {hallOrders.length} PENDING
                  </span>
                </div>

                {/* Orders */}
                {hallOrders.map((order, i) => {
                  const st = STATUS_STYLE[order.status] || STATUS_STYLE.PLACED
                  const isLast = i === hallOrders.length - 1
                  const isConfirming = confirming === order.id

                  return (
                    <div
                      key={order.id}
                      style={{
                        padding: isMobile ? '14px 16px' : '16px 20px',
                        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.05)',
                      }}
                    >
                      {/* Order header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 800, color: '#BE864B' }}>
                              {order.orderNumber}
                            </span>
                            <span style={{
                              fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                              backgroundColor: st.bg, color: st.color,
                            }}>
                              {st.label}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                            {order.buyer?.fullName || 'Customer'}
                          </p>
                          <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                            {order.deliveryRoom || 'Room not specified'}
                          </p>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 900, color: '#BE864B', margin: 0 }}>
                          ₦{order.total?.toLocaleString()}
                        </p>
                      </div>

                      {/* Items */}
                      <div style={{
                        backgroundColor: '#F7F4EF', borderRadius: 8,
                        padding: '10px 12px', marginBottom: 12,
                      }}>
                        {order.items?.map((item, idx) => (
                          <p key={idx} style={{ fontSize: 12, color: '#5A5550', margin: idx < order.items.length - 1 ? '0 0 4px' : 0 }}>
                            {item.quantity}x {item.name}
                          </p>
                        ))}
                      </div>

                      {/* Action buttons */}
                      {order.status === 'PLACED' && (
                        <button
                          onClick={() => confirmPreparing(order.id)}
                          disabled={isConfirming}
                          style={{
                            width: '100%', padding: '10px',
                            backgroundColor: isConfirming ? '#E4DDD3' : '#1D1D1D',
                            color: 'white', border: 'none', borderRadius: 8,
                            fontWeight: 700, fontSize: 12, cursor: isConfirming ? 'not-allowed' : 'pointer',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {isConfirming ? 'Confirming...' : '✓ CONFIRM & START PREPARING'}
                        </button>
                      )}

                      {order.status === 'PREPARING' && (
                        <button
                          onClick={() => markReady(order.id)}
                          disabled={isConfirming}
                          style={{
                            width: '100%', padding: '10px',
                            background: isConfirming ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
                            color: 'white', border: 'none', borderRadius: 8,
                            fontWeight: 700, fontSize: 12, cursor: isConfirming ? 'not-allowed' : 'pointer',
                            fontFamily: 'Inter, sans-serif',
                          }}
                        >
                          {isConfirming ? 'Updating...' : '🛵 MARK READY FOR PICKUP'}
                        </button>
                      )}

                      {['READY_FOR_PICKUP', 'ASSIGNED_TO_RIDER', 'PICKED_UP'].includes(order.status) && (
                        <div style={{
                          padding: '10px 14px', backgroundColor: '#F0FDF4',
                          border: '1px solid #BBF7D0', borderRadius: 8,
                          fontSize: 12, color: '#166534', fontWeight: 600,
                          textAlign: 'center',
                        }}>
                          🛵 Rider handling delivery — no action needed
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))
          )}

          {/* Completed orders */}
          {!loading && completedOrders.length > 0 && (
            <div style={{
              backgroundColor: 'white',
              border: '1px solid rgba(0,0,0,0.07)',
              borderRadius: 14, padding: '20px 22px',
            }}>
              <h3 style={{ fontSize: 13, fontWeight: 800, margin: '0 0 14px', color: '#9C9488', letterSpacing: '0.08em' }}>
                RECENT COMPLETED
              </h3>
              {completedOrders.slice(0, 5).map((order, i) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '11px 0',
                    borderBottom: i < Math.min(completedOrders.length, 5) - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 2px', color: '#1D1D1D' }}>
                      {order.orderNumber}
                    </p>
                    <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                      {order.buyer?.fullName} · {order.deliveryHall}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#BE864B', margin: '0 0 3px' }}>
                      ₦{order.total?.toLocaleString()}
                    </p>
                    <span style={{
                      fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                      backgroundColor: '#F0FDF4', color: '#16A34A',
                    }}>
                      COMPLETED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Delivery flow */}
          <div style={{
            backgroundColor: 'white',
            border: '1px solid rgba(0,0,0,0.07)',
            borderRadius: 12, padding: '18px',
          }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', color: '#9C9488', margin: '0 0 14px' }}>
              DELIVERY FLOW
            </p>
            {[
              { step: '1', label: 'Order placed', desc: 'Student pays via Paystack', done: true },
              { step: '2', label: 'You confirm', desc: 'Accept and start preparing', done: false },
              { step: '3', label: 'Mark ready', desc: 'Items packed, ready for rider', done: false },
              { step: '4', label: 'Rider picks up', desc: 'Campus rider collects', done: false },
              { step: '5', label: 'Delivered', desc: 'Student confirms receipt', done: false },
            ].map((s, i, arr) => (
              <div key={s.step} style={{ display: 'flex', gap: 10, marginBottom: i < arr.length - 1 ? 12 : 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    backgroundColor: s.done ? '#BE864B' : '#F0EDE8',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800,
                    color: s.done ? 'white' : '#9C9488', flexShrink: 0,
                  }}>
                    {s.step}
                  </div>
                  {i < arr.length - 1 && (
                    <div style={{ width: 1, height: 16, backgroundColor: '#E4DDD3', margin: '3px 0' }} />
                  )}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, margin: '0 0 1px', color: '#1D1D1D' }}>{s.label}</p>
                  <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{
            backgroundColor: '#BE864B',
            borderRadius: 12, padding: '18px',
          }}>
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.7)', margin: '0 0 12px' }}>
              DELIVERY STATS
            </p>
            {[
              { label: 'Active Orders', value: loading ? '—' : String(activeOrders.length) },
              { label: 'Completed', value: loading ? '—' : String(completedOrders.length) },
              { label: 'Success Rate', value: loading || orders.length === 0 ? '—' : `${Math.round((completedOrders.filter(o => o.status === 'CONFIRMED_BY_BUYER').length / Math.max(orders.length, 1)) * 100)}%` },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </VendorLayout>
  )
}