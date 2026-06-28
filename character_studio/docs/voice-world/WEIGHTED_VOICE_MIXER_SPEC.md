# Belavadös Weighted Voice Mixer Developer Spec

Generated: 2026-06-22T15:48:23.261835+00:00

## Site behavior

- A player may cache exactly three different biomes for genetic/accent diversity.
- Each main accent folder is canonical and owns its reusable model pointers.
- Each crossover folder contains only a small `manifest.json` with references back to the three main accent folders.
- Crossover voices are represented as weighted model layers. Suggested layers start enabled, can be disabled, can be re-enabled, and each has a 0-100% intensity slider.
- The UI preserves raw percentages and also computes normalized backend weights.

## Required player controls

Every speech preview/media output uses the same transport model:

- play/resume
- pause
- stop
- rewind 5 seconds
- fast forward 5 seconds
- single-active-clip lock

Browser `speechSynthesis` does not expose exact waveform seeking, so the static preview uses approximate word-position seeking. Real generated audio clips should use `HTMLMediaElement.currentTime` for exact seeking.

## Voice pipeline

```text
MP3 decode
→ feature analysis
→ base voice parameters
→ accent rules
→ emotion rules
→ personality rules
→ stutter / hesitation rules
→ synth or convert
→ output waveform
```

## Safety layer

Allowed asset permission types are:

- `own_voice`
- `licensed_actor`
- `public_domain_character_asset`
- `synthetic_original`

Unknown assets are blocked by default until labeled.

## GitHub folder strategy

Heavy source repos and audio/model assets are not expanded into the site. The site keeps docs, manifests, JSON schemas, and pointer/adapters only.
