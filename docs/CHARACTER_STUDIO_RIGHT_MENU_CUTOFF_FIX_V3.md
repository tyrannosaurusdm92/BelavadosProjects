# Character Studio right menu cutoff fix v3

This patch targets the Voice Studio right-side Audio Library & Export panel.

Fixes applied:

- Added universal `box-sizing: border-box` inside the embedded Voice Studio so form controls no longer overflow their columns when padding is added.
- Increased the right Voice Studio column to a reserved 680px width.
- Increased the center slider column to 920px so sliders no longer squeeze into the right panel.
- Added a larger right-side safe zone inside the embedded studio document.
- Disabled the narrow-layout collapse for the studio workspace so the top/bottom scroll wheels reveal the wide layout instead of letting columns crush each other.
- Added extra padding to buttons, player modules, upload/recording blocks, import/export blocks, and text areas.

The package still keeps one HTML file: `character studio.html`.
