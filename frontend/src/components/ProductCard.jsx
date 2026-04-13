import { Link } from 'react-router-dom'
import ImageWithFallback from './ImageWithFallback'

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

function ProductCard({ product }) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#141416] shadow-glow transition duration-300 hover:-translate-y-1 hover:scale-[1.01] hover:border-gold/50">
      <Link to={`/products/${product._id}`} className="block w-full text-left">
        <div className="aspect-[4/5] overflow-hidden">
          <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-white/65">{product.category}</span>
            {product.stock <= 0 ? <span className="rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-red-300">Out of Stock</span> : null}
          </div>

          {product.subcategory ? <p className="text-xs uppercase tracking-[0.18em] text-white/45">{product.subcategory}</p> : null}

          <h3 className="font-heading text-[1.45rem] leading-tight text-white sm:text-[1.6rem]" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {product.name}
          </h3>

          <p className="text-xl font-semibold text-gold">{currencyFormatter.format(product.price)}</p>

          <span className="inline-flex min-h-[46px] w-full items-center justify-center rounded-full bg-gold px-4 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-black transition group-hover:bg-[#e5c17f]">
            View Details
          </span>
        </div>
      </Link>
    </article>
  )
}

export default ProductCard
