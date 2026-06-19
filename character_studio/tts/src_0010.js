// Auto-generated asset path helpers for the included audio/TTS build.
import { AUDIO_REFERENCE_CATALOG, TTS_RESOURCE_CATALOG, findAudioReferences, findTtsResources, resolveAssetUrl } from './audio-reference-catalog.js';

export const INCLUDED_ASSET_TOTALS = {
  "audioFilesIncluded": 2565,
  "ttsResourcesIncluded": 522,
  "audioBytesIncluded": 190784353,
  "ttsBytesIncluded": 12706465
};

export function getIncludedAudioFiles(filter = {}, limit = 20) {
  return findAudioReferences(filter, limit).map(entry => ({ ...entry, url: resolveAssetUrl(entry) }));
}

export function getIncludedTtsResources(filter = {}, limit = 20) {
  return findTtsResources(filter, limit).map(entry => ({ ...entry, url: resolveAssetUrl(entry) }));
}

export { AUDIO_REFERENCE_CATALOG, TTS_RESOURCE_CATALOG };
