import { useState } from 'react'
import { push, ref, set, update } from 'firebase/database'
import { db } from '../../lib/firebase'
import { formatPrice } from '../../lib/cart'
import { Button, Field, Notice, inputClass } from './ui'

// Non-null on purpose; see EMPTY_SUIT in SuitEditor.jsx for the React Compiler issue this avoids
const EMPTY_TIER = { id: 'new', minAmount: '', percent: '', active: true }

function DiscountEditor({ tier, tiers, onDone, onCancel }) {
  const isNew = !tier
  const initial = tier ?? EMPTY_TIER
  const [form, setForm] = useState(() => ({
    minAmount: initial.minAmount === '' ? '' : String(initial.minAmount),
    percent: initial.percent === '' ? '' : String(initial.percent),
    active: initial.active,
  }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const minAmount = Number(form.minAmount)
  const percent = Number(form.percent)
  const valid = form.minAmount !== '' && form.percent !== '' && Number.isInteger(minAmount) && minAmount >= 0 && percent > 0 && percent <= 100

  const onSubmit = async (event) => {
    event.preventDefault()
    if (form.minAmount === '' || !Number.isInteger(minAmount) || minAmount < 0) {
      return setError('Minimum order amount must be a whole number of rupees, 0 or more.')
    }
    if (form.percent === '' || !(percent > 0 && percent <= 100)) return setError('Discount must be more than 0% and at most 100%.')
    if (tiers.some((other) => other.id !== initial.id && other.minAmount === minAmount)) {
      return setError(`Another tier already starts at ${formatPrice(minAmount)}. Edit that one instead.`)
    }

    const data = { minAmount, percent, active: form.active }
    setSaving(true)
    setError('')
    try {
      if (isNew) await set(push(ref(db, 'discounts')), data)
      else await update(ref(db, `discounts/${initial.id}`), data)
      onDone()
    } catch (saveError) {
      setError(`Could not save: ${saveError.message}`)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 p-6 sm:p-8">
      <div className="pr-10">
        <h2 className="text-lg font-semibold tracking-tight">{isNew ? 'New discount tier' : 'Edit discount tier'}</h2>
        <p className="mt-1 text-sm text-[#00245A]/55">Applies to the cart total. When several tiers match, the biggest discount wins.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Minimum order amount (₹)" htmlFor="tier-min" hint="Cart total needed to unlock this discount.">
          <input id="tier-min" value={form.minAmount} onChange={setField('minAmount')} inputMode="numeric" placeholder="5000" className={inputClass} />
        </Field>
        <Field label="Discount (%)" htmlFor="tier-percent" hint="Taken off the whole cart total.">
          <input id="tier-percent" value={form.percent} onChange={setField('percent')} inputMode="decimal" placeholder="10" className={inputClass} />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#00245A]/10 bg-[#F4F9FF] px-4 py-3">
        <span>
          <span className="block text-sm font-semibold">Active</span>
          <span className="block text-xs text-[#00245A]/55">Turn off to pause this tier without deleting it.</span>
        </span>
        <input
          type="checkbox"
          checked={form.active}
          onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 shrink-0 rounded-full bg-[#00245A]/20 transition peer-checked:bg-[#00B2FC] peer-focus-visible:ring-2 peer-focus-visible:ring-[#00B2FC] peer-focus-visible:ring-offset-2 after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5"
        />
      </label>

      {valid ? (
        <p className="rounded-xl bg-[#EAF6FF] px-4 py-3 text-sm text-[#00245A]">
          Preview: a {formatPrice(Math.max(minAmount, 1000))} cart pays{' '}
          <strong>{formatPrice(Math.max(minAmount, 1000) - Math.round((Math.max(minAmount, 1000) * percent) / 100))}</strong> ({percent}% off).
        </p>
      ) : null}

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="flex flex-wrap gap-2 border-t border-[#00245A]/8 pt-5">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Add tier' : 'Save tier'}
        </Button>
        <Button tone="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export default DiscountEditor
