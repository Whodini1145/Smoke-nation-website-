// Foger Switch Pro 30K pod flavors the shop carries (official names from fogertech.com).
// status 'out' = carried but sold out right now. Photos: src/assets/products/foger/<slug>.webp

export interface FogerFlavor {
  name: string;
  slug: string;
  status: 'in' | 'out';
  hue: number;
  saturation: number;
}

export const FOGER_FLAVORS: FogerFlavor[] = [
  { name: "Cool Mint", slug: 'cool-mint', status: 'in', hue: 174, saturation: 58 },
  { name: "Gum Mint", slug: 'gum-mint', status: 'in', hue: 214, saturation: 72 },
  { name: "Miami Mint", slug: 'miami-mint', status: 'in', hue: 174, saturation: 58 },
  { name: "Sour Apple Ice", slug: 'sour-apple-ice', status: 'in', hue: 96, saturation: 55 },
  { name: "Juicy Peach Ice", slug: 'juicy-peach-ice', status: 'in', hue: 330, saturation: 72 },
  { name: "Strawberry Ice", slug: 'strawberry-ice', status: 'in', hue: 272, saturation: 55 },
  { name: "Watermelon Ice", slug: 'watermelon-ice', status: 'in', hue: 2, saturation: 72 },
  { name: "Blue Razz Ice", slug: 'blue-razz-ice', status: 'in', hue: 214, saturation: 72 },
  { name: "Strawberry Kiwi", slug: 'strawberry-kiwi', status: 'in', hue: 330, saturation: 72 },
  { name: "Strawberry Watermelon", slug: 'strawberry-watermelon', status: 'in', hue: 2, saturation: 72 },
  { name: "Blue Dragon", slug: 'blue-dragon', status: 'in', hue: 174, saturation: 58 },
  { name: "Blueberry Watermelon", slug: 'blueberry-watermelon', status: 'in', hue: 214, saturation: 72 },
  { name: "Mexico Mango", slug: 'mexico-mango', status: 'in', hue: 26, saturation: 88 },
  { name: "Watermelon Bubble Gum", slug: 'watermelon-bubble-gum', status: 'in', hue: 330, saturation: 72 },
  { name: "Blackberry Blueberry", slug: 'blackberry-blueberry', status: 'in', hue: 272, saturation: 55 },
  { name: "Lime Berry Orange", slug: 'lime-berry-orange', status: 'in', hue: 26, saturation: 88 },
  { name: "Strawberry Banana", slug: 'strawberry-banana', status: 'in', hue: 47, saturation: 92 },
  { name: "Lemon Heads", slug: 'lemon-heads', status: 'in', hue: 47, saturation: 92 },
  { name: "Dragon Fruit Lemonade", slug: 'dragon-fruit-lemonade', status: 'in', hue: 330, saturation: 72 },
  { name: "Cherry Bomb", slug: 'cherry-bomb', status: 'in', hue: 2, saturation: 72 },
  { name: "California Cherry", slug: 'california-cherry', status: 'in', hue: 2, saturation: 72 },
  { name: "Berry Bliss", slug: 'berry-bliss', status: 'in', hue: 214, saturation: 72 },
  { name: "Dragon Melon", slug: 'dragon-melon', status: 'in', hue: 96, saturation: 55 },
  { name: "Strawberry Mango", slug: 'strawberry-mango', status: 'in', hue: 330, saturation: 72 },
  { name: "Pink & Blue", slug: 'pink-blue', status: 'in', hue: 330, saturation: 72 },
  { name: "Pink Lemonade", slug: 'pink-lemonade', status: 'in', hue: 2, saturation: 72 },
  { name: "Raspberry Watermelon", slug: 'raspberry-watermelon', status: 'in', hue: 2, saturation: 72 },
  { name: "Blue Sour Raspberry", slug: 'blue-sour-raspberry', status: 'in', hue: 272, saturation: 55 },
  { name: "Sour Blue Dust", slug: 'sour-blue-dust', status: 'in', hue: 214, saturation: 72 },
  { name: "Sour Fcuking Fab", slug: 'sour-fcuking-fab', status: 'in', hue: 47, saturation: 92 },
  { name: "Blue Rancher", slug: 'blue-rancher', status: 'in', hue: 174, saturation: 58 },
  { name: "OMG B-Burst", slug: 'omg-b-burst', status: 'in', hue: 272, saturation: 55 },
  { name: "Strawberry B-Burst", slug: 'strawberry-b-burst', status: 'in', hue: 2, saturation: 72 },
  { name: "Chocolate Cupcake", slug: 'chocolate-cupcake', status: 'in', hue: 2, saturation: 72 },
  { name: "Sour Punch", slug: 'sour-punch', status: 'in', hue: 96, saturation: 55 },
  { name: "Hawaiian Punch", slug: 'hawaiian-punch', status: 'in', hue: 96, saturation: 55 },
  { name: "Triple Berry Punch", slug: 'triple-berry-punch', status: 'in', hue: 214, saturation: 72 },
  { name: "Purple Passion Punch", slug: 'purple-passion-punch', status: 'in', hue: 214, saturation: 72 },
  { name: "Sour Raspberry Punch", slug: 'sour-raspberry-punch', status: 'in', hue: 174, saturation: 58 },
  { name: "Frozen Wildberry Mix", slug: 'frozen-wildberry-mix', status: 'in', hue: 174, saturation: 58 },
  { name: "Frozen Summer Pear", slug: 'frozen-summer-pear', status: 'in', hue: 47, saturation: 92 },
  { name: "Frozen Orange & Green", slug: 'frozen-orange-green', status: 'in', hue: 47, saturation: 92 },
  { name: "Frozen Watermelon", slug: 'frozen-watermelon', status: 'in', hue: 2, saturation: 72 },
  { name: "Frozen Pineapple", slug: 'frozen-pineapple', status: 'in', hue: 47, saturation: 92 },
  { name: "Frozen Blackberry", slug: 'frozen-blackberry', status: 'in', hue: 272, saturation: 55 },
  { name: "Frozen Strawberry Grapefruit", slug: 'frozen-strawberry-grapefruit', status: 'in', hue: 330, saturation: 72 },
  { name: "Strawberry Slush", slug: 'strawberry-slush', status: 'in', hue: 330, saturation: 72 },
  { name: "Cherry Slush", slug: 'cherry-slush', status: 'in', hue: 26, saturation: 88 },
  { name: "Peach Slush", slug: 'peach-slush', status: 'in', hue: 47, saturation: 92 },
  { name: "Cola Slush", slug: 'cola-slush', status: 'in', hue: 2, saturation: 72 },
  { name: "Grape Slush", slug: 'grape-slush', status: 'in', hue: 272, saturation: 55 },
  { name: "Strawnana Ice Cream", slug: 'strawnana-ice-cream', status: 'in', hue: 26, saturation: 88 },
  { name: "Vanilla Ice Cream", slug: 'vanilla-ice-cream', status: 'in', hue: 47, saturation: 92 },
  { name: "Blueberry Cotton Candy", slug: 'blueberry-cotton-candy', status: 'in', hue: 272, saturation: 55 },
  { name: "Red Mix Refresher", slug: 'red-mix-refresher', status: 'in', hue: 2, saturation: 72 },
  { name: "Orange Dream Refresher", slug: 'orange-dream-refresher', status: 'in', hue: 174, saturation: 58 },
  { name: "Mango Pineapple Refresher", slug: 'mango-pineapple-refresher', status: 'in', hue: 96, saturation: 55 },
  { name: "Blackberry Passion Refresher", slug: 'blackberry-passion-refresher', status: 'in', hue: 0, saturation: 0 },
  { name: "Peach Berries Refresher", slug: 'peach-berries-refresher', status: 'in', hue: 2, saturation: 72 },
  { name: "Strawberry Cupcake", slug: 'strawberry-cupcake', status: 'out', hue: 2, saturation: 72 },
  { name: "Frozen Lemon", slug: 'frozen-lemon', status: 'out', hue: 96, saturation: 55 },
  { name: "Frozen Banana", slug: 'frozen-banana', status: 'out', hue: 47, saturation: 92 },
  { name: "Frozen Blueberry", slug: 'frozen-blueberry', status: 'out', hue: 214, saturation: 72 },
  { name: "Orange Slush", slug: 'orange-slush', status: 'out', hue: 26, saturation: 88 },
  { name: "Watermelon Cotton Candy", slug: 'watermelon-cotton-candy', status: 'out', hue: 174, saturation: 58 },
  { name: "Strawberry Cotton Candy", slug: 'strawberry-cotton-candy', status: 'out', hue: 26, saturation: 88 },
  { name: "Gummy Bear", slug: 'gummy-bear', status: 'out', hue: 0, saturation: 0 },
  { name: "White Gummy", slug: 'white-gummy', status: 'out', hue: 0, saturation: 0 },
  { name: "Kiwi Dragon Berry", slug: 'kiwi-dragon-berry', status: 'out', hue: 272, saturation: 55 },
  { name: "Coconut Cupcake", slug: 'coconut-cupcake', status: 'out', hue: 214, saturation: 72 },
];

/** Display order: flavors grouped by family, sold-out flavors kept inside their family. */
export const FOGER_ORDER: string[] = [
  // Mint
  'Cool Mint', 'Gum Mint', 'Miami Mint',
  // Ice
  'Sour Apple Ice', 'Juicy Peach Ice', 'Strawberry Ice', 'Watermelon Ice', 'Blue Razz Ice',
  // Fruit
  'Strawberry Kiwi', 'Strawberry Watermelon', 'Strawberry Banana', 'Strawberry Mango', 'Blueberry Watermelon', 'Raspberry Watermelon',
  'Blackberry Blueberry', 'Berry Bliss', 'Lime Berry Orange', 'Mexico Mango', 'Blue Dragon', 'Dragon Melon', 'Kiwi Dragon Berry',
  'Cherry Bomb', 'California Cherry', 'Pink & Blue', 'Watermelon Bubble Gum',
  // Lemonade
  'Lemon Heads', 'Dragon Fruit Lemonade', 'Pink Lemonade',
  // Sour
  'Blue Sour Raspberry', 'Sour Blue Dust', 'Sour Fcuking Fab',
  // Candy
  'Blue Rancher', 'OMG B-Burst', 'Strawberry B-Burst', 'Gummy Bear', 'White Gummy',
  // Punch
  'Sour Punch', 'Hawaiian Punch', 'Triple Berry Punch', 'Purple Passion Punch', 'Sour Raspberry Punch',
  // Frozen
  'Frozen Watermelon', 'Frozen Pineapple', 'Frozen Blackberry', 'Frozen Blueberry', 'Frozen Banana', 'Frozen Lemon',
  'Frozen Wildberry Mix', 'Frozen Summer Pear', 'Frozen Orange & Green', 'Frozen Strawberry Grapefruit',
  // Slush
  'Strawberry Slush', 'Cherry Slush', 'Peach Slush', 'Cola Slush', 'Grape Slush', 'Orange Slush',
  // Refresher
  'Red Mix Refresher', 'Orange Dream Refresher', 'Mango Pineapple Refresher', 'Blackberry Passion Refresher', 'Peach Berries Refresher',
  // Cotton candy
  'Blueberry Cotton Candy', 'Watermelon Cotton Candy', 'Strawberry Cotton Candy',
  // Ice cream
  'Strawnana Ice Cream', 'Vanilla Ice Cream',
  // Cupcake
  'Chocolate Cupcake', 'Strawberry Cupcake', 'Coconut Cupcake',
];
