import { describe, expect, it } from 'vitest';
import { FOGER_FLAVORS, FOGER_ORDER } from './fogerFlavors';

describe('Foger shelf order', () => {
  it('lists every flavor exactly once', () => {
    expect([...FOGER_ORDER].sort()).toEqual(FOGER_FLAVORS.map((f) => f.name).sort());
  });

  it('keeps sold-out flavors spread out, never bunched at the top', () => {
    const out = new Set(FOGER_FLAVORS.filter((f) => f.status === 'out').map((f) => f.name));
    const spots = FOGER_ORDER.flatMap((name, i) => (out.has(name) ? [i] : []));
    expect(spots[0]).toBeGreaterThanOrEqual(8);
    for (let i = 1; i < spots.length; i++) expect(spots[i] - spots[i - 1]).toBeGreaterThanOrEqual(3);
  });
});
