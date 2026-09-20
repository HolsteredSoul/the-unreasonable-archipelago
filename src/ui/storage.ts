import { BOARD_RADIUS, createGame, getActionBudget, getVictoryConditions } from '../game';
import type { GameState, Island } from '../game/types';

export type Settings = { sound: boolean; reducedMotion: boolean; quality: 'high' | 'low'; seaFocus?: boolean; musicVolume?: number; effectsVolume?: number; musicEnabled?: boolean };
export type SavedSession = { version: 1; state: GameState; undo: GameState[]; settings: Settings; seenIntro: boolean; campaignCompleted?: number; finaleCheckpoint?: GameState };
const SAVE_KEY = 'unreasonable-archipelago.session.v1';
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown, min: number, max: number): value is number => typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
const text = (value: unknown, max: number): value is string => typeof value === 'string' && value.length > 0 && value.length <= max;

function validIsland(value: unknown): value is Island {
  if (!record(value) || !text(value.id, 100) || !text(value.name, 150)) return false;
  if (typeof value.kind !== 'string' || !['heart', 'bell', 'ordinary'].includes(value.kind)) return false;
  if (value.building !== null && (typeof value.building !== 'string' || !['garden', 'grove', 'breakwater'].includes(value.building))) return false;
  if (value.kind !== 'ordinary' && value.building !== null) return false;
  if (!integer(value.q, -BOARD_RADIUS, BOARD_RADIUS) || !integer(value.r, -BOARD_RADIUS, BOARD_RADIUS) || Math.abs(value.q + value.r) > BOARD_RADIUS) return false;
  if (!integer(value.growth, 0, 3) || !integer(value.stress, 0, 5) || typeof value.nourished !== 'boolean' || typeof value.anchored !== 'boolean') return false;
  if (value.kind === 'heart' && (value.id !== 'heart' || value.q !== 0 || value.r !== 0 || value.growth !== 0 || value.nourished)) return false;
  return value.kind !== 'bell' || /^bell(?:-[2-4])?$/.test(value.id);
}

export function validateGameState(value: unknown): value is GameState {
  if (!record(value) || value.version !== 1 || !text(value.seed, 100)) return false;
  if (value.campaignMap !== undefined && !integer(value.campaignMap, 1, 8)) return false;
  const chapter = typeof value.campaignMap === 'number' ? Math.floor((value.campaignMap - 1) / 2) : 0;
  const actionBudget = 3 + chapter;
  if (value.maxTides !== 8 || !integer(value.tide, 1, value.maxTides) || !integer(value.food, 0, 100000) || !integer(value.timber, 0, 100000)) return false;
  if (!integer(value.integrity, 0, 5) || !integer(value.actions, 0, actionBudget) || typeof value.status !== 'string' || !['playing', 'won', 'lost'].includes(value.status)) return false;
  if (!Array.isArray(value.islands) || value.islands.length !== 7 + chapter * 2 || !value.islands.every(validIsland)) return false;
  if (value.islands.filter(island => island.kind === 'heart').length !== 1 || value.islands.filter(island => island.kind === 'bell').length !== 1 + chapter) return false;
  if (!Array.from({ length: chapter + 1 }, (_, index) => index === 0 ? 'bell' : `bell-${index + 1}`).every(id => (value.islands as Island[]).some(island => island.id === id && island.kind === 'bell'))) return false;
  if (new Set(value.islands.map(island => island.id)).size !== value.islands.length || new Set(value.islands.map(island => `${island.q},${island.r}`)).size !== value.islands.length) return false;
  if (value.currentRotation !== undefined && !integer(value.currentRotation, 0, 5)) return false;
  if (value.voyageRules !== undefined && value.voyageRules !== 'moonwake') return false;
  if (value.campaignMap !== undefined && value.voyageRules !== 'moonwake') return false;
  if (value.whaleTowedId !== undefined && value.whaleTowedId !== null && (!text(value.whaleTowedId, 100) || ![2, 5, 7].includes(value.tide) || value.status !== 'playing' || value.actions === actionBudget || !value.islands.some(island => island.id === value.whaleTowedId && island.kind !== 'heart'))) return false;
  if (!Array.isArray(value.log) || value.log.length > 1000 || !value.log.every(item => typeof item === 'string' && item.length <= 1000)) return false;
  if (value.status === 'playing' && value.integrity === 0) return false;
  if (value.status !== 'playing' && value.actions !== 0) return false;
  if (value.status === 'won') {
    if (value.tide !== value.maxTides || !getVictoryConditions(value as unknown as GameState).ready) return false;
  }
  if (value.status === 'lost' && value.integrity > 0 && value.tide !== value.maxTides) return false;
  return true;
}

export function validateSession(value: unknown): value is SavedSession {
  if (!record(value) || value.version !== 1 || !validateGameState(value.state) || !Array.isArray(value.undo) || value.undo.length > getActionBudget(value.state)) return false;
  if (value.campaignCompleted !== undefined && !integer(value.campaignCompleted, 0, 8)) return false;
  const state = value.state;
  const budget = getActionBudget(state);
  if (value.finaleCheckpoint !== undefined) {
    const checkpoint = value.finaleCheckpoint;
    if (!validateGameState(checkpoint) || state.campaignMap !== 1 || state.status !== 'lost' || state.tide !== 8 || checkpoint.campaignMap !== 1 || checkpoint.status !== 'playing' || checkpoint.tide !== 8 || checkpoint.actions !== budget || checkpoint.seed !== state.seed || checkpoint.voyageRules !== state.voyageRules || checkpoint.currentRotation !== state.currentRotation) return false;
  }
  if (state.status === 'playing' && value.undo.length !== budget - state.actions) return false;
  if (!value.undo.every((snapshot, index) => validateGameState(snapshot) && snapshot.campaignMap === state.campaignMap && snapshot.seed === state.seed && snapshot.tide === state.tide && snapshot.integrity === state.integrity && snapshot.status === 'playing' && snapshot.actions === budget - index && snapshot.actions > state.actions)) return false;
  if (value.undo.length > 0 && state.status !== 'playing') return false;
  if (!value.undo.every(snapshot => ((snapshot as GameState).currentRotation ?? 0) === (state.currentRotation ?? 0))) return false;
  if (!value.undo.every(snapshot => (snapshot as GameState).voyageRules === state.voyageRules)) return false;
  const history = [...value.undo as GameState[], state];
  if (history.some((snapshot, index) => index > 0 && history[index - 1].whaleTowedId && history[index - 1].whaleTowedId !== snapshot.whaleTowedId)) return false;
  if (!record(value.settings) || typeof value.settings.sound !== 'boolean' || typeof value.settings.reducedMotion !== 'boolean' || typeof value.settings.quality !== 'string' || !['high', 'low'].includes(value.settings.quality) || typeof value.seenIntro !== 'boolean') return false;
  if (value.settings.seaFocus !== undefined && typeof value.settings.seaFocus !== 'boolean') return false;
  if (value.settings.musicEnabled !== undefined && typeof value.settings.musicEnabled !== 'boolean') return false;
  for (const key of ['musicVolume', 'effectsVolume']) {
    const amount = value.settings[key];
    if (amount !== undefined && (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 1)) return false;
  }
  return true;
}

export function initialSession(): SavedSession {
  const urlSeed = new URLSearchParams(window.location.search).get('seed')?.trim().slice(0, 100) || undefined;
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw && raw.length < 250000) {
      const parsed: unknown = JSON.parse(raw);
      if (validateSession(parsed)) {
        if (!urlSeed || parsed.state.seed === urlSeed) return parsed;
        return { ...parsed, state: createGame(urlSeed), undo: [], seenIntro: true, finaleCheckpoint: undefined };
      }
    }
  } catch { /* A blocked or damaged local save must never prevent play. */ }
  return {
    version: 1, state: createGame(urlSeed), undo: [], seenIntro: !!urlSeed,
    settings: { sound: true, musicEnabled: true, musicVolume: 0.35, effectsVolume: 0.8, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches, quality: 'high' },
  };
}

export function persistSession(session: SavedSession): boolean {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(session)); return true; } catch { return false; }
}

export function updateSeedUrl(seed: string): void {
  const url = new URL(window.location.href);
  if (seed) url.searchParams.set('seed', seed);
  else url.searchParams.delete('seed');
  window.history.replaceState(null, '', url);
}
