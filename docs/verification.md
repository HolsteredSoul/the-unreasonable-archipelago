# First playable verification

## Whale Tow discoverability and action cost

20 September 2026. Whale Tow is now a permanent main action beside ordinary Tow, with **1 action · 0 food**, its direction or next visit, and a distinct available state. The encounter card lists eligible islands, explains disabled states, and opens an optional guide. Choosing an island does not spend an action. On-water destination marks now belong only to the selected eligible island; they no longer fall back to a different island when the Heart or a blocked island is selected. Resource feedback explicitly shows the spent action and unchanged food.

All 67 automated tests pass and the final production build passes. A real Chromium eight-tide production victory used all three whale visits and checked the action count, zero food cost, immediate movement followed by drift, one tow per visit, Heart/blocked/no-actions explanations, exact next-visit wording, selection without spending, keyboard execution, save/reload, and undo restoring the favour. The optional guide preserves game state and returns keyboard focus on Escape. No JavaScript exceptions or failed HTTP responses occurred.

Inspected the actual controls at 1366×768 and 1920×1080, including sea focus. The smaller layout has no horizontal overflow or clipped action buttons; the whale card remains 24 px above the tide controls during the late visit. `docs/whale-controls.jpg` shows the production interface. These changes clarify existing mechanics without changing the whale's rules.

## Late-voyage decisions and sheltered finale

20 September 2026. **67 tests pass across ten files**, including the 1,000-seed invariants and 400 complete generated winning routes. The production build and TypeScript checks pass; the existing Vite large-chunk advisory remains (approximately 276 KB gzipped JavaScript).

New voyages use `voyageRules: 'moonwake'`. Tide 5 pushes unanchored islands radially outward; tide 7 carries them with the seed's crosswind, while the Heart stays rooted. Tide 8 requires a mature, connected, sheltered bell below 3 stress. Omitted rules preserve original saves, currents, victory conditions, and undo. Validation rejects unknown rules, mixed-rule undo histories, and new saves claiming an unsafe victory. Previously earned medals remain intact.

The original introductory opening followed by five empty turns now loses. Two different command-only wins are regression-tested and were completed with real production-browser controls: hold the bell with anchors on tides 5 and 7, or let it ride both currents and tow a garden into a bridge and windbreak on tide 8. The latter keeps the bell offshore. A separate command-only simulation also reaches the top medal with six ordinary growth stages, 16 food, and 15 timber remaining.

Generated witnesses use conservative anchors and a bounded final shelter search. Across a cold 400-seed probe, all four opening families remained represented, every witness took late actions, 216 repaired final shelter, and no fallback layouts were needed. Local generation timings: median 1.75 ms, p95 6.4 ms, maximum 20.9 ms. These timings are a local sample, not a cross-device guarantee.

Headed Chromium production playthroughs covered both introductory strategies and generated seed `moonlit-teapot`, plus a complete defeat, reload, and retry. Verified tide-chart bearings and keyboard focus restoration, resource spending, same-tide undo after reload, forecast changes when a bridge is built or undone, safe/exposed map labels and their accessible descriptions, and exact final readiness. No JavaScript exceptions or failed HTTP responses occurred.

Inspected actual screenshots at 1366×768 and 1920×1080. A first visual pass found the longer weather card overlapping the whale and the new toolbar overlapping the chart legend. The weather and encounter cards now flow vertically, the duplicate preview control is hidden, and the legend is separated from the toolbar. Final 1366×768 measurements on tides 5 and 7 leave 8 px between weather and whale and 15 px before the turn controls, with no horizontal overflow. `docs/late-voyage.jpg` shows the verified production build. No new rendering geometry or per-frame work was added.

The introductory sea is still forgiving: riding the currents can be repaired with one final bell tow. This pass establishes consequences and alternative spatial solutions, not sustained campaign difficulty. Repeated-run enjoyment still requires human playtesting. The records below describe earlier checkpoints and their then-current rules.

## Completed roadmap: generated seas, whale encounters, and piano

20 September 2026. All 54 tests pass across eight files: 14 core simulation, 6 generated-opening, 8 whale/current, 10 original save, 6 roadmap save, 3 medal, 4 planning, and 3 scenery-batching tests. Final command: `npm test -- --maxWorkers=1`. The heavy 1,000-seed invariant test has an explicit 30-second budget for concurrent desktop work. Generation tests replay 400 complete winning routes through the public game API, covering all six current rotations, three initial bell distances, and four structure families. Old fixed-layout saves are preserved without regeneration.

The production build and TypeScript checks pass. The bundle remains dominated by Three.js (approximately 273 KB gzipped JavaScript); Vite reports its advisory large-chunk warning. The whale adds a 208 KB GLB with a four-second animated tail/flipper cycle and a procedural loading fallback. An isolated Blender process produced and verified both the browser asset and editable source.

Real Chromium controls completed two additional eight-tide wins: the introductory sea using Whale Tow as a food-saving rescue, and generated seed `moonlit-teapot`. The combined pass verified whale eligibility, one-action/no-food cost, keyboard activation, exact destination, once-per-visit limit, undo, reload and replay, plus seed preview, new geometry, accessible costs and Escape focus. No JavaScript exceptions or failed HTTP responses occurred. Actual screenshots were inspected at 1366×768 and 1920×1080; the encounter card was moved to the edge after the first visual pass covered islands.

Integrated audio controls passed: independent piano/effects levels, piano-only mute, master mute, zero-volume behavior, preference persistence, and no AudioContext before a gesture after reload. A full eight-tide victory exercised disconnected, calm, storm and finale music, including result ducking. An actual score-and-chime recording measured peak 0.0741 and RMS 0.0128 with zero clipped samples; the four-minute offline score render also had no clipping. Simulated page-visibility suspension/resume passed; real-tab hiding was inconclusive because this automation environment kept `document.hidden` false. No subjective listening audition is claimed.

Final five-second production frame samples on Intel Iris Xe / ANGLE D3D11, DPR 1: **58.7 FPS at 1366×768 high**, **54.1 FPS at 1920×1080 high**, and **59.3 FPS at 1920×1080 low**. Median frame interval was 19.9 ms, with p95 at 20.1–20.2 ms. These are local samples, not cross-device guarantees. Initial development/probed and production checks were much slower; isolating animated backdrop blur identified the main full-screen compositing cost. The final HUD retains translucent fills without per-control blur. Static shadow reuse, cached label dimensions, and conservative island mesh batching also reduce repeated work. Representative scenery mesh counts fell from 68 to 20 for a garden and 61 to 16 for a grove; 96 reference picking rays and precise world bounds were preserved. `docs/roadmap-whale.jpg` shows the actual game.

Gameplay remains a short, forgiving strategy chapter. The whale gives a direction-limited food-saving alternative on three tides; ordinary towing still supplies free direction choice, and anchors still stop subsequent drift. Generated geometry changes opening decisions, but the verified rescue method still brings the bell into the inner ring early. Higher medals encourage developing the ordinary islands. Repeated-run enjoyment and subjective listening fatigue need human playtesting; automated success does not establish either.

After the final rendering fixes, the production browser pass also verified direct mesh picking, low graphics and reduced motion, Whale Tow with refresh, an entire unsuccessful eight-tide voyage, defeat persistence without a medal, and restart. No JavaScript exceptions or failed HTTP responses occurred. The final screenshot was refreshed from this production build.

## Roadmap checkpoint: planning and clarity

20 September 2026: 31 automated checks passed (14 simulation, 10 saves, 3 achievements, 4 planning overlays). TypeScript and production build passed. Under concurrent Blender/audio work, the 1,000-seed simulation check needed a 30-second timeout; its assertions passed.

A real Chromium eight-tide playthrough verified pointer and keyboard cost callouts, immediate food changes, undo, forecast rations, sea-focus persistence after reload, a six-growth victory, and medal retention after restart. Layout inspected at 1366×768 and checked at 1920×1080; no horizontal overflow or JavaScript exceptions in the playthrough. Review also corrected cost descriptions for screen readers, focus restoration from collapsed panels, and medal wording on defeat.

Build: 0.1.0, The First Bell. Verified locally on 20 September 2026.

## Automated checks
- 24 tests passed: 14 deterministic simulation tests and 10 persistence tests.
- Simulation checks cover legal actions, blocked drift, forecast parity, state invariants across 1,000 seeds, and a complete winning voyage.
- Save checks cover valid ongoing and terminal sessions, undo histories, seed changes, malformed saves, blocked storage, and 40 seeded voyages.
- TypeScript checking and the Vite production build passed.

## Real browser playthroughs
Tested the production build in headed Chromium using actual controls, without injecting gameplay state.

- Completed all eight tides and won with Heart integrity 5/5, 18 food, 19 timber, and six ordinary-island growth stages (the optional Flourishing Shores goal).
- Completed an unsuccessful eight-tide voyage; the defeat explanation and restart controls worked. The defeated voyage also survived a reload.
- Verified direct island picking, clickable water destinations, button-based towing, building, nourishment, anchoring, keyboard island selection, preview, undo, and resource costs.
- Confirmed the first tide's actual bell position and growth match its forecast.
- Reloaded during planning and retained the same resources, pending nourishment, and undo state.
- Tested restarting the same seed, generating a different seed, and entering a chosen seed.
- Checked settings input focus, reduced motion, low graphics quality, and the sound toggle.
- No JavaScript exceptions or failed HTTP responses during the production defeat/restart flow. The final picking-fix build also reloaded without JavaScript exceptions.

The final map-control check caught decorative shore lines intercepting clicks on neighboring islands. Picking now ignores lines and shallow-water decoration; direct Heart selection, bell selection, water-cell towing, and undo passed afterward.

## Presentation and performance
- Inspected the actual game at 1366 x 768 and 1920 x 1080. No horizontal overflow at 1366 x 768.
- A 2.2-second frame-pacing sample of the mature seven-island scene at 1366 x 768, high graphics quality, measured approximately 56 frames per second (16.7 ms median) on Intel Iris Xe through ANGLE/D3D11. This is a short local sample, not a cross-device benchmark.
- The exported botanical bell loads in the scene and opens with growth. Its editable Blender scene is included.
- docs/first-playable.jpg is an actual game screenshot. docs/concept.png is the earlier concept illustration.

## Gameplay assessment and boundaries
The chapter is deliberately forgiving while teaching movement, delayed growth, currents, and planning with forecasts. The bell can be rescued early; developing six shore growth stages provides a second objective during later tides. Longer-term strategic depth and repeated-run enjoyment still need human playtesting.

The original first-playable release varied only scenery, names, and weather. The roadmap update above replaces that limitation for non-introductory seeds. This remains a complete short desktop chapter; phone layouts, additional chapters, and the larger campaign are outside this roadmap.
