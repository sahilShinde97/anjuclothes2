import express from 'express'
import { createProduct, createProductReview, deleteProduct, getProductById, getProducts, updateProduct } from '../controllers/productController.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'
import { handleValidation } from '../middleware/validationMiddleware.js'
import {
  createOrUpdateProductValidator,
  createProductReviewValidator,
  productIdValidator,
  productQueryValidator,
} from '../validators/productValidators.js'

const router = express.Router()

router.get('/', productQueryValidator, handleValidation, getProducts)
router.get('/:id', productIdValidator, handleValidation, getProductById)
router.post('/:id/reviews', protect, productIdValidator, createProductReviewValidator, handleValidation, createProductReview)
router.post('/', protect, adminOnly, createOrUpdateProductValidator, handleValidation, createProduct)
router.put('/:id', protect, adminOnly, productIdValidator, createOrUpdateProductValidator, handleValidation, updateProduct)
router.delete('/:id', protect, adminOnly, productIdValidator, handleValidation, deleteProduct)

export default router
