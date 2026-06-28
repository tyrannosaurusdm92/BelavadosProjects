(() => {
  const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec';
  const state = {
    sessionToken: localStorage.getItem('superbotSessionToken') || '',
    activeConversationId: localStorage.getItem('superbotConversationId') || 'superbot-main',
    conversations: [],
    isTyping: false,
    lastVoice: null
  };
  const $ = id => document.getElementById(id);
  const show = (el, data) => { el.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2); };
  const safe = value => String(value ?? '');
  async function api(payload) {
    payload = {...payload};
    if (!payload.action) payload.action = 'health';
    if (state.sessionToken && !payload.sessionToken) payload.sessionToken = state.sessionToken;
    const body = new URLSearchParams({ payload: JSON.stringify(payload) });
    const res = await fetch(BACKEND_URL, { method:'POST', body });
    const text = await res.text();
    try { return JSON.parse(text); } catch { return { ok:false, raw:text }; }
  }
  function addMsg(role, text, meta='') {
    const div = document.createElement('div');
    div.className = 'msg ' + (role === 'user' ? 'user' : 'bot');
    div.innerHTML = `<span class="meta">${role === 'user' ? 'You' : 'superbot'}${meta ? ' · '+meta : ''}</span>${escapeHtml(text)}`;
    $('chatLog').appendChild(div);
    $('chatLog').scrollTop = $('chatLog').scrollHeight;
  }
  function escapeHtml(s){ return safe(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function typing(on) {
    state.isTyping = on;
    let el = document.getElementById('typingMsg');
    if (on && !el) { el = document.createElement('div'); el.id='typingMsg'; el.className='msg bot typing'; el.innerHTML='<span class="meta">superbot</span>Thinking…'; $('chatLog').appendChild(el); }
    if (!on && el) el.remove();
  }
  async function loadMessages() {
    const r = await api({ action:'chats.messages', conversationId: state.activeConversationId, limit: 200 });
    $('chatLog').innerHTML = '';
    (r.messages || []).forEach(m => addMsg(m.role === 'assistant' ? 'bot' : 'user', m.content, m.intent || ''));
  }
  async function loadChats() {
    const r = await api({ action:'chats.list' });
    state.conversations = r.conversations || [];
    const list = $('conversationList'); list.innerHTML = '';
    state.conversations.forEach(c => {
      const b = document.createElement('button');
      b.className = 'conv-item ' + (c.conversationId === state.activeConversationId ? 'active' : '');
      b.innerHTML = `<strong>${escapeHtml(c.title || c.conversationId)}</strong><br><small>${escapeHtml((c.lastMessage && c.lastMessage.text || '').slice(0,70))}</small>`;
      b.onclick = () => { state.activeConversationId = c.conversationId; localStorage.setItem('superbotConversationId', c.conversationId); loadMessages(); loadChats(); };
      list.appendChild(b);
    });
  }
  function switchView(name) {
    document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active', v.id === 'view-' + name));
    document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active', n.dataset.view === name));
    if (name === 'chat') setTimeout(()=>$('chatInput').focus(), 50);
  }
  document.querySelectorAll('.nav').forEach(btn=>btn.onclick=()=>switchView(btn.dataset.view));
  $('menuBtn').onclick = () => $('sidebar').classList.toggle('open');
  $('setupBtn').onclick = async () => alert(JSON.stringify(await api({action:'setup'}), null, 2));
  $('healthBtn').onclick = async () => alert(JSON.stringify(await api({action:'health'}), null, 2));
  $('newChatBtn').onclick = async () => {
    const title = $('conversationTitle').value.trim() || 'New Conversation';
    const r = await api({ action:'chats.create', title });
    state.activeConversationId = r.conversationId || state.activeConversationId;
    localStorage.setItem('superbotConversationId', state.activeConversationId);
    await loadChats(); await loadMessages();
  };
  $('loadChatsBtn').onclick = loadChats;
  $('chatForm').onsubmit = async ev => {
    ev.preventDefault();
    const text = $('chatInput').value.trim();
    if (!text) return;
    $('chatInput').value = '';
    addMsg('user', text);
    typing(true);
    const r = await api({ action:'chats.send', conversationId: state.activeConversationId, message:text });
    typing(false);
    addMsg('bot', r.reply || r.error || JSON.stringify(r), r.intent || '');
    await loadChats();
  };
  $('scanBtn').onclick = async () => { show($('scanOut'),'Scanning…'); show($('scanOut'), await api({action:'github.scan', repository:$('repoInput').value.trim(), branch:$('branchInput').value.trim(), maxFiles:Number($('maxFilesInput').value||80)})); };
  $('scanAllBtn').onclick = async () => { show($('scanOut'),'Scanning all repos…'); show($('scanOut'), await api({action:'github.scan', allRepos:true, maxFiles:Number($('maxFilesInput').value||80)})); };
  $('coverageBtn').onclick = async () => show($('scanOut'), await api({action:'project.coverage'}));
  async function indexFiles(files) {
    for (const file of files) {
      const text = await file.text().catch(()=>null);
      if (text == null) { show($('fileOut'), 'Could not read ' + file.name); continue; }
      show($('fileOut'), await api({action:'file.indexText', name:file.name, text, source:'frontend-upload'}));
    }
  }
  $('fileInput').onchange = e => indexFiles([...e.target.files]);
  const dz=$('dropZone');
  ['dragenter','dragover'].forEach(evt=>dz.addEventListener(evt,e=>{e.preventDefault();dz.classList.add('drag')}));
  ['dragleave','drop'].forEach(evt=>dz.addEventListener(evt,e=>{e.preventDefault();dz.classList.remove('drag')}));
  dz.addEventListener('drop', e => indexFiles([...e.dataTransfer.files]));
  $('fileSearchBtn').onclick = async () => show($('fileOut'), await api({action:'files.search', query:$('fileSearchInput').value, limit:20}));
  function voicePayload(action='voice.simulate') {
    return { action, text:$('voiceText').value, accentName:$('accentName').value, sliders:{
      pitch:+$('pitch').value, speed:+$('speed').value, breath:+$('breath').value, roughness:+$('roughness').value,
      accent:+$('accent').value, clarity:+$('clarity').value, warmth:+$('warmth').value, emotion:+$('emotion').value
    } };
  }
  $('voiceBtn').onclick = async () => { const r=await api(voicePayload()); state.lastVoice=r; show($('voiceOut'), r); };
  $('voiceJobBtn').onclick = async () => { const r=await api(voicePayload('voice.job.create')); state.lastVoice=r.simulation || r; show($('voiceOut'), r); };
  $('speakBtn').onclick = () => {
    const sim = state.lastVoice || { webSpeech:{ rate:1, pitch:1, volume:1 } };
    const u = new SpeechSynthesisUtterance($('voiceText').value);
    Object.assign(u, sim.webSpeech || sim.voiceProfile?.webSpeech || {});
    speechSynthesis.cancel(); speechSynthesis.speak(u);
  };
  $('taskBtn').onclick = async () => show($('taskOut'), await api({action:'tasks.fromText', text:$('taskText').value}));
  $('taskListBtn').onclick = async () => show($('taskOut'), await api({action:'tasks.list', status:'open'}));
  $('learnBtn').onclick = async () => show($('learnOut'), await api({action:'learning.record', scope:$('learnScope').value, key:$('learnKey').value, value:$('learnValue').value}));
  $('learnSearchBtn').onclick = async () => show($('learnOut'), await api({action:'learning.search', query:$('learnSearch').value}));
  $('sourceAuditBtn').onclick = async () => show($('learnOut'), await api({action:'source.auditManifest'}));
  $('registerBtn').onclick = async () => {
    const r = await api({action:'auth.register', name:$('authName').value, email:$('authEmail').value, password:$('authPassword').value, plan:$('authPlan').value});
    if (r.sessionToken) { state.sessionToken = r.sessionToken; localStorage.setItem('superbotSessionToken', r.sessionToken); }
    show($('authOut'), r);
  };
  $('loginBtn').onclick = async () => {
    const r = await api({action:'auth.login', email:$('authEmail').value, password:$('authPassword').value});
    if (r.sessionToken) { state.sessionToken = r.sessionToken; localStorage.setItem('superbotSessionToken', r.sessionToken); }
    show($('authOut'), r);
  };
  $('meBtn').onclick = async () => show($('authOut'), await api({action:'auth.me'}));
  $('plansBtn').onclick = async () => show($('authOut'), await api({action:'billing.planLimits'}));
  $('widgetConfigBtn').onclick = async () => show($('embedOut'), await api({action:'widget.config'}));
  $('globalSearch').addEventListener('keydown', async ev => {
    if (ev.key === 'Enter') {
      const q = $('globalSearch').value.trim();
      if (!q) return;
      switchView('files');
      show($('fileOut'), await api({action:'files.search', query:q, limit:20}));
    }
  });
  addMsg('bot','I am superbot. I merged the compatible chat, auth, widget, task, GitHub scanning, voice simulation, and adaptive learning patterns into one locked backend/frontend package.');
  loadChats().catch(()=>{});
})();
