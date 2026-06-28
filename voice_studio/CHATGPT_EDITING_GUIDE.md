# ChatGPT Editing Guide — Voice Studio Assets + Bot Repository Handling

## Core Rule

Character Studio is the app. Voice Studio is the resources + bot library.

When editing or revising Character Studio, use Voice Studio repository downloads only as source resources. Do not return Voice Studio audio/model/accent/bot-asset payloads inside the downloadable edited zip after a Character Studio revision unless the user explicitly says:

> send me voice studio assets

## Why

The Voice Studio repository contains many voice clips, accent references, model/source files, bot intelligence resources, audits, manifests, and generated voice references. Repacking those files into every edited Character Studio zip increases corruption risk, upload/download size, and duplicate asset drift.

## What To Return During Character Studio Edits

Return:

- `character_studio/index.html`
- Character Studio CSS/JS/data needed by the app
- Linked runtime bridge files
- Voice Studio manifests
- Voice Studio lightweight bridge/runtime files needed for Character Studio to resolve the GitHub-hosted resources
- Documentation/audit files that explain what is linked, omitted, or moved

Do not return:

- `voice_studio/r/**` audio clips, WAV/MP3 references, model payloads, images, full raw datasets, or copied repository resources
- Duplicated Character Studio voice assets when equivalent Voice Studio assets already exist
- A standalone `voice_studio/index.html` opener unless the user explicitly asks for Voice Studio to be a separate app again

## If A User Uploads A Full GitHub Repository Download

Use it as the source of truth for manifests, paths, bot logic, and resource mapping. After editing Character Studio, replace large resource folders in the returned zip with manifests/placeholders unless the user explicitly asks for assets to be returned.

## If Character Studio Contains Voice Resources

If Character Studio contains actual usable voice resources that are not already represented in Voice Studio, move them into Voice Studio once, add them as usable files, and record them in:

- `voice_studio/manifests/character_studio_moved_resources_manifest.json`
- `character_studio/VOICE_STUDIO_FULL_LINKED_MANIFEST.json`

If Character Studio contains only README/stub/manifest files, do not treat those as migrated voice assets.

## Required Architecture

- Only `character_studio/index.html` opens the program.
- Character Studio owns generator, simulation, import/export, D&D character creation, sliders, payload construction, and UI.
- Voice Studio owns voice assets, accent assets, bot source selection, bot resource manifests, voice source routing, and backend audio export routing.
- Character Studio pulls from Voice Studio using manifest URLs and bridge APIs.
