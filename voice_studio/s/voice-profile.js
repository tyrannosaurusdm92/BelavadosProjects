export const SLIDER_DEFS = [
  ['pitch','Pitch',5],['speed','Speed',5],['inflection','Inflection',5],['stutter','Stutter',0],['breath','Breath',3],['roughness','Roughness',3],['nasal','Nasal',2],['timbre','Timbre Brightness',5],['formant','Formant Depth',5],['emphasis','Emphasis',5],['emotion','Emotion',5],['accent','Accent Strength',6],['ageWear','Age / Wear',3],['phrase','Phrase Shape',5],['construct','Construct Texture',0]
];
export const MOODS = ['Neutral/Base','Kindness','Compassion','Tenderness','Joy','Excitement','Calm','Annoyance','Sarcasm','Suspicion','Gruffness','Anger','Rage','Betrayal','Grief','Fear','Boss battle','Panic','Weapon attack','Exhaustion','Authority','Dungeon fight','Courage','Shame','Awe','Confidence','Flirtation','Menace','Wonder','Casting'];
export const CONTEXTS = ['Campfire conversation','Tavern negotiation','Dungeon whisper','Combat command','Spellcasting','Boss monologue','Shopkeeper pitch','Quest exposition','Secret confession','Threat warning','Ritual chant','Travel banter','Injury/pain','Victory','Defeat','Mourning','Romantic aside','Comic relief','Ancient lore','Call-and-response'];

const raceOverlayRules = [
  [/elf|eladrin|drow|shadar|kaluseban|fae|fairy/i, { pitch:.45, timbre:.9, roughness:-.8, inflection:.7, breath:.4, label:'Elven/fey smoothing: airier, musical, more precise.' }],
  [/dwarf|duergar|gnome|stone|earth/i, { pitch:-.75, formant:.9, roughness:.5, speed:-.35, label:'Dwarven/stone density: lower, resonant, clipped.' }],
  [/orc|goblin|bugbear|gnoll|goliath|minotaur/i, { pitch:-.45, roughness:1.2, emphasis:.8, speed:-.15, label:'Brutish/giantkin force: rougher, direct, heavier.' }],
  [/halfling|kender|smallfolk|jaspey|geisamahi|gandirosha/i, { pitch:.55, speed:.45, inflection:.7, roughness:-.3, label:'Smallfolk warmth: friendlier, quicker, more animated.' }],
  [/triton|merfolk|dril|tamhiogal|water|sea|aquatic|locathah/i, { breath:.9, inflection:.55, speed:-.2, roughness:-.5, label:'Aquatic flow: breathy, fluid, wave-like.' }],
  [/warforged|construct|autognome|relic|geppettin|wechselkind/i, { construct:2.2, pitch:-.1, inflection:-.5, roughness:.3, label:'Construct articulation: measured, metallic, less organic.' }],
  [/dragon|kobold|lizard|yuan|tortle/i, { roughness:.85, formant:.5, emphasis:.5, label:'Reptilian/draconic rasp: firmer consonants, growled resonance.' }],
  [/beast|tabaxi|leonin|vulpin|harengon|bear|canisar|loxodon|deorbasun/i, { inflection:.55, roughness:.35, emphasis:.4, label:'Beastfolk texture: expressive, physical, instinctive.' }]
];

const classRules = [
  [/barbarian|berserker|rage/i,{roughness:1.1,emphasis:1.2,speed:.2,label:'Barbarian thunder.'}],
  [/bard|singer|performer|shanty|story/i,{inflection:1.1,phrase:1.1,timbre:.5,label:'Bard theatrical cadence.'}],
  [/cleric|priest|paladin|ritual|holy/i,{speed:-.35,emphasis:.6,breath:.3,phrase:.55,label:'Ceremonial divine pacing.'}],
  [/druid|ranger|scout|warden/i,{speed:-.15,breath:.45,inflection:.25,label:'Natural practical calm.'}],
  [/fighter|captain|warrior|guard/i,{speed:-.1,emphasis:.9,phrase:-.2,label:'Command-short martial delivery.'}],
  [/monk/i,{speed:-.05,inflection:-.25,breath:-.15,emphasis:.35,label:'Controlled monk restraint.'}],
  [/rogue|thief|spy|assassin/i,{speed:.65,breath:.15,emphasis:-.15,phrase:.25,label:'Hushed quick rogue phrasing.'}],
  [/sorcerer|warlock|witch/i,{inflection:.85,timbre:.7,breath:.45,label:'Arcane incandescent/lilted tone.'}],
  [/wizard|scholar|mage|artificer/i,{speed:-.2,inflection:.2,emphasis:.35,phrase:-.1,label:'Precise learned articulation.'}]
];

const moodDeltas = {
  'Kindness':{pitch:.2,speed:-.15,breath:.35,roughness:-.25,emotion:.5},'Compassion':{pitch:.1,speed:-.35,breath:.55,roughness:-.35,emotion:.7},'Tenderness':{pitch:.15,speed:-.45,breath:.7,roughness:-.45,emotion:.65},
  'Joy':{pitch:.75,speed:.45,inflection:1,emotion:.9},'Excitement':{pitch:.9,speed:.8,inflection:1.2,emphasis:.6,emotion:1},'Calm':{pitch:-.1,speed:-.55,inflection:-.45,breath:.1,emotion:-.25},
  'Annoyance':{pitch:.15,speed:.25,roughness:.45,emphasis:.45,emotion:.45},'Sarcasm':{pitch:-.05,speed:-.05,inflection:1.1,nasal:.45,emotion:.3},'Suspicion':{pitch:-.25,speed:-.35,inflection:.45,breath:.25,emotion:.35},
  'Gruffness':{pitch:-.55,speed:-.25,roughness:1.2,formant:.5},'Anger':{pitch:.25,speed:.45,roughness:1.2,emphasis:1.2,emotion:1.1},'Rage':{pitch:.45,speed:.9,roughness:1.9,emphasis:1.8,emotion:1.7},
  'Betrayal':{pitch:-.1,speed:-.25,roughness:.55,breath:.55,emotion:1.2},'Grief':{pitch:-.45,speed:-.75,breath:1.2,roughness:.35,emotion:1.1},'Fear':{pitch:.85,speed:.55,breath:1.2,stutter:1,emotion:1.2},
  'Boss battle':{pitch:-.25,speed:.25,roughness:1.1,emphasis:1.4,emotion:.9},'Panic':{pitch:1.2,speed:1.2,breath:1.5,stutter:1.5,emotion:1.4},'Weapon attack':{speed:.65,roughness:.8,emphasis:1.4,phrase:-.5},
  'Exhaustion':{pitch:-.55,speed:-.9,breath:1.4,roughness:.65,emotion:-.2},'Authority':{pitch:-.35,speed:-.25,roughness:.3,emphasis:1.1,phrase:-.45},'Dungeon fight':{speed:.45,breath:.45,roughness:.65,emphasis:.8},
  'Courage':{pitch:.15,speed:.1,emphasis:1,emotion:.75},'Shame':{pitch:-.35,speed:-.5,breath:.7,emphasis:-.4,emotion:.65},'Awe':{pitch:.45,speed:-.4,breath:.9,inflection:.8,emotion:.9},
  'Confidence':{pitch:-.05,speed:.05,emphasis:.85,emotion:.55},'Flirtation':{pitch:.25,speed:-.25,breath:.65,inflection:.85,emotion:.75},'Menace':{pitch:-.8,speed:-.55,roughness:.85,emphasis:.65,emotion:.7},'Wonder':{pitch:.55,speed:-.25,breath:.65,inflection:.9,emotion:.8},'Casting':{pitch:.35,speed:-.15,inflection:1.2,breath:.4,emphasis:.75,emotion:.8}
};

const contextDeltas = {
  'Dungeon whisper':{speed:-.35,breath:.35,emphasis:-.45},'Combat command':{speed:.4,roughness:.4,emphasis:1},'Spellcasting':{inflection:1.1,phrase:.9,emotion:.5},'Boss monologue':{speed:-.25,emphasis:1.2,phrase:.65},'Shopkeeper pitch':{speed:.35,inflection:.7,phrase:.6},'Secret confession':{speed:-.45,breath:.75,emphasis:-.25},'Threat warning':{pitch:-.3,speed:-.15,roughness:.6,emphasis:.9},'Ritual chant':{speed:-.55,inflection:.75,phrase:1.2},'Travel banter':{speed:.15,inflection:.35},'Injury/pain':{speed:-.4,breath:.9,roughness:.7},'Victory':{pitch:.35,speed:.3,emphasis:.8},'Defeat':{pitch:-.45,speed:-.55,breath:.8},'Mourning':{pitch:-.55,speed:-.8,breath:1.1},'Romantic aside':{speed:-.3,breath:.6,inflection:.45},'Comic relief':{pitch:.5,speed:.5,inflection:1},'Ancient lore':{pitch:-.45,speed:-.55,formant:.7,phrase:.5},'Call-and-response':{emphasis:.7,phrase:.9}
};

function clamp(v,min=0,max=10){return Math.max(min,Math.min(max,v));}
function addDeltas(base, delta){for(const [k,v] of Object.entries(delta||{})){ if(k==='label') continue; base[k]=clamp((base[k] ?? 5)+v); }}
function stableHash(str){let h=2166136261; for(let i=0;i<str.length;i++){h^=str.charCodeAt(i); h=Math.imul(h,16777619);} return (h>>>0).toString(16);}
function identityPitch(identity){const s=(identity||'').toLowerCase(); if(s.includes('female')) return .8; if(s.includes('male')) return -.65; if(s.includes('agender')||s.includes('neutrois')||s.includes('non-binary')) return 0; return .05;}

export function buildVoiceProfile(input, biomeAccent, sourceItem, sliderOverrides={}){
  const sliders = Object.fromEntries(SLIDER_DEFS.map(([id,,def])=>[id, def]));
  const explanations=[];
  sliders.pitch = clamp(sliders.pitch + identityPitch(input.genderIdentity));
  for(const [rx, delta] of raceOverlayRules){ if(rx.test([input.race,input.lineage,input.category].join(' '))){ addDeltas(sliders,delta); explanations.push(delta.label); }}
  for(const [rx, delta] of classRules){ if(rx.test(input.classRole||'')){ addDeltas(sliders,delta); explanations.push(delta.label); }}
  addDeltas(sliders, moodDeltas[input.mood]);
  addDeltas(sliders, contextDeltas[input.context]);
  if(biomeAccent){
    if(/thai|japanese|hawaiian|portuguese|brazilian|italian|spanish|french/i.test(biomeAccent.baseAccent)) addDeltas(sliders,{inflection:.35,breath:.15});
    if(/russian|german|scottish|welsh|dutch/i.test(biomeAccent.baseAccent)) addDeltas(sliders,{roughness:.25,formant:.25,emphasis:.15});
    explanations.push(`${biomeAccent.fantasyAccent}: ${biomeAccent.finalFeel}`);
  }
  for(const [k,v] of Object.entries(sliderOverrides||{})){ sliders[k]=clamp(Number(v)); }
  const seed = stableHash(JSON.stringify({input, biomeAccent, sourceItem}));
  return {
    id:`VS-${seed}`,
    createdAt:new Date().toISOString(),
    character:{ name:input.name||'Unnamed Voice', genderIdentity:input.genderIdentity, category:input.category, race:input.race, lineage:input.lineage, classRole:input.classRole, personality:input.personality },
    accent: biomeAccent || null,
    mood: input.mood || 'Neutral/Base',
    context: input.context || 'Campfire conversation',
    sourceVoice: sourceItem || null,
    sliders,
    explanations,
    consentScope:'Fictional NPC / user-owned or permitted samples only',
    exportTargets:['backend-mp3-if-available','backend-wav-if-available','local-wav-fallback']
  };
}

export function describeProfile(profile){
  if(!profile) return 'No profile yet.';
  const c=profile.character;
  return `${c.name} — ${c.genderIdentity || 'unspecified identity'} ${c.race || 'character'}${c.lineage ? ' / '+c.lineage : ''}\nBiome voice: ${profile.accent?.fantasyAccent || 'none'} (${profile.accent?.baseAccent || 'neutral'})\nMood/context: ${profile.mood} / ${profile.context}\nSource: ${profile.sourceVoice?.speaker || profile.sourceVoice?.source || 'not selected'}\nCore feel: ${profile.accent?.finalFeel || 'custom'}\nRules: ${profile.explanations.join(' ')}`;
}

export function applyMoodAndContext(profile, mood, context){
  const copy=structuredClone(profile);
  copy.mood=mood; copy.context=context;
  return buildVoiceProfile({...copy.character, mood, context}, copy.accent, copy.sourceVoice, copy.sliders);
}
