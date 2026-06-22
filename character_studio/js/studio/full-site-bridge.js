
(function(){
  'use strict';
  const doc = document;
  const q = id => doc.getElementById(id);
  const own = (o,k) => Object.prototype.hasOwnProperty.call(o||{},k);
  const parseJsonBlock = id => { try { return JSON.parse(q(id)?.textContent || 'null') || {}; } catch(e) { console.warn('Could not parse', id, e); return {}; } };
  const SOURCE = parseJsonBlock('site-dropdown-source-data');
  const BIOMES = parseJsonBlock('site-dropdown-biome-data');
  const PRONOUNS = parseJsonBlock('site-pronoun-data');
  const TITLES = parseJsonBlock('site-title-data');
  const panelState = {genCustom:{titles:[]}, voiceCustom:{titles:[]}};
  function esc(s){return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function setOpts(sel, items, labelFn=x=>x, valueFn=x=>x, placeholder='—'){
    if(!sel) return;
    sel.innerHTML = '';
    const p = document.createElement('option'); p.value=''; p.textContent=placeholder; sel.appendChild(p);
    (items||[]).forEach(item=>{ const o=document.createElement('option'); o.value=valueFn(item) ?? ''; o.textContent=labelFn(item) ?? valueFn(item) ?? ''; sel.appendChild(o); });
  }
  function findCategory(id){ return (SOURCE.categories||[]).find(c=>c.id===id || c.categoryId===id || c.name===id); }
  function findRace(categoryId, raceId){ const cat=findCategory(categoryId); return (cat?.races||[]).find(r=>r.id===raceId || r.name===raceId); }
  function findLineage(categoryId,raceId,lineageId){ const r=findRace(categoryId,raceId); return (r?.lineages||[]).find(l=>l.id===lineageId || l.name===lineageId || l.selectableLabel===lineageId); }
  function selectedBiome(prefix){ const group=q(prefix+'_biomeGroup')?.value; const id=q(prefix+'_biome')?.value; const b=(BIOMES[group]||[]).find(x=>x.id===id || x.name===id); return {group,id,name:b?.name||id, data:b||null}; }
  function selectedPronoun(prefix){
    const name=q(prefix+'_pronoun')?.value;
    let p=(PRONOUNS||[]).find(x=>x.name===name) || null;
    if(p?.name==='Add your own') p={group:'Custom',name:'Custom',subject:q(prefix+'_customSubject')?.value||'',object:q(prefix+'_customObject')?.value||'',possessiveDeterminer:q(prefix+'_customPossDet')?.value||'',possessivePronoun:q(prefix+'_customPossPronoun')?.value||'',reflexive:q(prefix+'_customReflexive')?.value||'',example:'Custom pronouns supplied on this page.'};
    return p;
  }
  function pronounText(p){ return p ? [p.subject,p.object,p.possessiveDeterminer,p.possessivePronoun,p.reflexive].filter(Boolean).join('/') : ''; }
  function lineageLabel(payload){ return [payload.raceName, payload.lineageName].filter(Boolean).join(' — '); }
  function collectPanel(prefix){
    const categoryId=q(prefix+'_category')?.value || '';
    const raceId=q(prefix+'_race')?.value || '';
    const lineageId=q(prefix+'_lineage')?.value || '';
    const cat=findCategory(categoryId);
    const race=findRace(categoryId,raceId);
    const lin=findLineage(categoryId,raceId,lineageId);
    const biome=selectedBiome(prefix);
    const pron=selectedPronoun(prefix);
    const gender=q(prefix+'_gender')?.value || '';
    const titles=[...(panelState[prefix]?.titles||[])];
    const appearance = [
      biome.name ? `Biome presentation: ${biome.name}. ${biome.data?.appearance || ''}` : '',
      race ? `Heritage presentation: ${race.name}. ${race.description || ''}` : '',
      lin ? `Lineage thread: ${lin.selectableLabel || lin.name}. ${lin.description || ''}` : '',
      gender ? `Gender identity presentation note: ${gender}.` : '',
      pron ? `Pronouns: ${pronounText(pron)}.` : '',
      titles.length ? `Honorifics/endearments: ${titles.join(', ')}.` : ''
    ].filter(Boolean).join('\n\n');
    const behavior = [
      biome.data?.behavior ? `Biome behavior/roleplay: ${biome.data.behavior}` : '',
      race?.description ? `Heritage behavior hooks: ${race.description}` : '',
      lin?.description ? `Lineage behavior hooks: ${lin.description}` : '',
      'Gender identity, pronouns, and honorifics guide respectful address, presentation language, dialogue tags, and social terms; they do not determine morality, combat role, or personality.'
    ].filter(Boolean).join('\n\n');
    const payload={
      schema:'belavados.dropdownBuilder.embeddedPagePayload.v1',
      createdAt:new Date().toISOString(),
      sourcePage:prefix==='genCustom'?'Character Generator':'Voice Studio',
      heritageMode:q(prefix+'_heritageMode')?.value || 'single',
      biomeGroup:biome.group, biomeId:biome.id, biomeName:biome.name, biomeData:biome.data,
      categoryId, categoryName:cat?.name || '', raceId, raceName:race?.name || '', lineageId, lineageName:lin?.selectableLabel || lin?.name || '', lineageData:lin || null,
      genderIdentity:gender, pronounSet:pron, pronounText:pronounText(pron), titlesHonorificsEndearments:titles,
      lineageLabel:'', appearanceDescription:appearance, behaviorDescription:behavior
    };
    payload.lineageLabel = lineageLabel(payload);
    return payload;
  }
  function refreshPanel(prefix){
    const payload=collectPanel(prefix);
    if(q(prefix+'_appearance')) q(prefix+'_appearance').value=payload.appearanceDescription;
    if(q(prefix+'_behavior')) q(prefix+'_behavior').value=payload.behaviorDescription;
    if(q(prefix+'_selectionJson')) q(prefix+'_selectionJson').value=JSON.stringify(payload,null,2);
    const chips=q(prefix+'_titleChips'); if(chips) chips.innerHTML=(panelState[prefix]?.titles||[]).map(t=>`<span>${esc(t)}</span>`).join('');
    updateFullSiteExportSoon();
  }
  function populatePanel(prefix){
    if(!q(prefix+'_customBuilderPanel')) return;
    setOpts(q(prefix+'_biomeGroup'), Object.keys(BIOMES||{}), x=>x, x=>x, 'Select biome group…');
    const fillBiomes=()=>{ const g=q(prefix+'_biomeGroup')?.value; setOpts(q(prefix+'_biome'), BIOMES[g]||[], b=>b.name, b=>b.id, 'Select biome…'); refreshPanel(prefix); };
    q(prefix+'_biomeGroup')?.addEventListener('change', fillBiomes);
    setOpts(q(prefix+'_category'), SOURCE.categories||[], c=>c.name, c=>c.id||c.categoryId, 'Select racial category…');
    const fillRaces=()=>{ const cat=findCategory(q(prefix+'_category')?.value); setOpts(q(prefix+'_race'), cat?.races||[], r=>r.name, r=>r.id, 'Select race…'); fillLineages(); };
    const fillLineages=()=>{ const r=findRace(q(prefix+'_category')?.value, q(prefix+'_race')?.value); setOpts(q(prefix+'_lineage'), r?.lineages||[], l=>l.selectableLabel||l.name, l=>l.id, 'No lineage / use base race'); refreshPanel(prefix); };
    q(prefix+'_category')?.addEventListener('change', fillRaces);
    q(prefix+'_race')?.addEventListener('change', fillLineages);
    q(prefix+'_lineage')?.addEventListener('change', ()=>refreshPanel(prefix));
    setOpts(q(prefix+'_gender'), SOURCE.genderIdentityDropdown||[], x=>x, x=>x, 'Select gender identity…');
    setOpts(q(prefix+'_pronoun'), PRONOUNS||[], p=>`${p.group} — ${p.name}`, p=>p.name, 'Select pronoun set…');
    setOpts(q(prefix+'_title'), TITLES||[], x=>x, x=>x, 'Select title/honorific…');
    ['heritageMode','gender','pronoun','customSubject','customObject','customPossDet','customPossPronoun','customReflexive','customTitle'].forEach(s=>q(prefix+'_'+s)?.addEventListener('input',()=>refreshPanel(prefix)));
    q(prefix+'_addTitle')?.addEventListener('click',()=>{ const t=q(prefix+'_title')?.value; if(t && !panelState[prefix].titles.includes(t)) panelState[prefix].titles.push(t); refreshPanel(prefix); });
    q(prefix+'_addCustomTitle')?.addEventListener('click',()=>{ const t=(q(prefix+'_customTitle')?.value||'').trim(); if(t && !panelState[prefix].titles.includes(t)) panelState[prefix].titles.push(t); if(q(prefix+'_customTitle')) q(prefix+'_customTitle').value=''; refreshPanel(prefix); });
    q(prefix+'_clearTitles')?.addEventListener('click',()=>{ panelState[prefix].titles=[]; refreshPanel(prefix); });
    q(prefix+'_hideDirect')?.addEventListener('change',()=>toggleDirectControls(prefix, q(prefix+'_hideDirect').checked));
    q(prefix+'_applyCustomToPage')?.addEventListener('click',()=>{ if(prefix==='genCustom') applyPanelToGenerator(prefix); else applyPanelToVoice(prefix); });
    q(prefix+'_pushToSheet')?.addEventListener('click',()=>pushAllToSheet());
    q(prefix+'_pullFromSheet')?.addEventListener('click',()=>pullSheetToSite(prefix));
    fillBiomes(); fillRaces(); refreshPanel(prefix);
  }
  function setSelect(id,value){
    const el=q(id); if(!el || value==null) return false;
    const want=String(value).trim().toLowerCase();
    let opt=Array.from(el.options||[]).find(o=>String(o.value).trim().toLowerCase()===want || String(o.textContent).trim().toLowerCase()===want);
    if(!opt && value){ opt=document.createElement('option'); opt.value=value; opt.textContent=value; el.appendChild(opt); }
    if(opt){ el.value=opt.value; el.dispatchEvent(new Event('change',{bubbles:true})); return true; }
    return false;
  }
  function toggleDirectControls(prefix, hide){
    const ids = prefix==='genCustom'
      ? ['pronouns','genderIdentity','raceCategory','raceSelect','race2Enabled','race2Category','race2Select','biomeCategory','biomeSelect','primaryClass','primarySubclass','primaryLevel','multiEnabled','secondaryClass','secondarySubclass','secondaryLevel','totalLevel','magicSchool']
      : ['voiceGender','voiceRace','voiceBiome','voiceAlignment','voiceClass','voiceSubclass'];
    ids.forEach(id=>q(id)?.closest('label')?.classList.toggle('resource-hidden', !!hide));
  }
  function applyPanelToGenerator(prefix){
    const p=collectPanel(prefix);
    if(p.pronounText && q('pronouns')) q('pronouns').value=p.pronounText;
    setSelect('genderIdentity', p.genderIdentity);
    if(p.categoryName) setSelect('raceCategory', p.categoryName);
    if(window.updateRaceOptions) window.updateRaceOptions('raceCategory','raceSelect');
    setSelect('raceSelect', p.raceName);
    if(p.biomeGroup) setSelect('biomeCategory', p.biomeGroup);
    if(window.updateBiomeOptions) window.updateBiomeOptions();
    setSelect('biomeSelect', p.biomeName);
    if(window.renderAll) window.renderAll();
    updateFullSiteExportSoon();
  }
  function applyPanelToVoice(prefix){
    const p=collectPanel(prefix);
    setSelect('voiceGender', p.genderIdentity);
    setSelect('voiceRace', p.raceName);
    setSelect('voiceBiome', p.biomeName);
    const add = [p.lineageLabel, p.appearanceDescription, p.behaviorDescription].filter(Boolean).join('\n\n');
    if(add && q('voiceNotes')) q('voiceNotes').value = (q('voiceNotes').value ? q('voiceNotes').value+'\n\n' : '') + add;
    if(window.buildVoiceProfile) window.buildVoiceProfile('custom-dropdown-panel');
    updateFullSiteExportSoon();
  }
  function sheetWin(){ return q('characterSheetFrame')?.contentWindow || null; }
  function sheetApi(){ try { return sheetWin()?.BelavadosSheetApi || null; } catch(e){ return null; } }
  function collectSheet(){ try { return sheetApi()?.collect ? sheetApi().collect() : null; } catch(e) { console.warn(e); return null; } }
  function collectVoice(){ try { return window.makeVoiceExport ? window.makeVoiceExport('full-site-export') : (window.lastVoice || null); } catch(e){ return window.lastVoice || null; } }
  function collectGenerator(){ try { return window.makeCharacter ? window.makeCharacter() : null; } catch(e){ return window.lastCharacter || null; } }
  function collectAllSiteData(){
    const generator=collectGenerator();
    const voice=collectVoice();
    const sheet=collectSheet();
    const data={
      schema:'belavados.fullInteractiveCharacterSite.v2',
      exportedAt:new Date().toISOString(),
      generator, voice,
      dropdowns:{generator:collectPanel('genCustom'), voice:collectPanel('voiceCustom')},
      exactSpeech:q('previewText')?.value || '',
      sheet,
      pageState:{generatorHideDirect:!!q('genCustom_hideDirect')?.checked, voiceHideDirect:!!q('voiceCustom_hideDirect')?.checked}
    };
    return data;
  }
  function pushAllToSheet(){
    const payload=collectAllSiteData();
    const api=sheetApi();
    if(api?.applySitePayload) api.applySitePayload(payload);
    else sheetWin()?.postMessage({type:'belavados-apply-site-payload', payload}, '*');
    if(q('forgeStatus')) q('forgeStatus').textContent='Copied generator, dropdown, voice, stats, alignment, and speech data into the character sheet.';
    updateFullSiteExportSoon();
  }
  function pullSheetToSite(prefix){
    const s=collectSheet(); if(!s) { if(q('forgeStatus')) q('forgeStatus').textContent='Sheet is not ready yet.'; return; }
    if(q('characterName') && s.characterName) q('characterName').value=s.characterName;
    if(q('playerName') && s.playerName) q('playerName').value=s.playerName;
    if(q('pronouns') && s.characterPronouns) q('pronouns').value=s.characterPronouns;
    setSelect('genderIdentity', s.genderIdentity);
    if(s.primaryClass) { setSelect('primaryClass', s.primaryClass); if(window.updateSubclassOptions) window.updateSubclassOptions('primaryClass','primarySubclass'); }
    setSelect('primarySubclass', s.primarySubclass);
    if(s.secondaryClass) { setSelect('multiEnabled','yes'); setSelect('secondaryClass', s.secondaryClass); if(window.updateSubclassOptions) window.updateSubclassOptions('secondaryClass','secondarySubclass'); }
    setSelect('secondarySubclass', s.secondarySubclass);
    if(s.lineage?.originBiome) setSelect('biomeSelect', s.lineage.originBiome);
    if(s.lineage?.raceCategory) setSelect('raceCategory', s.lineage.raceCategory);
    if(window.updateRaceOptions) window.updateRaceOptions('raceCategory','raceSelect');
    if(s.lineage?.race1 || s.race) setSelect('raceSelect', s.lineage?.race1 || s.race);
    if(s.voice?.previewText && q('previewText')) q('previewText').value=s.voice.previewText;
    if(q('voiceName') && s.characterName) q('voiceName').value=s.characterName;
    setSelect('voiceGender', s.genderIdentity);
    setSelect('voiceRace', s.lineage?.race1 || s.race);
    setSelect('voiceBiome', s.lineage?.originBiome);
    setSelect('voiceClass', s.primaryClass); if(window.updateVoiceSubclassOptions) window.updateVoiceSubclassOptions(); setSelect('voiceSubclass', s.primarySubclass);
    if(q('voiceNotes') && s.fallbackEtc) q('voiceNotes').value=s.fallbackEtc;
    if(window.renderAll) window.renderAll();
    if(window.buildVoiceProfile) window.buildVoiceProfile('sheet-pull');
    if(prefix) refreshPanel(prefix);
    updateFullSiteExportSoon();
  }
  function cloneAxisBars(targetId, summaryId){
    const c=collectGenerator(); if(!c?.alignment) return;
    const axes=c.alignment.axes||{};
    const names=window.axisNames || {altruism:'Altruism',lawfulness:'Lawfulness',cooperation:'Cooperation',honor:'Honor'};
    const labeler=window.axisLabel || ((a,v)=>String(v));
    const target=q(targetId); if(!target) return;
    target.innerHTML=Object.entries(axes).map(([a,v])=>`<div class="axis" data-axis-clone="${esc(a)}"><div class="axis-top"><strong>${esc(names[a]||a)} Axis</strong><span>${v} / 3000 — ${esc(c.alignment.labels?.[a] || labeler(a,v))}</span></div><progress class="axis-progress" max="3000" value="${v}">${v}</progress><input class="alignment-slider cloned-axis-slider" data-cloned-axis="${esc(a)}" type="range" min="0" max="3000" step="250" value="${v}"></div>`).join('');
    if(q(summaryId)) q(summaryId).textContent=c.alignment.summary || '';
    target.querySelectorAll('[data-cloned-axis]').forEach(inp=>inp.addEventListener('input',()=>{
      window.alignmentMode='manual';
      window.manualAlignmentAxes = window.manualAlignmentAxes || {...axes};
      window.manualAlignmentAxes[inp.dataset.clonedAxis]=Number(inp.value);
      if(window.renderAll) window.renderAll();
      setTimeout(()=>{ cloneAxisBars('forgeAxisBars','forgeAlignmentSummary'); cloneAxisBars('voiceAxisBars','voiceAxisSummary'); pushAllToSheet(); }, 0);
    }));
  }
  function updateFullSiteExport(){
    cloneAxisBars('forgeAxisBars','forgeAlignmentSummary');
    cloneAxisBars('voiceAxisBars','voiceAxisSummary');
    if(q('characterExport')) {
      try { q('characterExport').value = JSON.stringify(collectAllSiteData(), null, 2); } catch(e) { console.warn(e); }
    }
  }
  let exportTimer=null;
  function updateFullSiteExportSoon(){ clearTimeout(exportTimer); exportTimer=setTimeout(updateFullSiteExport,80); }
  function downloadBlob(name, text, type='application/octet-stream'){
    const blob=new Blob([text],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),500);
  }
  function downloadSheetHtml(){
    const api=sheetApi();
    if(!api?.exportCurrentHtml) { alert('Character sheet is not ready yet.'); return; }
    const html=api.exportCurrentHtml();
    const c=collectGenerator();
    const slug=(c?.identity?.name || 'belavados-character-sheet').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'belavados-character-sheet';
    downloadBlob(slug + '.html', html, 'text/html');
  }
  function wireButtons(){
    q('pushAllToSheetBtn')?.addEventListener('click',pushAllToSheet);
    q('pullSheetToSiteBtn')?.addEventListener('click',()=>pullSheetToSite());
    q('downloadSheetHtmlBtn')?.addEventListener('click',downloadSheetHtml);
    q('copyToForgeFromGeneratorVoice')?.addEventListener('click',pushAllToSheet);
    q('copyToGeneratorFromForgeVoice')?.addEventListener('click',()=>pullSheetToSite('genCustom'));
    q('copyToVoiceFromGeneratorForge')?.addEventListener('click',()=>{ if(window.loadCharacterToVoice) window.loadCharacterToVoice(true); const s=collectSheet(); if(s?.voice?.previewText && q('previewText')) q('previewText').value=s.voice.previewText; if(window.buildVoiceProfile) window.buildVoiceProfile('generator-forge-copy'); updateFullSiteExportSoon(); });
    q('refreshExportBtn')?.addEventListener('click',updateFullSiteExport);
    q('downloadCharacterJsonBtn')?.addEventListener('click',()=>downloadBlob('belavados-full-character-site.json', JSON.stringify(collectAllSiteData(), null, 2), 'application/json'));
    q('copyCharacterJsonBtn')?.addEventListener('click',()=>navigator.clipboard?.writeText(JSON.stringify(collectAllSiteData(), null, 2)));
  }
  function patchRenderExport(){
    const old=window.renderExport;
    if(typeof old==='function' && !old.__fullPatch){
      const wrapped=function(c){ old(c); updateFullSiteExportSoon(); };
      wrapped.__fullPatch=true;
      window.renderExport=wrapped;
    }
    const oldMirrors=window.updatePageResourceMirrors;
    if(typeof oldMirrors==='function' && !oldMirrors.__axisPatch){
      const wrapped=function(c){ oldMirrors(c); cloneAxisBars('forgeAxisBars','forgeAlignmentSummary'); cloneAxisBars('voiceAxisBars','voiceAxisSummary'); };
      wrapped.__axisPatch=true;
      window.updatePageResourceMirrors=wrapped;
    }
  }
  function init(){
    populatePanel('genCustom'); populatePanel('voiceCustom'); wireButtons(); patchRenderExport(); updateFullSiteExportSoon();
    q('characterSheetFrame')?.addEventListener('load',()=>setTimeout(pushAllToSheet,250));
    document.addEventListener('input', e=>{ if(e.target && (e.target.matches('input,textarea,select'))) updateFullSiteExportSoon(); }, true);
    window.addEventListener('message', ev=>{ if(ev.data?.type==='belavados-sheet-ready') pushAllToSheet(); });
  }
  window.BelavadosFullSiteBridge={collectAllSiteData,pushAllToSheet,pullSheetToSite,downloadSheetHtml,collectPanel};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
