# Vocal Audio Voice Model Atlas

Generated: 2026-06-25T16:57:59.821666+00:00

This atlas merges the uploaded voice/audio/TTS/synthetic voice repositories into one organized package without intentionally deleting any safely extractable source file.

## Folder map

- `00_sources_preserved/` — original extracted source trees, one folder per uploaded archive.
- `01_by_type/` — categorized hard-linked copies of the same files by file type, while preserving each source path under the category.
- `02_by_gender_identity_explicit_or_canonical/` — requested gender identity folders. These are populated only when a source file explicitly mentions the identity, or through canonical Belavadös NPC placeholder metadata. No audio voice is assigned to a gender identity from first name, presumed presentation, or perceived sound.
- `03_voice_speaker_atlas/` — speaker-organized audio view where speaker folders could be identified, especially the Coqui voice pack.
- `docs/licenses_readmes/` — copied licenses, notices, README files, install guides, and source documentation.
- `docs/manifests/` — CSV/JSON manifests for source archives, every file, audio files, model artifacts, source docs, gender identity entries, and speaker audio.
- `docs/audits/` — duplicate audit, file-type audit, source summary, extraction error report, and merge audit.

## Totals

- Uploaded source archives processed: 8
- Extracted files preserved in source tree: 3336
- Categorized file entries in `01_by_type`: 3336
- Audio files indexed: 2564
- Voice model / ML artifact files indexed: 0
- Speaker audio entries: 2541
- Duplicate file entries documented: 77
- Extraction errors / skipped unsafe entries: 0

## Gender identity categorization

Requested identities:

- Agender
- Bi-Gender
- Cis-Female
- Cis-Male
- Demi-Female
- Demi-Male
- Gender-Flexible
- Gender-Fluid
- Gender-Less
- Neutrois
- Non-Binary
- Poly-Gender
- Trans-Female
- Trans-Male

The atlas does not guess identity from voice sound, speaker name, or a binary male/female label. The Coqui README says the pack contains male and female voices, but the uploaded files did not include a reliable per-speaker identity manifest, so those speakers remain unassigned unless explicit metadata is present. Canonical Belavadös NPC placeholders are provided under the matching folders so you can attach or generate voice assets later.

## Belavadös voice system included

The atlas also includes a structured Belavadös voice layer in `docs/manifests/atlas_index.json`, including voice sliders, biome/accent anchors, race overlays, class overlays, and canonical NPC gender-identity placeholders.

## Preservation note

Duplicate files were kept. The duplicate relationships are listed in `docs/audits/duplicate_files_audit.csv` so you can merge or prune later without losing traceability.
