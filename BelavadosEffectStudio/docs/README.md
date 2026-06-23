# Belavadös Effect Studio

Mobile-first drawing, spraypaint/graffiti, background cleanup, shape/text/object editing, ichor/lightning effects, layers, animation preview, and export in one simple app shell.

## Current layout rule

The app now uses only `index.html` as the visible app layout. There is no embedded legacy sub-studio, no fullscreen alternate editor, and no hidden three-column PWA layout. All tool families are opened from the simple icon navigation and their sliders/size controls live inside the movable tool menu.

## Main files

- `index.html` — the single app shell.
- `assets/styles.css` — responsive mobile-first layout and movable menu styling.
- `assets/app.js` — canvas, drawing, layers, objects, export, and integrated ichor/lightning logic.
- `manifest.webmanifest` and `sw.js` — installable PWA setup for the single shell.
