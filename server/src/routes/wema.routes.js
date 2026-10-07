const express = require('express')
const router = express.Router()
const asyncHandler = require('express-async-handler')
const authenticate = require('../middleware/auth')
const prisma = require('../utils/prisma')
const { applyCredit } = require('../services/wemaVirtualAccount')

// Wema presents the shared secret you agreed on. Adjust the header to match
// what your hackathon docs say (x-api-key or Authorization: Bearer ...).
function webhookAuthorized(req) {
  const expected = process.env.WEMA_WEBHOOK_KEY
  if (!expected) return false
  const provided = req.headers['x-api-key'] || (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  return provided === expected
}

// POST /api/wema/name-enquiry
// Wema asks: "who owns this account number?" when a payer checks the name.
router.post('/name-enquiry', asyncHandler(async (req, res) => {
  if (!webhookAuthorized(req)) return res.sendStatus(401)

  const accountNumber = String(req.body.accountnumber || '')
  const order = await prisma.order.findUnique({
    where: { virtualAccount: accountNumber },
    select: { orderNumber: true },
  })
  if (!order) return res.status(404).json({ error: 'Account not found.' })

  res.json({ accountname: `BUYLENCE ${order.orderNumber}`, accountnumber: accountNumber, status: '00' })
}))

// POST /api/wema/trans-notify
// Wema tells us: "this virtual account was just credited".
router.post('/trans-notify', asyncHandler(async (req, res) => {
  if (!webhookAuthorized(req)) return res.sendStatus(401)

  const b = req.body
  console.log('Wema credit notification:', b?.sessionid, b?.craccount, b?.amount)

  const result = await applyCredit({
    accountNumber: b.craccount,
    amount: b.amount,
    sessionId: b.sessionid,
  })

  if (!result.order) {
    return res.status(404).json({ status: '01', status_desc: 'Unknown account' })
  }
  if (!result.ok) console.error('Wema credit not applied:', result.reason)

  // Acknowledge: we have recorded the credit
  res.json({
    ref: b.sessionid,
    transactionreference: result.order.orderNumber,
    status: '00',
    status_desc: 'Accepted',
  })
}))

// POST /api/wema/simulate  (DEMO ONLY: pretends the buyer transferred the money)
router.post('/simulate', authenticate, asyncHandler(async (req, res) => {
  if (process.env.WEMA_SIMULATE !== 'true') return res.status(404).json({ error: 'Not available.' })

  const order = await prisma.order.findUnique({ where: { id: req.body.orderId } })
  if (!order || order.buyerId !== req.user.id || !order.virtualAccount) {
    return res.status(404).json({ error: 'Order not found.' })
  }

  const result = await applyCredit({
    accountNumber: order.virtualAccount,
    amount: order.total,
    sessionId: `SIM-${Date.now()}`,
  })
  res.json({ ok: result.ok })
}))

module.exports = router