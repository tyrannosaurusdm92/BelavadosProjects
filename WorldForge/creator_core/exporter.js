(function(global){
  'use strict';

  async function exportPackage(world, files, options){
    options = options || {};
    const zip = new global.WorldForge.ZipWriter();
    const root = sanitize(world.metadata.name || 'generated_world') + '_globe/';
    const copied = new Map();
    const cleanWorld = JSON.parse(JSON.stringify(world));

    remapAssets(cleanWorld.assets.surfaceMaps, files, copied, 'assets/surface');
    remapAssets(cleanWorld.assets.heightMaps, files, copied, 'assets/height');
    remapAssets(cleanWorld.assets.depthMaps, files, copied, 'assets/depth');
    remapAssets(cleanWorld.assets.textures, files, copied, 'assets/textures');
    remapAssets(cleanWorld.assets.icons, files, copied, 'assets/icons');
    remapAssets(cleanWorld.assets.models, files, copied, 'assets/models');
    for(const asset of Object.values(cleanWorld.assets).flat()) delete asset.objectUrl;

    zip.addText(root + 'index.html', viewerHTML(cleanWorld.metadata.name));
    zip.addText(root + 'viewer.css', viewerCSS());
    zip.addText(root + 'viewer.js', standaloneViewerJS(cleanWorld));
    zip.addJSON(root + 'data/world_model.json', cleanWorld);
    zip.addJSON(root + 'data/source_manifest.json', { exportedAt:new Date().toISOString(), stats:cleanWorld.stats, sources:cleanWorld.sources, assets:cleanWorld.assets, decisions:cleanWorld.decisions, conflicts:cleanWorld.conflicts });
    zip.addJSON(root + 'data/backend_config.json', cleanWorld.backend || {});
    zip.addText(root + 'docs/README.md', readme(cleanWorld));
    zip.addText(root + 'docs/BUILD_LOG.md', buildLog(cleanWorld));
    zip.addText(root + 'docs/CONFLICT_RESOLUTION.md', conflictDoc(cleanWorld));
    zip.addText(root + 'docs/SCHEMA_NOTES.md', schemaNotes());

    for(const [exportPath, file] of copied){
      if(file.arrayBuffer) zip.addBytes(root + exportPath, file.arrayBuffer);
      else if(file.text) zip.addText(root + exportPath, file.text);
    }

    if(options.includeOriginals){
      for(const file of files){
        if(file.arrayBuffer) zip.addBytes(root + 'original_uploads/' + safePath(file.path), file.arrayBuffer);
      }
    }

    const blob = await zip.blob();
    return { blob, filename: sanitize(world.metadata.name || 'worldforge_globe') + '_package.zip' };
  }

  function remapAssets(list, files, copied, folder){
    for(const asset of list || []){
      const file = files.find(f => f.path === asset.path);
      const ext = asset.ext || (asset.name||'asset').split('.').pop() || 'bin';
      const name = uniquePath(copied, folder + '/' + sanitize(asset.name || 'asset') + (String(asset.name||'').includes('.') ? '' : '.' + ext));
      asset.exportPath = name;
      if(file) copied.set(name, file);
    }
  }

  function uniquePath(map, path){
    let p = path, i=2;
    while(map.has(p)){ const dot=path.lastIndexOf('.'); p = dot>0 ? path.slice(0,dot) + '_' + i++ + path.slice(dot) : path + '_' + i++; }
    return p;
  }

  function viewerHTML(name){ return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(name)} Globe</title><link rel="stylesheet" href="viewer.css"></head>
<body><header><h1>${escapeHtml(name)} Globe</h1><div class="controls"><select id="provinceSelect"><option value="">Select a province</option></select><select id="settlementSelect"><option value="">Select a settlement</option></select><button id="recenterBtn">Recenter</button><button id="crossSectionBtn">Shell Cross Section</button><button id="pauseBtn">Pause Time</button></div></header><main><canvas id="globeCanvas"></canvas><canvas id="overlayCanvas"></canvas><aside id="inspectCard" class="inspect-card hidden"></aside><div id="layerToggles" class="layer-toggles"></div></main><script src="viewer.js"></script></body></html>`; }

  function viewerCSS(){ return `html,body{margin:0;height:100%;background:#030711;color:#e7f2ff;font-family:ui-sans-serif,system-ui,Segoe UI,Arial}header{position:fixed;z-index:5;top:0;left:0;right:0;display:flex;gap:16px;align-items:center;justify-content:space-between;padding:10px 14px;background:rgba(3,7,17,.88);border-bottom:1px solid rgba(130,200,255,.22);backdrop-filter:blur(8px)}h1{font-size:18px;margin:0}.controls{display:flex;gap:8px;flex-wrap:wrap}button,select{background:#08162a;color:#e7f2ff;border:1px solid rgba(130,200,255,.35);border-radius:10px;padding:8px 10px}main{position:fixed;inset:0;padding-top:56px}canvas{position:absolute;inset:56px 0 0 0;width:100%;height:calc(100% - 56px);display:block}.inspect-card{position:fixed;right:16px;top:74px;width:min(380px,calc(100% - 32px));max-height:calc(100% - 96px);overflow:auto;background:rgba(4,9,20,.9);border:1px solid rgba(102,227,255,.34);border-radius:14px;padding:14px;box-shadow:0 12px 36px rgba(0,0,0,.38)}.hidden{display:none}.inspect-card pre{white-space:pre-wrap;word-break:break-word;font-size:12px}.layer-toggles{position:fixed;left:14px;bottom:14px;right:14px;display:flex;flex-wrap:wrap;gap:7px;pointer-events:auto}.layer-toggles label{background:rgba(6,15,31,.86);border:1px solid rgba(130,200,255,.22);border-radius:999px;padding:6px 9px;font-size:12px}`; }

  function standaloneViewerJS(world){
    const data = JSON.stringify(world);
    return `// Standalone viewer generated by WorldForge 3D Globe Creator.\n` + globeEngineSource() + `\n(function(){\n'use strict';\nconst world = ${data};\nconst engine=new window.WorldForge.GlobeEngine({canvas:document.getElementById('globeCanvas'),overlay:document.getElementById('overlayCanvas'),inspectCard:document.getElementById('inspectCard'),provinceSelect:document.getElementById('provinceSelect'),settlementSelect:document.getElementById('settlementSelect'),layerToggles:document.getElementById('layerToggles'),log:console.log});\nengine.setWorld(world);\ndocument.getElementById('recenterBtn').onclick=()=>engine.recenter();\ndocument.getElementById('crossSectionBtn').onclick=()=>engine.toggleCrossSection();\ndocument.getElementById('pauseBtn').onclick=()=>{const p=engine.togglePause();document.getElementById('pauseBtn').textContent=p?'Resume Time':'Pause Time'};\n})();`;
  }

  function globeEngineSource(){
    const scripts = document.querySelectorAll('script[src$="viewer/globe-engine.js"],script[src$="globe-engine.js"]');
    // This fallback string is replaced during app runtime only if same-origin script text cannot be fetched.
    return window.__WORLD_FORGE_ENGINE_SOURCE__ || Array.from(scripts).map(s => `/* Engine loaded from ${s.src}. Exporter will fetch text at runtime. */`).join('\n');
  }

  async function prepareEngineSource(){
    const src = 'viewer/globe-engine.js';
    try{ window.__WORLD_FORGE_ENGINE_SOURCE__ = await fetch(src).then(r=>r.text()); }catch(_){ window.__WORLD_FORGE_ENGINE_SOURCE__ = ''; }
  }

  function readme(world){ return `# ${world.metadata.name} Globe Package\n\nOpen \`index.html\` in a modern browser. This package was generated by WorldForge 3D Globe Creator.\n\n## What was generated\n\n- Interactive WebGL globe viewer\n- Clickable provinces, settlements, borders, routes, weather zones, terrain features, oceans, reefs, plants, sea life, shell layers, atmosphere, and celestial markers when source data existed\n- Data model: \`data/world_model.json\`\n- Source manifest: \`data/source_manifest.json\`\n- Backend config: \`data/backend_config.json\`\n\n## Counts\n\n\`\`\`json\n${JSON.stringify(world.stats, null, 2)}\n\`\`\`\n\n## Notes\n\nThe renderer uses latitude/longitude degrees. New worlds can be built by opening the creator app again and uploading a different set of files.\n`; }
  function buildLog(world){ return '# Build Decisions\n\n' + (world.decisions||[]).map(x => '- ' + x).join('\n') + '\n'; }
  function conflictDoc(world){ return '# Conflict Resolution\n\nRule: `' + (world.metadata.conflictRule || 'specific-newer') + '`\n\n' + ((world.conflicts||[]).length ? '```json\n' + JSON.stringify(world.conflicts, null, 2) + '\n```\n' : 'No duplicate feature conflicts were detected.\n'); }
  function schemaNotes(){ return `# WorldForge Globe Schema Notes\n\nThe generated model is intentionally broad so future worlds can upload mixed canon files. Major sections:\n\n- \`metadata\`: name, radius, generated date, coordinate assumptions\n- \`assets\`: selected maps, height/depth maps, textures, icons, models, docs\n- \`layers\`: atmosphere, shell layers, lat/long labels, UTC time zones\n- \`features\`: provinces, settlements, borders, routes, terrain, weather, climate, oceans, biology, NPCs, celestial data\n- \`canon\`: extracted DOCX/text instructions and relevant excerpts\n\nConflict priority defaults to most-specific plus newest file.\n`; }
  function sanitize(s){ return String(s||'file').replace(/[^a-z0-9._ -]+/gi,'_').replace(/\s+/g,'_').slice(0,100); }
  function safePath(s){ return String(s||'file').replace(/^\/+/, '').replace(/\.\./g,'_'); }
  function escapeHtml(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

  global.WorldForge = global.WorldForge || {};
  global.WorldForge.Exporter = { exportPackage, prepareEngineSource };
})(window);
