export type LabelRect = { left: number; right: number; top: number; bottom: number };

const intersection = (a: LabelRect, b: LabelRect) =>
  Math.max(0, Math.min(a.right + 4, b.right) - Math.max(a.left - 4, b.left)) *
  Math.max(0, Math.min(a.bottom + 4, b.bottom) - Math.max(a.top - 4, b.top));

/** Keep selectable labels on screen and apart; place important labels first. All values are pixels. */
export function placeMapLabel(
  anchor: { x: number; y: number }, size: { width: number; height: number },
  occupied: readonly LabelRect[], viewport: { width: number; height: number },
) {
  let best: { x: number; y: number; rect: LabelRect; overlap: boolean; score: number } | undefined;
  const margin = 8, width = Math.min(size.width, viewport.width - margin * 2);
  for (const dy of [0, -1, 1, -2, 2, -3, 3]) for (const dx of [0, -0.55, 0.55, -1.1, 1.1]) {
    const x = Math.max(width / 2 + margin, Math.min(viewport.width - width / 2 - margin, anchor.x + dx * (width + 10)));
    const y = Math.max(margin, Math.min(viewport.height - size.height - margin, anchor.y + dy * (size.height + 8)));
    const rect = { left: x - width / 2, right: x + width / 2, top: y, bottom: y + size.height };
    const overlap = occupied.reduce((total, other) => total + intersection(rect, other), 0);
    const score = overlap * 1000 + (x - anchor.x) ** 2 + (y - anchor.y) ** 2;
    if (!best || score < best.score) best = { x, y, rect, overlap: overlap > 0, score };
    if (score === 0) return best;
  }
  return best!;
}
