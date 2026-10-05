import { useSyncExternalStore } from 'react';
import { createSeed } from './seed';
import type { CartLine, DB } from './types';

// Preview data layer. Everything is kept in this browser's localStorage so the
// site can be clicked through before the real database exists. When Supabase is
// connected, `getDB`/`updateDB` are the only functions that need to change.

const DB_KEY = 'sn-db-v2';
const CART_KEY = 'sn-cart-v2';
const SESSION_KEY = 'sn-session-v1';

type Listener = () => void;

function createStore<T>(key: string, init: () => T) {
  let state: T;
  try {
    const raw = localStorage.getItem(key);
    state = raw ? (JSON.parse(raw) as T) : init();
  } catch {
    state = init();
  }
  const listeners = new Set<Listener>();
  return {
    get: () => state,
    set(next: T) {
      state = next;
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch (err) {
        if (err instanceof DOMException && err.name === 'QuotaExceededError') {
          alert('This browser is out of storage space for photos. Use smaller photos, or remove a few, then try again.');
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

const dbStore = createStore<DB>(DB_KEY, createSeed);
const cartStore = createStore<CartLine[]>(CART_KEY, () => []);

export interface Session {
  customerId?: string;
  adminId?: string;
  ageOk?: boolean;
}
const sessionStore = createStore<Session>(SESSION_KEY, () => ({}));

export const getDB = dbStore.get;

/** Apply a change to a copy of the database and save it. */
export function updateDB(mutate: (draft: DB) => void) {
  const draft = structuredClone(dbStore.get());
  mutate(draft);
  dbStore.set(draft);
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
