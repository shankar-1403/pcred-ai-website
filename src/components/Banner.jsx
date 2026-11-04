import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import favicon from '../assets/favicon.svg'
import ReportStepsDemo from './ReportStepsDemo'

const NUMBER_PRICE = '₹699'
const UPLOAD_PRICE = '₹499'
const UDYAM_PATTERN = /^UDYAM-[A-Z]{2}-\d{2}-\d{7}$/
const MAX_CERTIFICATE_BYTES = 8 * 1024 * 1024
// The report reads the certificate PDF on the device (src/udyam/lib/read-certificate.js)
const ACCEPTED_TYPES = ['application/pdf']

const MODES = [
  { id: 'number', label: 'Udyam number', price: NUMBER_PRICE },
  { id: 'file', label: 'Certificate', price: UPLOAD_PRICE },
]

const SCHEME_TYPES = ['Central schemes', 'State schemes', 'Subsidies', 'Credit-linked schemes']



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
      setUdyamError('Enter the full Udyam number from your certificate, in the format UDYAM-XX-00-0000000.')
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
          {/* One line at every width: the size steps down with the space available */}
          <h1 className="mt-4 text-[7.6vw] leading-[1.05] font-semibold tracking-[-0.05em] whitespace-nowrap sm:text-5xl lg:text-[2.7rem] xl:text-[3.1rem]">
            Scheme{' '}
            <span className="hero-gradient-text bg-[linear-gradient(100deg,#00B2FC,#003BD9_35%,#00B2FC_60%,#003BD9)] bg-[length:220%_100%] bg-clip-text text-transparent">
              Discovery
            </span>{' '}
            Report
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#00245A]/70 sm:text-lg lg:text-base">
            {/* Phones get one line per part so the longest scheme type never runs off-screen */}
            <span className="block sm:inline">Share your Udyam number or certificate. We read your registration details and prepare a report of the guarantees, subsidies and credit schemes that fit your enterprise.</span>
          </p>

          <form onSubmit={onSubmit} noValidate className="mt-5 w-full max-w-xl text-left">
            {/* No card around it: the two tabs, the field and the button each stand on the page */}
            <div className="relative">
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#00B2FC] to-[#003BD9] px-3 py-1 text-[11px] font-semibold tracking-wide text-white shadow-[0_8px_20px_-8px_rgba(0,59,217,0.8)]">
                <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-white" />
                Start here
              </span>
              <div className="liquid-glass rounded-[2rem] p-3 sm:p-4">
                <div>
                  <div className="flex gap-2" role="group" aria-label="Start the report with">
                    {MODES.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={mode === item.id}
                        onClick={() => selectMode(item.id)}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border-2 px-3 py-2.5 text-sm whitespace-nowrap font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC] ${
                          mode === item.id
                            ? 'border-transparent bg-gradient-to-r from-[#00B2FC] to-[#003BD9] bg-origin-border text-white shadow-[0_12px_24px_-10px_rgba(0,59,217,0.7)]'
                            : 'border-[#00245A]/10 bg-white/60 text-[#00245A]/55 hover:border-[#00B2FC]/50 hover:text-[#00245A]'
                        }`}
                      >
                        {item.label}
                        <span
                          className={`hidden rounded-full px-2 py-0.5 font-mono text-xs font-bold sm:inline ${
                            mode === item.id ? 'bg-[#FFD84D] text-[#003BD9]' : 'bg-white/70 text-[#00245A]/50'
                          }`}
                        >
                          {item.price}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-col gap-2.5 sm:flex-row">
                    {mode === 'number' ? (
                      <label
                        htmlFor="udyam_no"
                        className={`flex min-h-14 min-w-0 flex-1 cursor-text items-center rounded-full border-2 bg-white px-5 py-3 shadow-[0_10px_24px_-12px_rgba(0,36,90,0.45)] transition focus-within:border-[#00B2FC] focus-within:ring-4 focus-within:ring-[#00B2FC]/20 ${
                          udyamError ? 'border-[#C2261C]/60' : 'border-[#00245A]/15 hover:border-[#00B2FC]/70'
                        }`}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="sr-only">Udyam registration number</span>
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
                            placeholder="Enter your Udyam number"
                            aria-invalid={udyamError ? 'true' : 'false'}
                            aria-describedby="udyam_format"
                            className="w-full bg-transparent font-mono text-base font-semibold tracking-wide text-[#00245A] uppercase outline-none placeholder:font-sans placeholder:font-medium placeholder:tracking-normal placeholder:normal-case placeholder:text-[#00245A]/50"
                          />
                        </span>
                      </label>
                    ) : (
                      <label
                        htmlFor="udyam_certificate"
                        className={`flex min-h-14 min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-full border-2 border-dashed bg-white px-4 py-2 shadow-[0_10px_24px_-12px_rgba(0,36,90,0.45)] transition hover:border-[#00B2FC] has-[:focus-visible]:border-[#00B2FC] has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-[#00B2FC]/20 ${
                          fileError ? 'border-[#C2261C]/60' : 'border-[#00245A]/20'
                        }`}
                      >
                        <span className="sr-only">Udyam certificate</span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EAF6FF] text-[#003BD9]">
                          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4.5 w-4.5">
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
                      className="group relative inline-flex min-h-14 shrink-0 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] px-7 py-3.5 sm:min-w-36 shadow-[0_14px_30px_-12px_rgba(91,33,182,0.7)] text-sm font-semibold text-white transition hover:from-[#6366F1] hover:to-[#8B5CF6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED]"
                    >
                      <span aria-hidden="true" className="btn-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent" />
                      {mode === 'number' ? 'Verify' : 'Upload'}
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 transition group-hover:translate-x-0.5">
                        <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                  {mode === 'number' ? (
                    <p id="udyam_format" className="mt-2 px-5 text-xs text-[#00245A]/60">
                      Format: <span className="font-mono">UDYAM-XX-00-0000000</span>, as on your Udyam certificate
                    </p>
                  ) : null}
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

        {/* How it works: a looping walk-through of the report's steps */}
        <div className="flex w-full max-w-xl flex-col gap-2 justify-self-center lg:justify-self-end">
          <figure className="relative overflow-hidden rounded-[2rem] border border-white bg-white/70 p-2 shadow-[0_40px_80px_-40px_rgba(0,36,90,0.55)] backdrop-blur">
            <div className="flex items-center gap-3 px-3 pt-1 pb-2.5">
              <span aria-hidden="true" className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#00245A]/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#00245A]/15" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#00B2FC]" />
              </span>
              <figcaption className="min-w-0 flex-1 truncate text-xs font-semibold text-[#00245A]/70">
                How the Scheme Discovery report works
              </figcaption>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FDECEA] px-2 py-0.5 font-mono text-[10px] font-semibold text-[#C2261C]">
                <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#C2261C]" />
                4 steps
              </span>
            </div>
            <div className="relative aspect-[5/4] overflow-hidden rounded-[1.5rem] bg-[#00245A] sm:aspect-video lg:aspect-[16/10]">
              <ReportStepsDemo />
            </div>
          </figure>
        </div>
      </div>
    </section>
  )
}

export default Banner
