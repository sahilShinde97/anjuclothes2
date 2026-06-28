import Product from '../models/Product.js'

const CATEGORY_CACHE_TTL_MS = 5 * 60 * 1000
let categoryCache = {
  categories: null,
  subcategoriesByCategory: new Map(),
  expiresAt: 0,
}

function isCategoryCacheValid() {
  return categoryCache.categories && Date.now() < categoryCache.expiresAt
}

export async function getCachedCategories() {
  if (isCategoryCacheValid()) {
    return categoryCache.categories
  }

  const categories = (await Product.distinct('category')).filter((name) => name !== 'Saree')
  categoryCache = {
    categories: ['All', ...categories.sort()],
    subcategoriesByCategory: new Map(),
    expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
  }

  return categoryCache.categories
}

export async function getCachedSubcategories(category) {
  if (!category || category === 'All') {
    return ['All']
  }

  if (isCategoryCacheValid() && categoryCache.subcategoriesByCategory.has(category)) {
    return categoryCache.subcategoriesByCategory.get(category)
  }

  await getCachedCategories()
  const subcategories = await Product.distinct('subcategory', { category })
  const normalized = ['All', ...subcategories.filter(Boolean).sort()]
  categoryCache.subcategoriesByCategory.set(category, normalized)
  return normalized
}

export function invalidateCategoryCache() {
  categoryCache = {
    categories: null,
    subcategoriesByCategory: new Map(),
    expiresAt: 0,
  }
}
