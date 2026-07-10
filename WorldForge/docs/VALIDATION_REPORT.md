# WorldForge Validation Report

Generated: 2026-07-10T20:54:58.594Z
Result: **PASS**

- ✅ province count
- ✅ settlement count
- ✅ unique settlement ids
- ✅ valid coordinates
- ✅ maximum three biomes
- ✅ all settlement and npc paths exist
- ✅ backend endpoint lock
- ✅ backend lock checksum
- ✅ no alternate active backend endpoints
- ✅ required UI controls present
- ✅ surface/floating/underwater/cave settlement scene generation
- ✅ 28 world weather systems
- ✅ all canonical settlement JSON parses

## Generated scene samples

- surface: PASS — aelvanyr:Drakesylva; 21025 terrain vertices, 1272 structure vertices, 18 objects.
- floating: PASS — aelwynora:Orynéssa; 21025 terrain vertices, 560 structure vertices, 74 objects.
- underwater: PASS — aelwynora:Wilsara; 21025 terrain vertices, 1272 structure vertices, 74 objects.
- cave: PASS — drakmorren:Fenwyrd; 21025 terrain vertices, 1272 structure vertices, 27 objects.

Browser UI automation could not be executed in the build container because its Chromium policy blocks all local/file navigation. Static module syntax, data integrity, import paths, scene generation, and server responses were validated instead.