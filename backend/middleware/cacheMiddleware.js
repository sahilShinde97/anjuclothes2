const cache = new Map()
const DEFAULT_TTL_MS = 60 * 1000

export function clearApiCache(prefix = '') {
  if (!prefix) {
    cache.clear()
    return
  }

  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key)
    }
  }
}

export function cacheResponse(ttlSeconds = 60) {
  const ttlMs = Math.max(ttlSeconds, 1) * 1000

  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next()
    }

    const cacheKey = req.originalUrl || req.url
    const hit = cache.get(cacheKey)

    if (hit && Date.now() < hit.expiresAt) {
      res.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=120`)
      res.set('X-Cache', 'HIT')
      return res.json(hit.body)
    }

    const originalJson = res.json.bind(res)

    res.json = (body) => {
      cache.set(cacheKey, {
        body,
        expiresAt: Date.now() + ttlMs,
      })
      res.set('Cache-Control', `public, max-age=${ttlSeconds}, stale-while-revalidate=120`)
      res.set('X-Cache', 'MISS')
      return originalJson(body)
    }

    return next()
  }
}

export function invalidateCacheAfterMutation(prefixes = []) {
  return (_req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        prefixes.forEach((prefix) => clearApiCache(prefix))
      }
    })
    next()
  }
}

export { DEFAULT_TTL_MS }
