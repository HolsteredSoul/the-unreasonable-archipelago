# The Unreasonable Archipelago — improvement programme

Date: 5 November 2026. Owner: Project Lead.

Implementation authorized: the user instructed “Proceed to completion.” The four
pillar sessions delivered their assigned modules; the lead integrated and verified
the combined local release candidate. Historical kickoff restrictions below apply
to Milestone 0, not to the subsequently assigned implementation waves.

Current delivery: the local release candidate is complete. The integrated suite passes **207
tests across 22 files**, the separate accessible-component runner passes **5 checks**,
and TypeScript plus the Pages-base production build pass. All eight campaign maps
passed real-browser play at both desktop sizes; final fixes passed scoped Chrome,
Edge, scaling and dense-fleet verification. [Verification](verification.md) identifies
each build and evidence set. The closing record below supersedes the kickoff queue;
human acceptance remains a separate, explicitly uncompleted gate.
Following local acceptance, the user authorized commit, push and GitHub Pages
publication on 5 November 2026. The existing `main` workflow owns remote checks and
deployment; the historical local-delivery records below predate that authorization.

Companion: [player evaluation protocol](playtest-plan.md), with observation prompts
and decision criteria for learning, strategic variety, presentation and listening.

## Direction

Make a beautiful, readable miniature world in which rescuing a floating town creates
interesting choices, the eight-map journey develops those choices, and defeat teaches
the player how to try again. Preserve the botanical bells, unreasonable sea, restrained
humour, and short, deliberate tide-based play.

The four pillars below are this project's operating structure, not a claim that all
games use one universal four-pillar framework. Each has a dedicated project chat and
reports to Project Lead. This chat owns priorities, scope, integration, and acceptance.

`docs/todo.md` remains the authoritative priority roadmap. This document expands the
next evaluation into a coordinated programme. Completed roadmap features remain
completed; improvements must start from the current game rather than rebuild them.

## Starting point and evidence

- React/TypeScript/Three.js desktop browser game; eight authored maps, procedural
  free voyages, deterministic tides, three building types, five actions, and medals.
- One bell/seven islands grows to four bells/thirteen islands. Existing tools include
  forecast, same-tide undo, whale towing, final warnings, and First Light replanning.
- Compact sea focus, visible weather, tide sequences, animated assets, and adaptive
  piano are already implemented. They are the foundation for polish.
- Latest recorded verification at kickoff: 133 tests across 18 files, production
  build, eight campaign victories, and desktop browser evidence dated September 2026.
  These are historical results until the engineering session reruns checks.
- The clean kickoff checkout is `f14e9a2`. Existing screenshots are historical
  captures, not observations of a new build.
- Open questions in the roadmap: comprehension of shelter and stress recovery;
  repetitive anchoring versus meaningful later-map choices; retry behaviour; audio
  fatigue; and broader desktop/accessibility coverage. Solvability does not prove fun.

## Four accountable pillars

| Pillar / dedicated chat | Player outcome | Responsibilities | First report |
| --- | --- | --- | --- |
| 1. Gameplay & Balance | Every tide offers an understandable choice with a useful consequence. | Core loop, action economy, growth/stress, shelter, alternative strategies, failure/recovery, difficulty evidence. | [Gameplay report](pillars/gameplay-balance.md) |
| 2. Art & Audio | A distinctive, inviting archipelago whose beauty helps the player read the puzzle. | Art direction, sea/island/structure silhouettes, lighting/colour, movement and weather, sound feedback and music mix, asset provenance. | [Art report](pillars/art-audio.md) |
| 3. World & Progression | Each map advances a memorable journey and gives a reason to continue or replay. | Map identity, lesson sequence, narrative voice, campaign pacing, optional goals, medal motivation and free-voyage variety. | [World report](pillars/world-progression.md) |
| 4. UX & Engineering | Players can learn, act, recover, and resume reliably with their chosen controls. | Onboarding, information hierarchy, keyboard/accessibility, responsive desktop layouts, saves/undo, correctness and release verification. | [UX report](pillars/ux-engineering.md) |

Gameplay owns rules and balance recommendations; World owns authored content and
progression recommendations. Art owns visual/audio treatment; UX owns interaction
behaviour and accessible alternatives. Where these meet, Project Lead decides the
shared contract before implementation. Engineering quality is required in every pillar.

## Programme and gates

### Milestone 0 — Evidence and a costed backlog (complete)

All four sessions inspect the current implementation, distinguish observed problems
from hypotheses, and deliver their reports in parallel. Each report supplies 5–8
ranked tickets with a player problem, concrete change, file scope, dependencies,
relative size (S/M/L), acceptance criteria, and verification method. Each also supplies
one implementation-ready first ticket and explicit exclusions.

UX & Engineering owns the fresh automated baseline and any live browser audit in
this wave. Other sessions use code, existing tests and historical captures, avoiding
concurrent control of a shared browser. Human fun, first-time comprehension and
subjective listening results must never be invented.

Exit: four reports received and reviewed; overlaps resolved; baseline failures and
evidence gaps identified; one ordered backlog accepted by Project Lead. This kickoff
is planning and commissioning, not permission to rewrite the game in four directions.

### Milestone 1 — A clear, rewarding first voyage

Prioritize the existing roadmap's learning problems: distinguish immediate action
costs from end-of-tide rations, make post-drift shelter and stress recovery predictable,
and make a failed voyage explain a recoverable mistake. Validate what is already
working before adding UI. Make selected islands, actions, safe/unsafe states and
direction readable on the water with restrained effects and accessible alternatives.

Deliver one integrated First Light experience across all four pillars: teaching goals,
minimum contextual guidance, visual/audio feedback, concise world flavour, and safe
retry. Preserve the real checkpoint and simulator-backed forecasts.

Exit: a fresh profile can reach a win and an understandable loss using real controls;
keyboard and pointer flows work at 1366×768 and 1920×1080; save/reload/undo and final
replanning work. A proposed first human study uses 3–5 new players: observe whether
they can explain costs, delayed growth, shelter after drift, and stress recovery before
the finale. Treat small-sample observations as directional, not statistical proof.

### Milestone 2 — Richer choices across the existing campaign

Audit maps 2–8 before altering difficulty. Give each map a clear lesson and character;
identify anchor-heavy solved routines, underused options, resource pressure and empty
tides. Prototype bounded changes with the existing mechanics before adding new ones.
Compare holding position, riding currents, and building bridges/windbreaks. Pair each
mechanical difference with scenery, short flavour and musical emphasis where useful.

Exit: all eight maps retain deterministic winning routes; changed challenge maps have
at least two materially different feasible approaches, or an explicit documented
reason they are focused teaching puzzles. Real playtests evaluate whether players
notice and enjoy the choices. No mandatory busywork is added solely to fill a tide.

### Milestone 3 — Cohesive presentation and replay value

Apply the accepted art/audio language across calm, forecast, storm, growth, whale,
victory and defeat. Give maps a recognizable identity without obscuring the board.
Improve the invitation to continue or replay using existing medals, map progression
and procedural voyages. Expand objectives or encounters only when earlier evidence
shows a specific gap and the simulation/save cost is justified.

Exit: seven- and thirteen-island scenes remain readable in both desktop sizes, mute
and reduced motion retain all essential information, asset sources are documented,
and a complete campaign listening pass records transitions and fatigue observations.

### Milestone 4 — Reliable release candidate

Run full simulation and persistence regressions plus production-browser journeys:
start/continue, win/loss, next map, replay, undo, reload, final rescue, free voyage,
settings, keyboard-only operation, low graphics, reduced motion and audio controls.
Check supported desktop browsers and display scaling. Resolve blocking defects;
record lower-priority limitations and update `docs/verification.md`.

Exit: no known progress-loss or release-blocking interaction defect; automated suite
and production build pass; affected real-browser scenarios pass at both required
sizes. Publishing is a separate action within whatever authorization is current then.

## Programme delivery sequence

| Order | Work package | Accountable pillar | Depends on | Acceptance evidence |
| --- | --- | --- | --- | --- |
| 0 | Reproduce baseline and inventory known risks | UX & Engineering | None | Fresh test/build results; evidence gaps recorded |
| 1 | Learning and recovery audit for the first voyage | Gameplay & Balance + UX & Engineering | 0 | Specific failure/teaching points tied to actual rules and controls |
| 2 | Readability and sensory design specification | Art & Audio + UX & Engineering | 0, 1 | State hierarchy, accessible signals, inspected existing or new captures |
| 3 | First Light integrated improvement slice | Project Lead, all pillars | 1, 2 | Verified first-voyage acceptance gate |
| 4 | Eight-map lesson and strategy matrix | World & Progression + Gameplay & Balance | 0 | Per-map lesson, pressure, alternative strategies and identity |
| 5 | Later-map variety and campaign continuity | World & Progression | 3, 4 | Solvability, distinct choices, playtest observations |
| 6 | World/audio polish and replay invitation | Art & Audio + World & Progression | 2, 5 | Readable fleet, coherent states, useful replay motivation |
| 7 | Desktop/accessibility and release hardening | UX & Engineering | Each affected slice; final pass after 6 | Automated and real-browser verification |

Pure planning and independent asset/design investigation can overlap. Integration
work follows dependencies; a pillar's local completion is not a release acceptance.
The evidence-based first queue below refines this sequence with concrete tickets.

## Working agreement and file ownership

During Milestone 0, each session may write only its assigned report and unique evidence
under `docs/pillars/evidence/<pillar>/`. Source code is read-only. Existing user work
must be preserved. No shared-file edits, commits, pushes, deployment, dependencies,
new worktrees, paid services, or unrelated asset generation are needed for this wave.

Project Lead alone owns `docs/todo.md`, this plan, `src/App.tsx`, `src/styles.css`,
persistence schemas, and cross-cutting game-state integration. No other session may
claim those shared surfaces. For subsequent implementation, each assignment specifies
exclusive files and a concrete acceptance test; ownership transfers are recorded here.

Expected future areas, subject to an explicit assignment before writes:

- Gameplay: isolated rule helpers, balance experiments and simulation tests.
- Art: renderer/asset/audio modules and their local styles/tests.
- World: content data, map text, campaign design and progression presentation.
- UX & Engineering: isolated interface components, accessibility and browser checks.

`src/game/campaign.ts`, `src/game/index.ts`, `src/game/types.ts`, `src/world/World.tsx`
and shared UI components require a named single writer for each implementation wave.
Tests/builds can read shared code; avoid concurrent builds writing the same output.

## Reporting to Project Lead

Lead chat: `01a1aba9-5fd0-7112-8d20-d71f96a120de`, host `local`.

The user explicitly requested four project sessions reporting to this lead. Reports
are persisted in the assigned files and summarized in each session's final response;
the lead reads those reports and uses bounded thread-status waits to collect them.
No external messaging or automated recurring task is part of this setup.

Every report or implementation handoff includes:

1. Status and player-facing result.
2. Evidence, exact changed files, and checks actually run.
3. Ranked next actions with acceptance criteria and dependencies.
4. Risks, assumptions, unresolved questions and decisions needed from the lead.

Project Lead reviews every wave, reconciles conflicts, verifies combined work and
updates the priority roadmap. Subsequent work begins from a concrete assignment;
agents do not edit each other's files or start open-ended autonomous follow-up loops.

## Guardrails and open decisions

- Keep the desktop browser scope. Phone/mobile expansion and FPS benchmarking remain
  deferred as already requested; ordinary regression checks still apply.
- Preserve existing save/undo/campaign/medal behaviour. Any later schema or rules
  migration needs a compatibility design and lead integration.
- Avoid adding currencies, grind, multiplayer, live services or a larger campaign as
  default solutions to depth. New mechanics must solve an observed player problem.
- Keep humour concise and optional. Story and effects must not block planning.
- Human difficulty and listening evaluation require actual participants/listeners;
  until then, label conclusions as hypotheses and keep balance changes provisional.
- Scope is evidence-led; relative ticket sizes are planning estimates, not promised
  delivery dates. Each milestone ends at its acceptance gate, not at a feature count.

## Session register and lead decisions

### Accepted direction and first queue

The lead accepts the warm, matte botanical sea and restrained piano as the visual and
audio foundation. Preserve the existing assets; prioritize comprehension over extra
effects. The story connects fresh towns through recurring voices and small moments
of hospitality. It must never imply that resources or buildings carry between maps.
WP-01's proposed First Light copy is accepted for a rendered trial, with shortening
allowed if it competes with essential instructions.

The following is the planned implementation queue, not a claim of shipped fixes:

| Priority | Work and ticket | Owner / exclusive write boundary | Done when |
| --- | --- | --- | --- |
| P0 / first | UX-01: make saving failures visible and announced in compact and full views | UX creates an isolated status component/style; lead integrates App/shared layout | A blocked save produces a visible, accessible warning at both desktop sizes and within modal surfaces; normal play still works; recovery updates the status truthfully |
| P0 / first | UX-02: protect an active voyage when choosing a map/free voyage | UX specifies/tests the interaction; lead owns App and CampaignScreen integration | Current in-progress map resumes; another target requires deliberate confirmation; cancel retains the exact state/undo/checkpoint; victories and medals survive; focus returns correctly |
| P0 / first | GB-01: include a winning Nourish action in final rescue advice | Gameplay: `src/game/finaleAdvice.ts` and its test; lead: action focus/highlight wiring | A reachable growth-2 First Light case offers the simulator-verified action; viewing spends nothing; execute/undo/reload/win work; non-winning suggestions are rejected |
| P0 / first | AA-01: show what shelters the selected bell after drift | Art: `src/world/WeatherVisual.ts` and its test | Actual contributing shelter rays get focus; exposed bells get none; all safe cells, build previews, reduced motion and picking remain correct |
| P1 / same slice | WP-01: First Light shore note and truthful next-map invitation | World: new `src/content/campaignCopy.ts`; lead: CampaignScreen/App integration | Short optional text works in existing surfaces; map-2 title/lesson is accurate; loss, free-voyage and legacy fallbacks are unchanged |
| P1 / before richer medal UI | LEAD-01: isolate campaign and free-voyage medal records | Lead owns `src/ui/achievements.ts`, schema/read compatibility and callers; UX supplies regressions | Free seed `campaign-map-3` cannot change map 3's new record; existing data is retained; ambiguous legacy attribution is explicit rather than silently invented |
| P1 / next evidence wave | GB-02/03 + WP-02: observe learning and compare strategy/medal routes | Gameplay: bounded trace harness/tests; World: lesson matrix; lead: human-study coordination | Reproducible alternative routes and real participant observations support any proposed balance change; advertised top-medal targets have legal winning traces |
| P1–P2 / later | AA-02/03/04/07 and WP-03/04/06: readable signals, purposeful growth, mix controls, provenance, map continuity and replay | Lead commissions separate renderer/audio/content/UI ownership windows | Each change meets its pillar criteria, preserves compatibility and passes integrated desktop checks; optional-objective/whale expansion stays evidence-gated |

GB-01, AA-01 and the content-only part of WP-01 can be developed independently once
the implementation wave starts. UX and the lead integrate shared UI changes serially.
The lead accepts each isolated diff, then verifies the combined First Light slice.
Source-writing assignments are dispatched separately after this planning kickoff;
the existing report-only assignments do not silently expand their ownership.

### Decisions resolved and evidence still required

- Keep numerical balance unchanged initially. All eight audited reference routes win;
  11 individual anchor omissions also retain victory. Those probes do not establish
  combined omissions, dominant strategy, or enjoyment.
- Prioritize the observed progress/recovery defects before new content breadth.
  The current in-progress map card means Continue. Starting it afresh is an explicit
  Restart action with confirmation; replacing it with another voyage names the target.
- A medal namespace migration must preserve original legacy data. Legacy keys alone
  cannot determine whether a colliding record originated in campaign or free play;
  retain that uncertainty instead of assigning credit to both or deleting it.
- Accept the eight-map lesson/identity matrix as a content direction. Optional replay
  hooks remain candidates until legal routes and human interest are demonstrated.
- Asset inventory may document current provenance and licences; it must not invent
  a new licence or claim rights beyond the available records. No asset purchase is needed.
- The [playtest protocol](playtest-plan.md) is ready; participant recruitment and
  subjective listening remain pending. No human validation is claimed by the audits.

### Fresh baseline and review outcome

- All four reports were read and reconciled: 29 pillar tickets plus lead-owned
  LEAD-01. The reports include dependencies, relative effort, acceptance criteria,
  bounded first-ticket specifications and evidence limits.
- `npm.cmd test -- --maxWorkers=1`: **133 tests across 18 files passed**.
  `npm.cmd run build`: **TypeScript and production build passed**. The existing
  >500 kB chunk advisory remains; no performance benchmark was commissioned.
- The isolated local production-browser audit inspected opening screens at
  **1366×768 and 1920×1080**, and checked nourishment, reload/undo and modal focus.
  It reproduced hidden saving failure and immediate map replacement. Later unexpected
  browser-state/viewport changes make the final advance segment inconclusive; it is
  excluded from controlled evidence. This was not a full campaign release playthrough.
- Gameplay/World replayed all eight authored routes through the real simulator and
  verified forecast agreement. Gameplay reproduced the omitted Nourish rescue;
  World reproduced the medal-key collision. These establish concrete planning inputs.
- Lead visually reviewed fresh First Light captures at both desktop sizes and the
  historical thirteen-island weather capture. Art's broader review and audio evidence
  are explicitly historical/code-based, not a fresh listening judgement.
- Evidence and raw logs live with the [UX report](pillars/ux-engineering.md),
  [gameplay report](pillars/gameplay-balance.md), and
  [world report](pillars/world-progression.md). Runtime source was not changed by kickoff.
- Next delivery is the P0 first-voyage slice above. Human learning, alternative-route
  enjoyment, assistive-tech reading, extended listening and final release acceptance
  remain pending. No deployment or Git publishing was performed.

### Dedicated chats

All four dedicated chats were created in the Procedural project on host `local`.
Their initial assignment is the bounded Milestone 0 report described above.

| Chat | Thread ID | Kickoff status |
| --- | --- | --- |
| Gameplay & Balance | `01a1abb0-2bb6-77d0-bf42-c19714460351` | Report reviewed; GB-01 first |
| Art & Audio | `01a1abb0-465a-72e1-8f4f-fb76103dc680` | Report reviewed; AA-01 first |
| World & Progression | `01a1abb0-64b9-7723-81cc-374a8ea6afa4` | Report reviewed; WP-01 first |
| UX & Engineering | `01a1abb0-9421-7053-bce1-6f39409072a2` | Report reviewed; UX-01/02 first |

Each remains the dedicated session for its pillar. The lead subsequently commissioned
and integrated the implementation waves described below.

## Delivery decisions — 5 November 2026

### Integrated implementation

- **Gameplay:** final rescue advice now considers Nourish, using a legal command and
  whole-voyage simulation before recommending it. Viewing a suggestion spends nothing.
  Campaign fixtures provide reference, six-growth medal and materially different
  late-current routes for every map. Rules, authored openings and old-rule dispatch
  are unchanged; the existing compatibility suite remains the release gate.
- **Art/audio:** selected forecast bells identify their actual post-drift shelter
  sources; selection, destination, exposure, recovery and growth use different marks.
  Queued growth and building development are visible. Four restrained daylight
  treatments distinguish campaign pairs. Effects use a retained volume bus, a 60 ms
  mute fade, cancellation of future/pending notes, priority, and bounded voices.
  Provenance covers existing models, procedural visuals, music, effects and dependencies.
- **World/progression:** all eight maps have concise shore notes, victory codas and
  accurate next-shore invitations. The chart shows attributable best medals and an
  optional growth target. Free voyages clearly describe the smaller one-bell scope.
  Campaign and literal free-seed medals have separate keys; ambiguous old records
  remain preserved and explicitly unattributed.
- **UX/engineering:** saving failure is visible in both layouts and dialogs, with one
  persistent announcer. Current-map cards continue play; replacement names the new
  voyage and requires confirmation. Damaged save data is retained before replacement.
  Bell checks say Met/Not met and forecasts name resource units. Focus survives spent
  actions and tide transitions; Ctrl+Enter advances, and repeated Enter is guarded.
  Production-browser checks are reproducible; PR checks build/test without deployment.

### Scope decisions for the remaining evidence gates

The programme's ticket count is not a commitment to implement every hypothesis.
The following decisions retain the acceptance conditions in the pillar briefs:

| Tickets | Delivery decision |
| --- | --- |
| GB-01 | Implemented rescue advice and action focus/highlight; real browser defeat/reload/replan/Nourish/undo/win checks pass at both sizes. |
| GB-02, UX-05 | First-time learning study remains open. The protocol is ready; no participants or statements are invented. Concrete code-confirmed recovery and wording defects are fixed. |
| GB-03, WP-02 | Reproducible three-route comparison and legal top-medal traces cover all eight maps. Human recognition/enjoyment of the choices remains open. |
| GB-04 | No simulation/version migration is introduced. Existing legacy/current, undo, checkpoint, campaign and generated-voyage regressions pass; future balance changes still require explicit compatibility fixtures. |
| GB-05 | Retain numerical balance and geography. Alternative winning routes exist; no human evidence currently justifies making later maps harder or adding mandatory actions. |
| GB-06, WP-04 | Existing optional shore-growth medals are now discoverable, and every map has a verified top-medal route. Human replay motivation remains open. |
| GB-07 | Completed a fixed 32-seed audit covering all four families, six rotations and distances 2–4, plus executable whale/support comparisons. Retain existing generation; variety/enjoyment remain human questions. |
| AA-01, AA-02, AA-03 | Implemented and image-reviewed truthful shelter focus, differentiated signals, queued growth and purposeful building detail. Final feedback/label overlap fixes pass scaled and dense-frame checks. |
| AA-04 | Effects lifecycle/priority implemented and tested. Real-device mix, clipping and fatigue listening remain open. |
| AA-05 | Retain the existing animated whale and explicit action/card explanation. A replacement asset is conditional on observed readability failure, not an automatic deliverable. |
| AA-06, WP-01, WP-03 | Four daylight treatments and all eight map identities/handoffs implemented; all-map browser coverage and scoped image review complete. Human recall remains open. |
| AA-07 | Asset/authorship ledger completed from repository and installed-package evidence; no new ownership or licence claim is invented. |
| WP-05 | Do not add another optional objective yet. Existing medals now have verified routes and clearer invitations; a new objective requires evidence of a remaining replay problem. |
| WP-06 | Smaller free-voyage scope and complete opening-building counts implemented. |
| WP-07 | Editorial, deterministic progression and full browser campaign handoffs complete. Human progression study remains open. |
| UX-01, UX-02, UX-03, UX-04, UX-07, LEAD-01 | Integrated save protection, safe replacement, explicit states, focus, recovery and medal compatibility. Automated and scoped production interaction checks pass. |
| UX-06, UX-08 | Desktop Chrome/Edge, scaling emulation, scoped contrast and repeatable production journeys pass. Actual assistive-technology speech and physical display settings remain unverified. |

### Integration acceptance

The lead inspected the delegated diffs and fresh screenshots, repaired the shared
progression/persistence/interaction surfaces, and verified the combined build. Browser
image review caught notification/control overlap and a selected-label collision at
150% emulation; both were fixed and rechecked with actual rectangle assertions.
The final dense replay earned all eight victories through real controls, preserving
the four-bell/thirteen-island scene and its readable labels. All scoped blocking
defects found in this programme are resolved. No source/asset changes are pending
from the pillar sessions. Human study gates below remain open; no publication occurred.

### Remaining human evaluation

Use [the playtest plan](playtest-plan.md) for 3–5 first-time sessions plus targeted
later-map/replay and listening sessions. Record actions and direct observations before
changing teaching or difficulty. Human comprehension, perceived variety, enjoyment,
musical fatigue and actual assistive-technology speech are still unverified.
Phone expansion, FPS benchmarking, new hazards and a larger campaign remain outside
this delivery. Publishing is not part of the local implementation acceptance.
