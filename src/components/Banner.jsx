import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import favicon from '../assets/favicon.svg'
import YouTubeVideo from './YouTubeVideo'

const NUMBER_PRICE = '₹699'
const UPLOAD_PRICE = '₹499'
const YOUTUBE_VIDEO_ID = 'SRf3nprZkQ8?si=C7znsfTy0IHxzj01'
const UDYAM_PATTERN = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/
const MAX_CERTIFICATE_BYTES = 8 * 1024 * 1024
// The report reads the certificate PDF on the device (src/udyam/lib/read-certificate.js)
const ACCEPTED_TYPES = ['application/pdf']

const MODES = [
  { id: 'number', label: 'Udyam number', price: NUMBER_PRICE },
  { id: 'file', label: 'Certificate', price: UPLOAD_PRICE },
]

const SCHEME_TYPES = ['Central schemes', 'State schemes', 'Subsidies', 'Credit-linked schemes']

const STEPS = ['Add Udyam details', 'We match schemes', 'Get the report']


function formatUdyam(value) {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!compact) return ''

  const prefix = 'UDYAM'
  if (prefix.startsWith(compact)) return compact

  const rest = compact.startsWith(prefix) ? compact.slice(prefix.length) : compact
  let index = 0
  let state = ''
  while (index < rest.length && state.length < 2 && /[A-Z]/.test(rest[index])) {
    state += rest[index]
    index += 1
  }

  let digits = ''
  while (index < rest.length && digits.length < 9) {
    if (/\d/.test(rest[index])) digits += rest[index]
    index += 1
  }

  let formatted = prefix
  if (state || digits) formatted += `-${state}`
  if (digits) formatted += `-${digits.slice(0, 2)}`
  if (digits.length > 2) formatted += `-${digits.slice(2)}`
  return formatted
}

function Banner() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('number')
  const [udyam, setUdyam] = useState('')
  const [udyamError, setUdyamError] = useState('')
  const [certificate, setCertificate] = useState(null)
  const [fileError, setFileError] = useState('')
  const [notice, setNotice] = useState('')
  const [schemeIndex, setSchemeIndex] = useState(0)

  // Cycles the highlighted scheme type; stays on the first one for reduced motion
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const timer = window.setInterval(() => setSchemeIndex((index) => (index + 1) % SCHEME_TYPES.length), 2400)
    return () => window.clearInterval(timer)
  }, [])

  const selectMode = (next) => {
    setMode(next)
    setUdyamError('')
    setFileError('')
    setNotice('')
  }

  const onVerify = () => {
    if (!UDYAM_PATTERN.test(udyam)) {
      setUdyamError('Enter a full Udyam number, like UDYAM-MH-26-0048217.')
      setNotice('')
      return
    }
    setUdyamError('')
    // The report page continues from here: saved report check, mobile OTP, then payment
    navigate('/report', { state: { udyam } })
  }

  const onFileChange = (event) => {
    const next = event.target.files?.[0] ?? null
    if (!next) {
      setCertificate(null)
      setFileError('')
      return
    }

    const allowed = ACCEPTED_TYPES.includes(next.type) || /\.pdf$/i.test(next.name)
    if (!allowed) {
      event.target.value = ''
      setCertificate(null)
      setFileError('Upload the Udyam certificate as a PDF.')
      setNotice('')
      return
    }
    if (next.size > MAX_CERTIFICATE_BYTES) {
      event.target.value = ''
      setCertificate(null)
      setFileError('That file is over 8 MB. Choose a smaller certificate.')
      setNotice('')
      return
    }

    setCertificate(next)
    setFileError('')
  }

  const onUpload = () => {
    if (!certificate) {
      setFileError('Choose a Udyam certificate before uploading.')
      setNotice('')
      return
    }
    setFileError('')
    navigate('/report', { state: { certificate } })
  }

  const onSubmit = (event) => {
    event.preventDefault()
    if (mode === 'number') onVerify()
    else onUpload()
  }

  const error = mode === 'number' ? udyamError : fileError
  const active = MODES.find((item) => item.id === mode)


  return (
    <section
      id="top"
      className="relative isolate overflow-clip bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F9FF_60%,#EAF6FF_100%)] text-[#00245A]"
    >
      {/* Backdrop */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="hero-aurora absolute top-[-25%] right-[-30%] h-[40rem] w-[40rem] rounded-full opacity-35 blur-[110px] lg:top-[-20%] lg:right-[-15%] lg:h-[52rem] lg:w-[52rem] lg:opacity-55" />
        <div className="absolute bottom-[-30%] left-[-15%] h-[34rem] w-[34rem] rounded-full bg-[#00B2FC]/15 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,59,217,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(0,59,217,0.06)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_80%_70%_at_30%_30%,black,transparent_75%)]" />
        <img
          src={favicon}
          alt=""
          className="absolute -bottom-24 -left-24 w-[26rem] max-w-none opacity-[0.05] select-none"
        />
      </div>

      <div className="mx-auto grid w-full grid-cols-1 max-w-screen-xl items-center gap-8 px-6 pt-24 pb-8 sm:pt-28 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-12 lg:pt-22 lg:pb-4">
        {/* Copy + form */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#00245A]/10 bg-white/80 py-1 pr-3.5 pl-1 shadow-[0_8px_24px_-16px_rgba(0,36,90,0.5)] backdrop-blur">
            <span className="rounded-full bg-[#00245A] px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-[#00B2FC] uppercase">
              New
            </span>
            <span className="text-xs font-medium text-[#00245A]/80">Scheme discovery for Udyam businesses</span>
          </p>

          <h1 className="mt-4 text-[2.9rem] leading-[0.95] font-semibold tracking-[-0.06em] sm:text-7xl lg:text-[3.5rem] xl:text-[3.75rem]">
            Scheme{' '}
            <span className="block">
              <span className="hero-gradient-text bg-[linear-gradient(100deg,#00B2FC,#003BD9_35%,#00B2FC_60%,#003BD9)] bg-[length:220%_100%] bg-clip-text text-transparent">
                Discovery
              </span>{' '}
            </span>
            <span className="flex items-center justify-center gap-3 lg:justify-start">
              Report
              <span
                aria-hidden="true"
                className="hidden h-[0.72em] w-[1.5em] items-center justify-center rounded-full bg-gradient-to-r from-[#00B2FC] to-[#003BD9] text-white shadow-[0_12px_24px_-10px_rgba(0,59,217,0.7)] sm:inline-flex"
              >
                <svg viewBox="0 0 24 24" className="h-[0.42em] w-[0.42em] -rotate-45" fill="none">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#00245A]/70 sm:text-lg lg:text-base">
            {/* Phones get one line per part so the longest scheme type never runs off-screen */}
            <span className="block sm:inline">Share your Udyam number or certificate. We read your registration details and prepare a report of the guarantees, subsidies and credit schemes that fit your enterprise.</span>
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-5 w-full max-w-xl text-left">
            <div className="relative">
              <div
                aria-hidden="true"
                className="form-glow pointer-events-none absolute -inset-3 rounded-[2.25rem] bg-gradient-to-r from-[#00B2FC]/60 via-[#3D7BFF]/40 to-[#00B2FC]/60 blur-2xl"
              />
              <span className="absolute -top-3 left-6 z-20 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00B2FC] to-[#003BD9] px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-[0_8px_20px_-8px_rgba(0,59,217,0.8)]">
                <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-white" />
                Start here
              </span>
              <div className="relative overflow-clip rounded-[1.75rem] bg-gradient-to-r from-[#00B2FC]/70 to-[#003BD9]/60 p-[3px] shadow-[0_30px_60px_-28px_rgba(0,36,90,0.6)]">
                <div aria-hidden="true" className="form-ring absolute top-1/2 left-1/2 -mt-[75%] -ml-[75%] aspect-square w-[150%]" />
                <div className="relative rounded-[calc(1.75rem-3px)] bg-white p-2.5 pt-4">
                  <div className="flex gap-1 rounded-2xl bg-[#EAF6FF] p-1" role="group" aria-label="Start the report with">
                    {MODES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={mode === item.id}
                        onClick={() => selectMode(item.id)}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm whitespace-nowrap font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC] ${
                          mode === item.id
                            ? 'bg-white text-[#00245A] shadow-[0_6px_16px_-8px_rgba(0,36,90,0.5)]'
                            : 'text-[#00245A]/55 hover:text-[#00245A]'
                        }`}
                      >
                        {item.label}
                        <span
                          className={`hidden rounded-full px-2 py-0.5 font-mono text-xs font-bold sm:inline ${
                            mode === item.id ? 'bg-[#00B2FC]/15 text-[#003BD9]' : 'bg-white/70 text-[#00245A]/50'
                          }`}
                        >
                          {item.price}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    {mode === 'number' ? (
                      <label
                        htmlFor="udyam_no"
                        className={`flex min-w-0 flex-1 cursor-text items-center gap-3 rounded-2xl border-2 bg-[#F4F9FF] px-3 py-2 transition focus-within:border-[#00B2FC] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#00B2FC]/20 ${
                          udyamError ? 'border-[#C2261C]/60' : 'border-[#00B2FC]/40 hover:border-[#00B2FC]/80'
                        }`}
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#003BD9] shadow-[0_4px_12px_-6px_rgba(0,59,217,0.5)]">
                          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5">
                            <circle cx="9" cy="9" r="5.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
                            <path d="m13.2 13.2 3.3 3.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[10px] font-semibold tracking-[0.14em] text-[#003BD9] uppercase">
                            Udyam registration number
                          </span>
                          <input
                            id="udyam_no"
                            name="udyam_no"
                            value={udyam}
                            onChange={(event) => {
                              setUdyam(formatUdyam(event.target.value))
                              if (udyamError) setUdyamError('')
                            }}
                            inputMode="text"
                            autoCapitalize="characters"
                            autoCorrect="off"
                            spellCheck={false}
                            autoComplete="off"
                            placeholder="UDYAM-MH-26-0048217"
                            aria-invalid={udyamError ? 'true' : 'false'}
                            className="w-full bg-transparent pt-0.5 font-mono text-base font-semibold tracking-wide text-[#00245A] uppercase outline-none placeholder:font-medium placeholder:text-[#00245A]/45"
                          />
                        </span>
                      </label>
                    ) : (
                      <label
                        htmlFor="udyam_certificate"
                        className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl border-2 border-dashed bg-[#F4F9FF] px-3 py-2 transition hover:border-[#00B2FC] hover:bg-white has-[:focus-visible]:border-[#00B2FC] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#00B2FC]/20 ${
                          fileError ? 'border-[#C2261C]/60' : 'border-[#00B2FC]/50'
                        }`}
                      >
                        <span className="sr-only">Udyam certificate</span>
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#003BD9] shadow-[0_4px_12px_-6px_rgba(0,59,217,0.5)]">
                          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-5 w-5">
                            <path d="M6 2.5h5.5L15 6v11.5H6z M11 2.5V6.5h4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block truncate text-sm font-semibold ${certificate ? 'text-[#00245A]' : 'text-[#00245A]/80'}`}>
                            {certificate ? certificate.name : 'Choose the Udyam certificate'}
                          </span>
                          <span className="block text-xs text-[#00245A]/55">PDF up to 8 MB, read on your device</span>
                        </span>
                        <input
                          id="udyam_certificate"
                          name="udyam_certificate"
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={onFileChange}
                          className="sr-only"
                        />
                      </label>
                    )}

                    <button
                      type="submit"
                      className="group relative inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl bg-[#00245A] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#003BD9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]"
                    >
                      <span aria-hidden="true" className="btn-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                      {mode === 'number' ? 'Verify' : 'Upload'}
                      <span className="font-mono text-base font-bold text-[#00B2FC]">
                        <span className="sr-only">for </span>
                        {active.price}
                      </span>
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 transition group-hover:translate-x-0.5">
                        <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div aria-live="polite" className="min-h-6 px-2 pt-3 text-center text-sm lg:text-left">
              {error ? (
                <p className="font-medium text-[#C2261C]">{error}</p>
              ) : notice ? (
                <p className="font-medium text-[#003BD9]">{notice}</p>
              ) : null}
            </div>
          </form>
        </div>

        {/* Video + steps */}
        <div className="flex w-full max-w-xl flex-col gap-2 justify-self-center lg:justify-self-end">
          <figure className="relative overflow-hidden rounded-[2rem] border border-white bg-white/70 p-2 shadow-[0_40px_80px_-40px_rgba(0,36,90,0.55)] backdrop-blur">
            <div className="flex items-center gap-3 px-3 pt-1 pb-2.5">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00245A]/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#00245A]/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#00B2FC]" />
              </span>
              <figcaption className="min-w-0 flex-1 truncate text-xs font-semibold text-[#00245A]/70">
                Watch the Scheme Discovery report
              </figcaption>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEA] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#C2261C]">
                <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#C2261C]" />
                Video
              </span>
            </div>
            <div className="relative aspect-video overflow-hidden rounded-[1.5rem] bg-[#00245A]">
              <YouTubeVideo videoId={YOUTUBE_VIDEO_ID} title="PCRED Foundation Day 2025" />
            </div>
          </figure>
          <ol className="grid grid-cols-3 gap-2" aria-label="How it works">
            {STEPS.map((step, index) => (
              <li
                key={step}
                className="flex flex-col items-center gap-1 rounded-2xl border border-[#00245A]/6 bg-white/60 px-2 py-2 text-center backdrop-blur sm:items-start sm:px-4 sm:text-left"
              >
                <span className="font-mono text-[10px] font-semibold text-[#00B2FC]">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-xs leading-tight font-semibold text-[#00245A]/80">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

export default Banner
