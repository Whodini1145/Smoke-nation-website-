import type { CategoryId, DB, Line } from '../data/types';

export const CATEGORY_NAMES: Record<CategoryId, string> = { flower: 'THCA Flower', vapes: 'Vapes' };

/** "Pulse X 25K" → "Geek Bar Pulse X 25K"; "Foger Pods 30K" stays as is. */
export function lineLabel(line: Line): string {
  return line.brand && !line.name.startsWith(line.brand) ? `${line.brand} ${line.name}` : line.name;
}

export function linesOf(db: Pick<DB, 'lines'>, category: CategoryId): Line[] {
  return db.lines.filter((l) => l.category === category).sort((a, b) => a.sort - b.sort);
}

export function brandsOf(lines: Line[]): string[] {
  return [...new Set(lines.map((l) => l.brand ?? 'Other'))];
}
