import { describe, expect, it } from 'vitest';
import { buildOrder, cleanCart, type CheckoutRequest, type ShopData } from './order';
import type { Product, Settings } from '../data/types';

const settings = {
  taxRate: 8.25,
  cardFeePercent: 0,
  shippingFee: 10,
  freeShippingOver: 0,
  minOrder: 0,
  lowStockUnits: 3,
  lowStockGrams: 14,
  shippingAllowed: { flower: true, vapes: false },
} as Settings;

const pod = { id: 'pod', lineId: 'pods', name: 'Cool Mint', price: 20, status: 'in', stock: 5 } as Product;
const bud = { id: 'bud', lineId: 'ex', name: 'Biscotti', sizePrices: { '1g': 10, '3.5g': 30 }, status: 'in', stock: 10 } as Product;
const data: ShopData = {
  products: [pod, bud],
  lines: [
    { id: 'pods', category: 'vapes', brand: 'Foger', name: 'Foger Pods 30K', sort: 1 },
    { id: 'ex', category: 'flower', name: 'Top Tier Exotics', sort: 1 },
  ],
  deals: [{ id: 'd', name: '2 for $35', qty: 2, kind: 'bundle', value: 35, productIds: ['pod'], active: true }],
  settings,
};
const req = (over: Partial<CheckoutRequest> = {}): CheckoutRequest => ({
  cart: [{ key: 'pod', productId: 'pod', qty: 2 }],
  fulfillment: 'pickup',
  name: 'Ann Lee',
  email: 'ANN@x.com ',
  phone: '555',
  ageCheck: 'not_connected',
  ...over,
});
const opts = { id: 'o1', number: 123456, now: 1 };

describe('buildOrder', () => {
  it('prices from shop data, with deals and tax', () => {
    const r = buildOrder(req(), data, opts);
    if (!r.ok) throw new Error(r.error);
    expect(r.order).toMatchObject({ subtotal: 40, dealSavings: 5, tax: 2.89, total: 37.89, email: 'ann@x.com', status: 'new' });
    expect(r.order.items[0]).toMatchObject({ name: 'Cool Mint', lineName: 'Foger Pods 30K', qty: 2, unitPrice: 20 });
    expect([...r.needed]).toEqual([['pod', 2]]);
  });
  it('ignores any price or total sent by the browser', () => {
    const sneaky = { ...req(), total: 0.01, cart: [{ key: 'pod', productId: 'pod', qty: 1, price: 0 }] } as unknown as CheckoutRequest;
    const r = buildOrder(sneaky, data, opts);
    expect(r.ok && r.order.total).toBe(21.65);
  });
  it('refuses more than is in stock, sold-out items, and bad carts', () => {
    expect(buildOrder(req({ cart: [{ key: 'pod', productId: 'pod', qty: 6 }] }), data, opts).ok).toBe(false);
    const sold = { ...data, products: [{ ...pod, status: 'out' as const }, bud] };
    expect(buildOrder(req(), sold, opts)).toMatchObject({ ok: false, error: expect.stringContaining('sold out') });
    expect(buildOrder(req({ cart: [{ key: 'x', productId: 'nope', qty: 1 }] }), data, opts).ok).toBe(false);
    expect(cleanCart([{ productId: 'pod', qty: 0 }])).toBeNull();
    expect(cleanCart([{ productId: 'bud', size: '2g', qty: 1 }])).toBeNull();
    expect(cleanCart([])).toBeNull();
  });
  it('only ships what may be shipped, to a full address', () => {
    expect(buildOrder(req({ fulfillment: 'ship' }), data, opts)).toMatchObject({ ok: false, error: expect.stringContaining('Vapes') });
    const flowerShip = req({ fulfillment: 'ship', cart: [{ key: 'bud|3.5g', productId: 'bud', size: '3.5g', qty: 1 }] });
    expect(buildOrder(flowerShip, data, opts).ok).toBe(false);
    const r = buildOrder({ ...flowerShip, address: { street: '1 Main', city: 'Tyler', state: 'tx', zip: '75701' } }, data, opts);
    expect(r.ok && r.order).toMatchObject({ shipping: 10, address: { state: 'TX' }, total: 42.48 });
  });
  it('needs name, email and phone', () => {
    expect(buildOrder(req({ name: ' ' }), data, opts).ok).toBe(false);
    expect(buildOrder(req({ email: 'nope' }), data, opts).ok).toBe(false);
  });
});
