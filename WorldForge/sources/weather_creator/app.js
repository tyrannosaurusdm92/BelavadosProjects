(function(){
'use strict';
const U=window.WeatherCreatorUtils;
const $=id=>document.getElementById(id);
const app={geology:null,engine:null,renderer:null,selected:{lat:42.36,lon:-71.06},pattern:'daily',forecast:null,speed:0.0166667,lastFrame:0,lastClimateUpdate:0,lastUIUpdate:0,lastForecastUpdate:0,painting:false,paintDirty:false,previousSpeed:0.0166667};
const planetKeys=['name','radiusKm','gravity','rotationHours','yearDays','axialTilt','pressureBar','oceanPercent','albedo','stellarFlux','greenhouse','magneticField','geothermal'];
const inputIds={name:'planetName',radiusKm:'radiusKm',gravity:'gravity',rotationHours:'rotationHours',yearDays:'yearDays',axialTilt:'axialTilt',pressureBar:'pressureBar',oceanPercent:'oceanPercent',albedo:'albedo',stellarFlux:'stellarFlux',greenhouse:'greenhouse',magneticField:'magneticField',geothermal:'geothermal'};

async function init(){
  bindStaticUI();
  try{
    app.geology=new GeologyGrid(180,90);
    const earth={...PLANET_PRESETS.earth,humidityMultiplier:1,storminess:1,aerosol:1};
    fillPlanetInputs(earth);
    await app.geology.generatePreset('earth',earth,(window.EARTH_LAND_MASK_DATA_URI||'assets/earth-land-mask.png'));
    app.engine=new WeatherEngine(app.geology,earth);
    app.renderer=new GlobeRenderer($('globeCanvas'),app.geology,app.engine);
    app.renderer.onSelect=(lat,lon)=>selectLocation(lat,lon,true);
    app.renderer.setSelected(app.selected.lat,app.selected.lon);
    bindRuntimeUI();
    redrawGeologyMap();
    updateAll(true);
    $('loading').classList.add('hidden');
    requestAnimationFrame(loop);
    toast('Creator ready','Earth geology, atmosphere, circulation, and seasonal cycles are active.');
  }catch(err){
    console.error(err);$('loading').innerHTML=`<strong>Could not start the renderer</strong><span>${U.escapeHtml(err.message)}</span>`;
  }
}

function bindStaticUI(){
  document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>{
    document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active',x===btn));
    document.querySelectorAll('.tab-page').forEach(p=>p.classList.toggle('active',p.dataset.page===btn.dataset.tab));
  }));
  $('helpBtn').addEventListener('click',()=>$('helpDialog').showModal());
  $('openProjectBtn').addEventListener('click',()=>$('projectInput').click());
  $('projectInput').addEventListener('change',e=>processFiles([...e.target.files],true));
}

function bindRuntimeUI(){
  $('planetPreset').addEventListener('change',()=>{
    const key=$('planetPreset').value;
    if(PLANET_PRESETS[key])fillPlanetInputs({...PLANET_PRESETS[key],humidityMultiplier:Number($('humidityMultiplier').value)/100,storminess:Number($('storminess').value)/100,aerosol:Number($('aerosol').value)/100});
  });
  $('applyPlanetBtn').addEventListener('click',applyPlanetInputs);
  $('regeneratePlanetBtn').addEventListener('click',regeneratePlanet);
  $('applyWeatherBiasBtn').addEventListener('click',()=>{
    const p=readPlanetInputs();p.humidityMultiplier=+$('humidityMultiplier').value/100;p.storminess=+$('storminess').value/100;p.aerosol=+$('aerosol').value/100;app.engine.setPlanet(p);updateAll(true);toast('Atmosphere recalculated','Moisture, storm energy, and aerosol controls were applied.');
  });
  ['humidityMultiplier','storminess','aerosol'].forEach(id=>$(id).addEventListener('input',()=>$(id+'Out').textContent=$(id).value+'%'));

  $('surfaceLayer').addEventListener('change',e=>{app.renderer.setLayer(e.target.value);updateLegend(e.target.value);});
  document.querySelectorAll('[data-render-toggle]').forEach(c=>c.addEventListener('change',()=>app.renderer.setToggle(c.dataset.renderToggle,c.checked)));
  $('autoRotate').addEventListener('change',e=>app.renderer.autoRotate=e.target.checked);
  $('resetCameraBtn').addEventListener('click',()=>{app.renderer.pitch=-.18;app.renderer.yaw=-1.1;app.renderer.zoom=3.05;});
  $('screenshotBtn').addEventListener('click',saveScreenshot);
  $('focusBtn').addEventListener('click',()=>app.renderer.focus(app.selected.lat,app.selected.lon));

  $('patternWindow').addEventListener('change',e=>{app.pattern=e.target.value;generateForecast(true);});
  $('speedSelect').addEventListener('change',e=>{app.speed=+e.target.value;if(app.speed>0)app.previousSpeed=app.speed;updateSpeedUI();});
  $('playPauseBtn').addEventListener('click',()=>{if(app.speed>0){app.previousSpeed=app.speed;app.speed=0;$('speedSelect').value='0';}else{app.speed=app.previousSpeed||.0166667;setClosestSpeed(app.speed);}updateSpeedUI();});
  $('dateInput').addEventListener('change',e=>{const d=new Date(e.target.value);if(!isNaN(d))app.engine.setDate(d);updateAll(true);});
  $('yearSlider').addEventListener('input',e=>{const year=app.engine.planet.yearDays||365,current=Math.floor(app.engine.simTimeDays/year);app.engine.simTimeDays=current*year+(+e.target.value/1000)*year;app.engine.update(true);updateAll(true);});

  $('saveProjectBtn').addEventListener('click',saveProject);
  $('exportForecastBtn').addEventListener('click',exportForecast);
  $('exportGeologyBtn').addEventListener('click',()=>U.downloadJSON(safeName(app.engine.planet.name)+'_geology.json',{type:'planetary-geology-grid',version:1,planet:app.engine.planet,geology:app.geology.serialize()}));
  $('clearObsBtn').addEventListener('click',()=>{app.engine.clearObservations();updateAll(true);toast('Observations cleared','The atmosphere has returned to fully generated conditions.');});

  $('chooseFilesBtn').addEventListener('click',()=>$('fileInput').click());
  $('chooseFolderBtn').addEventListener('click',()=>$('folderInput').click());
  $('fileInput').addEventListener('change',e=>processFiles([...e.target.files]));
  $('folderInput').addEventListener('change',e=>processFiles([...e.target.files]));
  const drop=$('dropZone');['dragenter','dragover'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.add('dragover');}));['dragleave','drop'].forEach(t=>drop.addEventListener(t,e=>{e.preventDefault();drop.classList.remove('dragover');}));drop.addEventListener('drop',e=>processFiles([...e.dataTransfer.files]));

  $('geologyMapField').addEventListener('change',redrawGeologyMap);
  $('brushRadius').addEventListener('input',()=>{$('brushRadiusOut').textContent=$('brushRadius').value+'°';});
  $('brushStrength').addEventListener('input',()=>{$('brushStrengthOut').textContent=$('brushStrength').value+'%';});
  bindMapEditor();
}

function readPlanetInputs(){
  const p={...app.engine?.planet};
  for(const key of planetKeys){const el=$(inputIds[key]);p[key]=key==='name'?el.value.trim()||'Unnamed World':Number(el.value);}
  p.preset=$('planetPreset').value;p.humidityMultiplier=+$('humidityMultiplier').value/100;p.storminess=+$('storminess').value/100;p.aerosol=+$('aerosol').value/100;
  return p;
}
function fillPlanetInputs(p){
  for(const key of planetKeys){const el=$(inputIds[key]);if(el&&p[key]!==undefined)el.value=p[key];}
  if(p.preset)$('planetPreset').value=p.preset;
  $('planetBadge').textContent=p.name||'World';
}
function applyPlanetInputs(){const p=readPlanetInputs();app.engine.setPlanet(p);$('planetBadge').textContent=p.name;updateAll(true);toast('Planetary physics applied',`${p.name}: ${p.rotationHours} h day, ${p.yearDays} day year, ${p.pressureBar} bar atmosphere.`);}
async function regeneratePlanet(){
  const p=readPlanetInputs();showLoading('Regenerating geology','Building terrain, oceans, ice, surface moisture, and volcanic systems…');
  await new Promise(r=>setTimeout(r,40));
  try{await app.geology.generatePreset(p.preset,p,(window.EARTH_LAND_MASK_DATA_URI||'assets/earth-land-mask.png'));app.engine.setPlanet(p);app.renderer.updateTexture(true);app.renderer.updateWeatherGeometry(true);redrawGeologyMap();updateAll(true);toast('New world generated',app.geology.sourceName);}catch(e){toast('Generation failed',e.message,true);}finally{$('loading').classList.add('hidden');}
}

function bindMapEditor(){
  const canvas=$('geologyMap');
  const point=e=>{const r=canvas.getBoundingClientRect(),x=U.clamp((e.clientX-r.left)/r.width,0,.9999),y=U.clamp((e.clientY-r.top)/r.height,0,.9999);return{lat:90-y*180,lon:x*360-180,x:x*r.width,y:y*r.height};};
  const paint=e=>{const p=point(e),field=$('brushField').value,mode=$('brushMode').value,radius=+$('brushRadius').value,raw=+$('brushStrength').value/100;let strength;if(field==='elevation')strength=mode==='set'?(raw*2-1)*9000:raw*900;else if(field==='ocean')strength=mode==='set'?raw:raw*.2;else strength=mode==='set'?raw:raw*.12;app.geology.paint(p.lat,p.lon,field,radius,strength,mode);app.selected={lat:p.lat,lon:p.lon};app.renderer.setSelected(p.lat,p.lon);app.paintDirty=true;redrawGeologyMap();showMapCrosshair(p.x,p.y);};
  canvas.addEventListener('pointerdown',e=>{app.painting=true;canvas.setPointerCapture(e.pointerId);paint(e);});
  canvas.addEventListener('pointermove',e=>{const p=point(e);showMapCrosshair(p.x,p.y);if(app.painting)paint(e);});
  canvas.addEventListener('pointerleave',()=>{$('mapCrosshair').style.display='none';});
  canvas.addEventListener('pointerup',()=>{app.painting=false;if(app.paintDirty){app.paintDirty=false;app.engine.update(true);app.renderer.updateTexture(true);app.renderer.updateWeatherGeometry(true);updateAll(true);}});
  canvas.addEventListener('contextmenu',e=>{e.preventDefault();const p=point(e);selectLocation(p.lat,p.lon,true);});
}
function showMapCrosshair(x,y){const c=$('mapCrosshair');c.style.display='block';c.style.left=(x-6)+'px';c.style.top=(y-6)+'px';}
function redrawGeologyMap(){if(!app.geology)return;app.geology.renderMap($('geologyMap'),$('geologyMapField').value);$('geologySource').textContent=app.geology.sourceName;}

async function processFiles(files,forceProject=false){
  if(!files.length)return;showLoading('Importing world data',`Reading ${files.length} file${files.length===1?'':'s'}…`);let geologyCount=0,weatherCount=0,images=0,projects=0,errors=[];
  await new Promise(r=>setTimeout(r,30));
  for(const file of files){try{
    const lower=file.name.toLowerCase();
    if(file.type.startsWith('image/')||/\.(png|jpg|jpeg|webp|bmp)$/.test(lower)){const src=await U.readFileDataURL(file);await app.geology.applyHeightmap(src,{minElevation:-9000,maxElevation:9000});images++;continue;}
    if(!/\.(json|geojson)$/.test(lower)&&file.type!=='application/json')continue;
    const data=JSON.parse(await U.readFileText(file));
    if(forceProject||data.type==='planetary-weather-project'){loadProjectData(data);projects++;forceProject=false;continue;}
    if(data.type==='planetary-geology-grid'&&data.geology){app.geology.load(data.geology);if(data.planet){fillPlanetInputs(data.planet);app.engine.setPlanet(data.planet);}geologyCount++;continue;}
    if(data.geology?.fields){app.geology.load(data.geology);if(data.planet){fillPlanetInputs(data.planet);app.engine.setPlanet(data.planet);}geologyCount++;continue;}
    if(data.planet&&!data.features){const merged={...app.engine.planet,...data.planet};fillPlanetInputs(merged);app.engine.setPlanet(merged);projects++;continue;}
    if(data.type==='FeatureCollection'||data.type==='Feature'){
      const features=data.type==='FeatureCollection'?data.features:[data];const weatherish=features.filter(f=>{const p=f.properties||{};return ['temperatureC','temperature','tempC','pressureHpa','humidity','windU','windV','precipMmHr','cloud'].some(k=>p[k]!==undefined);}).length;
      if(weatherish>0&&weatherish>=features.length*.5)weatherCount+=app.engine.assimilateGeoJSON(data);else geologyCount+=app.geology.applyGeoJSON(data);
    }
  }catch(e){errors.push(`${file.name}: ${e.message}`);}}
  app.engine.update(true);app.renderer.updateTexture(true);app.renderer.updateWeatherGeometry(true);redrawGeologyMap();updateAll(true);$('loading').classList.add('hidden');
  const parts=[];if(projects)parts.push(`${projects} project/config`);if(geologyCount)parts.push(`${geologyCount} geological cells/zones`);if(weatherCount)parts.push(`${weatherCount} weather observations`);if(images)parts.push(`${images} heightmap`);toast(errors.length?'Import completed with warnings':'Import complete',(parts.join(', ')||'No compatible files found')+(errors.length?`. ${errors.slice(0,2).join(' • ')}`:''),errors.length>0);
}

function saveProject(){
  const data={type:'planetary-weather-project',version:1,savedAt:new Date().toISOString(),planet:app.engine.planet,epoch:app.engine.epoch.toISOString(),simTimeDays:app.engine.simTimeDays,selected:app.selected,pattern:app.pattern,render:{layer:app.renderer.layer,toggles:app.renderer.toggles,pitch:app.renderer.pitch,yaw:app.renderer.yaw,zoom:app.renderer.zoom},observations:app.engine.observations,geology:app.geology.serialize()};
  U.downloadJSON(safeName(app.engine.planet.name)+'_weather_project.json',data);toast('Project saved','Planet, geology, weather controls, time, observations, and view state were included.');
}
function loadProjectData(data){
  if(data.type!=='planetary-weather-project'&&!data.geology)throw new Error('This JSON is not a complete weather project.');
  if(data.geology)app.geology.load(data.geology);if(data.planet){fillPlanetInputs(data.planet);app.engine.setPlanet(data.planet);}if(data.epoch)app.engine.epoch=new Date(data.epoch);if(Number.isFinite(data.simTimeDays))app.engine.simTimeDays=data.simTimeDays;if(data.selected)app.selected=data.selected;if(data.pattern){app.pattern=data.pattern;$('patternWindow').value=data.pattern;}if(Array.isArray(data.observations))app.engine.observations=data.observations;
  if(data.render){app.renderer.setLayer(data.render.layer||'composite');$('surfaceLayer').value=data.render.layer||'composite';Object.assign(app.renderer.toggles,data.render.toggles||{});if(Number.isFinite(data.render.pitch))app.renderer.pitch=data.render.pitch;if(Number.isFinite(data.render.yaw))app.renderer.yaw=data.render.yaw;if(Number.isFinite(data.render.zoom))app.renderer.zoom=data.render.zoom;document.querySelectorAll('[data-render-toggle]').forEach(c=>c.checked=app.renderer.toggles[c.dataset.renderToggle]!==false);}
  app.engine.update(true);app.renderer.setSelected(app.selected.lat,app.selected.lon);app.renderer.updateTexture(true);app.renderer.updateWeatherGeometry(true);redrawGeologyMap();updateAll(true);
}
function exportForecast(){generateForecast(true);const data={type:'planetary-weather-forecast',version:1,planet:app.engine.planet,simulationDate:app.engine.getDate().toISOString(),selected:app.selected,forecast:app.forecast,global:app.engine.globalStats(),systems:app.engine.events,weatherSnapshot:app.engine.exportSnapshot(6)};U.downloadJSON(`${safeName(app.engine.planet.name)}_${app.pattern}_forecast.json`,data);toast('Forecast exported',`${app.pattern} pattern plus global systems and a sampled weather GeoJSON were included.`);}
function saveScreenshot(){const url=app.renderer.screenshot();fetch(url).then(r=>r.blob()).then(b=>U.downloadBlob(`${safeName(app.engine.planet.name)}_weather_${Date.now()}.png`,b));}

function selectLocation(lat,lon,focus=false){app.selected={lat:U.clamp(lat,-89.9,89.9),lon:U.wrapLon(lon)};app.renderer.setSelected(app.selected.lat,app.selected.lon);if(focus)app.renderer.focus(app.selected.lat,app.selected.lon);updateSelected();generateForecast(true);}
function updateAll(force=false){updateTimeUI();updateSelected();updateGlobal();updateEvents();if(force||performance.now()-app.lastForecastUpdate>5000)generateForecast(force);app.renderer.updateTexture(force);app.renderer.updateWeatherGeometry(force);}
function updateTimeUI(){const d=app.engine.getDate();$('simDateHud').textContent=U.formatDate(d);$('dateInput').value=d.toISOString().slice(0,16);const phase=app.engine.getAstronomy().yearPhase;$('yearSlider').value=Math.round(phase*1000);$('seasonLabel').textContent=seasonName(phase);updateSpeedUI();}
function updateSpeedUI(){const sel=$('speedSelect'),opt=[...sel.options].find(o=>Math.abs(+o.value-app.speed)<1e-6);$('simSpeedHud').textContent=app.speed===0?'Paused':(opt?opt.textContent:`${U.formatNumber(app.speed,3)} days/sec`);$('playPauseBtn').textContent=app.speed===0?'▶':'Ⅱ';$('playPauseBtn').setAttribute('aria-label',app.speed===0?'Play simulation':'Pause simulation');}
function setClosestSpeed(v){let best=[...$('speedSelect').options][0],dist=Infinity;for(const o of $('speedSelect').options){const d=Math.abs(+o.value-v);if(d<dist){dist=d;best=o;}}$('speedSelect').value=best.value;app.speed=+best.value;}
function seasonName(p){if(p<.125||p>=.875)return'Northern winter';if(p<.375)return'Northern spring';if(p<.625)return'Northern summer';return'Northern autumn';}
function formatCoord(v,pos,neg){return `${Math.abs(v).toFixed(2)}° ${v>=0?pos:neg}`;}
function updateSelected(){
  const s=app.engine.sample(app.selected.lat,app.selected.lon),g=s.geology;const coords=`${formatCoord(app.selected.lat,'N','S')}, ${formatCoord(app.selected.lon,'E','W')}`;
  $('selectedCoordsHud').textContent=coords;$('selectedConditionHud').textContent=s.condition;$('locationTitle').textContent=coords;$('localTemp').textContent=`${Math.round(s.temperature)}°C`;$('localCondition').textContent=s.condition;$('localBiome').textContent=(g.biome||'unknown').replace(/-/g,' ');
  $('surfaceType').textContent=g.ocean>.5?'Ocean surface':'Land surface';$('localPressure').textContent=`${Math.round(s.pressure)} hPa`;$('localHumidity').textContent=`${Math.round(s.humidity*100)}%`;$('localWind').textContent=`${U.formatNumber(s.windSpeed,1)} m/s`;$('localPrecip').textContent=s.snow>.2?`${U.formatNumber(s.snow,1)} mm/h snow`:`${U.formatNumber(s.precip,1)} mm/h`;$('localVisibility').textContent=`${U.formatNumber(s.visibility,1)} km`;$('localElevation').textContent=`${Math.round(g.elevation).toLocaleString()} m`;$('localStorm').textContent=`${Math.round(s.storm*100)}%`;
}
function updateGlobal(){const g=app.engine.globalStats();$('globalTemp').textContent=`${U.formatNumber(g.temperature,1)}°C`;$('globalCloud').textContent=`${Math.round(g.cloud*100)}%`;$('globalWind').textContent=`${U.formatNumber(g.windSpeed,1)} m/s`;$('globalEvents').textContent=g.eventCount;$('planetBadge').textContent=app.engine.planet.name;}
function updateEvents(){const list=$('eventList'),events=app.engine.events;$('eventCount').textContent=events.length;$('globalEvents').textContent=events.length;if(!events.length){list.innerHTML='<div class="empty-state">No major systems at this simulation moment.</div>';return;}list.innerHTML=events.slice(0,8).map((e,i)=>`<div class="event-item" data-event-index="${i}"><i class="event-dot"></i><div><strong>${U.escapeHtml(e.type)}</strong><span>${formatCoord(e.lat,'N','S')} • ${formatCoord(e.lon,'E','W')}</span></div><em>${Math.round(e.severity*100)}%</em></div>`).join('');list.querySelectorAll('.event-item').forEach(el=>el.addEventListener('click',()=>{const e=events[+el.dataset.eventIndex];selectLocation(e.lat,e.lon,true);}));}

function generateForecast(force=false){if(!app.engine)return;const now=performance.now();if(!force&&now-app.lastForecastUpdate<4500)return;app.lastForecastUpdate=now;app.forecast=app.engine.forecastAt(app.selected.lat,app.selected.lon,app.pattern);drawForecastChart();const names={daily:'24-hour pattern',weekly:'7-day pattern',monthly:'30-day pattern',annual:'12-month climate pattern'};$('forecastHeading').textContent=names[app.pattern];}
function drawForecastChart(){
  const canvas=$('forecastChart'),ctx=canvas.getContext('2d'),dpr=Math.min(2,window.devicePixelRatio||1),rect=canvas.getBoundingClientRect(),w=Math.max(300,Math.round(rect.width*dpr)),h=Math.max(170,Math.round(rect.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}ctx.clearRect(0,0,w,h);const pts=app.forecast?.points||[];if(!pts.length)return;const pad={l:34*dpr,r:12*dpr,t:16*dpr,b:28*dpr},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;const temps=pts.map(p=>p.temperature),precs=pts.map(p=>p.precip+p.snow),tMin=Math.floor(Math.min(...temps)-4),tMax=Math.ceil(Math.max(...temps)+4),pMax=Math.max(1,...precs);
  ctx.strokeStyle='rgba(143,185,235,.13)';ctx.lineWidth=1;ctx.fillStyle='#8096b3';ctx.font=`${8*dpr}px system-ui`;ctx.textAlign='right';for(let i=0;i<=4;i++){const y=pad.t+ph*i/4;ctx.beginPath();ctx.moveTo(pad.l,y);ctx.lineTo(w-pad.r,y);ctx.stroke();const tv=tMax-(tMax-tMin)*i/4;ctx.fillText(`${Math.round(tv)}°`,pad.l-5*dpr,y+3*dpr);}
  const step=pw/Math.max(1,pts.length-1);ctx.fillStyle='rgba(75,184,232,.23)';precs.forEach((p,i)=>{const x=pad.l+i*step,bh=p/pMax*ph*.6;ctx.fillRect(x-Math.max(1,step*.23),pad.t+ph-bh,Math.max(2,step*.46),bh);});
  const grad=ctx.createLinearGradient(0,pad.t,0,pad.t+ph);grad.addColorStop(0,'#fff075');grad.addColorStop(.5,'#64e8ff');grad.addColorStop(1,'#777cff');ctx.strokeStyle=grad;ctx.lineWidth=2*dpr;ctx.beginPath();temps.forEach((t,i)=>{const x=pad.l+i*step,y=pad.t+(tMax-t)/(tMax-tMin||1)*ph;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();
  ctx.fillStyle='#8299b6';ctx.textAlign='center';const every=Math.max(1,Math.ceil(pts.length/6));pts.forEach((p,i)=>{if(i%every===0||i===pts.length-1)ctx.fillText(p.label,pad.l+i*step,h-9*dpr);});
}
function updateLegend(layer){const gradients={composite:'linear-gradient(90deg,#071e55,#1e8e9c,#3a995b,#ddd7bd)',temperature:'linear-gradient(90deg,#481a70,#2149be,#25c5d7,#3ec16e,#f3d038,#ee4a42)',pressure:'linear-gradient(90deg,#3e198c,#2182c8,#edf4f4,#efbe41,#b42335)',humidity:'linear-gradient(90deg,#5f3219,#c6913d,#4ab487,#1658be)',wind:'linear-gradient(90deg,#132652,#23a0be,#52df82,#facd37,#eb2e3a)',cloud:'linear-gradient(90deg,#0a142e,#465c76,#f5faff)',precipitation:'linear-gradient(90deg,#0e142d,#1e64aa,#28d2db,#69ef73,#fff6a0)',storm:'linear-gradient(90deg,#0c1428,#462969,#d24b5a,#fff064)',elevation:'linear-gradient(90deg,#051030,#084582,#1e82a8,#1c7346,#826e3c,#fff)'};$('legend').querySelector('div').style.background=gradients[layer]||gradients.composite;}

function loop(now){const dt=Math.min(100,now-(app.lastFrame||now));app.lastFrame=now;if(app.speed>0){app.engine.simTimeDays+=app.speed*dt/1000;const interval=app.speed>1?350:app.speed>.1?250:160;if(now-app.lastClimateUpdate>interval){app.lastClimateUpdate=now;app.engine.update();app.renderer.updateTexture(true);app.renderer.updateWeatherGeometry(true);if(now-app.lastUIUpdate>500){app.lastUIUpdate=now;updateTimeUI();updateSelected();updateGlobal();updateEvents();}if(now-app.lastForecastUpdate>5000)generateForecast();}}app.renderer.render(dt);requestAnimationFrame(loop);}

function showLoading(title,sub){$('loading').classList.remove('hidden');$('loading').innerHTML=`<div class="spinner"></div><strong>${U.escapeHtml(title)}</strong><span>${U.escapeHtml(sub)}</span>`;}
function toast(title,message,error=false){const el=document.createElement('div');el.className='toast'+(error?' error':'');el.innerHTML=`<strong>${U.escapeHtml(title)}</strong><span>${U.escapeHtml(message)}</span>`;$('toastStack').appendChild(el);setTimeout(()=>{el.style.opacity='0';el.style.transform='translateY(8px)';setTimeout(()=>el.remove(),250);},4200);}
function safeName(name){return String(name||'planet').trim().replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'')||'planet';}

window.addEventListener('DOMContentLoaded',init);
})();
