import { describe, expect, it } from 'vitest';
import { chargeRequest, readChargeResponse } from './authnet';

describe('Authorize.Net', () => {
  it('builds a charge with the token, never a card number', () => {
    const body = chargeRequest({
      transactionKey: 'k',
      amount: 37.5,
      opaque: { dataDescriptor: 'COMMON.ACCEPT.INAPP.PAYMENT', dataValue: 'tok' },
      invoiceNumber: '123456',
      description: 'Smoke Nation order #123456',
      email: 'a@x.com',
      name: 'Ann Marie Lee',
      zip: '75763',
    });
    const t = body.createTransactionRequest.transactionRequest;
    expect(t.amount).toBe('37.50');
    expect(t.payment.opaqueData.dataValue).toBe('tok');
    expect(t.billTo).toEqual({ firstName: 'Ann', lastName: 'Marie Lee', zip: '75763' });
  });
  it('reads approvals, test-mode approvals, declines and errors', () => {
    const ok = { messages: { resultCode: 'Ok' }, transactionResponse: { responseCode: '1', transId: '6000123', authCode: 'ABC', accountNumber: 'XXXX1111', accountType: 'Visa', testRequest: '0' } };
    expect(readChargeResponse(ok)).toEqual({ ok: true, transId: '6000123', authCode: 'ABC', card: 'XXXX1111', cardType: 'Visa', test: false });
    const test = { messages: { resultCode: 'Ok' }, transactionResponse: { responseCode: '1', transId: '0', authCode: '000000' } };
    expect(readChargeResponse(test)).toMatchObject({ ok: true, test: true });
    const declined = { messages: { resultCode: 'Ok' }, transactionResponse: { responseCode: '2', errors: [{ errorText: 'This transaction has been declined.' }] } };
    expect(readChargeResponse(declined)).toMatchObject({ ok: false, declined: true });
    const bad = { messages: { resultCode: 'Error', message: [{ code: 'E00007', text: 'User authentication failed due to invalid authentication values.' }] } };
    expect(readChargeResponse(bad)).toMatchObject({ ok: false, declined: false, message: expect.stringContaining('authentication') });
  });
});
