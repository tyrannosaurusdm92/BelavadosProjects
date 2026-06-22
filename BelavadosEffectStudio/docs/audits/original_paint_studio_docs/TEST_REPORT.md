# Test Report

## Static checks completed

- JavaScript syntax check: `node --check js/app.js` passed.
- Project contains standalone `index.html`, `css/styles.css`, and `js/app.js`.
- All referenced local files exist.
- License/readme audit files were copied into `docs/`.

## Manual browser workflow to verify

1. Open `index.html`.
2. Confirm the transparent checkerboard and starter canvas appear.
3. Upload PNG/JPEG/SVG/GIF.
4. Test background removal:
   - `Scan Edges → Transparent`
   - `Current Color → Transparent`
   - `White-ish → Transparent`
   - `Magic Transparent` click tool
5. Test paint tools:
   - Brush
   - Eraser
   - Match Color
   - Fill
   - Type
   - Line / Rect / Ellipse / Triangle / Star
6. Test selection:
   - Select an area
   - Copy
   - Paste
   - Drag floating selection
   - Cut
7. Test GeoJSON overlay:
   - `New Overlay` with 30 anchors
   - Drag anchors
   - Add anchor mode
   - Delete selected anchor
   - Export/copy/import GeoJSON
8. Test exports:
   - PNG transparent
   - JPG white background
   - SVG full
   - SVG overlay
   - Project JSON
9. Test browser save:
   - Save Browser
   - Reload page
   - Load Browser

## Known limitation

Animated GIFs are accepted by the uploader, but canvas editing/export flattens them to the browser-rendered frame. Preserving animated GIF frames would require a dedicated GIF parser/encoder library.

## Automated browser note

A headless Chromium smoke test was attempted through both `file://` and a local `http.server`; the sandbox browser policy returned `net::ERR_BLOCKED_BY_ADMINISTRATOR`. Static syntax and local file-reference checks passed, but interactive browser testing must be done by opening `index.html` outside this restricted sandbox.
