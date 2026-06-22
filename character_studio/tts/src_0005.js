// Auto-generated for Belavadös Fantasy Voice Simulation JS with included audio/TTS assets.

import { AUDIO_REFERENCE_CATALOG, TTS_RESOURCE_CATALOG, findAudioReferences, findTtsResources, resolveAssetUrl } from './audio-reference-catalog.js';
import { createFantasyVoiceProfile } from './fantasy-voice-engine.js';

export function getReferenceSuggestions(characterOptions, limit = 10) {
  const profile = createFantasyVoiceProfile(characterOptions);
  const filter = {
    biome: profile.selected.biome,
    fantasyAccentName: profile.selected.fantasyAccentName,
    raceCategoryName: profile.selected.raceCategoryName,
    genderIdentity: profile.selected.genderIdentity,
    className: profile.selected.className
  };
  const exact = findAudioReferences(filter, limit);
  const fallback = AUDIO_REFERENCE_CATALOG
    .filter(entry => entry.filter?.fantasyAccentName === profile.selected.fantasyAccentName || entry.filter?.raceCategoryName === profile.selected.raceCategoryName)
    .slice(0, Math.max(0, limit - exact.length));
  const references = [...exact, ...fallback].slice(0, limit).map(entry => ({ ...entry, url: resolveAssetUrl(entry) }));
  return { profile, references };
}

export function getTtsResourceSuggestions(characterOptions, limit = 10) {
  const profile = createFantasyVoiceProfile(characterOptions);
  const filter = {
    biome: profile.selected.biome,
    fantasyAccentName: profile.selected.fantasyAccentName,
    raceCategoryName: profile.selected.raceCategoryName,
    genderIdentity: profile.selected.genderIdentity,
    className: profile.selected.className
  };
  const exact = findTtsResources(filter, limit);
  const fallback = TTS_RESOURCE_CATALOG
    .filter(entry => entry.filter?.fantasyAccentName === profile.selected.fantasyAccentName || entry.filter?.raceCategoryName === profile.selected.raceCategoryName)
    .slice(0, Math.max(0, limit - exact.length));
  const resources = [...exact, ...fallback].slice(0, limit).map(entry => ({ ...entry, url: resolveAssetUrl(entry) }));
  return { profile, resources };
}

export function summarizeReferencePool() {
  const bySource = new Map();
  for (const entry of AUDIO_REFERENCE_CATALOG) {
    bySource.set(entry.source, (bySource.get(entry.source) || 0) + 1);
  }
  return [...bySource.entries()].map(([source, count]) => ({ source, count }));
}
