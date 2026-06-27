# Source Usage Audit

## Fully coded into the app

- Belavadös biome/race dropdown builder: data extracted into `src/data/race-taxonomy.json`, `src/data/race-flat-list.json`, and `src/data/biome-accent-map.json`.
- Coqui voice pack: audio resources indexed into `voice-source-manifest.json` and surfaced in the source browser.
- Full Voice Accent Atlas: selected accent resources and atlas folders preserved under `resources/accent_sources` and indexed where audio exists.
- JARVIS-ChatGPT: adapted as the command/router concept for build, preview, export, and status flows.
- ChatGTP / OpenChat / Problem-Solving bot apps: adapted as profile-history, chat-state, and mobile panel interaction ideas.
- HeartMuse / Aeon / YuE music tools: adapted only as prosody/mood/context controls for speech; no song generator is included.
- Realtime Synthetic Call Center Agents: adapted as the idea for realtime speech request routing and backend action payloads.
- Synthetic Voice Detection / Vocoder Artifacts: represented in the audit guard and docs to label generated output as synthetic/fictional.
- Dice Bots: used as D&D/NPC workflow examples and helper-bot structure, not as imported bot personalities.

## Preserved as docs/source snapshots instead of bulky copied code

Large frameworks, mobile app shells, model training code, and unrelated personality/token files are summarized in docs and source snapshots. The working app imports the reusable concepts and data without turning unrelated projects into frontend bulk.
