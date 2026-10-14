import { useEffect } from 'react'
import { checkoutHref, formatPrice, useCart } from '../lib/cart'
import { suitIcon } from '../lib/suitIcons'

function CartDrawer() {
  const { items, total, count, remove, clear, isOpen, close } = useCart()

  useEffect(() => {
    if (!isOpen) return undefined
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
  }, [isOpen, close])

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
              {count} {count === 1 ? 'product' : 'products'}
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
            <p className="mt-1 text-sm text-[#00245A]/55">Add products from any suit to see them here.</p>
            <a
              href="/#categories"
              onClick={close}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#00245A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003BD9]"
            >
              Browse categories
            </a>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-[#00245A]/8 overflow-y-auto px-6">
              {items.map((item) => {
                const icon = suitIcon(item.suitSlug)
                return (
                  <li key={item.id} className="flex items-center gap-4 py-4">
                    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${icon.badge}`}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                        <path d={icon.path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{item.name}</span>
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
                  </li>
                )
              })}
            </ul>

            <div className="border-t border-[#00245A]/8 bg-[#F4F9FF] px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-[#00245A]/60">Total</span>
                <span className="text-2xl font-semibold tracking-tight">{formatPrice(total)}</span>
              </div>
              <a
                href={checkoutHref(items, total)}
                target="_blank"
                rel="noopener noreferrer"
                className="group mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#00245A] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#003BD9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]"
              >
                Checkout
                <svg className="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <div className="mt-3 flex items-center justify-between gap-4 text-xs text-[#00245A]/50">
                <span>Your order is shared with us on WhatsApp.</span>
                <button type="button" onClick={clear} className="shrink-0 cursor-pointer font-semibold whitespace-nowrap text-[#003BD9] hover:text-[#00245A]">
                  Clear cart
                </button>
              </div>
            </div>
          </>
        )}
      </aside>
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
