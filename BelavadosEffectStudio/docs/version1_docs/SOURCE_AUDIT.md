# Source Audit

## Runtime inclusion decision

The runtime is intentionally small enough to open from a normal Windows folder. I did not copy full application repositories into the working app when they would add large build systems, node modules, Clojure/backend stacks, or server-only code. Instead, I kept their README/LICENSE material and documented the decision here.

## Merged directly into the runtime

- **Balanced box page template**: visual structure, header/nav/module box language, image placement box layout, and modular columns were adapted into `index.html` and `css/styles.css`.
- **Belavados Paint + GeoJSON Studio**: paint/upload/transparency/zoom/export concepts were merged into the new native canvas runtime.
- **lax.js, Pizzicato, slidr**: small prebuilt browser files are copied into `js/vendor/` for future motion/audio/slider expansion. The current editor does not require a build step.

## Documented instead of copied as runtime

- **Penpot**: large design platform with non-static development stack; documented only.
- **draw.io**: large diagramming app with Java/build tooling; documented only.
- **Excalidraw**: large React drawing app; documented only.
- **Canva clone**: app-template code with framework/database/upload/payment dependencies; documented only.
- **glfx.js**: WebGL filter source exists, but the current runtime uses native canvas and CSS-compatible filter logic for blur/soften plus custom stroke sharpness. Full build source is documented rather than shipped in runtime.
- **js-effects-main**: many examples, several with non-English/encoded paths and one very large CSS file. The shipped runtime implements custom native-canvas versions of the requested effect families instead of copying the example tree wholesale.

## Implemented user-requested items

- Windows-friendly static project.
- Image upload into the center image placement box.
- Mouse-wheel zoom, drag-to-select zoom box, fit/reset zoom.
- Real-time slider updates with no undo/apply loop for effect changes.
- Separate effect layers with visibility, ordering, duplicate, delete, clear, rename, and per-layer settings.
- Stroke brush with color, size, alpha, and angle.
- Effect creators: blinking lights, wave, hover, shimmer, pulsing, motes, vectors, electric/thunder, and plain paint.
- Sliders: intensity, transparency, sharpness, blur/softening, speed, wave/hover size, mote count, vector length, brush size, alpha, and angle.
- Transparency creator: click sampled color, 1%–100% tolerance, soft edge, removal strength, live preview mask, apply, trim transparent edges.
- Export: interactive moving HTML, PNG current frame, `.belfx` project JSON, browser local save/load.

## Known boundaries

- This is a static browser editor, not a full clone of Penpot/draw.io/Canva/Excalidraw.
- GIF export is not included; use the interactive HTML export for moving effects.
- The HTML export includes animated layers and basic layer toggles/global speed/opacity controls, but it is a viewer, not the full editor.

## Ichor Converter follow-up merge

- Source: `Belavados_Thundercoil_Lightning_Forge` uploaded in the same request.
- Reused: compact preset math and liquid-lightning rendering concepts derived from the Forge's Thundercoil arsenal, physics, and lightning-dominance modules.
- Not copied wholesale: the separate Forge application shell, weapon-management UI, large source_specs docs, and independent renderer stack were not merged into the studio runtime to avoid duplication.
- New code location: `js/app.js` contains the `ichor` layer renderer, preset controls, brush conversion, and standalone export runtime support.
- New documentation: `docs/ICHOR_CONVERTER_IMPLEMENTATION.md` and `docs/ICHOR_CONVERTER_TEST_REPORT.md`.
