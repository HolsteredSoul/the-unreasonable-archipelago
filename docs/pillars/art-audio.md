# Art & Audio — audit, improvement plan and implementation

Date: 5 November 2026 (Australia/Perth). Owner: Art & Audio pillar.
Status: assigned waves 1–2 integrated by lead; scoped final visual signoff complete. Identified contrast, HUD and scaled selected-label findings are closed in the inspected corrected states. No source or asset changes by Art in these reviews.
Player outcome: a beautiful miniature sea whose shapes, movement and sound explain the next choice.
The implementation below follows the lead's explicit assignment. The Milestone 0 audit/plan that follows it is retained as a pre-change snapshot, not a description of missing features in the revised source.

## Final visual signoff — corrected reservations and dense fleet

**Accept the inspected final states.** The residual 150% selected-label collision is closed, along with the earlier resource-callout and raised-warning toast overlaps. Full-grown four-bell fleets retain distinct silhouettes, readable selected labels and an identifiable whale. No further art/source change is requested by this review.

Final evidence fingerprints: source `5597756b96aa3b3c5c48839ebe8de6e932aac76c692f323d9dfb9610044b0153`; dist `a54c1eb596009da333ca41ce4ac701ab98fb1622f055c6606c45b2d949249381`. The final stylesheet is `index-CGYxVsyU.css`. The lead's bounded correction reserves notice rectangles even at zero opacity, uses an opacity-only fade, and updates the dock boundary before paint. Art did not edit source or launch another game browser.

Actually inspected seven final PNGs with `view_image`, plus their relevant `.layout.json` evidence:

- Scaling root `output/playwright/programme-2026-11-05T14-14-06.945Z-60b64efc/`: `1366x768-125pct-controls/map-1-queued-growth.png`, `1366x768-150pct-controls/map-1-queued-growth.png`, `1920x1080-150pct-controls/map-1-queued-growth.png`.
- Dense root `output/playwright/programme-2026-11-05T14-13-26.557Z-1a5bda90/1366x768-100pct-dense/`: `map-4-queued-growth.png`, `map-7-dense-grown3-fleet.png`, `map-8-queued-growth.png`, `map-8-dense-grown3-fleet.png`.

| Previously failing state | Final visible/layout evidence | Decision |
| --- | --- | --- |
| 1366×768 at 150% emulation, queued Nourish | Callout right 661.89 CSS px; selected-label left 698.02: **36.13px horizontal gap**. Callout bottom 329.50; forecast top 341.50: **12px vertical gap**. Full name and queued-growth text are visible. | Closed |
| Map 4 queued Nourish, compact | Selected label is to the callout's left; callout bottom 585.50, forecast top 597.50: **12px**. Action dock and forecast values remain clear. | Closed |
| Map 7 full-grown fleet with raised bell warning | Toast bottom 549.50, forecast top 561.50: **12px**. Its text/close control, selected bell label and whale-tow target are separate. | Closed |
| Map 8 full-grown fleet | Toast bottom 585.50, forecast top 597.50: **12px**. Four flowers, selected label, resource outcomes and controls remain readable. | Accepted |

The recorded overlap arrays are empty, now including `.island-label.is-selected` as well as the HUD controls. The final scaling summary reports **4/4 passed**; the final dense summary reports **passed**. These are lead-run browser results read from their summaries, not an Art-run playthrough. Scaling remains viewport/device-scale emulation, not native OS scaling. The review accepts the observed frames and does not claim a continuous animation trace.

The earlier computed-cascade contrast results below remain applicable to the reviewed colours. A read-only check of **19 targeted colour/focus declarations** in the final stylesheet found all expected declarations unchanged; [final-bundle-colour-continuity.json](evidence/art/final-bundle-colour-continuity.json) records the new CSS hash and checks. This continuity check is static; no second computed-style browser run is claimed. Historical fixture scripts are tied to the named intermediate stylesheet and require that exact bundle to reproduce the original run.

**Limits retained:** no exact contrast claim over translucent/gradient sea, no whole-product accessibility certification, human comprehension, screen-reader speech, listening/clipping/loudness, FPS or normal/reduced-motion equivalence claim. The original pre-fix and intermediate evidence remain separately labelled below. Art's final changes are confined to report/evidence files.

## First post-fix review — intermediate CSS and captures (historical)

The pre-fix evidence below is finalized as a historical snapshot; its Python/JSON pair calculations are retained unchanged. The lead applied the first coordinated fixes and rebuilt `index-C0JQC03C.css` / `index-rLnd_onY.js`. These intermediate capture fingerprints were source `523650da17bc2355db1af0b0d9df50d0143ff2b89b1e5c3fcff8409d36d13ea3` and dist `dfe6b9ed4ffcbbcdfa7a2800ca60a8b87cc34e58ab0b877b5a625fb28ec084e2`; final reservation-fix acceptance is above.

**Built-CSS result: pass for the reviewed pairs.** An isolated headless Chrome fixture loaded the unchanged production stylesheet and read `getComputedStyle`, including actual `:focus-visible` and hover states. This used its own `art-css-postfix` session, now closed, without touching UX's browser or game storage. Raw computed results: [postfix-computed-css-2026-11-05.json](evidence/art/postfix-computed-css-2026-11-05.json); arithmetic plus CSS fingerprint: [postfix-contrast-summary.json](evidence/art/postfix-contrast-summary.json). The neighbouring fixture, measurement and summary scripts reproduce the evidence. This is a colour/cascade check with representative DOM, not whole-game keyboard or font-size acceptance.

| Corrected pair / winning rule | Verified ratio |
| --- | ---: |
| Modal lead, finale rule/retry, ordinary modal text link: `#52675a` / `#f5f1e5` | 5.40 |
| Modal secondary button: `#52675a` / `#eaeadd`; hover `#dee3d0` | 5.02 / 4.64 |
| `.modal.finale-check-modal .text-button.final-accept`: `#9a5134` / `#f5f1e5` | 5.16 |
| Large modal heading emphasis: `#6f7866` / `#f5f1e5` | 4.08 (large text) |
| Guide note: `#52675a` / `#e8eadb` | 5.00 |
| Campaign metadata/progression: `#59695e` / `#f5f0e2` | 5.11 |
| Campaign ordinal/subtitle on current card: `#52675a` / `#edf2df` | 5.33 |
| Bell status: `#52675a` / `#e6ecdd`; needs-shelter small/queued: `#9a5134` / `#f0e4ce` | 5.05 / 4.64 |
| Normal queued-growth small: `#477254` / `#e6ecdd` | 4.58 |
| Lost verdict: `#9a5134` / `#f5f1e5`; unmet result: same foreground / `#e9ecdf` | 5.16 / 4.87 |
| Next-shore invitation: `#486452` / `#f5f1e5` | 5.77 |
| 2px solid focus `#264d45` against finale section / ordinary modal / chart | 7.90 / 8.34 / 8.27 |

SaveStatus, recovery and Met/Not met remain at their earlier passing values. The more-specific accept-defeat selector wins as intended. Intro button focus computes to light gold `#f1d89e`; its dark gradient endpoints `#143f44` and `#206064` give **8.25 and 5.16** respectively. Those are endpoint calculations, not an exact sampled ring/gradient contrast. No exact sea/alpha contrast is claimed.

Fresh screenshots actually inspected with `view_image` so far:

- Chrome root `output/playwright/programme-2026-11-05T13-48-17.252Z-af520652/`: `1366x768-100pct-campaign/{splash,map-1-queued-growth}.png`; `1366x768-100pct-rescue/{unsafe-final-planning,final-nourish-warning,final-nourish-feedback,first-light-defeat}.png`; `1920x1080-100pct-campaign/map-1-queued-growth.png`; `1920x1080-100pct-rescue/unsafe-final-planning.png`.
- Edge root `output/playwright/programme-2026-11-05T13-50-40.405Z-4bbbc928/`: `1366x768-100pct-controls/map-1-queued-growth.png`.
- Scaling root `output/playwright/programme-2026-11-05T13-52-28.981Z-770ff434/`: `1366x768-150pct-controls/map-1-queued-growth.png`. This is viewport/device-scale emulation (911×512 CSS viewport), not native OS scaling.

**HUD placement result: pass in these captures.** The Nourish callout clears the resource strip/action dock at both desktop sizes. The settled toast clears the expanded final-tide warning stack. The immediate Chrome queued-growth layout records bottom **585.58** versus forecast top **597.50**, about **11.92 CSS px** during entrance animation. In full-view final planning, both toast and final Nourish feedback end at **407.89** versus forecast top **419.89**, exactly **12 CSS px**. Their recorded `overlaps` arrays are empty. The selected label is clear in the inspected 100% views. Finale helper and rescue-button text now read more clearly while preserving the cream/green/rust palette; the splash retains a light gold focus outline on dark teal.

**Then-residual P2 — selected-label collision at 150% emulation (now closed above).** In the scaling root's `1366x768-150pct-controls/map-1-queued-growth.png`, the callout covers the left portion of the selected Sleeping Bell label, including part of the name and queued-growth line. The HUD itself remains clear and its layout JSON reports no overlap; that JSON checks `.action-dock`, `.forecast-resources`, `.bell-outlook` and `.advance-button`, not the world label. The overlap is observed while this transient notice is displayed; a single frame does **not** establish whether it clears after entrance animation or persists until dismissal. Source review showed that `measureReservedLabels` excluded opacity-zero elements and reservations were cached between World updates/resizes, consistent with the lead's fade-in timing hypothesis but not a proved runtime diagnosis. Art requested this exact recapture and made no source change.

At this intermediate checkpoint, fresh dense-fleet verification was pending; it is now complete in the final signoff above. The earlier accepted renderer treatment and all listening/motion/comprehension limits still apply. Art has changed only report/evidence files.

## Pre-fix frozen-build visual and contrast review — 5 November 2026

**Pre-fix decision:** accept the renderer/art treatment in the inspected frames: the palette, full-grown fleet, selected shelter cause, queued-growth text and retained whale are coherent. UI signoff was conditional on the narrow contrast and feedback-placement fixes below. These recommendations were unapplied at this snapshot; see the separate post-fix verification above for current status. This initial review changed only this report and `docs/pillars/evidence/art/contrast-review-2026-11-05.{py,json}`.

### Evidence and acceptance scope

UX capture root: `output/playwright/programme-2026-11-05T13-30-45.108Z-6652214a/`.
Recorded source hash: `3d1795dad687a0e5439bff67e42f12da047bcd9374c8f4bf3e70e15a0475c519`;
dist hash: `bacd8437681bf61186190fbd11e0d35945fc79bc4c9858c01f08a74a27273a16`.
The lead reported **207 tests and the Pages production build passing**. Art did not rerun those gates or operate the UX browser. The capture programme was still running when reviewed; this is acceptance of the named frames, not a claim that every programme scenario passed.

Actually opened with `view_image` (19 screenshots):

- `1366x768-100pct-campaign/`: `splash.png`, `opening-controls.png`, `map-1-forecast-sheltered-bell.png`, `map-1-queued-growth.png`, `map-3-forecast-exposed-bell.png`, `map-4-queued-growth.png`, `unspent-breakwater-preview.png`, `first-light-victory.png`, `map-5-opening-palette.png`, `map-7-opening-palette.png`, `map-7-dense-grown3-fleet.png`, `map-7-forecast-sheltered-bell.png`, `map-8-dense-grown3-fleet.png`.
- `1366x768-100pct-rescue/`: `final-nourish-warning.png`, `first-light-defeat.png`.
- `1366x768-100pct-saving/`: `saving-failed-modal.png`.
- `1920x1080-100pct-campaign/`: `map-4-queued-growth.png`, `map-7-dense-grown3-fleet.png`, `map-7-forecast-sheltered-bell.png`.

The opening chart, single-bell finale and results fit the 1366×768 captures. The save warning remains conspicuous inside the scrollable settings modal. Four full-grown bells are separable at 1366×768 and 1920×1080; gardens/groves remain different silhouettes without generic trees accumulating on buildings. The selected Forecast label explicitly names Little Tuesday or the Heart; solid safe cells and dashed destinations remain distinct, and an exposed bell does not acquire bright protection. Gold dashed proposed shelter still reads as a proposal. Queued nourishment has legible selected-label text; its tiny buds are secondary decoration, not the sole signal. The whale's body, tail and flippers are recognizable in both dense-fleet views; these frames provide no basis for a replacement asset.

Static images do not establish motion quality, normal/reduced-motion equivalence, stress-recovery timing, keyboard traversal, human comprehension, listening quality or clipping/loudness. Selected-source text sits on a translucent panel; no exact rendered contrast is claimed for it, sea marks or focus rings over water.

### Concrete UI defects and minimum repairs

**P2 — essential text/focus contrast on opaque surfaces.** Small helpers and secondary actions are visibly faint in `final-nourish-warning.png`, `first-light-defeat.png` and `first-light-victory.png`. Use existing darker greens/rusts; retain the cream panels, warm headings and dark teal intro. The table reports arithmetic on declared opaque CSS colours, using review targets of 4.5:1 for ordinary text and 3:1 for the large display emphasis/focus boundary. It does not measure a screenshot or certify the whole interface. The ordinary `.modal` is **`#f5f1e5`**; only `.start-modal` is `#f5f0e2`.

| Selector / essential use | Current foreground / actual opaque background | Ratio | Minimal recommendation (new ratio) |
| --- | --- | ---: | --- |
| `.modal-lead` — finale rule introduction, loss reason, replacement warning | `#7e8671` / `#f5f1e5` | 3.36 | `#52675a` (5.40) |
| `.finale-check-modal .finale-rule`, `.finale-retry p` | `#6f7866` / `#f5f1e5` | 4.08 | `#52675a` (5.40) |
| `.secondary-button` — Show this action, Retry/Replay, keep/cancel | `#738163` / `#eaeadd`; hover `#dee3d0` | 3.43 / 3.17 | `#52675a` (5.02 / 4.64); enabled buttons in these modal flows |
| `.text-button` in ordinary modals; `.final-accept` override | `#879472`; `#956446` / `#f5f1e5` | 2.86 / 4.44 | General modal link `#52675a` (5.40); accept-defeat `#9a5134` (5.16). Preserve campaign-intro override. |
| `.modal h2 em` in ordinary finale/result modals, large text | `#87906e` / `#f5f1e5` | 2.98 | `#6f7866` (4.08); preserve gold campaign-intro heading |
| `.campaign-pair > p span`; `.campaign-progression` | `#7c8170`; `#69786e` / `#f5f0e2` | 3.53 / 4.09 | `#59695e` (5.11) |
| `.campaign-bell small`; `.campaign-bell.needs-shelter small` | `#6c7b65` / `#e6ecdd`; `#975a36` / `#f0e4ce` | 3.74 / 4.36 | `#52675a` (5.05); warning `#9a5134` (4.64). The warning small rule also wins for `small.queued-growth`. |
| `.result-conditions .needs-care`; `.result-modal.result-lost .result-verdict` | `#a75f4d` / `#e9ecdf`; `#aa604e` / `#f5f1e5` | 4.00 / 4.14 | `#9a5134` (4.87 / 5.16) |
| `.campaign-unlock` — next-shore invitation | `#567b56` / `#f5f1e5` | 4.26 | `#486452` (5.77) |
| `button/input:focus-visible` gold outline against ordinary modal, campaign chart, finale check section | `#bf8d3f` / `#f5f1e5`, `#f5f0e2`, `#e8eddf` | 2.62 / 2.60 / 2.48 | Scope outline `#264d45` to ordinary modals and `.campaign-chart` (8.34 / 8.27 / 7.90). Preserve gold on dark `.campaign-intro`; do not blindly apply this to sea overlays. |

Positive opaque checks: `.save-status` **8.69**, `.save-recovery-note` **6.23**, `.finale-checks .ready` **5.34**, `.not-ready` **4.89**, section explanation **5.32**, current campaign card subtitle **5.33**, current card action **6.58**, ordinary primary button **7.09**, campaign save note **5.11**. No further change is recommended for these. Disabled campaign cards are intentionally faded and excluded; the redundant decorative ordinal is not a release blocker. Small 8–9px status text still merits future readability testing even where the ratio passes.

Reproduce the exact pair calculations with `python docs/pillars/evidence/art/contrast-review-2026-11-05.py`; recorded output is [contrast-review-2026-11-05.json](evidence/art/contrast-review-2026-11-05.json). These are static CSS calculations, with no pixel sampling or assumed compositing over sea/gradients. Focus recommendations require a keyboard capture after application; current screenshots alone do not prove every focused control's outline.

**P2 — resource feedback overlaps the next decision.** In `1366x768-100pct-campaign/map-4-queued-growth.png`, the Nourish callout occupies approximately x592–890/y535–650 and crosses the after-tide strip at x808–1058/y598–646. Map 1 shows a smaller version. In `1920x1080-100pct-campaign/map-4-queued-growth.png`, the callout crosses the Anchor/Nourish end of the action dock. It obscures information during the action confirmation; its mostly `pointer-events:none` styling does not solve visibility. Placement is fixed from `origin.y - 148`, clamped only to `innerHeight - 160` (`src/App.tsx:214`); `.resource-callout` (`src/ui/roadmap.css:28`) has content-dependent height. Minimal fix: after measuring the callout, clamp it at least 12px above any horizontally intersecting action/advance HUD rectangle, including wrapped forecast text. Recheck both captures and long explanations. No new panel design needed.

**P2 — settled-tide toast intersects a raised forecast strip.** In `1366x768-100pct-campaign/map-7-dense-grown3-fleet.png`, the toast at approximately x501–864/y546–590 overlaps the after-tide strip at x808–1058/y562–610 when the bell warning raises that strip. The last portion of the toast/close area and forecast background collide. Map 8 without that warning has separation; the 1920px full-view map 7 frame has separation. `.sea-focus .toast { bottom:178px }` (`src/ui/compact.css:80`) is a fixed clearance. Minimal fix: reserve clearance above the actual advance-area top when they intersect horizontally; a compact-view bottom adjustment may suffice if verified with warning + wrapped resources. Keep 12px separation, retain the existing single toast and test long text.

After those changes, UX should recapture the exact named warning/result/queued-growth/dense states at both sizes, plus keyboard focus on Show this action, Retry, a campaign card and a settings input. Art can then close the limited UI exceptions. No new renderer wave, asset spend, audio changes, commit or publishing action is proposed by this review.

## Implementation wave 2 — effects lifecycle and paired daylight

Completed AA-04's lifecycle scope and a restrained AA-06 preset scope. No new score,
sample, whale replacement, cinematic, saved field or App edit was made in this wave.

**Authored source:** `src/ui/audio.ts`, new `src/ui/audio.test.ts`, new
`src/world/artDirection.ts`, new `src/world/artDirection.test.ts`, and `src/world/World.tsx`.
**Authored documentation:** `docs/music.md`, `docs/assets.md`, and this report.

### Stable audio integration contract for Project Lead

- Import `updateEffects`, `stopEffects` alongside the unchanged `playChime` API.
- In the settings effect call `updateEffects({ enabled: session.settings.sound, volume: effectsVolume })`; dependencies are master sound and effects volume. It never creates/resumes audio by itself.
- Also update effects synchronously in the master-mute handler before any chime/unlock work, so an unresolved resume cannot slip through between the gesture and React's settings effect.
- Add `stopEffects()` to the app's final cleanup alongside `stopMusic()`. It cancels pending resumes/cues, stops/disconnects voices, removes the visibility listener and closes the context; repeated cleanup is safe.
- Remove `select` from the App music-duck path; keep the current action/tide and result/error ducks. Art has not edited `App.tsx` or `music.ts`.
- Existing `playChime(kind, enabled, volume)` calls remain valid. Once configured, the bus owns the volume; the per-call level caps a new cue without applying matching volume twice. Settings affect active voices as well as future calls.

The retained effects bus fades mute/zero volume to zero in **60 ms**. Future scheduled
notes cancel immediately; active notes stop after the short fade. Pending unlock
requests are invalidated, so unmute/page return cannot replay the old fanfare.
Page hiding cancels effects and suspends after cleanup; showing a page waits for a
new chime to resume. Selection clicks within **140 ms** coalesce. Priority is
result > error > action/tide > selection, with repeated critical cues suppressed
while one of that priority plays. A hard cap of **4 current cues / 24 connected
voices**, including retiring fades, protects bursts. Original notes are retained.

### Paired daylight integration contract

- `getArtDirection(campaignMap?)` maps 1–2 to first morning, 3–4 to garden noon, 5–6 to open water, and 7–8 to homeward gold. Missing/invalid campaign IDs return the original look; free-seed text never selects a chapter.
- World consumes existing `state.campaignMap`. Only background/fog/light colours and a bounded sea-tint uniform change; light intensities, exposure, chart cue colours, base materials, rules and camera are unchanged.
- The `.world-root` `data-art-direction` attribute records the active preset for capture verification. Presets switch on state update, so opening another map needs no remount or schema migration.

### Verification and frozen-build review

- Focused wave-2 run: `node node_modules/vitest/vitest.mjs run --maxWorkers=1 src/ui/audio.test.ts src/world/artDirection.test.ts src/world/WeatherVisual.test.ts src/world/weatherModel.test.ts` — **36 tests across 4 files passed**.
- Isolated TypeScript program rooted at the audio/preset source+tests and `World.tsx` — **0 diagnostics**. Scoped diff whitespace check passed; no full build/suite was run by Art.
- Audio tests use mock Web Audio scheduling, including pending-resume mute/dispose, active/future cancellation, rapid unmute, hidden-page cleanup, unavailable audio, zero volume, priority and hard bounds. This is not a real-device listening or clipping measurement.
- UX/lead capture maps 1, 3, 5 and 7 in calm planning and storm Forecast at 1366×768 and 1920×1080, high/low graphics and reduced motion; confirm the existing cue colours remain readable in all four treatments and free voyage returns to the original palette.
- After App wiring, verify gesture-only startup, master mute during a result tail, zero-volume settings, rapid selection, hide/show with a real tab, cleanup/remount and a new accepted action after unmute. Record an integrated mix before any claim about loudness/clipping/fatigue.
- No human listening/comprehension or current browser visual signoff is claimed. AA-05 remains conditional; the working whale asset was retained. Source edits stop at this handoff so UX can test a frozen build.

## Implementation wave 1 — 5 November 2026 handoff

- **AA-01 implemented:** in Forecast/weather/harvest, selected islands emphasize the exact rays of their actual post-drift protecting sources. Exposed selections have no bright protection; unrelated safe cells remain visible. Present/drift, no/invalid selection and proposed-breakwater semantics remain intact.
- The selected Forecast label names its shelter source(s), also included in the button's accessible name. A self-protecting breakwater is named explicitly. This uses the existing label, not another overlay.
- **AA-02 restrained pass implemented:** one mesh-width solid selection contour replaces two thin circles; dashed destination hexes replace destination circles; exposure uses a broken windward arc; recovery uses six contracting segments. Blocked crosses and whole growth halos remain. No weather batches or persistent label families were added.
- **AA-03 restrained pass implemented:** garden beds fill with larger crops and additional ripe rows; existing grove canopies develop; breakwaters gain taller stones and base courses within their original footprint. Generic extra trees are retained only on unbuilt/non-bell islands.
- Queued nourishment now uses three still closed buds and selected-label/accessible text. Existing growth-stage rendering, bell morphs, harvest halo and procedural fallbacks remain; this wave does not add a continuous bloom tween or new model assets.
- **AA-07 inventory implemented:** manifest now includes both models, music/synthesis, effects and favicon, plus procedural scenery/fallbacks, system-font use, installed runtime notices and non-runtime references. Project distribution rights are explicitly unspecified rather than invented.

### Exact files authored in this wave

- `src/world/WeatherVisual.ts`; `src/world/WeatherVisual.test.ts`.
- `src/world/World.tsx`; `src/world/planning.css`.
- `assets/manifest.json`; new `docs/assets.md`; `docs/music.md`; `docs/whale.md`.
- This report, `docs/pillars/art-audio.md`. No GLB/Blender/image assets or shared App/style/state/save/audio modules changed by Art.

### Checks actually performed

- Focused command: `node node_modules/vitest/vitest.mjs run --maxWorkers=1 src/world/WeatherVisual.test.ts src/world/weatherModel.test.ts src/world/planning.test.ts src/world/batchIsland.test.ts src/world/assets.test.ts` — **32 tests across 5 files passed**.
- Five new weather cases cover incoming-source emphasis/union, exposed selection after drift, moved/blocked sources, overview/calm/proposal paths, and all six winds across display phases/quality/motion. Existing checks now also cover selected pre-growth reach and windward exposure-arc orientation.
- Isolated TypeScript program rooted at `World.tsx` and `WeatherVisual.ts`, using repository compiler options with no emit/incremental output — **0 diagnostics**.
- Both GLBs freshly loaded with the installed `GLTFLoader`; sizes, triangle counts, bounds and animations measured. No visual rendering was claimed by this metadata check.
- Manifest JSON, 13 source/runtime references, three asset SHA-256/byte counts and four installed dependency notice paths verified. Scoped `git diff --check` passed (only repository LF/CRLF conversion advisories).
- Full suite/build, browser interaction, screenshots, listening and human studies were deliberately left to the integration/verification wave. No FPS benchmark, asset spend, commit, push or deployment.

### Integration contract and capture states

- `WorldProps`, `WeatherVisualConfig` and renderer factory API are unchanged. App needs no new prop, callback, setting or migration. `getWeatherPresentation` remains unmodified and authoritative; new focus work happens during update, not per frame.
- The manifest is documentation metadata (no runtime consumer found); version 2 adds fields. Actual exported model bytes remain unchanged.
- Named shelter causes add one contextual line to the existing selected label; UX should check displacement/leader lines and keyboard focus in compact and full views.
- Lead runs the full test/build gate. UX owns live browser; Art has not taken control of that browser or asserted visual acceptance.

| Capture / playthrough state | Expected visible result / key check |
| --- | --- |
| First Light storm Forecast: selected sheltered bell, then exposed bell | Bright cells belong to its protecting source(s); named source matches. Exposed bell has no misleading bright shelter; unrelated safe cells remain. |
| Reproduce `WeatherVisual.test.ts` moved-source fixture: tide 5, blocker (2,0) unanchored, bell (4,-1) anchored | Blocker resolves to (3,0), focused safe cell (4,-1); current and forecast remain distinguishable. Add obstacle (3,0), bell (3,-1) for blocked-source case. |
| Breakwater proposal, then committed build → weather → harvest | Gold dashed proposal remains distinct and unspent; actual source emphasis and pre-growth reach match the result; growth never extends same-tide shelter. |
| Garden/grove/breakwater growth 0–3; nourishment waiting, then actual safe growth | Purpose-specific silhouettes; buds/text mean queued, whole halo means resolved growth; no generic tree pile on built islands. |
| Selected drifting island, blocked drift, stress recovery 3→2 and actual growth | Solid selection, dashed hex destination, cross, windward broken risk, segmented recovery and whole growth halo remain distinguishable. |
| Thirteen-island map with four bells; high/low graphics; normal/reduced motion | Quiet water remains; readable selection and source text without overlapping controls; no effects-only information. |

Run these at **1366×768 and 1920×1080**. Record map/seed/tide/settings and exact commands for any captured state. Include click/keyboard selection, forecast toggle, undo/reload, skip and fallback asset-load cases during integrated verification.
Remaining limitations: no new rendered contact sheet or human comprehension/listening evidence; no continuous bell bloom animation; source text may need shortening if dense labels crowd. AA-04/05/06 are outside this assigned wave. Distribution policy/packaged notices remain a lead release decision.

## Milestone 0 snapshot (before the implementation above)

## Evidence and limits

- Read `AGENTS.md`, `docs/todo.md`, `docs/improvement-plan.md`, `README.md`, and the renderer/audio sources cited below.
- Reviewed local world/planning/whale styles, compact/weather/campaign/outcome styles, shared style tokens, and App audio integration.
- Read the relevant weather, asset URL and batching tests; did not execute tests or a build. UX & Engineering owns the fresh baseline.
- Visually inspected four existing captures, all **historical September 2026 evidence**, not captures of today's checkout:
  - H1: [weather-events.jpg](../weather-events.jpg), 1366×768: thirteen-island storm resolution with one detailed label and compact stress changes.
  - H2: [compact-sea.jpg](../compact-sea.jpg), 1024×640: compact planning, selected bell, whale destination and missing-link annotation.
  - H3: [campaign-splash.jpg](../campaign-splash.jpg), 1920×1080: warm editorial introduction, paired map cards, recognisable whale.
  - H4: [campaign-fleet.jpg](../campaign-fleet.jpg), 1920×1080: thirteen islands, forecast destinations and distinct building families.
- Historical H3/H4 contain more visible world labels than current selected-only logic permits; do not treat those old layouts as current defects.
- Performed a fresh, read-only GLB header/JSON inspection: bell 265,108 bytes, 28 meshes, `Closed` morph targets, no textures; whale 207,548 bytes, 28 meshes, `GentleSwim`, no textures.
- Both files are glTF 2 with matching declared/file lengths. Bell default scene has one root plus an empty secondary scene; whale has one scene. No render defect inferred from the empty scene.
- Verified both `.blend` source files and both generator scripts exist. Inspected generator material/morph/animation/export declarations; did not rerun Blender.
- `docs/verification.md:130–136` records earlier audio/browser checks and no clipped samples; those measurements remain **historical** and are not a listening review.
- No live browser control, new assets, audio render/listening session, tests, build, benchmark, Git mutation or publishing was performed.

## Current-state audit

### Keep the existing identity

- `src/world/World.tsx:21–27` already defines cream, sage, coral, wood, dark green and gold, with mostly rough materials. This is a coherent foundation, not placeholder art.
- `World.tsx:110–200` builds layered coastlines, gardens, groves, a lighthouse breakwater, town clock tower, paths, docks and growth vegetation. H1/H4 show these readable families.
- `World.tsx:238–251` uses an orthographic camera, warm hemisphere/key light, cool fill, ACES exposure and soft shadows. Low quality disables shadows (`:412`) without changing rules.
- `World.tsx:203–225,535–550` provides restrained water motion, darker storm water, gentle island movement and reduced-motion handling. Do not replace the sea with noisy realism.
- Bell growth already changes size and `Closed` morph influence (`World.tsx:146–160`); ordinary growth already adds trees (`:183–185`). Neither growth nor blooming is missing.
- Selection, drift arrows, blocked crosses, Heart chains, missing links, ghosts, shelter gaps and whale destinations already exist (`World.tsx:258–384,510–525`).
- `World.tsx:455–503` supplies compact markers, detailed selected-island text and accessible button labels; `labelLayout.ts` and leader lines address label displacement.
- `WeatherVisual.ts:94–132,216–279` uses bounded instanced overlays, exact hex cells, directional surf, recovery and growth effects. Low quality reduces storm streaks from 48 to 26.
- `weatherModel.ts:42–86` derives post-drift positions, blockers and stress from the actual forecast; pre-growth shelter reach is deliberate. Preserve this authority.
- `Whale.ts:6–66` already loads a finned animated GLB with a procedural fallback, wake, spray and tow reaction. `World.tsx:351–387,561–580` handles encounter placement and towing.
- `OutcomeEffect.tsx:11–44` and `outcome.css` already distinguish victory/defeat, with a 2.9-second interlude or 150 ms reduced-motion transition before results.
- `audio.ts:3–47` supplies six effect classes, including distinct rising victory and falling defeat cues. `App.tsx:172–176` already ducks music for feedback.
- `music.ts:9–66,168–224` implements the original 68 BPM, sixteen-bar piano theme, four arrangements, mood changes at bar boundaries and a 1.2-second crossfade.
- `music.worker.ts:7–51` synthesizes cached notes; `music.ts:105–153,226–264` handles worker fallback, gesture unlock, hidden-page suspension and cleanup.
- Separate music/effects levels, piano toggle, master mute and stored preferences exist (`App.tsx:128–143,425`; `storage.ts:4,66–87`).

### Observed gaps versus hypotheses

| Evidence | Observed fact | Player risk / what remains unproven |
| --- | --- | --- |
| `WeatherVisual.ts:177–190` | Bright shelter cells belong to every breakwater and the selected island's outgoing ray. | Selecting a sheltered bell does not specifically emphasize the source protecting it. Whether players need that emphasis requires observation. |
| `WeatherVisual.ts:127–132`; `World.tsx:258,323,521` | Exposure, recovery, growth, selection and destinations use closely spaced rings; gold also signifies links, selection and proposals. | H1/H2 suggest competing thin marks; colour/motion confusion has not been measured in the current build. |
| `World.tsx:183–192` | Ordinary growth adds trees regardless of building; nourishment adds tiny shore sprouts. | Garden/breakwater growth and queued nourishment may be hard to distinguish at fleet scale. No new-player identification data exists. |
| `World.tsx:428–429` | A changed growth signature rebuilds the island; bell morph level changes at harvest. | The bloom may read as a jump rather than an earned change. This needs a live sequence review. |
| `audio.ts:3–24` | Each call creates voices connected directly to the destination; no retained effects bus, voice ceiling or stop-effects API. | Disabling sound gates future calls but cannot cancel an already scheduled effect tail through this API. Rapid-click masking/clipping is a risk, not an observed listening failure. |
| `App.tsx:132,175` | Finale outranks storm, storm outranks disconnected; even selection ducks music to 0.65. | A storm can mask the musical disconnected mood, and frequent selections may cause audible pumping. No audition performed. |
| `Whale.ts:51–61`; H2/H4 | Swim/spray respond to motion/quality; availability information already has text and selected destination geometry. | Ambient swimming may resemble an available offer; tail clarity and used-state understanding need live review, not a replacement asset by default. |
| `assets/manifest.json:1–28` | Manifest lists the bell only and still calls the whale procedural; music/whale authorship is in separate documents. | Release provenance is fragmented. This is a concrete documentation gap, not evidence of unlicensed content. |
| H3; `campaign.css` | Map cards share one treatment; current scene lighting has no map-specific art input. | Later maps may feel visually interchangeable. World must define meaningful identity before Art decorates them. |

## Direction: a living botanical sea chart

Preserve rounded faceted land, oversized botanical bells, practical miniature buildings, warm paper panels and a calm piano voice.
Beauty should come from a clear silhouette, a well-placed accent and a meaningful change; keep quiet water between islands.
The hierarchy is: selected decision and imminent risk → bell/Heart objective → relevant shelter/link → ordinary production → scenery.
Keep sea teal and cliff cream; use darker stem/roof separations for silhouette. Reserve brass-gold emphasis for committed growth/success and selected intent with distinct shapes.
Use coral for exposure plus a non-colour symbol; sage for shelter plus exact cells; pale blue for whale offers plus an explicit destination label.
These are semantic roles, not a mandate to recolour every asset. Judge values in the rendered scene, including low quality, rather than hex colours alone.
Retain matte foliage/stone, restrained metal on the bell, and the existing warm key/cool fill. Avoid bloom, heavy particles, moving lights and camera shakes.
Structure silhouettes should remain separable in a flat thumbnail: tower/cluster = Heart; curved stem = bell; parallel beds = garden; dense crowns = grove; tower plus stone barrier = breakwater.
Growth should develop each structure's existing silhouette, not turn every developed island into another grove.
No ambience bed, new instruments, commissioned art or extra cosmetic inventory is justified before readability and listening evidence.

### State-by-state treatment

| State | Visual treatment to retain / improve | Sound and accessible equivalent |
| --- | --- | --- |
| Calm planning | Quiet sea; selected outline strongest; incidental foam below chart marks. | Sparse piano already exists; all choices remain legible with sound off. |
| Forecast drift | Solid direction arrow from current shore; dashed destination footprint; blocked cross. Keep storm travel visually thinner than island movement. | No repeating preview sound; destination, blocked status and resource text remain the equivalent. |
| Forecast shelter | Emphasize the selected bell's actual protecting source ray after drift; leave unrelated protection subdued. No broad cone. | Existing shelter/stress text remains authoritative; expose the named source in the selected text when UX integrates it. |
| Proposed breakwater | Keep dashed gold cells and “nothing spent”; preserve replacement production and exact post-drift reach. | No success sound until purchase; focus/selection and text communicate preview. |
| Storm resolution | Directional windward impacts, then stress delta; distinguish broken exposure marks from whole safe cells. De-emphasize completed drift marks. | One restrained weather accent only if listening demonstrates benefit; never one loud impact per island. |
| Recovery | A sparse contracting/segmented cue, separate from the growth halo; show the actual decrease, including 3→2. | Numeric stress change and existing phase caption; do not imply shelter clears all stress immediately. |
| Nourishment queued | Small stable bud/closed-leaf motif; no success bloom before growth resolves. | Keep action confirmation distinct from later growth; “growth waits” remains available. |
| Harvest/growth | Brief purposeful opening or structure change, then settle. Actual growth receives the gold accent; rations remain visually separate. | At most one short aggregate harvest cue per phase, not a four-bell cascade; text supplies every delta. |
| Whale absent/available/used | Quiet peripheral visitor → selected offer footprint → short tow reaction and retained used-state text. Preserve travel direction and later-current warning. | Optional brief tow cue; no repeated whale call or sound-only availability signal. |
| Finale risk | Selected unsafe condition and exact rescue target lead; suppress ornamental pulses. | Important warning above score; no tense loop solely because a panel is open. |
| Victory/defeat | Retain explicit verdicts and distinct interludes; test timing and return attention to next/retry choices. No extra screen-filling fireworks. | Existing separate stingers; silent and reduced-motion results convey the same outcome and reasons. |
| Chart / next map | Warm paper and strong chapter title; one small map identity accent tied to its lesson. | Preserve the theme; use silence between voyages if listeners prefer it, not eight new tracks by default. |

## Prioritized tickets

Sizes are relative: S = one bounded surface; M = several coordinated surfaces; L = cross-pillar/content work. No schedule promise is implied.
Order below is within this pillar; the lead's integrated roadmap and fresh UX findings take precedence.

### AA-01 — Show what shelters the selected bell (P0, M; first ticket)

- Player problem: “This bell says sheltered after drift; which island makes that true?” Current bright cells emphasize outgoing protection instead.
- Scope/files: `src/world/WeatherVisual.ts`, `WeatherVisual.test.ts`; consume existing `weatherModel.ts` data without changing it. Lead/UX may pair selected-label copy later.
- Dependencies: existing forecast contract; named ownership of renderer module; UX supplies current First Light and dense-fleet capture cases.
- Acceptance: forecast focus identifies actual contributing blockers, preserves all safe cells and proposal semantics, and never shows pre-drift protection as post-drift safety.
- Verification: focused renderer tests for six directions, blocked drift, overlapping blockers and pre-growth reach; current browser comparison at both desktop sizes with motion/quality variants.
- Fully specified contract, implementation sequence and handoff gate follow below.

### AA-02 — Distinguish chart signals without increasing density (P1, M)

- Player problem: circular shore/selection/risk/recovery/destination marks compete, especially when motion or colour is unavailable.
- Scope/files: `World.tsx`, `WeatherVisual.ts`, `world.css`, `planning.css`; UX owns coordinated compact/legend changes. Lead assigns a single `World.tsx` writer.
- Dependencies: AA-01 and UX's signal-priority agreement; this is a replacement pass, not an additional overlay layer.
- Acceptance: selected = solid outer contour; destination = dashed footprint; blocked = cross; exposure = broken windward arc; recovery = segmented contracting cue; growth = brief whole halo.
- Keep global route topology and existing text alternatives; no new persistent labels, rings or particle families. Preserve the selected island's click/keyboard affordance.
- Verification: compare calm/storm/forecast at 7 and 13 islands, 1366×768 and 1920×1080; grayscale review, reduced motion, low graphics and keyboard focus. Record ambiguity instead of claiming colour-blind accessibility from simulation alone.

### AA-03 — Make growth express the building's purpose (P1, M)

- Player problem: added trees communicate “more vegetation” more clearly than “better garden / longer breakwater”; queued nourishment and resolved growth need separate rewards.
- Scope/files: `World.tsx` island builders and harvest presentation; bell generator/source only if an inspected silhouette still requires revision. Preserve existing GLB morph and fallback.
- Dependencies: Gameplay confirms growth/production/reach teaching; AA-02 defines the reward cue; lead reserves `World.tsx` ownership.
- Acceptance: side-by-side growth 0–3 shows crop-bed fullness for gardens, canopy development for groves, and barrier/tower detail for breakwaters without implying a directional wall rule.
- Bell stages remain readable at four-bell framing; resolve one short bloom only after actual growth. Failed/delayed growth stays queued. Reduced motion presents the settled stage immediately.
- Verification: stage contact sheet from the real renderer, actual safe/unsafe harvest and undo/reload flows, GLB-failure fallback, low-quality review; no asset regeneration until needed.

### AA-04 — Control feedback priority and validate the mix (P1, M)

- Player problem: the same small chimes accompany many events; repeated selection ducks the score, while active effect tails have no master-mute control.
- Scope/files: `audio.ts`, focused audio lifecycle tests, `music.ts` only for agreed duck policy; lead integrates `App.tsx` calls. Retain worker/instrument unless evidence shows a problem.
- Dependencies: UX supplies action/phase event contract; Gameplay distinguishes action accepted, queued growth and resolved growth; AA-02 provides silent equivalents.
- Acceptance: effects bus follows master mute with a short fade (target ≤100 ms); stop/dispose is explicit; repeated selection is coalesced, with a bounded voice policy that preserves result/error priority.
- Selection no longer repeatedly ducks music by default; result/error cues retain priority. Any new harvest/tow cue is aggregate, optional and driven by committed events, not rerenders or previews.
- Verification: gesture/mute/reload/hide/resume/cleanup tests plus integrated recording of rapid clicks, tide skip and results at default/max settings; report actual peaks/clipping separately from listening judgement.
- Listening gate: full eight-tide session on speakers and headphones, then extended campaign/replay review; record fatigue, masking, transitions and chosen volume. Current theme variation is retained unless listeners identify repetition.

### AA-05 — Make the whale's job visible at fleet scale (P2, S initially)

- Player problem: a friendly ambient visitor and an available tow need distinct readings without making the creature a flashing button.
- Scope/files: `Whale.ts`, `whale.css`; placement/destination changes in `World.tsx` only under lead ownership. Inspect existing GLB before considering edits.
- Dependencies: UX's current offer comprehension findings and Gameplay's eligible/used/zero-action cases; AA-02's destination grammar.
- Acceptance: absent, offered, selected and used states are distinguishable through existing card/action/footprint language; nose, flippers and flukes read at default seven/thirteen-island cameras.
- Keep only the selected eligible destination, 1 action / 0 food, and subsequent-current warning; animation must not be required to identify availability or direction.
- Verification: browser offers on tides 2/5/7, used/no-actions/blocked cases, reduced motion/low graphics and forced model-load failure; commission silhouette edits only if these reviews fail.

### AA-06 — Give the campaign quiet visual continuity (P2, M)

- Player problem: eight maps risk sharing one visual memory; end effects can overshadow the practical invitation to continue or recover.
- Scope/files: proposed small `src/world/artDirection.ts` preset table plus renderer integration; `campaign.css`, `outcome.css`. World owns map meaning; lead owns state and shared UI integration.
- Dependencies: World/Gameplay map lesson matrix and AA-01–03 readability baseline. No changes to campaign data/schema merely to store cosmetic settings.
- Acceptance: at most four paired chapter treatments using existing light/water/vegetation accents, with one approved swatch/composition per pair; semantic cue colours stay constant.
- Preserve warm daylight readability; no dark level, new scenery pile, extra cinematic duration or new score per map. Outcome pacing/copy changes must support actual next/retry actions.
- Verification: all eight map starts/finales in a comparison sheet, two desktop sizes and low graphics; human recall of map differences and observation of next/retry selection. Revise presets if they obscure risk cues.

### AA-07 — Complete the asset and authorship ledger (P1, S; can precede polish)

- Player/release problem: maintainers cannot currently find one complete record of the assets needed to reproduce and ship the game.
- Scope/files: `assets/manifest.json`, `docs/music.md`, `docs/whale.md`, proposed `docs/assets.md`; no asset bytes change by default.
- Dependencies: lead confirms project attribution/distribution policy; Engineering supplies dependency notices used by the release.
- Acceptance: list bell, whale, procedural scenery/fallbacks, original composition/synth/effects, favicon, icon package and system-font usage; separate runtime assets from generated concept/reference art.
- Record source/generator/runtime path, author/provenance, external licence where applicable, dimensions/orientation, morph/clip contracts and file-size/hash check date. Do not invent a licence for project-created work.
- Verification: resolve every local ledger path, parse GLB metadata, compare generator/source statements, and inspect actual installed package notices. Historical claims remain dated; asset counts come from current files.

## AA-01 — Implementation-ready first assignment

**Before/after:** selecting a bell in storm Forecast currently leaves all breakwater rays bright and emphasizes the bell's own outgoing shelter. Afterwards, bright solid cells trace only the source rays that actually protect that bell after drift; the rest remain visible at baseline intensity.
**Owned writes:** `src/world/WeatherVisual.ts`, `src/world/WeatherVisual.test.ts`; unique captures under `docs/pillars/evidence/art/aa-01/`. No App, CSS, rule, save, asset or shared documentation edits in this bounded implementation.
**Public API:** retain `createWeatherVisual` and `WeatherVisualConfig` unchanged; derive focus on `update`, never in the animation loop. Import `getWeatherPresentation` for the supplied state/forecast as needed.
**Coordinate/time contract:** focus follows current geometry during ordinary plan/drift; this ticket changes emphasis only when `preview` is true or stage is weather/harvest. Never borrow next tide's direction or same-tide grown reach.

1. Keep current plan/drift treatment unchanged. In post-drift storm display, find the selected island's `WeatherPresentation` entry and its `blockerIds`.
2. For a selected sheltered island, focus the union of each contributing source's exact `shelterCells` from the presentation, including a breakwater's self-cell. This intentionally shows that source's complete legal reach, not a guessed cone.
3. For a selected exposed island, use no bright shelter focus; keep its existing risk/surf and baseline safe cells. Do not manufacture a protecting ray from its own outgoing shelter.
4. With no selection or an invalid selection, retain today's overview emphasis on breakwaters. For calm weather, draw no weather-protection cells as today.
5. When a breakwater proposal is active, retain today's proposal/underlay behaviour unchanged; proposed gold dashed cells remain the dominant layer and the real paid-command forecast remains authoritative.
6. Reuse `focused-shelter-fill/edges` and baseline batches. Remove focus cells from baseline duplicates as today; union of displayed safe cells must remain unchanged.
7. Preserve batch count/capacity, non-pickable flags, static reduced-motion frames and disposal; do not add animation, text or a new draw family.

**Automated acceptance cases (meaning, not snapshots of colours):**
- A bell moves out of shelter: its post-drift focused set is empty even though the current position was protected.
- A blocker drifts into sheltering position and a blocked blocker remains in place: highlighted cells match the supplied resolved geometry in each case.
- Overlapping ordinary/breakwater sources: union contains all actual source rays once; unrelated breakwaters remain baseline; selecting another island recomputes the set.
- Six weather directions; protected breakwater selected itself; no selection; invalid selection; calm tide; breakwater proposal bypass.
- Growth-1 breakwater becomes growth-2 this tide: only pre-growth reach is focused. Preserve existing full-coverage and resource-disposal assertions.
- No mutation of state/forecast; low/high quality and reduced motion change decoration only, never focused cell identity.

**Verification handoff:** run `npx vitest run src/world/WeatherVisual.test.ts src/world/weatherModel.test.ts` first; after integration, lead/Engineering runs the appropriate complete suite and `npm run build` once.
UX performs real-browser First Light forecast → drift → weather → harvest and thirteen-island review at 1366×768 and 1920×1080, including low graphics and reduced motion. Art reviews the resulting paired captures.
Use a selected sheltered bell, an exposed bell and a proposed breakwater; log seed/map/tide/action sequence/settings so the captures are reproducible. Save the exact state only in unique evidence if Engineering provides it.
Check that source rays are visible above water/foam, the selected outline remains identifiable, and no extra label or persistent overlay was added. Unit tests cannot establish this visual result.
Ask 3–5 new players to point to the protecting island and predict stress after drift; record answers verbatim. Target at least 4/5 correct on two varied examples when five participate; treat smaller samples as directional, not a release statistic.
Rollback is renderer-only: revert emphasis assignment if it hides essential overview information. Rules, saves and fallback models remain unchanged.
**Explicit exclusions:** new legend/help panel, cue recolouring, effect audio, broad shelter cones, gameplay changes, camera changes, shaders, generated assets, mobile work and FPS benchmarking.

## Production plan, dependencies and risks

- Milestone 1: AA-01 with UX's existing selected text; follow with the smallest AA-02 subset supported by fresh captures. Deliver one First Light learning improvement before cosmetic breadth.
- Milestone 2: World supplies chapter/lesson distinctions; Gameplay validates changed scenarios. Art prototypes no more than one dense-fleet treatment before expanding it.
- Milestone 3: AA-03/04 and evidence-gated AA-05/06. AA-07 can run as bounded documentation work whenever its owner is assigned. No external asset spend requested.
- Milestone 4: Engineering owns release checks; Art signs off current state captures and a real listening record, not historical passes or solvability witnesses.
- Shared ownership risk: `World.tsx`, `App.tsx`, `styles.css`, campaign/state contracts remain lead-controlled. Separate renderer tickets in time; no concurrent writes to `World.tsx`.
- Accessibility risk: palette swatches and grayscale previews do not prove accessibility. UX must check actual contrast, focus, announcements, display scaling and silent/reduced-motion paths.
- Truthfulness risk: shelter/growth presentation must use the resolver's order. Cosmetic “windbreak walls” or musical urgency must never imply rules that do not exist.
- Audio risk: separate effects/music contexts currently need coordinated mute/lifecycle handling; do not replace working synthesis or add sample dependencies as a shortcut.
- Scope risk: polishing all eight maps before observing one voyage can multiply decorative work. Freeze approved semantic colours and reuse a small preset set.

## Human playtest questions and lead decisions

- Before Advance: “Point to where this bell ends up. What shelters it there? What will its stress be?” Observe action before explaining.
- After harvest: “Which island grew, which only recovered, and which is still waiting? What told you?” Repeat once with motion off.
- During a whale visit: “Is a tow available now, what does it cost, and can the current move this island again?” Include a used visit.
- During listening: “Which sound meant an accepted action, a warning, or an outcome? Did you lower/mute the music, and when?” Record equipment and settings.
- After several maps: “Which places felt different, and why? What made you choose another voyage or stop?” Do not infer enjoyment from a win.
- Lead decision 1: accept AA-01 as the first renderer slice, or reprioritize from fresh UX evidence; assign exclusive module ownership.
- Lead decision 2: approve the existing warm botanical direction and seven-ticket restraint; confirm map identity with World before AA-06.
- Lead decision 3: schedule human observation/listening and identify the project attribution policy for AA-07. No paid asset decision is needed now.

Milestone 0 status at kickoff: audit, state direction, seven costed tickets and first-ticket specification delivered; that wave authored only this report. The subsequent implementation and current verification status are recorded at the top of this document.
