import { createContext, useContext } from 'react'
import { whatsappHref } from './whatsapp'

export const CartContext = createContext(null)

export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart must be used inside CartProvider')
  return cart
}

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export function formatPrice(amount) {
  return rupees.format(amount)
}

export function cartItemId(suitSlug, productName) {
  return `${suitSlug}/${productName}`
}

export function checkoutHref(items, total) {
  const lines = items.map((item, index) => `${index + 1}. ${item.name} (${item.suitName}) - ${formatPrice(item.price)}`)
  return whatsappHref(
    ['Hello, I would like to order these products:', ...lines, `Total: ${formatPrice(total)}`, 'Please share the next steps.'].join('\n'),
  )
}
