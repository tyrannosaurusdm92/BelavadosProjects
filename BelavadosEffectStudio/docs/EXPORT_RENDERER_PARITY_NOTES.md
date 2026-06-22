# Export Renderer Parity Notes

The exported interactive HTML includes its own compact copy of the runtime effect renderer. It now supports:

- ichor with lightning overlay
- thunder/electric rails
- chainLightning
- forkedLightning
- stormMesh
- sparkField
- blink, wave, hover, motes, pulse, and ordinary paint fallback
- layer visibility toggles
- global speed and opacity controls
- clickable shape hotspots

This was updated because adding effects only to the editor would have made exported HTML lose the new behavior. The export renderer is intentionally compact but uses the same segment/branch/flare concepts as the main editor.
