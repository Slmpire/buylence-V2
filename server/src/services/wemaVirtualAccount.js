const prisma = require('../utils/prisma')
const { notifyUser } = require('../controllers/notification.controller')
const { notifyVendorOfNewOrder } = require('./orderNotifications')

// A NUBAN is 10 digits: your Wema prefix + a random suffix. One per order.
async function allocateVirtualAccount() {
  const prefix = process.env.WEMA_VA_PREFIX || ''
  if (!prefix || prefix.length >= 10) {
    throw new Error('WEMA_VA_PREFIX is missing or invalid in .env')
  }
  const suffixLength = 10 - prefix.length

  for (let attempt = 0; attempt < 10; attempt++) {
    let suffix = ''
    for (let i = 0; i < suffixLength; i++) suffix += Math.floor(Math.random() * 10)
    const number = prefix + suffix
    const clash = await prisma.order.findUnique({
      where: { virtualAccount: number },
      select: { id: true },
    })
    if (!clash) return number
  }
  throw new Error('Could not allocate a virtual account number.')
}

// Called by the Wema webhook (and the demo simulator) when money lands in a virtual account.
// Safe to call twice: it ignores duplicates.
async function applyCredit({ accountNumber, amount, sessionId }) {
  const order = await prisma.order.findUnique({
    where: { virtualAccount: String(accountNumber) },
  })
  if (!order) return { ok: false, order: null, reason: 'Unknown account number.' }

  // Duplicate delivery of the same transfer
  if (sessionId) {
    const dup = await prisma.order.findUnique({
      where: { wemaSessionId: String(sessionId) },
      select: { id: true },
    })
    if (dup) return { ok: true, order, duplicate: true }
  }
  if (order.paymentStatus !== 'PENDING') return { ok: true, order, duplicate: true }

  const paid = Number(amount)
  if (!(paid >= order.total)) {
    console.error(`Wema underpayment on ${order.orderNumber}: expected ${order.total}, received ${paid}`)
    return { ok: false, order, reason: 'Amount received is less than the order total.' }
  }

  const result = await prisma.order.updateMany({
    where: { id: order.id, paymentStatus: 'PENDING' },
    data: { paymentStatus: 'HELD_IN_ESCROW', wemaSessionId: sessionId ? String(sessionId) : null },
  })

  if (result.count > 0) {
    notifyUser(order.buyerId, {
      title: `Payment received (${order.orderNumber})`,
      message: 'Your transfer was received. It is held safely until you confirm delivery.',
      type: 'ORDER',
      link: `/orders/${order.id}`,
      category: 'orderUpdates',
    }).catch(() => {})
    notifyVendorOfNewOrder(order.id)
  }
  return { ok: true, order }
}

module.exports = { allocateVirtualAccount, applyCredit }