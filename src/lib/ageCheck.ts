// Online ID / age check before payment, with AgeChecker.Net.
//
// Texas requires a government ID check on every hemp sale. At checkout the
// AgeChecker popup opens before the card is touched. When it says "accepted"
// we get a verification ID (uuid). The payment server asks AgeChecker about
// that ID itself before charging, so the browser can't fake a pass.
// The API keys below are public (one per website, from the AgeChecker panel).

export type AgeCheckResult = 'passed' | 'failed' | 'not_connected';

/** Turn the popup on. While false, checkout works as before (ID checked at pickup). */
export const AGE_CHECK_CONNECTED = false;

const KEYS: Record<string, string> = {
  'smokenationtx.com': 'CJcVUg61F3O4L2g0w97EXyNymBLZ9ElA',
  'www.smokenationtx.com': 'CJcVUg61F3O4L2g0w97EXyNymBLZ9ElA',
  'smoke-nation.web.app': 'Rr6IMwsRRTKXkaP7NsUR8bnJKDbQYIHz',
};
const POPUP_URL = 'https://cdn.agechecker.net/static/popup/v1/popup.js';

export interface AgeCheckOutcome {
  result: AgeCheckResult;
  /** AgeChecker verification ID, sent to the payment server to double-check. */
  id?: string;
}

interface Verification {
  uuid: string;
  status: string;
}
interface Instance {
  show(uuid?: string): void;
}
interface AgeCheckerConfig {
  key?: string;
  mode?: 'manual' | 'auto';
  autoload?: boolean;
  [k: string]: unknown;
}
declare global {
  interface Window {
    AgeCheckerConfig?: AgeCheckerConfig;
    AgeCheckerAPI?: { createInstance(config: AgeCheckerConfig): Instance };
  }
}

let loading: Promise<void> | null = null;
function loadPopup(): Promise<void> {
  if (window.AgeCheckerAPI) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    // autoload off: we open the popup ourselves, only when they press Pay.
    window.AgeCheckerConfig = { autoload: false, onready: () => resolve() };
    const s = document.createElement('script');
    s.src = POPUP_URL;
    s.crossOrigin = 'anonymous';
    s.onerror = () => {
      loading = null;
      reject(new Error('The ID check couldn’t load. Turn off any ad blocker, check your internet, and try again.'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/** Load the popup early while they fill in the form. */
export function preloadAgeCheck() {
  if (AGE_CHECK_CONNECTED && KEYS[location.hostname]) loadPopup().catch(() => undefined);
}

export async function verifyAge(customer: { name: string; email: string }): Promise<AgeCheckOutcome> {
  if (!AGE_CHECK_CONNECTED) return { result: 'not_connected' };
  const key = KEYS[location.hostname];
  if (!key) return { result: 'not_connected' }; // local testing copies
  await loadPopup();

  const [first, ...rest] = customer.name.trim().split(/\s+/);
  return new Promise<AgeCheckOutcome>((resolve, reject) => {
    let last: Verification | null = null;
    const instance = window.AgeCheckerAPI!.createInstance({
      key,
      mode: 'manual',
      show_close: true,
      ignore_fields: true,
      require_email: true,
      data: { first_name: first ?? '', last_name: rest.join(' '), contact_email: customer.email },
      accent_color: '#1f7a4d',
      onstatuschanged: (v: Verification) => {
        last = v;
        if (v.status === 'denied') resolve({ result: 'failed', id: v.uuid });
      },
      // Called when they press Continue after being accepted.
      onclosed: (done?: () => void) => {
        done?.();
        if (last?.status === 'accepted') resolve({ result: 'passed', id: last.uuid });
      },
      // Closed with the X before finishing.
      onhide: () => reject(new Error('The ID check was closed before it finished. Press Pay again when you’re ready. Your card was not charged.')),
    });
    instance.show();
  });
}

export const AGE_CHECK_TEXT: Record<AgeCheckResult, string> = {
  passed: 'ID verified',
  failed: 'ID check failed',
  not_connected: 'ID check not set up yet',
};
