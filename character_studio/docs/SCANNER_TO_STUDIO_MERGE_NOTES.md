# Belavadös Simulated Fantasy Voices Scanner — Merge Instructions for Future Character Studio Integration

**Purpose:** This file merges the expanded Belavadös biome/accent lineage rules with the Character Studio control inventory so the **Simulated Fantasy Voices Scanner** can be built now and cleanly merged into the larger **Character Studio** later.

**Main rule:** the scanner must speak the same internal language as the studio. The scanner may have a simpler interface, but its exported JSON, slider keys, influence fields, biome accent names, race/class/gender/personality overlays, and voice math names must match the studio wherever possible.

---

## 1. Product Boundary

### Scanner now

The scanner is a lightweight voice-profile builder and analyzer. It should:

1. Import or paste NPC/race/class/gender/personality/biome data.
2. Scan that data for voice-relevant traits.
3. Apply biome-first accent logic.
4. Apply race, lineage, bloodline, class, subclass, gender identity, personality, and emotion overlays.
5. Convert friendly user-facing choices into normalized engine values.
6. Preview the resulting voice using browser-safe speech synthesis where possible.
7. Export studio-ready voice profiles as JSON and optional JavaScript preset modules.
8. Keep all Earth-language accent labels hidden from normal fantasy-facing output.

### Studio later

The Character Studio will be the larger editing environment. It should:

1. Use the same slider IDs and internal keys.
2. Load scanner exports without conversion problems.
3. Expand scanner profiles into deeper playback, recording, imported-audio analysis, export, and editing workflows.
4. Keep the scanner as either:
   - a tab inside `character studio.html`, or
   - a reusable module loaded by the Character Studio.

---

## 2. Required Folder Structure

The scanner should use the same broad project layout that will eventually merge into the studio.

```text
simulated-fantasy-voices-scanner/
├── character studio.html
├── css/
│   └── scanner.css
├── js/
│   ├── scanner-core.js
│   ├── scanner-ui.js
│   ├── scanner-parser.js
│   ├── scanner-voice-mapper.js
│   ├── scanner-preview.js
│   ├── scanner-exporter.js
│   └── scanner-data-loader.js
├── json/
│   ├── biome-accent-profiles.json
│   ├── race-voice-overlays.json
│   ├── class-subclass-voice-overlays.json
│   ├── gender-identity-voice-overlays.json
│   ├── emotion-voice-profiles.json
│   └── scanner-default-profile.json
├── docs/
│   ├── README.md
│   ├── AUDIT.md
│   ├── MANIFEST.md
│   ├── LICENSES.md
│   ├── CHANGELOG.md
│   └── SCANNER_TO_STUDIO_MERGE_NOTES.md
├── tts/
│   ├── README.md
│   └── optional-local-tts-notes.md
└── media/
    ├── samples/
    └── assets/
```

### Folder rules

- Use **one HTML file only**: `character studio.html`.
- Do not create separate scanner HTML pages.
- Use at least **5 JavaScript files** so the scanner does not become a giant fragile single-script project.
- Keep `/docs` for audits, manifests, licenses, merge notes, and explanations.
- Keep `/json` for editable data packs.
- Keep `/tts` for optional future local/third-party TTS notes, not required browser playback code.
- Keep `/media` for samples, reference audio, and visual assets.

---

## 3. Frontend vs Backend-like Layers

### Frontend / visible-to-user layer

The visible layer is for friendly controls only:

- `character studio.html`
- simple labels
- scanner tabs
- import/paste areas
- race/class/gender/personality selectors
- biome selector
- emotion selector
- sliders
- preview buttons
- export buttons
- short explanations

The frontend must not expose complicated acoustic math unless the user opens an advanced/developer section.

### Backend-like / hidden programming layer

The hidden programming layer lives in `/js/*.js`.

It translates friendly controls into:

- pitch
- rate
- formality
- emotional delivery
- cadence
- pause spacing
- accent shaping
- race overlays
- lineage and bloodline overlays
- class/subclass overlays
- gender identity overlays
- personality overlays
- browser voice scoring
- audio-reference hints
- export-ready JSON

The voice math reference is represented through:

- source-filter modeling
- formant scaling
- STFT/spectrogram concepts
- mel/MFCC-like timbre features
- LPC-style envelope helpers
- PSOLA-style pitch/duration scheduling
- vocoder parameter building
- jitter/shimmer/tremor/roughness
- prosody contours
- accent phoneme coloring
- emotion curves
- speaker-reference analysis

The scanner does not have a server backend. It is a static, browser-based engine with backend-like JavaScript modules.

---

## 4. User-Facing Rule: Fantasy Names First

The scanner can use Earth accent inspirations internally as development references, but the user-facing fantasy project should prefer the fantasy accent names.

### Allowed in developer docs

- “Base accent inspiration”
- Portuguese, Japanese, Thai, Welsh, French, German, etc.
- Internal mapping tables
- Audit notes
- Developer-only reference explanations

### Avoid in normal fantasy-facing output

NPC exports, character cards, spoken introductions, and player-facing text should not say things like:

- “This NPC has a German accent.”
- “This elf speaks with a French accent.”
- “This race uses a Japanese accent.”

Instead, use fantasy names:

- Rootmere Cant
- Highbranch Lilt
- Reefglass Lilt
- Stonehollow Echo
- Tidecrest Cant

### Example

Developer/internal:

```json
{ 
  "fantasyAccent": "Rootmere Cant",
  "baseAccentInspiration": "German",
  "baseAccentVisibleToPlayer": false
}
```

Player-facing:

```text
Voice: Rootmere Cant, softened by elven vowel flow and deep-forest cadence.
```

---

## 5. Main Scanner Logic

The scanner must resolve voice in this order:

```text
1. Read/import NPC data
2. Detect or select biome
3. Detect race / ancestry / lineage / bloodline
4. Detect class and subclass
5. Detect gender identity if provided
6. Detect personality and emotional tone
7. Apply user influence sliders
8. Build normalized voice profile
9. Apply naturalness guard
10. Preview voice
11. Export studio-ready profile
```

### Most important rule

**Biome comes before broad ancestry when the body, culture, or community depends on environment.**

This prevents one-size-fits-all race voices.

Examples:

- Sea Elf does not automatically use the same voice as Wood Elf.
- Grassland Dril’thar, swamp Dril’thar, reef Dril’thar, and ocean Dril’thar must diverge.
- Warforged voice follows maker culture and operating environment.
- Birdfolk voice follows flight environment.
- Plantfolk voice follows growth pattern.
- Beastfolk voice follows animal ecology and home biome.

---

## 6. Biome Accent Decision Chain

Use this priority order:

```text
Exact lineage biome
→ settlement biome
→ cultural upbringing biome
→ race-family biome preference
→ fallback biome
→ neutral/base voice
```

### Biome-first examples

| Character | Scanner should choose |
|---|---|
| Reef Sea Elf underwater | Reefglass Lilt |
| Deep-water Sea Elf | Deepcurrent Song |
| Coastal Sea Elf trader | Brightshore Flow |
| Wood Elf on forest floor | Rootmere Cant |
| Wood Elf in treetop academy | Highbranch Lilt |
| Underdark Drow | Stonehollow Echo |
| Swamp exile Drow | Mirecurl Drawl |
| Grassland Dril’thar | Plainwind Common |
| Swamp Dril’thar | Mirecurl Drawl |
| Reef Dril’thar underwater | Reefglass Lilt |
| Reef Dril’thar above water | Wavebloom Welcome |
| Ocean floating-settlement Dril’thar | Tidecrest Cant |
| Deep-ocean Dril’thar | Deepcurrent Song |
| Deep forge Warforged | Stonehollow Echo |
| Village Autognome | Millfield Practical |
| Shipboard construct | Tidecrest Cant |

---

## 7. Required Scanner Inputs

The scanner should accept any of these:

### Manual form input

- character name
- race / ancestry
- lineage / bloodline
- biome
- settlement type
- class
- subclass
- gender identity
- personality notes
- current emotion
- speech sample text
- optional uploaded/recorded reference audio

### Pasted text input

The scanner should parse rough text like:

```text
A swamp Dril’thar grave-cleric with a protective personality, tired voice, and old wetland prophecy cadence.
```

Expected scan:

```json
{
  "race": "Dril’thar",
  "lineage": "Swamp Dril’thar",
  "biome": "Marshes and Swamps",
  "class": "Cleric",
  "emotion": "Exhaustion",
  "personalityTags": ["protective", "prophetic", "tired"],
  "fantasyAccent": "Mirecurl Drawl"
}
```

### JSON input

The scanner should accept partial JSON and fill missing values with defaults.

```json
{
  "name": "Velrassa",
  "race": "Sea Elf",
  "biome": "Underwater With Reefs",
  "class": "Wizard",
  "subclass": "Bladesinger",
  "genderIdentity": "Demi-Female",
  "emotion": "Awe",
  "personality": "careful, elegant, formal, curious"
}
```

---

## 8. Studio-Compatible Voice Profile Schema

Every scanner export should be compatible with the future Character Studio.

```json
{
  "schemaVersion": "belavados.voiceProfile.v1",
  "source": "simulated-fantasy-voices-scanner",
  "character": {
    "name": "",
    "race": "",
    "lineage": "",
    "bloodline": "",
    "class": "",
    "subclass": "",
    "genderIdentity": "",
    "biome": "",
    "settlementType": "",
    "personalityText": "",
    "emotion": "Neutral / Base"
  },
  "voice": {
    "fantasyAccent": "",
    "baseAccentInspiration": "",
    "baseAccentVisibleToPlayer": false,
    "traits": {
      "pitch": 5,
      "speed": 5,
      "inflection": 5,
      "stutter": 1,
      "breath": 3,
      "roughness": 2,
      "resonance": 5.5,
      "formality": 5.5,
      "vowelFlow": 5,
      "consonantBite": 5,
      "mouthShape": 5,
      "nasality": 5,
      "throatDepth": 5,
      "rhythm": 5,
      "pauseControl": 5,
      "emphasis": 5,
      "warmth": 5,
      "clarity": 6,
      "projection": 5,
      "humanVariation": 5,
      "accentColor": 7
    },
    "influences": {
      "influenceRace": 100,
      "influenceGender": 100,
      "influencePersonality": 100,
      "influenceBiome": 100,
      "influenceBaseAudio": 45,
      "emotionIntensity": 75
    },
    "alignmentAxes": {
      "axisAltruism": 1500,
      "axisLawfulness": 1500,
      "axisCooperation": 1500,
      "axisHonor": 1500
    },
    "mathHints": {
      "sourceFilter": true,
      "formants": true,
      "stft": true,
      "mel": true,
      "lpc": true,
      "psola": true,
      "vocoder": true,
      "jitterShimmer": true,
      "prosody": true,
      "emotionCurves": true,
      "accentPhonemeColoring": true
    },
    "exportNotes": []
  }
}
```

---

## 9. Main Voice Studio Sliders

These are the modern 0–10 sliders shared by scanner and studio.

| User-facing name | Internal key | Range | Default | What it controls underneath |
|---|---:|---:|---:|---|
| Voice Height | `pitch` | 0–10 | 5.0 | Base pitch, F0, semitone shift, browser voice scoring. |
| Speaking Speed | `speed` | 0–10 | 5.0 | Speech rate, duration, pacing. |
| Expression Shape | `inflection` | 0–10 | 5.0 | Pitch motion, melody, phrase movement. |
| Hesitations | `stutter` | 0–10 | 1.0 | Stutter chance, hesitation text, pause behavior. |
| Softness | `breath` | 0–10 | 3.0 | Airiness/softness without static. |
| Gruff Edge | `roughness` | 0–10 | 2.0 | Rough cadence, jitter/shimmer hints, gruff stress. |
| Body / Depth | `resonance` | 0–10 | 5.5 | Fullness, formant scale, chest/body feel. |
| Speech Style | `formality` | 0–10 | 5.5 | Formality, articulation, carefulness. |
| Vowel Flow | `vowelFlow` | 0–10 | 5.0 | Clipped vs stretched vowels. |
| Consonant Bite | `consonantBite` | 0–10 | 5.0 | Soft vs sharp consonants. |
| Mouth Shape | `mouthShape` | 0–10 | 5.0 | Closed/open mouth feel. |
| Nasal Color | `nasality` | 0–10 | 5.0 | Oral vs nasal color. |
| Throat Depth | `throatDepth` | 0–10 | 5.0 | Forward vs back/throaty resonance. |
| Speech Rhythm | `rhythm` | 0–10 | 5.0 | Even vs bouncy cadence. |
| Pause Space | `pauseControl` | 0–10 | 5.0 | Tight vs spacious phrase timing. |
| Word Emphasis | `emphasis` | 0–10 | 5.0 | Gentle vs strong stress. |
| Warmth | `warmth` | 0–10 | 5.0 | Cool vs warm delivery. |
| Clarity | `clarity` | 0–10 | 6.0 | Muttered vs clear articulation. |
| Projection | `projection` | 0–10 | 5.0 | Quiet/private vs projected/outward. |
| Human Variation | `humanVariation` | 0–10 | 5.0 | Mechanical steadiness vs lifelike micro-variation. |
| Accent Color | `accentColor` | 0–10 | 7.0 | Removes/strengthens accent mouth-feel. |

---

## 10. Percentage Sliders

| User-facing name | ID | Range | Default |
|---|---|---:|---:|
| Race / Ancestry Influence | `influenceRace` | 0–100% | 100% |
| Gender Identity Influence | `influenceGender` | 0–100% | 100% |
| Personality Influence | `influencePersonality` | 0–100% | 100% |
| Accent Strength / Remove Accent | `influenceBiome` | 0–100% | 100% |
| Uploaded / Recorded Voice Influence | `influenceBaseAudio` | 0–100% | 45% |
| Emotion Strength | `emotionIntensity` | 0–100% | 75% |

### Influence behavior

- `0%` means that layer should contribute nothing or almost nothing.
- `50%` means the layer contributes moderate shaping.
- `100%` means the layer applies normally.
- Influences should multiply overlays, not replace the base profile.
- The scanner should never let a single overlay make the voice unusable or robotic.

---

## 11. Other Numeric Controls

| Name | ID | Range | Default |
|---|---|---:|---:|
| Names to Generate | `count` | 1–100 | 10 |
| Race Lore Naming Influence | `nameInfluence` | 0–100% | 82% |
| Altruism | `axisAltruism` | 0–3000 | 1500 |
| Lawfulness | `axisLawfulness` | 0–3000 | 1500 |
| Cooperation | `axisCooperation` | 0–3000 | 1500 |
| Honor | `axisHonor` | 0–3000 | 1500 |
| Top horizontal scroll | `top-x-scroll` | 0–1000 | 0 |
| Bottom horizontal scroll | `bottom-x-scroll` | 0–1000 | 0 |
| Left vertical scroll | `left-y-scroll` | 0–1000 | 0 |
| Right vertical scroll | `right-y-scroll` | 0–1000 | 0 |

### Scanner-specific note

The scanner does not need to expose all scroll controls unless it shares the exact studio layout. However, if the scanner is built inside `character studio.html`, preserve these IDs for layout compatibility.

---

## 12. Emotion Choices

The scanner and studio should share these 26 emotions:

1. Neutral / Base
2. Kindness
3. Compassion
4. Tenderness
5. Joy
6. Excitement
7. Calm
8. Annoyance
9. Sarcasm
10. Suspicion
11. Gruffness
12. Anger
13. Rage
14. Betrayal
15. Grief
16. Fear
17. Panic
18. Exhaustion
19. Authority
20. Courage
21. Shame
22. Awe
23. Confidence
24. Flirtation
25. Menace
26. Wonder

### Emotion handling

Each emotion should adjust:

- pitch contour
- speaking speed
- pause spacing
- emphasis
- breath
- roughness
- warmth
- clarity
- projection
- phrase length
- punctuation shaping

Emotion should never erase ancestry, biome, or personality. It should sit on top as a performance state.

---

## 13. Recommended Scanner JavaScript Modules

The final studio may have 36+ hidden modules, but the scanner should start with a clean minimum module set that maps into those later modules.

| Scanner file | Purpose | Future studio equivalent |
|---|---|---|
| `scanner-core.js` | Defaults, normalized profile, shared keys, safety clamps. | `voice-core.js`, `voice-naturalness-guard.js` |
| `scanner-ui.js` | Form controls, buttons, preview/export UI, state display. | `voice-studio-ui.js` |
| `scanner-parser.js` | Reads pasted text/JSON and extracts NPC traits. | `voice-json-mapper.js` |
| `scanner-voice-mapper.js` | Applies biome/race/class/gender/personality/emotion overlays. | `voice-biome-accents.js`, `voice-emotions.js` |
| `scanner-preview.js` | Browser speech preview, voice scoring, playback control. | `voice-speech-api.js`, `voice-playback-hub.js` |
| `scanner-exporter.js` | Exports studio-ready JSON/JS. | `voice-exporter.js` |
| `scanner-data-loader.js` | Loads JSON packs and manifests. | `voice-presets.js`, `voice-data.js` |

---

## 14. Future Full Studio Hidden Modules

When merged into the full Character Studio, these are the expected backend-like modules and their jobs.

| File | Hidden job |
|---|---|
| `voice-core.js` | Main trait list, default profile, slider normalization, profile-to-engine mapping. |
| `voice-studio-ui.js` | Main UI controller, buttons, state, preview/export workflow. |
| `voice-vocal-model.js` | Smoothed browser-safe vocal model. |
| `voice-prosody-engine.js` | Main speech preview engine: text shaping, accent shaping, phrase grouping. |
| `voice-speech-api.js` | Browser speech wrapper and voice-selection scoring. |
| `voice-naturalness-guard.js` | Prevents deep/high voices from using robotic pitch extremes. |
| `voice-playback-hub.js` | Ensures one preview plays at a time; handles play/pause/stop/seek. |
| `voice-emotions.js` | Emotion profiles and emotion-based adjustments. |
| `voice-biome-accents.js` | Fantasy biome accent profiles, race/class overlay application. |
| `voice-json-mapper.js` | Parses NPC JSON/plain text into race/class/gender/personality voice settings. |
| `voice-analysis.js` | Analyzes uploaded/recorded audio. |
| `voice-recorder.js` | Microphone recording helper. |
| `voice-exporter.js` | Builds exported NPC JavaScript/JSON. |
| `voice-synthesis.js` | Speech preview fallback and older oscillator fallback. |
| `voice-presets.js` | Loads taxonomy/presets. |
| `voice-humanization-engine.js` | Applies media/resource-derived timing and humanization cues. |
| `voice-generator-pack.js` | Large compiled race/class/subclass pack. |
| `voice-generator-pack-runtime.js` | Lookup helpers for the compiled voice pack. |
| `voice-speech-pattern-pack.js` | Embedded speech-pattern JSON pack. |
| `voice-humanization-references.js` | Derived reference metadata from included media/resources. |
| `voice-reference-audio-learning.js` | Derived audio-learning reference metadata. |
| `voice-math-core.js` | Shared math helpers. |
| `voice-math-source-filter.js` | Source-filter voice model. |
| `voice-math-stft.js` | STFT/spectrogram utilities. |
| `voice-math-mel.js` | Mel/MFCC-like timbre math. |
| `voice-math-lpc.js` | LPC-style formant envelope helpers. |
| `voice-math-formants.js` | Formant scaling/filter-bank logic. |
| `voice-math-instability.js` | Jitter, shimmer, tremor, roughness math. |
| `voice-math-psola.js` | PSOLA-style pitch/duration scheduling. |
| `voice-math-vocoder.js` | Transparent vocoder parameter builder. |
| `voice-math-prosody.js` | Prosody contour math. |
| `voice-math-accent-phoneme.js` | Fantasy accent phonetic text coloring. |
| `voice-math-emotion-curves.js` | Emotion curve math. |
| `voice-math-evaluation.js` | Evaluation metric helpers. |
| `voice-math-speaker-reference.js` | Uploaded/recorded speaker-reference helpers. |
| `voice-data.js` | Data/audio manifest bootstrap stub. |

---

## 15. Preview Workflow

When the user presses **Preview**, the scanner should follow this path:

```text
User changes sliders / selects race / adds personality text
→ scanner-ui.js stores profile + influences + NPC data
→ scanner-parser.js interprets JSON or plain personality notes
→ scanner-voice-mapper.js applies biome/race/class/gender/personality/emotion overlays
→ scanner-core.js converts friendly sliders into normalized engine values
→ scanner-preview.js chooses a browser voice and speaks preview text
→ scanner-exporter.js keeps the profile ready for download/export
```

When merged into the studio, the path becomes:

```text
User changes sliders / selects race / adds personality text
→ voice-studio-ui.js stores profile + influences + NPC data
→ voice-json-mapper.js interprets JSON or plain personality notes
→ voice-biome-accents.js applies biome/race/class accent profile
→ voice-humanization-engine.js adds media/resource-derived timing cues
→ voice-core.js converts friendly sliders into engine values
→ voice-vocal-model.js builds safe pitch/rate/phrase model
→ voice-prosody-engine.js shapes typed text and accent cadence
→ voice-speech-api.js chooses a browser voice and speaks it
→ voice-playback-hub.js makes sure only one preview plays at once
```

The uploaded or recorded audio is used as a **reference**, not as forced playback.

The scanner may analyze pitch, tone, timing, and humanization hints from a reference clip, but the text box still decides what the voice says.

---

## 16. Naturalness Guard Rules

The scanner must clamp unsafe or unnatural combinations.

### Examples

- Very high pitch + high speed + high inflection should be softened.
- Very low pitch + high roughness + low clarity should be prevented from becoming unintelligible.
- High stutter should add hesitation lightly, not make every word broken.
- High accent color should shape vowels/consonants, not produce parody text.
- Breath should mean softness/airiness, not static or noise.
- Roughness should mean performance texture, not broken playback.

### Clamp approach

```text
1. Normalize all sliders to 0–1.
2. Apply overlays.
3. Clamp extreme totals.
4. Smooth pitch/rate/emphasis.
5. Preserve intelligibility.
6. Export both raw slider values and final computed values.
```

---

## 17. Race / Lineage Overlay Rules

Race overlays should modify the biome accent rather than replace it.

### Broad examples

| Race family | General overlay behavior |
|---|---|
| Humans / near-humans | Clearest and closest to biome base. |
| Elven peoples | Smoother vowels, lighter consonants, musical rhythm. |
| Dwarven / gnomish kin | Lower, denser, clipped, stronger consonants. |
| Halflings / smallfolk | Warmer, quicker, friendlier, softer. |
| Orcs / goblinoids | Rougher, more forceful, punchier syllables. |
| Giantkin | Larger projection, slower weight, broader pauses. |
| Draconic / reptilian | Throat depth, command, pressure, growl hints. |
| Planar bloodlines | Add radiant, infernal, elemental, astral, or shadow tone depending bloodline. |
| Undead / death-touched | Hollow pauses, older resonance, breath restraint. |
| Fey / trickster folk | Lilt, surprise timing, playful phrase turns. |
| Elemental peoples | Rhythm and texture follow fire, water, air, earth, storm, ice, etc. |
| Psionic / astral / alien minds | Measured pauses, strange emphasis, calm intensity. |
| Constructs | Mechanical precision, maker-culture accent, operating-environment resonance. |
| Birdfolk | Airflow, sharpness, sky/canopy/cliff/coast rhythm. |
| Beastfolk | Animal ecology affects rhythm, projection, mouth shape, and consonants. |
| Aquatic peoples | Fluid timing, pressure-aware phrasing, water-type divergence. |
| Insectoid / ooze / aberrant | Chitin clicks, soft slurs, strange timing, alien stress patterns. |
| Plantfolk | Growth pattern, root/vine/flower/fungal/crop rhythm. |
| Shadow / umbral peoples | Quiet pressure, darker vowels, lower projection. |
| Experimental hybrids | Blend source ecology and creator culture. |
| Wilderness humanoids | Practical, local, survival-shaped speech. |
| Miscellaneous | Use closest biome + body-plan + culture match. |

---

## 18. Class and Subclass Overlay Rules

Class overlays should affect delivery style, not erase ancestry or biome.

| Class type | Speech effect |
|---|---|
| Bard | More melodic, expressive, performative, story-shaped. |
| Cleric | Ritualistic, careful, blessing-like, reverent. |
| Druid | Natural, seasonal, ecology-aware, grounded. |
| Fighter | Direct, practical, steady, command-ready. |
| Barbarian | Bigger projection, rougher stress, physical cadence. |
| Paladin | Formal, declarative, oath-heavy, protective. |
| Rogue | Quicker, quieter, more compressed, secretive. |
| Ranger | Practical, observant, terrain-aware. |
| Wizard | Precise, structured, scholarly. |
| Sorcerer | Emotionally charged, instinctive, dramatic. |
| Warlock | Bargain-coded, uncanny, patron-shaped. |
| Monk | Controlled, even, breath-aware. |
| Artificer | Technical, workshop-practical, measured. |
| Blood Hunter | Restrained, haunted, intense. |
| Psionic subclasses | Long pauses, deliberate emphasis, mental pressure. |

Subclass should add a light specialty layer. Example: a College of Spirits Bard sounds more elegiac, ancestral, and story-ritualistic than a general Bard.

---

## 19. Gender Identity Overlay Rules

Gender identity can influence speech patterns only as an optional character-performance layer. It should never become stereotype, caricature, or biological determinism.

### Supported identities

- Cis-Male
- Cis-Female
- Demi-Male
- Demi-Female
- Non-Binary
- Trans-Male
- Trans-Female
- Gender-Fluid
- Agender
- Gender-Less
- Gender-Flexible
- Bi-Gender
- Poly-Gender
- Neutrois

### Design rules

- Gender identity influence must be controlled by `influenceGender`.
- At 0%, gender identity should not shape the voice.
- Gender identity should mostly affect presentation style, pitch comfort, resonance preference, inflection flexibility, and social delivery.
- Never hard-lock a gender identity to a pitch.
- Allow character-specific override.
- Do not force binary male/female voice categories.
- Use “voice presentation” rather than “real-world gender truth.”

---

## 20. Personality Overlay Rules

Personality should adjust delivery after biome/race/class/gender are resolved.

### Examples

| Personality note | Voice adjustment |
|---|---|
| Gentle | More warmth, softer consonants, slower emphasis. |
| Stern | More formality, sharper consonants, lower warmth. |
| Nervous | More hesitation, quicker phrase starts, smaller projection. |
| Confident | Stronger projection, clearer articulation, firmer pauses. |
| Ancient | Slower rhythm, deeper pauses, heavier resonance. |
| Playful | More inflection, bouncier rhythm, warmer tone. |
| Secretive | Lower projection, tighter vowels, shorter phrases. |
| Haunted | More breath restraint, longer pauses, lower warmth. |
| Protective | Steady projection, firm emphasis, calm authority. |
| Scholarly | Higher clarity, formality, structured pacing. |

---

## 21. Export Requirements

The scanner should export:

1. `voice-profile.json`
2. optional `voice-profile.js`
3. optional `scanner-export-manifest.json`
4. optional `npc-voice-card.md`

### JSON export must include

- original input
- parsed traits
- selected biome
- selected fantasy accent
- hidden base accent inspiration
- race/lineage/bloodline overlay
- class/subclass overlay
- gender identity overlay
- personality overlay
- emotion overlay
- raw slider values
- final computed values
- warnings or fallback notes
- studio compatibility version

### Export warning examples

```json
[
  "No biome provided; used race-family fallback.",
  "Base accent inspiration is hidden from player-facing output.",
  "Reference audio was analyzed as influence only, not cloned or forced."
]
```

---

## 22. Import Requirements for Studio Merge

The Character Studio must be able to import scanner exports by checking:

```text
schemaVersion
source
character
voice.traits
voice.influences
voice.alignmentAxes
voice.fantasyAccent
voice.mathHints
```

If future studio settings add more controls, the scanner export should still load by applying defaults for missing fields.

---

## 23. UI Layout Rules

The scanner UI should be clear and not cramped.

### Required layout behavior

- Add padding to every menu/module.
- Add extra right-side padding so import/export panels do not cut off.
- Keep central slider panels readable and not squished.
- Use responsive wrapping instead of forcing tiny columns.
- Preserve horizontal scrolling only when content genuinely overflows.
- Keep top and bottom horizontal scroll controls synchronized if they are present.
- Keep left and right vertical scroll controls synchronized with their panels if present.
- Make import/export buttons visible and reachable.
- Show a generated voice summary after scanning.

### Suggested scanner tabs

1. Import / Paste
2. Character Traits
3. Biome & Accent
4. Race / Lineage / Bloodline
5. Class / Subclass
6. Gender / Personality
7. Emotion
8. Voice Sliders
9. Preview
10. Export
11. Developer Notes

---

## 24. Scanner Summary Output

After scanning, show a readable summary like this:

```text
Character Voice Scan

Fantasy Accent:
Mirecurl Drawl

Resolved from:
Marshes and Swamps biome + Swamp Dril’thar lineage

Voice Shape:
Slow, earthy, wetland-rooted, protective, prophetic, slightly exhausted.

Applied overlays:
- Biome: Marshes and Swamps
- Race/Lineage: Dril’thar, swamp ecology
- Class: Cleric, ritual and blessing cadence
- Personality: protective, prophetic
- Emotion: Exhaustion at 75%

Studio export:
Ready
```

---

## 25. Scanner Error / Fallback Rules

Do not fail silently.

| Problem | Scanner behavior |
|---|---|
| No biome | Ask user to choose or use best race/culture fallback. |
| No race | Use biome-only voice profile. |
| No class | Skip class overlay. |
| Unknown race | Use broad category if detectable, otherwise miscellaneous. |
| Unknown biome | Use closest biome by keywords, then warn. |
| Conflicting biome data | Prefer lived/current biome, then upbringing, then ancestry. |
| Extreme slider mix | Clamp with naturalness guard and show warning. |
| Missing JSON pack | Use embedded defaults and show warning. |
| No browser voice available | Show text-shaped preview and export profile only. |

---

## 26. Developer Data Model for Biome Accent Profiles

Each biome accent profile should be stored as editable JSON.

```json
{
  "biome": "Marshes and Swamps",
  "fantasyAccentName": "Mirecurl Drawl",
  "baseAccentInspiration": "Louisiana Cajun / Creole-influenced English",
  "baseAccentVisibleToPlayer": false,
  "bestFitRaceCategoryFamilies": [5, 7, 8, 9, 10, 11, 15, 16, 17, 18, 19, 20, 21],
  "baseTraits": {
    "pitch": 4.6,
    "speed": 4.2,
    "inflection": 5.4,
    "stutter": 1.2,
    "breath": 4.3,
    "roughness": 4.4,
    "resonance": 5.8,
    "formality": 4.2,
    "vowelFlow": 6.4,
    "consonantBite": 4.8,
    "mouthShape": 5.8,
    "nasality": 5.4,
    "throatDepth": 6.2,
    "rhythm": 5.8,
    "pauseControl": 6.1,
    "emphasis": 5.2,
    "warmth": 5.8,
    "clarity": 5.4,
    "projection": 4.7,
    "humanVariation": 6.2,
    "accentColor": 7.4
  },
  "lineageRules": [
    "Swamp and marsh Dril’thar use Mirecurl Drawl.",
    "Drowned undead add haunted breath restraint.",
    "Reptilian lineages add throat depth and command pressure.",
    "Ooze and fungal lineages add slower, wetter phrase movement."
  ],
  "classBehavior": {
    "cleric": "slow and steady ritual cadence",
    "ranger": "local and practical",
    "rogue": "secretive, low, and current-hidden",
    "bloodHunter": "haunted and restrained",
    "druid": "rot-and-renewal wise"
  },
  "finalVoiceFeel": "Slow, earthy, wet, lived-in, haunted when death-touched."
}
```

---

## 27. Full Biome/Lineage Reference from Attached Markdown

The attached markdown is the authoritative expanded biome accent table for scanner data entry. It includes:

- all 22 race-category families
- biome accent names
- internal base accent inspirations
- best-fit race family categories
- lineage and bloodline overlay behavior
- class overlay behavior
- final voice feel
- divergence rules
- quick examples

The scanner should convert this reference into `json/biome-accent-profiles.json` and keep the human-readable version in `/docs`.

---

# Appendix A — Expanded Belavadös Biome Accent Table Source

I revised it so the table now covers all 22 Belavadös race-category families from your compendium, and I added lineage/bloodline divergence rules so ancestry follows **biome first** when needed, rather than forcing one accent per race. The compendium’s category index lists the 22 race families, and the Dril’thar notes specifically support splitting grassland, swamp/marsh, rainforest/forest, reef, and ocean lineages by environment.  

# Expanded Belavadös Biome Accent Table

### Includes all 22 race-category families + lineage/bloodline divergence rules

## 22 Race-Category Family Legend

1. Humans, Near-Humans, and Mixed Heritage
2. Elven Peoples
3. Dwarven and Gnomish Kin
4. Halfling and Smallfolk
5. Orcs, Goblinoids, and Brutish Humanoids
6. Giantkin and Powerful Humanoids
7. Draconic and Reptilian Races
8. Celestial, Fiendish, and Planar Bloodlines
9. Undead and Death-Touched Races
10. Fey and Trickster Folk
11. Elemental and Energy-Born Peoples
12. Psionic, Astral, and Alien Minds
13. Constructed and Artificial Beings
14. Birdfolk and Avian Races
15. Beastfolk and Mammalian Anthropomorphs
16. Amphibious and Aquatic Peoples
17. Insectoid, Ooze, and Aberrant Creatures
18. Plantfolk and Nature-Bound Races
19. Shadow, Umbral, and Darkness-Aligned Peoples
20. Animalistic Hybrids and Experimental Races
21. Primitive, Tribal, and Wilderness Humanoids
22. Miscellaneous and Hard-to-Classify Races

---

| Biome                                 | Fantasy accent name     | Base accent inspiration                     | Best-fit race-category families                                                                                                                                                                                                                                                                                                     | Race, lineage, and bloodline overlay behavior                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Class overlay behavior                                                                                                                                                                                  | Final voice feel                                                       |
| ------------------------------------- | ----------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Ocean Surface Floating Settlement** | **Tidecrest Cant**      | Portuguese                                  | 1 Humans; 2 Elven Peoples; 7 Draconic and Reptilian Races; 8 Planar Bloodlines; 11 Elemental and Energy-Born Peoples; 13 Constructed and Artificial Beings; 14 Birdfolk; 16 Amphibious and Aquatic Peoples; 20 Experimental Races; 22 Miscellaneous                                                                                 | Humans sound closest to the base. Elves become breezier and more elegant, especially sea-traders or sky-dock elves. Dwarves and gnomes become harsher, shipwright-like, and practical. Aquatic peoples make it fluid and tide-shaped. **Ocean Dril’thar** use Tidecrest Cant when living in floating settlements, storm-pools, mangrove platforms, or ocean pilgrim ports. Fire, storm, and water Genasi shift the voice toward heat, thunder, or wave rhythm. Warforged and constructs sound like harbor machinery, bells, brass hulls, and pressure valves. | Merchants sound like dock traders; captains, paladins, fighters, and commanders sound declarative; bards sound sea-shanty-like; artificers sound shipyard-practical; clerics sound like tide-priests.   | Open, rolling, maritime, lively, salt-air social.                      |
| **Underwater With Reefs**             | **Reefglass Lilt**      | Japanese                                    | 2 Elven Peoples; 7 Draconic and Reptilian Races; 8 Planar Bloodlines; 11 Elemental Peoples; 16 Amphibious and Aquatic Peoples; 17 Aberrant Creatures; 18 Plantfolk; 20 Experimental Races; 22 Miscellaneous                                                                                                                         | Sea Elves, reef elves, aquatic Kaluseban, merfolk, tritons, reefborn Dril’thar, and coral-adapted beastfolk should use this instead of their dryland family accent. Elves make it delicate and precise. Aquatic races make it especially fluid. Orcish or goblinoid aquatic lineages become abrupt and unusual. Reptilian reef lineages add sharp consonants and controlled throat pressure. Coral plantfolk sound chiming, slow, and breath-light.                                                                                                           | Clerics sound ritualistic and tide-temple formal; mages sound precise; rogues sound muffled, quick, and current-hidden; monks sound calm and suspended; bards sound elegant and glassy.                 | Graceful, clear, flowing, elegant, refracted like light through water. |
| **Underwater Without Reefs**          | **Deepcurrent Song**    | Thai                                        | 7 Draconic and Reptilian Races; 8 Planar Bloodlines; 9 Undead and Death-Touched Races; 11 Elemental Peoples; 12 Psionic / Alien Minds; 16 Amphibious and Aquatic Peoples; 17 Aberrant Creatures; 19 Shadow Peoples; 20 Experimental Races; 22 Miscellaneous                                                                         | Deep-sea peoples, trench lineages, abyssal Dril’thar, deep merfolk, pressure-adapted sea elves, drowned undead, alien aquatic minds, and shadowed waterborn bloodlines use this instead of brighter reef accents. Aquatic races make it almost sung. Dwarven or stone-heavy lineages make it denser and slower. Humans keep it balanced. Aberrant and psionic lineages make pauses longer, stranger, and more hypnotic.                                                                                                                                       | Rangers sound calm and practical; warriors sound clipped and blunt; warlocks sound distant and abyssal; blood hunters sound restrained and haunted; psionic classes sound slow, spaced, and inevitable. | Quiet, deep, rhythmic, mysterious, pressure-heavy.                     |
| **Grassland**                         | **Plainwind Common**    | American Midwest / General North American   | 1 Humans; 3 Dwarven / Gnomish Kin; 4 Halfling and Smallfolk; 5 Orcs / Goblinoids; 6 Giantkin; 11 Elemental Peoples; 14 Birdfolk; 15 Beastfolk; 16 Amphibious Peoples; 18 Plantfolk; 20 Experimental Races; 21 Primitive / Wilderness Humanoids; 22 Miscellaneous                                                                    | Humans stay neutral and plainspoken. Halflings and smallfolk become friendly and neighborly. Orcs become rougher and more direct. Beastfolk become open, vocal, and physical. **Grassland Dril’thar** should use Plainwind Common when they belong to rain-fed ponds, seasonal wetlands, prairie pools, or hidden wetland gardens rather than ocean or swamp culture. Grassland birdfolk sound broad, high, and wind-carried.                                                                                                                                 | Merchants sound practical and familiar; rangers sound natural; warriors sound terse; druids sound weather-aware; farmers and scouts sound easygoing but observant.                                      | Broad, open, easygoing, practical, approachable.                       |
| **Prairie**                           | **Ironstep Cant**       | Russian                                     | 1 Humans; 5 Orcs / Goblinoids; 6 Giantkin; 11 Elemental Peoples; 12 Psionic / Strategic Minds; 14 Birdfolk; 15 Beastfolk; 20 Experimental Races; 21 Primitive / Wilderness Humanoids                                                                                                                                                | Dwarves deepen the accent if present in prairie fortresses or railholds. Elves soften it but keep the width and distance. Beastfolk make it expressive and strong. Hobgoblins, military humans, gnolls, giantkin, and strategy-heavy psionic peoples make it stern, organized, and hard-edged. Prairie birdfolk sound sharp, sky-wide, and watchful.                                                                                                                                                                                                          | Warriors sound stern; scholars sound formal and heavy; bards sound dramatic; fighters and commanders sound order-heavy; monks and psions sound disciplined.                                             | Strong, wide, grounded, hardy, martial when needed.                    |
| **Farming**                           | **Hearthfield Brogue**  | Irish                                       | 1 Humans; 3 Dwarven / Gnomish Kin; 4 Halfling and Smallfolk; 10 Fey and Trickster Folk; 15 Beastfolk; 18 Plantfolk; 20 Experimental Races; 21 Primitive / Wilderness Humanoids; 22 Miscellaneous                                                                                                                                    | Halflings make it especially warm. Dwarves make it earthier. Elves make it lighter and lilting. Plantfolk sound seasonal, patient, and root-wise. Domestic beastfolk and hearthbound experimental races become friendly, food-centered, and communal. Rural undead may soften into old-family melancholy rather than horror.                                                                                                                                                                                                                                  | Farmers and artisans sound practical; clerics sound gentle; bards sound cheerful; druids sound harvest-wise; paladins sound neighborly but firm.                                                        | Friendly, earthy, communal, homely, harvest-warm.                      |
| **Mountain Range**                    | **Cragthane Burr**      | Scottish                                    | 2 Elven Peoples; 3 Dwarven / Gnomish Kin; 5 Orcs / Goblinoids; 6 Giantkin; 7 Draconic / Reptilian Races; 8 Planar Bloodlines; 11 Elemental Peoples; 13 Constructs; 14 Birdfolk; 15 Beastfolk; 18 Plantfolk; 20 Experimental Races; 21 Primitive / Wilderness Humanoids                                                              | Dwarves fit this best and sound very natural. Goliaths, giantkin, stone Genasi, mountain orcs, goatfolk, raptorfolk, avariel, and alpine dragonborn become rugged and breath-heavy. Humans sound cleaner. Orcs sound harsh and mountainous. Avariel and birdfolk make it wind-cut and high-altitude. Snow elves, frost bloodlines, and cold-adapted lineages use Cragthane Burr with frost overlay if no separate arctic biome is available.                                                                                                                  | Warriors sound rugged; scouts sound clipped; scholars sound surprisingly sharp; barbarians sound storm-heavy; clerics sound ancestral; artificers sound stone-and-forge practical.                      | Tough, crisp, resilient, wind-carved.                                  |
| **Valley**                            | **Vinesong Flow**       | Italian                                     | 1 Humans; 2 Elven Peoples; 4 Halfling and Smallfolk; 8 Planar Bloodlines; 10 Fey and Trickster Folk; 11 Elemental Peoples; 15 Beastfolk; 18 Plantfolk; 20 Experimental Races; 22 Miscellaneous                                                                                                                                      | Elves make it smooth and lyrical. Halflings make it warm. Beastfolk make it expressive and lively. Satyrs, fey-touched peoples, flowerfolk, vinebound plantfolk, and charismatic miscellaneous lineages flourish here. Celestial or beautiful planar bloodlines become polished, radiant, and emotionally expressive.                                                                                                                                                                                                                                         | Merchants sound polished; bards sound romantic; clerics sound calm and measured; sorcerers sound passionate; warlocks sound seductive or uncanny depending patron.                                      | Flowing, fertile, elegant, soft, emotionally expressive.               |
| **Deep Cavern**                       | **Stonehollow Echo**    | Welsh                                       | 2 Elven Peoples; 3 Dwarven / Gnomish Kin; 5 Orcs / Goblinoids; 7 Draconic / Reptilian Races; 8 Planar Bloodlines; 9 Undead / Death-Touched Races; 11 Elemental Peoples; 12 Psionic / Alien Minds; 13 Constructs; 16 Amphibious Peoples; 17 Aberrant Creatures; 19 Shadow Peoples; 20 Experimental Races                             | Dwarves and Duergar make it especially resonant. Humans sound clear. Orcs, dragonborn, reptilian peoples, and deep beastfolk make it heavier and more guttural. Drow, deep gnomes, cave Dril’thar, subterranean amphibians, undead, umbral humans, shadow goblins, constructs, and aberrant lineages use Stonehollow Echo when their home is beneath the surface. Warforged sound metallic and measured; psionic cavern peoples sound echo-spaced and exact.                                                                                                  | Mages sound ancient and formal; warriors sound short and echoing; rogues sound low and secretive; artificers sound mechanical and vault-like; clerics sound ancestral or funeral-deep.                  | Echoing, ancient, carved-from-stone, heavy with memory.                |
| **Deep Forest**                       | **Rootmere Cant**       | German                                      | 1 Humans; 2 Elven Peoples; 5 Orcs / Goblinoids; 6 Giantkin; 8 Planar Bloodlines; 9 Undead / Death-Touched Races; 10 Fey and Trickster Folk; 12 Psionic Minds; 14 Birdfolk; 15 Beastfolk; 18 Plantfolk; 19 Shadow Peoples; 20 Experimental Races; 21 Primitive / Wilderness Humanoids                                                | Wood Elves use Rootmere Cant rather than Highbranch Lilt when grounded in forest floor culture. Elves soften the hardness. Beastfolk make it strong and vocal. Humans keep it practical. Firbolgs, tabaxi, wolffolk, bearfolk, forest goblins, shadow elves, plantfolk, fungal lineages, forest Dril’thar, and umbral wilderness peoples all fit here. Drow only use this if they are deep-forest shadow operatives rather than cavern-born.                                                                                                                  | Rangers sound disciplined; scholars sound precise; warriors sound clipped and firm; monks sound controlled and low; druids sound rooted; rogues sound hidden and tense.                                 | Dense, structured, rooted, authoritative, old-growth serious.          |
| **Partial Forest**                    | **Sundapple Tongue**    | Spanish                                     | 1 Humans; 2 Elven Peoples; 4 Halfling and Smallfolk; 5 Orcs / Goblinoids; 10 Fey and Trickster Folk; 14 Birdfolk; 15 Beastfolk; 18 Plantfolk; 20 Experimental Races; 21 Primitive / Wilderness Humanoids                                                                                                                            | Humans sound closest to base. Halflings make it warmer. Elves make it smoother. Mixed woodland-and-town lineages, road fey, edge-forest beastfolk, smallfolk traders, birdfolk scouts, and light-footed goblins use this when they belong between forest and settlement rather than deep wilderness. Plantfolk become more social and sunlit.                                                                                                                                                                                                                 | Merchants sound lively; bards sound expressive; scouts sound relaxed; rogues sound nimble; rangers sound practical but friendly.                                                                        | Flexible, social, sun-dappled, active, borderland-friendly.            |
| **Treetops / Treehouses**             | **Highbranch Lilt**     | French                                      | 2 Elven Peoples; 8 Planar Bloodlines; 10 Fey and Trickster Folk; 12 Psionic / Astral Minds; 14 Birdfolk; 15 Beastfolk; 18 Plantfolk; 19 Shadow Peoples; 20 Experimental Races; 22 Miscellaneous                                                                                                                                     | High Elves, treetop elves, fey-touched scholars, archfey bloodlines, birdfolk, gliding beastfolk, arboreal plantfolk, and elegant miscellaneous peoples use this. Elves make it especially elegant. Humans sound refined. Halflings make it playful if they live in tree-villages. Sea Elves do **not** default here unless raised in aerial or treetop culture; they use reef, deepcurrent, or shore accents instead. Shadow-treetop peoples make it whisper-light and eerie.                                                                                | Bards sound graceful; scholars sound polished; rogues sound light and quick; warlocks sound lyrical and bargain-coded; monks sound airy and controlled.                                                 | Light, elevated, refined, airy, graceful.                              |
| **Marshes and Swamps**                | **Mirecurl Drawl**      | Louisiana Cajun / Creole-influenced English | 5 Orcs / Goblinoids; 7 Draconic / Reptilian Races; 8 Planar Bloodlines; 9 Undead / Death-Touched Races; 10 Fey and Trickster Folk; 11 Elemental Peoples; 15 Beastfolk; 16 Amphibious and Aquatic Peoples; 17 Insectoid / Ooze / Aberrant Creatures; 18 Plantfolk; 19 Shadow Peoples; 20 Experimental Races; 21 Wilderness Humanoids | Halflings make it friendly. Beastfolk make it rhythmic. Orcs make it rough and muddy. **Swamp and marsh Dril’thar** use Mirecurl Drawl, especially lineages tied to spawning pools, rot, renewal, gravewater, and wetland prophecy. Dhampirs, drowned undead, swamp hags, reptilian lineages, ooze-touched peoples, fungal plantfolk, and shadowed marshfolk all fit here.                                                                                                                                                                                    | Rangers sound local and practical; clerics sound slow and steady; rogues sound secretive; blood hunters sound haunted and restrained; druids sound rot-and-renewal wise.                                | Slow, earthy, wet, lived-in, haunted when death-touched.               |
| **Beach and Grass With Water**        | **Brightshore Flow**    | Brazilian Portuguese                        | 1 Humans; 2 Elven Peoples; 4 Halfling and Smallfolk; 7 Draconic / Reptilian Races; 8 Planar Bloodlines; 11 Elemental Peoples; 14 Birdfolk; 15 Beastfolk; 16 Amphibious and Aquatic Peoples; 18 Plantfolk; 20 Experimental Races; 22 Miscellaneous                                                                                   | Humans sound natural. Elves sound breezy. Aquatic races make it very soft and fluid. Shoreline Dril’thar, coastal halflings, beach beastfolk, tide-touched Genasi, reptilian sunning cultures, and water-grass nomads use this when they are coastal but not reef-centered. Sea Elves raised in coastal trade towns may use Brightshore Flow rather than Reefglass Lilt.                                                                                                                                                                                      | Merchants sound relaxed; bards sound sunlit and melodic; warriors sound brisk; clerics sound open and blessing-like; rangers sound shore-practical.                                                     | Warm, coastal, bright, casual, breezy.                                 |
| **Beach and Reefs With Water**        | **Wavebloom Welcome**   | Hawaiian-influenced English                 | 2 Elven Peoples; 4 Halfling and Smallfolk; 7 Draconic / Reptilian Races; 8 Planar Bloodlines; 10 Fey and Trickster Folk; 11 Elemental Peoples; 14 Birdfolk; 15 Beastfolk; 16 Amphibious and Aquatic Peoples; 18 Plantfolk; 20 Experimental Races; 22 Miscellaneous                                                                  | Aquatic races make it strongest. Halflings make it welcoming. Dwarves make it firmer and more grounded if they are reef-builders or harbor-smiths. Dragonborn and reptilian lineages add command and throat-weight. Sea Elves raised around reef communities use Wavebloom Welcome for above-water reef culture and Reefglass Lilt for fully underwater reef culture. Reef Dril’thar, coralborn, turtlefolk, reef Genasi, and tropical birdfolk fit strongly here.                                                                                            | Clerics sound peaceful; bards sound musical; scouts sound light-footed; paladins sound ceremonial and community-protective; druids sound reef-wise.                                                     | Gentle, tropical, wave-like, welcoming, communal.                      |
| **Hybrid Tree and Forest Floor**      | **Bramblewood Burr**    | English West Country                        | 2 Elven Peoples; 3 Dwarven / Gnomish Kin; 4 Halfling and Smallfolk; 10 Fey and Trickster Folk; 14 Birdfolk; 15 Beastfolk; 18 Plantfolk; 20 Experimental Races; 21 Primitive / Wilderness Humanoids                                                                                                                                  | Elves smooth it out. Dwarves make it rustic. Beastfolk make it earthy and lively. Kender, hedgefolk, jerbeen, ferretfolk tinkerers, satyrs, forest-floor fey, burrow smallfolk, woodland beastfolk, and bramble plantfolk use this when they live between canopy and ground. Wood Elves may use Bramblewood Burr if they are village-woodland rather than deep-forest traditionalists.                                                                                                                                                                        | Rangers sound very natural; artisans sound local; warriors sound sturdy; bards sound folk-tale bright; rogues sound playful and quick.                                                                  | Rustic, layered, grounded, woodland, friendly but sturdy.              |
| **Hybrid Farming Forest Grassland**   | **Millfield Practical** | Dutch                                       | 1 Humans; 3 Dwarven / Gnomish Kin; 4 Halfling and Smallfolk; 5 Orcs / Goblinoids; 10 Fey and Trickster Folk; 13 Constructed Beings; 15 Beastfolk; 18 Plantfolk; 20 Experimental Races; 21 Wilderness Humanoids; 22 Miscellaneous                                                                                                    | Humans sound plain and practical. Halflings make it friendly. Orcs make it blunt and workmanlike. Gnomes, Geisamahi, autognomes, constructed farmhands, mixed villages, beastfolk laborers, plantfolk cultivators, and experimental civic lineages fit well here. This is the best fallback for practical multi-ancestry settlements that are neither fully rural-hearth nor fully wild.                                                                                                                                                                      | Merchants sound efficient; farmers sound matter-of-fact; scholars sound neat and organized; artificers sound workshop-practical; clerics sound community-service focused.                               | Practical, mixed, industrious, balanced, workday-clear.                |

---

## Divergence Rules for Lineages and Bloodlines

| If a race has multiple biome expressions…                                    | Use this rule                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Biome beats ancestry when the body or culture depends on environment.**    | A Sea Elf, Wood Elf, Drow, Avariel, and High Elf should not all share one “Elf accent.” Their accent follows lived biome first, then Elven overlay second.                                                                                                                                                                                                                                                                                                            |
| **Bloodline beats broad category when the bloodline changes habitat.**       | A Fire Genasi in an ocean-surface rebel port may use Tidecrest Cant with ember pressure, while an Earth Genasi in a mountain hold may use Cragthane Burr or Stonehollow Echo.                                                                                                                                                                                                                                                                                         |
| **Culture beats biology when raised outside ancestral terrain.**             | A reefborn Dragonborn raised in a floating settlement may use Tidecrest Cant instead of Wavebloom Welcome. A Wood Elf raised in treetop academies may use Highbranch Lilt instead of Rootmere Cant.                                                                                                                                                                                                                                                                   |
| **Aquatic peoples split heavily by water type.**                             | Reef communities use Reefglass Lilt underwater or Wavebloom Welcome above-water. Deep ocean communities use Deepcurrent Song. Floating harbors use Tidecrest Cant. Coastal grass-and-water cultures use Brightshore Flow.                                                                                                                                                                                                                                             |
| **Dril’thar must diverge by water ecology.**                                 | Grassland Dril’thar = Plainwind Common with rain-fed wetland softness. Swamp Dril’thar = Mirecurl Drawl with gravewater/rot/renewal rhythm. Reef Dril’thar = Reefglass Lilt underwater or Wavebloom Welcome above-water. Ocean Dril’thar = Tidecrest Cant for floating/ocean settlements or Deepcurrent Song for deep-water lineages. Forest/Rainforest Dril’thar = Rootmere Cant, Sundapple Tongue, or Bramblewood Burr depending canopy depth and settlement style. |
| **Shadow lineages follow the shadowed version of the biome.**                | Umbral Human in a city-grassland region may use Plainwind Common darkened by shadow. Shadow Goblin in cavern systems uses Stonehollow Echo. Shadar-Kai in forest gloom uses Rootmere Cant.                                                                                                                                                                                                                                                                            |
| **Constructed beings follow maker culture plus operating environment.**      | Warforged forged in Deep Cavern use Stonehollow Echo. Autognomes and workshop constructs in mixed farm/forest towns use Millfield Practical. Ship constructs use Tidecrest Cant.                                                                                                                                                                                                                                                                                      |
| **Planar bloodlines should not all sound celestial or fiendish by default.** | A celestial mountain guardian may use Cragthane Burr with radiant clarity; a fiendish swamp exile may use Mirecurl Drawl with infernal heat; an astral scholar may use Highbranch Lilt, Deepcurrent Song, or Stonehollow Echo depending home culture.                                                                                                                                                                                                                 |
| **Birdfolk split by flight environment.**                                    | Avariel and cliff raptors use Cragthane Burr; canopy birdfolk use Highbranch Lilt; shorebirds use Brightshore Flow or Wavebloom Welcome; prairie hawkfolk use Ironstep Cant or Plainwind Common.                                                                                                                                                                                                                                                                      |
| **Plantfolk split by growth pattern.**                                       | Crop and orchard plantfolk use Hearthfield Brogue or Millfield Practical; deep-root forest plantfolk use Rootmere Cant; vine and flower valley plantfolk use Vinesong Flow; fungal/swamp plantfolk use Mirecurl Drawl.                                                                                                                                                                                                                                                |
| **Beastfolk and experimental races split by animal ecology.**                | Catfolk in deep forest use Rootmere Cant; ferretfolk tinkerers in mixed settlements use Millfield Practical or Bramblewood Burr; aquatic hybrids use water accents; hoofed grassland beastfolk use Plainwind Common or Ironstep Cant.                                                                                                                                                                                                                                 |

---

## Quick Examples

| Lineage / bloodline       | Wrong one-size-fits-all choice | Better biome-specific choice                                                                                                                                                          |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Wood Elf**              | “Elf = Highbranch Lilt”        | Deep Forest Wood Elf = Rootmere Cant; woodland village Wood Elf = Bramblewood Burr; treetop noble Wood Elf = Highbranch Lilt.                                                         |
| **Sea Elf**               | “Elf = Highbranch Lilt”        | Reef Sea Elf underwater = Reefglass Lilt; deep Sea Elf = Deepcurrent Song; coastal Sea Elf trader = Brightshore Flow; above-reef Sea Elf = Wavebloom Welcome.                         |
| **Drow**                  | “Elf = Highbranch Lilt”        | Underdark Drow = Stonehollow Echo; deep-forest shadow operative Drow = Rootmere Cant; swamp exile Drow = Mirecurl Drawl.                                                              |
| **Dril’thar**             | “Aquatic = one ocean accent”   | Grassland Dril’thar = Plainwind Common; swamp Dril’thar = Mirecurl Drawl; reef Dril’thar = Reefglass Lilt or Wavebloom Welcome; ocean Dril’thar = Tidecrest Cant or Deepcurrent Song. |
| **Dragonborn**            | “Dragonborn = always guttural” | Reef Dragonborn = Wavebloom Welcome with draconic command; cavern Dragonborn = Stonehollow Echo with heavier throat-weight; mountain Dragonborn = Cragthane Burr with thunder-weight. |
| **Warforged / Autognome** | “Construct = metallic only”    | Deep forge Warforged = Stonehollow Echo; village Autognome = Millfield Practical; shipboard construct = Tidecrest Cant.                                                               |
| **Fire Genasi**           | “Elemental = one accent”       | Ocean-surface Fire Genasi = Tidecrest Cant with ember pressure; valley Fire Genasi = Vinesong Flow with dramatic warmth; mountain Fire Genasi = Cragthane Burr with volcanic weight.  |
| **Tabaxi / Beastfolk**    | “Beastfolk = one animal voice” | Forest Tabaxi = Rootmere Cant; valley Satyr = Vinesong Flow; prairie Gnoll = Ironstep Cant; coastal otterfolk = Brightshore Flow.                                                     |


---

# Appendix B — Build Checklist

## Scanner ready when:

- [ ] It has one `character studio.html`.
- [ ] It has separate `/css`, `/js`, `/json`, `/docs`, `/tts`, and `/media` folders.
- [ ] It has at least 5 JS modules.
- [ ] It can import/paste rough NPC text.
- [ ] It can import partial NPC JSON.
- [ ] It can choose biome-first accent profiles.
- [ ] It can diverge Dril’thar, Sea Elf, Wood Elf, Drow, Warforged, Birdfolk, Plantfolk, and Beastfolk by ecology.
- [ ] It uses fantasy accent names in user-facing output.
- [ ] It hides Earth accent inspirations except in developer docs.
- [ ] It uses the shared studio slider keys.
- [ ] It uses the shared influence IDs.
- [ ] It supports the 26 shared emotions.
- [ ] It exports studio-ready JSON.
- [ ] It warns clearly when data is missing or guessed.
- [ ] It can preview speech with browser-safe voice synthesis.
- [ ] It treats uploaded/recorded audio as reference influence, not forced playback.
- [ ] It has documentation in `/docs`.

## Studio merge ready when:

- [ ] Character Studio can import scanner JSON.
- [ ] Scanner keys match studio keys.
- [ ] Scanner biome profiles map to `voice-biome-accents.js`.
- [ ] Scanner emotions map to `voice-emotions.js`.
- [ ] Scanner preview maps to `voice-speech-api.js`.
- [ ] Scanner exports map to `voice-exporter.js`.
- [ ] Scanner profile model maps to `voice-core.js`.
- [ ] Advanced math hints can be passed to full studio voice math modules.
