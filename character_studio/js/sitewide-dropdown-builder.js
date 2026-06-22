
(function(){
  'use strict';
  const doc = document;
  function parseJson(id, fallback){
    try{ const el = doc.getElementById(id); return el ? JSON.parse(el.textContent || '') : fallback; }catch(err){ console.warn('Belavadös dropdown data parse failed for', id, err); return fallback; }
  }
  const SOURCE_DATA = parseJson('bddSourceData', {categories:[]});
  const BIOMES = parseJson('bddBiomeData', {});
  const PRONOUN_SETS = parseJson('bddPronounData', []);
  const TITLE_OPTIONS = parseJson('bddTitleData', []);
  const categories = SOURCE_DATA.categories || [];
  const raceMap = new Map();
  const categoryMap = new Map();
  categories.forEach(c => { categoryMap.set(c.id, c); (c.races || []).forEach(r => raceMap.set(r.id, Object.assign({}, r, {categoryId:c.id, categoryName:c.name}))); });
  const allBiomeList = () => Object.entries(BIOMES || {}).flatMap(([group, arr]) => (arr || []).map(b => Object.assign({group}, b)));
  const clean = s => String(s == null ? '' : s).trim();
  const lower = s => clean(s).toLowerCase();
  const firstSentences = (txt, count=2) => {
    txt = clean(txt).replace(/\s+/g,' '); if(!txt) return '';
    const parts = txt.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [txt];
    return parts.slice(0,count).join(' ').trim();
  };
  function textTags(text){
    const t = lower(text); const tags = new Set(); const add = arr => arr.forEach(x => tags.add(x));
    if (/human|adaptable|mixed heritage|khoravar|half-elf|half-orc/.test(t)) add(['any','plains','forest','mountain','ocean','city','farm','valley','beach']);
    if (/ocean|sea|aquatic|water|underwater|reef|coral|merfolk|triton|locathah|tide|river|fish|gill|deep-sea|abyss|coast|mangrove/.test(t)) add(['ocean','sea','underwater','reef','aquatic','water','beach']);
    if (/swamp|marsh|bog|wetland|blackwater|mire|fungal|mud|gravewater/.test(t)) add(['swamp','marsh','wetland','bog','water','fungal','forest']);
    if (/rainforest|jungle|canopy|colossal jungle|flooded jungle/.test(t)) add(['rainforest','jungle','canopy','forest','wetland','tree']);
    if (/forest|wood|tree|leaf|root|moss|grove|fey|satyr|firbolg|plant|thorn|vine/.test(t)) add(['forest','wood','tree','root','moss','leaf']);
    if (/treetop|aerial|winged|bird|avian|sky|flight|aerie|wind|cloud/.test(t)) add(['treetop','canopy','aerial','sky','mountain']);
    if (/grassland|prairie|plain|field|farm|harvest|rural|reed|savanna/.test(t)) add(['plains','grassland','prairie','farming','field','grass']);
    if (/mountain|stone|dwarf|goliath|giant|cliff|highland|valley|granite|mineral/.test(t)) add(['mountain','stone','highland','valley']);
    if (/cavern|underdark|underground|subterranean|tunnel|deep gnome|duergar|drow|darkvision/.test(t)) add(['cavern','underground','underdark','stone','dark','deep']);
    if (/construct|autognome|warforged|artificial|mechanical/.test(t)) add(['city','cavern','mountain','plains']);
    return tags;
  }
  function setOptions(sel, items, placeholder){
    if(!sel) return;
    const prior = sel.value;
    sel.innerHTML = '';
    if(placeholder){ const opt = new Option(placeholder, ''); sel.appendChild(opt); }
    (items || []).forEach(item => sel.appendChild(new Option(item.label, item.value)));
    if(prior && Array.from(sel.options).some(o => o.value === prior)) sel.value = prior;
    else if(sel.options.length > (placeholder ? 1 : 0)) sel.selectedIndex = placeholder ? 1 : 0;
  }
  function dispatch(el){ if(!el) return; el.dispatchEvent(new Event('input', {bubbles:true})); el.dispatchEvent(new Event('change', {bubbles:true})); }
  function setSelectByValueOrText(id, desired){
    const el = doc.getElementById(id); if(!el || desired == null) return false;
    const d = clean(desired); if(!d) return false;
    const exact = Array.from(el.options).find(o => o.value === d || clean(o.textContent) === d);
    const norm = lower(d);
    const loose = exact || Array.from(el.options).find(o => lower(o.value) === norm || lower(o.textContent) === norm);
    if(loose){ el.value = loose.value; dispatch(el); return true; }
    const opt = new Option(d, d); opt.dataset.swddbAdded = 'true'; el.appendChild(opt); el.value = d; dispatch(el); return true;
  }
  function setInput(id, value){ const el = doc.getElementById(id); if(!el) return false; el.value = value || ''; dispatch(el); return true; }
  function findBiomeGroup(id){ for(const [group, arr] of Object.entries(BIOMES || {})){ if((arr || []).some(b => b.id === id)) return group; } return ''; }
  function findBiome(id){ return allBiomeList().find(b => b.id === id) || null; }
  function selectedBiomeTags(ids){ const tags = new Set(); ids.map(findBiome).filter(Boolean).forEach(b => (b.tags || []).forEach(t => tags.add(t))); return tags; }
  function raceTagSet(race, lineage=null){ return textTags([race.categoryName, race.category, race.name, race.description, lineage && lineage.name, lineage && lineage.description, lineage && lineage.selectableLabel].filter(Boolean).join(' ')); }
  function compatibleWithBiome(race, lineage, biomeIds){
    if(!biomeIds.length) return true;
    const btags = selectedBiomeTags(biomeIds); const rtags = raceTagSet(race, lineage);
    if(rtags.has('any')) return true;
    for(const tag of rtags){ if(btags.has(tag)) return true; }
    return false;
  }
  function visibleRacesForCategory(catId, opts){
    opts = Object.assign({biome:true, allowedIds:null, biomeIds:[]}, opts || {});
    const cat = categoryMap.get(catId); if(!cat) return [];
    return (cat.races || []).filter(r => (!opts.allowedIds || opts.allowedIds.has(r.id)) && (!opts.biome || compatibleWithBiome(Object.assign({}, r, {categoryId:cat.id, categoryName:cat.name}), null, opts.biomeIds)));
  }
  function categoriesWithVisibleRaces(opts){ return categories.filter(c => visibleRacesForCategory(c.id, opts).length); }
  function lineageLabel(lineage, race){ return lineage.selectableLabel || `${race.name} — ${lineage.name}`; }
  function selectedLineage(raceId, lineageId){ const race = raceMap.get(raceId); return race ? ((race.lineages || []).find(l => l.id === lineageId) || null) : null; }
  function selectionObj(catId, raceId, lineageId){
    const cat = categoryMap.get(catId); const race = raceMap.get(raceId); const lin = selectedLineage(raceId, lineageId);
    if(!cat || !race) return null;
    return {categoryId:cat.id, categoryName:cat.name, raceId:race.id, raceName:race.name, raceDescription:race.description || '', bloodlineId:lin && lin.id || null, bloodlineName:lin && lin.name || null, bloodlineLabel:lin ? lineageLabel(lin, race) : null, bloodlineDescription:lin && lin.description || null};
  }
  function allowedPartnerIdsForParent(raceId){
    const set = new Set((SOURCE_DATA.halfRaceAllowedPartnerIdsByRace || {})[raceId] || []);
    if(raceId) set.add(raceId);
    const race = raceMap.get(raceId);
    if(race && !set.size) (categoryMap.get(race.categoryId)?.races || []).forEach(r => set.add(r.id));
    return set;
  }
  function describeSelection(sel){
    if(!sel) return '';
    const pieces = [`<strong>${sel.raceName}</strong> — ${firstSentences(sel.raceDescription,2)}`];
    if(sel.bloodlineName) pieces.push(`<br><br><strong>${sel.bloodlineName}</strong> — ${firstSentences(sel.bloodlineDescription,2)}`);
    return pieces.join('');
  }
  function safeFilePart(txt){ return clean(txt).replace(/[^a-z0-9_-]+/gi,'_').replace(/^_+|_+$/g,'').slice(0,40) || 'selection'; }

  function DropdownInstance(root){
    this.root = root;
    this.prefix = root.dataset.swddbPrefix || root.id || 'swddb';
    this.page = root.dataset.swddbPage || '';
    this.state = {biomeCache:[], titleCache:[]};
    this.fields = name => root.querySelector(`[data-field="${name}"]`);
    this.output = name => root.querySelector(`[data-output="${name}"]`);
    this.storageKey = `belavados.swddb.${this.prefix}.v1`;
    this.hiddenKey = `belavados.swddb.hidden.${this.prefix}.v1`;
    this.loadState(); this.init();
  }
  DropdownInstance.prototype.loadState = function(){
    try{ const saved = JSON.parse(localStorage.getItem(this.storageKey) || '{}'); if(saved && typeof saved === 'object') Object.assign(this.state, saved); }catch(e){}
  };
  DropdownInstance.prototype.saveState = function(){ try{ localStorage.setItem(this.storageKey, JSON.stringify(this.state)); }catch(e){} };
  DropdownInstance.prototype.init = function(){
    this.refreshBiomeGroups(); this.populateIdentity(); this.bind(); this.applyHiddenState(); this.refreshAll();
  };
  DropdownInstance.prototype.val = function(name){ const el=this.fields(name); return el ? el.value : ''; };
  DropdownInstance.prototype.refreshBiomeGroups = function(){
    const groups = Object.keys(BIOMES || {});
    setOptions(this.fields('biomeGroup'), groups.map(g => ({label:g, value:g})), 'Select biome group…');
    const group = this.val('biomeGroup') || groups[0] || '';
    if(group) this.fields('biomeGroup').value = group;
    this.refreshBiomeSelect();
  };
  DropdownInstance.prototype.refreshBiomeSelect = function(){
    const group = this.val('biomeGroup') || Object.keys(BIOMES || {})[0] || '';
    setOptions(this.fields('biome'), (BIOMES[group] || []).map(b => ({label:b.name, value:b.id})), 'Select biome…');
  };
  DropdownInstance.prototype.populateIdentity = function(){
    setOptions(this.fields('genderIdentity'), (SOURCE_DATA.genderIdentityDropdown || []).map(x => ({label:x, value:x})), 'Select gender identity…');
    setOptions(this.fields('pronounSet'), (PRONOUN_SETS || []).map((p,i) => ({label:`${p.group || 'Pronouns'} — ${p.name || 'Set '+(i+1)}`, value:String(i)})), 'Select pronoun set…');
    const pron = this.fields('pronounSet'); if(pron && !Array.from(pron.options).some(o => o.value === 'custom')) pron.appendChild(new Option('Custom pronouns…','custom'));
    setOptions(this.fields('titleSelect'), (TITLE_OPTIONS || []).map(t => ({label:t, value:t})), 'Select title…');
  };
  DropdownInstance.prototype.populateCategory = function(sel, opts){ setOptions(sel, categoriesWithVisibleRaces(Object.assign({biomeIds:this.state.biomeCache}, opts || {})).map(c => ({label:c.name, value:c.id})), 'Select racial category…'); };
  DropdownInstance.prototype.populateRace = function(catSel, raceSel, opts){ setOptions(raceSel, visibleRacesForCategory(catSel && catSel.value, Object.assign({biomeIds:this.state.biomeCache}, opts || {})).map(r => ({label:r.name, value:r.id})), 'Select race…'); };
  DropdownInstance.prototype.populateLineage = function(raceSel, lineageSel){
    const race = raceMap.get(raceSel && raceSel.value);
    if(!race || !(race.lineages || []).length){ setOptions(lineageSel, [], 'No bloodline dropdown for this race'); if(lineageSel) lineageSel.disabled = true; return; }
    if(lineageSel) lineageSel.disabled = false;
    setOptions(lineageSel, race.lineages.map(l => ({label:lineageLabel(l, race), value:l.id})), 'Select bloodline / lineage…');
  };
  DropdownInstance.prototype.renderChips = function(){
    const biomes = this.output('biomeChips'); if(biomes){ biomes.innerHTML = ''; this.state.biomeCache.map(findBiome).filter(Boolean).forEach(b => { const span=doc.createElement('span'); span.className='chip'; span.innerHTML = `<span>${b.name}</span>`; const btn=doc.createElement('button'); btn.type='button'; btn.textContent='×'; btn.title='Remove biome'; btn.addEventListener('click',()=>{ this.state.biomeCache=this.state.biomeCache.filter(id=>id!==b.id); this.saveState(); this.refreshAll(); }); span.appendChild(btn); biomes.appendChild(span); }); }
    const titles = this.output('titleChips'); if(titles){ titles.innerHTML = ''; this.state.titleCache.forEach(t => { const span=doc.createElement('span'); span.className='chip'; span.innerHTML = `<span>${t}</span>`; const btn=doc.createElement('button'); btn.type='button'; btn.textContent='×'; btn.title='Remove title'; btn.addEventListener('click',()=>{ this.state.titleCache=this.state.titleCache.filter(x=>x!==t); this.saveState(); this.refreshAll(); }); span.appendChild(btn); titles.appendChild(span); }); }
  };
  DropdownInstance.prototype.refreshMode = function(){
    const mixed = this.val('heritageMode') === 'mixed';
    const singlePanel = this.root.querySelector('[data-panel="single"]');
    const mixedPanel = this.root.querySelector('[data-panel="mixed"]');
    if(singlePanel) singlePanel.classList.toggle('swddb-hidden', mixed);
    if(mixedPanel) mixedPanel.classList.toggle('swddb-hidden', !mixed);
  };
  DropdownInstance.prototype.refreshSingle = function(){
    this.populateCategory(this.fields('primaryCategory'), {biome:true});
    this.populateRace(this.fields('primaryCategory'), this.fields('primaryRace'), {biome:true});
    this.populateLineage(this.fields('primaryRace'), this.fields('primaryLineage'));
    const d=this.output('primaryDescription'); if(d) d.innerHTML=describeSelection(selectionObj(this.val('primaryCategory'), this.val('primaryRace'), this.val('primaryLineage')));
  };
  DropdownInstance.prototype.refreshMixed = function(){
    const applyBiome = this.val('filterMixedByBiome') !== 'no';
    this.populateCategory(this.fields('p1Category'), {biome:applyBiome});
    this.populateRace(this.fields('p1Category'), this.fields('p1Race'), {biome:applyBiome});
    this.populateLineage(this.fields('p1Race'), this.fields('p1Lineage'));
    const d1=this.output('p1Description'); if(d1) d1.innerHTML=describeSelection(selectionObj(this.val('p1Category'), this.val('p1Race'), this.val('p1Lineage')));
    const allowedIds = allowedPartnerIdsForParent(this.val('p1Race'));
    this.populateCategory(this.fields('p2Category'), {biome:applyBiome, allowedIds});
    this.populateRace(this.fields('p2Category'), this.fields('p2Race'), {biome:applyBiome, allowedIds});
    this.populateLineage(this.fields('p2Race'), this.fields('p2Lineage'));
    const d2=this.output('p2Description'); if(d2) d2.innerHTML=describeSelection(selectionObj(this.val('p2Category'), this.val('p2Race'), this.val('p2Lineage')));
    const status=this.output('mixedRuleStatus'); if(status){ const count=categoriesWithVisibleRaces({biome:applyBiome, allowedIds, biomeIds:this.state.biomeCache}).reduce((n,c)=>n+visibleRacesForCategory(c.id,{biome:applyBiome, allowedIds, biomeIds:this.state.biomeCache}).length,0); status.textContent = this.val('p1Race') ? `${count} compatible Parent 2 race options are available for the selected Parent 1.` : 'Choose Parent 1 to filter Parent 2.'; }
  };
  DropdownInstance.prototype.currentPronouns = function(){
    if(this.val('pronounSet') === 'custom') return {group:'Custom Pronouns', name:'Custom', subject:this.val('customSubject'), object:this.val('customObject'), possessiveDeterminer:this.val('customPossDet'), possessivePronoun:this.val('customPossPronoun'), reflexive:this.val('customReflexive'), example:''};
    const idx = Number(this.val('pronounSet'));
    return Number.isFinite(idx) ? (PRONOUN_SETS[idx] || null) : null;
  };
  DropdownInstance.prototype.refreshPronouns = function(){
    const custom = this.val('pronounSet') === 'custom';
    const box = this.root.querySelector('[data-panel="customPronouns"]'); if(box) box.classList.toggle('swddb-hidden', !custom);
    const pron = this.currentPronouns();
    const desc = this.output('pronounDescription');
    if(desc){ desc.innerHTML = pron ? `<strong>${pron.name || 'Custom'}</strong>: ${pron.subject || '—'} / ${pron.object || '—'} / ${pron.possessiveDeterminer || '—'} / ${pron.possessivePronoun || '—'} / ${pron.reflexive || '—'}${pron.example ? '<br>'+pron.example : ''}` : 'No pronoun set selected yet.'; }
  };
  DropdownInstance.prototype.biomeNarrative = function(){
    const bs = this.state.biomeCache.map(findBiome).filter(Boolean);
    if(!bs.length) return {names:[], appearance:'No biome cache is selected, so appearance can be drawn from the full heritage description.', behavior:'No biome cache is selected, so behavior is not limited by settlement terrain.'};
    return {names:bs.map(b=>b.name), appearance:bs.map(b=>`${b.name} contributes ${b.appearance || 'environmental traits.'}`).join(' '), behavior:bs.map(b=>`${b.name} encourages someone who is ${b.behavior || 'shaped by that terrain.'}`).join(' ')};
  };
  DropdownInstance.prototype.heritageNarrative = function(){
    const mode=this.val('heritageMode') || 'single';
    if(mode === 'single'){
      const sel=selectionObj(this.val('primaryCategory'), this.val('primaryRace'), this.val('primaryLineage'));
      if(!sel) return {mode, summary:'No single heritage selected.', appearance:'', behavior:'', primary:null, secondary:null};
      return {mode, primary:sel, secondary:null, summary: sel.bloodlineName ? `${sel.raceName} with the ${sel.bloodlineName} bloodline.` : `${sel.raceName} single heritage.`, appearance:`The visible body plan should start from ${sel.raceName}. ${firstSentences(sel.raceDescription,3)} ${sel.bloodlineDescription ? 'Bloodline expression: '+firstSentences(sel.bloodlineDescription,3) : ''}`, behavior:`Behavioral cues should come from heritage culture and environment: ${firstSentences(sel.bloodlineDescription || sel.raceDescription,3)}`};
    }
    const p1=selectionObj(this.val('p1Category'), this.val('p1Race'), this.val('p1Lineage'));
    const p2=selectionObj(this.val('p2Category'), this.val('p2Race'), this.val('p2Lineage'));
    if(!p1 || !p2) return {mode, summary:'Mixed parentage incomplete.', appearance:'', behavior:'', primary:p1, secondary:p2};
    const sameRace = p1.raceId === p2.raceId;
    return {mode, primary:p1, secondary:p2, summary:`${p1.bloodlineName || p1.raceName} + ${p2.bloodlineName || p2.raceName} mixed parentage${sameRace ? ' within the same race' : ''}.`, appearance:`The character should visibly blend Parent 1 (${p1.raceName}${p1.bloodlineName ? ' — '+p1.bloodlineName : ''}) and Parent 2 (${p2.raceName}${p2.bloodlineName ? ' — '+p2.bloodlineName : ''}). Parent 1 contributes: ${firstSentences(p1.bloodlineDescription || p1.raceDescription,2)} Parent 2 contributes: ${firstSentences(p2.bloodlineDescription || p2.raceDescription,2)} Because all racial bloodlines can mix, both bloodlines should appear as a balanced hybrid rather than one replacing the other.`, behavior:`Roleplay should blend inherited instincts and culture from both parents. Parent 1 influence: ${firstSentences(p1.bloodlineDescription || p1.raceDescription,2)} Parent 2 influence: ${firstSentences(p2.bloodlineDescription || p2.raceDescription,2)} The result can lean toward either parent by story choice, but the dropdown rules do not force one side to dominate.`};
  };
  DropdownInstance.prototype.identityNarrative = function(){
    const gender=this.val('genderIdentity') || null; const pron=this.currentPronouns(); const titles=[...this.state.titleCache];
    let out = gender ? `This character is ${gender}, so use that identity label respectfully.` : 'No gender identity is selected yet.';
    if(pron) out += ` Pronouns: subject “${pron.subject || '—'}”, object “${pron.object || '—'}”, possessive determiner “${pron.possessiveDeterminer || '—'}”, possessive pronoun “${pron.possessivePronoun || '—'}”, reflexive “${pron.reflexive || '—'}”.`;
    if(titles.length) out += ` Cached titles/endearments: ${titles.join(', ')}.`;
    out += ' Gender identity and pronouns guide address, presentation language, and social respect; they do not determine morality, combat role, personality, or ability.';
    return out;
  };
  DropdownInstance.prototype.payload = function(){
    const bn=this.biomeNarrative(); const hn=this.heritageNarrative(); const pron=this.currentPronouns(); const mode=this.val('heritageMode') || 'single';
    return {schema:'belavados.characterDropdownSelection.v2.sitewideMerged', source:'sitewide-dropdown-builder', page:this.page, uiRules:{maxCachedBiomes:3,singleAndMixedAreMutuallyExclusive:true,sameRaceBloodlineMixing:true,allSelectedBloodlinesCanMix:true,parent2RaceFiltering:'uses halfRaceAllowedPartnerIdsByRace plus same-race fallback; lineage restrictions disabled by request'}, biomeCache:this.state.biomeCache.map(findBiome).filter(Boolean).map(b=>({id:b.id,name:b.name,group:b.group,tags:b.tags || []})), heritageMode:mode, singleHeritage:mode==='single' ? selectionObj(this.val('primaryCategory'),this.val('primaryRace'),this.val('primaryLineage')) : null, mixedHeritage:mode==='mixed' ? {parent1:selectionObj(this.val('p1Category'),this.val('p1Race'),this.val('p1Lineage')), parent2:selectionObj(this.val('p2Category'),this.val('p2Race'),this.val('p2Lineage'))} : null, identity:{genderIdentity:this.val('genderIdentity') || null, pronounSet:pron || null, titlesHonorificsEndearments:[...this.state.titleCache]}, generatedCharacterDescription:{shortConcept:`${hn.summary} ${bn.names.length ? 'Biome cache: '+bn.names.join(' + ')+'.' : 'No biome cache selected.'}`, appearance:`${bn.appearance} ${hn.appearance}`.replace(/\s+/g,' ').trim(), behavior:`${bn.behavior} ${hn.behavior}`.replace(/\s+/g,' ').trim(), genderPronounAddressing:this.identityNarrative()}};
  };
  DropdownInstance.prototype.writePreview = function(){ const out=this.output('selectionPreview'); if(out) out.value = JSON.stringify(this.payload(), null, 2); };
  DropdownInstance.prototype.refreshAll = function(){
    this.refreshBiomeGroups(); this.renderChips(); this.refreshMode(); if(this.val('heritageMode') === 'mixed') this.refreshMixed(); else this.refreshSingle(); this.refreshPronouns(); this.writePreview();
  };
  DropdownInstance.prototype.copyJson = async function(){ const text=JSON.stringify(this.payload(), null, 2); const status=this.output('status'); try{ await navigator.clipboard.writeText(text); if(status){ status.textContent='Selection JSON copied.'; status.className='small swddb-status-ok'; } }catch(e){ if(status){ status.textContent='Clipboard unavailable; use the preview box to copy manually.'; status.className='small swddb-status-warn'; } } };
  DropdownInstance.prototype.downloadJson = function(){ const payload=this.payload(); const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}); const a=doc.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`belavados_${safeFilePart(this.page)}_dropdown_selection.json`; doc.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();}, 0); };
  DropdownInstance.prototype.reset = function(){ this.state.biomeCache=[]; this.state.titleCache=[]; ['customSubject','customObject','customPossDet','customPossPronoun','customReflexive','customTitle'].forEach(n=>{const el=this.fields(n); if(el) el.value='';}); this.saveState(); this.refreshAll(); };
  DropdownInstance.prototype.currentSelectionForSync = function(){
    const p=this.payload(); const h=p.heritageMode === 'mixed' ? p.mixedHeritage : {parent1:p.singleHeritage, parent2:null};
    const primary = h && (h.parent1 || p.singleHeritage); const secondary = h && h.parent2;
    const biome = p.biomeCache[0] || null; const pron=p.identity.pronounSet || {};
    const pronSummary = [pron.subject, pron.object, pron.possessiveDeterminer || pron.possessivePronoun].filter(Boolean).join('/') || '';
    return {payload:p, primary, secondary, biome, pronSummary, gender:p.identity.genderIdentity || '', appearance:p.generatedCharacterDescription.appearance, behavior:p.generatedCharacterDescription.behavior, shortConcept:p.generatedCharacterDescription.shortConcept};
  };
  DropdownInstance.prototype.syncToPage = function(){
    const x=this.currentSelectionForSync(); const status=this.output('status');
    if(this.page === 'character'){
      setSelectByValueOrText('genderIdentity', x.gender); setInput('pronouns', x.pronSummary);
      if(x.primary){ setSelectByValueOrText('raceCategory', x.primary.categoryName); setSelectByValueOrText('raceSelect', x.primary.raceName); }
      if(x.secondary){ setSelectByValueOrText('race2Enabled', 'yes'); setSelectByValueOrText('race2Category', x.secondary.categoryName); setSelectByValueOrText('race2Select', x.secondary.raceName); }
      else setSelectByValueOrText('race2Enabled', 'no');
      if(x.biome){ setSelectByValueOrText('biomeCategory', x.biome.group || findBiomeGroup(x.biome.id)); setSelectByValueOrText('biomeSelect', x.biome.name); }
      if(status){ status.textContent='Applied dropdown selection to Page 1 generator fields.'; status.className='small swddb-status-ok'; }
      if(typeof window.renderAll === 'function') { try{ window.renderAll(); }catch(e){} }
    } else if(this.page === 'voice'){
      setSelectByValueOrText('voiceGender', x.gender); if(x.primary) setSelectByValueOrText('voiceRace', x.primary.raceName); if(x.biome) setSelectByValueOrText('voiceBiome', x.biome.name);
      const note = [x.shortConcept, x.payload.generatedCharacterDescription.genderPronounAddressing, 'Appearance: '+x.appearance, 'Behavior: '+x.behavior].filter(Boolean).join('\n\n');
      setInput('voiceNotes', note);
      if(status){ status.textContent='Applied dropdown selection to Page 3 voice source fields.'; status.className='small swddb-status-ok'; }
      if(typeof window.buildVoiceProfile === 'function') { try{ window.buildVoiceProfile('sitewide-dropdown-builder'); }catch(e){} }
    }
  };
  DropdownInstance.prototype.setPartHidden = function(part, hidden){
    part.classList.toggle('is-hidden', hidden);
    const btn = part.querySelector('[data-action="toggle-part"]'); if(btn) btn.textContent = hidden ? 'Show this part' : 'Hide this completed part';
    this.persistHiddenState();
  };
  DropdownInstance.prototype.persistHiddenState = function(){
    try{ const data={builder:this.root.classList.contains('is-hidden'), parts:{}}; this.root.querySelectorAll('.swddb-part').forEach(p=>data.parts[p.dataset.swddbPart]=p.classList.contains('is-hidden')); localStorage.setItem(this.hiddenKey, JSON.stringify(data)); }catch(e){}
  };
  DropdownInstance.prototype.applyHiddenState = function(){
    let data={parts:{}}; try{ data=JSON.parse(localStorage.getItem(this.hiddenKey)||'{}')||data; }catch(e){}
    this.root.classList.toggle('is-hidden', !!data.builder);
    const hb=this.root.querySelector('[data-action="toggle-builder"]'); if(hb) hb.textContent = data.builder ? 'Show dropdown builder' : 'Hide completed dropdown builder';
    this.root.querySelectorAll('.swddb-part').forEach(p=>this.setPartHidden(p, !!(data.parts && data.parts[p.dataset.swddbPart])));
  };
  DropdownInstance.prototype.bind = function(){
    this.root.addEventListener('change', e => {
      const f=e.target && e.target.dataset && e.target.dataset.field; if(!f) return;
      if(f === 'biomeGroup') this.refreshBiomeSelect();
      if(['primaryCategory','primaryRace','p1Category','p1Race','p2Category','p2Race','heritageMode','filterMixedByBiome','pronounSet'].includes(f)) this.refreshAll();
      else if(f) { this.refreshPronouns(); this.writePreview(); }
    });
    this.root.addEventListener('input', e => { const f=e.target && e.target.dataset && e.target.dataset.field; if(['customSubject','customObject','customPossDet','customPossPronoun','customReflexive'].includes(f)){ this.refreshPronouns(); this.writePreview(); } });
    this.root.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]'); if(!btn || !this.root.contains(btn)) return;
      const action=btn.dataset.action;
      if(action === 'toggle-builder'){ const hidden=!this.root.classList.contains('is-hidden'); this.root.classList.toggle('is-hidden', hidden); btn.textContent=hidden?'Show dropdown builder':'Hide completed dropdown builder'; this.persistHiddenState(); }
      if(action === 'toggle-part'){ const part=btn.closest('.swddb-part'); if(part) this.setPartHidden(part, !part.classList.contains('is-hidden')); }
      if(action === 'add-biome'){ const id=this.val('biome'); if(id && !this.state.biomeCache.includes(id) && this.state.biomeCache.length < 3){ this.state.biomeCache.push(id); this.saveState(); this.refreshAll(); } }
      if(action === 'clear-biomes'){ this.state.biomeCache=[]; this.saveState(); this.refreshAll(); }
      if(action === 'add-title'){ const t=this.val('titleSelect'); if(t && !this.state.titleCache.includes(t)){ this.state.titleCache.push(t); this.saveState(); this.refreshAll(); } }
      if(action === 'add-custom-title'){ const el=this.fields('customTitle'); const t=clean(el && el.value); if(t && !this.state.titleCache.includes(t)){ this.state.titleCache.push(t); if(el) el.value=''; this.saveState(); this.refreshAll(); } }
      if(action === 'clear-titles'){ this.state.titleCache=[]; this.saveState(); this.refreshAll(); }
      if(action === 'copy-json') this.copyJson();
      if(action === 'download-json') this.downloadJson();
      if(action === 'reset') this.reset();
      if(action === 'sync-page') this.syncToPage();
    });
  };

  function setupExistingPage2HideControls(){
    const panel = doc.getElementById('biomeHeritageBuilder');
    if(!panel || panel.dataset.swddbHideReady === 'true') return;
    panel.dataset.swddbHideReady = 'true';
    const key='belavados.bdd.page2.hideControls.v1';
    let state={panel:false, blocks:{}}; try{ state=Object.assign(state, JSON.parse(localStorage.getItem(key)||'{}')); }catch(e){}
    function save(){ try{ localStorage.setItem(key, JSON.stringify(state)); }catch(e){} }
    function setPanel(hidden){ panel.classList.toggle('bdd-is-hidden', hidden); state.panel=hidden; save(); panelBtn.textContent=hidden?'Show Page 2 dropdown builder':'Hide completed Page 2 dropdown builder'; }
    const row=doc.createElement('div'); row.className='swddb-panel-hide-row';
    const panelBtn=doc.createElement('button'); panelBtn.type='button'; panelBtn.textContent='Hide completed Page 2 dropdown builder'; row.appendChild(panelBtn);
    const heading=panel.querySelector('h3'); if(heading) heading.insertAdjacentElement('afterend', row); else panel.prepend(row);
    panelBtn.addEventListener('click',()=>setPanel(!panel.classList.contains('bdd-is-hidden')));
    panel.querySelectorAll('.bdd-block').forEach((block, idx)=>{
      const id=block.id || `block${idx}`; const brow=doc.createElement('div'); brow.className='swddb-block-hide-row';
      const btn=doc.createElement('button'); btn.type='button'; btn.textContent='Hide this completed part'; brow.appendChild(btn);
      const h=block.querySelector('h4'); if(h) h.insertAdjacentElement('afterend', brow); else block.prepend(brow);
      function setBlock(hidden){ block.classList.toggle('bdd-is-hidden', hidden); state.blocks[id]=hidden; save(); btn.textContent=hidden?'Show this part':'Hide this completed part'; }
      btn.addEventListener('click',()=>setBlock(!block.classList.contains('bdd-is-hidden')));
      setBlock(!!state.blocks[id]);
    });
    setPanel(!!state.panel);
  }
  function addNavOption(selectId, value, label, page){
    const sel=doc.getElementById(selectId); if(!sel || Array.from(sel.options).some(o=>o.value===value)) return;
    const opt=new Option(label, value); opt.dataset.page=page; opt.dataset.swddbAdded='true'; sel.appendChild(opt);
  }
  function addSubnavLink(pageSelector, href, label){
    const nav=doc.querySelector(pageSelector+' .studio-subnav'); if(!nav || nav.querySelector(`a[href="${href}"]`)) return;
    const a=doc.createElement('a'); a.href=href; a.textContent=label;
    const firstA=nav.querySelector('a'); if(firstA) firstA.insertAdjacentElement('afterend', a); else nav.appendChild(a);
  }
  function setupNavigation(){
    addNavOption('floatingNavSelectCharacter','#swddbCharacter-builder','Dropdown Builder','character');
    addNavOption('floatingNavSelectVoice','#swddbVoice-builder','Dropdown Builder','voice');
    addNavOption('floatingNavSelectForge','#biomeHeritageBuilder','Dropdown Builder','forge');
    addSubnavLink('#page-character','#swddbCharacter-builder','Dropdown Builder');
    addSubnavLink('#page-voice','#swddbVoice-builder','Dropdown Builder');
    addSubnavLink('#page-forge','#biomeHeritageBuilder','Dropdown Builder');
  }
  function init(){
    setupNavigation(); setupExistingPage2HideControls();
    doc.querySelectorAll('.swddb-builder').forEach(root => { if(root.__swddb) return; root.__swddb = new DropdownInstance(root); });
    window.BelavadosSitewideDropdowns = {instances:Array.from(doc.querySelectorAll('.swddb-builder')).map(r=>r.__swddb).filter(Boolean), sourceData:SOURCE_DATA, biomes:BIOMES, pronouns:PRONOUN_SETS, titles:TITLE_OPTIONS};
  }
  if(doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
