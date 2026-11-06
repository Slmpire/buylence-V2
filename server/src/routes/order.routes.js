const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { releaseEscrow } = require('../services/escrow.service')
const { revertExpiredClaims } = require('../services/claimExpiry.service')
const { notifyUser } = require('../controllers/notification.controller')
const { notifyRidersOfPickup } = require('../services/orderNotifications')
const { syncProductMirror } = require('../services/productUnits')
const { cancelExpiredUnpaidOrders } = require('../services/orderExpiry.service')

class StockError extends Error {}

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
      items: { select: { name: true, quantity: true, price: true, unitLabel: true } },
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

  // A store only sees an order once it is paid. (Older pay-on-delivery orders still show.)
  const where = {
    vendorId: req.user.vendor.id,
    OR: [
      { paymentMethod: 'PAY_ON_DELIVERY' },
      { paymentStatus: { not: 'PENDING' } },
    ],
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
// items: [{ productId, unitId?, quantity }]  (no unitId = the product's first option)
// Every order is paid online and held in escrow, so paymentMethod is PAYSTACK or OPAY.
router.post('/', authenticate, requireRole('BUYER', 'VENDOR'), asyncHandler(async (req, res) => {
  const {
    vendorId, items, deliveryHall, deliveryRoom,
    recipientName, recipientPhone, paymentMethod,
  } = req.body

  if (!vendorId || !items?.length || !deliveryHall || !recipientName || !recipientPhone || !paymentMethod) {
    return res.status(400).json({ error: 'vendorId, items, deliveryHall, recipientName, recipientPhone, and paymentMethod are required.' })
  }
  if (!['PAYSTACK', 'OPAY'].includes(paymentMethod)) {
    return res.status(400).json({ error: 'Please pay online with Paystack or OPay. Your money is held safely in escrow until delivery.' })
  }

  const requested = items.map(i => ({
    productId: i.productId,
    unitId: i.unitId || null,
    quantity: Number(i.quantity),
  }))
  if (requested.some(i => !i.productId || !Number.isInteger(i.quantity) || i.quantity < 1)) {
    return res.status(400).json({ error: 'Invalid item quantity.' })
  }

  const productIds = [...new Set(requested.map(i => i.productId))]
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true, vendorId },
    include: { units: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
  })

  if (products.length !== productIds.length) {
    return res.status(400).json({ error: 'One or more products are unavailable.' })
  }

  const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found.' })

  // Match every requested line to a real option and price it from that option
  const lines = []
  const needed = new Map() // unitId -> total quantity wanted
  for (const item of requested) {
    const product = products.find(p => p.id === item.productId)
    const unit = item.unitId
      ? product.units.find(u => u.id === item.unitId)
      : product.units[0]

    if (!unit) {
      return res.status(400).json({ error: `${product.name} is no longer sold that way. Please refresh your cart.` })
    }
    lines.push({ product, unit, quantity: item.quantity })
    needed.set(unit.id, (needed.get(unit.id) || 0) + item.quantity)
  }

  // Friendly stock message before we touch anything
  for (const [unitId, qty] of needed) {
    const line = lines.find(l => l.unit.id === unitId)
    if (line.unit.stock < qty) {
      const left = line.unit.stock
      return res.status(409).json({
        error: left === 0
          ? `${line.product.name} (${line.unit.label}) is out of stock.`
          : `Only ${left} ${line.unit.label} of ${line.product.name} left.`,
      })
    }
  }

  const orderItems = lines.map(({ product, unit, quantity }) => ({
    productId: product.id,
    productUnitId: unit.id,
    unitLabel: unit.label,
    name: product.name,
    price: unit.price,
    quantity,
  }))

  const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const deliveryFee = vendor.deliveryFee
  const total = subtotal + deliveryFee

  let order
  try {
    order = await prisma.$transaction(async (tx) => {
      // Take the stock first. If someone else bought the last one in the meantime, this fails cleanly.
      for (const [unitId, qty] of needed) {
        const result = await tx.productUnit.updateMany({
          where: { id: unitId, isActive: true, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        })
        if (result.count === 0) {
          throw new StockError('Some items just sold out. Please refresh your cart and try again.')
        }
      }
      for (const productId of productIds) await syncProductMirror(tx, productId)

      return tx.order.create({
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
          paymentStatus: 'PENDING', // becomes HELD_IN_ESCROW only once the payment is verified
          paystackRef: null,
          status: 'PLACED',
          items: { create: orderItems },
        },
        include: { items: true, vendor: { select: { storeName: true, hall: true } } },
      })
    })
  } catch (err) {
    if (err instanceof StockError) return res.status(409).json({ error: err.message })
    throw err
  }

  // Tell the buyer. The store is told once the payment is confirmed.
  notifyUser(req.user.id, {
    title: `Order Placed (${order.orderNumber})`,
    message: `Your order from ${vendor.storeName} is waiting for payment. Complete it soon so we can send it to the store.`,
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})

  res.status(201).json({ order })
}))

// GET /api/orders — buyer's own orders
router.get('/', authenticate, asyncHandler(async (req, res) => {
  await cancelExpiredUnpaidOrders()

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
  await cancelExpiredUnpaidOrders()

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

  notifyUser(order.buyerId, {
    title: `Order Completed (${order.orderNumber})`,
    message: `Payment released. Thank you for shopping on Buylence!`,
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})

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
  if (order.paymentMethod !== 'PAY_ON_DELIVERY' && order.paymentStatus === 'PENDING') {
    return res.status(400).json({ error: 'This order has not been paid for yet.' })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'PREPARING' },
  })

  notifyUser(order.buyerId, {
    title: `Order Preparing (${order.orderNumber})`,
    message: `The vendor has started preparing your order.`,
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})

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

  notifyUser(order.buyerId, {
    title: `Order Ready (${order.orderNumber})`,
    message: `Your order is ready for pickup and has been assigned to the delivery pool.`,
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})

  // Let the riders know there is something to pick up
  notifyRidersOfPickup(order.id)

  res.json({ order: updated, message: 'Order is now in the rider pool.' })
}))

// POST /api/orders/:id/cancel — buyer or vendor
router.post('/:id/cancel', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true },
  })

  if (!order) return res.status(404).json({ error: 'Order not found.' })

  const isBuyer = order.buyerId === req.user.id
  const isVendor = req.user.vendor && order.vendorId === req.user.vendor.id

  if (!isBuyer && !isVendor) return res.status(403).json({ error: 'Access denied.' })

  if (!['PLACED', 'PREPARING'].includes(order.status)) {
    return res.status(400).json({ error: `Order cannot be cancelled at status: ${order.status}.` })
  }

  const updated = await prisma.$transaction(async (tx) => {
    const cancelled = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CANCELLED',
        paymentStatus: order.paymentStatus === 'HELD_IN_ESCROW' ? 'REFUNDED' : order.paymentStatus,
      },
    })

    // Put the stock back on the shelf
    const touched = new Set()
    for (const item of order.items) {
      if (!item.productUnitId) continue
      await tx.productUnit.updateMany({
        where: { id: item.productUnitId },
        data: { stock: { increment: item.quantity } },
      })
      touched.add(item.productId)
    }
    for (const productId of touched) await syncProductMirror(tx, productId)

    return cancelled
  })

  notifyUser(order.buyerId, {
    title: `Order Cancelled (${order.orderNumber})`,
    message: `Your order has been cancelled.`,
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})

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

  res.json({ order: updated, message: 'Marked as picked up. Head to the delivery location.' })
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

  notifyUser(order.buyerId, {
    title: `Order Delivered (${order.orderNumber})`,
    message: `Rider has delivered your order to ${order.deliveryHall}. Please confirm receipt.`,
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})
}))

module.exports = router