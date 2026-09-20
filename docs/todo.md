# Next development passes

## Whale asset and towing encounter

- Replace the current procedural whale silhouette with a recognizable, low-poly Blender whale. Give it a clear tail, dorsal fin, flippers, eye, and readable side profile at the game's camera distance.
- Export the authored whale as a browser-ready `.glb` beside the bell asset, with a simple swimming or tail-motion animation and a fallback procedural shape.
- Turn the whale into an occasional forecasted encounter: the tide panel should announce where it will surface and which island it can tow.
- Add a deliberate **Whale Tow** decision that moves one eligible island one hex in the whale's travel direction, with a meaningful tradeoff such as spending an action or accepting a temporary current change.
- Keep the whale encounter optional and legible: preview it before committing, show the destination on the map, and include it in undo, save, replay, and deterministic seed behavior.
- Playtest whether whale towing creates interesting rescue routes without replacing the player's own Tow and Anchor decisions.
