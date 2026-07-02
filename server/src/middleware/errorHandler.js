/**
 * Centralized error handler — must be registered LAST in index.js
 * (after all routes). Catches errors passed via next(err) and
 * anything thrown inside async route handlers wrapped with
 * express-async-handler.
 */
function errorHandler(err, req, res, next) {
  console.error('Error:', err)

  // Prisma known errors (e.g. unique constraint violations)
  if (err.code === 'P2002') {
    return res.status(409).json({
      error: `A record with this ${err.meta?.target?.join(', ') || 'value'} already exists.`,
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' })
  }

  const statusCode = err.statusCode || 500
  const message = err.message || 'Something went wrong on our end.'

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

module.exports = errorHandler