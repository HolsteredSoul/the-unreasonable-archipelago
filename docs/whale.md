# The courteous whale

An original low-poly humpback-inspired asset made for this project, with no downloaded models, textures, or third-party animation. Its broad head, long curved flippers, small dorsal fin, visible eyes and horizontal split flukes are designed to read from the game's overhead camera. Seven throat pleats detail the pale underside.

- Browser asset: `public/assets/whale.glb` — **207,548 bytes**, **3,290 triangles**.
- Editable source: `assets/source/whale.blend`.
- Reproducible generator: `scripts/create_whale.py`.
- Runtime orientation: **+Y up, nose facing +Z**.
- Rest bounds: X −2.226 to 2.226; Y −0.692 to 0.980; Z −3.280 to 2.904.
- Approximate size: **4.451 wide × 1.672 high × 6.184 long**. Scale the parent group to the desired sea encounter size.
- Animation: **`GentleSwim`**, a seamless **4-second** loop, rotating the named object nodes `TailPivot`, `FlipperLeft`, and `FlipperRight`. Use a normal Three.js `AnimationMixer` and pause it when reduced motion is enabled.

The GLB contains only the whale's scene and asset nodes. Studio lights and camera remain in the editable source but are excluded from the export. The script creates a separate scene and never deletes existing scenes. It was run in an isolated background Blender instance so the user's open Blender scenes remained untouched.

Regenerate with Blender 5.2:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup -t 2 --python scripts/create_whale.py
```

This also renders isometric and overhead previews to the ignored `output/playwright/` folder. Historical September 2026 verification: both views were visually inspected, and the exported asset was loaded with the project's actual Three.js `GLTFLoader`; its bounds, sole scene, four-second animation and movement of all three animated nodes were verified. Blender MCP was unavailable during that pass, so verification used Blender renders rather than a live viewport screenshot.

On 5 November 2026 the unchanged runtime GLB was parsed again with the installed
`GLTFLoader`: 3,290 triangles, size 4.4512 × 1.6716 × 6.1839, and the four-second
`GentleSwim` clip were confirmed. This was a static metadata check, not a new
animation audition or rendered signoff. SHA-256 and source/dependency provenance
are recorded in the [asset inventory](assets.md) and [manifest](../assets/manifest.json).
