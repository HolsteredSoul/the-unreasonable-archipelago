import { describe, expect, it } from 'vitest';
import { placeMapLabel, type LabelRect } from './labelLayout';

describe('larger-sea label layout', () => {
  it('keeps thirteen selectable labels apart without displacing the selected island first', () => {
    const occupied: LabelRect[] = [];
    for (let index = 0; index < 13; index++) {
      const anchor = { x: 460 + index % 4 * 115, y: 240 + Math.floor(index / 4) * 78 };
      const size = index === 0 ? { width: 200, height: 80 } : index < 4 ? { width: 145, height: 54 } : { width: 115, height: 26 };
      const result = placeMapLabel(anchor, size, occupied, { width: 1366, height: 768 });
      expect(result.overlap).toBe(false);
      if (index === 0) expect({ x: result.x, y: result.y }).toEqual(anchor);
      expect(result.rect.left).toBeGreaterThanOrEqual(8);
      expect(result.rect.right).toBeLessThanOrEqual(1358);
      occupied.push(result.rect);
    }
  });

  it('keeps edge labels readable and never mutates earlier placements', () => {
    const occupied = [{ left: 8, right: 168, top: 8, bottom: 45 }];
    const original = structuredClone(occupied);
    const result = placeMapLabel({ x: -20, y: -10 }, { width: 160, height: 32 }, occupied, { width: 390, height: 700 });
    expect(result.overlap).toBe(false);
    expect(result.rect.left).toBeGreaterThanOrEqual(8);
    expect(result.rect.top).toBeGreaterThanOrEqual(8);
    expect(result.rect.right).toBeLessThanOrEqual(382);
    expect(occupied).toEqual(original);
  });
});
