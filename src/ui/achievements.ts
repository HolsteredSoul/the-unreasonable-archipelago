import type { GameState } from '../game/types';

export type Medal = { rank: 1 | 2 | 3; growth: number };
export type Achievements = Record<string, Medal>;
const LEGACY_KEY = 'unreasonable-archipelago.medals.v1';
const KEY = 'unreasonable-archipelago.medals.v2';
export const medalName = (rank: number) => rank === 3 ? 'Unreasonably splendid' : rank === 2 ? 'Thriving town' : 'Safe harbour';
export function growthTotal(state: GameState): number {
  return state.islands.filter(island => island.kind === 'ordinary').reduce((total, island) => total + island.growth, 0);
}
export const voyageRecordKey = (state: Pick<GameState, 'campaignMap' | 'seed'>): string => state.campaignMap ? `campaign:${state.campaignMap}` : `free:${state.seed}`;
export const legacyMedals = (records: Achievements): Achievements => Object.fromEntries(Object.entries(records).filter(([key]) => key.startsWith('legacy:')));
export function recordVictory(records: Achievements, state: GameState): Achievements {
  if (state.status !== 'won') return records;
  const growth = growthTotal(state);
  const key = voyageRecordKey(state);
  if (Object.hasOwn(records, key) && records[key].growth >= growth) return records;
  return { ...records, [key]: { rank: growth >= 6 ? 3 : growth >= 3 ? 2 : 1, growth } };
}
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const validMedal = (value: unknown): value is Medal => record(value) && typeof value.growth === 'number' && Number.isInteger(value.growth) && value.growth >= 0 && value.growth <= 24 && value.rank === (value.growth >= 6 ? 3 : value.growth >= 3 ? 2 : 1);
const validKey = (key: string) => /^campaign:[1-8]$/.test(key) || /^legacy:campaign-map-[1-8]$/.test(key) || (key.startsWith('free:') && key.length > 5 && key.length <= 105);
function parse(raw: string | null): unknown {
  if (!raw || raw.length > 300000) return null;
  try { return JSON.parse(raw); } catch { return null; }
}
export function loadAchievements(): Achievements {
  const records: Achievements = {};
  try {
    const legacy = parse(localStorage.getItem(LEGACY_KEY));
    if (record(legacy)) for (const [seed, medal] of Object.entries(legacy)) {
      if (!seed.length || seed.length > 100 || !validMedal(medal)) continue;
      // These old keys could describe either a campaign map or a literal free seed.
      // Retain the earned result without inventing which voyage earned it.
      const key = /^campaign-map-[1-8]$/.test(seed) ? `legacy:${seed}` : `free:${seed}`;
      records[key] = medal;
    }
    const saved = parse(localStorage.getItem(KEY));
    if (record(saved) && saved.version === 2 && record(saved.records)) for (const [key, medal] of Object.entries(saved.records)) {
      if (validKey(key) && validMedal(medal) && (!Object.hasOwn(records, key) || records[key].growth < medal.growth)) records[key] = medal;
    }
  } catch { /* Unavailable storage must not prevent a voyage. */ }
  return records;
}
export function saveAchievements(records: Achievements): boolean {
  try {
    const current = localStorage.getItem(KEY);
    const parsed = parse(current);
    if (current !== null && (!record(parsed) || parsed.version !== 2 || !record(parsed.records) || Object.entries(parsed.records).some(([key, medal]) => !validKey(key) || !validMedal(medal)))) {
      const backupKey = `${KEY}.recovery`;
      const backup = localStorage.getItem(backupKey);
      if (backup !== null && backup !== current) return false;
      if (backup === null) localStorage.setItem(backupKey, current);
    }
    const clean = Object.fromEntries(Object.entries(records).filter(([key, medal]) => validKey(key) && validMedal(medal)));
    localStorage.setItem(KEY, JSON.stringify({ version: 2, records: clean }));
    return true;
  } catch { return false; }
}
