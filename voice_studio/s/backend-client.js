export const BACKEND_URL = "https://script.google.com/macros/s/AKfycbyr4TwLilCubnWm_g-N8nIZUiWR3GJ7-nzeV8dc1vJctcPHHFU3bCg96yi5retOUeZGfQ/exec";

export async function postToBackend(action, payload = {}) {
  const body = { action, app: 'Voice Studio', timestamp: new Date().toISOString(), ...payload };
  const res = await fetch(BACKEND_URL, {
    method: 'POST',
    mode: 'cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body)
  });
  const text = await res.text();
  try { return JSON.parse(text); } catch (err) { return { ok: res.ok, raw: text, status: res.status }; }
}

export function dataUrlFromBackendResponse(response) {
  if (!response) return null;
  if (response.audioUrl) return response.audioUrl;
  if (response.audioBase64) {
    const mime = response.mimeType || response.contentType || 'audio/wav';
    return `data:${mime};base64,${response.audioBase64}`;
  }
  return null;
}
