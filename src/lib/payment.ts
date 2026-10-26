// Card payments with Authorize.Net Accept.js.
// The card number goes from the browser straight to Authorize.Net, which hands
// back a one-time token. Only that token reaches our payment server.
// The Login ID and Public Client Key are made to be public.

export const AUTHNET = {
  apiLoginID: '9kQy9MtKX2D8',
  clientKey: '6cw2Bf4LsLQp52w7rpT5XS3wS5r2JpV8v47jS3TS25My7abfEUKZd6RCTqrGP42p',
};
const ACCEPT_URL = 'https://js.authorize.net/v1/Accept.js';

export interface CardInput {
  number: string;
  /** "MM/YY" as typed */
  expiry: string;
  code: string;
  zip: string;
}

export interface CardToken {
  dataDescriptor: string;
  dataValue: string;
}

interface AcceptResponse {
  opaqueData?: CardToken;
  messages: { resultCode: 'Ok' | 'Error'; message: { code: string; text: string }[] };
}
declare global {
  interface Window {
    Accept?: { dispatchData(data: unknown, cb: (r: AcceptResponse) => void): void };
  }
}

let loading: Promise<void> | null = null;
export function loadAccept(): Promise<void> {
  if (window.Accept) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = ACCEPT_URL;
    s.charset = 'utf-8';
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('The card form couldn’t load. Check your internet connection and try again.'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

const FRIENDLY: Record<string, string> = {
  E_WC_05: 'That card number isn’t valid. Check it and try again.',
  E_WC_06: 'Check the expiration month.',
  E_WC_07: 'Check the expiration year.',
  E_WC_08: 'That card has expired.',
  E_WC_15: 'Check the 3 or 4 digit security code on the card.',
  E_WC_16: 'Check the billing ZIP code.',
};

/** Splits "MM/YY", "MMYY" or "MM / YYYY" into month and 2-digit year. */
export function parseExpiry(v: string): { month: string; year: string } | null {
  const digits = v.replace(/\D/g, '');
  if (digits.length !== 4 && digits.length !== 6) return null;
  const month = digits.slice(0, 2);
  const year = digits.length === 6 ? digits.slice(4, 6) : digits.slice(2, 4);
  return +month >= 1 && +month <= 12 ? { month, year } : null;
}

export async function tokenizeCard(card: CardInput): Promise<CardToken> {
  const exp = parseExpiry(card.expiry);
  if (!exp) throw new Error('Enter the expiration date as MM/YY.');
  await loadAccept();
  return new Promise((resolve, reject) => {
    window.Accept!.dispatchData(
      {
        authData: AUTHNET,
        cardData: { cardNumber: card.number.replace(/\D/g, ''), month: exp.month, year: exp.year, cardCode: card.code.trim(), zip: card.zip.trim() },
      },
      (r) => {
        if (r.messages.resultCode === 'Ok' && r.opaqueData) return resolve(r.opaqueData);
        const m = r.messages.message[0];
        reject(new Error(FRIENDLY[m?.code] ?? `The card couldn’t be checked (${m?.text ?? 'unknown error'}).`));
      },
    );
  });
}

// ── Typing helpers for the card form ───────────────────────────────────────

/** "4111111111111111" → "4111-1111-1111-1111" (American Express: 4-6-5). */
export function formatCardNumber(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 19);
  const groups = /^3[47]/.test(d) ? [4, 6, 5] : [4, 4, 4, 4, 3];
  const parts: string[] = [];
  let i = 0;
  for (const g of groups) {
    if (i >= d.length) break;
    parts.push(d.slice(i, i + g));
    i += g;
  }
  return parts.join('-');
}

/** Adds the slash after the month as they type: "12" → "12/", "1225" → "12/25", "5" → "05/". */
export function formatExpiry(raw: string, prev: string): string {
  const deleting = raw.length < prev.length;
  let d = raw.replace(/\D/g, '').slice(0, 4);
  if (d.length === 1 && +d > 1) d = `0${d}`;
  if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`;
  if (d.length === 2) return deleting ? d : `${d}/`;
  return d;
}

export const digitsOnly = (raw: string, max: number) => raw.replace(/\D/g, '').slice(0, max);
