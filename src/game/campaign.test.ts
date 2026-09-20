import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, forecastTide, getActionBudget, getConnectedIds, getVictoryConditions, getWeather, isInBounds, resolveTide } from './index';
import { CAMPAIGN_MAPS, campaignSolution, createCampaignGame } from './campaign';

describe('the eight-map campaign', () => {
  it('adds one bell, two islands, and one action after each pair of maps', () => {
    expect(CAMPAIGN_MAPS.map(map => map.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    for (const map of CAMPAIGN_MAPS) {
      const state = createCampaignGame(map.id);
      const stage = Math.floor((map.id - 1) / 2);
      expect(state.campaignMap).toBe(map.id);
      expect(state.islands).toHaveLength(7 + stage * 2);
      expect(map.islands).toBe(state.islands.length);
      expect(state.islands.filter(island => island.kind === 'bell')).toHaveLength(1 + stage);
      expect(map.bells).toBe(1 + stage);
      expect(getActionBudget(state)).toBe(3 + stage);
      expect(state.actions).toBe(3 + stage);
      expect(state.maxTides).toBe(8);
      expect(state.islands.every(island => island.growth === 0)).toBe(true);
      expect(state.islands.every(island => !island.nourished && !island.anchored)).toBe(true);
      expect(state.islands.every(isInBounds)).toBe(true);
      expect(new Set(state.islands.map(island => `${island.q},${island.r}`)).size).toBe(map.islands);
    }
  });

  it('keeps the teaching map familiar and later geography meaningfully different', () => {
    const original = createGame('first-light');
    expect(createCampaignGame(1).islands.map(({ name: _name, ...island }) => island)).toEqual(original.islands.map(({ name: _name, ...island }) => island));
    const layouts = new Set<string>();
    const rotations = new Set<number>();
    const winds = new Set<number>();
    for (const map of CAMPAIGN_MAPS) {
      const state = createCampaignGame(map.id);
      layouts.add(state.islands.map(island => `${island.id}:${island.q},${island.r},${island.building}`).join('|'));
      rotations.add(state.currentRotation ?? 0);
      winds.add(getWeather({ ...state, tide: 8 }).direction);
      expect(createCampaignGame(map.id)).toEqual(state);
    }
    expect(layouts.size).toBe(8);
    expect(rotations.size).toBeGreaterThanOrEqual(4);
    expect(winds.size).toBeGreaterThanOrEqual(4);
    const distantBell = createCampaignGame(2).islands.find(island => island.id === 'bell')!;
    expect(Math.max(Math.abs(distantBell.q), Math.abs(distantBell.r), Math.abs(distantBell.q + distantBell.r))).toBe(4);
  });

  for (const map of CAMPAIGN_MAPS) {
    it(`wins map ${map.id}: ${map.title} through legal actions and all eight actual tides`, () => {
      let state = createCampaignGame(map.id);
      const solution = campaignSolution(map.id);
      expect(solution).toHaveLength(8);
      for (const commands of solution) {
        expect(commands.length).toBeLessThanOrEqual(getActionBudget(state));
        for (const command of commands) {
          const before = state.actions;
          const result = applyCommand(state, command);
          expect(result.error, `${map.title}, tide ${state.tide}: ${JSON.stringify(command)}`).toBeUndefined();
          state = result.state;
          expect(state.actions).toBe(before - 1);
          expect(state.food).toBeGreaterThanOrEqual(0);
          expect(state.timber).toBeGreaterThanOrEqual(0);
        }
        const forecast = forecastTide(state);
        expect(resolveTide(state)).toEqual(forecast);
        state = forecast.state;
        expect(state.islands.every(isInBounds)).toBe(true);
        expect(new Set(state.islands.map(island => `${island.q},${island.r}`)).size).toBe(map.islands);
        expect(state.integrity).toBeGreaterThanOrEqual(4);
        if (state.status === 'playing') expect(state.actions).toBe(getActionBudget(state));
      }
      expect(state.status).toBe('won');
      expect(state.tide).toBe(8);
      expect(state.actions).toBe(0);
      expect(getVictoryConditions(state)).toEqual({ grown: true, connected: true, sheltered: true, rested: true, ready: true });
      for (const bell of state.islands.filter(island => island.kind === 'bell')) {
        expect(bell.growth).toBe(3);
        expect(bell.stress).toBeLessThan(3);
        expect(getConnectedIds(state)).toContain(bell.id);
        expect(resolveTide(state).shelteredIds).toContain(bell.id);
      }
    });

    it(`does not give away map ${map.id} when the player only advances tides`, () => {
      let state = createCampaignGame(map.id);
      while (state.status === 'playing') state = resolveTide(state).state;
      expect(state.status).toBe('lost');
      expect(state.islands.filter(island => island.kind === 'bell').every(island => island.growth === 0)).toBe(true);
    });
  }

  it('requires every added bell to flower, even when the original bell succeeds', () => {
    for (let map = 3; map <= 8; map++) {
      let state = createCampaignGame(map);
      for (const commands of campaignSolution(map)) {
        for (const command of commands) {
          if (command.type === 'nourish' && command.id !== 'bell') continue;
          const result = applyCommand(state, command);
          expect(result.error).toBeUndefined();
          state = result.state;
        }
        state = resolveTide(state).state;
      }
      expect(state.islands.find(island => island.id === 'bell')!.growth).toBe(3);
      expect(state.status).toBe('lost');
      expect(getVictoryConditions(state).grown).toBe(false);
    }
  });

  it('leaves the late-current and shelter problem after bells have grown', () => {
    for (const map of CAMPAIGN_MAPS) {
      let state = createCampaignGame(map.id);
      const solution = campaignSolution(map.id);
      for (let tide = 0; tide < 8; tide++) {
        for (const command of tide < 6 ? solution[tide] : []) state = applyCommand(state, command).state;
        state = resolveTide(state).state;
      }
      expect(state.status, map.title).toBe('lost');
    }
  });

  it('returns independent attempts and routes, and rejects nonexistent campaign maps', () => {
    const state = createCampaignGame(8);
    state.islands[0].name = 'Changed';
    state.food = 0;
    const solution = campaignSolution(8);
    solution[0].length = 0;
    expect(createCampaignGame(8).islands[0].name).toBe('The Heart');
    expect(createCampaignGame(8).food).toBeGreaterThan(0);
    expect(campaignSolution(8)[0].length).toBeGreaterThan(0);
    for (const invalid of [0, 9, -1, 1.5, NaN]) {
      expect(() => createCampaignGame(invalid)).toThrow(RangeError);
      expect(() => campaignSolution(invalid)).toThrow(RangeError);
    }
    expect(createGame('first-light').campaignMap).toBeUndefined();
    expect(getActionBudget(createGame('first-light'))).toBe(3);
  });
});
