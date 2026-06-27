# Quick Start

1. Open `index.html`.
2. Fill in the character's name, gender identity, race/lineage, biome accent, class/archetype, and personality.
3. Press **Think + build voice profile**. The app runs a 60-second profile build unless you press **Finish now**.
4. Type a line in the Speech Lab.
5. Choose mood and context.
6. Use **Preview with browser voice**, **Render downloadable WAV**, or **Ask backend for MP3/WAV**.

## Notes

- The local WAV renderer is intentionally self-contained so the project still exports an audio file even when no external TTS backend is reachable.
- The backend MP3 button uses your Google Apps Script URL. If that endpoint returns an MP3 URL/base64, the app downloads MP3. Otherwise it falls back to WAV.
- Source voice samples are presented as a model/source library for matching and reference selection.


## Windows extraction note

Extract this folder close to the drive root, such as `C:\VoiceStudio\`, for maximum Windows compatibility. This package itself uses short paths, but putting any zip inside many nested Desktop/Downloads folders can still add extra length.
