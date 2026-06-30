# Audit and Test Report

Generated: 2026-06-30T21:00:33+00:00

Backend locked to: `https://script.google.com/macros/s/AKfycbwK-F1BfXbkiVkQXFA0Z1acKxFJgeGU6zckChEmSc8ANqLA1mbqUOWSf6_H1CGFtwW7WA/exec`

## Structural results

- Returned output file count: 107
- Returned output total bytes: 53,594,812
- Real asset files returned under `assets/`: 0
- JSON manifest/rule files returned under `assets/`: 80
- External asset files indexed from the uploaded suite: 4535
- External asset bytes represented by manifests: 238,971,531
- Asset folder manifests generated: 78

## Wiring changes

- `js/onyx_asset_library.js` now loads `assets/rules.json`, `assets/asset_manifest_index.json`, and folder manifests.
- `encounters_minigame.html` loads the asset library before the encounter runtime.
- Onyx backend calls include `assetContext` so Onyx can select/reference valid map, token, item, sound, and effect paths without embedding files.
- Hostile and object creation attempts to assign external manifest-backed asset paths when the deployed `assets/` folder is present.
- `assets/rules.json` explicitly tells future ChatGPT edits not to return real assets unless the user asks for them.

## Validation performed

- All JSON files in the returned bundle parse successfully.
- No non-JSON files are present under the returned `assets/` folder.
- Every returned directory under `assets/` has a `manifest.json`.
- `node --check` passed for `js/onyx_asset_library.js` and `js/encounters_minigame_runtime.js`.

## Important

Keep the real GitHub/local `assets/` folder in place. This zip is intentionally manifest-only under `assets/`; it is designed to be overlaid onto the existing project without re-uploading assets.
