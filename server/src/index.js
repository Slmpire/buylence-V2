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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://buylence-frontend.vercel.app',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true)

    // Allow explicitly allowed origins or Vercel preview URLs
    if (allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
      return callback(null, true)
    }

    // In development mode, allow any local/dev origin
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }

    return callback(null, false)
  },
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
app.use('/api/notifications', require('./routes/notification.routes'))

// ── 404 fallback ──
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` })
})

// ── Centralized error handler (must be last) ──
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`✅ Buylence server running on http://localhost:${PORT}`)
})