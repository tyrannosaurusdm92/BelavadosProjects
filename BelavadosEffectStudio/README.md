# Belavadös Effect Layer Studio

Open `index.html` directly on Windows, or double-click `open_index_windows.bat`.

This build merges the compact Paint + GeoJSON studio concept with the provided balanced box-page template and a new browser-only effect-layer runtime. It keeps the runtime small and Windows-friendly while preserving source accountability in `docs/`.

## Main features

- Upload an image or project file.
- Zoom with the mouse wheel over the image placement box.
- Drag a selection with **Drag Zoom Box**, then press **Zoom To Box**.
- Paint animated effects on separate layers.
- Use real-time sliders for intensity, transparency, speed, blur/softening, sharpness, wave/hover size, mote count, vector length, brush size, color, alpha, and angle.
- Create blinking lights, wave, hover, shimmer, pulsing, motes, vectors, plain paint, and electric/thunder strokes.
- Pick a transparency color and tune the 1%–100% tolerance slider live before applying it.
- Export an interactive animated HTML file, a PNG frame, or a `.belfx` project JSON.

## Windows notes

No install step is required. The project is static HTML/CSS/JS.

- Best quick start: open `index.html`.
- If browser security blocks local file operations on your system, run `run_local_server_windows.bat`, then open the URL it prints.
- All paths use short, normal folder names and forward-slash web paths that work from Windows browsers.

## Source handling

Small runtime-friendly files were copied into `js/vendor/`. Large application repos were not copied into the runtime because they require separate build stacks and would make the working folder huge. Their readmes, licenses, audits, and manifests are in `docs/`.


## Ichor Converter Update

This version adds brush-based ichor discharge creation. Draw rough guide strokes, press **Ichor Convert**, then use the Thundercoil weapon or skyship preset dropdown plus live sliders to turn the strokes into animated liquid-electric current paths. The effect behaves like fluid lightning: it travels along your strokes, branches away from them, throws motes, and updates in real time. It does not add a battery/core because those source components should already exist in the weapon or skyship art you are editing.

The Interactive HTML export now keeps ichor layers animated in the exported standalone file.


## Mobile/PWA repair pass

This build includes a mobile-first repair layer: PWA manifest/icons/service worker, installable Android/Apple home-screen metadata, touch-safe canvas controls, two-finger pinch/pan inside the editor, larger touch targets, portrait-first workspace ordering, and rotated landscape layout support. See `docs/MOBILE_PWA_FIX_REPORT.md` for details.
