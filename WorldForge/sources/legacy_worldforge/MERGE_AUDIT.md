# WorldForge Merge Audit

## Incorporated into live code

- `js-priority-queue-master`: integrated as `js/worldforge-priority-queue.js` for ranked placement candidates, validation repair queues, and future route-hook expansion.
- `terrain-master`: adapted procedural terrain ideas into `js/worldforge-terrain.js` without external D3 dependency; used seeded randomness, noisy settlement boundaries, water features, terrain patches, and map masks.
- `TownBuilder-main`, `TownGeneratorOS-master`, `towngenerator-foundrymodule-main`, and `towngenerator-roll20-extension-main`: incorporated as browser-safe concepts for district roles, building footprints, town density, and exportable map presentation.
- `city2graph-main`, `stplanr-master`, `osmnx-main`, `busrouter-sg-main`, `transitland-processing-animation-master`: incorporated as concepts for route hooks, station placement, road/water adjacency, network-style validation, and transit-aware pin slots.
- `grider-master`: incorporated into the grid manifest/mask approach.
- Belavadös shared settlement package: incorporated live GeoJSON, world/province/settlement indexes, UTC/coordinate rules, and map assets.
- Belavadös lore JSON repository: copied into `json/lore_repository/` and indexed for future search/generation expansion.
- Onyx secondary DM package: only backend/knowledge integration concepts were retained; bot UI was not merged because this deliverable is map-specific.

## Audited but not embedded as runtime code

Large native, Unity, Python, R, PHP, Go, and framework-heavy projects were not shipped directly into the browser runtime because they would require build chains, servers, native engines, or unrelated app shells. Their readmes, licenses, and inventory entries were preserved under `docs/`.

## Player-safe map rule

The live map renders only physical geometry, categories, subcategories, terrain masks, pin IDs, and binding status. It suppresses business/location names and NPC details even when LifeSimulator location JSON is imported.
