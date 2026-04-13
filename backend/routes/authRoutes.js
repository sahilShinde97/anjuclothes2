import express from 'express'
import { forgotPassword, loginUser, registerUser, resetPassword } from '../controllers/authController.js'
import { handleValidation } from '../middleware/validationMiddleware.js'
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
} from '../validators/authValidators.js'

const router = express.Router()

router.post('/register', registerValidator, handleValidation, registerUser)
router.post('/login', loginValidator, handleValidation, loginUser)
router.post('/forgot-password', forgotPasswordValidator, handleValidation, forgotPassword)
router.post('/reset-password/:token', resetPasswordValidator, handleValidation, resetPassword)

export default router
