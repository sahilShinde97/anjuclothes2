import Product from '../models/Product.js'

export async function getProducts(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 50)
    const search = req.query.search?.trim()
    const category = req.query.category?.trim()
    const subcategory = req.query.subcategory?.trim()
    const sort = req.query.sort?.trim() || 'newest'
    const priceRange = req.query.priceRange?.trim()

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
      products,
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

    res.json({ product })
  } catch (error) {
    next(error)
  }
}

export async function createProduct(req, res, next) {
  try {
    const { name, price, stock, image, images, category, subcategory, description } = req.body

    const normalizedImages = Array.isArray(images) ? images.filter(Boolean).slice(0, 3) : []
    const primaryImage = normalizedImages[0] || image

    const product = await Product.create({
      name,
      price,
      stock,
      image: primaryImage,
      images: normalizedImages.length > 0 ? normalizedImages : primaryImage ? [primaryImage] : [],
      category,
      subcategory: subcategory || '',
      description: description || '',
    })
    res.status(201).json({ product })
  } catch (error) {
    next(error)
  }
}

export async function updateProduct(req, res, next) {
  try {
    const { name, price, stock, image, images, category, subcategory, description } = req.body

    const normalizedImages = Array.isArray(images) ? images.filter(Boolean).slice(0, 3) : []
    const primaryImage = normalizedImages[0] || image

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        price,
        stock,
        image: primaryImage,
        images: normalizedImages.length > 0 ? normalizedImages : primaryImage ? [primaryImage] : [],
        category,
        subcategory: subcategory || '',
        description: description || '',
      },
      { new: true, runValidators: true },
    )

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    res.json({ product })
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
