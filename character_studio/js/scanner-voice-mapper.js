(() => {
  'use strict';
  const S = window.BelavadosScanner;
  const personalityLexicon = [
    {terms:['gentle','kind','soft','tender'], delta:{warmth:1.0,consonantBite:-0.5,breath:0.3,speed:-0.15}},
    {terms:['stern','strict','severe'], delta:{formality:0.8,consonantBite:0.7,warmth:-0.7,emphasis:0.4}},
    {terms:['nervous','anxious','skittish'], delta:{stutter:0.8,speed:0.4,projection:-0.4,pitch:0.35,breath:0.5}},
    {terms:['confident','bold','certain'], delta:{projection:0.8,clarity:0.55,emphasis:0.5,pauseControl:0.2}},
    {terms:['ancient','old','elder'], delta:{speed:-0.55,pauseControl:0.8,resonance:0.5,formality:0.4}},
    {terms:['playful','mischief','trickster'], delta:{inflection:0.9,rhythm:0.6,warmth:0.4,humanVariation:0.5}},
    {terms:['secretive','hidden','spy','rogue'], delta:{projection:-0.7,vowelFlow:-0.2,pauseControl:0.5,clarity:0.2}},
    {terms:['haunted','ghost','mourning','solemn'], delta:{breath:0.65,pauseControl:0.9,warmth:-0.4,speed:-0.25}},
    {terms:['protective','guardian','defender','savior'], delta:{projection:0.45,emphasis:0.45,warmth:0.35,formality:0.25}},
    {terms:['scholarly','precise','academic','wizard'], delta:{clarity:0.75,formality:0.65,speed:-0.1,pauseControl:0.2}},
    {terms:['prophetic','ritual','cleric','blessing'], delta:{pauseControl:0.6,formality:0.45,rhythm:0.35,emphasis:0.3}},
    {terms:['draconic','dragon','scale','growl'], delta:{throatDepth:0.8,roughness:0.6,consonantBite:0.4,resonance:0.5}},
    {terms:['construct','warforged','machine','clockwork'], delta:{humanVariation:-0.7,clarity:0.6,formality:0.5,rhythm:-0.2}},
    {terms:['plant','root','leaf','fungal','forest'], delta:{speed:-0.2,vowelFlow:0.35,resonance:0.25,warmth:0.25}},
    {terms:['bird','avian','sky','wing'], delta:{pitch:0.45,breath:0.35,inflection:0.35,clarity:0.2}},
    {terms:['psionic','astral','alien','mind'], delta:{pauseControl:0.8,emphasis:0.2,warmth:-0.25,inflection:-0.15}}
  ];
  function personalityDelta(text){
    const low=S.norm(text), delta={}, hits=[];
    for(const entry of personalityLexicon){
      if(entry.terms.some(t => low.includes(S.norm(t)))){
        hits.push(entry.terms[0]);
        for(const [k,v] of Object.entries(entry.delta)) delta[k]=(delta[k]||0)+v;
      }
    }
    return {delta,hits};
  }
  S.currentInfluences = function(){
    const obj={};
    for(const [,id,, ,def] of S.INFLUENCES){ const el=S.$(id); obj[id]=el?Number(el.value):def; }
    return obj;
  };
  S.currentAlignment = function(){
    const obj={};
    for(const [,id,, ,def] of S.ALIGNMENT_AXES){ const el=S.$(id); obj[id]=el?Number(el.value):def; }
    return obj;
  };
  S.currentTraits = function(){
    const obj={};
    for(const [,id,, ,def] of S.TRAITS){ const el=S.$(id); obj[id]=el?Number(el.value):def; }
    return obj;
  };
  S.npcFromControls = function(){
    return S.normalizeNpcObject({
      name:S.$('characterName')?.value, race:S.$('characterRace')?.value, lineage:S.$('characterLineage')?.value, bloodline:S.$('characterBloodline')?.value,
      biome:S.$('characterBiome')?.value, settlementType:S.$('characterSettlementType')?.value, className:S.$('characterClass')?.value, subclass:S.$('characterSubclass')?.value,
      genderIdentity:S.$('characterGenderIdentity')?.value, personalityText:S.$('characterPersonalityText')?.value, emotion:S.$('characterEmotion')?.value || 'Neutral / Base'
    });
  };
  S.findClassAndSubclass = function(npc){
    let classMatch=S.bestMatch(npc.className, S.state.resources.classes, c=>c.name, c=>c.id || c.description || '');
    const allSubs=S.state.resources.classes.flatMap(c => (c.subclasses||[]).map(s => ({...s,_parent:c})));
    let subQuery=npc.subclass || '';
    if(!subQuery && npc.className){ const byFull=S.bestMatch(npc.className, allSubs, s=>s.fullName||s.name, s=>`${s.name} ${s.parentClass||''}`); if(byFull.score>=.5) subQuery=npc.className; }
    const subMatch=S.bestMatch(subQuery, allSubs, s=>s.fullName||s.name, s=>`${s.name} ${s.parentClass||''} ${(s.keywords||[]).join(' ')}`);
    if(subMatch.item && (!classMatch.item || classMatch.score<.5)) classMatch={item:subMatch.item._parent, score:.72};
    return {classMatch, subMatch};
  };
  function matchInfo(raw, match, get){ return {query:raw||'', matched:get(match.item)||'', score:Number((match.score||0).toFixed(2)), status:match.score>=.99?'exact':(match.item?'fuzzy':'missing')}; }
  function descriptors(t){
    const d=[];
    if(t.throatDepth>7.4) d.push('throaty resonance');
    if(t.vowelFlow>7) d.push('flowing vowels');
    if(t.roughness>6.8) d.push('gruff edge');
    if(t.warmth>7) d.push('warm social tone');
    if(t.formality>7) d.push('formal careful delivery');
    if(t.projection>7) d.push('projected authority');
    if(t.pauseControl>7) d.push('spacious pauses');
    if(t.inflection>7) d.push('melodic phrase movement');
    if(t.clarity>7.5) d.push('clear articulation');
    if(t.humanVariation>7) d.push('lifelike micro-variation');
    if(t.breath>6.5) d.push('breath-softened tone');
    return d.length ? d : ['balanced fantasy speech profile'];
  }
  function resolveBiome(npc){
    const queries=[npc.biome, npc.settlementType, npc.lineage, `${npc.race} ${npc.lineage} ${npc.personalityText}`].filter(Boolean);
    let best={item:null,score:0,query:''};
    for(const q of queries){
      const m=S.bestMatch(q, S.state.resources.biomes, b=>b.biome, b=>`${b.fantasyAccentName} ${b.finalVoiceFeel} ${(b.lineageRules||[]).join(' ')}`);
      if(m.score>best.score) best={...m,query:q};
    }
    return best;
  }
  S.buildVoiceProfile = function(rawNpc){
    const npc=S.normalizeNpcObject(rawNpc);
    const warnings=[];
    const trace=[];
    const influences=S.currentInfluences();
    const alignment=S.currentAlignment();
    const manualTraits=S.currentTraits();
    const biomeMatch=resolveBiome(npc);
    const raceQuery=[npc.lineage,npc.race,npc.bloodline].filter(Boolean).join(' ') || npc.race;
    const raceMatch=S.bestMatch(raceQuery, S.state.resources.races, r=>r.name, r=>`${r.racialCategory||''} ${r.raceSpeechArchetype||''} ${r.voiceDesignSummary||''}`);
    const {classMatch, subMatch}=S.findClassAndSubclass(npc);
    const genderMatch=S.bestMatch(npc.genderIdentity, S.state.resources.genders, g=>g.name, g=>`${g.id||''} ${g.voiceDesignSummary||''}`);
    const emotionMatch=S.bestMatch(npc.emotion || 'Neutral / Base', S.state.resources.emotions, e=>e.name, e=>e.id||'');
    const person=personalityDelta(`${npc.personalityText||''} ${npc.lineage||''} ${npc.bloodline||''}`);
    let traits={...S.DEFAULT_TRAITS};
    if(biomeMatch.item){ S.applyOverlay(traits, biomeMatch.item.baseTraits || biomeMatch.item.overlayTraits, influences.influenceBiome, 1, trace, `biome:${biomeMatch.item.biome}`); }
    else warnings.push('No biome provided or matched; used neutral/base voice traits.');
    if(raceMatch.item) S.applyOverlay(traits, raceMatch.item.overlayTraits, influences.influenceRace, .35, trace, `race:${raceMatch.item.name}`);
    else if(npc.race || npc.lineage) warnings.push('Race/lineage did not match a known overlay; kept biome-only race behavior.');
    if(classMatch.item) S.applyOverlay(traits, classMatch.item.overlayTraits, 100, .25, trace, `class:${classMatch.item.name}`);
    if(subMatch.item) S.applyDelta(traits, subMatch.item.traitDeltas || {}, 100, .3, trace, `subclass:${subMatch.item.fullName||subMatch.item.name}`);
    if(genderMatch.item) S.applyOverlay(traits, genderMatch.item.overlayTraits, influences.influenceGender, .18, trace, `gender:${genderMatch.item.name}`);
    if(Object.keys(person.delta).length) S.applyDelta(traits, person.delta, influences.influencePersonality, .55, trace, `personality:${person.hits.join(', ')}`);
    if(emotionMatch.item) S.applyDelta(traits, emotionMatch.item.traitDeltas, influences.emotionIntensity, .8, trace, `emotion:${emotionMatch.item.name}`);
    S.applyOverlay(traits, manualTraits, 100, .22, trace, 'manual sliders');
    if(S.state.referenceAudioName && influences.influenceBaseAudio>0){ trace.push({layer:'reference-audio', kind:'influence-only', file:S.state.referenceAudioName, influenceBaseAudio:influences.influenceBaseAudio}); warnings.push('Reference audio was recorded as influence metadata only; it is not cloned or forced playback.'); }
    traits=S.naturalnessGuard(traits, warnings);
    const engine=S.engineFromTraits(traits);
    const accent=biomeMatch.item?.fantasyAccentName || 'Neutral / Base Voice';
    const baseAccent=biomeMatch.item?.baseAccentInspiration || '';
    if(baseAccent) warnings.push('Base accent inspiration is hidden from player-facing output.');
    const resolvedFrom = biomeMatch.item ? `${biomeMatch.item.biome} biome${npc.lineage ? ' + '+npc.lineage+' lineage' : ''}` : 'neutral fallback';
    const desc=descriptors(traits);
    const voiceSummary = `${npc.name || 'Unnamed NPC'} uses ${accent}. Resolved from ${resolvedFrom}. Voice shape: ${desc.join('; ')}.`;
    const profile=S.blankProfile();
    profile.character={name:npc.name || 'Unnamed NPC', race:npc.race || '', lineage:npc.lineage || '', bloodline:npc.bloodline || '', class:classMatch.item?.name || npc.className || '', subclass:subMatch.item?.fullName || subMatch.item?.name || npc.subclass || '', genderIdentity:genderMatch.item?.name || npc.genderIdentity || '', biome:biomeMatch.item?.biome || npc.biome || '', settlementType:npc.settlementType || '', personalityText:npc.personalityText || '', emotion:emotionMatch.item?.name || npc.emotion || 'Neutral / Base'};
    profile.voice={fantasyAccent:accent, baseAccentInspiration:baseAccent, baseAccentVisibleToPlayer:false, traits, influences, alignmentAxes:alignment, mathHints:{...S.MATH_HINTS}, exportNotes:warnings};
    profile.originalInput=npc.originalInput || rawNpc;
    profile.parsedTraits={personalityTags:person.hits, resolvedFrom};
    profile.appliedOverlays=trace;
    profile.computedVoice=engine;
    profile.playerFacingSummary={fantasyAccent:accent, resolvedFrom, voiceShape:desc.join('; '), summary:voiceSummary};
    profile.developerOnly={baseAccentInspiration:baseAccent, matches:{biome:matchInfo(npc.biome||npc.settlementType, biomeMatch, b=>b?.biome), race:matchInfo(raceQuery, raceMatch, r=>r?.name), class:matchInfo(npc.className, classMatch, c=>c?.name), subclass:matchInfo(npc.subclass, subMatch, s=>s?.fullName||s?.name), gender:matchInfo(npc.genderIdentity, genderMatch, g=>g?.name), emotion:matchInfo(npc.emotion, emotionMatch, e=>e?.name)}};
    return profile;
  };
})();
