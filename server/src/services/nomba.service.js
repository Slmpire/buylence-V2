const axios = require('axios')

const BASE = process.env.NOMBA_BASE_URL || 'https://api.nomba.com'
const CLIENT_ID = process.env.NOMBA_CLIENT_ID
const CLIENT_SECRET = process.env.NOMBA_CLIENT_SECRET
const ACCOUNT_ID = process.env.NOMBA_ACCOUNT_ID
const SUB_ACCOUNT_ID = process.env.NOMBA_SUB_ACCOUNT_ID

// Cache token in memory
let cachedToken = null
let tokenExpiresAt = null

async function getAccessToken() {
  // Return cached token if still valid (with 5 min buffer)
  if (cachedToken && tokenExpiresAt && new Date() < new Date(tokenExpiresAt.getTime() - 5 * 60 * 1000)) {
    return cachedToken
  }

  const res = await axios.post(`${BASE}/v1/auth/token/issue`, {
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  }, {
    headers: {
      'Content-Type': 'application/json',
      'accountId': ACCOUNT_ID,
    },
  })

  if (res.data.code !== '00') {
    throw new Error(`Nomba auth failed: ${res.data.description}`)
  }

  cachedToken = res.data.data.access_token
  tokenExpiresAt = new Date(res.data.data.expiresAt)
  return cachedToken
}

function nombaHeaders(token) {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'accountId': ACCOUNT_ID,
  }
}

/**
 * Create a Nomba checkout order
 * Returns { checkoutLink, orderReference }
 */
async function createCheckoutOrder({ amount, orderReference, customerEmail, callbackUrl, metadata = {} }) {
  const token = await getAccessToken()

  const res = await axios.post(`${BASE}/v1/checkout/order`, {
    order: {
      amount: amount.toFixed(2),
      currency: 'NGN',
      orderReference,
      customerEmail,
      callbackUrl,
      accountId: SUB_ACCOUNT_ID,
      orderMetaData: Object.fromEntries(
        Object.entries(metadata).map(([k, v]) => [k, String(v)])
      ),
    },
  }, { headers: nombaHeaders(token) })

  if (res.data.code !== '00') {
    throw new Error(`Nomba checkout failed: ${res.data.description}`)
  }

  return {
    checkoutLink: res.data.data.checkoutLink,
    orderReference: res.data.data.orderReference,
  }
}

/**
 * Fetch a checkout order to verify payment status
 * Returns the order data including status
 */
async function fetchCheckoutOrder(orderReference) {
  const token = await getAccessToken()

  const res = await axios.get(
    `${BASE}/v1/checkout/order/${orderReference}`,
    { headers: nombaHeaders(token) }
  )

  if (res.data.code !== '00') {
    throw new Error(`Nomba fetch order failed: ${res.data.description}`)
  }

  return res.data.data
}

module.exports = { getAccessToken, createCheckoutOrder, fetchCheckoutOrder }