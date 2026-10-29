import { useEffect, useRef, useState } from 'react'
import { get, push, ref, set, update } from 'firebase/database'
import { db } from '../../lib/firebase'
import { compressPreview, previewPath } from '../../lib/bundlePreviews'
import { Button, Field, Notice, inputClass } from './ui'

// Non-null on purpose; see EMPTY_SUIT in SuitEditor.jsx for the React Compiler issue this avoids
const EMPTY_PRODUCT = { id: 'new', name: '', description: '', price: '', documents: [] }

// Each row gets a stable key so typing in one row never jumps focus when rows are added or removed
const toRows = (documents) => (documents.length ? documents : ['']).map((value, index) => ({ key: index, value }))

// `suits` is optional: when given (Products tab), the form shows a Category picker and
// saving under a different category moves the product there.
function ProductEditor({ suitSlug = '', product, nextOrder = 1, suits, onDone, onCancel }) {
  const isNew = !product
  const initial = product ?? EMPTY_PRODUCT
  const canPickCategory = Boolean(suits)
  const [form, setForm] = useState(() => ({
    suitSlug,
    name: initial.name,
    description: initial.description,
    price: initial.price === '' ? '' : String(initial.price),
    documents: toRows(initial.documents),
    badge: initial.badge ?? '',
    badgeHidden: initial.badgeHidden ?? false,
  }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const nextKey = useRef(initial.documents.length + 1)
  const listRef = useRef(null)
  const [focusKey, setFocusKey] = useState(null)
  // value: data URL or '' (none); changed: whether saving should write it
  const [preview, setPreview] = useState({ value: '', changed: false, loading: !isNew, busy: false, error: '' })

  // Loads the bundle's current preview image (kept apart from the bundle data)
  useEffect(() => {
    if (isNew) return undefined
    let active = true
    get(ref(db, previewPath(suitSlug, initial.id)))
      .then((snapshot) => {
        if (active) setPreview((current) => (current.changed ? current : { ...current, value: snapshot.val() ?? '', loading: false }))
      })
      .catch(() => {
        if (active) setPreview((current) => ({ ...current, loading: false }))
      })
    return () => {
      active = false
    }
  }, [isNew, suitSlug, initial.id])

  const onPreviewFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setPreview((current) => ({ ...current, busy: true, error: '' }))
    try {
      const value = await compressPreview(file)
      setPreview({ value, changed: true, loading: false, busy: false, error: '' })
    } catch (previewError) {
      setPreview((current) => ({ ...current, busy: false, error: previewError.message }))
    }
  }
  const removePreview = () => setPreview({ value: '', changed: true, loading: false, busy: false, error: '' })

  // Puts the cursor in a newly added row once React has rendered it
  useEffect(() => {
    if (focusKey === null) return
    listRef.current?.querySelector(`[data-row-key="${focusKey}"]`)?.focus()
  }, [focusKey])

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))
  const setDocument = (key) => (event) =>
    setForm((current) => ({
      ...current,
      documents: current.documents.map((row) => (row.key === key ? { ...row, value: event.target.value } : row)),
    }))
  const removeDocument = (key) => {
    // Removing the last row leaves one empty row rather than none
    const spareKey = nextKey.current++
    setForm((current) => {
      const remaining = current.documents.filter((row) => row.key !== key)
      return { ...current, documents: remaining.length ? remaining : [{ key: spareKey, value: '' }] }
    })
  }
  const addDocument = () => {
    const key = nextKey.current++
    setForm((current) => ({ ...current, documents: [...current.documents, { key, value: '' }] }))
    setFocusKey(key)
  }

  // New and moved products go to the end of their category
  const orderAtEndOf = (slug) => (canPickCategory ? (suits.find((suit) => suit.slug === slug)?.products.length ?? 0) + 1 : nextOrder)

  const onSubmit = async (event) => {
    event.preventDefault()
    const price = Number(form.price)
    if (!form.suitSlug) return setError('Choose a category.')
    if (!form.name.trim()) return setError('Add a bundle name.')
    if (form.price === '' || !Number.isInteger(price) || price < 0) return setError('Price must be a whole number of rupees, 0 or more.')
    if (preview.busy || preview.loading) return setError('Wait for the preview image to finish loading.')
    if (preview.value && !/^(data:image\/|https?:\/\/)/.test(preview.value)) return setError('The preview image address must start with https://.')

    const data = {
      name: form.name.trim(),
      description: form.description.trim(),
      price,
      documents: form.documents.map((row) => row.value.trim()).filter(Boolean),
      // Clears the older `points` list now that it lives in `documents`
      points: null,
      badge: form.badge.trim() || null,
      badgeHidden: form.badgeHidden || null,
    }
    const target = form.suitSlug

    setSaving(true)
    setError('')
    try {
      if (isNew) {
        const created = push(ref(db, `suits/${target}/products`))
        await set(created, { ...data, order: orderAtEndOf(target) })
        if (preview.value) await set(ref(db, previewPath(target, created.key)), preview.value)
      } else if (target === suitSlug) {
        await update(ref(db, `suits/${suitSlug}/products/${initial.id}`), data)
        if (preview.changed) await set(ref(db, previewPath(suitSlug, initial.id)), preview.value || null)
      } else {
        // One atomic multi-path write, so the product (and its image) is never in both categories or neither
        await update(ref(db), {
          [`suits/${suitSlug}/products/${initial.id}`]: null,
          [`suits/${target}/products/${initial.id}`]: { ...data, order: orderAtEndOf(target) },
          [previewPath(suitSlug, initial.id)]: null,
          [previewPath(target, initial.id)]: preview.value || null,
        })
      }
      onDone()
    } catch (saveError) {
      setError(`Could not save: ${saveError.message}`)
      setSaving(false)
    }
  }

  const idPrefix = initial.id
  const moving = !isNew && canPickCategory && form.suitSlug !== suitSlug

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 p-6 sm:p-8">
      <h2 className="pr-10 text-lg font-semibold tracking-tight text-[#00245A]">{isNew ? 'New bundle' : `Edit ${initial.name}`}</h2>

      {canPickCategory ? (
        <Field
          label="Category"
          htmlFor={`${idPrefix}-category`}
          hint={moving ? 'Saving will move this bundle to the chosen category.' : undefined}
        >
          <select id={`${idPrefix}-category`} value={form.suitSlug} onChange={setField('suitSlug')} className={`${inputClass} cursor-pointer`}>
            {isNew && !form.suitSlug ? <option value="">Choose a category…</option> : null}
            {suits.map((suit) => (
              <option key={suit.slug} value={suit.slug}>
                {suit.name}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
        <Field label="Bundle name" htmlFor={`${idPrefix}-name`}>
          <input id={`${idPrefix}-name`} value={form.name} onChange={setField('name')} className={inputClass} />
        </Field>
        <Field label="Price (₹)" htmlFor={`${idPrefix}-price`} hint='0 shows "Price on request" with Enquire only (no Add to cart).'>
          <input
            id={`${idPrefix}-price`}
            value={form.price}
            onChange={setField('price')}
            inputMode="numeric"
            placeholder="499"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field
          label="Card badge"
          htmlFor={`${idPrefix}-badge`}
          hint={`The label in the top corner of the card. Left empty it shows "${(() => {
            const count = form.documents.filter((row) => row.value.trim()).length || 1
            return `${count} ${count === 1 ? 'product' : 'products'}`
          })()}".`}
        >
          <input
            id={`${idPrefix}-badge`}
            value={form.badge}
            onChange={setField('badge')}
            maxLength={40}
            disabled={form.badgeHidden}
            placeholder="Automatic"
            className={`${inputClass} disabled:opacity-50`}
          />
        </Field>
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={form.badgeHidden}
            onChange={(event) => setForm((current) => ({ ...current, badgeHidden: event.target.checked }))}
            className="h-4 w-4 accent-[#003BD9]"
          />
          Hide the badge
        </label>
      </div>

      <div>
        <p className="mb-1.5 text-xs font-semibold text-[#00245A]">Preview image</p>
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-[#00245A]/15 bg-[#F8FBFF] p-3">
          <div className="grid aspect-[4/3] w-36 shrink-0 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-[#00245A]/8">
            {preview.value ? (
              <img src={preview.value} alt="Bundle preview" className="h-full w-full object-cover" />
            ) : (
              <span className="px-2 text-center text-[11px] text-[#00245A]/40">{preview.loading ? 'Loading…' : 'No image yet'}</span>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs text-[#00245A]/55">Shown on the bundle card, like a product photo. For example, a page of the report. PNG, JPG or WEBP; resized automatically.</p>
            <div className="flex flex-wrap gap-2">
              <label className={`inline-flex cursor-pointer items-center rounded-full bg-[#00245A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#003BD9] focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[#00B2FC] ${preview.busy ? 'pointer-events-none opacity-60' : ''}`}>
                {preview.busy ? 'Processing…' : preview.value ? 'Replace image' : 'Upload image'}
                <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPreviewFile} className="sr-only" disabled={preview.busy} />
              </label>
              {preview.value ? (
                <Button tone="ghost" onClick={removePreview}>
                  Remove
                </Button>
              ) : null}
            </div>
          </div>
        </div>
        {preview.error ? <p className="mt-1.5 text-xs font-medium text-[#C2261C]">{preview.error}</p> : null}
        <div className="mt-3">
          <Field label="Or image address" htmlFor={`${idPrefix}-preview-url`} hint="An https:// image address, used instead of an upload.">
            <input
              id={`${idPrefix}-preview-url`}
              value={preview.value.startsWith('data:') ? '' : preview.value}
              onChange={(event) => setPreview({ value: event.target.value.trim(), changed: true, loading: false, busy: false, error: '' })}
              maxLength={2000}
              placeholder={preview.value.startsWith('data:') ? 'Using the uploaded image' : 'https://…'}
              className={inputClass}
            />
          </Field>
        </div>
      </div>

      <Field label="Description" htmlFor={`${idPrefix}-description`}>
        <textarea
          id={`${idPrefix}-description`}
          value={form.description}
          onChange={setField('description')}
          rows={2}
          className={`${inputClass} resize-y`}
        />
      </Field>

      <fieldset>
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          <legend className="text-xs font-semibold text-[#00245A]">Products in this bundle</legend>
          <span className="text-xs text-[#00245A]/45">
            {form.documents.filter((row) => row.value.trim()).length} listed · press Enter to add another
          </span>
        </div>
        <ol ref={listRef} className="space-y-2">
          {form.documents.map((row, index) => (
            <li key={row.key} className="flex items-center gap-2">
              <span className="w-6 shrink-0 text-right font-mono text-xs text-[#00245A]/40">{index + 1}.</span>
              <input
                data-row-key={row.key}
                aria-label={`Product ${index + 1}`}
                value={row.value}
                onChange={setDocument(row.key)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    addDocument()
                  }
                }}
                placeholder="e.g. Scheme Discovery Report"
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeDocument(row.key)}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-[#00245A]/40 transition hover:bg-[#FDECEA] hover:text-[#C2261C] focus-visible:outline-2 focus-visible:outline-[#00B2FC]"
              >
                <span className="sr-only">Remove product {index + 1}</span>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
                  <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ol>
        <Button tone="secondary" className="mt-2 ml-8" onClick={addDocument}>
          + Add product
        </Button>
      </fieldset>

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="flex flex-wrap gap-2 border-t border-[#00245A]/8 pt-5">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Add bundle' : moving ? 'Move and save' : 'Save bundle'}
        </Button>
        <Button tone="ghost" onClick={onCancel ?? onDone} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default ProductEditor
