(function(global){
  'use strict';

  const DEFAULT_ATMOSPHERE = [
    { id:'troposphere', name:'Troposphere', altitudeKm:[0,12], radiusScale:1.018, color:'#86d9ff', opacity:0.15, description:'Lowest weather-bearing layer.' },
    { id:'stratosphere', name:'Stratosphere', altitudeKm:[12,50], radiusScale:1.040, color:'#64b5ff', opacity:0.10, description:'Stable layer above weather; skyship-cruise friendly when canon allows.' },
    { id:'mesosphere', name:'Mesosphere', altitudeKm:[50,85], radiusScale:1.065, color:'#4e78ff', opacity:0.07, description:'Cold meteor-burn layer.' },
    { id:'thermosphere', name:'Thermosphere', altitudeKm:[85,600], radiusScale:1.095, color:'#8e63ff', opacity:0.055, description:'Aurora and high-energy upper atmosphere.' },
    { id:'exosphere', name:'Exosphere', altitudeKm:[600,10000], radiusScale:1.145, color:'#d7b8ff', opacity:0.035, description:'Outer fading atmosphere.' }
  ];

  const DEFAULT_SHELLS = [
    { id:'continental_crust', name:'Continental crust', radiusScale:0.985, color:'#ae8b62', opacity:0.34 },
    { id:'oceanic_crust', name:'Oceanic crust', radiusScale:0.973, color:'#426c94', opacity:0.28 },
    { id:'upper_mantle', name:'Upper mantle', radiusScale:0.83, color:'#bf6a32', opacity:0.25 },
    { id:'lower_mantle', name:'Lower mantle', radiusScale:0.62, color:'#d2512f', opacity:0.22 },
    { id:'outer_core', name:'Outer core', radiusScale:0.42, color:'#ffb02e', opacity:0.32 },
    { id:'inner_core', name:'Inner core', radiusScale:0.22, color:'#fff2a8', opacity:0.45 }
  ];

  const DEFAULT_LON_LABELS = [-180,-150,-120,-90,-60,-30,0,30,60,90,120,150,180].map(lon => ({ lon, label: lon === 0 ? '0° UTC' : `${Math.abs(lon)}° ${lon<0?'W':'E'}` }));
  const DEFAULT_LAT_LABELS = [-90,-60,-30,0,30,60,90].map(lat => ({ lat, label: lat === 0 ? '0° Equator' : `${Math.abs(lat)}° ${lat<0?'S':'N'}` }));

  function assemble(files, options){
    options = options || {};
    const decisions = [];
    const conflicts = [];
    const world = blankWorld(options.worldName || detectWorldName(files));
    world.metadata.generatedAt = new Date().toISOString();
    world.metadata.sourceCount = files.length;
    world.metadata.processingBudgetSeconds = Number(options.budgetSeconds || 180);
    world.metadata.conflictRule = options.conflictRule || 'specific-newer';
    world.sources = files.map(sourceSummary);

    chooseAssets(files, world, decisions, options);

    for(const file of files){
      const tags = new Set(file.classification?.tags || []);
      if(file.geojson) ingestGeoJSON(file, world, decisions);
      else if(file.json) ingestJSON(file, world, decisions);
      if(tags.has('lore-doc') && (file.docxText || file.text)) ingestLore(file, world, decisions);
      if(tags.has('atmosphere-data')) readAtmosphereHints(file, world, decisions);
      if(tags.has('shell-layer-data')) readShellHints(file, world, decisions);
      if(tags.has('celestial-data')) readCelestialHints(file, world, decisions);
    }

    inferFeatureFamilies(world, decisions);
    normalizeFeatures(world, decisions, conflicts, options);
    generateDerivedLayers(world, decisions);
    resolveConflicts(world, decisions, conflicts, options);
    buildIndexes(world);

    if(!world.features.provinces.length && !world.features.settlements.length && !world.features.routes.length){
      createDemoWorld(world, decisions);
    }

    world.decisions = decisions;
    world.conflicts = conflicts;
    world.stats = computeStats(world);
    return world;
  }

  function blankWorld(name){
    return {
      schema:'worldforge.globe.v1',
      metadata:{ name:name || 'Untitled World', generatedAt:null, sourceCount:0, coordinateSystem:'lat-lon-degrees', radiusKm:6371, utcAlignment:true },
      backend:{ primary:null, backup:null, primaryLibrary:null, backupLibrary:null, lastSync:null },
      assets:{ surfaceMaps:[], heightMaps:[], depthMaps:[], textures:[], icons:[], models:[], styleSheets:[], docs:[] },
      layers:{ atmosphere: clone(DEFAULT_ATMOSPHERE), shells: clone(DEFAULT_SHELLS), longitudes:clone(DEFAULT_LON_LABELS), latitudes:clone(DEFAULT_LAT_LABELS), timeZones:[] },
      features:{ provinces:[], settlements:[], provinceCenters:[], borders:[], routes:[], weatherZones:[], climateZones:[], topography:[], oceans:[], mountains:[], volcanoes:[], caves:[], caverns:[], reefs:[], plants:[], seaLife:[], npcs:[], celestial:[], labels:[], lorePins:[] },
      canon:{ documents:[], instructions:[], weather:[], time:[], topography:[], atmosphere:[], shell:[], celestial:[], conflicts:[] },
      sources:[], decisions:[], conflicts:[], indexes:{}
    };
  }

  function detectWorldName(files){
    const interesting = files.map(f => f.path || '').join('\n');
    const candidates = [/belavad[oö]s/i, /vací?o l['’]ab/i, /world[_ -]?forge/i];
    for(const rx of candidates){ const m = interesting.match(rx); if(m) return titleCase(m[0].replace(/_/g,' ')); }
    const doc = files.find(f => f.docxText && /world name|planet|globe/i.test(f.docxText));
    if(doc){
      const m = doc.docxText.match(/(?:world|planet|globe)\s*(?:name)?\s*[:\-–]\s*([^\n]{3,80})/i);
      if(m) return m[1].trim();
    }
    return 'Generated World Globe';
  }

  function chooseAssets(files, world, decisions, options){
    const imageFiles = files.filter(f => f.image || ['png','jpg','jpeg','webp','gif','bmp'].includes(f.ext));
    for(const f of imageFiles){
      const tags = new Set(f.classification?.tags || []);
      const asset = assetSummary(f);
      if(tags.has('surface-map')) world.assets.surfaceMaps.push(asset);
      else if(tags.has('height-map')) world.assets.heightMaps.push(asset);
      else if(tags.has('depth-map')) world.assets.depthMaps.push(asset);
      else if(tags.has('pin-data') || tags.has('svg-style')) world.assets.icons.push(asset);
      else world.assets.textures.push(asset);
    }
    for(const f of files){
      const tags = new Set(f.classification?.tags || []);
      if(tags.has('model-3d')) world.assets.models.push(assetSummary(f));
      if(tags.has('documentation') || tags.has('license')) world.assets.docs.push(assetSummary(f));
      if((f.ext === 'css') || /\.css$/i.test(f.path||'')) world.assets.styleSheets.push(assetSummary(f));
    }
    if(world.assets.surfaceMaps.length) decisions.push(`Selected ${world.assets.surfaceMaps[0].path} as the primary surface-map candidate; all alternatives remain available.`);
    if(world.assets.heightMaps.length) decisions.push(`Detected ${world.assets.heightMaps.length} height/elevation map candidate(s).`);
    if(world.assets.depthMaps.length) decisions.push(`Detected ${world.assets.depthMaps.length} depth/bathymetry map candidate(s).`);
  }

  function ingestGeoJSON(file, world, decisions){
    const gj = file.geojson;
    const features = gj.type === 'FeatureCollection' ? (gj.features || []) : (gj.type === 'Feature' ? [gj] : [{ type:'Feature', properties:{}, geometry:gj }]);
    let added = 0;
    for(const feat of features){
      const g = feat.geometry || {};
      const props = Object.assign({}, feat.properties || {});
      props._source = file.path;
      props._modified = file.modified || 0;
      const type = String(g.type || '').toLowerCase();
      const role = inferRole(props, file, type);
      if(type.includes('point')){
        const points = normalizePointCoordinates(g.coordinates);
        for(const p of points){ addPointRole(role, p, props, world); added++; }
      } else if(type.includes('line')){
        const lines = normalizeLineCoordinates(g.coordinates, type);
        for(const line of lines){ addLineRole(role, line, props, world); added++; }
      } else if(type.includes('polygon')){
        const polys = normalizePolygonCoordinates(g.coordinates, type);
        for(const poly of polys){ addPolygonRole(role, poly, props, world); added++; }
      }
    }
    if(added) decisions.push(`Ingested ${added} GeoJSON feature(s) from ${file.path}.`);
  }

  function ingestJSON(file, world, decisions){
    const obj = file.json;
    if(obj && (obj.type === 'FeatureCollection' || obj.type === 'Feature' || obj.geometry)) return ingestGeoJSON(Object.assign({}, file, { geojson: obj }), world, decisions);
    const hits = [];
    walk(obj, [], (value, path) => {
      if(!value || typeof value !== 'object' || Array.isArray(value)) return;
      const ll = latlonFrom(value);
      const role = inferRole(value, file, 'json');
      if(ll){ addPointRole(role, [ll.lon, ll.lat], Object.assign({}, value, {_source:file.path, _path:path.join('.'), _modified:file.modified||0}), world); hits.push(role); return; }
      const coords = value.coordinates || value.coords || value.points || value.path || value.geometry;
      if(Array.isArray(coords) && looksLikeLine(coords)){
        addLineRole(role, coords.map(c => Array.isArray(c) ? [Number(c[0]), Number(c[1])] : [Number(c.lon || c.lng || c.longitude), Number(c.lat || c.latitude)]).filter(validPair), Object.assign({}, value, {_source:file.path, _path:path.join('.'), _modified:file.modified||0}), world);
        hits.push(role);
      }
    });
    if(hits.length) decisions.push(`Extracted ${hits.length} coordinate-bearing record(s) from ${file.path}.`);
    else {
      const txt = JSON.stringify(obj).slice(0, 200000);
      routeArrayFallback(obj, file, world, decisions);
      if(/atmosphere|troposphere|stratosphere|mesosphere|thermosphere|exosphere/i.test(txt)) world.canon.atmosphere.push({ source:file.path, text:txt.slice(0, 4000) });
      if(/shell|mantle|core|crust/i.test(txt)) world.canon.shell.push({ source:file.path, text:txt.slice(0, 4000) });
      if(/weather|storm|climate|biome|season/i.test(txt)) world.canon.weather.push({ source:file.path, text:txt.slice(0, 4000) });
    }
  }

  function routeArrayFallback(obj, file, world, decisions){
    const arrays = [];
    walk(obj, [], (v,p) => { if(Array.isArray(v) && v.length > 1 && v.length < 5000) arrays.push([v,p]); });
    let count = 0;
    for(const [arr,p] of arrays){
      if(!/route|rail|train|ferry|steamship|submarine|skyship|portal|caravan|path|leg|stops/i.test(p.join('.'))) continue;
      for(const item of arr){
        if(!item || typeof item !== 'object') continue;
        const stops = item.stops || item.points || item.coordinates || item.path;
        if(Array.isArray(stops) && looksLikeLine(stops)){
          const line = stops.map(s => Array.isArray(s) ? [Number(s[0]), Number(s[1])] : [Number(s.lon||s.lng||s.longitude), Number(s.lat||s.latitude)]).filter(validPair);
          if(line.length > 1){ addLineRole('route', line, Object.assign({}, item, {_source:file.path, _path:p.join('.'), _modified:file.modified||0}), world); count++; }
        }
      }
    }
    if(count) decisions.push(`Route fallback extracted ${count} route line(s) from ${file.path}.`);
  }

  function ingestLore(file, world, decisions){
    const text = (file.docxText || file.text || '').trim();
    if(!text) return;
    const doc = { source:file.path, title:file.docxProps?.title || file.name, modified:file.modified || null, excerpt:text.slice(0, 12000), length:text.length };
    world.canon.documents.push(doc);
    const buckets = [
      ['weather', /weather|rain|storm|cloud|snow|season|wind|climate|biome/i],
      ['time', /utc|timezone|longitude|latitude|calendar|clock|fast forward|pause|year/i],
      ['topography', /topography|mountain|ocean|depth|height|plate|crust|terrain|volcano|reef|cave/i],
      ['atmosphere', /troposphere|stratosphere|mesosphere|thermosphere|exosphere|atmosphere/i],
      ['shell', /mantle|core|shell|underworld|continental crust|oceanic crust/i],
      ['celestial', /moon|sun|constellation|solar system|comet|planet|star|aurora|spirit light/i]
    ];
    for(const [bucket, rx] of buckets){
      if(rx.test(text)) world.canon[bucket].push({ source:file.path, text: extractRelevant(text, rx, 9000) });
    }
    decisions.push(`Read DOCX/text canon from ${file.path} (${text.length.toLocaleString()} characters).`);
  }

  function readAtmosphereHints(file, world, decisions){
    const text = String(file.docxText || file.text || JSON.stringify(file.json || {}));
    const names = ['troposphere','stratosphere','mesosphere','thermosphere','exosphere'];
    let matched = false;
    for(const layer of world.layers.atmosphere){
      const rx = new RegExp(layer.name + '[\\s\\S]{0,280}?(\\d+)\\s*(?:to|-|–)\\s*(\\d+)\\s*km', 'i');
      const m = text.match(rx);
      if(m){ layer.altitudeKm = [Number(m[1]), Number(m[2])]; matched = true; }
    }
    if(names.some(n => text.toLowerCase().includes(n))){ matched = true; world.canon.atmosphere.push({ source:file.path, text:extractRelevant(text, /troposphere|stratosphere|mesosphere|thermosphere|exosphere/i, 6000) }); }
    if(matched) decisions.push(`Applied atmosphere hints from ${file.path}.`);
  }

  function readShellHints(file, world, decisions){
    const text = String(file.docxText || file.text || JSON.stringify(file.json || {}));
    if(/mantle|core|crust|shell/i.test(text)){
      world.canon.shell.push({ source:file.path, text:extractRelevant(text, /mantle|core|crust|shell|continental|oceanic/i, 6000) });
      decisions.push(`Captured shell/layer hints from ${file.path}.`);
    }
  }

  function readCelestialHints(file, world, decisions){
    const text = String(file.docxText || file.text || JSON.stringify(file.json || {}));
    if(/moon|sun|planet|constellation|comet|star|aurora|spirit/i.test(text)){
      world.canon.celestial.push({ source:file.path, text:extractRelevant(text, /moon|sun|planet|constellation|comet|star|aurora|spirit/i, 6000) });
      if(!world.features.celestial.some(c => c.id === 'sun')) world.features.celestial.push({ id:'sun', name:'Sun', type:'sun', lon:0, lat:0, radiusScale:2.6, _source:file.path });
      if(!world.features.celestial.some(c => c.id === 'primary_moon')) world.features.celestial.push({ id:'primary_moon', name:'Primary Moon', type:'moon', lon:40, lat:15, orbit:true, _source:file.path });
      decisions.push(`Captured celestial hints from ${file.path}.`);
    }
  }

  function addPointRole(role, p, props, world){
    const lon = Number(p[0]), lat = Number(p[1]);
    if(!validPair([lon,lat])) return;
    const item = featureBase(props, lon, lat);
    if(role === 'province-center') world.features.provinceCenters.push(item);
    else if(role === 'route') world.features.routes.push(Object.assign(item, { points:[[lon,lat]], geometryType:'Point' }));
    else if(role === 'weather') world.features.weatherZones.push(Object.assign(item, { radiusKm: props.radiusKm || props.radius || 400 }));
    else if(role === 'climate') world.features.climateZones.push(Object.assign(item, { radiusKm: props.radiusKm || props.radius || 650 }));
    else if(role === 'mountain') world.features.mountains.push(item);
    else if(role === 'volcano') world.features.volcanoes.push(item);
    else if(role === 'cave') world.features.caves.push(item);
    else if(role === 'reef') world.features.reefs.push(item);
    else if(role === 'plant') world.features.plants.push(item);
    else if(role === 'sea-life') world.features.seaLife.push(item);
    else if(role === 'npc') world.features.npcs.push(item);
    else world.features.settlements.push(item);
  }

  function addLineRole(role, line, props, world){
    if(!line || line.length < 2) return;
    const item = Object.assign(featureBase(props), { points: line, geometryType:'LineString' });
    if(role === 'route') world.features.routes.push(item);
    else if(role === 'topography' || role === 'trench' || role === 'ridge') world.features.topography.push(item);
    else if(role === 'weather') world.features.weatherZones.push(item);
    else world.features.borders.push(item);
  }

  function addPolygonRole(role, poly, props, world){
    const item = Object.assign(featureBase(props), { rings: poly, geometryType:'Polygon', center: polygonCenter(poly) });
    if(role === 'weather') world.features.weatherZones.push(item);
    else if(role === 'climate') world.features.climateZones.push(item);
    else if(role === 'ocean') world.features.oceans.push(item);
    else if(role === 'reef') world.features.reefs.push(item);
    else if(role === 'topography') world.features.topography.push(item);
    else world.features.provinces.push(item);
  }

  function inferRole(props, file, geomType){
    const blob = [file.path, props.type, props.kind, props.category, props.class, props.mode, props.name, props.label, props.featureType, props.layer].filter(Boolean).join(' ').toLowerCase();
    if(/province center|provincial center|province_center|admin center/.test(blob)) return 'province-center';
    if(/settlement|capital|city|town|village|hamlet|pin|marker/.test(blob) && geomType.includes('point')) return 'settlement';
    if(/route|rail|train|ferry|steamship|submarine|skyship|portal|caravan|ata|transit|leg/.test(blob)) return 'route';
    if(/weather|storm|cloud|rain|snow|wind|front|pressure/.test(blob)) return 'weather';
    if(/climate|biome|desert|forest|tundra|savanna|reef/.test(blob)) return 'climate';
    if(/ocean|sea|abyss|deep water|bathymetry/.test(blob) && geomType.includes('polygon')) return 'ocean';
    if(/mountain|range|peak|ridge/.test(blob)) return 'mountain';
    if(/trench|seafloor|bathymetry/.test(blob)) return 'topography';
    if(/volcano|lava|magma/.test(blob)) return 'volcano';
    if(/cave|cavern|underworld/.test(blob)) return 'cave';
    if(/reef|coral|lagoon/.test(blob)) return 'reef';
    if(/plant|tree|forest|algae|seaweed|kelp/.test(blob)) return 'plant';
    if(/fish|whale|shark|seal|marine|sea life/.test(blob)) return 'sea-life';
    if(/npc|character|schedule/.test(blob)) return 'npc';
    if(/border|boundary|line/.test(blob) || geomType.includes('line')) return 'border';
    if(/province|region|territory|state|polygon|admin/.test(blob) || geomType.includes('polygon')) return 'province';
    return geomType.includes('point') ? 'settlement' : (geomType.includes('line') ? 'border' : 'province');
  }

  function featureBase(props, lon, lat){
    const id = String(props.id || props.slug || props.name || props.label || props.title || cryptoId()).replace(/\s+/g,'_');
    const item = {
      id,
      name: props.name || props.label || props.title || props.id || id,
      type: props.type || props.kind || props.category || props.featureType || 'feature',
      province: props.province || props.region || props.territory || props.parent || null,
      properties: cleanProps(props),
      _source: props._source || 'unknown',
      _modified: props._modified || 0,
      specificity: specificityScore(props)
    };
    if(Number.isFinite(lon)) item.lon = lon;
    if(Number.isFinite(lat)) item.lat = lat;
    return item;
  }

  function cleanProps(props){
    const out = {};
    for(const [k,v] of Object.entries(props||{})){
      if(k.startsWith('_')) continue;
      if(typeof v !== 'function') out[k] = v;
    }
    return out;
  }

  function inferFeatureFamilies(world, decisions){
    for(const s of world.features.settlements){
      const t = String(s.type || s.properties?.type || '').toLowerCase();
      if(/capital/.test(t) || /capital/.test(String(s.name).toLowerCase())) s.settlementClass = 'capital';
      else if(/city/.test(t)) s.settlementClass = 'city';
      else if(/town/.test(t)) s.settlementClass = 'town';
      else if(/village/.test(t)) s.settlementClass = 'village';
      else s.settlementClass = 'settlement';
    }
    for(const r of world.features.routes){
      const blob = JSON.stringify(r.properties || {}).toLowerCase() + ' ' + String(r.name || '').toLowerCase() + ' ' + String(r.type || '').toLowerCase();
      r.mode = /submarine/.test(blob) ? 'submarine' : /steamship/.test(blob) ? 'steamship' : /skyship/.test(blob) ? 'skyship' : /portal/.test(blob) ? 'portal' : /ferry/.test(blob) ? 'ferry' : /caravan/.test(blob) ? 'caravan' : /rail|train/.test(blob) ? 'rail' : 'route';
    }
    decisions.push('Normalized feature families: settlements, province centers, route modes, borders, terrain, weather, shell, and atmosphere.');
  }

  function normalizeFeatures(world, decisions, conflicts, options){
    const allPointCollections = ['settlements','provinceCenters','mountains','volcanoes','caves','reefs','plants','seaLife','npcs'];
    for(const key of allPointCollections){
      world.features[key] = world.features[key].filter(f => Number.isFinite(f.lat) && Number.isFinite(f.lon) && f.lat >= -90 && f.lat <= 90 && f.lon >= -540 && f.lon <= 540).map(f => (f.lon = wrapLon(f.lon), f));
    }
    for(const key of ['borders','routes','topography']){
      world.features[key] = world.features[key].filter(f => f.points && f.points.length > 1).map(f => (f.points = f.points.map(([lon,lat]) => [wrapLon(lon), clamp(lat,-90,90)]), f));
    }
    for(const key of ['provinces','weatherZones','climateZones','oceans']){
      world.features[key] = world.features[key].filter(f => f.rings && f.rings.length).map(f => {
        f.rings = f.rings.map(r => r.map(([lon,lat]) => [wrapLon(lon), clamp(lat,-90,90)]));
        f.center = f.center || polygonCenter(f.rings);
        return f;
      });
    }
    decisions.push('Clamped and wrapped coordinates into lat/lon degree space.');
  }

  function generateDerivedLayers(world, decisions){
    world.layers.timeZones = [];
    for(let lon=-180; lon<180; lon += 15){
      const offset = Math.round(lon / 15);
      world.layers.timeZones.push({ id:`UTC${offset>=0?'+':''}${offset}`, lonMin:lon, lonMax:lon+15, utcOffset:offset });
    }
    if(world.features.provinceCenters.length === 0 && world.features.provinces.length){
      for(const p of world.features.provinces){
        if(p.center){
          world.features.provinceCenters.push({ id:p.id + '_center', name:p.name + ' center', type:'province-center', province:p.name, lon:p.center.lon, lat:p.center.lat, _source:p._source, specificity:p.specificity });
        }
      }
      decisions.push('Generated province center points from polygon centroids where explicit center pins were missing.');
    }
    for(const p of world.features.provinces){
      if(!p.color) p.color = colorFromString(p.name);
    }
    for(const s of world.features.settlements){
      s.color = settlementColor(s.settlementClass);
    }
  }

  function resolveConflicts(world, decisions, conflicts, options){
    const rule = options.conflictRule || 'specific-newer';
    for(const key of Object.keys(world.features)){
      if(!Array.isArray(world.features[key])) continue;
      const seen = new Map();
      const keep = [];
      for(const f of world.features[key]){
        const keyName = String((f.province || '') + '|' + (f.name || f.id)).toLowerCase();
        if(rule === 'keep-all' || !seen.has(keyName)){ seen.set(keyName, f); keep.push(f); continue; }
        const prev = seen.get(keyName);
        const winner = chooseWinner(prev, f, rule);
        const loser = winner === prev ? f : prev;
        conflicts.push({ collection:key, name:f.name || f.id, kept:winner._source, replaced:loser._source, rule });
        if(winner !== prev){
          const idx = keep.indexOf(prev);
          if(idx >= 0) keep[idx] = winner;
          seen.set(keyName, winner);
        }
      }
      world.features[key] = keep;
    }
    if(conflicts.length) decisions.push(`Resolved ${conflicts.length} duplicate/conflicting feature record(s).`);
  }

  function chooseWinner(a,b,rule){
    if(rule === 'newer') return (Number(b._modified||0) >= Number(a._modified||0)) ? b : a;
    if(rule === 'specific') return (Number(b.specificity||0) >= Number(a.specificity||0)) ? b : a;
    const as = Number(a.specificity||0) + Number(a._modified||0)/1e15;
    const bs = Number(b.specificity||0) + Number(b._modified||0)/1e15;
    return bs >= as ? b : a;
  }

  function buildIndexes(world){
    world.indexes.provinces = Object.fromEntries(world.features.provinces.map((p,i)=>[p.name,i]));
    world.indexes.settlementsByProvince = {};
    for(const s of world.features.settlements){
      const p = s.province || 'Unassigned';
      (world.indexes.settlementsByProvince[p] ||= []).push(s.id);
    }
  }

  function computeStats(world){
    const stats = { files:world.sources.length };
    for(const [k,v] of Object.entries(world.features)) if(Array.isArray(v)) stats[k] = v.length;
    stats.surfaceMaps = world.assets.surfaceMaps.length;
    stats.heightMaps = world.assets.heightMaps.length;
    stats.depthMaps = world.assets.depthMaps.length;
    stats.textures = world.assets.textures.length;
    stats.models = world.assets.models.length;
    stats.canonDocs = world.canon.documents.length;
    return stats;
  }

  function createDemoWorld(world, decisions){
    world.metadata.name = world.metadata.name || 'Demo Generated World';
    world.features.provinces = [
      poly('Northreach', [[[-80,15],[-25,20],[-15,55],[-70,65],[-95,45],[-80,15]]], '#5fd0a6'),
      poly('Embercoast', [[[15,-45],[85,-35],[112,-5],[70,16],[18,6],[15,-45]]], '#d88a4a'),
      poly('Deepmere', [[[-150,-18],[-112,-42],[-75,-34],[-82,-2],[-120,8],[-150,-18]]], '#5a78d6')
    ];
    world.features.settlements = [
      pt('Auric Gate','capital',-52,42,'Northreach'), pt('Pineharbor','city',-66,23,'Northreach'), pt('Glassreef','city',72,-9,'Embercoast'), pt('Basalt Hold','town',48,-28,'Embercoast'), pt('Abyssal Rest','village',-112,-24,'Deepmere')
    ].map(s => (s.color = settlementColor(s.settlementClass=s.type), s));
    world.features.routes = [
      { id:'r1', name:'Skyship Ring', mode:'skyship', points:[[-52,42],[-66,23],[72,-9],[48,-28],[-112,-24],[-52,42]], properties:{}, _source:'demo' },
      { id:'r2', name:'Deep Submarine Line', mode:'submarine', points:[[-112,-24],[-90,-28],[-25,-36],[48,-28],[72,-9]], properties:{}, _source:'demo' }
    ];
    world.features.volcanoes = [pt('Cinder Crown','volcano',50,-18,'Embercoast')];
    world.features.reefs = [pt('Opal Reef','reef',78,-12,'Embercoast')];
    world.features.caves = [pt('Blue Underdeep','cave',-116,-23,'Deepmere')];
    world.features.weatherZones = [Object.assign(pt('Equatorial Storm Belt','weather',5,0,null), {radiusKm:1600})];
    world.features.celestial = [{ id:'sun', name:'Sun', type:'sun', lon:0, lat:0 }, { id:'moon', name:'Moon', type:'moon', lon:45, lat:12 }];
    generateDerivedLayers(world, decisions);
    world.stats = computeStats(world);
    decisions.push('No coordinate-bearing world data was found, so a built-in demo globe was loaded for testing the creator and viewer.');
  }

  function pt(name,type,lon,lat,province){ return { id:name.toLowerCase().replace(/\W+/g,'_'), name, type, settlementClass:type, lon, lat, province, properties:{}, _source:'demo', specificity:1 }; }
  function poly(name,rings,color){ return { id:name.toLowerCase(), name, type:'province', rings, center:polygonCenter(rings), color, properties:{}, _source:'demo', specificity:1 }; }

  function sourceSummary(f){ return { path:f.path, name:f.name, ext:f.ext, size:f.size, modified:f.modified, classification:f.classification, unsupported:f.unsupported || false }; }
  function assetSummary(f){ return { path:f.path, name:f.name, ext:f.ext, size:f.size, modified:f.modified, role:f.classification?.primary || 'asset', objectUrl:f.objectUrl || null, exportPath:null }; }
  function clone(x){ return JSON.parse(JSON.stringify(x)); }
  function titleCase(s){ return String(s).replace(/\b\w/g, c => c.toUpperCase()); }
  function cryptoId(){ return 'feature_' + Math.random().toString(36).slice(2,10); }
  function wrapLon(lon){ lon = Number(lon); while(lon > 180) lon -= 360; while(lon < -180) lon += 360; return lon; }
  function clamp(v,a,b){ return Math.max(a, Math.min(b, Number(v))); }
  function validPair(c){ return Array.isArray(c) && Number.isFinite(c[0]) && Number.isFinite(c[1]) && Math.abs(c[1]) <= 90 && Math.abs(c[0]) <= 10000; }
  function normalizePointCoordinates(c){ if(!Array.isArray(c)) return []; if(typeof c[0] === 'number') return [c]; return c.filter(validPair); }
  function normalizeLineCoordinates(c,type){ if(!Array.isArray(c)) return []; if(type === 'multilinestring') return c.map(line => line.filter(validPair)); return [c.filter(validPair)]; }
  function normalizePolygonCoordinates(c,type){ if(!Array.isArray(c)) return []; if(type === 'multipolygon') return c.map(poly => poly.map(r => r.filter(validPair)).filter(r => r.length)); return [c.map(r => r.filter(validPair)).filter(r => r.length)]; }
  function polygonCenter(rings){
    let sx=0, sy=0, n=0;
    for(const ring of (rings||[])) for(const p of ring){ if(validPair(p)){ sx += p[0]; sy += p[1]; n++; }}
    return n ? { lon:wrapLon(sx/n), lat:clamp(sy/n,-90,90) } : { lon:0, lat:0 };
  }
  function latlonFrom(o){
    const lat = firstNumber(o, ['lat','latitude','y','Lat','Latitude']);
    const lon = firstNumber(o, ['lon','lng','long','longitude','x','Lon','Lng','Longitude']);
    if(Number.isFinite(lat) && Number.isFinite(lon)) return { lat:Number(lat), lon:Number(lon) };
    return null;
  }
  function firstNumber(o, keys){ for(const k of keys){ if(o[k] !== undefined && o[k] !== null && o[k] !== ''){ const n=Number(o[k]); if(Number.isFinite(n)) return n; }} return null; }
  function looksLikeLine(arr){ return Array.isArray(arr) && arr.length > 1 && arr.slice(0,5).every(x => Array.isArray(x) ? x.length >= 2 : x && typeof x === 'object' && latlonFrom(x)); }
  function walk(value, path, fn){ fn(value,path); if(value && typeof value === 'object'){ if(Array.isArray(value)){ value.forEach((v,i)=>walk(v,path.concat(i),fn)); } else { Object.entries(value).forEach(([k,v])=>walk(v,path.concat(k),fn)); } } }
  function extractRelevant(text, rx, max){
    const out=[]; const lower=text; let m; const globalRx = new RegExp(rx.source, rx.flags.includes('g')?rx.flags:rx.flags+'g');
    while((m=globalRx.exec(lower)) && out.join('\n').length < max){ out.push(text.slice(Math.max(0,m.index-450), Math.min(text.length,m.index+900)).trim()); }
    return out.join('\n---\n').slice(0,max);
  }
  function specificityScore(props){ return Object.keys(props||{}).filter(k => props[k] !== null && props[k] !== undefined && props[k] !== '').length / 20; }
  function colorFromString(str){ let h=0; for(let i=0;i<String(str).length;i++) h=(h*31+String(str).charCodeAt(i))%360; return `hsl(${h} 72% 58%)`; }
  function settlementColor(cls){ return cls === 'capital' ? '#dc143c' : cls === 'city' ? '#32ff32' : cls === 'town' ? '#ffa500' : cls === 'village' ? '#000080' : '#66e3ff'; }

  global.WorldForge = global.WorldForge || {};
  global.WorldForge.WorldModel = { assemble, DEFAULT_ATMOSPHERE, DEFAULT_SHELLS };
})(window);
