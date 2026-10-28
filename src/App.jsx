import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router'
import Header from './components/Header'
import Footer from './components/Footer'
import CartProvider from './components/CartProvider'
import CartDrawer from './components/CartDrawer'
import SuitsProvider from './components/SuitsProvider'
import DiscountsProvider from './components/DiscountsProvider'
import ScrollManager from './components/ScrollManager'
import Home from './pages/Home'
import Suit from './pages/Suit'
import Login from './pages/Login'
import Contact from './pages/Contact'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'

// The CMS (and Firebase Auth) loads only when /admin is opened
const Admin = lazy(() => import('./pages/Admin'))
// The Udyam Scheme Report (OCR, PDF and payment code) loads only when /report is opened
const Report = lazy(() => import('./pages/Report'))

// Shown while the report's code downloads, so the page is never blank
function ReportLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-[#00245A]" role="status" aria-live="polite">
      <span aria-hidden="true" className="h-10 w-10 animate-spin rounded-full border-4 border-[#003BD9]/20 border-t-[#003BD9]" />
      <p className="text-sm font-medium text-[#00245A]/70">Loading your report…</p>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <ScrollManager />
      <SuitsProvider>
        <DiscountsProvider>
          <CartProvider>
            <Routes>
              <Route element={<><Header /><Home /><Footer /><CartDrawer /></>} path="/" />
              <Route element={<><Header /><Suit /><Footer /><CartDrawer /></>} path="/suits/:slug" />
              <Route element={<><Header /><Contact /><Footer /><CartDrawer /></>} path="/contact" />
              <Route element={<><Header /><Privacy /><Footer /><CartDrawer /></>} path="/privacy" />
              <Route element={<><Header /><Terms /><Footer /><CartDrawer /></>} path="/terms" />
              <Route element={<><Header /><Suspense fallback={<ReportLoading />}><Report /></Suspense><Footer /><CartDrawer /></>} path="/report" />
            </Routes>

            <Routes>
              <Route element={<Login />} path="/login" />
              <Route element={<Suspense fallback={null}><Admin /></Suspense>} path="/admin/*" />
            </Routes>
          </CartProvider>
        </DiscountsProvider>
      </SuitsProvider>
    </BrowserRouter>
  )
}

export default App
