import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import rateLimit from 'express-rate-limit'
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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, standardHeaders: true, legacyHeaders: false })
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false })

app.use(helmet())
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

app.get('/api/health', (_req, res) => {
  res.json({ message: 'Server is running' })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/banners', bannerRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/products', productRoutes)
app.use('/api/uploads', uploadRoutes)
app.use('/api/users', userRoutes)

app.use((err, _req, res, _next) => {
  res.status(err.statusCode || 500).json({
    message: err.message || 'Server error',
  })
})

async function startServer() {
  try {
    await connectDB()

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

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  } catch (error) {
    console.error(error.message)
    process.exit(1)
  }
}

startServer()
