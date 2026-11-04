import { Link } from 'react-router'
import { suitIcon } from '../lib/suitIcons'

function ArrowIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// A suite's card: icon tile, name and bundle count, with its photo (or icon) on the right.
// Used on the home page and in "Other suites" on each suite's page. `image` is the CMS upload or address.
function SuitCard({ suit, image }) {
  const icon = suitIcon(suit.icon)
  return (
    <Link
      to={`/suits/${suit.slug}`}
      className="group relative isolate flex h-full min-h-[15rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#0A2A6B] p-6 text-white shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] transition duration-300 hover:-translate-y-1 hover:border-[#00B2FC]/50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#00B2FC] sm:min-h-[16rem]"
    >
      {/* Right side: the category's photo (or its icon, drawn large) behind a navy fade */}
      <span aria-hidden="true" className="absolute inset-y-0 right-0 -z-10 w-[62%] overflow-hidden">
        {/* An image uploaded in the CMS wins over an image address */}
        {image ? (
          <img src={image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        ) : (
          <span className="block h-full w-full bg-gradient-to-br from-[#003BD9] via-[#0A4FD9] to-[#00B2FC]">
            <svg viewBox="0 0 24 24" className="absolute right-[-12%] bottom-[-10%] h-[85%] w-auto text-white/15 transition duration-700 group-hover:-rotate-6" fill="none">
              <path d={icon.path} stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        )}
      </span>
      <span aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#0A2A6B] from-40% via-[#0A2A6B]/70 via-55% to-transparent" />

      <span className="flex items-start justify-between gap-4">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4FB3FF] text-white shadow-[0_12px_24px_-12px_rgba(0,178,252,0.8)] transition duration-300 group-hover:scale-105 group-hover:-rotate-6">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6">
            <path d={icon.path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </span>

      <h3 className="mt-auto max-w-[62%] pt-8 font-serif text-2xl leading-[1.2] font-semibold tracking-tight text-balance sm:text-[1.75rem]">{suit.name}</h3>

      <span className="mt-5 inline-flex items-center gap-2 text-[15px] font-medium text-white">
        View {suit.products.length} {suit.products.length === 1 ? 'bundle' : 'bundles'}
        <ArrowIcon className="h-4 w-4 text-[#4FB3FF] transition group-hover:translate-x-1" />
      </span>
    </Link>
  )
}

export default SuitCard
