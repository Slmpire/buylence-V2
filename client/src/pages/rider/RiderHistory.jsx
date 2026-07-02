import { useState, useEffect } from 'react'
import { MapPin, Clock } from 'lucide-react'
import RiderLayout from './RiderLayout'
import api from '../../lib/axios'

export default function RiderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    fetchHistory()
  }, [page])

  async function fetchHistory() {
    setLoading(true)
    try {
      const res = await api.get(`/riders/me/history?page=${page}&limit=15`)
      setOrders(res.data.orders || [])
      setTotal(res.data.total || 0)
      setPages(res.data.pages || 1)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RiderLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: '#1D1D1D', letterSpacing: '-0.3px' }}>
          Delivery History
        </h1>
        <p style={{ fontSize: 13, color: '#7F766B', margin: 0 }}>
          {total} completed deliveries
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            border: '3px solid #BE864B', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          <p style={{ fontSize: 13, color: '#9C9488' }}>Loading history...</p>
        </div>
      ) : orders.length === 0 ? (
        <div style={{
          backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 14, padding: '60px 24px', textAlign: 'center',
        }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🛵</p>
          <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No deliveries yet</h3>
          <p style={{ fontSize: 13, color: '#9C9488' }}>
            Your completed deliveries will appear here.
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white', border: '1px solid rgba(0,0,0,0.07)',
          borderRadius: 14, overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px 80px',
            padding: '10px 20px', backgroundColor: '#F7F4EF',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}>
            {['ORDER', 'ROUTE', 'FEE', 'TIME', 'DATE'].map(h => (
              <p key={h} style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: '#9C9488', margin: 0 }}>
                {h}
              </p>
            ))}
          </div>

          {orders.map((order, i) => {
            const date = new Date(order.riderConfirmedAt || order.createdAt).toLocaleDateString('en-NG', {
              day: 'numeric', month: 'short',
            })
            return (
              <div
                key={order.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px 80px',
                  padding: '14px 20px', alignItems: 'center',
                  borderBottom: i < orders.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                }}
              >
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#BE864B', margin: '0 0 2px' }}>
                    {order.orderNumber}
                  </p>
                  <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                    {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                  </p>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <MapPin size={10} color="#9C9488" />
                    <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>
                      {order.vendor?.storeName || '—'}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <MapPin size={10} color="#BE864B" />
                    <p style={{ fontSize: 11, color: '#7F766B', margin: 0 }}>
                      {order.deliveryHall}
                    </p>
                  </div>
                </div>

                <p style={{ fontSize: 13, fontWeight: 700, color: '#16A34A', margin: 0 }}>
                  ₦{order.deliveryFee?.toLocaleString() || '200'}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={11} color="#9C9488" />
                  <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                    {order.deliveryMinutes ? `${order.deliveryMinutes} min` : '—'}
                  </p>
                </div>

                <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>{date}</p>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              padding: '9px 18px', border: '1px solid #E4DDD3',
              backgroundColor: 'white', borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: page === 1 ? 'not-allowed' : 'pointer',
              color: page === 1 ? '#C8B89A' : '#1D1D1D', fontFamily: 'Inter, sans-serif',
            }}
          >
            ← Previous
          </button>
          <span style={{ padding: '9px 16px', fontSize: 12, color: '#9C9488', fontWeight: 600 }}>
            Page {page} of {pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            style={{
              padding: '9px 18px', border: '1px solid #E4DDD3',
              backgroundColor: 'white', borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: page === pages ? 'not-allowed' : 'pointer',
              color: page === pages ? '#C8B89A' : '#1D1D1D', fontFamily: 'Inter, sans-serif',
            }}
          >
            Next →
          </button>
        </div>
      )}
    </RiderLayout>
  )
}