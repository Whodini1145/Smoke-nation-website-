import type { CartLine, FlowerSize, Product, Settings, StockStatus } from '../data/types';

// Stock counts. Vapes are counted in units, flower in grams. A product with
// no count keeps whatever status staff set by hand.

export const SIZE_GRAMS: Record<FlowerSize, number> = { '1g': 1, '3.5g': 3.5, '7g': 7, '14g': 14, '1oz': 28 };

export const isCounted = (p: Product) => typeof p.stock === 'number';

/** How much one cart line uses: units, or grams for a flower size. */
export const usage = (size: FlowerSize | undefined, qty: number) => (size ? SIZE_GRAMS[size] * qty : qty);

export function statusFor(p: Product, stock: number, settings: Pick<Settings, 'lowStockUnits' | 'lowStockGrams'>): StockStatus {
  const flower = !!p.sizePrices;
  if (stock <= 0 || (flower && stock < 1)) return 'out';
  return stock <= (flower ? settings.lowStockGrams : settings.lowStockUnits) ? 'low' : 'in';
}

/** Set a product's count and the status that goes with it. */
export function setStock(p: Product, stock: number | undefined, settings: Pick<Settings, 'lowStockUnits' | 'lowStockGrams'>) {
  if (stock === undefined) {
    delete p.stock;
    return;
  }
  p.stock = Math.max(0, Math.round(stock * 10) / 10);
  p.status = statusFor(p, p.stock, settings);
}

/** Total used per product across cart lines. */
export function usageByProduct(lines: CartLine[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const l of lines) m.set(l.productId, (m.get(l.productId) ?? 0) + usage(l.size, l.qty));
  return m;
}

/** Most a customer can add of this product/size, given what's already in the cart. */
export function maxAddable(p: Product, size: FlowerSize | undefined, cart: CartLine[]): number {
  if (!isCounted(p)) return 20;
  const used = usageByProduct(cart).get(p.id) ?? 0;
  const left = p.stock! - used;
  return Math.max(0, Math.min(20, Math.floor(left / usage(size, 1))));
}

export const stockText = (p: Product) => (p.sizePrices ? `${p.stock}g left` : `${p.stock} left`);
