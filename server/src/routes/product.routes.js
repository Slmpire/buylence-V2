const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const { cleanUnits, mirrorFields, syncProductMirror } = require('../services/productUnits')

const UNITS_INCLUDE = { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }
const VENDOR_PUBLIC = {
  select: { id: true, storeName: true, hall: true, rating: true, verified: true, deliveryFee: true },
}

// GET /api/products
// Public — browse all active products with optional filters
router.get('/', asyncHandler(async (req, res) => {
  const { category, hall, search, vendorId, flashDeal, priceMin, priceMax, minPrice, maxPrice, page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const minP = priceMin !== undefined ? priceMin : minPrice
  const maxP = priceMax !== undefined ? priceMax : maxPrice

  const where = {
    isActive: true,
    ...(category && { category }),
    ...(vendorId && { vendorId }),
    ...(flashDeal === 'true' && { flashDeal: true }),
    ...(hall && { availableHalls: { has: hall } }),
    ...(search && {
      name: { contains: search, mode: 'insensitive' },
    }),
  }

  if (minP !== undefined && minP !== '' && !isNaN(Number(minP))) {
    where.price = { ...(where.price || {}), gte: Number(minP) }
  }
  if (maxP !== undefined && maxP !== '' && !isNaN(Number(maxP))) {
    where.price = { ...(where.price || {}), lte: Number(maxP) }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { vendor: VENDOR_PUBLIC, units: UNITS_INCLUDE },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ])

  res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
}))

// GET /api/products/mine — vendor's own products
router.get('/mine', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor profile not found.' })

  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    include: { units: UNITS_INCLUDE },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ products, total: products.length })
}))

// GET /api/products/offers?name=Indomie
// Public — every seller of a product with this name (case and spacing around it ignored),
// with what a buyer needs to compare them: options, price, store location, order count.
// Must stay above '/:id'.
router.get('/offers', asyncHandler(async (req, res) => {
  const name = String(req.query.name || '').trim()
  if (!name) return res.status(400).json({ error: 'A product name is required.' })

  const products = await prisma.product.findMany({
    where: { isActive: true, name: { equals: name, mode: 'insensitive' } },
    include: {
      units: UNITS_INCLUDE,
      vendor: {
        select: {
          id: true, storeName: true, hall: true, rating: true, totalReviews: true,
          verified: true, deliveryFee: true, deliveryAreas: true,
          latitude: true, longitude: true,
        },
      },
    },
  })

  // A store without its own coordinates uses the named place it is based at, if that has them
  const hallNames = [...new Set(
    products.filter(p => p.vendor.latitude == null || p.vendor.longitude == null).map(p => p.vendor.hall)
  )]
  const places = hallNames.length > 0
    ? await prisma.location.findMany({ where: { name: { in: hallNames } } })
    : []
  const placeByName = new Map(places.map(l => [l.name.toLowerCase(), l]))

  // How often each product has been ordered (cancelled orders don't count; one order counts once)
  const ids = products.map(p => p.id)
  const idSet = new Set(ids)
  const orderCounts = new Map()
  if (ids.length > 0) {
    const orders = await prisma.order.findMany({
      where: { status: { not: 'CANCELLED' }, items: { some: { productId: { in: ids } } } },
      select: { items: { select: { productId: true } } },
    })
    for (const order of orders) {
      const seen = new Set(order.items.map(i => i.productId))
      for (const productId of seen) {
        if (idSet.has(productId)) orderCounts.set(productId, (orderCounts.get(productId) || 0) + 1)
      }
    }
  }

  const offers = products
    .filter(p => p.units.length > 0)
    .map(p => {
      const v = p.vendor
      const missing = v.latitude == null || v.longitude == null
      const place = missing ? placeByName.get((v.hall || '').toLowerCase()) : null
      return {
        ...p,
        orderCount: orderCounts.get(p.id) || 0,
        vendor: {
          ...v,
          latitude: missing ? (place?.latitude ?? null) : v.latitude,
          longitude: missing ? (place?.longitude ?? null) : v.longitude,
        },
      }
    })

  res.json({ name, offers })
}))

// GET /api/products/:id
// Public — single product detail
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { vendor: VENDOR_PUBLIC, units: UNITS_INCLUDE },
  })
  if (!product) return res.status(404).json({ error: 'Product not found.' })
  res.json({ product })
}))

// POST /api/products
// Vendor only — create a new product with its ways of buying (units)
router.post('/', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const { name, description, category, sku, images, availableHalls, flashDeal } = req.body

  if (!name || !String(name).trim() || !category) {
    return res.status(400).json({ error: 'A product name and category are required.' })
  }

  // Older screens still send a single price/stock/unit: treat that as one option
  let unitInput = req.body.units
  if (!Array.isArray(unitInput) && req.body.price) {
    unitInput = [{
      label: String(req.body.unit || 'Piece').replace(/^per\s+/i, '').trim() || 'Piece',
      price: req.body.price,
      comparePrice: req.body.comparePrice,
      stock: req.body.stock,
    }]
  }

  const { units, error } = cleanUnits(unitInput)
  if (error) return res.status(400).json({ error })

  const product = await prisma.product.create({
    data: {
      vendorId: req.user.vendor.id,
      name: String(name).trim(),
      description,
      category,
      sku,
      images: images || [],
      availableHalls: availableHalls || [],
      flashDeal: flashDeal || false,
      ...mirrorFields(units),
      units: {
        create: units.map(({ id, ...unit }) => unit),
      },
    },
    include: { units: { orderBy: { sortOrder: 'asc' } } },
  })

  res.status(201).json({ product })
}))

// PATCH /api/products/:id
// Vendor only — update own product (and its options)
router.patch('/:id', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { units: true },
  })
  if (!existing) return res.status(404).json({ error: 'Product not found.' })
  if (existing.vendorId !== req.user.vendor.id) return res.status(403).json({ error: 'This is not your product.' })

  const { name, description, category, sku, images, availableHalls, flashDeal, isActive } = req.body

  // Work out the new set of options, if the seller sent any
  let units = null
  if (Array.isArray(req.body.units)) {
    const result = cleanUnits(req.body.units)
    if (result.error) return res.status(400).json({ error: result.error })
    units = result.units

    const ownIds = new Set(existing.units.map(u => u.id))
    if (units.some(u => u.id && !ownIds.has(u.id))) {
      return res.status(400).json({ error: 'One of those options does not belong to this product.' })
    }
  } else if (['price', 'comparePrice', 'stock', 'unit'].some(k => req.body[k] !== undefined)) {
    // Older screens: change the first live option instead
    const first = existing.units.filter(u => u.isActive).sort((a, b) => a.sortOrder - b.sortOrder)[0]
    if (first) {
      const result = cleanUnits([{
        id: first.id,
        label: req.body.unit !== undefined
          ? String(req.body.unit).replace(/^per\s+/i, '').trim() || first.label
          : first.label,
        price: req.body.price !== undefined ? req.body.price : first.price,
        comparePrice: req.body.comparePrice !== undefined ? req.body.comparePrice : first.comparePrice,
        stock: req.body.stock !== undefined ? req.body.stock : first.stock,
      }])
      if (result.error) return res.status(400).json({ error: result.error })
      const others = existing.units
        .filter(u => u.isActive && u.id !== first.id)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((u, i) => ({ ...u, sortOrder: i + 1 }))
      units = [...result.units, ...others]
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(description !== undefined && { description }),
        ...(category && { category }),
        ...(sku !== undefined && { sku }),
        ...(images && { images }),
        ...(availableHalls && { availableHalls }),
        ...(flashDeal !== undefined && { flashDeal }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    if (units) {
      const incomingIds = new Set(units.filter(u => u.id).map(u => u.id))

      // Options the seller removed are hidden, not deleted, so old orders and carts still make sense
      const removed = existing.units.filter(u => u.isActive && !incomingIds.has(u.id))
      if (removed.length > 0) {
        await tx.productUnit.updateMany({
          where: { id: { in: removed.map(u => u.id) } },
          data: { isActive: false },
        })
      }

      for (const u of units) {
        const data = {
          label: u.label,
          price: u.price,
          comparePrice: u.comparePrice,
          stock: u.stock,
          sortOrder: u.sortOrder,
          isActive: true,
        }
        if (u.id) {
          await tx.productUnit.update({ where: { id: u.id }, data })
        } else {
          await tx.productUnit.create({ data: { ...data, productId: req.params.id } })
        }
      }

      await syncProductMirror(tx, req.params.id)
    }
  })

  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { units: UNITS_INCLUDE },
  })

  res.json({ product })
}))

// DELETE /api/products/:id
// Vendor only — soft delete (sets isActive false, keeps order history intact)
router.delete('/:id', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Product not found.' })
  if (existing.vendorId !== req.user.vendor.id) return res.status(403).json({ error: 'This is not your product.' })

  await prisma.product.update({
    where: { id: req.params.id },
    data: { isActive: false },
  })

  res.json({ message: 'Product removed from your store.' })
}))

module.exports = router