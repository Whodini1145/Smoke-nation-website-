import { describe, expect, it } from 'vitest';
import { bestDeals, priceCart, unitPrice } from './pricing';
import { createSeed } from '../data/seed';
import type { Deal, Product } from '../data/types';

const u = (ids: [string, number][]) => ids.map(([productId, price], idx) => ({ idx, productId, price }));
const deal = (over: Partial<Deal>): Deal => ({ id: 'd', name: 'd', qty: 2, kind: 'bundle', value: 35, productIds: ['a', 'b', 'c'], active: true, ...over });

describe('deals', () => {
  it('applies a 2-for-$35 bundle to mixed flavors', () => {
    expect(bestDeals(u([['a', 20], ['b', 20]]), [deal({})]).savings).toBe(5);
  });
  it('repeats the deal: 4 items = applied twice, 5th item full price', () => {
    const r = bestDeals(u([['a', 20], ['a', 20], ['b', 20], ['c', 20], ['c', 20]]), [deal({})]);
    expect(r.savings).toBe(10);
    expect(r.applications[0].times).toBe(2);
  });
  it('does nothing with one qualifying item or inactive deal', () => {
    expect(bestDeals(u([['a', 20]]), [deal({})]).savings).toBe(0);
    expect(bestDeals(u([['a', 20], ['b', 20]]), [deal({ active: false })]).savings).toBe(0);
  });
  it('supports $ off per pair', () => {
    expect(bestDeals(u([['a', 20], ['b', 20], ['a', 20], ['b', 20]]), [deal({ kind: 'amountOff', value: 5 })]).savings).toBe(10);
  });
  it('picks whichever overlapping deal saves the most', () => {
    const cheap = deal({ id: 'x', value: 38 });
    const better = deal({ id: 'y', value: 30 });
    const r = bestDeals(u([['a', 20], ['b', 20]]), [cheap, better]);
    expect(r.savings).toBe(10);
    expect(r.applications.map((a) => a.dealId)).toEqual(['y']);
  });
  it('finds the best combination across deals, not just the first', () => {
    // 3-for-$45 on a,b,c vs 2-for-$30 on a,b. Items: a,a,b,c at $20.
    const three = deal({ id: 'three', qty: 3, value: 45 });
    const two = deal({ id: 'two', value: 30, productIds: ['a', 'b'] });
    const r = bestDeals(u([['a', 20], ['a', 20], ['b', 20], ['c', 20]]), [three, two]);
    // Best is the 3-for-$45 on a,b,c ($15 saved), not the pair a,a ($10).
    expect(r.savings).toBe(15);
  });
});

describe('cart', () => {
  const db = createSeed();
  const pods = db.products.filter((p) => p.lineId === 'foger-pods');
  it('uses sale prices and applies the seeded Foger deal', () => {
    const cart = [
      { key: pods[0].id, productId: pods[0].id, qty: 3 },
      { key: pods[1].id, productId: pods[1].id, qty: 1 },
    ];
    const t = priceCart(cart, db, db.settings, 'pickup');
    expect(t.subtotal).toBe(80);
    expect(t.dealSavings).toBe(10);
    expect(t.tax).toBe(5.78);
    expect(t.total).toBe(75.78);
  });
  it('never applies deals to flower', () => {
    const f = db.products.find((p) => p.lineId === 'exotics')!;
    const cart = [{ key: f.id + '|3.5g', productId: f.id, size: '3.5g' as const, qty: 2 }];
    expect(priceCart(cart, db, db.settings).dealSavings).toBe(0);
  });
  it('blocks shipping for categories that are pickup-only', () => {
    const cart = [{ key: pods[0].id, productId: pods[0].id, qty: 1 }];
    expect(priceCart(cart, db, db.settings, 'ship').shippingBlockedBy).toEqual(['Vapes']);
  });
  it('ignores a sale price that is not lower than regular', () => {
    const p = { ...pods[0], onSale: true, salePrice: 25 } as Product;
    expect(unitPrice(p)).toBe(20);
  });
});
