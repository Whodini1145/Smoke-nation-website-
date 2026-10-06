import { useState } from 'react';
import { updateDB, useDB } from '../../data/store';
import type { OrderStatus } from '../../data/types';
import { money2 } from '../../lib/pricing';
import { OrderItems, OrderTotals, STATUS_TEXT } from '../Account';
import { AGE_CHECK_TEXT } from '../../lib/ageCheck';
import { isCounted, setStock, usage } from '../../lib/stock';

const FILTERS: { id: 'open' | 'all' | OrderStatus; label: string }[] = [
  { id: 'open', label: 'Open' },
  { id: 'new', label: 'New' },
  { id: 'ready', label: 'Ready' },
  { id: 'all', label: 'All' },
];

const when = (t: number) => new Date(t).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** Cancelling an order puts its items back in stock; un-cancelling takes them out again. */
function changeStatus(id: string, status: OrderStatus) {
  updateDB((d) => {
    const o = d.orders.find((x) => x.id === id)!;
    const wasCancelled = o.status === 'cancelled';
    o.status = status;
    const sign = !wasCancelled && status === 'cancelled' && o.stockApplied ? 1 : wasCancelled && status !== 'cancelled' && !o.stockApplied ? -1 : 0;
    if (!sign) return;
    for (const it of o.items) {
      const p = d.products.find((x) => x.id === it.productId);
      if (p && isCounted(p)) setStock(p, p.stock! + sign * usage(it.size, it.qty), d.settings);
    }
    o.stockApplied = sign < 0;
  });
}

export default function OrdersTab() {
  const db = useDB();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('open');
  const [open, setOpen] = useState<string | null>(null);
  const shown = db.orders.filter((o) =>
    filter === 'all' ? true : filter === 'open' ? o.status === 'new' || o.status === 'ready' : o.status === filter,
  );

  return (
    <div className="tab">
      <div className="chip-row">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" className={`chip${filter === f.id ? ' is-on' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>
      <ul className="admin-list orders">
        {shown.map((o) => (
          <li key={o.id} className="admin-row order-row">
            <button type="button" className="order-summary" onClick={() => setOpen(open === o.id ? null : o.id)} aria-expanded={open === o.id}>
              <span className="row-name">#{o.number} {o.name}</span>
              <span className="row-meta">
                {when(o.createdAt)}
                <span className={`tag ${o.fulfillment === 'ship' ? 'tag-ship' : ''}`}>{o.fulfillment === 'ship' ? 'Ship' : 'Pickup'}</span>
                <span className={`status status-${o.status}`}>{STATUS_TEXT[o.status]}</span>
              </span>
              <span className="order-total">{money2(o.total)}</span>
            </button>
            {open === o.id && (
              <div className="order-detail">
                <div className="order-contact">
                  <p>
                    <a href={`tel:${o.phone}`}>{o.phone}</a>
                    <br />
                    <a href={`mailto:${o.email}`}>{o.email}</a>
                  </p>
                  {o.address && (
                    <p>
                      {o.address.street}
                      <br />
                      {o.address.city}, {o.address.state} {o.address.zip}
                    </p>
                  )}
                  <p className={`tag ${o.ageCheck === 'passed' ? 'tag-deal' : o.ageCheck === 'failed' ? 'tag-out' : 'tag-low'}`} style={{ justifySelf: 'start' }}>
                    {AGE_CHECK_TEXT[o.ageCheck ?? 'not_connected']}. Check ID at pickup or delivery.
                  </p>
                  {o.note && <p className="notice notice-quiet">Note: {o.note}</p>}
                </div>
                <OrderItems order={o} />
                <OrderTotals order={o} />
                <label>
                  <span className="field-label">Status</span>
                  <select value={o.status} onChange={(e) => changeStatus(o.id, e.target.value as OrderStatus)}>
                    {(Object.keys(STATUS_TEXT) as OrderStatus[])
                      .filter((s) => (o.fulfillment === 'ship' ? s !== 'picked_up' && s !== 'ready' : s !== 'shipped'))
                      .map((s) => (
                        <option key={s} value={s}>{STATUS_TEXT[s]}</option>
                      ))}
                  </select>
                </label>
              </div>
            )}
          </li>
        ))}
      </ul>
      {!shown.length && <p className="empty">No {filter === 'all' ? '' : 'open '}orders right now. New orders show up here as soon as they're placed.</p>}
    </div>
  );
}
