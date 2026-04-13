import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiRequest } from '../lib/api'

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

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

function AccountPage() {
  const { user, refreshProfile } = useAuth()
  const [orders, setOrders] = useState([])

  useEffect(() => {
    refreshProfile().catch(() => {})
    apiRequest('/users/orders').then((data) => setOrders(data.orders || [])).catch(() => setOrders([]))
  }, [])

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Account</p>
        <h1 className="mt-2 font-heading text-4xl text-white">Your profile</h1>
        <div className="mt-4 space-y-2 text-sm text-white/70">
          <p>{user?.name}</p>
          <p>{user?.email}</p>
          <p>{user?.phone || 'Phone not added'}</p>
          <p>{user?.address || 'Address not added'}</p>
        </div>
        <Link to="/account/address" className="mt-5 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-semibold text-black">Edit Address</Link>
      </section>

      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Orders</p>
        <h2 className="mt-2 font-heading text-3xl text-white">Your order history</h2>
        <div className="mt-5 space-y-3">
          {orders.length > 0 ? orders.map((order) => {
            const lastUpdate = order.statusHistory?.[order.statusHistory.length - 1]

            return (
              <Link key={order._id} to={`/account/orders/${order._id}`} className="block rounded-[1.2rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-white">{order.items?.[0]?.name || 'Order'}</p>
                    <p className="mt-1 text-sm text-white/60">{currencyFormatter.format(order.amount)} • {order.paymentMethod.toUpperCase()}</p>
                    <p className="mt-1 text-xs text-white/45">Last update: {lastUpdate ? new Date(lastUpdate.at).toLocaleString() : new Date(order.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${getOrderStatusColor(order.orderStatus)}`}>{order.orderStatus}</span>
                    <span className={`rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] ${getPaymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
                  </div>
                </div>
              </Link>
            )
          }) : <p className="text-sm text-white/60">No orders yet.</p>}
        </div>
      </section>
    </main>
  )
}

export default AccountPage
