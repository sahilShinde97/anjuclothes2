import { body, param, query } from 'express-validator'

export const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }).withMessage('Name should be between 2 and 80 characters.'),
  body('phone').optional().trim().isLength({ min: 8, max: 20 }).withMessage('Phone should be between 8 and 20 characters.'),
  body('address').optional().trim().isLength({ min: 5, max: 250 }).withMessage('Address should be between 5 and 250 characters.'),
]

export const addToCartValidator = [
  body('productId').isMongoId().withMessage('Valid product id is required.'),
  body('quantity').optional().isInt({ min: 1, max: 20 }).withMessage('Quantity should be between 1 and 20.'),
  body('size').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Size is invalid.'),
]

export const updateCartItemValidator = [
  param('productId').isMongoId().withMessage('Valid product id is required.'),
  body('quantity').isInt({ min: 0, max: 20 }).withMessage('Quantity should be between 0 and 20.'),
  body('size').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Size is invalid.'),
]

export const removeCartItemValidator = [
  param('productId').isMongoId().withMessage('Valid product id is required.'),
  query('size').optional({ values: 'falsy' }).trim().isLength({ max: 20 }).withMessage('Size is invalid.'),
]
