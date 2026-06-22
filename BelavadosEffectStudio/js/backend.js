(() => {
  'use strict';

  const cfg = window.BELAVADOS_BACKEND_CONFIG || {};
  const GAS_URL = cfg.appsScriptUrl || '';
  const GITHUB_URL = cfg.githubUrl || window.location.href;
  const PROJECT_KEY = cfg.projectKey || 'belavados-effect-layer-studio-cloud-project';
  const AUTOSAVE_KEY = cfg.autosaveKey || 'belavados-effect-layer-studio-autosave-v1';

  const $ = (id) => document.getElementById(id);
  const statusEl = $('backendStatusText');
  const pillEl = $('backendStatePill');
  const autosaveToggle = $('backendAutosaveToggle');
  let deferredInstallPrompt = null;

  function setBackendStatus(message, tone = 'ready') {
    if (statusEl) statusEl.textContent = message;
    if (pillEl) {
      pillEl.textContent = tone === 'error' ? 'Needs Check' : tone === 'ok' ? 'Connected' : tone === 'working' ? 'Working' : 'Ready';
      pillEl.dataset.tone = tone;
    }
    if (window.BelavadosEffectStudio?.setStatus) {
      window.BelavadosEffectStudio.setStatus(message);
    }
  }

  function getStudioApi() {
    const api = window.BelavadosEffectStudio;
    if (!api || typeof api.getProject !== 'function' || typeof api.loadProject !== 'function') {
      throw new Error('Studio API is not ready yet.');
    }
    return api;
  }

  function getProjectSnapshot() {
    const api = getStudioApi();
    const project = api.getProject(false);
    return {
      action: 'saveProject',
      projectKey: PROJECT_KEY,
      source: 'BelavadosEffectStudioGitHub',
      githubUrl: GITHUB_URL,
      deploymentId: cfg.deploymentId || '',
      savedAt: new Date().toISOString(),
      project
    };
  }

  function saveLocalBackup(payload) {
    localStorage.setItem(PROJECT_KEY, JSON.stringify(payload));
    localStorage.setItem(AUTOSAVE_KEY, new Date().toISOString());
    if (autosaveToggle) localStorage.setItem(AUTOSAVE_KEY + ':enabled', autosaveToggle.checked ? '1' : '0');
  }

  function getLocalBackup() {
    const raw = localStorage.getItem(PROJECT_KEY);
    return raw ? JSON.parse(raw) : null;
  }

  function formPostToAppsScript(payload) {
    return new Promise((resolve) => {
      if (!GAS_URL) return resolve(false);
      const iframeName = 'belavados_backend_post_' + Date.now();
      const iframe = document.createElement('iframe');
      iframe.name = iframeName;
      iframe.title = 'Belavados backend save target';
      iframe.hidden = true;
      iframe.style.display = 'none';

      const form = document.createElement('form');
      form.method = 'POST';
      form.action = GAS_URL;
      form.target = iframeName;
      form.enctype = 'application/x-www-form-urlencoded';
      form.hidden = true;
      form.style.display = 'none';

      const action = document.createElement('input');
      action.name = 'action';
      action.value = 'saveProject';
      form.appendChild(action);

      const key = document.createElement('input');
      key.name = 'projectKey';
      key.value = PROJECT_KEY;
      form.appendChild(key);

      const data = document.createElement('textarea');
      data.name = 'payload';
      data.value = JSON.stringify(payload);
      form.appendChild(data);

      let done = false;
      const cleanup = () => {
        if (done) return;
        done = true;
        setTimeout(() => {
          iframe.remove();
          form.remove();
        }, 1500);
        resolve(true);
      };
      iframe.addEventListener('load', cleanup, { once: true });
      document.body.appendChild(iframe);
      document.body.appendChild(form);
      form.submit();
      setTimeout(cleanup, 2200);
    });
  }

  function jsonpLoadFromAppsScript() {
    return new Promise((resolve, reject) => {
      if (!GAS_URL) return reject(new Error('No Apps Script URL configured.'));
      const callbackName = 'belavadosBackendLoad_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const url = new URL(GAS_URL);
      url.searchParams.set('action', 'loadProject');
      url.searchParams.set('projectKey', PROJECT_KEY);
      url.searchParams.set('callback', callbackName);
      url.searchParams.set('_', String(Date.now()));

      const cleanup = () => {
        delete window[callbackName];
        script.remove();
      };

      window[callbackName] = (data) => {
        cleanup();
        resolve(data);
      };

      script.onerror = () => {
        cleanup();
        reject(new Error('Backend JSONP load failed.'));
      };

      script.src = url.toString();
      document.head.appendChild(script);
      setTimeout(() => {
        if (window[callbackName]) {
          cleanup();
          reject(new Error('Backend load timed out.'));
        }
      }, 10000);
    });
  }

  async function pingBackend() {
    setBackendStatus('Testing Apps Script deployment...', 'working');
    try {
      const url = new URL(GAS_URL);
      url.searchParams.set('route', 'manifest');
      url.searchParams.set('_', String(Date.now()));
      await fetch(url.toString(), { method: 'GET', mode: 'no-cors', cache: 'no-store' });
      setBackendStatus('Backend launcher responded. Apps Script deployment is reachable.', 'ok');
    } catch (err) {
      console.error(err);
      setBackendStatus('Backend could not be reached from this page. Check deployment access and URL.', 'error');
    }
  }

  async function saveCloudCopy() {
    setBackendStatus('Saving project snapshot...', 'working');
    try {
      const payload = getProjectSnapshot();
      saveLocalBackup(payload);
      const posted = await formPostToAppsScript(payload);
      if (posted) {
        setBackendStatus('Project snapshot sent to Apps Script and saved as a browser backup.', 'ok');
      } else {
        setBackendStatus('Browser backup saved. Apps Script URL is missing, so cloud save was skipped.', 'error');
      }
    } catch (err) {
      console.error(err);
      setBackendStatus('Save failed. Browser may have blocked the backend request.', 'error');
    }
  }

  async function loadCloudCopy() {
    setBackendStatus('Loading saved project...', 'working');
    try {
      let payload = null;
      try {
        const cloud = await jsonpLoadFromAppsScript();
        payload = cloud?.payload || cloud?.project ? cloud : null;
      } catch (cloudErr) {
        console.warn('Cloud load unavailable; falling back to browser backup.', cloudErr);
      }

      if (!payload) payload = getLocalBackup();
      const project = payload?.project || payload?.payload?.project;
      if (!project) throw new Error('No saved project found.');
      await getStudioApi().loadProject(project);
      setBackendStatus(payload.savedAt ? `Loaded saved project from ${payload.savedAt}.` : 'Loaded saved project.', 'ok');
    } catch (err) {
      console.error(err);
      setBackendStatus('No cloud/browser project copy was available to load.', 'error');
    }
  }

  function openLauncher() {
    if (!GAS_URL) return setBackendStatus('No Apps Script URL configured.', 'error');
    window.open(GAS_URL, '_blank', 'noopener,noreferrer');
    setBackendStatus('Opened the Apps Script launcher in a new tab.', 'ready');
  }

  async function copyBackendUrl() {
    try {
      await navigator.clipboard.writeText(GAS_URL);
      setBackendStatus('Apps Script URL copied.', 'ok');
    } catch (err) {
      console.error(err);
      setBackendStatus('Could not copy automatically. Select the URL text and copy it manually.', 'error');
    }
  }

  async function installAppIcon() {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      const choice = await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      setBackendStatus(choice?.outcome === 'accepted' ? 'Install accepted. Use the new icon to open the studio.' : 'Install canceled.', choice?.outcome === 'accepted' ? 'ok' : 'ready');
      return;
    }
    setBackendStatus('Use the browser menu: Chrome/Edge “Install app” or mobile “Add to Home Screen.”', 'ready');
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('service-worker.js')
        .then(() => setBackendStatus('Backend bridge loaded. Local PWA service worker is active.', 'ok'))
        .catch((err) => {
          console.warn('Service worker registration failed:', err);
          setBackendStatus('Backend bridge loaded. Service worker will activate after GitHub Pages deployment.', 'ready');
        });
    });
  }

  function bind(id, fn) {
    const el = $(id);
    if (el) el.addEventListener('click', fn);
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    setBackendStatus('Install prompt is ready. Press Install Icon.', 'ok');
  });

  window.addEventListener('appinstalled', () => {
    setBackendStatus('Installed. Open the new Belavadös Effect Studio icon anytime.', 'ok');
  });

  function restoreAutosaveToggle() {
    if (!autosaveToggle) return;
    autosaveToggle.checked = localStorage.getItem(AUTOSAVE_KEY + ':enabled') === '1';
    autosaveToggle.addEventListener('change', () => {
      localStorage.setItem(AUTOSAVE_KEY + ':enabled', autosaveToggle.checked ? '1' : '0');
    });
  }

  function boot() {
    if ($('backendUrlText')) $('backendUrlText').textContent = GAS_URL;
    if ($('backendDeploymentId')) $('backendDeploymentId').textContent = cfg.deploymentId || 'not configured';
    bind('backendPingBtn', pingBackend);
    bind('backendOpenLauncherBtn', openLauncher);
    bind('backendOpenLauncherBtn2', openLauncher);
    bind('backendInstallBtn', installAppIcon);
    bind('backendInstallBtn2', installAppIcon);
    bind('backendSaveBtn', saveCloudCopy);
    bind('backendLoadBtn', loadCloudCopy);
    bind('backendCopyUrlBtn', copyBackendUrl);
    restoreAutosaveToggle();
    registerServiceWorker();
    setBackendStatus('Backend bridge loaded. Test the Apps Script deployment when ready.', 'ready');
  }

  boot();
})();
