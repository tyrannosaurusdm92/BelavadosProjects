# Character Studio Dropdown Repair Report

## Purpose
This patch adds a final dropdown runtime guard so Character Studio remains the app while Voice Studio remains resources + bot only. It repairs dropdowns without bundling or returning GitHub-hosted Voice Studio assets.

## Added file
- `character_studio/js/character-studio-dropdown-repair.js`

## Index update
- `character_studio/index.html` now loads the repair script at the end of the body so it runs after the original Character Studio, sheet, Voice Studio bridge, and layout scripts.

## Dropdown groups guarded
- Page 1 generator race family, race 1, race 2, race lineages, biome group, biome, gender identity, pronouns, honorifics, background, faction, class, subclass, multiclass, magic school.
- Page 3 voice race, race lineage, class, subclass, biome accent, gender, emotion/circumstance, pronouns, and honorifics.
- Embedded generator/voice custom builder dropdowns.
- BDD/interactive sheet dropdown-builder selects when those controls are present in the active DOM.

## Behavior
- Repopulates empty dropdowns from the existing embedded JSON data.
- Re-binds cascading dropdowns so changing a category refreshes races, changing a race refreshes lineages, and changing a class refreshes subclasses.
- Preserves the user's selected value whenever the value still exists after refresh.
- Runs on DOM ready, delayed post-load passes, and after runtime-injected DOM changes.

## Voice Studio asset rule
Voice Studio resource folders remain treated as GitHub-hosted resources. This edited zip does not include heavy `voice_studio/r/a` or `voice_studio/r/v` asset folders.
