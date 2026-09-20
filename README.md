# The Unreasonable Archipelago
A tiny civilization. A rather unreasonable sea.

This first playable chapter, **The First Bell**, is a complete single-player browser game:
seven drifting islands, eight tides, one botanical bell to grow and bring home.

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
Nourish the Sleeping Bell three times, then keep it connected to the Heart through
neighboring islands when the eighth tide resolves. Keep the Heart intact.
For an extra challenge, earn **Flourishing Shores** by developing six growth stages across your ordinary islands. Your final medal reflects how much of the archipelago flourishes.

Each tide gives you three actions:
- **Tow** an island one empty neighboring hex: 1 food.
- **Build** a garden, grove, or breakwater on an ordinary island: 3 timber.
- **Anchor** an island through one tide: 1 timber.
- **Nourish** an island's next growth stage: 2 food. It grows after a safe, fed tide.
- **Whale Tow**, on tides 2, 5, and 7: one action and no food. Accept one tow per visit, one hex in the whale's direction. Currents still apply afterward.

The Heart is rooted and cannot move. Gardens like open water. Groves like neighbors.
Breakwaters shield themselves and islands downstream. Calm tides permit growth everywhere.
Pay two food per tide; shortages damage the Heart. Nourishment waits until conditions allow growth.

Use the preview before committing: ghost islands show movements, arrows show currents,
and the tide panel shows the next weather and resource change. Undo only rewinds planning
actions in the current tide. Advance Tide commits the turn.

Select islands directly in the world or use the island list. Tow targets are available as
both clickable water cells and buttons. Drag to orbit, scroll to zoom. Help and settings
explain keyboard controls and offer reduced motion and lower graphics quality.
Press **F** for Sea focus, **P** for the forecast, and **Escape** to restore panels.
The water shows drift arrows, storm shelter wakes, and the Heart connection chain.
Action feedback separates food spent now from the town's two rations at the tide.
Your best medal for each seed stays beside its name and in voyage settings.
The game saves automatically in this browser. Seed links recreate an opening, not a saved voyage.
Settings include separate piano and effects volumes, a piano toggle, and master mute.
The original score starts after your first interaction and pauses when the page is hidden.

## Scope
This chapter demonstrates the core rules, procedural scenery and growth, forecast currents,
local persistence, accessible controls, audio, and a complete win/loss flow.
The 13-island campaign, three-bell chorus, expanded hazards and phone layouts belong to later stages.
`first-light` keeps the authored introductory layout. Other seeds change island positions,
starting structures, and current patterns. Every generated opening is verified against the
real simulator with a complete winning route. Settings show the new sea's characteristics
before you set sail; existing saved voyages retain their original geometry.

## Development
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
- docs/concept.png: visual target, generated concept art (not a gameplay screenshot).

No account, paid asset library, API key, backend, or runtime AI service is required.

