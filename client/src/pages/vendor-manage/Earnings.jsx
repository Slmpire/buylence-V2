import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'
import VendorLayout from '../../components/vendor/VendorLayout'
import api from '../../lib/axios'

const W_STATUS = {
  completed: { label: 'Completed', color: '#16A34A', bg: '#F0FDF4' },
  processing: { label: 'Processing', color: '#D97706', bg: '#FFFBEB' },
  failed: { label: 'Failed', color: '#DC2626', bg: '#FEF2F2' },
}

function BarChart({ data, activeTab, onTabChange }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid rgba(0,0,0,0.07)',
      borderRadius: 12, padding: '20px 22px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#BE864B' }} />
            <span style={{ fontSize: 11, color: '#7F766B', fontWeight: 600 }}>REVENUE TREND</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Weekly', 'Monthly'].map(t => (
            <button
              key={t}
              onClick={() => onTabChange(t)}
              style={{
                padding: '5px 14px', borderRadius: 20,
                border: '1px solid #E4DDD3',
                backgroundColor: activeTab === t ? '#F0EDE8' : 'white',
                color: activeTab === t ? '#1D1D1D' : '#9C9488',
                fontSize: 11, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div style={{
        display: 'flex', alignItems: 'flex-end',
        gap: 10, height: 140, paddingBottom: 24,
      }}>
        {data.map((item) => {
          const isTop = item.value === max
          const height = max === 0 ? 4 : Math.max((item.value / max) * 110, 4)
          return (
            <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: '100%', borderRadius: '4px 4px 0 0',
                height, backgroundColor: isTop ? '#BE864B' : '#E4DDD3',
                transition: 'height 0.3s',
              }} />
              <span style={{ fontSize: 10, color: '#9C9488', fontWeight: 600 }}>{item.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Earnings() {
  const navigate = useNavigate()
  const [chartTab, setChartTab] = useState('Weekly')
  const [earnings, setEarnings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/vendors/me/earnings')
      .then(res => setEarnings(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  // Build chart data from real earnings or fallback to zeros
  const weekDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
  const weeklyData = earnings?.weekly?.byDay
    ? weekDays.map(d => ({ label: d, value: earnings.weekly.byDay[d] || 0 }))
    : weekDays.map(d => ({ label: d, value: 0 }))

  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
  const monthlyData = earnings?.monthly?.byMonth
    ? months.map((m, i) => ({ label: m, value: earnings.monthly.byMonth[i] || 0 }))
    : months.map(m => ({ label: m, value: 0 }))

  const chartData = chartTab === 'Weekly' ? weeklyData : monthlyData

  const todayEarnings = earnings?.today?.amount || 0
  const weekEarnings = earnings?.thisWeek?.amount || 0
  const monthEarnings = earnings?.thisMonth?.amount || 0
  const allTimeEarnings = earnings?.allTime?.amount || 0
  const withdrawals = earnings?.recentWithdrawals || []

  return (
    <VendorLayout searchPlaceholder="Search earnings...">

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 4px', color: '#1D1D1D', letterSpacing: '-0.3px' }}>
            Earnings
          </h1>
          <p style={{ fontSize: 13, color: '#7F766B', margin: 0 }}>
            Your revenue breakdown and withdrawal history.
          </p>
        </div>
        <button
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 18px',
            background: 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
            color: 'white', border: 'none', borderRadius: 8,
            fontWeight: 700, fontSize: 12, cursor: 'pointer',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          <TrendingUp size={14} /> Withdraw Funds
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'TODAY', value: loading ? '—' : `₦${todayEarnings.toLocaleString()}`, sub: 'earnings today' },
          { label: 'THIS WEEK', value: loading ? '—' : `₦${weekEarnings.toLocaleString()}`, sub: 'this week' },
          { label: 'THIS MONTH', value: loading ? '—' : `₦${monthEarnings.toLocaleString()}`, sub: 'this month' },
          { label: 'ALL TIME', value: loading ? '—' : `₦${allTimeEarnings.toLocaleString()}`, sub: 'total earned', dark: true },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              backgroundColor: stat.dark ? '#BE864B' : 'white',
              border: stat.dark ? 'none' : '1px solid rgba(0,0,0,0.07)',
              borderRadius: 12, padding: '16px 18px',
            }}
          >
            <p style={{
              fontSize: 9, fontWeight: 800, letterSpacing: '0.1em',
              color: stat.dark ? 'rgba(255,255,255,0.7)' : '#9C9488',
              margin: '0 0 8px',
            }}>
              {stat.label}
            </p>
            <p style={{
              fontSize: 22, fontWeight: 900, margin: '0 0 4px',
              color: stat.dark ? 'white' : '#1D1D1D', letterSpacing: '-0.5px',
            }}>
              {stat.value}
            </p>
            <p style={{ fontSize: 11, color: stat.dark ? 'rgba(255,255,255,0.6)' : '#9C9488', margin: 0 }}>
              {stat.sub}
            </p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ marginBottom: 24 }}>
        <BarChart data={chartData} activeTab={chartTab} onTabChange={setChartTab} />
      </div>

      {/* Withdrawals */}
      <div style={{
        backgroundColor: 'white',
        border: '1px solid rgba(0,0,0,0.07)',
        borderRadius: 12, padding: '20px 22px',
      }}>
        <h2 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px', color: '#1D1D1D' }}>
          Withdrawal History
        </h2>

        {loading ? (
          <p style={{ fontSize: 12, color: '#9C9488', textAlign: 'center', padding: '20px 0' }}>Loading...</p>
        ) : withdrawals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <p style={{ fontSize: 13, color: '#9C9488' }}>No withdrawals yet.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {withdrawals.map((w, i) => {
              const st = W_STATUS[w.status] || W_STATUS.processing
              return (
                <div
                  key={w.id || i}
                  style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', padding: '14px 0',
                    borderBottom: i < withdrawals.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, margin: '0 0 3px', color: '#1D1D1D' }}>
                      ₦{w.amount?.toLocaleString()}
                    </p>
                    <p style={{ fontSize: 11, color: '#9C9488', margin: 0 }}>
                      {w.bank || 'Bank account'} · {w.date || new Date(w.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    padding: '4px 10px', borderRadius: 6,
                    backgroundColor: st.bg, color: st.color,
                  }}>
                    {st.label}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </VendorLayout>
  )
}