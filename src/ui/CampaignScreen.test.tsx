import { isValidElement, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { createCampaignGame } from '../game/campaign';
import { CampaignScreen } from './CampaignScreen';
import { voyageRecordKey, type Achievements, type Medal } from './achievements';

type ElementProps = {
  children?: ReactNode; disabled?: boolean; onClick?: () => void;
  'aria-label'?: string; 'aria-describedby'?: string; 'aria-current'?: string; id?: string;
};
type Element = ReactElement<ElementProps>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (!isValidElement<ElementProps>(node)) return [];
  return [node, ...elements(node.props.children)];
}
function text(node: ReactNode): string {
  if (Array.isArray(node)) return node.map(text).join('');
  if (isValidElement<ElementProps>(node)) return text(node.props.children);
  return typeof node === 'string' || typeof node === 'number' ? String(node) : '';
}
function setup(overrides: Partial<Parameters<typeof CampaignScreen>[0]> = {}) {
  const props = {
    state: createCampaignGame(3), completed: 2, resumable: true,
    onResume: vi.fn(), onMap: vi.fn(), onFreeVoyage: vi.fn(), ...overrides,
  };
  const tree = CampaignScreen(props);
  const nodes = elements(tree);
  const card = (id: number) => nodes.find(node => node.type === 'button' && node.props['aria-label']?.includes(`map ${id}:`))!;
  return { props, tree, nodes, card };
}

describe('campaign chart navigation and saved-medal presentation', () => {
  it.each([1, 3, 8])('continues the active playing map %i without requesting a new attempt', map => {
    const state = { ...createCampaignGame(map), tide: 4 };
    const before = structuredClone(state);
    const { card, props } = setup({ state, completed: map - 1 });
    expect(card(map).props['aria-label']).toMatch(/^Continue/);
    expect(card(map).props['aria-current']).toBe('step');
    expect(text(card(map))).toContain('Continue · tide 4');
    card(map).props.onClick!();
    expect(props.onResume).toHaveBeenCalledOnce();
    expect(props.onMap).not.toHaveBeenCalled();
    expect(state).toEqual(before);
  });

  it('continues an active replay even when every map has already been won', () => {
    const { card, props } = setup({ completed: 8 });
    card(3).props.onClick!();
    expect(props.onResume).toHaveBeenCalledOnce();
    expect(props.onMap).not.toHaveBeenCalled();
  });

  it('requests a fresh attempt for a different won map and keeps later maps locked', () => {
    const { card, props } = setup();
    expect(card(1).props['aria-label']).toMatch(/^Replay/);
    card(1).props.onClick!();
    expect(props.onMap).toHaveBeenCalledExactlyOnceWith(1);
    expect(props.onResume).not.toHaveBeenCalled();
    expect(card(4).props.disabled).toBe(true);
    expect(text(card(4))).toContain('Win map 3 to unlock');
    // The handler also guards a stale/programmatic request for a locked card.
    card(4).props.onClick!();
    expect(props.onMap).toHaveBeenCalledOnce();
  });

  it('does not resume an ended attempt from its map card', () => {
    const { card, props } = setup({ state: { ...createCampaignGame(3), status: 'won' }, completed: 3 });
    expect(card(3).props['aria-label']).toMatch(/^Replay/);
    card(3).props.onClick!();
    expect(props.onMap).toHaveBeenCalledExactlyOnceWith(3);
    expect(props.onResume).not.toHaveBeenCalled();
  });

  it('works without the optional achievement props and describes every map button', () => {
    const { tree, nodes, card } = setup({ resumable: false, state: createCampaignGame(1), completed: 0 });
    expect(renderToStaticMarkup(tree)).not.toContain('Best:');
    expect(card(1).props['aria-label']).toMatch(/^Start/);
    for (let map = 1; map <= 8; map++) {
      const description = card(map).props['aria-describedby'];
      expect(nodes.filter(node => node.props.id === description)).toHaveLength(1);
    }
    for (const button of nodes.filter(node => node.type === 'button')) {
      expect(elements(button.props.children).some(child => child.type === 'button')).toBe(false);
    }
  });

  it.each([
    { rank: 1, growth: 2, next: 3, gap: 1 },
    { rank: 2, growth: 4, next: 6, gap: 2 },
  ])('shows the best record and next threshold for rank $rank without changing the records', ({ rank, growth, next, gap }) => {
    const state = createCampaignGame(3);
    const key = voyageRecordKey({ ...state, campaignMap: 1 });
    const achievements: Achievements = { [key]: { rank: rank as Medal['rank'], growth } };
    const before = structuredClone(achievements);
    const { tree, card, nodes } = setup({ state, achievements });
    expect(text(card(1))).toContain(`${growth} shore growth`);
    const description = nodes.find(node => node.props.id === card(1).props['aria-describedby']);
    expect(text(description)).toContain('Best:');
    expect(text(tree)).toContain(`win with ${next} ordinary shore growth, ${gap} above your best`);
    card(1).props.onClick!();
    expect(achievements).toEqual(before);
  });

  it('does not invent medals from completion or a new threshold above the top medal', () => {
    const state = createCampaignGame(8);
    const achievements: Achievements = Object.fromEntries(Array.from({ length: 8 }, (_, index) =>
      [voyageRecordKey({ ...state, campaignMap: index + 1 }), { rank: 3 as const, growth: 6 }]));
    const complete = setup({ state, completed: 8, achievements });
    expect(text(complete.tree)).not.toContain('above your best');
    expect(text(complete.tree)).toContain('explore a smaller sea');
    const unknown = setup({ completed: 8, achievements: {} });
    expect(text(unknown.tree)).not.toContain('Best:');
    expect(text(unknown.tree)).not.toContain('above your best');
  });

  it('does not display a colliding free-voyage seed as a campaign medal', () => {
    const freeKey = voyageRecordKey({ ...createCampaignGame(1), campaignMap: undefined, seed: 'campaign-map-1' });
    const achievements: Achievements = { [freeKey]: { rank: 3, growth: 6 } };
    const { card, tree } = setup({ achievements });
    expect(text(card(1))).not.toContain('Best:');
    expect(text(tree)).not.toContain('above your best');
  });

  it('delegates free-voyage and medal-help requests without starting a campaign map', () => {
    const onViewMedals = vi.fn();
    const { tree, nodes, props } = setup({ onViewMedals });
    const free = nodes.find(node => node.type === 'button' && text(node).includes('Explore a free voyage'))!;
    const help = nodes.find(node => node.type === 'button' && text(node).includes('How medals work'))!;
    expect(text(tree)).toContain('One bell · seven islands · three actions per tide.');
    expect(nodes.some(node => node.props.id === free.props['aria-describedby'])).toBe(true);
    free.props.onClick!();
    help.props.onClick!();
    expect(props.onFreeVoyage).toHaveBeenCalledOnce();
    expect(onViewMedals).toHaveBeenCalledOnce();
    expect(props.onMap).not.toHaveBeenCalled();
  });
});
