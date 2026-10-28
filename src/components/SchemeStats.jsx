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
        {/* Four tiles with gradient frames: the total leads in navy, the rest in light glass */}
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map((card, index) => {
            const lead = index === 0
            return (
              <li
                key={card.label}
                className={`group relative rounded-[1.5rem] p-px transition duration-300 hover:-translate-y-0.5 sm:rounded-[1.75rem] ${
                  lead
                    ? 'bg-gradient-to-br from-[#00B2FC]/70 via-[#003BD9]/40 to-[#00245A] shadow-[0_28px_60px_-30px_rgba(0,36,90,0.85)]'
                    : 'bg-gradient-to-br from-white via-[#CDE6FB] to-white shadow-[0_24px_50px_-36px_rgba(0,36,90,0.55)] hover:from-[#00B2FC]/50 hover:shadow-[0_30px_60px_-34px_rgba(0,36,90,0.6)]'
                }`}
              >
                {/* A 1px gradient frame around the tile's face */}
                <span className={`relative flex h-full flex-col gap-2.5 overflow-hidden rounded-[calc(1.5rem-1px)] px-3.5 py-3 sm:flex-row sm:items-center sm:gap-4 sm:rounded-[calc(1.75rem-1px)] sm:px-5 sm:py-4 ${
                  lead
                    ? 'bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.09)_1px,transparent_0)] bg-[length:14px_14px] bg-[#00245A] text-white'
                    : 'bg-white/90 backdrop-blur'
                }`}>
                  {/* Blue glow behind the lead, the tile's own icon faint in the corner, and a light sweep on hover */}
                  {lead ? <span aria-hidden="true" className="pointer-events-none absolute -top-16 -left-10 h-40 w-40 rounded-full bg-[#003BD9]/60 blur-3xl" /> : null}
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className={`pointer-events-none absolute -right-3 -bottom-4 h-24 w-24 transition duration-500 group-hover:-translate-y-1 group-hover:rotate-[-6deg] ${lead ? 'text-white/[0.08]' : 'text-[#003BD9]/[0.05]'}`}>
                    <path d={ICONS[card.icon]} stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover:left-[120%] group-hover:opacity-100 motion-reduce:hidden" />

                  <span aria-hidden="true" className={`relative grid h-9 w-9 shrink-0 place-items-center rounded-xl sm:h-11 sm:w-11 sm:rounded-2xl ${
                    lead
                      ? 'bg-gradient-to-br from-[#00B2FC] to-[#003BD9] text-white shadow-[0_10px_24px_-10px_rgba(0,178,252,0.9)]'
                      : 'bg-[#EAF6FF] text-[#003BD9] ring-1 ring-[#00B2FC]/15 transition group-hover:bg-gradient-to-br group-hover:from-[#00B2FC] group-hover:to-[#003BD9] group-hover:text-white group-hover:shadow-[0_10px_24px_-10px_rgba(0,178,252,0.9)]'
                  }`}>
                    <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 sm:h-5 sm:w-5" fill="none">
                      <path d={ICONS[card.icon]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>

                  <span className="relative min-w-0">
                    <span className={`block text-[1.6rem] leading-none font-semibold tracking-[-0.04em] max-[380px]:text-2xl sm:text-[1.85rem] ${
                      lead ? 'bg-gradient-to-r from-white to-[#9FDCFF] bg-clip-text text-transparent' : 'bg-gradient-to-r from-[#00245A] to-[#003BD9] bg-clip-text text-transparent'
                    }`}>
                      {card.text ?? <CountUp value={card.value} suffix={card.suffix} />}
                    </span>
                    <span className={`mt-1 block text-[13px] leading-tight font-medium ${lead ? 'text-white/75' : 'text-[#00245A]/60'}`}>{card.label}</span>
                  </span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

export default SchemeStats
