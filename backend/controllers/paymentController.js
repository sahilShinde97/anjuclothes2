import crypto from 'crypto'
import Razorpay from 'razorpay'
import Order from '../models/Order.js'
import Product from '../models/Product.js'
import { getDiscountedPrice, getEffectiveProductImages, getSafeDiscountPercentage } from '../utils/productVariantUtils.js'

function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured.')
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

function logPaymentEvent(level, event, payload = {}) {
  const logFn = level === 'error' ? console.error : console.info
  logFn(
    JSON.stringify({
      level,
      domain: 'payments',
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    }),
  )
}

function buildOrderItems(user) {
  return user.cart
    .filter((item) => item.product)
    .map((item) => {
      const fallbackImages = getEffectiveProductImages(item.product)
      const originalPrice = Math.max(Number(item.product.price) || 0, 0)
      const discountPercentage = getSafeDiscountPercentage(item.product.discountPercentage)
      const finalPrice = getDiscountedPrice(item.product)
      return {
        product: item.product._id,
        name: item.product.name,
        image: fallbackImages[0] || '',
        price: finalPrice,
        originalPrice,
        discountPercentage,
        quantity: item.quantity,
        size: item.size || '',
      }
    })
}

function buildCartSignature(items) {
  return items
    .map((item) => `${item.product}:${item.size || ''}:${item.quantity}:${item.price}`)
    .sort()
    .join('|')
}

async function validateStock(items) {
  for (const item of items) {
    const product = await Product.findById(item.product)
    if (!product) {
      throw new Error(`Product ${item.name} not found.`)
    }
    const availableStock = product.stock

    if (availableStock < item.quantity) {
      throw new Error(`${product.name} is out of stock or has limited quantity.`)
    }
  }
}

async function decrementStock(items) {
  for (const item of items) {
    const product = await Product.findById(item.product)
    if (!product) {
      continue
    }

    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
  }
}

export async function createCheckoutOrder(req, res, next) {
  try {
    const { phone, address, paymentMethod } = req.body
    await req.user.populate('cart.product')

    const items = buildOrderItems(req.user)

    if (items.length === 0) {
      logPaymentEvent('info', 'checkout_create_rejected_empty_cart', {
        userId: String(req.user._id),
      })
      return res.status(400).json({ message: 'Your cart is empty.' })
    }

    await validateStock(items)

    const safePaymentMethod = paymentMethod === 'cod' ? 'cod' : 'online'
    const contactPhone = phone?.trim() || req.user.phone
    const shippingAddress = address?.trim() || req.user.address

    if (!contactPhone || !shippingAddress) {
      logPaymentEvent('info', 'checkout_create_rejected_missing_contact', {
        userId: String(req.user._id),
      })
      return res.status(400).json({ message: 'Phone and address are required.' })
    }

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const cartSignature = buildCartSignature(items)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const duplicateOrder = await Order.findOne({
      user: req.user._id,
      idempotencyKey: req.idempotencyKey,
      createdAt: { $gte: fiveMinutesAgo },
    })

    if (duplicateOrder) {
      logPaymentEvent('info', 'checkout_create_rejected_duplicate_idempotency', {
        userId: String(req.user._id),
        idempotencyKey: req.idempotencyKey,
      })
      return res.status(409).json({ message: 'Duplicate order request detected. Please wait.' })
    }

    const pendingSimilarOrder = await Order.findOne({
      user: req.user._id,
      cartSignature,
      amount,
      paymentStatus: 'pending',
      createdAt: { $gte: fiveMinutesAgo },
    })

    if (pendingSimilarOrder) {
      logPaymentEvent('info', 'checkout_create_rejected_pending_similar', {
        userId: String(req.user._id),
        cartSignature,
      })
      return res.status(409).json({ message: 'A similar pending order already exists. Complete payment first.' })
    }
    const firstProduct = items[0]

    if (safePaymentMethod === 'cod') {
      await decrementStock(items)

      const order = await Order.create({
        user: req.user._id,
        product: firstProduct.product,
        items,
        customerName: req.user.name,
        email: req.user.email,
        phone: contactPhone,
        address: shippingAddress,
        amount,
        currency: 'INR',
        paymentMethod: 'cod',
        paymentStatus: 'pending',
        orderStatus: 'placed',
        idempotencyKey: req.idempotencyKey,
        cartSignature,
        statusHistory: [{ label: 'placed', note: 'COD order placed' }],
      })

      req.user.cart = []
      await req.user.save()

      logPaymentEvent('info', 'checkout_create_cod_success', {
        userId: String(req.user._id),
        orderId: String(order._id),
        amount,
      })
      return res.status(201).json({ message: 'COD order placed successfully.', order })
    }

    const razorpay = getRazorpayInstance()
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(amount * 100),
      currency: 'INR',
      receipt: `order_${req.user._id}_${Date.now()}`.slice(0, 40),
      notes: { customer: req.user.email },
    })

    const order = await Order.create({
      user: req.user._id,
      product: firstProduct.product,
      items,
      customerName: req.user.name,
      email: req.user.email,
      phone: contactPhone,
      address: shippingAddress,
      amount,
      currency: 'INR',
      paymentMethod: 'online',
      paymentStatus: 'pending',
      orderStatus: 'placed',
      razorpayOrderId: razorpayOrder.id,
      idempotencyKey: req.idempotencyKey,
      cartSignature,
      statusHistory: [{ label: 'placed', note: 'Online order created' }],
    })

    logPaymentEvent('info', 'checkout_create_online_success', {
      userId: String(req.user._id),
      orderId: String(order._id),
      razorpayOrderId: razorpayOrder.id,
      amount,
    })
    res.status(201).json({
      order,
      razorpayOrder,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
    logPaymentEvent('error', 'checkout_create_failed', {
      userId: req.user?._id ? String(req.user._id) : '',
      message: error.message,
    })
    next(error)
  }
}

export async function verifyCheckoutOrder(req, res, next) {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')

    if (generatedSignature !== razorpaySignature) {
      logPaymentEvent('info', 'checkout_verify_failed_signature_mismatch', {
        userId: String(req.user._id),
        razorpayOrderId,
      })
      return res.status(400).json({ message: 'Payment verification failed.' })
    }

    const order = await Order.findOne({ razorpayOrderId })

    if (!order) {
      logPaymentEvent('info', 'checkout_verify_failed_order_not_found', {
        userId: String(req.user._id),
        razorpayOrderId,
      })
      return res.status(404).json({ message: 'Order not found.' })
    }

    if (order.paymentStatus !== 'paid') {
      await decrementStock(order.items)
      order.paymentStatus = 'paid'
      order.orderStatus = 'confirmed'
      order.razorpayPaymentId = razorpayPaymentId
      order.razorpaySignature = razorpaySignature
      order.statusHistory.push({ label: 'confirmed', note: 'Payment verified from checkout' })
      await order.save()
      logPaymentEvent('info', 'checkout_verify_marked_paid', {
        userId: String(req.user._id),
        orderId: String(order._id),
        razorpayOrderId,
        razorpayPaymentId,
      })
    }

    if (String(order.user) === String(req.user._id)) {
      req.user.cart = []
      await req.user.save()
    }

    res.json({ message: 'Payment verified successfully.', order })
  } catch (error) {
    logPaymentEvent('error', 'checkout_verify_failed', {
      userId: req.user?._id ? String(req.user._id) : '',
      message: error.message,
    })
    next(error)
  }
}

export async function handleWebhook(req, res, next) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      logPaymentEvent('error', 'webhook_failed_missing_secret')
      return res.status(500).json({ message: 'Razorpay webhook secret is missing.' })
    }

    const signature = req.headers['x-razorpay-signature']
    const expectedSignature = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')

    if (signature !== expectedSignature) {
      logPaymentEvent('info', 'webhook_failed_signature_mismatch')
      return res.status(400).json({ message: 'Invalid webhook signature.' })
    }

    const event = req.body

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity
      const order = await Order.findOne({ razorpayOrderId: payment.order_id })

      if (order && order.paymentStatus !== 'paid') {
        await decrementStock(order.items)
        order.paymentStatus = 'paid'
        order.orderStatus = 'confirmed'
        order.razorpayPaymentId = payment.id
        order.webhookVerified = true
        order.statusHistory.push({ label: 'confirmed', note: 'Payment confirmed by webhook' })
        await order.save()
        logPaymentEvent('info', 'webhook_payment_captured_marked_paid', {
          orderId: String(order._id),
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
        })
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      const order = await Order.findOne({ razorpayOrderId: payment.order_id })

      if (order) {
        order.paymentStatus = 'failed'
        order.statusHistory.push({ label: 'failed', note: 'Payment failed webhook received' })
        await order.save()
        logPaymentEvent('info', 'webhook_payment_failed_marked_failed', {
          orderId: String(order._id),
          razorpayOrderId: payment.order_id,
          razorpayPaymentId: payment.id,
        })
      }
    }

    res.json({ received: true })
  } catch (error) {
    logPaymentEvent('error', 'webhook_processing_failed', {
      message: error.message,
    })
    next(error)
  }
}
