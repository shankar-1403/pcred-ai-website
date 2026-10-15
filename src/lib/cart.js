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

// `discount` is { percent, amount } when a discount tier applies
export function checkoutHref(items, subtotal, discount) {
  const lines = items.map((item, index) => `${index + 1}. ${item.name} (${item.suitName}) - ${formatPrice(item.price)}`)
  const totals = discount
    ? [
        `Subtotal: ${formatPrice(subtotal)}`,
        `Discount (${discount.percent}%): -${formatPrice(discount.amount)}`,
        `Total: ${formatPrice(subtotal - discount.amount)}`,
      ]
    : [`Total: ${formatPrice(subtotal)}`]
  return whatsappHref(['Hello, I would like to order these products:', ...lines, ...totals, 'Please share the next steps.'].join('\n'))
}
