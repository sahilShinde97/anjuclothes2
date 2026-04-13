import { body, param } from 'express-validator'

export const orderIdValidator = [param('id').isMongoId().withMessage('Valid order id is required.')]

export const adminOrderUpdateValidator = [
  body('orderStatus').optional().isIn(['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid order status.'),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'failed']).withMessage('Invalid payment status.'),
  body().custom((value) => {
    if (!value.orderStatus && !value.paymentStatus) {
      throw new Error('Provide orderStatus or paymentStatus to update.')
    }

    return true
  }),
]
