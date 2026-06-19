# Belavadös Character Studio — Scanner-Dominant Merge

This build keeps a single user-facing HTML file: `character studio.html`.

The fantasy voice scanner has been merged into the studio as the dominant scan/programming layer. Scanner JavaScript, JSON, media, and TTS/source assets are included in shallow Windows-safe folders. The studio scan buttons now route through the scanner bridge, which scans pasted JSON/text plus optional uploaded or recorded audio references and applies scanner-derived slider values to the Voice Studio.

## Main flow

1. Open `character studio.html`.
2. Paste JSON or plain personality text.
3. Optionally upload or record your own voice as a roleplay reference.
4. Press **Scan All Inputs** or **Scan Selected Clips**.
5. The scanner resolves race/lineage, gender identity, class/subclass, biome accent, personality, emotion, and local media/TTS/source matches.
6. The studio sliders are moved automatically to the scanner base voice.
7. Preview or export the NPC voice JavaScript.

## Safety/intent

The uploaded or recorded audio is treated as user-owned/consented reference material. The typed preview text remains the text spoken by the browser. The scanner applies fantasy voice-shaping, not non-consensual impersonation.
