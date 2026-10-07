const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const authenticate = require('../middleware/auth')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { initializePayment, verifyPayment } = require('../services/paystack.service')
const { notifyUser } = require('../controllers/notification.controller')

const toKobo = (naira) => Math.round(Number(naira) * 100)
const frontendUrl = () => process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173'

// Checks a Paystack transaction against the order, then moves the order
// PENDING -> HELD_IN_ESCROW. Safe to call many times (verify + webhook both use it).
async function applyPayment(order, txn) {
  if (txn.status !== 'success') return { ok: false, reason: `Payment not successful (${txn.status}).` }
  if (txn.currency && txn.currency !== 'NGN') return { ok: false, reason: 'Unexpected currency.' }
  if (Number(txn.amount) !== toKobo(order.total)) {
    console.error(`Amount mismatch on ${order.orderNumber}: paid ${txn.amount}, expected ${toKobo(order.total)}`)
    return { ok: false, reason: 'Amount paid does not match the order total.' }
  }

  const result = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: 'PENDING' },
    data: { paymentStatus: 'HELD_IN_ESCROW' },
  })

  if (result.count > 0) {
    notifyUser(order.buyerId, {
      title: `Payment received (${order.orderNumber})`,
      message: 'Your payment is held safely until you confirm delivery.',
      type: 'ORDER',
      link: `/orders/${order.id}`,
      category: 'orderUpdates',
    }).catch(() => {})
  }
  return { ok: true }
}

// POST /api/payments/initialize — start a Paystack payment for an existing order
router.post('/initialize', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.body
  if (!orderId) return res.status(400).json({ error: 'orderId is required.' })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { buyer: { select: { email: true, fullName: true } } },
  })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Access denied.' })
  if (order.paymentMethod !== 'PAYSTACK') return res.status(400).json({ error: 'This order is not a Paystack order.' })
  if (order.paymentStatus !== 'PENDING') return res.status(400).json({ error: 'This order has already been paid for.' })
  if (order.status === 'CANCELLED') return res.status(400).json({ error: 'This order was cancelled.' })

  // Unique reference per attempt, so a buyer can retry a failed payment
  const reference = `${order.orderNumber}-${Date.now().toString(36)}`

  let data
  try {
    data = await initializePayment({
      email: order.buyer.email,
      amount: toKobo(order.total),
      reference,
      callback_url: `${frontendUrl()}/order-confirmation?orderId=${order.id}`,
      metadata: { orderId: order.id, orderNumber: order.orderNumber, buyerName: order.buyer.fullName },
    })
  } catch (err) {
    console.error('Paystack initialize failed:', err.response?.data || err.message)
    return res.status(502).json({ error: 'Could not start the payment. Please try again.' })
  }

  await prisma.order.update({ where: { id: order.id }, data: { paystackRef: reference } })

  res.json({ authorizationUrl: data.authorization_url, reference })
}))

// POST /api/payments/verify/:reference — called after the buyer returns from Paystack
router.post('/verify/:reference', authenticate, asyncHandler(async (req, res) => {
  const { reference } = req.params

  const order = await prisma.order.findFirst({ where: { paystackRef: reference } })
  if (!order) return res.status(404).json({ error: 'Order not found for this payment reference.' })
  if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Access denied.' })

  if (order.paymentStatus !== 'PENDING') {
    return res.json({ order, message: 'Payment already confirmed.' })
  }

  let txn
  try {
    txn = await verifyPayment(reference)
  } catch (err) {
    console.error('Paystack verify failed:', err.response?.data || err.message)
    return res.status(502).json({ error: 'Could not reach Paystack to confirm the payment. Please try again.' })
  }

  const result = await applyPayment(order, txn)
  if (!result.ok) return res.status(400).json({ error: result.reason, status: txn.status })

  const updated = await prisma.order.findUnique({ where: { id: order.id } })
  res.json({ order: updated, message: 'Payment confirmed and held in escrow.' })
}))

// POST /api/payments/webhook — Paystack calls this directly (no login)
router.post('/webhook', asyncHandler(async (req, res) => {
  const signature = req.headers['x-paystack-signature']
  const expected = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
    .update(req.rawBody || '')
    .digest('hex')

  if (!signature || signature !== expected) return res.sendStatus(401)

  const event = req.body
  if (event?.event === 'charge.success') {
    const order = await prisma.order.findFirst({ where: { paystackRef: event.data?.reference } })
    if (order && order.paymentStatus === 'PENDING') {
      await applyPayment(order, event.data)
    }
  }

  res.sendStatus(200) // always 200 so Paystack stops retrying
}))

module.exports = router