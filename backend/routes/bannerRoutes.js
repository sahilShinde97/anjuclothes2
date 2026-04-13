import express from 'express'
import {
  createBanner,
  deleteBanner,
  getAdminBanners,
  getBanners,
  updateBanner,
} from '../controllers/bannerController.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'
import { handleValidation } from '../middleware/validationMiddleware.js'
import { bannerIdValidator, createOrUpdateBannerValidator } from '../validators/bannerValidators.js'

const router = express.Router()

router.get('/', getBanners)
router.get('/admin', protect, adminOnly, getAdminBanners)
router.post('/', protect, adminOnly, createOrUpdateBannerValidator, handleValidation, createBanner)
router.put('/:id', protect, adminOnly, bannerIdValidator, createOrUpdateBannerValidator, handleValidation, updateBanner)
router.delete('/:id', protect, adminOnly, bannerIdValidator, handleValidation, deleteBanner)

export default router
