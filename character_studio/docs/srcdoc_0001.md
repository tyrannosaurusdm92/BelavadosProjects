# Belavadös Fantasy Voice Simulation Asset Inclusion Audit

Generated: 2026-06-18T23:22:40.551441+00:00

## Correction applied

The first package cataloged audio/TTS paths but did not copy audio binaries because the instruction said the package should be JavaScript-only. This corrected package includes actual audio and TTS assets.

## Included assets

| Asset type | Count | Bytes |
|---|---:|---:|
| Audio files | 2565 | 190784353 |
| TTS resources | 522 | 12706465 |

## Folder policy

- `audio/` contains copied audio binaries from uploaded archives.
- `tts/` contains copied TTS resources from TTS archives and TTS paths.
- `docs/` contains only `.md` and `.json` files.
- `js/audio-reference-catalog.js` includes `localPath` entries pointing to copied assets.
- `docs/AUDIO_TTS_CATALOG.json` mirrors the same included asset catalog.

## World filter behavior

Each copied audio and TTS resource is assigned a deterministic Belavadös reference filter using biome accent, racial category, gender identity, and class. This provides fantasy-world routing without changing or rewriting the original audio files.
