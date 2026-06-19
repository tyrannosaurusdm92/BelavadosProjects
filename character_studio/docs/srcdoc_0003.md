# Belavadös Fantasy Voice Simulation JS with Audio + TTS

A fantasy voice simulation folder generated from the uploaded JavaScript, TTS, audio, and Belavadös world-filter resources.

## What this package contains

- `index.js` — single ES module entry point.
- `js/` — generated Belavadös voice simulation modules and asset routers.
- `source_js/` — copied JavaScript source files discovered inside the uploaded repositories, preserved as JS reference corpus.
- `audio/` — copied audio files from the uploaded archives, preserved under source-archive subfolders.
- `tts/` — copied TTS resources from TTS-named archives and TTS/internal TTS paths, preserved under source-archive subfolders.
- `docs/` — Markdown/JSON only: README, manifests, source audit, audio/TTS catalog, licenses, and implementation audit.

## What was filtered into the world

The package keeps the Belavadös world identity layer and intentionally ignores the numeric deep voice math from the JSON pack:

- 22 racial categories.
- 156 race names.
- 17 biome accent carriers.
- 14 classes and 112 subclasses.
- 14 gender identities.
- 2565 audio files copied and mapped into Belavadös reference filters.
- 522 TTS resources copied and mapped into Belavadös reference filters.
- 118 JavaScript files copied into the source corpus.

## Included asset routing

Use `getReferenceSuggestions()` for character-filtered audio suggestions and `getTtsResourceSuggestions()` for character-filtered TTS resources.

```js
import { createFantasyVoiceProfile, getReferenceSuggestions, getTtsResourceSuggestions } from './index.js';

const character = {
  name: "Reefborn Dril'thar Cleric",
  race: "Dril'thar",
  biome: 'Underwater With Reefs',
  className: 'Cleric',
  genderIdentity: 'Non-Binary'
};

const profile = createFantasyVoiceProfile(character);
const audio = getReferenceSuggestions(character, 5);
const tts = getTtsResourceSuggestions(character, 5);

console.log(profile.selected);
console.log(audio.references.map(ref => ref.localPath));
console.log(tts.resources.map(ref => ref.localPath));
```

## Docs-folder rule

`docs/` contains only `.md` and `.json` files. Audio and TTS assets are intentionally outside `docs/`.

## Important scope note

The package does not claim ownership or relicense third-party source material. See `docs/LICENSES.md`, `docs/LICENSES.json`, and `docs/SOURCE_AUDIT.json` for detected license/readme/source information.
