# Mobile PWA layout folded into the simple v2 shell

The older mobile PWA / Effect Layer Studio layout was audited and removed as a separate in-site workspace. The app now has one visible design shell only: `index.html` with the simple mobile-first Paint/AddText-style canvas, top bar, bottom quick buttons, and one movable tool menu.

What changed:

- The embedded iframe sub-studio was removed.
- The fullscreen link to the old `old alternate PWA folder/index.html` was removed.
- The `old alternate PWA folder/` alternate layout was removed from the deliverable.
- The service worker cache was cleaned so it only caches the simple shell and shared assets.
- Ichor, lightning, forking, escape arcs, and randomized spraypaint motes are now available directly inside the main **Ichor + Lightning** tool menu.
- Slider-heavy controls live inside the same movable menu instead of inside a hidden second layout.

The remaining app layout is intentionally simple: open a tool family from the icon strip, adjust sliders in the movable menu, draw on the single canvas workspace, then export/save from the same shell.
