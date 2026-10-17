import { useEffect, useRef, useState } from 'react'
import Logo from '../assets/favicon.svg'
import WhatsAppIcon from './WhatsAppIcon'

// An illustration of the WhatsApp flow, played on a loop while it is on screen:
// the client asks, PCRED lists the documents, the client sends them, the report comes back.
const STEPS = [
  { at: 0 }, // client asks
  { at: 1300, typing: true },
  { at: 2600 }, // PCRED lists the documents
  { at: 4800 }, // client sends the files
  { at: 6900, typing: true },
  { at: 8300 }, // report ready
]
const LOOP_MS = 13500
const LAST = STEPS.length - 1

const DOCUMENTS = ['Audited financials (last 3 years)', 'Bank statements (12 months)', 'Company PAN & MOA']
const FILES = ['Financials-FY23-25.pdf', 'Bank-Statement.pdf', 'PAN-MOA.pdf']

function Ticks() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3 text-[#00B2FC]">
      <path d="m1.5 8.5 3 3 6-7M7 11.5l6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Sent({ time }) {
  return (
    <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#00245A]/45">
      {time}
      <Ticks />
    </span>
  )
}

function Typing() {
  return (
    <div className="chat-in inline-flex items-center gap-1 self-start rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-sm">
      <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#00245A]/40" />
      <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#00245A]/40 [animation-delay:0.2s]" />
      <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#00245A]/40 [animation-delay:0.4s]" />
    </div>
  )
}

function ChatDemo() {
  const [still] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [step, setStep] = useState(0)
  const [round, setRound] = useState(0)
  const root = useRef(null)

  // Plays the steps on a loop, only while the chat is on screen
  useEffect(() => {
    if (still) return undefined
    let timers = []
    const clear = () => {
      timers.forEach(window.clearTimeout)
      timers = []
    }
    const play = () => {
      clear()
      setStep(0)
      STEPS.forEach((item, index) => {
        if (index) timers.push(window.setTimeout(() => setStep(index), item.at))
      })
      timers.push(window.setTimeout(() => {
        setRound((n) => n + 1)
        play()
      }, LOOP_MS))
    }
    const observer = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : clear()), { threshold: 0.3 })
    if (root.current) observer.observe(root.current)
    return () => {
      observer.disconnect()
      clear()
    }
  }, [still])

  const shown = still ? LAST : step
  const typing = !still && STEPS[shown].typing

  return (
    <div ref={root} className="banner-sheet overflow-hidden rounded-[1.75rem] border border-[#00245A]/8 bg-white shadow-[0_30px_60px_-30px_rgba(0,36,90,0.5)]">
      <div className="flex items-center gap-3 bg-[#00245A] px-4 py-3 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
          <img src={Logo} alt="" className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">PCRED</span>
          <span className="flex items-center gap-1.5 text-[11px] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
            {typing ? 'typing…' : 'WhatsApp'}
          </span>
        </span>
        <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
      </div>

      {/* Fixed height; new messages push older ones up, like a real chat */}
      <div
        key={round}
        className="flex h-[23rem] flex-col justify-end gap-2.5 overflow-hidden bg-[#F4F9FF] bg-[radial-gradient(rgba(0,59,217,0.08)_1px,transparent_1px)] bg-[size:14px_14px] px-4 py-4"
      >
        <div className="chat-in ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#D9FDD3] px-3.5 py-2.5 text-[13px] leading-snug text-[#00245A] shadow-sm">
          Hi, I would like the Know Your Business bundle for my company.
          <Sent time="10:02" />
        </div>

        {shown === 1 ? <Typing /> : null}

        {shown >= 2 ? (
          <div className="chat-in max-w-[88%] self-start rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13px] leading-snug text-[#00245A] shadow-sm">
            Sure! Please share these documents:
            <ul className="mt-2 space-y-1.5">
              {DOCUMENTS.map((name, index) => (
                <li
                  key={name}
                  style={{ animationDelay: `${120 + index * 140}ms` }}
                  className="chat-in flex items-center gap-2 rounded-lg bg-[#F4F9FF] px-2 py-1.5 text-[12px] font-medium"
                >
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[#EAF6FF] text-[#003BD9]">
                    <svg viewBox="0 0 16 16" className="h-3 w-3" fill="none">
                      <path d="M4.5 2h4.5l3 3v9h-7.5zM9 2v3h3" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                    </svg>
                  </span>
                  {name}
                </li>
              ))}
            </ul>
            <span className="mt-1 block text-right text-[10px] text-[#00245A]/40">10:02</span>
          </div>
        ) : null}

        {shown >= 3 ? (
          <div className="chat-in ml-auto w-[78%] rounded-2xl rounded-br-md bg-[#D9FDD3] p-2 text-[#00245A] shadow-sm">
            <ul className="space-y-1">
              {FILES.map((name, index) => (
                <li key={name} className="flex items-center gap-2 rounded-lg bg-white/70 px-2 py-1.5">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#E5484D] text-[8px] font-bold text-white">PDF</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[11.5px] font-semibold">{name}</span>
                    <span className="mt-1 block h-1 overflow-hidden rounded-full bg-[#00245A]/10">
                      <span
                        style={{ animationDelay: `${index * 180}ms` }}
                        className="chat-progress block h-full rounded-full bg-[#25D366]"
                      />
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            <Sent time="10:04" />
          </div>
        ) : null}

        {shown === 4 ? <Typing /> : null}

        {shown >= 5 ? (
          <div className="chat-in max-w-[88%] self-start rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[13px] leading-snug text-[#00245A] shadow-sm">
            Your Know Your Business bundle is ready ✅
            <div className="mt-2 flex items-center gap-2.5 rounded-xl border border-[#00245A]/8 bg-gradient-to-br from-[#F4F9FF] to-[#EAF6FF] p-2">
              <span className="grid h-9 w-8 shrink-0 place-items-center rounded-md bg-gradient-to-br from-[#00B2FC] to-[#003BD9] text-[8px] font-bold text-white">PDF</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold">Know-Your-Business.pdf</span>
                <span className="block text-[10.5px] text-[#00245A]/50">Profile · Research · SWOT · CMA</span>
              </span>
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#00245A] text-white">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                  <path d="M8 2.5v8m0 0-3-3m3 3 3-3M3 13.5h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </div>
            <span className="mt-1 block text-right text-[10px] text-[#00245A]/40">10:09</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default ChatDemo
