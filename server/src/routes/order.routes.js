const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { releaseEscrow } = require('../services/escrow.service')
const { revertExpiredClaims } = require('../services/claimExpiry.service')

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `BUY-${suffix}`
}

// ─────────────────────────────────────────────────────
// SPECIFIC NAMED ROUTES FIRST — before /:id
// ─────────────────────────────────────────────────────

// GET /api/orders/admin/all — admin only
router.get('/admin/all', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const orders = await prisma.order.findMany({
    include: {
      vendor: { select: { storeName: true, hall: true } },
      buyer: { select: { fullName: true } },
      items: { select: { name: true, quantity: true, price: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  res.json({ orders, total: orders.length })
}))

// GET /api/orders/vendor/all — vendor only
router.get('/vendor/all', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {
    vendorId: req.user.vendor.id,
    ...(status && { status }),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        buyer: { select: { fullName: true, phone: true, hall: true, room: true } },
        rider: { select: { user: { select: { fullName: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.order.count({ where }),
  ])

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
}))

// GET /api/orders/rider/pool — rider only
router.get('/rider/pool', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  await revertExpiredClaims()

  const orders = await prisma.order.findMany({
    where: { status: 'READY_FOR_PICKUP' },
    include: {
      vendor: { select: { storeName: true, hall: true } },
      buyer: { select: { fullName: true, hall: true, room: true } },
      items: true,
    },
    orderBy: { readyForPickupAt: 'asc' },
  })

  res.json({ orders })
}))

// GET /api/orders/rider/my-deliveries — rider only
router.get('/rider/my-deliveries', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  await revertExpiredClaims()

  const orders = await prisma.order.findMany({
    where: {
      riderId: req.user.rider.id,
      status: { in: ['ASSIGNED_TO_RIDER', 'PICKED_UP'] },
    },
    include: {
      vendor: { select: { storeName: true, hall: true } },
      buyer: { select: { fullName: true, phone: true, hall: true, room: true } },
      items: true,
    },
    orderBy: { claimedAt: 'asc' },
  })

  res.json({ orders })
}))

// ─────────────────────────────────────────────────────
// BUYER ROUTES
// ─────────────────────────────────────────────────────

// POST /api/orders
router.post('/', authenticate, requireRole('BUYER', 'VENDOR'), asyncHandler(async (req, res) => {
  const {
    vendorId, items, deliveryHall, deliveryRoom,
    recipientName, recipientPhone, paymentMethod, paystackRef,
  } = req.body

  if (!vendorId || !items?.length || !deliveryHall || !recipientName || !recipientPhone || !paymentMethod) {
    return res.status(400).json({ error: 'vendorId, items, deliveryHall, recipientName, recipientPhone, and paymentMethod are required.' })
  }

  const productIds = items.map(i => i.productId)
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  })

  if (products.length !== productIds.length) {
    return res.status(400).json({ error: 'One or more products are unavailable.' })
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found.' })

  const orderItems = items.map(item => {
    const product = products.find(p => p.id === item.productId)
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: Number(item.quantity),
    }
  })

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const deliveryFee = vendor.deliveryFee
  const total = subtotal + deliveryFee

  const order = await prisma.order.create({
    data: {
      orderNumber: generateOrderNumber(),
      buyerId: req.user.id,
      vendorId,
      deliveryHall,
      deliveryRoom,
      recipientName,
      recipientPhone,
      subtotal,
      deliveryFee,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'NOMBA' ? 'HELD_IN_ESCROW' : 'PENDING',
      paystackRef: paystackRef || null,
      status: 'PLACED',
      items: { create: orderItems },
    },
    include: { items: true, vendor: { select: { storeName: true, hall: true } } },
  })

  res.status(201).json({ order })
}))

// GET /api/orders — buyer's own orders
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {
    buyerId: req.user.id,
    ...(status && { status }),
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        items: true,
        vendor: { select: { storeName: true, hall: true, logoUrl: true } },
        rider: { select: { user: { select: { fullName: true, phone: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.order.count({ where }),
  ])

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
}))

// GET /api/orders/:id — MUST be after all named GET routes
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      items: { include: { product: { select: { name: true, images: true } } } },
      vendor: { select: { storeName: true, hall: true, logoUrl: true, deliveryFee: true, rating: true } },
      buyer: { select: { fullName: true, phone: true } },
      rider: { select: { user: { select: { fullName: true, phone: true } } } },
    },
  })

  if (!order) return res.status(404).json({ error: 'Order not found.' })

  const isBuyer = order.buyerId === req.user.id
  const isVendor = req.user.vendor && order.vendorId === req.user.vendor.id
  const isRider = req.user.rider && order.riderId === req.user.rider.id
  const isAdmin = req.user.role === 'ADMIN'

  if (!isBuyer && !isVendor && !isRider && !isAdmin) {
    return res.status(403).json({ error: 'Access denied.' })
  }

  res.json({ order })
}))

// ─────────────────────────────────────────────────────
// PARAMETERIZED POST ROUTES
// ─────────────────────────────────────────────────────

// POST /api/orders/:id/confirm-receipt — buyer
router.post('/:id/confirm-receipt', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Only the buyer can confirm receipt.' })
  if (order.status !== 'DELIVERED_BY_RIDER') {
    return res.status(400).json({ error: 'Order has not been marked delivered by the rider yet.' })
  }
  if (order.buyerConfirmedAt) {
    return res.status(400).json({ error: 'You have already confirmed receipt for this order.' })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CONFIRMED_BY_BUYER',
      buyerConfirmedAt: new Date(),
    },
  })

  await releaseEscrow(updated)

  res.json({ order: updated, message: 'Receipt confirmed. Payment has been released to the vendor.' })
}))

// POST /api/orders/:id/confirm-preparing — vendor
router.post('/:id/confirm-preparing', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.vendorId !== req.user.vendor.id) return res.status(403).json({ error: 'This is not your order.' })
  if (order.status !== 'PLACED') {
    return res.status(400).json({ error: `Cannot confirm — order is currently ${order.status}.` })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'PREPARING' },
  })

  res.json({ order: updated, message: 'Order confirmed. Start preparing it for pickup.' })
}))

// POST /api/orders/:id/ready-for-pickup — vendor
router.post('/:id/ready-for-pickup', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.vendorId !== req.user.vendor.id) return res.status(403).json({ error: 'This is not your order.' })
  if (order.status !== 'PREPARING') {
    return res.status(400).json({ error: `Cannot mark ready — order is currently ${order.status}.` })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'READY_FOR_PICKUP',
      readyForPickupAt: new Date(),
    },
  })

  res.json({ order: updated, message: 'Order is now in the rider pool.' })
}))

// POST /api/orders/:id/cancel — buyer or vendor
router.post('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })

  if (!order) return res.status(404).json({ error: 'Order not found.' })

  const isBuyer = order.buyerId === req.user.id
  const isVendor = req.user.vendor && order.vendorId === req.user.vendor.id

  if (!isBuyer && !isVendor) return res.status(403).json({ error: 'Access denied.' })

  if (!['PLACED', 'PREPARING'].includes(order.status)) {
    return res.status(400).json({ error: `Order cannot be cancelled at status: ${order.status}.` })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      paymentStatus: order.paymentStatus === 'HELD_IN_ESCROW' ? 'REFUNDED' : order.paymentStatus,
    },
  })

  res.json({ order: updated, message: 'Order cancelled.' })
}))

// POST /api/orders/:id/claim — rider
router.post('/:id/claim', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  await revertExpiredClaims()

  const order = await prisma.order.findUnique({ where: { id: req.params.id } })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.status !== 'READY_FOR_PICKUP') {
    return res.status(400).json({ error: 'This order is no longer available in the pool.' })
  }

  const timeoutMinutes = Number(process.env.RIDER_CLAIM_TIMEOUT_MINUTES) || 15
  const claimedAt = new Date()
  const claimExpiresAt = new Date(claimedAt.getTime() + timeoutMinutes * 60 * 1000)

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'ASSIGNED_TO_RIDER',
      riderId: req.user.rider.id,
      claimedAt,
      claimExpiresAt,
    },
    include: {
      vendor: { select: { storeName: true, hall: true } },
      buyer: { select: { fullName: true, phone: true, hall: true, room: true } },
      items: true,
    },
  })

  res.json({
    order: updated,
    message: `Order claimed. You have ${timeoutMinutes} minutes to pick it up before it returns to the pool.`,
    claimExpiresAt,
  })
}))

// POST /api/orders/:id/picked-up — rider
router.post('/:id/picked-up', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.riderId !== req.user.rider.id) return res.status(403).json({ error: 'This is not your delivery.' })
  if (order.status !== 'ASSIGNED_TO_RIDER') {
    return res.status(400).json({ error: `Cannot mark picked up — order is currently ${order.status}.` })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'PICKED_UP',
      pickedUpAt: new Date(),
    },
  })

  res.json({ order: updated, message: 'Marked as picked up. Head to the delivery hall.' })
}))

// POST /api/orders/:id/delivered — rider
router.post('/:id/delivered', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.riderId !== req.user.rider.id) return res.status(403).json({ error: 'This is not your delivery.' })
  if (order.status !== 'PICKED_UP') {
    return res.status(400).json({ error: `Cannot mark delivered — order is currently ${order.status}.` })
  }

  const [updated] = await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'DELIVERED_BY_RIDER',
        riderConfirmedAt: new Date(),
      },
    }),
    prisma.rider.update({
      where: { id: req.user.rider.id },
      data: { totalDeliveries: { increment: 1 } },
    }),
  ])

  res.json({
    order: updated,
    message: 'Marked as delivered. Waiting for buyer to confirm receipt to release payment.',
  })
}))

module.exports = router