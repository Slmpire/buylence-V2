const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const prisma = require('../utils/prisma')
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
// POST /api/auth/sync
// Called by the frontend after Firebase sign-in.
// Creates or updates the user record in our DB and returns the full profile.
router.post('/sync', authenticate, asyncHandler(async (req, res) => {
  const { fullName, phone, hall, room, matric, role } = req.body

  const dataToUpdate = {}
  if (fullName) dataToUpdate.fullName = fullName
  if (phone) dataToUpdate.phone = phone
  if (hall) dataToUpdate.hall = hall
  if (room) dataToUpdate.room = room
  if (matric) dataToUpdate.matric = matric
  if (role && ['BUYER', 'VENDOR'].includes(role)) {
    // Only update role if user is BUYER or setting VENDOR role
    if (req.user.role === 'BUYER' || role === req.user.role) {
      dataToUpdate.role = role
    }
  }

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: dataToUpdate,
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