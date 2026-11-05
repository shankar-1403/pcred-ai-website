import { Link } from 'react-router'
import Logo from '../assets/pcred_logo.webp'
import { COMPANY } from '../lib/company'
import { useSuits } from '../lib/suitsStore'
import { WHATSAPP_NUMBER, generalEnquireHref } from '../lib/whatsapp'

const explore = [
  { to: '/', label: 'Home' },
  { to: '/about', label: 'About us' },
  { to: '/contact', label: 'Contact us' },
]

// Every policy page; Cashfree's website review looks for each of these
const legal = [
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms & Conditions' },
  { to: '/refund-policy', label: 'Refund & Cancellation' },
  { to: '/shipping-policy', label: 'Shipping & Delivery' },
]

// More than this many categories collapses into a "View all" link
const FOOTER_CATEGORY_LIMIT = 6

// 918655680340 -> +91 86556 80340
const displayNumber = `+${WHATSAPP_NUMBER.slice(0, 2)} ${WHATSAPP_NUMBER.slice(2, 7)} ${WHATSAPP_NUMBER.slice(7)}`

function Footer() {
  const { suits, loading } = useSuits()
  return (
    <footer className="relative isolate overflow-hidden bg-[#00245A] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00B2FC]/60 to-transparent" />
        <div className="absolute -top-40 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-[#00B2FC]/20 blur-[120px]" />
        <div className="absolute bottom-[-30%] left-[-10%] h-[26rem] w-[26rem] rounded-full bg-[#003BD9]/60 blur-[120px]" />
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-6 pt-16 sm:pt-20">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] md:gap-12">
          <div className="col-span-2 max-w-xs md:col-span-1">
            <Link to="/" className="inline-flex rounded-2xl bg-white px-3 py-2">
              <img src={Logo} alt="PCRED" className="h-8" />
            </Link>
            <p className="mt-5 text-sm leading-relaxed text-white/60">
              Credit reports, scheme discovery, and advisory suites for businesses.
            </p>
            
          </div>

          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-[#C4B5FD] uppercase">Explore</p>
            <ul className="mt-5 space-y-3 text-sm">
              {explore.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-white/70 transition hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-[#5EEAD4] uppercase">Categories</p>
            <ul className="mt-5 space-y-3 text-sm">
              {loading ? (
                <li aria-hidden="true" className="h-4 w-32 animate-pulse rounded bg-white/10" />
              ) : suits.length === 0 ? (
                <li className="text-white/45">Coming soon</li>
              ) : (
                suits.slice(0, FOOTER_CATEGORY_LIMIT).map((suit) => (
                  <li key={suit.slug}>
                    <Link to={`/suits/${suit.slug}`} className="text-white/70 transition hover:text-white">
                      {suit.name}
                    </Link>
                  </li>
                ))
              )}
              {suits.length > FOOTER_CATEGORY_LIMIT ? (
                <li>
                  <Link to="/#categories" className="inline-flex items-center gap-1.5 font-semibold text-[#00B2FC] transition hover:text-white">
                    View all {suits.length}
                    <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                      <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </li>
              ) : null}
            </ul>
          </div>

          <div>
            <p className="font-mono text-[11px] tracking-[0.22em] text-[#FCD34D] uppercase">Contact</p>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <a
                  href={generalEnquireHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 transition hover:text-white"
                >
                  {displayNumber}
                </a>
              </li>
              <li className="text-white/50">WhatsApp enquiries</li>
              {COMPANY.email ? (
                <li>
                  <a href={`mailto:${COMPANY.email}`} className="break-all text-white/70 transition hover:text-white">
                    {COMPANY.email}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="mt-14 border-t border-white/10 pt-6 text-xs leading-relaxed text-white/50">
          <p>
            PCRED ({COMPANY.website}) is owned and operated by <span className="text-white/70">{COMPANY.name}</span>
            {COMPANY.gstin ? ` · GSTIN ${COMPANY.gstin}` : ''}
          </p>
          <p className="mt-1">Address: {COMPANY.address}</p>
        </div>
        <div className="mt-4 flex flex-col gap-4 pb-6 text-xs text-white/50 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
            <p>© {new Date().getFullYear()} {COMPANY.name}. All rights reserved.</p>
            <nav aria-label="Legal" className="flex flex-wrap gap-x-5 gap-y-2">
              {legal.map((item) => (
                <Link key={item.to} to={item.to} className="transition hover:text-white">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="group inline-flex cursor-pointer items-center gap-2 transition hover:text-white"
          >
            Back to top
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 transition group-hover:border-[#00B2FC] group-hover:bg-[#00B2FC] group-hover:text-[#00245A]">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 19V5M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </footer>
  )
}

export default Footer
