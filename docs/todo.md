# Evaluation and improvement roadmap

Priorities reflect their effect on comprehension, spatial play, and the value of a second voyage.

## Gameplay depth follow-up — implemented

Whale Tow clarity follow-up: the action now stays beside ordinary Tow in the main dock with **1 action · 0 food** visible even before a visit. The encounter card explains unavailability, names the next visit, and lets players select an eligible island without spending anything. The map shows only that selected island's tow destination. An optional guide explains when the tow helps and why the following current can move the island again. Action feedback shows the action count falling while food remains unchanged.

The original inner ring let a grown bell coast through the rest of the voyage. New voyages now have an outward surge on tide 5 and a fleet-wide crosscurrent on tide 7. The final bell must be mature, connected, sheltered, and below 3 stress. Existing actions and resources supply the responses: hold a harbour with anchors, ride the current and tow home, or move an ordinary island into a bridge and windbreak.

- Keep the introductory geometry and a command-only reference route; preserve the rules of existing saves.
- Telegraph the late currents through the optional tide chart and weather descriptions. Put exact final safety on the bell and the after-tide strip.
- Verify alternative strategies and generated winning routes, rather than adding mandatory actions to every tide.
- Check save/undo, failure/retry, and both desktop layouts with actual browser controls.

This is a deliberately forgiving first chapter: a player who lets the introductory bell drift can still rescue it with one well-placed final tow. Higher medals compete for the spare actions. More demanding chapters should follow observation of real first-time play, rather than assuming that solvable routes establish fun.

## Eight-map campaign and presentation — September 2026

- Implemented: opening splash and campaign chart, resumable local save, sequential map unlocks, replay without losing victories, and eight distinct deterministic maps.
- Implemented: an extra bell and two islands after maps 2, 4, and 6, with one extra action per tide. The final pair has four bells, thirteen islands, and six actions.
- Implemented: map-specific food and construction pressure, different currents and final winds, and legal eight-tide winning routes for every map. Leaving the fleet unattended or neglecting an added bell loses.
- Implemented: unambiguous victory/defeat cinematics, separate musical stingers, meaningful result text, and a per-bell explanation of missing conditions. Reduced motion and master mute remain supported.
- Implemented: all-bell connection paths, separated map labels and larger-fleet framing. Whale direction remains a forecastable constraint; its existing tail, flippers, spray, and tow response remain animated.
- Publishing: GitHub Pages with automated tests and deployment from main. See verification.md for release evidence.
- Explicitly deferred at the user's request: phone/mobile expansion.

## Next evaluation

- Completed after clutter feedback: automatic compact layout on smaller windows,
  a single edge row for optional panels, one detailed selected-island label, small
  growth/stress markers, and a shorter action dock that preserves resource costs.
  Full view remains available; keyboard focus and final-tide checks are retained.
- FPS benchmarking deferred at the user's request. Evaluate visual clarity and
  decision-making with human play before adding more persistent overlays.

- Completed after weather-comprehension feedback: directional animated storm bands,
  shore impacts, breakwater interception, exact safe cells, and calm recovery.
  Tide resolution now shows drift, weather effects, and harvest in order, with
  per-island stress/production/growth events, a skip control, and reduced motion.
- Completed: unspent breakwater previews on the actual post-drift geometry, including
  protected islands, replacement production and resource cost. Build choices move
  to the edge; selected exposed bells show the missing windbreak cell in Forecast.
- Evaluate whether these visible causes and effects teach shelter without opening
  a guide, and whether the skippable tide sequence has the right pace over a campaign.
- Completed after first-player defeat feedback: persistent per-bell shelter/stress,
  an optional four-condition checklist with exact shelter direction, a warning before
  a losing final advance, and simulator-verified one-action rescue suggestions.
  Suggested tow destinations/buildings stay highlighted on their actual controls.
- Completed: First Light final-tide replanning from a saved, genuine start-of-tide
  checkpoint. Later maps keep normal retries; older completed saves are not rewritten.
- Continue observing whether shelter recovery (one stress removed per tide) is learned
  early enough. A one-action hint is offered only when it wins the whole voyage;
  harder positions may need earlier planning or a fresh attempt.

1. Observe campaign play: retry choices, food pressure, and whether maps 4–8 create interesting choices rather than repetitive anchoring.
2. Tune difficulty from human play while preserving solvable openings and multiple approaches. Automated witnesses prove a route, not fun or the only good strategy.
3. Wider desktop/audio/accessibility testing and any additional hazards come after this campaign release.

## Roadmap implementation — complete

All seven items below are implemented. The first checkpoint delivered resource feedback, on-water planning, sea focus, and saved medals. The second adds verified generated openings, the animated Blender whale with its optional tow, and an original adaptive piano score. See `verification.md` for automated and browser evidence. Player judgement of repeated-run enjoyment and musical fatigue remains a human playtest question, not an automated-test claim.

## P0 — Teach the two-food problem in place

**Original evaluation:** This is the first likely rules misunderstanding. Nourish spends 2 food immediately; town rations consume another 2 food only when the tide resolves. The matching numbers make two different timings look like one rule.

- On the first pointer or keyboard use of each action during tides 1–3, show a short callout anchored to the initiating control. Do not block play.
- Use explicit copy such as `Nourish −2 food · queues growth for the next safe tide` and `Advance tide −2 food · town rations`.
- Mirror the relevant line on the action buttons and the **After the tide** strip.
- Show the exact immediate balance change and the forecasted end-of-tide balance.
- Give keyboard and screen-reader players the same information through the focused control and live announcement.
- Explain Tow (`−1 food`), Build (`−3 timber`), and Anchor (`−1 timber`) in the same visual language.

## P0 — Put the puzzle on the water

**Original evaluation:** The simulation is spatial, but most of its useful information currently lives in prose and corner panels. Existing current marks and connection lines are too subtle to carry planning by themselves.

- Make each island’s forecasted current an obvious directional arrow with motion and blocked-drift states.
- Draw storm shelter as directional cones or wakes, including the reach of breakwaters.
- Draw the full Heart-connection chain in a distinct, readable style; clearly show the missing link when the bell is disconnected.
- In preview mode, show origin, destination, stress change, production change, and possible growth directly around affected islands.
- Let players inspect these layers from the sea without opening the island list.
- Test the view at 1366×768 and ensure the marks remain readable behind the HUD.

## P1 — Add a sea-focus layout

**Original evaluation:** The HUD is attractive but occupies too much of the frame. At 1366×768 the diorama becomes a small window between four dense corners, which encourages label hunting instead of spatial planning.

- Add one persistent **Sea focus** control that collapses the objective stack, island list, selected-island panel, and weather card into thin edge chips.
- Keep resources, tide, actions, and the advance control readable while focused.
- Allow a chip, keyboard command, or Escape to restore the full panel, with focus returned sensibly.
- Use the same responsive pattern later for phone layouts.
- Preserve reduced-motion and accessibility behavior in both layouts.

## P1 — Persist achievement and invite another voyage

**Original evaluation:** A seed alone gives little reason to replay. The end medal provides a compact personal target and should survive the result screen.

- Persist the best medal earned: **Safe harbour**, **Thriving town**, or **Unreasonably splendid**.
- Display it beside the current seed and in the voyage settings.
- Track the best result per seed and the best overall result without allowing a lower result to overwrite it.
- Make the medal selectable so it explains the required Flourishing Shores thresholds.

## P1 — Make seeds change the puzzle

**Original evaluation:** Opening geometry is fixed. Seeds currently shuffle names, scenery, and the weather offset, so replaying after a solved `first-light` run mostly changes flavour.

- Keep `first-light` as the authored introductory puzzle and reference solution.
- For other seeds, generate different legal opening positions, initial structures, and selected current patterns.
- Guarantee a playable route through deterministic generation checks rather than assuming every random layout is solvable.
- Add seeded solution or reachability tests for generated openings.
- Surface the meaningful seed differences before a player starts a second voyage.

## P1 — Give the whale a job

**Original evaluation:** The current procedural silhouette is difficult to read as a whale and has no mechanical effect. A decorative whale weakens the promise that this unreasonable sea does things.

- Replace it with a recognizable low-poly Blender whale with a clear tail, dorsal fin, flippers, eye, and readable profile at game-camera distance.
- Export it as an animated browser-ready `.glb` beside the bell asset, retaining a procedural fallback.
- Turn it into a forecasted encounter: announce where it will surface and which island it can tow.
- Add an optional **Whale Tow** decision that moves one eligible island one hex in the whale’s travel direction.
- Give the tow a real tradeoff, such as one action or a temporary change to the local current.
- Preview the destination on the water and support undo, save, replay, accessibility, and deterministic seed behavior.
- Playtest whether the encounter creates rescue routes without replacing ordinary Tow and Anchor decisions.

## P2 — Add an adaptive piano score

**Original evaluation:** The quiet diorama would benefit from a restrained musical identity. The score should add warmth and mild unease without masking action feedback or becoming repetitive across eight tides.

- Compose or commission an original, fully licensed solo-piano score with an off-kilter but inviting theme.
- Use a small set of seamless layers or variations that respond to calm tides, storms, a disconnected bell, and the final tide.
- Keep action chimes and important warnings intelligible above the music; use gentle ducking during result moments.
- Add separate music and effects volume controls, plus mute, and persist those preferences locally.
- Start audio only after user interaction to satisfy browser autoplay rules and avoid a blocking prompt.
- Crossfade cleanly between variations and suspend playback when the page is hidden.
- Test a full eight-tide session for repetition, fatigue, and performance on integrated graphics.
## Evaluation order

1. Resource comprehension during tides 1–3.
2. Spatial forecast, shelter, and connection readability on the water.
3. Sea-focus HUD at 1366×768.
4. Medal persistence and second-voyage motivation.
5. Generated opening geometry and solvability.
6. Whale asset and Whale Tow encounter.
7. Adaptive piano score and audio mix.
