# Next development passes

## Whale asset and towing encounter

- Replace the current procedural whale silhouette with a recognizable, low-poly Blender whale. Give it a clear tail, dorsal fin, flippers, eye, and readable side profile at the game's camera distance.
- Export the authored whale as a browser-ready `.glb` beside the bell asset, with a simple swimming or tail-motion animation and a fallback procedural shape.
- Turn the whale into an occasional forecasted encounter: the tide panel should announce where it will surface and which island it can tow.
- Add a deliberate **Whale Tow** decision that moves one eligible island one hex in the whale's travel direction, with a meaningful tradeoff such as spending an action or accepting a temporary current change.
- Keep the whale encounter optional and legible: preview it before committing, show the destination on the map, and include it in undo, save, replay, and deterministic seed behavior.
- Playtest whether whale towing creates interesting rescue routes without replacing the player's own Tow and Anchor decisions.

## Resource feedback and onboarding

- Add a first-tide resource tutorial that makes the economy visible before the player commits an action: the town consumes 2 food at the end of every tide, while Nourish costs 2 food immediately, Tow costs 1 food, Build costs 3 timber, and Anchor costs 1 timber.
- When an action is initiated with the pointer, show a small anchored callout at the click origin (or the selected action control when using keyboard) with the exact cost, the immediate balance change, and the next-tide consequence.
- Keep the callout short and readable: for example, `Nourish −2 food · queues growth for the next safe tide` and `Advance tide −2 food · town rations`.
- Show the same information in the action buttons and forecast panel so mouse, keyboard, and screen-reader flows explain the same economy.
- Make the first three tides explicitly teach the difference between an immediate spend and an end-of-tide consumption, without interrupting the planning flow.
