import { Link } from 'react-router-dom';
import { MinusIcon, PlusIcon, TagIcon } from '../components/Icons';
import { ProductArt } from '../components/ProductCard';
import { useCart, useDB } from '../data/store';
import { lineLabel } from '../lib/catalog';
import { dealLabel, money, money2, priceCart, type CartTotals } from '../lib/pricing';
import { setLineQty } from '../lib/util';
import { maxAddable } from '../lib/stock';
import type { DB } from '../data/types';

/** "Add 1 more to get Buy 2 for $35" for deals the cart is close to. */
function dealNudges(t: CartTotals, db: DB): string[] {
  const out: string[] = [];
  for (const d of db.deals) {
    if (!d.active) continue;
    const have = t.lines.filter((l) => d.productIds.includes(l.product.id)).reduce((s, l) => s + l.line.qty, 0);
    const rem = have % d.qty;
    if (have > 0 && rem > 0) out.push(`Add ${d.qty - rem} more to get ${dealLabel(d)}.`);
  }
  return out;
}

export function Summary({ t, showShipping }: { t: CartTotals; showShipping?: boolean }) {
  return (
    <dl className="summary">
      <div>
        <dt>Subtotal</dt>
        <dd>{money2(t.subtotal)}</dd>
      </div>
      {t.deals.map((d) => (
        <div key={d.dealId} className="summary-deal">
          <dt>
            {d.name}
            {d.times > 1 ? ` ×${d.times}` : ''}
          </dt>
          <dd>−{money2(d.savings)}</dd>
        </div>
      ))}
      {showShipping && (
        <div>
          <dt>Shipping</dt>
          <dd>{t.shipping ? money2(t.shipping) : 'Free'}</dd>
        </div>
      )}
      <div>
        <dt>Sales tax</dt>
        <dd>{money2(t.tax)}</dd>
      </div>
      {t.cardFee > 0 && (
        <div>
          <dt>Card processing</dt>
          <dd>{money2(t.cardFee)}</dd>
        </div>
      )}
      <div className="summary-total">
        <dt>Total</dt>
        <dd>{money2(t.total)}</dd>
      </div>
    </dl>
  );
}

export default function Cart() {
  const db = useDB();
  const cart = useCart();
  const t = priceCart(cart, db, db.settings, 'pickup');
  const unavailable = cart.filter((c) => !t.lines.some((l) => l.line.key === c.key));
  const nudges = dealNudges(t, db);

  return (
    <div className="wrap page">
      <h1 className="h-display">Your cart</h1>
      {!t.lines.length && !unavailable.length ? (
        <div className="empty-block">
          <p>Your cart is empty.</p>
          <div className="btn-row">
            <Link to="/shop/flower" className="btn btn-primary">Shop flower</Link>
            <Link to="/shop/vapes" className="btn btn-ghost">Shop vapes</Link>
          </div>
        </div>
      ) : (
        <div className="cart-layout">
          <ul className="cart-lines">
            {t.lines.map((l) => (
              <li key={l.line.key} className="cart-line">
                <Link to={`/shop/${l.productLine?.category}/${l.product.lineId}`} className="cart-thumb" aria-hidden="true" tabIndex={-1}>
                  <ProductArt product={{ ...l.product, status: 'in' }} category={l.productLine?.category ?? 'vapes'} />
                </Link>
                <div className="cart-info">
                  <span className="cart-name">{l.product.name}</span>
                  <span className="cart-meta">
                    {l.productLine && lineLabel(l.productLine)}
                    {l.line.size && `, ${l.line.size}`}
                  </span>
                  <span className="cart-unit">
                    {l.unit < l.regular && <s>{money(l.regular)}</s>} {money(l.unit)} each
                  </span>
                </div>
                <div className="cart-qty">
                  <div className="stepper stepper-sm">
                    <button type="button" onClick={() => setLineQty(l.line.key, l.line.qty - 1)} aria-label={`Remove one ${l.product.name}`}>
                      <MinusIcon />
                    </button>
                    <output>{l.line.qty}</output>
                    <button type="button" onClick={() => setLineQty(l.line.key, l.line.qty + 1)} aria-label={`Add one ${l.product.name}`} disabled={maxAddable(l.product, l.line.size, cart) < 1}>
                      <PlusIcon />
                    </button>
                  </div>
                  <span className="cart-line-total">{money2(l.total)}</span>
                  <button type="button" className="link-btn" onClick={() => setLineQty(l.line.key, 0)}>
                    Remove
                  </button>
                </div>
              </li>
            ))}
            {unavailable.map((c) => (
              <li key={c.key} className="cart-line cart-gone">
                <span>An item in your cart sold out or was removed.</span>
                <button type="button" className="link-btn" onClick={() => setLineQty(c.key, 0)}>
                  Remove it
                </button>
              </li>
            ))}
          </ul>
          <aside className="cart-side">
            {nudges.map((n) => (
              <p key={n} className="nudge">
                <TagIcon size={16} /> {n}
              </p>
            ))}
            <Summary t={t} />
            <p className="fine">Tax shown for pickup. Shipping, if you choose it, is added at checkout.</p>
            <Link to="/checkout" className={`btn btn-primary btn-block${t.lines.length ? '' : ' is-disabled'}`} aria-disabled={!t.lines.length}>
              Check out
            </Link>
            <Link to="/" className="btn btn-ghost btn-block">Keep shopping</Link>
          </aside>
        </div>
      )}
    </div>
  );
}
