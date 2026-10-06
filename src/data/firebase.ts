import { deleteApp, initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  initializeFirestore,
  onSnapshot,
  persistentLocalCache,
  query,
  setDoc,
  where,
  writeBatch,
  type Unsubscribe,
  type WriteBatch,
} from 'firebase/firestore';
import { showToast } from '../components/Overlay';
import { firebaseConfig } from './firebaseConfig';
import { createSeed } from './seed';
import { replaceDB, setSyncHandler, uid, updateSession } from './store';
import type { Account, DB, MenuTile, Order, Product, Slide } from './types';

// Live database. Firestore layout:
//   site/config       lines, deals, slides, reviews, menu tiles, settings
//   products/{id}     one document per product
//   photos/{id}       uploaded photos ({ data: <image> }); referenced as "photo:<id>"
//   orders/{id}       one document per order
//   users/{uid}       customer name/email
//   admins/{uid}      staff accounts; meta/firstAdmin names the main account

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const fs = initializeFirestore(app, { localCache: persistentLocalCache(), ignoreUndefinedProperties: true });

const CONFIG_KEYS = ['lines', 'deals', 'slides', 'reviews', 'tiles', 'settings'] as const;
type SiteConfig = Pick<DB, (typeof CONFIG_KEYS)[number]>;

const seed = createSeed();
const state = {
  config: null as SiteConfig | null,
  products: [] as Product[],
  photos: new Map<string, string>(),
  photoRefs: new Map<string, string>(), // image data → "photo:<id>", so re-saving doesn't duplicate
  orders: [] as Order[],
  admins: [] as Account[],
  me: null as Account | null,
  isAdmin: false,
  mainAdminId: undefined as string | null | undefined, // undefined = still loading, null = no staff yet
};

const resolve = <T extends { photo?: string }>(x: T): T =>
  x.photo?.startsWith('photo:') ? { ...x, photo: state.photos.get(x.photo.slice(6)) } : x;

function compose() {
  const cfg = state.config;
  const me = state.me;
  replaceDB({
    version: 1,
    lines: cfg?.lines ?? seed.lines,
    deals: cfg?.deals ?? seed.deals,
    slides: (cfg?.slides ?? seed.slides).map(resolve),
    reviews: cfg?.reviews ?? seed.reviews,
    tiles: (cfg?.tiles ?? seed.tiles).map(resolve),
    settings: { ...seed.settings, ...cfg?.settings },
    // Until the shop's first staff account loads the starter content, visitors see the samples.
    products: (cfg ? state.products : seed.products).map(resolve),
    orders: [...state.orders].sort((a, b) => b.createdAt - a.createdAt),
    customers: me ? [me] : [],
    admins: state.admins.length ? state.admins : state.isAdmin && me ? [me] : [],
    mainAdminId: state.mainAdminId,
  });
}

// ── Saving local changes ───────────────────────────────────────────────────

class Batcher {
  private batch: WriteBatch = writeBatch(fs);
  private ops = 0;
  private done: Promise<void>[] = [];
  add(fn: (b: WriteBatch) => void) {
    if (this.ops >= 450) this.flush();
    fn(this.batch);
    this.ops++;
  }
  flush() {
    if (this.ops) this.done.push(this.batch.commit());
    this.batch = writeBatch(fs);
    this.ops = 0;
  }
  async commit() {
    this.flush();
    await Promise.all(this.done);
  }
}

/** Uploaded photos (image data) are stored as their own documents. */
function storePhoto(b: Batcher, src: string | undefined): string | undefined {
  if (!src?.startsWith('data:')) return src;
  const known = state.photoRefs.get(src);
  if (known) return known;
  const id = uid('ph');
  b.add((batch) => batch.set(doc(fs, 'photos', id), { data: src }));
  state.photoRefs.set(src, `photo:${id}`);
  return `photo:${id}`;
}

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

async function save(prev: DB, next: DB) {
  const b = new Batcher();

  if (CONFIG_KEYS.some((k) => !same(prev[k], next[k]))) {
    const cfg: SiteConfig = {
      lines: next.lines,
      deals: next.deals,
      slides: next.slides.map((s): Slide => ({ ...s, photo: storePhoto(b, s.photo) })),
      reviews: next.reviews,
      tiles: next.tiles.map((t): MenuTile => ({ ...t, photo: storePhoto(b, t.photo) })),
      settings: next.settings,
    };
    b.add((batch) => batch.set(doc(fs, 'site', 'config'), cfg));
  }

  // New orders go in the same batch as the stock they use, so the database
  // can check that customers only lower stock by placing an order.
  const oldOrders = new Map(prev.orders.map((o) => [o.id, o]));
  for (const o of next.orders) {
    const old = oldOrders.get(o.id);
    if (!old) b.add((batch) => batch.set(doc(fs, 'orders', o.id), o));
    else if (old.status !== o.status || old.stockApplied !== o.stockApplied)
      b.add((batch) => batch.update(doc(fs, 'orders', o.id), { status: o.status, stockApplied: o.stockApplied ?? false }));
  }

  const STOCK_KEYS = new Set(['stock', 'status', 'lastOrderId']);
  const before = new Map(prev.products.map((p) => [p.id, p]));
  for (const p of next.products) {
    const old = before.get(p.id);
    if (same(old, p)) continue;
    const changed = old ? [...new Set([...Object.keys(old), ...Object.keys(p)])].filter((k) => !same(old[k as keyof Product], p[k as keyof Product])) : null;
    if (changed && changed.every((k) => STOCK_KEYS.has(k))) {
      // Stock-only change: update just those fields.
      const patch: Record<string, unknown> = {};
      for (const k of changed) patch[k] = p[k as keyof Product] ?? deleteField();
      b.add((batch) => batch.update(doc(fs, 'products', p.id), patch));
      continue;
    }
    const clean = { ...p, photo: storePhoto(b, p.photo) };
    b.add((batch) => batch.set(doc(fs, 'products', p.id), clean));
  }
  const kept = new Set(next.products.map((p) => p.id));
  for (const id of before.keys()) if (!kept.has(id)) b.add((batch) => batch.delete(doc(fs, 'products', id)));

  await b.commit();
}

setSyncHandler((prev, next) => {
  save(prev, next).catch((err) => {
    console.error(err);
    showToast(err?.code === 'permission-denied' ? 'That change wasn’t saved: you need to be signed in as staff.' : 'That change wasn’t saved. Check your internet connection and try again.');
  });
});

// ── Listening for data ─────────────────────────────────────────────────────

const warn = (what: string) => (err: Error) => console.warn(`Couldn't load ${what}:`, err.message);

onSnapshot(doc(fs, 'site', 'config'), (snap) => {
  state.config = snap.exists() ? (snap.data() as SiteConfig) : null;
  compose();
}, warn('site settings'));
onSnapshot(collection(fs, 'products'), (snap) => {
  state.products = snap.docs.map((d) => d.data() as Product);
  compose();
}, warn('products'));
onSnapshot(collection(fs, 'photos'), (snap) => {
  state.photos = new Map(snap.docs.map((d) => [d.id, d.data().data as string]));
  for (const [id, data] of state.photos) state.photoRefs.set(data, `photo:${id}`);
  compose();
}, warn('photos'));
onSnapshot(doc(fs, 'meta', 'firstAdmin'), (snap) => {
  state.mainAdminId = snap.exists() ? (snap.data().uid as string) : null;
  compose();
}, warn('staff setup'));

let userSubs: Unsubscribe[] = [];

async function loadUser(user: User | null) {
  userSubs.forEach((u) => u());
  userSubs = [];
  state.orders = [];
  state.admins = [];
  if (!user) {
    state.me = null;
    state.isAdmin = false;
    updateSession({ customerId: undefined, adminId: undefined });
    compose();
    return;
  }
  const [adminSnap, profile] = await Promise.all([getDoc(doc(fs, 'admins', user.uid)), getDoc(doc(fs, 'users', user.uid)).catch(() => null)]);
  state.isAdmin = adminSnap.exists();
  state.me = {
    id: user.uid,
    email: user.email ?? '',
    name: (profile?.exists() && (profile.data().name as string)) || (adminSnap.exists() && (adminSnap.data().name as string)) || user.displayName || '',
    passwordHash: '',
  };
  updateSession({ customerId: user.uid, adminId: state.isAdmin ? user.uid : undefined });

  const orders = state.isAdmin ? collection(fs, 'orders') : query(collection(fs, 'orders'), where('customerId', '==', user.uid));
  userSubs.push(
    onSnapshot(orders, (snap) => {
      state.orders = snap.docs.map((d) => d.data() as Order);
      compose();
    }, warn('orders')),
  );
  if (state.isAdmin) {
    userSubs.push(
      onSnapshot(collection(fs, 'admins'), (snap) => {
        state.admins = snap.docs.map((d) => ({ id: d.id, email: d.data().email, name: d.data().name, passwordHash: '' }));
        compose();
      }, warn('staff list')),
    );
  }
  compose();
}

onAuthStateChanged(auth, (user) => void loadUser(user));

// ── Accounts ───────────────────────────────────────────────────────────────

export function friendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/email-already-in-use') return 'An account with that email already exists. Sign in instead.';
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-login-credentials'].includes(code))
    return 'That email and password don’t match an account. Check them and try again.';
  if (code === 'auth/weak-password') return 'Use at least 8 characters for your password.';
  if (code === 'auth/invalid-email') return 'That email address doesn’t look right. Check it and try again.';
  if (code === 'auth/requires-recent-login') return 'For safety, sign out, sign back in, then change your password.';
  if (code === 'auth/too-many-requests') return 'Too many tries. Wait a few minutes, then try again.';
  if (code === 'auth/network-request-failed') return 'No internet connection. Check it and try again.';
  if (code === 'permission-denied') return 'You don’t have permission to do that.';
  return (err as Error)?.message || 'Something went wrong. Try again.';
}

export async function customerSignUp(name: string, email: string, password: string) {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(user, { displayName: name });
  await setDoc(doc(fs, 'users', user.uid), { name, email });
  await loadUser(user);
}

export async function signIn(email: string, password: string) {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  await loadUser(user);
}

export async function staffSignIn(email: string, password: string) {
  await signIn(email, password);
  if (!state.isAdmin) {
    await signOut(auth);
    throw new Error('That account doesn’t have staff access. Ask the main account to add you.');
  }
}

export function signOutAll() {
  return signOut(auth);
}

/** First staff account: becomes the main account and loads the starter content. */
export async function setupMainAdmin(name: string, email: string, password: string) {
  let user: User;
  try {
    user = (await createUserWithEmailAndPassword(auth, email, password)).user;
  } catch (err) {
    if ((err as { code?: string }).code !== 'auth/email-already-in-use') throw err;
    user = (await signInWithEmailAndPassword(auth, email, password)).user;
  }
  const batch = writeBatch(fs);
  batch.set(doc(fs, 'admins', user.uid), { email, name });
  batch.set(doc(fs, 'meta', 'firstAdmin'), { uid: user.uid });
  await batch.commit();
  await loadUser(user);
  if (!(await getDoc(doc(fs, 'site', 'config'))).exists()) {
    const b = new Batcher();
    const { lines, deals, slides, reviews, tiles, settings, products } = seed;
    b.add((x) => x.set(doc(fs, 'site', 'config'), { lines, deals, slides, reviews, tiles, settings }));
    for (const p of products) b.add((x) => x.set(doc(fs, 'products', p.id), p));
    await b.commit();
  }
}

/** Main account gives someone staff access, creating their login if needed. */
export async function addStaff(name: string, email: string, password: string) {
  // A second, temporary connection creates the login so the main account stays signed in.
  const helper = initializeApp(firebaseConfig, `staff-${Date.now()}`);
  try {
    const helperAuth = getAuth(helper);
    let staffUid: string;
    try {
      staffUid = (await createUserWithEmailAndPassword(helperAuth, email, password)).user.uid;
    } catch (err) {
      if ((err as { code?: string }).code !== 'auth/email-already-in-use') throw err;
      staffUid = (await signInWithEmailAndPassword(helperAuth, email, password)).user.uid;
    }
    await signOut(helperAuth);
    await setDoc(doc(fs, 'admins', staffUid), { email, name });
  } finally {
    await deleteApp(helper);
  }
}

export function removeStaff(id: string) {
  return deleteDoc(doc(fs, 'admins', id));
}

export async function changeMyPassword(password: string) {
  if (!auth.currentUser) throw new Error('Sign in first.');
  await updatePassword(auth.currentUser, password);
}
