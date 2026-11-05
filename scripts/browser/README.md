# UX production smoke harness

Owner: UX & Engineering. Completed run scopes, build hashes and limitations are recorded in
[the pillar report](../../docs/pillars/ux-engineering.md); a newly authored run mode is not a pass until executed.
Project Lead performs the integrated build and authorizes the browser run after source settles.
No package, lockfile, workflow or save schema change is required by this harness.

## Focused authoring checks (no browser)

```powershell
node --test scripts/browser/ux-components.test.cjs
node scripts/browser-smoke.cjs --check
```

The five markup checks cover explicit modern/legacy bell condition wording and save-notice
semantics. Server rendering does not run effects: live-region timing is checked by the later
production-browser journey, and real screen-reader listening remains a separate human check.
Preflight loads TypeScript read-only in memory, checks all eight existing campaign witnesses,
and checks that the reachable omitted-tide-3-Nourish position has the GB-01 rescue.
It resolves an already installed/cached Playwright module without installation or network access.

## Commissioned production run

The lead first runs the project's full tests and `npm.cmd run build`. Source must remain unchanged
through the browser run. This harness rejects a dist index older than source, and fingerprints
source and build before/after every scenario. These guards detect changes; they are not a signed
build provenance system. Keep the build and run together in the acceptance procedure.

```powershell
node scripts/browser-smoke.cjs
node scripts/browser-smoke.cjs --all-maps
node scripts/browser-smoke.cjs --browser=msedge --quick
node scripts/browser-smoke.cjs --scaling
node scripts/browser-smoke.cjs --dense
```

Default: both 1366×768 and 1920×1080; First Light win, map-2 active-voyage replacement cancellation,
saving failures/recovery, and First Light loss/reload/checkpoint/Nourish rescue victory.
`--all-maps` additionally completes maps 2–8 through the real controls at each viewport.
The commissioned main acceptance run should use `--all-maps`. `--quick` is a bounded controls,
one-tide and blocked-saving pass suitable for a separate Edge compatibility smoke.
`--scaling` runs controls/settings/one tide at both physical desktop targets with 125% and 150%
display-scaling emulation: CSS viewport = physical size / scale, deviceScaleFactor = scale.
It records both dimensions and scale. This tests layout under display scaling; it is not a claim
that actual Windows scaling or the browser's zoom menu was operated. Actual assistive-tech/browser
zoom behaviour still requires a human desktop check. Bounded modes cannot be combined with --all-maps.
For another supported Chromium browser use `--browser=msedge` or `--browser=chromium`.
Default is installed Chrome; no browser binary is downloaded.

`--dense` is a separate 1366×768 evidence journey: it earns all eight campaign victories through
the actual controls and requires a map-8 fully grown thirteen-island capture. It uses no imported
save, arbitrary progress write or unlock shortcut. Use it after a presentation-only rebuild when
fresh dense-layout evidence is needed without duplicating the full two-size acceptance matrix.

To pick a pre-existing module:

```powershell
node scripts/browser-smoke.cjs --check --playwright=C:/path/to/node_modules/playwright
```

`PLAYWRIGHT_MODULE_PATH` is an equivalent override. Without it, the resolver tries local Playwright
then existing npm caches. The kickoff machine has Playwright 1.64.0-alpha available in its npm cache.
If Windows blocks Chrome's crash service in the sandbox, run this single harness with the normal
tool approval mechanism. Do not attach to the user's running browser to avoid that limitation.

## Isolation and evidence

- Launches its own headless browser; no CLI daemon, shared named session, CDP attachment,
  persistent browser profile, storageState import or pre-seeded localStorage.
- Creates a new context per viewport/scenario. A built-in read-only HTTP server binds loopback
  port 0, receives an unused OS-selected port, and honours the base path compiled into dist.
- Every player command is executed through a real button/keyboard event. Existing simulator
  witnesses supply expected command sequences; the simulator is never invoked inside the app.
- Saved state is read only for assertions. A temporary Storage.setItem override is used solely
  to simulate blocked writes and is restored; it never creates or edits a saved-state payload.
- Checks actual viewport, origin and exact expected game state around actions. Unexpected state
  changes fail immediately instead of being accepted as progress. Full session is compared on reload.
- Writes only a uniquely named `output/playwright/programme-<timestamp>-<id>/` directory.
  Contains summary.json, per-scenario steps, screenshots, accessibility snapshots and failure evidence.
  Each capture also records visible feedback/control rectangles in `.layout.json`. Visible
  `.resource-callout` and `.toast` must not intersect `.action-dock`, `.forecast-resources`,
  `.bell-outlook`, `.advance-button` or `.island-label.is-selected` by more than 0.5 CSS px in both dimensions. Feedback is
  never dismissed/hidden before measurement. Queued-growth and final-Nourish captures require
  a visible resource callout; unsafe-final-planning requires a visible settled-tide toast.
  The lead added the selected-label assertion for the final placement fix; earlier evidence only
  checked the HUD rectangles and must not be treated as selected-label clearance coverage.
- Closes every context, its browser and its server. Blocks unexpected external HTTP requests.
- Normal voyage watches the first tide naturally and uses Skip for later tides. Rescue uses
  reduced motion and low graphics selected through the product controls; no FPS measurements.
- Bounded controls operate mute, music volume, reduced motion and low graphics through the UI,
  then reload to check persistence. No audio quality or subjective listening claim follows.
- Art captures include unspent breakwater/build preview, selected sheltered/exposed storm
  forecasts and queued growth for every map, naturally reached map-opening palettes,
  and the grown-three-stage thirteen-island fleets on maps 7/8.
  Both required base sizes are captured. Missing files from a failed run are not a passed coverage claim.

The earlier CLI audit's unexplained about:blank/viewport/state changes have no proven cause.
Fresh headless contexts, a private random port, no daemon and exact-state guards prevent shared
profile/control interference and turn any recurrence into a failed, inspectable run.

## Lead integration contracts exercised

SaveStatus: mount exactly one persistent `announce` instance outside the inert HUD; pass
`visible={false}` when a modal is showing an inline non-announcing copy. Every Modal renders
`<SaveStatus failed={failed} variant="inline" announce={false} />` inside its accessible surface.
Combine session and medal-write failures truthfully in `failed`; clear only when actual writes succeed.
The harness expects one visible notice, one `[data-save-announcement]`, and one text insertion per
false→true failure episode. Opening/closing dialogs while failed must not replay the announcement.

Keyboard: keep `aria-label="Nourish island"`; describe suggested rescue separately. A consumed
Nourish action focuses the stable `Island actions` region (focusable with tabIndex=-1).
Plain/repeated Enter must not advance from that region. Ctrl+Enter advances once even while held.
Typing P or Enter in the seed field must not invoke game shortcuts.

Campaign: `.campaign-map.current` resumes the current in-progress voyage. Clicking another map
opens a dialog whose accessible name contains replace/new voyage/restart and whose copy names
the target. Escape cancels to the campaign chart with focus inside it and preserves the exact save.
The splash/continue primary action remains within `.campaign-intro` so it is distinct from map cards.

Rescue: the existing `rescue?: Command` contract stays unchanged. FinaleCheck now says
“Show this action”. Viewing a Nourish suggestion spends nothing and focuses the real Nourish button.
Execute, Undo, Reload, explicit loss, Replan and final win all use existing product controls.

The harness tests DOM/state behaviour, not human comprehension, listening quality or assistive-tech
speech output. Screenshot generation alone is not visual acceptance; the lead must inspect captures.
