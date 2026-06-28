(() => {
  'use strict';
  const S = window.BelavadosScanner;
  function statusAppend(msg){ const el=S.$('resourceStatus'); if(el) el.textContent = (el.textContent ? el.textContent + ' ' : '') + msg; }
  S.loadMergedAssets = async function(){
    let data = window.BELAVADOS_ASSET_INDEX;
    if(!data){ try{ const res=await fetch('json/assets-index.json', {cache:'no-store'}); if(res.ok) data=await res.json(); }catch(err){} }
    S.state.resources.assetIndex = data || null;
    S.state.resources.audioReferences = data?.audioReferences || [];
    S.state.resources.sourceReferences = data?.sourceReferences || [];
    if(data) statusAppend(`Absorbed assets indexed: ${data.totalFilesFromVoicePackage || data.files?.length || 0} files, ${S.state.resources.audioReferences.length} audio references.`);
    return data;
  };
  function textScore(query, value, weight){
    if(!query || !value) return 0;
    const q=S.norm(query), v=S.norm(value);
    if(!q || !v) return 0;
    if(q===v) return weight;
    if(q.includes(v) || v.includes(q)) return weight*.85;
    return S.fuzzyScore(q, v) * weight * .6;
  }
  S.findAssetMatches = function(profile, limit=12){
    const refs = S.state.resources.audioReferences || [];
    if(!profile || !refs.length) return [];
    const raceCat = profile.voice.deepMathVectors?.matches?.race?.category || '';
    const out=[];
    for(const a of refs){
      const f=a.filter || {};
      let score=0;
      score += textScore(profile.voice.fantasyAccent, f.fantasyAccentName, 9);
      score += textScore(profile.character.biome, f.biome, 7);
      score += textScore(raceCat, f.raceCategoryName, 5);
      score += textScore(profile.character.genderIdentity, f.genderIdentity, 3);
      score += textScore(profile.character.class, f.className, 3);
      score += textScore(profile.character.race + ' ' + profile.character.lineage, a.originalPath, 1.5);
      if(a.durationSec && a.durationSec < 12) score += .5;
      if(score>0) out.push({...a, score:Number(score.toFixed(2))});
    }
    out.sort((a,b)=>b.score-a.score || (a.bytes||0)-(b.bytes||0));
    return out.slice(0, limit);
  };
  S.attachAssetInfluences = function(profile){
    const idx=S.state.resources.assetIndex;
    if(!idx || !profile) return profile;
    const matches=S.findAssetMatches(profile, 12);
    profile.voice.mathHints.localAudioReferenceAssets = true;
    profile.voice.assetInfluences = {
      mode:'reference-corpus/humanization cues only; not voice cloning',
      totalIndexedAssets: idx.totalFilesFromVoicePackage || idx.files?.length || 0,
      indexedAudioReferences: (idx.audioReferences || []).length,
      matchedAudioReferenceCount: matches.length,
      matchedAudioReferences: matches.map(a => ({id:a.id, catalogId:a.catalogId, score:a.score, path:a.shortPath, ext:a.ext, bytes:a.bytes, durationSec:a.durationSec ?? null, sampleRateHz:a.sampleRateHz ?? null, filter:a.filter || {}, originalPath:a.originalPath}))
    };
    if(matches.length){
      const best=matches[0];
      const inf=profile.voice.influences?.influenceBaseAudio ?? 45;
      const cue = best.durationSec && best.durationSec < 2.5 ? {speed:.08, pauseControl:-.06} : best.durationSec && best.durationSec > 7 ? {speed:-.06, pauseControl:.08} : {};
      S.applyDelta(profile.voice.traits, cue, inf, .6, profile.appliedOverlays, `asset-humanization:${best.id}`);
      profile.voice.traits = S.naturalnessGuard(profile.voice.traits, profile.voice.exportNotes);
      profile.computedVoice = S.engineFromTraits(profile.voice.traits);
      profile.voice.exportNotes.push(`Matched ${matches.length} local audio reference asset(s) as timing/humanization cues. Audio is playable as reference but not cloned.`);
    }else{
      profile.voice.exportNotes.push('No close local audio asset match was found; scanner kept mathematical synthesis settings only.');
    }
    return profile;
  };
  const previousBuild = S.buildVoiceProfile;
  S.buildVoiceProfile = function(rawNpc){
    const profile = previousBuild(rawNpc);
    return S.attachAssetInfluences(profile);
  };
})();
