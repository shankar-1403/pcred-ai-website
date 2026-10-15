import { useState } from 'react'
import { ref, set, update } from 'firebase/database'
import { db } from '../../lib/firebase'
import { DEFAULT_ICON, SUIT_ICONS, suitIcon } from '../../lib/suitIcons'
import { slugify } from '../../lib/suitsStore'
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
function SuitEditor({ suit, suits, onSaved, onCancel }) {
  // Always work from `current`, never `suit`, below this line
  const isNew = !suit
  const current = suit ?? EMPTY_SUIT
  const [form, setForm] = useState(() => ({
    name: current.name,
    slug: current.slug,
    summary: current.summary,
    icon: current.icon,
  }))
  const [slugTouched, setSlugTouched] = useState(false)
  const [status, setStatus] = useState(null)
  const [saving, setSaving] = useState(false)

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

    const data = { name: form.name.trim(), summary: form.summary.trim(), icon: form.icon }
    setSaving(true)
    try {
      if (isNew) {
        await set(ref(db, `suits/${slug}`), { ...data, order: suits.length + 1 })
        onSaved(`Created ${data.name}. Add its bundles in the Bundles tab.`)
      } else {
        await update(ref(db, `suits/${current.slug}`), data)
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
