const prisma = require('../utils/prisma')
const { notifyUser } = require('../controllers/notification.controller')
const { syncProductMirror } = require('./productUnits')

const windowMinutes = () => Number(process.env.UNPAID_ORDER_MINUTES) || 30

// Cancel online-payment orders that were never paid, and put their stock back on the shelf.
// Safe to call as often as you like.
async function cancelExpiredUnpaidOrders() {
  try {
    const cutoff = new Date(Date.now() - windowMinutes() * 60 * 1000)

    const stale = await prisma.order.findMany({
      where: {
        status: 'PLACED',
        paymentStatus: 'PENDING',
        paymentMethod: { in: ['PAYSTACK', 'OPAY'] },
        createdAt: { lt: cutoff },
      },
      include: { items: true },
      take: 50,
    })

    for (const order of stale) {
      const cancelled = await prisma.$transaction(async (tx) => {
        // Only cancel if it is still unpaid at this exact moment
        const result = await tx.order.updateMany({
          where: { id: order.id, status: 'PLACED', paymentStatus: 'PENDING' },
          data: { status: 'CANCELLED' },
        })
        if (result.count === 0) return false

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

        // The one payment covering this order can no longer be paid
        if (order.paymentGroupId) {
          await tx.paymentGroup.updateMany({
            where: { id: order.paymentGroupId, status: 'PENDING' },
            data: { status: 'EXPIRED' },
          })
        }
        return true
      })

      if (cancelled) {
        notifyUser(order.buyerId, {
          title: `Order expired (${order.orderNumber})`,
          message: `We didn't receive payment within ${windowMinutes()} minutes, so the order was cancelled. You can place it again any time.`,
          type: 'ORDER',
          link: `/orders/${order.id}`,
          category: 'orderUpdates',
        }).catch(() => {})
      }
    }

    return stale.length
  } catch (err) {
    console.error('Could not expire unpaid orders:', err.message)
    return 0
  }
}

// Runs once shortly after the server starts, then every 5 minutes
function startOrderExpiryJob() {
  const first = setTimeout(cancelExpiredUnpaidOrders, 10 * 1000)
  const timer = setInterval(cancelExpiredUnpaidOrders, 5 * 60 * 1000)
  if (first.unref) first.unref()
  if (timer.unref) timer.unref()
  return timer
}

module.exports = { cancelExpiredUnpaidOrders, startOrderExpiryJob }