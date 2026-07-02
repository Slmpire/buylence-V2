const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { createCheckoutOrder, fetchCheckoutOrder } = require('../services/nomba.service')

// POST /api/payments/initialize
// Buyer — create a Nomba checkout order for an existing order
router.post('/initialize', authenticate, asyncHandler(async (req, res) => {
  const { orderId } = req.body

  if (!orderId) return res.status(400).json({ error: 'orderId is required.' })

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { buyer: { select: { email: true, fullName: true } } },
  })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Access denied.' })
  if (order.paymentStatus !== 'PENDING') {
    return res.status(400).json({ error: 'This order has already been paid for.' })
  }

  const callbackUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/order-confirmation?orderId=${order.id}`

  const result = await createCheckoutOrder({
    amount: order.total,
    orderReference: order.orderNumber,
    customerEmail: order.buyer.email,
    callbackUrl,
    metadata: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      buyerName: order.buyer.fullName,
    },
  })

  // Save the Nomba order reference against the order
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paystackRef: result.orderReference,
      paymentStatus: 'PENDING',
    },
  })

  res.json({
    checkoutLink: result.checkoutLink,
    orderReference: result.orderReference,
  })
}))

// POST /api/payments/verify/:orderReference
// Buyer — manually verify a Nomba payment (fallback if webhook delayed)
router.post('/verify/:orderReference', authenticate, asyncHandler(async (req, res) => {
  const { orderReference } = req.params

  const nombaOrder = await fetchCheckoutOrder(orderReference)

  // Nomba uses 'paid' or 'successful' as success status
  const isPaid = nombaOrder?.status?.toLowerCase() === 'paid' ||
    nombaOrder?.status?.toLowerCase() === 'successful'

  if (!isPaid) {
    return res.status(400).json({
      error: 'Payment not confirmed yet.',
      status: nombaOrder?.status,
    })
  }

  const order = await prisma.order.findFirst({
    where: { paystackRef: orderReference },
  })

  if (!order) return res.status(404).json({ error: 'Order not found for this payment reference.' })
  if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Access denied.' })

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'HELD_IN_ESCROW' },
  })

  res.json({ order: updated, message: 'Payment confirmed and held in escrow.' })
}))

// POST /api/payments/webhook
// Nomba webhook — called by Nomba when payment_success event fires
// No authenticate middleware — Nomba calls this directly
router.post('/webhook', express.json(), asyncHandler(async (req, res) => {
  const event = req.body

  console.log('Nomba webhook received:', event?.event_type)

  if (event?.event_type === 'payment_success') {
    const orderReference = event?.data?.order?.orderReference

    if (orderReference) {
      const order = await prisma.order.findFirst({
        where: { paystackRef: orderReference },
      })

      if (order && order.paymentStatus === 'PENDING') {
        await prisma.order.update({
          where: { id: order.id },
          data: { paymentStatus: 'HELD_IN_ESCROW' },
        })
        console.log(`✅ Nomba webhook: payment confirmed for order ${order.orderNumber}`)
      }
    }
  }

  // Always return 200 so Nomba stops retrying
  res.sendStatus(200)
}))

module.exports = router