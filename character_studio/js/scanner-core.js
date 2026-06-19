(() => {
  'use strict';
  const S = window.BelavadosScanner = window.BelavadosScanner || {};
  S.VERSION = 'belavados.voiceProfile.v1';
  S.SOURCE = 'simulated-fantasy-voices-scanner';
  S.$ = (id) => document.getElementById(id);
  S.norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  S.esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  S.clamp = (v,min,max) => Math.min(max, Math.max(min, Number.isFinite(Number(v)) ? Number(v) : min));
  S.slug = (s) => S.norm(s).replace(/\s+/g,'-') || 'item';
  S.titleish = (s) => String(s || '').replace(/_/g,' ').replace(/\b\w/g, m => m.toUpperCase());

  S.TRAITS = [
    ['Voice Height','pitch',0,10,5,'Base pitch, F0, semitone shift, browser voice scoring.'],
    ['Speaking Speed','speed',0,10,5,'Speech rate, duration, and pacing.'],
    ['Expression Shape','inflection',0,10,5,'Pitch motion, melody, and phrase movement.'],
    ['Hesitations','stutter',0,10,1,'Stutter chance, hesitation text, and pause behavior.'],
    ['Softness','breath',0,10,3,'Airiness and softness without static.'],
    ['Gruff Edge','roughness',0,10,2,'Jitter/shimmer hints, gruff stress, and performance texture.'],
    ['Body / Depth','resonance',0,10,5.5,'Fullness, formant scale, chest/body feel.'],
    ['Speech Style','formality',0,10,5.5,'Formality, articulation, and carefulness.'],
    ['Vowel Flow','vowelFlow',0,10,5,'Clipped versus stretched vowels.'],
    ['Consonant Bite','consonantBite',0,10,5,'Soft versus sharp consonants.'],
    ['Mouth Shape','mouthShape',0,10,5,'Closed/open mouth feel.'],
    ['Nasal Color','nasality',0,10,5,'Oral versus nasal color.'],
    ['Throat Depth','throatDepth',0,10,5,'Forward versus back/throaty resonance.'],
    ['Speech Rhythm','rhythm',0,10,5,'Even versus bouncy cadence.'],
    ['Pause Space','pauseControl',0,10,5,'Tight versus spacious phrase timing.'],
    ['Word Emphasis','emphasis',0,10,5,'Gentle versus strong stress.'],
    ['Warmth','warmth',0,10,5,'Cool versus warm delivery.'],
    ['Clarity','clarity',0,10,6,'Muttered versus clear articulation.'],
    ['Projection','projection',0,10,5,'Quiet/private versus projected/outward.'],
    ['Human Variation','humanVariation',0,10,5,'Mechanical steadiness versus lifelike micro-variation.'],
    ['Accent Color','accentColor',0,10,7,'Removes or strengthens accent mouth-feel.']
  ];
  S.DEFAULT_TRAITS = Object.fromEntries(S.TRAITS.map(t => [t[1], t[4]]));
  S.INFLUENCES = [
    ['Race / Ancestry Influence','influenceRace',0,100,100],
    ['Gender Identity Influence','influenceGender',0,100,100],
    ['Personality Influence','influencePersonality',0,100,100],
    ['Accent Strength / Remove Accent','influenceBiome',0,100,100],
    ['Uploaded / Recorded Voice Influence','influenceBaseAudio',0,100,45],
    ['Emotion Strength','emotionIntensity',0,100,75]
  ];
  S.ALIGNMENT_AXES = [
    ['Altruism','axisAltruism',0,3000,1500],
    ['Lawfulness','axisLawfulness',0,3000,1500],
    ['Cooperation','axisCooperation',0,3000,1500],
    ['Honor','axisHonor',0,3000,1500]
  ];
  S.MATH_HINTS = {sourceFilter:true,formants:true,stft:true,mel:true,lpc:true,psola:true,vocoder:true,jitterShimmer:true,prosody:true,emotionCurves:true,accentPhonemeColoring:true};
  S.state = {
    resources:{biomes:[],races:[],classes:[],genders:[],emotions:[],math:null},
    loadedFrom:'not loaded', profiles:[], selectedIndex:-1, referenceAudioName:'', lastParsedRows:[]
  };
  S.JSON_FILES = {
    biome:'biome-accent-profiles.json', race:'race-voice-overlays.json', class:'class-subclass-voice-overlays.json', gender:'gender-identity-voice-overlays.json', emotion:'emotion-voice-profiles.json', defaultProfile:'scanner-default-profile.json', math:'speech-math-manifest.json', samples:'sample-npcs.json'
  };
  S.fuzzyScore = function(query, candidate, extra = ''){
    const q = S.norm(query), c = S.norm(candidate), e = S.norm(extra);
    if(!q || !c) return 0;
    if(q === c) return 1;
    if(c.includes(q) || q.includes(c)) return 0.92;
    const qt = new Set(q.split(' ').filter(Boolean));
    const ct = new Set((c + ' ' + e).split(' ').filter(Boolean));
    let hits = 0;
    qt.forEach(t => { if(ct.has(t) || [...ct].some(x => x.includes(t) || t.includes(x))) hits++; });
    return hits / Math.max(1, qt.size);
  };
  S.bestMatch = function(query, items, getName, getExtra = () => ''){
    let best = null, score = 0;
    for(const item of items || []){
      const s = S.fuzzyScore(query, getName(item), getExtra(item));
      if(s > score){ best = item; score = s; }
    }
    return {item: score >= 0.34 ? best : null, score};
  };
  S.blankProfile = function(){
    return {
      schemaVersion:S.VERSION, source:S.SOURCE,
      character:{name:'',race:'',lineage:'',bloodline:'',class:'',subclass:'',genderIdentity:'',biome:'',settlementType:'',personalityText:'',emotion:'Neutral / Base'},
      voice:{fantasyAccent:'',baseAccentInspiration:'',baseAccentVisibleToPlayer:false,traits:{...S.DEFAULT_TRAITS},influences:S.currentInfluences ? S.currentInfluences() : Object.fromEntries(S.INFLUENCES.map(x=>[x[1],x[4]])),alignmentAxes:S.currentAlignment ? S.currentAlignment() : Object.fromEntries(S.ALIGNMENT_AXES.map(x=>[x[1],x[4]])),mathHints:{...S.MATH_HINTS},exportNotes:[]}
    };
  };
  S.applyOverlay = function(traits, overlay, influencePercent, strength = 1, trace, label){
    if(!overlay) return;
    const amt = S.clamp(influencePercent,0,100) / 100 * strength;
    const touched = [];
    for(const k of Object.keys(S.DEFAULT_TRAITS)){
      if(typeof overlay[k] !== 'number') continue;
      traits[k] += (overlay[k] - S.DEFAULT_TRAITS[k]) * amt;
      touched.push(k);
    }
    trace?.push({layer:label, kind:'overlay-from-default', influencePercent, strength, appliedAmount:Number(amt.toFixed(3)), parameterCount:touched.length});
  };
  S.applyDelta = function(traits, delta, influencePercent, strength = 1, trace, label){
    if(!delta) return;
    const amt = S.clamp(influencePercent,0,100) / 100 * strength;
    const touched=[];
    for(const [k,v] of Object.entries(delta)){
      if(!(k in S.DEFAULT_TRAITS) || !Number.isFinite(Number(v))) continue;
      traits[k] += Number(v) * amt;
      touched.push(k);
    }
    trace?.push({layer:label, kind:'delta', influencePercent, strength, appliedAmount:Number(amt.toFixed(3)), parameterCount:touched.length});
  };
  S.naturalnessGuard = function(traits, warnings){
    for(const k of Object.keys(S.DEFAULT_TRAITS)) traits[k] = S.clamp(traits[k],0,10);
    if(traits.pitch > 8.7 && traits.speed > 8 && traits.inflection > 8){ traits.pitch = 8.4; traits.speed = 7.8; traits.inflection = 7.9; warnings.push('Naturalness guard softened very high pitch + speed + inflection.'); }
    if(traits.pitch < 1.3 && traits.roughness > 8 && traits.clarity < 3){ traits.roughness = 7.4; traits.clarity = 3.4; warnings.push('Naturalness guard preserved intelligibility for very low, rough speech.'); }
    if(traits.stutter > 7){ traits.stutter = 7; warnings.push('Hesitations were capped so the voice remains readable.'); }
    if(traits.accentColor > 9.4){ traits.accentColor = 9.4; warnings.push('Accent color was capped to avoid parody-text distortion.'); }
    return Object.fromEntries(Object.entries(traits).map(([k,v]) => [k, Number(v.toFixed(3))]));
  };
  S.engineFromTraits = function(t){
    return {
      webSpeechRate:Number(S.clamp(0.55 + (t.speed/10)*0.9 - (t.pauseControl-5)*0.018,0.5,1.55).toFixed(2)),
      webSpeechPitch:Number(S.clamp(0.58 + (t.pitch/10)*1.15 - (t.resonance-5)*0.025,0.5,2.0).toFixed(2)),
      webSpeechVolume:Number(S.clamp(0.55 + (t.projection/10)*0.45,0.35,1).toFixed(2)),
      phrasePauseBias:Number(((t.pauseControl-5)/5).toFixed(2)),
      punctuationWeight:Number(((t.emphasis+t.formality)/20).toFixed(2)),
      formantHint:Number((0.9 + (t.resonance-5)*0.025 + (t.mouthShape-5)*0.01).toFixed(3)),
      jitterShimmerHint:Number(((t.roughness+t.humanVariation)/20).toFixed(3))
    };
  };
})();
