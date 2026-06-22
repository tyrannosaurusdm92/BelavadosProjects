# Full Merge Audit

## Inputs merged

1. `simulated-fantasy-voices-scanner_studio-compatible.zip`
2. `Belavados_Fantasy_Voice_Simulation_JS_with_Audio_TTS.zip`
3. `Belavados_Deep_Voice_Math_24_JSON_Pack.zip`

## Absorption counts

```json
{
  "voicePackageFiles": 3230,
  "audioReferences": 2566,
  "sourceReferences": 590,
  "deepMathFiles": 24,
  "deepMathRuntimeCounts": {
    "categories": 22,
    "races": 156,
    "classes": 14,
    "genderIdentities": 14,
    "biomeAccentCarriers": 17
  },
  "assetTypeCounts": {
    "audio": 2566,
    "source": 590,
    "json": 21,
    "doc": 34,
    "image": 19
  },
  "maxRelativePathLength": 22
}
```

## Scanner changes

- Embedded base scanner JSON in `js/scanner-json-data.js` so the scanner can load locally without browser JSON fetch issues.
- Embedded deep voice math in `js/deep-voice-math-data.js`.
- Embedded asset index in `js/asset-index-data.js`.
- Added `scanner-deep-math.js` to apply the 24-file deep math pack as runtime slider/vector shaping.
- Added `scanner-assets.js` to match local audio references to generated fantasy voice profiles.
- Added matched audio reference playback in the right panel.
- Kept player-facing output fantasy-named; Earth accent inspirations stay developer-only.

## Safety note

Audio references are used as corpus/timing/humanization metadata and playable local samples. They are not used for voice cloning or impersonation.
