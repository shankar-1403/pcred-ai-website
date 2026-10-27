import { useEffect, useState } from 'react'
import { Link, Navigate, Route, Routes, useLocation, useSearchParams } from 'react-router'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { get, ref } from 'firebase/database'
import Logo from '../assets/pcred_logo.webp'
import { db, isFirebaseConfigured } from '../lib/firebase'
import { auth } from '../lib/firebaseAuth'
import { useSuits } from '../lib/suitsStore'
import CategoriesPanel from '../components/admin/CategoriesPanel'
import ProductsPanel from '../components/admin/ProductsPanel'
import DiscountsPanel from '../components/admin/DiscountsPanel'
import EnquiriesPanel from '../components/admin/EnquiriesPanel'
import SchemesPanel from '../components/admin/SchemesPanel'
import { useDiscounts } from '../lib/discounts'
import { Button, Notice } from '../components/admin/ui'

const SIGN_IN_ERRORS = {
  'auth/invalid-credential': 'That email and password do not match an admin account.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes and try again.',
  'auth/network-request-failed': 'Could not reach Firebase. Check your connection.',
}

const SECTIONS = [
  { id: 'categories', label: 'Categories', to: '/admin/categories' },
  { id: 'products', label: 'Bundles', to: '/admin/bundles' },
  { id: 'discounts', label: 'Discounts', to: '/admin/discounts' },
  { id: 'enquiries', label: 'Enquiries', to: '/admin/enquiries' },
  { id: 'schemes', label: 'Schemes', to: '/admin/schemes' },
]

function useSection() {
  const { pathname } = useLocation()
  const match = SECTIONS.find((item) => pathname.startsWith(item.to))
  return match ? match.id : 'categories'
}

function AdminNav({ className = '' }) {
  const section = useSection()

  return (
    <nav aria-label="CMS sections" className={`items-center gap-1 ${className}`}>
      {SECTIONS.map((item) => {
        const active = section === item.id
        return (
          <Link
            key={item.id}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={`relative inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-[#00B2FC] ${
              active ? 'bg-[#00245A] text-white' : 'text-[#00245A]/65 hover:bg-[#EAF6FF] hover:text-[#00245A]'
            }`}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function Shell({ children, user, admin }) {
  return (
    <div className="min-h-svh bg-[linear-gradient(180deg,#FFFFFF_0%,#F4F9FF_40%,#EAF6FF_100%)] text-[#00245A]">
      <header className="sticky top-0 z-10 border-b border-[#00245A]/8 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <img src={Logo} alt="PCRED" className="h-8" />
            <span className="hidden rounded-full bg-[#00245A] px-2.5 py-0.5 font-mono text-[10px] tracking-[0.16em] text-[#00B2FC] uppercase sm:inline">
              CMS
            </span>
          </div>
          {admin ? <AdminNav className="hidden lg:flex" /> : null}
          <div className="flex items-center gap-2">
            <Link to="/" target="_blank" rel="noopener noreferrer" className="rounded-full px-3 py-2 text-sm font-semibold text-[#003BD9] hover:bg-[#EAF6FF]">
              View site
            </Link>
            {admin ? (
              <span className="hidden min-w-0 border-l border-[#00245A]/10 pl-3 text-right leading-tight xl:block">
                <span className="block truncate text-sm font-semibold">{admin.name || 'Admin'}</span>
                <span className="block truncate text-xs text-[#00245A]/50">{admin.email}</span>
              </span>
            ) : null}
            {user ? (
              <Button tone="secondary" onClick={() => signOut(auth)}>
                Sign out
              </Button>
            ) : null}
          </div>
        </div>
        {admin ? (
          <div className="border-t border-[#00245A]/6 py-2 lg:hidden">
            {/* Sections scroll sideways on narrow screens instead of pushing the page wider */}
            <AdminNav className="flex overflow-x-auto overscroll-x-contain px-4 [scrollbar-width:none] sm:px-6" />
          </div>
        ) : null}
      </header>
      <main className="mx-auto w-full max-w-screen-xl px-4 py-8 sm:px-6 sm:py-10">{children}</main>
    </div>
  )
}

function CenteredCard({ title, children }) {
  return (
    <div className="mx-auto max-w-md rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_30px_60px_-40px_rgba(0,36,90,0.55)] sm:p-8">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-[#00245A]/75">{children}</div>
    </div>
  )
}

const SIGN_IN_POINTS = ['Categories and the order they appear in', 'Bundles, prices and the products in them', 'Changes go live on the site instantly']

const fieldShell =
  'flex items-center gap-3 rounded-2xl border-2 border-[#00245A]/10 bg-[#F4F9FF] px-3.5 transition focus-within:border-[#00B2FC] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#00B2FC]/15'

function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    document.title = 'Sign in · PCRED CMS'
  }, [])

  const onSubmit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (signInError) {
      setError(SIGN_IN_ERRORS[signInError.code] ?? `Could not sign in: ${signInError.message}`)
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-svh grid-cols-1 bg-white text-[#00245A] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Brand panel */}
      <aside className="relative isolate hidden overflow-hidden bg-[#00245A] p-12 text-white lg:flex lg:flex-col xl:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_80%_70%_at_30%_40%,black,transparent_80%)]" />
          <div className="banner-mesh absolute -top-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-[#00B2FC]/35 blur-[110px]" />
          <div className="banner-mesh-alt absolute -bottom-40 -left-24 h-[26rem] w-[26rem] rounded-full bg-[#003BD9]/70 blur-[110px]" />
        </div>

        <Link to="/" className="inline-flex w-fit rounded-2xl bg-white px-3 py-2">
          <img src={Logo} alt="PCRED" className="h-8" />
        </Link>

        <div className="my-auto max-w-md py-12">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 font-mono text-[10px] tracking-[0.22em] text-[#00B2FC] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00B2FC]" />
            Content manager
          </p>
          {/* A tagline, not a heading: the page heading is "Welcome back" beside it */}
          <p className="mt-6 text-4xl leading-[1.05] font-semibold tracking-[-0.04em] xl:text-5xl">
            Manage what the{' '}
            <span className="bg-gradient-to-r from-[#00B2FC] to-[#9BE3FF] bg-clip-text text-transparent">site shows</span>
          </p>
          <ul className="mt-8 space-y-3">
            {SIGN_IN_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm text-white/75">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#00B2FC]/20 text-[#00B2FC]">
                  <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
                    <path d="m3.5 8.5 3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                {point}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-white/40">© {new Date().getFullYear()} PCRED</p>
      </aside>

      {/* Form */}
      <main className="relative flex items-center justify-center px-6 py-12 sm:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(0,59,217,0.12)_1px,transparent_1px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black,transparent_75%)]"
        />
        <div className="relative w-full max-w-sm">
          <Link to="/" className="mb-10 inline-flex lg:hidden">
            <img src={Logo} alt="PCRED" className="h-9" />
          </Link>

          <p className="font-mono text-[11px] tracking-[0.22em] text-[#003BD9] uppercase">PCRED CMS</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">Welcome back</h1>
          <p className="mt-2 text-sm text-[#00245A]/60">Sign in with your admin account.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-xs font-semibold">
                Email
              </label>
              <div className={fieldShell}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#003BD9]/70" fill="none">
                  <path d="M4 6h16v12H4zM4 7l8 6 8-6" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
                <input
                  id="admin-email"
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-[#00245A]/35"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-xs font-semibold">
                Password
              </label>
              <div className={fieldShell}>
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-[#003BD9]/70" fill="none">
                  <path d="M6 11h12v9H6zM8.5 11V8a3.5 3.5 0 0 1 7 0v3" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-pressed={showPassword}
                  className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-[#003BD9] hover:bg-[#EAF6FF]"
                >
                  {showPassword ? 'Hide' : 'Show'}
                  <span className="sr-only"> password</span>
                </button>
              </div>
            </div>

            {error ? <Notice tone="error">{error}</Notice> : null}

            <button
              type="submit"
              disabled={busy}
              className="group relative flex w-full cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#00B2FC] to-[#003BD9] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_16px_32px_-14px_rgba(0,59,217,0.8)] transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC] disabled:cursor-wait disabled:opacity-70"
            >
              {busy ? 'Signing in…' : 'Sign in'}
              {busy ? null : (
                <svg aria-hidden="true" viewBox="0 0 16 16" className="h-4 w-4 transition group-hover:translate-x-0.5">
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </form>

          <p className="mt-6 text-xs leading-relaxed text-[#00245A]/50">Admin access only. Ask a site owner to add your account.</p>
          <Link to="/" className="mt-8 inline-flex items-center gap-1.5 text-sm font-semibold text-[#003BD9] hover:text-[#00245A]">
            <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
              <path d="M13 8H4M7.5 4.5 4 8l3.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to site
          </Link>
        </div>
      </main>
    </div>
  )
}

function usePageTitle(title) {
  useEffect(() => {
    document.title = `${title} · PCRED CMS`
  }, [title])
}

function CategoriesPage() {
  const { suits, loading, error } = useSuits()
  usePageTitle('Categories')
  return <CategoriesPanel suits={suits} loading={loading} error={error} />
}

function ProductsPage() {
  const { suits, loading } = useSuits()
  const [params] = useSearchParams()
  const category = params.get('category')
  usePageTitle('Bundles')
  // key: following a category's "Products" link re-applies that filter
  return <ProductsPanel key={category ?? 'all'} suits={suits} loading={loading} initialCategory={category} />
}

function DiscountsPage() {
  const { tiers, loading } = useDiscounts()
  usePageTitle('Discounts')
  return <DiscountsPanel tiers={tiers} loading={loading} />
}

function EnquiriesPage() {
  usePageTitle('Enquiries')
  return <EnquiriesPanel />
}

function SchemesPage() {
  usePageTitle('Schemes')
  return <SchemesPanel />
}

// /admin opens Categories; old /admin?tab=products links still land on Bundles
function AdminIndex() {
  const [params] = useSearchParams()
  return <Navigate to={params.get('tab') === 'products' ? '/admin/bundles' : '/admin/categories'} replace />
}

// Bundles used to be called Products: keep old /admin/products links (and their filter) working
function LegacyProductsRedirect() {
  const { search } = useLocation()
  return <Navigate to={`/admin/bundles${search}`} replace />
}

function Dashboard() {
  return (
    <Routes>
      <Route index element={<AdminIndex />} />
      <Route path="categories" element={<CategoriesPage />} />
      <Route path="bundles" element={<ProductsPage />} />
      <Route path="products" element={<LegacyProductsRedirect />} />
      <Route path="discounts" element={<DiscountsPage />} />
      <Route path="enquiries" element={<EnquiriesPage />} />
      <Route path="schemes" element={<SchemesPage />} />
      <Route path="*" element={<Navigate to="/admin/categories" replace />} />
    </Routes>
  )
}

function Admin() {
  const [user, setUser] = useState(undefined) // undefined while Firebase restores the session
  const [admin, setAdmin] = useState(null) // null while checking, false if not listed, else the admins/{uid} profile

  useEffect(() => {
    if (!auth) return undefined
    return onAuthStateChanged(auth, async (nextUser) => {
      setAdmin(null)
      setUser(nextUser)
      if (!nextUser) return
      try {
        const snapshot = await get(ref(db, `admins/${nextUser.uid}`))
        // admins/{uid} = { name, email }; any entry under the UID grants access
        const profile = snapshot.val()
        setAdmin(snapshot.exists() ? { name: profile?.name ?? '', email: profile?.email ?? nextUser.email } : false)
      } catch {
        setAdmin(false)
      }
    })
  }, [])

  if (!isFirebaseConfigured) {
    return (
      <Shell>
        <CenteredCard title="Connect Firebase first">
          <p>The CMS needs your Firebase web config. The site is showing its built-in starter data until then.</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li>Copy <code className="rounded bg-[#EAF6FF] px-1">.env.example</code> to <code className="rounded bg-[#EAF6FF] px-1">.env.local</code>.</li>
            <li>Fill in the values from Firebase console › Project settings › Your apps.</li>
            <li>Restart the dev server.</li>
          </ol>
        </CenteredCard>
      </Shell>
    )
  }

  if (user === undefined || (user && admin === null)) {
    return (
      <Shell user={user}>
        <p className="text-center text-sm text-[#00245A]/55" aria-busy="true">Checking your account…</p>
      </Shell>
    )
  }

  // Full-screen sign-in, without the CMS header
  if (!user) return <SignIn />

  if (!admin) {
    return (
      <Shell user={user}>
        <CenteredCard title="This account is not an admin">
          <p>
            Signed in as <strong>{user.email}</strong>, but it is not on the admin list.
          </p>
          <p>To allow it, add this entry in Firebase console › Realtime Database › Data, then reload this page:</p>
          <pre className="overflow-x-auto rounded-xl bg-[#00245A] p-4 font-mono text-xs leading-relaxed text-white">
            {`admins
 └─ ${user.uid}
     ├─ name:  "Full name"
     └─ email: "${user.email}"`}
          </pre>
        </CenteredCard>
      </Shell>
    )
  }

  return (
    <Shell user={user} admin={admin}>
      <Dashboard />
    </Shell>
  )
}

export default Admin
