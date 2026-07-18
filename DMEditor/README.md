# Belavadös DMEditor

Upload the contents of this folder to:

`BelavadosProjects/DMEditor/`

The deployed editor URL is:

`https://tyrannosaurusdm92.github.io/BelavadosProjects/DMEditor/`

## One-HTML structure

The project contains exactly one HTML file: `index.html`. All editor functions—province borders, six-anchor detached territories, settlements, terrain scanning, natural-system pins and lines, local imports/exports, and backend saves—run from that page.

Do not add another HTML file. The interactive world-map ZIP generator creates its own single `index.html` inside the downloaded export without adding another HTML file to DMEditor.

## Editing

Core editing layers and Province Editor Mode open enabled. You can:

- drag province border anchors and center pins;
- edit six-anchor territories, whose square miles and square kilometers recalculate from the live polygon;
- enter a province map and create, move, edit, or delete settlement pins;
- edit natural-system points and line anchors;
- import complete `dm_map.json`, province JSON, settlement JSON, JSON/GeoJSON files, or JSON ZIPs;
- replace the world map image in the current editor state;
- export updated `dm_map.json`, an updated root `index.html`, province packages, or the one-HTML interactive world-map ZIP.

## JSON auto-discovery

The editor scans the repository path `DMEditor/json`, including nested folders. A JSON or GeoJSON file pushed anywhere under that folder is recognized automatically through the GitHub Contents API even when `json/index.json` has not yet been rebuilt.

For the fastest static loading, run:

```bash
npm run index-json
```

before committing. This rebuilds `json/index.json`.

## Fixed backend

The editor is permanently wired to the supplied Belavadös Projects backend and library:

- Apps Script web app: the URL frozen in `js/backend-lock.js`
- Apps Script library: the URL frozen in `js/backend-lock.js`
- backend project ID: `dmeditor`

The interface does not expose a backend URL field. `data/backend.config.json` is informational; the deployment URL, repository, branch, and `DMEditor/json` path are re-locked in JavaScript at runtime.

Backend writing uses the shared backend's real contract:

1. Sign in or create an account in the editor.
2. The editor sends `auth.login` or `auth.signup`.
3. Complete map saves use `files.upload` to store the full JSON in the backend's private Drive project folder.
4. A small `records.create`/`records.update` entry tracks the latest logical filename and Drive file ID.

Passwords are never stored by the editor. Only the backend session token and public user/session metadata are retained in browser local storage; signing out removes them.

## Local direct-file mode

Run:

```bash
npm start
```

and open the printed local URL. In this mode, saves can write directly to the local `json` folder through `server.mjs`. On GitHub Pages, GitHub files are read-only and complete writes go through the fixed Apps Script backend.

## Deployment checklist

1. Copy this folder's contents into repository folder `DMEditor`.
2. Confirm the repository branch is `main` and GitHub Pages is serving `BelavadosProjects`.
3. Run `npm test`, `npm run index-json`, and `npm run manifest` before committing when Node is available.
4. Open the deployed URL and verify the status says `Fixed Google Apps Script mode ready`.
5. Sign in before using backend save. Local browser save and downloads work without sign-in.
