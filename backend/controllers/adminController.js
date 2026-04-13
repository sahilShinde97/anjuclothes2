import Banner from '../models/Banner.js'
import Order from '../models/Order.js'
import Product from '../models/Product.js'

export async function getAdminSummary(_req, res, next) {
  try {
    const [totalProducts, totalBanners, totalOrders, pendingOrders, deliveredOrders, categoryBreakdown, undergarmentBreakdown] = await Promise.all([
      Product.countDocuments(),
      Banner.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ orderStatus: { $in: ['placed', 'confirmed', 'packed', 'shipped'] } }),
      Order.countDocuments({ orderStatus: 'delivered' }),
      Product.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
      Product.aggregate([
        { $match: { category: 'Undergarments' } },
        { $group: { _id: '$subcategory', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
    ])

    res.json({
      summary: {
        totalProducts,
        totalBanners,
        totalOrders,
        pendingOrders,
        deliveredOrders,
        categoryBreakdown,
        undergarmentBreakdown,
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getAdminOrders(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1)
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50)
    const orders = await Order.find()
      .populate('product', 'name images image category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    const total = await Order.countDocuments()

    res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(Math.ceil(total / limit), 1),
      },
    })
  } catch (error) {
    next(error)
  }
}

export async function getAdminOrderDetail(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)
      .populate('product', 'name images image category subcategory description stock')
      .populate('items.product', 'name images image category subcategory description stock')
      .populate('user', 'name email phone address')

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    res.json({ order })
  } catch (error) {
    next(error)
  }
}

export async function updateAdminOrder(req, res, next) {
  try {
    const { orderStatus, paymentStatus, note } = req.body
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        ...(orderStatus ? { orderStatus } : {}),
        ...(paymentStatus ? { paymentStatus } : {}),
      },
      { new: true, runValidators: true },
    ).populate('product', 'name images image category')

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    if (orderStatus || paymentStatus) {
      order.statusHistory.push({ label: orderStatus || paymentStatus, note: note || 'Updated from admin panel' })
      await order.save()
    }

    res.json({ order })
  } catch (error) {
    next(error)
  }
}

export async function deleteAdminOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: 'Order not found.' })
    }

    if (!['delivered', 'cancelled'].includes(order.orderStatus)) {
      return res.status(400).json({ message: 'Only delivered or cancelled orders can be deleted.' })
    }

    await Order.findByIdAndDelete(req.params.id)
    res.json({ message: 'Order deleted successfully.' })
  } catch (error) {
    next(error)
  }
}
