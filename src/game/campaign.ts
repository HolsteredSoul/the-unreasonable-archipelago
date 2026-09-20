import { createGame, getActionBudget } from './index';
import type { Building, Command, GameState, Island } from './types';

export type CampaignMap = { id: number; title: string; subtitle: string; bells: number; islands: number };

/** Two victories add one bell, one ordinary island, and one action per tide. */
export const CAMPAIGN_MAPS: readonly CampaignMap[] = [
  { id: 1, title: "First Light", subtitle: "One sleeping bell. Eight tides to earn a little more time.", bells: 1, islands: 7 },
  { id: 2, title: "The Long Way Home", subtitle: "A faraway bell, a borrowed breakwater, and currents with other ideas.", bells: 1, islands: 7 },
  { id: 3, title: "A Second Opinion", subtitle: "Two bells join the chorus. Bring both into shelter together.", bells: 2, islands: 9 },
  { id: 4, title: "Bread and Bells", subtitle: "Build a pantry before a second voice empties it.", bells: 2, islands: 9 },
  { id: 5, title: "The Third Voice", subtitle: "Three bells share a harbour. The islands must shelter one another.", bells: 3, islands: 11 },
  { id: 6, title: "Salt and Supper", subtitle: "Scattered shores, a thin pantry, and three bells to bring home.", bells: 3, islands: 11 },
  { id: 7, title: "A Choir of Four", subtitle: "Four bells need a home. Every island can become part of its shelter.", bells: 4, islands: 13 },
  { id: 8, title: "The Moon’s Encore", subtitle: "One final chorus. Bring every bell through the last squall.", bells: 4, islands: 13 },
];

type Scenario = {
  seed: string; rotation: number; food: number; timber: number;
  islands: [id: string, q: number, r: number, building: Building | null][];
};

// Authored, frozen openings keep campaign lessons consistent as procedural free play evolves.
// The same seed still drives the scenery and weather; every layout has a tested command witness.
const SCENARIOS: readonly Scenario[] = [
  { // 1. First Light
    seed: 'first-light', rotation: 0, food: 10, timber: 9,
    islands: [
      ['heart', 0, 0, null],
      ['bell', 3, -1, null],
      ['garden-west', -1, 0, 'garden'],
      ['garden-south', 0, 1, 'garden'],
      ['grove', 1, 0, 'grove'],
      ['north', 1, -2, null],
      ['west', -2, 1, null],
    ],
  },
  { // 2. The Long Way Home
    seed: 'campaign-moonlit-teapot', rotation: 5, food: 10, timber: 9,
    islands: [
      ['heart', 0, 0, null],
      ['bell', -1, 4, null],
      ['garden-west', 1, -1, 'garden'],
      ['garden-south', -2, 1, 'grove'],
      ['grove', 2, 0, 'garden'],
      ['north', -1, -2, null],
      ['west', 2, 1, 'breakwater'],
    ],
  },
  { // 3. A Second Opinion
    seed: 'campaign-3-0', rotation: 5, food: 12, timber: 10,
    islands: [
      ['heart', 0, 0, null],
      ['bell', 0, -1, null],
      ['bell-2', 1, -1, null],
      ['shore-1', 0, 2, 'garden'],
      ['shore-2', -2, 2, 'garden'],
      ['shore-3', -1, 2, 'grove'],
      ['shore-4', 3, -2, null],
      ['shore-5', -2, 3, null],
      ['shore-6', 2, 0, null],
    ],
  },
  { // 4. Bread and Bells
    seed: 'campaign-4-0', rotation: 1, food: 12, timber: 10,
    islands: [
      ['heart', 0, 0, null],
      ['bell', -1, 1, null],
      ['bell-2', 1, -2, null],
      ['shore-1', -2, 2, 'garden'],
      ['shore-2', 2, 0, 'grove'],
      ['shore-3', 1, 1, null],
      ['shore-4', -3, 3, null],
      ['shore-5', -1, 2, null],
      ['shore-6', 1, 2, null],
    ],
  },
  { // 5. The Third Voice
    seed: 'campaign-5-0', rotation: 3, food: 14, timber: 11,
    islands: [
      ['heart', 0, 0, null],
      ['bell', 1, 0, null],
      ['bell-2', 1, -1, null],
      ['bell-3', 0, -1, null],
      ['shore-1', -2, 0, 'garden'],
      ['shore-2', 2, -1, 'garden'],
      ['shore-3', -1, 2, 'grove'],
      ['shore-4', -2, -1, null],
      ['shore-5', 1, 2, null],
      ['shore-6', 2, -3, null],
      ['shore-7', 2, 0, null],
    ],
  },
  { // 6. Salt and Supper
    seed: 'campaign-6-1', rotation: 1, food: 14, timber: 11,
    islands: [
      ['heart', 0, 0, null],
      ['bell', 1, 0, null],
      ['bell-2', 0, 1, null],
      ['bell-3', -2, 1, null],
      ['shore-1', 2, 0, 'garden'],
      ['shore-2', 0, -2, 'grove'],
      ['shore-3', 0, 2, null],
      ['shore-4', 3, 0, null],
      ['shore-5', -3, 3, null],
      ['shore-6', -1, -2, null],
      ['shore-7', 3, -3, null],
    ],
  },
  { // 7. A Choir of Four
    seed: 'campaign-7-0', rotation: 4, food: 16, timber: 12,
    islands: [
      ['heart', 0, 0, null],
      ['bell', 1, -1, null],
      ['bell-2', 0, 1, null],
      ['bell-3', 0, -1, null],
      ['bell-4', -1, 0, null],
      ['shore-1', 0, 2, 'garden'],
      ['shore-2', -2, 2, 'garden'],
      ['shore-3', -1, 2, 'grove'],
      ['shore-4', 1, -3, null],
      ['shore-5', 0, -3, null],
      ['shore-6', -3, 1, null],
      ['shore-7', -3, 0, null],
      ['shore-8', 3, 0, null],
    ],
  },
  { // 8. The Moon’s Encore
    seed: 'campaign-8-0', rotation: 4, food: 16, timber: 12,
    islands: [
      ['heart', 0, 0, null],
      ['bell', 1, -1, null],
      ['bell-2', 1, 0, null],
      ['bell-3', -1, 0, null],
      ['bell-4', 0, 2, null],
      ['shore-1', 2, -1, 'garden'],
      ['shore-2', -1, 2, 'garden'],
      ['shore-3', -2, 1, 'grove'],
      ['shore-4', 3, -2, null],
      ['shore-5', 2, 1, null],
      ['shore-6', -3, 3, null],
      ['shore-7', -2, -1, null],
      ['shore-8', -1, 3, null],
    ],
  },
];

const SHORE_NAMES = ['Little Tuesday', 'Porridge', 'The Committee', 'Salt Pocket', 'Quite Possibly', 'Thimble', 'Almost Home', 'The Spare Hat'];
const BELL_NAMES = ['The Sleeping Bell', 'The Contrary Bell', 'The Bashful Bell', 'The Impossible Bell'];

function mapIndex(map: number): number {
  if (!Number.isInteger(map) || map < 1 || map > CAMPAIGN_MAPS.length) throw new RangeError('Choose a campaign map from 1 to 8.');
  return map - 1;
}

/** Create a fresh campaign attempt without changing procedural free-play generation. */
export function createCampaignGame(map: number): GameState {
  const index = mapIndex(map);
  const scenario = SCENARIOS[index];
  const descriptor = CAMPAIGN_MAPS[index];
  let shore = 0;
  let bell = 0;
  const islands: Island[] = scenario.islands.map(([id, q, r, building]) => {
    const kind = id === 'heart' ? 'heart' : id === 'bell' || id.startsWith('bell-') ? 'bell' : 'ordinary';
    const name = kind === 'heart' ? 'The Heart' : kind === 'bell' ? BELL_NAMES[bell++] : SHORE_NAMES[(shore++ + index) % SHORE_NAMES.length];
    return { id, name, kind, q, r, building, growth: 0, stress: 0, nourished: false, anchored: false };
  });
  const state: GameState = {
    ...createGame('first-light'), campaignMap: map, seed: scenario.seed, currentRotation: scenario.rotation,
    food: scenario.food, timber: scenario.timber, islands,
    log: [
      'Map ' + map + ' of 8 · ' + descriptor.title + '.',
      'Grow ' + (descriptor.bells === 1 ? 'the bell' : 'all ' + descriptor.bells + ' bells') + ' three times. Finish tide 8 with every bell connected to the Heart, sheltered, and below 3 stress.',
    ],
  };
  state.actions = getActionBudget(state);
  return state;
}

const tow = (id: string, q: number, r: number): Command => ({ type: 'tow', id, to: { q, r } });
const SOLUTIONS: readonly Command[][][] = [
  [ // 1. First Light
    [tow('bell', 2, -1), { type: 'nourish', id: 'bell' }, { type: 'anchor', id: 'bell' }],
    [{ type: 'nourish', id: 'bell' }, tow('bell', 1, -1)],
    [{ type: 'nourish', id: 'bell' }],
    [],
    [{ type: 'anchor', id: 'bell' }],
    [],
    [{ type: 'anchor', id: 'bell' }],
    [],
  ],
  [ // 2. The Long Way Home
    [tow('bell', 0, 3), tow('bell', 0, 2), tow('bell', 0, 1)],
    [{ type: 'nourish', id: 'bell' }],
    [{ type: 'nourish', id: 'bell' }],
    [],
    [{ type: 'nourish', id: 'bell' }, { type: 'anchor', id: 'bell' }],
    [],
    [{ type: 'anchor', id: 'bell' }],
    [],
  ],
  [ // 3. A Second Opinion
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }],
    [],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }],
    [],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }],
    [tow('shore-3', 0, -1)],
  ],
  [ // 4. Bread and Bells
    [{ type: 'build', id: 'shore-4', building: 'garden' }, { type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, tow('bell-2', 0, -1)],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }],
    [],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }],
    [],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }],
    [tow('bell', -1, 1), tow('bell-2', -1, 0), tow('shore-5', -1, -1)],
  ],
  [ // 5. The Third Voice
    [{ type: 'build', id: 'shore-5', building: 'garden' }, { type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }],
    [],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }, { type: 'anchor', id: 'bell-3' }],
    [],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }, { type: 'anchor', id: 'bell-3' }],
    [tow('shore-6', 2, -2), tow('shore-6', 2, -1), tow('shore-1', 1, -2)],
  ],
  [ // 6. Salt and Supper
    [{ type: 'build', id: 'shore-5', building: 'garden' }, { type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }, tow('bell-3', -1, 1)],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }],
    [{ type: 'nourish', id: 'bell-3' }],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }, { type: 'anchor', id: 'bell-3' }],
    [],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }, { type: 'anchor', id: 'bell-3' }],
    [tow('shore-3', -1, 2), tow('shore-1', 1, 1)],
  ],
  [ // 7. A Choir of Four
    [{ type: 'build', id: 'shore-8', building: 'garden' }, { type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }, { type: 'nourish', id: 'bell-4' }],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }, { type: 'nourish', id: 'bell-4' }],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }],
    [{ type: 'nourish', id: 'bell-4' }],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }, { type: 'anchor', id: 'bell-3' }, { type: 'anchor', id: 'bell-4' }],
    [],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }, { type: 'anchor', id: 'bell-3' }, { type: 'anchor', id: 'bell-4' }],
    [tow('bell-2', 1, 1), tow('shore-8', 2, 1), tow('shore-8', 1, 2), tow('bell-4', 0, -1)],
  ],
  [ // 8. The Moon’s Encore
    [{ type: 'build', id: 'shore-5', building: 'garden' }, { type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }, { type: 'nourish', id: 'bell-4' }, tow('bell-4', 0, 1)],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }, { type: 'nourish', id: 'bell-3' }, { type: 'nourish', id: 'bell-4' }],
    [{ type: 'nourish', id: 'bell' }, { type: 'nourish', id: 'bell-2' }],
    [{ type: 'nourish', id: 'bell-3' }],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }, { type: 'anchor', id: 'bell-3' }, { type: 'anchor', id: 'bell-4' }],
    [{ type: 'nourish', id: 'bell-4' }],
    [{ type: 'anchor', id: 'bell' }, { type: 'anchor', id: 'bell-2' }, { type: 'anchor', id: 'bell-3' }, { type: 'anchor', id: 'bell-4' }],
    [tow('shore-3', -1, -1), tow('bell-2', -1, 2), tow('bell', 0, 1)],
  ],
];

/** A legal route for simulation/browser regression checks, never an automatic player. */
export function campaignSolution(map: number): Command[][] {
  return structuredClone(SOLUTIONS[mapIndex(map)]);
}
