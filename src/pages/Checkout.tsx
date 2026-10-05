import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getDB, uid, updateDB, useCart, useDB, useSession } from '../data/store';
import type { Fulfillment, Order } from '../data/types';
import { lineLabel } from '../lib/catalog';
import { money, money2, priceCart } from '../lib/pricing';
import { clearCart } from '../lib/util';
import { Summary } from './Cart';

export default function Checkout() {
  const db = useDB();
  const cart = useCart();
  const session = useSession();
  const nav = useNavigate();
  const me = db.customers.find((c) => c.id === session.customerId);

  const [chosen, setFulfillment] = useState<Fulfillment>('pickup');
  const [form, setForm] = useState({
    name: me?.name ?? '',
    email: me?.email ?? '',
    phone: '',
    street: '',
    city: '',
    state: 'TX',
    zip: '',
    note: '',
  });
  const [ageOk, setAgeOk] = useState(false);
  const [error, setError] = useState('');

  const shipBlocked = priceCart(cart, db, db.settings).shippingBlockedBy.length > 0;
  const fulfillment: Fulfillment = shipBlocked ? 'pickup' : chosen;
  const t = priceCart(cart, db, db.settings, fulfillment);
  if (!t.lines.length) return <Navigate to="/cart" replace />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  function placeOrder(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (t.belowMinimum > 0) return setError(`The minimum order is ${money(db.settings.minOrder)}. Add ${money2(t.belowMinimum)} more to check out.`);
    if (!ageOk) return setError('Confirm you are 21 or older to place the order.');
    const latest = getDB();
    const order: Order = {
      id: uid('o'),
      number: 1001 + latest.orders.length,
      createdAt: Date.now(),
      customerId: me?.id,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      fulfillment,
      address: fulfillment === 'ship' ? { street: form.street.trim(), city: form.city.trim(), state: form.state.trim(), zip: form.zip.trim() } : undefined,
      items: t.lines.map((l) => ({
        productId: l.product.id,
        name: l.product.name,
        lineName: l.productLine ? lineLabel(l.productLine) : '',
        size: l.line.size,
        qty: l.line.qty,
        unitPrice: l.unit,
      })),
      subtotal: t.subtotal,
      dealSavings: t.dealSavings,
      dealNames: t.deals.map((d) => `${d.name}${d.times > 1 ? ` ×${d.times}` : ''}`),
      shipping: t.shipping,
      cardFee: t.cardFee,
      tax: t.tax,
      total: t.total,
      status: 'new',
      note: form.note.trim() || undefined,
    };
    updateDB((d) => {
      d.orders.unshift(order);
    });
    clearCart();
    nav(`/order/${order.id}`, { replace: true });
  }

  return (
    <div className="wrap page">
      <h1 className="h-display">Check out</h1>
      <form className="checkout" onSubmit={placeOrder}>
        <div className="checkout-main">
          <fieldset className="choice">
            <legend className="h-section">How do you want it?</legend>
            <label className={`choice-card${fulfillment === 'pickup' ? ' is-on' : ''}`}>
              <input type="radio" name="f" checked={fulfillment === 'pickup'} onChange={() => setFulfillment('pickup')} />
              <span className="choice-title">Pick up at the shop</span>
              <span className="choice-sub">
                {db.settings.address}, {db.settings.city}. Free.
              </span>
            </label>
            <label className={`choice-card${fulfillment === 'ship' ? ' is-on' : ''}${shipBlocked ? ' is-disabled' : ''}`}>
              <input type="radio" name="f" checked={fulfillment === 'ship'} disabled={shipBlocked} onChange={() => setFulfillment('ship')} />
              <span className="choice-title">Ship it to me</span>
              <span className="choice-sub">
                {shipBlocked
                  ? `${t.shippingBlockedBy.join(' and ')} can't be shipped. Choose pickup, or remove ${t.shippingBlockedBy.length > 1 ? 'them' : 'those items'} to ship.`
                  : db.settings.freeShippingOver > 0
                    ? `${money(db.settings.shippingFee)}, free over ${money(db.settings.freeShippingOver)}.`
                    : `${money(db.settings.shippingFee)} flat rate.`}
              </span>
            </label>
          </fieldset>

          {fulfillment === 'pickup' && (
            <p className="notice">
              Pickup orders are paid online now. Bring a valid photo ID showing you're 21 or older when you pick up. We'll have it ready during store hours.
            </p>
          )}

          <fieldset className="fields">
            <legend className="h-section">Your info</legend>
            <label>
              Full name
              <input required autoComplete="name" value={form.name} onChange={set('name')} />
            </label>
            <label>
              Email
              <input required type="email" autoComplete="email" value={form.email} onChange={set('email')} />
            </label>
            <label>
              Phone
              <input required type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} placeholder="So we can text when it's ready" />
            </label>
          </fieldset>

          {fulfillment === 'ship' && (
            <fieldset className="fields">
              <legend className="h-section">Ship to</legend>
              <label>
                Street address
                <input required autoComplete="street-address" value={form.street} onChange={set('street')} />
              </label>
              <div className="fields-row">
                <label>
                  City
                  <input required autoComplete="address-level2" value={form.city} onChange={set('city')} />
                </label>
                <label className="narrow">
                  State
                  <input required autoComplete="address-level1" value={form.state} onChange={set('state')} maxLength={2} />
                </label>
                <label className="narrow">
                  ZIP
                  <input required autoComplete="postal-code" inputMode="numeric" value={form.zip} onChange={set('zip')} pattern="\d{5}(-\d{4})?" />
                </label>
              </div>
            </fieldset>
          )}

          <fieldset className="fields">
            <legend className="h-section">Payment</legend>
            <p className="notice notice-quiet">
              Card payment connects here once the shop's payment processor is set up. In this preview, placing an order saves it without charging anything.
            </p>
            <label>
              Note for the shop (optional)
              <textarea rows={2} value={form.note} onChange={set('note')} />
            </label>
            <label className="check">
              <input type="checkbox" checked={ageOk} onChange={(e) => setAgeOk(e.target.checked)} />
              <span>I'm 21 or older and will show a valid ID at {fulfillment === 'pickup' ? 'pickup' : 'delivery'}.</span>
            </label>
          </fieldset>
          {!me && (
            <p className="fine">
              Want to see this order later? <Link to="/account">Sign in or create an account</Link> first. Orders under the same email are added to your account.
            </p>
          )}
        </div>

        <aside className="cart-side">
          <h2 className="h-section">Order</h2>
          <ul className="mini-lines">
            {t.lines.map((l) => (
              <li key={l.line.key}>
                <span>
                  {l.line.qty} × {l.product.name}
                  {l.line.size ? ` (${l.line.size})` : ''}
                </span>
                <span>{money2(l.total)}</span>
              </li>
            ))}
          </ul>
          <Summary t={t} showShipping={fulfillment === 'ship'} />
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary btn-block">
            Place order, {money2(t.total)}
          </button>
        </aside>
      </form>
    </div>
  );
}
