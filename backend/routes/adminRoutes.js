import express from 'express'
import { deleteAdminOrder, getAdminOrderDetail, getAdminOrders, getAdminSummary, updateAdminOrder } from '../controllers/adminController.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'
import { handleValidation } from '../middleware/validationMiddleware.js'
import { adminOrderUpdateValidator, orderIdValidator } from '../validators/orderValidators.js'

const router = express.Router()

router.get('/summary', protect, adminOnly, getAdminSummary)
router.get('/orders', protect, adminOnly, getAdminOrders)
router.get('/orders/:id', protect, adminOnly, orderIdValidator, handleValidation, getAdminOrderDetail)
router.patch('/orders/:id', protect, adminOnly, orderIdValidator, adminOrderUpdateValidator, handleValidation, updateAdminOrder)
router.delete('/orders/:id', protect, adminOnly, orderIdValidator, handleValidation, deleteAdminOrder)

export default router
