# Mobile + PWA Repair Report

This repair pass focused on the studio behaving like a real mobile drawing/design app instead of a desktop page squeezed onto a phone.

## Mobile interaction fixes

- Added hard `touch-action: none` protection to the workspace, stage, and canvases so mobile browsers stop stealing brush strokes for page scrolling or browser pinch zoom.
- Added in-app two-finger pinch zoom and pan for the image workspace.
- One finger now uses the selected tool: brush, eraser, repair, transparency picker, fill, shape/link, zoom box, or pan.
- Added mobile quick controls directly beside the workspace: Brush, Pan, Erase BG, Repair, Fit, Undo, Redo.
- Enlarged buttons, range sliders, checkboxes, text fields, and menus for 44px+ touch targets.
- Prevented long-press context menu inside the canvas workspace.
- Kept desktop wheel zoom and space/middle-button panning intact.

## Responsive layout fixes

- On portrait mobile, the image workspace is moved to the top so the user can start editing immediately.
- On rotated/mobile landscape, the editor switches into a two-column app layout with the workspace kept large and the tool column independently scrollable.
- Added safe-area support for modern phones with notches and rounded screens.
- Made navigation horizontally scrollable on narrow screens instead of crushing the buttons.
- Prevented iOS-style form zoom by using 16px mobile input font sizes.

## Install/app icon fixes

- Added `manifest.webmanifest` with standalone display mode, `orientation:any`, theme color, background color, app description, and icon declarations.
- Added PNG icons: 180px Apple icon, 192px Android icon, 512px Android icon, and 512px maskable icon.
- Added `service-worker.js` to cache the app shell for PWA install/offline behavior when hosted on HTTPS or localhost.
- Added Apple/mobile web app meta tags and manifest links in `index.html`.

## Notes for deployment

For Android “Add to Home screen”/Install to appear reliably, deploy the folder over HTTPS, such as GitHub Pages. After uploading the new files, open the site in Chrome on Android, then use the browser menu to install/add to home screen. If Chrome has an old cached version, refresh once or clear the site cache.
