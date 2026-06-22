# Merge Manifest

## Runtime folder

| Path | Purpose |
|---|---|
| `index.html` | Main merged editor using the balanced box layout as the image placement/workspace shell. |
| `css/styles.css` | Box-template-inspired theme plus editor/workspace styling. |
| `js/app.js` | Native browser canvas editor, zoom, layers, effects, transparency, export/import. |
| `js/vendor/lax.min.js` | Small copied vendor runtime. |
| `js/vendor/Pizzicato.min.js` | Small copied vendor runtime. |
| `js/vendor/slidr.min.js` | Small copied vendor runtime. |
| `docs/` | Source accountability, unused-code notes, audits, manifests, and license/readme copies. |

## Uploaded sources reviewed

| Uploaded source | Runtime action | Unpacked bytes | Files | Notes |
|---|---:|---:|---:|---|
| `Belavados_Paint_GeoJSON_Studio.zip` | runtime concepts merged; original docs copied | 135,880 | 20 | Compact browser paint/GeoJSON studio used as the closest runtime ancestor. |
| `generic_box_page_template_balanced.html` | layout/theme merged; source copied to docs | 22,797 | 1 | Balanced box layout/template used for image placement and module structure. |
| `canva-clone-main.zip` | docs only | 29,728,317 | 248 | Large design app reference; not copied into runtime. |
| `js-effects-main.zip` | custom effects implemented; source docs/license copied | 4,760,527 | 203 | Visual effect examples reviewed; runtime implements custom native-canvas effects. |
| `pizzicato-master.zip` | vendor/docs | 3,161,417 | 105 | Small browser audio library copied as vendor runtime for future sound-reactive effects. |
| `lax.js-dev.zip` | vendor/docs | 2,859,563 | 40 | Small browser motion library copied as vendor runtime for future UI animation hooks. |
| `glfx.js-master.zip` | docs only | 1,646,375 | 60 | Image filter reference; not built/copied because native canvas filters cover current blur/sharpness needs. |
| `slidr-master.zip` | vendor/docs | 88,066 | 6 | Small slider helper copied as vendor runtime for future UI panels. |
| `penpot-develop.zip` | docs only | 308,220,513 | 5,743 | Very large design system application; documented only. |
| `excalidraw-master.zip` | docs only | 54,407,770 | 1,229 | Large drawing app reference; documented only. |
| `drawio-dev.zip` | docs only | 159,551,879 | 3,405 | Large diagram app reference; documented only. |

## Drawing/Shape/Repair update

- Added undo/redo/quick browser save controls.
- Added brush cursor bubbles and brush style controls.
- Added hex color input alongside color picker.
- Added fill tool and repair brush.
- Changed transparency preview to butter/coral and bounded transparency to connected flood-fill regions only.
- Added shape/link object system and standalone export link hotspots.
- Updated ichor renderer to use the requested cyan/teal Belavadös ichor palette.


## 2026-06-22 Mobile-first repository merge

Merged `ImageEditorMobileApp-main.zip` as reference/audit material and implemented browser-native mobile equivalents: portrait-first layout, dropdown tool panels, safe touch drawing toggle, pinch zoom, landscape handling, and PWA manifest updates. SwiftUI source is preserved under `docs/mobile_reference/`; no native iOS code is executed in the static web runtime.


## 2026-06-22 JavaScript lightning/paint restoration addendum

Runtime files updated:

- `index.html` — added new effect and brush dropdown options.
- `mobile.html` — explicit mobile-first entry point with fat-finger safety.
- `desktop.html` — explicit desktop-first entry point.
- `js/app.js` — added segmented bolt rail, branch/fork, chain, storm mesh, spark field, ichor micro-bolt overlay, and additional brush renderers.
- `service-worker.js` — cache version updated for new desktop/mobile entries.
- `docs/` — added source manifest, restoration audit, export parity notes, mobile/desktop safety notes, licenses, readmes, and legacy reference snippets.

Heavy native/framework repos remain documented under `docs/` rather than copied wholesale into runtime.
