(function (root) {
  'use strict';

  const LOCK = root.BELAVADOS_DMEDITOR_BACKEND_LOCK || Object.freeze({
    projectId: 'dmeditor', projectName: 'DMEditor',
    githubRepository: 'tyrannosaurusdm92/BelavadosProjects', githubBranch: 'main',
    repositoryPath: 'DMEditor', jsonRepositoryPath: 'DMEditor/json',
    appsScriptUrl: 'https://script.google.com/macros/s/AKfycbxe3P6MBofPEhPfTAaz05TWEYhScX9QgpHzBKCdwPGnvzvVoyfllu0bAghZKqHs4E3hGg/exec',
    appsScriptLibraryUrl: 'https://script.google.com/macros/library/d/1v06thwdjlv-j82hqHibJF3_gik7i8p9fFfK9nj0EOfi8VHhwT11jK5Eb/4',
    sessionStorageKey: 'Belavados_DMEditor_Backend_Session_v1', logicalCollection: 'dmeditor-json-files',
    defaultWorldFile: 'dm_map.json'
  });
  const DEFAULT_CONFIG = Object.freeze({
    schema: 'belavados-map-backend-config-v2',
    localApiBase: '/api',
    appsScriptUrl: LOCK.appsScriptUrl,
    appsScriptLibraryUrl: LOCK.appsScriptLibraryUrl,
    jsonManifest: 'json/index.json',
    defaultWorldFile: LOCK.defaultWorldFile,
    githubRepository: LOCK.githubRepository,
    githubBranch: LOCK.githubBranch,
    repositoryPath: LOCK.repositoryPath,
    jsonRepositoryPath: LOCK.jsonRepositoryPath,
    projectId: LOCK.projectId
  });

  function safeFilename(value) {
    const name = String(value || LOCK.defaultWorldFile).replace(/^.*[\\/]/, '').replace(/[^A-Za-z0-9._-]/g, '_');
    return /\.(?:json|geojson)$/i.test(name) ? name : `${name}.json`;
  }
  function storage() {
    try { return root.localStorage; } catch (_) { return null; }
  }
  function loadSession() {
    try { return JSON.parse(storage()?.getItem(LOCK.sessionStorageKey) || 'null'); } catch (_) { return null; }
  }
  function saveSession(value) {
    try {
      if (value?.token) storage()?.setItem(LOCK.sessionStorageKey, JSON.stringify(value));
      else storage()?.removeItem(LOCK.sessionStorageKey);
    } catch (_) {}
  }
  async function responseJson(response) {
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); }
    catch (_) {
      const match = text.match(/^[^(]*\((.*)\)\s*;?\s*$/s);
      if (match) { try { data = JSON.parse(match[1]); } catch (_ignore) {} }
      if (!data) throw new Error(`Backend returned non-JSON content (${response.status}).`);
    }
    if (!response.ok || data?.ok === false || data?.status === 'error') {
      throw new Error(data?.error || data?.message || `Backend request failed (${response.status}).`);
    }
    return data;
  }
  async function loadConfig() {
    let external = {};
    try {
      const response = await fetch('data/backend.config.json', {cache: 'no-store'});
      if (response.ok) external = await response.json();
    } catch (_) {}
    // Security/correctness lock: deployment URLs, repository, branch and DMEditor paths cannot be overridden by files or UI.
    return Object.freeze({...DEFAULT_CONFIG, ...external,
      appsScriptUrl: LOCK.appsScriptUrl,
      appsScriptLibraryUrl: LOCK.appsScriptLibraryUrl,
      githubRepository: LOCK.githubRepository,
      githubBranch: LOCK.githubBranch,
      repositoryPath: LOCK.repositoryPath,
      jsonRepositoryPath: LOCK.jsonRepositoryPath,
      projectId: LOCK.projectId
    });
  }
  function textToBase64(text) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error || new Error('Could not encode the JSON file.'));
      reader.onload = () => resolve(String(reader.result || '').split(',')[1] || '');
      reader.readAsDataURL(new Blob([text], {type: 'application/json;charset=utf-8'}));
    });
  }

  class BackendClient {
    constructor(config) {
      this.config = Object.freeze({...DEFAULT_CONFIG, ...(config || {}),
        appsScriptUrl: LOCK.appsScriptUrl, appsScriptLibraryUrl: LOCK.appsScriptLibraryUrl,
        githubRepository: LOCK.githubRepository, githubBranch: LOCK.githubBranch,
        repositoryPath: LOCK.repositoryPath, jsonRepositoryPath: LOCK.jsonRepositoryPath,
        projectId: LOCK.projectId
      });
      this.mode = 'static';
      this.session = loadSession();
      this.health = null;
      this._recordCache = null;
    }
    get authenticated() { return Boolean(this.session?.token); }
    get user() { return this.session?.user || null; }
    get backendUrl() { return LOCK.appsScriptUrl; }
    async detect() {
      try {
        const result = await responseJson(await fetch(`${this.config.localApiBase}/health`, {cache: 'no-store'}));
        if (result.ok !== false) { this.mode = 'local'; this.health = result; return this.mode; }
      } catch (_) {}
      try {
        const url = `${LOCK.appsScriptUrl}?action=health&_=${Date.now()}`;
        this.health = await responseJson(await fetch(url, {cache: 'no-store', redirect: 'follow'}));
        this.mode = 'apps-script';
        if (this.authenticated) {
          try { await this.me(); } catch (_) { this.clearSession(); }
        }
        return this.mode;
      } catch (_) {
        // Keep the fixed backend selected even when offline/CORS-blocked; local export/import still remain available.
        this.mode = 'apps-script';
        return this.mode;
      }
    }
    clearSession() { this.session = null; this._recordCache = null; saveSession(null); }
    async requestApps(payload, {withToken = true} = {}) {
      const request = {...payload, projectId: payload.projectId || LOCK.projectId};
      if (withToken && this.session?.token && !request.token) request.token = this.session.token;
      const form = new URLSearchParams({payload: JSON.stringify(request)});
      const response = await fetch(LOCK.appsScriptUrl, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
        body: form.toString(),
        redirect: 'follow'
      });
      return responseJson(response);
    }
    async signIn(email, password) {
      const result = await this.requestApps({action: 'auth.login', email, password, projectId: LOCK.projectId, userAgent: navigator.userAgent}, {withToken: false});
      this.session = {token: result.token, user: result.user, session: result.session}; saveSession(this.session); return result;
    }
    async signUp(displayName, email, password) {
      const result = await this.requestApps({action: 'auth.signup', displayName, email, password, projectId: LOCK.projectId,
        projects: ['dmeditor','worldforge','lifesimulator','playerzone'], userAgent: navigator.userAgent}, {withToken: false});
      this.session = {token: result.token, user: result.user, session: result.session}; saveSession(this.session); return result;
    }
    async me() {
      if (!this.authenticated) throw new Error('Sign in to the fixed Belavadös backend first.');
      const result = await this.requestApps({action: 'auth.me'});
      this.session.user = result.user; this.session.session = result.session; saveSession(this.session); return result;
    }
    async signOut() {
      if (this.authenticated) { try { await this.requestApps({action: 'auth.logout'}); } catch (_) {} }
      this.clearSession(); return {ok: true};
    }
    async listBackendFiles() {
      if (this.mode === 'local') return responseJson(await fetch(`${this.config.localApiBase}/json/list`, {cache: 'no-store'}));
      if (!this.authenticated) return {ok: true, files: []};
      const result = await this.requestApps({action: 'files.list', projectId: LOCK.projectId, limit: 500});
      const files = (result.files || []).filter(item => /\.(?:json|geojson)$/i.test(item.name || '')).map(item => ({
        ...item, source: 'apps-script-drive', backendOnly: true, logicalName: item.name
      }));
      return {ok: true, files};
    }
    async read(filename) {
      const safe = safeFilename(filename);
      if (this.mode === 'local') return responseJson(await fetch(`${this.config.localApiBase}/json/read?file=${encodeURIComponent(safe)}`, {cache: 'no-store'}));
      const response = await fetch(`json/${safe}`, {cache: 'no-store'});
      if (!response.ok) throw new Error(`Could not load DMEditor/json/${safe}.`);
      return {ok: true, filename: safe, data: await response.json(), source: 'github-pages'};
    }
    async records() {
      if (!this.authenticated) return [];
      if (this._recordCache) return this._recordCache;
      const result = await this.requestApps({action: 'records.list', projectId: LOCK.projectId, collection: LOCK.logicalCollection, limit: 1000});
      this._recordCache = result.records || []; return this._recordCache;
    }
    async upsertFileRecord(name, file, extra) {
      const rows = await this.records();
      const existing = rows.filter(r => r.name === name).sort((a,b) => String(b.updatedAt).localeCompare(String(a.updatedAt)))[0];
      const data = {logicalName: name, fileId: file.fileId, driveFileId: file.driveFileId, driveUrl: file.driveUrl,
        size: file.size, mimeType: file.mimeType, savedAt: new Date().toISOString(), repositoryPath: `${LOCK.repositoryPath}/json/${name}`, ...extra};
      let result;
      if (existing) result = await this.requestApps({action: 'records.update', recordId: existing.recordId, projectId: LOCK.projectId,
        collection: LOCK.logicalCollection, name, data});
      else result = await this.requestApps({action: 'records.create', projectId: LOCK.projectId, collection: LOCK.logicalCollection, name, data});
      this._recordCache = null; return result.record;
    }
    async save(filename, data, options = {}) {
      const safe = safeFilename(filename);
      if (this.mode === 'local') {
        const payload = {filename: safe, data, createSnapshot: options.createSnapshot === true};
        return responseJson(await fetch(`${this.config.localApiBase}/json/save`, {
          method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(payload)
        }));
      }
      if (!this.authenticated) throw new Error('Sign in to the fixed Belavadös backend before saving.');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      const uploadName = options.snapshot ? safe.replace(/\.(json|geojson)$/i, `_${stamp}.$1`) : safe;
      const text = typeof data === 'string' ? data : JSON.stringify(data);
      const base64 = await textToBase64(text);
      const result = await this.requestApps({action: 'files.upload', projectId: LOCK.projectId, name: uploadName,
        mimeType: 'application/json', base64, description: `DMEditor complete map save for ${LOCK.repositoryPath}/json/${safe}`,
        tags: ['dmeditor','map-editor','json', options.snapshot ? 'snapshot' : 'current']});
      const record = await this.upsertFileRecord(safe, result.file, {snapshot: Boolean(options.snapshot), uploadName});
      return {ok: true, filename: safe, uploadName, file: result.file, record, bytes: text.length, source: 'apps-script-drive'};
    }
    async saveBundle(files, options = {}) {
      const results = [];
      for (const [filename, data] of Object.entries(files)) results.push(await this.save(filename, data, options));
      return results;
    }
    async manifest() {
      const files = new Map();
      try {
        const response = await fetch(this.config.jsonManifest, {cache: 'no-store'});
        if (response.ok) {
          for (const item of (await response.json()).files || []) {
            const name = String(item.name || item.path || '').replace(/^json\//, '');
            files.set(name, {...item, name, source: 'DMEditor/json index'});
          }
        }
      } catch (_) {}
      try {
        for (const item of await this.githubJsonFiles()) files.set(item.name, item);
      } catch (_) {}
      try {
        for (const item of (await this.listBackendFiles()).files || []) {
          const key = `backend:${item.fileId || item.name}:${item.createdAt || ''}`;
          files.set(key, item);
        }
      } catch (_) {}
      return {ok: true, files: [...files.values()].filter(f => /\.(?:json|geojson)$/i.test(f.name || f.path || ''))};
    }
    githubRepository() { return LOCK.githubRepository; }
    async githubJsonFiles() {
      const repository = LOCK.githubRepository, branch = LOCK.githubBranch, out = [];
      const visit = async folder => {
        const response = await fetch(`https://api.github.com/repos/${repository}/contents/${folder}?ref=${encodeURIComponent(branch)}`, {
          headers: {Accept: 'application/vnd.github+json'}, cache: 'no-store'
        });
        if (response.status === 404) return;
        if (!response.ok) throw new Error(`GitHub DMEditor/json scan failed (${response.status}).`);
        for (const item of await response.json()) {
          if (item.type === 'dir') await visit(item.path);
          else if (/\.(?:json|geojson)$/i.test(item.name)) out.push({
            name: item.path.replace(new RegExp(`^${LOCK.jsonRepositoryPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/?`), ''),
            path: item.path, downloadUrl: item.download_url, size: item.size, sha: item.sha, source: 'GitHub DMEditor/json'
          });
        }
      };
      await visit(LOCK.jsonRepositoryPath); return out;
    }
  }

  root.BelavadosBackend = Object.freeze({BackendClient, loadConfig, DEFAULT_CONFIG, LOCK});
})(typeof globalThis !== 'undefined' ? globalThis : window);
