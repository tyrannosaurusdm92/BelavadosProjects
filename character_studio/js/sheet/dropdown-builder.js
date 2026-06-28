
(function(){
  const SOURCE_DATA = JSON.parse(document.getElementById('bddSourceData').textContent);
  const BIOMES = JSON.parse(document.getElementById('bddBiomeData').textContent);
  const PRONOUN_SETS = JSON.parse(document.getElementById('bddPronounData').textContent);
  const TITLE_OPTIONS = JSON.parse(document.getElementById('bddTitleData').textContent);
  const state = { biomeCache: [], titleCache: [], syncing:false };
  const $ = id => document.getElementById(id);
  const qsa = (sel,root=document) => Array.from(root.querySelectorAll(sel));
  const clean = s => String(s || '').trim();
  const lower = s => clean(s).toLowerCase();
  const categories = SOURCE_DATA.categories || [];
  const raceMap = new Map();
  const categoryMap = new Map();
  categories.forEach(c => { categoryMap.set(c.id, c); (c.races || []).forEach(r => raceMap.set(r.id, {...r, categoryId:c.id, categoryName:c.name})); });

  function field(key){ return document.querySelector('[data-key="'+CSS.escape(key)+'"]'); }
  function val(id){ return $(id)?.value || ''; }
  function setKey(key,value, fire=false){
    const el = field(key);
    if(!el) return;
    const next = value == null ? '' : String(value);
    if(el.type === 'checkbox') el.checked = !!value;
    else el.value = next;
    if(fire){
      el.dispatchEvent(new Event('input',{bubbles:true}));
      el.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }
  function option(label, value, extra={}) {
    const o = document.createElement('option');
    o.textContent = label;
    o.value = value;
    Object.entries(extra).forEach(([k,v]) => o.dataset[k] = v);
    return o;
  }
  function setOptions(sel, opts, placeholder='Select…') {
    if(!sel) return;
    const old = sel.value;
    sel.innerHTML = '';
    sel.appendChild(option(placeholder, ''));
    (opts||[]).forEach(o => sel.appendChild(option(o.label, o.value, o.extra || {})));
    if ([...sel.options].some(o => o.value === old)) sel.value = old;
  }
  function allBiomes(){ return Object.values(BIOMES).flat(); }
  function selectedBiomeObjects() {
    return state.biomeCache.map(id => allBiomes().find(b => b.id === id)).filter(Boolean);
  }
  function selectedBiomeTags() {
    const tags = new Set();
    selectedBiomeObjects().forEach(b => (b.tags || []).forEach(t => tags.add(t)));
    return tags;
  }
  function textTags(text) {
    const t = lower(text);
    const tags = new Set();
    const add = arr => arr.forEach(x => tags.add(x));
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
  function raceTagSet(race, lineage=null) {
    const joined = [race.categoryName, race.category, race.name, race.description, lineage?.name, lineage?.description, lineage?.selectableLabel].filter(Boolean).join(' ');
    return textTags(joined);
  }
  function compatibleWithBiome(race, lineage=null) {
    if (!state.biomeCache.length) return true;
    const btags = selectedBiomeTags();
    const rtags = raceTagSet(race, lineage);
    if (rtags.has('any')) return true;
    for (const t of rtags) if (btags.has(t)) return true;
    return false;
  }
  function visibleRacesForCategory(catId, opts={biome:true, allowedIds:null}) {
    const cat = categoryMap.get(catId); if (!cat) return [];
    return (cat.races || []).filter(r => {
      const rr = raceMap.get(r.id) || {...r, categoryId:catId, categoryName:cat.name};
      if (opts.allowedIds && !opts.allowedIds.has(rr.id)) return false;
      if (!opts.biome) return true;
      if (compatibleWithBiome(rr)) return true;
      return (rr.lineages || []).some(l => compatibleWithBiome(rr, l));
    });
  }
  function categoriesWithVisibleRaces(opts={biome:true, allowedIds:null}) {
    return categories.filter(c => visibleRacesForCategory(c.id, opts).length > 0);
  }
  function populateCategorySelect(sel, opts={biome:true, allowedIds:null}) {
    setOptions(sel, categoriesWithVisibleRaces(opts).map(c => ({label:c.name, value:c.id})), 'Select racial category…');
  }
  function populateRaceSelect(catSel, raceSel, opts={biome:true, allowedIds:null}) {
    const list = visibleRacesForCategory(catSel?.value, opts).map(r => ({label:r.name, value:r.id}));
    setOptions(raceSel, list, 'Select race…');
  }
  function lineageLabel(lineage, race) { return lineage.selectableLabel || `${race.name} — ${lineage.name}`; }
  function populateLineageSelect(raceSel, lineageSel) {
    const race = raceMap.get(raceSel?.value);
    if (!race || !(race.lineages || []).length) {
      setOptions(lineageSel, [], 'No bloodline dropdown for this race');
      if(lineageSel) lineageSel.disabled = true;
      return;
    }
    lineageSel.disabled = false;
    setOptions(lineageSel, race.lineages.map(l => ({label:lineageLabel(l, race), value:l.id})), 'Select bloodline / lineage…');
  }
  function selectedLineage(raceId, lineageId) {
    const race = raceMap.get(raceId); if (!race) return null;
    return (race.lineages || []).find(l => l.id === lineageId) || null;
  }
  function selectionObj(catId, raceId, lineageId) {
    const cat = categoryMap.get(catId); const race = raceMap.get(raceId); const lin = selectedLineage(raceId, lineageId);
    if (!cat || !race) return null;
    return { categoryId:cat.id, categoryName:cat.name, raceId:race.id, raceName:race.name, raceDescription:race.description || '', bloodlineId:lin?.id || null, bloodlineName:lin?.name || null, bloodlineLabel:lin ? lineageLabel(lin, race) : null, bloodlineDescription:lin?.description || null };
  }
  function firstSentences(txt, count=2) {
    txt = clean(txt).replace(/\s+/g,' '); if (!txt) return '';
    const parts = txt.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [txt];
    return parts.slice(0,count).join(' ').trim();
  }
  function describeSelection(sel) {
    if (!sel) return '';
    const pieces = [`<strong>${sel.raceName}</strong> — ${firstSentences(sel.raceDescription,2)}`];
    if (sel.bloodlineName) pieces.push(`<br><br><strong>${sel.bloodlineName}</strong> — ${firstSentences(sel.bloodlineDescription,2)}`);
    return pieces.join('');
  }
  function allowedPartnerIdsForParent(raceId) {
    const set = new Set(SOURCE_DATA.halfRaceAllowedPartnerIdsByRace?.[raceId] || []);
    if (raceId) set.add(raceId);
    const race = raceMap.get(raceId);
    if (race && !set.size) (categoryMap.get(race.categoryId)?.races || []).forEach(r => set.add(r.id));
    return set;
  }
  function refreshBiomeSelect() {
    const groups = Object.keys(BIOMES);
    setOptions($('bdd_biomeGroupSelect'), groups.map(g => ({label:g, value:g})), 'Select biome group…');
    const group = val('bdd_biomeGroupSelect') || groups[0] || '';
    if(group && !val('bdd_biomeGroupSelect')) $('bdd_biomeGroupSelect').value = group;
    setOptions($('bdd_biomeSelect'), (BIOMES[group] || []).map(b => ({label:b.name, value:b.id})), 'Select biome…');
  }
  function renderBiomeChips() {
    const box = $('bdd_biomeChips'); if(!box) return;
    box.innerHTML = '';
    state.biomeCache.forEach(id => {
      const b = allBiomes().find(x => x.id === id); if (!b) return;
      const chip = document.createElement('span'); chip.className='bdd-chip';
      const label = document.createElement('span'); label.textContent = b.name; chip.appendChild(label);
      const btn=document.createElement('button'); btn.type='button'; btn.textContent='×'; btn.title='Remove';
      btn.addEventListener('click',()=>{state.biomeCache=state.biomeCache.filter(x=>x!==id); refreshAll();});
      chip.appendChild(btn); box.appendChild(chip);
    });
    setKey('lineage.biomeCacheJson', JSON.stringify(state.biomeCache));
    const first = selectedBiomeObjects()[0];
    setKey('lineage.biomeCategory', first ? findBiomeGroup(first.id) : '');
    setKey('lineage.originBiome', first ? first.name : '');
  }
  function findBiomeGroup(id){
    for(const [group,items] of Object.entries(BIOMES)) if((items||[]).some(b=>b.id===id)) return group;
    return '';
  }
  function populateIdentity() {
    setOptions($('bdd_genderIdentity'), (SOURCE_DATA.genderIdentityDropdown || []).map(g => ({label:g,value:g})), 'Select gender identity…');
    const sel = $('bdd_pronounSet'); if(!sel) return;
    const old = sel.value;
    sel.innerHTML=''; sel.appendChild(option('Select pronoun set…',''));
    const grouped = new Map(); PRONOUN_SETS.forEach(p => { if(!grouped.has(p.group)) grouped.set(p.group, []); grouped.get(p.group).push(p); });
    grouped.forEach((items, group) => {
      const og = document.createElement('optgroup'); og.label = group;
      items.forEach(p => og.appendChild(option(p.name, p.name, {group:p.group})));
      sel.appendChild(og);
    });
    if([...sel.options].some(o=>o.value===old)) sel.value=old;
    else if(!old && [...sel.options].some(o=>o.value==='They / Them')) sel.value='They / Them';
    setOptions($('bdd_titleSelect'), TITLE_OPTIONS.map(t => ({label:t,value:t})), 'Select title / honorific / endearment…');
  }
  function pronounByName(name) { return PRONOUN_SETS.find(p => p.name === name) || null; }
  function currentPronouns() {
    const p = pronounByName(val('bdd_pronounSet'));
    if (!p) return null;
    if (p.name === 'Add your own') return {group:'Custom', name:'Custom', subject:clean(val('bdd_customSubject')), object:clean(val('bdd_customObject')), possessiveDeterminer:clean(val('bdd_customPossDet')), possessivePronoun:clean(val('bdd_customPossPronoun')), reflexive:clean(val('bdd_customReflexive')), example:'Custom pronouns supplied by user.'};
    return p;
  }
  function formatPronounString(p){
    if(!p) return '';
    return [p.subject,p.object,p.possessiveDeterminer,p.possessivePronoun,p.reflexive].filter(Boolean).join(' / ');
  }
  function refreshPronounBox() {
    const p = pronounByName(val('bdd_pronounSet'));
    $('bdd_customPronounBox')?.classList.toggle('hidden', !p || p.name !== 'Add your own');
    const cur = currentPronouns();
    const box = $('bdd_pronounDescription');
    if(box) box.innerHTML = cur ? `<strong>${cur.name}</strong>: subject <em>${cur.subject || '—'}</em>, object <em>${cur.object || '—'}</em>, possessive determiner <em>${cur.possessiveDeterminer || '—'}</em>, possessive pronoun <em>${cur.possessivePronoun || '—'}</em>, reflexive <em>${cur.reflexive || '—'}</em>. ${cur.example || ''}` : 'Choose a pronoun set or add a custom set.';
    setKey('pronouns.subject', cur?.subject || '');
    setKey('pronouns.object', cur?.object || '');
    setKey('pronouns.possessiveDeterminer', cur?.possessiveDeterminer || '');
    setKey('pronouns.possessivePronoun', cur?.possessivePronoun || '');
    setKey('pronouns.reflexive', cur?.reflexive || '');
    if(cur) setKey('characterPronouns', formatPronounString(cur), true);
  }
  function renderTitleChips() {
    const box = $('bdd_titleChips'); if(!box) return;
    box.innerHTML='';
    state.titleCache.forEach(t => {
      const chip=document.createElement('span'); chip.className='bdd-chip';
      const label=document.createElement('span'); label.textContent=t; chip.appendChild(label);
      const btn=document.createElement('button'); btn.type='button'; btn.textContent='×';
      btn.addEventListener('click',()=>{state.titleCache=state.titleCache.filter(x=>x!==t); refreshAll();});
      chip.appendChild(btn); box.appendChild(chip);
    });
    setKey('honorifics.cachedTitlesJson', JSON.stringify(state.titleCache));
  }
  function refreshMode() {
    const single = val('bdd_heritageMode') !== 'mixed';
    $('bdd_singlePanel')?.classList.toggle('hidden', !single);
    $('bdd_mixedPanel')?.classList.toggle('hidden', single);
    qsa('#bdd_singlePanel select,#bdd_singlePanel input,#bdd_singlePanel textarea').forEach(el => el.disabled = !single);
    qsa('#bdd_mixedPanel select,#bdd_mixedPanel input,#bdd_mixedPanel textarea').forEach(el => el.disabled = single);
  }
  function refreshSingle() {
    populateCategorySelect($('bdd_primaryCategory'), {biome:true});
    populateRaceSelect($('bdd_primaryCategory'), $('bdd_primaryRace'), {biome:true});
    populateLineageSelect($('bdd_primaryRace'), $('bdd_primaryLineage'));
    const desc=$('bdd_primaryDescription'); if(desc) desc.innerHTML = describeSelection(selectionObj(val('bdd_primaryCategory'), val('bdd_primaryRace'), val('bdd_primaryLineage')));
  }
  function refreshMixedParent1() {
    const applyBiome = val('bdd_filterMixedByBiome') !== 'no';
    populateCategorySelect($('bdd_p1Category'), {biome:applyBiome});
    populateRaceSelect($('bdd_p1Category'), $('bdd_p1Race'), {biome:applyBiome});
    populateLineageSelect($('bdd_p1Race'), $('bdd_p1Lineage'));
    const d1=$('bdd_p1Description'); if(d1) d1.innerHTML = describeSelection(selectionObj(val('bdd_p1Category'), val('bdd_p1Race'), val('bdd_p1Lineage')));
    refreshMixedParent2();
  }
  function refreshMixedParent2() {
    const applyBiome = val('bdd_filterMixedByBiome') !== 'no';
    const allowedIds = allowedPartnerIdsForParent(val('bdd_p1Race'));
    populateCategorySelect($('bdd_p2Category'), {biome:applyBiome, allowedIds});
    populateRaceSelect($('bdd_p2Category'), $('bdd_p2Race'), {biome:applyBiome, allowedIds});
    populateLineageSelect($('bdd_p2Race'), $('bdd_p2Lineage'));
    const d2=$('bdd_p2Description'); if(d2) d2.innerHTML = describeSelection(selectionObj(val('bdd_p2Category'), val('bdd_p2Race'), val('bdd_p2Lineage')));
    const count = categoriesWithVisibleRaces({biome:applyBiome, allowedIds}).reduce((n,c)=>n+visibleRacesForCategory(c.id,{biome:applyBiome, allowedIds}).length,0);
    const status=$('bdd_mixedRuleStatus'); if(status) status.textContent = val('bdd_p1Race') ? `${count} compatible Parent 2 race options are available for the selected Parent 1.` : 'Choose Parent 1 to filter Parent 2.';
  }
  function biomeNarrative() {
    const bs = selectedBiomeObjects();
    if (!bs.length) return {names:[], appearance:'No biome cache is selected, so appearance can be drawn from the full heritage description.', behavior:'No biome cache is selected, so behavior is not limited by settlement terrain.'};
    return {
      names: bs.map(b=>b.name),
      appearance: bs.map(b=>`${b.name} contributes ${b.appearance}`).join(' '),
      behavior: bs.map(b=>`${b.name} encourages someone who is ${b.behavior}`).join(' ')
    };
  }
  function heritageNarrative() {
    const mode = val('bdd_heritageMode') || 'single';
    if (mode === 'single') {
      const sel = selectionObj(val('bdd_primaryCategory'),val('bdd_primaryRace'),val('bdd_primaryLineage'));
      if (!sel) return {mode, summary:'No single heritage selected.', appearance:'', behavior:'', primary:null, secondary:null};
      return {
        mode, primary:sel, secondary:null,
        summary: sel.bloodlineName ? `${sel.raceName} with the ${sel.bloodlineName} bloodline.` : `${sel.raceName} single heritage.`,
        appearance: `The visible body plan should start from ${sel.raceName}. ${firstSentences(sel.raceDescription,3)} ${sel.bloodlineDescription ? 'Bloodline expression: '+firstSentences(sel.bloodlineDescription,3) : ''}`,
        behavior: `Behavioral cues should come from heritage culture and environment: ${firstSentences(sel.bloodlineDescription || sel.raceDescription,3)}`
      };
    }
    const p1 = selectionObj(val('bdd_p1Category'),val('bdd_p1Race'),val('bdd_p1Lineage'));
    const p2 = selectionObj(val('bdd_p2Category'),val('bdd_p2Race'),val('bdd_p2Lineage'));
    if (!p1 || !p2) return {mode, summary:'Mixed parentage incomplete.', appearance:'', behavior:'', primary:p1, secondary:p2};
    const sameRace = p1.raceId === p2.raceId;
    return {
      mode, primary:p1, secondary:p2,
      summary: `${p1.bloodlineName || p1.raceName} + ${p2.bloodlineName || p2.raceName} mixed parentage${sameRace ? ' within the same race' : ''}.`,
      appearance: `The character should visibly blend Parent 1 (${p1.raceName}${p1.bloodlineName ? ' — '+p1.bloodlineName : ''}) and Parent 2 (${p2.raceName}${p2.bloodlineName ? ' — '+p2.bloodlineName : ''}). Parent 1 contributes: ${firstSentences(p1.bloodlineDescription || p1.raceDescription,2)} Parent 2 contributes: ${firstSentences(p2.bloodlineDescription || p2.raceDescription,2)} Because all racial bloodlines can mix, both bloodlines should appear as a balanced hybrid rather than one replacing the other.`,
      behavior: `Roleplay should blend inherited instincts and culture from both parents. Parent 1 influence: ${firstSentences(p1.bloodlineDescription || p1.raceDescription,2)} Parent 2 influence: ${firstSentences(p2.bloodlineDescription || p2.raceDescription,2)} The result can lean toward either parent by story choice, but the dropdown rules do not force one side to dominate.`
    };
  }
  function identityNarrative() {
    const gender = val('bdd_genderIdentity') || null;
    const pron = currentPronouns();
    const titles = [...state.titleCache];
    let address = gender ? `This character is ${gender}, so use that identity label respectfully.` : 'No gender identity is selected yet.';
    if (pron) address += ` Pronouns: subject “${pron.subject || '—'}”, object “${pron.object || '—'}”, possessive determiner “${pron.possessiveDeterminer || '—'}”, possessive pronoun “${pron.possessivePronoun || '—'}”, reflexive “${pron.reflexive || '—'}”.`;
    if (titles.length) address += ` Cached titles/endearments: ${titles.join(', ')}.`;
    address += ' Gender identity and pronouns guide address, presentation language, and social respect; they do not determine morality, combat role, personality, or ability.';
    return address;
  }
  function currentPayload() {
    const bn = biomeNarrative();
    const hn = heritageNarrative();
    const pron = currentPronouns();
    const mode = val('bdd_heritageMode') || 'single';
    return {
      schema:'belavados.characterDropdownSelection.v2.biomeHeritageGenderPronouns',
      uiRules:{maxCachedBiomes:3,singleAndMixedAreMutuallyExclusive:true,sameRaceBloodlineMixing:true,allSelectedBloodlinesCanMix:true,parent2RaceFiltering:'uses halfRaceAllowedPartnerIdsByRace plus same-race fallback; lineage restrictions disabled by request'},
      biomeCache:selectedBiomeObjects().map(b=>({id:b.id,name:b.name,tags:b.tags})),
      heritageMode:mode,
      singleHeritage: mode==='single' ? selectionObj(val('bdd_primaryCategory'),val('bdd_primaryRace'),val('bdd_primaryLineage')) : null,
      mixedHeritage: mode==='mixed' ? {parent1:selectionObj(val('bdd_p1Category'),val('bdd_p1Race'),val('bdd_p1Lineage')), parent2:selectionObj(val('bdd_p2Category'),val('bdd_p2Race'),val('bdd_p2Lineage'))} : null,
      identity:{genderIdentity:val('bdd_genderIdentity') || null, pronounSet: pron ? {group:pron.group,name:pron.name,subject:pron.subject,object:pron.object,possessiveDeterminer:pron.possessiveDeterminer,possessivePronoun:pron.possessivePronoun,reflexive:pron.reflexive,example:pron.example} : null, titlesHonorificsEndearments:[...state.titleCache]},
      generatedCharacterDescription:{
        shortConcept:`${hn.summary} ${bn.names.length ? 'Biome cache: '+bn.names.join(' + ')+'.' : 'No biome cache selected.'}`,
        appearance:`${bn.appearance} ${hn.appearance}`.replace(/\s+/g,' ').trim(),
        behavior:`${bn.behavior} ${hn.behavior}`.replace(/\s+/g,' ').trim(),
        genderPronounAddressing:identityNarrative()
      }
    };
  }
  function writeMirrorFields(){
    const payload = currentPayload();
    const hn = heritageNarrative();
    const bn = biomeNarrative();
    const p = hn.primary, s = hn.secondary;
    setKey('lineage.dropdownSelectionJson', JSON.stringify(payload, null, 2));
    setKey('lineage.generatedAppearanceDescription', payload.generatedCharacterDescription.appearance);
    setKey('lineage.generatedBehaviorDescription', `${payload.generatedCharacterDescription.behavior}\n\n${payload.generatedCharacterDescription.genderPronounAddressing}`);
    setKey('lineage.raceCategory', p?.categoryName || '');
    setKey('lineage.raceCategoryId', p?.categoryId || '');
    setKey('lineage.race1', p?.raceName || '');
    setKey('lineage.race1Id', p?.raceId || '');
    setKey('lineage.race1Lineage', p?.bloodlineName || '');
    setKey('lineage.race1LineageId', p?.bloodlineId || '');
    setKey('lineage.race2Enabled', val('bdd_heritageMode') === 'mixed' ? 'Yes' : 'No');
    setKey('lineage.race2Category', s?.categoryName || '');
    setKey('lineage.race2CategoryId', s?.categoryId || '');
    setKey('lineage.race2', s?.raceName || '');
    setKey('lineage.race2Id', s?.raceId || '');
    setKey('lineage.race2Lineage', s?.bloodlineName || '');
    setKey('lineage.race2LineageId', s?.bloodlineId || '');
    const raceSummary = payload.generatedCharacterDescription.shortConcept.replace(/\s*No biome cache selected\.\s*$/,'').trim();
    if(p) setKey('race', raceSummary, true);
    const firstBiome = selectedBiomeObjects()[0];
    setKey('lineage.biomeCategory', firstBiome ? findBiomeGroup(firstBiome.id) : '');
    setKey('lineage.originBiome', bn.names.join(' + '));
  }
  function hydrateStateFromFields(){
    try{ const raw = field('lineage.biomeCacheJson')?.value; state.biomeCache = raw ? JSON.parse(raw) : state.biomeCache; }catch(e){}
    try{ const raw = field('honorifics.cachedTitlesJson')?.value; state.titleCache = raw ? JSON.parse(raw) : state.titleCache; }catch(e){}
    state.biomeCache = Array.isArray(state.biomeCache) ? state.biomeCache.filter(Boolean).slice(0,3) : [];
    state.titleCache = Array.isArray(state.titleCache) ? state.titleCache.filter(Boolean) : [];
    // Backfill builder IDs from older/simple imported JSON names if available.
    const mode = field('lineage.heritageMode')?.value || (field('lineage.race2Enabled')?.value === 'Yes' ? 'mixed' : 'single');
    if($('bdd_heritageMode')) $('bdd_heritageMode').value = mode === 'mixed' ? 'mixed' : 'single';
  }
  function refreshAll(opts={}){
    if(state.syncing) return;
    state.syncing = true;
    hydrateStateFromFields();
    refreshBiomeSelect();
    renderBiomeChips();
    populateIdentity();
    refreshMode();
    if (val('bdd_heritageMode') === 'mixed') refreshMixedParent1();
    else refreshSingle();
    refreshPronounBox();
    renderTitleChips();
    writeMirrorFields();
    state.syncing = false;
  }
  function initEvents(){
    $('bdd_biomeGroupSelect')?.addEventListener('change',()=>{refreshBiomeSelect();});
    $('bdd_addBiomeBtn')?.addEventListener('click',()=>{ const id=val('bdd_biomeSelect'); if(id && !state.biomeCache.includes(id) && state.biomeCache.length<3) state.biomeCache.push(id); refreshAll();});
    $('bdd_clearBiomeBtn')?.addEventListener('click',()=>{state.biomeCache=[]; refreshAll();});
    $('bdd_heritageMode')?.addEventListener('change',()=>{ refreshAll(); });
    $('bdd_filterMixedByBiome')?.addEventListener('change',()=>refreshAll());
    ['bdd_primaryCategory','bdd_primaryRace','bdd_primaryLineage'].forEach(id=>$(id)?.addEventListener('change',()=>{ if(id==='bdd_primaryCategory') populateRaceSelect($('bdd_primaryCategory'),$('bdd_primaryRace'),{biome:true}); if(id!=='bdd_primaryLineage') populateLineageSelect($('bdd_primaryRace'),$('bdd_primaryLineage')); $('bdd_primaryDescription').innerHTML=describeSelection(selectionObj(val('bdd_primaryCategory'),val('bdd_primaryRace'),val('bdd_primaryLineage'))); writeMirrorFields();}));
    ['bdd_p1Category','bdd_p1Race','bdd_p1Lineage'].forEach(id=>$(id)?.addEventListener('change',()=>{ const apply=val('bdd_filterMixedByBiome')!=='no'; if(id==='bdd_p1Category') populateRaceSelect($('bdd_p1Category'),$('bdd_p1Race'),{biome:apply}); if(id!=='bdd_p1Lineage') populateLineageSelect($('bdd_p1Race'),$('bdd_p1Lineage')); $('bdd_p1Description').innerHTML=describeSelection(selectionObj(val('bdd_p1Category'),val('bdd_p1Race'),val('bdd_p1Lineage'))); refreshMixedParent2(); writeMirrorFields();}));
    ['bdd_p2Category','bdd_p2Race','bdd_p2Lineage'].forEach(id=>$(id)?.addEventListener('change',()=>{ const apply=val('bdd_filterMixedByBiome')!=='no'; const allowedIds=allowedPartnerIdsForParent(val('bdd_p1Race')); if(id==='bdd_p2Category') populateRaceSelect($('bdd_p2Category'),$('bdd_p2Race'),{biome:apply,allowedIds}); if(id!=='bdd_p2Lineage') populateLineageSelect($('bdd_p2Race'),$('bdd_p2Lineage')); $('bdd_p2Description').innerHTML=describeSelection(selectionObj(val('bdd_p2Category'),val('bdd_p2Race'),val('bdd_p2Lineage'))); writeMirrorFields();}));
    ['bdd_genderIdentity','bdd_pronounSet','bdd_customSubject','bdd_customObject','bdd_customPossDet','bdd_customPossPronoun','bdd_customReflexive'].forEach(id=>$(id)?.addEventListener('input',()=>{refreshPronounBox(); writeMirrorFields();}));
    $('bdd_pronounSet')?.addEventListener('change',()=>{refreshPronounBox(); writeMirrorFields();});
    $('bdd_addTitleBtn')?.addEventListener('click',()=>{const t=val('bdd_titleSelect'); if(t && !state.titleCache.includes(t)) state.titleCache.push(t); refreshAll();});
    $('bdd_addCustomTitleBtn')?.addEventListener('click',()=>{const t=clean(val('bdd_customTitle')); if(t && !state.titleCache.includes(t)) {state.titleCache.push(t); $('bdd_customTitle').value='';} refreshAll();});
    $('bdd_clearTitlesBtn')?.addEventListener('click',()=>{state.titleCache=[]; refreshAll();});
    $('bdd_applyAppearanceBtn')?.addEventListener('click',()=>{ const generated = field('lineage.generatedAppearanceDescription')?.value || ''; if(generated) setKey('appearance', generated, true); });
  }
  function init(){
    if(!$('biomeHeritageBuilder')) return;
    populateIdentity();
    refreshBiomeSelect();
    initEvents();
    refreshAll();
  }
  window.refreshBelavadosDropdownBuilder = refreshAll;
  window.BelavadosDropdownBuilder = { refresh:refreshAll, currentPayload, sourceData:SOURCE_DATA };
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
