/**
 * Usage: requireRole('VENDOR') or requireRole('VENDOR', 'ADMIN')
 * Must run AFTER the `authenticate` middleware (needs req.user).
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `This action requires one of the following roles: ${allowedRoles.join(', ')}.`,
      })
    }

    next()
  }
}

module.exports = requireRole