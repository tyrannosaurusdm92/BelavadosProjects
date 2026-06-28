/*
  Belavados Character Studio ⇄ Voice Studio linked runtime.
  Character Studio is the only opener. Voice Studio supplies linked manifests,
  source-selection bot logic, audio render/export helpers, and backend routes.
*/
(function(){
  'use strict';

  const DEFAULT_BACKEND = 'https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec';
  const DEFAULT_GITHUB_VOICE_BASE = 'https://tyrannosaurusdm92.github.io/BelavadosProjects/voice_studio/';
  const STORAGE_KEY = 'belavados.characterStudio.linkedVoice.last.v3';
  const cfg = Object.assign({
    lockedBackendUrl: DEFAULT_BACKEND,
    githubVoiceStudioBaseUrl: DEFAULT_GITHUB_VOICE_BASE,
    voiceManifestPath: 'voices.json'
  }, window.BELAVADOS_LINKED_VOICE_STUDIO_CONFIG || {});

  const $ = id => document.getElementById(id);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));

  const runtime = {
    api: null,
    loading: null,
    ready: false,
    last: null,
    stale: true,
    busy: false
  };

  function relativeVoiceBase(){
    try { return new URL('../voice_studio/', window.location.href).href; }
    catch(_err){ return cfg.githubVoiceStudioBaseUrl || DEFAULT_GITHUB_VOICE_BASE; }
  }

  function candidateLibraryUrls(){
    const urls = [];
    if(cfg.libraryUrl) urls.push(cfg.libraryUrl);
    try { urls.push(new URL('s/character-studio-voice-library.js', relativeVoiceBase()).href); } catch(_err){}
    if(cfg.githubVoiceStudioBaseUrl) urls.push(new URL('s/character-studio-voice-library.js', cfg.githubVoiceStudioBaseUrl).href);
    urls.push(new URL('s/character-studio-voice-library.js', DEFAULT_GITHUB_VOICE_BASE).href);
    return [...new Set(urls)];
  }

  function setStatus(message, kind='info'){
    const text = String(message || '');
    ['linkedVoiceStatus','voiceStatus','voiceLabReadout'].forEach(id => {
      const el = $(id);
      if(el){ el.dataset.kind = kind; el.textContent = text; }
    });
  }

  function setPre(id, value){ const el=$(id); if(el) el.textContent = typeof value === 'string' ? value : JSON.stringify(value, null, 2); }

  function selectedText(id){
    const el = $(id);
    if(!el) return '';
    if(el.tagName === 'SELECT'){
      const opt = el.options?.[el.selectedIndex];
      return (opt?.textContent || el.value || '').replace(/\s+—\s+.*$/,'').replace(/\s+\(.+\)$/,'').trim();
    }
    return el.value || '';
  }

  function valueOf(...ids){
    for(const id of ids){
      const el = $(id);
      if(el && String(el.value || '').trim()) return String(el.value).trim();
    }
    return '';
  }

  function labelOf(...ids){
    for(const id of ids){
      const txt = selectedText(id);
      if(txt) return txt;
    }
    return valueOf(...ids);
  }

  function readSliderValues(){
    const out = {};
    $$('[data-voice-world-slider], #voiceSliders input[type="range"], #sliderGrid input[type="range"]').forEach(input => {
      const key = input.dataset.voiceWorldSlider || input.id?.replace(/^v_/,'').replace(/^slider_/,'');
      if(!key) return;
      const canonical = {
        resonance: 'formant',
        articulationPrecision: 'emphasis',
        pauseControl: 'phrase',
        accentColor: 'accent',
        humanVariation: 'construct',
        emotionIntensity: 'emotion'
      }[key] || key;
      out[canonical] = Number(input.value);
    });
    const intensity = $('voiceLabEmotionIntensity');
    if(intensity && !Number.isNaN(Number(intensity.value))) out.emotion = Math.max(0, Math.min(10, Number(intensity.value) / 10));
    return out;
  }

  function speechText(){
    return valueOf('voiceLabText','previewText','speechText') || 'This is what I sound like.';
  }

  function collectCharacterInput(){
    const primaryClass = labelOf('voiceClass','primaryClass','fld_primaryClass');
    const primarySubclass = labelOf('voiceSubclass','primarySubclass','fld_primarySubclass');
    const fallbackNotes = [valueOf('voiceNotes','fld_personality','personality'), valueOf('fld_appearance')].filter(Boolean).join('\n\n');
    return {
      name: valueOf('voiceName','characterName','fld_characterName') || selectedText('voiceName') || 'Unnamed Character',
      genderIdentity: labelOf('voiceGender','genderIdentity') || valueOf('fld_genderIdentity'),
      category: labelOf('raceCategory','genCustom_category','voiceCustom_category'),
      race: labelOf('voiceRace','raceSelect','fld_race'),
      lineage: labelOf('voiceRaceLineageSelect','genCustom_lineage','voiceCustom_lineage'),
      biome: labelOf('voiceBiome','biomeSelect','bdd_biomeSelect','genCustom_biome','voiceCustom_biome') || valueOf('fld_lineage_originBiome'),
      classRole: [primaryClass, primarySubclass].filter(Boolean).join(' '),
      personality: fallbackNotes,
      mood: labelOf('voiceLabEmotion') || 'Neutral/Base',
      context: valueOf('voiceContext','contextSelect') || 'Campfire conversation',
      line: speechText()
    };
  }

  function collectCharacterExport(){
    let parsed = null;
    const fromText = $('characterExport')?.value;
    if(fromText){ try { parsed = JSON.parse(fromText); } catch(_err){} }
    const sheet = {};
    $$('[data-key]').forEach(el => { if(el.dataset.key) sheet[el.dataset.key] = el.value ?? ''; });
    return {
      schema: 'belavados.characterStudio.linkedFullExport.v3',
      exportedAt: new Date().toISOString(),
      source: 'character_studio/index.html',
      characterExport: parsed,
      characterFields: collectCharacterInput(),
      sheetFields: sheet,
      linkedVoice: runtime.last,
      entryPointPolicy: 'Only Character Studio opens the program. Voice Studio is referenced as the asset/bot/backend library.'
    };
  }

  function downloadText(filename, text, mime='application/json'){
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url), 3000);
  }

  function safeFile(value, fallback='belavados-character'){
    return String(value || fallback).normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,80) || fallback;
  }

  function ensurePanel(){
    if($('linkedVoiceStudioPanel')) return;
    const target = $('voiceTestingLab') || $('page-voice') || document.body;
    const panel = document.createElement('section');
    panel.id = 'linkedVoiceStudioPanel';
    panel.className = 'card span-12 linked-voice-studio-panel';
    panel.innerHTML = `
      <h2>Linked Voice Studio Bot + Asset Library</h2>
      <p class="voice-lab-small">Character Studio owns character generation, import/export, and simulation. Voice/accent/bot assets are not stored here; this panel pulls the source manifest, source-selection bot, WAV renderer, backend MP3/WAV route, and ZIP export helpers from <code>voice_studio/s/</code>.</p>
      <div class="actions linked-voice-actions">
        <button type="button" id="linkedVoiceBotBtn" class="dark">Activate linked voice-source bot</button>
        <button type="button" id="linkedVoiceBackendResolveBtn" class="secondary">Backend source resolve</button>
        <button type="button" id="linkedVoiceBrowserBtn">Browser preview</button>
        <button type="button" id="linkedVoiceWavBtn" class="dark">Render linked WAV</button>
        <button type="button" id="linkedVoiceBackendAudioBtn" class="secondary">Ask backend for MP3 + WAV</button>
        <button type="button" id="linkedVoiceZipBtn">Download linked voice ZIP</button>
        <button type="button" id="linkedVoiceFullExportBtn">Download full Character Studio JSON</button>
      </div>
      <div id="linkedVoiceStatus" class="voice-world-status">Linked Voice Studio runtime is loading.</div>
      <div class="grid section-gap-small">
        <section class="card span-6"><h3>Bot-selected source</h3><div id="linkedVoiceDecisionCard" class="voice-lab-small">No linked decision yet.</div></section>
        <section class="card span-6"><h3>Linked runtime status</h3><pre id="linkedVoiceRuntimeStatus" class="voice-json"></pre></section>
      </div>`;
    if(target.parentNode) target.insertAdjacentElement('afterend', panel); else document.body.appendChild(panel);
  }

  function ensureCss(){
    if($('linkedVoiceStudioCss')) return;
    const style = document.createElement('style');
    style.id = 'linkedVoiceStudioCss';
    style.textContent = `
      .linked-voice-studio-panel{border:2px solid #00ffff!important;background:linear-gradient(180deg,rgba(0,32,42,.86),rgba(0,18,24,.86))!important;color:#e8ffff!important;grid-column:1/-1!important}
      .linked-voice-studio-panel h2,.linked-voice-studio-panel h3{color:#e8ffff!important;text-shadow:2px 2px #000,0 0 8px rgba(0,255,255,.55)!important}
      .linked-voice-studio-panel code{background:rgba(255,255,255,.12);padding:.1rem .3rem;border-radius:.25rem}
      .linked-voice-actions{gap:8px;flex-wrap:wrap}
      #linkedVoiceDecisionCard strong{color:#fff4d6}
      #linkedVoiceRuntimeStatus{max-height:240px;min-height:120px;background:rgba(255,255,255,.92);color:#001e24}
      #voiceAssetSelect[data-linked-voice-locked="true"]{border-color:#00ffff;box-shadow:0 0 0 2px rgba(0,255,255,.22)}
    `;
    document.head.appendChild(style);
  }

  async function loadApi(){
    if(runtime.api) return runtime.api;
    if(runtime.loading) return runtime.loading;
    runtime.loading = (async()=>{
      ensurePanel(); ensureCss();
      window.BELAVADOS_LINKED_VOICE_STUDIO_CONFIG = Object.assign({}, cfg, {
        lockedBackendUrl: cfg.lockedBackendUrl || DEFAULT_BACKEND,
        voiceStudioBaseUrl: cfg.voiceStudioBaseUrl || relativeVoiceBase(),
        voiceStudioDataBaseUrl: cfg.voiceStudioDataBaseUrl || new URL('s/', cfg.voiceStudioBaseUrl || relativeVoiceBase()).href,
        voiceStudioAssetBaseUrl: cfg.voiceStudioAssetBaseUrl || cfg.githubVoiceStudioBaseUrl || DEFAULT_GITHUB_VOICE_BASE,
        voiceManifestPath: cfg.voiceManifestPath || 'voices.json'
      });
      const errors = [];
      for(const url of candidateLibraryUrls()){
        try{
          const mod = await import(url);
          runtime.api = mod.default || mod;
          await runtime.api.loadLinkedVoiceStudio();
          runtime.ready = true;
          setPre('linkedVoiceRuntimeStatus', runtime.api.getVoiceStudioStatus());
          setStatus('Linked Voice Studio loaded. Character Studio will now pull source decisions, bot capabilities, manifests, and export helpers from voice_studio only.', 'ok');
          return runtime.api;
        }catch(err){
          errors.push(`${url}: ${err.message}`);
          console.warn('[Character Studio linked voice] import failed:', url, err);
        }
      }
      throw new Error('Unable to load Voice Studio linked library. ' + errors.join(' | '));
    })();
    return runtime.loading;
  }

  function renderDecision(result){
    const decision = result?.decision || {};
    const source = decision.selected || result?.profile?.sourceVoice || null;
    const status = result?.summary || 'No bot summary returned.';
    const card = $('linkedVoiceDecisionCard');
    if(card){
      const runners = (decision.runnerUp || []).slice(0,5).map((r,i)=>`<li>${i+2}. ${esc(r.speaker || r.source || r.id || 'source')} ${r.phrase ? '— '+esc(r.phrase) : ''}</li>`).join('');
      card.innerHTML = `<p><strong>${esc(source?.speaker || source?.source || source?.id || 'No source')}</strong></p><p>${esc(source?.phrase || source?.tag || '')}</p><p><code>${esc(source?.file || '')}</code></p><p>${esc(status)}</p>${runners ? `<ol>${runners}</ol>` : ''}`;
    }
    const select = $('voiceAssetSelect');
    if(select){
      select.innerHTML = '';
      const empty = document.createElement('option');
      empty.value=''; empty.textContent='Bot has not selected a Voice Studio source yet'; select.appendChild(empty);
      if(source){
        const group = document.createElement('optgroup'); group.label='Bot-selected Voice Studio source'; select.appendChild(group);
        const opt = document.createElement('option');
        opt.value = JSON.stringify({ linkedVoiceStudio:true, id:source.id, file:source.file, fileUrl:source.fileUrl, speaker:source.speaker, phrase:source.phrase });
        opt.textContent = `BOT PICK: ${source.speaker || source.source || source.id} — ${source.phrase || source.tag || source.file}`;
        group.appendChild(opt); select.value = opt.value;
      }
      const runnerRows = (decision.runnerUp || []).slice(0,8);
      if(runnerRows.length){
        const group = document.createElement('optgroup'); group.label='Runner-up sources for audit only'; select.appendChild(group);
        runnerRows.forEach((r,i)=>{
          const opt = document.createElement('option');
          opt.disabled = true;
          opt.value = JSON.stringify({ runnerUp:true, id:r.id, file:r.file, fileUrl:r.fileUrl });
          opt.textContent = `${i+2}. ${r.speaker || r.source || r.id} — ${r.phrase || r.tag || r.file}`;
          group.appendChild(opt);
        });
      }
      select.dataset.linkedVoiceLocked = 'true';
      select.setAttribute('aria-readonly','true');
      select.title = 'Voice source selection is bot-locked from Voice Studio. Change character fields, then activate the linked bot again.';
    }
    const selectedText = $('voiceSelectedAssetText');
    if(selectedText && source){
      selectedText.innerHTML = `<strong>BOT PICK: ${esc(source.speaker || source.source || source.id)}</strong><br><span class="voice-lab-small">${esc(source.phrase || '')}<br>${esc(source.file || '')}</span>`;
    }
    const audio = $('voiceLabAudio');
    if(audio && source?.fileUrl){ audio.src = source.fileUrl; audio.load?.(); }
    const summary = $('voiceSummary');
    if(summary){
      summary.innerHTML = `<article class="mini-card"><h3>Linked Voice Studio source</h3><p><strong>${esc(source?.speaker || source?.source || 'No source')}</strong></p><p>${esc(result?.profileText || '')}</p></article>`;
    }
    const voiceExport = $('voiceExport');
    if(voiceExport){ voiceExport.value = JSON.stringify(result?.profile || result, null, 2); }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result)); } catch(_err){}
  }

  async function activateBot(options={}){
    const api = await loadApi();
    runtime.stale = false;
    setStatus('Linked Voice Studio bot is reading Character Studio generator fields, sliders, mood, biome, race, gender identity, class, and notes…');
    if(options.simulateMinute){
      const steps = ['Scanning character generation fields…','Matching biome accent to Voice Studio manifest…','Scoring race/class/gender overlays…','Selecting source model/sample…'];
      for(const step of steps){ setStatus(step); await sleep(180); }
    }
    const input = collectCharacterInput();
    const result = await api.buildLinkedVoice(input, readSliderValues());
    runtime.last = result;
    renderDecision(result);
    setPre('linkedVoiceRuntimeStatus', api.getVoiceStudioStatus());
    setStatus(`Linked bot selected: ${result.decision?.sourceLabel || result.profile?.sourceVoice?.speaker || 'source selected'}`, result.decision?.ok === false ? 'bad' : 'ok');
    return result;
  }

  async function ensureDecision(){
    if(runtime.last && !runtime.stale) return runtime.last;
    return activateBot();
  }

  async function backendResolve(){
    const api = await loadApi();
    const result = await ensureDecision();
    setStatus('Asking locked backend to resolve/confirm the linked Voice Studio source…');
    const response = await api.resolveWithBackend(result.profile, speechText());
    result.backendSourceResolve = response;
    runtime.last = result;
    renderDecision(result);
    setStatus(`Backend source resolve response stored in export. ${response?.sourceModelId || response?.sourceName || response?.note || ''}`, response?.ok === false ? 'bad' : 'ok');
  }

  async function renderWav(){
    const api = await loadApi();
    const result = await ensureDecision();
    const audio = $('voiceLabAudio') || document.querySelector('audio');
    const out = api.renderLinkedWav(speechText(), result.profile, audio, true);
    setStatus(`Downloaded linked WAV: ${out.filename}`, 'ok');
  }

  async function browserPreview(){
    const api = await loadApi();
    const result = await ensureDecision();
    api.playBrowserVoice(speechText(), result.profile);
    setStatus('Browser speech preview started. Use linked WAV/backend audio for downloadable files.', 'ok');
  }

  async function backendAudio(){
    const api = await loadApi();
    const result = await ensureDecision();
    setStatus('Requesting backend MP3 and WAV from the linked Voice Studio route…');
    const wav = await api.requestBackendAudio(result.profile, speechText(), 'wav');
    let mp3 = null;
    try { mp3 = await api.requestBackendAudio(result.profile, speechText(), 'mp3'); } catch(err){ mp3 = { error: err.message }; }
    result.backendAudio = { wav: wav.response, mp3: mp3?.response || mp3 };
    runtime.last = result;
    const playable = mp3?.playableUrl || wav?.playableUrl;
    const audio = $('voiceLabAudio') || document.querySelector('audio');
    if(playable && audio){ audio.src = playable; audio.play?.(); }
    renderDecision(result);
    setStatus(playable ? 'Backend returned playable linked audio. MP3/WAV response saved into voice export.' : 'Backend response saved. No playable URL was returned; use Render linked WAV for local fallback.', (wav.response?.ok === false && mp3?.response?.ok === false) ? 'bad' : 'ok');
  }

  async function downloadZip(){
    const api = await loadApi();
    const result = await ensureDecision();
    const full = collectCharacterExport();
    const out = await api.createLinkedVoiceZip(speechText(), result.profile, { characterStudioExport: full });
    api.downloadLinkedBlob(out.zip, out.filename);
    setStatus(`Downloaded linked voice ZIP: ${out.filename}`, 'ok');
  }

  async function fullExport(){
    await ensureDecision();
    const full = collectCharacterExport();
    downloadText(`${safeFile(full.characterFields?.name || 'belavados_character')}_character_studio_linked_voice.json`, JSON.stringify(full, null, 2));
    setStatus('Downloaded full Character Studio JSON with linked Voice Studio decision/profile included.', 'ok');
  }

  function markStale(){ runtime.stale = true; }

  function wire(){
    ensurePanel(); ensureCss();
    const pairs = [
      ['linkedVoiceBotBtn', () => activateBot({ simulateMinute:true })],
      ['linkedVoiceBackendResolveBtn', backendResolve],
      ['linkedVoiceBrowserBtn', browserPreview],
      ['linkedVoiceWavBtn', renderWav],
      ['linkedVoiceBackendAudioBtn', backendAudio],
      ['linkedVoiceZipBtn', downloadZip],
      ['linkedVoiceFullExportBtn', fullExport]
    ];
    pairs.forEach(([id, fn]) => {
      const el = $(id);
      if(el && !el.dataset.linkedVoiceWired){
        el.dataset.linkedVoiceWired = '1';
        el.addEventListener('click', async ev => {
          ev.preventDefault();
          if(runtime.busy) return;
          runtime.busy = true;
          try { await fn(); }
          catch(err){ console.error(err); setStatus(err.message || String(err), 'bad'); }
          finally { runtime.busy = false; }
        });
      }
    });
    ['voiceFindMatchingAssetBtn','buildVoiceBtn','loadCharacterVoiceBtn','copyToVoiceFromGeneratorForge','sendToVoiceBtn'].forEach(id => {
      const el = $(id);
      if(el && !el.dataset.linkedVoiceAutoWired){
        el.dataset.linkedVoiceAutoWired = '1';
        el.addEventListener('click', () => setTimeout(()=>activateBot().catch(err=>setStatus(err.message,'bad')), 80));
      }
    });
    ['voiceName','voiceGender','voiceRace','voiceBiome','voiceClass','voiceSubclass','voiceNotes','voiceLabText','voiceLabEmotion','voiceLabEmotionIntensity','characterName','genderIdentity','raceSelect','biomeSelect','primaryClass','primarySubclass'].forEach(id => {
      const el = $(id);
      if(el && !el.dataset.linkedVoiceStaleWired){
        el.dataset.linkedVoiceStaleWired = '1';
        el.addEventListener('input', markStale);
        el.addEventListener('change', markStale);
      }
    });
    loadApi().catch(err => setStatus(err.message, 'bad'));
  }

  window.BelavadosCharacterVoiceLink = Object.freeze({
    loadApi,
    activateBot,
    backendResolve,
    renderWav,
    backendAudio,
    downloadZip,
    fullExport,
    collectCharacterInput,
    collectCharacterExport,
    last: () => runtime.last
  });

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();
})();
