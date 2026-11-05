# Gameplay verification

## Four-pillar delivery — 5 November 2026

The project lead integrated the Gameplay & Balance, Art & Audio, World & Progression,
and UX & Engineering work in the shared checkout. The clean kickoff was `f14e9a2`.
The verification below records the local release candidate before publication.
On 5 November 2026 the user authorized committing, pushing and deploying this release.
Publication uses the existing [Verify and deploy the archipelago workflow](https://github.com/HolsteredSoul/the-unreasonable-archipelago/actions/workflows/pages.yml)
from `main`; its run records are the source of truth for remote build/deployment status.
The [master plan](improvement-plan.md) records ticket outcomes and human evidence gates.

### Automated and strategy evidence

- `npm.cmd test -- --maxWorkers=1`: **207 tests pass across 22 files**. This includes
  legacy/current persistence, campaign progression, isolated medal keys, raw-data
  recovery, finale advice, all campaign routes, 400 generated winning witnesses,
  1,000 seeded invariants, weather/renderer semantics, and effects lifecycle/priority.
- `npm.cmd run test:ui`: **5 checks pass** for the persistent saving announcer,
  non-announcing modal copies, explicit condition states and rescue wording.
  Vitest includes only source test files; the Node UI runner is intentionally separate.
- After the final notification/layout correction, the affected label, renderer and
  campaign-component suites passed again: **25 tests across 3 files** (a subset of
  the 207 above, not additional unique tests).
- `npm.cmd run build` with `VITE_BASE_PATH=/the-unreasonable-archipelago/`:
  **TypeScript and production build pass**. The corrected build contains
  `index-CEPSb2ga.js` (~1,050.50 kB / 294.95 kB gzip) and `index-CGYxVsyU.css`.
  The existing large-chunk advisory remains; this is not an FPS/performance benchmark.
- The [campaign strategy audit](pillars/evidence/gameplay/strategy-audit.json) replays
  24 complete reference/medal/late-current routes. Every map has a legal six-ordinary-
  growth victory and a materially different late approach; the rules are unchanged.
- The [procedural and optional-action audit](pillars/evidence/gameplay/procedural-options.md)
  uses 32 predetermined seeds covering four building families, six rotations and bell
  distances 2–4. All witnesses and all bounded six-growth candidates win. A useful
  whale tow and a garden bridge/windbreak alternative have executable cost comparisons.
  Two audit runs were byte-identical. This sample does not establish universal medal
  feasibility, dominant strategies, difficulty, discovery or enjoyment.

### Controlled production-browser campaign

The first complete production pass used an isolated Chrome **156.0.8078.80** context
for each scenario, an ephemeral local static server, the real Pages base path, and
actual pointer/keyboard controls. Source/dist fingerprints and viewport/save guards
detect unexpected changes. It used an already-installed Playwright module and did
not install dependencies, attach to a personal profile, or modify personal saves.

Evidence: `output/playwright/programme-2026-11-05T13-30-45.108Z-6652214a/summary.json`.
All **6 scenarios passed** at **1366×768 and 1920×1080**: campaign, blocked saving,
and final rescue at each size. This includes **16 campaign victories** (all eight
maps at both sizes), **2 deliberate defeats followed by checkpoint reload/replanning
and Nourish rescue victories**, exact simulator agreement, undo/reload, current-map
resume, replacement cancellation, modal focus, and keyboard safety. No browser errors,
console warnings or failed same-origin responses were recorded; browser/server cleanup
completed and source/dist fingerprints remained unchanged throughout the run.

This run identified two visual defects during manual image review, despite passing
the interaction assertions: resource feedback could cover controls, and the tide toast
could meet a raised bell-warning panel. Some modal/campaign text and focus outlines
also had insufficient contrast on their opaque backgrounds. The lead corrected
notice placement using the measured dock boundary, reserved notice rectangles for
world labels, and darkened the scoped text/focus colours. These final presentation
changes do not alter game rules or persistence. Their browser revalidation is recorded
below when complete; the preceding campaign run remains evidence for its exact build.

### Final presentation revalidation

The corrected build has passed the following production runs. Each run has a JSON
summary, scenario steps, PNG captures and accessibility snapshots under its directory:

| Run | Result | Evidence directory under `output/playwright/` |
| --- | --- | --- |
| Chrome 156.0.8078.80, campaign/saving/rescue at both desktop sizes | 6/6 scenarios pass | `programme-2026-11-05T13-48-17.252Z-af520652` |
| Edge 156.0.4314.58, controls/saving at both desktop sizes | 4/4 scenarios pass | `programme-2026-11-05T13-50-40.405Z-4bbbc928` |
| Chrome 125%/150% scaling emulation for both desktop targets | 4/4 scenarios pass | `programme-2026-11-05T13-52-28.981Z-770ff434` |

The scaling run uses device pixel ratio and corresponding CSS viewports of 1093×614,
911×512, 1536×864 and 1280×720. It is not a physical Windows display-setting test.
Controls/settings include mute, music volume, low graphics, reduced motion, reload,
keyboard focus and a tide transition. The harness checks visible notification
rectangles against the action dock, forecast resources, bell outlook and Advance
control without first dismissing notices. No document overflow occurred in these
captured states. The corrected source fingerprint is
`523650da17bc2355db1af0b0d9df50d0143ff2b89b1e5c3fcff8409d36d13ea3` and dist fingerprint is
`dfe6b9ed4ffcbbcdfa7a2800ca60a8b87cc34e58ab0b877b5a625fb28ec084e2` (browser harness method).

Fresh image inspection confirms the Nourish callout clears controls at both sizes and
the settled-tide toast clears the raised final-warning strip. An isolated production-
CSS fixture confirms the actual winning declarations: modal helpers **5.40:1**,
accept-defeat text **5.16:1**, rescue button hover **4.64:1**. Its scope is opaque
backgrounds, not a whole-game accessibility certification or sea-pixel measurement.
See [Art's computed-CSS evidence](pillars/evidence/art/postfix-computed-css-2026-11-05.json).

One additional image-review defect appeared at 150%: a fading notice was initially
excluded from the map-label reservations and could cover the selected bell label.
The final correction reserves notices at opacity zero, uses an opacity-only fade,
and refreshes the dock boundary before paint. The capture assertion now includes the
selected island label. Final verification:

| Final-build run | Result | Evidence directory under `output/playwright/` |
| --- | --- | --- |
| Chrome scaling with selected-label intersection checks | 4/4 pass | `programme-2026-11-05T14-14-06.945Z-60b64efc` |
| Fresh compact dense-fleet replay through all eight maps | Pass; 8 victories earned through UI controls | `programme-2026-11-05T14-13-26.557Z-1a5bda90` |

Both used final source fingerprint
`5597756b96aa3b3c5c48839ebe8de6e932aac76c692f323d9dfb9610044b0153` and dist fingerprint
`a54c1eb596009da333ca41ce4ac701ab98fb1622f055c6606c45b2d949249381`.
The lead inspected the corrected 150% Nourish frame and final thirteen-island frame:
the selected label, notice and action/forecast controls are separate. No new gameplay,
save, colour or audio changes were introduced in this final reservation correction.
The preceding Chrome/Edge/contrast evidence remains attributed to its earlier build.
Art's independent final review accepted seven corrected scaled/dense frames. In the
previously failing 150% case, the selected label clears the notice by **36.13 CSS px**,
and the notice clears the forecast controls by **12 px**. All scoped visual findings
are closed for the inspected states; see the [final Art review](pillars/art-audio.md).

The initial lead-run attempt at final scaling was blocked by sandbox loopback access
before gameplay began (`programme-2026-11-05T14-13-19.667Z-29798995`). It is a failed
environmental launch, not an accepted test. The completed rerun above used approved
local network access. The UX chat's temporary model-capacity interruption caused no
source change; the lead and resumed UX session reconciled the final artifacts.

### Evidence limits and release scope

Local delivery was checked in a fresh Chrome context at
`http://127.0.0.1:4179/the-unreasonable-archipelago/`: campaign screen, JavaScript,
CSS, and both GLB assets loaded successfully. Evidence:
`output/playwright/programme-preview-2026-11-05T14-18-32.160Z/summary.json`.
The lead-owned preview remains running; all test-owned browsers and temporary servers
were closed. An earlier sandboxed preview attempt timed out and is superseded by this
successful check. This is local delivery, not a public deployment.

The browser assertions and static contrast calculations do not establish actual NVDA
speech, physical Windows scaling, real-device mix/clipping, musical fatigue, or player
learning/enjoyment. The [human playtest protocol](playtest-plan.md) remains ready but
unrun. The retained whale and subtle daylight treatments have image review; no new
model or score was needed. Mobile expansion and FPS benchmarking remain deferred.
No rule tuning, new hazard or extra objective was added without evidence of a player
problem. No publishing, remote Git push or real user-data recovery was performed.

The sections below are historical verification records for earlier versions.

## Visible weather, breakwater placement, and tide events

20 September 2026. **133 tests pass across 18 files**. Weather presentation adds
12 model tests and 6 renderer tests to the existing 115 checks. They cover resolved drift, exact shelter rays, pre-growth
breakwater reach, real build costs and legality, calm recovery, prospective protection,
all six wind bearings, breakwater wave interception, harvest growth, reduced motion,
non-pickable overlays, and GPU disposal. TypeScript and the production build pass;
the JavaScript bundle is approximately 289 KB gzipped with the existing chunk advisory.

Real production-browser controls completed all eight campaign maps again, preserving
every unlock, with no JavaScript/console errors or failed HTTP responses. The final
thirteen-island fleet showed weather events at 1366×768 and 1920×1080. Selected-island
labels carry detail; other islands use small growth/stress markers. Captions reserve
map-label space, and inactive corner panels clear during the sequence. Skip commits the same resolved tide;
underlying action panels are inert to pointer and keyboard input.

A separate First Light run watched all phases: actual movement, an exposed island's
stress rising 0→1, a bell sheltered by its neighbor staying at 0, calm recovery 1→0,
production/rations, and growth. A proposed breakwater on Porridge spent nothing during
preview, named the Heart as newly protected, included the removed garden production
and build cost in its resource forecast, then cost exactly one action/three timber
when built. The actual storm left the Heart at zero stress, and the nourished breakwater
grew. The committed turn survived reload. Low graphics, reduced motion, a final-tide
defeat, saved replanning, and a successful rescue also passed.

Build choices now sit at the edge, with Breakwater first while its preview is active,
so the proposed gold cells remain visible. The preview uses real post-drift simulation;
it never promises protection on a later tide with a different wind. The effects use
15 bounded instanced batches, static reduced-motion frames, and no new image/model
assets. The game rules and save schema are unchanged. Human observation should still
check whether the visible sequence teaches shelter and whether its pace feels right.

## Compact planning after clutter feedback

Sea focus now activates automatically at widths up to 1450px or heights up to 820px,
without rewriting the saved preference. Full view remains an explicit, working override.
A horizontal chip row opens one detail panel at a time; Build and Tow close competing
panels. Island-list selection closes the list and restores focus to the selected map
label. Escape closes a detail panel and restores focus to its chip. Bell growth and
stress warnings remain visible, along with action costs, rations, final-tide warnings,
and the optional after-tide bell inspector.

Production-browser checks at 1366×768, 1024×640, and 768×600 found no document overflow;
the action dock and Advance tide stayed inside the viewport. The 13-island fleet used
one detailed label and 12 small markers, including in Forecast and the storm sequence.
The detailed desktop view was also checked at 1920×1080. No JavaScript errors occurred.
The 850px forced minimum height is removed in sea focus, the whale card stays inside
Weather details, and redundant map prose is limited to the selected island.

FPS benchmarking is deferred at the user's request; this release makes no frame-rate
claim. The renderer retains single-pass transparent sea overlays. Phone play remains
an evaluation item rather than a promised complete mobile experience.

Inspected screenshots: [1024×640 planning](compact-sea.jpg) and
[13-island storm sequence](weather-events.jpg).

## First Light defeat clarity and final-tide recovery

20 September 2026. **115 tests pass across 16 files**. TypeScript and the final production
build pass; the existing Vite large-chunk advisory remains (approximately 284 KB gzipped
JavaScript). Fourteen new advice tests cover the exposed mature/connected bell failure,
stress recovery, exact upstream shelter cells, legal winning tow/build suggestions,
whole-fleet victory, unavailable resources/actions, completed states, and legacy rules.
Three recovery tests cover an exact, persistent start-of-tide snapshot, old-save
compatibility, and rejection of mismatched checkpoints.

A real Chromium First Light playthrough grew the bell, let the later currents carry it,
and reached a losing tide-8 forecast with a healthy Heart. The warning prevented any
mutation until explicitly accepted. Defeat survived reload; Replan the final tide
restored the exact original resources, actions, positions, and growth. Show this move
spent nothing, highlighted the suggested tow, and the actual one-action/one-food tow
won the voyage. Victory unlocked map 2 and cleared the checkpoint. No JavaScript or
console errors occurred in the recovery/win flow.

Screenshots of the checklist and suggested controls were inspected at 1366×768 and
1920×1080. The compact objective exposes shelter and forecast stress even when an
ordinary island is selected. Rescue suggestions remain visible on the action controls;
queued growth remains visible beside current bell growth. `finale-warning.jpg` shows
the actual losing-tide warning. Earlier completed saves cannot gain a historical
checkpoint retroactively. Replanning is limited to map 1; harder positions may still
need an earlier decision or a fresh attempt. These changes teach and expose existing
rules; they do not change the simulation's victory conditions.

## Eight-map campaign, opening screen, and dramatic outcomes

20 September 2026. **98 tests pass across 14 files** with `npm test -- --maxWorkers=1`. The final TypeScript and production build pass. The JavaScript bundle is approximately 282 KB gzipped; the existing Vite chunk-size advisory remains.

The campaign has eight distinct, authored starting arrangements. Maps 1–2 have one bell and seven islands; maps 3–4 have two bells and nine islands; maps 5–6 have three bells and eleven islands; maps 7–8 have four bells and thirteen islands. Actions per tide scale from three to six. Every map keeps eight tides, starts with no bell growth, and has a legal command-only winning route through the actual simulation. All unattended runs lose, all added bells must succeed, and abandoning preparation for the last two tides loses every map. Winning witnesses retain four or five Heart integrity. The larger maps introduce garden construction, tighter food reserves, staggered growth, and several final windbreak arrangements. These witnesses establish solvability, not unique solutions or a guarantee of fun.

Campaign progress advances only for the next unlocked map. Retries and free voyages preserve completed maps. Every action and tide of all eight routes roundtrips through save validation, including six-action undo histories. Invalid chapter sizes, action budgets, cross-map undo, and impossible rules are rejected. Existing single-bell and legacy-rule saves remain valid. Campaign medals have separate identities from procedural voyages. Explicit shared-seed first visits can continue from the new splash screen.

Real Chromium controls completed all eight campaign maps, unlocked each successive map, reloaded mid-map with undo intact, and reached the completed chart. Two additional final-map losses verified explicit defeat, retry, preserved victories, and reduced motion. A production-browser eight-tide win also checked an explicit shared seed, Whale Tow's one-action/zero-food cost, map advancement, reload, and muting after the last Advance click but before its delayed outcome. No production JavaScript/console errors or failed HTTP responses occurred.

Screenshots were inspected at 1366×768 and 1920×1080. The first larger-fleet pass found the objective panel covering the island selector; the laptop campaign panel is now compact enough for even a nourished island with forecast details. A real selection of the thirteenth island passed with a 4 px gap in that demanding layout and no horizontal overflow. Multiple bell labels have separate connection hints and leader lines. A short 1920×1080, thirteen-island, high-quality sea-focus sample measured approximately 59 FPS on this machine; this is not a device-wide performance guarantee.

Victory uses expanding gold rings, bell movement, sparks, and a rising chord. Defeat uses dark moving sea bands, fading light, a descending chord, and large explicit text. The result identifies missing growth, Heart links, shelter, and excessive stress for each bell. Underlying controls are inert during the cinematic and results. Reduced motion uses a brief static transition. Audio checks verify the mute race mechanically; subjective listening and longer-term musical fatigue still need human evaluation.

GitHub Pages is configured to publish the verified build from main. The deployment workflow tests and builds with the repository base path. A local Pages-path smoke build served the HTML, favicon, JS/CSS, both GLBs, and music worker successfully; the GLB headers were checked. The live release is at https://holsteredsoul.github.io/the-unreasonable-archipelago/ . Campaign saves remain browser/origin-local. Phone expansion is explicitly deferred.

Visual evidence: `campaign-splash.jpg`, `campaign-fleet.jpg`, and `campaign-defeat.jpg`. These are actual browser captures, not concept art. Remaining evaluation is human difficulty tuning, alternative strategies on later maps, and wider desktop/audio/accessibility coverage.

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
