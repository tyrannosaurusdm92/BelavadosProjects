// Auto-generated for Belavadös Fantasy Voice Simulation JS.
// Source uploaded by user; generated package contains JS-only runtime plus docs.


import { BELAVADOS_BIOMES } from './belavados-world-data.js';
import { slugify } from './utility.js';

const ALIASES = {
  ocean: 'Ocean Surface Floating Settlement',
  reef: 'Underwater With Reefs',
  deep_ocean: 'Underwater Without Reefs',
  underwater: 'Underwater Without Reefs',
  cavern: 'Deep Cavern',
  cave: 'Deep Cavern',
  forest: 'Deep Forest',
  swamp: 'Marshes and Swamps',
  marsh: 'Marshes and Swamps',
  beach: 'Beach and Grass With Water',
  coastal_reef: 'Beach and Reefs With Water',
  treetop: 'Treetops / Treehouses',
  treehouse: 'Treetops / Treehouses',
  farm: 'Farming',
  farmland: 'Farming'
};

export function getBiomeAccent(biomeName, raceCategoryNumber = null) {
  const wanted = slugify(ALIASES[slugify(biomeName)] || biomeName);
  let biome = BELAVADOS_BIOMES.find(b => slugify(b.name) === wanted || b.id === wanted);
  if (!biome && raceCategoryNumber) {
    biome = BELAVADOS_BIOMES.find(b => b.bestFitCategoryNumbers.includes(Number(raceCategoryNumber)));
  }
  return biome || BELAVADOS_BIOMES[0];
}

export function explainBiomeRouting({ race, biome, raceCategoryNumber }) {
  const selected = getBiomeAccent(biome, raceCategoryNumber);
  return {
    selectedBiome: selected.name,
    fantasyAccentName: selected.fantasyAccentName,
    baseAccentInspiration: selected.baseAccentInspiration,
    rule: 'Biome/culture acts as the carrier accent; race/lineage overlays reshape texture after the biome is selected.',
    lineageCheck: `${race || 'This character'} should use ${selected.fantasyAccentName} when their lived habitat/culture matches ${selected.name}.`,
    finalVoiceFeel: selected.finalVoiceFeel
  };
}
