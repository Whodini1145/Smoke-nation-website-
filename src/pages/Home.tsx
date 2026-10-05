import { useState } from 'react';
import { Link } from 'react-router-dom';
import flowerJars from '../assets/flower-jars.jpg';
import vapeWall from '../assets/vape-wall.jpg';
import storefront from '../assets/storefront.jpg';
import { Carousel } from '../components/Carousel';
import { CheckIcon, ClockIcon, PinIcon, ShieldIcon, StarIcon } from '../components/Icons';
import { ProductArt, ProductCard } from '../components/ProductCard';
import { ProductSheet } from '../components/ProductSheet';
import { SearchBox } from '../components/Search';
import { useDB } from '../data/store';
import type { Product } from '../data/types';
import { brandsOf, lineLabel, linesOf } from '../lib/catalog';
import { dealLabel } from '../lib/pricing';

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <StarIcon key={i} size={size} filled={i <= Math.round(value)} />
      ))}
    </span>
  );
}

/** A strip of brush-stroke "tape" with the shop's promises, drifting sideways. */
function Tape({ items }: { items: string[] }) {
  const row = items.map((t, i) => (
    <span key={i} className="tape-item">
      <CheckIcon /> {t}
    </span>
  ));
  return (
    <div className="tape-clip">
      <div className="tape" role="note" aria-label={items.join('. ')}>
        <div className="tape-track" aria-hidden="true">
          <span className="tape-run">{row}</span>
          <span className="tape-run">{row}</span>
        </div>
      </div>
    </div>
  );
}

export function VisitBlock() {
  const { settings } = useDB();
  return (
    <section className="visit">
      <div className="visit-photo">
        <img src={storefront} alt="The Smoke Nation building on Pine Street: red, white and blue, with picnic tables out front" loading="lazy" />
      </div>
      <div className="wrap visit-inner">
        <div className="visit-card">
          <h2 className="h-display">Come by the shop</h2>
          <p className="visit-row">
            <PinIcon />
            <a href={settings.mapsUrl} target="_blank" rel="noreferrer">
              {settings.address}, {settings.city}
            </a>
          </p>
          <div className="visit-row">
            <ClockIcon />
            <table className="hours">
              <tbody>
                {settings.hours.map((h) => (
                  <tr key={h.label}>
                    <th scope="row">{h.label}</th>
                    <td>{h.hours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="visit-row">
            <ShieldIcon />
            <span>Found it cheaper somewhere else? Bring the receipt in and we'll match the price.</span>
          </p>
          <a className="btn btn-primary" href={settings.mapsUrl} target="_blank" rel="noreferrer">
            Get directions
          </a>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const db = useDB();
  const [open, setOpen] = useState<Product | null>(null);
  const lineOf = (p: Product) => db.lines.find((l) => l.id === p.lineId);
  const best = db.products.filter((p) => p.bestSeller && p.status !== 'out');
  const deals = db.deals.filter((d) => d.active && d.productIds.some((id) => db.products.some((p) => p.id === id)));
  const flowerTiers = db.lines.filter((l) => l.category === 'flower').length;
  const vapeLines = linesOf(db, 'vapes');
  const brands = brandsOf(vapeLines)
    .map((name) => ({ name, lines: vapeLines.filter((l) => (l.brand ?? 'Other') === name) }))
    .filter((b) => b.lines.length);

  return (
    <>
      <Carousel slides={db.slides} />

      <div className="wrap">
        <SearchBox onOpenProduct={setOpen} />

        <section className="section">
          <h2 className="h-display">Explore our products</h2>
          <div className="explore">
            <Link to="/shop/flower" className="explore-tile">
              <img src={flowerJars} alt="" loading="lazy" />
              <span className="explore-text">
                <span className="explore-name">THCA Flower</span>
                <span className="explore-sub">{flowerTiers} tiers, 1g to 1oz</span>
              </span>
            </Link>
            <Link to="/shop/vapes" className="explore-tile">
              <img src={vapeWall} alt="" loading="lazy" />
              <span className="explore-text">
                <span className="explore-name">Vapes</span>
                <span className="explore-sub">Foger and Geek Bar</span>
              </span>
            </Link>
          </div>
        </section>

      </div>

      <Tape items={['Order online, pick up on Pine St', 'We price match with a receipt', 'Open 7 days a week', 'Foger and Geek Bar in stock', '21+ with valid ID']} />

      <div className="wrap">
        <section className="section">
          <h2 className="h-display">Shop by brand</h2>
          <div className="brands">
            {brands.map((b) => (
              <div key={b.name} className={`brand-tile brand-${b.name.toLowerCase().replace(/\W+/g, '')}`}>
                <Link to={`/shop/vapes/${b.lines[0].id}`} className="brand-name">{b.name}</Link>
                <div className="brand-lines">
                  {b.lines.map((l) => (
                    <Link key={l.id} to={`/shop/vapes/${l.id}`} className="brand-line">
                      {l.name.startsWith(b.name) ? l.name.slice(b.name.length).trim() : l.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {deals.length > 0 && (
          <section className="section">
            <h2 className="h-display">Deals right now</h2>
            <div className="deal-list">
              {deals.map((d) => {
                const items = db.products.filter((p) => d.productIds.includes(p.id));
                const lineIds = [...new Set(items.map((p) => p.lineId))];
                const first = db.lines.find((l) => l.id === lineIds[0]);
                const where = lineIds.length === 1 && first ? lineLabel(first) : 'select vapes';
                return (
                  <Link key={d.id} to={first ? `/shop/${first.category}/${lineIds.length === 1 ? first.id : 'deals'}` : '/shop/vapes'} className="deal-banner">
                    <span className="deal-big">{dealLabel(d)}</span>
                    <span className="deal-where">on {where}. Mix and match flavors.</span>
                    <span className="deal-items" aria-hidden="true">
                      {items.slice(0, 5).map((p) => (
                        <ProductArt key={p.id} product={{ ...p, status: 'in' }} category="vapes" />
                      ))}
                      {items.length > 5 && <span className="deal-more">+{items.length - 5}</span>}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {best.length > 0 && (
        <section className="band band-best">
          <div className="wrap">
            <h2 className="h-display">Best sellers</h2>
            <div className="row-scroll">
              {best.map((p) => (
                <ProductCard key={p.id} product={p} line={lineOf(p)} deals={db.deals} onOpen={() => setOpen(p)} showLine />
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="wrap">
        {(db.reviews.length > 0 || db.settings.reviewCount > 0) && (
          <section className="section">
            <h2 className="h-display">What people are saying</h2>
            {db.settings.reviewCount > 0 && (
              <p className="rating-line">
                <span className="rating-num">{db.settings.rating.toFixed(1)}</span>
                <Stars value={db.settings.rating} size={20} />
                <span>from {db.settings.reviewCount} Google reviews</span>
              </p>
            )}
            <div className="row-scroll reviews">
              {db.reviews.map((r) => (
                <figure key={r.id} className="review">
                  <Stars value={r.stars} />
                  <blockquote>{r.text}</blockquote>
                  <figcaption>{r.name}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}
      </div>

      <VisitBlock />
      <ProductSheet product={open} onClose={() => setOpen(null)} />
    </>
  );
}
