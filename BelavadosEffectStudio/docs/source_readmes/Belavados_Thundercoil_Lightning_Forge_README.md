# Belavadös Thundercoil Lightning Forge

Merged project combining the Thundercoil Ichor Discharge Forge with the Belavadös Lightning Forge runtime.

## Design rule for this merge

The rocket / pressure / projectile code is now only the **initial blast impulse**: muzzle flash, short plasma pressure bloom, sparks, and discharge rings. The continued visible blast is dominated by lightning: forked trunk bolts, chain arcs, branch forks, radial bursts, cage-like coil-array streams, melee edge lightning, and full 360° angular rotation.

## Run

Open `index.html` in a browser. No build step is required.

## Main controls

- Select a Thundercoil weapon spec from the attached ichor math arsenal.
- Pick the discharge renderer: sidearm, rifle lance, shotgun scatter, coil array, burst, melee edge, etc.
- Use **Discharge angle / 360° rotation** or the orientation preset buttons for horizontal, vertical, angular, and reverse fire.
- Use **Fire** for continuous lightning-dominant discharge.
- Use **Pulse** for a short burst.
- Export PNG or JSON from the app.

## Merge contents

- `js/lightning-dominance.js` — new bridge runtime that converts Lightning Forge-style jagged trunks, branches, forks, radial arcs, and chain arcs into Thundercoil traces.
- `js/renderers.js` — Thundercoil renderer patched so particle/rocket trails are reduced and lightning continuation is dominant.
- `vendor/lightning_forge_runtime/` — original reusable Lightning Forge runtime kept for reference and future expansion.
- `source_specs/` — Thundercoil weapon JSON/docx specs preserved.
- `docs/source_projects/` — original docs/readmes/licenses/source notes from both merged projects.

## Safety note

This is fictional tabletop/worldbuilding and visual-effects code only. It does not provide real weapon, pressure-vessel, chemistry, or electronics construction guidance.
