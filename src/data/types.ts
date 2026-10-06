// Shapes of everything the site stores. When the real database (Supabase) is
// connected, each of these becomes a table with the same fields.

export type CategoryId = 'flower' | 'vapes';

export const FLOWER_SIZES = ['1g', '3.5g', '7g', '14g', '1oz'] as const;
export type FlowerSize = (typeof FLOWER_SIZES)[number];
export type SizePrices = Partial<Record<FlowerSize, number>>;

/** A sub-category: a flower tier (Greenhouse, Top Tier Exotics…) or a vape product line (Foger Pods…). */
export interface Line {
  id: string;
  category: CategoryId;
  name: string;
  /** Vapes only: the brand this line belongs to. */
  brand?: string;
  /** Flower only: 1–4 filled potency bars. */
  potency?: number;
  sort: number;
}

export type StockStatus = 'in' | 'low' | 'out';

export interface Product {
  id: string;
  lineId: string;
  name: string;
  /** Extra description. Flower always also shows the hemp disclaimer (added at render time, can't be removed). */
  description: string;
  /** Vapes: single price. */
  price?: number;
  /** Flower: price per size. */
  sizePrices?: SizePrices;
  onSale: boolean;
  salePrice?: number;
  saleSizePrices?: SizePrices;
  status: StockStatus;
  /** How many are on hand: units for vapes, grams for flower. Blank = not counted (status is set by hand). */
  stock?: number;
  /** The order that last lowered `stock` (lets the database check stock changes made by customers). */
  lastOrderId?: string;
  bestSeller: boolean;
  /** Card color: hue 0–360 from the preset swatches, intensity 0–100 (lighter → darker). */
  hue: number;
  saturation: number;
  intensity: number;
  photo?: string;
  createdAt: number;
}

export type DealKind = 'bundle' | 'amountOff';

export interface Deal {
  id: string;
  name: string;
  /** How many qualifying items make one deal. */
  qty: number;
  /** bundle: `qty` items for `value` dollars. amountOff: `value` dollars off every `qty` items. */
  kind: DealKind;
  value: number;
  productIds: string[];
  active: boolean;
}

export interface Slide {
  id: string;
  photo?: string;
  caption: string;
  /** Optional where the slide's button goes, e.g. "/shop/flower". */
  link?: string;
  linkLabel?: string;
  /** Logo-only brand slide. */
  brand?: boolean;
}

export interface Review {
  id: string;
  name: string;
  stars: number;
  text: string;
}

export interface MenuTile {
  id: string;
  category: CategoryId;
  label: string;
  lineId?: string;
  hue: number;
  saturation: number;
  intensity: number;
  photo?: string;
}

export interface StoreHours {
  label: string;
  hours: string;
}

export interface Settings {
  taxRate: number; // percent
  cardFeePercent: number; // percent, 0 = none
  shippingFee: number;
  freeShippingOver: number; // 0 = never free
  minOrder: number; // 0 = none
  /** Counted items show "Running low" at or below these amounts. */
  lowStockUnits: number;
  lowStockGrams: number;
  shippingAllowed: Record<CategoryId, boolean>;
  rating: number;
  reviewCount: number;
  menuIntensity: number; // 0–100
  phone: string;
  email: string;
  address: string;
  city: string;
  mapsUrl: string;
  hours: StoreHours[];
  aboutTitle: string;
  aboutBody: string;
}

export interface CartLine {
  key: string; // productId or productId|size
  productId: string;
  size?: FlowerSize;
  qty: number;
}

export type Fulfillment = 'pickup' | 'ship';
export type OrderStatus = 'new' | 'ready' | 'picked_up' | 'shipped' | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  lineName: string;
  size?: FlowerSize;
  qty: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  number: number;
  createdAt: number;
  customerId?: string;
  name: string;
  email: string;
  phone: string;
  fulfillment: Fulfillment;
  address?: { street: string; city: string; state: string; zip: string };
  items: OrderItem[];
  subtotal: number;
  dealSavings: number;
  dealNames: string[];
  shipping: number;
  cardFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  note?: string;
  ageCheck?: 'passed' | 'failed' | 'not_connected';
  /** True once this order's items were taken out of stock counts. */
  stockApplied?: boolean;
}

export interface Account {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
}

export interface DB {
  version: number;
  lines: Line[];
  products: Product[];
  deals: Deal[];
  slides: Slide[];
  reviews: Review[];
  tiles: MenuTile[];
  settings: Settings;
  orders: Order[];
  customers: Account[];
  admins: Account[];
  /** The first staff account. Only it can add or remove other staff. */
  mainAdminId?: string | null;
}
