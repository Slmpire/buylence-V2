const axios = require('axios')

function client() {
  if (!process.env.PAYSTACK_SECRET_KEY) throw new Error('PAYSTACK_SECRET_KEY is not set in .env')
  return axios.create({
    baseURL: 'https://api.paystack.co',
    timeout: 20000,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  })
}

// amount must be in KOBO (naira x 100)
async function initializePayment({ email, amount, reference, callback_url, metadata }) {
  const res = await client().post('/transaction/initialize', {
    email, amount, reference, callback_url, metadata, currency: 'NGN',
  })
  return res.data.data // { authorization_url, access_code, reference }
}

async function verifyPayment(reference) {
  const res = await client().get(`/transaction/verify/${encodeURIComponent(reference)}`)
  return res.data.data // { status, amount, currency, reference, ... }
}

async function transferToVendor({ amount, recipientCode, reason, reference }) {
  const res = await client().post('/transfer', {
    source: 'balance', amount, recipient: recipientCode, reason, reference,
  })
  return res.data.data
}

module.exports = { initializePayment, verifyPayment, transferToVendor }