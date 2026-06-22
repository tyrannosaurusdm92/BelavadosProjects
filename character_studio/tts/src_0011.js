// Auto-generated for Belavadös Fantasy Voice Simulation JS.
// Source uploaded by user; generated package contains JS-only runtime plus docs.


import { BELAVADOS_RACES, BELAVADOS_RACE_CATEGORIES, BELAVADOS_CLASSES, BELAVADOS_GENDER_IDENTITIES } from './belavados-world-data.js';
import { clamp, slugify, blendSliders, seededUnit } from './utility.js';

const BASE_SLIDERS = Object.freeze({
  pitch: 5, speed: 5, inflection: 5, stutter: 1, breath: 2, roughness: 2,
  resonance: 5, formality: 5, vowelFlow: 5, consonantBite: 5, mouthShape: 5,
  nasality: 2, throatDepth: 5, rhythm: 5, pauseControl: 5, emphasis: 5,
  warmth: 5, clarity: 7, projection: 5, humanVariation: 5, accentColor: 5
});

const CATEGORY_SLIDER_PRESETS = Object.freeze({
  1: { humanVariation: .80, clarity: .90, warmth: .62 },
  2: { vowelFlow: .82, clarity: .86, inflection: .68, breath: .36 },
  3: { resonance: .90, throatDepth: .75, consonantBite: .62 },
  4: { warmth: .88, rhythm: .72, speed: .58, pitch: .56 },
  5: { roughness: .72, consonantBite: .83, projection: .75, warmth: .38 },
  6: { resonance: .95, projection: .90, speed: .40, throatDepth: .80 },
  7: { consonantBite: .82, throatDepth: .86, roughness: .45 },
  8: { projection: .82, inflection: .72, formality: .70 },
  9: { breath: .70, roughness: .38, speed: .42, pauseControl: .76 },
  10: { inflection: .88, rhythm: .84, vowelFlow: .80 },
  11: { inflection: .76, projection: .72, vowelFlow: .72, accentColor: .82 },
  12: { pauseControl: .84, clarity: .78, inflection: .56, stutter: .16 },
  13: { clarity: .92, rhythm: .42, consonantBite: .70, warmth: .35 },
  14: { pitch: .68, inflection: .82, vowelFlow: .70, breath: .48 },
  15: { roughness: .35, warmth: .68, rhythm: .74, humanVariation: .78 },
  16: { vowelFlow: .92, breath: .54, rhythm: .66, consonantBite: .36 },
  17: { consonantBite: .86, stutter: .28, clarity: .62, rhythm: .48 },
  18: { speed: .45, warmth: .76, vowelFlow: .78, pauseControl: .72 },
  19: { breath: .74, pauseControl: .80, roughness: .26, projection: .42 },
  20: { humanVariation: .92, inflection: .70, roughness: .32, accentColor: .70 },
  21: { projection: .82, rhythm: .70, consonantBite: .66, formality: .38 },
  22: { humanVariation: .95, inflection: .66, clarity: .68, accentColor: .78 }
});

const CLASS_SLIDER_PRESETS = Object.freeze({
  barbarian: { projection: .82, roughness: .65, formality: .25, emphasis: .76 },
  bard: { inflection: .92, rhythm: .88, warmth: .72, emphasis: .80 },
  cleric: { formality: .76, pauseControl: .75, warmth: .72, clarity: .78 },
  druid: { vowelFlow: .78, warmth: .68, breath: .48, rhythm: .64 },
  fighter: { clarity: .76, projection: .72, consonantBite: .65, speed: .54 },
  monk: { speed: .54, pauseControl: .86, clarity: .82, rhythm: .58 },
  paladin: { projection: .84, formality: .82, warmth: .58, emphasis: .80 },
  ranger: { clarity: .70, pauseControl: .72, rhythm: .64, speed: .56 },
  rogue: { speed: .72, pauseControl: .66, formality: .34, consonantBite: .58 },
  sorcerer: { inflection: .84, projection: .66, humanVariation: .70, accentColor: .82 },
  warlock: { pauseControl: .84, roughness: .32, inflection: .74, breath: .52 },
  wizard: { clarity: .90, formality: .88, pauseControl: .78, speed: .48 },
  artificer: { clarity: .86, rhythm: .52, consonantBite: .68, nasality: .28 },
  blood_hunter: { roughness: .42, pauseControl: .78, projection: .62, breath: .45 }
});

function genderExpressionPreset(genderIdentityName) {
  const id = slugify(genderIdentityName);
  // Gender identity should not force biology. These are gentle expression defaults only.
  if (id.includes('trans_female') || id.includes('cis_female') || id.includes('demi_female')) {
    return { pitch: .58, vowelFlow: .60, warmth: .62, throatDepth: .46 };
  }
  if (id.includes('trans_male') || id.includes('cis_male') || id.includes('demi_male')) {
    return { pitch: .46, throatDepth: .58, resonance: .58, projection: .56 };
  }
  if (id.includes('agender') || id.includes('gender_less') || id.includes('neutrois')) {
    return { pitch: .52, clarity: .78, formality: .60, humanVariation: .52 };
  }
  if (id.includes('fluid') || id.includes('flexible') || id.includes('bi_gender') || id.includes('poly_gender')) {
    return { pitch: .54, inflection: .72, humanVariation: .78, accentColor: .66 };
  }
  return { pitch: .52, humanVariation: .62, clarity: .70 };
}

export function findRace(raceName) {
  const wanted = slugify(raceName);
  return BELAVADOS_RACES.find(r => slugify(r.name) === wanted || r.id === wanted)
    || BELAVADOS_RACES.find(r => slugify(r.name).includes(wanted))
    || null;
}

export function findRaceCategory(input) {
  const race = findRace(input);
  if (race) return BELAVADOS_RACE_CATEGORIES.find(c => c.number === race.categoryNumber);
  const wanted = slugify(input);
  return BELAVADOS_RACE_CATEGORIES.find(c => slugify(c.name) === wanted || c.id === wanted)
    || BELAVADOS_RACE_CATEGORIES.find(c => slugify(c.name).includes(wanted))
    || BELAVADOS_RACE_CATEGORIES[0];
}

export function findClass(className) {
  const wanted = slugify(className);
  return BELAVADOS_CLASSES.find(c => slugify(c.name) === wanted || c.id === wanted)
    || BELAVADOS_CLASSES.find(c => slugify(c.name).includes(wanted))
    || null;
}

export function findSubclass(classObj, subclassName) {
  if (!classObj || !subclassName) return null;
  const wanted = slugify(subclassName);
  return classObj.subclasses.find(s => slugify(s.name) === wanted || slugify(s.fullName) === wanted || s.id === wanted)
    || classObj.subclasses.find(s => slugify(s.name).includes(wanted) || slugify(s.fullName).includes(wanted))
    || null;
}

export function findGenderIdentity(genderIdentityName) {
  const wanted = slugify(genderIdentityName);
  return BELAVADOS_GENDER_IDENTITIES.find(g => slugify(g.name) === wanted || g.id === wanted)
    || BELAVADOS_GENDER_IDENTITIES.find(g => slugify(g.name).includes(wanted))
    || BELAVADOS_GENDER_IDENTITIES.find(g => g.name === 'Non-Binary')
    || BELAVADOS_GENDER_IDENTITIES[0];
}

export function buildOverlaySliders({ race, raceCategory, className, subclass, genderIdentity, seed = 'belavados' }) {
  const raceObj = findRace(race);
  const cat = raceCategory ? findRaceCategory(raceCategory) : (raceObj ? findRaceCategory(raceObj.name) : findRaceCategory(race || 'Human'));
  const cls = findClass(className || 'Fighter');
  const sub = findSubclass(cls, subclass);
  const gender = findGenderIdentity(genderIdentity || 'Non-Binary');

  let sliders = { ...BASE_SLIDERS };
  sliders = blendSliders(sliders, CATEGORY_SLIDER_PRESETS[cat.number] || {}, 0.50);
  sliders = blendSliders(sliders, cls ? CLASS_SLIDER_PRESETS[cls.id] || {} : {}, 0.32);
  sliders = blendSliders(sliders, genderExpressionPreset(gender.name), 0.18);

  // Subclasses add a tiny deterministic personality bend without importing JSON math.
  if (sub) {
    const u = seededUnit(`${seed}|${cls.id}|${sub.id}`);
    sliders.inflection = clamp(sliders.inflection + (u - 0.5) * 1.4);
    sliders.rhythm = clamp(sliders.rhythm + (u - 0.5) * 1.0);
    sliders.formality = clamp(sliders.formality + (u - 0.5) * 0.8);
  }

  return { sliders, race: raceObj, raceCategory: cat, class: cls, subclass: sub, genderIdentity: gender };
}
