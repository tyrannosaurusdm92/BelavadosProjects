# Classification Rules

The classifier uses path names, extensions, and content inspection.

## Recognized data families

- `surface-map`: world, globe, surface, realistic, earth, basemap, map imagery
- `height-map`: height, elevation, DEM, terrain, relief, altitude
- `depth-map`: depth, bathymetry, ocean floor, seafloor, trench, abyss
- `topography`: plates, crust, contours, ridges, faults, lithosphere
- `province-data`: province, region, territory, state, admin polygons
- `settlement-data`: settlement, capital, city, town, village, point pins
- `border-data`: borders, boundaries, line strings, province polygons
- `pin-data`: pins, markers, centers, labels, SVG marker assets
- `route-data`: rail, train, caravan, ferry, steamship, submarine, skyship, portal, ATA routes
- `weather-data`: weather, cloud, rain, storm, wind, pressure, snow, seasons
- `climate-data`: climate, biome, temperature, desert, forest, tundra, reef
- `time-data`: UTC, timezone, longitude, latitude, clock, calendar
- `npc-data`: NPCs, schedules, reactions, emoji behavior
- `lore-doc`: DOCX or text canon/instruction files
- `atmosphere-data`: troposphere, stratosphere, mesosphere, thermosphere, exosphere
- `shell-layer-data`: shell, mantle, core, continental crust, oceanic crust
- `celestial-data`: sun, moons, planets, constellations, comets, aurora, spirit lights
- `plant-life`: trees, plants, algae, seaweed, kelp, flora
- `sea-life`: fish, whales, sharks, seals, coral, marine life
- `reef-data`, `cave-data`, `volcano-data`
- `repo-source`, `license`, `documentation`

## Conflict resolution

Default rule: **specific + newer**. A file with more complete properties wins unless another file is both comparable and newer. All conflict decisions are preserved in the generated `conflicts` log.
