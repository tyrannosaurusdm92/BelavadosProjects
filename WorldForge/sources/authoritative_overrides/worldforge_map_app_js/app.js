import { WorldRenderer } from './renderer.js';
import { WorldModel, biomeCatalog, makeCaveMesh, makeLifePoints, makeLocalTerrain, worldOptionsForPreset } from './procedural.js';
import { entryBlob, entryText, extractDocx, readZip } from './zip-reader.js';
import { seededRandom } from './math.js';
import { buildSettlementScene, profileFromSettlement, settlementEnvironment } from './settlement-engine.js';
import { WorldSimulation } from './simulation-engine.js';
import { backendClient, backendLock } from './backend-lock.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const canvas=$('#world-canvas');
let renderer;
try{renderer=new WorldRenderer(canvas);}catch(error){$('#loading h2').textContent='WebGL2 is unavailable';$('#loading p').textContent=error.message+' Enable hardware acceleration or use a WebGL2-capable browser.';throw error;}

const simulation=new WorldSimulation();
let earthData,caveData,profiles=[],activeProfile=null,model,focus={lat:0,lon:0},selectedFeature=null,geoLines=[];
let settlementCatalog={provinces:[],settlements:[]},activeSettlement=null,activeSettlementData=null,activeNpcData=null,activeSettlementScene=null;
let weatherFeatures=[],selectedLocalObject=null,toastTimer,lastWeatherUpdate=0;

function toast(message){const el=$('#toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),3600);}
function logImport(message){const el=$('#import-log');if(el.textContent==='No imported files yet.')el.textContent='';el.textContent+=(el.textContent?'\n':'')+message;el.scrollTop=el.scrollHeight;}
function fmtElevation(v){return `${Math.round(Number(v)||0).toLocaleString()} m`;}
function fmtNumber(v){return Number.isFinite(Number(v))?Number(v).toLocaleString():'—';}
function escapeHTML(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function showReadout(info){
  $('#read-lat').textContent=`${info.lat.toFixed(3)}°`;$('#read-lon').textContent=`${info.lon.toFixed(3)}°`;$('#read-elevation').textContent=fmtElevation(info.elevation);
  $('#read-biome').textContent=info.biome;$('#read-moisture').textContent=`${Math.round(info.moisture*100)}%`;$('#read-temperature').textContent=`${info.temperature.toFixed(1)} °C`;
}
function featureDescription(f){
  const extra=f.settlementRecord?`<p><strong>${escapeHTML(f.settlementRecord.type)}</strong> · population ${fmtNumber(f.settlementRecord.population)} · ${escapeHTML((f.settlementRecord.biomes||[]).join(' / '))}</p>`:'';
  return `<span class="feature-type">${escapeHTML(f.type||'landmark')}</span><h3>${escapeHTML(f.name||'Unnamed feature')}</h3><p>${escapeHTML(f.description||'Imported or procedurally mapped feature.')}</p>${extra}<p><strong>${Number(f.lat).toFixed(3)}°, ${Number(f.lon).toFixed(3)}°</strong> · ${fmtElevation(f.elevation_m??model.elevationAt(f.lat,f.lon))}</p>`;
}
function objectDescription(o){
  if(!o)return '<p>Select an object, resident, creature, weather cell, structure, or landmark.</p>';
  const details=Object.entries(o.details||{}).filter(([,v])=>v!==undefined&&v!==null&&v!=='').slice(0,8).map(([k,v])=>`<p><strong>${escapeHTML(k)}</strong>: ${escapeHTML(typeof v==='object'?JSON.stringify(v):v)}</p>`).join('');
  return `<span class="feature-type">${escapeHTML(o.type)}</span><h3>${escapeHTML(o.name)}</h3><p>${escapeHTML(o.description||'WorldForge simulation object.')}</p><p><strong>Source:</strong> ${escapeHTML(o.source||'WorldForge')}</p>${details}`;
}
function updateFeatureUI(){
  const select=$('#feature-select');select.innerHTML='';model.features.forEach((f,i)=>{const o=document.createElement('option');o.value=i;o.textContent=`${f.name} — ${f.type}`;select.append(o);});
  if(model.features.length){
    const ranked=model.features.map(f=>({...f,_e:Number(f.elevation_m??model.elevationAt(f.lat,f.lon))})).filter(f=>Number.isFinite(f._e));
    const high=ranked.reduce((a,b)=>!a||b._e>a._e?b:a,null),low=ranked.reduce((a,b)=>!a||b._e<a._e?b:a,null);
    $('#highest-mapped').textContent=high?`${high.name} · ${fmtElevation(high._e)}`:'—';$('#lowest-mapped').textContent=low?`${low.name} · ${fmtElevation(low._e)}`:'—';
    select.value=Math.max(0,model.features.indexOf(selectedFeature));selectFeature(model.features[Number(select.value)]||model.features[0],false);
  }else{$('#feature-card').innerHTML='<p>No feature points in this dataset.</p>';$('#highest-mapped').textContent='—';$('#lowest-mapped').textContent='—';}
}
function selectFeature(f,focusCamera=false){
  if(!f)return;selectedFeature=f;focus={lat:Number(f.lat)||0,lon:Number(f.lon)||0};renderer.setSelectedFeature(f);$('#feature-card').innerHTML=featureDescription(f);$('#feature-select').value=String(model.features.indexOf(f));showReadout(model.describeAt(focus.lat,focus.lon));if(focusCamera)renderer.focusFeature(f);
  if(f.settlementRecord)selectSettlementById(f.settlementRecord.id,false);
}
function updateProfileUI(){
  const s=$('#settlement-profile');s.innerHTML='';profiles.forEach((p,i)=>{const o=document.createElement('option');o.value=i;o.textContent=p.name;s.append(o);});
  if(activeProfile){const idx=profiles.indexOf(activeProfile);s.value=String(idx>=0?idx:0);}else activeProfile=profiles[0]||null;renderProfile();
}
function renderProfile(){
  const box=$('#biome-stack');box.innerHTML='';if(!activeProfile){box.innerHTML='<p class="hint">No profile loaded.</p>';return;}
  for(const [i,b] of (activeProfile.biomes||[]).entries()){
    const cat=biomeCatalog.find(x=>x.name===b.name);const rgb=cat?cat.color.map(x=>Math.round(x*255)).join(','):'101,230,196';
    const d=document.createElement('div');d.className='biome-pill';d.style.setProperty('--pill',`rgb(${rgb})`);d.textContent=`${i===0?'Primary':i===1?'Secondary':'Tertiary'} · ${b.name}`;box.append(d);
  }
}
function makePlanetFeatures(currentModel){
  const rnd=seededRandom(currentModel.seed+441),types=['mountain','ocean trench','volcano','cave','river delta','ancient forest'];
  return types.map((type,i)=>{const lat=-65+rnd()*130,lon=-180+rnd()*360;let elevation=currentModel.elevationAt(lat,lon);if(type==='mountain')elevation=Math.max(4200,elevation);if(type==='ocean trench')elevation=Math.min(-7200,elevation);if(type==='volcano')elevation=Math.max(2100,elevation);return{name:`${currentModel.name.split(' ')[0]} ${['Crown','Abyss','Caldera','Hollows','Fan','Wilds'][i]}`,type,lat,lon,elevation_m:elevation,description:`Procedurally generated ${type} marker. Import authoritative geological data to replace or refine it.`};});
}
function settlementFeatures(){
  return settlementCatalog.settlements.map(s=>({id:`settlement:${s.id}`,name:s.name,type:`settlement · ${s.type}`,lat:Number(s.lat),lon:Number(s.lon),elevation_m:Number(s.elevationM)||0,description:`${s.name}, ${s.province}. ${s.terrainRule||''}`,settlementRecord:s}));
}
async function rebuildWorld(options,features=null){
  $('#loading').classList.remove('hidden');await new Promise(r=>requestAnimationFrame(r));
  model=new WorldModel({...options,features:[]});
  const geological=(features&&features.length)?features:makePlanetFeatures(model);
  weatherFeatures=simulation.buildWorldWeather(settlementCatalog);
  model.features=[...geological,...settlementFeatures(),...weatherFeatures];
  model.setProfile(activeProfile);await renderer.setWorldModel(model);renderer.setGeoLines(geoLines);renderer.projection=$('[data-projection].active')?.dataset.projection||'globe';renderer.scene='world';renderer.resetCamera();
  $('#dataset-status').textContent=model.name;$('#scene-mode').value='world';setSceneButtons('world');updateFeatureUI();
  $('#loading').classList.add('hidden');$('#underwater-tint').classList.remove('active');toast(`${model.name} is ready with ${settlementCatalog.settlementCount||0} canonical settlements.`);
}
function setSceneButtons(scene){$$('.scene-chip[data-scene]').forEach(b=>b.classList.toggle('active',b.dataset.scene===scene));$('#scene-status').textContent=scene==='world'?(renderer.projection==='globe'?'Globe':'Flat 3D'):scene==='settlement'?'Settlement 3D':scene[0].toUpperCase()+scene.slice(1);}
async function switchScene(scene){
  $('#scene-mode').value=scene;setSceneButtons(scene);
  if(scene==='world'){renderer.setScene('world');$('#underwater-tint').classList.remove('active');return;}
  if(scene==='settlement'){await buildSelectedSettlement();return;}
  if(scene==='cave'){const mesh=makeCaveMesh(caveData);renderer.setCaveScene(mesh);$('#underwater-tint').classList.remove('active');clearLocalObjects();return;}
  const terrain=makeLocalTerrain(model,focus,scene,activeProfile,128),life=makeLifePoints(model,focus,scene,activeProfile,scene==='underwater'?950:650);terrain.hasWater=activeProfile?.biomes?.some(b=>/water|ocean|reef|marsh|swamp|beach/i.test(b.name))||terrain.centerElevation<80;
  renderer.setLocalScene(terrain,life,scene,{environment:scene});$('#underwater-tint').classList.toggle('active',scene==='underwater');clearLocalObjects();
  if(selectedFeature?.type?.toLowerCase().includes('volcano'))renderer.spawnEruption();
}
function enterSelected(){
  if(selectedFeature?.settlementRecord){selectSettlementById(selectedFeature.settlementRecord.id,false);buildSelectedSettlement();return;}
  const t=(selectedFeature?.type||'').toLowerCase();if(t.includes('cave')||t.includes('cavern'))switchScene('cave');else if(t.includes('trench')||t.includes('ocean')||(selectedFeature?.elevation_m??0)<0)switchScene('underwater');else switchScene('local');
}
function populateSettlementSelectors(){
  const ps=$('#province-select');ps.innerHTML='<option value="">Select a province</option>';
  for(const p of settlementCatalog.provinces){const o=document.createElement('option');o.value=p.name;o.textContent=`${p.name} (${p.settlementCount})`;ps.append(o);}
  ps.addEventListener('change',()=>populateSettlementOptions(ps.value));
  populateSettlementOptions('');
}
function populateSettlementOptions(province){
  const ss=$('#settlement-select');ss.innerHTML='<option value="">Select a settlement</option>';
  settlementCatalog.settlements.filter(s=>!province||s.province===province).sort((a,b)=>a.name.localeCompare(b.name)).forEach(s=>{const o=document.createElement('option');o.value=s.id;o.textContent=`${s.name} · ${s.type}`;ss.append(o);});
}
async function selectSettlementById(id,focusWorld=true){
  const record=settlementCatalog.settlements.find(s=>s.id===id);if(!record)return;
  activeSettlement=record;$('#province-select').value=record.province;populateSettlementOptions(record.province);$('#settlement-select').value=record.id;
  activeProfile=profileFromSettlement(record);if(!profiles.some(p=>p.settlementId===activeProfile.settlementId))profiles.push(activeProfile);updateProfileUI();
  focus={lat:Number(record.lat),lon:Number(record.lon)};showReadout(model.describeAt(focus.lat,focus.lon));
  $('#settlement-summary').innerHTML=`<h3>${escapeHTML(record.name)}</h3><p>${escapeHTML(record.type)} · ${escapeHTML(record.province)} · population ${fmtNumber(record.population)}</p><p>${escapeHTML((record.biomes||[]).join(' / '))}</p><p>${escapeHTML(record.terrainRule||'Canonical terrain rule loaded.')}</p><p><strong>${escapeHTML(record.weatherName||'Weather')}</strong> · ${escapeHTML(record.climateBelt||'')}</p>`;
  if(focusWorld&&renderer.scene==='world'){
    const feature=model.features.find(f=>f.settlementRecord?.id===record.id);if(feature)selectFeature(feature,true);
  }
  try{[activeSettlementData,activeNpcData]=await Promise.all([fetch(record.dataPath).then(r=>r.json()),record.npcPath?fetch(record.npcPath).then(r=>r.json()):Promise.resolve(null)]);$('#npc-count').textContent=`${activeNpcData?.npcCount||0} tracked NPCs`;}
  catch(e){activeSettlementData=null;activeNpcData=null;toast(`Settlement detail load warning: ${e.message}`);}
  updateWeatherPanel();
}
async function buildSelectedSettlement(){
  if(!activeSettlement){const first=settlementCatalog.settlements[0];if(first)await selectSettlementById(first.id,false);}
  if(!activeSettlement)return;
  if(!activeNpcData&&activeSettlement.npcPath){try{activeNpcData=await fetch(activeSettlement.npcPath).then(r=>r.json());}catch{}}
  const snapshot=simulation.snapshot(activeSettlement,$('#forecast-horizon').value);
  activeSettlementScene=buildSettlementScene(activeSettlement,activeNpcData,model,snapshot);activeProfile=activeSettlementScene.profile;model.setProfile(activeProfile);updateProfileUI();
  renderer.setLocalScene(activeSettlementScene.terrain,activeSettlementScene.life,'settlement',{environment:activeSettlementScene.environment,structures:activeSettlementScene.structures,objects:activeSettlementScene.objects,waterLevel:activeSettlementScene.waterLevel});
  renderer.timeSpeed=Math.min(128,Math.sqrt(simulation.speed||0));
  $('#underwater-tint').classList.toggle('active',activeSettlementScene.environment==='underwater');$('#scene-mode').value='settlement';setSceneButtons('settlement');populateLocalObjects(activeSettlementScene.objects);
  $('#dataset-status').textContent=`${activeSettlement.name}, ${activeSettlement.province}`;
  const volcano=activeSettlementScene.objects.find(o=>/volcano/i.test(o.type));if(volcano){renderer.setFlags({eruption:true});$('#toggle-eruption').checked=true;renderer.spawnEruption();}
  toast(`${activeSettlement.name} generated from globe coordinates, canonical biomes, height/depth, weather, and NPC data.`);
}
function populateLocalObjects(objects){
  const select=$('#object-select');select.innerHTML='<option value="">Select an object</option>';objects.forEach((o,i)=>{const opt=document.createElement('option');opt.value=i;opt.textContent=`${o.name} — ${o.type}`;select.append(opt);});
  selectedLocalObject=objects[0]||null;$('#object-card').innerHTML=objectDescription(selectedLocalObject);if(objects.length)select.value='0';
}
function clearLocalObjects(){selectedLocalObject=null;$('#object-select').innerHTML='<option value="">No settlement objects in this scene</option>';$('#object-card').innerHTML=objectDescription(null);}
function selectLocalObject(o,focusCamera=false){if(!o)return;selectedLocalObject=o;$('#object-card').innerHTML=objectDescription(o);const idx=renderer.localObjects.indexOf(o);if(idx>=0)$('#object-select').value=String(idx);if(focusCamera)renderer.focusLocalObject(o);}
function updateWeatherPanel(){
  if(!activeSettlement)return;const snap=simulation.snapshot(activeSettlement,$('#forecast-horizon').value);$('#weather-card').innerHTML=`<h3>${escapeHTML(snap.name)}</h3><p>${escapeHTML(snap.summary)}</p><div class="metric-row"><span>Intensity</span><strong>${Math.round(snap.intensity*100)}%</strong></div><div class="metric-row"><span>Duration model</span><strong>${snap.durationDays} day(s)</strong></div>`;
}
function updateClock(){
  const now=performance.now(),dt=simulation.tick(now);$('#simulation-time').textContent=simulation.label();
  if(now-lastWeatherUpdate>900){lastWeatherUpdate=now;if(simulation.updateWeatherFeatures(weatherFeatures,dt*60)){renderer.updateFeaturePoints();}updateWeatherPanel();}
  requestAnimationFrame(updateClock);
}
function bindUI(){
  renderer.setFPSCallback(f=>$('#fps-status').textContent=`${Math.round(f)} FPS`);
  renderer.onClick(e=>{
    if(renderer.scene==='world'){
      const near=renderer.nearestFeature(e.clientX,e.clientY);if(near){selectFeature(near,false);return;}const hit=renderer.pickWorld(e.clientX,e.clientY);if(!hit)return;focus={lat:hit.lat,lon:hit.lon};showReadout(model.describeAt(hit.lat,hit.lon));
    }else{const near=renderer.nearestLocalObject(e.clientX,e.clientY);if(near)selectLocalObject(near,false);}
  });
  renderer.onDoubleClick(e=>{
    if(renderer.scene==='world'){const hit=renderer.pickWorld(e.clientX,e.clientY);if(hit){focus={lat:hit.lat,lon:hit.lon};const info=model.describeAt(hit.lat,hit.lon);showReadout(info);switchScene(info.elevation<0?'underwater':'local');}}
    else{const near=renderer.nearestLocalObject(e.clientX,e.clientY);if(near)selectLocalObject(near,true);}
  });
  $$('#projection-buttons button').forEach(b=>b.addEventListener('click',()=>{$$('#projection-buttons button').forEach(x=>x.classList.remove('active'));b.classList.add('active');renderer.setScene('world');$('#scene-mode').value='world';$('#underwater-tint').classList.remove('active');renderer.setProjection(b.dataset.projection);setSceneButtons('world');renderer.updateFeaturePoints();}));
  $('#scene-mode').addEventListener('change',e=>switchScene(e.target.value));$$('.scene-chip[data-scene]').forEach(b=>b.addEventListener('click',()=>switchScene(b.dataset.scene)));
  $('#reset-camera').addEventListener('click',()=>renderer.resetCamera());
  $('#exaggeration').addEventListener('input',e=>{renderer.exaggeration=Number(e.target.value);$('#exaggeration-value').textContent=`${Number(e.target.value).toFixed(1)}×`;renderer.updateFeaturePoints();});
  $('#time-speed').addEventListener('change',e=>{simulation.setSpeed(Number(e.target.value));renderer.timeSpeed=Math.min(128,Math.sqrt(simulation.speed||0));$('#time-value').textContent=e.target.options[e.target.selectedIndex].text;});
  const flagMap={'toggle-water':'water','toggle-atmosphere':'atmosphere','toggle-features':'features','toggle-life':'life','toggle-rotation':'rotation','toggle-eruption':'eruption'};for(const [id,key] of Object.entries(flagMap))$('#'+id).addEventListener('change',e=>renderer.setFlags({[key]:e.target.checked}));
  $('#feature-select').addEventListener('change',e=>selectFeature(model.features[Number(e.target.value)],false));$('#focus-feature').addEventListener('click',()=>selectFeature(selectedFeature,true));$('#enter-feature').addEventListener('click',enterSelected);
  $('#settlement-profile').addEventListener('change',e=>{activeProfile=profiles[Number(e.target.value)];model.setProfile(activeProfile);renderProfile();});$('#apply-profile').addEventListener('click',()=>{if(renderer.scene==='settlement')buildSelectedSettlement();else switchScene('local');toast(`${activeProfile?.name||'Profile'} applied.`);});
  $('#settlement-select').addEventListener('change',e=>selectSettlementById(e.target.value,true));$('#build-settlement').addEventListener('click',buildSelectedSettlement);
  $('#object-select').addEventListener('change',e=>selectLocalObject(renderer.localObjects[Number(e.target.value)],false));$('#focus-object').addEventListener('click',()=>selectLocalObject(selectedLocalObject,true));
  $('#forecast-horizon').addEventListener('change',()=>{updateWeatherPanel();if(renderer.scene==='settlement')buildSelectedSettlement();});
  $('#generate-world').addEventListener('click',()=>{const preset=$('#world-preset').value,seed=Number($('#planet-seed').value),water=Number($('#water-level').value);rebuildWorld(worldOptionsForPreset(preset,seed,water));});
  $('#world-preset').addEventListener('change',e=>{const levels={earth:67,verdant:58,oceanic:88,volcanic:42,custom:67};$('#water-level').value=levels[e.target.value]??67;});
  $('#toggle-ui').addEventListener('click',()=>document.body.classList.toggle('ui-hidden'));
  $('#browse-files').addEventListener('click',()=>$('#file-input').click());$('#file-input').addEventListener('change',e=>handleFiles([...e.target.files]));
  const dz=$('#drop-zone');['dragenter','dragover'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.add('drag');}));['dragleave','drop'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.remove('drag');}));dz.addEventListener('drop',e=>handleFiles([...e.dataTransfer.files]));dz.addEventListener('click',()=>$('#file-input').click());
  $('#export-world').addEventListener('click',exportWorld);
  $('#backend-ping').addEventListener('click',async()=>{try{$('#backend-status').textContent='Checking…';const r=await backendClient.ping();$('#backend-status').textContent=r.ok===false?'Backend warning':'Backend reachable';toast('Backend check complete.');}catch(e){$('#backend-status').textContent='Connection blocked/offline';toast(`Backend check failed: ${e.message}`);}});
  $('#sync-world').addEventListener('click',async()=>{try{toast('Syncing world package…');const r=await backendClient.saveWorld(exportPayload());toast(r.ok===false?'Backend returned a warning.':'World package synced.');}catch(e){toast(`World sync failed: ${e.message}`);}});
  $('#sync-life').addEventListener('click',async()=>{if(!activeSettlement)return toast('Choose a settlement first.');try{toast('Syncing LifeSimulator state…');const p=simulation.lifePayload(activeSettlement,activeNpcData,selectedLocalObject);const r=await backendClient.syncLifeSimulator(p);toast(r.ok===false?'Backend returned a warning.':'LifeSimulator state synced.');}catch(e){toast(`LifeSimulator sync failed: ${e.message}`);}});
}
function exportPayload(){return {...model.serialize(),features:model.features.filter(f=>!f.type?.includes('weather system')),weather_systems:weatherFeatures,geojson_lines:geoLines,settlement_profile:activeProfile,active_settlement:activeSettlement,simulation_time_utc:simulation.date().toISOString(),backend_lock:{lockId:backendLock.lockId,endpoint:backendLock.endpoint}};}
function exportWorld(){const blob=new Blob([JSON.stringify(exportPayload(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${model.name.replace(/[^a-z0-9]+/gi,'_').toLowerCase()}_worldforge.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
async function imageToHeightmap(blob,name){
  const bitmap=await createImageBitmap(blob),max=768,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height)),w=Math.max(2,Math.round(bitmap.width*scale)),h=Math.max(2,Math.round(bitmap.height*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,w,h);const px=ctx.getImageData(0,0,w,h).data,values=new Float32Array(w*h);for(let i=0;i<values.length;i++)values[i]=(px[i*4]*.2126+px[i*4+1]*.7152+px[i*4+2]*.0722)/255;
  model.setHeightmap({width:w,height:h,values,minElevationM:model.minElevationM,maxElevationM:model.maxElevationM});await renderer.setWorldModel(model);renderer.setGeoLines(geoLines);logImport(`✓ Heightmap ${name}: ${w}×${h}.`);toast('Heightmap applied.');
}
function flattenCoordinates(geometry,lines,points,properties={}){
  if(!geometry)return;
  const type=geometry.type,c=geometry.coordinates;
  if(type==='Point'){
    points.push({...properties,lon:c[0],lat:c[1],elevation_m:Number(c[2]??properties.elevation_m??properties.elevation??0)});
  }else if(type==='MultiPoint'){
    c.forEach(p=>points.push({...properties,lon:p[0],lat:p[1],elevation_m:Number(p[2]??properties.elevation_m??0)}));
  }else if(type==='LineString'){
    lines.push(c.map(p=>[p[0],p[1]]));
  }else if(type==='MultiLineString'){
    c.forEach(l=>lines.push(l.map(p=>[p[0],p[1]])));
  }else if(type==='Polygon'){
    c.forEach(r=>lines.push(r.map(p=>[p[0],p[1]])));
  }else if(type==='MultiPolygon'){
    c.forEach(poly=>poly.forEach(r=>lines.push(r.map(p=>[p[0],p[1]]))));
  }else if(type==='GeometryCollection'){
    (geometry.geometries||[]).forEach(g=>flattenCoordinates(g,lines,points,properties));
  }
}
async function applyGeoJSON(data,name){const lines=[],points=[];const list=data.type==='FeatureCollection'?data.features:data.type==='Feature'?[data]:[{geometry:data,properties:{}}];for(const item of list){const p=item.properties||{};flattenCoordinates(item.geometry,lines,points,{name:p.name||p.title||`Imported ${p.type||'feature'}`,type:p.type||p.feature_type||'imported landmark',description:p.description||`Imported from ${name}.`,...p});}geoLines.push(...lines);model.features.push(...points.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)));renderer.setFeatures(model.features);renderer.setGeoLines(geoLines);updateFeatureUI();logImport(`✓ GeoJSON ${name}: ${points.length} points, ${lines.length} paths.`);}
async function applyJSON(data,name,path=''){
  if(data.type==='FeatureCollection'||data.type==='Feature'||data.coordinates){await applyGeoJSON(data,name);return;}
  if(data.schema==='belavados.settlement.v1'&&data.settlement){const s=data.settlement;const record={id:s.id,name:s.name,province:s.province,type:s.settlementType||s.type,lat:s.lat,lon:s.lon,population:s.population,biomes:s.biomes||[],primaryBiome:s.primaryBiome,transportation:s.transportation||[],elevationM:data.topographyWeatherCanon?.heightAndDepthBySeaLevel?.displayZMeters||0,terrainRule:data.topographyWeatherCanon?.localTopographicRule,weatherName:data.topographyWeatherCanon?.weather?.namedWeather,climateBelt:data.topographyWeatherCanon?.weather?.climateBelt,anchorMode:data.topographyWeatherCanon?.heightAndDepthBySeaLevel?.anchorMode,pinPlacement:data.topographyWeatherCanon?.pinPlacement,landformAtlas:data.topographyWeatherCanon?.provinceLandformAtlas,waterAtlas:data.topographyWeatherCanon?.provinceWaterAtlas};settlementCatalog.settlements.push(record);settlementCatalog.settlementCount=settlementCatalog.settlements.length;populateSettlementSelectors();logImport(`✓ Settlement ${record.name} imported.`);return;}
  if(data.schema?.startsWith('worlddepth.world')||data.schema?.startsWith('worldforge.world')||data.radius_km){geoLines=data.geojson_lines||[];const opts={name:data.name||name,preset:data.preset||'custom',seed:data.seed||93714,radiusKm:data.radius_km||6371,waterPercent:data.water_percent||67,seaLevelM:data.sea_level_m||0,minElevationM:data.min_elevation_m||-11000,maxElevationM:data.max_elevation_m||9000};await rebuildWorld(opts,data.features||[]);renderer.setGeoLines(geoLines);logImport(`✓ World dataset ${name} loaded.`);return;}
  if(data.height_grid||data.values&&data.width&&data.height){const h=data.height_grid||data;const values=Float32Array.from((Array.isArray(h.values[0])?h.values.flat():h.values).map(Number));model.setHeightmap({width:Number(h.width),height:Number(h.height),values,minElevationM:Number(h.min_elevation_m??h.minElevationM??model.minElevationM),maxElevationM:Number(h.max_elevation_m??h.maxElevationM??model.maxElevationM)});await renderer.setWorldModel(model);renderer.setGeoLines(geoLines);logImport(`✓ Elevation grid ${name}: ${h.width}×${h.height}.`);return;}
  if(data.stations&&Array.isArray(data.stations)){caveData=data;logImport(`✓ Cave survey ${name}: ${data.stations.length} stations.`);return;}
  if(data.biomes&&Array.isArray(data.biomes)){const p={name:data.name||path.split('/').filter(Boolean).slice(-2,-1)[0]||name,biomes:data.biomes,blending:data.blending||data.biome_blending||{}};profiles.push(p);updateProfileUI();logImport(`✓ Biome profile ${p.name}.`);return;}
  if(Array.isArray(data.features)){model.features.push(...data.features);renderer.setFeatures(model.features);updateFeatureUI();logImport(`✓ ${data.features.length} features from ${name}.`);return;}logImport(`• Read JSON ${name}; no recognized terrain schema.`);
}
async function processNamedBlob(name,blob,path=name){const lower=name.toLowerCase();if(lower.endsWith('.json')||lower.endsWith('.geojson')){try{await applyJSON(JSON.parse(await blob.text()),name,path);}catch(e){logImport(`✕ ${name}: invalid JSON (${e.message}).`);}return;}if(/\.(png|jpe?g|webp)$/i.test(lower)){if(/height|elevation|dem|bathym|depth/i.test(path))await imageToHeightmap(blob,name);else logImport(`• Image ${name} found; include height/elevation/DEM/depth in its filename to apply it as terrain.`);return;}if(lower.endsWith('.docx'))await processDocx(await blob.arrayBuffer(),name);}
function inferProfilesFromEntries(entries){const groups=new Map();for(const e of entries){const m=e.name.match(/(?:^|\/)settlement_biome_profiles\/([^/]+)\/biome_([123])_(?:primary|secondary|tertiary)\/(.*)$/i);if(!m)continue;const [,settlement,index,tail]=m;if(!groups.has(settlement))groups.set(settlement,{name:settlement,biomes:[],blending:{source:'ZIP folder structure'}});let biome=null;if(/biome_reference\.json$/i.test(tail)){try{biome=JSON.parse(entryText(e)).name||null;}catch{}}if(!biome){const first=tail.split('/')[0];if(first&&!/\.json$/i.test(first))biome=first;}if(biome)groups.get(settlement).biomes[Number(index)-1]={name:biome};}let added=0;for(const p of groups.values()){p.biomes=p.biomes.filter(Boolean);if(p.biomes.length&&!profiles.some(x=>x.name===p.name)){profiles.push(p);added++;}}if(added)updateProfileUI();return added;}
async function processZip(arrayBuffer,name){const entries=await readZip(arrayBuffer);logImport(`↳ ZIP ${name}: ${entries.length} files.`);const inferred=inferProfilesFromEntries(entries);if(inferred)logImport(`✓ Inferred ${inferred} settlement profile(s).`);for(const e of entries){const lower=e.name.toLowerCase();if(lower.includes('settlement_biome_profiles/'))continue;if(lower.endsWith('.json')||lower.endsWith('.geojson'))await processNamedBlob(e.name.split('/').pop(),entryBlob(e),e.name);else if(/\.(png|jpe?g|webp)$/i.test(lower)&&/height|elevation|dem|bathym|depth/i.test(lower))await processNamedBlob(e.name.split('/').pop(),entryBlob(e),e.name);else if(lower.endsWith('.docx'))await processDocx(e.data.buffer.slice(e.data.byteOffset,e.data.byteOffset+e.data.byteLength),e.name);}}
async function processDocx(arrayBuffer,name){const doc=await extractDocx(arrayBuffer),terms=['elevation','depth','mountain','valley','river','ocean','cave','biome','latitude','longitude'],found=terms.filter(t=>doc.text.toLowerCase().includes(t));logImport(`✓ DOCX ${name}: ${doc.text.length.toLocaleString()} characters, ${doc.media.length} media; geology terms: ${found.join(', ')||'none'}.`);const codeBlocks=[...doc.text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];for(const m of codeBlocks){try{await applyJSON(JSON.parse(m[1]),`${name} embedded JSON`);}catch{}}}
async function handleFiles(files){for(const file of files){try{const lower=file.name.toLowerCase();if(lower.endsWith('.zip'))await processZip(await file.arrayBuffer(),file.name);else if(lower.endsWith('.docx'))await processDocx(await file.arrayBuffer(),file.name);else await processNamedBlob(file.name,file,file.name);}catch(e){console.error(e);logImport(`✕ ${file.name}: ${e.message}`);}}}

async function init(){
  try{
    [earthData,caveData,profiles,settlementCatalog]=await Promise.all([
      fetch('data/earth_geology.json').then(r=>r.json()),fetch('data/caves/sample_cave.json').then(r=>r.json()),fetch('biomes/settlement_biome_profiles/index.json').then(r=>r.json()),fetch('data/settlement_catalog.json').then(r=>r.json())
    ]);
    activeProfile=profiles[0];populateSettlementSelectors();bindUI();updateProfileUI();simulation.setSpeed(Number($('#time-speed').value));
    $('#backend-lock-id').textContent=backendLock.lockId;$('#backend-endpoint').textContent=backendLock.endpoint;
    await rebuildWorld(worldOptionsForPreset('earth',93714,67),earthData.features);renderer.start();showReadout(model.describeAt(0,0));
    if(settlementCatalog.settlements.length)await selectSettlementById(settlementCatalog.settlements[0].id,false);updateClock();
  }catch(e){console.error(e);$('#loading h2').textContent='Unable to start WorldForge';$('#loading p').textContent=e.message+' — run this folder through the included local server.';}
}
init();
