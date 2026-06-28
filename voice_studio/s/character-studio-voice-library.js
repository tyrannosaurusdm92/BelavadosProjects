/*
  Belavadös Voice Studio linked library for Character Studio.
  Character Studio is the only opener. This file exposes the Voice Studio
  resource + bot APIs while resolving actual voice assets from GitHub paths.
*/
import { decideVoiceSource, summarizeDecision } from './voice-source-bot.js';
import { buildVoiceProfile, describeProfile } from './voice-profile.js';
import { renderProfileToWav, downloadBlob, playBlob, speakWithBrowser } from './audio-renderer.js';
import { postToBackend, dataUrlFromBackendResponse, BACKEND_URL } from './backend-client.js';
import { createZipBlob, safeFilePart } from './zip-export.js';

const DEFAULT_GITHUB_VOICE_BASE = 'https://tyrannosaurusdm92.github.io/BelavadosProjects/voice_studio/';
const DEFAULT_CONFIG = Object.freeze({
  lockedBackendUrl: BACKEND_URL,
  voiceStudioBaseUrl: '../voice_studio/',
  voiceStudioDataBaseUrl: '../voice_studio/s/',
  voiceStudioAssetBaseUrl: DEFAULT_GITHUB_VOICE_BASE,
  githubVoiceStudioBaseUrl: DEFAULT_GITHUB_VOICE_BASE,
  voiceManifestPath: 'voices.json'
});

let config = { ...DEFAULT_CONFIG };
let manifest = [];
let biomes = [];
let folderManifest = null;
let loadedAt = null;
let loadErrors = [];

function cfg(){
  config = { ...DEFAULT_CONFIG, ...(globalThis.BELAVADOS_LINKED_VOICE_STUDIO_CONFIG || {}) };
  if(!config.voiceStudioAssetBaseUrl) config.voiceStudioAssetBaseUrl = config.githubVoiceStudioBaseUrl || DEFAULT_GITHUB_VOICE_BASE;
  if(!/\/$/.test(config.voiceStudioAssetBaseUrl)) config.voiceStudioAssetBaseUrl += '/';
  if(!/\/$/.test(config.voiceStudioDataBaseUrl || '')) config.voiceStudioDataBaseUrl = String(config.voiceStudioDataBaseUrl || DEFAULT_CONFIG.voiceStudioDataBaseUrl) + '/';
  return config;
}

function unique(list){ return [...new Set(list.filter(Boolean))]; }
function joinUrl(base, path){
  try { return new URL(String(path || '').replace(/^\/+/, ''), base).href; }
  catch(_err){ return String(base || '') + String(path || '').replace(/^\/+/, ''); }
}
function normalize(value){ return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
function words(value){ return normalize(value).split(/\s+/).filter(Boolean); }
function escapeFile(value, fallback='voice'){ return safeFilePart(value, fallback); }

async function fetchJsonCandidates(paths, fallback){
  const c = cfg();
  const candidates = unique(paths.flatMap(path => [
    joinUrl(c.voiceStudioDataBaseUrl, path),
    joinUrl(c.voiceStudioBaseUrl || '../voice_studio/', `s/${path}`),
    joinUrl(c.githubVoiceStudioBaseUrl || DEFAULT_GITHUB_VOICE_BASE, `s/${path}`),
    joinUrl(DEFAULT_GITHUB_VOICE_BASE, `s/${path}`)
  ]));
  const errors = [];
  for(const url of candidates){
    try{
      const res = await fetch(url, { cache: 'no-store' });
      if(!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    }catch(err){
      errors.push(`${url}: ${err.message}`);
    }
  }
  loadErrors.push(...errors);
  return fallback;
}

function normalizeVoiceItem(item){
  const copy = { ...item };
  const assetBase = cfg().voiceStudioAssetBaseUrl || DEFAULT_GITHUB_VOICE_BASE;
  const file = copy.file || copy.path || copy.voiceStudioRelativePath || '';
  copy.fileUrl = copy.fileUrl || (file ? joinUrl(assetBase, file) : '');
  copy.manifestSource = 'voice_studio/s/voices.json';
  copy.assetStoragePolicy = 'external-github-resource-not-returned-in-character-studio-edit-zip';
  return copy;
}

function normalizeBiomeItem(item){
  const copy = { ...item };
  copy.biome = copy.biome || copy.name || copy.id;
  copy.fantasyAccent = copy.fantasyAccent || copy.fantasyAccentName || copy.accentName || copy.name;
  copy.baseAccent = copy.baseAccent || copy.baseAccentInspiration || copy.realAccent || copy.language || '';
  copy.finalFeel = copy.finalFeel || copy.description || copy.notes || '';
  copy.langHints = copy.langHints || copy.languageHints || [];
  return copy;
}

function findBiome(input={}){
  if(!biomes.length) return null;
  const desired = normalize([input.biome, input.originBiome, input.accent, input.region].join(' '));
  if(desired){
    const exact = biomes.find(b => [b.id, b.biome, b.fantasyAccent, b.fantasyAccentName, b.baseAccent, b.baseAccentInspiration].some(v => normalize(v) === desired));
    if(exact) return exact;
    const byWords = biomes.find(b => {
      const hay = normalize([b.id, b.biome, b.fantasyAccent, b.fantasyAccentName, b.baseAccent, b.baseAccentInspiration, b.finalFeel].join(' '));
      return words(desired).some(w => w.length > 2 && hay.includes(w));
    });
    if(byWords) return byWords;
  }
  return biomes[0];
}

function buildProfile(input={}, sliderOverrides={}){
  const biome = findBiome(input);
  const decision = decideVoiceSource(manifest, input, biome || {});
  const selected = decision.selected ? normalizeVoiceItem(decision.selected) : null;
  const profile = buildVoiceProfile(input, biome, selected, sliderOverrides);
  profile.sourceVoice = selected;
  profile.voiceStudio = {
    source: 'voice_studio',
    library: 'voice_studio/s/character-studio-voice-library.js',
    manifest: 'voice_studio/s/voices.json',
    resourcePolicy: 'actual resources stay on GitHub; edited Character Studio zips return manifests/bridges only',
    githubBase: cfg().voiceStudioAssetBaseUrl || DEFAULT_GITHUB_VOICE_BASE
  };
  return { biome, decision: { ...decision, selected, runnerUp: (decision.runnerUp || []).map(r => normalizeVoiceItem(r)) }, profile };
}

export async function loadLinkedVoiceStudio(){
  cfg();
  loadErrors = [];
  const rawManifest = await fetchJsonCandidates([config.voiceManifestPath || 'voices.json'], []);
  const rawBiomes = await fetchJsonCandidates(['biomes.json'], []);
  folderManifest = await fetchJsonCandidates(['../manifests/voice_studio_resource_bot_full_manifest.json', 'voice_studio_resource_bot_full_manifest.json'], null);
  manifest = Array.isArray(rawManifest) ? rawManifest.map(normalizeVoiceItem) : [];
  biomes = Array.isArray(rawBiomes) ? rawBiomes.map(normalizeBiomeItem) : [];
  loadedAt = new Date().toISOString();
  return getVoiceStudioStatus();
}

export function getVoiceStudioStatus(){
  return {
    ok: !!manifest.length,
    loadedAt,
    manifestCount: manifest.length,
    biomeCount: biomes.length,
    backendUrl: cfg().lockedBackendUrl || BACKEND_URL,
    voiceStudioAssetBaseUrl: cfg().voiceStudioAssetBaseUrl || DEFAULT_GITHUB_VOICE_BASE,
    sourceManifest: 'voice_studio/s/voices.json',
    folderManifestLoaded: !!folderManifest,
    entryPointPolicy: 'Only character_studio/index.html opens the app. voice_studio is resources + bot only.',
    returnPackagePolicy: 'Actual voice assets are omitted from revision zips unless the user says: send me voice studio assets.',
    loadErrors
  };
}

export async function buildLinkedVoice(input={}, sliderOverrides={}){
  if(!manifest.length) await loadLinkedVoiceStudio();
  const result = buildProfile(input, sliderOverrides);
  const summary = summarizeDecision(result.decision);
  const profileText = describeProfile(result.profile);
  return {
    ok: true,
    summary,
    profileText,
    biome: result.biome,
    decision: { ...result.decision, sourceLabel: result.profile?.sourceVoice?.speaker || result.profile?.sourceVoice?.source || result.profile?.sourceVoice?.id },
    profile: result.profile,
    status: getVoiceStudioStatus()
  };
}

export async function resolveWithBackend(profile, text='This is what I sound like.'){
  const response = await postToBackend('sourceResolve', {
    app: 'Character Studio',
    linkedVoiceStudio: true,
    text,
    profile,
    sourceVoice: profile?.sourceVoice || null,
    voiceStudioManifestPolicy: getVoiceStudioStatus().returnPackagePolicy
  });
  return response;
}

export function renderLinkedWav(text, profile, audioEl=null, download=false){
  const blob = renderProfileToWav(text, profile);
  const filename = `${escapeFile(profile?.character?.name || profile?.id || 'belavados_voice')}_linked_voice.wav`;
  let playableUrl = null;
  if(audioEl) playableUrl = playBlob(blob, audioEl);
  if(download) playableUrl = downloadBlob(blob, filename);
  return { blob, filename, playableUrl, mimeType: 'audio/wav' };
}

export function playBrowserVoice(text, profile){
  return speakWithBrowser(text, profile);
}

export async function requestBackendAudio(profile, text='This is what I sound like.', format='wav'){
  const response = await postToBackend('generateSpeech', {
    app: 'Character Studio',
    linkedVoiceStudio: true,
    format,
    text,
    profile,
    sourceVoice: profile?.sourceVoice || null,
    requestedExports: format === 'mp3' ? ['mp3'] : ['wav'],
    voiceStudioAssetBaseUrl: cfg().voiceStudioAssetBaseUrl || DEFAULT_GITHUB_VOICE_BASE
  });
  return { response, playableUrl: dataUrlFromBackendResponse(response) };
}

export async function createLinkedVoiceZip(text, profile, extras={}){
  const safe = escapeFile(profile?.character?.name || profile?.id || 'belavados_voice');
  const wav = renderProfileToWav(text, profile);
  const entries = [
    { name: `${safe}/voice-profile.json`, content: JSON.stringify(profile, null, 2) },
    { name: `${safe}/voice-summary.txt`, content: describeProfile(profile) },
    { name: `${safe}/voice-source-policy.txt`, content: 'Voice assets are linked from GitHub voice_studio paths and are not bundled in this ZIP. Use backend MP3/WAV export or linked WAV fallback.' },
    { name: `${safe}/${safe}_linked_voice.wav`, content: wav },
    { name: `${safe}/character-studio-export.json`, content: JSON.stringify(extras || {}, null, 2) }
  ];
  const zip = await createZipBlob(entries);
  return { zip, filename: `${safe}_linked_voice_export.zip` };
}

export function downloadLinkedBlob(blob, filename){
  return downloadBlob(blob, filename);
}

export function getVoiceManifest(){ return manifest.slice(); }
export function getBiomeManifest(){ return biomes.slice(); }

export default Object.freeze({
  loadLinkedVoiceStudio,
  getVoiceStudioStatus,
  buildLinkedVoice,
  resolveWithBackend,
  renderLinkedWav,
  playBrowserVoice,
  requestBackendAudio,
  createLinkedVoiceZip,
  downloadLinkedBlob,
  getVoiceManifest,
  getBiomeManifest
});
