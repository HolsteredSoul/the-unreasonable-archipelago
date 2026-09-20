import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyCommand, createGame, getActionBudget, resolveTide } from '../game';
import { campaignSolution, createCampaignGame } from '../game/campaign';
import { recordCampaignWin, lossExplanation } from './campaignProgress';
import { recordVictory, voyageRecordKey } from './achievements';
import { initialSession, persistSession, validateGameState, validateSession, type SavedSession } from './storage';

const session = (map: number): SavedSession => ({ version: 1, state: createCampaignGame(map), undo: [], seenIntro: true, campaignCompleted: map - 1, settings: { sound: false, reducedMotion: true, quality: 'low' } });
afterEach(() => vi.unstubAllGlobals());

describe('campaign saves and progression', () => {
  it('keeps campaign medals separate from procedural voyages with the same seed', () => {
    const campaign = { ...createCampaignGame(3), status: 'won' as const };
    const free = { ...createGame(campaign.seed), status: 'won' as const };
    const records = recordVictory(recordVictory({}, campaign), free);
    expect(voyageRecordKey(campaign)).not.toBe(voyageRecordKey(free));
    expect(Object.keys(records)).toHaveLength(2);
  });

  it('explains the rules of a legacy defeat without introducing final shelter', () => {
    const old = { ...createGame(), voyageRules: undefined, status: 'lost' as const };
    expect(lossExplanation(old)).toContain('original rules');
    expect(lossExplanation(old)).not.toContain('shelter');
    expect(lossExplanation({ ...old, voyageRules: 'moonwake' })).toContain('shelter');
  });

  it('saves every command, restores every tide, and unlocks each map exactly once', () => {
    let raw: string | null = null;
    vi.stubGlobal('localStorage', { getItem: () => raw, setItem: (_key: string, value: string) => { raw = value; } });
    vi.stubGlobal('window', { location: { search: '' }, matchMedia: () => ({ matches: false }) });
    for (let map = 1; map <= 8; map++) {
      let saved = session(map);
      for (const commands of campaignSolution(map)) {
        for (const command of commands) {
          const next = applyCommand(saved.state, command);
          expect(next.error).toBeUndefined();
          saved = { ...saved, state: next.state, undo: [...saved.undo, saved.state] };
          expect(validateSession(saved), `map ${map}, tide ${saved.state.tide}`).toBe(true);
          expect(persistSession(saved)).toBe(true);
          expect(initialSession()).toEqual(saved);
          const last = saved.undo.at(-1)!;
          expect(validateSession({ ...saved, state: last, undo: saved.undo.slice(0, -1) })).toBe(true);
        }
        const next = resolveTide(saved.state).state;
        saved = { ...saved, state: next, undo: [], campaignCompleted: recordCampaignWin(saved.campaignCompleted!, next) };
        expect(validateSession(saved)).toBe(true);
        if (next.status === 'playing') expect(next.actions).toBe(getActionBudget(next));
        persistSession(saved);
        expect(initialSession()).toEqual(saved);
      }
      expect(saved.campaignCompleted).toBe(map);
      expect(recordCampaignWin(map, saved.state)).toBe(map);
      expect(recordCampaignWin(0, { ...saved.state, campaignMap: 8 })).toBe(0);
    }
  });

  it('does not unlock maps for defeat, unfinished voyages, or free voyages', () => {
    expect(recordCampaignWin(0, createCampaignGame(1))).toBe(0);
    expect(recordCampaignWin(0, { ...createCampaignGame(1), status: 'lost' })).toBe(0);
    expect(recordCampaignWin(0, { ...createGame(), status: 'won' })).toBe(0);
    expect(recordCampaignWin(4, { ...createCampaignGame(2), status: 'won' })).toBe(4);
  });

  it('rejects campaign metadata, rosters, and cross-map undo that cannot occur', () => {
    for (const campaignMap of [0, 9, 1.5, NaN]) expect(validateGameState({ ...createCampaignGame(1), campaignMap })).toBe(false);
    for (const campaignCompleted of [-1, 9, 1.5, NaN]) expect(validateSession({ ...session(1), campaignCompleted })).toBe(false);
    expect(validateGameState({ ...createCampaignGame(8), campaignMap: undefined })).toBe(false);
    expect(validateGameState({ ...createCampaignGame(1), campaignMap: 8 })).toBe(false);
    expect(validateGameState({ ...createCampaignGame(8), voyageRules: undefined })).toBe(false);
    const saved = session(8);
    const next = applyCommand(saved.state, campaignSolution(8)[0][0]).state;
    expect(validateSession({ ...saved, state: next, undo: [{ ...saved.state, campaignMap: 7 }] })).toBe(false);
    expect(validateGameState({ ...saved.state, actions: 7 })).toBe(false);
  });
});
