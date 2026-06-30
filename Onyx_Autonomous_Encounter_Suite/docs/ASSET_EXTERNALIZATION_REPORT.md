# Asset Externalization Report

Generated: 2026-06-30T20:59:32+00:00

This build wires Onyx to the existing external `assets/` folder, but does **not** return actual asset files in this zip.

## What changed

- Added `js/onyx_asset_library.js` to load and search `assets/asset_manifest_index.json` plus folder manifests.
- Updated `encounters_minigame.html` so the asset library loads before `js/encounters_minigame_runtime.js`.
- Updated Onyx runtime exports/backend payloads to include asset-library context instead of copying assets.
- Hostile/object placement now attempts to pick matching external token/item/fx assets from the manifest library when those assets exist in the deployed `assets/` folder.
- Added `assets/rules.json` declaring that future ChatGPT edits must not return real assets unless explicitly requested.
- Added one generated `manifest.json` in every `assets/` subfolder.

## Asset summary from source upload

- External asset files indexed: 4535
- Source asset bytes represented by manifests: 238,971,531
- Asset folder manifests generated: 78

## Important

The returned zip only contains JSON manifests under `assets/`. Keep your real GitHub/local `assets/` folder in place at the same relative paths.
