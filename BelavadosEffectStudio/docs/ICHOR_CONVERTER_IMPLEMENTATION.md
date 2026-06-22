# Ichor Converter Implementation Notes

This build adds a dedicated brush-to-ichor workflow to the existing Belavadös Effect Layer Studio.

## What changed

- Added a new `Ichor Discharge / Fluid Lightning` effect type.
- Added an **Ichor Convert** button in the Brush + Effect Creator panel.
- Added an **Ichor Converter** panel with presets for Thundercoil weapons and skyship systems.
- Added live sliders for velocity, power, thrust/flow, dust motes, lighting/glow, escape arcs, fluidity, and pressure spread.
- Added animated canvas rendering for liquid-electric current paths.
- Added export support so ichor layers remain animated in exported standalone HTML.

## Intended behavior

The user draws rough guide strokes with the normal brush. Pressing **Ichor Convert** changes the selected layer into an `ichor` layer. The stroke points remain editable as layer data, but the renderer stops treating them as painted strokes and begins treating them as current-path guides.

The ichor renderer does **not** act as a cutout, transparency mask, or static overlay. It draws:

- a moving cyan fluid-electric sheath along the brush stroke,
- a white-hot animated current core,
- animated flow pulses travelling down the stroke,
- side-escape lightning tendrils that leave the stroke path,
- cyan/teal dust motes and divine residue particles pushed by thrust and pressure settings.

## Battery/core exclusion

The implementation intentionally does not draw a battery core, catalyst reservoir, charge pack, reactor, reliquary, or source orb. It creates only the external discharge layer so it can be placed over weapons and skyships that already contain their own source hardware.

## Preset math basis

The compact Thundercoil presets were distilled from the uploaded Thundercoil Lightning Forge source data. Energy per shot, duration, pressure, jet velocity, glow output, and cohesion values are reduced into artist-friendly controls.

Skyship presets are based on the uploaded Skyships Design Bible concepts: stern discharge lenses, keel lift bells, mast stabilizer vents, harbor whisper puffers, storm-climb blooms, and ichor-thread sail currents.

## Renderer controls

The regular studio controls still matter:

- Brush Size controls channel thickness.
- Brush Alpha and Transparency control visibility.
- Speed multiplies animation speed.
- Blur/Softening controls the layer-level diffusion.
- Sharpness controls white-hot core strength.
- Wave/Hover Size influences current wandering.
- Vector Length influences mote and thrust travel.
- Angle biases discharge escape and thrust direction.

The ichor-specific controls then modify the liquid-lightning behavior.
