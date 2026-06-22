# Ichor Converter Test Report

Date: 2026-06-22

## Static checks completed

- Confirmed `index.html` contains all new Ichor Converter controls and no duplicate `ichorConvertBtn` IDs.
- Confirmed `js/app.js` parses successfully with `node --check`.
- Confirmed the effect type dropdown includes `ichor`.
- Confirmed the Ichor Converter preset dropdown is populated by embedded compact preset data at runtime.
- Confirmed project serialization stores `ichor` layer type and settings inside the normal `.belfx` project JSON.
- Confirmed standalone HTML export runtime includes an `ichor` renderer rather than falling back to a plain stroke.

## Manual-use test path

1. Open `index.html` or `open_index_windows.bat`.
2. Upload an image or use the default transparent canvas.
3. Draw a rough stroke where discharge should travel.
4. Press **Ichor Convert**.
5. Select a Thundercoil weapon or skyship preset.
6. Move velocity, power, thrust, dust, lighting, escape, fluidity, pressure, and the existing studio sliders.
7. Confirm the selected layer updates live without using undo.
8. Export Interactive HTML and confirm animation continues in the exported file.

## Browser automation note

The container environment blocked local page loading through the headless browser with `ERR_BLOCKED_BY_ADMINISTRATOR`, so runtime browser automation could not be completed here. The JavaScript syntax check and source-level wiring checks passed.
