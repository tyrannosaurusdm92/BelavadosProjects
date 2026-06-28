# Voice Studio Full Linked Manifest

Generated: 2026-06-28T04:46:30Z

## Policy

Character Studio is the only app opener. Voice Studio is treated as the resource + bot library that Character Studio pulls from.

## Returned Zip Rule

The returned zip includes manifests and bridge/runtime files only. Heavy Voice Studio assets are not returned because they are kept on GitHub. Do not return the actual voice/accent/audio/model resources unless the user explicitly says: `send me voice studio assets`.

## Character Studio Migration Result

No usable audio/model resources were moved from Character Studio to Voice Studio in this pass. The Character Studio voice folders only contained stubs/readmes/manifests, so the live voice assets remain GitHub-hosted under `voice_studio/`.

## Main JSON Manifest

See:

- `character_studio/VOICE_STUDIO_FULL_LINKED_MANIFEST.json`
- `voice_studio/VOICE_STUDIO_RESOURCE_BOT_MANIFEST.json`
- `voice_studio/manifests/folders/*.json`
