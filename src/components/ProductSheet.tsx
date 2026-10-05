import { useEffect, useState } from 'react';
import { useDB } from '../data/store';
import { FLOWER_SIZES, type FlowerSize, type Product } from '../data/types';
import { FLOWER_DISCLAIMER } from '../data/seed';
import { lineLabel } from '../lib/catalog';
import { dealsFor, isDiscounted, money, regularPrice, unitPrice } from '../lib/pricing';
import { addToCart } from '../lib/util';
import { MinusIcon, PlusIcon } from './Icons';
import { Sheet, showToast } from './Overlay';
import { DealBar, PotencyBars, ProductArt } from './ProductCard';

export function ProductSheet({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const db = useDB();
  const [size, setSize] = useState<FlowerSize | undefined>();
  const [qty, setQty] = useState(1);

  const line = product ? db.lines.find((l) => l.id === product.lineId) : undefined;
  const isFlower = line?.category === 'flower';
  const sizes = isFlower ? FLOWER_SIZES.filter((s) => product?.sizePrices?.[s] !== undefined) : [];

  useEffect(() => {
    setQty(1);
    setSize(sizes.includes('3.5g') ? '3.5g' : sizes[0]);
  }, [product?.id]);

  if (!product || !line) return <Sheet open={false} onClose={onClose} label="">{null}</Sheet>;

  const now = unitPrice(product, isFlower ? size : undefined);
  const reg = regularPrice(product, isFlower ? size : undefined);
  const deals = isFlower ? [] : dealsFor(product.id, db.deals);
  const out = product.status === 'out';
  const canAdd = !out && now !== undefined && (!isFlower || !!size);

  function add() {
    if (!product || !canAdd) return;
    addToCart(product.id, isFlower ? size : undefined, qty);
    showToast(`Added ${qty} × ${product.name}${size ? ` (${size})` : ''}`, { to: '/cart', label: 'View cart' });
    onClose();
  }

  return (
    <Sheet open onClose={onClose} label={product.name}>
      <div className="detail">
        <ProductArt product={product} category={line.category} />
        <div className="detail-body">
          <p className="detail-line">{lineLabel(line)}</p>
          <h2 className="detail-name">{product.name}</h2>
          {isFlower && line.potency && <PotencyBars level={line.potency} />}
          {deals.map((d) => (
            <DealBar key={d.id} deal={d} />
          ))}
          <p className="detail-desc">
            {isFlower && <strong className="disclaimer">{FLOWER_DISCLAIMER}.</strong>} {product.description}
          </p>

          {isFlower && (
            <fieldset className="sizes">
              <legend>Size</legend>
              {sizes.map((s) => {
                const p = unitPrice(product, s)!;
                return (
                  <label key={s} className={`size${size === s ? ' is-on' : ''}`}>
                    <input type="radio" name="size" value={s} checked={size === s} onChange={() => setSize(s)} />
                    <span className="size-g">{s}</span>
                    <span className="size-p">
                      {isDiscounted(product, s) && <s>{money(regularPrice(product, s)!)}</s>} {money(p)}
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}

          <div className="buy-row">
            <div className="stepper" aria-label="Quantity">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="One fewer" disabled={qty <= 1}>
                <MinusIcon />
              </button>
              <output aria-live="polite">{qty}</output>
              <button type="button" onClick={() => setQty((q) => Math.min(20, q + 1))} aria-label="One more">
                <PlusIcon />
              </button>
            </div>
            <button type="button" className="btn btn-primary btn-grow" onClick={add} disabled={!canAdd}>
              {out ? 'Sold out' : now === undefined ? 'Price coming soon' : (
                <>
                  Add to cart <span className="btn-price">{reg !== undefined && now < reg && <s>{money(reg * qty)}</s>} {money(now * qty)}</span>
                </>
              )}
            </button>
          </div>
          {deals.length > 0 && <p className="hint">Deal price is applied in your cart. Mix any flavors in the deal.</p>}
        </div>
      </div>
    </Sheet>
  );
}
