# Fresh UX browser evidence — 5 November 2026

Scope: local production preview only, `http://127.0.0.1:4178/`, isolated automation
session `ux-kickoff-20261105`. Windows installed Chrome reports product version
156.0.8078.80. Cached Playwright CLI 0.1.22. No dependency installation or source edits.
Read the parent [pillar report](../../ux-engineering.md) for findings and limitations.

## Evidence files

- `splash-1366.png`: fresh start at 1366×768; inspected visually.
- `first-light-1366.png`: fresh campaign opening in automatic compact layout; inspected visually.
- `first-light-1920.png`: opening at 1920×1080, automatic full layout; inspected visually.
- `chart-active.png`: later chart with an active nourished voyage. This capture is NOT the
  required 1920×1080 comparison: the viewport had unexpectedly changed during the audit.
- `chart-replacement.txt`: after choosing current map card, no dialog; food 10, actions 3,
  nourishment false, undo empty. Before selection the chart snapshot showed 8 food, 2 actions,
  and the bell's queued growth. The replacement note was present at the bottom of the chart.
- `save-failure-compact.txt`: localStorage write fault injection at confirmed 1366×768;
  failure message text existed but display:none, zero rect and no status/alert region.
- `first-tide-result.txt`: retained late-run observation, **excluded from controlled pass claims**.
  State reached tide 3 with a changed selection and bell growth 0; this did not match the
  intended isolated final advance check. Cause not established.
- `.playwright-cli/page-*.yml`: generated snapshots, including interim states. These are raw
  automation observations, not proof that every listed DOM element is reachable by screen reader.
- `tests.txt`: initial npm.ps1 invocation swallowed --maxWorkers and emitted a warning; passed.
- `tests-single-worker.txt`: corrected npm.cmd invocation ran Vitest with --maxWorkers=1; passed.
- `build.txt`: production build passed with large-chunk advisory.

## Controlled opening observations

1. Begin the campaign received initial focus; Enter entered First Light.
2. Compact mode was automatic at 1366×768. Food/timber/actions, dock, selected bell and Advance
   were visible; document width/height equalled viewport dimensions in the measured opening.
3. P toggled forecast. Nourish spent 2 food and one action, queuing the bell's growth.
4. Reload showed Continue map 1 · tide 1 with 8 food/2 actions; Continue then Ctrl+Z restored
   10 food/3 actions, nourishment false and empty undo. No simulator injection was used.
5. Resizing to 1920×1080 selected the full layout; screenshot inspected for visible controls.
6. After-tide bell checks opened with focus on Close. Shift+Tab wrapped to Keep planning;
   Escape returned focus to After-tide bell checks.
7. Settings→Restart placed focus on the new dialog Close control. Escape returned through
   Settings and another Escape returned to play.
8. The checklist snapshot contains affirmative condition labels with no per-row pass/fail
   text. Its following paragraph explicitly states missing growth/connection; retain that nuance.
9. Pointer Nourish disabled its button and document.activeElement became body. No controlled
   consecutive-key experiment established accidental advancement; this is a follow-up risk.
10. The map-card replacement check and blocked-storage check confirmed the source findings.

## Fault injection and cleanup

Only the isolated page's Storage.prototype.setItem was temporarily replaced with a function
throwing QuotaExceededError. A mute toggle triggered the existing persistence effect.
The original method was restored immediately after the visibility check (tool returned true).
No personal storage was inspected, imported, cleared or modified. No existing browser was attached.
The named automation browser was closed; the local preview process started for this audit was stopped.

## Limitations and environment incidents

- npx package lookup failed with ENOTFOUND; a pre-existing cached CLI was used directly.
- Chrome crashpad could not launch inside the sandbox. Approved outside-sandbox local browser
  and preview processes were used; no external live site was visited.
- Later the automation tab unexpectedly became about:blank; navigation back retained the
  temporary save. The viewport subsequently differed from its earlier explicit resize.
  Those incidents and the unexpected final tide/selection are unassigned causes, not game defects.
- Final current-page console read: zero warnings/errors. This cannot certify earlier contexts.
- No actual screen-reader listening, contrast measurement, full keyboard-only voyage, animation
  skip/race assertion, eight-map run, final rescue, reduced-motion/low-graphics journey or audio
  quality evaluation was completed in this kickoff. September verification remains historical.
- No FPS benchmark. No mobile expansion. No human enjoyment or learning result claimed.
