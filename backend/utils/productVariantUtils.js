export function getSafeDiscountPercentage(value) {
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    return 0
  }
  return Math.max(0, Math.min(Math.round(numericValue), 90))
}

export function getEffectiveProductImages(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images.filter(Boolean).slice(0, 5)
  }

  if (product?.image) {
    return [product.image]
  }

  return []
}

export function getDiscountedPrice(product) {
  const basePrice = Math.max(Number(product?.price) || 0, 0)
  const discountPercentage = getSafeDiscountPercentage(product?.discountPercentage)
  const discountedPrice = basePrice - (basePrice * discountPercentage) / 100
  return Math.max(Math.round(discountedPrice), 0)
}

export function attachProductPricing(product) {
  const price = Math.max(Number(product?.price) || 0, 0)
  const discountPercentage = getSafeDiscountPercentage(product?.discountPercentage)
  const discountedPrice = getDiscountedPrice({ price, discountPercentage })
  return {
    ...product,
    price,
    discountPercentage,
    discountedPrice,
    finalPrice: discountedPrice,
  }
}
