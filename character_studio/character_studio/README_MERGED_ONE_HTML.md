# Belavadös Character Studio — merged one-HTML build

Open `index.html`. It is the only HTML entry file. The former separate Character Studio and Character Sheet HTML files have been merged: the sheet is stored inside `index.html` as an HTML template and mounted into the Character Forge iframe at runtime so its scripts and styles stay isolated.

Folders:
- `css/` — extracted Character Studio, Character Sheet, and scanner CSS.
- `js/` — runtime loaders, extracted studio scripts, extracted sheet scripts, scanner/voice scripts.
- `data/` — extracted JSON data used by the main page and the sheet.
- `json/` — existing voice/scanner JSON resources from the source package.
- `media/` and `tts/` — existing project media/audio/TTS resources.

Pathing notes:
- `index.html` loads CSS from `css/character-studio.css`.
- The Character Forge sheet is mounted from the `belavados-character-sheet-template` inside `index.html`; it loads `css/character-sheet.css`, `js/sheet-data-loader.js`, and the extracted sheet scripts.
- `js/project-data-bundle.js` lets the project work from local `file://` paths while the editable JSON copies remain in `data/`.
- The runtime loaders also support fetching the JSON files directly when served from a website.
