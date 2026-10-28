import { Suspense, lazy, useEffect, useState } from 'react'
import { Link } from 'react-router'
import { checkoutHref, formatPrice, useCart } from '../lib/cart'
import { suitIcon } from '../lib/suitIcons'
import { cartPricing, completeSetDeal, useDiscounts } from '../lib/discounts'
import { isFirebaseConfigured } from '../lib/firebase'
import { findSuit, useSuits } from '../lib/suitsStore'

// Products inside a bundle: the live list from the CMS, or what was saved when it was added
function bundleProducts(suits, item) {
  const product = findSuit(suits, item.suitSlug)?.products.find((p) => p.name === item.name)
  if (product) return product.documents
  return Array.isArray(item.documents) ? item.documents : []
}

// Loaded on demand so Firebase Auth and reCAPTCHA stay out of the main bundle
const CheckoutModal = lazy(() => import('./CheckoutModal'))

const checkoutButtonClass =
  'group mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#00245A] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#003BD9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]'

function CheckoutArrow() {
  return (
    <svg className="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CartDrawer() {
  const { items, total, count, remove, clear, isOpen, close } = useCart()
  const { suits } = useSuits()
  const { tiers } = useDiscounts()
  const pricing = cartPricing(total, tiers, completeSetDeal(items, suits))
  const [checkoutOpen, setCheckoutOpen] = useState(false)

  useEffect(() => {
    // While checkout is open, Esc belongs to it (it closes the checkout, not the drawer)
    if (!isOpen || checkoutOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') close()
    }
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKey)
    }
  }, [isOpen, close, checkoutOpen])

  return (
    <div className={`fixed inset-0 z-[60] ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      <div
        onClick={close}
        className={`absolute inset-0 bg-[#00245A]/30 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        inert={!isOpen}
        className={`absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-white text-[#00245A] shadow-[-30px_0_80px_-30px_rgba(0,36,90,0.5)] transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[#00245A]/8 px-6 py-5">
          <div>
            <h2 id="cart-title" className="text-lg font-semibold tracking-tight">Your cart</h2>
            <p className="text-xs text-[#00245A]/55">
              {count} {count === 1 ? 'bundle' : 'bundles'}
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#F4F9FF] transition hover:bg-[#EAF6FF] focus-visible:outline-2 focus-visible:outline-[#00B2FC]"
          >
            <span className="sr-only">Close cart</span>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EAF6FF] text-[#003BD9]">
              <CartIcon className="h-7 w-7" />
            </span>
            <p className="mt-5 text-lg font-semibold tracking-tight">Your cart is empty</p>
            <p className="mt-1 text-sm text-[#00245A]/55">Add bundles from any category to see them here.</p>
            {pricing.nextPercent > 0 ? (
              <p className="mt-5 rounded-xl border border-[#00B2FC]/35 bg-[#EAF6FF] px-4 py-2.5 text-sm text-[#00245A]">
                Get <strong className="text-[#003BD9]">{pricing.nextPercent}% off</strong> on orders of{' '}
                <strong>{formatPrice(pricing.nextMinAmount)}</strong> or more
              </p>
            ) : null}
            <Link
              to="/#categories"
              onClick={close}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#00245A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003BD9]"
            >
              Browse categories
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-[#00245A]/8 overflow-y-auto overscroll-contain px-6">
              {items.map((item) => {
                const icon = suitIcon(item.suitIcon)
                const products = bundleProducts(suits, item)
                return (
                  <li key={item.id} className="py-4">
                    {/* Top row: icon, name, price and remove, centred on one line */}
                    <div className="flex items-center gap-4">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${icon.badge}`}>
                        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                          <path d={icon.path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug font-semibold break-words">{item.name}</span>
                        <span className="block truncate text-xs text-[#00245A]/50">{item.suitName}</span>
                      </span>
                      <span className="text-sm font-semibold">{formatPrice(item.price)}</span>
                      <button
                        type="button"
                        onClick={() => remove(item.id)}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-[#00245A]/40 transition hover:bg-[#FDECEA] hover:text-[#C2261C]"
                      >
                      <span className="sr-only">Remove {item.name}</span>
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path d="M5 7h14M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      </button>
                    </div>
                    {/* Products below, lined up with the name in an even two-column grid */}
                    {products.length ? (
                      <ul className="mt-2.5 ml-15 grid grid-cols-2 gap-1.5" aria-label={`Products in ${item.name}`}>
                        {products.map((product, index) => (
                          <li
                            key={`${index}-${product}`}
                            className="flex min-w-0 items-center gap-1.5 rounded-lg border border-[#00245A]/8 bg-[#F4F9FF] px-2 py-1.5 text-[11.5px] font-medium text-[#00245A]/75"
                          >
                            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3 w-3 shrink-0 text-[#00B2FC]" fill="none">
                              <path d="m3.5 8.5 3 3 6-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <span className="truncate" title={product}>{product}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-[#00245A]/8 bg-[#F4F9FF] px-6 py-5">
              {pricing.nextPercent > 0 ? (
                <div className="mb-4 rounded-2xl border border-[#00B2FC]/35 bg-white p-3.5 shadow-[0_10px_24px_-18px_rgba(0,59,217,0.6)]">
                  <p className="flex items-start gap-2.5 text-sm text-[#00245A]">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FC] to-[#003BD9] text-xs font-bold text-white">
                      %
                    </span>
                    <span>
                      Add bundles worth <strong>{formatPrice(pricing.amountToNext)}</strong> more to get{' '}
                      <strong className="text-[#003BD9]">{pricing.nextPercent}% off</strong>
                      <span className="mt-0.5 block text-xs text-[#00245A]/55">
                        {pricing.nextPercent}% off on orders of {formatPrice(pricing.nextMinAmount)} or more
                      </span>
                    </span>
                  </p>
                  <div
                    role="progressbar"
                    aria-label={`Progress towards ${pricing.nextPercent}% off`}
                    aria-valuemin={0}
                    aria-valuemax={pricing.nextMinAmount}
                    aria-valuenow={pricing.subtotal}
                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#EAF6FF]"
                  >
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#00B2FC] to-[#003BD9] transition-[width] duration-500"
                      style={{ width: `${Math.min(100, (pricing.subtotal / pricing.nextMinAmount) * 100)}%` }}
                    />
                  </div>
                </div>
              ) : null}

              {pricing.percent > 0 ? (
                <dl className="mb-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[#00245A]/60">Subtotal</dt>
                    <dd>{formatPrice(pricing.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between font-semibold text-[#128C4A]">
                    <dt>{pricing.dealName ? `${pricing.dealName} (${pricing.percent}% off)` : `Discount (${pricing.percent}%)`}</dt>
                    <dd>−{formatPrice(pricing.discount)}</dd>
                  </div>
                </dl>
              ) : null}

              <div className="flex items-baseline justify-between border-t border-[#00245A]/8 pt-3">
                <span className="text-sm text-[#00245A]/60">Total</span>
                <span className="text-right">
                  {pricing.percent > 0 ? (
                    <span className="mr-2 text-sm text-[#00245A]/40 line-through">{formatPrice(pricing.subtotal)}</span>
                  ) : null}
                  <span className="text-2xl font-semibold tracking-tight">{formatPrice(pricing.total)}</span>
                </span>
              </div>
              {isFirebaseConfigured ? (
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(true)}
                  className={`${checkoutButtonClass} cursor-pointer`}
                >
                  Checkout
                  <CheckoutArrow />
                </button>
              ) : (
                // Without Firebase there is nowhere to store an enquiry, so fall back to WhatsApp
                <a
                  href={checkoutHref(items, pricing.subtotal, pricing.percent > 0 ? { percent: pricing.percent, amount: pricing.discount } : null)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={checkoutButtonClass}
                >
                  Checkout
                  <CheckoutArrow />
                </a>
              )}
              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-[#00245A]/50">
                <span>{isFirebaseConfigured ? 'We verify your mobile number, then get in touch.' : 'Your order is shared with us on WhatsApp.'}</span>
                <button type="button" onClick={clear} className="shrink-0 cursor-pointer font-semibold whitespace-nowrap text-[#003BD9] hover:text-[#00245A]">
                  Clear cart
                </button>
              </div>
            </div>
          </>
        )}
      </aside>

      {checkoutOpen ? (
        <Suspense fallback={null}>
          <CheckoutModal
            items={items}
            pricing={pricing}
            onPlaced={clear}
            onClose={() => {
              setCheckoutOpen(false)
              // After a placed enquiry the cart is empty, so close the drawer too
              if (items.length === 0) close()
            }}
          />
        </Suspense>
      ) : null}
    </div>
  )
}

export function CartIcon({ className = 'h-5 w-5' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 4h2l2.4 11.2a1.5 1.5 0 0 0 1.5 1.3h8.4a1.5 1.5 0 0 0 1.5-1.2L20.5 8H6.2M10 20.5h.01M17 20.5h.01"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default CartDrawer
