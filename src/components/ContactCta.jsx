import { Link } from 'react-router'
import Logo from '../assets/favicon.svg'
import { generalEnquireHref } from '../lib/whatsapp'
import WhatsAppIcon from './WhatsAppIcon'

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
                Need a report?
                <span className="block bg-gradient-to-r from-[#00B2FC] to-[#003BD9] bg-clip-text pb-[0.1em] text-transparent">Message us.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-relaxed text-[#00245A]/65 sm:text-lg">
                Tell us which product you need. We’ll share the details on WhatsApp.
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
              <div className="banner-sheet overflow-hidden rounded-[1.75rem] border border-[#00245A]/8 bg-white shadow-[0_30px_60px_-30px_rgba(0,36,90,0.5)]">
                <div className="flex items-center gap-3 bg-[#00245A] px-4 py-3 text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white">
                    <img src={Logo} alt="" className="h-5 w-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">PCRED</span>
                    <span className="flex items-center gap-1.5 text-[11px] text-white/60">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#25D366]" />
                      WhatsApp
                    </span>
                  </span>
                  <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                </div>

                <div className="space-y-3 bg-[#F4F9FF] bg-[radial-gradient(rgba(0,59,217,0.08)_1px,transparent_1px)] bg-[size:14px_14px] px-4 py-5">
                  <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[#D9FDD3] px-3.5 py-2.5 text-[13px] leading-snug text-[#00245A] shadow-sm">
                    Hello, I would like to enquire about your credit report products. Please share the details.
                    <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-[#00245A]/45">
                      Sent
                      <svg viewBox="0 0 16 16" className="h-3 w-3 text-[#00B2FC]">
                        <path d="m1.5 8.5 3 3 6-7M7 11.5l6-7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1 rounded-2xl rounded-bl-md bg-white px-3.5 py-3 shadow-sm">
                    <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#00245A]/40" />
                    <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#00245A]/40 [animation-delay:0.2s]" />
                    <span className="cta-pulse h-1.5 w-1.5 rounded-full bg-[#00245A]/40 [animation-delay:0.4s]" />
                  </div>
                </div>
              </div>

              <span className="banner-sheet-alt absolute -top-10 left-2 rounded-2xl border border-white bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-[#00245A] shadow-[0_12px_24px_-12px_rgba(0,36,90,0.5)] backdrop-blur sm:-left-6">
                Scheme Discovery
              </span>
              <span className="banner-sheet absolute -right-3 -bottom-4 rounded-2xl bg-gradient-to-r from-[#00B2FC] to-[#003BD9] px-3 py-1.5 text-[11px] font-semibold text-white shadow-[0_12px_24px_-12px_rgba(0,59,217,0.7)] sm:-right-6">
                Advisory suits
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ContactCta
