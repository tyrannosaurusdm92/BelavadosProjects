(function(global){
  'use strict';

  const WF = global.WorldForge;
  const state = { rawFiles:[], files:[], world:null, engine:null, busy:false };
  const decoder = new TextDecoder('utf-8');

  const els = {};
  document.addEventListener('DOMContentLoaded', init);

  function init(){
    for(const id of ['dropzone','fileInput','folderInput','processBtn','exportBtn','sampleBtn','backendPingBtn','catalogSummary','catalogList','log','modelStats','modelPreview','conflictLog','worldName','budgetSelect','conflictRule','preserveFolders','includeOriginals','backendSync','primaryBackend','backupBackend','primaryLibrary','backupLibrary','progressCard','progressText','progressBar','provinceSelect','settlementSelect','layerToggles','inspectCard','recenterBtn','crossSectionBtn','pauseBtn']) els[id] = document.getElementById(id);
    els.primaryBackend.value = WF.BackendSync.DEFAULTS.primary;
    els.backupBackend.value = WF.BackendSync.DEFAULTS.backup;
    els.primaryLibrary.value = WF.BackendSync.DEFAULTS.primaryLibrary;
    els.backupLibrary.value = WF.BackendSync.DEFAULTS.backupLibrary;

    state.engine = new WF.GlobeEngine({
      canvas:document.getElementById('globeCanvas'), overlay:document.getElementById('overlayCanvas'), inspectCard:els.inspectCard,
      provinceSelect:els.provinceSelect, settlementSelect:els.settlementSelect, layerToggles:els.layerToggles, log
    });

    installUploadEvents();
    els.processBtn.addEventListener('click', processCurrentFiles);
    els.sampleBtn.addEventListener('click', loadDemo);
    els.exportBtn.addEventListener('click', exportCurrentWorld);
    els.backendPingBtn.addEventListener('click', testBackend);
    els.recenterBtn.addEventListener('click', () => state.engine.recenter());
    els.crossSectionBtn.addEventListener('click', () => { const on = state.engine.toggleCrossSection(); els.crossSectionBtn.textContent = on ? 'Hide Shell Cutaway' : 'Shell Cross Section'; });
    els.pauseBtn.addEventListener('click', () => { const paused = state.engine.togglePause(); els.pauseBtn.textContent = paused ? 'Resume Time' : 'Pause Time'; });

    log('Ready. Drop files/folders, or load the demo to test the renderer.');
    WF.Exporter.prepareEngineSource && WF.Exporter.prepareEngineSource();
  }

  function installUploadEvents(){
    els.fileInput.addEventListener('change', e => addFileList(e.target.files));
    els.folderInput.addEventListener('change', e => addFileList(e.target.files));
    ['dragenter','dragover'].forEach(evt => els.dropzone.addEventListener(evt, e => { e.preventDefault(); els.dropzone.classList.add('dragover'); }));
    ['dragleave','drop'].forEach(evt => els.dropzone.addEventListener(evt, e => { e.preventDefault(); els.dropzone.classList.remove('dragover'); }));
    els.dropzone.addEventListener('drop', async e => {
      const items = Array.from(e.dataTransfer.items || []);
      if(items.length && items.some(it => it.webkitGetAsEntry)){
        const files = [];
        for(const item of items){
          const entry = item.webkitGetAsEntry && item.webkitGetAsEntry();
          if(entry) await readEntry(entry, '', files);
        }
        addFileList(files);
      } else addFileList(e.dataTransfer.files);
    });
  }

  async function readEntry(entry, parent, files){
    if(entry.isFile){
      const file = await new Promise((res,rej)=>entry.file(res,rej));
      Object.defineProperty(file, 'webkitRelativePath', { value: parent + file.name });
      files.push(file);
    } else if(entry.isDirectory){
      const reader = entry.createReader();
      let batch;
      do{
        batch = await new Promise((res,rej)=>reader.readEntries(res,rej));
        for(const child of batch) await readEntry(child, parent + entry.name + '/', files);
      }while(batch.length);
    }
  }

  function addFileList(fileList){
    const files = Array.from(fileList || []);
    for(const f of files){
      const path = f.webkitRelativePath || f.name;
      if(!state.rawFiles.some(x => (x.webkitRelativePath || x.name) === path && x.size === f.size)) state.rawFiles.push(f);
    }
    log(`Added ${files.length} file(s). Total queued: ${state.rawFiles.length}.`);
    renderQueuedCatalog();
  }

  async function processCurrentFiles(){
    if(state.busy) return;
    state.busy = true;
    els.processBtn.disabled = true; els.exportBtn.disabled = true;
    try{
      progress('Reading uploaded files…', 3);
      state.files = [];
      let count=0;
      for(const file of state.rawFiles){
        count++;
        await ingestBrowserFile(file, '', state.files, { depth:0 });
        progress(`Reading files… ${count}/${state.rawFiles.length}`, 3 + (count/state.rawFiles.length)*35);
        await yieldThread();
      }
      progress('Classifying files…', 43);
      for(let i=0;i<state.files.length;i++){
        await enrichFile(state.files[i]);
        state.files[i].classification = WF.Classifier.classifyFile(state.files[i]);
        if(i % 20 === 0) { progress(`Classifying files… ${i+1}/${state.files.length}`, 43 + (i/state.files.length)*20); await yieldThread(); }
      }
      renderCatalog();
      progress('Assembling world model…', 68);
      const options = gatherOptions();
      state.world = WF.WorldModel.assemble(state.files, options);
      state.world.backend = backendConfig();
      progress('Rendering globe…', 82);
      state.engine.setWorld(state.world);
      renderWorldSummary();
      progress('Preparing export system…', 90);
      await WF.Exporter.prepareEngineSource();
      if(els.backendSync.checked){
        progress('Trying backend manifest sync…', 94);
        const result = await WF.BackendSync.postManifest(miniManifest(state.world), backendConfig(), log);
        state.world.backend.lastSync = { at:new Date().toISOString(), result:{ ok:result.ok, endpoint:result.endpoint, status:result.status } };
      }
      progress('Complete.', 100);
      setTimeout(hideProgress, 900);
      els.exportBtn.disabled = false;
      log(`Build complete: ${Object.entries(state.world.stats).map(([k,v])=>`${k}=${v}`).join(', ')}`);
    }catch(err){
      console.error(err); log('ERROR: ' + (err.stack || err.message || err)); progress('Build failed. See log.', 100);
    }finally{
      state.busy = false; els.processBtn.disabled = false;
    }
  }

  async function ingestBrowserFile(file, parentPath, out, meta){
    const path = (file.webkitRelativePath || join(parentPath, file.name)).replace(/^\/+/, '');
    const ext = extOf(path);
    const arrayBuffer = await file.arrayBuffer();
    const base = { name:file.name, path, ext, size:file.size, modified:file.lastModified || Date.now(), arrayBuffer, originalFile:file };
    if(ext === 'zip'){
      log('Unpacking ZIP: ' + path);
      try{
        const entries = await WF.ZipReader.read(arrayBuffer, path.replace(/\.zip$/i,''));
        for(const e of entries){
          if(e.unsupported){ out.push(Object.assign(e, { ext:extOf(e.path), modified:file.lastModified || Date.now(), parentZip:path })); continue; }
          const virtual = Object.assign({}, e, { ext:extOf(e.path), modified:file.lastModified || Date.now(), parentZip:path });
          if(virtual.ext === 'zip' && (meta.depth || 0) < 2){
            const fake = new File([virtual.arrayBuffer], virtual.name, { lastModified:virtual.modified });
            Object.defineProperty(fake, 'webkitRelativePath', { value: virtual.path });
            await ingestBrowserFile(fake, '', out, { depth:(meta.depth||0)+1 });
          } else out.push(virtual);
        }
      }catch(err){
        base.unsupported = true; base.error = err.message; out.push(base); log('ZIP failed: ' + path + ' — ' + err.message);
      }
    } else out.push(base);
  }

  async function enrichFile(file){
    const ext = file.ext;
    if(file.unsupported) return;
    if(['txt','md','csv','tsv','html','htm','css','js','mjs','xml','svg','json','geojson'].includes(ext)){
      try{ file.text = decoder.decode(file.arrayBuffer); }catch(_){ file.text = ''; }
    }
    if(ext === 'json' || ext === 'geojson'){
      try{ file.json = JSON.parse(file.text || decoder.decode(file.arrayBuffer)); if(file.json?.type === 'FeatureCollection' || file.json?.type === 'Feature' || file.json?.geometry) file.geojson = file.json; }catch(err){ file.parseError = err.message; }
    }
    if(ext === 'docx'){
      try{
        const doc = await WF.DocxReader.readDocx(file.arrayBuffer, file.path);
        file.docxText = doc.text; file.docxProps = doc.props;
      }catch(err){ file.parseError = 'DOCX read failed: ' + err.message; }
    }
    if(['png','jpg','jpeg','webp','gif','bmp'].includes(ext)){
      file.image = true;
      try{ file.objectUrl = URL.createObjectURL(new Blob([file.arrayBuffer], { type:mime(ext) })); await imageSize(file.objectUrl).then(sz => { file.width=sz.width; file.height=sz.height; }); }catch(_){ /* still usable as asset */ }
    }
    if(ext === 'svg'){
      file.image = true;
      try{ file.objectUrl = URL.createObjectURL(new Blob([file.arrayBuffer], { type:'image/svg+xml' })); }catch(_){ }
    }
  }

  function loadDemo(){
    state.files = [];
    state.rawFiles = [];
    const options = gatherOptions();
    options.worldName = els.worldName.value || 'WorldForge Demo World';
    state.world = WF.WorldModel.assemble([], options);
    state.world.backend = backendConfig();
    state.engine.setWorld(state.world);
    renderWorldSummary();
    renderCatalog();
    els.exportBtn.disabled = false;
    log('Loaded demo world with provinces, settlements, routes, atmosphere, shell layers, terrain markers, weather, and celestial markers.');
  }

  async function exportCurrentWorld(){
    if(!state.world) return;
    els.exportBtn.disabled = true;
    try{
      progress('Building export ZIP…', 30);
      await WF.Exporter.prepareEngineSource();
      const result = await WF.Exporter.exportPackage(state.world, state.files, { includeOriginals:els.includeOriginals.checked });
      progress('Downloading export ZIP…', 95);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(result.blob);
      a.download = result.filename;
      document.body.appendChild(a); a.click(); a.remove();
      log('Exported package: ' + result.filename + ' (' + formatBytes(result.blob.size) + ').');
      progress('Export complete.', 100); setTimeout(hideProgress, 900);
    }catch(err){ log('Export failed: ' + (err.stack || err.message || err)); }
    finally{ els.exportBtn.disabled = false; }
  }

  async function testBackend(){
    log('Testing backend endpoints…');
    const res = await WF.BackendSync.ping(backendConfig(), log);
    if(res.ok) log(`Backend OK via ${res.endpoint}.`); else log('Both backend endpoints failed or were blocked; app will continue offline.');
  }

  function gatherOptions(){ return { worldName:els.worldName.value.trim(), budgetSeconds:Number(els.budgetSelect.value||180), conflictRule:els.conflictRule.value, preserveFolders:els.preserveFolders.checked }; }
  function backendConfig(){ return { primary:els.primaryBackend.value.trim(), backup:els.backupBackend.value.trim(), primaryLibrary:els.primaryLibrary.value.trim(), backupLibrary:els.backupLibrary.value.trim() }; }
  function miniManifest(world){ return { schema:world.schema, metadata:world.metadata, stats:world.stats, generatedAt:new Date().toISOString(), sourceCount:world.sources.length, decisions:(world.decisions||[]).slice(-30), conflicts:(world.conflicts||[]).slice(0,50) }; }

  function renderQueuedCatalog(){
    const counts = { queued:state.rawFiles.length };
    els.catalogSummary.innerHTML = Object.entries(counts).map(([k,v])=>`<div><strong>${v}</strong><br>${escapeHtml(k)}</div>`).join('');
    els.catalogList.innerHTML = state.rawFiles.slice(0,240).map(f => `<div class="catalog-item"><strong>${escapeHtml(f.webkitRelativePath || f.name)}</strong><span>${formatBytes(f.size)} · queued</span></div>`).join('');
  }

  function renderCatalog(){
    const counts = WF.Classifier.summarize(state.files || []);
    els.catalogSummary.innerHTML = Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div><strong>${v}</strong><br>${escapeHtml(k)}</div>`).join('') || '<div><strong>0</strong><br>files</div>';
    els.catalogList.innerHTML = (state.files || []).slice(0,500).map(f => `<div class="catalog-item"><strong>${escapeHtml(f.path)}</strong><span>${formatBytes(f.size||0)} · ${escapeHtml(f.classification?.primary || 'queued')} · ${(f.classification?.confidence||0).toFixed(2)}</span></div>`).join('');
  }

  function renderWorldSummary(){
    const w = state.world;
    if(!w) return;
    els.modelStats.innerHTML = Object.entries(w.stats || {}).map(([k,v])=>`<div><strong>${Number(v).toLocaleString()}</strong><br>${escapeHtml(k)}</div>`).join('');
    const preview = JSON.parse(JSON.stringify(w));
    if(preview.canon){ for(const k of Object.keys(preview.canon)){ if(Array.isArray(preview.canon[k])) preview.canon[k] = preview.canon[k].slice(0,2); } }
    for(const key of Object.keys(preview.features||{})){ if(Array.isArray(preview.features[key])) preview.features[key] = preview.features[key].slice(0,5); }
    els.modelPreview.textContent = JSON.stringify(preview, null, 2).slice(0, 30000);
    els.conflictLog.textContent = JSON.stringify(w.conflicts || [], null, 2);
  }

  function progress(text, pct){ els.progressCard.classList.remove('hidden'); els.progressText.textContent = text; els.progressBar.style.width = Math.max(0,Math.min(100,pct)) + '%'; }
  function hideProgress(){ els.progressCard.classList.add('hidden'); }
  function log(msg){ const line = `[${new Date().toLocaleTimeString()}] ${msg}`; els.log.textContent += line + '\n'; els.log.scrollTop = els.log.scrollHeight; }
  function yieldThread(){ return new Promise(res => setTimeout(res, 0)); }
  function extOf(path){ const m=String(path).toLowerCase().match(/\.([a-z0-9]+)$/); return m ? m[1] : ''; }
  function join(a,b){ return a ? a.replace(/\/$/,'') + '/' + b : b; }
  function mime(ext){ return ({png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',gif:'image/gif',bmp:'image/bmp'}[ext] || 'application/octet-stream'); }
  function imageSize(url){ return new Promise((res,rej)=>{ const img=new Image(); img.onload=()=>res({width:img.naturalWidth,height:img.naturalHeight}); img.onerror=rej; img.src=url; }); }
  function formatBytes(n){ if(!Number.isFinite(n)) return ''; const u=['B','KB','MB','GB']; let i=0; while(n>=1024&&i<u.length-1){n/=1024;i++;} return `${n.toFixed(i?1:0)} ${u[i]}`; }
  function escapeHtml(s){ return String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

})(window);
