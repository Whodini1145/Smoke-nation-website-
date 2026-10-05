import { useState, type FormEvent } from 'react';
import { showToast } from '../../components/Overlay';
import { getDB, resetDB, uid, updateDB, updateSession, useDB, useSession } from '../../data/store';
import type { Settings } from '../../data/types';
import { hashPassword } from '../../lib/util';
import { MAX_ADMINS, MoneyInput } from './shared';

function NumberField({ label, value, suffix, onChange, step = 0.01 }: { label: string; value: number; suffix: string; onChange: (n: number) => void; step?: number }) {
  return (
    <label className="money">
      <span className="field-label">{label}</span>
      <span className="money-box">
        <input type="number" min={0} step={step} value={value} onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))} />
        <span aria-hidden="true">{suffix}</span>
      </span>
    </label>
  );
}

function AdminAccounts() {
  const db = useDB();
  const session = useSession();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  async function add(e: FormEvent) {
    e.preventDefault();
    setError('');
    const email = f.email.trim().toLowerCase();
    if (getDB().admins.some((a) => a.email === email)) return setError('That email already has staff access.');
    if (f.password.length < 10) return setError('Use at least 10 characters for the password.');
    const passwordHash = await hashPassword(email, f.password);
    updateDB((d) => {
      d.admins.push({ id: uid('a'), email, name: f.name.trim(), passwordHash });
    });
    setF({ name: '', email: '', password: '' });
    showToast(`Added ${email}`);
  }

  async function changePw(e: FormEvent) {
    e.preventDefault();
    const me = getDB().admins.find((a) => a.id === session.adminId);
    if (!me) return;
    if (pw.length < 10) return setError('Use at least 10 characters for the password.');
    const passwordHash = await hashPassword(me.email, pw);
    updateDB((d) => (d.admins.find((a) => a.id === me.id)!.passwordHash = passwordHash));
    setPw('');
    showToast('Password changed');
  }

  return (
    <section className="admin-section">
      <h2 className="h-section">Staff accounts</h2>
      <ul className="admin-list">
        {db.admins.map((a) => (
          <li key={a.id} className="admin-row">
            <div className="row-main">
              <span className="row-name">{a.name || a.email}{a.id === session.adminId ? ' (you)' : ''}</span>
              <span className="row-meta">{a.email}</span>
            </div>
            {a.id !== session.adminId && (
              <div className="row-actions">
                <button type="button" className="btn btn-small btn-ghost danger" onClick={() => window.confirm(`Remove staff access for ${a.email}?`) && updateDB((d) => (d.admins = d.admins.filter((x) => x.id !== a.id)))}>
                  Remove access
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {db.admins.length < MAX_ADMINS && (
        <form className="fields fields-inline" onSubmit={add}>
          <h3 className="h-sub">Add the second staff account</h3>
          <label>Name<input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label>Email<input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label>Password<input required type="password" autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          <button type="submit" className="btn btn-primary btn-small">Add staff account</button>
        </form>
      )}
      <form className="fields fields-inline" onSubmit={changePw}>
        <h3 className="h-sub">Change your password</h3>
        <label>New password<input type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} /></label>
        <button type="submit" className="btn btn-ghost btn-small" disabled={!pw}>Change password</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}

export default function SettingsTab() {
  const db = useDB();
  const s = db.settings;
  const set = (patch: Partial<Settings>) => updateDB((d) => Object.assign(d.settings, patch));

  return (
    <div className="tab">
      <section className="admin-section">
        <h2 className="h-section">Checkout</h2>
        <div className="settings-grid">
          <NumberField label="Sales tax" value={s.taxRate} suffix="%" onChange={(taxRate) => set({ taxRate })} />
          <NumberField label="Card processing fee (0 for none)" value={s.cardFeePercent} suffix="%" onChange={(cardFeePercent) => set({ cardFeePercent })} />
          <MoneyInput label="Shipping cost" value={s.shippingFee} onChange={(v) => set({ shippingFee: v ?? 0 })} />
          <MoneyInput label="Free shipping over (blank for never)" value={s.freeShippingOver || undefined} onChange={(v) => set({ freeShippingOver: v ?? 0 })} />
          <MoneyInput label="Minimum order (blank for none)" value={s.minOrder || undefined} onChange={(v) => set({ minOrder: v ?? 0 })} />
        </div>
        <fieldset className="fields">
          <legend className="field-label">What can be shipped</legend>
          <label className="check">
            <input type="checkbox" checked={s.shippingAllowed.flower} onChange={(e) => set({ shippingAllowed: { ...s.shippingAllowed, flower: e.target.checked } })} />
            <span>THCA flower can be shipped</span>
          </label>
          <label className="check">
            <input type="checkbox" checked={s.shippingAllowed.vapes} onChange={(e) => set({ shippingAllowed: { ...s.shippingAllowed, vapes: e.target.checked } })} />
            <span>Vapes can be shipped</span>
          </label>
          <p className="fine">Unchecked categories are pickup only. Check federal (PACT Act) and carrier rules before turning vape shipping on.</p>
        </fieldset>
      </section>

      <section className="admin-section">
        <h2 className="h-section">Store info</h2>
        <div className="settings-grid">
          <label><span className="field-label">Street address</span><input value={s.address} onChange={(e) => set({ address: e.target.value })} /></label>
          <label><span className="field-label">City, state, ZIP</span><input value={s.city} onChange={(e) => set({ city: e.target.value })} /></label>
          <label><span className="field-label">Phone</span><input type="tel" value={s.phone} onChange={(e) => set({ phone: e.target.value })} /></label>
          <label><span className="field-label">Email</span><input type="email" value={s.email} onChange={(e) => set({ email: e.target.value })} /></label>
        </div>
        <fieldset className="fields">
          <legend className="field-label">Hours</legend>
          {s.hours.map((h, i) => (
            <div key={i} className="field-pair hours-row">
              <input aria-label="Days" value={h.label} onChange={(e) => set({ hours: s.hours.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} />
              <input aria-label="Hours" value={h.hours} onChange={(e) => set({ hours: s.hours.map((x, j) => (j === i ? { ...x, hours: e.target.value } : x)) })} />
              <button type="button" className="link-btn danger" onClick={() => set({ hours: s.hours.filter((_, j) => j !== i) })}>Remove</button>
            </div>
          ))}
          <button type="button" className="btn btn-ghost btn-small" onClick={() => set({ hours: [...s.hours, { label: '', hours: '' }] })}>Add a row</button>
        </fieldset>
      </section>

      <section className="admin-section">
        <h2 className="h-section">About us page</h2>
        <label><span className="field-label">Heading</span><input value={s.aboutTitle} onChange={(e) => set({ aboutTitle: e.target.value })} /></label>
        <label><span className="field-label">Story (leave a blank line between paragraphs)</span><textarea rows={10} value={s.aboutBody} onChange={(e) => set({ aboutBody: e.target.value })} /></label>
      </section>

      <AdminAccounts />

      <section className="admin-section">
        <h2 className="h-section">Preview data</h2>
        <p className="fine">This preview saves everything in this browser only. Starting over puts back the sample products and removes test orders and accounts.</p>
        <button
          type="button"
          className="btn btn-ghost btn-small danger"
          onClick={() => {
            if (!window.confirm('Start over with the sample data? Your changes, test orders and accounts in this browser will be erased.')) return;
            resetDB();
            updateSession({ adminId: undefined, customerId: undefined });
          }}
        >
          Start over with sample data
        </button>
      </section>
    </div>
  );
}
