import { useEffect, useState } from 'react'
import { onValue, ref, remove, set, update } from 'firebase/database'
import { db } from '../../lib/firebase'
import Modal from './Modal'
import { Button, Field, Notice, inputClass } from './ui'

// Coupons for the Udyam Scheme Report payment on /report. The udyamVerify function reads
// coupons/<CODE> and counts paid (or free) orders under couponRedemptions/<CODE>.
const APPLIES = { all: 'Both reports', udyam_number: 'Udyam number (₹699)', certificate: 'Certificate upload (₹499)' }
const CODE = /^[A-Z0-9]{3,20}$/

function couponList(coupons, redemptions) {
  return Object.entries(coupons ?? {})
    .map(([code, c]) => ({
      code,
      kind: c.kind === 'flat' ? 'flat' : 'percent',
      value: Number(c.value) || 0,
      appliesTo: APPLIES[c.appliesTo] ? c.appliesTo : 'all',
      active: c.active === true,
      expiresAt: typeof c.expiresAt === 'number' ? c.expiresAt : null,
      maxUses: Number.isInteger(c.maxUses) ? c.maxUses : null,
      used: redemptions?.[code] ? Object.keys(redemptions[code]).length : 0,
    }))
    .sort((a, b) => a.code.localeCompare(b.code))
}

const offLabel = (c) => (c.kind === 'flat' ? `₹${c.value} off` : c.value >= 100 ? 'Free (100% off)' : `${c.value}% off`)
const dateInput = (ms) => (ms ? new Date(ms - new Date(ms).getTimezoneOffset() * 60000).toISOString().slice(0, 10) : '')

function CouponEditor({ coupon, existing, onDone, onCancel }) {
  const isNew = !coupon
  const [form, setForm] = useState(() => ({
    code: coupon?.code ?? '',
    kind: coupon?.kind ?? 'percent',
    value: coupon ? String(coupon.value) : '100',
    appliesTo: coupon?.appliesTo ?? 'all',
    maxUses: coupon?.maxUses ? String(coupon.maxUses) : '',
    expires: dateInput(coupon?.expiresAt),
    active: coupon?.active ?? true,
  }))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }))

  const onSubmit = async (event) => {
    event.preventDefault()
    const code = form.code.trim().toUpperCase()
    const value = Number(form.value)
    if (!CODE.test(code)) return setError('Code must be 3 to 20 capital letters or numbers, no spaces.')
    if (isNew && existing.includes(code)) return setError(`${code} already exists. Edit that one instead.`)
    if (form.kind === 'percent' && !(value > 0 && value <= 100)) return setError('Percent off must be more than 0 and at most 100.')
    if (form.kind === 'flat' && !(Number.isInteger(value) && value > 0)) return setError('Rupees off must be a whole number above 0.')
    const maxUses = form.maxUses === '' ? null : Number(form.maxUses)
    if (maxUses !== null && !(Number.isInteger(maxUses) && maxUses > 0)) return setError('Usage limit must be a whole number above 0, or empty for no limit.')
    // The code works until the end of the chosen day (India time)
    const expiresAt = form.expires ? new Date(`${form.expires}T23:59:59+05:30`).getTime() : null

    setSaving(true)
    setError('')
    try {
      await set(ref(db, `coupons/${code}`), {
        kind: form.kind,
        value,
        appliesTo: form.appliesTo,
        active: form.active,
        ...(maxUses ? { maxUses } : {}),
        ...(expiresAt ? { expiresAt } : {}),
      })
      onDone()
    } catch (saveError) {
      setError(`Could not save: ${saveError.message}`)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5 p-6 sm:p-8">
      <div className="pr-10">
        <h2 className="text-lg font-semibold tracking-tight">{isNew ? 'New coupon' : `Edit ${coupon.code}`}</h2>
        <p className="mt-1 text-sm text-[#00245A]/55">Customers type it on the Udyam Scheme Report payment step. 100% off opens the report without payment.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Code" htmlFor="coupon-code" hint="Capital letters and numbers, e.g. PCREDTEST.">
          <input
            id="coupon-code"
            value={form.code}
            onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() }))}
            disabled={!isNew}
            maxLength={20}
            placeholder="PCREDTEST"
            className={`${inputClass} font-mono uppercase`}
          />
        </Field>
        <Field label="Works for" htmlFor="coupon-applies">
          <select id="coupon-applies" value={form.appliesTo} onChange={setField('appliesTo')} className={inputClass}>
            {Object.entries(APPLIES).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="Discount type" htmlFor="coupon-kind">
          <select id="coupon-kind" value={form.kind} onChange={setField('kind')} className={inputClass}>
            <option value="percent">Percent off</option>
            <option value="flat">Rupees off</option>
          </select>
        </Field>
        <Field label={form.kind === 'flat' ? 'Rupees off (₹)' : 'Percent off (%)'} htmlFor="coupon-value" hint={form.kind === 'percent' ? '100 = free.' : 'At least the price = free.'}>
          <input id="coupon-value" value={form.value} onChange={setField('value')} inputMode="numeric" className={inputClass} />
        </Field>
        <Field label="Usage limit" htmlFor="coupon-max" hint="Empty = unlimited.">
          <input id="coupon-max" value={form.maxUses} onChange={setField('maxUses')} inputMode="numeric" placeholder="Unlimited" className={inputClass} />
        </Field>
        <Field label="Expires on" htmlFor="coupon-expires" hint="Empty = never. Works until the end of that day.">
          <input id="coupon-expires" type="date" value={form.expires} onChange={setField('expires')} className={inputClass} />
        </Field>
      </div>

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-[#00245A]/10 bg-[#F4F9FF] px-4 py-3">
        <span>
          <span className="block text-sm font-semibold">Active</span>
          <span className="block text-xs text-[#00245A]/55">Turn off to stop the code working without deleting it.</span>
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

      {error ? <Notice tone="error">{error}</Notice> : null}

      <div className="flex flex-wrap gap-2 border-t border-[#00245A]/8 pt-5">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : isNew ? 'Add coupon' : 'Save coupon'}
        </Button>
        <Button tone="ghost" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

// Only rendered when the coupon exists (see the React Compiler note in SuitEditor.jsx)
function EditCoupon({ coupon, existing, onDone, onCancel }) {
  return (
    <Modal label={`Edit coupon ${coupon.code}`} onClose={onCancel}>
      <CouponEditor coupon={coupon} existing={existing} onDone={onDone} onCancel={onCancel} />
    </Modal>
  )
}

function CouponsPanel() {
  const [raw, setRaw] = useState({ coupons: null, redemptions: null, loading: true, error: '' })
  const [editing, setEditing] = useState(null) // 'new', a code, or null
  const [notice, setNotice] = useState(null)
  const [now] = useState(() => Date.now())

  useEffect(() => {
    const fail = (error) => setRaw((current) => ({ ...current, loading: false, error: error.message }))
    const offCoupons = onValue(ref(db, 'coupons'), (snap) => setRaw((current) => ({ ...current, coupons: snap.val(), loading: false })), fail)
    const offUsed = onValue(ref(db, 'couponRedemptions'), (snap) => setRaw((current) => ({ ...current, redemptions: snap.val() })), fail)
    return () => {
      offCoupons()
      offUsed()
    }
  }, [])

  const coupons = couponList(raw.coupons, raw.redemptions)
  const editingCoupon = coupons.find((c) => c.code === editing)
  const done = (text) => () => {
    setEditing(null)
    setNotice({ tone: 'success', text })
  }
  const cancel = () => setEditing(null)

  const toggle = (c) =>
    update(ref(db, `coupons/${c.code}`), { active: !c.active }).catch((error) => setNotice({ tone: 'error', text: `Could not update: ${error.message}` }))

  const onDelete = async (c) => {
    if (!window.confirm(`Delete coupon ${c.code}? Customers will no longer be able to use it.`)) return
    try {
      await remove(ref(db, `coupons/${c.code}`))
      setNotice({ tone: 'success', text: `Coupon ${c.code} deleted.` })
    } catch (error) {
      setNotice({ tone: 'error', text: `Could not delete: ${error.message}` })
    }
  }

  const status = (c) =>
    !c.active ? 'Paused' : c.expiresAt && now > c.expiresAt ? 'Expired' : c.maxUses && c.used >= c.maxUses ? 'Used up' : 'Active'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Coupons</h1>
          <p className="text-xs text-[#00245A]/50">
            {coupons.length} {coupons.length === 1 ? 'coupon' : 'coupons'} · for the Udyam Scheme Report payment
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing('new')
            setNotice(null)
          }}
        >
          + New coupon
        </Button>
      </div>

      <p className="rounded-2xl border border-[#00B2FC]/25 bg-white/70 px-4 py-3 text-sm text-[#00245A]/70">
        The customer types the code on the payment step of the report. The server checks it and lowers the Cashfree amount. A 100% coupon opens
        the report with no payment, which is handy for testing. The coupon box shows only while report payment is switched on.
      </p>

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}
      {raw.error ? <Notice tone="error">Could not load coupons: {raw.error}</Notice> : null}

      {editing === 'new' ? (
        <Modal label="New coupon" onClose={cancel}>
          <CouponEditor coupon={null} existing={coupons.map((c) => c.code)} onDone={done('Coupon added.')} onCancel={cancel} />
        </Modal>
      ) : null}
      {editingCoupon ? (
        <EditCoupon key={editing} coupon={editingCoupon} existing={coupons.map((c) => c.code)} onDone={done('Coupon saved.')} onCancel={cancel} />
      ) : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-white bg-white shadow-[0_20px_50px_-36px_rgba(0,36,90,0.5)]">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-[#00245A]/8 bg-[#F4F9FF] text-xs font-semibold text-[#00245A]/60">
            <tr>
              <th scope="col" className="px-5 py-3">Code</th>
              <th scope="col" className="px-5 py-3">Discount</th>
              <th scope="col" className="px-5 py-3">Works for</th>
              <th scope="col" className="px-5 py-3">Used</th>
              <th scope="col" className="px-5 py-3">Expires</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00245A]/6">
            {raw.loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[#00245A]/50" aria-busy="true">
                  Loading coupons…
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[#00245A]/50">
                  No coupons yet. Add one, for example PCREDTEST at 100% off for testing.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.code} className={status(c) === 'Active' ? 'hover:bg-[#F4F9FF]/70' : 'bg-[#F4F9FF]/40 text-[#00245A]/50'}>
                  <td className="px-5 py-3.5 font-mono font-semibold">{c.code}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-full bg-[#E6FAF0] px-2.5 py-1 font-mono text-xs font-semibold text-[#128C4A]">{offLabel(c)}</span>
                  </td>
                  <td className="px-5 py-3.5 text-[#00245A]/70">{APPLIES[c.appliesTo]}</td>
                  <td className="px-5 py-3.5">{c.maxUses ? `${c.used} / ${c.maxUses}` : c.used}</td>
                  <td className="px-5 py-3.5 text-[#00245A]/70">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString('en-IN') : 'Never'}</td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={c.active}
                      onClick={() => toggle(c)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]"
                    >
                      <span aria-hidden="true" className={`relative h-5 w-9 rounded-full transition ${c.active ? 'bg-[#00B2FC]' : 'bg-[#00245A]/20'}`}>
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${c.active ? 'left-4.5' : 'left-0.5'}`} />
                      </span>
                      {status(c)}
                      <span className="sr-only">, coupon {c.code}</span>
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Button tone="ghost" className="px-3" onClick={() => setEditing(c.code)}>
                      Edit<span className="sr-only"> {c.code}</span>
                    </Button>
                    <Button tone="ghost" className="px-3 text-[#C2261C] hover:bg-[#FDECEA] hover:text-[#C2261C]" onClick={() => onDelete(c)}>
                      Delete<span className="sr-only"> {c.code}</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CouponsPanel
