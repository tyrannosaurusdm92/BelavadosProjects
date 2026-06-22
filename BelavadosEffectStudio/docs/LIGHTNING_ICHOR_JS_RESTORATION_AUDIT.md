# JavaScript Lightning / Ichor Restoration Audit

Date: 2026-06-22

## What was restored into runtime

The live editor now includes a browser-native JavaScript lightning engine in `js/app.js`. It is available in both the desktop layout and mobile-first layout, and it is also embedded into exported interactive HTML so exports continue animating after leaving the studio.

### Added effect types

- `chainLightning` — segmented hop-to-hop chain bolts with endpoint flare.
- `forkedLightning` — main bolt plus repeated branch/fork generation.
- `stormMesh` — lattice-like storm network across the painted stroke.
- `sparkField` — crackling sparks/motes around a guide stroke.
- Enhanced `electric` — now uses generated bolt rails, glow/core layering, endpoint flares, and animated fork branches.
- Enhanced `ichor` — keeps the existing liquid-electric shader behavior and now overlays procedural micro-bolt rails inside the ichor flow.

### Added brush styles

- `airbrush` — scatter-dot legacy airbrush behavior inspired by Paintbrush.
- `watercolor` — layered low-alpha jitter washes.
- `oilpaint` — impasto-like bristle ridges.
- `pixelink` — hard-edge/pixel block paint.
- `calligraphy` — angle-based oval nib stamping.
- `neon` — glowing tube paint.

## Source ideas folded in

- JavaScript-Lightning-Effect: noisy cast segments, glow line plus core line, endpoint white flare.
- Lightning2D / shockingly-good Unity lightning: ordered random positions, normal displacement, taper/envelope, branch bolts.
- Godot 2D Lightning: short regenerated organic segments and angle variance.
- Unity chain lightning: hop-to-hop chained bolt behavior.
- Paintbrush / Paint3D / MS Paint references: airbrush scatter, fill/paint/zoom concepts, hard-edged paint and brush behavior.

## Runtime files changed

- `index.html` — added effect/brush dropdown options and version tag.
- `mobile.html` — mobile-first explicit entry point.
- `desktop.html` — desktop explicit entry point.
- `js/app.js` — restored/expanded JavaScript renderer.
- `css/styles.css` — launch-mode helpers.
- `service-worker.js` — cache version and extra entries.

## What was intentionally not copied into runtime

Large native or framework-specific projects were not copied into `js/` because they would bloat the editor or require Unity/Godot/Swift/Qt/Delphi build systems. They are represented in `docs/legacy_reference`, `docs/source_readmes`, `docs/licenses`, and this audit trail.
