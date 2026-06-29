(() => {
  'use strict';
  const S = window.BelavadosScanner;
  function renderSlider(container, item, isPercent=false){
    const [name,id,min,max,def,desc=''] = item;
    const suffix=isPercent ? '%' : '';
    return `<div class="sliderItem"><label for="${id}"><b>${S.esc(name)}</b><span id="${id}Value">${def}${suffix}</span></label><input id="${id}" type="range" min="${min}" max="${max}" step="${max>100?1:.1}" value="${def}" />${desc?`<p>${S.esc(desc)}</p>`:''}</div>`;
  }
  function bindSliderValues(items, isPercent=false){
    for(const [,id,, ,def] of items){
      const el=S.$(id), out=S.$(id+'Value'); if(!el || !out) continue;
      const update=()=>{ out.textContent = `${Number(el.value).toFixed(id.startsWith('axis')?0:(isPercent?0:1))}${isPercent?'%':''}`; };
      el.addEventListener('input', update); update();
    }
  }
  S.populateDatalists = function(){
    const fill=(id,arr,get)=>{ const el=S.$(id); if(el) el.innerHTML=(arr||[]).map(x=>`<option value="${S.esc(get(x))}"></option>`).join(''); };
    fill('biomeList', S.state.resources.biomes, b=>b.biome);
    fill('raceList', S.state.resources.races, r=>r.name);
    fill('classList', S.state.resources.classes, c=>c.name);
    fill('genderList', S.state.resources.genders, g=>g.name);
    const subs=S.state.resources.classes.flatMap(c=>c.subclasses||[]);
    fill('subclassList', subs, s=>s.fullName||s.name);
    const sel=S.$('characterEmotion');
    if(sel){ sel.innerHTML=S.state.resources.emotions.map(e=>`<option value="${S.esc(e.name)}">${S.esc(e.name)}</option>`).join(''); sel.value='Neutral / Base'; }
  };
  S.renderResourceCounts = function(){
    const rows=[['Biomes',S.state.resources.biomes.length],['Races',S.state.resources.races.length],['Classes',S.state.resources.classes.length],['Subclasses',S.countSubclasses()],['Gender Layers',S.state.resources.genders.length],['Emotions',S.state.resources.emotions.length],['Deep Math Races',S.state.resources.deepMath?.counts?.races||0],['Audio Assets',S.state.resources.audioReferences?.length||0],['Source Assets',S.state.resources.sourceReferences?.length||0],['Trait Keys',S.TRAITS.length]];
    const el=S.$('resourceCounts'); if(el) el.innerHTML=rows.map(([k,v])=>`<div class="mini"><b>${v}</b><span>${S.esc(k)}</span></div>`).join('');
  };
  function renderProfileCard(p,i){
    const m=p.developerOnly.matches;
    const selected=i===S.state.selectedIndex ? ' selected' : '';
    const chips=[m.biome,m.race,m.class,m.subclass,m.gender,m.emotion].map(x=>`<span class="chip ${x.status==='missing'?'warn':'good'}">${S.esc(S.titleish(x.status))}: ${S.esc(x.matched || x.query || 'none')}</span>`).join('');
    const metrics=[['Rate',p.computedVoice.webSpeechRate],['Pitch',p.computedVoice.webSpeechPitch],['Accent',p.voice.traits.accentColor.toFixed(1)],['Warmth',p.voice.traits.warmth.toFixed(1)],['Clarity',p.voice.traits.clarity.toFixed(1)],['Projection',p.voice.traits.projection.toFixed(1)]].map(([k,v])=>`<div class="metric"><b>${S.esc(v)}</b><span>${S.esc(k)}</span></div>`).join('');
    return `<article class="voiceCard${selected}" data-index="${i}"><div class="cardTop"><div><h3>${S.esc(p.character.name)}</h3><p>${S.esc(p.playerFacingSummary.summary)}</p></div><button type="button" data-export-json="${i}">JSON</button></div><div class="chips">${chips}</div><div class="voiceGrid">${metrics}</div><div class="promptBox">Studio-ready schema: ${S.esc(p.schemaVersion)}\nFantasy accent visible: ${S.esc(p.voice.fantasyAccent)}\nDeveloper-only base inspiration hidden: ${p.voice.baseAccentVisibleToPlayer ? 'visible' : 'hidden'}</div></article>`;
  }
  S.renderProfiles = function(){
    const summary=S.$('resultSummary'); if(summary) summary.textContent=S.state.profiles.length ? `${S.state.profiles.length} generated profile(s).` : 'No generated profiles yet.';
    const results=S.$('results'); if(results){ results.innerHTML=S.state.profiles.map(renderProfileCard).join(''); [...results.querySelectorAll('.voiceCard')].forEach(card => card.addEventListener('click',()=>S.selectProfile(Number(card.dataset.index)))); }
    if(S.state.selectedIndex<0 && S.state.profiles.length) S.state.selectedIndex=0;
    S.renderSelected();
  };
  S.selectProfile = function(i){ S.state.selectedIndex=i; S.renderSelected(); [...document.querySelectorAll('.voiceCard')].forEach((c,idx)=>c.classList.toggle('selected',idx===i)); };
  S.renderSelected = function(){
    const p=S.state.profiles[S.state.selectedIndex];
    const selected=S.$('selectedProfile'), notes=S.$('matchNotes'), dev=S.$('developerTrace'), accent=S.$('accentPreview'), details=S.$('previewDetails'), assets=S.$('matchedAssets');
    if(!p){ if(selected) selected.textContent='Select or generate a profile to inspect the studio-ready output.'; if(notes) notes.textContent='No selected profile.'; if(assets) assets.textContent='No matched audio references yet.'; return; }
    if(selected) selected.innerHTML=`<b>${S.esc(p.character.name)}</b><br><br><b>Fantasy Accent:</b> ${S.esc(p.voice.fantasyAccent)}<br><b>Resolved from:</b> ${S.esc(p.playerFacingSummary.resolvedFrom)}<br><br>${S.esc(p.playerFacingSummary.voiceShape)}<br><br><span class="warningText">${S.esc((p.voice.exportNotes||[]).join(' '))}</span>`;
    if(accent) accent.innerHTML=`<b>${S.esc(p.voice.fantasyAccent)}</b><br>${S.esc(p.playerFacingSummary.resolvedFrom)}<br><span class="muted">Player-facing output hides Earth inspiration.</span>`;
    if(details) details.innerHTML=`Rate ${p.computedVoice.webSpeechRate}, pitch ${p.computedVoice.webSpeechPitch}, volume ${p.computedVoice.webSpeechVolume}. ${S.esc(p.playerFacingSummary.summary)}`;
    if(assets){ const refs=p.voice.assetInfluences?.matchedAudioReferences||[]; assets.innerHTML=refs.length ? refs.slice(0,6).map(a=>`<div class="assetItem"><b>${S.esc(a.filter?.fantasyAccentName||a.id||'audio reference')}</b><small>${S.esc(a.path)}</small><audio controls preload="none" src="${S.esc(a.path)}"></audio><div class="assetMeta">Score ${S.esc(a.score)} · ${S.esc(a.filter?.biome||'no biome filter')} · ${S.esc(a.filter?.raceCategoryName||'no race filter')} · ${S.esc(a.durationSec? a.durationSec+'s':'duration unknown')}</div></div>`).join('') : 'No close local audio match found for this profile.'; }
    if(notes) notes.textContent=Object.entries(p.developerOnly.matches).map(([k,m])=>`${k}: ${m.status.toUpperCase()} | query="${m.query}" | matched="${m.matched}" | score=${m.score}`).join('\n');
    if(dev) dev.textContent=JSON.stringify({appliedOverlays:p.appliedOverlays, computedVoice:p.computedVoice, exportNotes:p.voice.exportNotes}, null, 2);
  };
  function scanOne(){ const p=S.buildVoiceProfile(S.npcFromControls()); S.state.profiles.unshift(p); S.state.selectedIndex=0; S.renderProfiles(); }
  function parsePasteToControls(){
    const text=S.$('pastedInput')?.value || ''; const rows=S.parseBulk(text); if(!rows.length) return;
    const n=rows[0];
    const set=(id,val)=>{ const el=S.$(id); if(el && val) el.value=val; };
    set('characterName',n.name); set('characterBiome',n.biome); set('characterRace',n.race); set('characterLineage',n.lineage); set('characterBloodline',n.bloodline); set('characterClass',n.className); set('characterSubclass',n.subclass); set('characterGenderIdentity',n.genderIdentity); set('characterSettlementType',n.settlementType); set('characterPersonalityText',n.personalityText); set('characterEmotion',n.emotion);
    S.state.lastParsedRows=rows; scanOne();
  }
  function scanBulk(){ const rows=S.parseBulk(S.$('pastedInput')?.value||''); if(!rows.length){ const rs=S.$('resultSummary'); if(rs) rs.textContent='No recognizable NPC rows found.'; return; } S.state.profiles=rows.map(S.buildVoiceProfile); S.state.selectedIndex=0; S.renderProfiles(); }
  function setupTabs(){ [...document.querySelectorAll('.tab')].forEach(btn => btn.addEventListener('click',()=>{ document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active')); document.querySelectorAll('.tabPanel').forEach(x=>x.classList.remove('active')); btn.classList.add('active'); S.$(btn.dataset.tab)?.classList.add('active'); })); }
  function setupScrollAssist(){
    const shell=S.$('workspaceScroll'), top=S.$('top-x-scroll'), bottom=S.$('bottom-x-scroll');
    const setScroll=(v)=>{ if(!shell) return; const max=shell.scrollWidth-shell.clientWidth; shell.scrollLeft=(Number(v)/1000)*max; };
    const sync=()=>{ if(!shell) return; const max=shell.scrollWidth-shell.clientWidth; const val=max>0 ? Math.round((shell.scrollLeft/max)*1000) : 0; if(top) top.value=val; if(bottom) bottom.value=val; };
    top?.addEventListener('input',()=>{setScroll(top.value); if(bottom) bottom.value=top.value;}); bottom?.addEventListener('input',()=>{setScroll(bottom.value); if(top) top.value=bottom.value;}); shell?.addEventListener('scroll',sync);
    const bindY=(rangeId,panelId)=>{ const r=S.$(rangeId), p=S.$(panelId); if(!r||!p) return; r.addEventListener('input',()=>{ const max=p.scrollHeight-p.clientHeight; p.scrollTop=(Number(r.value)/1000)*max; }); p.addEventListener('scroll',()=>{ const max=p.scrollHeight-p.clientHeight; r.value=max>0?Math.round((p.scrollTop/max)*1000):0; }); };
    bindY('left-y-scroll','leftPanel'); bindY('right-y-scroll','rightPanel');
  }
  function attach(){
    S.$('traitSliders').innerHTML=S.TRAITS.map(t=>renderSlider('traitSliders',t,false)).join('');
    S.$('influenceSliders').innerHTML=S.INFLUENCES.map(t=>renderSlider('influenceSliders',t,true)).join('');
    S.$('alignmentSliders').innerHTML=S.ALIGNMENT_AXES.map(t=>renderSlider('alignmentSliders',t,false)).join('');
    bindSliderValues(S.TRAITS,false); bindSliderValues(S.INFLUENCES,true); bindSliderValues(S.ALIGNMENT_AXES,false);
    S.$('emotionIntensity')?.addEventListener('input',()=>{ const out=S.$('emotionIntensityValue'); if(out) out.textContent=S.$('emotionIntensity').value+'%'; });
    S.$('loadBundledBtn')?.addEventListener('click',S.loadBundledResources); S.$('jsonFolderInput')?.addEventListener('change',S.handleJsonFolder); S.$('sampleBtn')?.addEventListener('click',S.loadSamples);
    S.$('scanBtn')?.addEventListener('click',scanOne); S.$('parsePasteBtn')?.addEventListener('click',parsePasteToControls); S.$('scanBulkBtn')?.addEventListener('click',scanBulk);
    S.$('previewTtsBtn')?.addEventListener('click',S.previewSelected); S.$('stopTtsBtn')?.addEventListener('click',S.stopPreview); S.$('copySummaryBtn')?.addEventListener('click',S.copySelectedSummary);
    S.$('exportSelectedJsonBtn')?.addEventListener('click',S.exportSelectedJson); S.$('exportAllJsonBtn')?.addEventListener('click',S.exportAllJson); S.$('exportSelectedJsBtn')?.addEventListener('click',S.exportSelectedJs); S.$('exportSelectedMdBtn')?.addEventListener('click',S.exportSelectedMd); S.$('exportManifestBtn')?.addEventListener('click',S.exportManifest);
    S.$('results')?.addEventListener('click',(evt)=>{ const btn=evt.target.closest('button[data-export-json]'); if(btn){ evt.stopPropagation(); S.state.selectedIndex=Number(btn.dataset.exportJson); S.exportSelectedJson(); }});
    S.$('referenceAudioInput')?.addEventListener('change',(evt)=>{ S.state.referenceAudioName=evt.target.files?.[0]?.name || ''; });
    setupTabs(); setupScrollAssist(); S.renderResourceCounts(); S.renderProfiles();
  }
  attach(); S.loadBundledResources();
})();
