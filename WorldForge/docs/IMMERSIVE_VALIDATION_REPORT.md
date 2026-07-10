# WorldForge Immersive Validation Report

Generated: 2026-07-10 UTC

## Result

**PASS** — the merged WorldForge Immersive Globe Creator passed its application, data, backend-lock, deterministic simulation, and standalone-export checks.

## Verified systems

- Deterministic weather patterns across daily, weekly, monthly, seasonal, and annual simulation dates.
- Living marine ecosystem with 1,580 generated ecosystem objects distributed across reef, shelf, slope, abyss, and trench zones.
- Clickable cave and cavern survey stations connected to the explorable subterranean scene.
- Deterministic volcanic activity cycles, eruption state, plume height, and lava-flow calculations.
- Surface-image UV projection onto the same displaced globe geometry used for terrain and bathymetry.
- Safe repository-source absorption for CSS, controls, JavaScript hooks, JSON, GeoJSON, shaders, textures, SVGs, and model references.
- Drag orbit, right-drag/Shift-drag pan, scroll-wheel zoom, WASD movement, click inspection, double-click focusing, and Center Globe camera reset.
- Single locked Google Apps Script backend and matching SHA-256 lock checksum.
- Standalone WebGL globe module graph compiles inside a single HTML export.
- Standalone globe output remains below the 24 MiB target before user-provided high-resolution imagery is embedded.

## Locked backend

`https://script.google.com/macros/s/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/exec`

SHA-256: `9d8abb3ef8ebb347b320497ebbe202a178020d3889364e38f029885c9aa25e5a`

## Test commands

```bash
node scripts/validate.mjs
node --experimental-vm-modules scripts/validate_immersive.mjs
```

## Environment note

The container could not initialize EGL/ANGLE for a headless Chromium WebGL screenshot. Static JavaScript parsing, module-graph compilation, data validation, backend-lock verification, standalone-export execution under a mocked browser runtime, and ZIP-integrity testing were completed successfully.
