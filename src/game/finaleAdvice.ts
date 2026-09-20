import { applyCommand, DIRECTIONS, forecastTide, getLegalTowTargets, getWeather, isInBounds } from './index';
import type { Command, GameState, Hex } from './types';

export type FinaleAdvice = {
  bellId: string;
  name: string;
  /** These conditions describe the next tide, or the completed voyage without resolving it again. */
  grown: boolean;
  connected: boolean;
  sheltered: boolean;
  rested: boolean;
  stress: number;
  forecastStress: number;
  upstream: Hex;
  upstreamDirection: string;
  hint: string;
  /** Present only when this legal action makes the entire final-tide forecast a victory. */
  rescue?: Command;
};

const BEARINGS = ['East', 'Northeast', 'Northwest', 'West', 'Southwest', 'Southeast'];

function findRescue(state: GameState): Command | undefined {
  if (state.status !== 'playing' || state.tide !== state.maxTides || state.actions < 1) return;
  // Prefer moving the bell itself, then a supporting island, then replacing a building.
  const islands = [...state.islands].sort((a, b) => Number(b.kind === 'bell') - Number(a.kind === 'bell'));
  const candidates: Command[] = islands.flatMap(island => getLegalTowTargets(state, island.id).map(to => ({ type: 'tow' as const, id: island.id, to })));
  if (state.timber >= 3) for (const island of islands) {
    if (island.kind === 'ordinary' && island.building !== 'breakwater') candidates.push({ type: 'build', id: island.id, building: 'breakwater' });
  }
  return candidates.find(command => {
    const applied = applyCommand(state, command);
    return !applied.error && forecastTide(applied.state).state.status === 'won';
  });
}

function rescueHint(state: GameState, command: Command): string {
  const island = state.islands.find(item => item.id === command.id)!;
  if (command.type === 'tow') {
    const direction = DIRECTIONS.findIndex(hex => hex.q === command.to.q - island.q && hex.r === command.to.r - island.r);
    return `Tow ${island.name} ${BEARINGS[direction]} to (${command.to.q}, ${command.to.r}): 1 action + 1 food. Then advance the tide to win.`;
  }
  const replacement = island.building ? `, replacing its ${island.building === 'garden' ? 'tide garden' : 'driftwood grove'}` : '';
  return `Build a breakwater on ${island.name}${replacement}: 1 action + 3 timber. Then advance the tide to win.`;
}

/** Explain the real tide outcome, including recovery before the stress threshold is checked. */
export function getFinaleAdvice(state: GameState): FinaleAdvice[] {
  const forecast = forecastTide(state);
  const weather = getWeather(state);
  const direction = DIRECTIONS[weather.direction];
  const completed = state.status !== 'playing';
  const final = state.tide === state.maxTides;
  const requiresShelter = state.voyageRules === 'moonwake';
  const rescue = forecast.state.status === 'lost' ? findRescue(state) : undefined;
  return state.islands.filter(island => island.kind === 'bell').map(island => {
    const after = forecast.state.islands.find(item => item.id === island.id)!;
    const grown = after.growth === 3;
    const connected = forecast.connectedIds.includes(island.id);
    const sheltered = forecast.shelteredIds.includes(island.id);
    const rested = after.stress < 3;
    const upstream = { q: after.q - direction.q, r: after.r - direction.r };
    const upstreamDirection = BEARINGS[(weather.direction + 3) % 6];
    const reasons: string[] = [];
    if (!grown) reasons.push(`growth ${after.growth}/3`);
    if (!connected) reasons.push('no island chain to the Heart');
    if (requiresShelter && !sheltered) reasons.push('exposed to the squall');
    if (requiresShelter && !rested) reasons.push(`stress ${after.stress}/5 (must be below 3)`);
    if (forecast.state.integrity === 0) reasons.push('the Heart has no integrity left');

    let hint: string;
    if (completed) {
      hint = reasons.length ? `${island.name} could not ring: ${reasons.join('; ')}.` : `${island.name} ${state.status === 'won' ? 'rang' : 'was ready; another bell prevented victory'}.`;
      if (requiresShelter) hint += ` ${sheltered ? 'Sheltered' : 'Exposed'}; finished at ${after.stress}/5 stress.`;
    } else {
      const outcome = final ? (reasons.length ? 'will not ring' : 'is ready to ring') : (reasons.length ? 'still needs work after this tide' : 'meets the bell conditions after this tide');
      hint = `${island.name} ${outcome}${reasons.length ? `: ${reasons.join('; ')}` : ''}.`;
      if (requiresShelter) {
        hint += sheltered
          ? ` Shelter lowers stress ${island.stress} → ${after.stress}/5${rested ? '.' : '; one tide of recovery is not enough.'}`
          : ` Exposure raises stress ${island.stress} → ${after.stress}/5. ${isInBounds(upstream) ? `Put an island one hex ${upstreamDirection} at (${upstream.q}, ${upstream.r}), or use a breakwater farther upstream.` : `The shelter hex ${upstreamDirection} at (${upstream.q}, ${upstream.r}) is outside the reef; tow the bell toward shelter.`}`;
        if (!sheltered && final) hint += ' Anchoring stops drift, not the storm.';
      }
    }
    const bellRescue = reasons.length && rescue ? rescue : undefined;
    if (bellRescue) hint += ` ${rescueHint(state, bellRescue)}`;
    return { bellId: island.id, name: island.name, grown, connected, sheltered, rested, stress: island.stress, forecastStress: after.stress, upstream, upstreamDirection, hint, ...(bellRescue ? { rescue: bellRescue } : {}) };
  });
}
