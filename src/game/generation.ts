import type { Building, Command, CommandResult, Forecast, GameState, Hex } from './types';

/** Inject the production rules so generation never becomes a second simulator. */
export type OpeningEngine = {
  applyCommand: (state: GameState, command: Command) => CommandResult;
  resolveTide: (state: GameState) => Forecast;
};

export type GeneratedOpening = {
  state: GameState;
  solution: Command[][];
  family: string;
  summary: string;
  attempts: number;
};

type CurrentState = GameState & { currentRotation?: number };
const DIRECTIONS: Hex[] = [{ q: 1, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 }, { q: -1, r: 0 }, { q: -1, r: 1 }, { q: 0, r: 1 }];
const radius = ({ q, r }: Hex) => Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
const key = ({ q, r }: Hex) => `${q},${r}`;
const cloneState = (state: GameState): GameState => structuredClone(state);
const cloneOpening = (opening: GeneratedOpening): GeneratedOpening => structuredClone(opening);
const cache = new WeakMap<OpeningEngine['resolveTide'], WeakMap<OpeningEngine['applyCommand'], Map<string, GeneratedOpening>>>();

const FAMILIES: { name: string; buildings: (Building | null)[] }[] = [
  { name: 'Garden chain', buildings: ['garden', 'garden', 'grove', null, null] },
  { name: 'Timber flotilla', buildings: ['garden', 'grove', 'grove', null, null] },
  { name: 'Sheltered inlet', buildings: ['garden', 'grove', 'breakwater', null, null] },
  { name: 'Scattered orchards', buildings: ['garden', 'garden', 'grove', 'breakwater', null] },
];

function randomFor(seed: string): () => number {
  let n = 2166136261;
  for (const char of `opening-v1:${seed}`) n = Math.imul(n ^ char.charCodeAt(0), 16777619);
  return () => {
    n += 0x6D2B79F5;
    let t = Math.imul(n ^ n >>> 15, 1 | n);
    t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const CELLS: Hex[] = [];
for (let q = -4; q <= 4; q++) {
  for (let r = -4; r <= 4; r++) if (radius({ q, r }) > 0 && radius({ q, r }) <= 4) CELLS.push({ q, r });
}

function candidate(template: GameState, random: () => number): { state: GameState; family: string } {
  const state: CurrentState = cloneState(template);
  const family = FAMILIES[Math.floor(random() * FAMILIES.length)];
  const bellRadius = 2 + Math.floor(random() * 3);
  const bell = shuffled(CELLS.filter(cell => radius(cell) === bellRadius), random)[0];
  const occupied = new Set(['0,0', key(bell)]);
  const ordinary = state.islands.filter(island => island.kind === 'ordinary');
  const buildings = shuffled(family.buildings, random);
  const positions: Hex[] = [];
  // One near shore offers shelter and a useful grove site. Others create a genuinely different board.
  for (let i = 0; i < ordinary.length; i++) {
    const choices = CELLS.filter(cell => !occupied.has(key(cell)) && (i === 0 ? radius(cell) === 1 : radius(cell) <= 3));
    const position = shuffled(choices, random)[0];
    occupied.add(key(position));
    positions.push(position);
  }
  for (const island of state.islands) {
    if (island.kind === 'heart') Object.assign(island, { q: 0, r: 0 });
    else if (island.kind === 'bell') Object.assign(island, bell);
    else {
      const index = ordinary.findIndex(item => item.id === island.id);
      Object.assign(island, positions[index], { building: buildings[index] });
    }
  }
  state.currentRotation = Math.floor(random() * 6);
  return { state, family: family.name };
}

/** Shortest unoccupied, legal tow route into the Heart's neighboring water. */
function routeToHeart(state: GameState): Hex[] | null {
  const bell = state.islands.find(island => island.kind === 'bell');
  if (!bell) return null;
  const blocked = new Set(state.islands.filter(island => island.id !== bell.id).map(key));
  const visited = new Set([key(bell)]);
  const queue: { at: Hex; path: Hex[] }[] = [{ at: bell, path: [] }];
  for (let index = 0; index < queue.length; index++) {
    const current = queue[index];
    if (radius(current.at) === 1) return current.path;
    if (current.path.length >= state.actions) continue;
    for (const direction of DIRECTIONS) {
      const next = { q: current.at.q + direction.q, r: current.at.r + direction.r };
      if (radius(next) > 4 || blocked.has(key(next)) || visited.has(key(next))) continue;
      visited.add(key(next));
      queue.push({ at: next, path: [...current.path, next] });
    }
  }
  return null;
}

/**
 * Construct a small ordinary-command witness, then accept it only after all eight real tides win.
 * This is bounded route construction, not a search tree on the UI thread. The safe inner ring is
 * a consequence of the chapter's actual currents; if that rule changes, verification rejects it.
 */
function winningRoute(opening: GameState, engine: OpeningEngine): Command[][] | null {
  let state = cloneState(opening);
  const bellId = state.islands.find(island => island.kind === 'bell')?.id;
  const path = routeToHeart(state);
  if (!bellId || !path) return null;
  const solution: Command[][] = [];
  for (let tide = 1; tide <= opening.maxTides; tide++) {
    if (state.status !== 'playing') return null;
    const commands: Command[] = [];
    const perform = (command: Command): boolean => {
      const result = engine.applyCommand(state, command);
      if (result.error) return false;
      state = result.state;
      commands.push(command);
      return true;
    };
    if (tide === 1) {
      for (const to of path) if (!perform({ type: 'tow', id: bellId, to })) return null;
    }
    if (state.actions && state.islands.filter(island => island.building === 'garden').length < 2) {
      // Pick the build that actually supplies the most food after drift and shelter are resolved.
      const builds = state.islands.filter(island => island.kind === 'ordinary' && island.building !== 'garden')
        .map(island => {
          const command: Command = { type: 'build', id: island.id, building: 'garden' };
          const result = engine.applyCommand(state, command);
          return { command, error: result.error, food: result.error ? -Infinity : engine.resolveTide(result.state).state.food, empty: island.building === null };
        }).filter(build => !build.error)
        .sort((a, b) => b.food - a.food || Number(b.empty) - Number(a.empty));
      if (builds[0]) perform(builds[0].command);
    }
    const bell = state.islands.find(island => island.id === bellId)!;
    if (state.actions && bell.growth < 3 && !bell.nourished) perform({ type: 'nourish', id: bellId });
    solution.push(commands);
    state = engine.resolveTide(state).state;
  }
  return state.status === 'won' ? solution : null;
}

/** Player-facing differences only: never reveal the solution or promise a difficulty rating. */
export function describeOpening(state: GameState): string {
  if (state.seed === 'first-light') return 'First light · an introductory sea';
  const bell = state.islands.find(island => island.kind === 'bell');
  const gardens = state.islands.filter(island => island.building === 'garden').length;
  const groves = state.islands.filter(island => island.building === 'grove').length;
  const bearings = ['eastward', 'northeastward', 'northwestward', 'westward', 'southwestward', 'southeastward'];
  const bearing = bearings[(state as CurrentState).currentRotation ?? 0];
  return `Bell ${bell ? radius(bell) : '?'} hexes from the Heart · ${gardens} garden${gardens === 1 ? '' : 's'}, ${groves} grove${groves === 1 ? '' : 's'} · ${bearing} current pattern`;
}

/** Generate once per seed/template and return independent copies so restart and undo cannot poison it. */
export function generateOpening(template: GameState, engine: OpeningEngine): GeneratedOpening {
  let ruleSets = cache.get(engine.resolveTide);
  if (!ruleSets) { ruleSets = new WeakMap(); cache.set(engine.resolveTide, ruleSets); }
  let entries = ruleSets.get(engine.applyCommand);
  if (!entries) { entries = new Map(); ruleSets.set(engine.applyCommand, entries); }
  const cacheKey = JSON.stringify(template);
  const cached = entries.get(cacheKey);
  if (cached) return cloneOpening(cached);
  const random = randomFor(template.seed);
  for (let attempt = 0; attempt <= 32; attempt++) {
    const selected = template.seed === 'first-light' || attempt === 32
      ? { state: cloneState(template), family: template.seed === 'first-light' ? 'First light' : 'Familiar shores' }
      : candidate(template, random);
    const solution = winningRoute(selected.state, engine);
    if (!solution) continue;
    const result: GeneratedOpening = { ...selected, solution, summary: describeOpening(selected.state), attempts: attempt + 1 };
    if (entries.size >= 64) entries.delete(entries.keys().next().value!);
    entries.set(cacheKey, cloneOpening(result));
    return cloneOpening(result);
  }
  throw new Error('Could not verify a winning route for this sea. The opening rules need to be checked.');
}
