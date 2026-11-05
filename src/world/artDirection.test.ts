import { describe, expect, it } from 'vitest';
import { getArtDirection } from './artDirection';

describe('campaign daylight direction', () => {
  it('pairs the eight maps without assigning a later chapter to free or malformed voyages', () => {
    const pairs = Array.from({ length: 4 }, (_, pair) => getArtDirection(pair * 2 + 1));
    expect(new Set(pairs.map(pair => pair.id)).size).toBe(4);
    pairs.forEach((pair, index) => expect(getArtDirection(index * 2 + 2)).toBe(pair));
    for (const value of [undefined, 0, -1, 9, 2.5, NaN, Infinity]) expect(getArtDirection(value)).toBe(pairs[0]);
    expect(pairs[0].waterTint).toEqual([1, 1, 1]);
  });

  it('keeps every preset within restrained daylight bounds and immutable across voyages', () => {
    for (let map = 1; map <= 8; map++) {
      const preset = getArtDirection(map);
      expect(Object.isFrozen(preset)).toBe(true); expect(Object.isFrozen(preset.waterTint)).toBe(true);
      for (const channel of preset.waterTint) { expect(channel).toBeGreaterThanOrEqual(0.9); expect(channel).toBeLessThanOrEqual(1.1); }
      // No channel of the key or hemisphere sky is darkened into a night treatment.
      for (const colour of [preset.sky, preset.sun]) for (const shift of [0, 8, 16]) expect((colour >> shift) & 255).toBeGreaterThanOrEqual(170);
      expect(preset).not.toHaveProperty('cueColor'); expect(preset).not.toHaveProperty('exposure');
    }
  });
});
