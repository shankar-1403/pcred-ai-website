import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import Logo from '../assets/pcred_logo.webp'
import { suits } from '../lib/suits'
import { suitIcon } from '../lib/suitIcons'
import { generalEnquireHref } from '../lib/whatsapp'
import { CartIcon } from './CartDrawer'
import { useCart } from '../lib/cart'

const linkClass =
  'group relative inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium text-[#00245A]/70 transition hover:text-[#00245A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]'

function Underline({ active = false }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute inset-x-3.5 bottom-1 h-0.5 origin-left rounded-full bg-gradient-to-r from-[#00B2FC] to-[#003BD9] transition-transform duration-300 group-hover:scale-x-100 ${
        active ? 'scale-x-100' : 'scale-x-0'
      }`}
    />
  )
}

function Chevron({ open }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
    >
      <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SuitIcon({ slug, size = 'h-11 w-11' }) {
  const icon = suitIcon(slug)
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-[0_10px_20px_-10px_rgba(0,59,217,0.8)] ${size} ${icon.badge}`}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
        <path d={icon.path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}

function Header() {
  const headerRef = useRef(null)
  const { pathname } = useLocation()
  const cart = useCart()
  const [open, setOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!open && !megaOpen) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false)
        setMegaOpen(false)
      }
    }
    // Touch and keyboard users close the menu by tapping anywhere outside the header
    const onPointerDown = (event) => {
      if (!headerRef.current?.contains(event.target)) {
        setOpen(false)
        setMegaOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open, megaOpen])

  const closeMenus = () => {
    setOpen(false)
    setMegaOpen(false)
    setMobileCatsOpen(false)
  }

  // Router links don't reset scroll on their own
  const goTo = (smooth) => {
    closeMenus()
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
  }

  // Only scrolling shrinks the bar; an open menu just gives it a solid background
  const compact = scrolled
  const solid = scrolled || open || megaOpen

  return (
    <>
      <header ref={headerRef} className="fixed inset-x-0 top-0 z-50 px-3 sm:px-5" onMouseLeave={() => setMegaOpen(false)}>
        <div
          className={`relative mx-auto w-full transition-all duration-500 ease-out ${
            compact ? 'max-w-4xl pt-3' : 'max-w-screen-xl pt-5'
          }`}
        >
          <div
            className={`flex items-center justify-between gap-3 rounded-[1.4rem] border py-2 pr-2 pl-3 transition-all duration-500 ease-out ${
              solid
                ? 'border-white/80 bg-white/85 shadow-[0_20px_50px_-24px_rgba(0,36,90,0.5)] ring-1 ring-[#00245A]/5 backdrop-blur-xl'
                : 'border-transparent bg-transparent'
            }`}
          >
            <Link to="/" className="relative z-10 flex shrink-0 items-center" onClick={() => goTo(true)}>
              <img src={Logo} className="h-8 sm:h-9" alt="PCRED" />
            </Link>

            <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
              <Link
                to="/"
                aria-current={pathname === '/' ? 'page' : undefined}
                className={linkClass}
                onClick={() => goTo(true)}
                onMouseEnter={() => setMegaOpen(false)}
              >
                Home
                <Underline />
              </Link>
              <button
                type="button"
                aria-expanded={megaOpen}
                aria-controls="categories-menu"
                onClick={() => setMegaOpen((value) => !value)}
                onMouseEnter={() => setMegaOpen(true)}
                className={`${linkClass} cursor-pointer ${megaOpen ? 'text-[#00245A]' : ''}`}
              >
                Categories
                <Chevron open={megaOpen} />
                <Underline active={megaOpen} />
              </button>
              <Link
                to="/contact"
                aria-current={pathname === '/contact' ? 'page' : undefined}
                className={`${linkClass} ${pathname === '/contact' ? 'text-[#00245A]' : ''}`}
                onClick={() => goTo(false)}
                onMouseEnter={() => setMegaOpen(false)}
              >
                Talk to us
                <Underline active={pathname === '/contact'} />
              </Link>
            </nav>

            <div className="flex items-center gap-2" onMouseEnter={() => setMegaOpen(false)}>
              <button
                type="button"
                onClick={() => {
                  closeMenus()
                  cart.open()
                }}
                className="relative inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/80 text-[#00245A] shadow-sm ring-1 ring-[#00245A]/10 transition hover:bg-[#EAF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]"
              >
                <span className="sr-only">Open cart, {cart.count} {cart.count === 1 ? 'product' : 'products'}</span>
                <CartIcon />
                {cart.count > 0 ? (
                  <span
                    key={cart.count}
                    aria-hidden="true"
                    className="cart-bump absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00B2FC] px-1 text-[10px] font-bold text-[#00245A] ring-2 ring-white"
                  >
                    {cart.count}
                  </span>
                ) : null}
              </button>

              <a
                href={generalEnquireHref}
                target="_blank"
                rel="noopener noreferrer"
                className="group hidden items-center gap-2 rounded-full bg-[#00245A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#003BD9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC] md:inline-flex"
              >
                Chat with us
              </a>

              <button
                type="button"
                className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-[#00245A] transition md:hidden ${
                  open ? 'bg-[#00245A] text-white' : 'bg-white/80 shadow-sm ring-1 ring-[#00245A]/10'
                }`}
                aria-controls="mobile-nav"
                aria-expanded={open}
                onClick={() => setOpen((value) => !value)}
              >
                <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
                {open ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 8h14M9 16h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          <div
            id="mobile-nav"
            hidden={!open}
            className="absolute top-[calc(100%+0.5rem)] right-0 left-0 max-h-[calc(100svh-6rem)] overflow-y-auto rounded-[1.6rem] border border-white bg-white/95 p-2 shadow-[0_30px_60px_-30px_rgba(0,36,90,0.55)] backdrop-blur-xl md:hidden"
          >
            <nav className="flex flex-col" aria-label="Mobile">
              <Link
                to="/"
                onClick={() => goTo(true)}
                className="rounded-2xl px-4 py-3.5 text-base font-semibold text-[#00245A] hover:bg-[#EAF6FF]"
              >
                Home
              </Link>
              <button
                type="button"
                aria-expanded={mobileCatsOpen}
                aria-controls="mobile-categories"
                onClick={() => setMobileCatsOpen((value) => !value)}
                className="flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3.5 text-base font-semibold text-[#00245A] hover:bg-[#EAF6FF]"
              >
                Categories
                <Chevron open={mobileCatsOpen} />
              </button>
              <ul id="mobile-categories" hidden={!mobileCatsOpen} className="mx-2 mb-1 space-y-1 rounded-2xl bg-[#F4F9FF] p-1.5">
                {suits.map((suit) => (
                  <li key={suit.slug}>
                    <Link
                      to={`/suits/${suit.slug}`}
                      onClick={() => goTo(false)}
                      className="flex items-center gap-3 rounded-xl p-2 hover:bg-white"
                    >
                      <SuitIcon slug={suit.slug} size="h-9 w-9" />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[#00245A]">{suit.name}</span>
                        <span className="block text-xs text-[#00245A]/55">{suit.products.length} products</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                onClick={() => goTo(false)}
                className="rounded-2xl px-4 py-3.5 text-base font-semibold text-[#00245A] hover:bg-[#EAF6FF]"
              >
                Talk to us
              </Link>
              <a
                href={generalEnquireHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={closeMenus}
                className="mx-2 mt-2 mb-1 inline-flex items-center justify-center gap-2 rounded-full bg-[#00245A] px-4 py-3 text-sm font-semibold text-white"
              >
                Chat with us
              </a>
            </nav>
          </div>
        </div>

        {/* Categories mega menu */}
        <div
          id="categories-menu"
          className={`absolute inset-x-3 top-full hidden pt-3 transition duration-300 ease-out sm:inset-x-5 md:block ${
            megaOpen ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible -translate-y-2 opacity-0'
          }`}
        >
          <div className="mx-auto max-w-screen-xl overflow-hidden rounded-[1.75rem] border border-white bg-white/95 p-3 shadow-[0_40px_80px_-40px_rgba(0,36,90,0.6)] ring-1 ring-[#00245A]/5 backdrop-blur-xl">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[17rem_minmax(0,1fr)]">
              <div className="relative isolate hidden overflow-hidden rounded-[1.4rem] bg-[#00245A] p-6 text-white lg:flex lg:flex-col">
                <span aria-hidden="true" className="absolute -top-16 -right-16 -z-10 h-48 w-48 rounded-full bg-[#00B2FC]/40 blur-3xl" />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 -z-10 bg-[radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:16px_16px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
                />
                <p className="font-mono text-[10px] tracking-[0.24em] text-[#00B2FC] uppercase">Categories</p>
                <p className="mt-3 text-xl leading-tight font-semibold tracking-tight">Advisory suits for every stage</p>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">Each suit opens its own product list.</p>
                <a
                  href="/#categories"
                  onClick={closeMenus}
                  className="group mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white"
                >
                  View all categories
                  <svg className="h-4 w-4 transition group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
              </div>

              <ul className="grid grid-cols-1 content-start gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {suits.map((suit) => (
                  <li key={suit.slug}>
                    <Link
                      to={`/suits/${suit.slug}`}
                      onClick={() => goTo(false)}
                      className="group flex h-full gap-4 rounded-[1.25rem] border border-transparent p-4 transition hover:border-[#00B2FC]/25 hover:bg-[#F4F9FF] focus-visible:outline-2 focus-visible:outline-[#00B2FC]"
                    >
                      <SuitIcon slug={suit.slug} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight text-[#00245A]">
                          {suit.name}
                          <svg
                            className="h-3.5 w-3.5 -translate-x-1 text-[#003BD9] opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
                            viewBox="0 0 24 24"
                            fill="none"
                            aria-hidden="true"
                          >
                            <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        <span className="mt-1 block text-[13px] leading-snug text-[#00245A]/60">{suit.summary}</span>
                        <span className="mt-3 inline-flex rounded-full bg-[#EAF6FF] px-2 py-0.5 font-mono text-[10px] text-[#003BD9]">
                          {suit.products.length} products
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </header>
    </>
  )
}

export default Header
