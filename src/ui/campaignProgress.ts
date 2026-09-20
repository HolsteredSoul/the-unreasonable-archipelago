import type { GameState } from '../game/types';
import { getVictoryConditions } from '../game';

/** Only the next unlocked map advances the campaign; retries never remove a win. */
export function recordCampaignWin(completed: number, state: GameState): number {
  return state.status === 'won' && state.campaignMap === completed + 1 ? Math.min(8, completed + 1) : completed;
}

export function lossExplanation(state: GameState): string {
  if (state.integrity === 0) return 'The Heart fell silent. Keep the town fed and shelter the Heart before sea pressure reaches 3 stress.';
  if (state.voyageRules !== 'moonwake') return 'The eighth tide has passed. Every bell needed three growth stages and a chain of touching islands to the Heart. This older voyage keeps its original rules.';
  const conditions = getVictoryConditions(state);
  if (conditions.grown && conditions.connected) return conditions.sheltered
    ? 'You grew every bell and brought them home. They reached shelter with too much stress to ring. Shelter removes 1 stress per tide, so a badly stressed bell needs protection earlier.'
    : 'You grew every bell and brought them home. The final wind still reached an exposed bell. Connected islands count as a route home; shelter requires an island on the windward side. Anchors do not block the storm.';
  return 'The eighth tide has passed. Every bell needed three growth stages, a chain of touching islands to the Heart, shelter from the final wind, and less than 3 stress.';
}
