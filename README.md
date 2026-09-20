# The Unreasonable Archipelago
A tiny civilization. A rather unreasonable sea.

An eight-map single-player browser campaign about floating towns and botanical bells.
Start with seven islands and one bell. Every two victories add another bell, two islands,
and one action per tide, ending with thirteen islands and a four-bell choir.

**[Play in your browser](https://holsteredsoul.github.io/the-unreasonable-archipelago/)**

## Play locally
```sh
npm install
npm run dev
```
Open the local URL printed by Vite (normally http://localhost:5173).
Desktop Chrome or Edge with WebGL 2 is recommended; this stage is designed for a mouse and keyboard.
For a production build: `npm run build`, then `npm run preview`.
Use an HTTP server; opening index.html directly from disk is unsupported.

## Your objective
Nourish every bell three times. When tide 8 resolves, each must be connected to
the Heart through neighboring islands, sheltered from the final squall, and below
3 stress. Keep the Heart intact.
For an extra challenge, earn **Flourishing Shores** by developing six growth stages across your ordinary islands. Your final medal reflects how much of the archipelago flourishes.

Each tide gives you three actions in the opening maps and free voyages, increasing
to four, five, and six in later campaign pairs. Every action below spends one action:
- **Tow** an island one empty neighboring hex: 1 food.
- **Build** a garden, grove, or breakwater on an ordinary island: 3 timber.
- **Anchor** an island through one tide: 1 timber.
- **Nourish** an island's next growth stage: 2 food. It grows after a safe, fed tide.
- **Whale Tow**, on tides 2, 5, and 7: one action and no food. Accept one tow per visit, one hex in the whale's direction. Currents still apply afterward.

Whale Tow stays beside Tow in the action bar. Select an eligible island from the
whale card, then press **Whale Tow**; selecting alone costs nothing. Use it when
the whale's direction helps your plan to save the 1 food ordinary towing costs.
The island moves immediately, and the next tide can move it again unless anchored.
The whale card's help button explains the action and its unavailable states.

The Heart is rooted and cannot move. Gardens like open water. Groves like neighbors.
Breakwaters shield themselves and islands downstream. Calm tides permit growth everywhere.
Pay two food per tide; shortages damage the Heart. Nourishment waits until conditions allow growth.

The harbour changes after the opening: tide 5 pushes unanchored islands outward,
and tide 7 carries them together in a crosscurrent while the Heart stays rooted.
Spend timber to hold key islands, or ride the current and spend food reconnecting.
An ordinary island can be both a bridge and a windbreak. Anchors stop drift, not storms.
The optional **Tide chart** explains the later tides and this seed's final shelter direction.
The objective tracks each bell's shelter and stress after the next tide. **After-tide bell
checks** explains the four conditions and the windward shelter hex. On tide 8 it can
suggest a legal tow or breakwater that the actual simulator verifies will win.
An unsafe final advance opens a warning before committing; you can keep planning
or explicitly accept defeat.

Use the preview before committing: ghost islands show movements, arrows show currents,
and the tide panel shows the next weather and resource change. Undo only rewinds planning
actions in the current tide. Advance Tide commits the turn. First Light has one teaching
exception: after a final-tide defeat, **Replan the final tide** restores the actual start
of tide 8, including resources and actions. This checkpoint survives reload. Older
completed saves have no checkpoint and still need a fresh attempt.

Select islands directly in the world or use the island list. Tow targets are available as
both clickable water cells and buttons. Drag to orbit, scroll to zoom. Help and settings
explain keyboard controls and offer reduced motion and lower graphics quality.
Press **F** for Sea focus, **P** for the forecast, and **Escape** to restore panels.
The water shows drift arrows, storm shelter wakes, and the Heart connection chain.
Action feedback separates food spent now from the town's two rations at the tide.
Your best medal for each seed stays beside its name and in voyage settings.
The opening screen introduces the objective and charts all eight maps. Continue resumes
your saved tide; the compass opens the campaign chart at any time. A victory unlocks the
next map. Each map starts with a fresh town; retries preserve completed maps and medals.
Gold bell rings and a rising musical chord mark victory. Darker seas, a falling bell,
and explicit defeat text mark failure; the result lists every bell's missing condition.
Reduced motion replaces the cinematic with a quick transition to the result.

The game saves automatically in this browser. Localhost and the public site have separate
browser saves. Seed links recreate procedural free voyages, not campaign progress.
Settings include separate piano and effects volumes, a piano toggle, and master mute.
The original score starts after your first interaction and pauses when the page is hidden.

## Scope
The campaign contains eight authored, deterministic puzzles with verified winning routes.
Different maps change geography, currents, final winds, and food and shelter demands.
Procedural free voyages remain available from the opening screen or settings.
Mobile expansion is deferred. Broader device testing and human difficulty tuning remain
future work; a verified solution establishes solvability rather than enjoyment.
`first-light` keeps the authored introductory layout. Other seeds change island positions,
starting structures, and current patterns. Every generated opening is verified against the
real simulator with a complete winning route. Settings show the new sea's characteristics
before you set sail; existing saved voyages retain their original geometry and rules.
Saves made before the late-current update keep the original final objective. Restart
or begin a new voyage to play the revised tides; previously earned medals remain saved.

## Development
GitHub Actions runs the tests and builds the public site on each main-branch push.
`VITE_BASE_PATH=/the-unreasonable-archipelago/` sets the production repository path;
local development and ordinary builds use `/`. Models, favicon, and the audio worker
resolve under the configured base. Pages uses the GitHub Actions publishing source.

`npm test` verifies simulation and persistence.
`npm run build` type-checks and creates the static site in dist.

- src/game: pure deterministic simulation and tests.
- src/world: Three.js diorama, picking and animation.
- src/ui: interface utilities, saves and audio.
- src/App.tsx: interaction flow and HUD.
- assets/source/bell-flower.blend: editable original Blender asset.
- public/assets/bell-flower.glb: browser-ready bell model.
- scripts/create_bell.py: reproducible Blender modeling/export script.
- assets/source/whale.blend and public/assets/whale.glb: original animated whale and editable source.
- scripts/create_whale.py: reproducible whale model and animation.
- src/ui/music.ts and music.worker.ts: original adaptive piano and instrument synthesis.
- docs/verification.md: test evidence, browser playthroughs, and current limitations.
- docs/roadmap-whale.jpg: actual gameplay with the whale encounter.
- docs/late-voyage.jpg: the revised late-current chapter in the browser.
- docs/concept.png: visual target, generated concept art (not a gameplay screenshot).

No account, paid asset library, API key, backend, or runtime AI service is required.

