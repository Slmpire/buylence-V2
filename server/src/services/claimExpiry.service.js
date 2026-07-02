const prisma = require('../utils/prisma')

/**
 * Reverts any orders where a rider claimed them but
 * the claimExpiresAt has passed without being picked up.
 * Called lazily — runs before every pending pool fetch.
 */
async function revertExpiredClaims() {
  const now = new Date()

  const expired = await prisma.order.findMany({
    where: {
      status: 'ASSIGNED_TO_RIDER',
      claimExpiresAt: { lt: now },
    },
    select: { id: true, orderNumber: true, riderId: true },
  })

  if (expired.length === 0) return

  await prisma.order.updateMany({
    where: {
      id: { in: expired.map(o => o.id) },
    },
    data: {
      status: 'READY_FOR_PICKUP',
      riderId: null,
      claimedAt: null,
      claimExpiresAt: null,
    },
  })

  console.log(`⏰ Reverted ${expired.length} expired rider claim(s) back to the pool.`)
}

module.exports = { revertExpiredClaims }