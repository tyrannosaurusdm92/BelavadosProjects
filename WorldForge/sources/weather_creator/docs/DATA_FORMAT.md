# Import and export data format

## Geological GeoJSON

Polygon, MultiPolygon, Point, and MultiPoint features are supported. Longitude and latitude use ordinary GeoJSON order: `[longitude, latitude]`.

Recognized feature properties:

| Property | Meaning | Typical range |
|---|---|---|
| `elevationM` or `elevation` | Elevation above datum in metres | `-12000` to `12000` |
| `depthM` | Positive depth converted to negative elevation | `0` to `12000` |
| `ocean` or `water` | Ocean mask | `0` land, `1` ocean |
| `moisture` or `soilMoisture` | Surface moisture availability | `0` to `1` |
| `roughness` or `terrainRoughness` | Orographic roughness | `0` to `1` |
| `albedo` | Surface reflectivity | `0` to `1` |
| `volcanic` or `volcanism` | Volcanic influence | `0` to `1` |
| `geothermal` or `geothermalFlux` | Relative geothermal activity | `0` to `1` |
| `ice` or `iceCover` | Ice coverage | `0` to `1` |
| `biome` | Free-text biome label | string |

A polygon property is applied to every model cell whose center falls inside the polygon. Points alter the nearest cell.

## Weather-observation GeoJSON

Point features can be assimilated into the generated field. Recognized properties include:

- `temperatureC`, `temperature`, or `tempC`
- `pressureHpa` or `pressure`
- `humidity` (`0–1` or `0–100`)
- `cloud` or `cloudCover` (`0–1` or `0–100`)
- `precipMmHr` or `precipitation`
- `snowMmHr` or `snow`
- `windU` and `windV` in metres per second
- `stormRisk` from `0–1`
- optional `radiusDeg` and `weight`

The importer treats a FeatureCollection as weather data when at least half of its features contain weather properties.

## Heightmaps

PNG, JPEG, WebP, and BMP images are accepted. Images are interpreted as equirectangular grayscale heightmaps:

- black = `-9000 m`
- white = `+9000 m`
- pixels below `0 m` become ocean

For best results, use a 2:1 image such as `2048×1024`.

## Custom planet fragment

```json
{
  "type": "planetary-weather-project-fragment",
  "planet": {
    "name": "Example",
    "preset": "custom",
    "radiusKm": 7000,
    "gravity": 10.5,
    "rotationHours": 30,
    "yearDays": 420,
    "axialTilt": 18,
    "pressureBar": 1.3,
    "greenhouse": 1.1,
    "albedo": 0.28,
    "oceanPercent": 55,
    "magneticField": 1.4,
    "geothermal": 1.2,
    "stellarFlux": 0.95,
    "eccentricity": 0.04
  }
}
```

## Full project

The Save Project button exports a `planetary-weather-project` JSON document containing the planet, time, selected point, 3D view settings, observation overlays, and the full geological grid. Opening that file restores the creator state.
