# First playable verification

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

Seeds vary scenery, names, and weather. The seven-island opening layout is fixed for this introductory chapter. This is a complete short desktop chapter, not the planned larger campaign; phone layouts and additional chapters are not part of this stage.
