# Data formats

## World JSON

```json
{
  "schema": "worlddepth.world.v1",
  "name": "My Planet",
  "preset": "custom",
  "seed": 12345,
  "radius_km": 6800,
  "water_percent": 61,
  "sea_level_m": 0,
  "min_elevation_m": -14000,
  "max_elevation_m": 13000,
  "features": []
}
```

## Feature object

```json
{
  "name": "Northern Crown",
  "type": "mountain summit",
  "lat": 31.25,
  "lon": -72.50,
  "elevation_m": 9320,
  "description": "Mapped summit",
  "influence_lat": 1.5,
  "influence_lon": 1.5
}
```

`influence_lat` and `influence_lon` control how far a point observation reshapes the procedural fallback around it.

## Elevation grid

Values are normalized from 0 to 1 and ordered row-major from north to south, west to east.

```json
{
  "height_grid": {
    "width": 4,
    "height": 2,
    "min_elevation_m": -11000,
    "max_elevation_m": 9000,
    "values": [0.1, 0.2, 0.8, 0.4, 0.05, 0.3, 0.9, 0.2]
  }
}
```

## Heightmap image

- Longitude runs left to right from -180° to +180°.
- Latitude runs top to bottom from +90° to -90°.
- Black maps to the current world's minimum elevation.
- White maps to the current world's maximum elevation.

When importing from a ZIP, include `height`, `elevation`, `DEM`, `bathym`, or `depth` in the image filename to apply it automatically.

## GeoJSON

Supported geometry types:

- Point and MultiPoint
- LineString and MultiLineString
- Polygon and MultiPolygon outlines
- GeometryCollection

Point properties may include `name`, `type`, `description`, and `elevation_m`.

## Cave survey JSON

Stations are ordered along the passage centerline.

```json
{
  "schema": "worlddepth.cave-survey.v1",
  "name": "Example Cave",
  "units": "meters",
  "stations": [
    {"id":"ENT", "x":0, "y":0, "z":0, "width":2.5, "height":2.1},
    {"id":"A1", "x":5, "y":-2, "z":3, "width":3.4, "height":2.8}
  ]
}
```

## Settlement profile JSON

```json
{
  "name": "Mountain Valley Settlement",
  "biomes": [
    {"name":"Mountain range", "coverage":0.38},
    {"name":"Valley", "coverage":0.37},
    {"name":"Deep cavern", "coverage":0.25}
  ],
  "blending": {
    "transition_zones": "Valley floor narrows into cliffs and cave mouths"
  }
}
```

One to three biomes are accepted. Secondary and tertiary entries are optional.
