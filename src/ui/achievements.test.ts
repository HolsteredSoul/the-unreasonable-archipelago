import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCommand, createGame, FIRST_LIGHT_SOLUTION, resolveTide } from '../game';
import { loadAchievements, recordVictory, saveAchievements } from './achievements';

function victory() {
  let state = createGame('first-light');
  for (const commands of FIRST_LIGHT_SOLUTION) {
    for (const command of commands) state = applyCommand(state, command).state;
    state = resolveTide(state).state;
  }
  return state;
}
afterEach(() => vi.unstubAllGlobals());
describe('voyage achievements', () => {
  it('awards only completed wins and never overwrites a higher result', () => {
    expect(recordVictory({}, createGame())).toEqual({});
    const state = victory();
    let records = recordVictory({}, state);
    expect(records['first-light']).toEqual({ rank: 1, growth: 0 });
    state.islands.filter(island => island.kind === 'ordinary').slice(0, 2).forEach(island => { island.growth = 3; });
    records = recordVictory(records, state);
    expect(records['first-light']).toEqual({ rank: 3, growth: 6 });
    expect(recordVictory(records, victory())).toBe(records);
    const other = { ...state, seed: 'another-sea' };
    expect(Object.keys(recordVictory(records, other))).toHaveLength(2);
  });
  it('persists seed records and drops corrupt entries without losing valid ones', () => {
    let raw = JSON.stringify({ good: { rank: 2, growth: 4 }, bad: { rank: 3, growth: 0 }, broken: null });
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } });
    expect(loadAchievements()).toEqual({ good: { rank: 2, growth: 4 } });
    const records = recordVictory(loadAchievements(), victory());
    expect(saveAchievements(records)).toBe(true);
    expect(loadAchievements()).toEqual(records);
    raw = '{'; expect(loadAchievements()).toEqual({});
  });
  it('keeps play possible when browser storage is blocked', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } });
    expect(loadAchievements()).toEqual({}); expect(saveAchievements({})).toBe(false);
  });
});
