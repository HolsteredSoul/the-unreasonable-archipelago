# Asset inventory and provenance

Verified 5 November 2026. Machine-readable inventory: [assets/manifest.json](../assets/manifest.json).
This records the checked-in sources and installed dependency notices. It does not assign a distribution licence to the project: no project-wide licence file is currently declared.

## Project-created runtime assets

| Asset | Editable source / generator | Runtime | Verified contract |
| --- | --- | --- | --- |
| Botanical bell | `assets/source/bell-flower.blend`; `scripts/create_bell.py` | `public/assets/bell-flower.glb` | 265,108 bytes; 10,736 triangles; rest XYZ size 2.9402 × 3.0424 × 1.9568; `Closed` morph on petals/veins; no texture images or animation clips |
| Courteous whale | `assets/source/whale.blend`; `scripts/create_whale.py` | `public/assets/whale.glb` | 207,548 bytes; 3,290 triangles; XYZ size 4.4512 × 1.6716 × 6.1839; +Y up, nose +Z; `GentleSwim` 4 seconds on tail/flipper nodes; no texture images |
| Islands, buildings, vegetation, crops, boats, gulls, bell fallback | `src/world/World.tsx` | Procedural Three.js geometry | Seeded scenery; static geometry batched; growth affects structure-specific detail without changing rules |
| Whale fallback, wake and spray | `src/world/Whale.ts` | Procedural Three.js geometry | Available even if the GLB fails; decorative only |
| Sea, planning and weather | `World.tsx`, `WeatherVisual.ts`, `planning.ts`, `weatherModel.ts` under `src/world` | Shader and bounded geometry | Exact forecast and pre-growth shelter reach; reduced-motion and low-quality variants |
| A Little Landfall | `src/ui/music.ts`, `src/ui/music.worker.ts`; optional `scripts/compose-piano.mjs` preview | Runtime Web Audio buffers | Original 68 BPM, sixteen-bar theme, four arrangements/moods; synthetic instrument; no external score, recording or sample library |
| Action/outcome chimes | `src/ui/audio.ts` | Web Audio synthesis | Project-authored feedback; no recorded samples |
| Botanical favicon | `public/favicon.svg` | Same SVG | 64 × 64 viewBox; 385 bytes; repository-authored, no external source attribution recorded |

The two model generators and existing [music](music.md) / [whale](whale.md) records describe original project-created work, not downloaded assets. The bell's material set is sage/coral/brass; the whale uses blue-grey/teal/ivory. The `.blend` files are editable sources, not runtime dependencies.

Both GLBs were freshly parsed with the installed Three.js `GLTFLoader`; header lengths, default scene bounds, triangle totals and clip metadata were checked. The bell has one populated default scene and an additional empty scene; the runtime reads the default. Bounds are the rest/default morph pose before game scaling, not an animation envelope. SHA-256 values in the manifest identify exactly the inspected bytes.

No Blender export, new bitmap/model generation, playback audition or visual signoff was performed in this inventory pass. September 2026 renders and gameplay captures remain historical evidence.

## Third-party runtime dependencies

Installed versions were read from local package metadata on the verification date; `package-lock.json` is the dependency source of truth. The paths below contain the actual notices inspected, including conditions and warranty text.

| Package | Installed version | Recorded notice | Role / local notice |
| --- | --- | --- | --- |
| lucide-react | 0.468.0 | ISC; notice identifies Feather-derived portions as MIT | Interface icons; `node_modules/lucide-react/LICENSE` |
| three | 0.180.0 | MIT, three.js authors | Rendering, loaders, utilities; `node_modules/three/LICENSE` |
| react | 19.3.0 | MIT, Meta Platforms, Inc. and affiliates | UI runtime; `node_modules/react/LICENSE` |
| react-dom | 19.3.0 | MIT, Meta Platforms, Inc. and affiliates | UI renderer; `node_modules/react-dom/LICENSE` |

The release owner retains the applicable notices when packaging a distribution and inventories any other shipped dependency notices. This document is an asset/runtime inventory, not a complete software bill of materials or a substitute for the notices.

Fonts use installed system stacks: Segoe UI/Arial for interface text, Palatino Linotype/Georgia/Times New Roman for editorial text, with generic fallbacks. No font binary is copied into the repository and no remote font service is requested by these styles. Naming a system font in CSS does not establish rights to redistribute its binary.

## References that are not runtime artwork

- `docs/concept.png` is described in README as generated concept art. Its generation provider, original prompt and rights terms are not recorded; do not relabel it as a gameplay capture or a licensed runtime asset.
- Existing JPG captures and the dated PNG evidence directories show gameplay/browser inspection. Their dates, viewport, build and test scope belong in the associated verification record.
- `output/playwright` previews are development outputs, not shipped music or art dependencies.

## Maintenance contract

When changing a model, retain its source/generator, confirm orientation and named morph/animation contracts, then update byte size, SHA-256, bounds and triangle count from the actual export. Check both GLB success and procedural fallback paths under the repository deployment base.
When adding an external asset, record its creator, exact source, licence/permission and attribution requirements before replacing the current project-created asset. Project authorship and external licences are separate fields; unresolved project distribution policy remains a lead decision.
When changing code-generated scenery/audio, keep its source path and explanation current; source code is the reproducible asset. Refresh installed package versions/notices during release dependency review.

November 2026 presentation update: `src/world/artDirection.ts` supplies four paired
campaign daylight presets (first morning, garden noon, open water, homeward gold).
They adjust the existing water tint, background/fog and light colours only;
materials, chart cue colours, light intensities and tone-map exposure stay fixed.
Free voyages retain the original first-morning treatment. The presets add no asset,
dependency or saved field. `src/ui/audio.ts` now owns an effects bus and explicit
settings/disposal API; all sounds remain code-generated project chimes.
