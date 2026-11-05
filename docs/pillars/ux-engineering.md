# UX & Engineering — implementation handoff and pillar audit

## Final acceptance handoff — complete, 5 November 2026

All commissioned browser work is complete. The final dense replay passed, and the lead's final
scaling rerun passed on the **same final source/dist fingerprints**. The delivery campaign screen,
JavaScript, CSS and GLB assets load successfully. All test-owned browsers and ephemeral servers
closed successfully; the lead-owned delivery preview remains running at
[the local game](http://127.0.0.1:4179/the-unreasonable-archipelago/).
No commits, push, deployment, extra test matrix or runtime edits were performed by UX in this phase.

| Build / owner | Command and scope | Result | Exact evidence |
| --- | --- | --- | --- |
| Feedback/contrast correction · UX | Default Chrome; campaign/saving/rescue at 1366×768 and 1920×1080 | 6/6; 44 captures; 34 tides; 4 wins, 2 deliberate losses | [Chrome summary](../../output/playwright/programme-2026-11-05T13-48-17.252Z-af520652/summary.json) |
| Same correction · UX | Edge `--quick`; controls/settings/saving, both desktop sizes | 4/4; 20 captures | [Edge summary](../../output/playwright/programme-2026-11-05T13-50-40.405Z-4bbbc928/summary.json) |
| Same correction · UX | Chrome `--scaling`; 125%/150% at both desktop targets | 4/4; 24 captures; HUD intersection checks passed, later superseded by selected-label fix | [Earlier scaling summary](../../output/playwright/programme-2026-11-05T13-52-28.981Z-770ff434/summary.json) |
| **Final label-placement fix · UX** | Chrome `--dense`; fresh 1366×768 context, all 8 maps earned through controls | **1/1; 37 captures; 64 tides; 8 victories** | [Final dense summary](../../output/playwright/programme-2026-11-05T14-13-26.557Z-1a5bda90/summary.json) |
| **Same final fix · Project Lead** | Chrome `--scaling`; reviewed returned report and representative image | **4/4; 24 captures** | [Final scaling summary](../../output/playwright/programme-2026-11-05T14-14-06.945Z-60b64efc/summary.json) |

Every completed matrix above recorded **zero page/console/network errors, zero console warnings,
zero asserted intersections and successful cleanup**. Source/dist remained unchanged within each
run. Final dense/scaling include the selected island label in the intersection assertion; the earlier
correction matrix checked HUD controls only. Art's residual selected-label overlap finding was real
and led to the final fix; earlier passes are not relabelled as coverage of the final revision.
No full Chrome/Edge matrix was repeated after that bounded placement-only fix, per lead direction.

Final build fingerprints (dense and lead's scaling both match):

- Source: `5597756b96aa3b3c5c48839ebe8de6e932aac76c692f323d9dfb9610044b0153`.
- Dist: `a54c1eb596009da333ca41ce4ac701ab98fb1622f055c6606c45b2d949249381`.
- Earlier feedback/contrast source: `523650da17bc2355db1af0b0d9df50d0143ff2b89b1e5c3fcff8409d36d13ea3`.
- Earlier feedback/contrast dist: `dfe6b9ed4ffcbbcdfa7a2800ca60a8b87cc34e58ab0b877b5a625fb28ec084e2`.

Browser versions actually run: **Chrome 156.0.8078.80**, **Edge 156.0.4314.58**;
cached Playwright **1.64.0-alpha-1790635538000**. All builds used
`/the-unreasonable-archipelago/`. Final dense ran 14:13:26–14:16:58 UTC (22:13–22:16 Perth).
The final five scenarios have **61 screenshots/layout records**, including **34 captures with
visible feedback**, all with zero intersections against the tested rectangles. `.layout.json`
preserves actual feedback/control coordinates; feedback was never dismissed to obtain a pass.

Final Art evidence: [map 8 grown fleet](../../output/playwright/programme-2026-11-05T14-13-26.557Z-1a5bda90/1366x768-100pct-dense/map-8-dense-grown3-fleet.png),
[map 7 grown fleet](../../output/playwright/programme-2026-11-05T14-13-26.557Z-1a5bda90/1366x768-100pct-dense/map-7-dense-grown3-fleet.png),
[150% selected-label/feedback clearance](../../output/playwright/programme-2026-11-05T14-14-06.945Z-60b64efc/1366x768-150pct-controls/map-1-queued-growth.png).
Dense evidence also includes queued growth, sheltered/exposed forecasts, build preview and naturally
reached map-opening palettes. Visually inspected the final map-8 fleet, scaled feedback/label
clearance, earlier corrected desktop Nourish/finale states, and the delivered campaign screen.
The [finale text capture](../../output/playwright/programme-2026-11-05T13-48-17.252Z-af520652/1366x768-100pct-rescue/final-nourish-warning.png)
and [visible toast above final-warning controls](../../output/playwright/programme-2026-11-05T13-48-17.252Z-af520652/1366x768-100pct-rescue/unsafe-final-planning.png)
remain explicitly from the earlier correction build.

Delivery preview: the first check [timed out](../../output/playwright/programme-preview-2026-11-05T14-12-25.681Z/summary.json)
before the lead restarted the server outside the sandbox. The subsequent single fresh navigation
**passed**, with HTTP 200 page/JS/CSS/GLB loads, the campaign start button and rendered canvas,
and no recorded errors: [successful preview check](../../output/playwright/programme-preview-2026-11-05T14-18-32.160Z/summary.json),
[campaign screen](../../output/playwright/programme-preview-2026-11-05T14-18-32.160Z/campaign-screen.png).
The preview check closed only its own browser and did not stop the delivery server.

Limits: scaling is emulated through CSS viewport/device scale, not actual Windows settings or
browser zoom-menu operation. The 125%/150% CSS sizes are 1093×614 / 911×512 and
1536×864 / 1280×720 respectively. DOM announcement transitions are verified; NVDA/screen-reader
speech, human learning/enjoyment, listening quality, FPS and universal accessibility compliance
are not claimed. There are no unresolved failures in the commissioned final browser scope.

## First integrated Chrome result — historical pre-correction build

Chrome completed and cleaned up at 2026-11-05 13:40:12 UTC. This was the functional baseline
before the lead's coordinated feedback placement and contrast corrections. No browser or preview
server remained from this run. The final evidence and resolved visual findings are recorded above.

Command: `node scripts/browser-smoke.cjs --all-maps --browser=chrome`.
Evidence: [run summary](../../output/playwright/programme-2026-11-05T13-30-45.108Z-6652214a/summary.json).
Chrome **156.0.8078.80**, cached Playwright **1.64.0-alpha-1790635538000**,
production base `/the-unreasonable-archipelago/`, 13:30:45–13:40:12 UTC.

| Journey | 1366×768 | 1920×1080 | Evidence count |
| --- | --- | --- | --- |
| All eight campaign maps | Passed | Passed | 96 screenshots, 128 resolved tides, 16 wins |
| Failed saving / recovery | Passed | Passed | 8 screenshots |
| Deliberate defeat / reload / Nourish rescue | Passed | Passed | 14 screenshots, 18 resolved tides, 2 losses and 2 wins |

Total: **6/6 scenarios, 118 screenshots, 146 resolved tides, 18 wins, 2 deliberate losses**.
Every scenario recorded zero page/console/network errors and zero console warnings. Source/dist
fingerprints stayed unchanged, no missing production assets were reported, and cleanup succeeded.
This is functional acceptance of this build, not final visual acceptance: Art identified visible
resource-feedback/after-tide overlaps and toast/raised-warning overlaps for the lead to correct.
The subsequent harness revision asserts actual visible rectangles without dismissing feedback
first. It records `.layout.json` beside each capture and checks `.resource-callout` / `.toast`
against `.action-dock`, `.forecast-resources`, `.bell-outlook` and `.advance-button` (0.5 CSS px
edge-contact tolerance). Required queued/final Nourish captures assert that the callout is present;
unsafe-final-planning asserts the settled-tide toast is present. These new checks are not included
in this historical run; their completed corrected-build results are in the final handoff above.

Frozen source SHA-256: `3d1795dad687a0e5439bff67e42f12da047bcd9374c8f4bf3e70e15a0475c519`.
Frozen dist SHA-256: `bacd8437681bf61186190fbd11e0d35945fc79bc4c9858c01f08a74a27273a16`.

Actual-control checks include keyboard/repeated Enter/Ctrl+Enter, modal focus and seed typing,
undo and whole-session reload, current-map Continue, replacement confirmation/cancellation,
saving notice visibility and DOM announcement episode counts, restored writes, low graphics,
reduced motion, final warning, exact replan checkpoint, real Nourish and recovered victory.
The saving scenario does temporarily fault `Storage.prototype.setItem`; it never seeds game state.

Art evidence in each `1366x768-100pct-campaign` / `1920x1080-100pct-campaign` folder:
`map-7-dense-grown3-fleet.png`, `map-8-dense-grown3-fleet.png`, all eight queued-growth captures,
selected sheltered/exposed forecasts for each map, unspent build previews, and opening palettes
for maps 2–8 reached through actual campaign wins. Steps and accessible trees accompany captures.
Inspected compact/full build previews, sheltered-source text, exposed forecasts, growth feedback,
palette openings, dense grown fleet, saving notice and final Nourish warning. Some immediate
captures retain normal transient notifications over world labels; that is separate from the HUD
overlap correction. No listening, NVDA/screen-reader speech, human learning or FPS claim.

## Implementation wave 1 — 5 November 2026

Status: assigned components and production-browser harness authored; focused checks pass.
Final browser acceptance commissioned after the lead reported 207/207 source tests, 5/5 UI checks,
TypeScript and the Pages-base production build passing. Runtime source and dist are frozen.
The subsequent browser journeys and final placement reruns are complete; see the final handoff above.
The Milestone 0 audit retained below describes the earlier baseline.

Completed edits owned by this pillar:

- `src/ui/SaveStatus.tsx` and `src/ui/save-status.css`: generic saving-failure notice for session
  or medal write failures, floating/inline presentation, and one persistent polite live region.
  Repeated failed writes and surface changes leave announcement text unchanged; success clears it.
  The visual copy is independent of the compact HUD/footer, has explicit text and forced-colour support.
- `src/ui/FinaleCheck.tsx` and `src/ui/finale.css`: each row now says “Met” or “Not met”; decorative
  icons are aria-hidden, long labels wrap, and “Show this action” accurately includes Nourish rescues.
  Existing props, simulator-derived conditions, legacy two-condition display and callbacks are retained.
- `scripts/browser-smoke.cjs`, `scripts/browser/ux-driver.cjs`, `scripts/browser/ux-support.cjs`:
  production journeys with no game-state injection, private headless contexts/loopback port,
  state/viewport/origin guards, source/build fingerprints, stale-build rejection and failure evidence.
- `scripts/browser/ux-components.test.cjs`: five Node-runner component markup regression checks.
- `scripts/browser/README.md`: commands, isolation, integration contracts and acceptance limits.
- This report and `evidence/ux/implementation-checks.md`; no shared schemas/configuration edited here.

SaveStatus integration contract (matches the lead's current source wiring):

```tsx
// Persistent, outside the inert HUD; never conditionally mount based on failure or dialog state.
<SaveStatus failed={sessionSaveFailed || medalSaveFailed} visible={!modalVisible} />
// Inside every active Modal; a static readable copy, not another live announcement.
<SaveStatus failed={sessionSaveFailed || medalSaveFailed} variant="inline" announce={false} />
```

Props are `failed`, optional `variant: 'floating' | 'inline'`, `announce`, `visible`, and `id`.
Keep the primary instance and its announce prop stable for one announcement per failure episode.
Only actual successful persistence clears the corresponding failure source. The component never
reads/writes saves, clears storage, claims success, steals focus or blocks play. Live-region speech
in real assistive technology remains unverified; the harness counts DOM announcement transitions.

Harness acceptance contract and prepared coverage:

- Default journeys exercise first start, keyboard/pointer actions, repeat-Enter safety, Ctrl+Enter
  advance, modal focus/seed shortcut guards, undo/reload, current-map Continue and target-named
  active-voyage replacement cancellation. Muted sound, reduced motion and low graphics use real controls.
- Blocked-storage scenario checks visible planning/modal notices, exactly one live insertion per
  failure episode, no dialog-transition duplicates, successful-write recovery and persisted reload.
- Full First Light loss/rescue uses the reference route with tide-3 Nourish omitted: warning,
  “Show this action” without spending, real Nourish/Undo/Reload, explicit defeat, saved start-of-tide
  checkpoint, Replan, Nourish and victory. No fabricated save or direct simulator action enters the app.
- `--all-maps` follows every existing campaign witness through controls at 1366×768 and 1920×1080.
  It captures selected sheltered/exposed storm forecasts, unspent build previews, and grown-three-stage
  thirteen-island fleets for Art review, alongside win/loss and saving evidence.
- `--scaling` adds bounded 125%/150% display-scaling emulation at both desktop pixel targets;
  `--browser=msedge --quick` adds bounded Edge controls/saving smoke when installed.
  Scaling emulation is not actual OS/zoom-menu operation. There is no FPS measurement.
- New run evidence goes to unique `output/playwright/programme-<timestamp>-<id>/` folders,
  per the lead's Playwright-skill path clarification. Kickoff evidence stays in its original location.
  Source changes during a run invalidate it; the earlier CLI anomaly's cause is still unproven.
  Fresh headless contexts, no shared daemon/profile, private ports and exact-state checks address
  possible interference and make any recurrence fail explicitly.

Actual authoring verification: five markup tests pass; scoped component TypeScript check passes;
all harness files parse; preflight validates eight witnesses and the final Nourish rescue using the
available cached Playwright module without launching it. See [check details](evidence/ux/implementation-checks.md).
The initial markup assertion's data-attribute expectation was corrected; no runtime defect was hidden.
Lead owns full tests/build and Vitest discovery separation for the Node component test file.

The commissioned browser runs and screenshot review are now complete, with exact scope and
remaining non-browser limits in the final handoff above. Programme release acceptance remains with the lead.
Human learning, listening, assistive-tech speech and enjoyment are not claimed. No commits/push/deploy.

## Milestone 0 audit and improvement plan (historical kickoff record)

Date: 5 November 2026 (Australia/Perth). Status: bounded kickoff complete; implementation not started.
Baseline commit: `f14e9a2603a9809e34e7575cf271f109efbff7d0`. Owner: UX & Engineering pillar.
Source remained read-only; writes are this report and `docs/pillars/evidence/ux/`.
Lead retains App.tsx, styles.css, persistence schemas, cross-cutting state and programme acceptance.

## Pillar direction

Players should know what a decision costs, predict its spatial consequences, recover deliberately,
and trust that their voyage will resume. Keep the sea central and make essential information
equally available through readable text, keyboard controls and assistive technology.
Preserve the substantial existing forecast, compact-layout and recovery work; fix specific gaps
before adding panels or conducting broad component/state refactors.
Suggested order: saving honesty and safe voyage switching; semantic forecasts and first-voyage
learning; keyboard transition coverage; wider desktop and production release verification.
This is a pillar queue for lead reconciliation, subordinate to `docs/todo.md`.

## Fresh verification baseline

- Read AGENTS.md, README.md, docs/todo.md, docs/improvement-plan.md, docs/verification.md,
  App.tsx, relevant styles, world labels, UI/persistence/recovery/progress modules and tests.
- Environment reported Node `v24.13.1`, npm `11.10.0`, Vitest `3.2.7`, Vite `6.4.3`.
- Initial literal PowerShell `npm test -- --maxWorkers=1`: exit 0, 133/133 tests, 18/18 files,
  duration 21.23s; npm warned `Unknown cli config "--maxWorkers"` and ran `vitest run` without it.
- Corrected Windows invocation `npm.cmd test -- --maxWorkers=1`: exit 0, 133/133 tests,
  18/18 files, duration 32.74s; output confirms `vitest run --maxWorkers=1`.
- Only after tests finished, `npm.cmd run build`: exit 0; TypeScript and Vite succeeded,
  1,618 modules transformed, Vite build 18.96s. JS 1,035.13 kB / 289.78 kB gzip;
  CSS 76.21 kB / 16.36 kB gzip; music worker 0.99 kB.
- Build warning: chunks exceed 500 kB after minification; this is an advisory, not a measured
  load-time or FPS failure. No bundle rewrite is justified by this warning alone.
- Logs: [single-worker tests](evidence/ux/tests-single-worker.txt), [initial invocation](evidence/ux/tests.txt),
  [build](evidence/ux/build.txt). Local production preview used `127.0.0.1:4178`, root base path.
- Used the Playwright skill and cached CLI 0.1.22 with an isolated temporary Chrome profile.
  npx lookup failed with ENOTFOUND; cached CLI avoided installing dependencies.
  Chrome's crash service failed inside the Windows sandbox; approved external launch and local
  preview resolved that environmental limitation. No public game site or personal profile used.
- Fresh screenshots visually inspected: [splash 1366](evidence/ux/splash-1366.png),
  [First Light 1366](evidence/ux/first-light-1366.png), [First Light 1920](evidence/ux/first-light-1920.png).
- [Browser evidence index](evidence/ux/browser-audit.md) records steps, environment, cleanup and exclusions.
- Fresh controlled checks: keyboard Enter starts campaign; automatic compact/full layouts;
  P toggles preview; Nourish changes food 10→8 and actions 3→2; reload retains queued growth
  and undo; Continue then Ctrl+Z restores food 10, actions 3, no queued growth and empty undo.
- Bell-check modal: Shift+Tab wraps Close→Keep planning; Escape returns focus to its opener.
  Settings→Restart focuses Close in the new dialog; two Escapes return through settings to play.
- Initial compact viewport had document dimensions exactly 1366×768. Both required-size
  screenshots show the action dock, advance control and selected bell without clipping.
  This is opening-layout evidence, not campaign-wide, zoom, contrast or screen-reader certification.
- Confirmed campaign-card replacement and blocked-saving visibility as detailed below.
- Later audit state changed unexpectedly: the tab became about:blank once, viewport later read
  1689×1277, and the final advance check reached tide 3 with a different selection than expected.
  Cause is unestablished; do not attribute it to game code. Exclude that segment from controlled
  transition/growth evidence. Preserve its raw result in `evidence/ux/first-tide-result.txt`.
- Console inspection at the end reported zero warnings/errors for the current page; it does not
  establish a clean uninterrupted session. Animation skip, full first-voyage victory/defeat,
  final replanning, low graphics, reduced motion, other browsers and human listening remain untested live here.
- September screenshots, eight-map browser victories and recovery checks in verification.md are
  **historical**. Today's simulation suite passes them logically; it does not refresh those UI journeys.

## Current implementation and evidence-based findings

### Existing strengths to preserve

- `src/App.tsx:191–227`, `src/ui/feedback.ts:4–18`: action feedback distinguishes immediate
  spends, action count and after-tide food; Ctrl+Z uses genuine same-tide snapshots.
- `src/App.tsx:384–397`: buttons expose resource descriptions, whale costs and rations;
  the full layout includes production-minus-rations arithmetic. These features are implemented.
- `src/App.tsx:87–95`, `src/ui/compact.css:18–82`: responsive sea focus, edge chips and
  one expanded panel already reduce clutter. The opening screenshots support this layout choice.
- `src/App.tsx:37–58,284–297,319–345`: focus trap/return, input-field shortcut guards,
  modal/background inertness and blocked actions during resolution already exist.
- `src/App.tsx:376`, `src/world/World.tsx:497–503`: text tow targets, selectable map labels,
  pressed state and forecast descriptions provide alternatives to pointer-only map interactions.
- `src/App.tsx:229–245,267–275`, `src/ui/FinaleCheck.tsx`, `src/ui/finaleRecovery.ts`:
  unsafe final advance warning, simulator-backed rescue and genuine First Light checkpoint exist.
- `src/ui/storage.ts:21–70` validates roster, geometry, resources, rules, campaign and undo;
  legacy rule/geometry compatibility is explicitly tested in late-voyage/roadmap storage tests.
- `src/ui/campaignProgress.ts:4–16` keeps unlocks monotonic and explains legacy versus modern loss;
  `achievements.ts:9–20` separates campaign medals and preserves better records.
- `src/ui/TideSequence.tsx:12–36` has three phases, status text, skip and reduced-motion timing;
  `OutcomeEffect.tsx:19–28` defers accessible results to the modal and shortens reduced motion.
- Existing tests cover 400 generated winning witnesses and 1,000 deterministic/in-bounds seeds,
  every campaign route, save/undo roundtrips, final advice, recovery, weather and rendering helpers.
  They establish correctness and feasibility, not enjoyment or first-time comprehension.

### Observed/code-confirmed gaps

1. **Hidden saving failure:** App.tsx:142 sets saveFailed; its only visible message is the footer
   at :400. compact.css:69 hides that entire span. Fault-injected Storage.setItem failure at
   1366×768 produced the correct message with display:none, zero-size rect, and no status/alert.
   [Raw check](evidence/ux/save-failure-compact.txt). This can leave a player unaware of unsaved progress.
2. **Immediate voyage replacement:** CampaignScreen.tsx:26 calls onMap directly;
   App.tsx:254–265 replaces the session and clears undo immediately. After nourishing, choosing
   Start map 1 reset food 8→10, actions 2→3 and cleared nourishment/undo, with no confirmation.
   [Raw check](evidence/ux/chart-replacement.txt). The chart DOES contain a replacement note;
   the problem is destructive action timing and ambiguous current-map behaviour, not absent disclosure.
3. **Semantic forecast gaps:** App.tsx:392 renders after-tide resource values using unlabeled
   icons; compact.css:61 hides the explanatory food arithmetic. Snapshot reads bare numeric pairs.
   FinaleCheck.tsx:16–20 uses check/cross icons and classes, but each row's text is affirmative
   regardless of pass/fail. The following hint DOES explain failures, so this is uneven information,
   not a wholly inaccessible result. No actual screen-reader listening was performed.
4. **Action focus discontinuity:** after clicking Nourish, the newly disabled button lost focus
   to body in Chrome. App.tsx:293 treats body Enter as Advance. Consecutive keyboard activation
   merits a controlled regression test before claiming an accidental-advance defect.
5. **Persistence recovery contract:** storage.ts:73–92 silently starts fresh after invalid data;
   App.tsx:142 then saves it. The previous raw save has no quarantine/recovery path in this code.
   Achievements writes return failure but App.tsx:153 ignores it. These are code-confirmed risks;
   actual corrupt-save loss or lost medals were not reproduced against a user save.
6. **Release evidence gap:** package.json has Vitest and build scripts, no checked-in browser suite.
   `.github/workflows/pages.yml` runs on main push/manual dispatch, not pull_request; it tests/builds
   a Pages base path but has no production-browser acceptance step. Historical manual coverage is valuable.

### Hypotheses requiring human or broader-device evidence

- First-time players may not connect drift-before-shelter, queued growth and one-stress recovery
  early enough; help, forecasts, tide chart and finale hints already explain these rules.
- Small secondary text and low-contrast translucent UI may hinder reading; screenshots are a
  visual concern, not measured contrast results. Phone work and FPS benchmarking stay deferred.
- Keyboard traversal through 13 islands, hidden/visible labels and Build/Tow panels may be lengthy;
  1–9 only covers the first nine islands, but all islands are still available through the list.
- Multiple live regions may compete during tide resolution; only actual assistive-tech testing can
  establish announcement quality. Human play and listening remain required for pacing and enjoyment.

## Prioritized tickets (estimates are relative, not delivery promises)

### UX-01 · P0 · Make saving failure visible and announced · S
- Player problem: compact-view players can continue believing progress will survive reload.
- Scope/files: new `src/ui/SaveStatus.tsx` and local CSS; lead wires App.tsx saveFailed and placement.
- Dependencies: lead assignment of integration hook; Art checks restrained warning treatment.
- Acceptance: failure remains visible in both layouts and dialogs, announces once per failure
  episode, never claims successful saving while false, and clears after an actual successful write.
- Verification: isolated blocked-storage browser scenario, success recovery, keyboard and both sizes.

### UX-02 · P0 · Protect active voyages when using the chart · M
- Player problem: selecting a familiar map card can erase the current voyage and undo history.
- Scope/files: CampaignScreen.tsx presentation; lead App.tsx pending-map request and confirmation.
- Dependencies: lead decides current-map card = Continue versus explicit Restart; World approves copy.
- Acceptance: current in-progress card resumes by default; replacing another active voyage requires
  an explicit target-named confirmation; cancel/Escape preserves state, undo, settings and medals.
- Verification: pointer/keyboard replace/cancel/reload tests; locked maps and completed-result routes.

### UX-03 · P1 · Give forecasts and bell checks explicit text states · M
- Player problem: resource units and pass/fail states require interpreting icons or a second paragraph.
- Scope/files: FinaleCheck.tsx/local CSS; lead App.tsx forecast strip; coordinate World label semantics.
- Dependencies: Gameplay confirms current/post-drift terminology; Art approves symbols and contrast.
- Acceptance: each resource has a textual unit; every checklist row says Met/Not yet or equivalent;
  selected bell describes present versus after-tide shelter/stress without relying on colour.
- Verification: fresh accessibility snapshots, NVDA/Chrome reading, muted/greyscale inspection,
  plus a simulator fixture where current shelter differs from post-drift shelter.

### UX-04 · P1 · Keep keyboard focus safe through actions and transitions · M
- Player problem: disappearing/disabled controls can lose context or make the next key surprising.
- Scope/files: narrow focus helper if useful; lead App.tsx action/transition integration, TideSequence.tsx.
- Dependencies: UX-02 dialog routing; agreed focus destination after consumed actions and Skip.
- Acceptance: focus lands on a useful stable control after Nourish/last action/build/tow/Skip;
  held/repeated Enter cannot commit an unintended extra tide; no background mutation in a modal.
- Verification: real keyboard sequences at both sizes, shortcut guards in seed/sliders, tab/shift-tab,
  repeated advance/skip race checks and all 13 islands reachable without number shortcuts.

### UX-05 · P1 · Validate and tune the first-voyage learning sequence · M
- Player problem: rules may be available but not understood before a recoverable mistake becomes defeat.
- Scope/files: feedback.ts and concise guide/check copy; lead App.tsx placement; no new rules by default.
- Dependencies: Gameplay teaching scenarios, World lesson order, UX-03 semantics, Art signal hierarchy.
- Acceptance: run 3–5 first-time sessions; record cost, delayed growth, drift/shelter and stress answers
  before revealing hints; implement only demonstrated comprehension gaps; preserve forecast truth.
- Verification: observation protocol, exact failed decisions and follow-up retest; automated fixtures
  protect costs/forecast. Small samples support direction, not a claim that the game is now fun.

### UX-06 · P2 · Desktop reading and large-fleet accessibility pass · M
- Player problem: later-fleet labels, secondary text or scaling can obscure the next useful decision.
- Scope/files: compact.css, campaign.css, finale.css; lead styles.css; Art-owned label/colour integration.
- Dependencies: Art typography/state specification; World supplies seven/thirteen-island stress cases.
- Acceptance: 1366×768 and 1920×1080 at normal/125%/150% scaling retain essential controls;
  long labels, expanded panels and final warnings fit; essential text/focus contrast is measured.
- Verification: Chrome and Edge, low graphics/reduced motion, keyboard and screen-reader spot checks;
  explicit exceptions recorded. No phone expansion or FPS target.

### UX-07 · P2 · Preserve and explain exceptional save recovery · M
- Player problem: damaged data or a failed medal write can silently erase evidence of progress.
- Scope/files: lead-owned storage.ts/schema decisions and App.tsx; isolated fixtures and achievements tests.
- Dependencies: UX-01; lead chooses bounded raw-save quarantine and clear recovery messaging contract.
- Acceptance: invalid prior data is not silently overwritten before recovery choice/backup policy;
  valid legacy saves retain geometry/rules/undo; medal persistence failures are surfaced accurately.
- Verification: malformed/oversize/blocked storage fixtures, legacy and current saves, URL seed change,
  campaign unlocks and First Light checkpoint reload. Never test against personal saves.

### UX-08 · P1 gate / P2 completion · Repeatable production-browser release checks · M
- Player problem: a correct simulator can still ship unusable controls or broken asset paths.
- Scope/files: dedicated browser smoke harness and fixtures; lead owns package/lock/workflow changes.
- Dependencies: lead approves runner/dependencies; start with UX-01/02 regressions and expand per slice.
- Acceptance: deterministic local production smoke covers start/continue/action/undo/reload,
  win/loss/final rescue, chart replacement, modal blocking, reduced motion and low graphics;
  Pages base-path assets load; PR validation runs without deploying. Evidence identifies browser/build.
- Verification: both desktop sizes, no failed same-origin assets or unexpected console errors;
  maintain separate manual audio and assistive-tech gates. Do not promote simulation wins to UI passes.

## Implementation-ready first ticket: UX-01

Trigger: open a fresh isolated profile at 1366×768; block Storage.setItem; start or change a voyage.
Today: the save failure is caught, but the only message is a display:none footer span.
Proposed contract: `SaveStatus({ failed: boolean })` renders a persistent, compact warning when failed.
Copy: “Progress isn't saving in this browser. Keep this tab open; reloading may lose changes.”
Use a text label plus icon; it must survive sea focus and remain legible over the scene.
Place it in a stable region in the active interface; when a modal is open, expose the notice
inside that accessible modal surface as well, with only one live announcement per failure episode.
Use polite status semantics; avoid recurring toasts, blocking play, autofocus or repeated announcements.
The initial success state may keep the existing quiet footer; visibility of failure is mandatory.
Lead wiring uses the existing `persistSession` boolean; no save-key, rule or schema migration.
Restoration means a later actual persistence call succeeded; closing the warning is not recovery.
Do not add export/import, cloud sync or storage-clearing actions in this ticket.
Suggested ownership: UX writes new component/local CSS and bounded browser regression evidence;
lead alone edits App.tsx and any shared styling. Assign exclusive test-harness ownership before writes.
Acceptance scenario A: blocked write → one visible warning at each size, in planning and settings;
controls remain usable and screen-reader text explains the risk without requiring colour.
Scenario B: several failed actions → no repeated announcement flood or misleading “saved” message.
Scenario C: restore writes and perform a real action → warning clears; reload restores that action.
Scenario D: working storage from launch → no warning and existing undo/reload behaviour is unchanged.
Run the regression suite, production build and both-size browser checks after integration.
Review artifact: before/after compact screenshot plus failure/recovery logs; ticket closes only after
lead inspects the integrated result. This report does not complete UX-01 or any game improvement.

## Cross-pillar contracts, playtests and lead decisions

- Gameplay supplies factual forecasts and teaching positions; UX must not duplicate simulation rules.
- Art supplies typography, contrast and safe/unsafe grammar; essential meaning must survive mute,
  reduced motion and colour loss. World owns concise map/lesson copy and progression invitation.
- Preserve completed features and compatibility; defer schema changes until separately assigned.
- Ask players: “What will Nourish cost now, and what will the town eat later?”
- Ask before advancing: “Where will this bell land, what shelters it there, and will it grow?”
- Ask: “How many sheltered tides does this stressed bell need?” and “What does Anchor protect against?”
- Ask after reload/chart navigation: “Where would you continue, and which choice starts over?”
- Ask after defeat: “What failed, what would you change, and is retry worth doing?” Record behaviour
  before prompting; do not equate explanation, completion, or an enthusiastic comment with sustained fun.
- Lead decisions: prioritize UX-01/02 safety within the first-voyage slice; confirm current-map card
  semantics; assign shared integration and browser-harness owners; choose assistive-tech/browser matrix;
  arrange human playtest participants and separately commission any storage-recovery policy change.
- Final status: fresh test/build baseline passes; opening browser checks expose actionable UX gaps;
  eight tickets are ready for reconciliation, with UX-01 specified for implementation. Source unchanged.
