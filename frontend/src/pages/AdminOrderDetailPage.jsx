import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ImageWithFallback from '../components/ImageWithFallback'
import { apiRequest } from '../lib/api'

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

function AdminOrderDetailPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiRequest(`/admin/orders/${id}`).then((data) => setOrder(data.order)).catch((requestError) => setError(requestError.message))
  }, [id])

  if (error) {
    return <div className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-8 text-white/70">{error}</div>
  }

  if (!order) {
    return <div className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-8 text-white/70">Loading order...</div>
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Order details</p>
            <h1 className="mt-2 font-heading text-4xl text-white">Order #{order._id.slice(-6)}</h1>
          </div>
          <Link to="/admin/orders" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Back</Link>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4 rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
          <h2 className="font-heading text-3xl text-white">Items</h2>
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

        <div className="space-y-4 rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Customer</p>
            <p className="mt-2 font-semibold text-white">{order.customerName}</p>
            <p className="mt-1 text-sm text-white/60">{order.email}</p>
            <p className="mt-1 text-sm text-white/60">{order.phone}</p>
            <p className="mt-1 text-sm text-white/60">{order.address}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">Payment</p>
            <p className="mt-2 text-sm text-white/70">Method: {order.paymentMethod}</p>
            <p className="mt-1 text-sm text-white/70">Payment Status: {order.paymentStatus}</p>
            <p className="mt-1 text-sm text-white/70">Order Status: {order.orderStatus}</p>
            <p className="mt-1 text-sm text-white/70">Amount: {currencyFormatter.format(order.amount)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">History</p>
            <div className="mt-3 space-y-2">
              {(order.statusHistory || []).map((entry, index) => (
                <div key={`${entry.label}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white/65">
                  <p className="font-semibold text-white">{entry.label}</p>
                  <p className="mt-1">{entry.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default AdminOrderDetailPage
