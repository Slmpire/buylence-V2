const express = require('express')
const crypto = require('crypto')
const router = express.Router()
const authenticate = require('../middleware/auth')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { initializePayment, verifyPayment } = require('../services/paystack.service')
const { createCashierPayment, verifyCallbackSignature } = require('../services/opay.service')
const { notifyUser } = require('../controllers/notification.controller')
const { notifyVendorOfNewOrder } = require('../services/orderNotifications')

const toKobo = (naira) => Math.round(Number(naira) * 100)
const frontendUrl = () => process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173'

const GROUP_INCLUDE = {
  orders: {
    include: {
      items: true,
      vendor: { select: { storeName: true, hall: true } },
    },
  },
}

// ─────────────────────────────────────────────────────
// SETTLING A PAYMENT
// ─────────────────────────────────────────────────────

// Returns a problem message, or null when the payment matches what we expected
function checkPayment(txn, expectedNaira, label) {
  if (txn.status !== 'success') return `Payment not successful (${txn.status}).`
  if (txn.currency && txn.currency !== 'NGN') return 'Unexpected currency.'
  if (Number(txn.amount) !== toKobo(expectedNaira)) {
    console.error(`Amount mismatch on ${label}: paid ${txn.amount}, expected ${toKobo(expectedNaira)}`)
    return 'Amount paid does not match the order total.'
  }
  return null
}

// One payment covering one or more orders (the normal case now).
// Safe to call many times (verify + webhooks all use it).
async function settleGroup(groupId, txn) {
  const group = await prisma.paymentGroup.findUnique({
    where: { id: groupId },
    include: { orders: true },
  })
  if (!group) return { ok: false, reason: 'Payment not found.' }
  if (group.status === 'PAID') return { ok: true }

  if (group.orders.some(o => o.status === 'CANCELLED')) {
    // Money arrived for orders we had already cancelled (for example they expired).
    // It needs refunding from the Paystack / OPay dashboard.
    console.error(`PAID AFTER CANCEL: payment group ${group.id} needs a refund`)
    return { ok: false, reason: 'These orders were cancelled, so the payment could not be applied.' }
  }

  const problem = checkPayment(txn, group.total, `group ${group.id}`)
  if (problem) return { ok: false, reason: problem }

  const claimed = await prisma.$transaction(async (tx) => {
    const result = await tx.paymentGroup.updateMany({
      where: { id: group.id, status: 'PENDING' },
      data: { status: 'PAID' },
    })
    if (result.count === 0) return false

    await tx.order.updateMany({
      where: { paymentGroupId: group.id, paymentStatus: 'PENDING' },
      data: { paymentStatus: 'HELD_IN_ESCROW' },
    })
    return true
  })

  if (claimed) {
    const many = group.orders.length > 1
    notifyUser(group.buyerId, {
      title: many ? `Payment received (${group.orders.length} orders)` : `Payment received (${group.orders[0]?.orderNumber})`,
      message: many
        ? 'Your payment is held safely until you confirm each delivery.'
        : 'Your payment is held safely until you confirm delivery.',
      type: 'ORDER',
      link: many ? '/orders' : `/orders/${group.orders[0]?.id}`,
      category: 'orderUpdates',
    }).catch(() => {})

    // Each store only hears about its own order, and only once it is paid
    for (const order of group.orders) notifyVendorOfNewOrder(order.id)
  }
  return { ok: true }
}

// An order from before payment groups existed
async function settleOrder(order, txn) {
  if (order.status === 'CANCELLED') {
    console.error(`PAID AFTER CANCEL: order ${order.orderNumber} needs a refund`)
    return { ok: false, reason: 'This order was cancelled, so the payment could not be applied.' }
  }
  const problem = checkPayment(txn, order.total, order.orderNumber)
  if (problem) return { ok: false, reason: problem }

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
    notifyVendorOfNewOrder(order.id)
  }
  return { ok: true }
}

// ─────────────────────────────────────────────────────
// WHAT IS BEING PAID FOR
// ─────────────────────────────────────────────────────

// The caller can send { groupId } or { orderId }. An order that belongs to a group
// is always paid for as the whole group. Returns { error: [status, message] } or the target.
async function resolveTarget(req) {
  const { orderId, groupId } = req.body
  let group = null
  let legacy = null

  if (groupId) {
    group = await prisma.paymentGroup.findUnique({ where: { id: groupId }, include: GROUP_INCLUDE })
    if (!group) return { error: [404, 'Payment not found.'] }
  } else if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { items: true } })
    if (!order) return { error: [404, 'Order not found.'] }
    if (order.paymentGroupId) {
      group = await prisma.paymentGroup.findUnique({ where: { id: order.paymentGroupId }, include: GROUP_INCLUDE })
    } else {
      legacy = order
    }
  } else {
    return { error: [400, 'orderId or groupId is required.'] }
  }

  if (group) {
    if (group.buyerId !== req.user.id) return { error: [403, 'Access denied.'] }
    if (group.status === 'PAID') return { error: [400, 'This order has already been paid for.'] }
    if (group.status !== 'PENDING' || group.orders.some(o => o.status === 'CANCELLED')) {
      return { error: [400, 'This order was cancelled.'] }
    }
    return {
      kind: 'group',
      id: group.id,
      method: group.paymentMethod,
      amount: group.total,
      label: group.orders[0]?.orderNumber || group.id,
      items: group.orders.flatMap(o => o.items),
      returnQuery: `groupId=${group.id}`,
    }
  }

  if (legacy.buyerId !== req.user.id) return { error: [403, 'Access denied.'] }
  if (legacy.paymentStatus !== 'PENDING') return { error: [400, 'This order has already been paid for.'] }
  if (legacy.status === 'CANCELLED') return { error: [400, 'This order was cancelled.'] }
  return {
    kind: 'order',
    id: legacy.id,
    method: legacy.paymentMethod,
    amount: legacy.total,
    label: legacy.orderNumber,
    items: legacy.items,
    returnQuery: `orderId=${legacy.id}`,
  }
}

async function saveReference(target, field, reference) {
  if (target.kind === 'group') {
    await prisma.paymentGroup.update({ where: { id: target.id }, data: { reference } })
  } else {
    await prisma.order.update({ where: { id: target.id }, data: { [field]: reference } })
  }
}

// Reload a group for sending back to the browser
function loadGroup(id) {
  return prisma.paymentGroup.findUnique({
    where: { id },
    include: {
      orders: {
        include: {
          items: { include: { product: { select: { name: true, images: true } } } },
          vendor: { select: { storeName: true, hall: true } },
        },
      },
    },
  })
}

// ─────────────────────────────────────────────────────
// PAYSTACK
// ─────────────────────────────────────────────────────

// POST /api/payments/initialize — start a Paystack payment
router.post('/initialize', authenticate, asyncHandler(async (req, res) => {
  const target = await resolveTarget(req)
  if (target.error) return res.status(target.error[0]).json({ error: target.error[1] })
  if (target.method !== 'PAYSTACK') return res.status(400).json({ error: 'This order is not a Paystack order.' })

  // Unique reference per attempt, so a buyer can retry a failed payment
  const reference = `${target.label}-${Date.now().toString(36)}`

  let data
  try {
    data = await initializePayment({
      email: req.user.email,
      amount: toKobo(target.amount),
      reference,
      callback_url: `${frontendUrl()}/order-confirmation?${target.returnQuery}`,
      metadata: { kind: target.kind, targetId: target.id, buyerName: req.user.fullName },
    })
  } catch (err) {
    console.error('Paystack initialize failed:', err.response?.data || err.message)
    return res.status(502).json({ error: 'Could not start the payment. Please try again.' })
  }

  await saveReference(target, 'paystackRef', reference)
  res.json({ authorizationUrl: data.authorization_url, reference })
}))

// POST /api/payments/verify/:reference — called after the buyer returns from Paystack
router.post('/verify/:reference', authenticate, asyncHandler(async (req, res) => {
  const { reference } = req.params

  const group = await prisma.paymentGroup.findUnique({ where: { reference } })
  if (group) {
    if (group.buyerId !== req.user.id) return res.status(403).json({ error: 'Access denied.' })

    if (group.status !== 'PAID') {
      let txn
      try {
        txn = await verifyPayment(reference)
      } catch (err) {
        console.error('Paystack verify failed:', err.response?.data || err.message)
        return res.status(502).json({ error: 'Could not reach Paystack to confirm the payment. Please try again.' })
      }
      const result = await settleGroup(group.id, txn)
      if (!result.ok) return res.status(400).json({ error: result.reason, status: txn.status })
    }

    const fresh = await loadGroup(group.id)
    return res.json({ group: fresh, orders: fresh.orders, message: 'Payment confirmed and held in escrow.' })
  }

  // An order from before payment groups existed
  const order = await prisma.order.findFirst({ where: { paystackRef: reference } })
  if (!order) return res.status(404).json({ error: 'Order not found for this payment reference.' })
  if (order.buyerId !== req.user.id) return res.status(403).json({ error: 'Access denied.' })

  if (order.paymentStatus !== 'PENDING') {
    return res.json({ order, orders: [order], message: 'Payment already confirmed.' })
  }

  let txn
  try {
    txn = await verifyPayment(reference)
  } catch (err) {
    console.error('Paystack verify failed:', err.response?.data || err.message)
    return res.status(502).json({ error: 'Could not reach Paystack to confirm the payment. Please try again.' })
  }

  const result = await settleOrder(order, txn)
  if (!result.ok) return res.status(400).json({ error: result.reason, status: txn.status })

  const updated = await prisma.order.findUnique({ where: { id: order.id } })
  res.json({ order: updated, orders: [updated], message: 'Payment confirmed and held in escrow.' })
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
    const reference = event.data?.reference
    const group = await prisma.paymentGroup.findUnique({ where: { reference } })
    if (group) {
      await settleGroup(group.id, event.data)
    } else {
      const order = await prisma.order.findFirst({ where: { paystackRef: reference } })
      if (order && order.paymentStatus === 'PENDING') await settleOrder(order, event.data)
    }
  }

  res.sendStatus(200) // always 200 so Paystack stops retrying
}))

// ─────────────────────────────────────────────────────
// OPAY
// ─────────────────────────────────────────────────────

// POST /api/payments/opay/initialize — start an OPay payment
router.post('/opay/initialize', authenticate, asyncHandler(async (req, res) => {
  const target = await resolveTarget(req)
  if (target.error) return res.status(target.error[0]).json({ error: target.error[1] })
  if (target.method !== 'OPAY') return res.status(400).json({ error: 'This order is not an OPay order.' })

  // OPay rejects a reference it has already seen, so each attempt gets a new one
  const reference = `${target.label}-${Date.now().toString(36)}`

  let data
  try {
    data = await createCashierPayment({
      reference,
      amountKobo: toKobo(target.amount),
      returnUrl: `${frontendUrl()}/order-confirmation?${target.returnQuery}`,
      cancelUrl: `${frontendUrl()}/checkout`,
      callbackUrl: `${process.env.BACKEND_URL}/api/payments/opay/callback`,
      user: {
        userId: req.user.id,
        userName: req.user.fullName,
        userEmail: req.user.email,
        userMobile: req.user.phone || undefined,
      },
      productList: target.items.map(i => ({
        productId: String(i.productId),
        name: i.name,
        description: i.name,
        price: Math.round(Number(i.price) * 100),
        quantity: i.quantity,
      })),
    })
  } catch (err) {
    console.error('OPay initialize failed:', err.response?.data || err.message)
    return res.status(502).json({ error: 'Could not start the payment. Please try again.' })
  }

  await saveReference(target, 'opayRef', reference)
  res.json({ cashierUrl: data.cashierUrl, reference })
}))

// POST /api/payments/opay/callback — OPay calls this directly (no login)
router.post('/opay/callback', asyncHandler(async (req, res) => {
  if (!verifyCallbackSignature(req.body)) {
    console.error('OPay callback rejected: bad signature')
    return res.sendStatus(401)
  }

  const p = req.body.payload
  if (p.status === 'SUCCESS') {
    const txn = {
      status: 'success',
      currency: p.currency,
      amount: Number(p.amount), // OPay sends the amount in kobo
    }

    const group = await prisma.paymentGroup.findUnique({ where: { reference: p.reference } })
    if (group) {
      await settleGroup(group.id, txn)
    } else {
      const order = await prisma.order.findFirst({ where: { opayRef: p.reference } })
      if (order && order.paymentStatus === 'PENDING') await settleOrder(order, txn)
    }
  }

  res.sendStatus(200)
}))

module.exports = router