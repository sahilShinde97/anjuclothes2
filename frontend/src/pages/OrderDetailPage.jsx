import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ImageWithFallback from '../components/ImageWithFallback'
import { apiRequest } from '../lib/api'

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const orderSteps = ['placed', 'confirmed', 'packed', 'shipped', 'delivered']

function StepIcon({ step, active }) {
  const baseClass = active ? 'text-black' : 'text-white/45'

  if (step === 'placed') {
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${baseClass}`}>
        <path d="M7 4h10l1 2h3v2H3V6h3l1-2Zm-1 6h12l-1 10H7L6 10Zm4 2v6h2v-6h-2Z" />
      </svg>
    )
  }

  if (step === 'confirmed') {
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${baseClass}`}>
        <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Zm-1 14-4-4 1.41-1.41L11 13.17l5.59-5.58L18 9Z" />
      </svg>
    )
  }

  if (step === 'packed') {
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${baseClass}`}>
        <path d="M12 2 3 7v10l9 5 9-5V7l-9-5Zm0 2.2 6.66 3.7L12 11.6 5.34 7.9 12 4.2Zm-7 5.42 6 3.33v6.85l-6-3.33V9.62Zm8 10.18v-6.85l6-3.33v6.85l-6 3.33Z" />
      </svg>
    )
  }

  if (step === 'shipped') {
    return (
      <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${baseClass}`}>
        <path d="M3 6h11v8h2.5l2.5 3V19a2 2 0 0 1-2 2h-1a3 3 0 1 1-6 0H9a3 3 0 1 1-6 0H2V8a2 2 0 0 1 1-2Zm13 3h3l2 2.5H16V9ZM6 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className={`h-5 w-5 fill-current ${baseClass}`}>
      <path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
    </svg>
  )
}

function getEstimatedDelivery(order) {
  const baseDate = new Date(order.createdAt)
  const deliveryDate = new Date(baseDate)
  deliveryDate.setDate(baseDate.getDate() + 5)

  if (order.orderStatus === 'delivered') {
    return 'Delivered'
  }

  if (order.orderStatus === 'cancelled') {
    return 'Order cancelled'
  }

  return `Estimated delivery by ${deliveryDate.toLocaleDateString()}`
}

function getOrderStatusColor(status) {
  if (status === 'delivered') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (status === 'cancelled') return 'bg-red-500/15 text-red-300 border-red-500/30'
  if (status === 'shipped') return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
  return 'bg-gold/15 text-champagne border-gold/30'
}

function getPaymentStatusColor(status) {
  if (status === 'paid') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (status === 'failed') return 'bg-red-500/15 text-red-300 border-red-500/30'
  return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
}

function OrderDetailPage() {
  const { id } = useParams()
  const [orders, setOrders] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest('/users/orders').then((data) => setOrders(data.orders || [])).catch((requestError) => setError(requestError.message))
  }, [])

  const order = useMemo(() => orders.find((item) => item._id === id), [id, orders])
  const activeStepIndex = order ? orderSteps.indexOf(order.orderStatus) : -1
  const lastUpdate = order?.statusHistory?.[order.statusHistory.length - 1]

  if (error) {
    return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><div className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-8 text-white/70">{error}</div></main>
  }

  if (!order) {
    return <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6"><div className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-8 text-white/70">Loading order...</div></main>
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex items-center gap-2 text-sm text-white/55">
        <Link to="/account" className="hover:text-gold">Account</Link>
        <span>/</span>
        <span>Order #{order._id.slice(-6)}</span>
      </div>

      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Order details</p>
            <h1 className="mt-2 font-heading text-4xl text-white">Track your order</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${getOrderStatusColor(order.orderStatus)}`}>{order.orderStatus}</span>
            <span className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-white/60">Last update: {lastUpdate ? new Date(lastUpdate.at).toLocaleString() : new Date(order.createdAt).toLocaleString()}</p>
        <p className="mt-2 text-sm font-medium text-gold">{getEstimatedDelivery(order)}</p>
      </section>

      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-gold">Order progress</p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-5">
          {orderSteps.map((step, index) => {
            const isActive = activeStepIndex >= index && order.orderStatus !== 'cancelled'
            return (
              <div key={step} className="relative flex items-center gap-4 sm:flex-col sm:items-start">
                <div className={`relative flex h-12 w-12 items-center justify-center rounded-full border text-sm font-semibold ${isActive ? 'border-gold bg-gold text-black' : 'border-white/10 bg-white/5 text-white/45'}`}>
                  <StepIcon step={step} active={isActive} />
                  {index < orderSteps.length - 1 ? <span className={`absolute left-full top-1/2 hidden h-[2px] w-16 -translate-y-1/2 sm:block ${activeStepIndex > index ? 'bg-gold' : 'bg-white/10'}`} /> : null}
                </div>
                <div>
                  <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${isActive ? 'text-white' : 'text-white/45'}`}>{step}</p>
                  <p className="mt-1 text-xs text-white/45">{step === 'placed' ? 'Order created' : step === 'confirmed' ? 'Payment or COD confirmed' : step === 'packed' ? 'Ready for shipment' : step === 'shipped' ? 'On the way' : 'Reached you'}</p>
                </div>
              </div>
            )
          })}
        </div>
        {order.orderStatus === 'delivered' ? <p className="mt-4 text-sm text-emerald-300">Delivered successfully.</p> : null}
        {order.orderStatus === 'cancelled' ? <p className="mt-4 text-sm text-red-300">This order was cancelled.</p> : null}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-gold">Items</p>
          <div className="mt-5 space-y-3">
            {order.items.map((item, index) => (
              <div key={`${item.name}-${index}`} className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
                <ImageWithFallback src={item.image} alt={item.name} className="h-16 w-16 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="mt-1 text-sm text-white/60">Qty: {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold text-gold">{currencyFormatter.format(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
          <p className="text-sm uppercase tracking-[0.22em] text-gold">Summary</p>
          <div className="mt-4 space-y-2 text-sm text-white/70">
            <p>Name: {order.customerName}</p>
            <p>Email: {order.email}</p>
            <p>Phone: {order.phone}</p>
            <p>Payment Method: {order.paymentMethod.toUpperCase()}</p>
            <p>Amount: {currencyFormatter.format(order.amount)}</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default OrderDetailPage
