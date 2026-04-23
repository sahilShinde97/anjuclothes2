import express from 'express'
import { createCheckoutOrder, verifyCheckoutOrder } from '../controllers/paymentController.js'
import { protect } from '../middleware/authMiddleware.js'
import { checkoutLimiter } from '../middleware/rateLimitMiddleware.js'
import { requireIdempotencyKey } from '../middleware/securityMiddleware.js'
import { handleValidation } from '../middleware/validationMiddleware.js'
import { createPaymentOrderValidator, verifyPaymentValidator } from '../validators/paymentValidators.js'

const router = express.Router()

router.post('/create-order', checkoutLimiter, protect, requireIdempotencyKey, createPaymentOrderValidator, handleValidation, createCheckoutOrder)
router.post('/verify', protect, verifyPaymentValidator, handleValidation, verifyCheckoutOrder)

export default router
