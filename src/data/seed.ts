import storefront from '../assets/storefront.jpg';
import flowerJars from '../assets/flower-jars.jpg';
import vapeWall from '../assets/vape-wall.jpg';
import slideFoger from '../assets/slide-foger.jpg';
import geekbarCase from '../assets/geekbar-case.jpg';
import slidePulseX2 from '../assets/slide-pulse-x2.jpg';

// Official product photos from Geek Bar (geekbar.com) and Foger (fogertech.com),
// served from public/products/ at fixed addresses so saved products keep working.
const photo = (name: string) => `/products/${name}.webp`;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
import type { DB, Line, Product, SizePrices, Strain } from './types';
import { FOGER_FLAVORS, FOGER_ORDER } from './fogerFlavors';

// Starting content. Product names and every price below are placeholders so the
// site has something to show — replace them from the admin panel.

export const FLOWER_DISCLAIMER = 'Hemp-derived THC, low dose Delta 9';

const lines: Line[] = [
  { id: 'exotics', category: 'flower', name: 'Top Tier Exotics', potency: 4, sort: 1 },
  { id: 'hydro', category: 'flower', name: 'Indoor Hydroponics', potency: 3, sort: 2 },
  { id: 'aaa', category: 'flower', name: 'Indoor AAA', potency: 2, sort: 3 },
  { id: 'greenhouse', category: 'flower', name: 'Greenhouse', potency: 1, sort: 4 },
  { id: 'foger-pods', category: 'vapes', brand: 'Foger', name: 'Foger Pods 30K', sort: 1 },
  { id: 'foger-battery', category: 'vapes', brand: 'Foger', name: 'Foger Battery', sort: 2 },
  { id: 'gb-x2-25', category: 'vapes', brand: 'Geek Bar', name: 'Pulse 2 25K', sort: 3 },
  { id: 'gb-x2-50', category: 'vapes', brand: 'Geek Bar', name: 'Pulse X 2 50K', sort: 4 },
  { id: 'gb-mate-kit', category: 'vapes', brand: 'Geek Bar', name: 'Mate Kit 60K', sort: 5 },
  { id: 'gb-mate-pod', category: 'vapes', brand: 'Geek Bar', name: 'Mate Pod 60K', sort: 6 },
];

let n = 0;
const id = (p: string) => `${p}-${(++n).toString(36)}`;

const tierPrices: Record<string, SizePrices> = {
  exotics: { '1g': 10, '3.5g': 30, '7g': 50, '14g': 100, '1oz': 180 },
  hydro: { '1g': 12, '3.5g': 35, '7g': 60, '14g': 100, '1oz': 170 },
  aaa: { '1g': 10, '3.5g': 30, '7g': 50, '14g': 85, '1oz': 140 },
  greenhouse: { '1g': 7, '3.5g': 20, '7g': 35, '14g': 60, '1oz': 100 },
};

function flower(lineId: string, name: string, hue: number, saturation: number, intensity: number, extra: Partial<Product> = {}): Product {
  return {
    id: id('f'),
    lineId,
    name,
    description: '',
    sizePrices: { ...tierPrices[lineId] },
    onSale: false,
    status: 'in',
    bestSeller: false,
    hue,
    saturation,
    intensity,
    createdAt: Date.now() - n * 1000,
    ...extra,
  };
}

function vape(lineId: string, name: string, price: number, hue: number, saturation: number, intensity: number, extra: Partial<Product> = {}): Product {
  return {
    id: id('v'),
    lineId,
    name,
    description: '',
    price,
    onSale: false,
    status: 'in',
    bestSeller: false,
    hue,
    saturation,
    intensity,
    createdAt: Date.now() - n * 1000,
    ...extra,
  };
}

const STRAIN_COLOR: Record<Strain, [number, number]> = { indica: [272, 55], hybrid: [96, 55], sativa: [26, 88] };
const exotic = (name: string, strain: Strain) =>
  flower('exotics', name, ...STRAIN_COLOR[strain], 45, { strain, description: '' });

const gb = (lineId: string, file: string, price: number, hue: number, saturation: number, extra: Partial<Product> = {}) =>
  (name: string) => vape(lineId, name, price, hue, saturation, 30, { photo: photo(`geekbar/${file}-${slug(name)}`), ...extra });

const products: Product[] = [
  // THCA flower: exotics, grouped Indica → Hybrid → Sativa. Photos are added by the shop.
  ...['High Roller', 'Black Zebra', 'New Money', 'Godfather OG', 'Donny Burger'].map((n) => exotic(n, 'indica')),
  ...['Biscotti', 'Warheads', 'Crunch Berries', 'Blue Lobster', 'Blue Gummy'].map((n) => exotic(n, 'hybrid')),
  ...['Motor Breath', '"It\'s a Secret"', 'Purple Hulk', 'Candy Rings', 'Durban Poison'].map((n) => exotic(n, 'sativa')),

  // Foger pods, grouped by flavor family (see FOGER_ORDER). Sold-out flavors stay in their family.
  ...FOGER_ORDER.map((name) => FOGER_FLAVORS.find((f) => f.name === name)!).map((f) =>
    vape('foger-pods', f.name, 20, f.hue, f.saturation, 30, {
      photo: photo(`foger/${f.slug}`),
      status: f.status,
      bestSeller: ['Blue Razz Ice', 'Frozen Watermelon', 'Miami Mint'].includes(f.name),
      // White pods read better on a gray card.
      ...(f.name === 'White Gummy' || f.name === 'Gummy Bear' ? { hue: 0, saturation: 0, intensity: 40 } : {}),
    }),
  ),
  vape('foger-battery', 'Switch Pro Battery', 15, 214, 72, 30, { photo: photo('foger-battery'), description: 'Rechargeable 1200mAh base for Foger 30K pods.' }),

  // Geek Bar Pulse 2 25K: ice, frozen, fruit, sour, then the Hubba edition.
  ...['White Gummy Ice', 'Juicy Peach Ice', 'Sour Apple Ice', 'Frozen White Grape', 'Stone Freeze', 'Dragon Melon', 'Strawberry Banana', 'Sour Gush', 'Fcuking FAB'].map(gb('gb-x2-25', 'pulse2', 25.99, 214, 72)),
  ...(['Grape Hubba', 'Lemon Hubba', 'Blue Razz Hubba', 'White Peach Hubba'] as const).map((n, i) =>
    gb('gb-x2-25', 'pulse2', 25.99, [272, 47, 214, 26][i], [55, 92, 72, 88][i])(n),
  ),

  // Geek Bar Pulse X 2: Fab, Bull, ice, slush, fruit.
  ...['Orange Fcuking Fab', 'Sour Fcuking Fab'].map(gb('gb-x2-50', 'x2', 30, 26, 88)),
  ...['Strawberry Bull', 'Blue Razz Bull', 'Coco Berry Bull', 'Peach Bull', 'Watermelon Bull'].map(gb('gb-x2-50', 'x2', 30, 2, 72)),
  ...['Blue Razz Ice', 'Watermelon Ice', 'Wild Cherry Slush'].map(gb('gb-x2-50', 'x2', 30, 214, 72)),
  ...['White Peach Raspberry', 'Pink & Blue', 'Blackberry Blueberry', 'Blue Rancher'].map(gb('gb-x2-50', 'x2', 30, 330, 72)),

  // Geek Bar Mate 60K kits and pods: mint/ice, fruit, lemonade.
  ...['Cool Mint', 'Blue Razz Ice', 'Sour Apple Ice', 'Watermelon Ice', 'Sky Blue Ice', 'Juicy Peach', 'Strawberry Banana', 'Triple Berry', 'Amazon Lemonade'].map(
    gb('gb-mate-kit', 'mate-kit', 30, 174, 58, { description: 'Battery and one pod, 60K puffs.' }),
  ),
  ...['Cool Mint', 'Blue Razz Ice', 'Sour Apple Ice', 'Watermelon Ice', 'Blue Straws', 'Juicy Peach', 'Strawberry Banana', 'Amazon Lemonade'].map(
    gb('gb-mate-pod', 'mate-pod', 22.99, 174, 58, { description: 'Pod only. Fits the Mate battery.' }),
  ),
].map((p, i) => ({ ...p, sort: i }));

const fogerPodIds = products.filter((p) => p.lineId === 'foger-pods').map((p) => p.id);

export function createSeed(): DB {
  return {
    version: 1,
    lines,
    products,
    deals: [
      { id: 'deal-foger', name: 'Foger Pods 2 for $35', qty: 2, kind: 'bundle', value: 35, productIds: fogerPodIds, active: true },
    ],
    slides: [
      { id: 's-store', photo: storefront, caption: 'Order online, pick up at the shop', link: '/about', linkLabel: 'Find the shop' },
      { id: 's-flower', photo: flowerJars, caption: 'THCA flower in four tiers', link: '/shop/flower', linkLabel: 'Shop flower' },
      { id: 's-foger', photo: slideFoger, caption: 'Foger Switch Pro pods, 30K puffs', link: '/shop/vapes/foger-pods', linkLabel: 'Shop Foger' },
      { id: 's-pulse', photo: slidePulseX2, caption: 'Geek Bar Pulse X 2, 50K puffs', link: '/shop/vapes/gb-x2-50', linkLabel: 'Shop Geek Bar' },
      { id: 's-vapes', photo: vapeWall, caption: 'Foger and Geek Bar, every flavor we stock', link: '/shop/vapes', linkLabel: 'Shop vapes' },
      { id: 's-case', photo: geekbarCase, caption: 'Every Geek Bar flavor, behind the glass', link: '/shop/vapes/gb-x2-25', linkLabel: 'Shop Geek Bar' },
    ],
    reviews: [
      { id: 'r1', name: 'Sample reviewer', stars: 5, text: 'Placeholder review. Paste a real review from your Google listing in Admin → Home screen.' },
      { id: 'r2', name: 'Sample reviewer', stars: 5, text: 'Placeholder review. Featured reviews show here as a row people can swipe through.' },
      { id: 'r3', name: 'Sample reviewer', stars: 4, text: 'Placeholder review. Remove these once your real ones are in.' },
    ],
    tiles: [
      { id: 't-exotics', category: 'flower', label: 'Top Tier Exotics', lineId: 'exotics', hue: 272, saturation: 55, intensity: 50 },
      { id: 't-hydro', category: 'flower', label: 'Indoor Hydroponics', lineId: 'hydro', hue: 96, saturation: 55, intensity: 50 },
      { id: 't-aaa', category: 'flower', label: 'Indoor AAA', lineId: 'aaa', hue: 47, saturation: 92, intensity: 45 },
      { id: 't-greenhouse', category: 'flower', label: 'Greenhouse', lineId: 'greenhouse', hue: 174, saturation: 58, intensity: 40 },
      { id: 't-foger-pods', category: 'vapes', label: 'Foger Pods', lineId: 'foger-pods', hue: 330, saturation: 72, intensity: 45 },
      { id: 't-foger-battery', category: 'vapes', label: 'Foger Battery', lineId: 'foger-battery', hue: 0, saturation: 0, intensity: 50 },
      { id: 't-x2-25', category: 'vapes', label: 'Pulse 2 25K', lineId: 'gb-x2-25', hue: 214, saturation: 72, intensity: 50 },
      { id: 't-x2-50', category: 'vapes', label: 'Pulse X 2 50K', lineId: 'gb-x2-50', hue: 272, saturation: 55, intensity: 50 },
      { id: 't-mate-kit', category: 'vapes', label: 'Mate Kit 60K', lineId: 'gb-mate-kit', hue: 2, saturation: 72, intensity: 45 },
      { id: 't-mate-pod', category: 'vapes', label: 'Mate Pod 60K', lineId: 'gb-mate-pod', hue: 26, saturation: 88, intensity: 45 },
    ],
    settings: {
      taxRate: 8.25,
      cardFeePercent: 0,
      shippingFee: 10,
      freeShippingOver: 0,
      minOrder: 0,
      lowStockUnits: 3,
      lowStockGrams: 14,
      shippingAllowed: { flower: true, vapes: false },
      rating: 4.7,
      reviewCount: 40,
      menuIntensity: 85,
      phone: '',
      email: '',
      address: '420 Pine St',
      city: 'Frankston, TX 75763',
      mapsUrl: 'https://www.google.com/maps/search/?api=1&query=420+Pine+St+Frankston+TX+75763',
      hours: [
        { label: 'Monday – Thursday', hours: '10am – 8pm' },
        { label: 'Friday & Saturday', hours: '10am – 9pm' },
        { label: 'Sunday', hours: '12pm – 8pm' },
      ],
      aboutTitle: 'A family shop on Pine Street',
      aboutBody: [
        'Smoke Nation started in 2022 with one idea from our owner, **Elvis Fernandes**: Frankston deserved a smoke shop that felt like a neighbor, not a gas-station counter. He painted the building red, white and blue, put two picnic tables out front, and filled the shelves with the stuff people were driving to Tyler to find.',
        'It is still a family operation. Elvis runs the shop, his cousin helps keep the shelves and this website stocked, and most days you will be talking to one of us. We learn names, we remember what you liked last time, and if you find a lower price somewhere else, bring the receipt and we will match it.',
        'This site is the same shop, open later. Pick out your flower or your flavor, pay online, and grab it at the counter — or have it shipped where we can. Either way, it comes from the same jars and the same wall you would see if you walked in.',
      ].join('\n\n'),
    },
    orders: [],
    customers: [],
    admins: [],
  };
}
