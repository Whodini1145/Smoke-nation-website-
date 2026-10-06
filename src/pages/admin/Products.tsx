import { useMemo, useState } from 'react';
import { ProductCard } from '../../components/ProductCard';
import { showToast } from '../../components/Overlay';
import { uid, updateDB, useDB } from '../../data/store';
import { FLOWER_DISCLAIMER } from '../../data/seed';
import { FLOWER_SIZES, type DB, type Line, type Product, type SizePrices, type StockStatus, type Strain } from '../../data/types';
import { cardBackground } from '../../lib/color';
import { byShelfOrder, linesOf, STRAIN_NAMES, STRAINS } from '../../lib/catalog';
import { fromPrice, isDiscounted, money } from '../../lib/pricing';
import { isCounted, setStock, stockText } from '../../lib/stock';
import { ColorPicker, MoneyInput, PhotoField, confirmDelete } from './shared';
import { LineNav, type LineSel } from './LineNav';

const STATUS_LABEL: Record<StockStatus, string> = { in: 'In stock', low: 'Running low', out: 'Sold out' };

/** Rewrite a line's positions 0..n-1 in the given order. */
function renumber(d: DB, ordered: string[]) {
  ordered.forEach((id, i) => {
    const p = d.products.find((x) => x.id === id);
    if (p) p.sort = i;
  });
}

function lineOrder(d: DB, lineId: string): string[] {
  return d.products.filter((p) => p.lineId === lineId).sort(byShelfOrder).map((p) => p.id);
}

/** Move one product up (-1) or down (+1) within its line. */
function moveOne(id: string, dir: -1 | 1) {
  updateDB((d) => {
    const p = d.products.find((x) => x.id === id)!;
    const ids = lineOrder(d, p.lineId);
    const i = ids.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    renumber(d, ids);
  });
}

/** Move selected products to the top or bottom of their line, keeping their order. */
function moveMany(ids: string[], where: 'top' | 'bottom') {
  updateDB((d) => {
    const lineIds = new Set(d.products.filter((p) => ids.includes(p.id)).map((p) => p.lineId));
    for (const lineId of lineIds) {
      const order = lineOrder(d, lineId);
      const picked = order.filter((x) => ids.includes(x));
      const rest = order.filter((x) => !ids.includes(x));
      renumber(d, where === 'top' ? [...picked, ...rest] : [...rest, ...picked]);
    }
  });
}

function blankProduct(line: Line): Product {
  return {
    id: uid('p'),
    lineId: line.id,
    name: '',
    description: '',
    sizePrices: line.category === 'flower' ? {} : undefined,
    onSale: false,
    status: 'in',
    bestSeller: false,
    hue: 96,
    saturation: 55,
    intensity: 50,
    createdAt: Date.now(),
  };
}

function SizePriceInputs({ prices, onChange, label }: { prices: SizePrices; onChange: (p: SizePrices) => void; label: string }) {
  return (
    <fieldset className="size-prices">
      <legend className="field-label">{label}</legend>
      {FLOWER_SIZES.map((s) => (
        <MoneyInput key={s} label={s} value={prices[s]} onChange={(v) => onChange({ ...prices, [s]: v })} />
      ))}
    </fieldset>
  );
}

function ProductEditor({ initial, line, isNew, onDone }: { initial: Product; line: Line; isNew: boolean; onDone: () => void }) {
  const db = useDB();
  const [p, setP] = useState<Product>(initial);
  const [error, setError] = useState('');
  const isFlower = line.category === 'flower';
  const set = (patch: Partial<Product>) => setP((x) => ({ ...x, ...patch }));

  function save() {
    if (!p.name.trim()) return setError('Give the product a name.');
    if (!isFlower && p.price === undefined) return setError('Enter a price.');
    if (isFlower && !Object.values(p.sizePrices ?? {}).some((v) => v !== undefined)) return setError('Enter a price for at least one size.');
    if (p.onSale && !isFlower && p.salePrice === undefined) return setError('Enter the sale price, or uncheck "On sale".');
    const clean: Product = { ...p, name: p.name.trim(), description: p.description.trim() };
    if (clean.sort === undefined || clean.lineId !== initial.lineId) {
      const sorts = db.products.filter((x) => x.lineId === clean.lineId && x.id !== clean.id).map((x) => x.sort ?? 0);
      clean.sort = sorts.length ? Math.max(...sorts) + 1 : 0;
    }
    updateDB((d) => {
      const i = d.products.findIndex((x) => x.id === clean.id);
      if (i >= 0) d.products[i] = clean;
      else d.products.push(clean);
    });
    showToast(isNew ? `Added ${clean.name}` : `Saved ${clean.name}`);
    onDone();
  }

  return (
    <div className="editor">
      <div className="editor-fields">
        <label>
          <span className="field-label">Name</span>
          <input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder={isFlower ? 'Strain name' : 'Flavor'} autoFocus />
        </label>
        {isFlower ? (
          <SizePriceInputs label="Price per size" prices={p.sizePrices ?? {}} onChange={(sizePrices) => set({ sizePrices })} />
        ) : (
          <MoneyInput label="Price" value={p.price} onChange={(price) => set({ price })} />
        )}
        <label className="check">
          <input type="checkbox" checked={p.onSale} onChange={(e) => set({ onSale: e.target.checked })} />
          <span>On sale (shows the regular price crossed out)</span>
        </label>
        {p.onSale &&
          (isFlower ? (
            <SizePriceInputs label="Sale price per size" prices={p.saleSizePrices ?? {}} onChange={(saleSizePrices) => set({ saleSizePrices })} />
          ) : (
            <MoneyInput label="Sale price" value={p.salePrice} onChange={(salePrice) => set({ salePrice })} />
          ))}
        <label>
          <span className="field-label">Description</span>
          {isFlower && <span className="locked-line">{FLOWER_DISCLAIMER} (always shown, can't be removed)</span>}
          <textarea rows={3} value={p.description} onChange={(e) => set({ description: e.target.value })} placeholder={isFlower ? 'Anything extra: smell, effects, what it’s like' : 'Optional: flavor notes, what this is'} />
        </label>
        <div className="field-pair">
          <label>
            <span className="field-label">{isFlower ? 'Grams in stock' : 'How many in stock'} (blank = don't count)</span>
            <input
              inputMode="decimal"
              value={p.stock ?? ''}
              placeholder="Not counted"
              onChange={(e) => {
                const v = e.target.value.trim();
                const n = parseFloat(v);
                setP((x) => {
                  const next = { ...x };
                  setStock(next, v === '' || !Number.isFinite(n) ? undefined : n, db.settings);
                  return next;
                });
              }}
            />
          </label>
          {isCounted(p) ? (
            <p className="fine counted-status">
              Shows as <strong>{STATUS_LABEL[p.status]}</strong>. It updates by itself as orders come in.
            </p>
          ) : (
            <label>
              <span className="field-label">Stock</span>
              <select value={p.status} onChange={(e) => set({ status: e.target.value as StockStatus })}>
                {(['in', 'low', 'out'] as StockStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </label>
          )}
        </div>
        <div className="field-pair">
          <label>
            <span className="field-label">Product line</span>
            <select value={p.lineId} onChange={(e) => set({ lineId: e.target.value })}>
              {linesOf(db, line.category).map((l) => (
                <option key={l.id} value={l.id}>{l.brand && !l.name.startsWith(l.brand) ? `${l.brand} ${l.name}` : l.name}</option>
              ))}
            </select>
          </label>
        </div>
        {isFlower && (
          <label>
            <span className="field-label">Type</span>
            <select value={p.strain ?? ''} onChange={(e) => set({ strain: (e.target.value || undefined) as Strain | undefined })}>
              <option value="">Not set</option>
              {STRAINS.map((st) => (
                <option key={st} value={st}>{STRAIN_NAMES[st]}</option>
              ))}
            </select>
          </label>
        )}
        <label className="check">
          <input type="checkbox" checked={p.bestSeller} onChange={(e) => set({ bestSeller: e.target.checked })} />
          <span>Best seller (shows on the home page and the Best sellers tab)</span>
        </label>
        <ColorPicker hue={p.hue} saturation={p.saturation} intensity={p.intensity} onChange={(c) => set(c)} />
        <PhotoField photo={p.photo} onChange={(photo) => set({ photo })} />
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="btn-row">
          <button type="button" className="btn btn-primary" onClick={save}>{isNew ? 'Add product' : 'Save changes'}</button>
          <button type="button" className="btn btn-ghost" onClick={onDone}>Cancel</button>
        </div>
      </div>
      <div className="editor-preview">
        <span className="field-label">Live preview</span>
        <div className="preview-card">
          <ProductCard product={{ ...p, name: p.name || 'Product name' }} line={db.lines.find((l) => l.id === p.lineId) ?? line} deals={db.deals} />
        </div>
      </div>
    </div>
  );
}

type BulkAction = 'price' | 'sale' | 'stock' | 'deal' | 'best' | 'order' | 'type' | null;

function BulkBar({ ids, isFlower, onClear }: { ids: string[]; isFlower: boolean; onClear: () => void }) {
  const db = useDB();
  const [action, setAction] = useState<BulkAction>(null);
  const [price, setPrice] = useState<number | undefined>();
  const [sizes, setSizes] = useState<SizePrices>({});
  const [percent, setPercent] = useState('');
  const [count, setCount] = useState('');
  const vapeDeals = db.deals;
  const [dealId, setDealId] = useState(vapeDeals[0]?.id ?? '');
  const n = ids.length;
  const apply = (fn: (p: Product) => void, msg: string) => {
    updateDB((d) => d.products.forEach((p) => ids.includes(p.id) && fn(p)));
    showToast(msg);
    setAction(null);
  };
  const toggle = (a: BulkAction) => setAction((x) => (x === a ? null : a));
  const items = `${n} item${n === 1 ? '' : 's'}`;

  return (
    <div className="bulk" role="region" aria-label="Change selected items">
      <div className="bulk-top">
        <strong>{items} selected</strong>
        <button type="button" className={`chip${action === 'price' ? ' is-on' : ''}`} onClick={() => toggle('price')}>Change price</button>
        <button type="button" className={`chip${action === 'sale' ? ' is-on' : ''}`} onClick={() => toggle('sale')}>Sale</button>
        <button type="button" className={`chip${action === 'stock' ? ' is-on' : ''}`} onClick={() => toggle('stock')}>Stock</button>
        {!isFlower && <button type="button" className={`chip${action === 'deal' ? ' is-on' : ''}`} onClick={() => toggle('deal')}>Deal</button>}
        <button type="button" className={`chip${action === 'best' ? ' is-on' : ''}`} onClick={() => toggle('best')}>Best seller</button>
        <button type="button" className={`chip${action === 'order' ? ' is-on' : ''}`} onClick={() => toggle('order')}>Order</button>
        {isFlower && <button type="button" className={`chip${action === 'type' ? ' is-on' : ''}`} onClick={() => toggle('type')}>Type</button>}
        <button
          type="button"
          className="chip chip-danger"
          onClick={() => {
            if (!confirmDelete(items)) return;
            updateDB((d) => {
              d.products = d.products.filter((p) => !ids.includes(p.id));
              d.deals.forEach((deal) => (deal.productIds = deal.productIds.filter((id) => !ids.includes(id))));
            });
            showToast(`Removed ${items}`);
            onClear();
          }}
        >
          Remove
        </button>
        <button type="button" className="link-btn" onClick={onClear}>Clear selection</button>
      </div>

      {action === 'price' && (
        <div className="bulk-panel">
          {isFlower ? (
            <SizePriceInputs label="New price per size (blank sizes stay the same)" prices={sizes} onChange={setSizes} />
          ) : (
            <MoneyInput label="New price" value={price} onChange={setPrice} />
          )}
          <button
            type="button"
            className="btn btn-primary btn-small"
            disabled={isFlower ? !Object.values(sizes).some((v) => v !== undefined) : price === undefined}
            onClick={() =>
              apply((p) => {
                if (isFlower) {
                  p.sizePrices = { ...p.sizePrices };
                  for (const s of FLOWER_SIZES) if (sizes[s] !== undefined) p.sizePrices[s] = sizes[s];
                } else p.price = price;
              }, `Updated the price on ${items}`)
            }
          >
            Apply to {items}
          </button>
        </div>
      )}

      {action === 'sale' && (
        <div className="bulk-panel">
          {!isFlower && <MoneyInput label="Sale price" value={price} onChange={setPrice} />}
          <label className="money">
            <span className="field-label">{isFlower ? 'Percent off every size' : 'or percent off'}</span>
            <span className="money-box">
              <input inputMode="decimal" value={percent} onChange={(e) => setPercent(e.target.value)} />
              <span aria-hidden="true">%</span>
            </span>
          </label>
          <button
            type="button"
            className="btn btn-primary btn-small"
            disabled={!(parseFloat(percent) > 0) && (isFlower || price === undefined)}
            onClick={() => {
              const pct = parseFloat(percent);
              const off = (v: number) => Math.round(v * (1 - pct / 100) * 100) / 100;
              apply((p) => {
                p.onSale = true;
                if (p.sizePrices) {
                  p.saleSizePrices = Object.fromEntries(Object.entries(p.sizePrices).map(([s, v]) => [s, v === undefined ? v : off(v)]));
                } else {
                  p.salePrice = pct > 0 && p.price !== undefined ? off(p.price) : price;
                }
              }, `Put ${items} on sale`);
            }}
          >
            Put on sale
          </button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => apply((p) => (p.onSale = false), `Ended the sale on ${items}`)}>
            End sale
          </button>
        </div>
      )}

      {action === 'stock' && (
        <div className="bulk-panel">
          <label className="money">
            <span className="field-label">{isFlower ? 'Set grams in stock' : 'Set how many in stock'}</span>
            <span className="money-box">
              <input inputMode="decimal" value={count} onChange={(e) => setCount(e.target.value)} />
            </span>
          </label>
          <button
            type="button"
            className="btn btn-primary btn-small"
            disabled={!(parseFloat(count) >= 0)}
            onClick={() => apply((p) => setStock(p, parseFloat(count), db.settings), `Set the count on ${items}`)}
          >
            Set count
          </button>
          <span className="fine">or set by hand:</span>
          {(['in', 'low', 'out'] as StockStatus[]).map((s) => (
            <button
              key={s}
              type="button"
              className="btn btn-ghost btn-small"
              onClick={() =>
                apply((p) => {
                  delete p.stock;
                  p.status = s;
                }, `Marked ${items} ${STATUS_LABEL[s].toLowerCase()}`)
              }
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      )}

      {action === 'deal' && (
        <div className="bulk-panel">
          {vapeDeals.length ? (
            <>
              <label>
                <span className="field-label">Deal</span>
                <select value={dealId} onChange={(e) => setDealId(e.target.value)}>
                  {vapeDeals.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={() => {
                  updateDB((d) => {
                    const deal = d.deals.find((x) => x.id === dealId);
                    if (deal) deal.productIds = [...new Set([...deal.productIds, ...ids])];
                  });
                  showToast(`Added ${items} to the deal`);
                  setAction(null);
                }}
              >
                Add to deal
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={() => {
                  updateDB((d) => {
                    const deal = d.deals.find((x) => x.id === dealId);
                    if (deal) deal.productIds = deal.productIds.filter((id) => !ids.includes(id));
                  });
                  showToast(`Took ${items} out of the deal`);
                  setAction(null);
                }}
              >
                Take out of deal
              </button>
            </>
          ) : (
            <p className="fine">No deals yet. Create one in the Deals tab first.</p>
          )}
        </div>
      )}

      {action === 'order' && (
        <div className="bulk-panel">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => { moveMany(ids, 'top'); showToast(`Moved ${items} to the top`); setAction(null); }}>Move to top</button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => { moveMany(ids, 'bottom'); showToast(`Moved ${items} to the bottom`); setAction(null); }}>Move to bottom</button>
          <span className="fine">Use the ▲ ▼ arrows on each row to fine-tune.</span>
        </div>
      )}

      {action === 'type' && (
        <div className="bulk-panel">
          {STRAINS.map((st) => (
            <button key={st} type="button" className="btn btn-ghost btn-small" onClick={() => apply((p) => (p.strain = st), `Marked ${items} ${STRAIN_NAMES[st]}`)}>
              {STRAIN_NAMES[st]}
            </button>
          ))}
        </div>
      )}

      {action === 'best' && (
        <div className="bulk-panel">
          <button type="button" className="btn btn-ghost btn-small" onClick={() => apply((p) => (p.bestSeller = true), `Marked ${items} as best sellers`)}>Mark as best sellers</button>
          <button type="button" className="btn btn-ghost btn-small" onClick={() => apply((p) => (p.bestSeller = false), `Unmarked ${items}`)}>Unmark</button>
        </div>
      )}
    </div>
  );
}

function LineManager({ category, onSelect }: { category: 'flower' | 'vapes'; onSelect: (id: string) => void }) {
  const db = useDB();
  const lines = linesOf(db, category);
  const [draft, setDraft] = useState({ name: '', brand: '', potency: 2 });

  return (
    <details className="line-manager">
      <summary>{category === 'flower' ? 'Add, rename or remove tiers' : 'Add, rename or remove brands and product lines'}</summary>
      <ul>
        {lines.map((l) => {
          const count = db.products.filter((p) => p.lineId === l.id).length;
          return (
            <li key={l.id} className="lm-row">
              {category === 'vapes' && (
                <input aria-label="Brand" className="lm-brand" defaultValue={l.brand} onBlur={(e) => updateDB((d) => (d.lines.find((x) => x.id === l.id)!.brand = e.target.value.trim() || undefined))} />
              )}
              <input aria-label="Name" defaultValue={l.name} onBlur={(e) => e.target.value.trim() && updateDB((d) => (d.lines.find((x) => x.id === l.id)!.name = e.target.value.trim()))} />
              {category === 'flower' && (
                <select aria-label="Potency bars" value={l.potency} onChange={(e) => updateDB((d) => (d.lines.find((x) => x.id === l.id)!.potency = Number(e.target.value)))}>
                  {[1, 2, 3, 4].map((v) => (
                    <option key={v} value={v}>{v} of 4 bars</option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="link-btn danger"
                onClick={() => {
                  if (!confirmDelete(`${l.name}${count ? ` and its ${count} product${count === 1 ? '' : 's'}` : ''}`)) return;
                  updateDB((d) => {
                    const gone = new Set(d.products.filter((p) => p.lineId === l.id).map((p) => p.id));
                    d.lines = d.lines.filter((x) => x.id !== l.id);
                    d.products = d.products.filter((p) => !gone.has(p.id));
                    d.tiles = d.tiles.filter((t) => t.lineId !== l.id);
                    d.deals.forEach((deal) => (deal.productIds = deal.productIds.filter((id) => !gone.has(id))));
                  });
                }}
              >
                Remove
              </button>
            </li>
          );
        })}
      </ul>
      <form
        className="lm-row lm-add"
        onSubmit={(e) => {
          e.preventDefault();
          if (!draft.name.trim()) return;
          const id = uid('line');
          updateDB((d) => {
            d.lines.push({
              id,
              category,
              name: draft.name.trim(),
              brand: category === 'vapes' ? draft.brand.trim() || 'Other' : undefined,
              potency: category === 'flower' ? draft.potency : undefined,
              sort: Math.max(0, ...d.lines.map((x) => x.sort)) + 1,
            });
          });
          setDraft({ name: '', brand: '', potency: 2 });
          onSelect(id);
        }}
      >
        {category === 'vapes' && <input placeholder="Brand, e.g. Geek Bar" className="lm-brand" value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />}
        <input placeholder={category === 'flower' ? 'New tier name' : 'New line, e.g. Pulse X2 25K'} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        {category === 'flower' && (
          <select value={draft.potency} onChange={(e) => setDraft({ ...draft, potency: Number(e.target.value) })} aria-label="Potency bars">
            {[1, 2, 3, 4].map((v) => (
              <option key={v} value={v}>{v} of 4 bars</option>
            ))}
          </select>
        )}
        <button type="submit" className="btn btn-small btn-ghost">Add</button>
      </form>
    </details>
  );
}

export default function ProductsTab() {
  const db = useDB();
  const [sel, setSel] = useState<LineSel>(() => ({ category: 'vapes', brand: 'Foger', lineId: 'foger-pods' }));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState<Product | null>(null);

  const line = db.lines.find((l) => l.id === sel.lineId) ?? linesOf(db, sel.category)[0];
  const products = useMemo(() => (line ? db.products.filter((p) => p.lineId === line.id).sort(byShelfOrder) : []), [db.products, line]);
  const counts = useMemo(() => Object.fromEntries(db.lines.map((l) => [l.id, db.products.filter((p) => p.lineId === l.id).length])), [db]);
  const selIds = products.filter((p) => selected.has(p.id)).map((p) => p.id);
  const allOn = products.length > 0 && selIds.length === products.length;

  const changeSel = (s: LineSel) => {
    setSel(s);
    setSelected(new Set());
    setEditing(null);
    setAdding(null);
  };
  const toggleOne = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const quick = (id: string, patch: Partial<Product>) => updateDB((d) => Object.assign(d.products.find((p) => p.id === id)!, patch));
  // In-store sales and restocks: nudge a counted product up or down.
  const count = (id: string, delta: number) =>
    updateDB((d) => {
      const p = d.products.find((x) => x.id === id)!;
      setStock(p, (p.stock ?? 0) + delta, d.settings);
    });

  return (
    <div className="tab">
      <LineNav sel={{ ...sel, lineId: line?.id }} onChange={changeSel} counts={counts} />
      <LineManager category={sel.category} onSelect={(id) => changeSel({ ...sel, lineId: id, brand: db.lines.find((l) => l.id === id)?.brand })} />

      {line ? (
        <>
          <div className="list-head">
            <label className="check">
              <input type="checkbox" checked={allOn} onChange={() => setSelected(allOn ? new Set() : new Set(products.map((p) => p.id)))} disabled={!products.length} />
              <span>Select all {products.length} in {line.name}</span>
            </label>
            <button type="button" className="btn btn-primary btn-small" onClick={() => { setAdding(blankProduct(line)); setEditing(null); }}>
              Add product
            </button>
          </div>

          {selIds.length > 0 && <BulkBar ids={selIds} isFlower={line.category === 'flower'} onClear={() => setSelected(new Set())} />}

          {adding && <ProductEditor key={adding.id} initial={adding} line={line} isNew onDone={() => setAdding(null)} />}

          <ul className="admin-list">
            {products.map((p, idx) => {
              const price = fromPrice(p);
              const deals = db.deals.filter((d) => d.productIds.includes(p.id));
              return (
                <li key={p.id} className={`admin-row${selected.has(p.id) ? ' is-selected' : ''}`}>
                  {editing === p.id ? (
                    <ProductEditor initial={p} line={line} isNew={false} onDone={() => setEditing(null)} />
                  ) : (
                    <>
                      <span className="row-lead">
                        <input type="checkbox" className="row-check" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} aria-label={`Select ${p.name}`} />
                        <span className="row-move">
                          <button type="button" onClick={() => moveOne(p.id, -1)} disabled={idx === 0} aria-label={`Move ${p.name} up`}>▲</button>
                          <button type="button" onClick={() => moveOne(p.id, 1)} disabled={idx === products.length - 1} aria-label={`Move ${p.name} down`}>▼</button>
                        </span>
                      </span>
                      <span className="row-thumb" style={{ background: cardBackground(p.hue, p.saturation, p.intensity) }}>
                        {p.photo && <img src={p.photo} alt="" />}
                      </span>
                      <div className="row-main">
                        <span className="row-name">{p.name}</span>
                        <span className="row-meta">
                          {price !== undefined ? `${p.sizePrices ? 'from ' : ''}${money(price)}` : 'No price'}
                          {(p.sizePrices ? Object.keys(p.sizePrices).some((s) => isDiscounted(p, s as never)) : isDiscounted(p)) && <span className="tag tag-sale">On sale</span>}
                          {p.strain && <span className={`tag strain-${p.strain}`}>{STRAIN_NAMES[p.strain]}</span>}
                          {isCounted(p) && <span className="tag tag-count">{stockText(p)}</span>}
                          {p.status !== 'in' && <span className={`tag tag-${p.status}`}>{STATUS_LABEL[p.status]}</span>}
                          {p.bestSeller && <span className="tag">Best seller</span>}
                          {deals.map((d) => <span key={d.id} className="tag tag-deal">{d.name}</span>)}
                        </span>
                        {(line.category === 'flower' || p.description) && (
                          <span className="row-desc">{line.category === 'flower' ? `${FLOWER_DISCLAIMER}. ` : ''}{p.description}</span>
                        )}
                      </div>
                      <div className="row-actions">
                        <button type="button" className="btn btn-small btn-ghost" onClick={() => { setEditing(p.id); setAdding(null); }}>Edit</button>
                        {isCounted(p) ? (
                          <span className="stock-stepper" aria-label={`Stock for ${p.name}`}>
                            <button type="button" className="btn btn-small btn-ghost" onClick={() => count(p.id, -1)} aria-label="Sold one in store">−1</button>
                            <span>{stockText(p)}</span>
                            <button type="button" className="btn btn-small btn-ghost" onClick={() => count(p.id, 1)} aria-label="Add one">+1</button>
                          </span>
                        ) : (
                          <>
                            <button type="button" className={`btn btn-small btn-toggle${p.status === 'low' ? ' is-on-low' : ''}`} aria-pressed={p.status === 'low'} onClick={() => quick(p.id, { status: p.status === 'low' ? 'in' : 'low' })}>Low stock</button>
                            <button type="button" className={`btn btn-small btn-toggle${p.status === 'out' ? ' is-on-out' : ''}`} aria-pressed={p.status === 'out'} onClick={() => quick(p.id, { status: p.status === 'out' ? 'in' : 'out' })}>Sold out</button>
                          </>
                        )}
                        <button
                          type="button"
                          className="btn btn-small btn-ghost danger"
                          onClick={() => {
                            if (!confirmDelete(p.name)) return;
                            updateDB((d) => {
                              d.products = d.products.filter((x) => x.id !== p.id);
                              d.deals.forEach((deal) => (deal.productIds = deal.productIds.filter((id) => id !== p.id)));
                            });
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
          {!products.length && !adding && <p className="empty">No products in {line.name} yet. Use Add product to put the first one up.</p>}
        </>
      ) : (
        <p className="empty">No tiers or lines here yet. Open the section above to add one.</p>
      )}
    </div>
  );
}
