import express from 'express'
import {
  createBanner,
  deleteBanner,
  getAdminBanners,
  getBanners,
  updateBanner,
} from '../controllers/bannerController.js'
import { adminOnly, protect } from '../middleware/authMiddleware.js'
import { cacheResponse, invalidateCacheAfterMutation } from '../middleware/cacheMiddleware.js'
import { handleValidation } from '../middleware/validationMiddleware.js'
import { bannerIdValidator, createOrUpdateBannerValidator } from '../validators/bannerValidators.js'

const router = express.Router()

router.get('/', cacheResponse(300), getBanners)
router.get('/admin', protect, adminOnly, getAdminBanners)
router.post('/', protect, adminOnly, invalidateCacheAfterMutation(['/api/banners']), createOrUpdateBannerValidator, handleValidation, createBanner)
router.put('/:id', protect, adminOnly, invalidateCacheAfterMutation(['/api/banners']), bannerIdValidator, createOrUpdateBannerValidator, handleValidation, updateBanner)
router.delete('/:id', protect, adminOnly, invalidateCacheAfterMutation(['/api/banners']), bannerIdValidator, handleValidation, deleteBanner)

export default router
