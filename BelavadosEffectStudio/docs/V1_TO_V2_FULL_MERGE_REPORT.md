# Belavadös Effect Studio — Version 1 into Version 2 Full Merge Report

## Merge rule used
Version 2 remains the active shell, layout, navigation, PWA structure, movable tool drawer, mobile-first workspace, asset library, object/text system, layer stack, animation frame system, and export system.

Version 1 was integrated back into the version 2 shell as direct front-end/deep-code features rather than as an iframe or a hidden second app.

## Backend endpoint
The merged app uses the requested Apps Script endpoint in `assets/app.js` as the single backend URL:

`https://script.google.com/macros/s/AKfycbxW28DzqosHIy7w5Y4iU0FW0RBRqrQEob_8sTHbWYyRC3zFqSacL1-gKqjdg56gSRvs/exec`

Backend sync posts a project payload with `action: "saveEffectStudioProject"` and the complete serialized project data, including layers, objects, frames, background settings, live effects, transparency seed, and repair source data.

## Version 1 features restored into version 2
- Preserved version 2 navigation and simple AddText/Paint-style shell.
- Added version 1 drag zoom box tool directly into the Draw panel.
- Added top-bar Load and Clear Save buttons from the older browser-save flow.
- Added New Transparent project button.
- Added legacy bounded transparency workflow:
  - picked color seed location
  - connected-area removal
  - tolerance
  - edge softness
  - remove strength
  - preview picked transparency area
- Added Trim Empty Edges from version 1.
- Added Refresh Repair Source and restored repair brush behavior so Repair can restore from the captured source rather than acting only like normal paint.
- Restored version 1 legacy animated effect families into the version 2 Ichor panel:
  - Blink / blinking lights
  - Shimmer trails
  - Hover motes
  - Vector sparks
- Added version 1 legacy effect controls:
  - speed
  - blur / aura
  - sharpness
  - wave amplitude
  - vector length
- Restored version 1 Thundercoil/skyship preset math into `LEGACY_ICHOR_PRESETS` and mapped it into the version 2 effect sliders.
- Added polygon/star side count control from the old shape controls.
- Kept version 2 features that were newer than version 1:
  - asset library
  - overlay imports
  - text objects with formatting
  - movable editable objects
  - animation frames
  - SVG/PNG/JSON/HTML export
  - background modes: transparent, white, color
  - live animated Ichor/electric updates

## Source preservation
The original version 1 front-end files are preserved in:

- `docs/version1_full_source/`
- `docs/version1_docs/`

This is not used as a second hidden layout. It is included as audit/reference source so no old code is lost while the working app stays on the version 2 shell.

## Validation performed
- JavaScript syntax checked with `node --check assets/app.js`.
- HTML/JS ID bindings checked: every JavaScript DOM ID lookup has a matching element in `index.html`.
- Required local CSS, manifest, icon, and script references checked for existence.
- Backend URL verified in merged app code.

## Notes
A full browser interaction test was attempted with local Chromium, but this sandbox blocked local page loading with `ERR_BLOCKED_BY_ADMINISTRATOR`. Static validation and JavaScript syntax validation passed.
