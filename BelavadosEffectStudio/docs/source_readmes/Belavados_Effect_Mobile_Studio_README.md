# Runtime vendor files

These small browser-ready files were copied into the runtime because they can run from a plain Windows folder without a build step.

- `lax.min.js` from `lax.js-dev`: scroll/motion helper, available for future UI animations.
- `Pizzicato.min.js` from `pizzicato-master`: browser audio/effect helper, available for future sound-reactive effects.
- `slidr.min.js` from `slidr-master`: small slider/panel helper, available for future UI panels.

Large design applications from Canva clone, Penpot, Excalidraw, and draw.io are documented in `docs/` but not copied into runtime because they would bloat the working folder and require build systems/server dependencies.
