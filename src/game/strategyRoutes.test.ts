import { describe, expect, it } from 'vitest';
import { applyCommand, forecastTide, getVictoryConditions, isInBounds, resolveTide } from './index';
import { CAMPAIGN_MAPS, campaignSolution, createCampaignGame } from './campaign';
import { auditStrategyRoute, campaignLateRoute, campaignMedalRoute, lateStrategyDifference, searchLateRoute, searchMedalRoute } from './strategyRoutes';
import type { Command } from './types';

function independentReplay(map: number, route: Command[][]) {
  let state = createCampaignGame(map);
  const original = structuredClone(state);
  expect(route).toHaveLength(8);
  for (const commands of route) {
    expect(state.status).toBe('playing');
    for (const command of commands) {
      const before = structuredClone(state);
      const result = applyCommand(state, command);
      expect(result.error, `map ${map}, tide ${state.tide}: ${JSON.stringify(command)}`).toBeUndefined();
      expect(state).toEqual(before);
      expect(result.state.actions).toBe(state.actions - 1);
      state = result.state;
      expect(state.food).toBeGreaterThanOrEqual(0);
      expect(state.timber).toBeGreaterThanOrEqual(0);
    }
    const before = structuredClone(state);
    const forecast = forecastTide(state);
    expect(resolveTide(state)).toEqual(forecast);
    expect(state).toEqual(before);
    state = forecast.state;
    expect(state.islands.every(isInBounds)).toBe(true);
    expect(new Set(state.islands.map(i => `${i.q},${i.r}`)).size).toBe(state.islands.length);
    expect(state.voyageRules).toBe(original.voyageRules);
    expect(state.currentRotation).toBe(original.currentRotation);
  }
  expect(state.status).toBe('won');
  expect(getVictoryConditions(state).ready).toBe(true);
  expect(createCampaignGame(map)).toEqual(original);
  return state;
}

describe('reusable optional-goal and alternative-strategy routes', () => {
  for (const map of CAMPAIGN_MAPS) {
    it(`wins map ${map.id} with at least six actual ordinary growth stages`, () => {
      const route = campaignMedalRoute(map.id);
      expect(route, `Missing verified medal fixture for map ${map.id}`).toBeDefined();
      const before = structuredClone(route!);
      const state = independentReplay(map.id, route!.commands);
      const growth = state.islands.filter(i => i.kind === 'ordinary').reduce((sum, i) => sum + i.growth, 0);
      expect(growth).toBeGreaterThanOrEqual(6);
      const audit = auditStrategyRoute(map.id, route!.commands);
      expect(audit.state).toEqual(state);
      expect(audit.ordinaryGrowth).toBe(growth);
      expect(auditStrategyRoute(map.id, route!.commands)).toEqual(audit);
      expect(route).toEqual(before);
    });

    it(`keeps map ${map.id}'s recorded late alternative legal and materially different`, () => {
      const route = campaignLateRoute(map.id);
      expect(route, `Missing verified alternative fixture for map ${map.id}`).toBeDefined();
      independentReplay(map.id, route!.commands);
      const difference = lateStrategyDifference(map.id, route!.commands);
      expect(difference.material).toBe(true);
      expect(difference.changedBells.length).toBeGreaterThan(0);
      expect(difference.newSpatialCommands).toBeGreaterThan(0);
    });
  }

  it('returns independent command fixtures and rejects invalid campaign maps', () => {
    const medal = campaignMedalRoute(1)!;
    medal.commands[0].length = 0;
    medal.description = 'changed';
    expect(campaignMedalRoute(1)!.commands[0].length).toBeGreaterThan(0);
    expect(campaignMedalRoute(1)!.description).not.toBe('changed');
    const alternative = campaignLateRoute(1)!;
    alternative.commands[7].length = 0;
    expect(campaignLateRoute(1)!.commands[7].length).toBeGreaterThan(0);
    for (const map of [0, 9, 1.5, NaN]) {
      expect(() => campaignMedalRoute(map)).toThrow(RangeError);
      expect(() => campaignLateRoute(map)).toThrow(RangeError);
    }
  });

  it('does not label the reference or a redundant single anchor omission a new strategy', () => {
    expect(lateStrategyDifference(1, campaignSolution(1)).material).toBe(false);
    const redundant = campaignSolution(3);
    redundant[4] = redundant[4].filter(c => !(c.type === 'anchor' && c.id === 'bell-2'));
    expect(auditStrategyRoute(3, redundant).state.status).toBe('won');
    expect(lateStrategyDifference(3, redundant).material).toBe(false);
  });

  it('rejects incomplete and illegal traces rather than silently skipping commands', () => {
    expect(() => auditStrategyRoute(1, campaignSolution(1).slice(0, 7))).toThrow('all eight tides');
    const illegal = campaignSolution(1);
    illegal[0].push({ type: 'nourish', id: 'bell' });
    expect(() => auditStrategyRoute(1, illegal)).toThrow('No actions remain');
  });
});

describe('bounded deterministic discovery', () => {
  it('finds and independently replays an ordinary-growth witness without changing the authored route', () => {
    const original = campaignSolution(1);
    const limits = { maxExpansions: 2000, beamWidth: 12 };
    const found = searchMedalRoute(1, limits);
    expect(found.status).toBe('found');
    expect(found.expansions).toBeLessThanOrEqual(limits.maxExpansions);
    expect(searchMedalRoute(1, limits)).toEqual(found);
    const state = independentReplay(1, found.route!.commands);
    expect(state.islands.filter(i => i.kind === 'ordinary').reduce((sum, i) => sum + i.growth, 0)).toBeGreaterThanOrEqual(6);
    expect(campaignSolution(1)).toEqual(original);
  });

  it('finds and replays a late-current alternative using the production rules', () => {
    const limits = { maxExpansions: 32, beamWidth: 4 };
    const found = searchLateRoute(1, [5, 7], limits);
    expect(found.status).toBe('found');
    expect(found.expansions).toBeLessThanOrEqual(limits.maxExpansions);
    expect(searchLateRoute(1, [5, 7], limits)).toEqual(found);
    independentReplay(1, found.route!.commands);
    expect(lateStrategyDifference(1, found.route!.commands).material).toBe(true);
  });

  it.each([0, 1])('reports unresolved at an expansion cap of %i, without claiming impossibility', maxExpansions => {
    for (const result of [searchMedalRoute(1, { maxExpansions, beamWidth: 1 }), searchLateRoute(1, [5, 7], { maxExpansions, beamWidth: 1 })]) {
      expect(result.status).toBe('unresolved');
      expect(result.expansions).toBeLessThanOrEqual(maxExpansions);
      expect(result.reason).toContain('cap reached');
      expect(result.route).toBeUndefined();
    }
  });

  it('validates budgets, release targets, and investment tides before searching', () => {
    for (const limits of [{ maxExpansions: -1, beamWidth: 1 }, { maxExpansions: 50001, beamWidth: 1 }, { maxExpansions: 1, beamWidth: 0 }, { maxExpansions: 1.5, beamWidth: 1 }]) {
      expect(() => searchMedalRoute(1, limits)).toThrow(RangeError);
      expect(() => searchLateRoute(1, [7], limits)).toThrow(RangeError);
    }
    expect(() => searchLateRoute(1, [4])).toThrow(RangeError);
    expect(() => searchLateRoute(1, [7], { maxExpansions: 1, beamWidth: 1 }, ['heart'])).toThrow(RangeError);
    expect(() => searchMedalRoute(1, { maxExpansions: 1, beamWidth: 1 }, { tide: 9, id: 'north' })).toThrow(RangeError);
  });
});
