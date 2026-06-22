# Source Audit and Merge Notes

This project was created from the uploaded repository bundle as a new standalone browser application. The original repositories mix desktop Delphi, macOS Objective-C, Qt/QML/C++, Angular/MapLibre, Leaflet, and Java shapefile code. Those stacks are not directly compatible, so the final deliverable uses a clean vanilla HTML/CSS/JavaScript canvas implementation that keeps the requested features in one browser app.

## Uploaded sources reviewed

| Source zip | Useful ideas retained | Runtime merge decision |
| --- | --- | --- |
| `mspaint-rewritten-main.zip` | Windows Paint-style tool palette, selection/cut/copy/paste, shape tools, zoom, image operations. | Reimplemented as browser canvas tools. MIT license preserved in `docs/licenses`. |
| `Paintbrush-master.zip` | Classic Paintbrush tool list: brush, eraser, eyedropper, fill, text, rectangle, ellipse, selection, zoom. | Reimplemented from scratch to avoid shipping macOS-specific/GPL Objective-C runtime code. GPL text preserved for audit. |
| `Paint3D-master.zip` | Shape-panel concept, 2D/3D paint organization, Qt/QML panel architecture. | Reimplemented as browser controls. README preserved. |
| `Paint3DArchive-main.zip` | Archival Paint 3D documentation. | Not used as runtime code. README preserved for traceability. |
| `db-simple-geom-editor-master.zip` | Simple geometry editor flow and GeoJSON output concept. | Reimplemented as canvas/SVG pixel overlay anchors rather than Leaflet map coordinates. MIT license preserved. |
| `geojson-creator-tool-main.zip` | GeoJSON create/edit/upload/download workflow, shape modes, MapLibre/Turf concept. | Reimplemented as dependency-free GeoJSON import/export and draggable SVG anchors. Maki icon CC0 license preserved because it was present in source assets. |
| `shapefile-creator-main.zip` | GeoJSON schema/geometry validation ideas and shapefile export reference. | Not used at runtime. Browser build exports GeoJSON; Java shapefile conversion documented as future server/CLI add-on. Apache license preserved. |

## Why the final app is dependency-free

The requested tool needs to run like an image editor, not as a multi-framework development environment. A browser-native canvas/SVG implementation lets the final app:

- open by double-clicking `index.html`,
- preserve real transparency,
- edit uploaded raster/vector image renders,
- export files immediately,
- save to browser storage,
- avoid Angular/Qt/Delphi/Java build chains.

## License handling

The final runtime code in `index.html`, `css/styles.css`, and `js/app.js` is newly written for this merged project. Upstream license/readme files are preserved in `docs/` for attribution and future audit. No upstream binary application archives or platform-specific build products are required by the final runtime.
