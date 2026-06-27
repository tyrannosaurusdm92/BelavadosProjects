import { loadJson, groupRaces, chooseDefaultVoiceSource, debounce } from './data-loader.js';
import { buildVoiceProfile, describeProfile, SLIDER_DEFS, MOODS, CONTEXTS } from './voice-profile.js';
import { renderProfileToWav, downloadBlob, playBlob, speakWithBrowser } from './audio-renderer.js';
import { postToBackend, dataUrlFromBackendResponse } from './backend-client.js';
import { renderAssistantCards, runAllAssistants } from './smart-assistants.js';

const $ = sel => document.querySelector(sel);
const state = { biomeMap:[], raceFlat:[], raceGroups:[], sourceManifest:[], currentProfile:null, selectedSource:null, selectedSourceIndex:0, thinkingTimer:null, thinkingStarted:0, thinkingDuration:60000 };

function option(el, value, label=value){ const o=document.createElement('option'); o.value=value; o.textContent=label; el.appendChild(o); return o; }
function status(el, msg, cls=''){ el.textContent=msg; el.className='status '+cls; }
function profileInput(){
  const cat = state.raceGroups.find(g=>g.id===$('#raceCategory').value);
  const race = state.raceFlat.find(r=>r.raceId===$('#raceSelect').value) || {};
  const lineage = (race.lineages||[]).find(l=>l.id===$('#lineageSelect').value) || {};
  return { name:$('#characterName').value.trim(), genderIdentity:$('#genderIdentity').value, category:cat?.name||'', race:race.race||'', lineage:lineage.name||'', biome:$('#biomeSelect').value, classRole:$('#classRole').value.trim(), personality:$('#personality').value.trim(), mood:$('#moodSelect').value, context:$('#contextSelect').value };
}
function selectedBiome(){ return state.biomeMap.find(b=>b.biome===$('#biomeSelect').value) || state.biomeMap[0]; }
function selectedSource(){ return state.sourceManifest[Number($('#voiceSourceSelect').value)] || state.selectedSource || null; }
function sliderOverrides(){ const out={}; for(const [id] of SLIDER_DEFS){ const el=$(`#slider_${id}`); if(el) out[id]=Number(el.value); } return out; }
function rebuildProfile(withSliders=false){ state.currentProfile = buildVoiceProfile(profileInput(), selectedBiome(), selectedSource(), withSliders ? sliderOverrides() : {}); updateOutputs(); return state.currentProfile; }
function updateOutputs(){
  const p=state.currentProfile; $('#toneprintOut').textContent=JSON.stringify(p||{}, null, 2);
  if(p?.accent){ $('#accentExplain').innerHTML=`<p><strong>${p.accent.fantasyAccent}</strong> / ${p.accent.baseAccent}</p><p>${p.accent.raceOverlay}</p><p>${p.accent.classOverlay}</p><p><em>${p.accent.finalFeel}</em></p><p>${(p.explanations||[]).map(x=>`<span class="pill">${x}</span>`).join(' ')}</p>`; }
  else $('#accentExplain').textContent='No accent selected.';
}
function populateStatic(){
  for(const m of MOODS) option($('#moodSelect'), m);
  for(const c of CONTEXTS) option($('#contextSelect'), c);
  const genders = ['Agender','Bi-Gender','Cis-Female','Cis-Male','Demi-Female','Demi-Male','Gender-Flexible','Gender-Fluid','Gender-Less','Neutrois','Non-Binary','Poly-Gender','Trans-Female','Trans-Male','Custom / write-in'];
  for(const g of genders) option($('#genderIdentity'), g);
  $('#speechText').value='This is what I sound like when I warn travelers not to enter the drowned ruins.';
}
function populateBiomes(){ $('#biomeSelect').innerHTML=''; for(const b of state.biomeMap) option($('#biomeSelect'), b.biome, `${b.biome} — ${b.fantasyAccent} (${b.baseAccent})`); }
function populateRaces(){
  $('#raceCategory').innerHTML=''; for(const g of state.raceGroups) option($('#raceCategory'), g.id, g.name);
  updateRaceDropdown();
}
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
  $('#voiceSourceSelect').innerHTML='';
  state.sourceManifest.slice(0,1000).forEach((s,i)=> option($('#voiceSourceSelect'), String(i), `${s.speaker || s.source || 'source'} — ${String(s.file||'').split('/').pop()}`));
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
function startThinking(){
  const baseProfile = rebuildProfile(false); populateSliders(baseProfile);
  state.thinkingStarted = performance.now(); clearInterval(state.thinkingTimer);
  const lines = ['Profile Architect is stabilizing identity anchors…','Accent Mapper is layering biome, race, and class behavior…','Mood Director is shaping speech rhythm without making a song…','JARVIS Router is preparing preview and export routes…','Source Matcher is selecting reference samples…','Audit Guard is checking fictional/consent scope…'];
  state.thinkingTimer=setInterval(()=>{
    const elapsed=performance.now()-state.thinkingStarted; const ratio=Math.min(1,elapsed/state.thinkingDuration);
    $('#thinkMeter').style.width=`${ratio*100}%`;
    const idx=Math.min(lines.length-1, Math.floor(ratio*lines.length));
    status($('#thinkStatus'), `${lines[idx]} ${Math.round(ratio*100)}%`);
    if(ratio>=1) finishThinking();
  },250);
}
function finishThinking(){
  clearInterval(state.thinkingTimer); $('#thinkMeter').style.width='100%';
  const p=rebuildProfile(true); populateSliders(p);
  status($('#thinkStatus'), 'Voice profile built. Helper summary:\n'+runAllAssistants(()=>state.currentProfile), 'ok');
  renderAssistantCards($('#assistantGrid'),()=>state.currentProfile);
}
function saveLocal(){
  const p=rebuildProfile(true); const key='voiceStudioProfiles'; const arr=JSON.parse(localStorage.getItem(key)||'[]');
  const next=[p,...arr.filter(x=>x.id!==p.id)].slice(0,50); localStorage.setItem(key,JSON.stringify(next)); renderSaved(); status($('#thinkStatus'),`Saved ${p.character.name} locally.`, 'ok');
}
function renderSaved(){
  const arr=JSON.parse(localStorage.getItem('voiceStudioProfiles')||'[]'); const box=$('#savedProfiles'); box.innerHTML='';
  if(!arr.length){box.textContent='No saved profiles yet.'; return;}
  for(const p of arr){ const d=document.createElement('div'); d.className='source-item'; d.innerHTML=`<strong>${p.character?.name||'Unnamed'}</strong><small>${p.accent?.fantasyAccent||'No accent'} · ${p.mood||''} · ${p.id}</small>`; d.addEventListener('click',()=>{state.currentProfile=p; populateSliders(p); updateOutputs();}); box.appendChild(d); }
}
function renderSources(){
  const q=$('#sourceSearch').value.toLowerCase(); const kind=$('#sourceKind').value; const box=$('#sourceResults'); box.innerHTML='';
  const rows=state.sourceManifest.map((s,i)=>({...s,_i:i})).filter(s=>kind==='all'||s.kind===kind).filter(s=>!q||[s.source,s.speaker,s.file,s.kind].join(' ').toLowerCase().includes(q)).slice(0,120);
  for(const s of rows){ const d=document.createElement('div'); d.className='source-item'; if(s._i===state.selectedSourceIndex)d.classList.add('selected'); d.innerHTML=`<strong>${s.speaker || s.source || 'source'}</strong><small>${s.kind || ''}</small><small>${s.file}</small><span class="pill">${Math.round((s.bytes||0)/1024)} KB</span>`; d.addEventListener('click',()=>{state.selectedSourceIndex=s._i; state.selectedSource=s; $('#voiceSourceSelect').value=String(s._i); renderSources(); rebuildProfile(true);}); box.appendChild(d); }
}
async function backendSpeech(){
  const p=rebuildProfile(true); const text=$('#speechText').value;
  status($('#speechStatus'),'Requesting backend MP3/WAV…');
  try{
    const response=await postToBackend('generateSpeech',{profile:p,text,requestedFormat:'mp3-or-wav'});
    const url=dataUrlFromBackendResponse(response);
    if(url){ $('#audioPlayer').src=url; $('#audioPlayer').play?.(); status($('#speechStatus'),`Backend returned audio${response.filename?' — '+response.filename:''}.`, 'ok'); return; }
    const blob=renderProfileToWav(text,p); const localUrl=playBlob(blob,$('#audioPlayer')); downloadBlob(blob,`${(p.character.name||'voice').replace(/[^a-z0-9]+/gi,'_')}_${p.mood.replace(/[^a-z0-9]+/gi,'_')}.wav`);
    status($('#speechStatus'),`Backend did not return MP3/WAV audio, so local WAV fallback was rendered. Backend response: ${JSON.stringify(response).slice(0,400)}`, 'bad');
  } catch(err){
    const blob=renderProfileToWav(text,p); playBlob(blob,$('#audioPlayer')); downloadBlob(blob,`${(p.character.name||'voice').replace(/[^a-z0-9]+/gi,'_')}_fallback.wav`);
    status($('#speechStatus'),`Backend failed; local WAV fallback rendered. ${err.message}`, 'bad');
  }
}
function renderWav(){ const p=rebuildProfile(true); const blob=renderProfileToWav($('#speechText').value,p); playBlob(blob,$('#audioPlayer')); downloadBlob(blob,`${(p.character.name||'voice').replace(/[^a-z0-9]+/gi,'_')}_${p.mood.replace(/[^a-z0-9]+/gi,'_')}.wav`); status($('#speechStatus'),'Local downloadable WAV rendered.', 'ok'); }
function downloadProfile(){ const p=rebuildProfile(true); const blob=new Blob([JSON.stringify(p,null,2)],{type:'application/json'}); downloadBlob(blob,`${(p.character.name||'voice_profile').replace(/[^a-z0-9]+/gi,'_')}.json`); }
async function init(){
  populateStatic();
  state.biomeMap=await loadJson('s/biomes.json',[]);
  state.raceFlat=await loadJson('s/races.json',[]);
  state.sourceManifest=await loadJson('s/voices.json',[]);
  state.raceGroups=groupRaces(state.raceFlat);
  populateBiomes(); populateRaces(); populateSources(); populateSliders(null); renderSaved(); renderAssistantCards($('#assistantGrid'),()=>state.currentProfile);
  const defaultSource=chooseDefaultVoiceSource(state.sourceManifest,['greeting','ready']); if(defaultSource){ state.selectedSource=defaultSource; state.selectedSourceIndex=state.sourceManifest.indexOf(defaultSource); $('#voiceSourceSelect').value=String(state.selectedSourceIndex); }
  rebuildProfile(false); renderSources();
  $('#raceCategory').addEventListener('change',()=>{updateRaceDropdown(); rebuildProfile(false);});
  $('#raceSelect').addEventListener('change',()=>{updateLineageDropdown(); rebuildProfile(false);});
  ['lineageSelect','biomeSelect','genderIdentity','voiceSourceSelect','moodSelect','contextSelect'].forEach(id=>$('#'+id).addEventListener('change',()=>{rebuildProfile(true); populateSliders(state.currentProfile);}));
  ['characterName','classRole','personality'].forEach(id=>$('#'+id).addEventListener('input',debounce(()=>rebuildProfile(true),250)));
  $('#thinkBtn').addEventListener('click',startThinking); $('#finishThinkBtn').addEventListener('click',finishThinking); $('#saveProfileBtn').addEventListener('click',saveLocal); $('#downloadProfileBtn').addEventListener('click',downloadProfile);
  $('#browserPreviewBtn').addEventListener('click',()=>{try{speakWithBrowser($('#speechText').value,rebuildProfile(true)); status($('#speechStatus'),'Browser voice preview playing. Browser voices cannot always be exported, so use WAV/backend for files.','ok');}catch(e){status($('#speechStatus'),e.message,'bad');}});
  $('#renderWavBtn').addEventListener('click',renderWav); $('#backendSpeechBtn').addEventListener('click',backendSpeech);
  $('#sourceSearch').addEventListener('input',debounce(renderSources,150)); $('#sourceKind').addEventListener('change',renderSources); $('#rescanSourcesBtn').addEventListener('click',renderSources);
  $('#previewSourceBtn').addEventListener('click',()=>{const s=selectedSource(); if(!s?.file){status($('#speechStatus'),'No source file selected.','bad');return;} $('#audioPlayer').src=s.file; $('#audioPlayer').play?.(); status($('#speechStatus'),`Playing source reference: ${s.file}`,'ok');});
  $('#testBackendBtn').addEventListener('click',async()=>{status($('#backendStatus'),'Testing backend…'); try{const r=await postToBackend('ping',{hello:'Voice Studio'}); status($('#backendStatus'),`Backend response: ${JSON.stringify(r).slice(0,500)}`, r?.ok===false?'bad':'ok');}catch(e){status($('#backendStatus'),`Backend failed: ${e.message}`,'bad');}});
  $('#backendSaveBtn').addEventListener('click',async()=>{const p=rebuildProfile(true); status($('#thinkStatus'),'Saving profile to backend…'); try{const r=await postToBackend('saveProfile',{profile:p}); status($('#thinkStatus'),`Backend save response: ${JSON.stringify(r).slice(0,500)}`, r?.ok===false?'bad':'ok');}catch(e){status($('#thinkStatus'),`Backend save failed: ${e.message}`,'bad');}});
  if('serviceWorker' in navigator) navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
}
init();
