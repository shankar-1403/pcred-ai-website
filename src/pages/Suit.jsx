import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { productEnquireHref } from '../lib/whatsapp'
import { findSuit, useSuits } from '../lib/suitsStore'
import { suitIcon } from '../lib/suitIcons'
import { cartItemId, formatPrice, useCart } from '../lib/cart'
import { CartIcon } from '../components/CartDrawer'
import { useBundlePreviews } from '../lib/bundlePreviews'

function ArrowIcon({ className = 'h-4 w-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SuitBadge({ icon: iconKey, className }) {
  const icon = suitIcon(iconKey)
  return (
    <span className={`flex shrink-0 items-center justify-center bg-gradient-to-br text-white ${icon.badge} ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-1/2 w-1/2">
        <path d={icon.path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function AddToCart({ suit, product }) {
  const cart = useCart()
  const id = cartItemId(suit.slug, product.id)
  const added = cart.has(id)

  return (
    <button
      type="button"
      aria-pressed={added}
      onClick={() => cart.toggle({ id, name: product.name, price: product.price, suitSlug: suit.slug, suitIcon: suit.icon, suitName: suit.name })}
      className={`group/cart inline-flex min-w-36 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC] ${
        added
          ? 'bg-[#E6FAF0] text-[#128C4A] ring-1 ring-[#25D366]/40 hover:bg-[#FDECEA] hover:text-[#C2261C] hover:ring-[#C2261C]/30'
          : 'bg-[#00245A] text-white hover:bg-[#003BD9]'
      }`}
    >
      {added ? (
        <>
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 group-hover/cart:hidden">
            <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="group-hover/cart:hidden">Added</span>
          <span className="hidden group-hover/cart:inline">Remove</span>
        </>
      ) : (
        <>
          <CartIcon className="h-4 w-4" />
          Add to cart
        </>
      )}
      <span className="sr-only"> {product.name}</span>
    </button>
  )
}

const pageBackground =
  'relative isolate overflow-hidden bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F9FF_40%,#EAF6FF_100%)] pt-28 text-[#00245A]'

// The bundle's picture: one document per product in the bundle, fanned out like a set of reports.
// An image uploaded in the CMS is used as the page artwork on each document.
const MAX_SHEETS = 4
const SHEET_WIDTHS = ['w-[40%]', 'w-[37%]', 'w-[33%]', 'w-[28%]']

function ProductSheet({ name, number, image, tilt, lift, wide }) {
  return (
    <li
      style={{ transform: `translateY(${lift}px) rotate(${tilt}deg)` }}
      className={`relative -ml-[5%] flex aspect-[3/4] shrink-0 flex-col overflow-hidden rounded-xl bg-white p-[5%] shadow-[0_22px_40px_-22px_rgba(0,36,90,0.7)] ring-1 ring-[#00245A]/6 transition duration-500 first:ml-0 group-hover:translate-y-[-4px] ${wide}`}
    >
      {image ? (
        <img src={image} alt="" loading="lazy" className="h-[30%] w-full shrink-0 rounded-md object-cover" />
      ) : (
        <span aria-hidden="true" className="flex h-[30%] shrink-0 flex-col justify-between rounded-md bg-[linear-gradient(135deg,#EAF6FF,#D3EAFF)] p-[8%]">
          <span className="h-1 w-1/2 rounded-full bg-gradient-to-r from-[#00B2FC] to-[#003BD9]" />
          <span className="flex items-end gap-[6%]">
            <span className="h-2 w-[12%] rounded-sm bg-[#00B2FC]/45" />
            <span className="h-3.5 w-[12%] rounded-sm bg-[#00B2FC]/65" />
            <span className="h-2.5 w-[12%] rounded-sm bg-[#003BD9]/50" />
            <span className="h-4 w-[12%] rounded-sm bg-[#003BD9]/75" />
          </span>
        </span>
      )}
      <span aria-hidden="true" className="mt-[6%] font-mono text-[8px] font-semibold tracking-[0.16em] text-[#00B2FC]">
        {String(number).padStart(2, '0')}
      </span>
      <span className="mt-0.5 line-clamp-5 shrink-0 text-[9px] leading-[1.15] font-semibold tracking-tight break-words hyphens-auto text-[#00245A] sm:text-[11px] lg:text-[13px]">{name}</span>
    </li>
  )
}

function BundlePreview({ image, name, products }) {
  const shown = products.slice(0, MAX_SHEETS)
  const extra = products.length - shown.length
  // A bundle without listed products shows a single cover with the bundle's own name
  const sheets = shown.length ? shown : [name]
  const middle = (sheets.length - 1) / 2

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#EAF6FF_0%,#D6ECFF_55%,#C4E2FF_100%)] ring-1 ring-[#00245A]/6 sm:aspect-[16/10]">
      <div aria-hidden="true" className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#00B2FC]/25 blur-2xl" />
      <ul
        aria-label={shown.length ? `Products in ${name}` : undefined}
        className="relative flex h-full items-center justify-center px-[6%] pt-[7%]"
      >
        {sheets.map((sheet, index) => (
          <ProductSheet
            key={`${index}-${sheet}`}
            name={sheet}
            number={index + 1}
            image={image}
            tilt={(index - middle) * 5}
            lift={Math.abs(index - middle) * 8}
            wide={SHEET_WIDTHS[sheets.length - 1]}
          />
        ))}
      </ul>
      {products.length ? (
        <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-[#003BD9] backdrop-blur">
          {products.length} {products.length === 1 ? 'product' : 'products'}
          {extra > 0 ? ` · +${extra} more` : ''}
        </span>
      ) : null}
    </div>
  )
}

function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute inset-x-0 top-0 h-[36rem] bg-[radial-gradient(ellipse_60%_55%_at_30%_0%,rgba(0,178,252,0.2),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,59,217,0.14)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_50%_35%_at_30%_10%,black,transparent_75%)]" />
    </div>
  )
}

function Suit() {
  const { slug } = useParams()
  const { suits, loading } = useSuits()
  const suit = findSuit(suits, slug)
  const previews = useBundlePreviews(slug)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

  if (loading) {
    return (
      <main className={pageBackground}>
        <Backdrop />
        <div aria-busy="true" className="mx-auto w-full max-w-screen-xl px-6 pt-8 pb-24 sm:pt-12">
          <span className="sr-only">Loading suit</span>
          <div className="h-4 w-48 animate-pulse rounded-full bg-[#00245A]/8" />
          <div className="mt-8 h-14 w-14 animate-pulse rounded-2xl bg-[#00245A]/8" />
          <div className="mt-6 h-12 w-full max-w-md animate-pulse rounded-2xl bg-[#00245A]/8" />
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-72 animate-pulse rounded-[1.75rem] bg-white/70" />
            <div className="h-72 animate-pulse rounded-[1.75rem] bg-white/70" />
          </div>
        </div>
      </main>
    )
  }

  if (!suit) {
    return (
      <main className={pageBackground}>
        <Backdrop />
        <div className="mx-auto flex w-full max-w-screen-xl flex-col items-center px-6 py-24 text-center">
          <p className="font-mono text-[11px] tracking-[0.24em] text-[#003BD9] uppercase">Not found</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">That suit is not listed</h1>
          <Link
            to="/#categories"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#00245A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#003BD9]"
          >
            See all categories
            <ArrowIcon />
          </Link>
        </div>
      </main>
    )
  }

  const otherSuits = suits.filter((item) => item.slug !== suit.slug)

  return (
    <main className={pageBackground}>
      <Backdrop />

      {/* Hero */}
      <section className="mx-auto w-full max-w-screen-xl px-6 pt-8 pb-12 sm:pt-12">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-2 text-sm text-[#00245A]/55">
            <li>
              <Link to="/" className="transition hover:text-[#00245A]">Home</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/#categories" className="transition hover:text-[#00245A]">Categories</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="font-semibold text-[#00245A]">{suit.name}</li>
          </ol>
        </nav>

        <div className="mt-8 max-w-3xl">
          <div>
            <SuitBadge icon={suit.icon} className="h-14 w-14 rounded-2xl shadow-[0_16px_30px_-14px_rgba(0,59,217,0.8)]" />
            <h1 className="mt-6 text-4xl leading-[1.02] font-semibold tracking-[-0.045em] sm:text-6xl">{suit.name}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#00245A]/65 sm:text-lg">{suit.summary}</p>
          </div>
        </div>
      </section>

      {/* Products */}
      <section aria-label="Bundles" className="mx-auto w-full max-w-screen-xl px-6 pb-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5">
          {suit.products.map((product, index) => (
            <article
              key={product.id}
              id={product.id}
              className="group relative flex scroll-mt-28 flex-col overflow-hidden rounded-[1.75rem] border border-white bg-white/85 p-6 shadow-[0_24px_50px_-36px_rgba(0,36,90,0.5)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_34px_60px_-34px_rgba(0,59,217,0.5)] target:ring-2 target:ring-[#00B2FC] sm:p-8"
            >
              <span
                aria-hidden="true"
                className="absolute inset-x-8 top-0 h-px origin-left scale-x-0 bg-gradient-to-r from-[#00B2FC] to-transparent transition-transform duration-500 group-hover:scale-x-100"
              />
              <BundlePreview image={previews[product.id]} name={product.name} products={product.documents} />
              <div className="mt-6 flex items-start justify-between gap-4">
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{product.name}</h2>
                <span
                  aria-hidden="true"
                  className="bg-gradient-to-b from-[#00B2FC]/50 to-[#00B2FC]/0 bg-clip-text text-4xl leading-none font-semibold tracking-[-0.06em] text-transparent"
                >
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <p className="mt-3 max-w-md flex-1 text-sm leading-relaxed text-[#00245A]/65">{product.description}</p>


              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#00245A]/8 pt-5">
                <span>
                  <span className="block font-mono text-[10px] tracking-[0.2em] text-[#00245A]/45 uppercase">Price</span>
                  <span className="block text-2xl font-semibold tracking-tight">{formatPrice(product.price)}</span>
                </span>
                <span className="flex items-center gap-4">
                  <a
                    href={productEnquireHref(product.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-[#003BD9] transition hover:text-[#00245A]"
                  >
                    Enquire
                    <span className="sr-only"> about {product.name}</span>
                  </a>
                  <AddToCart suit={suit} product={product} />
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Other suits */}
      {otherSuits.length > 0 ? (
        <section aria-labelledby="other-suits" className="border-t border-[#00245A]/8 bg-white/60">
          <div className="mx-auto w-full max-w-screen-xl px-6 py-14">
            <div className="flex items-end justify-between gap-4">
              <h2 id="other-suits" className="text-2xl font-semibold tracking-tight">
                Other suits
              </h2>
              <Link to="/#categories" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#003BD9] hover:text-[#00245A]">
                All categories
                <ArrowIcon className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {otherSuits.map((item) => (
                <li key={item.slug}>
                  <Link
                    to={`/suits/${item.slug}`}
                    className="group flex h-full items-center gap-4 rounded-2xl border border-[#00245A]/8 bg-white p-4 transition hover:border-[#00B2FC]/40 hover:shadow-[0_20px_40px_-30px_rgba(0,59,217,0.6)]"
                  >
                    <SuitBadge icon={item.icon} className="h-11 w-11 rounded-xl" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold tracking-tight">{item.name}</span>
                      <span className="block text-xs text-[#00245A]/55">{item.products.length} {item.products.length === 1 ? 'bundle' : 'bundles'}</span>
                    </span>
                    <ArrowIcon className="h-4 w-4 text-[#003BD9] transition group-hover:translate-x-1" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  )
}

export default Suit
