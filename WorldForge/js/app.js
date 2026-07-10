import { WorldRenderer } from './renderer.js';
import { WorldModel, biomeCatalog, makeCaveMesh, makeLifePoints, makeLocalTerrain, worldOptionsForPreset } from './procedural.js';
import { entryBlob, entryText, extractDocx, readZip } from './zip-reader.js';
import { seededRandom } from './math.js';
import { buildSettlementScene, profileFromSettlement, settlementEnvironment } from './settlement-engine.js';
import { WorldSimulation } from './simulation-engine.js';
import { backendClient, backendLock } from './backend-lock.js';
import { SourceAbsorber } from './source-absorber.js';
import { StandaloneExporter } from './standalone-exporter.js';
import { PatternedWeatherSystem, MarineEcosystem, CaveExplorerSystem, VolcanoSystem } from './immersive-systems.js';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const canvas=$('#world-canvas');
let renderer;
try{renderer=new WorldRenderer(canvas);}catch(error){$('#loading h2').textContent='WebGL2 is unavailable';$('#loading p').textContent=error.message+' Enable hardware acceleration or use a WebGL2-capable browser.';throw error;}

const simulation=new WorldSimulation();
const patternedWeather=new PatternedWeatherSystem(simulation);
const volcanoSystem=new VolcanoSystem(simulation);
const sourceAbsorber=new SourceAbsorber({log:message=>logImport(message)});
const standaloneExporter=new StandaloneExporter({log:message=>logImport(message)});
let earthData,caveData,profiles=[],activeProfile=null,model,focus={lat:0,lon:0},selectedFeature=null,geoLines=[];
let settlementCatalog={provinces:[],settlements:[]},activeSettlement=null,activeSettlementData=null,activeNpcData=null,activeSettlementScene=null;
let weatherFeatures=[],selectedLocalObject=null,toastTimer,lastWeatherUpdate=0,marineSystem=null,surfaceImageBlob=null,surfaceImageName='',nestedZipDepth=0;


function updateAbsorberUI(){
  const summary=sourceAbsorber.summary(),stats=$('#absorber-stats');
  if(stats)stats.innerHTML=`<span>${summary.files} source files</span><span>${summary.controls} merged controls</span>`;
  sourceAbsorber.applyCompatibleStyles();
  sourceAbsorber.renderModules($('#absorbed-modules'),applyAbsorbedControl);
}
function applyAbsorbedControl(control,input){
  const value=input.type==='checkbox'?input.checked:(input.value??true),cap=control.capability;
  if(cap==='center')renderer.resetCamera();
  else if(cap==='rotation'){const on=input.type==='checkbox'?value:true;renderer.setFlags({rotation:on});$('#toggle-rotation').checked=on;}
  else if(cap==='water'){const on=input.type==='checkbox'?value:true;renderer.setFlags({water:on});$('#toggle-water').checked=on;}
  else if(cap==='atmosphere'||cap==='weather'){const on=input.type==='checkbox'?value:true;renderer.setFlags({atmosphere:on});$('#toggle-atmosphere').checked=on;}
  else if(cap==='features'){const on=input.type==='checkbox'?value:true;renderer.setFlags({features:on});$('#toggle-features').checked=on;}
  else if(cap==='life'){const on=input.type==='checkbox'?value:true;renderer.setFlags({life:on});$('#toggle-life').checked=on;}
  else if(cap==='eruption'){const on=input.type==='checkbox'?value:true;renderer.setFlags({eruption:on});$('#toggle-eruption').checked=on;if(on)renderer.spawnEruption();}
  else if(cap==='cave')switchScene('cave');
  else if(cap==='underwater')switchScene('underwater');
  else if(cap==='settlement')switchScene('settlement');
  else if(cap==='exaggeration'){const n=Math.max(.2,Math.min(7,Number(value)||1.6));renderer.exaggeration=n;$('#exaggeration').value=n;$('#exaggeration-value').textContent=`${n.toFixed(1)}×`;renderer.updateFeaturePoints();}
  else if(cap==='time'){const n=Number(value);if(Number.isFinite(n)){simulation.setSpeed(n);renderer.timeSpeed=Math.min(128,Math.sqrt(simulation.speed||0));}}
}
function standaloneOptions(){return{payload:exportPayload(),model,surfaceBlob:surfaceImageBlob,cave:caveData,profile:activeProfile,settlement:activeSettlement,npcs:activeNpcData,absorbed:sourceAbsorber.summary(),focus};}

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
  if(!f)return;selectedFeature=f;focus={lat:Number(f.lat)||0,lon:Number(f.lon)||0};renderer.setSelectedFeature(f);let html=featureDescription(f);if(/volcano/i.test(f.type||'')){const state=volcanoSystem.state(f);html+=`<p><strong>${escapeHTML(state.summary)}</strong> · activity ${Math.round(state.activity*100)}% · plume ${Math.round(state.plumeHeightM).toLocaleString()} m · ${state.cycleDays}-day deterministic cycle</p>`;renderer.setFlags({eruption:state.erupting});$('#toggle-eruption').checked=state.erupting;if(state.erupting)renderer.spawnEruption();}$('#feature-card').innerHTML=html;$('#feature-select').value=String(model.features.indexOf(f));showReadout(model.describeAt(focus.lat,focus.lon));if(focusCamera)renderer.focusFeature(f);
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
function provinceCenterFeatures(){
  return (settlementCatalog.provinces||[]).map((province,idx)=>{
    const settlements=settlementCatalog.settlements.filter(s=>s.province===province.name&&Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lon)));
    if(!settlements.length)return null;
    const lat=settlements.reduce((a,b)=>a+Number(b.lat||0),0)/settlements.length;
    const lon=settlements.reduce((a,b)=>a+Number(b.lon||0),0)/settlements.length;
    const elevation=model?model.elevationAt(lat,lon):0;
    return {id:`province-center:${province.name}:${idx}`,name:`${province.name} province center`,type:'province center',lat,lon,elevation_m:elevation,description:`Generated province center for ${province.name} based on the centroid of imported settlement coordinates.`,provinceRecord:province};
  }).filter(Boolean);
}
function pointFeatureAllowedOnGlobe(feature){
  const type=String(feature?.type||'').toLowerCase();
  return type.includes('settlement')||type.includes('province center')||type==='province center';
}
async function rebuildWorld(options,features=null){
  $('#loading').classList.remove('hidden');await new Promise(r=>requestAnimationFrame(r));
  model=new WorldModel({...options,features:[]});
  const geological=(features&&features.length)?features:makePlanetFeatures(model);
  weatherFeatures=patternedWeather.worldCells(settlementCatalog);
  model.features=[...geological,...provinceCenterFeatures(),...settlementFeatures(),...weatherFeatures];
  model.setProfile(activeProfile);marineSystem=new MarineEcosystem(model);await renderer.setWorldModel(model);if(surfaceImageBlob){try{await renderer.setSurfaceTexture(surfaceImageBlob);}catch(error){logImport(`Surface texture warning: ${error.message}`);}}renderer.setGeoLines(geoLines);renderer.projection=$('[data-projection].active')?.dataset.projection||'globe';renderer.scene='world';renderer.resetCamera();
  $('#dataset-status').textContent=model.name;$('#scene-mode').value='world';setSceneButtons('world');updateFeatureUI();
  $('#loading').classList.add('hidden');$('#underwater-tint').classList.remove('active');toast(`${model.name} is ready with ${settlementCatalog.settlementCount||0} canonical settlements.`);
}
function setSceneButtons(scene){$$('.scene-chip[data-scene]').forEach(b=>b.classList.toggle('active',b.dataset.scene===scene));$('#scene-status').textContent=scene==='world'?(renderer.projection==='globe'?'Globe':'Flat 3D'):scene==='settlement'?'Settlement 3D':scene[0].toUpperCase()+scene.slice(1);}
async function switchScene(scene){
  $('#scene-mode').value=scene;setSceneButtons(scene);
  if(scene==='world'){renderer.setScene('world');$('#underwater-tint').classList.remove('active');return;}
  if(scene==='settlement'){await buildSelectedSettlement();return;}
  if(scene==='cave'){const mesh=makeCaveMesh(caveData,16),objects=new CaveExplorerSystem(caveData).points();renderer.setCaveScene(mesh);renderer.setLocalObjects(objects);populateLocalObjects(objects);$('#underwater-tint').classList.remove('active');return;}
  const terrain=makeLocalTerrain(model,focus,scene,activeProfile,scene==='underwater'?168:144),life=makeLifePoints(model,focus,scene,activeProfile,scene==='underwater'?1600:820);terrain.hasWater=activeProfile?.biomes?.some(b=>/water|ocean|reef|marsh|swamp|beach/i.test(b.name))||terrain.centerElevation<80;
  const ecosystem=scene==='underwater'?(marineSystem||new MarineEcosystem(model)).build(focus,activeProfile,1450):[];renderer.setLocalScene(terrain,life,scene,{environment:scene,objects:ecosystem,waterLevel:scene==='underwater'?5.4:undefined});$('#underwater-tint').classList.toggle('active',scene==='underwater');if(ecosystem.length)populateLocalObjects(ecosystem);else clearLocalObjects();
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
  const snapshot=patternedWeather.pattern(activeSettlement,simulation.date(),$('#forecast-horizon').value);
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
  if(!activeSettlement)return;const snap=patternedWeather.pattern(activeSettlement,simulation.date(),$('#forecast-horizon').value);$('#weather-card').innerHTML=`<h3>${escapeHTML(snap.name)}</h3><p>${escapeHTML(snap.summary)}</p><div class="metric-row"><span>Intensity</span><strong>${Math.round(snap.intensity*100)}%</strong></div><div class="metric-row"><span>Duration model</span><strong>${snap.durationDays} day(s)</strong></div><div class="metric-row"><span>Pressure</span><strong>${Math.round(snap.pressureHpa)} hPa</strong></div><div class="metric-row"><span>Annual day</span><strong>${snap.dayOfYear}</strong></div>`;
}
function updateClock(){
  const now=performance.now(),dt=simulation.tick(now);$('#simulation-time').textContent=simulation.label();
  if(now-lastWeatherUpdate>900){lastWeatherUpdate=now;if(simulation.updateWeatherFeatures(weatherFeatures,dt*60)){renderer.updateFeaturePoints();}if(selectedFeature&&/volcano/i.test(selectedFeature.type||'')){const state=volcanoSystem.state(selectedFeature);renderer.setFlags({eruption:state.erupting});$('#toggle-eruption').checked=state.erupting;if(state.erupting&&!renderer.eruption.length)renderer.spawnEruption();}updateWeatherPanel();}
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
  $('#browse-files').addEventListener('click',()=>$('#file-input').click());$('#file-input').addEventListener('change',e=>handleFiles([...e.target.files]));$('#browse-folder').addEventListener('click',()=>$('#folder-input').click());$('#folder-input').addEventListener('change',e=>handleFiles([...e.target.files]));
  const dz=$('#drop-zone');['dragenter','dragover'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.add('drag');}));['dragleave','drop'].forEach(t=>dz.addEventListener(t,e=>{e.preventDefault();dz.classList.remove('drag');}));dz.addEventListener('drop',e=>handleFiles([...e.dataTransfer.files]));dz.addEventListener('click',()=>$('#file-input').click());
  $('#export-world').addEventListener('click',exportWorld);$('#export-standalone-globe').addEventListener('click',async()=>{try{toast('Compiling standalone globe…');await standaloneExporter.exportGlobe(standaloneOptions());toast('Standalone globe HTML exported.');}catch(e){console.error(e);toast(`Standalone globe export failed: ${e.message}`);}});$('#export-standalone-settlement').addEventListener('click',async()=>{try{toast('Compiling standalone settlement…');await standaloneExporter.exportSettlement(standaloneOptions());toast('Standalone settlement HTML exported.');}catch(e){console.error(e);toast(`Standalone settlement export failed: ${e.message}`);}});
  $('#backend-ping').addEventListener('click',async()=>{try{$('#backend-status').textContent='Checking…';const r=await backendClient.ping();$('#backend-status').textContent=r.ok===false?'Backend warning':'Backend reachable';toast('Backend check complete.');}catch(e){$('#backend-status').textContent='Connection blocked/offline';toast(`Backend check failed: ${e.message}`);}});
  $('#sync-world').addEventListener('click',async()=>{try{toast('Syncing world package…');const r=await backendClient.saveWorld(exportPayload());toast(r.ok===false?'Backend returned a warning.':'World package synced.');}catch(e){toast(`World sync failed: ${e.message}`);}});
  $('#sync-life').addEventListener('click',async()=>{if(!activeSettlement)return toast('Choose a settlement first.');try{toast('Syncing LifeSimulator state…');const p=simulation.lifePayload(activeSettlement,activeNpcData,selectedLocalObject);const r=await backendClient.syncLifeSimulator(p);toast(r.ok===false?'Backend returned a warning.':'LifeSimulator state synced.');}catch(e){toast(`LifeSimulator sync failed: ${e.message}`);}});
}
function exportPayload(){return {...model.serialize(),schema:'worldforge.immersive-world.v3',features:model.features.filter(f=>!f.type?.includes('weather system')),weather_systems:weatherFeatures,geojson_lines:geoLines,settlement_profile:activeProfile,active_settlement:activeSettlement,simulation_time_utc:simulation.date().toISOString(),systems:{caves:'explorable survey mesh',volcanoes:'deterministic eruption cycles',weather:'daily weekly monthly annual deterministic patterns',marine:'reef shelf slope abyss trench ecosystem'},source_absorption:sourceAbsorber.summary(),surface_texture:surfaceImageName||null,backend_lock:{lockId:backendLock.lockId,endpoint:backendLock.endpoint}};}
function exportWorld(){const blob=new Blob([JSON.stringify(exportPayload(),null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`${model.name.replace(/[^a-z0-9]+/gi,'_').toLowerCase()}_worldforge.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
async function imageToHeightmap(blob,name){
  const bitmap=await createImageBitmap(blob),max=768,scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height)),w=Math.max(2,Math.round(bitmap.width*scale)),h=Math.max(2,Math.round(bitmap.height*scale));
  const c=document.createElement('canvas');c.width=w;c.height=h;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(bitmap,0,0,w,h);
  const px=ctx.getImageData(0,0,w,h).data,raw=new Float32Array(w*h);
  for(let i=0;i<raw.length;i++) raw[i]=(px[i*4]*.2126+px[i*4+1]*.7152+px[i*4+2]*.0722)/255;
  let values=raw;
  for(let pass=0;pass<2;pass++){
    const next=new Float32Array(values.length);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      let acc=0,wt=0;
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        const xx=Math.max(0,Math.min(w-1,x+ox)),yy=Math.max(0,Math.min(h-1,y+oy));
        const wgt=(ox===0&&oy===0)?4:(Math.abs(ox)+Math.abs(oy)===2?.75:1.25);
        acc+=values[yy*w+xx]*wgt; wt+=wgt;
      }
      next[y*w+x]=acc/wt;
    }
    values=next;
  }
  const sorted=Array.from(values).sort((a,b)=>a-b);
  const waterPercent=Math.max(0,Math.min(100,Number($('#water-level')?.value||model.waterPercent||67)));
  const seaIndex=Math.max(0,Math.min(sorted.length-1,Math.floor(sorted.length*(waterPercent/100))));
  const seaLevel=sorted[seaIndex];
  const remapped=new Float32Array(values.length);
  for(let i=0;i<values.length;i++){
    const v=values[i];
    remapped[i]=v<=seaLevel?((seaLevel<=0)?0:(v/seaLevel)*0.48):0.52+((v-seaLevel)/Math.max(1e-6,1-seaLevel))*0.48;
  }
  model.setHeightmap({width:w,height:h,values:remapped,minElevationM:model.minElevationM,maxElevationM:model.maxElevationM});
  await renderer.setWorldModel(model);renderer.setGeoLines(geoLines);logImport(`✓ Heightmap ${name}: ${w}×${h}, smoothed and sea-balanced for gradual topography.`);toast('Heightmap applied with smoothed slopes and inferred sea level.');
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
async function applyGeoJSON(data,name){const lines=[],points=[];const list=data.type==='FeatureCollection'?data.features:data.type==='Feature'?[data]:[{geometry:data,properties:{}}];for(const item of list){const p=item.properties||{};flattenCoordinates(item.geometry,lines,points,{name:p.name||p.title||`Imported ${p.type||'feature'}`,type:p.type||p.feature_type||'imported landmark',description:p.description||`Imported from ${name}.`,...p});}geoLines.push(...lines);const approved=points.filter(p=>Number.isFinite(p.lat)&&Number.isFinite(p.lon)&&pointFeatureAllowedOnGlobe(p));const discarded=points.length-approved.length;if(approved.length)model.features.push(...approved);renderer.setFeatures(model.features);renderer.setGeoLines(geoLines);updateFeatureUI();logImport(`✓ GeoJSON ${name}: ${approved.length} allowed points, ${lines.length} paths.${discarded?` ${discarded} non-settlement / non-province-center point features were absorbed but not rendered as globe pins.`:''}`);}
async function applyJSON(data,name,path=''){
  if(data.type==='FeatureCollection'||data.type==='Feature'||data.coordinates){await applyGeoJSON(data,name);return;}
  if(data.schema==='belavados.settlement.v1'&&data.settlement){const s=data.settlement;const record={id:s.id,name:s.name,province:s.province,type:s.settlementType||s.type,lat:s.lat,lon:s.lon,population:s.population,biomes:s.biomes||[],primaryBiome:s.primaryBiome,transportation:s.transportation||[],elevationM:data.topographyWeatherCanon?.heightAndDepthBySeaLevel?.displayZMeters||0,terrainRule:data.topographyWeatherCanon?.localTopographicRule,weatherName:data.topographyWeatherCanon?.weather?.namedWeather,climateBelt:data.topographyWeatherCanon?.weather?.climateBelt,anchorMode:data.topographyWeatherCanon?.heightAndDepthBySeaLevel?.anchorMode,pinPlacement:data.topographyWeatherCanon?.pinPlacement,landformAtlas:data.topographyWeatherCanon?.provinceLandformAtlas,waterAtlas:data.topographyWeatherCanon?.provinceWaterAtlas};settlementCatalog.settlements.push(record);settlementCatalog.settlementCount=settlementCatalog.settlements.length;populateSettlementSelectors();logImport(`✓ Settlement ${record.name} imported.`);return;}
  if(data.schema?.startsWith('worlddepth.world')||data.schema?.startsWith('worldforge.world')||data.radius_km){geoLines=data.geojson_lines||[];const opts={name:data.name||name,preset:data.preset||'custom',seed:data.seed||93714,radiusKm:data.radius_km||6371,waterPercent:data.water_percent||67,seaLevelM:data.sea_level_m||0,minElevationM:data.min_elevation_m||-11000,maxElevationM:data.max_elevation_m||9000};await rebuildWorld(opts,data.features||[]);renderer.setGeoLines(geoLines);logImport(`✓ World dataset ${name} loaded.`);return;}
  if(data.height_grid||data.values&&data.width&&data.height){const h=data.height_grid||data;const values=Float32Array.from((Array.isArray(h.values[0])?h.values.flat():h.values).map(Number));model.setHeightmap({width:Number(h.width),height:Number(h.height),values,minElevationM:Number(h.min_elevation_m??h.minElevationM??model.minElevationM),maxElevationM:Number(h.max_elevation_m??h.maxElevationM??model.maxElevationM)});await renderer.setWorldModel(model);renderer.setGeoLines(geoLines);logImport(`✓ Elevation grid ${name}: ${h.width}×${h.height}.`);return;}
  if(data.stations&&Array.isArray(data.stations)){caveData=data;logImport(`✓ Cave survey ${name}: ${data.stations.length} stations.`);return;}
  if(data.biomes&&Array.isArray(data.biomes)){const p={name:data.name||path.split('/').filter(Boolean).slice(-2,-1)[0]||name,biomes:data.biomes,blending:data.blending||data.biome_blending||{}};profiles.push(p);updateProfileUI();logImport(`✓ Biome profile ${p.name}.`);return;}
  if(Array.isArray(data.features)){const approved=data.features.filter(pointFeatureAllowedOnGlobe);model.features.push(...approved);renderer.setFeatures(model.features);updateFeatureUI();logImport(`✓ ${approved.length} renderable globe point features from ${name}.`);if(data.features.length>approved.length)logImport(`• ${data.features.length-approved.length} additional point features were retained internally by source absorption but not rendered as globe pins.`);return;}logImport(`• Read JSON ${name}; no recognized terrain schema.`);
}
async function processNamedBlob(name,blob,path=name,{absorb=true}={}){
  const lower=path.toLowerCase();
  if(absorb)await sourceAbsorber.ingestBlob(blob,path,{modified:blob.lastModified});
  if(lower.endsWith('.json')||lower.endsWith('.geojson')){try{await applyJSON(JSON.parse(await blob.text()),name,path);}catch(e){logImport(`✕ ${path}: invalid JSON (${e.message}).`);}return;}
  if(/\.(png|jpe?g|webp|gif|bmp)$/i.test(lower)){
    const terrainMap=/height|elevation|dem|bathym|depth|displacement/i.test(path);
    if(terrainMap){await imageToHeightmap(blob,name);return;}
    try{
      const bitmap=await createImageBitmap(blob),ratio=bitmap.width/Math.max(1,bitmap.height),surfaceName=/world|globe|surface|planet|earth|realistic|albedo|basemap|blue.?marble|biome/i.test(path);
      if((surfaceName||ratio>1.72&&ratio<2.28)&&bitmap.width>=512){surfaceImageBlob=blob;surfaceImageName=path;const info=await renderer.setSurfaceTexture(blob);logImport(`✓ Surface image ${path}: ${info.width}×${info.height}, UV-molded onto displaced topography.`);toast('Surface image molded to the globe topography.');}
      else logImport(`• Texture/reference image retained by source absorber: ${path}.`);
    }catch(e){logImport(`• Image retained but could not be previewed: ${path} (${e.message}).`);}return;
  }
  if(lower.endsWith('.docx')){await processDocx(await blob.arrayBuffer(),path);return;}
  if(/\.(css|js|mjs|cjs|ts|tsx|jsx|html?|svg|vert|frag|glsl|wgsl|glb|gltf|obj|fbx|dae|stl|mtl)$/i.test(lower))logImport(`✓ Source component classified for safe merging: ${path}.`);
}
function inferProfilesFromEntries(entries){const groups=new Map();for(const e of entries){const m=e.name.match(/(?:^|\/)settlement_biome_profiles\/([^/]+)\/biome_([123])_(?:primary|secondary|tertiary)\/(.*)$/i);if(!m)continue;const [,settlement,index,tail]=m;if(!groups.has(settlement))groups.set(settlement,{name:settlement,biomes:[],blending:{source:'ZIP folder structure'}});let biome=null;if(/biome_reference\.json$/i.test(tail)){try{biome=JSON.parse(entryText(e)).name||null;}catch{}}if(!biome){const first=tail.split('/')[0];if(first&&!/\.json$/i.test(first))biome=first;}if(biome)groups.get(settlement).biomes[Number(index)-1]={name:biome};}let added=0;for(const p of groups.values()){p.biomes=p.biomes.filter(Boolean);if(p.biomes.length&&!profiles.some(x=>x.name===p.name)){profiles.push(p);added++;}}if(added)updateProfileUI();return added;}
async function processZip(arrayBuffer,name,depth=0){
  if(depth>3){logImport(`• Nested ZIP depth limit reached at ${name}.`);return;}
  const entries=await readZip(arrayBuffer);logImport(`↳ ZIP ${name}: ${entries.length} files.`);const inferred=inferProfilesFromEntries(entries);if(inferred)logImport(`✓ Inferred ${inferred} settlement profile(s).`);
  let processed=0;
  for(const e of entries){if(!e.name||e.name.endsWith('/'))continue;const lower=e.name.toLowerCase(),blob=entryBlob(e);processed++;
    if(lower.endsWith('.zip')){try{await processZip(await blob.arrayBuffer(),e.name,depth+1);}catch(error){logImport(`• Nested ZIP warning ${e.name}: ${error.message}`);}continue;}
    try{await processNamedBlob(e.name.split('/').pop(),blob,`${name}/${e.name}`);}catch(error){logImport(`• ${e.name}: ${error.message}`);}
    if(processed%80===0)await new Promise(r=>setTimeout(r,0));
  }
  updateAbsorberUI();
}
async function processDocx(arrayBuffer,name){const doc=await extractDocx(arrayBuffer),terms=['elevation','depth','mountain','valley','river','ocean','cave','cavern','biome','latitude','longitude','weather','season','volcano','reef'],found=terms.filter(t=>doc.text.toLowerCase().includes(t));logImport(`✓ DOCX ${name}: ${doc.text.length.toLocaleString()} characters, ${doc.media.length} embedded media; recognized: ${found.join(', ')||'general canon'}.`);sourceAbsorber.inspectData({canonText:doc.text.slice(0,250000),mediaCount:doc.media.length},name);const codeBlocks=[...doc.text.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];for(const m of codeBlocks){try{await applyJSON(JSON.parse(m[1]),`${name} embedded JSON`);}catch{}}for(const media of doc.media||[]){try{const blob=new Blob([media.data],{type:media.type||'application/octet-stream'});await processNamedBlob(media.name||'docx-media',blob,`${name}/embedded/${media.name||'media'}`);}catch{}}}
async function handleFiles(files){
  const ordered=[...files].sort((a,b)=>(a.webkitRelativePath||a.name).localeCompare(b.webkitRelativePath||b.name));logImport(`Processing ${ordered.length} uploaded item(s)…`);
  for(const file of ordered){try{const path=file.webkitRelativePath||file.name,lower=path.toLowerCase();if(lower.endsWith('.zip'))await processZip(await file.arrayBuffer(),path);else await processNamedBlob(file.name,file,path);}catch(e){console.error(e);logImport(`✕ ${file.name}: ${e.message}`);}}
  updateAbsorberUI();const sum=sourceAbsorber.summary();logImport(`✓ Source merge complete: ${sum.files} files, ${sum.controls} compatible controls, ${sum.styles} stylesheets, ${sum.scripts} script maps, ${sum.dataSchemas} structured schemas.`);toast('Uploaded world sources merged into WorldForge.');
}

async function init(){
  try{
    [earthData,caveData,profiles,settlementCatalog]=await Promise.all([
      fetch('data/earth_geology.json').then(r=>r.json()),fetch('data/caves/sample_cave.json').then(r=>r.json()),fetch('biomes/settlement_biome_profiles/index.json').then(r=>r.json()),fetch('data/settlement_catalog.json').then(r=>r.json())
    ]);
    activeProfile=profiles[0];populateSettlementSelectors();bindUI();updateProfileUI();updateAbsorberUI();simulation.setSpeed(Number($('#time-speed').value));
    $('#backend-lock-id').textContent=backendLock.lockId;$('#backend-endpoint').textContent=backendLock.endpoint;
    await rebuildWorld(worldOptionsForPreset('earth',93714,67),earthData.features);renderer.start();showReadout(model.describeAt(0,0));
    if(settlementCatalog.settlements.length)await selectSettlementById(settlementCatalog.settlements[0].id,false);updateClock();
  }catch(e){console.error(e);$('#loading h2').textContent='Unable to start WorldForge';$('#loading p').textContent=e.message+' — run this folder through the included local server.';}
}
init();
