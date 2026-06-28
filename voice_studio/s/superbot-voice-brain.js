const STORE_KEY = 'voiceStudioSuperbotBrain.v1';
const MEMORY_KEY = 'voiceStudioSuperbotMemory.v1';
const FILE_INDEX_KEY = 'voiceStudioSuperbotFileIndex.v1';
const LOCKED_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec';
const PAGE_URL = 'https://tyrannosaurusdm92.github.io/BelavadosProjects/voice_studio/index.html';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const safeText = value => String(value ?? '').trim();
const nowIso = () => new Date().toISOString();
const shortJson = value => JSON.stringify(value, null, 2).slice(0, 1600);

function readJson(key, fallback){
  try{ const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }catch(_err){ return fallback; }
}
function writeJson(key, value){ try{ localStorage.setItem(key, JSON.stringify(value)); }catch(_err){} }
function hashString(value){ let h=2166136261>>>0; const s=String(value||''); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return (h>>>0).toString(16); }
function localScan(text, topics=[]){
  try{
    if(window.ConversationScannerRandomizer?.scanConversation){
      return window.ConversationScannerRandomizer.scanConversation(text, { topics:['voice-studio','superbot','dnd',...topics], tone:'practical' });
    }
  }catch(_err){}
  const lower=String(text||'').toLowerCase();
  return {
    rawText:text,
    topics:[...topics,'voice-studio'].filter(Boolean),
    moods:[/angry|rage|threat|combat/.test(lower)?'intense':'neutral'],
    needs:[/fix|broken|debug|not working/.test(lower)?'debugging':'voiceCreation'],
    intents:[/voice|accent|wav|mp3|speak|speech|tts/.test(lower)?'voice':'chat']
  };
}
function addMessage(state, role, text, meta={}){
  const msg={ id:'msg_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,8), role, text:String(text||''), meta, time:nowIso() };
  state.messages.push(msg);
  state.messages=state.messages.slice(-160);
  writeJson(STORE_KEY, state);
  return msg;
}
function localReply(message, hooks){
  const p=hooks.getProfile?.() || {};
  const input=hooks.getInput?.() || {};
  const decision=p.sourceDecision || {};
  const scan=localScan([message,input.name,input.genderIdentity,input.race,input.biome,input.personality].filter(Boolean).join(' '), ['voice-chat']);
  if(/source|model|sample|voice pick|why/i.test(message)){
    return `Voice source bot status:\n${decision?.selected ? `${decision.selected.speaker || 'source'} — ${decision.selected.phrase || decision.selected.tag || 'sample'}\n${decision.selected.file || ''}\nScore: ${decision.score || 'n/a'}` : 'No source is locked yet. Press Activate voice source bot.'}`;
  }
  if(/scan|analy[sz]e|review|audit/i.test(message)){
    return `I scanned the current voice build. Intent: ${(scan.intents||[]).join(', ') || 'voice'}. Strongest inputs: ${[input.biome,input.race,input.genderIdentity,input.classRole].filter(Boolean).join(' + ') || 'not filled yet'}.`;
  }
  if(/download|zip|export|wav/i.test(message)){
    return 'Use Download character voice ZIP after the source bot has locked a source. The ZIP includes manifest.json and CharacterName_SourceName.wav.';
  }
  return `I am merged into Voice Studio as the voice-building superbot. Current character: ${input.name || 'unnamed'}, ${input.genderIdentity || 'unknown identity'}, ${input.race || 'unknown race'}, ${input.biome || 'unknown biome'}. I can analyze the build, lock a source, save learning, scan files, and route backend voice requests.`;
}
async function backendAsk(postToBackend, primaryAction, payload, fallbacks=[]){
  const actions=[primaryAction, ...fallbacks];
  let last=null;
  for(const action of actions){
    try{
      const res=await postToBackend(action, payload);
      last=res;
      const err=String(res?.error || res?.message || '').toLowerCase();
      if(res && res.ok !== false && !/unknown action|not found/.test(err)) return { action, response:res };
    }catch(err){ last={ ok:false, error:err.message, action }; }
  }
  return { action:actions[actions.length-1], response:last || { ok:false, error:'No backend response.' } };
}
function renderChatLog(container, messages){
  if(!container) return;
  container.innerHTML='';
  for(const m of messages){
    const div=document.createElement('div');
    div.className='superbot-msg '+(m.role==='user'?'user':'bot');
    div.innerHTML=`<span>${m.role === 'user' ? 'You' : 'Voice Superbot'}${m.meta?.action ? ' · '+escapeHtml(m.meta.action) : ''}</span>${escapeHtml(m.text)}`;
    container.appendChild(div);
  }
  container.scrollTop=container.scrollHeight;
}
function renderMemory(container){
  const list=readJson(MEMORY_KEY, []);
  if(!container) return;
  container.innerHTML=list.length ? list.slice(0,40).map(item=>`<div class="superbot-memory"><b>${escapeHtml(item.scope || 'voice')}</b> · ${escapeHtml(item.key || 'memory')}<br><small>${escapeHtml(item.value || '')}</small></div>`).join('') : '<p class="status">No local superbot memories yet.</p>';
}
function renderFileIndex(container){
  const list=readJson(FILE_INDEX_KEY, []);
  if(!container) return;
  container.textContent = list.length ? JSON.stringify(list.slice(0,25), null, 2) : 'No files indexed yet.';
}
function extractTasks(text){
  const lines=String(text||'').split(/\n|\.|;|•|-/).map(x=>x.trim()).filter(Boolean);
  const tasks=[];
  for(const line of lines){
    if(/\b(add|fix|make|create|change|merge|scan|test|export|download|lock|update|route|wire|verify)\b/i.test(line)) tasks.push(line);
  }
  return tasks.slice(0,20);
}

export function initSuperbotVoiceBrain(hooks={}){
  const state=readJson(STORE_KEY, { messages:[], activeConversationId:'voice-studio-superbot-main' });
  const $=id=>document.getElementById(id);
  const chatLog=$('superbotChatLog');
  const form=$('superbotChatForm');
  const input=$('superbotChatInput');
  const out=$('superbotOut');
  const memoryBox=$('superbotMemoryList');
  const fileOut=$('superbotFileOut');
  const postToBackend=hooks.postToBackend;
  if(!chatLog || !form || !postToBackend) return null;
  if(!state.messages.length){
    addMessage(state, 'bot', 'Voice Superbot is integrated. I can analyze the character voice build, lock source decisions, scan text/code files, save learning, and route backend voice actions.', { action:'local.ready' });
  }
  renderChatLog(chatLog, state.messages);
  renderMemory(memoryBox);
  renderFileIndex(fileOut);

  async function sendChat(text){
    const trimmed=safeText(text); if(!trimmed) return;
    addMessage(state,'user',trimmed); renderChatLog(chatLog,state.messages);
    const profile=hooks.getProfile?.() || {};
    const profileInput=hooks.getInput?.() || {};
    const scan=localScan(trimmed, ['voice-superbot-chat']);
    let reply=''; let meta={ action:'local.fallback' };
    const payload={
      conversationId:state.activeConversationId,
      message:trimmed,
      text:trimmed,
      scan,
      context:{ app:'Voice Studio', pageUrl:PAGE_URL, profileInput, profile, sourceDecision:profile.sourceDecision || null },
      voiceStudio:{ profileInput, profile, lockedBackendUrl:LOCKED_BACKEND_URL }
    };
    const result=await backendAsk(postToBackend, 'chats.send', payload, ['bots.chat','bot.chat','bots.decide']);
    const r=result.response;
    if(r && r.ok !== false){
      reply=r.reply || r.response || r.text || r.answer || r.intent?.summary || shortJson(r);
      meta={ action:result.action, backend:true };
    } else {
      reply=localReply(trimmed, hooks);
      meta={ action:'local.fallback', backendError:r?.error || r?.raw || '' };
    }
    addMessage(state,'bot',reply,meta); renderChatLog(chatLog,state.messages);
  }
  form.onsubmit=ev=>{ ev.preventDefault(); const text=input.value; input.value=''; sendChat(text); };

  $('superbotAnalyzeBtn')?.addEventListener('click', async ()=>{
    const profile=hooks.rebuildProfile?.(true) || hooks.getProfile?.() || {};
    const profileInput=hooks.getInput?.() || {};
    const text=[profileInput.name,profileInput.genderIdentity,profileInput.category,profileInput.race,profileInput.lineage,profileInput.biome,profileInput.classRole,profileInput.personality,profileInput.mood,profileInput.context].filter(Boolean).join(' | ');
    const scan=localScan(text, ['voice-analysis']);
    out.textContent='Analyzing voice profile through Superbot…';
    const botDecision=await backendAsk(postToBackend, 'bots.decide', { message:text, text, context:{ task:'voice-studio-full-analysis', profileInput, profile, scan } }, ['bot.decide']);
    const source=await backendAsk(postToBackend, 'voice.source.resolve', hooks.getBackendPayload?.(profile, { conversation:scan, superbotAnalysis:botDecision.response }) || { profile, profileInput }, ['voice.model.resolve']);
    const synth=await backendAsk(postToBackend, 'voice.synth.patch', hooks.getBackendPayload?.(profile, { conversation:scan, superbotAnalysis:botDecision.response, sourceResolve:source.response }) || { profile, profileInput }, ['voice.simulate','voice.create']);
    const packet={ localScan:scan, botDecision:botDecision.response, sourceResolve:source.response, synthPatch:synth.response };
    out.textContent=JSON.stringify(packet,null,2);
    addMessage(state,'bot','Superbot analyzed the full voice profile and checked backend bot/source/synth routes.',{action:'superbot.voice.analyze'});
    renderChatLog(chatLog,state.messages);
  });

  $('superbotActivateSourceBtn')?.addEventListener('click', async ()=>{
    out.textContent='Activating the Voice Source Bot from Superbot panel…';
    if(hooks.activateVoiceBot) hooks.activateVoiceBot();
    addMessage(state,'bot','Voice Source Bot activated from the integrated Superbot panel. It will lock a source after the 1-minute profile pass.',{action:'voice.source.activate'});
    renderChatLog(chatLog,state.messages);
  });

  $('superbotSaveLearningBtn')?.addEventListener('click', async ()=>{
    const profileInput=hooks.getInput?.() || {};
    const value=safeText($('superbotLearningText')?.value) || `Voice Studio preference for ${profileInput.name || 'current character'}: ${profileInput.biome || ''} ${profileInput.race || ''} ${profileInput.genderIdentity || ''}`;
    const item={ id:'mem_'+hashString(value+'|'+Date.now()), scope:'voice_studio', key:'voice_build_rule', value, profileInput, time:nowIso() };
    const list=[item, ...readJson(MEMORY_KEY, [])].slice(0,200);
    writeJson(MEMORY_KEY, list);
    renderMemory(memoryBox);
    const r=await backendAsk(postToBackend, 'learning.record', item, ['bot.learn','bots.chat']);
    out.textContent=JSON.stringify({ savedLocal:item, backend:r.response }, null, 2);
    addMessage(state,'bot','Saved voice-learning memory locally and attempted backend learning sync.',{action:r.action});
    renderChatLog(chatLog,state.messages);
  });

  $('superbotTaskBtn')?.addEventListener('click', async ()=>{
    const text=safeText($('superbotTaskText')?.value) || [hooks.getInput?.()?.name, 'create source-locked character voice export, verify backend, render wav'].filter(Boolean).join(' ');
    const localTasks=extractTasks(text);
    const r=await backendAsk(postToBackend, 'tasks.fromText', { text, localTasks, source:'voice-studio-superbot' }, ['task.fromText','bots.decide']);
    out.textContent=JSON.stringify({ localTasks, backend:r.response }, null, 2);
  });

  $('superbotScanGithubBtn')?.addEventListener('click', async ()=>{
    out.textContent='Scanning GitHub/Pages through locked backend…';
    const r=await backendAsk(postToBackend, 'github.scan', { repository:'BelavadosProjects', branch:'main', maxFiles:120, pageUrl:PAGE_URL, focus:'voice_studio' }, ['projects.scanGithub','project.scanGithub']);
    out.textContent=JSON.stringify(r.response, null, 2);
  });

  $('superbotCoverageBtn')?.addEventListener('click', async ()=>{
    const r=await backendAsk(postToBackend, 'project.coverage', { projectId:'voice_studio', pageUrl:PAGE_URL }, ['universal.health','health']);
    out.textContent=JSON.stringify(r.response, null, 2);
  });

  $('superbotSearchBtn')?.addEventListener('click', async ()=>{
    const query=safeText($('superbotSearchInput')?.value);
    const localFiles=readJson(FILE_INDEX_KEY, []).filter(f=>!query || JSON.stringify(f).toLowerCase().includes(query.toLowerCase()));
    const memories=readJson(MEMORY_KEY, []).filter(m=>!query || JSON.stringify(m).toLowerCase().includes(query.toLowerCase()));
    const r=await backendAsk(postToBackend, 'files.search', { query, limit:20, projectId:'voice_studio' }, ['github.files.search','projects.files.search','learning.search']);
    out.textContent=JSON.stringify({ localFiles:localFiles.slice(0,20), localMemories:memories.slice(0,20), backend:r.response }, null, 2);
  });

  $('superbotFileInput')?.addEventListener('change', async ev=>{
    const files=[...(ev.target.files || [])];
    const index=readJson(FILE_INDEX_KEY, []);
    for(const file of files){
      const text=await file.text().catch(()=>'');
      const item={ id:'file_'+hashString(file.name+'|'+text.slice(0,500)), name:file.name, size:file.size, type:file.type, hash:hashString(text), preview:text.slice(0,900), signals:localScan(text.slice(0,3000), ['file-index']).intents, time:nowIso() };
      index.unshift(item);
      await backendAsk(postToBackend, 'file.indexText', { name:file.name, text:text.slice(0,120000), source:'voice-studio-superbot-upload' }, ['files.indexText','bots.decide']);
    }
    writeJson(FILE_INDEX_KEY, index.slice(0,200));
    renderFileIndex(fileOut);
    out.textContent=`Indexed ${files.length} file(s) for Superbot voice context.`;
  });

  $('superbotExportBrainBtn')?.addEventListener('click', ()=>{
    const snapshot={ schema:'voice_studio.superbot_brain_snapshot.v1', generatedAt:nowIso(), lockedBackendUrl:LOCKED_BACKEND_URL, pageUrl:PAGE_URL, messages:state.messages, memories:readJson(MEMORY_KEY, []), files:readJson(FILE_INDEX_KEY, []), currentInput:hooks.getInput?.(), currentProfile:hooks.getProfile?.() };
    const blob=new Blob([JSON.stringify(snapshot,null,2)], { type:'application/json' });
    const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='voice_studio_superbot_brain_snapshot.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),3000);
  });

  const api={
    sendChat,
    recordVoiceEvent(event, detail={}){
      const text=`${event}: ${detail?.summary || detail?.message || ''}`.trim();
      if(text) addMessage(state,'bot',text,{action:event});
      renderChatLog(chatLog,state.messages);
    },
    getState(){ return { messages:state.messages, memories:readJson(MEMORY_KEY, []), files:readJson(FILE_INDEX_KEY, []) }; }
  };
  window.VoiceStudioSuperbot=api;
  return api;
}
