import { describe, expect, it } from 'vitest';
import { formatCardNumber, formatExpiry, parseExpiry } from './payment';

describe('card typing helpers', () => {
  it('adds a dash every 4 digits (Amex 4-6-5)', () => {
    expect(formatCardNumber('4111')).toBe('4111');
    expect(formatCardNumber('41111')).toBe('4111-1');
    expect(formatCardNumber('4111 1111-1111x1111')).toBe('4111-1111-1111-1111');
    expect(formatCardNumber('378282246310005')).toBe('3782-822463-10005');
  });
  it('adds the slash after the month', () => {
    expect(formatExpiry('1', '')).toBe('1');
    expect(formatExpiry('12', '1')).toBe('12/');
    expect(formatExpiry('12/3', '12/')).toBe('12/3');
    expect(formatExpiry('12/30', '12/3')).toBe('12/30');
    expect(formatExpiry('5', '')).toBe('05/');
    expect(formatExpiry('12', '12/')).toBe('12'); // backspace over the slash
    expect(formatExpiry('1230', '')).toBe('12/30'); // pasted
    expect(parseExpiry('12/30')).toEqual({ month: '12', year: '30' });
  });
});
