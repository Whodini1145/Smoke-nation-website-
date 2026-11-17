// AgeChecker.Net server check. The browser sends the verification ID from the
// popup; we ask AgeChecker ourselves (with the Account Secret) whether it was
// accepted, for one of our websites, for this customer, recently, and 21+.

const STATUS_URL = 'https://api.agechecker.net/v1/status/';
const OUR_KEYS = new Set(['CJcVUg61F3O4L2g0w97EXyNymBLZ9ElA', 'Rr6IMwsRRTKXkaP7NsUR8bnJKDbQYIHz']);
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface AgeStatus {
  status?: string;
  reason?: string;
  key?: string;
  verification?: {
    buyer?: { first_name?: string; last_name?: string; dob_day?: number | string; dob_month?: number | string; dob_year?: number | string };
    created?: string;
    completed_at?: string;
  };
  error?: { code?: string; message?: string };
}

export const validUuid = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{8,64}$/.test(v);

const letters = (s: string | undefined) => (s ?? '').toLowerCase().replace(/[^a-z]/g, '');

function ageOn(now: Date, y: number, m: number, d: number) {
  let age = now.getUTCFullYear() - y;
  if (now.getUTCMonth() + 1 < m || (now.getUTCMonth() + 1 === m && now.getUTCDate() < d)) age--;
  return age;
}

/** Returns null when the check is good, or a message for the customer. */
export function checkAgeStatus(s: AgeStatus, orderName: string, now = Date.now()): string | null {
  const retry = 'Your ID check didn’t go through. Press Pay again to redo it. Your card was not charged.';
  if (s.error || s.status !== 'accepted') return s.status === 'denied' ? 'Your ID check was not approved, so this order can’t be placed. You can still shop in store with a valid ID.' : retry;
  if (!s.key || !OUR_KEYS.has(s.key)) return retry;
  const created = Date.parse(s.verification?.created ?? '');
  if (!(created > now - MAX_AGE_MS)) return retry;

  const b = s.verification?.buyer ?? {};
  const last = letters(b.last_name);
  if (last && !letters(orderName).includes(last)) return 'The name on your ID check doesn’t match the name on this order. Use the same name in both, then try again.';
  const [y, m, d] = [Number(b.dob_year), Number(b.dob_month), Number(b.dob_day)];
  if (y && m && d && ageOn(new Date(now), y, m, d) < 21) return 'You must be 21 or older to order.';
  return null;
}

export async function fetchAgeStatus(uuid: string, secret: string): Promise<AgeStatus> {
  const r = await fetch(STATUS_URL + encodeURIComponent(uuid), { headers: { 'X-AgeChecker-Secret': secret } });
  return (await r.json()) as AgeStatus;
}
