import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCommand, createGame, forecastTide, getIslandStats, getWhaleEncounter, resolveTide } from '../game';
import type { GameState } from '../game/types';
import { initialSession, persistSession, validateGameState, validateSession } from './storage';
import type { SavedSession } from './storage';

const saved = (state = createGame('first-light')): SavedSession => ({
  version: 1, state, undo: [], seenIntro: true,
  settings: { sound: true, reducedMotion: false, quality: 'high' },
});

function browserStorage(seed = '') {
  const entries = new Map<string, string>();
  vi.stubGlobal('window', { location: { search: seed ? `?seed=${encodeURIComponent(seed)}` : '' }, matchMedia: () => ({ matches: false }) });
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
  });
}

function whalePlan(): SavedSession {
  const before = resolveTide(createGame('saved-whale-current')).state;
  const offer = getWhaleEncounter(before)!.offers[0];
  if (!offer) throw new Error('The test voyage needs one legal whale offer.');
  const towed = applyCommand(before, { type: 'whaleTow', id: offer.id });
  if (towed.error) throw new Error(towed.error);
  const anchored = applyCommand(towed.state, { type: 'anchor', id: offer.id });
  if (anchored.error) throw new Error(anchored.error);
  return { ...saved(anchored.state), undo: [before, towed.state] };
}

afterEach(() => vi.unstubAllGlobals());

describe('roadmap save compatibility', () => {
  it('resumes an old named seed with its saved fixed geometry and unrotated currents', () => {
    const legacy: GameState = { ...createGame('first-light'), seed: 'legacy-sea-before-generation' };
    delete legacy.currentRotation;
    delete legacy.whaleTowedId;
    browserStorage(legacy.seed);
    const session = saved(legacy);
    expect(validateSession(session)).toBe(true);
    expect(persistSession(session)).toBe(true);
    const loaded = initialSession();
    expect(loaded).toEqual(session);
    expect(loaded.state.currentRotation).toBeUndefined();
    expect(loaded.state.whaleTowedId).toBeUndefined();
    expect(loaded.state.islands.find(island => island.id === 'bell')).toMatchObject({ q: 3, r: -1 });
    expect(getIslandStats(loaded.state, 'bell').current).toEqual({ q: 0, r: 1 });
    expect(createGame(legacy.seed).islands.map(({ q, r }) => [q, r])).not.toEqual(legacy.islands.map(({ q, r }) => [q, r]));
  });

  it('roundtrips generated currents, a spent whale visit, following actions, and both undo snapshots', () => {
    const session = whalePlan();
    browserStorage(session.state.seed);
    expect(session.state.currentRotation).toBeDefined();
    expect(validateSession(session)).toBe(true);
    expect(persistSession(session)).toBe(true);
    const loaded = initialSession();
    expect(loaded).toEqual(session);
    expect(forecastTide(loaded.state)).toEqual(forecastTide(session.state));
    expect(getWhaleEncounter(loaded.state)!.used).toBe(true);
    const afterUndoAnchor = { ...loaded, state: loaded.undo[1], undo: [loaded.undo[0]] };
    expect(validateSession(afterUndoAnchor)).toBe(true);
    expect(getWhaleEncounter(afterUndoAnchor.state)!.used).toBe(true);
    const afterUndoWhale = { ...loaded, state: loaded.undo[0], undo: [] };
    expect(validateSession(afterUndoWhale)).toBe(true);
    expect(getWhaleEncounter(afterUndoWhale.state)!.used).toBe(false);
    const replayed = applyCommand(afterUndoWhale.state, { type: 'whaleTow', id: session.state.whaleTowedId! });
    expect(replayed.state).toEqual(session.undo[1]);
  });

  it('rejects invalid or mixed current rotations, while treating legacy omission as rotation zero', () => {
    for (const value of [-1, 6, 1.2, NaN, Infinity, '2', null, [], true]) {
      expect(validateGameState({ ...createGame(), currentRotation: value })).toBe(false);
    }
    const session = whalePlan();
    const mixed = structuredClone(session);
    mixed.undo[0].currentRotation = ((mixed.state.currentRotation ?? 0) + 1) % 6;
    expect(validateSession(mixed)).toBe(false);
    const before: GameState = { ...createGame(), currentRotation: 0 };
    const after = applyCommand(before, { type: 'nourish', id: 'bell' }).state;
    delete before.currentRotation;
    expect(validateSession({ ...saved(after), undo: [before] })).toBe(true);
  });

  it('rejects impossible whale markers and same-tide histories that clear or change a used favour', () => {
    const source = whalePlan();
    for (const marker of ['heart', 'missing', '', false, [], {}]) {
      expect(validateGameState({ ...source.state, whaleTowedId: marker })).toBe(false);
    }
    expect(validateGameState({ ...source.state, tide: 3 })).toBe(false);
    expect(validateGameState({ ...source.state, actions: 3 })).toBe(false);
    expect(validateGameState({ ...source.state, status: 'lost', integrity: 0, actions: 0 })).toBe(false);
    const cleared = structuredClone(source);
    cleared.state.whaleTowedId = null;
    expect(validateSession(cleared)).toBe(false);
    const changed = structuredClone(source);
    changed.state.whaleTowedId = changed.state.islands.find(island => island.kind === 'ordinary' && island.id !== source.state.whaleTowedId)!.id;
    expect(validateSession(changed)).toBe(false);
  });
});

describe('independent music and effects preferences', () => {
  it('roundtrips separate levels and sea-focus preferences without changing legacy sound settings', () => {
    browserStorage();
    const session = saved();
    session.settings = { ...session.settings, musicEnabled: false, musicVolume: 0.73, effectsVolume: 0.12, seaFocus: true };
    expect(validateSession(session)).toBe(true);
    expect(persistSession(session)).toBe(true);
    expect(initialSession().settings).toEqual(session.settings);
    for (const musicVolume of [0, 1]) {
      expect(validateSession({ ...session, settings: { ...session.settings, musicVolume, effectsVolume: 1 - musicVolume } })).toBe(true);
    }
    expect(validateSession(saved())).toBe(true);
  });

  it('rejects invalid volume values and coercible toggle values', () => {
    for (const key of ['musicVolume', 'effectsVolume']) {
      for (const value of [-0.01, 1.01, NaN, Infinity, '0.5', null, []]) {
        const session = saved();
        expect(validateSession({ ...session, settings: { ...session.settings, [key]: value } })).toBe(false);
      }
    }
    for (const key of ['musicEnabled', 'seaFocus']) {
      for (const value of [1, 'true', null, []]) {
        const session = saved();
        expect(validateSession({ ...session, settings: { ...session.settings, [key]: value } })).toBe(false);
      }
    }
  });
});
