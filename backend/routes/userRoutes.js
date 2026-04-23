import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
import { handleValidation } from '../middleware/validationMiddleware.js'
import {
  addToCart,
  clearCart,
  getCart,
  getMyOrders,
  getProfile,
  removeCartItem,
  updateCartItem,
  updateProfile,
} from '../controllers/userController.js'
import {
  addToCartValidator,
  removeCartItemValidator,
  updateCartItemValidator,
  updateProfileValidator,
} from '../validators/userValidators.js'

const router = express.Router()

router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfileValidator, handleValidation, updateProfile)
router.get('/cart', protect, getCart)
router.post('/cart', protect, addToCartValidator, handleValidation, addToCart)
router.put('/cart/:productId', protect, updateCartItemValidator, handleValidation, updateCartItem)
router.delete('/cart/:productId', protect, removeCartItemValidator, handleValidation, removeCartItem)
router.delete('/cart', protect, clearCart)
router.get('/orders', protect, getMyOrders)

export default router
