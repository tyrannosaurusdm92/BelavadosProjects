(function () {
  'use strict';
  const Domain = window.BelavadosMapDomain;
  const Backend = window.BelavadosBackend;
  if (!Domain || !Backend) throw new Error('Map domain and backend modules must load before editor-enhancements.js');

  const q = id => document.getElementById(id);
  let config, backend, registry = [], pendingFiles = new Map(), placementReferences = [];
  const editorReady = () => typeof state !== 'undefined' && Array.isArray(state?.provinces) && typeof mapCanvas !== 'undefined';
  const raceCatalog = () => window.BELAVADOS_RACE_DROPDOWN?.raceCategories || [];

  function setStatus(message, kind) {
    const el = q('backendStatus'); if (!el) return;
    el.textContent = message; el.className = `backend-status ${kind || ''}`;
  }
  function setLastSaveLink(result) {
    const host = q('backendLastSave'); if (!host) return;
    host.replaceChildren();
    const file = result?.file || result?.results?.[0]?.file;
    if (!file?.driveUrl) return;
    const a = document.createElement('a'); a.href = file.driveUrl; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = `Open backend copy: ${file.name || result.filename || 'saved map'}`; host.append(a);
  }
  function createBackendPanel() {
    if (q('githubBackendCard')) return;
    const section = document.createElement('section');
    section.id = 'githubBackendCard'; section.className = 'card github-backend-card';
    section.innerHTML = `<h2>Locked Belavadös Backend &amp; DMEditor JSON</h2>
      <div class="backend-lock-note"><strong>Fixed deployment:</strong> BelavadosProjects/DMEditor<br><span id="backendLockDisplay"></span></div>
      <div class="backend-auth" id="backendAuthPanel">
        <label>Display name (new accounts only)<input id="backendDisplayName" autocomplete="name" placeholder="DM name"></label>
        <label>Email<input id="backendEmail" type="email" autocomplete="username" placeholder="you@example.com"></label>
        <label>Password<input id="backendPassword" type="password" autocomplete="current-password" minlength="8" placeholder="8+ characters"></label>
        <div class="auth-buttons"><button class="primary" id="backendSignIn">Sign In</button><button id="backendSignUp">Create Account</button><button id="backendSignOut">Sign Out</button></div>
        <div class="backend-auth-state" id="backendAuthState">Not signed in. Local editing and downloads still work.</div>
      </div>
      <div class="backend-grid">
        <label class="wide">Recognized JSON file<select id="jsonRegistry"></select></label>
        <button id="refreshJsonRegistry">Refresh DMEditor/json</button><button id="loadRegisteredJson">Load Selected JSON</button>
        <button class="wide" id="openBackendFile">Open Selected Backend Copy</button>
        <label class="wide">Logical save filename<input id="backendFilename" value="dm_map.json" maxlength="120"></label>
        <button class="primary" id="saveBackend">Save Complete Map to Backend</button><button id="saveSnapshot">Save Timestamped Snapshot</button>
        <button class="primary wide" id="exportInteractiveMap">Export Updated Interactive World Map ZIP</button>
        <label class="wide">Add JSON or ZIP files<input id="projectFileInput" type="file" accept=".json,.geojson,.zip,application/json,application/zip" multiple></label>
      </div>
      <div class="file-drop" id="projectDrop">Drop JSON, GeoJSON, or a JSON ZIP here. Files can be loaded immediately; complete map saves use the fixed backend.</div>
      <div class="backend-status" id="backendStatus">Connecting to the fixed map backend…</div>
      <div class="backend-last-save" id="backendLastSave"></div>
      <div class="placement-summary" id="placementSummary">Select a settlement or territory to see its live placement result.</div>
      <div class="route-status" id="routeStatus"></div>`;
    const side = document.querySelector('.side'); side?.insertBefore(section, side.firstChild);
    q('backendLockDisplay').textContent = `${Backend.LOCK.githubPagesUrl || 'https://tyrannosaurusdm92.github.io/BelavadosProjects/DMEditor/'} · JSON path: DMEditor/json`;
    q('refreshJsonRegistry').onclick = refreshRegistry;
    q('loadRegisteredJson').onclick = loadSelectedRegistry;
    q('openBackendFile').onclick = openSelectedBackendFile;
    q('saveBackend').onclick = () => saveBackend(false);
    q('saveSnapshot').onclick = () => saveBackend(true);
    q('exportInteractiveMap').onclick = exportInteractiveMap;
    q('backendSignIn').onclick = () => authenticateBackend(false);
    q('backendSignUp').onclick = () => authenticateBackend(true);
    q('backendSignOut').onclick = signOutBackend;
    q('projectFileInput').onchange = e => ingestFiles(e.target.files);
    const drop = q('projectDrop');
    ['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, e => {e.preventDefault(); drop.classList.add('dragover');}));
    ['dragleave', 'drop'].forEach(type => drop.addEventListener(type, e => {e.preventDefault(); drop.classList.remove('dragover');}));
    drop.addEventListener('drop', e => ingestFiles(e.dataTransfer.files));
  }
  function renderAuthState() {
    const stateEl = q('backendAuthState'), signed = Boolean(backend?.authenticated), user = backend?.user;
    if (stateEl) stateEl.textContent = signed ? `Signed in as ${user?.displayName || user?.email || 'backend user'}. Complete saves are enabled.` : 'Not signed in. Local editing and downloads still work; sign in for backend saves.';
    ['backendEmail','backendPassword','backendDisplayName','backendSignIn','backendSignUp'].forEach(id => {const el=q(id); if(el) el.disabled=signed;});
    if (q('backendSignOut')) q('backendSignOut').disabled = !signed;
    if (q('saveBackend')) q('saveBackend').disabled = backend?.mode === 'apps-script' && !signed;
    if (q('saveSnapshot')) q('saveSnapshot').disabled = backend?.mode === 'apps-script' && !signed;
  }
  async function authenticateBackend(createAccount) {
    const email=q('backendEmail')?.value.trim(), password=q('backendPassword')?.value || '', displayName=q('backendDisplayName')?.value.trim();
    if (!email || password.length < 8) {setStatus('Enter an email and a password of at least 8 characters.', 'error'); return;}
    setStatus(createAccount ? 'Creating the backend account…' : 'Signing in to the fixed backend…');
    try {
      if (createAccount) await backend.signUp(displayName, email, password); else await backend.signIn(email, password);
      if (q('backendPassword')) q('backendPassword').value=''; renderAuthState(); await refreshRegistry();
      setStatus(`Backend session ready for ${backend.user?.displayName || backend.user?.email || 'DMEditor'}.`, 'ok');
    } catch (error) {setStatus(error.message, 'error'); renderAuthState();}
  }
  async function signOutBackend() {
    try {await backend.signOut();} catch (_) {} renderAuthState(); await refreshRegistry(); setStatus('Signed out. Browser editing and local exports remain available.', 'ok');
  }
  function openSelectedBackendFile() {
    const item=registry[Number(q('jsonRegistry')?.value)];
    if (!item?.driveUrl) {setStatus('The selected file is not a backend Drive copy.', 'error'); return;}
    window.open(item.driveUrl, '_blank', 'noopener');
  }
  function setEverythingHidden() {
    ['borderOverlayToggle', 'provinceBorderOverlayToggle', 'showProvinceCenterPin', 'showSettlementPins',
      'showNaturalPoints', 'showNaturalLines', 'showNaturalLabels'].forEach(id => {const el = q(id); if (el) el.checked = false;});
    document.querySelectorAll('[data-system-section]').forEach(el => {el.checked = false; el.dispatchEvent(new Event('change'));});
    try { state.provinces.forEach(p => {p.visible = false;}); } catch (_) {}
    try { drawMap(); } catch (_) {}
  }

  function setEditableDefaults() {
    ['borderOverlayToggle', 'provinceBorderOverlayToggle', 'showProvinceCenterPin', 'showSettlementPins'].forEach(id => {const el=q(id); if(el) el.checked=true;});
    ['showNaturalPoints','showNaturalLines','showNaturalLabels'].forEach(id => {const el=q(id); if(el) el.checked=false;});
    document.querySelectorAll('[data-system-section]').forEach(el => {el.checked=false; el.dispatchEvent(new Event('change'));});
    try {state.provinces.forEach(p => {p.visible=true;});} catch (_) {}
    const mode=q('provinceEditorMode'); if(mode){mode.checked=true; mode.dispatchEvent(new Event('change'));}
    try {drawMap();} catch (_) {}
  }

  function addVisibilityMasters() {
    const host = q('naturalSectionToggles'); if (!host || q('visibilityMasterRow')) return;
    const row = document.createElement('div'); row.id = 'visibilityMasterRow'; row.className = 'visibility-master-row';
    row.innerHTML = '<button type="button" id="hideEveryLayer">Hide Every Layer</button><button type="button" id="showSelectedWork">Show Selected Work</button>';
    host.parentElement.insertBefore(row, host);
    q('hideEveryLayer').onclick = setEverythingHidden;
    q('showSelectedWork').onclick = () => {
      ['borderOverlayToggle', 'provinceBorderOverlayToggle', 'showProvinceCenterPin', 'showSettlementPins'].forEach(id => {const el = q(id); if (el) el.checked = true;});
      const p = current?.(); if (p) p.visible = true;
      drawMap();
    };
  }

  function sampleTerrain(settlement) {
    try {
      if (typeof terrainPixel === 'function' && typeof terrainClassify === 'function') {
        const pixel = terrainPixel(settlement.x, settlement.y);
        return terrainClassify(pixel, settlement.x, settlement.y, 'hybrid')?.type || 'unknown';
      }
    } catch (_) {}
    return settlement.primaryBiome || settlement.mappedBiomeAtPin || 'unknown';
  }
  function ensureStableIds() {
    const canonicalProvinces = window.BELAVADOS_DM_MAP_DATA?.provinces || [];
    const canonicalSettlements = canonicalProvinces.flatMap(p => (p.settlements || []).map(s => ({province: p.name || p.province, settlement: s})));
    for (const province of state.provinces || []) {
      const provinceKey=Domain.slug(province.name||province.province);
      for (const settlement of province.settlements || []) {
        const name=settlement.name||settlement.settlement;
        const reference=canonicalSettlements.find(item=>item.province===(province.name||province.province)&&(item.settlement.name||item.settlement.settlement)===name) || canonicalSettlements.find(item=>(item.settlement.name||item.settlement.settlement)===name);
        const stable=reference?.settlement.settlementId||reference?.settlement.id||settlement.settlementId||settlement.id||`${provinceKey}:${Domain.slug(name)}`;
        settlement.id=reference?.settlement.id||settlement.id||stable; settlement.settlementId=stable;
        settlement.pinId=reference?.settlement.pinId||settlement.pinId||`pin:${stable}`; settlement.locationId=reference?.settlement.locationId||settlement.locationId||`location:${stable}`;
      }
      for (const territory of province.territories || []) {
        const settlement=(province.settlements||[]).find(s=>s.name===(territory.name||territory.territory)||s.id===territory.settlementId);
        if(settlement)territory.settlementId=settlement.settlementId;
      }
    }
  }
  async function loadPlacementReferences() {
    try {const response=await fetch('json/canonical_world.json',{cache:'no-store'});if(response.ok)placementReferences=(await response.json()).settlements||[];} catch (_) {placementReferences=[];}
  }
  function placementReferenceFor(settlement,terrain) {
    const key=Domain.terrainKey(terrain), candidates=placementReferences.filter(r=>Domain.terrainKey(r.primaryBiome||r.mappedBiomeAtPin||r.mappedBiomeOrDepth||r.manualWaterLandClass)===key);
    return candidates.sort((a,b)=>Math.hypot((a.x||0)-settlement.x,(a.y||0)-settlement.y)-Math.hypot((b.x||0)-settlement.x,(b.y||0)-settlement.y))[0]||null;
  }
  function deriveSettlement(settlement) {
    const terrain=sampleTerrain(settlement), derived=Domain.derivePlacement(settlement,terrain,raceCatalog()), reference=placementReferenceFor(settlement,terrain);
    const before={biomes:Domain.clone(settlement.biomes||[]),races:Domain.clone(settlement.races||[]),resources:Domain.clone(settlement.resourcesAndServicesProvided||[]),transportation:Domain.clone(settlement.transportation||[])};
    if(reference){
      settlement.biomes=Domain.clone(reference.biomes||reference.scannerBiomeTypes||derived.biomes).slice(0,3);settlement.biomeCache=Domain.clone(settlement.biomes);settlement.primaryBiome=settlement.biomes[0];settlement.mappedBiomeAtPin=settlement.primaryBiome;
      settlement.resourcesAndServicesProvided=Domain.clone(reference.resourcesAndServicesProvided||derived.resources);settlement.resources=Domain.clone(settlement.resourcesAndServicesProvided);
      settlement.races=Domain.clone(reference.races||derived.races);settlement.raceCommunities=Domain.clone(reference.raceCommunities||[]);settlement.raceCategories=Domain.clone(reference.raceCategories||[]);
      settlement.majorityPopulationRaces=Domain.clone(reference.majorityPopulationRaces||(settlement.races||[]).slice(0,2));settlement.creatorGodsOfMajorityRaces=Domain.clone(reference.creatorGodsOfMajorityRaces||[]);
      settlement.placementDerivedFrom={settlementId:reference.settlementId||reference.id||null,name:reference.name,terrainKey:derived.terrainKey,distancePixels:+Math.hypot((reference.x||0)-settlement.x,(reference.y||0)-settlement.y).toFixed(2)};
    }else Domain.applyPlacement(settlement,terrain,raceCatalog());
    settlement.publicTransit=Domain.clone(derived.transit);settlement.publicTransportation=Domain.clone(derived.transit);settlement.transportation=Domain.clone(derived.transit);
    settlement.manualWaterLandClass=['water','reef'].includes(derived.terrainKey)?'water':derived.terrainKey==='coast'?'coastal':'land';
    settlement.placementHistory=(settlement.placementHistory||[]).slice(-19);settlement.placementHistory.push({changedAt:new Date().toISOString(),before,after:{biomes:Domain.clone(settlement.biomes),races:Domain.clone(settlement.races),resources:Domain.clone(settlement.resourcesAndServicesProvided),transportation:Domain.clone(settlement.transportation)}});
    const ll = Domain.xyToLatLon(settlement);
    settlement.latitude = settlement.lat = +ll.latitude.toFixed(6);
    settlement.longitude = settlement.lon = +ll.longitude.toFixed(6);
    settlement.utc = settlement.timeZone = Domain.utcForLongitude(ll.longitude);
    return settlement;
  }
  function deriveAllSettlements() {
    for (const province of state.provinces) for (const settlement of province.settlements || []) {
      if (Number.isFinite(Number(settlement.x)) && Number.isFinite(Number(settlement.y))) deriveSettlement(settlement);
    }
    state.routes = Domain.rebuildRoutes(state.provinces);
    updateRouteStatus();
  }
  function updateRouteStatus() {
    const el = q('routeStatus'); if (el) el.textContent = `${state?.routes?.length || 0} live route links currently follow settlement placement.`;
  }
  function updatePlacementSummary() {
    const el=q('placementSummary');if(!el)return;const province=current?.(),settlement=province?.settlements?.[selectedSettlementIndex];
    if(!settlement){el.textContent='Select a settlement or territory to see its live placement result.';return;}
    const territory=(province.territories||[]).find(t=>(t.settlementId&&t.settlementId===settlement.id)||t.name===settlement.name||t.territory===settlement.name);
    el.innerHTML=territory?`<span class="territory-area-badge">Detached territory · 6 anchors</span><br>${escapeHtml(settlement.name)} · ${Number(territory.squareMiles).toLocaleString()} mi² / ${Number(territory.squareKilometers).toLocaleString()} km² · ${escapeHtml(settlement.primaryBiome||'biome pending')}`:
      `${escapeHtml(settlement.name)} · settlement of ${escapeHtml(province.name)} · ${escapeHtml(settlement.primaryBiome||'biome pending')} · ${(settlement.resourcesAndServicesProvided||[]).length} placement-derived resources`;
  }

  function normalizeTerritories() {
    Domain.normalizeTerritories(state.provinces);
    for (const province of state.provinces) for (const territory of province.territories || []) {
      const settlement = (province.settlements || []).find(s => (territory.settlementId && s.id === territory.settlementId) || s.name === territory.name || s.name === territory.territory);
      if (settlement) {settlement.scope = 'territory'; settlement.isTerritory = true; settlement.territoryAreaSquareMiles = territory.squareMiles; settlement.territoryAreaSquareKilometers = territory.squareKilometers;}
    }
  }
  function removeTerritoryEverywhere(settlement) {
    for (const province of state.provinces) Domain.removeSettlementTerritory(province, settlement);
  }
  function finishSettlementDrag(target) {
    const from = state.provinces[target.provinceIndex];
    const settlement = from?.settlements?.[target.settlementIndex];
    if (!from || !settlement) return;
    const owner = Domain.findProvinceAt(settlement, state.provinces);
    if (owner) {
      removeTerritoryEverywhere(settlement);
      Domain.moveSettlementBetweenProvinces(settlement, from, owner);
      const ll=Domain.xyToLatLon(settlement);settlement.lat=settlement.latitude=+ll.latitude.toFixed(6);settlement.lon=settlement.longitude=+ll.longitude.toFixed(6);settlement.timeZone=settlement.utc=Domain.utcForLongitude(ll.longitude);settlement.coordinateUpdateMode='dragged-inside-province-reassigned';
      selectedSettlementIndex = owner.settlements.indexOf(settlement);
    } else {
      settlement.scope = 'territory'; settlement.isTerritory = true; settlement.finalPlacementScope = 'detached-territory';
      settlement.claimStatus = 'Outside every province border; classified as detached territory';
      settlement.assignedProvince = from.name; settlement.province = from.name; settlement.provinceName = from.name;
      const territory = Domain.createOrUpdateTerritory(from, settlement, Math.max(12, Math.min(32, Math.sqrt(Number(settlement.squareMiles) || 324))));
      settlement.territoryAreaSquareMiles = territory.squareMiles;
      settlement.territoryAreaSquareKilometers = territory.squareKilometers;
      settlement.territoryAnchorCount = 6;
    }
    deriveSettlement(settlement);
    state.routes = Domain.rebuildRoutes(state.provinces);
    refreshSelect();selected=state.provinces.indexOf(owner||from);if(q('provinceSelect'))q('provinceSelect').value=String(selected);
    try { renderSettlementSelect(); updateStats(); drawMap(); } catch (_) {}
    updateRouteStatus(); updatePlacementSummary();
  }

  function patchDragging() {
    if (window.__belavadosFreeSettlementDragPatched) return;
    window.__belavadosFreeSettlementDragPatched = true;
    window.BelavadosEditorEnhancements={...(window.BelavadosEditorEnhancements||{}),finalizeDrag:finishSettlementDrag,normalizeTerritories,buildInteractiveMapZip};
    window.addEventListener('pointerup',()=>setTimeout(()=>{normalizeTerritories();try{updateStats();drawMap();}catch(_){}},0),true);
  }

  function applyStableIdsToSerialized(data) {
    for (const serializedProvince of data.provinces || []) {
      const liveProvince = (state.provinces || []).find(p => (p.name || p.province) === (serializedProvince.name || serializedProvince.province));
      if (!liveProvince) continue;
      (serializedProvince.settlements || []).forEach((settlement, index) => {
        const live = (liveProvince.settlements || []).find(s => (s.name || s.settlement) === (settlement.name || settlement.settlement)) || liveProvince.settlements?.[index];
        if (!live) return;
        settlement.id ||= live.id; settlement.settlementId = live.settlementId;
        settlement.pinId = live.pinId; settlement.locationId = live.locationId;
      });
      for (const territory of serializedProvince.territories || []) {
        const name = territory.name || territory.territory;
        const live = (liveProvince.settlements || []).find(s => (s.name || s.settlement) === name || s.settlementId === territory.settlementId);
        if (live) territory.settlementId = live.settlementId;
      }
    }
    return data;
  }

  function completeSerializedData() {
    const canonical = Domain.clone(window.BELAVADOS_DM_MAP_DATA || {});
    const legacy = (window.serialize || serialize)();
    const canonicalProvinces = canonical.provinces || [];
    const canonicalSettlements = canonicalProvinces.flatMap(p => (p.settlements || []).map(s => ({province: p, settlement: s})));
    const provinces = (state.provinces || []).map(liveProvince => {
      const provinceName = liveProvince.name || liveProvince.province;
      const baseProvince = canonicalProvinces.find(p => (p.name || p.province) === provinceName) || {};
      const live = Domain.clone(liveProvince);
      live.settlements = (liveProvince.settlements || []).map(settlement => {
        const name = settlement.name || settlement.settlement;
        const stable = settlement.settlementId || settlement.id;
        const base = canonicalSettlements.find(item =>
          (stable && [item.settlement.settlementId, item.settlement.id].includes(stable)) ||
          ((item.settlement.name || item.settlement.settlement) === name))?.settlement || {};
        return {...Domain.clone(base), ...Domain.clone(settlement)};
      });
      return {...Domain.clone(baseProvince), ...live};
    });
    return {...canonical, ...legacy, provinces};
  }

  function fullData() {
    ensureStableIds(); normalizeTerritories();state.routes=Domain.rebuildRoutes(state.provinces);
    const data = applyStableIdsToSerialized(completeSerializedData());
    data.routes = Domain.clone(state.routes || []);
    data.backendSaveSchema = 'belavados-github-map-editor-v1';
    data.visibilityDefaults = {allLayersHiddenOnOpen: false, editableLayersVisibleOnOpen: true, provinceEditorModeDefault: true};
    data.territoryRules = {anchorsPerTerritory: 6, areaFollowsAnchorPolygon: true};
    return data;
  }
  function dataBundle() {
    const dm = fullData(), world = Domain.buildViewerWorld(dm), geo = Domain.buildGeoJSON(dm.provinces);
    return {dm, world, geo, routes: {schema: 'belavados-live-routes-v1', generatedAt: new Date().toISOString(), routes: dm.routes}};
  }
  async function saveBackend(snapshot) {
    const filename = (q('backendFilename')?.value || 'dm_map.json').replace(/[^A-Za-z0-9._-]/g, '_');
    const bundle = dataBundle();
    setStatus(snapshot ? 'Uploading a complete timestamped map snapshot…' : 'Uploading the complete editable map to the fixed backend…');
    try {
      const result = await backend.save(filename, bundle.dm, {snapshot, createSnapshot: snapshot});
      try {localStorage.setItem('BelavadosMapDM_Autosave_Metadata', JSON.stringify({filename, savedAt:new Date().toISOString(), backend:backend.mode, backendFileId:result.file?.fileId || ''}));} catch (_) {}
      setLastSaveLink(result); await refreshRegistry();
      setStatus(`Saved the complete editable map as ${result.uploadName || filename} through the ${backend.mode} backend.`, 'ok');
    } catch (error) { setStatus(error.message, 'error'); renderAuthState(); }
  }

  async function refreshRegistry() {
    setStatus('Scanning DMEditor/json and signed-in backend copies…');
    try {
      const result = await backend.manifest(); registry = result.files || [];
      for (const [name, item] of pendingFiles) if (!registry.some(x => (x.name || x.path) === name)) registry.push({name, source: 'uploaded-session', file: item});
      const select = q('jsonRegistry');
      select.innerHTML = registry.map((item, i) => `<option value="${i}">${escapeHtml(item.name || item.path)} — ${escapeHtml(item.source || 'json folder')}</option>`).join('');
      setStatus(`${registry.length} JSON/GeoJSON files recognized. Adding a file anywhere under DMEditor/json and pushing to GitHub updates this list automatically.`, 'ok');
    } catch (error) { setStatus(error.message, 'error'); }
  }
  function applyLoadedData(data, name) {
    if (Array.isArray(data?.provinces)) {
      applyBordersData(data);
      const byName = new Map(data.provinces.map(p => [p.name || p.province, p]));
      for (const province of state.provinces) {
        const source = byName.get(province.name); if (!source) continue;
        province.territories = Domain.clone(source.territories || []);
        province.settlements = (source.settlements || []).map(s => normalizeSettlement(Domain.clone(s)));
      }
      state.routes = Domain.clone(data.routes || []);
      if (data.naturalSystems) state.naturalSystems = Domain.clone(data.naturalSystems);
      ensureStableIds();normalizeTerritories();state.routes=Domain.rebuildRoutes(state.provinces);refreshSelect();setEditableDefaults();
      setStatus(`${name} loaded as complete editable map data.`, 'ok'); return;
    }
    state.externalJsonRegistry ||= {}; state.externalJsonRegistry[name] = Domain.clone(data);
    setStatus(`${name} recognized and stored with the editor. It did not contain a provinces array, so existing map geometry was not overwritten.`, 'ok');
  }
  async function loadSelectedRegistry() {
    const item = registry[Number(q('jsonRegistry')?.value)]; if (!item) return;
    const name = item.name || item.path;
    try {
      let data;
      if (item.backendOnly || item.source === 'apps-script-drive') {
        if (item.driveUrl) window.open(item.driveUrl, '_blank', 'noopener');
        setStatus('Backend copies are private Drive backups. Download the opened copy, then use Import Full dm_map.json.', 'ok');
        return;
      }
      if (item.file) data = JSON.parse(await item.file.text());
      else if (item.downloadUrl) {const response=await fetch(item.downloadUrl,{cache:'no-store'});if(!response.ok)throw new Error(`GitHub returned ${response.status}`);data=await response.json();}
      else if (/DMEditor\/json index/i.test(item.source || '')) { const response = await fetch(`json/${name.replace(/^json\//, '')}`, {cache: 'no-store'}); if(!response.ok)throw new Error(`DMEditor/json returned ${response.status}`); data = await response.json(); }
      else data = (await backend.read(name)).data;
      applyLoadedData(data, name);
    } catch (error) { setStatus(`Could not load ${name}: ${error.message}`, 'error'); }
  }
  async function ingestFiles(fileList) {
    for (const file of [...(fileList || [])]) {
      if (/\.(json|geojson)$/i.test(file.name)) pendingFiles.set(file.name, file);
      else if (/\.zip$/i.test(file.name) && window.JSZip) {
        const zip = await JSZip.loadAsync(file); for (const [name, entry] of Object.entries(zip.files)) if (!entry.dir && /\.(json|geojson)$/i.test(name)) {
          const blob = new Blob([await entry.async('uint8array')], {type: 'application/json'});
          pendingFiles.set(name.split('/').pop(), new File([blob], name.split('/').pop(), {type: 'application/json'}));
        }
      }
    }
    await refreshRegistry();
  }

  function installRestoredFileTools() {
    const worldInput=q('worldMapFile'), worldButton=q('uploadWorldMap');
    if (worldButton && worldInput) {
      worldButton.onclick=()=>worldInput.click();
      worldInput.onchange=()=>{
        const file=worldInput.files?.[0]; if(!file)return;
        const reader=new FileReader();
        reader.onerror=()=>setStatus('Could not read the selected world map image.', 'error');
        reader.onload=()=>{
          customWorldMapDataUrl=String(reader.result||'');
          flatImg.onload=()=>{
            try {flatCanvas=document.createElement('canvas');flatCanvas.width=MAP_W;flatCanvas.height=MAP_H;flatCtx=flatCanvas.getContext('2d',{willReadFrequently:true});flatCtx.drawImage(flatImg,0,0,MAP_W,MAP_H);flatPixels=flatCtx.getImageData(0,0,MAP_W,MAP_H).data;} catch (_) {}
            drawMap(); try{localStorage.setItem('BelavadosMapDM_Autosave',JSON.stringify(fullData()));}catch(_){}
            setStatus(`World map replaced for this editor state with ${file.name}. Export dm_map.json or Updated index.html to preserve it.`, 'ok');
          };
          flatImg.src=customWorldMapDataUrl;
        };
        reader.readAsDataURL(file); worldInput.value='';
      };
    }
    const exportButton=q('exportEditorHtml');
    if(exportButton) exportButton.onclick=exportUpdatedIndexHtml;
  }
  async function exportUpdatedIndexHtml() {
    setStatus('Building an updated root index.html with the complete current editor state…');
    try {
      const response=await fetch('index.html',{cache:'no-store'}); if(!response.ok)throw new Error(`index.html returned ${response.status}`);
      let html=await response.text(); const marker='window.BELAVADOS_DM_MAP_DATA=', start=html.indexOf(marker);
      if(start<0)throw new Error('Embedded map-data marker was not found in index.html.');
      const end=html.indexOf('</script>', start); if(end<0)throw new Error('Embedded map-data script ending was not found.');
      const replacement=`window.BELAVADOS_DM_MAP_DATA=${JSON.stringify(fullData())};\n`;
      html=html.slice(0,start)+replacement+html.slice(end);
      const exportBytes=new Blob([html],{type:'text/html;charset=utf-8'}).size;
      if(exportBytes>24000*1024) throw new Error(`Updated index.html would be ${(exportBytes/1048576).toFixed(2)} MiB, above the 24,000 KiB package limit. Export dm_map.json instead and keep the existing index.html.`);
      download('index.html',html,'text/html;charset=utf-8');
      setStatus('Updated index.html exported. Replace DMEditor/index.html with it when committing the edited state to GitHub.', 'ok');
    } catch(error){setStatus(error.message,'error');}
  }

  async function fetchAsset(path) {
    const response = await fetch(path, {cache: 'no-store'});
    if (!response.ok) throw new Error(`Export asset missing: ${path}`);
    if (!/\.(?:png|jpe?g|gif|webp|ico|zip)$/i.test(path)) return {content: await response.text()};
    const bytes = new Uint8Array(await response.arrayBuffer());
    const chunks = [];
    for (let offset = 0; offset < bytes.length; offset += 0x8000) chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
    return {content: chunks.join(''), options: {binary: true}};
  }
  async function buildInteractiveMapZip() {
    if (!window.JSZip) throw new Error('ZIP library did not load; reload through GitHub Pages or npm start.');
    const bundle = dataBundle(), zip = new JSZip(), root = zip.folder('Belavados_Interactive_World_Map');
    const [assetsResponse, templateResponse] = await Promise.all([
      fetch('data/export-file-list.json', {cache: 'no-store'}),
      fetch('data/world_map_template.txt', {cache: 'no-store'})
    ]);
    if (!assetsResponse.ok) throw new Error('Could not load the world-map export manifest.');
    if (!templateResponse.ok) throw new Error('Could not load the one-HTML world-map template.');
    const assets = await assetsResponse.json(), template = await templateResponse.text();
    const fetchedAssets = await Promise.all(assets.files.map(async path => [path, await fetchAsset(path)]));
    for (const [path, asset] of fetchedAssets) root.file(path, asset.content, asset.options);
    root.file('index.html', template);
    root.file('json/dm_map.json', JSON.stringify(bundle.dm, null, 2));
    root.file('json/canonical_world.json', JSON.stringify(bundle.world, null, 2));
    root.file('json/routes.json', JSON.stringify(bundle.routes, null, 2));
    root.file('geojson/clickable_provinces_and_settlement_pins.geojson', JSON.stringify(bundle.geo));
    root.file('geojson/province_borders.geojson', JSON.stringify({type:'FeatureCollection',features:bundle.geo.features.filter(f=>f.properties.featureKind==='province-border')}));
    root.file('geojson/territory_borders.geojson', JSON.stringify({type:'FeatureCollection',features:bundle.geo.features.filter(f=>f.properties.featureKind==='territory-border')}));
    root.file('geojson/province_centers.geojson', JSON.stringify({type:'FeatureCollection',features:bundle.geo.features.filter(f=>f.properties.featureKind==='province-center-pin')}));
    root.file('geojson/settlement_and_territory_pins.geojson', JSON.stringify({type:'FeatureCollection',features:bundle.geo.features.filter(f=>/pin$/.test(f.properties.featureKind))}));
    root.file('js/canonical_world_data.js', `window.BELAVADOS_WORLD_DATA=${JSON.stringify(bundle.world)};`);
    root.file('js/clickable_geojson_data.js', `window.BELAVADOS_CLICKABLE_GEOJSON=${JSON.stringify(bundle.geo)};`);
    root.file('js/natural_systems_data.js', `window.BELAVADOS_NATURAL_SYSTEMS=${JSON.stringify({type:'FeatureCollection',features:bundle.dm.naturalSystems || []})};`);
    root.file('README.txt', 'Open index.html. This exported viewer contains exactly one HTML file and the complete current map update.');
    const bytes = await zip.generateAsync({type:'uint8array', streamFiles:true, compression:'DEFLATE', compressionOptions:{level:3}});
    return {bytes, bundle};
  }

  async function exportInteractiveMap() {
    const button = q('exportInteractiveMap'); button.disabled = true;
    setStatus('Building the corrected interactive world-map package with the complete current update…');
    try {
      const {bytes} = await buildInteractiveMapZip();
      const blob = new Blob([bytes], {type:'application/zip'});
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `Belavados_Interactive_World_Map_${new Date().toISOString().slice(0,10)}.zip`;
      document.body.append(a); a.click(); setTimeout(() => {URL.revokeObjectURL(a.href); a.remove();}, 1000);
      setStatus('Interactive world-map ZIP exported with complete current editor state.', 'ok');
    } catch (error) {setStatus(error.message, 'error');}
    finally {button.disabled = false;}
  }

  async function init() {
    if (!editorReady()) {setTimeout(init, 100); return;}
    createBackendPanel(); addVisibilityMasters(); installRestoredFileTools();
    config = await Backend.loadConfig(); backend = new Backend.BackendClient(config); await backend.detect(); renderAuthState();
    await loadPlacementReferences();ensureStableIds();patchDragging();normalizeTerritories();state.routes=Domain.rebuildRoutes(state.provinces);updateRouteStatus();setEditableDefaults();
    q('settlementSelect')?.addEventListener('change',()=>setTimeout(updatePlacementSummary,0));
    const originalStats=window.updateStats||updateStats;window.updateStats=updateStats=function(){const value=originalStats.apply(this,arguments);updatePlacementSummary();return value;};
    await refreshRegistry();
    setStatus(`${backend.mode === 'local' ? 'Local filesystem' : 'Fixed Google Apps Script'} mode ready. ${registry.length} JSON files recognized under DMEditor/json${backend.authenticated ? '; backend saves enabled' : '; sign in to enable backend saves'}.`, 'ok');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
