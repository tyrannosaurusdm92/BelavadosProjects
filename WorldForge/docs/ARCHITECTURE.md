# WorldForge Architecture

## Rendering

WorldForge uses a dependency-free WebGL2 renderer. A geological grid stores longitude, latitude, elevation, and biome color. The same mesh is projected as either an elevation-displaced globe or an equirectangular flat 3D surface.

Local scenes use high-resolution terrain meshes generated around the selected globe coordinate. Settlement scenes add a separate triangle mesh for structures and point meshes for NPCs, wildlife, weather cells, landmarks, and eruption particles. Object positions remain available to the menu and click-focus system while they move.

## Geological priority

1. Imported heightmap or elevation grid.
2. Imported GeoJSON/JSON feature constraints.
3. Canonical settlement height/depth and biome records.
4. Procedural geological infill.

This order prevents procedural fallback terrain from replacing explicit imported observations.

## Environment selection

Settlement environment is derived from canonical `anchorMode`, `pinPlacement`, biome names, and terrain role:

- surface;
- floating ocean surface;
- underwater;
- cave/deep cavern.

The scene generator then applies the settlement's primary, secondary, and tertiary biomes, local water status, NPC file, climate, weather, transit hubs, and major province landforms.

## Simulation

`WorldSimulation` advances a deterministic simulated clock and generates weather snapshots at daily, weekly, monthly, and annual horizons. World weather markers drift across the globe. Local weather cells, marine life, and trackable objects move according to the selected simulation speed.

## Backend

`backend-lock.js` owns the only active Apps Script endpoint. The object and global property are frozen/non-writable at runtime. Sync calls use `text/plain` JSON payloads to remain compatible with common Apps Script web-app deployments.

## Imports

JSON, GeoJSON, images, ZIP, and DOCX are processed in the browser. DOCX files are read as ZIP containers; text and embedded geological JSON blocks can be discovered without uploading the file to another service.
