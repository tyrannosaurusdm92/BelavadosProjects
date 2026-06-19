/* Belavadös Voice Studio - Inclusive race, class, alignment, identity, and full JSON-pack preset logic */
(() => {
  'use strict';
  const Core = window.BelavadosVoiceCore;
  const Pack = () => window.BelavadosVoiceGeneratorPack;
  let taxonomyCache = null;
  const loadTaxonomy = async (url='data/voice-taxonomy.json') => {
    if (taxonomyCache) return taxonomyCache;
    if (window.BELAVADOS_VOICE_GENERATOR_PACK?.taxonomy) { taxonomyCache = window.BELAVADOS_VOICE_GENERATOR_PACK.taxonomy; return taxonomyCache; }
    if (window.BELAVADOS_VOICE_TAXONOMY) { taxonomyCache = window.BELAVADOS_VOICE_TAXONOMY; return taxonomyCache; }
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Could not load voice taxonomy: ${res.status}`);
    taxonomyCache = await res.json();
    return taxonomyCache;
  };
  const genderAdjustments = {
    'Cis-Male': { pitch:-1.0, resonance:1.0, breath:-.2 },
    'Cis-Female': { pitch:1.0, resonance:-.25, breath:.35, inflection:.45 },
    'Demi-Male': { pitch:-.55, resonance:.65 },
    'Demi-Female': { pitch:.65, breath:.25, inflection:.25 },
    'Non-Binary': { pitch:.05, resonance:.05, inflection:.25 },
    'Trans-Male': { pitch:-.55, resonance:.55, breath:.1 },
    'Trans-Female': { pitch:.7, breath:.35, inflection:.35 },
    'Gender-Fluid': { pitch:.15, inflection:.75, speed:.15 },
    'Agender': { pitch:0, inflection:-.35, formality:.2 },
    'Gender-Less': { pitch:-.1, inflection:-.45, breath:-.1, formality:.35 },
    'Gender-Flexible': { pitch:.2, inflection:.55, breath:.15 },
    'Bi-Gender': { pitch:.15, resonance:.15, inflection:.55 },
    'Poly-Gender': { pitch:.25, inflection:.8, breath:.2 },
    'Neutrois': { pitch:.05, inflection:-.15, resonance:.1 }
  };
  const classAdjustments = {
    Barbarian:{ roughness:1.6, resonance:1.3, speed:.3, formality:-.8 }, Bard:{ inflection:1.5, pitch:.25, breath:.5, formality:.2 }, Cleric:{ formality:1.1, resonance:.8, speed:-.2 }, Druid:{ breath:.55, inflection:.55, resonance:.3 }, Fighter:{ resonance:.75, roughness:.45, formality:.35 }, Monk:{ speed:.55, formality:.6, breath:-.2 }, Paladin:{ formality:1.5, resonance:1.2, roughness:.15 }, Ranger:{ speed:.35, breath:.25, formality:-.2 }, Rogue:{ speed:.8, pitch:.15, resonance:-.35, formality:-.45 }, Sorcerer:{ inflection:1.0, pitch:.5, breath:.45 }, Warlock:{ roughness:.85, resonance:.55, breath:.4, inflection:.55 }, Wizard:{ formality:1.2, inflection:.35, speed:-.15 }, Artificer:{ formality:.55, speed:.25, resonance:-.1 }, 'Blood Hunter':{ roughness:1.1, resonance:.7, formality:.2 }, 'Multi-Class':{ inflection:.35, speed:.2, formality:.15 }
  };
  const traditionalAlignmentAdjustments = {
    'Lawful Good':{ formality:.9, resonance:.35, roughness:-.25 }, 'Neutral Good':{ breath:.25, inflection:.35 }, 'Chaotic Good':{ speed:.55, inflection:.7, formality:-.4 }, 'Lawful Neutral':{ formality:1.0, inflection:-.35 }, 'True Neutral':{}, 'Chaotic Neutral':{ speed:.6, inflection:.8, stutter:.15, formality:-.65 }, 'Lawful Evil':{ formality:1.1, resonance:.7, roughness:.35 }, 'Neutral Evil':{ roughness:.75, breath:.3, inflection:-.2 }, 'Chaotic Evil':{ roughness:1.4, speed:.45, inflection:.9, formality:-.8 }
  };
  const categoryAdjustments = {
    1:{ formality:.25 }, 2:{ pitch:.5, inflection:.65, formality:.7 }, 3:{ pitch:-.65, resonance:1.1, roughness:.3, speed:-.25 }, 4:{ pitch:.65, speed:.55, inflection:.7, resonance:-.4 }, 5:{ pitch:-.75, roughness:1.1, resonance:.85, formality:-.45 }, 6:{ pitch:-1.1, resonance:1.7, speed:-.35 }, 7:{ roughness:.9, resonance:1.2, formality:.4 }, 8:{ inflection:.85, breath:.55, roughness:.35 }, 9:{ pitch:-.75, breath:.55, roughness:.75, speed:-.35 }, 10:{ pitch:.7, speed:.6, inflection:1.2, formality:-.3 }, 11:{ inflection:.75, resonance:.6, breath:.35 }, 12:{ inflection:-.2, formality:1.0, resonance:-.2 }, 13:{ inflection:-.65, formality:.65, breath:-.45, roughness:.25 }, 14:{ pitch:.65, speed:.45, breath:.35, inflection:.8 }, 15:{ resonance:.45, roughness:.25, speed:.25 }, 16:{ breath:.7, inflection:.45, speed:-.15 }, 17:{ roughness:.85, resonance:-.2, breath:.5 }, 18:{ breath:.75, speed:-.3, resonance:.6 }, 19:{ pitch:-.55, breath:.6, roughness:.8, inflection:.5 }, 20:{ inflection:.45, speed:.35, formality:.1 }, 21:{ roughness:.65, speed:.45, formality:-.55 }, 22:{ pitch:.45, breath:.5, inflection:.8 }
  };
  const applyAdjustments = (profile, ...adjustments) => {
    const out = { ...profile };
    adjustments.filter(Boolean).forEach(adj => Object.keys(adj).forEach(k => { out[k] = Core.clamp(Core.normalizeTrait(out[k]) + adj[k], 0, 10); }));
    return out;
  };
  const parseBelavadosAxes = (npc = {}) => {
    const axes = npc.belavadosAlignment || npc.alignmentAxes || npc.axes || {};
    const val = (k) => Number.isFinite(+axes[k]) ? +axes[k] : Number.isFinite(+axes[k.toLowerCase()]) ? +axes[k.toLowerCase()] : 1500;
    const altruism = (val('Altruism') - 1500) / 1500;
    const law = (val('Lawfulness') - 1500) / 1500;
    const coop = (val('Cooperation') - 1500) / 1500;
    const honor = (val('Honor') - 1500) / 1500;
    return { breath: altruism * .35, formality: law * .75 + honor * .45, inflection: coop * .35, roughness: -altruism * .25 + Math.max(0, -honor) * .5, resonance: honor * .25 };
  };
  const personalityAdjustments = (personality = '') => {
    const p = String(personality || '').toLowerCase();
    const out = {};
    const add = (k, v) => out[k] = (out[k] || 0) + v;
    if (/solemn|grave|serious|quiet|calm/.test(p)) { add('speed',-.35); add('inflection',-.35); add('formality',.35); }
    if (/protective|commander|stern|authoritative|tactical/.test(p)) { add('resonance',.8); add('formality',.75); add('roughness',.25); }
    if (/funny|whimsical|playful|bright|hopeful|sweet/.test(p)) { add('pitch',.35); add('speed',.45); add('inflection',.9); }
    if (/anxious|awkward|nervous|spooky/.test(p)) { add('speed',.75); add('stutter',.7); add('breath',.45); }
    if (/gruff|guarded|dry|clipped|practical/.test(p)) { add('roughness',.75); add('formality',.25); add('inflection',-.45); }
    if (/elegant|scholar|precise|brilliant|formal/.test(p)) { add('formality',1); add('inflection',.2); add('speed',-.1); }
    if (/tender|warm|gentle|loyal|kind/.test(p)) { add('breath',.35); add('roughness',-.35); add('inflection',.35); }
    if (/fast|rapid|quick|hurried|chatty|excitable|energetic/.test(p)) { add('speed',.8); }
    if (/slow|measured|sleepy|tired|weary|ancient|elder|old/.test(p)) { add('speed',-.7); add('formality',.25); }
    if (/deep|low|baritone|bass|chesty|booming|thunder|giant|goliath/.test(p)) { add('pitch',-.9); add('resonance',1.0); }
    if (/high|bright|light|small|fae|fairy|sprite|teen|youthful/.test(p)) { add('pitch',.8); add('resonance',-.35); }
    if (/breathy|airy|whisper|whispery|hushed|soft-spoken|soft spoken/.test(p)) { add('breath',.85); add('speed',-.15); }
    if (/raspy|gravel|gravelly|rough|scarred|smoker|creaky|creak|husky/.test(p)) { add('roughness',1.0); add('pitch',-.25); }
    if (/smooth|silken|velvet|soothing|clear|crisp/.test(p)) { add('roughness',-.75); add('breath',-.2); add('formality',.25); }
    if (/ceremonial|ritual|regal|royal|noble|priestly|orator/.test(p)) { add('formality',1.0); add('resonance',.55); add('speed',-.25); }
    if (/casual|relaxed|slang|goofy|informal/.test(p)) { add('formality',-.9); add('inflection',.35); }
    if (/flat|monotone|deadpan|robotic|emotionless/.test(p)) { add('inflection',-.9); add('formality',.35); }
    if (/melodic|musical|sing-song|singsong|lyrical|bardic/.test(p)) { add('inflection',1.0); add('pitch',.25); }
    if (/annoyed|annoyance|irritated|impatient|snappish|clipped/.test(p)) { add('speed',.35); add('roughness',.35); add('formality',.15); }
    if (/compassion|compassionate|merciful|reassuring|comforting|nurturing/.test(p)) { add('speed',-.55); add('breath',.45); add('roughness',-.55); add('inflection',.35); }
    if (/angry|anger|furious|rage|wrathful|hostile|aggressive/.test(p)) { add('speed',.55); add('roughness',.95); add('resonance',.85); add('inflection',.55); }
    if (/betrayed|betrayal|hurt|wounded|heartbroken|grieving|grief/.test(p)) { add('speed',-.55); add('inflection',.85); add('stutter',.35); add('breath',.35); }
    if (/commanding|dominant|leader|captain|general|queen|king|matriarch|patriarch/.test(p)) { add('formality',.9); add('resonance',.9); add('speed',-.15); }
    if (/cowardly|fearful|afraid|panicked|panicky|skittish|timid/.test(p)) { add('pitch',.55); add('speed',.65); add('stutter',.75); add('breath',.45); }
    if (/confident|bold|brave|heroic|assured/.test(p)) { add('resonance',.6); add('formality',.35); add('inflection',.35); }
    if (/menacing|threatening|sinister|villain|ominous/.test(p)) { add('pitch',-.75); add('roughness',.65); add('resonance',.85); add('speed',-.45); }
    return out;
  };
  const getRaceDefaults = async (race) => {
    const t = await loadTaxonomy();
    const key = Pack()?.resolveRace(race) || race;
    const rp = t.raceProfiles?.[key];
    if (!rp) return { ...Core.DEFAULT_PROFILE };
    return Core.fromHundred(rp.voiceDefaults || {});
  };
  const getClassDefaults = async (classOrSubclass) => {
    const t = await loadTaxonomy();
    const key = Pack()?.resolveClassProfile(classOrSubclass) || classOrSubclass;
    const cp = t.classProfiles?.[key];
    if (!cp) return null;
    return Core.fromHundred(cp.voiceDefaults || {});
  };
  const buildPreset = async (npc = {}, influences = {}) => {
    const t = await loadTaxonomy();
    const P = Pack();
    const rawRace = npc.race || npc.ancestry || npc.species || Object.keys(t.raceProfiles || {})[0];
    const race = P?.resolveRace(rawRace) || rawRace;
    const gender = npc.genderIdentity || npc.gender || npc.identity;
    const rawClass = npc.class || npc.primaryClass || npc.primary_class;
    const className = P?.resolveClass(rawClass) || rawClass;
    const rawSubclass = npc.subclass || npc.primarySubclass || npc.primary_subclass || npc.path || '';
    const subclass = P?.resolveSubclass(rawSubclass, className) || rawSubclass;
    const classProfileKey = subclass || className;
    const alignment = npc.alignment || npc.traditionalAlignment;
    const rp = t.raceProfiles?.[race];
    const cp = t.classProfiles?.[classProfileKey] || t.classProfiles?.[className];
    const pct = {
      race: Core.clamp(influences.race ?? influences.raceInfluence ?? npc.voiceInfluences?.race ?? 100, 0, 100),
      gender: Core.clamp(influences.gender ?? influences.genderInfluence ?? npc.voiceInfluences?.gender ?? 100, 0, 100),
      personality: Core.clamp(influences.personality ?? influences.personalityInfluence ?? npc.voiceInfluences?.personality ?? 100, 0, 100)
    };
    const raceBase = await getRaceDefaults(race);
    let profile = Core.blendProfiles(Core.DEFAULT_PROFILE, raceBase, pct.race);
    const classBase = await getClassDefaults(classProfileKey) || await getClassDefaults(className);
    if (classBase) profile = Core.weightedMerge([profile, classBase], [7, 3]);
    const category = rp ? categoryAdjustments[rp.categoryId] : null;
    const scaled = (adj, p) => Core.scaleAdjustment(adj || {}, p);
    profile = applyAdjustments(
      profile,
      scaled(category, pct.race),
      scaled(genderAdjustments[gender], pct.gender),
      classAdjustments[className],
      traditionalAlignmentAdjustments[alignment],
      parseBelavadosAxes(npc),
      scaled(personalityAdjustments(npc.personality || npc.description || ''), pct.personality)
    );
    return {
      profile,
      race,
      gender,
      className,
      subclass,
      classProfileKey,
      alignment,
      raceProfile: rp || null,
      classProfile: cp || null,
      influences: pct,
      engine: Core.profileToEngine(profile),
      waveform: Core.guessWaveform(profile),
      dataSource: {
        pack: t.sourcePack || 'Belavados Voice Generator JSON Pack',
        racePreset: rp?.presetId || null,
        classPreset: cp?.presetId || null,
        sourceFilesParsed: t.profileCounts?.jsonFilesParsed || null
      }
    };
  };
  window.BelavadosVoicePresets = { loadTaxonomy, genderAdjustments, classAdjustments, traditionalAlignmentAdjustments, categoryAdjustments, applyAdjustments, buildPreset, getRaceDefaults, getClassDefaults, personalityAdjustments, parseBelavadosAxes };
})();
