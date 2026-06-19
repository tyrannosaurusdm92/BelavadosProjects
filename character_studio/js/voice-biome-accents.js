/* Belavadös Voice Studio - math-applied fantasy biome accents. Real-world source labels stay out of the UI. */
(() => {
  'use strict';
  const clamp = (n,min,max)=>Math.max(min,Math.min(max,Number.isFinite(+n)?+n:min));
  const APPLIED_BIOMES = [
  {
    "key": "ocean_surface",
    "mathKey": "ocean_surface_floating_settlement_portuguese_inspired",
    "biome": "Ocean Surface Floating Settlement",
    "name": "Tidecrest Cant",
    "feel": "Open, rolling, maritime, lively.",
    "voiceLangHints": [
      "pt-PT",
      "pt-BR",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 1.02,
      "rhoticityTargetDelta": 0.35,
      "nasalityDelta": 0.35,
      "legatoDelta": 0.22,
      "consonantForceDelta": 0.05,
      "gutturalResonanceDelta": 0.05,
      "pitchRangeSemitonesDelta": 1.4,
      "finalDevoicingDelta": 0.05
    },
    "rules": [
      "N_i=0.45 for nasal vowels, 0.10 otherwise",
      "D_i'=D_i[1+0.28S_i-0.12(1-S_i)]",
      "F0(t)=F0+1.4 sin(2*pi*0.55t+phi)"
    ]
  },
  {
    "key": "underwater_reefs",
    "mathKey": "underwater_with_reefs_japanese_inspired",
    "biome": "Underwater With Reefs",
    "name": "Reefglass Lilt",
    "feel": "Graceful, clear, flowing, elegant.",
    "voiceLangHints": [
      "ja-JP",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 0.96,
      "rhoticityTargetDelta": 0.05,
      "nasalityDelta": 0.05,
      "legatoDelta": 0.3,
      "consonantForceDelta": -0.08,
      "pitchRangeSemitonesDelta": 1.1,
      "pitchAccentDelta": 0.8
    },
    "rules": [
      "D_mu'=(1-tau)D_mu+tau*Dbar_mu, tau=0.75",
      "F0(mu_i)=H for i<=k and L for i>k",
      "L+=0.20; D_vowel*=1.08"
    ]
  },
  {
    "key": "underwater_open",
    "mathKey": "underwater_without_reefs_thai_inspired",
    "biome": "Underwater Without Reefs",
    "name": "Deepcurrent Song",
    "feel": "Quiet, deep, rhythmic, mysterious.",
    "voiceLangHints": [
      "th-TH",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 1.08,
      "rhoticityTargetDelta": 0.05,
      "nasalityDelta": 0.08,
      "legatoDelta": 0.38,
      "consonantForceDelta": -0.05,
      "pitchRangeSemitonesDelta": 1.8,
      "toneStrengthDelta": 0.85
    },
    "rules": [
      "F0(t)=F_base+T_k(t)",
      "T_rise(t)=a*t/T; T_fall(t)=a*(1-t/T); T_dip(t)=a*cos(2*pi*t/T)",
      "D_long=1.65*D_short"
    ]
  },
  {
    "key": "grassland",
    "mathKey": "grassland_general_american_midwest_inspired",
    "biome": "Grassland",
    "name": "Plainwind Common",
    "feel": "Broad, open, easygoing.",
    "voiceLangHints": [
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 1.0,
      "rhoticityTargetDelta": 0.95,
      "nasalityDelta": 0.05,
      "legatoDelta": 0.05,
      "consonantForceDelta": 0.0,
      "gutturalResonanceDelta": 0.0,
      "pitchRangeSemitonesDelta": 0.8
    },
    "rules": [
      "r_out=0.95r",
      "D_i'=D_i[1+0.18S_i-0.08(1-S_i)]"
    ]
  },
  {
    "key": "prairie",
    "mathKey": "prairie_russian_inspired",
    "biome": "Prairie",
    "name": "Ironstep Cant",
    "feel": "Strong, wide, grounded, hardy.",
    "voiceLangHints": [
      "ru-RU",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 1.04,
      "rhoticityTargetDelta": 0.25,
      "nasalityDelta": 0.05,
      "legatoDelta": -0.05,
      "consonantForceDelta": 0.22,
      "gutturalResonanceDelta": 0.22,
      "pitchRangeSemitonesDelta": 1.0,
      "finalDevoicingDelta": 0.2
    },
    "rules": [
      "F_unstressed'=F_central+0.45(F_target-F_central)",
      "C_i'=C_i+lambda_j[j], lambda_j=0.4"
    ]
  },
  {
    "key": "farming",
    "mathKey": "farming_irish_inspired",
    "biome": "Farming",
    "name": "Hearthfield Brogue",
    "feel": "Friendly, earthy, communal, homely.",
    "voiceLangHints": [
      "en-IE",
      "en-GB",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 0.98,
      "rhoticityTargetDelta": 0.55,
      "nasalityDelta": 0.04,
      "legatoDelta": 0.25,
      "consonantForceDelta": 0.03,
      "pitchRangeSemitonesDelta": 1.7
    },
    "rules": [
      "F0(t)=F0+1.5 sin(2*pi*f_lilt*t)",
      "optional /theta, eth/->[t_d,d_d] with P=0.25"
    ]
  },
  {
    "key": "mountain_range",
    "mathKey": "mountain_range_scottish_inspired",
    "biome": "Mountain Range",
    "name": "Cragthane Burr",
    "feel": "Tough, crisp, resilient.",
    "voiceLangHints": [
      "en-GB",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 0.94,
      "rhoticityTargetDelta": 0.95,
      "nasalityDelta": 0.03,
      "legatoDelta": -0.05,
      "consonantForceDelta": 0.28,
      "gutturalResonanceDelta": 0.12,
      "pitchRangeSemitonesDelta": 0.9
    },
    "rules": [
      "D_V'=1.35D_V before r/v/z/eth or morpheme boundary; otherwise 0.85D_V",
      "E_final'=E_final+0.12"
    ]
  },
  {
    "key": "valley",
    "mathKey": "valley_italian_inspired",
    "biome": "Valley",
    "name": "Vinesong Flow",
    "feel": "Flowing, fertile, elegant, soft.",
    "voiceLangHints": [
      "it-IT",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 1.0,
      "rhoticityTargetDelta": 0.2,
      "nasalityDelta": 0.04,
      "legatoDelta": 0.28,
      "consonantForceDelta": 0.08,
      "pitchRangeSemitonesDelta": 2.1,
      "geminationDelta": 0.45
    },
    "rules": [
      "D_C'=D_C(1+0.45)",
      "F1'=1.08F1",
      "R_F0'=R_F0+2.1"
    ]
  },
  {
    "key": "deep_cavern",
    "mathKey": "deep_cavern_welsh_inspired",
    "biome": "Deep Cavern",
    "name": "Stonehollow Echo",
    "feel": "Echoing, ancient, carved-from-stone.",
    "voiceLangHints": [
      "en-GB",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 1.05,
      "rhoticityTargetDelta": 0.45,
      "nasalityDelta": 0.04,
      "legatoDelta": 0.18,
      "consonantForceDelta": 0.1,
      "gutturalResonanceDelta": 0.2,
      "pitchRangeSemitonesDelta": 2.0
    },
    "rules": [
      "F0(t)=F0+A sin(2*pi*f*t)+B sin(4*pi*f*t), A=1.4, B=0.5",
      "rho_F=0.94",
      "x'(t)=x(t)+0.12x(t-60ms)"
    ]
  },
  {
    "key": "deep_forest",
    "mathKey": "deep_forest_german_inspired",
    "biome": "Deep Forest",
    "name": "Rootmere Cant",
    "feel": "Dense, structured, rooted, authoritative.",
    "voiceLangHints": [
      "de-DE",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 0.98,
      "rhoticityTargetDelta": 0.35,
      "nasalityDelta": 0.03,
      "legatoDelta": -0.08,
      "consonantForceDelta": 0.3,
      "gutturalResonanceDelta": 0.25,
      "pitchRangeSemitonesDelta": 0.75,
      "finalDevoicingDelta": 0.8
    },
    "rules": [
      "voice_final'=voice_final(1-0.80)",
      "G+=0.25",
      "E_i'=E_i[1+0.30S_i]"
    ]
  },
  {
    "key": "partial_forest",
    "mathKey": "partial_forest_spanish_inspired",
    "biome": "Partial Forest",
    "name": "Sundapple Tongue",
    "feel": "Flexible, social, sun-dappled, active.",
    "voiceLangHints": [
      "es-ES",
      "es-MX",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 0.97,
      "rhoticityTargetDelta": 0.3,
      "nasalityDelta": 0.03,
      "legatoDelta": 0.22,
      "consonantForceDelta": 0.07,
      "pitchRangeSemitonesDelta": 1.6,
      "timingEqualizationDelta": 0.75
    },
    "rules": [
      "D_sigma'=(1-0.75)D_sigma+0.75Dbar_sigma",
      "V in {a,e,i,o,u}; F_i=canonical_i",
      "F0(t)=F0+1.2 sin(2*pi*0.7t)"
    ]
  },
  {
    "key": "treetops",
    "mathKey": "treetops_french_inspired",
    "biome": "Treetops / Treehouses",
    "name": "Highbranch Lilt",
    "feel": "Light, elevated, refined, airy.",
    "voiceLangHints": [
      "fr-FR",
      "fr-CA",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 1.03,
      "rhoticityTargetDelta": 0.15,
      "nasalityDelta": 0.32,
      "legatoDelta": 0.42,
      "consonantForceDelta": -0.12,
      "gutturalResonanceDelta": 0.12,
      "pitchRangeSemitonesDelta": 1.4
    },
    "rules": [
      "P(liaison)=sigmoid(w1*Formal+w2*VowelStart-w3*Casual)",
      "N_i=0.45 for nasal vowels, 0.05 otherwise",
      "r_alveolar->r_uvular; G+=0.12"
    ]
  },
  {
    "key": "marsh_swamp",
    "mathKey": "marshes_swamps_louisiana_cajun_creole_inspired",
    "biome": "Marshes and Swamps",
    "name": "Mirecurl Drawl",
    "feel": "Slow, earthy, wet, lived-in.",
    "voiceLangHints": [
      "en-US",
      "fr-FR"
    ],
    "vector": {
      "durationMultiplier": 1.08,
      "rhoticityTargetDelta": 0.35,
      "nasalityDelta": 0.1,
      "legatoDelta": 0.3,
      "consonantForceDelta": 0.1,
      "gutturalResonanceDelta": 0.1,
      "pitchRangeSemitonesDelta": 1.3
    },
    "rules": [
      "/theta,eth/->[t,d] with P=0.55",
      "C1C2->C1 with P=0.20",
      "D_phrase-final'=1.18D_phrase-final"
    ]
  },
  {
    "key": "beach_grass_water",
    "mathKey": "beach_grass_water_brazilian_portuguese_inspired",
    "biome": "Beach and Grass with Water",
    "name": "Brightshore Flow",
    "feel": "Warm, coastal, bright, casual.",
    "voiceLangHints": [
      "pt-BR",
      "pt-PT",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 0.99,
      "rhoticityTargetDelta": 0.25,
      "nasalityDelta": 0.38,
      "legatoDelta": 0.35,
      "consonantForceDelta": 0.03,
      "pitchRangeSemitonesDelta": 1.8
    },
    "rules": [
      "N(t)=0.42(t/T)^1.5",
      "F2'=1.04F2",
      "F0(t)=F0+1.5 sin(2*pi*0.6t)"
    ]
  },
  {
    "key": "beach_reefs_water",
    "mathKey": "beach_reefs_hawaiian_english_hawaii_creole_inspired",
    "biome": "Beach and Reefs with Water",
    "name": "Wavebloom Welcome",
    "feel": "Gentle, tropical, wave-like, welcoming.",
    "voiceLangHints": [
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 1.02,
      "rhoticityTargetDelta": 0.2,
      "nasalityDelta": 0.06,
      "legatoDelta": 0.4,
      "consonantForceDelta": -0.04,
      "pitchRangeSemitonesDelta": 1.7
    },
    "rules": [
      "F0_question(t)=F_start-a*t/T",
      "P_thstop=0.45",
      "/l/->[w,o,u] with P=0.30"
    ]
  },
  {
    "key": "hybrid_tree_forest_floor",
    "mathKey": "hybrid_tree_forest_floor_west_country_inspired",
    "biome": "Hybrid Tree and Forest Floor",
    "name": "Bramblewood Burr",
    "feel": "Rustic, layered, grounded, woodland.",
    "voiceLangHints": [
      "en-GB",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 1.04,
      "rhoticityTargetDelta": 0.9,
      "nasalityDelta": 0.04,
      "legatoDelta": 0.18,
      "consonantForceDelta": 0.05,
      "gutturalResonanceDelta": 0.05,
      "pitchRangeSemitonesDelta": 1.1
    },
    "rules": [
      "r_out=0.90r",
      "F2'=0.94F2",
      "optional /ing/->/in/ with P=0.35"
    ]
  },
  {
    "key": "hybrid_farming_forest_grassland",
    "mathKey": "hybrid_farming_forest_grassland_dutch_inspired",
    "biome": "Hybrid Farming Forest Grassland",
    "name": "Millfield Practical",
    "feel": "Practical, mixed, industrious, balanced.",
    "voiceLangHints": [
      "nl-NL",
      "en-US"
    ],
    "vector": {
      "durationMultiplier": 0.96,
      "rhoticityTargetDelta": 0.3,
      "nasalityDelta": 0.03,
      "legatoDelta": 0.02,
      "consonantForceDelta": 0.2,
      "gutturalResonanceDelta": 0.28,
      "pitchRangeSemitonesDelta": 0.9,
      "finalDevoicingDelta": 0.7
    },
    "rules": [
      "voice_final'=voice_final(1-0.70)",
      "kappa_F'=kappa_F+0.25",
      "D_long=1.45D_short; D_functionword=0.88D_functionword"
    ]
  }
];
  const BIOMES = [{ key:'none', biome:'No regional biome accent', name:'No regional biome accent', feel:'Uses only race, gender, class, personality, alignment, and slider settings.', voiceLangHints:[], vector:{} }, ...APPLIED_BIOMES];
  const add = (profile, adj) => { const out={...profile}; Object.keys(adj||{}).forEach(k => { out[k] = clamp((+out[k] || 5) + (+adj[k] || 0), 0, 10); }); return out; };
  const scale = (adj, pct=100) => { const amt=clamp(+pct||0,0,100)/100; const out={}; Object.keys(adj||{}).forEach(k => out[k]=(+adj[k]||0)*amt); return out; };
  const mergeCadence = (...items) => { const out={}; items.filter(Boolean).forEach(c => Object.keys(c).forEach(k => { out[k] = typeof c[k]==='number' && typeof out[k]==='number' ? out[k]+c[k] : c[k]; })); return out; };
  const adjFromVector = (v={}) => ({ speed: ((v.durationMultiplier ?? 1) - 1) * -7.5, inflection: (v.pitchRangeSemitonesDelta || 0) * .42 + (v.toneStrengthDelta || 0) * .38 + (v.pitchAccentDelta || 0) * .28, breath: (v.legatoDelta || 0) * 1.1 + (v.nasalityDelta || 0) * .22, roughness: (v.gutturalResonanceDelta || 0) * 1.35 + (v.consonantForceDelta || 0) * .75 + (v.finalDevoicingDelta || 0) * .35, resonance: (v.gutturalResonanceDelta || 0) * 1.15 + (v.rhoticityTargetDelta || 0) * .25, formality: (v.consonantForceDelta || 0) * .48 + (v.pitchAccentDelta || 0) * .32 });
  const cadenceFromVector = (b={}) => { const v=b.vector||{}; const dur=v.durationMultiplier ?? 1; const leg=v.legatoDelta || 0; const force=v.consonantForceDelta || 0; const pitch=v.pitchRangeSemitonesDelta || 0; const tone=v.toneStrengthDelta || 0; const gutt=v.gutturalResonanceDelta || 0; let curve='gentle-rise-fall'; if (tone>.55) curve='stepped'; else if (pitch>1.45) curve='rolling'; else if (force>.16||gutt>.16) curve='falling'; else if (leg>.25) curve='wave'; return { accentStyle:b.name, pitchCurve:curve, durationMultiplier:dur, rateBias:(1-dur)*.26, pauseBias:Math.max(-.08, Math.min(.16, (dur-1)*.22 - leg*.08)), pitchBias:(pitch*.018)+(tone*.022), stress:force*.35+gutt*.22, consonantForceDelta:force, gutturalResonanceDelta:gutt, legatoDelta:leg, toneStrengthDelta:tone, pitchAccentDelta:v.pitchAccentDelta||0, vowelStretch:Math.max(0, leg*.16 + (dur-1)*.22), finalDevoicingDelta:v.finalDevoicingDelta||0, nasalityDelta:v.nasalityDelta||0 }; };
  const RACE_OVERLAYS = { human:{label:'Human overlay',adjust:{formality:.05,roughness:-.05},cadence:{stress:-.03}}, elf:{label:'Elf overlay',adjust:{pitch:.18,inflection:.28,breath:.18,roughness:-.24,resonance:-.08,formality:.18},cadence:{pitchCurve:'wave',pitchBias:.018,legatoDelta:.16}}, dwarf:{label:'Dwarf overlay',adjust:{pitch:-.28,speed:-.08,inflection:-.08,breath:-.08,roughness:.28,resonance:.48,formality:.14},cadence:{pitchCurve:'falling',stress:.13}}, orc:{label:'Orc overlay',adjust:{pitch:-.22,speed:.03,inflection:-.08,breath:-.08,roughness:.52,resonance:.42,formality:-.12},cadence:{pitchCurve:'falling',stress:.22}}, halfling:{label:'Halfling overlay',adjust:{pitch:.22,speed:.20,inflection:.26,breath:.12,roughness:-.18,resonance:-.12,formality:-.18},cadence:{pitchCurve:'rising',rateBias:.025,stress:.04}}, aquatic:{label:'Aquatic overlay',adjust:{pitch:.05,speed:-.10,inflection:.30,breath:.44,roughness:-.22,resonance:.05,formality:.04},cadence:{pitchCurve:'wave',pauseBias:.035,pitchBias:.025,legatoDelta:.22}}, beastfolk:{label:'Beastfolk overlay',adjust:{speed:.08,inflection:.36,roughness:.20,resonance:.16,formality:-.10},cadence:{pitchCurve:'tight',stress:.13}} };
  const CLASS_OVERLAYS = { warrior:{label:'Warrior carriage',adjust:{speed:-.05,inflection:-.10,roughness:.18,resonance:.22,formality:.10},cadence:{pitchCurve:'falling',stress:.14}}, rogue:{label:'Rogue carriage',adjust:{pitch:.04,speed:.22,inflection:.06,breath:.12,resonance:-.20,formality:-.22},cadence:{pauseBias:-.035,rateBias:.035,stress:.03}}, mage:{label:'Mage / scholar carriage',adjust:{speed:-.08,inflection:.05,roughness:-.12,resonance:-.03,formality:.42},cadence:{pitchCurve:'flat',pauseBias:.035,stress:.02}}, cleric:{label:'Cleric / priest carriage',adjust:{speed:-.18,inflection:.06,breath:.12,roughness:-.15,resonance:.24,formality:.38},cadence:{pitchCurve:'gentle-rise-fall',pauseBias:.055,stress:.04}}, ranger:{label:'Ranger / scout carriage',adjust:{speed:.03,inflection:-.02,breath:.07,roughness:-.04,resonance:.07,formality:-.05},cadence:{pitchCurve:'flat',pauseBias:-.015}}, bard:{label:'Bard carriage',adjust:{pitch:.08,speed:.06,inflection:.48,breath:.10,roughness:-.05,resonance:.03,formality:.03},cadence:{pitchCurve:'rolling',stress:.13,pitchBias:.025}}, merchant:{label:'Merchant / artisan carriage',adjust:{speed:.12,inflection:.16,breath:.01,roughness:-.03,resonance:.03,formality:.05},cadence:{pitchCurve:'gentle-rise-fall',rateBias:.018}} };
  const classifyRace = (race='') => { const s=String(race||'').toLowerCase(); if(/elf|elven|drow|shadar|eladrin|lunar/.test(s))return'elf'; if(/dwarf|duergar|gnome|svirf/.test(s))return'dwarf'; if(/orc|goblin|hobgoblin|bugbear|ogre|brutish/.test(s))return'orc'; if(/halfling|kender|smallfolk/.test(s))return'halfling'; if(/aquatic|merfolk|mermaid|merman|triton|sea|ocean|reef|water|dril['’]thar/.test(s))return'aquatic'; if(/tabaxi|leonin|lizardfolk|aarakocra|kenku|harengon|minotaur|beast|wolf|cat|fox|rat|bird|serpent|turtle|tortle/.test(s))return'beastfolk'; return'human'; };
  const classifyClass = (cls='', subclass='') => { const s=`${cls||''} ${subclass||''}`.toLowerCase(); if(/barbarian|fighter|paladin|warrior|commander|soldier|blade|knight|warden/.test(s))return'warrior'; if(/rogue|assassin|thief|spy|shadow|sneak|gloom/.test(s))return'rogue'; if(/wizard|sorcerer|warlock|mage|scholar|artificer|scribe|oracle/.test(s))return'mage'; if(/cleric|priest|paladin|divine|oracle|temple|domain/.test(s))return'cleric'; if(/ranger|scout|druid|hunter|warden|beast master|beastmaster/.test(s))return'ranger'; if(/bard|performer|singer|skald|poet|college/.test(s))return'bard'; if(/merchant|artisan|smith|crafter|alchemist|trader|maker/.test(s))return'merchant'; return'ranger'; };
  const inferFromText = (text='') => { const s=String(text||'').toLowerCase(); const found = BIOMES.find(b => b.key!=='none' && (s.includes(b.key.replace(/_/g,' ')) || s.includes(b.biome.toLowerCase()) || s.includes(b.name.toLowerCase()) || b.biome.toLowerCase().split(/\s+/).filter(w=>w.length>3).some(w=>s.includes(w)))); return found ? found.key : ''; };
  const resolveBiomeKey = (value='') => { const raw=String(value||'').trim(); if(!raw) return 'none'; const lower=raw.toLowerCase(); const found=BIOMES.find(b=>b.key===raw||b.key===lower||b.mathKey===raw||b.mathKey===lower||b.biome.toLowerCase()===lower||b.name.toLowerCase()===lower||`${b.biome} — ${b.name}`.toLowerCase()===lower); return found?found.key:(inferFromText(raw)||'none'); };
  const getBiome = key => BIOMES.find(b => b.key===resolveBiomeKey(key)) || BIOMES[0];
  const listOptions = () => BIOMES.map(b => ({ key:b.key, label:b.key==='none'?b.name:`${b.biome} — ${b.name}`, feel:b.feel }));
  const applyAccent = (profile={}, npc={}, options={}) => { const biomeKey=resolveBiomeKey(options.biomeKey||npc.biome||npc.regionBiome||'none'); const influence=clamp(options.influence ?? npc.voiceInfluences?.biome ?? 100,0,100); const biome=getBiome(biomeKey); if(!biome || biome.key==='none'||influence<=0) return {profile:{...profile},accent:null,cadence:{}}; const raceType=options.raceType||classifyRace(npc.race||npc.ancestry||npc.species||''); const classType=options.classType||classifyClass(npc.class||npc.primaryClass||'',npc.subclass||npc.path||''); const race=RACE_OVERLAYS[raceType]||RACE_OVERLAYS.human; const cls=CLASS_OVERLAYS[classType]||CLASS_OVERLAYS.ranger; const baseAdj=adjFromVector(biome.vector||{}); let out=add(profile, scale(baseAdj,influence)); out=add(out, scale(race.adjust,influence*.78)); out=add(out, scale(cls.adjust,influence*.70)); const cadence=mergeCadence(cadenceFromVector(biome), race.cadence, cls.cadence); Object.keys(cadence).forEach(k=>{ if(typeof cadence[k]==='number') cadence[k]=+(cadence[k]*(influence/100)).toFixed(4); }); return { profile:out, cadence, accent:{ biomeKey:biome.key, mathKey:biome.mathKey, biome:biome.biome, name:biome.name, feel:biome.feel, raceOverlay:race.label, classOverlay:cls.label, influence:Math.round(influence), vector:biome.vector||{}, rules:biome.rules||[], voiceLangHints:biome.voiceLangHints||[] } }; };
  const describeAccent = accent => accent ? `${accent.name}: ${accent.feel} ${accent.raceOverlay}; ${accent.classOverlay}. Influence ${accent.influence}%.` : 'No regional biome accent selected.';
  window.BelavadosBiomeAccents = { BIOMES, APPLIED_BIOMES, RACE_OVERLAYS, CLASS_OVERLAYS, listOptions, resolveBiomeKey, getBiome, classifyRace, classifyClass, inferFromText, applyAccent, describeAccent, cadenceFromVector };
})();
