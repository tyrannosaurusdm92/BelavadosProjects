(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.BelavadosMapDomain = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAP_WIDTH = 2048;
  const ACTIVE_HEIGHT = 1024;
  const EARTH_RADIUS_MILES = 3958.7613;
  const KM_PER_MILE = 1.609344;

  const BIOME_RULES = {
    water: {
      biomes: ['Underwater without reefs', 'Ocean Surface floating settlement'],
      resources: ['Fish', 'Salt', 'Kelp', 'Deep-water salvage', 'Pearls'],
      raceTerms: ['aquatic', 'amphibious', 'merfolk', 'water']
    },
    reef: {
      biomes: ['Underwater with reefs', 'Beach and reefs with water'],
      resources: ['Coral', 'Pearls', 'Shellfish', 'Medicinal algae', 'Reef fish'],
      raceTerms: ['aquatic', 'amphibious', 'merfolk', 'fey']
    },
    coast: {
      biomes: ['Beach and grass with water', 'Beach and reefs with water'],
      resources: ['Fish', 'Salt', 'Shellfish', 'Timber', 'Harbor services'],
      raceTerms: ['human', 'aquatic', 'amphibious', 'halfling']
    },
    forest: {
      biomes: ['Deep and Lush forest', 'Partial forest', 'Treetops - treehouses'],
      resources: ['Timber', 'Medicinal herbs', 'Game', 'Resins', 'Fruit'],
      raceTerms: ['elf', 'fey', 'animalfolk', 'human']
    },
    mountain: {
      biomes: ['Mountain range', 'Valley', 'Deep cavern'],
      resources: ['Stone', 'Iron ore', 'Copper ore', 'Gems', 'Mountain herbs'],
      raceTerms: ['dwarf', 'gnome', 'giant', 'draconic']
    },
    hill: {
      biomes: ['Valley', 'Grassland', 'Partial forest'],
      resources: ['Stone', 'Grazing livestock', 'Clay', 'Herbs'],
      raceTerms: ['human', 'halfling', 'dwarf', 'gnome']
    },
    valley: {
      biomes: ['Valley', 'Farming', 'Grassland'],
      resources: ['Grain', 'Produce', 'Fresh water', 'Livestock'],
      raceTerms: ['human', 'halfling', 'elf']
    },
    farming: {
      biomes: ['Farming', 'Grassland', 'Partial forest'],
      resources: ['Grain', 'Produce', 'Livestock', 'Plant fibers', 'Milled goods'],
      raceTerms: ['human', 'halfling', 'smallfolk']
    },
    grassland: {
      biomes: ['Grassland', 'Prairie', 'Farming'],
      resources: ['Grain', 'Livestock', 'Leather', 'Plant fibers'],
      raceTerms: ['human', 'centaur', 'halfling', 'animalfolk']
    },
    desert: {
      biomes: ['Prairie', 'Mountain range', 'Deep cavern'],
      resources: ['Salt', 'Stone', 'Rare minerals', 'Drought-resistant herbs'],
      raceTerms: ['reptilian', 'draconic', 'human', 'construct']
    },
    marsh: {
      biomes: ['Marshes and swamps', 'Rainforest', 'Partial forest'],
      resources: ['Medicinal reeds', 'Peat', 'Fish', 'Poison ingredients'],
      raceTerms: ['amphibious', 'reptilian', 'fey', 'animalfolk']
    },
    tundra: {
      biomes: ['Mountain range', 'Grassland', 'Deep cavern'],
      resources: ['Furs', 'Cold-water fish', 'Stone', 'Ice crystals'],
      raceTerms: ['giant', 'dwarf', 'human', 'animalfolk']
    },
    unknown: {
      biomes: ['Grassland', 'Partial forest', 'Farming'],
      resources: ['Produce', 'Timber', 'Stone', 'Local crafts'],
      raceTerms: ['human', 'mixed', 'halfling']
    }
  };

  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }
  function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
  function safeNumber(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) ? number : fallback; }
  function slug(value) {
    return String(value || 'unnamed').normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[’‘`´]/g, "'").replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '').toLowerCase();
  }
  function xyToLatLon(point) {
    return {
      longitude: ((safeNumber(point.x) / MAP_WIDTH) * 360) - 180,
      latitude: 90 - ((safeNumber(point.y) / ACTIVE_HEIGHT) * 180)
    };
  }
  function pointInPolygon(point, polygon) {
    if (!point || !Array.isArray(polygon) || polygon.length < 3) return false;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const a = polygon[i], b = polygon[j];
      if (((a.y > point.y) !== (b.y > point.y)) &&
          point.x < ((b.x - a.x) * (point.y - a.y)) / ((b.y - a.y) || 1e-12) + a.x) inside = !inside;
    }
    return inside;
  }
  function polygonCentroid(points) {
    if (!points?.length) return {x: MAP_WIDTH / 2, y: ACTIVE_HEIGHT / 2};
    return {x: points.reduce((n, p) => n + safeNumber(p.x), 0) / points.length,
      y: points.reduce((n, p) => n + safeNumber(p.y), 0) / points.length};
  }
  function resamplePolygon(points, count = 6) {
    const source = (points || []).filter(p => Number.isFinite(Number(p.x)) && Number.isFinite(Number(p.y)));
    if (!source.length) return [];
    if (source.length === 1) return regularHexagon(source[0], 18);
    const segments = [];
    let perimeter = 0;
    for (let i = 0; i < source.length; i++) {
      const a = source[i], b = source[(i + 1) % source.length];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      segments.push({a, b, start: perimeter, length}); perimeter += length;
    }
    if (!perimeter) return regularHexagon(source[0], 18);
    const result = [];
    for (let i = 0; i < count; i++) {
      const target = (perimeter * i) / count;
      const segment = segments.find(s => target <= s.start + s.length) || segments[segments.length - 1];
      const ratio = segment.length ? (target - segment.start) / segment.length : 0;
      result.push({x: segment.a.x + (segment.b.x - segment.a.x) * ratio,
        y: segment.a.y + (segment.b.y - segment.a.y) * ratio});
    }
    return result;
  }
  function regularHexagon(center, radius = 18) {
    const c = center || {x: MAP_WIDTH / 2, y: ACTIVE_HEIGHT / 2};
    return Array.from({length: 6}, (_, i) => {
      const angle = -Math.PI / 2 + i * Math.PI / 3;
      return {x: safeNumber(c.x) + Math.cos(angle) * radius, y: safeNumber(c.y) + Math.sin(angle) * radius};
    });
  }
  function polygonAreaMiles(points) {
    if (!Array.isArray(points) || points.length < 3) return 0;
    const ll = points.map(xyToLatLon);
    const meanLat = ll.reduce((n, p) => n + p.latitude, 0) / ll.length * Math.PI / 180;
    const projected = ll.map(p => ({x: EARTH_RADIUS_MILES * p.longitude * Math.PI / 180 * Math.cos(meanLat),
      y: EARTH_RADIUS_MILES * p.latitude * Math.PI / 180}));
    let twice = 0;
    for (let i = 0, j = projected.length - 1; i < projected.length; j = i++) twice += projected[j].x * projected[i].y - projected[i].x * projected[j].y;
    return Math.abs(twice) / 2;
  }
  function updateTerritoryArea(territory) {
    const incoming = territory.anchors || territory.points || [];
    territory.anchors = incoming.length === 6 ? clone(incoming) : resamplePolygon(incoming, 6);
    territory.points = clone(territory.anchors);
    const miles = polygonAreaMiles(territory.anchors);
    territory.squareMiles = Math.round(miles * 100) / 100;
    territory.squareKilometers = Math.round(miles * KM_PER_MILE * KM_PER_MILE * 100) / 100;
    territory.anchorCount = 6;
    territory.areaAuthority = 'Live six-anchor territory polygon';
    territory.updatedAt = new Date().toISOString();
    territory.anchors.forEach((a, i) => Object.assign(a, xyToLatLon(a), {dir: `T${i + 1}`}));
    return territory;
  }
  function normalizeTerritories(provinces) {
    for (const province of provinces || []) {
      province.territories = (province.territories || []).map(t => updateTerritoryArea({...t, anchors: clone(t.anchors || t.points || [])}));
      province.detachedTerritoryCount = province.territories.length;
    }
    return provinces;
  }
  function findProvinceAt(point, provinces) {
    return (provinces || []).find(p => pointInPolygon(point, p.anchors || p.points || [])) || null;
  }
  function terrainKey(value) {
    const text = String(value || '').toLowerCase();
    if (/reef|shallow/.test(text)) return 'reef';
    if (/water|ocean|sea|river|lake/.test(text)) return 'water';
    if (/coast|beach|island|delta/.test(text)) return 'coast';
    if (/marsh|swamp|bog/.test(text)) return 'marsh';
    if (/forest|tree|rainforest/.test(text)) return 'forest';
    if (/mountain|canyon|plateau|cavern/.test(text)) return 'mountain';
    if (/hill/.test(text)) return 'hill';
    if (/valley/.test(text)) return 'valley';
    if (/farm/.test(text)) return 'farming';
    if (/grass|prairie/.test(text)) return 'grassland';
    if (/desert|sand/.test(text)) return 'desert';
    if (/tundra|snow|ice/.test(text)) return 'tundra';
    return 'unknown';
  }
  function raceLabelsFor(rule, raceCatalog) {
    const records = [];
    for (const category of raceCatalog || []) {
      for (const parent of category.parentRaces || category.races || []) records.push({
        label: parent.label || parent.name, haystack: [category.label, category.creator, parent.label, parent.description].join(' ').toLowerCase()
      });
    }
    const selected = [];
    for (const term of rule.raceTerms) {
      const match = records.find(r => !selected.includes(r.label) && r.haystack.includes(term));
      if (match) selected.push(match.label);
    }
    return selected.slice(0, 6);
  }
  function derivePlacement(settlement, terrainValue, raceCatalog) {
    const key = terrainKey(terrainValue);
    const rule = BIOME_RULES[key] || BIOME_RULES.unknown;
    const type = String(settlement.type || settlement.pinType || settlement.settlementType || 'Village').toLowerCase();
    const transit = key === 'water' ? ['Submarine'] : key === 'reef' ? ['Submarine', 'Steamship'] :
      key === 'coast' ? ['Steamship', 'Submarine', 'Train', 'Caravan'] : ['Train', 'Caravan'];
    if ((type.includes('city') || type.includes('capital')) && !['water','reef'].includes(key)) transit.push('Skyship');
    if (type.includes('capital')) transit.push('Portal');
    const races = raceLabelsFor(rule, raceCatalog);
    return {
      terrainKey: key,
      biomes: rule.biomes.slice(0, 3), primaryBiome: rule.biomes[0],
      resources: unique(rule.resources), races,
      transit: unique(transit)
    };
  }
  function applyPlacement(settlement, terrainValue, raceCatalog) {
    const derived = derivePlacement(settlement, terrainValue, raceCatalog);
    settlement.biomes = derived.biomes;
    settlement.biomeCache = derived.biomes;
    settlement.primaryBiome = derived.primaryBiome;
    settlement.mappedBiomeAtPin = derived.primaryBiome;
    settlement.manualWaterLandClass = ['water', 'reef'].includes(derived.terrainKey) ? 'water' : derived.terrainKey === 'coast' ? 'coastal' : 'land';
    settlement.resourcesAndServicesProvided = derived.resources;
    settlement.resources = derived.resources;
    settlement.races = derived.races;
    settlement.majorityPopulationRaces = derived.races.slice(0, 2);
    settlement.publicTransit = derived.transit;
    settlement.publicTransportation = derived.transit;
    settlement.transportation = derived.transit;
    settlement.placementDerived = derived;
    settlement.placementDerivedAt = new Date().toISOString();
    return settlement;
  }
  function createOrUpdateTerritory(province, settlement, radius) {
    province.territories ||= [];
    const name = settlement.name || settlement.settlement || 'Unnamed Territory';
    let territory = province.territories.find(t => (t.settlementId && t.settlementId === settlement.id) || t.name === name || t.territory === name);
    if (!territory) {
      territory = {id: settlement.id ? `territory-${settlement.id}` : `territory-${slug(name)}`, name, territory: name,
        settlementId: settlement.id || null, color: province.color, borderColor: province.color, borderWidth: 5,
        borderOpacity: 0.18, dashPattern: [10, 7], anchors: regularHexagon(settlement, radius || 18)};
      province.territories.push(territory);
    } else {
      const center = polygonCentroid(territory.anchors || territory.points || []);
      const dx = safeNumber(settlement.x) - center.x, dy = safeNumber(settlement.y) - center.y;
      territory.anchors = (territory.anchors || territory.points || regularHexagon(settlement, radius || 18)).map(p => ({...p, x: p.x + dx, y: p.y + dy}));
      territory.settlementId = settlement.id || territory.settlementId || null;
    }
    updateTerritoryArea(territory);
    province.detachedTerritoryCount = province.territories.length;
    return territory;
  }
  function removeSettlementTerritory(province, settlement) {
    if (!province?.territories) return;
    const name = settlement.name || settlement.settlement;
    province.territories = province.territories.filter(t => !((settlement.id && t.settlementId === settlement.id) || t.name === name || t.territory === name));
    province.detachedTerritoryCount = province.territories.length;
  }
  function moveSettlementBetweenProvinces(settlement, fromProvince, toProvince) {
    if (!settlement || !toProvince) return settlement;
    if (fromProvince && fromProvince !== toProvince) fromProvince.settlements = (fromProvince.settlements || []).filter(s => s !== settlement);
    toProvince.settlements ||= [];
    if (!toProvince.settlements.includes(settlement)) toProvince.settlements.push(settlement);
    settlement.assignedProvince = toProvince.name || toProvince.province;
    settlement.province = settlement.assignedProvince;
    settlement.provinceName = settlement.assignedProvince;
    settlement.scope = 'settlement'; settlement.isTerritory = false; settlement.finalPlacementScope = 'mainland';
    return settlement;
  }
  function rebuildRoutes(provinces) {
    const routes = [];
    for (const province of provinces || []) {
      const placed = (province.settlements || []).filter(s => Number.isFinite(Number(s.x)) && Number.isFinite(Number(s.y)));
      for (const source of placed) {
        const neighbors = placed.filter(s => s !== source).sort((a, b) =>
          Math.hypot(a.x - source.x, a.y - source.y) - Math.hypot(b.x - source.x, b.y - source.y)).slice(0, 2);
        for (const target of neighbors) {
          const a = source.settlementId || source.id || source.name, b = target.settlementId || target.id || target.name;
          const pair = [String(a), String(b)].sort();
          const id = `${slug(province.name)}:${slug(pair[0])}:${slug(pair[1])}`;
          if (routes.some(r => r.id === id)) continue;
          const shared = (source.publicTransit || source.transportation || []).filter(x => (target.publicTransit || target.transportation || []).includes(x));
          const modes = shared.length ? shared : unique([...(source.publicTransit || []), ...(target.publicTransit || [])]).slice(0, 2);
          routes.push({id, province: province.name, from: source.name, to: target.name, modes,
            points: [{x: source.x, y: source.y}, {x: target.x, y: target.y}], updatedFromPlacement: true});
        }
      }
    }
    return routes;
  }
  function ring(points) { const values = (points || []).map(p => [safeNumber(p.x), safeNumber(p.y)]); if (values.length) values.push([...values[0]]); return values; }
  function buildGeoJSON(provinces) {
    const features = [];
    for (const p of provinces || []) {
      features.push({type: 'Feature', properties: {featureKind: 'province-border', province: p.name, borderColor: p.color, borderWidth: p.width, borderOpacity: p.opacity}, geometry: {type: 'Polygon', coordinates: [ring(p.anchors || p.points)]}});
      if (p.pin) features.push({type: 'Feature', properties: {featureKind: 'province-center-pin', province: p.name, name: p.name, color: p.color}, geometry: {type: 'Point', coordinates: [p.pin.x, p.pin.y]}});
      for (const t of p.territories || []) features.push({type: 'Feature', properties: {featureKind: 'territory-border', province: p.name, territory: t.name || t.territory, borderColor: t.color || p.color, squareMiles: t.squareMiles, squareKilometers: t.squareKilometers, anchorCount: 6}, geometry: {type: 'Polygon', coordinates: [ring(t.anchors)]}});
      for (const s of p.settlements || []) if (Number.isFinite(Number(s.x)) && Number.isFinite(Number(s.y))) features.push({type: 'Feature', properties: {
        featureKind: s.isTerritory ? 'territory-pin' : 'settlement-pin', province: p.name, settlement: s.name, name: s.name,
        settlementId: s.settlementId || s.id || null, pinId: s.pinId || null, locationId: s.locationId || null,
        settlementType: s.settlementType || s.type || 'Village', type: s.type || s.settlementType || 'Village', isTerritory: !!s.isTerritory
      }, geometry: {type: 'Point', coordinates: [s.x, s.y]}});
    }
    return {type: 'FeatureCollection', generatedAt: new Date().toISOString(), features};
  }
  function buildViewerWorld(dm) {
    const provinces = (dm.provinces || []).map(p => {
      const center = p.pin || p.provinceCenterPin || {x: 0, y: 0}; const ll = xyToLatLon(center);
      const province = clone(p); delete province.settlements;
      return {...province, name: p.name || p.province, center: {x: center.x, y: center.y, latitude: ll.latitude, longitude: ll.longitude, utc: utcForLongitude(ll.longitude)},
        squareMiles: p.squareMiles || polygonAreaMiles(p.anchors || p.points || []), squareKilometers: p.squareKilometers || (p.squareMiles || 0) * KM_PER_MILE * KM_PER_MILE};
    });
    const settlements = (dm.provinces || []).flatMap(p => (p.settlements || []).map(s => ({...clone(s), name: s.name || s.settlement, province: p.name || p.province,
      latitude: xyToLatLon(s).latitude, longitude: xyToLatLon(s).longitude, utc: utcForLongitude(xyToLatLon(s).longitude)})));
    return {schema: 'belavados-canonical-world-v2-live-editor', schemaVersion: 2, title: 'Belavadös Canonical World Map',
      map: {width: MAP_WIDTH, height: 1239, activeSurfaceHeight: ACTIVE_HEIGHT}, provinces, settlements,
      routes: clone(dm.routes || []), counts: {provinces: provinces.length, settlementsAndTerritories: settlements.length,
        territories: provinces.reduce((n, p) => n + (p.territories || []).length, 0), naturalSystems: (dm.naturalSystems || []).length},
      generatedAt: new Date().toISOString()};
  }
  function utcForLongitude(lon) { const offset = Math.max(-12, Math.min(12, Math.round(safeNumber(lon) / 15))); return offset === 0 ? 'UTC±0' : `UTC${offset > 0 ? '+' : ''}${offset}`; }

  return {MAP_WIDTH, ACTIVE_HEIGHT, EARTH_RADIUS_MILES, KM_PER_MILE, clone, unique, slug, xyToLatLon,
    pointInPolygon, polygonCentroid, resamplePolygon, regularHexagon, polygonAreaMiles, updateTerritoryArea,
    normalizeTerritories, findProvinceAt, terrainKey, derivePlacement, applyPlacement, createOrUpdateTerritory,
    removeSettlementTerritory, moveSettlementBetweenProvinces, rebuildRoutes, buildGeoJSON, buildViewerWorld, utcForLongitude};
});
