const prisma = require('../utils/prisma')
const { notifyUser } = require('../controllers/notification.controller')

// Tell a store it has a new order to prepare
async function notifyVendorOfNewOrder(orderId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: { select: { userId: true } } },
    })
    if (!order?.vendor?.userId) return

    await notifyUser(order.vendor.userId, {
      title: `New order (${order.orderNumber})`,
      message: `You have a new order of ₦${Number(order.total).toLocaleString()} for ${order.deliveryHall}. Confirm it to start preparing.`,
      type: 'ORDER',
      link: '/vendor/dashboard',
      category: 'orderUpdates',
    })
  } catch (err) {
    console.error('Could not notify vendor:', err.message)
  }
}

// Tell every active rider that an order is waiting to be picked up
async function notifyRidersOfPickup(orderId) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vendor: { select: { storeName: true } } },
    })
    if (!order) return

    const riders = await prisma.rider.findMany({
      where: { isActive: true },
      select: { userId: true },
    })

    await Promise.all(riders.map(r =>
      notifyUser(r.userId, {
        title: `Pickup available (${order.orderNumber})`,
        message: `${order.vendor?.storeName || 'A store'} has an order ready for delivery to ${order.deliveryHall}.`,
        type: 'ORDER',
        link: '/rider/dashboard',
        category: 'orderUpdates',
      }).catch(() => {})
    ))
  } catch (err) {
    console.error('Could not notify riders:', err.message)
  }
}

module.exports = { notifyVendorOfNewOrder, notifyRidersOfPickup }