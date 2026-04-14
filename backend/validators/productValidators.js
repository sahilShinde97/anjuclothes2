import { body, param, query } from 'express-validator'

export const createOrUpdateProductValidator = [
  body('name').trim().notEmpty().withMessage('Product name is required.'),
  body('price').isFloat({ gt: 0 }).withMessage('Price must be greater than 0.'),
  body('stock').isInt({ min: 0 }).withMessage('Stock must be 0 or more.'),
  body('discountPercentage').optional().isFloat({ min: 0, max: 90 }).withMessage('Discount should be between 0 and 90.'),
  body('category').trim().notEmpty().withMessage('Category is required.'),
  body('description').optional({ values: 'falsy' }).trim().isString(),
  body('sizes').optional().isArray().withMessage('Sizes must be an array.'),
  body('sizes.*').optional().isString(),
  body('image').optional({ values: 'falsy' }).trim().isURL().withMessage('Primary image must be a valid URL.'),
  body('images').optional().isArray({ min: 1 }).withMessage('At least one uploaded image is required.'),
  body('images.*').optional().isURL().withMessage('Uploaded image must be a valid URL.'),
  body().custom((value) => {
    const hasSingle = typeof value.image === 'string' && value.image.trim() !== ''
    const hasMultiple = Array.isArray(value.images) && value.images.length > 0

    if (!hasSingle && !hasMultiple) {
      throw new Error('At least one product image is required.')
    }

    return true
  }),
]

export const productIdValidator = [param('id').isMongoId().withMessage('Valid product id is required.')]

export const productQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be at least 1.'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50.'),
]
