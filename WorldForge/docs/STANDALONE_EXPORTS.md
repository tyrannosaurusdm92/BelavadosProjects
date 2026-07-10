# Standalone HTML Export Architecture

The exporter reads the production WebGL renderer and simulation modules, embeds their source text, and reconstructs an internal module graph with browser Blob module URLs. No external JavaScript, CSS, or JSON files are required after export.

Embedded data can include:

- World parameters and clickable features
- GeoJSON-derived line geometry
- Daily/weekly/monthly/annual weather systems
- Cave survey stations
- Active settlement and NPC data
- Biome profile and current focus coordinates
- Downsampled normalized height data
- Surface imagery encoded as a data URL
- Marine, volcanic, and exploration systems

The 24 MiB target is enforced primarily by limiting height-grid resolution and adaptively recompressing the selected surface image. The application itself keeps original resources and source references outside standalone exports.
