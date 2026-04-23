import mongoose from 'mongoose'
import Product from '../models/Product.js'
import { attachProductPricing, getEffectiveProductImages, getSafeDiscountPercentage } from '../utils/productVariantUtils.js'

function normalizeProductPayload(body) {
  const { name, price, stock, discountPercentage, sizes, image, images, category, subcategory, description, groupId, colorName, colorHex } = body
  const normalizedImages = Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : []
  const primaryImage = normalizedImages[0] || image || ''

  return {
    name,
    price,
    stock,
    discountPercentage: getSafeDiscountPercentage(discountPercentage),
    sizes: Array.isArray(sizes) ? sizes.filter(Boolean) : [],
    image: primaryImage,
    images: normalizedImages.length > 0 ? normalizedImages : primaryImage ? [primaryImage] : [],
    category,
    subcategory: subcategory || '',
    groupId: typeof groupId === 'string' ? groupId.trim() : '',
    colorName: typeof colorName === 'string' ? colorName.trim() : '',
    colorHex: typeof colorHex === 'string' ? colorHex.trim().toUpperCase() : '',
    description: description || '',
  }
}

function serializeProduct(productDoc) {
  const product = productDoc.toObject ? productDoc.toObject() : productDoc
  const images = getEffectiveProductImages(product)
  const image = images[0] || product.image || ''
  const reviews = Array.isArray(product.reviews) ? product.reviews : []
  const ratingCount = reviews.length
  const ratingAverage = ratingCount > 0 ? Number((reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / ratingCount).toFixed(1)) : 0

  return attachProductPricing({
    ...product,
    images,
    image,
    ratingCount,
    ratingAverage,
  })
}

export async function getProducts(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 50)
    const search = req.query.search?.trim()
    const category = req.query.category?.trim()
    const subcategory = req.query.subcategory?.trim()
    const sort = req.query.sort?.trim() || 'newest'
    const priceRange = req.query.priceRange?.trim()
    const offersOnly = req.query.offersOnly === 'true'
    const groupId = req.query.groupId?.trim()

    const filter = {}

    if (search) {
      filter.name = { $regex: search, $options: 'i' }
    }

    if (category && category !== 'All') {
      filter.category = category
    }

    if (subcategory && subcategory !== 'All') {
      filter.subcategory = subcategory
    }

    if (priceRange === 'under-1000') {
      filter.price = { $lt: 1000 }
    }

    if (priceRange === '1000-1999') {
      filter.price = { $gte: 1000, $lte: 1999 }
    }

    if (priceRange === '2000-plus') {
      filter.price = { $gte: 2000 }
    }

    if (offersOnly) {
      filter.discountPercentage = { $gt: 0 }
    }

    if (groupId) {
      filter.groupId = groupId
    }

    const sortMap = {
      newest: { createdAt: -1 },
      price_low: { price: 1, createdAt: -1 },
      price_high: { price: -1, createdAt: -1 },
      name_asc: { name: 1 },
    }

    const total = await Product.countDocuments(filter)
    const products = await Product.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit)

    const categories = (await Product.distinct('category')).filter((categoryName) => categoryName !== 'Saree')
    const subcategories = category && category !== 'All' ? await Product.distinct('subcategory', { category }) : []

    res.json({
      products: products.map((product) => serializeProduct(product)),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
        hasMore: page * limit < total,
      },
      categories: ['All', ...categories.sort()],
      subcategories: ['All', ...subcategories.filter(Boolean).sort()],
    })
  } catch (error) {
    next(error)
  }
}

export async function getProductById(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    res.json({ product: serializeProduct(product) })
  } catch (error) {
    next(error)
  }
}

export async function createProduct(req, res, next) {
  try {
    const product = await Product.create(normalizeProductPayload(req.body))
    res.status(201).json({ product: serializeProduct(product) })
  } catch (error) {
    next(error)
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      normalizeProductPayload(req.body),
      { new: true, runValidators: true },
    )

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    res.json({ product: serializeProduct(product) })
  } catch (error) {
    next(error)
  }
}

export async function deleteProduct(req, res, next) {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    res.json({ message: 'Product deleted successfully.' })
  } catch (error) {
    next(error)
  }
}

export async function createProductReview(req, res, next) {
  try {
    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const rating = Math.max(1, Math.min(Number(req.body.rating) || 0, 5))
    const comment = typeof req.body.comment === 'string' ? req.body.comment.trim() : ''
    const existingReview = product.reviews.find((review) => String(review.user) === String(req.user._id))

    if (existingReview) {
      existingReview.rating = rating
      existingReview.comment = comment
      existingReview.createdAt = new Date()
    } else {
      product.reviews.push({
        user: new mongoose.Types.ObjectId(req.user._id),
        name: req.user.name,
        rating,
        comment,
      })
    }

    await product.save()

    res.status(201).json({ message: 'Review saved.', product: serializeProduct(product) })
  } catch (error) {
    next(error)
  }
}
