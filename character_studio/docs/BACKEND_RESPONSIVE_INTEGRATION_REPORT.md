# Belavadös Backend + Mobile Responsiveness Integration Report

## Embedded backend

- Deployment ID: `AKfycbxtRCK5qjJZABQstPI_FtNxQdu_JE8cGTd9I8b61peSBCjYmL91hwqcqDN_4VjyEgC8wQ`
- Web app URL: `https://script.google.com/macros/s/AKfycbxtRCK5qjJZABQstPI_FtNxQdu_JE8cGTd9I8b61peSBCjYmL91hwqcqDN_4VjyEgC8wQ/exec`

## Added files

- `js/belavados-backend-bridge.js` — frontend bridge for Apps Script saves/loads/uploads.
- `css/belavados-backend-responsive.css` — global mobile, portrait, landscape, tablet, and desktop responsiveness overrides.
- `manifest.webmanifest` — installable mobile/desktop app metadata.
- `sw.js` — lightweight app-shell service worker.

## Backend bridge features

- Saves full 3-page shared state using `saveSharedState`.
- Loads latest shared state using `loadSharedState`.
- Saves Page 1 character payloads using `saveCharacter`.
- Saves Page 3 voice presets using `saveVoicePreset`.
- Uploads local Page 3 voice/audio files through `uploadVoiceAsset` and replaces temporary object URLs with persistent Drive playback URLs returned by the backend.
- Lists backend voice assets and injects them into the Page 3 voice asset chooser.
- Keeps a local browser backup even if backend communication fails.
- Adds a floating Backend panel with Save All, Load Backend, Save Character, Save Voice, Upload Current Voice Asset, Refresh Assets, Install App, and Backend Launcher controls.
- Debounced autosave watches inputs/selects/textareas across all pages.

## Responsiveness features

- Replaces fixed-width/legal-paper assumptions on narrow screens.
- Makes tab navigation horizontally scrollable and touch-friendly.
- Makes all buttons/inputs/selects/textareas meet mobile touch sizing.
- Converts multi-column grids to single-column on phones.
- Keeps Page 2 sheet iframe at usable viewport height in portrait and landscape.
- Injects responsive CSS into the generated same-origin character-sheet iframe after it loads.
- Adds orientation-aware viewport CSS variable updates for mobile browser chrome changes.
- Adds landscape-specific compact mode for short-height rotated phones.

## Static QA completed

- External JS files checked with `node --check`: 205; errors: 0.
- Inline scripts checked with `node --check`: 13; errors: 0.
- Manifest JSON parsed successfully: True.
- Required page elements found: `{"page-character": true, "page-forge": true, "page-voice": true, "characterSheetFrame": true, "voiceLabText": true, "voiceAssetSelect": true, "voiceLabFile": true}`.

## Runtime QA limitation

A Chromium viewport test was attempted for phone portrait, phone landscape, tablet, and desktop. This sandbox blocked both local HTTP and file navigation with `ERR_BLOCKED_BY_ADMINISTRATOR`, so I am not claiming a live visual browser pass. The build has been syntax-tested and packaged; after upload to GitHub Pages, manually confirm the backend health/status panel and install prompt in a real browser.
