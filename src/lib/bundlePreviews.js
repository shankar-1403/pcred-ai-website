import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from './firebase'

// Bundle preview images live apart from the bundle data, at bundlePreviews/{suitSlug}/{productId},
// as small WebP data URLs. Only the category page that shows them downloads them, so the
// header, home page and cart stay light.
export const previewPath = (suitSlug, productId) => `bundlePreviews/${suitSlug}/${productId}`

const MAX_WIDTH = 1200
const MAX_HEIGHT = 900
// Keep in step with the size check in database.rules.json
export const MAX_PREVIEW_CHARS = 400_000
const MAX_SOURCE_BYTES = 15 * 1024 * 1024

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('That file could not be opened as an image.'))
    }
    image.src = url
  })
}

// Shrinks the picked image and re-encodes it so it fits comfortably in the database
export async function compressPreview(file) {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (PNG, JPG or WEBP).')
  if (file.size > MAX_SOURCE_BYTES) throw new Error('That image is over 15 MB. Choose a smaller one.')

  const image = await loadImage(file)
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')

  for (const scale of [1, 0.75, 0.55]) {
    const ratio = Math.min(1, MAX_WIDTH / image.naturalWidth, MAX_HEIGHT / image.naturalHeight) * scale
    canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio))
    canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio))
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.82, 0.7, 0.58]) {
      let dataUrl = canvas.toDataURL('image/webp', quality)
      // Browsers without WebP encoding fall back to PNG; use JPEG instead
      if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', quality)
      if (dataUrl.length <= MAX_PREVIEW_CHARS) return dataUrl
    }
  }
  throw new Error('This image is too detailed to store. Try a simpler or smaller image.')
}

// Live map of { [productId]: dataUrl } for one category
export function useBundlePreviews(suitSlug) {
  const [state, setState] = useState({ slug: '', previews: {} })

  useEffect(() => {
    if (!db || !suitSlug) return undefined
    return onValue(
      ref(db, `bundlePreviews/${suitSlug}`),
      (snapshot) => setState({ slug: suitSlug, previews: snapshot.val() ?? {} }),
      () => setState({ slug: suitSlug, previews: {} }),
    )
  }, [suitSlug])

  // Never show the previous category's images while the new ones load
  return state.slug === suitSlug ? state.previews : {}
}
