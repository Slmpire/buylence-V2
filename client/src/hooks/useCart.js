import { useNavigate } from 'react-router-dom'
import useCartStore from '../store/cartStore'
import useAuthStore from '../store/authStore'
import api from '../lib/axios'

export function useCart() {
  const navigate = useNavigate()
  const { items, clearCart } = useCartStore()
  const { user, isLoggedIn } = useAuthStore()

  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0)
  const deliveryFee = 200
  const total = subtotal + deliveryFee

  async function placeOrder({ deliveryHall, deliveryRoom, recipientName, recipientPhone, paymentMethod }) {
    if (!isLoggedIn) {
      navigate('/login')
      return null
    }

    if (items.length === 0) {
      throw new Error('Your cart is empty.')
    }

    // Group items by vendor — for now assume single vendor per cart
    // (multi-vendor cart splitting can be added later)
    const vendorId = items[0]?.vendorId
    if (!vendorId) {
      throw new Error('Cart items are missing vendor information.')
    }

    const orderData = {
      vendorId,
      items: items.map(item => ({
        productId: item.id,
        quantity: item.qty,
      })),
      deliveryHall,
      deliveryRoom,
      recipientName,
      recipientPhone,
      paymentMethod: paymentMethod === 'paystack' ? 'PAYSTACK' : 'PAY_ON_DELIVERY',
    }

    const res = await api.post('/orders', orderData)
    const order = res.data.order

    // If Paystack, initialize payment and redirect to Paystack checkout
    if (paymentMethod === 'paystack') {
      try {
        const payRes = await api.post('/payments/initialize', { orderId: order.id })
        clearCart()
        // Redirect to Paystack hosted checkout page
        window.location.href = payRes.data.authorizationUrl
      } catch (err) {
        console.error('Payment initialization failed:', err)
        throw err
      }
    } else {
      // Pay on delivery — just clear cart and go to confirmation
      clearCart()
      return order
    }

    return order
  }

  return {
    items,
    subtotal,
    deliveryFee,
    total,
    placeOrder,
  }
}