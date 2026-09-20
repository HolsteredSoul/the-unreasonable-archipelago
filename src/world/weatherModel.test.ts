import { describe, expect, it } from 'vitest';
import { createGame, DIRECTIONS, forecastTide, isInBounds } from '../game';
import type { GameState, Island } from '../game/types';
import { getWeatherPresentation, previewBreakwater } from './weatherModel';

const at = (id: string, q: number, r: number, extra: Partial<Island> = {}): Island => ({
  id, name: id, q, r, kind: 'ordinary', building: null, growth: 0,
  stress: 0, nourished: false, anchored: true, ...extra,
});
const sea = (tide: number, ...islands: Island[]): GameState => ({
  ...createGame(), tide, islands: [at('heart', 0, 0, { kind: 'heart' }), ...islands],
});

describe('weather presentation', () => {
  it('uses the blocker position after drift, rather than the position the player currently sees', () => {
    const state = sea(5, at('blocker', 2, 0, { anchored: false }), at('bell', 4, -1, { kind: 'bell', stress: 2 }));
    const view = getWeatherPresentation(state);
    expect(view.islands.find(island => island.id === 'blocker')).toMatchObject({ from: { q: 2, r: 0 }, to: { q: 3, r: 0 }, shelterCells: [{ q: 4, r: -1 }] });
    expect(view.islands.find(island => island.id === 'bell')).toMatchObject({ sheltered: true, blockerIds: ['blocker'], stressBefore: 2, stressAfter: 1, stressDelta: -1 });
  });

  it('does not move a blocked shelter source to its intended drift destination', () => {
    const state = sea(5, at('blocker', 2, 0, { anchored: false }), at('obstacle', 3, 0), at('bell', 3, -1, { kind: 'bell' }));
    const view = getWeatherPresentation(state);
    expect(view.forecast.moves.find(move => move.id === 'blocker')?.blocked).toBe(true);
    expect(view.islands.find(island => island.id === 'blocker')?.to).toEqual({ q: 2, r: 0 });
    expect(view.islands.find(island => island.id === 'bell')?.blockerIds).toEqual(['blocker']);
  });

  it('uses pre-growth breakwater reach for the tide in which the breakwater grows', () => {
    const state = sea(5,
      at('wall', 0, 2, { building: 'breakwater', growth: 1, nourished: true, anchored: false }),
      at('bell', 3, 0, { kind: 'bell' }),
    );
    const view = getWeatherPresentation(state);
    expect(view.forecast.state.islands.find(island => island.id === 'wall')?.growth).toBe(2);
    expect(view.islands.find(island => island.id === 'wall')).toMatchObject({
      to: { q: 0, r: 3 }, sheltered: true, blockerIds: ['wall'],
      shelterCells: [{ q: 0, r: 3 }, { q: 1, r: 2 }, { q: 2, r: 1 }],
    });
    expect(view.islands.find(island => island.id === 'bell')).toMatchObject({ sheltered: false, blockerIds: [], stressAfter: 1 });
    expect(view.shelteredCells.some(cell => cell.hex.q === 3 && cell.hex.r === 0)).toBe(false);
  });

  it('rotates the exact straight shelter ray when the weather changes direction', () => {
    const state = sea(3, at('wall', -1, 1, { building: 'breakwater', growth: 2 }));
    expect(getWeatherPresentation(state).islands[1].shelterCells).toEqual([
      { q: -1, r: 1 }, { q: 0, r: 1 }, { q: 1, r: 1 }, { q: 2, r: 1 },
    ]);
    expect(getWeatherPresentation({ ...state, tide: 5 }).islands[1].shelterCells).toEqual([
      { q: -1, r: 1 }, { q: 0, r: 0 }, { q: 1, r: -1 }, { q: 2, r: -2 },
    ]);
  });

  it('shows the calm tide being resolved even when the next tide is a storm', () => {
    const state = sea(2, at('bell', 2, -2, { kind: 'bell', stress: 2 }));
    const forecast = forecastTide(state);
    const view = getWeatherPresentation(state, forecast);
    expect(forecast.state.tide).toBe(3);
    expect(view).toMatchObject({ tide: 2, storm: false, strength: 0, direction: 1 });
    expect(view.forecast).toBe(forecast);
    expect(view.shelteredCells).toHaveLength(61);
    expect(view.islands.find(island => island.id === 'bell')).toMatchObject({ sheltered: true, blockerIds: [], stressBefore: 2, stressAfter: 1 });
    expect(getWeatherPresentation(forecast.state)).toMatchObject({ tide: 3, storm: true, strength: 1 });
  });

  it('shows crossing the stress threshold and recovery across it from the real forecast', () => {
    const view = getWeatherPresentation(sea(8,
      at('exposed', 1, -1, { kind: 'bell', stress: 1 }),
      at('sheltered', 0, -1, { kind: 'bell', stress: 3 }),
    ));
    expect(view.islands.find(island => island.id === 'exposed')).toMatchObject({ sheltered: false, stressBefore: 1, stressAfter: 3, stressDelta: 2 });
    expect(view.islands.find(island => island.id === 'sheltered')).toMatchObject({ sheltered: true, blockerIds: ['heart'], stressBefore: 3, stressAfter: 2, stressDelta: -1 });
  });

  it('clips rays to playable cells and does not resolve a completed storm twice', () => {
    const state = sea(8, at('wall', 0, -4, { building: 'breakwater', growth: 3 }), at('bell', 2, 0, { kind: 'bell', stress: 4 }));
    const finished = forecastTide(state).state;
    const view = getWeatherPresentation(finished);
    expect(view.islands.find(island => island.id === 'wall')?.shelterCells).toEqual([{ q: 0, r: -4 }]);
    expect(view.islands.every(island => island.stressDelta === 0)).toBe(true);
    expect(view.shelteredCells.every(cell => isInBounds(cell.hex))).toBe(true);
  });

  it('keeps cell protection and island protection in agreement across all storm bearings', () => {
    const original = sea(8, at('wall', -1, 1, { building: 'breakwater', growth: 2 }), at('bell', 1, -1, { kind: 'bell' }));
    // Known seed offsets rotate the actual simulator wind; no fabricated forecast is involved.
    const observed = new Set<number>();
    for (let index = 0; index < 40; index++) {
      const state = { ...original, seed: `bearing-${index}` };
      const view = getWeatherPresentation(state);
      observed.add(view.direction);
      expect(view.directionHex).toEqual(DIRECTIONS[view.direction]);
      for (const island of view.islands) {
        const cell = view.shelteredCells.find(cell => cell.hex.q === island.to.q && cell.hex.r === island.to.r);
        expect(!!cell).toBe(island.sheltered);
        expect(cell?.blockerIds ?? []).toEqual(island.blockerIds);
      }
    }
    expect(observed.size).toBe(6);
  });
});

describe('breakwater preview', () => {
  it('pays real costs, reports exact covered islands, and forecasts replaced production', () => {
    const state = sea(8,
      at('site', 1, 2, { building: 'garden', stress: 1 }),
      at('bell', 1, 0, { kind: 'bell', stress: 1 }),
      at('already-safe', 0, -1, { kind: 'bell' }),
    );
    const preview = previewBreakwater(state, 'site')!;
    expect(preview.command).toEqual({ type: 'build', id: 'site', building: 'breakwater' });
    expect(preview.cost).toEqual({ actions: 1, timber: 3 });
    expect(preview.state).toMatchObject({ actions: state.actions - 1, timber: state.timber - 3, food: state.food });
    expect(preview.replacedBuilding).toBe('garden');
    expect(preview.protectedIds).toEqual(['site', 'bell']);
    expect(preview.newlyProtectedIds).toEqual(['site', 'bell']);
    expect(preview.forecast.production.food).toBe(0);
    expect(preview.presentation.islands.find(island => island.id === 'bell')).toMatchObject({ sheltered: true, blockerIds: ['site'], stressAfter: 0 });
  });

  it('previews the build after drift without promising future shelter during calm weather', () => {
    const state = sea(5, at('site', 0, 2, { anchored: false }), at('bell', 2, 1, { kind: 'bell' }));
    const preview = previewBreakwater(state, 'site')!;
    expect(preview.presentation.islands.find(island => island.id === 'site')?.to).toEqual({ q: 0, r: 3 });
    expect(preview.protectedIds).toContain('bell');
    const calm = previewBreakwater({ ...state, tide: 4 }, 'site')!;
    expect(calm.presentation.storm).toBe(false);
    expect(calm.newlyProtectedIds).toEqual([]);
  });

  it('rejects illegal builds through the same command validation as actual play', () => {
    const state = sea(8, at('site', 1, 2), at('bell', 1, 0, { kind: 'bell' }));
    expect(previewBreakwater(state, 'missing')).toBeNull();
    expect(previewBreakwater(state, 'heart')).toBeNull();
    expect(previewBreakwater(state, 'bell')).toBeNull();
    expect(previewBreakwater({ ...state, actions: 0 }, 'site')).toBeNull();
    expect(previewBreakwater({ ...state, timber: 2 }, 'site')).toBeNull();
    expect(previewBreakwater({ ...state, status: 'lost' }, 'site')).toBeNull();
    const built = previewBreakwater(state, 'site')!.state;
    expect(previewBreakwater(built, 'site')).toBeNull();
  });

  it('leaves the original state and a supplied forecast unchanged', () => {
    const state = sea(5, at('site', 0, 2, { anchored: false, nourished: true, growth: 1 }), at('bell', 2, 1, { kind: 'bell' }));
    const forecast = forecastTide(state);
    const original = structuredClone({ state, forecast });
    const preview = previewBreakwater(state, 'site')!;
    getWeatherPresentation(state, forecast);
    expect({ state, forecast }).toEqual(original);
    expect(preview.state).not.toBe(state);
    expect(preview.state.islands).not.toBe(state.islands);
    expect(preview.forecast.state).not.toBe(preview.state);
  });
});
