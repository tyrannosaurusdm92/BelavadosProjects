/* Belavadös Voice Studio - resource-informed humanization engine
   Uses derived feature metadata from the user's supplied media/JSON packs. It does not embed original audio. */
(() => {
  'use strict';
  const refs = () => window.BELAVADOS_VOICE_HUMANIZATION_REFERENCES || {};
  const speechPack = () => window.BELAVADOS_SPEECH_PATTERN_PACK || {};
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(+n)?+n:min));
  const norm = s => String(s||'').toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9]+/g,' ').trim();
  const round = (n,d=3)=>Number.isFinite(+n)?+(+n).toFixed(d):0;

  const BIOME_KEYS = [
    ['ocean_surface','ocean surface floating settlement','tidecrest cant','tidecrest','ocean surface'],
    ['underwater_reefs','underwater with reefs','reefglass lilt','reefglass','reef'],
    ['underwater_open','underwater without reefs','deepcurrent song','deepcurrent','open ocean'],
    ['grassland','grassland','plainwind common','plainwind'],
    ['prairie','prairie','ironstep cant','ironstep'],
    ['farming','farming','hearthfield brogue','hearthfield','farm'],
    ['mountain','mountain range','cragthane burr','cragthane','mountain'],
    ['valley','valley','vinesong flow','vinesong'],
    ['deep_cavern','deep cavern','stonehollow echo','stonehollow','cavern'],
    ['deep_forest','deep forest','rootmere cant','rootmere'],
    ['partial_forest','partial forest','sundapple tongue','sundapple'],
    ['treetops','treetops treehouses','treetops / treehouses','highbranch lilt','highbranch'],
    ['marsh','marshes and swamps','mirecurl drawl','mirecurl','swamp'],
    ['beach_grass_water','beach and grass with water','brightshore flow','brightshore'],
    ['beach_reefs_water','beach and reefs with water','wavebloom welcome','wavebloom'],
    ['hybrid_tree_forest_floor','hybrid tree and forest floor','bramblewood burr','bramblewood'],
    ['hybrid_farming_forest_grassland','hybrid farming forest grassland','millfield practical','millfield']
  ];
  const normalizeBiome = value => {
    const v=norm(value);
    if(!v) return 'none';
    for (const row of BIOME_KEYS) if (row.slice(1).some(a=>v===norm(a)||v.includes(norm(a)))) return row[0];
    return v.replace(/\s+/g,'_');
  };
  const biomeNameToAverageKey = key => ({
    ocean_surface:'ocean surface floating settlement', underwater_reefs:'underwater with reefs', underwater_open:'underwater without reefs', grassland:'grassland', prairie:'prairie', farming:'farming', mountain:'mountain range', valley:'valley', deep_cavern:'deep cavern', deep_forest:'deep forest', partial_forest:'partial forest', treetops:'treetops / treehouses', marsh:'marshes and swamps', beach_grass_water:'beach and grass with water', beach_reefs_water:'beach and reefs with water', hybrid_tree_forest_floor:'hybrid tree and forest floor', hybrid_farming_forest_grassland:'hybrid farming forest grassland'
  }[key] || String(key||'').replace(/_/g,' '));

  const WORDS = {
    common: [
      [/\bi am\b/gi,'I am'],[/\bi'm\b/gi,'I am'],[/\bgoing to\b/gi,'gonna'],[/\bcannot\b/gi,'can not'],[/\bdanger\b/gi,'dayn-jer'],[/\bserve\b/gi,'serve'],[/\bvoice\b/gi,'voice'],[/\bbot\b/gi,'bot']
    ],
    Tidecrest: [[/\bthis\b/gi,'dees'],[/\bthat\b/gi,'dat'],[/\bthe\b/gi,'de'],[/\bwhat\b/gi,'wot'],[/\bsound\b/gi,'sownd'],[/\bvoice\b/gi,'voyce'],[/\blike\b/gi,'lyke'],[/\bserve\b/gi,'serrv'],[/ing\b/gi,'een']],
    Reefglass: [[/\bthis\b/gi,'thi-su'],[/\bthat\b/gi,'za-tu'],[/\bwhat\b/gi,'wa-tu'],[/\bsound\b/gi,'soun-do'],[/\bvoice\b/gi,'voisu'],[/\blike\b/gi,'rai-ku'],[/\bserve\b/gi,'seru'],[/\bbot\b/gi,'bot-to']],
    Deepcurrent: [[/\bthis\b/gi,'thiiis'],[/\bthat\b/gi,'thaat'],[/\bwhat\b/gi,'whaat'],[/\bsound\b/gi,'saound'],[/\bvoice\b/gi,'vooice'],[/\blike\b/gi,'laaike'],[/\bserve\b/gi,'suurve']],
    Plainwind: [],
    Ironstep: [[/\bthis\b/gi,'zis'],[/\bthat\b/gi,'zat'],[/\bthe\b/gi,'ze'],[/\bwhat\b/gi,'vhat'],[/\bsound\b/gi,'saund'],[/\bvoice\b/gi,'vois'],[/\blike\b/gi,'laik'],[/\bwith\b/gi,'vit'],[/w/gi,'v']],
    Hearthfield: [[/\bmy\b/gi,'me'],[/\bthis\b/gi,'thish'],[/\bwhat\b/gi,'whut'],[/\bsound\b/gi,'sownd'],[/\bvoice\b/gi,'voyce'],[/\blike\b/gi,'loik'],[/\bserve\b/gi,'sarve'],[/ing\b/gi,"in'"]],
    Cragthane: [[/\bwhat\b/gi,'whaht'],[/\bsound\b/gi,'soond'],[/\bvoice\b/gi,'voys'],[/\blike\b/gi,'lahk'],[/\bout\b/gi,'oot'],[/\babout\b/gi,'aboot']],
    Vinesong: [[/\bthis\b/gi,'thees'],[/\bwhat\b/gi,'whaht-a'],[/\bsound\b/gi,'sown-da'],[/\bvoice\b/gi,'vo-cheh'],[/\blike\b/gi,'lee-keh'],[/\bserve\b/gi,'ser-veh'],[/\bbot\b/gi,'bot-a']],
    Stonehollow: [[/\bi\b/gi,'aye'],[/\bthis\b/gi,'thys'],[/\bwhat\b/gi,'wot'],[/\bsound\b/gi,'sownd'],[/\bvoice\b/gi,'voys'],[/\blike\b/gi,'liek'],[/\bserve\b/gi,'serv']],
    Rootmere: [[/\bthis\b/gi,'zis'],[/\bthat\b/gi,'zat'],[/\bthe\b/gi,'ze'],[/\bwhat\b/gi,'vhat'],[/\bsound\b/gi,'zound'],[/\bvoice\b/gi,'foyce'],[/\bwith\b/gi,'vit']],
    Sundapple: [[/\bthis\b/gi,'dis'],[/\bthat\b/gi,'dat'],[/\bthe\b/gi,'de'],[/\bwhat\b/gi,'wat'],[/\bsound\b/gi,'soun'],[/\bvoice\b/gi,'boice'],[/\blike\b/gi,'likeh'],[/\bserve\b/gi,'ser-veh']],
    Highbranch: [[/\bthis\b/gi,'zees'],[/\bthat\b/gi,'zat'],[/\bthe\b/gi,'ze'],[/\bwhat\b/gi,'whaat'],[/\bsound\b/gi,'sahnd'],[/\bvoice\b/gi,'vwaas'],[/\blike\b/gi,'leek'],[/\bserve\b/gi,'sehrv']],
    Mirecurl: [[/\bthis\b/gi,'dis'],[/\bthat\b/gi,'dat'],[/\bwhat\b/gi,'whaat'],[/\bsound\b/gi,'sowwn'],[/\bvoice\b/gi,'vawce'],[/\blike\b/gi,'lahk'],[/\bserve\b/gi,'suhv'],[/ing\b/gi,"in'"]],
    Brightshore: [[/\bthis\b/gi,'dees'],[/\bthat\b/gi,'dat'],[/\bwhat\b/gi,'wot'],[/\bsound\b/gi,'sownd'],[/\bvoice\b/gi,'voy-see'],[/\blike\b/gi,'lykee'],[/\bserve\b/gi,'ser-vee']],
    Wavebloom: [[/\bthis\b/gi,'dis'],[/\bthat\b/gi,'dat'],[/\bwhat\b/gi,'wah'],[/\bsound\b/gi,'saound'],[/\bvoice\b/gi,'vohice'],[/\blike\b/gi,'laike'],[/\bserve\b/gi,'surve']],
    Bramblewood: [[/\bthis\b/gi,'thes'],[/\bwhat\b/gi,'wot'],[/\bsound\b/gi,'zound'],[/\bvoice\b/gi,'voize'],[/\blike\b/gi,'loike'],[/\bserve\b/gi,'sarve'],[/ing\b/gi,"in'"]],
    Millfield: [[/\bthis\b/gi,'dis'],[/\bwhat\b/gi,'vot'],[/\bsound\b/gi,'sound'],[/\bvoice\b/gi,'voice'],[/\blike\b/gi,'like'],[/\bserve\b/gi,'serve']]
  };

  const styleKey = accent => String(accent?.name || 'Plainwind').split(/\s+/)[0] || 'Plainwind';
  const keepCase = (original, replacement) => /^[A-Z]/.test(original) ? replacement.charAt(0).toUpperCase()+replacement.slice(1) : replacement;
  const applyRules = (text, rules, amount) => {
    let out = String(text||'');
    if (!rules || amount <= .06) return out;
    rules.forEach(([re,to]) => { out = out.replace(re, m => keepCase(m, to)); });
    return out;
  };
  const softenOrStrengthenByOverlay = (text, accent={}, amount=1) => {
    let out = text;
    const race = String(accent.raceOverlay||'').toLowerCase();
    const cls = String(accent.classOverlay||'').toLowerCase();
    if (amount > .45) {
      if (/elf/.test(race)) out = out.replace(/\b([a-z]{5,})\b/gi, m => m.replace(/t(?!h)/gi,'t').replace(/r\b/gi,''));
      if (/dwarf/.test(race)) out = out.replace(/\b(very|really|quite)\b\s*/gi,'').replace(/\bI am\b/gi,'I am').replace(/[.!?]*$/,' .');
      if (/orc/.test(race)) out = out.replace(/\bI am\b/gi,'I AM').replace(/\bserve\b/gi,'SERVE').replace(/[.!?]*$/,'!');
      if (/aquatic/.test(race)) out = out.replace(/\bvoice\b/gi,'vooice').replace(/\bsound\b/gi,'saound');
      if (/halfling/.test(race)) out = out.replace(/\bI am\b/gi,'I am, friend,');
      if (/beast/.test(race)) out = out.replace(/\bthis is\b/gi,'this, this is');
    }
    if (amount > .62) {
      if (/rogue/.test(cls)) out = out.replace(/[.!?]*$/,'...');
      else if (/warrior/.test(cls)) out = out.replace(/[.!?]*$/,'!');
      else if (/cleric|priest/.test(cls)) out = out.replace(/[.!?]*$/,'...');
      else if (/bard/.test(cls)) out = out.replace(/[.!?]*$/,'!');
      else if (/mage|scholar/.test(cls)) out = out.replace(/[!?]+$/,'.');
    }
    return out;
  };

  const addGentleMouthShape = (text, style, amount) => {
    if (amount < .75) return text;
    const open = ['Vinesong','Brightshore','Reefglass','Wavebloom'].includes(style);
    const clipped = ['Cragthane','Ironstep','Rootmere','Millfield'].includes(style);
    const drawn = ['Deepcurrent','Mirecurl','Stonehollow'].includes(style);
    return text.split(/(\s+)/).map(tok => {
      if (!/[A-Za-z]{4,}/.test(tok)) return tok;
      if (drawn) return tok.replace(/([aeiou])([bcdfghjklmnpqrstvwxz]*)$/i, (m,v,c)=>v+v+c);
      if (open && !/[aeiou]$/i.test(tok) && tok.length < 8) return tok + '-a';
      if (clipped) return tok.replace(/([aeiou]{2,})/gi, m=>m[0]);
      return tok;
    }).join('');
  };

  const humanizeAccentText = (text='', accent=null, profile={}, opts={}) => {
    let phrase = String(text||'this is what I sound like').replace(/\s+/g,' ').trim() || 'this is what I sound like';
    if (!accent || accent.biomeKey === 'none') return phrase;
    const amount = clamp(opts.influence ?? accent.influence ?? 100, 0, 100)/100;
    if (amount < .05) return phrase;
    const style = styleKey(accent);
    const rules = (amount > .30 ? WORDS[style] : []).concat(amount > .82 ? [] : []);
    phrase = applyRules(phrase, rules, amount);
    phrase = addGentleMouthShape(phrase, style, amount);
    phrase = softenOrStrengthenByOverlay(phrase, accent, amount);
    return phrase.replace(/\s+/g,' ').replace(/\s+([,.!?;:])/g,'$1').trim();
  };

  const referenceFor = (npc={}, accent=null) => {
    const data = refs(); const avgs=data.biomeFeatureAverages||{};
    const key = normalizeBiome(accent?.biomeKey || accent?.biome || npc.biome || npc.regionBiome || '');
    const avgKey = biomeNameToAverageKey(key);
    let avg = avgs[avgKey] || avgs[norm(avgKey)] || null;
    const audio = data.audioReferences || [];
    const nRace=norm(npc.race||npc.ancestry||npc.species); const nClass=norm(npc.class||npc.primaryClass); const nGender=norm(npc.genderIdentity||npc.gender);
    let best=null, score=-1;
    audio.forEach(a=>{
      let s=0;
      if (normalizeBiome(a.biome) === key) s += 8;
      if (nRace && norm(a.race).includes(nRace.split(' ')[0])) s += 2;
      if (nClass && norm(a.class).includes(nClass.split(' ')[0])) s += 2;
      if (nGender && norm(a.genderIdentity).includes(nGender.split(' ')[0])) s += 1;
      if (s>score && a.feature && !a.feature.error) { score=s; best=a; }
    });
    return { biomeKey:key, biomeAverage:avg, closestAudioReference:best, confidence:score>0?score:0, resourceCounts:data.resourceCounts||{} };
  };

  const controlsFor = (profile={}, opts={}) => {
    const p = +profile.pitch || 5, sp = +profile.speed || 5, infl = +profile.inflection || 5, res = +profile.resonance || 5, formal = +profile.formality || 5;
    const ref = opts.reference || referenceFor(opts.npc||{}, opts.biomeAccent||null);
    const avg = ref.biomeAverage || {};
    // Browser speech gets metallic when pitch is extreme. Carry identity through voice choice, accent text, cadence, and safer pitch values.
    let pitch = 1.0 + (p - 5) * 0.010 + (infl - 5) * 0.002 - Math.max(0,res-6)*0.003;
    if (p < 3.2) pitch = 0.972 + (p - 3.2) * 0.004;       // deep but not robotic
    if (p > 7.2) pitch = 1.036 + (p - 7.2) * 0.006;      // bright but not chipmunk/robotic
    if (avg.f0MedianHz) {
      if (avg.f0MedianHz < 130) pitch -= 0.015;
      if (avg.f0MedianHz > 205) pitch += 0.010;
    }
    pitch = clamp(pitch, 0.955, 1.075);
    let rate = 0.96 + (sp - 5) * 0.030 + (formal - 5) * -0.006;
    if (avg.onsetRatePerSecond) rate += clamp((avg.onsetRatePerSecond - 2.05) * 0.035, -0.035, 0.035);
    if (opts.emotionKey === 'exhaustion' || opts.emotionKey === 'grief') rate -= .035;
    if (opts.emotionKey === 'panic' || opts.emotionKey === 'excitement') rate += .035;
    rate = clamp(rate, 0.84, 1.15);
    const volume = clamp((opts.volume ?? .96) - Math.max(0,+profile.breath-6)*.010 + Math.max(0,+profile.roughness-7)*.006, .68, 1);
    return { pitch:round(pitch), rate:round(rate), volume:round(volume), reference:ref };
  };

  const cadenceFor = (profile={}, opts={}) => {
    const ref = opts.reference || referenceFor(opts.npc||{}, opts.biomeAccent||null);
    const avg = ref.biomeAverage || {};
    const p = +profile.pitch || 5, inf = +profile.inflection || 5, hes=+profile.stutter||0;
    return {
      humanized:true,
      chunkAggression: hes > 5 ? .42 : .08,
      phraseWords: Math.round(clamp(22 + (5-hes)*1.8 + (5-Math.abs(p-5))*0.4, 18, 36)),
      pauseMs: Math.round(clamp(90 + hes*12 + (avg.pauseFractionApprox ? (avg.pauseFractionApprox-.42)*240 : 0), 45, 230)),
      pitchSwing: round(clamp(.018 + inf*.004 + (avg.pitchRangeSemitones||0)*.0012, .018, .075)),
      rateSwing: round(clamp(.018 + inf*.003, .015, .055)),
      reference: ref
    };
  };

  const profileNudgeFromSpeechPatterns = (profile={}, npc={}, influences={}) => {
    const out = {...profile}; const pack=speechPack();
    const raceInfluence = clamp(influences.race ?? 100, 0, 100)/100;
    const genderInfluence = clamp(influences.gender ?? 100, 0, 100)/100;
    // Keep this intentionally gentle. It avoids the "slider fights the browser" problem.
    const raceText = norm(npc.race||npc.ancestry||'');
    if (raceInfluence > 0) {
      if (/dwarf|duergar|goliath|warforged/.test(raceText)) { out.pitch = clamp((out.pitch||5)-.18*raceInfluence,0,10); out.resonance=clamp((out.resonance||5)+.28*raceInfluence,0,10); }
      if (/elf|eladrin|drow/.test(raceText)) { out.inflection=clamp((out.inflection||5)+.18*raceInfluence,0,10); out.roughness=clamp((out.roughness||5)-.16*raceInfluence,0,10); }
      if (/orc|goblin|hobgoblin|dragonborn|genasi/.test(raceText)) { out.roughness=clamp((out.roughness||5)+.22*raceInfluence,0,10); out.resonance=clamp((out.resonance||5)+.18*raceInfluence,0,10); }
      if (/halfling|kender|gnome/.test(raceText)) { out.speed=clamp((out.speed||5)+.16*raceInfluence,0,10); out.pitch=clamp((out.pitch||5)+.15*raceInfluence,0,10); }
    }
    const genderText = norm(npc.genderIdentity||npc.gender||'');
    if (genderInfluence > 0) {
      if (/male|masc/.test(genderText) && !/female/.test(genderText)) out.pitch=clamp((out.pitch||5)-.12*genderInfluence,0,10);
      if (/female|femme/.test(genderText)) out.pitch=clamp((out.pitch||5)+.12*genderInfluence,0,10);
      if (/non binary|agender|fluid|flexible|neutrois|poly gender|bi gender/.test(genderText)) out.inflection=clamp((out.inflection||5)+.10*genderInfluence,0,10);
    }
    return out;
  };

  const describeReference = (npc={}, accent=null) => {
    const r=referenceFor(npc, accent), avg=r.biomeAverage||{}, closest=r.closestAudioReference||{};
    return { resourceCounts:{...(r.resourceCounts||{}), referenceAudioLearning: window.BELAVADOS_REFERENCE_AUDIO_LEARNING?.overall || null}, biomeKey:r.biomeKey, confidence:r.confidence, averagedReference:avg, closestVoiceExample: closest.npc ? { npc:closest.npc, biome:closest.biome, race:closest.race, class:closest.class, genderIdentity:closest.genderIdentity, features:closest.feature } : null };
  };

  window.BelavadosVoiceHumanization = { normalizeBiome, referenceFor, controlsFor, cadenceFor, humanizeAccentText, profileNudgeFromSpeechPatterns, describeReference };
})();
