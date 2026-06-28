# Voice Source Bot Lock Audit

## What changed
- Manual voice-source choosing is disabled.
- The `voiceSourceSelect` field is now a read-only bot result.
- Added `Activate voice source bot (1 minute)` button.
- The bot chooses a voice source using: biome accent + race/category/lineage + gender identity + class/personality/mood/context.
- The locked backend remains the only backend URL used:
  `https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec`

## Export behavior
- Added `Download character voice ZIP`.
- The ZIP contains a shallow folder named `CharacterName_SourceName/`.
- Inside that folder:
  - `manifest.json` embeds the character, accent, source decision, source path, sliders, mood, context, and speech text.
  - `CharacterName_SourceName.wav` is generated from the bot-selected source fingerprint plus the current character profile and typed speech.

## Current GitHub pathing
- GitHub page expected:
  `https://tyrannosaurusdm92.github.io/BelavadosProjects/voice_studio/index.html`
- Current repository resource paths retained and recognized:
  - `r/v/p001/`
  - `r/v/p002/`
  - `r/v/p003/`
- Manifest remains:
  - `s/voices.json`
- Path map remains:
  - `r/v/path_map.json`

## Manual selection lock
- Searching the source library still works for inspection and preview.
- Clicking a source result previews it only.
- Clicking a source result does not change the selected source.
- Only the voice source bot can set `state.selectedSource`.
