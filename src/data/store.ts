import { useSyncExternalStore } from 'react';
import { createSeed } from './seed';
import type { CartLine, DB } from './types';

// Data layer. On the live site the database is Firebase (see firebase.ts),
// which keeps this in-memory copy up to date and saves every change made with
// `updateDB`. The single-file preview (`npm run build:preview`) has no
// database, so it keeps everything in this browser's localStorage instead.

export const USE_FIREBASE = import.meta.env.MODE !== 'preview' && import.meta.env.MODE !== 'test';

const DB_KEY = 'sn-db-v3';
const CART_KEY = 'sn-cart-v2';
const SESSION_KEY = 'sn-session-v1';

type Listener = () => void;

function createStore<T>(key: string | null, init: () => T) {
  let state: T;
  try {
    const raw = key ? localStorage.getItem(key) : null;
    state = raw ? (JSON.parse(raw) as T) : init();
  } catch {
    state = init();
  }
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(next: T) {
      state = next;
      if (key) {
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch (err) {
          if (err instanceof DOMException && err.name === 'QuotaExceededError') {
            alert('This browser is out of storage space for photos. Use smaller photos, or remove a few, then try again.');
          }
        }
      }
      listeners.forEach((l) => l());
    },
    subscribe(l: Listener) {
      listeners.add(l);
      return () => listeners.delete(l);
    },
  };
}

function emptyAccounts(db: DB): DB {
  return { ...db, orders: [], customers: [], admins: [] };
}

const dbStore = USE_FIREBASE ? createStore<DB>(null, () => emptyAccounts(createSeed())) : createStore<DB>(DB_KEY, createSeed);
const cartStore = createStore<CartLine[]>(CART_KEY, () => []);

export interface Session {
  customerId?: string;
  adminId?: string;
  ageOk?: boolean;
}
const sessionStore = createStore<Session>(SESSION_KEY, () => ({}));

export const getDB = dbStore.get;

type SyncHandler = (prev: DB, next: DB) => void;
let sync: SyncHandler | null = null;
/** Firebase registers here to save local changes to the database. */
export function setSyncHandler(fn: SyncHandler) {
  sync = fn;
}

/** Apply a change to a copy of the database and save it. */
export function updateDB(mutate: (draft: DB) => void) {
  const prev = dbStore.get();
  const draft = structuredClone(prev);
  mutate(draft);
  dbStore.set(draft);
  sync?.(prev, draft);
}

/** Replace the local copy without saving (used when the database sends new data). */
export function replaceDB(next: DB) {
  dbStore.set(next);
}

export function resetDB() {
  dbStore.set(createSeed());
}

export function useDB(): DB {
  return useSyncExternalStore(dbStore.subscribe, dbStore.get);
}

export const getCart = cartStore.get;
export const setCart = cartStore.set;
export function useCart(): CartLine[] {
  return useSyncExternalStore(cartStore.subscribe, cartStore.get);
}

export const getSession = sessionStore.get;
export function updateSession(patch: Partial<Session>) {
  sessionStore.set({ ...sessionStore.get(), ...patch });
}
export function useSession(): Session {
  return useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
}

export function uid(prefix = 'id'): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
