import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ImageWithFallback from '../components/ImageWithFallback'
import SkeletonCard from '../components/SkeletonCard'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import usePageMeta from '../hooks/usePageMeta'
import { apiRequest } from '../lib/api'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function ProductPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const { addToast } = useToast()
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      try {
        const data = await apiRequest(`/products/${id}`)
        setProduct(data.product)
        setSelectedImage((data.product.images && data.product.images[0]) || data.product.image || '')
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  usePageMeta({
    title: product ? `${product.name} | ANJU CLOTHES` : 'Product | ANJU CLOTHES',
    description: product ? `${product.name} in ${product.category}${product.subcategory ? ` - ${product.subcategory}` : ''}. Buy directly from ANJU CLOTHES.` : 'ANJU CLOTHES product details page.',
    image: product?.image,
    url: pageUrl,
  })

  const whatsappText = useMemo(() => {
    if (!product) {
      return ''
    }

    return encodeURIComponent(`Hello ANJU CLOTHES, I want to ask about ${product.name}. Product Link: ${pageUrl}`)
  }, [pageUrl, product])

  const handleShare = async () => {
    if (!product) {
      return
    }

    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `Check out ${product.name} on ANJU CLOTHES`, url: pageUrl })
      } else {
        await navigator.clipboard.writeText(pageUrl)
        addToast({ title: 'Product link copied.' })
      }
    } catch {
      addToast({ title: 'Unable to share right now.', type: 'error' })
    }
  }

  const handleAddToCart = () => {
    if (!user) {
      addToast({ title: 'Please login to add items to cart.', type: 'error' })
      navigate('/login')
      return
    }

    addToCart(product)
    addToast({ title: 'Added to cart.' })
  }

  const handleBuyNow = () => {
    if (!user) {
      addToast({ title: 'Please login before checkout.', type: 'error' })
      navigate('/login')
      return
    }

    addToCart(product)
    navigate('/checkout')
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </main>
    )
  }

  if (error || !product) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-8 text-center text-white/70">
          {error || 'Product not found.'}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2 text-sm text-white/55">
        <Link to="/" className="hover:text-gold">Home</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>

      <section className="overflow-hidden rounded-[1.8rem] border border-white/10 bg-[#141416] shadow-glow">
        <div className="grid gap-0 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="p-4 sm:p-5">
            <ImageWithFallback src={selectedImage || (product.images && product.images[0]) || product.image} alt={product.name} className="h-[360px] w-full rounded-[1.3rem] object-cover sm:h-[520px]" />
            {product.images?.length > 1 ? (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {product.images.slice(0, 3).map((imageUrl) => (
                  <button key={imageUrl} type="button" onClick={() => setSelectedImage(imageUrl)} className={`overflow-hidden rounded-xl border ${selectedImage === imageUrl ? 'border-gold/70' : 'border-white/10'}`}>
                    <ImageWithFallback src={imageUrl} alt={product.name} className="h-24 w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">{product.category}</span>
              {product.subcategory ? <span className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">{product.subcategory}</span> : null}
            </div>

            <h1 className="mt-4 max-w-lg font-heading text-4xl leading-none text-white sm:text-5xl">{product.name}</h1>
            <p className="mt-4 text-2xl font-semibold text-gold">{currencyFormatter.format(product.price)}</p>
            <p className="mt-4 max-w-md text-sm leading-7 text-white/65">{product.description || 'Premium product details page built for direct mobile checkout.'}</p>
            <p className={`mt-3 text-sm font-medium ${product.stock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" disabled={product.stock <= 0} onClick={handleBuyNow} className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#e5c17f] disabled:opacity-50">
                Buy Now
              </button>
              <button type="button" disabled={product.stock <= 0} onClick={handleAddToCart} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/5 disabled:opacity-50">
                Add to Cart
              </button>
              <button type="button" onClick={handleShare} className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/5">
                <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7a2.53 2.53 0 0 0 0-1.39l7-4.11A2.99 2.99 0 1 0 14 5a3 3 0 0 0 .04.49l-7 4.11a3 3 0 1 0 0 4.8l7.05 4.14c-.03.15-.05.3-.05.46a3 3 0 1 0 3-2.92Z" /></svg>
                Share
              </button>
            </div>

          </div>
        </div>
      </section>

      <section className="rounded-[1.8rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Need help</p>
            <h2 className="mt-1 font-heading text-3xl text-white">Ask before you buy</h2>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <a href={`https://wa.me/${import.meta.env.VITE_WHATSAPP_NUMBER || '919614510909'}?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#1fa855] px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#17934a]">
            Ask on WhatsApp
          </a>
        </div>
      </section>
    </main>
  )
}

export default ProductPage
