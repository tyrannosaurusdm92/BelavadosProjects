# Repository and Source Absorption

WorldForge accepts individual files, directory uploads, and nested ZIP files.

The absorber recognizes:

- CSS variables and compatible rules for buttons, menus, modules, sliders, panels, cards, and toggles.
- HTML buttons, inputs, ranges, and selects.
- JavaScript `getElementById`, `querySelector`, event hooks, configuration objects, and capability keywords.
- JSON schemas for controls, tracking, weather, caves, volcanoes, marine life, settlements, routes, and topography.
- GeoJSON points, lines, polygons, routes, borders, pins, and feature metadata.
- Images, textures, SVG, shaders, and 3D model references.

Controls are mapped to native capabilities such as centering, rotation, water, atmosphere, feature visibility, life, eruption, weather, caves, oceans, settlements, terrain exaggeration, and time speed. This best-of merge avoids duplicate controls and does not directly execute arbitrary uploaded repository JavaScript.
