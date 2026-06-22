# Drawing, Shapes, Undo/Redo, Fill, and Repair Update

This build adds a practical drawing-tool layer on top of the existing Belavadös Effect Layer Studio and the Ichor Converter.

## Added controls

- Undo button, Redo button, and quick Save Browser button in the Tools panel.
- Ctrl/Cmd+Z for undo, Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z for redo.
- Color wheel plus typed hexcode input.
- Brush style selector for regular paint, pencil, marker, crayon, spraypaint, and charcoal.
- Live brush cursor preview with colored bubbles at the end of the cursor.
- Fill tool for connected-color flood fill.
- Repair Brush for painting pixels back from the preserved repair source.
- Shape / Link tool with a reusable shape library.

## Shape library

Shapes are stored as editable objects on effect layers, separate from brush strokes. The library includes circles, ellipses, squares, rectangles, triangles, diamonds, pentagons, hexagons, octagons, custom polygons, stars, gears, hearts, arrows, thought boxes, shout boxes, cubes, spheres, cylinders, cones, pyramids, moons, ringed planets, clouds, plants, trees, leaves, and flowers.

Each shape supports:

- Width and height
- Full 360-degree rotation
- Fill color
- Border color
- Border width
- Shape alpha/transparency
- Optional clickable link URL

Links are exported into the standalone interactive HTML as clickable hotspots over the matching shapes.

## Transparency and repair behavior

Transparency removal is now bounded by reachability. When you use Pick Transparency, the clicked point becomes the seed point. Preview and Apply Transparency only affect connected pixels that can be reached from that seed and match the tolerance; matching colors inside disconnected image regions are not removed.

The transparency preview mask was changed from pink to a butter-yellow/coral preview color. The Repair Brush restores pixels from the preserved original image/canvas source. Use Refresh Repair Source if you intentionally want the current image to become the new repair source.

## Ichor palette update

Ichor rendering now uses the requested Belavadös cyan/teal gradient families for mist, ion flash, glowing charge stream, arc body, pressurized core flow, deep conductive mass, shadowed inner current, and core residue.

Default visual anchors:

- Mist: `#E8FFFF`
- Glow: `#9EFFFF`
- Main ichor body: `#00FFFF`
- Deep body: `#008B8B`
- Shadow/core: `#003A3A`
