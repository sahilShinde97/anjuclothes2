import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import { apiRequest } from '../lib/api'

const currencyFormatter = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const createIdempotencyKey = () => `${Date.now()}-${Math.random().toString(36).slice(2, 14)}`

function CheckoutPage() {
  const { user } = useAuth()
  const { items, clearCart } = useCart()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState('online')
  const [loading, setLoading] = useState(false)

  const total = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items])

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })

  const placeOrder = async () => {
    if (!user?.phone || !user?.address) {
      addToast({ title: 'Please add phone and address first.', type: 'error' })
      navigate('/account/address')
      return
    }

    if (items.length === 0) {
      addToast({ title: 'Your cart is empty.', type: 'error' })
      return
    }

    setLoading(true)
    try {
      const idempotencyKey = createIdempotencyKey()
      const data = await apiRequest('/payments/create-order', {
        method: 'POST',
        headers: { 'x-idempotency-key': idempotencyKey },
        body: JSON.stringify({ phone: user.phone, address: user.address, paymentMethod }),
      })

      if (paymentMethod === 'cod') {
        await clearCart()
        addToast({ title: 'COD order placed successfully.' })
        navigate('/order-success?type=cod')
        return
      }

      const loaded = await loadRazorpayScript()
      if (!loaded) throw new Error('Unable to load Razorpay checkout.')

      const options = {
        key: data.razorpayKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: data.razorpayOrder.amount,
        currency: data.razorpayOrder.currency,
        name: 'ANJU CLOTHES',
        description: 'Order payment',
        image: items[0]?.image,
        order_id: data.razorpayOrder.id,
        prefill: { name: user.name, email: user.email, contact: user.phone },
        notes: { address: user.address },
        theme: { color: '#d4a95f' },
        handler: async (response) => {
          try {
            await apiRequest('/payments/verify', {
              method: 'POST',
              body: JSON.stringify({ razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature }),
            })
            await clearCart()
            addToast({ title: 'Payment successful. Order confirmed.' })
            navigate('/order-success?type=payment')
          } catch (error) {
            addToast({ title: error.message, type: 'error' })
          }
        },
      }

      const razorpay = new window.Razorpay(options)
      razorpay.open()
    } catch (error) {
      addToast({ title: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Checkout</p>
        <h1 className="mt-2 font-heading text-4xl text-white">Review and pay</h1>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <div className="rounded-[1.4rem] border border-white/10 bg-[#141416] p-5 shadow-glow">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-gold">Shipping</p>
                <h2 className="mt-1 font-heading text-3xl text-white">Saved address</h2>
              </div>
              <button type="button" onClick={() => navigate('/account/address')} className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5">Edit</button>
            </div>
            <div className="mt-4 text-sm leading-7 text-white/70">
              <p>{user?.name}</p>
              <p>{user?.email}</p>
              <p>{user?.phone || 'Phone missing'}</p>
              <p>{user?.address || 'Address missing'}</p>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-[#141416] p-5 shadow-glow">
            <p className="text-sm uppercase tracking-[0.22em] text-gold">Payment method</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {['online', 'cod'].map((method) => (
                <button key={method} type="button" onClick={() => setPaymentMethod(method)} className={`rounded-full border px-4 py-2 text-sm transition ${paymentMethod === method ? 'border-gold/60 bg-gold/20 text-white' : 'border-white/10 bg-white/5 text-white/70'}`}>
                  {method === 'online' ? 'Online Payment' : 'Cash on Delivery'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-[1.4rem] border border-white/10 bg-[#141416] p-5 shadow-glow">
          <p className="text-sm uppercase tracking-[0.22em] text-gold">Order summary</p>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div key={item.key || `${item.productId}-${item.size}`} className="flex items-center justify-between gap-3 text-sm text-white/70">
                <span>
                  {item.name} x {item.quantity}
                  {item.size ? <span className="block text-xs text-white/45">Size: {item.size}</span> : null}
                </span>
                <span>{currencyFormatter.format(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="flex items-center justify-between text-lg font-semibold text-white">
              <span>Total</span>
              <span>{currencyFormatter.format(total)}</span>
            </div>
          </div>
          <button type="button" onClick={placeOrder} disabled={loading} className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold text-sm font-semibold text-black disabled:opacity-70">
            {loading ? 'Processing...' : paymentMethod === 'cod' ? 'Place COD Order' : 'Pay Now'}
          </button>
        </div>
      </section>
    </main>
  )
}

export default CheckoutPage
