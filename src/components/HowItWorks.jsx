import { useEffect, useRef, useState } from 'react'

// From picking a bundle to receiving the report. Edit the wording here.
const STEPS = [
  {
    title: 'Pick your bundles',
    text: 'Add the bundles your business needs to the cart.',
    icon: 'M3 4h2l2.2 10.4a1.5 1.5 0 0 0 1.5 1.1h8.4a1.5 1.5 0 0 0 1.4-1l1.9-6H6.2M9 20h.01M17 20h.01',
  },
  {
    title: 'Verify and enquire',
    text: 'Check out with your name, email and a verified mobile number.',
    icon: 'M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3zM9 12l2 2 4-4',
  },
  {
    title: 'Share documents',
    text: 'We message you on WhatsApp with the exact list to send.',
    icon: 'M6 4.5A1.5 1.5 0 0 1 7.5 3H14l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5zM14 3v4h4M12 11v6m0-6-2.5 2.5M12 11l2.5 2.5',
  },
  {
    title: 'We prepare it',
    text: 'Our team builds each report the way a lender reads it.',
    icon: 'M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z',
  },
  {
    title: 'Report delivered',
    text: 'Your reports arrive as PDFs, ready to share with your bank.',
    icon: 'M5 12.5l4.5 4.5L19 7.5',
  },
]
const STEP_MS = 900
const HOLD_MS = 2600

function HowItWorks() {
  const [still] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  // How many steps are lit; the line fills up to the last lit one
  const [lit, setLit] = useState(0)
  const root = useRef(null)

  // Plays the steps in turn and loops while the section is on screen
  useEffect(() => {
    if (still) return undefined
    let timers = []
    const clear = () => {
      timers.forEach(window.clearTimeout)
      timers = []
    }
    const play = () => {
      clear()
      setLit(0)
      STEPS.forEach((_, index) => timers.push(window.setTimeout(() => setLit(index + 1), 300 + index * STEP_MS)))
      timers.push(window.setTimeout(play, 300 + STEPS.length * STEP_MS + HOLD_MS))
    }
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : clear()), { threshold: 0.3 })
    if (root.current) observer.observe(root.current)
    // Show everything if the section is never reported on screen (for example a background tab)
    const fallback = window.setTimeout(() => setLit((current) => current || STEPS.length), 4000)
    return () => {
      observer.disconnect()
      clear()
      window.clearTimeout(fallback)
    }
  }, [still])

  const shown = still ? STEPS.length : lit
  const progress = shown <= 1 ? 0 : (shown - 1) / (STEPS.length - 1)
  const active = shown - 1

  return (
    <section ref={root} aria-labelledby="how-it-works" className="relative isolate overflow-hidden border-b border-white/10 bg-[linear-gradient(180deg,#00245A_0%,#001B47_70%,#00122F_100%)] text-white">
      {/* Backdrop: dot grid, two soft glows */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent_80%)]" />
        <div className="banner-mesh absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-[#00B2FC]/25 blur-[110px]" />
        <div className="banner-mesh-alt absolute -right-32 -bottom-48 h-[30rem] w-[30rem] rounded-full bg-[#003BD9]/50 blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-6 py-16 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[10px] font-semibold tracking-[0.22em] text-[#7FD3FF] uppercase backdrop-blur">
              <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#00B2FC]" />
              How it works
            </p>
            <h2 id="how-it-works" className="mt-4 text-3xl leading-[1.05] font-semibold tracking-[-0.045em] sm:text-5xl">
              From bundle to report,
              <span className="block bg-gradient-to-r from-[#5CD0FF] via-[#00B2FC] to-[#7FA8FF] bg-clip-text pb-1 text-transparent">in five simple steps</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/60">Everything happens online and on WhatsApp. No office visits, no paperwork chasing.</p>
        </div>

        <ol className="relative mt-12 grid grid-cols-1 gap-5 lg:grid-cols-5 lg:gap-4">
          {/* Track, glowing fill and the light travelling at its head */}
          <span aria-hidden="true" className="absolute top-7 right-[10%] left-[10%] hidden h-px bg-white/15 lg:block">
            <span
              className="relative block h-full bg-gradient-to-r from-[#00B2FC] to-[#7FA8FF] shadow-[0_0_14px_rgba(0,178,252,0.9)] transition-[width] duration-[900ms] ease-out"
              style={{ width: `${progress * 100}%` }}
            >
              <span className="absolute top-1/2 -right-1.5 h-3 w-3 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(0,178,252,0.35),0_0_18px_rgba(0,178,252,1)]" />
            </span>
          </span>
          <span aria-hidden="true" className="absolute top-7 bottom-7 left-7 w-px bg-white/15 lg:hidden">
            <span
              className="relative block w-full bg-gradient-to-b from-[#00B2FC] to-[#7FA8FF] shadow-[0_0_14px_rgba(0,178,252,0.9)] transition-[height] duration-[900ms] ease-out"
              style={{ height: `${progress * 100}%` }}
            >
              <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(0,178,252,0.35),0_0_18px_rgba(0,178,252,1)]" />
            </span>
          </span>

          {STEPS.map((step, index) => {
            const done = index < active || (index === active && shown === STEPS.length)
            const current = index === active && shown < STEPS.length
            const on = index < shown
            return (
              <li key={step.title} className="relative flex gap-4 lg:flex-col lg:items-center">
                {/* Node on the line */}
                <span
                  className={`relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl border transition duration-500 ${
                    on
                      ? 'border-transparent bg-gradient-to-br from-[#00B2FC] to-[#003BD9] text-white shadow-[0_0_0_6px_rgba(0,178,252,0.12),0_18px_36px_-12px_rgba(0,178,252,0.8)]'
                      : 'border-white/15 bg-[#0A2E6B]/80 text-white/35 backdrop-blur'
                  } ${current ? 'scale-110' : ''}`}
                >
                  {current ? <span aria-hidden="true" className="absolute inset-0 animate-ping rounded-2xl bg-[#00B2FC]/40 motion-reduce:hidden" /> : null}
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="relative h-6 w-6" fill="none">
                    <path d={step.icon} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {done ? (
                    <span className="absolute -top-1.5 -right-1.5 grid h-5 w-5 place-items-center rounded-full bg-[#25D366] text-[10px] font-bold text-white ring-2 ring-[#00245A]">✓</span>
                  ) : null}
                </span>

                {/* Glass card; the current one gets a gradient border and lifts */}
                <div
                  className={`relative min-w-0 flex-1 overflow-hidden rounded-[1.4rem] p-px transition duration-500 lg:mt-5 lg:w-full ${
                    current ? 'bg-gradient-to-br from-[#00B2FC] via-[#7FA8FF]/60 to-transparent lg:-translate-y-1.5' : on ? 'bg-white/15' : 'bg-white/8'
                  }`}
                >
                  <div className={`relative h-full rounded-[calc(1.4rem-1px)] p-4 backdrop-blur-xl transition duration-500 ${current ? 'bg-[#0A2E6B]/95' : 'bg-[#0A2E6B]/60'}`}>
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none absolute -top-3 right-2 font-mono text-6xl leading-none font-bold tracking-tighter transition duration-500 select-none ${
                        on ? 'text-white/[0.07]' : 'text-white/[0.03]'
                      }`}
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <p className={`relative font-mono text-[10px] font-semibold tracking-[0.22em] transition duration-500 ${on ? 'text-[#7FD3FF]' : 'text-white/35'}`}>
                      STEP {String(index + 1).padStart(2, '0')}
                    </p>
                    <h3 className={`relative mt-1.5 text-base font-semibold tracking-tight transition duration-500 ${on ? 'text-white' : 'text-white/50'}`}>{step.title}</h3>
                    <p className={`relative mt-1.5 text-[13px] leading-relaxed transition duration-500 ${on ? 'text-white/65' : 'text-white/35'}`}>{step.text}</p>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

export default HowItWorks
