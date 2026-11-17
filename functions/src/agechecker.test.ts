import { describe, expect, it } from 'vitest';
import { checkAgeStatus, validUuid, type AgeStatus } from './agechecker';

const now = Date.parse('2026-11-17T18:00:00Z');
const ok: AgeStatus = {
  status: 'accepted',
  key: 'CJcVUg61F3O4L2g0w97EXyNymBLZ9ElA',
  verification: { created: '2026-11-17T17:50:00Z', buyer: { first_name: 'Ann', last_name: 'Lee', dob_day: 1, dob_month: 6, dob_year: 1990 } },
};

describe('checkAgeStatus', () => {
  it('passes an accepted, recent check for this customer', () => {
    expect(checkAgeStatus(ok, 'ann LEE', now)).toBeNull();
  });
  it('refuses anything else', () => {
    expect(checkAgeStatus({ ...ok, status: 'photo_id' }, 'Ann Lee', now)).toMatch(/didn’t go through/);
    expect(checkAgeStatus({ ...ok, status: 'denied' }, 'Ann Lee', now)).toMatch(/not approved/);
    expect(checkAgeStatus({ ...ok, key: 'someone-elses-site' }, 'Ann Lee', now)).not.toBeNull();
    expect(checkAgeStatus({ ...ok, key: undefined }, 'Ann Lee', now)).not.toBeNull();
    expect(checkAgeStatus({ ...ok, verification: { ...ok.verification, created: '2026-11-15T17:50:00Z' } }, 'Ann Lee', now)).not.toBeNull();
    expect(checkAgeStatus(ok, 'Bob Smith', now)).toMatch(/doesn’t match/);
    const young = { ...ok, verification: { ...ok.verification, buyer: { last_name: 'Lee', dob_day: 18, dob_month: 11, dob_year: 2005 } } };
    expect(checkAgeStatus(young, 'Ann Lee', now)).toMatch(/21/);
    expect(checkAgeStatus({ error: { code: 'invalid_uuid' } }, 'Ann Lee', now)).not.toBeNull();
  });
  it('only accepts uuid-looking ids', () => {
    expect(validUuid('sample_uuidf0xJcZBX0t59SVYa106rt')).toBe(true);
    expect(validUuid('../x')).toBe(false);
    expect(validUuid(undefined)).toBe(false);
  });
});
