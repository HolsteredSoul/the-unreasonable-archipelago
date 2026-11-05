# UX implementation authoring checks — 5 November 2026

Historical authoring record: component and harness checks completed before browser commissioning.
The subsequent browser journeys, exact artifacts, corrections and final status are recorded in
[the pillar handoff](../../ux-engineering.md). Lead owns integration, full suite/build and source freeze.

Commands actually run:

```powershell
node --check scripts/browser-smoke.cjs
node --check scripts/browser/ux-support.cjs
node --check scripts/browser/ux-driver.cjs
node --check scripts/browser/ux-components.test.cjs
node --test scripts/browser/ux-components.test.cjs
node scripts/browser-smoke.cjs --check
node node_modules/typescript/bin/tsc --noEmit --jsx react-jsx --module ESNext --moduleResolution Bundler --target ES2022 --lib 'ES2022,DOM,DOM.Iterable' --strict --skipLibCheck src/ui/SaveStatus.tsx src/ui/FinaleCheck.tsx
git diff --check -- src/ui/FinaleCheck.tsx src/ui/finale.css
```

- Script syntax checks: exit 0 (rechecked after harness updates).
- Component markup checks: 5 tests, 5 passed, 0 failed; final recorded duration 1427.0941 ms.
  An initial assertion expected an empty-string data attribute; React emits `"true"`. Corrected
  that test to match attribute presence/value independently. No component behaviour changed to fit it.
- Scoped TypeScript check: exit 0, no diagnostics.
- Harness preflight: exit 0, eight existing campaign witnesses validated, final rescue
  `{ type: 'nourish', id: 'bell' }` validated; output explicitly says browser NOT run.
- Preflight found cached Playwright at
  `C:/Users/pierr/AppData/Local/npm-cache/_npx/9833c18b2d85bc59/node_modules/playwright`,
  package version `1.64.0-alpha-1790635538000`. No dependency or browser download performed.
- Tracked component diff check: no whitespace errors; Git noted Windows LF→CRLF conversion.

Checks establish markup semantics, type compatibility and fixture/harness readiness. They do not
establish live-region timing, real screen-reader speech, layout polish, interaction success or audio
quality. Those remain subject to the commissioned production-browser run and human review.

The lead reported that broad Vitest discovery found the Node-runner component file; the lead owns
restricting Vitest to source test files. This pillar keeps the Node checks under `test:ui` as directed.

Commands subsequently commissioned after source freeze/build (results in the handoff above):

```powershell
node scripts/browser-smoke.cjs --all-maps
node scripts/browser-smoke.cjs --scaling
node scripts/browser-smoke.cjs --browser=msedge --quick
```

Scaling mode is explicit display-scaling emulation (125%/150%, both desktop pixel targets), not a
claim that OS settings or the browser zoom menu was manipulated. Edge depends on an installed
Edge binary. Each run gets its own headless browser, contexts, random loopback port and evidence folder.
