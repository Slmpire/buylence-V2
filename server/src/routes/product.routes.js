const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')

// GET /api/products
// Public — browse all active products with optional filters
router.get('/', asyncHandler(async (req, res) => {
  const { category, hall, search, vendorId, flashDeal, page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)

  const where = {
    isActive: true,
    ...(category && { category }),
    ...(vendorId && { vendorId }),
    ...(flashDeal === 'true' && { flashDeal: true }),
    ...(hall && { availableHalls: { has: hall } }),
    ...(search && {
      name: { contains: search, mode: 'insensitive' },
    ...(req.query.vendorId && { vendorId: req.query.vendorId }),
    }),
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { vendor: { select: { storeName: true, hall: true, rating: true, verified: true } } },
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
    orderBy: { createdAt: 'desc' },
  })

  res.json({ products, total: products.length })
}))

// GET /api/products/mine — vendor's own products
router.get('/mine', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor profile not found.' })

  const products = await prisma.product.findMany({
    where: { vendorId: vendor.id },
    orderBy: { createdAt: 'desc' },
  })

  res.json({ products, total: products.length })
}))

// GET /api/products/:id
// Public — single product detail
router.get('/:id', asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { vendor: { select: { storeName: true, hall: true, rating: true, verified: true, deliveryFee: true } } },
  })
  if (!product) return res.status(404).json({ error: 'Product not found.' })
  res.json({ product })
}))

// POST /api/products
// Vendor only — create a new product
router.post('/', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const { name, description, category, unit, sku, price, comparePrice, stock, images, availableHalls, flashDeal } = req.body

  if (!name || !category || !price) {
    return res.status(400).json({ error: 'name, category, and price are required.' })
  }

  const product = await prisma.product.create({
    data: {
      vendorId: req.user.vendor.id,
      name,
      description,
      category,
      unit,
      sku,
      price: Number(price),
      comparePrice: comparePrice ? Number(comparePrice) : null,
      stock: Number(stock) || 0,
      images: images || [],
      availableHalls: availableHalls || [],
      flashDeal: flashDeal || false,
    },
  })

  res.status(201).json({ product })
}))

// PATCH /api/products/:id
// Vendor only — update own product
router.patch('/:id', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Product not found.' })
  if (existing.vendorId !== req.user.vendor.id) return res.status(403).json({ error: 'This is not your product.' })

  const { name, description, category, unit, sku, price, comparePrice, stock, images, availableHalls, flashDeal, isActive } = req.body

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(category && { category }),
      ...(unit !== undefined && { unit }),
      ...(sku !== undefined && { sku }),
      ...(price !== undefined && { price: Number(price) }),
      ...(comparePrice !== undefined && { comparePrice: comparePrice ? Number(comparePrice) : null }),
      ...(stock !== undefined && { stock: Number(stock) }),
      ...(images && { images }),
      ...(availableHalls && { availableHalls }),
      ...(flashDeal !== undefined && { flashDeal }),
      ...(isActive !== undefined && { isActive }),
    },
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