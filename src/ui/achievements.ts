import type { GameState } from '../game/types';

export type Medal = { rank: 1 | 2 | 3; growth: number };
export type Achievements = Record<string, Medal>;
const KEY = 'unreasonable-archipelago.medals.v1';
export const medalName = (rank: number) => rank === 3 ? 'Unreasonably splendid' : rank === 2 ? 'Thriving town' : 'Safe harbour';
export function growthTotal(state: GameState): number {
  return state.islands.filter(island => island.kind === 'ordinary').reduce((total, island) => total + island.growth, 0);
}
export const voyageRecordKey = (state: GameState): string => state.campaignMap ? `campaign-map-${state.campaignMap}` : state.seed;
export function recordVictory(records: Achievements, state: GameState): Achievements {
  if (state.status !== 'won') return records;
  const growth = growthTotal(state);
  const key = voyageRecordKey(state);
  if (Object.hasOwn(records, key) && records[key].growth >= growth) return records;
  return { ...records, [key]: { rank: growth >= 6 ? 3 : growth >= 3 ? 2 : 1, growth } };
}
export function loadAchievements(): Achievements {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw || raw.length > 300000) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).filter(([seed, value]) => seed.length > 0 && seed.length <= 100 && value && Number.isInteger(value.growth) && value.growth >= 0 && value.growth <= 24 && value.rank === (value.growth >= 6 ? 3 : value.growth >= 3 ? 2 : 1)));
  } catch { return {}; }
}
export function saveAchievements(records: Achievements): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(records)); return true; } catch { return false; }
}
