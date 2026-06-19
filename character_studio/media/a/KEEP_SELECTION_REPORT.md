# 1000-File GitHub Trim Selection

This folder was reduced from **2,568 files** to exactly **1,000 files** for a GitHub file-count limit.

## Keep strategy

1. Keep original metadata files: `README.md` and `accent_reference_manifest.json`.
2. Keep this report and `kept_files_manifest.json` so the reduction is traceable.
3. Keep all **14 MP3** accent/reference clips.
4. Remove exact duplicate audio files.
5. Remove silent/empty WAV references.
6. Keep rare long phrase clips and non-standard-format clips because they are more useful for cadence/prosody learning.
7. Fill the remaining slots with a duration-diverse, evenly-spaced sample of short WAV clips so the scanner still has broad phoneme/word/timing coverage.

## Counts

| Category | Original | Kept | Removed |
|---|---:|---:|---:|
| Total files | 2,568 | 1,000 | 1,568 |
| Audio files | 2566 | 996 | 1570 |
| MP3 | 14 | 14 | 0 |
| WAV | 2552 | 982 | 1570 |
| JSON/MD support files | 2 | 4 | 0 |

## Notes

- The reduced folder keeps broad accent/prosody coverage while respecting the 1,000-file cap.
- It prioritizes runtime usefulness for the scanner/studio over keeping every tiny raw sample.
- File names are preserved to stay Windows-safe and shallow: everything remains inside `a/`.
