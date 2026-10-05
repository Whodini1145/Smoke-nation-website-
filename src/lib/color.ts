// Product-card colors: a preset swatch (hue + saturation) plus a lighter/darker
// intensity slider. Cards render as a radial gradient that is white in the
// center and shows the color at the edges.

export interface Swatch {
  name: string;
  hue: number;
  saturation: number;
}

export const SWATCHES: Swatch[] = [
  { name: 'Red', hue: 2, saturation: 72 },
  { name: 'Orange', hue: 26, saturation: 88 },
  { name: 'Yellow', hue: 47, saturation: 92 },
  { name: 'Green', hue: 96, saturation: 55 },
  { name: 'Teal', hue: 174, saturation: 58 },
  { name: 'Blue', hue: 214, saturation: 72 },
  { name: 'Purple', hue: 272, saturation: 55 },
  { name: 'Pink', hue: 330, saturation: 72 },
  { name: 'Brown', hue: 24, saturation: 38 },
  { name: 'Gray', hue: 0, saturation: 0 },
];

/** intensity 0 = lightest, 100 = darkest. */
export function edgeColor(hue: number, saturation: number, intensity: number): string {
  const lightness = 84 - (Math.max(0, Math.min(100, intensity)) / 100) * 58;
  return `hsl(${hue} ${saturation}% ${lightness.toFixed(1)}%)`;
}

export function cardBackground(hue: number, saturation: number, intensity: number): string {
  const edge = edgeColor(hue, saturation, intensity);
  return `radial-gradient(120% 95% at 50% 46%, #ffffff 0%, #ffffff 26%, ${edge} 100%)`;
}

export function swatchMatches(s: Swatch, hue: number, saturation: number): boolean {
  return s.hue === hue && s.saturation === saturation;
}
