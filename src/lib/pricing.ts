import type { CartLine, Deal, DB, FlowerSize, Fulfillment, Line, Product, Settings } from '../data/types';

export const money = (n: number) => `$${n.toFixed(2).replace(/\.00$/, '')}`;
export const money2 = (n: number) => `$${n.toFixed(2)}`;
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Regular price for a product (and size, for flower). */
export function regularPrice(p: Product, size?: FlowerSize): number | undefined {
  return size ? p.sizePrices?.[size] : p.price;
}

/** What the customer pays per unit right now — the sale price if the item is on sale. */
export function unitPrice(p: Product, size?: FlowerSize): number | undefined {
  const reg = regularPrice(p, size);
  if (!p.onSale) return reg;
  const sale = size ? p.saleSizePrices?.[size] : p.salePrice;
  return sale !== undefined && reg !== undefined && sale < reg ? sale : reg;
}

export function isDiscounted(p: Product, size?: FlowerSize): boolean {
  const reg = regularPrice(p, size);
  const now = unitPrice(p, size);
  return reg !== undefined && now !== undefined && now < reg;
}

/** Lowest price a flower product sells for, for "from $X" labels. */
export function fromPrice(p: Product): number | undefined {
  if (p.price !== undefined) return unitPrice(p);
  const prices = Object.keys(p.sizePrices ?? {})
    .map((s) => unitPrice(p, s as FlowerSize))
    .filter((x): x is number => x !== undefined);
  return prices.length ? Math.min(...prices) : undefined;
}

export function dealLabel(d: Deal): string {
  return d.kind === 'bundle' ? `Buy ${d.qty} for ${money(d.value)}` : `${money(d.value)} off when you buy ${d.qty}`;
}

/** Active deals an item belongs to, best-looking first. */
export function dealsFor(productId: string, deals: Deal[]): Deal[] {
  return deals.filter((d) => d.active && d.qty > 0 && d.productIds.includes(productId));
}

// ── Deal engine ────────────────────────────────────────────────────────────
// Each cart unit can be used by at most one deal application. Deals repeat
// (4 qualifying items = the 2-item deal twice). When items qualify for several
// deals, we search for the combination that saves the customer the most.

interface Unit {
  idx: number;
  productId: string;
  price: number;
}

export interface DealApplication {
  dealId: string;
  name: string;
  times: number;
  savings: number;
}

function applyOnce(deal: Deal, pool: Unit[]): { used: Unit[]; savings: number } | null {
  const eligible = pool.filter((u) => deal.productIds.includes(u.productId));
  if (eligible.length < deal.qty) return null;
  if (deal.kind === 'bundle') {
    // Use the priciest eligible items: that's where the bundle saves the most.
    const used = [...eligible].sort((a, b) => b.price - a.price).slice(0, deal.qty);
    const savings = used.reduce((s, u) => s + u.price, 0) - deal.value;
    return savings > 0.004 ? { used, savings } : null;
  }
  // Fixed amount off: use the cheapest items so pricier ones stay free for other deals.
  const used = [...eligible].sort((a, b) => a.price - b.price).slice(0, deal.qty);
  const total = used.reduce((s, u) => s + u.price, 0);
  const savings = Math.min(deal.value, total);
  return savings > 0.004 ? { used, savings } : null;
}

export function bestDeals(units: Unit[], deals: Deal[]): { savings: number; applications: DealApplication[] } {
  const active = deals.filter((d) => d.active && d.qty > 0);
  if (!active.length || !units.length) return { savings: 0, applications: [] };

  const memo = new Map<string, { savings: number; picks: string[] }>();
  const exhaustive = units.length <= 16 || active.length === 1;

  function solve(pool: Unit[]): { savings: number; picks: string[] } {
    const key = pool.map((u) => u.idx).join(',');
    const hit = memo.get(key);
    if (hit) return hit;
    let best = { savings: 0, picks: [] as string[] };
    const options = active
      .map((d) => ({ d, r: applyOnce(d, pool) }))
      .filter((o): o is { d: Deal; r: { used: Unit[]; savings: number } } => o.r !== null);
    if (!exhaustive && options.length) {
      // Very large carts: greedy on the single best application each round.
      options.sort((a, b) => b.r.savings - a.r.savings);
      options.length = 1;
    }
    for (const { d, r } of options) {
      const usedIdx = new Set(r.used.map((u) => u.idx));
      const rest = solve(pool.filter((u) => !usedIdx.has(u.idx)));
      const total = r.savings + rest.savings;
      if (total > best.savings + 0.004) best = { savings: total, picks: [d.id, ...rest.picks] };
    }
    memo.set(key, best);
    return best;
  }

  const result = solve(units);
  // Re-run the chosen picks in order to total savings per deal.
  const byDeal = new Map<string, DealApplication>();
  let pool = units;
  for (const id of result.picks) {
    const d = active.find((x) => x.id === id)!;
    const r = applyOnce(d, pool)!;
    const usedIdx = new Set(r.used.map((u) => u.idx));
    pool = pool.filter((u) => !usedIdx.has(u.idx));
    const a = byDeal.get(id) ?? { dealId: id, name: dealLabel(d), times: 0, savings: 0 };
    a.times += 1;
    a.savings = round2(a.savings + r.savings);
    byDeal.set(id, a);
  }
  return { savings: round2(result.savings), applications: [...byDeal.values()] };
}

// ── Cart totals ────────────────────────────────────────────────────────────

export interface PricedLine {
  line: CartLine;
  product: Product;
  productLine?: Line;
  unit: number;
  regular: number;
  total: number;
}

export interface CartTotals {
  lines: PricedLine[];
  count: number;
  subtotal: number;
  dealSavings: number;
  deals: DealApplication[];
  shipping: number;
  cardFee: number;
  tax: number;
  total: number;
  shippingBlockedBy: string[];
  belowMinimum: number;
}

export function priceCart(cart: CartLine[], db: Pick<DB, 'products' | 'lines' | 'deals'>, settings: Settings, fulfillment: Fulfillment = 'pickup'): CartTotals {
  const lines: PricedLine[] = [];
  for (const line of cart) {
    const product = db.products.find((p) => p.id === line.productId);
    if (!product || product.status === 'out') continue;
    const unit = unitPrice(product, line.size);
    const regular = regularPrice(product, line.size);
    if (unit === undefined || regular === undefined) continue;
    lines.push({
      line,
      product,
      productLine: db.lines.find((l) => l.id === product.lineId),
      unit,
      regular,
      total: round2(unit * line.qty),
    });
  }

  const units: Unit[] = [];
  let idx = 0;
  for (const l of lines) {
    // Deals are for vapes only; flower size pricing is already its own discount.
    if (l.productLine?.category !== 'vapes') continue;
    for (let i = 0; i < l.line.qty; i++) units.push({ idx: idx++, productId: l.product.id, price: l.unit });
  }
  const { savings: dealSavings, applications: deals } = bestDeals(units, db.deals);

  const subtotal = round2(lines.reduce((s, l) => s + l.total, 0));
  const merchandise = round2(subtotal - dealSavings);

  const shippingBlockedBy = [
    ...new Set(
      lines
        .filter((l) => l.productLine && !settings.shippingAllowed[l.productLine.category])
        .map((l) => (l.productLine!.category === 'vapes' ? 'Vapes' : 'THCA flower')),
    ),
  ];
  const freeShip = settings.freeShippingOver > 0 && merchandise >= settings.freeShippingOver;
  const shipping = fulfillment === 'ship' && lines.length ? (freeShip ? 0 : settings.shippingFee) : 0;
  const tax = round2((merchandise * settings.taxRate) / 100);
  const beforeFee = merchandise + shipping + tax;
  const cardFee = round2((beforeFee * settings.cardFeePercent) / 100);
  const total = round2(beforeFee + cardFee);

  return {
    lines,
    count: lines.reduce((s, l) => s + l.line.qty, 0),
    subtotal,
    dealSavings,
    deals,
    shipping,
    cardFee,
    tax,
    total,
    shippingBlockedBy,
    belowMinimum: settings.minOrder > 0 && merchandise < settings.minOrder ? round2(settings.minOrder - merchandise) : 0,
  };
}
