import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { apiRequest } from '../lib/api'
import { useAuth } from './AuthContext'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const refreshCart = async () => {
    if (!user?.id) {
      setItems([])
      return
    }

    setLoading(true)
    try {
      const data = await apiRequest('/users/cart')
      setItems(data.items || [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshCart().catch(() => setItems([]))
  }, [user?.id])

  const addToCart = async (product, variant = {}) => {
    await apiRequest('/users/cart', {
      method: 'POST',
      body: JSON.stringify({
        productId: product._id,
        quantity: 1,
        size: variant.size || '',
      }),
    })
    await refreshCart()
  }

  const updateQuantity = async (productId, quantity, variant = {}) => {
    await apiRequest(`/users/cart/${productId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity, size: variant.size || '' }),
    })
    await refreshCart()
  }

  const removeFromCart = async (productId, variant = {}) => {
    const params = new URLSearchParams()
    if (variant.size) {
      params.set('size', variant.size)
    }
    const query = params.toString()
    await apiRequest(`/users/cart/${productId}${query ? `?${query}` : ''}`, { method: 'DELETE' })
    await refreshCart()
  }

  const clearCart = async () => {
    await apiRequest('/users/cart', { method: 'DELETE' })
    await refreshCart()
  }

  const value = useMemo(() => ({ items, loading, addToCart, updateQuantity, removeFromCart, clearCart, refreshCart }), [items, loading])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
