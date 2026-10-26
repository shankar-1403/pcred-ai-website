import { createContext, useContext } from 'react'
import { DEFAULT_ICON } from './suitIcons'

export const SuitsContext = createContext(null)

// { suits, loading, error, source: 'firebase' | 'starter' }
export function useSuits() {
  const value = useContext(SuitsContext)
  if (!value) throw new Error('useSuits must be used inside SuitsProvider')
  return value
}

export function findSuit(suits, slug) {
  return suits.find((suit) => suit.slug === slug)
}

export function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name)

// Database shape: suits/{slug} = { name, summary, icon, order, banner?: { text, enabled }, products: { {id}: { name, description, price, documents[], order } } }
export function normalizeSuits(snapshotValue) {
  if (!snapshotValue) return []
  return Object.entries(snapshotValue)
    .map(([slug, suit]) => ({
      slug,
      name: suit.name ?? slug,
      summary: suit.summary ?? '',
      icon: suit.icon ?? DEFAULT_ICON,
      order: Number(suit.order ?? 0),
      // Strip shown above the header on this category's page (edited in the CMS category editor)
      banner: suit.banner?.text ? { text: String(suit.banner.text), enabled: suit.banner.enabled === true } : null,
      products: Object.entries(suit.products ?? {})
        .map(([id, product]) => ({
          id,
          name: product.name ?? '',
          description: product.description ?? '',
          price: Number(product.price ?? 0),
          // `points` is the older name for this list; products move to `documents` when next saved
          documents: Object.values(product.documents ?? product.points ?? {}).filter(Boolean),
          order: Number(product.order ?? 0),
        }))
        .sort(byOrder),
    }))
    .sort(byOrder)
}

// Turns the starter list into the database shape, giving products stable ids
export function starterToDatabase(starterSuits) {
  return Object.fromEntries(
    starterSuits.map((suit, suitIndex) => [
      suit.slug,
      {
        name: suit.name,
        summary: suit.summary,
        icon: suit.icon ?? DEFAULT_ICON,
        order: suit.order ?? suitIndex + 1,
        products: Object.fromEntries(
          suit.products.map((product, index) => [
            slugify(product.name),
            {
              name: product.name,
              description: product.description,
              price: product.price,
              documents: product.documents ?? product.points ?? [],
              order: index + 1,
            },
          ]),
        ),
      },
    ]),
  )
}
