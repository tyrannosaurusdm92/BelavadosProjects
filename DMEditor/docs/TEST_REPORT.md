# DMEditor Test Report

The final correction pass includes **13 automated tests** covering:

- six-anchor territory normalization and live square-mile/square-kilometer updates;
- province ownership after moving coordinates;
- terrain-driven settlement derivation;
- route regeneration after movement;
- exactly one HTML file in the package;
- fixed Apps Script and GitHub `DMEditor` paths;
- absence of the invalid bundled backend replacement;
- absence of a runtime `world_map.html` dependency;
- editable startup defaults and restored import controls;
- authenticated shared-backend actions;
- one-HTML interactive export generation;
- the 24,000 KiB per-file limit;
- clean manifests naming `index.html` as the only HTML entry;
- the same 24,000 KiB limit enforced when exporting an updated `index.html`.

Additional smoke checks confirmed that `server.mjs` serves the root editor, backend scripts, CSS, `dm_map.json`, map image, export template, and the 691-file JSON registry over HTTP.

Run:

```bash
npm test
npm run index-json
npm run manifest
```

from the `DMEditor` folder to rebuild and verify the package before committing.
