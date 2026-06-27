# Windows Safe Audit — Voice Studio

Generated: 2026-06-27T11:54:06.910875Z

## Result

- Rebuilt package with shallow folders and shortened file names.
- Preserved 3,280 source files.
- Updated app references from `src/...` to `s/...`.
- Updated voice/accent manifest references to `r/v/...` and `r/a/...`.
- Added `d/path_map.json` so old source locations remain traceable without deep real folders.

## Path safety checks

- Longest zip entry path: 87 characters.
- Target max used for this build: under 120 characters.
- Invalid Windows filename/path issues found: 0.
- Broken voice manifest file references found: 0.
- Root folder name: `Voice_Studio`.

## Shallow folder guide

| Folder | Purpose |
|---|---|
| `s/` | App scripts, CSS, and JSON data. |
| `r/v/` | Flattened voice reference WAV files. |
| `r/a/` | Flattened accent samples, atlas docs/data, and preserved accent resources. |
| `b/` | Google Apps Script backend reference. |
| `d/` | Audits, manifests, source notes, licenses, and the path map. |
| `ad/` | Integrated adapter/helper code. |
| `x/` | Miscellaneous preserved app support files that did not fit the main buckets. |

## Longest paths in rebuilt zip

- 87 chars: `Voice_Studio/d/lic/0546e1d3__Synthetic-Voice-Detection-Vocoder-Artifacts-main_1_LICENSE`
- 87 chars: `Voice_Studio/d/src/54781d50__thonburian-tts-main_flowtts_runtime_triton_trtllm_READM.md`
- 87 chars: `Voice_Studio/d/src/b8fbf727__Synthetic-Voice-Detection-Vocoder-Artifacts-main_README.md`
- 87 chars: `Voice_Studio/d/src/cd5e5c52__Synthetic-Voice-Detection-Vocoder-Artifacts-main_README.md`
- 87 chars: `Voice_Studio/d/src/848ce28d__Synthetic-Voice-Detection-Vocoder-Artifacts-main_requi.txt`
- 87 chars: `Voice_Studio/d/src/5d1fe835__Realtime-Synthetic-Call-Center-Agents-main_src_backen.toml`
- 87 chars: `Voice_Studio/d/src/cd6c8821__Realtime-Synthetic-Call-Center-Agents-main_src_backend.txt`
- 87 chars: `Voice_Studio/d/src/311df197__Realtime-Synthetic-Call-Center-Agents-main_src_fronte.json`
- 87 chars: `Voice_Studio/d/src/6197635d__Realtime-Synthetic-Call-Center-Agents-main_src_frontend.md`
- 87 chars: `Voice_Studio/d/src/bf9d1ec6__Realtime-Synthetic-Call-Center-Agents-main_src_fronte.json`
