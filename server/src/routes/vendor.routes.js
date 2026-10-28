const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')

// "" / null / undefined -> null, otherwise a number (NaN if invalid)
function toNum(v) {
  if (v === '' || v === null || v === undefined) return null
  return Number(v)
}

// Returns an error message, or null when the coordinates are fine
function coordError(latitude, longitude) {
  if (latitude === null && longitude === null) return null
  if (latitude === null || longitude === null) return 'Provide both latitude and longitude, or neither.'
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Latitude must be between -90 and 90.'
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'Longitude must be between -180 and 180.'
  return null
}

// Clean a list of location names: strings only, trimmed, no blanks, no duplicates
function cleanAreas(list) {
  if (!Array.isArray(list)) return null
  const names = list
    .filter(v => typeof v === 'string')
    .map(v => v.trim())
    .filter(Boolean)
  return [...new Set(names)]
}

// GET /api/vendors
// Public — browse all onboarded vendors
router.get('/', asyncHandler(async (req, res) => {
  const { hall, area, category, search } = req.query

  const where = {
    onboarded: true,
    ...(hall && { hall }),
    ...(area && { deliveryAreas: { has: area } }),
    ...(category && { categories: { has: category } }),
    ...(search && { storeName: { contains: search, mode: 'insensitive' } }),
  }

  const vendors = await prisma.vendor.findMany({
    where,
    select: {
      id: true, storeName: true, description: true,
      hall: true, storeType: true, categories: true,
      logoUrl: true, bannerUrl: true, verified: true,
      rating: true, totalReviews: true, totalSales: true,
      deliveryFee: true, latitude: true, longitude: true, deliveryAreas: true,
    },
    orderBy: { rating: 'desc' },
  })

  res.json({ vendors })
}))

// ─────────────────────────────────────────────────────
// Vendor-only routes. These must stay above '/:id'
// so "me" is never treated as a vendor id.
// ─────────────────────────────────────────────────────

// GET /api/vendors/me
// Vendor only — own store details
router.get('/me', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found.' })
  res.json({ vendor })
}))

// PATCH /api/vendors/me
// Vendor only — update store settings
router.patch('/me', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found.' })

  const { storeName, description, hall, categories, storeType, deliveryAreas, deliveryFee } = req.body
  const data = {}

  if (storeName !== undefined) {
    const name = String(storeName).trim()
    if (!name) return res.status(400).json({ error: 'Store name cannot be empty.' })
    data.storeName = name
  }

  if (description !== undefined) data.description = description

  if (hall !== undefined) {
    const location = String(hall).trim()
    if (!location) return res.status(400).json({ error: 'Store location cannot be empty.' })
    data.hall = location
  }

  if (categories !== undefined) {
    if (!Array.isArray(categories) || categories.length === 0) {
      return res.status(400).json({ error: 'Choose at least one category.' })
    }
    data.categories = categories
  }

  if (storeType) data.storeType = storeType

  if (deliveryAreas !== undefined) {
    const areas = cleanAreas(deliveryAreas)
    if (areas === null) return res.status(400).json({ error: 'deliveryAreas must be a list of names.' })
    data.deliveryAreas = areas
  }

  if (deliveryFee !== undefined) {
    const fee = Number(deliveryFee)
    if (!Number.isFinite(fee) || fee < 0) {
      return res.status(400).json({ error: 'Delivery fee must be 0 or more.' })
    }
    data.deliveryFee = Math.round(fee)
  }

  if ('latitude' in req.body || 'longitude' in req.body) {
    const latitude = toNum(req.body.latitude)
    const longitude = toNum(req.body.longitude)
    const problem = coordError(latitude, longitude)
    if (problem) return res.status(400).json({ error: problem })
    data.latitude = latitude
    data.longitude = longitude
  }

  const updated = await prisma.vendor.update({ where: { id: vendor.id }, data })
  res.json({ vendor: updated, message: 'Store settings updated.' })
}))

// GET /api/vendors/me/dashboard
// Vendor only — dashboard stats
router.get('/me/dashboard', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const vendorId = req.user.vendor.id

  const [totalProducts, activeOrders, totalEarnings] = await Promise.all([
    prisma.product.count({ where: { vendorId, isActive: true } }),
    prisma.order.count({
      where: {
        vendorId,
        status: { notIn: ['CANCELLED', 'CONFIRMED_BY_BUYER'] },
      },
    }),
    prisma.order.aggregate({
      where: { vendorId, paymentStatus: 'RELEASED' },
      _sum: { total: true },
    }),
  ])

  const recentOrders = await prisma.order.findMany({
    where: { vendorId },
    include: {
      buyer: { select: { fullName: true, hall: true } },
      items: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  res.json({
    stats: {
      totalProducts,
      activeOrders,
      totalEarnings: totalEarnings._sum.total || 0,
    },
    recentOrders,
  })
}))

// GET /api/vendors/me/earnings
router.get('/me/earnings', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found.' })

  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
  weekStart.setHours(0, 0, 0, 0)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [today, thisWeek, thisMonth, allTime] = await Promise.all([
    prisma.order.aggregate({
      where: { vendorId: vendor.id, paymentStatus: 'RELEASED', escrowReleasedAt: { gte: todayStart } },
      _sum: { total: true }, _count: true,
    }),
    prisma.order.aggregate({
      where: { vendorId: vendor.id, paymentStatus: 'RELEASED', escrowReleasedAt: { gte: weekStart } },
      _sum: { total: true }, _count: true,
    }),
    prisma.order.aggregate({
      where: { vendorId: vendor.id, paymentStatus: 'RELEASED', escrowReleasedAt: { gte: monthStart } },
      _sum: { total: true }, _count: true,
    }),
    prisma.order.aggregate({
      where: { vendorId: vendor.id, paymentStatus: 'RELEASED' },
      _sum: { total: true }, _count: true,
    }),
  ])

  res.json({
    today: { amount: today._sum.total || 0, deliveries: today._count },
    thisWeek: { amount: thisWeek._sum.total || 0, deliveries: thisWeek._count },
    thisMonth: { amount: thisMonth._sum.total || 0, deliveries: thisMonth._count },
    allTime: { amount: allTime._sum.total || 0, deliveries: allTime._count },
    recentWithdrawals: [],
    weekly: { byDay: {} },
    monthly: { byMonth: {} },
  })
}))

// POST /api/vendors/onboard
// Authenticated buyer — onboard as a vendor
router.post('/onboard', authenticate, asyncHandler(async (req, res) => {
  if (req.user.vendor) {
    return res.status(409).json({ error: 'You already have a vendor account.' })
  }

  const { storeName, description, hall, storeType, categories, deliveryAreas } = req.body
  if (!storeName || !hall || !categories?.length) {
    return res.status(400).json({ error: 'storeName, hall (store location), and categories are required.' })
  }

  const latitude = toNum(req.body.latitude)
  const longitude = toNum(req.body.longitude)
  const problem = coordError(latitude, longitude)
  if (problem) return res.status(400).json({ error: problem })

  const location = String(hall).trim()
  // Until the vendor says otherwise, they deliver to the place they are based
  const areas = cleanAreas(deliveryAreas) || []
  if (areas.length === 0) areas.push(location)

  const [vendor] = await prisma.$transaction([
    prisma.vendor.create({
      data: {
        userId: req.user.id,
        storeName: String(storeName).trim(),
        description,
        hall: location,
        latitude,
        longitude,
        deliveryAreas: areas,
        storeType: storeType || 'PHYSICAL_KIOSK',
        categories,
        onboarded: true,
      },
    }),
    prisma.user.update({
      where: { id: req.user.id },
      data: { role: 'VENDOR' },
    }),
  ])

  res.status(201).json({ vendor })
}))

// PATCH /api/vendors/:id/verify — admin toggle verified
router.patch('/:id/verify', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { verified } = req.body
  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: { verified: Boolean(verified) },
  })
  res.json({ vendor, message: `Vendor ${verified ? 'verified' : 'unverified'}.` })
}))

// GET /api/vendors/:id
// Public — single vendor store page
router.get('/:id', asyncHandler(async (req, res) => {
  const vendor = await prisma.vendor.findUnique({
    where: { id: req.params.id },
    include: {
      products: { where: { isActive: true }, orderBy: { createdAt: 'desc' } },
      reviews: {
        include: { buyer: { select: { fullName: true, hall: true } } },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found.' })
  res.json({ vendor })
}))

module.exports = router