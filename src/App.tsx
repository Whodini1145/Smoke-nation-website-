import { useEffect } from 'react';
import { BrowserRouter, HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { USE_FIREBASE } from './data/store';
import { AgeGate, Footer, Header } from './components/Chrome';
import { ToastHost } from './components/Overlay';
import About from './pages/About';
import Account, { OrderDone } from './pages/Account';
import Admin from './pages/admin/Admin';
import Cart from './pages/Cart';
import Category from './pages/Category';
import Checkout from './pages/Checkout';
import Home from './pages/Home';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Switching sub-category pills shouldn't jump the page back up.
    if (/^\/shop\/[^/]+\/[^/]+$/.test(pathname)) return;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// The live site uses normal URLs (/shop/vapes). The single-file preview uses
// hash URLs (#/shop/vapes) so it can be opened from anywhere.
const Router = USE_FIREBASE ? BrowserRouter : HashRouter;

export default function App() {
  return (
    <Router>
      <ScrollToTop />
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>
        Skip to content
      </a>
      <Header />
      <main id="main" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:category" element={<Category />} />
          <Route path="/shop/:category/:lineId" element={<Category />} />
          <Route path="/about" element={<About />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:id" element={<OrderDone />} />
          <Route path="/account" element={<Account />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <ToastHost />
      <AgeGate />
    </Router>
  );
}
