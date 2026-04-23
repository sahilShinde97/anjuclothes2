const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

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

export { API_BASE_URL }

export async function apiRequest(path, options = {}) {
  const token = getToken()
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message = data.message || 'Something went wrong.'
    const isAuthError =
      response.status === 401 &&
      ['Token is invalid.', 'Not authorized.', 'User not found.'].includes(message)

    if (isAuthError) {
      clearToken()
      window.localStorage.removeItem('anju-user')
      window.dispatchEvent(new Event('anju-auth-expired'))
      throw new Error('Session expired. Please login again.')
    }

    throw new Error(message)
  }

  return data
}
