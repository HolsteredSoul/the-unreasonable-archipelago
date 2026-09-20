import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCommand, createGame, FIRST_LIGHT_SOLUTION, resolveTide } from '../game';
import type { GameState } from '../game/types';
import { initialSession, persistSession, validateGameState, validateSession } from './storage';
import type { SavedSession } from './storage';

const session = (state = createGame()): SavedSession => ({
  version: 1, state, undo: [], seenIntro: true,
  settings: { sound: false, reducedMotion: false, quality: 'high' },
});
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

function browserStorage(search = '') {
  const entries = new Map<string, string>();
  vi.stubGlobal('window', { location: { search }, matchMedia: () => ({ matches: false }) });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
  });
  return entries;
}
afterEach(() => vi.unstubAllGlobals());

describe('saved game validation', () => {
  it('accepts the real introductory game and every resolved state of seeded voyages', () => {
    for (let seed = 0; seed < 40; seed++) {
      let state = createGame(seed === 0 ? 'first-light' : `saved-sea-${seed}`);
      expect(validateGameState(clone(state))).toBe(true);
      expect(validateSession(clone(session(state)))).toBe(true);
      for (let tide = 0; tide < 8; tide++) {
        state = resolveTide(state).state;
        expect(validateGameState(clone(state))).toBe(true);
      }
    }
  });

  it('accepts capped stress and the inherently fixed Heart without a temporary anchor', () => {
    const state = createGame();
    expect(state.islands.find(island => island.kind === 'heart')?.anchored).toBe(false);
    state.islands.find(island => island.kind === 'bell')!.stress = 5;
    expect(validateGameState(state)).toBe(true);
  });

  it('accepts a complete winning save made through actual game commands', () => {
    let state = createGame();
    for (const commands of FIRST_LIGHT_SOLUTION) {
      for (const command of commands) state = applyCommand(state, command).state;
      state = resolveTide(state).state;
    }
    expect(state.status).toBe('won');
    expect(validateSession(clone(session(state)))).toBe(true);
  });

  it('rejects malformed numbers, geometry, roster, and resource fields', () => {
    const mutations: ((value: GameState) => void)[] = [
      value => { value.food = -1; },
      value => { value.food = Number.NaN; },
      value => { value.timber = Infinity; },
      value => { value.actions = 1.5; },
      value => { value.tide = 0; },
      value => { value.tide = 9; },
      value => { value.integrity = 6; },
      value => { value.seed = ''; },
      value => { value.islands[1].growth = 4; },
      value => { value.islands[1].stress = 6; },
      value => { value.islands[1].q = 4; value.islands[1].r = 4; },
      value => { value.islands[1].q = 1.5; },
      value => { value.islands[1].q = value.islands[0].q; value.islands[1].r = value.islands[0].r; },
      value => { value.islands[1].id = value.islands[0].id; },
      value => { value.islands[1].kind = 'ordinary'; },
      value => { value.islands[1].building = 'garden'; },
      value => { value.islands.pop(); },
    ];
    for (const mutate of mutations) {
      const state = createGame();
      mutate(state);
      expect(validateGameState(state)).toBe(false);
    }
    for (const invalid of [null, undefined, [], {}, 1, 'saved']) expect(validateGameState(invalid)).toBe(false);
  });

  it('rejects coercible enum arrays instead of resuming an unusable game', () => {
    for (const field of ['status', 'kind', 'building', 'quality']) {
      const value = clone(session()) as unknown as Record<string, any>;
      if (field === 'status') value.state.status = ['playing'];
      if (field === 'kind') value.state.islands[2].kind = ['ordinary'];
      if (field === 'building') value.state.islands[2].building = ['garden'];
      if (field === 'quality') value.settings.quality = ['high'];
      expect(validateSession(value)).toBe(false);
    }
  });

  it('accepts and restores only same-tide undo history with descending action counts', () => {
    let saved = session();
    for (const command of FIRST_LIGHT_SOLUTION[0]) {
      const next = applyCommand(saved.state, command);
      expect(next.error).toBeUndefined();
      saved = { ...saved, state: next.state, undo: [...saved.undo, saved.state] };
      expect(validateSession(clone(saved))).toBe(true);
    }
    const invalidHistory = [
      { ...saved, undo: [...saved.undo].reverse() },
      { ...saved, undo: [...saved.undo, saved.state] },
      { ...saved, undo: saved.undo.map((state, index) => index === 0 ? { ...state, tide: 2 } : state) },
      { ...saved, undo: saved.undo.map((state, index) => index === 0 ? { ...state, seed: 'another-sea' } : state) },
      { ...saved, state: resolveTide(saved.state).state },
    ];
    for (const invalid of invalidHistory) expect(validateSession(invalid)).toBe(false);
    while (saved.undo.length) {
      saved = { ...saved, state: saved.undo[saved.undo.length - 1], undo: saved.undo.slice(0, -1) };
      expect(validateSession(saved)).toBe(true);
    }
    expect(saved.state).toEqual(createGame());
  });
});

describe('local persistence recovery', () => {
  it('roundtrips a real save including planning actions and undo', () => {
    browserStorage();
    const before = createGame();
    const state = applyCommand(before, FIRST_LIGHT_SOLUTION[0][0]).state;
    const saved: SavedSession = { ...session(state), undo: [before] };
    expect(persistSession(saved)).toBe(true);
    expect(initialSession()).toEqual(saved);
  });

  it('starts a fresh voyage after damaged JSON or invalid saved data', () => {
    const entries = browserStorage();
    persistSession(session());
    const saveKey = [...entries.keys()][0];
    for (const damaged of ['{not json', '{}', JSON.stringify({ ...session(), state: { invalid: true } })]) {
      entries.set(saveKey, damaged);
      const restored = initialSession();
      expect(restored.state).toEqual(createGame());
      expect(restored.undo).toEqual([]);
      expect(restored.seenIntro).toBe(false);
    }
  });

  it('honors a different shared seed and preserves settings without carrying old undo', () => {
    browserStorage('?seed=new-sea');
    const saved = session();
    saved.settings.sound = true;
    persistSession(saved);
    const loaded = initialSession();
    expect(loaded.state).toEqual(createGame('new-sea'));
    expect(loaded.undo).toEqual([]);
    expect(loaded.settings.sound).toBe(true);
  });

  it('continues safely when browser storage is unavailable', () => {
    browserStorage();
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('Storage blocked'); },
      setItem: () => { throw new Error('Storage blocked'); },
    });
    expect(persistSession(session())).toBe(false);
    expect(initialSession().state).toEqual(createGame());
  });
});
