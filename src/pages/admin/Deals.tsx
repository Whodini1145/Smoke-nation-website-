import { useState } from 'react';
import { DealBar } from '../../components/ProductCard';
import { showToast } from '../../components/Overlay';
import { uid, updateDB, useDB } from '../../data/store';
import type { Deal, DealKind } from '../../data/types';
import { cardBackground } from '../../lib/color';
import { byShelfOrder, linesOf } from '../../lib/catalog';
import { dealLabel, money } from '../../lib/pricing';
import { LineNav, type LineSel } from './LineNav';
import { MoneyInput, confirmDelete } from './shared';

function DealEditor({ initial, isNew, onDone }: { initial: Deal; isNew: boolean; onDone: () => void }) {
  const db = useDB();
  const [d, setD] = useState<Deal>(initial);
  const [sel, setSel] = useState<LineSel>(() => {
    const firstLine = db.products.find((p) => initial.productIds.includes(p.id))?.lineId;
    const line = db.lines.find((l) => l.id === firstLine) ?? linesOf(db, 'vapes')[0];
    return { category: 'vapes', brand: line?.brand, lineId: line?.id };
  });
  const [error, setError] = useState('');
  const picked = new Set(d.productIds);
  const lineProducts = db.products.filter((p) => p.lineId === sel.lineId).sort(byShelfOrder);
  const allOn = lineProducts.length > 0 && lineProducts.every((p) => picked.has(p.id));
  const counts = Object.fromEntries(db.lines.map((l) => [l.id, db.products.filter((p) => p.lineId === l.id && picked.has(p.id)).length]));

  const togg = (ids: string[], on: boolean) => {
    const s = new Set(d.productIds);
    ids.forEach((id) => (on ? s.add(id) : s.delete(id)));
    setD({ ...d, productIds: [...s] });
  };

  function save() {
    if (d.qty < 2) return setError('A deal needs at least 2 items.');
    if (!(d.value > 0)) return setError(d.kind === 'bundle' ? 'Enter the deal price.' : 'Enter how much comes off.');
    if (!d.productIds.length) return setError('Check at least one item that counts toward this deal.');
    const clean = { ...d, name: d.name.trim() || dealLabel(d) };
    updateDB((db) => {
      const i = db.deals.findIndex((x) => x.id === clean.id);
      if (i >= 0) db.deals[i] = clean;
      else db.deals.push(clean);
    });
    showToast(isNew ? `Created ${clean.name}` : `Saved ${clean.name}`);
    onDone();
  }

  return (
    <div className="editor editor-deal">
      <div className="editor-fields">
        <div className="deal-rule">
          <label>
            <span className="field-label">Deal type</span>
            <select value={d.kind} onChange={(e) => setD({ ...d, kind: e.target.value as DealKind })}>
              <option value="bundle">Buy a set number for one price</option>
              <option value="amountOff">Take money off when they buy a set number</option>
            </select>
          </label>
          <label>
            <span className="field-label">How many items</span>
            <input type="number" min={2} max={10} value={d.qty} onChange={(e) => setD({ ...d, qty: Math.max(2, Number(e.target.value) || 2) })} />
          </label>
          <MoneyInput label={d.kind === 'bundle' ? `Price for all ${d.qty}` : 'Amount off'} value={d.value || undefined} onChange={(v) => setD({ ...d, value: v ?? 0 })} />
        </div>
        <label>
          <span className="field-label">Name (optional)</span>
          <input value={d.name} placeholder={d.value ? dealLabel(d) : 'e.g. Foger Pods 2 for $35'} onChange={(e) => setD({ ...d, name: e.target.value })} />
        </label>
        <p className="fine">
          Customers see “{d.value ? dealLabel(d) : '…'}” under the price on every checked item. It applies again for every {d.qty} items in the cart, and flavors can be mixed.
        </p>

        <h3 className="h-sub">Items in this deal ({d.productIds.length})</h3>
        <LineNav sel={sel} onChange={(s) => setSel({ ...s, category: 'vapes' })} counts={counts} />
        {lineProducts.length ? (
          <>
            <label className="check">
              <input type="checkbox" checked={allOn} onChange={() => togg(lineProducts.map((p) => p.id), !allOn)} />
              <span>Select all in this line</span>
            </label>
            <ul className="pick-list">
              {lineProducts.map((p) => (
                <li key={p.id}>
                  <label className={`pick${picked.has(p.id) ? ' is-on' : ''}`}>
                    <input type="checkbox" checked={picked.has(p.id)} onChange={(e) => togg([p.id], e.target.checked)} />
                    <span className="row-thumb" style={{ background: cardBackground(p.hue, p.saturation, p.intensity) }}>{p.photo && <img src={p.photo} alt="" />}</span>
                    <span>{p.name}</span>
                    <span className="pick-price">{p.price !== undefined ? money(p.price) : ''}</span>
                  </label>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="empty">No products in this line yet.</p>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={save}>{isNew ? 'Create deal' : 'Save deal'}</button>
          <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default function DealsTab() {
  const db = useDB();
  const [editing, setEditing] = useState<{ deal: Deal; isNew: boolean } | null>(null);

  if (editing) return <div className="tab"><DealEditor initial={editing.deal} isNew={editing.isNew} onDone={() => setEditing(null)} /></div>;

  return (
    <div className="tab">
      <div className="list-head">
        <p className="fine">Deals are for vapes. Flower sizes already get cheaper per gram as they go up.</p>
        <button type="button" className="btn btn-primary btn-small" onClick={() => setEditing({ deal: { id: uid('deal'), name: '', qty: 2, kind: 'bundle', value: 0, productIds: [], active: true }, isNew: true })}>
          New deal
        </button>
      </div>
      <ul className="admin-list">
        {db.deals.map((d) => {
          const items = db.products.filter((p) => d.productIds.includes(p.id));
          return (
            <li key={d.id} className={`admin-row${d.active ? '' : ' is-muted'}`}>
              <div className="row-main">
                <span className="row-name">{d.name}</span>
                <span className="row-meta"><DealBar deal={d} /></span>
                <span className="row-desc">{items.length} item{items.length === 1 ? '' : 's'}: {items.map((p) => p.name).join(', ') || 'none yet'}</span>
              </div>
              <div className="row-actions">
                <button type="button" className={`btn btn-small btn-toggle${d.active ? ' is-on-active' : ''}`} aria-pressed={d.active} onClick={() => updateDB((x) => (x.deals.find((y) => y.id === d.id)!.active = !d.active))}>
                  {d.active ? 'On' : 'Off'}
                </button>
                <button type="button" className="btn btn-small btn-ghost" onClick={() => setEditing({ deal: d, isNew: false })}>Edit</button>
                <button type="button" className="btn btn-small btn-ghost danger" onClick={() => confirmDelete(d.name) && updateDB((x) => (x.deals = x.deals.filter((y) => y.id !== d.id)))}>Remove</button>
              </div>
            </li>
          );
        })}
      </ul>
      {!db.deals.length && <p className="empty">No deals yet. Use New deal to set one up, like 2 Foger Pods for $35.</p>}
    </div>
  );
}
