import { Link, useLocation } from 'react-router-dom'

function OrderSuccessPage() {
  const location = useLocation()
  const type = new URLSearchParams(location.search).get('type') || 'order'

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-8 text-center shadow-glow">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Success</p>
        <h1 className="mt-2 font-heading text-4xl text-white">{type === 'payment' ? 'Payment successful' : 'Order placed successfully'}</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">Your order has been placed. You can track it from your account page.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/account" className="rounded-full bg-gold px-5 py-3 text-sm font-semibold text-black">View My Orders</Link>
          <Link to="/" className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5">Continue Shopping</Link>
        </div>
      </section>
    </main>
  )
}

export default OrderSuccessPage
