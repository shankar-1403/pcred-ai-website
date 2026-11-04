import { useEffect, useRef, useState } from 'react'
import { db } from '../lib/firebase'

// Counts from the last monthly scheme import (schemes/current/meta/counts, written by the
// importSchemes function). These are the counts of the 24 Oct 2026 import, used if the
// database cannot be reached. `stateItems` (every incentive in every state's own policy) is
// stored from the November 2026 import on; until then the October figure stands in.
const FALLBACK = { central: 21, states: 36, stateItems: 543, extras: 211 }

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
          setCounts({
            central: Number(value.central),
            states: Number(value.states) || FALLBACK.states,
            stateItems: Number(value.stateItems) || FALLBACK.stateItems,
            extras: Number(value.extras) || FALLBACK.extras,
          })
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
      {(still ? value : shown).toLocaleString('en-IN')}
      {suffix}
    </span>
  )
}

const ICONS = {
  total: 'M4 6h16M4 12h16M4 18h10',
  map: 'M9 4 3 6.5v13L9 17l6 2.5 6-2.5v-13L15 6.5 9 4Zm0 0v13m6-10.5v13',
  central: 'M3 10h18M5 10v8m4.67-8v8m4.66-8v8M19 10v8M3 20h18M12 3l9 5H3l9-5Z',
  msme: 'M3 21h18M5 21V9l5 3V9l5 3V6l4 2v13M8 17h1m3 0h1m3 0h1',
}

// Each pill has its own colour: a soft tint, a gradient icon circle and the number in the deep shade
const TONES = {
  blue: { card: 'border-[#CFE0FF] bg-[#EEF4FF]', icon: 'from-[#00B2FC] to-[#003BD9] shadow-[0_10px_22px_-10px_rgba(0,59,217,0.8)]', number: 'text-[#003BD9]' },
  violet: { card: 'border-[#DDD3FF] bg-[#F3EFFF]', icon: 'from-[#A78BFA] to-[#6D28D9] shadow-[0_10px_22px_-10px_rgba(109,40,217,0.8)]', number: 'text-[#6D28D9]' },
  teal: { card: 'border-[#BDECE5] bg-[#E9FAF7]', icon: 'from-[#2DD4BF] to-[#0D9488] shadow-[0_10px_22px_-10px_rgba(13,148,136,0.8)]', number: 'text-[#0F766E]' },
  amber: { card: 'border-[#FBE2A8] bg-[#FFF7E6]', icon: 'from-[#FBBF24] to-[#EA580C] shadow-[0_10px_22px_-10px_rgba(234,88,12,0.75)]', number: 'text-[#C2410C]' },
}

function SchemeStats() {
  const { central, states, stateItems, extras } = useSchemeCounts()
  const cards = [
    // Every scheme and state incentive the report checks: central, each state's own policy items, and the rest
    { icon: 'total', tone: 'blue', value: central + stateItems + extras, suffix: '+', label: 'Schemes tracked' },
    { icon: 'map', tone: 'violet', value: states, label: 'States & UTs covered' },
    { icon: 'central', tone: 'teal', value: central, label: 'Central MSME schemes' },
    { icon: 'msme', tone: 'amber', value: 10000, suffix: '+', label: 'MSMEs benefited' },
  ]

  return (
    <section aria-labelledby="scheme-coverage" className="relative bg-[#EAF6FF] py-6 text-[#00245A] sm:py-8">
      <div className="mx-auto w-full max-w-screen-xl px-6">
        {/* The strip speaks for itself on screen; the heading keeps the page outline complete */}
        <h2 id="scheme-coverage" className="sr-only">Scheme coverage</h2>
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map((card) => {
            const tone = TONES[card.tone]
            return (
              <li
                key={card.label}
                className={`group flex min-w-0 items-center gap-3 rounded-[1.75rem] border px-3 py-3 shadow-[0_18px_40px_-30px_rgba(0,36,90,0.55)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-28px_rgba(0,36,90,0.6)] sm:gap-4 sm:px-4 sm:py-4 ${tone.card}`}
              >
                <span aria-hidden="true" className={`grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br text-white transition duration-300 group-hover:scale-105 sm:h-14 sm:w-14 ${tone.icon}`}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none">
                    <path d={ICONS[card.icon]} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="min-w-0">
                  <span className={`block text-[1.45rem] leading-none font-semibold tracking-[-0.04em] max-[380px]:text-xl sm:text-[1.9rem] ${tone.number}`}>
                    <CountUp value={card.value} suffix={card.suffix} />
                  </span>
                  <span className="mt-1 block text-[12px] leading-tight font-medium text-[#00245A]/65 sm:text-[13px]">{card.label}</span>
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
