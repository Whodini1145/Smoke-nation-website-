import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDB } from '../data/store';
import type { Product } from '../data/types';
import { CATEGORY_NAMES, lineLabel } from '../lib/catalog';
import { fromPrice, money } from '../lib/pricing';
import { SearchIcon } from './Icons';

interface Hit {
  key: string;
  label: string;
  sub: string;
  to?: string;
  product?: Product;
}

/** Searches category names, product lines/tiers, and product (strain/flavor) names. */
export function SearchBox({ onOpenProduct }: { onOpenProduct: (p: Product) => void }) {
  const db = useDB();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);

  const hits = useMemo<Hit[]>(() => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) return [];
    const words = term.split(/\s+/);
    const match = (s: string) => words.every((w) => s.toLowerCase().includes(w));
    const out: Hit[] = [];
    (['flower', 'vapes'] as const).forEach((c) => {
      if (match(CATEGORY_NAMES[c]) || (c === 'flower' && match('thca weed bud strain'))) out.push({ key: c, label: CATEGORY_NAMES[c], sub: 'Category', to: `/shop/${c}` });
    });
    db.lines.forEach((l) => {
      if (match(`${lineLabel(l)} ${l.brand ?? ''}`)) out.push({ key: l.id, label: lineLabel(l), sub: l.category === 'flower' ? 'Flower tier' : `${l.brand ?? ''} line`, to: `/shop/${l.category}/${l.id}` });
    });
    db.products.forEach((p) => {
      const l = db.lines.find((x) => x.id === p.lineId);
      if (!l) return;
      if (match(`${p.name} ${lineLabel(l)}`)) {
        const price = fromPrice(p);
        out.push({
          key: p.id,
          label: p.name,
          sub: `${lineLabel(l)}${price !== undefined ? `, ${p.sizePrices ? 'from ' : ''}${money(price)}` : ''}${p.status === 'out' ? ', sold out' : ''}`,
          product: p,
        });
      }
    });
    return out.slice(0, 8);
  }, [q, db]);

  function choose(h: Hit) {
    setQ('');
    if (h.product) onOpenProduct(h.product);
    else if (h.to) nav(h.to);
  }

  const open = q.trim().length >= 2;

  return (
    <div className="search" role="search">
      <label className="search-field">
        <SearchIcon size={22} />
        <span className="sr-only">Search the shop</span>
        <input
          type="search"
          value={q}
          placeholder="Search strains, flavors, brands"
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setActive((a) => Math.min(hits.length - 1, a + 1));
            } else if (e.key === 'ArrowUp') {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === 'Enter' && hits[active]) {
              e.preventDefault();
              choose(hits[active]);
            } else if (e.key === 'Escape') setQ('');
          }}
          role="combobox"
          aria-expanded={open}
          aria-controls="search-results"
          aria-autocomplete="list"
        />
      </label>
      {open && (
        <ul className="search-results" id="search-results" role="listbox">
          {hits.length ? (
            hits.map((h, i) => (
              <li key={h.key} role="option" aria-selected={i === active}>
                <button type="button" className={i === active ? 'is-active' : ''} onMouseEnter={() => setActive(i)} onClick={() => choose(h)}>
                  <span className="sr-label">{h.label}</span>
                  <span className="sr-sub">{h.sub}</span>
                </button>
              </li>
            ))
          ) : (
            <li className="search-empty">Nothing matches "{q.trim()}". Try a flavor, a strain, or a brand like Foger.</li>
          )}
        </ul>
      )}
    </div>
  );
}
