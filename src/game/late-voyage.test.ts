import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, DIRECTIONS, forecastTide, getIslandStats, getVictoryConditions, getWeather, resolveTide } from './index';
import type { Command, GameState, Hex, Island } from './types';

const at = (id: string, q: number, r: number, kind: Island['kind'] = 'ordinary'): Island => ({ id, q, r, kind, name: id, building: null, growth: 0, stress: 0, nourished: false, anchored: false });
const arrangement = (islands: Island[], tide: number): GameState => ({ ...createGame(), islands, tide });
const rotate = (hex: Hex, turns: number): Hex => {
  let value = hex;
  for (let turn = 0; turn < turns; turn++) value = { q: value.q + value.r, r: -value.q };
  return value;
};
const OLD_OPENING: Command[][] = [
  [{ type: 'tow', id: 'bell', to: { q: 2, r: -1 } }, { type: 'nourish', id: 'bell' }, { type: 'anchor', id: 'bell' }],
  [{ type: 'nourish', id: 'bell' }, { type: 'tow', id: 'bell', to: { q: 1, r: -1 } }],
  [{ type: 'nourish', id: 'bell' }],
];
function play(route: Command[][], initial = createGame()) {
  let state = initial;
  const history: GameState[] = [];
  for (let tide = 0; tide < 8; tide++) {
    for (const command of route[tide] ?? []) {
      const result = applyCommand(state, command);
      expect(result.error, `tide ${tide + 1}: ${JSON.stringify(command)}`).toBeUndefined();
      state = result.state;
    }
    state = resolveTide(state).state;
    history.push(state);
  }
  return { state, history };
}

describe('late-voyage currents', () => {
  it('preserves the old currents and victory requirements when a saved voyage omits the new rules', () => {
    const legacy = createGame();
    delete legacy.voyageRules;
    expect(getIslandStats({ ...legacy, tide: 5 }, 'grove').current).toEqual({ q: 0, r: 0 });
    expect(getIslandStats({ ...legacy, tide: 7 }, 'grove').current).toEqual({ q: -1, r: 1 });
    expect(play(OLD_OPENING, legacy).state.status).toBe('won');
    const exposed = arrangement([at('heart', 0, 0, 'heart'), { ...at('bell', 1, 0, 'bell'), growth: 3, stress: 2 }], 8);
    delete exposed.voyageRules;
    expect(resolveTide(exposed).state).toMatchObject({ status: 'won' });
  });

  it('pushes all six inner bearings outward on tide 5 in every rotated sea', () => {
    for (let rotation = 0; rotation < 6; rotation++) {
      const state = { ...arrangement([at('heart', 0, 0, 'heart'), ...DIRECTIONS.map((direction, i) => ({ ...at(`shore-${i}`, 0, 0), ...rotate(direction, rotation) }))], 5), currentRotation: rotation };
      const next = resolveTide(state);
      expect(next.moves).toHaveLength(6);
      expect(next.moves.every(move => !move.blocked)).toBe(true);
      for (const island of state.islands.slice(1)) {
        expect(getIslandStats(state, island.id).current).toEqual({ q: island.q, r: island.r });
        expect(next.state.islands.find(item => item.id === island.id)).toMatchObject({ q: 2 * island.q, r: 2 * island.r });
      }
      expect(next.state.islands[0]).toMatchObject({ q: 0, r: 0 });
    }
  });

  it('allows an anchor to hold an outward chain while the reef safely stops another island', () => {
    const state = arrangement([at('heart', 0, 0, 'heart'), at('bell', 1, 0, 'bell'), { ...at('barrier', 2, 0), anchored: true }, at('reef', -4, 0)], 5);
    const next = resolveTide(state);
    expect(next.moves.map(move => [move.id, move.blocked])).toEqual([['bell', true], ['reef', true]]);
    expect(next.state.islands.map(({ q, r }) => ({ q, r }))).toEqual(state.islands.map(({ q, r }) => ({ q, r })));
    expect(next.state.islands.find(island => island.id === 'barrier')?.anchored).toBe(false);
  });

  it('uses the actual tide 7 wind once, without applying current rotation a second time', () => {
    for (const seed of ['first-light', 'north-wind', 'the-small-sea', 'unexpected-socks']) {
      for (let currentRotation = 0; currentRotation < 6; currentRotation++) {
        const state = { ...arrangement([at('heart', 0, 0, 'heart'), at('bell', 2, 0, 'bell'), { ...at('anchor', -2, 1), anchored: true }], 7), seed, currentRotation };
        const direction = DIRECTIONS[getWeather(state).direction];
        expect(getIslandStats(state, 'bell').current).toEqual(direction);
        const next = resolveTide(state);
        expect(next.state.islands[1]).toMatchObject({ q: 2 + direction.q, r: direction.r });
        expect(next.state.islands[2]).toMatchObject({ q: -2, r: 1, anchored: false });
      }
    }
  });

  it('evaluates storm shelter after the crosscurrent and previews it without changing the voyage', () => {
    const state = arrangement([at('heart', 0, 0, 'heart'), at('bell', 2, -1, 'bell'), { ...at('shelter', 2, -2), anchored: true }], 7);
    const direction = DIRECTIONS[getWeather(state).direction];
    state.islands[2].q = state.islands[1].q - direction.q;
    state.islands[2].r = state.islands[1].r - direction.r;
    expect(getIslandStats(state, 'bell').sheltered).toBe(true);
    const before = JSON.stringify(state);
    const forecast = forecastTide(state);
    expect(forecast).toEqual(resolveTide(state));
    expect(JSON.stringify(state)).toBe(before);
    expect(forecast.shelteredIds).not.toContain('bell');
    expect(forecast.state.islands[1].stress).toBe(1);
  });
});

describe('ringing the bell through the final squall', () => {
  it('makes the previously solved opening lose if the player ignores every late tide', () => {
    const { state, history } = play(OLD_OPENING);
    expect(history[2].islands.find(island => island.id === 'bell')?.growth).toBe(3);
    expect(history[2].status).toBe('playing');
    expect(state.status).toBe('lost');
    expect(getVictoryConditions(state)).toMatchObject({ grown: true, connected: false, sheltered: false, ready: false });
  });

  it('lets the introductory harbour win by holding the bell through both late currents', () => {
    const { state, history } = play([...OLD_OPENING, [], [{ type: 'anchor', id: 'bell' }], [], [{ type: 'anchor', id: 'bell' }], []]);
    expect(history[4].islands.find(island => island.id === 'bell')).toMatchObject({ q: 1, r: -1 });
    expect(history[6].islands.find(island => island.id === 'bell')).toMatchObject({ q: 0, r: -1 });
    expect(state.status).toBe('won');
  });

  it('also wins by riding the late currents and reconnecting with an ordinary island that provides shelter', () => {
    const { state, history } = play([...OLD_OPENING, [], [], [], [], [
      { type: 'tow', id: 'garden-west', to: { q: -1, r: -1 } },
      { type: 'tow', id: 'garden-west', to: { q: 0, r: -1 } },
    ]]);
    expect(history[4].islands.find(island => island.id === 'bell')).toMatchObject({ q: 2, r: -2 });
    expect(history[6].islands.find(island => island.id === 'bell')).toMatchObject({ q: 0, r: -2 });
    expect(getVictoryConditions(history[6])).toMatchObject({ connected: false, sheltered: false });
    expect(state.islands.find(island => island.id === 'bell')).toMatchObject({ q: 0, r: -2, stress: 0 });
    expect(state.islands.find(island => island.id === 'garden-west')).toMatchObject({ q: 0, r: -1, building: 'garden' });
    expect(state.status).toBe('won');
  });

  it('requires a sheltered, recovered bell and resolves nourishment before deciding victory', () => {
    const direction = DIRECTIONS[getWeather({ ...createGame(), tide: 8 }).direction];
    const safe = arrangement([at('heart', 0, 0, 'heart'), { ...at('bell', direction.q, direction.r, 'bell'), growth: 2, nourished: true, stress: 3 }], 8);
    const result = resolveTide(safe);
    expect(result.state.islands[1]).toMatchObject({ growth: 3, nourished: false, stress: 2 });
    expect(result.state.status).toBe('won');
    expect(getVictoryConditions(result.state)).toMatchObject({ grown: true, connected: true, sheltered: true, rested: true, ready: true });
    const exhausted = { ...safe, islands: [safe.islands[0], { ...safe.islands[1], growth: 3, nourished: false, stress: 4 }] };
    expect(resolveTide(exhausted).state.status).toBe('lost');
    const exposed = { ...safe, islands: [safe.islands[0], { ...safe.islands[1], q: -direction.q, r: -direction.r, growth: 3, nourished: false, stress: 0 }] };
    const loss = resolveTide(exposed).state;
    expect(loss.islands[1].stress).toBe(2);
    expect(getVictoryConditions(loss)).toMatchObject({ connected: true, rested: true, sheltered: false, ready: false });
    expect(loss.status).toBe('lost');
  });
});
