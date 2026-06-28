# Sitewide Dropdown Merge QA Report

## Merge confirmation
- Page 1 now includes `#swddbCharacter-builder`.
- Page 2 keeps `#biomeHeritageBuilder` and has new hide/show controls.
- Page 3 now includes `#swddbVoice-builder`.
- Navigation was extended for all three pages, including the floating bubble navigation and skinny subnav links.
- The latest uploaded dropdown JSON replaced the older embedded dropdown JSON.

## Automated checks run
- Parsed `index.html` after merge.
- Validated embedded dropdown JSON scripts:
  - `bddSourceData`
  - `bddBiomeData`
  - `bddPronounData`
  - `bddTitleData`
- Validated all `.json` files in the project.
- Ran `node --check` on all `.js` files in the project.
- Checked relative `src` / `href` asset references present in `index.html`.
- Ran a jsdom interaction test for the merged dropdown system:
  - Confirmed Page 1 and Page 3 builders initialize.
  - Confirmed Page 2 existing builder initializes.
  - Confirmed Page 1 dropdown selection applies into generator fields.
  - Confirmed Page 3 dropdown selection applies into voice fields.
  - Confirmed Page 2 builder hide/show and per-part hide buttons exist and toggle.
  - Confirmed dropdown navigation links exist on all three pages.

## Results
- Embedded dropdown JSON: PASS
- Project JSON files: PASS, 89 valid files
- Project JavaScript syntax: PASS, 202 valid files
- Index relative asset references: PASS, no missing relative references found
- Sitewide dropdown interaction test: PASS

## Notes
The jsdom test reported two `HTMLMediaElement.prototype.load` not-implemented messages. Those come from jsdom’s test environment, not from the site code; browser media loading is outside jsdom’s implementation. No fatal JavaScript errors were detected in the tested dropdown workflow.
