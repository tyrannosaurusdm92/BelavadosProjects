export const BACKEND_URL = "https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec";
export const VOICE_STUDIO_PAGE_URL = "https://tyrannosaurusdm92.github.io/BelavadosProjects/voice_studio/index.html";
export const BACKEND_MODULE = "universal";

const ACTION_ALIASES = Object.freeze({
  ping: 'health',
  health: 'health',
  saveProfile: 'presets.save',
  generateSpeech: 'voice.synth.renderWav',
  sourceResolve: 'voice.source.resolve',
  botDecide: 'bots.decide',
  botChat: 'bots.chat',
  saveAudio: 'audio.export.save',
  saveJson: 'json.export.save',
  superbotChat: 'chats.send',
  superbotMessages: 'chats.messages',
  superbotLearn: 'learning.record',
  superbotSearchMemory: 'learning.search',
  superbotTasks: 'tasks.fromText',
  superbotFileIndex: 'file.indexText',
  superbotGithubScan: 'github.scan',
  superbotCoverage: 'project.coverage',
  superbotVoiceSimulate: 'voice.simulate',
});

export function backendAction(action) {
  return ACTION_ALIASES[action] || action;
}

function encodeBody(body) {
  // Apps Script web apps handle simple form posts more reliably than JSON preflight requests.
  // Flatten top-level fields so both the merged dispatcher and the wrapped universal backend see `action`.
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(body || {})) {
    if (value === undefined) continue;
    params.set(key, value && typeof value === 'object' ? JSON.stringify(value) : String(value));
  }
  params.set('payload', JSON.stringify(body));
  return params;
}

export async function postToBackend(action, payload = {}) {
  const normalizedAction = backendAction(action);
  const body = {
    backend: BACKEND_MODULE,
    projectId: 'voice_studio',
    app: 'Voice Studio',
    pageUrl: VOICE_STUDIO_PAGE_URL,
    action: normalizedAction,
    timestamp: new Date().toISOString(),
    ...payload,
    lockedDeploymentUrl: BACKEND_URL
  };
  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    mode: 'cors',
    body: encodeBody(body)
  });
  const text = await res.text();
  let parsed;
  try { parsed = JSON.parse(text); } catch (_err) { parsed = { ok: res.ok, raw: text, status: res.status }; }
  if (!parsed || typeof parsed !== 'object') parsed = { ok: res.ok, raw: text, status: res.status };
  parsed._voiceStudioRequest = { action: normalizedAction, backend: BACKEND_MODULE, endpoint: BACKEND_URL };
  return parsed;
}

export function dataUrlFromBackendResponse(response) {
  if (!response) return null;
  if (response.audioUrl) return response.audioUrl;
  if (response.downloadUrl) return response.downloadUrl;
  if (response.url && /^https?:/i.test(response.url)) return response.url;
  if (response.audioBase64) {
    const mime = response.mimeType || response.contentType || 'audio/wav';
    return `data:${mime};base64,${response.audioBase64}`;
  }
  const exportRecord = response.wavExport || response.audioExport || response.export || null;
  if (exportRecord && (exportRecord.downloadUrl || exportRecord.viewUrl || exportRecord.fileUrl)) return exportRecord.downloadUrl || exportRecord.viewUrl || exportRecord.fileUrl;
  const exports = response.exports || response.job?.exports || [];
  const audio = Array.isArray(exports) ? exports.find(item => /audio|wav|mp3/i.test(String(item?.mimeType || item?.format || item?.filename || ''))) : null;
  if (audio) return audio.downloadUrl || audio.viewUrl || audio.fileUrl || null;
  return null;
}
