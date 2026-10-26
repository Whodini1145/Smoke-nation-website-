import type { CartLine, DB, FlowerSize, Fulfillment, Order, Settings } from '../data/types';
import type { AgeCheckResult } from './ageCheck';
import { lineLabel } from './catalog';
import { priceCart, money, money2 } from './pricing';
import { isCounted, SIZE_GRAMS, stockText, usageByProduct } from './stock';

// Turns a cart into an order. The browser uses it to show the total; the
// payment server runs the same code on the shop's own data, so the amount
// charged never comes from the browser.

/** Session storage key for the last placed order, so the confirmation page works for guests too. */
export const LAST_ORDER_KEY = 'sn-last-order';

export interface CheckoutRequest {
  cart: CartLine[];
  fulfillment: Fulfillment;
  name: string;
  email: string;
  phone: string;
  address?: { street: string; city: string; state: string; zip: string };
  note?: string;
  ageCheck: AgeCheckResult;
}

export type ShopData = Pick<DB, 'products' | 'lines' | 'deals'> & { settings: Settings };

export type BuildResult = { ok: true; order: Order; needed: Map<string, number> } | { ok: false; error: string };

const MAX_LINES = 60;
const MAX_QTY = 20;
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Cleans a cart from an untrusted source: known shape, sane amounts. */
export function cleanCart(raw: unknown): CartLine[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_LINES) return null;
  const out: CartLine[] = [];
  for (const r of raw) {
    if (!r || typeof r !== 'object') return null;
    const { productId, size, qty } = r as Record<string, unknown>;
    if (typeof productId !== 'string' || !productId || productId.length > 100) return null;
    if (size !== undefined && !(typeof size === 'string' && size in SIZE_GRAMS)) return null;
    if (typeof qty !== 'number' || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY) return null;
    out.push({ key: size ? `${productId}|${size}` : productId, productId, size: size as FlowerSize | undefined, qty });
  }
  return out;
}

export function buildOrder(req: CheckoutRequest, data: ShopData, opts: { id: string; number: number; now: number; customerId?: string }): BuildResult {
  const cart = cleanCart(req.cart);
  if (!cart) return { ok: false, error: 'Your cart couldn’t be read. Refresh the page and try again.' };
  const name = text(req.name, 100);
  const email = text(req.email, 200).toLowerCase();
  const phone = text(req.phone, 40);
  if (!name || !email.includes('@') || !phone) return { ok: false, error: 'Fill in your name, email and phone.' };
  const fulfillment: Fulfillment = req.fulfillment === 'ship' ? 'ship' : 'pickup';

  const { settings } = data;
  const t = priceCart(cart, data, settings, fulfillment);
  if (t.lines.length !== cart.length) {
    return { ok: false, error: 'Something in your cart sold out or changed. Check your cart, then try again.' };
  }
  if (t.belowMinimum > 0) {
    return { ok: false, error: `The minimum order is ${money(settings.minOrder)}. Add ${money2(t.belowMinimum)} more to check out.` };
  }

  let address: Order['address'];
  if (fulfillment === 'ship') {
    if (t.shippingBlockedBy.length) return { ok: false, error: `${t.shippingBlockedBy.join(' and ')} can’t be shipped. Choose pickup instead.` };
    const a = req.address;
    address = { street: text(a?.street, 200), city: text(a?.city, 100), state: text(a?.state, 2).toUpperCase(), zip: text(a?.zip, 10) };
    if (!address.street || !address.city || address.state.length !== 2 || !/^\d{5}(-\d{4})?$/.test(address.zip)) {
      return { ok: false, error: 'Fill in the full shipping address.' };
    }
  }

  const needed = usageByProduct(t.lines.map((l) => l.line));
  for (const [id, amount] of needed) {
    const p = data.products.find((x) => x.id === id);
    if (p && isCounted(p) && amount > p.stock!) {
      return { ok: false, error: `Only ${stockText(p).replace(' left', '')} of ${p.name} left. Lower the amount in your cart, then try again.` };
    }
  }

  const ageCheck: AgeCheckResult = req.ageCheck === 'passed' || req.ageCheck === 'failed' ? req.ageCheck : 'not_connected';
  const note = text(req.note, 500);
  const order: Order = {
    id: opts.id,
    number: opts.number,
    createdAt: opts.now,
    ...(opts.customerId ? { customerId: opts.customerId } : {}),
    name,
    email,
    phone,
    fulfillment,
    ...(address ? { address } : {}),
    items: t.lines.map((l) => ({
      productId: l.product.id,
      name: l.product.name,
      lineName: l.productLine ? lineLabel(l.productLine) : '',
      ...(l.line.size ? { size: l.line.size } : {}),
      qty: l.line.qty,
      unitPrice: l.unit,
    })),
    subtotal: t.subtotal,
    dealSavings: t.dealSavings,
    dealNames: t.deals.map((d) => `${d.name}${d.times > 1 ? ` ×${d.times}` : ''}`),
    shipping: t.shipping,
    cardFee: t.cardFee,
    tax: t.tax,
    total: t.total,
    status: 'new',
    ageCheck,
    ...(note ? { note } : {}),
    stockApplied: true,
  };
  return { ok: true, order, needed };
}
