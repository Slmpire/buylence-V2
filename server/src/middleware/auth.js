const admin = require('../config/firebase')
const prisma = require('../utils/prisma')

/**
 * Verifies the Firebase ID token sent as "Authorization: Bearer <token>".
 * On success, attaches the matching Buylence User record to req.user.
 * If no User row exists yet for this Firebase account, creates a minimal
 * BUYER record on the fly (first-time login).
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization || ''
    const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided.' })
    }

    const decoded = await admin.auth().verifyIdToken(token)

    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: { vendor: true, rider: true },
    })

    // First-time login — create a minimal buyer record
    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email || '',
          fullName: decoded.name || decoded.email?.split('@')[0] || 'New User',
        },
        include: { vendor: true, rider: true },
      })
    }

    req.user = user
    req.firebaseUser = decoded
    next()
  } catch (err) {
    console.error('Auth error:', err.message)
    return res.status(401).json({ error: 'Invalid or expired authentication token.' })
  }
}

module.exports = authenticate