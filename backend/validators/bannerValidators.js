import { body, param } from 'express-validator'

export const createOrUpdateBannerValidator = [
  body('title').trim().notEmpty().withMessage('Banner title is required.'),
  body('image').trim().isURL().withMessage('Valid banner image URL is required.'),
  body('ctaLink').optional({ values: 'falsy' }).isString(),
]

export const bannerIdValidator = [param('id').isMongoId().withMessage('Valid banner id is required.')]
