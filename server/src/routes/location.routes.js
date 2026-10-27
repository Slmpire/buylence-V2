const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const authenticate = require('../middleware/auth')
const requireRole = require('../middleware/requireRole')
const prisma = require('../utils/prisma')

const TYPES = ['HALL', 'HOSTEL', 'FACULTY', 'GATE', 'LANDMARK', 'OFF_CAMPUS', 'OTHER']

// "" / null / undefined -> null, otherwise a number (NaN if invalid)
function toNum(v) {
  if (v === '' || v === null || v === undefined) return null
  return Number(v)
}

function validateCoords(latitude, longitude) {
  if (latitude === null && longitude === null) return null
  if (latitude === null || longitude === null) return 'Provide both latitude and longitude, or neither.'
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return 'Latitude must be between -90 and 90.'
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) return 'Longitude must be between -180 and 180.'
  return null
}

// GET /api/locations
// Public — active locations for pickers (optional ?area= ?type= ?search=)
router.get('/', asyncHandler(async (req, res) => {
  const { area, type, search } = req.query

  const locations = await prisma.location.findMany({
    where: {
      isActive: true,
      ...(area && { area }),
      ...(type && { type }),
      ...(search && { name: { contains: String(search), mode: 'insensitive' } }),
    },
    orderBy: [{ area: 'asc' }, { name: 'asc' }],
  })

  res.json({ locations })
}))

// GET /api/locations/admin/all
// Admin — every location, including hidden ones
router.get('/admin/all', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const locations = await prisma.location.findMany({
    orderBy: [{ area: 'asc' }, { name: 'asc' }],
  })
  res.json({ locations })
}))

// POST /api/locations
// Admin — add a location
router.post('/', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { name, area, type } = req.body
  const latitude = toNum(req.body.latitude)
  const longitude = toNum(req.body.longitude)

  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'A location name is required.' })
  }
  if (type && !TYPES.includes(type)) {
    return res.status(400).json({ error: `Type must be one of: ${TYPES.join(', ')}.` })
  }
  const coordError = validateCoords(latitude, longitude)
  if (coordError) return res.status(400).json({ error: coordError })

  const cleanName = String(name).trim()
  const existing = await prisma.location.findUnique({ where: { name: cleanName } })
  if (existing) return res.status(409).json({ error: 'A location with this name already exists.' })

  const location = await prisma.location.create({
    data: {
      name: cleanName,
      area: area?.trim() || 'OAU Campus',
      type: type || 'HALL',
      latitude,
      longitude,
    },
  })

  res.status(201).json({ location, message: 'Location added.' })
}))

// PATCH /api/locations/:id
// Admin — edit a location (or hide / show it with isActive)
router.patch('/:id', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const existing = await prisma.location.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Location not found.' })

  const { name, area, type, isActive } = req.body
  const hasCoords = 'latitude' in req.body || 'longitude' in req.body
  const latitude = hasCoords ? toNum(req.body.latitude) : existing.latitude
  const longitude = hasCoords ? toNum(req.body.longitude) : existing.longitude

  if (type && !TYPES.includes(type)) {
    return res.status(400).json({ error: `Type must be one of: ${TYPES.join(', ')}.` })
  }
  if (hasCoords) {
    const coordError = validateCoords(latitude, longitude)
    if (coordError) return res.status(400).json({ error: coordError })
  }

  let cleanName
  if (name !== undefined) {
    cleanName = String(name).trim()
    if (!cleanName) return res.status(400).json({ error: 'A location name is required.' })
    if (cleanName !== existing.name) {
      const clash = await prisma.location.findUnique({ where: { name: cleanName } })
      if (clash) return res.status(409).json({ error: 'A location with this name already exists.' })
    }
  }

  const location = await prisma.location.update({
    where: { id: req.params.id },
    data: {
      ...(cleanName !== undefined && { name: cleanName }),
      ...(area !== undefined && { area: area.trim() || 'OAU Campus' }),
      ...(type && { type }),
      ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      ...(hasCoords && { latitude, longitude }),
    },
  })

  res.json({ location, message: 'Location updated.' })
}))

// DELETE /api/locations/:id
// Admin — remove a location. Orders and vendors keep the name as plain text, so nothing breaks.
router.delete('/:id', authenticate, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const existing = await prisma.location.findUnique({ where: { id: req.params.id } })
  if (!existing) return res.status(404).json({ error: 'Location not found.' })

  await prisma.location.delete({ where: { id: req.params.id } })
  res.json({ message: 'Location removed.' })
}))

module.exports = router