import { useEffect, useState } from 'react'
import { get, ref, set, update } from 'firebase/database'
import { db } from '../../lib/firebase'
import { DEFAULT_ICON, SUIT_ICONS, suitIcon } from '../../lib/suitIcons'
import { slugify } from '../../lib/suitsStore'
import { compressPreview } from '../../lib/bundlePreviews'
import { suitImagePath } from '../../lib/suitImages'
import { Button, Field, Notice, inputClass } from './ui'

function IconBadge({ iconKey, className = 'h-10 w-10 rounded-xl' }) {
  const icon = suitIcon(iconKey)
  return (
    <span className={`flex shrink-0 items-center justify-center bg-gradient-to-br text-white ${icon.badge} ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-1/2 w-1/2">
        <path d={icon.path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

// Starting values for a new category. Kept non-null on purpose: the React Compiler turns
// `suit?.name` (and `suit.slug` inside handlers) into render-time cache checks, which crash when suit is null.
const EMPTY_SUIT = { name: '', slug: '', summary: '', icon: DEFAULT_ICON }

// Edits a category's own details; its products are managed in the Products tab
// Upload control for one category image. value: data URL or '' (none); shows the address image when nothing is uploaded
function ImageUpload({ upload, setUpload, fallback, label }) {
  const onFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUpload((current) => ({ ...current, busy: true, error: '' }))
    try {
      const value = await compressPreview(file)
      setUpload({ value, changed: true, loading: false, busy: false, error: '' })
    } catch (uploadError) {
      setUpload((current) => ({ ...current, busy: false, error: uploadError.message }))
    }
  }
  const shown = upload.value || fallback

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-[#00245A]/15 bg-[#F8FBFF] p-3">
      <div className="grid aspect-[4/3] w-36 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-[#00245A]/8">
        {shown ? (
          <img src={shown} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="px-2 text-center text-[11px] text-[#00245A]/40">{upload.loading ? 'Loading…' : 'No image yet'}</span>
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="text-xs text-[#00245A]/55">PNG, JPG or WEBP; resized automatically. An uploaded image is used instead of the address below.</p>
        <div className="flex flex-wrap gap-2">
          <label className={`inline-flex cursor-pointer items-center rounded-full bg-[#00245A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#003BD9] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#00B2FC] ${upload.busy ? 'pointer-events-none opacity-60' : ''}`}>
            {upload.busy ? 'Processing…' : upload.value ? 'Replace image' : 'Upload image'}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onFile} className="sr-only" disabled={upload.busy} />
          </label>
          {upload.value ? (
            <Button tone="ghost" onClick={() => setUpload({ value: '', changed: true, loading: false, busy: false, error: '' })}>
              Remove
            </Button>
          ) : null}
        </div>
        {upload.error ? <p className="text-xs text-[#C2261C]">{upload.error}</p> : null}
      </div>
    </div>
  )
}

const EMPTY_UPLOAD = { value: '', changed: false, loading: false, busy: false, error: '' }

function SuitEditor({ suit, suits, onSaved, onCancel }) {
  // Always work from `current`, never `suit`, below this line
  const isNew = !suit
  const current = suit ?? EMPTY_SUIT
  const [form, setForm] = useState(() => ({
    name: current.name,
    slug: current.slug,
    summary: current.summary,
    icon: current.icon,
    bannerText: current.banner?.text ?? '',
    bannerOn: current.banner?.enabled ?? false,
    promoOn: current.promo?.enabled ?? false,
    promoTitle: current.promo?.title ?? '',
    promoHighlight: current.promo?.highlight ?? '',
    promoText: current.promo?.text ?? '',
    promoImage: current.promo?.image ?? '',
    cardImage: current.cardImage ?? '',
    setOfferOn: current.setOffer?.enabled ?? false,
    setOfferPercent: current.setOffer ? String(current.setOffer.percent) : '',
    layout: current.layout ?? 'grid',
    heroProduct: current.heroProduct ?? '',
  }))
  const [slugTouched, setSlugTouched] = useState(false)
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)
  const [cardUpload, setCardUpload] = useState(() => ({ ...EMPTY_UPLOAD, loading: !isNew }))
  const [promoUpload, setPromoUpload] = useState(() => ({ ...EMPTY_UPLOAD, loading: !isNew }))

  // Loads the category's uploaded images (kept apart from the category data)
  useEffect(() => {
    if (isNew) return undefined
    let active = true
    const load = (kind, setUpload) =>
      get(ref(db, suitImagePath(current.slug, kind)))
        .then((snapshot) => active && setUpload((value) => (value.changed ? value : { ...value, value: snapshot.val() ?? '', loading: false })))
        .catch(() => active && setUpload((value) => ({ ...value, loading: false })))
    load('card', setCardUpload)
    load('promo', setPromoUpload)
    return () => {
      active = false
    }
  }, [isNew, current.slug])

  const slug = isNew && !slugTouched ? slugify(form.name) : form.slug

  const setField = (field) => (event) => {
    setForm((previous) => ({ ...previous, [field]: event.target.value }))
    setStatus(null)
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (!form.name.trim()) return setStatus({ tone: 'error', text: 'Add a category name.' })
    if (isNew) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) {
        return setStatus({ tone: 'error', text: 'The web address may only use lowercase letters, numbers and single hyphens.' })
      }
      if (suits.some((item) => item.slug === slug)) {
        return setStatus({ tone: 'error', text: `A category already uses /suits/${slug}. Choose another web address.` })
      }
    }

    const bannerText = form.bannerText.trim()
    if (form.bannerOn && !bannerText) return setStatus({ tone: 'error', text: 'Write the banner message, or switch the banner off.' })
    if (bannerText.length > 200) return setStatus({ tone: 'error', text: 'Keep the banner message to 200 characters.' })
    const promoTitle = form.promoTitle.trim()
    if (form.promoOn && !promoTitle) return setStatus({ tone: 'error', text: 'Write the offer card heading, or switch the offer card off.' })
    const promoImage = form.promoImage.trim()
    if (promoImage && !/^https?:\/\//.test(promoImage)) return setStatus({ tone: 'error', text: 'The background image must be a web address starting with https://.' })
    const setOfferPercent = Number(form.setOfferPercent)
    if (form.setOfferOn && !(Number.isInteger(setOfferPercent) && setOfferPercent >= 1 && setOfferPercent <= 90)) {
      return setStatus({ tone: 'error', text: 'The complete set offer needs a whole percent from 1 to 90, or switch it off.' })
    }
    const cardImage = form.cardImage.trim()
    if (cardImage && !/^https?:\/\//.test(cardImage)) return setStatus({ tone: 'error', text: 'The home card image must be a web address starting with https://.' })
    // No heading removes the offer card; one with the switch off is kept for later
    const promo = promoTitle
      ? {
          enabled: form.promoOn,
          title: promoTitle,
          highlight: form.promoHighlight.trim(),
          text: form.promoText.trim(),
          image: promoImage,
        }
      : null
    // No message removes the banner; a message with the switch off is kept for later
    const data = { name: form.name.trim(), summary: form.summary.trim(), icon: form.icon, banner: bannerText ? { text: bannerText, enabled: form.bannerOn } : null,
      promo,
      cardImage: cardImage || null,
      // No percent removes the offer; one with the switch off is kept for later
      setOffer: setOfferPercent > 0 ? { enabled: form.setOfferOn, percent: setOfferPercent } : null,
      layout: form.layout,
      heroProduct: form.layout === 'bento' && form.heroProduct ? form.heroProduct : null,
    }
    if (cardUpload.busy || promoUpload.busy || cardUpload.loading || promoUpload.loading) return setStatus({ tone: 'error', text: 'Wait for the images to finish loading.' })
    setSaving(true)
    // Uploaded images save to their own place, once the category exists
    const saveImages = async (target) => {
      if (cardUpload.changed) await set(ref(db, suitImagePath(target, 'card')), cardUpload.value || null)
      if (promoUpload.changed) await set(ref(db, suitImagePath(target, 'promo')), promoUpload.value || null)
    }
    try {
      if (isNew) {
        const { banner, promo: promoData, heroProduct, cardImage: image, setOffer, ...rest } = data
        await set(ref(db, `suits/${slug}`), { ...rest, ...(banner ? { banner } : {}), ...(promoData ? { promo: promoData } : {}), ...(heroProduct ? { heroProduct } : {}), ...(image ? { cardImage: image } : {}), ...(setOffer ? { setOffer } : {}), order: suits.length + 1 })
        await saveImages(slug)
        onSaved(`Created ${data.name}. Add its bundles in the Bundles tab.`)
      } else {
        await update(ref(db, `suits/${current.slug}`), data)
        await saveImages(current.slug)
        onSaved(`Saved ${data.name}. The site has updated.`)
      }
    } catch (error) {
      setStatus({ tone: 'error', text: `Could not save: ${error.message}` })
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="p-6 sm:p-8">
      <div className="flex items-center gap-3 pr-10">
        <IconBadge iconKey={form.icon} />
        <div className="min-w-0">
          <h2 className="truncate text-lg font-semibold tracking-tight">{isNew ? 'New category' : `Edit ${current.name}`}</h2>
          <p className="truncate font-mono text-xs text-[#00245A]/50">/suits/{slug || '…'}</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Category name" htmlFor="suit-name">
          <input id="suit-name" value={form.name} onChange={setField('name')} placeholder="MSME Advisory Suit" className={inputClass} />
        </Field>
        <Field
          label="Web address"
          htmlFor="suit-slug"
          hint={isNew ? 'Filled from the name. It becomes the page address and cannot change later.' : 'Fixed once a category is created.'}
        >
          <input
            id="suit-slug"
            value={slug}
            onChange={(event) => {
              setSlugTouched(true)
              setField('slug')(event)
            }}
            disabled={!isNew}
            className={`${inputClass} font-mono`}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Summary" htmlFor="suit-summary" hint="One line shown on the category card and the category page.">
          <textarea id="suit-summary" value={form.summary} onChange={setField('summary')} rows={2} className={`${inputClass} resize-y`} />
        </Field>
      </div>

      <fieldset className="mt-4">
        <legend className="mb-1.5 text-xs font-semibold">Icon</legend>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SUIT_ICONS).map(([key, icon]) => (
            <label
              key={key}
              className={`flex cursor-pointer items-center gap-2 rounded-xl border py-1.5 pr-3 pl-1.5 text-xs font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#00B2FC] ${
                form.icon === key ? 'border-[#00B2FC] bg-[#EAF6FF]' : 'border-[#00245A]/10 hover:border-[#00B2FC]/50'
              }`}
            >
              <input type="radio" name="suit-icon" value={key} checked={form.icon === key} onChange={setField('icon')} className="sr-only" />
              <IconBadge iconKey={key} className="h-7 w-7 rounded-lg" />
              {icon.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="mt-5 rounded-2xl border border-[#00245A]/10 p-4">
        <legend className="px-1 text-xs font-semibold">Top banner</legend>
        <p className="text-xs text-[#00245A]/55">A strip above the menu bar on this category&apos;s page, for an offer or announcement.</p>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.bannerOn}
            onChange={(event) => {
              setForm((previous) => ({ ...previous, bannerOn: event.target.checked }))
              setStatus(null)
            }}
            className="h-4 w-4 accent-[#003BD9]"
          />
          Show the banner
        </label>
        <div className="mt-3">
          <Field label="Banner message" htmlFor="suit-banner" hint={`${form.bannerText.trim().length}/200 characters. Clear it to remove the banner.`}>
            <input
              id="suit-banner"
              value={form.bannerText}
              onChange={setField('bannerText')}
              maxLength={200}
              placeholder="Free Udyam registration with any Startup bundle or product"
              className={inputClass}
            />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-5 rounded-2xl border border-[#00245A]/10 p-4">
        <legend className="px-1 text-xs font-semibold">Offer card</legend>
        <p className="text-xs text-[#00245A]/55">A large dark card under the breadcrumb on this category&apos;s page, separate from the top banner.</p>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.promoOn}
            onChange={(event) => {
              setForm((previous) => ({ ...previous, promoOn: event.target.checked }))
              setStatus(null)
            }}
            className="h-4 w-4 accent-[#003BD9]"
          />
          Show the offer card
        </label>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Heading" htmlFor="suit-promo-title" hint="Clear it to remove the offer card.">
            <input id="suit-promo-title" value={form.promoTitle} onChange={setField('promoTitle')} maxLength={120} placeholder="FREE Udyam / MSME Registration" className={inputClass} />
          </Field>
          <Field label="Highlighted line" htmlFor="suit-promo-highlight" hint="Second heading line, in light blue.">
            <input id="suit-promo-highlight" value={form.promoHighlight} onChange={setField('promoHighlight')} maxLength={120} placeholder="Worth ₹399, on us" className={inputClass} />
          </Field>
        </div>
        <div className="mt-4">
          <Field label="Text" htmlFor="suit-promo-text">
            <textarea id="suit-promo-text" value={form.promoText} onChange={setField('promoText')} maxLength={400} rows={2} className={`${inputClass} resize-y`} />
          </Field>
        </div>
        <div className="mt-4">
          <p className="mb-1.5 text-xs font-semibold text-[#00245A]">Background image (optional)</p>
          <ImageUpload upload={promoUpload} setUpload={setPromoUpload} fallback={form.promoImage.trim()} label="Offer card background" />
        </div>
        <div className="mt-3">
          <Field label="Or image address" htmlFor="suit-promo-image" hint="An https:// image address. It is tinted navy behind the text.">
            <input id="suit-promo-image" value={form.promoImage} onChange={setField('promoImage')} maxLength={2000} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-5 rounded-2xl border border-[#00245A]/10 p-4">
        <legend className="px-1 text-xs font-semibold">Complete set offer</legend>
        <p className="text-xs text-[#00245A]/55">A percent off when the cart holds every bundle in this category. The cart uses it instead of a spend discount when it saves more; they never add up.</p>
        <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.setOfferOn}
            onChange={(event) => {
              setForm((previous) => ({ ...previous, setOfferOn: event.target.checked }))
              setStatus(null)
            }}
            className="h-4 w-4 accent-[#003BD9]"
          />
          Offer a discount on the complete set
        </label>
        <div className="mt-3 max-w-[12rem]">
          <Field label="Percent off" htmlFor="suit-set-percent" hint="Whole number, 1 to 90.">
            <input id="suit-set-percent" value={form.setOfferPercent} onChange={setField('setOfferPercent')} inputMode="numeric" placeholder="20" className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-5 rounded-2xl border border-[#00245A]/10 p-4">
        <legend className="px-1 text-xs font-semibold">Home card</legend>
        <p className="text-xs text-[#00245A]/55">This category&apos;s card in the Categories section of the home page.</p>
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-semibold text-[#00245A]">Image (optional)</p>
          <ImageUpload upload={cardUpload} setUpload={setCardUpload} fallback={form.cardImage.trim()} label="Home card image" />
        </div>
        <div className="mt-3">
          <Field label="Or image address" htmlFor="suit-card-image" hint="An https:// image address, shown on the right of the card behind a navy fade. Without one, the card shows its icon instead.">
            <input id="suit-card-image" value={form.cardImage} onChange={setField('cardImage')} maxLength={2000} className={inputClass} />
          </Field>
        </div>
      </fieldset>

      <fieldset className="mt-5 rounded-2xl border border-[#00245A]/10 p-4">
        <legend className="px-1 text-xs font-semibold">Page layout</legend>
        <p className="text-xs text-[#00245A]/55">How this category&apos;s bundles are arranged on its page.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            ['grid', 'Grid', 'Equal cards, three per row'],
            ['bento', 'Bento', 'One large tile with smaller tiles around it'],
          ].map(([key, label, hint]) => (
            <label
              key={key}
              className={`flex cursor-pointer flex-col rounded-xl border px-3 py-2 text-sm font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[#00B2FC] ${
                form.layout === key ? 'border-[#00B2FC] bg-[#EAF6FF]' : 'border-[#00245A]/10 hover:border-[#00B2FC]/50'
              }`}
            >
              <input type="radio" name="suit-layout" value={key} checked={form.layout === key} onChange={setField('layout')} className="sr-only" />
              {label}
              <span className="text-xs font-normal text-[#00245A]/55">{hint}</span>
            </label>
          ))}
        </div>
        {form.layout === 'bento' ? (
          <div className="mt-3">
            <Field label="Large tile" htmlFor="suit-hero" hint="Left on automatic, the bundle with the most included products is the large tile.">
              <select id="suit-hero" value={form.heroProduct} onChange={setField('heroProduct')} className={`${inputClass} cursor-pointer`}>
                <option value="">Automatic (largest bundle)</option>
                {(current.products ?? []).map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        ) : null}
      </fieldset>

      {status ? (
        <div className="mt-5">
          <Notice tone={status.tone}>{status.text}</Notice>
        </div>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-2 border-t border-[#00245A]/8 pt-5">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Create category' : 'Save changes'}
        </Button>
        <Button tone="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export { IconBadge }
export default SuitEditor
