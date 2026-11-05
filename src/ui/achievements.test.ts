import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCommand, createGame, FIRST_LIGHT_SOLUTION, resolveTide } from '../game';
import { loadAchievements, recordVictory, saveAchievements, voyageRecordKey, legacyMedals } from './achievements';
import { createCampaignGame } from '../game/campaign';

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
    expect(records['free:first-light']).toEqual({ rank: 1, growth: 0 });
    state.islands.filter(island => island.kind === 'ordinary').slice(0, 2).forEach(island => { island.growth = 3; });
    records = recordVictory(records, state);
    expect(records['free:first-light']).toEqual({ rank: 3, growth: 6 });
    expect(recordVictory(records, victory())).toBe(records);
    const other = { ...state, seed: 'another-sea' };
    expect(Object.keys(recordVictory(records, other))).toHaveLength(2);
  });
  it('persists seed records and drops corrupt entries without losing valid ones', () => {
    const original = JSON.stringify({ good: { rank: 2, growth: 4 }, bad: { rank: 3, growth: 0 }, broken: null });
    const entries = new Map([['unreasonable-archipelago.medals.v1', original]]);
    vi.stubGlobal('localStorage', { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) });
    expect(loadAchievements()).toEqual({ 'free:good': { rank: 2, growth: 4 } });
    const records = recordVictory(loadAchievements(), victory());
    expect(saveAchievements(records)).toBe(true);
    expect(loadAchievements()).toEqual(records);
    expect(entries.get('unreasonable-archipelago.medals.v1')).toBe(original);
    entries.clear(); entries.set('unreasonable-archipelago.medals.v2', '{');
    expect(loadAchievements()).toEqual({});
  });
  it('keeps play possible when browser storage is blocked', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw Error('blocked'); }, setItem: () => { throw Error('blocked'); } });
    expect(loadAchievements()).toEqual({}); expect(saveAchievements({})).toBe(false);
  });
  it('isolates a literal campaign-looking free seed and retains ambiguous legacy credit', () => {
    const legacy = JSON.stringify({ 'campaign-map-3': { rank: 3, growth: 6 }, ordinary: { rank: 2, growth: 3 } });
    const entries = new Map([['unreasonable-archipelago.medals.v1', legacy]]);
    vi.stubGlobal('localStorage', { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) });
    const campaign = { ...createCampaignGame(3), status: 'won' as const };
    const free = { ...victory(), seed: 'campaign-map-3' };
    const imported = loadAchievements();
    expect(imported[voyageRecordKey(campaign)]).toBeUndefined();
    expect(imported[voyageRecordKey(free)]).toBeUndefined();
    expect(legacyMedals(imported)).toEqual({ 'legacy:campaign-map-3': { rank: 3, growth: 6 } });
    const records = recordVictory(recordVictory(imported, campaign), free);
    expect(voyageRecordKey(campaign)).toBe('campaign:3');
    expect(voyageRecordKey(free)).toBe('free:campaign-map-3');
    expect(saveAchievements(records)).toBe(true);
    expect(loadAchievements()).toEqual(records);
    expect(entries.get('unreasonable-archipelago.medals.v1')).toBe(legacy);
  });
  it('backs up damaged new records before replacement and refuses to overwrite an occupied recovery', () => {
    const entries = new Map([['unreasonable-archipelago.medals.v2', '{damaged']]);
    vi.stubGlobal('localStorage', { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) });
    expect(saveAchievements(recordVictory({}, victory()))).toBe(true);
    expect(entries.get('unreasonable-archipelago.medals.v2.recovery')).toBe('{damaged');
    entries.set('unreasonable-archipelago.medals.v2', '{different');
    expect(saveAchievements({})).toBe(false);
    expect(entries.get('unreasonable-archipelago.medals.v2')).toBe('{different');
  });
  it('retains the original partially damaged record while salvaging valid medals', () => {
    const original = JSON.stringify({ version: 2, records: { 'campaign:2': { rank: 2, growth: 4 }, 'campaign:3': { rank: 3, growth: 0 } } });
    const entries = new Map([['unreasonable-archipelago.medals.v2', original]]);
    vi.stubGlobal('localStorage', { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => entries.set(key, value) });
    const salvaged = loadAchievements();
    expect(salvaged).toEqual({ 'campaign:2': { rank: 2, growth: 4 } });
    expect(saveAchievements(salvaged)).toBe(true);
    expect(entries.get('unreasonable-archipelago.medals.v2.recovery')).toBe(original);
    expect(loadAchievements()).toEqual(salvaged);
  });
});
