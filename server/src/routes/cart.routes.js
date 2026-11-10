const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { withDeal } = require('../services/productUnits')

// POST /api/cart/refresh
// Public — takes the lines in someone's cart and returns what each one costs right now
// (deal prices included) and whether it is still on sale.
// body: { items: [{ key, id, unitId }] }
router.post('/refresh', asyncHandler(async (req, res) => {
  const lines = Array.isArray(req.body?.items) ? req.body.items.slice(0, 50) : []
  const ids = [...new Set(lines.map(l => l?.id).filter(Boolean))]

  const products = ids.length === 0 ? [] : await prisma.product.findMany({
    where: { id: { in: ids } },
    include: {
      units: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
      vendor: { select: { deliveryFee: true } },
    },
  })
  const byId = new Map(products.map(p => [p.id, p]))

  const results = lines.map(line => {
    const product = byId.get(line.id)
    if (!product || !product.isActive) return { key: line.key, status: 'unavailable' }

    // A line from before options existed has no unitId: it means the first option
    const raw = line.unitId
      ? product.units.find(u => u.id === line.unitId)
      : product.units[0]
    if (!raw) return { key: line.key, status: 'unavailable' }

    const unit = withDeal(raw)

    return {
      key: line.key,
      status: 'ok',
      unitId: unit.id,
      unitLabel: unit.label,
      price: unit.price,
      comparePrice: unit.comparePrice,
      stock: unit.stock,
      onDeal: unit.onDeal,
      dealEndsAt: unit.onDeal ? unit.dealEndsAt : null,
      deliveryFee: product.vendor?.deliveryFee ?? null,
    }
  })

  res.json({ results })
}))

module.exports = router