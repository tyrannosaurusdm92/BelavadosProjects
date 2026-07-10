# Validation notes

The package was checked with:

- JavaScript syntax validation for every file in `js/` using Node.js `--check`.
- A headless numerical smoke test that instantiated all non-DOM model classes, generated a procedural Earth-sized world, calculated global fields, produced all four forecast windows, assimilated sample weather observations, and exported a sampled GeoJSON snapshot.
- ZIP integrity testing after packaging.

A GPU-backed visual screenshot could not be captured in the build container because its Chromium installation could not initialize EGL/WebGL. The application handles unavailable WebGL by displaying an explicit startup error. It is intended for current Chrome, Edge, Firefox, or Safari on hardware with WebGL enabled.
