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

// A suite's "complete set" offer: when the cart holds every bundle of a suite that has one,
// those bundles get its percent off. Returns the best such deal { name, percent, amount }, or null.
export function completeSetDeal(items, suits) {
  const inCart = new Map(items.map((item) => [item.id, item.price]))
  return suits.reduce((best, suit) => {
    const offer = suit.setOffer
    if (!offer?.enabled || offer.percent <= 0 || suit.products.length < 2) return best
    const ids = suit.products.map((product) => `${suit.slug}/${product.id}`)
    if (!ids.every((id) => inCart.has(id))) return best
    const amount = Math.round((ids.reduce((sum, id) => sum + inCart.get(id), 0) * offer.percent) / 100)
    return !best || amount > best.amount ? { name: suit.name, percent: offer.percent, amount } : best
  }, null)
}

export function discountAmount(subtotal, tier) {
  return tier ? Math.round((subtotal * tier.percent) / 100) : 0
}

// Everything the cart needs as plain numbers (0 when no tier applies), so components never
// read fields off a possibly-null tier — the React Compiler can turn those into crashes.
// A complete-set deal (completeSetDeal) is used instead of the spend tier when it saves more; they never stack.
export function cartPricing(subtotal, tiers, setDeal = null) {
  const current = bestDiscount(subtotal, tiers)
  const next = nextDiscount(subtotal, tiers)
  const tierDiscount = discountAmount(subtotal, current)
  const useSet = Boolean(setDeal) && setDeal.amount > tierDiscount
  const discount = useSet ? setDeal.amount : tierDiscount
  return {
    subtotal,
    percent: useSet ? setDeal.percent : current ? current.percent : 0,
    // Names the offer in the cart, e.g. "Complete MSME Advisory Suite"; empty for a spend tier
    dealName: useSet ? `Complete ${setDeal.name}` : '',
    discount,
    total: subtotal - discount,
    nextPercent: next ? next.percent : 0,
    amountToNext: next ? next.minAmount - subtotal : 0,
    nextMinAmount: next ? next.minAmount : 0,
  }
}
