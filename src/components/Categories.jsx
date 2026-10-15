import { Link } from 'react-router'
import { useSuits } from '../lib/suitsStore'
import { suitIcon } from '../lib/suitIcons'


// Feeds the cursor position to the tile's spotlight layer
function trackSpotlight(event) {
  const rect = event.currentTarget.getBoundingClientRect()
  event.currentTarget.style.setProperty('--x', `${event.clientX - rect.left}px`)
  event.currentTarget.style.setProperty('--y', `${event.clientY - rect.top}px`)
}

function ArrowIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Categories() {
  const { suits, loading } = useSuits()
  const productCount = suits.reduce((total, suit) => total + suit.products.length, 0)
  return (
    <section id="categories" className="relative isolate scroll-mt-24 overflow-hidden bg-[#00245A] py-16 text-white sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent_75%)]" />
        <div className="absolute -top-40 left-1/4 h-[26rem] w-[40rem] rounded-full bg-[#00B2FC]/20 blur-[120px]" />
        <div className="absolute -right-20 -bottom-40 h-[24rem] w-[24rem] rounded-full bg-[#003BD9]/60 blur-[120px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#00B2FC]/50 to-transparent" />
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-6">
        {/* Header row */}
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-[#00B2FC] uppercase">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00B2FC]" />
              Categories
            </p>
            <h2 className="mt-5 text-3xl leading-[1.05] font-semibold tracking-[-0.04em] sm:text-[2.75rem]">
              Pick a suit, then open{' '}
              <span className="bg-gradient-to-r from-[#00B2FC] to-[#9BE3FF] bg-clip-text whitespace-nowrap text-transparent">its bundles</span>
            </h2>
            <p className="mt-4 max-w-md text-base leading-relaxed text-white/60">
              Advisory suits, separate from the credit reports. Each one opens its own bundles.
            </p>
          </div>

          <dl className="flex shrink-0 gap-8 rounded-2xl border border-white/10 bg-white/[0.04] px-6 py-4">
            <div>
              <dt className="font-mono text-[10px] tracking-[0.2em] text-white/45 uppercase">Suits</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight">{String(suits.length).padStart(2, '0')}</dd>
            </div>
            <div className="border-l border-white/10 pl-8">
              <dt className="font-mono text-[10px] tracking-[0.2em] text-white/45 uppercase">Bundles</dt>
              <dd className="mt-1 text-3xl font-semibold tracking-tight">{String(productCount).padStart(2, '0')}</dd>
            </div>
          </dl>
        </div>

        {/* Category grid: grows by rows as suits are added */}
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loading
            ? [0, 1].map((key) => (
                <li key={`loading-${key}`} aria-hidden="true" className="h-64 animate-pulse rounded-3xl border border-white/10 bg-white/[0.05]" />
              ))
            : null}
          {suits.map((suit, index) => {
            const icon = suitIcon(suit.icon)
            return (
              <li key={suit.slug}>
                <Link
                  to={`/suits/${suit.slug}`}
                  onMouseMove={trackSpotlight}
                  className="group relative isolate flex h-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition duration-300 hover:-translate-y-1 hover:border-[#00B2FC]/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00B2FC]"
                >
                  <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(320px_circle_at_var(--x,50%)_var(--y,0%),rgba(0,178,252,0.2),transparent_60%)] opacity-0 transition duration-300 group-hover:opacity-100"
                  />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-6 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-[#00B2FC] to-transparent transition-transform duration-500 group-hover:scale-x-100"
                  />

                  <span className="flex items-start justify-between gap-4">
                    <span
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_12px_24px_-12px_rgba(0,178,252,0.8)] transition duration-300 group-hover:scale-105 group-hover:-rotate-6 ${icon.badge}`}
                    >
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
                        <path d={icon.path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span
                      aria-hidden="true"
                      className="bg-gradient-to-b from-white/30 to-white/0 bg-clip-text text-5xl leading-none font-semibold tracking-[-0.06em] text-transparent"
                    >
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </span>

                  <span className="mt-6 text-xl font-semibold tracking-tight">{suit.name}</span>
                  <span className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-white/55">{suit.summary}</span>

                  <span className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <span className="font-mono text-[11px] tracking-wide text-white/60">{suit.products.length} {suit.products.length === 1 ? 'bundle' : 'bundles'}</span>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 transition duration-300 group-hover:border-[#00B2FC] group-hover:bg-[#00B2FC] group-hover:text-[#00245A]">
                      <span className="sr-only">View bundles</span>
                      <ArrowIcon className="h-4 w-4 -rotate-45 transition duration-300 group-hover:rotate-0" />
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}

          <li>
            <Link
              to="/contact"
              onClick={() => window.scrollTo(0, 0)}
              className="group flex h-full flex-col justify-between gap-6 rounded-3xl border border-dashed border-white/20 p-6 transition duration-300 hover:border-[#25D366]/60 hover:bg-white/[0.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00B2FC]"
            >
              <span>
                <span className="font-mono text-[10px] tracking-[0.22em] text-white/45 uppercase">Need a hand?</span>
                <span className="mt-3 block text-xl font-semibold tracking-tight">Not sure which suit fits?</span>
                <span className="mt-2 block text-sm leading-relaxed text-white/55">
                  Tell us about the business and we’ll take it from there.
                </span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#25D366]">
                Talk to us
                <ArrowIcon className="h-4 w-4 transition group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        </ul>
      </div>
    </section>
  )
}

export default Categories
