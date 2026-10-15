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

// The CMS (and Firebase Auth) loads only when /admin is opened
const Admin = lazy(() => import('./pages/Admin'))
// The Udyam Scheme Report (OCR, PDF and payment code) loads only when /report is opened
const Report = lazy(() => import('./pages/Report'))

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
              <Route element={<><Header /><Suspense fallback={<div className="min-h-screen" />}><Report /></Suspense><Footer /><CartDrawer /></>} path="/report" />
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
