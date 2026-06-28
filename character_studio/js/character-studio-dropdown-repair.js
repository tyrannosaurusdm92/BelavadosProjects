/* Belavadös Character Studio dropdown repair/runtime guard
   Purpose: keep all visible Character Studio dropdowns populated and cascading after merges,
   late Voice Studio resource injection, and browser/PWA reloads. No voice assets are bundled here. */
(function(){
  'use strict';
  if(window.__BELAVADOS_CHARACTER_STUDIO_DROPDOWN_REPAIR__) return;
  window.__BELAVADOS_CHARACTER_STUDIO_DROPDOWN_REPAIR__ = true;

  var doc = document;
  var $ = function(id){ return doc.getElementById(id); };
  var norm = function(v){ return String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); };
  var clean = function(v){ return String(v == null ? '' : v).trim(); };
  var uniq = function(arr){ return Array.from(new Set((arr || []).filter(Boolean))); };

  function parseScriptJson(id, fallback){
    fallback = fallback === undefined ? null : fallback;
    try{
      var el = $(id);
      if(el && clean(el.textContent)) return JSON.parse(el.textContent);
    }catch(err){}
    try{
      var bundle = window.BELAVADOS_EXTERNAL_JSON || {};
      if(Object.prototype.hasOwnProperty.call(bundle, id)) return JSON.parse(bundle[id]);
    }catch(err2){}
    return fallback;
  }

  function addOption(select, label, value, meta){
    if(!select) return null;
    var option = doc.createElement('option');
    option.textContent = clean(label);
    option.value = clean(value == null ? label : value);
    if(meta && typeof meta === 'object') Object.keys(meta).forEach(function(k){ option.dataset[k] = clean(meta[k]); });
    select.appendChild(option);
    return option;
  }

  function setOptions(selectOrId, items, opts){
    var select = typeof selectOrId === 'string' ? $(selectOrId) : selectOrId;
    if(!select) return;
    opts = opts || {};
    var old = select.value;
    var oldText = select.selectedOptions && select.selectedOptions[0] ? select.selectedOptions[0].textContent : '';
    select.innerHTML = '';
    if(opts.placeholder) addOption(select, opts.placeholder, '');
    (items || []).forEach(function(item){
      if(item == null) return;
      if(typeof item === 'string' || typeof item === 'number') addOption(select, item, item);
      else addOption(select, opts.label ? opts.label(item) : (item.label || item.name || item.id || item.value || ''), opts.value ? opts.value(item) : (item.value != null ? item.value : (item.name || item.id || item.label || '')), item.meta || null);
    });
    var options = Array.from(select.options);
    var byOldValue = options.find(function(o){ return o.value === old; });
    var byOldText = oldText ? options.find(function(o){ return clean(o.textContent) === clean(oldText); }) : null;
    var byNormValue = old ? options.find(function(o){ return norm(o.value) === norm(old); }) : null;
    if(byOldValue) select.value = byOldValue.value;
    else if(byOldText) select.value = byOldText.value;
    else if(byNormValue) select.value = byNormValue.value;
    else if(opts.selectFirst && select.options.length > (opts.placeholder ? 1 : 0)) select.selectedIndex = opts.placeholder ? 1 : 0;
    select.dataset.belavadosDropdownRepaired = 'true';
  }

  function trigger(selectOrId){
    var el = typeof selectOrId === 'string' ? $(selectOrId) : selectOrId;
    if(!el) return;
    try{ el.dispatchEvent(new Event('input', {bubbles:true})); }catch(err){}
    try{ el.dispatchEvent(new Event('change', {bubbles:true})); }catch(err2){}
  }

  var APP = parseScriptJson('app-data', {}) || {};
  var SOURCE = parseScriptJson('site-dropdown-source-data', null) || APP.raceTaxonomy || {};
  var BIOMES = parseScriptJson('site-dropdown-biome-data', null) || (APP.raceCacheSource && APP.raceCacheSource.biomeMenu) || {};
  var PRONOUNS = parseScriptJson('site-pronoun-data', null) || (APP.raceCacheSource && APP.raceCacheSource.pronounData) || [];
  var TITLES = parseScriptJson('site-title-data', null) || (APP.raceCacheSource && APP.raceCacheSource.titleData) || [];
  var VOICE_RACE = parseScriptJson('voice-race-data', {}) || {};
  var VOICE_CLASS = parseScriptJson('voice-class-data', {}) || {};
  var VOICE_GENDER = parseScriptJson('voice-gender-data', {}) || {};
  var VOICE_BIOME = parseScriptJson('voice-biome-data', {}) || {};

  var appRaces = Array.isArray(APP.races) ? APP.races : [];
  var sourceCategories = Array.isArray(SOURCE.categories) ? SOURCE.categories : [];
  var appCategories = Array.isArray(APP.categories) ? APP.categories : [];
  var appCategoryNames = uniq(appCategories.map(function(c){ return c.category || c.name; }).concat(appRaces.map(function(r){ return r.category; })));
  var sourceCategoryById = new Map();
  var sourceRaceById = new Map();
  sourceCategories.forEach(function(cat){
    sourceCategoryById.set(cat.id || cat.categoryId || cat.name, cat);
    (cat.races || []).forEach(function(r){ sourceRaceById.set(r.id || r.name, Object.assign({}, r, {categoryId:cat.id || cat.categoryId, categoryName:cat.name || cat.category || cat.id})); });
  });
  var appRaceByName = new Map(appRaces.map(function(r){ return [norm(r.name), r]; }));
  var appRaceById = new Map(appRaces.map(function(r){ return [r.id || norm(r.name), r]; }));

  function classNames(){ return Object.keys((APP.core && APP.core.classes) || {}); }
  function subclassesFor(className){
    var core = (APP.core && APP.core.classes && APP.core.classes[className]) || null;
    var coreSubs = Array.isArray(core && core.subclasses) ? core.subclasses : [];
    var alignClass = ((APP.alignment && APP.alignment.classes) || []).find(function(c){ return norm(c.value || c.label || c.name) === norm(className); });
    var alignSubs = ((alignClass && alignClass.subclasses) || []).map(function(s){ return s.label || s.value || s.name; });
    return uniq(coreSubs.concat(alignSubs));
  }
  function voiceSubclassesFor(className){
    var cls = ((VOICE_CLASS && VOICE_CLASS.classes) || []).find(function(c){ return norm(c.name || c.id) === norm(className); });
    var voiceSubs = ((cls && cls.subclasses) || []).map(function(s){ return s.name || s.label || s.id; });
    return uniq(voiceSubs.concat(subclassesFor(className)));
  }
  function racesForCategoryName(categoryName){
    if(!categoryName) return appRaces;
    return appRaces.filter(function(r){ return norm(r.category) === norm(categoryName); });
  }
  function appRaceFromSelectValue(value){
    return appRaceByName.get(norm(value)) || appRaceById.get(value) || appRaces.find(function(r){ return norm(r.name) === norm(value) || norm(r.id) === norm(value); }) || null;
  }
  function sourceRaceFromSelectValue(value){
    return sourceRaceById.get(value) || Array.from(sourceRaceById.values()).find(function(r){ return norm(r.name) === norm(value); }) || null;
  }
  function lineagesForRaceValue(value){
    var appRace = appRaceFromSelectValue(value);
    var sourceRace = sourceRaceFromSelectValue(value);
    return (appRace && appRace.lineages && appRace.lineages.length ? appRace.lineages : ((sourceRace && sourceRace.lineages) || []));
  }

  function populateDirectRacePair(categoryId, raceId, lineageId){
    var cat = $(categoryId), race = $(raceId);
    if(!cat || !race) return;
    setOptions(cat, appCategoryNames, {selectFirst:true});
    var selectedCategory = cat.value || appCategoryNames[0] || '';
    setOptions(race, racesForCategoryName(selectedCategory), {value:function(r){return r.name;}, label:function(r){return r.name;}, selectFirst:true});
    if(lineageId) populateDirectLineage(raceId, lineageId);
  }

  function populateDirectLineage(raceId, lineageId){
    var race = $(raceId), lineage = $(lineageId);
    if(!race || !lineage) return;
    var lineages = lineagesForRaceValue(race.value);
    setOptions(lineage, lineages, {
      placeholder: lineages.length ? 'Choose lineage…' : 'No lineage options',
      value:function(l){ return l.name || l.id || l.selectableLabel; },
      label:function(l){ return l.selectableLabel || l.name || l.id; }
    });
    lineage.disabled = !lineages.length;
  }

  function populateSourceRacePair(prefix){
    var cat = $(prefix + '_category'), race = $(prefix + '_race'), lineage = $(prefix + '_lineage');
    if(!cat || !race) return;
    setOptions(cat, sourceCategories, {
      placeholder:'Choose racial category…',
      value:function(c){ return c.id || c.categoryId || c.name; },
      label:function(c){ return c.name || c.category || c.id; },
      selectFirst:true
    });
    var selectedCat = sourceCategoryById.get(cat.value) || sourceCategories.find(function(c){ return norm(c.name) === norm(cat.value); }) || sourceCategories[0];
    var races = (selectedCat && selectedCat.races) || [];
    setOptions(race, races, {
      placeholder:'Choose race…',
      value:function(r){ return r.id || r.name; },
      label:function(r){ return r.name || r.id; },
      selectFirst:true
    });
    var selectedRace = sourceRaceFromSelectValue(race.value) || races[0];
    var lineages = (selectedRace && selectedRace.lineages) || [];
    if(lineage){
      setOptions(lineage, lineages, {
        placeholder: lineages.length ? 'Choose lineage…' : 'No lineage options',
        value:function(l){ return l.id || l.name; },
        label:function(l){ return l.selectableLabel || l.name || l.id; }
      });
      lineage.disabled = !lineages.length;
    }
  }

  function populateBddRacePair(categoryId, raceId, lineageId){
    var cat = $(categoryId), race = $(raceId), lineage = $(lineageId);
    if(!cat || !race) return;
    setOptions(cat, sourceCategories, {
      placeholder:'Select category…',
      value:function(c){return c.id || c.categoryId || c.name;},
      label:function(c){return c.name || c.category || c.id;},
      selectFirst:true
    });
    var selectedCat = sourceCategoryById.get(cat.value) || sourceCategories[0];
    var races = (selectedCat && selectedCat.races) || [];
    setOptions(race, races, {
      placeholder:'Select race…',
      value:function(r){return r.id || r.name;},
      label:function(r){return r.name || r.id;},
      selectFirst:true
    });
    var selectedRace = sourceRaceFromSelectValue(race.value) || races[0];
    var lineages = (selectedRace && selectedRace.lineages) || [];
    if(lineage){
      setOptions(lineage, lineages, {
        placeholder: lineages.length ? 'Select lineage…' : 'No lineage options',
        value:function(l){return l.id || l.name;},
        label:function(l){return l.selectableLabel || l.name || l.id;}
      });
      lineage.disabled = !lineages.length;
    }
  }

  function populateBiomePair(groupId, biomeId, sourceStyle){
    var group = $(groupId), biome = $(biomeId);
    if(!group || !biome) return;
    var groups = Object.keys(BIOMES || {});
    setOptions(group, groups, {placeholder:'Choose biome group…', selectFirst:true});
    var selectedGroup = group.value || groups[0] || '';
    var items = BIOMES[selectedGroup] || [];
    setOptions(biome, items, {
      placeholder:'Choose biome…',
      value:function(b){ return sourceStyle ? (b.id || b.name) : (b.name || b.id); },
      label:function(b){ return b.name || b.id; },
      selectFirst:true
    });
  }

  function populateSimpleData(){
    var genderNames = uniq(((VOICE_GENDER && VOICE_GENDER.genderIdentities) || []).map(function(g){ return g.name || g.id; }).concat(SOURCE.genderIdentityDropdown || [], APP.genderIdentityDropdown || []));
    var pronounLabels = (PRONOUNS || []).map(function(p){ return p.name || String(p); });
    var titleLabels = (TITLES || []).map(function(t){ return String(t); });
    setOptions('genderIdentity', genderNames, {placeholder:'Custom / not listed'});
    setOptions('voiceGender', genderNames, {placeholder:'Custom / not listed'});
    ['genCustom_gender','voiceCustom_gender','bdd_genderIdentity'].forEach(function(id){ setOptions(id, genderNames, {placeholder:'Choose gender identity…'}); });
    ['pronounSet','voicePronounSet','genCustom_pronoun','voiceCustom_pronoun','bdd_pronounSet'].forEach(function(id){ setOptions(id, pronounLabels, {placeholder:'Choose pronouns…'}); });
    ['honorificSelect','voiceHonorificSelect','genCustom_title','voiceCustom_title','bdd_titleSelect'].forEach(function(id){ setOptions(id, titleLabels, {placeholder:'Choose title…'}); });

    var backgrounds = (APP.core && APP.core.backgrounds) || [];
    setOptions('backgroundSelect', backgrounds, {value:function(b){return typeof b === 'string' ? b : (b.name || b.id);}, label:function(b){return typeof b === 'string' ? b : (b.name || b.id);}, selectFirst:true});
    var factions = APP.factions || [];
    setOptions('tier1Faction', factions, {placeholder:'Choose faction…', value:function(f){return f.name || f.id;}, label:function(f){return (f.name || f.id) + (f.primarySeat || f.role ? ' — ' + (f.primarySeat || f.role) : '');}});
    var schools = (APP.core && APP.core.schools) || ['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'];
    setOptions('magicSchool', schools, {placeholder:'Choose magic school…'});
    var emotionOptions = ['Neutral/Base','Casting','Kindness','Compassion','Tenderness','Random encounter','Monk ability','Joy','Excitement','Calm','Annoyance','Sarcasm','Suspicion','Gruffness','Anger','Rage','Betrayal','Grief','Fear','Boss battle','Panic','Weapon attack','Exhaustion','Authority','Dungeon fight','Courage','Shame','Awe','Confidence','Flirtation','Menace','Wonder'];
    setOptions('voiceLabEmotion', emotionOptions, {placeholder:'Choose emotion/circumstance…'});
  }

  function populateClassPair(classId, subclassId, voiceMode){
    var cls = $(classId), sub = $(subclassId);
    if(!cls || !sub) return;
    setOptions(cls, classNames(), {placeholder: classId === 'secondaryClass' ? 'No secondary class' : 'Choose class…', selectFirst: classId !== 'secondaryClass'});
    var subs = voiceMode ? voiceSubclassesFor(cls.value) : subclassesFor(cls.value);
    setOptions(sub, subs.length ? subs : ['Core / No Subclass'], {placeholder:'Core / no subclass', selectFirst:true});
  }

  function populateVoiceDropdowns(){
    var raceItems = (VOICE_RACE.raceOverlays && VOICE_RACE.raceOverlays.length) ? VOICE_RACE.raceOverlays : appRaces;
    setOptions('voiceRace', raceItems, {placeholder:'Custom / not listed', value:function(r){return r.name || r.id;}, label:function(r){return r.name || r.id;}});
    var biomeItems = (VOICE_BIOME && VOICE_BIOME.biomeProfiles) || [];
    setOptions('voiceBiome', biomeItems, {placeholder:'No biome accent', value:function(b){return b.biome || b.name || b.id;}, label:function(b){return (b.biome || b.name || b.id) + (b.fantasyAccentName ? ' — ' + b.fantasyAccentName : '');}});
    populateDirectLineage('voiceRace','voiceRaceLineageSelect');
  }

  function syncCustomPreview(prefix){
    var race = sourceRaceFromSelectValue($(prefix + '_race') && $(prefix + '_race').value);
    var lineage = null;
    var linVal = $(prefix + '_lineage') && $(prefix + '_lineage').value;
    if(race && linVal) lineage = (race.lineages || []).find(function(l){ return (l.id || l.name) === linVal || norm(l.name) === norm(linVal); }) || null;
    var biomeEl = $(prefix + '_biome');
    var biomeText = biomeEl && biomeEl.selectedOptions[0] ? biomeEl.selectedOptions[0].textContent : '';
    var appearance = $(prefix + '_appearance');
    var behavior = $(prefix + '_behavior');
    var json = $(prefix + '_selectionJson');
    if(appearance) appearance.value = [biomeText ? 'Biome: ' + biomeText : '', race && race.description ? race.description : '', lineage && lineage.description ? 'Lineage: ' + lineage.description : ''].filter(Boolean).join('\n\n');
    if(behavior) behavior.value = [race && race.name ? 'Roleplay from selected heritage: ' + race.name : '', lineage && lineage.name ? 'Bloodline influence: ' + lineage.name : ''].filter(Boolean).join('\n');
    if(json) json.value = JSON.stringify({
      schema:'belavados.characterStudio.dropdownSelection.repaired.v1',
      prefix:prefix,
      biomeGroup:$(prefix + '_biomeGroup') && $(prefix + '_biomeGroup').value || '',
      biomeId:$(prefix + '_biome') && $(prefix + '_biome').value || '',
      biomeName:biomeText || '',
      heritageMode:$(prefix + '_heritageMode') && $(prefix + '_heritageMode').value || 'single',
      categoryId:$(prefix + '_category') && $(prefix + '_category').value || '',
      categoryName:$(prefix + '_category') && $(prefix + '_category').selectedOptions[0] ? $(prefix + '_category').selectedOptions[0].textContent : '',
      raceId:race && (race.id || race.name) || '',
      raceName:race && race.name || '',
      lineageId:lineage && (lineage.id || lineage.name) || '',
      lineageName:lineage && lineage.name || '',
      genderIdentity:$(prefix + '_gender') && $(prefix + '_gender').value || '',
      pronounSet:$(prefix + '_pronoun') && $(prefix + '_pronoun').value || '',
      title:$(prefix + '_title') && $(prefix + '_title').value || ''
    }, null, 2);
  }

  function populateAll(){
    populateSimpleData();
    populateDirectRacePair('raceCategory','raceSelect','race1LineageSelect');
    populateDirectRacePair('race2Category','race2Select','race2LineageSelect');
    populateBiomePair('biomeCategory','biomeSelect', false);
    populateBiomePair('genCustom_biomeGroup','genCustom_biome', true);
    populateBiomePair('voiceCustom_biomeGroup','voiceCustom_biome', true);
    populateBiomePair('bdd_biomeGroupSelect','bdd_biomeSelect', true);
    populateSourceRacePair('genCustom');
    populateSourceRacePair('voiceCustom');
    populateBddRacePair('bdd_primaryCategory','bdd_primaryRace','bdd_primaryLineage');
    populateBddRacePair('bdd_p1Category','bdd_p1Race','bdd_p1Lineage');
    populateBddRacePair('bdd_p2Category','bdd_p2Race','bdd_p2Lineage');
    populateClassPair('primaryClass','primarySubclass', false);
    populateClassPair('secondaryClass','secondarySubclass', false);
    populateClassPair('voiceClass','voiceSubclass', true);
    populateVoiceDropdowns();
    syncCustomPreview('genCustom');
    syncCustomPreview('voiceCustom');
  }

  function bindOnce(el, eventName, key, fn){
    if(!el || el.dataset[key]) return;
    el.dataset[key] = 'true';
    el.addEventListener(eventName, fn);
  }

  function wire(){
    bindOnce($('raceCategory'),'change','belDropdownRepairRaceCategory',function(){ populateDirectRacePair('raceCategory','raceSelect','race1LineageSelect'); trigger('raceSelect'); });
    bindOnce($('raceSelect'),'change','belDropdownRepairRaceSelect',function(){ populateDirectLineage('raceSelect','race1LineageSelect'); });
    bindOnce($('race2Category'),'change','belDropdownRepairRace2Category',function(){ populateDirectRacePair('race2Category','race2Select','race2LineageSelect'); trigger('race2Select'); });
    bindOnce($('race2Select'),'change','belDropdownRepairRace2Select',function(){ populateDirectLineage('race2Select','race2LineageSelect'); });
    bindOnce($('voiceRace'),'change','belDropdownRepairVoiceRace',function(){ populateDirectLineage('voiceRace','voiceRaceLineageSelect'); });
    bindOnce($('biomeCategory'),'change','belDropdownRepairBiomeCategory',function(){ populateBiomePair('biomeCategory','biomeSelect', false); });
    bindOnce($('genCustom_biomeGroup'),'change','belDropdownRepairGenBiomeGroup',function(){ populateBiomePair('genCustom_biomeGroup','genCustom_biome', true); syncCustomPreview('genCustom'); });
    bindOnce($('voiceCustom_biomeGroup'),'change','belDropdownRepairVoiceCustomBiomeGroup',function(){ populateBiomePair('voiceCustom_biomeGroup','voiceCustom_biome', true); syncCustomPreview('voiceCustom'); });
    bindOnce($('bdd_biomeGroupSelect'),'change','belDropdownRepairBddBiomeGroup',function(){ populateBiomePair('bdd_biomeGroupSelect','bdd_biomeSelect', true); });
    ['genCustom','voiceCustom'].forEach(function(prefix){
      bindOnce($(prefix + '_category'),'change','belDropdownRepairCategory',function(){ populateSourceRacePair(prefix); syncCustomPreview(prefix); });
      bindOnce($(prefix + '_race'),'change','belDropdownRepairRace',function(){ populateSourceRacePair(prefix); syncCustomPreview(prefix); });
      ['_lineage','_biome','_gender','_pronoun','_title','_heritageMode'].forEach(function(suffix){
        bindOnce($(prefix + suffix),'change','belDropdownRepairPreview',function(){ syncCustomPreview(prefix); });
      });
    });
    bindOnce($('bdd_primaryCategory'),'change','belDropdownRepairBddPrimaryCategory',function(){ populateBddRacePair('bdd_primaryCategory','bdd_primaryRace','bdd_primaryLineage'); });
    bindOnce($('bdd_primaryRace'),'change','belDropdownRepairBddPrimaryRace',function(){ populateBddRacePair('bdd_primaryCategory','bdd_primaryRace','bdd_primaryLineage'); });
    bindOnce($('bdd_p1Category'),'change','belDropdownRepairBddP1Category',function(){ populateBddRacePair('bdd_p1Category','bdd_p1Race','bdd_p1Lineage'); });
    bindOnce($('bdd_p1Race'),'change','belDropdownRepairBddP1Race',function(){ populateBddRacePair('bdd_p1Category','bdd_p1Race','bdd_p1Lineage'); });
    bindOnce($('bdd_p2Category'),'change','belDropdownRepairBddP2Category',function(){ populateBddRacePair('bdd_p2Category','bdd_p2Race','bdd_p2Lineage'); });
    bindOnce($('bdd_p2Race'),'change','belDropdownRepairBddP2Race',function(){ populateBddRacePair('bdd_p2Category','bdd_p2Race','bdd_p2Lineage'); });
    bindOnce($('primaryClass'),'change','belDropdownRepairPrimaryClass',function(){ populateClassPair('primaryClass','primarySubclass', false); });
    bindOnce($('secondaryClass'),'change','belDropdownRepairSecondaryClass',function(){ populateClassPair('secondaryClass','secondarySubclass', false); });
    bindOnce($('voiceClass'),'change','belDropdownRepairVoiceClass',function(){ populateClassPair('voiceClass','voiceSubclass', true); });
  }

  function repairEmptyOnly(){
    var important = ['raceCategory','raceSelect','race2Category','race2Select','biomeCategory','biomeSelect','genderIdentity','backgroundSelect','primaryClass','primarySubclass','secondaryClass','secondarySubclass','magicSchool','voiceGender','voiceRace','voiceClass','voiceSubclass','voiceBiome','voiceLabEmotion','genCustom_category','genCustom_race','genCustom_gender','genCustom_pronoun','genCustom_title','voiceCustom_category','voiceCustom_race','voiceCustom_gender','voiceCustom_pronoun','voiceCustom_title','bdd_primaryCategory','bdd_primaryRace','bdd_genderIdentity','bdd_pronounSet','bdd_titleSelect'];
    if(important.some(function(id){ var el = $(id); return el && el.tagName === 'SELECT' && el.options.length === 0; })) populateAll();
  }

  function init(){
    populateAll();
    wire();
    setTimeout(function(){ populateAll(); wire(); }, 200);
    setTimeout(function(){ repairEmptyOnly(); wire(); }, 1000);
    setTimeout(function(){ repairEmptyOnly(); wire(); }, 2500);
    if(!window.__BELAVADOS_DROPDOWN_REPAIR_OBSERVER__){
      window.__BELAVADOS_DROPDOWN_REPAIR_OBSERVER__ = new MutationObserver(function(){ clearTimeout(window.__belDropdownRepairTimer); window.__belDropdownRepairTimer = setTimeout(function(){ repairEmptyOnly(); wire(); }, 120); });
      window.__BELAVADOS_DROPDOWN_REPAIR_OBSERVER__.observe(doc.documentElement, {childList:true, subtree:true});
    }
  }

  window.BelavadosDropdownRepair = {populateAll:populateAll, repairEmptyOnly:repairEmptyOnly, wire:wire};
  if(doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init); else init();
})();
