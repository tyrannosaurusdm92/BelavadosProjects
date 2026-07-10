# References, acknowledgements, and licenses

The creator's implementation is original, dependency-free browser code written for this package. The attached repositories were studied as architectural and visual references. Code from GPL projects was not copied into this package.

## Source-project references

- **earth / earth.nullschool.net** by Cameron Beccario — global weather-field visualization, particle-flow concepts, and temporal weather-layer presentation. MIT License; copy included in `docs/licenses/earth-nullschool-MIT.txt`.
- **3D Weather App** by Ionut Alixandroae — 3D location-focused weather interface ideas. MIT License; copy included in `docs/licenses/3d-weather-app-MIT.txt`.
- **3D Weather Plugin** by ScreteMonge — biome/season weather-cycle concepts and precipitation categories. BSD 2-Clause License; copy included in `docs/licenses/3d-weather-plugin-BSD-2-Clause.txt`.
- **Real-Time Earthquake Globe** by Aaron Murillo — globe HUD, coordinate visualization, atmosphere, geological layer presentation, and time-playback concepts. No source code or assets from that repository are redistributed here.
- **Weather 3D Visualization / Codrops project** — 3D precipitation, cloud, day/night, and forecast-portal presentation ideas. No source files from that repository are redistributed here.
- **3d-weather-sandbox** — volumetric-cloud and precipitation presentation reference. No source files are redistributed here.
- **Weather-Simulation** — particle-system and 3D camera concepts. No source files are redistributed here.
- **Aurora Borealis Simulation** and **AuroraSim** — auroral-particle and multi-planet aurora concepts. No simulation code, papers, images, or videos are redistributed here.
- **Met.3D** — atmospheric 3D-field and ensemble-forecast visualization concepts. Met.3D is GPL-3.0; no Met.3D code is included in this package.
- **Weather App ThreeJS** — interactive globe, camera focus, and location-dashboard concepts. No textures or code from that repository are included.

## Data and scientific scope

The default land mask was generated for this package from the Natural Earth coastline TopoJSON distributed with the MIT-licensed `earth` project. Natural Earth public-domain geography supplies the coastline shape; generated topography inside and below that mask is procedural. The weather equations are intentionally lightweight and designed for interactive fictional-world prototyping. They do not solve the primitive equations of atmospheric motion and must not be used for real emergency planning.
