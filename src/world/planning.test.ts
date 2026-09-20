import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, DIRECTIONS, forecastTide, getConnectedIds } from '../game';
import { hexDistance, missingConnection, missingConnections, sameHex, shelterCells, tideProduction } from './planning';

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

  it('gives every disconnected bell a valid path in a thirteen-island sea', () => {
    const state = createGame('first-light');
    const bell = state.islands.find(island => island.kind === 'bell')!;
    const ordinary = state.islands.find(island => island.kind === 'ordinary')!;
    state.islands.push(
      { ...bell, id: 'bell-2', name: 'Second bell', q: -3, r: 0 },
      { ...bell, id: 'bell-3', name: 'Third bell', q: 0, r: 3 },
      { ...bell, id: 'bell-4', name: 'Fourth bell', q: 0, r: -3 },
      { ...ordinary, id: 'far-east', q: 4, r: 0 },
      { ...ordinary, id: 'far-west', q: -4, r: 2 },
      { ...ordinary, id: 'far-south', q: 2, r: 2 },
    );
    const paths = missingConnections(state);
    expect(state.islands).toHaveLength(13);
    expect(paths.map(item => item.id)).toEqual(['bell', 'bell-2', 'bell-3', 'bell-4']);
    const connected = state.islands.filter(island => getConnectedIds(state).includes(island.id));
    for (const { id, path } of paths) {
      expect(sameHex(path[0], state.islands.find(island => island.id === id)!)).toBe(true);
      expect(connected.some(island => sameHex(island, path[path.length - 1]))).toBe(true);
      expect(path.some(hex => !state.islands.some(island => sameHex(island, hex)))).toBe(true);
      for (let index = 1; index < path.length; index++) expect(hexDistance(path[index - 1], path[index])).toBe(1);
    }
    Object.assign(state.islands.find(island => island.id === 'bell-2')!, { q: 0, r: -1 });
    expect(missingConnections(state).some(item => item.id === 'bell-2')).toBe(false);
    expect(missingConnections(state).length).toBeGreaterThan(0);
    expect(missingConnection(state, 'heart')).toEqual([]);
  });
});
