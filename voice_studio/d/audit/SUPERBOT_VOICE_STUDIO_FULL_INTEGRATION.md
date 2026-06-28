# Superbot → Voice Studio full integration audit

Generated: 2026-06-28T02:22:12.185017Z

## Locked backend

`https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec`

## Runtime integration

- Added `s/superbot-voice-brain.js` as the runnable merged Superbot brain for Voice Studio.
- Added the `#superbot` panel to `index.html` for chat, source-decision activation, current-voice analysis, GitHub scan, learning memory, task extraction, file indexing, search, and brain snapshot export.
- Wired the panel into `s/app.js` so it can access the current character profile, active biome/race/gender/class/personality inputs, source decision, backend payload, and voice-source activation.
- Kept source folders exactly where they already were: `r/v/p001/`, `r/v/p002/`, and `r/v/p003/`.
- Kept `s/voices.json` as the active source manifest.
- Added backend adapter routes to `b/backend.gs` for Superbot-compatible chat, learning, tasks, file indexing, search, project coverage, and voice simulation while preserving the existing Voice Studio routes.

## Superbot source files used as live code input

- `frontend/assets/superbot.js` → converted into `s/superbot-voice-brain.js` patterns.
- `frontend/embed/superbot-widget.js` → converted into the embedded Voice Superbot panel rather than an unrelated floating widget.
- `Code.gs` → compatibility routes converted into the Voice Studio backend adapter.
- `docs/manifests/converted_feature_manifest.json` and `docs/audits/correct_merge_audit.md` → preserved as traceability docs.

## Not copied as bulky runtime content

The Superbot archive files under `docs/source-archives/` were not copied into the live Voice Studio package. They are large archival inputs, not runtime code. The integration preserves source traceability through manifests/audits/licenses instead.
