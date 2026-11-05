/** Offline evaluation fixtures and bounded searches. Not imported by the player UI. */
import { applyCommand, getLegalTowTargets, resolveTide } from './index';
import { campaignSolution, createCampaignGame } from './campaign';
import type { Command, GameState } from './types';

export type StrategyRoute = {
  map: number;
  id: string;
  description: string;
  commands: Command[][];
};
export type RouteTide = {
  tide: number;
  commands: number;
  unusedActions: number;
  food: number;
  timber: number;
  integrity: number;
  ordinaryGrowth: number;
  queuedOrdinaryGrowth: number;
  production: { food: number; timber: number };
  positions: { id: string; kind: string; q: number; r: number }[];
};
export type RouteAudit = {
  state: GameState;
  tides: RouteTide[];
  counts: Record<Command['type'], number>;
  minFood: number;
  minTimber: number;
  ordinaryGrowth: number;
  unusedActions: number;
};
export type SearchLimits = { maxExpansions: number; beamWidth: number };
export type RouteSearch = {
  status: 'found' | 'unresolved';
  reason: string;
  expansions: number;
  limits: SearchLimits;
  route?: StrategyRoute;
};
const ordinaryGrowth = (state: GameState) => state.islands.filter(i => i.kind === 'ordinary').reduce((sum, i) => sum + i.growth, 0);
const queuedGrowth = (state: GameState) => state.islands.filter(i => i.kind === 'ordinary' && i.nourished).length;
const signature = (state: GameState) => JSON.stringify({ ...state, log: [] });
const checkLimits = (limits: SearchLimits): SearchLimits => {
  if (!Number.isInteger(limits.maxExpansions) || limits.maxExpansions < 0 || limits.maxExpansions > 50000 ||
      !Number.isInteger(limits.beamWidth) || limits.beamWidth < 1 || limits.beamWidth > 128) {
    throw new RangeError('Use 0–50000 expansions and a beam width of 1–128.');
  }
  return { ...limits };
};

/** Replay every command from a fresh authored opening, rejecting incomplete or illegal traces. */
export function auditStrategyRoute(map: number, commands: Command[][]): RouteAudit {
  let state = createCampaignGame(map);
  if (commands.length !== state.maxTides) throw new Error('A route must include all eight tides.');
  const tides: RouteTide[] = [];
  const counts: RouteAudit['counts'] = { tow: 0, whaleTow: 0, build: 0, anchor: 0, nourish: 0 };
  let minFood = state.food;
  let minTimber = state.timber;
  for (const plan of commands) {
    if (state.status !== 'playing') throw new Error('Route continues after the voyage ended.');
    const tide = state.tide;
    for (const command of plan) {
      const result = applyCommand(state, command);
      if (result.error) throw new Error(`Map ${map}, tide ${tide}: ${result.error} (${JSON.stringify(command)})`);
      state = result.state;
      counts[command.type]++;
      minFood = Math.min(minFood, state.food);
      minTimber = Math.min(minTimber, state.timber);
    }
    const unusedActions = state.actions;
    const forecast = resolveTide(state);
    state = forecast.state;
    minFood = Math.min(minFood, state.food);
    minTimber = Math.min(minTimber, state.timber);
    tides.push({ tide, commands: plan.length, unusedActions, food: state.food, timber: state.timber,
      integrity: state.integrity, ordinaryGrowth: ordinaryGrowth(state), queuedOrdinaryGrowth: queuedGrowth(state),
      production: forecast.production, positions: state.islands.map(({ id, kind, q, r }) => ({ id, kind, q, r })) });
  }
  return { state, tides, counts, minFood, minTimber, ordinaryGrowth: ordinaryGrowth(state),
    unusedActions: tides.reduce((sum, tide) => sum + tide.unusedActions, 0) };
}

type Node = { state: GameState; commands: Command[][] };
const applyPlan = (state: GameState, commands: Command[]): GameState | undefined => {
  for (const command of commands) {
    const result = applyCommand(state, command);
    if (result.error) return;
    state = result.state;
  }
  return state;
};

const canCompleteWitness = (state: GameState, remaining: Command[][]): boolean => {
  for (const commands of remaining) {
    if (state.status !== 'playing') return false;
    const planned = applyPlan(state, commands);
    if (!planned) return false;
    state = resolveTide(planned).state;
  }
  return state.status === 'won';
};

/**
 * Extend the existing witness (optionally with one specified extra garden) using
 * ordinary Nourishes. Enumerate subsets in
 * island order (no redundant permutations), retaining a bounded beam after each
 * tide. Retain only candidates that can still finish the unchanged witness, so
 * early optional spending cannot crowd all safe plans out of the beam.
 * A failed/capped search is unresolved, never evidence of impossibility.
 * An expansion is one resolved candidate tide (including an empty extra plan),
 * with at most seven further tide resolutions to verify its baseline completion.
 */
export function searchMedalRoute(map: number, requested: SearchLimits = { maxExpansions: 12000, beamWidth: 48 }, investment?: { tide: number; id: string }): RouteSearch {
  const limits = checkLimits(requested);
  const baseline = campaignSolution(map);
  if (investment) {
    if (!Number.isInteger(investment.tide) || investment.tide < 1 || investment.tide > 8) throw new RangeError('Choose an investment tide from 1 to 8.');
    baseline[investment.tide - 1].push({ type: 'build', id: investment.id, building: 'garden' });
  }
  let beam: Node[] = [{ state: createCampaignGame(map), commands: [] }];
  let expansions = 0;
  for (let tide = 0; tide < 8; tide++) {
    const candidates: (Node & { score: number })[] = [];
    const seen = new Set<string>();
    for (const node of beam) {
      const planned = applyPlan(node.state, baseline[tide]);
      if (!planned) continue;
      const ids = planned.islands.filter(i => i.kind === 'ordinary' && i.growth < 3 && !i.nourished).map(i => i.id);
      const visit = (state: GameState, extras: Command[], from: number) => {
        if (expansions >= limits.maxExpansions) return;
        expansions++;
        const next = resolveTide(state).state;
        const commands = [...node.commands, [...baseline[tide], ...extras]];
        const key = signature(next);
        if (next.status !== 'lost' && !seen.has(key) && canCompleteWitness(next, baseline.slice(tide + 1))) {
          seen.add(key);
          const gardens = next.islands.filter(i => i.building === 'garden').reduce((sum, i) => sum + i.growth, 0);
          const score = ordinaryGrowth(next) * 100 + queuedGrowth(next) * 70 + gardens * 12 + next.food * 3 + next.integrity * 15;
          candidates.push({ state: next, commands, score });
        }
        if (!state.actions || ordinaryGrowth(state) + queuedGrowth(state) >= 6) return;
        for (let i = from; i < ids.length && expansions < limits.maxExpansions; i++) {
          const command: Command = { type: 'nourish', id: ids[i] };
          const applied = applyCommand(state, command);
          if (!applied.error) visit(applied.state, [...extras, command], i + 1);
        }
      };
      visit(planned, [], 0);
      if (expansions >= limits.maxExpansions) break;
    }
    const winner = candidates.find(n => n.state.status === 'won' && ordinaryGrowth(n.state) >= 6);
    if (winner) return { status: 'found', reason: 'A legal six-growth winning extension of the authored witness.', expansions, limits,
      route: { map, id: `map-${map}-flourishing`, description: investment
        ? `Build a garden on ${investment.id} at tide ${investment.tide}, then nourish ordinary shores while completing every bell.`
        : 'Nourish ordinary shores while completing every bell.', commands: winner.commands } };
    if (expansions >= limits.maxExpansions) return { status: 'unresolved', reason: 'Expansion cap reached; other routes were not ruled out.', expansions, limits };
    candidates.sort((a, b) => b.score - a.score);
    beam = candidates.slice(0, limits.beamWidth);
    if (!beam.length) return { status: 'unresolved', reason: 'No retained witness extension survived; other strategies were not searched.', expansions, limits };
  }
  return { status: 'unresolved', reason: 'The retained witness extensions did not reach six growth; other strategies were not searched.', expansions, limits };
}

/** Genuine changed bell trajectories plus a new spatial command; not a redundant-anchor omission. */
export function lateStrategyDifference(map: number, commands: Command[][]) {
  const baselineCommands = campaignSolution(map);
  const baseline = auditStrategyRoute(map, baselineCommands);
  const candidate = auditStrategyRoute(map, commands);
  const changedBells = new Set<string>();
  for (const tideIndex of [4, 6]) {
    for (const bell of baseline.tides[tideIndex].positions.filter(i => i.kind === 'bell')) {
      const other = candidate.tides[tideIndex].positions.find(i => i.id === bell.id)!;
      if (bell.q !== other.q || bell.r !== other.r) changedBells.add(bell.id);
    }
  }
  const baselineSpatial = new Set(baselineCommands.slice(4).flat().filter(c => c.type === 'tow' || c.type === 'build').map(c => JSON.stringify(c)));
  const newSpatialCommands = commands.slice(4).flat().filter(c => (c.type === 'tow' || c.type === 'build') && !baselineSpatial.has(JSON.stringify(c))).length;
  return { changedBells: [...changedBells], newSpatialCommands, material: changedBells.size > 0 && newSpatialCommands > 0 };
}

/**
 * Remove bell anchoring at selected late tides, keep other pre-finale commands,
 * then search only the final planning tide using Tow, Breakwater, and bell Nourish.
 * One expansion is one candidate command application. No global optimality claim.
 */
export function searchLateRoute(map: number, releaseTides: readonly number[] = [5, 7], requested: SearchLimits = { maxExpansions: 8000, beamWidth: 24 }, releasedBellIds?: readonly string[]): RouteSearch {
  const limits = checkLimits(requested);
  if (!releaseTides.length || releaseTides.some(tide => tide !== 5 && tide !== 7)) throw new RangeError('Release bell anchors on tide 5 and/or 7.');
  const original = campaignSolution(map);
  let start = createCampaignGame(map);
  const bellIds = start.islands.filter(i => i.kind === 'bell').map(i => i.id);
  if (releasedBellIds && (!releasedBellIds.length || releasedBellIds.some(id => !bellIds.includes(id)))) throw new RangeError('Release an existing bell.');
  const released = releasedBellIds ?? bellIds;
  const prefix = original.slice(0, 7).map((commands, index) => commands.filter(c => !(releaseTides.includes(index + 1) && c.type === 'anchor' && released.includes(c.id))));
  for (const plan of prefix) {
    const planned = applyPlan(start, plan);
    if (!planned || start.status !== 'playing') return { status: 'unresolved', reason: 'This released-anchor prefix invalidates the existing continuation.', expansions: 0, limits };
    start = resolveTide(planned).state;
  }
  let beam: { state: GameState; commands: Command[] }[] = [{ state: start, commands: [] }];
  const seen = new Set([signature(start)]);
  let expansions = 0;
  for (let depth = 0; depth < start.actions; depth++) {
    const candidates: { state: GameState; commands: Command[]; score: number }[] = [];
    for (const node of beam) {
      const commands: Command[] = node.state.islands.flatMap(island => {
        const choices: Command[] = getLegalTowTargets(node.state, island.id).map(to => ({ type: 'tow', id: island.id, to }));
        if (island.kind === 'ordinary' && island.building !== 'breakwater') choices.push({ type: 'build', id: island.id, building: 'breakwater' });
        if (island.kind === 'bell' && island.growth < 3 && !island.nourished) choices.push({ type: 'nourish', id: island.id });
        return choices;
      });
      for (const command of commands) {
        if (expansions >= limits.maxExpansions) return { status: 'unresolved', reason: 'Final-tide expansion cap reached; other routes were not ruled out.', expansions, limits };
        expansions++;
        const result = applyCommand(node.state, command);
        if (result.error) continue;
        const key = signature(result.state);
        if (seen.has(key)) continue;
        seen.add(key);
        const sequence = [...node.commands, command];
        const forecast = resolveTide(result.state);
        const fullRoute = [...prefix, sequence];
        if (forecast.state.status === 'won' && lateStrategyDifference(map, fullRoute).material) {
          return { status: 'found', reason: 'Changed late bell trajectories and a new spatial finish, replayable from the opening.', expansions, limits,
            route: { map, id: `map-${map}-ride-${releaseTides.join('-')}-${released.join('-')}`, description: `Let ${released.join(', ')} ride tide${releaseTides.length > 1 ? 's' : ''} ${releaseTides.join(' and ')}; rebuild a safe final connection.`, commands: fullRoute } };
        }
        if (forecast.state.status === 'lost' && forecast.state.integrity === 0) continue;
        const bells = forecast.state.islands.filter(i => i.kind === 'bell');
        const score = bells.reduce((sum, bell) => sum + bell.growth * 100 + Number(forecast.connectedIds.includes(bell.id)) * 100
          + Number(forecast.shelteredIds.includes(bell.id)) * 110 + Number(bell.stress < 3) * 60 - bell.stress * 10
          - Math.max(Math.abs(bell.q), Math.abs(bell.r), Math.abs(bell.q + bell.r)) * 3, 0);
        candidates.push({ state: result.state, commands: sequence, score });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    beam = candidates.slice(0, limits.beamWidth);
    if (!beam.length) break;
  }
  return { status: 'unresolved', reason: 'The retained final-tide beam found no material alternative; this is not an impossibility proof.', expansions, limits };
}

const nourish = (id: string): Command => ({ type: 'nourish', id });
const tow = (id: string, q: number, r: number): Command => ({ type: 'tow', id, to: { q, r } });

/** Extra commands AFTER each reference tide's plan. No generated state or free resources. */
const MEDAL_ADDITIONS: readonly Command[][][] = [
  [[], [nourish('garden-west')], [nourish('garden-west')], [nourish('garden-south')],
    [nourish('garden-west'), nourish('north')], [nourish('garden-south')], [], []],
  [[], [nourish('garden-west'), nourish('grove')], [nourish('garden-west')], [nourish('grove')],
    [], [nourish('garden-west'), nourish('grove')], [], []],
  [[nourish('shore-1'), nourish('shore-2')], [], [], [nourish('shore-1'), nourish('shore-2')],
    [nourish('shore-1'), nourish('shore-2')], [], [], []],
  [[], [nourish('shore-1')], [], [nourish('shore-1')], [nourish('shore-4')],
    [nourish('shore-1'), nourish('shore-4')], [nourish('shore-5')], []],
  [[nourish('shore-1')], [nourish('shore-1')], [], [nourish('shore-1'), nourish('shore-2'), nourish('shore-5')],
    [nourish('shore-2')], [], [], []],
  [[], [{ type: 'build', id: 'shore-3', building: 'garden' }, nourish('shore-1')], [],
    [nourish('shore-1'), nourish('shore-3')], [nourish('shore-1'), nourish('shore-7')], [nourish('shore-3')], [], []],
  [[nourish('shore-1')], [], [], [], [nourish('shore-1'), nourish('shore-2')],
    [nourish('shore-1'), nourish('shore-8')], [nourish('shore-7')], []],
  [[], [], [], [], [nourish('shore-1')], [nourish('shore-1')],
    [nourish('shore-2'), nourish('shore-5')], [nourish('shore-5'), nourish('shore-6')]],
];

const LATE_VARIANTS: readonly { releases: Partial<Record<5 | 7, string[]>>; finish: Command[] }[] = [
  { releases: { 5: ['bell'], 7: ['bell'] }, finish: [tow('bell', 0, -1)] },
  { releases: { 5: ['bell'], 7: ['bell'] }, finish: [tow('bell', -1, 2), tow('bell', -1, 1)] },
  { releases: { 7: ['bell', 'bell-2'] }, finish: [tow('bell', 1, -1), tow('shore-3', 0, -1)] },
  { releases: { 5: ['bell', 'bell-2'], 7: ['bell', 'bell-2'] },
    finish: [tow('shore-1', -1, -1), tow('shore-1', 0, -2), tow('bell', -1, 1), tow('bell', 0, 1)] },
  { releases: { 5: ['bell'], 7: ['bell'] },
    finish: [tow('bell', 0, 1), tow('bell', -1, 1), tow('bell-2', 1, -1), tow('shore-6', 2, -2), tow('shore-1', 1, -2)] },
  { releases: { 7: ['bell', 'bell-2', 'bell-3'] },
    finish: [tow('shore-2', 0, -1), tow('shore-2', -1, 0), tow('shore-1', 1, 1)] },
  { releases: { 5: ['bell'], 7: ['bell'] },
    finish: [tow('bell', 1, 1), tow('bell-4', 0, -1), tow('shore-1', -2, 2), tow('shore-1', -1, 2), tow('shore-1', 0, 2), tow('shore-1', 1, 2)] },
  { releases: { 7: ['bell', 'bell-2', 'bell-3', 'bell-4'] },
    finish: [tow('bell-2', 1, 0), tow('bell', 1, 1), tow('shore-3', -1, -1), tow('shore-1', 3, -1), tow('shore-1', 2, -1), tow('shore-1', 1, -1)] },
];

/** Verified six-ordinary-growth wins, separate from the simpler teaching witnesses. */
export function campaignMedalRoute(map: number): StrategyRoute {
  const commands = campaignSolution(map); // Also validates map range.
  const extras = structuredClone(MEDAL_ADDITIONS[map - 1]);
  for (let tide = 0; tide < commands.length; tide++) commands[tide].push(...extras[tide]);
  return { map, id: `map-${map}-flourishing`, description: map === 6
    ? 'Build an extra tide-2 garden, then nourish ordinary shores while completing every bell.'
    : 'Nourish ordinary shores while completing every bell.', commands };
}

/** Verified late trajectories using fewer bell anchors and a different spatial finish. */
export function campaignLateRoute(map: number): StrategyRoute {
  const commands = campaignSolution(map);
  const variant = structuredClone(LATE_VARIANTS[map - 1]);
  const descriptions: string[] = [];
  for (const tide of [5, 7] as const) {
    const released = variant.releases[tide];
    if (!released) continue;
    commands[tide - 1] = commands[tide - 1].filter(c => !(c.type === 'anchor' && released.includes(c.id)));
    descriptions.push(`${released.join(', ')} on tide ${tide}`);
  }
  commands[7] = variant.finish;
  return { map, id: `map-${map}-ride`, description: `Release ${descriptions.join('; ')}; rebuild a safe final connection.`, commands };
}
