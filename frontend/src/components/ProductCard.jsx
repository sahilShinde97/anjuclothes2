import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ImageWithFallback from './ImageWithFallback'
import { getWishlistIds, toggleWishlistId } from '../lib/productUx'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function ProductCard({ product }) {
  const discountPercentage = product.discountPercentage || 0
  const originalPrice = product.price || 0
  const discountedPrice = product.finalPrice ?? product.discountedPrice ?? originalPrice
  const defaultImage = (product.images && product.images[0]) || product.image
  const [isWishlisted, setIsWishlisted] = useState(false)

  useEffect(() => {
    setIsWishlisted(getWishlistIds().includes(product._id))
  }, [product._id])

  const handleWishlistToggle = (event) => {
    event.preventDefault()
    event.stopPropagation()
    const state = toggleWishlistId(product._id)
    setIsWishlisted(state.isWishlisted)
  }

  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#141416] shadow-glow transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-gold/50">
      <Link to={`/products/${product._id}`} className="block w-full text-left">
        <div className="relative aspect-[4/5] overflow-hidden">
          <ImageWithFallback loading="lazy" src={defaultImage} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          {discountPercentage > 0 ? <span className="absolute left-3 top-3 rounded-full bg-red-500 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-white">{discountPercentage}% OFF</span> : null}
          <button
            type="button"
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            onClick={handleWishlistToggle}
            className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border transition ${
              isWishlisted ? 'border-red-400/70 bg-red-500/20 text-red-300' : 'border-white/20 bg-black/30 text-white'
            }`}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M12 21.35 10.55 20C5.4 15.36 2 12.28 2 8.5A4.5 4.5 0 0 1 6.5 4a4.88 4.88 0 0 1 3.5 1.63A4.88 4.88 0 0 1 13.5 4 4.5 4.5 0 0 1 18 8.5c0 3.78-3.4 6.86-8.55 11.54Z" />
            </svg>
          </button>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/65">{product.category}</span>
            {product.stock <= 0 ? <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-red-300">Out of Stock</span> : null}
          </div>

          {product.subcategory ? <p className="text-xs uppercase tracking-[0.18em] text-white/45">{product.subcategory}</p> : null}
          <h3 className="font-heading text-[1.1rem] leading-tight text-white sm:text-[1.6rem]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </h3>
          <p className="text-xs text-white/55">
            {(product.ratingAverage || 0).toFixed(1)} ★ ({product.ratingCount || 0} reviews)
          </p>

          <div>
            <p className="text-xl font-semibold text-gold">{currencyFormatter.format(discountedPrice)}</p>
            {discountPercentage > 0 ? <p className="mt-1 text-sm text-white/45 line-through">{currencyFormatter.format(originalPrice)}</p> : null}
          </div>

          {(product.sizes || []).length > 0 ? <p className="text-xs uppercase tracking-[0.16em] text-white/45">Sizes: {product.sizes.join(', ')}</p> : null}

          <span className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-gold px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition group-hover:bg-[#e5c17f]">
            View Details
          </span>
        </div>
      </Link>
    </article>
  )
}

export default ProductCard
