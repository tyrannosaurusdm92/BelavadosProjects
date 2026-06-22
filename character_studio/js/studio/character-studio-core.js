
(() => {
'use strict';
const APP = JSON.parse(document.getElementById('app-data').textContent);
const VOICE_RACE = JSON.parse(document.getElementById('voice-race-data').textContent);
const VOICE_CLASS = JSON.parse(document.getElementById('voice-class-data').textContent);
const VOICE_GENDER = JSON.parse(document.getElementById('voice-gender-data').textContent);
const VOICE_BIOME = JSON.parse(document.getElementById('voice-biome-data').textContent);
const $ = (id) => document.getElementById(id);
const norm = (s='') => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const key = (s='') => norm(s).replace(/\s+/g,'_');
const clamp = (n,min,max) => Math.min(max,Math.max(min,Number.isFinite(+n)?+n:min));
const titleCase = (s='') => String(s).replace(/\w\S*/g, t => t[0].toUpperCase()+t.slice(1).toLowerCase());
const unique = (arr) => [...new Set((arr||[]).filter(Boolean))];
const parseJson = (text) => { try { return JSON.parse(text); } catch { return null; } };
function setOptions(el, items, valueFn=x=>x, labelFn=x=>x, placeholder='') {
  const node = typeof el === 'string' ? $(el) : el;
  const opts = [];
  if (placeholder) opts.push(`<option value="">${escapeHtml(placeholder)}</option>`);
  opts.push(...(items||[]).map(x => `<option value="${escapeHtml(valueFn(x))}">${escapeHtml(labelFn(x))}</option>`));
  node.innerHTML = opts.join('');
}
function escapeHtml(str) { return String(str ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s])); }
function hashSeed(str) { let h=2166136261; for(const ch of String(str||'Belavados')) { h ^= ch.charCodeAt(0); h = Math.imul(h,16777619); } return h>>>0; }
function seeded(seed) { let x=hashSeed(seed); return () => { x += 0x6D2B79F5; let t=x; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function pick(arr, rnd=Math.random) { const a=(arr||[]).filter(Boolean); return a.length?a[Math.floor(rnd()*a.length)]:''; }

let lastCharacter = null;
let lastVoice = null;
let statState = null;
let alignmentMode = 'auto';
let manualAlignmentAxes = null;

const AXIS_STEP = 250;
const AXIS_MIN = 0;
const AXIS_MAX = 3000;
const axisDirections = {
  altruism: {negative:'selfish', positive:'altruistic', axisLine:'selfish-neutral-altruistic'},
  lawfulness: {negative:'chaotic', positive:'lawful', axisLine:'chaotic-neutral-lawful'},
  cooperation: {negative:'combative', positive:'cooperative', axisLine:'combative-neutral-cooperative'},
  honor: {negative:'pragmatic', positive:'honorable', axisLine:'pragmatic-neutral-honorable'}
};
function roundAxisValue(value) {
  return Math.round(clamp(Number(value), AXIS_MIN, AXIS_MAX) / AXIS_STEP) * AXIS_STEP;
}
function normaliseAxes(source) {
  if (!source || typeof source !== 'object') return null;
  const axes = {};
  Object.keys(axisNames).forEach(axis => {
    const raw = source[axis] ?? source[axisNames[axis]] ?? source[axis.toUpperCase?.()] ?? source[axis.charAt(0).toUpperCase()+axis.slice(1)];
    if (Number.isFinite(Number(raw))) axes[axis] = roundAxisValue(raw);
  });
  return Object.keys(axes).length ? {...{altruism:1500,lawfulness:1500,cooperation:1500,honor:1500}, ...axes} : null;
}
function axisObjectFromJson(obj) {
  const candidates = [
    obj?.alignment?.axes,
    obj?.alignment?.progress,
    obj?.alignment?.axisProgress,
    obj?.alignment,
    obj?.progress?.alignment,
    obj?.manualAlignment,
    obj?.alignmentAxes,
    obj?.axes,
    obj
  ];
  for (const candidate of candidates) {
    const axes = normaliseAxes(candidate);
    if (axes) return axes;
  }
  return null;
}

const racesByName = new Map((APP.races||[]).map(r=>[r.name,r]));
const racesByNorm = new Map((APP.races||[]).map(r=>[norm(r.name),r]));
const raceCategories = APP.categories || [];
const classNames = Object.keys(APP.core?.classes || {});
const backgrounds = APP.core?.backgrounds || [];
const schools = APP.core?.schools || ['Abjuration','Conjuration','Divination','Enchantment','Evocation','Illusion','Necromancy','Transmutation'];
const factions = APP.factions || [];
const biomeMenu = APP.raceCacheSource?.biomeMenu || {};
const genderNames = (VOICE_GENDER.genderIdentities||[]).map(g=>g.name);
const voiceRaceOverlays = VOICE_RACE.raceOverlays || [];
const voiceClassOverlays = VOICE_CLASS.classes || [];
const voiceGenderOverlays = VOICE_GENDER.genderIdentities || [];
const voiceBiomeProfiles = VOICE_BIOME.biomeProfiles || [];

const axisNames = {altruism:'Altruism', lawfulness:'Lawfulness', cooperation:'Cooperation', honor:'Honor'};
const statNames = ['STR','DEX','CON','INT','WIS','CHA'];
const voiceSliderSpecs = [
  ['pitch','Voice Height','deep','balanced','bright'],['speed','Speaking Speed','slow','measured','quick'],['inflection','Expression Shape','flat','natural','melodic'],['stutter','Hesitations','steady','occasional','frequent'],['breath','Breath','crisp','soft','airy'],['roughness','Texture','smooth','textured','gravelly'],['resonance','Resonance','thin','rounded','booming'],['formality','Formality','casual','polite','ceremonial'],['vowelFlow','Vowel Flow','clipped','balanced','flowing'],['consonantBite','Consonant Bite','soft','clear','sharp'],['throatDepth','Throat Depth','light','grounded','deep'],['clarity','Clarity','murmured','clear','crystal'],['warmth','Warmth','cool','kind','radiant'],['projection','Projection','intimate','present','commanding'],['accentColor','Accent Color','subtle','present','strong']
];

function initTabs() {
  document.querySelectorAll('.tab-btn, .page-tab').forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.tab || btn.dataset.pageTab)));
}
function showTab(name) {
  const mapped = name === 'character-generator' ? 'character' : name === 'voice-studio' ? 'voice' : name;
  document.querySelectorAll('.tab-btn, .page-tab').forEach(btn => {
    const btnName = btn.dataset.tab || btn.dataset.pageTab;
    const btnMapped = btnName === 'character-generator' ? 'character' : btnName === 'voice-studio' ? 'voice' : btnName;
    const active = btnMapped === mapped;
    btn.setAttribute('aria-selected', String(active));
    btn.classList.toggle('dark', active);
    btn.classList.toggle('is-active', active);
  });
  document.querySelectorAll('[data-page-panel], #page-character, #page-voice').forEach(page => {
    const panel = page.dataset.pagePanel || page.id.replace(/^page-/, '');
    const panelMapped = panel === 'character-generator' ? 'character' : panel === 'voice-studio' ? 'voice' : panel;
    page.classList.toggle('active', panelMapped === mapped);
  });
  window.scrollTo({top:0, behavior:'smooth'});
}
function showTab(name) {
  const aliases = {'character-generator':'character','character-forge':'forge','voice-studio':'voice'};
  const mapped = aliases[name] || name;
  document.querySelectorAll('.tab-btn, .page-tab').forEach(btn => {
    const raw = btn.dataset.tab || btn.dataset.pageTab;
    const active = (aliases[raw] || raw) === mapped;
    btn.setAttribute('aria-selected', String(active));
    btn.classList.toggle('dark', active);
    btn.classList.toggle('is-active', active);
  });
  document.querySelectorAll('[data-page-panel]').forEach(page => {
    const raw = page.dataset.pagePanel || page.id.replace(/^page-/, '');
    page.classList.toggle('active', (aliases[raw] || raw) === mapped);
  });
  window.scrollTo({top:0,behavior:'smooth'});
}

function racesForCategory(catLabel) {
  if (!catLabel) return APP.races||[];
  return (APP.races||[]).filter(r => r.category === catLabel);
}
function raceObj(name) { return racesByName.get(name) || racesByNorm.get(norm(name)) || (APP.races||[]).find(r => norm(r.name).includes(norm(name)) || norm(name).includes(norm(r.name))) || null; }
function classObj(name) { return APP.core?.classes?.[name] || null; }
function alignmentClass(name) { return (APP.alignment?.classes||[]).find(c => c.value===name || c.label===name) || null; }
function subclassObj(className, subName) { const c=alignmentClass(className); return (c?.subclasses||[]).find(s => s.value===subName || s.label===subName) || null; }
function populateRaceSelects() {
  setOptions('raceCategory', raceCategories, c=>c.category, c=>`${c.category} — ${c.god||''}`);
  setOptions('race2Category', raceCategories, c=>c.category, c=>`${c.category} — ${c.god||''}`);
  $('raceCategory').value = raceCategories[0]?.category || '';
  $('race2Category').value = raceCategories[1]?.category || $('raceCategory').value;
  updateRaceOptions('raceCategory','raceSelect');
  updateRaceOptions('race2Category','race2Select');
}
function updateRaceOptions(categoryId, selectId) {
  const races = racesForCategory($(categoryId).value);
  setOptions(selectId, races, r=>r.name, r=>r.name);
}
function populateClasses(prefix='') {
  setOptions(prefix+'primaryClass', classNames, x=>x, x=>x);
}
function populateClassSelects() {
  setOptions('primaryClass', classNames, x=>x, x=>x);
  setOptions('secondaryClass', classNames, x=>x, x=>x, 'No secondary class');
  setOptions('magicSchool', schools, x=>x, x=>x);
  updateSubclassOptions('primaryClass','primarySubclass');
  updateSubclassOptions('secondaryClass','secondarySubclass');
}
function updateSubclassOptions(classId, subclassId) {
  const cn = $(classId).value;
  const subs = classObj(cn)?.subclasses || alignmentClass(cn)?.subclasses?.map(s=>s.label||s.value) || [];
  setOptions(subclassId, subs.length?subs:['Core / No Subclass'], x=>x, x=>x);
}
function populateBiomes() {
  const groups = Object.keys(biomeMenu);
  setOptions('biomeCategory', groups, x=>x, x=>x);
  updateBiomeOptions();
}
function updateBiomeOptions() {
  setOptions('biomeSelect', biomeMenu[$('biomeCategory').value] || [], x=>x, x=>x);
}
function populateMisc() {
  setOptions('genderIdentity', genderNames, x=>x, x=>x, 'Custom / not listed');
  setOptions('backgroundSelect', backgrounds, b=>typeof b==='string'?b:(b.name||b.id), b=>typeof b==='string'?b:(b.name||b.id));
  setOptions('tier1Faction', factions, f=>f.name, f=>`${f.name} — ${f.primarySeat||f.role||''}`);
}
function populateVoiceFields() {
  setOptions('voiceGender', genderNames, x=>x, x=>x, 'Custom / not listed');
  setOptions('voiceRace', APP.races||[], r=>r.name, r=>r.name, 'Custom / not listed');
  setOptions('voiceClass', classNames, x=>x, x=>x, 'Custom / not listed');
  setOptions('voiceBiome', voiceBiomeProfiles, b=>b.biome, b=>`${b.biome} — ${b.fantasyAccentName}`, 'No biome accent');
  updateVoiceSubclassOptions();
}
function updateVoiceSubclassOptions() {
  const cn=$('voiceClass').value;
  const cls=voiceClassOverlays.find(c=>norm(c.name)===norm(cn));
  const subs = (cls?.subclasses||[]).map(s=>s.name || s.label || s.id);
  const fallback = classObj(cn)?.subclasses || [];
  setOptions('voiceSubclass', subs.length?subs:fallback, x=>x, x=>x, 'Core / no subclass');
}
function initVoiceSliders() {
  $('voiceSliders').innerHTML = voiceSliderSpecs.map(([id,label,lo,mid,hi]) => `<div class="slider-card"><header><span>${escapeHtml(label)}</span><output id="${id}Out">5.0</output></header><input id="v_${id}" type="range" min="0" max="10" step="0.1" value="5"><div class="hint small">${lo} • ${mid} • ${hi}</div></div>`).join('');
  voiceSliderSpecs.forEach(([id]) => $('v_'+id).addEventListener('input', () => { $(id+'Out').textContent = Number($('v_'+id).value).toFixed(1); refreshVoiceExport(); }));
}
function currentLineage() {
  const main = $('raceSelect').value;
  const second = $('race2Enabled').value === 'yes' ? $('race2Select').value : '';
  return unique([main, second]);
}
function selectedClassBundle() {
  const multi = $('multiEnabled').value === 'yes';
  let primaryLevel = clamp(parseInt($('primaryLevel').value||'8',10),1,8);
  let secondaryLevel = multi ? clamp(parseInt($('secondaryLevel').value||'1',10),1,3) : 0;
  if (multi) {
    if (primaryLevel + secondaryLevel !== 8) primaryLevel = 8 - secondaryLevel;
    primaryLevel = clamp(primaryLevel,5,7);
    $('primaryLevel').value = primaryLevel;
    $('secondaryLevel').value = secondaryLevel;
  } else { primaryLevel = 8; secondaryLevel = 0; $('primaryLevel').value=8; }
  $('totalLevel').value = primaryLevel + secondaryLevel;
  return {
    primaryClass:$('primaryClass').value,
    primarySubclass:$('primarySubclass').value,
    primaryLevel,
    multiclass:multi,
    secondaryClass: multi ? $('secondaryClass').value : '',
    secondarySubclass: multi ? $('secondarySubclass').value : '',
    secondaryLevel,
    magicSchool:$('magicSchool').value
  };
}
function makeCharacter() {
  const lineage=currentLineage();
  const races=lineage.map(raceObj).filter(Boolean);
  const cls=selectedClassBundle();
  const primary = raceObj($('raceSelect').value);
  const bg = $('backgroundSelect').value;
  const alignment = computeAlignment(races, cls);
  const stats = statState || generateStats(false);
  const character = {
    schema:'belavados.characterVoiceMerged.v1',
    generatedAt:new Date().toISOString(),
    identity:{name:$('characterName').value.trim(), playerName:$('playerName').value.trim(), pronouns:$('pronouns').value.trim(), genderIdentity:$('genderIdentity').value, seedWord:$('seedWord').value.trim()},
    lineage:{raceCategory:$('raceCategory').value, race1:$('raceSelect').value, race2Enabled:$('race2Enabled').value==='yes', race2:$('race2Enabled').value==='yes' ? $('race2Select').value : '', raceCombination:lineage, creatorGods:unique(races.map(r=>r.creatorGod)), biomeCategory:$('biomeCategory').value, originBiome:$('biomeSelect').value},
    classBuild:cls,
    background:bg,
    factionAssociation:{automaticTier2:'The Nefaric Veil', tier1:$('tier1Faction').value, tier0Notes:$('tier0Notes').value.trim()},
    stats,
    alignment,
    notes:{raceSummary:races.map(r=>({name:r.name, category:r.category, traits:r.canonTraits, abilities:r.belavadosAbilities, tendency:r.typicalPlayTendency})), classSummary:classSummary(cls)}
  };
  lastCharacter = character;
  return character;
}
function computeAlignment(races, cls) {
  const autoAxes = {altruism:1500, lawfulness:1500, cooperation:1500, honor:1500};
  const weights=[];
  races.forEach(r=>{ if(r?.axis) weights.push({w:1.15, axis:r.axis}); });
  const ac=alignmentClass(cls.primaryClass); if(ac?.effects) weights.push({w:.72, axis:ac.effects});
  const as=subclassObj(cls.primaryClass,cls.primarySubclass); if(as?.effects) weights.push({w:.42, axis:as.effects});
  if(cls.multiclass) {
    const sc=alignmentClass(cls.secondaryClass); if(sc?.effects) weights.push({w:.32, axis:sc.effects});
    const ss=subclassObj(cls.secondaryClass,cls.secondarySubclass); if(ss?.effects) weights.push({w:.22, axis:ss.effects});
  }
  Object.keys(autoAxes).forEach(a=>{
    let sum=1500, total=1;
    weights.forEach(item=>{ const v=item.axis?.[a]; if(Number.isFinite(+v)) { sum += +v*item.w; total += item.w; } });
    autoAxes[a]=roundAxisValue(sum/total);
  });
  const axes = alignmentMode === 'manual' && manualAlignmentAxes ? {...autoAxes, ...manualAlignmentAxes} : autoAxes;
  Object.keys(axes).forEach(a=>axes[a]=roundAxisValue(axes[a]));
  const labels = Object.fromEntries(Object.entries(axes).map(([a,v])=>[a, axisLabel(a,v)]));
  return {mode: alignmentMode, step: AXIS_STEP, min: AXIS_MIN, max: AXIS_MAX, axes, progress:{...axes}, labels, summary:Object.entries(labels).map(([a,l])=>`${axisNames[a]}: ${l}`).join(' • ')};
}
function axisLabel(axis,val) {
  const meta = axisDirections[axis] || {negative:'negative', positive:'positive'};
  const v = roundAxisValue(val);
  if (v <= 0) return `extremely ${meta.negative}`;
  if (v <= 250) return `very ${meta.negative}`;
  if (v <= 500) return `moderately ${meta.negative}`;
  if (v <= 750) return `slightly ${meta.negative}`;
  if (v === 1000) return 'moderately neutral';
  if (v === 1250) return 'very neutral';
  if (v === 1500) return 'extremely neutral';
  if (v === 1750) return 'slightly neutral';
  if (v === 2000) return `slightly ${meta.positive}`;
  if (v === 2250) return `moderately ${meta.positive}`;
  if (v === 2500) return `very ${meta.positive}`;
  return `extremely ${meta.positive}`;
}
function generateStats(update=true) {
  const cls = selectedClassBundle();
  const priority = classObj(cls.primaryClass)?.priority || ['DEX','CON','WIS','CHA','INT','STR'];
  const base = [15,14,13,12,10,8];
  const stats = Object.fromEntries(statNames.map(s=>[s,8]));
  priority.forEach((s,i)=>{ stats[s]=base[i]||10; });
  currentLineage().map(raceObj).filter(Boolean).forEach((r,idx)=>{
    const scores = r.sheet?.scores || {};
    Object.entries(scores).forEach(([s,v])=>{ if(stats[s] && Number.isFinite(+v)) stats[s]+= idx? Math.ceil(+v/2):+v; });
  });
  Object.keys(stats).forEach(s=>stats[s]=clamp(stats[s],3,20));
  statState = stats;
  if(update) renderAll();
  return stats;
}
function mod(v) { const m=Math.floor((v-10)/2); return (m>=0?'+':'')+m; }
function classSummary(cls) {
  const a=classObj(cls.primaryClass)||{};
  const b=cls.multiclass ? classObj(cls.secondaryClass)||{} : null;
  return {
    primaryFeatures:a.features||[], primarySkills:a.skills||[], saves:a.saves||[], hitDie:a.hitDie||'', spellAbility:a.ability||'',
    secondaryFeatures:b?.features||[], secondarySkills:b?.skills||[]
  };
}
function renderAll() {
  const c = makeCharacter();
  renderBadges(c); renderStats(c); renderAxes(c); renderRaceNotes(c); renderFeatureNotes(c); renderClassRules(c); renderExport(c); updatePageResourceMirrors(c);
}
function renderBadges(c) {
  $('currentBuildBadges').innerHTML = [c.identity.name||'Unnamed', ...c.lineage.raceCombination, c.classBuild.primaryClass, c.classBuild.multiclass?c.classBuild.secondaryClass:null, c.lineage.originBiome].filter(Boolean).map((x,i)=>`<span class="tag ${i===0?'gold':''}">${escapeHtml(x)}</span>`).join('');
  $('statusLine').textContent = `${c.lineage.raceCombination.join(' + ') || 'No lineage'} • ${c.classBuild.primaryClass} ${c.classBuild.primarySubclass} • ${c.background || 'No background'}`;
}
function renderStats(c) {
  const html = statNames.map(s=>`<div class="stat"><span>${s}</span><b>${c.stats[s]}</b><small>${mod(c.stats[s])}</small></div>`).join('');
  const statGrid = $('statGrid'); if (statGrid) statGrid.innerHTML = html;
  const generatorStatsMirror = $('generatorStatsMirror'); if (generatorStatsMirror) generatorStatsMirror.innerHTML = html;
}
function renderAxes(c) {
  const axes = c.alignment.axes || {};
  $('axisBars').innerHTML = Object.entries(axes).map(([a,v])=>{
    const label = c.alignment.labels?.[a] || axisLabel(a,v);
    const meta = axisDirections[a] || {axisLine:'neutral'};
    const ticks = Array.from({length:13},(_,i)=>i*250).map(n=>`<option value="${n}"></option>`).join('');
    return `<div class="axis" data-axis="${a}"><div class="axis-top"><strong>${axisNames[a]} Axis</strong><span class="axis-readout" data-axis-readout="${a}">${v} / 3000 — ${escapeHtml(label)}</span></div><small>${escapeHtml(meta.axisLine)}</small><progress class="axis-progress" max="3000" value="${v}">${v}</progress><input class="alignment-slider" data-alignment-axis="${a}" type="range" min="0" max="3000" step="250" value="${v}" list="alignmentTicks-${a}" aria-label="${axisNames[a]} alignment score"><datalist id="alignmentTicks-${a}">${ticks}</datalist></div>`;
  }).join('');
  $('alignmentSummary').textContent = `${c.alignment.summary} • Mode: ${c.alignment.mode === 'manual' ? 'manual sliders' : 'JSON/auto progress'}`;
  document.querySelectorAll('[data-alignment-axis]').forEach(input => {
    input.addEventListener('input', () => {
      alignmentMode = 'manual';
      manualAlignmentAxes = manualAlignmentAxes || {...axes};
      manualAlignmentAxes[input.dataset.alignmentAxis] = roundAxisValue(input.value);
      input.value = manualAlignmentAxes[input.dataset.alignmentAxis];
      const label = axisLabel(input.dataset.alignmentAxis, input.value);
      const readout = document.querySelector(`[data-axis-readout="${input.dataset.alignmentAxis}"]`);
      if (readout) readout.textContent = `${input.value} / 3000 — ${label}`;
      const progress = input.parentElement?.querySelector('progress');
      if (progress) progress.value = input.value;
      const updated = makeCharacter();
      $('alignmentSummary').textContent = `${updated.alignment.summary} • Mode: manual sliders`;
      renderExport(updated); updatePageResourceMirrors(updated);
    });
  });
}
function renderRaceNotes(c) {
  const races = c.lineage.raceCombination.map(raceObj).filter(Boolean);
  $('raceNotes').innerHTML = races.map(r=>`<article class="mini-card"><h3>${escapeHtml(r.name)}</h3><p><strong>Category:</strong> ${escapeHtml(r.category)}<br><strong>Creator God:</strong> ${escapeHtml(r.creatorGod)}<br><strong>Tendency:</strong> ${escapeHtml(r.typicalPlayTendency||'')}</p><p>${escapeHtml(r.description||'')}</p><p><strong>Traits:</strong> ${escapeHtml(r.canonTraits||r.sheet?.traitsText||'')}</p><p><strong>Belavadös abilities:</strong> ${escapeHtml(r.belavadosAbilities||'')}</p></article>`).join('') || '<p class="muted">Choose a race to see notes.</p>';
}
function renderFeatureNotes(c) {
  const s=classSummary(c.classBuild);
  const feats = unique([...(s.primaryFeatures||[]), ...(s.secondaryFeatures||[])]);
  const skills = unique([...(s.primarySkills||[]), ...(s.secondarySkills||[])]);
  $('featureNotes').innerHTML = `<p><strong>Saves:</strong> ${escapeHtml((s.saves||[]).join(', ')||'—')}<br><strong>Hit Die:</strong> d${escapeHtml(s.hitDie||'—')}<br><strong>Spell Ability:</strong> ${escapeHtml(s.spellAbility||'—')}</p><h3>Suggested Features</h3><ul class="compact-list">${feats.map(f=>`<li>${escapeHtml(f)}</li>`).join('') || '<li>—</li>'}</ul><h3>Suggested Skills</h3><p>${escapeHtml(skills.join(', ')||'—')}</p>`;
}
function renderClassRules(c) {
  const cls=c.classBuild;
  $('classRules').innerHTML = `<strong>Level rule:</strong> ${cls.multiclass ? `Primary ${cls.primaryClass} level ${cls.primaryLevel} + Secondary ${cls.secondaryClass} level ${cls.secondaryLevel} = Level 8.` : `${cls.primaryClass} level 8 single-class build.`}<br><strong>Subclass path:</strong> ${escapeHtml(cls.primarySubclass || 'Core')}${cls.multiclass ? ' / '+escapeHtml(cls.secondarySubclass||'Core') : ''}`;
}
function renderExport(c) { $('characterExport').value = JSON.stringify(c,null,2); }
function refreshExport() { renderAll(); }

const starts = ['Ael','Bel','Cael','Dra','Eld','Faer','Ghal','Ily','Kael','Lun','Myr','Nym','Or','Pyr','Quel','Ryn','Sar','Thal','Um','Vael','Wyr','Zan'];
const mids = ['a','ae','ar','en','eth','ia','il','in','ir','ol','or','ra','ryn','sha','th','ul','un','va','vor'];
const endsM = ['dor','ran','thor','vek','mir','dan','ros','karn','voss','thyr','drin'];
const endsF = ['ara','elle','ira','anna','wyn','oria','essa','aia','yra','vess','thia'];
const endsN = ['en','is','or','iel','ryn','eth','ari','uin','ael','ash','ix'];
const surnameLeft = ['Iron','Storm','Mist','Night','Cinder','Aether','Brass','Thorn','Moon','Star','Gloom','River','Oath','Gear','Ash','Frost','Veil','Dawn'];
const surnameRight = ['vale','forge','keeper','song','ward','spire','brook','thorn','gale','wheel','crest','whisper','mark','fall','water','root','mantle'];
const honorifics = ['Captain','Adept','Warden','Seeker','Magister','Keeper','Wayfarer','Professor','Marshal','Archivist'];
const epithets = ['the Brass-Touched','the Mist-Walker','the Oath-Bound','the Star-Marked','the River-Heart','the Veil-Sighted','the Thorn-Sworn'];
function nameBitsFrom(text) { return unique(norm(text).split(' ').filter(w=>w.length>2).map(w=>titleCase(w.slice(0,4)))); }
function generateNames() {
  const c=makeCharacter();
  const rnd=seeded([c.identity.seedWord,c.lineage.raceCombination.join('+'),c.classBuild.primaryClass,c.classBuild.primarySubclass,Date.now()].filter(Boolean).join('|'));
  const count=clamp(parseInt($('nameCount').value||'6',10),1,20);
  const names=[];
  for(let i=0;i<count;i++) names.push(generateOneName(c,i,rnd));
  $('nameResults').innerHTML = names.map(n=>`<article class="name-card"><h3>${escapeHtml(n.full)}</h3><p class="small muted">${escapeHtml(n.cues.join(' • '))}</p><button class="gray" data-name="${escapeHtml(n.full)}">Use This Name</button></article>`).join('');
  $('nameResults').querySelectorAll('button[data-name]').forEach(btn=>btn.addEventListener('click',()=>{ $('characterName').value=btn.dataset.name; renderAll(); }));
}
function generateOneName(c,i,rnd) {
  const raceText = c.lineage.raceCombination.join(' ') + ' ' + c.lineage.creatorGods.join(' ') + ' ' + (c.notes.raceSummary||[]).map(r=>r.tendency+' '+r.traits).join(' ');
  const classText = `${c.classBuild.primaryClass} ${c.classBuild.primarySubclass} ${c.classBuild.secondaryClass||''} ${c.classBuild.secondarySubclass||''} ${c.classBuild.magicSchool}`;
  const rb=nameBitsFrom(raceText), cb=nameBitsFrom(classText);
  const gender=norm(c.identity.genderIdentity);
  let endPool = gender.includes('female')&&!gender.includes('male')?endsF:gender.includes('male')&&!gender.includes('female')?endsM:endsN;
  const sPool = unique([...starts, ...rb.slice(0,5), ...cb.slice(0,2)]);
  const mPool = unique([...mids, ...rb.slice(1,5).map(x=>x.toLowerCase().slice(0,2)), ...cb.slice(0,3).map(x=>x.toLowerCase().slice(0,2))]);
  const ePool = unique([...endPool, ...cb.slice(0,3).map(x=>x.toLowerCase().slice(-3))]);
  let first = pick(sPool,rnd)+pick(mPool,rnd)+pick(ePool,rnd);
  if($('fantasyMarks').value==='yes' && rnd()<.16) first = first.slice(0,Math.max(2,Math.floor(first.length/2)))+'’'+first.slice(Math.max(2,Math.floor(first.length/2)));
  const mode=$('surnameStyle').value;
  let left = mode==='class'?pick([...surnameLeft,...cb],rnd):mode==='race'?pick([...surnameLeft,...rb],rnd):pick([...surnameLeft,...rb.slice(0,3),...cb.slice(0,3)],rnd);
  let right = mode==='class'?pick([...surnameRight,...cb.map(x=>x.toLowerCase())],rnd):pick([...surnameRight,...rb.map(x=>x.toLowerCase()).slice(0,4)],rnd);
  let last = titleCase(left)+titleCase(right);
  if($('fantasyMarks').value==='yes' && rnd()<.14) last = titleCase(left)+'-'+titleCase(right);
  let full = `${first} ${last}`;
  const epiMode=$('epithets').value;
  if(epiMode!=='no' && rnd() < (epiMode==='often'?.55:.25)) full = `${pick(honorifics,rnd)} ${full}`;
  if(epiMode!=='no' && rnd() < (epiMode==='often'?.45:.20)) full = `${full}, ${pick([...epithets, ...cb.map(x=>'the '+x+'-Marked')],rnd)}`;
  return {full, cues:unique([c.lineage.raceCombination.join(' + '), c.classBuild.primaryClass, c.classBuild.primarySubclass, c.lineage.originBiome]).filter(Boolean)};
}
function randomCoreBuild() {
  $('raceCategory').selectedIndex=Math.floor(Math.random()*$('raceCategory').options.length); updateRaceOptions('raceCategory','raceSelect'); $('raceSelect').selectedIndex=Math.floor(Math.random()*$('raceSelect').options.length);
  $('race2Enabled').value=Math.random()<.35?'yes':'no'; $('race2Category').selectedIndex=Math.floor(Math.random()*$('race2Category').options.length); updateRaceOptions('race2Category','race2Select'); $('race2Select').selectedIndex=Math.floor(Math.random()*$('race2Select').options.length);
  $('genderIdentity').selectedIndex=Math.floor(Math.random()*$('genderIdentity').options.length);
  $('primaryClass').selectedIndex=Math.floor(Math.random()*$('primaryClass').options.length); updateSubclassOptions('primaryClass','primarySubclass'); $('primarySubclass').selectedIndex=Math.floor(Math.random()*$('primarySubclass').options.length);
  $('multiEnabled').value=Math.random()<.25?'yes':'no'; $('secondaryClass').selectedIndex=Math.floor(Math.random()*$('secondaryClass').options.length); updateSubclassOptions('secondaryClass','secondarySubclass'); $('secondarySubclass').selectedIndex=Math.floor(Math.random()*$('secondarySubclass').options.length);
  $('biomeCategory').selectedIndex=Math.floor(Math.random()*$('biomeCategory').options.length); updateBiomeOptions(); $('biomeSelect').selectedIndex=Math.floor(Math.random()*$('biomeSelect').options.length);
  $('backgroundSelect').selectedIndex=Math.floor(Math.random()*$('backgroundSelect').options.length);
  statState=null; generateStats(false); generateNames(); renderAll();
}

function overlayObj(list, name, nameField='name') { return (list||[]).find(x=>norm(x[nameField])===norm(name)) || (list||[]).find(x=>norm(x[nameField]).includes(norm(name)) || norm(name).includes(norm(x[nameField]))); }
function classOverlay(className) { return overlayObj(voiceClassOverlays,className); }
function subclassOverlay(className, subName) { const c=classOverlay(className); return (c?.subclasses||[]).find(s=>norm(s.name||s.label||s.id)===norm(subName)) || null; }
function raceOverlay(name) { return overlayObj(voiceRaceOverlays,name); }
function genderOverlay(name) { return overlayObj(voiceGenderOverlays,name); }
function biomeOverlay(name) { return voiceBiomeProfiles.find(b=>norm(b.biome)===norm(name)) || voiceBiomeProfiles.find(b=>norm(b.biome).includes(norm(name)) || norm(name).includes(norm(b.biome))); }

function isConstructVoiceRace(name='') {
  return /construct|constructed|artificial|warforged|autognome|clockwork|modron|robot|android|machine|automaton|gearforged|metal/i.test(String(name||''));
}
function naturalizeVoiceTraits(traits={}, race='') {
  const out={...traits};
  const construct=isConstructVoiceRace(race);
  if (construct) {
    out.humanVariation = clamp(Math.min(out.humanVariation ?? 4, 4.5), 0, 10);
    out.clarity = clamp(Math.max(out.clarity ?? 6, 6.8), 0, 10);
    out.formality = clamp(Math.max(out.formality ?? 6, 6.8), 0, 10);
    out.resonance = clamp(Math.max(out.resonance ?? 6, 6.4), 0, 10);
    out.rhythm = clamp(Math.min(out.rhythm ?? 5, 4.6), 0, 10);
  } else {
    out.humanVariation = clamp(Math.max(out.humanVariation ?? 7, 7.2), 0, 10);
    out.warmth = clamp(Math.max(out.warmth ?? 5, 5.8), 0, 10);
    out.clarity = clamp(Math.max(out.clarity ?? 6, 6.0), 0, 10);
    out.accentColor = clamp(Math.max(out.accentColor ?? 7, 7.0), 0, 10);
    out.roughness = clamp(Math.min(out.roughness ?? 4, 6.6), 0, 10);
    out.stutter = clamp(Math.min(out.stutter ?? 1, 5.4), 0, 10);
  }
  return out;
}
function safeSpeechControlsFromTraits(traits={}) {
  const p=Number(traits.pitch ?? 5), sp=Number(traits.speed ?? 5), inf=Number(traits.inflection ?? 5), res=Number(traits.resonance ?? 5), breath=Number(traits.breath ?? 5), proj=Number(traits.projection ?? 5);
  const rate = clamp(.99 + (sp-5)*.020 + (inf-5)*.003, .84, 1.15);
  const pitch = clamp(1 + (p-5)*.010 + (inf-5)*.0025 - Math.max(0,res-6)*.003 + Math.max(0,breath-7)*.002, .955, 1.075);
  const volume = clamp(.92 + (proj-5)*.012, .66, 1);
  return { rate:+rate.toFixed(3), pitch:+pitch.toFixed(3), volume:+volume.toFixed(3) };
}
function buildVoiceNpcObject() {
  return {
    name:$('voiceName')?.value?.trim() || 'Unnamed Voice',
    race:$('voiceRace')?.value || '',
    genderIdentity:$('voiceGender')?.value || '',
    class:$('voiceClass')?.value || '',
    subclass:$('voiceSubclass')?.value || '',
    biome:$('voiceBiome')?.value || '',
    personality:$('voiceNotes')?.value || ''
  };
}
function getBiomeAccentForVoice(profile={}, npc=buildVoiceNpcObject()) {
  if (window.BelavadosBiomeAccents?.applyAccent) {
    try {
      const applied = window.BelavadosBiomeAccents.applyAccent(profile, npc, { biomeKey:npc.biome, influence:100 });
      return { biomeAccent:applied.accent || null, accentCadence:applied.cadence || {}, accentedProfile:applied.profile || profile };
    } catch(err) { console.warn('Biome accent resolve failed', err); }
  }
  const bo = biomeOverlay(npc.biome);
  return { biomeAccent: bo ? { name:bo.fantasyAccentName || bo.biome || '', biome:bo.biome || npc.biome, influence:100, voiceLangHints:bo.voiceLangHints || [] } : null, accentCadence:{}, accentedProfile:profile };
}
function shapeVoicePreviewText(text='', npc=buildVoiceNpcObject(), accent=null, traits={}) {
  let phrase = String(text || 'Voice preview ready.').replace(/\s+/g,' ').trim() || 'Voice preview ready.';
  const construct = isConstructVoiceRace(npc.race);
  if (!construct && window.BelavadosVoiceHumanization?.humanizeAccentText) {
    try { phrase = window.BelavadosVoiceHumanization.humanizeAccentText(phrase, npc, accent) || phrase; } catch {}
  }
  const accentName = String(accent?.name || '').split(/\s+/)[0];
  if (!construct && accentName) {
    const maps = {
      Mirecurl:[[ /this/gi,'dis'],[/what/gi,'whaat'],[/sound/gi,'sowwn'],[/like/gi,'lahk'],[/voice/gi,'voys']],
      Reefglass:[[ /this/gi,'thi-su'],[/what/gi,'wa-tu'],[/sound/gi,'soun-do'],[/like/gi,'rai-ku'],[/voice/gi,'voisu']],
      Tidecrest:[[ /this/gi,'dees'],[/what/gi,'wot'],[/sound/gi,'sownd'],[/like/gi,'lyke'],[/voice/gi,'voyce']],
      Stonehollow:[[ /this/gi,'thys'],[/what/gi,'wot'],[/sound/gi,'sownd'],[/like/gi,'liek'],[/voice/gi,'voys']],
      Rootmere:[[ /this/gi,'zis'],[/what/gi,'vhat'],[/sound/gi,'zound'],[/voice/gi,'foyce']],
      Bramblewood:[[ /this/gi,'thes'],[/what/gi,'wot'],[/sound/gi,'zound'],[/like/gi,'loike'],[/voice/gi,'voize'],[/ing/gi,"in'"]]
    };
    (maps[accentName] || []).forEach(([re,to])=>{ phrase=phrase.replace(re,to); });
    if(/aquatic|dril/i.test(npc.race||'')) phrase=phrase.replace(/sound/gi,'saound');
    if(/elf|elven|drow/i.test(npc.race||'')) phrase=phrase.replace(/th/gi,'dh');
    if(/orc/i.test(npc.race||'')) phrase=phrase.replace(/like/gi,'lyk');
  }
  if (construct) phrase = phrase.replace(/\s+/g,' • ').replace(/[.!?]+$/,'') + ' •';
  return phrase.replace(/\s+/g,' ').trim();
}
function traitSource(obj) { return obj?.overlayTraits || obj?.baseTraits || {}; }
function blendTraits(parts) {
  const out={}; const totals={};
  voiceSliderSpecs.forEach(([id])=>{ out[id]=5; totals[id]=1; });
  parts.forEach(([obj,w])=>{ const t=traitSource(obj); if(!t)return; voiceSliderSpecs.forEach(([id])=>{ const v=t[id]; if(Number.isFinite(+v)) { out[id]+= +v*w; totals[id]+=w; } }); });
  voiceSliderSpecs.forEach(([id])=>out[id]=Math.round(clamp(out[id]/totals[id],0,10)*10)/10);
  if (out.stutter > 6) out.stutter = 6;
  return out;
}
function buildVoiceProfile(source='manual') {
  const race=$('voiceRace').value, cls=$('voiceClass').value, sub=$('voiceSubclass').value, gender=$('voiceGender').value, biome=$('voiceBiome').value;
  const ro=raceOverlay(race), co=classOverlay(cls), so=subclassOverlay(cls,sub), go=genderOverlay(gender), bo=biomeOverlay(biome);
  const traits = naturalizeVoiceTraits(blendTraits([[ro,.55],[co,.38],[so,.28],[go,.18],[bo,.30]]), race);
  applyVoiceTraits(traits);
  lastVoice = makeVoiceExport(source);
  renderVoice(lastVoice);
}
function applyVoiceTraits(traits) {
  voiceSliderSpecs.forEach(([id])=>{ const node=$('v_'+id); if(node) { node.value=clamp(traits[id] ?? 5,0,10); $(id+'Out').textContent=Number(node.value).toFixed(1); } });
}
function readVoiceTraits() { return Object.fromEntries(voiceSliderSpecs.map(([id])=>[id, Number($('v_'+id).value)])); }
function makeVoiceExport(source='manual') {
  const traits=readVoiceTraits();
  const profile={
    schema:'belavados.voiceProfile.v1', source, generatedAt:new Date().toISOString(),
    name:$('voiceName').value.trim(), race:$('voiceRace').value, genderIdentity:$('voiceGender').value, className:$('voiceClass').value, subclass:$('voiceSubclass').value, biome:$('voiceBiome').value, alignment:$('voiceAlignment').value.trim(), notes:$('voiceNotes').value.trim(),
    fantasyAccentName: biomeOverlay($('voiceBiome').value)?.fantasyAccentName || '',
    sliders:traits,
    descriptors:voiceDescriptors(traits),
    speechApiPreview:safeSpeechControlsFromTraits(traits),
    speechPreviewEngine: window.BelavadosSpeechApi ? 'BelavadosSpeechApi + naturalness guard' : 'Browser SpeechSynthesis safe fallback',
    qualityGuard:{ roboticAllowed:isConstructVoiceRace($('voiceRace').value), pitchRange:'0.955–1.075', rateRange:'0.84–1.15', nonConstructHumanVariationMinimum:7.2 }
  };
  lastVoice=profile; return profile;
}
function voiceDescriptors(t) {
  const word=(id,lo,mid,hi)=> t[id]<3.7?lo:t[id]>6.7?hi:mid;
  return {
    pitch:word('pitch','deep','balanced','bright'), speed:word('speed','slow','measured','quick'), inflection:word('inflection','restrained','natural','melodic'), roughness:word('roughness','smooth','textured','gravelly'), resonance:word('resonance','thin','rounded','booming'), formality:word('formality','casual','polite','ceremonial'), warmth:word('warmth','cool','warm','radiant'), clarity:word('clarity','murmured','clear','crisp')
  };
}
function renderVoice(v) {
  $('voiceBadges').innerHTML = [v.name||'Unnamed voice', v.race, v.className, v.subclass, v.fantasyAccentName].filter(Boolean).map((x,i)=>`<span class="tag ${i===0?'gold':''}">${escapeHtml(x)}</span>`).join('');
  $('voiceStatus').textContent = `${v.source} profile ready • ${v.descriptors.pitch} pitch • ${v.descriptors.speed} speed • ${v.descriptors.roughness} texture`;
  $('voiceSummary').innerHTML = `<div class="notice ok"><strong>${escapeHtml(v.name||'Voice Profile')}</strong><br>${escapeHtml(v.race||'Custom race')} • ${escapeHtml(v.className||'Custom class')} • ${escapeHtml(v.fantasyAccentName||'No biome accent')}</div><p><strong>Performance:</strong> ${escapeHtml(Object.entries(v.descriptors).map(([k,val])=>`${titleCase(k)} ${val}`).join(' • '))}</p><p><strong>Notes:</strong> ${escapeHtml(v.notes || 'No notes supplied.')}</p><p class="muted small">Gender identity overlay is treated as optional fictional performance style only, not biological determinism or a rule for real people.</p>`;
  $('voiceExport').value = JSON.stringify(v,null,2);
  updatePageResourceMirrors(lastCharacter || null);
}
function refreshVoiceExport() { renderVoice(makeVoiceExport(lastVoice?.source || 'manual-edited')); }

function setSelectIfPresent(id, value) {
  const node = $(id); if (!node || value === undefined || value === null || value === '') return false;
  const normalized = norm(value);
  const found = Array.from(node.options || []).find(o => o.value === value || norm(o.value) === normalized || norm(o.textContent) === normalized);
  if (found) { node.value = found.value; return true; }
  return false;
}
function briefStatHtml(stats) {
  return statNames.map(s=>`<div class="stat"><span>${s}</span><b>${stats?.[s] ?? '—'}</b><small>${Number.isFinite(stats?.[s]) ? mod(stats[s]) : ''}</small></div>`).join('');
}
function updatePageResourceMirrors(c) {
  c = c || lastCharacter || makeCharacter();
  const voice = lastVoice || makeVoiceExport('mirror-preview');
  const htmlList = (items) => `<ul class="compact-list">${items.filter(Boolean).map(i=>`<li>${escapeHtml(i)}</li>`).join('') || '<li>—</li>'}</ul>`;
  const badgeHtml = [c.identity.name||'Unnamed', ...c.lineage.raceCombination, c.classBuild.primaryClass, c.classBuild.primarySubclass, c.lineage.originBiome, voice?.fantasyAccentName].filter(Boolean).map((x,i)=>`<span class="tag ${i===0?'gold':''}">${escapeHtml(x)}</span>`).join('');
  if ($('forgeResourceBadges')) $('forgeResourceBadges').innerHTML = badgeHtml;
  if ($('forgeStatus')) $('forgeStatus').textContent = `${c.identity.name || 'Unnamed character'} • ${c.alignment.summary} • voice source: ${voice?.source || 'manual'}`;
  if ($('forgeSkillsSummary')) {
    const s = classSummary(c.classBuild);
    $('forgeSkillsSummary').innerHTML = `<h3>Suggested Skills</h3><p>${escapeHtml(unique([...(s.primarySkills||[]), ...(s.secondarySkills||[])]).join(', ')||'—')}</p><h3>Suggested Features</h3>${htmlList(unique([...(s.primaryFeatures||[]), ...(s.secondaryFeatures||[])]))}`;
  }
  if ($('forgeBuildReview')) {
    $('forgeBuildReview').innerHTML = `<article class="mini-card"><h3>${escapeHtml(c.identity.name || 'Unnamed Character')}</h3><p><strong>Identity:</strong> ${escapeHtml(c.identity.genderIdentity || '—')} • ${escapeHtml(c.identity.pronouns || 'no pronouns entered')}</p><p><strong>Lineage:</strong> ${escapeHtml(c.lineage.raceCombination.join(' + ') || '—')} from ${escapeHtml(c.lineage.originBiome || '—')}</p><p><strong>Class:</strong> ${escapeHtml(c.classBuild.primaryClass || '—')} ${escapeHtml(c.classBuild.primarySubclass || '')}</p><p><strong>Alignment:</strong> ${escapeHtml(c.alignment.summary || '—')}</p></article>`;
  }
  if ($('forgeGeneratorMirror')) {
    $('forgeGeneratorMirror').innerHTML = `<p><strong>Name Forge:</strong> ${escapeHtml(c.identity.name || 'No name selected yet.')}</p><p><strong>Identity + Lineage:</strong> ${escapeHtml(c.identity.genderIdentity || '—')} • ${escapeHtml(c.lineage.raceCombination.join(' + ') || '—')} • ${escapeHtml(c.lineage.originBiome || '—')}</p><p><strong>Class + Subclass:</strong> ${escapeHtml(c.classBuild.primaryClass || '—')} / ${escapeHtml(c.classBuild.primarySubclass || '—')}</p><p><strong>Belavadös Axes:</strong> ${escapeHtml(c.alignment.summary || '—')}</p>`;
  }
  if ($('forgeVoiceMirror')) {
    $('forgeVoiceMirror').innerHTML = `<p><strong>Voice Name:</strong> ${escapeHtml(voice?.name || $('voiceName')?.value || '—')}</p><p><strong>Voice Identity:</strong> ${escapeHtml($('voiceGender')?.value || '—')} • ${escapeHtml($('voiceRace')?.value || '—')} • ${escapeHtml($('voiceBiome')?.value || '—')}</p><p><strong>Voice Class:</strong> ${escapeHtml($('voiceClass')?.value || '—')} / ${escapeHtml($('voiceSubclass')?.value || '—')}</p><p><strong>Exact speech text:</strong> ${escapeHtml(($('previewText')?.value || '').slice(0,260))}${($('previewText')?.value || '').length>260?'…':''}</p>`;
  }
  if ($('voiceNameForgeMirror')) $('voiceNameForgeMirror').innerHTML = `<p><strong>Generator name:</strong> ${escapeHtml(c.identity.name || 'No generated name selected yet.')}</p><p class="muted">Use “Load From Character Tab” or “Copy Applicable Resources from Pages 1 & 2” to apply it.</p>`;
  if ($('voiceIdentityMirror')) $('voiceIdentityMirror').innerHTML = `<p><strong>Generator lineage:</strong> ${escapeHtml(c.lineage.raceCombination.join(' + ') || '—')}</p><p><strong>Generator biome:</strong> ${escapeHtml(c.lineage.originBiome || '—')}</p><p><strong>Pronouns:</strong> ${escapeHtml(c.identity.pronouns || '—')}</p>`;
  if ($('voiceClassMirror')) $('voiceClassMirror').innerHTML = `<p><strong>Generator class:</strong> ${escapeHtml(c.classBuild.primaryClass || '—')} ${escapeHtml(c.classBuild.primarySubclass || '')}</p><p><strong>Magic school:</strong> ${escapeHtml(c.classBuild.magicSchool || '—')}</p>`;
  if ($('voiceAlignmentAxesMirror')) {
    $('voiceAlignmentAxesMirror').innerHTML = Object.entries(c.alignment.axes||{}).map(([a,v])=>`<div class="axis"><div class="axis-top"><strong>${axisNames[a]} Axis</strong><span>${v} / 3000 — ${escapeHtml(c.alignment.labels?.[a] || axisLabel(a,v))}</span></div><progress class="axis-progress" max="3000" value="${v}">${v}</progress></div>`).join('') + `<p class="muted">${escapeHtml(c.alignment.summary || '')}</p>`;
  }
  if ($('voiceRaceNotesMirror')) $('voiceRaceNotesMirror').innerHTML = (c.notes.raceSummary||[]).map(r=>`<article class="mini-card"><h3>${escapeHtml(r.name)}</h3><p><strong>Tendency:</strong> ${escapeHtml(r.tendency||'—')}</p><p><strong>Traits:</strong> ${escapeHtml(r.traits||'—')}</p><p><strong>Abilities:</strong> ${escapeHtml(r.abilities||'—')}</p></article>`).join('') || '<p class="muted">Choose a race on the generator page or the voice page.</p>';
  if ($('voiceClassFeaturesMirror')) {
    const s = classSummary(c.classBuild);
    $('voiceClassFeaturesMirror').innerHTML = `<p><strong>Saves:</strong> ${escapeHtml((s.saves||[]).join(', ')||'—')}<br><strong>Hit Die:</strong> d${escapeHtml(s.hitDie||'—')}<br><strong>Spell Ability:</strong> ${escapeHtml(s.spellAbility||'—')}</p><h3>Suggested Features</h3>${htmlList(unique([...(s.primaryFeatures||[]), ...(s.secondaryFeatures||[])]))}`;
  }
}
function copyGeneratorToVoiceOnly(stayOnCurrentTab=false) {
  const c = makeCharacter();
  $('voiceName').value = c.identity.name || '';
  setSelectIfPresent('voiceGender', c.identity.genderIdentity);
  setSelectIfPresent('voiceRace', c.lineage.race1 || c.lineage.raceCombination?.[0]);
  setSelectIfPresent('voiceClass', c.classBuild.primaryClass);
  updateVoiceSubclassOptions();
  setSelectIfPresent('voiceSubclass', c.classBuild.primarySubclass);
  const biome = (voiceBiomeProfiles.find(b=>norm(b.biome)===norm(c.lineage.originBiome)) || voiceBiomeProfiles.find(b=>norm(c.lineage.originBiome).includes(norm(b.biome)) || norm(b.biome).includes(norm(c.lineage.originBiome))));
  setSelectIfPresent('voiceBiome', biome?.biome || c.lineage.originBiome);
  $('voiceAlignment').value = c.alignment.summary || '';
  $('voiceNotes').value = `Lineage: ${c.lineage.raceCombination.join(' + ')}\nClass: ${c.classBuild.primaryClass} ${c.classBuild.primarySubclass}\nBackground: ${c.background}\nTraits: ${(c.notes.raceSummary||[]).map(r=>r.traits).filter(Boolean).join('; ')}`;
  buildVoiceProfile('copied-from-generator-and-forge');
  if (!stayOnCurrentTab) showTab('voice');
}
function copyVoiceToGeneratorFields() {
  if ($('voiceName')?.value) $('characterName').value = $('voiceName').value;
  setSelectIfPresent('genderIdentity', $('voiceGender')?.value);
  setSelectIfPresent('raceSelect', $('voiceRace')?.value);
  setSelectIfPresent('primaryClass', $('voiceClass')?.value); updateSubclassOptions('primaryClass','primarySubclass');
  setSelectIfPresent('primarySubclass', $('voiceSubclass')?.value);
  setSelectIfPresent('biomeSelect', $('voiceBiome')?.value);
  renderAll();
}
function copyForgeSpeechToVoiceNotes() {
  const line = $('previewText')?.value.trim();
  if (!line) return;
  const current = $('voiceNotes')?.value.trim();
  $('voiceNotes').value = current ? `${current}\n\nExact line from Character Forge:\n${line}` : `Exact line from Character Forge:\n${line}`;
  buildVoiceProfile('forge-speech-line');
  updatePageResourceMirrors();
}

function loadCharacterToVoice() {
  copyGeneratorToVoiceOnly(true);
  showTab('voice');
}
function importVoiceJson(obj) {
  const c=obj.identity && obj.lineage ? obj : null;
  if(c) {
    $('voiceName').value=c.identity.name||''; $('voiceGender').value=c.identity.genderIdentity||''; $('voiceRace').value=c.lineage.race1||c.lineage.raceCombination?.[0]||''; $('voiceClass').value=c.classBuild?.primaryClass||''; updateVoiceSubclassOptions(); $('voiceSubclass').value=c.classBuild?.primarySubclass||''; $('voiceBiome').value=c.lineage.originBiome||''; $('voiceAlignment').value=c.alignment?.summary||''; $('voiceNotes').value=JSON.stringify(c.notes||{},null,2); buildVoiceProfile('imported-character-json');
  } else {
    $('voiceNotes').value = JSON.stringify(obj,null,2);
    if(obj.name) $('voiceName').value=obj.name;
    if(obj.race) $('voiceRace').value=obj.race;
    if(obj.className||obj.class) $('voiceClass').value=obj.className||obj.class;
    updateVoiceSubclassOptions();
    buildVoiceProfile('imported-json-notes');
  }
}
function speakPreview() {
  const v=makeVoiceExport(lastVoice?.source || 'manual-preview-placeholder'); renderVoice(v);
  if($('voiceStatus')) $('voiceStatus').textContent='Voice preview placeholder active — speech synthesis has been removed for replacement integration.';
}

function downloadText(filename, text, type='application/json') {
  const blob=new Blob([text],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=filename; document.body.append(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },0);
}
async function copyText(text, statusId) { try { await navigator.clipboard.writeText(text); if(statusId) $(statusId).textContent='Copied.'; } catch { if(statusId) $(statusId).textContent='Copy failed; select and copy manually.'; } }
function safeName(s,fallback='belavados-export') { return (s||fallback).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||fallback; }
function importCharacterJson(obj) {
  if (!obj || typeof obj !== 'object') return false;
  const setIf = (id, value) => { const el=$(id); if(el && value !== undefined && value !== null) el.value = value; };
  setIf('characterName', obj.identity?.name ?? obj.name);
  setIf('playerName', obj.identity?.playerName);
  setIf('pronouns', obj.identity?.pronouns);
  setIf('genderIdentity', obj.identity?.genderIdentity);
  setIf('seedWord', obj.identity?.seedWord);
  if (obj.lineage) {
    setIf('raceCategory', obj.lineage.raceCategory);
    updateRaceOptions('raceCategory','raceSelect');
    setIf('raceSelect', obj.lineage.race1 ?? obj.lineage.raceCombination?.[0]);
    setIf('race2Enabled', obj.lineage.race2Enabled ? 'yes' : 'no');
    setIf('race2Category', obj.lineage.race2Category ?? obj.lineage.raceCategory);
    updateRaceOptions('race2Category','race2Select');
    setIf('race2Select', obj.lineage.race2 ?? obj.lineage.raceCombination?.[1]);
    setIf('biomeCategory', obj.lineage.biomeCategory);
    updateBiomeOptions();
    setIf('biomeSelect', obj.lineage.originBiome);
  }
  if (obj.classBuild) {
    setIf('primaryClass', obj.classBuild.primaryClass);
    updateSubclassOptions('primaryClass','primarySubclass');
    setIf('primarySubclass', obj.classBuild.primarySubclass);
    setIf('primaryLevel', obj.classBuild.primaryLevel);
    setIf('multiEnabled', obj.classBuild.multiclass ? 'yes' : 'no');
    setIf('secondaryClass', obj.classBuild.secondaryClass);
    updateSubclassOptions('secondaryClass','secondarySubclass');
    setIf('secondarySubclass', obj.classBuild.secondarySubclass);
    setIf('secondaryLevel', obj.classBuild.secondaryLevel);
    setIf('magicSchool', obj.classBuild.magicSchool);
  }
  setIf('backgroundSelect', obj.background);
  setIf('tier1Faction', obj.factionAssociation?.tier1);
  setIf('tier0Notes', obj.factionAssociation?.tier0Notes);
  if (obj.stats && typeof obj.stats === 'object') statState = Object.fromEntries(statNames.map(s=>[s, clamp(obj.stats[s],3,20)]));
  const axes = axisObjectFromJson(obj);
  if (axes) {
    alignmentMode = 'manual';
    manualAlignmentAxes = axes;
  }
  renderAll();
  if (axes) $('statusLine').textContent = 'Imported character JSON and alignment progress in 250-point steps.';
  return true;
}

function wireEvents() {
  $('raceCategory').addEventListener('change',()=>{ updateRaceOptions('raceCategory','raceSelect'); statState=null; renderAll(); });
  $('race2Category').addEventListener('change',()=>{ updateRaceOptions('race2Category','race2Select'); statState=null; renderAll(); });
  $('biomeCategory').addEventListener('change',()=>{ updateBiomeOptions(); renderAll(); });
  ['raceSelect','race2Enabled','race2Select','genderIdentity','backgroundSelect','tier1Faction','tier0Notes','characterName','playerName','pronouns','seedWord','magicSchool'].forEach(id=>$(id).addEventListener('input',()=>{ statState=null; renderAll(); }));
  $('primaryClass').addEventListener('change',()=>{ updateSubclassOptions('primaryClass','primarySubclass'); statState=null; renderAll(); });
  $('secondaryClass').addEventListener('change',()=>{ updateSubclassOptions('secondaryClass','secondarySubclass'); statState=null; renderAll(); });
  ['primarySubclass','multiEnabled','secondarySubclass','primaryLevel','secondaryLevel'].forEach(id=>$(id).addEventListener('input',()=>{ statState=null; renderAll(); }));
  $('generateNameBtn').addEventListener('click',generateNames); $('generateNameBtn2').addEventListener('click',generateNames); $('randomCoreBtn').addEventListener('click',randomCoreBuild); $('sendToVoiceBtn').addEventListener('click',loadCharacterToVoice);
  $('rerollStatsBtn').addEventListener('click',()=>{ statState=null; generateStats(); }); $('refreshExportBtn').addEventListener('click',refreshExport);
  $('copyCharacterJsonBtn').addEventListener('click',()=>copyText($('characterExport').value));
  $('downloadCharacterJsonBtn').addEventListener('click',()=>{ const c=makeCharacter(); downloadText(safeName(c.identity.name,'belavados-character')+'.json', JSON.stringify(c,null,2)); });
  $('voiceClass').addEventListener('change',()=>{ updateVoiceSubclassOptions(); buildVoiceProfile('manual'); updatePageResourceMirrors(); });
  ['voiceName','voiceGender','voiceRace','voiceSubclass','voiceBiome','voiceAlignment','voiceNotes'].forEach(id=>$(id).addEventListener('input',()=>{ buildVoiceProfile('manual'); updatePageResourceMirrors(); }));
  ['voiceGender','voiceRace','voiceSubclass','voiceBiome'].forEach(id=>$(id).addEventListener('change',()=>{ buildVoiceProfile('manual'); updatePageResourceMirrors(); }));
  $('loadCharacterVoiceBtn').addEventListener('click',loadCharacterToVoice); $('buildVoiceBtn').addEventListener('click',()=>buildVoiceProfile('manual'));
  $('speakPreviewBtn').addEventListener('click',speakPreview); $('stopSpeakBtn').addEventListener('click',()=>{ if($('voiceStatus')) $('voiceStatus').textContent='Voice placeholder stopped.'; });
  $('copyVoiceJsonBtn').addEventListener('click',()=>copyText($('voiceExport').value));
  $('downloadVoiceJsonBtn').addEventListener('click',()=>downloadText(safeName($('voiceName').value,'belavados-voice')+'.json',$('voiceExport').value));
  $('downloadVoiceJsBtn').addEventListener('click',()=>{ const v=makeVoiceExport(lastVoice?.source||'manual'); const js='window.BELAVADOS_EXPORTED_VOICE_PROFILE = '+JSON.stringify(v,null,2)+';\n'; downloadText(safeName(v.name,'belavados-voice')+'.js',js,'text/javascript'); });
  const characterJsonFile = $('characterJsonFile');
  if (characterJsonFile) characterJsonFile.addEventListener('change',ev=>{ const file=ev.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{ const obj=parseJson(reader.result); if(obj) importCharacterJson(obj); else $('statusLine').textContent='Could not parse that character/alignment JSON file.'; }; reader.readAsText(file); });
  $('voiceJsonFile').addEventListener('change',ev=>{ const file=ev.target.files?.[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{ const obj=parseJson(reader.result); if(obj) importVoiceJson(obj); else $('voiceStatus').textContent='Could not parse that JSON file.'; }; reader.readAsText(file); });
  const copyToGeneratorBtn = $('copyToGeneratorFromForgeVoice'); if (copyToGeneratorBtn) copyToGeneratorBtn.addEventListener('click',()=>{ copyVoiceToGeneratorFields(); copyForgeSpeechToVoiceNotes(); showTab('character'); });
  const copyToForgeBtn = $('copyToForgeFromGeneratorVoice'); if (copyToForgeBtn) copyToForgeBtn.addEventListener('click',()=>{ renderAll(); buildVoiceProfile('forge-merge-refresh'); updatePageResourceMirrors(); showTab('forge'); });
  const copyToVoiceBtn = $('copyToVoiceFromGeneratorForge'); if (copyToVoiceBtn) copyToVoiceBtn.addEventListener('click',()=>{ copyGeneratorToVoiceOnly(true); copyForgeSpeechToVoiceNotes(); showTab('voice'); });
  const copyForgeSpeechBtn = $('copyForgeSpeechToVoiceBtn'); if (copyForgeSpeechBtn) copyForgeSpeechBtn.addEventListener('click',copyForgeSpeechToVoiceNotes);
  const forgeSpeakBtn = $('forgeSpeakPreviewBtn'); if (forgeSpeakBtn) forgeSpeakBtn.addEventListener('click',speakPreview);
  const copyExactSpeechBtn = $('copyExactSpeechBtn'); if (copyExactSpeechBtn) copyExactSpeechBtn.addEventListener('click',()=>copyText($('previewText').value));
  const previewText = $('previewText'); if (previewText) previewText.addEventListener('input',()=>updatePageResourceMirrors());
}
function init() {
  initTabs(); populateRaceSelects(); populateClassSelects(); populateBiomes(); populateMisc(); populateVoiceFields(); initVoiceSliders(); wireEvents(); generateStats(false); renderAll(); generateNames(); buildVoiceProfile('manual');
}
init();
})();
