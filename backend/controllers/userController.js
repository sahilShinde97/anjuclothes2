import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { getDiscountedPrice, getEffectiveProductImages, getSafeDiscountPercentage } from '../utils/productVariantUtils.js'

function buildCartItemKey(productId, size) {
  return `${productId}::${size || ''}`
}

function serializeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
  }
}

export async function getProfile(req, res) {
  res.json({ user: serializeUser(req.user) })
}

export async function updateProfile(req, res, next) {
  try {
    const { name, phone, address } = req.body

    if (typeof name === 'string') {
      req.user.name = name.trim()
    }
    if (typeof phone === 'string') {
      req.user.phone = phone.trim()
    }
    if (typeof address === 'string') {
      req.user.address = address.trim()
    }

    await req.user.save()
    res.json({ user: serializeUser(req.user) })
  } catch (error) {
    next(error)
  }
}

export async function getCart(req, res, next) {
  try {
    await req.user.populate('cart.product')

    const items = req.user.cart
      .filter((item) => item.product)
      .map((item) => {
        const fallbackImages = getEffectiveProductImages(item.product)
        const originalPrice = Math.max(Number(item.product.price) || 0, 0)
        const discountPercentage = getSafeDiscountPercentage(item.product.discountPercentage)
        const finalPrice = getDiscountedPrice(item.product)
        return {
          key: buildCartItemKey(item.product._id, item.size),
          productId: item.product._id,
          name: item.product.name,
          price: finalPrice,
          discountedPrice: finalPrice,
          finalPrice,
          originalPrice,
          discountPercentage,
          image: fallbackImages[0] || '',
          quantity: item.quantity,
          size: item.size || '',
        }
      })

    res.json({ items })
  } catch (error) {
    next(error)
  }
}

export async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1, size = '' } = req.body
    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const safeSize = typeof size === 'string' ? size.trim() : ''
    const parsedQuantity = Math.max(Number(quantity) || 1, 1)

    const existing = req.user.cart.find(
      (item) =>
        String(item.product) === String(productId) &&
        (item.size || '') === safeSize,
    )

    const currentQuantity = existing ? Number(existing.quantity) || 0 : 0
    const nextQuantity = currentQuantity + parsedQuantity

    if (nextQuantity > product.stock) {
      return res.status(400).json({
        message: `Only ${product.stock} item(s) available in stock.`,
      })
    }

    if (existing) {
      existing.quantity += parsedQuantity
    } else {
      req.user.cart.push({
        product: productId,
        quantity: parsedQuantity,
        size: safeSize,
      })
    }

    await req.user.save()
    await req.user.populate('cart.product')

    res.json({ message: 'Added to cart.' })
  } catch (error) {
    next(error)
  }
}

export async function updateCartItem(req, res, next) {
  try {
    const { quantity, size = '' } = req.body
    const targetProductId = req.params.productId
    const safeSize = typeof size === 'string' ? size.trim() : ''
    const item = req.user.cart.find(
      (cartItem) =>
        String(cartItem.product) === String(targetProductId) &&
        (cartItem.size || '') === safeSize,
    )

    if (!item) {
      return res.status(404).json({ message: 'Cart item not found.' })
    }

    const parsedQuantity = Number(quantity)

    if (parsedQuantity <= 0) {
      req.user.cart = req.user.cart.filter(
        (cartItem) =>
          !(
            String(cartItem.product) === String(targetProductId) &&
            (cartItem.size || '') === safeSize
          ),
      )
    } else {
      const product = await Product.findById(targetProductId)

      if (!product) {
        return res.status(404).json({ message: 'Product not found.' })
      }

      if (parsedQuantity > product.stock) {
        return res.status(400).json({
          message: `Only ${product.stock} item(s) available in stock.`,
        })
      }

      item.quantity = parsedQuantity
    }

    await req.user.save()
    res.json({ message: 'Cart updated.' })
  } catch (error) {
    next(error)
  }
}

export async function removeCartItem(req, res, next) {
  try {
    const safeSize = typeof req.query.size === 'string' ? req.query.size.trim() : ''
    req.user.cart = req.user.cart.filter(
      (cartItem) =>
        !(
          String(cartItem.product) === String(req.params.productId) &&
          (cartItem.size || '') === safeSize
        ),
    )
    await req.user.save()
    res.json({ message: 'Cart item removed.' })
  } catch (error) {
    next(error)
  }
}

export async function clearCart(req, res, next) {
  try {
    req.user.cart = []
    await req.user.save()
    res.json({ message: 'Cart cleared.' })
  } catch (error) {
    next(error)
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate('items.product', 'name images image')
      .sort({ createdAt: -1 })

    res.json({ orders })
  } catch (error) {
    next(error)
  }
}
