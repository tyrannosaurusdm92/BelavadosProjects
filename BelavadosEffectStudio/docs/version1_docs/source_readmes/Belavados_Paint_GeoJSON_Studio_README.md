# Belavados Paint + GeoJSON Studio

A standalone browser painting and image-overlay editor assembled from the requested paint/geometry/GeoJSON repo bundle into a single no-build web app.

Open `index.html` in a browser. No server, npm install, or backend is required.

## Main features

- Upload PNG, JPEG, SVG, and GIF images.
- Transparent checkerboard workspace with true alpha canvas.
- Scan image edges and make background pixels transparent.
- Make a clicked/matched/current/white-ish color transparent with tolerance.
- Brush, eraser, color matching eyedropper, flood fill, line, rectangle, ellipse, triangle, star, and text tools.
- Selection rectangle with copy, cut, paste, and drag-to-move.
- Movable GeoJSON overlay anchors with configurable anchor count.
- Polygon, LineString, and MultiPoint GeoJSON export using canvas/SVG pixel coordinates.
- Export transparent PNG, white-background JPG, SVG with embedded raster + overlay, overlay-only SVG, GeoJSON, and full project JSON.
- Save/load full project state in browser IndexedDB, with localStorage fallback.
- Import project JSON or GeoJSON again later.

## Notes

- GeoJSON coordinates are intentionally `canvas_pixels_top_left_origin`, not longitude/latitude. This is best for image overlays, masks, SVG trajectories, game maps, and logo effects.
- GIF and SVG uploads are rasterized onto the canvas for editing. Exported PNG/JPG/SVG uses the rendered image frame, not a preserved animated GIF timeline.
- The shapefile source repository is documented for future conversion support, but this browser build exports GeoJSON directly and does not write `.shp/.shx/.dbf` files.

## Quick workflow

1. Open `index.html`.
2. Upload a PNG/JPEG/SVG/GIF.
3. Use **Scan Edges → Transparent** or **Magic Transparent** to remove the background.
4. Paint, erase, type, select/cut/paste/move, or create shapes.
5. Click **New Overlay** to create movable GeoJSON anchors.
6. Drag anchors into the exact overlay path.
7. Export PNG/SVG/GeoJSON/project JSON, or click **Save Browser**.

## Folder map

```text
index.html
css/styles.css
js/app.js
docs/
  SOURCE_AUDIT.md
  MANIFEST.md
  TEST_REPORT.md
  licenses/
examples/
assets/
```
