import type { SavedSession } from './storage';
import type { GameState } from '../game/types';

/** Restore the actual beginning of the teaching map's final planning turn. */
export function finalTideCheckpoint(session: SavedSession, resolved: GameState): GameState | undefined {
  const state = session.state;
  return state.campaignMap === 1 && state.tide === state.maxTides && resolved.status === 'lost'
    ? session.undo[0] ?? state : undefined;
}

export function replanFinalTide(session: SavedSession): SavedSession | null {
  if (session.state.campaignMap !== 1 || session.state.status !== 'lost' || !session.finaleCheckpoint) return null;
  return { ...session, state: session.finaleCheckpoint, undo: [], finaleCheckpoint: undefined };
}
