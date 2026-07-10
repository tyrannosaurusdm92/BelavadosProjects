# Architecture

## Pipeline

1. **File Intake** (`app.js`, `zip-reader.js`)
   - Reads direct files, dropped folders, and ZIP archives.
   - Supports nested ZIPs to a safe depth.
   - Preserves useful relative paths.

2. **Parsing** (`docx-reader.js`, `app.js`)
   - DOCX files are unpacked as ZIPs and `word/document.xml` is converted to readable canon text.
   - JSON and GeoJSON are parsed into structured objects.
   - Images become object URLs for preview and globe texture use.

3. **Classification** (`classifier.js`)
   - Combines filename, folder path, extension, JSON keys, GeoJSON geometry, and DOCX/text content.
   - Tags surface maps, height maps, depth maps, province data, settlement pins, borders, routes, weather, climate, NPCs, lore, shell, atmosphere, celestial data, plant life, sea life, caves, volcanoes, reefs, source repositories, docs, and licenses.

4. **World Model Assembly** (`world-model.js`)
   - Extracts coordinate-bearing features from GeoJSON and JSON.
   - Resolves conflicts by specific/newer source priority.
   - Generates missing province centers from polygon centroids.
   - Generates default UTC time zones, longitude labels, latitude labels, atmospheric layers, and shell layers.

5. **Rendering** (`viewer/globe-engine.js`)
   - Uses raw WebGL for the globe mesh and surface texture.
   - Uses a canvas overlay for clickable pins, labels, borders, route arcs, grid lines, atmosphere shells, shell cross sections, weather zones, terrain, plants, sea life, and celestial objects.

6. **Export** (`exporter.js`, `zip-writer.js`)
   - Writes a standalone browser package with the generated data model, viewer, selected assets, build docs, backend config, and source manifest.

## Why dependency-free?

The app includes a ZIP reader/writer, DOCX reader, classifier, world-model assembler, renderer, and exporter directly. This makes the creator more resilient when opened from a local folder or when CDN/npm access is unavailable.
