import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCommand, createGame, resolveTide } from '../game';
import type { GameState } from '../game/types';
import { initialSession, persistSession, validateGameState, validateSession } from './storage';
import type { SavedSession } from './storage';

const session = (state: GameState, undo: GameState[] = []): SavedSession => ({ version: 1, state, undo, seenIntro: true, settings: { sound: false, quality: 'high', reducedMotion: false } });
afterEach(() => vi.unstubAllGlobals());

describe('late-voyage save compatibility', () => {
  it('resumes old saves without replacing their rules, geometry, or same-tide undo', () => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', { location: { search: '' }, matchMedia: () => ({ matches: false }) });
    vi.stubGlobal('localStorage', { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) });
    const legacy = createGame();
    delete legacy.voyageRules;
    legacy.tide = 5;
    const next = applyCommand(legacy, { type: 'tow', id: 'bell', to: { q: 2, r: -1 } });
    expect(next.error).toBeUndefined();
    const saved = session(next.state, [legacy]);
    expect(validateSession(saved)).toBe(true);
    expect(persistSession(saved)).toBe(true);
    const resumed = initialSession();
    expect(resumed).toEqual(saved);
    expect(resumed.state).not.toHaveProperty('voyageRules');
    expect(resolveTide(resumed.state).state.islands.find(island => island.id === 'bell')).toMatchObject({ q: 2, r: 0 });
  });

  it('rejects unknown rule versions and histories that switch rules during an undo', () => {
    const opening = createGame();
    for (const voyageRules of ['moonwake-v2', 'legacy', null, 1, ['moonwake']]) expect(validateGameState({ ...opening, voyageRules })).toBe(false);
    const next = applyCommand(opening, { type: 'nourish', id: 'bell' }).state;
    expect(validateSession(session(next, [opening]))).toBe(true);
    const legacyOpening = { ...opening };
    const legacyNext = { ...next };
    delete legacyOpening.voyageRules;
    delete legacyNext.voyageRules;
    expect(validateSession(session(legacyNext, [legacyOpening]))).toBe(true);
    expect(validateSession(session(next, [legacyOpening]))).toBe(false);
    expect(validateSession(session(legacyNext, [opening]))).toBe(false);
  });

  it('rejects new saves claiming victory with an exposed or exhausted bell while accepting legacy victories', () => {
    const claimed = createGame();
    claimed.tide = 8;
    claimed.actions = 0;
    claimed.status = 'won';
    const bell = claimed.islands.find(island => island.id === 'bell')!;
    Object.assign(bell, { q: 1, r: 1, growth: 3, stress: 0 });
    expect(validateGameState(claimed)).toBe(false);
    const legacy = { ...claimed };
    delete legacy.voyageRules;
    expect(validateGameState(legacy)).toBe(true);
    Object.assign(bell, { q: 0, r: -1, stress: 3 });
    expect(validateGameState(claimed)).toBe(false);
    bell.stress = 2;
    expect(validateSession(session(claimed))).toBe(true);
  });
});
