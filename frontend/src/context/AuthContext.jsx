import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { apiRequest, clearToken, getToken, setToken } from '../lib/api'

const AuthContext = createContext(null)
const ADMIN_IDLE_LIMIT = 1000 * 60 * 30

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const activityTimeoutRef = useRef(null)

  const logout = () => {
    clearToken()
    window.localStorage.removeItem('anju-user')
    setUser(null)
  }

  useEffect(() => {
    const storedUser = window.localStorage.getItem('anju-user')
    const token = getToken()

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        clearToken()
        window.localStorage.removeItem('anju-user')
      }
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') {
      if (activityTimeoutRef.current) {
        window.clearTimeout(activityTimeoutRef.current)
      }
      return undefined
    }

    const resetActivityTimer = () => {
      if (activityTimeoutRef.current) {
        window.clearTimeout(activityTimeoutRef.current)
      }
      activityTimeoutRef.current = window.setTimeout(() => logout(), ADMIN_IDLE_LIMIT)
    }

    const events = ['click', 'keydown', 'mousemove', 'touchstart', 'scroll']
    events.forEach((eventName) => window.addEventListener(eventName, resetActivityTimer))
    resetActivityTimer()

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, resetActivityTimer))
      if (activityTimeoutRef.current) {
        window.clearTimeout(activityTimeoutRef.current)
      }
    }
  }, [user])

  const saveAuth = (payload) => {
    setToken(payload.token)
    window.localStorage.setItem('anju-user', JSON.stringify(payload.user))
    setUser(payload.user)
  }

  const register = async (values) => {
    const data = await apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(values) })
    saveAuth(data)
  }

  const login = async (values) => {
    const data = await apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(values) })
    saveAuth(data)
  }

  const refreshProfile = async () => {
    const data = await apiRequest('/users/profile')
    window.localStorage.setItem('anju-user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const updateProfile = async (values) => {
    const data = await apiRequest('/users/profile', { method: 'PUT', body: JSON.stringify(values) })
    window.localStorage.setItem('anju-user', JSON.stringify(data.user))
    setUser(data.user)
    return data.user
  }

  const forgotPassword = async (email) => apiRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })
  const resetPassword = async (token, password) => apiRequest(`/auth/reset-password/${token}`, { method: 'POST', body: JSON.stringify({ password }) })

  const value = useMemo(
    () => ({ user, loading, register, login, logout, forgotPassword, resetPassword, refreshProfile, updateProfile }),
    [loading, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
