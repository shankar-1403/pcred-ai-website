import { Link } from 'react-router'
import { generalEnquireHref } from '../lib/whatsapp'
import WhatsAppIcon from './WhatsAppIcon'
import ChatDemo from './ChatDemo'

function ContactCta() {
  return (
    <section id="contact" className="relative isolate scroll-mt-24 overflow-hidden bg-[#EAF6FF] py-20 sm:py-28">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(rgba(0,59,217,0.14)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent_75%)]"
      />

      <div className="mx-auto w-full max-w-screen-xl px-6">
        <div className="relative isolate overflow-hidden rounded-[2.25rem] border border-white bg-white/80 p-6 shadow-[0_40px_90px_-45px_rgba(0,36,90,0.55)] backdrop-blur sm:p-10 lg:p-14">
          <div
            aria-hidden="true"
            className="banner-mesh pointer-events-none absolute -top-32 -right-24 -z-10 h-96 w-96 rounded-full bg-[#00B2FC]/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="banner-mesh-alt pointer-events-none absolute -bottom-40 -left-24 -z-10 h-96 w-96 rounded-full bg-[#25D366]/15 blur-3xl"
          />

          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-[#128C4A] uppercase">
                <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                Talk to us
              </p>
              <h2 className="mt-5 text-4xl leading-[1.02] font-semibold tracking-[-0.045em] text-[#00245A] sm:text-6xl">
                Need a report?{' '}
                <span className="block bg-gradient-to-r from-[#00B2FC] to-[#003BD9] bg-clip-text pb-[0.1em] text-transparent">Message us.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[#00245A]/65 sm:text-lg">
                Tell us which bundle you need. We’ll share the details on WhatsApp.
              </p>

              <a
                href={generalEnquireHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#00245A] py-2 pr-6 pl-2 text-sm font-semibold text-white shadow-[0_20px_40px_-18px_rgba(0,36,90,0.8)] transition hover:-translate-y-0.5 hover:bg-[#003BD9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                Enquire on WhatsApp
                <svg className="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <Link
                to="/contact"
                onClick={() => window.scrollTo(0, 0)}
                className="mt-4 ml-1 flex w-fit items-center gap-1.5 text-sm font-semibold text-[#003BD9] transition hover:text-[#00245A] sm:mt-0 sm:ml-5 sm:inline-flex"
              >
                Send a detailed enquiry
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            {/* Chat preview */}
            <div aria-hidden="true" className="relative mx-auto w-full max-w-sm">
              <ChatDemo />

              <span className="banner-sheet-alt absolute -top-10 left-2 rounded-2xl border border-white bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#00245A] shadow-[0_12px_24px_-12px_rgba(0,36,90,0.5)] backdrop-blur sm:-left-6">
                Know Your Business
              </span>
              <span className="banner-sheet-alt absolute -bottom-4 left-2 inline-flex items-center gap-1.5 sm:-top-10 sm:bottom-auto sm:left-auto rounded-2xl border border-white bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-[#00245A] shadow-[0_12px_24px_-12px_rgba(0,36,90,0.5)] backdrop-blur sm:-right-6">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[#25D366]/15 text-[#128C4A]">
                  <svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor">
                    <path d="M9.2 1.5 3.5 9h3.8L6.8 14.5 12.5 7H8.7l.5-5.5Z" />
                  </svg>
                </span>
                Report ready in minutes
              </span>
              <span className="banner-sheet absolute -right-3 -bottom-4 rounded-2xl bg-gradient-to-r from-[#00B2FC] to-[#003BD9] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_12px_24px_-12px_rgba(0,59,217,0.7)] sm:-right-6">
                Advisory suites
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactCta
