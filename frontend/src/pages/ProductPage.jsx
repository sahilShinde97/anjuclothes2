import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import ImageWithFallback from '../components/ImageWithFallback'
import SkeletonCard from '../components/SkeletonCard'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useToast } from '../context/ToastContext'
import usePageMeta from '../hooks/usePageMeta'
import { apiRequest } from '../lib/api'
import { addRecentlyViewedProduct, getRecentlyViewedProducts } from '../lib/productUx'

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
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [selectedSize, setSelectedSize] = useState('')
  const [groupProducts, setGroupProducts] = useState([])
  const [relatedProducts, setRelatedProducts] = useState([])
  const [recentlyViewed, setRecentlyViewed] = useState([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadProduct = async () => {
      setLoading(true)
      try {
        const data = await apiRequest(`/products/${id}`)
        setProduct(data.product)
        setSelectedImageIndex(0)
        setSelectedSize(data.product.sizes?.[0] || '')
        addRecentlyViewedProduct(data.product)
        setRecentlyViewed(getRecentlyViewedProducts().filter((item) => item._id !== data.product._id))

        if (data.product.groupId) {
          const groupData = await apiRequest(`/products?groupId=${encodeURIComponent(data.product.groupId)}&limit=30&page=1`)
          setGroupProducts((groupData.products || []).filter((item) => item._id !== data.product._id))
        } else {
          setGroupProducts([])
        }

        if (data.product.category) {
          const relatedData = await apiRequest(`/products?category=${encodeURIComponent(data.product.category)}&limit=12&page=1`)
          setRelatedProducts((relatedData.products || []).filter((item) => item._id !== data.product._id))
        } else {
          setRelatedProducts([])
        }
      } catch (requestError) {
        setError(requestError.message)
      } finally {
        setLoading(false)
      }
    }

    loadProduct()
  }, [id])

  const pageUrl = typeof window !== 'undefined' ? window.location.href : ''
  const activeImages = useMemo(() => {
    if (Array.isArray(product?.images) && product.images.length > 0) {
      return product.images
    }
    return product?.image ? [product.image] : []
  }, [product])
  const colorOptions = useMemo(() => {
    if (!product) {
      return []
    }
    const current = {
      _id: product._id,
      colorName: product.colorName || 'Default',
      colorHex: product.colorHex || '',
      image: product.images?.[0] || product.image || '',
    }
    return [current, ...groupProducts].filter((item, index, arr) => arr.findIndex((x) => x._id === item._id) === index)
  }, [groupProducts, product])
  const selectedImage = activeImages[selectedImageIndex] || activeImages[0] || product?.image || ''
  const hasProductImages = activeImages.length > 0 || Boolean(product?.image)
  const activeStock = product?.stock || 0
  const discountPercentage = product?.discountPercentage || 0
  const discountedPrice = product?.finalPrice ?? product?.discountedPrice ?? product?.price ?? 0
  const hasSizes = (product?.sizes || []).length > 0
  const hasSelectedSize = !hasSizes || Boolean(selectedSize)
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

  useEffect(() => {
    setSelectedImageIndex(0)
  }, [id])

  const handleAddToCart = async () => {
    if (!user) {
      addToast({ title: 'Please login to add items to cart.', type: 'error' })
      navigate('/login')
      return
    }
    if (!hasSelectedSize) {
      addToast({ title: 'Please select a size.', type: 'error' })
      return
    }

    try {
      await addToCart(product, {
        size: selectedSize,
      })
      addToast({ title: 'Added to cart.' })
    } catch (requestError) {
      addToast({ title: requestError.message || 'Unable to add item.', type: 'error' })
    }
  }

  const handleBuyNow = async () => {
    if (!user) {
      addToast({ title: 'Please login before checkout.', type: 'error' })
      navigate('/login')
      return
    }
    if (!hasSelectedSize) {
      addToast({ title: 'Please select a size.', type: 'error' })
      return
    }

    try {
      await addToCart(product, {
        size: selectedSize,
      })
      navigate('/checkout')
    } catch (requestError) {
      addToast({ title: requestError.message || 'Unable to continue checkout.', type: 'error' })
    }
  }

  const handleReviewSubmit = async (event) => {
    event.preventDefault()
    if (!user) {
      addToast({ title: 'Please login to submit a review.', type: 'error' })
      navigate('/login')
      return
    }
    setSubmittingReview(true)
    try {
      const data = await apiRequest(`/products/${id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment }),
      })
      setProduct(data.product)
      setReviewComment('')
      addToast({ title: 'Review submitted successfully.' })
    } catch (requestError) {
      addToast({ title: requestError.message || 'Unable to submit review.', type: 'error' })
    } finally {
      setSubmittingReview(false)
    }
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
            {hasProductImages ? (
              <div className="overflow-hidden rounded-[1.3rem] bg-white/5">
                <ImageWithFallback
                  key={selectedImage || activeImages[0] || product.image}
                  loading="eager"
                  fetchPriority="high"
                  src={selectedImage}
                  alt={product.name}
                  className="h-[320px] w-full object-cover transition-opacity duration-300 sm:h-[520px]"
                />
              </div>
            ) : (
              <div className="flex h-[320px] w-full items-center justify-center rounded-[1.3rem] bg-white/5 text-xs uppercase tracking-[0.18em] text-white/50 sm:h-[520px]">
                No Image
              </div>
            )}
            {activeImages?.length > 1 ? (
              <div className="mt-3 grid grid-cols-3 gap-3">
                {activeImages.map((imageUrl, imageIndex) => (
                  <button
                    key={`${imageUrl}-${imageIndex}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(imageIndex)}
                    className={`overflow-hidden rounded-xl border transition ${selectedImageIndex === imageIndex ? 'border-gold/70' : 'border-white/10'}`}
                  >
                    <ImageWithFallback loading="lazy" src={imageUrl} alt={product.name} className="h-24 w-full object-cover" />
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
            {colorOptions.length > 1 ? (
              <div className="mt-4">
                <p className="text-sm text-white/70">Selected Color: <span className="font-semibold text-white">{product.colorName || 'Default'}</span></p>
                <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
                  {colorOptions.map((item) => {
                    const isActive = item._id === product._id
                    return (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => navigate(`/products/${item._id}`)}
                        className={`relative inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border transition ${
                          isActive ? 'border-gold ring-2 ring-gold/40' : 'border-white/20 hover:border-white/50'
                        }`}
                        title={item.colorName || 'Color option'}
                      >
                        {item.colorHex ? <span className="h-full w-full" style={{ backgroundColor: item.colorHex }} /> : <ImageWithFallback src={item.image} alt={item.colorName || 'Color'} className="h-full w-full object-cover" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
            <div className="mt-4">
              <p className="text-2xl font-semibold text-gold">{currencyFormatter.format(discountedPrice)}</p>
              {discountPercentage > 0 ? <p className="mt-1 text-sm text-white/45 line-through">{currencyFormatter.format(product.price)}</p> : null}
            </div>
            {discountPercentage > 0 ? <p className="mt-2 inline-flex rounded-full bg-red-500 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white">{discountPercentage}% OFF</p> : null}
            <p className="mt-4 max-w-md text-sm leading-7 text-white/65">{product.description || 'Premium product details page built for direct mobile checkout.'}</p>
            <p className={`mt-3 text-sm font-medium ${activeStock > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {activeStock > 0 ? `${activeStock} in stock` : 'Out of stock'}
            </p>
            {(product.sizes || []).length > 0 ? (
              <div className="mt-4">
                <p className="text-sm font-medium text-white/75">Select Size</p>
                <div className="mt-2 flex flex-wrap items-center gap-2.5">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      disabled={activeStock <= 0}
                      className={`min-h-[42px] min-w-[52px] rounded-full border px-4 text-xs font-semibold uppercase tracking-[0.18em] transition ${
                        activeStock <= 0
                          ? 'cursor-not-allowed border-white/10 bg-white/5 text-white/30'
                          : selectedSize === size
                            ? 'border-gold bg-gold/20 text-white'
                            : 'border-white/20 text-white/75 hover:border-white/40 hover:bg-white/5'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" disabled={activeStock <= 0} onClick={handleBuyNow} className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#e5c17f] disabled:opacity-50">
                Buy Now
              </button>
              <button type="button" disabled={activeStock <= 0} onClick={handleAddToCart} className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/10 px-5 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-white/5 disabled:opacity-50">
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
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-gold">Ratings & Reviews</p>
            <h2 className="mt-1 font-heading text-3xl text-white">
              {(product.ratingAverage || 0).toFixed(1)} ★ <span className="text-base text-white/60">({product.ratingCount || 0} reviews)</span>
            </h2>
          </div>
        </div>
        <form onSubmit={handleReviewSubmit} className="mt-4 grid gap-3">
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewRating(star)}
                className={`rounded-full border px-3 py-1.5 text-sm ${reviewRating >= star ? 'border-gold bg-gold/20 text-gold' : 'border-white/10 text-white/60'}`}
              >
                {star} ★
              </button>
            ))}
          </div>
          <textarea
            value={reviewComment}
            onChange={(event) => setReviewComment(event.target.value)}
            rows={3}
            placeholder="Write your review (optional)"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none"
          />
          <button type="submit" disabled={submittingReview} className="inline-flex min-h-[44px] w-fit items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-black disabled:opacity-70">
            {submittingReview ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </section>

      {relatedProducts.length > 0 ? (
        <section className="rounded-[1.8rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Related Products</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.slice(0, 8).map((item) => (
              <Link key={item._id} to={`/products/${item._id}`} className="group rounded-xl border border-white/10 bg-white/5 p-2">
                <ImageWithFallback src={item.images?.[0] || item.image} alt={item.name} className="h-28 w-full rounded-lg object-cover" />
                <p className="mt-2 text-xs text-white/80">{item.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {recentlyViewed.length > 0 ? (
        <section className="rounded-[1.8rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-gold">Recently Viewed</p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {recentlyViewed.slice(0, 8).map((item) => (
              <Link key={item._id} to={`/products/${item._id}`} className="group rounded-xl border border-white/10 bg-white/5 p-2">
                <ImageWithFallback src={item.image} alt={item.name} className="h-28 w-full rounded-lg object-cover" />
                <p className="mt-2 text-xs text-white/80">{item.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

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
