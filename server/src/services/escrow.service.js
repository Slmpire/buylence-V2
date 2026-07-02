const prisma = require('../utils/prisma')

/**
 * Called after buyer confirms receipt.
 * Stamps escrowReleasedAt and sets paymentStatus to RELEASED.
 * Real Paystack transfer to vendor will be wired in Stage 5.
 */
async function releaseEscrow(order) {
  if (order.paymentStatus === 'RELEASED') return

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'RELEASED',
      escrowReleasedAt: new Date(),
    },
  })

  // Update vendor total sales count
  await prisma.vendor.update({
    where: { id: order.vendorId },
    data: { totalSales: { increment: 1 } },
  })

  // TODO Stage 5: trigger Paystack transfer to vendor's bank account here
  console.log(`✅ Escrow released for order ${order.orderNumber} — ₦${order.total} to vendor ${order.vendorId}`)
}

module.exports = { releaseEscrow }