# Voice Studio Linked Asset Merge

## Result

Character Studio is now the only program opener: `character_studio/index.html`.

Voice Studio is no longer treated as a separate user-facing app in the returned package. It is used as the linked source-of-truth library for:

- voice/accent source manifest lookup,
- bot-selected source model/sample decisions,
- Superbot/voice backend routing hooks,
- local WAV render helper,
- backend MP3/WAV request routing,
- linked voice ZIP/profile export helpers.

## What changed

### Character Studio

Added:

- `character_studio/js/voice-studio-linked-runtime.js`
- inline `BELAVADOS_LINKED_VOICE_STUDIO_CONFIG` in `character_studio/index.html`
- a new Page 3 panel named **Linked Voice Studio Bot + Asset Library**

The linked panel reads Character Studio generator fields, voice fields, slider values, emotion, biome, race, gender identity, class/subclass, personality notes, and exact speech text. It then imports the Voice Studio library and asks the Voice Studio bot logic to choose the source model/sample.

### Voice Studio

Added:

- `voice_studio/s/character-studio-voice-library.js`

This module exposes library functions only. Character Studio imports it dynamically. It uses the existing Voice Studio source manifest (`voice_studio/s/voices.json`) and routes actual audio/model file references to the GitHub-hosted `voice_studio/` path.

### Backend lock

Character Studio backend constants were updated to the locked Voice Studio backend:

`https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec`

## Asset policy

The returned zip intentionally does not include the heavy Voice Studio audio/model asset folders. Voice assets remain hosted under GitHub `voice_studio/` and are referenced by manifest path.

The linked runtime sets:

- `voiceStudioAssetBaseUrl`: GitHub `voice_studio/`
- `voiceManifestPath`: `voices.json`
- `entryPointPolicy`: Character Studio only

## User-facing behavior

On Page 3 of Character Studio:

1. Click **Activate linked voice-source bot**.
2. The bot reads the current Character Studio build and slider settings.
3. The bot selects the source model/sample from the Voice Studio manifest.
4. The Voice Asset dropdown becomes bot-locked and shows the selected source plus runner-up audit rows.
5. Use:
   - **Browser preview** for fast preview,
   - **Render linked WAV** for local downloadable WAV,
   - **Ask backend for MP3 + WAV** for backend conversion/export,
   - **Download linked voice ZIP** for WAV + manifest,
   - **Download full Character Studio JSON** for generator + sheet + linked voice profile.

## Notes

Browser-only JavaScript can reliably create WAV locally. MP3 creation is routed to the locked backend because true MP3 encoding/export needs backend support or an encoder library. If the backend does not return a playable MP3/WAV URL, the local WAV fallback still works.
