// Auto-generated for Belavadös Fantasy Voice Simulation JS.
// Source uploaded by user; generated package contains JS-only runtime plus docs.


import { getBiomeAccent, explainBiomeRouting } from './biome-accent-router.js';
import { buildOverlaySliders } from './race-gender-class-filter.js';
import { clamp, round, seededUnit } from './utility.js';

const SPECIAL_TEXTURES = {
  adaptable: ['clean carrier accent', 'culture-first phrasing'],
  airy: ['lifted vowels', 'smooth line endings'],
  stonework: ['chest resonance', 'firm consonants'],
  smallfolk: ['warm cadence', 'neighborly rhythm'],
  brutish: ['hard consonant bite', 'roughened throat edge'],
  giant: ['large resonance', 'slower phrase landing'],
  draconic: ['throat depth', 'commanding consonants'],
  planar: ['radiant or infernal color', 'heightened emphasis'],
  deathTouched: ['breathy edges', 'longer silence'],
  fey: ['melodic turns', 'playful stress'],
  elemental: ['environmental color', 'motion in vowels'],
  psionic: ['precise pauses', 'distant focus'],
  constructed: ['measured rhythm', 'metallic precision'],
  avian: ['high lift', 'quick phrase arcs'],
  beastfolk: ['organic rhythm', 'physical expression'],
  aquatic: ['liquid vowels', 'soft consonant edges'],
  clickCroak: ['click/croak texture', 'unusual timing'],
  plant: ['slow growth cadence', 'rustle-soft warmth'],
  shadow: ['low projection', 'whispered pauses'],
  hybrid: ['variable texture', 'adaptive accent'],
  wilderness: ['direct projection', 'weathered clarity'],
  miscellaneous: ['unusual color', 'category-flex voice']
};

function slidersToEngineParams(sliders, accent, seed) {
  const u = seededUnit(seed);
  return {
    speechSynthesis: {
      pitch: round(0.55 + sliders.pitch / 10 * 1.25, 3),
      rate: round(0.72 + sliders.speed / 10 * 0.74, 3),
      volume: round(0.70 + sliders.projection / 10 * 0.30, 3)
    },
    prosody: {
      inflection: round(sliders.inflection / 10, 3),
      rhythmSwing: round(sliders.rhythm / 10, 3),
      pauseControl: round(sliders.pauseControl / 10, 3),
      emphasis: round(sliders.emphasis / 10, 3),
      stochasticVariation: round((sliders.humanVariation / 10) * (0.85 + u * 0.3), 3)
    },
    articulation: {
      clarity: round(sliders.clarity / 10, 3),
      consonantBite: round(sliders.consonantBite / 10, 3),
      vowelFlow: round(sliders.vowelFlow / 10, 3),
      mouthShape: round(sliders.mouthShape / 10, 3),
      nasality: round(sliders.nasality / 10, 3)
    },
    tone: {
      breath: round(sliders.breath / 10, 3),
      roughness: round(sliders.roughness / 10, 3),
      resonance: round(sliders.resonance / 10, 3),
      throatDepth: round(sliders.throatDepth / 10, 3),
      warmth: round(sliders.warmth / 10, 3),
      accentColor: round(sliders.accentColor / 10, 3)
    },
    accentCarrier: {
      biome: accent.name,
      fantasyAccentName: accent.fantasyAccentName,
      inspiration: accent.baseAccentInspiration,
      finalVoiceFeel: accent.finalVoiceFeel
    }
  };
}

export function createFantasyVoiceProfile(options = {}) {
  const {
    race = 'Human', raceCategory = null, biome = 'Grassland', className = 'Fighter',
    subclass = null, genderIdentity = 'Non-Binary', name = 'Belavadös NPC', seed = `${race}|${biome}|${className}|${genderIdentity}`
  } = options;

  const overlay = buildOverlaySliders({ race, raceCategory, className, subclass, genderIdentity, seed });
  const accent = getBiomeAccent(biome, overlay.raceCategory?.number);
  const sliders = Object.fromEntries(Object.entries(overlay.sliders).map(([k, v]) => [k, round(clamp(v), 3)]));
  const specialKey = overlay.raceCategory?.voiceTexturePreset?.special || 'adaptable';
  const textureNotes = SPECIAL_TEXTURES[specialKey] || SPECIAL_TEXTURES.adaptable;

  return {
    name,
    selected: {
      race: overlay.race?.name || race,
      raceCategoryNumber: overlay.raceCategory?.number,
      raceCategoryName: overlay.raceCategory?.name,
      biome: accent.name,
      fantasyAccentName: accent.fantasyAccentName,
      className: overlay.class?.name || className,
      subclass: overlay.subclass?.fullName || subclass || null,
      genderIdentity: overlay.genderIdentity?.name || genderIdentity
    },
    sliders,
    engineParams: slidersToEngineParams(sliders, accent, seed),
    routing: explainBiomeRouting({ race, biome: accent.name, raceCategoryNumber: overlay.raceCategory?.number }),
    textureNotes,
    implementationNote: 'This simulates a fantasy voice profile in JavaScript. It does not clone a real person and does not include binary audio.'
  };
}

export function createBatchProfiles(characters = []) {
  return characters.map((character, index) => createFantasyVoiceProfile({ seed: `batch-${index}-${JSON.stringify(character)}`, ...character }));
}

export function toSpeechSynthesisOptions(profile) {
  return profile.engineParams.speechSynthesis;
}
