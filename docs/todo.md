# Evaluation and improvement roadmap

Priorities reflect their effect on comprehension, spatial play, and the value of a second voyage.

## Checkpoint: spatial planning and resource clarity — complete

The first four items below are implemented: anchored cost feedback, on-water planning layers, sea-focus panels, and persistent medals. Verified with 31 automated checks and a complete eight-tide browser victory, including keyboard action feedback, undo, refresh, and medal retention. Generation, the whale encounter, and piano are the next integration checkpoint.

## P0 — Teach the two-food problem in place

**Evaluation:** This is the first likely rules misunderstanding. Nourish spends 2 food immediately; town rations consume another 2 food only when the tide resolves. The matching numbers make two different timings look like one rule.

- On the first pointer or keyboard use of each action during tides 1–3, show a short callout anchored to the initiating control. Do not block play.
- Use explicit copy such as `Nourish −2 food · queues growth for the next safe tide` and `Advance tide −2 food · town rations`.
- Mirror the relevant line on the action buttons and the **After the tide** strip.
- Show the exact immediate balance change and the forecasted end-of-tide balance.
- Give keyboard and screen-reader players the same information through the focused control and live announcement.
- Explain Tow (`−1 food`), Build (`−3 timber`), and Anchor (`−1 timber`) in the same visual language.

## P0 — Put the puzzle on the water

**Evaluation:** The simulation is spatial, but most of its useful information currently lives in prose and corner panels. Existing current marks and connection lines are too subtle to carry planning by themselves.

- Make each island’s forecasted current an obvious directional arrow with motion and blocked-drift states.
- Draw storm shelter as directional cones or wakes, including the reach of breakwaters.
- Draw the full Heart-connection chain in a distinct, readable style; clearly show the missing link when the bell is disconnected.
- In preview mode, show origin, destination, stress change, production change, and possible growth directly around affected islands.
- Let players inspect these layers from the sea without opening the island list.
- Test the view at 1366×768 and ensure the marks remain readable behind the HUD.

## P1 — Add a sea-focus layout

**Evaluation:** The HUD is attractive but occupies too much of the frame. At 1366×768 the diorama becomes a small window between four dense corners, which encourages label hunting instead of spatial planning.

- Add one persistent **Sea focus** control that collapses the objective stack, island list, selected-island panel, and weather card into thin edge chips.
- Keep resources, tide, actions, and the advance control readable while focused.
- Allow a chip, keyboard command, or Escape to restore the full panel, with focus returned sensibly.
- Use the same responsive pattern later for phone layouts.
- Preserve reduced-motion and accessibility behavior in both layouts.

## P1 — Persist achievement and invite another voyage

**Evaluation:** A seed alone gives little reason to replay. The end medal provides a compact personal target and should survive the result screen.

- Persist the best medal earned: **Safe harbour**, **Thriving town**, or **Unreasonably splendid**.
- Display it beside the current seed and in the voyage settings.
- Track the best result per seed and the best overall result without allowing a lower result to overwrite it.
- Make the medal selectable so it explains the required Flourishing Shores thresholds.

## P1 — Make seeds change the puzzle

**Evaluation:** Opening geometry is fixed. Seeds currently shuffle names, scenery, and the weather offset, so replaying after a solved `first-light` run mostly changes flavour.

- Keep `first-light` as the authored introductory puzzle and reference solution.
- For other seeds, generate different legal opening positions, initial structures, and selected current patterns.
- Guarantee a playable route through deterministic generation checks rather than assuming every random layout is solvable.
- Add seeded solution or reachability tests for generated openings.
- Surface the meaningful seed differences before a player starts a second voyage.

## P1 — Give the whale a job

**Evaluation:** The current procedural silhouette is difficult to read as a whale and has no mechanical effect. A decorative whale weakens the promise that this unreasonable sea does things.

- Replace it with a recognizable low-poly Blender whale with a clear tail, dorsal fin, flippers, eye, and readable profile at game-camera distance.
- Export it as an animated browser-ready `.glb` beside the bell asset, retaining a procedural fallback.
- Turn it into a forecasted encounter: announce where it will surface and which island it can tow.
- Add an optional **Whale Tow** decision that moves one eligible island one hex in the whale’s travel direction.
- Give the tow a real tradeoff, such as one action or a temporary change to the local current.
- Preview the destination on the water and support undo, save, replay, accessibility, and deterministic seed behavior.
- Playtest whether the encounter creates rescue routes without replacing ordinary Tow and Anchor decisions.

## P2 — Add an adaptive piano score

**Evaluation:** The quiet diorama would benefit from a restrained musical identity. The score should add warmth and mild unease without masking action feedback or becoming repetitive across eight tides.

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
