// Payment server: one function, placeOrder.
//   1. Prices the cart from the shop's own data (never trusts the browser's total).
//   2. Holds the stock.
//   3. Charges the card token through Authorize.Net.
//   4. Saves the order only if the charge was approved; otherwise puts the stock back.
// The Transaction Key lives in Google Secret Manager as AUTHNET_TRANSACTION_KEY.

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import type { Deal, Line, Order, Product, Settings } from '../../src/data/types';
import { buildOrder, type CheckoutRequest } from '../../src/lib/order';
import { isCounted, setStock, stockText } from '../../src/lib/stock';
import { charge, voidCharge, type OpaqueData } from './authnet';

initializeApp();
const db = getFirestore();
db.settings({ ignoreUndefinedProperties: true });

const TRANSACTION_KEY = defineSecret('AUTHNET_TRANSACTION_KEY');
setGlobalOptions({ region: 'us-central1', maxInstances: 5 });

// Used only if a setting is missing from the shop's saved settings.
const FALLBACK: Pick<Settings, 'taxRate' | 'cardFeePercent' | 'shippingFee' | 'freeShippingOver' | 'minOrder' | 'lowStockUnits' | 'lowStockGrams'> = {
  taxRate: 8.25,
  cardFeePercent: 0,
  shippingFee: 10,
  freeShippingOver: 0,
  minOrder: 0,
  lowStockUnits: 3,
  lowStockGrams: 14,
};

function readOpaque(raw: unknown): OpaqueData | null {
  const o = raw as Partial<OpaqueData> | undefined;
  if (typeof o?.dataDescriptor !== 'string' || typeof o?.dataValue !== 'string') return null;
  if (o.dataDescriptor.length > 100 || o.dataValue.length > 5000 || !o.dataValue) return null;
  return { dataDescriptor: o.dataDescriptor, dataValue: o.dataValue };
}

/** Change counted stock for the given products by +/- amounts, in one transaction. */
async function moveStock(needed: Map<string, number>, sign: 1 | -1, orderId: string, settings: Settings) {
  const ids = [...needed.keys()];
  if (!ids.length) return;
  await db.runTransaction(async (tx) => {
    const refs = ids.map((id) => db.doc(`products/${id}`));
    const snaps = await tx.getAll(...refs);
    snaps.forEach((snap, i) => {
      const p = snap.data() as Product | undefined;
      if (!p || !isCounted(p)) return;
      const amount = needed.get(ids[i])!;
      if (sign < 0 && amount > p.stock!) {
        throw new HttpsError('failed-precondition', `Only ${stockText(p).replace(' left', '')} of ${p.name} left. Lower the amount in your cart, then try again.`);
      }
      const next = { ...p };
      setStock(next, p.stock! + sign * amount, settings);
      tx.update(refs[i], { stock: next.stock, status: next.status, lastOrderId: orderId });
    });
  });
}

export const placeOrder = onCall({ secrets: [TRANSACTION_KEY], timeoutSeconds: 60, memory: '256MiB' }, async (req) => {
  const input = req.data as { order?: CheckoutRequest; opaque?: unknown };
  const opaque = readOpaque(input?.opaque);
  if (!input?.order || !opaque) throw new HttpsError('invalid-argument', 'The card details didn’t come through. Try again.');

  const [cfgSnap, productSnap] = await Promise.all([db.doc('site/config').get(), db.collection('products').get()]);
  const cfg = (cfgSnap.data() ?? {}) as { lines?: Line[]; deals?: Deal[]; settings?: Partial<Settings> };
  const settings = { ...FALLBACK, shippingAllowed: { flower: true, vapes: false }, ...cfg.settings } as Settings;
  const products = productSnap.docs.map((d) => d.data() as Product);

  const id = `o${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
  const number = 100000 + Math.floor(Math.random() * 900000);
  const built = buildOrder(input.order, { products, lines: cfg.lines ?? [], deals: cfg.deals ?? [], settings }, { id, number, now: Date.now(), customerId: req.auth?.uid });
  if (!built.ok) throw new HttpsError('failed-precondition', built.error);
  const { order, needed } = built;
  if (order.total < 0.5) throw new HttpsError('failed-precondition', 'This order total is too small to charge a card.');

  await moveStock(needed, -1, id, settings);

  const key = TRANSACTION_KEY.value().trim();
  let result: Awaited<ReturnType<typeof charge>>;
  try {
    result = await charge({
      transactionKey: key,
      amount: order.total,
      opaque,
      invoiceNumber: String(order.number),
      description: `Smoke Nation order #${order.number}`,
      email: order.email,
      name: order.name,
      zip: order.address?.zip,
    });
  } catch (err) {
    logger.error('charge failed to send', err);
    result = { ok: false, declined: false, message: 'The payment service couldn’t be reached. Try again in a minute.' };
  }

  if (!result.ok) {
    await moveStock(needed, 1, id, settings).catch((err) => logger.error('stock release failed', { id, err }));
    logger.info('payment not approved', { id, declined: result.declined, message: result.message });
    throw new HttpsError('failed-precondition', result.message);
  }

  const paid: Order = {
    ...order,
    payment: {
      method: 'card',
      transId: result.transId,
      test: result.test,
      ...(result.authCode ? { authCode: result.authCode } : {}),
      ...(result.card ? { card: result.card } : {}),
      ...(result.cardType ? { cardType: result.cardType } : {}),
    },
  };
  try {
    await db.doc(`orders/${id}`).set(paid);
  } catch (err) {
    logger.error('order save failed after charge; voiding', { id, transId: result.transId, err });
    await voidCharge(key, result.transId).catch((e) => logger.error('void failed', { id, e }));
    await moveStock(needed, 1, id, settings).catch(() => undefined);
    throw new HttpsError('internal', 'Your order couldn’t be saved, so the charge was cancelled. Try again.');
  }
  logger.info('order paid', { id, number: paid.number, total: paid.total, test: result.test });
  return { order: paid };
});
