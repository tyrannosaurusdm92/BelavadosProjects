# Legacy Source Manifest

This manifest lists the uploaded repositories and exactly how they were treated in the merged studio. Runtime code stays compact; heavy source trees are documented under `docs/` instead of copied wholesale.

| Archive | Role | Runtime Treatment |
|---|---|---|
| `Belavados_Effect_Mobile_Studio.zip` | Current mobile studio base: runtime base, already merged | Docs/audit/reference only; not copied into runtime |
| `Paintbrush-master.zip` | Native macOS paint reference: airbrush, brush/eraser, eyedropper, zoom, selection concepts | Merged into live JavaScript renderer |
| `mspaint-rewritten-main.zip` | Windows/Delphi MS Paint reference: classic fill, save, thumbnail/properties, hard-edge paint logic | Merged into live JavaScript renderer |
| `Paint3D-master.zip` | Qt/QML Paint3D reference: 2D/3D shapes, vector panels, polygon drag/scale/rotate, fill instrument | Merged into live JavaScript renderer |
| `Javascript-Lightning-Effect-master.zip` | Browser JavaScript lightning reference: segmented Cast(), endpoint flares, line glow | Merged into live JavaScript renderer |
| `Lightning2D-master.zip` | Unity C# Lightning2D reference: Bolt positions, normal displacement, envelope taper, BranchingBolt | Merged into live JavaScript renderer |
| `shockingly-good-2d-lightning-effects-unity-master.zip` | Unity lightning tutorial reference: LightningBoltJS, BranchLightningJS, line pooling/fading | Merged into live JavaScript renderer |
| `Godot-2d-Lightning-master.zip` | Godot 2D Lightning reference: short organic segments, angle variance, timer regeneration | Merged into live JavaScript renderer |
| `Unity3d_ChainLightning-main.zip` | Unity chain lightning reference: chain target hopping and branch-ish behavior | Docs/audit/reference only; not copied into runtime |
| `threejs-lightning-effect-main.zip` | Three.js lightning reference: 3D/web lightning demo, documented only for non-2D runtime pieces | Docs/audit/reference only; not copied into runtime |
| `SpriteKitLightning-master.zip` | SpriteKit Objective-C lightning reference: native iOS lightning/audio reference, documented only | Docs/audit/reference only; not copied into runtime |
| `SpriteKitLightning-Swift-master.zip` | SpriteKit Swift lightning reference: native iOS lightning/audio reference, documented only | Docs/audit/reference only; not copied into runtime |
| `Lightning-master.zip` | Objective-C lightning reference: native lightning path/math reference, documented only | Docs/audit/reference only; not copied into runtime |
| `db-simple-geom-editor-master.zip` | Simple geometry editor reference: point/geometry editor concepts | Merged into live JavaScript renderer |
| `shapefile-creator-main.zip` | GeoJSON/shapefile Java reference: GeoJSON parsing/schema reference, documented only | Docs/audit/reference only; not copied into runtime |
| `slidr-master.zip` | slider/UI source retained from earlier merge: UI inspiration and vendor docs | Docs/audit/reference only; not copied into runtime |
| `penpot-develop.zip` | large design app reference: heavy app, audited/docs only | Docs/audit/reference only; not copied into runtime |
| `excalidraw-master.zip` | large drawing app reference: heavy app, audited/docs only | Docs/audit/reference only; not copied into runtime |
| `drawio-dev.zip` | large diagram app reference: heavy app, audited/docs only | Docs/audit/reference only; not copied into runtime |
| `canva-clone-main.zip` | design clone reference: large app, audited/docs only | Docs/audit/reference only; not copied into runtime |
