import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, forecastTide, resolveTide } from './index';
import { getFinaleAdvice } from './finaleAdvice';
import type { GameState, Island } from './types';

const at = (id: string, q: number, r: number, kind: Island['kind'] = 'ordinary'): Island => ({ id, name: id, q, r, kind, building: null, growth: kind === 'bell' ? 3 : 0, stress: 0, nourished: false, anchored: false });
const finale = (...islands: Island[]): GameState => ({ ...createGame(), tide: 8, islands: [at('heart', 0, 0, 'heart'), ...islands] });

describe('final-tide advice', () => {
  it('explains why a grown, connected bell can lose with a healthy Heart', () => {
    const state = finale({ ...at('bell', 1, -1, 'bell'), stress: 1 });
    const [advice] = getFinaleAdvice(state);
    expect(advice).toMatchObject({ grown: true, connected: true, sheltered: false, rested: false, stress: 1, forecastStress: 3, upstream: { q: 1, r: 0 }, upstreamDirection: 'Southeast' });
    expect(advice.hint).toContain('will not ring');
    expect(advice.hint).toContain('Anchoring stops drift, not the storm.');
    expect(forecastTide(state).state).toMatchObject({ status: 'lost', integrity: 5 });
  });

  it.each([[2, 1, true], [4, 3, false]])('checks recovered stress %i → %i before deciding readiness', (stress, forecastStress, rested) => {
    const [advice] = getFinaleAdvice(finale({ ...at('bell', 0, -1, 'bell'), stress }));
    expect(advice).toMatchObject({ sheltered: true, stress, forecastStress, rested });
    expect(advice.hint).toContain(rested ? 'is ready to ring' : 'one tide of recovery is not enough');
    if (!rested) expect(advice.rescue).toBeUndefined();
  });

  it('offers a legal, fully verified bell tow with its direction and cost', () => {
    const state = finale(at('bell', 1, -1, 'bell'));
    const [advice] = getFinaleAdvice(state);
    expect(advice.rescue).toEqual({ type: 'tow', id: 'bell', to: { q: 0, r: -1 } });
    expect(advice.hint).toContain('Tow bell West to (0, -1): 1 action + 1 food');
    expect(forecastTide(applyCommand(state, advice.rescue!).state).state.status).toBe('won');
  });

  it('can rescue the bell by towing an ordinary island into its upstream shelter hex', () => {
    const state = finale(at('bell', 1, 0, 'bell'), at('shelter', 2, 1));
    const [advice] = getFinaleAdvice(state);
    expect(advice.rescue).toEqual({ type: 'tow', id: 'shelter', to: { q: 1, r: 1 } });
    expect(forecastTide(applyCommand(state, advice.rescue!).state).state.status).toBe('won');
  });

  it('can verify a breakwater rescue when no food remains for towing', () => {
    const state = { ...finale(at('bell', 1, 0, 'bell'), at('shelter', 1, 2)), food: 0, timber: 3 };
    const [advice] = getFinaleAdvice(state);
    expect(advice.rescue).toEqual({ type: 'build', id: 'shelter', building: 'breakwater' });
    expect(advice.hint).toContain('1 action + 3 timber');
    expect(forecastTide(applyCommand(state, advice.rescue!).state).state.status).toBe('won');
  });

  it('never promises victory for repairing only one of several bells', () => {
    const state = finale(at('bell', 1, 0, 'bell'), { ...at('second', 0, -1, 'bell'), stress: 4 }, at('shelter', 0, 2));
    expect(getFinaleAdvice(state).every(advice => !advice.rescue)).toBe(true);
  });

  it('rejects shelter that would replace the last garden and starve the Heart', () => {
    const state = { ...finale(at('bell', 1, 0, 'bell'), { ...at('garden', 1, 2), building: 'garden' as const }), food: 0, timber: 3, integrity: 1 };
    expect(getFinaleAdvice(state)[0].rescue).toBeUndefined();
  });

  it('does not suggest placing a shelter island outside the reef', () => {
    const [advice] = getFinaleAdvice(finale(at('bell', 0, 4, 'bell')));
    expect(advice.hint).toContain('outside the reef');
    expect(advice.hint).not.toContain('Put an island');
  });

  it('does not invent a rescue without actions or resources', () => {
    const state = finale(at('bell', 1, -1, 'bell'));
    expect(getFinaleAdvice({ ...state, actions: 0 })[0].rescue).toBeUndefined();
    expect(getFinaleAdvice({ ...state, food: 0, timber: 0 })[0].rescue).toBeUndefined();
  });

  it('includes queued final growth in the actual forecast', () => {
    const [advice] = getFinaleAdvice(finale({ ...at('bell', 0, -1, 'bell'), growth: 2, nourished: true }));
    expect(advice.grown).toBe(true);
    expect(advice.hint).toContain('is ready to ring');
  });

  it('does not apply the final storm twice to a completed loss', () => {
    const lost = resolveTide(finale({ ...at('bell', 1, -1, 'bell'), stress: 1 })).state;
    const [advice] = getFinaleAdvice(lost);
    expect(advice).toMatchObject({ stress: 3, forecastStress: 3 });
    expect(advice.rescue).toBeUndefined();
    expect(advice.hint).toContain('could not ring');
    expect(advice.hint).not.toContain('Exposure raises');
  });

  it('preserves the original saved-voyage win rules', () => {
    const state = { ...finale({ ...at('bell', 1, -1, 'bell'), stress: 5 }), voyageRules: undefined };
    const [advice] = getFinaleAdvice(state);
    expect(forecastTide(state).state.status).toBe('won');
    expect(advice).toMatchObject({ grown: true, connected: true, sheltered: false, rested: false });
    expect(advice.hint).toBe('bell is ready to ring.');
  });

  it('does not mutate input or offer final rescue commands on earlier tides', () => {
    const state = { ...finale(at('bell', 1, -1, 'bell')), tide: 4 };
    const original = JSON.stringify(state);
    const [advice] = getFinaleAdvice(state);
    expect(JSON.stringify(state)).toBe(original);
    expect(advice.hint).toContain('after this tide');
    expect(advice.rescue).toBeUndefined();
  });
});
