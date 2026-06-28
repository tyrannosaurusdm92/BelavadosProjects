/* Belavadös Character Studio — Apps Script Backend Bridge + Mobile/PWA Runtime */
(function(){
  'use strict';

  const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec';
  const DEPLOYMENT_ID = 'AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g';
  const PROFILE_ID = 'belavados-character-studio';
  const LS_SHARED = 'belavados.backend.sharedState.latest';
  const LS_CONFIG = 'belavados.backend.config';
  const AUTOSAVE_DELAY = 2400;

  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const safeId = value => String(value || 'item-' + Date.now()).trim().toLowerCase().replace(/['"]/g,'').replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,80) || ('item-' + Date.now());

  const state = {
    online: false,
    busy: false,
    lastSavedAt: '',
    lastLoadedAt: '',
    autosaveTimer: null,
    installPrompt: null,
    backendAssets: [],
    savingBlockedUntil: 0,
    lastHealth: null
  };

  window.BELAVADOS_BACKEND = Object.freeze({
    url: BACKEND_URL,
    deploymentId: DEPLOYMENT_ID,
    profileId: PROFILE_ID,
    manifestUrl: 'manifest.webmanifest',
    launcherUrl: BACKEND_URL + '?action=launcher',
    iconUrl: BACKEND_URL + '?action=icon&size=512'
  });

  function nowIso(){ return new Date().toISOString(); }
  function setStatus(message, kind){
    const el = $('belBackendStatus');
    if(el){
      el.dataset.kind = kind || 'info';
      el.innerHTML = esc(message).replace(/\n/g,'<br>');
    }
    const voiceStatus = $('voiceStatus');
    if(voiceStatus && /saved|loaded|backend|upload|offline|error/i.test(message)){
      voiceStatus.textContent = message;
    }
  }
  function setBusy(flag){
    state.busy = !!flag;
    $$('#belBackendPanel button').forEach(btn => { if(btn.id !== 'belBackendToggle') btn.disabled = state.busy; });
  }

  async function backend(action, data){
    const body = new URLSearchParams();
    body.set('action', action);
    body.set('profileId', PROFILE_ID);
    Object.entries(data || {}).forEach(([key, value]) => {
      if(value === undefined || value === null) return;
      body.set(key, typeof value === 'string' ? value : JSON.stringify(value));
    });
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      body,
      redirect: 'follow',
      cache: 'no-store'
    });
    const text = await response.text();
    let json;
    try { json = JSON.parse(text); }
    catch(err){ throw new Error('Backend returned non-JSON text: ' + text.slice(0, 220)); }
    if(!response.ok || json.ok === false){ throw new Error(json.error || ('Backend request failed: ' + action)); }
    return json;
  }

  function getJsonFromTextarea(id){
    const el = $(id);
    if(!el || !el.value) return null;
    try { return JSON.parse(el.value); } catch { return null; }
  }

  function currentCharacterName(){
    return $('characterName')?.value?.trim()
      || $('voiceName')?.value?.trim()
      || getJsonFromTextarea('characterExport')?.identity?.name
      || getJsonFromTextarea('voiceExport')?.name
      || 'Belavados Character';
  }

  function collectGeneratorFallback(){
    const stats = {};
    ['STR','DEX','CON','INT','WIS','CHA'].forEach(stat => { stats[stat] = ''; });
    return {
      schema: 'belavados.character.partial.backendFallback',
      identity: {
        name: $('characterName')?.value || '',
        playerName: $('playerName')?.value || '',
        pronouns: $('pronouns')?.value || '',
        genderIdentity: $('genderIdentity')?.value || ''
      },
      lineage: {
        raceCategory: $('raceCategory')?.value || '',
        race1: $('raceSelect')?.value || '',
        race2Enabled: $('race2Enabled')?.value === 'yes',
        race2: $('race2Select')?.value || '',
        biomeCategory: $('biomeCategory')?.value || '',
        originBiome: $('biomeSelect')?.value || ''
      },
      classBuild: {
        primaryClass: $('primaryClass')?.value || '',
        primarySubclass: $('primarySubclass')?.value || '',
        primaryLevel: Number($('primaryLevel')?.value || 1),
        multiclass: $('multiEnabled')?.value === 'yes',
        secondaryClass: $('secondaryClass')?.value || '',
        secondarySubclass: $('secondarySubclass')?.value || '',
        secondaryLevel: Number($('secondaryLevel')?.value || 0)
      },
      background: $('backgroundSelect')?.value || '',
      stats
    };
  }

  function collectVoiceFallback(){
    return {
      schema: 'belavados.voiceProfile.backendFallback',
      name: $('voiceName')?.value || currentCharacterName(),
      race: $('voiceRace')?.value || $('raceSelect')?.value || '',
      biome: $('voiceBiome')?.value || $('biomeSelect')?.value || '',
      className: $('voiceClass')?.value || $('primaryClass')?.value || '',
      subclass: $('voiceSubclass')?.value || $('primarySubclass')?.value || '',
      genderIdentity: $('voiceGender')?.value || $('genderIdentity')?.value || '',
      alignment: $('voiceAlignment')?.value || $('generatorAlignmentName')?.value || '',
      exactSpeechText: $('voiceLabText')?.value || $('previewText')?.value || '',
      selectedAudio: { path: $('voiceAssetUrl')?.value || '' },
      emotion: { key: $('voiceLabEmotion')?.value || 'neutral', intensity: Number($('voiceLabEmotionIntensity')?.value || 65) },
      notes: $('voiceNotes')?.value || ''
    };
  }

  function collectSitePayload(source){
    let full = null;
    try {
      if(typeof window.collectAllSiteData === 'function') full = window.collectAllSiteData();
    } catch(err) {
      console.warn('collectAllSiteData failed; using backend fallback.', err);
    }
    if(!full || typeof full !== 'object'){
      full = {
        schema: 'belavados.fullSitePayload.backendFallback',
        generator: (typeof window.makeCharacter === 'function' ? window.makeCharacter() : collectGeneratorFallback()),
        voice: (typeof window.makeVoiceExport === 'function' ? window.makeVoiceExport('backend-fallback') : collectVoiceFallback()),
        exactSpeech: $('voiceLabText')?.value || $('previewText')?.value || ''
      };
    }
    full.schema = full.schema || 'belavados.fullSitePayload';
    full.backend = {
      source: source || 'manual',
      backendUrl: BACKEND_URL,
      deploymentId: DEPLOYMENT_ID,
      profileId: PROFILE_ID,
      collectedAt: nowIso()
    };
    full.generator = full.generator || collectGeneratorFallback();
    full.voice = full.voice || collectVoiceFallback();
    full.exactSpeech = full.exactSpeech || full.voice?.exactSpeechText || $('voiceLabText')?.value || $('previewText')?.value || '';
    return full;
  }

  function setValue(id, value, eventType){
    const el = $(id);
    if(!el || value === undefined || value === null) return false;
    const str = String(value);
    if(el.tagName === 'SELECT'){
      let option = Array.from(el.options || []).find(opt => opt.value === str || opt.textContent === str);
      if(!option && str){
        option = document.createElement('option');
        option.value = str;
        option.textContent = str;
        el.appendChild(option);
      }
      el.value = str;
    } else if(el.type === 'checkbox') {
      el.checked = !!value;
    } else {
      el.value = str;
    }
    el.dispatchEvent(new Event(eventType || 'input', { bubbles: true }));
    if(eventType !== 'change') el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function applyVoicePayload(voice){
    if(!voice || typeof voice !== 'object') return;
    setValue('voiceName', voice.name || voice.characterName || '');
    setValue('voiceGender', voice.genderIdentity || voice.gender || '', 'change');
    setValue('voiceRace', voice.race || voice.species || '', 'change');
    setValue('voiceBiome', voice.biome || '', 'change');
    setValue('voiceClass', voice.className || voice.class || '', 'change');
    setValue('voiceSubclass', voice.subclass || '', 'change');
    setValue('voiceAlignment', voice.alignment || '', 'change');
    setValue('voiceNotes', voice.notes || '');
    setValue('voiceLabText', voice.exactSpeechText || voice.previewText || voice.transformedPreviewText || '');
    setValue('previewText', voice.exactSpeechText || voice.previewText || '');
    if(voice.emotion){
      setValue('voiceLabEmotion', voice.emotion.key || voice.emotion.label || 'neutral', 'change');
      setValue('voiceLabEmotionIntensity', voice.emotion.intensity || 65);
    }
    const audioPath = voice.selectedAudio?.downloadUrl || voice.selectedAudio?.path || voice.audioSource || '';
    if(audioPath){ setValue('voiceAssetUrl', audioPath); }
    const sliders = voice.rawSliders || voice.sliders || {};
    Object.entries(sliders).forEach(([key, value]) => {
      if($('v_' + key)) setValue('v_' + key, value);
    });
    try { if(typeof window.buildVoiceProfile === 'function') window.buildVoiceProfile('backend-load'); }
    catch(err){ console.warn('Voice rebuild after backend load failed', err); }
  }

  function applyGeneratorPayload(generator){
    if(!generator || typeof generator !== 'object') return;
    const identity = generator.identity || generator;
    const lineage = generator.lineage || {};
    const cls = generator.classBuild || generator.class || {};
    setValue('characterName', identity.name || generator.name || '');
    setValue('playerName', identity.playerName || '');
    setValue('pronouns', identity.pronouns || '');
    setValue('genderIdentity', identity.genderIdentity || identity.gender || '', 'change');
    setValue('raceCategory', lineage.raceCategory || lineage.categoryName || '', 'change');
    setValue('raceSelect', lineage.race1 || lineage.raceName || lineage.race || '', 'change');
    setValue('race2Enabled', lineage.race2Enabled ? 'yes' : 'no', 'change');
    setValue('race2Select', lineage.race2 || '', 'change');
    setValue('biomeCategory', lineage.biomeCategory || lineage.biomeGroup || '', 'change');
    setValue('biomeSelect', lineage.originBiome || lineage.biomeName || lineage.biome || '', 'change');
    setValue('primaryClass', cls.primaryClass || cls.className || '', 'change');
    setValue('primarySubclass', cls.primarySubclass || cls.subclass || '', 'change');
    setValue('primaryLevel', cls.primaryLevel || cls.level || 1);
    setValue('multiEnabled', cls.multiclass ? 'yes' : 'no', 'change');
    setValue('secondaryClass', cls.secondaryClass || '', 'change');
    setValue('secondarySubclass', cls.secondarySubclass || '', 'change');
    setValue('secondaryLevel', cls.secondaryLevel || 0);
    setValue('backgroundSelect', generator.background || '', 'change');
  }

  function applySitePayload(rawPayload){
    const payload = rawPayload?.record?.payload || rawPayload?.payload || rawPayload || {};
    if(!payload || typeof payload !== 'object') return false;

    const generator = payload.generator || payload.activeCharacter || payload.character || payload;
    const voice = payload.voice || payload.activeVoice || payload.voiceProfile || payload?.payload?.voice;
    applyGeneratorPayload(generator);
    applyVoicePayload(voice);
    if(payload.exactSpeech){
      setValue('voiceLabText', payload.exactSpeech);
      setValue('previewText', payload.exactSpeech);
    }
    try { localStorage.setItem(LS_SHARED, JSON.stringify(payload)); } catch {}
    setTimeout(() => {
      try { if(typeof window.pushAllToSheet === 'function') window.pushAllToSheet(); } catch(err){ console.warn('pushAllToSheet after backend load failed', err); }
    }, 250);
    return true;
  }

  async function saveSharedState(source){
    const payload = collectSitePayload(source || 'manual-save');
    try { localStorage.setItem(LS_SHARED, JSON.stringify(payload)); } catch {}
    const result = await backend('saveSharedState', { payload: JSON.stringify(payload) });
    state.lastSavedAt = nowIso();
    return { result, payload };
  }

  async function saveEverything(source){
    setBusy(true);
    setStatus('Saving full 3-page site state to backend…', 'busy');
    try {
      const bundle = await saveSharedState(source || 'save-everything');
      const payload = bundle.payload;
      const characterId = safeId(payload.generator?.identity?.name || currentCharacterName());
      const voiceId = safeId(payload.voice?.name || currentCharacterName() + '-voice');
      await backend('saveCharacter', {
        characterId,
        name: payload.generator?.identity?.name || currentCharacterName(),
        payload: JSON.stringify(payload.generator || {})
      });
      await backend('saveVoicePreset', {
        characterId,
        presetId: voiceId,
        name: payload.voice?.name || currentCharacterName() + ' Voice',
        payload: JSON.stringify(payload.voice || {})
      });
      setStatus('Saved backend state, character, and voice preset.\nLast save: ' + new Date().toLocaleString(), 'ok');
      await refreshBackendAssets(false);
      return bundle;
    } catch(err){
      console.error(err);
      setStatus('Backend save error: ' + err.message + '\nLocal browser copy was still kept.', 'error');
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function loadEverything(){
    setBusy(true);
    setStatus('Loading latest shared state from backend…', 'busy');
    try {
      const result = await backend('loadSharedState', {});
      const found = result.payload && Object.keys(result.payload).length;
      if(found){
        applySitePayload(result.payload);
        state.lastLoadedAt = nowIso();
        setStatus('Loaded backend state into all 3 pages.\nLoaded: ' + new Date().toLocaleString(), 'ok');
      } else {
        const local = localStorage.getItem(LS_SHARED);
        if(local){ applySitePayload(JSON.parse(local)); setStatus('No backend save found yet; restored local browser state.', 'warn'); }
        else setStatus('No backend save found yet. Use Save All after creating a character.', 'warn');
      }
      await refreshBackendAssets(false);
      return result;
    } catch(err){
      console.error(err);
      const local = localStorage.getItem(LS_SHARED);
      if(local){
        try { applySitePayload(JSON.parse(local)); } catch {}
        setStatus('Backend load failed, but local browser backup was restored: ' + err.message, 'warn');
      } else {
        setStatus('Backend load error: ' + err.message, 'error');
      }
      throw err;
    } finally {
      setBusy(false);
    }
  }

  async function saveCharacterOnly(){
    setBusy(true);
    try {
      const payload = collectSitePayload('save-character-only');
      const character = payload.generator || collectGeneratorFallback();
      const characterId = safeId(character?.identity?.name || currentCharacterName());
      const result = await backend('saveCharacter', {
        characterId,
        name: character?.identity?.name || currentCharacterName(),
        payload: JSON.stringify(character)
      });
      await saveSharedState('save-character-only-state');
      setStatus('Saved character to backend: ' + (result.name || characterId), 'ok');
      return result;
    } catch(err){ setStatus('Character save error: ' + err.message, 'error'); throw err; }
    finally { setBusy(false); }
  }

  async function saveVoiceOnly(){
    setBusy(true);
    try {
      const payload = collectSitePayload('save-voice-only');
      const voice = payload.voice || collectVoiceFallback();
      const characterId = safeId(payload.generator?.identity?.name || currentCharacterName());
      const presetId = safeId(voice.name || currentCharacterName() + '-voice');
      const result = await backend('saveVoicePreset', {
        characterId,
        presetId,
        name: voice.name || currentCharacterName() + ' Voice',
        payload: JSON.stringify(voice)
      });
      await saveSharedState('save-voice-only-state');
      setStatus('Saved voice preset to backend: ' + (result.name || presetId), 'ok');
      return result;
    } catch(err){ setStatus('Voice save error: ' + err.message, 'error'); throw err; }
    finally { setBusy(false); }
  }

  function fileToBase64(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || '').split('base64,').pop());
      reader.onerror = () => reject(reader.error || new Error('File read failed'));
      reader.readAsDataURL(file);
    });
  }

  async function uploadVoiceFile(file){
    if(!file) return null;
    if(!/^audio\//i.test(file.type || '')){
      setStatus('Selected file is not an audio file: ' + file.name, 'warn');
      return null;
    }
    setBusy(true);
    setStatus('Uploading voice asset to backend Drive storage…\n' + file.name, 'busy');
    try {
      const base64 = await fileToBase64(file);
      const payload = collectSitePayload('upload-voice-asset');
      const characterId = safeId(payload.generator?.identity?.name || payload.voice?.name || currentCharacterName());
      const result = await backend('uploadVoiceAsset', {
        characterId,
        assetName: file.name,
        contentType: file.type || 'audio/mpeg',
        base64
      });
      const asset = result.asset;
      if(asset?.downloadUrl){
        setValue('voiceAssetUrl', asset.downloadUrl);
        const audio = $('voiceLabAudio');
        if(audio){ audio.src = asset.downloadUrl; audio.load(); }
      }
      await refreshBackendAssets(false);
      await saveEverything('after-voice-asset-upload');
      setStatus('Uploaded voice asset and saved it to this character.\n' + (asset?.originalName || file.name), 'ok');
      return asset;
    } catch(err){
      console.error(err);
      setStatus('Voice asset upload error: ' + err.message, 'error');
      throw err;
    } finally { setBusy(false); }
  }

  async function uploadCurrentVoiceFile(){
    const file = $('voiceLabFile')?.files?.[0];
    if(file) return uploadVoiceFile(file);
    const src = $('voiceAssetUrl')?.value?.trim();
    if(src){
      await saveVoiceOnly();
      setStatus('Saved current pasted/selected audio URL inside the voice preset.', 'ok');
      return null;
    }
    setStatus('No local voice file or pasted audio URL is selected yet.', 'warn');
    return null;
  }

  async function refreshBackendAssets(showMessage){
    try {
      const result = await backend('listVoiceAssets', {});
      state.backendAssets = result.assets || [];
      renderBackendAssetOptions();
      if(showMessage) setStatus('Loaded ' + state.backendAssets.length + ' backend voice asset(s).', 'ok');
      return state.backendAssets;
    } catch(err){
      console.warn('listVoiceAssets failed', err);
      if(showMessage) setStatus('Could not list backend voice assets: ' + err.message, 'warn');
      return [];
    }
  }

  function renderBackendAssetOptions(){
    const select = $('voiceAssetSelect');
    const dockSelect = $('belBackendAssetSelect');
    const optionsHtml = state.backendAssets.map(asset => {
      const label = [asset.originalName || asset.storedName || asset.assetId, asset.characterId].filter(Boolean).join(' • ');
      return '<option value="' + esc(asset.downloadUrl || asset.driveUrl || '') + '" data-asset-id="' + esc(asset.assetId || '') + '">' + esc(label) + '</option>';
    }).join('');

    if(dockSelect){
      dockSelect.innerHTML = '<option value="">Backend voice assets…</option>' + optionsHtml;
    }

    if(select){
      Array.from(select.querySelectorAll('optgroup[data-backend-assets="true"]')).forEach(group => group.remove());
      if(state.backendAssets.length){
        const group = document.createElement('optgroup');
        group.label = 'Backend saved voice assets';
        group.dataset.backendAssets = 'true';
        state.backendAssets.forEach(asset => {
          const opt = document.createElement('option');
          opt.value = 'backend:' + (asset.assetId || asset.fileId || asset.downloadUrl);
          opt.dataset.backendUrl = asset.downloadUrl || asset.driveUrl || '';
          opt.dataset.backendAssetId = asset.assetId || '';
          opt.textContent = [asset.originalName || asset.storedName || 'Saved voice asset', asset.characterId].filter(Boolean).join(' • ');
          group.appendChild(opt);
        });
        select.appendChild(group);
      }
    }
  }

  function useBackendAsset(url){
    if(!url) return;
    setValue('voiceAssetUrl', url);
    const audio = $('voiceLabAudio');
    if(audio){ audio.src = url; audio.load(); }
    try { if(typeof window.makeVoiceExport === 'function') window.makeVoiceExport('backend-asset-selected'); } catch {}
    debounceAutosave('backend-asset-selected');
    setStatus('Backend voice asset selected for this voice.', 'ok');
  }

  function debounceAutosave(source){
    if(Date.now() < state.savingBlockedUntil) return;
    clearTimeout(state.autosaveTimer);
    state.autosaveTimer = setTimeout(async () => {
      if(document.hidden) return;
      try {
        const payload = collectSitePayload(source || 'autosave');
        localStorage.setItem(LS_SHARED, JSON.stringify(payload));
        await backend('saveSharedState', { payload: JSON.stringify(payload) });
        state.lastSavedAt = nowIso();
        const el = $('belBackendStatus');
        if(el && !$('belBackendDock')?.classList.contains('open')) el.textContent = 'Autosaved to backend at ' + new Date().toLocaleTimeString();
      } catch(err){
        console.warn('Backend autosave failed', err);
      }
    }, AUTOSAVE_DELAY);
  }

  function buildDock(){
    if($('belBackendDock')) return;
    const dock = document.createElement('aside');
    dock.id = 'belBackendDock';
    dock.innerHTML = `
      <button id="belBackendToggle" type="button" aria-expanded="false" aria-controls="belBackendPanel">⚙ Backend</button>
      <section id="belBackendPanel" aria-label="Belavadös backend controls">
        <h3>Belavadös Backend</h3>
        <p id="belBackendStatus">Backend bridge is starting…</p>
        <div class="backend-grid">
          <button type="button" id="belBackendSaveAll">Save All 3 Pages</button>
          <button type="button" id="belBackendLoadAll">Load Backend</button>
          <button type="button" id="belBackendSaveCharacter" class="backend-secondary">Save Character</button>
          <button type="button" id="belBackendSaveVoice" class="backend-secondary">Save Voice</button>
          <button type="button" id="belBackendUploadVoice" class="backend-full">Upload / Save Current Voice Asset</button>
          <button type="button" id="belBackendRefreshAssets" class="backend-secondary">Refresh Voice Assets</button>
          <button type="button" id="belBackendInstall" class="backend-secondary">Install App / Add Icon</button>
          <a id="belBackendLauncher" class="backend-secondary" href="${esc(BACKEND_URL)}?action=launcher" target="_blank" rel="noopener">Open Backend Launcher</a>
        </div>
        <select id="belBackendAssetSelect" aria-label="Saved backend voice assets"><option value="">Backend voice assets…</option></select>
        <small>Deployment ID: ${esc(DEPLOYMENT_ID)}<br>Simple Apps Script POST bridge active. GitHub Pages can save/load without custom headers.</small>
      </section>`;
    document.body.appendChild(dock);
  }

  function wireDock(){
    $('belBackendToggle')?.addEventListener('click', () => {
      const dock = $('belBackendDock');
      const open = !dock.classList.contains('open');
      dock.classList.toggle('open', open);
      $('belBackendToggle').setAttribute('aria-expanded', String(open));
    });
    $('belBackendSaveAll')?.addEventListener('click', () => saveEverything('manual-save-all'));
    $('belBackendLoadAll')?.addEventListener('click', () => loadEverything());
    $('belBackendSaveCharacter')?.addEventListener('click', () => saveCharacterOnly());
    $('belBackendSaveVoice')?.addEventListener('click', () => saveVoiceOnly());
    $('belBackendUploadVoice')?.addEventListener('click', () => uploadCurrentVoiceFile());
    $('belBackendRefreshAssets')?.addEventListener('click', () => refreshBackendAssets(true));
    $('belBackendInstall')?.addEventListener('click', installAppHelp);
    $('belBackendAssetSelect')?.addEventListener('change', ev => useBackendAsset(ev.target.value));
  }

  function wireForms(){
    document.addEventListener('input', ev => {
      const target = ev.target;
      if(!target || target.closest?.('#belBackendDock')) return;
      if(target.matches?.('input, select, textarea')) debounceAutosave('input-change');
    }, true);
    document.addEventListener('change', ev => {
      const target = ev.target;
      if(!target || target.closest?.('#belBackendDock')) return;
      if(target.id === 'voiceLabFile' && target.files?.[0]){
        uploadVoiceFile(target.files[0]).catch(() => {});
        return;
      }
      if(target.id === 'voiceAssetSelect'){
        const opt = target.selectedOptions && target.selectedOptions[0];
        const backendUrl = opt?.dataset?.backendUrl;
        if(backendUrl){ useBackendAsset(backendUrl); return; }
      }
      if(target.matches?.('input, select, textarea')) debounceAutosave('field-change');
    }, true);

    window.addEventListener('beforeunload', () => {
      try { localStorage.setItem(LS_SHARED, JSON.stringify(collectSitePayload('beforeunload-local-backup'))); } catch {}
    });
  }

  function setViewportVars(){
    const vh = (window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 800);
    document.documentElement.style.setProperty('--bel-vh', vh + 'px');
    document.documentElement.dataset.orientation = window.matchMedia('(orientation: landscape)').matches ? 'landscape' : 'portrait';
  }

  function injectSheetResponsiveCss(){
    const frame = $('characterSheetFrame');
    if(!frame) return;
    const isFrame = frame.tagName === 'IFRAME';
    let doc = document;
    try { if(isFrame) doc = frame.contentDocument || frame.contentWindow?.document || document; } catch { doc = document; }
    const styleId = isFrame ? 'belSheetResponsiveInject' : 'belSheetResponsiveInjectRealPage';
    if(!doc || !doc.head || doc.getElementById(styleId)) return;
    const style = doc.createElement('style');
    style.id = styleId;
    const scope = isFrame ? '' : '#characterSheetFrame ';
    style.textContent = `
      ${scope}*{box-sizing:border-box;max-width:100%!important;}
      ${scope}input,${scope}select,${scope}textarea,${scope}button{font-size:max(16px,1rem)!important;min-height:46px;}
      ${scope}input:not([type=range]),${scope}select,${scope}textarea{width:100%!important;}
      ${scope}input[type=range]{width:100%!important;min-height:34px;padding-block:8px;}
      ${scope}img,${scope}svg,${scope}canvas,${scope}video,${scope}audio{max-width:100%!important;height:auto;}
      ${scope}.page,${scope}.sheet,${scope}.container,${scope}.wrapper,${scope}.app,${scope}.card,${scope}.panel,${scope}.module,${scope}main,${scope}section,${scope}article,${scope}form{width:100%!important;max-width:100%!important;min-width:0!important;}
      ${scope}.grid,${scope}.sheet-grid,${scope}.stat-grid,${scope}.two,${scope}.three,${scope}.columns,${scope}.bdd-two,${scope}.bdd-three,${scope}.bdd-split{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr))!important;gap:10px!important;}
      ${scope}table{display:block!important;width:100%!important;overflow-x:auto!important;-webkit-overflow-scrolling:touch;}
      ${scope}th,${scope}td{white-space:normal!important;}
      @media(max-width:820px){${scope}.grid,${scope}.sheet-grid,${scope}.stat-grid,${scope}.two,${scope}.three,${scope}.columns,${scope}.bdd-two,${scope}.bdd-three,${scope}.bdd-split{grid-template-columns:1fr!important;} ${scope}button,${scope}.btn{width:100%;white-space:normal!important;}}
    `;
    doc.head.appendChild(style);
  }

  function wireResponsiveRuntime(){
    setViewportVars();
    window.addEventListener('resize', () => { setViewportVars(); setTimeout(injectSheetResponsiveCss, 120); }, { passive: true });
    window.visualViewport?.addEventListener('resize', () => { setViewportVars(); setTimeout(injectSheetResponsiveCss, 120); }, { passive: true });
    const frame = $('characterSheetFrame');
    if(frame){
      frame.addEventListener('load', () => setTimeout(injectSheetResponsiveCss, 120));
      setInterval(injectSheetResponsiveCss, 1500);
    }
  }

  function wirePwa(){
    window.addEventListener('beforeinstallprompt', ev => {
      ev.preventDefault();
      state.installPrompt = ev;
      setStatus('Install prompt is ready. Use Backend → Install App / Add Icon.', 'ok');
    });
    if('serviceWorker' in navigator && location.protocol !== 'file:'){
      navigator.serviceWorker.register('./sw.js').catch(err => console.warn('Service worker registration failed', err));
    }
  }

  async function installAppHelp(){
    if(state.installPrompt){
      const prompt = state.installPrompt;
      state.installPrompt = null;
      prompt.prompt();
      try { await prompt.userChoice; } catch {}
      setStatus('Install prompt opened. If it did not appear, use your browser menu → Add to Home Screen / Install App.', 'ok');
      return;
    }
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent || '');
    if(isIos){
      alert('To add the icon on iPhone/iPad: tap Share, then Add to Home Screen. The local manifest and backend launcher icon are embedded.');
    } else {
      alert('To add the icon: open the browser menu and choose Install app, Add to Home Screen, or Create shortcut. You can also open the Backend Launcher from this panel.');
    }
  }

  async function healthCheck(){
    try {
      const result = await backend('health', {});
      state.online = true;
      state.lastHealth = result;
      localStorage.setItem(LS_CONFIG, JSON.stringify(result));
      setStatus('Backend connected. Ready to save/load all 3 pages.', 'ok');
      return result;
    } catch(err){
      state.online = false;
      setStatus('Backend bridge is embedded, but health check failed: ' + err.message + '\nThe site will still keep local browser backups.', 'warn');
      return null;
    }
  }

  async function initialRestore(){
    await sleep(550);
    await refreshBackendAssets(false);
    try {
      const result = await backend('loadSharedState', {});
      if(result.payload && Object.keys(result.payload).length){
        applySitePayload(result.payload);
        setStatus('Backend connected and latest saved state was restored.', 'ok');
        return;
      }
    } catch(err){
      console.warn('Initial backend restore failed', err);
    }
    try {
      const local = localStorage.getItem(LS_SHARED);
      if(local){
        applySitePayload(JSON.parse(local));
        setStatus('Backend connected. Restored local browser backup; no backend state found yet.', 'warn');
      }
    } catch {}
  }

  function exposeApi(){
    window.BelavadosBackendBridge = Object.freeze({
      BACKEND_URL,
      DEPLOYMENT_ID,
      PROFILE_ID,
      request: backend,
      collectSitePayload,
      applySitePayload,
      saveEverything,
      loadEverything,
      saveSharedState,
      saveCharacterOnly,
      saveVoiceOnly,
      uploadCurrentVoiceFile,
      refreshBackendAssets,
      useBackendAsset
    });
  }

  async function init(){
    buildDock();
    wireDock();
    wireForms();
    wireResponsiveRuntime();
    wirePwa();
    exposeApi();
    await healthCheck();
    initialRestore();
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
