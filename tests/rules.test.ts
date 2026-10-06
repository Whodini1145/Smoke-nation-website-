// Security rules tests. Run with: npm run test:rules (starts the Firestore emulator).
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, assertSucceeds, initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, writeBatch, deleteDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;
const db = (uid?: string) => (uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore());

async function claimMain(uid: string) {
  const fs = db(uid);
  const b = writeBatch(fs);
  b.set(doc(fs, 'admins', uid), { email: `${uid}@x.com`, name: uid });
  b.set(doc(fs, 'meta', 'firstAdmin'), { uid });
  return b.commit();
}

beforeAll(async () => {
  env = await initializeTestEnvironment({ projectId: 'demo-smoke-nation', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
});
afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

describe('staff setup', () => {
  it('first account becomes main admin, nobody else can after', async () => {
    await assertSucceeds(claimMain('alice'));
    await assertFails(claimMain('mallory'));
    await assertFails(setDoc(doc(db('mallory'), 'admins', 'mallory'), { email: 'm' }));
  });
  it('main admin adds and removes staff; other staff cannot', async () => {
    await claimMain('alice');
    await assertSucceeds(setDoc(doc(db('alice'), 'admins', 'bob'), { email: 'b', name: 'Bob' }));
    await assertFails(setDoc(doc(db('bob'), 'admins', 'carol'), { email: 'c' }));
    await assertFails(deleteDoc(doc(db('bob'), 'admins', 'alice')));
    await assertSucceeds(deleteDoc(doc(db('alice'), 'admins', 'bob')));
  });
});

describe('shop data', () => {
  it('anyone reads products; only staff write', async () => {
    await claimMain('alice');
    await assertSucceeds(setDoc(doc(db('alice'), 'products', 'p1'), { name: 'A', stock: 5, status: 'in' }));
    await assertSucceeds(setDoc(doc(db('alice'), 'site', 'config'), { lines: [] }));
    await assertSucceeds(getDoc(doc(db(), 'products', 'p1')));
    await assertFails(setDoc(doc(db('eve'), 'products', 'p1'), { name: 'hacked' }));
    await assertFails(setDoc(doc(db(), 'site', 'config'), { lines: [] }));
  });
  it('shoppers lower stock only together with a new order', async () => {
    await claimMain('alice');
    await setDoc(doc(db('alice'), 'products', 'p1'), { name: 'A', stock: 5, status: 'in' });
    const guest = db();
    const order = { id: 'o1', status: 'new', items: [] };
    const ok = writeBatch(guest);
    ok.set(doc(guest, 'orders', 'o1'), order);
    ok.update(doc(guest, 'products', 'p1'), { stock: 3, status: 'in', lastOrderId: 'o1' });
    await assertSucceeds(ok.commit());
    // No new order in the same write: denied.
    await assertFails(updateDoc(doc(guest, 'products', 'p1'), { stock: 0, status: 'out', lastOrderId: 'o1' }));
    // Can't change anything else, or raise stock.
    const bad = writeBatch(guest);
    bad.set(doc(guest, 'orders', 'o2'), { id: 'o2', status: 'new' });
    bad.update(doc(guest, 'products', 'p1'), { stock: 2, status: 'in', lastOrderId: 'o2', price: 1 });
    await assertFails(bad.commit());
  });
});

describe('orders', () => {
  it('guests create; customers see their own; staff see all', async () => {
    await claimMain('alice');
    await assertSucceeds(setDoc(doc(db(), 'orders', 'g1'), { status: 'new' }));
    await assertFails(setDoc(doc(db(), 'orders', 'g2'), { status: 'shipped' }));
    await assertSucceeds(setDoc(doc(db('cust'), 'orders', 'c1'), { status: 'new', customerId: 'cust' }));
    await assertFails(setDoc(doc(db('cust'), 'orders', 'c2'), { status: 'new', customerId: 'someone' }));
    await assertSucceeds(getDoc(doc(db('cust'), 'orders', 'c1')));
    await assertFails(getDoc(doc(db('other'), 'orders', 'c1')));
    await assertSucceeds(getDoc(doc(db('alice'), 'orders', 'c1')));
    await assertSucceeds(updateDoc(doc(db('alice'), 'orders', 'c1'), { status: 'ready' }));
    await assertFails(updateDoc(doc(db('cust'), 'orders', 'c1'), { status: 'ready' }));
    expect(true).toBe(true);
  });
});
