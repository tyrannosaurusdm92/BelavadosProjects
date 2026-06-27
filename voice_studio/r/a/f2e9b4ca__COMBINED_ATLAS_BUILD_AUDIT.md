# Combined Voice + Accent Atlas Build Audit

Built: 2026-06-25T18:25:10

## Source packages used

- `Singular_Accent_Atlas_PART_1_of_2.zip`
- `Singular_Accent_Atlas_PART_2_of_2.zip`
- `Vocal_Audio_Voice_Model_Atlas_Merged.tar.gz`

## What was merged

- Accent region atlas from both Accent Atlas split parts.
- Accent gender identity sort/index where available.
- Vocal/audio/voice-model source files from the Vocal Audio Voice Model Atlas.
- Existing manifests, audits, README files, and licenses from both atlas outputs.

## Windows-safe handling

The Vocal/Audio source tree contained original repository paths that exceeded common Windows path limits. Those files were preserved by content, but their output paths were flattened into `03_VOICE_AUDIO_MODEL_ATLAS/<Source>_<Type>/`. The exact original path for every flattened file is recorded in `vocal_source_path_map.csv`.

## Counts

- Final files, including generated manifests: 4769
- Total unpacked bytes represented: 780,996,774
- Flattened vocal source files: 3336
- Accent region files: 1200
- Accent gender-index files: 43
- Longest final relative path length: 209
- Longest final relative path: `00_DOCS/Vocal_Audio_Atlas_Docs/docs/licenses_readmes/manifest_or_config/Realtime-Synthetic-Call-Center-Agents-main_1/Realtime-Synthetic-Call-Center-Agents-main/src/mcp-servers/ai-foundry-agent/requirements.txt`

## By file type

{
  "data": 157,
  "docs": 282,
  "other": 61,
  "images": 86,
  "audio": 3320,
  "code": 650,
  "configs": 54,
  "notebooks": 18,
  "cache": 135,
  "models": 6
}

## Split ZIP plan

- Part 1: documentation, smaller/global accent regions, and gender index.
- Part 2: Mandarin and Thai accent regions.
- Part 3: Spanish and Russian accent regions.
- Part 4: flattened vocal/audio/voice-model source atlas.

Extract all four ZIP files into the same parent folder to rebuild the complete `Full_Voice_Accent_Atlas`.
