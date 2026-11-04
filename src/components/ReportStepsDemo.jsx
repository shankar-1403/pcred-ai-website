import { useEffect, useLayoutEffect, useRef, useState } from 'react'

// A looping walk-through of the Scheme Discovery report on the home page. Each step is a small
// copy of the real screen (same cards, buttons and wording), with a pointer that clicks through it.
const STEP_MS = 4200

const STEPS = [
  { title: 'Enter your Udyam number', note: 'Or upload the certificate' },
  { title: 'Check details, answer one question', note: 'Details fill in for you' },
  { title: 'See your matches and pay', note: 'Secure, by Cashfree' },
  { title: 'Your scheme report', note: 'Opens with the PDF' },
]

// The pointer glides in and taps whatever it sits on; `delay` lines the tap up with the button
function Pointer({ delay = 1700 }) {
  return (
    <span aria-hidden="true" className="demo-pointer pointer-events-none absolute top-1/2 left-1/2 z-10" style={{ animationDelay: `${delay - 900}ms` }}>
      <span className="demo-ripple absolute -top-3 -left-3 h-6 w-6 rounded-full bg-[#00B2FC]/40" style={{ animationDelay: `${delay}ms` }} />
      <svg viewBox="0 0 24 24" className="relative h-5 w-5 drop-shadow-[0_2px_3px_rgba(0,36,90,0.35)]">
        <path d="M5 3l14 8.5-6.2 1.3L10 19 5 3z" fill="#00245A" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
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

// Step 1: the home page's "Start here" box
function EnterNumber() {
  return (
    <div className="demo-in flex flex-col">
      <Card className="p-2.5 sm:p-3">
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#F4F9FF] p-1 text-[10px] font-semibold sm:text-xs">
          <span className="rounded-lg bg-white py-1.5 text-center text-[#00245A] shadow-sm">
            Udyam number <span className="ml-1 rounded bg-[#EAF6FF] px-1 text-[9px] text-[#003BD9]">₹699</span>
          </span>
          <span className="py-1.5 text-center text-[#00245A]/45">
            Certificate <span className="ml-1 text-[9px]">₹499</span>
          </span>
        </div>
        <div className="mt-2 rounded-xl border-2 border-[#CDE6FB] bg-[#F4F9FF] px-3 py-1.5 sm:py-2">
          <p className="text-[8px] font-semibold tracking-[0.14em] text-[#003BD9] uppercase sm:text-[9px]">Udyam registration number</p>
          <p className="flex items-center font-mono text-xs text-[#00245A] sm:text-sm">
            <span className="demo-type overflow-hidden whitespace-nowrap">UDYAM-XX-00-0000000</span>
            <span aria-hidden="true" className="demo-caret ml-px h-3.5 w-px bg-[#003BD9]" />
          </p>
        </div>
        <div className="relative mt-2">
          <span className="demo-press flex items-center justify-center gap-1.5 rounded-xl bg-[#00245A] py-2 text-xs font-semibold text-white sm:py-2.5 sm:text-sm" style={{ animationDelay: '2400ms' }}>
            Verify <span className="text-[#00B2FC]">₹699</span> →
          </span>
          <Pointer delay={2400} />
        </div>
      </Card>
    </div>
  )
}

// Step 2: Business details filled from the record, the ownership question, Continue
function AnswerQuestion() {
  const fields = [['Business name', 'Your Business Name'], ['Category', 'Micro'], ['Main activity', 'Manufacturing'], ['State / UT', 'Maharashtra']]
  return (
    <div className="demo-in flex flex-col gap-2 sm:gap-2.5">
      <Card className="p-2.5 sm:p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold text-[#00245A] sm:text-xs">Business details</p>
          <span className="demo-fillin flex items-center gap-1 text-[8px] text-[#00245A]/50 sm:text-[9px]" style={{ animationDelay: '900ms' }}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#128C4A]" />
            from your Udyam record
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-x-2 gap-y-1.5">
          {fields.map(([label, value], index) => (
            <div key={label} className="min-w-0">
              <p className="text-[8px] text-[#00245A]/55 sm:text-[9px]">{label}</p>
              <p className="demo-fillin truncate rounded-md border border-[#CDE6FB] bg-[#F4F9FF] px-1.5 py-0.5 text-[10px] text-[#00245A] sm:text-[11px]" style={{ animationDelay: `${200 + index * 180}ms` }}>
                {value}
              </p>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-2.5 sm:p-3" style={{ animationDelay: '500ms' }}>
        <p className="text-[10px] font-semibold text-[#00245A] sm:text-[11px]">Do women hold 51% or more of the business?</p>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <span className="rounded-lg border-2 border-[#00245A]/12 py-1 text-center text-[10px] font-semibold text-[#00245A]/60 sm:text-[11px]">Yes, 51% or more</span>
          <span className="relative">
            <span className="demo-choose block rounded-lg border-2 py-1 text-center text-[10px] font-semibold sm:text-[11px]" style={{ animationDelay: '1900ms' }}>No, less than 51%</span>
            <Pointer delay={1900} />
          </span>
        </div>
      </Card>
    </div>
  )
}

// Step 3: the payment step, preview tally on one side, coupon and payment on the other
function SeeMatches() {
  return (
    <div className="demo-in grid grid-cols-2 items-center gap-2 sm:gap-3">
      <Card className="p-2 sm:p-2.5">
        <p className="truncate text-[8px] tracking-[0.12em] text-[#00245A]/45 uppercase">Udyam record fetched</p>
        <p className="text-xs font-semibold text-[#00245A] sm:text-sm">YOUR BUSINESS NAME</p>
        <div className="mt-1.5 rounded-xl bg-[radial-gradient(120%_140%_at_100%_0%,#0A3A93,#00245A_60%)] px-2.5 py-2 text-white">
          <p className="truncate font-mono text-[7px] tracking-[0.14em] text-white/60 uppercase sm:text-[8px]">Inside your scheme report</p>
          <div className="mt-1 flex items-baseline gap-2">
            <p className="whitespace-nowrap"><b className="demo-count text-base font-semibold sm:text-lg">15</b> <span className="text-[8px] text-white/70 sm:text-[9px]">strong</span></p>
            <p className="whitespace-nowrap"><b className="demo-count text-base font-semibold sm:text-lg" style={{ animationDelay: '200ms' }}>82</b> <span className="text-[8px] text-white/70 sm:text-[9px]">to check</span></p>
          </div>
        </div>
      </Card>
      <Card className="p-2 sm:p-2.5" style={{ animationDelay: '250ms' }}>
        <div className="space-y-0.5 rounded-lg border border-[#DFE6F1] bg-[#F4F7FC] px-2 py-1.5 text-[9px] text-[#44577A] sm:text-[10px]">
          <p className="flex justify-between gap-2 whitespace-nowrap"><span>Report price</span><span>₹699</span></p>
          <p className="flex justify-between gap-2 whitespace-nowrap"><span>GST (18%)</span><span>₹125.82</span></p>
          <p className="flex justify-between gap-2 border-t border-[#DFE6F1] pt-0.5 font-bold whitespace-nowrap text-[#0D2147]"><span>Total</span><span>₹824.82</span></p>
        </div>
        <div className="relative mt-1.5">
          <span className="demo-press block rounded-lg bg-[#00245A] py-1.5 text-center text-[10px] font-semibold text-white sm:text-[11px]" style={{ animationDelay: '2300ms' }}>
            Pay ₹824.82
          </span>
          <Pointer delay={2300} />
        </div>
        <p className="mt-1 text-center text-[8px] text-[#00245A]/45">Secure payment by Cashfree</p>
      </Card>
    </div>
  )
}

// Step 4: the report's cover and its first matches
function GetReport() {
  const schemes = ['Collateral-free loans up to ₹10 crore', 'Capital subsidy on new machinery']
  return (
    <div className="demo-in flex flex-col gap-1.5 sm:gap-2">
      <div className="demo-pop rounded-2xl bg-[radial-gradient(120%_140%_at_100%_0%,#0A3A93,#00245A_60%)] p-2.5 text-white shadow-[0_14px_30px_-18px_rgba(0,36,90,0.8)] sm:p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-mono text-[7px] tracking-[0.16em] text-white/60 uppercase sm:text-[8px]">MSME scheme eligibility report</p>
            <p className="text-sm font-semibold sm:text-base">Your Business Name</p>
          </div>
          <span className="relative shrink-0">
            <span className="demo-press block rounded-full bg-white px-2.5 py-1 text-[9px] font-semibold text-[#00245A] sm:text-[10px]" style={{ animationDelay: '2200ms' }}>Download PDF</span>
            <Pointer delay={2200} />
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-2 gap-1.5">
          <p className="rounded-lg bg-white/10 px-2 py-1"><b className="demo-count text-base font-semibold">15</b> <span className="text-[8px] text-white/70 sm:text-[9px]">Strong matches</span></p>
          <p className="rounded-lg bg-white/10 px-2 py-1"><b className="demo-count text-base font-semibold" style={{ animationDelay: '150ms' }}>82</b> <span className="text-[8px] text-white/70 sm:text-[9px]">Worth checking</span></p>
        </div>
      </div>
      {schemes.map((scheme, index) => (
        <Card key={scheme} className="flex items-center gap-2 px-2.5 py-1.5" style={{ animationDelay: `${400 + index * 250}ms` }}>
          <span className="shrink-0 rounded-full bg-[#E3F4EC] px-1.5 py-0.5 text-[8px] font-semibold text-[#0A8458] sm:text-[9px]">✓ Strong match</span>
          <span className="truncate text-[10px] font-semibold text-[#0D2147] sm:text-[11px]">{scheme}</span>
        </Card>
      ))}
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
