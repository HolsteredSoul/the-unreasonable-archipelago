import type { Building, Command, CommandResult, Forecast, GameState, Hex, Island, IslandStats, Weather } from './types';
import { generateOpening } from './generation';

export type { Building, Command, CommandResult, Forecast, GameState, Hex, Island, IslandStats, Weather } from './types';

export const BOARD_RADIUS = 4;
export const DIRECTIONS: Hex[] = [
  { q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 },
  { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 },
];
const STILL: Hex = { q: 0, r: 0 };
const RULES = { actions: 3, rations: 2, tow: 1, build: 3, anchor: 1, nourish: 2, maxGrowth: 3, stressLimit: 3 };
export const getActionBudget = (state: Pick<GameState, 'campaignMap'>): number => state.campaignMap ? 3 + Math.floor((state.campaignMap - 1) / 2) : RULES.actions;
const BUILDINGS: Building[] = ['garden', 'grove', 'breakwater'];
const key = (hex: Hex) => `${hex.q},${hex.r}`;
const same = (a: Hex, b: Hex) => a.q === b.q && a.r === b.r;
const distance = (a: Hex, b: Hex) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r));
const plus = (a: Hex, b: Hex, amount = 1): Hex => ({ q: a.q + b.q * amount, r: a.r + b.r * amount });
const copy = (state: GameState): GameState => ({ ...state, islands: state.islands.map(island => ({ ...island })), log: [...state.log] });
const hash = (seed: string) => { let n = 2166136261; for (const char of seed) n = Math.imul(n ^ char.charCodeAt(0), 16777619); return n >>> 0; };

export function isInBounds(hex: Hex): boolean {
  return Number.isInteger(hex.q) && Number.isInteger(hex.r) && distance(hex, STILL) <= BOARD_RADIUS;
}

export function createGame(seed = 'first-light'): GameState {
  const names = ['Thimble', 'Quite Possibly', 'Little Tuesday', 'Porridge', 'The Committee', 'Salt Pocket', 'Almost Home'];
  const offset = hash(seed) % names.length;
  const island = (id: string, name: string, kind: Island['kind'], q: number, r: number, building: Building | null = null): Island => ({
    id, name, kind, q, r, building, growth: 0, stress: 0, nourished: false, anchored: false,
  });
  const opening: GameState = {
    version: 1, seed, tide: 1, maxTides: 8, food: 10, timber: 9, integrity: 5, actions: RULES.actions, status: 'playing', voyageRules: 'moonwake',
    islands: [
      island('heart', 'The Heart', 'heart', 0, 0),
      island('bell', 'The Sleeping Bell', 'bell', 3, -1),
      island('garden-west', names[offset], 'ordinary', -1, 0, 'garden'),
      island('garden-south', names[(offset + 1) % names.length], 'ordinary', 0, 1, 'garden'),
      island('grove', names[(offset + 2) % names.length], 'ordinary', 1, 0, 'grove'),
      island('north', names[(offset + 3) % names.length], 'ordinary', 1, -2),
      island('west', names[(offset + 4) % names.length], 'ordinary', -2, 1),
    ],
    log: ['The Moon requests its sea back. Grow the bell three times; finish tide 8 connected to the Heart, sheltered, and below 3 stress.'],
  };
  return seed === 'first-light' ? opening : generateOpening(opening, { applyCommand, resolveTide }).state;
}

export function getWeather(state: GameState): Weather {
  const offset = state.seed === 'first-light' ? 0 : hash(state.seed) % 6;
  const schedule: Weather[] = [
    { name: 'Glasswater', description: 'Calm water. Outer eastern islands drift south; western islands drift north. A good tide to grow.', direction: 0, storm: false, strength: 0 },
    { name: 'Silk Current', description: 'Calm water. Northern and southern countercurrents converge toward the center.', direction: 1, storm: false, strength: 0 },
    { name: 'Sideways Rain', description: 'A squall adds 1 stress to exposed islands. Southeast and northwest streams curl around the Heart.', direction: 0, storm: true, strength: 1 },
    { name: 'A Brief Intermission', description: 'No drift and no squall. The sea has gone to lunch. Nourished islands can grow.', direction: 2, storm: false, strength: 0 },
    { name: 'The Salt Parade', description: 'A squall adds 1 stress to exposed islands. Outer streams drift again.', direction: 1, storm: true, strength: 1 },
    { name: 'Luminous Ebb', description: 'Calm water. Northern and southern countercurrents return. A good tide to grow.', direction: 3, storm: false, strength: 0 },
    { name: 'Moonpull', description: 'A squall adds 1 stress to exposed islands. The curling streams make their last pass.', direction: 4, storm: true, strength: 1 },
    { name: 'The Final Tide', description: 'No drift. The final squall adds 2 stress to exposed islands. A mature bell must connect to the Heart.', direction: 2, storm: true, strength: 2 },
  ];
  const weather = schedule[Math.min(7, Math.max(0, state.tide - 1))];
  if (state.voyageRules === 'moonwake') {
    if (state.tide === 4) return { ...weather, description: 'Still water. Prepare for tide 5: the Moon pushes every drifting island outward. Anchor a harbour or plan a way home.', direction: (weather.direction + offset) % 6 };
    if (state.tide === 5) return { ...weather, name: 'The Moon Exhales', description: 'Every unanchored island drifts outward from the Heart. Exposed islands gain 1 stress. Follow the arrows; blocked islands stay put.', direction: (weather.direction + offset) % 6 };
    if (state.tide === 6) return { ...weather, description: 'Calm water and inward streams. Next tide, one crosscurrent carries the fleet with the wind; the Heart stays rooted.', direction: (weather.direction + offset) % 6 };
    if (state.tide === 7) return { ...weather, name: 'The Sideways Sea', description: 'One crosscurrent carries all unanchored islands with the wind. The Heart stays put. Exposed islands gain 1 stress; check tomorrow’s connection.', direction: (3 + offset) % 6 };
    if (state.tide === 8) return { ...weather, description: 'No drift. Exposed islands gain 2 stress. Every bell must be grown, linked to the Heart, sheltered, and below 3 stress to ring.', direction: (weather.direction + offset) % 6 };
  }
  const description = state.currentRotation && state.tide % 4 !== 0
    ? `${weather.storm ? `A squall adds ${weather.strength} stress to exposed islands.` : 'Calm water. A good tide to grow.'} This sea has rotated currents; follow the arrows on the water.`
    : weather.description;
  return { ...weather, description, direction: (weather.direction + offset) % 6 };
}

function rotateHex(hex: Hex, turns: number): Hex {
  let rotated = { q: hex.q, r: hex.r };
  for (let turn = 0; turn < turns % 6; turn++) rotated = { q: rotated.q + rotated.r, r: -rotated.q };
  return rotated;
}

function currentAt(state: GameState, island: Island): Hex {
  if (island.kind === 'heart' || island.anchored || state.status !== 'playing') return { ...STILL };
  if (state.voyageRules === 'moonwake' && state.tide === 7) return { ...DIRECTIONS[getWeather(state).direction] };
  const rotation = state.currentRotation ?? 0;
  const local = { ...island, ...rotateHex(island, 6 - rotation) };
  return rotateHex(unrotatedCurrent(state, local), rotation);
}

function unrotatedCurrent(state: GameState, island: Island): Hex {
  if (island.kind === 'heart' || island.anchored || state.status !== 'playing') return { ...STILL };
  if (state.voyageRules === 'moonwake' && state.tide === 5) {
    // Nearest axial bearing in the hex grid's metric; fixed ordering breaks ties deterministically.
    const projection = (direction: Hex) => 2 * island.q * direction.q + island.q * direction.r + island.r * direction.q + 2 * island.r * direction.r;
    return { ...DIRECTIONS.reduce((best, direction) => projection(direction) > projection(best) ? direction : best, DIRECTIONS[0]) };
  }
  switch (state.tide % 4) {
    case 1:
      if (island.q >= 2) return { q: 0, r: 1 };
      if (island.q <= -2) return { q: 0, r: -1 };
      break;
    case 2:
      if (island.r !== 0 && island.q > 0) return { q: -1, r: 0 };
      if (island.r !== 0 && island.q < 0) return { q: 1, r: 0 };
      break;
    case 3:
      if (distance(island, STILL) === 1) {
        const index = DIRECTIONS.findIndex(hex => same(hex, island));
        const target = DIRECTIONS[(index + 5) % 6];
        return { q: target.q - island.q, r: target.r - island.r };
      }
      if (island.q >= 1 && island.r >= 0) return { q: -1, r: 1 };
      if (island.q <= -1 && island.r <= 0) return { q: 1, r: -1 };
      break;
  }
  return { ...STILL };
}

export function getConnectedIds(state: GameState): string[] {
  const heart = state.islands.find(island => island.kind === 'heart');
  if (!heart) return [];
  const connected = new Set([heart.id]);
  const queue = [heart];
  while (queue.length) {
    const island = queue.shift()!;
    for (const next of state.islands) {
      if (!connected.has(next.id) && distance(island, next) === 1) { connected.add(next.id); queue.push(next); }
    }
  }
  return [...connected];
}

function isSheltered(state: GameState, island: Island, weather = getWeather(state)): boolean {
  if (!weather.storm || island.building === 'breakwater') return true;
  const direction = DIRECTIONS[weather.direction];
  return state.islands.some(other => other.id !== island.id && (
    same(plus(other, direction), island) ||
    (other.building === 'breakwater' && distance(other, island) <= 2 + Math.floor(other.growth / 2) &&
      same(plus(other, direction, distance(other, island)), island))
  ));
}

export function getIslandStats(state: GameState, id: string): IslandStats {
  const island = state.islands.find(item => item.id === id);
  if (!island) return { food: 0, timber: 0, sheltered: false, connected: false, growthReady: false, openSides: 0, current: { ...STILL } };
  const neighbors = state.islands.filter(other => other.id !== id && distance(island, other) === 1).length;
  const sheltered = isSheltered(state, island);
  const working = island.stress < RULES.stressLimit;
  return {
    food: working && island.building === 'garden' ? 1 + island.growth + (neighbors <= 2 ? 1 : 0) : 0,
    timber: working && island.building === 'grove' ? 1 + island.growth + (neighbors >= 3 ? 1 : 0) : 0,
    sheltered, connected: getConnectedIds(state).includes(id),
    growthReady: island.nourished && island.growth < RULES.maxGrowth && sheltered && working,
    openSides: 6 - neighbors, current: currentAt(state, island),
  };
}

/** Evaluate the actual final arrangement, after drift, storm stress, and growth. */
export function getVictoryConditions(state: GameState) {
  const bells = state.islands.filter(island => island.kind === 'bell');
  const connectedIds = getConnectedIds(state);
  const grown = bells.length > 0 && bells.every(island => island.growth === RULES.maxGrowth);
  const connected = bells.length > 0 && bells.every(island => connectedIds.includes(island.id));
  const sheltered = bells.length > 0 && bells.every(island => isSheltered(state, island, getWeather({ ...state, tide: state.maxTides })));
  const rested = bells.length > 0 && bells.every(island => island.stress < RULES.stressLimit);
  const safe = state.voyageRules !== 'moonwake' || (sheltered && rested);
  return { grown, connected, sheltered, rested, ready: grown && connected && safe && state.integrity > 0 };
}

export function getLegalTowTargets(state: GameState, id: string): Hex[] {
  const island = state.islands.find(item => item.id === id);
  if (!island || island.kind === 'heart' || state.status !== 'playing' || state.actions < 1 || state.food < RULES.tow) return [];
  return DIRECTIONS.map(direction => plus(island, direction)).filter(target => isInBounds(target) && !state.islands.some(other => same(other, target)));
}

export type WhaleEncounter = { direction: Hex; directionIndex: number; offers: { id: string; to: Hex }[]; used: boolean };
/** The visiting whale offers one action-costing, food-free tow; ordinary drift still follows. */
export function getWhaleEncounter(state: GameState): WhaleEncounter | null {
  const visit = [2, 5, 7].indexOf(state.tide);
  if (visit < 0 || state.status !== 'playing') return null;
  const offset = state.seed === 'first-light' ? 0 : hash(`whale:${state.seed}`) % 6;
  const directionIndex = ([3, 4, 1][visit] + offset) % 6;
  const direction = { ...DIRECTIONS[directionIndex] };
  const used = !!state.whaleTowedId;
  const offers = used ? [] : state.islands.filter(island => island.kind !== 'heart').flatMap(island => {
    const to = plus(island, direction);
    return isInBounds(to) && !state.islands.some(other => same(other, to)) ? [{ id: island.id, to }] : [];
  });
  return { direction, directionIndex, offers, used };
}

export function applyCommand(state: GameState, command: Command): CommandResult {
  const reject = (error: string): CommandResult => ({ state, error });
  if (state.status !== 'playing') return reject('This voyage is complete. Start another sea.');
  if (state.actions <= 0) return reject('No actions remain. Advance the tide or undo a choice.');
  const original = state.islands.find(island => island.id === command.id);
  if (!original) return reject('That island could not be found.');
  const next = copy(state);
  const island = next.islands.find(item => item.id === command.id)!;
  let message: string;
  switch (command.type) {
    case 'whaleTow': {
      const encounter = getWhaleEncounter(state);
      if (!encounter) return reject('The whale visits on tides 2, 5, and 7.');
      if (encounter.used) return reject('One favour per visit. The whale has other appointments.');
      const offer = encounter.offers.find(item => item.id === island.id);
      if (!offer) return reject('The whale needs an empty neighboring hex in its travel direction.');
      island.q = offer.to.q; island.r = offer.to.r;
      next.whaleTowedId = island.id;
      message = `The whale towed ${island.name} for one action and no food. The coming current still applies.`;
      break;
    }
    case 'tow':
      if (island.kind === 'heart') return reject('The Heart is rooted to the seabed.');
      if (state.food < RULES.tow) return reject('Towing needs 1 food.');
      if (!getLegalTowTargets(state, island.id).some(hex => same(hex, command.to))) return reject('Choose an empty neighboring hex inside the reef.');
      island.q = command.to.q; island.r = command.to.r; next.food -= RULES.tow;
      message = `${island.name} has been politely relocated.`;
      break;
    case 'build':
      if (island.kind !== 'ordinary') return reject('Buildings belong on ordinary islands.');
      if (!BUILDINGS.includes(command.building)) return reject('That building is not available.');
      if (island.building === command.building) return reject('This island already has that building.');
      if (state.timber < RULES.build) return reject('A building needs 3 timber.');
      island.building = command.building; next.timber -= RULES.build;
      message = `${island.name} opens a ${command.building === 'garden' ? 'tide garden' : command.building === 'grove' ? 'driftwood grove' : 'breakwater'}.`;
      break;
    case 'anchor':
      if (island.kind === 'heart') return reject('The Heart is already permanently rooted.');
      if (island.anchored) return reject('This island is already anchored for this tide.');
      if (state.timber < RULES.anchor) return reject('An anchor needs 1 timber.');
      island.anchored = true; next.timber -= RULES.anchor;
      message = `${island.name} will sit this tide out.`;
      break;
    case 'nourish':
      if (island.kind === 'heart') return reject('Nourish the bell or an ordinary island.');
      if (island.growth >= RULES.maxGrowth) return reject('This island is fully grown.');
      if (island.nourished) return reject('Nourishment is already waiting for a safe, fed tide.');
      if (state.food < RULES.nourish) return reject('Nourishment needs 2 food.');
      island.nourished = true; next.food -= RULES.nourish;
      message = `${island.name} is ready to grow on a safe, fed tide.`;
      break;
    default:
      return reject('That action is not available.');
  }
  next.actions -= 1;
  next.log = [...next.log, message].slice(-12);
  return { state: next };
}

function resolveMovement(state: GameState): Forecast['moves'] {
  const occupants = new Map(state.islands.map(island => [key(island), island.id]));
  const targets = new Map<string, Hex>();
  const counts = new Map<string, number>();
  for (const island of state.islands) {
    const current = currentAt(state, island);
    if (same(current, STILL)) continue;
    const target = plus(island, current);
    targets.set(island.id, target);
    counts.set(key(target), (counts.get(key(target)) ?? 0) + 1);
  }
  const results = new Map<string, boolean>();
  const canMove = (id: string, visiting = new Set<string>()): boolean => {
    if (results.has(id)) return results.get(id)!;
    const target = targets.get(id);
    if (!target || !isInBounds(target) || counts.get(key(target)) !== 1 || visiting.has(id)) return false;
    visiting.add(id);
    const occupant = occupants.get(key(target));
    const allowed = !occupant || canMove(occupant, visiting);
    visiting.delete(id);
    results.set(id, allowed);
    return allowed;
  };
  return state.islands.flatMap(island => {
    const target = targets.get(island.id);
    if (!target) return [];
    return [{ id: island.id, from: { q: island.q, r: island.r }, to: target, blocked: !canMove(island.id) }];
  });
}

export function resolveTide(state: GameState): Forecast {
  const weather = getWeather(state);
  if (state.status !== 'playing') return { state, moves: [], foodDelta: 0, timberDelta: 0, production: { food: 0, timber: 0 }, rations: 0, weather, shelteredIds: state.islands.filter(island => isSheltered(state, island, weather)).map(island => island.id), connectedIds: getConnectedIds(state), events: [] };
  const next = copy(state);
  const moves = resolveMovement(state);
  const events: string[] = [];
  for (const move of moves) {
    if (move.blocked) continue;
    const island = next.islands.find(item => item.id === move.id)!;
    island.q = move.to.q; island.r = move.to.r;
  }
  const moved = moves.filter(move => !move.blocked).length;
  if (moved) events.push(`${moved} island${moved === 1 ? '' : 's'} followed the current.`);
  const shelteredIds = next.islands.filter(island => isSheltered(next, island, weather)).map(island => island.id);
  for (const island of next.islands) {
    island.stress = shelteredIds.includes(island.id) ? Math.max(0, island.stress - 1) : Math.min(5, island.stress + weather.strength);
  }
  let foodProduced = 0;
  let timberProduced = 0;
  for (const island of next.islands) {
    const stats = getIslandStats(next, island.id);
    foodProduced += stats.food; timberProduced += stats.timber;
  }
  const fed = next.food + foodProduced >= RULES.rations;
  next.food = Math.max(0, next.food + foodProduced - RULES.rations);
  next.timber += timberProduced;
  events.push(`Gardens supplied ${foodProduced} food; groves supplied ${timberProduced} timber. The town ate ${RULES.rations}.`);
  if (!fed) { next.integrity -= 1; events.push('An empty pantry cost the Heart 1 integrity. Growth waits.'); }
  const heart = next.islands.find(island => island.kind === 'heart');
  if (heart && heart.stress >= RULES.stressLimit) { next.integrity -= 1; events.push('The exposed Heart lost 1 integrity to sea pressure.'); }
  for (const island of next.islands) {
    if (fed && island.nourished && island.growth < RULES.maxGrowth && island.stress < RULES.stressLimit && shelteredIds.includes(island.id)) {
      island.growth += 1; island.nourished = false;
      events.push(island.kind === 'bell' && island.growth === RULES.maxGrowth ? state.voyageRules === 'moonwake' ? 'The bell has flowered. Bring it through the late currents; it needs a sheltered connection home on tide 8.' : 'The bell has flowered. Keep it connected to the Heart for the final tide.' : `${island.name} grew to stage ${island.growth} of 3.`);
    }
    island.anchored = false;
  }
  next.integrity = Math.max(0, next.integrity);
  const connectedIds = getConnectedIds(next);
  if (next.integrity === 0) { next.status = 'lost'; events.push('The Heart went quiet. A fresh sea is waiting.'); }
  else if (state.tide >= state.maxTides) {
    const conditions = getVictoryConditions(next);
    const won = conditions.ready;
    next.status = won ? 'won' : 'lost';
    events.push(won ? 'The bell rings. The Moon agrees to an extension. You saved this unreasonable archipelago.' : !conditions.grown || !conditions.connected ? 'The final tide arrived before the bell was grown and connected. The Moon politely declines.' : !conditions.sheltered ? 'The bell reached home, but the final squall drowned its voice. It needed shelter.' : 'The bell reached shelter with too much stress to ring. It needed time to recover.');
  } else next.tide += 1;
  next.actions = next.status === 'playing' ? getActionBudget(next) : 0;
  next.whaleTowedId = null;
  next.log = [...next.log, `Tide ${state.tide}: ${weather.name}.`, ...events].slice(-12);
  return { state: next, moves, foodDelta: next.food - state.food, timberDelta: next.timber - state.timber, production: { food: foodProduced, timber: timberProduced }, rations: RULES.rations, weather, shelteredIds, connectedIds, events };
}

export function forecastTide(state: GameState): Forecast { return resolveTide(copy(state)); }

/** A complete, command-only reference voyage for the introductory seed. */
export const FIRST_LIGHT_SOLUTION: Command[][] = [
  [{ type: 'tow', id: 'bell', to: { q: 2, r: -1 } }, { type: 'nourish', id: 'bell' }, { type: 'anchor', id: 'bell' }],
  [{ type: 'nourish', id: 'bell' }, { type: 'tow', id: 'bell', to: { q: 1, r: -1 } }],
  [{ type: 'nourish', id: 'bell' }], [], [{ type: 'anchor', id: 'bell' }], [], [{ type: 'anchor', id: 'bell' }], [],
];
