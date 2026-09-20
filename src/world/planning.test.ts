import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, DIRECTIONS, forecastTide, getConnectedIds } from '../game';
import { hexDistance, missingConnection, sameHex, shelterCells, tideProduction } from './planning';

describe('on-water planning data', () => {
  it('shows production before the growth that the same tide awards', () => {
    const state = applyCommand(createGame(), { type: 'nourish', id: 'garden-west' }).state;
    const forecast = forecastTide(state);
    expect(forecast.state.islands.find(island => island.id === 'garden-west')!.growth).toBe(1);
    expect(tideProduction(state, forecast, 'garden-west').food).toBe(2);
  });

  it('keeps per-island production totals equal to the resolved economy across all eight tides', () => {
    for (let seed = 0; seed < 12; seed++) {
      let state = createGame(`map-production-${seed}`);
      state.food = 50;
      for (let tide = 0; tide < 8 && state.status === 'playing'; tide++) {
        const candidate = state.islands.find(island => island.kind === 'ordinary' && island.growth < 3 && !island.nourished);
        if (candidate) state = applyCommand(state, { type: 'nourish', id: candidate.id }).state;
        const forecast = forecastTide(state);
        const totals = state.islands.map(island => tideProduction(state, forecast, island.id));
        expect(totals.reduce((sum, stats) => sum + stats.food, 0) - 2).toBe(forecast.foodDelta);
        expect(totals.reduce((sum, stats) => sum + stats.timber, 0)).toBe(forecast.timberDelta);
        state = forecast.state;
      }
    }
  });

  it('points each shelter wake along the simulation direction and includes mature breakwater reach', () => {
    const island = { ...createGame().islands[0], building: 'breakwater' as const, growth: 2 };
    for (let direction = 0; direction < DIRECTIONS.length; direction++) {
      const cells = shelterCells(island, direction);
      expect(cells).toHaveLength(3);
      expect(cells[0]).toEqual(DIRECTIONS[direction]);
      expect(hexDistance(cells[2], island)).toBe(3);
    }
  });

  it('shows a genuine empty link to the Heart and removes the hint once the bell is connected', () => {
    const state = createGame();
    const path = missingConnection(state);
    const empty = path.filter(hex => !state.islands.some(island => sameHex(hex, island)));
    expect(empty).toHaveLength(1);
    const connected = state.islands.filter(island => getConnectedIds(state).includes(island.id));
    expect(connected.some(island => sameHex(island, path[path.length - 1]))).toBe(true);
    for (let i = 1; i < path.length; i++) expect(hexDistance(path[i - 1], path[i])).toBe(1);
    const bell = state.islands.find(island => island.kind === 'bell')!;
    bell.q = 0; bell.r = -1;
    expect(missingConnection(state)).toEqual([]);
  });
});
