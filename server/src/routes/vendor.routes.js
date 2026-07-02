const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')

// GET /api/vendors
// Public — browse all verified vendors
router.get('/', asyncHandler(async (req, res) => {
  const { hall, category, search } = req.query

  const where = {
    onboarded: true,
    ...(hall && { hall }),
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
      deliveryFee: true,
    },
    orderBy: { rating: 'desc' },
  })

  res.json({ vendors })
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

// POST /api/vendors/onboard
// Authenticated buyer — onboard as a vendor
router.post('/onboard', authenticate, asyncHandler(async (req, res) => {
  if (req.user.vendor) {
    return res.status(409).json({ error: 'You already have a vendor account.' })
  }

  const { storeName, description, hall, storeType, categories } = req.body
  if (!storeName || !hall || !categories?.length) {
    return res.status(400).json({ error: 'storeName, hall, and categories are required.' })
  }

  const [vendor] = await prisma.$transaction([
    prisma.vendor.create({
      data: {
        userId: req.user.id,
        storeName,
        description,
        hall,
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

// PATCH /api/vendors/:id/verify — admin toggle verified
router.patch('/:id/verify', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { verified } = req.body
  const vendor = await prisma.vendor.update({
    where: { id: req.params.id },
    data: { verified: Boolean(verified) },
  })
  res.json({ vendor, message: `Vendor ${verified ? 'verified' : 'unverified'}.` })
}))

// PATCH /api/vendors/me — update store settings
router.patch('/me', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const { storeName, description, deliveryHalls } = req.body

  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found.' })

  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      ...(storeName && { storeName }),
      ...(description !== undefined && { description }),
    },
  })

  res.json({ vendor: updated, message: 'Store settings updated.' })
}))

// PATCH /api/vendors/me — vendor updates their own store
router.patch('/me', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const { storeName, description, deliveryHalls } = req.body

  const vendor = await prisma.vendor.findUnique({ where: { userId: req.user.id } })
  if (!vendor) return res.status(404).json({ error: 'Vendor not found.' })

  const updated = await prisma.vendor.update({
    where: { id: vendor.id },
    data: {
      ...(storeName && { storeName }),
      ...(description !== undefined && { description }),
    },
  })

  res.json({ vendor: updated, message: 'Store settings updated.' })
}))

// PATCH /api/vendors/me
// Vendor only — update store settings
router.patch('/me', authenticate, requireRole('VENDOR'), asyncHandler(async (req, res) => {
  const { storeName, description, categories, deliveryFee, storeType } = req.body

  const vendor = await prisma.vendor.update({
    where: { id: req.user.vendor.id },
    data: {
      ...(storeName && { storeName }),
      ...(description !== undefined && { description }),
      ...(categories && { categories }),
      ...(deliveryFee !== undefined && { deliveryFee: Number(deliveryFee) }),
      ...(storeType && { storeType }),
    },
  })

  res.json({ vendor })
}))

module.exports = router