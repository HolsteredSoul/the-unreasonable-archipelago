# Gameplay & Balance — audit and implementation handoff

Date: 5 November 2026. Status: GB-01/03 delivered and GB-06/07 automated evidence closed; final browser acceptance remains with Project Lead.
Owner: Gameplay & Balance. Integration and shared-file decisions: Project Lead.
Scope: desktop campaign and free voyages; mobile expansion and FPS benchmarking remain deferred.
Direction: make each choice understandable and consequential while retaining a forgiving first voyage, useful recovery, and different ways to arrange a harbour.
Do not fill quiet tides with compulsory actions or raise costs simply because a reference route has spare resources.

## Milestone 0 evidence and limits (kickoff record)

- Read `AGENTS.md`, `docs/todo.md`, `docs/improvement-plan.md`, `README.md`, the assigned simulation modules, relevant tests, finale UI/recovery, storage validation, and medals.
- Source baseline inspected: `f14e9a2`; programme documentation was already modified/untracked by the lead. Those changes were preserved.
- Fresh evidence: [probe](evidence/gameplay/route-audit.cjs) and [full results](evidence/gameplay/route-audit.json), run successfully with Node v24.13.1.
- The probe loads existing TypeScript in memory and uses production `applyCommand`, `resolveTide`, and `forecastTide`; no alternative simulator or save writes.
- It replays all eight authored witnesses twice, checks determinism, input immutability, exact forecast agreement, bounds, and collision freedom along those runs.
- It evaluates all 130 individual command omissions, eight omissions of tides 7–8, one exact whale substitution, an existing First Light alternate route, and a reachable Nourish rescue case.
- JSON includes source hashes and per-tide commands, action slack, resources, production, bell positions/growth/stress, shelter, and connection.
- This is a narrow simulation audit, not the shared test/build baseline. No full suite, production build, browser control, new screenshots, or human playtests were performed here.
- `docs/verification.md:5–32` records 133 tests and campaign browser evidence from 20 September 2026: **historical**, not rerun evidence from this session.
- No inference about enjoyment, perceived difficulty, listening, discoverability, or optimal strategy is justified by these traces alone.

## Current systems: what is already working

- `src/game/types.ts:5–15` stores the entire board, current rotation, whale use, campaign number, and optional `moonwake` rules in version-1 states.
- `src/game/index.ts:12–14,190–247`: every command costs one action. Tow costs 1 food; Nourish costs 2 food; Build costs 3 timber; Anchor costs 1 timber for the current tide only.
- Campaign budgets are 3/4/5/6 actions per tide for map pairs; bells are 1/2/3/4. All maps last eight tides (`campaign.ts:7–15`, `index.ts:13`).
- Each additional bell requires three successful nourishment cycles and 6 food; each pair adds eight total action slots and 2 starting food. The town still consumes exactly 2 food per tide, independent of bell count.
- Gardens produce `1 + growth + 1 if at most two neighbours`; groves produce `1 + growth + 1 if at least three neighbours`. Production stops at stress 3 (`index.ts:141–154`).
- Consequently open gardens, clustered groves, bridge chains, and storm shelter can compete spatially. This is meaningful existing design space, not a missing mechanic.
- Construction replaces an existing building at full cost, without a refund. A new breakwater can sacrifice productive land; preview already shows this tradeoff (`index.ts:218–225`, `App.tsx:381`).
- Ordinary islands shelter the adjacent downstream hex; breakwaters shelter themselves and a straight downstream ray of length `2 + floor(growth/2)` (`index.ts:131–139`). This is not an area-wide shield.
- Tide order is drift → shelter/stress → production → rations/Heart damage → growth → outcome. Newly earned growth raises production on later tides, not that harvest (`index.ts:279–328`).
- Shelter, including calm weather, removes one stress before production/growth checks. Exposure adds storm strength, capped at 5. Stress 3 can recover to 2 and work immediately; stress 4 needs two safe tides to drop below 3.
- Nourishment remains queued through unsafe or unfed tides. One paid action can produce only one growth stage; a failed growth opportunity does not consume it (`index.test.ts:65–85`).
- Short rations remove one Heart integrity and block all growth that tide; Heart stress at least 3 removes another integrity. Integrity has no replenishment action. A player can recover food and stress, but cannot undo committed damage.
- Movement is simultaneous; conflicts, closed cycles, anchored blockers, and the reef stop movement without destroying islands (`index.ts:249–277`, `index.test.ts:100–146`). One anchor can therefore hold a chain.
- `moonwake` adds outward drift on tide 5 and fleet-wide crosscurrent on tide 7; final victory checks every bell after resolution for growth 3, connection, shelter, stress below 3, and a surviving Heart.
- Whale Tow already supplies a food-free move for one action on tides 2, 5, and 7, once per visit, constrained to its seeded direction; drift still follows (`index.ts:174–188`).
- Forecast, tide chart, build previews, per-bell advice, final-loss warning, same-tide undo, and First Light final-tide replanning already exist. They should be evaluated and refined, not proposed as absent features.
- Replanning restores the real start of campaign map 1's final planning tide; it does not synthesize a better board. Later maps and old completed saves without a checkpoint use normal retry (`ui/finaleRecovery.ts:5–14`).
- Medals count ordinary-island growth only: 0–2/3–5/6+ stages earn ranks 1/2/3 after victory; best records persist per campaign map or free-voyage seed (`ui/achievements.ts:7–15`).

## Eight-map route audit

Numbers below describe `campaignSolution(map)` only. Minimum resources include every before/after-command and resolved state, not just end-of-tide balances.
N/T/A/B are Nourish/Tow/Anchor/Build counts; all eight routes use zero Whale Tows and zero ordinary-island Nourishes.

| Map | Bells; actions/tide | N/T/A/B | Used / available | No-command tides | Food min → final | Timber min → final | Final Heart |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 First Light | 1; 3 | 3/2/3/0 | 8/24 | 4, 6, 8 | 5 → 12 | 8 → 14 | 4 |
| 2 The Long Way Home | 1; 3 | 3/3/2/0 | 8/24 | 4, 6, 8 | 4 → 10 | 9 → 14 | 4 |
| 3 A Second Opinion | 2; 4 | 6/1/4/0 | 11/32 | 4, 6 | 2 → 10 | 10 → 15 | 4 |
| 4 Bread and Bells | 2; 4 | 6/4/4/1 | 15/32 | 4, 6 | 2 → 7 | 7 → 10 | 5 |
| 5 The Third Voice | 3; 5 | 9/3/6/1 | 19/40 | 4, 6 | 4 → 21 | 8 → 10 | 5 |
| 6 Salt and Supper | 3; 5 | 9/3/6/1 | 19/40 | 6 | 1 → 6 | 8 → 9 | 5 |
| 7 A Choir of Four | 4; 6 | 12/4/8/1 | 25/48 | 6 | 1 → 11 | 7 → 8 | 5 |
| 8 The Moon’s Encore | 4; 6 | 12/4/8/1 | 25/48 | None | 1 → 10 | 9 → 13 | 5 |

- **Observed repetition:** every witness anchors every bell on both tides 5 and 7. Total anchors: 41 of 130 commands; maps 7–8 each devote eight commands to those two rounds (`campaign.ts:181–260`).
- **Important counterevidence:** deleting one anchor and leaving all later commands unchanged still wins in 11 cases across maps 3–8. This does not establish that those anchors can all be removed together.
- Across all 130 single omissions: 15 win, 88 lose, and 27 make a later scripted command illegal. An illegal continuation is not proof the position is unwinnable; this probe never replans it.
- **Observed slack:** routes leave 158 of 288 action slots unused and have 14 no-command tides. Map 8 has no empty tide yet still leaves 23 actions unused. Command count is not decision quality or planning effort.
- **Waiting has consequences:** map 2's queued growth resolves on otherwise empty tide 4; both map 3 bells and map 4's second bell also finish growing on empty tide 4. These are not mechanically inactive tides.
- All witnesses lose if their final two tide plans are omitted. Late preparation matters under existing rules; more hazards are not justified just to prevent coasting.
- **Observed pantry contrast:** omitting the opening garden makes the existing scripts for maps 4, 6, 7, and 8 unable to afford Nourish on tide 3. Map 5 still wins without its garden, ending with 5 food instead of 21.
- That contrast supports studying investment timing and map identity. It does not prove any particular garden is mandatory or that map 5 is too easy.
- **Neglected in these witnesses:** no grove/breakwater construction, no ordinary growth, and no whale use. Every witness consequently earns the lowest medal; the route set does not test the game's optional economy.
- First Light's tide-2 Tow can be replaced exactly by Whale Tow; the replay wins with 13 rather than 12 food. This establishes a useful existing substitute, not a strategic overhaul.
- The existing First Light alternate from `late-voyage.test.ts` was replayed: skip both late bell anchors, ride the currents, then tow `garden-west` twice into a bridge/windbreak. It wins with 11 food and 16 timber.
- Later maps already finish differently: map 3 moves a support grove, map 4 moves both bells plus support, map 5 builds a support chain, map 6 moves two supports, and maps 7–8 combine bell/support relocations.
- **Hypotheses requiring humans:** repeated bell anchoring may feel administrative; idle tides may feel restful or empty; early low food may teach investment or discourage experimentation; spare actions may invite medals or feel purposeless.

## A concrete recovery gap (fixed in the implementation below)

At kickoff, `finaleAdvice.ts:23–34` searched ordinary tows and breakwater builds, but not Nourish. It correctly verified every candidate with the real full-voyage forecast.
Reachable reproduction: play map 1's reference route but omit tide 3's Nourish; complete the existing plans through tide 7.
At tide 8 the player has 14 food, 14 timber, three actions, Heart integrity 5, and a connected/sheltered bell at growth 2 with no queued nourishment.
Kickoff advice explained growth 2/3 and stress 1 → 0 but supplied no rescue. Applying `{ type: 'nourish', id: 'bell' }` and advancing wins in the production simulator.
This is a demonstrated omission in the supported one-action rescue mechanism, not evidence that the player cannot find Nourish unaided.
The kickoff tests covered growth already queued before advice, but not suggesting the missing nourishment action; this gap now has regression coverage.
The kickoff App could select the target without spending, but only Tow/Build received rescue highlighting. Project Lead owns the new Nourish focus/highlight integration.

## Bounded evaluation method

1. Retain these eight untouched witnesses as solvability references; do not optimize them into claims about the only correct strategy.
2. Use 3–5 first-time players for a First Light observation round; record actions, undo, forecast/help use, pauses, explanation in their words, and retry choice. Avoid giving the solution before an unaided attempt.
3. Recruit a small follow-up group who understands First Light for maps 4 and 6, then sample 7–8. Counterbalance comparison order when comparing a candidate against the current map; record prior familiarity.
4. Capture expected versus actual food, drift destination, shelter, growth, and stress before resolving tides 2, 5, and 7. Distinguish a rules misunderstanding from a knowingly risky strategy.
5. For each map, compare hold-position, ride-and-reconnect, and move/build-support routes using the real API. Include production investment and optional growth, not just a bell-only heuristic.
6. Begin with individual command deletion/substitution. For unresolved alternatives, examine two explicit checkpoints per later map, each capped at 2,000 expanded states and at most two tides; fixed command order and complete state keys make runs reproducible.
7. Bound that search to 24,000 expansions over maps 3–8; separately replay every found complete route from a fresh opening. Record cap exhaustion as **unresolved**, never **impossible**.
8. A materially different approach changes bell/support trajectories or the method of creating shelter/connection across a late tide. Deleting a redundant anchor or replacing one Tow with Whale Tow is not enough on its own.
9. Compare spend timing, minimum pantry, Heart damage, commands by role, ordinary growth, shelter arrangement, and recovery after one missed action. Keep manual interpretation alongside counts.
10. A changed challenge map needs two legal materially different winning approaches, or lead-approved designation as a focused teaching puzzle. Preserve all eight baseline wins and unaffected seeded/legacy behavior.
11. Change at most one map variable per prototype and only after a recorded player problem. Prefer arrangement, starting production, or lesson emphasis using existing rules; keep the current version when evidence is inconclusive.
12. Small samples are directional. Success means fewer observed misunderstandings or a noticed useful alternative with an explicit tradeoff, supported by traces and quotations; it does not mean a statistically proven fun score.

## Ranked tickets

### GB-01 — Include Nourish in verified final-tide rescue advice · P0 · M

- Player problem: a salvageable growth-2 bell receives no one-action suggestion even though final-tide nourishment can win.
- Scope: `src/game/finaleAdvice.ts`, `src/game/finaleAdvice.test.ts`; lead-owned integration in `src/App.tsx`, with UX-owned review of `src/ui/FinaleCheck.tsx` if its action wording changes.
- Dependencies: lead assigns the advice files; lead/UX accept selection, focus, and highlighting behavior. No rules or schema work required.
- Acceptance: the reachable case above gets an accurate Nourish suggestion; it is legal, wins the whole voyage, and is not auto-executed. Existing Tow/Build suggestions still work.
- Verification: targeted advice tests plus both desktop sizes using actual pointer and keyboard controls, followed by lead/engineering integration regressions. Full specification below.

### GB-02 — Observe the first voyage and choose one teaching correction · P0 · M

- Player problem: whether existing cost, post-drift shelter, queued growth, and recovery feedback teaches the rules is still unverified by new players.
- Scope: unique observation template/results under `docs/pillars/evidence/gameplay/`; exact copy/helper changes proposed only after results, with App/interaction ownership retained by lead/UX.
- Dependencies: UX fresh baseline and working browser flow; 3–5 human participants; World reviews tone and lesson sequence.
- Acceptance: each attempt records immediate-versus-ration understanding, forecast expectation, first surprising loss, and retry explanation; separate participant statements from observer inference.
- Acceptance: select one evidence-backed teaching change or explicitly retain the existing treatment. Keep numerical difficulty unchanged in this slice.
- Verification: replay the observed failure through production commands; repeat the relevant task after the correction without coaching the answer. Human scheduling remains external work.

### GB-03 — Make the eight-map strategy/economy matrix reproducible · P1 · M

- Player problem: later voyages may reward repeating an anchor routine while useful alternatives remain undiscovered or unevaluated.
- Scope: future isolated `scripts/audit-gameplay.*`, route fixtures, and `src/game/strategy-routes.test.ts`; coordinate campaign fixture reads with World. Do not alter authored maps in this ticket.
- Dependencies: this evidence, GB-02 observations, and a single agreed command-trace format with UX.
- Acceptance: report all eight maps, all five actions, all building types, ordinary growth, waiting with queued effects, and complete versus capped searches; follow the explicit bounds above.
- Acceptance: identify two verified strategic approaches for each proposed challenge-map change or a clearly documented evidence gap; retain First Light's existing two approaches.
- Verification: fresh-state replays, full-state determinism/immutability, forecast equality, bounds/collision checks, and resource accounting. No claim of exhaustive reachability or dominance.

### GB-04 — Establish compatibility fixtures before balance changes · P1 gate · M

- Player problem: a resumed or undone voyage must not silently acquire different costs, weather, victory conditions, or action budgets after an update.
- Scope: lead-owned save/rules design; Gameplay supplies command/outcome fixtures in isolated tests alongside `late-voyage.test.ts`, `generation.test.ts`, and storage/recovery regression cases.
- Dependencies: lead approval of any rule/version change; must precede GB-05/07 shipping if they affect simulation or seed identity.
- Acceptance: representative legacy-without-`voyageRules`, current free-voyage, maps 1/4/8, same-tide undo, and genuine final checkpoint resume to their recorded outcomes; medals/progress survive.
- Acceptance: same seed/input produces identical current outputs; current saves never get reconstructed from new openings. Any deliberate future rules revision has explicit tagging and a tested old-rule dispatch.
- Verification: old-fixture continuation and cold generation, round-trip/undo/checkpoint tests; lead runs full suite/build. Do not broaden schema validation or invent migrations in this kickoff.

### GB-05 — Trial one later-map choice improvement from observations · P1 · L

- Player problem hypothesis: pantry maps may narrow choices to an opening garden plus repeated anchors, obscuring investment timing and support-island alternatives.
- Scope: start with map 4 or 6, chosen from GB-02/03 evidence; World owns one assigned writer for `campaign.ts`, Gameplay owns separate candidate traces and balance tests.
- Dependencies: GB-02/03 and GB-04 compatibility gate; World agrees the map's intended lesson. No harder global rule is a default deliverable.
- Acceptance: one bounded arrangement/starting-production candidate addresses the observed problem; two materially different verified wins; unchanged map count, eight tides, and ordinary command vocabulary.
- Acceptance: missed-action recovery remains understandable, and an observed cost/benefit differentiates the approaches. Revert the candidate if it merely increases required clicks or hides the solution.
- Verification: matched current/candidate human task, all campaign replays, affected save fixtures, and lead-owned browser runs at 1366×768 and 1920×1080.

### GB-06 — Give spare actions a legible optional purpose · P2 · M

- Player problem hypothesis: players may finish mandatory bell work without noticing ordinary growth, useful whale moves, or the tradeoff between production and windbreaks.
- Scope: World-owned medal/lesson presentation; Gameplay isolated medal-route fixtures and option comparisons; lead/UX own any result-screen or action-control changes.
- Dependencies: GB-02/03 observations and GB-05 if its chosen map changes. Reuse the existing medal system and whale, without new currencies or quotas.
- Acceptance: a complete current-rules six-ordinary-growth win for each map promoted for medal replay; test one genuinely useful whale/support option and its downside on an applicable map.
- Acceptance: observed players can describe the optional target and choose whether to pursue it; a plain victory remains valid. Do not make whale use or every building type compulsory.
- Verification: real command replays and medal persistence checks; human observation distinguishes discovery from being explicitly told the route.

### GB-07 — Evaluate procedural variety beyond its witness policy · P2 · M

- Player problem hypothesis: new geometries may still invite the same early-home/early-garden/late-anchor routine.
- Scope: isolated generation evaluation and fixtures; `generation.ts` changes only after lead assigns ownership and approves a human-evidenced problem.
- Dependencies: campaign learning results, GB-03 strategy criteria, GB-04 compatibility design; World defines what a worthwhile second voyage should vary.
- Acceptance: a fixed stratified seed panel covers four building families, six rotations, and bell distances 2–4; measure fallback/attempt counts, resource pinch, route strategy, and ordinary-growth opportunity.
- Acceptance: findings separate candidate rejection by the bounded witness constructor from actual unsolvability. No additional randomness or constraint is introduced solely to increase apparent variety.
- Verification: cold-start reproducibility and accepted-command replays; retain the existing 400-sea witness and 1,000-seed invariant tests in engineering's release pass.

## GB-01 implementation-ready handoff

1. Reproduce with `createCampaignGame(1)` and `campaignSolution(1)`, omitting its tide-3 Nourish; resolve through tide 7 with every command checked for errors.
2. Assert the baseline forecast loses on growth, while `applyCommand(Nourish)` followed by `forecastTide` wins; no state fixture teleportation or resource grants are needed.
3. Extend the final-tide candidate list with bell Nourish commands. Keep existing Tow/Build relative ordering; appending Nourish avoids changing established rescue preferences unnecessarily.
4. Use `applyCommand` to reject already-queued nourishment, mature bells, insufficient food/actions, or completed voyages; use the forecast to reject growth below 2 or any other non-winning result.
5. Do not merely check `growth === 2`: a legal nourish can still fail through exposure, stress, starvation, Heart damage, disconnection, or another unfinished bell.
6. Add explicit Nourish copy in `rescueHint`; the existing non-Tow branch assumes Build. Suggested copy: “Nourish [name]: 1 action + 2 food now. Growth completes after the safe, fed tide. Then advance to win.”
7. Contract stays `rescue?: Command`; no new saved fields or command type. Suggestions remain optional, deterministic, and recomputed when the planning state changes.
8. Lead updates `planRescue`/Nourish presentation to select the suggested bell, close the warning, expose the actual action, and focus it with a visible and accessible “suggested” indication.
9. “Show this move” may become “Show this action” through UX review. Opening the suggestion must change no food, timber, action count, nourishment, undo history, or save checkpoint.
10. One ordinary Nourish click executes through existing `execute`; Undo restores that exact planning state. Advance still commits the tide separately.
11. Add positive tests for the reachable map-1 case and a multi-bell state where one nourishment completes the whole voyage; preserve existing tow and breakwater cases.
12. Add negative coverage for no actions, insufficient food, growth below 2, already queued/mature, exposed/overstressed, an unready second bell, and unaffordable rations blocking growth; include immutability and earlier/completed tides.
13. Verify legacy omitted-rule advice follows the legacy forecast; do not impose new shelter restrictions on old saves. Existing checkpoint logic is unchanged.
14. Targeted command after implementation: `npm test -- src/game/finaleAdvice.test.ts src/ui/finaleRecovery.test.ts --maxWorkers=1`; engineering owns the subsequent full suite/build.
15. Browser acceptance at both desktop sizes: reproduce through controls, trigger final warning, show suggestion by pointer/keyboard, verify no spend, Nourish, Undo, Nourish again, advance, and win; include reload during planning and reduced motion.
16. Exclusions: multi-action solver, automatic repair, new retry privileges, balancing costs/weather, campaign layout changes, extra overlays, and persistence migration. Lead signs off after integrated checks.

## Risks, dependencies, and lead decisions

- **Witness bias:** generation deliberately tows home early, builds toward two gardens, anchors some late drift, and searches final shelter with a beam width of eight (`generation.ts:86–105,118–176,184–230`). Accepted seeds prove that policy can win, not that all other policies are worse.
- **Finite generation:** at most 32 random candidates plus an authored fallback are attempted; rejection reflects this bounded constructor. Old saves store geometry and must not be regenerated (`generation.ts:245–265`).
- **Rules compatibility:** validators currently accept only omitted rules or `moonwake`, and require `moonwake` for campaign saves (`storage.ts:34–35`). Editing global costs/stress/weather would reinterpret existing saves unless version dispatch is designed first.
- **Medal comparability:** campaigns key medals by map number, so revised openings affect future attempts under the same record. World/lead should explicitly retain records and explain any changed challenge; never erase prior success.
- **Resource traps:** replacing the last useful garden may win shelter but lose rations/growth. Preserve simulator-backed previews/advice rather than approximate resource heuristics.
- **Ownership:** Gameplay advises mechanics; World controls lesson/map identity; UX controls discoverability and accessibility; Art conveys shelter/stress/current causes. Lead integrates shared code and accepts any scope change.
- Kickoff decisions: GB-01 and GB-03 were subsequently commissioned and are delivered below. A 3–5-player observation round remains pending; retain current numerical balance until observations justify a specific experiment.

## Suggested human playtest questions

- Before advancing: “What will your food be after this tide, and what changes it?”
- “Where will this bell finish, and what protects it from this wind?”
- “What does Anchor protect against? What would still happen to an anchored exposed island?”
- “Why did this nourished bell wait? What must happen for it to grow?”
- “This island has four stress. How many safe tides would it need before it can work?”
- “Which choice on this map felt important? Which felt like repetition or waiting?”
- “What would you change after that loss? Would you replan, retry, continue, or stop, and why?”
- “Did you notice the whale and Flourishing Shores target? When would you choose them over securing the bells?”

## Implementation wave — completed module work

- GB-01: `src/game/finaleAdvice.ts` now appends bell Nourish candidates after existing Tow/Build candidates and accepts one only when the real final forecast wins the entire voyage. Copy distinguishes the immediate 2-food cost from delayed growth.
- `src/game/finaleAdvice.test.ts` covers the reachable missed-nourishment route, multiple bells, queued/mature bells, resource/action limits, insufficient growth, exposure/stress, starvation/Heart destruction, legacy rules, and immutable/deterministic advice.
- GB-03: `src/game/strategyRoutes.ts` provides 16 independent executable command fixtures, a fresh-opening auditor, and bounded deterministic discovery. `src/game/strategyRoutes.test.ts` independently replays every fixture through the production engine.
- `campaignMedalRoute(1..8)` returns a legal win with six ordinary growth stages; `campaignLateRoute(1..8)` returns a legal changed late approach. Both return independent copies and validate map IDs; neither changes the authored reference routes.
- `auditStrategyRoute(map, commands)` reports per-tide spend/slack/production/positions, minimum resources, ordinary growth, and final state. `lateStrategyDifference` requires changed bell positions after tide 5/7 plus a new spatial command, excluding redundant-anchor deletion alone.
- `scripts/audit-gameplay.cjs` runs without dependencies being added, source writes, save writes, or build output. `node scripts/audit-gameplay.cjs` replays reference/medal/alternative routes; add `--map=6` to narrow it or `--search` to reproduce bounded discovery.
- Current outputs: [route audit](evidence/gameplay/strategy-audit.json) and [bounded discovery](evidence/gameplay/strategy-search.json). They record hashes of the loaded source. The original `route-audit.json` remains kickoff evidence; its companion probe now tolerates the fixed suggestion.

| Map | Medal growth | Medal final food / timber | Different late approach | Alternative anchors / tows | Alternative final food / timber |
| --- | --- | --- | --- | --- | --- |
| 1 | 6 | 16 / 14 | Release both surges; final bell tow | 1 / 3 | 12 / 16 |
| 2 | 6 | 20 / 14 | Release both surges; two final bell tows | 0 / 5 | 8 / 16 |
| 3 | 6 | 21 / 15 | Release tide 7; reposition bell and support | 2 / 2 | 10 / 17 |
| 4 | 6 | 9 / 10 | Release both surges; reposition garden and bell | 0 / 5 | 1 / 14 |
| 5 | 6 | 36 / 10 | Release the first bell on 5/7; hold the other two | 4 / 5 | 15 / 12 |
| 6 | 6 | 22 / 6 | Release all three on tide 7; move grove and garden | 3 / 4 | 5 / 12 |
| 7 | 6 | 11 / 8 | Release the first bell on 5/7; use a longer garden bridge | 6 / 6 | 7 / 10 |
| 8 | 6 | 3 / 13 | Release all four on tide 7; rearrange bells/supports | 4 / 7 | 8 / 17 |

- These are separate medal and alternative routes, not a claim that the same route satisfies both goals. All medal fixtures reach a temporary zero-food balance and rely on the actual harvest timing; minimum balance alone does not mean starvation.
- Map 6's medal fixture adds a garden on `shore-3` during tide 2. The seven other medal fixtures add only ordinary nourishment to the reference plans. No rule, layout, seed, budget, or starting resource was changed by this pillar.
- Search bounds: one medal search retains at most 48 states per tide and resolves at most 12,000 candidate tides, each with at most seven fixed-suffix checks. It adds nourishment to the reference plan; fallback tries at most three explicitly selected extra tide-2 gardens.
- Each late search retains at most 24 states per action depth, attempts at most 8,000 commands, and searches only the final tide. CLI tries at most four release policies per map: all bells on 5/7, all on 7, first bell on 5/7, first on 7.
- Rejected, capped, and beam-pruned policies remain **unresolved**, even though another policy supplied a verified fixture. The search excludes earlier replanning, most new buildings, whale strategies, and other investment schedules; it establishes existence, not optimality or exhaustive variety.
- Final discovery performed 13,721 medal candidate expansions and 50,318 late-command expansions in total. One nourishment-only medal policy and seven late release policies stayed unresolved; fallback policies supplied all 16 verified fixtures. Evidence hashes were checked against the final loaded sources.
- Validation: `npm.cmd test -- src/game/finaleAdvice.test.ts src/game/strategyRoutes.test.ts --maxWorkers=1` passes **51 tests across two files**. Isolated TypeScript checking of both implementation modules passes; the CLI independently replays 24 reference/medal/alternative routes successfully.
- Additional checks cover repeated deterministic discovery, hard expansion caps, invalid limits, independent fixture copies, unchanged inputs, actual forecast/resolution equality, legal costs/action budgets, board bounds, and collision freedom. Full suite/build/browser validation stays with lead/Engineering.

### Integration contract and remaining acceptance

- Advice API remains `rescue?: Command`; the newly possible value is `{ type: 'nourish', id }`. Lead should select that bell, close the warning, focus/highlight the real Nourish button, and label it accessibly. Viewing spends nothing; execute/undo/reload/advance use existing flows.
- UI checks still required from lead: pointer and keyboard suggestion flow, no spend on viewing, one actual nourishment spend, undo/reload, and winning advance at 1366×768 and 1920×1080, including reduced motion. This pillar did not control the shared browser.
- World may truthfully describe the existing six-stage medal as achievable on every map. These fixtures do **not** award the player a medal or justify prepopulating bests; show only their actual saved achievements. Keep offline search/fixture modules out of the runtime UI import graph.
- Exact implementation writes: the two advice files, the two strategy files, `scripts/audit-gameplay.cjs`, this report, and unique gameplay evidence. Other agents' simultaneous App/content/storage/renderer edits were preserved. No commits, pushes, deployment, worktrees, or extra chats were created.
- GB-01's module fix and GB-03's engineering evidence are complete. Human comprehension/enjoyment, optional-goal discovery, and any numerical balance changes remain unvalidated and unimplemented; lead owns integrated release acceptance.

## Final bounded evidence — GB-06/07 automated scope closed

- Extended only `scripts/audit-gameplay.cjs` and gameplay report/evidence while `src`/`dist` stayed frozen. Lead reports module integration and 207 passing source tests; this wave uses the self-verifying offline audit rather than rerunning the shared baseline.
- `node scripts/audit-gameplay.cjs --procedural` audits fixed seeds `gameplay-panel-00` through `31`, covering all four families, six rotations, and bell distances 2–4. Exposed metadata shows 28 first attempts, four second attempts, and no sampled fallback.
- All 32 production witnesses win; bounded real-command insertion finds six-growth wins on all 32. This is sampled attainability, not a universal free-voyage guarantee or a human difficulty finding.
- A verified First Light whale substitution saves one food but consumes that visit's favour; a verified garden bridge/windbreak wins offshore at one extra food/action versus returning the bell. Full executable recipes and costs are recorded.
- [Detailed method, comparisons, and scope decision](evidence/gameplay/procedural-options.md); [reproducible JSON evidence](evidence/gameplay/procedural-options-audit.json).
- Two complete runs produced byte-identical output; [verification receipt](evidence/gameplay/procedural-checks.json) confirms source/script hashes, all 24 campaign fixture wins, both option comparisons, and unchanged fingerprints for 66 `src` and seven `dist` files.
- Close automated analysis for the release. Retain current rules/layouts/generation and existing campaign fixtures; reopen only a specific human-observed problem or regression. Human enjoyment and discovery evaluation remain pending.
