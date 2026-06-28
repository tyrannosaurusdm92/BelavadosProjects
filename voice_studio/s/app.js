import { loadJson, groupRaces, debounce } from './data-loader.js';
import { buildVoiceProfile, SLIDER_DEFS, MOODS, CONTEXTS } from './voice-profile.js';
import { renderProfileToWav, downloadBlob, playBlob, speakWithBrowser } from './audio-renderer.js';
import { postToBackend, dataUrlFromBackendResponse, BACKEND_URL } from './backend-client.js';
import { renderAssistantCards, runAllAssistants } from './smart-assistants.js';
import { decideVoiceSource, summarizeDecision } from './voice-source-bot.js';
import { createZipBlob, safeFilePart } from './zip-export.js';
import { initSuperbotVoiceBrain } from './superbot-voice-brain.js';

const $ = sel => document.querySelector(sel);
const LOCKED_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec';
const state = {
  biomeMap:[],
  raceFlat:[],
  raceGroups:[],
  sourceManifest:[],
  currentProfile:null,
  selectedSource:null,
  selectedSourceIndex:-1,
  botDecision:null,
  sourceStale:true,
  thinkingTimer:null,
  thinkingStarted:0,
  thinkingDuration:60000
};

function notifySuperbot(event, detail={}){ try{ window.VoiceStudioSuperbot?.recordVoiceEvent?.(event, detail); }catch(_err){} }
function option(el, value, label=value){ const o=document.createElement('option'); o.value=value; o.textContent=label; el.appendChild(o); return o; }
function status(el, msg, cls=''){ if(!el) return; el.textContent=msg; el.className='status '+cls; }
function resourceConfig(){ return window.VOICE_STUDIO_RESOURCE_CONFIG || { voiceRoot:'r/v/', voiceManifest:'s/voices.json', voicePathMap:'r/v/path_map.json', maxFilesPerFolder:950 }; }
function normalizeVoicePath(path){
  const value=String(path||'');
  if(!value) return value;
  const cfg=resourceConfig();
  const root=cfg.voiceRoot || 'r/v/';
  if(root === 'r/v/' && value.startsWith('v/')) return `r/${value}`;
  return value;
}
function sourceLabel(s){ return s ? `${s.speaker || s.source || 'source'} — ${String(s.phrase || s.tag || s.file || '').replace(/^\s+|\s+$/g,'')}` : 'Activate bot to choose source'; }
function toBackendVoiceProfile(sliders={}){
  return {
    pitch: Number(sliders.pitch ?? 5),
    speed: Number(sliders.speed ?? 5),
    inflection: Number(sliders.inflection ?? 5),
    pauseControl: Number(sliders.phrase ?? 5),
    breath: Number(sliders.breath ?? 3),
    roughness: Number(sliders.roughness ?? 3),
    resonance: Number(sliders.formant ?? 5),
    clarity: Math.max(0, Math.min(10, 10 - Number(sliders.stutter ?? 0) * 0.5)),
    vowelFlow: Number(sliders.phrase ?? 5),
    consonantBite: Number(sliders.emphasis ?? 5),
    mouthShape: Number(sliders.timbre ?? 5),
    nasality: Number(sliders.nasal ?? 2),
    throatDepth: Number(sliders.formant ?? 5),
    rhythm: Number(sliders.speed ?? 5),
    emphasis: Number(sliders.emphasis ?? 5),
    warmth: Math.max(0, Math.min(10, 10 - Number(sliders.roughness ?? 3) * 0.45)),
    projection: Number(sliders.emphasis ?? 5),
    humanVariation: Math.max(0, Math.min(10, 10 - Number(sliders.construct ?? 0))),
    accentColor: Number(sliders.accent ?? 6),
    influenceRace: 1,
    influenceGender: 1,
    influencePersonality: 1,
    influenceBiome: 1,
    influenceBaseAudio: 1,
    emotionIntensity: Number(sliders.emotion ?? 5) / 10
  };
}
function characterContextForBackend(profile, input=profileInput()){
  return {
    characterName: profile?.character?.name || input.name || '',
    race: profile?.character?.race || input.race || '',
    ancestry: profile?.character?.category || input.category || '',
    genderIdentity: profile?.character?.genderIdentity || input.genderIdentity || '',
    className: profile?.character?.classRole || input.classRole || '',
    personality: profile?.character?.personality || input.personality || '',
    emotion: profile?.mood || input.mood || 'Neutral/Base',
    notes: [profile?.context || input.context || '', profile?.accent?.fantasyAccent || '', profile?.sourceVoice?.speaker || ''].filter(Boolean).join(' | ')
  };
}
function backendPayloadFromProfile(profile, extra={}){
  const biome=selectedBiome() || profile?.accent || {};
  const input=profileInput();
  return {
    backend:'universal',
    appBackend:'universal',
    projectId:'voice_studio',
    pageUrl:'https://tyrannosaurusdm92.github.io/BelavadosProjects/voice_studio/index.html',
    biomeId: biome.id || biome.biome || input.biome,
    biome: biome.biome || input.biome,
    race: input.race,
    ancestry: input.category,
    genderIdentity: input.genderIdentity,
    className: input.classRole,
    emotion: input.mood,
    mood: input.mood,
    context: input.context,
    characterName: input.name,
    text: ($('#speechText')?.value || 'This is what I sound like.'),
    voiceProfile: toBackendVoiceProfile(profile?.sliders || sliderOverrides()),
    sliders: toBackendVoiceProfile(profile?.sliders || sliderOverrides()),
    characterContext: characterContextForBackend(profile, input),
    layers: [{ biomeId: biome.id || biome.biome || input.biome, intensityPercent: 100, enabled: true }],
    sourceVoice: profile?.sourceVoice || state.selectedSource || null,
    sourceDecision: profile?.sourceDecision || state.botDecision || null,
    makePublic: true,
    forceEnglishOutput: true,
    ...extra
  };
}
function conversationPacket(input){
  const text = [input?.name, input?.genderIdentity, input?.biome, input?.race, input?.lineage, input?.classRole, input?.personality, input?.mood, input?.context].filter(Boolean).join(' ');
  try{
    if(window.ConversationScannerRandomizer?.scanConversation){ return window.ConversationScannerRandomizer.scanConversation(text, { topics:['voice','dnd','belavados'], tone:'practical' }); }
  }catch(_err){}
  return { rawText:text, topics:['voice','dnd'], moods:[], needs:['taskHelp'], intents:['voice-source'] };
}
async function syncBotDecisionWithBackend(decision){
  if(!decision?.selected) return decision;
  const input=profileInput();
  const p=state.currentProfile || rebuildProfile(true);
  const conversation=conversationPacket(input);
  try{
    const resolveResponse=await postToBackend('voice.source.resolve', backendPayloadFromProfile(p, {
      phrase: $('#speechText')?.value || 'This is what I sound like.',
      conversation,
      frontendSelectedSource: decision.selected
    }));
    state.botDecision = {
      ...decision,
      backendResolved: resolveResponse,
      backendSourceModelId: resolveResponse?.sourceModelId || resolveResponse?.sourceModel || null,
      backendSourceName: resolveResponse?.sourceName || null,
      backendVoiceProfile: resolveResponse?.voiceProfile || null,
      reasons: [...(decision.reasons||[]), resolveResponse?.sourceModelId ? `backend model: ${resolveResponse.sourceModelId}` : 'backend voice.source.resolve checked'].slice(0,12)
    };
    if(resolveResponse?.voiceProfile){
      state.currentProfile.backendVoiceProfile = resolveResponse.voiceProfile;
      state.currentProfile.backendVoiceJobTemplate = resolveResponse.voiceJobTemplate || null;
    }
    try{
      const intent=await postToBackend('bots.decide', {
        backend:'universal',
        message: conversation.rawText || JSON.stringify(input),
        text: conversation.rawText || JSON.stringify(input),
        context: { app:'Voice Studio', task:'voice-source-selection', input, localDecision:decision.selected, backendResolve:resolveResponse }
      });
      state.botDecision.backendIntent = intent;
    }catch(_intentErr){}
    status($('#botDecisionStatus'), summarizeDecision(state.botDecision)+`\nBackend: ${resolveResponse?.sourceModelId || resolveResponse?.sourceName || resolveResponse?.note || 'resolved/checked'}`, resolveResponse?.ok===false ? 'bad':'ok');
    updateOutputs();
  }catch(err){
    state.botDecision = { ...decision, backendError: err.message };
    status($('#botDecisionStatus'), summarizeDecision(state.botDecision)+`\nBackend source resolve failed; local bot decision remains active. ${err.message}`, 'bad');
  }
  return state.botDecision;
}
function selectedBiome(){ return state.biomeMap.find(b=>b.biome===$('#biomeSelect')?.value) || state.biomeMap[0]; }
function selectedSource(){ return state.selectedSource || null; }
function sliderOverrides(){ const out={}; for(const [id] of SLIDER_DEFS){ const el=$(`#slider_${id}`); if(el) out[id]=Number(el.value); } return out; }
function profileInput(){
  const cat = state.raceGroups.find(g=>g.id===$('#raceCategory')?.value);
  const race = state.raceFlat.find(r=>r.raceId===$('#raceSelect')?.value) || {};
  const lineage = (race.lineages||[]).find(l=>l.id===$('#lineageSelect')?.value) || {};
  return {
    name:$('#characterName')?.value.trim() || '',
    genderIdentity:$('#genderIdentity')?.value || '',
    category:cat?.name||'',
    race:race.race||'',
    lineage:lineage.name||'',
    biome:$('#biomeSelect')?.value || '',
    classRole:$('#classRole')?.value.trim() || '',
    personality:$('#personality')?.value.trim() || '',
    mood:$('#moodSelect')?.value || 'Neutral/Base',
    context:$('#contextSelect')?.value || 'Campfire conversation'
  };
}
function rebuildProfile(withSliders=false){
  state.currentProfile = buildVoiceProfile(profileInput(), selectedBiome(), selectedSource(), withSliders ? sliderOverrides() : {});
  if(state.botDecision) state.currentProfile.sourceDecision = state.botDecision;
  updateOutputs();
  return state.currentProfile;
}
function updateOutputs(){
  const p=state.currentProfile;
  const tone=$('#toneprintOut'); if(tone) tone.textContent=JSON.stringify(p||{}, null, 2);
  const explain=$('#accentExplain');
  if(!explain) return;
  if(p?.accent){ explain.innerHTML=`<p><strong>${p.accent.fantasyAccent}</strong> / ${p.accent.baseAccent}</p><p>${p.accent.raceOverlay}</p><p>${p.accent.classOverlay}</p><p><em>${p.accent.finalFeel}</em></p><p>${(p.explanations||[]).map(x=>`<span class="pill">${x}</span>`).join(' ')}</p>`; }
  else explain.textContent='No accent selected.';
  const botOut=$('#botDecisionStatus');
  if(botOut) status(botOut, state.sourceStale ? 'Voice source bot needs activation after the latest dropdown/input change.' : summarizeDecision(state.botDecision), state.sourceStale ? '' : 'ok');
}
function markSourceStale(){
  state.sourceStale=true;
  state.selectedSource=null;
  state.selectedSourceIndex=-1;
  state.botDecision=null;
  populateSources();
  rebuildProfile(true);
}
function populateStatic(){
  for(const m of MOODS) option($('#moodSelect'), m);
  for(const c of CONTEXTS) option($('#contextSelect'), c);
  const genders = ['Agender','Bi-Gender','Cis-Female','Cis-Male','Demi-Female','Demi-Male','Gender-Flexible','Gender-Fluid','Gender-Less','Neutrois','Non-Binary','Poly-Gender','Trans-Female','Trans-Male','Custom / write-in'];
  for(const g of genders) option($('#genderIdentity'), g);
  $('#speechText').value='This is what I sound like when I warn travelers not to enter the drowned ruins.';
}
function populateBiomes(){ $('#biomeSelect').innerHTML=''; for(const b of state.biomeMap) option($('#biomeSelect'), b.biome, `${b.biome} — ${b.fantasyAccent} (${b.baseAccent})`); }
function populateRaces(){ $('#raceCategory').innerHTML=''; for(const g of state.raceGroups) option($('#raceCategory'), g.id, g.name); updateRaceDropdown(); }
function updateRaceDropdown(){
  const group=state.raceGroups.find(g=>g.id===$('#raceCategory').value) || state.raceGroups[0];
  $('#raceSelect').innerHTML=''; for(const r of group?.races||[]) option($('#raceSelect'), r.raceId, r.race);
  updateLineageDropdown();
}
function updateLineageDropdown(){
  const race=state.raceFlat.find(r=>r.raceId===$('#raceSelect').value);
  $('#lineageSelect').innerHTML=''; option($('#lineageSelect'),'','None / not applicable');
  for(const l of race?.lineages||[]) option($('#lineageSelect'), l.id, l.name);
}
function populateSources(){
  const select=$('#voiceSourceSelect');
  if(!select) return;
  select.innerHTML='';
  if(state.selectedSource && state.selectedSourceIndex >= 0) option(select, String(state.selectedSourceIndex), `BOT PICK: ${sourceLabel(state.selectedSource)}`);
  else option(select, '', 'Activate voice source bot to choose automatically');
  select.disabled = true;
  select.setAttribute('aria-readonly','true');
}
function populateSliders(profile){
  const grid=$('#sliderGrid'); grid.innerHTML='';
  const values=profile?.sliders || Object.fromEntries(SLIDER_DEFS.map(([id,,def])=>[id,def]));
  for(const [id,label] of SLIDER_DEFS){
    const line=document.createElement('div'); line.className='slider-line';
    line.innerHTML=`<b>${label}</b><input id="slider_${id}" type="range" min="0" max="10" step="0.1" value="${values[id]??5}"/><span>${Number(values[id]??5).toFixed(1)}</span>`;
    const input=line.querySelector('input'); const span=line.querySelector('span');
    input.addEventListener('input',()=>{span.textContent=Number(input.value).toFixed(1); rebuildProfile(true);});
    grid.appendChild(line);
  }
}
function finalizeBotDecision(){
  const decision=decideVoiceSource(state.sourceManifest, profileInput(), selectedBiome());
  state.botDecision=decision;
  state.selectedSource=decision.selected;
  state.selectedSourceIndex=decision.selectedIndex;
  state.sourceStale=false;
  populateSources();
  renderSources();
  const p=rebuildProfile(true);
  populateSliders(p);
  status($('#botDecisionStatus'), summarizeDecision(decision), decision.ok ? 'ok' : 'bad');
  notifySuperbot('voice.source.localDecision', { summary:summarizeDecision(decision), decision });
  return decision;
}
function startThinking(){
  rebuildProfile(false); populateSliders(state.currentProfile);
  state.thinkingStarted = performance.now(); clearInterval(state.thinkingTimer);
  $('#thinkMeter').style.width='0%';
  const lines = [
    'Voice Source Bot is reading biome accent + gender identity anchors…',
    'Profile Architect is stabilizing character identity…',
    'Accent Mapper is combining biome, race, and lineage texture…',
    'Mood Director is shaping speech rhythm without making a song…',
    'JARVIS Router is checking the locked backend and export routes…',
    'Source Matcher is scoring every available voice sample…',
    'Audit Guard is confirming fictional/consent-safe scope…'
  ];
  status($('#botDecisionStatus'),'Voice Source Bot activated. It will decide the source model/sample at the end of the 1-minute pass.');
  state.thinkingTimer=setInterval(()=>{
    const elapsed=performance.now()-state.thinkingStarted; const ratio=Math.min(1,elapsed/state.thinkingDuration);
    $('#thinkMeter').style.width=`${ratio*100}%`;
    const idx=Math.min(lines.length-1, Math.floor(ratio*lines.length));
    status($('#thinkStatus'), `${lines[idx]} ${Math.round(ratio*100)}%`);
    if(ratio>=1) finishThinking();
  },250);
}
async function finishThinking(){
  clearInterval(state.thinkingTimer); $('#thinkMeter').style.width='100%';
  const decision=finalizeBotDecision();
  status($('#thinkStatus'), 'Voice profile built locally. Checking locked backend voice.source.resolve…', decision.ok ? 'ok' : 'bad');
  await syncBotDecisionWithBackend(decision);
  status($('#thinkStatus'), 'Voice profile built. Helper summary:\n'+summarizeDecision(state.botDecision || decision)+'\n\n'+runAllAssistants(()=>state.currentProfile), (state.botDecision || decision).ok ? 'ok' : 'bad');
  renderAssistantCards($('#assistantGrid'),()=>state.currentProfile);
}
function saveLocal(){
  if(state.sourceStale) finalizeBotDecision();
  const p=rebuildProfile(true); const key='voiceStudioProfiles'; const arr=JSON.parse(localStorage.getItem(key)||'[]');
  const next=[p,...arr.filter(x=>x.id!==p.id)].slice(0,50); localStorage.setItem(key,JSON.stringify(next)); renderSaved(); status($('#thinkStatus'),`Saved ${p.character.name} locally.`, 'ok');
}
function renderSaved(){
  const arr=JSON.parse(localStorage.getItem('voiceStudioProfiles')||'[]'); const box=$('#savedProfiles'); box.innerHTML='';
  if(!arr.length){box.textContent='No saved profiles yet.'; return;}
  for(const p of arr){ const d=document.createElement('div'); d.className='source-item'; d.innerHTML=`<strong>${p.character?.name||'Unnamed'}</strong><small>${p.accent?.fantasyAccent||'No accent'} · ${p.sourceVoice?.speaker || 'no source'} · ${p.id}</small>`; d.addEventListener('click',()=>{state.currentProfile=p; state.selectedSource=p.sourceVoice||null; state.botDecision=p.sourceDecision||null; state.selectedSourceIndex=state.sourceManifest.findIndex(s=>s.id===state.selectedSource?.id || s.file===state.selectedSource?.file); state.sourceStale=!state.selectedSource; populateSources(); populateSliders(p); updateOutputs(); renderSources();}); box.appendChild(d); }
}
function renderSources(){
  const q=$('#sourceSearch').value.toLowerCase(); const kind=$('#sourceKind').value; const box=$('#sourceResults'); box.innerHTML='';
  const decisionRows = state.botDecision?.runnerUp || [];
  const decisionIds = new Set([state.selectedSource?.id, ...decisionRows.map(x=>x.id)].filter(Boolean));
  const rows=state.sourceManifest.map((s,i)=>({...s,_i:i}))
    .filter(s=>kind==='all'||s.kind===kind)
    .filter(s=>!q||[s.source,s.speaker,s.file,s.kind,s.tag,s.phrase].join(' ').toLowerCase().includes(q) || decisionIds.has(s.id))
    .slice(0,120);
  if(state.selectedSource && !rows.some(x=>x.id===state.selectedSource.id)) rows.unshift({...state.selectedSource,_i:state.selectedSourceIndex});
  for(const s of rows){
    const d=document.createElement('div'); d.className='source-item'; if(s._i===state.selectedSourceIndex)d.classList.add('selected');
    const runner=decisionRows.find(x=>x.id===s.id); const score=s._i===state.selectedSourceIndex ? state.botDecision?.score : runner?.score;
    d.innerHTML=`<strong>${s._i===state.selectedSourceIndex?'BOT PICK: ':''}${s.speaker || s.source || 'source'}</strong><small>${s.kind || ''} · ${s.tag || ''} · ${s.phrase || ''}</small><small>${s.file}</small>${score?`<span class="pill">score ${score}</span>`:''}<span class="pill">${Math.round((s.bytes||0)/1024)} KB</span>`;
    d.title='Preview only — source selection is locked to the bot decision.';
    d.addEventListener('click',()=>{ if(!s?.file){return;} $('#audioPlayer').src=s.file; $('#audioPlayer').play?.(); status($('#speechStatus'),`Previewing source reference only: ${s.file}. Selection remains bot-locked.`, 'ok'); });
    box.appendChild(d);
  }
}
async function backendSpeech(){
  if(state.sourceStale) finalizeBotDecision();
  const p=rebuildProfile(true); const text=$('#speechText').value || 'This is what I sound like.';
  status($('#speechStatus'),'Requesting locked backend voice.synth.renderWav…');
  try{
    const response=await postToBackend('voice.synth.renderWav', backendPayloadFromProfile(p, {
      text,
      phrase:text,
      requestedFormat:'wav',
      outputFormats:['wav','json'],
      kind:'voice-studio-speech',
      durationSeconds: Math.min(30, Math.max(2, text.length / 12))
    }));
    const url=dataUrlFromBackendResponse(response);
    if(url){ $('#audioPlayer').src=url; $('#audioPlayer').play?.(); status($('#speechStatus'),`Backend returned/saved WAV using voice.synth.renderWav${response.wavExport?.filename?' — '+response.wavExport.filename:''}.`, 'ok'); return; }
    const blob=renderProfileToWav(text,p); playBlob(blob,$('#audioPlayer')); downloadBlob(blob,`${safeFilePart(p.character.name)}_${safeFilePart(p.sourceVoice?.speaker||'source')}.wav`);
    status($('#speechStatus'),`Backend did not return a playable WAV link, so local bot-source WAV fallback was rendered. Backend response: ${JSON.stringify(response).slice(0,500)}`, response?.ok===false?'bad':'ok');
  } catch(err){
    const blob=renderProfileToWav(text,p); playBlob(blob,$('#audioPlayer')); downloadBlob(blob,`${safeFilePart(p.character.name)}_${safeFilePart(p.sourceVoice?.speaker||'source')}_fallback.wav`);
    status($('#speechStatus'),`Backend voice.synth.renderWav failed; local bot-source WAV fallback rendered. ${err.message}`, 'bad');
  }
}
function renderWav(){
  if(state.sourceStale) finalizeBotDecision();
  const p=rebuildProfile(true); const blob=renderProfileToWav($('#speechText').value,p); playBlob(blob,$('#audioPlayer')); downloadBlob(blob,`${safeFilePart(p.character.name)}_${safeFilePart(p.sourceVoice?.speaker||'source')}.wav`); status($('#speechStatus'),'Local source-derived downloadable WAV rendered.', 'ok');
  notifySuperbot('voice.render.localWav', { summary:'Local source-derived WAV rendered.', profile:p });
}
function downloadProfile(){
  if(state.sourceStale) finalizeBotDecision();
  const p=rebuildProfile(true); const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}); downloadBlob(blob,`${safeFilePart(p.character.name||'voice_profile')}.json`);
}
async function downloadVoiceZip(){
  if(state.sourceStale) finalizeBotDecision();
  const p=rebuildProfile(true); const speechText=($('#speechText').value || '').trim() || 'This is what I sound like.';
  const sourceName=safeFilePart(p.sourceVoice?.speaker || p.sourceVoice?.source || 'source');
  const characterName=safeFilePart(p.character?.name || 'character');
  const folder=`${characterName}_${sourceName}`;
  const wavName=`${folder}.wav`;
  const wavBlob=renderProfileToWav(speechText,p);
  const manifest={
    schema:'voice_studio.character_voice_package.v2',
    generatedAt:new Date().toISOString(),
    githubPage:'https://tyrannosaurusdm92.github.io/BelavadosProjects/voice_studio/index.html',
    lockedBackendUrl:LOCKED_BACKEND_URL,
    character:p.character,
    accent:p.accent,
    mood:p.mood,
    context:p.context,
    speechText,
    sourceVoice:p.sourceVoice,
    sourceDecision:p.sourceDecision || state.botDecision,
    sliders:p.sliders,
    explanations:p.explanations,
    files:{ wav:`${folder}/${wavName}` },
    pathing:{ voiceRoot:resourceConfig().voiceRoot, voiceManifest:resourceConfig().voiceManifest, sourcePath:p.sourceVoice?.file || null },
    note:'The WAV is generated from the bot-selected source model/sample fingerprint plus the character profile, mood, context, and typed speech. The manifest preserves the embedded character information.'
  };
  const zip=await createZipBlob([
    {name:`${folder}/manifest.json`, content:JSON.stringify(manifest,null,2)},
    {name:`${folder}/${wavName}`, content:wavBlob}
  ]);
  downloadBlob(zip, `${folder}.zip`);
  playBlob(wavBlob,$('#audioPlayer'));
  status($('#speechStatus'),`Downloaded ${folder}.zip with manifest.json and ${wavName}.`, 'ok');
  notifySuperbot('voice.export.zip', { summary:`Downloaded ${folder}.zip`, manifest });
}
async function init(){
  populateStatic();
  const cfg=resourceConfig();
  state.biomeMap=await loadJson('s/biomes.json',[]);
  state.raceFlat=await loadJson('s/races.json',[]);
  state.sourceManifest=(await loadJson(cfg.voiceManifest || 's/voices.json',[])).map((item)=>({ ...item, file:normalizeVoicePath(item.file), folder:normalizeVoicePath(item.folder) }));
  state.raceGroups=groupRaces(state.raceFlat);
  populateBiomes(); populateRaces(); populateSources(); populateSliders(null); renderSaved(); renderAssistantCards($('#assistantGrid'),()=>state.currentProfile);
  rebuildProfile(false); renderSources();
  initSuperbotVoiceBrain({
    postToBackend,
    getProfile:()=>state.currentProfile,
    getInput:profileInput,
    rebuildProfile,
    activateVoiceBot:startThinking,
    getBackendPayload:(profile, extra={})=>backendPayloadFromProfile(profile || state.currentProfile || rebuildProfile(true), extra),
    lockedBackendUrl:LOCKED_BACKEND_URL
  });
  const backendEl=$('#backendUrl'); if(backendEl) backendEl.textContent=LOCKED_BACKEND_URL;
  if(BACKEND_URL !== LOCKED_BACKEND_URL) console.error('Backend URL mismatch blocked.', BACKEND_URL);
  $('#raceCategory').addEventListener('change',()=>{updateRaceDropdown(); markSourceStale();});
  $('#raceSelect').addEventListener('change',()=>{updateLineageDropdown(); markSourceStale();});
  ['lineageSelect','biomeSelect','genderIdentity','moodSelect','contextSelect'].forEach(id=>$('#'+id).addEventListener('change',()=>{markSourceStale(); populateSliders(state.currentProfile);}));
  ['characterName','classRole','personality'].forEach(id=>$('#'+id).addEventListener('input',debounce(()=>{markSourceStale();},250)));
  $('#activateVoiceBotBtn')?.addEventListener('click',startThinking);
  $('#thinkBtn')?.addEventListener('click',startThinking);
  $('#finishThinkBtn')?.addEventListener('click',finishThinking);
  $('#saveProfileBtn').addEventListener('click',saveLocal);
  $('#downloadProfileBtn').addEventListener('click',downloadProfile);
  $('#downloadVoiceZipBtn')?.addEventListener('click',downloadVoiceZip);
  $('#browserPreviewBtn').addEventListener('click',()=>{try{if(state.sourceStale) finalizeBotDecision(); speakWithBrowser($('#speechText').value,rebuildProfile(true)); status($('#speechStatus'),'Browser voice preview playing. Browser voices cannot always be exported, so use WAV/backend/ZIP for files.','ok');}catch(e){status($('#speechStatus'),e.message,'bad');}});
  $('#renderWavBtn').addEventListener('click',renderWav); $('#backendSpeechBtn').addEventListener('click',backendSpeech);
  $('#sourceSearch').addEventListener('input',debounce(renderSources,150)); $('#sourceKind').addEventListener('change',renderSources); $('#rescanSourcesBtn').addEventListener('click',renderSources);
  $('#previewSourceBtn').addEventListener('click',()=>{const s=selectedSource(); if(!s?.file){status($('#speechStatus'),'No bot-selected source file yet. Activate the voice source bot first.','bad');return;} $('#audioPlayer').src=s.file; $('#audioPlayer').play?.(); status($('#speechStatus'),`Playing bot-selected source reference: ${s.file}`,'ok');});
  $('#testBackendBtn').addEventListener('click',async()=>{status($('#backendStatus'),'Testing locked backend…'); try{const r=await postToBackend('health',{hello:'Voice Studio', contract:['voice.source.resolve','voice.synth.renderWav','presets.save','bots.decide'], lockedBackend:LOCKED_BACKEND_URL}); status($('#backendStatus'),`Backend response: ${JSON.stringify(r).slice(0,500)}`, r?.ok===false?'bad':'ok');}catch(e){status($('#backendStatus'),`Backend failed: ${e.message}`,'bad');}});
  $('#backendSaveBtn').addEventListener('click',async()=>{if(state.sourceStale) finalizeBotDecision(); const p=rebuildProfile(true); status($('#thinkStatus'),'Saving profile to locked backend…'); try{const r=await postToBackend('presets.save', backendPayloadFromProfile(p, { name:p.character?.name || 'Voice Studio Preset', tags:['voice-studio','bot-selected-source'], lockedBackend:LOCKED_BACKEND_URL })); status($('#thinkStatus'),`Backend save response: ${JSON.stringify(r).slice(0,500)}`, r?.ok===false?'bad':'ok');}catch(e){status($('#thinkStatus'),`Backend save failed: ${e.message}`,'bad');}});
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
init();
