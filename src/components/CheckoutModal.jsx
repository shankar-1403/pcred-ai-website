import { useEffect, useRef, useState } from 'react'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { push, ref, serverTimestamp, set } from 'firebase/database'
import { db } from '../lib/firebase'
import { auth } from '../lib/firebaseAuth'
import { formatPrice } from '../lib/cart'
import { formatPhone, isValidEmail, isValidMobile, toE164 } from '../lib/enquiries'

const RESEND_SECONDS = 30

const AUTH_ERRORS = {
  'auth/invalid-phone-number': 'That mobile number does not look right. Check it and try again.',
  'auth/too-many-requests': 'Too many attempts from this device. Please wait a while and try again.',
  'auth/quota-exceeded': 'We cannot send more codes right now. Please try again later.',
  'auth/invalid-verification-code': 'That code is not right. Check the SMS and try again.',
  'auth/code-expired': 'That code has expired. Send a new one.',
  'auth/captcha-check-failed': 'The security check failed. Please try again.',
  'auth/operation-not-allowed': 'Mobile verification is not switched on yet. Please contact us on WhatsApp instead.',
  'auth/billing-not-enabled': 'Mobile verification is not switched on yet. Please contact us on WhatsApp instead.',
  'auth/network-request-failed': 'Could not reach the server. Check your connection and try again.',
}

const describe = (error) => AUTH_ERRORS[error?.code] ?? 'Something went wrong. Please try again.'

const fieldShell =
  'flex items-center gap-3 rounded-2xl border-2 bg-[#F4F9FF] px-3.5 transition focus-within:border-[#00B2FC] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#00B2FC]/15'

const STEPS = ['Your details', 'Verify mobile', 'Done']

// `pricing` holds plain numbers from cartPricing(); items/pricing are copied on open so the
// summary stays put after the cart is cleared.
function CheckoutModal({ items, pricing, onClose, onPlaced }) {
  const [order] = useState(() => ({ items, ...pricing }))
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ name: '', email: '', mobile: '' })
  const [code, setCode] = useState('')
  const [errors, setErrors] = useState({})
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [recaptchaKey, setRecaptchaKey] = useState(0)

  const recaptchaRef = useRef(null)
  const verifierRef = useRef(null)
  const confirmationRef = useRef(null)

  useEffect(() => () => verifierRef.current?.clear(), [])

  useEffect(() => {
    if (secondsLeft <= 0) return undefined
    const timer = window.setTimeout(() => setSecondsLeft((value) => value - 1), 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft])

  const setField = (field) => (event) => {
    const value = field === 'mobile' ? event.target.value.replace(/\D/g, '').slice(0, 10) : event.target.value
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
    setMessage('')
  }

  const saveEnquiry = async (user) => {
    const enquiry = {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: user.phoneNumber,
      uid: user.uid,
      items: order.items.map((item) => ({ id: item.id, name: item.name, suitName: item.suitName, price: item.price })),
      subtotal: order.subtotal,
      discountPercent: order.percent,
      discount: order.discount,
      total: order.total,
      status: 'new',
      createdAt: serverTimestamp(),
    }
    await set(push(ref(db, 'enquiries')), enquiry)
    setStep(2)
    onPlaced()
  }

  // A fresh invisible reCAPTCHA per send: Firebase widgets cannot be reused after they expire
  const sendCode = async () => {
    verifierRef.current?.clear()
    verifierRef.current = new RecaptchaVerifier(auth, recaptchaRef.current, { size: 'invisible' })
    confirmationRef.current = await signInWithPhoneNumber(auth, toE164(form.mobile), verifierRef.current)
    setSecondsLeft(RESEND_SECONDS)
  }

  const onSubmitDetails = async (event) => {
    event.preventDefault()
    const nextErrors = {
      name: form.name.trim() ? undefined : 'Enter your name.',
      email: isValidEmail(form.email.trim()) ? undefined : 'Enter a valid email address.',
      mobile: isValidMobile(form.mobile) ? undefined : 'Enter a valid 10-digit Indian mobile number.',
    }
    setErrors(nextErrors)
    if (Object.values(nextErrors).some(Boolean)) return

    setBusy(true)
    setMessage('')
    try {
      // Already verified this number in this browser: no new code needed
      if (auth.currentUser?.phoneNumber === toE164(form.mobile)) {
        await saveEnquiry(auth.currentUser)
      } else {
        await sendCode()
        setStep(1)
      }
    } catch (error) {
      setMessage(error?.code ? describe(error) : 'Could not save your enquiry. Please try again.')
      setRecaptchaKey((key) => key + 1)
    }
    setBusy(false)
  }

  const onVerify = async (event) => {
    event.preventDefault()
    if (!/^\d{6}$/.test(code)) {
      setErrors({ code: 'Enter the 6-digit code from the SMS.' })
      return
    }
    setBusy(true)
    setMessage('')
    try {
      const { user } = await confirmationRef.current.confirm(code)
      await saveEnquiry(user)
    } catch (error) {
      setMessage(error?.code ? describe(error) : 'Your number is verified, but we could not save the enquiry. Please try again.')
    }
    setBusy(false)
  }

  const onResend = async () => {
    setBusy(true)
    setMessage('')
    setCode('')
    try {
      await sendCode()
      setMessage('A new code is on its way.')
    } catch (error) {
      setMessage(describe(error))
    }
    setBusy(false)
  }

  const itemCount = order.items.length

  return (
    <Overlay label="Checkout" onClose={onClose}>
      <div className="p-6 sm:p-8">
        {/* Progress */}
        <ol className="flex items-center gap-2 pr-10 text-xs font-semibold">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                  index < step ? 'bg-[#25D366] text-white' : index === step ? 'bg-[#00245A] text-white' : 'bg-[#EAF6FF] text-[#00245A]/50'
                }`}
              >
                {index < step ? '✓' : index + 1}
              </span>
              <span className={index === step ? 'text-[#00245A]' : 'hidden text-[#00245A]/45 sm:inline'}>{label}</span>
              {index < STEPS.length - 1 ? <span aria-hidden="true" className="h-px w-5 bg-[#00245A]/15" /> : null}
            </li>
          ))}
        </ol>

        {/* Order summary */}
        <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl bg-[#F4F9FF] px-4 py-3 text-sm">
          <span className="text-[#00245A]/70">
            {itemCount} {itemCount === 1 ? 'bundle' : 'bundles'}
            {order.percent > 0 ? <span className="ml-2 font-semibold text-[#128C4A]">{order.percent}% off applied</span> : null}
          </span>
          <span className="text-lg font-semibold">{formatPrice(order.total)}</span>
        </div>

        {step === 0 ? (
          <form onSubmit={onSubmitDetails} noValidate className="mt-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Where should we reach you?</h2>
              <p className="mt-1 text-sm text-[#00245A]/60">We verify your mobile number with a one-time code.</p>
            </div>

            <Labelled id="checkout-name" label="Full name" error={errors.name}>
              <input
                id="checkout-name"
                value={form.name}
                onChange={setField('name')}
                autoComplete="name"
                placeholder="Priya Shah"
                aria-invalid={errors.name ? 'true' : 'false'}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[#00245A]/35"
              />
            </Labelled>

            <Labelled id="checkout-email" label="Email" error={errors.email}>
              <input
                id="checkout-email"
                type="email"
                value={form.email}
                onChange={setField('email')}
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={errors.email ? 'true' : 'false'}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[#00245A]/35"
              />
            </Labelled>

            <Labelled id="checkout-mobile" label="Mobile number" error={errors.mobile}>
              <span className="border-r border-[#00245A]/10 pr-3 text-sm font-semibold text-[#00245A]/70">+91</span>
              <input
                id="checkout-mobile"
                type="tel"
                inputMode="numeric"
                value={form.mobile}
                onChange={setField('mobile')}
                autoComplete="tel-national"
                placeholder="98765 43210"
                aria-invalid={errors.mobile ? 'true' : 'false'}
                className="min-w-0 flex-1 bg-transparent py-3 text-sm tracking-wide outline-none placeholder:text-[#00245A]/35"
              />
            </Labelled>

            {message ? <Message>{message}</Message> : null}

            <PrimaryButton busy={busy} busyLabel="Please wait…">
              Send OTP
            </PrimaryButton>
            <p className="text-center text-xs text-[#00245A]/45">Protected by reCAPTCHA. Standard SMS rates may apply.</p>
          </form>
        ) : null}

        {step === 1 ? (
          <form onSubmit={onVerify} noValidate className="mt-6 space-y-4">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">Enter the code</h2>
              <p className="mt-1 text-sm text-[#00245A]/60">
                We sent a 6-digit code to <strong className="text-[#00245A]">{formatPhone(toE164(form.mobile))}</strong>.{' '}
                <button
                  type="button"
                  onClick={() => {
                    setStep(0)
                    setCode('')
                    setMessage('')
                  }}
                  className="cursor-pointer font-semibold text-[#003BD9] hover:underline"
                >
                  Change number
                </button>
              </p>
            </div>

            <div>
              <label htmlFor="checkout-code" className="sr-only">
                One-time code
              </label>
              <input
                id="checkout-code"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                  setErrors({})
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="••••••"
                aria-invalid={errors.code ? 'true' : 'false'}
                className={`w-full rounded-2xl border-2 bg-[#F4F9FF] px-4 py-4 text-center font-mono text-2xl font-semibold tracking-[0.5em] outline-none transition focus:border-[#00B2FC] focus:bg-white focus:ring-4 focus:ring-[#00B2FC]/15 ${
                  errors.code ? 'border-[#C2261C]/60' : 'border-[#00245A]/10'
                }`}
              />
              {errors.code ? <p className="mt-1.5 text-xs font-medium text-[#C2261C]">{errors.code}</p> : null}
            </div>

            {message ? <Message>{message}</Message> : null}

            <PrimaryButton busy={busy} busyLabel="Verifying…">
              Verify and place enquiry
            </PrimaryButton>
            <p className="text-center text-sm text-[#00245A]/55">
              Didn&rsquo;t get it?{' '}
              {secondsLeft > 0 ? (
                <span>Resend in {secondsLeft}s</span>
              ) : (
                <button type="button" onClick={onResend} disabled={busy} className="cursor-pointer font-semibold text-[#003BD9] hover:underline disabled:opacity-50">
                  Resend code
                </button>
              )}
            </p>
          </form>
        ) : null}

        {step === 2 ? (
          <div className="mt-8 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E6FAF0] text-[#128C4A]">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7" fill="none">
                <path d="m5 12.5 4.5 4.5L19 7.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <h2 className="mt-5 text-2xl font-semibold tracking-tight">Enquiry received</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-[#00245A]/65">
              Thanks, {form.name.trim().split(' ')[0]}. We&rsquo;ll get in touch on {formatPhone(toE164(form.mobile))} or {form.email.trim()} about
              your order.
            </p>
            <ul className="mx-auto mt-6 max-w-sm divide-y divide-[#00245A]/8 rounded-2xl border border-[#00245A]/8 text-left text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 px-4 py-2.5">
                  <span className="truncate">{item.name}</span>
                  <span className="shrink-0 font-semibold">{formatPrice(item.price)}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={onClose}
              className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-full bg-[#00245A] px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#003BD9]"
            >
              Done
            </button>
          </div>
        ) : null}

        {/* Invisible reCAPTCHA mounts here; the key gives each attempt a clean container */}
        <div key={recaptchaKey} ref={recaptchaRef} />
      </div>
    </Overlay>
  )
}

// Not the native <dialog> used in the CMS: showModal() makes everything outside the dialog
// inert, and Google draws the reCAPTCHA challenge outside it, so customers could not solve it.
function Overlay({ label, onClose, children }) {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  // Runs once: re-running would yank focus back to the first field while the customer types
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement
    document.body.style.overflow = 'hidden'
    panelRef.current?.querySelector('input')?.focus()
    const onKey = (event) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
      previousFocus?.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div aria-hidden="true" onClick={onClose} className="absolute inset-0 bg-[#00245A]/45 backdrop-blur-sm" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="relative max-h-[calc(100svh-2rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-[1.75rem] bg-white text-[#00245A] shadow-[0_40px_100px_-30px_rgba(0,36,90,0.6)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-[#F4F9FF] text-[#00245A]/70 transition hover:bg-[#EAF6FF] hover:text-[#00245A] focus-visible:outline-2 focus-visible:outline-[#00B2FC]"
        >
          <span className="sr-only">Close</span>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  )
}

function Labelled({ id, label, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold">
        {label}
      </label>
      <div className={`${fieldShell} ${error ? 'border-[#C2261C]/60' : 'border-[#00245A]/10'}`}>{children}</div>
      {error ? <p className="mt-1.5 text-xs font-medium text-[#C2261C]">{error}</p> : null}
    </div>
  )
}

function Message({ children }) {
  return (
    <p role="alert" className="rounded-xl border border-[#C2261C]/25 bg-[#FDECEA] px-4 py-3 text-sm text-[#C2261C]">
      {children}
    </p>
  )
}

function PrimaryButton({ busy, busyLabel, children }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="group flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#00B2FC] to-[#003BD9] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_-14px_rgba(0,59,217,0.8)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC] disabled:cursor-wait disabled:opacity-70"
    >
      {busy ? busyLabel : children}
      {busy ? null : (
        <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 transition group-hover:translate-x-0.5">
          <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  )
}

export default CheckoutModal
