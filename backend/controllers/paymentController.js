import crypto from 'crypto'
import Razorpay from 'razorpay'
import Order from '../models/Order.js'
import Product from '../models/Product.js'

function getRazorpayInstance() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay is not configured.')
  }

  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

function buildOrderItems(user) {
  return user.cart
    .filter((item) => item.product)
    .map((item) => ({
      product: item.product._id,
      name: item.product.name,
      image: (item.product.images && item.product.images[0]) || item.product.image || '',
      price: item.product.price,
      quantity: item.quantity,
    }))
}

async function validateStock(items) {
  for (const item of items) {
    const product = await Product.findById(item.product)
    if (!product) {
      throw new Error(`Product ${item.name} not found.`)
    }
    if (product.stock < item.quantity) {
      throw new Error(`${product.name} is out of stock or has limited quantity.`)
    }
  }
}

async function decrementStock(items) {
  for (const item of items) {
    await Product.findByIdAndUpdate(item.product, { $inc: { stock: -item.quantity } })
  }
}

export async function createCheckoutOrder(req, res, next) {
  try {
    const { phone, address, paymentMethod } = req.body
    await req.user.populate('cart.product')

    const items = buildOrderItems(req.user)

    if (items.length === 0) {
      return res.status(400).json({ message: 'Your cart is empty.' })
    }

    await validateStock(items)

    const safePaymentMethod = paymentMethod === 'cod' ? 'cod' : 'online'
    const contactPhone = phone?.trim() || req.user.phone
    const shippingAddress = address?.trim() || req.user.address

    if (!contactPhone || !shippingAddress) {
      return res.status(400).json({ message: 'Phone and address are required.' })
    }

    const amount = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
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
        statusHistory: [{ label: 'placed', note: 'COD order placed' }],
      })

      req.user.cart = []
      await req.user.save()

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
      statusHistory: [{ label: 'placed', note: 'Online order created' }],
    })

    res.status(201).json({
      order,
      razorpayOrder,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    })
  } catch (error) {
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
      return res.status(400).json({ message: 'Payment verification failed.' })
    }

    const order = await Order.findOne({ razorpayOrderId })

    if (!order) {
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
    }

    if (String(order.user) === String(req.user._id)) {
      req.user.cart = []
      await req.user.save()
    }

    res.json({ message: 'Payment verified successfully.', order })
  } catch (error) {
    next(error)
  }
}

export async function handleWebhook(req, res, next) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET
    if (!secret) {
      return res.status(500).json({ message: 'Razorpay webhook secret is missing.' })
    }

    const signature = req.headers['x-razorpay-signature']
    const expectedSignature = crypto.createHmac('sha256', secret).update(req.rawBody).digest('hex')

    if (signature !== expectedSignature) {
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
      }
    }

    if (event.event === 'payment.failed') {
      const payment = event.payload.payment.entity
      const order = await Order.findOne({ razorpayOrderId: payment.order_id })

      if (order) {
        order.paymentStatus = 'failed'
        order.statusHistory.push({ label: 'failed', note: 'Payment failed webhook received' })
        await order.save()
      }
    }

    res.json({ received: true })
  } catch (error) {
    next(error)
  }
}
