import storefront from '../assets/storefront.jpg';
import flowerJars from '../assets/flower-jars.jpg';
import vapeWall from '../assets/vape-wall.jpg';
import slideFoger from '../assets/slide-foger.jpg';
import geekbarCase from '../assets/geekbar-case.jpg';
import slidePulseX2 from '../assets/slide-pulse-x2.jpg';

// Official product photos from Geek Bar (geekbar.com) and Foger (fogertech.com).
const photos = import.meta.glob<string>('../assets/products/*.webp', { eager: true, import: 'default' });
const photo = (name: string) => photos[`../assets/products/${name}.webp`];
import type { DB, Line, Product, SizePrices } from './types';

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
  { id: 'gb-x2-25', category: 'vapes', brand: 'Geek Bar', name: 'Pulse X 25K', sort: 3 },
  { id: 'gb-x2-50', category: 'vapes', brand: 'Geek Bar', name: 'Pulse X 2 50K', sort: 4 },
  { id: 'gb-mate-kit', category: 'vapes', brand: 'Geek Bar', name: 'Mate Kit 60K', sort: 5 },
  { id: 'gb-mate-pod', category: 'vapes', brand: 'Geek Bar', name: 'Mate Pod 60K', sort: 6 },
];

let n = 0;
const id = (p: string) => `${p}-${(++n).toString(36)}`;

const tierPrices: Record<string, SizePrices> = {
  exotics: { '1g': 15, '3.5g': 40, '7g': 70, '14g': 120, '1oz': 200 },
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

const products: Product[] = [
  flower('exotics', 'Sample Exotic One', 272, 55, 55, { bestSeller: true, description: 'Dense, frosty buds. Our top shelf.' }),
  flower('exotics', 'Sample Exotic Two', 330, 72, 45),
  flower('exotics', 'Sample Exotic Three', 214, 72, 50, { status: 'low' }),
  flower('hydro', 'Sample Hydro One', 96, 55, 50, { bestSeller: true }),
  flower('hydro', 'Sample Hydro Two', 174, 58, 45),
  flower('aaa', 'Sample AAA One', 47, 92, 40),
  flower('aaa', 'Sample AAA Two', 26, 88, 45, { onSale: true, saleSizePrices: { '1g': 8, '3.5g': 25, '7g': 45, '14g': 80, '1oz': 130 } }),
  flower('greenhouse', 'Sample Greenhouse One', 96, 55, 35),
  flower('greenhouse', 'Sample Greenhouse Two', 24, 38, 40, { status: 'out' }),

  vape('foger-pods', 'Strawberry Ice', 20, 272, 55, 30, { photo: photo('foger-strawberry-ice'), bestSeller: true }),
  vape('foger-pods', 'Strawberry Cupcake', 20, 2, 72, 40, { photo: photo('foger-strawberry-cupcake') }),
  vape('foger-pods', 'Frozen Watermelon', 20, 330, 72, 30, { photo: photo('foger-frozen-watermelon'), bestSeller: true }),
  vape('foger-pods', 'Strawberry Mango', 20, 26, 88, 35, { photo: photo('foger-strawberry-mango') }),
  vape('foger-pods', 'Miami Mint', 20, 174, 58, 40, { photo: photo('foger-miami-mint') }),
  vape('foger-pods', 'Cola Slush', 20, 2, 72, 45, { photo: photo('foger-cola-slush') }),
  vape('foger-pods', 'Grape Slush', 20, 272, 55, 45, { photo: photo('foger-grape-slush'), status: 'low' }),
  vape('foger-pods', 'Frozen Blueberry', 20, 214, 72, 45, { photo: photo('foger-frozen-blueberry') }),
  vape('foger-battery', 'Switch Pro Battery', 15, 214, 72, 30, { photo: photo('foger-battery'), description: 'Rechargeable 1200mAh base for Foger 30K pods.' }),
  vape('gb-x2-25', 'Blue Razz Ice', 22, 214, 72, 40, { photo: photo('px-blue-razz-ice'), bestSeller: true }),
  vape('gb-x2-25', 'Watermelon Ice', 22, 330, 72, 35, { photo: photo('px-watermelon-ice') }),
  vape('gb-x2-25', 'Miami Mint', 22, 0, 0, 35, { photo: photo('px-miami-mint') }),
  vape('gb-x2-25', 'Sour Apple Ice', 22, 96, 55, 35, { photo: photo('px-sour-apple-ice') }),
  vape('gb-x2-25', 'Strawberry B-Pop', 22, 330, 72, 30, { photo: photo('px-strawberry-b-pop') }),
  vape('gb-x2-25', 'Blackberry B-Pop', 22, 272, 55, 35, { photo: photo('px-blackberry-b-pop') }),
  vape('gb-x2-50', 'Orange Fcuking Fab', 28, 26, 88, 60, { photo: photo('x2-orange-fcuking-fab'), bestSeller: true }),
  vape('gb-x2-50', 'Strawberry B-Burst', 28, 330, 72, 60, { photo: photo('x2-strawberry-b-burst') }),
  vape('gb-x2-50', 'Blue Rancher', 28, 214, 72, 60, { photo: photo('x2-blue-rancher') }),
  vape('gb-x2-50', 'Grape Slush', 28, 272, 55, 60, { photo: photo('x2-grape-slush'), onSale: true, salePrice: 24 }),
  vape('gb-x2-50', 'Peach Slush', 28, 330, 72, 55, { photo: photo('x2-peach-slush') }),
  vape('gb-x2-50', 'Watermelon Crush', 28, 2, 72, 60, { photo: photo('x2-watermelon-crush') }),
  vape('gb-mate-kit', 'Strawberry Kiwi Kit', 30, 330, 72, 25, { photo: photo('mate-strawberry-kiwi'), description: 'Battery and one pod, 60K puffs.' }),
  vape('gb-mate-kit', 'Blueberry Yummy Kit', 30, 214, 72, 25, { photo: photo('mate-blueberry-yummy'), description: 'Battery and one pod, 60K puffs.' }),
  vape('gb-mate-pod', 'Peach Mango Watermelon', 22, 47, 92, 30, { photo: photo('mate-peach-mango-watermelon'), description: 'Pod only. Fits the Mate battery.' }),
  vape('gb-mate-pod', 'White Peach Raspberry', 22, 330, 72, 25, { photo: photo('mate-white-peach-raspberry'), description: 'Pod only. Fits the Mate battery.' }),
  vape('gb-mate-pod', 'Strawberry Mint Candy', 22, 174, 58, 25, { photo: photo('mate-strawberry-mint-candy'), description: 'Pod only. Fits the Mate battery.' }),
];

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
      { id: 't-x2-25', category: 'vapes', label: 'Pulse X 25K', lineId: 'gb-x2-25', hue: 214, saturation: 72, intensity: 50 },
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
