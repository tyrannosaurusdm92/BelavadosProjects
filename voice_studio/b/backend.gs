/******************************************************************************
 * TyrannosaurusDM92 — ONE MERGED GOOGLE APPS SCRIPT BACKEND
 * ---------------------------------------------------------------------------
 * Generated: 2026-06-27
 * Pages root: https://tyrannosaurusdm92.github.io
 *
 * Purpose:
 *   One deployable Code.gs that keeps the uploaded backends together without
 *   breaking Apps Script on duplicate doGet/doPost/setup/helper names.
 *
 * Included wrapped backends:
 *   - Universal GitHub project backend + Belavadös Character Studio routes
 *   - Original Belavadös Character Studio backend
 *   - PlayerZone encounter / roleplaying board backend
 *   - Belavadös Effect Studio launcher + local map_assets bridge config
 *   - Social Application shared backend
 *   - OurSpace Unified Backend
 *
 * How routing works:
 *   GET  /exec?action=health                         -> merged health
 *   GET  /exec?backend=belavados                     -> Belavadös launcher
 *   GET  /exec?backend=playerzone                    -> PlayerZone board
 *   GET  /exec?backend=effect                        -> Effect Studio launcher
 *   POST /exec { action:"projects.scanGithub" }      -> Universal GitHub scan
 *   POST /exec { action:"bots.chat" }                -> Universal bot chat bridge
 *   POST /exec { backend:"ourspace", action:"..." } -> OurSpace backend
 *   POST /exec { backend:"social", action:"..." }   -> Social backend
 *
 * Prefix shortcuts also work:
 *   action="ourspace.signin" sends action="signin" to OurSpace.
 *   action="playerzone.apiJoin" calls PlayerZone apiJoin() and returns JSON.
 *
 * Important limits:
 *   Apps Script stores, validates, routes, scans text files, sends mail, and
 *   can forward requests to external AI/TTS/STT services. It is not itself a
 *   real-time websocket/media/DSP server or a local Windows file reader.
 ******************************************************************************/

var TDM92_MERGED_BACKEND = Object.freeze({
  appName: 'TyrannosaurusDM92 One Merged Backend',
  version: '2026-06-27.one-file-merge.v1',
  pagesOrigin: 'https://tyrannosaurusdm92.github.io',
  githubOwner: 'tyrannosaurusdm92',
  defaultBackend: 'universal',
  modules: ['universal', 'belavados', 'playerzone', 'effect', 'social', 'ourspace'],
  colors: { cyan: '#00FFFF', orange: '#CA6309' }
});

var TDM92_MODULE_CACHE = {};

var TDM92_OURSPACE_ACTIONS = [
  'signup','signin','signout','me','bootstrap','requestPasswordReset','resetPassword',
  'auth.signup','auth.signin','auth.signout','auth.me','auth.bootstrap',
  'profile.get','profile.save','profile.list','preference.get','preference.set','preference.list',
  'link.add','link.list','link.remove','music.add','music.list','app.event','pwa.install.record',
  'pwa.manifest.hints','channel.create','channel.upsert','channel.list','message.send','message.create',
  'message.list','message.react','message.delete','call.create','call.update','call.end',
  'call.signal.send','call.signal','call.signal.list','call.signal.clear','upload.media','media.list',
  'gif.save','gif.list','sticker.save','sticker.fromText','sticker.list','effect.save','effect.list',
  'voice.message.save','audio.transcript.save','audio.transcribe.request','currency.earn','currency.spend',
  'currency.adjust','currency.balance','purchase.create','purchase.list','purchase.update','calendar.save',
  'calendar.list','schedule.save','schedule.list','task.complete','task.list','record.save','record.get',
  'record.list','store.catalog.save','store.catalog.get','publicLinks','share','publicPurchaseRequest',
  'whoami','getPublicShareUrl','rotateShareId','savePrivateAddress','getMyPrivateAddress',
  'upsertPublicLink','deletePublicLink','listMyLinks','listPurchaseRequests','updatePurchaseRequestStatus',
  'mergedHealth','healthMerged'
];

var TDM92_SOCIAL_ACTIONS = [
  'cloud_auth_sign_in','google_auth_sign_in','link_cloud_provider','send_invite_email',
  'deliver_temporary_password','email_temporary_password','create_account','sign_in',
  'request_password_reset','tell_dino_cant_login','update_password','login','register','logout',
  'state','onlineUsers','heartbeat','presence','profile','post','comment','reaction','message',
  'importHistory','story','exportData','event','file','messengerEnvelope','messengerHistory',
  'save_record','appRecord','list_records','appRecords','save_media_asset','mediaAsset','camera_capture',
  'save_voice_message','voiceMessage','save_video','videoAsset','request_transcription','transcribe_media',
  'save_transcript','update_transcript','save_face_profile','faceProfile','list_face_profiles',
  'match_face_descriptor','recognize_face','save_filter_preset','filterPreset','list_filter_presets',
  'create_call','callCreate','join_call','callJoin','leave_call','callLeave','end_call','callEnd',
  'call_signal','callSignal','poll_call','callPoll','roomJoin','roomHeartbeat','roomLeave',
  'roomSignal','roomChat','roomReaction','roomRaiseHand','roomPoll','iceConfig','ice_config'
];

var TDM92_BELAVADOS_ACTION_PREFIXES = [
  'catalog.', 'voice.', 'presets.', 'assets.', 'media.active.', 'sliders.'
];
var TDM92_UNIVERSAL_ACTION_PREFIXES = [
  'projects.', 'project.', 'github.', 'bots.', 'bot.', 'notifications.', 'app.', 'apps.', 'universal.'
];

function setup() {
  return TDM92_SETUP_ALL();
}

function TDM92_SETUP_ALL() {
  var results = [];
  results.push(tdm92_trySetup_('universal', function () {
    var m = tdm92_module_universal_();
    return m.setup_ ? m.setup_() : { ok: true, skipped: true };
  }));
  results.push(tdm92_trySetup_('ourspace', function () {
    var m = tdm92_module_ourspace_();
    return m.setup ? m.setup() : { ok: true, skipped: true };
  }));
  results.push(tdm92_trySetup_('social', function () {
    var m = tdm92_module_social_();
    return m.setup ? m.setup() : { ok: true, skipped: true };
  }));
  return { ok: true, app: TDM92_MERGED_BACKEND.appName, version: TDM92_MERGED_BACKEND.version, setupResults: results };
}

function TDM92_CREATE_BACKEND_SPREADSHEET() { return TDM92_SETUP_ALL(); }
function OURSPACE_CREATE_BACKEND_SPREADSHEET() { return tdm92_module_ourspace_().OURSPACE_CREATE_BACKEND_SPREADSHEET(); }
function OURSPACE_SET_PASSCODES_ONCE() { return tdm92_module_ourspace_().OURSPACE_SET_PASSCODES_ONCE(); }
function OURSPACE_ADD_DEMO_LINK_OPTIONAL() { return tdm92_module_ourspace_().OURSPACE_ADD_DEMO_LINK_OPTIONAL(); }

function doGet(e) {
  return tdm92_dispatch_(e, 'GET');
}

function doPost(e) {
  return tdm92_dispatch_(e, 'POST');
}

function doOptions(e) {
  return tdm92_json_({ ok: true, app: TDM92_MERGED_BACKEND.appName, note: 'Use simple GET/POST requests; CORS preflight is limited in Apps Script web apps.' });
}

function tdm92_dispatch_(e, method) {
  try {
    var req = tdm92_parseEvent_(e, method);
    var backend = tdm92_backendFromRequest_(req);
    var action = String(req.action || '').trim();

    if (!backend && action.indexOf('.') > 0) {
      var first = action.split('.')[0].toLowerCase();
      if (['ourspace','social','playerzone','effect','belavados','universal'].indexOf(first) >= 0) {
        backend = first;
        req.action = action.split('.').slice(1).join('.');
        e = tdm92_eventWithOverrides_(e, { action: req.action, backend: backend }, method);
        action = req.action;
      }
    }

    if (!backend && method === 'GET') {
      var route = String(req.route || '').toLowerCase();
      if (route.indexOf('local-assets') >= 0 || route.indexOf('map-assets') >= 0 || route === 'offline') backend = 'effect';
    }

    if (!backend && action) backend = tdm92_inferBackendFromAction_(action);

    if (action === 'setup' || action === 'setupAll' || action === 'TDM92_SETUP_ALL') return tdm92_json_(TDM92_SETUP_ALL());
    if (action === 'health' || action === 'mergedHealth' || action === 'tdm92.health') return tdm92_json_(tdm92_health_());
    if (action === 'launcher' || action === 'app' || (!backend && method === 'GET' && !action)) return tdm92_launcher_();

    if (backend === 'playerzone') {
      if (method === 'GET' && (!action || action === 'app' || action === 'launcher')) return tdm92_module_playerzone_().doGet(e);
      if (action && tdm92_module_playerzone_()[action]) return tdm92_json_(tdm92_callModuleFunction_('playerzone', action, [req.payload || req]));
      return tdm92_json_({ ok: false, error: 'Unknown PlayerZone action: ' + action });
    }

    if (backend === 'effect') {
      return tdm92_module_effect_().doGet(e);
    }

    if (backend === 'ourspace') {
      return method === 'POST' ? tdm92_module_ourspace_().doPost(e) : tdm92_module_ourspace_().doGet(e);
    }

    if (backend === 'social') {
      return method === 'POST' ? tdm92_module_social_().doPost(e) : tdm92_module_social_().doGet(e);
    }

    if (backend === 'belavados-original') {
      return method === 'POST' ? tdm92_module_belavados_().doPost(e) : tdm92_module_belavados_().doGet(e);
    }

    // Default: the revised universal backend, which also includes Belavadös Character Studio routes.
    if (backend === 'belavados' || backend === 'universal' || !backend) {
      return method === 'POST' ? tdm92_module_universal_().doPost(e) : tdm92_module_universal_().doGet(e);
    }

    return tdm92_json_({ ok: false, error: 'Unknown backend/module: ' + backend, supportedBackends: TDM92_MERGED_BACKEND.modules });
  } catch (err) {
    return tdm92_json_({ ok: false, error: String(err && err.message ? err.message : err), stack: String(err && err.stack ? err.stack : '') });
  }
}

function tdm92_health_() {
  return {
    ok: true,
    app: TDM92_MERGED_BACKEND.appName,
    version: TDM92_MERGED_BACKEND.version,
    pagesOrigin: TDM92_MERGED_BACKEND.pagesOrigin,
    modules: TDM92_MERGED_BACKEND.modules,
    routing: {
      backendParam: 'backend=universal|belavados|belavados-original|playerzone|effect|social|ourspace',
      prefixActionExample: 'ourspace.signin, playerzone.apiJoin, bots.chat',
      defaultBackend: TDM92_MERGED_BACKEND.defaultBackend
    },
    scriptProperties: {
      github: ['GITHUB_TOKEN optional', 'GITHUB_OWNER optional', 'GITHUB_REPOSITORIES optional'],
      ai: ['AI_API_URL optional', 'AI_API_KEY optional', 'AI_MODEL optional'],
      notifications: ['NOTIFICATION_DEFAULT_TO optional', 'ADMIN_KEY optional']
    },
    now: new Date().toISOString()
  };
}

function tdm92_launcher_() {
  var url = ScriptApp.getService().getUrl() || '';
  var html = '<!doctype html><html><head><base target="_top"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>' +
    tdm92_esc_(TDM92_MERGED_BACKEND.appName) + '</title><style>body{margin:0;min-height:100vh;background:#050814;color:#f4ffff;font-family:Georgia,serif;display:grid;place-items:center;padding:24px}.card{max-width:920px;border:2px solid #00FFFF;border-radius:28px;padding:28px;background:rgba(7,14,30,.9);box-shadow:0 0 38px rgba(0,255,255,.22)}h1{margin-top:0;text-shadow:2px 2px 0 #000}a,code{color:#00FFFF}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.btn{display:block;border:1px solid #00FFFF;border-radius:18px;padding:14px;text-decoration:none;background:rgba(0,255,255,.08)}small{color:#bdefff}</style></head><body><main class="card"><h1>TyrannosaurusDM92 One Merged Backend</h1><p>One deployed Google Apps Script endpoint for projects under <code>https://tyrannosaurusdm92.github.io</code>.</p><div class="grid">' +
    tdm92_link_(url + '?action=health', 'Merged Health') +
    tdm92_link_(url + '?backend=belavados', 'Belavadös / Universal') +
    tdm92_link_(url + '?backend=playerzone', 'PlayerZone Board') +
    tdm92_link_(url + '?backend=effect', 'Effect Studio Launcher') +
    tdm92_link_(url + '?backend=ourspace&action=health', 'OurSpace Health') +
    '</div><p><small>POST actions such as <code>projects.scanGithub</code>, <code>bots.chat</code>, <code>voice.source.resolve</code>, and <code>notifications.send</code> route to the Universal backend. Use <code>backend=ourspace</code>, <code>backend=social</code>, <code>backend=playerzone</code>, or action prefixes when a project needs a specific backend.</small></p></main></body></html>';
  return HtmlService.createHtmlOutput(html).setTitle(TDM92_MERGED_BACKEND.appName).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function tdm92_link_(href, label) { return '<a class="btn" href="' + tdm92_esc_(href) + '">' + tdm92_esc_(label) + '</a>'; }
function tdm92_esc_(value) { return String(value == null ? '' : value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

function tdm92_trySetup_(name, fn) {
  try { return { module: name, result: fn() }; }
  catch (err) { return { module: name, ok: false, error: String(err && err.message ? err.message : err) }; }
}

function tdm92_parseEvent_(e, method) {
  var p = (e && e.parameter) || {};
  var body = {};
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    var raw = String(e.postData.contents || '');
    try { body = JSON.parse(raw || '{}'); }
    catch (_jsonErr) { body = tdm92_parseFormEncoded_(raw); }
  }
  if (typeof body.payload === 'string') {
    try { body.payload = JSON.parse(body.payload); } catch (_payloadErr) {}
  }
  var payload = {};
  tdm92_mergeInto_(payload, p);
  tdm92_mergeInto_(payload, body);
  if (body && body.payload && typeof body.payload === 'object') tdm92_mergeInto_(payload, body.payload);
  return {
    method: method,
    action: String(payload.action || ''),
    backend: String(payload.backend || payload.module || payload.appBackend || payload.projectBackend || ''),
    route: String(payload.route || ''),
    projectId: String(payload.projectId || payload.project || ''),
    payload: payload
  };
}

function tdm92_backendFromRequest_(req) {
  var raw = String(req.backend || '').trim().toLowerCase();
  if (!raw && req.projectId) raw = String(req.projectId).trim().toLowerCase();
  raw = raw.replace(/[^a-z0-9._-]+/g, '-');
  if (!raw) return '';
  if (raw.indexOf('ourspace') >= 0) return 'ourspace';
  if (raw.indexOf('playerzone') >= 0 || raw.indexOf('roleplaying') >= 0 || raw.indexOf('encounter') >= 0) return 'playerzone';
  if (raw.indexOf('effect') >= 0 || raw.indexOf('map-assets') >= 0) return 'effect';
  if (raw.indexOf('social') >= 0) return 'social';
  if (raw.indexOf('belavados-original') >= 0) return 'belavados-original';
  if (raw.indexOf('belavados') >= 0 || raw.indexOf('character') >= 0 || raw.indexOf('voice') >= 0) return 'belavados';
  if (raw.indexOf('universal') >= 0 || raw.indexOf('github') >= 0 || raw.indexOf('bot') >= 0) return 'universal';
  return raw;
}

function tdm92_inferBackendFromAction_(action) {
  var a = String(action || '');
  for (var i = 0; i < TDM92_UNIVERSAL_ACTION_PREFIXES.length; i++) if (a.indexOf(TDM92_UNIVERSAL_ACTION_PREFIXES[i]) === 0) return 'universal';
  for (var j = 0; j < TDM92_BELAVADOS_ACTION_PREFIXES.length; j++) if (a.indexOf(TDM92_BELAVADOS_ACTION_PREFIXES[j]) === 0) return 'universal';
  if (a.indexOf('api') === 0 && tdm92_module_playerzone_()[a]) return 'playerzone';
  if (TDM92_OURSPACE_ACTIONS.indexOf(a) >= 0) return 'ourspace';
  if (TDM92_SOCIAL_ACTIONS.indexOf(a) >= 0) return 'social';
  if (['clientConfig','saveSharedState','loadSharedState','saveCharacter','loadCharacter','listCharacters','deleteCharacter','logEvent','exportAllData','export.all','admin.resetStorage','health','ping'].indexOf(a) >= 0) return 'universal';
  return '';
}

function tdm92_eventWithOverrides_(e, overrides, method) {
  var params = {};
  tdm92_mergeInto_(params, (e && e.parameter) || {});
  tdm92_mergeInto_(params, overrides || {});
  var out = { parameter: params, parameters: {}, postData: e && e.postData ? e.postData : null };
  Object.keys(params).forEach(function (k) { out.parameters[k] = [params[k]]; });
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    var body = {};
    try { body = JSON.parse(String(e.postData.contents || '{}')); }
    catch (_err) { body = tdm92_parseFormEncoded_(String(e.postData.contents || '')); }
    tdm92_mergeInto_(body, overrides || {});
    out.postData = { contents: JSON.stringify(body), type: 'application/json' };
  }
  return out;
}

function tdm92_parseFormEncoded_(raw) {
  var out = {};
  String(raw || '').split('&').forEach(function (pair) {
    if (!pair) return;
    var parts = pair.split('=');
    var key = decodeURIComponent(parts[0] || '');
    var value = decodeURIComponent((parts.slice(1).join('=') || '').replace(/\+/g, ' '));
    if (!key) return;
    try { out[key] = JSON.parse(value); } catch (_err) { out[key] = value; }
  });
  return out;
}

function tdm92_mergeInto_(target, source) {
  source = source || {};
  Object.keys(source).forEach(function (k) { target[k] = source[k]; });
  return target;
}

function tdm92_json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj, null, 2)).setMimeType(ContentService.MimeType.JSON);
}

function tdm92_callModuleFunction_(moduleName, functionName, args) {
  var module = tdm92_moduleByName_(moduleName);
  if (!module || typeof module[functionName] !== 'function') throw new Error('Module function not found: ' + moduleName + '.' + functionName);
  return module[functionName].apply(null, args || []);
}

function tdm92_moduleByName_(name) {
  if (name === 'universal') return tdm92_module_universal_();
  if (name === 'belavados' || name === 'belavados-original') return tdm92_module_belavados_();
  if (name === 'playerzone') return tdm92_module_playerzone_();
  if (name === 'effect') return tdm92_module_effect_();
  if (name === 'social') return tdm92_module_social_();
  if (name === 'ourspace') return tdm92_module_ourspace_();
  return null;
}

function tdm92_callPlayerZoneApi_(name, argsObj) {
  return tdm92_callModuleFunction_('playerzone', name, Array.prototype.slice.call(argsObj || []));
}

/* PlayerZone google.script.run compatibility wrappers. */
function apiPing() { return tdm92_callPlayerZoneApi_('apiPing', arguments); }
function apiLoadState() { return tdm92_callPlayerZoneApi_('apiLoadState', arguments); }
function apiJoin() { return tdm92_callPlayerZoneApi_('apiJoin', arguments); }
function apiHeartbeat() { return tdm92_callPlayerZoneApi_('apiHeartbeat', arguments); }
function apiImportCharacter() { return tdm92_callPlayerZoneApi_('apiImportCharacter', arguments); }
function apiImportParty() { return tdm92_callPlayerZoneApi_('apiImportParty', arguments); }
function apiImportMap() { return tdm92_callPlayerZoneApi_('apiImportMap', arguments); }
function apiSetCurrentMap() { return tdm92_callPlayerZoneApi_('apiSetCurrentMap', arguments); }
function apiImportAudio() { return tdm92_callPlayerZoneApi_('apiImportAudio', arguments); }
function apiSetScene() { return tdm92_callPlayerZoneApi_('apiSetScene', arguments); }
function apiMoveToken() { return tdm92_callPlayerZoneApi_('apiMoveToken', arguments); }
function apiSetToken() { return tdm92_callPlayerZoneApi_('apiSetToken', arguments); }
function apiRoll() { return tdm92_callPlayerZoneApi_('apiRoll', arguments); }
function apiSkillCheck() { return tdm92_callPlayerZoneApi_('apiSkillCheck', arguments); }
function apiAttack() { return tdm92_callPlayerZoneApi_('apiAttack', arguments); }
function apiCastSpell() { return tdm92_callPlayerZoneApi_('apiCastSpell', arguments); }
function apiInteract() { return tdm92_callPlayerZoneApi_('apiInteract', arguments); }
function apiRollInitiative() { return tdm92_callPlayerZoneApi_('apiRollInitiative', arguments); }
function apiEndTurn() { return tdm92_callPlayerZoneApi_('apiEndTurn', arguments); }
function apiDMGenerateEncounter() { return tdm92_callPlayerZoneApi_('apiDMGenerateEncounter', arguments); }
function apiDMAddFeature() { return tdm92_callPlayerZoneApi_('apiDMAddFeature', arguments); }
function apiResetSession() { return tdm92_callPlayerZoneApi_('apiResetSession', arguments); }
function apiExportState() { return tdm92_callPlayerZoneApi_('apiExportState', arguments); }
function apiImportFullState() { return tdm92_callPlayerZoneApi_('apiImportFullState', arguments); }

/* ==========================================================================
 * Wrapped source module: TyrannosaurusDM92 Universal Project Backend + Belavadös
 * ========================================================================== */
function tdm92_module_universal_() {
  if (TDM92_MODULE_CACHE.universal) return TDM92_MODULE_CACHE.universal;
  TDM92_MODULE_CACHE.universal = (function () {
/***************************************************************
 * Belavadös Character Studio Backend
 * Google Apps Script Web App Backend
 *
 * Deploy:
 * 1) Apps Script > New project
 * 2) Paste this into Code.gs
 * 3) Deploy > New deployment > Web app
 * 4) Execute as: Me
 * 5) Who has access: Anyone / Anyone with link
 *
 * Optional Script Properties:
 * - TTS_ENGINE_URL: external synthesis endpoint, if you add one later
 * - TTS_ENGINE_KEY: optional bearer/API key for external engine
 * - ADMIN_KEY: optional admin key for protected actions
 *
 * This backend validates and stores:
 * - 17 fantasy accent / biome manifests
 * - 680 generated 3-biome crossover manifests
 * - slider schema + defaults
 * - weighted crossover layer payloads
 * - user voice presets
 * - safety/permission asset registry
 * - synthesis job payloads
 *
 * Important:
 * Apps Script is not a real-time DSP engine. It validates and routes
 * the voice request. Actual PCM decoding, model mixing, resynthesis,
 * and waveform rendering should happen in your frontend or external
 * voice engine.
 ***************************************************************/

const APP_VERSION = 'tyrannosaurusdm92.universal-project-backend.v2.0.0';

const ALLOWED_ASSET_PERMISSION_TYPES = [
  'own_voice',
  'licensed_actor',
  'public_domain_character_asset',
  'synthetic_original'
];

const MAX_TEXT_CHARS = 5000;
const MAX_CACHE_BIOMES = 3;

const STORE_KEYS = {
  PRESETS_INDEX: 'BELAVADOS_PRESETS_INDEX',
  ASSETS_INDEX: 'BELAVADOS_ASSETS_INDEX',
  JOBS_INDEX: 'BELAVADOS_JOBS_INDEX',
  ACTIVE_CLIP: 'BELAVADOS_ACTIVE_CLIP'
};

/***************************************************************
 * UNIVERSAL PROJECT / BOT / GITHUB / APP CONFIG
 *
 * This add-on layer expands the original Belavadös backend so one
 * Apps Script deployment can support every public project served from
 * https://tyrannosaurusdm92.github.io plus project bots, project file
 * scanning, voice assets, notification delivery, and PWA/app manifests.
 *
 * Script Properties you can set after deployment:
 * - GITHUB_TOKEN: optional GitHub token for higher API limits/private repos.
 * - GITHUB_OWNER: defaults to tyrannosaurusdm92.
 * - GITHUB_REPOSITORIES: optional JSON array or comma list. Examples:
 *     [{"owner":"tyrannosaurusdm92","repo":"BelavadosProjects","branch":"main","pagesPath":"/BelavadosProjects/"}]
 *     BelavadosProjects,tyrannosaurusdm92.github.io
 * - AI_API_URL: OpenAI-compatible chat-completions endpoint, or your own bot endpoint.
 * - AI_API_KEY: bearer token for AI_API_URL.
 * - AI_MODEL: model name understood by your AI endpoint.
 * - NOTIFICATION_DEFAULT_TO: default email recipient for notifications.
 * - REQUIRE_ADMIN_FOR_NOTIFICATIONS: true/false. Defaults to true for arbitrary recipients.
 ***************************************************************/
const UNIVERSAL_PROJECT_BACKEND = {
  APP_NAME: 'TyrannosaurusDM92 Universal Project Backend',
  SHORT_NAME: 'TDM92 Backend',
  VERSION: '2.0.0',
  PAGES_ORIGIN: 'https://tyrannosaurusdm92.github.io',
  GITHUB_OWNER: 'tyrannosaurusdm92',
  DEFAULT_GITHUB_REPOS: [
    { owner: 'tyrannosaurusdm92', repo: 'BelavadosProjects', branch: 'main', pagesPath: '/BelavadosProjects/' },
    { owner: 'tyrannosaurusdm92', repo: 'tyrannosaurusdm92.github.io', branch: 'main', pagesPath: '/' }
  ],
  PROJECTS_FOLDER_NAME: 'projects',
  PROJECT_INDEX_FOLDER_NAME: 'github-index',
  CONVERSATIONS_FOLDER_NAME: 'bot-conversations',
  NOTIFICATIONS_FOLDER_NAME: 'notifications',
  VOICE_ASSETS_FOLDER_NAME: 'voice-assets',
  APPS_FOLDER_NAME: 'apps',
  AI_FOLDER_NAME: 'ai',
  MAX_INDEX_FILES: 2000,
  MAX_DEEP_SEARCH_FILES: 35,
  MAX_FILE_CHARS: 70000,
  MAX_BOT_CONTEXT_CHARS: 24000,
  MAX_HISTORY_MESSAGES: 16,
  ALLOWED_TEXT_EXTENSIONS: [
    'html', 'htm', 'css', 'js', 'mjs', 'json', 'jsonl', 'md', 'txt', 'csv',
    'xml', 'svg', 'yml', 'yaml', 'ts', 'tsx', 'jsx', 'gs', 'map'
  ],
  MEDIA_EXTENSIONS: [
    'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'ico', 'mp3', 'wav', 'ogg', 'm4a',
    'mp4', 'webm', 'mov', 'pdf', 'zip'
  ],
  BLOCKED_FILE_PATTERNS: [
    '/node_modules/', '/.git/', '/dist/vendor/', '/vendor/', '/.cache/', '/coverage/'
  ],
  DEFAULT_BOT: {
    id: 'default-project-bot',
    name: 'Project Helper Bot',
    level: 'chatgpt-3-to-4-configurable',
    role: 'Helpful project assistant that can inspect indexed GitHub project files, hold a conversation, infer user intent, and return grounded next steps.',
    projectScope: 'all',
    temperature: 0.35
  }
};

const UNIVERSAL_STORE_KEYS = {
  BOTS_INDEX: 'UNIVERSAL_BOTS_INDEX',
  PROJECT_APPS_INDEX: 'UNIVERSAL_PROJECT_APPS_INDEX',
  NOTIFICATIONS_INDEX: 'UNIVERSAL_NOTIFICATIONS_INDEX',
  PROJECT_REGISTRY_INDEX: 'UNIVERSAL_PROJECT_REGISTRY_INDEX',
  LAST_GITHUB_INDEX_META: 'UNIVERSAL_LAST_GITHUB_INDEX_META'
};


/***************************************************************
 * CHARACTER STUDIO APP / DRIVE STORAGE CONFIG
 *
 * This block is the non-voice merge from the older Character
 * Studio backend: launcher/PWA, setup, shared-state storage,
 * character save/load, logs, and basic export.
 *
 * Old voice preset, voice asset upload, and old voice-profile
 * resolver code were intentionally not merged. The updated voice
 * pipeline above remains the source of truth.
 ***************************************************************/
const BELAVADOS_CHARACTER_STUDIO = {
  APP_NAME: 'Belavadös Character Studio',
  SHORT_NAME: 'Belavadös',
  VERSION: '1.0.0',
  ROOT_FOLDER_NAME: 'TyrannosaurusDM92 Universal Projects Backend',
  DATA_FOLDER_NAME: 'data',
  CHARACTER_FOLDER_NAME: 'characters',
  SHARED_STATE_FOLDER_NAME: 'shared-state',
  LOG_FOLDER_NAME: 'logs',

  /*
   * After GitHub is ready, you may paste the final site URL here.
   * Example:
   * FRONTEND_URL: 'https://tyrannosaurusdm92.github.io/BelavadosProjects/BelavadosCharacterStudio/'
   */
  FRONTEND_URL: 'https://tyrannosaurusdm92.github.io/',

  THEME_COLOR: '#00ffff',
  BACKGROUND_COLOR: '#050814',

  /*
   * Optional lightweight protection.
   * Leave empty while developing.
   * If you later set this, frontend requests must include apiKey.
   */
  API_KEY: ''
};


const VOICE_SLIDER_SCHEMA = [
  { label: 'Voice Height', key: 'pitch', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Base pitch, F0, semitone shift, pitch range' },
  { label: 'Speaking Speed', key: 'speed', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Speech rate, duration, pacing' },
  { label: 'Expression Shape', key: 'inflection', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Pitch motion, melody, phrase movement' },
  { label: 'Hesitations', key: 'stutter', min: 0, max: 10, step: 0.1, default: 1.0, controls: 'Stutter chance, hesitation text, pause behavior' },
  { label: 'Softness', key: 'breath', min: 0, max: 10, step: 0.1, default: 3.0, controls: 'Airiness, aspiration, soft delivery' },
  { label: 'Gruff Edge', key: 'roughness', min: 0, max: 10, step: 0.1, default: 2.0, controls: 'Rough cadence, jitter/shimmer hints, gruff stress' },
  { label: 'Body / Depth', key: 'resonance', min: 0, max: 10, step: 0.1, default: 5.5, controls: 'Fullness, formant scale, chest/body feel' },
  { label: 'Speech Style', key: 'formality', min: 0, max: 10, step: 0.1, default: 5.5, controls: 'Formality, articulation, carefulness' },
  { label: 'Vowel Flow', key: 'vowelFlow', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Clipped vs stretched vowels' },
  { label: 'Consonant Bite', key: 'consonantBite', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Soft vs sharp consonants' },
  { label: 'Mouth Shape', key: 'mouthShape', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Closed vs open mouth feel' },
  { label: 'Nasal Color', key: 'nasality', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Oral vs nasal color' },
  { label: 'Throat Depth', key: 'throatDepth', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Forward vs back, throaty resonance' },
  { label: 'Speech Rhythm', key: 'rhythm', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Even vs bouncy cadence' },
  { label: 'Pause Space', key: 'pauseControl', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Tight vs spacious phrase timing' },
  { label: 'Word Emphasis', key: 'emphasis', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Gentle vs strong stress' },
  { label: 'Warmth', key: 'warmth', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Cool vs warm delivery' },
  { label: 'Clarity', key: 'clarity', min: 0, max: 10, step: 0.1, default: 6.0, controls: 'Muttered vs clear articulation' },
  { label: 'Projection', key: 'projection', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Quiet/private vs projected/outward' },
  { label: 'Human Variation', key: 'humanVariation', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Mechanical steadiness vs lifelike micro-variation' },
  { label: 'Accent Color', key: 'accentColor', min: 0, max: 10, step: 0.1, default: 7.0, controls: 'Removes or strengthens accent mouth-feel' },

  { label: 'Race / Ancestry Influence', key: 'influenceRace', min: 0, max: 1, step: 0.01, default: 1.0, percent: true, controls: 'How strongly ancestry/species modifies the base voice' },
  { label: 'Gender Identity Influence', key: 'influenceGender', min: 0, max: 1, step: 0.01, default: 1.0, percent: true, controls: 'How strongly gender-linked style affects the voice' },
  { label: 'Personality Influence', key: 'influencePersonality', min: 0, max: 1, step: 0.01, default: 1.0, percent: true, controls: 'How strongly personality affects delivery' },
  { label: 'Accent Strength / Remove Accent', key: 'influenceBiome', min: 0, max: 1, step: 0.01, default: 1.0, percent: true, controls: 'How strongly biome/accent rules appear or fade' },
  { label: 'Uploaded / Recorded Voice Influence', key: 'influenceBaseAudio', min: 0, max: 1, step: 0.01, default: 0.45, percent: true, controls: 'How much the original clip remains in the result' },
  { label: 'Emotion Strength', key: 'emotionIntensity', min: 0, max: 1, step: 0.01, default: 0.75, percent: true, controls: 'How strongly emotion curves reshape pitch, timing, and tone' }
];

const BIOME_CATALOG = [
  {
    id: 'ocean_surface_floating_settlement',
    folderName: 'tidecrest-cant',
    category: 'Ocean',
    biome: 'Ocean Surface Floating Settlement',
    fantasyAccentName: 'Tidecrest Cant',
    baseAccentInspiration: 'Portuguese',
    raceOverlayBehavior: 'Humans sound closest to the base; elves make it airy; dwarves make it harsher; aquatic races make it very fluid.',
    classOverlayBehavior: 'Merchants sound like dock traders; captains/warriors sound commanding; bards sound sea-shanty-like.',
    finalVoiceFeel: 'Open, rolling, maritime, lively.',
    modelSuggestions: ['piper_pt_PT', 'kokoro_portuguese_reference', 'licensed_portuguese_actor_reference']
  },
  {
    id: 'underwater_with_reefs',
    folderName: 'reefglass-lilt',
    category: 'Ocean',
    biome: 'Underwater With Reefs',
    fantasyAccentName: 'Reefglass Lilt',
    baseAccentInspiration: 'Japanese',
    raceOverlayBehavior: 'Elves make it delicate; aquatic races make it especially fluid; orcs make it more abrupt and unusual.',
    classOverlayBehavior: 'Clerics sound ritualistic; mages sound precise; rogues sound muffled and quick.',
    finalVoiceFeel: 'Graceful, clear, flowing, elegant.',
    modelSuggestions: ['kokoro_ja', 'licensed_japanese_actor_reference', 'synthetic_japanese_accent_reference']
  },
  {
    id: 'underwater_without_reefs',
    folderName: 'deepcurrent-song',
    category: 'Ocean',
    biome: 'Underwater Without Reefs',
    fantasyAccentName: 'Deepcurrent Song',
    baseAccentInspiration: 'Thai',
    raceOverlayBehavior: 'Aquatic races make it almost sung; dwarves make it denser and slower; humans keep it balanced.',
    classOverlayBehavior: 'Rangers sound calm and practical; warriors sound clipped and blunt.',
    finalVoiceFeel: 'Quiet, deep, rhythmic, mysterious.',
    modelSuggestions: ['pythaitts', 'khanomtan_tts', 'thonburian_tts']
  },
  {
    id: 'grassland',
    folderName: 'plainwind-common',
    category: 'Plains',
    biome: 'Grassland',
    fantasyAccentName: 'Plainwind Common',
    baseAccentInspiration: 'American Midwest / General North American',
    raceOverlayBehavior: 'Humans stay neutral; halflings make it friendly; orcs make it rougher and more direct.',
    classOverlayBehavior: 'Merchants sound plainspoken; rangers sound natural; warriors sound terse.',
    finalVoiceFeel: 'Broad, open, easygoing.',
    modelSuggestions: ['piper_en_US_neutral', 'kokoro_en_us', 'synthetic_general_american']
  },
  {
    id: 'prairie',
    folderName: 'ironstep-cant',
    category: 'Plains',
    biome: 'Prairie',
    fantasyAccentName: 'Ironstep Cant',
    baseAccentInspiration: 'Russian',
    raceOverlayBehavior: 'Dwarves deepen the accent; elves soften it; beastfolk make it more expressive and strong.',
    classOverlayBehavior: 'Warriors sound stern; scholars sound formal and heavy; bards sound dramatic.',
    finalVoiceFeel: 'Strong, wide, grounded, hardy.',
    modelSuggestions: ['piper_ru_RU', 'licensed_russian_actor_reference', 'synthetic_russian_accent_reference']
  },
  {
    id: 'farming',
    folderName: 'hearthfield-brogue',
    category: 'Plains',
    biome: 'Farming',
    fantasyAccentName: 'Hearthfield Brogue',
    baseAccentInspiration: 'Irish',
    raceOverlayBehavior: 'Halflings make it especially warm; dwarves make it earthier; elves make it lighter and lilting.',
    classOverlayBehavior: 'Farmers and artisans sound practical; clerics sound gentle; bards sound cheerful.',
    finalVoiceFeel: 'Friendly, earthy, communal, homely.',
    modelSuggestions: ['libritts_british_accents_irish_reference', 'commonaccent_irish_english', 'licensed_irish_actor_reference']
  },
  {
    id: 'mountain_range',
    folderName: 'cragthane-burr',
    category: 'Mountains',
    biome: 'Mountain Range',
    fantasyAccentName: 'Cragthane Burr',
    baseAccentInspiration: 'Scottish',
    raceOverlayBehavior: 'Dwarves fit this best and sound very natural; humans sound clean; orcs sound harsh and mountainous.',
    classOverlayBehavior: 'Warriors sound rugged; scouts sound clipped; scholars sound surprisingly sharp.',
    finalVoiceFeel: 'Tough, crisp, resilient.',
    modelSuggestions: ['libritts_british_accents_scottish_reference', 'commonaccent_scottish_english', 'licensed_scottish_actor_reference']
  },
  {
    id: 'valley',
    folderName: 'vinesong-flow',
    category: 'Mountains',
    biome: 'Valley',
    fantasyAccentName: 'Vinesong Flow',
    baseAccentInspiration: 'Italian',
    raceOverlayBehavior: 'Elves make it smooth and lyrical; halflings make it warm; beastfolk make it expressive and lively.',
    classOverlayBehavior: 'Merchants sound polished; bards sound romantic; clerics sound calm and measured.',
    finalVoiceFeel: 'Flowing, fertile, elegant, soft.',
    modelSuggestions: ['piper_it_IT', 'kokoro_it', 'licensed_italian_actor_reference']
  },
  {
    id: 'deep_cavern',
    folderName: 'stonehollow-echo',
    category: 'Mountains',
    biome: 'Deep Cavern',
    fantasyAccentName: 'Stonehollow Echo',
    baseAccentInspiration: 'Welsh',
    raceOverlayBehavior: 'Dwarves make it especially resonant; humans sound clear; orcs and dragonborn-style voices make it heavier and more guttural.',
    classOverlayBehavior: 'Mages sound ancient and formal; warriors sound short and echoing; rogues sound low and secretive.',
    finalVoiceFeel: 'Echoing, ancient, carved-from-stone.',
    modelSuggestions: ['piper_cy_GB', 'commonaccent_welsh_english', 'libritts_british_accents_welsh_reference']
  },
  {
    id: 'deep_forest',
    folderName: 'rootmere-cant',
    category: 'Forest',
    biome: 'Deep Forest',
    fantasyAccentName: 'Rootmere Cant',
    baseAccentInspiration: 'German',
    raceOverlayBehavior: 'Elves soften the hardness; beastfolk make it strong and vocal; humans keep it practical.',
    classOverlayBehavior: 'Rangers sound disciplined; scholars sound precise; warriors sound clipped and firm.',
    finalVoiceFeel: 'Dense, structured, rooted, authoritative.',
    modelSuggestions: ['piper_de_DE', 'licensed_german_actor_reference', 'synthetic_german_accent_reference']
  },
  {
    id: 'partial_forest',
    folderName: 'sundapple-tongue',
    category: 'Forest',
    biome: 'Partial Forest',
    fantasyAccentName: 'Sundapple Tongue',
    baseAccentInspiration: 'Spanish',
    raceOverlayBehavior: 'Humans sound closest to base; halflings make it warmer; elves make it smoother.',
    classOverlayBehavior: 'Merchants sound lively; bards sound expressive; scouts sound relaxed.',
    finalVoiceFeel: 'Flexible, social, sun-dappled, active.',
    modelSuggestions: ['piper_es_ES', 'kokoro_es', 'licensed_spanish_actor_reference']
  },
  {
    id: 'treetops__treehouses',
    folderName: 'highbranch-lilt',
    category: 'Forest',
    biome: 'Treetops / Treehouses',
    fantasyAccentName: 'Highbranch Lilt',
    baseAccentInspiration: 'French',
    raceOverlayBehavior: 'Elves make it especially elegant; humans sound refined; halflings make it playful.',
    classOverlayBehavior: 'Bards sound graceful; scholars sound polished; rogues sound light and quick.',
    finalVoiceFeel: 'Light, elevated, refined, airy.',
    modelSuggestions: ['piper_fr_FR', 'kokoro_fr', 'licensed_french_actor_reference']
  },
  {
    id: 'marshes_and_swamps',
    folderName: 'mirecurl-drawl',
    category: 'Forest',
    biome: 'Marshes and Swamps',
    fantasyAccentName: 'Mirecurl Drawl',
    baseAccentInspiration: 'Louisiana Cajun / Creole-influenced English',
    raceOverlayBehavior: 'Halflings make it friendly; beastfolk make it rhythmic; orcs make it rough and muddy.',
    classOverlayBehavior: 'Rangers sound local and practical; clerics sound slow and steady; rogues sound secretive.',
    finalVoiceFeel: 'Slow, earthy, wet, lived-in.',
    modelSuggestions: ['speech_accent_archive_cajun_reference', 'gmU_accent_archive_reference', 'licensed_cajun_creole_actor_reference']
  },
  {
    id: 'beach_and_grass_with_water',
    folderName: 'brightshore-flow',
    category: 'Hybrid',
    biome: 'Beach and Grass With Water',
    fantasyAccentName: 'Brightshore Flow',
    baseAccentInspiration: 'Brazilian Portuguese',
    raceOverlayBehavior: 'Humans sound natural; elves sound breezy; aquatic races make it very soft and fluid.',
    classOverlayBehavior: 'Merchants sound relaxed; bards sound sunlit and melodic; warriors sound brisk.',
    finalVoiceFeel: 'Warm, coastal, bright, casual.',
    modelSuggestions: ['piper_pt_BR', 'kokoro_pt_br', 'licensed_brazilian_portuguese_actor_reference']
  },
  {
    id: 'beach_and_reefs_with_water',
    folderName: 'wavebloom-welcome',
    category: 'Hybrid',
    biome: 'Beach and Reefs With Water',
    fantasyAccentName: 'Wavebloom Welcome',
    baseAccentInspiration: 'Hawaiian-influenced English',
    raceOverlayBehavior: 'Aquatic races make it strongest; halflings make it welcoming; dwarves make it firmer and more grounded.',
    classOverlayBehavior: 'Clerics sound peaceful; bards sound musical; scouts sound light-footed.',
    finalVoiceFeel: 'Gentle, tropical, wave-like, welcoming.',
    modelSuggestions: ['speech_accent_archive_hawaiian_reference', 'gmU_accent_archive_reference', 'licensed_hawaiian_actor_reference']
  },
  {
    id: 'hybrid_tree_and_forest_floor',
    folderName: 'bramblewood-burr',
    category: 'Hybrid',
    biome: 'Hybrid Tree and Forest Floor',
    fantasyAccentName: 'Bramblewood Burr',
    baseAccentInspiration: 'English West Country',
    raceOverlayBehavior: 'Elves smooth it out; dwarves make it rustic; beastfolk make it earthy and lively.',
    classOverlayBehavior: 'Rangers sound very natural; artisans sound local; warriors sound sturdy.',
    finalVoiceFeel: 'Rustic, layered, grounded, woodland.',
    modelSuggestions: ['speech_accent_archive_west_country_reference', 'piper_en_GB', 'licensed_west_country_actor_reference']
  },
  {
    id: 'hybrid_farming_forest_grassland',
    folderName: 'millfield-practical',
    category: 'Hybrid',
    biome: 'Hybrid Farming Forest Grassland',
    fantasyAccentName: 'Millfield Practical',
    baseAccentInspiration: 'Dutch',
    raceOverlayBehavior: 'Humans sound plain and practical; halflings make it friendly; orcs make it blunt and workmanlike.',
    classOverlayBehavior: 'Merchants sound efficient; farmers sound matter-of-fact; scholars sound neat and organized.',
    finalVoiceFeel: 'Practical, mixed, industrious, balanced.',
    modelSuggestions: ['piper_nl_NL', 'piper_nl_BE', 'commonaccent_dutch_english']
  }
];

function doGet(e) {
  try {
    const request = parseRequest_(e, 'GET');
    const action = String(request.action || '').trim();

    if (!action || action === 'launcher' || action === 'app') {
      return launcherHtml_(request);
    }

    if (action === 'manifest' || action === 'manifest.webmanifest') {
      return manifestOutput_(request);
    }

    if (action === 'icon' || action === 'icon.svg') {
      return iconOutput_(request);
    }

    return routeRequest_(e, 'GET');
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err && err.message ? err.message : err),
      stack: String(err && err.stack ? err.stack : '')
    });
  }
}

function doPost(e) {
  return routeRequest_(e, 'POST');
}

/*
 * Apps Script web apps cannot reliably answer browser CORS preflight
 * the way a normal server can. Use simple requests from the frontend:
 * fetch(url, { method:'POST', body:new URLSearchParams({...}) })
 */
function doOptions(e) {
  return jsonResponse_({ ok: true, note: 'Use simple POST requests without custom headers.' });
}


function routeRequest_(e, method) {
  try {
    const request = parseRequest_(e, method);
    const action = request.action || 'health';

    if (!isAuthorized_(request)) {
      return jsonResponse_({
        ok: false,
        error: 'Unauthorized backend request. Missing or invalid apiKey.'
      }, request.callback);
    }

    let result;

    switch (action) {
      case 'health':
      case 'ping':
        result = getHealth_();
        break;

      case 'setup':
        result = setup_();
        break;

      case 'clientConfig':
        result = clientConfig_(request);
        break;

      case 'saveSharedState':
        result = saveSharedState_(request);
        break;

      case 'loadSharedState':
        result = loadSharedState_(request);
        break;

      case 'saveCharacter':
        result = saveCharacter_(request);
        break;

      case 'loadCharacter':
        result = loadCharacter_(request);
        break;

      case 'listCharacters':
        result = listCharacters_(request);
        break;

      case 'deleteCharacter':
        result = deleteCharacter_(request);
        break;

      case 'logEvent':
        result = logEvent_(request);
        break;

      case 'exportAllData':
        result = exportAllData_(request);
        break;

      case 'sliders.schema':
        result = {
          ok: true,
          schema: VOICE_SLIDER_SCHEMA,
          defaultVoiceProfile: getDefaultVoiceProfile_()
        };
        break;

      case 'catalog.biomes':
        result = {
          ok: true,
          count: BIOME_CATALOG.length,
          biomes: BIOME_CATALOG
        };
        break;

      case 'catalog.biome.get':
        result = getBiome_(request.biomeId);
        break;

      case 'catalog.crossovers':
        result = getCrossovers_(request);
        break;

      case 'catalog.crossover.get':
        result = getCrossoverById_(request.crossoverId);
        break;

      case 'catalog.folderAudit':
        result = getFolderAudit_();
        break;

      case 'voice.profile.default':
        result = {
          ok: true,
          voiceProfile: getDefaultVoiceProfile_()
        };
        break;

      case 'voice.mix.previewPayload':
        result = buildPreviewPayload_(request);
        break;

      case 'voice.jobs.create':
        result = createVoiceJob_(request);
        break;

      case 'voice.jobs.get':
        result = getVoiceJob_(request.jobId);
        break;

      case 'voice.jobs.update':
        requireAdmin_(request);
        result = updateVoiceJob_(request);
        break;

      case 'presets.save':
        result = savePreset_(request);
        break;

      case 'presets.list':
        result = listPresets_(request);
        break;

      case 'presets.get':
        result = getPreset_(request.presetId);
        break;

      case 'presets.delete':
        result = deletePreset_(request.presetId);
        break;

      case 'assets.register':
        result = registerAsset_(request);
        break;

      case 'assets.list':
        result = listAssets_(request);
        break;

      case 'assets.validate':
        result = validateAssetAction_(request);
        break;

      case 'media.active.set':
        result = setActiveClip_(request);
        break;

      case 'media.active.get':
        result = getActiveClip_();
        break;

      case 'media.active.clear':
        result = clearActiveClip_(request);
        break;

      case 'export.all':
        result = exportAll_();
        break;



      /******** Universal project / GitHub / bot / app routes ********/
      case 'universal.health':
        result = getUniversalHealth_();
        break;

      case 'projects.scanGithub':
      case 'project.scanGithub':
      case 'github.scan':
        result = scanGithubProjects_(request);
        break;

      case 'projects.index.get':
      case 'github.index.get':
        result = getGithubProjectIndex_(request);
        break;

      case 'projects.files.search':
      case 'github.files.search':
        result = searchGithubProjectFiles_(request);
        break;

      case 'projects.file.get':
      case 'github.file.get':
        result = getGithubProjectFile_(request);
        break;

      case 'projects.save':
      case 'project.save':
        result = saveProjectRegistryEntry_(request);
        break;

      case 'projects.list':
      case 'project.list':
        result = listProjectRegistryEntries_(request);
        break;

      case 'bots.create':
      case 'bot.create':
        result = createBot_(request);
        break;

      case 'bots.list':
      case 'bot.list':
        result = listBots_(request);
        break;

      case 'bots.get':
      case 'bot.get':
        result = getBotRoute_(request);
        break;

      case 'bots.chat':
      case 'bot.chat':
        result = chatWithBot_(request);
        break;

      case 'bots.history.get':
      case 'bot.history.get':
        result = getBotHistory_(request);
        break;

      case 'bots.scanAndAnswer':
      case 'bot.scanAndAnswer':
        request.scanGithub = request.scanGithub !== false;
        request.deepSearch = request.deepSearch !== false;
        result = chatWithBot_(request);
        break;

      case 'bots.decide':
      case 'bot.decide':
      case 'ai.intent.resolve':
        result = resolveBotIntent_(request);
        break;

      case 'voice.source.resolve':
      case 'voice.model.resolve':
        result = resolveVoiceSourceModel_(request);
        break;

      case 'assets.uploadBase64':
      case 'voice.assets.uploadBase64':
        result = uploadBase64Asset_(request);
        break;

      case 'notifications.send':
      case 'notify.send':
        result = sendNotification_(request);
        break;

      case 'notifications.list':
      case 'notify.list':
        result = listNotifications_(request);
        break;

      case 'app.create':
      case 'apps.create':
        result = createProjectApp_(request);
        break;

      case 'app.list':
      case 'apps.list':
        result = listProjectApps_(request);
        break;

      case 'app.get':
      case 'apps.get':
        result = getProjectApp_(request);
        break;

      case 'universal.export':
        result = exportUniversal_();
        break;


      /******** Voice Studio Superbot compatibility routes ********/
      case 'chats.create':
      case 'conversations.create':
        result = voiceStudioSuperbotChatCreate_(request);
        break;

      case 'chats.list':
      case 'conversations.list':
        result = voiceStudioSuperbotChatList_(request);
        break;

      case 'chats.messages':
      case 'messages.list':
        result = voiceStudioSuperbotChatMessages_(request);
        break;

      case 'chats.send':
      case 'messages.send':
        result = voiceStudioSuperbotChatSend_(request);
        break;

      case 'learning.record':
      case 'bot.learn':
        result = voiceStudioSuperbotLearningRecord_(request);
        break;

      case 'learning.search':
      case 'bot.memories':
        result = voiceStudioSuperbotLearningSearch_(request);
        break;

      case 'tasks.fromText':
      case 'task.fromText':
        result = voiceStudioSuperbotTasksFromText_(request);
        break;

      case 'tasks.list':
      case 'task.list':
        result = voiceStudioSuperbotTasksList_(request);
        break;

      case 'file.indexText':
      case 'files.indexText':
        result = voiceStudioSuperbotFileIndexText_(request);
        break;

      case 'files.search':
      case 'github.searchIndex':
        result = voiceStudioSuperbotSearch_(request);
        break;

      case 'project.coverage':
        result = voiceStudioSuperbotCoverage_(request);
        break;

      case 'voice.simulate':
      case 'voice.create':
      case 'voice.preview':
        result = voiceStudioSuperbotVoiceSimulate_(request);
        break;

      case 'voice.job.create':
      case 'voice.jobs.create.superbot':
        result = voiceStudioSuperbotVoiceJobCreate_(request);
        break;

      case 'source.auditManifest':
      case 'source.convertedFeatures':
        result = voiceStudioSuperbotConvertedFeatures_(request);
        break;

      case 'admin.resetStorage':
        requireAdmin_(request);
        result = resetStorage_();
        break;

      default:
        result = fail_('Unknown action: ' + action, 404);
    }

    return jsonResponse_(result, request.callback);
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err && err.message ? err.message : err),
      stack: String(err && err.stack ? err.stack : '')
    });
  }
}

function parseRequest_(e, method) {
  const params = Object.assign({}, e && e.parameter ? e.parameter : {});
  let body = {};

  if (method === 'POST' && e && e.postData && e.postData.contents) {
    const contentType = String(e.postData.type || '').toLowerCase();
    const raw = e.postData.contents;

    if (contentType.indexOf('application/json') !== -1) {
      body = JSON.parse(raw || '{}');
    } else {
      body = parseFormEncoded_(raw);
    }
  }

  return Object.assign({}, params, body, {
    method: method,
    receivedAt: new Date().toISOString()
  });
}

function parseFormEncoded_(raw) {
  const out = {};
  String(raw || '').split('&').forEach(pair => {
    if (!pair) return;
    const parts = pair.split('=');
    const key = decodeURIComponent(parts[0] || '');
    const value = decodeURIComponent((parts.slice(1).join('=') || '').replace(/\+/g, ' '));
    if (!key) return;

    try {
      out[key] = JSON.parse(value);
    } catch (err) {
      out[key] = value;
    }
  });
  return out;
}

function jsonResponse_(obj, callback) {
  const text = callback
    ? String(callback) + '(' + JSON.stringify(obj) + ');'
    : JSON.stringify(obj, null, 2);

  return ContentService
    .createTextOutput(text)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function getHealth_() {
  return {
    ok: true,
    app: APP_VERSION,
    now: new Date().toISOString(),
    biomeCount: BIOME_CATALOG.length,
    crossoverCount: calculateCombinationCount_(BIOME_CATALOG.length, MAX_CACHE_BIOMES),
    maxCacheBiomes: MAX_CACHE_BIOMES,
    universalBackend: getUniversalHealth_(),
    safety: {
      allowedAssetPermissionTypes: ALLOWED_ASSET_PERMISSION_TYPES,
      blocksUnknownAssetsByDefault: true
    }
  };
}

function getDefaultVoiceProfile_() {
  const profile = {};
  VOICE_SLIDER_SCHEMA.forEach(item => {
    profile[item.key] = item.default;
  });
  return profile;
}

function sanitizeVoiceProfile_(profile) {
  const clean = getDefaultVoiceProfile_();
  const input = profile || {};

  VOICE_SLIDER_SCHEMA.forEach(item => {
    if (input[item.key] === undefined || input[item.key] === null || input[item.key] === '') return;
    clean[item.key] = clamp_(Number(input[item.key]), item.min, item.max);
  });

  return clean;
}

function getBiome_(biomeId) {
  const biome = findBiome_(biomeId);
  if (!biome) return fail_('Biome not found: ' + biomeId, 404);

  return {
    ok: true,
    biome: addAccentManifestDefaults_(biome)
  };
}

function findBiome_(biomeIdOrFolder) {
  const key = String(biomeIdOrFolder || '').trim();
  return BIOME_CATALOG.find(b =>
    b.id === key ||
    b.folderName === key ||
    slug_(b.fantasyAccentName) === key ||
    b.fantasyAccentName === key ||
    b.biome === key
  ) || null;
}

function addAccentManifestDefaults_(biome) {
  return Object.assign({}, biome, {
    manifestVersion: 'belavados.accent.manifest.v2',
    canonicalFolder: 'voice-models/main-accents/' + biome.folderName,
    baseRule: 'All typed text is spoken in English while preserving the accent inspiration and fantasy voice behavior.',
    defaultLayer: {
      enabled: true,
      intensityPercent: 100,
      normalizedWeight: 1
    },
    safety: {
      allowedAssetPermissionTypes: ALLOWED_ASSET_PERMISSION_TYPES,
      unknownAssetsBlocked: true
    }
  });
}

function getCrossovers_(request) {
  const all = generateCrossoverCatalog_();
  const limit = clamp_(Number(request.limit || 100), 1, 680);
  const offset = clamp_(Number(request.offset || 0), 0, all.length);
  const category = request.category ? String(request.category) : '';
  const biomeId = request.biomeId ? String(request.biomeId) : '';

  let filtered = all;

  if (category) {
    filtered = filtered.filter(c => c.categories.indexOf(category) !== -1);
  }

  if (biomeId) {
    filtered = filtered.filter(c => c.biomeIds.indexOf(biomeId) !== -1);
  }

  return {
    ok: true,
    total: filtered.length,
    offset: offset,
    limit: limit,
    crossovers: filtered.slice(offset, offset + limit)
  };
}

function getCrossoverById_(crossoverId) {
  const found = generateCrossoverCatalog_().find(c => c.id === crossoverId || c.folderName === crossoverId);
  if (!found) return fail_('Crossover not found: ' + crossoverId, 404);

  return {
    ok: true,
    crossover: found
  };
}

function generateCrossoverCatalog_() {
  const combos = [];
  let n = 1;

  for (let i = 0; i < BIOME_CATALOG.length; i++) {
    for (let j = i + 1; j < BIOME_CATALOG.length; j++) {
      for (let k = j + 1; k < BIOME_CATALOG.length; k++) {
        const parts = [BIOME_CATALOG[i], BIOME_CATALOG[j], BIOME_CATALOG[k]];
        const id = 'biome_cache_combo_' + String(n).padStart(3, '0');
        const folderName = parts.map(p => p.folderName).join('__');

        combos.push({
          manifestVersion: 'belavados.crossover.manifest.v2',
          id: id,
          folderName: folderName,
          canonicalFolder: 'voice-models/biome-crossovers/' + folderName,
          biomeIds: parts.map(p => p.id),
          biomes: parts.map(p => p.biome),
          categories: parts.map(p => p.category),
          fantasyAccentNames: parts.map(p => p.fantasyAccentName),
          accentBlendName: parts.map(p => p.fantasyAccentName).join(' + '),
          accentInspirations: parts.map(p => p.baseAccentInspiration),
          voiceFeelBlend: parts.map(p => p.finalVoiceFeel).join(' + '),
          diversityType: calculateDiversityType_(parts),
          categoryCounts: countBy_(parts.map(p => p.category)),
          components: parts.map(addAccentManifestDefaults_),
          weightedLayers: makeDefaultWeightedLayers_(parts),
          rule: 'Crossover folders contain lightweight manifests only. They point back to canonical main accent folders and do not duplicate model binaries.'
        });

        n++;
      }
    }
  }

  return combos;
}

function makeDefaultWeightedLayers_(biomes) {
  const each = 100 / biomes.length;

  return biomes.map(b => ({
    biomeId: b.id,
    fantasyAccentName: b.fantasyAccentName,
    baseAccentInspiration: b.baseAccentInspiration,
    canonicalAccentFolder: 'voice-models/main-accents/' + b.folderName,
    enabled: true,
    intensityPercent: round_(each, 4),
    normalizedWeight: round_(1 / biomes.length, 6),
    modelSuggestions: b.modelSuggestions || []
  }));
}

function calculateDiversityType_(parts) {
  const counts = countBy_(parts.map(p => p.category));
  return Object.keys(counts).length === 1 ? 'single_category' : 'mixed_category';
}

function countBy_(arr) {
  const out = {};
  arr.forEach(x => out[x] = (out[x] || 0) + 1);
  return out;
}

function getFolderAudit_() {
  return {
    ok: true,
    strategy: 'One folder per main accent plus one lightweight manifest folder per 3-biome crossover. Model files are never duplicated into crossover folders.',
    directMainAccentFolders: BIOME_CATALOG.length,
    directCrossoverFolders: calculateCombinationCount_(BIOME_CATALOG.length, MAX_CACHE_BIOMES),
    approximateMaxFilesPerMainAccentFolder: 'Keep under 1000. Store model variants as references/manifests where possible.',
    approximateFilesPerCrossoverFolder: 1,
    generatedCrossoverCount: calculateCombinationCount_(BIOME_CATALOG.length, MAX_CACHE_BIOMES),
    formula: 'C(17,3)=680',
    githubLimitPlan: {
      mainAccentFolders: 'voice-models/main-accents/{fantasy-accent-name}/manifest.json',
      crossoverFolders: 'voice-models/biome-crossovers/{accent-a}__{accent-b}__{accent-c}/manifest.json',
      docs: 'docs/',
      data: 'data/',
      backendAdapters: 'backend-adapters/'
    }
  };
}

function buildPreviewPayload_(request) {
  const text = sanitizeText_(request.text || request.phrase || '');
  const voiceProfile = sanitizeVoiceProfile_(request.voiceProfile || request.sliders || {});
  const context = sanitizeCharacterContext_(request.characterContext || request.context || {});
  const layers = resolveAndNormalizeLayers_(request);

  return {
    ok: true,
    mode: 'previewPayload',
    payload: {
      text: text,
      languageOutput: 'en',
      forceEnglishOutput: true,
      voiceProfile: voiceProfile,
      internalParameters: deriveInternalParameters_(voiceProfile),
      characterContext: context,
      layers: layers.layers,
      enabledLayers: layers.enabledLayers,
      disabledLayers: layers.disabledLayers,
      normalizedWeightSum: layers.normalizedWeightSum,
      safety: buildSafetyBlock_(request),
      pipeline: [
        'MP3 decode or text input',
        'feature analysis',
        'base voice parameters',
        'accent rules',
        'emotion rules',
        'personality rules',
        'stutter / hesitation rules',
        'synth or convert',
        'output waveform'
      ]
    }
  };
}

function createVoiceJob_(request) {
  const payloadResult = buildPreviewPayload_(request);
  if (!payloadResult.ok) return payloadResult;

  const payload = payloadResult.payload;
  validateAssetReferences_(request);

  const jobId = 'job_' + Utilities.getUuid();
  const now = new Date().toISOString();

  const job = {
    id: jobId,
    createdAt: now,
    updatedAt: now,
    status: 'queued',
    engine: getEngineInfo_(),
    payload: payload,
    result: null,
    error: null
  };

  saveRecord_('JOB_', STORE_KEYS.JOBS_INDEX, jobId, job);

  const engineUrl = getScriptProperty_('TTS_ENGINE_URL');
  if (engineUrl) {
    const forwarded = forwardToExternalEngine_(engineUrl, job);
    job.updatedAt = new Date().toISOString();
    job.status = forwarded.ok ? 'forwarded' : 'queued_external_failed';
    job.forwardResult = forwarded;
    saveRecord_('JOB_', STORE_KEYS.JOBS_INDEX, jobId, job);
  }

  return {
    ok: true,
    jobId: jobId,
    job: job,
    note: engineUrl
      ? 'Job was validated and forwarded to external voice engine.'
      : 'Job was validated and stored. Add TTS_ENGINE_URL Script Property to forward synthesis requests.'
  };
}

function getVoiceJob_(jobId) {
  const job = getRecord_('JOB_', jobId);
  if (!job) return fail_('Job not found: ' + jobId, 404);

  return {
    ok: true,
    job: job
  };
}

function updateVoiceJob_(request) {
  const job = getRecord_('JOB_', request.jobId);
  if (!job) return fail_('Job not found: ' + request.jobId, 404);

  if (request.status) job.status = String(request.status);
  if (request.result !== undefined) job.result = request.result;
  if (request.error !== undefined) job.error = request.error;
  job.updatedAt = new Date().toISOString();

  saveRecord_('JOB_', STORE_KEYS.JOBS_INDEX, job.id, job);

  return {
    ok: true,
    job: job
  };
}

function resolveAndNormalizeLayers_(request) {
  let rawLayers = request.layers || request.weightedLayers || null;

  if (!rawLayers && request.crossoverId) {
    const crossover = generateCrossoverCatalog_().find(c => c.id === request.crossoverId || c.folderName === request.crossoverId);
    if (!crossover) throw new Error('Crossover not found: ' + request.crossoverId);
    rawLayers = crossover.weightedLayers;
  }

  if (!rawLayers && request.biomeIds) {
    const biomeIds = Array.isArray(request.biomeIds) ? request.biomeIds : String(request.biomeIds).split(',');
    const biomes = biomeIds.map(id => findBiome_(String(id).trim())).filter(Boolean);
    if (biomes.length === 0) throw new Error('No valid biomes found in biomeIds.');
    rawLayers = makeDefaultWeightedLayers_(biomes.slice(0, MAX_CACHE_BIOMES));
  }

  if (!rawLayers) {
    const defaultBiome = BIOME_CATALOG[0];
    rawLayers = makeDefaultWeightedLayers_([defaultBiome]);
  }

  if (!Array.isArray(rawLayers)) {
    throw new Error('Layers must be an array.');
  }

  const layers = rawLayers.map(layer => {
    const biome = findBiome_(layer.biomeId || layer.id || layer.folderName || layer.fantasyAccentName);
    if (!biome) throw new Error('Unknown biome layer: ' + JSON.stringify(layer));

    const enabled = layer.enabled !== false;
    const intensityPercent = clamp_(Number(layer.intensityPercent !== undefined ? layer.intensityPercent : 100), 0, 100);

    return {
      biomeId: biome.id,
      fantasyAccentName: biome.fantasyAccentName,
      baseAccentInspiration: biome.baseAccentInspiration,
      canonicalAccentFolder: 'voice-models/main-accents/' + biome.folderName,
      enabled: enabled,
      intensityPercent: intensityPercent,
      normalizedWeight: 0,
      modelId: layer.modelId || first_(biome.modelSuggestions) || null,
      modelSuggestions: biome.modelSuggestions || []
    };
  });

  const enabledLayers = layers.filter(l => l.enabled && l.intensityPercent > 0);
  const disabledLayers = layers.filter(l => !l.enabled || l.intensityPercent <= 0);
  const sum = enabledLayers.reduce((acc, l) => acc + l.intensityPercent, 0);

  if (sum <= 0) {
    throw new Error('At least one voice layer must be enabled with intensity above 0%.');
  }

  layers.forEach(l => {
    l.normalizedWeight = (l.enabled && l.intensityPercent > 0)
      ? round_(l.intensityPercent / sum, 6)
      : 0;
  });

  return {
    layers: layers,
    enabledLayers: layers.filter(l => l.normalizedWeight > 0),
    disabledLayers: disabledLayers,
    normalizedWeightSum: round_(layers.reduce((acc, l) => acc + l.normalizedWeight, 0), 6)
  };
}

function deriveInternalParameters_(profile) {
  return {
    f0: mapRange_(profile.pitch, 0, 10, -12, 12),
    pitchRange: mapRange_(profile.inflection, 0, 10, 0.6, 1.8),
    speechRate: mapRange_(profile.speed, 0, 10, 0.65, 1.55),
    pauseDensity: mapRange_(profile.pauseControl, 0, 10, 0.35, 1.65),
    breathNoiseMix: mapRange_(profile.breath, 0, 10, 0, 0.35),
    roughnessAmount: mapRange_(profile.roughness, 0, 10, 0, 0.5),
    formantShift: mapRange_(profile.resonance, 0, 10, -0.18, 0.18),
    articulationPrecision: mapRange_(profile.clarity, 0, 10, 0.35, 1),
    vowelStretch: mapRange_(profile.vowelFlow, 0, 10, 0.75, 1.35),
    consonantSharpness: mapRange_(profile.consonantBite, 0, 10, 0.5, 1.5),
    mouthOpenness: mapRange_(profile.mouthShape, 0, 10, 0.7, 1.3),
    nasality: mapRange_(profile.nasality, 0, 10, 0, 1),
    throatPlacement: mapRange_(profile.throatDepth, 0, 10, -1, 1),
    rhythmicBounce: mapRange_(profile.rhythm, 0, 10, 0.5, 1.5),
    emphasisStrength: mapRange_(profile.emphasis, 0, 10, 0.5, 1.5),
    warmth: mapRange_(profile.warmth, 0, 10, 0, 1),
    projection: mapRange_(profile.projection, 0, 10, 0.35, 1),
    humanVariation: mapRange_(profile.humanVariation, 0, 10, 0, 1),
    accentStrength: profile.accentColor / 10,
    influenceRace: profile.influenceRace,
    influenceGender: profile.influenceGender,
    influencePersonality: profile.influencePersonality,
    influenceBiome: profile.influenceBiome,
    influenceBaseAudio: profile.influenceBaseAudio,
    emotionIntensity: profile.emotionIntensity
  };
}

function sanitizeCharacterContext_(context) {
  return {
    characterName: safeSmall_(context.characterName || ''),
    race: safeSmall_(context.race || ''),
    ancestry: safeSmall_(context.ancestry || ''),
    genderIdentity: safeSmall_(context.genderIdentity || ''),
    pronouns: safeSmall_(context.pronouns || ''),
    className: safeSmall_(context.className || context.class || ''),
    subclass: safeSmall_(context.subclass || ''),
    personality: safeSmall_(context.personality || ''),
    emotion: safeSmall_(context.emotion || ''),
    notes: safeTextOptional_(context.notes || '')
  };
}

function sanitizeText_(text) {
  const clean = String(text || '').trim();
  if (!clean) throw new Error('Text is required.');
  if (clean.length > MAX_TEXT_CHARS) throw new Error('Text is too long. Max characters: ' + MAX_TEXT_CHARS);
  return clean;
}

function safeSmall_(value) {
  return String(value || '').trim().slice(0, 160);
}

function safeTextOptional_(value) {
  return String(value || '').trim().slice(0, 2000);
}

function buildSafetyBlock_(request) {
  return {
    allowedAssetPermissionTypes: ALLOWED_ASSET_PERMISSION_TYPES,
    unknownAssetsBlocked: true,
    declaredAssetPermission: request.assetPermissionType || null,
    baseAudioAssetId: request.baseAudioAssetId || null,
    requiresEnglishOutput: true,
    policy: 'Only use own_voice, licensed_actor, public_domain_character_asset, or synthetic_original assets. Unknown assets are blocked by default.'
  };
}

function validateAssetReferences_(request) {
  if (!request.baseAudioAssetId) return true;

  const asset = getRecord_('ASSET_', request.baseAudioAssetId);
  if (!asset) {
    throw new Error('Base audio asset is not registered or allowed: ' + request.baseAudioAssetId);
  }

  if (ALLOWED_ASSET_PERMISSION_TYPES.indexOf(asset.permissionType) === -1) {
    throw new Error('Blocked asset permission type: ' + asset.permissionType);
  }

  return true;
}

function registerAsset_(request) {
  const permissionType = String(request.permissionType || '').trim();

  if (ALLOWED_ASSET_PERMISSION_TYPES.indexOf(permissionType) === -1) {
    return fail_('Permission type blocked. Allowed: ' + ALLOWED_ASSET_PERMISSION_TYPES.join(', '), 403);
  }

  const assetId = request.assetId || 'asset_' + Utilities.getUuid();
  const now = new Date().toISOString();

  const asset = {
    id: assetId,
    createdAt: now,
    updatedAt: now,
    name: safeSmall_(request.name || assetId),
    permissionType: permissionType,
    ownerLabel: safeSmall_(request.ownerLabel || ''),
    sourceUrl: safeTextOptional_(request.sourceUrl || ''),
    notes: safeTextOptional_(request.notes || ''),
    allowed: true
  };

  saveRecord_('ASSET_', STORE_KEYS.ASSETS_INDEX, assetId, asset);

  return {
    ok: true,
    asset: asset
  };
}

function listAssets_(request) {
  const ids = getIndex_(STORE_KEYS.ASSETS_INDEX);
  const assets = ids.map(id => getRecord_('ASSET_', id)).filter(Boolean);

  return {
    ok: true,
    count: assets.length,
    assets: assets
  };
}

function validateAssetAction_(request) {
  try {
    validateAssetReferences_(request);
    return { ok: true, allowed: true };
  } catch (err) {
    return {
      ok: false,
      allowed: false,
      error: String(err.message || err)
    };
  }
}

function savePreset_(request) {
  const name = safeSmall_(request.name || 'Untitled Voice Preset');
  const presetId = request.presetId || 'preset_' + Utilities.getUuid();
  const now = new Date().toISOString();

  const payloadResult = buildPreviewPayload_(request);
  if (!payloadResult.ok) return payloadResult;

  const existing = getRecord_('PRESET_', presetId);
  const preset = {
    id: presetId,
    createdAt: existing && existing.createdAt ? existing.createdAt : now,
    updatedAt: now,
    name: name,
    tags: Array.isArray(request.tags) ? request.tags.map(safeSmall_) : [],
    payload: payloadResult.payload
  };

  saveRecord_('PRESET_', STORE_KEYS.PRESETS_INDEX, presetId, preset);

  return {
    ok: true,
    preset: preset
  };
}

function listPresets_(request) {
  const ids = getIndex_(STORE_KEYS.PRESETS_INDEX);
  const presets = ids.map(id => getRecord_('PRESET_', id)).filter(Boolean);

  return {
    ok: true,
    count: presets.length,
    presets: presets.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      tags: p.tags || [],
      accentBlendName: p.payload && p.payload.enabledLayers
        ? p.payload.enabledLayers.map(l => l.fantasyAccentName).join(' + ')
        : ''
    }))
  };
}

function getPreset_(presetId) {
  const preset = getRecord_('PRESET_', presetId);
  if (!preset) return fail_('Preset not found: ' + presetId, 404);

  return {
    ok: true,
    preset: preset
  };
}

function deletePreset_(presetId) {
  if (!presetId) return fail_('presetId is required.', 400);

  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('PRESET_' + presetId);
  removeFromIndex_(STORE_KEYS.PRESETS_INDEX, presetId);

  return {
    ok: true,
    deleted: presetId
  };
}

function setActiveClip_(request) {
  const clip = {
    id: request.clipId || 'clip_' + Utilities.getUuid(),
    type: safeSmall_(request.type || 'speech'),
    label: safeSmall_(request.label || ''),
    startedAt: new Date().toISOString(),
    clientId: safeSmall_(request.clientId || ''),
    note: 'Frontend should pause/stop all other media when this changes.'
  };

  PropertiesService.getScriptProperties().setProperty(STORE_KEYS.ACTIVE_CLIP, JSON.stringify(clip));

  return {
    ok: true,
    activeClip: clip,
    transportContract: {
      oneActiveClipOnly: true,
      controls: ['play', 'pause', 'stop', 'rewind_5_seconds', 'forward_5_seconds']
    }
  };
}

function getActiveClip_() {
  const raw = PropertiesService.getScriptProperties().getProperty(STORE_KEYS.ACTIVE_CLIP);
  return {
    ok: true,
    activeClip: raw ? JSON.parse(raw) : null
  };
}

function clearActiveClip_(request) {
  const current = getActiveClip_().activeClip;

  if (!request.clipId || !current || current.id === request.clipId) {
    PropertiesService.getScriptProperties().deleteProperty(STORE_KEYS.ACTIVE_CLIP);
    return { ok: true, cleared: true };
  }

  return {
    ok: true,
    cleared: false,
    reason: 'clipId did not match current active clip.',
    activeClip: current
  };
}

function forwardToExternalEngine_(engineUrl, job) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    const key = getScriptProperty_('TTS_ENGINE_KEY');
    if (key) headers.Authorization = 'Bearer ' + key;

    const response = UrlFetchApp.fetch(engineUrl, {
      method: 'post',
      muteHttpExceptions: true,
      contentType: 'application/json',
      headers: headers,
      payload: JSON.stringify({
        app: APP_VERSION,
        job: job
      })
    });

    const code = response.getResponseCode();
    const text = response.getContentText();

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      parsed = { raw: text };
    }

    return {
      ok: code >= 200 && code < 300,
      statusCode: code,
      response: parsed
    };
  } catch (err) {
    return {
      ok: false,
      error: String(err.message || err)
    };
  }
}

function getEngineInfo_() {
  return {
    appsScriptBackend: true,
    externalEngineConfigured: Boolean(getScriptProperty_('TTS_ENGINE_URL')),
    expectedExternalEngineContract: {
      input: 'job.payload',
      output: {
        jobId: 'string',
        status: 'queued | processing | complete | failed',
        audioUrl: 'optional URL',
        waveformMetadata: 'optional object',
        logs: 'optional array'
      }
    }
  };
}

function exportAll_() {
  return {
    ok: true,
    app: APP_VERSION,
    health: getHealth_(),
    sliderSchema: VOICE_SLIDER_SCHEMA,
    defaultVoiceProfile: getDefaultVoiceProfile_(),
    biomes: BIOME_CATALOG.map(addAccentManifestDefaults_),
    crossoverCount: calculateCombinationCount_(BIOME_CATALOG.length, MAX_CACHE_BIOMES),
    folderAudit: getFolderAudit_(),
    safety: {
      allowedAssetPermissionTypes: ALLOWED_ASSET_PERMISSION_TYPES,
      unknownAssetsBlocked: true
    }
  };
}

function resetStorage_() {
  const props = PropertiesService.getScriptProperties();
  const keys = props.getKeys();

  keys.forEach(k => {
    if (
      k.indexOf('PRESET_') === 0 ||
      k.indexOf('ASSET_') === 0 ||
      k.indexOf('JOB_') === 0 ||
      k === STORE_KEYS.PRESETS_INDEX ||
      k === STORE_KEYS.ASSETS_INDEX ||
      k === STORE_KEYS.JOBS_INDEX ||
      k === STORE_KEYS.ACTIVE_CLIP
    ) {
      props.deleteProperty(k);
    }
  });

  return {
    ok: true,
    reset: true
  };
}

function saveRecord_(prefix, indexKey, id, obj) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(prefix + id, JSON.stringify(obj));
    addToIndex_(indexKey, id);
  } finally {
    lock.releaseLock();
  }
}

function getRecord_(prefix, id) {
  if (!id) return null;
  const raw = PropertiesService.getScriptProperties().getProperty(prefix + id);
  return raw ? JSON.parse(raw) : null;
}

function getIndex_(indexKey) {
  const raw = PropertiesService.getScriptProperties().getProperty(indexKey);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    return [];
  }
}

function addToIndex_(indexKey, id) {
  const props = PropertiesService.getScriptProperties();
  const arr = getIndex_(indexKey);
  if (arr.indexOf(id) === -1) arr.push(id);
  props.setProperty(indexKey, JSON.stringify(arr));
}

function removeFromIndex_(indexKey, id) {
  const props = PropertiesService.getScriptProperties();
  const arr = getIndex_(indexKey).filter(x => x !== id);
  props.setProperty(indexKey, JSON.stringify(arr));
}

function requireAdmin_(request) {
  const configured = getScriptProperty_('ADMIN_KEY');

  if (!configured) {
    throw new Error('ADMIN_KEY is not configured in Script Properties.');
  }

  if (String(request.adminKey || '') !== configured) {
    throw new Error('Invalid adminKey.');
  }

  return true;
}

function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function calculateCombinationCount_(n, r) {
  if (r > n) return 0;
  let top = 1;
  let bottom = 1;

  for (let i = 0; i < r; i++) {
    top *= (n - i);
    bottom *= (i + 1);
  }

  return Math.round(top / bottom);
}

function mapRange_(value, inMin, inMax, outMin, outMax) {
  const v = clamp_(Number(value), inMin, inMax);
  return round_(outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin), 6);
}

function clamp_(value, min, max) {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round_(value, places) {
  const m = Math.pow(10, places || 2);
  return Math.round(Number(value) * m) / m;
}

function first_(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

function slug_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fail_(message, statusCode) {
  return {
    ok: false,
    statusCode: statusCode || 400,
    error: message
  };
}



/***************************************************************
 * NON-VOICE CHARACTER STUDIO APP / DRIVE STORAGE MERGE
 ***************************************************************/
function setup_() {
  const folders = getFolders_();

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('BELAVADOS_INSTALLED_AT')) {
    props.setProperty('BELAVADOS_INSTALLED_AT', new Date().toISOString());
  }

  const setupInfo = {
    ok: true,
    app: BELAVADOS_CHARACTER_STUDIO.APP_NAME,
    version: BELAVADOS_CHARACTER_STUDIO.VERSION,
    installedAt: props.getProperty('BELAVADOS_INSTALLED_AT'),
    rootFolderId: folders.root.getId(),
    rootFolderUrl: folders.root.getUrl(),
    dataFolderId: folders.data.getId(),
    characterFolderId: folders.characters.getId(),
    sharedStateFolderId: folders.sharedState.getId(),
    logFolderId: folders.logs.getId(),
    voiceCodeSource: 'Updated Character Studio voice pipeline in this file; old const-backend voice code was not merged.',
    nextStep: 'Deploy this as a Web App, then paste the Web app URL and Deployment ID into the frontend/backend config.',
    universalBackend: {
      pagesOrigin: UNIVERSAL_PROJECT_BACKEND.PAGES_ORIGIN,
      defaultGithubRepos: UNIVERSAL_PROJECT_BACKEND.DEFAULT_GITHUB_REPOS,
      projectFolderId: folders.projects.getId(),
      githubIndexFolderId: folders.githubIndex.getId(),
      conversationsFolderId: folders.conversations.getId(),
      notificationsFolderId: folders.notifications.getId(),
      voiceAssetsFolderId: folders.voiceAssets.getId(),
      appsFolderId: folders.apps.getId(),
      aiFolderId: folders.ai.getId(),
      firstActions: ['projects.scanGithub', 'bots.create', 'bots.chat', 'voice.source.resolve', 'notifications.send', 'app.create']
    }
  };

  upsertJsonFile_(folders.data, 'backend_setup.json', setupInfo);
  return setupInfo;
}

function clientConfig_(params) {
  const serviceUrl = ScriptApp.getService().getUrl() || '';

  return {
    ok: true,
    appName: BELAVADOS_CHARACTER_STUDIO.APP_NAME,
    shortName: BELAVADOS_CHARACTER_STUDIO.SHORT_NAME,
    version: BELAVADOS_CHARACTER_STUDIO.VERSION,
    backendUrl: serviceUrl,
    frontendUrl: BELAVADOS_CHARACTER_STUDIO.FRONTEND_URL || '',
    themeColor: BELAVADOS_CHARACTER_STUDIO.THEME_COLOR,
    backgroundColor: BELAVADOS_CHARACTER_STUDIO.BACKGROUND_COLOR,
    pwa: {
      launcherUrl: serviceUrl ? serviceUrl + '?action=launcher' : '',
      manifestUrl: serviceUrl ? serviceUrl + '?action=manifest' : '',
      icon192: serviceUrl ? serviceUrl + '?action=icon&size=192' : '',
      icon512: serviceUrl ? serviceUrl + '?action=icon&size=512' : ''
    },
    simpleFetchExample: {
      method: 'POST',
      body: 'new URLSearchParams({ action: "saveSharedState", profileId: "default", payload: JSON.stringify(data) })'
    }
  };
}

function saveSharedState_(params) {
  const folders = getFolders_();
  const profileId = safeId_(params.profileId || 'default');
  const payload = parsePayload_(params.payload, {});

  const record = {
    type: 'shared-state',
    profileId: profileId,
    updatedAt: new Date().toISOString(),
    payload: payload
  };

  return withLock_(function () {
    upsertJsonFile_(folders.sharedState, profileId + '.json', record);
    return {
      ok: true,
      saved: true,
      profileId: profileId,
      updatedAt: record.updatedAt,
      payload: payload
    };
  });
}

function loadSharedState_(params) {
  const folders = getFolders_();
  const profileId = safeId_(params.profileId || 'default');
  const record = readJsonFile_(folders.sharedState, profileId + '.json');

  return {
    ok: true,
    found: !!record,
    profileId: profileId,
    record: record || null,
    payload: record && record.payload ? record.payload : {}
  };
}

function saveCharacter_(params) {
  const folders = getFolders_();

  const profileId = safeId_(params.profileId || 'default');
  const rawPayload = parsePayload_(params.payload, {});
  const characterId = safeId_(
    params.characterId ||
    rawPayload.characterId ||
    rawPayload.id ||
    rawPayload.name ||
    'character-' + Date.now()
  );

  const record = {
    type: 'character',
    profileId: profileId,
    characterId: characterId,
    name: String(rawPayload.name || params.name || characterId),
    updatedAt: new Date().toISOString(),
    createdAt: '',
    payload: rawPayload
  };

  return withLock_(function () {
    const filename = profileId + '__' + characterId + '.json';
    const existing = readJsonFile_(folders.characters, filename);
    record.createdAt = existing && existing.createdAt ? existing.createdAt : record.updatedAt;

    upsertJsonFile_(folders.characters, filename, record);

    const sharedRecord = {
      type: 'shared-state',
      profileId: profileId,
      updatedAt: record.updatedAt,
      payload: {
        activeCharacterId: characterId,
        activeCharacter: rawPayload,
        lastSavedAt: record.updatedAt
      }
    };
    upsertJsonFile_(folders.sharedState, profileId + '.json', sharedRecord);

    return {
      ok: true,
      saved: true,
      profileId: profileId,
      characterId: characterId,
      name: record.name,
      updatedAt: record.updatedAt
    };
  });
}

function loadCharacter_(params) {
  const folders = getFolders_();

  const profileId = safeId_(params.profileId || 'default');
  const characterId = safeId_(params.characterId || 'active');

  if (characterId === 'active') {
    const shared = loadSharedState_({ profileId: profileId });
    const activeId = shared.payload && shared.payload.activeCharacterId;
    if (activeId) {
      const activeRecord = readJsonFile_(folders.characters, profileId + '__' + safeId_(activeId) + '.json');
      return {
        ok: true,
        found: !!activeRecord,
        profileId: profileId,
        characterId: activeId,
        record: activeRecord || null,
        payload: activeRecord && activeRecord.payload ? activeRecord.payload : {}
      };
    }
  }

  const record = readJsonFile_(folders.characters, profileId + '__' + characterId + '.json');

  return {
    ok: true,
    found: !!record,
    profileId: profileId,
    characterId: characterId,
    record: record || null,
    payload: record && record.payload ? record.payload : {}
  };
}

function listCharacters_(params) {
  const folders = getFolders_();
  const profileId = safeId_(params.profileId || 'default');
  const files = folders.characters.getFiles();
  const characters = [];

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();

    if (name.indexOf(profileId + '__') !== 0 || name.slice(-5) !== '.json') continue;

    const record = readJsonFromFile_(file);
    if (!record) continue;

    characters.push({
      profileId: record.profileId || profileId,
      characterId: record.characterId || name,
      name: record.name || record.characterId || name,
      createdAt: record.createdAt || '',
      updatedAt: record.updatedAt || '',
      fileId: file.getId()
    });
  }

  characters.sort(function (a, b) {
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });

  return {
    ok: true,
    profileId: profileId,
    count: characters.length,
    characters: characters
  };
}

function deleteCharacter_(params) {
  const folders = getFolders_();
  const profileId = safeId_(params.profileId || 'default');
  const characterId = safeId_(params.characterId || '');

  if (!characterId) {
    return { ok: false, error: 'Missing characterId.' };
  }

  const filename = profileId + '__' + characterId + '.json';
  const deleted = trashFilesByName_(folders.characters, filename);

  return {
    ok: true,
    deleted: deleted,
    profileId: profileId,
    characterId: characterId
  };
}

function logEvent_(params) {
  const folders = getFolders_();

  const profileId = safeId_(params.profileId || 'default');
  const eventType = safeId_(params.eventType || 'event');
  const payload = parsePayload_(params.payload, {});

  const record = {
    type: 'log-event',
    profileId: profileId,
    eventType: eventType,
    createdAt: new Date().toISOString(),
    payload: payload
  };

  const filename = profileId + '__' + eventType + '__' + Date.now() + '.json';
  upsertJsonFile_(folders.logs, filename, record);

  return {
    ok: true,
    logged: true,
    eventType: eventType,
    createdAt: record.createdAt
  };
}

function launcherHtml_(params) {
  const serviceUrl = ScriptApp.getService().getUrl() || '';
  const manifestUrl = serviceUrl ? serviceUrl + '?action=manifest' : '?action=manifest';
  const iconUrl = serviceUrl ? serviceUrl + '?action=icon&size=512' : '?action=icon&size=512';
  const frontendUrl = BELAVADOS_CHARACTER_STUDIO.FRONTEND_URL || '';

  const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base target="_top">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="${escapeHtml_(BELAVADOS_CHARACTER_STUDIO.THEME_COLOR)}">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="${escapeHtml_(BELAVADOS_CHARACTER_STUDIO.SHORT_NAME)}">
  <meta name="mobile-web-app-capable" content="yes">
  <link rel="manifest" href="${escapeHtml_(manifestUrl)}">
  <link rel="icon" href="${escapeHtml_(iconUrl)}">
  <link rel="apple-touch-icon" href="${escapeHtml_(iconUrl)}">
  <title>${escapeHtml_(BELAVADOS_CHARACTER_STUDIO.APP_NAME)}</title>
  <style>
    :root {
      --cyan: #00ffff;
      --bg: #050814;
      --panel: rgba(7, 14, 30, 0.86);
      --text: #f4ffff;
      --muted: #bdefff;
      --danger: #ff6b9a;
      --gold: #ffd56a;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      background:
        radial-gradient(circle at top, rgba(0,255,255,0.24), transparent 34rem),
        radial-gradient(circle at bottom left, rgba(255,213,106,0.12), transparent 28rem),
        var(--bg);
      color: var(--text);
      font-family: Georgia, "Times New Roman", serif;
    }
    body {
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .app-shell {
      width: min(760px, 100%);
      border: 2px solid rgba(0,255,255,0.65);
      border-radius: 28px;
      background: var(--panel);
      box-shadow: 0 0 44px rgba(0,255,255,0.22), inset 0 0 30px rgba(0,255,255,0.08);
      padding: clamp(22px, 5vw, 42px);
      text-align: center;
    }
    .sigil {
      width: 132px;
      height: 132px;
      margin: 0 auto 18px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      border: 3px solid var(--cyan);
      color: var(--cyan);
      font-size: 54px;
      font-weight: 900;
      box-shadow: 0 0 30px rgba(0,255,255,0.35);
      background: radial-gradient(circle, rgba(0,255,255,0.20), rgba(0,0,0,0.28));
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(2rem, 8vw, 4rem);
      line-height: 1;
      text-shadow: 0 0 14px rgba(0,255,255,0.65), 2px 2px 0 #000;
    }
    p {
      color: var(--muted);
      font-size: 1.05rem;
      line-height: 1.55;
      margin: 12px auto;
      max-width: 58ch;
    }
    .buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin-top: 26px;
    }
    a, button {
      appearance: none;
      border: 2px solid var(--cyan);
      border-radius: 999px;
      background: rgba(0,255,255,0.12);
      color: var(--text);
      padding: 12px 18px;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
      box-shadow: 0 0 18px rgba(0,255,255,0.18);
    }
    a:hover, button:hover {
      background: rgba(0,255,255,0.22);
      transform: translateY(-1px);
    }
    code {
      display: inline-block;
      word-break: break-word;
      color: var(--gold);
    }
    .note {
      margin-top: 22px;
      padding: 14px;
      border-radius: 18px;
      border: 1px solid rgba(255,213,106,0.45);
      background: rgba(255,213,106,0.08);
      color: #fff6d6;
    }
  </style>
</head>
<body>
  <main class="app-shell">
    <div class="sigil">B</div>
    <h1>Belavadös</h1>
    <p>
      Character Studio backend is deployed and ready.
      This launcher page also provides install metadata for mobile and desktop shortcuts.
    </p>

    <div class="buttons">
      ${
        frontendUrl
          ? `<a href="${escapeHtml_(frontendUrl)}" rel="noopener">Open Character Studio</a>`
          : `<button onclick="alert('Frontend URL has not been pasted into BELAVADOS_CHARACTER_STUDIO.FRONTEND_URL yet. After deployment, send ChatGPT this backend URL and we will embed it into the GitHub site.')">Frontend URL Not Embedded Yet</button>`
      }
      <a href="${escapeHtml_(serviceUrl + '?action=health')}" rel="noopener">Backend Health</a>
      <a href="${escapeHtml_(serviceUrl + '?action=setup')}" rel="noopener">Run Setup</a>
    </div>

    <div class="note">
      <p>
        To add this as an icon:
        on mobile, open this page and choose <strong>Add to Home Screen</strong>.
        On desktop Chrome/Edge, use the browser install option or create shortcut.
      </p>
      <p>
        Backend URL:<br>
        <code>${escapeHtml_(serviceUrl || 'Unavailable until deployed')}</code>
      </p>
    </div>
  </main>

  <script>
    window.BELAVADOS_CHARACTER_STUDIO_READY = true;
  </script>
</body>
</html>`;

  return HtmlService
    .createHtmlOutput(html)
    .setTitle(BELAVADOS_CHARACTER_STUDIO.APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function manifestOutput_(params) {
  const serviceUrl = ScriptApp.getService().getUrl() || '';
  const startUrl = serviceUrl ? serviceUrl + '?action=launcher' : '?action=launcher';

  const manifest = {
    name: BELAVADOS_CHARACTER_STUDIO.APP_NAME,
    short_name: BELAVADOS_CHARACTER_STUDIO.SHORT_NAME,
    description: 'Belavadös Character Studio launcher and backend bridge.',
    id: '/belavados-character-studio',
    start_url: startUrl,
    scope: serviceUrl || './',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'any',
    theme_color: BELAVADOS_CHARACTER_STUDIO.THEME_COLOR,
    background_color: BELAVADOS_CHARACTER_STUDIO.BACKGROUND_COLOR,
    categories: ['games', 'productivity', 'entertainment'],
    icons: [
      {
        src: serviceUrl + '?action=icon&size=192',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      },
      {
        src: serviceUrl + '?action=icon&size=512',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      }
    ]
  };

  return ContentService
    .createTextOutput(JSON.stringify(manifest, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function iconOutput_(params) {
  const size = Math.max(64, Math.min(1024, Number(params.size || 512)));
  const svg = iconSvg_(size);

  return ContentService
    .createTextOutput(svg)
    .setMimeType(ContentService.MimeType.XML);
}

function iconSvg_(size) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#00ffff" stop-opacity="0.55"/>
      <stop offset="42%" stop-color="#102040" stop-opacity="1"/>
      <stop offset="100%" stop-color="#040814" stop-opacity="1"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="188" fill="none" stroke="#00ffff" stroke-width="18" opacity="0.88" filter="url(#glow)"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#ffd56a" stroke-width="8" opacity="0.82"/>
  <path d="M160 352 L256 92 L352 352 Z" fill="rgba(0,255,255,0.14)" stroke="#00ffff" stroke-width="12" stroke-linejoin="round" filter="url(#glow)"/>
  <text x="256" y="310" text-anchor="middle"
        font-family="Georgia, serif" font-size="168" font-weight="900"
        fill="#f4ffff" stroke="#000814" stroke-width="8" paint-order="stroke"
        filter="url(#glow)">B</text>
  <text x="256" y="400" text-anchor="middle"
        font-family="Georgia, serif" font-size="42" font-weight="800"
        fill="#ffd56a" stroke="#000814" stroke-width="4" paint-order="stroke">STUDIO</text>
</svg>`;
}

function parsePayload_(payload, fallback) {
  if (payload && typeof payload === 'object') return payload;

  if (typeof payload === 'string' && payload.trim()) {
    try {
      return JSON.parse(payload);
    } catch (err) {
      return {
        raw: payload
      };
    }
  }

  return fallback || {};
}

function getOrCreateFolderByName_(name) {
  const existing = DriveApp.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder(name);
}

function getOrCreateChildFolder_(parent, name) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function upsertJsonFile_(folder, filename, obj) {
  const json = JSON.stringify(obj, null, 2);
  const files = folder.getFilesByName(filename);

  if (files.hasNext()) {
    const file = files.next();
    file.setContent(json);

    while (files.hasNext()) {
      files.next().setTrashed(true);
    }

    return file;
  }

  return folder.createFile(filename, json, MimeType.PLAIN_TEXT);
}

function readJsonFile_(folder, filename) {
  const files = folder.getFilesByName(filename);
  if (!files.hasNext()) return null;
  return readJsonFromFile_(files.next());
}

function readJsonFromFile_(file) {
  try {
    return JSON.parse(file.getBlob().getDataAsString());
  } catch (err) {
    return null;
  }
}

function trashFilesByName_(folder, filename) {
  const files = folder.getFilesByName(filename);
  let count = 0;

  while (files.hasNext()) {
    files.next().setTrashed(true);
    count++;
  }

  return count;
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function safeId_(value) {
  value = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!value) value = 'item-' + Date.now();
  if (value.length > 80) value = value.slice(0, 80);

  return value;
}

function safeFilename_(value) {
  value = String(value || 'file')
    .trim()
    .replace(/['"]/g, '')
    .replace(/[\\/:*?<>|#%{}$!@+`=]/g, '-')
    .replace(/\s+/g, '-');

  if (!value) value = 'file';
  if (value.length > 120) value = value.slice(0, 120);

  return value;
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function exportAllData_(params) {
  const profileId = safeId_(params.profileId || 'default');

  return {
    ok: true,
    exportedAt: new Date().toISOString(),
    profileId: profileId,
    sharedState: loadSharedState_({ profileId: profileId }).payload,
    characters: listCharacters_({ profileId: profileId }).characters,
    note: 'Old const-backend voice presets/assets were intentionally not merged. Use export.all for the updated Character Studio voice catalog/runtime export.'
  };
}

function isAuthorized_(params) {
  const configured = String(BELAVADOS_CHARACTER_STUDIO.API_KEY || '').trim();
  if (!configured) return true;
  return String(params.apiKey || '').trim() === configured;
}

function getFolders_() {
  const root = getOrCreateFolderByName_(BELAVADOS_CHARACTER_STUDIO.ROOT_FOLDER_NAME);
  const data = getOrCreateChildFolder_(root, BELAVADOS_CHARACTER_STUDIO.DATA_FOLDER_NAME);
  const characters = getOrCreateChildFolder_(root, BELAVADOS_CHARACTER_STUDIO.CHARACTER_FOLDER_NAME);
  const sharedState = getOrCreateChildFolder_(root, BELAVADOS_CHARACTER_STUDIO.SHARED_STATE_FOLDER_NAME);
  const logs = getOrCreateChildFolder_(root, BELAVADOS_CHARACTER_STUDIO.LOG_FOLDER_NAME);

  const projects = getOrCreateChildFolder_(root, UNIVERSAL_PROJECT_BACKEND.PROJECTS_FOLDER_NAME);
  const githubIndex = getOrCreateChildFolder_(root, UNIVERSAL_PROJECT_BACKEND.PROJECT_INDEX_FOLDER_NAME);
  const conversations = getOrCreateChildFolder_(root, UNIVERSAL_PROJECT_BACKEND.CONVERSATIONS_FOLDER_NAME);
  const notifications = getOrCreateChildFolder_(root, UNIVERSAL_PROJECT_BACKEND.NOTIFICATIONS_FOLDER_NAME);
  const voiceAssets = getOrCreateChildFolder_(root, UNIVERSAL_PROJECT_BACKEND.VOICE_ASSETS_FOLDER_NAME);
  const apps = getOrCreateChildFolder_(root, UNIVERSAL_PROJECT_BACKEND.APPS_FOLDER_NAME);
  const ai = getOrCreateChildFolder_(root, UNIVERSAL_PROJECT_BACKEND.AI_FOLDER_NAME);

  return {
    root: root,
    data: data,
    characters: characters,
    sharedState: sharedState,
    logs: logs,
    projects: projects,
    githubIndex: githubIndex,
    conversations: conversations,
    notifications: notifications,
    voiceAssets: voiceAssets,
    apps: apps,
    ai: ai
  };
}



/***************************************************************
 * UNIVERSAL PROJECT / BOT / GITHUB / APP IMPLEMENTATION
 ***************************************************************/
function getUniversalHealth_() {
  return {
    ok: true,
    app: UNIVERSAL_PROJECT_BACKEND.APP_NAME,
    version: UNIVERSAL_PROJECT_BACKEND.VERSION,
    pagesOrigin: UNIVERSAL_PROJECT_BACKEND.PAGES_ORIGIN,
    githubOwner: getScriptProperty_('GITHUB_OWNER') || UNIVERSAL_PROJECT_BACKEND.GITHUB_OWNER,
    defaultGithubRepos: UNIVERSAL_PROJECT_BACKEND.DEFAULT_GITHUB_REPOS,
    capabilities: [
      'scan public GitHub project files under tyrannosaurusdm92.github.io',
      'index project files and discover project launch URLs',
      'search/fetch text files from GitHub directly',
      'create configurable project bots with conversation memory',
      'route bot prompts to an OpenAI-compatible or custom AI endpoint when configured',
      'fall back to transparent rule-based responses when no AI endpoint is configured',
      'resolve Belavadös voice source models from biome + race + gender + class context',
      'register and upload permitted voice/media assets to Drive',
      'send and log email notifications',
      'create saved app/PWA configs for projects'
    ],
    configured: {
      githubToken: Boolean(getScriptProperty_('GITHUB_TOKEN')),
      aiApiUrl: Boolean(getScriptProperty_('AI_API_URL')),
      aiApiKey: Boolean(getScriptProperty_('AI_API_KEY')),
      aiModel: getScriptProperty_('AI_MODEL') || '',
      defaultNotificationRecipient: Boolean(getScriptProperty_('NOTIFICATION_DEFAULT_TO'))
    },
    safeLimits: {
      maxIndexFiles: UNIVERSAL_PROJECT_BACKEND.MAX_INDEX_FILES,
      maxDeepSearchFiles: UNIVERSAL_PROJECT_BACKEND.MAX_DEEP_SEARCH_FILES,
      maxFileChars: UNIVERSAL_PROJECT_BACKEND.MAX_FILE_CHARS,
      maxBotContextChars: UNIVERSAL_PROJECT_BACKEND.MAX_BOT_CONTEXT_CHARS
    }
  };
}

function exportUniversal_() {
  return {
    ok: true,
    exportedAt: new Date().toISOString(),
    universal: getUniversalHealth_(),
    projectIndex: getGithubProjectIndex_({ staleOk: true }),
    bots: listBots_({}),
    apps: listProjectApps_({}),
    notifications: listNotifications_({ limit: 50 }),
    voiceSourceResolver: {
      action: 'voice.source.resolve',
      requiredInputs: ['biome or biomeId', 'race/ancestry', 'genderIdentity', 'className'],
      output: 'recommended model source, accent layer, overlay notes, sanitized slider defaults'
    }
  };
}

function getConfiguredGithubRepos_() {
  const owner = getScriptProperty_('GITHUB_OWNER') || UNIVERSAL_PROJECT_BACKEND.GITHUB_OWNER;
  const raw = getScriptProperty_('GITHUB_REPOSITORIES');
  if (!raw) return UNIVERSAL_PROJECT_BACKEND.DEFAULT_GITHUB_REPOS;

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map(function (item) {
        if (typeof item === 'string') {
          return { owner: owner, repo: item, branch: 'main', pagesPath: item === owner + '.github.io' ? '/' : '/' + item + '/' };
        }
        return {
          owner: item.owner || owner,
          repo: item.repo,
          branch: item.branch || 'main',
          pagesPath: item.pagesPath || ('/' + item.repo + '/')
        };
      }).filter(function (x) { return x.repo; });
    }
  } catch (err) {
    // fall through to comma-list parsing
  }

  return String(raw).split(',').map(function (repoName) {
    repoName = repoName.trim();
    if (!repoName) return null;
    return {
      owner: owner,
      repo: repoName,
      branch: 'main',
      pagesPath: repoName === owner + '.github.io' ? '/' : '/' + repoName + '/'
    };
  }).filter(Boolean);
}

function scanGithubProjects_(request) {
  const folders = getFolders_();
  const repos = request.repositories ? parsePayload_(request.repositories, []) : getConfiguredGithubRepos_();
  const allProjects = {};
  const allFiles = [];
  const errors = [];

  repos.forEach(function (repo) {
    if (!repo || !repo.repo) return;
    const owner = repo.owner || getScriptProperty_('GITHUB_OWNER') || UNIVERSAL_PROJECT_BACKEND.GITHUB_OWNER;
    const branch = repo.branch || request.branch || 'main';
    const tryBranches = uniqueArray_([branch, 'main', 'master']);
    let treeResult = null;

    for (let i = 0; i < tryBranches.length; i++) {
      treeResult = fetchGithubTree_(owner, repo.repo, tryBranches[i]);
      if (treeResult.ok) {
        repo.branch = tryBranches[i];
        break;
      }
    }

    if (!treeResult || !treeResult.ok) {
      errors.push({ repo: owner + '/' + repo.repo, error: treeResult ? treeResult.error : 'Unknown GitHub tree error' });
      return;
    }

    const built = buildProjectIndexFromTree_(Object.assign({}, repo, { owner: owner, branch: repo.branch || branch }), treeResult.tree);
    built.files.forEach(function (file) { allFiles.push(file); });
    built.projects.forEach(function (project) {
      allProjects[project.id] = mergeProjectSummary_(allProjects[project.id], project);
    });
  });

  const index = {
    ok: true,
    generatedAt: new Date().toISOString(),
    pagesOrigin: UNIVERSAL_PROJECT_BACKEND.PAGES_ORIGIN,
    repositories: repos,
    projectCount: Object.keys(allProjects).length,
    fileCount: allFiles.length,
    projects: Object.keys(allProjects).sort().map(function (id) { return allProjects[id]; }),
    files: allFiles.slice(0, UNIVERSAL_PROJECT_BACKEND.MAX_INDEX_FILES),
    truncated: allFiles.length > UNIVERSAL_PROJECT_BACKEND.MAX_INDEX_FILES,
    errors: errors
  };

  upsertJsonFile_(folders.githubIndex, 'github_project_index.json', index);
  PropertiesService.getScriptProperties().setProperty(UNIVERSAL_STORE_KEYS.LAST_GITHUB_INDEX_META, JSON.stringify({
    generatedAt: index.generatedAt,
    projectCount: index.projectCount,
    fileCount: index.fileCount,
    errors: errors.length
  }));

  return index;
}

function fetchGithubTree_(owner, repo, branch) {
  try {
    const url = 'https://api.github.com/repos/' + encodeURIComponent(owner) + '/' + encodeURIComponent(repo) + '/git/trees/' + encodeURIComponent(branch) + '?recursive=1';
    const response = githubFetch_(url, { method: 'get', muteHttpExceptions: true });
    const code = response.getResponseCode();
    const text = response.getContentText();
    let parsed = {};
    try { parsed = JSON.parse(text); } catch (err) { parsed = { raw: text }; }

    if (code < 200 || code >= 300) {
      return { ok: false, statusCode: code, error: parsed.message || text || 'GitHub tree fetch failed' };
    }

    if (!parsed.tree || !Array.isArray(parsed.tree)) {
      return { ok: false, statusCode: code, error: 'GitHub response did not include a recursive tree.' };
    }

    return { ok: true, owner: owner, repo: repo, branch: branch, tree: parsed.tree };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

function githubFetch_(url, options) {
  options = options || {};
  const headers = Object.assign({
    Accept: 'application/vnd.github+json',
    'User-Agent': 'TyrannosaurusDM92-Universal-Apps-Script-Backend'
  }, options.headers || {});
  const token = getScriptProperty_('GITHUB_TOKEN');
  if (token) headers.Authorization = 'Bearer ' + token;
  options.headers = headers;
  return UrlFetchApp.fetch(url, options);
}

function buildProjectIndexFromTree_(repo, tree) {
  const projects = {};
  const files = [];
  const pagesOrigin = UNIVERSAL_PROJECT_BACKEND.PAGES_ORIGIN.replace(/\/$/, '');
  const pagesPath = String(repo.pagesPath || ('/' + repo.repo + '/'));
  const repoRootIsUserSite = repo.repo === repo.owner + '.github.io';

  tree.forEach(function (entry) {
    if (!entry || entry.type !== 'blob' || !entry.path) return;
    const path = String(entry.path);
    if (isBlockedProjectPath_(path)) return;

    const ext = getExtension_(path);
    const isText = UNIVERSAL_PROJECT_BACKEND.ALLOWED_TEXT_EXTENSIONS.indexOf(ext) !== -1;
    const isMedia = UNIVERSAL_PROJECT_BACKEND.MEDIA_EXTENSIONS.indexOf(ext) !== -1;
    if (!isText && !isMedia) return;

    const parts = path.split('/').filter(Boolean);
    const projectRoot = parts.length > 1 ? parts[0] : 'root';
    const projectId = safeId_(repo.repo + '-' + projectRoot);
    const projectUrlPath = repoRootIsUserSite
      ? (projectRoot === 'root' ? '/' : '/' + projectRoot + '/')
      : pagesPath + (projectRoot === 'root' ? '' : projectRoot + '/');
    const launchUrl = pagesOrigin + normalizeUrlPath_(projectUrlPath);
    const rawUrl = 'https://raw.githubusercontent.com/' + encodeURIComponent(repo.owner) + '/' + encodeURIComponent(repo.repo) + '/' + encodeURIComponent(repo.branch || 'main') + '/' + path.split('/').map(encodeURIComponent).join('/');
    const pagesUrl = pagesOrigin + normalizeUrlPath_((repoRootIsUserSite ? '/' : pagesPath) + path);

    if (!projects[projectId]) {
      projects[projectId] = {
        id: projectId,
        name: projectRoot === 'root' ? repo.repo : projectRoot,
        owner: repo.owner,
        repo: repo.repo,
        branch: repo.branch || 'main',
        rootPath: projectRoot === 'root' ? '' : projectRoot,
        pagesPath: projectUrlPath,
        launchUrl: launchUrl,
        fileCount: 0,
        textFileCount: 0,
        mediaFileCount: 0,
        entryFiles: [],
        extensions: {}
      };
    }

    projects[projectId].fileCount++;
    if (isText) projects[projectId].textFileCount++;
    if (isMedia) projects[projectId].mediaFileCount++;
    projects[projectId].extensions[ext || 'none'] = (projects[projectId].extensions[ext || 'none'] || 0) + 1;
    if (/index\.html?$/i.test(path) || /manifest\.webmanifest$/i.test(path) || /manifest\.json$/i.test(path)) {
      projects[projectId].entryFiles.push(path);
    }

    files.push({
      id: safeId_(repo.repo + '-' + path),
      projectId: projectId,
      projectName: projects[projectId].name,
      owner: repo.owner,
      repo: repo.repo,
      branch: repo.branch || 'main',
      path: path,
      name: parts[parts.length - 1],
      extension: ext,
      isText: isText,
      isMedia: isMedia,
      size: entry.size || 0,
      sha: entry.sha || '',
      rawUrl: rawUrl,
      pagesUrl: pagesUrl
    });
  });

  return {
    projects: Object.keys(projects).map(function (id) { return projects[id]; }),
    files: files
  };
}

function mergeProjectSummary_(existing, incoming) {
  if (!existing) return incoming;
  existing.fileCount += incoming.fileCount || 0;
  existing.textFileCount += incoming.textFileCount || 0;
  existing.mediaFileCount += incoming.mediaFileCount || 0;
  existing.entryFiles = uniqueArray_((existing.entryFiles || []).concat(incoming.entryFiles || []));
  Object.keys(incoming.extensions || {}).forEach(function (ext) {
    existing.extensions[ext] = (existing.extensions[ext] || 0) + incoming.extensions[ext];
  });
  return existing;
}

function getGithubProjectIndex_(request) {
  request = request || {};
  const folders = getFolders_();
  const cached = readJsonFile_(folders.githubIndex, 'github_project_index.json');
  if (cached && (request.refresh !== true && String(request.refresh) !== 'true')) {
    cached.fromCache = true;
    return cached;
  }
  if (request.staleOk && cached) {
    cached.fromCache = true;
    return cached;
  }
  return scanGithubProjects_(request);
}

function searchGithubProjectFiles_(request) {
  const query = String(request.query || request.q || request.userRequest || '').trim();
  if (!query) return fail_('Missing query for projects.files.search.', 400);

  const index = getGithubProjectIndex_({ staleOk: true });
  if (!index.ok) return index;

  const maxResults = clamp_(Number(request.limit || request.maxResults || 12), 1, 50);
  const deepSearch = request.deep !== false && request.deepSearch !== false;
  const projectId = request.projectId ? safeId_(request.projectId) : '';
  const terms = tokenizeQuery_(query);

  let candidates = (index.files || []).filter(function (file) {
    if (projectId && file.projectId !== projectId) return false;
    if (request.textOnly && !file.isText) return false;
    return true;
  }).map(function (file) {
    return Object.assign({}, file, { score: scoreFileMetadata_(file, terms), snippet: '' });
  }).filter(function (file) { return file.score > 0 || !terms.length; });

  candidates.sort(function (a, b) { return b.score - a.score || String(a.path).localeCompare(String(b.path)); });

  const toDeep = deepSearch
    ? candidates.filter(function (file) { return file.isText; }).slice(0, UNIVERSAL_PROJECT_BACKEND.MAX_DEEP_SEARCH_FILES)
    : [];

  toDeep.forEach(function (file) {
    const fetched = fetchGithubRawTextFile_(file, UNIVERSAL_PROJECT_BACKEND.MAX_FILE_CHARS);
    if (fetched.ok) {
      const contentScore = scoreTextContent_(fetched.content, terms);
      file.score += contentScore;
      file.snippet = makeSnippet_(fetched.content, terms, 700);
      file.contentScanned = true;
    } else {
      file.contentScanned = false;
      file.fetchError = fetched.error;
    }
  });

  candidates.sort(function (a, b) { return b.score - a.score || String(a.path).localeCompare(String(b.path)); });

  return {
    ok: true,
    query: query,
    deepSearch: deepSearch,
    projectId: projectId || null,
    count: Math.min(maxResults, candidates.length),
    totalCandidates: candidates.length,
    results: candidates.slice(0, maxResults).map(function (file) {
      return {
        projectId: file.projectId,
        projectName: file.projectName,
        repo: file.owner + '/' + file.repo,
        branch: file.branch,
        path: file.path,
        extension: file.extension,
        size: file.size,
        score: round_(file.score, 3),
        rawUrl: file.rawUrl,
        pagesUrl: file.pagesUrl,
        snippet: file.snippet || ''
      };
    })
  };
}

function getGithubProjectFile_(request) {
  const index = getGithubProjectIndex_({ staleOk: true });
  if (!index.ok) return index;

  const path = String(request.path || '').trim();
  const rawUrl = String(request.rawUrl || '').trim();
  const projectId = request.projectId ? safeId_(request.projectId) : '';
  if (!path && !rawUrl) return fail_('Missing path or rawUrl for projects.file.get.', 400);

  const file = (index.files || []).find(function (item) {
    if (projectId && item.projectId !== projectId) return false;
    if (rawUrl && item.rawUrl === rawUrl) return true;
    return path && item.path === path;
  });

  if (!file) return fail_('File not found in cached GitHub index. Run projects.scanGithub first or check the path.', 404);
  if (!file.isText) {
    return {
      ok: true,
      file: file,
      content: null,
      note: 'This file is registered as media/binary. Use rawUrl/pagesUrl from the file object.'
    };
  }

  const fetched = fetchGithubRawTextFile_(file, clamp_(Number(request.maxChars || UNIVERSAL_PROJECT_BACKEND.MAX_FILE_CHARS), 1000, 250000));
  if (!fetched.ok) return fetched;

  return {
    ok: true,
    file: file,
    content: fetched.content,
    truncated: fetched.truncated,
    chars: fetched.content.length
  };
}

function fetchGithubRawTextFile_(file, maxChars) {
  try {
    if (!file || !file.rawUrl) return { ok: false, error: 'Missing rawUrl.' };
    const response = githubFetch_(file.rawUrl, { method: 'get', muteHttpExceptions: true, headers: { Accept: 'text/plain,*/*' } });
    const code = response.getResponseCode();
    if (code < 200 || code >= 300) return { ok: false, statusCode: code, error: response.getContentText() };
    let content = response.getContentText();
    const truncated = content.length > maxChars;
    if (truncated) content = content.slice(0, maxChars);
    return { ok: true, content: content, truncated: truncated };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
}

function saveProjectRegistryEntry_(request) {
  const folders = getFolders_();
  const payload = parsePayload_(request.payload || request.project || {}, {});
  const projectId = safeId_(request.projectId || payload.projectId || payload.id || payload.name || payload.url || 'project-' + Date.now());
  const now = new Date().toISOString();
  const record = {
    id: projectId,
    name: safeSmall_(request.name || payload.name || projectId),
    url: safeTextOptional_(request.url || payload.url || ''),
    repo: safeSmall_(request.repo || payload.repo || ''),
    rootPath: safeSmall_(request.rootPath || payload.rootPath || ''),
    tags: Array.isArray(payload.tags) ? payload.tags.map(safeSmall_) : [],
    createdAt: payload.createdAt || now,
    updatedAt: now,
    payload: payload
  };
  upsertJsonFile_(folders.projects, projectId + '.json', record);
  addToIndex_(UNIVERSAL_STORE_KEYS.PROJECT_REGISTRY_INDEX, projectId);
  return { ok: true, project: record };
}

function listProjectRegistryEntries_(request) {
  const folders = getFolders_();
  const ids = getIndex_(UNIVERSAL_STORE_KEYS.PROJECT_REGISTRY_INDEX);
  const projects = [];
  ids.forEach(function (id) {
    const record = readJsonFile_(folders.projects, id + '.json');
    if (record) projects.push(record);
  });
  projects.sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });
  return { ok: true, count: projects.length, projects: projects };
}

function createBot_(request) {
  const botId = safeId_(request.botId || request.id || request.name || 'bot-' + Date.now());
  const now = new Date().toISOString();
  const existing = getRecord_('BOT_', botId);
  const bot = {
    id: botId,
    name: safeSmall_(request.name || (existing && existing.name) || UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.name),
    level: safeSmall_(request.level || (existing && existing.level) || UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.level),
    role: safeTextOptional_(request.role || (existing && existing.role) || UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.role),
    systemPrompt: safeTextOptional_(request.systemPrompt || (existing && existing.systemPrompt) || ''),
    projectScope: safeSmall_(request.projectScope || (existing && existing.projectScope) || 'all'),
    allowedActions: normalizeStringArray_(request.allowedActions || (existing && existing.allowedActions) || ['chat', 'scan_github', 'search_files', 'resolve_voice', 'notify', 'create_app']),
    temperature: clamp_(Number(request.temperature !== undefined ? request.temperature : (existing && existing.temperature !== undefined ? existing.temperature : UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.temperature)), 0, 1.5),
    createdAt: existing && existing.createdAt ? existing.createdAt : now,
    updatedAt: now
  };
  saveRecord_('BOT_', UNIVERSAL_STORE_KEYS.BOTS_INDEX, botId, bot);
  return { ok: true, bot: bot };
}

function ensureDefaultBot_() {
  let bot = getRecord_('BOT_', UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.id);
  if (!bot) {
    bot = createBot_(UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT).bot;
  }
  return bot;
}

function listBots_(request) {
  const ids = getIndex_(UNIVERSAL_STORE_KEYS.BOTS_INDEX);
  if (ids.indexOf(UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.id) === -1) ensureDefaultBot_();
  const allIds = uniqueArray_(getIndex_(UNIVERSAL_STORE_KEYS.BOTS_INDEX).concat([UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.id]));
  const bots = allIds.map(function (id) { return getRecord_('BOT_', id); }).filter(Boolean);
  bots.sort(function (a, b) { return String(a.name).localeCompare(String(b.name)); });
  return { ok: true, count: bots.length, bots: bots };
}

function getBotRoute_(request) {
  const bot = getBot_(request.botId || request.id || UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.id);
  if (!bot) return fail_('Bot not found.', 404);
  return { ok: true, bot: bot };
}

function getBot_(botId) {
  botId = safeId_(botId || UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.id);
  return getRecord_('BOT_', botId) || (botId === UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.id ? ensureDefaultBot_() : null);
}

function chatWithBot_(request) {
  const message = String(request.message || request.prompt || request.userRequest || '').trim();
  if (!message) return fail_('Missing bot message.', 400);

  const bot = getBot_(request.botId || UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.id) || ensureDefaultBot_();
  const sessionId = safeId_(request.sessionId || request.conversationId || 'default');
  const scanGithub = request.scanGithub === true || String(request.scanGithub) === 'true' || request.deepSearch === true || String(request.deepSearch) === 'true';
  const history = readConversationHistory_(bot.id, sessionId);
  let projectContext = { ok: true, results: [], note: 'GitHub scan was not requested for this turn.' };

  if (scanGithub || request.projectId || request.query) {
    projectContext = searchGithubProjectFiles_({
      query: request.query || message,
      projectId: request.projectId || (bot.projectScope !== 'all' ? bot.projectScope : ''),
      deepSearch: request.deepSearch !== false,
      maxResults: request.maxResults || 8,
      textOnly: true
    });
  }

  const contextText = buildContextTextFromSearchResults_(projectContext, UNIVERSAL_PROJECT_BACKEND.MAX_BOT_CONTEXT_CHARS);
  const system = buildBotSystemPrompt_(bot, contextText);
  const messages = [{ role: 'system', content: system }];

  history.slice(-UNIVERSAL_PROJECT_BACKEND.MAX_HISTORY_MESSAGES).forEach(function (turn) {
    if (turn.user) messages.push({ role: 'user', content: turn.user });
    if (turn.assistant) messages.push({ role: 'assistant', content: turn.assistant });
  });
  messages.push({ role: 'user', content: message });

  const ai = callAiModel_(messages, { temperature: bot.temperature, model: request.model });
  const assistantText = ai.ok ? ai.text : localBotFallback_(message, projectContext, ai.error);

  appendConversationTurn_(bot.id, sessionId, {
    at: new Date().toISOString(),
    user: message,
    assistant: assistantText,
    aiConfigured: ai.configured,
    aiOk: ai.ok,
    projectContextSummary: summarizeProjectContext_(projectContext)
  });

  return {
    ok: true,
    bot: bot,
    sessionId: sessionId,
    ai: {
      configured: ai.configured,
      ok: ai.ok,
      model: ai.model || '',
      providerStatus: ai.statusCode || null,
      warning: ai.ok ? '' : ai.error
    },
    response: assistantText,
    projectContext: projectContext,
    nextActions: suggestNextActions_(message, projectContext)
  };
}

function buildBotSystemPrompt_(bot, contextText) {
  const base = [
    'You are ' + bot.name + ', a project bot for TyrannosaurusDM92 GitHub Pages projects.',
    'Role: ' + bot.role,
    'You can reason over the GitHub project context provided below, hold a helpful conversation, identify likely files to change, and propose precise implementation steps.',
    'Do not claim you directly edited GitHub unless an explicit write/deploy tool is connected. This Apps Script backend can scan/read/index files and store requests; GitHub commits must be done by a connected deployment process.',
    'When project context is missing, say what needs to be scanned or configured rather than inventing file contents.',
    'Keep responses practical and specific.'
  ];
  if (bot.systemPrompt) base.push('Additional instructions: ' + bot.systemPrompt);
  if (contextText) base.push('\nRetrieved GitHub project context:\n' + contextText);
  return base.join('\n');
}

function buildContextTextFromSearchResults_(searchResult, maxChars) {
  if (!searchResult || !searchResult.ok || !Array.isArray(searchResult.results)) return '';
  let out = '';
  searchResult.results.forEach(function (item, idx) {
    const block = [
      '--- Result ' + (idx + 1) + ' ---',
      'Project: ' + item.projectName + ' (' + item.projectId + ')',
      'Repo: ' + item.repo + ' @ ' + item.branch,
      'Path: ' + item.path,
      'Pages URL: ' + item.pagesUrl,
      'Snippet:',
      item.snippet || '[No snippet available]'
    ].join('\n');
    if ((out + '\n' + block).length <= maxChars) out += (out ? '\n\n' : '') + block;
  });
  return out;
}

function callAiModel_(messages, options) {
  options = options || {};
  const url = getScriptProperty_('AI_API_URL');
  const key = getScriptProperty_('AI_API_KEY');
  const model = options.model || getScriptProperty_('AI_MODEL') || 'configured-model';
  if (!url) {
    return { ok: false, configured: false, model: model, error: 'AI_API_URL is not configured. Set AI_API_URL and AI_API_KEY in Script Properties to enable model-backed responses.' };
  }

  try {
    const headers = { 'Content-Type': 'application/json' };
    if (key) headers.Authorization = 'Bearer ' + key;
    const payload = {
      model: model,
      messages: messages,
      temperature: options.temperature !== undefined ? options.temperature : 0.35
    };
    if (options.responseFormat) payload.response_format = options.responseFormat;

    const response = UrlFetchApp.fetch(url, {
      method: 'post',
      contentType: 'application/json',
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    });
    const statusCode = response.getResponseCode();
    const text = response.getContentText();
    let parsed = {};
    try { parsed = JSON.parse(text); } catch (err) { parsed = { raw: text }; }
    if (statusCode < 200 || statusCode >= 300) {
      return { ok: false, configured: true, model: model, statusCode: statusCode, error: parsed.error && parsed.error.message ? parsed.error.message : text };
    }
    const content = parsed.choices && parsed.choices[0] && parsed.choices[0].message
      ? parsed.choices[0].message.content
      : (parsed.output_text || parsed.text || '');
    if (!content) return { ok: false, configured: true, model: model, statusCode: statusCode, error: 'AI endpoint returned no assistant text.' };
    return { ok: true, configured: true, model: model, statusCode: statusCode, text: content, raw: parsed };
  } catch (err) {
    return { ok: false, configured: true, model: model, error: String(err.message || err) };
  }
}

function localBotFallback_(message, projectContext, aiError) {
  const lines = [];
  lines.push('I can help with this request, but the model-backed AI endpoint is not configured yet, so I am using the backend\'s built-in file-scan fallback.');
  if (aiError) lines.push('AI status: ' + aiError);

  if (projectContext && projectContext.ok && projectContext.results && projectContext.results.length) {
    lines.push('\nMost relevant GitHub files I found:');
    projectContext.results.slice(0, 6).forEach(function (item, idx) {
      lines.push((idx + 1) + '. ' + item.path + ' — ' + item.projectName + ' — score ' + item.score);
      if (item.snippet) lines.push('   ' + item.snippet.replace(/\s+/g, ' ').slice(0, 220));
    });
    lines.push('\nRecommended next step: use these files as context for the requested change, or configure AI_API_URL/AI_API_KEY so the bot can formulate a fuller ChatGPT-style response.');
  } else {
    lines.push('\nI did not find indexed file context yet. Run action=projects.scanGithub first, then call bots.chat with scanGithub=true.');
  }

  lines.push('\nUser request received: ' + message.slice(0, 500));
  return lines.join('\n');
}

function resolveBotIntent_(request) {
  const userRequest = String(request.message || request.prompt || request.userRequest || '').trim();
  if (!userRequest) return fail_('Missing userRequest/message for intent resolution.', 400);

  const lower = userRequest.toLowerCase();
  const intent = {
    ok: true,
    userRequest: userRequest,
    resolvedAt: new Date().toISOString(),
    likelyIntent: 'general_chat',
    confidence: 0.45,
    recommendedActions: [],
    needsGithubScan: false,
    needsVoicePipeline: false,
    needsNotification: false,
    needsAppManifest: false,
    safetyNotes: []
  };

  if (/(fix|revise|edit|change|update|merge|replace|implement|integrate|debug|broken)/.test(lower)) {
    intent.likelyIntent = 'project_code_change_or_debug';
    intent.confidence = 0.78;
    intent.needsGithubScan = true;
    intent.recommendedActions.push('projects.files.search', 'bots.scanAndAnswer');
  }
  if (/(voice|accent|tts|mp3|wav|audio|source model|slider)/.test(lower)) {
    intent.needsVoicePipeline = true;
    intent.recommendedActions.push('voice.source.resolve', 'voice.jobs.create');
  }
  if (/(notify|notification|email|send|alert|remind)/.test(lower)) {
    intent.needsNotification = true;
    intent.recommendedActions.push('notifications.send');
  }
  if (/(app|pwa|install|manifest|launcher|icon|home screen)/.test(lower)) {
    intent.needsAppManifest = true;
    intent.recommendedActions.push('app.create');
  }
  if (/(scan|parse|read files|github|repo|repository|project files)/.test(lower)) {
    intent.needsGithubScan = true;
    intent.recommendedActions.push('projects.scanGithub', 'projects.files.search');
  }

  intent.recommendedActions = uniqueArray_(intent.recommendedActions);

  const aiUrl = getScriptProperty_('AI_API_URL');
  if (aiUrl && request.useAi !== false) {
    const ai = callAiModel_([
      { role: 'system', content: 'Return a compact JSON intent plan for a project backend. Keys: likelyIntent, confidence, recommendedActions, targetProjects, fileHints, notes. Do not include markdown.' },
      { role: 'user', content: userRequest }
    ], { temperature: 0.1, responseFormat: { type: 'json_object' }, model: request.model });
    if (ai.ok) {
      try {
        intent.aiPlan = JSON.parse(ai.text);
      } catch (err) {
        intent.aiPlanText = ai.text;
      }
    } else {
      intent.aiWarning = ai.error;
    }
  }

  return intent;
}

function readConversationHistory_(botId, sessionId) {
  const folders = getFolders_();
  const filename = safeId_(botId) + '__' + safeId_(sessionId) + '.json';
  const record = readJsonFile_(folders.conversations, filename);
  return record && Array.isArray(record.history) ? record.history : [];
}

function appendConversationTurn_(botId, sessionId, turn) {
  const folders = getFolders_();
  const filename = safeId_(botId) + '__' + safeId_(sessionId) + '.json';
  const history = readConversationHistory_(botId, sessionId);
  history.push(turn);
  const trimmed = history.slice(-80);
  upsertJsonFile_(folders.conversations, filename, {
    botId: botId,
    sessionId: sessionId,
    updatedAt: new Date().toISOString(),
    history: trimmed
  });
  return trimmed;
}

function getBotHistory_(request) {
  const botId = request.botId || UNIVERSAL_PROJECT_BACKEND.DEFAULT_BOT.id;
  const sessionId = request.sessionId || request.conversationId || 'default';
  return {
    ok: true,
    botId: safeId_(botId),
    sessionId: safeId_(sessionId),
    history: readConversationHistory_(botId, sessionId)
  };
}

function summarizeProjectContext_(projectContext) {
  if (!projectContext || !projectContext.ok) return { ok: false, error: projectContext && projectContext.error ? projectContext.error : '' };
  return {
    ok: true,
    query: projectContext.query || '',
    count: projectContext.count || 0,
    files: (projectContext.results || []).slice(0, 5).map(function (item) { return item.path; })
  };
}

function suggestNextActions_(message, projectContext) {
  const actions = ['projects.files.search'];
  const lower = String(message || '').toLowerCase();
  if (/(voice|accent|audio|mp3|wav|tts)/.test(lower)) actions.push('voice.source.resolve');
  if (/(notify|email|alert)/.test(lower)) actions.push('notifications.send');
  if (/(app|pwa|manifest|install)/.test(lower)) actions.push('app.create');
  if (!projectContext || !projectContext.ok || !(projectContext.results || []).length) actions.unshift('projects.scanGithub');
  return uniqueArray_(actions);
}

function resolveVoiceSourceModel_(request) {
  const biomeInput = request.biomeId || request.biome || request.cachedBiome || request.location || 'ocean_surface_floating_settlement';
  const biome = findBiome_(biomeInput) || BIOME_CATALOG[0];
  const race = safeSmall_(request.race || request.ancestry || request.species || 'Human');
  const genderIdentity = safeSmall_(request.genderIdentity || request.gender || 'Unspecified');
  const className = safeSmall_(request.className || request.class || 'Commoner');
  const emotion = safeSmall_(request.emotion || 'Neutral/Base');
  const baseModel = first_(biome.modelSuggestions) || 'synthetic_original_reference';
  const raceOverlay = getRaceVoiceOverlay_(race);
  const classOverlay = getClassVoiceOverlay_(className);
  const genderOverlay = getGenderVoiceOverlay_(genderIdentity);

  const defaultProfile = getDefaultVoiceProfile_();
  const voiceProfile = Object.assign({}, defaultProfile, {
    pitch: clamp_(defaultProfile.pitch + genderOverlay.pitchDelta + raceOverlay.pitchDelta + classOverlay.pitchDelta, 0, 10),
    speed: clamp_(defaultProfile.speed + raceOverlay.speedDelta + classOverlay.speedDelta, 0, 10),
    roughness: clamp_(defaultProfile.roughness + raceOverlay.roughnessDelta + classOverlay.roughnessDelta, 0, 10),
    breath: clamp_(defaultProfile.breath + raceOverlay.breathDelta + classOverlay.breathDelta, 0, 10),
    resonance: clamp_(defaultProfile.resonance + raceOverlay.resonanceDelta + genderOverlay.resonanceDelta, 0, 10),
    accentColor: clamp_(defaultProfile.accentColor + raceOverlay.accentDelta, 0, 10)
  });

  const sourceName = [biome.folderName, slug_(race), slug_(genderIdentity), slug_(className)].filter(Boolean).join('__');

  return {
    ok: true,
    resolvedAt: new Date().toISOString(),
    sourceName: sourceName,
    sourceModelId: baseModel,
    recommendedFilenameBase: sourceName + '.wav',
    biome: addAccentManifestDefaults_(biome),
    decisionInputs: {
      biome: biomeInput,
      race: race,
      genderIdentity: genderIdentity,
      className: className,
      emotion: emotion
    },
    overlays: {
      race: raceOverlay,
      genderIdentity: genderOverlay,
      class: classOverlay
    },
    voiceProfile: voiceProfile,
    voiceJobTemplate: buildPreviewPayload_({
      text: request.text || request.phrase || 'This is what I sound like.',
      biomeIds: [biome.id],
      voiceProfile: voiceProfile,
      characterContext: {
        race: race,
        genderIdentity: genderIdentity,
        className: className,
        emotion: emotion,
        characterName: request.characterName || ''
      }
    }).payload,
    note: 'This resolves the best available source model and control payload. Actual WAV/MP3 rendering still requires a configured TTS_ENGINE_URL or frontend/external audio engine.'
  };
}

function getRaceVoiceOverlay_(race) {
  const key = String(race || '').toLowerCase();
  const overlay = { name: race || 'Human', pitchDelta: 0, speedDelta: 0, roughnessDelta: 0, breathDelta: 0, resonanceDelta: 0, accentDelta: 0, notes: 'Human/neutral voice base.' };
  if (/elf|eladrin|drow/.test(key)) return Object.assign(overlay, { pitchDelta: 0.4, speedDelta: 0.1, breathDelta: 0.3, resonanceDelta: -0.2, accentDelta: 0.2, notes: 'Smoother, more musical, lighter attack.' });
  if (/dwarf|duergar/.test(key)) return Object.assign(overlay, { pitchDelta: -0.5, speedDelta: -0.1, roughnessDelta: 0.3, resonanceDelta: 0.6, notes: 'Lower, denser, clipped, grounded.' });
  if (/orc|goblin|hobgoblin|bugbear/.test(key)) return Object.assign(overlay, { pitchDelta: -0.3, speedDelta: 0.1, roughnessDelta: 0.7, resonanceDelta: 0.3, notes: 'Rougher, punchier, more direct.' });
  if (/halfling|kender|gnome|gandirosha/.test(key)) return Object.assign(overlay, { pitchDelta: 0.4, speedDelta: 0.4, breathDelta: 0.1, resonanceDelta: -0.2, notes: 'Warm, quick, bright, approachable.' });
  if (/aquatic|sea|merfolk|water|tamhiogal|dril/.test(key)) return Object.assign(overlay, { speedDelta: -0.2, breathDelta: 0.6, roughnessDelta: -0.2, accentDelta: 0.5, notes: 'Flowing, breathy, wave-like phrasing.' });
  if (/dragonborn|kobold|lizard|tortle|reptile/.test(key)) return Object.assign(overlay, { pitchDelta: -0.2, roughnessDelta: 0.8, resonanceDelta: 0.4, notes: 'Growl/rasp edge with stronger throat placement.' });
  if (/tabaxi|harengon|beast|jaspey|geisamahi|satyr|minotaur/.test(key)) return Object.assign(overlay, { speedDelta: 0.2, roughnessDelta: 0.2, accentDelta: 0.3, notes: 'More expressive and species-colored articulation.' });
  if (/warforged|construct|robot|automaton/.test(key)) return Object.assign(overlay, { speedDelta: -0.1, roughnessDelta: 0.1, resonanceDelta: 0.2, accentDelta: -0.2, notes: 'Slight construct steadiness without becoming fully robotic.' });
  if (/genasi|elemental|panolima/.test(key)) return Object.assign(overlay, { breathDelta: 0.2, roughnessDelta: 0.2, accentDelta: 0.4, notes: 'Elemental color and texture over the biome accent.' });
  return overlay;
}

function getClassVoiceOverlay_(className) {
  const key = String(className || '').toLowerCase();
  const overlay = { name: className || 'Commoner', pitchDelta: 0, speedDelta: 0, roughnessDelta: 0, breathDelta: 0, notes: 'Neutral class delivery.' };
  if (/barbarian/.test(key)) return Object.assign(overlay, { pitchDelta: -0.2, speedDelta: -0.1, roughnessDelta: 0.7, notes: 'Thunderous, physical, forceful.' });
  if (/bard/.test(key)) return Object.assign(overlay, { pitchDelta: 0.2, speedDelta: 0.2, breathDelta: 0.2, notes: 'Theatrical, melodic, expressive.' });
  if (/cleric/.test(key)) return Object.assign(overlay, { speedDelta: -0.1, breathDelta: 0.2, notes: 'Ceremonial, steady, compassionate.' });
  if (/druid/.test(key)) return Object.assign(overlay, { speedDelta: -0.2, breathDelta: 0.3, notes: 'Calm, natural, grounded.' });
  if (/fighter/.test(key)) return Object.assign(overlay, { speedDelta: 0.1, roughnessDelta: 0.2, notes: 'Short, clear, command-ready.' });
  if (/monk/.test(key)) return Object.assign(overlay, { speedDelta: -0.1, roughnessDelta: -0.2, notes: 'Controlled, centered, precise.' });
  if (/paladin/.test(key)) return Object.assign(overlay, { speedDelta: -0.1, roughnessDelta: 0.2, notes: 'Declarative, formal, resolute.' });
  if (/ranger/.test(key)) return Object.assign(overlay, { speedDelta: 0.1, notes: 'Practical, observant, efficient.' });
  if (/rogue/.test(key)) return Object.assign(overlay, { pitchDelta: -0.1, speedDelta: 0.35, breathDelta: 0.1, notes: 'Hushed, quick, agile.' });
  if (/sorcerer/.test(key)) return Object.assign(overlay, { pitchDelta: 0.2, breathDelta: 0.3, notes: 'Incandescent, emotionally charged.' });
  if (/warlock/.test(key)) return Object.assign(overlay, { speedDelta: -0.05, breathDelta: 0.4, notes: 'Lyrical, strange, pact-touched.' });
  if (/wizard|artificer/.test(key)) return Object.assign(overlay, { speedDelta: -0.05, roughnessDelta: -0.1, notes: 'Precise, careful, articulate.' });
  return overlay;
}

function getGenderVoiceOverlay_(genderIdentity) {
  const key = String(genderIdentity || '').toLowerCase();
  const overlay = { name: genderIdentity || 'Unspecified', pitchDelta: 0, resonanceDelta: 0, notes: 'No automatic gendered voice shift beyond user sliders.' };
  if (/trans[-\s]?man|man|male|masc|demi[-\s]?male/.test(key) && !/woman|female|femme/.test(key)) return Object.assign(overlay, { pitchDelta: -0.35, resonanceDelta: 0.25, notes: 'Masculine-coded option: slightly lower with fuller resonance; user sliders remain primary.' });
  if (/trans[-\s]?woman|woman|female|femme|demi[-\s]?female/.test(key)) return Object.assign(overlay, { pitchDelta: 0.35, resonanceDelta: -0.15, notes: 'Feminine-coded option: slightly higher/lighter; user sliders remain primary.' });
  if (/non[-\s]?binary|agender|gender[-\s]?fluid|genderless|neutrois|poly|bi[-\s]?gender/.test(key)) return Object.assign(overlay, { pitchDelta: 0, resonanceDelta: 0, notes: 'Gender-expansive option: neutral center; style comes from character and sliders.' });
  return overlay;
}

function uploadBase64Asset_(request) {
  const permissionType = String(request.permissionType || '').trim();
  if (ALLOWED_ASSET_PERMISSION_TYPES.indexOf(permissionType) === -1) {
    return fail_('Permission type blocked. Allowed: ' + ALLOWED_ASSET_PERMISSION_TYPES.join(', '), 403);
  }

  const data = String(request.data || request.base64 || '').replace(/^data:[^,]+,/, '');
  if (!data) return fail_('Missing base64 asset data.', 400);

  const mimeType = safeSmall_(request.mimeType || request.contentType || 'application/octet-stream');
  const filename = safeFilename_(request.filename || request.name || ('asset-' + Date.now()));
  const bytes = Utilities.base64Decode(data);
  const blob = Utilities.newBlob(bytes, mimeType, filename);
  const folders = getFolders_();
  const file = folders.voiceAssets.createFile(blob);

  const registered = registerAsset_({
    assetId: request.assetId || 'asset_' + Utilities.getUuid(),
    name: request.name || filename,
    permissionType: permissionType,
    ownerLabel: request.ownerLabel || '',
    sourceUrl: file.getUrl(),
    notes: request.notes || 'Uploaded through assets.uploadBase64 / voice.assets.uploadBase64.'
  });

  return {
    ok: true,
    file: {
      id: file.getId(),
      name: file.getName(),
      url: file.getUrl(),
      mimeType: mimeType,
      bytes: bytes.length
    },
    asset: registered.asset
  };
}

function sendNotification_(request) {
  const configuredDefault = getScriptProperty_('NOTIFICATION_DEFAULT_TO') || '';
  const to = safeTextOptional_(request.to || configuredDefault);
  const subject = safeSmall_(request.subject || 'TyrannosaurusDM92 Project Notification');
  const body = safeTextOptional_(request.body || request.message || 'Notification from the Universal Project Backend.');
  const requireAdminForAny = String(getScriptProperty_('REQUIRE_ADMIN_FOR_NOTIFICATIONS') || 'true').toLowerCase() !== 'false';

  if (!to) return fail_('Missing notification recipient. Set NOTIFICATION_DEFAULT_TO or pass to with adminKey.', 400);
  if (requireAdminForAny || to !== configuredDefault) requireAdmin_(request);

  MailApp.sendEmail({ to: to, subject: subject, body: body });

  const folders = getFolders_();
  const id = 'notification_' + Utilities.getUuid();
  const record = {
    id: id,
    sentAt: new Date().toISOString(),
    to: to,
    subject: subject,
    bodyPreview: body.slice(0, 300),
    projectId: safeSmall_(request.projectId || ''),
    botId: safeSmall_(request.botId || ''),
    status: 'sent'
  };
  upsertJsonFile_(folders.notifications, id + '.json', record);
  addToIndex_(UNIVERSAL_STORE_KEYS.NOTIFICATIONS_INDEX, id);

  return { ok: true, notification: record };
}

function listNotifications_(request) {
  const folders = getFolders_();
  const limit = clamp_(Number(request.limit || 25), 1, 200);
  const ids = getIndex_(UNIVERSAL_STORE_KEYS.NOTIFICATIONS_INDEX);
  const records = ids.map(function (id) { return readJsonFile_(folders.notifications, id + '.json'); }).filter(Boolean);
  records.sort(function (a, b) { return String(b.sentAt).localeCompare(String(a.sentAt)); });
  return { ok: true, count: Math.min(limit, records.length), notifications: records.slice(0, limit) };
}

function createProjectApp_(request) {
  const folders = getFolders_();
  const payload = parsePayload_(request.payload || request.app || {}, {});
  const appId = safeId_(request.appId || payload.appId || payload.id || request.name || payload.name || 'app-' + Date.now());
  const now = new Date().toISOString();
  const name = safeSmall_(request.name || payload.name || appId);
  const startUrl = safeTextOptional_(request.startUrl || payload.startUrl || request.url || payload.url || UNIVERSAL_PROJECT_BACKEND.PAGES_ORIGIN);
  const record = {
    id: appId,
    name: name,
    shortName: safeSmall_(request.shortName || payload.shortName || name.slice(0, 12)),
    description: safeTextOptional_(request.description || payload.description || 'Installable project app powered by the Universal Project Backend.'),
    startUrl: startUrl,
    scope: safeTextOptional_(request.scope || payload.scope || startUrl),
    themeColor: safeSmall_(request.themeColor || payload.themeColor || '#00ffff'),
    backgroundColor: safeSmall_(request.backgroundColor || payload.backgroundColor || '#050814'),
    display: safeSmall_(request.display || payload.display || 'standalone'),
    orientation: safeSmall_(request.orientation || payload.orientation || 'portrait-primary'),
    projectId: safeSmall_(request.projectId || payload.projectId || ''),
    icons: Array.isArray(payload.icons) ? payload.icons : [],
    createdAt: payload.createdAt || now,
    updatedAt: now,
    manifest: {}
  };
  record.manifest = {
    name: record.name,
    short_name: record.shortName,
    description: record.description,
    id: '/' + appId,
    start_url: record.startUrl,
    scope: record.scope,
    display: record.display,
    orientation: record.orientation,
    theme_color: record.themeColor,
    background_color: record.backgroundColor,
    categories: ['productivity', 'games', 'entertainment'],
    icons: record.icons
  };
  upsertJsonFile_(folders.apps, appId + '.json', record);
  addToIndex_(UNIVERSAL_STORE_KEYS.PROJECT_APPS_INDEX, appId);
  return { ok: true, app: record };
}

function listProjectApps_(request) {
  const folders = getFolders_();
  const ids = getIndex_(UNIVERSAL_STORE_KEYS.PROJECT_APPS_INDEX);
  const apps = ids.map(function (id) { return readJsonFile_(folders.apps, id + '.json'); }).filter(Boolean);
  apps.sort(function (a, b) { return String(b.updatedAt).localeCompare(String(a.updatedAt)); });
  return { ok: true, count: apps.length, apps: apps };
}

function getProjectApp_(request) {
  const appId = safeId_(request.appId || request.id || '');
  if (!appId) return fail_('Missing appId.', 400);
  const app = readJsonFile_(getFolders_().apps, appId + '.json');
  if (!app) return fail_('App not found: ' + appId, 404);
  return { ok: true, app: app };
}

function isBlockedProjectPath_(path) {
  const normalized = '/' + String(path || '').replace(/^\/+/, '');
  return UNIVERSAL_PROJECT_BACKEND.BLOCKED_FILE_PATTERNS.some(function (pattern) {
    return normalized.indexOf(pattern) !== -1;
  });
}

function getExtension_(path) {
  const name = String(path || '').split('/').pop() || '';
  const idx = name.lastIndexOf('.');
  return idx === -1 ? '' : name.slice(idx + 1).toLowerCase();
}

function normalizeUrlPath_(path) {
  path = String(path || '/');
  if (path.charAt(0) !== '/') path = '/' + path;
  return path.replace(/\/+/g, '/');
}

function tokenizeQuery_(query) {
  return uniqueArray_(String(query || '')
    .toLowerCase()
    .replace(/[^a-z0-9_\-./]+/g, ' ')
    .split(/\s+/)
    .filter(function (term) { return term && term.length > 1; })
    .slice(0, 24));
}

function scoreFileMetadata_(file, terms) {
  const hay = [file.projectName, file.projectId, file.path, file.name, file.extension].join(' ').toLowerCase();
  let score = 0;
  terms.forEach(function (term) {
    if (hay.indexOf(term) !== -1) score += term.length >= 5 ? 4 : 2;
    if (file.name && file.name.toLowerCase().indexOf(term) !== -1) score += 3;
  });
  if (/index\.html?$/i.test(file.path)) score += 0.5;
  return score;
}

function scoreTextContent_(content, terms) {
  const lower = String(content || '').toLowerCase();
  let score = 0;
  terms.forEach(function (term) {
    const matches = lower.split(term).length - 1;
    if (matches > 0) score += Math.min(20, matches) * (term.length >= 5 ? 2 : 1);
  });
  return score;
}

function makeSnippet_(content, terms, maxLen) {
  content = String(content || '');
  if (!content) return '';
  const lower = content.toLowerCase();
  let pos = -1;
  for (let i = 0; i < terms.length; i++) {
    pos = lower.indexOf(terms[i]);
    if (pos !== -1) break;
  }
  if (pos === -1) pos = 0;
  const start = Math.max(0, pos - Math.floor(maxLen / 3));
  const end = Math.min(content.length, start + maxLen);
  return (start > 0 ? '…' : '') + content.slice(start, end).replace(/\s+/g, ' ').trim() + (end < content.length ? '…' : '');
}

function uniqueArray_(arr) {
  const seen = {};
  const out = [];
  (arr || []).forEach(function (item) {
    const key = String(item);
    if (!key || seen[key]) return;
    seen[key] = true;
    out.push(item);
  });
  return out;
}

function normalizeStringArray_(value) {
  if (Array.isArray(value)) return value.map(safeSmall_).filter(Boolean);
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map(safeSmall_).filter(Boolean);
    } catch (err) {}
    return value.split(',').map(safeSmall_).filter(Boolean);
  }
  return [];
}

/***************************************************************
 * Example frontend POST payload:
 *
 * {
 *   "action": "voice.jobs.create",
 *   "text": "The tide remembers every name spoken over it.",
 *   "crossoverId": "biome_cache_combo_004",
 *   "voiceProfile": {
 *     "pitch": 5,
 *     "speed": 5,
 *     "accentColor": 7,
 *     "influenceRace": 1,
 *     "influenceBiome": 1
 *   },
 *   "layers": [
 *     {
 *       "biomeId": "farming",
 *       "enabled": true,
 *       "intensityPercent": 16
 *     },
 *     {
 *       "biomeId": "marshes_and_swamps",
 *       "enabled": true,
 *       "intensityPercent": 47
 *     },
 *     {
 *       "biomeId": "underwater_without_reefs",
 *       "enabled": true,
 *       "intensityPercent": 37
 *     }
 *   ],
 *   "characterContext": {
 *     "race": "Halfling",
 *     "className": "Bard",
 *     "genderIdentity": "Non-Binary",
 *     "emotion": "Warm"
 *   }
 * }
 ***************************************************************/
    return {
      "doGet": (typeof doGet === 'function' ? doGet : null),
      "doPost": (typeof doPost === 'function' ? doPost : null),
      "doOptions": (typeof doOptions === 'function' ? doOptions : null),
      "routeRequest_": (typeof routeRequest_ === 'function' ? routeRequest_ : null),
      "setup_": (typeof setup_ === 'function' ? setup_ : null),
      "getUniversalHealth_": (typeof getUniversalHealth_ === 'function' ? getUniversalHealth_ : null),
      "scanGithubProjects_": (typeof scanGithubProjects_ === 'function' ? scanGithubProjects_ : null),
      "chatWithBot_": (typeof chatWithBot_ === 'function' ? chatWithBot_ : null),
      "getHealth_": (typeof getHealth_ === 'function' ? getHealth_ : null)
    };
  })();
  return TDM92_MODULE_CACHE.universal;
}


/* ==========================================================================
 * Wrapped source module: Original Belavadös Character Studio Backend
 * ========================================================================== */
function tdm92_module_belavados_() {
  if (TDM92_MODULE_CACHE.belavados) return TDM92_MODULE_CACHE.belavados;
  TDM92_MODULE_CACHE.belavados = (function () {
/***************************************************************
 * Belavadös Character Studio Backend
 * Google Apps Script Web App Backend
 *
 * Deploy:
 * 1) Apps Script > New project
 * 2) Paste this into Code.gs
 * 3) Deploy > New deployment > Web app
 * 4) Execute as: Me
 * 5) Who has access: Anyone / Anyone with link
 *
 * Optional Script Properties:
 * - TTS_ENGINE_URL: external synthesis endpoint, if you add one later
 * - TTS_ENGINE_KEY: optional bearer/API key for external engine
 * - ADMIN_KEY: optional admin key for protected actions
 *
 * This backend validates and stores:
 * - 17 fantasy accent / biome manifests
 * - 680 generated 3-biome crossover manifests
 * - slider schema + defaults
 * - weighted crossover layer payloads
 * - user voice presets
 * - safety/permission asset registry
 * - synthesis job payloads
 *
 * Important:
 * Apps Script is not a real-time DSP engine. It validates and routes
 * the voice request. Actual PCM decoding, model mixing, resynthesis,
 * and waveform rendering should happen in your frontend or external
 * voice engine.
 ***************************************************************/

const APP_VERSION = 'belavados.character-studio.backend.v1.0.0';

const ALLOWED_ASSET_PERMISSION_TYPES = [
  'own_voice',
  'licensed_actor',
  'public_domain_character_asset',
  'synthetic_original'
];

const MAX_TEXT_CHARS = 5000;
const MAX_CACHE_BIOMES = 3;

const STORE_KEYS = {
  PRESETS_INDEX: 'BELAVADOS_PRESETS_INDEX',
  ASSETS_INDEX: 'BELAVADOS_ASSETS_INDEX',
  JOBS_INDEX: 'BELAVADOS_JOBS_INDEX',
  ACTIVE_CLIP: 'BELAVADOS_ACTIVE_CLIP'
};

/***************************************************************
 * CHARACTER STUDIO APP / DRIVE STORAGE CONFIG
 *
 * This block is the non-voice merge from the older Character
 * Studio backend: launcher/PWA, setup, shared-state storage,
 * character save/load, logs, and basic export.
 *
 * Old voice preset, voice asset upload, and old voice-profile
 * resolver code were intentionally not merged. The updated voice
 * pipeline above remains the source of truth.
 ***************************************************************/
const BELAVADOS_CHARACTER_STUDIO = {
  APP_NAME: 'Belavadös Character Studio',
  SHORT_NAME: 'Belavadös',
  VERSION: '1.0.0',
  ROOT_FOLDER_NAME: 'Belavados Character Studio Backend',
  DATA_FOLDER_NAME: 'data',
  CHARACTER_FOLDER_NAME: 'characters',
  SHARED_STATE_FOLDER_NAME: 'shared-state',
  LOG_FOLDER_NAME: 'logs',

  /*
   * After GitHub is ready, you may paste the final site URL here.
   * Example:
   * FRONTEND_URL: 'https://tyrannosaurusdm92.github.io/BelavadosProjects/BelavadosCharacterStudio/'
   */
  FRONTEND_URL: '',

  THEME_COLOR: '#00ffff',
  BACKGROUND_COLOR: '#050814',

  /*
   * Optional lightweight protection.
   * Leave empty while developing.
   * If you later set this, frontend requests must include apiKey.
   */
  API_KEY: ''
};


const VOICE_SLIDER_SCHEMA = [
  { label: 'Voice Height', key: 'pitch', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Base pitch, F0, semitone shift, pitch range' },
  { label: 'Speaking Speed', key: 'speed', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Speech rate, duration, pacing' },
  { label: 'Expression Shape', key: 'inflection', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Pitch motion, melody, phrase movement' },
  { label: 'Hesitations', key: 'stutter', min: 0, max: 10, step: 0.1, default: 1.0, controls: 'Stutter chance, hesitation text, pause behavior' },
  { label: 'Softness', key: 'breath', min: 0, max: 10, step: 0.1, default: 3.0, controls: 'Airiness, aspiration, soft delivery' },
  { label: 'Gruff Edge', key: 'roughness', min: 0, max: 10, step: 0.1, default: 2.0, controls: 'Rough cadence, jitter/shimmer hints, gruff stress' },
  { label: 'Body / Depth', key: 'resonance', min: 0, max: 10, step: 0.1, default: 5.5, controls: 'Fullness, formant scale, chest/body feel' },
  { label: 'Speech Style', key: 'formality', min: 0, max: 10, step: 0.1, default: 5.5, controls: 'Formality, articulation, carefulness' },
  { label: 'Vowel Flow', key: 'vowelFlow', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Clipped vs stretched vowels' },
  { label: 'Consonant Bite', key: 'consonantBite', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Soft vs sharp consonants' },
  { label: 'Mouth Shape', key: 'mouthShape', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Closed vs open mouth feel' },
  { label: 'Nasal Color', key: 'nasality', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Oral vs nasal color' },
  { label: 'Throat Depth', key: 'throatDepth', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Forward vs back, throaty resonance' },
  { label: 'Speech Rhythm', key: 'rhythm', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Even vs bouncy cadence' },
  { label: 'Pause Space', key: 'pauseControl', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Tight vs spacious phrase timing' },
  { label: 'Word Emphasis', key: 'emphasis', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Gentle vs strong stress' },
  { label: 'Warmth', key: 'warmth', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Cool vs warm delivery' },
  { label: 'Clarity', key: 'clarity', min: 0, max: 10, step: 0.1, default: 6.0, controls: 'Muttered vs clear articulation' },
  { label: 'Projection', key: 'projection', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Quiet/private vs projected/outward' },
  { label: 'Human Variation', key: 'humanVariation', min: 0, max: 10, step: 0.1, default: 5.0, controls: 'Mechanical steadiness vs lifelike micro-variation' },
  { label: 'Accent Color', key: 'accentColor', min: 0, max: 10, step: 0.1, default: 7.0, controls: 'Removes or strengthens accent mouth-feel' },

  { label: 'Race / Ancestry Influence', key: 'influenceRace', min: 0, max: 1, step: 0.01, default: 1.0, percent: true, controls: 'How strongly ancestry/species modifies the base voice' },
  { label: 'Gender Identity Influence', key: 'influenceGender', min: 0, max: 1, step: 0.01, default: 1.0, percent: true, controls: 'How strongly gender-linked style affects the voice' },
  { label: 'Personality Influence', key: 'influencePersonality', min: 0, max: 1, step: 0.01, default: 1.0, percent: true, controls: 'How strongly personality affects delivery' },
  { label: 'Accent Strength / Remove Accent', key: 'influenceBiome', min: 0, max: 1, step: 0.01, default: 1.0, percent: true, controls: 'How strongly biome/accent rules appear or fade' },
  { label: 'Uploaded / Recorded Voice Influence', key: 'influenceBaseAudio', min: 0, max: 1, step: 0.01, default: 0.45, percent: true, controls: 'How much the original clip remains in the result' },
  { label: 'Emotion Strength', key: 'emotionIntensity', min: 0, max: 1, step: 0.01, default: 0.75, percent: true, controls: 'How strongly emotion curves reshape pitch, timing, and tone' }
];

const BIOME_CATALOG = [
  {
    id: 'ocean_surface_floating_settlement',
    folderName: 'tidecrest-cant',
    category: 'Ocean',
    biome: 'Ocean Surface Floating Settlement',
    fantasyAccentName: 'Tidecrest Cant',
    baseAccentInspiration: 'Portuguese',
    raceOverlayBehavior: 'Humans sound closest to the base; elves make it airy; dwarves make it harsher; aquatic races make it very fluid.',
    classOverlayBehavior: 'Merchants sound like dock traders; captains/warriors sound commanding; bards sound sea-shanty-like.',
    finalVoiceFeel: 'Open, rolling, maritime, lively.',
    modelSuggestions: ['piper_pt_PT', 'kokoro_portuguese_reference', 'licensed_portuguese_actor_reference']
  },
  {
    id: 'underwater_with_reefs',
    folderName: 'reefglass-lilt',
    category: 'Ocean',
    biome: 'Underwater With Reefs',
    fantasyAccentName: 'Reefglass Lilt',
    baseAccentInspiration: 'Japanese',
    raceOverlayBehavior: 'Elves make it delicate; aquatic races make it especially fluid; orcs make it more abrupt and unusual.',
    classOverlayBehavior: 'Clerics sound ritualistic; mages sound precise; rogues sound muffled and quick.',
    finalVoiceFeel: 'Graceful, clear, flowing, elegant.',
    modelSuggestions: ['kokoro_ja', 'licensed_japanese_actor_reference', 'synthetic_japanese_accent_reference']
  },
  {
    id: 'underwater_without_reefs',
    folderName: 'deepcurrent-song',
    category: 'Ocean',
    biome: 'Underwater Without Reefs',
    fantasyAccentName: 'Deepcurrent Song',
    baseAccentInspiration: 'Thai',
    raceOverlayBehavior: 'Aquatic races make it almost sung; dwarves make it denser and slower; humans keep it balanced.',
    classOverlayBehavior: 'Rangers sound calm and practical; warriors sound clipped and blunt.',
    finalVoiceFeel: 'Quiet, deep, rhythmic, mysterious.',
    modelSuggestions: ['pythaitts', 'khanomtan_tts', 'thonburian_tts']
  },
  {
    id: 'grassland',
    folderName: 'plainwind-common',
    category: 'Plains',
    biome: 'Grassland',
    fantasyAccentName: 'Plainwind Common',
    baseAccentInspiration: 'American Midwest / General North American',
    raceOverlayBehavior: 'Humans stay neutral; halflings make it friendly; orcs make it rougher and more direct.',
    classOverlayBehavior: 'Merchants sound plainspoken; rangers sound natural; warriors sound terse.',
    finalVoiceFeel: 'Broad, open, easygoing.',
    modelSuggestions: ['piper_en_US_neutral', 'kokoro_en_us', 'synthetic_general_american']
  },
  {
    id: 'prairie',
    folderName: 'ironstep-cant',
    category: 'Plains',
    biome: 'Prairie',
    fantasyAccentName: 'Ironstep Cant',
    baseAccentInspiration: 'Russian',
    raceOverlayBehavior: 'Dwarves deepen the accent; elves soften it; beastfolk make it more expressive and strong.',
    classOverlayBehavior: 'Warriors sound stern; scholars sound formal and heavy; bards sound dramatic.',
    finalVoiceFeel: 'Strong, wide, grounded, hardy.',
    modelSuggestions: ['piper_ru_RU', 'licensed_russian_actor_reference', 'synthetic_russian_accent_reference']
  },
  {
    id: 'farming',
    folderName: 'hearthfield-brogue',
    category: 'Plains',
    biome: 'Farming',
    fantasyAccentName: 'Hearthfield Brogue',
    baseAccentInspiration: 'Irish',
    raceOverlayBehavior: 'Halflings make it especially warm; dwarves make it earthier; elves make it lighter and lilting.',
    classOverlayBehavior: 'Farmers and artisans sound practical; clerics sound gentle; bards sound cheerful.',
    finalVoiceFeel: 'Friendly, earthy, communal, homely.',
    modelSuggestions: ['libritts_british_accents_irish_reference', 'commonaccent_irish_english', 'licensed_irish_actor_reference']
  },
  {
    id: 'mountain_range',
    folderName: 'cragthane-burr',
    category: 'Mountains',
    biome: 'Mountain Range',
    fantasyAccentName: 'Cragthane Burr',
    baseAccentInspiration: 'Scottish',
    raceOverlayBehavior: 'Dwarves fit this best and sound very natural; humans sound clean; orcs sound harsh and mountainous.',
    classOverlayBehavior: 'Warriors sound rugged; scouts sound clipped; scholars sound surprisingly sharp.',
    finalVoiceFeel: 'Tough, crisp, resilient.',
    modelSuggestions: ['libritts_british_accents_scottish_reference', 'commonaccent_scottish_english', 'licensed_scottish_actor_reference']
  },
  {
    id: 'valley',
    folderName: 'vinesong-flow',
    category: 'Mountains',
    biome: 'Valley',
    fantasyAccentName: 'Vinesong Flow',
    baseAccentInspiration: 'Italian',
    raceOverlayBehavior: 'Elves make it smooth and lyrical; halflings make it warm; beastfolk make it expressive and lively.',
    classOverlayBehavior: 'Merchants sound polished; bards sound romantic; clerics sound calm and measured.',
    finalVoiceFeel: 'Flowing, fertile, elegant, soft.',
    modelSuggestions: ['piper_it_IT', 'kokoro_it', 'licensed_italian_actor_reference']
  },
  {
    id: 'deep_cavern',
    folderName: 'stonehollow-echo',
    category: 'Mountains',
    biome: 'Deep Cavern',
    fantasyAccentName: 'Stonehollow Echo',
    baseAccentInspiration: 'Welsh',
    raceOverlayBehavior: 'Dwarves make it especially resonant; humans sound clear; orcs and dragonborn-style voices make it heavier and more guttural.',
    classOverlayBehavior: 'Mages sound ancient and formal; warriors sound short and echoing; rogues sound low and secretive.',
    finalVoiceFeel: 'Echoing, ancient, carved-from-stone.',
    modelSuggestions: ['piper_cy_GB', 'commonaccent_welsh_english', 'libritts_british_accents_welsh_reference']
  },
  {
    id: 'deep_forest',
    folderName: 'rootmere-cant',
    category: 'Forest',
    biome: 'Deep Forest',
    fantasyAccentName: 'Rootmere Cant',
    baseAccentInspiration: 'German',
    raceOverlayBehavior: 'Elves soften the hardness; beastfolk make it strong and vocal; humans keep it practical.',
    classOverlayBehavior: 'Rangers sound disciplined; scholars sound precise; warriors sound clipped and firm.',
    finalVoiceFeel: 'Dense, structured, rooted, authoritative.',
    modelSuggestions: ['piper_de_DE', 'licensed_german_actor_reference', 'synthetic_german_accent_reference']
  },
  {
    id: 'partial_forest',
    folderName: 'sundapple-tongue',
    category: 'Forest',
    biome: 'Partial Forest',
    fantasyAccentName: 'Sundapple Tongue',
    baseAccentInspiration: 'Spanish',
    raceOverlayBehavior: 'Humans sound closest to base; halflings make it warmer; elves make it smoother.',
    classOverlayBehavior: 'Merchants sound lively; bards sound expressive; scouts sound relaxed.',
    finalVoiceFeel: 'Flexible, social, sun-dappled, active.',
    modelSuggestions: ['piper_es_ES', 'kokoro_es', 'licensed_spanish_actor_reference']
  },
  {
    id: 'treetops__treehouses',
    folderName: 'highbranch-lilt',
    category: 'Forest',
    biome: 'Treetops / Treehouses',
    fantasyAccentName: 'Highbranch Lilt',
    baseAccentInspiration: 'French',
    raceOverlayBehavior: 'Elves make it especially elegant; humans sound refined; halflings make it playful.',
    classOverlayBehavior: 'Bards sound graceful; scholars sound polished; rogues sound light and quick.',
    finalVoiceFeel: 'Light, elevated, refined, airy.',
    modelSuggestions: ['piper_fr_FR', 'kokoro_fr', 'licensed_french_actor_reference']
  },
  {
    id: 'marshes_and_swamps',
    folderName: 'mirecurl-drawl',
    category: 'Forest',
    biome: 'Marshes and Swamps',
    fantasyAccentName: 'Mirecurl Drawl',
    baseAccentInspiration: 'Louisiana Cajun / Creole-influenced English',
    raceOverlayBehavior: 'Halflings make it friendly; beastfolk make it rhythmic; orcs make it rough and muddy.',
    classOverlayBehavior: 'Rangers sound local and practical; clerics sound slow and steady; rogues sound secretive.',
    finalVoiceFeel: 'Slow, earthy, wet, lived-in.',
    modelSuggestions: ['speech_accent_archive_cajun_reference', 'gmU_accent_archive_reference', 'licensed_cajun_creole_actor_reference']
  },
  {
    id: 'beach_and_grass_with_water',
    folderName: 'brightshore-flow',
    category: 'Hybrid',
    biome: 'Beach and Grass With Water',
    fantasyAccentName: 'Brightshore Flow',
    baseAccentInspiration: 'Brazilian Portuguese',
    raceOverlayBehavior: 'Humans sound natural; elves sound breezy; aquatic races make it very soft and fluid.',
    classOverlayBehavior: 'Merchants sound relaxed; bards sound sunlit and melodic; warriors sound brisk.',
    finalVoiceFeel: 'Warm, coastal, bright, casual.',
    modelSuggestions: ['piper_pt_BR', 'kokoro_pt_br', 'licensed_brazilian_portuguese_actor_reference']
  },
  {
    id: 'beach_and_reefs_with_water',
    folderName: 'wavebloom-welcome',
    category: 'Hybrid',
    biome: 'Beach and Reefs With Water',
    fantasyAccentName: 'Wavebloom Welcome',
    baseAccentInspiration: 'Hawaiian-influenced English',
    raceOverlayBehavior: 'Aquatic races make it strongest; halflings make it welcoming; dwarves make it firmer and more grounded.',
    classOverlayBehavior: 'Clerics sound peaceful; bards sound musical; scouts sound light-footed.',
    finalVoiceFeel: 'Gentle, tropical, wave-like, welcoming.',
    modelSuggestions: ['speech_accent_archive_hawaiian_reference', 'gmU_accent_archive_reference', 'licensed_hawaiian_actor_reference']
  },
  {
    id: 'hybrid_tree_and_forest_floor',
    folderName: 'bramblewood-burr',
    category: 'Hybrid',
    biome: 'Hybrid Tree and Forest Floor',
    fantasyAccentName: 'Bramblewood Burr',
    baseAccentInspiration: 'English West Country',
    raceOverlayBehavior: 'Elves smooth it out; dwarves make it rustic; beastfolk make it earthy and lively.',
    classOverlayBehavior: 'Rangers sound very natural; artisans sound local; warriors sound sturdy.',
    finalVoiceFeel: 'Rustic, layered, grounded, woodland.',
    modelSuggestions: ['speech_accent_archive_west_country_reference', 'piper_en_GB', 'licensed_west_country_actor_reference']
  },
  {
    id: 'hybrid_farming_forest_grassland',
    folderName: 'millfield-practical',
    category: 'Hybrid',
    biome: 'Hybrid Farming Forest Grassland',
    fantasyAccentName: 'Millfield Practical',
    baseAccentInspiration: 'Dutch',
    raceOverlayBehavior: 'Humans sound plain and practical; halflings make it friendly; orcs make it blunt and workmanlike.',
    classOverlayBehavior: 'Merchants sound efficient; farmers sound matter-of-fact; scholars sound neat and organized.',
    finalVoiceFeel: 'Practical, mixed, industrious, balanced.',
    modelSuggestions: ['piper_nl_NL', 'piper_nl_BE', 'commonaccent_dutch_english']
  }
];

function doGet(e) {
  try {
    const request = parseRequest_(e, 'GET');
    const action = String(request.action || '').trim();

    if (!action || action === 'launcher' || action === 'app') {
      return launcherHtml_(request);
    }

    if (action === 'manifest' || action === 'manifest.webmanifest') {
      return manifestOutput_(request);
    }

    if (action === 'icon' || action === 'icon.svg') {
      return iconOutput_(request);
    }

    return routeRequest_(e, 'GET');
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err && err.message ? err.message : err),
      stack: String(err && err.stack ? err.stack : '')
    });
  }
}

function doPost(e) {
  return routeRequest_(e, 'POST');
}

/*
 * Apps Script web apps cannot reliably answer browser CORS preflight
 * the way a normal server can. Use simple requests from the frontend:
 * fetch(url, { method:'POST', body:new URLSearchParams({...}) })
 */
function doOptions(e) {
  return jsonResponse_({ ok: true, note: 'Use simple POST requests without custom headers.' });
}


function routeRequest_(e, method) {
  try {
    const request = parseRequest_(e, method);
    const action = request.action || 'health';

    if (!isAuthorized_(request)) {
      return jsonResponse_({
        ok: false,
        error: 'Unauthorized backend request. Missing or invalid apiKey.'
      }, request.callback);
    }

    let result;

    switch (action) {
      case 'health':
      case 'ping':
        result = getHealth_();
        break;

      case 'setup':
        result = setup_();
        break;

      case 'clientConfig':
        result = clientConfig_(request);
        break;

      case 'saveSharedState':
        result = saveSharedState_(request);
        break;

      case 'loadSharedState':
        result = loadSharedState_(request);
        break;

      case 'saveCharacter':
        result = saveCharacter_(request);
        break;

      case 'loadCharacter':
        result = loadCharacter_(request);
        break;

      case 'listCharacters':
        result = listCharacters_(request);
        break;

      case 'deleteCharacter':
        result = deleteCharacter_(request);
        break;

      case 'logEvent':
        result = logEvent_(request);
        break;

      case 'exportAllData':
        result = exportAllData_(request);
        break;

      case 'sliders.schema':
        result = {
          ok: true,
          schema: VOICE_SLIDER_SCHEMA,
          defaultVoiceProfile: getDefaultVoiceProfile_()
        };
        break;

      case 'catalog.biomes':
        result = {
          ok: true,
          count: BIOME_CATALOG.length,
          biomes: BIOME_CATALOG
        };
        break;

      case 'catalog.biome.get':
        result = getBiome_(request.biomeId);
        break;

      case 'catalog.crossovers':
        result = getCrossovers_(request);
        break;

      case 'catalog.crossover.get':
        result = getCrossoverById_(request.crossoverId);
        break;

      case 'catalog.folderAudit':
        result = getFolderAudit_();
        break;

      case 'voice.profile.default':
        result = {
          ok: true,
          voiceProfile: getDefaultVoiceProfile_()
        };
        break;

      case 'voice.mix.previewPayload':
        result = buildPreviewPayload_(request);
        break;

      case 'voice.jobs.create':
        result = createVoiceJob_(request);
        break;

      case 'voice.jobs.get':
        result = getVoiceJob_(request.jobId);
        break;

      case 'voice.jobs.update':
        requireAdmin_(request);
        result = updateVoiceJob_(request);
        break;

      case 'presets.save':
        result = savePreset_(request);
        break;

      case 'presets.list':
        result = listPresets_(request);
        break;

      case 'presets.get':
        result = getPreset_(request.presetId);
        break;

      case 'presets.delete':
        result = deletePreset_(request.presetId);
        break;

      case 'assets.register':
        result = registerAsset_(request);
        break;

      case 'assets.list':
        result = listAssets_(request);
        break;

      case 'assets.validate':
        result = validateAssetAction_(request);
        break;

      case 'media.active.set':
        result = setActiveClip_(request);
        break;

      case 'media.active.get':
        result = getActiveClip_();
        break;

      case 'media.active.clear':
        result = clearActiveClip_(request);
        break;


      case 'audio.formats':
        result = getAudioFormatCatalog_();
        break;

      case 'audio.export.save':
        result = saveAudioExport_(request);
        break;

      case 'audio.export.saveJson':
      case 'json.export.save':
        result = saveJsonExport_(request);
        break;

      case 'audio.export.get':
      case 'json.export.get':
        result = getAudioExport_(request.exportId || request.fileId);
        break;

      case 'audio.export.list':
      case 'json.export.list':
        result = listAudioExports_(request);
        break;

      case 'audio.export.delete':
      case 'json.export.delete':
        result = deleteAudioExport_(request);
        break;

      case 'voice.runtime.schema':
        result = getVoiceRuntimeSchema_();
        break;

      case 'voice.render.create':
        result = createVoiceRenderJob_(request);
        break;

      case 'voice.render.get':
        result = getVoiceRenderJob_(request.renderJobId || request.jobId);
        break;

      case 'voice.render.update':
        requireAdmin_(request);
        result = updateVoiceRenderJob_(request);
        break;

      case 'voice.singing.create':
        result = createSingingVoiceJob_(request);
        break;

      case 'voice.acapella.create':
        result = createAcapellaVoiceJob_(request);
        break;

      case 'voice.mood.generate':
        result = generateMoodVoice_(request);
        break;

      case 'voice.synth.patch':
      case 'voice.synth.previewPayload':
        result = buildSynthPatchPayload_(request);
        break;

      case 'voice.synth.renderWav':
        result = renderSynthGuideWav_(request);
        break;

      case 'export.all':
        result = exportAll_();
        break;


      /******** Voice Studio Superbot compatibility routes ********/
      case 'chats.create':
      case 'conversations.create':
        result = voiceStudioSuperbotChatCreate_(request);
        break;

      case 'chats.list':
      case 'conversations.list':
        result = voiceStudioSuperbotChatList_(request);
        break;

      case 'chats.messages':
      case 'messages.list':
        result = voiceStudioSuperbotChatMessages_(request);
        break;

      case 'chats.send':
      case 'messages.send':
        result = voiceStudioSuperbotChatSend_(request);
        break;

      case 'learning.record':
      case 'bot.learn':
        result = voiceStudioSuperbotLearningRecord_(request);
        break;

      case 'learning.search':
      case 'bot.memories':
        result = voiceStudioSuperbotLearningSearch_(request);
        break;

      case 'tasks.fromText':
      case 'task.fromText':
        result = voiceStudioSuperbotTasksFromText_(request);
        break;

      case 'tasks.list':
      case 'task.list':
        result = voiceStudioSuperbotTasksList_(request);
        break;

      case 'file.indexText':
      case 'files.indexText':
        result = voiceStudioSuperbotFileIndexText_(request);
        break;

      case 'files.search':
      case 'github.searchIndex':
        result = voiceStudioSuperbotSearch_(request);
        break;

      case 'project.coverage':
        result = voiceStudioSuperbotCoverage_(request);
        break;

      case 'voice.simulate':
      case 'voice.create':
      case 'voice.preview':
        result = voiceStudioSuperbotVoiceSimulate_(request);
        break;

      case 'voice.job.create':
      case 'voice.jobs.create.superbot':
        result = voiceStudioSuperbotVoiceJobCreate_(request);
        break;

      case 'source.auditManifest':
      case 'source.convertedFeatures':
        result = voiceStudioSuperbotConvertedFeatures_(request);
        break;

      case 'admin.resetStorage':
        requireAdmin_(request);
        result = resetStorage_();
        break;

      default:
        result = fail_('Unknown action: ' + action, 404);
    }

    return jsonResponse_(result, request.callback);
  } catch (err) {
    return jsonResponse_({
      ok: false,
      error: String(err && err.message ? err.message : err),
      stack: String(err && err.stack ? err.stack : '')
    });
  }
}

function parseRequest_(e, method) {
  const params = Object.assign({}, e && e.parameter ? e.parameter : {});
  let body = {};

  if (method === 'POST' && e && e.postData && e.postData.contents) {
    const contentType = String(e.postData.type || '').toLowerCase();
    const raw = e.postData.contents;

    if (contentType.indexOf('application/json') !== -1) {
      body = JSON.parse(raw || '{}');
    } else {
      body = parseFormEncoded_(raw);
    }
  }

  return Object.assign({}, params, body, {
    method: method,
    receivedAt: new Date().toISOString()
  });
}

function parseFormEncoded_(raw) {
  const out = {};
  String(raw || '').split('&').forEach(pair => {
    if (!pair) return;
    const parts = pair.split('=');
    const key = decodeURIComponent(parts[0] || '');
    const value = decodeURIComponent((parts.slice(1).join('=') || '').replace(/\+/g, ' '));
    if (!key) return;

    try {
      out[key] = JSON.parse(value);
    } catch (err) {
      out[key] = value;
    }
  });
  return out;
}

function jsonResponse_(obj, callback) {
  const text = callback
    ? String(callback) + '(' + JSON.stringify(obj) + ');'
    : JSON.stringify(obj, null, 2);

  return ContentService
    .createTextOutput(text)
    .setMimeType(callback ? ContentService.MimeType.JAVASCRIPT : ContentService.MimeType.JSON);
}

function getHealth_() {
  return {
    ok: true,
    app: APP_VERSION,
    now: new Date().toISOString(),
    biomeCount: BIOME_CATALOG.length,
    crossoverCount: calculateCombinationCount_(BIOME_CATALOG.length, MAX_CACHE_BIOMES),
    maxCacheBiomes: MAX_CACHE_BIOMES,
    safety: {
      allowedAssetPermissionTypes: ALLOWED_ASSET_PERMISSION_TYPES,
      blocksUnknownAssetsByDefault: true
    }
  };
}

function getDefaultVoiceProfile_() {
  const profile = {};
  VOICE_SLIDER_SCHEMA.forEach(item => {
    profile[item.key] = item.default;
  });
  return profile;
}

function sanitizeVoiceProfile_(profile) {
  const clean = getDefaultVoiceProfile_();
  const input = profile || {};

  VOICE_SLIDER_SCHEMA.forEach(item => {
    if (input[item.key] === undefined || input[item.key] === null || input[item.key] === '') return;
    clean[item.key] = clamp_(Number(input[item.key]), item.min, item.max);
  });

  return clean;
}

function getBiome_(biomeId) {
  const biome = findBiome_(biomeId);
  if (!biome) return fail_('Biome not found: ' + biomeId, 404);

  return {
    ok: true,
    biome: addAccentManifestDefaults_(biome)
  };
}

function findBiome_(biomeIdOrFolder) {
  const key = String(biomeIdOrFolder || '').trim();
  return BIOME_CATALOG.find(b =>
    b.id === key ||
    b.folderName === key ||
    slug_(b.fantasyAccentName) === key ||
    b.fantasyAccentName === key ||
    b.biome === key
  ) || null;
}

function addAccentManifestDefaults_(biome) {
  return Object.assign({}, biome, {
    manifestVersion: 'belavados.accent.manifest.v2',
    canonicalFolder: 'voice-models/main-accents/' + biome.folderName,
    baseRule: 'All typed text is spoken in English while preserving the accent inspiration and fantasy voice behavior.',
    defaultLayer: {
      enabled: true,
      intensityPercent: 100,
      normalizedWeight: 1
    },
    safety: {
      allowedAssetPermissionTypes: ALLOWED_ASSET_PERMISSION_TYPES,
      unknownAssetsBlocked: true
    }
  });
}

function getCrossovers_(request) {
  const all = generateCrossoverCatalog_();
  const limit = clamp_(Number(request.limit || 100), 1, 680);
  const offset = clamp_(Number(request.offset || 0), 0, all.length);
  const category = request.category ? String(request.category) : '';
  const biomeId = request.biomeId ? String(request.biomeId) : '';

  let filtered = all;

  if (category) {
    filtered = filtered.filter(c => c.categories.indexOf(category) !== -1);
  }

  if (biomeId) {
    filtered = filtered.filter(c => c.biomeIds.indexOf(biomeId) !== -1);
  }

  return {
    ok: true,
    total: filtered.length,
    offset: offset,
    limit: limit,
    crossovers: filtered.slice(offset, offset + limit)
  };
}

function getCrossoverById_(crossoverId) {
  const found = generateCrossoverCatalog_().find(c => c.id === crossoverId || c.folderName === crossoverId);
  if (!found) return fail_('Crossover not found: ' + crossoverId, 404);

  return {
    ok: true,
    crossover: found
  };
}

function generateCrossoverCatalog_() {
  const combos = [];
  let n = 1;

  for (let i = 0; i < BIOME_CATALOG.length; i++) {
    for (let j = i + 1; j < BIOME_CATALOG.length; j++) {
      for (let k = j + 1; k < BIOME_CATALOG.length; k++) {
        const parts = [BIOME_CATALOG[i], BIOME_CATALOG[j], BIOME_CATALOG[k]];
        const id = 'biome_cache_combo_' + String(n).padStart(3, '0');
        const folderName = parts.map(p => p.folderName).join('__');

        combos.push({
          manifestVersion: 'belavados.crossover.manifest.v2',
          id: id,
          folderName: folderName,
          canonicalFolder: 'voice-models/biome-crossovers/' + folderName,
          biomeIds: parts.map(p => p.id),
          biomes: parts.map(p => p.biome),
          categories: parts.map(p => p.category),
          fantasyAccentNames: parts.map(p => p.fantasyAccentName),
          accentBlendName: parts.map(p => p.fantasyAccentName).join(' + '),
          accentInspirations: parts.map(p => p.baseAccentInspiration),
          voiceFeelBlend: parts.map(p => p.finalVoiceFeel).join(' + '),
          diversityType: calculateDiversityType_(parts),
          categoryCounts: countBy_(parts.map(p => p.category)),
          components: parts.map(addAccentManifestDefaults_),
          weightedLayers: makeDefaultWeightedLayers_(parts),
          rule: 'Crossover folders contain lightweight manifests only. They point back to canonical main accent folders and do not duplicate model binaries.'
        });

        n++;
      }
    }
  }

  return combos;
}

function makeDefaultWeightedLayers_(biomes) {
  const each = 100 / biomes.length;

  return biomes.map(b => ({
    biomeId: b.id,
    fantasyAccentName: b.fantasyAccentName,
    baseAccentInspiration: b.baseAccentInspiration,
    canonicalAccentFolder: 'voice-models/main-accents/' + b.folderName,
    enabled: true,
    intensityPercent: round_(each, 4),
    normalizedWeight: round_(1 / biomes.length, 6),
    modelSuggestions: b.modelSuggestions || []
  }));
}

function calculateDiversityType_(parts) {
  const counts = countBy_(parts.map(p => p.category));
  return Object.keys(counts).length === 1 ? 'single_category' : 'mixed_category';
}

function countBy_(arr) {
  const out = {};
  arr.forEach(x => out[x] = (out[x] || 0) + 1);
  return out;
}

function getFolderAudit_() {
  return {
    ok: true,
    strategy: 'One folder per main accent plus one lightweight manifest folder per 3-biome crossover. Model files are never duplicated into crossover folders.',
    directMainAccentFolders: BIOME_CATALOG.length,
    directCrossoverFolders: calculateCombinationCount_(BIOME_CATALOG.length, MAX_CACHE_BIOMES),
    approximateMaxFilesPerMainAccentFolder: 'Keep under 1000. Store model variants as references/manifests where possible.',
    approximateFilesPerCrossoverFolder: 1,
    generatedCrossoverCount: calculateCombinationCount_(BIOME_CATALOG.length, MAX_CACHE_BIOMES),
    formula: 'C(17,3)=680',
    githubLimitPlan: {
      mainAccentFolders: 'voice-models/main-accents/{fantasy-accent-name}/manifest.json',
      crossoverFolders: 'voice-models/biome-crossovers/{accent-a}__{accent-b}__{accent-c}/manifest.json',
      docs: 'docs/',
      data: 'data/',
      backendAdapters: 'backend-adapters/'
    }
  };
}

function buildPreviewPayload_(request) {
  const text = sanitizeText_(request.text || request.phrase || '');
  const voiceProfile = sanitizeVoiceProfile_(request.voiceProfile || request.sliders || {});
  const context = sanitizeCharacterContext_(request.characterContext || request.context || {});
  const layers = resolveAndNormalizeLayers_(request);

  return {
    ok: true,
    mode: 'previewPayload',
    payload: {
      text: text,
      languageOutput: 'en',
      forceEnglishOutput: true,
      voiceProfile: voiceProfile,
      internalParameters: deriveInternalParameters_(voiceProfile),
      characterContext: context,
      layers: layers.layers,
      enabledLayers: layers.enabledLayers,
      disabledLayers: layers.disabledLayers,
      normalizedWeightSum: layers.normalizedWeightSum,
      safety: buildSafetyBlock_(request),
      pipeline: [
        'MP3 decode or text input',
        'feature analysis',
        'base voice parameters',
        'accent rules',
        'emotion rules',
        'personality rules',
        'stutter / hesitation rules',
        'synth or convert',
        'output waveform'
      ]
    }
  };
}

function createVoiceJob_(request) {
  const payloadResult = buildPreviewPayload_(request);
  if (!payloadResult.ok) return payloadResult;

  const payload = payloadResult.payload;
  validateAssetReferences_(request);

  const jobId = 'job_' + Utilities.getUuid();
  const now = new Date().toISOString();

  const job = {
    id: jobId,
    createdAt: now,
    updatedAt: now,
    status: 'queued',
    engine: getEngineInfo_(),
    payload: payload,
    result: null,
    error: null
  };

  saveRecord_('JOB_', STORE_KEYS.JOBS_INDEX, jobId, job);

  const engineUrl = getScriptProperty_('TTS_ENGINE_URL');
  if (engineUrl) {
    const forwarded = forwardToExternalEngine_(engineUrl, job);
    job.updatedAt = new Date().toISOString();
    job.status = forwarded.ok ? 'forwarded' : 'queued_external_failed';
    job.forwardResult = forwarded;
    saveRecord_('JOB_', STORE_KEYS.JOBS_INDEX, jobId, job);
  }

  return {
    ok: true,
    jobId: jobId,
    job: job,
    note: engineUrl
      ? 'Job was validated and forwarded to external voice engine.'
      : 'Job was validated and stored. Add TTS_ENGINE_URL Script Property to forward synthesis requests.'
  };
}

function getVoiceJob_(jobId) {
  const job = getRecord_('JOB_', jobId);
  if (!job) return fail_('Job not found: ' + jobId, 404);

  return {
    ok: true,
    job: job
  };
}

function updateVoiceJob_(request) {
  const job = getRecord_('JOB_', request.jobId);
  if (!job) return fail_('Job not found: ' + request.jobId, 404);

  if (request.status) job.status = String(request.status);
  if (request.result !== undefined) job.result = request.result;
  if (request.error !== undefined) job.error = request.error;
  job.updatedAt = new Date().toISOString();

  saveRecord_('JOB_', STORE_KEYS.JOBS_INDEX, job.id, job);

  return {
    ok: true,
    job: job
  };
}

function resolveAndNormalizeLayers_(request) {
  let rawLayers = request.layers || request.weightedLayers || null;

  if (!rawLayers && request.crossoverId) {
    const crossover = generateCrossoverCatalog_().find(c => c.id === request.crossoverId || c.folderName === request.crossoverId);
    if (!crossover) throw new Error('Crossover not found: ' + request.crossoverId);
    rawLayers = crossover.weightedLayers;
  }

  if (!rawLayers && request.biomeIds) {
    const biomeIds = Array.isArray(request.biomeIds) ? request.biomeIds : String(request.biomeIds).split(',');
    const biomes = biomeIds.map(id => findBiome_(String(id).trim())).filter(Boolean);
    if (biomes.length === 0) throw new Error('No valid biomes found in biomeIds.');
    rawLayers = makeDefaultWeightedLayers_(biomes.slice(0, MAX_CACHE_BIOMES));
  }

  if (!rawLayers) {
    const defaultBiome = BIOME_CATALOG[0];
    rawLayers = makeDefaultWeightedLayers_([defaultBiome]);
  }

  if (!Array.isArray(rawLayers)) {
    throw new Error('Layers must be an array.');
  }

  const layers = rawLayers.map(layer => {
    const biome = findBiome_(layer.biomeId || layer.id || layer.folderName || layer.fantasyAccentName);
    if (!biome) throw new Error('Unknown biome layer: ' + JSON.stringify(layer));

    const enabled = layer.enabled !== false;
    const intensityPercent = clamp_(Number(layer.intensityPercent !== undefined ? layer.intensityPercent : 100), 0, 100);

    return {
      biomeId: biome.id,
      fantasyAccentName: biome.fantasyAccentName,
      baseAccentInspiration: biome.baseAccentInspiration,
      canonicalAccentFolder: 'voice-models/main-accents/' + biome.folderName,
      enabled: enabled,
      intensityPercent: intensityPercent,
      normalizedWeight: 0,
      modelId: layer.modelId || first_(biome.modelSuggestions) || null,
      modelSuggestions: biome.modelSuggestions || []
    };
  });

  const enabledLayers = layers.filter(l => l.enabled && l.intensityPercent > 0);
  const disabledLayers = layers.filter(l => !l.enabled || l.intensityPercent <= 0);
  const sum = enabledLayers.reduce((acc, l) => acc + l.intensityPercent, 0);

  if (sum <= 0) {
    throw new Error('At least one voice layer must be enabled with intensity above 0%.');
  }

  layers.forEach(l => {
    l.normalizedWeight = (l.enabled && l.intensityPercent > 0)
      ? round_(l.intensityPercent / sum, 6)
      : 0;
  });

  return {
    layers: layers,
    enabledLayers: layers.filter(l => l.normalizedWeight > 0),
    disabledLayers: disabledLayers,
    normalizedWeightSum: round_(layers.reduce((acc, l) => acc + l.normalizedWeight, 0), 6)
  };
}

function deriveInternalParameters_(profile) {
  return {
    f0: mapRange_(profile.pitch, 0, 10, -12, 12),
    pitchRange: mapRange_(profile.inflection, 0, 10, 0.6, 1.8),
    speechRate: mapRange_(profile.speed, 0, 10, 0.65, 1.55),
    pauseDensity: mapRange_(profile.pauseControl, 0, 10, 0.35, 1.65),
    breathNoiseMix: mapRange_(profile.breath, 0, 10, 0, 0.35),
    roughnessAmount: mapRange_(profile.roughness, 0, 10, 0, 0.5),
    formantShift: mapRange_(profile.resonance, 0, 10, -0.18, 0.18),
    articulationPrecision: mapRange_(profile.clarity, 0, 10, 0.35, 1),
    vowelStretch: mapRange_(profile.vowelFlow, 0, 10, 0.75, 1.35),
    consonantSharpness: mapRange_(profile.consonantBite, 0, 10, 0.5, 1.5),
    mouthOpenness: mapRange_(profile.mouthShape, 0, 10, 0.7, 1.3),
    nasality: mapRange_(profile.nasality, 0, 10, 0, 1),
    throatPlacement: mapRange_(profile.throatDepth, 0, 10, -1, 1),
    rhythmicBounce: mapRange_(profile.rhythm, 0, 10, 0.5, 1.5),
    emphasisStrength: mapRange_(profile.emphasis, 0, 10, 0.5, 1.5),
    warmth: mapRange_(profile.warmth, 0, 10, 0, 1),
    projection: mapRange_(profile.projection, 0, 10, 0.35, 1),
    humanVariation: mapRange_(profile.humanVariation, 0, 10, 0, 1),
    accentStrength: profile.accentColor / 10,
    influenceRace: profile.influenceRace,
    influenceGender: profile.influenceGender,
    influencePersonality: profile.influencePersonality,
    influenceBiome: profile.influenceBiome,
    influenceBaseAudio: profile.influenceBaseAudio,
    emotionIntensity: profile.emotionIntensity
  };
}

function sanitizeCharacterContext_(context) {
  return {
    characterName: safeSmall_(context.characterName || ''),
    race: safeSmall_(context.race || ''),
    ancestry: safeSmall_(context.ancestry || ''),
    genderIdentity: safeSmall_(context.genderIdentity || ''),
    pronouns: safeSmall_(context.pronouns || ''),
    className: safeSmall_(context.className || context.class || ''),
    subclass: safeSmall_(context.subclass || ''),
    personality: safeSmall_(context.personality || ''),
    emotion: safeSmall_(context.emotion || ''),
    notes: safeTextOptional_(context.notes || '')
  };
}

function sanitizeText_(text) {
  const clean = String(text || '').trim();
  if (!clean) throw new Error('Text is required.');
  if (clean.length > MAX_TEXT_CHARS) throw new Error('Text is too long. Max characters: ' + MAX_TEXT_CHARS);
  return clean;
}

function safeSmall_(value) {
  return String(value || '').trim().slice(0, 160);
}

function safeTextOptional_(value) {
  return String(value || '').trim().slice(0, 2000);
}

function buildSafetyBlock_(request) {
  return {
    allowedAssetPermissionTypes: ALLOWED_ASSET_PERMISSION_TYPES,
    unknownAssetsBlocked: true,
    declaredAssetPermission: request.assetPermissionType || null,
    baseAudioAssetId: request.baseAudioAssetId || null,
    requiresEnglishOutput: true,
    policy: 'Only use own_voice, licensed_actor, public_domain_character_asset, or synthetic_original assets. Unknown assets are blocked by default.'
  };
}

function validateAssetReferences_(request) {
  if (!request.baseAudioAssetId) return true;

  const asset = getRecord_('ASSET_', request.baseAudioAssetId);
  if (!asset) {
    throw new Error('Base audio asset is not registered or allowed: ' + request.baseAudioAssetId);
  }

  if (ALLOWED_ASSET_PERMISSION_TYPES.indexOf(asset.permissionType) === -1) {
    throw new Error('Blocked asset permission type: ' + asset.permissionType);
  }

  return true;
}

function registerAsset_(request) {
  const permissionType = String(request.permissionType || '').trim();

  if (ALLOWED_ASSET_PERMISSION_TYPES.indexOf(permissionType) === -1) {
    return fail_('Permission type blocked. Allowed: ' + ALLOWED_ASSET_PERMISSION_TYPES.join(', '), 403);
  }

  const assetId = request.assetId || 'asset_' + Utilities.getUuid();
  const now = new Date().toISOString();

  const asset = {
    id: assetId,
    createdAt: now,
    updatedAt: now,
    name: safeSmall_(request.name || assetId),
    permissionType: permissionType,
    ownerLabel: safeSmall_(request.ownerLabel || ''),
    sourceUrl: safeTextOptional_(request.sourceUrl || ''),
    notes: safeTextOptional_(request.notes || ''),
    allowed: true
  };

  saveRecord_('ASSET_', STORE_KEYS.ASSETS_INDEX, assetId, asset);

  return {
    ok: true,
    asset: asset
  };
}

function listAssets_(request) {
  const ids = getIndex_(STORE_KEYS.ASSETS_INDEX);
  const assets = ids.map(id => getRecord_('ASSET_', id)).filter(Boolean);

  return {
    ok: true,
    count: assets.length,
    assets: assets
  };
}

function validateAssetAction_(request) {
  try {
    validateAssetReferences_(request);
    return { ok: true, allowed: true };
  } catch (err) {
    return {
      ok: false,
      allowed: false,
      error: String(err.message || err)
    };
  }
}

function savePreset_(request) {
  const name = safeSmall_(request.name || 'Untitled Voice Preset');
  const presetId = request.presetId || 'preset_' + Utilities.getUuid();
  const now = new Date().toISOString();

  const payloadResult = buildPreviewPayload_(request);
  if (!payloadResult.ok) return payloadResult;

  const existing = getRecord_('PRESET_', presetId);
  const preset = {
    id: presetId,
    createdAt: existing && existing.createdAt ? existing.createdAt : now,
    updatedAt: now,
    name: name,
    tags: Array.isArray(request.tags) ? request.tags.map(safeSmall_) : [],
    payload: payloadResult.payload
  };

  saveRecord_('PRESET_', STORE_KEYS.PRESETS_INDEX, presetId, preset);

  return {
    ok: true,
    preset: preset
  };
}

function listPresets_(request) {
  const ids = getIndex_(STORE_KEYS.PRESETS_INDEX);
  const presets = ids.map(id => getRecord_('PRESET_', id)).filter(Boolean);

  return {
    ok: true,
    count: presets.length,
    presets: presets.map(p => ({
      id: p.id,
      name: p.name,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      tags: p.tags || [],
      accentBlendName: p.payload && p.payload.enabledLayers
        ? p.payload.enabledLayers.map(l => l.fantasyAccentName).join(' + ')
        : ''
    }))
  };
}

function getPreset_(presetId) {
  const preset = getRecord_('PRESET_', presetId);
  if (!preset) return fail_('Preset not found: ' + presetId, 404);

  return {
    ok: true,
    preset: preset
  };
}

function deletePreset_(presetId) {
  if (!presetId) return fail_('presetId is required.', 400);

  const props = PropertiesService.getScriptProperties();
  props.deleteProperty('PRESET_' + presetId);
  removeFromIndex_(STORE_KEYS.PRESETS_INDEX, presetId);

  return {
    ok: true,
    deleted: presetId
  };
}

function setActiveClip_(request) {
  const clip = {
    id: request.clipId || 'clip_' + Utilities.getUuid(),
    type: safeSmall_(request.type || 'speech'),
    label: safeSmall_(request.label || ''),
    startedAt: new Date().toISOString(),
    clientId: safeSmall_(request.clientId || ''),
    note: 'Frontend should pause/stop all other media when this changes.'
  };

  PropertiesService.getScriptProperties().setProperty(STORE_KEYS.ACTIVE_CLIP, JSON.stringify(clip));

  return {
    ok: true,
    activeClip: clip,
    transportContract: {
      oneActiveClipOnly: true,
      controls: ['play', 'pause', 'stop', 'rewind_5_seconds', 'forward_5_seconds']
    }
  };
}

function getActiveClip_() {
  const raw = PropertiesService.getScriptProperties().getProperty(STORE_KEYS.ACTIVE_CLIP);
  return {
    ok: true,
    activeClip: raw ? JSON.parse(raw) : null
  };
}

function clearActiveClip_(request) {
  const current = getActiveClip_().activeClip;

  if (!request.clipId || !current || current.id === request.clipId) {
    PropertiesService.getScriptProperties().deleteProperty(STORE_KEYS.ACTIVE_CLIP);
    return { ok: true, cleared: true };
  }

  return {
    ok: true,
    cleared: false,
    reason: 'clipId did not match current active clip.',
    activeClip: current
  };
}

function forwardToExternalEngine_(engineUrl, job) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    const key = getScriptProperty_('TTS_ENGINE_KEY');
    if (key) headers.Authorization = 'Bearer ' + key;

    const response = UrlFetchApp.fetch(engineUrl, {
      method: 'post',
      muteHttpExceptions: true,
      contentType: 'application/json',
      headers: headers,
      payload: JSON.stringify({
        app: APP_VERSION,
        job: job
      })
    });

    const code = response.getResponseCode();
    const text = response.getContentText();

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      parsed = { raw: text };
    }

    return {
      ok: code >= 200 && code < 300,
      statusCode: code,
      response: parsed
    };
  } catch (err) {
    return {
      ok: false,
      error: String(err.message || err)
    };
  }
}

function getEngineInfo_() {
  return {
    appsScriptBackend: true,
    externalEngineConfigured: Boolean(getScriptProperty_('TTS_ENGINE_URL')),
    expectedExternalEngineContract: {
      input: 'job.payload',
      output: {
        jobId: 'string',
        status: 'queued | processing | complete | failed',
        audioUrl: 'optional URL',
        waveformMetadata: 'optional object',
        logs: 'optional array'
      }
    }
  };
}

function exportAll_() {
  return {
    ok: true,
    app: APP_VERSION,
    health: getHealth_(),
    sliderSchema: VOICE_SLIDER_SCHEMA,
    defaultVoiceProfile: getDefaultVoiceProfile_(),
    biomes: BIOME_CATALOG.map(addAccentManifestDefaults_),
    crossoverCount: calculateCombinationCount_(BIOME_CATALOG.length, MAX_CACHE_BIOMES),
    folderAudit: getFolderAudit_(),
    safety: {
      allowedAssetPermissionTypes: ALLOWED_ASSET_PERMISSION_TYPES,
      unknownAssetsBlocked: true
    }
  };
}

function resetStorage_() {
  const props = PropertiesService.getScriptProperties();
  const keys = props.getKeys();

  keys.forEach(k => {
    if (
      k.indexOf('PRESET_') === 0 ||
      k.indexOf('ASSET_') === 0 ||
      k.indexOf('JOB_') === 0 ||
      k === STORE_KEYS.PRESETS_INDEX ||
      k === STORE_KEYS.ASSETS_INDEX ||
      k === STORE_KEYS.JOBS_INDEX ||
      k === STORE_KEYS.ACTIVE_CLIP
    ) {
      props.deleteProperty(k);
    }
  });

  return {
    ok: true,
    reset: true
  };
}

function saveRecord_(prefix, indexKey, id, obj) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const props = PropertiesService.getScriptProperties();
    props.setProperty(prefix + id, JSON.stringify(obj));
    addToIndex_(indexKey, id);
  } finally {
    lock.releaseLock();
  }
}

function getRecord_(prefix, id) {
  if (!id) return null;
  const raw = PropertiesService.getScriptProperties().getProperty(prefix + id);
  return raw ? JSON.parse(raw) : null;
}

function getIndex_(indexKey) {
  const raw = PropertiesService.getScriptProperties().getProperty(indexKey);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (err) {
    return [];
  }
}

function addToIndex_(indexKey, id) {
  const props = PropertiesService.getScriptProperties();
  const arr = getIndex_(indexKey);
  if (arr.indexOf(id) === -1) arr.push(id);
  props.setProperty(indexKey, JSON.stringify(arr));
}

function removeFromIndex_(indexKey, id) {
  const props = PropertiesService.getScriptProperties();
  const arr = getIndex_(indexKey).filter(x => x !== id);
  props.setProperty(indexKey, JSON.stringify(arr));
}

function requireAdmin_(request) {
  const configured = getScriptProperty_('ADMIN_KEY');

  if (!configured) {
    throw new Error('ADMIN_KEY is not configured in Script Properties.');
  }

  if (String(request.adminKey || '') !== configured) {
    throw new Error('Invalid adminKey.');
  }

  return true;
}

function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

function calculateCombinationCount_(n, r) {
  if (r > n) return 0;
  let top = 1;
  let bottom = 1;

  for (let i = 0; i < r; i++) {
    top *= (n - i);
    bottom *= (i + 1);
  }

  return Math.round(top / bottom);
}

function mapRange_(value, inMin, inMax, outMin, outMax) {
  const v = clamp_(Number(value), inMin, inMax);
  return round_(outMin + ((v - inMin) * (outMax - outMin)) / (inMax - inMin), 6);
}

function clamp_(value, min, max) {
  if (isNaN(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function round_(value, places) {
  const m = Math.pow(10, places || 2);
  return Math.round(Number(value) * m) / m;
}

function first_(arr) {
  return Array.isArray(arr) && arr.length ? arr[0] : null;
}

function slug_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function fail_(message, statusCode) {
  return {
    ok: false,
    statusCode: statusCode || 400,
    error: message
  };
}



/***************************************************************
 * NON-VOICE CHARACTER STUDIO APP / DRIVE STORAGE MERGE
 ***************************************************************/
function setup_() {
  const folders = getFolders_();

  const props = PropertiesService.getScriptProperties();
  if (!props.getProperty('BELAVADOS_INSTALLED_AT')) {
    props.setProperty('BELAVADOS_INSTALLED_AT', new Date().toISOString());
  }

  const setupInfo = {
    ok: true,
    app: BELAVADOS_CHARACTER_STUDIO.APP_NAME,
    version: BELAVADOS_CHARACTER_STUDIO.VERSION,
    installedAt: props.getProperty('BELAVADOS_INSTALLED_AT'),
    rootFolderId: folders.root.getId(),
    rootFolderUrl: folders.root.getUrl(),
    dataFolderId: folders.data.getId(),
    characterFolderId: folders.characters.getId(),
    sharedStateFolderId: folders.sharedState.getId(),
    logFolderId: folders.logs.getId(),
    voiceCodeSource: 'Updated Character Studio voice pipeline in this file; old const-backend voice code was not merged.',
    nextStep: 'Deploy this as a Web App, then paste the Web app URL and Deployment ID into the frontend/backend config.'
  };

  upsertJsonFile_(folders.data, 'backend_setup.json', setupInfo);
  return setupInfo;
}

function clientConfig_(params) {
  const serviceUrl = ScriptApp.getService().getUrl() || '';

  return {
    ok: true,
    appName: BELAVADOS_CHARACTER_STUDIO.APP_NAME,
    shortName: BELAVADOS_CHARACTER_STUDIO.SHORT_NAME,
    version: BELAVADOS_CHARACTER_STUDIO.VERSION,
    backendUrl: serviceUrl,
    frontendUrl: BELAVADOS_CHARACTER_STUDIO.FRONTEND_URL || '',
    themeColor: BELAVADOS_CHARACTER_STUDIO.THEME_COLOR,
    backgroundColor: BELAVADOS_CHARACTER_STUDIO.BACKGROUND_COLOR,
    pwa: {
      launcherUrl: serviceUrl ? serviceUrl + '?action=launcher' : '',
      manifestUrl: serviceUrl ? serviceUrl + '?action=manifest' : '',
      icon192: serviceUrl ? serviceUrl + '?action=icon&size=192' : '',
      icon512: serviceUrl ? serviceUrl + '?action=icon&size=512' : ''
    },
    simpleFetchExample: {
      method: 'POST',
      body: 'new URLSearchParams({ action: "saveSharedState", profileId: "default", payload: JSON.stringify(data) })'
    }
  };
}

function saveSharedState_(params) {
  const folders = getFolders_();
  const profileId = safeId_(params.profileId || 'default');
  const payload = parsePayload_(params.payload, {});

  const record = {
    type: 'shared-state',
    profileId: profileId,
    updatedAt: new Date().toISOString(),
    payload: payload
  };

  return withLock_(function () {
    upsertJsonFile_(folders.sharedState, profileId + '.json', record);
    return {
      ok: true,
      saved: true,
      profileId: profileId,
      updatedAt: record.updatedAt,
      payload: payload
    };
  });
}

function loadSharedState_(params) {
  const folders = getFolders_();
  const profileId = safeId_(params.profileId || 'default');
  const record = readJsonFile_(folders.sharedState, profileId + '.json');

  return {
    ok: true,
    found: !!record,
    profileId: profileId,
    record: record || null,
    payload: record && record.payload ? record.payload : {}
  };
}

function saveCharacter_(params) {
  const folders = getFolders_();

  const profileId = safeId_(params.profileId || 'default');
  const rawPayload = parsePayload_(params.payload, {});
  const characterId = safeId_(
    params.characterId ||
    rawPayload.characterId ||
    rawPayload.id ||
    rawPayload.name ||
    'character-' + Date.now()
  );

  const record = {
    type: 'character',
    profileId: profileId,
    characterId: characterId,
    name: String(rawPayload.name || params.name || characterId),
    updatedAt: new Date().toISOString(),
    createdAt: '',
    payload: rawPayload
  };

  return withLock_(function () {
    const filename = profileId + '__' + characterId + '.json';
    const existing = readJsonFile_(folders.characters, filename);
    record.createdAt = existing && existing.createdAt ? existing.createdAt : record.updatedAt;

    upsertJsonFile_(folders.characters, filename, record);

    const sharedRecord = {
      type: 'shared-state',
      profileId: profileId,
      updatedAt: record.updatedAt,
      payload: {
        activeCharacterId: characterId,
        activeCharacter: rawPayload,
        lastSavedAt: record.updatedAt
      }
    };
    upsertJsonFile_(folders.sharedState, profileId + '.json', sharedRecord);

    return {
      ok: true,
      saved: true,
      profileId: profileId,
      characterId: characterId,
      name: record.name,
      updatedAt: record.updatedAt
    };
  });
}

function loadCharacter_(params) {
  const folders = getFolders_();

  const profileId = safeId_(params.profileId || 'default');
  const characterId = safeId_(params.characterId || 'active');

  if (characterId === 'active') {
    const shared = loadSharedState_({ profileId: profileId });
    const activeId = shared.payload && shared.payload.activeCharacterId;
    if (activeId) {
      const activeRecord = readJsonFile_(folders.characters, profileId + '__' + safeId_(activeId) + '.json');
      return {
        ok: true,
        found: !!activeRecord,
        profileId: profileId,
        characterId: activeId,
        record: activeRecord || null,
        payload: activeRecord && activeRecord.payload ? activeRecord.payload : {}
      };
    }
  }

  const record = readJsonFile_(folders.characters, profileId + '__' + characterId + '.json');

  return {
    ok: true,
    found: !!record,
    profileId: profileId,
    characterId: characterId,
    record: record || null,
    payload: record && record.payload ? record.payload : {}
  };
}

function listCharacters_(params) {
  const folders = getFolders_();
  const profileId = safeId_(params.profileId || 'default');
  const files = folders.characters.getFiles();
  const characters = [];

  while (files.hasNext()) {
    const file = files.next();
    const name = file.getName();

    if (name.indexOf(profileId + '__') !== 0 || name.slice(-5) !== '.json') continue;

    const record = readJsonFromFile_(file);
    if (!record) continue;

    characters.push({
      profileId: record.profileId || profileId,
      characterId: record.characterId || name,
      name: record.name || record.characterId || name,
      createdAt: record.createdAt || '',
      updatedAt: record.updatedAt || '',
      fileId: file.getId()
    });
  }

  characters.sort(function (a, b) {
    return String(b.updatedAt).localeCompare(String(a.updatedAt));
  });

  return {
    ok: true,
    profileId: profileId,
    count: characters.length,
    characters: characters
  };
}

function deleteCharacter_(params) {
  const folders = getFolders_();
  const profileId = safeId_(params.profileId || 'default');
  const characterId = safeId_(params.characterId || '');

  if (!characterId) {
    return { ok: false, error: 'Missing characterId.' };
  }

  const filename = profileId + '__' + characterId + '.json';
  const deleted = trashFilesByName_(folders.characters, filename);

  return {
    ok: true,
    deleted: deleted,
    profileId: profileId,
    characterId: characterId
  };
}

function logEvent_(params) {
  const folders = getFolders_();

  const profileId = safeId_(params.profileId || 'default');
  const eventType = safeId_(params.eventType || 'event');
  const payload = parsePayload_(params.payload, {});

  const record = {
    type: 'log-event',
    profileId: profileId,
    eventType: eventType,
    createdAt: new Date().toISOString(),
    payload: payload
  };

  const filename = profileId + '__' + eventType + '__' + Date.now() + '.json';
  upsertJsonFile_(folders.logs, filename, record);

  return {
    ok: true,
    logged: true,
    eventType: eventType,
    createdAt: record.createdAt
  };
}

function launcherHtml_(params) {
  const serviceUrl = ScriptApp.getService().getUrl() || '';
  const manifestUrl = serviceUrl ? serviceUrl + '?action=manifest' : '?action=manifest';
  const iconUrl = serviceUrl ? serviceUrl + '?action=icon&size=512' : '?action=icon&size=512';
  const frontendUrl = BELAVADOS_CHARACTER_STUDIO.FRONTEND_URL || '';

  const html = `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base target="_top">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="${escapeHtml_(BELAVADOS_CHARACTER_STUDIO.THEME_COLOR)}">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="${escapeHtml_(BELAVADOS_CHARACTER_STUDIO.SHORT_NAME)}">
  <meta name="mobile-web-app-capable" content="yes">
  <link rel="manifest" href="${escapeHtml_(manifestUrl)}">
  <link rel="icon" href="${escapeHtml_(iconUrl)}">
  <link rel="apple-touch-icon" href="${escapeHtml_(iconUrl)}">
  <title>${escapeHtml_(BELAVADOS_CHARACTER_STUDIO.APP_NAME)}</title>
  <style>
    :root {
      --cyan: #00ffff;
      --bg: #050814;
      --panel: rgba(7, 14, 30, 0.86);
      --text: #f4ffff;
      --muted: #bdefff;
      --danger: #ff6b9a;
      --gold: #ffd56a;
    }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      min-height: 100%;
      background:
        radial-gradient(circle at top, rgba(0,255,255,0.24), transparent 34rem),
        radial-gradient(circle at bottom left, rgba(255,213,106,0.12), transparent 28rem),
        var(--bg);
      color: var(--text);
      font-family: Georgia, "Times New Roman", serif;
    }
    body {
      display: grid;
      place-items: center;
      padding: 24px;
    }
    .app-shell {
      width: min(760px, 100%);
      border: 2px solid rgba(0,255,255,0.65);
      border-radius: 28px;
      background: var(--panel);
      box-shadow: 0 0 44px rgba(0,255,255,0.22), inset 0 0 30px rgba(0,255,255,0.08);
      padding: clamp(22px, 5vw, 42px);
      text-align: center;
    }
    .sigil {
      width: 132px;
      height: 132px;
      margin: 0 auto 18px;
      display: grid;
      place-items: center;
      border-radius: 999px;
      border: 3px solid var(--cyan);
      color: var(--cyan);
      font-size: 54px;
      font-weight: 900;
      box-shadow: 0 0 30px rgba(0,255,255,0.35);
      background: radial-gradient(circle, rgba(0,255,255,0.20), rgba(0,0,0,0.28));
    }
    h1 {
      margin: 0 0 10px;
      font-size: clamp(2rem, 8vw, 4rem);
      line-height: 1;
      text-shadow: 0 0 14px rgba(0,255,255,0.65), 2px 2px 0 #000;
    }
    p {
      color: var(--muted);
      font-size: 1.05rem;
      line-height: 1.55;
      margin: 12px auto;
      max-width: 58ch;
    }
    .buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      justify-content: center;
      margin-top: 26px;
    }
    a, button {
      appearance: none;
      border: 2px solid var(--cyan);
      border-radius: 999px;
      background: rgba(0,255,255,0.12);
      color: var(--text);
      padding: 12px 18px;
      font-weight: 800;
      text-decoration: none;
      cursor: pointer;
      box-shadow: 0 0 18px rgba(0,255,255,0.18);
    }
    a:hover, button:hover {
      background: rgba(0,255,255,0.22);
      transform: translateY(-1px);
    }
    code {
      display: inline-block;
      word-break: break-word;
      color: var(--gold);
    }
    .note {
      margin-top: 22px;
      padding: 14px;
      border-radius: 18px;
      border: 1px solid rgba(255,213,106,0.45);
      background: rgba(255,213,106,0.08);
      color: #fff6d6;
    }
  </style>
</head>
<body>
  <main class="app-shell">
    <div class="sigil">B</div>
    <h1>Belavadös</h1>
    <p>
      Character Studio backend is deployed and ready.
      This launcher page also provides install metadata for mobile and desktop shortcuts.
    </p>

    <div class="buttons">
      ${
        frontendUrl
          ? `<a href="${escapeHtml_(frontendUrl)}" rel="noopener">Open Character Studio</a>`
          : `<button onclick="alert('Frontend URL has not been pasted into BELAVADOS_CHARACTER_STUDIO.FRONTEND_URL yet. After deployment, send ChatGPT this backend URL and we will embed it into the GitHub site.')">Frontend URL Not Embedded Yet</button>`
      }
      <a href="${escapeHtml_(serviceUrl + '?action=health')}" rel="noopener">Backend Health</a>
      <a href="${escapeHtml_(serviceUrl + '?action=setup')}" rel="noopener">Run Setup</a>
    </div>

    <div class="note">
      <p>
        To add this as an icon:
        on mobile, open this page and choose <strong>Add to Home Screen</strong>.
        On desktop Chrome/Edge, use the browser install option or create shortcut.
      </p>
      <p>
        Backend URL:<br>
        <code>${escapeHtml_(serviceUrl || 'Unavailable until deployed')}</code>
      </p>
    </div>
  </main>

  <script>
    window.BELAVADOS_CHARACTER_STUDIO_READY = true;
  </script>
</body>
</html>`;

  return HtmlService
    .createHtmlOutput(html)
    .setTitle(BELAVADOS_CHARACTER_STUDIO.APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function manifestOutput_(params) {
  const serviceUrl = ScriptApp.getService().getUrl() || '';
  const startUrl = serviceUrl ? serviceUrl + '?action=launcher' : '?action=launcher';

  const manifest = {
    name: BELAVADOS_CHARACTER_STUDIO.APP_NAME,
    short_name: BELAVADOS_CHARACTER_STUDIO.SHORT_NAME,
    description: 'Belavadös Character Studio launcher and backend bridge.',
    id: '/belavados-character-studio',
    start_url: startUrl,
    scope: serviceUrl || './',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone', 'minimal-ui'],
    orientation: 'any',
    theme_color: BELAVADOS_CHARACTER_STUDIO.THEME_COLOR,
    background_color: BELAVADOS_CHARACTER_STUDIO.BACKGROUND_COLOR,
    categories: ['games', 'productivity', 'entertainment'],
    icons: [
      {
        src: serviceUrl + '?action=icon&size=192',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      },
      {
        src: serviceUrl + '?action=icon&size=512',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any maskable'
      }
    ]
  };

  return ContentService
    .createTextOutput(JSON.stringify(manifest, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function iconOutput_(params) {
  const size = Math.max(64, Math.min(1024, Number(params.size || 512)));
  const svg = iconSvg_(size);

  return ContentService
    .createTextOutput(svg)
    .setMimeType(ContentService.MimeType.XML);
}

function iconSvg_(size) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="70%">
      <stop offset="0%" stop-color="#00ffff" stop-opacity="0.55"/>
      <stop offset="42%" stop-color="#102040" stop-opacity="1"/>
      <stop offset="100%" stop-color="#040814" stop-opacity="1"/>
    </radialGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="188" fill="none" stroke="#00ffff" stroke-width="18" opacity="0.88" filter="url(#glow)"/>
  <circle cx="256" cy="256" r="140" fill="none" stroke="#ffd56a" stroke-width="8" opacity="0.82"/>
  <path d="M160 352 L256 92 L352 352 Z" fill="rgba(0,255,255,0.14)" stroke="#00ffff" stroke-width="12" stroke-linejoin="round" filter="url(#glow)"/>
  <text x="256" y="310" text-anchor="middle"
        font-family="Georgia, serif" font-size="168" font-weight="900"
        fill="#f4ffff" stroke="#000814" stroke-width="8" paint-order="stroke"
        filter="url(#glow)">B</text>
  <text x="256" y="400" text-anchor="middle"
        font-family="Georgia, serif" font-size="42" font-weight="800"
        fill="#ffd56a" stroke="#000814" stroke-width="4" paint-order="stroke">STUDIO</text>
</svg>`;
}

function parsePayload_(payload, fallback) {
  if (payload && typeof payload === 'object') return payload;

  if (typeof payload === 'string' && payload.trim()) {
    try {
      return JSON.parse(payload);
    } catch (err) {
      return {
        raw: payload
      };
    }
  }

  return fallback || {};
}

function getOrCreateFolderByName_(name) {
  const existing = DriveApp.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return DriveApp.createFolder(name);
}

function getOrCreateChildFolder_(parent, name) {
  const existing = parent.getFoldersByName(name);
  if (existing.hasNext()) return existing.next();
  return parent.createFolder(name);
}

function upsertJsonFile_(folder, filename, obj) {
  const json = JSON.stringify(obj, null, 2);
  const files = folder.getFilesByName(filename);

  if (files.hasNext()) {
    const file = files.next();
    file.setContent(json);

    while (files.hasNext()) {
      files.next().setTrashed(true);
    }

    return file;
  }

  return folder.createFile(filename, json, MimeType.PLAIN_TEXT);
}

function readJsonFile_(folder, filename) {
  const files = folder.getFilesByName(filename);
  if (!files.hasNext()) return null;
  return readJsonFromFile_(files.next());
}

function readJsonFromFile_(file) {
  try {
    return JSON.parse(file.getBlob().getDataAsString());
  } catch (err) {
    return null;
  }
}

function trashFilesByName_(folder, filename) {
  const files = folder.getFilesByName(filename);
  let count = 0;

  while (files.hasNext()) {
    files.next().setTrashed(true);
    count++;
  }

  return count;
}

function withLock_(fn) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    return fn();
  } finally {
    lock.releaseLock();
  }
}

function safeId_(value) {
  value = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!value) value = 'item-' + Date.now();
  if (value.length > 80) value = value.slice(0, 80);

  return value;
}

function safeFilename_(value) {
  value = String(value || 'file')
    .trim()
    .replace(/['"]/g, '')
    .replace(/[\\/:*?<>|#%{}$!@+`=]/g, '-')
    .replace(/\s+/g, '-');

  if (!value) value = 'file';
  if (value.length > 120) value = value.slice(0, 120);

  return value;
}

function escapeHtml_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function exportAllData_(params) {
  const profileId = safeId_(params.profileId || 'default');

  return {
    ok: true,
    exportedAt: new Date().toISOString(),
    profileId: profileId,
    sharedState: loadSharedState_({ profileId: profileId }).payload,
    characters: listCharacters_({ profileId: profileId }).characters,
    note: 'Old const-backend voice presets/assets were intentionally not merged. Use export.all for the updated Character Studio voice catalog/runtime export.'
  };
}

function isAuthorized_(params) {
  const configured = String(BELAVADOS_CHARACTER_STUDIO.API_KEY || '').trim();
  if (!configured) return true;
  return String(params.apiKey || '').trim() === configured;
}

function getFolders_() {
  const root = getOrCreateFolderByName_(BELAVADOS_CHARACTER_STUDIO.ROOT_FOLDER_NAME);
  const data = getOrCreateChildFolder_(root, BELAVADOS_CHARACTER_STUDIO.DATA_FOLDER_NAME);
  const characters = getOrCreateChildFolder_(root, BELAVADOS_CHARACTER_STUDIO.CHARACTER_FOLDER_NAME);
  const sharedState = getOrCreateChildFolder_(root, BELAVADOS_CHARACTER_STUDIO.SHARED_STATE_FOLDER_NAME);
  const logs = getOrCreateChildFolder_(root, BELAVADOS_CHARACTER_STUDIO.LOG_FOLDER_NAME);

  return {
    root: root,
    data: data,
    characters: characters,
    sharedState: sharedState,
    logs: logs
  };
}

/***************************************************************
 * Example frontend POST payload:
 *
 * {
 *   "action": "voice.jobs.create",
 *   "text": "The tide remembers every name spoken over it.",
 *   "crossoverId": "biome_cache_combo_004",
 *   "voiceProfile": {
 *     "pitch": 5,
 *     "speed": 5,
 *     "accentColor": 7,
 *     "influenceRace": 1,
 *     "influenceBiome": 1
 *   },
 *   "layers": [
 *     {
 *       "biomeId": "farming",
 *       "enabled": true,
 *       "intensityPercent": 16
 *     },
 *     {
 *       "biomeId": "marshes_and_swamps",
 *       "enabled": true,
 *       "intensityPercent": 47
 *     },
 *     {
 *       "biomeId": "underwater_without_reefs",
 *       "enabled": true,
 *       "intensityPercent": 37
 *     }
 *   ],
 *   "characterContext": {
 *     "race": "Halfling",
 *     "className": "Bard",
 *     "genderIdentity": "Non-Binary",
 *     "emotion": "Warm"
 *   }
 * }
 ***************************************************************/

/***************************************************************
 * VOICE EXPORT / SINGING / ACAPELLA / MOOD / SYNTH RUNTIME ADD-ON
 *
 * Added for the expanded Belavadös voice pipeline.
 *
 * What this Apps Script can do directly:
 * - validate voice render requests
 * - create render/job JSON payloads
 * - save MP3/WAV files that are returned by your frontend or an
 *   external voice engine as base64
 * - save JSON voice manifests/presets/jobs to Drive
 * - return Drive download URLs for MP3/WAV/JSON exports
 * - create a simple procedural WAV "synth guide" from oscillator
 *   settings for testing patches without an external engine
 *
 * Important platform limit:
 * Apps Script is not an MP3 encoder, studio DAW, vocal separator, or
 * real singing/acapella model host. Full singing generation, acapella
 * extraction, cloned voice conversion, and MP3 encoding should happen
 * in the frontend WebAudio/MediaRecorder layer or an external engine.
 * This backend accounts for those outputs by routing jobs and storing
 * the returned MP3/WAV/JSON artifacts.
 *
 * Optional Script Properties:
 * - VOICE_RENDER_ENGINE_URL: external speech/singing/acapella/render endpoint
 * - VOICE_RENDER_ENGINE_KEY: optional bearer/API key for that endpoint
 * - PUBLIC_DOWNLOADS_DEFAULT: "true" or "false"; default is true
 ***************************************************************/

STORE_KEYS.AUDIO_EXPORTS_INDEX = 'BELAVADOS_AUDIO_EXPORTS_INDEX';
STORE_KEYS.RENDER_JOBS_INDEX = 'BELAVADOS_RENDER_JOBS_INDEX';

const BELAVADOS_AUDIO_FORMATS = [
  {
    key: 'mp3',
    extension: 'mp3',
    mimeType: 'audio/mpeg',
    label: 'MP3',
    canNativeEncodeInAppsScript: false,
    storageSupported: true,
    downloadSupported: true,
    note: 'Apps Script stores MP3 returned by frontend/external engine. It does not natively encode MP3.'
  },
  {
    key: 'wav',
    extension: 'wav',
    mimeType: 'audio/wav',
    label: 'WAV',
    canNativeEncodeInAppsScript: true,
    storageSupported: true,
    downloadSupported: true,
    note: 'Apps Script can store WAV and can generate a simple procedural synth-guide WAV.'
  },
  {
    key: 'json',
    extension: 'json',
    mimeType: 'application/json',
    label: 'JSON',
    canNativeEncodeInAppsScript: true,
    storageSupported: true,
    downloadSupported: true,
    note: 'Voice manifests, synth patches, mood settings, render jobs, and export metadata.'
  }
];

const BELAVADOS_VOICE_RENDER_MODES = [
  'speech',
  'voice_edit',
  'singing',
  'acapella_generation',
  'acapella_extraction',
  'mood_voice',
  'synth_patch',
  'synth_guide_wav'
];

const BELAVADOS_MOOD_CATALOG = [
  { key: 'neutral', label: 'Neutral / Base', pitch: 0, speed: 0, inflection: 0, breath: 0, roughness: 0, warmth: 0, projection: 0, emphasis: 0, vibrato: 0.08, brightness: 0.5 },
  { key: 'casting', label: 'Casting', pitch: 0.3, speed: -0.1, inflection: 0.7, breath: 0.2, roughness: 0.1, warmth: 0.1, projection: 0.55, emphasis: 0.7, vibrato: 0.18, brightness: 0.68 },
  { key: 'kindness', label: 'Kindness', pitch: 0.15, speed: -0.15, inflection: 0.35, breath: 0.25, roughness: -0.4, warmth: 0.85, projection: -0.1, emphasis: -0.1, vibrato: 0.12, brightness: 0.64 },
  { key: 'compassion', label: 'Compassion', pitch: -0.05, speed: -0.35, inflection: 0.25, breath: 0.35, roughness: -0.55, warmth: 1, projection: -0.25, emphasis: -0.25, vibrato: 0.1, brightness: 0.58 },
  { key: 'tenderness', label: 'Tenderness', pitch: 0.05, speed: -0.45, inflection: 0.18, breath: 0.55, roughness: -0.65, warmth: 1, projection: -0.45, emphasis: -0.35, vibrato: 0.09, brightness: 0.55 },
  { key: 'joy', label: 'Joy', pitch: 0.8, speed: 0.45, inflection: 0.85, breath: 0.05, roughness: -0.2, warmth: 0.85, projection: 0.35, emphasis: 0.4, vibrato: 0.24, brightness: 0.82 },
  { key: 'excitement', label: 'Excitement', pitch: 0.9, speed: 0.8, inflection: 1, breath: 0.2, roughness: 0, warmth: 0.55, projection: 0.65, emphasis: 0.75, vibrato: 0.3, brightness: 0.9 },
  { key: 'calm', label: 'Calm', pitch: -0.15, speed: -0.55, inflection: -0.35, breath: 0.15, roughness: -0.45, warmth: 0.35, projection: -0.35, emphasis: -0.4, vibrato: 0.06, brightness: 0.42 },
  { key: 'annoyance', label: 'Annoyance', pitch: 0.2, speed: 0.25, inflection: -0.15, breath: -0.15, roughness: 0.35, warmth: -0.35, projection: 0.15, emphasis: 0.5, vibrato: 0.08, brightness: 0.62 },
  { key: 'sarcasm', label: 'Sarcasm', pitch: 0.25, speed: -0.1, inflection: 0.55, breath: -0.1, roughness: 0.2, warmth: -0.25, projection: 0.05, emphasis: 0.65, vibrato: 0.11, brightness: 0.67 },
  { key: 'suspicion', label: 'Suspicion', pitch: -0.2, speed: -0.25, inflection: 0.35, breath: 0.05, roughness: 0.2, warmth: -0.45, projection: -0.25, emphasis: 0.35, vibrato: 0.08, brightness: 0.38 },
  { key: 'gruffness', label: 'Gruffness', pitch: -0.45, speed: -0.15, inflection: -0.3, breath: -0.05, roughness: 0.8, warmth: -0.05, projection: 0.25, emphasis: 0.45, vibrato: 0.07, brightness: 0.34 },
  { key: 'anger', label: 'Anger', pitch: -0.1, speed: 0.45, inflection: 0.35, breath: -0.2, roughness: 0.85, warmth: -0.75, projection: 0.95, emphasis: 0.95, vibrato: 0.18, brightness: 0.54 },
  { key: 'rage', label: 'Rage', pitch: -0.25, speed: 0.65, inflection: 0.5, breath: -0.35, roughness: 1, warmth: -1, projection: 1, emphasis: 1, vibrato: 0.24, brightness: 0.49 },
  { key: 'betrayal', label: 'Betrayal', pitch: -0.25, speed: -0.2, inflection: 0.75, breath: 0.25, roughness: 0.45, warmth: -0.65, projection: 0.25, emphasis: 0.75, vibrato: 0.2, brightness: 0.44 },
  { key: 'grief', label: 'Grief', pitch: -0.65, speed: -0.75, inflection: -0.15, breath: 0.55, roughness: 0.2, warmth: -0.1, projection: -0.7, emphasis: -0.15, vibrato: 0.16, brightness: 0.28 },
  { key: 'fear', label: 'Fear', pitch: 0.65, speed: 0.55, inflection: 0.8, breath: 0.65, roughness: 0.15, warmth: -0.5, projection: -0.3, emphasis: 0.35, vibrato: 0.34, brightness: 0.7 },
  { key: 'boss_battle', label: 'Boss Battle', pitch: -0.35, speed: 0.2, inflection: 0.55, breath: -0.1, roughness: 0.65, warmth: -0.35, projection: 1, emphasis: 0.95, vibrato: 0.17, brightness: 0.52 },
  { key: 'panic', label: 'Panic', pitch: 0.9, speed: 1, inflection: 0.95, breath: 0.85, roughness: 0.25, warmth: -0.7, projection: 0.15, emphasis: 0.75, vibrato: 0.42, brightness: 0.82 },
  { key: 'weapon_attack', label: 'Weapon Attack', pitch: -0.2, speed: 0.35, inflection: 0.25, breath: -0.2, roughness: 0.55, warmth: -0.25, projection: 0.85, emphasis: 0.9, vibrato: 0.12, brightness: 0.55 },
  { key: 'exhaustion', label: 'Exhaustion', pitch: -0.45, speed: -0.85, inflection: -0.65, breath: 0.75, roughness: 0.3, warmth: -0.15, projection: -0.85, emphasis: -0.65, vibrato: 0.06, brightness: 0.25 },
  { key: 'authority', label: 'Authority', pitch: -0.3, speed: -0.1, inflection: -0.15, breath: -0.25, roughness: 0.25, warmth: -0.1, projection: 0.9, emphasis: 0.8, vibrato: 0.06, brightness: 0.5 },
  { key: 'dungeon_fight', label: 'Dungeon Fight', pitch: -0.15, speed: 0.25, inflection: 0.25, breath: 0.1, roughness: 0.55, warmth: -0.25, projection: 0.75, emphasis: 0.75, vibrato: 0.15, brightness: 0.45 },
  { key: 'courage', label: 'Courage', pitch: 0.15, speed: 0.1, inflection: 0.35, breath: -0.15, roughness: 0.1, warmth: 0.45, projection: 0.85, emphasis: 0.75, vibrato: 0.13, brightness: 0.72 },
  { key: 'shame', label: 'Shame', pitch: -0.25, speed: -0.55, inflection: -0.35, breath: 0.35, roughness: 0, warmth: -0.25, projection: -0.8, emphasis: -0.55, vibrato: 0.08, brightness: 0.32 },
  { key: 'awe', label: 'Awe', pitch: 0.35, speed: -0.35, inflection: 0.75, breath: 0.4, roughness: -0.25, warmth: 0.35, projection: 0.15, emphasis: 0.25, vibrato: 0.18, brightness: 0.78 },
  { key: 'confidence', label: 'Confidence', pitch: 0.1, speed: 0.05, inflection: 0.25, breath: -0.2, roughness: 0.05, warmth: 0.25, projection: 0.7, emphasis: 0.55, vibrato: 0.1, brightness: 0.67 },
  { key: 'flirtation', label: 'Flirtation', pitch: 0.25, speed: -0.25, inflection: 0.75, breath: 0.45, roughness: -0.25, warmth: 0.75, projection: -0.1, emphasis: 0.35, vibrato: 0.22, brightness: 0.73 },
  { key: 'menace', label: 'Menace', pitch: -0.65, speed: -0.45, inflection: -0.05, breath: 0.05, roughness: 0.75, warmth: -0.9, projection: 0.25, emphasis: 0.65, vibrato: 0.12, brightness: 0.24 },
  { key: 'wonder', label: 'Wonder', pitch: 0.45, speed: -0.15, inflection: 0.9, breath: 0.25, roughness: -0.35, warmth: 0.55, projection: 0.05, emphasis: 0.25, vibrato: 0.2, brightness: 0.8 }
];

const BELAVADOS_SYNTH_PATCH_SCHEMA = {
  manifestVersion: 'belavados.voice.synth.patch.v1',
  userFacingRule: 'Frontend can show friendly slider names only. Internal oscillator/filter names are for the engine.',
  oscillatorBank: [
    {
      key: 'voiceCore',
      userFacingName: 'Voice Core',
      purpose: 'Main tonal body used for synth preview and guide WAV generation.',
      allowedInternalWaveforms: ['sine', 'triangle', 'sawtooth', 'square'],
      defaultInternalWaveform: 'sine'
    },
    {
      key: 'bodyResonance',
      userFacingName: 'Body Resonance',
      purpose: 'Lower supportive layer for depth, chest/body feel, and age/wear.',
      allowedInternalWaveforms: ['sine', 'triangle'],
      defaultInternalWaveform: 'triangle'
    },
    {
      key: 'roughEdge',
      userFacingName: 'Gruff Edge',
      purpose: 'Controlled rasp and bite layer. Frontend can expose this as a simple gruffness slider.',
      allowedInternalWaveforms: ['sawtooth', 'square', 'noise'],
      defaultInternalWaveform: 'sawtooth'
    },
    {
      key: 'breathAir',
      userFacingName: 'Soft Breath',
      purpose: 'Air, softness, whispered edge, and acapella breath cues.',
      allowedInternalWaveforms: ['noise'],
      defaultInternalWaveform: 'noise'
    },
    {
      key: 'harmonyGuide',
      userFacingName: 'Singing Harmony Guide',
      purpose: 'Optional guide layer for singing and acapella harmony generation.',
      allowedInternalWaveforms: ['sine', 'triangle'],
      defaultInternalWaveform: 'sine'
    }
  ],
  controls: [
    { key: 'baseFrequencyHz', label: 'Base Voice Tone', min: 70, max: 320, default: 155 },
    { key: 'vibratoRateHz', label: 'Voice Motion Speed', min: 0, max: 12, default: 5.3 },
    { key: 'vibratoDepthCents', label: 'Voice Motion Depth', min: 0, max: 120, default: 18 },
    { key: 'breathMix', label: 'Breath Mix', min: 0, max: 1, default: 0.08 },
    { key: 'roughMix', label: 'Rough Mix', min: 0, max: 1, default: 0.06 },
    { key: 'bodyMix', label: 'Body Mix', min: 0, max: 1, default: 0.35 },
    { key: 'harmonyMix', label: 'Harmony Mix', min: 0, max: 1, default: 0 },
    { key: 'filterLowPassHz', label: 'Dark / Bright Ceiling', min: 600, max: 12000, default: 6400 },
    { key: 'filterHighPassHz', label: 'Low Rumble Cut', min: 20, max: 800, default: 65 },
    { key: 'formantShift', label: 'Mouth Shape Shift', min: -1, max: 1, default: 0 },
    { key: 'compressorAmount', label: 'Evenness', min: 0, max: 1, default: 0.35 },
    { key: 'reverbAmount', label: 'Room / Space', min: 0, max: 1, default: 0.08 },
    { key: 'delayAmount', label: 'Echo', min: 0, max: 1, default: 0 }
  ]
};

function getAudioFormatCatalog_() {
  return {
    ok: true,
    formats: BELAVADOS_AUDIO_FORMATS,
    supportedOutputFormats: BELAVADOS_AUDIO_FORMATS.map(function (f) { return f.key; }),
    maxInlineBase64Note: 'Keep inline base64 payloads small enough for Apps Script request limits. For larger audio, upload from frontend to Drive or external engine first.',
    downloadStrategy: 'Exports are written to Drive and returned with viewUrl and direct downloadUrl.'
  };
}

function getVoiceRuntimeSchema_() {
  return {
    ok: true,
    app: APP_VERSION,
    runtimeAddon: 'belavados.voice.export.singing.acapella.synth.v1',
    actions: {
      saveAudio: 'audio.export.save',
      saveJson: 'audio.export.saveJson',
      getExport: 'audio.export.get',
      listExports: 'audio.export.list',
      createRenderJob: 'voice.render.create',
      createSinging: 'voice.singing.create',
      createAcapella: 'voice.acapella.create',
      generateMood: 'voice.mood.generate',
      synthPatchPreview: 'voice.synth.patch',
      synthGuideWav: 'voice.synth.renderWav'
    },
    formats: BELAVADOS_AUDIO_FORMATS,
    renderModes: BELAVADOS_VOICE_RENDER_MODES,
    moodCatalog: BELAVADOS_MOOD_CATALOG,
    synthPatchSchema: BELAVADOS_SYNTH_PATCH_SCHEMA,
    engine: getVoiceRenderEngineInfo_(),
    notes: [
      'Use voice.synth.renderWav for a simple backend-generated WAV guide.',
      'Use voice.render.create / voice.singing.create / voice.acapella.create to queue or forward full voice jobs.',
      'Use audio.export.save to store returned MP3/WAV base64 and get download URLs.',
      'Use audio.export.saveJson to store JSON patches/manifests/jobs.'
    ]
  };
}

function saveAudioExport_(request) {
  const format = normalizeAudioFormat_(request.format || request.outputFormat || request.extension || request.mimeType || 'wav');

  if (format.key === 'json') {
    return saveJsonExport_(request);
  }

  if (format.key !== 'mp3' && format.key !== 'wav') {
    return fail_('audio.export.save only supports mp3 or wav. Use audio.export.saveJson for JSON.', 400);
  }

  const rawBase64 = request.audioBase64 || request.base64 || request.data || request.dataUri || request.audioDataUri || '';
  if (!rawBase64) {
    return fail_('Missing audioBase64, base64, data, dataUri, or audioDataUri.', 400);
  }

  const bytes = decodeBase64Bytes_(rawBase64);
  if (!bytes || !bytes.length) {
    return fail_('Audio payload decoded to zero bytes.', 400);
  }

  const filename = buildVoiceExportFilename_(request, format.extension);
  const blob = Utilities.newBlob(bytes, format.mimeType, filename);

  return saveAudioExportBlob_(blob, {
    format: format.key,
    mimeType: format.mimeType,
    filename: filename,
    kind: safeSmall_(request.kind || request.mode || 'audio-export'),
    characterContext: request.characterContext || request.context || {},
    voiceProfile: request.voiceProfile || request.sliders || null,
    synthPatch: request.synthPatch || null,
    mood: request.mood || request.emotion || '',
    renderJobId: request.renderJobId || request.jobId || '',
    source: safeSmall_(request.source || 'frontend-or-external-engine'),
    makePublic: request.makePublic
  });
}

function saveJsonExport_(request) {
  const folders = getVoiceExportFolders_();
  const exportId = request.exportId || 'json_' + Utilities.getUuid();
  const now = new Date().toISOString();
  const payload = request.payload !== undefined
    ? parsePayload_(request.payload, {})
    : request.json !== undefined
      ? parsePayload_(request.json, {})
      : request;

  const filename = safeFilename_(request.fileName || request.filename || exportId) + (String(request.fileName || request.filename || '').toLowerCase().slice(-5) === '.json' ? '' : '.json');

  const record = {
    id: exportId,
    type: 'json-export',
    format: 'json',
    mimeType: 'application/json',
    filename: filename,
    createdAt: now,
    updatedAt: now,
    kind: safeSmall_(request.kind || 'voice-json-export'),
    payloadSummary: summarizePayloadForRecord_(payload)
  };

  const filePayload = {
    manifestVersion: 'belavados.voice.json.export.v1',
    exportId: exportId,
    createdAt: now,
    kind: record.kind,
    payload: payload
  };

  const file = upsertJsonFile_(folders.json, filename, filePayload);
  applyDownloadSharing_(file, request.makePublic);
  record.fileId = file.getId();
  record.fileUrl = file.getUrl();
  record.viewUrl = file.getUrl();
  record.downloadUrl = buildDriveDownloadUrl_(file.getId());
  record.bytes = file.getSize();

  saveRecord_('AUDIO_EXPORT_', STORE_KEYS.AUDIO_EXPORTS_INDEX, exportId, record);

  return {
    ok: true,
    export: record,
    payload: filePayload
  };
}

function saveAudioExportBlob_(blob, options) {
  const folders = getVoiceExportFolders_();
  const exportId = 'audio_' + Utilities.getUuid();
  const now = new Date().toISOString();
  const filename = safeFilename_(options.filename || exportId + '.' + options.format);

  blob.setName(filename);

  const file = folders.audio.createFile(blob);
  applyDownloadSharing_(file, options.makePublic);

  const record = {
    id: exportId,
    type: 'audio-export',
    format: options.format,
    mimeType: options.mimeType,
    filename: filename,
    createdAt: now,
    updatedAt: now,
    kind: options.kind || 'audio-export',
    renderJobId: options.renderJobId || '',
    mood: safeSmall_(options.mood || ''),
    source: safeSmall_(options.source || ''),
    characterContext: sanitizeCharacterContext_(options.characterContext || {}),
    voiceProfile: options.voiceProfile ? sanitizeVoiceProfile_(options.voiceProfile) : null,
    synthPatchSummary: options.synthPatch ? summarizePayloadForRecord_(options.synthPatch) : null,
    fileId: file.getId(),
    fileUrl: file.getUrl(),
    viewUrl: file.getUrl(),
    downloadUrl: buildDriveDownloadUrl_(file.getId()),
    bytes: file.getSize()
  };

  saveRecord_('AUDIO_EXPORT_', STORE_KEYS.AUDIO_EXPORTS_INDEX, exportId, record);

  return {
    ok: true,
    export: record
  };
}

function getAudioExport_(exportId) {
  if (!exportId) return fail_('exportId is required.', 400);

  let record = getRecord_('AUDIO_EXPORT_', exportId);
  if (!record) {
    const byFileId = listAudioExports_({ includeJson: true, limit: 500 }).exports
      .filter(function (item) { return item.fileId === exportId; })[0];
    record = byFileId || null;
  }

  if (!record) return fail_('Export not found: ' + exportId, 404);

  return {
    ok: true,
    export: record,
    downloadUrl: record.downloadUrl,
    viewUrl: record.viewUrl || record.fileUrl
  };
}

function listAudioExports_(request) {
  const ids = getIndex_(STORE_KEYS.AUDIO_EXPORTS_INDEX);
  const limit = clamp_(Number(request.limit || 100), 1, 500);
  const offset = clamp_(Number(request.offset || 0), 0, ids.length);
  const format = String(request.format || '').toLowerCase();
  const kind = String(request.kind || '').toLowerCase();

  let exports = ids.map(function (id) { return getRecord_('AUDIO_EXPORT_', id); }).filter(Boolean);

  if (format) {
    exports = exports.filter(function (item) { return String(item.format || '').toLowerCase() === format; });
  }

  if (kind) {
    exports = exports.filter(function (item) { return String(item.kind || '').toLowerCase().indexOf(kind) !== -1; });
  }

  exports.sort(function (a, b) {
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });

  return {
    ok: true,
    total: exports.length,
    offset: offset,
    limit: limit,
    exports: exports.slice(offset, offset + limit)
  };
}

function deleteAudioExport_(request) {
  const exportId = request.exportId || request.fileId || '';
  if (!exportId) return fail_('exportId or fileId is required.', 400);

  const record = getRecord_('AUDIO_EXPORT_', exportId);
  if (!record) return fail_('Export not found: ' + exportId, 404);

  if (record.fileId) {
    try {
      DriveApp.getFileById(record.fileId).setTrashed(true);
    } catch (err) {
      // Metadata is still deleted even if the Drive file cannot be trashed.
    }
  }

  PropertiesService.getScriptProperties().deleteProperty('AUDIO_EXPORT_' + exportId);
  removeFromIndex_(STORE_KEYS.AUDIO_EXPORTS_INDEX, exportId);

  return {
    ok: true,
    deleted: exportId,
    fileTrashed: Boolean(record.fileId)
  };
}

function createVoiceRenderJob_(request) {
  const mode = safeId_(request.mode || 'speech');
  if (BELAVADOS_VOICE_RENDER_MODES.indexOf(mode) === -1) {
    return fail_('Unsupported voice render mode: ' + mode, 400);
  }

  const payload = buildVoiceRenderPayload_(request, mode);
  return createAndMaybeForwardRenderJob_(payload, request);
}

function createSingingVoiceJob_(request) {
  const params = Object.assign({}, request, {
    mode: 'singing',
    text: request.text || request.lyrics || request.phrase || '',
    lyrics: request.lyrics || request.text || request.phrase || '',
    kind: request.kind || 'singing-voice'
  });

  return createVoiceRenderJob_(params);
}

function createAcapellaVoiceJob_(request) {
  const acapellaMode = request.inputAudioBase64 || request.sourceAudioExportId || request.baseAudioAssetId
    ? 'acapella_extraction'
    : 'acapella_generation';

  const params = Object.assign({}, request, {
    mode: request.mode || acapellaMode,
    text: request.text || request.lyrics || request.phrase || 'ah',
    lyrics: request.lyrics || request.text || request.phrase || '',
    kind: request.kind || acapellaMode
  });

  return createVoiceRenderJob_(params);
}

function buildVoiceRenderPayload_(request, mode) {
  const textCandidate = request.text || request.lyrics || request.phrase || request.prompt || '';
  const text = textCandidate ? sanitizeText_(textCandidate) : (mode === 'acapella_extraction' ? '' : 'ah');
  const baseProfile = sanitizeVoiceProfile_(request.voiceProfile || request.sliders || {});
  const moodResult = deriveMoodVoiceProfile_(request.mood || request.emotion || request.characterContext && request.characterContext.emotion || 'neutral', request.moodIntensity || request.emotionIntensity || baseProfile.emotionIntensity || 0.75, baseProfile);
  const voiceProfile = moodResult.voiceProfile;
  const context = sanitizeCharacterContext_(Object.assign({}, request.characterContext || request.context || {}, {
    emotion: request.mood || request.emotion || request.characterContext && request.characterContext.emotion || ''
  }));
  const layers = resolveAndNormalizeLayers_(request);
  const synthPatch = sanitizeSynthPatch_(request.synthPatch || buildDefaultSynthPatch_(voiceProfile, moodResult.mood, request));

  const inputAudioExport = maybeSaveInlineInputAudio_(request);

  return {
    manifestVersion: 'belavados.voice.render.payload.v1',
    mode: mode,
    createdAt: new Date().toISOString(),
    text: text,
    lyrics: safeTextOptional_(request.lyrics || ''),
    languageOutput: 'en',
    forceEnglishOutput: request.forceEnglishOutput !== false,
    requestedOutputs: sanitizeOutputFormats_(request.outputFormats || request.outputs || request.output || ['mp3', 'wav', 'json']),
    renderOptions: {
      generateMp3: outputWanted_(request, 'mp3'),
      generateWav: outputWanted_(request, 'wav'),
      generateJson: outputWanted_(request, 'json'),
      downloadLinks: true,
      acapella: {
        enabled: mode.indexOf('acapella') !== -1,
        stemMode: safeSmall_(request.stemMode || 'lead_vocal'),
        removeInstrumental: request.removeInstrumental === true || String(request.removeInstrumental) === 'true',
        harmonyCount: clamp_(Number(request.harmonyCount || 0), 0, 8)
      },
      singing: {
        enabled: mode === 'singing',
        key: safeSmall_(request.key || request.songKey || 'C'),
        scale: safeSmall_(request.scale || 'major'),
        tempoBpm: clamp_(Number(request.tempoBpm || request.bpm || 92), 35, 240),
        melodyHints: safeTextOptional_(request.melodyHints || ''),
        syllableMode: safeSmall_(request.syllableMode || 'auto')
      },
      voiceEdit: {
        enabled: mode === 'voice_edit' || Boolean(inputAudioExport || request.sourceAudioExportId || request.baseAudioAssetId),
        sourceAudioExportId: inputAudioExport ? inputAudioExport.id : safeSmall_(request.sourceAudioExportId || ''),
        baseAudioAssetId: safeSmall_(request.baseAudioAssetId || ''),
        preserveTiming: request.preserveTiming !== false,
        preserveWords: request.preserveWords !== false
      }
    },
    voiceProfile: voiceProfile,
    internalParameters: deriveInternalParameters_(voiceProfile),
    mood: moodResult.mood,
    synthPatch: synthPatch,
    characterContext: context,
    layers: layers.layers,
    enabledLayers: layers.enabledLayers,
    disabledLayers: layers.disabledLayers,
    normalizedWeightSum: layers.normalizedWeightSum,
    safety: buildSafetyBlock_(request),
    engineContract: getVoiceRenderEngineInfo_(),
    inputAudioExport: inputAudioExport,
    pipeline: [
      'validate request',
      'resolve character/layer/mood/slider profile',
      'apply synth oscillator patch as internal engine guide',
      'route speech/singing/acapella/render request',
      'store returned MP3/WAV/JSON exports',
      'return Drive download links'
    ]
  };
}

function createAndMaybeForwardRenderJob_(payload, request) {
  validateAssetReferences_(request);

  const renderJobId = 'render_' + Utilities.getUuid();
  const now = new Date().toISOString();

  const job = {
    id: renderJobId,
    createdAt: now,
    updatedAt: now,
    status: 'queued',
    mode: payload.mode,
    requestedOutputs: payload.requestedOutputs,
    payload: payload,
    exports: [],
    engine: getVoiceRenderEngineInfo_(),
    result: null,
    error: null
  };

  saveVoiceRenderJobRecord_(job);

  const jsonExport = saveJsonExport_({
    exportId: 'json_' + renderJobId,
    fileName: buildVoiceExportFilename_({
      characterContext: payload.characterContext,
      mood: payload.mood && payload.mood.key,
      kind: payload.mode
    }, 'json'),
    kind: 'voice-render-job-json',
    payload: job,
    makePublic: request.makePublic
  });

  if (jsonExport.ok) {
    job.exports.push(jsonExport.export);
  }

  const engineUrl = getVoiceRenderEngineUrl_();
  if (engineUrl) {
    const forwarded = forwardVoiceRenderJobToEngine_(engineUrl, job, request);
    job.updatedAt = new Date().toISOString();
    job.status = forwarded.ok ? 'forwarded' : 'queued_external_failed';
    job.forwardResult = forwarded;

    const savedReturnedExports = saveReturnedEngineExports_(forwarded, job, request);
    if (savedReturnedExports.length) {
      job.exports = job.exports.concat(savedReturnedExports);
      job.status = 'complete';
    }

    saveVoiceRenderJobRecord_(job);
  }

  return {
    ok: true,
    renderJobId: renderJobId,
    job: job,
    exports: job.exports,
    note: engineUrl
      ? 'Render job was validated and forwarded. Any returned MP3/WAV/JSON outputs were saved to Drive.'
      : 'Render job was validated and stored. Configure VOICE_RENDER_ENGINE_URL or let the frontend render audio and call audio.export.save.'
  };
}

function getVoiceRenderJob_(renderJobId) {
  if (!renderJobId) return fail_('renderJobId or jobId is required.', 400);
  const job = getRecord_('RENDER_JOB_', renderJobId);
  if (!job) return fail_('Voice render job not found: ' + renderJobId, 404);
  return {
    ok: true,
    job: job
  };
}

function updateVoiceRenderJob_(request) {
  const renderJobId = request.renderJobId || request.jobId || '';
  const job = getRecord_('RENDER_JOB_', renderJobId);
  if (!job) return fail_('Voice render job not found: ' + renderJobId, 404);

  if (request.status) job.status = safeSmall_(request.status);
  if (request.result !== undefined) job.result = request.result;
  if (request.error !== undefined) job.error = request.error;

  if (request.audioBase64 || request.dataUri || request.audioDataUri) {
    const saved = saveAudioExport_(Object.assign({}, request, {
      renderJobId: renderJobId,
      kind: request.kind || job.mode || 'rendered-audio'
    }));
    if (saved.ok) job.exports = (job.exports || []).concat([saved.export]);
  }

  if (request.payload || request.json) {
    const savedJson = saveJsonExport_(Object.assign({}, request, {
      exportId: request.exportId || 'json_' + renderJobId + '_' + Date.now(),
      kind: request.kind || 'render-update-json'
    }));
    if (savedJson.ok) job.exports = (job.exports || []).concat([savedJson.export]);
  }

  job.updatedAt = new Date().toISOString();
  saveVoiceRenderJobRecord_(job);

  return {
    ok: true,
    job: job,
    exports: job.exports || []
  };
}

function saveVoiceRenderJobRecord_(job) {
  saveRecord_('RENDER_JOB_', STORE_KEYS.RENDER_JOBS_INDEX, job.id, job);

  try {
    const folders = getVoiceExportFolders_();
    upsertJsonFile_(folders.jobs, job.id + '.json', job);
  } catch (err) {
    // PropertiesService record is the source of truth if Drive write fails.
  }
}

function generateMoodVoice_(request) {
  const baseProfile = sanitizeVoiceProfile_(request.voiceProfile || request.sliders || {});
  const result = deriveMoodVoiceProfile_(request.mood || request.emotion || 'neutral', request.intensity || request.moodIntensity || request.emotionIntensity || baseProfile.emotionIntensity || 0.75, baseProfile);
  const synthPatch = sanitizeSynthPatch_(request.synthPatch || buildDefaultSynthPatch_(result.voiceProfile, result.mood, request));

  const response = {
    ok: true,
    mood: result.mood,
    intensity: result.intensity,
    voiceProfile: result.voiceProfile,
    internalParameters: deriveInternalParameters_(result.voiceProfile),
    synthPatch: synthPatch,
    frontendHint: {
      showFriendlyControlsOnly: true,
      hideOscillatorWaveformNamesFromCasualUsers: true,
      suggestedPreviewPhrase: request.text || request.phrase || 'This is what I sound like.'
    }
  };

  if (request.createJob === true || String(request.createJob) === 'true') {
    const jobResult = createVoiceRenderJob_(Object.assign({}, request, {
      mode: 'mood_voice',
      text: request.text || request.phrase || 'This is what I sound like.',
      voiceProfile: result.voiceProfile,
      synthPatch: synthPatch
    }));
    response.renderJob = jobResult.job || null;
    response.renderJobId = jobResult.renderJobId || '';
    response.exports = jobResult.exports || [];
  }

  return response;
}

function buildSynthPatchPayload_(request) {
  const baseProfile = sanitizeVoiceProfile_(request.voiceProfile || request.sliders || {});
  const moodResult = deriveMoodVoiceProfile_(request.mood || request.emotion || 'neutral', request.intensity || request.moodIntensity || baseProfile.emotionIntensity || 0.75, baseProfile);
  const synthPatch = sanitizeSynthPatch_(request.synthPatch || buildDefaultSynthPatch_(moodResult.voiceProfile, moodResult.mood, request));

  return {
    ok: true,
    manifestVersion: 'belavados.voice.synth.preview.v1',
    text: request.text || request.phrase || 'This is what I sound like.',
    schema: BELAVADOS_SYNTH_PATCH_SCHEMA,
    mood: moodResult.mood,
    voiceProfile: moodResult.voiceProfile,
    internalParameters: deriveInternalParameters_(moodResult.voiceProfile),
    synthPatch: synthPatch,
    exportJsonReady: {
      action: 'audio.export.saveJson',
      fileName: buildVoiceExportFilename_(request, 'json'),
      payload: synthPatch
    },
    note: 'This patch is engine/frontend-ready. Use voice.synth.renderWav for a simple backend WAV guide or voice.render.create for full external rendering.'
  };
}

function renderSynthGuideWav_(request) {
  const patchPayload = buildSynthPatchPayload_(Object.assign({}, request, {
    mode: 'synth_guide_wav'
  }));

  if (!patchPayload.ok) return patchPayload;

  const sampleRate = clamp_(Number(request.sampleRate || 22050), 8000, 44100);
  const durationSeconds = clamp_(Number(request.durationSeconds || estimateGuideDuration_(request.text || request.lyrics || request.phrase || 'ah')), 0.35, 30);
  const patch = patchPayload.synthPatch;
  const text = String(request.text || request.lyrics || request.phrase || 'ah');

  const wavBytes = makeSynthGuideWavBytes_(patch, {
    sampleRate: sampleRate,
    durationSeconds: durationSeconds,
    text: text,
    singing: request.mode === 'singing' || String(request.singing || '') === 'true',
    tempoBpm: clamp_(Number(request.tempoBpm || request.bpm || 92), 35, 240)
  });

  const filename = buildVoiceExportFilename_(Object.assign({}, request, {
    kind: 'synth-guide'
  }), 'wav');

  const blob = Utilities.newBlob(wavBytes, 'audio/wav', filename);
  const saved = saveAudioExportBlob_(blob, {
    format: 'wav',
    mimeType: 'audio/wav',
    filename: filename,
    kind: 'synth-guide-wav',
    characterContext: request.characterContext || request.context || {},
    voiceProfile: patchPayload.voiceProfile,
    synthPatch: patch,
    mood: patchPayload.mood && patchPayload.mood.key,
    source: 'apps-script-procedural-synth-guide',
    makePublic: request.makePublic
  });

  if (!saved.ok) return saved;

  const jsonSaved = saveJsonExport_({
    fileName: buildVoiceExportFilename_(Object.assign({}, request, {
      kind: 'synth-guide-patch'
    }), 'json'),
    kind: 'synth-guide-json',
    payload: {
      manifestVersion: 'belavados.voice.synth.guide.bundle.v1',
      wavExport: saved.export,
      patchPayload: patchPayload,
      sampleRate: sampleRate,
      durationSeconds: durationSeconds
    },
    makePublic: request.makePublic
  });

  return {
    ok: true,
    wavExport: saved.export,
    jsonExport: jsonSaved.ok ? jsonSaved.export : null,
    patchPayload: patchPayload,
    note: 'Generated a simple oscillator-based WAV guide. Use an external engine/frontend for true voice, singing, acapella, or MP3 encoding.'
  };
}

function deriveMoodVoiceProfile_(moodKeyOrLabel, intensityValue, baseProfile) {
  const mood = findMood_(moodKeyOrLabel);
  const intensity = clamp_(Number(intensityValue), 0, 1);
  const profile = Object.assign({}, sanitizeVoiceProfile_(baseProfile || {}));

  profile.pitch = applyMoodDelta_(profile.pitch, mood.pitch, intensity, 1.8, 0, 10);
  profile.speed = applyMoodDelta_(profile.speed, mood.speed, intensity, 1.8, 0, 10);
  profile.inflection = applyMoodDelta_(profile.inflection, mood.inflection, intensity, 2.2, 0, 10);
  profile.breath = applyMoodDelta_(profile.breath, mood.breath, intensity, 2.0, 0, 10);
  profile.roughness = applyMoodDelta_(profile.roughness, mood.roughness, intensity, 2.4, 0, 10);
  profile.warmth = applyMoodDelta_(profile.warmth, mood.warmth, intensity, 2.0, 0, 10);
  profile.projection = applyMoodDelta_(profile.projection, mood.projection, intensity, 2.2, 0, 10);
  profile.emphasis = applyMoodDelta_(profile.emphasis, mood.emphasis, intensity, 2.0, 0, 10);
  profile.emotionIntensity = intensity;

  // Keep clarity from collapsing during intense moods.
  if (mood.key === 'panic' || mood.key === 'rage' || mood.key === 'grief') {
    profile.clarity = clamp_(profile.clarity - intensity * 0.8, 2.5, 10);
  }

  return {
    mood: mood,
    intensity: intensity,
    voiceProfile: profile
  };
}

function applyMoodDelta_(baseValue, signedDelta, intensity, scale, min, max) {
  return round_(clamp_(Number(baseValue) + Number(signedDelta || 0) * Number(intensity) * Number(scale), min, max), 3);
}

function findMood_(moodKeyOrLabel) {
  const key = slug_(moodKeyOrLabel || 'neutral').replace(/-/g, '_');
  return BELAVADOS_MOOD_CATALOG.filter(function (mood) {
    return mood.key === key || slug_(mood.label).replace(/-/g, '_') === key;
  })[0] || BELAVADOS_MOOD_CATALOG[0];
}

function buildDefaultSynthPatch_(voiceProfile, mood, request) {
  const p = sanitizeVoiceProfile_(voiceProfile || {});
  const internal = deriveInternalParameters_(p);
  const moodInfo = mood || BELAVADOS_MOOD_CATALOG[0];

  const baseFrequency = clamp_(Number(request.baseFrequencyHz || mapRange_(p.pitch, 0, 10, 90, 240)), 70, 320);
  const brightness = clamp_(Number(request.brightness || moodInfo.brightness || mapRange_(p.clarity, 0, 10, 0.25, 0.85)), 0, 1);
  const roughMix = clamp_(Number(request.roughMix || mapRange_(p.roughness, 0, 10, 0, 0.34)), 0, 1);
  const breathMix = clamp_(Number(request.breathMix || mapRange_(p.breath, 0, 10, 0, 0.32)), 0, 1);
  const bodyMix = clamp_(Number(request.bodyMix || mapRange_(p.resonance, 0, 10, 0.12, 0.48)), 0, 1);

  return {
    manifestVersion: 'belavados.voice.synth.patch.v1',
    createdAt: new Date().toISOString(),
    userFacingRule: 'Show sliders such as Voice Core, Body Resonance, Gruff Edge, Soft Breath, and Singing Harmony Guide. Hide oscillator waveform names unless advanced mode is enabled.',
    baseFrequencyHz: round_(baseFrequency, 3),
    vibratoRateHz: round_(clamp_(Number(request.vibratoRateHz || 4.5 + moodInfo.vibrato * 7), 0, 12), 3),
    vibratoDepthCents: round_(clamp_(Number(request.vibratoDepthCents || mapRange_(p.inflection, 0, 10, 2, 65) + moodInfo.vibrato * 45), 0, 120), 3),
    oscillatorBank: [
      {
        key: 'voiceCore',
        userFacingName: 'Voice Core',
        internalWaveform: chooseCoreWaveform_(p, moodInfo),
        frequencyRatio: 1,
        gain: 0.72
      },
      {
        key: 'bodyResonance',
        userFacingName: 'Body Resonance',
        internalWaveform: 'triangle',
        frequencyRatio: 0.5,
        gain: round_(bodyMix, 4)
      },
      {
        key: 'roughEdge',
        userFacingName: 'Gruff Edge',
        internalWaveform: p.roughness > 6.5 ? 'sawtooth' : 'square',
        frequencyRatio: 1.997,
        gain: round_(roughMix, 4)
      },
      {
        key: 'breathAir',
        userFacingName: 'Soft Breath',
        internalWaveform: 'noise',
        frequencyRatio: 1,
        gain: round_(breathMix, 4)
      },
      {
        key: 'harmonyGuide',
        userFacingName: 'Singing Harmony Guide',
        internalWaveform: 'sine',
        frequencyRatio: request.harmonyInterval === 'fifth' ? 1.5 : 1.25,
        gain: round_(clamp_(Number(request.harmonyMix || 0), 0, 1), 4)
      }
    ],
    filters: {
      highPassHz: round_(clamp_(Number(request.filterHighPassHz || mapRange_(p.throatDepth, 0, 10, 95, 45)), 20, 800), 3),
      lowPassHz: round_(clamp_(Number(request.filterLowPassHz || mapRange_(brightness, 0, 1, 1700, 9800)), 600, 12000), 3),
      nasalBandHz: round_(mapRange_(p.nasality, 0, 10, 650, 1300), 3),
      nasalAmount: round_(mapRange_(p.nasality, 0, 10, 0, 0.7), 4),
      formantShift: internal.formantShift
    },
    envelope: {
      attackMs: round_(mapRange_(p.projection, 0, 10, 42, 8), 3),
      decayMs: 80,
      sustain: round_(mapRange_(p.projection, 0, 10, 0.45, 0.82), 4),
      releaseMs: round_(mapRange_(p.pauseControl, 0, 10, 70, 260), 3)
    },
    effects: {
      compressorAmount: round_(mapRange_(p.projection, 0, 10, 0.15, 0.72), 4),
      reverbAmount: round_(clamp_(Number(request.reverbAmount || 0.05 + (10 - p.clarity) * 0.015), 0, 1), 4),
      delayAmount: round_(clamp_(Number(request.delayAmount || 0), 0, 1), 4),
      distortionAmount: round_(mapRange_(p.roughness, 0, 10, 0, 0.22), 4)
    },
    mood: {
      key: moodInfo.key,
      label: moodInfo.label
    }
  };
}

function chooseCoreWaveform_(profile, moodInfo) {
  if (profile.roughness > 7 || moodInfo.key === 'rage' || moodInfo.key === 'menace') return 'triangle';
  if (profile.clarity > 7 && profile.breath < 3) return 'sine';
  if (profile.inflection > 7) return 'triangle';
  return 'sine';
}

function sanitizeSynthPatch_(patch) {
  const clean = Object.assign({}, patch || {});

  clean.manifestVersion = clean.manifestVersion || 'belavados.voice.synth.patch.v1';
  clean.baseFrequencyHz = clamp_(Number(clean.baseFrequencyHz || 155), 70, 320);
  clean.vibratoRateHz = clamp_(Number(clean.vibratoRateHz || 5.3), 0, 12);
  clean.vibratoDepthCents = clamp_(Number(clean.vibratoDepthCents || 18), 0, 120);

  if (!Array.isArray(clean.oscillatorBank)) {
    clean.oscillatorBank = buildDefaultSynthPatch_(getDefaultVoiceProfile_(), BELAVADOS_MOOD_CATALOG[0], {}).oscillatorBank;
  }

  clean.oscillatorBank = clean.oscillatorBank.map(function (osc, index) {
    const schema = BELAVADOS_SYNTH_PATCH_SCHEMA.oscillatorBank.filter(function (item) {
      return item.key === osc.key;
    })[0] || BELAVADOS_SYNTH_PATCH_SCHEMA.oscillatorBank[index] || BELAVADOS_SYNTH_PATCH_SCHEMA.oscillatorBank[0];

    const allowed = schema.allowedInternalWaveforms || ['sine'];
    const waveform = allowed.indexOf(osc.internalWaveform) !== -1 ? osc.internalWaveform : schema.defaultInternalWaveform;

    return {
      key: schema.key,
      userFacingName: schema.userFacingName,
      internalWaveform: waveform,
      frequencyRatio: clamp_(Number(osc.frequencyRatio || 1), 0.125, 8),
      gain: clamp_(Number(osc.gain || 0), 0, 1)
    };
  });

  clean.filters = Object.assign({
    highPassHz: 65,
    lowPassHz: 6400,
    nasalBandHz: 900,
    nasalAmount: 0,
    formantShift: 0
  }, clean.filters || {});

  clean.filters.highPassHz = clamp_(Number(clean.filters.highPassHz), 20, 800);
  clean.filters.lowPassHz = clamp_(Number(clean.filters.lowPassHz), 600, 12000);
  clean.filters.nasalBandHz = clamp_(Number(clean.filters.nasalBandHz), 500, 1600);
  clean.filters.nasalAmount = clamp_(Number(clean.filters.nasalAmount), 0, 1);
  clean.filters.formantShift = clamp_(Number(clean.filters.formantShift), -1, 1);

  clean.envelope = Object.assign({
    attackMs: 18,
    decayMs: 80,
    sustain: 0.7,
    releaseMs: 130
  }, clean.envelope || {});

  clean.envelope.attackMs = clamp_(Number(clean.envelope.attackMs), 0, 500);
  clean.envelope.decayMs = clamp_(Number(clean.envelope.decayMs), 0, 1000);
  clean.envelope.sustain = clamp_(Number(clean.envelope.sustain), 0, 1);
  clean.envelope.releaseMs = clamp_(Number(clean.envelope.releaseMs), 0, 1500);

  clean.effects = Object.assign({
    compressorAmount: 0.35,
    reverbAmount: 0.08,
    delayAmount: 0,
    distortionAmount: 0
  }, clean.effects || {});

  clean.effects.compressorAmount = clamp_(Number(clean.effects.compressorAmount), 0, 1);
  clean.effects.reverbAmount = clamp_(Number(clean.effects.reverbAmount), 0, 1);
  clean.effects.delayAmount = clamp_(Number(clean.effects.delayAmount), 0, 1);
  clean.effects.distortionAmount = clamp_(Number(clean.effects.distortionAmount), 0, 1);

  return clean;
}

function maybeSaveInlineInputAudio_(request) {
  const raw = request.inputAudioBase64 || request.sourceAudioBase64 || request.audioBase64 || '';
  if (!raw) return null;

  const format = normalizeAudioFormat_(request.inputAudioFormat || request.format || request.mimeType || 'wav');
  if (format.key !== 'mp3' && format.key !== 'wav') return null;

  const saved = saveAudioExport_(Object.assign({}, request, {
    audioBase64: raw,
    format: format.key,
    kind: 'input-audio-source',
    source: 'inline-render-request'
  }));

  return saved.ok ? saved.export : null;
}

function sanitizeOutputFormats_(formats) {
  let arr = Array.isArray(formats) ? formats : String(formats || '').split(',');
  arr = arr.map(function (item) {
    return normalizeAudioFormat_(String(item || '').trim()).key;
  }).filter(function (item, index, self) {
    return item && self.indexOf(item) === index;
  });

  if (!arr.length) arr = ['mp3', 'wav', 'json'];
  return arr.filter(function (item) {
    return ['mp3', 'wav', 'json'].indexOf(item) !== -1;
  });
}

function outputWanted_(request, format) {
  const arr = sanitizeOutputFormats_(request.outputFormats || request.outputs || request.output || ['mp3', 'wav', 'json']);
  return arr.indexOf(format) !== -1;
}

function normalizeAudioFormat_(value) {
  const raw = String(value || '').toLowerCase();
  const compact = raw.indexOf('/') !== -1 ? raw.split('/').pop() : raw.replace(/^\./, '');

  if (raw.indexOf('mpeg') !== -1 || compact === 'mp3' || compact === 'mpeg') {
    return BELAVADOS_AUDIO_FORMATS[0];
  }

  if (raw.indexOf('wav') !== -1 || raw.indexOf('wave') !== -1 || compact === 'wav' || compact === 'x-wav') {
    return BELAVADOS_AUDIO_FORMATS[1];
  }

  if (raw.indexOf('json') !== -1 || compact === 'json') {
    return BELAVADOS_AUDIO_FORMATS[2];
  }

  return BELAVADOS_AUDIO_FORMATS.filter(function (f) { return f.key === raw; })[0] || BELAVADOS_AUDIO_FORMATS[1];
}

function decodeBase64Bytes_(raw) {
  let text = String(raw || '').trim();

  if (text.indexOf('base64,') !== -1) {
    text = text.split('base64,').pop();
  }

  text = text.replace(/\s/g, '');

  try {
    return Utilities.base64Decode(text);
  } catch (err) {
    return Utilities.base64DecodeWebSafe(text);
  }
}

function buildVoiceExportFilename_(request, extension) {
  extension = String(extension || 'json').replace(/^\./, '').toLowerCase();

  const context = request.characterContext || request.context || {};
  const characterName = context.characterName || context.name || request.characterName || request.name || 'belavados-voice';
  const mood = request.mood || request.emotion || context.emotion || 'neutral';
  const kind = request.kind || request.mode || request.type || '';

  let base = safeFilename_(String(characterName).replace(/\s+/g, '_'));
  const suffixParts = [mood, kind].filter(Boolean).map(function (part) {
    return safeFilename_(String(part).replace(/\s+/g, '-')).toLowerCase();
  });

  if (suffixParts.length) {
    base += '-' + suffixParts.join('-');
  }

  if (base.toLowerCase().slice(-(extension.length + 1)) !== '.' + extension) {
    base += '.' + extension;
  }

  return base;
}

function applyDownloadSharing_(file, makePublicValue) {
  const configured = String(getScriptProperty_('PUBLIC_DOWNLOADS_DEFAULT') || 'true').toLowerCase();
  const defaultPublic = configured !== 'false';
  const makePublic = makePublicValue === undefined || makePublicValue === null || makePublicValue === ''
    ? defaultPublic
    : (makePublicValue === true || String(makePublicValue).toLowerCase() === 'true');

  if (!makePublic) return;

  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (err) {
    // If a domain policy blocks public sharing, Drive URLs may still work for the owner.
  }
}

function buildDriveDownloadUrl_(fileId) {
  return 'https://drive.google.com/uc?export=download&id=' + encodeURIComponent(fileId);
}

function getVoiceExportFolders_() {
  const folders = getFolders_();
  const audio = getOrCreateChildFolder_(folders.root, 'audio-exports');
  const json = getOrCreateChildFolder_(folders.root, 'json-exports');
  const jobs = getOrCreateChildFolder_(folders.root, 'voice-render-jobs');
  const stems = getOrCreateChildFolder_(folders.root, 'acapella-stems');

  return {
    root: folders.root,
    audio: audio,
    json: json,
    jobs: jobs,
    stems: stems
  };
}

function getVoiceRenderEngineUrl_() {
  return getScriptProperty_('VOICE_RENDER_ENGINE_URL') || getScriptProperty_('TTS_ENGINE_URL') || '';
}

function getVoiceRenderEngineKey_() {
  return getScriptProperty_('VOICE_RENDER_ENGINE_KEY') || getScriptProperty_('TTS_ENGINE_KEY') || '';
}

function getVoiceRenderEngineInfo_() {
  return {
    appsScriptBackend: true,
    renderEngineConfigured: Boolean(getVoiceRenderEngineUrl_()),
    renderEngineUrlProperty: 'VOICE_RENDER_ENGINE_URL',
    fallbackEngineUrlProperty: 'TTS_ENGINE_URL',
    canStoreMp3: true,
    canStoreWav: true,
    canStoreJson: true,
    canNativeEncodeMp3: false,
    canGenerateSimpleWavGuide: true,
    expectedExternalEngineContract: {
      input: 'job.payload',
      output: {
        status: 'queued | processing | complete | failed',
        exports: [
          {
            format: 'mp3 | wav | json',
            mimeType: 'audio/mpeg | audio/wav | application/json',
            fileName: 'optional string',
            base64: 'optional base64 data',
            dataUri: 'optional data URI',
            url: 'optional engine-hosted URL'
          }
        ],
        audioBase64: 'optional shortcut for one audio file',
        audioMimeType: 'optional shortcut mime type',
        json: 'optional returned manifest'
      }
    }
  };
}

function forwardVoiceRenderJobToEngine_(engineUrl, job, request) {
  try {
    const headers = {
      'Content-Type': 'application/json'
    };

    const key = getVoiceRenderEngineKey_();
    if (key) headers.Authorization = 'Bearer ' + key;

    const response = UrlFetchApp.fetch(engineUrl, {
      method: 'post',
      muteHttpExceptions: true,
      contentType: 'application/json',
      headers: headers,
      payload: JSON.stringify({
        app: APP_VERSION,
        runtimeAddon: 'belavados.voice.export.singing.acapella.synth.v1',
        job: job
      })
    });

    const code = response.getResponseCode();
    const text = response.getContentText();

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      parsed = { raw: text };
    }

    return {
      ok: code >= 200 && code < 300,
      statusCode: code,
      response: parsed
    };
  } catch (err) {
    return {
      ok: false,
      error: String(err.message || err)
    };
  }
}

function saveReturnedEngineExports_(forwarded, job, request) {
  if (!forwarded || !forwarded.ok || !forwarded.response) return [];

  const response = forwarded.response;
  const exports = [];

  const returnedList = Array.isArray(response.exports) ? response.exports : [];

  if (response.audioBase64 || response.audioDataUri || response.dataUri) {
    returnedList.push({
      format: response.audioFormat || response.format || response.audioMimeType || response.mimeType || 'wav',
      mimeType: response.audioMimeType || response.mimeType || '',
      base64: response.audioBase64 || '',
      dataUri: response.audioDataUri || response.dataUri || '',
      fileName: response.fileName || response.filename || ''
    });
  }

  if (response.json || response.manifest || response.patch) {
    const savedJson = saveJsonExport_({
      fileName: response.jsonFileName || buildVoiceExportFilename_({
        characterContext: job.payload.characterContext,
        mood: job.payload.mood && job.payload.mood.key,
        kind: job.payload.mode + '-engine-response'
      }, 'json'),
      kind: 'engine-returned-json',
      payload: response.json || response.manifest || response.patch,
      makePublic: request.makePublic
    });
    if (savedJson.ok) exports.push(savedJson.export);
  }

  returnedList.forEach(function (item) {
    if (!(item.base64 || item.dataUri)) return;

    const format = normalizeAudioFormat_(item.format || item.mimeType || item.fileName || 'wav');
    if (format.key === 'json') {
      const savedJson = saveJsonExport_({
        fileName: item.fileName || buildVoiceExportFilename_({
          characterContext: job.payload.characterContext,
          mood: job.payload.mood && job.payload.mood.key,
          kind: job.payload.mode
        }, 'json'),
        kind: 'engine-returned-json',
        payload: item.payload || item.json || {},
        makePublic: request.makePublic
      });
      if (savedJson.ok) exports.push(savedJson.export);
      return;
    }

    const saved = saveAudioExport_(Object.assign({}, request, {
      audioBase64: item.base64 || item.dataUri,
      format: format.key,
      fileName: item.fileName || item.filename || buildVoiceExportFilename_({
        characterContext: job.payload.characterContext,
        mood: job.payload.mood && job.payload.mood.key,
        kind: job.payload.mode
      }, format.extension),
      kind: 'engine-returned-' + job.payload.mode,
      renderJobId: job.id,
      characterContext: job.payload.characterContext,
      voiceProfile: job.payload.voiceProfile,
      synthPatch: job.payload.synthPatch,
      mood: job.payload.mood && job.payload.mood.key,
      source: 'external-render-engine',
      makePublic: request.makePublic
    }));

    if (saved.ok) exports.push(saved.export);
  });

  return exports;
}

function summarizePayloadForRecord_(payload) {
  const json = JSON.stringify(payload || {});
  return {
    topLevelKeys: payload && typeof payload === 'object' ? Object.keys(payload).slice(0, 40) : [],
    approxChars: json.length,
    preview: json.slice(0, 500)
  };
}

function estimateGuideDuration_(text) {
  const words = String(text || 'ah').trim().split(/\s+/).filter(Boolean).length || 1;
  return clamp_(1.2 + words * 0.28, 1.5, 18);
}

function makeSynthGuideWavBytes_(patch, options) {
  const sampleRate = Number(options.sampleRate || 22050);
  const durationSeconds = Number(options.durationSeconds || 2);
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const bytes = [];
  const dataBytes = totalSamples * 2;

  pushAscii_(bytes, 'RIFF');
  pushUint32LE_(bytes, 36 + dataBytes);
  pushAscii_(bytes, 'WAVE');
  pushAscii_(bytes, 'fmt ');
  pushUint32LE_(bytes, 16);
  pushUint16LE_(bytes, 1);
  pushUint16LE_(bytes, 1);
  pushUint32LE_(bytes, sampleRate);
  pushUint32LE_(bytes, sampleRate * 2);
  pushUint16LE_(bytes, 2);
  pushUint16LE_(bytes, 16);
  pushAscii_(bytes, 'data');
  pushUint32LE_(bytes, dataBytes);

  const baseFrequency = Number(patch.baseFrequencyHz || 155);
  const vibratoRate = Number(patch.vibratoRateHz || 5.3);
  const vibratoDepth = Number(patch.vibratoDepthCents || 18);
  const attack = Number(patch.envelope && patch.envelope.attackMs || 18) / 1000;
  const release = Number(patch.envelope && patch.envelope.releaseMs || 130) / 1000;
  const sustain = Number(patch.envelope && patch.envelope.sustain || 0.7);
  const text = String(options.text || 'ah');
  const phraseSeed = textSeed_(text);
  const tempoBpm = Number(options.tempoBpm || 92);
  const beatSeconds = 60 / tempoBpm;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const env = envelopeAt_(t, durationSeconds, attack, release, sustain);
    const noteRatio = options.singing ? singingNoteRatioAt_(t, beatSeconds, phraseSeed) : speechNoteRatioAt_(t, phraseSeed);
    const vibrato = centsToRatio_(Math.sin(2 * Math.PI * vibratoRate * t) * vibratoDepth);
    const fundamental = baseFrequency * noteRatio * vibrato;
    let sample = 0;

    for (let j = 0; j < patch.oscillatorBank.length; j++) {
      const osc = patch.oscillatorBank[j];
      const gain = Number(osc.gain || 0);
      if (gain <= 0) continue;

      if (osc.internalWaveform === 'noise') {
        sample += (Math.random() * 2 - 1) * gain * 0.36;
      } else {
        const freq = fundamental * Number(osc.frequencyRatio || 1);
        sample += waveformSample_(osc.internalWaveform, freq, t) * gain;
      }
    }

    sample = applySimpleDistortion_(sample, patch.effects && patch.effects.distortionAmount || 0);
    sample = sample * env * 0.42;
    sample = clamp_(sample, -1, 1);

    const value = Math.round(sample * 32767);
    pushInt16LE_(bytes, value);
  }

  return bytes;
}

function textSeed_(text) {
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    seed = (seed + text.charCodeAt(i) * (i + 1)) % 9973;
  }
  return seed || 137;
}

function speechNoteRatioAt_(t, seed) {
  return 1 + 0.018 * Math.sin(2 * Math.PI * (1.3 + (seed % 7) * 0.08) * t)
    + 0.009 * Math.sin(2 * Math.PI * (3.1 + (seed % 5) * 0.13) * t);
}

function singingNoteRatioAt_(t, beatSeconds, seed) {
  const scale = [0, 2, 4, 5, 7, 9, 11, 12];
  const step = Math.floor(t / beatSeconds) + seed;
  const semitone = scale[((step % scale.length) + scale.length) % scale.length];
  return Math.pow(2, semitone / 12);
}

function centsToRatio_(cents) {
  return Math.pow(2, Number(cents || 0) / 1200);
}

function waveformSample_(waveform, frequency, t) {
  const phase = (frequency * t) % 1;

  switch (waveform) {
    case 'square':
      return phase < 0.5 ? 1 : -1;
    case 'triangle':
      return 1 - 4 * Math.abs(Math.round(phase - 0.25) - (phase - 0.25));
    case 'sawtooth':
      return 2 * phase - 1;
    case 'sine':
    default:
      return Math.sin(2 * Math.PI * frequency * t);
  }
}

function envelopeAt_(t, duration, attack, release, sustain) {
  if (attack > 0 && t < attack) return t / attack;
  if (release > 0 && t > duration - release) return Math.max(0, (duration - t) / release);
  return sustain;
}

function applySimpleDistortion_(sample, amount) {
  amount = clamp_(Number(amount || 0), 0, 1);
  if (amount <= 0) return sample;
  const drive = 1 + amount * 18;
  return Math.tanh(sample * drive) / Math.tanh(drive);
}

function pushAscii_(arr, text) {
  for (let i = 0; i < text.length; i++) {
    pushByte_(arr, text.charCodeAt(i) & 255);
  }
}

function pushUint16LE_(arr, value) {
  pushByte_(arr, value & 255);
  pushByte_(arr, (value >> 8) & 255);
}

function pushInt16LE_(arr, value) {
  if (value < 0) value = 0x10000 + value;
  pushUint16LE_(arr, value);
}

function pushUint32LE_(arr, value) {
  pushByte_(arr, value & 255);
  pushByte_(arr, (value >> 8) & 255);
  pushByte_(arr, (value >> 16) & 255);
  pushByte_(arr, (value >> 24) & 255);
}

function pushByte_(arr, value) {
  value = value & 255;
  arr.push(value > 127 ? value - 256 : value);
}

/***************************************************************
 * Updated frontend POST examples:
 *
 * Save MP3 from frontend/external render:
 * {
 *   "action": "audio.export.save",
 *   "format": "mp3",
 *   "audioBase64": "BASE64_MP3_HERE",
 *   "characterContext": { "characterName": "Urg-U'rgugar Mudgrip" },
 *   "mood": "fear"
 * }
 *
 * Create singing render job:
 * {
 *   "action": "voice.singing.create",
 *   "lyrics": "The hungry gods await beneath the storm",
 *   "tempoBpm": 84,
 *   "key": "D minor",
 *   "outputFormats": ["mp3", "wav", "json"],
 *   "mood": "awe"
 * }
 *
 * Generate acapella job:
 * {
 *   "action": "voice.acapella.create",
 *   "lyrics": "Rise, tide, rise",
 *   "harmonyCount": 2,
 *   "outputFormats": ["wav", "mp3", "json"]
 * }
 *
 * Create backend WAV synth guide:
 * {
 *   "action": "voice.synth.renderWav",
 *   "text": "This is what I sound like.",
 *   "mood": "confidence",
 *   "durationSeconds": 4
 * }
 ***************************************************************/

    return {
      "doGet": (typeof doGet === 'function' ? doGet : null),
      "doPost": (typeof doPost === 'function' ? doPost : null),
      "doOptions": (typeof doOptions === 'function' ? doOptions : null),
      "routeRequest_": (typeof routeRequest_ === 'function' ? routeRequest_ : null),
      "setup_": (typeof setup_ === 'function' ? setup_ : null),
      "getHealth_": (typeof getHealth_ === 'function' ? getHealth_ : null)
    };
  })();
  return TDM92_MODULE_CACHE.belavados;
}


/* ==========================================================================
 * Wrapped source module: PlayerZone Encounters Roleplaying Board
 * ========================================================================== */
function tdm92_module_playerzone_() {
  if (TDM92_MODULE_CACHE.playerzone) return TDM92_MODULE_CACHE.playerzone;
  TDM92_MODULE_CACHE.playerzone = (function () {
/******************************************************************************
 * PlayerZone_Encounters_Roleplaying-Board.gs
 * ---------------------------------------------------------------------------
 * One-file Google Apps Script web app for a D&D-style PlayerZone encounter,
 * quest, and dungeon-crawling board.
 *
 * Deploy:
 *   1) Apps Script > New project.
 *   2) Paste this entire file into Code.gs or keep this filename locally.
 *   3) Deploy > New deployment > Web app.
 *   4) Execute as: Me. Access: Anyone with link, or your preferred setting.
 *   5) Open the /exec URL. DM tools appear only with hash/token: #dm-session.
 *
 * Storage:
 *   Uses Script Properties for persistent session state.
 *   This is good for small private games. It is not a websocket server.
 *   The page polls for updates every ~1.5 seconds.
 ******************************************************************************/

var PLAYERZONE_APP_NAME = 'PlayerZone_Encounters_Roleplaying-Board';
var PLAYERZONE_STATE_KEY = 'PLAYERZONE_ENCOUNTER_STATE_V1';
var PLAYERZONE_DM_HASH = '#dm-session';
var PLAYERZONE_MAX_PLAYERS = 10;
var PLAYERZONE_GRID_FEET = 5;
var PLAYERZONE_POLL_MS = 1500;
var PLAYERZONE_MAX_LOG = 120;

function doGet(e) {
  ensureState_();
  return HtmlService.createHtmlOutput(getPlayerZoneHtml_())
    .setTitle(PLAYERZONE_APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

function apiPing() {
  return {
    ok: true,
    app: PLAYERZONE_APP_NAME,
    serverTime: new Date().toISOString(),
    maxPlayers: PLAYERZONE_MAX_PLAYERS,
    gridFeet: PLAYERZONE_GRID_FEET
  };
}

function apiLoadState(viewer) {
  var state = ensureState_();
  var isDM = isDM_(viewer);
  return sanitizeStateForViewer_(state, viewer || {}, isDM);
}

function apiJoin(payload) {
  payload = payload || {};
  var name = cleanText_(payload.playerName || 'Player', 32);
  var playerId = cleanId_(payload.playerId || makeId_('player'));
  var requestedSlot = parseInt(payload.slot || 0, 10);
  var dm = isDM_(payload);

  return mutateState_(function(state) {
    var players = state.players || {};
    var playerIds = Object.keys(players);
    if (!players[playerId] && playerIds.length >= PLAYERZONE_MAX_PLAYERS && !dm) {
      throw new Error('The table already has ' + PLAYERZONE_MAX_PLAYERS + ' player slots in use.');
    }

    var slot = requestedSlot || findOpenPlayerSlot_(state, playerId);
    players[playerId] = players[playerId] || {
      id: playerId,
      createdAt: nowIso_(),
      ownedTokenIds: [],
      controlledCharacterIds: []
    };
    players[playerId].name = name;
    players[playerId].slot = slot;
    players[playerId].isDM = !!dm;
    players[playerId].lastSeenAt = nowIso_();
    state.players = players;
    addLog_(state, 'system', name + ' joined PlayerZone' + (dm ? ' as DM.' : '.'));
    return sanitizeStateForViewer_(state, payload, dm);
  });
}

function apiHeartbeat(payload) {
  payload = payload || {};
  var playerId = cleanId_(payload.playerId || '');
  if (!playerId) return apiLoadState(payload);
  return mutateState_(function(state) {
    if (state.players && state.players[playerId]) {
      state.players[playerId].lastSeenAt = nowIso_();
    }
    return sanitizeStateForViewer_(state, payload, isDM_(payload));
  });
}

function apiImportCharacter(payload) {
  payload = payload || {};
  var sheet = normalizeJsonInput_(payload.characterJson || payload.sheet || payload.character || {});
  var playerId = cleanId_(payload.playerId || 'dm');
  var playerName = cleanText_(payload.playerName || 'DM', 32);
  var dm = isDM_(payload);
  var ownerPlayerId = cleanId_(payload.ownerPlayerId || playerId);
  var asDMPC = !!payload.isDMPC || dm && !!payload.dmPc;
  var asNPC = !!payload.isNPC;

  return mutateState_(function(state) {
    if (!dm && Object.keys(state.players || {}).length >= PLAYERZONE_MAX_PLAYERS && !state.players[playerId]) {
      throw new Error('No open player slot is available.');
    }

    if (!state.players[playerId]) {
      state.players[playerId] = {
        id: playerId,
        name: playerName,
        slot: findOpenPlayerSlot_(state, playerId),
        ownedTokenIds: [],
        controlledCharacterIds: [],
        createdAt: nowIso_(),
        lastSeenAt: nowIso_(),
        isDM: dm
      };
    }

    var character = extractCharacter_(sheet);
    character.id = cleanId_(payload.characterId || sheet.id || character.id || makeId_('char'));
    character.raw = sheet;
    character.ownerPlayerId = ownerPlayerId;
    character.importedBy = playerId;
    character.isDMPC = !!asDMPC;
    character.isNPC = !!asNPC;
    character.updatedAt = nowIso_();

    state.characters[character.id] = character;

    var tokenId = cleanId_(payload.tokenId || findTokenByCharacter_(state, character.id) || makeId_('token'));
    var spawn = findSpawn_(state, asNPC ? 'npc' : 'player');
    var existing = state.tokens[tokenId] || {};
    state.tokens[tokenId] = mergeObjects_(existing, {
      id: tokenId,
      characterId: character.id,
      ownerPlayerId: ownerPlayerId,
      name: character.name,
      isNPC: !!asNPC,
      isDMPC: !!asDMPC,
      x: numberOr_(existing.x, spawn.x),
      y: numberOr_(existing.y, spawn.y),
      hp: numberOr_(existing.hp, character.hp.current),
      maxHp: numberOr_(existing.maxHp, character.hp.max),
      tempHp: numberOr_(existing.tempHp, 0),
      ac: numberOr_(existing.ac, character.ac),
      speed: numberOr_(existing.speed, character.speed),
      color: existing.color || pickTokenColor_(state, tokenId),
      status: existing.status || [],
      hiddenToPlayers: !!payload.hiddenToPlayers && dm,
      updatedAt: nowIso_()
    });

    grantPlayerControl_(state, ownerPlayerId, character.id, tokenId);
    addLog_(state, 'character', character.name + ' entered the board as a circular blank token.');
    return sanitizeStateForViewer_(state, payload, dm);
  });
}

function apiImportParty(payload) {
  payload = payload || {};
  var list = normalizeJsonInput_(payload.partyJson || payload.characters || []);
  if (!Array.isArray(list)) throw new Error('Party import must be a JSON array of character sheets.');
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var nextPayload = mergeObjects_(payload, { characterJson: list[i] });
    out.push(apiImportCharacter(nextPayload));
  }
  return out.length ? out[out.length - 1] : apiLoadState(payload);
}

function apiImportMap(payload) {
  payload = payload || {};
  requireDM_(payload);
  var map = normalizeJsonInput_(payload.mapJson || payload.map || {});

  return mutateState_(function(state) {
    var normalized = extractMap_(map);
    normalized.id = cleanId_(map.id || payload.mapId || makeId_('map'));
    normalized.createdAt = state.mapsById && state.mapsById[normalized.id] ? state.mapsById[normalized.id].createdAt : nowIso_();
    normalized.updatedAt = nowIso_();
    state.mapsById = state.mapsById || {};
    state.mapsById[normalized.id] = normalized;
    state.currentMapId = normalized.id;
    if (state.mapOrder.indexOf(normalized.id) === -1) state.mapOrder.push(normalized.id);
    addLog_(state, 'map', 'DM loaded map: ' + normalized.name + ' (' + normalized.cols + ' x ' + normalized.rows + ', 5 ft squares).');
    return sanitizeStateForViewer_(state, payload, true);
  });
}

function apiSetCurrentMap(payload) {
  payload = payload || {};
  requireDM_(payload);
  var mapId = cleanId_(payload.mapId || '');
  return mutateState_(function(state) {
    if (!state.mapsById[mapId]) throw new Error('Map not found: ' + mapId);
    state.currentMapId = mapId;
    addLog_(state, 'map', 'DM switched the board to ' + state.mapsById[mapId].name + '.');
    return sanitizeStateForViewer_(state, payload, true);
  });
}

function apiImportAudio(payload) {
  payload = payload || {};
  requireDM_(payload);
  var audio = normalizeJsonInput_(payload.audioJson || payload.audio || {});
  return mutateState_(function(state) {
    var clips = Array.isArray(audio) ? audio : audio.clips || [];
    state.audio.clips = clips.map(function(c, index) {
      return {
        id: cleanId_(c.id || makeId_('clip' + index)),
        name: cleanText_(c.name || c.label || 'Clip ' + (index + 1), 64),
        url: String(c.url || c.src || ''),
        type: cleanText_(c.type || 'effect', 32),
        loop: !!c.loop,
        volume: clamp_(Number(c.volume || 0.65), 0, 1)
      };
    }).filter(function(c) { return !!c.url; });
    addLog_(state, 'audio', 'DM loaded ' + state.audio.clips.length + ' audio clip(s).');
    return sanitizeStateForViewer_(state, payload, true);
  });
}

function apiSetScene(payload) {
  payload = payload || {};
  requireDM_(payload);
  return mutateState_(function(state) {
    state.scene = state.scene || {};
    state.scene.lighting = cleanText_(payload.lighting || state.scene.lighting || 'torch', 32);
    state.scene.soundClipId = cleanId_(payload.soundClipId || '');
    state.scene.ambience = cleanText_(payload.ambience || state.scene.ambience || 'quiet dungeon air', 80);
    state.scene.fog = clamp_(Number(payload.fog || 0), 0, 1);
    state.scene.updatedAt = nowIso_();
    addLog_(state, 'scene', 'DM shifted the scene: ' + state.scene.lighting + ', ' + state.scene.ambience + '.');
    return sanitizeStateForViewer_(state, payload, true);
  });
}

function apiMoveToken(payload) {
  payload = payload || {};
  var tokenId = cleanId_(payload.tokenId || '');
  var dx = parseInt(payload.dx || 0, 10);
  var dy = parseInt(payload.dy || 0, 10);
  var directX = payload.x !== undefined ? parseInt(payload.x, 10) : null;
  var directY = payload.y !== undefined ? parseInt(payload.y, 10) : null;

  return mutateState_(function(state) {
    var token = state.tokens[tokenId];
    if (!token) throw new Error('Token not found.');
    if (!canControlToken_(state, payload, token)) throw new Error('You do not control this token.');

    var map = getCurrentMap_(state);
    var nextX = directX !== null ? directX : token.x + dx;
    var nextY = directY !== null ? directY : token.y + dy;
    nextX = clamp_(nextX, 0, map.cols - 1);
    nextY = clamp_(nextY, 0, map.rows - 1);

    var movement = Math.abs(nextX - token.x) + Math.abs(nextY - token.y);
    var feet = movement * PLAYERZONE_GRID_FEET;
    if (!isDM_(payload) && isBlockedSquare_(map, nextX, nextY)) {
      throw new Error('That square is blocked. Unlock, open, disarm, or ask the DM.');
    }

    token.x = nextX;
    token.y = nextY;
    token.updatedAt = nowIso_();
    token.movedFeetThisTurn = numberOr_(token.movedFeetThisTurn, 0) + feet;
    addLog_(state, 'move', token.name + ' moved ' + feet + ' ft to square ' + (nextX + 1) + ',' + (nextY + 1) + '.');
    return sanitizeStateForViewer_(state, payload, isDM_(payload));
  });
}

function apiSetToken(payload) {
  payload = payload || {};
  return mutateState_(function(state) {
    var tokenId = cleanId_(payload.tokenId || '');
    var token = state.tokens[tokenId];
    if (!token) throw new Error('Token not found.');
    if (!canControlToken_(state, payload, token) && !isDM_(payload)) throw new Error('You do not control this token.');

    if (payload.hp !== undefined) token.hp = Number(payload.hp);
    if (payload.tempHp !== undefined) token.tempHp = Number(payload.tempHp);
    if (payload.status !== undefined) token.status = normalizeStatusList_(payload.status);
    if (payload.color !== undefined) token.color = cleanText_(payload.color, 32);
    if (payload.hiddenToPlayers !== undefined && isDM_(payload)) token.hiddenToPlayers = !!payload.hiddenToPlayers;
    token.updatedAt = nowIso_();
    addLog_(state, 'token', token.name + ' token was updated.');
    return sanitizeStateForViewer_(state, payload, isDM_(payload));
  });
}

function apiRoll(payload) {
  payload = payload || {};
  var dice = cleanDiceExpression_(payload.dice || '1d20');
  var result = rollDice_(dice, payload.mode || 'normal');
  var label = cleanText_(payload.label || 'roll', 64);
  var tokenId = cleanId_(payload.tokenId || '');
  var botId = cleanId_(payload.botId || 'onyx-oracle');

  return mutateState_(function(state) {
    var tokenName = tokenId && state.tokens[tokenId] ? state.tokens[tokenId].name : cleanText_(payload.playerName || 'Someone', 32);
    var bot = findDiceBot_(state, botId);
    var line = bot.name + ' rolled for ' + tokenName + ': ' + label + ' = ' + result.total + ' [' + result.detail + ']';
    addLog_(state, 'roll', line, { dice: dice, total: result.total, botId: bot.id, botMood: bot.mood });
    state.lastRoll = {
      by: tokenName,
      dice: dice,
      label: label,
      total: result.total,
      detail: result.detail,
      bot: bot,
      createdAt: nowIso_()
    };
    return { state: sanitizeStateForViewer_(state, payload, isDM_(payload)), roll: state.lastRoll };
  });
}

function apiSkillCheck(payload) {
  payload = payload || {};
  var tokenId = cleanId_(payload.tokenId || '');
  var skillName = cleanText_(payload.skill || 'Skill', 40);
  var mode = payload.mode || 'normal';

  return mutateState_(function(state) {
    var token = state.tokens[tokenId];
    if (!token) throw new Error('Token not found.');
    if (!canControlToken_(state, payload, token)) throw new Error('You do not control this token.');
    var character = state.characters[token.characterId] || {};
    var mod = getSkillMod_(character, skillName);
    var result = rollDice_('1d20+' + mod, mode);
    addLog_(state, 'skill', token.name + ' rolled ' + skillName + ': ' + result.total + ' [' + result.detail + '].');
    return { state: sanitizeStateForViewer_(state, payload, isDM_(payload)), roll: result };
  });
}

function apiAttack(payload) {
  payload = payload || {};
  var tokenId = cleanId_(payload.tokenId || '');
  var targetId = cleanId_(payload.targetId || '');
  var attackIndex = parseInt(payload.attackIndex || 0, 10);
  var mode = payload.mode || 'normal';

  return mutateState_(function(state) {
    var attacker = state.tokens[tokenId];
    var target = state.tokens[targetId];
    if (!attacker) throw new Error('Attacker token not found.');
    if (!target) throw new Error('Target token not found.');
    if (!canControlToken_(state, payload, attacker)) throw new Error('You do not control this token.');

    var character = state.characters[attacker.characterId] || {};
    var attack = (character.attacks || [])[attackIndex] || defaultAttack_(character);
    var hitRoll = rollDice_('1d20+' + numberOr_(attack.toHit, 0), mode);
    var damageRoll = rollDice_(attack.damage || '1d4', 'normal');
    var hit = hitRoll.total >= numberOr_(target.ac, 10);
    if (hit && payload.applyDamage !== false) target.hp = Math.max(0, numberOr_(target.hp, 1) - damageRoll.total);
    var message = attacker.name + ' attacks ' + target.name + ' with ' + attack.name + ': ' + hitRoll.total + ' vs AC ' + target.ac + (hit ? ', HIT for ' + damageRoll.total + ' damage.' : ', miss.');
    addLog_(state, 'attack', message);
    return {
      state: sanitizeStateForViewer_(state, payload, isDM_(payload)),
      attack: { hit: hit, attackRoll: hitRoll, damageRoll: damageRoll, targetHp: target.hp }
    };
  });
}

function apiCastSpell(payload) {
  payload = payload || {};
  var tokenId = cleanId_(payload.tokenId || '');
  var targetId = cleanId_(payload.targetId || '');
  var spellIndex = parseInt(payload.spellIndex || 0, 10);
  var mode = payload.mode || 'normal';

  return mutateState_(function(state) {
    var caster = state.tokens[tokenId];
    if (!caster) throw new Error('Caster token not found.');
    if (!canControlToken_(state, payload, caster)) throw new Error('You do not control this token.');
    var character = state.characters[caster.characterId] || {};
    var spell = (character.spells || [])[spellIndex];
    if (!spell) throw new Error('Spell not found on this sheet.');

    var target = targetId ? state.tokens[targetId] : null;
    var castLine = caster.name + ' casts ' + spell.name;
    var spellResult = { name: spell.name };

    if (spell.attackBonus !== undefined || spell.toHit !== undefined) {
      var hitRoll = rollDice_('1d20+' + numberOr_(spell.attackBonus, numberOr_(spell.toHit, 0)), mode);
      spellResult.attackRoll = hitRoll;
      castLine += ' with spell attack ' + hitRoll.total;
      if (target) {
        var hit = hitRoll.total >= numberOr_(target.ac, 10);
        spellResult.hit = hit;
        castLine += ' vs ' + target.name + ' AC ' + target.ac + (hit ? ' and hits' : ' and misses');
      }
    }
    if (spell.damage) {
      var dmg = rollDice_(spell.damage, 'normal');
      spellResult.damageRoll = dmg;
      castLine += ', damage ' + dmg.total + ' [' + dmg.detail + ']';
      if (target && spellResult.hit !== false && payload.applyDamage !== false) {
        target.hp = Math.max(0, numberOr_(target.hp, 1) - dmg.total);
        spellResult.targetHp = target.hp;
      }
    }
    if (spell.save) {
      castLine += ', save: ' + spell.save;
    }
    castLine += '.';
    addLog_(state, 'spell', castLine);
    return { state: sanitizeStateForViewer_(state, payload, isDM_(payload)), spell: spellResult };
  });
}

function apiInteract(payload) {
  payload = payload || {};
  var tokenId = cleanId_(payload.tokenId || '');
  var action = cleanText_(payload.action || 'interact', 32).toLowerCase();
  var targetId = cleanId_(payload.targetId || '');
  var skill = cleanText_(payload.skill || (action === 'disable-trap' ? 'thieves tools' : 'investigation'), 40);
  var dc = parseInt(payload.dc || 12, 10);

  return mutateState_(function(state) {
    var token = state.tokens[tokenId];
    if (!token) throw new Error('Token not found.');
    if (!canControlToken_(state, payload, token)) throw new Error('You do not control this token.');
    var character = state.characters[token.characterId] || {};
    var mod = getSkillMod_(character, skill);
    var roll = rollDice_('1d20+' + mod, payload.mode || 'normal');
    var success = roll.total >= dc;
    var map = getCurrentMap_(state);

    if (success && targetId) {
      markMapFeatureResolved_(map, targetId, action);
    }
    var line = token.name + ' tries to ' + action.replace(/-/g, ' ') + ' using ' + skill + ': ' + roll.total + ' vs DC ' + dc + (success ? ' success.' : ' failure.');
    addLog_(state, 'interact', line);
    return { state: sanitizeStateForViewer_(state, payload, isDM_(payload)), roll: roll, success: success };
  });
}

function apiRollInitiative(payload) {
  payload = payload || {};
  return mutateState_(function(state) {
    var ids = Object.keys(state.tokens || {}).filter(function(id) {
      var t = state.tokens[id];
      return !t.hiddenToPlayers || isDM_(payload);
    });
    var entries = ids.map(function(id) {
      var token = state.tokens[id];
      var character = state.characters[token.characterId] || {};
      var dexMod = getAbilityMod_(character, 'dex');
      var roll = rollDice_('1d20+' + dexMod, 'normal');
      token.initiative = roll.total;
      token.movedFeetThisTurn = 0;
      return { tokenId: id, name: token.name, initiative: roll.total, detail: roll.detail };
    }).sort(function(a, b) { return b.initiative - a.initiative; });

    state.turn = { active: true, round: 1, index: 0, order: entries, updatedAt: nowIso_() };
    addLog_(state, 'initiative', 'Initiative rolled: ' + entries.map(function(e) { return e.name + ' ' + e.initiative; }).join(', ') + '.');
    return sanitizeStateForViewer_(state, payload, isDM_(payload));
  });
}

function apiEndTurn(payload) {
  payload = payload || {};
  return mutateState_(function(state) {
    if (!state.turn || !state.turn.active || !state.turn.order.length) {
      throw new Error('No active turn order.');
    }
    var active = state.turn.order[state.turn.index];
    var activeToken = state.tokens[active.tokenId];
    if (activeToken && !canControlToken_(state, payload, activeToken) && !isDM_(payload)) {
      throw new Error('Only the active token controller or DM can end this turn.');
    }
    if (activeToken) activeToken.movedFeetThisTurn = 0;
    state.turn.index += 1;
    if (state.turn.index >= state.turn.order.length) {
      state.turn.index = 0;
      state.turn.round += 1;
      addLog_(state, 'turn', 'Round ' + state.turn.round + ' begins.');
    }
    var next = state.turn.order[state.turn.index];
    addLog_(state, 'turn', 'Turn: ' + next.name + '.');
    state.turn.updatedAt = nowIso_();
    return sanitizeStateForViewer_(state, payload, isDM_(payload));
  });
}

function apiDMGenerateEncounter(payload) {
  payload = payload || {};
  requireDM_(payload);
  var difficulty = cleanText_(payload.difficulty || 'medium', 20).toLowerCase();
  var biome = cleanText_(payload.biome || 'dungeon', 40);
  var count = clamp_(parseInt(payload.count || 3, 10), 1, 12);

  return mutateState_(function(state) {
    var monsters = generateEncounterMonsters_(difficulty, biome, count);
    var spawn = findSpawn_(state, 'npc');
    monsters.forEach(function(monster, i) {
      var characterId = makeId_('npcchar');
      var tokenId = makeId_('npctoken');
      var x = clamp_(spawn.x + (i % 4), 0, getCurrentMap_(state).cols - 1);
      var y = clamp_(spawn.y + Math.floor(i / 4), 0, getCurrentMap_(state).rows - 1);
      var character = extractCharacter_(monster);
      character.id = characterId;
      character.isNPC = true;
      character.ownerPlayerId = 'dm';
      state.characters[characterId] = character;
      state.tokens[tokenId] = {
        id: tokenId,
        characterId: characterId,
        ownerPlayerId: 'dm',
        name: monster.name,
        isNPC: true,
        isDMPC: false,
        x: x,
        y: y,
        hp: monster.hp || character.hp.current,
        maxHp: monster.hp || character.hp.max,
        tempHp: 0,
        ac: monster.ac || character.ac,
        speed: monster.speed || character.speed,
        color: pickTokenColor_(state, tokenId),
        status: [],
        hiddenToPlayers: !!payload.hiddenToPlayers,
        updatedAt: nowIso_()
      };
    });
    state.encounter.active = true;
    state.encounter.biome = biome;
    state.encounter.difficulty = difficulty;
    state.encounter.updatedAt = nowIso_();
    addLog_(state, 'encounter', 'DM generated a ' + difficulty + ' ' + biome + ' encounter with ' + monsters.length + ' NPC/imposter token(s).');
    return sanitizeStateForViewer_(state, payload, true);
  });
}

function apiDMAddFeature(payload) {
  payload = payload || {};
  requireDM_(payload);
  return mutateState_(function(state) {
    var map = getCurrentMap_(state);
    var feature = {
      id: cleanId_(payload.id || makeId_('feature')),
      type: cleanText_(payload.type || 'trap', 24),
      name: cleanText_(payload.name || 'Feature', 64),
      x: clamp_(parseInt(payload.x || 0, 10), 0, map.cols - 1),
      y: clamp_(parseInt(payload.y || 0, 10), 0, map.rows - 1),
      dc: parseInt(payload.dc || 12, 10),
      resolved: false,
      hidden: payload.hidden !== false
    };
    map.features = map.features || [];
    map.features.push(feature);
    addLog_(state, 'dm', 'DM added map feature: ' + feature.name + '.');
    return sanitizeStateForViewer_(state, payload, true);
  });
}

function apiResetSession(payload) {
  payload = payload || {};
  requireDM_(payload);
  var fresh = makeDefaultState_();
  setState_(fresh);
  return sanitizeStateForViewer_(fresh, payload, true);
}

function apiExportState(payload) {
  payload = payload || {};
  requireDM_(payload);
  return ensureState_();
}

function apiImportFullState(payload) {
  payload = payload || {};
  requireDM_(payload);
  var state = normalizeJsonInput_(payload.stateJson || payload.state || {});
  state.version = state.version || 1;
  state.updatedAt = nowIso_();
  setState_(state);
  return sanitizeStateForViewer_(state, payload, true);
}

/******************************* State helpers *******************************/

function ensureState_() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(PLAYERZONE_STATE_KEY);
  if (!raw) {
    var fresh = makeDefaultState_();
    props.setProperty(PLAYERZONE_STATE_KEY, JSON.stringify(fresh));
    return fresh;
  }
  try {
    var parsed = JSON.parse(raw);
    return migrateState_(parsed);
  } catch (err) {
    var fallback = makeDefaultState_();
    fallback.recoveredFromError = String(err);
    props.setProperty(PLAYERZONE_STATE_KEY, JSON.stringify(fallback));
    return fallback;
  }
}

function setState_(state) {
  state.updatedAt = nowIso_();
  PropertiesService.getScriptProperties().setProperty(PLAYERZONE_STATE_KEY, JSON.stringify(state));
}

function mutateState_(mutator) {
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var state = ensureState_();
    var result = mutator(state);
    setState_(state);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function makeDefaultState_() {
  var mapId = 'starter-dungeon';
  return {
    version: 1,
    app: PLAYERZONE_APP_NAME,
    createdAt: nowIso_(),
    updatedAt: nowIso_(),
    maxPlayers: PLAYERZONE_MAX_PLAYERS,
    gridFeet: PLAYERZONE_GRID_FEET,
    dmHash: PLAYERZONE_DM_HASH,
    players: {},
    characters: {},
    tokens: {},
    mapOrder: [mapId],
    currentMapId: mapId,
    mapsById: {
      'starter-dungeon': {
        id: mapId,
        name: 'Starter Dungeon Crawl',
        imageUrl: '',
        cols: 24,
        rows: 16,
        gridFeet: PLAYERZONE_GRID_FEET,
        walls: [],
        doors: [
          { id: 'door-1', name: 'Locked Stone Door', x: 12, y: 8, dc: 14, locked: true, open: false, resolved: false }
        ],
        traps: [
          { id: 'trap-1', name: 'Needle Glyph Trap', x: 8, y: 6, dc: 13, damage: '1d6', resolved: false, hidden: true }
        ],
        features: [],
        spawnPoints: {
          player: [{ x: 2, y: 2 }, { x: 3, y: 2 }, { x: 2, y: 3 }, { x: 3, y: 3 }],
          npc: [{ x: 18, y: 10 }, { x: 19, y: 10 }, { x: 18, y: 11 }, { x: 19, y: 11 }]
        },
        notes: 'Every square is 5 ft by 5 ft. Paste a map JSON or image URL in DM tools to replace this starter board.',
        createdAt: nowIso_(),
        updatedAt: nowIso_()
      }
    },
    encounter: { active: false, biome: 'dungeon', difficulty: 'medium', updatedAt: nowIso_() },
    scene: { lighting: 'torch', ambience: 'quiet dungeon air', fog: 0, soundClipId: '', updatedAt: nowIso_() },
    audio: { clips: [] },
    diceBots: makeDiceBots_(),
    turn: { active: false, round: 1, index: 0, order: [], updatedAt: nowIso_() },
    log: []
  };
}

function migrateState_(state) {
  state.version = state.version || 1;
  state.players = state.players || {};
  state.characters = state.characters || {};
  state.tokens = state.tokens || {};
  state.mapOrder = state.mapOrder || [];
  state.mapsById = state.mapsById || {};
  state.encounter = state.encounter || { active: false };
  state.scene = state.scene || { lighting: 'torch', ambience: 'quiet dungeon air', fog: 0, soundClipId: '' };
  state.audio = state.audio || { clips: [] };
  state.diceBots = state.diceBots && state.diceBots.length ? state.diceBots : makeDiceBots_();
  state.turn = state.turn || { active: false, round: 1, index: 0, order: [] };
  state.log = state.log || [];
  if (!state.currentMapId || !state.mapsById[state.currentMapId]) {
    var fresh = makeDefaultState_();
    state.mapsById[fresh.currentMapId] = fresh.mapsById[fresh.currentMapId];
    state.currentMapId = fresh.currentMapId;
    state.mapOrder.push(fresh.currentMapId);
  }
  return state;
}

function sanitizeStateForViewer_(state, viewer, isDM) {
  var copy = JSON.parse(JSON.stringify(state));
  copy.viewer = {
    isDM: !!isDM,
    playerId: cleanId_((viewer || {}).playerId || ''),
    playerName: cleanText_((viewer || {}).playerName || '', 32)
  };
  if (!isDM) {
    delete copy.dmHash;
    var tokenIds = Object.keys(copy.tokens || {});
    tokenIds.forEach(function(id) {
      if (copy.tokens[id].hiddenToPlayers) delete copy.tokens[id];
    });
    var charIds = Object.keys(copy.characters || {});
    charIds.forEach(function(id) {
      var c = copy.characters[id];
      if (c && c.raw && c.isNPC) delete c.raw;
    });
    Object.keys(copy.mapsById || {}).forEach(function(mapId) {
      var map = copy.mapsById[mapId];
      map.traps = (map.traps || []).filter(function(t) { return !t.hidden || t.resolved; });
      map.features = (map.features || []).filter(function(f) { return !f.hidden || f.resolved; });
    });
  }
  return copy;
}

function addLog_(state, type, text, extra) {
  state.log = state.log || [];
  state.log.unshift(mergeObjects_({
    id: makeId_('log'),
    type: type,
    text: String(text || ''),
    at: nowIso_()
  }, extra || {}));
  if (state.log.length > PLAYERZONE_MAX_LOG) state.log = state.log.slice(0, PLAYERZONE_MAX_LOG);
}

/***************************** Character helpers *****************************/

function extractCharacter_(sheet) {
  sheet = sheet || {};
  var abilities = normalizeAbilities_(sheet.abilities || sheet.stats || sheet.abilityScores || sheet);
  var hp = sheet.hp || sheet.hitPoints || {};
  var name = sheet.name || sheet.characterName || sheet.playerCharacterName || sheet.npcName || 'Unnamed Adventurer';
  var proficiency = Number(sheet.proficiencyBonus || sheet.profBonus || Math.ceil((Number(sheet.level || 1) + 3) / 4) + 1 || 2);

  return {
    id: cleanId_(sheet.id || makeId_('char')),
    name: cleanText_(name, 64),
    level: Number(sheet.level || sheet.totalLevel || 1),
    className: cleanText_(sheet.className || sheet.class || sheet.classes || 'Adventurer', 80),
    race: cleanText_(sheet.race || sheet.lineage || sheet.ancestry || 'Unknown lineage', 80),
    ac: Number(sheet.ac || sheet.armorClass || 10 + getModFromScore_(abilities.dex)),
    hp: {
      current: Number(hp.current || hp.value || sheet.currentHp || sheet.hpCurrent || hp.max || sheet.maxHp || 10),
      max: Number(hp.max || sheet.maxHp || sheet.hpMax || hp.current || 10)
    },
    speed: Number(sheet.speed || sheet.walkSpeed || 30),
    proficiencyBonus: proficiency,
    abilities: abilities,
    skills: normalizeSkills_(sheet.skills || {}, abilities, proficiency),
    attacks: normalizeAttacks_(sheet.attacks || sheet.weapons || sheet.actions || []),
    spells: normalizeSpells_(sheet.spells || sheet.spellbook || []),
    inventory: sheet.inventory || sheet.items || [],
    features: sheet.features || sheet.classFeatures || [],
    resources: sheet.resources || sheet.slots || sheet.spellSlots || {},
    notes: sheet.notes || sheet.backstory || ''
  };
}

function normalizeAbilities_(source) {
  function getOne(names, fallback) {
    for (var i = 0; i < names.length; i++) {
      if (source[names[i]] !== undefined) return Number(source[names[i]]);
    }
    return fallback;
  }
  return {
    str: getOne(['str','strength','STR','Strength'], 10),
    dex: getOne(['dex','dexterity','DEX','Dexterity'], 10),
    con: getOne(['con','constitution','CON','Constitution'], 10),
    int: getOne(['int','intelligence','INT','Intelligence'], 10),
    wis: getOne(['wis','wisdom','WIS','Wisdom'], 10),
    cha: getOne(['cha','charisma','CHA','Charisma'], 10)
  };
}

function normalizeSkills_(skills, abilities, proficiency) {
  var defaults = {
    athletics: getModFromScore_(abilities.str), acrobatics: getModFromScore_(abilities.dex), sleightOfHand: getModFromScore_(abilities.dex), stealth: getModFromScore_(abilities.dex),
    arcana: getModFromScore_(abilities.int), history: getModFromScore_(abilities.int), investigation: getModFromScore_(abilities.int), nature: getModFromScore_(abilities.int), religion: getModFromScore_(abilities.int),
    animalHandling: getModFromScore_(abilities.wis), insight: getModFromScore_(abilities.wis), medicine: getModFromScore_(abilities.wis), perception: getModFromScore_(abilities.wis), survival: getModFromScore_(abilities.wis),
    deception: getModFromScore_(abilities.cha), intimidation: getModFromScore_(abilities.cha), performance: getModFromScore_(abilities.cha), persuasion: getModFromScore_(abilities.cha),
    thievesTools: getModFromScore_(abilities.dex), initiative: getModFromScore_(abilities.dex)
  };
  Object.keys(skills || {}).forEach(function(k) {
    if (typeof skills[k] === 'number') defaults[normalizeSkillKey_(k)] = Number(skills[k]);
    else if (skills[k] && skills[k].mod !== undefined) defaults[normalizeSkillKey_(k)] = Number(skills[k].mod);
    else if (skills[k] === true) defaults[normalizeSkillKey_(k)] = (defaults[normalizeSkillKey_(k)] || 0) + proficiency;
  });
  return defaults;
}

function normalizeAttacks_(attacks) {
  if (!Array.isArray(attacks)) attacks = Object.keys(attacks || {}).map(function(k) { return attacks[k]; });
  return attacks.map(function(a, index) {
    a = a || {};
    return {
      name: cleanText_(a.name || a.weapon || a.label || 'Attack ' + (index + 1), 64),
      toHit: Number(a.toHit || a.attackBonus || a.hit || 0),
      damage: cleanDiceExpression_(a.damage || a.damageDice || '1d4'),
      range: cleanText_(a.range || 'melee', 32),
      type: cleanText_(a.type || a.damageType || 'damage', 32)
    };
  });
}

function normalizeSpells_(spells) {
  if (!Array.isArray(spells)) spells = Object.keys(spells || {}).reduce(function(acc, lvl) {
    var arr = spells[lvl];
    if (Array.isArray(arr)) arr.forEach(function(s) { if (typeof s === 'object') s.level = s.level || lvl; acc.push(s); });
    return acc;
  }, []);
  return spells.map(function(s, index) {
    if (typeof s === 'string') s = { name: s };
    s = s || {};
    return {
      name: cleanText_(s.name || 'Spell ' + (index + 1), 64),
      level: cleanText_(s.level || s.spellLevel || 'cantrip', 16),
      attackBonus: s.attackBonus !== undefined ? Number(s.attackBonus) : s.toHit !== undefined ? Number(s.toHit) : undefined,
      save: s.save || s.savingThrow || '',
      damage: s.damage ? cleanDiceExpression_(s.damage) : '',
      range: cleanText_(s.range || '', 32),
      notes: cleanText_(s.notes || s.description || '', 240)
    };
  });
}

function defaultAttack_(character) {
  var str = getAbilityMod_(character, 'str');
  var prof = numberOr_(character.proficiencyBonus, 2);
  return { name: 'Improvised Strike', toHit: str + prof, damage: '1d4+' + str, type: 'bludgeoning' };
}

function getSkillMod_(character, skill) {
  var key = normalizeSkillKey_(skill);
  if (character.skills && character.skills[key] !== undefined) return Number(character.skills[key]);
  if (key === 'athletics') return getAbilityMod_(character, 'str');
  if (key === 'stealth' || key === 'acrobatics' || key === 'sleightofhand' || key === 'thievestools') return getAbilityMod_(character, 'dex');
  if (key === 'arcana' || key === 'history' || key === 'investigation' || key === 'nature' || key === 'religion') return getAbilityMod_(character, 'int');
  if (key === 'perception' || key === 'insight' || key === 'medicine' || key === 'survival' || key === 'animalhandling') return getAbilityMod_(character, 'wis');
  if (key === 'deception' || key === 'intimidation' || key === 'performance' || key === 'persuasion') return getAbilityMod_(character, 'cha');
  return 0;
}

function normalizeSkillKey_(skill) {
  return String(skill || '').toLowerCase().replace(/[^a-z]/g, '').replace('sleightofhand', 'sleightOfHand').replace('animalhandling', 'animalHandling').replace('thievestools', 'thievesTools');
}

function getAbilityMod_(character, ability) {
  var score = character && character.abilities ? character.abilities[ability] : 10;
  return getModFromScore_(score);
}

function getModFromScore_(score) {
  return Math.floor((Number(score || 10) - 10) / 2);
}

/******************************** Map helpers ********************************/

function extractMap_(map) {
  map = map || {};
  return {
    id: cleanId_(map.id || makeId_('map')),
    name: cleanText_(map.name || 'Uploaded Map', 80),
    imageUrl: String(map.imageUrl || map.image || map.backgroundUrl || ''),
    cols: clamp_(parseInt(map.cols || map.columns || map.gridCols || 24, 10), 4, 80),
    rows: clamp_(parseInt(map.rows || map.gridRows || 16, 10), 4, 80),
    gridFeet: PLAYERZONE_GRID_FEET,
    walls: normalizePoints_(map.walls || []),
    doors: normalizeMapThings_(map.doors || [], 'door'),
    traps: normalizeMapThings_(map.traps || [], 'trap'),
    features: normalizeMapThings_(map.features || [], 'feature'),
    spawnPoints: normalizeSpawnPoints_(map.spawnPoints || map.spawns || {}),
    notes: cleanText_(map.notes || '', 500)
  };
}

function normalizePoints_(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(function(p) { return { x: parseInt(p.x || 0, 10), y: parseInt(p.y || 0, 10) }; });
}

function normalizeMapThings_(arr, type) {
  if (!Array.isArray(arr)) return [];
  return arr.map(function(t, index) {
    return {
      id: cleanId_(t.id || type + '-' + (index + 1)),
      type: cleanText_(t.type || type, 24),
      name: cleanText_(t.name || type + ' ' + (index + 1), 64),
      x: parseInt(t.x || 0, 10),
      y: parseInt(t.y || 0, 10),
      dc: parseInt(t.dc || 12, 10),
      locked: !!t.locked,
      open: !!t.open,
      resolved: !!t.resolved,
      hidden: !!t.hidden,
      damage: t.damage ? cleanDiceExpression_(t.damage) : ''
    };
  });
}

function normalizeSpawnPoints_(spawns) {
  function norm(list, fallback) {
    if (!Array.isArray(list) || !list.length) return fallback;
    return list.map(function(p) { return { x: parseInt(p.x || 0, 10), y: parseInt(p.y || 0, 10) }; });
  }
  return {
    player: norm(spawns.player || spawns.players, [{ x: 1, y: 1 }]),
    npc: norm(spawns.npc || spawns.npcs || spawns.monsters, [{ x: 10, y: 10 }])
  };
}

function getCurrentMap_(state) {
  return state.mapsById[state.currentMapId] || state.mapsById[state.mapOrder[0]];
}

function findSpawn_(state, type) {
  var map = getCurrentMap_(state);
  var list = map.spawnPoints && map.spawnPoints[type] ? map.spawnPoints[type] : [{ x: 1, y: 1 }];
  return list[Math.floor(Math.random() * list.length)] || { x: 1, y: 1 };
}

function isBlockedSquare_(map, x, y) {
  var walls = map.walls || [];
  for (var i = 0; i < walls.length; i++) if (walls[i].x === x && walls[i].y === y) return true;
  var doors = map.doors || [];
  for (var d = 0; d < doors.length; d++) if (doors[d].x === x && doors[d].y === y && doors[d].locked && !doors[d].open) return true;
  return false;
}

function markMapFeatureResolved_(map, targetId, action) {
  ['doors','traps','features'].forEach(function(group) {
    (map[group] || []).forEach(function(item) {
      if (item.id === targetId) {
        item.resolved = true;
        if (action === 'unlock-door' || action === 'open-door') {
          item.locked = false;
          item.open = true;
        }
      }
    });
  });
}

/******************************* Access helpers ******************************/

function isDM_(payload) {
  payload = payload || {};
  return String(payload.dmHash || payload.hash || '').trim() === PLAYERZONE_DM_HASH;
}

function requireDM_(payload) {
  if (!isDM_(payload)) throw new Error('DM tools are hidden behind #dm-session.');
}

function canControlToken_(state, payload, token) {
  if (isDM_(payload)) return true;
  var playerId = cleanId_((payload || {}).playerId || '');
  if (!playerId || !token) return false;
  if (token.ownerPlayerId === playerId) return true;
  var player = state.players[playerId];
  return !!(player && player.ownedTokenIds && player.ownedTokenIds.indexOf(token.id) !== -1);
}

function grantPlayerControl_(state, playerId, characterId, tokenId) {
  playerId = cleanId_(playerId || 'dm');
  state.players[playerId] = state.players[playerId] || { id: playerId, name: playerId, slot: findOpenPlayerSlot_(state, playerId), ownedTokenIds: [], controlledCharacterIds: [] };
  var p = state.players[playerId];
  p.ownedTokenIds = p.ownedTokenIds || [];
  p.controlledCharacterIds = p.controlledCharacterIds || [];
  if (p.ownedTokenIds.indexOf(tokenId) === -1) p.ownedTokenIds.push(tokenId);
  if (p.controlledCharacterIds.indexOf(characterId) === -1) p.controlledCharacterIds.push(characterId);
}

function findOpenPlayerSlot_(state, playerId) {
  var used = {};
  Object.keys(state.players || {}).forEach(function(id) { used[state.players[id].slot] = true; });
  for (var i = 1; i <= PLAYERZONE_MAX_PLAYERS; i++) if (!used[i]) return i;
  return PLAYERZONE_MAX_PLAYERS;
}

function findTokenByCharacter_(state, characterId) {
  var ids = Object.keys(state.tokens || {});
  for (var i = 0; i < ids.length; i++) if (state.tokens[ids[i]].characterId === characterId) return ids[i];
  return '';
}

/***************************** Dice and encounters ***************************/

function rollDice_(expr, mode) {
  expr = cleanDiceExpression_(expr || '1d20');
  mode = mode || 'normal';
  if (mode === 'advantage' || mode === 'disadvantage') {
    var modMatch = expr.match(/^1d20([+-]\d+)?$/i);
    if (modMatch) {
      var mod = Number(modMatch[1] || 0);
      var a = Math.floor(Math.random() * 20) + 1;
      var b = Math.floor(Math.random() * 20) + 1;
      var die = mode === 'advantage' ? Math.max(a, b) : Math.min(a, b);
      return { total: die + mod, detail: mode + ' d20(' + a + ',' + b + ')' + signed_(mod) };
    }
  }
  var normalized = expr.replace(/\s+/g, '');
  var tokens = normalized.match(/[+-]?[^+-]+/g) || [];
  var total = 0;
  var detailParts = [];
  tokens.forEach(function(part) {
    var sign = 1;
    if (part.charAt(0) === '+') part = part.substring(1);
    else if (part.charAt(0) === '-') { sign = -1; part = part.substring(1); }
    var diceMatch = part.match(/^(\d*)d(\d+)$/i);
    if (diceMatch) {
      var count = clamp_(parseInt(diceMatch[1] || 1, 10), 1, 100);
      var sides = clamp_(parseInt(diceMatch[2], 10), 2, 1000);
      var rolls = [];
      var subtotal = 0;
      for (var i = 0; i < count; i++) {
        var r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        subtotal += r;
      }
      total += subtotal * sign;
      detailParts.push((sign < 0 ? '-' : '') + count + 'd' + sides + '(' + rolls.join(',') + ')');
    } else {
      var n = Number(part || 0);
      total += n * sign;
      detailParts.push((sign < 0 ? '-' : '+') + n);
    }
  });
  return { total: total, detail: detailParts.join(' ') };
}

function cleanDiceExpression_(expr) {
  expr = String(expr || '1d20').replace(/[^0-9dD+\-\s]/g, '');
  if (!expr || !/[0-9]d[0-9]|\d/i.test(expr)) expr = '1d20';
  return expr;
}

function signed_(n) {
  n = Number(n || 0);
  if (n === 0) return '';
  return n > 0 ? '+' + n : String(n);
}

function makeDiceBots_() {
  return [
    { id: 'onyx-oracle', name: 'Onyx Oracle', mood: 'protective', motion: 'slow hover + gentle pulse', sound: 'crystal chime' },
    { id: 'cinder-clatter', name: 'Cinder Clatter', mood: 'chaotic', motion: 'excited shake + spin', sound: 'clattering bones' },
    { id: 'mosswhisper', name: 'Mosswhisper', mood: 'calm', motion: 'leafy sway', sound: 'soft leaves' },
    { id: 'brass-imp', name: 'Brass Imp', mood: 'tricksy', motion: 'tiny rotations', sound: 'clockwork click' },
    { id: 'velvet-hex', name: 'Velvet Hex', mood: 'witchy', motion: 'moonlit bob', sound: 'low bell' },
    { id: 'stormbutton', name: 'Stormbutton', mood: 'bold', motion: 'zap jitter', sound: 'mini thunder' },
    { id: 'bubblebones', name: 'Bubblebones', mood: 'silly', motion: 'bouncy wobble', sound: 'bubble pop' },
    { id: 'inkfang', name: 'Inkfang', mood: 'sneaky', motion: 'shadow flicker', sound: 'paper scratch' },
    { id: 'sunny-snail', name: 'Sunny Snail', mood: 'gentle', motion: 'slow squash stretch', sound: 'warm tap' },
    { id: 'goblin-giggle', name: 'Goblin Giggle', mood: 'mischievous', motion: 'wiggle burst', sound: 'giggle click' },
    { id: 'rune-raccoon', name: 'Rune Raccoon', mood: 'curious', motion: 'paw hover', sound: 'rune plink' },
    { id: 'thimble-drake', name: 'Thimble Drake', mood: 'dramatic', motion: 'wing flutter', sound: 'tiny roar' },
    { id: 'honey-haunt', name: 'Honey Haunt', mood: 'sweet spooky', motion: 'ghost float', sound: 'soft ooo' },
    { id: 'dice-dino', name: 'Dice Dino', mood: 'loyal', motion: 'happy stomp shake', sound: 'friendly chomp' }
  ];
}

function findDiceBot_(state, botId) {
  var bots = state.diceBots || makeDiceBots_();
  for (var i = 0; i < bots.length; i++) if (bots[i].id === botId) return bots[i];
  return bots[0];
}

function generateEncounterMonsters_(difficulty, biome, count) {
  var base = {
    easy: [
      { name: 'Crawling Bone Sprite', ac: 12, hp: 7, speed: 25, attacks: [{ name: 'Bone Scratch', toHit: 3, damage: '1d4+1' }] },
      { name: 'Cave Rat Swarmlet', ac: 11, hp: 9, speed: 30, attacks: [{ name: 'Bites', toHit: 3, damage: '1d6' }] }
    ],
    medium: [
      { name: 'Dungeon Imposter Scout', ac: 13, hp: 18, speed: 30, attacks: [{ name: 'Hidden Dagger', toHit: 5, damage: '1d6+3' }] },
      { name: 'Rune-Lit Skeleton', ac: 13, hp: 22, speed: 30, attacks: [{ name: 'Rusty Blade', toHit: 4, damage: '1d8+2' }] }
    ],
    hard: [
      { name: 'Oathbroken Mini-Boss', ac: 15, hp: 45, speed: 30, attacks: [{ name: 'Grave Maul', toHit: 6, damage: '2d8+3' }] },
      { name: 'Trapmaster Shade', ac: 14, hp: 38, speed: 35, attacks: [{ name: 'Shadow Bolt', toHit: 6, damage: '2d6+4' }] }
    ],
    deadly: [
      { name: 'Hungry-God Echo', ac: 16, hp: 78, speed: 35, attacks: [{ name: 'Devouring Pulse', toHit: 7, damage: '3d8+4' }] },
      { name: 'Vault Horror Imposter', ac: 17, hp: 66, speed: 30, attacks: [{ name: 'Vault Rend', toHit: 7, damage: '2d10+5' }] }
    ]
  };
  var table = base[difficulty] || base.medium;
  var list = [];
  for (var i = 0; i < count; i++) {
    var chosen = JSON.parse(JSON.stringify(table[i % table.length]));
    chosen.name = biomeTitle_(biome) + ' ' + chosen.name + ' ' + (i + 1);
    chosen.abilities = { str: 12, dex: 14, con: 12, int: 8, wis: 10, cha: 8 };
    chosen.skills = { stealth: 3, perception: 2 };
    list.push(chosen);
  }
  return list;
}

function biomeTitle_(biome) {
  biome = String(biome || 'Dungeon').replace(/[^a-zA-Z ]/g, ' ');
  return biome.charAt(0).toUpperCase() + biome.slice(1);
}

/******************************* General utils *******************************/

function normalizeJsonInput_(input) {
  if (typeof input === 'string') {
    if (!input.trim()) return {};
    return JSON.parse(input);
  }
  return input || {};
}

function cleanText_(text, max) {
  text = String(text === undefined || text === null ? '' : text);
  text = text.replace(/[<>]/g, '').trim();
  if (max && text.length > max) text = text.substring(0, max);
  return text;
}

function cleanId_(id) {
  return String(id || '').trim().replace(/[^a-zA-Z0-9_-]/g, '-').substring(0, 80);
}

function makeId_(prefix) {
  return cleanId_((prefix || 'id') + '-' + Utilities.getUuid().substring(0, 8));
}

function nowIso_() {
  return new Date().toISOString();
}

function clamp_(n, min, max) {
  n = Number(n);
  if (isNaN(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

function numberOr_(value, fallback) {
  var n = Number(value);
  return isNaN(n) ? fallback : n;
}

function mergeObjects_(a, b) {
  var out = {};
  Object.keys(a || {}).forEach(function(k) { out[k] = a[k]; });
  Object.keys(b || {}).forEach(function(k) { out[k] = b[k]; });
  return out;
}

function normalizeStatusList_(status) {
  if (Array.isArray(status)) return status.map(function(s) { return cleanText_(s, 32); }).filter(Boolean);
  return String(status || '').split(',').map(function(s) { return cleanText_(s, 32); }).filter(Boolean);
}

function pickTokenColor_(state, tokenId) {
  var colors = ['cyan','orange','violet','emerald','rose','amber','sky','lime','pink','slate','teal','red'];
  var used = Object.keys(state.tokens || {}).length;
  return colors[used % colors.length];
}

/*********************************** HTML ************************************/

function getPlayerZoneHtml_() {
  return `<!doctype html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
  <title>PlayerZone Encounters Roleplaying Board</title>
  <style>
    :root{
      --pz-cyan:#00FFFF;
      --pz-orange:#CA6309;
      --pz-bg:#080b12;
      --pz-panel:rgba(12,18,28,.92);
      --pz-panel2:rgba(25,31,46,.88);
      --pz-text:#f6fbff;
      --pz-muted:#aab8c8;
      --pz-danger:#ff5d73;
      --pz-good:#61ffa8;
      --cell:34px;
    }
    *{box-sizing:border-box;}
    html,body{margin:0;min-height:100%;background:radial-gradient(circle at top left,rgba(0,255,255,.16),transparent 32%),radial-gradient(circle at bottom right,rgba(202,99,9,.18),transparent 38%),var(--pz-bg);color:var(--pz-text);font-family:Arial,Helvetica,sans-serif;overflow-x:hidden;}
    button,input,select,textarea{font:inherit;}
    button{border:1px solid rgba(0,255,255,.35);background:linear-gradient(135deg,rgba(0,255,255,.18),rgba(202,99,9,.16));color:var(--pz-text);border-radius:14px;padding:9px 12px;cursor:pointer;box-shadow:0 0 16px rgba(0,255,255,.08);}
    button:hover{border-color:var(--pz-cyan);box-shadow:0 0 18px rgba(0,255,255,.22);}
    button.danger{border-color:rgba(255,93,115,.5);background:rgba(255,93,115,.12);}
    input,select,textarea{width:100%;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.36);color:var(--pz-text);border-radius:12px;padding:10px;outline:none;}
    textarea{min-height:100px;resize:vertical;}
    label{display:block;color:var(--pz-muted);font-size:12px;margin:8px 0 4px;}
    .app{display:grid;grid-template-columns:320px minmax(360px,1fr) 340px;gap:12px;padding:12px;min-height:100vh;}
    .panel{background:var(--pz-panel);border:1px solid rgba(255,255,255,.12);border-radius:22px;padding:14px;box-shadow:0 12px 40px rgba(0,0,0,.35);backdrop-filter:blur(10px);}
    .title{font-size:22px;font-weight:900;line-height:1.05;margin:0 0 8px;text-shadow:0 0 14px rgba(0,255,255,.28);}
    .subtitle{color:var(--pz-muted);font-size:13px;line-height:1.35;margin:0 0 12px;}
    .row{display:flex;gap:8px;align-items:center;}
    .row > *{flex:1;}
    .pill{display:inline-flex;align-items:center;gap:6px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.07);border-radius:999px;padding:6px 10px;font-size:12px;color:var(--pz-muted);margin:3px 4px 3px 0;}
    .dm-only{display:none;}
    body.is-dm .dm-only{display:block;}
    body.is-dm .dm-flex{display:flex;}
    .dm-badge{display:none;color:#111;background:var(--pz-cyan);font-weight:900;border-radius:999px;padding:3px 8px;font-size:11px;}
    body.is-dm .dm-badge{display:inline-flex;}
    .board-wrap{position:relative;min-height:620px;overflow:auto;border-radius:22px;border:1px solid rgba(0,255,255,.2);background:#111827;box-shadow:inset 0 0 60px rgba(0,0,0,.55);}
    .board-toolbar{position:sticky;top:0;z-index:20;background:linear-gradient(180deg,rgba(8,11,18,.96),rgba(8,11,18,.68));padding:10px;border-bottom:1px solid rgba(255,255,255,.1);display:flex;gap:8px;align-items:center;flex-wrap:wrap;}
    .map-stage{position:relative;margin:14px;width:max-content;min-width:300px;min-height:240px;background:linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.02));background-size:cover;background-position:center;border:1px solid rgba(255,255,255,.18);}
    .grid{position:absolute;inset:0;display:grid;pointer-events:none;background-image:linear-gradient(rgba(0,255,255,.17) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,255,.17) 1px,transparent 1px);background-size:var(--cell) var(--cell);}
    .cell-hit{position:absolute;inset:0;display:grid;z-index:4;}
    .cell-hit button{border:0;background:transparent;border-radius:0;padding:0;box-shadow:none;min-width:var(--cell);min-height:var(--cell);}
    .cell-hit button:hover{background:rgba(0,255,255,.08);}
    .feature{position:absolute;width:18px;height:18px;border-radius:6px;z-index:8;transform:translate(-50%,-50%);border:1px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;background:rgba(202,99,9,.75);}
    .feature.trap{background:rgba(255,93,115,.7);}
    .feature.door{background:rgba(202,99,9,.82);}
    .token{position:absolute;width:30px;height:30px;border-radius:999px;border:2px solid rgba(255,255,255,.86);z-index:10;transform:translate(-50%,-50%);display:flex;align-items:center;justify-content:center;background:rgba(0,255,255,.65);box-shadow:0 4px 16px rgba(0,0,0,.45),0 0 16px rgba(0,255,255,.25);cursor:pointer;transition:left .16s linear,top .16s linear,transform .12s ease;}
    .token.blank::before{content:'';display:block;width:55%;height:55%;border-radius:999px;background:rgba(255,255,255,.18);box-shadow:inset 0 0 10px rgba(0,0,0,.25);}
    .token.selected{outline:3px solid var(--pz-orange);transform:translate(-50%,-50%) scale(1.16);}
    .token.npc{background:rgba(255,93,115,.68);}
    .token.dmpc{background:rgba(202,99,9,.72);}
    .token-label{position:absolute;top:31px;left:50%;transform:translateX(-50%);font-size:10px;white-space:nowrap;background:rgba(0,0,0,.62);padding:2px 5px;border-radius:7px;pointer-events:none;}
    .cyan{background:rgba(0,255,255,.65);} .orange{background:rgba(202,99,9,.75);} .violet{background:rgba(165,120,255,.75);} .emerald{background:rgba(60,255,150,.7);} .rose{background:rgba(255,95,155,.7);} .amber{background:rgba(255,190,70,.75);} .sky{background:rgba(80,170,255,.7);} .lime{background:rgba(150,255,80,.7);} .pink{background:rgba(255,120,220,.72);} .slate{background:rgba(150,165,180,.75);} .teal{background:rgba(20,210,190,.72);} .red{background:rgba(255,80,80,.7);}
    .cards{display:grid;gap:8px;}
    .card{border:1px solid rgba(255,255,255,.12);background:var(--pz-panel2);border-radius:16px;padding:10px;}
    .card h3{margin:0 0 4px;font-size:15px;}
    .small{font-size:12px;color:var(--pz-muted);line-height:1.35;}
    .log{height:290px;overflow:auto;padding-right:4px;}
    .log-line{border-left:3px solid rgba(0,255,255,.35);padding:7px 8px;margin:7px 0;background:rgba(255,255,255,.05);border-radius:8px;font-size:12px;line-height:1.3;}
    .log-line.attack{border-color:var(--pz-danger);} .log-line.spell{border-color:#b48cff;} .log-line.roll{border-color:var(--pz-orange);} .log-line.move{border-color:var(--pz-good);}
    .tabs{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0;}
    .tab{font-size:12px;padding:7px 9px;}
    .tab.active{border-color:var(--pz-orange);background:rgba(202,99,9,.25);}
    .tab-panel{display:none;}
    .tab-panel.active{display:block;}
    .sound-flash{animation:rollPulse .55s ease-in-out 1;}
    @keyframes rollPulse{0%{transform:scale(1)}35%{transform:scale(1.04)}70%{transform:scale(.99)}100%{transform:scale(1)}}
    @media(max-width:1100px){.app{grid-template-columns:1fr;}.board-wrap{min-height:520px;}.panel{border-radius:18px;}.log{height:220px;}}
  </style>
</head>
<body>
  <div class="app">
    <aside class="panel">
      <h1 class="title">PlayerZone Encounters</h1>
      <p class="subtitle">D&D dungeon crawl board with circular blank tokens, 5 ft grid squares, character-sheet JSON actions, NPC/imposter encounters, dice bots, sound, lighting, and hidden DM tools.</p>
      <span class="dm-badge">DM SESSION ACTIVE</span>
      <div class="card">
        <h3>Join Table</h3>
        <label>Your player/table name</label>
        <input id="playerName" placeholder="Player name">
        <label>DM hash/token</label>
        <input id="dmHash" placeholder="#dm-session for DM tools">
        <div class="row" style="margin-top:8px">
          <button onclick="joinTable()">Join / Refresh</button>
          <button onclick="toggleCompact()">Compact</button>
        </div>
        <p class="small" id="joinStatus">Up to 10 people can join. A person can control multiple character tokens.</p>
      </div>

      <div class="tabs">
        <button class="tab active" onclick="showTab('tokens')">Tokens</button>
        <button class="tab" onclick="showTab('actions')">Actions</button>
        <button class="tab" onclick="showTab('import')">Import</button>
        <button class="tab dm-only" onclick="showTab('dm')">DM</button>
      </div>

      <section id="tab-tokens" class="tab-panel active">
        <div class="card">
          <h3>Controlled Characters</h3>
          <select id="tokenSelect" onchange="selectToken(this.value)"></select>
          <div id="tokenDetails" class="small"></div>
        </div>
        <div class="card">
          <h3>Movement</h3>
          <p class="small">Use WASD/arrow keys or these buttons. Each square is 5 ft.</p>
          <div class="row"><span></span><button onclick="moveSelected(0,-1)">↑</button><span></span></div>
          <div class="row"><button onclick="moveSelected(-1,0)">←</button><button onclick="moveSelected(0,1)">↓</button><button onclick="moveSelected(1,0)">→</button></div>
        </div>
      </section>

      <section id="tab-actions" class="tab-panel">
        <div class="card">
          <h3>Dice Bot Roller</h3>
          <label>Dice bot personality</label>
          <select id="diceBot"></select>
          <label>Dice expression</label>
          <input id="diceExpr" value="1d20">
          <label>Roll label</label>
          <input id="rollLabel" value="Check">
          <div class="row" style="margin-top:8px">
            <button onclick="rollDice('normal')">Roll</button>
            <button onclick="rollDice('advantage')">Adv</button>
            <button onclick="rollDice('disadvantage')">Dis</button>
          </div>
        </div>
        <div class="card">
          <h3>Character Sheet Actions</h3>
          <label>Skill</label>
          <select id="skillSelect"></select>
          <button onclick="skillCheck()">Roll Skill</button>
          <label>Target</label>
          <select id="targetSelect"></select>
          <label>Weapon / attack</label>
          <select id="attackSelect"></select>
          <button onclick="attackTarget()">Attack Target</button>
          <label>Spell</label>
          <select id="spellSelect"></select>
          <button onclick="castSpell()">Cast Spell</button>
        </div>
        <div class="card">
          <h3>Interact</h3>
          <label>Nearby map feature</label>
          <select id="featureSelect"></select>
          <label>Action</label>
          <select id="interactAction"><option value="investigate">Investigate</option><option value="disable-trap">Disable Trap</option><option value="unlock-door">Unlock Door</option><option value="open-door">Open Door</option></select>
          <label>DC</label><input id="interactDc" type="number" value="12">
          <button onclick="interactFeature()">Interact</button>
        </div>
      </section>

      <section id="tab-import" class="tab-panel">
        <div class="card">
          <h3>Import Character JSON</h3>
          <p class="small">Paste one character sheet JSON. Anything on the sheet can be mapped into actions if fields exist for attacks, spells, skills, AC, HP, speed, and stats.</p>
          <textarea id="characterJson" placeholder='{"name":"Pippin","ac":14,"hp":{"current":24,"max":24},"speed":30,"abilities":{"dex":16},"attacks":[{"name":"Shortsword","toHit":5,"damage":"1d6+3"}],"spells":[{"name":"Guiding Bolt","attackBonus":5,"damage":"4d6"}]}'></textarea>
          <label>Owner player id/name, optional for DM assigning multiple PCs</label>
          <input id="ownerPlayerId" placeholder="Leave blank for yourself">
          <div class="row" style="margin-top:8px"><button onclick="importCharacter(false,false)">Import PC</button><button class="dm-only" onclick="importCharacter(true,false)">Import DM-PC</button><button class="dm-only" onclick="importCharacter(false,true)">Import NPC</button></div>
        </div>
      </section>

      <section id="tab-dm" class="tab-panel dm-only">
        <div class="card">
          <h3>DM Encounter Controls</h3>
          <label>Biome/theme</label><input id="encBiome" value="dungeon">
          <label>Difficulty</label><select id="encDifficulty"><option>easy</option><option selected>medium</option><option>hard</option><option>deadly</option></select>
          <label>NPC/imposter count</label><input id="encCount" type="number" value="3">
          <button onclick="generateEncounter()">Generate Encounter</button>
          <button onclick="rollInitiative()">Roll Initiative</button>
          <button onclick="endTurn()">End Current Turn</button>
        </div>
        <div class="card">
          <h3>Map JSON</h3>
          <textarea id="mapJson" placeholder='{"name":"Crypt Map","imageUrl":"https://.../map.png","cols":30,"rows":20,"walls":[{"x":5,"y":5}],"doors":[{"id":"door-a","name":"Iron Door","x":12,"y":4,"dc":15,"locked":true}],"traps":[{"id":"trap-a","name":"Glyph","x":8,"y":8,"dc":14,"hidden":true}],"spawnPoints":{"player":[{"x":2,"y":2}],"npc":[{"x":20,"y":10}]}}'></textarea>
          <button onclick="importMap()">Load Map</button>
        </div>
        <div class="card">
          <h3>Audio + Lighting</h3>
          <textarea id="audioJson" placeholder='[{"id":"dungeon-loop","name":"Dungeon Loop","url":"https://.../audio.mp3","loop":true,"volume":0.5}]'></textarea>
          <button onclick="importAudio()">Load Audio Clips</button>
          <label>Lighting</label><select id="sceneLighting"><option>torch</option><option>moonlit</option><option>storm cyan</option><option>darkness</option><option>boss battle</option></select>
          <label>Ambience note</label><input id="sceneAmbience" value="quiet dungeon air">
          <label>Sound clip</label><select id="sceneSound"></select>
          <button onclick="setScene()">Set Scene</button>
        </div>
        <div class="card">
          <h3>Session Backup</h3>
          <div class="row"><button onclick="exportState()">Export</button><button onclick="importState()">Import State</button></div>
          <textarea id="stateBackup" placeholder="DM export/import state appears here."></textarea>
          <button class="danger" onclick="resetSession()">Reset Whole Session</button>
        </div>
      </section>
    </aside>

    <main class="panel">
      <div class="board-toolbar">
        <span class="pill" id="mapName">Map loading...</span>
        <span class="pill" id="turnInfo">No initiative</span>
        <span class="pill" id="sceneInfo">Scene loading...</span>
        <button onclick="zoomBoard(1)">Zoom +</button>
        <button onclick="zoomBoard(-1)">Zoom -</button>
      </div>
      <div class="board-wrap" id="boardWrap">
        <div class="map-stage" id="mapStage">
          <div class="grid" id="grid"></div>
          <div class="cell-hit" id="cellHit"></div>
          <div id="featuresLayer"></div>
          <div id="tokensLayer"></div>
        </div>
      </div>
    </main>

    <aside class="panel">
      <div class="card">
        <h3>Table Status</h3>
        <div id="playersList" class="small"></div>
      </div>
      <div class="card">
        <h3>Turn Order</h3>
        <div id="turnOrder" class="small"></div>
      </div>
      <div class="card">
        <h3>Roll / Event Log</h3>
        <div id="log" class="log"></div>
      </div>
      <audio id="soundPlayer"></audio>
    </aside>
  </div>

  <script>
    var PZ = {
      state:null,
      playerId:localStorage.getItem('pz_player_id') || 'player-' + Math.random().toString(36).slice(2,10),
      playerName:localStorage.getItem('pz_player_name') || '',
      dmHash:localStorage.getItem('pz_dm_hash') || '',
      selectedTokenId:localStorage.getItem('pz_selected_token') || '',
      cell:34,
      polling:false,
      compact:false
    };
    localStorage.setItem('pz_player_id', PZ.playerId);

    function byId(id){ return document.getElementById(id); }
    function payload(extra){
      var base = { playerId:PZ.playerId, playerName:PZ.playerName, dmHash:PZ.dmHash };
      extra = extra || {};
      Object.keys(extra).forEach(function(k){ base[k]=extra[k]; });
      return base;
    }
    function runApi(name, data, onOk){
      google.script.run.withSuccessHandler(function(res){
        if(res && res.state){ PZ.state = res.state; renderAll(); }
        else if(res && res.app){ /* ping */ }
        else { PZ.state = res; renderAll(); }
        if(onOk) onOk(res);
      }).withFailureHandler(function(err){
        byId('joinStatus').textContent = err && err.message ? err.message : String(err);
        console.error(err);
      })[name](data || payload());
    }
    function init(){
      byId('playerName').value = PZ.playerName;
      byId('dmHash').value = PZ.dmHash;
      joinTable(false);
      setInterval(function(){ runApi('apiHeartbeat', payload()); }, 1500);
      document.addEventListener('keydown', function(e){
        if(['INPUT','TEXTAREA','SELECT'].indexOf(document.activeElement.tagName) !== -1) return;
        if(e.key==='ArrowUp'||e.key==='w'||e.key==='W') moveSelected(0,-1);
        if(e.key==='ArrowDown'||e.key==='s'||e.key==='S') moveSelected(0,1);
        if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') moveSelected(-1,0);
        if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') moveSelected(1,0);
      });
    }
    function joinTable(show){
      PZ.playerName = byId('playerName').value.trim() || 'Player';
      PZ.dmHash = byId('dmHash').value.trim();
      localStorage.setItem('pz_player_name', PZ.playerName);
      localStorage.setItem('pz_dm_hash', PZ.dmHash);
      runApi('apiJoin', payload(), function(){ if(show!==false) byId('joinStatus').textContent='Joined as ' + PZ.playerName + '.'; });
    }
    function renderAll(){
      if(!PZ.state) return;
      document.body.classList.toggle('is-dm', !!PZ.state.viewer.isDM);
      renderMap(); renderPlayers(); renderDiceBots(); renderTokenSelect(); renderActions(); renderLog(); renderTurn(); renderScene();
    }
    function getMap(){ return PZ.state.mapsById[PZ.state.currentMapId]; }
    function renderMap(){
      var map = getMap(); if(!map) return;
      var stage = byId('mapStage');
      stage.style.width = (map.cols * PZ.cell) + 'px';
      stage.style.height = (map.rows * PZ.cell) + 'px';
      stage.style.backgroundImage = map.imageUrl ? 'url(' + map.imageUrl + ')' : 'linear-gradient(135deg,rgba(0,255,255,.08),rgba(202,99,9,.11))';
      byId('grid').style.backgroundSize = PZ.cell + 'px ' + PZ.cell + 'px';
      byId('cellHit').style.gridTemplateColumns = 'repeat(' + map.cols + ',' + PZ.cell + 'px)';
      byId('cellHit').style.gridTemplateRows = 'repeat(' + map.rows + ',' + PZ.cell + 'px)';
      byId('mapName').textContent = map.name + ' • ' + map.cols + 'x' + map.rows + ' • 5 ft squares';
      renderCells(map); renderFeatures(map); renderTokens(map);
    }
    function renderCells(map){
      var hit = byId('cellHit');
      if(hit.getAttribute('data-size') === map.cols + 'x' + map.rows + 'x' + PZ.cell) return;
      hit.innerHTML = '';
      hit.setAttribute('data-size', map.cols + 'x' + map.rows + 'x' + PZ.cell);
      for(var y=0;y<map.rows;y++) for(var x=0;x<map.cols;x++){
        var b = document.createElement('button'); b.title = (x+1)+','+(y+1); b.dataset.x=x; b.dataset.y=y;
        b.onclick = function(){ moveSelectedTo(Number(this.dataset.x), Number(this.dataset.y)); };
        hit.appendChild(b);
      }
    }
    function renderFeatures(map){
      var layer = byId('featuresLayer'); layer.innerHTML = '';
      function add(list, cls, mark){ (list||[]).forEach(function(f){
        var d=document.createElement('div'); d.className='feature ' + cls; d.textContent=mark; d.title=f.name + (f.resolved?' (resolved)':'');
        d.style.left=((f.x+.5)*PZ.cell)+'px'; d.style.top=((f.y+.5)*PZ.cell)+'px'; if(f.resolved) d.style.opacity=.35; layer.appendChild(d);
      }); }
      add(map.doors,'door','D'); add(map.traps,'trap','!'); add(map.features,'feature','?');
    }
    function renderTokens(map){
      var layer = byId('tokensLayer'); layer.innerHTML='';
      Object.keys(PZ.state.tokens||{}).forEach(function(id){
        var t=PZ.state.tokens[id];
        var el=document.createElement('div');
        el.className='token blank ' + (t.color||'cyan') + (t.isNPC?' npc':'') + (t.isDMPC?' dmpc':'') + (id===PZ.selectedTokenId?' selected':'');
        el.style.left=((t.x+.5)*PZ.cell)+'px'; el.style.top=((t.y+.5)*PZ.cell)+'px';
        el.title=t.name + ' HP ' + t.hp + '/' + t.maxHp + ' AC ' + t.ac;
        el.onclick=function(ev){ ev.stopPropagation(); selectToken(id); };
        var label=document.createElement('div'); label.className='token-label'; label.textContent=t.name; el.appendChild(label);
        layer.appendChild(el);
      });
    }
    function renderPlayers(){
      var players=Object.keys(PZ.state.players||{}).map(function(id){ return PZ.state.players[id]; }).sort(function(a,b){return (a.slot||0)-(b.slot||0);});
      byId('playersList').innerHTML = players.map(function(p){ return '<span class="pill">Slot '+(p.slot||'?')+': '+escapeHtml(p.name||p.id)+(p.isDM?' • DM':'')+'</span>'; }).join('') || '<span class="small">No players yet.</span>';
    }
    function renderDiceBots(){
      var sel=byId('diceBot'); var old=sel.value; if(sel.options.length===PZ.state.diceBots.length) return;
      sel.innerHTML=''; (PZ.state.diceBots||[]).forEach(function(b){ var o=document.createElement('option'); o.value=b.id; o.textContent=b.name+' — '+b.mood; sel.appendChild(o); }); if(old) sel.value=old;
    }
    function renderTokenSelect(){
      var sel=byId('tokenSelect'); var old=PZ.selectedTokenId; sel.innerHTML='';
      Object.keys(PZ.state.tokens||{}).forEach(function(id){
        var t=PZ.state.tokens[id];
        var can = PZ.state.viewer.isDM || t.ownerPlayerId===PZ.playerId || (PZ.state.players[PZ.playerId] && (PZ.state.players[PZ.playerId].ownedTokenIds||[]).indexOf(id)!==-1);
        if(can){ var o=document.createElement('option'); o.value=id; o.textContent=t.name + (t.isNPC?' [NPC]':t.isDMPC?' [DM-PC]':''); sel.appendChild(o); }
      });
      if(old && PZ.state.tokens[old]) sel.value=old; else if(sel.options.length){ PZ.selectedTokenId=sel.value; }
      localStorage.setItem('pz_selected_token', PZ.selectedTokenId||'');
      var t=PZ.state.tokens[PZ.selectedTokenId];
      byId('tokenDetails').innerHTML = t ? 'Selected: <b>'+escapeHtml(t.name)+'</b><br>HP '+t.hp+'/'+t.maxHp+' • AC '+t.ac+' • Speed '+t.speed+' ft<br>Square '+(t.x+1)+','+(t.y+1) : 'Import or select a character token.';
    }
    function renderActions(){
      var t=PZ.state.tokens[PZ.selectedTokenId]; var c=t ? PZ.state.characters[t.characterId] : null;
      fillSelect('targetSelect', Object.keys(PZ.state.tokens||{}).filter(function(id){return id!==PZ.selectedTokenId;}).map(function(id){var tt=PZ.state.tokens[id];return {value:id,text:tt.name+' AC '+tt.ac+' HP '+tt.hp+'/'+tt.maxHp};}));
      var skills=['athletics','acrobatics','sleight of hand','stealth','arcana','history','investigation','nature','religion','animal handling','insight','medicine','perception','survival','deception','intimidation','performance','persuasion','thieves tools'];
      fillSelect('skillSelect', skills.map(function(s){return {value:s,text:s};}));
      fillSelect('attackSelect', (c&&c.attacks?c.attacks:[]).map(function(a,i){return {value:i,text:a.name+' • '+a.damage};}));
      fillSelect('spellSelect', (c&&c.spells?c.spells:[]).map(function(s,i){return {value:i,text:s.name+' • lvl '+s.level+(s.damage?' • '+s.damage:'')};}));
      var map=getMap(); var features=[];
      ['doors','traps','features'].forEach(function(group){ (map[group]||[]).forEach(function(f){ features.push({value:f.id,text:f.name+' DC '+(f.dc||12)+(f.resolved?' resolved':'')}); }); });
      fillSelect('featureSelect', features);
      fillSelect('sceneSound', [{value:'',text:'No clip'}].concat((PZ.state.audio.clips||[]).map(function(c){return {value:c.id,text:c.name};})));
    }
    function fillSelect(id, arr){
      var sel=byId(id); var old=sel.value; var html=arr.map(function(o){return '<option value="'+escapeHtml(o.value)+'">'+escapeHtml(o.text)+'</option>';}).join('');
      if(sel.innerHTML!==html) sel.innerHTML=html;
      if(old) sel.value=old;
    }
    function renderLog(){
      byId('log').innerHTML=(PZ.state.log||[]).map(function(l){ return '<div class="log-line '+escapeHtml(l.type)+'"><b>'+escapeHtml(l.type)+'</b> <span class="small">'+new Date(l.at).toLocaleTimeString()+'</span><br>'+escapeHtml(l.text)+'</div>'; }).join('');
    }
    function renderTurn(){
      var turn=PZ.state.turn||{};
      if(!turn.active || !turn.order || !turn.order.length){ byId('turnInfo').textContent='No initiative'; byId('turnOrder').innerHTML='No active turn order.'; return; }
      var active=turn.order[turn.index];
      byId('turnInfo').textContent='Round '+turn.round+' • Turn: '+active.name;
      byId('turnOrder').innerHTML=turn.order.map(function(e,i){ return (i===turn.index?'<b>▶ ':'')+escapeHtml(e.name)+' — '+e.initiative+(i===turn.index?'</b>':''); }).join('<br>');
    }
    function renderScene(){
      var s=PZ.state.scene||{}; byId('sceneInfo').textContent='Lighting: '+(s.lighting||'torch')+' • '+(s.ambience||'quiet');
      var stage=byId('mapStage');
      stage.style.filter = s.lighting==='darkness' ? 'brightness(.58) contrast(1.1)' : s.lighting==='boss battle' ? 'contrast(1.25) saturate(1.35)' : s.lighting==='storm cyan' ? 'saturate(1.4) hue-rotate(135deg)' : 'none';
      playSceneAudioIfNeeded(s.soundClipId);
    }
    function selectToken(id){ PZ.selectedTokenId=id; localStorage.setItem('pz_selected_token', id||''); renderAll(); }
    function moveSelected(dx,dy){ if(!PZ.selectedTokenId) return; runApi('apiMoveToken', payload({tokenId:PZ.selectedTokenId,dx:dx,dy:dy})); }
    function moveSelectedTo(x,y){ if(!PZ.selectedTokenId) return; runApi('apiMoveToken', payload({tokenId:PZ.selectedTokenId,x:x,y:y})); }
    function rollDice(mode){ animateRoll(); runApi('apiRoll', payload({tokenId:PZ.selectedTokenId,dice:byId('diceExpr').value,label:byId('rollLabel').value,botId:byId('diceBot').value,mode:mode||'normal'})); }
    function skillCheck(){ animateRoll(); runApi('apiSkillCheck', payload({tokenId:PZ.selectedTokenId,skill:byId('skillSelect').value})); }
    function attackTarget(){ animateRoll(); runApi('apiAttack', payload({tokenId:PZ.selectedTokenId,targetId:byId('targetSelect').value,attackIndex:byId('attackSelect').value})); }
    function castSpell(){ animateRoll(); runApi('apiCastSpell', payload({tokenId:PZ.selectedTokenId,targetId:byId('targetSelect').value,spellIndex:byId('spellSelect').value})); }
    function interactFeature(){ animateRoll(); runApi('apiInteract', payload({tokenId:PZ.selectedTokenId,targetId:byId('featureSelect').value,action:byId('interactAction').value,dc:byId('interactDc').value,skill:byId('skillSelect').value})); }
    function importCharacter(isDMPC,isNPC){ runApi('apiImportCharacter', payload({characterJson:byId('characterJson').value,ownerPlayerId:byId('ownerPlayerId').value||PZ.playerId,isDMPC:isDMPC,isNPC:isNPC})); }
    function generateEncounter(){ runApi('apiDMGenerateEncounter', payload({biome:byId('encBiome').value,difficulty:byId('encDifficulty').value,count:byId('encCount').value})); }
    function rollInitiative(){ runApi('apiRollInitiative', payload()); }
    function endTurn(){ runApi('apiEndTurn', payload()); }
    function importMap(){ runApi('apiImportMap', payload({mapJson:byId('mapJson').value})); }
    function importAudio(){ runApi('apiImportAudio', payload({audioJson:byId('audioJson').value})); }
    function setScene(){ runApi('apiSetScene', payload({lighting:byId('sceneLighting').value,ambience:byId('sceneAmbience').value,soundClipId:byId('sceneSound').value})); }
    function exportState(){ google.script.run.withSuccessHandler(function(s){ byId('stateBackup').value=JSON.stringify(s,null,2); }).withFailureHandler(function(e){alert(e.message||e);}).apiExportState(payload()); }
    function importState(){ runApi('apiImportFullState', payload({stateJson:byId('stateBackup').value})); }
    function resetSession(){ if(confirm('Reset the whole PlayerZone encounter session?')) runApi('apiResetSession', payload()); }
    function zoomBoard(dir){ PZ.cell=Math.max(22,Math.min(60,PZ.cell+(dir*4))); document.documentElement.style.setProperty('--cell',PZ.cell+'px'); byId('cellHit').removeAttribute('data-size'); renderMap(); }
    function showTab(name){ document.querySelectorAll('.tab').forEach(function(t){t.classList.remove('active')}); document.querySelectorAll('.tab-panel').forEach(function(p){p.classList.remove('active')}); document.querySelector('button[onclick="showTab(\''+name+'\')"]').classList.add('active'); byId('tab-'+name).classList.add('active'); }
    function toggleCompact(){ PZ.compact=!PZ.compact; document.querySelectorAll('.subtitle,.small').forEach(function(el){el.style.display=PZ.compact?'none':'';}); }
    function animateRoll(){ document.body.classList.remove('sound-flash'); void document.body.offsetWidth; document.body.classList.add('sound-flash'); beep(); }
    function beep(){ try{ var ctx=new (window.AudioContext||window.webkitAudioContext)(); var o=ctx.createOscillator(); var g=ctx.createGain(); o.type='triangle'; o.frequency.value=220+Math.random()*420; g.gain.value=.04; o.connect(g); g.connect(ctx.destination); o.start(); setTimeout(function(){o.stop();ctx.close();},130); }catch(e){} }
    function playSceneAudioIfNeeded(id){
      var player=byId('soundPlayer'); if(!id){ if(!player.paused) player.pause(); player.removeAttribute('data-id'); return; }
      if(player.getAttribute('data-id')===id) return;
      var clip=(PZ.state.audio.clips||[]).filter(function(c){return c.id===id;})[0]; if(!clip) return;
      player.src=clip.url; player.loop=!!clip.loop; player.volume=clip.volume===undefined?.65:clip.volume; player.setAttribute('data-id',id); player.play().catch(function(){});
    }
    function escapeHtml(v){ return String(v===undefined?'':v).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
    window.addEventListener('load', init);
  </script>
</body>
</html>`;
}

    return {
      "doGet": (typeof doGet === 'function' ? doGet : null),
      "apiPing": (typeof apiPing === 'function' ? apiPing : null),
      "apiLoadState": (typeof apiLoadState === 'function' ? apiLoadState : null),
      "apiJoin": (typeof apiJoin === 'function' ? apiJoin : null),
      "apiHeartbeat": (typeof apiHeartbeat === 'function' ? apiHeartbeat : null),
      "apiImportCharacter": (typeof apiImportCharacter === 'function' ? apiImportCharacter : null),
      "apiImportParty": (typeof apiImportParty === 'function' ? apiImportParty : null),
      "apiImportMap": (typeof apiImportMap === 'function' ? apiImportMap : null),
      "apiSetCurrentMap": (typeof apiSetCurrentMap === 'function' ? apiSetCurrentMap : null),
      "apiImportAudio": (typeof apiImportAudio === 'function' ? apiImportAudio : null),
      "apiSetScene": (typeof apiSetScene === 'function' ? apiSetScene : null),
      "apiMoveToken": (typeof apiMoveToken === 'function' ? apiMoveToken : null),
      "apiSetToken": (typeof apiSetToken === 'function' ? apiSetToken : null),
      "apiRoll": (typeof apiRoll === 'function' ? apiRoll : null),
      "apiSkillCheck": (typeof apiSkillCheck === 'function' ? apiSkillCheck : null),
      "apiAttack": (typeof apiAttack === 'function' ? apiAttack : null),
      "apiCastSpell": (typeof apiCastSpell === 'function' ? apiCastSpell : null),
      "apiInteract": (typeof apiInteract === 'function' ? apiInteract : null),
      "apiRollInitiative": (typeof apiRollInitiative === 'function' ? apiRollInitiative : null),
      "apiEndTurn": (typeof apiEndTurn === 'function' ? apiEndTurn : null),
      "apiDMGenerateEncounter": (typeof apiDMGenerateEncounter === 'function' ? apiDMGenerateEncounter : null),
      "apiDMAddFeature": (typeof apiDMAddFeature === 'function' ? apiDMAddFeature : null),
      "apiResetSession": (typeof apiResetSession === 'function' ? apiResetSession : null),
      "apiExportState": (typeof apiExportState === 'function' ? apiExportState : null),
      "apiImportFullState": (typeof apiImportFullState === 'function' ? apiImportFullState : null)
    };
  })();
  return TDM92_MODULE_CACHE.playerzone;
}


/* ==========================================================================
 * Wrapped source module: Belavadös Effect Studio Launcher
 * ========================================================================== */
function tdm92_module_effect_() {
  if (TDM92_MODULE_CACHE.effect) return TDM92_MODULE_CACHE.effect;
  TDM92_MODULE_CACHE.effect = (function () {
/*******************************************************
 * Belavados Effect Studio — Google Apps Script Launcher
 * Copy/paste this entire file into Code.gs.
 *
 * Deploy as:
 *   Deploy > New deployment > Web app
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * This creates an installable launcher icon that opens:
 * https://tyrannosaurusdm92.github.io/BelavadosProjects/BelavadosEffectStudio
 *
 * Added local map_assets bridge support:
 *   Google Apps Script cannot directly read C:\Users\Public\Pictures\map_assets,
 *   because Apps Script runs on Google's servers, not on your Windows computer.
 *   This backend now exposes configuration + browser helper routes for the
 *   BelavadosEffectsStudio local image bridge. The companion local Node bridge
 *   must be running on the computer that owns map_assets.
 *******************************************************/

const APP_NAME = 'Belavados Effect Studio';
const APP_SHORT_NAME = 'Effect Studio';
const APP_DESCRIPTION = 'Belavados responsive desktop and mobile effect layer studio.';
const APP_URL = 'https://tyrannosaurusdm92.github.io/BelavadosProjects/BelavadosEffectStudio';

// Put real icon files at these GitHub paths when ready.
// Recommended sizes: 192x192 and 512x512 PNG.
const ICON_192 = 'https://tyrannosaurusdm92.github.io/BelavadosProjects/BelavadosEffectStudio/icons/icon-192.png';
const ICON_512 = 'https://tyrannosaurusdm92.github.io/BelavadosProjects/BelavadosEffectStudio/icons/icon-512.png';

const THEME_COLOR = '#00ffff';
const BACKGROUND_COLOR = '#050713';

/*******************************************************
 * Local map_assets bridge settings
 *
 * map_assets stays the same, exactly as requested:
 *   C:\Users\Public\Pictures\map_assets
 *
 * The GitHub app / launcher can call route=local-assets-helper.js
 * to get a browser helper. That helper talks to the local bridge:
 *   http://127.0.0.1:5177
 *
 * The local bridge can live-search/list/fetch files directly from
 * map_assets, even when the image is not present in JSON manifests.
 *******************************************************/
const BELAVADOSEFFECTSSTUDIO_LOCAL_ASSET_ROOT_WINDOWS = 'C:\\Users\\Public\\Pictures\\map_assets';
const BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN = 'http://127.0.0.1:5177';
const BELAVADOSEFFECTSSTUDIO_LOCAL_FETCH_BASE = BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN + '/local-map-assets/';
const BELAVADOSEFFECTSSTUDIO_LOCAL_STATUS_PATH = '/belavadoseffectsstudio-local-bridge-status';
const BELAVADOSEFFECTSSTUDIO_LOCAL_LIST_PATH = '/belavadoseffectsstudio-local-assets/list';
const BELAVADOSEFFECTSSTUDIO_LOCAL_SEARCH_PATH = '/belavadoseffectsstudio-local-assets/search';
const BELAVADOSEFFECTSSTUDIO_LOCAL_FILE_PATH = '/belavadoseffectsstudio-local-assets/file';

function doGet(e) {
  const route = String((e && e.parameter && e.parameter.route) || 'app').toLowerCase();

  if (route === 'manifest') {
    return manifest_();
  }

  if (route === 'offline') {
    return offline_();
  }

  if (route === 'local-assets-config' || route === 'map-assets-config') {
    return localAssetsConfig_();
  }

  if (route === 'local-assets-helper' || route === 'local-assets-helper.js' || route === 'map-assets-helper.js') {
    return localAssetsHelperJs_();
  }

  if (route === 'local-assets-readme' || route === 'map-assets-readme') {
    return localAssetsReadme_();
  }

  return HtmlService
    .createHtmlOutput(appShell_())
    .setTitle(APP_NAME)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function manifest_() {
  const manifest = {
    name: APP_NAME,
    short_name: APP_SHORT_NAME,
    description: APP_DESCRIPTION,
    start_url: ScriptApp.getService().getUrl(),
    scope: ScriptApp.getService().getUrl(),
    display: 'standalone',
    orientation: 'any',
    theme_color: THEME_COLOR,
    background_color: BACKGROUND_COLOR,
    icons: [
      {
        src: ICON_192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable'
      },
      {
        src: ICON_512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable'
      }
    ],
    shortcuts: [
      {
        name: 'Open Studio',
        short_name: 'Studio',
        description: 'Launch Belavados Effect Studio',
        url: APP_URL,
        icons: [
          {
            src: ICON_192,
            sizes: '192x192',
            type: 'image/png'
          }
        ]
      }
    ]
  };

  return ContentService
    .createTextOutput(JSON.stringify(manifest, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function localAssetsConfig_() {
  const config = {
    app: 'BelavadosEffectsStudio',
    mode: 'manifest-independent-local-map-assets-bridge',
    description: 'Live local bridge settings for images stored under map_assets on this computer. This does not require the image to exist in map_assets manifests.',
    localAssetRootWindows: BELAVADOSEFFECTSSTUDIO_LOCAL_ASSET_ROOT_WINDOWS,
    mapAssetsFolderName: 'map_assets',
    localBridgeOrigin: BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN,
    statusUrl: BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN + BELAVADOSEFFECTSSTUDIO_LOCAL_STATUS_PATH,
    listUrl: BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN + BELAVADOSEFFECTSSTUDIO_LOCAL_LIST_PATH,
    searchUrl: BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN + BELAVADOSEFFECTSSTUDIO_LOCAL_SEARCH_PATH,
    fileUrl: BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN + BELAVADOSEFFECTSSTUDIO_LOCAL_FILE_PATH,
    fetchBaseUrl: BELAVADOSEFFECTSSTUDIO_LOCAL_FETCH_BASE,
    manifestIndependent: true,
    requiresLocalBridge: true,
    supportedImageExtensions: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.bmp', '.avif', '.ico', '.tif', '.tiff', '.jfif'],
    routes: {
      status: BELAVADOSEFFECTSSTUDIO_LOCAL_STATUS_PATH,
      list: BELAVADOSEFFECTSSTUDIO_LOCAL_LIST_PATH,
      search: BELAVADOSEFFECTSSTUDIO_LOCAL_SEARCH_PATH,
      file: BELAVADOSEFFECTSSTUDIO_LOCAL_FILE_PATH,
      fetchBase: '/local-map-assets/'
    },
    note: 'Google Apps Script cannot read local Windows files by itself. Run the companion local bridge on the same computer as C:\\Users\\Public\\Pictures\\map_assets.'
  };

  return ContentService
    .createTextOutput(JSON.stringify(config, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function localAssetsHelperJs_() {
  const config = {
    app: 'BelavadosEffectsStudio',
    localAssetRootWindows: BELAVADOSEFFECTSSTUDIO_LOCAL_ASSET_ROOT_WINDOWS,
    localBridgeOrigin: BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN,
    fetchBaseUrl: BELAVADOSEFFECTSSTUDIO_LOCAL_FETCH_BASE,
    statusPath: BELAVADOSEFFECTSSTUDIO_LOCAL_STATUS_PATH,
    listPath: BELAVADOSEFFECTSSTUDIO_LOCAL_LIST_PATH,
    searchPath: BELAVADOSEFFECTSSTUDIO_LOCAL_SEARCH_PATH,
    filePath: BELAVADOSEFFECTSSTUDIO_LOCAL_FILE_PATH,
    manifestIndependent: true
  };

  const js = `/* BelavadosEffectsStudio local map_assets helper.
 * Load this in the GitHub app or copy the object into the app JS.
 * It talks to http://127.0.0.1:5177 and can search/fetch images that are
 * inside C:\\Users\\Public\\Pictures\\map_assets even when they are not in manifests.
 */
(function (global) {
  'use strict';

  var config = ${JSON.stringify(config, null, 2)};

  function encodeRelativePath(relativePath) {
    return String(relativePath || '')
      .replace(/\\\\/g, '/')
      .replace(/^\\/+/, '')
      .split('/')
      .filter(Boolean)
      .map(encodeURIComponent)
      .join('/');
  }

  function bridgeUrl(path, params) {
    var url = new URL(path, config.localBridgeOrigin);
    params = params || {};
    Object.keys(params).forEach(function (key) {
      var value = params[key];
      if (value === undefined || value === null || value === '') return;
      url.searchParams.set(key, String(value));
    });
    return url.toString();
  }

  async function fetchJson(path, params) {
    var res = await fetch(bridgeUrl(path, params), { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('BelavadosEffectsStudio local map_assets bridge failed: HTTP ' + res.status + ' for ' + path);
    }
    return await res.json();
  }

  function imageUrl(relativePath) {
    return config.fetchBaseUrl + encodeRelativePath(relativePath);
  }

  function fileUrl(relativePath, deep) {
    return bridgeUrl(config.filePath, { path: relativePath, deep: deep ? '1' : '' });
  }

  async function fetchBlob(relativePath, options) {
    options = options || {};
    var url = options.deep ? fileUrl(relativePath, true) : imageUrl(relativePath);
    var res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      throw new Error('Could not fetch local map_assets image: ' + relativePath + ' (HTTP ' + res.status + ')');
    }
    return await res.blob();
  }

  async function fetchObjectUrl(relativePath, options) {
    var blob = await fetchBlob(relativePath, options);
    return URL.createObjectURL(blob);
  }

  function normalizeAsset(item) {
    item = item || {};
    var relativePath = item.relativePath || item.path || item.rel || item.name || '';
    return {
      app: 'BelavadosEffectsStudio',
      source: 'live-local-map_assets',
      name: item.name || relativePath.split('/').pop() || 'map asset',
      path: relativePath,
      relativePath: relativePath,
      localAbsolutePath: item.localAbsolutePath || '',
      url: item.url || imageUrl(relativePath),
      fileUrl: fileUrl(relativePath, false),
      size: item.size || 0,
      modifiedAt: item.modifiedAt || '',
      extension: item.extension || '',
      manifestIndependent: true
    };
  }

  var api = {
    config: config,
    encodeRelativePath: encodeRelativePath,
    bridgeUrl: bridgeUrl,
    imageUrl: imageUrl,
    fileUrl: fileUrl,
    fetchBlob: fetchBlob,
    fetchObjectUrl: fetchObjectUrl,
    normalizeAsset: normalizeAsset,
    async status() {
      return await fetchJson(config.statusPath);
    },
    async list(options) {
      options = options || {};
      return await fetchJson(config.listPath, {
        dir: options.dir || '',
        recursive: options.recursive === false ? '0' : '1',
        max: options.max || 500,
        cursor: options.cursor || '',
        q: options.q || ''
      });
    },
    async search(query, options) {
      options = options || {};
      return await fetchJson(config.searchPath, {
        q: query || '',
        max: options.max || 500,
        deep: options.deep === false ? '0' : '1'
      });
    },
    async findAnyImage(query, options) {
      var result = await this.search(query, options || { max: 500 });
      result.assets = (result.assets || []).map(normalizeAsset);
      return result;
    }
  };

  global.BelavadosEffectsStudioLocalAssets = api;
})(typeof window !== 'undefined' ? window : this);
`;

  return ContentService
    .createTextOutput(js)
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}

function localAssetsReadme_() {
  const text = [
    'BelavadosEffectsStudio local map_assets backend',
    '',
    'map_assets stays here:',
    BELAVADOSEFFECTSSTUDIO_LOCAL_ASSET_ROOT_WINDOWS,
    '',
    'This Apps Script backend exposes:',
    '- ?route=local-assets-config',
    '- ?route=local-assets-helper.js',
    '',
    'Important:',
    'Google Apps Script cannot directly scan local Windows folders. To grab images that are not in manifests, run the companion local bridge on the same Windows computer as map_assets.',
    '',
    'Local bridge endpoints expected by the helper:',
    BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN + BELAVADOSEFFECTSSTUDIO_LOCAL_STATUS_PATH,
    BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN + BELAVADOSEFFECTSSTUDIO_LOCAL_SEARCH_PATH + '?q=tree&max=50',
    BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN + BELAVADOSEFFECTSSTUDIO_LOCAL_LIST_PATH + '?recursive=1&max=50',
    BELAVADOSEFFECTSSTUDIO_LOCAL_FETCH_BASE + '<relative/path/to/image.png>'
  ].join('\n');

  return ContentService
    .createTextOutput(text)
    .setMimeType(ContentService.MimeType.TEXT);
}

function offline_() {
  return HtmlService
    .createHtmlOutput(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>${escapeHtml_(APP_NAME)} Offline</title>
          <style>
            html, body {
              margin: 0;
              min-height: 100%;
              background: radial-gradient(circle at top, rgba(0,255,255,.18), transparent 38%), #050713;
              color: #eaffff;
              font-family: Arial, sans-serif;
              display: grid;
              place-items: center;
              text-align: center;
            }
            main {
              width: min(92vw, 680px);
              padding: 28px;
              border: 1px solid rgba(0,255,255,.45);
              border-radius: 24px;
              background: rgba(5, 7, 19, .84);
              box-shadow: 0 0 40px rgba(0,255,255,.18);
            }
            h1 {
              margin: 0 0 12px;
              color: #00ffff;
            }
            a {
              color: #00ffff;
            }
          </style>
        </head>
        <body>
          <main>
            <h1>Offline</h1>
            <p>${escapeHtml_(APP_NAME)} needs a connection to open from GitHub Pages.</p>
            <p><a href="${APP_URL}" target="_top">Try opening the studio again</a></p>
          </main>
        </body>
      </html>
    `)
    .setTitle(APP_NAME + ' Offline')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function appShell_() {
  const manifestUrl = ScriptApp.getService().getUrl() + '?route=manifest';
  const localAssetsConfigUrl = ScriptApp.getService().getUrl() + '?route=local-assets-config';
  const localAssetsHelperUrl = ScriptApp.getService().getUrl() + '?route=local-assets-helper.js';

  return `
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base target="_top">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="${THEME_COLOR}">
  <meta name="background-color" content="${BACKGROUND_COLOR}">
  <meta name="description" content="${escapeHtml_(APP_DESCRIPTION)}">

  <title>${escapeHtml_(APP_NAME)}</title>

  <link rel="manifest" href="${manifestUrl}">
  <link rel="icon" type="image/png" sizes="192x192" href="${ICON_192}">
  <link rel="apple-touch-icon" href="${ICON_192}">

  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-title" content="${escapeHtml_(APP_SHORT_NAME)}">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">

  <style>
    :root {
      --cyan: #00ffff;
      --bg: #050713;
      --panel: rgba(5, 7, 19, .84);
      --panel-strong: rgba(8, 14, 32, .95);
      --text: #eaffff;
      --muted: #a7dada;
      --danger: #ff8ad8;
      --line: rgba(0, 255, 255, .38);
      --glow: 0 0 32px rgba(0, 255, 255, .24);
      --radius: 24px;
    }

    * {
      box-sizing: border-box;
    }

    html,
    body {
      margin: 0;
      min-height: 100%;
      background:
        radial-gradient(circle at 18% 12%, rgba(0,255,255,.22), transparent 32%),
        radial-gradient(circle at 88% 8%, rgba(106,97,255,.18), transparent 28%),
        radial-gradient(circle at 50% 100%, rgba(0,255,255,.12), transparent 40%),
        var(--bg);
      color: var(--text);
      font-family: Arial, Helvetica, sans-serif;
    }

    body {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      padding: max(18px, env(safe-area-inset-top)) max(18px, env(safe-area-inset-right)) max(18px, env(safe-area-inset-bottom)) max(18px, env(safe-area-inset-left));
      overflow-x: hidden;
    }

    .shell {
      width: min(100%, 920px);
      display: grid;
      gap: 18px;
    }

    .card {
      border: 1px solid var(--line);
      border-radius: var(--radius);
      background: linear-gradient(180deg, rgba(255,255,255,.055), transparent), var(--panel);
      box-shadow: var(--glow);
      backdrop-filter: blur(16px);
      padding: clamp(20px, 4vw, 42px);
      position: relative;
      overflow: hidden;
    }

    .card::before {
      content: "";
      position: absolute;
      inset: -2px;
      pointer-events: none;
      background:
        linear-gradient(120deg, transparent 0 34%, rgba(0,255,255,.16) 45%, transparent 56% 100%);
      transform: translateX(-70%);
      animation: shimmer 5.5s linear infinite;
    }

    @keyframes shimmer {
      to {
        transform: translateX(70%);
      }
    }

    .content {
      position: relative;
      z-index: 1;
      display: grid;
      gap: 18px;
      justify-items: center;
      text-align: center;
    }

    .icon {
      width: clamp(84px, 18vw, 144px);
      aspect-ratio: 1;
      border-radius: 28%;
      border: 1px solid rgba(0,255,255,.55);
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 50% 35%, rgba(232,255,255,.92), rgba(0,255,255,.18) 31%, transparent 48%),
        linear-gradient(135deg, rgba(0,255,255,.22), rgba(10,12,32,.95));
      box-shadow:
        0 0 34px rgba(0,255,255,.35),
        inset 0 0 28px rgba(0,255,255,.22);
      overflow: hidden;
    }

    .icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .fallback-mark {
      font-size: clamp(38px, 8vw, 68px);
      line-height: 1;
      filter: drop-shadow(0 0 12px rgba(0,255,255,.65));
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 7vw, 4.6rem);
      line-height: .95;
      color: var(--cyan);
      text-shadow:
        0 0 18px rgba(0,255,255,.62),
        0 3px 0 #001316;
      letter-spacing: .02em;
    }

    p {
      margin: 0;
      max-width: 62ch;
      color: var(--muted);
      font-size: clamp(1rem, 2.6vw, 1.18rem);
      line-height: 1.55;
    }

    code {
      color: var(--text);
      background: rgba(0, 0, 0, .28);
      border: 1px solid rgba(0,255,255,.18);
      border-radius: 8px;
      padding: 2px 5px;
      word-break: break-word;
    }

    .buttons {
      width: 100%;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: 12px;
      margin-top: 4px;
    }

    button,
    a.button {
      appearance: none;
      border: 1px solid rgba(0,255,255,.65);
      border-radius: 999px;
      background: rgba(0,255,255,.12);
      color: var(--text);
      min-height: 48px;
      padding: 12px 18px;
      font-size: 1rem;
      font-weight: 800;
      letter-spacing: .02em;
      text-decoration: none;
      cursor: pointer;
      box-shadow: 0 0 18px rgba(0,255,255,.16);
      transition: transform .16s ease, background .16s ease, box-shadow .16s ease;
      touch-action: manipulation;
    }

    button:hover,
    a.button:hover,
    button:focus-visible,
    a.button:focus-visible {
      transform: translateY(-1px);
      background: rgba(0,255,255,.2);
      box-shadow: 0 0 26px rgba(0,255,255,.28);
      outline: none;
    }

    .primary {
      background: rgba(0,255,255,.26);
    }

    .steps {
      display: grid;
      gap: 10px;
      text-align: left;
      width: min(100%, 720px);
      margin-top: 8px;
      border: 1px solid rgba(0,255,255,.2);
      border-radius: 18px;
      background: rgba(0,0,0,.18);
      padding: 16px;
    }

    .steps strong {
      color: var(--cyan);
    }

    .steps div {
      color: var(--muted);
      line-height: 1.45;
    }

    .mini {
      font-size: .92rem;
      color: rgba(234,255,255,.72);
    }

    .status {
      min-height: 1.4em;
      font-size: .95rem;
      color: var(--text);
    }

    .hidden {
      display: none !important;
    }

    @media (max-width: 560px) {
      body {
        place-items: stretch;
      }

      .shell {
        align-self: center;
      }

      .card {
        border-radius: 22px;
        padding: 22px 16px;
      }

      .buttons {
        display: grid;
      }

      button,
      a.button {
        width: 100%;
      }
    }

    @media (display-mode: standalone) {
      .install-only {
        display: none !important;
      }
    }
  </style>
</head>

<body>
  <main class="shell">
    <section class="card">
      <div class="content">
        <div class="icon" aria-hidden="true">
          <img src="${ICON_512}" alt="" onerror="this.remove();document.querySelector('.fallback-mark').classList.remove('hidden');">
          <span class="fallback-mark hidden">⚡</span>
        </div>

        <h1>${escapeHtml_(APP_NAME)}</h1>

        <p>
          Install this launcher as a desktop or mobile icon. When opened, it launches your GitHub Pages studio.
        </p>

        <div class="buttons">
          <button id="installBtn" class="primary install-only" type="button">Install Icon</button>
          <a class="button" href="${APP_URL}" target="_top" rel="noopener">Open Studio</a>
          <a class="button" href="${localAssetsConfigUrl}" target="_blank" rel="noopener">map_assets Config</a>
        </div>

        <div id="status" class="status"></div>

        <div class="steps install-only" id="manualSteps">
          <div><strong>Desktop Chrome / Edge:</strong> use the Install button, or click the install icon in the address bar.</div>
          <div><strong>Android Chrome:</strong> tap the browser menu, then “Add to Home screen” or “Install app.”</div>
          <div><strong>iPhone / iPad Safari:</strong> tap Share, then “Add to Home Screen.”</div>
          <div><strong>Local image bridge:</strong> keep images under <code>${escapeHtml_(BELAVADOSEFFECTSSTUDIO_LOCAL_ASSET_ROOT_WINDOWS)}</code>. Run the companion local bridge to search and fetch images that are not in manifests.</div>
        </div>

        <p class="mini">
          GitHub target: ${escapeHtml_(APP_URL)}<br>
          Local asset helper: ${escapeHtml_(localAssetsHelperUrl)}
        </p>
      </div>
    </section>
  </main>

  <script>
    const APP_URL = ${JSON.stringify(APP_URL)};
    const LOCAL_BRIDGE_STATUS_URL = ${JSON.stringify(BELAVADOSEFFECTSSTUDIO_LOCAL_BRIDGE_ORIGIN + BELAVADOSEFFECTSSTUDIO_LOCAL_STATUS_PATH)};
    let deferredPrompt = null;

    const installBtn = document.getElementById('installBtn');
    const statusEl = document.getElementById('status');

    function setStatus(message) {
      statusEl.textContent = message || '';
    }

    function isStandalone() {
      return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    }

    async function checkLocalBridge() {
      try {
        const res = await fetch(LOCAL_BRIDGE_STATUS_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (data && data.ok) return ' Local map_assets bridge is running.';
        return ' Local map_assets bridge is reachable, but map_assets was not found.';
      } catch (err) {
        return ' Local map_assets bridge is not running yet.';
      }
    }

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      installBtn.hidden = false;
      setStatus('Ready to install.');
    });

    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) {
        setStatus('Use your browser menu to add this launcher to your desktop or home screen.');
        return;
      }

      deferredPrompt.prompt();

      const choice = await deferredPrompt.userChoice;
      deferredPrompt = null;

      if (choice && choice.outcome === 'accepted') {
        setStatus('Installed. Open the new icon to launch the studio.');
      } else {
        setStatus('Install canceled.');
      }
    });

    window.addEventListener('appinstalled', () => {
      setStatus('Installed. Open the new icon to launch the studio.');
    });

    checkLocalBridge().then((bridgeMessage) => {
      if (isStandalone()) {
        setStatus('Opening Belavados Effect Studio...' + bridgeMessage);
        setTimeout(() => {
          window.location.href = APP_URL;
        }, 650);
      } else {
        setStatus('Install this launcher, or open the studio directly.' + bridgeMessage);
      }
    });
  </script>
</body>
</html>
`;
}

function escapeHtml_(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

    return {
      "doGet": (typeof doGet === 'function' ? doGet : null)
    };
  })();
  return TDM92_MODULE_CACHE.effect;
}


/* ==========================================================================
 * Wrapped source module: Social Application Shared Backend
 * ========================================================================== */
function tdm92_module_social_() {
  if (TDM92_MODULE_CACHE.social) return TDM92_MODULE_CACHE.social;
  TDM92_MODULE_CACHE.social = (function () {
/**
 * Social Application Shared Google Apps Script Backend
 * --------------------------------------------------
 * Copy this entire file into a new Google Apps Script project, run setup(), then deploy as a Web app.
 * Deploy settings recommended for a private friend/family network:
 *   Execute as: Me
 *   Who has access: Anyone with the link
 *
 * The browser site supplies its own projectId, so this one Apps Script deployment can be reused by
 * multiple separate projects/sites. The backend stores each project separately in the same spreadsheet.
 *
 * Current deployed web app URL embedded in the frontend:
 * https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec
 * Deployment ID:
 * AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g
 *
 * Important architecture note:
 * - Google Apps Script can store messages/files/events, authenticate sessions, enforce the 10-person cap,
 *   and act as a WebRTC signaling mailbox.
 * - Google Apps Script cannot be a WebSocket/SSE/TURN/SFU media server. Camera, filters, audio/video calls,
 *   screen sharing, and screen/audio recording happen in the browser through WebRTC/MediaRecorder/getUserMedia.
 * - This replacement adds backend storage and mailbox/signaling support for those browser features:
 *   Google/cloud identity verification, invite/reset email delivery, call rooms, call signaling,
 *   uploaded voice/video/camera media, transcript records, face descriptor/filter metadata, and generic
 *   multi-user cloud records.
 */

const SOCIAL_APP = {
  VERSION: '2.0.0-socials-application-cloud-realtime-media',
  DINO_EMAIL: 'williamsaville92@gmail.com',
  RESET_CODE_MINUTES: 30,
  MIN_PASSWORD_LENGTH: 4,
  MAX_REGISTERED_USERS_PER_PROJECT: 10,
  MAX_ACTIVE_USERS_PER_PROJECT: 10,
  ACTIVE_WINDOW_MS: 2 * 60 * 1000,
  SESSION_TTL_MS: 12 * 60 * 60 * 1000,
  STORY_MAX_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  STORY_DEFAULT_TTL_MS: 24 * 60 * 60 * 1000,
  MAX_TEXT: 4000,
  MAX_MEDIA_CHARS_IN_SHEET: 40000,
  PUBLIC_DRIVE_FILE_LINKS: true,
  SPREADSHEET_PROPERTY: 'SOCIAL_APPLICATION_SPREADSHEET_ID',
  FILE_FOLDER_PROPERTY: 'SOCIAL_APPLICATION_UPLOAD_FOLDER_ID',
  GOOGLE_CLIENT_ID_PROPERTY: 'SOCIAL_APPLICATION_GOOGLE_CLIENT_ID',
  SPEECH_TO_TEXT_WEBHOOK_PROPERTY: 'SOCIAL_APPLICATION_SPEECH_TO_TEXT_WEBHOOK_URL',
  SPEECH_TO_TEXT_API_KEY_PROPERTY: 'SOCIAL_APPLICATION_SPEECH_TO_TEXT_API_KEY',
  TURN_CONFIG_JSON_PROPERTY: 'SOCIAL_APPLICATION_TURN_CONFIG_JSON',
  MEDIA_MAX_INLINE_CHARS: 40000,
  CALL_EVENT_TTL_MS: 60 * 60 * 1000,
  FACE_MATCH_THRESHOLD: 0.55,
  SHEETS: {
    USERS: ['projectId','userId','username','displayName','salt','passHash','role','avatar','status','createdAt','updatedAt','disabled','email','phone','backupEmailsJson','mustChangePassword','tempCodeSalt','tempCodeHash','tempCodeExpiresAt','resetTokenSalt','resetTokenHash','resetRequestedAt','resetDelivery','resetRequestedBy','lastPasswordChangedAt','lastTemporaryLoginAt'],
    SESSIONS: ['token','projectId','userId','displayName','createdAt','lastSeen','userAgent'],
    PROFILES: ['projectId','id','name','color','status','updatedAt'],
    FEED: ['projectId','id','author','text','media','mediaType','createdAt','reactionsJson','commentsJson'],
    CHANNELS: ['projectId','name','createdAt'],
    MESSAGES: ['projectId','channel','id','author','text','media','mediaType','origin','createdAt','reactionsJson'],
    STORIES: ['projectId','id','author','text','media','mediaType','createdAt','expiresAt','reactionsJson'],
    MESSENGER: ['projectId','id','type','clientId','createdAt','payloadJson','appName'],
    ROOMS: ['projectId','room','passHash','createdAt','updatedAt','participantsJson'],
    SIGNALS: ['projectId','room','id','fromPeer','toPeer','type','payloadJson','createdAt','deliveredJson'],
    EVENTS: ['projectId','id','title','start','end','location','description','createdBy','createdAt','updatedAt','calendarEventId'],
    FILES: ['projectId','id','name','mimeType','size','url','driveFileId','createdBy','createdAt'],
    SETTINGS: ['projectId','projectName','updatedAt','settingsJson'],
    AUDIT: ['at','projectId','action','userId','detailsJson'],
    RESET_REQUESTS: ['projectId','id','accountId','identifier','delivery','target','resetLink','expiresAt','requestedAt','requestedBy','sentToDino','status','detailsJson'],
    AUTH_PROVIDERS: ['projectId','userId','provider','providerUserId','email','displayName','photoUrl','createdAt','updatedAt','lastSignInAt','rawJson'],
    APP_RECORDS: ['projectId','collection','id','owner','createdAt','updatedAt','jsonData'],
    CALLS: ['projectId','callId','room','kind','createdBy','createdAt','updatedAt','status','participantsJson','settingsJson'],
    CALL_EVENTS: ['projectId','callId','room','id','fromPeer','toPeer','type','payloadJson','createdAt'],
    MEDIA_ASSETS: ['projectId','id','kind','owner','room','messageId','name','mimeType','size','url','driveFileId','durationMs','thumbnailUrl','transcript','faceMetaJson','createdAt','updatedAt'],
    VOICE_MESSAGES: ['projectId','id','conversationId','author','mediaId','durationMs','waveformJson','transcript','status','createdAt'],
    VIDEOS: ['projectId','id','author','mediaId','kind','thumbnailUrl','durationMs','transcript','status','createdAt'],
    TRANSCRIPTS: ['projectId','id','mediaId','sourceKind','language','transcript','status','provider','createdBy','createdAt','updatedAt','providerJson'],
    FACE_PROFILES: ['projectId','userId','profileId','label','descriptorJson','modelsVersion','consent','createdAt','updatedAt'],
    FILTER_PRESETS: ['projectId','id','createdBy','name','kind','configJson','thumbnailUrl','createdAt','updatedAt']
  }
};

function setup() {
  const ss = getSpreadsheet_();
  Object.keys(SOCIAL_APP.SHEETS).forEach(function(name){ getSheet_(name); });
  getUploadFolder_();
  return { ok: true, message: 'Social Application backend ready.', spreadsheetUrl: ss.getUrl(), version: SOCIAL_APP.VERSION };
}

function doGet(e) {
  return handleRequest_(e, 'GET');
}

function doPost(e) {
  return handleRequest_(e, 'POST');
}

function handleRequest_(e, method) {
  try {
    setup();
    const req = normalizeRequest_(e, method);
    const result = route_(req);
    return output_(result, req.callback);
  } catch (err) {
    return output_({ ok: false, error: String(err && err.message ? err.message : err), version: SOCIAL_APP.VERSION }, (e && e.parameter && e.parameter.callback) || '');
  }
}

function normalizeRequest_(e, method) {
  const p = (e && e.parameter) || {};
  let body = {};
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    try { body = JSON.parse(e.postData.contents); }
    catch (_err) { body = {}; }
  }
  const payload = body.payload || body || {};
  return {
    method: method,
    action: String(body.action || p.action || payload.action || 'state'),
    projectId: cleanSlug_(body.projectId || p.projectId || payload.projectId || 'default-project'),
    projectName: cleanText_(body.projectName || p.projectName || payload.projectName || 'Social Application Project', 160),
    sessionToken: String(body.sessionToken || p.sessionToken || payload.sessionToken || ''),
    callback: String(p.callback || ''),
    payload: mergeObjects_(payload, p)
  };
}

function route_(req) {
  const action = req.action;
  if (action === 'ping') return { ok: true, version: SOCIAL_APP.VERSION, now: new Date().toISOString() };
  if (action === 'setup') return setup();
  if (action === 'manifest') return manifest_(req);
  if (action === 'iceConfig' || action === 'ice_config') return iceConfig_(req);

  // Cloud identity and emailed temporary-login support.
  if (action === 'cloud_auth_sign_in' || action === 'google_auth_sign_in') return cloudAuthSignIn_(req);
  if (action === 'link_cloud_provider') return linkCloudProvider_(req);
  if (action === 'send_invite_email' || action === 'deliver_temporary_password' || action === 'email_temporary_password') return sendInviteOrTemporaryPassword_(req);

  // Backend-ready login and recovery actions used by Socials_Application_backend_ready_login.html.
  if (action === 'create_account') return createAccount_(req);
  if (action === 'sign_in') return signInAccount_(req);
  if (action === 'request_password_reset') return requestPasswordReset_(req);
  if (action === 'tell_dino_cant_login') return tellDinoCantLogin_(req);
  if (action === 'update_password') return updatePassword_(req);

  // Backward-compatible aliases from the larger Social Application backend.
  if (action === 'login') return login_(req);
  if (action === 'register') return register_(req);
  if (action === 'logout') return logout_(req);

  const session = requireSession_(req, action === 'state' || action === 'onlineUsers' || action === 'messengerHistory');
  if (action === 'state') return { ok: true, state: publicState_(req.projectId) };
  if (action === 'onlineUsers') return { ok: true, onlineUsers: onlineUsers_(req.projectId) };
  if (action === 'heartbeat' || action === 'presence') return heartbeat_(req, session);
  if (action === 'profile') return saveProfile_(req, session);
  if (action === 'post') return savePost_(req, session);
  if (action === 'comment') return saveComment_(req, session);
  if (action === 'reaction') return saveReaction_(req, session);
  if (action === 'message') return saveChannelMessage_(req, session);
  if (action === 'importHistory') return importHistory_(req, session);
  if (action === 'story') return saveStory_(req, session);
  if (action === 'exportData') return exportData_(req, session);
  if (action === 'event') return saveEvent_(req, session);
  if (action === 'file') return saveFile_(req, session);
  if (action === 'messengerEnvelope') return messengerEnvelope_(req, session);
  if (action === 'messengerHistory') return { ok: true, envelopes: messengerHistory_(req.projectId) };
  if (action === 'save_record' || action === 'appRecord') return saveAppRecord_(req, session);
  if (action === 'list_records' || action === 'appRecords') return listAppRecords_(req, session);
  if (action === 'save_media_asset' || action === 'mediaAsset' || action === 'camera_capture') return saveMediaAsset_(req, session);
  if (action === 'save_voice_message' || action === 'voiceMessage') return saveVoiceMessage_(req, session);
  if (action === 'save_video' || action === 'videoAsset') return saveVideo_(req, session);
  if (action === 'request_transcription' || action === 'transcribe_media') return requestTranscription_(req, session);
  if (action === 'save_transcript' || action === 'update_transcript') return saveTranscript_(req, session);
  if (action === 'save_face_profile' || action === 'faceProfile') return saveFaceProfile_(req, session);
  if (action === 'list_face_profiles') return listFaceProfiles_(req, session);
  if (action === 'match_face_descriptor' || action === 'recognize_face') return matchFaceDescriptor_(req, session);
  if (action === 'save_filter_preset' || action === 'filterPreset') return saveFilterPreset_(req, session);
  if (action === 'list_filter_presets') return listFilterPresets_(req, session);
  if (action === 'create_call' || action === 'callCreate') return createCall_(req, session);
  if (action === 'join_call' || action === 'callJoin') return joinCall_(req, session);
  if (action === 'leave_call' || action === 'callLeave') return leaveCall_(req, session);
  if (action === 'end_call' || action === 'callEnd') return endCall_(req, session);
  if (action === 'call_signal' || action === 'callSignal') return callSignal_(req, session);
  if (action === 'poll_call' || action === 'callPoll') return pollCall_(req, session);
  if (action === 'roomJoin') return roomJoin_(req, session);
  if (action === 'roomHeartbeat') return roomHeartbeat_(req, session);
  if (action === 'roomLeave') return roomLeave_(req, session);
  if (action === 'roomSignal') return roomSignal_(req, session);
  if (action === 'roomChat') return roomChat_(req, session);
  if (action === 'roomReaction') return roomReaction_(req, session);
  if (action === 'roomRaiseHand') return roomRaiseHand_(req, session);
  if (action === 'roomPoll') return roomPoll_(req, session);
  throw new Error('Unknown action: ' + action);
}

function login_(req) {
  const payload = req.payload || {};
  const username = cleanUsername_(payload.username);
  const password = String(payload.password || '');
  if (!username || !password) throw new Error('Username and password are required.');
  pruneSessions_();
  const users = rows_('USERS').filter(function(u){ return u.projectId === req.projectId && String(u.username).toLowerCase() === username.toLowerCase() && String(u.disabled) !== 'true'; });
  if (!users.length) throw new Error('User not found. Use Register for the first setup, or check the username.');
  const user = users[0];
  if (hashPassword_(password, user.salt) !== user.passHash) throw new Error('Incorrect password.');
  enforceActiveLimit_(req.projectId, '');
  const session = createSession_(req.projectId, user.userId, user.displayName, payload.userAgent);
  audit_(req.projectId, 'login', user.userId, { username: username });
  return { ok: true, session: session, user: publicUser_(user), state: publicState_(req.projectId) };
}

function register_(req) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const payload = req.payload || {};
    const username = cleanUsername_(payload.username);
    const password = String(payload.password || '');
    const displayName = cleanText_(payload.displayName || username, 80);
    if (!username || !password || password.length < 6) throw new Error('Username and a password of at least 6 characters are required.');
    const existing = rows_('USERS').filter(function(u){ return u.projectId === req.projectId; });
    if (existing.some(function(u){ return String(u.username).toLowerCase() === username.toLowerCase(); })) throw new Error('That username already exists.');
    if (existing.length >= SOCIAL_APP.MAX_REGISTERED_USERS_PER_PROJECT) throw new Error('This project already has the maximum 10 registered users.');
    enforceActiveLimit_(req.projectId, '');
    const salt = randomId_('salt');
    const userId = randomId_('user');
    const now = new Date().toISOString();
    append_('USERS', {
      projectId: req.projectId,
      userId: userId,
      username: username,
      displayName: displayName,
      salt: salt,
      passHash: hashPassword_(password, salt),
      role: existing.length ? 'member' : 'admin',
      avatar: payload.avatar || '💬',
      status: 'Around',
      createdAt: now,
      updatedAt: now,
      disabled: 'false'
    });
    upsertProfile_(req.projectId, { id: cleanSlug_(username), name: displayName, color: '#38bdf8', status: 'Around' });
    const session = createSession_(req.projectId, userId, displayName, payload.userAgent);
    audit_(req.projectId, 'register', userId, { username: username });
    return { ok: true, session: session, user: { userId: userId, username: username, displayName: displayName, role: existing.length ? 'member' : 'admin' }, state: publicState_(req.projectId) };
  } finally {
    lock.releaseLock();
  }
}

/**
 * New backend-ready account system matching the current HTML hooks:
 * create_account, sign_in, request_password_reset, tell_dino_cant_login, update_password.
 *
 * Notes:
 * - The current HTML still performs local password checks until its CONFIG.backendUrl is filled in and
 *   the next HTML pass moves verification fully server-side. These handlers accept those transitional
 *   requests without breaking the page.
 * - Email delivery works through MailApp.
 * - Phone delivery needs either Twilio script properties or a phoneGatewayEmail/carrier email gateway.
 *   Apps Script has no native SMS sender by itself.
 */
function createAccount_(req) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const p = req.payload || {};
    const username = cleanUsername_(p.username || p.displayName || 'friend');
    const displayName = cleanText_(p.displayName || username, 80);
    const email = normalizeEmail_(p.email || p.mainEmail || '');
    const phone = normalizePhone_(p.phone || p.phoneNumber || p.tel || '');
    const backupEmails = parseBackupEmails_(p.backupEmails || p.backupEmailsJson || []);
    const password = String(p.password || p.newPassword || '');

    if (!username) throw new Error('Username is required.');
    if (!email && !phone) throw new Error('Add at least one email address or phone number.');
    if (email && !isEmail_(email)) throw new Error('Main email is not valid.');
    if (password && password.length < SOCIAL_APP.MIN_PASSWORD_LENGTH) throw new Error('Password must be at least ' + SOCIAL_APP.MIN_PASSWORD_LENGTH + ' characters.');

    const existing = rows_('USERS').filter(function(u){ return u.projectId === req.projectId; });
    if (existing.some(function(u){ return identifiersMatchUser_(u, email) || identifiersMatchUser_(u, phone) || identifiersMatchUser_(u, username) || String(u.username || '').toLowerCase() === username.toLowerCase(); })) {
      throw new Error('An account already exists with that email, phone, backup email, or username.');
    }
    if (existing.length >= SOCIAL_APP.MAX_REGISTERED_USERS_PER_PROJECT) throw new Error('This project already has the maximum 10 registered users.');

    const salt = password ? randomId_('salt') : '';
    const userId = cleanText_(p.accountId || p.userId || randomId_('user'), 120);
    const now = new Date().toISOString();
    const row = {
      projectId: req.projectId,
      userId: userId,
      username: username,
      displayName: displayName,
      salt: salt,
      passHash: password ? hashPassword_(password, salt) : '',
      role: existing.length ? 'member' : 'admin',
      avatar: p.avatar || '💬',
      status: 'Around',
      createdAt: p.createdAt || now,
      updatedAt: now,
      disabled: 'false',
      email: email,
      phone: phone,
      backupEmailsJson: JSON.stringify(backupEmails),
      mustChangePassword: password ? 'false' : 'false',
      tempCodeSalt: '',
      tempCodeHash: '',
      tempCodeExpiresAt: '',
      resetTokenSalt: '',
      resetTokenHash: '',
      resetRequestedAt: '',
      resetDelivery: '',
      resetRequestedBy: '',
      lastPasswordChangedAt: password ? now : '',
      lastTemporaryLoginAt: ''
    };
    append_('USERS', row);
    upsertProfile_(req.projectId, { id: cleanSlug_(username), name: displayName, color: '#38bdf8', status: 'Around' });
    audit_(req.projectId, 'create_account', userId, { username: username, email: maskEmail_(email), phone: maskPhone_(phone), backupEmailCount: backupEmails.length, passwordStored: Boolean(password) });
    return { ok: true, user: publicUser_(row), passwordStored: Boolean(password), note: password ? 'Account created with server-side password.' : 'Account metadata saved. The next HTML pass should send password to use server-side login.' };
  } finally {
    lock.releaseLock();
  }
}

function signInAccount_(req) {
  pruneSessions_();
  const p = req.payload || {};
  const identifier = cleanText_(p.identifier || p.email || p.phone || p.username || p.accountId || '', 160);
  const password = String(p.password || p.currentPassword || '');
  if (!identifier) throw new Error('Email, phone number, username, or account ID is required.');

  const user = findUserByIdentifier_(req.projectId, identifier);
  if (!user) throw new Error('No matching account was found.');
  if (String(user.disabled) === 'true') throw new Error('This account is disabled.');

  // Transitional mirror call from the current local-auth HTML after the browser already verified login.
  if (!password) {
    audit_(req.projectId, 'sign_in_client_mirror', user.userId, { identifier: maskIdentifier_(identifier), usedTemporaryCode: Boolean(p.usedTemporaryCode) });
    return { ok: true, mirrored: true, user: publicUser_(user), note: 'Client-side login event received. Send password in the next HTML pass for server-side sessions.' };
  }

  const normalPasswordMatches = user.passHash && user.salt && hashPassword_(password, user.salt) === user.passHash;
  const temporaryCodeMatches = user.tempCodeHash && user.tempCodeSalt && hashPassword_(password, user.tempCodeSalt) === user.tempCodeHash && isFuture_(user.tempCodeExpiresAt);
  if (!normalPasswordMatches && !temporaryCodeMatches) throw new Error('That password or temporary reset code does not match this account.');

  let updatedUser = user;
  if (temporaryCodeMatches) {
    updateRow_('USERS', user._row, { mustChangePassword: 'true', lastTemporaryLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    updatedUser = findUserByIdentifier_(req.projectId, identifier) || user;
  }

  enforceActiveLimit_(req.projectId, '');
  const session = createSession_(req.projectId, updatedUser.userId, updatedUser.displayName || updatedUser.username, p.userAgent);
  audit_(req.projectId, 'sign_in', updatedUser.userId, { identifier: maskIdentifier_(identifier), temporaryCode: temporaryCodeMatches });
  return { ok: true, session: session, user: publicUser_(updatedUser), mustChangePassword: String(updatedUser.mustChangePassword) === 'true' || temporaryCodeMatches, authMethod: temporaryCodeMatches ? 'temporary_code' : 'password', state: publicState_(req.projectId) };
}

function requestPasswordReset_(req) {
  const p = req.payload || {};
  const identifier = cleanText_(p.identifier || p.accountId || p.username || p.email || p.phone || p.target || '', 240);
  const delivery = cleanSlug_(p.delivery || p.method || 'email');
  if (!identifier) throw new Error('Account lookup is required.');
  if (['email','phone','dino'].indexOf(delivery) < 0) throw new Error('Reset delivery must be email, phone, or dino.');

  const user = findUserByIdentifier_(req.projectId, identifier);
  if (!user) throw new Error('No matching account was found. Use the Dino recovery button for manual help.');

  const reset = createResetForUser_(req, user, identifier, delivery, p);
  let result;
  if (delivery === 'email') result = sendResetEmail_(req, user, reset, p);
  else if (delivery === 'phone') result = sendResetPhone_(req, user, reset, p);
  else result = emailDinoRecovery_(req, user, reset, p, 'Dino recovery requested');

  logResetRequest_(req.projectId, user.userId, identifier, delivery, result.target || '', reset.resetLink, reset.expiresAt, identifier, result.sentToDino || false, result.status || 'sent', result);
  audit_(req.projectId, 'request_password_reset', user.userId, { delivery: delivery, status: result.status, target: maskIdentifier_(result.target || '') });
  return {
    ok: true,
    delivery: delivery,
    sent: Boolean(result.sent),
    sentToDino: Boolean(result.sentToDino),
    target: maskIdentifier_(result.target || ''),
    expiresAt: reset.expiresAt,
    resetLink: reset.resetLink,
    phoneNeedsSmsProvider: Boolean(result.phoneNeedsSmsProvider),
    message: result.message || 'Reset request processed.'
  };
}

function tellDinoCantLogin_(req) {
  const p = req.payload || {};
  const identifier = cleanText_(p.identifier || p.accountId || p.username || p.email || p.phone || 'unknown account', 240);
  let user = findUserByIdentifier_(req.projectId, identifier);
  if (!user) user = createRecoveryStubUser_(req, identifier, p);

  const reset = createResetForUser_(req, user, identifier, 'dino', p);
  const result = emailDinoRecovery_(req, user, reset, p, 'Socials Application login help needed');
  logResetRequest_(req.projectId, user.userId, identifier, 'dino', SOCIAL_APP.DINO_EMAIL, reset.resetLink, reset.expiresAt, identifier, true, result.status || 'sent_to_dino', result);
  audit_(req.projectId, 'tell_dino_cant_login', user.userId, { identifier: maskIdentifier_(identifier), sentToDino: true });
  return { ok: true, sentToDino: true, dinoEmail: SOCIAL_APP.DINO_EMAIL, expiresAt: reset.expiresAt, message: 'Dino has been emailed with the 6 digit temporary reset code.' };
}

function updatePassword_(req) {
  const p = req.payload || {};
  const identifier = cleanText_(p.accountId || p.userId || p.identifier || p.email || p.phone || p.username || '', 240);
  if (!identifier) throw new Error('Account ID, email, phone, or username is required.');
  const user = findUserByIdentifier_(req.projectId, identifier);
  if (!user) throw new Error('No matching account was found.');
  if (String(user.disabled) === 'true') throw new Error('This account is disabled.');

  const newPassword = String(p.newPassword || p.password || '');
  const backupEmails = mergeBackupEmails_(parseBackupEmails_(user.backupEmailsJson), parseBackupEmails_(p.backupEmails || p.backupEmailsJson || []));
  if (newPassword && newPassword.length < SOCIAL_APP.MIN_PASSWORD_LENGTH) throw new Error('New password must be at least ' + SOCIAL_APP.MIN_PASSWORD_LENGTH + ' characters.');
  if (p.requireBackupEmail !== false && !backupEmails.length) throw new Error('Add at least one backup email before continuing.');

  const patch = {
    backupEmailsJson: JSON.stringify(backupEmails),
    mustChangePassword: 'false',
    tempCodeSalt: '',
    tempCodeHash: '',
    tempCodeExpiresAt: '',
    resetTokenSalt: '',
    resetTokenHash: '',
    resetRequestedAt: '',
    resetDelivery: '',
    resetRequestedBy: '',
    updatedAt: new Date().toISOString(),
    lastPasswordChangedAt: new Date().toISOString()
  };
  if (newPassword) {
    patch.salt = randomId_('salt');
    patch.passHash = hashPassword_(newPassword, patch.salt);
  }
  updateRow_('USERS', user._row, patch);
  const updatedUser = findUserByIdentifier_(req.projectId, identifier) || mergeObjects_(user, patch);
  audit_(req.projectId, 'update_password', user.userId, { passwordUpdated: Boolean(newPassword), backupEmailCount: backupEmails.length });
  return { ok: true, user: publicUser_(updatedUser), passwordUpdated: Boolean(newPassword), backupEmails: backupEmails, mustChangePassword: false };
}

function createRecoveryStubUser_(req, identifier, p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    let user = findUserByIdentifier_(req.projectId, identifier);
    if (user) return user;
    const email = isEmail_(identifier) ? normalizeEmail_(identifier) : normalizeEmail_(p.email || '');
    const phone = normalizePhone_(identifier) || normalizePhone_(p.phone || '');
    const username = cleanUsername_(p.username || (!email && !phone ? identifier : 'recovery_' + Date.now().toString(36)));
    const userId = cleanText_(p.accountId || p.userId || randomId_('user'), 120);
    const now = new Date().toISOString();
    const row = {
      projectId: req.projectId,
      userId: userId,
      username: username,
      displayName: cleanText_(p.displayName || username || 'Recovery Account', 80),
      salt: '',
      passHash: '',
      role: 'member',
      avatar: '🆘',
      status: 'Recovery needed',
      createdAt: now,
      updatedAt: now,
      disabled: 'false',
      email: email,
      phone: phone,
      backupEmailsJson: JSON.stringify(parseBackupEmails_(p.backupEmails || [])),
      mustChangePassword: 'true',
      tempCodeSalt: '',
      tempCodeHash: '',
      tempCodeExpiresAt: '',
      resetTokenSalt: '',
      resetTokenHash: '',
      resetRequestedAt: '',
      resetDelivery: '',
      resetRequestedBy: '',
      lastPasswordChangedAt: '',
      lastTemporaryLoginAt: ''
    };
    append_('USERS', row);
    return findUserByIdentifier_(req.projectId, userId) || row;
  } finally {
    lock.releaseLock();
  }
}

function createResetForUser_(req, user, identifier, delivery, p) {
  const code = (/^\d{6}$/.test(String(p.resetCode || ''))) ? String(p.resetCode) : generateSixDigitCode_();
  const token = cleanText_(p.resetToken || generateToken_(), 160);
  const expiresAt = p.expiresAt || new Date(Date.now() + SOCIAL_APP.RESET_CODE_MINUTES * 60 * 1000).toISOString();
  const codeSalt = randomId_('code');
  const tokenSalt = randomId_('token');
  const resetLink = cleanText_(p.resetLink || buildResetLink_(req, token), 2000);
  updateRow_('USERS', user._row, {
    tempCodeSalt: codeSalt,
    tempCodeHash: hashPassword_(code, codeSalt),
    tempCodeExpiresAt: expiresAt,
    resetTokenSalt: tokenSalt,
    resetTokenHash: hashPassword_(token, tokenSalt),
    resetRequestedAt: new Date().toISOString(),
    resetDelivery: delivery,
    resetRequestedBy: cleanText_(identifier, 240),
    mustChangePassword: 'true',
    updatedAt: new Date().toISOString()
  });
  return { code: code, token: token, resetLink: resetLink, expiresAt: expiresAt };
}

function sendResetEmail_(req, user, reset, p) {
  const email = normalizeEmail_(p.target || p.email || user.email || firstBackupEmail_(user));
  if (!email) throw new Error('This account does not have an email or backup email. Use Dino recovery.');
  const subject = 'Socials Application password reset code';
  const body = resetMessageBody_(user, reset, 'Use this code or reset link to sign in temporarily.');
  MailApp.sendEmail(email, subject, body);
  return { sent: true, status: 'sent_email', target: email, message: 'Reset code and link sent to email.' };
}

function sendResetPhone_(req, user, reset, p) {
  const phone = normalizePhone_(p.target || p.phone || user.phone || '');
  if (!phone) throw new Error('This account does not have a phone number. Try email reset or Dino recovery.');
  const message = 'Socials Application reset code: ' + reset.code + '. Temporary password. Link: ' + reset.resetLink + ' Expires: ' + reset.expiresAt;
  const sms = sendSmsIfConfigured_(phone, message, p);
  if (sms.sent) return { sent: true, status: sms.status, target: phone, message: 'Reset code sent to phone.' };

  const dino = emailDinoRecovery_(req, user, reset, p, 'Phone reset needs Dino delivery');
  return { sent: false, sentToDino: true, status: 'phone_needs_sms_provider_sent_to_dino', target: phone, phoneNeedsSmsProvider: true, message: 'Apps Script needs Twilio or a phone email gateway for real SMS. Dino was emailed the code as fallback.', dino: dino };
}

function emailDinoRecovery_(req, user, reset, p, subject) {
  const dinoEmail = normalizeEmail_(p.dinoEmail || SOCIAL_APP.DINO_EMAIL) || SOCIAL_APP.DINO_EMAIL;
  const body = [
    'Dino, someone cannot log in to Socials Application.',
    '',
    'Project: ' + req.projectId,
    'Account ID: ' + (user.userId || ''),
    'Username: ' + (user.username || ''),
    'Display name: ' + (user.displayName || ''),
    'Email: ' + maskEmail_(user.email || ''),
    'Phone: ' + maskPhone_(user.phone || ''),
    'Requested by / lookup: ' + cleanText_(p.identifier || p.resetRequestedBy || '', 240),
    '',
    'Temporary 6 digit reset code: ' + reset.code,
    'Reset link: ' + reset.resetLink,
    'Code expires: ' + reset.expiresAt,
    '',
    'Give them the 6 digit code. It becomes their temporary password. After they sign in, the site forces a new password and backup emails before the rest of the site opens.'
  ].join('\n');
  MailApp.sendEmail(dinoEmail, subject || 'Socials Application login help needed', body);
  return { sent: true, sentToDino: true, status: 'sent_to_dino', target: dinoEmail, message: 'Dino was emailed the temporary reset code.' };
}

function sendSmsIfConfigured_(phone, message, p) {
  const gatewayEmail = normalizeEmail_(p.phoneGatewayEmail || '');
  if (gatewayEmail) {
    MailApp.sendEmail(gatewayEmail, 'Socials Application reset code', message);
    return { sent: true, status: 'sent_phone_gateway_email' };
  }

  const props = PropertiesService.getScriptProperties();
  const sid = props.getProperty('TWILIO_ACCOUNT_SID');
  const token = props.getProperty('TWILIO_AUTH_TOKEN');
  const from = props.getProperty('TWILIO_FROM_NUMBER');
  if (!sid || !token || !from) return { sent: false, status: 'no_sms_provider' };

  const response = UrlFetchApp.fetch('https://api.twilio.com/2010-04-01/Accounts/' + encodeURIComponent(sid) + '/Messages.json', {
    method: 'post',
    payload: { To: '+' + phone, From: from, Body: message },
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(sid + ':' + token) },
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) return { sent: true, status: 'sent_twilio_sms' };
  return { sent: false, status: 'twilio_error_' + code, body: response.getContentText().slice(0, 500) };
}

function logResetRequest_(projectId, accountId, identifier, delivery, target, resetLink, expiresAt, requestedBy, sentToDino, status, details) {
  append_('RESET_REQUESTS', {
    projectId: projectId,
    id: randomId_('reset'),
    accountId: accountId || '',
    identifier: cleanText_(identifier || '', 240),
    delivery: cleanText_(delivery || '', 40),
    target: maskIdentifier_(target || ''),
    resetLink: cleanText_(resetLink || '', 2000),
    expiresAt: expiresAt || '',
    requestedAt: new Date().toISOString(),
    requestedBy: cleanText_(requestedBy || '', 240),
    sentToDino: sentToDino ? 'true' : 'false',
    status: cleanText_(status || '', 120),
    detailsJson: JSON.stringify(details || {})
  });
}

function findUserByIdentifier_(projectId, identifier) {
  const raw = String(identifier || '').trim();
  const text = raw.toLowerCase();
  const phone = normalizePhone_(raw);
  if (!raw) return null;
  return rows_('USERS').find(function(u){
    if (u.projectId !== projectId) return false;
    if (String(u.userId || '') === raw || String(u.userId || '').toLowerCase() === text) return true;
    if (String(u.username || '').toLowerCase() === text) return true;
    if (String(u.email || '').toLowerCase() === text) return true;
    if (phone && normalizePhone_(u.phone) === phone) return true;
    const backups = parseBackupEmails_(u.backupEmailsJson);
    return backups.indexOf(text) >= 0;
  }) || null;
}

function identifiersMatchUser_(u, identifier) {
  const raw = String(identifier || '').trim();
  const text = raw.toLowerCase();
  const phone = normalizePhone_(raw);
  if (!raw) return false;
  if (String(u.userId || '') === raw || String(u.userId || '').toLowerCase() === text) return true;
  if (String(u.username || '').toLowerCase() === text) return true;
  if (String(u.email || '').toLowerCase() === text) return true;
  if (phone && normalizePhone_(u.phone) === phone) return true;
  return parseBackupEmails_(u.backupEmailsJson).indexOf(text) >= 0;
}

function normalizeEmail_(value) { return String(value || '').trim().toLowerCase(); }
function normalizePhone_(value) { return String(value || '').replace(/[^0-9]/g, '').slice(-15); }
function isEmail_(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()); }
function parseBackupEmails_(value) {
  let raw = value;
  if (Array.isArray(raw)) return mergeBackupEmails_(raw);
  if (typeof raw === 'string' && raw.trim().charAt(0) === '[') {
    try { raw = JSON.parse(raw); } catch (_err) {}
    if (Array.isArray(raw)) return mergeBackupEmails_(raw);
  }
  return mergeBackupEmails_(String(raw || '').split(/[\s,;]+/));
}
function mergeBackupEmails_() {
  const out = [];
  Array.prototype.slice.call(arguments).forEach(function(list){
    (Array.isArray(list) ? list : [list]).forEach(function(item){
      const email = normalizeEmail_(item);
      if (email && isEmail_(email) && out.indexOf(email) < 0) out.push(email);
    });
  });
  return out;
}
function firstBackupEmail_(user) { const arr = parseBackupEmails_(user.backupEmailsJson); return arr.length ? arr[0] : ''; }
function generateSixDigitCode_() { return String(Math.floor(100000 + Math.random() * 900000)); }
function generateToken_() { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); }
function isFuture_(value) { return value && new Date(value).getTime() > Date.now(); }
function buildResetLink_(req, token) {
  const p = req.payload || {};
  const base = cleanText_(p.frontendBaseUrl || p.page || p.siteUrl || '', 1900);
  if (base) return appendQuery_(base, 'reset', token);
  return ScriptApp.getService().getUrl() + '?action=reset&projectId=' + encodeURIComponent(req.projectId) + '&token=' + encodeURIComponent(token);
}
function appendQuery_(url, key, value) {
  const joiner = String(url).indexOf('?') >= 0 ? '&' : '?';
  return String(url) + joiner + encodeURIComponent(key) + '=' + encodeURIComponent(value);
}
function resetMessageBody_(user, reset, intro) {
  return [
    intro || 'Use this reset code to sign in temporarily.',
    '',
    'Username: ' + (user.username || ''),
    'Temporary 6 digit reset code: ' + reset.code,
    'Reset link: ' + reset.resetLink,
    'Expires: ' + reset.expiresAt,
    '',
    'After signing in, you will be asked to create a new permanent password and add backup emails before entering the site.'
  ].join('\n');
}
function maskEmail_(email) {
  email = normalizeEmail_(email);
  if (!email || email.indexOf('@') < 0) return '';
  const parts = email.split('@');
  return parts[0].slice(0, 2) + '***@' + parts[1];
}
function maskPhone_(phone) {
  phone = normalizePhone_(phone);
  if (!phone) return '';
  return phone.length <= 4 ? '***' + phone : '***-***-' + phone.slice(-4);
}
function maskIdentifier_(value) {
  const raw = String(value || '').trim();
  if (isEmail_(raw)) return maskEmail_(raw);
  const phone = normalizePhone_(raw);
  if (phone && phone.length >= 7) return maskPhone_(phone);
  if (raw.length <= 3) return raw;
  return raw.slice(0, 2) + '***' + raw.slice(-1);
}

function logout_(req) {
  if (!req.sessionToken) return { ok: true };
  const sheet = getSheet_('SESSIONS');
  const data = rows_('SESSIONS');
  data.forEach(function(row){ if (row.token === req.sessionToken) sheet.deleteRow(row._row); });
  return { ok: true };
}

function heartbeat_(req, session) {
  if (!session) session = requireSession_(req, false);
  enforceActiveLimit_(req.projectId, session.token);
  updateSessionSeen_(session.token);
  if (req.payload && (req.payload.name || req.payload.status)) {
    upsertProfile_(req.projectId, {
      id: cleanSlug_(req.payload.id || req.payload.clientId || session.userId),
      name: cleanText_(req.payload.name || session.displayName, 80),
      color: req.payload.color || '#38bdf8',
      status: cleanText_(req.payload.status || 'Around', 120)
    });
  }
  return { ok: true, user: { clientId: session.userId, name: session.displayName, status: 'online', lastSeen: Date.now() }, onlineUsers: onlineUsers_(req.projectId), state: publicState_(req.projectId) };
}

function saveProfile_(req, session) {
  const p = req.payload || {};
  const profile = upsertProfile_(req.projectId, {
    id: cleanSlug_(p.id || p.name || session.userId),
    name: cleanText_(p.name || session.displayName, 80),
    color: /^#[0-9a-f]{6}$/i.test(String(p.color || '')) ? p.color : '#38bdf8',
    status: cleanText_(p.status || 'Around', 120)
  });
  return { ok: true, profile: profile, state: publicState_(req.projectId) };
}

function savePost_(req, session) {
  const p = req.payload || {};
  const media = saveMediaIfNeeded_(req.projectId, p.media, p.mediaType, 'post-media', session.userId);
  const post = {
    projectId: req.projectId,
    id: randomId_('post'),
    author: cleanText_(p.author || session.displayName || 'Friend', 80),
    text: cleanText_(p.text || '', SOCIAL_APP.MAX_TEXT),
    media: media.url || '',
    mediaType: cleanText_(p.mediaType || media.mimeType || '', 120),
    createdAt: new Date().toISOString(),
    reactionsJson: '[]',
    commentsJson: '[]'
  };
  if (!post.text && !post.media) throw new Error('Post text or media is required.');
  append_('FEED', post);
  return { ok: true, post: publicPost_(post), state: publicState_(req.projectId) };
}

function saveComment_(req, session) {
  const p = req.payload || {};
  const rows = rows_('FEED');
  const row = rows.find(function(x){ return x.projectId === req.projectId && x.id === String(p.postId || ''); });
  if (!row) throw new Error('Post not found.');
  const comments = parseJson_(row.commentsJson, []);
  const comment = { id: randomId_('comment'), author: cleanText_(p.author || session.displayName, 80), text: cleanText_(p.text || '', 1200), createdAt: new Date().toISOString() };
  if (!comment.text) throw new Error('Comment text is required.');
  comments.push(comment);
  updateRow_('FEED', row._row, { commentsJson: JSON.stringify(comments.slice(-100)) });
  return { ok: true, comment: comment, state: publicState_(req.projectId) };
}

function saveReaction_(req, session) {
  const p = req.payload || {};
  const type = cleanText_(p.type || 'post', 20);
  const id = String(p.id || '');
  const sheetName = type === 'story' ? 'STORIES' : type === 'message' ? 'MESSAGES' : 'FEED';
  const row = rows_(sheetName).find(function(x){ return x.projectId === req.projectId && x.id === id; });
  if (!row) throw new Error('Item not found.');
  const reactions = parseJson_(row.reactionsJson, []);
  const author = cleanText_(p.author || session.displayName, 80);
  const reaction = cleanText_(p.reaction || '💙', 16);
  const idx = reactions.findIndex(function(r){ return r.author === author && r.reaction === reaction; });
  if (idx >= 0) reactions.splice(idx, 1);
  else reactions.push({ id: randomId_('react'), author: author, reaction: reaction, at: Date.now() });
  updateRow_(sheetName, row._row, { reactionsJson: JSON.stringify(reactions.slice(-250)) });
  return { ok: true, item: { id: id, reactions: reactions }, state: publicState_(req.projectId) };
}

function saveChannelMessage_(req, session) {
  const p = req.payload || {};
  const channel = cleanSlug_(p.channel || 'general');
  ensureChannel_(req.projectId, channel);
  const media = saveMediaIfNeeded_(req.projectId, p.media, p.mediaType, 'message-media', session.userId);
  const message = {
    projectId: req.projectId,
    channel: channel,
    id: randomId_('msg'),
    author: cleanText_(p.author || session.displayName || 'Friend', 80),
    text: cleanText_(p.text || p.content || '', SOCIAL_APP.MAX_TEXT),
    media: media.url || '',
    mediaType: cleanText_(p.mediaType || media.mimeType || '', 120),
    origin: cleanText_(p.origin || 'browser', 40),
    createdAt: new Date().toISOString(),
    reactionsJson: '[]'
  };
  if (!message.text && !message.media) throw new Error('Message text or media is required.');
  append_('MESSAGES', message);
  return { ok: true, channel: channel, message: publicMessage_(message), state: publicState_(req.projectId) };
}

function importHistory_(req, session) {
  const p = req.payload || {};
  const channel = cleanSlug_(p.channel || 'imports');
  ensureChannel_(req.projectId, channel);
  const input = p.history || p;
  const arr = Array.isArray(input) ? input : (input.messages || input.data || []);
  let count = 0;
  arr.slice(0, 500).forEach(function(item){
    const text = cleanText_(item.text || item.content || item.message || '', SOCIAL_APP.MAX_TEXT);
    if (!text) return;
    append_('MESSAGES', {
      projectId: req.projectId,
      channel: channel,
      id: randomId_('msg'),
      author: cleanText_(item.author || item.user || session.displayName || 'Imported', 80),
      text: text,
      media: '',
      mediaType: '',
      origin: 'import',
      createdAt: item.createdAt || new Date().toISOString(),
      reactionsJson: '[]'
    });
    count++;
  });
  return { ok: true, channel: channel, imported: count, state: publicState_(req.projectId) };
}

function saveStory_(req, session) {
  const p = req.payload || {};
  const media = saveMediaIfNeeded_(req.projectId, p.media, p.mediaType, 'story-media', session.userId);
  const ttl = Math.max(5 * 60 * 1000, Math.min(Number(p.ttlMs || SOCIAL_APP.STORY_DEFAULT_TTL_MS), SOCIAL_APP.STORY_MAX_TTL_MS));
  const story = {
    projectId: req.projectId,
    id: randomId_('story'),
    author: cleanText_(p.author || session.displayName || 'Friend', 80),
    text: cleanText_(p.text || '', 800),
    media: media.url || '',
    mediaType: cleanText_(p.mediaType || media.mimeType || '', 120),
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + ttl,
    reactionsJson: '[]'
  };
  if (!story.text && !story.media) throw new Error('Story text or media is required.');
  append_('STORIES', story);
  return { ok: true, story: publicStory_(story), state: publicState_(req.projectId) };
}

function saveEvent_(req, session) {
  const p = req.payload || {};
  const operation = cleanText_(p.operation || 'create', 20);
  if (operation === 'delete') {
    const sheet = getSheet_('EVENTS');
    const rows = rows_('EVENTS');
    const row = rows.find(function(x){ return x.projectId === req.projectId && x.id === String(p.id || ''); });
    if (!row) throw new Error('Event not found.');
    sheet.deleteRow(row._row);
    return { ok: true, deleted: p.id, state: publicState_(req.projectId) };
  }
  const id = p.id || randomId_('event');
  const event = {
    projectId: req.projectId,
    id: id,
    title: cleanText_(p.title || 'Untitled event', 160),
    start: cleanText_(p.start || '', 80),
    end: cleanText_(p.end || p.start || '', 80),
    location: cleanText_(p.location || '', 240),
    description: cleanText_(p.description || '', 2000),
    createdBy: session.displayName || session.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    calendarEventId: ''
  };
  if (!event.start) throw new Error('Event start date/time is required.');
  const existing = rows_('EVENTS').find(function(x){ return x.projectId === req.projectId && x.id === id; });
  if (existing) updateRow_('EVENTS', existing._row, event);
  else append_('EVENTS', event);
  return { ok: true, event: publicEvent_(event), state: publicState_(req.projectId) };
}

function saveFile_(req, session) {
  const p = req.payload || {};
  const media = saveMediaIfNeeded_(req.projectId, p.dataUrl || p.media, p.mimeType || p.mediaType, p.name || 'upload', session.userId, true);
  return { ok: true, file: media };
}

function messengerEnvelope_(req, session) {
  const raw = req.payload || {};
  const type = cleanText_(raw.type || 'message', 40);
  const allowed = ['hello','history','message','presence','typing','room','call-join','call-signal','call-leave','call-start','call-end','voice-message','video-message','file','sticker','gif','transcript'];
  if (allowed.indexOf(type) < 0) throw new Error('Unsupported messenger envelope type.');
  const envelope = {
    projectId: req.projectId,
    id: cleanText_(raw.id || randomId_('mp'), 120),
    type: type,
    clientId: cleanText_(raw.clientId || session.userId || 'browser', 120),
    createdAt: raw.createdAt || new Date().toISOString(),
    payloadJson: JSON.stringify(raw.payload || {}),
    appName: 'Messenger Plug-in'
  };
  if (type === 'message' || type === 'room' || type.indexOf('call-') === 0 || type === 'typing' || type === 'presence') append_('MESSENGER', envelope);
  return { ok: true, envelope: publicEnvelope_(envelope) };
}

function roomJoin_(req, session) {
  enforceActiveLimit_(req.projectId, session.token);
  const p = req.payload || {};
  const roomCode = cleanSlug_(p.room || 'room');
  const pass = String(p.pass || '');
  const now = Date.now();
  let room = rows_('ROOMS').find(function(x){ return x.projectId === req.projectId && x.room === roomCode; });
  if (!room) {
    append_('ROOMS', { projectId: req.projectId, room: roomCode, passHash: hashPassword_(pass, 'room:' + roomCode), createdAt: now, updatedAt: now, participantsJson: '[]' });
    room = rows_('ROOMS').find(function(x){ return x.projectId === req.projectId && x.room === roomCode; });
  }
  if (room.passHash !== hashPassword_(pass, 'room:' + roomCode)) throw new Error('Incorrect room passcode.');
  let participants = parseJson_(room.participantsJson, []).filter(function(x){ return now - Number(x.lastSeen || 0) < SOCIAL_APP.ACTIVE_WINDOW_MS; });
  const peerId = cleanText_(p.peerId || session.userId || randomId_('peer'), 120);
  if (!participants.some(function(x){ return x.id === peerId; }) && participants.length >= SOCIAL_APP.MAX_ACTIVE_USERS_PER_PROJECT) throw new Error('This room already has 10 active people.');
  participants = participants.filter(function(x){ return x.id !== peerId; });
  participants.push({ id: peerId, name: cleanText_(p.name || session.displayName || 'Guest', 80), joinedAt: now, lastSeen: now, handRaised: false });
  updateRow_('ROOMS', room._row, { updatedAt: now, participantsJson: JSON.stringify(participants) });
  addRoomEvent_(req.projectId, roomCode, 'participants', participants, 'server', '*');
  return { ok: true, peerId: peerId, participants: participants, room: roomCode };
}

function roomHeartbeat_(req, session) {
  const p = req.payload || {};
  const room = findRoom_(req.projectId, p.room);
  const participants = touchParticipant_(room, p.peerId || p.from, null);
  return { ok: true, participants: participants };
}

function roomLeave_(req, session) {
  const p = req.payload || {};
  const room = findRoom_(req.projectId, p.room);
  const peerId = String(p.peerId || p.from || '');
  const participants = parseJson_(room.participantsJson, []).filter(function(x){ return x.id !== peerId; });
  updateRow_('ROOMS', room._row, { updatedAt: Date.now(), participantsJson: JSON.stringify(participants) });
  addRoomEvent_(req.projectId, room.room, 'participants', participants, 'server', '*');
  return { ok: true, participants: participants };
}

function roomSignal_(req, session) {
  const p = req.payload || {};
  const room = findRoom_(req.projectId, p.room);
  const from = cleanText_(p.from || p.peerId || session.userId, 120);
  const to = cleanText_(p.to || '', 120);
  if (!to) throw new Error('Signal target is required.');
  const signal = addRoomEvent_(req.projectId, room.room, 'signal', { from: from, to: to, type: cleanText_(p.type || '', 40), payload: p.payload }, from, to);
  return { ok: true, signal: signal };
}

function roomChat_(req, session) {
  const p = req.payload || {};
  const room = findRoom_(req.projectId, p.room);
  const from = cleanText_(p.from || p.peerId || session.userId, 120);
  const sender = cleanText_(session.displayName || p.name || 'Guest', 80);
  const message = { id: randomId_('roommsg'), from: from, sender: sender, body: cleanText_(p.message || '', SOCIAL_APP.MAX_TEXT), sentAt: Date.now() };
  addRoomEvent_(req.projectId, room.room, 'room-chat', message, from, '*');
  return { ok: true, message: message };
}

function roomReaction_(req, session) {
  const p = req.payload || {};
  const room = findRoom_(req.projectId, p.room);
  const from = cleanText_(p.from || p.peerId || session.userId, 120);
  const reaction = { id: randomId_('roomreact'), from: from, sender: session.displayName || 'Guest', reaction: cleanText_(p.reaction || '👍', 16), sentAt: Date.now() };
  addRoomEvent_(req.projectId, room.room, 'room-reaction', reaction, from, '*');
  return { ok: true, reaction: reaction };
}

function roomRaiseHand_(req, session) {
  const p = req.payload || {};
  const room = findRoom_(req.projectId, p.room);
  const participants = touchParticipant_(room, p.peerId || p.from, Boolean(p.raised));
  addRoomEvent_(req.projectId, room.room, 'participants', participants, 'server', '*');
  return { ok: true, participants: participants };
}

function roomPoll_(req, session) {
  const p = req.payload || {};
  const room = findRoom_(req.projectId, p.room);
  const peerId = cleanText_(p.peerId || p.from || session.userId, 120);
  const since = Number(p.since || 0);
  const now = Date.now();
  const participants = touchParticipant_(room, peerId, null);
  const signals = rows_('SIGNALS').filter(function(x){
    return x.projectId === req.projectId && x.room === room.room && Number(x.createdAt) > since && (x.toPeer === '*' || x.toPeer === peerId);
  }).slice(-100).map(function(x){
    return { event: x.type === 'signal' ? 'signal' : x.type, data: parseJson_(x.payloadJson, {}), at: Number(x.createdAt) };
  });
  return { ok: true, now: now, participants: participants, events: signals };
}

function exportData_(req, session) {
  return {
    ok: true,
    data: publicState_(req.projectId),
    envelopes: messengerHistory_(req.projectId),
    calls: rows_('CALLS').filter(byProject_(req.projectId)).map(publicCall_),
    mediaAssets: rows_('MEDIA_ASSETS').filter(byProject_(req.projectId)).map(publicMediaAsset_),
    voiceMessages: rows_('VOICE_MESSAGES').filter(byProject_(req.projectId)).map(publicVoiceMessage_),
    videos: rows_('VIDEOS').filter(byProject_(req.projectId)).map(publicVideo_),
    transcripts: rows_('TRANSCRIPTS').filter(byProject_(req.projectId)).map(publicTranscript_),
    filterPresets: rows_('FILTER_PRESETS').filter(byProject_(req.projectId)).map(publicFilterPreset_),
    exportedAt: new Date().toISOString()
  };
}

function cloudAuthSignIn_(req) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    pruneSessions_();
    const p = req.payload || {};
    const provider = cleanSlug_(p.provider || 'google');
    let identity;
    if (provider === 'google') identity = verifyGoogleIdToken_(p.idToken || p.credential || p.token || '');
    else identity = verifyExternalIdentity_(provider, p);

    const providerUserId = cleanText_(identity.providerUserId || identity.sub || '', 240);
    const email = normalizeEmail_(identity.email || p.email || '');
    const displayName = cleanText_(identity.displayName || identity.name || p.displayName || email.split('@')[0] || 'Friend', 80);
    if (!providerUserId && !email) throw new Error('Cloud sign-in did not return a stable account ID or email.');

    let providerRow = rows_('AUTH_PROVIDERS').find(function(row){
      return row.projectId === req.projectId && row.provider === provider && row.providerUserId === providerUserId;
    });
    let user = providerRow ? rows_('USERS').find(function(u){ return u.projectId === req.projectId && u.userId === providerRow.userId; }) : null;
    if (!user && email) user = findUserByIdentifier_(req.projectId, email);

    if (!user) {
      const existing = rows_('USERS').filter(function(u){ return u.projectId === req.projectId; });
      if (existing.length >= SOCIAL_APP.MAX_REGISTERED_USERS_PER_PROJECT) throw new Error('This project already has the maximum 10 registered users.');
      const now = new Date().toISOString();
      const username = cleanUsername_(p.username || email || displayName || ('cloud_' + Date.now().toString(36)));
      const userId = randomId_('user');
      const row = {
        projectId: req.projectId,
        userId: userId,
        username: username,
        displayName: displayName,
        salt: '',
        passHash: '',
        role: existing.length ? 'member' : 'admin',
        avatar: identity.photoUrl || p.avatar || '☁️',
        status: 'Around',
        createdAt: now,
        updatedAt: now,
        disabled: 'false',
        email: email,
        phone: normalizePhone_(p.phone || ''),
        backupEmailsJson: JSON.stringify(parseBackupEmails_(p.backupEmails || [])),
        mustChangePassword: 'false',
        tempCodeSalt: '',
        tempCodeHash: '',
        tempCodeExpiresAt: '',
        resetTokenSalt: '',
        resetTokenHash: '',
        resetRequestedAt: '',
        resetDelivery: '',
        resetRequestedBy: '',
        lastPasswordChangedAt: '',
        lastTemporaryLoginAt: ''
      };
      append_('USERS', row);
      user = findUserByIdentifier_(req.projectId, userId) || row;
      upsertProfile_(req.projectId, { id: cleanSlug_(username), name: displayName, color: '#38bdf8', status: 'Around' });
    }
    if (String(user.disabled) === 'true') throw new Error('This account is disabled.');

    upsertAuthProvider_(req.projectId, user.userId, provider, providerUserId || email, email, displayName, identity.photoUrl || '', identity.raw || identity);
    enforceActiveLimit_(req.projectId, '');
    const session = createSession_(req.projectId, user.userId, user.displayName || displayName, p.userAgent);
    audit_(req.projectId, 'cloud_auth_sign_in', user.userId, { provider: provider, email: maskEmail_(email) });
    return { ok: true, provider: provider, session: session, user: publicUser_(user), state: publicState_(req.projectId) };
  } finally {
    lock.releaseLock();
  }
}

function linkCloudProvider_(req) {
  const session = requireSession_(req, false);
  const p = req.payload || {};
  const provider = cleanSlug_(p.provider || 'google');
  const identity = provider === 'google' ? verifyGoogleIdToken_(p.idToken || p.credential || p.token || '') : verifyExternalIdentity_(provider, p);
  const providerUserId = cleanText_(identity.providerUserId || identity.sub || identity.email || '', 240);
  if (!providerUserId) throw new Error('Cloud provider did not return an ID to link.');
  upsertAuthProvider_(req.projectId, session.userId, provider, providerUserId, normalizeEmail_(identity.email || ''), cleanText_(identity.displayName || identity.name || '', 80), identity.photoUrl || '', identity.raw || identity);
  audit_(req.projectId, 'link_cloud_provider', session.userId, { provider: provider, providerUserId: providerUserId });
  return { ok: true, linked: true, provider: provider };
}

function sendInviteOrTemporaryPassword_(req) {
  const session = requireSession_(req, false);
  const p = req.payload || {};
  const target = normalizeEmail_(p.email || p.target || '');
  if (!target || !isEmail_(target)) throw new Error('A valid recipient email is required.');
  const existing = rows_('USERS').filter(function(u){ return u.projectId === req.projectId; });
  if (existing.length >= SOCIAL_APP.MAX_REGISTERED_USERS_PER_PROJECT && !findUserByIdentifier_(req.projectId, target)) throw new Error('This project already has the maximum 10 registered users.');

  let user = findUserByIdentifier_(req.projectId, target);
  if (!user) {
    const now = new Date().toISOString();
    const username = cleanUsername_(p.username || target.split('@')[0]);
    const row = {
      projectId: req.projectId,
      userId: randomId_('user'),
      username: username,
      displayName: cleanText_(p.displayName || username, 80),
      salt: '',
      passHash: '',
      role: 'member',
      avatar: p.avatar || '💌',
      status: 'Invited',
      createdAt: now,
      updatedAt: now,
      disabled: 'false',
      email: target,
      phone: normalizePhone_(p.phone || ''),
      backupEmailsJson: JSON.stringify(parseBackupEmails_(p.backupEmails || [])),
      mustChangePassword: 'true',
      tempCodeSalt: '',
      tempCodeHash: '',
      tempCodeExpiresAt: '',
      resetTokenSalt: '',
      resetTokenHash: '',
      resetRequestedAt: '',
      resetDelivery: '',
      resetRequestedBy: '',
      lastPasswordChangedAt: '',
      lastTemporaryLoginAt: ''
    };
    append_('USERS', row);
    user = findUserByIdentifier_(req.projectId, target) || row;
  }
  const reset = createResetForUser_(req, user, target, 'email', p);
  const subject = cleanText_(p.subject || 'You are invited to Socials Application', 180);
  const body = [
    'You have been invited to Socials Application.',
    '',
    'Temporary sign-in code/password: ' + reset.code,
    'Reset/sign-in link: ' + reset.resetLink,
    'Expires: ' + reset.expiresAt,
    '',
    'After signing in, create a new permanent password. This private site is limited to 10 people.'
  ].join('\n');
  MailApp.sendEmail(target, subject, body);
  audit_(req.projectId, 'send_invite_email', session.userId, { target: maskEmail_(target), accountId: user.userId });
  return { ok: true, sent: true, target: maskEmail_(target), accountId: user.userId, expiresAt: reset.expiresAt };
}

function upsertAuthProvider_(projectId, userId, provider, providerUserId, email, displayName, photoUrl, raw) {
  const now = new Date().toISOString();
  const existing = rows_('AUTH_PROVIDERS').find(function(row){ return row.projectId === projectId && row.provider === provider && row.providerUserId === providerUserId; });
  const patch = { projectId: projectId, userId: userId, provider: provider, providerUserId: providerUserId, email: email || '', displayName: displayName || '', photoUrl: photoUrl || '', updatedAt: now, lastSignInAt: now, rawJson: JSON.stringify(raw || {}) };
  if (existing) updateRow_('AUTH_PROVIDERS', existing._row, patch);
  else append_('AUTH_PROVIDERS', mergeObjects_({ createdAt: now }, patch));
}

function verifyGoogleIdToken_(idToken) {
  idToken = String(idToken || '').trim();
  if (!idToken) throw new Error('Google ID token is required for cloud auth.');
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('Google cloud auth token could not be verified.');
  const data = JSON.parse(response.getContentText() || '{}');
  const expectedAud = PropertiesService.getScriptProperties().getProperty(SOCIAL_APP.GOOGLE_CLIENT_ID_PROPERTY);
  if (expectedAud && data.aud !== expectedAud) throw new Error('Google token audience does not match this Socials Application backend.');
  if (data.email_verified && String(data.email_verified) !== 'true') throw new Error('Google email is not verified.');
  return { provider: 'google', providerUserId: data.sub || '', sub: data.sub || '', email: normalizeEmail_(data.email || ''), displayName: data.name || data.email || 'Google user', photoUrl: data.picture || '', raw: data };
}

function verifyExternalIdentity_(provider, p) {
  if (!p || !p.providerUserId || !p.providerTokenVerifiedByFrontend) throw new Error('Only Google ID token verification is built in. For other providers, add a provider-specific verification webhook before trusting sign-in.');
  return { provider: provider, providerUserId: cleanText_(p.providerUserId, 240), email: normalizeEmail_(p.email || ''), displayName: cleanText_(p.displayName || p.email || 'Cloud user', 80), photoUrl: cleanText_(p.photoUrl || '', 2000), raw: p };
}

function iceConfig_(req) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(SOCIAL_APP.TURN_CONFIG_JSON_PROPERTY);
  let iceServers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  if (raw) {
    try { iceServers = JSON.parse(raw); }
    catch (_err) { iceServers = iceServers; }
  }
  return { ok: true, iceServers: iceServers, note: 'Apps Script supplies signaling only. Browser WebRTC still needs STUN/TURN for NAT traversal.' };
}

function saveAppRecord_(req, session) {
  const p = req.payload || {};
  const collection = cleanSlug_(p.collection || 'general');
  const id = cleanText_(p.id || randomId_('record'), 160);
  const now = new Date().toISOString();
  const payload = p.data !== undefined ? p.data : p.payload;
  const row = rows_('APP_RECORDS').find(function(r){ return r.projectId === req.projectId && r.collection === collection && r.id === id; });
  const next = { projectId: req.projectId, collection: collection, id: id, owner: cleanText_(p.owner || session.userId, 120), createdAt: row ? row.createdAt : now, updatedAt: now, jsonData: JSON.stringify(payload || {}) };
  if (row) updateRow_('APP_RECORDS', row._row, next);
  else append_('APP_RECORDS', next);
  audit_(req.projectId, 'save_app_record', session.userId, { collection: collection, id: id });
  return { ok: true, record: publicAppRecord_(next) };
}

function listAppRecords_(req, session) {
  const p = req.payload || {};
  const collection = cleanSlug_(p.collection || 'general');
  const records = rows_('APP_RECORDS').filter(function(r){ return r.projectId === req.projectId && r.collection === collection; }).slice(-Number(p.limit || 500)).map(publicAppRecord_);
  return { ok: true, collection: collection, records: records };
}

function saveMediaAsset_(req, session) {
  const p = req.payload || {};
  const kind = cleanSlug_(p.kind || p.mediaKind || 'media');
  const media = saveMediaIfNeeded_(req.projectId, p.dataUrl || p.media || p.blobDataUrl, p.mimeType || p.mediaType, p.name || kind, session.userId, true);
  const id = cleanText_(p.id || media.id || randomId_('media'), 160);
  const now = new Date().toISOString();
  const row = {
    projectId: req.projectId,
    id: id,
    kind: kind,
    owner: cleanText_(p.owner || session.userId, 120),
    room: cleanSlug_(p.room || p.conversationId || 'general'),
    messageId: cleanText_(p.messageId || '', 160),
    name: cleanText_(p.name || media.name || kind, 240),
    mimeType: cleanText_(p.mimeType || p.mediaType || media.mimeType || '', 120),
    size: Number(media.size || p.size || 0),
    url: cleanText_(media.url || p.url || '', 2000),
    driveFileId: cleanText_(media.driveFileId || '', 240),
    durationMs: Number(p.durationMs || 0),
    thumbnailUrl: cleanText_(p.thumbnailUrl || '', 2000),
    transcript: cleanText_(p.transcript || '', 20000),
    faceMetaJson: JSON.stringify(p.faceMeta || p.faceMetadata || {}),
    createdAt: p.createdAt || now,
    updatedAt: now
  };
  append_('MEDIA_ASSETS', row);
  audit_(req.projectId, 'save_media_asset', session.userId, { kind: kind, id: id, mimeType: row.mimeType, size: row.size });
  return { ok: true, media: publicMediaAsset_(row) };
}

function saveVoiceMessage_(req, session) {
  const p = req.payload || {};
  const mediaRes = saveMediaAsset_(mergeRequestPayload_(req, { kind: 'voice', room: p.conversationId || p.room || 'messenger' }), session).media;
  const row = {
    projectId: req.projectId,
    id: cleanText_(p.id || randomId_('voice'), 160),
    conversationId: cleanSlug_(p.conversationId || p.room || 'messenger'),
    author: cleanText_(p.author || session.displayName || session.userId, 80),
    mediaId: mediaRes.id,
    durationMs: Number(p.durationMs || mediaRes.durationMs || 0),
    waveformJson: JSON.stringify(p.waveform || []),
    transcript: cleanText_(p.transcript || mediaRes.transcript || '', 20000),
    status: cleanText_(p.status || 'saved', 40),
    createdAt: new Date().toISOString()
  };
  append_('VOICE_MESSAGES', row);
  messengerEnvelope_(mergeRequestPayload_(req, { type: 'voice-message', payload: { voiceMessage: publicVoiceMessage_(row), media: mediaRes } }), session);
  return { ok: true, voiceMessage: publicVoiceMessage_(row), media: mediaRes };
}

function saveVideo_(req, session) {
  const p = req.payload || {};
  const mediaRes = saveMediaAsset_(mergeRequestPayload_(req, { kind: p.kind || 'video', room: p.conversationId || p.room || 'videos' }), session).media;
  const row = {
    projectId: req.projectId,
    id: cleanText_(p.id || randomId_('video'), 160),
    author: cleanText_(p.author || session.displayName || session.userId, 80),
    mediaId: mediaRes.id,
    kind: cleanSlug_(p.kind || 'video'),
    thumbnailUrl: cleanText_(p.thumbnailUrl || mediaRes.thumbnailUrl || '', 2000),
    durationMs: Number(p.durationMs || mediaRes.durationMs || 0),
    transcript: cleanText_(p.transcript || mediaRes.transcript || '', 20000),
    status: cleanText_(p.status || 'saved', 40),
    createdAt: new Date().toISOString()
  };
  append_('VIDEOS', row);
  return { ok: true, video: publicVideo_(row), media: mediaRes };
}

function requestTranscription_(req, session) {
  const p = req.payload || {};
  const mediaId = cleanText_(p.mediaId || '', 160);
  const media = rows_('MEDIA_ASSETS').find(function(m){ return m.projectId === req.projectId && m.id === mediaId; });
  if (!media) throw new Error('Media asset not found for transcription.');
  const webhook = PropertiesService.getScriptProperties().getProperty(SOCIAL_APP.SPEECH_TO_TEXT_WEBHOOK_PROPERTY);
  const id = randomId_('tr');
  const now = new Date().toISOString();
  let status = 'queued';
  let providerJson = {};
  let transcript = '';
  if (p.transcript) {
    transcript = cleanText_(p.transcript, 20000);
    status = 'complete';
  } else if (webhook) {
    const payload = { projectId: req.projectId, transcriptId: id, mediaId: media.id, mediaUrl: media.url, mimeType: media.mimeType, language: p.language || 'en-US' };
    const headers = {};
    const apiKey = PropertiesService.getScriptProperties().getProperty(SOCIAL_APP.SPEECH_TO_TEXT_API_KEY_PROPERTY);
    if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
    const response = UrlFetchApp.fetch(webhook, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), headers: headers, muteHttpExceptions: true });
    providerJson = { responseCode: response.getResponseCode(), response: response.getContentText().slice(0, 2000) };
    status = response.getResponseCode() >= 200 && response.getResponseCode() < 300 ? 'sent_to_provider' : 'provider_error';
  }
  const row = { projectId: req.projectId, id: id, mediaId: media.id, sourceKind: cleanSlug_(p.sourceKind || media.kind || 'media'), language: cleanText_(p.language || 'en-US', 40), transcript: transcript, status: status, provider: webhook ? 'webhook' : 'browser/manual', createdBy: session.userId, createdAt: now, updatedAt: now, providerJson: JSON.stringify(providerJson) };
  append_('TRANSCRIPTS', row);
  if (transcript) updateMediaTranscript_(req.projectId, media.id, transcript);
  return { ok: true, transcript: publicTranscript_(row), providerConfigured: Boolean(webhook) };
}

function saveTranscript_(req, session) {
  const p = req.payload || {};
  const id = cleanText_(p.id || randomId_('tr'), 160);
  const mediaId = cleanText_(p.mediaId || '', 160);
  const now = new Date().toISOString();
  const existing = rows_('TRANSCRIPTS').find(function(t){ return t.projectId === req.projectId && t.id === id; });
  const row = { projectId: req.projectId, id: id, mediaId: mediaId, sourceKind: cleanSlug_(p.sourceKind || 'media'), language: cleanText_(p.language || 'en-US', 40), transcript: cleanText_(p.transcript || '', 20000), status: cleanText_(p.status || 'complete', 40), provider: cleanText_(p.provider || 'browser/manual', 80), createdBy: session.userId, createdAt: existing ? existing.createdAt : now, updatedAt: now, providerJson: JSON.stringify(p.providerJson || {}) };
  if (existing) updateRow_('TRANSCRIPTS', existing._row, row);
  else append_('TRANSCRIPTS', row);
  if (mediaId && row.transcript) updateMediaTranscript_(req.projectId, mediaId, row.transcript);
  audit_(req.projectId, 'save_transcript', session.userId, { id: id, mediaId: mediaId, status: row.status });
  return { ok: true, transcript: publicTranscript_(row) };
}

function updateMediaTranscript_(projectId, mediaId, transcript) {
  const row = rows_('MEDIA_ASSETS').find(function(m){ return m.projectId === projectId && m.id === mediaId; });
  if (row) updateRow_('MEDIA_ASSETS', row._row, { transcript: transcript, updatedAt: new Date().toISOString() });
}

function saveFaceProfile_(req, session) {
  const p = req.payload || {};
  if (p.consent !== true && String(p.consent) !== 'true') throw new Error('Face profile storage requires explicit user consent.');
  const descriptor = normalizeDescriptor_(p.descriptor || p.faceDescriptor || []);
  if (!descriptor.length) throw new Error('Face descriptor array is required. The browser face model creates this; Apps Script stores/matches it.');
  const profileId = cleanText_(p.profileId || randomId_('face'), 160);
  const now = new Date().toISOString();
  const existing = rows_('FACE_PROFILES').find(function(f){ return f.projectId === req.projectId && f.profileId === profileId; });
  const row = { projectId: req.projectId, userId: cleanText_(p.userId || session.userId, 120), profileId: profileId, label: cleanText_(p.label || session.displayName || 'Face profile', 120), descriptorJson: JSON.stringify(descriptor), modelsVersion: cleanText_(p.modelsVersion || 'browser-model', 120), consent: 'true', createdAt: existing ? existing.createdAt : now, updatedAt: now };
  if (existing) updateRow_('FACE_PROFILES', existing._row, row);
  else append_('FACE_PROFILES', row);
  audit_(req.projectId, 'save_face_profile', session.userId, { profileId: profileId });
  return { ok: true, faceProfile: publicFaceProfile_(row) };
}

function listFaceProfiles_(req, session) {
  const p = req.payload || {};
  const profiles = rows_('FACE_PROFILES').filter(function(f){ return f.projectId === req.projectId && (!p.userId || f.userId === p.userId); }).map(publicFaceProfile_);
  return { ok: true, faceProfiles: profiles };
}

function matchFaceDescriptor_(req, session) {
  const descriptor = normalizeDescriptor_((req.payload || {}).descriptor || (req.payload || {}).faceDescriptor || []);
  if (!descriptor.length) throw new Error('Descriptor is required for face matching.');
  const matches = rows_('FACE_PROFILES').filter(byProject_(req.projectId)).map(function(f){
    const saved = normalizeDescriptor_(parseJson_(f.descriptorJson, []));
    return { profile: publicFaceProfile_(f), distance: descriptorDistance_(descriptor, saved) };
  }).filter(function(m){ return isFinite(m.distance); }).sort(function(a,b){ return a.distance - b.distance; });
  const best = matches.length ? matches[0] : null;
  return { ok: true, matched: Boolean(best && best.distance <= SOCIAL_APP.FACE_MATCH_THRESHOLD), bestMatch: best, matches: matches.slice(0, 10), threshold: SOCIAL_APP.FACE_MATCH_THRESHOLD };
}

function saveFilterPreset_(req, session) {
  const p = req.payload || {};
  const id = cleanText_(p.id || randomId_('filter'), 160);
  const now = new Date().toISOString();
  const existing = rows_('FILTER_PRESETS').find(function(f){ return f.projectId === req.projectId && f.id === id; });
  const row = { projectId: req.projectId, id: id, createdBy: cleanText_(p.createdBy || session.userId, 120), name: cleanText_(p.name || 'Filter preset', 160), kind: cleanSlug_(p.kind || 'face-filter'), configJson: JSON.stringify(p.config || p.faceMeta || {}), thumbnailUrl: cleanText_(p.thumbnailUrl || '', 2000), createdAt: existing ? existing.createdAt : now, updatedAt: now };
  if (existing) updateRow_('FILTER_PRESETS', existing._row, row);
  else append_('FILTER_PRESETS', row);
  return { ok: true, filterPreset: publicFilterPreset_(row) };
}

function listFilterPresets_(req, session) {
  const p = req.payload || {};
  const kind = p.kind ? cleanSlug_(p.kind) : '';
  const filters = rows_('FILTER_PRESETS').filter(function(f){ return f.projectId === req.projectId && (!kind || f.kind === kind); }).map(publicFilterPreset_);
  return { ok: true, filterPresets: filters };
}

function createCall_(req, session) {
  const p = req.payload || {};
  const callId = cleanText_(p.callId || randomId_('call'), 160);
  const room = cleanSlug_(p.room || p.conversationId || callId);
  const now = Date.now();
  const participants = [{ id: cleanText_(p.peerId || session.userId, 120), userId: session.userId, name: cleanText_(p.name || session.displayName || 'Caller', 80), role: 'host', audio: p.audio !== false, video: p.video !== false, screen: Boolean(p.screen), joinedAt: now, lastSeen: now }];
  const row = { projectId: req.projectId, callId: callId, room: room, kind: cleanSlug_(p.kind || 'video'), createdBy: session.userId, createdAt: now, updatedAt: now, status: 'active', participantsJson: JSON.stringify(participants), settingsJson: JSON.stringify(p.settings || {}) };
  append_('CALLS', row);
  addCallEvent_(req.projectId, callId, room, 'call-created', { call: publicCall_(row) }, 'server', '*');
  messengerEnvelope_(mergeRequestPayload_(req, { type: 'call-start', payload: { callId: callId, room: room, kind: row.kind } }), session);
  return { ok: true, call: publicCall_(row), iceConfig: iceConfig_(req).iceServers };
}

function joinCall_(req, session) {
  const p = req.payload || {};
  const call = findCall_(req.projectId, p.callId, p.room);
  if (call.status !== 'active') throw new Error('This call is not active.');
  const now = Date.now();
  let participants = parseJson_(call.participantsJson, []).filter(function(x){ return now - Number(x.lastSeen || 0) < SOCIAL_APP.SESSION_TTL_MS; });
  const peerId = cleanText_(p.peerId || session.userId, 120);
  participants = participants.filter(function(x){ return x.id !== peerId; });
  participants.push({ id: peerId, userId: session.userId, name: cleanText_(p.name || session.displayName || 'Caller', 80), role: 'member', audio: p.audio !== false, video: p.video !== false, screen: Boolean(p.screen), joinedAt: now, lastSeen: now });
  updateRow_('CALLS', call._row, { updatedAt: now, participantsJson: JSON.stringify(participants) });
  addCallEvent_(req.projectId, call.callId, call.room, 'participants', participants, 'server', '*');
  return { ok: true, callId: call.callId, room: call.room, peerId: peerId, participants: participants, iceConfig: iceConfig_(req).iceServers };
}

function leaveCall_(req, session) {
  const p = req.payload || {};
  const call = findCall_(req.projectId, p.callId, p.room);
  const peerId = cleanText_(p.peerId || session.userId, 120);
  const participants = parseJson_(call.participantsJson, []).filter(function(x){ return x.id !== peerId; });
  updateRow_('CALLS', call._row, { updatedAt: Date.now(), participantsJson: JSON.stringify(participants), status: participants.length ? call.status : 'ended' });
  addCallEvent_(req.projectId, call.callId, call.room, 'participants', participants, 'server', '*');
  return { ok: true, callId: call.callId, participants: participants, status: participants.length ? call.status : 'ended' };
}

function endCall_(req, session) {
  const p = req.payload || {};
  const call = findCall_(req.projectId, p.callId, p.room);
  updateRow_('CALLS', call._row, { updatedAt: Date.now(), status: 'ended', participantsJson: '[]' });
  addCallEvent_(req.projectId, call.callId, call.room, 'call-ended', { endedBy: session.userId, at: Date.now() }, session.userId, '*');
  messengerEnvelope_(mergeRequestPayload_(req, { type: 'call-end', payload: { callId: call.callId, room: call.room } }), session);
  return { ok: true, callId: call.callId, status: 'ended' };
}

function callSignal_(req, session) {
  const p = req.payload || {};
  const call = findCall_(req.projectId, p.callId, p.room);
  const from = cleanText_(p.from || p.peerId || session.userId, 120);
  const to = cleanText_(p.to || '*', 120);
  const event = addCallEvent_(req.projectId, call.callId, call.room, cleanText_(p.type || 'signal', 60), { from: from, to: to, sdp: p.sdp, candidate: p.candidate, payload: p.payload }, from, to);
  return { ok: true, event: publicCallEvent_(event) };
}

function pollCall_(req, session) {
  const p = req.payload || {};
  const call = findCall_(req.projectId, p.callId, p.room);
  const peerId = cleanText_(p.peerId || session.userId, 120);
  const since = Number(p.since || 0);
  const now = Date.now();
  const participants = touchCallParticipant_(call, peerId, p);
  const events = rows_('CALL_EVENTS').filter(function(e){ return e.projectId === req.projectId && e.callId === call.callId && Number(e.createdAt) > since && (e.toPeer === '*' || e.toPeer === peerId || e.fromPeer === peerId); }).slice(-200).map(publicCallEvent_);
  pruneCallEvents_();
  return { ok: true, now: now, call: publicCall_(findCall_(req.projectId, call.callId, '')), participants: participants, events: events };
}

function findCall_(projectId, callId, room) {
  const cleanCallId = cleanText_(callId || '', 160);
  const cleanRoom = room ? cleanSlug_(room) : '';
  const call = rows_('CALLS').find(function(c){ return c.projectId === projectId && ((cleanCallId && c.callId === cleanCallId) || (cleanRoom && c.room === cleanRoom)); });
  if (!call) throw new Error('Call not found.');
  return call;
}

function touchCallParticipant_(call, peerId, p) {
  const now = Date.now();
  let participants = parseJson_(call.participantsJson, []).filter(function(x){ return now - Number(x.lastSeen || 0) < SOCIAL_APP.SESSION_TTL_MS; });
  participants.forEach(function(x){
    if (x.id === peerId) {
      x.lastSeen = now;
      if (p.audio !== undefined) x.audio = Boolean(p.audio);
      if (p.video !== undefined) x.video = Boolean(p.video);
      if (p.screen !== undefined) x.screen = Boolean(p.screen);
    }
  });
  updateRow_('CALLS', call._row, { updatedAt: now, participantsJson: JSON.stringify(participants) });
  return participants;
}

function addCallEvent_(projectId, callId, room, type, payload, fromPeer, toPeer) {
  const row = { projectId: projectId, callId: callId, room: room, id: randomId_('callevt'), fromPeer: fromPeer || 'server', toPeer: toPeer || '*', type: type, payloadJson: JSON.stringify(payload || {}), createdAt: Date.now() };
  append_('CALL_EVENTS', row);
  pruneCallEvents_();
  return row;
}

function pruneCallEvents_() {
  const cutoff = Date.now() - SOCIAL_APP.CALL_EVENT_TTL_MS;
  const sheet = getSheet_('CALL_EVENTS');
  rows_('CALL_EVENTS').filter(function(r){ return Number(r.createdAt || 0) < cutoff; }).sort(function(a,b){ return b._row - a._row; }).forEach(function(row){ sheet.deleteRow(row._row); });
}

function normalizeDescriptor_(value) {
  if (typeof value === 'string') value = parseJson_(value, []);
  if (!Array.isArray(value)) return [];
  return value.map(function(n){ return Number(n); }).filter(function(n){ return isFinite(n); });
}

function descriptorDistance_(a, b) {
  if (!a.length || !b.length || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; sum += d * d; }
  return Math.sqrt(sum);
}

function mergeRequestPayload_(req, patch) {
  const out = { method: req.method, action: req.action, projectId: req.projectId, projectName: req.projectName, sessionToken: req.sessionToken, callback: req.callback, payload: {} };
  Object.keys(req.payload || {}).forEach(function(k){ out.payload[k] = req.payload[k]; });
  Object.keys(patch || {}).forEach(function(k){ out.payload[k] = patch[k]; });
  return out;
}

function publicAppRecord_(r) { return { collection: r.collection, id: r.id, owner: r.owner, createdAt: r.createdAt, updatedAt: r.updatedAt, data: parseJson_(r.jsonData, {}) }; }
function publicCall_(c) { return { callId: c.callId, room: c.room, kind: c.kind, createdBy: c.createdBy, createdAt: Number(c.createdAt), updatedAt: Number(c.updatedAt), status: c.status, participants: parseJson_(c.participantsJson, []), settings: parseJson_(c.settingsJson, {}) }; }
function publicCallEvent_(e) { return { id: e.id, callId: e.callId, room: e.room, from: e.fromPeer, to: e.toPeer, type: e.type, payload: parseJson_(e.payloadJson, {}), createdAt: Number(e.createdAt) }; }
function publicMediaAsset_(m) { return { id: m.id, kind: m.kind, owner: m.owner, room: m.room, messageId: m.messageId, name: m.name, mimeType: m.mimeType, size: Number(m.size || 0), url: m.url, driveFileId: m.driveFileId, durationMs: Number(m.durationMs || 0), thumbnailUrl: m.thumbnailUrl, transcript: m.transcript, faceMeta: parseJson_(m.faceMetaJson, {}), createdAt: m.createdAt, updatedAt: m.updatedAt }; }
function publicVoiceMessage_(v) { return { id: v.id, conversationId: v.conversationId, author: v.author, mediaId: v.mediaId, durationMs: Number(v.durationMs || 0), waveform: parseJson_(v.waveformJson, []), transcript: v.transcript, status: v.status, createdAt: v.createdAt }; }
function publicVideo_(v) { return { id: v.id, author: v.author, mediaId: v.mediaId, kind: v.kind, thumbnailUrl: v.thumbnailUrl, durationMs: Number(v.durationMs || 0), transcript: v.transcript, status: v.status, createdAt: v.createdAt }; }
function publicTranscript_(t) { return { id: t.id, mediaId: t.mediaId, sourceKind: t.sourceKind, language: t.language, transcript: t.transcript, status: t.status, provider: t.provider, createdBy: t.createdBy, createdAt: t.createdAt, updatedAt: t.updatedAt, providerData: parseJson_(t.providerJson, {}) }; }
function publicFaceProfile_(f) { return { userId: f.userId, profileId: f.profileId, label: f.label, descriptorLength: normalizeDescriptor_(parseJson_(f.descriptorJson, [])).length, modelsVersion: f.modelsVersion, consent: String(f.consent) === 'true', createdAt: f.createdAt, updatedAt: f.updatedAt }; }
function publicFilterPreset_(f) { return { id: f.id, createdBy: f.createdBy, name: f.name, kind: f.kind, config: parseJson_(f.configJson, {}), thumbnailUrl: f.thumbnailUrl, createdAt: f.createdAt, updatedAt: f.updatedAt }; }

function publicState_(projectId) {
  pruneSessions_();
  pruneStories_();
  const profiles = rows_('PROFILES').filter(byProject_(projectId)).map(function(p){ return { id: p.id, name: p.name, color: p.color, status: p.status }; });
  const feed = rows_('FEED').filter(byProject_(projectId)).map(publicPost_).sort(byDateDesc_).slice(0, 250);
  const stories = rows_('STORIES').filter(byProject_(projectId)).filter(function(s){ return Number(s.expiresAt) > Date.now(); }).map(publicStory_).sort(byDateDesc_).slice(0, 120);
  const messages = rows_('MESSAGES').filter(byProject_(projectId));
  const channels = {};
  rows_('CHANNELS').filter(byProject_(projectId)).forEach(function(c){ channels[c.name] = []; });
  messages.forEach(function(m){ if (!channels[m.channel]) channels[m.channel] = []; channels[m.channel].push(publicMessage_(m)); });
  Object.keys(channels).forEach(function(k){ channels[k] = channels[k].sort(byDateAsc_).slice(-250); });
  if (!channels.general) channels.general = [];
  const events = rows_('EVENTS').filter(byProject_(projectId)).map(publicEvent_).sort(function(a,b){ return String(a.start).localeCompare(String(b.start)); }).slice(0, 250);
  const calls = rows_('CALLS').filter(byProject_(projectId)).map(publicCall_).filter(function(c){ return c.status === 'active'; }).slice(-50);
  const mediaAssets = rows_('MEDIA_ASSETS').filter(byProject_(projectId)).map(publicMediaAsset_).sort(byDateDesc_).slice(0, 250);
  const voiceMessages = rows_('VOICE_MESSAGES').filter(byProject_(projectId)).map(publicVoiceMessage_).sort(byDateDesc_).slice(0, 250);
  const videos = rows_('VIDEOS').filter(byProject_(projectId)).map(publicVideo_).sort(byDateDesc_).slice(0, 250);
  const filterPresets = rows_('FILTER_PRESETS').filter(byProject_(projectId)).map(publicFilterPreset_).slice(-200);
  return { appName: 'Socials Application', profiles: profiles, channels: channels, feed: feed, stories: stories, onlineUsers: onlineUsers_(projectId), events: events, calls: calls, mediaAssets: mediaAssets, voiceMessages: voiceMessages, videos: videos, filterPresets: filterPresets, updatedAt: new Date().toISOString() };
}

function onlineUsers_(projectId) {
  const cutoff = Date.now() - SOCIAL_APP.ACTIVE_WINDOW_MS;
  return rows_('SESSIONS').filter(function(s){ return s.projectId === projectId && Number(s.lastSeen) >= cutoff; }).slice(0, SOCIAL_APP.MAX_ACTIVE_USERS_PER_PROJECT).map(function(s){
    return { clientId: s.userId, name: s.displayName, status: 'online', color: '#38bdf8', section: 'site', activeGame: '', activeGameTitle: '', lastSeen: Number(s.lastSeen), connectedAt: Number(s.createdAt) };
  });
}

function messengerHistory_(projectId) {
  return rows_('MESSENGER').filter(byProject_(projectId)).slice(-1000).map(publicEnvelope_);
}

function manifest_(req) {
  const short = req.projectName.slice(0, 12) || 'Project';
  return { ok: true, manifest: { name: req.projectName, short_name: short, display: 'standalone', background_color: '#000305', theme_color: '#003C42', description: 'Private small-network Socials Application.', backendVersion: SOCIAL_APP.VERSION, capabilities: ['password-auth','google-cloud-auth','email-reset','email-invites','permanent-spreadsheet-storage','drive-media-storage','webrtc-signaling-mailbox','voice-message-storage','video-storage','camera-capture-storage','speech-to-text-webhook-or-browser-transcripts','face-descriptor-storage-and-matching','filter-preset-storage'] } };
}

function requireSession_(req, optional) {
  pruneSessions_();
  if (!req.sessionToken) {
    if (optional) return null;
    throw new Error('Login required.');
  }
  const session = rows_('SESSIONS').find(function(s){ return s.token === req.sessionToken && s.projectId === req.projectId; });
  if (!session) {
    if (optional) return null;
    throw new Error('Session expired. Please log in again.');
  }
  updateSessionSeen_(session.token);
  return session;
}

function createSession_(projectId, userId, displayName, userAgent) {
  const token = randomId_('sess');
  const now = Date.now();
  append_('SESSIONS', { token: token, projectId: projectId, userId: userId, displayName: displayName, createdAt: now, lastSeen: now, userAgent: cleanText_(userAgent || '', 240) });
  return { sessionToken: token, token: token, projectId: projectId, userId: userId, displayName: displayName, createdAt: now, maxActiveUsers: SOCIAL_APP.MAX_ACTIVE_USERS_PER_PROJECT };
}

function updateSessionSeen_(token) {
  const row = rows_('SESSIONS').find(function(s){ return s.token === token; });
  if (row) updateRow_('SESSIONS', row._row, { lastSeen: Date.now() });
}

function enforceActiveLimit_(projectId, currentToken) {
  const active = rows_('SESSIONS').filter(function(s){ return s.projectId === projectId && Date.now() - Number(s.lastSeen || 0) < SOCIAL_APP.ACTIVE_WINDOW_MS; });
  const alreadyActive = active.some(function(s){ return s.token === currentToken; });
  if (!alreadyActive && active.length >= SOCIAL_APP.MAX_ACTIVE_USERS_PER_PROJECT) throw new Error('This project already has 10 active people. Try again after someone leaves or becomes inactive.');
}

function pruneSessions_() {
  const cutoff = Date.now() - SOCIAL_APP.SESSION_TTL_MS;
  const sheet = getSheet_('SESSIONS');
  const rows = rows_('SESSIONS').filter(function(r){ return Number(r.lastSeen || 0) < cutoff; }).sort(function(a,b){ return b._row - a._row; });
  rows.forEach(function(row){ sheet.deleteRow(row._row); });
}

function pruneStories_() {
  const sheet = getSheet_('STORIES');
  const expired = rows_('STORIES').filter(function(r){ return Number(r.expiresAt || 0) < Date.now(); }).sort(function(a,b){ return b._row - a._row; });
  expired.forEach(function(row){ sheet.deleteRow(row._row); });
}

function upsertProfile_(projectId, p) {
  const profile = { projectId: projectId, id: cleanSlug_(p.id || p.name), name: cleanText_(p.name || 'Friend', 80), color: /^#[0-9a-f]{6}$/i.test(String(p.color || '')) ? p.color : '#38bdf8', status: cleanText_(p.status || 'Around', 120), updatedAt: new Date().toISOString() };
  const existing = rows_('PROFILES').find(function(row){ return row.projectId === projectId && row.id === profile.id; });
  if (existing) updateRow_('PROFILES', existing._row, profile);
  else append_('PROFILES', profile);
  return { id: profile.id, name: profile.name, color: profile.color, status: profile.status };
}

function ensureChannel_(projectId, name) {
  const channel = cleanSlug_(name || 'general');
  const exists = rows_('CHANNELS').some(function(c){ return c.projectId === projectId && c.name === channel; });
  if (!exists) append_('CHANNELS', { projectId: projectId, name: channel, createdAt: new Date().toISOString() });
}

function findRoom_(projectId, roomCode) {
  const room = rows_('ROOMS').find(function(r){ return r.projectId === projectId && r.room === cleanSlug_(roomCode || 'room'); });
  if (!room) throw new Error('Room not found.');
  return room;
}

function touchParticipant_(room, peerId, handRaised) {
  const now = Date.now();
  const participants = parseJson_(room.participantsJson, []).filter(function(x){ return now - Number(x.lastSeen || 0) < SOCIAL_APP.ACTIVE_WINDOW_MS; });
  participants.forEach(function(p){ if (p.id === peerId) { p.lastSeen = now; if (handRaised !== null && handRaised !== undefined) p.handRaised = handRaised; } });
  updateRow_('ROOMS', room._row, { updatedAt: now, participantsJson: JSON.stringify(participants) });
  return participants;
}

function addRoomEvent_(projectId, room, type, payload, fromPeer, toPeer) {
  const row = { projectId: projectId, room: room, id: randomId_('signal'), fromPeer: fromPeer || 'server', toPeer: toPeer || '*', type: type, payloadJson: JSON.stringify(payload || {}), createdAt: Date.now(), deliveredJson: '[]' };
  append_('SIGNALS', row);
  pruneSignals_();
  return row;
}

function pruneSignals_() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  const sheet = getSheet_('SIGNALS');
  rows_('SIGNALS').filter(function(r){ return Number(r.createdAt || 0) < cutoff; }).sort(function(a,b){ return b._row - a._row; }).forEach(function(row){ sheet.deleteRow(row._row); });
}

function saveMediaIfNeeded_(projectId, dataUrl, mimeType, name, createdBy, force) {
  const value = String(dataUrl || '');
  if (!value) return { url: '', mimeType: mimeType || '', id: '' };
  if (!force && value.length <= SOCIAL_APP.MAX_MEDIA_CHARS_IN_SHEET) return { url: value, mimeType: mimeType || guessMime_(value), id: '' };
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { url: value.slice(0, 2000), mimeType: mimeType || '', id: '' };
  const type = mimeType || match[1] || 'application/octet-stream';
  const bytes = Utilities.base64Decode(match[2]);
  const safeName = cleanSlug_(name || 'upload') + '-' + Date.now();
  const blob = Utilities.newBlob(bytes, type, safeName);
  const file = getUploadFolder_().createFile(blob);
  if (SOCIAL_APP.PUBLIC_DRIVE_FILE_LINKS) file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = SOCIAL_APP.PUBLIC_DRIVE_FILE_LINKS ? ('https://drive.google.com/uc?export=download&id=' + file.getId()) : file.getUrl();
  const id = randomId_('file');
  append_('FILES', { projectId: projectId, id: id, name: safeName, mimeType: type, size: bytes.length, url: url, driveFileId: file.getId(), createdBy: createdBy || '', createdAt: new Date().toISOString() });
  return { id: id, name: safeName, mimeType: type, size: bytes.length, url: url, driveFileId: file.getId() };
}

function publicPost_(p) { return { id: p.id, author: p.author, text: p.text, media: p.media, mediaType: p.mediaType, createdAt: p.createdAt, reactions: parseJson_(p.reactionsJson, []), comments: parseJson_(p.commentsJson, []) }; }
function publicMessage_(m) { return { id: m.id, author: m.author, text: m.text, media: m.media, mediaType: m.mediaType, origin: m.origin, createdAt: m.createdAt, reactions: parseJson_(m.reactionsJson, []) }; }
function publicStory_(s) { return { id: s.id, author: s.author, text: s.text, media: s.media, mediaType: s.mediaType, createdAt: s.createdAt, expiresAt: Number(s.expiresAt), reactions: parseJson_(s.reactionsJson, []) }; }
function publicEnvelope_(e) { return { id: e.id, type: e.type, clientId: e.clientId, createdAt: e.createdAt, payload: parseJson_(e.payloadJson, {}), appName: e.appName || 'Messenger Plug-in' }; }
function publicEvent_(e) { return { id: e.id, title: e.title, start: e.start, end: e.end, location: e.location, description: e.description, createdBy: e.createdBy, createdAt: e.createdAt, updatedAt: e.updatedAt, calendarEventId: e.calendarEventId }; }
function publicUser_(u) { return { userId: u.userId, accountId: u.userId, username: u.username, displayName: u.displayName, role: u.role, avatar: u.avatar, status: u.status, email: u.email || '', phone: u.phone || '', backupEmails: parseBackupEmails_(u.backupEmailsJson), mustChangePassword: String(u.mustChangePassword || '') === 'true' }; }

function output_(obj, callback) {
  const text = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + text + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(SOCIAL_APP.SPREADSHEET_PROPERTY);
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.create('Social Application Shared Backend Data');
  props.setProperty(SOCIAL_APP.SPREADSHEET_PROPERTY, ss.getId());
  return ss;
}

function getUploadFolder_() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty(SOCIAL_APP.FILE_FOLDER_PROPERTY);
  if (id) return DriveApp.getFolderById(id);
  const folder = DriveApp.createFolder('Social Application Shared Backend Uploads');
  props.setProperty(SOCIAL_APP.FILE_FOLDER_PROPERTY, folder.getId());
  return folder;
}

function getSheet_(key) {
  const headers = SOCIAL_APP.SHEETS[key];
  const ss = getSpreadsheet_();
  let sheet = ss.getSheetByName(key);
  if (!sheet) sheet = ss.insertSheet(key);
  const width = headers.length;
  const first = sheet.getRange(1, 1, 1, width).getValues()[0];
  const mismatch = headers.some(function(h, i){ return first[i] !== h; });
  if (mismatch) sheet.getRange(1, 1, 1, width).setValues([headers]);
  return sheet;
}

function rows_(key) {
  const sheet = getSheet_(key);
  const values = sheet.getDataRange().getValues();
  const headers = SOCIAL_APP.SHEETS[key];
  if (values.length <= 1) return [];
  return values.slice(1).map(function(row, i){
    const obj = { _row: i + 2 };
    headers.forEach(function(h, c){ obj[h] = row[c]; });
    return obj;
  });
}

function append_(key, obj) {
  const sheet = getSheet_(key);
  const headers = SOCIAL_APP.SHEETS[key];
  sheet.appendRow(headers.map(function(h){ return obj[h] !== undefined ? obj[h] : ''; }));
}

function updateRow_(key, rowNumber, patch) {
  const sheet = getSheet_(key);
  const headers = SOCIAL_APP.SHEETS[key];
  const current = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const next = headers.map(function(h, i){ return patch[h] !== undefined ? patch[h] : current[i]; });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([next]);
}

function audit_(projectId, action, userId, details) {
  append_('AUDIT', { at: new Date().toISOString(), projectId: projectId, action: action, userId: userId || '', detailsJson: JSON.stringify(details || {}) });
}

function hashPassword_(password, salt) {
  const raw = salt + ':' + String(password || '');
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

function randomId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20);
}

function cleanSlug_(value) {
  const cleaned = String(value || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
  return cleaned || 'default';
}

function cleanUsername_(value) {
  return String(value || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.@-]+/g, '').slice(0, 80);
}

function cleanText_(value, limit) {
  return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, limit || 4000);
}

function parseJson_(value, fallback) {
  try { return JSON.parse(value || ''); }
  catch (_err) { return fallback; }
}

function mergeObjects_(a, b) {
  const out = {};
  Object.keys(a || {}).forEach(function(k){ out[k] = a[k]; });
  Object.keys(b || {}).forEach(function(k){ if (out[k] === undefined) out[k] = b[k]; });
  return out;
}

function byProject_(projectId) { return function(row){ return row.projectId === projectId; }; }
function byDateDesc_(a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); }
function byDateAsc_(a, b) { return String(a.createdAt || '').localeCompare(String(b.createdAt || '')); }
function guessMime_(dataUrl) { const m = String(dataUrl || '').match(/^data:([^;]+)/); return m ? m[1] : ''; }

    return {
      "setup": (typeof setup === 'function' ? setup : null),
      "doGet": (typeof doGet === 'function' ? doGet : null),
      "doPost": (typeof doPost === 'function' ? doPost : null)
    };
  })();
  return TDM92_MODULE_CACHE.social;
}


/* ==========================================================================
 * Wrapped source module: OurSpace Unified Backend
 * ========================================================================== */
function tdm92_module_ourspace_() {
  if (TDM92_MODULE_CACHE.ourspace) return TDM92_MODULE_CACHE.ourspace;
  TDM92_MODULE_CACHE.ourspace = (function () {
/**
 * OurSpace Unified Backend — merged Apps Script Web App
 * -----------------------------------------------------
 * Generated from three provided backend files:
 *   1) OurSpace Link Share + Private Gift Backend
 *   2) OurSpace/Social compatibility backend
 *   3) OurSpace Site backend
 *
 * Canonical branding: OurSpace.
 * Canonical database: one Google Sheet created by site_ensureDatabase_().
 * Canonical upload folder: one Drive folder created by site_ensureUploadFolder_().
 *
 * Duplicate / near-duplicate feature resolution:
 * - Main OurSpace site auth, sessions, profiles, links, messenger, calls, media, PWA,
 *   purchases, currency, calendar, schedules, tasks, and generic records
 *   use the OurSpace Site backend implementation.
 * - Private gift/link-share features use the Link Share implementation, but its tables
 *   are stored in the same OurSpace database and its audit tab was renamed to
 *   LinkShareAuditLog to avoid clashing with the main site AuditLog.
 * - Older social-app compatibility actions are preserved in a compatibility namespace and
 *   use Compat_* sheet tabs inside the same database so older frontends can still call
 *   legacy actions without corrupting the OurSpace two-person site tables.
 *
 * Deployment:
 *   1. Paste this whole file into Apps Script as Code.gs.
 *   2. Run OURSPACE_CREATE_BACKEND_SPREADSHEET once.
 *   3. Optional/private link login: edit and run OURSPACE_SET_PASSCODES_ONCE once,
 *      then erase the plaintext passcodes from that function.
 *   4. Deploy as Web app: Execute as Me; access Anyone with the link.
 */

var OURSPACE_MERGED_BACKEND = Object.freeze({
  appName: 'OurSpace Unified Backend',
  version: '2026-06-25.clean.unlimited-devices',
  canonicalDatabaseProperty: 'OURSPACE_SITE_SPREADSHEET_ID',
  canonicalUploadFolderProperty: 'OURSPACE_SITE_UPLOAD_FOLDER_ID',
  publicProfiles: ['william', 'jasper'],
  colors: { cyan: '#00FFFF', orange: '#CA6309' }
});

var OURSPACE_LINK_SHARE_HEADERS = Object.freeze({
  PublicLinks: ['id', 'ownerKey', 'title', 'label', 'url', 'imageUrl', 'priceNote', 'public', 'sortOrder', 'notes', 'createdAt', 'updatedAt'],
  PurchaseRequests: ['requestId', 'shareId', 'itemId', 'itemTitle', 'itemUrl', 'buyerName', 'buyerEmail', 'buyerNote', 'status', 'createdAt', 'updatedAt'],
  PrivateAddresses: ['memberKey', 'displayName', 'addressJson', 'updatedAt'],
  LinkShareAuditLog: ['time', 'actorKey', 'action', 'detailJson']
});

var OURSPACE_SOCIAL_COMPAT_ACTIONS = Object.freeze([
  'manifest','iceConfig','ice_config','cloud_auth_sign_in','google_auth_sign_in','link_cloud_provider',
  'send_invite_email','deliver_temporary_password','email_temporary_password','create_account','sign_in',
  'request_password_reset','tell_dino_cant_login','update_password','register','state','onlineUsers',
  'heartbeat','presence','profile','post','comment','reaction','message','importHistory','story','exportData',
  'event','file','messengerEnvelope','messengerHistory','save_record','appRecord','list_records','appRecords',
  'save_media_asset','mediaAsset','camera_capture','save_voice_message','voiceMessage','save_video','videoAsset',
  'request_transcription','transcribe_media','save_transcript','update_transcript','save_face_profile','faceProfile',
  'list_face_profiles','match_face_descriptor','recognize_face','save_filter_preset','filterPreset','list_filter_presets',
  'create_call','callCreate','join_call','callJoin','leave_call','callLeave','end_call','callEnd','call_signal',
  'callSignal','poll_call','callPoll','roomJoin','roomHeartbeat','roomLeave','roomSignal','roomChat',
  'roomReaction','roomRaiseHand','roomPoll'
]);

var OURSPACE_LINK_SHARE_ACTIONS = Object.freeze([
  'publicLinks','share','publicPurchaseRequest','whoami','getPublicShareUrl','rotateShareId','savePrivateAddress',
  'getMyPrivateAddress','upsertPublicLink','deletePublicLink','listMyLinks','listPurchaseRequests',
  'updatePurchaseRequestStatus'
]);

function setup() {
  return OURSPACE_CREATE_BACKEND_SPREADSHEET();
}

function OURSPACE_CREATE_BACKEND_SPREADSHEET() {
  var site = site_setup_();
  var ss = site_ensureDatabase_();
  var folder = site_ensureUploadFolder_();
  PropertiesService.getScriptProperties().setProperty(OURSPACE_BACKEND.props.dbId, ss.getId());
  PropertiesService.getScriptProperties().setProperty(OURSPACE_SOCIAL_COMPAT.SPREADSHEET_PROPERTY, ss.getId());
  PropertiesService.getScriptProperties().setProperty(OURSPACE_SOCIAL_COMPAT.FILE_FOLDER_PROPERTY, folder.getId());
  var shareId = link_getOrCreateShareId_();
  ourspace_ensureUnifiedDatabaseAndLinkSheets_();
  social_setup();
  return {
    ok: true,
    app: OURSPACE_MERGED_BACKEND.appName,
    version: OURSPACE_MERGED_BACKEND.version,
    message: 'OurSpace unified backend ready.',
    spreadsheetId: ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    uploadFolderId: folder.getId(),
    uploadFolderUrl: folder.getUrl(),
    publicShareId: shareId,
    publicShareUrl: link_publicShareUrl_(),
    actionGroups: {
      site: site_availableActions_(),
      linkShare: OURSPACE_LINK_SHARE_ACTIONS,
      socialCompatibility: OURSPACE_SOCIAL_COMPAT_ACTIONS
    }
  };
}

function OURSPACE_SET_PASSCODES_ONCE() {
  return link_OURSPACE_SET_PASSCODES_ONCE();
}

function OURSPACE_ADD_DEMO_LINK_OPTIONAL() {
  ourspace_ensureUnifiedDatabaseAndLinkSheets_();
  return link_OURSPACE_ADD_DEMO_LINK_OPTIONAL();
}

function doGet(e) {
  return ourspace_dispatchGet_(e);
}

function doPost(e) {
  return ourspace_dispatchPost_(e);
}

function doOptions() {
  return ContentService.createTextOutput('').setMimeType(ContentService.MimeType.TEXT);
}

function ourspace_dispatchGet_(e) {
  var action = ourspace_actionFromEvent_(e);
  if (action === 'setup') return site_jsonResponse_(OURSPACE_CREATE_BACKEND_SPREADSHEET());
  if (action === 'mergedHealth' || action === 'healthMerged') return site_jsonResponse_(ourspace_health_());
  if (OURSPACE_LINK_SHARE_ACTIONS.indexOf(action) >= 0) return link_doGet(e);
  if (OURSPACE_SOCIAL_COMPAT_ACTIONS.indexOf(action) >= 0) return social_doGet(e);
  return site_doGet(e);
}

function ourspace_dispatchPost_(e) {
  var payload = ourspace_payloadFromEvent_(e);
  var action = String(payload.action || '').trim();
  if (action === 'setup') return site_jsonResponse_(OURSPACE_CREATE_BACKEND_SPREADSHEET());
  if (action === 'mergedHealth' || action === 'healthMerged') return site_jsonResponse_(ourspace_health_());

  // login/logout existed in multiple source files. Keep passcode/email private link login in Link Share;
  // keep username/password legacy login/register/logout in Social compatibility; keep signin/signout in Site.
  if (action === 'login') {
    if (payload.passcode || payload.memberKey || payload.member_key || payload.email) return link_doPost(e);
    return social_doPost(e);
  }
  if (action === 'logout') {
    if (payload.memberKey || payload.member_key || payload.token || payload.session_token) return link_doPost(e);
    return social_doPost(e);
  }

  if (OURSPACE_LINK_SHARE_ACTIONS.indexOf(action) >= 0) return link_doPost(e);
  if (OURSPACE_SOCIAL_COMPAT_ACTIONS.indexOf(action) >= 0) return social_doPost(e);
  return site_doPost(e);
}

function ourspace_health_() {
  var site = site_health_();
  return {
    ok: true,
    app: OURSPACE_MERGED_BACKEND.appName,
    version: OURSPACE_MERGED_BACKEND.version,
    site: site,
    linkShare: {
      publicShareId: link_getOrCreateShareId_(),
      publicShareUrl: link_publicShareUrl_(),
      privateAddressPublicExposure: false,
      publicRoutesExposeOnlyApprovedLinks: true
    },
    compatibility: {
      legacySocialActionsPreserved: true,
      socialSheetsUseCompatPrefix: true
    }
  };
}

function ourspace_ensureUnifiedDatabaseAndLinkSheets_() {
  var ss = site_ensureDatabase_();
  Object.keys(OURSPACE_LINK_SHARE_HEADERS).forEach(function(name) {
    ourspace_ensureSheetWithHeaders_(ss, name, OURSPACE_LINK_SHARE_HEADERS[name]);
  });
  PropertiesService.getScriptProperties().setProperty(OURSPACE_BACKEND.props.dbId, ss.getId());
  if (!PropertiesService.getScriptProperties().getProperty(OURSPACE_BACKEND.props.shareId)) {
    PropertiesService.getScriptProperties().setProperty(OURSPACE_BACKEND.props.shareId, link_createId_('share'));
  }
  return ss;
}

function ourspace_ensureSheetWithHeaders_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.autoResizeColumns(1, headers.length);
    return sheet;
  }
  var width = Math.max(sheet.getLastColumn(), headers.length);
  var current = sheet.getRange(1, 1, 1, width).getValues()[0].map(function(h) { return String(h || '').trim(); });
  var changed = false;
  headers.forEach(function(h, idx) {
    if (!current[idx]) { current[idx] = h; changed = true; }
  });
  if (changed) sheet.getRange(1, 1, 1, current.length).setValues([current]);
  return sheet;
}

function ourspace_actionFromEvent_(e) {
  var p = (e && e.parameter) || {};
  return String(p.action || '').trim();
}

function ourspace_payloadFromEvent_(e) {
  var p = (e && e.parameter) || {};
  var body = {};
  if (e && e.postData && e.postData.contents) {
    try { body = JSON.parse(e.postData.contents); }
    catch (_err) { body = {}; }
  }
  if (body && body.payload && typeof body.payload === 'object') body = site_merge_(body, body.payload);
  if (p.payload) {
    try { body = site_merge_(body, JSON.parse(p.payload)); }
    catch (_err2) {}
  }
  return site_merge_(body, p);
}



/* ==========================================================================
 * Canonical OurSpace Site backend (prefixed with site_)
 * ========================================================================== */

/*******************************************************
 * OurSpace SITE backend — Google Apps Script Web App
 * Project name suggestion: site
 *
 * Paste this entire file into a Google Apps Script project named: site
 * Deploy as Web App:
 *   Execute as: Me
 *   Who has access: Anyone
 *
 * Frontend contract:
 *   POST JSON or text/plain JSON with { action: "...", ... }
 *   Also accepts form payload={json}.
 *
 * Important boundary:
 *   This backend stores/relays data. Live calls, video calls,
 *   camera capture, filters, and voice changing happen in the browser
 *   through WebRTC, MediaDevices, Canvas/WebGL, MediaRecorder, and
 *   Web Audio. This script stores signaling, call logs, media uploads,
 *   presets, stickers, messages, purchases, currency, preferences, and
 *   PWA/install/app metadata.
 *******************************************************/

const SITE_CONFIG = {
  APP_NAME: 'OurSpace Site Backend',
  VERSION: '2026-06-25.site.clean.unlimited-devices',
  DATABASE_PROPERTY_KEY: 'OURSPACE_SITE_SPREADSHEET_ID',
  DRIVE_FOLDER_PROPERTY_KEY: 'OURSPACE_SITE_UPLOAD_FOLDER_ID',
  SESSION_DAYS: 30,
  DEVICE_SESSION_POLICY: 'unlimited-devices-per-account',
  MAX_USERS: 2,
  MAX_UPLOAD_BYTES: 8 * 1024 * 1024,
  MIN_PASSWORD_LENGTH: 8,
  ALLOWED_PROFILES: ['william', 'jasper'],
  PROFILES: {
    william: {
      profileKey: 'william',
      displayName: 'William / Dino',
      siteName: 'Dino Nerdzone',
      lineName: 'William',
      defaultPartnerProfile: 'jasper',
      primaryEmail: 'williamsaville92@gmail.com',
      purchaseNotificationRecipient: 'jasperfaye99@gmail.com'
    },
    jasper: {
      profileKey: 'jasper',
      displayName: 'Jasper',
      siteName: 'Squishy Cottage',
      lineName: 'Jasper',
      defaultPartnerProfile: 'william',
      primaryEmail: 'jasperfaye99@gmail.com',
      purchaseNotificationRecipient: 'williamsaville92@gmail.com'
    }
  },
  SHEETS: {
    users: 'Users',
    sessions: 'Sessions',
    profiles: 'Profiles',
    preferences: 'Preferences',
    links: 'ProfileLinks',
    music: 'MusicLinks',
    appEvents: 'AppEvents',
    pwaInstalls: 'PwaInstalls',
    channels: 'MessengerChannels',
    messages: 'MessengerMessages',
    reactions: 'MessengerReactions',
    callSessions: 'CallSessions',
    callSignals: 'CallSignals',
    media: 'MediaUploads',
    gifs: 'GifLibrary',
    stickers: 'Stickers',
    effectPresets: 'EffectPresets',
    voiceMessages: 'VoiceMessages',
    transcripts: 'Transcripts',
    currencyLedger: 'CurrencyLedger',
    purchases: 'Purchases',
    storeCatalog: 'StoreCatalog',
    calendarEvents: 'CalendarEvents',
    scheduleItems: 'ScheduleItems',
    taskCompletions: 'TaskCompletions',
    genericRecords: 'GenericRecords',
    audit: 'AuditLog'
  }
};

const SITE_HEADERS = {
  Users: ['UserId','ProfileKey','DisplayName','Username','Email','PasswordSalt','PasswordHash','Active','CreatedAt','UpdatedAt','LastSigninAt'],
  Sessions: ['SessionToken','UserId','ProfileKey','CreatedAt','ExpiresAt','Active','ClientId','UserAgent'],
  Profiles: ['ProfileKey','Json','UpdatedAt','UpdatedBy'],
  Preferences: ['PreferenceId','ProfileKey','Scope','Key','Json','UpdatedAt','UpdatedBy'],
  ProfileLinks: ['LinkId','ProfileKey','Label','Url','Category','Sort','Active','CreatedAt','UpdatedBy'],
  MusicLinks: ['MusicId','ProfileKey','Title','Url','Artist','Provider','Notes','Active','CreatedAt','UpdatedBy'],
  AppEvents: ['EventId','ProfileKey','Action','Json','CreatedAt','ClientId'],
  PwaInstalls: ['InstallId','ProfileKey','Platform','DisplayMode','Json','CreatedAt','ClientId'],
  MessengerChannels: ['ChannelId','Name','Kind','ProfileA','ProfileB','Json','Active','CreatedAt','UpdatedAt'],
  MessengerMessages: ['MessageId','ChannelId','FromProfile','ToProfile','Kind','Text','AttachmentIds','StickerId','GifUrl','Json','CreatedAt','DeletedAt'],
  MessengerReactions: ['ReactionId','MessageId','ProfileKey','Reaction','CreatedAt'],
  CallSessions: ['CallId','ChannelId','CallerProfile','CalleeProfile','Mode','Status','Json','StartedAt','UpdatedAt','EndedAt'],
  CallSignals: ['SignalId','CallId','ChannelId','FromProfile','ToProfile','SignalType','Json','CreatedAt','ExpiresAt','ConsumedAt'],
  MediaUploads: ['MediaId','ProfileKey','Kind','FileName','MimeType','SizeBytes','DriveFileId','DriveUrl','PublicUrl','MetaJson','CreatedAt'],
  GifLibrary: ['GifId','ProfileKey','Label','Url','Tags','Json','CreatedAt'],
  Stickers: ['StickerId','ProfileKey','SourceType','Text','MediaId','Url','Json','CreatedAt'],
  EffectPresets: ['PresetId','ProfileKey','Kind','Name','Json','Active','CreatedAt','UpdatedAt'],
  VoiceMessages: ['VoiceId','MessageId','ProfileKey','MediaId','DurationMs','Transcript','Json','CreatedAt'],
  Transcripts: ['TranscriptId','ProfileKey','SourceKind','SourceId','Transcript','Confidence','Engine','Json','CreatedAt'],
  CurrencyLedger: ['LedgerId','ProfileKey','Direction','AmountCopper','Reason','SourceType','SourceId','BalanceAfterCopper','Json','CreatedAt','CreatedBy'],
  Purchases: ['PurchaseId','ProfileKey','StoreName','ItemsJson','TotalCopper','Status','Note','Json','CreatedAt','UpdatedAt'],
  StoreCatalog: ['CatalogId','ProfileKey','Json','UpdatedAt','UpdatedBy'],
  CalendarEvents: ['EventId','ProfileKey','Title','StartAt','EndAt','Recurrence','Category','Source','Json','Active','CreatedAt','UpdatedAt'],
  ScheduleItems: ['ScheduleId','ProfileKey','Title','Respawn','DayOfWeek','TimeOfDay','Category','Json','Active','CreatedAt','UpdatedAt'],
  TaskCompletions: ['CompletionId','ProfileKey','TaskId','Title','RewardCopper','CompletedAt','Json','CreatedBy'],
  GenericRecords: ['RecordId','ProfileKey','Bucket','Key','Json','CreatedAt','UpdatedAt','UpdatedBy'],
  AuditLog: ['AuditId','ProfileKey','Action','Json','CreatedAt']
};

function site_doGet(e) {
  try {
    var payload = site_parseRequest_(e);
    var action = String(payload.action || 'health').trim();
    return site_jsonResponse_(site_route_(action, payload));
  } catch (err) {
    return site_jsonResponse_(site_fail_(err));
  }
}

function site_doPost(e) {
  try {
    var payload = site_parseRequest_(e);
    var action = String(payload.action || '').trim();
    if (!action) return site_jsonResponse_({ ok:false, error:'Missing action.' });
    return site_jsonResponse_(site_route_(action, payload));
  } catch (err) {
    return site_jsonResponse_(site_fail_(err));
  }
}

function site_route_(action, payload) {
  site_ensureDatabase_();
  switch (action) {
    case 'setup': return site_setup_();
    case 'health': return site_health_();
    case 'actions': return { ok:true, actions: site_availableActions_(), version:SITE_CONFIG.VERSION };

    case 'signup': return site_authSignup_(payload);
    case 'signin': return site_authSignin_(payload);
    case 'signout': return site_authSignout_(payload);
    case 'me': return site_authMe_(payload);
    case 'bootstrap': return site_authBootstrap_(payload);
    case 'requestPasswordReset': return site_passwordResetRequest_(payload);
    case 'resetPassword': return site_passwordResetComplete_(payload);

    case 'auth.signup': return site_authSignup_(payload);
    case 'auth.signin': return site_authSignin_(payload);
    case 'auth.signout': return site_authSignout_(payload);
    case 'auth.me': return site_authMe_(payload);
    case 'auth.bootstrap': return site_authBootstrap_(payload);

    case 'profile.get': return site_profileGet_(payload);
    case 'profile.save': return site_profileSave_(payload);
    case 'profile.list': return site_profileList_(payload);

    case 'preference.get': return site_preferenceGet_(payload);
    case 'preference.set': return site_preferenceSet_(payload);
    case 'preference.list': return site_preferenceList_(payload);

    case 'link.add': return site_linkAdd_(payload);
    case 'link.list': return site_linkList_(payload);
    case 'link.remove': return site_linkRemove_(payload);
    case 'music.add': return site_musicAdd_(payload);
    case 'music.list': return site_musicList_(payload);

    case 'app.event': return site_appEvent_(payload);
    case 'pwa.install.record': return site_pwaInstallRecord_(payload);
    case 'pwa.manifest.hints': return site_pwaManifestHints_(payload);

    case 'channel.create': return site_channelUpsert_(payload);
    case 'channel.upsert': return site_channelUpsert_(payload);
    case 'channel.list': return site_channelList_(payload);
    case 'message.send': return site_messageSend_(payload);
    case 'message.create': return site_messageSend_(payload);
    case 'message.list': return site_messageList_(payload);
    case 'message.react': return site_messageReact_(payload);
    case 'message.delete': return site_messageDelete_(payload);

    case 'call.create': return site_callCreate_(payload);
    case 'call.update': return site_callUpdate_(payload);
    case 'call.end': return site_callEnd_(payload);
    case 'call.signal.send': return site_callSignalSend_(payload);
    case 'call.signal': return site_callSignalSend_(payload);
    case 'call.signal.list': return site_callSignalList_(payload);
    case 'call.signal.clear': return site_callSignalClear_(payload);

    case 'upload.media': return site_uploadMedia_(payload);
    case 'media.list': return site_mediaList_(payload);
    case 'gif.save': return site_gifSave_(payload);
    case 'gif.list': return site_gifList_(payload);
    case 'sticker.save': return site_stickerSave_(payload);
    case 'sticker.fromText': return site_stickerFromText_(payload);
    case 'sticker.list': return site_stickerList_(payload);
    case 'effect.save': return site_effectSave_(payload);
    case 'effect.list': return site_effectList_(payload);

    case 'voice.message.save': return site_voiceMessageSave_(payload);
    case 'audio.transcript.save': return site_transcriptSave_(payload);
    case 'audio.transcribe.request': return site_transcribeRequest_(payload);

    case 'currency.earn': return site_currencyLedger_(payload, 'earn');
    case 'currency.spend': return site_currencyLedger_(payload, 'spend');
    case 'currency.adjust': return site_currencyLedger_(payload, 'adjust');
    case 'currency.balance': return site_currencyBalance_(payload);
    case 'recordPurchase': return site_purchaseRecordFromSite_(payload);
    case 'purchase.create': return site_purchaseCreate_(payload);
    case 'purchase.list': return site_purchaseList_(payload);
    case 'store.catalog.save': return site_storeCatalogSave_(payload);
    case 'store.catalog.get': return site_storeCatalogGet_(payload);

    case 'calendar.event.upsert': return site_calendarEventUpsert_(payload);
    case 'calendar.event.list': return site_calendarEventList_(payload);
    case 'schedule.item.upsert': return site_scheduleItemUpsert_(payload);
    case 'schedule.item.list': return site_scheduleItemList_(payload);
    case 'task.complete': return site_taskComplete_(payload);


    case 'record.save': return site_recordSave_(payload);
    case 'record.list': return site_recordList_(payload);

    default: return { ok:false, error:'Unknown action: ' + action, actions: site_availableActions_() };
  }
}

function site_availableActions_() {
  return [
    'setup','health','actions',
    'signup','signin','signout','me','bootstrap','requestPasswordReset','resetPassword','auth.signup','auth.signin','auth.signout','auth.me','auth.bootstrap',
    'profile.get','profile.save','profile.list',
    'preference.get','preference.set','preference.list',
    'link.add','link.list','link.remove','music.add','music.list',
    'app.event','pwa.install.record','pwa.manifest.hints',
    'channel.create','channel.upsert','channel.list','message.send','message.list','message.react','message.delete',
    'call.create','call.update','call.end','call.signal.send','call.signal.list','call.signal.clear',
    'upload.media','media.list','gif.save','gif.list','sticker.save','sticker.fromText','sticker.list','effect.save','effect.list',
    'voice.message.save','audio.transcript.save','audio.transcribe.request',
    'currency.earn','currency.spend','currency.adjust','currency.balance','recordPurchase','purchase.create','purchase.list','store.catalog.save','store.catalog.get',
    'calendar.event.upsert','calendar.event.list','schedule.item.upsert','schedule.item.list','task.complete',
    'record.save','record.list'
  ];
}

/*************** setup / health ***************/
function site_setup_() {
  var ss = site_ensureDatabase_();
  var folder = site_ensureUploadFolder_();
  site_seedDefaultChannels_();
  return { ok:true, app:SITE_CONFIG.APP_NAME, version:SITE_CONFIG.VERSION, spreadsheetId:ss.getId(), spreadsheetUrl:ss.getUrl(), uploadFolderId:folder.getId(), uploadFolderUrl:folder.getUrl() };
}

function site_health_() {
  var ss = site_ensureDatabase_();
  var activeUsers = site_getRows_('Users').filter(function(r){ return String(r.Active) === 'true'; }).length;
  return {
    ok:true,
    app:SITE_CONFIG.APP_NAME,
    version:SITE_CONFIG.VERSION,
    databaseReady:true,
    spreadsheetId:ss.getId(),
    activeUsers:activeUsers,
    maxUsers:SITE_CONFIG.MAX_USERS,
    profiles:SITE_CONFIG.ALLOWED_PROFILES,
    handles: {
      messaging:true,
      callSignaling:true,
      videoCallSignaling:true,
      voiceChangerPresetStorage:true,
      cameraFilterPresetStorage:true,
      gifStorage:true,
      stickerStorage:true,
      mediaUploads:true,
      purchaseCurrencyStorage:true,
      pwaInstallEventStorage:true,
      secureLandingSessionStorage:true,
      unlimitedDeviceSessions:true,
      twoProfileAccountLimit:true
    },
    browserRequiredFor:['live audio/video calls','taking pictures/videos','real-time filters','voice changing','local install bubble','speech recognition unless frontend or external API supplies transcript']
  };
}

/*************** auth ***************/
function site_authSignup_(payload) {
  var data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || payload.profileKey);
  var username = site_cleanKey_(data.username || data.email || profileKey);
  var email = String(data.email || '').trim().toLowerCase();
  var displayName = String(data.displayName || SITE_CONFIG.PROFILES[profileKey].displayName).trim();
  var password = String(data.password || payload.password || '');
  if (password.length < SITE_CONFIG.MIN_PASSWORD_LENGTH) throw new Error('Password must be at least ' + SITE_CONFIG.MIN_PASSWORD_LENGTH + ' characters.');
  var lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    var users = site_getRows_('Users');
    var activeUsers = users.filter(function(u){ return String(u.Active) === 'true'; });
    if (activeUsers.length >= SITE_CONFIG.MAX_USERS && !activeUsers.some(function(u){ return u.ProfileKey === profileKey; })) throw new Error('Only two OurSpace profile accounts are allowed.');
    if (users.some(function(u){ return String(u.ProfileKey) === profileKey && String(u.Active) === 'true'; })) throw new Error('Profile already has an active account.');
    if (users.some(function(u){ return String(u.Username).toLowerCase() === username.toLowerCase() && String(u.Active) === 'true'; })) throw new Error('Username already exists.');
    if (email && users.some(function(u){ return String(u.Email).toLowerCase() === email && String(u.Active) === 'true'; })) throw new Error('Email already exists.');
    var salt = site_randomToken_(18);
    var now = site_isoNow_();
    var userId = site_id_('user');
    site_appendRow_('Users', { UserId:userId, ProfileKey:profileKey, DisplayName:displayName, Username:username, Email:email, PasswordSalt:salt, PasswordHash:site_hashPassword_(password, salt), Active:'true', CreatedAt:now, UpdatedAt:now, LastSigninAt:'' });
    site_audit_(profileKey, 'auth.signup', { username:username, email:email });
    return site_makeSession_(userId, profileKey, payload);
  } finally { lock.releaseLock(); }
}

function site_authSignin_(payload) {
  var data = site_data_(payload);
  var identifier = String(data.identifier || data.username || data.email || payload.identifier || '').trim().toLowerCase();
  var profileKey = data.profileKey || payload.profileKey;
  var password = String(data.password || payload.password || '');
  if (!identifier && profileKey) identifier = String(profileKey).toLowerCase();
  var users = site_getRows_('Users').filter(function(u){ return String(u.Active) === 'true'; });
  var user = users.find(function(u){
    return String(u.Username).toLowerCase() === identifier || String(u.Email).toLowerCase() === identifier || String(u.ProfileKey).toLowerCase() === identifier;
  });
  if (!user) throw new Error('Account not found.');
  if (profileKey && String(user.ProfileKey) !== site_normalizeProfile_(profileKey)) throw new Error('This account does not match that profile.');
  if (site_hashPassword_(password, user.PasswordSalt) !== user.PasswordHash) throw new Error('Incorrect password.');
  site_updateRows_('Users', function(r){ return r.UserId === user.UserId; }, function(r){ r.LastSigninAt = site_isoNow_(); r.UpdatedAt = site_isoNow_(); return r; });
  site_audit_(user.ProfileKey, 'auth.signin', { username:user.Username });
  return site_makeSession_(user.UserId, user.ProfileKey, payload);
}

function site_authSignout_(payload) {
  var token = String(payload.sessionToken || site_data_(payload).sessionToken || '').trim();
  if (!token) return { ok:true, signedOut:false };
  site_updateRows_('Sessions', function(r){ return r.SessionToken === token; }, function(r){ r.Active = 'false'; return r; });
  return { ok:true, signedOut:true };
}

function site_authMe_(payload) {
  var session = site_requireSession_(payload);
  return { ok:true, user: site_publicUser_(session.user), session:{ profileKey:session.profileKey, expiresAt:session.row.ExpiresAt } };
}

function site_authBootstrap_(payload) {
  var out = { ok:true, profiles:SITE_CONFIG.PROFILES, signedIn:false, session:null, user:null };
  try {
    var session = site_requireSession_(payload);
    out.signedIn = true;
    out.user = site_publicUser_(session.user);
    out.session = { profileKey:session.profileKey, expiresAt:session.row.ExpiresAt };
  } catch (err) {}
  out.defaultChannels = site_channelList_({ profileKey: out.user ? out.user.profileKey : null, noAuth:true }).channels;
  out.manifestHints = site_pwaManifestHints_(payload).manifestHints;
  return out;
}

function site_makeSession_(userId, profileKey, payload) {
  var now = new Date();
  var expires = new Date(now.getTime() + SITE_CONFIG.SESSION_DAYS * 24 * 60 * 60 * 1000);
  var token = site_randomToken_(32);
  site_appendRow_('Sessions', { SessionToken:token, UserId:userId, ProfileKey:profileKey, CreatedAt:now.toISOString(), ExpiresAt:expires.toISOString(), Active:'true', ClientId:String(payload.clientId || ''), UserAgent:String(payload.userAgent || '') });
  var user = site_getRows_('Users').find(function(u){ return u.UserId === userId; });
  return { ok:true, user:site_publicUser_(user), sessionToken:token, expiresAt:expires.toISOString() };
}

function site_requireSession_(payload) {
  var token = String(payload.sessionToken || site_data_(payload).sessionToken || '').trim();
  if (!token) throw new Error('Missing sessionToken.');
  var row = site_getRows_('Sessions').find(function(s){ return s.SessionToken === token && String(s.Active) === 'true'; });
  if (!row) throw new Error('Session not found or signed out.');
  if (new Date(row.ExpiresAt).getTime() < Date.now()) throw new Error('Session expired.');
  var user = site_getRows_('Users').find(function(u){ return u.UserId === row.UserId && String(u.Active) === 'true'; });
  if (!user) throw new Error('User not found.');
  return { row:row, user:user, profileKey:row.ProfileKey, userId:row.UserId };
}

function site_publicUser_(user) {
  return { userId:user.UserId, profileKey:user.ProfileKey, displayName:user.DisplayName, username:user.Username, email:user.Email, siteName:(SITE_CONFIG.PROFILES[user.ProfileKey] || {}).siteName || '' };
}

/*************** profiles/preferences/links ***************/
function site_profileGet_(payload) {
  var profileKey = site_optionalProfile_(payload) || site_requireSession_(payload).profileKey;
  var row = site_latestRow_('Profiles', function(r){ return r.ProfileKey === profileKey; }, 'UpdatedAt');
  return { ok:true, profileKey:profileKey, profile: row ? site_parseJson_(row.Json, {}) : SITE_CONFIG.PROFILES[profileKey] };
}

function site_profileSave_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  if (profileKey !== session.profileKey) throw new Error('Cannot save another profile.');
  site_appendRow_('Profiles', { ProfileKey:profileKey, Json:site_json_(data.profile || data), UpdatedAt:site_isoNow_(), UpdatedBy:session.userId });
  site_audit_(profileKey, 'profile.save', data);
  return { ok:true, profileKey:profileKey };
}

function site_profileList_(payload) {
  return { ok:true, profiles:SITE_CONFIG.PROFILES };
}

function site_preferenceGet_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  var scope = String(data.scope || 'profile');
  var key = String(data.key || 'default');
  var row = site_latestRow_('Preferences', function(r){ return r.ProfileKey === profileKey && r.Scope === scope && r.Key === key; }, 'UpdatedAt');
  return { ok:true, profileKey:profileKey, scope:scope, key:key, value: row ? site_parseJson_(row.Json, null) : null };
}

function site_preferenceSet_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  var prefId = site_id_('pref');
  site_appendRow_('Preferences', { PreferenceId:prefId, ProfileKey:profileKey, Scope:String(data.scope || 'profile'), Key:String(data.key || 'default'), Json:site_json_(data.value !== undefined ? data.value : data), UpdatedAt:site_isoNow_(), UpdatedBy:session.userId });
  return { ok:true, preferenceId:prefId };
}

function site_preferenceList_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  var scope = data.scope ? String(data.scope) : '';
  var rows = site_getRows_('Preferences').filter(function(r){ return r.ProfileKey === profileKey && (!scope || r.Scope === scope); }).map(function(r){ return { id:r.PreferenceId, scope:r.Scope, key:r.Key, value:site_parseJson_(r.Json, null), updatedAt:r.UpdatedAt }; });
  return { ok:true, preferences:rows };
}

function site_linkAdd_(payload) { return site_addListItem_('ProfileLinks', payload, { idField:'LinkId', idPrefix:'link', requiredUrl:true }); }
function site_musicAdd_(payload) { return site_addListItem_('MusicLinks', payload, { idField:'MusicId', idPrefix:'music', requiredUrl:true }); }
function site_linkList_(payload) { return site_listByProfile_('ProfileLinks', payload, function(r){ return String(r.Active) !== 'false'; }); }
function site_musicList_(payload) { return site_listByProfile_('MusicLinks', payload, function(r){ return String(r.Active) !== 'false'; }); }
function site_linkRemove_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var linkId = String(data.linkId || payload.linkId || '');
  site_updateRows_('ProfileLinks', function(r){ return r.LinkId === linkId && r.ProfileKey === session.profileKey; }, function(r){ r.Active='false'; return r; });
  return { ok:true, linkId:linkId, removed:true };
}

function site_addListItem_(sheetName, payload, options) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  if (profileKey !== session.profileKey) throw new Error('Cannot write another profile.');
  if (options.requiredUrl && !String(data.url || '').trim()) throw new Error('Missing URL.');
  var row = { ProfileKey:profileKey, CreatedAt:site_isoNow_(), UpdatedBy:session.userId, Active:'true' };
  row[options.idField] = site_id_(options.idPrefix);
  Object.keys(data).forEach(function(k){
    var headerName = k.charAt(0).toUpperCase() + k.slice(1);
    if (SITE_HEADERS[sheetName].indexOf(headerName) !== -1) row[headerName] = data[k];
  });
  site_appendRow_(sheetName, row);
  return { ok:true, id:row[options.idField], row:row };
}

function site_listByProfile_(sheetName, payload, filterFn) {
  var session = payload.noAuth ? null : site_requireSession_(payload);
  var profileKey = site_optionalProfile_(payload) || (session ? session.profileKey : '');
  var rows = site_getRows_(sheetName).filter(function(r){ return (!profileKey || r.ProfileKey === profileKey) && (!filterFn || filterFn(r)); });
  return { ok:true, rows: rows.map(rowPublic_) };
}

/*************** app/PWA ***************/
function site_appEvent_(payload) {
  var profileKey = site_optionalProfile_(payload) || site_safeSessionProfile_(payload) || '';
  site_appendRow_('AppEvents', { EventId:site_id_('evt'), ProfileKey:profileKey, Action:String(payload.eventAction || payload.actionName || payload.action || 'app.event'), Json:site_json_(payload.detail || site_data_(payload) || payload), CreatedAt:site_isoNow_(), ClientId:String(payload.clientId || '') });
  return { ok:true };
}

function site_pwaInstallRecord_(payload) {
  var profileKey = site_optionalProfile_(payload) || site_safeSessionProfile_(payload) || '';
  var data = site_data_(payload);
  var id = site_id_('install');
  site_appendRow_('PwaInstalls', { InstallId:id, ProfileKey:profileKey, Platform:String(data.platform || payload.platform || ''), DisplayMode:String(data.displayMode || payload.displayMode || ''), Json:site_json_(data), CreatedAt:site_isoNow_(), ClientId:String(payload.clientId || '') });
  return { ok:true, installId:id };
}

function site_pwaManifestHints_(payload) {
  return { ok:true, manifestHints:{ appName:'OurSpace', shortName:'OurSpace', installable:true, startUrl:'./index.html', display:'standalone', iconsExpected:['icon-192.png','icon-512.png'], note:'The install bubble is browser controlled; backend stores install events and preferences.' } };
}

/*************** messenger ***************/
function site_seedDefaultChannels_() {
  var existing = site_getRows_('MessengerChannels');
  if (existing.some(function(c){ return c.ChannelId === 'tin-can-main'; })) return;
  var now = site_isoNow_();
  [
    ['tin-can-main','Tin Can Main','main'],
    ['care-line','Care Line','care'],
    ['store-line','Store / Rewards','store'],
    ['dbt-line','DBT / Grounding','dbt'],
    ['media-line','Photos / Videos / GIFs','media']
  ].forEach(function(c){ site_appendRow_('MessengerChannels', { ChannelId:c[0], Name:c[1], Kind:c[2], ProfileA:'william', ProfileB:'jasper', Json:'{}', Active:'true', CreatedAt:now, UpdatedAt:now }); });
}

function site_channelUpsert_(payload) {
  var session = null;
  try { session = site_requireSession_(payload); } catch (err) { session = null; }
  var data = site_data_(payload);
  var channelId = site_cleanKey_(data.channelId || data.id || site_id_('channel'));
  var existing = site_getRows_('MessengerChannels').some(function(r){ return r.ChannelId === channelId; });
  var row = { ChannelId:channelId, Name:String(data.name || data.title || 'Shared Channel'), Kind:String(data.kind || 'custom'), ProfileA:String(data.profileA || 'william'), ProfileB:String(data.profileB || 'jasper'), Json:site_json_(data), Active:String(data.active !== false), CreatedAt:site_isoNow_(), UpdatedAt:site_isoNow_() };
  if (existing) site_updateRows_('MessengerChannels', function(r){ return r.ChannelId === channelId; }, function(r){ r.Name=row.Name; r.Kind=row.Kind; r.Json=row.Json; r.Active=row.Active; r.UpdatedAt=row.UpdatedAt; return r; });
  else site_appendRow_('MessengerChannels', row);
  return { ok:true, channelId:channelId };
}

function site_channelList_(payload) {
  site_seedDefaultChannels_();
  var rows = site_getRows_('MessengerChannels').filter(function(r){ return String(r.Active) !== 'false'; }).map(rowPublic_);
  return { ok:true, channels:rows };
}

function site_messageSend_(payload) {
  var session = null;
  try { session = site_requireSession_(payload); } catch (err) { session = null; }
  var data = site_data_(payload);
  var fromProfile = site_normalizeProfile_(data.fromProfile || data.authorId || data.profileKey || (session && session.profileKey) || 'william');
  if (session && fromProfile !== session.profileKey) throw new Error('Cannot send as another profile.');
  var toProfile = site_normalizeProfile_(data.toProfile || data.recipientId || SITE_CONFIG.PROFILES[fromProfile].defaultPartnerProfile);
  var messageId = site_id_('msg');
  var channelId = site_cleanKey_(data.channelId || 'tin-can-main');
  site_appendRow_('MessengerMessages', { MessageId:messageId, ChannelId:channelId, FromProfile:fromProfile, ToProfile:toProfile, Kind:String(data.kind || 'text'), Text:String(data.text || ''), AttachmentIds:site_json_(data.attachmentIds || []), StickerId:String(data.stickerId || ''), GifUrl:String(data.gifUrl || ''), Json:site_json_(data), CreatedAt:site_isoNow_(), DeletedAt:'' });
  return { ok:true, messageId:messageId, channelId:channelId, fromProfile:fromProfile, toProfile:toProfile };
}

function site_messageList_(payload) {
  var session = null;
  try { session = site_requireSession_(payload); } catch (err) { session = { profileKey: site_optionalProfile_(payload) || '' }; }
  var data = site_data_(payload);
  var channelId = site_cleanKey_(data.channelId || 'tin-can-main');
  var since = data.since || payload.since || '';
  var limit = Math.min(Number(data.limit || payload.limit || 100), 500);
  var rows = site_getRows_('MessengerMessages').filter(function(r){
    return r.ChannelId === channelId && !r.DeletedAt && (!since || String(r.CreatedAt) > String(since));
  }).sort(function(a,b){ return String(a.CreatedAt).localeCompare(String(b.CreatedAt)); }).slice(-limit).map(messagePublic_);
  return { ok:true, channelId:channelId, messages:rows, serverTime:site_isoNow_(), profileKey:session.profileKey };
}

function site_messageReact_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var rid = site_id_('react');
  site_appendRow_('MessengerReactions', { ReactionId:rid, MessageId:String(data.messageId || ''), ProfileKey:session.profileKey, Reaction:String(data.reaction || ''), CreatedAt:site_isoNow_() });
  return { ok:true, reactionId:rid };
}

function site_messageDelete_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var mid = String(data.messageId || payload.messageId || '');
  site_updateRows_('MessengerMessages', function(r){ return r.MessageId === mid && r.FromProfile === session.profileKey; }, function(r){ r.DeletedAt = site_isoNow_(); return r; });
  return { ok:true, messageId:mid, deleted:true };
}

function site_messagePublic_(r) {
  return { messageId:r.MessageId, channelId:r.ChannelId, fromProfile:r.FromProfile, toProfile:r.ToProfile, kind:r.Kind, text:r.Text, attachmentIds:site_parseJson_(r.AttachmentIds, []), stickerId:r.StickerId, gifUrl:r.GifUrl, data:site_parseJson_(r.Json, {}), createdAt:r.CreatedAt };
}

/*************** calls / WebRTC signaling ***************/
function site_callCreate_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var callId = site_id_('call');
  var callee = site_normalizeProfile_(data.calleeProfile || SITE_CONFIG.PROFILES[session.profileKey].defaultPartnerProfile);
  site_appendRow_('CallSessions', { CallId:callId, ChannelId:site_cleanKey_(data.channelId || 'tin-can-main'), CallerProfile:session.profileKey, CalleeProfile:callee, Mode:String(data.mode || 'video'), Status:'ringing', Json:site_json_(data), StartedAt:site_isoNow_(), UpdatedAt:site_isoNow_(), EndedAt:'' });
  return { ok:true, callId:callId, status:'ringing', note:'Use call.signal.send for WebRTC offer/answer/ICE. Backend does not stream audio/video.' };
}

function site_callUpdate_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var callId = String(data.callId || payload.callId || '');
  var status = String(data.status || 'active');
  site_updateRows_('CallSessions', function(r){ return r.CallId === callId && (r.CallerProfile === session.profileKey || r.CalleeProfile === session.profileKey); }, function(r){ r.Status=status; r.UpdatedAt=site_isoNow_(); r.Json=site_json_(site_merge_(site_parseJson_(r.Json, {}), data)); return r; });
  return { ok:true, callId:callId, status:status };
}

function site_callEnd_(payload) {
  var data = site_merge_(site_data_(payload), { status:'ended' });
  return site_callUpdate_(site_merge_(payload, { data:data }));
}

function site_callSignalSend_(payload) {
  var session = null;
  try { session = site_requireSession_(payload); } catch (err) { session = { profileKey: site_optionalProfile_(payload) || site_normalizeProfile_(site_data_(payload).fromProfile || site_data_(payload).authorId || 'william') }; }
  var data = site_data_(payload);
  var ttlSeconds = Math.min(Number(data.ttlSeconds || 120), 900);
  var expires = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  var sid = site_id_('sig');
  site_appendRow_('CallSignals', { SignalId:sid, CallId:String(data.callId || ''), ChannelId:site_cleanKey_(data.channelId || 'tin-can-main'), FromProfile:session.profileKey, ToProfile:site_normalizeProfile_(data.toProfile || SITE_CONFIG.PROFILES[session.profileKey].defaultPartnerProfile), SignalType:String(data.signalType || data.type || 'candidate'), Json:site_json_(data.signal || data), CreatedAt:site_isoNow_(), ExpiresAt:expires, ConsumedAt:'' });
  return { ok:true, signalId:sid, expiresAt:expires };
}

function site_callSignalList_(payload) {
  var session = null;
  try { session = site_requireSession_(payload); } catch (err) { session = { profileKey: site_optionalProfile_(payload) || '' }; }
  var data = site_data_(payload);
  var callId = String(data.callId || payload.callId || '');
  var since = String(data.since || payload.since || '');
  var nowMs = Date.now();
  var rows = site_getRows_('CallSignals').filter(function(r){
    return (!callId || r.CallId === callId) && r.ToProfile === session.profileKey && (!since || String(r.CreatedAt) > since) && (!r.ExpiresAt || new Date(r.ExpiresAt).getTime() >= nowMs);
  }).map(function(r){ return { signalId:r.SignalId, callId:r.CallId, channelId:r.ChannelId, fromProfile:r.FromProfile, toProfile:r.ToProfile, signalType:r.SignalType, signal:site_parseJson_(r.Json, {}), createdAt:r.CreatedAt, expiresAt:r.ExpiresAt }; });
  return { ok:true, signals:rows, serverTime:site_isoNow_() };
}

function site_callSignalClear_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var ids = data.signalIds || [];
  site_updateRows_('CallSignals', function(r){ return r.ToProfile === session.profileKey && (ids.length === 0 || ids.indexOf(r.SignalId) !== -1); }, function(r){ r.ConsumedAt=site_isoNow_(); return r; });
  return { ok:true, cleared:ids.length || 'all-visible' };
}

/*************** uploads/media/gifs/stickers/effects/transcripts ***************/
function site_uploadMedia_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var base64 = String(data.base64 || data.dataUrl || '');
  var mimeType = String(data.mimeType || 'application/octet-stream');
  var kind = String(data.kind || 'file');
  var fileName = String(data.fileName || kind + '-' + Date.now());
  if (!base64) throw new Error('Missing base64 or dataUrl.');
  if (base64.indexOf(',') !== -1) base64 = base64.split(',').pop();
  var bytes = Utilities.base64Decode(base64);
  if (bytes.length > SITE_CONFIG.MAX_UPLOAD_BYTES) throw new Error('Upload too large for Apps Script backend. Max bytes: ' + SITE_CONFIG.MAX_UPLOAD_BYTES);
  var blob = Utilities.newBlob(bytes, mimeType, site_safeFileName_(fileName));
  var folder = site_ensureUploadFolder_();
  var file = folder.createFile(blob);
  var id = site_id_('media');
  site_appendRow_('MediaUploads', { MediaId:id, ProfileKey:session.profileKey, Kind:kind, FileName:file.getName(), MimeType:mimeType, SizeBytes:bytes.length, DriveFileId:file.getId(), DriveUrl:file.getUrl(), PublicUrl:file.getUrl(), MetaJson:site_json_(data.meta || {}), CreatedAt:site_isoNow_() });
  return { ok:true, mediaId:id, driveFileId:file.getId(), url:file.getUrl(), sizeBytes:bytes.length, kind:kind };
}

function site_mediaList_(payload) {
  var session = site_requireSession_(payload);
  var data = site_data_(payload);
  var kind = data.kind ? String(data.kind) : '';
  var rows = site_getRows_('MediaUploads').filter(function(r){ return r.ProfileKey === session.profileKey && (!kind || r.Kind === kind); }).slice(-200).map(rowPublic_);
  return { ok:true, media:rows };
}

function site_gifSave_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), gid=site_id_('gif');
  site_appendRow_('GifLibrary', { GifId:gid, ProfileKey:session.profileKey, Label:String(data.label || ''), Url:String(data.url || ''), Tags:site_json_(data.tags || []), Json:site_json_(data), CreatedAt:site_isoNow_() });
  return { ok:true, gifId:gid };
}
function site_gifList_(payload) { return site_listByProfile_('GifLibrary', payload); }

function site_stickerSave_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), sid=site_id_('sticker');
  site_appendRow_('Stickers', { StickerId:sid, ProfileKey:session.profileKey, SourceType:String(data.sourceType || 'custom'), Text:String(data.text || ''), MediaId:String(data.mediaId || ''), Url:String(data.url || ''), Json:site_json_(data), CreatedAt:site_isoNow_() });
  return { ok:true, stickerId:sid };
}

function site_stickerFromText_(payload) {
  var data = site_data_(payload);
  data.sourceType = 'text';
  data.text = String(data.text || '').slice(0, 120);
  data.stickerStyle = data.stickerStyle || { shape:'bubble', source:'frontend-rendered' };
  return site_stickerSave_(site_merge_(payload, { data:data }));
}
function site_stickerList_(payload) { return site_listByProfile_('Stickers', payload); }

function site_effectSave_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), pid=site_cleanKey_(data.presetId || site_id_('preset'));
  site_appendRow_('EffectPresets', { PresetId:pid, ProfileKey:session.profileKey, Kind:String(data.kind || 'camera-filter'), Name:String(data.name || 'Preset'), Json:site_json_(data), Active:String(data.active !== false), CreatedAt:site_isoNow_(), UpdatedAt:site_isoNow_() });
  return { ok:true, presetId:pid, note:'The frontend applies this preset through Web Audio, Canvas, CSS, or WebGL.' };
}
function site_effectList_(payload) { return site_listByProfile_('EffectPresets', payload, function(r){ return String(r.Active) !== 'false'; }); }

function site_voiceMessageSave_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), vid=site_id_('voice');
  site_appendRow_('VoiceMessages', { VoiceId:vid, MessageId:String(data.messageId || ''), ProfileKey:session.profileKey, MediaId:String(data.mediaId || ''), DurationMs:Number(data.durationMs || 0), Transcript:String(data.transcript || ''), Json:site_json_(data), CreatedAt:site_isoNow_() });
  if (data.transcript) site_transcriptSave_(site_merge_(payload, { data:{ sourceKind:'voice', sourceId:vid, transcript:data.transcript, confidence:data.confidence || '', engine:data.engine || 'frontend' } }));
  return { ok:true, voiceId:vid };
}

function site_transcriptSave_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), tid=site_id_('transcript');
  site_appendRow_('Transcripts', { TranscriptId:tid, ProfileKey:session.profileKey, SourceKind:String(data.sourceKind || 'audio'), SourceId:String(data.sourceId || data.mediaId || ''), Transcript:String(data.transcript || ''), Confidence:String(data.confidence || ''), Engine:String(data.engine || 'frontend'), Json:site_json_(data), CreatedAt:site_isoNow_() });
  return { ok:true, transcriptId:tid };
}

function site_transcribeRequest_(payload) {
  return { ok:false, needsFrontendOrExternalSpeechApi:true, message:'Apps Script does not include built-in speech-to-text. Use browser SpeechRecognition/MediaRecorder transcript, or connect a Google Cloud Speech-to-Text endpoint/API key and then save with audio.transcript.save.' };
}

/*************** currency / purchases / store ***************/
function site_currencyLedger_(payload, defaultDirection) {
  var session = site_requireSession_(payload), data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  if (profileKey !== session.profileKey) throw new Error('Cannot modify another profile currency.');
  var direction = String(data.direction || defaultDirection);
  var amount = Number(data.amountCopper || data.totalCopper || data.amount || 0);
  if (!isFinite(amount) || amount <= 0) throw new Error('Amount must be positive copper.');
  var current = site_computeBalance_(profileKey);
  var delta = direction === 'spend' ? -amount : amount;
  if (direction === 'adjust') delta = Number(data.deltaCopper || amount);
  var after = current + delta;
  var id = site_id_('ledger');
  site_appendRow_('CurrencyLedger', { LedgerId:id, ProfileKey:profileKey, Direction:direction, AmountCopper:delta, Reason:String(data.reason || ''), SourceType:String(data.sourceType || ''), SourceId:String(data.sourceId || ''), BalanceAfterCopper:after, Json:site_json_(data), CreatedAt:site_isoNow_(), CreatedBy:session.userId });
  return { ok:true, ledgerId:id, profileKey:profileKey, balanceCopper:after, display:site_formatCopper_(after) };
}

function site_currencyBalance_(payload) {
  var session = site_requireSession_(payload);
  var profileKey = site_normalizeProfile_(site_data_(payload).profileKey || session.profileKey);
  return { ok:true, profileKey:profileKey, balanceCopper:site_computeBalance_(profileKey), display:site_formatCopper_(site_computeBalance_(profileKey)) };
}


function site_passwordResetRequest_(payload) {
  var data = site_data_(payload);
  var identifier = String(data.identifier || data.username || data.email || payload.identifier || '').trim().toLowerCase();
  if (!identifier) throw new Error('Missing identifier.');
  var user = site_getRows_('Users').find(function(u){
    return String(u.Active) === 'true' && (String(u.Username).toLowerCase() === identifier || String(u.Email).toLowerCase() === identifier || String(u.ProfileKey).toLowerCase() === identifier);
  });
  if (!user) return { ok:true, emailed:false };
  var code = String(Math.floor(100000 + Math.random() * 900000));
  var expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  site_appendRow_('GenericRecords', { RecordId:site_id_('reset'), ProfileKey:user.ProfileKey, Bucket:'password_reset', Key:code, Json:site_json_({ userId:user.UserId, identifier:identifier, expiresAt:expiresAt, used:false }), CreatedAt:site_isoNow_(), UpdatedAt:site_isoNow_(), UpdatedBy:'system' });
  if (user.Email) {
    MailApp.sendEmail(user.Email, 'OurSpace password reset code', 'Your OurSpace reset code is: ' + code + '\nThis code expires in 30 minutes.');
  }
  site_audit_(user.ProfileKey, 'auth.passwordReset.request', { identifier:identifier });
  return { ok:true, emailed:!!user.Email };
}

function site_passwordResetComplete_(payload) {
  var data = site_data_(payload);
  var identifier = String(data.identifier || data.username || data.email || payload.identifier || '').trim().toLowerCase();
  var code = String(data.code || payload.code || '').trim();
  var newPassword = String(data.newPassword || data.password || payload.newPassword || '');
  if (!identifier || !code || newPassword.length < SITE_CONFIG.MIN_PASSWORD_LENGTH) throw new Error('Missing reset fields or password is too short.');
  var row = site_latestRow_('GenericRecords', function(r){ return r.Bucket === 'password_reset' && r.Key === code; }, 'CreatedAt');
  if (!row) throw new Error('Reset code not found.');
  var meta = site_parseJson_(row.Json, {});
  if (meta.used) throw new Error('Reset code already used.');
  if (new Date(meta.expiresAt).getTime() < Date.now()) throw new Error('Reset code expired.');
  var user = site_getRows_('Users').find(function(u){ return u.UserId === meta.userId && String(u.Active) === 'true'; });
  if (!user) throw new Error('Account not found.');
  if (identifier && !(String(user.Username).toLowerCase() === identifier || String(user.Email).toLowerCase() === identifier || String(user.ProfileKey).toLowerCase() === identifier)) throw new Error('Reset code does not match that account.');
  var salt = site_randomToken_(18);
  site_updateRows_('Users', function(r){ return r.UserId === user.UserId; }, function(r){ r.PasswordSalt=salt; r.PasswordHash=site_hashPassword_(newPassword, salt); r.UpdatedAt=site_isoNow_(); return r; });
  site_updateRows_('GenericRecords', function(r){ return r.RecordId === row.RecordId; }, function(r){ var m=site_parseJson_(r.Json, {}); m.used=true; m.usedAt=site_isoNow_(); r.Json=site_json_(m); r.UpdatedAt=site_isoNow_(); return r; });
  site_audit_(user.ProfileKey, 'auth.passwordReset.complete', { identifier:identifier });
  return { ok:true, reset:true };
}

function site_purchaseRecordFromSite_(payload) {
  var data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || data.purchaserProfile || data.pageOwner || payload.profileKey || 'william');
  var items = data.items || [];
  var total = Number(data.totalCopper || data.totalCostCopper || items.reduce(function(sum,i){ return sum + Number(i.totalCopper || i.totalCostCopper || i.costCopper || i.unitCostCopper || 0) * Number(i.quantity || 1); }, 0));
  var pid = site_id_('purchase');
  data.profileKey = profileKey;
  data.receiptToProfile = data.receiptToProfile || SITE_CONFIG.PROFILES[profileKey].defaultPartnerProfile;
  data.receiptToEmail = data.receiptToEmail || SITE_CONFIG.PROFILES[profileKey].purchaseNotificationRecipient;
  site_appendRow_('Purchases', { PurchaseId:pid, ProfileKey:profileKey, StoreName:String(data.storeName || data.app || ''), ItemsJson:site_json_(items), TotalCopper:total, Status:String(data.status || 'requested'), Note:String(data.note || ''), Json:site_json_(data), CreatedAt:site_isoNow_(), UpdatedAt:site_isoNow_() });
  site_maybeEmailPurchase_(profileKey, pid, data, total);
  site_audit_(profileKey, 'purchase.record', { purchaseId:pid, totalCopper:total, receiptToProfile:data.receiptToProfile });
  return { ok:true, purchaseId:pid, totalCopper:total, display:site_formatCopper_(total), receiptToProfile:data.receiptToProfile, receiptToEmail:site_maskDestination_(data.receiptToEmail || '') };
}

function site_purchaseCreate_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  if (profileKey !== session.profileKey) throw new Error('Cannot purchase as another profile.');
  var items = data.items || [];
  var total = Number(data.totalCopper || items.reduce(function(sum,i){ return sum + Number(i.totalCopper || i.costCopper || i.unitCostCopper || 0) * Number(i.quantity || 1); }, 0));
  var pid = site_id_('purchase');
  site_appendRow_('Purchases', { PurchaseId:pid, ProfileKey:profileKey, StoreName:String(data.storeName || ''), ItemsJson:site_json_(items), TotalCopper:total, Status:String(data.status || 'requested'), Note:String(data.note || ''), Json:site_json_(data), CreatedAt:site_isoNow_(), UpdatedAt:site_isoNow_() });
  if (data.spendCurrency === true && total > 0) site_currencyLedger_(site_merge_(payload, { data:{ profileKey:profileKey, direction:'spend', amountCopper:total, reason:'Purchase: ' + pid, sourceType:'purchase', sourceId:pid } }), 'spend');
  site_maybeEmailPurchase_(profileKey, pid, data, total);
  return { ok:true, purchaseId:pid, totalCopper:total, display:site_formatCopper_(total) };
}

function site_purchaseList_(payload) { return site_listByProfile_('Purchases', payload); }

function site_storeCatalogSave_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  site_appendRow_('StoreCatalog', { CatalogId:site_id_('catalog'), ProfileKey:profileKey, Json:site_json_(data.catalog || data), UpdatedAt:site_isoNow_(), UpdatedBy:session.userId });
  return { ok:true, profileKey:profileKey };
}
function site_storeCatalogGet_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload);
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  var row = site_latestRow_('StoreCatalog', function(r){ return r.ProfileKey === profileKey; }, 'UpdatedAt');
  return { ok:true, profileKey:profileKey, catalog:row ? site_parseJson_(row.Json, {}) : {} };
}

/*************** calendar/schedule/tasks ***************/
function site_calendarEventUpsert_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), eid=site_cleanKey_(data.eventId || site_id_('event'));
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  site_appendRow_('CalendarEvents', { EventId:eid, ProfileKey:profileKey, Title:String(data.title || ''), StartAt:String(data.startAt || data.start || ''), EndAt:String(data.endAt || data.end || ''), Recurrence:String(data.recurrence || data.respawn || ''), Category:String(data.category || ''), Source:String(data.source || 'ourspace'), Json:site_json_(data), Active:String(data.active !== false), CreatedAt:site_isoNow_(), UpdatedAt:site_isoNow_() });
  return { ok:true, eventId:eid };
}
function site_calendarEventList_(payload) { return site_listByProfile_('CalendarEvents', payload, function(r){ return String(r.Active) !== 'false'; }); }

function site_scheduleItemUpsert_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), sid=site_cleanKey_(data.scheduleId || site_id_('schedule'));
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  site_appendRow_('ScheduleItems', { ScheduleId:sid, ProfileKey:profileKey, Title:String(data.title || data.task || ''), Respawn:String(data.respawn || data.recurrence || ''), DayOfWeek:String(data.dayOfWeek || ''), TimeOfDay:String(data.timeOfDay || data.time || ''), Category:String(data.category || ''), Json:site_json_(data), Active:String(data.active !== false), CreatedAt:site_isoNow_(), UpdatedAt:site_isoNow_() });
  return { ok:true, scheduleId:sid };
}
function site_scheduleItemList_(payload) { return site_listByProfile_('ScheduleItems', payload, function(r){ return String(r.Active) !== 'false'; }); }

function site_taskComplete_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), cid=site_id_('done');
  var profileKey = site_normalizeProfile_(data.profileKey || session.profileKey);
  site_appendRow_('TaskCompletions', { CompletionId:cid, ProfileKey:profileKey, TaskId:String(data.taskId || ''), Title:String(data.title || data.task || ''), RewardCopper:Number(data.rewardCopper || data.totalCopper || 0), CompletedAt:String(data.completedAt || site_isoNow_()), Json:site_json_(data), CreatedBy:session.userId });
  if (Number(data.rewardCopper || data.totalCopper || 0) > 0) site_currencyLedger_(site_merge_(payload, { data:{ profileKey:profileKey, amountCopper:Number(data.rewardCopper || data.totalCopper), reason:'Task complete: ' + (data.title || data.task || data.taskId), sourceType:'task', sourceId:cid } }), 'earn');
  return { ok:true, completionId:cid };
}

/*************** generic records ***************/
function site_recordSave_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), rid=site_cleanKey_(data.recordId || site_id_('rec'));
  site_appendRow_('GenericRecords', { RecordId:rid, ProfileKey:site_normalizeProfile_(data.profileKey || session.profileKey), Bucket:String(data.bucket || 'general'), Key:String(data.key || rid), Json:site_json_(data.value !== undefined ? data.value : data), CreatedAt:site_isoNow_(), UpdatedAt:site_isoNow_(), UpdatedBy:session.userId });
  return { ok:true, recordId:rid };
}
function site_recordList_(payload) {
  var session = site_requireSession_(payload), data = site_data_(payload), bucket=String(data.bucket || '');
  var rows = site_getRows_('GenericRecords').filter(function(r){ return r.ProfileKey === session.profileKey && (!bucket || r.Bucket === bucket); }).map(rowPublic_);
  return { ok:true, records:rows };
}

/*************** storage helpers ***************/
function site_ensureDatabase_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(SITE_CONFIG.DATABASE_PROPERTY_KEY);
  var ss;
  if (id) { try { ss = SpreadsheetApp.openById(id); } catch (err) {} }
  if (!ss) {
    ss = SpreadsheetApp.create('OurSpace Site Backend Database');
    props.setProperty(SITE_CONFIG.DATABASE_PROPERTY_KEY, ss.getId());
  }
  Object.keys(SITE_CONFIG.SHEETS).forEach(function(key){ site_ensureSheet_(SITE_CONFIG.SHEETS[key]); });
  return ss;
}

function site_ensureSheet_(name) {
  var ss = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty(SITE_CONFIG.DATABASE_PROPERTY_KEY));
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  var headers = SITE_HEADERS[name] || ['Id','Json','CreatedAt'];
  if (sh.getLastRow() === 0) sh.appendRow(headers);
  else {
    var current = sh.getRange(1,1,1,Math.max(sh.getLastColumn(), headers.length)).getValues()[0];
    if (String(current[0] || '') !== headers[0]) {
      sh.clear(); sh.appendRow(headers);
    }
  }
  return sh;
}

function site_getRows_(sheetName) {
  var sh = site_ensureSheet_(sheetName);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return [];
  var headers = values[0].map(String);
  return values.slice(1).filter(function(r){ return r.some(function(c){ return c !== ''; }); }).map(function(row){
    var obj = {};
    headers.forEach(function(h,i){ obj[h] = row[i]; });
    return obj;
  });
}

function site_appendRow_(sheetName, obj) {
  var sh = site_ensureSheet_(sheetName);
  var headers = SITE_HEADERS[sheetName] || sh.getRange(1,1,1,sh.getLastColumn()).getValues()[0];
  sh.appendRow(headers.map(function(h){ return obj[h] !== undefined ? obj[h] : ''; }));
}

function site_updateRows_(sheetName, predicate, updater) {
  var sh = site_ensureSheet_(sheetName);
  var values = sh.getDataRange().getValues();
  if (values.length < 2) return 0;
  var headers = values[0].map(String);
  var count = 0;
  for (var i=1; i<values.length; i++) {
    var obj = {};
    headers.forEach(function(h,j){ obj[h]=values[i][j]; });
    if (predicate(obj)) {
      obj = updater(obj) || obj;
      sh.getRange(i+1,1,1,headers.length).setValues([headers.map(function(h){ return obj[h] !== undefined ? obj[h] : ''; })]);
      count++;
    }
  }
  return count;
}

function site_latestRow_(sheetName, predicate, dateField) {
  var rows = site_getRows_(sheetName).filter(predicate);
  rows.sort(function(a,b){ return String(b[dateField] || '').localeCompare(String(a[dateField] || '')); });
  return rows[0] || null;
}

function site_ensureUploadFolder_() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(SITE_CONFIG.DRIVE_FOLDER_PROPERTY_KEY);
  var folder;
  if (id) { try { folder = DriveApp.getFolderById(id); } catch (err) {} }
  if (!folder) {
    folder = DriveApp.createFolder('OurSpace Site Backend Uploads');
    props.setProperty(SITE_CONFIG.DRIVE_FOLDER_PROPERTY_KEY, folder.getId());
  }
  return folder;
}

/*************** utility ***************/
function site_parseRequest_(e) {
  if (!e) return {};
  var p = {};
  if (e.parameter) Object.keys(e.parameter).forEach(function(k){ p[k] = e.parameter[k]; });
  var body = e.postData && e.postData.contents ? e.postData.contents : '';
  if (body) {
    var text = String(body);
    var parsed = null;
    try { parsed = JSON.parse(text); } catch (err) {}
    if (!parsed && p.payload) { try { parsed = JSON.parse(p.payload); } catch (err2) {} }
    if (parsed && typeof parsed === 'object') p = site_merge_(p, parsed);
  } else if (p.payload) {
    try { p = site_merge_(p, JSON.parse(p.payload)); } catch (err3) {}
  }
  if (typeof p.data === 'string') { try { p.data = JSON.parse(p.data); } catch (err4) {} }
  return p;
}

function site_jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function site_fail_(err) { return { ok:false, error:String(err && err.message ? err.message : err) }; }
function site_data_(payload) { return payload && typeof payload.data === 'object' && payload.data !== null ? payload.data : payload; }
function site_json_(obj) { return JSON.stringify(obj === undefined ? null : obj); }
function site_parseJson_(text, fallback) { try { return JSON.parse(String(text || '')); } catch (err) { return fallback; } }
function site_merge_(a,b) { var out={}; Object.keys(a||{}).forEach(function(k){out[k]=a[k];}); Object.keys(b||{}).forEach(function(k){out[k]=b[k];}); return out; }
function site_isoNow_() { return new Date().toISOString(); }
function site_id_(prefix) { return prefix + '_' + Utilities.getUuid().replace(/-/g,'').slice(0,18); }
function site_randomToken_(bytes) { return Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'').slice(0, bytes || 16); }
function site_cleanKey_(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,100) || site_id_('key'); }
function site_safeFileName_(v) { return String(v || 'file').replace(/[\\/:*?"<>|]+/g,'_').slice(0,160); }
function site_normalizeProfile_(v) { var key=String(v || '').toLowerCase().trim(); if (key === 'dino') key='william'; if (key === 'squishy') key='jasper'; if (SITE_CONFIG.ALLOWED_PROFILES.indexOf(key) === -1) throw new Error('Invalid profileKey: ' + v); return key; }
function site_optionalProfile_(payload) { var v=(site_data_(payload).profileKey || payload.profileKey || payload.profile || ''); return v ? site_normalizeProfile_(v) : ''; }
function site_safeSessionProfile_(payload) { try { return site_requireSession_(payload).profileKey; } catch (err) { return ''; } }
function site_rowPublic_(r) { var out={}; Object.keys(r).forEach(function(k){ if (String(k).match(/Hash|Salt|Token/i)) return; out[k.charAt(0).toLowerCase()+k.slice(1)] = r[k]; }); return out; }
function site_hashPassword_(password, salt) { var raw = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(salt) + '::' + String(password)); return Utilities.base64Encode(raw); }
function site_computeBalance_(profileKey) { return site_getRows_('CurrencyLedger').filter(function(r){ return r.ProfileKey === profileKey; }).reduce(function(sum,r){ return sum + Number(r.AmountCopper || 0); }, 0); }
function site_formatCopper_(copper) { var n=Math.round(Number(copper||0)); var sign=n<0?'-':''; n=Math.abs(n); var p=Math.floor(n/1000); n%=1000; var g=Math.floor(n/100); n%=100; var s=Math.floor(n/10); var c=n%10; var parts=[]; if(p)parts.push(p+' platinum'); if(g)parts.push(g+' gold'); if(s)parts.push(s+' silver'); if(c||!parts.length)parts.push(c+' copper'); return sign+parts.join(', '); }
function site_audit_(profileKey, action, detail) { try { site_appendRow_('AuditLog', { AuditId:site_id_('audit'), ProfileKey:profileKey || '', Action:action, Json:site_json_(detail || {}), CreatedAt:site_isoNow_() }); } catch (err) {} }
function site_maskDestination_(value) { var s=String(value||''); return s.replace(/(^.).*(@.*$)/, '$1***$2'); }
function site_maybeEmailPurchase_(profileKey, purchaseId, data, total) {
  try {
    var profile = SITE_CONFIG.PROFILES[profileKey] || {};
    var partnerKey = data.receiptToProfile || profile.defaultPartnerProfile || '';
    var to = data.receiptToEmail || profile.purchaseNotificationRecipient || (SITE_CONFIG.PROFILES[partnerKey] || {}).primaryEmail || '';
    if (!to) return;
    var purchaser = profile.lineName || profile.displayName || profileKey;
    var receiver = (SITE_CONFIG.PROFILES[partnerKey] || {}).lineName || partnerKey || 'partner';
    var items = data.items || [];
    var lines = [];
    lines.push('OurSpace purchase receipt');
    lines.push('Purchase ID: ' + purchaseId);
    lines.push('Purchaser: ' + purchaser + ' (' + profileKey + ')');
    lines.push('Receipt for: ' + receiver + (partnerKey ? ' (' + partnerKey + ')' : ''));
    lines.push('Store: ' + String(data.storeName || data.app || 'OurSpace Store'));
    lines.push('Total: ' + site_formatCopper_(total) + ' / ' + total + ' copper');
    lines.push('');
    lines.push('Items:');
    if (!items.length) lines.push('- No item details supplied.');
    items.forEach(function(item){
      lines.push('- ' + Number(item.quantity || 1) + ' × ' + String(item.name || item.id || 'Item') + ' = ' + Number(item.totalCopper || item.totalCostCopper || 0) + ' copper');
    });
    if (data.note) { lines.push(''); lines.push('Note: ' + String(data.note)); }
    if (data.checkoutText) { lines.push(''); lines.push('Checkout text:'); lines.push(String(data.checkoutText)); }
    MailApp.sendEmail(to, 'OurSpace purchase receipt: ' + purchaser + ' → ' + receiver, lines.join('\n'));
  } catch (err) {}
}



/* ==========================================================================
 * OurSpace private gift/link-share backend (prefixed with link_)
 * ========================================================================== */

/**
 * OurSpace Link Share + Private Gift Backend
 * Google Apps Script / Web App backend
 *
 * What this does:
 * - Keeps the private OurSpace site member-only for exactly two approved people.
 * - Provides one public-facing share page that only shows approved links/items.
 * - Stores private shipping/address information in the backend only.
 * - Never returns address data to public routes, public link pages, public JSON, or buyer emails.
 * - Lets public visitors submit a private gift/purchase request without seeing private site pages.
 *
 * Important privacy note:
 * A Google Apps Script backend cannot force Walmart or another outside retailer to hide an address
 * if a visitor checks out directly on that retailer's website. This backend protects your address
 * by never exposing it publicly. For true direct-to-you shipping without address disclosure, use
 * an official registry/wishlist address-masking feature or have the private OurSpace member fulfill
 * the order from inside the private site.
 *
 * Deploy recommended:
 * 1) Paste this file into Apps Script as Code.gs.
 * 2) Run OURSPACE_CREATE_BACKEND_SPREADSHEET once.
 * 3) Edit passcodes inside OURSPACE_SET_PASSCODES_ONCE, run it once, then erase the passcodes.
 * 4) Deploy > New deployment > Web app.
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5) Use doPost private actions from your OurSpace private site.
 * 6) Share only the URL returned by getPublicShareUrl / action=share&share_id=...
 */

var OURSPACE_BACKEND = Object.freeze({
  appName: 'OurSpace',
  version: '2026-06-25',

  // Only these two people may log into private routes.
  members: [
    { key: 'william', displayName: 'William / Dino', email: 'williamsaville92@gmail.com' },
    { key: 'jasper', displayName: 'Jasper / Squishy', email: 'jasperfaye99@gmail.com' }
  ],

  // Public branding for the shared link page.
  publicShareTitle: 'OurSpace Shared Links',
  publicShareSubtitle: 'Only shared links are visible here. Private OurSpace pages stay locked.',

  // ScriptProperties keys.
  props: {
    dbId: 'OURSPACE_DB_SPREADSHEET_ID',
    shareId: 'OURSPACE_PUBLIC_SHARE_ID',
    passHashPrefix: 'OURSPACE_MEMBER_PASS_SHA256_',
    setupComplete: 'OURSPACE_SETUP_COMPLETE'
  },

  sheets: {
    links: 'PublicLinks',
    requests: 'PurchaseRequests',
    addresses: 'PrivateAddresses',
    audit: 'LinkShareAuditLog'
  },

  sessionHours: 8,
  maxPublicLinks: 500,
  maxRequestsToReturn: 200,

  // Email notifications go to both OurSpace members by default.
  notifyEmails: 'williamsaville92@gmail.com,jasperfaye99@gmail.com'
});

/**
 * FIRST RUN: creates the private spreadsheet database and share id.
 * Run this manually from Apps Script editor before deploying.
 */
function link_OURSPACE_CREATE_BACKEND_SPREADSHEET() {
  // Preserved legacy helper: use the unified OurSpace setup so all three backends share one database.
  return OURSPACE_CREATE_BACKEND_SPREADSHEET();
}

/**
 * SECOND RUN: set private login passcodes.
 * Edit the two placeholder passcodes below, run once, then replace them with placeholders again.
 * The script stores SHA-256 hashes, not plaintext passcodes.
 */
function link_OURSPACE_SET_PASSCODES_ONCE() {
  var WILLIAM_PASSCODE = 'REPLACE_WITH_WILLIAM_PRIVATE_PASSCODE';
  var JASPER_PASSCODE = 'REPLACE_WITH_JASPER_PRIVATE_PASSCODE';

  if (WILLIAM_PASSCODE.indexOf('REPLACE_WITH_') === 0 || JASPER_PASSCODE.indexOf('REPLACE_WITH_') === 0) {
    throw new Error('Edit WILLIAM_PASSCODE and JASPER_PASSCODE first, run once, then erase them again.');
  }

  var props = PropertiesService.getScriptProperties();
  props.setProperty(OURSPACE_BACKEND.props.passHashPrefix + 'william', link_sha256Hex_(WILLIAM_PASSCODE));
  props.setProperty(OURSPACE_BACKEND.props.passHashPrefix + 'jasper', link_sha256Hex_(JASPER_PASSCODE));
  link_writeAudit_('system', 'setPasscodes', { members: ['william', 'jasper'] });
  return { ok: true, message: 'Passcodes stored as SHA-256 hashes. Erase plaintext passcodes from this function now.' };
}

/**
 * Optional: add a starter item so the public page is not empty during testing.
 */
function link_OURSPACE_ADD_DEMO_LINK_OPTIONAL() {
  var item = {
    ownerKey: 'shared',
    title: 'Example wishlist link',
    label: 'Wishlist',
    url: 'https://example.com/',
    imageUrl: '',
    priceNote: '',
    public: true,
    sortOrder: 10,
    notes: 'Replace or delete this from the private OurSpace site.'
  };
  return link_upsertPublicLink_({ key: 'system', displayName: 'System' }, item);
}

/**
 * Public/private Web App GET entry.
 */
function link_doGet(e) {
  try {
    var action = String((e && e.parameter && e.parameter.action) || '').trim();

    if (action === 'health') {
      return link_json_({ ok: true, app: OURSPACE_BACKEND.appName, version: OURSPACE_BACKEND.version });
    }

    if (action === 'publicLinks') {
      var shareIdJson = String((e && e.parameter && (e.parameter.share_id || e.parameter.shareId)) || '');
      return link_json_(link_getPublicLinksResponse_(shareIdJson));
    }

    if (action === 'share') {
      var shareId = String((e && e.parameter && (e.parameter.share_id || e.parameter.shareId)) || '');
      return link_html_(link_renderPublicSharePage_(shareId));
    }

    // There is deliberately no private-page GET route.
    return link_html_(link_renderLockedPage_('This OurSpace backend only exposes the shared links page.'));
  } catch (err) {
    return link_html_(link_renderErrorPage_(err));
  }
}

/**
 * Public/private Web App POST entry.
 * Accepts JSON body or normal HTML form posts.
 */
function link_doPost(e) {
  try {
    var payload = link_parsePayload_(e);
    var action = String(payload.action || '').trim();

    if (action === 'login') return link_json_(link_handleLogin_(payload));
    if (action === 'logout') return link_json_(link_handleLogout_(payload));
    if (action === 'publicPurchaseRequest') return link_handlePublicPurchaseRequest_(payload, e);

    // Everything below is private-member only.
    var member = link_requireMember_(payload);

    if (action === 'whoami') return link_json_({ ok: true, member: link_publicMember_(member), publicShareUrl: link_publicShareUrl_() });
    if (action === 'getPublicShareUrl') return link_json_({ ok: true, publicShareUrl: link_publicShareUrl_(), shareId: link_getOrCreateShareId_() });
    if (action === 'rotateShareId') return link_json_(link_rotateShareId_(member));

    if (action === 'savePrivateAddress') return link_json_(link_savePrivateAddress_(member, payload.address || payload));
    if (action === 'getMyPrivateAddress') return link_json_(link_getPrivateAddress_(member));

    if (action === 'upsertPublicLink') return link_json_(link_upsertPublicLink_(member, payload.link || payload));
    if (action === 'deletePublicLink') return link_json_(link_deletePublicLink_(member, payload.itemId || payload.id));
    if (action === 'listMyLinks') return link_json_(link_listLinksForPrivateMember_(member));

    if (action === 'listPurchaseRequests') return link_json_(link_listPurchaseRequests_(member));
    if (action === 'updatePurchaseRequestStatus') {
      return link_json_(link_updatePurchaseRequestStatus_(member, payload.requestId, payload.status));
    }

    return link_json_({ ok: false, error: 'Unknown action.' });
  } catch (err) {
    var wantsHtml = link_isProbablyFormPost_(e);
    if (wantsHtml) return link_html_(link_renderErrorPage_(err));
    return link_json_({ ok: false, error: link_safeError_(err) });
  }
}

/**
 * Best-effort CORS preflight response for front-end integrations.
 * Apps Script support varies by deployment, so same-origin HTML forms are also supported.
 */
function link_doOptions() {
  return ContentService.createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

/* -------------------------------------------------------------------------- */
/* Private actions                                                             */
/* -------------------------------------------------------------------------- */

function link_handleLogin_(payload) {
  var email = link_normalizeEmail_(payload.email);
  var passcode = String(payload.passcode || payload.password || '');
  var member = link_memberByEmail_(email);
  if (!member) return { ok: false, error: 'Login is restricted to the two OurSpace members.' };

  var expectedHash = PropertiesService.getScriptProperties().getProperty(
    OURSPACE_BACKEND.props.passHashPrefix + member.key
  );
  if (!expectedHash) return { ok: false, error: 'Passcode has not been set for this member yet.' };
  if (link_sha256Hex_(passcode) !== expectedHash) return { ok: false, error: 'Invalid email or passcode.' };

  var token = link_createId_('session') + '.' + link_createId_('token');
  var tokenHash = link_sha256Hex_(token);
  var sessionRecord = {
    key: member.key,
    displayName: member.displayName,
    email: member.email,
    createdAt: new Date().toISOString()
  };

  CacheService.getScriptCache().put(
    'session:' + tokenHash,
    JSON.stringify(sessionRecord),
    OURSPACE_BACKEND.sessionHours * 60 * 60
  );

  link_writeAudit_(member.key, 'login', { email: member.email });

  return {
    ok: true,
    sessionToken: token,
    expiresInHours: OURSPACE_BACKEND.sessionHours,
    member: link_publicMember_(member),
    publicShareUrl: link_publicShareUrl_()
  };
}

function link_handleLogout_(payload) {
  var token = String(payload.sessionToken || payload.session_token || payload.token || '');
  if (token) CacheService.getScriptCache().remove('session:' + link_sha256Hex_(token));
  return { ok: true };
}

function link_savePrivateAddress_(member, addressPayload) {
  var address = link_normalizeAddress_(addressPayload);
  var ss = link_getDb_();
  var sheet = ss.getSheetByName(OURSPACE_BACKEND.sheets.addresses);
  var rows = link_sheetToObjects_(sheet);
  var rowIndex = -1;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].memberKey === member.key) {
      rowIndex = i + 2;
      break;
    }
  }

  var values = [member.key, member.displayName, JSON.stringify(address), new Date().toISOString()];
  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);

  link_writeAudit_(member.key, 'savePrivateAddress', { memberKey: member.key, fields: Object.keys(address) });

  return {
    ok: true,
    message: 'Private address saved. It is available only to logged-in OurSpace members and is never returned by public routes.',
    member: link_publicMember_(member)
  };
}

function link_getPrivateAddress_(member) {
  var ss = link_getDb_();
  var sheet = ss.getSheetByName(OURSPACE_BACKEND.sheets.addresses);
  var rows = link_sheetToObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].memberKey === member.key) {
      return {
        ok: true,
        member: link_publicMember_(member),
        address: link_parseJsonSafe_(rows[i].addressJson, {}),
        updatedAt: rows[i].updatedAt || ''
      };
    }
  }
  return { ok: true, member: link_publicMember_(member), address: null, updatedAt: '' };
}

function link_upsertPublicLink_(member, linkPayload) {
  var link = link_normalizeLink_(linkPayload);
  var ss = link_getDb_();
  var sheet = ss.getSheetByName(OURSPACE_BACKEND.sheets.links);
  var rows = link_sheetToObjects_(sheet);
  var now = new Date().toISOString();
  var id = link.id || link_createId_('item');

  var publicCount = 0;
  for (var c = 0; c < rows.length; c++) {
    if (link_isTruthy_(rows[c].public)) publicCount++;
  }
  if (!link.id && publicCount >= OURSPACE_BACKEND.maxPublicLinks) {
    throw new Error('Public link limit reached. Delete old items before adding more.');
  }

  var rowIndex = -1;
  var createdAt = now;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === id) {
      rowIndex = i + 2;
      createdAt = rows[i].createdAt || now;
      break;
    }
  }

  var values = [
    id,
    link.ownerKey,
    link.title,
    link.label,
    link.url,
    link.imageUrl,
    link.priceNote,
    link.public ? 'TRUE' : 'FALSE',
    link.sortOrder,
    link.notes,
    createdAt,
    now
  ];

  if (rowIndex > -1) sheet.getRange(rowIndex, 1, 1, values.length).setValues([values]);
  else sheet.appendRow(values);

  link_writeAudit_(member.key, 'upsertPublicLink', { id: id, title: link.title, public: link.public });

  return { ok: true, link: link_objectFromHeaders_(link_getHeaders_(sheet), values), publicShareUrl: link_publicShareUrl_() };
}

function link_deletePublicLink_(member, itemId) {
  itemId = String(itemId || '').trim();
  if (!itemId) throw new Error('Missing item id.');
  var ss = link_getDb_();
  var sheet = ss.getSheetByName(OURSPACE_BACKEND.sheets.links);
  var rows = link_sheetToObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === itemId) {
      sheet.deleteRow(i + 2);
      link_writeAudit_(member.key, 'deletePublicLink', { id: itemId });
      return { ok: true, deleted: itemId };
    }
  }
  return { ok: false, error: 'Item was not found.' };
}

function link_listLinksForPrivateMember_(member) {
  var ss = link_getDb_();
  var rows = link_sheetToObjects_(ss.getSheetByName(OURSPACE_BACKEND.sheets.links));
  rows.sort(sortLinks_);
  return { ok: true, member: link_publicMember_(member), links: rows, publicShareUrl: link_publicShareUrl_() };
}

function link_listPurchaseRequests_(member) {
  var ss = link_getDb_();
  var rows = link_sheetToObjects_(ss.getSheetByName(OURSPACE_BACKEND.sheets.requests));
  rows.sort(function(a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
  if (rows.length > OURSPACE_BACKEND.maxRequestsToReturn) rows = rows.slice(0, OURSPACE_BACKEND.maxRequestsToReturn);
  return { ok: true, member: link_publicMember_(member), requests: rows };
}

function link_updatePurchaseRequestStatus_(member, requestId, status) {
  requestId = String(requestId || '').trim();
  status = link_sanitizeString_(status || 'open', 40);
  if (!requestId) throw new Error('Missing request id.');

  var ss = link_getDb_();
  var sheet = ss.getSheetByName(OURSPACE_BACKEND.sheets.requests);
  var rows = link_sheetToObjects_(sheet);
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].requestId === requestId) {
      var headers = link_getHeaders_(sheet);
      var statusCol = headers.indexOf('status') + 1;
      var updatedCol = headers.indexOf('updatedAt') + 1;
      sheet.getRange(i + 2, statusCol).setValue(status);
      sheet.getRange(i + 2, updatedCol).setValue(new Date().toISOString());
      link_writeAudit_(member.key, 'updatePurchaseRequestStatus', { requestId: requestId, status: status });
      return { ok: true, requestId: requestId, status: status };
    }
  }
  return { ok: false, error: 'Request not found.' };
}

function link_rotateShareId_(member) {
  var newShareId = link_createId_('share');
  PropertiesService.getScriptProperties().setProperty(OURSPACE_BACKEND.props.shareId, newShareId);
  link_writeAudit_(member.key, 'rotateShareId', { shareId: newShareId });
  return { ok: true, shareId: newShareId, publicShareUrl: link_publicShareUrl_() };
}

/* -------------------------------------------------------------------------- */
/* Public actions                                                              */
/* -------------------------------------------------------------------------- */

function link_getPublicLinksResponse_(shareId) {
  if (!link_isValidShareId_(shareId)) return { ok: false, error: 'This shared link is invalid or has been rotated.' };
  var rows = link_publicLinks_();
  return {
    ok: true,
    title: OURSPACE_BACKEND.publicShareTitle,
    subtitle: OURSPACE_BACKEND.publicShareSubtitle,
    links: rows.map(publicLink_),
    count: rows.length
  };
}

function link_handlePublicPurchaseRequest_(payload, e) {
  var shareId = String(payload.share_id || payload.shareId || '').trim();
  if (!link_isValidShareId_(shareId)) throw new Error('This shared link is invalid or has been rotated.');

  var itemId = String(payload.item_id || payload.itemId || '').trim();
  if (!itemId) throw new Error('Missing item id.');

  var item = link_findPublicLinkById_(itemId);
  if (!item) throw new Error('That item is no longer shared.');

  var buyerName = link_sanitizeString_(payload.buyer_name || payload.buyerName || 'Anonymous', 120);
  var buyerEmail = link_normalizeEmail_(payload.buyer_email || payload.buyerEmail || '');
  var buyerNote = link_sanitizeString_(payload.buyer_note || payload.buyerNote || '', 1000);
  if (!buyerEmail) throw new Error('Please include an email so OurSpace can follow up.');

  var requestId = link_createId_('request');
  var now = new Date().toISOString();
  var ss = link_getDb_();
  ss.getSheetByName(OURSPACE_BACKEND.sheets.requests).appendRow([
    requestId,
    shareId,
    item.id,
    item.title,
    item.url,
    buyerName,
    buyerEmail,
    buyerNote,
    'open',
    now,
    now
  ]);

  link_writeAudit_('public', 'publicPurchaseRequest', {
    requestId: requestId,
    itemId: item.id,
    itemTitle: item.title,
    buyerEmail: buyerEmail
  });

  link_sendPurchaseRequestEmails_(requestId, item, buyerName, buyerEmail, buyerNote);

  var response = {
    ok: true,
    requestId: requestId,
    message: 'Request sent. The private address was not shown or emailed to you.'
  };

  if (link_isProbablyFormPost_(e)) {
    return link_html_(link_renderThankYouPage_(response, item));
  }
  return link_json_(response);
}

function link_publicLinks_() {
  var ss = link_getDb_();
  var rows = link_sheetToObjects_(ss.getSheetByName(OURSPACE_BACKEND.sheets.links));
  rows = rows.filter(function(row) { return link_isTruthy_(row.public) && link_safeUrl_(row.url); });
  rows.sort(sortLinks_);
  return rows;
}

function link_findPublicLinkById_(itemId) {
  var rows = link_publicLinks_();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].id === itemId) return rows[i];
  }
  return null;
}

function link_publicLink_(row) {
  return {
    id: row.id,
    ownerKey: row.ownerKey,
    title: row.title,
    label: row.label,
    url: row.url,
    imageUrl: row.imageUrl,
    priceNote: row.priceNote,
    notes: row.notes
  };
}

function link_sendPurchaseRequestEmails_(requestId, item, buyerName, buyerEmail, buyerNote) {
  var subject = 'OurSpace gift request: ' + item.title;
  var body = [
    'A public OurSpace visitor sent a gift/purchase request.',
    '',
    'Request ID: ' + requestId,
    'Item: ' + item.title,
    'Link: ' + item.url,
    'Buyer name: ' + buyerName,
    'Buyer email: ' + buyerEmail,
    'Note: ' + (buyerNote || '(none)'),
    '',
    'Privacy: the saved private address was not included in this email and was not shown publicly.',
    'Open the private OurSpace site and use the logged-in backend route if you need to view saved private fulfillment details.'
  ].join('\n');

  MailApp.sendEmail({
    to: OURSPACE_BACKEND.notifyEmails,
    subject: subject,
    body: body,
    noReply: true
  });

  // Buyer receipt. No address, no private site details.
  MailApp.sendEmail({
    to: buyerEmail,
    subject: 'OurSpace request received: ' + item.title,
    body: [
      'Your OurSpace gift/purchase request was received.',
      '',
      'Request ID: ' + requestId,
      'Item: ' + item.title,
      '',
      'The private shipping/address details were not shared by this system.'
    ].join('\n'),
    noReply: true
  });
}

/* -------------------------------------------------------------------------- */
/* Rendered public pages                                                       */
/* -------------------------------------------------------------------------- */

function link_renderPublicSharePage_(shareId) {
  if (!link_isValidShareId_(shareId)) return link_renderLockedPage_('This shared link is invalid or has been rotated.');

  var links = link_publicLinks_();
  var formAction = ScriptApp.getService().getUrl();
  var cards = links.map(function(item) {
    var image = link_safeUrl_(item.imageUrl)
      ? '<img class="item-img" src="' + link_escAttr_(item.imageUrl) + '" alt="" loading="lazy">'
      : '<div class="item-img placeholder">♡</div>';

    var price = item.priceNote ? '<p class="price">' + link_esc_(item.priceNote) + '</p>' : '';
    var label = item.label ? '<span class="label">' + link_esc_(item.label) + '</span>' : '';
    var notes = item.notes ? '<p class="notes">' + link_esc_(item.notes) + '</p>' : '';

    return [
      '<article class="card">',
      image,
      '<div class="card-body">',
      label,
      '<h2>' + link_esc_(item.title) + '</h2>',
      price,
      notes,
      '<div class="actions">',
      '<a class="open-link" href="' + link_escAttr_(item.url) + '" target="_blank" rel="noopener noreferrer">Open item link</a>',
      '</div>',
      '<details class="request-box">',
      '<summary>Buy / gift privately</summary>',
      '<form method="post" action="' + link_escAttr_(formAction) + '" target="_blank">',
      '<input type="hidden" name="action" value="publicPurchaseRequest">',
      '<input type="hidden" name="share_id" value="' + link_escAttr_(shareId) + '">',
      '<input type="hidden" name="item_id" value="' + link_escAttr_(item.id) + '">',
      '<label>Your name<input name="buyer_name" autocomplete="name" required></label>',
      '<label>Your email<input name="buyer_email" type="email" autocomplete="email" required></label>',
      '<label>Note<textarea name="buyer_note" rows="3" placeholder="Optional"></textarea></label>',
      '<button type="submit">Send private request</button>',
      '</form>',
      '<p class="tiny">This sends a request to OurSpace members. It does not reveal any private address.</p>',
      '</details>',
      '</div>',
      '</article>'
    ].join('');
  }).join('\n');

  if (!cards) {
    cards = '<div class="empty">No links are public right now.</div>';
  }

  return link_baseHtml_(
    link_esc_(OURSPACE_BACKEND.publicShareTitle),
    [
      '<main class="shell">',
      '<header class="hero">',
      '<div class="badge">OurSpace</div>',
      '<h1>' + link_esc_(OURSPACE_BACKEND.publicShareTitle) + '</h1>',
      '<p>' + link_esc_(OURSPACE_BACKEND.publicShareSubtitle) + '</p>',
      '</header>',
      '<section class="grid">' + cards + '</section>',
      '<footer>Private pages, profiles, schedules, stores, addresses, and member tools are not available from this shared link.</footer>',
      '</main>'
    ].join('\n')
  );
}

function link_renderLockedPage_(message) {
  return link_baseHtml_('OurSpace Locked', [
    '<main class="shell locked">',
    '<div class="badge">OurSpace</div>',
    '<h1>Private site locked</h1>',
    '<p>' + link_esc_(message || 'This route is not public.') + '</p>',
    '</main>'
  ].join('\n'));
}

function link_renderThankYouPage_(response, item) {
  return link_baseHtml_('Request sent', [
    '<main class="shell locked">',
    '<div class="badge">OurSpace</div>',
    '<h1>Request sent</h1>',
    '<p>Your request for <strong>' + link_esc_(item.title) + '</strong> was sent.</p>',
    '<p class="tiny">Request ID: ' + link_esc_(response.requestId) + '</p>',
    '<p>No private address was shown or emailed to you.</p>',
    '</main>'
  ].join('\n'));
}

function link_renderErrorPage_(err) {
  return link_baseHtml_('OurSpace Error', [
    '<main class="shell locked">',
    '<div class="badge">OurSpace</div>',
    '<h1>Something went wrong</h1>',
    '<p>' + link_esc_(link_safeError_(err)) + '</p>',
    '</main>'
  ].join('\n'));
}

function link_baseHtml_(title, body) {
  return '<!doctype html><html><head><meta charset="utf-8">'
    + '<meta name="viewport" content="width=device-width,initial-scale=1">'
    + '<title>' + link_esc_(title) + '</title>'
    + '<style>'
    + ':root{--cyan:#00ffff;--orange:#CA6309;--bg:#090b12;--card:#141829;--ink:#f7fbff;--muted:#b9c2cf;--line:rgba(255,255,255,.16)}'
    + '*{box-sizing:border-box}body{margin:0;min-height:100vh;font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:radial-gradient(circle at top left,rgba(0,255,255,.18),transparent 35%),radial-gradient(circle at bottom right,rgba(202,99,9,.22),transparent 40%),var(--bg);color:var(--ink)}'
    + 'a{color:inherit}.shell{width:min(1050px,94vw);margin:0 auto;padding:38px 0 28px}.hero{padding:26px;border:1px solid var(--line);border-radius:28px;background:rgba(20,24,41,.82);box-shadow:0 20px 70px rgba(0,0,0,.35)}'
    + '.badge{display:inline-flex;gap:8px;align-items:center;border:1px solid rgba(0,255,255,.55);color:var(--cyan);border-radius:999px;padding:6px 12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;font-size:12px;background:rgba(0,255,255,.08)}'
    + 'h1{font-size:clamp(32px,7vw,62px);margin:14px 0 8px;line-height:1}p{color:var(--muted);line-height:1.55}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px;margin-top:20px}.card{overflow:hidden;border-radius:24px;border:1px solid var(--line);background:rgba(20,24,41,.88);box-shadow:0 16px 45px rgba(0,0,0,.28)}'
    + '.item-img{width:100%;height:175px;object-fit:cover;background:#0d1020;display:grid;place-items:center;font-size:54px;color:var(--cyan)}.card-body{padding:18px}.label{display:inline-block;border:1px solid rgba(202,99,9,.65);color:#ffd7b4;border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700}.card h2{margin:10px 0 6px;font-size:22px}.price{font-weight:800;color:var(--cyan)}.notes{white-space:pre-wrap}.actions{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.open-link,button{border:0;border-radius:14px;padding:11px 14px;font-weight:900;cursor:pointer;text-decoration:none;background:linear-gradient(135deg,var(--cyan),#ffffff);color:#061014}.request-box{border-top:1px solid var(--line);padding-top:12px;margin-top:8px}.request-box summary{cursor:pointer;font-weight:800;color:#ffd7b4}label{display:grid;gap:6px;margin:10px 0;color:var(--muted);font-weight:700}input,textarea{width:100%;border:1px solid var(--line);border-radius:12px;padding:11px;background:#0d1020;color:var(--ink)}.tiny{font-size:12px}.empty,.locked{padding:26px;border:1px solid var(--line);border-radius:24px;background:rgba(20,24,41,.82)}footer{text-align:center;color:var(--muted);font-size:13px;margin:26px 0}'
    + '</style></head><body>' + body + '</body></html>';
}

/* -------------------------------------------------------------------------- */
/* Database helpers                                                            */
/* -------------------------------------------------------------------------- */

function link_getDb_() {
  return ourspace_ensureUnifiedDatabaseAndLinkSheets_();
}

function link_setupSheet_(ss, name, headers) {
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clear();
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, headers.length);
  return sheet;
}

function link_getHeaders_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) { return String(h || '').trim(); });
}

function link_sheetToObjects_(sheet) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2 || lastCol < 1) return [];
  var headers = link_getHeaders_(sheet);
  var values = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  return values.map(function(row) { return link_objectFromHeaders_(headers, row); });
}

function link_objectFromHeaders_(headers, row) {
  var obj = {};
  for (var i = 0; i < headers.length; i++) obj[headers[i]] = row[i];
  return obj;
}

function link_writeAudit_(actorKey, action, detail) {
  try {
    var ss = link_getDb_();
    var sheet = ss.getSheetByName(OURSPACE_BACKEND.sheets.audit);
    if (!sheet) return;
    sheet.appendRow([new Date().toISOString(), actorKey || '', action || '', JSON.stringify(detail || {})]);
  } catch (err) {
    // Auditing must never break user actions.
  }
}

/* -------------------------------------------------------------------------- */
/* Auth helpers                                                                */
/* -------------------------------------------------------------------------- */

function link_requireMember_(payload) {
  var token = String(payload.sessionToken || payload.session_token || payload.token || '').trim();
  if (!token) throw new Error('Missing private OurSpace session token.');
  var tokenHash = link_sha256Hex_(token);
  var cached = CacheService.getScriptCache().get('session:' + tokenHash);
  if (!cached) throw new Error('Your private OurSpace session expired. Please log in again.');
  var record = link_parseJsonSafe_(cached, null);
  if (!record || !link_memberByKey_(record.key)) throw new Error('Invalid private OurSpace session.');
  return link_memberByKey_(record.key);
}

function link_memberByEmail_(email) {
  email = link_normalizeEmail_(email);
  for (var i = 0; i < OURSPACE_BACKEND.members.length; i++) {
    if (link_normalizeEmail_(OURSPACE_BACKEND.members[i].email) === email) return OURSPACE_BACKEND.members[i];
  }
  return null;
}

function link_memberByKey_(key) {
  key = String(key || '').toLowerCase();
  for (var i = 0; i < OURSPACE_BACKEND.members.length; i++) {
    if (OURSPACE_BACKEND.members[i].key === key) return OURSPACE_BACKEND.members[i];
  }
  return null;
}

function link_publicMember_(member) {
  return { key: member.key, displayName: member.displayName, email: member.email };
}

/* -------------------------------------------------------------------------- */
/* Validation / normalization                                                  */
/* -------------------------------------------------------------------------- */

function link_normalizeLink_(payload) {
  payload = payload || {};
  var url = link_safeUrl_(payload.url || payload.href || payload.link);
  if (!url) throw new Error('A valid http/https URL is required.');
  var ownerKey = link_sanitizeOwnerKey_(payload.ownerKey || payload.owner || 'shared');
  var title = link_sanitizeString_(payload.title || payload.name || 'Untitled link', 160);
  if (!title) throw new Error('A title is required.');
  return {
    id: link_sanitizeId_(payload.id || payload.itemId || ''),
    ownerKey: ownerKey,
    title: title,
    label: link_sanitizeString_(payload.label || payload.category || 'Links', 80),
    url: url,
    imageUrl: link_safeUrl_(payload.imageUrl || payload.image || ''),
    priceNote: link_sanitizeString_(payload.priceNote || payload.price || '', 80),
    public: payload.public === undefined ? true : link_isTruthy_(payload.public),
    sortOrder: Number(payload.sortOrder || payload.order || 1000) || 1000,
    notes: link_sanitizeString_(payload.notes || payload.description || '', 1000)
  };
}

function link_normalizeAddress_(payload) {
  payload = payload || {};
  var address = {
    recipientName: link_sanitizeString_(payload.recipientName || payload.name || '', 120),
    line1: link_sanitizeString_(payload.line1 || payload.address1 || '', 180),
    line2: link_sanitizeString_(payload.line2 || payload.address2 || '', 180),
    city: link_sanitizeString_(payload.city || '', 100),
    state: link_sanitizeString_(payload.state || payload.region || '', 80),
    postalCode: link_sanitizeString_(payload.postalCode || payload.zip || payload.zipCode || '', 40),
    country: link_sanitizeString_(payload.country || 'US', 80),
    deliveryNotes: link_sanitizeString_(payload.deliveryNotes || payload.notes || '', 800)
  };

  if (!address.recipientName || !address.line1 || !address.city || !address.state || !address.postalCode) {
    throw new Error('Address needs recipientName, line1, city, state, and postalCode.');
  }
  return address;
}

function link_sanitizeOwnerKey_(value) {
  value = String(value || 'shared').toLowerCase().trim();
  if (value === 'william' || value === 'dino') return 'william';
  if (value === 'jasper' || value === 'squishy') return 'jasper';
  return 'shared';
}

function link_sanitizeId_(value) {
  value = String(value || '').trim();
  value = value.replace(/[^a-zA-Z0-9_-]/g, '');
  return value.slice(0, 80);
}

function link_sanitizeString_(value, maxLen) {
  value = String(value === undefined || value === null ? '' : value);
  value = value.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();
  if (maxLen && value.length > maxLen) value = value.slice(0, maxLen);
  return value;
}

function link_normalizeEmail_(email) {
  return String(email || '').trim().toLowerCase();
}

function link_safeUrl_(url) {
  url = String(url || '').trim();
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) return '';
  return url.slice(0, 2000);
}

function link_isTruthy_(value) {
  if (value === true) return true;
  var s = String(value || '').toLowerCase().trim();
  return s === 'true' || s === '1' || s === 'yes' || s === 'y';
}

function link_sortLinks_(a, b) {
  var ao = Number(a.sortOrder || 1000) || 1000;
  var bo = Number(b.sortOrder || 1000) || 1000;
  if (ao !== bo) return ao - bo;
  return String(a.title || '').localeCompare(String(b.title || ''));
}

/* -------------------------------------------------------------------------- */
/* Share URL helpers                                                           */
/* -------------------------------------------------------------------------- */

function link_getOrCreateShareId_() {
  var props = PropertiesService.getScriptProperties();
  var shareId = props.getProperty(OURSPACE_BACKEND.props.shareId);
  if (!shareId) {
    shareId = link_createId_('share');
    props.setProperty(OURSPACE_BACKEND.props.shareId, shareId);
  }
  return shareId;
}

function link_isValidShareId_(shareId) {
  return String(shareId || '') === String(link_getOrCreateShareId_());
}

function link_publicShareUrl_() {
  return ScriptApp.getService().getUrl() + '?action=share&share_id=' + encodeURIComponent(link_getOrCreateShareId_());
}

/* -------------------------------------------------------------------------- */
/* Payload / output helpers                                                    */
/* -------------------------------------------------------------------------- */

function link_parsePayload_(e) {
  var payload = {};
  if (e && e.postData && e.postData.contents) {
    var raw = String(e.postData.contents || '');
    var type = String(e.postData.type || '');
    if (/json/i.test(type) || /^\s*[\{\[]/.test(raw)) {
      payload = link_parseJsonSafe_(raw, {});
    }
  }

  if ((!payload || Object.keys(payload).length === 0) && e && e.parameter) {
    Object.keys(e.parameter).forEach(function(k) { payload[k] = e.parameter[k]; });
  }

  if (payload.payload) {
    var nested = link_parseJsonSafe_(payload.payload, null);
    if (nested) payload = nested;
  }

  if (payload.address_json && !payload.address) payload.address = link_parseJsonSafe_(payload.address_json, {});
  if (payload.link_json && !payload.link) payload.link = link_parseJsonSafe_(payload.link_json, {});

  return payload || {};
}

function link_isProbablyFormPost_(e) {
  var type = String((e && e.postData && e.postData.type) || '');
  return type.indexOf('application/x-www-form-urlencoded') > -1 || type.indexOf('multipart/form-data') > -1;
}

function link_json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj, null, 2))
    .setMimeType(ContentService.MimeType.JSON);
}

function link_html_(markup) {
  return HtmlService.createHtmlOutput(markup)
    .setTitle(OURSPACE_BACKEND.appName)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function link_parseJsonSafe_(text, fallback) {
  try { return JSON.parse(String(text || '')); }
  catch (err) { return fallback; }
}

function link_safeError_(err) {
  return link_sanitizeString_((err && err.message) ? err.message : String(err || 'Unknown error'), 500);
}

/* -------------------------------------------------------------------------- */
/* Crypto / escaping helpers                                                   */
/* -------------------------------------------------------------------------- */

function link_createId_(prefix) {
  return String(prefix || 'id') + '_' + Utilities.getUuid().replace(/-/g, '') + '_' + Date.now().toString(36);
}

function link_sha256Hex_(text) {
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text || ''),
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    var v = (b < 0 ? b + 256 : b).toString(16);
    return v.length === 1 ? '0' + v : v;
  }).join('');
}

function link_esc_(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function link_escAttr_(value) {
  return link_esc_(value).replace(/`/g, '&#96;');
}

/* -------------------------------------------------------------------------- */
/* Private OurSpace front-end snippets                                         */
/* -------------------------------------------------------------------------- */

/**
 * Private site login example:
 *
 * fetch(SCRIPT_URL, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'text/plain;charset=utf-8' },
 *   body: JSON.stringify({
 *     action: 'login',
 *     email: emailInput.value,
 *     passcode: passcodeInput.value
 *   })
 * }).then(r => r.json()).then(data => {
 *   if (data.ok) localStorage.setItem('ourspace_session_token', data.sessionToken);
 * });
 *
 * Add/update a public link from private OurSpace:
 *
 * fetch(SCRIPT_URL, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'text/plain;charset=utf-8' },
 *   body: JSON.stringify({
 *     action: 'upsertPublicLink',
 *     sessionToken: localStorage.getItem('ourspace_session_token'),
 *     link: {
 *       ownerKey: 'william',
 *       title: 'Example Walmart item',
 *       label: 'Dino wishlist',
 *       url: 'https://www.walmart.com/',
 *       imageUrl: '',
 *       priceNote: '$',
 *       public: true,
 *       sortOrder: 10,
 *       notes: 'Visible on public share page.'
 *     }
 *   })
 * }).then(r => r.json()).then(console.log);
 *
 * Save private address from private OurSpace only:
 *
 * fetch(SCRIPT_URL, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'text/plain;charset=utf-8' },
 *   body: JSON.stringify({
 *     action: 'savePrivateAddress',
 *     sessionToken: localStorage.getItem('ourspace_session_token'),
 *     address: {
 *       recipientName: 'Private recipient name',
 *       line1: 'Private address line 1',
 *       line2: '',
 *       city: 'Private city',
 *       state: 'Private state',
 *       postalCode: 'Private zip',
 *       country: 'US',
 *       deliveryNotes: 'Private notes only members can retrieve.'
 *     }
 *   })
 * }).then(r => r.json()).then(console.log);
 */


/* ==========================================================================
 * OurSpace legacy social-app compatibility backend (prefixed with social_)
 * ========================================================================== */

/**
 * OurSpace Shared Google Apps Script Backend
 * --------------------------------------------------
 * Copy this entire file into a new Google Apps Script project, run social_setup(), then deploy as a Web app.
 * Deploy settings recommended for a private friend/family network:
 *   Execute as: Me
 *   Who has access: Anyone with the link
 *
 * The browser site supplies its own projectId, so this one Apps Script deployment can be reused by
 * multiple separate projects/sites. The backend stores each project separately in the same spreadsheet.
 *
 * Current deployed web app URL embedded in the frontend:
 * https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec
 * Deployment ID:
 * AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g
 *
 * Important architecture note:
 * - Google Apps Script can store messages/files/events, authenticate sessions, enforce the two-account member cap, while allowing unlimited device sessions,
 *   and act as a WebRTC signaling mailbox.
 * - Google Apps Script cannot be a WebSocket/SSE/TURN/SFU media server. Camera, filters, audio/video calls,
 *   screen sharing, and screen/audio recording happen in the browser through WebRTC/MediaRecorder/getUserMedia.
 * - This replacement adds backend storage and mailbox/signaling support for those browser features:
 *   Google/cloud identity verification, invite/reset email delivery, call rooms, call signaling,
 *   uploaded voice/video/camera media, transcript records, face descriptor/filter metadata, and generic
 *   multi-user cloud records.
 */

const OURSPACE_SOCIAL_COMPAT = {
  VERSION: 'OurSpace-compat-2.1.0-clean-unlimited-devices',
  DINO_EMAIL: 'williamsaville92@gmail.com',
  RESET_CODE_MINUTES: 30,
  MIN_PASSWORD_LENGTH: 4,
  MAX_REGISTERED_USERS_PER_PROJECT: 2,
  MAX_ACTIVE_USERS_PER_PROJECT: 999999,
  DEVICE_SESSION_POLICY: 'unlimited-devices-per-account',
  ACTIVE_WINDOW_MS: 2 * 60 * 1000,
  SESSION_TTL_MS: 12 * 60 * 60 * 1000,
  STORY_MAX_TTL_MS: 7 * 24 * 60 * 60 * 1000,
  STORY_DEFAULT_TTL_MS: 24 * 60 * 60 * 1000,
  MAX_TEXT: 4000,
  MAX_MEDIA_CHARS_IN_SHEET: 40000,
  PUBLIC_DRIVE_FILE_LINKS: true,
  SPREADSHEET_PROPERTY: 'OURSPACE_COMPAT_SPREADSHEET_ID',
  FILE_FOLDER_PROPERTY: 'OURSPACE_COMPAT_UPLOAD_FOLDER_ID',
  GOOGLE_CLIENT_ID_PROPERTY: 'OURSPACE_COMPAT_GOOGLE_CLIENT_ID',
  SPEECH_TO_TEXT_WEBHOOK_PROPERTY: 'OURSPACE_COMPAT_SPEECH_TO_TEXT_WEBHOOK_URL',
  SPEECH_TO_TEXT_API_KEY_PROPERTY: 'OURSPACE_COMPAT_SPEECH_TO_TEXT_API_KEY',
  TURN_CONFIG_JSON_PROPERTY: 'OURSPACE_COMPAT_TURN_CONFIG_JSON',
  MEDIA_MAX_INLINE_CHARS: 40000,
  CALL_EVENT_TTL_MS: 60 * 60 * 1000,
  FACE_MATCH_THRESHOLD: 0.55,
  SHEETS: {
    USERS: ['projectId','userId','username','displayName','salt','passHash','role','avatar','status','createdAt','updatedAt','disabled','email','phone','backupEmailsJson','mustChangePassword','tempCodeSalt','tempCodeHash','tempCodeExpiresAt','resetTokenSalt','resetTokenHash','resetRequestedAt','resetDelivery','resetRequestedBy','lastPasswordChangedAt','lastTemporaryLoginAt'],
    SESSIONS: ['token','projectId','userId','displayName','createdAt','lastSeen','userAgent'],
    PROFILES: ['projectId','id','name','color','status','updatedAt'],
    FEED: ['projectId','id','author','text','media','mediaType','createdAt','reactionsJson','commentsJson'],
    CHANNELS: ['projectId','name','createdAt'],
    MESSAGES: ['projectId','channel','id','author','text','media','mediaType','origin','createdAt','reactionsJson'],
    STORIES: ['projectId','id','author','text','media','mediaType','createdAt','expiresAt','reactionsJson'],
    MESSENGER: ['projectId','id','type','clientId','createdAt','payloadJson','appName'],
    ROOMS: ['projectId','room','passHash','createdAt','updatedAt','participantsJson'],
    SIGNALS: ['projectId','room','id','fromPeer','toPeer','type','payloadJson','createdAt','deliveredJson'],
    EVENTS: ['projectId','id','title','start','end','location','description','createdBy','createdAt','updatedAt','calendarEventId'],
    FILES: ['projectId','id','name','mimeType','size','url','driveFileId','createdBy','createdAt'],
    SETTINGS: ['projectId','projectName','updatedAt','settingsJson'],
    AUDIT: ['at','projectId','action','userId','detailsJson'],
    RESET_REQUESTS: ['projectId','id','accountId','identifier','delivery','target','resetLink','expiresAt','requestedAt','requestedBy','sentToDino','status','detailsJson'],
    AUTH_PROVIDERS: ['projectId','userId','provider','providerUserId','email','displayName','photoUrl','createdAt','updatedAt','lastSignInAt','rawJson'],
    APP_RECORDS: ['projectId','collection','id','owner','createdAt','updatedAt','jsonData'],
    CALLS: ['projectId','callId','room','kind','createdBy','createdAt','updatedAt','status','participantsJson','settingsJson'],
    CALL_EVENTS: ['projectId','callId','room','id','fromPeer','toPeer','type','payloadJson','createdAt'],
    MEDIA_ASSETS: ['projectId','id','kind','owner','room','messageId','name','mimeType','size','url','driveFileId','durationMs','thumbnailUrl','transcript','faceMetaJson','createdAt','updatedAt'],
    VOICE_MESSAGES: ['projectId','id','conversationId','author','mediaId','durationMs','waveformJson','transcript','status','createdAt'],
    VIDEOS: ['projectId','id','author','mediaId','kind','thumbnailUrl','durationMs','transcript','status','createdAt'],
    TRANSCRIPTS: ['projectId','id','mediaId','sourceKind','language','transcript','status','provider','createdBy','createdAt','updatedAt','providerJson'],
    FACE_PROFILES: ['projectId','userId','profileId','label','descriptorJson','modelsVersion','consent','createdAt','updatedAt'],
    FILTER_PRESETS: ['projectId','id','createdBy','name','kind','configJson','thumbnailUrl','createdAt','updatedAt']
  }
};

function social_setup() {
  const ss = social_getSpreadsheet_();
  Object.keys(OURSPACE_SOCIAL_COMPAT.SHEETS).forEach(function(name){ social_getSheet_(name); });
  social_getUploadFolder_();
  return { ok: true, message: 'OurSpace backend ready.', spreadsheetUrl: ss.getUrl(), version: OURSPACE_SOCIAL_COMPAT.VERSION };
}

function social_doGet(e) {
  return social_handleRequest_(e, 'GET');
}

function social_doPost(e) {
  return social_handleRequest_(e, 'POST');
}

function social_handleRequest_(e, method) {
  try {
    social_setup();
    const req = social_normalizeRequest_(e, method);
    const result = social_route_(req);
    return social_output_(result, req.callback);
  } catch (err) {
    return social_output_({ ok: false, error: String(err && err.message ? err.message : err), version: OURSPACE_SOCIAL_COMPAT.VERSION }, (e && e.parameter && e.parameter.callback) || '');
  }
}

function social_normalizeRequest_(e, method) {
  const p = (e && e.parameter) || {};
  let body = {};
  if (method === 'POST' && e && e.postData && e.postData.contents) {
    try { body = JSON.parse(e.postData.contents); }
    catch (_err) { body = {}; }
  }
  const payload = body.payload || body || {};
  return {
    method: method,
    action: String(body.action || p.action || payload.action || 'state'),
    projectId: social_cleanSlug_(body.projectId || p.projectId || payload.projectId || 'default-project'),
    projectName: social_cleanText_(body.projectName || p.projectName || payload.projectName || 'OurSpace Project', 160),
    sessionToken: String(body.sessionToken || p.sessionToken || payload.sessionToken || ''),
    callback: String(p.callback || ''),
    payload: social_mergeObjects_(payload, p)
  };
}

function social_route_(req) {
  const action = req.action;
  if (action === 'ping') return { ok: true, version: OURSPACE_SOCIAL_COMPAT.VERSION, now: new Date().toISOString() };
  if (action === 'setup') return social_setup();
  if (action === 'manifest') return social_manifest_(req);
  if (action === 'iceConfig' || action === 'ice_config') return social_iceConfig_(req);

  // Cloud identity and emailed temporary-login support.
  if (action === 'cloud_auth_sign_in' || action === 'google_auth_sign_in') return social_cloudAuthSignIn_(req);
  if (action === 'link_cloud_provider') return social_linkCloudProvider_(req);
  if (action === 'send_invite_email' || action === 'deliver_temporary_password' || action === 'email_temporary_password') return social_sendInviteOrTemporaryPassword_(req);

  // Backend-ready login and recovery actions used by OurSpace_backend_ready_login.html.
  if (action === 'create_account') return social_createAccount_(req);
  if (action === 'sign_in') return social_signInAccount_(req);
  if (action === 'request_password_reset') return social_requestPasswordReset_(req);
  if (action === 'tell_dino_cant_login') return social_tellDinoCantLogin_(req);
  if (action === 'update_password') return social_updatePassword_(req);

  // Backward-compatible aliases from the larger OurSpace backend.
  if (action === 'login') return social_login_(req);
  if (action === 'register') return social_register_(req);
  if (action === 'logout') return social_logout_(req);

  const session = social_requireSession_(req, action === 'state' || action === 'onlineUsers' || action === 'messengerHistory');
  if (action === 'state') return { ok: true, state: social_publicState_(req.projectId) };
  if (action === 'onlineUsers') return { ok: true, onlineUsers: social_onlineUsers_(req.projectId) };
  if (action === 'heartbeat' || action === 'presence') return social_heartbeat_(req, session);
  if (action === 'profile') return social_saveProfile_(req, session);
  if (action === 'post') return social_savePost_(req, session);
  if (action === 'comment') return social_saveComment_(req, session);
  if (action === 'reaction') return social_saveReaction_(req, session);
  if (action === 'message') return social_saveChannelMessage_(req, session);
  if (action === 'importHistory') return social_importHistory_(req, session);
  if (action === 'story') return social_saveStory_(req, session);
  if (action === 'exportData') return social_exportData_(req, session);
  if (action === 'event') return social_saveEvent_(req, session);
  if (action === 'file') return social_saveFile_(req, session);
  if (action === 'messengerEnvelope') return social_messengerEnvelope_(req, session);
  if (action === 'messengerHistory') return { ok: true, envelopes: social_messengerHistory_(req.projectId) };
  if (action === 'save_record' || action === 'appRecord') return social_saveAppRecord_(req, session);
  if (action === 'list_records' || action === 'appRecords') return social_listAppRecords_(req, session);
  if (action === 'save_media_asset' || action === 'mediaAsset' || action === 'camera_capture') return social_saveMediaAsset_(req, session);
  if (action === 'save_voice_message' || action === 'voiceMessage') return social_saveVoiceMessage_(req, session);
  if (action === 'save_video' || action === 'videoAsset') return social_saveVideo_(req, session);
  if (action === 'request_transcription' || action === 'transcribe_media') return social_requestTranscription_(req, session);
  if (action === 'save_transcript' || action === 'update_transcript') return social_saveTranscript_(req, session);
  if (action === 'save_face_profile' || action === 'faceProfile') return social_saveFaceProfile_(req, session);
  if (action === 'list_face_profiles') return social_listFaceProfiles_(req, session);
  if (action === 'match_face_descriptor' || action === 'recognize_face') return social_matchFaceDescriptor_(req, session);
  if (action === 'save_filter_preset' || action === 'filterPreset') return social_saveFilterPreset_(req, session);
  if (action === 'list_filter_presets') return social_listFilterPresets_(req, session);
  if (action === 'create_call' || action === 'callCreate') return social_createCall_(req, session);
  if (action === 'join_call' || action === 'callJoin') return social_joinCall_(req, session);
  if (action === 'leave_call' || action === 'callLeave') return social_leaveCall_(req, session);
  if (action === 'end_call' || action === 'callEnd') return social_endCall_(req, session);
  if (action === 'call_signal' || action === 'callSignal') return social_callSignal_(req, session);
  if (action === 'poll_call' || action === 'callPoll') return social_pollCall_(req, session);
  if (action === 'roomJoin') return social_roomJoin_(req, session);
  if (action === 'roomHeartbeat') return social_roomHeartbeat_(req, session);
  if (action === 'roomLeave') return social_roomLeave_(req, session);
  if (action === 'roomSignal') return social_roomSignal_(req, session);
  if (action === 'roomChat') return social_roomChat_(req, session);
  if (action === 'roomReaction') return social_roomReaction_(req, session);
  if (action === 'roomRaiseHand') return social_roomRaiseHand_(req, session);
  if (action === 'roomPoll') return social_roomPoll_(req, session);
  throw new Error('Unknown action: ' + action);
}

function social_login_(req) {
  const payload = req.payload || {};
  const username = social_cleanUsername_(payload.username);
  const password = String(payload.password || '');
  if (!username || !password) throw new Error('Username and password are required.');
  social_pruneSessions_();
  const users = social_rows_('USERS').filter(function(u){ return u.projectId === req.projectId && String(u.username).toLowerCase() === username.toLowerCase() && String(u.disabled) !== 'true'; });
  if (!users.length) throw new Error('User not found. Use Register for the first setup, or check the username.');
  const user = users[0];
  if (social_hashPassword_(password, user.salt) !== user.passHash) throw new Error('Incorrect password.');
  const session = social_createSession_(req.projectId, user.userId, user.displayName, payload.userAgent);
  social_audit_(req.projectId, 'login', user.userId, { username: username });
  return { ok: true, session: session, user: social_publicUser_(user), state: social_publicState_(req.projectId) };
}

function social_register_(req) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const payload = req.payload || {};
    const username = social_cleanUsername_(payload.username);
    const password = String(payload.password || '');
    const displayName = social_cleanText_(payload.displayName || username, 80);
    if (!username || !password || password.length < 6) throw new Error('Username and a password of at least 6 characters are required.');
    const existing = social_rows_('USERS').filter(function(u){ return u.projectId === req.projectId; });
    if (existing.some(function(u){ return String(u.username).toLowerCase() === username.toLowerCase(); })) throw new Error('That username already exists.');
    if (existing.length >= OURSPACE_SOCIAL_COMPAT.MAX_REGISTERED_USERS_PER_PROJECT) throw new Error('Only two OurSpace profile accounts are allowed.');
    const salt = social_randomId_('salt');
    const userId = social_randomId_('user');
    const now = new Date().toISOString();
    social_append_('USERS', {
      projectId: req.projectId,
      userId: userId,
      username: username,
      displayName: displayName,
      salt: salt,
      passHash: social_hashPassword_(password, salt),
      role: existing.length ? 'member' : 'admin',
      avatar: payload.avatar || '💬',
      status: 'Around',
      createdAt: now,
      updatedAt: now,
      disabled: 'false'
    });
    social_upsertProfile_(req.projectId, { id: social_cleanSlug_(username), name: displayName, color: '#38bdf8', status: 'Around' });
    const session = social_createSession_(req.projectId, userId, displayName, payload.userAgent);
    social_audit_(req.projectId, 'register', userId, { username: username });
    return { ok: true, session: session, user: { userId: userId, username: username, displayName: displayName, role: existing.length ? 'member' : 'admin' }, state: social_publicState_(req.projectId) };
  } finally {
    lock.releaseLock();
  }
}

/**
 * New backend-ready account system matching the current HTML hooks:
 * create_account, sign_in, request_password_reset, tell_dino_cant_login, update_password.
 *
 * Notes:
 * - The current HTML still performs local password checks until its CONFIG.backendUrl is filled in and
 *   the next HTML pass moves verification fully server-side. These handlers accept those transitional
 *   requests without breaking the page.
 * - Email delivery works through MailApp.
 * - Phone delivery needs either Twilio script properties or a phoneGatewayEmail/carrier email gateway.
 *   Apps Script has no native SMS sender by itself.
 */
function social_createAccount_(req) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const p = req.payload || {};
    const username = social_cleanUsername_(p.username || p.displayName || 'friend');
    const displayName = social_cleanText_(p.displayName || username, 80);
    const email = social_normalizeEmail_(p.email || p.mainEmail || '');
    const phone = social_normalizePhone_(p.phone || p.phoneNumber || p.tel || '');
    const backupEmails = social_parseBackupEmails_(p.backupEmails || p.backupEmailsJson || []);
    const password = String(p.password || p.newPassword || '');

    if (!username) throw new Error('Username is required.');
    if (!email && !phone) throw new Error('Add at least one email address or phone number.');
    if (email && !social_isEmail_(email)) throw new Error('Main email is not valid.');
    if (password && password.length < OURSPACE_SOCIAL_COMPAT.MIN_PASSWORD_LENGTH) throw new Error('Password must be at least ' + OURSPACE_SOCIAL_COMPAT.MIN_PASSWORD_LENGTH + ' characters.');

    const existing = social_rows_('USERS').filter(function(u){ return u.projectId === req.projectId; });
    if (existing.some(function(u){ return social_identifiersMatchUser_(u, email) || social_identifiersMatchUser_(u, phone) || social_identifiersMatchUser_(u, username) || String(u.username || '').toLowerCase() === username.toLowerCase(); })) {
      throw new Error('An account already exists with that email, phone, backup email, or username.');
    }
    if (existing.length >= OURSPACE_SOCIAL_COMPAT.MAX_REGISTERED_USERS_PER_PROJECT) throw new Error('Only two OurSpace profile accounts are allowed.');

    const salt = password ? social_randomId_('salt') : '';
    const userId = social_cleanText_(p.accountId || p.userId || social_randomId_('user'), 120);
    const now = new Date().toISOString();
    const row = {
      projectId: req.projectId,
      userId: userId,
      username: username,
      displayName: displayName,
      salt: salt,
      passHash: password ? social_hashPassword_(password, salt) : '',
      role: existing.length ? 'member' : 'admin',
      avatar: p.avatar || '💬',
      status: 'Around',
      createdAt: p.createdAt || now,
      updatedAt: now,
      disabled: 'false',
      email: email,
      phone: phone,
      backupEmailsJson: JSON.stringify(backupEmails),
      mustChangePassword: password ? 'false' : 'false',
      tempCodeSalt: '',
      tempCodeHash: '',
      tempCodeExpiresAt: '',
      resetTokenSalt: '',
      resetTokenHash: '',
      resetRequestedAt: '',
      resetDelivery: '',
      resetRequestedBy: '',
      lastPasswordChangedAt: password ? now : '',
      lastTemporaryLoginAt: ''
    };
    social_append_('USERS', row);
    social_upsertProfile_(req.projectId, { id: social_cleanSlug_(username), name: displayName, color: '#38bdf8', status: 'Around' });
    social_audit_(req.projectId, 'create_account', userId, { username: username, email: social_maskEmail_(email), phone: social_maskPhone_(phone), backupEmailCount: backupEmails.length, passwordStored: Boolean(password) });
    return { ok: true, user: social_publicUser_(row), passwordStored: Boolean(password), note: password ? 'Account created with server-side password.' : 'Account metadata saved. The next HTML pass should send password to use server-side login.' };
  } finally {
    lock.releaseLock();
  }
}

function social_signInAccount_(req) {
  social_pruneSessions_();
  const p = req.payload || {};
  const identifier = social_cleanText_(p.identifier || p.email || p.phone || p.username || p.accountId || '', 160);
  const password = String(p.password || p.currentPassword || '');
  if (!identifier) throw new Error('Email, phone number, username, or account ID is required.');

  const user = social_findUserByIdentifier_(req.projectId, identifier);
  if (!user) throw new Error('No matching account was found.');
  if (String(user.disabled) === 'true') throw new Error('This account is disabled.');

  // Transitional mirror call from the current local-auth HTML after the browser already verified login.
  if (!password) {
    social_audit_(req.projectId, 'sign_in_client_mirror', user.userId, { identifier: social_maskIdentifier_(identifier), usedTemporaryCode: Boolean(p.usedTemporaryCode) });
    return { ok: true, mirrored: true, user: social_publicUser_(user), note: 'Client-side login event received. Send password in the next HTML pass for server-side sessions.' };
  }

  const normalPasswordMatches = user.passHash && user.salt && social_hashPassword_(password, user.salt) === user.passHash;
  const temporaryCodeMatches = user.tempCodeHash && user.tempCodeSalt && social_hashPassword_(password, user.tempCodeSalt) === user.tempCodeHash && social_isFuture_(user.tempCodeExpiresAt);
  if (!normalPasswordMatches && !temporaryCodeMatches) throw new Error('That password or temporary reset code does not match this account.');

  let updatedUser = user;
  if (temporaryCodeMatches) {
    social_updateRow_('USERS', user._row, { mustChangePassword: 'true', lastTemporaryLoginAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    updatedUser = social_findUserByIdentifier_(req.projectId, identifier) || user;
  }

  const session = social_createSession_(req.projectId, updatedUser.userId, updatedUser.displayName || updatedUser.username, p.userAgent);
  social_audit_(req.projectId, 'sign_in', updatedUser.userId, { identifier: social_maskIdentifier_(identifier), temporaryCode: temporaryCodeMatches });
  return { ok: true, session: session, user: social_publicUser_(updatedUser), mustChangePassword: String(updatedUser.mustChangePassword) === 'true' || temporaryCodeMatches, authMethod: temporaryCodeMatches ? 'temporary_code' : 'password', state: social_publicState_(req.projectId) };
}

function social_requestPasswordReset_(req) {
  const p = req.payload || {};
  const identifier = social_cleanText_(p.identifier || p.accountId || p.username || p.email || p.phone || p.target || '', 240);
  const delivery = social_cleanSlug_(p.delivery || p.method || 'email');
  if (!identifier) throw new Error('Account lookup is required.');
  if (['email','phone','dino'].indexOf(delivery) < 0) throw new Error('Reset delivery must be email, phone, or dino.');

  const user = social_findUserByIdentifier_(req.projectId, identifier);
  if (!user) throw new Error('No matching account was found. Use the Dino recovery button for manual help.');

  const reset = social_createResetForUser_(req, user, identifier, delivery, p);
  let result;
  if (delivery === 'email') result = social_sendResetEmail_(req, user, reset, p);
  else if (delivery === 'phone') result = social_sendResetPhone_(req, user, reset, p);
  else result = social_emailDinoRecovery_(req, user, reset, p, 'Dino recovery requested');

  social_logResetRequest_(req.projectId, user.userId, identifier, delivery, result.target || '', reset.resetLink, reset.expiresAt, identifier, result.sentToDino || false, result.status || 'sent', result);
  social_audit_(req.projectId, 'request_password_reset', user.userId, { delivery: delivery, status: result.status, target: social_maskIdentifier_(result.target || '') });
  return {
    ok: true,
    delivery: delivery,
    sent: Boolean(result.sent),
    sentToDino: Boolean(result.sentToDino),
    target: social_maskIdentifier_(result.target || ''),
    expiresAt: reset.expiresAt,
    resetLink: reset.resetLink,
    phoneNeedsSmsProvider: Boolean(result.phoneNeedsSmsProvider),
    message: result.message || 'Reset request processed.'
  };
}

function social_tellDinoCantLogin_(req) {
  const p = req.payload || {};
  const identifier = social_cleanText_(p.identifier || p.accountId || p.username || p.email || p.phone || 'unknown account', 240);
  let user = social_findUserByIdentifier_(req.projectId, identifier);
  if (!user) user = social_createRecoveryStubUser_(req, identifier, p);

  const reset = social_createResetForUser_(req, user, identifier, 'dino', p);
  const result = social_emailDinoRecovery_(req, user, reset, p, 'OurSpace login help needed');
  social_logResetRequest_(req.projectId, user.userId, identifier, 'dino', OURSPACE_SOCIAL_COMPAT.DINO_EMAIL, reset.resetLink, reset.expiresAt, identifier, true, result.status || 'sent_to_dino', result);
  social_audit_(req.projectId, 'tell_dino_cant_login', user.userId, { identifier: social_maskIdentifier_(identifier), sentToDino: true });
  return { ok: true, sentToDino: true, dinoEmail: OURSPACE_SOCIAL_COMPAT.DINO_EMAIL, expiresAt: reset.expiresAt, message: 'Dino has been emailed with the 6 digit temporary reset code.' };
}

function social_updatePassword_(req) {
  const p = req.payload || {};
  const identifier = social_cleanText_(p.accountId || p.userId || p.identifier || p.email || p.phone || p.username || '', 240);
  if (!identifier) throw new Error('Account ID, email, phone, or username is required.');
  const user = social_findUserByIdentifier_(req.projectId, identifier);
  if (!user) throw new Error('No matching account was found.');
  if (String(user.disabled) === 'true') throw new Error('This account is disabled.');

  const newPassword = String(p.newPassword || p.password || '');
  const backupEmails = social_mergeBackupEmails_(social_parseBackupEmails_(user.backupEmailsJson), social_parseBackupEmails_(p.backupEmails || p.backupEmailsJson || []));
  if (newPassword && newPassword.length < OURSPACE_SOCIAL_COMPAT.MIN_PASSWORD_LENGTH) throw new Error('New password must be at least ' + OURSPACE_SOCIAL_COMPAT.MIN_PASSWORD_LENGTH + ' characters.');
  if (p.requireBackupEmail !== false && !backupEmails.length) throw new Error('Add at least one backup email before continuing.');

  const patch = {
    backupEmailsJson: JSON.stringify(backupEmails),
    mustChangePassword: 'false',
    tempCodeSalt: '',
    tempCodeHash: '',
    tempCodeExpiresAt: '',
    resetTokenSalt: '',
    resetTokenHash: '',
    resetRequestedAt: '',
    resetDelivery: '',
    resetRequestedBy: '',
    updatedAt: new Date().toISOString(),
    lastPasswordChangedAt: new Date().toISOString()
  };
  if (newPassword) {
    patch.salt = social_randomId_('salt');
    patch.passHash = social_hashPassword_(newPassword, patch.salt);
  }
  social_updateRow_('USERS', user._row, patch);
  const updatedUser = social_findUserByIdentifier_(req.projectId, identifier) || social_mergeObjects_(user, patch);
  social_audit_(req.projectId, 'update_password', user.userId, { passwordUpdated: Boolean(newPassword), backupEmailCount: backupEmails.length });
  return { ok: true, user: social_publicUser_(updatedUser), passwordUpdated: Boolean(newPassword), backupEmails: backupEmails, mustChangePassword: false };
}

function social_createRecoveryStubUser_(req, identifier, p) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    let user = social_findUserByIdentifier_(req.projectId, identifier);
    if (user) return user;
    const email = social_isEmail_(identifier) ? social_normalizeEmail_(identifier) : social_normalizeEmail_(p.email || '');
    const phone = social_normalizePhone_(identifier) || social_normalizePhone_(p.phone || '');
    const username = social_cleanUsername_(p.username || (!email && !phone ? identifier : 'recovery_' + Date.now().toString(36)));
    const userId = social_cleanText_(p.accountId || p.userId || social_randomId_('user'), 120);
    const now = new Date().toISOString();
    const row = {
      projectId: req.projectId,
      userId: userId,
      username: username,
      displayName: social_cleanText_(p.displayName || username || 'Recovery Account', 80),
      salt: '',
      passHash: '',
      role: 'member',
      avatar: '🆘',
      status: 'Recovery needed',
      createdAt: now,
      updatedAt: now,
      disabled: 'false',
      email: email,
      phone: phone,
      backupEmailsJson: JSON.stringify(social_parseBackupEmails_(p.backupEmails || [])),
      mustChangePassword: 'true',
      tempCodeSalt: '',
      tempCodeHash: '',
      tempCodeExpiresAt: '',
      resetTokenSalt: '',
      resetTokenHash: '',
      resetRequestedAt: '',
      resetDelivery: '',
      resetRequestedBy: '',
      lastPasswordChangedAt: '',
      lastTemporaryLoginAt: ''
    };
    social_append_('USERS', row);
    return social_findUserByIdentifier_(req.projectId, userId) || row;
  } finally {
    lock.releaseLock();
  }
}

function social_createResetForUser_(req, user, identifier, delivery, p) {
  const code = (/^\d{6}$/.test(String(p.resetCode || ''))) ? String(p.resetCode) : social_generateSixDigitCode_();
  const token = social_cleanText_(p.resetToken || social_generateToken_(), 160);
  const expiresAt = p.expiresAt || new Date(Date.now() + OURSPACE_SOCIAL_COMPAT.RESET_CODE_MINUTES * 60 * 1000).toISOString();
  const codeSalt = social_randomId_('code');
  const tokenSalt = social_randomId_('token');
  const resetLink = social_cleanText_(p.resetLink || social_buildResetLink_(req, token), 2000);
  social_updateRow_('USERS', user._row, {
    tempCodeSalt: codeSalt,
    tempCodeHash: social_hashPassword_(code, codeSalt),
    tempCodeExpiresAt: expiresAt,
    resetTokenSalt: tokenSalt,
    resetTokenHash: social_hashPassword_(token, tokenSalt),
    resetRequestedAt: new Date().toISOString(),
    resetDelivery: delivery,
    resetRequestedBy: social_cleanText_(identifier, 240),
    mustChangePassword: 'true',
    updatedAt: new Date().toISOString()
  });
  return { code: code, token: token, resetLink: resetLink, expiresAt: expiresAt };
}

function social_sendResetEmail_(req, user, reset, p) {
  const email = social_normalizeEmail_(p.target || p.email || user.email || social_firstBackupEmail_(user));
  if (!email) throw new Error('This account does not have an email or backup email. Use Dino recovery.');
  const subject = 'OurSpace password reset code';
  const body = social_resetMessageBody_(user, reset, 'Use this code or reset link to sign in temporarily.');
  MailApp.sendEmail(email, subject, body);
  return { sent: true, status: 'sent_email', target: email, message: 'Reset code and link sent to email.' };
}

function social_sendResetPhone_(req, user, reset, p) {
  const phone = social_normalizePhone_(p.target || p.phone || user.phone || '');
  if (!phone) throw new Error('This account does not have a phone number. Try email reset or Dino recovery.');
  const message = 'OurSpace reset code: ' + reset.code + '. Temporary password. Link: ' + reset.resetLink + ' Expires: ' + reset.expiresAt;
  const sms = social_sendSmsIfConfigured_(phone, message, p);
  if (sms.sent) return { sent: true, status: sms.status, target: phone, message: 'Reset code sent to phone.' };

  const dino = social_emailDinoRecovery_(req, user, reset, p, 'Phone reset needs Dino delivery');
  return { sent: false, sentToDino: true, status: 'phone_needs_sms_provider_sent_to_dino', target: phone, phoneNeedsSmsProvider: true, message: 'Apps Script needs Twilio or a phone email gateway for real SMS. Dino was emailed the code as fallback.', dino: dino };
}

function social_emailDinoRecovery_(req, user, reset, p, subject) {
  const dinoEmail = social_normalizeEmail_(p.dinoEmail || OURSPACE_SOCIAL_COMPAT.DINO_EMAIL) || OURSPACE_SOCIAL_COMPAT.DINO_EMAIL;
  const body = [
    'Dino, someone cannot log in to OurSpace.',
    '',
    'Project: ' + req.projectId,
    'Account ID: ' + (user.userId || ''),
    'Username: ' + (user.username || ''),
    'Display name: ' + (user.displayName || ''),
    'Email: ' + social_maskEmail_(user.email || ''),
    'Phone: ' + social_maskPhone_(user.phone || ''),
    'Requested by / lookup: ' + social_cleanText_(p.identifier || p.resetRequestedBy || '', 240),
    '',
    'Temporary 6 digit reset code: ' + reset.code,
    'Reset link: ' + reset.resetLink,
    'Code expires: ' + reset.expiresAt,
    '',
    'Give them the 6 digit code. It becomes their temporary password. After they sign in, the site forces a new password and backup emails before the rest of the site opens.'
  ].join('\n');
  MailApp.sendEmail(dinoEmail, subject || 'OurSpace login help needed', body);
  return { sent: true, sentToDino: true, status: 'sent_to_dino', target: dinoEmail, message: 'Dino was emailed the temporary reset code.' };
}

function social_sendSmsIfConfigured_(phone, message, p) {
  const gatewayEmail = social_normalizeEmail_(p.phoneGatewayEmail || '');
  if (gatewayEmail) {
    MailApp.sendEmail(gatewayEmail, 'OurSpace reset code', message);
    return { sent: true, status: 'sent_phone_gateway_email' };
  }

  const props = PropertiesService.getScriptProperties();
  const sid = props.getProperty('TWILIO_ACCOUNT_SID');
  const token = props.getProperty('TWILIO_AUTH_TOKEN');
  const from = props.getProperty('TWILIO_FROM_NUMBER');
  if (!sid || !token || !from) return { sent: false, status: 'no_sms_provider' };

  const response = UrlFetchApp.fetch('https://api.twilio.com/2010-04-01/Accounts/' + encodeURIComponent(sid) + '/Messages.json', {
    method: 'post',
    payload: { To: '+' + phone, From: from, Body: message },
    headers: { Authorization: 'Basic ' + Utilities.base64Encode(sid + ':' + token) },
    muteHttpExceptions: true
  });
  const code = response.getResponseCode();
  if (code >= 200 && code < 300) return { sent: true, status: 'sent_twilio_sms' };
  return { sent: false, status: 'twilio_error_' + code, body: response.getContentText().slice(0, 500) };
}

function social_logResetRequest_(projectId, accountId, identifier, delivery, target, resetLink, expiresAt, requestedBy, sentToDino, status, details) {
  social_append_('RESET_REQUESTS', {
    projectId: projectId,
    id: social_randomId_('reset'),
    accountId: accountId || '',
    identifier: social_cleanText_(identifier || '', 240),
    delivery: social_cleanText_(delivery || '', 40),
    target: social_maskIdentifier_(target || ''),
    resetLink: social_cleanText_(resetLink || '', 2000),
    expiresAt: expiresAt || '',
    requestedAt: new Date().toISOString(),
    requestedBy: social_cleanText_(requestedBy || '', 240),
    sentToDino: sentToDino ? 'true' : 'false',
    status: social_cleanText_(status || '', 120),
    detailsJson: JSON.stringify(details || {})
  });
}

function social_findUserByIdentifier_(projectId, identifier) {
  const raw = String(identifier || '').trim();
  const text = raw.toLowerCase();
  const phone = social_normalizePhone_(raw);
  if (!raw) return null;
  return social_rows_('USERS').find(function(u){
    if (u.projectId !== projectId) return false;
    if (String(u.userId || '') === raw || String(u.userId || '').toLowerCase() === text) return true;
    if (String(u.username || '').toLowerCase() === text) return true;
    if (String(u.email || '').toLowerCase() === text) return true;
    if (phone && social_normalizePhone_(u.phone) === phone) return true;
    const backups = social_parseBackupEmails_(u.backupEmailsJson);
    return backups.indexOf(text) >= 0;
  }) || null;
}

function social_identifiersMatchUser_(u, identifier) {
  const raw = String(identifier || '').trim();
  const text = raw.toLowerCase();
  const phone = social_normalizePhone_(raw);
  if (!raw) return false;
  if (String(u.userId || '') === raw || String(u.userId || '').toLowerCase() === text) return true;
  if (String(u.username || '').toLowerCase() === text) return true;
  if (String(u.email || '').toLowerCase() === text) return true;
  if (phone && social_normalizePhone_(u.phone) === phone) return true;
  return social_parseBackupEmails_(u.backupEmailsJson).indexOf(text) >= 0;
}

function social_normalizeEmail_(value) { return String(value || '').trim().toLowerCase(); }
function social_normalizePhone_(value) { return String(value || '').replace(/[^0-9]/g, '').slice(-15); }
function social_isEmail_(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim()); }
function social_parseBackupEmails_(value) {
  let raw = value;
  if (Array.isArray(raw)) return social_mergeBackupEmails_(raw);
  if (typeof raw === 'string' && raw.trim().charAt(0) === '[') {
    try { raw = JSON.parse(raw); } catch (_err) {}
    if (Array.isArray(raw)) return social_mergeBackupEmails_(raw);
  }
  return social_mergeBackupEmails_(String(raw || '').split(/[\s,;]+/));
}
function social_mergeBackupEmails_() {
  const out = [];
  Array.prototype.slice.call(arguments).forEach(function(list){
    (Array.isArray(list) ? list : [list]).forEach(function(item){
      const email = social_normalizeEmail_(item);
      if (email && social_isEmail_(email) && out.indexOf(email) < 0) out.push(email);
    });
  });
  return out;
}
function social_firstBackupEmail_(user) { const arr = social_parseBackupEmails_(user.backupEmailsJson); return arr.length ? arr[0] : ''; }
function social_generateSixDigitCode_() { return String(Math.floor(100000 + Math.random() * 900000)); }
function social_generateToken_() { return Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, ''); }
function social_isFuture_(value) { return value && new Date(value).getTime() > Date.now(); }
function social_buildResetLink_(req, token) {
  const p = req.payload || {};
  const base = social_cleanText_(p.frontendBaseUrl || p.page || p.siteUrl || '', 1900);
  if (base) return social_appendQuery_(base, 'reset', token);
  return ScriptApp.getService().getUrl() + '?action=reset&projectId=' + encodeURIComponent(req.projectId) + '&token=' + encodeURIComponent(token);
}
function social_appendQuery_(url, key, value) {
  const joiner = String(url).indexOf('?') >= 0 ? '&' : '?';
  return String(url) + joiner + encodeURIComponent(key) + '=' + encodeURIComponent(value);
}
function social_resetMessageBody_(user, reset, intro) {
  return [
    intro || 'Use this reset code to sign in temporarily.',
    '',
    'Username: ' + (user.username || ''),
    'Temporary 6 digit reset code: ' + reset.code,
    'Reset link: ' + reset.resetLink,
    'Expires: ' + reset.expiresAt,
    '',
    'After signing in, you will be asked to create a new permanent password and add backup emails before entering the site.'
  ].join('\n');
}
function social_maskEmail_(email) {
  email = social_normalizeEmail_(email);
  if (!email || email.indexOf('@') < 0) return '';
  const parts = email.split('@');
  return parts[0].slice(0, 2) + '***@' + parts[1];
}
function social_maskPhone_(phone) {
  phone = social_normalizePhone_(phone);
  if (!phone) return '';
  return phone.length <= 4 ? '***' + phone : '***-***-' + phone.slice(-4);
}
function social_maskIdentifier_(value) {
  const raw = String(value || '').trim();
  if (social_isEmail_(raw)) return social_maskEmail_(raw);
  const phone = social_normalizePhone_(raw);
  if (phone && phone.length >= 7) return social_maskPhone_(phone);
  if (raw.length <= 3) return raw;
  return raw.slice(0, 2) + '***' + raw.slice(-1);
}

function social_logout_(req) {
  if (!req.sessionToken) return { ok: true };
  const sheet = social_getSheet_('SESSIONS');
  const data = social_rows_('SESSIONS');
  data.forEach(function(row){ if (row.token === req.sessionToken) sheet.deleteRow(row._row); });
  return { ok: true };
}

function social_heartbeat_(req, session) {
  if (!session) session = social_requireSession_(req, false);
  social_enforceActiveLimit_(req.projectId, session.token);
  social_updateSessionSeen_(session.token);
  if (req.payload && (req.payload.name || req.payload.status)) {
    social_upsertProfile_(req.projectId, {
      id: social_cleanSlug_(req.payload.id || req.payload.clientId || session.userId),
      name: social_cleanText_(req.payload.name || session.displayName, 80),
      color: req.payload.color || '#38bdf8',
      status: social_cleanText_(req.payload.status || 'Around', 120)
    });
  }
  return { ok: true, user: { clientId: session.userId, name: session.displayName, status: 'online', lastSeen: Date.now() }, onlineUsers: social_onlineUsers_(req.projectId), state: social_publicState_(req.projectId) };
}

function social_saveProfile_(req, session) {
  const p = req.payload || {};
  const profile = social_upsertProfile_(req.projectId, {
    id: social_cleanSlug_(p.id || p.name || session.userId),
    name: social_cleanText_(p.name || session.displayName, 80),
    color: /^#[0-9a-f]{6}$/i.test(String(p.color || '')) ? p.color : '#38bdf8',
    status: social_cleanText_(p.status || 'Around', 120)
  });
  return { ok: true, profile: profile, state: social_publicState_(req.projectId) };
}

function social_savePost_(req, session) {
  const p = req.payload || {};
  const media = social_saveMediaIfNeeded_(req.projectId, p.media, p.mediaType, 'post-media', session.userId);
  const post = {
    projectId: req.projectId,
    id: social_randomId_('post'),
    author: social_cleanText_(p.author || session.displayName || 'Friend', 80),
    text: social_cleanText_(p.text || '', OURSPACE_SOCIAL_COMPAT.MAX_TEXT),
    media: media.url || '',
    mediaType: social_cleanText_(p.mediaType || media.mimeType || '', 120),
    createdAt: new Date().toISOString(),
    reactionsJson: '[]',
    commentsJson: '[]'
  };
  if (!post.text && !post.media) throw new Error('Post text or media is required.');
  social_append_('FEED', post);
  return { ok: true, post: social_publicPost_(post), state: social_publicState_(req.projectId) };
}

function social_saveComment_(req, session) {
  const p = req.payload || {};
  const rows = social_rows_('FEED');
  const row = rows.find(function(x){ return x.projectId === req.projectId && x.id === String(p.postId || ''); });
  if (!row) throw new Error('Post not found.');
  const comments = social_parseJson_(row.commentsJson, []);
  const comment = { id: social_randomId_('comment'), author: social_cleanText_(p.author || session.displayName, 80), text: social_cleanText_(p.text || '', 1200), createdAt: new Date().toISOString() };
  if (!comment.text) throw new Error('Comment text is required.');
  comments.push(comment);
  social_updateRow_('FEED', row._row, { commentsJson: JSON.stringify(comments.slice(-100)) });
  return { ok: true, comment: comment, state: social_publicState_(req.projectId) };
}

function social_saveReaction_(req, session) {
  const p = req.payload || {};
  const type = social_cleanText_(p.type || 'post', 20);
  const id = String(p.id || '');
  const sheetName = type === 'story' ? 'STORIES' : type === 'message' ? 'MESSAGES' : 'FEED';
  const row = social_rows_(sheetName).find(function(x){ return x.projectId === req.projectId && x.id === id; });
  if (!row) throw new Error('Item not found.');
  const reactions = social_parseJson_(row.reactionsJson, []);
  const author = social_cleanText_(p.author || session.displayName, 80);
  const reaction = social_cleanText_(p.reaction || '💙', 16);
  const idx = reactions.findIndex(function(r){ return r.author === author && r.reaction === reaction; });
  if (idx >= 0) reactions.splice(idx, 1);
  else reactions.push({ id: social_randomId_('react'), author: author, reaction: reaction, at: Date.now() });
  social_updateRow_(sheetName, row._row, { reactionsJson: JSON.stringify(reactions.slice(-250)) });
  return { ok: true, item: { id: id, reactions: reactions }, state: social_publicState_(req.projectId) };
}

function social_saveChannelMessage_(req, session) {
  const p = req.payload || {};
  const channel = social_cleanSlug_(p.channel || 'general');
  social_ensureChannel_(req.projectId, channel);
  const media = social_saveMediaIfNeeded_(req.projectId, p.media, p.mediaType, 'message-media', session.userId);
  const message = {
    projectId: req.projectId,
    channel: channel,
    id: social_randomId_('msg'),
    author: social_cleanText_(p.author || session.displayName || 'Friend', 80),
    text: social_cleanText_(p.text || p.content || '', OURSPACE_SOCIAL_COMPAT.MAX_TEXT),
    media: media.url || '',
    mediaType: social_cleanText_(p.mediaType || media.mimeType || '', 120),
    origin: social_cleanText_(p.origin || 'browser', 40),
    createdAt: new Date().toISOString(),
    reactionsJson: '[]'
  };
  if (!message.text && !message.media) throw new Error('Message text or media is required.');
  social_append_('MESSAGES', message);
  return { ok: true, channel: channel, message: social_publicMessage_(message), state: social_publicState_(req.projectId) };
}

function social_importHistory_(req, session) {
  const p = req.payload || {};
  const channel = social_cleanSlug_(p.channel || 'imports');
  social_ensureChannel_(req.projectId, channel);
  const input = p.history || p;
  const arr = Array.isArray(input) ? input : (input.messages || input.data || []);
  let count = 0;
  arr.slice(0, 500).forEach(function(item){
    const text = social_cleanText_(item.text || item.content || item.message || '', OURSPACE_SOCIAL_COMPAT.MAX_TEXT);
    if (!text) return;
    social_append_('MESSAGES', {
      projectId: req.projectId,
      channel: channel,
      id: social_randomId_('msg'),
      author: social_cleanText_(item.author || item.user || session.displayName || 'Imported', 80),
      text: text,
      media: '',
      mediaType: '',
      origin: 'import',
      createdAt: item.createdAt || new Date().toISOString(),
      reactionsJson: '[]'
    });
    count++;
  });
  return { ok: true, channel: channel, imported: count, state: social_publicState_(req.projectId) };
}

function social_saveStory_(req, session) {
  const p = req.payload || {};
  const media = social_saveMediaIfNeeded_(req.projectId, p.media, p.mediaType, 'story-media', session.userId);
  const ttl = Math.max(5 * 60 * 1000, Math.min(Number(p.ttlMs || OURSPACE_SOCIAL_COMPAT.STORY_DEFAULT_TTL_MS), OURSPACE_SOCIAL_COMPAT.STORY_MAX_TTL_MS));
  const story = {
    projectId: req.projectId,
    id: social_randomId_('story'),
    author: social_cleanText_(p.author || session.displayName || 'Friend', 80),
    text: social_cleanText_(p.text || '', 800),
    media: media.url || '',
    mediaType: social_cleanText_(p.mediaType || media.mimeType || '', 120),
    createdAt: new Date().toISOString(),
    expiresAt: Date.now() + ttl,
    reactionsJson: '[]'
  };
  if (!story.text && !story.media) throw new Error('Story text or media is required.');
  social_append_('STORIES', story);
  return { ok: true, story: social_publicStory_(story), state: social_publicState_(req.projectId) };
}

function social_saveEvent_(req, session) {
  const p = req.payload || {};
  const operation = social_cleanText_(p.operation || 'create', 20);
  if (operation === 'delete') {
    const sheet = social_getSheet_('EVENTS');
    const rows = social_rows_('EVENTS');
    const row = rows.find(function(x){ return x.projectId === req.projectId && x.id === String(p.id || ''); });
    if (!row) throw new Error('Event not found.');
    sheet.deleteRow(row._row);
    return { ok: true, deleted: p.id, state: social_publicState_(req.projectId) };
  }
  const id = p.id || social_randomId_('event');
  const event = {
    projectId: req.projectId,
    id: id,
    title: social_cleanText_(p.title || 'Untitled event', 160),
    start: social_cleanText_(p.start || '', 80),
    end: social_cleanText_(p.end || p.start || '', 80),
    location: social_cleanText_(p.location || '', 240),
    description: social_cleanText_(p.description || '', 2000),
    createdBy: session.displayName || session.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    calendarEventId: ''
  };
  if (!event.start) throw new Error('Event start date/time is required.');
  const existing = social_rows_('EVENTS').find(function(x){ return x.projectId === req.projectId && x.id === id; });
  if (existing) social_updateRow_('EVENTS', existing._row, event);
  else social_append_('EVENTS', event);
  return { ok: true, event: social_publicEvent_(event), state: social_publicState_(req.projectId) };
}

function social_saveFile_(req, session) {
  const p = req.payload || {};
  const media = social_saveMediaIfNeeded_(req.projectId, p.dataUrl || p.media, p.mimeType || p.mediaType, p.name || 'upload', session.userId, true);
  return { ok: true, file: media };
}

function social_messengerEnvelope_(req, session) {
  const raw = req.payload || {};
  const type = social_cleanText_(raw.type || 'message', 40);
  const allowed = ['hello','history','message','presence','typing','room','call-join','call-signal','call-leave','call-start','call-end','voice-message','video-message','file','sticker','gif','transcript'];
  if (allowed.indexOf(type) < 0) throw new Error('Unsupported messenger envelope type.');
  const envelope = {
    projectId: req.projectId,
    id: social_cleanText_(raw.id || social_randomId_('mp'), 120),
    type: type,
    clientId: social_cleanText_(raw.clientId || session.userId || 'browser', 120),
    createdAt: raw.createdAt || new Date().toISOString(),
    payloadJson: JSON.stringify(raw.payload || {}),
    appName: 'OurSpace Messenger'
  };
  if (type === 'message' || type === 'room' || type.indexOf('call-') === 0 || type === 'typing' || type === 'presence') social_append_('MESSENGER', envelope);
  return { ok: true, envelope: social_publicEnvelope_(envelope) };
}

function social_roomJoin_(req, session) {
  social_enforceActiveLimit_(req.projectId, session.token);
  const p = req.payload || {};
  const roomCode = social_cleanSlug_(p.room || 'room');
  const pass = String(p.pass || '');
  const now = Date.now();
  let room = social_rows_('ROOMS').find(function(x){ return x.projectId === req.projectId && x.room === roomCode; });
  if (!room) {
    social_append_('ROOMS', { projectId: req.projectId, room: roomCode, passHash: social_hashPassword_(pass, 'room:' + roomCode), createdAt: now, updatedAt: now, participantsJson: '[]' });
    room = social_rows_('ROOMS').find(function(x){ return x.projectId === req.projectId && x.room === roomCode; });
  }
  if (room.passHash !== social_hashPassword_(pass, 'room:' + roomCode)) throw new Error('Incorrect room passcode.');
  let participants = social_parseJson_(room.participantsJson, []).filter(function(x){ return now - Number(x.lastSeen || 0) < OURSPACE_SOCIAL_COMPAT.ACTIVE_WINDOW_MS; });
  const peerId = social_cleanText_(p.peerId || session.userId || social_randomId_('peer'), 120);
  participants = participants.filter(function(x){ return x.id !== peerId; });
  participants.push({ id: peerId, name: social_cleanText_(p.name || session.displayName || 'Guest', 80), joinedAt: now, lastSeen: now, handRaised: false });
  social_updateRow_('ROOMS', room._row, { updatedAt: now, participantsJson: JSON.stringify(participants) });
  social_addRoomEvent_(req.projectId, roomCode, 'participants', participants, 'server', '*');
  return { ok: true, peerId: peerId, participants: participants, room: roomCode };
}

function social_roomHeartbeat_(req, session) {
  const p = req.payload || {};
  const room = social_findRoom_(req.projectId, p.room);
  const participants = social_touchParticipant_(room, p.peerId || p.from, null);
  return { ok: true, participants: participants };
}

function social_roomLeave_(req, session) {
  const p = req.payload || {};
  const room = social_findRoom_(req.projectId, p.room);
  const peerId = String(p.peerId || p.from || '');
  const participants = social_parseJson_(room.participantsJson, []).filter(function(x){ return x.id !== peerId; });
  social_updateRow_('ROOMS', room._row, { updatedAt: Date.now(), participantsJson: JSON.stringify(participants) });
  social_addRoomEvent_(req.projectId, room.room, 'participants', participants, 'server', '*');
  return { ok: true, participants: participants };
}

function social_roomSignal_(req, session) {
  const p = req.payload || {};
  const room = social_findRoom_(req.projectId, p.room);
  const from = social_cleanText_(p.from || p.peerId || session.userId, 120);
  const to = social_cleanText_(p.to || '', 120);
  if (!to) throw new Error('Signal target is required.');
  const signal = social_addRoomEvent_(req.projectId, room.room, 'signal', { from: from, to: to, type: social_cleanText_(p.type || '', 40), payload: p.payload }, from, to);
  return { ok: true, signal: signal };
}

function social_roomChat_(req, session) {
  const p = req.payload || {};
  const room = social_findRoom_(req.projectId, p.room);
  const from = social_cleanText_(p.from || p.peerId || session.userId, 120);
  const sender = social_cleanText_(session.displayName || p.name || 'Guest', 80);
  const message = { id: social_randomId_('roommsg'), from: from, sender: sender, body: social_cleanText_(p.message || '', OURSPACE_SOCIAL_COMPAT.MAX_TEXT), sentAt: Date.now() };
  social_addRoomEvent_(req.projectId, room.room, 'room-chat', message, from, '*');
  return { ok: true, message: message };
}

function social_roomReaction_(req, session) {
  const p = req.payload || {};
  const room = social_findRoom_(req.projectId, p.room);
  const from = social_cleanText_(p.from || p.peerId || session.userId, 120);
  const reaction = { id: social_randomId_('roomreact'), from: from, sender: session.displayName || 'Guest', reaction: social_cleanText_(p.reaction || '👍', 16), sentAt: Date.now() };
  social_addRoomEvent_(req.projectId, room.room, 'room-reaction', reaction, from, '*');
  return { ok: true, reaction: reaction };
}

function social_roomRaiseHand_(req, session) {
  const p = req.payload || {};
  const room = social_findRoom_(req.projectId, p.room);
  const participants = social_touchParticipant_(room, p.peerId || p.from, Boolean(p.raised));
  social_addRoomEvent_(req.projectId, room.room, 'participants', participants, 'server', '*');
  return { ok: true, participants: participants };
}

function social_roomPoll_(req, session) {
  const p = req.payload || {};
  const room = social_findRoom_(req.projectId, p.room);
  const peerId = social_cleanText_(p.peerId || p.from || session.userId, 120);
  const since = Number(p.since || 0);
  const now = Date.now();
  const participants = social_touchParticipant_(room, peerId, null);
  const signals = social_rows_('SIGNALS').filter(function(x){
    return x.projectId === req.projectId && x.room === room.room && Number(x.createdAt) > since && (x.toPeer === '*' || x.toPeer === peerId);
  }).slice(-100).map(function(x){
    return { event: x.type === 'signal' ? 'signal' : x.type, data: social_parseJson_(x.payloadJson, {}), at: Number(x.createdAt) };
  });
  return { ok: true, now: now, participants: participants, events: signals };
}

function social_exportData_(req, session) {
  return {
    ok: true,
    data: social_publicState_(req.projectId),
    envelopes: social_messengerHistory_(req.projectId),
    calls: social_rows_('CALLS').filter(social_byProject_(req.projectId)).map(publicCall_),
    mediaAssets: social_rows_('MEDIA_ASSETS').filter(social_byProject_(req.projectId)).map(publicMediaAsset_),
    voiceMessages: social_rows_('VOICE_MESSAGES').filter(social_byProject_(req.projectId)).map(publicVoiceMessage_),
    videos: social_rows_('VIDEOS').filter(social_byProject_(req.projectId)).map(publicVideo_),
    transcripts: social_rows_('TRANSCRIPTS').filter(social_byProject_(req.projectId)).map(publicTranscript_),
    filterPresets: social_rows_('FILTER_PRESETS').filter(social_byProject_(req.projectId)).map(publicFilterPreset_),
    exportedAt: new Date().toISOString()
  };
}

function social_cloudAuthSignIn_(req) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    social_pruneSessions_();
    const p = req.payload || {};
    const provider = social_cleanSlug_(p.provider || 'google');
    let identity;
    if (provider === 'google') identity = social_verifyGoogleIdToken_(p.idToken || p.credential || p.token || '');
    else identity = social_verifyExternalIdentity_(provider, p);

    const providerUserId = social_cleanText_(identity.providerUserId || identity.sub || '', 240);
    const email = social_normalizeEmail_(identity.email || p.email || '');
    const displayName = social_cleanText_(identity.displayName || identity.name || p.displayName || email.split('@')[0] || 'Friend', 80);
    if (!providerUserId && !email) throw new Error('Cloud sign-in did not return a stable account ID or email.');

    let providerRow = social_rows_('AUTH_PROVIDERS').find(function(row){
      return row.projectId === req.projectId && row.provider === provider && row.providerUserId === providerUserId;
    });
    let user = providerRow ? social_rows_('USERS').find(function(u){ return u.projectId === req.projectId && u.userId === providerRow.userId; }) : null;
    if (!user && email) user = social_findUserByIdentifier_(req.projectId, email);

    if (!user) {
      const existing = social_rows_('USERS').filter(function(u){ return u.projectId === req.projectId; });
      if (existing.length >= OURSPACE_SOCIAL_COMPAT.MAX_REGISTERED_USERS_PER_PROJECT) throw new Error('Only two OurSpace profile accounts are allowed.');
      const now = new Date().toISOString();
      const username = social_cleanUsername_(p.username || email || displayName || ('cloud_' + Date.now().toString(36)));
      const userId = social_randomId_('user');
      const row = {
        projectId: req.projectId,
        userId: userId,
        username: username,
        displayName: displayName,
        salt: '',
        passHash: '',
        role: existing.length ? 'member' : 'admin',
        avatar: identity.photoUrl || p.avatar || '☁️',
        status: 'Around',
        createdAt: now,
        updatedAt: now,
        disabled: 'false',
        email: email,
        phone: social_normalizePhone_(p.phone || ''),
        backupEmailsJson: JSON.stringify(social_parseBackupEmails_(p.backupEmails || [])),
        mustChangePassword: 'false',
        tempCodeSalt: '',
        tempCodeHash: '',
        tempCodeExpiresAt: '',
        resetTokenSalt: '',
        resetTokenHash: '',
        resetRequestedAt: '',
        resetDelivery: '',
        resetRequestedBy: '',
        lastPasswordChangedAt: '',
        lastTemporaryLoginAt: ''
      };
      social_append_('USERS', row);
      user = social_findUserByIdentifier_(req.projectId, userId) || row;
      social_upsertProfile_(req.projectId, { id: social_cleanSlug_(username), name: displayName, color: '#38bdf8', status: 'Around' });
    }
    if (String(user.disabled) === 'true') throw new Error('This account is disabled.');

    social_upsertAuthProvider_(req.projectId, user.userId, provider, providerUserId || email, email, displayName, identity.photoUrl || '', identity.raw || identity);
    const session = social_createSession_(req.projectId, user.userId, user.displayName || displayName, p.userAgent);
    social_audit_(req.projectId, 'cloud_auth_sign_in', user.userId, { provider: provider, email: social_maskEmail_(email) });
    return { ok: true, provider: provider, session: session, user: social_publicUser_(user), state: social_publicState_(req.projectId) };
  } finally {
    lock.releaseLock();
  }
}

function social_linkCloudProvider_(req) {
  const session = social_requireSession_(req, false);
  const p = req.payload || {};
  const provider = social_cleanSlug_(p.provider || 'google');
  const identity = provider === 'google' ? social_verifyGoogleIdToken_(p.idToken || p.credential || p.token || '') : social_verifyExternalIdentity_(provider, p);
  const providerUserId = social_cleanText_(identity.providerUserId || identity.sub || identity.email || '', 240);
  if (!providerUserId) throw new Error('Cloud provider did not return an ID to link.');
  social_upsertAuthProvider_(req.projectId, session.userId, provider, providerUserId, social_normalizeEmail_(identity.email || ''), social_cleanText_(identity.displayName || identity.name || '', 80), identity.photoUrl || '', identity.raw || identity);
  social_audit_(req.projectId, 'link_cloud_provider', session.userId, { provider: provider, providerUserId: providerUserId });
  return { ok: true, linked: true, provider: provider };
}

function social_sendInviteOrTemporaryPassword_(req) {
  const session = social_requireSession_(req, false);
  const p = req.payload || {};
  const target = social_normalizeEmail_(p.email || p.target || '');
  if (!target || !social_isEmail_(target)) throw new Error('A valid recipient email is required.');
  const existing = social_rows_('USERS').filter(function(u){ return u.projectId === req.projectId; });
  if (existing.length >= OURSPACE_SOCIAL_COMPAT.MAX_REGISTERED_USERS_PER_PROJECT && !social_findUserByIdentifier_(req.projectId, target)) throw new Error('Only two OurSpace profile accounts are allowed.');

  let user = social_findUserByIdentifier_(req.projectId, target);
  if (!user) {
    const now = new Date().toISOString();
    const username = social_cleanUsername_(p.username || target.split('@')[0]);
    const row = {
      projectId: req.projectId,
      userId: social_randomId_('user'),
      username: username,
      displayName: social_cleanText_(p.displayName || username, 80),
      salt: '',
      passHash: '',
      role: 'member',
      avatar: p.avatar || '💌',
      status: 'Invited',
      createdAt: now,
      updatedAt: now,
      disabled: 'false',
      email: target,
      phone: social_normalizePhone_(p.phone || ''),
      backupEmailsJson: JSON.stringify(social_parseBackupEmails_(p.backupEmails || [])),
      mustChangePassword: 'true',
      tempCodeSalt: '',
      tempCodeHash: '',
      tempCodeExpiresAt: '',
      resetTokenSalt: '',
      resetTokenHash: '',
      resetRequestedAt: '',
      resetDelivery: '',
      resetRequestedBy: '',
      lastPasswordChangedAt: '',
      lastTemporaryLoginAt: ''
    };
    social_append_('USERS', row);
    user = social_findUserByIdentifier_(req.projectId, target) || row;
  }
  const reset = social_createResetForUser_(req, user, target, 'email', p);
  const subject = social_cleanText_(p.subject || 'You are invited to OurSpace', 180);
  const body = [
    'You have been invited to OurSpace.',
    '',
    'Temporary sign-in code/password: ' + reset.code,
    'Reset/sign-in link: ' + reset.resetLink,
    'Expires: ' + reset.expiresAt,
    '',
    'After signing in, create a new permanent password. This private site is limited to the two OurSpace profile accounts, but each account can stay signed in on unlimited devices.'
  ].join('\n');
  MailApp.sendEmail(target, subject, body);
  social_audit_(req.projectId, 'send_invite_email', session.userId, { target: social_maskEmail_(target), accountId: user.userId });
  return { ok: true, sent: true, target: social_maskEmail_(target), accountId: user.userId, expiresAt: reset.expiresAt };
}

function social_upsertAuthProvider_(projectId, userId, provider, providerUserId, email, displayName, photoUrl, raw) {
  const now = new Date().toISOString();
  const existing = social_rows_('AUTH_PROVIDERS').find(function(row){ return row.projectId === projectId && row.provider === provider && row.providerUserId === providerUserId; });
  const patch = { projectId: projectId, userId: userId, provider: provider, providerUserId: providerUserId, email: email || '', displayName: displayName || '', photoUrl: photoUrl || '', updatedAt: now, lastSignInAt: now, rawJson: JSON.stringify(raw || {}) };
  if (existing) social_updateRow_('AUTH_PROVIDERS', existing._row, patch);
  else social_append_('AUTH_PROVIDERS', social_mergeObjects_({ createdAt: now }, patch));
}

function social_verifyGoogleIdToken_(idToken) {
  idToken = String(idToken || '').trim();
  if (!idToken) throw new Error('Google ID token is required for cloud auth.');
  const response = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  const code = response.getResponseCode();
  if (code < 200 || code >= 300) throw new Error('Google cloud auth token could not be verified.');
  const data = JSON.parse(response.getContentText() || '{}');
  const expectedAud = PropertiesService.getScriptProperties().getProperty(OURSPACE_SOCIAL_COMPAT.GOOGLE_CLIENT_ID_PROPERTY);
  if (expectedAud && data.aud !== expectedAud) throw new Error('Google token audience does not match this OurSpace backend.');
  if (data.email_verified && String(data.email_verified) !== 'true') throw new Error('Google email is not verified.');
  return { provider: 'google', providerUserId: data.sub || '', sub: data.sub || '', email: social_normalizeEmail_(data.email || ''), displayName: data.name || data.email || 'Google user', photoUrl: data.picture || '', raw: data };
}

function social_verifyExternalIdentity_(provider, p) {
  if (!p || !p.providerUserId || !p.providerTokenVerifiedByFrontend) throw new Error('Only Google ID token verification is built in. For other providers, add a provider-specific verification webhook before trusting sign-in.');
  return { provider: provider, providerUserId: social_cleanText_(p.providerUserId, 240), email: social_normalizeEmail_(p.email || ''), displayName: social_cleanText_(p.displayName || p.email || 'Cloud user', 80), photoUrl: social_cleanText_(p.photoUrl || '', 2000), raw: p };
}

function social_iceConfig_(req) {
  const props = PropertiesService.getScriptProperties();
  const raw = props.getProperty(OURSPACE_SOCIAL_COMPAT.TURN_CONFIG_JSON_PROPERTY);
  let iceServers = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
  if (raw) {
    try { iceServers = JSON.parse(raw); }
    catch (_err) { iceServers = iceServers; }
  }
  return { ok: true, iceServers: iceServers, note: 'Apps Script supplies signaling only. Browser WebRTC still needs STUN/TURN for NAT traversal.' };
}

function social_saveAppRecord_(req, session) {
  const p = req.payload || {};
  const collection = social_cleanSlug_(p.collection || 'general');
  const id = social_cleanText_(p.id || social_randomId_('record'), 160);
  const now = new Date().toISOString();
  const payload = p.data !== undefined ? p.data : p.payload;
  const row = social_rows_('APP_RECORDS').find(function(r){ return r.projectId === req.projectId && r.collection === collection && r.id === id; });
  const next = { projectId: req.projectId, collection: collection, id: id, owner: social_cleanText_(p.owner || session.userId, 120), createdAt: row ? row.createdAt : now, updatedAt: now, jsonData: JSON.stringify(payload || {}) };
  if (row) social_updateRow_('APP_RECORDS', row._row, next);
  else social_append_('APP_RECORDS', next);
  social_audit_(req.projectId, 'save_app_record', session.userId, { collection: collection, id: id });
  return { ok: true, record: social_publicAppRecord_(next) };
}

function social_listAppRecords_(req, session) {
  const p = req.payload || {};
  const collection = social_cleanSlug_(p.collection || 'general');
  const records = social_rows_('APP_RECORDS').filter(function(r){ return r.projectId === req.projectId && r.collection === collection; }).slice(-Number(p.limit || 500)).map(publicAppRecord_);
  return { ok: true, collection: collection, records: records };
}

function social_saveMediaAsset_(req, session) {
  const p = req.payload || {};
  const kind = social_cleanSlug_(p.kind || p.mediaKind || 'media');
  const media = social_saveMediaIfNeeded_(req.projectId, p.dataUrl || p.media || p.blobDataUrl, p.mimeType || p.mediaType, p.name || kind, session.userId, true);
  const id = social_cleanText_(p.id || media.id || social_randomId_('media'), 160);
  const now = new Date().toISOString();
  const row = {
    projectId: req.projectId,
    id: id,
    kind: kind,
    owner: social_cleanText_(p.owner || session.userId, 120),
    room: social_cleanSlug_(p.room || p.conversationId || 'general'),
    messageId: social_cleanText_(p.messageId || '', 160),
    name: social_cleanText_(p.name || media.name || kind, 240),
    mimeType: social_cleanText_(p.mimeType || p.mediaType || media.mimeType || '', 120),
    size: Number(media.size || p.size || 0),
    url: social_cleanText_(media.url || p.url || '', 2000),
    driveFileId: social_cleanText_(media.driveFileId || '', 240),
    durationMs: Number(p.durationMs || 0),
    thumbnailUrl: social_cleanText_(p.thumbnailUrl || '', 2000),
    transcript: social_cleanText_(p.transcript || '', 20000),
    faceMetaJson: JSON.stringify(p.faceMeta || p.faceMetadata || {}),
    createdAt: p.createdAt || now,
    updatedAt: now
  };
  social_append_('MEDIA_ASSETS', row);
  social_audit_(req.projectId, 'save_media_asset', session.userId, { kind: kind, id: id, mimeType: row.mimeType, size: row.size });
  return { ok: true, media: social_publicMediaAsset_(row) };
}

function social_saveVoiceMessage_(req, session) {
  const p = req.payload || {};
  const mediaRes = social_saveMediaAsset_(social_mergeRequestPayload_(req, { kind: 'voice', room: p.conversationId || p.room || 'messenger' }), session).media;
  const row = {
    projectId: req.projectId,
    id: social_cleanText_(p.id || social_randomId_('voice'), 160),
    conversationId: social_cleanSlug_(p.conversationId || p.room || 'messenger'),
    author: social_cleanText_(p.author || session.displayName || session.userId, 80),
    mediaId: mediaRes.id,
    durationMs: Number(p.durationMs || mediaRes.durationMs || 0),
    waveformJson: JSON.stringify(p.waveform || []),
    transcript: social_cleanText_(p.transcript || mediaRes.transcript || '', 20000),
    status: social_cleanText_(p.status || 'saved', 40),
    createdAt: new Date().toISOString()
  };
  social_append_('VOICE_MESSAGES', row);
  social_messengerEnvelope_(social_mergeRequestPayload_(req, { type: 'voice-message', payload: { voiceMessage: social_publicVoiceMessage_(row), media: mediaRes } }), session);
  return { ok: true, voiceMessage: social_publicVoiceMessage_(row), media: mediaRes };
}

function social_saveVideo_(req, session) {
  const p = req.payload || {};
  const mediaRes = social_saveMediaAsset_(social_mergeRequestPayload_(req, { kind: p.kind || 'video', room: p.conversationId || p.room || 'videos' }), session).media;
  const row = {
    projectId: req.projectId,
    id: social_cleanText_(p.id || social_randomId_('video'), 160),
    author: social_cleanText_(p.author || session.displayName || session.userId, 80),
    mediaId: mediaRes.id,
    kind: social_cleanSlug_(p.kind || 'video'),
    thumbnailUrl: social_cleanText_(p.thumbnailUrl || mediaRes.thumbnailUrl || '', 2000),
    durationMs: Number(p.durationMs || mediaRes.durationMs || 0),
    transcript: social_cleanText_(p.transcript || mediaRes.transcript || '', 20000),
    status: social_cleanText_(p.status || 'saved', 40),
    createdAt: new Date().toISOString()
  };
  social_append_('VIDEOS', row);
  return { ok: true, video: social_publicVideo_(row), media: mediaRes };
}

function social_requestTranscription_(req, session) {
  const p = req.payload || {};
  const mediaId = social_cleanText_(p.mediaId || '', 160);
  const media = social_rows_('MEDIA_ASSETS').find(function(m){ return m.projectId === req.projectId && m.id === mediaId; });
  if (!media) throw new Error('Media asset not found for transcription.');
  const webhook = PropertiesService.getScriptProperties().getProperty(OURSPACE_SOCIAL_COMPAT.SPEECH_TO_TEXT_WEBHOOK_PROPERTY);
  const id = social_randomId_('tr');
  const now = new Date().toISOString();
  let status = 'queued';
  let providerJson = {};
  let transcript = '';
  if (p.transcript) {
    transcript = social_cleanText_(p.transcript, 20000);
    status = 'complete';
  } else if (webhook) {
    const payload = { projectId: req.projectId, transcriptId: id, mediaId: media.id, mediaUrl: media.url, mimeType: media.mimeType, language: p.language || 'en-US' };
    const headers = {};
    const apiKey = PropertiesService.getScriptProperties().getProperty(OURSPACE_SOCIAL_COMPAT.SPEECH_TO_TEXT_API_KEY_PROPERTY);
    if (apiKey) headers.Authorization = 'Bearer ' + apiKey;
    const response = UrlFetchApp.fetch(webhook, { method: 'post', contentType: 'application/json', payload: JSON.stringify(payload), headers: headers, muteHttpExceptions: true });
    providerJson = { responseCode: response.getResponseCode(), response: response.getContentText().slice(0, 2000) };
    status = response.getResponseCode() >= 200 && response.getResponseCode() < 300 ? 'sent_to_provider' : 'provider_error';
  }
  const row = { projectId: req.projectId, id: id, mediaId: media.id, sourceKind: social_cleanSlug_(p.sourceKind || media.kind || 'media'), language: social_cleanText_(p.language || 'en-US', 40), transcript: transcript, status: status, provider: webhook ? 'webhook' : 'browser/manual', createdBy: session.userId, createdAt: now, updatedAt: now, providerJson: JSON.stringify(providerJson) };
  social_append_('TRANSCRIPTS', row);
  if (transcript) social_updateMediaTranscript_(req.projectId, media.id, transcript);
  return { ok: true, transcript: social_publicTranscript_(row), providerConfigured: Boolean(webhook) };
}

function social_saveTranscript_(req, session) {
  const p = req.payload || {};
  const id = social_cleanText_(p.id || social_randomId_('tr'), 160);
  const mediaId = social_cleanText_(p.mediaId || '', 160);
  const now = new Date().toISOString();
  const existing = social_rows_('TRANSCRIPTS').find(function(t){ return t.projectId === req.projectId && t.id === id; });
  const row = { projectId: req.projectId, id: id, mediaId: mediaId, sourceKind: social_cleanSlug_(p.sourceKind || 'media'), language: social_cleanText_(p.language || 'en-US', 40), transcript: social_cleanText_(p.transcript || '', 20000), status: social_cleanText_(p.status || 'complete', 40), provider: social_cleanText_(p.provider || 'browser/manual', 80), createdBy: session.userId, createdAt: existing ? existing.createdAt : now, updatedAt: now, providerJson: JSON.stringify(p.providerJson || {}) };
  if (existing) social_updateRow_('TRANSCRIPTS', existing._row, row);
  else social_append_('TRANSCRIPTS', row);
  if (mediaId && row.transcript) social_updateMediaTranscript_(req.projectId, mediaId, row.transcript);
  social_audit_(req.projectId, 'save_transcript', session.userId, { id: id, mediaId: mediaId, status: row.status });
  return { ok: true, transcript: social_publicTranscript_(row) };
}

function social_updateMediaTranscript_(projectId, mediaId, transcript) {
  const row = social_rows_('MEDIA_ASSETS').find(function(m){ return m.projectId === projectId && m.id === mediaId; });
  if (row) social_updateRow_('MEDIA_ASSETS', row._row, { transcript: transcript, updatedAt: new Date().toISOString() });
}

function social_saveFaceProfile_(req, session) {
  const p = req.payload || {};
  if (p.consent !== true && String(p.consent) !== 'true') throw new Error('Face profile storage requires explicit user consent.');
  const descriptor = social_normalizeDescriptor_(p.descriptor || p.faceDescriptor || []);
  if (!descriptor.length) throw new Error('Face descriptor array is required. The browser face model creates this; Apps Script stores/matches it.');
  const profileId = social_cleanText_(p.profileId || social_randomId_('face'), 160);
  const now = new Date().toISOString();
  const existing = social_rows_('FACE_PROFILES').find(function(f){ return f.projectId === req.projectId && f.profileId === profileId; });
  const row = { projectId: req.projectId, userId: social_cleanText_(p.userId || session.userId, 120), profileId: profileId, label: social_cleanText_(p.label || session.displayName || 'Face profile', 120), descriptorJson: JSON.stringify(descriptor), modelsVersion: social_cleanText_(p.modelsVersion || 'browser-model', 120), consent: 'true', createdAt: existing ? existing.createdAt : now, updatedAt: now };
  if (existing) social_updateRow_('FACE_PROFILES', existing._row, row);
  else social_append_('FACE_PROFILES', row);
  social_audit_(req.projectId, 'save_face_profile', session.userId, { profileId: profileId });
  return { ok: true, faceProfile: social_publicFaceProfile_(row) };
}

function social_listFaceProfiles_(req, session) {
  const p = req.payload || {};
  const profiles = social_rows_('FACE_PROFILES').filter(function(f){ return f.projectId === req.projectId && (!p.userId || f.userId === p.userId); }).map(publicFaceProfile_);
  return { ok: true, faceProfiles: profiles };
}

function social_matchFaceDescriptor_(req, session) {
  const descriptor = social_normalizeDescriptor_((req.payload || {}).descriptor || (req.payload || {}).faceDescriptor || []);
  if (!descriptor.length) throw new Error('Descriptor is required for face matching.');
  const matches = social_rows_('FACE_PROFILES').filter(social_byProject_(req.projectId)).map(function(f){
    const saved = social_normalizeDescriptor_(social_parseJson_(f.descriptorJson, []));
    return { profile: social_publicFaceProfile_(f), distance: social_descriptorDistance_(descriptor, saved) };
  }).filter(function(m){ return isFinite(m.distance); }).sort(function(a,b){ return a.distance - b.distance; });
  const best = matches.length ? matches[0] : null;
  return { ok: true, matched: Boolean(best && best.distance <= OURSPACE_SOCIAL_COMPAT.FACE_MATCH_THRESHOLD), bestMatch: best, matches: matches.slice(0, 10), threshold: OURSPACE_SOCIAL_COMPAT.FACE_MATCH_THRESHOLD };
}

function social_saveFilterPreset_(req, session) {
  const p = req.payload || {};
  const id = social_cleanText_(p.id || social_randomId_('filter'), 160);
  const now = new Date().toISOString();
  const existing = social_rows_('FILTER_PRESETS').find(function(f){ return f.projectId === req.projectId && f.id === id; });
  const row = { projectId: req.projectId, id: id, createdBy: social_cleanText_(p.createdBy || session.userId, 120), name: social_cleanText_(p.name || 'Filter preset', 160), kind: social_cleanSlug_(p.kind || 'face-filter'), configJson: JSON.stringify(p.config || p.faceMeta || {}), thumbnailUrl: social_cleanText_(p.thumbnailUrl || '', 2000), createdAt: existing ? existing.createdAt : now, updatedAt: now };
  if (existing) social_updateRow_('FILTER_PRESETS', existing._row, row);
  else social_append_('FILTER_PRESETS', row);
  return { ok: true, filterPreset: social_publicFilterPreset_(row) };
}

function social_listFilterPresets_(req, session) {
  const p = req.payload || {};
  const kind = p.kind ? social_cleanSlug_(p.kind) : '';
  const filters = social_rows_('FILTER_PRESETS').filter(function(f){ return f.projectId === req.projectId && (!kind || f.kind === kind); }).map(publicFilterPreset_);
  return { ok: true, filterPresets: filters };
}

function social_createCall_(req, session) {
  const p = req.payload || {};
  const callId = social_cleanText_(p.callId || social_randomId_('call'), 160);
  const room = social_cleanSlug_(p.room || p.conversationId || callId);
  const now = Date.now();
  const participants = [{ id: social_cleanText_(p.peerId || session.userId, 120), userId: session.userId, name: social_cleanText_(p.name || session.displayName || 'Caller', 80), role: 'host', audio: p.audio !== false, video: p.video !== false, screen: Boolean(p.screen), joinedAt: now, lastSeen: now }];
  const row = { projectId: req.projectId, callId: callId, room: room, kind: social_cleanSlug_(p.kind || 'video'), createdBy: session.userId, createdAt: now, updatedAt: now, status: 'active', participantsJson: JSON.stringify(participants), settingsJson: JSON.stringify(p.settings || {}) };
  social_append_('CALLS', row);
  social_addCallEvent_(req.projectId, callId, room, 'call-created', { call: social_publicCall_(row) }, 'server', '*');
  social_messengerEnvelope_(social_mergeRequestPayload_(req, { type: 'call-start', payload: { callId: callId, room: room, kind: row.kind } }), session);
  return { ok: true, call: social_publicCall_(row), iceConfig: social_iceConfig_(req).iceServers };
}

function social_joinCall_(req, session) {
  const p = req.payload || {};
  const call = social_findCall_(req.projectId, p.callId, p.room);
  if (call.status !== 'active') throw new Error('This call is not active.');
  const now = Date.now();
  let participants = social_parseJson_(call.participantsJson, []).filter(function(x){ return now - Number(x.lastSeen || 0) < OURSPACE_SOCIAL_COMPAT.SESSION_TTL_MS; });
  const peerId = social_cleanText_(p.peerId || session.userId, 120);
  participants = participants.filter(function(x){ return x.id !== peerId; });
  participants.push({ id: peerId, userId: session.userId, name: social_cleanText_(p.name || session.displayName || 'Caller', 80), role: 'member', audio: p.audio !== false, video: p.video !== false, screen: Boolean(p.screen), joinedAt: now, lastSeen: now });
  social_updateRow_('CALLS', call._row, { updatedAt: now, participantsJson: JSON.stringify(participants) });
  social_addCallEvent_(req.projectId, call.callId, call.room, 'participants', participants, 'server', '*');
  return { ok: true, callId: call.callId, room: call.room, peerId: peerId, participants: participants, iceConfig: social_iceConfig_(req).iceServers };
}

function social_leaveCall_(req, session) {
  const p = req.payload || {};
  const call = social_findCall_(req.projectId, p.callId, p.room);
  const peerId = social_cleanText_(p.peerId || session.userId, 120);
  const participants = social_parseJson_(call.participantsJson, []).filter(function(x){ return x.id !== peerId; });
  social_updateRow_('CALLS', call._row, { updatedAt: Date.now(), participantsJson: JSON.stringify(participants), status: participants.length ? call.status : 'ended' });
  social_addCallEvent_(req.projectId, call.callId, call.room, 'participants', participants, 'server', '*');
  return { ok: true, callId: call.callId, participants: participants, status: participants.length ? call.status : 'ended' };
}

function social_endCall_(req, session) {
  const p = req.payload || {};
  const call = social_findCall_(req.projectId, p.callId, p.room);
  social_updateRow_('CALLS', call._row, { updatedAt: Date.now(), status: 'ended', participantsJson: '[]' });
  social_addCallEvent_(req.projectId, call.callId, call.room, 'call-ended', { endedBy: session.userId, at: Date.now() }, session.userId, '*');
  social_messengerEnvelope_(social_mergeRequestPayload_(req, { type: 'call-end', payload: { callId: call.callId, room: call.room } }), session);
  return { ok: true, callId: call.callId, status: 'ended' };
}

function social_callSignal_(req, session) {
  const p = req.payload || {};
  const call = social_findCall_(req.projectId, p.callId, p.room);
  const from = social_cleanText_(p.from || p.peerId || session.userId, 120);
  const to = social_cleanText_(p.to || '*', 120);
  const event = social_addCallEvent_(req.projectId, call.callId, call.room, social_cleanText_(p.type || 'signal', 60), { from: from, to: to, sdp: p.sdp, candidate: p.candidate, payload: p.payload }, from, to);
  return { ok: true, event: social_publicCallEvent_(event) };
}

function social_pollCall_(req, session) {
  const p = req.payload || {};
  const call = social_findCall_(req.projectId, p.callId, p.room);
  const peerId = social_cleanText_(p.peerId || session.userId, 120);
  const since = Number(p.since || 0);
  const now = Date.now();
  const participants = social_touchCallParticipant_(call, peerId, p);
  const events = social_rows_('CALL_EVENTS').filter(function(e){ return e.projectId === req.projectId && e.callId === call.callId && Number(e.createdAt) > since && (e.toPeer === '*' || e.toPeer === peerId || e.fromPeer === peerId); }).slice(-200).map(publicCallEvent_);
  social_pruneCallEvents_();
  return { ok: true, now: now, call: social_publicCall_(social_findCall_(req.projectId, call.callId, '')), participants: participants, events: events };
}

function social_findCall_(projectId, callId, room) {
  const cleanCallId = social_cleanText_(callId || '', 160);
  const cleanRoom = room ? social_cleanSlug_(room) : '';
  const call = social_rows_('CALLS').find(function(c){ return c.projectId === projectId && ((cleanCallId && c.callId === cleanCallId) || (cleanRoom && c.room === cleanRoom)); });
  if (!call) throw new Error('Call not found.');
  return call;
}

function social_touchCallParticipant_(call, peerId, p) {
  const now = Date.now();
  let participants = social_parseJson_(call.participantsJson, []).filter(function(x){ return now - Number(x.lastSeen || 0) < OURSPACE_SOCIAL_COMPAT.SESSION_TTL_MS; });
  participants.forEach(function(x){
    if (x.id === peerId) {
      x.lastSeen = now;
      if (p.audio !== undefined) x.audio = Boolean(p.audio);
      if (p.video !== undefined) x.video = Boolean(p.video);
      if (p.screen !== undefined) x.screen = Boolean(p.screen);
    }
  });
  social_updateRow_('CALLS', call._row, { updatedAt: now, participantsJson: JSON.stringify(participants) });
  return participants;
}

function social_addCallEvent_(projectId, callId, room, type, payload, fromPeer, toPeer) {
  const row = { projectId: projectId, callId: callId, room: room, id: social_randomId_('callevt'), fromPeer: fromPeer || 'server', toPeer: toPeer || '*', type: type, payloadJson: JSON.stringify(payload || {}), createdAt: Date.now() };
  social_append_('CALL_EVENTS', row);
  social_pruneCallEvents_();
  return row;
}

function social_pruneCallEvents_() {
  const cutoff = Date.now() - OURSPACE_SOCIAL_COMPAT.CALL_EVENT_TTL_MS;
  const sheet = social_getSheet_('CALL_EVENTS');
  social_rows_('CALL_EVENTS').filter(function(r){ return Number(r.createdAt || 0) < cutoff; }).sort(function(a,b){ return b._row - a._row; }).forEach(function(row){ sheet.deleteRow(row._row); });
}

function social_normalizeDescriptor_(value) {
  if (typeof value === 'string') value = social_parseJson_(value, []);
  if (!Array.isArray(value)) return [];
  return value.map(function(n){ return Number(n); }).filter(function(n){ return isFinite(n); });
}

function social_descriptorDistance_(a, b) {
  if (!a.length || !b.length || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) { const d = a[i] - b[i]; sum += d * d; }
  return Math.sqrt(sum);
}

function social_mergeRequestPayload_(req, patch) {
  const out = { method: req.method, action: req.action, projectId: req.projectId, projectName: req.projectName, sessionToken: req.sessionToken, callback: req.callback, payload: {} };
  Object.keys(req.payload || {}).forEach(function(k){ out.payload[k] = req.payload[k]; });
  Object.keys(patch || {}).forEach(function(k){ out.payload[k] = patch[k]; });
  return out;
}

function social_publicAppRecord_(r) { return { collection: r.collection, id: r.id, owner: r.owner, createdAt: r.createdAt, updatedAt: r.updatedAt, data: social_parseJson_(r.jsonData, {}) }; }
function social_publicCall_(c) { return { callId: c.callId, room: c.room, kind: c.kind, createdBy: c.createdBy, createdAt: Number(c.createdAt), updatedAt: Number(c.updatedAt), status: c.status, participants: social_parseJson_(c.participantsJson, []), settings: social_parseJson_(c.settingsJson, {}) }; }
function social_publicCallEvent_(e) { return { id: e.id, callId: e.callId, room: e.room, from: e.fromPeer, to: e.toPeer, type: e.type, payload: social_parseJson_(e.payloadJson, {}), createdAt: Number(e.createdAt) }; }
function social_publicMediaAsset_(m) { return { id: m.id, kind: m.kind, owner: m.owner, room: m.room, messageId: m.messageId, name: m.name, mimeType: m.mimeType, size: Number(m.size || 0), url: m.url, driveFileId: m.driveFileId, durationMs: Number(m.durationMs || 0), thumbnailUrl: m.thumbnailUrl, transcript: m.transcript, faceMeta: social_parseJson_(m.faceMetaJson, {}), createdAt: m.createdAt, updatedAt: m.updatedAt }; }
function social_publicVoiceMessage_(v) { return { id: v.id, conversationId: v.conversationId, author: v.author, mediaId: v.mediaId, durationMs: Number(v.durationMs || 0), waveform: social_parseJson_(v.waveformJson, []), transcript: v.transcript, status: v.status, createdAt: v.createdAt }; }
function social_publicVideo_(v) { return { id: v.id, author: v.author, mediaId: v.mediaId, kind: v.kind, thumbnailUrl: v.thumbnailUrl, durationMs: Number(v.durationMs || 0), transcript: v.transcript, status: v.status, createdAt: v.createdAt }; }
function social_publicTranscript_(t) { return { id: t.id, mediaId: t.mediaId, sourceKind: t.sourceKind, language: t.language, transcript: t.transcript, status: t.status, provider: t.provider, createdBy: t.createdBy, createdAt: t.createdAt, updatedAt: t.updatedAt, providerData: social_parseJson_(t.providerJson, {}) }; }
function social_publicFaceProfile_(f) { return { userId: f.userId, profileId: f.profileId, label: f.label, descriptorLength: social_normalizeDescriptor_(social_parseJson_(f.descriptorJson, [])).length, modelsVersion: f.modelsVersion, consent: String(f.consent) === 'true', createdAt: f.createdAt, updatedAt: f.updatedAt }; }
function social_publicFilterPreset_(f) { return { id: f.id, createdBy: f.createdBy, name: f.name, kind: f.kind, config: social_parseJson_(f.configJson, {}), thumbnailUrl: f.thumbnailUrl, createdAt: f.createdAt, updatedAt: f.updatedAt }; }

function social_publicState_(projectId) {
  social_pruneSessions_();
  social_pruneStories_();
  const profiles = social_rows_('PROFILES').filter(social_byProject_(projectId)).map(function(p){ return { id: p.id, name: p.name, color: p.color, status: p.status }; });
  const feed = social_rows_('FEED').filter(social_byProject_(projectId)).map(publicPost_).sort(byDateDesc_).slice(0, 250);
  const stories = social_rows_('STORIES').filter(social_byProject_(projectId)).filter(function(s){ return Number(s.expiresAt) > Date.now(); }).map(publicStory_).sort(byDateDesc_).slice(0, 120);
  const messages = social_rows_('MESSAGES').filter(social_byProject_(projectId));
  const channels = {};
  social_rows_('CHANNELS').filter(social_byProject_(projectId)).forEach(function(c){ channels[c.name] = []; });
  messages.forEach(function(m){ if (!channels[m.channel]) channels[m.channel] = []; channels[m.channel].push(social_publicMessage_(m)); });
  Object.keys(channels).forEach(function(k){ channels[k] = channels[k].sort(byDateAsc_).slice(-250); });
  if (!channels.general) channels.general = [];
  const events = social_rows_('EVENTS').filter(social_byProject_(projectId)).map(publicEvent_).sort(function(a,b){ return String(a.start).localeCompare(String(b.start)); }).slice(0, 250);
  const calls = social_rows_('CALLS').filter(social_byProject_(projectId)).map(publicCall_).filter(function(c){ return c.status === 'active'; }).slice(-50);
  const mediaAssets = social_rows_('MEDIA_ASSETS').filter(social_byProject_(projectId)).map(publicMediaAsset_).sort(byDateDesc_).slice(0, 250);
  const voiceMessages = social_rows_('VOICE_MESSAGES').filter(social_byProject_(projectId)).map(publicVoiceMessage_).sort(byDateDesc_).slice(0, 250);
  const videos = social_rows_('VIDEOS').filter(social_byProject_(projectId)).map(publicVideo_).sort(byDateDesc_).slice(0, 250);
  const filterPresets = social_rows_('FILTER_PRESETS').filter(social_byProject_(projectId)).map(publicFilterPreset_).slice(-200);
  return { appName: 'OurSpace', profiles: profiles, channels: channels, feed: feed, stories: stories, onlineUsers: social_onlineUsers_(projectId), events: events, calls: calls, mediaAssets: mediaAssets, voiceMessages: voiceMessages, videos: videos, filterPresets: filterPresets, updatedAt: new Date().toISOString() };
}

function social_onlineUsers_(projectId) {
  const cutoff = Date.now() - OURSPACE_SOCIAL_COMPAT.ACTIVE_WINDOW_MS;
  const byUser = {};
  social_rows_('SESSIONS').forEach(function(s){
    if (s.projectId !== projectId || Number(s.lastSeen) < cutoff) return;
    const key = String(s.userId || '');
    if (!key) return;
    const current = byUser[key];
    if (!current || Number(s.lastSeen || 0) > Number(current.lastSeen || 0)) byUser[key] = s;
  });
  return Object.keys(byUser).map(function(key){ return byUser[key]; }).sort(function(a,b){ return Number(b.lastSeen || 0) - Number(a.lastSeen || 0); }).map(function(s){
    return { clientId: s.userId, name: s.displayName, status: 'online', color: '#38bdf8', section: 'site', activeGame: '', activeGameTitle: '', lastSeen: Number(s.lastSeen), connectedAt: Number(s.createdAt), deviceSessionsAllowed: 'unlimited' };
  });
}

function social_messengerHistory_(projectId) {
  return social_rows_('MESSENGER').filter(social_byProject_(projectId)).slice(-1000).map(publicEnvelope_);
}

function social_manifest_(req) {
  const short = req.projectName.slice(0, 12) || 'Project';
  return { ok: true, manifest: { name: req.projectName, short_name: short, display: 'standalone', background_color: '#000305', theme_color: '#003C42', description: 'Private small-network OurSpace.', backendVersion: OURSPACE_SOCIAL_COMPAT.VERSION, capabilities: ['password-auth','google-cloud-auth','email-reset','email-invites','permanent-spreadsheet-storage','drive-media-storage','webrtc-signaling-mailbox','voice-message-storage','video-storage','camera-capture-storage','speech-to-text-webhook-or-browser-transcripts','face-descriptor-storage-and-matching','filter-preset-storage'] } };
}

function social_requireSession_(req, optional) {
  social_pruneSessions_();
  if (!req.sessionToken) {
    if (optional) return null;
    throw new Error('Login required.');
  }
  const session = social_rows_('SESSIONS').find(function(s){ return s.token === req.sessionToken && s.projectId === req.projectId; });
  if (!session) {
    if (optional) return null;
    throw new Error('Session expired. Please log in again.');
  }
  social_updateSessionSeen_(session.token);
  return session;
}

function social_createSession_(projectId, userId, displayName, userAgent) {
  const token = social_randomId_('sess');
  const now = Date.now();
  social_append_('SESSIONS', { token: token, projectId: projectId, userId: userId, displayName: displayName, createdAt: now, lastSeen: now, userAgent: social_cleanText_(userAgent || '', 240) });
  return { sessionToken: token, token: token, projectId: projectId, userId: userId, displayName: displayName, createdAt: now, maxActiveUsers: OURSPACE_SOCIAL_COMPAT.MAX_ACTIVE_USERS_PER_PROJECT, deviceSessionPolicy: OURSPACE_SOCIAL_COMPAT.DEVICE_SESSION_POLICY, unlimitedDeviceSessions: true };
}

function social_updateSessionSeen_(token) {
  const row = social_rows_('SESSIONS').find(function(s){ return s.token === token; });
  if (row) social_updateRow_('SESSIONS', row._row, { lastSeen: Date.now() });
}

function social_enforceActiveLimit_(projectId, currentToken) {
  // Account count is restricted at registration/sign-up. Device sessions are intentionally unlimited,
  // so signing in on a phone, tablet, browser, and desktop never forces another session to log out.
  return true;
}

function social_pruneSessions_() {
  const cutoff = Date.now() - OURSPACE_SOCIAL_COMPAT.SESSION_TTL_MS;
  const sheet = social_getSheet_('SESSIONS');
  const rows = social_rows_('SESSIONS').filter(function(r){ return Number(r.lastSeen || 0) < cutoff; }).sort(function(a,b){ return b._row - a._row; });
  rows.forEach(function(row){ sheet.deleteRow(row._row); });
}

function social_pruneStories_() {
  const sheet = social_getSheet_('STORIES');
  const expired = social_rows_('STORIES').filter(function(r){ return Number(r.expiresAt || 0) < Date.now(); }).sort(function(a,b){ return b._row - a._row; });
  expired.forEach(function(row){ sheet.deleteRow(row._row); });
}

function social_upsertProfile_(projectId, p) {
  const profile = { projectId: projectId, id: social_cleanSlug_(p.id || p.name), name: social_cleanText_(p.name || 'Friend', 80), color: /^#[0-9a-f]{6}$/i.test(String(p.color || '')) ? p.color : '#38bdf8', status: social_cleanText_(p.status || 'Around', 120), updatedAt: new Date().toISOString() };
  const existing = social_rows_('PROFILES').find(function(row){ return row.projectId === projectId && row.id === profile.id; });
  if (existing) social_updateRow_('PROFILES', existing._row, profile);
  else social_append_('PROFILES', profile);
  return { id: profile.id, name: profile.name, color: profile.color, status: profile.status };
}

function social_ensureChannel_(projectId, name) {
  const channel = social_cleanSlug_(name || 'general');
  const exists = social_rows_('CHANNELS').some(function(c){ return c.projectId === projectId && c.name === channel; });
  if (!exists) social_append_('CHANNELS', { projectId: projectId, name: channel, createdAt: new Date().toISOString() });
}

function social_findRoom_(projectId, roomCode) {
  const room = social_rows_('ROOMS').find(function(r){ return r.projectId === projectId && r.room === social_cleanSlug_(roomCode || 'room'); });
  if (!room) throw new Error('Room not found.');
  return room;
}

function social_touchParticipant_(room, peerId, handRaised) {
  const now = Date.now();
  const participants = social_parseJson_(room.participantsJson, []).filter(function(x){ return now - Number(x.lastSeen || 0) < OURSPACE_SOCIAL_COMPAT.ACTIVE_WINDOW_MS; });
  participants.forEach(function(p){ if (p.id === peerId) { p.lastSeen = now; if (handRaised !== null && handRaised !== undefined) p.handRaised = handRaised; } });
  social_updateRow_('ROOMS', room._row, { updatedAt: now, participantsJson: JSON.stringify(participants) });
  return participants;
}

function social_addRoomEvent_(projectId, room, type, payload, fromPeer, toPeer) {
  const row = { projectId: projectId, room: room, id: social_randomId_('signal'), fromPeer: fromPeer || 'server', toPeer: toPeer || '*', type: type, payloadJson: JSON.stringify(payload || {}), createdAt: Date.now(), deliveredJson: '[]' };
  social_append_('SIGNALS', row);
  social_pruneSignals_();
  return row;
}

function social_pruneSignals_() {
  const cutoff = Date.now() - 30 * 60 * 1000;
  const sheet = social_getSheet_('SIGNALS');
  social_rows_('SIGNALS').filter(function(r){ return Number(r.createdAt || 0) < cutoff; }).sort(function(a,b){ return b._row - a._row; }).forEach(function(row){ sheet.deleteRow(row._row); });
}

function social_saveMediaIfNeeded_(projectId, dataUrl, mimeType, name, createdBy, force) {
  const value = String(dataUrl || '');
  if (!value) return { url: '', mimeType: mimeType || '', id: '' };
  if (!force && value.length <= OURSPACE_SOCIAL_COMPAT.MAX_MEDIA_CHARS_IN_SHEET) return { url: value, mimeType: mimeType || social_guessMime_(value), id: '' };
  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return { url: value.slice(0, 2000), mimeType: mimeType || '', id: '' };
  const type = mimeType || match[1] || 'application/octet-stream';
  const bytes = Utilities.base64Decode(match[2]);
  const safeName = social_cleanSlug_(name || 'upload') + '-' + Date.now();
  const blob = Utilities.newBlob(bytes, type, safeName);
  const file = social_getUploadFolder_().createFile(blob);
  if (OURSPACE_SOCIAL_COMPAT.PUBLIC_DRIVE_FILE_LINKS) file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const url = OURSPACE_SOCIAL_COMPAT.PUBLIC_DRIVE_FILE_LINKS ? ('https://drive.google.com/uc?export=download&id=' + file.getId()) : file.getUrl();
  const id = social_randomId_('file');
  social_append_('FILES', { projectId: projectId, id: id, name: safeName, mimeType: type, size: bytes.length, url: url, driveFileId: file.getId(), createdBy: createdBy || '', createdAt: new Date().toISOString() });
  return { id: id, name: safeName, mimeType: type, size: bytes.length, url: url, driveFileId: file.getId() };
}

function social_publicPost_(p) { return { id: p.id, author: p.author, text: p.text, media: p.media, mediaType: p.mediaType, createdAt: p.createdAt, reactions: social_parseJson_(p.reactionsJson, []), comments: social_parseJson_(p.commentsJson, []) }; }
function social_publicMessage_(m) { return { id: m.id, author: m.author, text: m.text, media: m.media, mediaType: m.mediaType, origin: m.origin, createdAt: m.createdAt, reactions: social_parseJson_(m.reactionsJson, []) }; }
function social_publicStory_(s) { return { id: s.id, author: s.author, text: s.text, media: s.media, mediaType: s.mediaType, createdAt: s.createdAt, expiresAt: Number(s.expiresAt), reactions: social_parseJson_(s.reactionsJson, []) }; }
function social_publicEnvelope_(e) { return { id: e.id, type: e.type, clientId: e.clientId, createdAt: e.createdAt, payload: social_parseJson_(e.payloadJson, {}), appName: e.appName || 'OurSpace Messenger' }; }
function social_publicEvent_(e) { return { id: e.id, title: e.title, start: e.start, end: e.end, location: e.location, description: e.description, createdBy: e.createdBy, createdAt: e.createdAt, updatedAt: e.updatedAt, calendarEventId: e.calendarEventId }; }
function social_publicUser_(u) { return { userId: u.userId, accountId: u.userId, username: u.username, displayName: u.displayName, role: u.role, avatar: u.avatar, status: u.status, email: u.email || '', phone: u.phone || '', backupEmails: social_parseBackupEmails_(u.backupEmailsJson), mustChangePassword: String(u.mustChangePassword || '') === 'true' }; }

function social_output_(obj, callback) {
  const text = JSON.stringify(obj);
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + text + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(text).setMimeType(ContentService.MimeType.JSON);
}

function social_getSpreadsheet_() {
  return site_ensureDatabase_();
}

function social_getUploadFolder_() {
  return site_ensureUploadFolder_();
}

function social_getSheet_(key) {
  const headers = OURSPACE_SOCIAL_COMPAT.SHEETS[key];
  const ss = social_getSpreadsheet_();
  let sheet = ss.getSheetByName('Compat_' + key);
  if (!sheet) sheet = ss.insertSheet('Compat_' + key);
  const width = headers.length;
  const first = sheet.getRange(1, 1, 1, width).getValues()[0];
  const mismatch = headers.some(function(h, i){ return first[i] !== h; });
  if (mismatch) sheet.getRange(1, 1, 1, width).setValues([headers]);
  return sheet;
}

function social_rows_(key) {
  const sheet = social_getSheet_(key);
  const values = sheet.getDataRange().getValues();
  const headers = OURSPACE_SOCIAL_COMPAT.SHEETS[key];
  if (values.length <= 1) return [];
  return values.slice(1).map(function(row, i){
    const obj = { _row: i + 2 };
    headers.forEach(function(h, c){ obj[h] = row[c]; });
    return obj;
  });
}

function social_append_(key, obj) {
  const sheet = social_getSheet_(key);
  const headers = OURSPACE_SOCIAL_COMPAT.SHEETS[key];
  sheet.appendRow(headers.map(function(h){ return obj[h] !== undefined ? obj[h] : ''; }));
}

function social_updateRow_(key, rowNumber, patch) {
  const sheet = social_getSheet_(key);
  const headers = OURSPACE_SOCIAL_COMPAT.SHEETS[key];
  const current = sheet.getRange(rowNumber, 1, 1, headers.length).getValues()[0];
  const next = headers.map(function(h, i){ return patch[h] !== undefined ? patch[h] : current[i]; });
  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([next]);
}

function social_audit_(projectId, action, userId, details) {
  social_append_('AUDIT', { at: new Date().toISOString(), projectId: projectId, action: action, userId: userId || '', detailsJson: JSON.stringify(details || {}) });
}

function social_hashPassword_(password, salt) {
  const raw = salt + ':' + String(password || '');
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw, Utilities.Charset.UTF_8);
  return Utilities.base64Encode(bytes);
}

function social_randomId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 20);
}

function social_cleanSlug_(value) {
  const cleaned = String(value || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 64);
  return cleaned || 'default';
}

function social_cleanUsername_(value) {
  return String(value || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.@-]+/g, '').slice(0, 80);
}

function social_cleanText_(value, limit) {
  return String(value == null ? '' : value).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, limit || 4000);
}

function social_parseJson_(value, fallback) {
  try { return JSON.parse(value || ''); }
  catch (_err) { return fallback; }
}

function social_mergeObjects_(a, b) {
  const out = {};
  Object.keys(a || {}).forEach(function(k){ out[k] = a[k]; });
  Object.keys(b || {}).forEach(function(k){ if (out[k] === undefined) out[k] = b[k]; });
  return out;
}

function social_byProject_(projectId) { return function(row){ return row.projectId === projectId; }; }
function social_byDateDesc_(a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); }
function social_byDateAsc_(a, b) { return String(a.createdAt || '').localeCompare(String(b.createdAt || '')); }
function social_guessMime_(dataUrl) { const m = String(dataUrl || '').match(/^data:([^;]+)/); return m ? m[1] : ''; }
    return {
      "setup": (typeof setup === 'function' ? setup : null),
      "doGet": (typeof doGet === 'function' ? doGet : null),
      "doPost": (typeof doPost === 'function' ? doPost : null),
      "doOptions": (typeof doOptions === 'function' ? doOptions : null),
      "OURSPACE_CREATE_BACKEND_SPREADSHEET": (typeof OURSPACE_CREATE_BACKEND_SPREADSHEET === 'function' ? OURSPACE_CREATE_BACKEND_SPREADSHEET : null),
      "OURSPACE_SET_PASSCODES_ONCE": (typeof OURSPACE_SET_PASSCODES_ONCE === 'function' ? OURSPACE_SET_PASSCODES_ONCE : null),
      "OURSPACE_ADD_DEMO_LINK_OPTIONAL": (typeof OURSPACE_ADD_DEMO_LINK_OPTIONAL === 'function' ? OURSPACE_ADD_DEMO_LINK_OPTIONAL : null)
    };
  })();
  return TDM92_MODULE_CACHE.ourspace;
}


/******************************************************************************
 * Voice Studio Superbot integration adapter
 * ---------------------------------------------------------------------------
 * These routes make the merged Superbot frontend contract available inside the
 * Voice Studio backend without changing the locked deployment URL or the voice
 * synthesis routes. They intentionally use Script Properties for lightweight
 * chat, learning, tasks, and file-index state so they work in the same Google
 * Apps Script web app as the existing Voice Studio routes.
 ******************************************************************************/
var VOICE_STUDIO_SUPERBOT_PREFIX = 'VS_SUPERBOT_';
var VOICE_STUDIO_SUPERBOT_BACKEND_URL = 'https://script.google.com/macros/s/AKfycbzoGmgKoNq_d-KorQsuBYYeJYQ0pAVk4a7Y3zFxdJncbU7GlMK_Dg2irgbR1zPfyiPr4g/exec';

function voiceStudioSuperbotId_(prefix) {
  return prefix + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 18);
}
function voiceStudioSuperbotProps_() {
  return PropertiesService.getScriptProperties();
}
function voiceStudioSuperbotRead_(key, fallback) {
  var raw = voiceStudioSuperbotProps_().getProperty(VOICE_STUDIO_SUPERBOT_PREFIX + key);
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch (err) { return fallback; }
}
function voiceStudioSuperbotWrite_(key, value) {
  voiceStudioSuperbotProps_().setProperty(VOICE_STUDIO_SUPERBOT_PREFIX + key, JSON.stringify(value));
  return value;
}
function voiceStudioSuperbotList_(key) {
  var list = voiceStudioSuperbotRead_(key, []);
  return Array.isArray(list) ? list : [];
}
function voiceStudioSuperbotPush_(key, item, limit) {
  var list = voiceStudioSuperbotList_(key);
  list.unshift(item);
  if (limit) list = list.slice(0, limit);
  voiceStudioSuperbotWrite_(key, list);
  return item;
}
function voiceStudioSuperbotText_(value) {
  return String(value == null ? '' : value);
}
function voiceStudioSuperbotLower_(value) {
  return voiceStudioSuperbotText_(value).toLowerCase();
}
function voiceStudioSuperbotHash_(value) {
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, voiceStudioSuperbotText_(value));
  return bytes.map(function(b){ var v=(b<0?b+256:b).toString(16); return v.length===1?'0'+v:v; }).join('');
}
function voiceStudioSuperbotChatCreate_(req) {
  var id = req.conversationId || voiceStudioSuperbotId_('chat');
  var conv = { conversationId:id, title:req.title || 'Voice Studio Superbot', createdAt:new Date().toISOString(), updatedAt:new Date().toISOString(), source:'voice_studio' };
  var conversations = voiceStudioSuperbotList_('CONVERSATIONS').filter(function(c){ return c.conversationId !== id; });
  conversations.unshift(conv);
  voiceStudioSuperbotWrite_('CONVERSATIONS', conversations.slice(0, 100));
  voiceStudioSuperbotWrite_('MESSAGES_' + id, voiceStudioSuperbotRead_('MESSAGES_' + id, []));
  return { ok:true, conversationId:id, conversation:conv };
}
function voiceStudioSuperbotChatList_(req) {
  return { ok:true, conversations:voiceStudioSuperbotList_('CONVERSATIONS').slice(0, Number(req.limit || 100)) };
}
function voiceStudioSuperbotChatMessages_(req) {
  var id = req.conversationId || 'voice-studio-superbot-main';
  return { ok:true, conversationId:id, messages:voiceStudioSuperbotList_('MESSAGES_' + id).slice(0, Number(req.limit || 200)) };
}
function voiceStudioSuperbotReply_(req) {
  var text = voiceStudioSuperbotText_(req.message || req.text);
  var lower = voiceStudioSuperbotLower_(text);
  var ctx = req.context || {};
  var profileInput = (ctx && ctx.profileInput) || (req.voiceStudio && req.voiceStudio.profileInput) || {};
  var sourceDecision = (ctx && ctx.sourceDecision) || (ctx.profile && ctx.profile.sourceDecision) || null;
  if (lower.indexOf('source') >= 0 || lower.indexOf('model') >= 0 || lower.indexOf('sample') >= 0) {
    return sourceDecision && sourceDecision.selected ? 'Source is locked to ' + (sourceDecision.selected.speaker || 'source') + ' — ' + (sourceDecision.selected.file || '') + '. Score: ' + (sourceDecision.score || 'n/a') + '.' : 'No source is locked yet. Activate the voice source bot, then run voice.source.resolve.';
  }
  if (lower.indexOf('zip') >= 0 || lower.indexOf('export') >= 0 || lower.indexOf('wav') >= 0) {
    return 'Use Download character voice ZIP. The package contains manifest.json and CharacterName_SourceName.wav with the character information embedded in the manifest.';
  }
  if (lower.indexOf('scan') >= 0 || lower.indexOf('audit') >= 0) {
    return 'Voice Studio Superbot can scan GitHub/project files through github.scan/projects.scanGithub and index local text through file.indexText.';
  }
  return 'Voice Studio Superbot is merged into the voice workflow for ' + (profileInput.name || 'the current character') + '. I can analyze biome + race + gender identity, route source decisions, save learning, create tasks, and coordinate voice export through the locked backend.';
}
function voiceStudioSuperbotChatSend_(req) {
  var id = req.conversationId || 'voice-studio-superbot-main';
  var messages = voiceStudioSuperbotList_('MESSAGES_' + id);
  var userMessage = { id:voiceStudioSuperbotId_('msg'), role:'user', content:voiceStudioSuperbotText_(req.message || req.text), createdAt:new Date().toISOString() };
  var reply = voiceStudioSuperbotReply_(req);
  var botMessage = { id:voiceStudioSuperbotId_('msg'), role:'assistant', content:reply, intent:'voice_studio_superbot', createdAt:new Date().toISOString() };
  messages.push(userMessage, botMessage);
  voiceStudioSuperbotWrite_('MESSAGES_' + id, messages.slice(-400));
  var convs = voiceStudioSuperbotList_('CONVERSATIONS');
  if (!convs.some(function(c){ return c.conversationId === id; })) convs.unshift({ conversationId:id, title:req.title || 'Voice Studio Superbot', createdAt:new Date().toISOString() });
  convs = convs.map(function(c){ if(c.conversationId===id){ c.updatedAt=new Date().toISOString(); c.lastMessage={ text:reply, role:'assistant' }; } return c; });
  voiceStudioSuperbotWrite_('CONVERSATIONS', convs.slice(0, 100));
  return { ok:true, conversationId:id, reply:reply, message:botMessage, messages:[userMessage, botMessage], lockedBackendUrl:VOICE_STUDIO_SUPERBOT_BACKEND_URL };
}
function voiceStudioSuperbotLearningRecord_(req) {
  var item = { id:req.id || voiceStudioSuperbotId_('mem'), scope:req.scope || 'voice_studio', key:req.key || 'voice_memory', value:req.value || req.text || '', profileInput:req.profileInput || null, createdAt:new Date().toISOString() };
  voiceStudioSuperbotPush_('MEMORY', item, 300);
  return { ok:true, memory:item };
}
function voiceStudioSuperbotLearningSearch_(req) {
  var q = voiceStudioSuperbotLower_(req.query || req.q || '');
  var hits = voiceStudioSuperbotList_('MEMORY').filter(function(m){ return !q || voiceStudioSuperbotLower_(JSON.stringify(m)).indexOf(q) >= 0; });
  return { ok:true, count:hits.length, memories:hits.slice(0, Number(req.limit || 50)) };
}
function voiceStudioSuperbotTasksFromText_(req) {
  var text = voiceStudioSuperbotText_(req.text || req.message || '');
  var parts = text.split(/\n|\.|;|•|-/).map(function(x){ return x.trim(); }).filter(Boolean);
  var tasks = parts.filter(function(line){ return /\b(add|fix|make|create|change|merge|scan|test|export|download|lock|update|route|wire|verify)\b/i.test(line); }).slice(0, 25).map(function(task){ return { id:voiceStudioSuperbotId_('task'), task:task, status:'open', source:'voice_studio_superbot', createdAt:new Date().toISOString() }; });
  var list = voiceStudioSuperbotList_('TASKS');
  tasks.forEach(function(t){ list.unshift(t); });
  voiceStudioSuperbotWrite_('TASKS', list.slice(0, 300));
  return { ok:true, extractedCount:tasks.length, tasks:tasks };
}
function voiceStudioSuperbotTasksList_(req) {
  var status = req.status || '';
  var list = voiceStudioSuperbotList_('TASKS').filter(function(t){ return !status || t.status === status; });
  return { ok:true, count:list.length, tasks:list.slice(0, Number(req.limit || 100)) };
}
function voiceStudioSuperbotFileIndexText_(req) {
  var text = voiceStudioSuperbotText_(req.text || req.content || '');
  var item = { id:voiceStudioSuperbotId_('file'), name:req.name || req.filename || 'voice-studio-file.txt', source:req.source || 'voice-studio', size:text.length, hash:voiceStudioSuperbotHash_(text), preview:text.slice(0, 900), createdAt:new Date().toISOString() };
  voiceStudioSuperbotPush_('FILES', item, 300);
  return { ok:true, indexed:item };
}
function voiceStudioSuperbotSearch_(req) {
  var q = voiceStudioSuperbotLower_(req.query || req.q || '');
  var files = voiceStudioSuperbotList_('FILES').filter(function(f){ return !q || voiceStudioSuperbotLower_(JSON.stringify(f)).indexOf(q) >= 0; });
  var memories = voiceStudioSuperbotList_('MEMORY').filter(function(m){ return !q || voiceStudioSuperbotLower_(JSON.stringify(m)).indexOf(q) >= 0; });
  return { ok:true, query:q, files:files.slice(0, Number(req.limit || 50)), memories:memories.slice(0, Number(req.limit || 50)) };
}
function voiceStudioSuperbotCoverage_(req) {
  return { ok:true, projectId:req.projectId || 'voice_studio', lockedBackendUrl:VOICE_STUDIO_SUPERBOT_BACKEND_URL, routes:['chats.send','learning.record','tasks.fromText','file.indexText','files.search','voice.source.resolve','voice.synth.renderWav','voice.synth.patch','presets.save','github.scan'], counts:{ conversations:voiceStudioSuperbotList_('CONVERSATIONS').length, memories:voiceStudioSuperbotList_('MEMORY').length, tasks:voiceStudioSuperbotList_('TASKS').length, indexedFiles:voiceStudioSuperbotList_('FILES').length }, note:'Superbot adapter is active for Voice Studio and uses the same locked backend deployment.' };
}
function voiceStudioSuperbotVoiceSimulate_(req) {
  var sliders = req.sliders || req.voiceProfile || {};
  var webSpeech = { pitch: Math.max(0.3, Math.min(2, 0.55 + Number(sliders.pitch || 5) / 5)), rate: Math.max(0.35, Math.min(1.8, 0.65 + Number(sliders.speed || 5) / 8)), volume: 1 };
  return { ok:true, simulation:{ text:req.text || req.phrase || '', accentName:req.accentName || req.biome || 'Voice Studio accent', sliders:sliders, webSpeech:webSpeech, note:'Guide voice simulation. Use voice.synth.renderWav for backend WAV guide or local Voice Studio renderer for source-derived WAV.' } };
}
function voiceStudioSuperbotVoiceJobCreate_(req) {
  if (typeof createVoiceJob_ === 'function') return createVoiceJob_(req);
  var job = { id:voiceStudioSuperbotId_('voicejob'), request:req, status:'queued', createdAt:new Date().toISOString() };
  voiceStudioSuperbotPush_('VOICE_JOBS', job, 200);
  return { ok:true, job:job };
}
function voiceStudioSuperbotConvertedFeatures_(req) {
  return { ok:true, botName:'voice-studio-superbot', lockedBackendUrl:VOICE_STUDIO_SUPERBOT_BACKEND_URL, convertedFeatures:[
    { source:'Superbot frontend/assets/superbot.js', target:'voice_studio/s/superbot-voice-brain.js', detail:'Chat state, file search, task extraction, learning, voice simulation, and backend calls adapted into Voice Studio.' },
    { source:'Superbot Code.gs', target:'voice_studio/b/backend.gs adapter routes', detail:'chats.*, learning.*, tasks.*, file.indexText, files.search, project.coverage, and voice.simulate compatibility routes added.' },
    { source:'Voice Studio source bot', target:'Voice Superbot panel', detail:'Bot source decisions, scanner output, backend source resolve, synth patch, ZIP export, and local WAV workflow are connected.' }
  ] };
}
