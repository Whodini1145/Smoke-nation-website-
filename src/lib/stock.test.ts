import { describe, expect, it } from 'vitest';
import { maxAddable, setStock, statusFor, usageByProduct } from './stock';
import type { Product } from '../data/types';

const settings = { lowStockUnits: 3, lowStockGrams: 14 };
const vape = { id: 'v', price: 20, status: 'in' } as Product;
const flower = { id: 'f', sizePrices: { '1g': 10, '3.5g': 30 }, status: 'in' } as Product;

describe('stock', () => {
  it('marks vapes low at the threshold and out at zero', () => {
    expect(statusFor(vape, 10, settings)).toBe('in');
    expect(statusFor(vape, 3, settings)).toBe('low');
    expect(statusFor(vape, 0, settings)).toBe('out');
  });
  it('counts flower in grams', () => {
    expect(statusFor(flower, 28, settings)).toBe('in');
    expect(statusFor(flower, 14, settings)).toBe('low');
    expect(statusFor(flower, 0.5, settings)).toBe('out');
    expect([...usageByProduct([{ key: 'a', productId: 'f', size: '3.5g', qty: 2 }]).values()]).toEqual([7]);
  });
  it('setStock updates status, and clearing stops counting', () => {
    const p = { ...vape };
    setStock(p, 2, settings);
    expect(p).toMatchObject({ stock: 2, status: 'low' });
    setStock(p, -5, settings);
    expect(p).toMatchObject({ stock: 0, status: 'out' });
    setStock(p, undefined, settings);
    expect('stock' in p).toBe(false);
  });
  it('limits what can be added to what is left', () => {
    const p = { ...flower, stock: 10 };
    expect(maxAddable(p, '3.5g', [])).toBe(2);
    expect(maxAddable(p, '3.5g', [{ key: 'x', productId: 'f', size: '3.5g', qty: 2 }])).toBe(0);
    expect(maxAddable(vape, undefined, [])).toBe(20);
  });
});
