# Optional Local TTS Notes

Local or third-party TTS engines can be added later outside this static scanner package. Any future integration should consume the exported `belavados.voiceProfile.v1` JSON and respect:

- `voice.traits`
- `voice.influences`
- `voice.mathHints`
- `voice.fantasyAccent`
- `voice.baseAccentVisibleToPlayer: false`

Do not expose Earth-language accent names in normal player-facing output.
