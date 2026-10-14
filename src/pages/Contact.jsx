import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import Logo from '../assets/favicon.svg'
import { suits } from '../lib/suits'
import { suitIcon } from '../lib/suitIcons'
import { WHATSAPP_NUMBER, generalEnquireHref, whatsappHref } from '../lib/whatsapp'
import WhatsAppIcon from '../components/WhatsAppIcon'

const GENERAL_TOPIC = 'General enquiry'

// 912235120060 -> +91 22 3512 0060
const displayNumber = `+${WHATSAPP_NUMBER.slice(0, 2)} ${WHATSAPP_NUMBER.slice(2, 4)} ${WHATSAPP_NUMBER.slice(4, 8)} ${WHATSAPP_NUMBER.slice(8)}`

const CHECKLIST = [
  'The product or suit you are interested in',
  'Your Udyam number, if you have one',
  'A good time for us to reply',
]

const inputClass =
  'w-full rounded-xl border border-[#00245A]/12 bg-white px-4 py-3 text-sm text-[#00245A] outline-none transition placeholder:text-[#00245A]/40 focus:border-[#00B2FC] focus:ring-4 focus:ring-[#00B2FC]/15'

function buildMessage({ name, business, topic, message }) {
  const lines = [`Hello, I'm ${name.trim()}${business.trim() ? ` from ${business.trim()}` : ''}.`]
  lines.push(topic === GENERAL_TOPIC ? 'I have a general enquiry.' : `I would like to enquire about the ${topic}.`)
  if (message.trim()) lines.push(message.trim())
  lines.push('Please share the details.')
  return lines.join('\n')
}

function Contact() {
  const [form, setForm] = useState({ name: '', business: '', topic: GENERAL_TOPIC, message: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const update = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    if (field === 'name' && error) setError('')
  }

  const onSubmit = (event) => {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Add your name so we know who we are talking to.')
      return
    }
    window.open(whatsappHref(buildMessage(form)), '_blank', 'noopener,noreferrer')
  }

  return (
    <main className="relative isolate overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F9FF_50%,#EAF6FF_100%)] pt-28 text-[#00245A]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_60%_55%_at_50%_0%,rgba(0,178,252,0.2),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(0,59,217,0.14)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_55%_40%_at_50%_10%,black,transparent_75%)]" />
      </div>

      <section className="mx-auto w-full max-w-screen-xl px-6 pt-10 pb-20 sm:pt-14 sm:pb-28">
        <div className="mx-auto max-w-2xl text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-[#128C4A] uppercase">
            <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#25D366]" />
            Talk to us
          </p>
          <h1 className="mt-5 text-4xl leading-[1.02] font-semibold tracking-[-0.045em] sm:text-6xl">
            Tell us what you need.{' '}
            <span className="bg-gradient-to-r from-[#00B2FC] to-[#003BD9] bg-clip-text pb-[0.1em] text-transparent">
              We’ll reply on WhatsApp.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-[#00245A]/65 sm:text-lg">
            Pick a product or suit, add a note, and the message opens in WhatsApp ready to send.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-6">
          {/* Direct channel */}
          <aside className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:flex lg:flex-col">
            <div className="relative isolate overflow-hidden rounded-[2rem] bg-[#00245A] p-6 md:col-span-2 text-white shadow-[0_30px_60px_-30px_rgba(0,36,90,0.7)] sm:p-8">
              <span aria-hidden="true" className="absolute -top-20 -right-20 -z-10 h-56 w-56 rounded-full bg-[#25D366]/30 blur-3xl" />
              <span aria-hidden="true" className="absolute -bottom-24 -left-16 -z-10 h-56 w-56 rounded-full bg-[#00B2FC]/30 blur-3xl" />
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#25D366]">
                  <WhatsAppIcon className="h-6 w-6" />
                </span>
                <span>
                  <span className="block font-mono text-[10px] tracking-[0.22em] text-white/50 uppercase">WhatsApp</span>
                  <span className="block text-lg font-semibold tracking-tight">{displayNumber}</span>
                </span>
              </div>
              <p className="mt-5 text-sm leading-relaxed text-white/65">
                In a hurry? Skip the form and start a chat with a ready-made message.
              </p>
              <a
                href={generalEnquireHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[#00245A] transition hover:bg-[#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start a chat
                <svg className="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>

            <div className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_24px_50px_-36px_rgba(0,36,90,0.5)] backdrop-blur sm:p-8">
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#003BD9] uppercase">Helps us reply faster</p>
              <ul className="mt-4 space-y-3">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#00245A]/75">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00B2FC]/15 text-[#003BD9]">
                      <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3">
                        <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[2rem] border border-white bg-white/80 p-6 shadow-[0_24px_50px_-36px_rgba(0,36,90,0.5)] backdrop-blur sm:p-8">
              <p className="font-mono text-[10px] tracking-[0.22em] text-[#003BD9] uppercase">Browse first</p>
              <ul className="mt-4 space-y-2">
                {suits.map((suit) => {
                  const icon = suitIcon(suit.slug)
                  return (
                    <li key={suit.slug}>
                      <Link
                        to={`/suits/${suit.slug}`}
                        className="group flex items-center gap-3 rounded-2xl p-2 transition hover:bg-[#F4F9FF]"
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${icon.badge}`}>
                          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
                            <path d={icon.path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-semibold">{suit.name}</span>
                        <svg className="h-4 w-4 text-[#003BD9] transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          </aside>

          {/* Enquiry form */}
          <form
            onSubmit={onSubmit}
            noValidate
            className="relative rounded-[2rem] border border-white bg-white/90 p-6 shadow-[0_40px_80px_-45px_rgba(0,36,90,0.6)] backdrop-blur sm:p-10"
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-10 -top-px h-px bg-gradient-to-r from-transparent via-[#00B2FC] to-transparent"
            />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF6FF]">
                <img src={Logo} alt="" className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-semibold tracking-tight">Send an enquiry</h2>
                <p className="text-sm text-[#00245A]/55">Opens WhatsApp with your message filled in.</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="contact_name" className="mb-2 block text-sm font-medium">
                  Your name
                </label>
                <input
                  id="contact_name"
                  value={form.name}
                  onChange={update('name')}
                  autoComplete="name"
                  placeholder="Priya Shah"
                  aria-invalid={error ? 'true' : 'false'}
                  aria-describedby={error ? 'contact_error' : undefined}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="contact_business" className="mb-2 block text-sm font-medium">
                  Business name <span className="font-normal text-[#00245A]/45">(optional)</span>
                </label>
                <input
                  id="contact_business"
                  value={form.business}
                  onChange={update('business')}
                  autoComplete="organization"
                  placeholder="Shah Textiles"
                  className={inputClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="contact_topic" className="mb-2 block text-sm font-medium">
                  What is it about?
                </label>
                <div className="relative">
                  <select
                    id="contact_topic"
                    value={form.topic}
                    onChange={update('topic')}
                    className={`${inputClass} cursor-pointer appearance-none pr-10`}
                  >
                    <option>{GENERAL_TOPIC}</option>
                    {suits.map((suit) => (
                      <optgroup key={suit.slug} label={suit.name}>
                        <option value={suit.name}>{suit.name} (whole suit)</option>
                        {suit.products.map((product) => (
                          <option key={product.name}>{product.name}</option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 16 16"
                    className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-[#00245A]/50"
                  >
                    <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="contact_message" className="mb-2 block text-sm font-medium">
                  Message <span className="font-normal text-[#00245A]/45">(optional)</span>
                </label>
                <textarea
                  id="contact_message"
                  value={form.message}
                  onChange={update('message')}
                  rows={5}
                  placeholder="Anything we should know before we reply"
                  className={`${inputClass} resize-y`}
                />
              </div>
            </div>

            <div aria-live="polite" className="min-h-6 pt-3 text-sm">
              {error ? (
                <p id="contact_error" className="font-medium text-[#C2261C]">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="mt-2 flex flex-col-reverse items-start gap-4 border-t border-[#00245A]/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#00245A]/50">Nothing is sent until you press send in WhatsApp.</p>
              <button
                type="submit"
                className="group inline-flex cursor-pointer items-center gap-3 rounded-full bg-[#00245A] py-2 pr-6 pl-2 text-sm font-semibold text-white shadow-[0_20px_40px_-18px_rgba(0,36,90,0.8)] transition hover:bg-[#003BD9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366]">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                Continue in WhatsApp
                <svg className="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  )
}

export default Contact
