# World & Progression — Milestone 0 audit and plan

Date: 5 November 2026 (Australia/Perth). Pillar lead: World & Progression.
Status: content/chart implementation integrated by the lead; the three initial review findings were addressed. Final read-only recheck leaves one small medal-wording correction below. Release validation belongs to Project Lead. Earlier sections retain their milestone context.

## Recommendation

Keep the eight-map campaign, fresh-town resets, three existing medals, and procedural free voyages.
Make each shore memorable through a clear planning question and a short trace of its inhabitants.
Prioritize WP-01's First Light handoff, WP-02's evidence-based lesson sequence, then WP-03's eight-map continuity.
Treat replay as an invitation to care for more of a town, with no unlock requiring a medal or repeated farming.
Resolve the confirmed medal-key collision through the lead/UX persistence work before shipping WP-04.

## Scope and evidence discipline

- Read AGENTS.md, `docs/todo.md`, `docs/improvement-plan.md`, README, campaign/generation code and tests, campaign UI, progression, achievements, relevant simulation and App integration.
- Source checkout inspected: `f14e9a2`; shared programme documents were already being edited by the other sessions. No shared files were changed here.
- Kickoff evidence: [audit script](evidence/world/audit-campaign.cjs) and [results](evidence/world/campaign-witness-audit.json), captured with `node docs/pillars/evidence/world/audit-campaign.cjs`. The script asserts the then-present key collision; after the lead's migration it is a historical reproduction, not a current regression check.
- The script transpiles existing TypeScript in memory and executes eight existing command witnesses through production rules; it also reproduces one medal-key collision. It writes only its own JSON evidence.
- This is a focused content/route audit, not the shared full test/build baseline. No test suite, production build, live browser, screenshots, human playtest, or listening session was run by this pillar.
- `docs/verification.md:5–33,88–102` records September 2026 tests/browser work; those results and screenshots are **historical**, not observations from this audit. No screenshot was visually reviewed here.
- Code observations establish implemented behaviour; proposed experiences and player responses below remain hypotheses until tested.

## Current-state audit

| Evidence | What exists / what it establishes |
| --- | --- |
| [campaign.ts](../../src/game/campaign.ts), lines 7–16, 25–146 | Eight named, frozen authored scenarios; one to four bells, seven to thirteen islands. Different geometry, starting buildings/resources, current rotations and final winds already exist. |
| `campaign.ts:148–177`; [index.ts](../../src/game/index.ts), lines 12–13 | Familiar shore/bell names, opening objective logs, and three/four/five/six actions per tide. All maps start fresh with zero growth; names are reused across towns. |
| [campaign.test.ts](../../src/game/campaign.test.ts), lines 6–117 | Existing tests cover roster progression, distinct openings, actual winning routes, unattended losses, every added bell's growth, and losses when late preparation is omitted. Tests were read, not rerun here. |
| [CampaignScreen.tsx](../../src/ui/CampaignScreen.tsx), lines 13–31 | Moon premise, planning primer, grouped fleet growth, sequential locks, replay, resume and free voyages already exist. Locked cards replace their subtitle with an unlock condition; completed cards show a check, not their saved medal. |
| [campaignProgress.ts](../../src/ui/campaignProgress.ts), lines 4–16 | Only the next sequential victory advances completion; retries cannot erase wins. Defeat already distinguishes legacy rules, exposed bells and stress recovery. Preserve these explanations. |
| [achievements.ts](../../src/ui/achievements.ts), lines 3–28; [App.tsx](../../src/App.tsx), lines 96–98, 400, 424, 437 | Best growth/medal per record, storage validation, current/best-overall display, explicit 0–2 / 3–5 / 6+ thresholds and a flourishing meter are implemented. Medal persistence is not missing. |
| `App.tsx:429–440` | Maps 1–7 share the success paragraph and generic next-shore suffix; map 8 has a bespoke ending. There is a continuation action, but no next map title/character in its invitation. Victory currently labels replay as “Retry this map.” |
| [generation.ts](../../src/game/generation.ts), lines 26–30, 184–265 | Four starting-structure families, varied geometry/current patterns, simulator-validated witnesses, bounded generation/fallback, and concise opening summaries already exist. Summaries show distance, gardens, groves and current pattern. |
| [generation.test.ts](../../src/game/generation.test.ts), lines 16–79, 101–140 | Existing 400-seed witness/diversity, cold-start determinism, cache isolation and summary tests; these are coverage observations, not fresh pass claims. The named families are internal metadata, not a player-selected difficulty ladder. |
| `README.md`, Objective/Scope; `index.ts:48–71,279–327` | All maps use the same eight-tide rhythm and final conditions; calm, storm, outward tide 5 and crosscurrent tide 7 already have flavour and forecasts. No new hazard is needed merely to distinguish chapter copy. |

Observed gap: campaign identity is concentrated in titles/subtitles, while successful outcomes mostly flatten it into the same message. This is a content opportunity, not evidence that existing players dislike the story.
Observed defect: `voyageRecordKey` uses `campaign-map-N` for campaign records and the raw seed for free voyages. Free seed `campaign-map-3` therefore shares map 3's record; a better result in either can appear as the other's medal. This does **not** unlock campaign maps.
The existing separation test (`campaignProgress.test.ts:12–17`) uses the campaign's scenario seed, not the reserved-looking key; it does not cover this collision. The audit reproduces equal keys with both actual factories.
Hypotheses to test: more specific next-shore promises improve continuation; residents make abstract growth feel purposeful; later maps feel repetitive because conservative solutions share a routine; the fixed six-growth target has uneven difficulty across fleets.
Do not turn those hypotheses into balance changes, new currencies, mandatory dialogue, or an assertion that all players use the reference route.

## Fresh witness evidence and its limits

All eight supplied routes completed legally with `won`, final readiness true, matching forecast/resolution, and unchanged fresh openings after execution. These are new focused checks.

| Map | Commands / available over 8 tides | Anchor commands | Tides with no commands | Lowest food observed* | Ordinary growth | Final wind from |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 8 / 24 | 3 | 4, 6, 8 | 5 | 0 | SE |
| 2 | 8 / 24 | 2 | 4, 6, 8 | 4 | 0 | NE |
| 3 | 11 / 32 | 4 | 4, 6 | 2 | 0 | W |
| 4 | 15 / 32 | 4 | 4, 6 | 2 | 0 | NW |
| 5 | 19 / 40 | 6 | 4, 6 | 4 | 0 | NE |
| 6 | 19 / 40 | 6 | 6 | 1 | 0 | SE |
| 7 | 25 / 48 | 8 | 6 | 1 | 0 | SE |
| 8 | 25 / 48 | 8 | none | 1 | 0 | NW |

*After commands and resolved tides, including the opening. This is route-specific, not a map difficulty rating. Available actions cannot carry between tides.
Every route anchors all bells on tides 5 and 7; none uses Whale Tow; maps 4–8 build one garden. Map 8 staggers its last bell's growth through tide 6, so the finale already changes pacing.
Each witness earns Safe harbour. Spare actions do not prove spare food, safe growth opportunities, or attainable higher medals. Existing `achievements.test.ts:20–22` mutates growth to test recording; it is not a legal medal-winning route.
Use these witnesses as a floor for solvability. Gameplay should test alternative approaches and medal feasibility; humans should judge whether quieter tides feel like welcome planning space or waiting.

## Eight-map identity and lesson matrix

Current titles and mechanical facts are implemented. Experiential identities, narrative beats and optional hooks below are **proposals**, not additional shipped features. B/I/A = bells/islands/actions per tide. Winds refer to the final squall's incoming direction.
Dependencies: G = Gameplay feasibility/rules; U = UX accessibility/placement; A = Art/Audio treatment; L = lead integration/persistence. All hooks remain optional, require a win, and cannot gate the next map.

| Existing map | Existing pressure / proposed lesson emphasis | Proposed experiential identity | Proposed narrative beat | Candidate optional objective / replay hook | Dependencies |
| --- | --- | --- | --- | --- | --- |
| 1. First Light | 1/7/3; two gardens; distant bell; SE final wind. Learn delayed growth, connection, post-drift shelter and recovery. | A small rescue before breakfast. | The Committee puts the kettle on; the first saved morning becomes news for other shores. | Win with 3 ordinary growth for the existing Thriving town medal, after learning the basic rescue. | U/L for WP-01; G verifies medal route; A keeps first-voyage signals primary. |
| 2. The Long Way Home | 1/7/3; bell starts four hexes away; an existing breakwater; NE final wind. Read geometry afresh instead of copying map 1. | A borrowed harbour at the edge of the chart. | The keeper asks for the breakwater back “whenever the sea is finished with it.” | Candidate: win with a stage-2 breakwater, extending its shelter reach. Encourage caring for borrowed shelter; never require Whale Tow or an exact tow sequence. | G must prove route and useful tradeoff; U explains optional status; A may echo the borrowed-harbour motif. |
| 3. A Second Opinion | 2/9/4; two gardens; W final wind; witness moves a shore for final shelter. Coordinate both bells and shared protection. | A neighbourly disagreement that resolves into a duet. | The Contrary Bell joins the conversation; everyone agrees on breakfast, eventually. | Candidate: win with growth on at least two distinct ordinary islands. Observe distribution, not a repeated-action quota. | G verifies final-state goal and alternatives; U names both bells clearly; L keeps fleet changes data-derived. |
| 4. Bread and Bells | 2/9/4; only one starting garden; NW final wind; witness adds food production. Balance immediate nourishment with tomorrow's pantry. | A communal kitchen afloat. | The bakers reserve a place at the table for the sea, which is a difficult guest. | Candidate: win with a grown garden still producing food at the final state. Avoid arbitrary stockpile targets. | G owns production predicate and economy; U connects copy to real food forecast; A supplies restrained kitchen cues only if useful. |
| 5. The Third Voice | 3/11/5; two starting gardens; NE final wind; witness repositions ordinary shores into shelter. Treat ordinary islands as neighbours, bridges and windbreaks. | A harbour learning to listen. | Three bell keepers plan a concert; the gardeners ask for somewhere dry to sit. | Aim for existing Unreasonably splendid: 6 ordinary growth. No requirement to put it on a specific named shore. | G proves feasible medal route; A/U maintain readability in the larger fleet; L preserves saved records. |
| 6. Salt and Supper | 3/11/5; one garden; scattered shores; SE final wind; witness food reaches 1 and third bell finishes later. Sequence care under food pressure. | A shared supper after a long crossing. | Each shore brings something; nobody is asked to bring the ocean. | Candidate: win with Heart integrity 5. Show it as care for the town, never as a “perfect run” needed to progress. | G verifies that preserving integrity offers a fair choice; U distinguishes food damage from sea pressure. |
| 7. A Choir of Four | 4/13/6; two starting gardens; SE final wind; multi-island final arrangement. Coordinate the full fleet without losing the ordinary shores. | A rehearsal with room for everyone. | The Committee finally finds enough chairs; several are floating away. | Candidate: 6 ordinary growth spread over at least three shores, instead of a new medal tier. | G compares concentrated/distributed growth; U/A protect thirteen-island readability; L no new saved badge in the pilot. |
| 8. The Moon’s Encore | 4/13/6; two starting gardens; NW final wind; witness spreads nourishment through tide 6. Synthesize timing, shelter and final arrangement. | An earned quiet ending, with permission to linger. | Keep the existing Moon-forgets-why-it-came ending; let the towns decide to have another morning. | Existing Unreasonably splendid, replay any favourite shore, or take a one-bell free voyage. No ninth-map tease or completion grind. | G medal feasibility; A restrained resolution; U/L preserve chart, linger and saved completion. |

## Pillar direction and content contract

- The campaign connects **different fresh towns through news, hospitality and a growing chorus**; it must not imply the player's previous buildings/resources physically carry forward.
- Use recurring voices sparingly: The Committee, bell keepers, gardeners and a borrowed-harbour keeper. Names already on the board take precedence over a new character roster.
- Put flavour in existing chart/result space. A player can ignore it and still plan correctly. No auto-opening story dialog, timed text, voiceover requirement, or additional persistent HUD panel.
- Separate mechanical guidance from whimsy: exact costs, shelter directions, stress and failure reasons remain simulator-derived. A joke must never imply anchors stop storms or that a grown bell is already safe.
- Aim for one short chart note and one short success coda per map; preview the next map's actual planning question. Loss copy remains diagnostic before any consolation.
- Avoid hardcoded bell/island/action counts in editorial strings. Read those from campaign descriptors/getActionBudget; keep title and map numbering authoritative in `CAMPAIGN_MAPS`.
- Keep authored copy in a presentation/content module, separate from `SCENARIOS`, solutions and rules. World proposes identity; Gameplay approves lesson accuracy and feasibility; Art interprets motifs; UX owns exposure and accessible reading order.
- Use medals as personal bests in one voyage. No cumulative chores, streaks, daily timers, spendable reward, mandatory “perfect” run, or loss of an earned medal after retry.
- Preserve the existing “fresh town” and local-browser-save explanation. A campaign completed once is complete even if every medal remains Safe harbour.

## Prioritized tickets

Sizes are relative: S = bounded content/integration slice; M = several surfaces or targeted feasibility work; L = cross-cutting redesign. These are proposals for later assignment, not permission to edit shared files now.

### WP-01 · P0 / Milestone 1 · First Light shore note and next-shore promise · S
- Player problem: the first rescue has rules and a result, but little map-specific human consequence or a concrete promise about the next shore.
- Scope/files: new `src/content/campaignCopy.ts`; first card in `src/ui/CampaignScreen.tsx`; lead-owned success/unlock text in `src/App.tsx`. Keep all underlying scenarios untouched.
- Dependencies/ownership: lead approves copy and assigns the component writer; UX checks accessible descriptions; Gameplay checks the single shelter-learning phrase. Detailed specification below.
- Acceptance: one concise First Light note and success coda appear in existing surfaces; next invitation names map 2 and its pressure; existing objective, diagnostic loss and actions remain intact.
- Verification: editorial review plus real chart→map 1 win→map 2 handoff and loss/retry at both desktop sizes; lead runs the affected regression suite/build during integration.

### WP-02 · P1 / Milestone 2 gate · Validate the lesson and strategy sequence · M
- Player problem: a larger fleet may demand repeating a known routine instead of learning a new decision; current code alone cannot establish that experience.
- Scope/files: expand this matrix/evidence; Gameplay-owned isolated route/medal evidence and tests; `campaign.ts` scenario changes only if lead commissions a named writer after findings.
- Dependencies/ownership: Gameplay strategy audit and UX baseline; World owns lesson claims, not new current rules, economic constants or solution search.
- Acceptance: each map has one accurate planning question; identify observed pressure and at least two different feasible approaches for changed challenge maps, or explicitly designate a focused teaching puzzle. Prove a legal 6-growth winning route before promising the top medal on a map.
- Verification: legal command witnesses with action/resource/safety traces; compare anchor, drift/reconnect and ordinary-shore shelter options; observe selected pairs with players. No blanket nerf to anchors and no task added solely to fill a quiet tide.

### WP-03 · P1 / Milestone 2 · Give all eight shores a connected voice · M
- Player problem: title/subtitle differences do not carry through most success messages; the player may remember fleet size but not the places helped.
- Scope/files: extend `src/content/campaignCopy.ts` for maps 2–8; `CampaignScreen.tsx` presentation; lead-owned `App.tsx` coda and next-map invitation. Art receives motifs, not requests for eight new biomes/assets.
- Dependencies/ownership: WP-01 and accepted WP-02 lessons; U approves compact chart presentation and A checks coherence. Preserve current titles and fresh-state semantics.
- Acceptance: each map has a distinct ≤110-character chart note and ≤110-character coda; every next invitation names the real map and pressure; map 8 closes the existing story without a false unlock. No mandatory lore step or extra gameplay overlay.
- Verification: editorial coverage of all eight starts/wins, legacy/free-voyage fallbacks and replay; U checks pointer/keyboard flow at 1366×768 and 1920×1080; ask players to distinguish two same-fleet maps afterward.

### WP-04 · P1 / Milestone 3 · Make existing medals a useful replay invitation · M
- Player problem: the chart shows victories but hides each map's saved best, while the result offers “Retry” even after success; players must leave the chart to find their next personal target.
- Scope/files: `CampaignScreen.tsx`, `campaign.css`, a small presentation helper if needed; lead-owned `App.tsx` supplies existing achievement data/medal dialog. Lead/UX owns `achievements.ts` and any migration separately.
- Dependencies/ownership: fix the confirmed key collision with a compatible persistence design; WP-02 verifies advertised targets; U chooses readable placement rather than eight additional large badges.
- Acceptance: won cards show best medal/growth accessibly; success action says “Replay this map”; below rank 3, show the next existing threshold and its growth gap, never claim replay will be easier. Rank 3 offers free exploration or a favourite-map replay; unlocks remain win-only.
- Verification: absent records, ranks 1/2/3, inferior replay, reload, blocked storage and free/campaign key isolation; ensure stale or ambiguous legacy records are not silently erased or represented as verified campaign achievements. Check both desktop sizes and keyboard reading.

### WP-05 · P2 / Milestone 3, conditional · Pilot one optional shore objective · M
- Player problem: medals may not motivate players who want a different spatial plan, but this is unconfirmed; eight new checklists would add burden before evidence.
- Scope/files: only after playtest need, a pure `src/content/replayObjectives.ts` definition and Gameplay-owned final-state evaluator/tests; lead integrates one result/preview cue. Start with map 2's extended-reach breakwater candidate.
- Dependencies/ownership: WP-02/WP-04 and an observed replay gap; G proves a legal winning route and U ensures optional status. Other matrix hooks remain candidates, not automatic implementation commitments.
- Acceptance: one goal is clearly optional, evaluated from existing final state, does not alter victory, rewards, unlocks or save schema, and encourages a useful different choice. If feasibility/interest fails, reject the pilot instead of changing rules to justify it.
- Verification: positive and negative final-state cases plus a legal winning witness; ensure an ordinary victory without the goal still unlocks the next map. Human replay comparison asks whether the goal changes a decision rather than adding chores.

### WP-06 · P2 / Milestone 3 · Explain what a free voyage offers after the campaign · S
- Player problem: after four-bell campaign maps, “free voyage” does not explicitly signal the return to a smaller, one-bell puzzle; existing previews omit breakwaters.
- Scope/files: `generation.ts:233–241` summary only, under a named writer; `CampaignScreen.tsx`; lead-owned settings/restart/ending integration in `App.tsx`. No generator, seed, witness or rule change.
- Dependencies/ownership: U agrees placement, G checks factual summaries, WP-04 preserves record separation. Use actual generated state rather than inventing difficulty names from family labels.
- Acceptance: invitation states one bell/seven islands/three actions; preview retains existing distance/economy/current facts and includes existing breakwater count; seed copying, replay and campaign progress remain unchanged. No promise of infinite strategic novelty or automatic hard mode.
- Verification: deterministic sample summaries including zero/one breakwater and the authored first-light case; same seed reproduces its opening; browser campaign→free→chart retains victories/medals. Existing 400-seed suite is rerun by the integration owner if generation module changes.

### WP-07 · P2 / Milestone 4 · Campaign editorial and human progression acceptance · M
- Player problem: technically complete screens can still produce a tiring campaign, misleading handoff, or a weak reason to continue; automated route success cannot decide this.
- Scope/files: pillar evidence and lead-owned verification/roadmap updates; content fixes in the files assigned for WP-01/03/04/06. No analytics service or account system.
- Dependencies/ownership: U owns coordinated browser passes, A owns listening/visual judgement, G owns rule tuning, lead chooses participants and reconciles findings.
- Acceptance: inspect all eight chart/start/result handoffs and 2→3, 4→5, 6→7 fleet changes; record actual player observations on continuation, repeat strategy, recovery and optional-goal comprehension; distinguish findings, interpretations and unresolved questions.
- Verification: 3–5 new-player first-voyage observations plus targeted later-map/replay sessions with experienced participants; document consented notes and negative findings. Automated full regression/build and both desktop playthrough sizes remain lead/U release gates.

## Implementation-ready first ticket: WP-01

**Outcome:** the first saved town feels inhabited, and its existing result gives a truthful reason to sail to The Long Way Home. This is the World's contribution to the integrated first-voyage slice, not a substitute for learning/recovery work.
**Allowed future changes:** one small content module, first-map chart subtitle/accessible description, first-map success coda and next-map invitation. No scene assets, audio, scenario, rules, save, medal, unlock, checkpoint or failure-copy change.

1. Add `src/content/campaignCopy.ts` with a readonly `CampaignCopy` shape: `chartSubtitle`, `victoryCoda`, optional `nextShoreHook`; export a partial record keyed by campaign map number. For this ticket populate only map 1. Keep `CAMPAIGN_MAPS` authoritative for titles and counts.
2. Exact proposed map-1 chart subtitle: **“The Committee has put the kettle on. Bring one bell home; check shelter after drift.”** (The Committee already occurs in First Light's shore-name roster.)
3. Exact proposed victory coda: **“The Committee puts breakfast back on the calendar.”** Replace only the generic closing sentence “This town gets to see another dawn.” for a map-1 win. Keep saved-island and successful-bell facts immediately before it.
4. Exact proposed next-shore hook: **“A distant bell and a borrowed breakwater await.”** The existing unlock paragraph becomes **“Map 2 unlocked: The Long Way Home. A distant bell and a borrowed breakwater await.”** Derive number/title from the next descriptor; do not hardcode them in the content module.
5. In `CampaignScreen`, use the new map-1 subtitle with `map.subtitle` fallback. Keep all other cards unchanged. Associate the visible subtitle with its card's accessible description so the existing explicit button label does not hide the new sentence from keyboard/screen-reader users; use stable map IDs, no duplicate IDs.
6. Lead integrates the two `App.tsx` substitutions only for a map-1 victory. Free voyages (including seed `first-light`), maps 2–8, losses and legacy saves use existing text. Replaying a won map remains allowed and does not reset completed count.
7. No new modal, announcement timer, prompt gate, hover-only dependency, preference, saved narrative flag, or extra button. These short notes are optional reading in screens players already use. Normal action teaching and final diagnostics keep their existing prominence.

**Acceptance scenarios:** fresh profile sees the chart note and original four-condition primer; map-1 win shows coda, correct map-2 title and working continue action; map-1 loss keeps diagnostic/replan behaviour; replay keeps victories; map 2, free first-light and old-save result paths use fallbacks. No text is shown as a mechanical reward or resource transfer.
**Verification:** U/lead perform those paths using real controls at 1366×768 and 1920×1080; check readable wrapping, scrolling to primary actions, focus and the card's accessible description. Existing focused campaign/progression/achievement regressions and production build run in the integrated wave; no unit test that merely duplicates editorial strings is necessary.
**Release gate:** lead reviews actual rendering and one first-time-player handoff observation. If the note competes with essential learning, shorten or remove it; do not add another panel to make it fit. No claim that this copy alone improves comprehension or enjoyment.
**Handoff allocation:** World writes the content module after assignment; one named UI writer handles `CampaignScreen.tsx`; Project Lead alone edits `App.tsx` and coordinates validation. The ticket is specified now, not implemented or assigned by this report.

## Risks, dependencies and lead decisions

- **Persistence defect:** route medal-key isolation to lead/UX now. A namespaced format needs a compatibility plan: existing raw `campaign-map-N` keys are ambiguous, so do not blindly move or duplicate them into both record kinds. Preserve earned data and document unavoidable attribution uncertainty.
- **Rule ownership:** World must not solve narrative sameness by silently altering `SCENARIOS`, tide schedules, costs, growth thresholds or final conditions. Gameplay owns evidence and recommendations; lead assigns any shared-file writer.
- **Medal feasibility:** six growth stages have a fixed threshold across different fleet/economy sizes. Preserve existing earned medals; any future threshold change needs a separate product and compatibility decision, not copy tuning.
- **Promise accuracy:** do not call a map a whale puzzle, a starvation challenge or a two-strategy map until evidence supports that promise. A legal reference route is not a unique solution and lowest food is not an inherent difficulty score.
- **Continuity:** each new map starts a fresh town. Recurring voices carry the story; no inventory, residents, upgrades or damage transfer is promised. State-derived facts must win if content drifts out of date.
- **Clutter:** campaign cards already use small subtitle text (`campaign.css`, `.campaign-map small`); longer copy/medals require actual desktop inspection. Do not solve overflow by shrinking text further. Art motifs must not compete with shelter/current information.
- **Scope:** existing weather flavour, whale encounter, piano, growth visuals, replay and eight maps are foundations, not missing work. Mobile expansion, FPS benchmarks, new currencies, paid assets and extra campaign maps remain out of scope.
- **Decisions requested:** accept the fresh-town/news-through-the-shores narrative model; approve or edit WP-01's three strings; assign UI/App integration ownership; assign the medal-key compatibility issue; choose later-map pairs for human study before optional objectives proceed.

## Suggested human playtest questions

1. After First Light, what did the town need to survive, and what do you expect to be different on The Long Way Home? Separate rule recall from flavour recall.
2. Before advancing a storm tide, what will move, what will be sheltered afterward, and when can a stressed bell recover? Does the optional note help or distract?
3. After two same-fleet maps, what makes each shore memorable? What decision changed, beyond its title and scenery?
4. On maps 4–8, when did you choose an anchor, a tow, a new garden or a moving windbreak? Which choice felt forced, and what alternative did you consider?
5. Did a quiet tide feel like useful planning time, time to care for another shore, or waiting? Observe behaviour before suggesting a medal objective.
6. What would make you replay this map? Can you explain your saved best, the next medal requirement, and whether a failed replay would erase anything?
7. After an optional objective is shown, do you think it is required to unlock the next map? If so, the presentation fails regardless of completion rate.
8. After map 8, do you feel finished? Would you prefer to linger, replay a favourite, or try a smaller generated sea? Do not treat declining replay as a failure to enjoy a complete campaign.

## Milestone 0 delivery record

Delivered this report, a reusable focused audit script, and JSON evidence. No source/dependency/shared-roadmap changes; no branch, commit, push, deployment, browser or full baseline run.
Fresh checks: eight legal authored victories, matching forecasts, independent fresh openings, route action/resource/growth inventory, and reproduced campaign/free-voyage medal-key collision.
The first ticket is ready for lead assignment; other tickets are ordered proposals with explicit gates. This completed report is **not** a completed game improvement or human validation of the campaign.

## Implementation wave — 5 November 2026

The lead authorized WP-01/03 content, the campaign chart, WP-04 presentation and WP-06's UI portion. The implementation below supersedes the kickoff's source-read-only boundary for these assigned files only.

### Completed edits

- **WP-01/03 content:** added [campaignCopy.ts](../../src/content/campaignCopy.ts), with `CAMPAIGN_COPY` entries for all eight maps: `chartSubtitle`, `victoryCoda`, `lesson`, and outgoing `nextShoreHook` for maps 1–7. Every field is ≤110 characters. Map 8 has no further-map hook.
- **WP-01/03 chart integration:** [CampaignScreen.tsx](../../src/ui/CampaignScreen.tsx) uses the new subtitles for unlocked maps, retaining original subtitles as fallback. Locked maps retain their unlock requirement. Existing descriptors remain authoritative for titles, numbering and fleet counts.
- **Safe chart navigation:** an active, resumable, playing campaign map invokes `onResume`, visibly says Continue/tide, and has `aria-current="step"`. This also applies to an active replay after campaign completion. Other unlocked cards request `onMap(map.id)`; ended current maps request a fresh attempt rather than resuming from the card.
- **WP-04 presentation:** optional `achievements` records display the best medal/growth on unlocked cards. The first won map with a known rank below 3 gets one optional replay suggestion with the existing next threshold and gap above its best. Unknown/ambiguous records do not invent a best; rank 3 does not invent a higher tier.
- **WP-04 access:** optional `onViewMedals` supplies one “How medals work” callback below the chart after a victory. Medal text sits inside the card's accessible description, with no nested interactive controls or per-card popup.
- **WP-06 UI:** the free-voyage invitation states “One bell · seven islands · three actions per tide” and associates it with the existing button's accessible description. It calls the existing request callback without changing state itself.
- **Presentation:** [campaign.css](../../src/ui/campaign.css) adds compact action/medal/replay styles and increases chart subtitles from 9px to 11px. Cards wrap in equal minmax columns; existing modal scrolling remains available. Actual desktop fit is pending the lead/UX browser pass.
- **Regression coverage:** added [CampaignScreen.test.tsx](../../src/ui/CampaignScreen.test.tsx) for navigation dispatch, disabled locks, optional props, accessible description wiring, medal thresholds, no record mutation, and free/campaign record isolation.

### Exact integration contract for Project Lead

1. Existing required `CampaignScreen` props are unchanged. Add `achievements={achievements}` to display stored bests and `onViewMedals={() => setModal('medals')}` (or the lead's equivalent) for the common explanation. Both new props are optional; existing callers continue to compile.
2. Records are read only with `voyageRecordKey({ ...state, campaignMap: map.id })` and `Object.hasOwn`. The component never constructs raw campaign record keys or reads/writes localStorage. It works with the lead's new `campaign:`/`free:` namespaces and leaves retained legacy records unassigned.
3. Treat `onMap` and `onFreeVoyage` as requests. The parent must confirm replacement of an active voyage, preserve exact state/undo/checkpoint on cancel, and name the target. This component does not implement or claim that confirmation. Current-map Continue already bypasses replacement by using `onResume`.
4. Import `CAMPAIGN_COPY` into App. For a campaign win, use `CAMPAIGN_COPY[game.campaignMap]?.victoryCoda` as its short closing sentence while preserving factual victory/per-bell conditions. Loss, legacy and free-voyage copy remain on their existing paths. Map 8 keeps its explicit campaign-complete verdict; its coda can replace the existing Moon sentence, avoiding repetition.
5. For wins on maps 1–7, derive the next descriptor with `CAMPAIGN_MAPS[game.campaignMap]`; display the next number/title followed by the **current** map's `nextShoreHook`. Retain fleet-growth facts on pair transitions. On already-completed replays, prefer “Next shore” to announcing a newly earned unlock.
6. Keep `lesson` available as optional contextual copy; it is not rendered as another panel by this wave. No new learning prompt or dialogue gate is required.
7. App's winning result button still needs “Replay this map” instead of “Retry this map”; keep Retry for defeat. The chart's won-card label already says Replay. Generation summary work remains lead-owned.

### Targeted verification and limits

- Focused command: `npm.cmd test -- src/ui/CampaignScreen.test.tsx --maxWorkers=1`: **12 tests passed in 1 file**, including the collision-regression case against the lead's namespaced helper.
- Focused TypeScript check passed: `node node_modules/typescript/bin/tsc --noEmit --strict --jsx react-jsx --module ESNext --moduleResolution Bundler --target ES2022 --lib ES2022,DOM --skipLibCheck src/content/campaignCopy.ts src/ui/CampaignScreen.tsx src/ui/CampaignScreen.test.tsx`. This is not the production build.
- Direct module inspection confirmed exactly eight copy entries, seven next-shore hooks, no map-8 hook, and all string fields ≤110 characters. `git diff --check` passed for the assigned existing source files.
- Tests render React markup and invoke component callbacks; they verify dispatch/data/accessibility wiring, not browser layout, focus trapping, assistive-technology output or enjoyment.
- No full suite/build/browser, shared-file integration, persistence write, scenario/rule change, unproven optional objective, extra currency, commit, push or deployment was performed by this pillar.
- Lead/UX must inspect chart/result states at 1366×768 and 1920×1080, including thirteen-island progress, all medals, scroll access to actions, keyboard focus, cancel/replacement, reload and the map-8 ending. Human judgement remains pending.
- **Current handoff:** eight-map content and chart work are ready for lead integration. WP-01/03 outcome presentation, replacement confirmation, full WP-04 migration/result wording, WP-06 generation summaries and programme release gates are not claimed complete by this local slice.

### Integrated read-only review — 5 November 2026

The lead subsequently integrated App outcomes, navigation guards and namespaced medals. Reviewed current App, storage, achievements, chart and copy; no source changes or browser run. A read-only Node probe used valid in-memory session/storage fixtures (writes forbidden) for the first two findings.

1. **[P2] Same-seed URL can resume campaign instead of free play — `src/ui/storage.ts:81`.** With a valid saved map 3 and `?seed=campaign-3-0`, `initialSession()` returns campaign map 3 (nine islands), while `createGame('campaign-3-0')` produces the promised free voyage (seven islands). The seed-equality resume shortcut must also require that the saved state is free play; retain campaign completion/settings when constructing the explicit free voyage. This is an existing routing edge, exposed by reviewing the now-separated record modes.
2. **[P2] Missing attributed medal is reported as an unwon map — `src/App.tsx:456` (also fallback chips at 426/457).** A valid campaign with eight victories and a retained ambiguous `campaign-map-3` legacy medal has no `campaign:3` record after migration. On a map-3 replay the chart correctly marks it won, but the medal dialog says “This map: Not yet won.” Keep the legacy medal unassigned; use known campaign completion to say “Won · no attributed medal record,” or a neutral “No medal record,” rather than denying the victory. The fixture reproduced this exact distinction without changing storage.
3. **[P3] Replayed victories announce an unlock again — `src/App.tsx:470`.** Winning map 2 again after completing map 8 still announces “Map 3 unlocked” and fleet growth, although `recordCampaignWin` does not advance completion. Use “Next shore: Map 3 …” for already-completed routes (or neutrally for all wins), retaining the truthful next-map hook without suggesting repeated wins grant more progression.

No further concrete findings were identified in current-map Continue dispatch, explicit Restart routing, confirmed map/free-voyage replacement, fresh-town copy, or the deliberate preservation of ambiguous legacy medal data. This source review does not establish browser focus/layout behaviour or human comprehension.

**Final read-only recheck:** the lead addressed all three findings above. `storage.ts:81` now excludes campaign saves from same-seed resume; the matching-seed in-memory probe returned seven-island/three-action free play with campaign completion/settings preserved. The regression test was inspected, not rerun here. `App.tsx:109` uses “Victory recorded” consistently for chips, and `App.tsx:471` now says “Next shore.”

**One residual [P3] wording finding — `src/App.tsx:457`:** the completed-map/no-current-medal branch unconditionally says “earlier medal details are retained separately.” A valid session with completed maps and no medal-store entries has no retained details; campaign progress and medal storage are independent. Use “Victory recorded; no medal details are attributed to this map” (or equivalent), leaving the existing `oldMedals.length > 0` paragraph to make the evidence-backed retention claim. No other actionable finding in this bounded review; no source/browser changes.
