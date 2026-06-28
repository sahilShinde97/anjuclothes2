import express from 'express'
import { createProduct, createProductReview, deleteProduct, getProductById, getProducts, updateProduct } from '../controllers/productController.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'
import { cacheResponse, invalidateCacheAfterMutation } from '../middleware/cacheMiddleware.js'
import { handleValidation } from '../middleware/validationMiddleware.js'
import {
  createOrUpdateProductValidator,
  createProductReviewValidator,
  productIdValidator,
  productQueryValidator,
} from '../validators/productValidators.js'

const router = express.Router()

router.get('/', cacheResponse(60), productQueryValidator, handleValidation, getProducts)
router.get('/:id', cacheResponse(120), productIdValidator, handleValidation, getProductById)
router.post('/:id/reviews', protect, productIdValidator, createProductReviewValidator, handleValidation, createProductReview)
router.post('/', protect, adminOnly, invalidateCacheAfterMutation(['/api/products']), createOrUpdateProductValidator, handleValidation, createProduct)
router.put('/:id', protect, adminOnly, invalidateCacheAfterMutation(['/api/products']), productIdValidator, createOrUpdateProductValidator, handleValidation, updateProduct)
router.delete('/:id', protect, adminOnly, invalidateCacheAfterMutation(['/api/products']), productIdValidator, handleValidation, deleteProduct)

export default router
