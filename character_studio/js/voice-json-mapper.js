/* Belavadös Voice Studio - NPC/bot JSON import, plain-text scanning, and full JSON-pack matching */
(() => {
  'use strict';
  const Core = window.BelavadosVoiceCore;
  const Presets = window.BelavadosVoicePresets;
  const Analysis = window.BelavadosVoiceAnalysis;
  const Pack = () => window.BelavadosVoiceGeneratorPack;

  const escapeRx = (s='') => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const firstMatch = (text, items = []) => {
    const lower = String(text || '').toLowerCase();
    return items.find(item => {
      const escaped = escapeRx(String(item)).replace(/[- ]/g, '[-\\s]?');
      return new RegExp(`\\b${escaped}\\b`, 'i').test(lower);
    }) || '';
  };
  const inferNameFromText = (text = '') => {
    const s = String(text || '').trim();
    const explicit = s.match(/(?:name|npc|character|bot)\s*[:=\-]\s*([A-ZÀ-Þ][\wÀ-ÿ'’.-]+(?:\s+[A-ZÀ-Þ][\wÀ-ÿ'’.-]+){0,3})/);
    if (explicit) return explicit[1].trim();
    const colon = s.match(/^([A-ZÀ-Þ][\wÀ-ÿ'’.-]+(?:\s+[A-ZÀ-Þ][\wÀ-ÿ'’.-]+){0,3})\s*[:;\-]/);
    return colon ? colon[1].trim() : 'Personality Text Voice';
  };
  const inferFromPlainText = async (text = '') => {
    const taxonomy = await Presets.loadTaxonomy();
    const lower = String(text || '').toLowerCase();
    const genders = taxonomy.genders || [];
    const races = Object.keys(taxonomy.raceProfiles || {});
    const classes = Object.keys(taxonomy.classes || {});
    const alignments = taxonomy.traditionalAlignments || [];
    const aliases = [
      ['Non-Binary', /\b(nonbinary|non-binary|enby|nb)\b/], ['Gender-Flexible', /\bgender[-\s]?flexible\b/], ['Gender-Fluid', /\bgender[-\s]?fluid\b/],
      ['Gender-Less', /\bgender[-\s]?less|genderless\b/], ['Agender', /\bagender\b/], ['Bi-Gender', /\bbi[-\s]?gender|bigender\b/], ['Poly-Gender', /\bpoly[-\s]?gender|polygender\b/],
      ['Trans-Female', /\b(trans woman|trans female|trans-female|transfeminine)\b/], ['Trans-Male', /\b(trans man|trans male|trans-male|transmasculine)\b/],
      ['Demi-Female', /\bdemi[-\s]?female\b/], ['Demi-Male', /\bdemi[-\s]?male\b/],
      ['Cis-Female', /\b(cis woman|cis female|cis-female|female voice|feminine voice)\b/], ['Cis-Male', /\b(cis man|cis male|cis-male|male voice|masculine voice)\b/]
    ];
    let genderIdentity = firstMatch(text, genders);
    for (const [name, rx] of aliases) if (!genderIdentity && rx.test(lower) && genders.includes(name)) genderIdentity = name;
    const inferredPack = Pack()?.inferFromText(text) || {};
    const race = inferredPack.race || firstMatch(text, races);
    const cls = inferredPack.class || firstMatch(text, classes);
    const subclass = inferredPack.subclass || '';
    const alignment = firstMatch(text, alignments) || (lower.includes('neutral good') ? 'Neutral Good' : lower.includes('true neutral') ? 'True Neutral' : lower.includes('lawful good') ? 'Lawful Good' : lower.includes('chaotic good') ? 'Chaotic Good' : '');
    return {
      name: inferNameFromText(text),
      race,
      genderIdentity,
      class: cls,
      subclass,
      alignment,
      biome: window.BelavadosBiomeAccents?.inferFromText(text) || '',
      belavadosAlignment: null,
      personality: String(text || '').trim(),
      raw: { sourceType: 'plainTextPersonality', text: String(text || ''), inferredBy: 'full voice generator JSON pack keyword index' }
    };
  };
  const normalizeNpcSync = (raw = {}) => {
    const npc = typeof raw === 'string' ? Core.safeJsonParse(raw, {}) : raw;
    const pick = (...keys) => keys.map(k => npc?.[k]).find(v => v !== undefined && v !== null && v !== '');
    const raceRaw = pick('race','ancestry','species','lineage','heritage','bloodline') || '';
    const classRaw = pick('class','primaryClass','primary_class','job','roleClass') || '';
    const subclassRaw = pick('subclass','primarySubclass','primary_subclass','path','college','domain','oath','circle','tradition','patron') || '';
    const pack = Pack();
    const resolvedRace = pack?.resolveRace(raceRaw) || raceRaw;
    const resolvedClass = pack?.resolveClass(classRaw) || classRaw;
    const resolvedSubclass = pack?.resolveSubclass(subclassRaw, resolvedClass) || subclassRaw;
    return {
      name: pick('name','npcName','characterName','botName') || 'Unnamed Voice',
      race: resolvedRace,
      genderIdentity: pick('genderIdentity','gender_identity','gender','identity') || '',
      class: resolvedClass,
      subclass: resolvedSubclass,
      alignment: pick('alignment','traditionalAlignment','traditional_alignment') || '',
      biome: pick('biome','regionBiome','regionalBiome','settlementBiome','terrain','environment','accentBiome') || '',
      belavadosAlignment: pick('belavadosAlignment','alignmentAxes','axes') || null,
      personality: pick('personality','description','persona','tone','voice','traits') || '',
      raw: npc
    };
  };
  const normalizeNpc = async (raw = {}) => {
    if (typeof raw === 'string') {
      const parsed = Core.safeJsonParse(raw, null);
      if (parsed && typeof parsed === 'object') return normalizeNpcSync(parsed);
      return inferFromPlainText(raw);
    }
    return normalizeNpcSync(raw);
  };
  const autoSelectForNpc = async (npcInput, manifest = [], influences = {}) => {
    const npc = await normalizeNpc(npcInput);
    const mergedInfluences = { ...(npc.voiceInfluences || {}), ...(influences || {}) };
    npc.voiceInfluences = mergedInfluences;
    const preset = await Presets.buildPreset(npc, mergedInfluences);
    npc.race = preset.race || npc.race;
    npc.class = preset.className || npc.class;
    npc.subclass = preset.subclass || npc.subclass;
    const clips = Analysis.selectClips(manifest, preset.profile, npc, 4);
    return { npc, preset, clips };
  };
  const readJsonFile = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || '');
      resolve(Core.safeJsonParse(text, text));
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
  const makeNpcSummary = ({npc, preset, clips}) => {
    const lines = [];
    lines.push(`${npc.name}: ${npc.race || 'any race'} / ${npc.genderIdentity || 'any identity'} / ${npc.class || 'any class'}${npc.subclass ? ' / ' + npc.subclass : ''} / ${npc.alignment || 'any alignment'}`);
    lines.push(`Base voice: pitch ${preset.profile.pitch.toFixed(1)}, speed ${preset.profile.speed.toFixed(1)}, expression ${preset.profile.inflection.toFixed(1)}, softness ${preset.profile.breath.toFixed(1)}, gruff edge ${preset.profile.roughness.toFixed(1)}.`);
    if (preset.raceProfile?.summary) lines.push(`Race/lineage JSON: ${preset.raceProfile.displayName || npc.race} — ${preset.raceProfile.summary.slice(0, 220)}${preset.raceProfile.summary.length > 220 ? '…' : ''}`);
    if (preset.classProfile?.summary) lines.push(`Class/subclass JSON: ${preset.classProfile.selectableLabel || npc.subclass || npc.class} — ${preset.classProfile.summary.slice(0, 220)}${preset.classProfile.summary.length > 220 ? '…' : ''}`);
    if (preset.influences) lines.push(`Influence mix: race/ancestry ${Math.round(preset.influences.race)}%, gender identity ${Math.round(preset.influences.gender)}%, personality ${Math.round(preset.influences.personality)}%.`);
    if (preset.dataSource?.sourceFilesParsed) lines.push(`Full voice generator JSON pack active: ${preset.dataSource.sourceFilesParsed} JSON files parsed into this studio.`);
    if (npc.raw?.sourceType === 'plainTextPersonality') lines.push('Plain personality text detected: the full race, lineage, class, subclass, alignment, gender, and tone keyword indexes were scanned.');
    if (clips?.length) lines.push(`Suggested base clips: ${clips.map(c=>c.displayName || c.filename).join('; ')}`);
    return lines.join('\n');
  };
  window.BelavadosVoiceJsonMapper = { normalizeNpc, normalizeNpcSync, inferFromPlainText, autoSelectForNpc, readJsonFile, makeNpcSummary };
})();
