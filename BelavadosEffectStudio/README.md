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


## Apps Script backend embedded — 2026-06-22

This build is wired to the deployed Apps Script web app:

- Deployment ID: `AKfycbxW28DzqosHIy7w5Y4iU0FW0RBRqrQEob_8sTHbWYyRC3zFqSacL1-gKqjdg56gSRvs`
- Web app URL: `https://script.google.com/macros/s/AKfycbxW28DzqosHIy7w5Y4iU0FW0RBRqrQEob_8sTHbWYyRC3zFqSacL1-gKqjdg56gSRvs/exec`
- GitHub Pages target: `https://tyrannosaurusdm92.github.io/BelavadosProjects/BelavadosEffectStudio`

Added files:

- `manifest.webmanifest` for installable desktop/mobile icon support on GitHub Pages.
- `service-worker.js` for local PWA caching on the GitHub Pages origin.
- `icons/icon.svg`, `icons/icon-192.svg`, `icons/icon-512.svg` for the install icon.
- `js/backend.js` for the Apps Script launcher/backend bridge.
- `backend/Code.gs` as an optional upgraded Apps Script backend if cloud project save/load is desired.

The studio now exposes `window.BelavadosEffectStudio` so backend code can safely read and reload `.belfx` project snapshots without duplicating editor internals.
