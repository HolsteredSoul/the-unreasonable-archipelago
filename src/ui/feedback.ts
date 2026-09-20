import type { Command, GameState } from '../game/types';

export type ActionName = Command['type'] | 'advance';
export const ACTION_COPY: Record<ActionName, { title: string; detail: string }> = {
  nourish: { title: 'Nourish −2 food now', detail: 'Queues one growth stage for the next safe, fed tide.' },
  tow: { title: 'Tow −1 food now', detail: 'Moves this island one hex. The coming current still applies.' },
  build: { title: 'Build −3 timber now', detail: 'Gardens make food; groves make timber; breakwaters shelter islands.' },
  anchor: { title: 'Anchor −1 timber now', detail: 'Stops drift for one tide. It does not block storm damage.' },
  advance: { title: 'Advance tide −2 food in rations', detail: 'Islands produce first, then the town eats. Nourishment is a separate spend.' },
};
export function balanceChange(before: GameState, after: GameState): string {
  const parts: string[] = [];
  if (before.food !== after.food) parts.push(`Food ${before.food} → ${after.food}`);
  if (before.timber !== after.timber) parts.push(`Timber ${before.timber} → ${after.timber}`);
  return parts.join(' · ');
}
