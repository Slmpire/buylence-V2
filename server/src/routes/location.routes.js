const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const prisma = require('../utils/prisma')

const TYPES = ['HALL', 'HOSTEL', 'DEPARTMENT', 'GATE', 'MARKET', 'OTHER']

const cleanName = (s) => String(s || '').trim().replace(/\s+/g, ' ')
const num = (v) => {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const validCoords = (lat, lng) =>
  lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180

// GET /api/locations — list active locations (public)
router.get('/', asyncHandler(async (req, res) => {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    orderBy: [{ type: 'asc' }, { name: 'asc' }],
  })
  res.json({ locations })
}))

// POST /api/locations — any signed-in user can add a place that is missing
router.post('/', authenticate, asyncHandler(async (req, res) => {
  const name = cleanName(req.body.name)
  if (name.length < 2 || name.length > 80) {
    return res.status(400).json({ error: 'Location name must be 2 to 80 characters.' })
  }

  const type = TYPES.includes(req.body.type) ? req.body.type : 'OTHER'
  const lat = num(req.body.latitude)
  const lng = num(req.body.longitude)
  const coords = validCoords(lat, lng) ? { latitude: lat, longitude: lng } : {}

  const existing = await prisma.location.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
  })

  if (existing) {
    if (!existing.isActive) {
      return res.status(409).json({ error: 'That location is not available.' })
    }
    // Fill in missing coordinates, but never overwrite ones that are already set
    if (existing.latitude === null && coords.latitude !== undefined) {
      const updated = await prisma.location.update({ where: { id: existing.id }, data: coords })
      return res.json({ location: updated, existing: true })
    }
    return res.json({ location: existing, existing: true })
  }

  const location = await prisma.location.create({ data: { name, type, ...coords } })
  res.status(201).json({ location })
}))

// PATCH /api/locations/:id — admin only: rename, retype, set coordinates, deactivate
router.patch('/:id', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { name, type, latitude, longitude, isActive } = req.body
  const data = {}

  if (name !== undefined) data.name = cleanName(name)
  if (type !== undefined && TYPES.includes(type)) data.type = type
  if (latitude !== undefined || longitude !== undefined) {
    const lat = num(latitude)
    const lng = num(longitude)
    if (!validCoords(lat, lng)) {
      return res.status(400).json({ error: 'Provide a valid latitude and longitude.' })
    }
    data.latitude = lat
    data.longitude = lng
  }
  if (isActive !== undefined) data.isActive = !!isActive

  const location = await prisma.location.update({ where: { id: req.params.id }, data })
  res.json({ location })
}))

module.exports = router