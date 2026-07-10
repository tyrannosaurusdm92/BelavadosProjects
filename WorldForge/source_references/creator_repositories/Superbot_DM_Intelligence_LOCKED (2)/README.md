# Superbot DM Intelligence — locked backend, no voice generation

Backend locked to:

`[historical backend endpoint removed; runtime uses the locked WorldForge endpoint]`

This package removes voice generation from Superbot while keeping the original project intelligence and re-gearing the bot into a Dungeon Master assistant.

## Main runnable files

- `Code.gs` — Google Apps Script backend with chat, project scanning, tasks, auth, adaptive learning, and DM tools.
- `frontend/superbot.html` — GitHub Pages-ready dashboard.
- `frontend/assets/superbot.js` — browser frontend for chat, #dm-session, encounters, rules, scans, tasks, learning, auth, and embed config.
- `frontend/embed/superbot-widget.js` — embeddable DM widget.
- `dm_knowledge/` — rules, conditions, hostile tactics, spells catalog, and asset registry.
- `assets/` — runtime DM media such as tokens, maps, encounter FX, spell packs, and tabletop images.

## Removed

- Voice generation routes and jobs
- SSML/profile generation
- Web Speech preview
- TTS/voice endpoint forwarding
- Frontend Voice Lab

## Added

- #dm-session controls
- Encounter builder with hostile count
- Initiative roller
- Hostile turn advisor that respects action economy
- Attack resolver and damage roller
- Condition/rules helper
- Combat log sheet

## Deploy

1. Open Google Apps Script.
2. Paste `Code.gs` into `Code.gs`.
3. Run `setup()` once and authorize.
4. Deploy as a Web App.
5. Use the locked deployment URL above in GitHub Pages.
6. Upload `frontend/`, `dm_knowledge/`, and `assets/` to the site folder that needs Superbot DM.

## Source policy

Unused code is represented as manifests, audits, readmes, and licenses in `docs/`. Raw unused source archives are not included.

## Windows-safe paths

Paths are shallow and sanitized. See `docs/audits/windows_path_audit.json`.
