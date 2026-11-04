import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// A looping walk-through of the Scheme Discovery report on the home page. Each step is a small
// copy of today's real screen (same cards, buttons and wording), played out like a visit: the
// pointer clicks, the number types, records load, payment confirms and the PDF downloads.
const STEP_MS = 5200

const STEPS = [
  { title: 'Enter your Udyam number', note: 'Or upload the certificate' },
  { title: 'Check details, answer one question', note: 'Details fill in for you' },
  { title: 'See your matches and pay', note: 'Secure, by Cashfree' },
  { title: 'Your scheme report', note: 'Opens with the PDF' },
]

// The pointer glides in, taps at `at` ms into the step, then fades away
function Pointer({ at }) {
  return (
    <span aria-hidden="true" className="demo-pointer pointer-events-none absolute top-1/2 left-1/2 z-10" style={{ animationDelay: `${at - 800}ms` }}>
      <span className="demo-ripple absolute -top-3 -left-3 h-6 w-6 rounded-full bg-[#00B2FC]/45" style={{ animationDelay: `${at}ms` }} />
      <svg viewBox="0 0 24 24" className="relative h-5 w-5 drop-shadow-[0_2px_3px_rgba(0,36,90,0.35)]">
        <path d="M5 3l14 8.5-6.2 1.3L10 19 5 3z" fill="#00245A" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

// A green notice that slides in when something completes
function Done({ at, children }) {
  return (
    <span className="demo-toast absolute bottom-0 left-1/2 z-20 inline-flex items-center gap-1.5 rounded-full bg-[#0A8458] px-3 py-1 text-[10px] font-semibold whitespace-nowrap text-white shadow-[0_10px_24px_-10px_rgba(10,132,88,0.8)] sm:text-[11px]" style={{ animationDelay: `${at}ms` }}>
      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3"><path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {children}
    </span>
  )
}

function Card({ className = '', children, style }) {
  return (
    <div className={`demo-pop rounded-2xl border border-white bg-white/95 shadow-[0_14px_30px_-20px_rgba(0,36,90,0.55)] ${className}`} style={style}>
      {children}
    </div>
  )
}

// A value that loads in: a grey bar first, then the text
function Loaded({ at, children, className = '' }) {
  return (
    <span className={`relative block ${className}`}>
      <span className="demo-skeleton absolute inset-y-0.5 left-0 w-3/4 rounded bg-[#00245A]/10" style={{ animationDelay: `${at}ms` }} />
      <span className="demo-fillin block truncate" style={{ animationDelay: `${at}ms` }}>{children}</span>
    </span>
  )
}

// Step 1: the home page's Start here box as it is now (separate tabs, plain field, Verify)
function EnterNumber() {
  return (
    <div className="demo-in relative flex flex-col gap-2 pb-3">
      <span className="inline-flex w-fit items-center gap-1 rounded-full bg-gradient-to-r from-[#00B2FC] to-[#003BD9] px-2 py-0.5 text-[8px] font-semibold text-white sm:text-[9px]">
        <span className="h-1 w-1 rounded-full bg-white" /> Start here
      </span>
      <div className="grid grid-cols-2 gap-1.5">
        <span className="rounded-full border-2 border-[#00B2FC] bg-white py-1.5 text-center text-[10px] font-semibold text-[#00245A] shadow-[0_8px_18px_-12px_rgba(0,59,217,0.6)] sm:text-[11px]">
          Udyam number <span className="ml-0.5 rounded-full bg-[#00B2FC]/15 px-1.5 text-[8px] text-[#003BD9] sm:text-[9px]">₹699</span>
        </span>
        <span className="rounded-full border-2 border-[#00245A]/10 bg-white/60 py-1.5 text-center text-[10px] font-semibold text-[#00245A]/55 sm:text-[11px]">
          Certificate <span className="ml-0.5 text-[8px] sm:text-[9px]">₹499</span>
        </span>
      </div>
      <div className="flex gap-1.5">
        <span className="demo-focus relative flex min-w-0 flex-1 items-center rounded-full border-2 border-[#00245A]/15 bg-white px-3 py-2 shadow-[0_10px_22px_-14px_rgba(0,36,90,0.5)]" style={{ animationDelay: '500ms' }}>
          <span className="demo-placeholder absolute left-3 text-[10px] text-[#00245A]/50 sm:text-[11px]" style={{ animationDelay: '800ms' }}>Enter your Udyam number</span>
          <span className="demo-type overflow-hidden font-mono text-[10px] font-semibold whitespace-nowrap text-[#00245A] sm:text-[11px]" style={{ animationDelay: '800ms' }}>UDYAM-XX-00-0000000</span>
          <span aria-hidden="true" className="demo-caret ml-px h-3 w-px bg-[#003BD9]" style={{ animationDelay: '500ms' }} />
          <Pointer at={500} />
        </span>
        <span className="relative shrink-0">
          <span className="demo-press flex items-center gap-1 rounded-full bg-[#00245A] px-4 py-2 text-[10px] font-semibold text-white shadow-[0_10px_22px_-12px_rgba(0,36,90,0.8)] sm:text-[11px]" style={{ animationDelay: '2900ms' }}>
            Verify →
          </span>
          <Pointer at={2900} />
        </span>
      </div>
      <div className="demo-fillin flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5" style={{ animationDelay: '3200ms' }}>
        <span className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-[#003BD9]/20 border-t-[#003BD9]" />
        <span className="text-[9px] text-[#44577A] sm:text-[10px]">Fetching your Udyam record…</span>
        <span className="ml-auto h-1 w-16 overflow-hidden rounded-full bg-[#00245A]/10"><span className="demo-progress block h-full rounded-full bg-[#00B2FC]" style={{ animationDelay: '3300ms' }} /></span>
      </div>
    </div>
  )
}

// Step 2: Business details load in, the ownership answer, then Continue
function AnswerQuestion() {
  const fields = [['Business name', 'Your Business Name'], ['Category', 'Micro'], ['Main activity', 'Manufacturing'], ['State / UT', 'Maharashtra']]
  return (
    <div className="demo-in flex flex-col gap-2">
      <Card className="p-2.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#00245A]">Business details</p>
          <span className="demo-fillin flex items-center gap-1 text-[8px] text-[#00245A]/50 sm:text-[9px]" style={{ animationDelay: '1100ms' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#128C4A]" /> from your Udyam record
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
          {fields.map(([label, value], index) => (
            <div key={label} className="min-w-0">
              <p className="text-[8px] text-[#00245A]/55 sm:text-[9px]">{label}</p>
              <Loaded at={350 + index * 170} className="rounded-md border border-[#CDE6FB] bg-[#F4F9FF] px-1.5 py-0.5 text-[10px] text-[#00245A]">
                {value}
              </Loaded>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-2.5" style={{ animationDelay: '350ms' }}>
        <p className="text-[10px] font-semibold text-[#00245A] sm:text-[11px]">Do women hold 51% or more of the business?</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <span className="rounded-lg border-2 border-[#00245A]/12 py-1 text-center text-[10px] font-semibold text-[#00245A]/60">Yes, 51% or more</span>
          <span className="relative">
            <span className="demo-choose block rounded-lg border-2 py-1 text-center text-[10px] font-semibold" style={{ animationDelay: '2100ms' }}>No, less than 51%</span>
            <Pointer at={2100} />
          </span>
        </div>
      </Card>
      <div className="flex items-center justify-between gap-2 rounded-xl bg-white/90 px-2.5 py-1.5 shadow-[0_8px_18px_-14px_rgba(0,36,90,0.5)]">
        <span className="text-[9px] text-[#44577A] sm:text-[10px]">We fetched your Udyam record. Then continue.</span>
        <span className="relative shrink-0">
          <span className="demo-press block rounded-full bg-[#00245A] px-3 py-1 text-[10px] font-semibold text-white" style={{ animationDelay: '3500ms' }}>Continue</span>
          <Pointer at={3500} />
        </span>
      </div>
    </div>
  )
}

// Step 3: the payment step, preview on the left, coupon and payment on the right
function SeeMatches() {
  return (
    <div className="demo-in relative grid grid-cols-2 items-start gap-2 pb-8">
      <Card className="p-2">
        <p className="truncate text-[8px] tracking-[0.12em] text-[#00245A]/45 uppercase">Udyam record fetched</p>
        <p className="truncate text-[11px] font-semibold text-[#00245A]">YOUR BUSINESS NAME</p>
        <div className="mt-1.5 rounded-xl bg-[radial-gradient(120%_140%_at_100%_0%,#0A3A93,#00245A_60%)] px-2 py-1.5 text-white">
          <p className="truncate font-mono text-[7px] tracking-[0.14em] text-white/60 uppercase">Inside your scheme report</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <p className="whitespace-nowrap"><b className="demo-count text-base font-semibold">15</b> <span className="text-[8px] text-white/70">strong</span></p>
            <p className="whitespace-nowrap"><b className="demo-count text-base font-semibold" style={{ animationDelay: '450ms' }}>82</b> <span className="text-[8px] text-white/70">to check</span></p>
          </div>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1 text-[8px] text-[#00245A]/70">
          <span className="truncate rounded bg-[#F4F7FC] px-1 py-0.5">Micro</span>
          <span className="truncate rounded bg-[#F4F7FC] px-1 py-0.5">Manufacturing</span>
        </div>
      </Card>
      <Card className="p-2" style={{ animationDelay: '250ms' }}>
        <p className="text-[8px] font-semibold text-[#00245A]">Coupon code (optional)</p>
        <div className="mt-0.5 flex gap-1">
          <span className="min-w-0 flex-1 rounded-md border border-[#CDE6FB] bg-[#F4F9FF] px-1.5 py-0.5 text-[8px] text-[#00245A]/40">ENTER CODE</span>
          <span className="rounded-md border border-[#DFE6F1] px-1.5 py-0.5 text-[8px] text-[#00245A]/60">Apply</span>
        </div>
        <div className="mt-1 space-y-0.5 rounded-lg border border-[#DFE6F1] bg-[#F4F7FC] px-1.5 py-1 text-[8px] text-[#44577A] sm:text-[9px]">
          <p className="flex justify-between gap-2 whitespace-nowrap"><span>Report price</span><span>₹699</span></p>
          <p className="flex justify-between gap-2 whitespace-nowrap"><span>GST (18%)</span><span>₹125.82</span></p>
          <p className="flex justify-between gap-2 border-t border-[#DFE6F1] pt-0.5 font-bold whitespace-nowrap text-[#0D2147]"><span>Total</span><span>₹824.82</span></p>
        </div>
        <div className="relative mt-1">
          <span className="demo-press block rounded-lg bg-[#00245A] py-1 text-center text-[9px] font-semibold text-white sm:text-[10px]" style={{ animationDelay: '2500ms' }}>
            Pay ₹824.82 to view and download
          </span>
          <Pointer at={2500} />
        </div>
      </Card>
      <Done at={3300}>Payment successful</Done>
    </div>
  )
}

// Step 4: the report's cover and its first matches, then the PDF downloads
function GetReport() {
  const schemes = ['Collateral-free loans up to ₹10 crore', 'Capital subsidy on new machinery']
  return (
    <div className="demo-in relative flex flex-col gap-1.5 pb-8">
      <div className="demo-pop rounded-2xl bg-[radial-gradient(120%_140%_at_100%_0%,#0A3A93,#00245A_60%)] p-2.5 text-white shadow-[0_14px_30px_-18px_rgba(0,36,90,0.8)]">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-mono text-[7px] tracking-[0.14em] text-white/60 uppercase sm:text-[8px]">MSME scheme eligibility report</p>
            <p className="truncate text-sm font-semibold">Your Business Name</p>
          </div>
          <span className="relative shrink-0">
            <span className="demo-press block rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold text-[#00245A] sm:text-[10px]" style={{ animationDelay: '2300ms' }}>Download PDF</span>
            <Pointer at={2300} />
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <p className="rounded-lg bg-white/10 px-2 py-1"><b className="demo-count text-base font-semibold">15</b> <span className="text-[8px] text-white/70 sm:text-[9px]">Strong matches</span></p>
          <p className="rounded-lg bg-white/10 px-2 py-1"><b className="demo-count text-base font-semibold" style={{ animationDelay: '450ms' }}>82</b> <span className="text-[8px] text-white/70 sm:text-[9px]">Worth checking</span></p>
        </div>
      </div>
      {schemes.map((scheme, index) => (
        <Card key={scheme} className="flex items-center gap-2 px-2.5 py-1.5" style={{ animationDelay: `${600 + index * 250}ms` }}>
          <span className="shrink-0 rounded-full bg-[#E3F4EC] px-1.5 py-0.5 text-[8px] font-semibold text-[#0A8458] sm:text-[9px]">✓ Strong match</span>
          <span className="truncate text-[10px] font-semibold text-[#0D2147] sm:text-[11px]">{scheme}</span>
        </Card>
      ))}
      <Done at={3000}>PDF downloaded</Done>
    </div>
  )
}

const SCREENS = [EnterNumber, AnswerQuestion, SeeMatches, GetReport]

function ReportStepsDemo() {
  const [step, setStep] = useState(0)
  // People who ask for less motion get one still step at a time; the step buttons still switch it
  const [still] = useState(() => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches)

  useEffect(() => {
    if (still) return undefined
    const timer = window.setTimeout(() => setStep((current) => (current + 1) % STEPS.length), STEP_MS)
    return () => window.clearTimeout(timer)
  }, [step, still])

  // Each step is drawn at a comfortable size, then scaled down to fit the card on small screens
  const areaRef = useRef(null)
  const sceneRef = useRef(null)
  // Applied straight to the element before the step paints, so a new step never jumps in size
  useLayoutEffect(() => {
    const area = areaRef.current
    const scene = sceneRef.current
    if (!area || !scene) return undefined
    const fit = () => {
      const scale = Math.min(1, (area.clientHeight - 6) / scene.offsetHeight, area.clientWidth / scene.offsetWidth)
      scene.style.transform = `scale(${scale})`
    }
    fit()
    // Measured again on window resizes and whenever the card itself changes size
    window.addEventListener('resize', fit)
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(fit)
    observer?.observe(area)
    observer?.observe(scene)
    return () => {
      window.removeEventListener('resize', fit)
      observer?.disconnect()
    }
  }, [step])

  const Current = SCREENS[step]
  return (
    <div
      className="relative flex h-full w-full flex-col bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F9FF_45%,#EAF6FF_100%)]"
      role="region"
      aria-label="How to get your Scheme Discovery report"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_80%_0%,rgba(0,178,252,0.18),transparent_70%)]" />
      <div className="relative flex items-center gap-2 px-4 pt-3 sm:px-7 sm:pt-4">
        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#00245A] text-[10px] font-semibold text-white">{step + 1}</span>
        <p key={step} className="demo-in truncate text-xs font-semibold text-[#00245A] sm:text-sm">{STEPS[step].title}</p>
      </div>
      <div ref={areaRef} className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        <div ref={sceneRef} className="w-full max-w-[460px] min-w-[300px] shrink-0 px-4 sm:px-7">
          <Current key={step} />
        </div>
      </div>
      <ol className="relative grid grid-cols-4 gap-1.5 px-4 pb-3 sm:gap-2 sm:px-7 sm:pb-4">
        {STEPS.map((item, index) => (
          <li key={item.title}>
            <button
              type="button"
              onClick={() => setStep(index)}
              aria-current={index === step ? 'step' : undefined}
              aria-label={`Step ${index + 1}: ${item.title}. ${item.note}`}
              className="group block w-full cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]"
            >
              <span className="block h-1 overflow-hidden rounded-full bg-[#00245A]/10">
                <span
                  key={index === step ? `on-${step}` : 'off'}
                  className={`block h-full rounded-full bg-gradient-to-r from-[#00B2FC] to-[#003BD9] ${index < step ? 'w-full' : index === step ? (still ? 'w-full' : 'demo-fill') : 'w-0'}`}
                  style={index === step && !still ? { animationDuration: `${STEP_MS}ms` } : undefined}
                />
              </span>
              <span className={`mt-1 hidden truncate text-[10px] font-medium sm:block ${index === step ? 'text-[#00245A]' : 'text-[#00245A]/40 group-hover:text-[#00245A]/70'}`}>
                {item.note}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}

export default ReportStepsDemo
