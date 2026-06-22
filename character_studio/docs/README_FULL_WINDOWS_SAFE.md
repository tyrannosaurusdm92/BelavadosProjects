# Belavados Fantasy Voice Scanner FULL Windows-Safe Build

This package merges the studio-compatible **Simulated Fantasy Voices Scanner**, the **Belavados Deep Voice Math 24 JSON Pack**, and the **Belavados Fantasy Voice Simulation JS with Audio/TTS** resources into one standalone scanner.

Open **character studio.html** after extracting the ZIP.

## What is absorbed

- 156 deep voice-math race entries across 22 racial categories.
- 14 class deep-math profiles and subclass delivery math.
- 14 gender identity performance layers.
- 2566 local audio references under `media/a/` with short paths.
- 590 flattened source/TTS/code reference files under `tts/`.
- 3230 total files absorbed from the uploaded audio/TTS simulation pack.

## Windows path safety

The original repository paths were very deep. This build stores those original paths inside JSON manifests and gives the actual files short local paths like `media/a/a0001.wav`, `json/dm01.json`, and `tts/src_0001.js`.

## Voice behavior

The scanner still resolves voices in the intended order: biome first, then race/lineage/bloodline, class/subclass, gender identity, personality, emotion, user sliders, deep math, naturalness guard, and export.

Audio files are used as reference/humanization cues and playable local samples. The scanner does not clone voices.
