# Mobile + PWA Repair Notes

This pass focuses on making the Effect Layer Studio usable on phones and tablets in portrait and rotated landscape.

## Added

- `manifest.webmanifest` with app name, theme color, standalone display mode, and installable icons.
- `service-worker.js` so supported Android browsers can install the studio as an app icon and cache core files.
- `icons/` with 180px Apple touch icon, 192px Android icon, 512px icon, maskable 512px icon, and source SVG.
- Header button: **Add App Icon**. On Android Chrome/Edge it uses the install prompt when available. Otherwise it tells the user to use the browser menu.
- Mobile quick tool dock under the canvas: Brush, Erase, Repair, Fill, Shape, Cutout, Pan, Fit.
- Touch-safe canvas behavior: browser scrolling/long-press selection is suppressed only inside the viewport so tools can draw/cut/fill instead of moving the page.
- Two-finger pinch zoom on the canvas.
- One-finger selected-tool behavior for brush, eraser, repair, shape, fill, eyedropper, and transparency pick.
- Mobile text inputs use 16px font to avoid unwanted mobile browser zoom.
- Portrait layout pushes the image workspace to the top so tools are not buried below panels.
- Landscape layout keeps tools and workspace side-by-side when width allows.

## Important deployment note

The app icon/install behavior requires the project to be served from HTTPS, such as GitHub Pages. It will not fully install when opened directly from a local `file://` path.

After uploading the new folder to hosting, open the hosted `index.html` on the phone, refresh once, then tap **Add App Icon** or use the browser menu → **Add to Home screen** / **Install app**.
