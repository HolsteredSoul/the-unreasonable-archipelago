import type { GameState } from '../game/types';

/** Only the next unlocked map advances the campaign; retries never remove a win. */
export function recordCampaignWin(completed: number, state: GameState): number {
  return state.status === 'won' && state.campaignMap === completed + 1 ? Math.min(8, completed + 1) : completed;
}

export function lossExplanation(state: GameState): string {
  if (state.integrity === 0) return 'The Heart fell silent. Keep the town fed and shelter the Heart before sea pressure reaches 3 stress.';
  if (state.voyageRules !== 'moonwake') return 'The eighth tide has passed. Every bell needed three growth stages and a chain of touching islands to the Heart. This older voyage keeps its original rules.';
  return 'The eighth tide has passed. Every bell needed three growth stages, a chain of touching islands to the Heart, shelter from the final wind, and less than 3 stress.';
}
