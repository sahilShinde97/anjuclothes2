import express from 'express'
import { createUploadSignature } from '../controllers/uploadController.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'

const router = express.Router()

router.post('/signature', protect, adminOnly, createUploadSignature)

export default router
