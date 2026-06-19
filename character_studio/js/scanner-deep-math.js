(() => {
  'use strict';
  const S = window.BelavadosScanner;
  function statusAppend(msg){ const el=S.$('resourceStatus'); if(el) el.textContent = (el.textContent ? el.textContent + ' ' : '') + msg; }
  S.loadDeepVoiceMath = async function(){
    let data = window.BELAVADOS_DEEP_VOICE_RUNTIME_INDEX;
    if(!data){ try{ const res=await fetch('json/deep-voice-runtime-index.json', {cache:'no-store'}); if(res.ok) data=await res.json(); }catch(err){} }
    S.state.resources.deepMath = data || null;
    if(data) statusAppend(`Deep voice math loaded: ${data.counts?.races || 0} races, ${data.counts?.classes || 0} classes, ${data.counts?.genderIdentities || 0} gender profiles.`);
    return data;
  };
  function deepParamsToTraitTargets(p){
    p = p || {};
    const tex = p.specialTextureMix || {};
    const lat = p.latentStyleVectorHints || {};
    return {
      pitch: S.clamp(5 + (p.f0SemitoneOffset || 0)/2.8 + ((p.pitchRangeSemitones ?? 2)-2)*0.18 + (tex.avianLift||0)*1.2, 0, 10),
      speed: S.clamp(5 + ((p.speechRateMultiplier ?? 1)-1)*7 - ((p.durationScale ?? 1)-1)*4, 0, 10),
      inflection: S.clamp(5 + ((p.pitchRangeSemitones ?? 2)-2)*0.32 + ((p.rhythmSwing ?? .28)-.28)*5 + (lat.musicality||0)*1.2 + (lat.theatricality||0)*0.8, 0, 10),
      stutter: S.clamp(1 + ((p.pauseDensity ?? .3)-.3)*4 + (tex.clickCroakTexture||0)*1.2 + (lat.tension||0)*0.5, 0, 10),
      breath: S.clamp(3 + (p.breathNoiseMix||0)*13 + (p.aspirationAmount||0)*7 + (tex.undeadWhisper||0)*2.2 + (tex.plantRustle||0)*.8, 0, 10),
      roughness: S.clamp(2 + (p.roughnessAmount||0)*17 + (p.jitterCents||0)/7 + (p.shimmerDb||0)*1.15 + (tex.draconicGrowl||0)*2 + (tex.clickCroakTexture||0)*1.8, 0, 10),
      resonance: S.clamp(5.5 + ((p.chestResonanceDb ?? 2.6)-2.6)*0.55 + (1-(p.formantScale ?? 1))*2.2 + (tex.metallicResonance||0)*1.0, 0, 10),
      formality: S.clamp(5.5 + ((p.articulationPrecision ?? .65)-.65)*4 + (lat.authority||0)*1.0 + (lat.ritualCadence||0)*.8, 0, 10),
      vowelFlow: S.clamp(5 + ((p.vowelLengthMultiplier ?? 1.05)-1.05)*8 + ((p.legatoBlend ?? .16)-.16)*4 + (lat.fluidity||0)*1.4, 0, 10),
      consonantBite: S.clamp(5 + ((p.consonantEnergy ?? 1)-1)*4 + (p.fricativeEdge||0)*5 + (tex.draconicGrowl||0)*.8, 0, 10),
      mouthShape: S.clamp(5 + ((p.mouthOpenness ?? .54)-.54)*5, 0, 10),
      nasality: S.clamp(5 + ((p.nasalMix ?? .03)-.03)*14, 0, 10),
      throatDepth: S.clamp(5 + ((p.throatDepth ?? .39)-.39)*6 + (tex.draconicGrowl||0)*1.3 + (tex.animalTexture||0)*.6, 0, 10),
      rhythm: S.clamp(5 + ((p.rhythmSwing ?? .28)-.28)*5 + (lat.musicality||0)*.7, 0, 10),
      pauseControl: S.clamp(5 + ((p.pauseMeanMs ?? 357)-357)/140 + ((p.pauseDensity ?? .3)-.3)*4 + (lat.secrecy||0)*1.3 + (lat.ritualCadence||0)*1.1, 0, 10),
      emphasis: S.clamp(5 + ((p.stressGainDb ?? 3.2)-3.2)*0.55 + (lat.authority||0)*1.2 + (lat.emotionalColor||0)*.8, 0, 10),
      warmth: S.clamp(5 + (lat.warmth ?? .42)*2.2 + ((p.warmSpectralTiltDb ?? -.56)+.56)*-.35 - (tex.undeadWhisper||0)*1.2, 0, 10),
      clarity: S.clamp(6 + ((p.clarityIndex ?? .68)-.68)*5 + ((p.articulationPrecision ?? .65)-.65)*3 - (tex.clickCroakTexture||0)*.8, 0, 10),
      projection: S.clamp(5 + ((p.projectionRmsDb ?? -26.4)+26.4)/2 + (lat.authority||0)*1.0, 0, 10),
      humanVariation: S.clamp(5 + ((p.humanVariationAmount ?? .35)-.35)*5 + (tex.metallicResonance||0)*-1 + (tex.animalTexture||0)*.7, 0, 10),
      accentColor: S.clamp(7 + (p.specialTextureMix ? Object.values(tex).reduce((a,b)=>a+Number(b||0),0) : 0)*.8 + (lat.fluidity||0)*.4, 0, 10)
    };
  }
  function getEngineParams(obj){ return obj?.deepRaceMath?.engineParameters || obj?.deepCategoryMath?.engineParameters || obj?.deepClassMath?.engineParameters || obj?.deepSubclassMath?.engineParameters || obj?.deepGenderMath?.engineParameters || null; }
  function matchDeep(profile){
    const dm = S.state.resources.deepMath;
    if(!dm) return null;
    const raceQuery = [profile.character.lineage, profile.character.race, profile.character.bloodline].filter(Boolean).join(' ') || profile.character.race;
    const race = S.bestMatch(raceQuery, dm.races || [], r=>r.name, r=>`${r.id||''} ${r.racialCategory||''} ${r.descriptionSourceSummary||''}`);
    const categoryName = race.item?.racialCategory;
    const cat = categoryName ? S.bestMatch(categoryName, dm.categories || [], c=>c.name, c=>`${c.summary||''}`) : {item:null,score:0};
    const cls = S.bestMatch(profile.character.class, dm.classes || [], c=>c.name, c=>`${c.id||''} ${c.description||''}`);
    const subs = (dm.classes || []).flatMap(c => (c.subclasses||[]).map(s => ({...s,_parent:c})));
    const sub = S.bestMatch(profile.character.subclass, subs, s=>s.fullName||s.name, s=>`${s.name||''} ${s.parentClass||''} ${s.description||''}`);
    const gen = S.bestMatch(profile.character.genderIdentity, dm.genderIdentities || [], g=>g.name, g=>`${g.id||''} ${g.voiceDesignSummary||''}`);
    return {race, cat, cls, sub, gen};
  }
  function applyDeepLayer(profile, targetObj, influence, strength, label, vectors){
    const params = getEngineParams(targetObj);
    if(!params) return;
    const targets = deepParamsToTraitTargets(params);
    S.applyOverlay(profile.voice.traits, targets, influence, strength, profile.appliedOverlays, label);
    vectors.push({label, vectorName: targetObj.deepRaceMath?.vectorName || targetObj.deepCategoryMath?.vectorName || targetObj.deepClassMath?.vectorName || targetObj.deepSubclassMath?.vectorName || targetObj.deepGenderMath?.vectorName || targetObj.name, engineParameters: params, sliderTargets: targets});
  }
  const previousBuild = S.buildVoiceProfile;
  S.buildVoiceProfile = function(rawNpc){
    const profile = previousBuild(rawNpc);
    const dm = S.state.resources.deepMath;
    if(!dm){ profile.voice.exportNotes.push('Deep voice math was not loaded; base scanner overlays were used.'); return profile; }
    const matches = matchDeep(profile);
    const vectors=[];
    const inf = profile.voice.influences || {};
    if(matches?.cat?.item) applyDeepLayer(profile, matches.cat.item, inf.influenceRace ?? 100, .16, `deep-category:${matches.cat.item.name}`, vectors);
    if(matches?.race?.item) applyDeepLayer(profile, matches.race.item, inf.influenceRace ?? 100, .24, `deep-race:${matches.race.item.name}`, vectors);
    if(matches?.cls?.item) applyDeepLayer(profile, matches.cls.item, inf.influencePersonality ?? 100, .16, `deep-class:${matches.cls.item.name}`, vectors);
    if(matches?.sub?.item) applyDeepLayer(profile, matches.sub.item, inf.influencePersonality ?? 100, .12, `deep-subclass:${matches.sub.item.fullName || matches.sub.item.name}`, vectors);
    if(matches?.gen?.item) applyDeepLayer(profile, matches.gen.item, inf.influenceGender ?? 100, .10, `deep-gender:${matches.gen.item.name}`, vectors);
    profile.voice.traits = S.naturalnessGuard(profile.voice.traits, profile.voice.exportNotes);
    profile.computedVoice = S.engineFromTraits(profile.voice.traits);
    profile.voice.mathHints.deepVoiceMath24Pack = true;
    profile.voice.deepMathVectors = {
      runtimeIndexSchema: dm.schema,
      appliedVectorCount: vectors.length,
      matches: {
        category: matches?.cat?.item ? {name:matches.cat.item.name, score:Number(matches.cat.score.toFixed(2))} : null,
        race: matches?.race?.item ? {name:matches.race.item.name, category:matches.race.item.racialCategory, score:Number(matches.race.score.toFixed(2))} : null,
        class: matches?.cls?.item ? {name:matches.cls.item.name, score:Number(matches.cls.score.toFixed(2))} : null,
        subclass: matches?.sub?.item ? {name:matches.sub.item.fullName || matches.sub.item.name, score:Number(matches.sub.score.toFixed(2))} : null,
        gender: matches?.gen?.item ? {name:matches.gen.item.name, score:Number(matches.gen.score.toFixed(2))} : null
      },
      appliedVectors: vectors
    };
    profile.voice.exportNotes.push(`Applied ${vectors.length} deep voice-math vector layer(s) from the 24 JSON pack.`);
    profile.playerFacingSummary.summary += ` Deep voice-math vectors refined the synthesis profile while keeping the fantasy accent visible.`;
    return profile;
  };
})();
