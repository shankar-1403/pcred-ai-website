import { useEffect, useState } from 'react'
import { onValue, ref } from 'firebase/database'
import { db } from '../../lib/firebase'
import { formatDateTime } from '../../lib/enquiries'
import { Notice, inputClass } from './ui'

const SECTIONS = [
  { id: 'states', label: 'States & UTs' },
  { id: 'central', label: 'Central schemes' },
  { id: 'extras', label: 'Sector, export & startup' },
]

// Non-null on purpose so the React Compiler never reads fields off a missing snapshot
const EMPTY = { meta: { counts: {} }, states: {}, central: {}, extras: {}, watch: [] }

const STATUS_TONES = {
  good: 'bg-[#E6FAF0] text-[#128C4A]',
  warn: 'bg-[#FFF4DB] text-[#9A6400]',
  muted: 'bg-[#EEF1F6] text-[#00245A]/60',
}

// State policy status (st) and scheme status wording, mapped to a colour
function toneFor(status = '') {
  const value = String(status).toLowerCase()
  if (/^(open|new)\b/.test(value)) return STATUS_TONES.good
  if (/(closed|none|lapsed|not ?operational)/.test(value)) return STATUS_TONES.muted
  return STATUS_TONES.warn
}

function StatusChip({ children }) {
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${toneFor(children)}`}>{children || '—'}</span>
}

// The report stores sources as a URL string, { label, url }, or a list of [label, url] pairs
function firstSource(source) {
  if (!source) return null
  if (typeof source === 'string') return { url: source, label: source }
  if (Array.isArray(source)) {
    const [first] = source
    return Array.isArray(first) ? { label: first[0], url: first[1] } : firstSource(first)
  }
  return source.url ? { url: source.url, label: source.label || source.url } : null
}

function SourceLink({ source }) {
  const link = firstSource(source)
  if (!link || !/^https?:\/\//.test(link.url)) return <span className="text-[#00245A]/30">—</span>
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      title={link.label}
      className="text-xs font-semibold text-[#003BD9] hover:underline"
    >
      Source<span className="sr-only">: {link.label}</span>
    </a>
  )
}

const rowsFor = (section, data) => {
  if (section === 'states') {
    return Object.values(data.states).map((s) => ({
      key: s.code,
      title: s.state,
      subtitle: s.short || s.statusText || '',
      category: s.code,
      status: s.st,
      detail: s.period || '',
      extra: `${(s.items ?? []).length} incentive${(s.items ?? []).length === 1 ? '' : 's'}`,
      checked: s.checked,
      source: s.source,
    }))
  }
  if (section === 'central') {
    return Object.values(data.central).map((s) => ({
      key: s.id,
      title: s.abbr ? `${s.name} (${s.abbr})` : s.name,
      subtitle: s.agency || '',
      category: s.cat,
      status: s.prog?.s,
      detail: s.prog?.note || '',
      extra: '',
      checked: data.meta.centralVerified,
      source: s.src,
    }))
  }
  return Object.values(data.extras).map((s) => ({
    key: s.id,
    title: s.abbr ? `${s.name} (${s.abbr})` : s.name,
    subtitle: s.agency || '',
    category: s.cat,
    status: s.status,
    detail: s.statusNote || s.headline || '',
    extra: '',
    checked: s.checked,
    source: s.source,
  }))
}

// Loads schemes/current and schemes/months live, then hands them to SchemesView
function SchemesPanel() {
  const [state, setState] = useState({ current: null, months: {}, loading: true, error: null })

  useEffect(() => {
    const stopCurrent = onValue(
      ref(db, 'schemes/current'),
      (snapshot) => setState((previous) => ({ ...previous, current: snapshot.val(), loading: false, error: null })),
      (error) => setState((previous) => ({ ...previous, loading: false, error })),
    )
    const stopMonths = onValue(ref(db, 'schemes/months'), (snapshot) =>
      setState((previous) => ({ ...previous, months: snapshot.val() ?? {} })),
    )
    return () => {
      stopCurrent()
      stopMonths()
    }
  }, [])

  return <SchemesView state={state} />
}

// Display only, so it can be rendered with sample data. `state` is { current, months, loading, error }.
export function SchemesView({ state }) {
  const [section, setSection] = useState('states')
  const [query, setQuery] = useState('')

  const data = state.current ? { ...EMPTY, ...state.current, meta: { ...EMPTY.meta, ...state.current.meta } } : EMPTY
  const hasData = Boolean(state.current)
  const counts = {
    states: Object.keys(data.states).length,
    central: Object.keys(data.central).length,
    extras: Object.keys(data.extras).length,
  }
  const needle = query.trim().toLowerCase()
  const rows = rowsFor(section, data).filter(
    (row) => !needle || `${row.title} ${row.subtitle} ${row.category} ${row.status}`.toLowerCase().includes(needle),
  )
  const months = Object.entries(state.months).sort(([a], [b]) => b.localeCompare(a))

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Schemes</h1>
          <p className="text-xs text-[#00245A]/50">
            Synced from the Udyam Scheme Report after each monthly rule check. Read-only here: change the report, not this page.
          </p>
        </div>
        {data.meta.source ? (
          <a
            href={data.meta.source}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center rounded-full bg-[#EAF6FF] px-4 py-2 text-sm font-semibold text-[#00245A] hover:bg-[#D9EEFF]"
          >
            Open Scheme Report
          </a>
        ) : null}
      </div>

      {state.error ? <Notice tone="error">Could not load scheme data: {state.error.message}</Notice> : null}

      {state.loading ? (
        <p className="rounded-2xl bg-white/70 px-5 py-10 text-center text-sm text-[#00245A]/50" aria-busy="true">
          Loading scheme data…
        </p>
      ) : !hasData ? (
        <div className="rounded-[1.5rem] border border-dashed border-[#00245A]/15 bg-white/60 px-6 py-10 text-center text-sm text-[#00245A]/60">
          <p className="font-semibold text-[#00245A]">No scheme data yet</p>
          <p className="mt-1">It appears here after the first import, from the one-time import or the monthly routine.</p>
        </div>
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Last import', formatDateTime(data.meta.importedAt)],
              ['State policies checked', data.meta.statesChecked || '—'],
              ['Sector & export checked', data.meta.extrasChecked || '—'],
              ['Central schemes verified', data.meta.centralVerified || '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white bg-white px-4 py-3 shadow-[0_12px_30px_-24px_rgba(0,36,90,0.5)]">
                <dt className="text-xs text-[#00245A]/50">{label}</dt>
                <dd className="mt-1 text-sm font-semibold">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex gap-1 rounded-2xl border border-white bg-white/70 p-1" role="group" aria-label="Scheme sections">
              {SECTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={section === item.id}
                  onClick={() => setSection(item.id)}
                  className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition sm:text-sm ${
                    section === item.id ? 'bg-[#00245A] text-white' : 'text-[#00245A]/60 hover:text-[#00245A]'
                  }`}
                >
                  {item.label} <span className="font-mono text-[10px] opacity-70">{counts[item.id]}</span>
                </button>
              ))}
            </div>
            <label className="flex-1">
              <span className="sr-only">Search schemes</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by name, category or status"
                className={inputClass}
              />
            </label>
          </div>

          <div className="overflow-x-auto rounded-[1.5rem] border border-white bg-white shadow-[0_20px_50px_-36px_rgba(0,36,90,0.5)]">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-[#00245A]/8 bg-[#F4F9FF] text-xs font-semibold text-[#00245A]/60">
                <tr>
                  <th scope="col" className="px-5 py-3">{section === 'states' ? 'State / UT' : 'Scheme'}</th>
                  <th scope="col" className="px-5 py-3">{section === 'states' ? 'Code' : 'Category'}</th>
                  <th scope="col" className="px-5 py-3">Status</th>
                  <th scope="col" className="px-5 py-3">{section === 'states' ? 'Policy period' : 'Note'}</th>
                  <th scope="col" className="px-5 py-3">Checked</th>
                  <th scope="col" className="px-5 py-3 text-right">
                    <span className="sr-only">Source</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00245A]/6">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-[#00245A]/50">
                      Nothing matches this search.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.key} className="align-top hover:bg-[#F4F9FF]/70">
                      <td className="max-w-xs px-5 py-3">
                        <p className="font-semibold">{row.title}</p>
                        {row.subtitle ? <p className="line-clamp-2 text-xs text-[#00245A]/50">{row.subtitle}</p> : null}
                      </td>
                      <td className="px-5 py-3 text-xs text-[#00245A]/70">{row.category || '—'}</td>
                      <td className="px-5 py-3">
                        <StatusChip>{row.status}</StatusChip>
                        {row.extra ? <p className="mt-1 text-xs text-[#00245A]/45">{row.extra}</p> : null}
                      </td>
                      <td className="max-w-xs px-5 py-3">
                        <p className="line-clamp-2 text-xs text-[#00245A]/60">{row.detail || '—'}</p>
                      </td>
                      <td className="px-5 py-3 text-xs whitespace-nowrap text-[#00245A]/60">{row.checked || '—'}</td>
                      <td className="px-5 py-3 text-right">
                        <SourceLink source={row.source} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {months.length ? (
        <section className="rounded-[1.5rem] border border-white bg-white p-5 shadow-[0_20px_50px_-36px_rgba(0,36,90,0.5)]">
          <h2 className="text-sm font-semibold">Import history</h2>
          <p className="text-xs text-[#00245A]/50">Each month&rsquo;s full copy is kept under schemes/history.</p>
          <ul className="mt-3 divide-y divide-[#00245A]/6 text-sm">
            {months.map(([month, entry]) => (
              <li key={month} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <span className="font-mono font-semibold">{month}</span>
                <span className="text-xs text-[#00245A]/60">
                  {entry.counts?.states ?? 0} states · {entry.counts?.central ?? 0} central · {entry.counts?.extras ?? 0} sector &amp; export
                </span>
                <span className="text-xs text-[#00245A]/50">Imported {formatDateTime(entry.importedAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

export default SchemesPanel
