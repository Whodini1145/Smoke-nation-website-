import { getCart, setCart } from '../data/store';
import type { FlowerSize } from '../data/types';

// ── Cart actions ───────────────────────────────────────────────────────────

export function addToCart(productId: string, size: FlowerSize | undefined, qty = 1) {
  const key = size ? `${productId}|${size}` : productId;
  const cart = getCart();
  const existing = cart.find((l) => l.key === key);
  setCart(
    existing
      ? cart.map((l) => (l.key === key ? { ...l, qty: l.qty + qty } : l))
      : [...cart, { key, productId, size, qty }],
  );
}

export function setLineQty(key: string, qty: number) {
  setCart(qty <= 0 ? getCart().filter((l) => l.key !== key) : getCart().map((l) => (l.key === key ? { ...l, qty } : l)));
}

export function clearCart() {
  setCart([]);
}

// ── Passwords (preview only) ───────────────────────────────────────────────
// The real site will use Supabase Auth; this only exists so accounts can be
// tried in the preview. Passwords are never stored in plain text.

export async function hashPassword(email: string, password: string): Promise<string> {
  const data = new TextEncoder().encode(`smoke-nation:${email.trim().toLowerCase()}:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ── Photos ─────────────────────────────────────────────────────────────────

/** Shrinks an uploaded photo so it loads fast and fits in storage. */
export function readPhoto(file: File, maxSize = 1000): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('That file could not be opened as a photo. Try a JPG or PNG.'));
    };
    img.src = url;
  });
}

export const parseMoney = (s: string): number | undefined => {
  const n = parseFloat(s.replace(/[$,\s]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
};

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
