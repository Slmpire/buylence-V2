async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || ''
  const token = authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null

  if (!token) {
    return res.status(401).json({ error: 'No authentication token provided.' })
  }

  let decoded
  try {
    decoded = await admin.auth().verifyIdToken(token)
  } catch (err) {
    console.error('Token verification failed:', err.message)
    return res.status(401).json({ error: 'Invalid or expired authentication token.' })
  }

  try {
    let user = await prisma.user.findUnique({
      where: { firebaseUid: decoded.uid },
      include: { vendor: true, rider: true },
    })

    // ...keep your existing "first-time login" block exactly as it is...

    req.user = user
    req.firebaseUser = decoded
    next()
  } catch (err) {
    console.error('Auth DB error:', err.message)
    return res.status(500).json({ error: 'Server error while loading your account.' })
  }
}