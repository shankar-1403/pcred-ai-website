import { useEffect, useState } from 'react'
import { CartContext } from '../lib/cart'

const STORAGE_KEY = 'pcred-cart'

// Storage can be unavailable (private mode, blocked site data), so the cart falls back to memory
function loadItems() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function CartProvider({ children }) {
  const [items, setItems] = useState(loadItems)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Cart still works for this visit without persistence
    }
  }, [items])

  const has = (id) => items.some((item) => item.id === id)
  const add = (item) => setItems((current) => (current.some((entry) => entry.id === item.id) ? current : [...current, item]))
  const remove = (id) => setItems((current) => current.filter((item) => item.id !== id))
  const toggle = (item) => (has(item.id) ? remove(item.id) : add(item))
  const clear = () => setItems([])
  const total = items.reduce((sum, item) => sum + item.price, 0)

  const value = {
    items,
    total,
    count: items.length,
    has,
    add,
    remove,
    toggle,
    clear,
    isOpen,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export default CartProvider
