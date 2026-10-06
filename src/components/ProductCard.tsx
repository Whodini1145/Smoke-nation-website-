import type { Deal, FlowerSize, Line, Product } from '../data/types';
import { FLOWER_DISCLAIMER } from '../data/seed';
import { cardBackground, edgeColor } from '../lib/color';
import { dealLabel, dealsFor, isDiscounted, money, regularPrice, unitPrice } from '../lib/pricing';
import { TagIcon } from './Icons';
import { lineLabel, STRAIN_NAMES } from '../lib/catalog';

export function PotencyBars({ level, label = true }: { level: number; label?: boolean }) {
  return (
    <span className="potency" role="img" aria-label={`Potency ${level} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={i <= level ? 'on' : ''} />
      ))}
      {label && <span className="potency-text">Potency</span>}
    </span>
  );
}

/** Placeholder art when a product has no photo yet. */
export function Placeholder({ category, color }: { category: string; color: string }) {
  if (category === 'flower') {
    return (
      <svg className="ph" viewBox="0 0 100 120" aria-hidden="true">
        <g fill={color} opacity="0.85">
          <ellipse cx="50" cy="40" rx="17" ry="20" />
          <ellipse cx="35" cy="58" rx="16" ry="18" />
          <ellipse cx="65" cy="58" rx="16" ry="18" />
          <ellipse cx="50" cy="74" rx="18" ry="20" />
          <ellipse cx="40" cy="88" rx="12" ry="12" />
          <ellipse cx="60" cy="88" rx="12" ry="12" />
        </g>
        <path d="M50 96v18" stroke={color} strokeWidth="4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg className="ph" viewBox="0 0 100 120" aria-hidden="true">
      <rect x="40" y="6" width="20" height="18" rx="6" fill={color} opacity="0.55" />
      <rect x="28" y="20" width="44" height="94" rx="16" fill={color} opacity="0.85" />
      <rect x="36" y="34" width="28" height="40" rx="8" fill="#fff" opacity="0.35" />
    </svg>
  );
}

export function ProductArt({ product, category }: { product: Product; category: string }) {
  return (
    <div className="art" style={{ background: cardBackground(product.hue, product.saturation, product.intensity) }}>
      {product.photo ? (
        <img src={product.photo} alt="" loading="lazy" />
      ) : (
        <Placeholder category={category} color={edgeColor(product.hue, product.saturation, Math.min(100, product.intensity + 25))} />
      )}
      {product.status === 'out' && <span className="badge badge-out">Sold out</span>}
      {product.status === 'low' && <span className="badge badge-low">Running low</span>}
    </div>
  );
}

export function PriceTag({ product }: { product: Product }) {
  // Flower shows its cheapest size ("from"); vapes show their one price.
  const sizes = product.sizePrices ? (Object.keys(product.sizePrices) as FlowerSize[]) : [undefined];
  let size: FlowerSize | undefined;
  let now: number | undefined;
  for (const s of sizes) {
    const p = unitPrice(product, s);
    if (p !== undefined && (now === undefined || p < now)) {
      now = p;
      size = s;
    }
  }
  if (now === undefined) return <span className="price">Price coming soon</span>;
  const from = product.sizePrices ? <span className="from">from </span> : null;
  if (!isDiscounted(product, size)) {
    return (
      <span className="price">
        {from}
        {money(now)}
      </span>
    );
  }
  return (
    <span className="price">
      {from}
      <s className="was">{money(regularPrice(product, size)!)}</s> <span className="sale-flag">Sale</span> <span className="now">{money(now)}</span>
    </span>
  );
}

export function DealBar({ deal }: { deal: Deal }) {
  return (
    <span className="deal-bar">
      <TagIcon size={15} />
      {dealLabel(deal)}
    </span>
  );
}

export function ProductCard({
  product,
  line,
  deals,
  onOpen,
  showLine,
}: {
  product: Product;
  line?: Line;
  deals: Deal[];
  onOpen?: () => void;
  showLine?: boolean;
}) {
  const category = line?.category ?? (product.sizePrices ? 'flower' : 'vapes');
  const deal = category === 'vapes' ? dealsFor(product.id, deals)[0] : undefined;
  return (
    <article className={`card${product.status === 'out' ? ' is-out' : ''}`}>
      <button type="button" className="card-hit" onClick={onOpen} aria-label={`${product.name}, view details`} />
      <ProductArt product={product} category={category} />
      <div className="card-body">
        {showLine && line && <span className="card-line">{lineLabel(line)}</span>}
        <h3 className="card-name">{product.name}</h3>
        {product.strain && <span className={`strain-tag strain-${product.strain}`}>{STRAIN_NAMES[product.strain]}</span>}
        {category === 'flower' && line?.potency && <PotencyBars level={line.potency} />}
        <PriceTag product={product} />
        {deal && <DealBar deal={deal} />}
        {(category === 'flower' || product.description) && (
          <p className="card-desc">
            {category === 'flower' && <span className="disclaimer">{FLOWER_DISCLAIMER}.</span>} {product.description}
          </p>
        )}
      </div>
    </article>
  );
}
