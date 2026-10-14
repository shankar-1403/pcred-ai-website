import { BrowserRouter, Routes, Route } from 'react-router'
import Header from './components/Header'
import Footer from './components/Footer'
import CartProvider from './components/CartProvider'
import CartDrawer from './components/CartDrawer'
import Home from './pages/Home'
import Suit from './pages/Suit'
import Login from './pages/Login'
import Contact from './pages/Contact'

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route element={<><Header /><Home /><Footer /><CartDrawer /></>} path="/" />
          <Route element={<><Header /><Suit /><Footer /><CartDrawer /></>} path="/suits/:slug" />
          <Route element={<><Header /><Contact /><Footer /><CartDrawer /></>} path="/contact" />
        </Routes>

        <Routes>
          <Route element={<Login />} path="/login" />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  )
}

export default App
