// Authorize.Net card charges (server side only).
// The browser turns the card into a one-time token with Accept.js; this sends
// that token plus the secret Transaction Key to Authorize.Net to charge it.

export const API_LOGIN_ID = '9kQy9MtKX2D8';
const ENDPOINT = 'https://api.authorize.net/xml/v1/request.api';

export interface OpaqueData {
  dataDescriptor: string;
  dataValue: string;
}

export interface ChargeInput {
  transactionKey: string;
  amount: number;
  opaque: OpaqueData;
  invoiceNumber: string;
  description: string;
  email: string;
  name: string;
  zip?: string;
}

export type ChargeResult =
  | { ok: true; transId: string; authCode?: string; card?: string; cardType?: string; test: boolean }
  | { ok: false; message: string; declined: boolean };

export function chargeRequest(c: ChargeInput) {
  const [firstName, ...rest] = c.name.trim().split(/\s+/);
  return {
    createTransactionRequest: {
      merchantAuthentication: { name: API_LOGIN_ID, transactionKey: c.transactionKey },
      refId: c.invoiceNumber.slice(0, 20),
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount: c.amount.toFixed(2),
        payment: { opaqueData: { dataDescriptor: c.opaque.dataDescriptor, dataValue: c.opaque.dataValue } },
        order: { invoiceNumber: c.invoiceNumber.slice(0, 20), description: c.description.slice(0, 255) },
        customer: { email: c.email.slice(0, 255) },
        billTo: {
          firstName: (firstName ?? '').slice(0, 50),
          lastName: rest.join(' ').slice(0, 50),
          ...(c.zip ? { zip: c.zip.slice(0, 20) } : {}),
        },
      },
    },
  };
}

interface AnetMessage { code?: string; text?: string; description?: string; errorCode?: string; errorText?: string }

/** Reads Authorize.Net's reply. responseCode 1 = approved, 2 = declined, 3 = error, 4 = held for review. */
export function readChargeResponse(body: unknown): ChargeResult {
  const r = body as {
    messages?: { resultCode?: string; message?: AnetMessage[] };
    transactionResponse?: {
      responseCode?: string;
      authCode?: string;
      transId?: string;
      accountNumber?: string;
      accountType?: string;
      testRequest?: string;
      messages?: AnetMessage[];
      errors?: AnetMessage[];
    };
  };
  const tr = r?.transactionResponse;
  if (r?.messages?.resultCode === 'Ok' && tr?.responseCode === '1') {
    return {
      ok: true,
      transId: tr.transId ?? '',
      authCode: tr.authCode || undefined,
      card: tr.accountNumber || undefined,
      cardType: tr.accountType || undefined,
      // In test mode Authorize.Net approves without moving money and returns transaction ID 0.
      test: tr.testRequest === '1' || tr.transId === '0',
    };
  }
  if (tr?.responseCode === '2') return { ok: false, declined: true, message: 'Your card was declined. Try another card.' };
  if (tr?.responseCode === '4') return { ok: false, declined: true, message: 'Your payment is being held for review. Call the shop to finish your order.' };
  const why = tr?.errors?.[0]?.errorText ?? r?.messages?.message?.[0]?.text ?? 'unknown error';
  return { ok: false, declined: false, message: `The card couldn’t be charged (${why}). Check the card details and try again.` };
}

export async function charge(c: ChargeInput): Promise<ChargeResult> {
  const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(chargeRequest(c)) });
  // Authorize.Net puts a byte-order mark in front of its JSON.
  const raw = (await res.text()).replace(/^﻿/, '');
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return { ok: false, declined: false, message: 'The payment service didn’t answer properly. Try again in a minute.' };
  }
  return readChargeResponse(body);
}

/** Undo an approved charge (used if saving the order fails afterwards). */
export async function voidCharge(transactionKey: string, transId: string): Promise<void> {
  if (!transId || transId === '0') return;
  await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      createTransactionRequest: {
        merchantAuthentication: { name: API_LOGIN_ID, transactionKey },
        transactionRequest: { transactionType: 'voidTransaction', refTransId: transId },
      },
    }),
  });
}
