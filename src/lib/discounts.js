import { createContext, useContext } from 'react'

export const DiscountsContext = createContext(null)

// { tiers, loading } — tiers are sorted by minimum amount, inactive ones included
export function useDiscounts() {
  const value = useContext(DiscountsContext)
  if (!value) throw new Error('useDiscounts must be used inside DiscountsProvider')
  return value
}

// Database shape: discounts/{id} = { minAmount, percent, active }
export function normalizeDiscounts(snapshotValue) {
  if (!snapshotValue) return []
  return Object.entries(snapshotValue)
    .map(([id, tier]) => ({
      id,
      minAmount: Number(tier.minAmount ?? 0),
      percent: Number(tier.percent ?? 0),
      active: tier.active !== false,
    }))
    .sort((a, b) => a.minAmount - b.minAmount || a.percent - b.percent)
}

const activeTiers = (tiers) => tiers.filter((tier) => tier.active && tier.percent > 0)

// The best tier the subtotal qualifies for (highest percent), or null
export function bestDiscount(subtotal, tiers) {
  if (subtotal <= 0) return null
  return activeTiers(tiers)
    .filter((tier) => subtotal >= tier.minAmount)
    .reduce((best, tier) => (!best || tier.percent > best.percent ? tier : best), null)
}

// The nearest tier that would give a bigger discount than the current one, or null
export function nextDiscount(subtotal, tiers) {
  const current = bestDiscount(subtotal, tiers)
  return (
    activeTiers(tiers)
      .filter((tier) => tier.minAmount > subtotal && tier.percent > (current?.percent ?? 0))
      .sort((a, b) => a.minAmount - b.minAmount)[0] ?? null
  )
}

export function discountAmount(subtotal, tier) {
  return tier ? Math.round((subtotal * tier.percent) / 100) : 0
}

// Everything the cart needs as plain numbers (0 when no tier applies), so components never
// read fields off a possibly-null tier — the React Compiler can turn those into crashes.
export function cartPricing(subtotal, tiers) {
  const current = bestDiscount(subtotal, tiers)
  const next = nextDiscount(subtotal, tiers)
  const discount = discountAmount(subtotal, current)
  return {
    subtotal,
    percent: current ? current.percent : 0,
    discount,
    total: subtotal - discount,
    nextPercent: next ? next.percent : 0,
    amountToNext: next ? next.minAmount - subtotal : 0,
    nextMinAmount: next ? next.minAmount : 0,
  }
}
