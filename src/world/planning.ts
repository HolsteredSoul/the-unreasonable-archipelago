import { BOARD_RADIUS, DIRECTIONS, getConnectedIds, getIslandStats } from '../game';
import type { Forecast, GameState, Hex, Island } from '../game/types';

const key = (hex: Hex) => `${hex.q},${hex.r}`;
export const hexDistance = (a: Hex, b: Hex) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r));
export const sameHex = (a: Hex, b: Hex) => a.q === b.q && a.r === b.r;

/** Production resolves after drift and stress, but before queued growth. */
export function tideProduction(state: GameState, forecast: Forecast, id: string) {
  const productionState: GameState = {
    ...forecast.state,
    tide: state.tide,
    islands: forecast.state.islands.map(island => ({ ...island, growth: state.islands.find(before => before.id === island.id)?.growth ?? island.growth })),
  };
  return getIslandStats(productionState, id);
}

/** Return an exact downwind ray; a wake is a cell guide, not a broad area bonus. */
export function shelterCells(island: Island, weatherDirection: number): Hex[] {
  const direction = DIRECTIONS[weatherDirection];
  const reach = island.building === 'breakwater' ? 2 + Math.floor(island.growth / 2) : 1;
  return Array.from({ length: reach }, (_, i) => ({ q: island.q + direction.q * (i + 1), r: island.r + direction.r * (i + 1) }))
    .filter(hex => hexDistance(hex, { q: 0, r: 0 }) <= BOARD_RADIUS);
}

/** Lowest number of empty cells between the bell and any Heart-connected island. */
export function missingConnection(state: GameState, bellId?: string): Hex[] {
  const bell = state.islands.find(island => island.kind === 'bell' && (!bellId || island.id === bellId));
  const connectedIds = getConnectedIds(state);
  if (!bell || connectedIds.includes(bell.id)) return [];
  const goals = new Set(state.islands.filter(island => connectedIds.includes(island.id)).map(key));
  const occupied = new Set(state.islands.map(key));
  const open: { hex: Hex; cost: number; path: Hex[] }[] = [{ hex: bell, cost: 0, path: [bell] }];
  const costs = new Map([[key(bell), 0]]);
  while (open.length) {
    open.sort((a, b) => a.cost - b.cost || a.path.length - b.path.length);
    const current = open.shift()!;
    if (goals.has(key(current.hex))) return current.path;
    if (current.cost !== costs.get(key(current.hex))) continue;
    for (const direction of DIRECTIONS) {
      const hex = { q: current.hex.q + direction.q, r: current.hex.r + direction.r };
      if (hexDistance(hex, { q: 0, r: 0 }) > BOARD_RADIUS) continue;
      const cost = current.cost + (occupied.has(key(hex)) ? 0 : 1);
      if (cost >= (costs.get(key(hex)) ?? Infinity)) continue;
      costs.set(key(hex), cost);
      open.push({ hex, cost, path: [...current.path, hex] });
    }
  }
  return [];
}

/** A separate path for every disconnected bell; callers may combine overlapping chart marks. */
export function missingConnections(state: GameState): { id: string; path: Hex[] }[] {
  return state.islands.filter(island => island.kind === 'bell').map(island => ({
    id: island.id, path: missingConnection(state, island.id),
  })).filter(item => item.path.length > 0);
}
