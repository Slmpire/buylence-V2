const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')

// ─────────────────────────────────────────────────────
// ADMIN ROUTES — managing the fixed rider team
// ─────────────────────────────────────────────────────

// POST /api/riders
// Admin only — manually onboard a new rider
// The rider must already have a Firebase account (created by admin in Firebase console)
router.post('/', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { firebaseUid, fullName, email, phone, vehicleType } = req.body

  if (!firebaseUid || !fullName || !email) {
    return res.status(400).json({ error: 'firebaseUid, fullName, and email are required.' })
  }

  // Create or update the User record for this rider
  const user = await prisma.user.upsert({
    where: { firebaseUid },
    create: {
      firebaseUid,
      fullName,
      email,
      phone,
      role: 'RIDER',
    },
    update: {
      fullName,
      phone,
      role: 'RIDER',
    },
  })

  // Check if rider profile already exists
  if (user.rider) {
    return res.status(409).json({ error: 'This user is already a rider.' })
  }

  const rider = await prisma.rider.create({
    data: {
      userId: user.id,
      vehicleType: vehicleType || null,
    },
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
    },
  })

  res.status(201).json({ rider, message: `Rider account created for ${fullName}.` })
}))

// GET /api/riders
// Admin only — list all riders with stats
router.get('/', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const riders = await prisma.rider.findMany({
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
      claimedOrders: {
        where: { status: { in: ['ASSIGNED_TO_RIDER', 'PICKED_UP'] } },
        select: { id: true, orderNumber: true, status: true, deliveryHall: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Attach summary stats to each rider
  const ridersWithStats = await Promise.all(riders.map(async rider => {
    const [totalDeliveries, totalEarnings, avgDeliveryTime] = await Promise.all([
      prisma.order.count({
        where: { riderId: rider.id, status: 'CONFIRMED_BY_BUYER' },
      }),
      prisma.order.aggregate({
        where: { riderId: rider.id, paymentStatus: 'RELEASED' },
        _sum: { deliveryFee: true },
      }),
      // Average time from pickedUpAt to riderConfirmedAt in minutes
      prisma.order.findMany({
        where: {
          riderId: rider.id,
          status: 'CONFIRMED_BY_BUYER',
          pickedUpAt: { not: null },
          riderConfirmedAt: { not: null },
        },
        select: { pickedUpAt: true, riderConfirmedAt: true },
      }),
    ])

    let avgMinutes = null
    if (avgDeliveryTime.length > 0) {
      const totalMs = avgDeliveryTime.reduce((sum, o) => {
        return sum + (new Date(o.riderConfirmedAt) - new Date(o.pickedUpAt))
      }, 0)
      avgMinutes = Math.round(totalMs / avgDeliveryTime.length / 1000 / 60)
    }

    return {
      ...rider,
      stats: {
        totalDeliveries,
        totalEarningsFromFees: totalEarnings._sum.deliveryFee || 0,
        avgDeliveryTimeMinutes: avgMinutes,
        activeDeliveries: rider.claimedOrders.length,
      },
    }
  }))

  res.json({ riders: ridersWithStats })
}))

// GET /api/riders/:id
// Admin only — single rider full profile + history
router.get('/:id', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const rider = await prisma.rider.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { fullName: true, email: true, phone: true, createdAt: true } },
      claimedOrders: {
        include: {
          vendor: { select: { storeName: true, hall: true } },
          buyer: { select: { fullName: true, hall: true } },
          items: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  })

  if (!rider) return res.status(404).json({ error: 'Rider not found.' })
  res.json({ rider })
}))

// PATCH /api/riders/:id/toggle-active
// Admin only — activate or deactivate a rider
router.patch('/:id/toggle-active', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const rider = await prisma.rider.findUnique({ where: { id: req.params.id } })
  if (!rider) return res.status(404).json({ error: 'Rider not found.' })

  const updated = await prisma.rider.update({
    where: { id: req.params.id },
    data: { isActive: !rider.isActive },
    include: { user: { select: { fullName: true } } },
  })

  res.json({
    rider: updated,
    message: `${updated.user.fullName} is now ${updated.isActive ? 'active' : 'inactive'}.`,
  })
}))

// PATCH /api/riders/:id
// Admin only — update rider details
router.patch('/:id', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { vehicleType, fullName, phone } = req.body
  const rider = await prisma.rider.findUnique({
    where: { id: req.params.id },
    include: { user: true },
  })

  if (!rider) return res.status(404).json({ error: 'Rider not found.' })

  const [updatedRider] = await prisma.$transaction([
    prisma.rider.update({
      where: { id: req.params.id },
      data: { ...(vehicleType !== undefined && { vehicleType }) },
    }),
    prisma.user.update({
      where: { id: rider.userId },
      data: {
        ...(fullName && { fullName }),
        ...(phone !== undefined && { phone }),
      },
    }),
  ])

  res.json({ rider: updatedRider, message: 'Rider updated.' })
}))

// DELETE /api/riders/:id
// Admin only — remove a rider (soft: deactivates, does not delete the user)
router.delete('/:id', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const rider = await prisma.rider.findUnique({ where: { id: req.params.id } })
  if (!rider) return res.status(404).json({ error: 'Rider not found.' })

  await prisma.$transaction([
    prisma.rider.update({
      where: { id: req.params.id },
      data: { isActive: false },
    }),
    prisma.user.update({
      where: { id: rider.userId },
      data: { role: 'BUYER' },
    }),
  ])

  res.json({ message: 'Rider removed from the delivery team.' })
}))

// ─────────────────────────────────────────────────────
// RIDER SELF — delivery portal routes
// ─────────────────────────────────────────────────────

// GET /api/riders/me/profile
// Rider — own profile and performance stats
router.get('/me/profile', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  const riderId = req.user.rider.id

  const [rider, totalDeliveries, totalEarnings, deliveryTimes] = await Promise.all([
    prisma.rider.findUnique({
      where: { id: riderId },
      include: { user: { select: { fullName: true, email: true, phone: true, createdAt: true } } },
    }),
    prisma.order.count({
      where: { riderId, status: 'CONFIRMED_BY_BUYER' },
    }),
    prisma.order.aggregate({
      where: { riderId, paymentStatus: 'RELEASED' },
      _sum: { deliveryFee: true },
    }),
    prisma.order.findMany({
      where: {
        riderId,
        status: 'CONFIRMED_BY_BUYER',
        pickedUpAt: { not: null },
        riderConfirmedAt: { not: null },
      },
      select: { pickedUpAt: true, riderConfirmedAt: true },
    }),
  ])

  let avgDeliveryMinutes = null
  if (deliveryTimes.length > 0) {
    const totalMs = deliveryTimes.reduce((sum, o) => {
      return sum + (new Date(o.riderConfirmedAt) - new Date(o.pickedUpAt))
    }, 0)
    avgDeliveryMinutes = Math.round(totalMs / deliveryTimes.length / 1000 / 60)
  }

  res.json({
    rider,
    stats: {
      totalDeliveries,
      totalEarningsFromFees: totalEarnings._sum.deliveryFee || 0,
      avgDeliveryTimeMinutes: avgDeliveryMinutes,
    },
  })
}))

// GET /api/riders/me/history
// Rider — their completed delivery history (paginated)
router.get('/me/history', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query
  const skip = (Number(page) - 1) * Number(limit)
  const riderId = req.user.rider.id

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: {
        riderId,
        status: { in: ['DELIVERED_BY_RIDER', 'CONFIRMED_BY_BUYER'] },
      },
      include: {
        vendor: { select: { storeName: true, hall: true } },
        buyer: { select: { fullName: true, hall: true } },
        items: { select: { name: true, quantity: true } },
      },
      orderBy: { riderConfirmedAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.order.count({
      where: {
        riderId,
        status: { in: ['DELIVERED_BY_RIDER', 'CONFIRMED_BY_BUYER'] },
      },
    }),
  ])

  // Calculate per-delivery time for each order in history
  const ordersWithTime = orders.map(order => {
    let deliveryMinutes = null
    if (order.pickedUpAt && order.riderConfirmedAt) {
      deliveryMinutes = Math.round(
        (new Date(order.riderConfirmedAt) - new Date(order.pickedUpAt)) / 1000 / 60
      )
    }
    return { ...order, deliveryMinutes }
  })

  res.json({
    orders: ordersWithTime,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
  })
}))

// GET /api/riders/me/earnings
// Rider — earnings breakdown (daily, weekly summary)
router.get('/me/earnings', authenticate, requireRole('RIDER'), asyncHandler(async (req, res) => {
  const riderId = req.user.rider.id
  const now = new Date()

  // Today
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // This week (Monday)
  const dayOfWeek = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  weekStart.setHours(0, 0, 0, 0)

  // This month
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [todayEarnings, weekEarnings, monthEarnings, allTimeEarnings, recentDeliveries] = await Promise.all([
    prisma.order.aggregate({
      where: { riderId, paymentStatus: 'RELEASED', escrowReleasedAt: { gte: todayStart } },
      _sum: { deliveryFee: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { riderId, paymentStatus: 'RELEASED', escrowReleasedAt: { gte: weekStart } },
      _sum: { deliveryFee: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { riderId, paymentStatus: 'RELEASED', escrowReleasedAt: { gte: monthStart } },
      _sum: { deliveryFee: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where: { riderId, paymentStatus: 'RELEASED' },
      _sum: { deliveryFee: true },
      _count: true,
    }),
    prisma.order.findMany({
      where: { riderId, paymentStatus: 'RELEASED' },
      select: {
        orderNumber: true, deliveryFee: true, deliveryHall: true,
        escrowReleasedAt: true, riderConfirmedAt: true, pickedUpAt: true,
        vendor: { select: { storeName: true } },
      },
      orderBy: { escrowReleasedAt: 'desc' },
      take: 10,
    }),
  ])

  res.json({
    earnings: {
      today: { amount: todayEarnings._sum.deliveryFee || 0, deliveries: todayEarnings._count },
      thisWeek: { amount: weekEarnings._sum.deliveryFee || 0, deliveries: weekEarnings._count },
      thisMonth: { amount: monthEarnings._sum.deliveryFee || 0, deliveries: monthEarnings._count },
      allTime: { amount: allTimeEarnings._sum.deliveryFee || 0, deliveries: allTimeEarnings._count },
    },
    recentDeliveries,
  })
}))

module.exports = router