import express from 'express'
import { protect } from '../middleware/authMiddleware.js'
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

const router = express.Router()

router.get('/profile', protect, getProfile)
router.put('/profile', protect, updateProfile)
router.get('/cart', protect, getCart)
router.post('/cart', protect, addToCart)
router.put('/cart/:productId', protect, updateCartItem)
router.delete('/cart/:productId', protect, removeCartItem)
router.delete('/cart', protect, clearCart)
router.get('/orders', protect, getMyOrders)

export default router
