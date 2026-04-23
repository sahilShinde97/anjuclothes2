import cloudinary from '../config/cloudinary.js'

export async function createUploadSignature(_req, res, next) {
  try {
    const required = [process.env.CLOUDINARY_CLOUD_NAME, process.env.CLOUDINARY_API_KEY, process.env.CLOUDINARY_API_SECRET]

    if (required.some((value) => !value)) {
      return res.status(500).json({ message: 'Cloudinary is not configured.' })
    }

    const timestamp = Math.floor(Date.now() / 1000)
    const folder = 'anju-clothes/products'
    const allowedFormats = 'jpg,jpeg,png,webp'
    const transformation = 'f_auto,q_auto'
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder, allowed_formats: allowedFormats, transformation },
      process.env.CLOUDINARY_API_SECRET,
    )

    res.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      allowedFormats,
      transformation,
      signature,
    })
  } catch (error) {
    next(error)
  }
}
