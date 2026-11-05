export type ArtDirection = Readonly<{
  id: string;
  background: number;
  sky: number;
  ground: number;
  sun: number;
  fill: number;
  /** Linear multipliers applied only to the sea, before the existing storm treatment. */
  waterTint: readonly [number, number, number];
}>;

// Four daylight chapters. The first is the established free-voyage/First Light look.
// Chart marks, materials, exposure, light intensity and gameplay never vary by chapter.
const DIRECTIONS: readonly ArtDirection[] = [
  { id: 'first-morning', background: 0x73b9b5, sky: 0xfff2ce, ground: 0x7baca1, sun: 0xffe4b6, fill: 0xb9e7dc, waterTint: [1, 1, 1] },
  { id: 'garden-noon', background: 0x79bcae, sky: 0xf6f4d8, ground: 0x80ad98, sun: 0xffeac8, fill: 0xbfe7d4, waterTint: [0.95, 1.035, 0.96] },
  { id: 'open-water', background: 0x72b5bc, sky: 0xeef1dc, ground: 0x79a8a5, sun: 0xf8e8c9, fill: 0xb9e1e8, waterTint: [0.90, 1.01, 1.08] },
  { id: 'homeward-gold', background: 0x86b8b0, sky: 0xffefcc, ground: 0x88aa99, sun: 0xffdfaf, fill: 0xc4e4da, waterTint: [1.09, 1.01, 0.94] },
];

for (const direction of DIRECTIONS) { Object.freeze(direction.waterTint); Object.freeze(direction); }

/** No campaign marker means the original look, even for a campaign-looking free seed. */
export function getArtDirection(campaignMap?: number): ArtDirection {
  const index = Number.isInteger(campaignMap) && campaignMap! >= 1 && campaignMap! <= 8
    ? Math.floor((campaignMap! - 1) / 2) : 0;
  return DIRECTIONS[index];
}
