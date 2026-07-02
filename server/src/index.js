require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const rateLimit = require('express-rate-limit')

const errorHandler = require('./middleware/errorHandler')

const app = express()
const PORT = process.env.PORT || 5001

// ── Security & parsing middleware ──
app.use(helmet())
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  next()
})
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

// Basic rate limiting on all API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use('/api', apiLimiter)

// ── Health check ──
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'buylence-server', timestamp: new Date().toISOString() })
})

// ── Routes ──
app.use('/api/auth', require('./routes/auth.routes'))
app.use('/api/products', require('./routes/product.routes'))
app.use('/api/vendors', require('./routes/vendor.routes'))
app.use('/api/orders', require('./routes/order.routes'))
app.use('/api/riders', require('./routes/rider.routes'))
app.use('/api/payments', require('./routes/payment.routes'))

// ── 404 fallback ──
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` })
})

// ── Centralized error handler (must be last) ──
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`✅ Buylence server running on http://localhost:${PORT}`)
})