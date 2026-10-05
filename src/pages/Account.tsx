import { useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { showToast } from '../components/Overlay';
import { getDB, uid, updateDB, updateSession, useDB, useSession } from '../data/store';
import type { Order, OrderStatus } from '../data/types';
import { money2 } from '../lib/pricing';
import { addToCart, hashPassword } from '../lib/util';

export const STATUS_TEXT: Record<OrderStatus, string> = {
  new: 'Received',
  ready: 'Ready for pickup',
  picked_up: 'Picked up',
  shipped: 'Shipped',
  cancelled: 'Cancelled',
};

const dateFmt = (t: number) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

export function OrderItems({ order, buyAgain }: { order: Order; buyAgain?: boolean }) {
  const db = useDB();
  return (
    <ul className="order-items">
      {order.items.map((it, i) => {
        const p = db.products.find((x) => x.id === it.productId);
        const available = p && p.status !== 'out';
        return (
          <li key={i}>
            <span className="oi-name">
              {it.qty} × {it.name}
              {it.size ? ` (${it.size})` : ''}
              <span className="oi-line">{it.lineName}</span>
            </span>
            <span className="oi-price">{money2(it.unitPrice * it.qty)}</span>
            {buyAgain && (
              <button
                type="button"
                className="btn btn-small btn-ghost"
                disabled={!available}
                onClick={() => {
                  addToCart(it.productId, it.size, it.qty);
                  showToast(`Added ${it.name} to your cart`, { to: '/cart', label: 'View cart' });
                }}
              >
                {available ? 'Buy again' : p ? 'Sold out' : 'No longer sold'}
              </button>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function OrderTotals({ order }: { order: Order }) {
  return (
    <dl className="summary">
      <div><dt>Subtotal</dt><dd>{money2(order.subtotal)}</dd></div>
      {order.dealSavings > 0 && <div className="summary-deal"><dt>{order.dealNames.join(', ')}</dt><dd>−{money2(order.dealSavings)}</dd></div>}
      {order.fulfillment === 'ship' && <div><dt>Shipping</dt><dd>{order.shipping ? money2(order.shipping) : 'Free'}</dd></div>}
      <div><dt>Sales tax</dt><dd>{money2(order.tax)}</dd></div>
      {order.cardFee > 0 && <div><dt>Card processing</dt><dd>{money2(order.cardFee)}</dd></div>}
      <div className="summary-total"><dt>Total</dt><dd>{money2(order.total)}</dd></div>
    </dl>
  );
}

export function OrderDone() {
  const { id } = useParams();
  const db = useDB();
  const session = useSession();
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return (
      <div className="wrap page">
        <h1 className="h-display">Order not found</h1>
        <p>Check your email for your order number, or <Link to="/">go back to the shop</Link>.</p>
      </div>
    );
  }
  return (
    <div className="wrap page narrow-page">
      <h1 className="h-display">Order #{order.number} is in</h1>
      {order.fulfillment === 'pickup' ? (
        <p className="lead">
          We'll text {order.phone} when it's ready. Pick it up at {db.settings.address}, {db.settings.city}, and bring a photo ID showing you're 21 or older.
        </p>
      ) : (
        <p className="lead">
          We'll email {order.email} when it ships to {order.address?.street}, {order.address?.city}. Someone 21 or older needs to sign for it.
        </p>
      )}
      <OrderItems order={order} />
      <OrderTotals order={order} />
      <div className="btn-row">
        <Link to="/" className="btn btn-primary">Back to the shop</Link>
        {session.customerId ? <Link to="/account" className="btn btn-ghost">See all your orders</Link> : <Link to="/account" className="btn btn-ghost">Create an account to track orders</Link>}
      </div>
    </div>
  );
}

function AuthForms() {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const email = f.email.trim().toLowerCase();
    const hash = await hashPassword(email, f.password);
    const db = getDB();
    const existing = db.customers.find((c) => c.email === email);
    if (mode === 'in') {
      if (!existing || existing.passwordHash !== hash) return setError('That email and password don’t match an account. Check them, or create an account.');
      updateSession({ customerId: existing.id });
    } else {
      if (existing) return setError('An account with that email already exists. Sign in instead.');
      if (f.password.length < 8) return setError('Use at least 8 characters for your password.');
      const id = uid('c');
      updateDB((d) => {
        d.customers.push({ id, email, name: f.name.trim(), passwordHash: hash });
        // Past guest orders under this email join the new account.
        d.orders.forEach((o) => {
          if (!o.customerId && o.email === email) o.customerId = id;
        });
      });
      updateSession({ customerId: id });
    }
  }

  return (
    <div className="auth">
      <div className="seg" role="tablist">
        <button type="button" role="tab" aria-selected={mode === 'in'} className={mode === 'in' ? 'is-on' : ''} onClick={() => setMode('in')}>Sign in</button>
        <button type="button" role="tab" aria-selected={mode === 'up'} className={mode === 'up' ? 'is-on' : ''} onClick={() => setMode('up')}>Create account</button>
      </div>
      <form className="fields" onSubmit={submit}>
        {mode === 'up' && (
          <label>
            Name
            <input required autoComplete="name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </label>
        )}
        <label>
          Email
          <input required type="email" autoComplete="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </label>
        <label>
          Password
          <input required type="password" autoComplete={mode === 'in' ? 'current-password' : 'new-password'} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} minLength={mode === 'up' ? 8 : undefined} />
        </label>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block">{mode === 'in' ? 'Sign in' : 'Create account'}</button>
        <p className="fine">You don't need an account to order. With one, your past orders are saved here so you can buy your favorites again in one tap.</p>
      </form>
    </div>
  );
}

export default function Account() {
  const db = useDB();
  const session = useSession();
  const me = db.customers.find((c) => c.id === session.customerId);

  if (!me) {
    return (
      <div className="wrap page narrow-page">
        <h1 className="h-display">Your account</h1>
        <AuthForms />
      </div>
    );
  }

  const orders = db.orders.filter((o) => o.customerId === me.id);
  return (
    <div className="wrap page narrow-page">
      <h1 className="h-display">Hey, {me.name.split(' ')[0] || 'there'}</h1>
      <p className="lead">
        Signed in as {me.email}.{' '}
        <button type="button" className="link-btn" onClick={() => updateSession({ customerId: undefined })}>
          Sign out
        </button>
      </p>
      <h2 className="h-section">Order history</h2>
      {orders.length ? (
        <ul className="history">
          {orders.map((o) => (
            <li key={o.id} className="history-order">
              <div className="history-head">
                <span className="history-num">Order #{o.number}</span>
                <span>{dateFmt(o.createdAt)}</span>
                <span className={`status status-${o.status}`}>{STATUS_TEXT[o.status]}</span>
                <span className="history-total">{money2(o.total)}</span>
              </div>
              <OrderItems order={o} buyAgain />
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">
          No orders yet. Once you order, it shows up here with a Buy again button. <Link to="/shop/vapes">Start shopping</Link>
        </p>
      )}
    </div>
  );
}
