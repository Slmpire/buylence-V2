const axios = require('axios')
const crypto = require('crypto')

const baseUrl = () => process.env.OPAY_BASE_URL || 'https://sandboxapi.opaycheckout.com'

// Create a hosted checkout page. Amount is in kobo (naira x 100).
async function createCashierPayment({ reference, amountKobo, returnUrl, cancelUrl, callbackUrl, user, productList }) {
  if (!process.env.OPAY_PUBLIC_KEY || !process.env.OPAY_MERCHANT_ID) {
    throw new Error('OPAY_PUBLIC_KEY / OPAY_MERCHANT_ID are not set in .env')
  }

  const res = await axios.post(
    `${baseUrl()}/api/v1/international/cashier/create`,
    {
      country: 'NG',
      reference,
      amount: { total: amountKobo, currency: 'NGN' },
      returnUrl,
      cancelUrl,
      callbackUrl,
      expireAt: 30, // minutes
      userInfo: user,
      productList,
    },
    {
      timeout: 20000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPAY_PUBLIC_KEY}`,
        MerchantId: process.env.OPAY_MERCHANT_ID,
      },
    }
  )

  // Success is code "00000"; anything else is an error message from OPay
  if (res.data?.code !== '00000') {
    throw new Error(`OPay: ${res.data?.message || 'could not create payment'} (${res.data?.code})`)
  }
  return res.data.data // { reference, orderNo, cashierUrl, status, amount }
}

// OPay signs callbacks with HMAC-SHA3-512 over this exact string (from OPay's docs)
function verifyCallbackSignature(body) {
  const p = body?.payload
  if (!p || !body.sha512 || !process.env.OPAY_SECRET_KEY) return false

  const signString =
    `{Amount:"${p.amount}",Currency:"${p.currency}",Reference:"${p.reference}",` +
    `Refunded:${p.refunded ? 't' : 'f'},Status:"${p.status}",Timestamp:"${p.timestamp}",` +
    `Token:"${p.token || ''}",TransactionID:"${p.transactionId}"}`

  const expected = crypto
    .createHmac('sha3-512', process.env.OPAY_SECRET_KEY)
    .update(signString)
    .digest('hex')

  return expected.toLowerCase() === String(body.sha512).toLowerCase()
}

module.exports = { createCashierPayment, verifyCallbackSignature }