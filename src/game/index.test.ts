import { describe, expect, it } from 'vitest';
import { applyCommand, BOARD_RADIUS, createGame, DIRECTIONS, FIRST_LIGHT_SOLUTION, forecastTide, getConnectedIds, getIslandStats, getLegalTowTargets, isInBounds, resolveTide } from './index';
import type { GameState, Island } from './types';

const at = (id: string, q: number, r: number, kind: Island['kind'] = 'ordinary'): Island => ({ id, q, r, kind, name: id, building: null, growth: 0, stress: 0, nourished: false, anchored: false });
const withIslands = (islands: Island[], tide = 1): GameState => ({ ...createGame(), islands, tide });

describe('voyage rules', () => {
  it('wins the introductory sea through ordinary commands and eight actual tides', () => {
    let state = createGame('first-light');
    for (const commands of FIRST_LIGHT_SOLUTION) {
      for (const command of commands) {
        const result = applyCommand(state, command);
        expect(result.error).toBeUndefined();
        state = result.state;
      }
      state = resolveTide(state).state;
    }
    expect(state.status).toBe('won');
    expect(state.tide).toBe(8);
    expect(state.islands.find(island => island.id === 'bell')?.growth).toBe(3);
    expect(state.integrity).toBeGreaterThan(0);
  });

  it('loses a voyage when the final bell is not ready', () => {
    let state = createGame();
    for (let i = 0; i < 8; i++) state = resolveTide(state).state;
    expect(state.status).toBe('lost');
    expect(applyCommand(state, { type: 'nourish', id: 'bell' }).error).toBeTruthy();
    expect(resolveTide(state).state).toEqual(state);
  });

  it('has exact forecasts without mutating the input', () => {
    let state = createGame();
    for (let i = 0; i < 8; i++) {
      const before = JSON.stringify(state);
      const forecast = forecastTide(state);
      expect(forecast).toEqual(resolveTide(state));
      expect(JSON.stringify(state)).toBe(before);
      state = forecast.state;
    }
  });

  it('rejects invalid commands without spending anything or replacing state', () => {
    const state = createGame();
    for (const command of [
      { type: 'tow', id: 'bell', to: { q: 0, r: 0 } },
      { type: 'tow', id: 'heart', to: { q: 0, r: -1 } },
      { type: 'tow', id: 'bell', to: { q: 4.5, r: -1 } },
      { type: 'build', id: 'bell', building: 'garden' },
      { type: 'anchor', id: 'missing' },
    ] as const) {
      const result = applyCommand(state, command);
      expect(result.error).toBeTruthy();
      expect(result.state).toBe(state);
    }
    const poor = { ...state, food: 0, timber: 0 };
    expect(applyCommand(poor, { type: 'nourish', id: 'bell' }).state).toBe(poor);
    expect(applyCommand(poor, { type: 'build', id: 'north', building: 'garden' }).state).toBe(poor);
    expect(getLegalTowTargets(poor, 'bell')).toEqual([]);
    const tired = { ...state, actions: 0 };
    expect(applyCommand(tired, { type: 'anchor', id: 'bell' }).state).toBe(tired);
  });

  it('keeps pending nourishment until a safe fed tide and never grows twice from one action', () => {
    let state = withIslands([at('heart', 0, 0, 'heart'), at('bell', 0, -2, 'bell')], 3);
    state = applyCommand(state, { type: 'nourish', id: 'bell' }).state;
    expect(applyCommand(state, { type: 'nourish', id: 'bell' }).error).toBeTruthy();
    state = resolveTide(state).state;
    expect(state.islands[1]).toMatchObject({ growth: 0, nourished: true });
    state = resolveTide(state).state;
    expect(state.islands[1]).toMatchObject({ growth: 1, nourished: false });
    state = resolveTide(state).state;
    expect(state.islands[1].growth).toBe(1);
  });

  it('charges rations after production and damages the Heart on a shortage', () => {
    const state = { ...withIslands([at('heart', 0, 0, 'heart'), { ...at('bell', 1, 0, 'bell'), nourished: true }]), food: 0 };
    const next = resolveTide(state).state;
    expect(next.food).toBe(0);
    expect(next.integrity).toBe(state.integrity - 1);
    expect(next.islands[1]).toMatchObject({ growth: 0, nourished: true });
    expect(resolveTide({ ...state, integrity: 1 }).state.status).toBe('lost');
    const productive = { ...state, islands: [...state.islands, { ...at('garden', -1, 0), building: 'garden' as const }] };
    expect(resolveTide(productive).state.integrity).toBe(state.integrity);
  });

  it('recognizes adjacency chains and physical shelter after movement', () => {
    const state = withIslands([at('heart', 0, 0, 'heart'), at('bridge', 1, 0), at('bell', 2, 0, 'bell'), at('lonely', -3, 0)], 3);
    expect(getConnectedIds(state)).toEqual(['heart', 'bridge', 'bell']);
    expect(getIslandStats(state, 'bell').sheltered).toBe(true);
    expect(getIslandStats(state, 'heart').sheltered).toBe(false);
    state.islands[1].building = 'breakwater';
    state.islands[2].q = 3;
    expect(getIslandStats(state, 'bell').sheltered).toBe(true);
    expect(getIslandStats(state, 'bridge').sheltered).toBe(true);
  });
});

describe('simultaneous drift', () => {
  it('stalls both islands when countercurrents claim the same destination', () => {
    const state = withIslands([at('heart', 0, 0, 'heart'), at('a', -1, -1), at('b', 1, -1)], 2);
    const result = resolveTide(state);
    expect(result.moves).toHaveLength(2);
    expect(result.moves.every(move => move.blocked)).toBe(true);
    expect(result.state.islands.map(({ q, r }) => ({ q, r }))).toEqual(state.islands.map(({ q, r }) => ({ q, r })));
  });

  it('stalls a closed cycle in the current around the Heart', () => {
    const state = withIslands([at('heart', 0, 0, 'heart'), ...DIRECTIONS.map((hex, i) => at(`ring-${i}`, hex.q, hex.r))], 3);
    const result = resolveTide(state);
    expect(result.moves).toHaveLength(6);
    expect(result.moves.every(move => move.blocked)).toBe(true);
    expect(result.state.islands.map(({ q, r }) => ({ q, r }))).toEqual(state.islands.map(({ q, r }) => ({ q, r })));
  });

  it('moves a chain ending in empty water simultaneously', () => {
    const state = withIslands([at('heart', 0, 0, 'heart'), at('a', 2, -1), at('b', 2, 0)]);
    const result = resolveTide(state);
    expect(result.moves.filter(move => !move.blocked)).toHaveLength(2);
    expect(result.state.islands.find(island => island.id === 'a')).toMatchObject({ q: 2, r: 0 });
    expect(result.state.islands.find(island => island.id === 'b')).toMatchObject({ q: 2, r: 1 });
  });

  it('stalls an entire chain ending in an anchored island', () => {
    const state = withIslands([at('heart', 0, 0, 'heart'), at('a', 2, -1), { ...at('b', 2, 0), anchored: true }]);
    const result = resolveTide(state);
    expect(result.moves).toHaveLength(1);
    expect(result.moves[0].blocked).toBe(true);
    expect(result.state.islands.find(island => island.id === 'a')).toMatchObject({ q: 2, r: -1 });
    expect(result.state.islands.find(island => island.id === 'b')?.anchored).toBe(false);
  });

  it('stalls against the reef without wrapping or losing an island', () => {
    const state = withIslands([at('heart', 0, 0, 'heart'), at('edge', 2, 2)]);
    const result = resolveTide(state);
    expect(result.moves[0].blocked).toBe(true);
    expect(result.state.islands[1]).toMatchObject({ q: 2, r: 2 });
  });

  it('does not depend on island array ordering', () => {
    const state = withIslands([at('heart', 0, 0, 'heart'), at('a', 2, -1), at('b', 2, 0), at('c', 2, 1)]);
    const first = resolveTide(state).state.islands;
    const reversed = resolveTide({ ...state, islands: [...state.islands].reverse() }).state.islands;
    expect(first.sort((a, b) => a.id.localeCompare(b.id))).toEqual(reversed.sort((a, b) => a.id.localeCompare(b.id)));
  });
});

describe('seed invariants', () => {
  it('keeps 1,000 seeded voyages deterministic, in bounds, collision free, and safe to open', () => {
    expect(BOARD_RADIUS).toBe(4);
    for (let seed = 0; seed < 1000; seed++) {
      let state = createGame(`sea-${seed}`);
      expect(createGame(`sea-${seed}`)).toEqual(state);
      expect(state.islands).toHaveLength(7);
      expect(state.islands.filter(island => island.building === 'garden').length).toBeGreaterThanOrEqual(1);
      expect(state.islands.filter(island => island.building === 'garden').length).toBeLessThanOrEqual(2);
      expect(getLegalTowTargets(state, 'bell').length).toBeGreaterThan(0);
      const opening = resolveTide(state).state;
      expect(opening.integrity).toBe(5);
      expect(opening.food).toBeGreaterThanOrEqual(state.food - 1);
      for (let tide = 0; tide < 8; tide++) {
        state = resolveTide(state).state;
        expect(state.islands.every(isInBounds)).toBe(true);
        expect(new Set(state.islands.map(island => `${island.q},${island.r}`)).size).toBe(state.islands.length);
        expect(state.food).toBeGreaterThanOrEqual(0);
        expect(state.timber).toBeGreaterThanOrEqual(0);
        expect(state.integrity).toBeGreaterThanOrEqual(0);
        expect(state.islands.every(island => island.growth >= 0 && island.growth <= 3)).toBe(true);
      }
    }
  }, 30000);
});
