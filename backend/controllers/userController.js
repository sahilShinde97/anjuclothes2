import Order from '../models/Order.js'
import Product from '../models/Product.js'

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
      .map((item) => ({
        productId: item.product._id,
        name: item.product.name,
        price: item.product.price,
        image: (item.product.images && item.product.images[0]) || item.product.image,
        quantity: item.quantity,
      }))

    res.json({ items })
  } catch (error) {
    next(error)
  }
}

export async function addToCart(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body
    const product = await Product.findById(productId)

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' })
    }

    const existing = req.user.cart.find((item) => String(item.product) === String(productId))
    if (existing) {
      existing.quantity += Number(quantity) || 1
    } else {
      req.user.cart.push({ product: productId, quantity: Number(quantity) || 1 })
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
    const { quantity } = req.body
    const item = req.user.cart.find((cartItem) => String(cartItem.product) === String(req.params.productId))

    if (!item) {
      return res.status(404).json({ message: 'Cart item not found.' })
    }

    if (quantity <= 0) {
      req.user.cart = req.user.cart.filter((cartItem) => String(cartItem.product) !== String(req.params.productId))
    } else {
      item.quantity = Number(quantity)
    }

    await req.user.save()
    res.json({ message: 'Cart updated.' })
  } catch (error) {
    next(error)
  }
}

export async function removeCartItem(req, res, next) {
  try {
    req.user.cart = req.user.cart.filter((cartItem) => String(cartItem.product) !== String(req.params.productId))
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
