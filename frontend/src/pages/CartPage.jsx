import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

function CartPage() {
  const { items, updateQuantity, removeFromCart } = useCart()
  const navigate = useNavigate()
  const { addToast } = useToast()
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Cart</p>
        <h1 className="mt-2 font-heading text-4xl text-white">Your shopping bag</h1>
      </section>

      {items.length === 0 ? (
        <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-8 text-center text-white/70">
          <p>Your cart is empty.</p>
          <Link to="/" className="mt-4 inline-flex rounded-full bg-gold px-5 py-3 text-sm font-semibold text-black">Continue Shopping</Link>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.key || `${item.productId}-${item.size}`} className="flex items-center gap-3 rounded-[1.2rem] border border-white/10 bg-[#141416] p-4">
                <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-white">{item.name}</p>
                  {item.size ? <p className="mt-1 text-xs text-white/55">Size: {item.size}</p> : null}
                  <div className="mt-1">
                    <p className="text-sm text-gold">{currencyFormatter.format(item.finalPrice ?? item.price)}</p>
                    {(item.discountPercentage || 0) > 0 ? <p className="text-xs text-white/45 line-through">{currencyFormatter.format(item.originalPrice)}</p> : null}
                    {(item.discountPercentage || 0) > 0 ? <p className="text-xs text-red-300">{item.discountPercentage}% OFF</p> : null}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity - 1, { size: item.size })} className="h-8 w-8 rounded-full border border-white/10">-</button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button type="button" onClick={() => updateQuantity(item.productId, item.quantity + 1, { size: item.size })} className="h-8 w-8 rounded-full border border-white/10">+</button>
                    <button type="button" onClick={() => { removeFromCart(item.productId, { size: item.size }); addToast({ title: 'Removed from cart.' }) }} className="ml-3 text-sm text-red-400">Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-[#141416] p-5 shadow-glow">
            <p className="text-sm uppercase tracking-[0.22em] text-gold">Summary</p>
            <p className="mt-4 text-sm text-white/60">Items: {items.length}</p>
            <p className="mt-2 text-2xl font-semibold text-white">{currencyFormatter.format(total)}</p>
            <div className="mt-5 space-y-3">
              <button type="button" onClick={() => navigate('/account/address')} className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full border border-white/10 text-sm font-semibold text-white hover:bg-white/5">Manage Address</button>
              <button type="button" onClick={() => navigate('/checkout')} className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold text-sm font-semibold text-black">Proceed to Checkout</button>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}

export default CartPage
