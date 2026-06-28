# Voice Studio

Voice Studio is a D&D/NPC voice generator that merges the attached voice, TTS, chat-bot, JARVIS, music/prosody, and accent resources into one app without importing unwanted bot personalities.

## What is fully implemented

- Character voice profile builder using **name + gender identity + biome regional accent + race/lineage + class/archetype + personality description**.
- 60-second "thinking" profile build flow with helper agents: Profile Architect, Accent Mapper, Mood Director, Source Matcher, Export Manager, and Safety/Audit Guard.
- Biome accent table using the Belavadös accent map you provided.
- Race, lineage, and gender dropdowns extracted from the supplied Belavadös builder.
- Mood/context controls that alter pitch, pace, roughness, breath, resonance, emphasis, and intonation.
- Local WAV renderer for downloadable synthetic speech sketches when a backend TTS/MP3 service is unavailable.
- Backend connector wired to your Google Apps Script endpoint: `https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec`.
- MP3 export button routed through the backend. If the backend does not return MP3, the app falls back to downloadable WAV and shows a clear status.
- Voice-source browser built from the Coqui voice pack and selected accent atlas samples.
- Local profile saving/loading through browser storage and optional backend profile sync.
- Documentation for integrated and unintegrated code, source manifests, audits, and licenses.

## How to run

Open `index.html` directly in a browser. For best local-file behavior, run a tiny local server from this folder:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Backend behavior

The frontend posts JSON to your Google Apps Script endpoint. It expects any of these response shapes:

```json
{"ok":true,"audioBase64":"...","mimeType":"audio/mpeg","filename":"voice.mp3"}
{"ok":true,"audioUrl":"https://.../voice.mp3"}
{"ok":true,"profileId":"..."}
```

A reference Apps Script implementation is included at `b/backend.gs`. Apps Script does not natively include a high-quality MP3 TTS engine, so the included script handles profile storage, request routing, and a simple WAV fallback. Plug your preferred TTS/MP3 service into `voice.synth.renderWav` / external voice engine routes if your deployed backend supports one.

## Safety / scope

This project is built for fictional D&D/NPC voices. It does not include tools to impersonate real people. Use only voices and samples you own, created, or have permission to use.


## Windows-safe package changes

This edition was rebuilt with very shallow pathing for Windows extraction. The working app files now live at the root and in short folders:

- `s/` app code and JSON data
- `r/v/` voice reference WAV files
- `r/a/` accent reference and atlas files
- `b/` backend reference
- `d/` audits, manifests, licenses, and source notes
- `ad/` integrated adapter code

Original source paths were preserved in `d/path_map.json` as metadata only. They are not used as real folder paths in this zip.

## Bot-locked source selection update

The voice source is no longer user-selected. Press **Activate voice source bot (1 minute)** and the app scores every integrated voice sample against the selected biome regional accent, race/category/lineage, gender identity, class/archetype, personality, mood, and context. The chosen source appears in the locked source field.

The Google Apps Script backend URL is locked in `s/backend-client.js` and mirrored in the page UI. The app should only use:
`https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec`

Use **Download character voice ZIP** to export a shallow folder containing `manifest.json` and `CharacterName_SourceName.wav`.


## Integrated Voice Superbot

The merged Superbot is now part of Voice Studio. Open the **Superbot** section to chat with the voice-building bot, activate the source-decision pass, analyze the current voice build, scan/index local files, save voice-building memories, extract tasks, and check the locked backend. The only backend URL used is `https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec`.
