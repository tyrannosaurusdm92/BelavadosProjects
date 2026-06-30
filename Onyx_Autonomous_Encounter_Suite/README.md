# Onyx Autonomous Encounter Suite

Open `encounters_minigame.html`.

DM mode: `encounters_minigame.html#dm-session` or `encounters_minigame.html#dm-editor`.

Backend is locked in the frontend to:

`https://script.google.com/macros/s/AKfycbwK-F1BfXbkiVkQXFA0Z1acKxFJgeGU6zckChEmSc8ANqLA1mbqUOWSf6_H1CGFtwW7WA/exec`

## What was merged

- Scalable grid/dice/autonomous encounter runtime from `encounters_minigame_grid_dice_autonomous_revised.zip`.
- Onyx identity, moods, death assets, dice tokens, JSON catalogs, and prior Onyx runtime material from `encounters_minigame_Onyx_Superbot_Bundle_WINDOWS_SAFE.zip`.
- Among-Us-to-DnD conversion JSON, hostile/director rules, traps, locks, meetings/reports/rallies, samples, and source policy from `belavados_among_us_to_dnd_json.zip`.
- The supplied `.gs` file is included as `docs/backend_reference/Code_reference_NEW_BACKEND_LOCKED.gs` so the frontend payloads match the merged Apps Script routing style.

## Runtime promises

- Onyx is the only runtime superbot exposed to the page: `window.OnyxEncounterSuperbot`.
- No old standalone Superbot globals are exported by the main HTML.
- Onyx autonomy is on by default and is forced on during exported mini-game HTML creation.
- Hostiles, traps, locks, doors, and player-triggered hazards react autonomously.
- DM-only extras stay behind `#dm-session` / `#dm-editor`.
- The only dice mechanic is the transparent over-grid 3D dice roller with the 14 dice bot personalities and selectable dice designs.

## Split zip use

Extract all parts into the same parent folder. Each part contains the shared root folder `Onyx_Autonomous_Encounter_Suite/`; allowing folders to merge will reconstruct the full package.
