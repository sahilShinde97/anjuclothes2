const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const responseCache = new Map()
const CACHE_TTL_MS = {
  '/banners': 5 * 60 * 1000,
  '/products': 60 * 1000,
}

const NO_CACHE_PREFIXES = ['/users', '/auth', '/admin', '/payments', '/uploads']

function getCacheKey(path) {
  return path.startsWith('/') ? path : `/${path}`
}

function getCacheTtl(path) {
  if (path.startsWith('/products/') && !path.includes('?')) {
    return 2 * 60 * 1000
  }

  const basePath = path.split('?')[0]
  if (basePath === '/products') {
    return CACHE_TTL_MS['/products']
  }
  if (basePath === '/banners') {
    return CACHE_TTL_MS['/banners']
  }
  return 0
}

function shouldUseCache(path, method) {
  if (method && method !== 'GET') {
    return false
  }

  const normalizedPath = getCacheKey(path)
  if (NO_CACHE_PREFIXES.some((prefix) => normalizedPath.startsWith(prefix))) {
    return false
  }

  return getCacheTtl(normalizedPath) > 0
}

export function getToken() {
  const token = window.localStorage.getItem('anju-token')
  if (!token || token === 'undefined' || token === 'null') {
    return ''
  }
  return token
}

export function setToken(token) {
  if (!token || typeof token !== 'string') {
    window.localStorage.removeItem('anju-token')
    return
  }
  window.localStorage.setItem('anju-token', token)
}

export function clearToken() {
  window.localStorage.removeItem('anju-token')
}

export function clearApiCache() {
  responseCache.clear()
}

export { API_BASE_URL }

export async function apiRequest(path, options = {}) {
  const normalizedPath = getCacheKey(path)
  const method = (options.method || 'GET').toUpperCase()
  const cacheTtl = getCacheTtl(normalizedPath)

  if (shouldUseCache(normalizedPath, method)) {
    const cached = responseCache.get(normalizedPath)
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data
    }
  }

  const token = getToken()
  const timeoutMs = options.timeoutMs ?? 15000
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response
  try {
    response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
      ...options,
      method,
      headers,
      signal: controller.signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check your internet and try again.')
    }
    throw new Error('Network error. Please check your internet connection.')
  } finally {
    window.clearTimeout(timeoutId)
  }

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data.message || 'Something went wrong.'
    const isAuthError =
      response.status === 401 &&
      ['Token is invalid.', 'Not authorized.', 'User not found.'].includes(message)

    if (isAuthError) {
      clearToken()
      window.localStorage.removeItem('anju-user')
      clearApiCache()
      window.dispatchEvent(new Event('anju-auth-expired'))
      throw new Error('Session expired. Please login again.')
    }

    throw new Error(message)
  }

  if (cacheTtl > 0 && method === 'GET') {
    responseCache.set(normalizedPath, {
      data,
      expiresAt: Date.now() + cacheTtl,
    })
  }

  return data
}

export function preloadImage(src) {
  if (!src || typeof window === 'undefined') {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve()
    image.onerror = () => resolve()
    image.src = src
  })
}
