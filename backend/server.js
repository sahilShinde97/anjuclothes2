import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import Banner from './models/Banner.js'
import connectDB from './config/db.js'
import sampleBanners from './data/sampleBanners.js'
import sampleProducts from './data/sampleProducts.js'
import Product from './models/Product.js'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import bannerRoutes from './routes/bannerRoutes.js'
import { handleWebhook } from './controllers/paymentController.js'
import paymentRoutes from './routes/paymentRoutes.js'
import productRoutes from './routes/productRoutes.js'
import uploadRoutes from './routes/uploadRoutes.js'
import userRoutes from './routes/userRoutes.js'
import { apiLimiter, authLimiter, sensitiveLimiter } from './middleware/rateLimitMiddleware.js'
import { sanitizeRequest } from './middleware/securityMiddleware.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

function parseAllowedOrigins() {
  const rawOrigins = process.env.CLIENT_URLS || process.env.CLIENT_URL || 'http://localhost:5173'
  return rawOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

if (process.env.NODE_ENV === 'production') {
  const requiredEnv = ['MONGODB_URI', 'JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'CLOUDINARY_API_SECRET']
  const missing = requiredEnv.filter((key) => !process.env[key])
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
}
app.use(helmet())
const allowedOrigins = parseAllowedOrigins()
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        return callback(null, true)
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true)
      }

      return callback(new Error('CORS origin not allowed.'))
    },
  }),
)
app.use(apiLimiter)
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => {
    req.rawBody = req.body.toString('utf8')
    try {
      req.body = JSON.parse(req.rawBody)
    } catch {
      req.body = {}
    }
    next()
  },
  handleWebhook,
)
app.use(express.json())
app.use(sanitizeRequest)

app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is running' })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/admin', sensitiveLimiter, adminRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/products', productRoutes)
app.use('/api/uploads', sensitiveLimiter, uploadRoutes)
app.use('/api/users', sensitiveLimiter, userRoutes)

app.use((err, _req, res, _next) => {
  res.status(err.statusCode || 500).json({
    message: err.message || 'Server error',
  })
})

async function startServer() {
  try {
    await connectDB()

    const shouldSeed = process.env.SEED_SAMPLE_DATA === 'true'

    if (shouldSeed) {
      const totalProducts = await Product.countDocuments()

      if (totalProducts === 0) {
        await Product.insertMany(sampleProducts)
        console.log('Sample products inserted')
      }

      const totalBanners = await Banner.countDocuments()

      if (totalBanners === 0) {
        await Banner.insertMany(sampleBanners)
        console.log('Sample banners inserted')
      }
    }

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

startServer()
