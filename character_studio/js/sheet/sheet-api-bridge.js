
(function(){
  function nget(obj,path){return String(path||'').split('.').reduce((o,k)=>o&&Object.prototype.hasOwnProperty.call(o,k)?o[k]:undefined,obj);} 
  function nset(obj,path,value){const parts=String(path||'').split('.'); let cur=obj; parts.forEach((p,i)=>{ if(i===parts.length-1) cur[p]=value; else cur=cur[p]=cur[p]||{}; }); return obj;}
  function listText(v){ return Array.isArray(v) ? v.filter(Boolean).join(', ') : (v || ''); }
  function applySitePayload(payload){
    payload = payload || {};
    const c = payload.generator || {};
    const v = payload.voice || {};
    const dd = payload.dropdowns || {};
    const genDD = dd.generator || {};
    const voiceDD = dd.voice || {};
    const chosenDD = genDD.biomeName || genDD.raceName || genDD.genderIdentity ? genDD : voiceDD;
    const identity = c.identity || {};
    const lineage = c.lineage || {};
    const cls = c.classBuild || {};
    const stats = c.stats || {};
    const align = c.alignment || {};
    const axes = align.axes || {};
    const labels = align.labels || {};
    const notes = c.notes || {};
    const obj = {};
    nset(obj,'characterName', identity.name || v.name || '');
    nset(obj,'playerName', identity.playerName || '');
    nset(obj,'characterPronouns', identity.pronouns || chosenDD.pronounText || chosenDD.pronounSet?.name || '');
    nset(obj,'playerPronouns', identity.playerPronouns || '');
    nset(obj,'genderIdentity', identity.genderIdentity || chosenDD.genderIdentity || v.genderIdentity || '');
    nset(obj,'race', chosenDD.lineageLabel || listText(lineage.raceCombination) || v.race || v.raceName || '');
    nset(obj,'background', c.background || '');
    nset(obj,'primaryClass', cls.primaryClass || v.className || '');
    nset(obj,'primarySubclass', cls.primarySubclass || v.subclass || '');
    nset(obj,'primaryLevel', cls.primaryLevel || 8);
    nset(obj,'secondaryClass', cls.secondaryClass || '');
    nset(obj,'secondarySubclass', cls.secondarySubclass || '');
    nset(obj,'secondaryLevel', cls.secondaryLevel || 0);
    nset(obj,'level', (Number(cls.primaryLevel)||8) + (Number(cls.secondaryLevel)||0));
    nset(obj,'magicSchool', cls.magicSchool || '');
    nset(obj,'tier1Faction', nget(c,'factionAssociation.tier1') || '');
    nset(obj,'tier0Notes', nget(c,'factionAssociation.tier0Notes') || '');
    nset(obj,'autoFactionAssociation', nget(c,'factionAssociation.automaticTier2') || 'The Nefaric Veil - Tier 2 Specialist / Officer / Veteran.');
    ['STR','DEX','CON','INT','WIS','CHA'].forEach(k=>{ if(stats[k]!==undefined) nset(obj,'scores.'+k, stats[k]); });
    ['altruism','lawfulness','cooperation','honor'].forEach(k=>{ if(axes[k]!==undefined) nset(obj,'axes.'+k, axes[k]); if(labels[k]) nset(obj,'axisLabels.'+k, labels[k]); });
    nset(obj,'alignmentName', align.summary || v.alignment || '');
    nset(obj,'alignmentDescription', align.summary || '');
    nset(obj,'axisPhases', align.summary || '');
    nset(obj,'raceFeatures', (notes.raceSummary||[]).map(r=>[r.name,r.traits,r.abilities].filter(Boolean).join(': ')).join('\n\n'));
    nset(obj,'classFeatures', listText(nget(notes,'classSummary.primaryFeatures')) + (nget(notes,'classSummary.secondaryFeatures')?.length ? '\n' + listText(nget(notes,'classSummary.secondaryFeatures')) : ''));
    nset(obj,'additionalFeatures', JSON.stringify(notes, null, 2));
    nset(obj,'appearance', chosenDD.appearanceDescription || nget(genDD,'appearanceDescription') || nget(voiceDD,'appearanceDescription') || '');
    nset(obj,'personalityTraits', chosenDD.behaviorDescription || v.notes || '');
    nset(obj,'backstory', payload.exactSpeech ? 'Exact line / dialogue test:\n' + payload.exactSpeech : '');
    nset(obj,'lineage.biomeCategory', chosenDD.biomeGroup || lineage.biomeCategory || '');
    nset(obj,'lineage.originBiome', chosenDD.biomeName || lineage.originBiome || v.biome || '');
    nset(obj,'lineage.raceCategory', chosenDD.categoryName || lineage.raceCategory || '');
    nset(obj,'lineage.raceCategoryId', chosenDD.categoryId || '');
    nset(obj,'lineage.race1', chosenDD.raceName || lineage.race1 || '');
    nset(obj,'lineage.race1Id', chosenDD.raceId || '');
    nset(obj,'lineage.race1Lineage', chosenDD.lineageName || '');
    nset(obj,'lineage.race1LineageId', chosenDD.lineageId || '');
    nset(obj,'lineage.heritageMode', chosenDD.heritageMode || 'single');
    nset(obj,'lineage.generatedAppearanceDescription', chosenDD.appearanceDescription || '');
    nset(obj,'lineage.generatedBehaviorDescription', chosenDD.behaviorDescription || '');
    nset(obj,'lineage.dropdownSelectionJson', JSON.stringify({generator:genDD, voice:voiceDD, fullSitePayload:payload}, null, 2));
    nset(obj,'honorifics.cachedTitlesJson', JSON.stringify(chosenDD.titlesHonorificsEndearments || []));
    const pron = chosenDD.pronounSet || {};
    nset(obj,'pronouns.setName', pron.name || '');
    nset(obj,'pronouns.subject', pron.subject || '');
    nset(obj,'pronouns.object', pron.object || '');
    nset(obj,'pronouns.possessiveDeterminer', pron.possessiveDeterminer || '');
    nset(obj,'pronouns.possessivePronoun', pron.possessivePronoun || '');
    nset(obj,'pronouns.reflexive', pron.reflexive || '');
    nset(obj,'voice.previewText', payload.exactSpeech || '');
    nset(obj,'voice.emotion', nget(v,'descriptors.warmth') || '');
    nset(obj,'voice.circumstance', v.fantasyAccentName || v.source || '');
    nset(obj,'fallbackEtc', JSON.stringify(payload, null, 2));
    if(window.loadSheet) window.loadSheet(obj);
    if(window.setStatus) window.setStatus('Loaded merged site data into this sheet.');
    return obj;
  }
  function exportCurrentHtml(){
    const doc = document.cloneNode(true);
    doc.querySelectorAll('input, textarea, select').forEach(el=>{
      if(el.tagName === 'TEXTAREA') el.textContent = el.value || '';
      else if(el.tagName === 'SELECT') Array.from(el.options).forEach(o=>{ if(o.selected) o.setAttribute('selected','selected'); else o.removeAttribute('selected'); });
      else if(el.type === 'checkbox' || el.type === 'radio') { if(el.checked) el.setAttribute('checked','checked'); else el.removeAttribute('checked'); }
      else el.setAttribute('value', el.value || '');
    });
    return '<!doctype html>\n' + doc.documentElement.outerHTML;
  }
  function ready(){
    if(typeof window.collectSheet === 'function') {
      window.BelavadosSheetApi = {
        collect: window.collectSheet,
        load: window.loadSheet,
        applySitePayload,
        exportCurrentHtml,
        setField: window.setField,
        getByKey: window.getByKey
      };
      window.parent && window.parent.postMessage({type:'belavados-sheet-ready'}, '*');
    }
  }
  window.addEventListener('message', ev=>{
    const msg = ev.data || {};
    if(msg.type === 'belavados-apply-site-payload') applySitePayload(msg.payload);
    if(msg.type === 'belavados-request-sheet-data' && window.BelavadosSheetApi) ev.source && ev.source.postMessage({type:'belavados-sheet-data', payload:window.BelavadosSheetApi.collect()}, '*');
  });
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready); else ready();
})();
