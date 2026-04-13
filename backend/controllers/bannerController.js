import Banner from '../models/Banner.js'

export async function getBanners(_req, res, next) {
  try {
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 })
    res.json({ banners })
  } catch (error) {
    next(error)
  }
}

export async function getAdminBanners(_req, res, next) {
  try {
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 })
    res.json({ banners })
  } catch (error) {
    next(error)
  }
}

export async function createBanner(req, res, next) {
  try {
    const { title, subtitle, image, ctaLabel, ctaLink, order, isActive } = req.body

    if (!title || !image) {
      return res.status(400).json({ message: 'Banner title and image are required.' })
    }

    const banner = await Banner.create({ title, subtitle, image, ctaLabel, ctaLink, order, isActive })
    res.status(201).json({ banner })
  } catch (error) {
    next(error)
  }
}

export async function updateBanner(req, res, next) {
  try {
    const banner = await Banner.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found.' })
    }

    res.json({ banner })
  } catch (error) {
    next(error)
  }
}

export async function deleteBanner(req, res, next) {
  try {
    const banner = await Banner.findByIdAndDelete(req.params.id)

    if (!banner) {
      return res.status(404).json({ message: 'Banner not found.' })
    }

    res.json({ message: 'Banner deleted successfully.' })
  } catch (error) {
    next(error)
  }
}
