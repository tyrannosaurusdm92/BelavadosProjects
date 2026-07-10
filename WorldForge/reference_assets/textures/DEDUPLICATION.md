# Texture deduplication

`globe.gl-master__clouds.png` and `three-globe-master__clouds.png` were byte-identical (SHA-256 `35c46d8b29651a99e482401f33ed752bf4625837435fb3a89bb0032f72b88a3a`). WorldForge retains the three-globe-named copy and records this alias rather than shipping duplicate binary data.
