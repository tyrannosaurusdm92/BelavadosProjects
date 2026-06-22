/*******************************************************
 * Optional Apps Script backend upgrade for Belavadös Effect Studio
 * Paste this over the launcher Code.gs only if you want cloud save/load.
 * It keeps the launcher behavior and adds saveProject/loadProject.
 *******************************************************/

const APP_NAME = 'Belavadös Effect Studio';
const APP_SHORT_NAME = 'Effect Studio';
const APP_DESCRIPTION = 'Belavadös responsive desktop and mobile effect layer studio.';
const APP_URL = 'https://tyrannosaurusdm92.github.io/BelavadosProjects/BelavadosEffectStudio';
const ICON_192 = APP_URL + '/icons/icon-192.svg';
const ICON_512 = APP_URL + '/icons/icon-512.svg';
const THEME_COLOR = '#00ffff';
const BACKGROUND_COLOR = '#050713';
const STORE_PREFIX = 'BELAVADOS_EFFECT_STUDIO__';

function doGet(e) {
  const p = (e && e.parameter) || {};
  const route = String(p.route || p.action || 'app').toLowerCase();

  if (route === 'manifest') return manifest_();
  if (route === 'offline') return offline_();
  if (route === 'loadproject') return loadProject_(p);

  return HtmlService.createHtmlOutput(appShell_())
    .setTitle(APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  const p = (e && e.parameter) || {};
  const action = String(p.action || '').toLowerCase();
  if (action === 'saveproject') return saveProject_(p);
  return json_({ ok:false, error:'Unknown action' }, p.callback);
}

function saveProject_(p) {
  const key = STORE_PREFIX + String(p.projectKey || 'default').replace(/[^a-zA-Z0-9_:-]/g, '_');
  const payload = String(p.payload || '');
  if (!payload) return json_({ ok:false, error:'Missing payload' }, p.callback);
  PropertiesService.getScriptProperties().setProperty(key, payload);
  PropertiesService.getScriptProperties().setProperty(key + '__savedAt', new Date().toISOString());
  return json_({ ok:true, savedAt:new Date().toISOString() }, p.callback);
}

function loadProject_(p) {
  const key = STORE_PREFIX + String(p.projectKey || 'default').replace(/[^a-zA-Z0-9_:-]/g, '_');
  const raw = PropertiesService.getScriptProperties().getProperty(key);
  if (!raw) return json_({ ok:false, error:'No saved project found' }, p.callback);
  let payload;
  try { payload = JSON.parse(raw); } catch (err) { payload = raw; }
  return json_({ ok:true, savedAt:PropertiesService.getScriptProperties().getProperty(key + '__savedAt'), payload }, p.callback);
}

function manifest_() {
  return json_({
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: APP_URL,
    scope: APP_URL + '/',
    display: 'standalone',
    orientation: 'any',
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    icons: [
      { src: ICON_192, sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: ICON_512, sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
    ]
  });
}

function offline_() {
  return HtmlService.createHtmlOutput('<!doctype html><title>Offline</title><body style="background:#050713;color:#e8ffff;font-family:Arial;padding:24px"><h1>Offline</h1><p>Reconnect and open Belavadös Effect Studio again.</p><p><a style="color:#00ffff" href="' + APP_URL + '">Open Studio</a></p></body>')
    .setTitle(APP_NAME + ' Offline')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function appShell_() {
  return '<!doctype html><html><head><base target="_top"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' + APP_NAME + '</title><style>html,body{margin:0;min-height:100%;background:#050713;color:#e8ffff;font-family:Arial;display:grid;place-items:center;text-align:center}main{max-width:680px;padding:24px}a,button{display:inline-flex;margin:8px;padding:12px 18px;border-radius:999px;border:2px solid #00ffff;background:#09333a;color:#e8ffff;text-decoration:none;font-weight:900}</style></head><body><main><h1>' + APP_NAME + '</h1><p>Launcher connected. Open or install the GitHub studio.</p><p><a href="' + APP_URL + '">Open Studio</a></p></main><script>setTimeout(function(){ if (matchMedia("(display-mode: standalone)").matches) location.href="' + APP_URL + '"; },700);</script></body></html>';
}

function json_(obj, callback) {
  const body = callback ? String(callback).replace(/[^a-zA-Z0-9_$\.]/g, '') + '(' + JSON.stringify(obj) + ');' : JSON.stringify(obj);
  return ContentService.createTextOutput(body).setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}
