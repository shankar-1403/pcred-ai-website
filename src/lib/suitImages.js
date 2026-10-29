import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from './firebase'

// Images uploaded in the CMS category editor live apart from the category data, at
// suitImages/{suitSlug}/{kind}, as small WebP data URLs (compressed like bundle previews).
// kind: 'card' (home page category card) or 'promo' (offer card background).
export const suitImagePath = (suitSlug, kind) => `suitImages/${suitSlug}/${kind}`

let cache = null

// Live map of { [suitSlug]: { card?, promo? } }
export function useSuitImages() {
  const [images, setImages] = useState(() => cache ?? {})

  useEffect(() => {
    if (!db) return undefined
    return onValue(
      ref(db, 'suitImages'),
      (snapshot) => {
        cache = snapshot.val() ?? {}
        setImages(cache)
      },
      () => setImages({}),
    )
  }, [])

  return images
}
