// Auto-generated for Belavadös Fantasy Voice Simulation JS.
// Source uploaded by user; generated package contains JS-only runtime plus docs.


import { createFantasyVoiceProfile } from './index.js';

const demos = [
  { name: 'Reefborn Dril\'thar Cleric', race: "Dril'thar", biome: 'Underwater With Reefs', className: 'Cleric', genderIdentity: 'Non-Binary' },
  { name: 'Cavern Warforged Artificer', race: 'Warforged', biome: 'Deep Cavern', className: 'Artificer', genderIdentity: 'Agender' },
  { name: 'Forest Tabaxi Ranger', race: 'Tabaxi', biome: 'Deep Forest', className: 'Ranger', genderIdentity: 'Gender-Fluid' },
  { name: 'Ocean Fire Genasi Bard', race: 'Fire Genasi', biome: 'Ocean Surface Floating Settlement', className: 'Bard', genderIdentity: 'Trans-Female' }
];

for (const character of demos) {
  console.log(JSON.stringify(createFantasyVoiceProfile(character), null, 2));
}
