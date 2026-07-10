# WorldForge Immersive 3D Globe Creator — Ocean & Continuous Terrain Correction

Open `index.html` through the included local server (`launch_worldforge.bat`, `launch_worldforge.sh`, or `python start_server.py`).

WorldForge merges the reusable globe creator with the corrected map, scanner, ocean-floor, and weather systems. This edition removes cross-world marker pollution, reconstructs gradual coast-to-summit topography, renders a separate visible ocean above the bathymetric floor, and builds geometry-based marine ecosystems.


## Critical corrections in this edition

- New worlds do **not** inherit bundled settlement pins, random point markers, or weather pins.
- Point overlays are hidden by default and cannot alter the terrain or intercept clicks while hidden.
- Surface art, height maps, bathymetry, and topography are fused with adaptive water classification and two-stage slope limiting.
- The ocean is a separate animated mesh driven by the compiled water mask.
- Marine creatures, reefs, kelp, vents, currents, and seabed structures render as scene geometry instead of circular markers.
- Standalone HTML exports retain corrected elevation and water-mask data.

See `docs/OCEAN_TERRAIN_CORRECTION.md` and `docs/OCEAN_TERRAIN_CORRECTION_VALIDATION.json`.

## Core controls

- Drag: orbit the globe or local environment.
- Right-drag or Shift-drag: pan.
- Mouse wheel: zoom from whole-world view into close inspection.
- WASD: travel through surface, settlement, ocean, and cavern scenes.
- Click: inspect terrain, features, residents, creatures, weather cells, and landmarks.
- Double-click: focus or enter a matching environment.
- **Center globe**: restore the correct centered camera.

## Source absorption

Drop files, complete folders, or ZIP repositories into the import area. WorldForge reads and classifies JSON, GeoJSON, images, SVG, DOCX, CSS, JavaScript, HTML, shaders, models, and nested project structures.

CSS variables and compatible control styling are scoped into imported modules. HTML controls, JavaScript DOM hooks, and JSON control schemas are mapped to native WorldForge capabilities. Foreign JavaScript is deliberately not executed blindly; it is interpreted so incompatible repositories cannot silently replace the locked backend or damage the host application.

## Topography-aware images

Large 2:1 or globe-named images are detected as equirectangular surface maps. They are sampled by the WebGL terrain shader at the same longitude and latitude coordinates used by elevation displacement, so mountains, trenches, coasts, routes, and clickable features remain aligned.

## Standalone outputs

- **Standalone globe HTML** embeds the renderer, world model, selected surface map, compressed height data, cave survey, weather model, marine ecosystem, controls, and active world features.
- **Standalone settlement HTML** embeds the selected settlement, local geology, structures, NPC information, ecosystem, and simulation controls.
- Exporters aim to remain below 24 MiB per HTML by downsampling and recompressing embedded imagery only when necessary.

## Locked backend

The only active backend endpoint is:

`https://script.google.com/macros/s/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/exec`

It is frozen in `js/backend-lock.js` and `config/backend_lock.json`. No runtime UI can replace it.

See `docs/IMMERSIVE_SYSTEMS.md`, `docs/SOURCE_ABSORPTION.md`, and `docs/STANDALONE_EXPORTS.md` for implementation details.
