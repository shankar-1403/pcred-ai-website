import { useEffect, useState } from 'react'
import { onValue, ref, remove, update } from 'firebase/database'
import { db } from '../../lib/firebase'
import { formatPrice } from '../../lib/cart'
import { ENQUIRY_STATUSES, formatDateTime, formatPhone, normalizeEnquiries, statusMeta } from '../../lib/enquiries'
import Modal from './Modal'
import { Button, Notice, inputClass } from './ui'

const ALL = 'all'

function StatusSelect({ enquiry, onError, className = '' }) {
  const meta = statusMeta(enquiry.status)
  return (
    <label className={className}>
      <span className="sr-only">Status for {enquiry.name}</span>
      <select
        value={enquiry.status}
        onChange={(event) => update(ref(db, `enquiries/${enquiry.id}`), { status: event.target.value }).catch(onError)}
        className={`cursor-pointer rounded-full border-0 py-1 pr-7 pl-3 text-xs font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#00B2FC] ${meta.tone}`}
      >
        {ENQUIRY_STATUSES.map((status) => (
          <option key={status.id} value={status.id}>
            {status.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// Only rendered when an enquiry is selected (see the React Compiler note in SuitEditor.jsx)
function EnquiryDetails({ enquiry, onClose, onError }) {
  return (
    <Modal label={`Enquiry from ${enquiry.name}`} onClose={onClose}>
      <div className="space-y-6 p-6 sm:p-8">
        <div className="pr-10">
          <p className="font-mono text-[11px] tracking-[0.18em] text-[#003BD9] uppercase">{formatDateTime(enquiry.createdAt)}</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight">{enquiry.name}</h2>
        </div>

        <dl className="grid grid-cols-1 gap-3 rounded-2xl bg-[#F4F9FF] p-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[#00245A]/50">Mobile (OTP verified)</dt>
            <dd className="mt-0.5 font-semibold">
              <a href={`tel:${enquiry.phone}`} className="text-[#003BD9] hover:underline">
                {formatPhone(enquiry.phone)}
              </a>
            </dd>
          </div>
          <div className="min-w-0">
            <dt className="text-xs text-[#00245A]/50">Email</dt>
            <dd className="mt-0.5 truncate font-semibold">
              <a href={`mailto:${enquiry.email}`} className="text-[#003BD9] hover:underline">
                {enquiry.email}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[#00245A]/50">Status</dt>
            <dd className="mt-1">
              <StatusSelect enquiry={enquiry} onError={onError} />
            </dd>
          </div>
        </dl>

        <div>
          <h3 className="text-sm font-semibold">Bundles</h3>
          <ul className="mt-2 divide-y divide-[#00245A]/8 rounded-2xl border border-[#00245A]/8 text-sm">
            {enquiry.items.map((item, index) => (
              <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-4 px-4 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate font-medium">{item.name}</span>
                  <span className="block truncate text-xs text-[#00245A]/50">{item.suitName}</span>
                </span>
                <span className="shrink-0 font-semibold">{formatPrice(item.price)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1 text-sm">
            {enquiry.discountPercent > 0 ? (
              <>
                <div className="flex justify-between text-[#00245A]/60">
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(enquiry.subtotal)}</dd>
                </div>
                <div className="flex justify-between text-[#128C4A]">
                  <dt>Discount ({enquiry.discountPercent}%)</dt>
                  <dd>−{formatPrice(enquiry.discount)}</dd>
                </div>
              </>
            ) : null}
            <div className="flex justify-between border-t border-[#00245A]/8 pt-2 text-base font-semibold">
              <dt>Total</dt>
              <dd>{formatPrice(enquiry.total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-[#00245A]/45">Totals are as shown to the customer at checkout. Confirm prices before invoicing.</p>
        </div>
      </div>
    </Modal>
  )
}

function EnquiriesPanel() {
  const [state, setState] = useState({ enquiries: [], loading: true, error: null })
  const [status, setStatus] = useState(ALL)
  const [query, setQuery] = useState('')
  const [viewing, setViewing] = useState(null) // enquiry id or null
  const [notice, setNotice] = useState(null)

  // Enquiries are admin-only, so this page subscribes itself rather than the public providers
  useEffect(
    () =>
      onValue(
        ref(db, 'enquiries'),
        (snapshot) => setState({ enquiries: normalizeEnquiries(snapshot.val()), loading: false, error: null }),
        (error) => setState({ enquiries: [], loading: false, error }),
      ),
    [],
  )

  const { enquiries, loading, error } = state
  const onError = (actionError) => setNotice({ tone: 'error', text: `Could not update: ${actionError.message}` })
  const needle = query.trim().toLowerCase()
  const visible = enquiries.filter(
    (enquiry) =>
      (status === ALL || enquiry.status === status) &&
      (!needle ||
        enquiry.name.toLowerCase().includes(needle) ||
        enquiry.email.toLowerCase().includes(needle) ||
        enquiry.phone.replace(/\s/g, '').includes(needle.replace(/\s/g, ''))),
  )
  const viewingEnquiry = enquiries.find((enquiry) => enquiry.id === viewing)
  const newCount = enquiries.filter((enquiry) => enquiry.status === 'new').length

  const onDelete = async (enquiry) => {
    if (!window.confirm(`Delete the enquiry from ${enquiry.name}? This cannot be undone.`)) return
    try {
      await remove(ref(db, `enquiries/${enquiry.id}`))
      setNotice({ tone: 'success', text: 'Enquiry deleted.' })
    } catch (deleteError) {
      setNotice({ tone: 'error', text: `Could not delete: ${deleteError.message}` })
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Enquiries</h1>
        <p className="text-xs text-[#00245A]/50">
          {enquiries.length} total · {newCount} new · from website checkouts, with OTP-verified mobile numbers
        </p>
      </div>

      {error ? <Notice tone="error">Could not load enquiries: {error.message}</Notice> : null}
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {viewingEnquiry ? <EnquiryDetails key={viewing} enquiry={viewingEnquiry} onClose={() => setViewing(null)} onError={onError} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sm:w-56">
          <span className="sr-only">Filter by status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClass} cursor-pointer`}>
            <option value={ALL}>All statuses</option>
            {ENQUIRY_STATUSES.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label} ({enquiries.filter((enquiry) => enquiry.status === item.id).length})
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1">
          <span className="sr-only">Search enquiries</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, email or mobile"
            className={inputClass}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-[1.5rem] border border-white bg-white shadow-[0_20px_50px_-36px_rgba(0,36,90,0.5)]">
        <table className="w-full min-w-[52rem] text-left text-sm">
          <thead className="border-b border-[#00245A]/8 bg-[#F4F9FF] text-xs font-semibold text-[#00245A]/60">
            <tr>
              <th scope="col" className="px-5 py-3">Received</th>
              <th scope="col" className="px-5 py-3">Customer</th>
              <th scope="col" className="px-5 py-3">Bundles</th>
              <th scope="col" className="px-5 py-3 text-right">Total</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00245A]/6">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#00245A]/50" aria-busy="true">
                  Loading enquiries…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[#00245A]/50">
                  {enquiries.length === 0 ? 'No enquiries yet. They appear here when customers check out.' : 'No enquiries match this filter.'}
                </td>
              </tr>
            ) : (
              visible.map((enquiry) => (
                <tr key={enquiry.id} className={enquiry.status === 'new' ? 'bg-[#F4F9FF]/50 hover:bg-[#F4F9FF]' : 'hover:bg-[#F4F9FF]/70'}>
                  <td className="px-5 py-3.5 text-xs whitespace-nowrap text-[#00245A]/60">{formatDateTime(enquiry.createdAt)}</td>
                  <td className="max-w-[16rem] px-5 py-3.5">
                    <p className="truncate font-semibold">{enquiry.name}</p>
                    <p className="truncate text-xs text-[#00245A]/55">
                      {formatPhone(enquiry.phone)} · {enquiry.email}
                    </p>
                  </td>
                  <td className="max-w-[16rem] px-5 py-3.5">
                    <p className="truncate">{enquiry.items.map((item) => item.name).join(', ')}</p>
                    <p className="text-xs text-[#00245A]/50">
                      {enquiry.items.length} {enquiry.items.length === 1 ? 'bundle' : 'bundles'}
                    </p>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <p className="font-semibold">{formatPrice(enquiry.total)}</p>
                    {enquiry.discountPercent > 0 ? <p className="text-xs text-[#128C4A]">{enquiry.discountPercent}% off</p> : null}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusSelect enquiry={enquiry} onError={onError} />
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Button tone="ghost" className="px-3" onClick={() => setViewing(enquiry.id)}>
                      View<span className="sr-only"> enquiry from {enquiry.name}</span>
                    </Button>
                    <Button tone="ghost" className="px-3 text-[#C2261C] hover:bg-[#FDECEA] hover:text-[#C2261C]" onClick={() => onDelete(enquiry)}>
                      Delete<span className="sr-only"> enquiry from {enquiry.name}</span>
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

export default EnquiriesPanel
