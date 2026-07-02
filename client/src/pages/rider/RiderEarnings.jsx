import { useState, useEffect } from 'react'
import RiderLayout from './RiderLayout'
import api from '../../lib/axios'

export default function RiderEarnings() {
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/riders/me/earnings')
      .then(res => setEarnings(res.data.earnings))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const today = earnings?.today || { amount: 0, deliveries: 0 }
  const thisWeek = earnings?.thisWeek || { amount: 0, deliveries: 0 }
  const thisMonth = earnings?.thisMonth || { amount: 0, deliveries: 0 }
  const allTime = earnings?.allTime || { amount: 0, deliveries: 0 }
  const recent = earnings?.recentDeliveries || []

  return (
    <RiderLayout>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: '#1D1D1D', letterSpacing: '-0.3px' }}>
          My Earnings
        </h1>
        <p style={{ fontSize: 13, color: '#7F766B', margin: 0 }}>
          Delivery fee breakdown from completed deliveries.
        </p>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        gap: 12, marginBottom: 24,
      }}>
        {[
          { label: 'TODAY', amount: today.amount, deliveries: today.deliveries, dark: false },
          { label: 'THIS WEEK', amount: thisWeek.amount, deliveries: thisWeek.deliveries, dark: false },
          { label: 'THIS MONTH', amount: thisMonth.amount, deliveries: thisMonth.deliveries, dark: false },
          { label: 'ALL TIME', amount: allTime.amount, deliveries: allTime.deliveries, dark: true },
        ].map(s => (
          <div
            key={s.label}
            style={{
              backgroundColor: s.dark ? '#BE864B' : 'white',
              border: s.dark ? 'none' : '1px solid rgba(0,0,0,0.07)',
              borderRadius: 12, padding: '18px',
            }}
          >
            <p style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
              color: s.dark ? 'rgba(255,255,255,0.7)' : '#9C9488',
              margin: '0 0 8px',
            }}>
              {s.label}
            </p>
            <p style={{
              fontSize: 26, fontWeight: 900, margin: '0 0 4px',
              color: s.dark ? 'white' : '#1D1D1D', letterSpacing: '-0.5px',
            }}>
              {loading ? '—' : `₦${s.amount.toLocaleString()}`}
            </p>
            <p style={{
              fontSize: 11, margin: 0,
              color: s.dark ? 'rgba(255,255,255,0.6)' : '#9C9488',
            }}>
              {loading ? '—' : `${s.deliveries} delivery${s.deliveries !== 1 ? 'ies' : 'y'}`}
            </p>
          </div>
        ))}
      </div>

      {/* Recent deliveries */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 14, overflow: 'hidden',
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#1D1D1D' }}>
            Recent Payouts
          </h2>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: '#9C9488' }}>Loading...</p>
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>💰</p>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#1D1D1D', marginBottom: 6 }}>
              No payouts yet
            </p>
            <p style={{ fontSize: 12, color: '#9C9488' }}>
              Earnings appear here after buyer confirms delivery.
            </p>
          </div>
        ) : (
          recent.map((delivery, i) => {
            const date = delivery.escrowReleasedAt
              ? new Date(delivery.escrowReleasedAt).toLocaleDateString('en-NG', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })
              : '—'
            return (
              <div
                key={i}
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', padding: '14px 20px',
                  borderBottom: i < recent.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                }}
              >
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 3px', color: '#1D1D1D' }}>
                    {delivery.orderNumber}
                  </p>
                  <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                    {delivery.vendor?.storeName || '—'} → {delivery.deliveryHall} · {date}
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#16A34A', margin: '0 0 2px' }}>
                    +₦{delivery.deliveryFee?.toLocaleString() || '200'}
                  </p>
                  <span style={{
                    fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 4,
                    backgroundColor: '#F0FDF4', color: '#16A34A',
                  }}>
                    PAID
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </RiderLayout>
  )
}