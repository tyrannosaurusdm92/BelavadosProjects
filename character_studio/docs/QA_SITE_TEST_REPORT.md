# Belavadös Character Studio QA Site Test Report

**Date:** June 21, 2026

## Result

I tested and patched the merged one-HTML build for pathing, asset availability, JSON validity, JavaScript syntax, and visible Voice Studio speech-preview behavior.

## Passed Checks

- Zip extraction: passed.
- Main `index.html`, CSS, project loader, studio scripts, voice engine scripts, and `data/studio/*.json`: accessible over a local HTTP server.
- JSON validity: 87/87 JSON files parse after repair.
- JavaScript syntax: 201/201 JS files pass `node --check`.
- Audio assets: 1000 files exist under `media/a`; 982 WAV files parse; no audio file is empty or suspiciously tiny.
- Asset manifest pathing: `json/assets-index.json` now has zero missing `shortPath` references.

## Fixes Applied

1. Fixed `json/srcjson_0019.json`, which had JavaScript-style comments and was not valid JSON.
2. Pruned stale missing media references from `json/assets-index.json` and `js/asset-index-data.js`. The package had 1000 media files, but the old manifest still referenced thousands of removed pre-pruned assets.
3. Updated `js/project-loader.js` so the visible merged site loads the advanced voice engine layers before the three-tab studio core.
4. Updated `js/studio/character-studio-core.js` so the visible Voice Studio speech preview uses `BelavadosSpeechApi` and `BelavadosNaturalnessGuard` when available.
5. Added safe pitch/rate limits for human voices, biome-accent handling, and construct-only robotic permission.

## Voice Studio Notes

The visible Voice Studio now uses the advanced speech bridge instead of only raw browser `SpeechSynthesisUtterance` values. Non-construct voices are guarded toward human-sounding ranges. Construct races such as Warforged, Constructed/Artificial beings, Autognome, Clockwork, Modron, Android, Machine, Automaton, etc. are allowed to sound more mechanical.

The generated speech still depends on the user's installed browser/OS voices. For best results, use Edge or Chrome with high-quality natural/online English voices enabled.

## Remaining External Dependencies

Two CSS background references are still external image URLs. They are not broken local paths, but they are not offline-safe. If you want the whole site to work fully offline, download those images into `media/` and replace the CSS URLs with local paths.
