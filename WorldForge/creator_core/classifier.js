(function(global){
  'use strict';

  const CATEGORY_ORDER = [
    'surface-map','height-map','depth-map','topography','province-data','settlement-data','border-data','pin-data','route-data','weather-data','climate-data','time-data','npc-data','lore-doc','atmosphere-data','shell-layer-data','celestial-data','style-data','texture','svg-style','model-3d','plant-life','sea-life','reef-data','cave-data','volcano-data','repo-source','license','documentation','unknown'
  ];

  const rules = [
    ['surface-map', /(^|\/|_)(world|globe|surface|realistic|planet|earth|map|basemap|blue-marble|world-map)(\.|_|-|\/|$)/i],
    ['height-map', /(height|elevation|dem|terrain|relief|altitude|mountain.*map|topography.*height)/i],
    ['depth-map', /(depth|bathymetry|bathymetric|ocean.*floor|seafloor|trench|abyss|deepsea|deep-see)/i],
    ['topography', /(topograph|contour|plate|continental|oceanic|crust|ridge|fault|lithosphere)/i],
    ['province-data', /(province|region|territor|state|border|admin)/i],
    ['settlement-data', /(settlement|capital|city|town|village|hamlet|pins?|locations?)/i],
    ['border-data', /(borders?|boundary|boundaries|lines?|polygons?)/i],
    ['pin-data', /(pins?|markers?|centers?|labels?)/i],
    ['route-data', /(route|transit|rail|train|caravan|ferry|steamship|submarine|skyship|portal|ata|arch|trip)/i],
    ['weather-data', /(weather|cloud|rain|storm|wind|snow|season|humidity|pressure|front|precip)/i],
    ['climate-data', /(climate|biome|temperature|koppen|desert|forest|tundra|tropical|monsoon)/i],
    ['time-data', /(time|timezone|utc|longitude|latitude|clock|calendar|season|fast.*forward|pause)/i],
    ['npc-data', /(npc|character|schedule|reaction|emoji|employee|citizen)/i],
    ['lore-doc', /(canon|lore|worldbuilding|guide|docx|instructions|knowledge|compendium)/i],
    ['atmosphere-data', /(atmosphere|troposphere|stratosphere|mesosphere|thermosphere|exosphere|ozone)/i],
    ['shell-layer-data', /(shell|mantle|core|inner.*core|outer.*core|cross.*section|underworld|depth.*layer)/i],
    ['celestial-data', /(moon|sun|solar|constellation|star|comet|planet|aurora|spirit.*light|sky)/i],
    ['style-data', /(style|css|theme|palette|color|pin.*style|border.*style)/i],
    ['texture', /(texture|normal|roughness|albedo|stone|rock|water|terrain|clouds?)/i],
    ['plant-life', /(plant|tree|forest|algae|seaweed|kelp|grass|flora)/i],
    ['sea-life', /(fish|whale|shark|seal|coral|reef|marine|aquarium|deep.*life|sea.*life)/i],
    ['reef-data', /(reef|coral|lagoon)/i],
    ['cave-data', /(cave|cavern|karst|stalact|stone-normal)/i],
    ['volcano-data', /(volcano|volcanic|lava|magma|geode|basalt|damavand)/i],
    ['repo-source', /(package\.json|readme|license|src\/|main\/|master\/|\.gitignore|vite|webpack|rollup|eslint)/i]
  ];

  function classifyFile(file){
    const path = (file.path || file.name || '').toLowerCase();
    const ext = (file.ext || '').toLowerCase();
    const tags = new Set();
    const evidence = [];

    for(const [tag, rx] of rules){
      if(rx.test(path)) { tags.add(tag); evidence.push('name:' + tag); }
    }

    if(['png','jpg','jpeg','webp','gif','bmp','tiff'].includes(ext)){
      if(!tags.has('texture') && !tags.has('surface-map') && !tags.has('height-map') && !tags.has('depth-map')) tags.add('texture');
      if(/cloud|atmos/i.test(path)) tags.add('weather-data');
      if(/pin|marker|icon/i.test(path)) tags.add('style-data');
    }
    if(ext === 'svg'){
      tags.add('svg-style');
      if(/pin|marker|settlement|province/i.test(path)) tags.add('pin-data');
      if(/border|line/i.test(path)) tags.add('border-data');
    }
    if(['glb','gltf','obj','fbx','dae','stl','mtl'].includes(ext)) tags.add('model-3d');
    if(ext === 'docx') tags.add('lore-doc');
    if(ext === 'geojson') tags.add('border-data');
    if(path.endsWith('license') || path.includes('/license')) tags.add('license');
    if(path.endsWith('readme.md') || path.endsWith('readme.txt') || path.includes('/docs/')) tags.add('documentation');

    if(file.json){ inspectJson(file.json, tags, evidence, path); }
    if(file.geojson){ inspectGeoJson(file.geojson, tags, evidence, path); }
    if(file.text && file.text.length){ inspectText(file.text, tags, evidence); }
    if(file.docxText){ inspectText(file.docxText, tags, evidence); tags.add('lore-doc'); }

    if(tags.size === 0) tags.add('unknown');
    const primary = choosePrimary(Array.from(tags));
    return { primary, tags: Array.from(tags).sort((a,b)=>CATEGORY_ORDER.indexOf(a)-CATEGORY_ORDER.indexOf(b)), evidence, confidence: score(tags, file) };
  }

  function inspectGeoJson(gj, tags, evidence, path){
    tags.add('border-data');
    const features = gj.type === 'FeatureCollection' ? gj.features || [] : (gj.type === 'Feature' ? [gj] : []);
    let point=0,line=0,poly=0;
    for(const f of features.slice(0,200)){
      const g = f.geometry || {};
      const t = String(g.type || '').toLowerCase();
      if(t.includes('point')) point++;
      if(t.includes('line')) line++;
      if(t.includes('polygon')) poly++;
      const props = JSON.stringify(f.properties || {}).toLowerCase();
      if(/settlement|capital|city|town|village|province center|provincial center/.test(props)) tags.add('settlement-data');
      if(/province|territory|region|border|boundary/.test(props)) tags.add('province-data');
      if(/route|rail|train|ferry|steamship|submarine|skyship|portal/.test(props)) tags.add('route-data');
      if(/weather|storm|climate|biome/.test(props)) { tags.add('weather-data'); tags.add('climate-data'); }
      if(/mountain|volcano|cave|reef|trench|ridge|depth|height/.test(props)) tags.add('topography');
    }
    if(point){ tags.add('pin-data'); tags.add('settlement-data'); evidence.push('geojson:points=' + point); }
    if(line){ tags.add(path.includes('route') ? 'route-data' : 'border-data'); evidence.push('geojson:lines=' + line); }
    if(poly){ tags.add('province-data'); evidence.push('geojson:polygons=' + poly); }
  }

  function inspectJson(obj, tags, evidence, path){
    const text = JSON.stringify(obj).slice(0, 50000).toLowerCase();
    if(/"features"\s*:/.test(text) && /"geometry"\s*:/.test(text)) inspectGeoJson(obj, tags, evidence, path);
    if(/settlement|capital|city|town|village|hamlet/.test(text)) tags.add('settlement-data');
    if(/province|territory|region|border/.test(text)) tags.add('province-data');
    if(/route|rail|train|ferry|steamship|submarine|skyship|portal|ata/.test(text)) tags.add('route-data');
    if(/weather|storm|cloud|rain|snow|season|temperature|pressure/.test(text)) tags.add('weather-data');
    if(/climate|biome|desert|forest|tundra|savanna|reef/.test(text)) tags.add('climate-data');
    if(/latitude|longitude|timezone|utc|calendar|clock/.test(text)) tags.add('time-data');
    if(/npc|schedule|reaction|emoji|behavior/.test(text)) tags.add('npc-data');
    if(/atmosphere|troposphere|stratosphere|mesosphere|thermosphere|exosphere/.test(text)) tags.add('atmosphere-data');
    if(/shell|mantle|core|crust|continental|oceanic/.test(text)) tags.add('shell-layer-data');
    if(/moon|sun|star|constellation|comet|planet|aurora|celestial/.test(text)) tags.add('celestial-data');
    if(/volcano|lava|magma/.test(text)) tags.add('volcano-data');
    if(/cave|cavern|underworld/.test(text)) tags.add('cave-data');
    if(/reef|coral|kelp|seaweed|fish|whale|shark/.test(text)) tags.add('sea-life');
    evidence.push('json-inspection');
  }

  function inspectText(text, tags, evidence){
    const s = text.slice(0, 200000).toLowerCase();
    const pairs = [
      ['weather-data', /weather|rain|storm|cloud|snow|wind|season/],
      ['climate-data', /climate|biome|desert|forest|tundra|reef/],
      ['topography', /topography|mountain|height|depth|terrain|plate|oceanic|continental/],
      ['atmosphere-data', /troposphere|stratosphere|mesosphere|thermosphere|exosphere|atmosphere/],
      ['shell-layer-data', /mantle|outer core|inner core|crust|shell layer|underworld/],
      ['celestial-data', /moon|sun|constellation|solar system|comet|planet|star|aurora/],
      ['time-data', /utc|timezone|longitude|latitude|calendar|clock|fast forward|pause/],
      ['route-data', /route|rail|train|ferry|steamship|submarine|skyship|portal/],
      ['npc-data', /npc|schedule|reaction|emoji/],
      ['lore-doc', /canon|world|province|settlement/]
    ];
    for(const [tag, rx] of pairs) if(rx.test(s)) tags.add(tag);
    evidence.push('text-inspection');
  }

  function choosePrimary(tags){
    const ordered = CATEGORY_ORDER.filter(c => tags.includes(c) && c !== 'unknown');
    return ordered[0] || 'unknown';
  }

  function score(tags, file){
    let s = Math.min(0.96, 0.25 + tags.size * 0.08);
    if(file.json || file.geojson) s += 0.15;
    if(file.docxText) s += 0.1;
    if(file.image) s += 0.08;
    return Math.max(0.05, Math.min(1, s));
  }

  function summarize(files){
    const counts = {};
    for(const f of files){
      const c = f.classification?.primary || 'unknown';
      counts[c] = (counts[c]||0)+1;
    }
    return counts;
  }

  global.WorldForge = global.WorldForge || {};
  global.WorldForge.Classifier = { classifyFile, summarize, CATEGORY_ORDER };
})(window);
