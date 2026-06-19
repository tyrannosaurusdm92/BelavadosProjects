# Simulated Fantasy Voices Scanner

This package is the standalone **Simulated Fantasy Voices Scanner**. It is built with the future Character Studio merge in mind, but it is **not** the full studio yet.

## Boundary

- Current product: scanner-first voice-profile builder and analyzer.
- Future product: Character Studio can import scanner exports because the scanner already uses the shared voice trait keys, influence IDs, schema fields, fantasy accent names, and math hint names.
- Main HTML file: `character studio.html` for eventual merge compatibility.

## Folder structure

```text
simulated-fantasy-voices-scanner/
├── character studio.html
├── css/scanner.css
├── js/
│   ├── scanner-core.js
│   ├── scanner-ui.js
│   ├── scanner-parser.js
│   ├── scanner-voice-mapper.js
│   ├── scanner-preview.js
│   ├── scanner-exporter.js
│   └── scanner-data-loader.js
├── json/
├── docs/
├── tts/
└── media/
```

## Important fantasy-facing rule

Earth accent inspirations are developer-only references. NPC cards, player-facing summaries, and normal exports should use names like **Mirecurl Drawl**, **Reefglass Lilt**, **Rootmere Cant**, and **Stonehollow Echo**.

## Browser notes

Open `character studio.html`. If the browser blocks local JSON loading from `file://`, use **Import JSON folder** and select the included `json/` folder, or run a tiny local server from this folder.

```bash
python -m http.server 8000
```

Then open the local page in a browser.
