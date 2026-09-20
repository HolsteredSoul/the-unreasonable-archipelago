import { applyCommand, BOARD_RADIUS, DIRECTIONS, forecastTide, isInBounds } from '../game';
import type { Building, Command, Forecast, GameState, Hex, Island, Weather } from '../game/types';
import { sameHex, shelterCells } from './planning';

export type WeatherIsland = {
  id: string;
  name: string;
  kind: Island['kind'];
  from: Hex;
  /** Actual position after drift; a blocked move keeps its original position. */
  to: Hex;
  stressBefore: number;
  stressAfter: number;
  stressDelta: number;
  sheltered: boolean;
  /** Physical shelter sources, including the island itself for a breakwater. */
  blockerIds: string[];
  /** Exact cells this island protects after drift, using its pre-growth reach. */
  shelterCells: Hex[];
};

export type WeatherPresentation = {
  tide: number;
  weather: Weather;
  storm: boolean;
  direction: number;
  directionHex: Hex;
  strength: number;
  islands: WeatherIsland[];
  /** All safe cells this tide. Calm seas protect every cell without a blocker. */
  shelteredCells: { hex: Hex; blockerIds: string[] }[];
  forecast: Forecast;
};

export type BreakwaterPreview = {
  command: Extract<Command, { type: 'build' }>;
  /** State after paying for the building, before advancing the tide. */
  state: GameState;
  forecast: Forecast;
  presentation: WeatherPresentation;
  /** Islands physically covered by this breakwater, including itself. */
  protectedIds: string[];
  /** Covered islands that were exposed in the unmodified tide forecast. */
  newlyProtectedIds: string[];
  cost: { actions: number; timber: number };
  replacedBuilding: Building | null;
};

/** Use the resolver's weather and shelter result, never the next tide's weather. */
export function getWeatherPresentation(state: GameState, forecast = forecastTide(state)): WeatherPresentation {
  const weather = forecast.weather;
  const afterById = new Map(forecast.state.islands.map(island => [island.id, island]));
  const sources = state.islands.map(before => {
    const after = afterById.get(before.id) ?? before;
    // Growth happens after shelter/stress. A newly grown breakwater reaches farther next tide.
    const moved = { ...before, q: after.q, r: after.r };
    const cells = shelterCells(moved, weather.direction);
    if (moved.building === 'breakwater') cells.unshift({ q: moved.q, r: moved.r });
    return { id: before.id, cells };
  });
  const blockersAt = (hex: Hex) => sources.filter(source => source.cells.some(cell => sameHex(cell, hex))).map(source => source.id);
  const islands = state.islands.map((before, index): WeatherIsland => {
    const after = afterById.get(before.id) ?? before;
    const to = { q: after.q, r: after.r };
    return {
      id: before.id, name: before.name, kind: before.kind, from: { q: before.q, r: before.r }, to,
      stressBefore: before.stress, stressAfter: after.stress, stressDelta: after.stress - before.stress,
      sheltered: forecast.shelteredIds.includes(before.id),
      blockerIds: blockersAt(to), shelterCells: sources[index].cells,
    };
  });
  const shelteredCells: WeatherPresentation['shelteredCells'] = [];
  for (let q = -BOARD_RADIUS; q <= BOARD_RADIUS; q++) for (let r = -BOARD_RADIUS; r <= BOARD_RADIUS; r++) {
    const hex = { q, r };
    if (!isInBounds(hex)) continue;
    const blockerIds = blockersAt(hex);
    if (!weather.storm || blockerIds.length > 0) shelteredCells.push({ hex, blockerIds });
  }
  return {
    tide: state.tide, weather, storm: weather.storm, direction: weather.direction,
    directionHex: { ...DIRECTIONS[weather.direction] }, strength: weather.strength,
    islands, shelteredCells, forecast,
  };
}

/** Preview a real, paid build without changing the player's state. */
export function previewBreakwater(state: GameState, islandId: string): BreakwaterPreview | null {
  const command: BreakwaterPreview['command'] = { type: 'build', id: islandId, building: 'breakwater' };
  const result = applyCommand(state, command);
  if (result.error) return null;
  const forecast = forecastTide(result.state);
  const presentation = getWeatherPresentation(result.state, forecast);
  const baseline = forecastTide(state);
  const protectedIds = presentation.islands.filter(island => island.blockerIds.includes(islandId)).map(island => island.id);
  return {
    command, state: result.state, forecast, presentation, protectedIds,
    newlyProtectedIds: protectedIds.filter(id => !baseline.shelteredIds.includes(id)),
    cost: { actions: state.actions - result.state.actions, timber: state.timber - result.state.timber },
    replacedBuilding: state.islands.find(island => island.id === islandId)!.building,
  };
}
