# Scanner Revision Audit

## Completed

- Kept the project as a scanner now, with eventual Character Studio compatibility.
- Renamed the only HTML file to `character studio.html` for future merge compatibility.
- Replaced the fragile single JavaScript bundle with seven modules.
- Added the required `/css`, `/js`, `/json`, `/docs`, `/tts`, and `/media` folders.
- Added studio-compatible JSON files:
  - `biome-accent-profiles.json`
  - `race-voice-overlays.json`
  - `class-subclass-voice-overlays.json`
  - `gender-identity-voice-overlays.json`
  - `emotion-voice-profiles.json`
  - `scanner-default-profile.json`
- Added 26 emotion profiles.
- Preserved 21 shared 0–10 trait keys and 6 influence IDs.
- Added alignment axis controls.
- Added top/bottom horizontal scroll controls and left/right vertical scroll controls.
- Added extra right-side padding so export and inspector panels do not cut off.
- Added scanner-ready exports: selected JSON, all JSON, selected JS preset, NPC voice card markdown, export manifest.
- Browser preview uses Web Speech only; reference audio remains influence metadata only.

## Safety and design guardrails

- No voice cloning is performed.
- No third-party repository code was bundled into the scanner JavaScript.
- Earth accent names are hidden from player-facing summaries.
- Gender identity overlays are optional presentation layers, not stereotypes or biological claims.
- Naturalness guard caps extreme pitch/speed/roughness/stutter/accent combinations.
