/* Belavadös Voice Studio - helper functions for the full Voice Generator JSON Pack */
(() => {
  'use strict';
  const Pack = () => window.BELAVADOS_VOICE_GENERATOR_PACK || null;
  const Core = () => window.BelavadosVoiceCore;
  const normalize = (s='') => String(s || '')
    .toLowerCase()
    .replace(/[’`]/g, "'")
    .replace(/[—–_\/]+/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const wordsOf = (s='') => new Set(normalize(s).split(/\s+/).filter(Boolean));
  const taxonomy = () => Pack()?.taxonomy || window.BELAVADOS_VOICE_TAXONOMY || null;
  const counts = () => taxonomy()?.profileCounts || Pack()?.counts || {};
  const sourceFiles = () => Pack()?.sourceFiles || [];
  const toProfile = (hundred = {}) => {
    const core = Core();
    return core ? core.fromHundred(hundred || {}) : {
      pitch:(hundred.pitch ?? 50) / 10,
      speed:(hundred.speed ?? 50) / 10,
      inflection:(hundred.inflection ?? 50) / 10,
      stutter:(hundred.stutter ?? 10) / 10,
      breath:(hundred.breath ?? 30) / 10,
      roughness:(hundred.roughness ?? 20) / 10,
      resonance:(hundred.resonance ?? 55) / 10,
      formality:(hundred.formality ?? 55) / 10
    };
  };
  const aliasLookup = (aliases = {}, value = '') => aliases[normalize(value)] || '';
  const resolveRace = (value = '') => {
    const t = taxonomy();
    if (!t || !value) return '';
    if (t.raceProfiles[value]) return value;
    return aliasLookup(t.raceAliases || {}, value) || '';
  };
  const resolveClassProfile = (value = '') => {
    const t = taxonomy();
    if (!t || !value) return '';
    if (t.classProfiles?.[value]) return value;
    if (t.classes?.[value]) return value;
    return aliasLookup(t.classAliases || {}, value) || '';
  };
  const resolveClass = (value = '') => {
    const t = taxonomy();
    if (!t || !value) return '';
    if (t.classes?.[value]) return value;
    const key = resolveClassProfile(value);
    const rec = t.classProfiles?.[key];
    return rec?.parentClass || rec?.displayName || key || '';
  };
  const resolveSubclass = (value = '', parentClass = '') => {
    const t = taxonomy();
    if (!t || !value) return '';
    if (t.classProfiles?.[value]) return value;
    const key = resolveClassProfile(value);
    if (!key) return '';
    const rec = t.classProfiles?.[key];
    if (!parentClass || !rec?.parentClass || rec.parentClass === parentClass) return key;
    return '';
  };
  const getRaceProfile = (value = '') => {
    const t = taxonomy();
    const key = resolveRace(value);
    return key ? t.raceProfiles[key] : null;
  };
  const getClassProfile = (value = '') => {
    const t = taxonomy();
    const key = resolveClassProfile(value);
    return key ? t.classProfiles?.[key] : null;
  };
  const listRaces = () => Object.keys(taxonomy()?.raceProfiles || {});
  const listClasses = () => Object.keys(taxonomy()?.classes || {});
  const listSubclasses = (className = '') => {
    const t = taxonomy();
    if (!t) return [];
    const cls = resolveClass(className) || className;
    return (t.classes?.[cls] || []).filter(Boolean);
  };
  const scoreTextForRecord = (textWords, record, label) => {
    const fields = [label, record?.displayName, record?.selectableLabel, record?.parentRace, record?.parentClass, record?.categoryName, ...(record?.tags || [])].filter(Boolean);
    let score = 0;
    fields.forEach((field, idx) => {
      const ws = wordsOf(field);
      let hits = 0;
      ws.forEach(w => { if (textWords.has(w)) hits++; });
      if (hits) score += hits * (idx === 0 ? 5 : idx <= 2 ? 4 : 2) + (hits === ws.size ? 2 : 0);
    });
    return score;
  };
  const bestMatchFromText = (text = '', map = {}, aliases = {}) => {
    const normalized = normalize(text);
    if (!normalized) return '';
    const aliasEntries = Object.entries(aliases || {}).sort((a,b) => b[0].length - a[0].length);
    for (const [alias, label] of aliasEntries) {
      const multiWord = String(alias || '').trim().split(/\s+/).length >= 2;
      if (multiWord && new RegExp(`(^| )${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(normalized)) return label;
    }
    const textWords = wordsOf(text);
    let best = ['', 0];
    Object.entries(map || {}).forEach(([label, record]) => {
      const score = scoreTextForRecord(textWords, record, label);
      if (score > best[1]) best = [label, score];
    });
    if (best[1] >= 5) return best[0];
    for (const [alias, label] of aliasEntries) {
      if (alias && new RegExp(`(^| )${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}( |$)`).test(normalized)) return label;
    }
    return '';
  };
  const inferFromText = (text = '') => {
    const t = taxonomy();
    if (!t) return {};
    const race = bestMatchFromText(text, t.raceProfiles, t.raceAliases);
    const classOrSubclass = bestMatchFromText(text, t.classProfiles, t.classAliases);
    const classRec = t.classProfiles?.[classOrSubclass];
    const className = classRec?.parentClass || (t.classes?.[classOrSubclass] ? classOrSubclass : '');
    const subclass = classRec?.parentClass ? classOrSubclass : '';
    return { race, class: className, subclass };
  };
  const packSummary = () => {
    const c = counts();
    return `Voice JSON pack loaded: ${c.jsonFilesParsed || sourceFiles().length} JSON files, ${c.racialCategoryFiles || 0} racial category files, ${c.raceProfilesSelectable || 0} selectable race/lineage profiles, ${c.classes || 0} classes, and ${c.classAndSubclassProfilesSelectable || 0} class/subclass voice profiles.`;
  };
  window.BelavadosVoiceGeneratorPack = { taxonomy, counts, sourceFiles, normalize, resolveRace, resolveClass, resolveSubclass, resolveClassProfile, getRaceProfile, getClassProfile, toProfile, listRaces, listClasses, listSubclasses, inferFromText, bestMatchFromText, packSummary };
})();
