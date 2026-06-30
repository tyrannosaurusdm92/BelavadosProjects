# Onyx Autonomous Encounter Suite — GitHub Clean Runtime

Open `encounters_minigame.html`.

DM mode: open `encounters_minigame.html#dm-session` or `encounters_minigame.html#dm-editor`.

Backend is locked to:

`https://script.google.com/macros/s/AKfycbwK-F1BfXbkiVkQXFA0Z1acKxFJgeGU6zckChEmSc8ANqLA1mbqUOWSf6_H1CGFtwW7WA/exec`

## Cleanup rules applied

- Onyx is the only named autonomous encounter controller in the runtime.
- Active code was promoted into normal runtime folders: `css/`, `js/`, `json/`, `assets/`, and `data/`.
- No `onyx_runtime/`, `source/`, or `legacy/` code folders are shipped.
- No nested zip archives are shipped.
- Unused/reference source code was cataloged in docs instead of copied as duplicate runnable code.
- Onyx CSS was not loaded as a global stylesheet. Active Onyx encounter styling stays scoped to encounter/DM selectors so it does not overwrite the board/grid/dice CSS.
- The 14 dice bot personalities, dice design configuration, scalable grid/autonomy runtime, Onyx moods, death effects, and encounter data were retained.

## Extracting the three parts

The three output zips are split by file groups. Extract all three into the same folder. The files land directly into that folder; there are no zip files inside the zip files.
