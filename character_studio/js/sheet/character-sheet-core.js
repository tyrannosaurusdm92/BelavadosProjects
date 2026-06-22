

const APP_OPTIONS = {"classes":{"Barbarian":{"subclasses":["Berserker","Totem Warrior","Zealot","Wild Magic","Beast","Ancestral Guardian","Storm Herald"],"ability":"","hitDie":12,"saves":["STR","CON"],"features":["Rage","Unarmored Defense","Reckless Attack","Danger Sense"],"armor":["Light Armor","Medium Armor","Shields"],"weapons":["Simple Weapons","Martial Weapons"]},"Bard":{"subclasses":["Lore","Valor","Glamour","Whispers","Swords","Eloquence","Spirits","Creation"],"ability":"CHA","hitDie":8,"saves":["DEX","CHA"],"features":["Bardic Inspiration","Spellcasting","Jack of All Trades","Song of Rest"],"armor":["Light Armor"],"weapons":["Simple Weapons","Hand Crossbow","Longsword","Rapier","Shortsword"]},"Cleric":{"subclasses":["Life","Light","War","Trickery","Death","Grave","Twilight","Peace","Forge","Tempest","Knowledge","Nature","Arcana"],"ability":"WIS","hitDie":8,"saves":["WIS","CHA"],"features":["Spellcasting","Divine Domain","Channel Divinity"],"armor":["Light Armor","Medium Armor","Shields"],"weapons":["Simple Weapons"]},"Druid":{"subclasses":["Land","Moon","Dreams","Spores","Wildfire","Stars","Shepherd"],"ability":"WIS","hitDie":8,"saves":["INT","WIS"],"features":["Druidic","Spellcasting","Wild Shape"],"armor":["Light Armor","Medium Armor","Shields"],"weapons":["Club","Dagger","Dart","Javelin","Mace","Quarterstaff","Scimitar","Sickle","Sling","Spear"]},"Fighter":{"subclasses":["Champion","Battle Master","Eldritch Knight","Arcane Archer","Cavalier","Samurai","Rune Knight","Psi Warrior","Echo Knight"],"ability":"","hitDie":10,"saves":["STR","CON"],"features":["Fighting Style","Second Wind","Action Surge"],"armor":["Light Armor","Medium Armor","Heavy Armor","Shields"],"weapons":["Simple Weapons","Martial Weapons"]},"Monk":{"subclasses":["Open Hand","Shadow","Mercy","Four Elements","Kensei","Astral Self","Drunken Master","Long Death"],"ability":"WIS","hitDie":8,"saves":["STR","DEX"],"features":["Unarmored Defense","Martial Arts","Ki / Focus Points","Unarmored Movement"],"armor":[],"weapons":["Simple Weapons","Shortsword"]},"Paladin":{"subclasses":["Devotion","Ancients","Vengeance","Redemption","Oathbreaker","Glory","Conquest","Crown","Watchers"],"ability":"CHA","hitDie":10,"saves":["WIS","CHA"],"features":["Divine Sense","Lay on Hands","Divine Smite","Sacred Oath"],"armor":["Light Armor","Medium Armor","Heavy Armor","Shields"],"weapons":["Simple Weapons","Martial Weapons"]},"Ranger":{"subclasses":["Hunter","Beast Master","Gloom Stalker","Fey Wanderer","Horizon Walker","Swarmkeeper","Drakewarden","Monster Slayer"],"ability":"WIS","hitDie":10,"saves":["STR","DEX"],"features":["Favored Enemy","Natural Explorer","Fighting Style","Ranger Spellcasting"],"armor":["Light Armor","Medium Armor","Shields"],"weapons":["Simple Weapons","Martial Weapons"]},"Rogue":{"subclasses":["Thief","Assassin","Arcane Trickster","Swashbuckler","Mastermind","Phantom","Soulknife","Inquisitive","Scout"],"ability":"","hitDie":8,"saves":["DEX","INT"],"features":["Expertise","Sneak Attack","Thieves' Cant","Cunning Action"],"armor":["Light Armor"],"weapons":["Simple Weapons","Hand Crossbow","Longsword","Rapier","Shortsword"]},"Sorcerer":{"subclasses":["Wild Magic","Draconic","Divine Soul","Shadow","Clockwork","Aberrant Mind","Storm"],"ability":"CHA","hitDie":6,"saves":["CON","CHA"],"features":["Spellcasting","Sorcerous Origin","Font of Magic","Metamagic"],"armor":[],"weapons":["Dagger","Dart","Sling","Quarterstaff","Light Crossbow"]},"Warlock":{"subclasses":["Fiend","Archfey","Great Old One","Celestial","Hexblade","Undead","Genie","Fathomless"],"ability":"CHA","hitDie":8,"saves":["WIS","CHA"],"features":["Otherworldly Patron","Pact Magic","Eldritch Invocations"],"armor":["Light Armor"],"weapons":["Simple Weapons"]},"Wizard":{"subclasses":["Abjuration","Divination","Evocation","Illusion","Necromancy","Enchantment","Chronurgy","Graviturgy","Bladesinging","Scribes","War Magic"],"ability":"INT","hitDie":6,"saves":["INT","WIS"],"features":["Spellcasting","Arcane Recovery","Arcane Tradition"],"armor":[],"weapons":["Dagger","Dart","Sling","Quarterstaff","Light Crossbow"]},"Artificer":{"subclasses":["Alchemist","Armorer","Artillerist","Battle Smith"],"ability":"INT","hitDie":8,"saves":["CON","INT"],"features":["Magical Tinkering","Infuse Item","Artificer Spellcasting"],"armor":["Light Armor","Medium Armor","Shields"],"weapons":["Simple Weapons"]},"Blood Hunter":{"subclasses":["Ghostslayer","Lycan","Mutant","Profane Soul"],"ability":"INT","hitDie":10,"saves":["DEX","INT"],"features":["Hunter's Bane","Blood Maledict","Crimson Rite"],"armor":["Light Armor","Medium Armor","Shields"],"weapons":["Simple Weapons","Martial Weapons"]}},"raceByCategory":{"Humans, Near-Humans, and Mixed Heritage":["Human","Half-Elf","Half-Orc","Khoravar","Umbral Human"],"Elven Peoples":["Elf (Core Elves)","High Elf","Wood Elf","Drow (Underdark Elf)","Eladrin","Astral Elf","Sea Elf","Shadar-Kai","Pallid Elf","Star Elf (Lunar/Heavenly Lineage)","Avariel (Winged Elf)","Snow Elf (Frostbound Elf)","Sun Elf","Moon Elf","Shadowmoor Elf","Celestial Elf","Kaluseban","Elf","Lunar Elf"],"Dwarven and Gnomish Kin":["Dwarf","Duergar","Gnome","Deep Gnome","Autognome","Geisamahi"],"Halfling and Smallfolk":["Halfling","Kender","Kithkin","Qickstep","Hedge","Jerbeen"],"Orcs, Goblinoids, and Brutish Humanoids":["Orc","Goblin","Hobgoblin","Bugbear","Gnoll","Gobboc","Shadow Goblin"],"Giantkin and Powerful Humanoids":["Goliath","Firbolg","Cyclopian","Giff","Minotaur"],"Draconic and Reptilian Races":["Dragonborn","Kobold","Lizardfolk","Yuan-Ti"],"Celestial, Fiendish, and Planar Bloodlines":["Aasimar","Tiefling","Feral Tiefling","Hexblood","Accursed","Curseborn","Aburata"],"Undead and Death-Touched Races":["Dhampir","Darakhul","Reborn","Arisen","Graveborn","Shade","Downcast","Volsarii"],"Fey and Trickster Folk":["Faerie","Fairy","Changeling","Lorwyn Changeling","Satyr","Dreamer","Gandirosha"],"Elemental and Energy-Born Peoples":["Air Genasi","Earth Genasi","Fire Genasi","Water Genasi","Flamekin","Rimekin","Ashborn","Azureborn","Bogborn","Deepborn","Snowborn","Stoneborn","Panolima"],"Psionic, Astral, and Alien Minds":["Kalashtar","Githyanki","Githzerai","Plasmoid","Disembodied","Gwynis"],"Constructed and Artificial Beings":["Warforged","Geppettin","Relicborn","Wechselkind"],"Birdfolk and Avian Races":["Aarakocra","Kenku","Owlin","Ravenfolk","Corvum","Gallus","Strig","Feathren","Raptor"],"Beastfolk and Mammalian Anthropomorphs":["Harengon","Leonin","Loxodon","Tabaxi","Bearfolk","Canisar","Cervan","Erina","Mapach","Ratatosk","Rakin","Sattare","Vulpin","Deorbasun"],"Amphibious and Aquatic Peoples":["Triton","Locathah","Grung","Merfolk","Sahuagin","Lotol","Nakudama","Dril'thar","Tamhiogal","Dril’thar","Tamhiogals"],"Insectoid, Ooze, and Aberrant Creatures":["Thri-Kreen","Cnidarin","Oozekin","Opteran","Silkborn"],"Plantfolk and Nature-Bound Races":["Mandrake","Mycelian","Gnarlborn","Harvestborn","Jaspey","Jaspeys"],"Shadow, Umbral, and Darkness-Aligned Peoples":["Ombrask","Ruinbound","Blagueborn","Threadborn"],"Animalistic Hybrids and Experimental Races":["Simic Hybrid","Shifter","Verdan","Vedalken","Hadozee","Tortle"],"Primitive, Tribal, and Wilderness Humanoids":["Boggart","Centaur","Grudgel","Hederan","Laneshi","Terandus"],"Miscellaneous and Hard-to-Classify Races":["Dara","Golynn","Luma"]},"race2ByCategory":{"Humans, Near-Humans, and Mixed Heritage":["Human","Half-Elf","Half-Orc","Khoravar","Umbral Human"],"Elven Peoples":["Elf (Core Elves)","High Elf","Wood Elf","Drow (Underdark Elf)","Eladrin","Astral Elf","Sea Elf","Shadar-Kai","Pallid Elf","Star Elf (Lunar/Heavenly Lineage)","Avariel (Winged Elf)","Snow Elf (Frostbound Elf)","Sun Elf","Moon Elf","Shadowmoor Elf","Celestial Elf","Kaluseban","Elf","Lunar Elf"],"Dwarven and Gnomish Kin":["Dwarf","Duergar","Gnome","Deep Gnome","Autognome","Geisamahi"],"Halfling and Smallfolk":["Halfling","Kender","Kithkin","Qickstep","Hedge","Jerbeen"],"Orcs, Goblinoids, and Brutish Humanoids":["Orc","Goblin","Hobgoblin","Bugbear","Gnoll","Gobboc","Shadow Goblin"],"Giantkin and Powerful Humanoids":["Goliath","Firbolg","Cyclopian","Giff","Minotaur"],"Draconic and Reptilian Races":["Dragonborn","Kobold","Lizardfolk","Yuan-Ti"],"Celestial, Fiendish, and Planar Bloodlines":["Aasimar","Tiefling","Feral Tiefling","Hexblood","Accursed","Curseborn","Aburata"],"Undead and Death-Touched Races":["Dhampir","Darakhul","Reborn","Arisen","Graveborn","Shade","Downcast","Volsarii"],"Fey and Trickster Folk":["Faerie","Fairy","Changeling","Lorwyn Changeling","Satyr","Dreamer","Gandirosha"],"Elemental and Energy-Born Peoples":["Air Genasi","Earth Genasi","Fire Genasi","Water Genasi","Flamekin","Rimekin","Ashborn","Azureborn","Bogborn","Deepborn","Snowborn","Stoneborn","Panolima"],"Psionic, Astral, and Alien Minds":["Kalashtar","Githyanki","Githzerai","Plasmoid","Disembodied","Gwynis"],"Constructed and Artificial Beings":["Warforged","Geppettin","Relicborn","Wechselkind"],"Birdfolk and Avian Races":["Aarakocra","Kenku","Owlin","Ravenfolk","Corvum","Gallus","Strig","Feathren","Raptor"],"Beastfolk and Mammalian Anthropomorphs":["Harengon","Leonin","Loxodon","Tabaxi","Bearfolk","Canisar","Cervan","Erina","Mapach","Ratatosk","Rakin","Sattare","Vulpin","Deorbasun"],"Amphibious and Aquatic Peoples":["Triton","Locathah","Grung","Merfolk","Sahuagin","Lotol","Nakudama","Dril'thar","Tamhiogal","Dril’thar","Tamhiogals"],"Insectoid, Ooze, and Aberrant Creatures":["Thri-Kreen","Cnidarin","Oozekin","Opteran","Silkborn"],"Plantfolk and Nature-Bound Races":["Mandrake","Mycelian","Gnarlborn","Harvestborn","Jaspey","Jaspeys"],"Shadow, Umbral, and Darkness-Aligned Peoples":["Ombrask","Ruinbound","Blagueborn","Threadborn"],"Animalistic Hybrids and Experimental Races":["Simic Hybrid","Shifter","Verdan","Vedalken","Hadozee","Tortle"],"Primitive, Tribal, and Wilderness Humanoids":["Boggart","Centaur","Grudgel","Hederan","Laneshi","Terandus"],"Miscellaneous and Hard-to-Classify Races":["Dara","Golynn","Luma"]},"biomeByCategory":{"Ocean":["Ocean Surface floating settlement","Underwater with reefs","Underwater without reefs"],"Plains":["Grassland","Prairie","Farming"],"Mountains":["Mountain range","Valley","Deep cavern"],"Forest":["Deep forest","Partial forest","Treetops - treehouses","Marshes and swamps"],"Hybrid":["Beach and grass with water","Beach and reefs with water","Hybrid tree and forest floor","Hybrid farming forest grassland"]},"alignmentBands":{"altruism":["Extremely Selfish","Very Selfish","Moderately Selfish","Slightly Selfish","Moderately Neutral","Extremely Neutral","Very Neutral","Slightly Neutral","Slightly Altruistic","Moderately Altruistic","Very Altruistic","Extremely Altruistic"],"lawfulness":["Extremely Chaotic","Very Chaotic","Moderately Chaotic","Slightly Chaotic","Moderately Neutral","Extremely Neutral","Very Neutral","Slightly Neutral","Slightly Lawful","Moderately Lawful","Very Lawful","Extremely Lawful"],"cooperation":["Extremely Combative","Very Combative","Moderately Combative","Slightly Combative","Moderately Neutral","Extremely Neutral","Very Neutral","Slightly Neutral","Slightly Cooperative","Moderately Cooperative","Very Cooperative","Extremely Cooperative"],"honor":["Extremely Pragmatic","Very Pragmatic","Moderately Pragmatic","Slightly Pragmatic","Moderately Neutral","Extremely Neutral","Very Neutral","Slightly Neutral","Slightly Honorable","Moderately Honorable","Very Honorable","Extremely Honorable"]},"summary":{"pages":8,"templates":7,"tables":11,"form_fields_and_outputs":267,"buttons":35,"embedded_assets_deduped":4,"css_variables":10,"css_color_tokens":42,"creation_data_summary":{"schemaVersion":"belavados.characterCreationFeatures.extracted.v1","counts":{"characterPageElementIds":47,"formFields":30,"buttons":8,"outputContainers":9,"races":196,"raceCategories":22,"biomeGroups":5,"biomesTotalWithDuplicatesAcrossGroups":17,"genderIdentities":14,"classes":14,"backgrounds":14,"factions":10,"skills":18,"feats":65,"weapons":32,"armor":13,"schools":16,"cantripClassLists":10,"spellClassLists":13},"rules_keys":["lineage","levels","stats","alignmentAxes","factions","characterExport"],"optionsByFieldId_keys":["genderIdentity","raceCategory","raceSelect","race2Category","race2Select","biomeCategory","biomeSelect","backgroundSelect","primaryClass","primarySubclass","secondaryClass","secondarySubclass","magicSchool","tier1Faction"],"characterCreationData_keys":["genderIdentities","races","raceCategories","raceCacheSource","core","alignment","factions","mergeMetadata"]},"field_manifest_summary_counts":{"source_files":2,"static_fields_total":167,"runtime_generated_fields_total":742,"generator_data_sheet_output_keys":47,"embedded_pdf_export_fields":178,"canonical_registry_entries":1024}},"fieldCount":222,"sourceTitle":"Belavadös Editable D&D Character Sheet","sourceSha256":"12fb896adc2753d5ce71753ea31deee8f2daa7e97f86a9a14474a01e139ef9cc","schema":"belavados.editableCharacterSheet.fullContents.noPlacement.v1"};
const STORAGE_KEY = 'belavados.characterSheet.v1';
const ABILITIES = ['STR','DEX','CON','INT','WIS','CHA'];
const SKILL_ABIL = {acrobatics:'DEX',animalHandling:'WIS',arcana:'INT',athletics:'STR',deception:'CHA',history:'INT',insight:'WIS',intimidation:'CHA',investigation:'INT',medicine:'WIS',nature:'INT',perception:'WIS',performance:'CHA',persuasion:'CHA',religion:'INT',sleightOfHand:'DEX',stealth:'DEX',survival:'WIS'};
const REPEAT_SCHEMAS = {
  attacks:[['name','text'],['bonus','text'],['damage','text'],['range','text'],['notes','text']],
  languages:[['name','text'],['source','text'],['mode','select',['Speak','Read/Write/Speak','Read only','Understand only']],['notes','text']],
  inventoryItems:[['item','text'],['qty','number'],['location','text'],['weight','number'],['value','text'],['attuned','checkbox'],['notes','text']],
  relationships:[['name','text'],['type','select',['Ally','Family','Companion','Romantic','Rival','Enemy','Mentor','Faction','Other']],['attitude','text'],['location','text'],['notes','text']],
  spellList:[['level','select',['0','1','2','3','4','5','6','7','8','9']],['prepared','checkbox'],['name','text'],['school','text'],['casting','text'],['description','text']],
  cantripList:[['name','text'],['type','text'],['roll','text'],['description','text']],
  monkTechniques:[['name','text'],['cost','text'],['action','text'],['effect','text']]
};
function qs(sel, root=document){return root.querySelector(sel)}
function qsa(sel, root=document){return [...root.querySelectorAll(sel)]}
function getByKey(k){return qs(`[data-key="${CSS.escape(k)}"]`)}
function numberValue(k){const el=getByKey(k); return el ? Number(el.value||0) : 0}
function mod(score){return Math.floor((Number(score||0)-10)/2)}
function fmt(n){n=Number(n||0); return (n>=0?'+':'')+n}
function setField(k,v){const el=getByKey(k); if(!el) return; if(el.type==='checkbox') el.checked=!!v; else el.value = v ?? '';}
function getFieldValue(el){return el.type==='checkbox' ? el.checked : el.value}
function setNested(obj,path,value){path.split('.').reduce((o,p,i,a)=> i===a.length-1 ? (o[p]=value) : (o[p] ??= {}), obj)}
function getNested(obj,path){return path.split('.').reduce((o,p)=> o && Object.prototype.hasOwnProperty.call(o,p) ? o[p] : undefined, obj)}
function fillSelect(select, values, keep=true){
  if(!select || select.tagName !== 'SELECT') return; const old = keep ? select.value : ''; select.innerHTML = '<option value="">—</option>' + (values||[]).map(v=>`<option value="${String(v).replaceAll('"','&quot;')}">${v}</option>`).join(''); if(old) select.value=old;
}
function updateDependentSelects(){
  fillSelect(getByKey('lineage.race1'), APP_OPTIONS.raceByCategory[numberValue('lineage.raceCategory')] || APP_OPTIONS.raceByCategory[getByKey('lineage.raceCategory')?.value] || []);
  fillSelect(getByKey('lineage.race2'), APP_OPTIONS.race2ByCategory[getByKey('lineage.race2Category')?.value] || []);
  fillSelect(getByKey('lineage.originBiome'), APP_OPTIONS.biomeByCategory[getByKey('lineage.biomeCategory')?.value] || []);
  const pc = getByKey('primaryClass')?.value || ''; fillSelect(getByKey('primarySubclass'), APP_OPTIONS.classes[pc]?.subclasses || []);
  const sc = getByKey('secondaryClass')?.value || ''; fillSelect(getByKey('secondarySubclass'), APP_OPTIONS.classes[sc]?.subclasses || []);
}
function alignmentLabel(axis,value){
  const bands = APP_OPTIONS.alignmentBands[axis] || []; const idx = Math.max(0, Math.min(bands.length-1, Math.floor(Number(value||0)/250))); return (bands[idx] || 'Neutral').toLowerCase();
}

const START_LEVEL = 8;
const EXTRA_TIER1_FACTIONS = {
  'The Crucible Wardens':'tier0Factions.crucibleWardens',
  'The Obsidian Diadem':'tier0Factions.obsidianDiadem',
  'The Choral Synod':'tier0Factions.choralSynod',
  'The Brass Concordat':'tier0Factions.brassConcordat',
  'The Black-Maw Myriad':'tier0Factions.blackMawMyriad',
  'The Glasswell Institute':'tier0Factions.glasswellInstitute',
  'The Freeblade Veil':'tier0Factions.freebladeVeil',
  'The Cog-Sanctum Synod':'tier0Factions.cogSanctumSynod',
  'The Regent Lattice':'tier0Factions.regentLattice'
};
let enforcingStartLevels = false;
function parseSigned(value){
  const n = Number(String(value ?? '0').replace('+','').trim());
  return Number.isFinite(n) ? n : 0;
}
function enforceLevelEightRules(changedKey=''){
  if(enforcingStartLevels) return;
  enforcingStartLevels = true;
  const primaryEl=getByKey('primaryLevel'), secondaryEl=getByKey('secondaryLevel'), secondaryClassEl=getByKey('secondaryClass');
  const hasSecondary = !!(secondaryClassEl && secondaryClassEl.value);
  if(primaryEl){primaryEl.min='5'; primaryEl.max='8';}
  if(secondaryEl){secondaryEl.min='0'; secondaryEl.max='3';}
  let primary = Math.round(Number(primaryEl?.value || START_LEVEL));
  let secondary = Math.round(Number(secondaryEl?.value || 0));
  if(!hasSecondary){
    primary = START_LEVEL;
    secondary = 0;
  } else if(changedKey === 'primaryLevel'){
    primary = Math.max(5, Math.min(7, primary || 5));
    secondary = START_LEVEL - primary;
  } else {
    secondary = Math.max(1, Math.min(3, secondary || 1));
    primary = START_LEVEL - secondary;
  }
  if(primaryEl) primaryEl.value = String(primary);
  if(secondaryEl) secondaryEl.value = String(secondary);
  enforcingStartLevels = false;
}
function updateMonkCollapse(){
  const box=qs('#monk'); const off=getByKey('monk.disabled');
  if(box) box.classList.toggle('monk-is-disabled', !!off?.checked);
}
function updateFactionTierMirrors(){
  setField('autoFactionAssociation','The Nefaric Veil - Tier 2 Specialist / Officer / Veteran.');
  const selected=getByKey('tier1Faction')?.value || '';
  Object.entries(EXTRA_TIER1_FACTIONS).forEach(([name,key])=>{
    const el=getByKey(key);
    if(!el) return;
    if(name === selected){el.checked=false; el.disabled=true; el.closest('.checkbox-field')?.classList.add('tier-one-selected');}
    else {el.disabled=false; el.closest('.checkbox-field')?.classList.remove('tier-one-selected');}
  });
}
function updateCalculated(){
  updateDependentSelects();
  enforceLevelEightRules(window.__lastChangedKey || "");
  const primary = numberValue('primaryLevel'), secondary = numberValue('secondaryLevel');
  const lvl = Math.max(0, primary + secondary); setField('level', lvl);
  const prof = lvl > 0 ? Math.min(6, Math.ceil(lvl/4)+1) : 0; setField('profBonus', fmt(prof));
  const mods = {}; ABILITIES.forEach(a=>{mods[a]=mod(numberValue('scores.'+a)); setField('mods.'+a, fmt(mods[a]));});
  ABILITIES.forEach(a=>{const checked=getByKey('saveProfs.'+a)?.checked; setField('saves.'+a, fmt((mods[a]||0) + (checked?prof:0)));});
  Object.entries(SKILL_ABIL).forEach(([sk,a])=>{const checked=getByKey('skillProfs.'+sk)?.checked; setField('skills.'+sk, fmt((mods[a]||0)+(checked?prof:0)));});
  setField('passivePerception', 10 + parseSigned(getByKey('skills.perception')?.value));
  setField('passiveInvestigation', 10 + parseSigned(getByKey('skills.investigation')?.value));
  setField('passiveInsight', 10 + parseSigned(getByKey('skills.insight')?.value));
  setField('initiative', fmt(mods.DEX||0));
  const spellAb = getByKey('spellAbility')?.value; if(spellAb){setField('spellSaveDC', 8 + prof + (mods[spellAb]||0)); setField('spellAttackBonus', fmt(prof + (mods[spellAb]||0)));}
  ['altruism','lawfulness','cooperation','honor'].forEach(axis=>{const val=numberValue('axes.'+axis); setField('axisLabels.'+axis, alignmentLabel(axis,val)); const out=qs(`output[data-for="axes.${axis}"]`); if(out) out.textContent=val;});
  const phase = ['altruism','lawfulness','cooperation','honor'].map(axis=>`${axis[0].toUpperCase()+axis.slice(1)}: ${getByKey('axisLabels.'+axis)?.value || ''}`).join(' • '); setField('axisPhases', phase);
  updateMonkCollapse();
  updateFactionTierMirrors();
  updateLiveSummary();
}
function updateLiveSummary(){
  const name = getByKey('characterName')?.value || 'Belavadös Character'; qsa('[data-live="characterName"]').forEach(el=>el.textContent=name);
  qsa('[data-live="race"]').forEach(el=>el.textContent=getByKey('race')?.value || getByKey('lineage.race1')?.value || '—');
  qsa('[data-live="characterPronouns"]').forEach(el=>el.textContent=getByKey('characterPronouns')?.value || '—');
  qsa('[data-live="level"]').forEach(el=>el.textContent=getByKey('level')?.value || '0');
  const cls=[getByKey('primaryClass')?.value,getByKey('primarySubclass')?.value].filter(Boolean).join(' / ') || '—'; qsa('[data-live="classSummary"]').forEach(el=>el.textContent=cls);
  qsa('[data-live="slug"]').forEach(el=>el.textContent=name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') || 'new-character');
  refreshArtSlots();
}
function addRow(kind, data={}){
  const tbody = qs(`[data-repeat-table="${kind}"] tbody`); if(!tbody) return;
  const tr=document.createElement('tr'); tr.dataset.repeat=kind;
  REPEAT_SCHEMAS[kind].forEach(([col,type,values])=>{
    const td=document.createElement('td'); let el;
    if(type==='select'){el=document.createElement('select'); el.innerHTML=(values||[]).map(v=>`<option>${v}</option>`).join('');}
    else {el=document.createElement('input'); el.type=type; if(type==='number'){el.min='0'; if(col==='weight') el.step='0.01';}}
    el.dataset.col=col; if(type==='checkbox') el.checked=!!data[col]; else el.value=data[col]??''; td.appendChild(el); tr.appendChild(td);
  });
  const td=document.createElement('td'); const b=document.createElement('button'); b.type='button'; b.className='warn'; b.textContent='Remove'; b.addEventListener('click',()=>tr.remove()); td.appendChild(b); tr.appendChild(td); tbody.appendChild(tr);
}
function collectRepeat(kind){return qsa(`[data-repeat-table="${kind}"] tbody tr`).map(tr=>{const o={}; qsa('[data-col]',tr).forEach(el=>o[el.dataset.col]=getFieldValue(el)); return o;});}
function setRepeat(kind, rows){const tbody=qs(`[data-repeat-table="${kind}"] tbody`); if(!tbody) return; tbody.innerHTML=''; (Array.isArray(rows)&&rows.length?rows:[{}]).forEach(r=>addRow(kind,r));}
function collectSheet(){
  const obj={}; qsa('[data-key]').forEach(el=>setNested(obj, el.dataset.key, getFieldValue(el)));
  obj.repeaters={}; Object.keys(REPEAT_SCHEMAS).forEach(k=>obj.repeaters[k]=collectRepeat(k));
  obj._meta={exportedAt:new Date().toISOString(), generatedBy:'Belavadös Profile D&D Sheet', schema:APP_OPTIONS.schema, sourceTitle:APP_OPTIONS.sourceTitle}; return obj;
}
function loadSheet(obj){
  if(typeof obj==='string') obj=JSON.parse(obj); qsa('[data-key]').forEach(el=>{const v=getNested(obj, el.dataset.key); if(v!==undefined){if(el.type==='checkbox') el.checked=!!v; else el.value=v;}});
  if(obj.repeaters){Object.keys(REPEAT_SCHEMAS).forEach(k=>setRepeat(k,obj.repeaters[k]));}
  updateCalculated(); refreshArtSlots(); refreshAudioPlayer(); if(window.refreshBelavadosDropdownBuilder) window.refreshBelavadosDropdownBuilder({fromLoad:true});
}
function exportJson(){const blob=new Blob([JSON.stringify(collectSheet(),null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(getByKey('characterName')?.value||'belavados-character').toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.json'; a.click(); URL.revokeObjectURL(a.href);}
function saveLocal(){localStorage.setItem(STORAGE_KEY, JSON.stringify(collectSheet())); setStatus('Saved browser copy.');}
function setStatus(txt){qs('#statusLine').textContent=txt;}
function clearSheet(){
  if(!confirm('Clear all visible fields and repeater rows?')) return;
  qsa('[data-key]').forEach(el=>{
    if(el.type==='checkbox') el.checked=false;
    else if(el.type==='range') el.value=el.dataset.key.startsWith('axes.')?'1500':(el.value||'');
    else if(!el.readOnly) el.value='';
  });
  Object.keys(REPEAT_SCHEMAS).forEach(k=>setRepeat(k,[{}]));
  setField('primaryLevel', START_LEVEL); setField('secondaryLevel', 0); setField('autoFactionAssociation','The Nefaric Veil - Tier 2 Specialist / Officer / Veteran.');
  updateCalculated(); refreshArtSlots(); refreshAudioPlayer(); if(window.refreshBelavadosDropdownBuilder) window.refreshBelavadosDropdownBuilder({fromClear:true});
  setStatus('Sheet cleared. Reset to level 8 start.');
}
function refreshArtSlots(){
  qsa('[data-art-preview]').forEach(img=>{
    const key=img.dataset.artPreview; const src=getByKey(key)?.value || ''; const slot=img.closest('.art-drop-slot');
    if(src){img.src=src; slot?.classList.add('has-art');} else {img.removeAttribute('src'); slot?.classList.remove('has-art');}
  });
}
function loadImageFileToSlot(file,key){
  if(!file || !file.type.startsWith('image/')) return;
  const reader=new FileReader();
  reader.onload=()=>{setField(key, reader.result); refreshArtSlots(); updateCalculated(); setStatus('Loaded character art: '+file.name);};
  reader.readAsDataURL(file);
}
function setupArtDropSlots(){
  qsa('[data-art-slot]').forEach(slot=>{
    const key=slot.dataset.artSlot; const input=qs(`[data-art-file="${CSS.escape(key)}"]`,slot);
    slot.addEventListener('click',e=>{if(e.target!==input) input?.click();});
    slot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); input?.click();}});
    slot.addEventListener('dragover',e=>{e.preventDefault(); slot.classList.add('drag-over');});
    slot.addEventListener('dragleave',()=>slot.classList.remove('drag-over'));
    slot.addEventListener('drop',e=>{e.preventDefault(); slot.classList.remove('drag-over'); loadImageFileToSlot(e.dataTransfer.files?.[0],key);});
    input?.addEventListener('change',e=>loadImageFileToSlot(e.target.files?.[0],key));
  });
}
function formatAudioTime(seconds){
  seconds=Number.isFinite(seconds)?Math.max(0,seconds):0; const m=Math.floor(seconds/60); const s=Math.floor(seconds%60).toString().padStart(2,'0'); return `${m}:${s}`;
}
function refreshAudioPlayer(){
  const audio=qs('#voiceAudio'); if(!audio) return; const src=getByKey('voice.audioSource')?.value || '';
  if(src && audio.src!==src){audio.src=src; audio.load();}
  if(!src){audio.removeAttribute('src'); audio.load();}
}

function setupFloatingNav(){
  const bubble=qs('#floatingNav'); const handle=qs('#floatingNavToggle'); const select=qs('#floatingNavSelect'); const go=qs('#floatingNavGo');
  if(!bubble||!handle||!select||!go) return;
  const saved=localStorage.getItem('belavados-floating-nav-pos');
  if(saved){
    try{const p=JSON.parse(saved); if(Number.isFinite(p.left)&&Number.isFinite(p.top)){bubble.style.left=p.left+'px'; bubble.style.top=p.top+'px';}}catch(e){}
  }
  let dragging=false, moved=false, startX=0, startY=0, startLeft=0, startTop=0;
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  handle.addEventListener('pointerdown',e=>{
    dragging=true; moved=false; startX=e.clientX; startY=e.clientY;
    const rect=bubble.getBoundingClientRect(); startLeft=rect.left; startTop=rect.top;
    handle.setPointerCapture?.(e.pointerId);
  });
  handle.addEventListener('pointermove',e=>{
    if(!dragging) return;
    const dx=e.clientX-startX, dy=e.clientY-startY;
    if(Math.abs(dx)>3||Math.abs(dy)>3) moved=true;
    if(moved){
      const maxLeft=Math.max(0,window.innerWidth-75), maxTop=Math.max(0,window.innerHeight-75);
      bubble.style.left=clamp(startLeft+dx,0,maxLeft)+'px';
      bubble.style.top=clamp(startTop+dy,0,maxTop)+'px';
    }
  });
  handle.addEventListener('pointerup',e=>{
    if(!dragging) return;
    dragging=false;
    handle.releasePointerCapture?.(e.pointerId);
    const rect=bubble.getBoundingClientRect();
    localStorage.setItem('belavados-floating-nav-pos',JSON.stringify({left:rect.left,top:rect.top}));
    if(!moved){
      const collapsed=bubble.classList.toggle('collapsed');
      handle.setAttribute('aria-expanded', String(!collapsed));
    }
  });
  const jump=()=>{
    const target=select.value; if(!target) return;
    const el=qs(target);
    if(el){el.scrollIntoView({behavior:'smooth',block:'start'});}
    history.replaceState(null,'',target);
  };
  select.addEventListener('change',jump);
  go.addEventListener('click',jump);
}

function setupAudioPlayer(){
  const audio=qs('#voiceAudio'), scrub=qs('#voiceScrubber'), now=qs('#voiceTimeNow'), total=qs('#voiceTimeTotal'), source=getByKey('voice.audioSource'), fileInput=qs('#voiceAudioFile'), drop=qs('#audioDropZone');
  if(!audio) return;
  const sync=()=>{now.textContent=formatAudioTime(audio.currentTime); total.textContent=formatAudioTime(audio.duration); scrub.value=audio.duration?String((audio.currentTime/audio.duration)*100):'0';};
  audio.addEventListener('loadedmetadata',sync); audio.addEventListener('timeupdate',sync); audio.addEventListener('ended',sync);
  scrub?.addEventListener('input',()=>{if(audio.duration) audio.currentTime=(Number(scrub.value)/100)*audio.duration;});
  document.addEventListener('click',e=>{
    const act=e.target.closest('[data-audio-action]')?.dataset.audioAction; if(!act) return;
    refreshAudioPlayer();
    if(act==='play') audio.play().catch(err=>setStatus('Audio could not play: '+err.message));
    if(act==='pause') audio.pause();
    if(act==='stop'){audio.pause(); audio.currentTime=0; sync();}
    if(act==='rewind'){audio.currentTime=Math.max(0,(audio.currentTime||0)-5); sync();}
    if(act==='forward'){audio.currentTime=Math.min(audio.duration||0,(audio.currentTime||0)+5); sync();}
  });
  source?.addEventListener('input',refreshAudioPlayer);
  const loadAudioFile=file=>{
    if(!file || !file.type.startsWith('audio/')) return;
    const reader=new FileReader();
    reader.onload=()=>{setField('voice.audioFileName',file.name); setField('voice.audioSource',reader.result); refreshAudioPlayer(); updateCalculated(); setStatus('Loaded voice audio: '+file.name);};
    reader.readAsDataURL(file);
  };
  fileInput?.addEventListener('change',e=>loadAudioFile(e.target.files?.[0]));
  drop?.addEventListener('click',e=>{if(e.target!==fileInput) fileInput?.click();});
  drop?.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault(); fileInput?.click();}});
  drop?.addEventListener('dragover',e=>{e.preventDefault(); drop.classList.add('drag-over');});
  drop?.addEventListener('dragleave',()=>drop.classList.remove('drag-over'));
  drop?.addEventListener('drop',e=>{e.preventDefault(); drop.classList.remove('drag-over'); loadAudioFile(e.dataTransfer.files?.[0]);});
  refreshAudioPlayer(); sync();
}
window.loadSheet = loadSheet; window.collectSheet = collectSheet; window.exportJson = exportJson;
document.addEventListener('input',e=>{
  if(e.target.matches('[data-key],[data-col]')){
    window.__lastChangedKey = e.target.dataset.key || '';
    updateCalculated();
    if(e.target.dataset.key&&e.target.dataset.key.startsWith('characterArt.')) refreshArtSlots();
    if(e.target.dataset.key==='voice.audioSource') refreshAudioPlayer();
  }
});
document.addEventListener('change',e=>{
  if(e.target.matches('[data-key],[data-col]')){
    window.__lastChangedKey = e.target.dataset.key || '';
    updateCalculated();
    if(e.target.dataset.key&&e.target.dataset.key.startsWith('characterArt.')) refreshArtSlots();
    if(e.target.dataset.key==='voice.audioSource') refreshAudioPlayer();
  }
});
document.addEventListener('click',e=>{
  const add=e.target.closest('[data-add-row]'); if(add){addRow(add.dataset.addRow); return;}
  const action=e.target.closest('[data-action]')?.dataset.action; if(!action) return;
  if(action==='save') saveLocal(); if(action==='export') exportJson(); if(action==='print') print(); if(action==='clear') clearSheet();
  if(action==='neutral-axes'){['altruism','lawfulness','cooperation','honor'].forEach(a=>setField('axes.'+a,1500)); updateCalculated();}
  if(action==='write-json' && qs('#rawJsonArea')){qs('#rawJsonArea').value=JSON.stringify(collectSheet(),null,2); setStatus('Current sheet written to staging area.');}
  if(action==='paste-json' && qs('#rawJsonArea')){try{loadSheet(qs('#rawJsonArea').value); setStatus('Loaded JSON from staging area.');}catch(err){alert('Could not load JSON: '+err.message);}}
});
qs('#importFile').addEventListener('change', e=>{const file=e.target.files[0]; if(!file) return; const reader=new FileReader(); reader.onload=()=>{try{loadSheet(reader.result); setStatus('Imported '+file.name);}catch(err){alert('Import failed: '+err.message)}}; reader.readAsText(file);});
setupArtDropSlots(); setupAudioPlayer(); setupFloatingNav();
Object.keys(REPEAT_SCHEMAS).forEach(k=>setRepeat(k,[{}]));
setField('primaryLevel', START_LEVEL); setField('secondaryLevel', 0); setField('autoFactionAssociation','The Nefaric Veil - Tier 2 Specialist / Officer / Veteran.');
try{const saved=localStorage.getItem(STORAGE_KEY); if(saved) loadSheet(saved);}catch(e){}
updateCalculated(); refreshArtSlots(); refreshAudioPlayer(); setStatus(`Loaded ${APP_OPTIONS.fieldCount} extracted data-key fields into long-scroll modules.`);

