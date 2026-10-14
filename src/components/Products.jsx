import { productEnquireHref } from '../lib/whatsapp'

const products = [
  {
    name: 'Personal Credit Report',
    description: 'Accounts, inquiries, and payment history in one report that is easy to read.',
    points: ['Account history', 'Inquiry log', 'Payment status'],
    icon: 'report',
  },
  {
    name: 'Credit Score',
    description: 'A clear score with the factors that move it, so the next step is obvious.',
    points: ['Score snapshot', 'Key factors', 'Trend over time'],
    icon: 'score',
  },
  {
    name: 'Business Credit',
    description: 'Company profile and trade lines for decisions that need more than a personal file.',
    points: ['Company profile', 'Trade lines', 'Public records'],
    icon: 'business',
  },
  {
    name: 'Monitoring',
    description: 'A quiet alert when a report changes, without digging through the full file.',
    points: ['Change alerts', 'New inquiries', 'Status updates'],
    icon: 'monitor',
  },
  {
    name: 'Identity Check',
    description: 'Flags unusual activity on a file so mismatches stand out early.',
    points: ['Address match', 'Unusual activity', 'File notes'],
    icon: 'identity',
  },
  {
    name: 'Portfolio Review',
    description: 'A compact view for teams reviewing many reports in the same pass.',
    points: ['Side-by-side view', 'Shared notes', 'Export ready'],
    icon: 'portfolio',
  },
]

function ProductIcon({ name }) {
  const common = {
    className: 'h-5 w-5',
    viewBox: '0 0 24 24',
    fill: 'none',
    'aria-hidden': true,
  }

  if (name === 'score') {
    return (
      <svg {...common}>
        <path d="M4 16.5 9 11l3 3 8-8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M15 6h5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'business') {
    return (
      <svg {...common}>
        <path d="M4 20V7.5A1.5 1.5 0 0 1 5.5 6H14v14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 10h4.5A1.5 1.5 0 0 1 20 11.5V20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 10h2M8 14h2M4 20h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'monitor') {
    return (
      <svg {...common}>
        <path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (name === 'identity') {
    return (
      <svg {...common}>
        <path d="M12 3.5 19 6.5v5.2c0 4.2-2.8 7.2-7 8.8-4.2-1.6-7-4.6-7-8.8V6.5L12 3.5Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (name === 'portfolio') {
    return (
      <svg {...common}>
        <path d="M8 7V6a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="4" y="7" width="16" height="13" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 12h16" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M7 3.5h7.2L19 8.2V20a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 6 20V5A1.5 1.5 0 0 1 7.5 3.5H7Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3.8V8h4.2M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Products() {
  return (
    <section id="products" className="relative isolate scroll-mt-24 overflow-hidden bg-white py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-[-12%] right-[-8%] h-72 w-72 rounded-full bg-brand/8 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-16%] left-[-10%] h-64 w-64 rounded-full bg-brand-bright/10 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-screen-xl px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-brand-wash px-3 py-1 text-[11px] font-semibold tracking-[0.22em] text-brand uppercase ring-1 ring-[#d5e3f6]">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Products
            </p>
            <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.03em] text-[#00245A] sm:text-4xl">
              Reports for the decision in front of you
            </h2>
          </div>
          <p className="max-w-md text-base leading-relaxed text-[#59677c]">
            Credit and report products, laid out so the details stay easy to scan.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {products.map((product, index) => (
            <article
              key={product.name}
              className="group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-white via-white to-brand-wash p-6 shadow-[0_20px_50px_-36px_rgba(0,36,90,0.45)] ring-1 ring-[#d5e3f6] transition duration-300 hover:-translate-y-1 hover:shadow-[0_28px_56px_-28px_rgba(0,79,223,0.35)] hover:ring-brand-ring"
            >
              <div
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-bright to-brand opacity-0 transition duration-300 group-hover:opacity-100"
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-10 -right-10 h-28 w-28 rounded-full bg-brand/10 blur-2xl opacity-0 transition duration-300 group-hover:opacity-100"
              />

              <div className="flex items-start justify-between gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand shadow-[0_12px_24px_-16px_rgba(0,79,223,0.9)] ring-1 ring-[#dbe8f8] transition group-hover:text-brand-navy">
                  <ProductIcon name={product.icon} />
                </div>
                <span className="text-2xl font-semibold tracking-[-0.08em] text-brand/15">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-[#00245A]">{product.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[#59677c]">{product.description}</p>
              <ul className="mt-5 flex flex-wrap gap-2">
                {product.points.map((point) => (
                  <li
                    key={point}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-[11px] font-medium text-[#00245A] ring-1 ring-[#e4eef9]"
                  >
                    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-brand" />
                    {point}
                  </li>
                ))}
              </ul>
              <a
                href={productEnquireHref(product.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#00B2FC] via-[#004FDE] to-[#00245A] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(0,79,223,0.9)] transition group-hover:bg-brand-navy hover:bg-brand-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Enquire
                <svg className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Products
