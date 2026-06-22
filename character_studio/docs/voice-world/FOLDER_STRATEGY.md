# Folder Strategy

## Rule

- Main accent folders are canonical model homes.
- Crossover folders contain only manifests.
- Crossover manifests reference models through their component accent manifests.

## Layout

```text
voice-models/
  main-accents/
    Tidecrest Cant/
      manifest.json
    Reefglass Lilt/
      manifest.json
    ...
  biome-crossovers/
    Tidecrest Cant + Reefglass Lilt + Deepcurrent Song/
      manifest.json
    ... 680 total crossover folders
```

## Why this avoids duplication

A model such as a Portuguese Piper voice belongs to `Tidecrest Cant/manifest.json` once. Every crossover that includes Tidecrest Cant points back to that manifest.

## File count audit

See `data/folder_count_audit.json`.
