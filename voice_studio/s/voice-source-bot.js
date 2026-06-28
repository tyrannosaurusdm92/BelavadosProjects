const SPEAKER_PROFILES = {
  'Abrahan Mack': { gender:'masculine', register:'deep', accents:['midwest','north american','welsh','cavern','stone'], traits:['command','grounded','steady'] },
  'Adde Michal': { gender:'masculine', register:'mid', accents:['welsh','dutch','german','cavern'], traits:['precise','scholar'] },
  'Alison Dietlinde': { gender:'feminine', register:'mid', accents:['german','dutch','forest'], traits:['structured','clear'] },
  'Ana Florence': { gender:'feminine', register:'mid', accents:['spanish','italian','valley','sun'], traits:['warm','social'] },
  'Andrew Chipper': { gender:'masculine', register:'mid', accents:['midwest','north american','plainwind','grassland'], traits:['friendly','plainspoken'] },
  'Annmarie Nele': { gender:'feminine', register:'mid', accents:['german','dutch','forest'], traits:['gentle','organized'] },
  'Asya Anara': { gender:'feminine', register:'bright', accents:['russian','thai','mystery','prairie'], traits:['fluid','dramatic'] },
  'Badr Odhiambo': { gender:'masculine', register:'deep', accents:['maritime','ocean','coastal','command'], traits:['resonant','captain'] },
  'Baldur Sanjin': { gender:'masculine', register:'deep', accents:['russian','scottish','mountain','prairie'], traits:['stern','rugged'] },
  'Brenda Stern': { gender:'feminine', register:'mid', accents:['midwest','north american','grassland'], traits:['direct','clear'] },
  'Claribel Dervla': { gender:'feminine', register:'bright', accents:['irish','welsh','hearthfield','cavern'], traits:['warm','lilting'] },
  'Craig Gutsy': { gender:'masculine', register:'deep', accents:['scottish','mountain','midwest'], traits:['rough','warrior'] },
  'Daisy Studious': { gender:'feminine', register:'bright', accents:['midwest','english','grassland'], traits:['friendly','scholar'] },
  'Damien Black': { gender:'masculine', register:'deep', accents:['shadow','cavern','swamp','menace'], traits:['low','secretive'] },
  'Dionisio Schuyler': { gender:'masculine', register:'mid', accents:['spanish','portuguese','brazilian','coastal'], traits:['lively','merchant'] },
  'Gilberto Mathias': { gender:'masculine', register:'mid', accents:['brazilian','portuguese','brightshore','tidecrest'], traits:['warm','coastal'] },
  'Gitta Nikolina': { gender:'feminine', register:'mid', accents:['german','russian','forest','prairie'], traits:['authoritative','dense'] },
  'Gracie Wise': { gender:'feminine', register:'bright', accents:['midwest','north american','grassland'], traits:['kind','clear'] },
  'Henriette Usha': { gender:'feminine', register:'bright', accents:['french','thai','highbranch','deepcurrent'], traits:['airy','elegant'] },
  'Ilkin Urbano': { gender:'neutral', register:'mid', accents:['italian','spanish','valley','partial forest'], traits:['urban','flexible'] },
  'Kazuhiko Atallah': { gender:'masculine', register:'mid', accents:['japanese','reefglass','underwater','precise'], traits:['clear','disciplined'] },
  'Ludvig Milivoj': { gender:'masculine', register:'deep', accents:['dutch','russian','german','millfield'], traits:['practical','organized'] },
  'Royston Min': { gender:'masculine', register:'mid', accents:['cajun','creole','mirecurl','swamp'], traits:['earthy','secretive'] },
  'Sofia Hellen': { gender:'feminine', register:'bright', accents:['italian','valley','romantic','french'], traits:['lyrical','elegant'] },
  'Suad Qasim': { gender:'neutral', register:'mid', accents:['thai','ocean','deepcurrent','ritual'], traits:['mysterious','measured'] },
  'Tammie Ema': { gender:'feminine', register:'mid', accents:['cajun','creole','swamp','mirecurl'], traits:['lived-in','earthy'] },
  'Tammy Grit': { gender:'feminine', register:'deep', accents:['scottish','mountain','rugged'], traits:['gruff','direct'] },
  'Tanja Adelina': { gender:'feminine', register:'bright', accents:['russian','italian','valley','prairie'], traits:['dramatic','expressive'] },
  'Torcull Diarmuid': { gender:'masculine', register:'deep', accents:['irish','scottish','hearthfield','cragthane'], traits:['earthy','rugged'] },
  'Viktor Eka': { gender:'masculine', register:'deep', accents:['russian','prairie','ironstep'], traits:['stern','grounded'] },
  'Viktor Menelaos': { gender:'masculine', register:'deep', accents:['russian','greek','prairie','command'], traits:['formal','heavy'] },
  'Vjollca Johnnie': { gender:'neutral', register:'mid', accents:['french','dutch','woodland','hybrid'], traits:['playful','layered'] },
  'Zacharie Aimilios': { gender:'masculine', register:'mid', accents:['french','italian','highbranch','valley'], traits:['polished','refined'] }
};

const GENDER_TARGETS = {
  feminine:['feminine','neutral'],
  masculine:['masculine','neutral'],
  neutral:['neutral','feminine','masculine']
};

const TAG_BY_CONTEXT = [
  [/threat|menace|anger|rage|refusal|boss|combat|weapon|authority|command|dungeon/i, ['refusal','confirmation']],
  [/farewell|defeat|mourning|grief/i, ['farewell','refusal']],
  [/joy|welcome|tavern|shopkeeper|travel|banter|comic|kind|compassion|tender/i, ['greeting','confirmation']],
  [/complete|victory|done|ready|build|profile/i, ['completion','confirmation']],
  [/secret|whisper|suspicion|rogue/i, ['misceallaneous','refusal']],
  [/spell|ritual|casting|ancient|lore/i, ['misceallaneous','confirmation']]
];

function norm(value){ return String(value == null ? '' : value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
function words(value){ return norm(value).split(/\s+/).filter(Boolean); }
function hashNum(value){ let h=2166136261>>>0; const s=String(value||''); for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
function unique(list){ return [...new Set(list.filter(Boolean))]; }
function includesAny(hay, needles){ return needles.some(n=>n && hay.includes(norm(n))); }

export function genderBucket(identity){
  const s=norm(identity);
  if(/trans male|cis male|demi male|male|man|masc|boy|father|dad/.test(s)) return 'masculine';
  if(/trans female|cis female|demi female|female|woman|femme|girl|mother|mom/.test(s)) return 'feminine';
  return 'neutral';
}

export function raceVoiceTraits(input={}){
  const hay=norm([input.category,input.race,input.lineage].join(' '));
  const out=[];
  if(/elf|eladrin|drow|shadar|kaluseban|fae|fairy|fey/.test(hay)) out.push('airy','elegant','precise','bright');
  if(/dwarf|duergar|gnome|stone|earth|cavern/.test(hay)) out.push('deep','grounded','stone','clipped');
  if(/orc|goblin|bugbear|gnoll|goliath|minotaur|giant/.test(hay)) out.push('deep','rough','command','strong');
  if(/halfling|kender|smallfolk|jaspey|geisamahi|gandirosha/.test(hay)) out.push('warm','friendly','bright','quick');
  if(/triton|merfolk|dril|tamhiogal|water|sea|aquatic|locathah|reef|ocean/.test(hay)) out.push('fluid','breathy','ocean','soft');
  if(/warforged|construct|autognome|relic|geppettin|wechselkind/.test(hay)) out.push('precise','confirmation','structured','metallic');
  if(/dragon|kobold|lizard|yuan|tortle/.test(hay)) out.push('rough','deep','reptilian','firm');
  if(/beast|tabaxi|leonin|vulpin|harengon|bear|canisar|loxodon|deorbasun/.test(hay)) out.push('expressive','physical','instinctive');
  return unique(out);
}

export function targetTags(input={}){
  const hay=[input.mood,input.context,input.classRole,input.personality].join(' ');
  for(const [rx,tags] of TAG_BY_CONTEXT) if(rx.test(hay)) return tags;
  return ['greeting','confirmation'];
}

export function buildBotSignals(input={}, biome={}){
  const baseAccent = biome?.baseAccent || '';
  const fantasyAccent = biome?.fantasyAccent || '';
  const biomeText = [biome?.biome, baseAccent, fantasyAccent, biome?.finalFeel].join(' ');
  return {
    gender: genderBucket(input.genderIdentity),
    accentWords: unique([...words(baseAccent), ...words(fantasyAccent), ...words(biomeText)]),
    raceTraits: raceVoiceTraits(input),
    desiredTags: targetTags(input),
    identityText: [input.name,input.genderIdentity,input.category,input.race,input.lineage,input.biome,input.classRole,input.personality].join(' ')
  };
}

export function decideVoiceSource(manifest=[], input={}, biome={}){
  const signals = buildBotSignals(input, biome);
  const preferredGenders = GENDER_TARGETS[signals.gender] || GENDER_TARGETS.neutral;
  const scored = (manifest||[]).map((item, idx)=>{
    const profile = SPEAKER_PROFILES[item.speaker] || { gender:'neutral', register:'mid', accents:[], traits:[] };
    const hay = norm([item.speaker,item.file,item.source,item.kind,item.tag,item.phrase,profile.gender,profile.register,...profile.accents,...profile.traits].join(' '));
    let score = 0;
    const reasons=[];
    if(preferredGenders.includes(profile.gender)){ score += profile.gender === signals.gender ? 24 : 12; reasons.push(`gender-register fit: ${profile.gender}`); }
    for(const word of signals.accentWords){
      if(word.length>2 && hay.includes(word)){ score += 7; reasons.push(`accent cue: ${word}`); }
    }
    for(const trait of signals.raceTraits){
      if(hay.includes(norm(trait))){ score += 6; reasons.push(`race texture cue: ${trait}`); }
      if(trait==='deep' && profile.register==='deep'){ score += 5; reasons.push('deep register fit'); }
      if(trait==='bright' && profile.register==='bright'){ score += 5; reasons.push('bright register fit'); }
      if(trait==='precise' && /confirmation|completion|clear|precise|scholar|structured/.test(hay)){ score += 3; reasons.push('precise source texture'); }
    }
    if(signals.desiredTags.includes(item.tag)){ score += 9; reasons.push(`sample tag fit: ${item.tag}`); }
    if(/greeting|confirmation|completion/.test(item.tag||'')){ score += 2; reasons.push('clean reusable voice sample'); }
    if(Number(item.bytes||0) > 80000){ score += 2; reasons.push('longer source reference'); }
    if(Number(item.bytes||0) < 22000){ score -= 2; }
    const deterministicTieBreak = (hashNum(`${signals.identityText}|${biome?.biome}|${item.speaker}|${item.file}`) % 1000) / 1000;
    score += deterministicTieBreak;
    return { item, idx, score:Number(score.toFixed(4)), reasons:unique(reasons).slice(0,10), profile };
  }).sort((a,b)=>b.score-a.score || a.idx-b.idx);
  const best = scored[0] || null;
  const runnerUp = scored.slice(1,6).map(x=>({ id:x.item?.id, speaker:x.item?.speaker, file:x.item?.file, score:x.score, reasons:x.reasons }));
  return {
    ok: !!best,
    selected: best?.item || null,
    selectedIndex: best?.idx ?? -1,
    score: best?.score || 0,
    reasons: best?.reasons || [],
    signals,
    runnerUp,
    considered: manifest?.length || 0,
    decidedAt: new Date().toISOString(),
    rule: 'biome + race/lineage/category + gender identity + context/mood deterministic source scoring'
  };
}

export function summarizeDecision(decision){
  if(!decision?.selected) return 'Voice source bot has not selected a model/sample yet.';
  const s=decision.selected;
  const why=(decision.reasons||[]).join('; ') || 'highest deterministic source score';
  return `Bot selected ${s.speaker || 'source'} — ${s.phrase || s.tag || 'sample'}\nPath: ${s.file}\nScore: ${decision.score}\nWhy: ${why}`;
}
