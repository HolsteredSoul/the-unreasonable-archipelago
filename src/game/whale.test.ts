import { describe, expect, it } from 'vitest';
import { applyCommand, createGame, forecastTide, getIslandStats, getWhaleEncounter, resolveTide } from './index';
import type { GameState, Hex } from './types';

const position = ({ q, r }: Hex) => ({ q: q + 0, r: r + 0 });
const bellAt = (state: GameState) => state.islands.find(island => island.id === 'bell')!;
const visit = (): GameState => ({ ...createGame('first-light'), tide: 2 });

describe('rotated sea currents', () => {
  it('preserves the authored introductory geometry, buildings, and first current', () => {
    const state = createGame('first-light');
    expect(state.currentRotation).toBeUndefined();
    expect(state.islands.map(({ id, q, r, building }) => [id, q, r, building])).toEqual([
      ['heart', 0, 0, null], ['bell', 3, -1, null], ['garden-west', -1, 0, 'garden'],
      ['garden-south', 0, 1, 'garden'], ['grove', 1, 0, 'grove'], ['north', 1, -2, null], ['west', -2, 1, null],
    ]);
    expect(getIslandStats(state, 'bell').current).toEqual({ q: 0, r: 1 });
    expect(getWhaleEncounter(state)).toBeNull();
  });

  it('turns both current direction and its physical drift with all six board orientations', () => {
    // These are six explicit rotations of the same eastern-stream point and its southward drift.
    const cases = [
      { at: { q: 2, r: -1 }, current: { q: 0, r: 1 } },
      { at: { q: 1, r: -2 }, current: { q: 1, r: 0 } },
      { at: { q: -1, r: -1 }, current: { q: 1, r: -1 } },
      { at: { q: -2, r: 1 }, current: { q: 0, r: -1 } },
      { at: { q: -1, r: 2 }, current: { q: -1, r: 0 } },
      { at: { q: 1, r: 1 }, current: { q: -1, r: 1 } },
    ];
    for (let rotation = 0; rotation < cases.length; rotation++) {
      const authored = createGame('first-light');
      const { at, current } = cases[rotation];
      const state = { ...authored, currentRotation: rotation, islands: [authored.islands[0], { ...bellAt(authored), ...at }] };
      expect(position(getIslandStats(state, 'bell').current)).toEqual(current);
      expect(position(bellAt(resolveTide(state).state))).toEqual({ q: at.q + current.q, r: at.r + current.r });
      expect(position(getIslandStats(state, 'heart').current)).toEqual({ q: 0, r: 0 });
      state.islands[1].anchored = true;
      expect(position(getIslandStats(state, 'bell').current)).toEqual({ q: 0, r: 0 });
    }
  });

  it('changes the current at a fixed world location rather than only relabeling it', () => {
    const state = createGame('first-light');
    expect(position(getIslandStats(state, 'bell').current)).toEqual({ q: 0, r: 1 });
    expect(position(getIslandStats({ ...state, currentRotation: 1 }, 'bell').current)).toEqual({ q: 0, r: 0 });
  });
});

describe('the visiting whale', () => {
  it('visits only tides 2, 5, and 7, with deterministic seed-dependent directions and offers', () => {
    const directions = new Set<number>();
    for (let seed = 0; seed < 24; seed++) {
      const opening = createGame(`whale-route-${seed}`);
      for (let tide = 1; tide <= 8; tide++) {
        const state = { ...opening, tide };
        const encounter = getWhaleEncounter(state);
        expect(encounter).toEqual(getWhaleEncounter(structuredClone(state)));
        if ([2, 5, 7].includes(tide)) {
          expect(encounter).not.toBeNull();
          directions.add(encounter!.directionIndex);
          expect(encounter!.offers.every(offer => offer.id !== 'heart')).toBe(true);
        } else expect(encounter).toBeNull();
      }
    }
    expect(directions.size).toBeGreaterThan(1);
  });

  it('costs exactly one action and no food or timber, even with an empty pantry', () => {
    const state = { ...visit(), food: 0 };
    const before = structuredClone(state);
    const offer = getWhaleEncounter(state)!.offers.find(item => item.id === 'bell')!;
    expect(offer.to).toEqual({ q: 2, r: -1 });
    const result = applyCommand(state, { type: 'whaleTow', id: 'bell' });
    expect(result.error).toBeUndefined();
    expect(position(bellAt(result.state))).toEqual(offer.to);
    expect(result.state).toMatchObject({ actions: 2, food: 0, timber: state.timber, whaleTowedId: 'bell' });
    expect(state).toEqual(before);
  });

  it('rejects absent visits, the Heart, missing islands, spent actions, occupied water, and the reef', () => {
    const occupied = visit();
    Object.assign(occupied.islands.find(island => island.id === 'north')!, { q: 2, r: -1 });
    const offboard = visit();
    Object.assign(bellAt(offboard), { q: -4, r: 0 });
    const cases = [
      { state: createGame(), id: 'bell' },
      { state: visit(), id: 'heart' },
      { state: visit(), id: 'not-an-island' },
      { state: { ...visit(), actions: 0 }, id: 'bell' },
      { state: occupied, id: 'bell' },
      { state: offboard, id: 'bell' },
      { state: { ...visit(), status: 'lost' as const, integrity: 0, actions: 0 }, id: 'bell' },
    ];
    for (const { state, id } of cases) {
      const before = structuredClone(state);
      const result = applyCommand(state, { type: 'whaleTow', id });
      expect(result.error).toBeTruthy();
      expect(result.state).toBe(state);
      expect(state).toEqual(before);
    }
  });

  it('allows one favour per visit, restores it on undo, and offers a fresh favour next visit', () => {
    const before = visit();
    const first = applyCommand(before, { type: 'whaleTow', id: 'bell' }).state;
    expect(getWhaleEncounter(first)).toMatchObject({ used: true, offers: [] });
    expect(applyCommand(first, { type: 'whaleTow', id: 'north' }).state).toBe(first);
    // Undo restores the actual immutable command snapshot, including the unused encounter.
    const restored = structuredClone(before);
    expect(getWhaleEncounter(restored)!.used).toBe(false);
    expect(applyCommand(restored, { type: 'whaleTow', id: 'bell' }).state).toEqual(first);
    let later = resolveTide(first).state;
    expect(later.whaleTowedId).toBeNull();
    expect(getWhaleEncounter(later)).toBeNull();
    while (later.tide < 5) later = resolveTide(later).state;
    const nextVisit = getWhaleEncounter(later)!;
    expect(nextVisit.used).toBe(false);
    expect(nextVisit.offers.length).toBeGreaterThan(0);
    expect(applyCommand(later, { type: 'whaleTow', id: nextVisit.offers[0].id }).error).toBeUndefined();
  });

  it('keeps the coming current active and forecast-identical after a whale tow', () => {
    const towed = applyCommand(visit(), { type: 'whaleTow', id: 'bell' }).state;
    expect(position(bellAt(towed))).toEqual({ q: 2, r: -1 });
    const before = structuredClone(towed);
    const forecast = forecastTide(towed);
    expect(forecast).toEqual(resolveTide(towed));
    expect(towed).toEqual(before);
    expect(forecast.moves.find(move => move.id === 'bell')).toMatchObject({
      from: { q: 2, r: -1 }, to: { q: 1, r: -1 }, blocked: false,
    });
    expect(position(bellAt(forecast.state))).toEqual({ q: 1, r: -1 });
    const anchored = applyCommand(towed, { type: 'anchor', id: 'bell' }).state;
    expect(position(bellAt(resolveTide(anchored).state))).toEqual({ q: 2, r: -1 });
  });
});
