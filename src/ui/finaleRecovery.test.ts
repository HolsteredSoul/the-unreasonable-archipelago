import { describe, expect, it } from 'vitest';
import { applyCommand, resolveTide } from '../game';
import { campaignSolution, createCampaignGame } from '../game/campaign';
import { finalTideCheckpoint, replanFinalTide } from './finaleRecovery';
import { validateSession, type SavedSession } from './storage';

const fresh = (): SavedSession => ({ version: 1, state: createCampaignGame(1), undo: [], seenIntro: true, campaignCompleted: 0, settings: { sound: false, reducedMotion: false, quality: 'high' } });

describe('first-map final tide replanning', () => {
  it('restores the exact start of tide 8, including resources and queued growth, after a saved defeat', () => {
    let session = fresh();
    for (let tide = 0; tide < 7; tide++) session = { ...session, state: resolveTide(session.state).state };
    const before = structuredClone(session.state);
    const command = { type: 'nourish' as const, id: 'bell' };
    const action = applyCommand(session.state, command);
    expect(action.error).toBeUndefined();
    session = { ...session, state: action.state, undo: [before] };
    const resolved = resolveTide(session.state).state;
    expect(resolved.status).toBe('lost');
    const completed = { ...session, state: resolved, undo: [], finaleCheckpoint: finalTideCheckpoint(session, resolved) };
    expect(validateSession(completed)).toBe(true);
    const restored = replanFinalTide(JSON.parse(JSON.stringify(completed)))!;
    expect(restored.state).toEqual(before);
    expect(restored.undo).toEqual([]);
    expect(restored.campaignCompleted).toBe(0);
    expect(validateSession(restored)).toBe(true);
  });

  it('offers no invented history for older losses, other maps, or wins', () => {
    const session = fresh();
    expect(replanFinalTide({ ...session, state: { ...session.state, tide: 8, status: 'lost', actions: 0 } })).toBeNull();
    expect(finalTideCheckpoint({ ...session, state: { ...session.state, campaignMap: 2, tide: 8 } }, { ...session.state, status: 'lost' })).toBeUndefined();
    let state = session.state;
    for (const commands of campaignSolution(1)) {
      for (const command of commands) state = applyCommand(state, command).state;
      state = resolveTide(state).state;
    }
    expect(finalTideCheckpoint({ ...session, state: { ...session.state, tide: 8 } }, state)).toBeUndefined();
  });

  it('rejects mismatched or invalid recovery snapshots', () => {
    let session = fresh();
    for (let tide = 0; tide < 7; tide++) session = { ...session, state: resolveTide(session.state).state };
    const checkpoint = session.state;
    const lost = { ...session, state: resolveTide(checkpoint).state, finaleCheckpoint: checkpoint };
    expect(validateSession(lost)).toBe(true);
    for (const patch of [{ tide: 7 }, { actions: 2 }, { campaignMap: 2 }, { seed: 'other-sea' }, { status: 'won' }, { voyageRules: undefined }]) {
      expect(validateSession({ ...lost, finaleCheckpoint: { ...checkpoint, ...patch } })).toBe(false);
    }
  });
});
