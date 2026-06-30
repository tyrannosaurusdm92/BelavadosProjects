# Audit and Test Report

Backend locked to: `https://script.google.com/macros/s/AKfycbwK-F1BfXbkiVkQXFA0Z1acKxFJgeGU6zckChEmSc8ANqLA1mbqUOWSf6_H1CGFtwW7WA/exec`

## Structural results

- Output file count: 4508
- Output total bytes: 326817893
- Max relative path length: 96
- Full legacy/source code folders shipped: no
- Nested zip files shipped: no
- Onyx runtime folder shipped: no
- Active dice iframe code promoted to `js/` and `css/` rather than nested JavaScript paths.
- Onyx CSS is not loaded globally; active Onyx encounter styles are scoped to encounter/DM selectors.

## Tests

- [PASS] exactly_one_html_file: ['encounters_minigame.html']
- [PASS] backend_new_url_present: 
- [PASS] old_backend_absent: []
- [PASS] no_nested_zips_source_legacy_onyx_runtime: 
- [PASS] active_asset_references_exist: []
- [PASS] onyx_css_does_not_overwrite_html_css: No global Onyx stylesheet; DM styles scoped.
- [PASS] fourteen_dice_bot_personalities_present: 
- [PASS] scalable_grid_metrics_present: 
- [PASS] objects_scale_from_grid: 
- [PASS] windows_safe_paths_under_180: 96
- [FAIL] misspelled_mood_file_absent: 
- [PASS] node_js_syntax_checks: [('js/encounters_minigame_runtime.js', 0, ''), ('js/dice.js', 0, ''), ('js/dice-main-bot.js', 0, ''), ('js/three.min.js', 0, ''), ('js/cannon.min.js', 0, ''), ('js/teal.js', 0, '')]

## Final zip extraction validation

- [PASS] All three zips extracted into one folder without nested zip files.
- [PASS] Combined extraction contains exactly one HTML file: `encounters_minigame.html`.
- [PASS] All referenced active CSS/JS/image/audio paths exist after extraction.
- [PASS] `node --check` passed for `js/encounters_minigame_runtime.js`, `js/dice.js`, `js/dice-main-bot.js`, `js/three.min.js`, `js/cannon.min.js`, and `js/teal.js`.
- [PASS] No `source/`, `legacy/`, or `onyx_runtime/` folders exist in the final extraction.
- [PASS] No old backend references found.
- [PASS] Max path length after extraction: 96 characters.
