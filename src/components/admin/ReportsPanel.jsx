import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../../lib/firebase'
import { formatDateTime } from '../../lib/enquiries'
import { Notice, inputClass } from './ui'

const ALL = 'all'

const ORDER_STATUSES = [
  { id: 'paid', label: 'Paid', tone: 'bg-[#E6FAF0] text-[#128C4A]' },
  { id: 'free', label: 'Coupon (free)', tone: 'bg-[#F3EFFF] text-[#6D28D9]' },
  { id: 'pending', label: 'Not completed', tone: 'bg-[#FFF4DB] text-[#9A6400]' },
]

const orderStatus = (id) => ORDER_STATUSES.find((item) => item.id === id) ?? ORDER_STATUSES[2]
const sourceLabel = (source) => (source === 'certificate' ? 'Certificate' : 'Udyam number')

// 9876543210 -> +91 98765 43210
function phoneText(phone) {
  return /^\d{10}$/.test(phone ?? '') ? `+91 ${phone.slice(0, 5)} ${phone.slice(5)}` : phone || '—'
}

function rupees(amount) {
  const n = Number(amount)
  if (!Number.isFinite(n)) return '—'
  return `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
}

// orders/{orderId} = { status, name, email, phone, udyam_number, enterprise_name, source, price, coupon, discount, total, amount_paid, created_at, paid_at }
function normalizeOrders(value) {
  if (!value) return []
  return Object.entries(value)
    .map(([id, order]) => ({
      id,
      status: order.status ?? 'pending',
      name: order.name ?? '',
      email: order.email ?? '',
      phone: order.phone ?? '',
      udyam: order.udyam_number ?? '',
      business: order.enterprise_name ?? '',
      source: order.source ?? 'udyam_number',
      price: Number(order.price ?? 0),
      coupon: order.coupon ?? '',
      total: Number(order.total ?? 0),
      paid: Number(order.amount_paid ?? 0),
      createdAt: Number(order.created_at ?? order.paid_at ?? 0),
      paidAt: Number(order.paid_at ?? 0),
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

// leads/{id} = the visitor's details and the fetched Udyam record (see functions/udyam/src/leads/store.js)
function normalizeLeads(value) {
  if (!value) return []
  return Object.entries(value)
    .map(([id, lead]) => ({
      id,
      name: lead.name ?? '',
      email: lead.email ?? '',
      phone: lead.phone ?? '',
      udyam: lead.udyam_number ?? '',
      business: lead.enterprise_name ?? '',
      place: [lead.district || lead.city, lead.state].filter(Boolean).join(', '),
      type: lead.enterprise_type ?? '',
      source: lead.source ?? 'udyam_number',
      active: lead.status === 'active',
      createdAt: Number(lead.created_at ?? 0),
    }))
    .sort((a, b) => b.createdAt - a.createdAt)
}

// Subscribes to an admin-only list, the same way the Enquiries page does
function useAdminList(path, normalize) {
  const [state, setState] = useState({ items: [], loading: true, error: null })
  useEffect(
    () =>
      onValue(
        ref(db, path),
        (snapshot) => setState({ items: normalize(snapshot.val()), loading: false, error: null }),
        (error) => setState({ items: [], loading: false, error }),
      ),
    [path, normalize],
  )
  return state
}

function Stat({ label, value, tone = 'text-[#00245A]' }) {
  return (
    <div className="rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_20px_50px_-40px_rgba(0,36,90,0.5)]">
      <p className="text-xs text-[#00245A]/55">{label}</p>
      <p className={`mt-1 text-lg font-semibold tracking-tight ${tone}`}>{value}</p>
    </div>
  )
}

function Contact({ item }) {
  return (
    <>
      <p className="truncate font-semibold">{item.name || <span className="font-normal text-[#00245A]/40">No name</span>}</p>
      <p className="truncate text-xs text-[#00245A]/55">
        {item.phone ? (
          <a href={`tel:+91${item.phone}`} className="text-[#003BD9] hover:underline">
            {phoneText(item.phone)}
          </a>
        ) : (
          '—'
        )}
        {item.email ? (
          <>
            {' · '}
            <a href={`mailto:${item.email}`} className="text-[#003BD9] hover:underline">
              {item.email}
            </a>
          </>
        ) : null}
      </p>
    </>
  )
}

function Business({ item }) {
  return (
    <>
      <p className="truncate font-medium">{item.business || '—'}</p>
      <p className="truncate font-mono text-xs text-[#00245A]/50">{item.udyam || '—'}</p>
    </>
  )
}

function TableShell({ head, loading, empty, colSpan, children }) {
  return (
    <div className="overflow-x-auto rounded-[1.5rem] border border-white bg-white shadow-[0_20px_50px_-36px_rgba(0,36,90,0.5)]">
      <table className="w-full min-w-[56rem] text-left text-sm">
        <thead className="border-b border-[#00245A]/8 bg-[#F4F9FF] text-xs font-semibold text-[#00245A]/60">
          <tr>
            {head.map((label, index) => (
              <th key={label} scope="col" className={`px-5 py-3 ${index === head.length - 1 && label === 'Paid' ? 'text-right' : ''}`}>
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#00245A]/6">
          {loading ? (
            <tr>
              <td colSpan={colSpan} className="px-5 py-10 text-center text-[#00245A]/50" aria-busy="true">
                Loading…
              </td>
            </tr>
          ) : empty ? (
            <tr>
              <td colSpan={colSpan} className="px-5 py-10 text-center text-[#00245A]/50">
                {empty}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  )
}

function matches(item, needle) {
  if (!needle) return true
  const digits = needle.replace(/\s/g, '')
  return (
    item.name.toLowerCase().includes(needle) ||
    item.email.toLowerCase().includes(needle) ||
    item.business.toLowerCase().includes(needle) ||
    item.udyam.toLowerCase().includes(needle) ||
    (digits !== '' && item.phone.includes(digits))
  )
}

function ReportsPanel() {
  const orders = useAdminList('orders', normalizeOrders)
  const leads = useAdminList('leads', normalizeLeads)
  const [view, setView] = useState('orders')
  const [status, setStatus] = useState(ALL)
  const [query, setQuery] = useState('')

  const needle = query.trim().toLowerCase()
  const paidOrders = orders.items.filter((order) => order.status === 'paid')
  const revenue = paidOrders.reduce((sum, order) => sum + order.paid, 0)
  const freeCount = orders.items.filter((order) => order.status === 'free').length
  const pendingCount = orders.items.filter((order) => order.status === 'pending').length
  // A lead "bought" when any paid or free order exists for its Udyam number
  const bought = new Set(orders.items.filter((order) => order.status !== 'pending').map((order) => order.udyam))

  const visibleOrders = orders.items.filter((order) => (status === ALL || order.status === status) && matches(order, needle))
  const visibleLeads = leads.items.filter((lead) => matches(lead, needle))
  const error = orders.error || leads.error

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Reports</h1>
        <p className="text-xs text-[#00245A]/50">
          Who bought the scheme report, how much they paid and when, and every visitor who fetched their Udyam details.
        </p>
      </div>

      {error ? <Notice tone="error">Could not load reports: {error.message}</Notice> : null}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Paid reports" value={paidOrders.length} tone="text-[#128C4A]" />
        <Stat label="Collected (incl. GST)" value={rupees(revenue)} tone="text-[#128C4A]" />
        <Stat label="Free with coupon" value={freeCount} tone="text-[#6D28D9]" />
        <Stat label="Payment not completed" value={pendingCount} tone="text-[#9A6400]" />
        <Stat label="Leads" value={leads.items.length} />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row">
        <div className="flex gap-1 rounded-full bg-white p-1 shadow-[0_10px_30px_-24px_rgba(0,36,90,0.5)]" role="group" aria-label="Show">
          {[
            ['orders', `Orders (${orders.items.length})`],
            ['leads', `Leads (${leads.items.length})`],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={view === id}
              onClick={() => setView(id)}
              className={`flex-1 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold whitespace-nowrap transition focus-visible:outline-2 focus-visible:outline-[#00B2FC] ${
                view === id ? 'bg-[#00245A] text-white' : 'text-[#00245A]/65 hover:bg-[#EAF6FF]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {view === 'orders' ? (
          <label className="lg:w-56">
            <span className="sr-only">Filter by status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className={`${inputClass} cursor-pointer`}>
              <option value={ALL}>All orders</option>
              {ORDER_STATUSES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label} ({orders.items.filter((order) => order.status === item.id).length})
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="flex-1">
          <span className="sr-only">Search</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name, mobile, email, business or Udyam number"
            className={inputClass}
          />
        </label>
      </div>

      {view === 'orders' ? (
        <TableShell
          head={['Date', 'Customer', 'Business', 'Report', 'Status', 'Paid']}
          colSpan={6}
          loading={orders.loading}
          empty={
            visibleOrders.length
              ? ''
              : orders.items.length
                ? 'No orders match this filter.'
                : 'No orders yet. They appear here when a visitor goes to pay for a scheme report.'
          }
        >
          {visibleOrders.map((order) => {
            const meta = orderStatus(order.status)
            return (
              <tr key={order.id} className="hover:bg-[#F4F9FF]/70">
                <td className="px-5 py-3.5 text-xs whitespace-nowrap text-[#00245A]/60">
                  {formatDateTime(order.paidAt || order.createdAt)}
                </td>
                <td className="max-w-[15rem] px-5 py-3.5">
                  <Contact item={order} />
                </td>
                <td className="max-w-[15rem] px-5 py-3.5">
                  <Business item={order} />
                </td>
                <td className="px-5 py-3.5 whitespace-nowrap">
                  <p>{sourceLabel(order.source)}</p>
                  <p className="text-xs text-[#00245A]/50">
                    {rupees(order.price)} + GST{order.coupon ? ` · ${order.coupon}` : ''}
                  </p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap ${meta.tone}`}>{meta.label}</span>
                </td>
                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                  <p className="font-semibold">{order.status === 'pending' ? '—' : rupees(order.paid)}</p>
                  {order.status === 'pending' ? <p className="text-xs text-[#00245A]/45">{rupees(order.total)} due</p> : null}
                </td>
              </tr>
            )
          })}
        </TableShell>
      ) : (
        <TableShell
          head={['Date', 'Visitor', 'Business', 'Started with', 'Bought']}
          colSpan={5}
          loading={leads.loading}
          empty={
            visibleLeads.length ? '' : leads.items.length ? 'No leads match this search.' : 'No leads yet. They appear here when a visitor fetches their Udyam details.'
          }
        >
          {visibleLeads.map((lead) => (
            <tr key={lead.id} className="hover:bg-[#F4F9FF]/70">
              <td className="px-5 py-3.5 text-xs whitespace-nowrap text-[#00245A]/60">
                {formatDateTime(lead.createdAt)}
                {!lead.active ? <p className="text-[#00245A]/40">Older than 90 days</p> : null}
              </td>
              <td className="max-w-[15rem] px-5 py-3.5">
                <Contact item={lead} />
              </td>
              <td className="max-w-[17rem] px-5 py-3.5">
                <Business item={lead} />
                {lead.place || lead.type ? (
                  <p className="truncate text-xs text-[#00245A]/45">{[lead.type, lead.place].filter(Boolean).join(' · ')}</p>
                ) : null}
              </td>
              <td className="px-5 py-3.5 whitespace-nowrap">{sourceLabel(lead.source)}</td>
              <td className="px-5 py-3.5">
                {bought.has(lead.udyam) ? (
                  <span className="inline-flex rounded-full bg-[#E6FAF0] px-3 py-1 text-xs font-semibold text-[#128C4A]">Yes</span>
                ) : (
                  <span className="inline-flex rounded-full bg-[#F1F4F9] px-3 py-1 text-xs font-semibold text-[#00245A]/55">Not yet</span>
                )}
              </td>
            </tr>
          ))}
        </TableShell>
      )}

      <p className="text-xs text-[#00245A]/45">
        Orders are recorded from today onwards; earlier payments are in the Cashfree dashboard. Amounts paid include 18% GST.
      </p>
    </div>
  )
}

export default ReportsPanel
