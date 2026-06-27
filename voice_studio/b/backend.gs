/**
 * Voice Studio reference backend for Google Apps Script.
 * Deploy as Web App and set access to anyone with the link.
 * This script stores profiles and routes TTS requests. Apps Script has no native MP3 TTS encoder;
 * plug an approved TTS/MP3 service into generateSpeech_() when available.
 */
const VOICE_STUDIO_FOLDER = 'Voice Studio Generated Files';

function doGet(e) {
  return json_({ ok: true, app: 'Voice Studio', message: 'Backend online', time: new Date().toISOString() });
}

function doPost(e) {
  let payload = {};
  try { payload = JSON.parse(e.postData && e.postData.contents || '{}'); }
  catch (err) { return json_({ ok: false, error: 'Invalid JSON', details: String(err) }); }
  const action = payload.action || 'ping';
  try {
    if (action === 'ping') return json_({ ok: true, pong: true, time: new Date().toISOString() });
    if (action === 'saveProfile') return json_(saveProfile_(payload.profile));
    if (action === 'generateSpeech') return json_(generateSpeech_(payload.profile, payload.text, payload.requestedFormat));
    if (action === 'listProfiles') return json_(listProfiles_());
    return json_({ ok: false, error: 'Unknown action', action });
  } catch (err) {
    return json_({ ok: false, error: String(err), stack: err && err.stack });
  }
}

function saveProfile_(profile) {
  const folder = getFolder_();
  const name = sanitize_((profile && profile.character && profile.character.name) || 'voice-profile') + '_' + new Date().toISOString().replace(/[:.]/g,'-') + '.json';
  const file = folder.createFile(name, JSON.stringify(profile, null, 2), MimeType.JSON);
  return { ok: true, profileId: file.getId(), url: file.getUrl(), name };
}

function listProfiles_() {
  const folder = getFolder_();
  const files = folder.getFilesByType(MimeType.JSON);
  const out = [];
  while (files.hasNext()) {
    const f = files.next();
    out.push({ id: f.getId(), name: f.getName(), url: f.getUrl(), updated: f.getLastUpdated() });
  }
  return { ok: true, profiles: out };
}

function generateSpeech_(profile, text, requestedFormat) {
  // Native fallback: create a tiny metadata JSON plus a simple WAV-like tonal sketch in base64.
  // Replace this block with a permitted TTS provider call if your deployed backend has one.
  const folder = getFolder_();
  const cleanText = String(text || 'This is what I sound like.').slice(0, 1000);
  const meta = { profile, text: cleanText, requestedFormat, note: 'Reference backend received request. Plug in TTS provider here for MP3.' };
  const file = folder.createFile(sanitize_((profile && profile.character && profile.character.name) || 'voice') + '_request.json', JSON.stringify(meta, null, 2), MimeType.JSON);
  return { ok: true, needsTtsProvider: true, requestUrl: file.getUrl(), message: 'Profile/text saved. No native Apps Script MP3 encoder is configured.' };
}

function getFolder_() {
  const it = DriveApp.getFoldersByName(VOICE_STUDIO_FOLDER);
  return it.hasNext() ? it.next() : DriveApp.createFolder(VOICE_STUDIO_FOLDER);
}
function sanitize_(s) { return String(s).replace(/[^a-z0-9_ -]+/gi, '').trim().replace(/\s+/g, '_').slice(0, 80) || 'voice'; }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
