# Voice Studio merged backend lock audit

Updated: 2026-06-27

## Locked deployment URL

`https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec`

The previous Apps Script deployment URL was removed from frontend code and documentation.

## Frontend routes aligned to uploaded merged backend

Voice Studio now uses the uploaded `TyrannosaurusDM92_ONE_MERGED_Backend_Code.gs` route names instead of the older mini reference backend names.

| Frontend task | Backend action | Notes |
| --- | --- | --- |
| Backend health/test | `health` | Sent through `backend=universal`. |
| Bot source decision support | `voice.source.resolve` | Local bot still chooses the exact bundled WAV path; backend resolves canonical model/control payload. |
| Conversation/intention check | `bots.decide` | Optional helper during bot activation. |
| Profile sync | `presets.save` | Saves voice preset payload using the backend preview payload contract. |
| Backend WAV guide | `voice.synth.renderWav` | Requests the backend procedural WAV guide route and falls back to local WAV if no playable URL is returned. |
| Audio export compatibility | `audio.export.save` | Available in `s/backend-client.js` alias map for future frontend export uploads. |

## Pathing preserved

Voice resources still load from the existing GitHub-safe folders:

- `r/v/p001/`
- `r/v/p002/`
- `r/v/p003/`
- manifest: `s/voices.json`

No voice-resource paths were flattened or renamed in this pass.

## Scanner/conversation frontend

The scanner/randomizer helper files were added under `s/` and are cached by the service worker:

- `s/conversation-scanner-randomizer.js`
- `s/scanner-rules.json`
- `s/embedded-document-scanner-config.json`
- `s/embedded-document-scanner.js`

The voice source bot uses the conversation scanner when available, then sends a matching backend `bots.decide` packet during activation.
