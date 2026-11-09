import { useState, useEffect } from 'react'
import { Clock } from 'lucide-react'
import api from '../../lib/axios'
import { toast } from '../../store/toastStore'
import { Spinner } from '../common/GlobalLoader'

// Keep this the same as UNPAID_ORDER_MINUTES on the server (default 30)
const WINDOW_MINUTES = 30

export default function PayNowButton({ order }) {
  const [loading, setLoading] = useState(false)
  const [now, setNow] = useState(Date.now())

  // Tick so the countdown stays fresh
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(timer)
  }, [])

  const method = order?.paymentMethod
  const needsPayment =
    order &&
    order.paymentStatus === 'PENDING' &&
    order.status !== 'CANCELLED' &&
    (method === 'PAYSTACK' || method === 'OPAY')

  if (!needsPayment) return null

  // An order that is part of a bigger checkout is paid for together with the others
  const group = order.paymentGroup
  const orderCount = group?._count?.orders || 1
  const amount = group?.total ?? order.total

  const deadline = new Date(order.createdAt).getTime() + WINDOW_MINUTES * 60 * 1000
  const minutesLeft = Math.ceil((deadline - now) / 60000)
  const provider = method === 'OPAY' ? 'OPay' : 'Paystack'

  async function pay() {
    setLoading(true)
    try {
      const body = group ? { groupId: group.id } : { orderId: order.id }
      if (method === 'OPAY') {
        const res = await api.post('/payments/opay/initialize', body)
        window.location.href = res.data.cashierUrl
      } else {
        const res = await api.post('/payments/initialize', body)
        window.location.href = res.data.authorizationUrl
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not open the payment page. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      backgroundColor: '#FFFBEB',
      border: '1px solid #FDE68A',
      borderRadius: 14,
      padding: '16px 18px',
      marginBottom: 14,
      fontFamily: 'Inter, sans-serif',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <Clock size={16} color="#B45309" />
        <p style={{ fontSize: 13, fontWeight: 800, color: '#92400E', margin: 0 }}>
          Payment not completed
        </p>
      </div>

      <p style={{ fontSize: 12, color: '#92400E', margin: '0 0 14px', lineHeight: 1.6 }}>
        {orderCount > 1 && `This payment covers all ${orderCount} orders from your checkout. `}
        {minutesLeft > 0
          ? `Pay within ${minutesLeft} minute${minutesLeft === 1 ? '' : 's'} or ${orderCount > 1 ? 'these orders are' : 'this order is'} cancelled and the items go back on sale.`
          : 'The payment time is almost up. Pay now, or the order will be cancelled shortly.'}
        {' '}Your money is held in escrow until you confirm delivery.
      </p>

      <button
        onClick={pay}
        disabled={loading}
        style={{
          width: '100%', padding: '12px',
          background: loading ? '#E4DDD3' : 'linear-gradient(90deg, #9A662F 0%, #D09A5F 100%)',
          color: 'white', border: 'none', borderRadius: 10,
          fontWeight: 800, fontSize: 13, letterSpacing: '0.03em',
          cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {loading && <Spinner size={14} color="white" />}
        {loading ? 'Opening payment…' : `Complete payment with ${provider}: ₦${amount.toLocaleString()}`}
      </button>
    </div>
  )
}