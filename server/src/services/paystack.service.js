const axios = require('axios')

const PAYSTACK_BASE = 'https://api.paystack.co'

const paystackHeaders = {
  Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
  'Content-Type': 'application/json',
}

/**
 * Initialize a new Paystack transaction
 * Returns { authorization_url, access_code, reference }
 */
async function initializePayment({ email, amount, reference, metadata }) {
  const res = await axios.post(
    `${PAYSTACK_BASE}/transaction/initialize`,
    { email, amount, reference, metadata },
    { headers: paystackHeaders }
  )
  return res.data.data
}

/**
 * Verify a Paystack transaction by reference
 * Returns the full transaction object
 */
async function verifyPayment(reference) {
  const res = await axios.get(
    `${PAYSTACK_BASE}/transaction/verify/${reference}`,
    { headers: paystackHeaders }
  )
  return res.data.data
}

/**
 * Transfer funds to a vendor's bank account (called during escrow release)
 * Requires Paystack Transfer feature to be enabled on your account
 * recipientCode is a Paystack transfer recipient code (created once per vendor)
 */
async function transferToVendor({ amount, recipientCode, reason, reference }) {
  const res = await axios.post(
    `${PAYSTACK_BASE}/transfer`,
    {
      source: 'balance',
      amount,
      recipient: recipientCode,
      reason,
      reference,
    },
    { headers: paystackHeaders }
  )
  return res.data.data
}

module.exports = { initializePayment, verifyPayment, transferToVendor }