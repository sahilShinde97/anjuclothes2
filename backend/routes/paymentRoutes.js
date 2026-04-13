import express from 'express'
import { createCheckoutOrder, verifyCheckoutOrder } from '../controllers/paymentController.js'
import { protect } from '../middleware/authMiddleware.js'
import { handleValidation } from '../middleware/validationMiddleware.js'
import { createPaymentOrderValidator, verifyPaymentValidator } from '../validators/paymentValidators.js'

const router = express.Router()

router.post('/create-order', protect, createPaymentOrderValidator, handleValidation, createCheckoutOrder)
router.post('/verify', protect, verifyPaymentValidator, handleValidation, verifyCheckoutOrder)

export default router
