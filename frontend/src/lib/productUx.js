const WISHLIST_KEY = 'anju-wishlist'
const RECENTLY_VIEWED_KEY = 'anju-recently-viewed'

function readJson(key, fallback) {
  if (typeof window === 'undefined') {
    return fallback
  }
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) {
      return fallback
    }
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function writeJson(key, value) {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function getWishlistIds() {
  return readJson(WISHLIST_KEY, [])
}

export function toggleWishlistId(productId) {
  const current = getWishlistIds()
  const exists = current.includes(productId)
  const next = exists ? current.filter((id) => id !== productId) : [productId, ...current].slice(0, 100)
  writeJson(WISHLIST_KEY, next)
  return { next, isWishlisted: !exists }
}

export function addRecentlyViewedProduct(product) {
  if (!product?._id) {
    return
  }
  const current = readJson(RECENTLY_VIEWED_KEY, [])
  const compact = current.filter((item) => item?._id !== product._id)
  const next = [
    {
      _id: product._id,
      name: product.name,
      image: product.images?.[0] || product.image || '',
      price: product.price,
      discountPercentage: product.discountPercentage || 0,
      finalPrice: product.finalPrice ?? product.discountedPrice ?? product.price,
      category: product.category || '',
      subcategory: product.subcategory || '',
      stock: product.stock || 0,
      ratingAverage: product.ratingAverage || 0,
      ratingCount: product.ratingCount || 0,
    },
    ...compact,
  ].slice(0, 8)
  writeJson(RECENTLY_VIEWED_KEY, next)
}

export function getRecentlyViewedProducts() {
  return readJson(RECENTLY_VIEWED_KEY, [])
}
