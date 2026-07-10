# Immersive Systems

## Cave and cavern exploration

Cave JSON with station coordinates is converted to a continuous radial tunnel mesh. Survey stations become clickable chamber objects. The camera supports orbit, pan, wheel zoom, WASD movement, object focus, and a center/reset action. Imported cave datasets replace the demonstration survey.

## Volcano activity

Volcano activity is deterministic for a named feature and simulated date. Each volcano receives a stable cycle length, phase, activity value, plume estimate, and lava-flow estimate. Active phases enable animated eruption particles; clicking a volcano exposes its current state.

## Predictable weather

`PatternedWeatherSystem` combines latitude, water proximity, mountain context, day of year, week, month, annual season, deterministic pressure variation, and stable per-location seeds. The same date and location generate the same result. Daily, weekly, monthly, and annual views use the same calendar model rather than unrelated random values.

## Marine ecosystem

Underwater scenes occupy the water column above the displaced seabed. Life is distributed into reef, continental shelf, continental slope, abyssal, and trench zones. Objects include mobile animals, schools, producers, corals, kelp, and vent ecosystems. Each object carries zone, trophic level, depth band, current affinity, and plate-context metadata and is clickable.

## Settlements

Settlement generation combines globe coordinates, up to three biomes, canonical elevation/depth rules, weather, transportation, structures, NPC files, and local water/cavern/floating context. The settlement exporter embeds the selected result into one HTML file.
