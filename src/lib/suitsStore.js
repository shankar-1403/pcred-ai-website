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

// Database shape: suits/{slug} = { name, summary, icon, order, banner?: { text, enabled }, cardImage?, layout?: 'grid' | 'bento', promo?: { enabled, title, highlight, text, image }, heroProduct?, products: { {id}: { name, description, price, documents[], order, badge?, badgeHidden? } } }
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
      // Offer card shown under the breadcrumb on this category's page (edited in the CMS category editor)
      promo: suit.promo?.title
        ? {
            enabled: suit.promo.enabled === true,
            title: String(suit.promo.title),
            highlight: String(suit.promo.highlight ?? ''),
            text: String(suit.promo.text ?? ''),
            image: String(suit.promo.image ?? ''),
          }
        : null,
      // How the category page arranges its products; 'bento' shows one large tile (heroProduct) among smaller ones
      // Photo on this category's home page card (edited in the CMS category editor)
      cardImage: suit.cardImage ? String(suit.cardImage) : '',
      layout: suit.layout === 'bento' ? 'bento' : 'grid',
      heroProduct: suit.heroProduct ?? null,
      products: Object.entries(suit.products ?? {})
        .map(([id, product]) => ({
          id,
          name: product.name ?? '',
          description: product.description ?? '',
          price: Number(product.price ?? 0),
          // `points` is the older name for this list; products move to `documents` when next saved
          documents: Object.values(product.documents ?? product.points ?? {}).filter(Boolean),
          order: Number(product.order ?? 0),
          // Corner badge on the product card: custom text, or hidden; empty text means automatic
          badge: product.badge ? String(product.badge) : '',
          badgeHidden: product.badgeHidden === true,
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
        ...(suit.layout ? { layout: suit.layout } : {}),
        ...(suit.promo ? { promo: suit.promo } : {}),
        ...(suit.banner ? { banner: suit.banner } : {}),
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
