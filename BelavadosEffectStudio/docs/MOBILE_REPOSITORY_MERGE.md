# Mobile Repository Merge Report

Uploaded source: `ImageEditorMobileApp-main.zip`

## What the mobile repo contributed

The uploaded repository is a small SwiftUI iOS image editor. Its usable design ideas were folded into this web/PWA version rather than trying to run Swift code in a browser. The important patterns merged were:

- mobile-first photo selection flow;
- simple tap-first editing screens;
- live intensity/filter-style sliders;
- save-to-device/export intent;
- compact navigation for smaller screens.

## Runtime changes made in this Belavadös build

- Added a sticky mobile control dock with a single **Tool Dropdown** selector.
- Collapsed all non-image tool modules behind mobile dropdown/accordion headers.
- Prioritized portrait by putting the image workspace first, then tool menus underneath.
- Added landscape/rotated support with shorter workspace heights and compact top controls.
- Added **Safe Scroll On** touch guard. On touch devices, finger contact pans/zooms by default and does not paint, erase, fill, pick transparency, or place shapes until touch drawing is intentionally armed.
- Added matching buttons in the canvas toolbar and mobile dock so touch drawing can be armed/unarmed without hunting through the page.
- Added pinch-zoom support inside the image workspace.
- Kept wheel zoom and desktop controls intact.

## Why the Swift source is documented, not executed

The uploaded repo is native iOS SwiftUI/Xcode code. This studio is a static browser/PWA project intended to run from GitHub Pages, local files, or the Apps Script launcher. Swift files cannot run directly in that environment, so they are preserved as reference files in `docs/mobile_reference/` and the browser runtime implements the mobile behavior in JavaScript.

## Fat-finger safety behavior

On phones/tablets, the editor starts with **Safe Scroll On**. In that mode:

- one-finger drag pans the workspace;
- two-finger pinch zooms the workspace;
- drawing tools are visually selectable but will not modify the canvas until armed;
- destructive tools are protected from accidental scroll contact.

Press **Safe Scroll On** / **Touch Drawing Armed** to toggle editing.
