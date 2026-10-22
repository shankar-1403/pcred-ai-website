import { useEffect, useRef, useState } from 'react'

// From picking a bundle to receiving the report. Edit the wording here.
const STEPS = [
  {
    title: 'Pick your bundles',
    icon: 'M3 4h2l2.2 10.4a1.5 1.5 0 0 0 1.5 1.1h8.4a1.5 1.5 0 0 0 1.4-1l1.9-6H6.2M9 20h.01M17 20h.01',
  },
  {
    title: 'Verify and enquire',
    icon: 'M12 3 5 6v5.5c0 4.4 3 7.9 7 9.5 4-1.6 7-5.1 7-9.5V6l-7-3zM9 12l2 2 4-4',
  },
  {
    title: 'Share documents',
    icon: 'M6 4.5A1.5 1.5 0 0 1 7.5 3H14l4 4v12.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 6 19.5zM14 3v4h4M12 11v6m0-6-2.5 2.5M12 11l2.5 2.5',
  },
  {
    title: 'Report delivered',
    icon: 'M5 12.5l4.5 4.5L19 7.5',
  },
]
// A small scene for each step, drawn in code so there are no images to load
function Panel({ on, children }) {
  return (
    <div
      aria-hidden="true"
      className={`relative -mx-2 -mt-2 mb-4 h-52 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0E3C86]/80 to-[#071F4D]/80 p-3.5 transition duration-700 ${
        on ? 'opacity-100' : 'opacity-40 grayscale'
      }`}
    >
      {children}
    </div>
  )
}

function Bar({ w, tone = 'bg-white/25' }) {
  return <span className={`block h-1.5 rounded-full ${tone}`} style={{ width: w }} />
}

const PICK_BUNDLES = [
  ['Know Your Business', 'from-[#00B2FC] to-[#003BD9]', true],
  ['Funding Ready', 'from-[#7FA8FF] to-[#3B5BDB]', false],
]

function PickArt({ on }) {
  return (
    <Panel on={on}>
      <div className="flex h-full gap-2 pr-6">
        {PICK_BUNDLES.map(([name, tone, added]) => (
          <div key={name} className="flex min-w-0 flex-1 flex-col rounded-lg bg-white/10 p-1.5">
            <span className={`block h-14 rounded-lg bg-gradient-to-br ${tone}`} />
            <span className="mt-1 line-clamp-2 text-[11.5px] leading-tight font-semibold text-white/85">{name}</span>
            <span
              className={`mt-auto rounded-md py-0.5 text-center text-[11px] font-bold transition duration-500 ${
                added && on ? 'bg-[#25D366] text-white' : 'bg-white/15 text-white/70'
              }`}
            >
              {added && on ? '✓ Added' : '+ Add'}
            </span>
          </div>
        ))}
      </div>
      <span className="absolute top-2 right-1.5 grid h-8 w-8 place-items-center rounded-full bg-white text-[#003BD9] shadow-lg">
        <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none">
          <path d={STEPS[0].icon} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span
          className={`absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-[#25D366] text-[10px] font-bold text-white transition duration-500 ${
            on ? 'scale-100' : 'scale-0'
          }`}
        >
          1
        </span>
      </span>
    </Panel>
  )
}

function VerifyArt({ on }) {
  return (
    <Panel on={on}>
      <div className="flex h-full flex-col gap-2">
        {['Name', 'Email'].map((label) => (
          <div key={label} className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5">
            <span className="w-11 text-[11px] text-white/55">{label}</span>
            <Bar w="55%" tone="bg-white/35" />
          </div>
        ))}
        <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5">
          <span className="w-11 text-[11px] text-white/55">Mobile</span>
          <span className="font-mono text-[11px] text-white/85">98•••210</span>
          <span
            className={`ml-auto shrink-0 whitespace-nowrap rounded-full bg-[#25D366] px-1.5 text-[10px] font-bold text-white transition duration-500 ${
              on ? 'opacity-100' : 'opacity-0'
            }`}
          >
            ✓ Verified
          </span>
        </div>
        <span className="mt-auto rounded-lg bg-gradient-to-r from-[#00B2FC] to-[#003BD9] py-1.5 text-center text-[11.5px] font-bold text-white">
          Send enquiry
        </span>
      </div>
    </Panel>
  )
}

const SHARED_DOCS = ['Bank_statements.pdf', 'Company_PAN.pdf']

function DocsArt({ on }) {
  return (
    <Panel on={on}>
      <div className="flex h-full flex-col gap-1.5 rounded-lg bg-[#0B141A]/70 p-1.5">
        <div className="max-w-[85%] rounded-lg rounded-tl-sm bg-[#1F2C34] px-2 py-1 text-[11px] leading-snug text-white/85">
          Please share: bank statements, PAN, MOA
        </div>
        {SHARED_DOCS.map((name, i) => (
          <div
            key={name}
            className={`ml-auto flex max-w-[85%] items-center gap-1.5 rounded-lg rounded-tr-sm bg-[#005C4B] px-2 py-1 transition duration-500 ${
              on ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
            }`}
            style={{ transitionDelay: on ? `${200 + i * 250}ms` : '0ms' }}
          >
            <span className="grid h-5 w-4 shrink-0 place-items-center rounded-sm bg-[#FF5A5F] text-[7px] font-bold text-white">PDF</span>
            <span className="truncate text-[11px] text-white/90">{name}</span>
            {/* WhatsApp's blue "read" ticks: two checks, the second overlapping the first */}
            <svg viewBox="0 0 18 11" className="ml-auto h-3 w-[18px] shrink-0 text-[#53BDEB]" fill="none">
              <path d="M1.2 5.9 4.4 9 11 1.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.6 8.4 8.2 9 14.8 1.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </div>
    </Panel>
  )
}

const REPORTS = ['KYB', 'Funding', 'Credit']

function DeliveredArt({ on }) {
  return (
    <Panel on={on}>
      <div className="flex h-full items-center justify-center gap-2">
        {REPORTS.map((name, i) => (
          <div
            key={name}
            className={`relative flex h-28 w-[4.6rem] flex-col rounded-md bg-white p-1.5 shadow-[0_10px_20px_-8px_rgba(0,0,0,0.6)] transition duration-500 ${
              on ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
            }`}
            style={{ transitionDelay: on ? `${i * 150}ms` : '0ms' }}
          >
            <span className="w-fit rounded-sm bg-[#FF5A5F] px-1 text-[8px] font-bold text-white">PDF</span>
            <span className="mt-1 block h-1 rounded-full bg-[#00245A]/20" />
            <span className="mt-0.5 block h-1 w-3/4 rounded-full bg-[#00245A]/15" />
            <span className="mt-0.5 block h-1 w-1/2 rounded-full bg-[#00245A]/15" />
            <span className="mt-auto truncate text-[9.5px] font-semibold text-[#00245A]">{name}</span>
          </div>
        ))}
      </div>
      <span
        className={`absolute right-3 bottom-3 grid h-8 w-8 place-items-center rounded-full bg-[#25D366] text-sm font-bold text-white shadow-lg transition duration-500 ${
          on ? 'scale-100' : 'scale-0'
        }`}
        style={{ transitionDelay: on ? '500ms' : '0ms' }}
      >
        ✓
      </span>
    </Panel>
  )
}

const ART = [PickArt, VerifyArt, DocsArt, DeliveredArt]

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
              From bundle to report,{' '}
              <span className="block bg-gradient-to-r from-[#5CD0FF] via-[#00B2FC] to-[#7FA8FF] bg-clip-text pb-1 text-transparent">in four simple steps</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/60">Everything happens online and on WhatsApp. No office visits, no paperwork chasing.</p>
        </div>

        <ol className="relative mt-12 grid grid-cols-1 gap-5 lg:grid-cols-4 lg:gap-4">
          {/* Track, glowing fill and the light travelling at its head */}
          <span aria-hidden="true" className="absolute top-7 right-[12.5%] left-[12.5%] hidden h-px bg-white/15 lg:block">
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
            const Art = ART[index]
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
                    <Art on={on} />
                    <h3 className={`relative text-center text-base font-semibold tracking-tight transition duration-500 ${on ? 'text-white' : 'text-white/50'}`}>{step.title}</h3>
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
