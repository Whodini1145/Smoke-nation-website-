import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { getDB, uid, updateDB, useCart, useDB, useSession, USE_FIREBASE } from '../data/store';
import type { Fulfillment, Order } from '../data/types';
import { money, money2, priceCart } from '../lib/pricing';
import { clearCart } from '../lib/util';
import { isCounted, setStock } from '../lib/stock';
import { AGE_CHECK_CONNECTED, verifyAge } from '../lib/ageCheck';
import { buildOrder, LAST_ORDER_KEY, type CheckoutRequest } from '../lib/order';
import { loadAccept, tokenizeCard } from '../lib/payment';
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
  const [card, setCard] = useState({ number: '', expiry: '', code: '', zip: '' });
  const [ageOk, setAgeOk] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Get the card script ready while the shopper fills in the form.
  useEffect(() => {
    if (USE_FIREBASE) loadAccept().catch(() => undefined);
  }, []);

  const shipBlocked = priceCart(cart, db, db.settings).shippingBlockedBy.length > 0;
  const fulfillment: Fulfillment = shipBlocked ? 'pickup' : chosen;
  const t = priceCart(cart, db, db.settings, fulfillment);
  if (!t.lines.length) return <Navigate to="/cart" replace />;

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  const setCardField = (k: keyof typeof card) => (e: React.ChangeEvent<HTMLInputElement>) => setCard({ ...card, [k]: e.target.value });

  function done(order: Order) {
    try {
      sessionStorage.setItem(LAST_ORDER_KEY, JSON.stringify(order));
    } catch {
      /* private mode: the confirmation page still gets the order below */
    }
    clearCart();
    nav(`/order/${order.id}`, { replace: true, state: { order } });
  }

  async function placeOrder(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError('');
    if (!ageOk) return setError('Confirm you are 21 or older to place the order.');
    const request: CheckoutRequest = {
      cart,
      fulfillment,
      name: form.name,
      email: form.email,
      phone: form.phone,
      address: fulfillment === 'ship' ? { street: form.street, city: form.city, state: form.state, zip: form.zip } : undefined,
      note: form.note,
      ageCheck: 'not_connected',
    };
    // Same checks the payment server runs, so most problems show before the card is touched.
    const check = buildOrder(request, { ...db, settings: db.settings }, { id: 'check', number: 0, now: 0 });
    if (!check.ok) return setError(check.error);

    setBusy(true);
    try {
      request.ageCheck = await verifyAge({ name: form.name, email: form.email, phone: form.phone });
      if (request.ageCheck === 'failed') throw new Error('We couldn’t verify your age, so this order can’t be placed. You can still shop in store with a valid ID.');

      if (USE_FIREBASE) {
        const token = await tokenizeCard(card);
        const { payForOrder } = await import('../data/firebase');
        done(await payForOrder(request, token));
        return;
      }

      // Preview copy (no database): save the order in this browser without charging anything.
      const latest = getDB();
      const r = buildOrder(request, { ...latest, settings: latest.settings }, { id: uid('o'), number: 1001 + latest.orders.length, now: Date.now(), customerId: me?.id });
      if (!r.ok) throw new Error(r.error);
      updateDB((d) => {
        d.orders.unshift(r.order);
        for (const [id, amount] of r.needed) {
          const p = d.products.find((x) => x.id === id);
          if (!p || !isCounted(p)) continue;
          setStock(p, p.stock! - amount, d.settings);
          p.lastOrderId = r.order.id;
        }
      });
      done(r.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Your card was not charged. Try again.');
      setBusy(false);
    }
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
            <legend className="h-section">Pay by card</legend>
            {USE_FIREBASE ? (
              <>
                <label>
                  Card number
                  <input required autoComplete="cc-number" inputMode="numeric" value={card.number} onChange={setCardField('number')} placeholder="1234 5678 9012 3456" maxLength={23} />
                </label>
                <div className="fields-row">
                  <label>
                    Expires
                    <input required autoComplete="cc-exp" inputMode="numeric" value={card.expiry} onChange={setCardField('expiry')} placeholder="MM/YY" maxLength={7} />
                  </label>
                  <label className="narrow">
                    Security code
                    <input required autoComplete="cc-csc" inputMode="numeric" value={card.code} onChange={setCardField('code')} placeholder="CVV" maxLength={4} />
                  </label>
                  <label className="narrow">
                    Billing ZIP
                    <input required autoComplete="billing postal-code" inputMode="numeric" value={card.zip} onChange={setCardField('zip')} maxLength={10} />
                  </label>
                </div>
                <p className="fine">Card details go straight to our processor, Authorize.Net (a Visa company), and are never stored by Smoke Nation.</p>
              </>
            ) : (
              <p className="notice notice-quiet">This is the preview copy: placing an order saves it here without charging a card.</p>
            )}
            {AGE_CHECK_CONNECTED && <p className="notice notice-quiet">When you place your order, you’ll confirm your ID with our age check partner, then pay.</p>}
          </fieldset>

          <fieldset className="fields">
            <legend className="h-section">Last step</legend>
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
              Want to see this order later? <Link to="/account">Sign in or create an account</Link> first.
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
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            {busy ? 'Processing… please wait' : `Pay ${money2(t.total)} and place order`}
          </button>
        </aside>
      </form>
    </div>
  );
}
