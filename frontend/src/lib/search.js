export function getBestSearchMatch(products, rawQuery) {
  const query = rawQuery.trim().toLowerCase()
  if (!query || products.length === 0) {
    return null
  }

  const exact = products.find((product) => (product.name || '').trim().toLowerCase() === query)
  if (exact) {
    return exact
  }

  const startsWith = products.find((product) => (product.name || '').trim().toLowerCase().startsWith(query))
  if (startsWith) {
    return startsWith
  }

  return products[0]
}
