Full Voice + Accent Atlas

Built: 2026-06-25T18:25:10

This atlas merges the provided Accent Atlas split package and the Vocal/Audio/Voice Model atlas into one combined Windows-safe atlas.

How to restore the complete atlas:
1. Download all four ZIP files.
2. Extract all four ZIP files into the same parent folder.
3. Let folders merge when your unzip tool asks. Do not overwrite with older files if prompted.
4. Open Full_Voice_Accent_Atlas/00_DOCS/COMBINED_ATLAS_BUILD_AUDIT.md first.

Layout:
- 00_DOCS: manifests, audits, preserved readmes/licenses/docs, split map.
- 01_ACCENT_REGION_ATLAS: accent and regional audio/data sorted by accent/region.
- 02_ACCENT_GENDER_IDENTITY_SORT: gender-identity sort/index inherited from the accent atlas where available.
- 03_VOICE_AUDIO_MODEL_ATLAS: source-preserved voice/audio/model files flattened into Windows-safe source+type folders.

Important: the original Vocal/Audio source paths were flattened because several source paths exceeded normal Windows path limits. No file content was intentionally dropped; the original-to-new path map is in 00_DOCS/vocal_source_path_map.csv.
