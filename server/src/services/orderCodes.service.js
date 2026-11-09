const crypto = require('crypto')
const prisma = require('../utils/prisma')

const MAX_ATTEMPTS = 5

const randomCode = () => String(crypto.randomInt(0, 1000000)).padStart(6, '0')

function safeEqual(a, b) {
  const x = Buffer.from(String(a))
  const y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

const FIELDS = {
  pickup: { code: 'pickupCode', attempts: 'pickupAttempts', verified: 'pickupVerifiedAt' },
  delivery: { code: 'deliveryCode', attempts: 'deliveryAttempts', verified: 'deliveryVerifiedAt' },
}

// Create the pickup and delivery codes for an order (does nothing if they already exist).
// `client` is prisma or a transaction.
async function ensureCodes(client, orderId) {
  const existing = await client.orderCode.findUnique({ where: { orderId } })
  if (existing) return existing
  try {
    return await client.orderCode.create({
      data: { orderId, pickupCode: randomCode(), deliveryCode: randomCode() },
    })
  } catch (err) {
    // Two requests created it at the same moment: use the one that won
    const again = await client.orderCode.findUnique({ where: { orderId } })
    if (again) return again
    throw err
  }
}

// Check a code typed in by a rider. Returns { ok: true } or { ok: false, status, error, ... }.
async function checkCode(orderId, kind, input) {
  const record = await prisma.orderCode.findUnique({ where: { orderId } })

  // An order that was already in progress before codes existed: let it through
  if (!record) return { ok: true, legacy: true }

  const f = FIELDS[kind]
  const whoCanReset = kind === 'pickup' ? 'the store' : 'the customer'

  if (record[f.attempts] >= MAX_ATTEMPTS) {
    return {
      ok: false, status: 423, locked: true, attemptsLeft: 0,
      error: `Too many wrong codes. Ask ${whoCanReset} to get a new code.`,
    }
  }

  const given = String(input ?? '').replace(/\s/g, '')
  if (!/^\d{6}$/.test(given)) {
    return { ok: false, status: 400, error: 'Enter the 6-digit code.' }
  }

  if (safeEqual(given, record[f.code])) return { ok: true }

  const updated = await prisma.orderCode.update({
    where: { orderId },
    data: { [f.attempts]: { increment: 1 } },
  })
  const left = Math.max(0, MAX_ATTEMPTS - updated[f.attempts])

  return {
    ok: false, status: 400, attemptsLeft: left, locked: left === 0,
    error: left > 0
      ? `That code is not right. ${left} attempt${left === 1 ? '' : 's'} left.`
      : `Too many wrong codes. Ask ${whoCanReset} to get a new code.`,
  }
}

async function markVerified(orderId, kind) {
  await prisma.orderCode.updateMany({
    where: { orderId },
    data: { [FIELDS[kind].verified]: new Date() },
  })
}

// Give the owner a fresh code and unlock it
async function regenerateCode(orderId, kind) {
  const f = FIELDS[kind]
  return prisma.orderCode.update({
    where: { orderId },
    data: { [f.code]: randomCode(), [f.attempts]: 0 },
  })
}

// What each person is allowed to see. Riders never see a code.
function describeCodes(order, role) {
  const record = order.code
  if (!record) return null

  const base = {
    role,
    pickupVerified: !!record.pickupVerifiedAt,
    deliveryVerified: !!record.deliveryVerifiedAt,
    code: null,
    locked: false,
    attemptsLeft: null,
  }

  if (
    role === 'vendor' &&
    ['READY_FOR_PICKUP', 'ASSIGNED_TO_RIDER'].includes(order.status) &&
    !record.pickupVerifiedAt
  ) {
    return {
      ...base,
      code: record.pickupCode,
      locked: record.pickupAttempts >= MAX_ATTEMPTS,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - record.pickupAttempts),
    }
  }

  if (
    role === 'buyer' &&
    ['ASSIGNED_TO_RIDER', 'PICKED_UP'].includes(order.status) &&
    !record.deliveryVerifiedAt
  ) {
    return {
      ...base,
      code: record.deliveryCode,
      locked: record.deliveryAttempts >= MAX_ATTEMPTS,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - record.deliveryAttempts),
    }
  }

  return base
}

module.exports = {
  MAX_ATTEMPTS, ensureCodes, checkCode, markVerified, regenerateCode, describeCodes,
}