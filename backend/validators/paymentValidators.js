import { body } from 'express-validator'

export const createPaymentOrderValidator = [
  body('phone').optional({ values: 'falsy' }).trim().isString(),
  body('address').optional({ values: 'falsy' }).trim().isString(),
  body('paymentMethod').optional().isIn(['online', 'cod']).withMessage('Invalid payment method.'),
]

export const verifyPaymentValidator = [
  body('razorpayOrderId').trim().notEmpty().withMessage('Razorpay order id is required.'),
  body('razorpayPaymentId').trim().notEmpty().withMessage('Razorpay payment id is required.'),
  body('razorpaySignature').trim().notEmpty().withMessage('Razorpay signature is required.'),
]
