# Scanner-Dominant Studio Merge

The full Belavadös Fantasy Voice Scanner was merged into the current Character Studio.

## Dominant changes

- Scanner JavaScript, JSON, media, and TTS/source assets were copied into shallow Windows-safe folders.
- The studio remains a single-HTML site: `character studio.html`.
- The Voice Studio scan buttons now route through `js/scanner-studio-bridge.js`.
- Scanner `buildVoiceProfile()` is used to resolve race/lineage, gender identity, class/subclass, biome accent, personality, emotion, deep voice math, and local media/source matches.
- Scanner-derived values are applied directly to the existing Voice Studio sliders after the studio's own NPC parser runs.
- Uploaded or recorded audio is optional and is used as a reference; the typed Preview Text remains what is spoken.

## Example

For a pasted character like “Pippin, a trans male necromancy wizard marsh-lineage Dril’thar from a swamp forest biome” plus an uploaded self-recording, **Scan All Inputs** will infer gender identity, class/subclass, race/lineage, swamp/marsh biome accent, rough/croaky texture cues, local scanner asset matches, and then move the Voice Studio sliders to a scanner-dominant base profile.
