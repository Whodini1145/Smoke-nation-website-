// Online ID / age check before payment.
//
// The shop will use a third-party age-verification service (often bundled
// with the high-risk payment processor). When it's chosen, connect it here:
// `verifyAge` should open the provider's check and resolve with the result.
// Checkout already waits on this step and saves the result on the order.

export type AgeCheckResult = 'passed' | 'failed' | 'not_connected';

export const AGE_CHECK_CONNECTED = false;

export async function verifyAge(_customer: { name: string; email: string; phone: string }): Promise<AgeCheckResult> {
  return 'not_connected';
}

export const AGE_CHECK_TEXT: Record<AgeCheckResult, string> = {
  passed: 'ID verified',
  failed: 'ID check failed',
  not_connected: 'ID check not set up yet',
};
