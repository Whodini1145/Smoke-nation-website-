import { useDB } from '../../data/store';
import type { CategoryId } from '../../data/types';
import { brandsOf, CATEGORY_NAMES, linesOf } from '../../lib/catalog';

export interface LineSel {
  category: CategoryId;
  brand?: string;
  lineId?: string;
}

/** THCA Flower / Vapes switch, then (vapes) brand, then tier or product line. */
export function LineNav({ sel, onChange, counts }: { sel: LineSel; onChange: (s: LineSel) => void; counts?: Record<string, number> }) {
  const db = useDB();
  const lines = linesOf(db, sel.category);
  const brands = sel.category === 'vapes' ? brandsOf(lines) : [];
  const brand = sel.category === 'vapes' ? sel.brand ?? brands[0] : undefined;
  const visible = sel.category === 'vapes' ? lines.filter((l) => (l.brand ?? 'Other') === brand) : lines;

  return (
    <div className="line-nav">
      <div className="seg" role="tablist" aria-label="Category">
        {(['flower', 'vapes'] as CategoryId[]).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={sel.category === c}
            className={sel.category === c ? 'is-on' : ''}
            onClick={() => {
              const first = linesOf(db, c);
              const b = c === 'vapes' ? brandsOf(first)[0] : undefined;
              onChange({ category: c, brand: b, lineId: first.find((l) => !b || (l.brand ?? 'Other') === b)?.id });
            }}
          >
            {CATEGORY_NAMES[c]}
          </button>
        ))}
      </div>
      {brands.length > 0 && (
        <div className="chip-row" aria-label="Brand">
          {brands.map((b) => (
            <button
              key={b}
              type="button"
              className={`chip chip-brand${brand === b ? ' is-on' : ''}`}
              onClick={() => onChange({ ...sel, brand: b, lineId: lines.find((l) => (l.brand ?? 'Other') === b)?.id })}
            >
              {b}
            </button>
          ))}
        </div>
      )}
      <div className="chip-row" aria-label={sel.category === 'flower' ? 'Tier' : 'Product line'}>
        {visible.map((l) => (
          <button key={l.id} type="button" className={`chip${sel.lineId === l.id ? ' is-on' : ''}`} onClick={() => onChange({ ...sel, brand, lineId: l.id })}>
            {l.name}
            {counts && <span className="chip-count">{counts[l.id] ?? 0}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
