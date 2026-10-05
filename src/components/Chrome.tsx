import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import logoWide from '../assets/logo-wide.jpg';
import logoBadge from '../assets/logo-badge.jpg';
import { updateSession, useCart, useDB, useSession } from '../data/store';
import type { CategoryId, MenuTile } from '../data/types';
import { cardBackground } from '../lib/color';
import { CATEGORY_NAMES } from '../lib/catalog';
import { BagIcon, CloseIcon, MenuIcon, UserIcon } from './Icons';
import { Placeholder } from './ProductCard';
import { edgeColor } from '../lib/color';

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const cart = useCart();
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const location = useLocation();
  useEffect(() => setMenuOpen(false), [location.pathname]);

  return (
    <>
      <header className="masthead">
        <div className="masthead-inner">
          <button type="button" className="icon-btn masthead-menu" onClick={() => setMenuOpen(true)} aria-label="Open menu" aria-expanded={menuOpen}>
            <MenuIcon size={28} />
          </button>
          <Link to="/" className="masthead-logo" aria-label="Smoke Nation home">
            <img src={logoWide} alt="Smoke Nation" width={1200} height={480} />
          </Link>
          <div className="masthead-actions">
            <Link to="/account" className="icon-btn" aria-label="Your account">
              <UserIcon size={24} />
            </Link>
            <Link to="/cart" className="icon-btn cart-btn" aria-label={`Cart, ${count} item${count === 1 ? '' : 's'}`}>
              <BagIcon size={25} />
              {count > 0 && <span className="cart-count">{count}</span>}
            </Link>
          </div>
        </div>
      </header>
      <MenuPanel open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

function TileGrid({ tiles }: { tiles: MenuTile[] }) {
  return (
    <div className="tile-grid">
      {tiles.map((t) => (
        <Link key={t.id} to={`/shop/${t.category}${t.lineId ? `/${t.lineId}` : ''}`} className="tile">
          <span className="tile-art" style={{ background: cardBackground(t.hue, t.saturation, t.intensity) }}>
            {t.photo ? <img src={t.photo} alt="" loading="lazy" /> : <Placeholder category={t.category} color={edgeColor(t.hue, t.saturation, Math.min(100, t.intensity + 25))} />}
          </span>
          <span className="tile-label">{t.label}</span>
        </Link>
      ))}
    </div>
  );
}

function MenuPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const db = useDB();
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  // Admin's "menu background intensity": lighter → darker green behind the whole menu.
  const k = db.settings.menuIntensity / 100;
  const bg = `hsl(96 ${46 + k * 8}% ${92 - k * 70}%)`;
  const dark = k > 0.6;

  return (
    <div className={`menu-root${open ? ' is-open' : ''}`} aria-hidden={!open}>
      <div className="menu-scrim" onClick={onClose} />
      <nav className={`menu${dark ? ' menu-dark' : ''}`} style={{ background: bg }} aria-label="Site menu" {...(open ? {} : { inert: '' })}>
        <div className="menu-top">
          <Link to="/" className="menu-badge" aria-label="Smoke Nation home">
            <img src={logoBadge} alt="" />
          </Link>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu">
            <CloseIcon size={28} />
          </button>
        </div>
        <ul className="menu-links">
          <li><NavLink to="/" end>Home</NavLink></li>
          <li><NavLink to="/shop/flower">THCA Flower</NavLink></li>
          <li><NavLink to="/shop/vapes">Vapes</NavLink></li>
          <li><NavLink to="/about">About us &amp; hours</NavLink></li>
          <li><NavLink to="/account">Your account</NavLink></li>
          <li><NavLink to="/cart">Cart</NavLink></li>
        </ul>
        {(['flower', 'vapes'] as CategoryId[]).map((c) => {
          const tiles = db.tiles.filter((t) => t.category === c);
          return tiles.length ? (
            <section key={c} className="menu-section">
              <h2>{CATEGORY_NAMES[c]}</h2>
              <TileGrid tiles={tiles} />
            </section>
          ) : null;
        })}
        <Link to="/admin" className="menu-admin">Staff login</Link>
      </nav>
    </div>
  );
}

export function AgeGate() {
  const session = useSession();
  const [declined, setDeclined] = useState(false);
  if (session.ageOk) return null;
  return (
    <div className="age-gate" role="dialog" aria-modal="true" aria-labelledby="age-title">
      <div className="age-card">
        <img src={logoBadge} alt="Smoke Nation" className="age-logo" />
        {declined ? (
          <>
            <h1 id="age-title">You must be 21 or older to visit</h1>
            <p>Our products are for adults 21 and up. Come back when you're 21.</p>
            <button type="button" className="btn btn-ghost" onClick={() => setDeclined(false)}>
              I entered that wrong
            </button>
          </>
        ) : (
          <>
            <h1 id="age-title">Are you 21 or older?</h1>
            <p>You must be 21+ to view this site. Valid ID is required at pickup and delivery.</p>
            <div className="age-actions">
              <button type="button" className="btn btn-primary" onClick={() => updateSession({ ageOk: true })} autoFocus>
                Yes, I'm 21 or older
              </button>
              <button type="button" className="btn btn-ghost" onClick={() => setDeclined(true)}>
                No, I'm under 21
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function Footer() {
  const { settings } = useDB();
  return (
    <footer className="footer">
      <div className="wrap footer-grid">
        <div>
          <img src={logoBadge} alt="Smoke Nation" className="footer-logo" />
        </div>
        <div>
          <h2>Visit</h2>
          <p>
            <a href={settings.mapsUrl} target="_blank" rel="noreferrer">
              {settings.address}
              <br />
              {settings.city}
            </a>
          </p>
          <ul className="footer-hours">
            {settings.hours.map((h) => (
              <li key={h.label}>
                <span>{h.label}</span> <span>{h.hours}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Contact</h2>
          <p>
            {settings.phone ? <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>{settings.phone}</a> : 'Phone coming soon'}
            <br />
            {settings.email ? <a href={`mailto:${settings.email}`}>{settings.email}</a> : 'Email coming soon'}
          </p>
          <p>
            <Link to="/about">About us</Link>
            <br />
            <Link to="/account">Your orders</Link>
          </p>
        </div>
      </div>
      <p className="wrap footer-legal">
        For adults 21 and older. Valid ID is checked at pickup and delivery. Nicotine is an addictive chemical.
      </p>
    </footer>
  );
}
