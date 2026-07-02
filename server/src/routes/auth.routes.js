const express = require('express')
const router = express.Router()
const authenticate = require('../middleware/auth')
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const requireRole = require('../middleware/requireRole')
// POST /api/auth/sync
// Called by the frontend after Firebase sign-in.
// Creates or updates the user record in our DB and returns the full profile.
router.post('/sync', authenticate, asyncHandler(async (req, res) => {
  const { fullName, phone, hall, room, matric } = req.body
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(hall && { hall }),
      ...(room && { room }),
      ...(matric && { matric }),
    },
    include: { vendor: true, rider: true },
  })
  res.json({ user })
}))

// GET /api/auth/me
// Returns the currently authenticated user's full profile.
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  res.json({ user: req.user })
}))

// GET /api/auth/users — admin only
router.get('/users', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, fullName: true, email: true,
      role: true, hall: true, createdAt: true,
    },
  })
  res.json({ users })
}))

// PATCH /api/auth/profile
// Updates buyer profile fields.
router.patch('/profile', authenticate, asyncHandler(async (req, res) => {
  const { fullName, phone, hall, room, matric, bio } = req.body
  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(fullName && { fullName }),
      ...(phone && { phone }),
      ...(hall && { hall }),
      ...(room && { room }),
      ...(matric && { matric }),
      ...(bio !== undefined && { bio }),
    },
    include: { vendor: true, rider: true },
  })
  res.json({ user })
}))

module.exports = router