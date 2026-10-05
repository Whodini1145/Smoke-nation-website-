import { Fragment, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import flowerJars from '../assets/flower-jars.jpg';
import vapeWall from '../assets/vape-wall.jpg';
import { BackIcon } from '../components/Icons';
import { PotencyBars, ProductCard } from '../components/ProductCard';
import { ProductSheet } from '../components/ProductSheet';
import { useDB } from '../data/store';
import type { CategoryId, Product } from '../data/types';
import { brandsOf, CATEGORY_NAMES, lineLabel, linesOf } from '../lib/catalog';

const HERO: Record<CategoryId, string> = { flower: flowerJars, vapes: vapeWall };

export default function Category() {
  const { category, lineId = 'best' } = useParams<{ category: CategoryId; lineId?: string }>();
  const db = useDB();
  const nav = useNavigate();
  const [open, setOpen] = useState<Product | null>(null);

  if (category !== 'flower' && category !== 'vapes') return <Navigate to="/" replace />;

  const lines = linesOf(db, category);
  const lineIds = new Set(lines.map((l) => l.id));
  const inCategory = db.products.filter((p) => lineIds.has(p.lineId));
  const current = lines.find((l) => l.id === lineId);
  const hasDeals = category === 'vapes' && db.deals.some((d) => d.active && d.productIds.some((id) => inCategory.some((p) => p.id === id)));

  let shown: Product[];
  let title: string;
  if (lineId === 'best') {
    shown = inCategory.filter((p) => p.bestSeller);
    title = 'Best sellers';
  } else if (lineId === 'deals') {
    const dealIds = new Set(db.deals.filter((d) => d.active).flatMap((d) => d.productIds));
    shown = inCategory.filter((p) => dealIds.has(p.id));
    title = 'On a deal';
  } else if (current) {
    shown = inCategory.filter((p) => p.lineId === current.id);
    title = lineLabel(current);
  } else {
    return <Navigate to={`/shop/${category}`} replace />;
  }
  // Sold-out items sink to the end of the grid.
  shown = [...shown].sort((a, b) => Number(a.status === 'out') - Number(b.status === 'out') || b.createdAt - a.createdAt);

  const pill = (id: string, label: string) => (
    <Link key={id} to={`/shop/${category}${id === 'best' ? '' : `/${id}`}`} className={`pill${lineId === id ? ' is-on' : ''}`} aria-current={lineId === id ? 'page' : undefined} replace>
      {label}
    </Link>
  );

  return (
    <>
      <section className="cat-hero">
        <img src={HERO[category]} alt="" />
        <div className="smoke-edge" aria-hidden="true" />
        <div className="wrap cat-hero-inner">
          <button type="button" className="back" onClick={() => (window.history.length > 1 ? nav(-1) : nav('/'))}>
            <BackIcon size={20} /> Back
          </button>
          <h1 className="cat-title">{CATEGORY_NAMES[category]}</h1>
        </div>
      </section>

      <nav className="pills-bar" aria-label={`${CATEGORY_NAMES[category]} sections`}>
        <div className="wrap pills">
          {pill('best', 'Best sellers')}
          {hasDeals && pill('deals', 'Deals')}
          {category === 'flower'
            ? lines.map((l) => pill(l.id, l.name))
            : brandsOf(lines).map((b) => (
                <Fragment key={b}>
                  <span className="pill-group">{b}</span>
                  {lines.filter((l) => (l.brand ?? 'Other') === b).map((l) => pill(l.id, l.name.startsWith(b) ? l.name.slice(b.length).trim() : l.name))}
                </Fragment>
              ))}
        </div>
      </nav>

      <div className="wrap">
        <div className="grid-head">
          <h2 className="h-section">{title}</h2>
          {current?.potency && (
            <span className="grid-potency">
              <PotencyBars level={current.potency} label={false} /> {current.potency} of 4 potency
            </span>
          )}
          <span className="grid-count">{shown.length} {shown.length === 1 ? 'item' : 'items'}</span>
        </div>
        {shown.length ? (
          <div className="grid">
            {shown.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                line={db.lines.find((l) => l.id === p.lineId)}
                deals={db.deals}
                onOpen={() => setOpen(p)}
                showLine={lineId === 'best' || lineId === 'deals'}
              />
            ))}
          </div>
        ) : (
          <p className="empty">
            Nothing here yet. Check another section above.
          </p>
        )}
      </div>
      <ProductSheet product={open} onClose={() => setOpen(null)} />
    </>
  );
}
