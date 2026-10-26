import { useEffect, useRef, useState } from 'react'
import { db } from '../lib/firebase'

// Counts from the last monthly scheme import (schemes/current/meta/counts, written by the
// importSchemes function). These are the counts of the 24 Oct 2026 import, used if the
// database cannot be reached.
const FALLBACK = { central: 21, states: 36, extras: 211 }

function useSchemeCounts() {
  const [counts, setCounts] = useState(FALLBACK)
  useEffect(() => {
    const base = db?.app?.options?.databaseURL
    if (!base) return undefined
    let active = true
    // Plain HTTPS (the database's REST address), not the SDK's WebSocket, which some networks block
    fetch(`${base.replace(/\/+$/, '')}/schemes/current/meta/counts.json`, { signal: AbortSignal.timeout(8000) })
      .then((res) => (res.ok ? res.json() : null))
      .then((value) => {
        if (active && value && Number(value.central) > 0) {
          setCounts({ central: Number(value.central), states: Number(value.states) || FALLBACK.states, extras: Number(value.extras) || FALLBACK.extras })
        }
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return counts
}

// Counts up once the card scrolls into view; shows the final number straight away for reduced motion
function CountUp({ value, suffix = '' }) {
  const [still] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window))
  const [shown, setShown] = useState(0)
  const node = useRef(null)
  useEffect(() => {
    const el = node.current
    if (!el || still) return undefined
    let frame = 0
    let fallback = 0
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      observer.disconnect()
      const started = performance.now()
      const step = (now) => {
        // The first frame can be stamped slightly before `started`; never go below 0
        const t = Math.min(1, Math.max(0, (now - started) / 1100))
        setShown(Math.round(value * (1 - (1 - t) ** 3)))
        if (t < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
      // Browsers pause animation frames in background tabs; land on the real number regardless
      fallback = window.setTimeout(() => setShown(value), 1400)
    }, { threshold: 0.4 })
    observer.observe(el)
    return () => {
      observer.disconnect()
      cancelAnimationFrame(frame)
      window.clearTimeout(fallback)
    }
  }, [value, still])
  // If the count-up never runs (hidden tab, observer not firing), the real number still shows
  useEffect(() => {
    if (still) return undefined
    const timer = window.setTimeout(() => setShown((current) => (current === 0 ? value : current)), 2500)
    return () => window.clearTimeout(timer)
  }, [value, still])
  return (
    <span ref={node} className="tabular-nums">
      {still ? value : shown}
      {suffix}
    </span>
  )
}

const ICONS = {
  total: 'M4 6h16M4 12h16M4 18h10',
  map: 'M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Zm0 0v13m6-10.5v13',
  central: 'M3 10h18M5 10v8m4.67-8v8m4.66-8v8M19 10v8M3 20h18M12 3l9 5H3l9-5Z',
  calendar: 'M7 3v3m10-3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm3 8h3v3H8z',
}

function SchemeStats() {
  const { central, states, extras } = useSchemeCounts()
  const cards = [
    { icon: 'total', value: central + states + extras, suffix: '+', label: 'Schemes tracked', note: 'Central, state, sector, export and startup' },
    { icon: 'map', value: states, label: 'States & UTs covered', note: 'Each state’s own MSME policy' },
    { icon: 'central', value: central, label: 'Central MSME schemes', note: 'Credit guarantees, subsidies and loans' },
    { icon: 'calendar', text: 'Monthly', label: 'Rules re-checked', note: 'Every rule is re-checked against the source on the 1st' },
  ]

  return (
    <section aria-labelledby="scheme-coverage" className="relative bg-[#EAF6FF] py-6 text-[#00245A] sm:py-8">
      <div className="mx-auto w-full max-w-screen-xl px-6">
        {/* The strip speaks for itself on screen; the heading keeps the page outline complete */}
        <h2 id="scheme-coverage" className="sr-only">Scheme coverage</h2>
        {/* One glass strip, four segments */}
        <ul className="relative grid grid-cols-2 gap-1 overflow-hidden rounded-[1.75rem] border border-white bg-white/75 p-1.5 shadow-[0_24px_50px_-34px_rgba(0,36,90,0.55)] backdrop-blur lg:grid-cols-4 lg:gap-0">
          <span aria-hidden="true" className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#00B2FC]/60 to-transparent" />
          {cards.map((card, index) => (
            <li
              key={card.label}
              title={card.note}
              className={`group relative flex items-center gap-2.5 rounded-[1.25rem] px-3 py-3 transition hover:bg-[#F4F9FF] sm:gap-3.5 sm:px-5 sm:py-4 ${
                index > 0 ? 'lg:before:absolute lg:before:inset-y-4 lg:before:left-0 lg:before:w-px lg:before:bg-[#00245A]/8 lg:hover:before:opacity-0' : ''
              }`}
            >
              <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-[#EAF6FF] sm:h-10 sm:w-10 sm:rounded-2xl text-[#003BD9] ring-1 ring-[#00B2FC]/15 transition group-hover:bg-gradient-to-br group-hover:from-[#00B2FC] group-hover:to-[#003BD9] group-hover:text-white">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path d={ICONS[card.icon]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="min-w-0">
                <span className="block bg-gradient-to-r from-[#00245A] to-[#003BD9] bg-clip-text text-2xl leading-none font-semibold tracking-[-0.04em] text-transparent max-[380px]:text-xl sm:text-[1.75rem]">
                  {card.text ?? <CountUp value={card.value} suffix={card.suffix} />}
                </span>
                <span className="mt-1 block text-xs leading-tight font-medium text-[#00245A]/60 sm:text-[13px]">{card.label}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default SchemeStats
