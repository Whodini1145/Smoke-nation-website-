import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { USE_FIREBASE, useDB, useSession } from '../../data/store';
import { friendlyError, setupMainAdmin, signOutStaff, staffSignIn } from '../../data/accounts';
import DealsTab from './Deals';
import HomeTab from './HomeScreen';
import MenuTab from './MenuPanel';
import OrdersTab from './Orders';
import ProductsTab from './Products';
import SettingsTab from './Settings';

const TABS = [
  { id: 'products', label: 'Products', C: ProductsTab },
  { id: 'deals', label: 'Deals', C: DealsTab },
  { id: 'orders', label: 'Orders', C: OrdersTab },
  { id: 'home', label: 'Home screen', C: HomeTab },
  { id: 'menu', label: 'Menu panel', C: MenuTab },
  { id: 'settings', label: 'Settings', C: SettingsTab },
] as const;

function AdminLogin() {
  const db = useDB();
  const firstRun = USE_FIREBASE ? db.mainAdminId === null : db.admins.length === 0;
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (firstRun && f.password !== f.confirm) return setError('The two passwords don’t match.');
    setBusy(true);
    try {
      if (firstRun) await setupMainAdmin(f.name, f.email, f.password);
      else await staffSignIn(f.email, f.password);
    } catch (err) {
      setError(await friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  if (USE_FIREBASE && db.mainAdminId === undefined) {
    return (
      <div className="wrap page narrow-page">
        <p className="lead">Loading…</p>
      </div>
    );
  }

  return (
    <div className="wrap page narrow-page">
      <h1 className="h-display">{firstRun ? 'Set up staff access' : 'Staff login'}</h1>
      {firstRun && <p className="lead">Create the main admin account. After you sign in, you can give anyone else staff access under Settings.</p>}
      <form className="fields" onSubmit={submit}>
        {firstRun && (
          <label>
            Your name
            <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
          </label>
        )}
        <label>
          Email
          <input required type="email" autoComplete="username" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        </label>
        <label>
          Password
          <input required type="password" autoComplete={firstRun ? 'new-password' : 'current-password'} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </label>
        {firstRun && (
          <label>
            Type the password again
            <input required type="password" autoComplete="new-password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} />
          </label>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'One moment…' : firstRun ? 'Create admin account' : 'Sign in'}</button>
      </form>
      <p className="fine">
        <Link to="/">Back to the shop</Link>
      </p>
    </div>
  );
}

export default function Admin() {
  const db = useDB();
  const session = useSession();
  const me = db.admins.find((a) => a.id === session.adminId);
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('products');
  if (!me) return <AdminLogin />;
  const newOrders = db.orders.filter((o) => o.status === 'new').length;
  const Current = TABS.find((t) => t.id === tab)!.C;

  return (
    <div className="admin">
      <div className="admin-bar">
        <div className="wrap admin-bar-inner">
          <h1 className="admin-title">Admin</h1>
          <span className="admin-who">
            {me.name || me.email}{' '}
            <button type="button" className="link-btn" onClick={() => void signOutStaff()}>
              Sign out
            </button>
          </span>
        </div>
        <nav className="wrap admin-tabs" aria-label="Admin sections">
          {TABS.map((t) => (
            <button key={t.id} type="button" className={`admin-tab${tab === t.id ? ' is-on' : ''}`} aria-current={tab === t.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
              {t.label}
              {t.id === 'orders' && newOrders > 0 && <span className="tab-count">{newOrders}</span>}
            </button>
          ))}
        </nav>
      </div>
      <div className="wrap admin-body">
        <Current />
      </div>
    </div>
  );
}
