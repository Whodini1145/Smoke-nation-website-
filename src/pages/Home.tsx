import { useState } from 'react';
import { Link } from 'react-router-dom';
import flowerJars from '../assets/flower-jars.jpg';
import vapeWall from '../assets/vape-wall.jpg';
import storefront from '../assets/storefront.jpg';
import { Carousel } from '../components/Carousel';
import { ClockIcon, PinIcon, ShieldIcon, StarIcon } from '../components/Icons';
import { ProductCard } from '../components/ProductCard';
import { ProductSheet } from '../components/ProductSheet';
import { SearchBox } from '../components/Search';
import { useDB } from '../data/store';
import type { Product } from '../data/types';
import { lineLabel } from '../lib/catalog';
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
                    <span className="deal-where">
                      on {where}. Mix and match flavors.
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {best.length > 0 && (
          <section className="section">
            <div className="section-head">
              <h2 className="h-display">Best sellers</h2>
            </div>
            <div className="row-scroll">
              {best.map((p) => (
                <ProductCard key={p.id} product={p} line={lineOf(p)} deals={db.deals} onOpen={() => setOpen(p)} showLine />
              ))}
            </div>
          </section>
        )}

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
