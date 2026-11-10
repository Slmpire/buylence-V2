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
const { syncProductMirror, withDeal } = require('../services/productUnits')
const { cancelExpiredUnpaidOrders } = require('../services/orderExpiry.service')
const {
  ensureCodes, checkCode, markVerified, regenerateCode, describeCodes,
} = require('../services/orderCodes.service')

class StockError extends Error {}

const MAX_STORES_PER_CHECKOUT = 5

function generateOrderNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
  return `BUY-${suffix}`
}

// Which part this person plays in the order
function roleFor(order, user) {
  if (order.buyerId === user.id) return 'buyer'
  if (user.vendor && order.vendorId === user.vendor.id) return 'vendor'
  if (user.rider && order.riderId === user.rider.id) return 'rider'
  if (user.role === 'ADMIN') return 'admin'
  return null
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

// GET /api/orders/group/:id — one payment and all the orders it covers (buyer or admin)
router.get('/group/:id', authenticate, asyncHandler(async (req, res) => {
  await cancelExpiredUnpaidOrders()

  const group = await prisma.paymentGroup.findUnique({
    where: { id: req.params.id },
    include: {
      orders: {
        include: {
          items: { include: { product: { select: { name: true, images: true } } } },
          vendor: { select: { storeName: true, hall: true, logoUrl: true } },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  })

  if (!group) return res.status(404).json({ error: 'Payment not found.' })
  if (group.buyerId !== req.user.id && req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Access denied.' })
  }

  res.json({ group, orders: group.orders })
}))

// ─────────────────────────────────────────────────────
// BUYER ROUTES
// ─────────────────────────────────────────────────────

// POST /api/orders/checkout   (and the older POST /api/orders, which does the same thing)
// items: [{ productId, unitId?, quantity }]  — products may come from several stores.
// One order is created per store, all covered by a single payment group.
// Every order is paid online and held in escrow, so paymentMethod is PAYSTACK or OPAY.
async function createCheckout(req, res) {
  const {
    items, deliveryHall, deliveryRoom,
    recipientName, recipientPhone, paymentMethod,
  } = req.body

  if (!items?.length || !deliveryHall || !recipientName || !recipientPhone || !paymentMethod) {
    return res.status(400).json({ error: 'items, deliveryHall, recipientName, recipientPhone, and paymentMethod are required.' })
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
    where: { id: { in: productIds }, isActive: true },
    include: {
      units: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      vendor: { select: { id: true, storeName: true, deliveryFee: true } },
    },
  })

  if (products.length !== productIds.length) {
    return res.status(400).json({ error: 'One or more products are unavailable.' })
  }

  // Match every requested line to a real option and price it from that option
  const lines = []
  const needed = new Map() // unitId -> total quantity wanted
  for (const item of requested) {
    const product = products.find(p => p.id === item.productId)
     const rawUnit = item.unitId
      ? product.units.find(u => u.id === item.unitId)
      : product.units[0]

    if (!rawUnit) {
      return res.status(400).json({ error: `${product.name} is no longer sold that way. Please refresh your cart.` })
    }

    // While a deal is running, the order is priced at the deal price
    const unit = withDeal(rawUnit)
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

  // One order per store
  const byVendor = new Map()
  for (const line of lines) {
    const v = line.product.vendor
    if (!byVendor.has(v.id)) byVendor.set(v.id, { vendor: v, lines: [] })
    byVendor.get(v.id).lines.push(line)
  }
  if (byVendor.size > MAX_STORES_PER_CHECKOUT) {
    return res.status(400).json({ error: `You can order from up to ${MAX_STORES_PER_CHECKOUT} stores at once.` })
  }

  const prepared = [...byVendor.values()].map(({ vendor, lines: vendorLines }) => {
    const orderItems = vendorLines.map(({ product, unit, quantity }) => ({
      productId: product.id,
      productUnitId: unit.id,
      unitLabel: unit.label,
      name: product.name,
      price: unit.price,
      quantity,
    }))
    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0)
    const deliveryFee = vendor.deliveryFee
    return { vendor, orderItems, subtotal, deliveryFee, total: subtotal + deliveryFee }
  })
  const groupTotal = prepared.reduce((sum, p) => sum + p.total, 0)

  let result
  try {
    result = await prisma.$transaction(async (tx) => {
      // Take all the stock first. If someone else bought the last one meanwhile, this fails cleanly.
      for (const [unitId, qty] of needed) {
        const taken = await tx.productUnit.updateMany({
          where: { id: unitId, isActive: true, stock: { gte: qty } },
          data: { stock: { decrement: qty } },
        })
        if (taken.count === 0) {
          throw new StockError('Some items just sold out. Please refresh your cart and try again.')
        }
      }
      for (const productId of productIds) await syncProductMirror(tx, productId)

      const group = await tx.paymentGroup.create({
        data: { buyerId: req.user.id, paymentMethod, total: groupTotal },
      })

      const orders = []
      for (const p of prepared) {
        const order = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            buyerId: req.user.id,
            vendorId: p.vendor.id,
            deliveryHall,
            deliveryRoom,
            recipientName,
            recipientPhone,
            subtotal: p.subtotal,
            deliveryFee: p.deliveryFee,
            total: p.total,
            paymentMethod,
            paymentStatus: 'PENDING', // becomes HELD_IN_ESCROW only once the payment is verified
            paystackRef: null,
            status: 'PLACED',
            paymentGroupId: group.id,
            items: { create: p.orderItems },
          },
          include: { items: true, vendor: { select: { storeName: true, hall: true } } },
        })
        orders.push(order)
      }

      return { group, orders }
    })
  } catch (err) {
    if (err instanceof StockError) return res.status(409).json({ error: err.message })
    throw err
  }

  const { group, orders } = result
  const stores = orders.map(o => o.vendor.storeName)

  // Tell the buyer. Each store is told once the payment is confirmed.
  notifyUser(req.user.id, {
    title: orders.length > 1 ? `Orders Placed (${orders.length} stores)` : `Order Placed (${orders[0].orderNumber})`,
    message: orders.length > 1
      ? `Your orders from ${stores.join(', ')} are waiting for payment. Complete it soon so we can send them to the stores.`
      : `Your order from ${stores[0]} is waiting for payment. Complete it soon so we can send it to the store.`,
    type: 'ORDER',
    link: orders.length > 1 ? '/orders' : `/orders/${orders[0].id}`,
    category: 'orderUpdates',
  }).catch(() => {})

  // `order` (the first one) keeps older screens working
  res.status(201).json({ group, orders, order: orders[0] })
}

router.post('/checkout', authenticate, requireRole('BUYER', 'VENDOR'), asyncHandler(createCheckout))
router.post('/', authenticate, requireRole('BUYER', 'VENDOR'), asyncHandler(createCheckout))

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

// GET /api/orders/:id/codes — the pickup / delivery code this person is allowed to see.
// Vendors see the pickup code, buyers see the delivery code, riders never see a code.
router.get('/:id/codes', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { code: true },
  })
  if (!order) return res.status(404).json({ error: 'Order not found.' })

  const role = roleFor(order, req.user)
  if (!role) return res.status(403).json({ error: 'Access denied.' })

  res.json({ codes: describeCodes(order, role) })
}))

// POST /api/orders/:id/codes/regenerate — the owner gets a fresh code (and a fresh set of tries)
router.post('/:id/codes/regenerate', authenticate, asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { code: true },
  })
  if (!order) return res.status(404).json({ error: 'Order not found.' })

  const role = roleFor(order, req.user)
  if (role !== 'vendor' && role !== 'buyer') {
    return res.status(403).json({ error: 'Only the store or the customer can renew a code.' })
  }
  if (!order.code) return res.status(400).json({ error: 'This order does not use codes.' })

  const kind = role === 'vendor' ? 'pickup' : 'delivery'
  const allowedStatuses = kind === 'pickup'
    ? ['READY_FOR_PICKUP', 'ASSIGNED_TO_RIDER']
    : ['ASSIGNED_TO_RIDER', 'PICKED_UP']

  if (!allowedStatuses.includes(order.status)) {
    return res.status(400).json({ error: 'A new code is not needed at this stage.' })
  }
  if (kind === 'pickup' ? order.code.pickupVerifiedAt : order.code.deliveryVerifiedAt) {
    return res.status(400).json({ error: 'This step is already confirmed.' })
  }

  await regenerateCode(order.id, kind)

  const fresh = await prisma.order.findUnique({
    where: { id: order.id },
    include: { code: true },
  })
  res.json({ codes: describeCodes(fresh, role), message: 'Here is your new code.' })
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
      paymentGroup: {
        select: { id: true, total: true, status: true, _count: { select: { orders: true } } },
      },
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

  // The pickup code (for the store to hand to the rider) and the delivery code
  // (for the buyer to give the rider) are created now
  await ensureCodes(prisma, order.id)

  notifyUser(order.buyerId, {
    title: `Order Ready (${order.orderNumber})`,
    message: `Your order is ready for pickup and has been assigned to the delivery pool.`,
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})

  // Let the riders know there is something to pick up
  notifyRidersOfPickup(order.id)

  res.json({ order: updated, message: 'Order is now in the rider pool. Give the rider your pickup code when they arrive.' })
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

  // An unpaid order that is part of a group is cancelled together with the rest of the group,
  // because the one payment can no longer be completed
  let targets = [order]
  if (order.paymentGroupId && order.paymentStatus === 'PENDING') {
    const siblings = await prisma.order.findMany({
      where: { paymentGroupId: order.paymentGroupId, paymentStatus: 'PENDING', status: 'PLACED' },
      include: { items: true },
    })
    if (siblings.some(s => s.id === order.id)) targets = siblings
  }

  const updated = await prisma.$transaction(async (tx) => {
    let requested = null
    const touched = new Set()

    for (const target of targets) {
      const cancelled = await tx.order.update({
        where: { id: target.id },
        data: {
          status: 'CANCELLED',
          paymentStatus: target.paymentStatus === 'HELD_IN_ESCROW' ? 'REFUNDED' : target.paymentStatus,
        },
      })
      if (target.id === order.id) requested = cancelled

      // Put the stock back on the shelf
      for (const item of target.items) {
        if (!item.productUnitId) continue
        await tx.productUnit.updateMany({
          where: { id: item.productUnitId },
          data: { stock: { increment: item.quantity } },
        })
        touched.add(item.productId)
      }
    }
    for (const productId of touched) await syncProductMirror(tx, productId)

    if (order.paymentGroupId && order.paymentStatus === 'PENDING') {
      await tx.paymentGroup.updateMany({
        where: { id: order.paymentGroupId, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      })
    }

    return requested
  })

  notifyUser(order.buyerId, {
    title: targets.length > 1 ? `Orders Cancelled (${targets.length})` : `Order Cancelled (${order.orderNumber})`,
    message: targets.length > 1
      ? 'Your unpaid orders from this checkout were cancelled together.'
      : 'Your order has been cancelled.',
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})

  res.json({
    order: updated,
    message: targets.length > 1 ? 'The unpaid orders from this checkout were cancelled together.' : 'Order cancelled.',
  })
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
    message: `Order claimed. You have ${timeoutMinutes} minutes to pick it up before it returns to the pool. Ask the store for the pickup code.`,
    claimExpiresAt,
  })
}))

// POST /api/orders/:id/picked-up — rider. Needs the store's 6-digit pickup code.
router.post('/:id/picked-up', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.riderId !== req.user.rider.id) return res.status(403).json({ error: 'This is not your delivery.' })
  if (order.status !== 'ASSIGNED_TO_RIDER') {
    return res.status(400).json({ error: `Cannot mark picked up — order is currently ${order.status}.` })
  }

  const check = await checkCode(order.id, 'pickup', req.body?.code)
  if (!check.ok) {
    return res.status(check.status).json({
      error: check.error, locked: !!check.locked, attemptsLeft: check.attemptsLeft ?? null,
    })
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'PICKED_UP',
      pickedUpAt: new Date(),
    },
  })
  await markVerified(order.id, 'pickup')

  notifyUser(order.buyerId, {
    title: `On its way (${order.orderNumber})`,
    message: `Your order was collected from the store. Keep your delivery code ready and give it to the rider only when you have your items.`,
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})

  res.json({ order: updated, message: 'Pickup confirmed. Head to the delivery location and ask the customer for their delivery code.' })
}))

// POST /api/orders/:id/delivered — rider. Needs the buyer's 6-digit delivery code.
router.post('/:id/delivered', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } })

  if (!order) return res.status(404).json({ error: 'Order not found.' })
  if (order.riderId !== req.user.rider.id) return res.status(403).json({ error: 'This is not your delivery.' })
  if (order.status !== 'PICKED_UP') {
    return res.status(400).json({ error: `Cannot mark delivered — order is currently ${order.status}.` })
  }

  const check = await checkCode(order.id, 'delivery', req.body?.code)
  if (!check.ok) {
    return res.status(check.status).json({
      error: check.error, locked: !!check.locked, attemptsLeft: check.attemptsLeft ?? null,
    })
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
  await markVerified(order.id, 'delivery')

  res.json({
    order: updated,
    message: 'Delivery confirmed with the customer\'s code. Waiting for them to confirm receipt to release payment.',
  })

  notifyUser(order.buyerId, {
    title: `Order Delivered (${order.orderNumber})`,
    message: `Your delivery code was accepted. Please confirm receipt so the store can be paid.`,
    type: 'ORDER',
    link: `/orders/${order.id}`,
    category: 'orderUpdates',
  }).catch(() => {})
}))

module.exports = router