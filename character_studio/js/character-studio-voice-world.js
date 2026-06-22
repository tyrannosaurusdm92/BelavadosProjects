
/* Belavadös Character Studio Voice World — replaces voice placeholders with weighted biome voice engine. */
(function(){
'use strict';
const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbyr4TwLilCubnWm_g-N8nIZUiWR3GJ7-nzeV8dc1vJctcPHHFU3bCg96yi5retOUeZGfQ/exec';
const DATA = window.BELAVADOS_VOICE_WORLD_DATA || {biomes:[], combinations:[], sliderSchema:{userControls:[], influenceControls:[], defaultVoiceProfile:{}}, modelRegistry:{raceOverlays:{}, classOverlays:{}}};
const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp = (n,min,max) => Math.max(min, Math.min(max, Number.isFinite(+n) ? +n : min));
const pretty = obj => JSON.stringify(obj, null, 2);
const byBiomeId = Object.fromEntries((DATA.biomes||[]).map(b=>[b.id,b]));
const byBiomeName = Object.fromEntries((DATA.biomes||[]).flatMap(b=>[[String(b.biome||'').toLowerCase(),b],[String(b.fantasyAccentName||'').toLowerCase(),b],[String(b.baseAccentInspiration||'').toLowerCase(),b]]));
const comboKey = ids => [...ids].sort().join('|');
const combosByKey = Object.fromEntries((DATA.combinations||[]).map(c=>[comboKey(c.biomeIds||[]), c]));
const modelById = {};
(DATA.biomes||[]).forEach(b => (b.modelChoices||[]).forEach(m => modelById[m.id] = Object.assign({biomeId:b.id, fantasyAccentName:b.fantasyAccentName}, m)));
const sliderControls = [...(DATA.sliderSchema?.userControls||[]), ...(DATA.sliderSchema?.influenceControls||[])];
const state = {
  cache: [], selectedCombo: null, selectedAccentId: null, layers: [], sliderValues: Object.assign({}, DATA.sliderSchema?.defaultVoiceProfile || {}),
  speech: {utterance:null, words:[], wordIndex:0, estimatedDuration:0, mode:null}, activeAudio:null, lastPayload:null
};
function defaultProfile(){ const o={}; sliderControls.forEach(s=>o[s.key]=s.default); return Object.assign(o, state.sliderValues || {}); }
function asPercentControl(s){ return Number(s.max) <= 1 || /Influence|Strength/.test(s.label||''); }
function option(parent, value, label){ if(!parent) return null; const o=document.createElement('option'); o.value=value; o.textContent=label; parent.appendChild(o); return o; }
function getTextLine(){ return $('voiceLabText')?.value || $('previewText')?.value || 'Greetings, traveler.'; }
function setStatus(msg){ ['voiceStatus','voiceLabReadout','csVoiceBackendStatus'].forEach(id=>{ const el=$(id); if(el) el.textContent=msg; }); }
function selectedVoiceBiome(){
  const raw = $('voiceBiome')?.value || $('biomeSelect')?.value || '';
  if(byBiomeId[raw]) return byBiomeId[raw];
  return byBiomeName[String(raw).toLowerCase()] || DATA.biomes?.[0] || null;
}
function selectedRaceOverlay(){ return $('voiceRace')?.value || $('raceSelect')?.value || $('csVoiceRaceOverlay')?.value || 'human'; }
function selectedClassOverlay(){ return $('voiceClass')?.value || $('primaryClass')?.value || $('csVoiceClassOverlay')?.value || 'adventurer'; }
function normalizeBiomeValue(value){
  if(!value) return null;
  if(byBiomeId[value]) return byBiomeId[value];
  return byBiomeName[String(value).toLowerCase()] || (DATA.biomes||[]).find(b=>String(b.biome).toLowerCase()===String(value).toLowerCase()) || null;
}
function ensureUi(){
  const notice = Array.from(document.querySelectorAll('#page-voice .notice')).find(n=>/placeholder|stripped|Voice UI is preserved/i.test(n.textContent));
  if(notice){ notice.classList.remove('warn'); notice.classList.add('ok'); notice.textContent = 'Character Studio Voice World is active. Biome accents, race/class overlays, weighted crossovers, export payloads, and backend job routing now replace the placeholder voice layer.'; }
  const heroTitle = $('#page-voice .site-title'); if(heroTitle) heroTitle.textContent = 'Shape a Character Voice';
  const pagePill = Array.from(document.querySelectorAll('#page-voice .pill')).find(p=>/Voice Creation/i.test(p.textContent)); if(pagePill) pagePill.textContent='Character Voice World';
  const lab = $('voiceTestingLab');
  if(lab && !$('csVoiceWorldControls')){
    const wrap = document.createElement('section');
    wrap.className = 'voice-world-grid';
    wrap.id = 'csVoiceWorldControls';
    wrap.innerHTML = `
      <section class="voice-world-card half">
        <h2>Three-Biome Character Voice Cache</h2>
        <p class="voice-world-mini">Cache up to three biomes for genetic and cultural voice diversity. The resulting crossover layers are weighted below.</p>
        <label>Add biome accent folder<select id="csVoiceBiomeCacheSelect"></select></label>
        <div class="voice-world-actions"><button type="button" id="csAddBiomeCache">Cache Biome</button><button type="button" id="csClearBiomeCache">Clear Cache</button><button type="button" id="csPullCharacterBiome">Pull Current Character Biome</button></div>
        <div class="voice-world-chips" id="csBiomeCacheChips"></div>
        <div class="voice-world-status" id="csSelectedCrossover">No crossover selected yet.</div>
      </section>
      <section class="voice-world-card half">
        <h2>Single Accent / Base Layer</h2>
        <p class="voice-world-mini">For non-crossover characters, this chooses the canonical fantasy accent folder while typed lines remain English.</p>
        <label>Fantasy accent profile<select id="csAccentProfileSelect"></select></label>
        <label>Default model / reference route<select id="csSingleModelSelect"></select></label>
        <div class="voice-world-status" id="csAccentProfileCard"></div>
      </section>
      <section class="voice-world-card span-12" style="grid-column:1/-1">
        <h2>Weighted Crossover Layer Mixer</h2>
        <p class="voice-world-mini">Every suggested biome model starts enabled. Disable/re-enable layers or set custom intensities like 16% / 37% / 47%; normalized weights are calculated for the backend payload.</p>
        <div class="voice-world-actions"><button type="button" id="csNormalizeLayers">Normalize Enabled Layers</button><button type="button" id="csResetLayers">Reset Suggested Layers</button></div>
        <div id="csVoiceLayerMixer"></div>
      </section>
      <section class="voice-world-card half">
        <h2>Race, Class, and Delivery Influence</h2>
        <label>Race / ancestry overlay<select id="csVoiceRaceOverlay"></select></label>
        <label>Class / role overlay<select id="csVoiceClassOverlay"></select></label>
        <div class="voice-world-status" id="csInfluenceSummary"></div>
      </section>
      <section class="voice-world-card half">
        <h2>Backend + Preset Actions</h2>
        <p class="voice-world-secure-note">Backend routing is configured internally. The site does not display deployment details to players.</p>
        <div class="voice-world-actions"><button type="button" id="csBuildVoicePayload">Build Payload</button><button type="button" id="csSendVoiceJob">Send Voice Job</button><button type="button" id="csSaveVoicePreset">Save Browser Preset</button><button type="button" id="csLoadVoicePreset">Load Browser Preset</button></div>
        <div class="voice-world-status" id="csVoiceBackendStatus">Voice engine ready.</div>
      </section>
      <section class="voice-world-card" style="grid-column:1/-1">
        <h2>Character Voice Payload Preview</h2>
        <textarea id="csVoiceEnginePayload" class="voice-json" readonly></textarea>
      </section>`;
    lab.insertAdjacentElement('afterend', wrap);
  }
  const controls = document.querySelector('[aria-label="Speech preview controls"]');
  if(controls && !$('csVoiceRewindSpeechBtn')){
    const rw = document.createElement('button'); rw.type='button'; rw.id='csVoiceRewindSpeechBtn'; rw.className='secondary'; rw.textContent='↶ Rewind Speech 5s';
    const fw = document.createElement('button'); fw.type='button'; fw.id='csVoiceForwardSpeechBtn'; fw.className='secondary'; fw.textContent='Forward Speech 5s ↷';
    controls.appendChild(rw); controls.appendChild(fw);
  }
}
function populateSelects(){
  const cacheSel = $('csVoiceBiomeCacheSelect'); const accentSel = $('csAccentProfileSelect');
  if(cacheSel && !cacheSel.options.length){ (DATA.biomes||[]).forEach(b=> option(cacheSel,b.id,`${b.fantasyAccentName} — ${b.biome} (${b.baseAccentInspiration})`)); }
  if(accentSel && !accentSel.options.length){ (DATA.biomes||[]).forEach(b=> option(accentSel,b.id,`${b.fantasyAccentName} — ${b.baseAccentInspiration}`)); }
  const voiceBiome = $('voiceBiome');
  if(voiceBiome){
    const hasFantasy = Array.from(voiceBiome.options||[]).some(o=>byBiomeId[o.value]);
    if(!hasFantasy){
      const old = voiceBiome.value;
      voiceBiome.innerHTML='';
      (DATA.biomes||[]).forEach(b=> option(voiceBiome,b.id,`${b.fantasyAccentName} — ${b.biome}`));
      const match = normalizeBiomeValue(old); if(match) voiceBiome.value = match.id;
    }
  }
  const raceSel = $('csVoiceRaceOverlay'); const classSel = $('csVoiceClassOverlay');
  if(raceSel && !raceSel.options.length){
    const overlays = DATA.modelRegistry?.raceOverlays || {}; Object.entries(overlays).forEach(([id,o])=>option(raceSel,id,o.label || id));
    if(!raceSel.options.length) ['human','elf','dwarf','halfling','orc','aquatic','beastfolk','dragonborn'].forEach(x=>option(raceSel,x,x));
  }
  if(classSel && !classSel.options.length){
    const overlays = DATA.modelRegistry?.classOverlays || {}; Object.entries(overlays).forEach(([id,o])=>option(classSel,id,o.label || id));
    if(!classSel.options.length) ['merchant','warrior','bard','cleric','mage','rogue','ranger','scholar','artisan','farmer','scout'].forEach(x=>option(classSel,x,x));
  }
  if(accentSel && !accentSel.value && DATA.biomes?.[0]) accentSel.value = DATA.biomes[0].id;
}
function renderAccentProfile(){
  const b = byBiomeId[$('csAccentProfileSelect')?.value] || selectedVoiceBiome() || DATA.biomes?.[0]; if(!b) return;
  state.selectedAccentId = b.id;
  const modelSel=$('csSingleModelSelect'); if(modelSel){ modelSel.innerHTML=''; (b.modelChoices||[]).forEach(m=>option(modelSel,m.id,`${m.label || m.id} (${m.engine || 'reference'})`)); }
  const card=$('csAccentProfileCard'); if(card) card.innerHTML = `<strong>${esc(b.fantasyAccentName)}</strong><br>Base inspiration: ${esc(b.baseAccentInspiration)}<br>Biome: ${esc(b.biome)}<br>Race behavior: ${esc(b.raceOverlayBehavior)}<br>Class behavior: ${esc(b.classOverlayBehavior)}<br>Feel: ${esc(b.finalVoiceFeel)}`;
  if(!state.selectedCombo && !state.layers.length) resetLayersFromBiomes([b.id]);
  updateAll();
}
function addBiomeToCache(id){
  const b = byBiomeId[id] || selectedVoiceBiome(); if(!b) return;
  if(state.cache.includes(b.id)) return;
  if(state.cache.length >= 3) state.cache.shift();
  state.cache.push(b.id); resolveComboFromCache(); renderCache(); updateAll();
}
function resolveComboFromCache(){
  if(state.cache.length === 3){ state.selectedCombo = combosByKey[comboKey(state.cache)] || null; resetLayersFromBiomes(state.cache); }
  else { state.selectedCombo = null; resetLayersFromBiomes(state.cache.length ? state.cache : [state.selectedAccentId || selectedVoiceBiome()?.id]); }
}
function resetLayersFromBiomes(ids){
  const parts = (ids||[]).map(id=>byBiomeId[id]).filter(Boolean);
  const source = state.selectedCombo?.components?.length ? state.selectedCombo.components.map(c=>byBiomeId[c.biomeId]).filter(Boolean) : parts;
  const n = source.length || 1;
  state.layers = source.map(b=>({biomeId:b.id, enabled:true, intensityPercent:Math.round((100/n)*100)/100, modelId:b.defaultModelId || b.modelChoices?.[0]?.id || ''}));
}
function renderCache(){
  const chips=$('csBiomeCacheChips'); if(chips){ chips.innerHTML=state.cache.map(id=>{const b=byBiomeId[id];return `<span class="voice-world-chip"><strong>${esc(b?.fantasyAccentName||id)}</strong><button type="button" data-remove-biome="${esc(id)}">×</button></span>`}).join(''); chips.querySelectorAll('[data-remove-biome]').forEach(btn=>btn.onclick=()=>{state.cache=state.cache.filter(x=>x!==btn.dataset.removeBiome); resolveComboFromCache(); renderCache(); updateAll();}); }
  const c=$('csSelectedCrossover'); if(c){ c.innerHTML = state.selectedCombo ? `<strong>${esc(state.selectedCombo.accentBlendName)}</strong><br>${esc(state.selectedCombo.voiceFeelBlend)}<br><span class="voice-world-mini">${esc(state.selectedCombo.diversityType || '')}; models reference canonical accent folders only.</span>` : `${state.cache.length}/3 biomes cached. Add ${Math.max(0,3-state.cache.length)} more for a full crossover.`; }
  renderLayerMixer();
}
function renderLayerMixer(){
  const box=$('csVoiceLayerMixer'); if(!box) return;
  if(!state.layers.length) resetLayersFromBiomes([state.selectedAccentId || selectedVoiceBiome()?.id || DATA.biomes?.[0]?.id]);
  box.innerHTML = state.layers.map((l,idx)=>{ const b=byBiomeId[l.biomeId]||{}; const models=b.modelChoices||[]; const norm = normalizedLayers().find(x=>x.biomeId===l.biomeId)?.normalizedWeight || 0; return `<div class="voice-world-layer ${l.enabled?'':'disabled'}" data-layer-index="${idx}">
    <header><strong>${esc(b.fantasyAccentName||l.biomeId)}</strong><span>${esc(b.baseAccentInspiration||'')} · normalized ${(norm*100).toFixed(1)}%</span></header>
    <div class="voice-world-layer-grid">
      <label><input type="checkbox" data-layer-enabled="${idx}" ${l.enabled?'checked':''} style="width:auto;min-height:auto"> Enabled</label>
      <label>Intensity <output>${Number(l.intensityPercent||0).toFixed(1)}%</output><input type="range" min="0" max="100" step="1" value="${esc(l.intensityPercent)}" data-layer-intensity="${idx}"></label>
      <label>Model / reference<select data-layer-model="${idx}">${models.map(m=>`<option value="${esc(m.id)}" ${m.id===l.modelId?'selected':''}>${esc(m.label||m.id)}</option>`).join('')}</select></label>
    </div>
    <p class="voice-world-mini">${esc(b.raceOverlayBehavior||'')} ${esc(b.classOverlayBehavior||'')}</p>
  </div>`}).join('');
  box.querySelectorAll('[data-layer-enabled]').forEach(el=>el.onchange=()=>{state.layers[+el.dataset.layerEnabled].enabled=el.checked; updateAll();});
  box.querySelectorAll('[data-layer-intensity]').forEach(el=>el.oninput=()=>{state.layers[+el.dataset.layerIntensity].intensityPercent=+el.value; updateAll();});
  box.querySelectorAll('[data-layer-model]').forEach(el=>el.onchange=()=>{state.layers[+el.dataset.layerModel].modelId=el.value; updateAll();});
}
function normalizedLayers(){
  const sum = state.layers.filter(l=>l.enabled).reduce((a,l)=>a+(+l.intensityPercent||0),0) || 1;
  return state.layers.map(l=>Object.assign({}, l, {normalizedWeight: l.enabled ? (+l.intensityPercent||0)/sum : 0, fantasyAccentName:byBiomeId[l.biomeId]?.fantasyAccentName, baseAccentInspiration:byBiomeId[l.biomeId]?.baseAccentInspiration, model:modelById[l.modelId]||null}));
}
function normalizeLayersTo100(){
  const enabled = state.layers.filter(l=>l.enabled); if(!enabled.length) return;
  const v = Math.round((100/enabled.length)*100)/100;
  state.layers.forEach(l=>{ if(l.enabled) l.intensityPercent=v; }); updateAll();
}
function renderSliders(){
  const box=$('voiceSliders'); if(!box) return;
  box.innerHTML = sliderControls.map(s=>{ const val = state.sliderValues[s.key] ?? s.default; const max = s.max ?? (asPercentControl(s)?1:10); const min = s.min ?? 0; const step = s.step ?? (max<=1?.01:.1); const out = max<=1 ? Math.round(val*100)+'%' : Number(val).toFixed(1); return `<div class="slider-card" data-voice-world-slider-card="${esc(s.key)}"><header><strong>${esc(s.label)}</strong><output id="voiceWorldOut_${esc(s.key)}">${out}</output></header><input type="range" id="v_${esc(s.key)}" data-voice-world-slider="${esc(s.key)}" min="${min}" max="${max}" step="${step}" value="${esc(val)}"><div class="voice-world-slider-meta">${esc(s.underTheHood || s.controls || '')}</div></div>`; }).join('');
  box.querySelectorAll('[data-voice-world-slider]').forEach(input=>input.oninput=()=>{ state.sliderValues[input.dataset.voiceWorldSlider]=+input.value; updateAll(false); });
}
function collectSliderValuesFromDom(){
  sliderControls.forEach(s=>{ const el=$('v_'+s.key); if(el) state.sliderValues[s.key]=+el.value; });
  return defaultProfile();
}
function internalParameters(profile){
  const map=(v,a,b,c,d)=> c+(clamp(v,a,b)-a)*(d-c)/(b-a);
  return {f0:map(profile.pitch,0,10,-12,12), pitchRange:map(profile.inflection,0,10,.6,1.8), speechRate:map(profile.speed,0,10,.65,1.55), pauseDensity:map(profile.pauseControl,0,10,.35,1.65), breathNoiseMix:map(profile.breath,0,10,0,.35), roughnessAmount:map(profile.roughness,0,10,0,.5), formantShift:map(profile.resonance,0,10,-.18,.18), articulationPrecision:map(profile.clarity,0,10,.35,1), vowelStretch:map(profile.vowelFlow,0,10,.75,1.35), consonantSharpness:map(profile.consonantBite,0,10,.5,1.5), mouthOpenness:map(profile.mouthShape,0,10,.7,1.3), nasality:map(profile.nasality,0,10,0,1), throatPlacement:map(profile.throatDepth,0,10,-1,1), rhythmicBounce:map(profile.rhythm,0,10,.5,1.5), emphasisStrength:map(profile.emphasis,0,10,.5,1.5), warmth:map(profile.warmth,0,10,0,1), projection:map(profile.projection,0,10,.35,1), humanVariation:map(profile.humanVariation,0,10,0,1), accentStrength:(profile.accentColor||0)/10, influenceRace:profile.influenceRace, influenceGender:profile.influenceGender, influencePersonality:profile.influencePersonality, influenceBiome:profile.influenceBiome, influenceBaseAudio:profile.influenceBaseAudio, emotionIntensity:profile.emotionIntensity};
}
function characterContext(){
  return { characterName:$('voiceName')?.value || $('characterName')?.value || '', race:$('voiceRace')?.value || $('raceSelect')?.value || '', genderIdentity:$('voiceGender')?.value || $('genderIdentity')?.value || '', pronouns:$('voicePronounWriteIn')?.value || $('pronouns')?.value || '', className:$('voiceClass')?.value || $('primaryClass')?.value || '', subclass:$('voiceSubclass')?.value || $('primarySubclass')?.value || '', alignment:$('voiceAlignmentName')?.value || $('voiceAlignment')?.value || '', emotion:$('voiceLabEmotion')?.value || '', personality:$('voiceNotes')?.value || '' };
}
function buildPayload(){
  const profile = collectSliderValuesFromDom();
  const layers = normalizedLayers();
  const primary = byBiomeId[state.selectedAccentId] || selectedVoiceBiome() || DATA.biomes?.[0] || {};
  const payload = { schema:'belavados.characterStudio.voiceWorldProfile.v3', source:'character-studio-page-3-and-page-2-sheet', generatedAt:new Date().toISOString(), text:getTextLine(), forceEnglishOutput:true, selectedAccent:{biomeId:primary.id, fantasyAccentName:primary.fantasyAccentName, baseAccentInspiration:primary.baseAccentInspiration}, selectedCrossover: state.selectedCombo ? {id:state.selectedCombo.id, accentBlendName:state.selectedCombo.accentBlendName, biomeIds:state.selectedCombo.biomeIds, diversityType:state.selectedCombo.diversityType} : null, layers, enabledLayers: layers.filter(l=>l.enabled&&l.normalizedWeight>0), voiceProfile:profile, internalParameters:internalParameters(profile), overlays:{race:selectedRaceOverlay(), className:selectedClassOverlay()}, characterContext:characterContext(), safety:{allowedAssetPermissionTypes:['own_voice','licensed_actor','public_domain_character_asset','synthetic_original'], unknownAssetsBlocked:true}, transport:{oneActiveClipOnly:true, controls:['play_resume','pause','stop','rewind_5_seconds','forward_5_seconds']}, backendAction:'voice.jobs.create' };
  state.lastPayload=payload; return payload;
}
function renderPayload(){
  const payload=buildPayload();
  const out=$('csVoiceEnginePayload'); if(out) out.value=pretty(payload);
  const exp=$('voiceExport'); if(exp) exp.value=pretty(payload);
  const summary=$('voiceSummary'); if(summary) summary.innerHTML = `<p><strong>${esc(payload.selectedCrossover?.accentBlendName || payload.selectedAccent?.fantasyAccentName || 'Voice')}</strong></p><p>${payload.enabledLayers.map(l=>`${esc(l.fantasyAccentName)} ${(l.normalizedWeight*100).toFixed(1)}%`).join(' · ')}</p><p>Race overlay: ${esc(payload.overlays.race)}<br>Class overlay: ${esc(payload.overlays.className)}</p><pre class="voice-world-readout">${esc(pretty(payload.internalParameters))}</pre>`;
  const inf=$('csInfluenceSummary'); if(inf) inf.textContent = `Race/class overlays active. Accent strength ${(payload.voiceProfile.influenceBiome*100).toFixed(0)}%, emotion ${(payload.voiceProfile.emotionIntensity*100).toFixed(0)}%, base audio ${(payload.voiceProfile.influenceBaseAudio*100).toFixed(0)}%.`;
  updateSheetPanel(payload);
  return payload;
}
function updateAll(rerenderLayers=true){
  sliderControls.forEach(s=>{ const out=$('voiceWorldOut_'+s.key); if(out){ const v=state.sliderValues[s.key] ?? s.default; out.textContent=(s.max<=1 ? Math.round(v*100)+'%' : Number(v).toFixed(1)); }});
  if(rerenderLayers) renderLayerMixer();
  renderPayload();
}
function stopOtherMedia(except){
  $$('audio,video').forEach(m=>{ if(m!==except){ try{m.pause();}catch(e){} } });
  if(except !== 'speech') try{ speechSynthesis.cancel(); }catch(e){}
}
function speechTextFromIndex(index){ const words = getTextLine().split(/\s+/).filter(Boolean); state.speech.words=words; const start=clamp(index||0,0,Math.max(0,words.length-1)); state.speech.wordIndex=start; return words.slice(start).join(' '); }
function currentSpeechIndex(deltaSeconds){
  const profile=collectSliderValuesFromDom(); const wps = 2.3*(profile.speed||5)/5; const deltaWords = Math.round(deltaSeconds*wps); return clamp((state.speech.wordIndex||0)+deltaWords,0,Math.max(0,(state.speech.words||[]).length-1));
}
function speak(fields){
  const payload=renderPayload(); stopOtherMedia('speech');
  const startIndex=fields?.wordIndex ?? state.speech.wordIndex ?? 0; const text=speechTextFromIndex(startIndex);
  const u = new SpeechSynthesisUtterance(text || payload.text); state.speech.utterance=u;
  const p=payload.voiceProfile; u.rate=clamp(.65 + (p.speed/10)*.9, .1, 2); u.pitch=clamp(.55 + (p.pitch/10)*.9, .1, 2); u.volume=clamp(.35 + (p.projection/10)*.65, 0, 1);
  const voices=speechSynthesis.getVoices();
  const accent=(payload.selectedAccent?.baseAccentInspiration||'').toLowerCase();
  const prefer=voices.find(v=> accent.includes('french') && /fr/i.test(v.lang)) || voices.find(v=>accent.includes('german')&&/de/i.test(v.lang)) || voices.find(v=>accent.includes('italian')&&/it/i.test(v.lang)) || voices.find(v=>accent.includes('spanish')&&/es/i.test(v.lang)) || voices.find(v=>accent.includes('portuguese')&&/pt/i.test(v.lang)) || voices.find(v=>accent.includes('russian')&&/ru/i.test(v.lang)) || voices.find(v=>/en/i.test(v.lang));
  if(prefer) u.voice=prefer;
  u.onend=()=>{ state.speech.wordIndex=0; setStatus('Speech preview finished.'); };
  try{ speechSynthesis.cancel(); speechSynthesis.speak(u); setStatus('Speaking weighted character voice preview.'); }catch(e){ setStatus('Speech preview unavailable in this browser.'); }
  return payload;
}
function pause(){ try{ speechSynthesis.pause(); setStatus('Speech paused.'); }catch(e){} }
function resume(){ try{ speechSynthesis.resume(); setStatus('Speech resumed.'); }catch(e){} }
function stop(){ try{ speechSynthesis.cancel(); }catch(e){} $$('audio,video').forEach(m=>{try{m.pause();m.currentTime=0;}catch(e){}}); setStatus('All voice media stopped.'); }
function seekSpeech(delta){ const next=currentSpeechIndex(delta); try{ speechSynthesis.cancel(); }catch(e){}; state.speech.wordIndex=next; speak({wordIndex:next}); }
function wireAudio(){
  $$('audio,video').forEach(media=>{
    if(media.dataset.voiceWorldWired) return; media.dataset.voiceWorldWired='1';
    media.addEventListener('play',()=>{ stopOtherMedia(media); state.activeAudio=media; });
  });
  const audio=$('voiceLabAudio');
  const bind=(id,fn)=>{ const el=$(id); if(el && !el.dataset.voiceWorldBound){ el.dataset.voiceWorldBound='1'; el.addEventListener('click', ev=>{ev.preventDefault(); ev.stopPropagation(); fn();}, true); }};
  bind('voicePlayAssetBtn',()=>{ if(audio){ stopOtherMedia(audio); audio.play().catch(()=>setStatus('No playable audio asset loaded.')); }});
  bind('voicePauseAssetBtn',()=>audio&&audio.pause()); bind('voiceStopAssetBtn',()=>{ if(audio){audio.pause();audio.currentTime=0;} }); bind('voiceRewindAssetBtn',()=>{ if(audio) audio.currentTime=Math.max(0,audio.currentTime-5); }); bind('voiceForwardAssetBtn',()=>{ if(audio) audio.currentTime=Math.min(audio.duration||audio.currentTime+5,audio.currentTime+5); });
  bind('voiceSpeakTypedBtn',()=>speak()); bind('speakPreviewBtn',()=>speak()); bind('forgeSpeakPreviewBtn',()=>speak()); bind('voicePauseSpeechBtn',pause); bind('voiceResumeSpeechBtn',resume); bind('voiceRestartSpeechBtn',()=>{state.speech.wordIndex=0;speak({wordIndex:0});}); bind('voiceStopSpeechBtn',stop); bind('stopSpeakBtn',stop); bind('csVoiceRewindSpeechBtn',()=>seekSpeech(-5)); bind('csVoiceForwardSpeechBtn',()=>seekSpeech(5));
}
function updateSheetPanel(payload){
  const frame=$('characterSheetFrame'); if(!frame) return;
  let doc=null; try{ doc=frame.contentDocument; }catch(e){ return; }
  if(!doc || !doc.body) return;
  let panel=doc.getElementById('characterStudioVoiceWorldSheetPanel');
  if(!panel){ panel=doc.createElement('section'); panel.id='characterStudioVoiceWorldSheetPanel'; panel.className='voice-world-sheet-panel'; doc.body.insertBefore(panel, doc.body.firstChild); }
  panel.innerHTML = `<h2>Character Voice + Biome Cache</h2><p>${esc(payload.selectedCrossover?.accentBlendName || payload.selectedAccent?.fantasyAccentName || 'No voice selected')}</p><p>${payload.enabledLayers.map(l=>`<span class="voice-world-pill">${esc(l.fantasyAccentName)} ${(l.normalizedWeight*100).toFixed(1)}%</span>`).join('')}</p><p><strong>Line:</strong> ${esc(payload.text)}</p><p><strong>Race/Class:</strong> ${esc(payload.characterContext.race || payload.overlays.race)} / ${esc(payload.characterContext.className || payload.overlays.className)}</p>`;
}
async function sendVoiceJob(){
  const payload=buildPayload(); setStatus('Sending voice job...');
  try{
    const res = await fetch(BACKEND_URL, {method:'POST', mode:'cors', headers:{'Content-Type':'text/plain;charset=utf-8'}, body: JSON.stringify(Object.assign({action:'voice.jobs.create'}, payload))});
    const text = await res.text(); let data; try{ data=JSON.parse(text); }catch(e){ data={raw:text}; }
    setStatus(data.ok ? 'Voice job accepted by backend.' : 'Backend returned a response but did not accept the job.');
    const out=$('csVoiceEnginePayload'); if(out) out.value=pretty({request:payload, response:data});
  }catch(err){ setStatus('Could not reach backend from this browser. Payload remains ready for export.'); const out=$('csVoiceEnginePayload'); if(out) out.value=pretty({request:payload, backendError:String(err)}); }
}
function savePreset(){ localStorage.setItem('belavados.characterStudio.voiceWorldPreset', pretty(buildPayload())); setStatus('Voice preset saved in this browser.'); }
function loadPreset(){ try{ const p=JSON.parse(localStorage.getItem('belavados.characterStudio.voiceWorldPreset')||'{}'); if(p.voiceProfile){ state.sliderValues=Object.assign(state.sliderValues,p.voiceProfile); renderSliders(); } if(p.layers){ state.layers=p.layers.map(l=>({biomeId:l.biomeId,enabled:l.enabled,intensityPercent:l.intensityPercent,modelId:l.modelId})); } if(p.selectedCrossover?.biomeIds){ state.cache=[...p.selectedCrossover.biomeIds]; state.selectedCombo=combosByKey[comboKey(state.cache)]||null; } renderCache(); updateAll(); setStatus('Voice preset loaded from this browser.'); }catch(e){ setStatus('No saved preset found.'); } }
function registerAdapter(){
  const adapter = { speak, pause, resume, stop, findMatchingAsset(){ renderPayload(); setStatus('Matching assets refreshed from character voice model registry.'); }, exportProfile(){ return buildPayload(); } };
  if(window.BelavadosVoiceBridge?.registerAdapter) window.BelavadosVoiceBridge.registerAdapter(adapter);
  window.makeVoiceExport = function(){ return buildPayload(); };
  window.buildVoiceProfile = function(){ renderPayload(); return buildPayload(); };
  window.speakPreview = function(){ return speak(); };
  window.BelavadosCharacterVoiceWorld = {data:DATA, state, buildPayload, sendVoiceJob, speak, pause, resume, stop, seekSpeech};
}
function wireControls(){
  const bind=(id,fn,event='click')=>{ const el=$(id); if(el && !el.dataset.voiceWorldAction){el.dataset.voiceWorldAction='1';el.addEventListener(event,fn);} };
  bind('csAddBiomeCache',()=>addBiomeToCache($('csVoiceBiomeCacheSelect')?.value)); bind('csClearBiomeCache',()=>{state.cache=[];state.selectedCombo=null;resetLayersFromBiomes([state.selectedAccentId||selectedVoiceBiome()?.id]);renderCache();updateAll();}); bind('csPullCharacterBiome',()=>addBiomeToCache(selectedVoiceBiome()?.id)); bind('csAccentProfileSelect',renderAccentProfile,'change'); bind('csSingleModelSelect',updateAll,'change'); bind('csVoiceRaceOverlay',updateAll,'change'); bind('csVoiceClassOverlay',updateAll,'change'); bind('csNormalizeLayers',normalizeLayersTo100); bind('csResetLayers',()=>{resolveComboFromCache();renderCache();updateAll();}); bind('csBuildVoicePayload',()=>{renderPayload();setStatus('Voice payload built.');}); bind('csSendVoiceJob',sendVoiceJob); bind('csSaveVoicePreset',savePreset); bind('csLoadVoicePreset',loadPreset);
  ['voiceLabText','previewText','voiceName','voiceRace','voiceGender','voiceClass','voiceSubclass','voiceBiome','voiceNotes','characterName','raceSelect','primaryClass','primarySubclass'].forEach(id=>{ const el=$(id); if(el && !el.dataset.voiceWorldInput){ el.dataset.voiceWorldInput='1'; el.addEventListener('input',()=>updateAll(false)); el.addEventListener('change',()=>{ if(id==='voiceBiome'){ const b=selectedVoiceBiome(); if(b&&$('csAccentProfileSelect')) $('csAccentProfileSelect').value=b.id; renderAccentProfile(); } else updateAll(false); }); }});
}
function init(){
  ensureUi(); populateSelects(); state.sliderValues=Object.assign(defaultProfile(), state.sliderValues); renderSliders(); renderAccentProfile(); renderCache(); wireControls(); wireAudio(); registerAdapter(); renderPayload();
  const frame=$('characterSheetFrame'); if(frame && !frame.dataset.voiceWorldSheetBound){ frame.dataset.voiceWorldSheetBound='1'; frame.addEventListener('load',()=>setTimeout(()=>updateSheetPanel(buildPayload()),250)); }
  setStatus('Character Studio Voice World ready.');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(init,120)); else setTimeout(init,120);
})();
