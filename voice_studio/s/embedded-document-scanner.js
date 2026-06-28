(() => {
  'use strict';

  const root = document.getElementById('scannerApp') || document.documentElement;
  const $ = (id) => document.getElementById(id);
  const qs = (sel, from = document) => Array.from(from.querySelectorAll(sel));

  const DEFAULT_CONFIG = {
    version: 1,
    app: {
      title: 'Document Scanner Module',
      subtitle: 'Scans fields, uploads, typed areas, images, and internal code, then routes findings to whitelisted actions.',
      modePill: 'Offline · HTML + CSS + JS + JSON'
    },
    privacy: {
      storeRawText: false,
      storeRawImages: false,
      storeRawCode: false,
      storeOnlyMetricsSignalsAndHashes: true,
      hashSalt: 'document-scanner-local-v1'
    },
    limits: {
      maxTextBytes: 1200000,
      maxImageSampleSize: 128,
      maxManifestFindings: 5000,
      maxSignalsPerFinding: 80
    },
    ui: {
      appTitle: 'Document Scanner Module', appSubtitle: 'Scan document fields, uploaded content, typed areas, images, and code without storing the actual scanned text.', modePill: 'Safe action registry', loadHeading: '1. Scan sources', dropLabel: 'Drop or choose files', scanHostLabel: 'Scan this page/document', sameOriginLabel: 'Also inspect same-origin linked CSS/JS', autoRunLabel: 'Auto-run safe whitelisted actions after scan', typedHeading: '2. Typed scan area', buttonsHeading: '3. Run', scanBtn: 'Scan now', runBtn: 'Run actions', exportBtn: 'Export manifest', clearBtn: 'Clear', rulesHeading: 'Enabled rules', hostHeading: 'Host document scan area', summaryHeading: 'Scan summary', findingsHeading: 'Findings', actionsHeading: 'Action log', manifestHeading: 'Manifest preview'
    },
    scanProfiles: {
      field: { selectors: ['input', 'textarea', 'select', "[contenteditable='true']", '[data-scan-field]', '[data-scan-box]'] },
      image: { selectors: ['img', 'canvas', 'svg'] },
      code: { selectors: ['script', 'style', "link[rel='stylesheet']"] }
    },
    rules: [
      { id: 'field-overflow-repair', label: 'Repair field and box overflow', whenAny: ['overflow-x', 'overflow-y', 'long-unbroken-run', 'dense-content'], actions: ['repairOverflow', 'addScrollContainment'], safeAutoRun: true },
      { id: 'json-router', label: 'Stage valid JSON for import handlers', whenAny: ['valid-json', 'json-like'], actions: ['stageJsonPayload', 'emitScanEvent'], safeAutoRun: true },
      { id: 'html-router', label: 'Index HTML forms, images, links, and embedded code', whenAny: ['html-like', 'dom-fragment', 'field-markup'], actions: ['indexMarkup', 'emitScanEvent'], safeAutoRun: true },
      { id: 'image-router', label: 'Index image dimensions and visual signals', whenAny: ['image-file', 'image-element', 'transparent-image', 'high-contrast', 'mostly-dark', 'mostly-light'], actions: ['indexImage', 'emitScanEvent'], safeAutoRun: true },
      { id: 'code-safety-review', label: 'Flag code that needs review before any function routing', whenAny: ['eval-like', 'function-constructor', 'inline-event-handler', 'dynamic-html-write', 'network-call'], actions: ['flagCodeReview', 'emitScanEvent'], safeAutoRun: true },
      { id: 'custom-function-router', label: 'Route matched scans to custom registered handlers', whenAny: ['custom-handler-target', 'known-import-shape', 'recognized-schema'], actions: ['routeToRegisteredHandlers', 'emitScanEvent'], safeAutoRun: false }
    ],
    actionRegistry: { allowEval: false, allowFunctionConstructor: false, allowRemoteExecution: false, allowWhitelistedActionsOnly: true }
  };

  const state = {
    config: DEFAULT_CONFIG,
    files: [],
    findings: [],
    actions: [],
    enabledRules: new Set(DEFAULT_CONFIG.rules.map(r => r.id)),
    lastManifest: null,
    staged: { json: [], markup: [], images: [] },
    customHandlers: new Map(),
    scanId: 0
  };

  const builtInActions = new Map();

  function safeText(value) {
    return String(value == null ? '' : value);
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function extOf(name) {
    const n = safeText(name).split(/[?#]/)[0];
    const dot = n.lastIndexOf('.');
    return dot >= 0 ? n.slice(dot + 1).toLowerCase() : '';
  }

  function byteLength(str) {
    return new Blob([String(str || '')]).size;
  }

  function hash(value) {
    const salt = state.config?.privacy?.hashSalt || 'local-scan';
    const str = `${salt}:${safeText(value)}`;
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return `h${(h >>> 0).toString(16).padStart(8, '0')}`;
  }

  function esc(value) {
    return safeText(value).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[ch]));
  }

  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2500);
  }

  function setStatus(message) {
    const node = $('scanStatus');
    if (node) node.textContent = message;
  }

  function logAction(actionId, finding, message, status = 'ok') {
    const entry = {
      time: new Date().toISOString(),
      actionId,
      findingId: finding?.id || null,
      status,
      message
    };
    state.actions.unshift(entry);
    renderActionLog();
    return entry;
  }

  function addSignals(set, signals) {
    for (const signal of signals || []) if (signal) set.add(signal);
  }

  function uniqueSignals(setOrArray) {
    const limit = state.config?.limits?.maxSignalsPerFinding || 80;
    return Array.from(setOrArray || []).filter(Boolean).slice(0, limit);
  }

  function classifySeverity(signals) {
    const risk = ['eval-like', 'function-constructor', 'inline-event-handler', 'dynamic-html-write'];
    const warn = ['network-call', 'overflow-x', 'overflow-y', 'long-unbroken-run', 'invalid-json', 'pdf-limited-scan', 'docx-limited-scan'];
    if (signals.some(s => risk.includes(s))) return 'risk';
    if (signals.some(s => warn.includes(s))) return 'warn';
    if (signals.includes('valid-json') || signals.includes('image-file') || signals.includes('field')) return 'ok';
    return 'info';
  }

  function makeFinding(partial) {
    const signals = uniqueSignals(partial.signals || []);
    const finding = {
      id: partial.id || `scan-${state.scanId}-${String(state.findings.length + 1).padStart(4, '0')}`,
      source: partial.source || 'unknown',
      kind: partial.kind || 'unknown',
      labelHash: partial.labelHash || null,
      locator: partial.locator || null,
      extension: partial.extension || null,
      mime: partial.mime || null,
      sizeBytes: partial.sizeBytes || 0,
      metrics: partial.metrics || {},
      signals,
      severity: partial.severity || classifySeverity(signals),
      matchedRules: [],
      actionsQueued: [],
      element: partial.element || null,
      transient: partial.transient || {}
    };
    finding.matchedRules = matchRules(finding);
    finding.actionsQueued = Array.from(new Set(finding.matchedRules.flatMap(rule => rule.actions || [])));
    return finding;
  }

  function matchRules(finding) {
    const signalSet = new Set(finding.signals);
    return (state.config.rules || []).filter(rule => {
      if (!state.enabledRules.has(rule.id)) return false;
      const any = rule.whenAny || [];
      const all = rule.whenAll || [];
      const anyOk = !any.length || any.some(s => signalSet.has(s));
      const allOk = !all.length || all.every(s => signalSet.has(s));
      return anyOk && allOk;
    });
  }

  function updateUiText() {
    const ui = state.config.ui || {};
    qs('[data-ui]').forEach(node => {
      const key = node.getAttribute('data-ui');
      node.textContent = ui[key] || '';
    });
    document.title = state.config.app?.title || ui.appTitle || document.title;
  }

  function renderRules() {
    const wrap = $('ruleList');
    const tpl = $('ruleTemplate');
    if (!wrap || !tpl) return;
    wrap.innerHTML = '';
    (state.config.rules || []).forEach(rule => {
      const node = tpl.content.firstElementChild.cloneNode(true);
      const input = node.querySelector('input');
      const label = node.querySelector('span');
      input.checked = state.enabledRules.has(rule.id);
      label.textContent = rule.label || rule.id;
      input.onchange = () => {
        if (input.checked) state.enabledRules.add(rule.id);
        else state.enabledRules.delete(rule.id);
        renderManifest();
      };
      wrap.appendChild(node);
    });
  }

  function renderSummary() {
    const wrap = $('summaryCards');
    if (!wrap) return;
    const byKind = new Map();
    const bySeverity = new Map();
    for (const f of state.findings) {
      byKind.set(f.kind, (byKind.get(f.kind) || 0) + 1);
      bySeverity.set(f.severity, (bySeverity.get(f.severity) || 0) + 1);
    }
    const cards = [
      ['Findings', state.findings.length],
      ['Files queued', state.files.length],
      ['Actions logged', state.actions.length],
      ['Warnings', (bySeverity.get('warn') || 0) + (bySeverity.get('risk') || 0)],
      ['Fields', byKind.get('field') || 0],
      ['Images', byKind.get('image') || 0],
      ['Code', byKind.get('code') || 0],
      ['Text payloads', byKind.get('text') || 0]
    ];
    wrap.innerHTML = cards.map(([label, value]) => `<div class="scanner-card"><b>${esc(value)}</b><span>${esc(label)}</span></div>`).join('');
  }

  function renderFindings() {
    const wrap = $('findingTableWrap');
    if (!wrap) return;
    const rows = state.findings.map(f => {
      const actions = f.actionsQueued.length ? f.actionsQueued.join(', ') : '—';
      const ruleLabels = f.matchedRules.map(r => r.label || r.id).join('<br>') || '—';
      const signals = f.signals.slice(0, 14).map(s => `<span class="scanner-signal">${esc(s)}</span>`).join('');
      return `<tr>
        <td>${esc(f.source)}</td>
        <td>${esc(f.kind)}</td>
        <td class="scanner-severity-${esc(f.severity)}">${esc(f.severity)}</td>
        <td>${signals || '—'}</td>
        <td>${ruleLabels}</td>
        <td>${esc(actions)}</td>
      </tr>`;
    }).join('');
    wrap.innerHTML = `<table class="scanner-table"><thead><tr><th>Source</th><th>Kind</th><th>Level</th><th>Signals</th><th>Matched rule</th><th>Queued actions</th></tr></thead><tbody>${rows || '<tr><td colspan="6">No findings yet.</td></tr>'}</tbody></table>`;
  }

  function renderActionLog() {
    const wrap = $('actionLog');
    if (!wrap) return;
    wrap.innerHTML = state.actions.slice(0, 100).map(a => `<div class="scanner-log-entry"><b>${esc(a.actionId)}</b><br>${esc(a.message)}<br><small>${esc(a.time)}</small></div>`).join('') || '<div class="scanner-log-entry">No actions have run.</div>';
  }

  function publicFinding(finding) {
    return {
      id: finding.id,
      source: finding.source,
      kind: finding.kind,
      labelHash: finding.labelHash,
      locator: finding.locator,
      extension: finding.extension,
      mime: finding.mime,
      sizeBytes: finding.sizeBytes,
      metrics: finding.metrics,
      signals: finding.signals,
      severity: finding.severity,
      matchedRules: finding.matchedRules.map(r => r.id),
      actionsQueued: finding.actionsQueued
    };
  }

  function buildManifest() {
    const limit = state.config?.limits?.maxManifestFindings || 5000;
    return {
      version: state.config.version || 1,
      kind: 'document-scan-action-manifest',
      generatedAt: new Date().toISOString(),
      privacy: state.config.privacy,
      counts: {
        findings: state.findings.length,
        files: state.files.length,
        actionsLogged: state.actions.length
      },
      enabledRules: Array.from(state.enabledRules),
      findings: state.findings.slice(0, limit).map(publicFinding),
      actions: state.actions.slice(0, 500)
    };
  }

  function renderManifest() {
    state.lastManifest = buildManifest();
    const preview = $('manifestPreview');
    if (preview) preview.textContent = JSON.stringify(state.lastManifest, null, 2);
  }

  function renderAll() {
    renderSummary();
    renderFindings();
    renderActionLog();
    renderManifest();
  }

  function readFileAsText(file, maxBytes) {
    return new Promise(resolve => {
      const rd = new FileReader();
      const chunk = maxBytes && file.size > maxBytes ? file.slice(0, maxBytes) : file;
      rd.onload = () => resolve(String(rd.result || ''));
      rd.onerror = () => resolve('');
      rd.readAsText(chunk);
    });
  }

  function readFileAsArrayBuffer(file) {
    return new Promise(resolve => {
      const rd = new FileReader();
      rd.onload = () => resolve(rd.result);
      rd.onerror = () => resolve(null);
      rd.readAsArrayBuffer(file);
    });
  }

  function loadImageFromFile(file) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
      img.src = URL.createObjectURL(file);
    });
  }

  function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0));
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h, s: max === 0 ? 0 : d / max, v: max };
  }

  function scanImageElement(img, sourceName = 'image-element') {
    const signals = new Set(['image-element']);
    const metrics = {};
    try {
      const naturalWidth = img.naturalWidth || img.videoWidth || img.width || 0;
      const naturalHeight = img.naturalHeight || img.videoHeight || img.height || 0;
      const max = state.config?.limits?.maxImageSampleSize || 128;
      const scale = Math.min(1, max / Math.max(naturalWidth || 1, naturalHeight || 1));
      const w = Math.max(1, Math.round((naturalWidth || img.width || 1) * scale));
      const h = Math.max(1, Math.round((naturalHeight || img.height || 1) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h).data;
      let sr = 0, sg = 0, sb = 0, alphaLow = 0, dark = 0, light = 0, high = 0, n = 0;
      for (let i = 0; i < data.length; i += 16) {
        const r = data[i], g = data[i + 1], b = data[i + 2], a = data[i + 3];
        if (a < 25) alphaLow++;
        const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
        if (lum < 55) dark++;
        if (lum > 205) light++;
        if (Math.max(r, g, b) - Math.min(r, g, b) > 96) high++;
        sr += r; sg += g; sb += b; n++;
      }
      const avg = n ? { r: sr / n, g: sg / n, b: sb / n } : { r: 0, g: 0, b: 0 };
      const hsv = rgbToHsv(avg.r, avg.g, avg.b);
      metrics.width = naturalWidth;
      metrics.height = naturalHeight;
      metrics.sampleWidth = w;
      metrics.sampleHeight = h;
      metrics.averageHue = Number(hsv.h.toFixed(2));
      metrics.averageSaturation = Number(hsv.s.toFixed(4));
      metrics.averageBrightness = Number(hsv.v.toFixed(4));
      metrics.transparentRatio = n ? Number((alphaLow / n).toFixed(4)) : 0;
      metrics.darkRatio = n ? Number((dark / n).toFixed(4)) : 0;
      metrics.lightRatio = n ? Number((light / n).toFixed(4)) : 0;
      metrics.highContrastRatio = n ? Number((high / n).toFixed(4)) : 0;
      if (metrics.transparentRatio > 0.08) signals.add('transparent-image');
      if (metrics.darkRatio > 0.55) signals.add('mostly-dark');
      if (metrics.lightRatio > 0.55) signals.add('mostly-light');
      if (metrics.highContrastRatio > 0.4) signals.add('high-contrast');
      if (naturalWidth > 0 && naturalHeight > 0) signals.add('image-sized');
    } catch (error) {
      signals.add('image-scan-blocked');
      metrics.errorHash = hash(error.message);
    }
    return makeFinding({ source: sourceName, kind: 'image', labelHash: hash(sourceName), metrics, signals });
  }

  function detectTextSignals(text, sourceKind = 'text') {
    const raw = String(text || '');
    const signals = new Set([sourceKind]);
    const metrics = {
      byteLength: byteLength(raw),
      charLength: raw.length,
      lineCount: raw ? raw.split(/\r?\n/).length : 0,
      nonWhitespaceCount: (raw.match(/\S/g) || []).length,
      maxLineLength: raw.split(/\r?\n/).reduce((max, line) => Math.max(max, line.length), 0)
    };
    if (!raw.trim()) signals.add('empty');
    if (metrics.maxLineLength > 220) signals.add('long-unbroken-run');
    if (metrics.nonWhitespaceCount > 50000) signals.add('dense-content');
    const trimmed = raw.trim();
    if (/^[\[{]/.test(trimmed) || /"[^"]+"\s*:/.test(raw)) signals.add('json-like');
    try {
      const parsed = JSON.parse(raw);
      signals.add('valid-json');
      metrics.jsonKind = Array.isArray(parsed) ? 'array' : typeof parsed;
      metrics.jsonTopLevelCount = Array.isArray(parsed) ? parsed.length : parsed && typeof parsed === 'object' ? Object.keys(parsed).length : 0;
      metrics.jsonKeyHashes = collectJsonKeyHashes(parsed).slice(0, 60);
    } catch {
      if (signals.has('json-like')) signals.add('invalid-json');
    }
    if (/<!doctype|<html|<body|<div|<input|<textarea|<script|<style|<img/i.test(raw)) {
      signals.add('html-like');
      scanMarkupMetrics(raw, metrics, signals);
    }
    if (/<[^>]+>/.test(raw) && /(?:data-scan|input|textarea|select|contenteditable)/i.test(raw)) signals.add('field-markup');
    if (/\b(function|const|let|var|class|import|export|addEventListener)\b/.test(raw)) signals.add('js-like');
    if (/\b(eval\s*\(|setTimeout\s*\(\s*["'`]|setInterval\s*\(\s*["'`])/.test(raw)) signals.add('eval-like');
    if (/\bnew\s+Function\s*\(/.test(raw)) signals.add('function-constructor');
    if (/\son[a-z]+\s*=\s*["']/i.test(raw)) signals.add('inline-event-handler');
    if (/\.(innerHTML|outerHTML)\s*=|document\.write\s*\(/.test(raw)) signals.add('dynamic-html-write');
    if (/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\b/.test(raw)) signals.add('network-call');
    if (/scanner-handler|data-handler|data-import-shape|data-schema/i.test(raw)) signals.add('custom-handler-target');
    if (/schema|manifest|version|kind|records|npcs|locations|settlements/i.test(raw)) signals.add('recognized-schema');
    if (/import|upload|export|manifest|payload/i.test(raw)) signals.add('known-import-shape');
    // D&D 5e / Belavadös character-sheet routing signals. These only identify local text patterns; they do not execute scanned content.
    if (/\b(dnd|d&d|5e|character sheet|armor class|initiative|proficiency bonus|saving throw|death save|hit dice|hit points)\b/i.test(raw)) signals.add('dnd5e-character-sheet');
    if (/\b\d*d(?:%|f|\d+)(?:\s*[+-]\s*\d+)?\b/i.test(raw)) signals.add('dice-expression');
    if (/\b(attack bonus|spell attack|to hit|hit bonus)\b|[-+]\s*\d+\s*(?:to hit|attack)/i.test(raw)) signals.add('attack-bonus');
    if (/\b(damage|dmg)\b[^\n]{0,40}\d*d(?:%|f|\d+)/i.test(raw)) signals.add('damage-dice');
    if (/\b(acrobatics|animal handling|arcana|athletics|deception|history|insight|intimidation|investigation|medicine|nature|perception|performance|persuasion|religion|sleight of hand|stealth|survival)\b/i.test(raw)) signals.add('skill-check');
    if (/\b(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha)\b[^\n]{0,30}\b(save|saving throw)\b|\b(save|saving throw)\b[^\n]{0,30}\b(strength|dexterity|constitution|intelligence|wisdom|charisma|str|dex|con|int|wis|cha)\b/i.test(raw)) signals.add('saving-throw');
    if (/\bdeath\s+(save|saving throw|success|failure|saves)\b/i.test(raw)) signals.add('death-save-tracker');
    if (/\binitiative\b/i.test(raw)) signals.add('initiative');
    if (/\bspell attack\b/i.test(raw)) signals.add('spell-attack');
    if (/\b(spell save dc|save dc)\b/i.test(raw)) signals.add('spell-save-dc');
    if (/\b(thieves'? tools|tool proficiency|lockpicks?|disarm traps?|open locks?)\b/i.test(raw)) signals.add('tool-proficiency');
    if (/\b(altruism|lawfulness|cooperation|honou?r)\b/i.test(raw)) signals.add('belavados-alignment-axis');
    return { signals, metrics };
  }

  function collectJsonKeyHashes(value, out = [], depth = 0) {
    if (depth > 6 || out.length > 80 || value == null) return out;
    if (Array.isArray(value)) {
      for (const item of value.slice(0, 20)) collectJsonKeyHashes(item, out, depth + 1);
      return out;
    }
    if (typeof value === 'object') {
      for (const key of Object.keys(value).slice(0, 50)) {
        out.push(hash(key));
        collectJsonKeyHashes(value[key], out, depth + 1);
      }
    }
    return Array.from(new Set(out));
  }

  function scanMarkupMetrics(raw, metrics, signals) {
    try {
      const doc = new DOMParser().parseFromString(raw, 'text/html');
      metrics.htmlElements = doc.querySelectorAll('*').length;
      metrics.formFields = doc.querySelectorAll('input, textarea, select, button, [contenteditable]').length;
      metrics.imageRefs = doc.querySelectorAll('img, svg, canvas').length;
      metrics.scriptTags = doc.querySelectorAll('script').length;
      metrics.styleTags = doc.querySelectorAll('style, link[rel="stylesheet"]').length;
      metrics.linkRefs = doc.querySelectorAll('[src], [href]').length;
      if (metrics.formFields > 0) signals.add('dom-fragment');
      if (metrics.scriptTags > 0) signals.add('embedded-code');
    } catch {
      signals.add('markup-parse-limited');
    }
  }

  function scanFieldElement(el, sourceName = 'field') {
    const signals = new Set(['field']);
    const label = el.getAttribute('data-scan-label') || el.getAttribute('name') || el.id || el.tagName.toLowerCase();
    const rect = el.getBoundingClientRect();
    const value = getElementValue(el);
    const textScan = detectTextSignals(`${label} ${value}`, 'typed-content');
    addSignals(signals, textScan.signals);
    if (el.scrollWidth > el.clientWidth + 1) signals.add('overflow-x');
    if (el.scrollHeight > el.clientHeight + 1) signals.add('overflow-y');
    const computed = getComputedStyle(el);
    if (/hidden/.test(computed.overflow + computed.overflowX + computed.overflowY) && (signals.has('overflow-x') || signals.has('overflow-y'))) signals.add('hidden-overflow');
    const metrics = {
      ...textScan.metrics,
      tag: el.tagName.toLowerCase(),
      inputType: el.getAttribute('type') || null,
      width: Number(rect.width.toFixed(2)),
      height: Number(rect.height.toFixed(2)),
      clientWidth: el.clientWidth || 0,
      clientHeight: el.clientHeight || 0,
      scrollWidth: el.scrollWidth || 0,
      scrollHeight: el.scrollHeight || 0,
      classHash: hash(el.className || ''),
      idHash: hash(el.id || '')
    };
    return makeFinding({
      source: sourceName,
      kind: 'field',
      labelHash: hash(label),
      locator: locatorFor(el),
      metrics,
      signals,
      element: el,
      transient: { text: value }
    });
  }

  function getElementValue(el) {
    if (!el) return '';
    if (el.matches('input, textarea, select')) return el.value || '';
    if (el.isContentEditable) return el.textContent || '';
    return el.textContent || '';
  }

  function locatorFor(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.id) return `#${CSS.escape(el.id)}`;
    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.documentElement && parts.length < 4) {
      let part = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (parent) {
        const same = Array.from(parent.children).filter(child => child.tagName === node.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  }

  function scanCodeElement(el) {
    const source = el.tagName.toLowerCase() === 'link' ? (el.getAttribute('href') || 'linked-stylesheet') : `${el.tagName.toLowerCase()}-element`;
    const code = el.tagName.toLowerCase() === 'script' || el.tagName.toLowerCase() === 'style' ? el.textContent || '' : '';
    const scanned = detectTextSignals(code, 'code');
    if (el.tagName.toLowerCase() === 'script') scanned.signals.add('script-element');
    if (el.tagName.toLowerCase() === 'style') scanned.signals.add('style-element');
    if (el.tagName.toLowerCase() === 'link') scanned.signals.add('stylesheet-link');
    return makeFinding({
      source,
      kind: 'code',
      labelHash: hash(source),
      locator: locatorFor(el),
      metrics: scanned.metrics,
      signals: scanned.signals,
      element: el,
      transient: { text: code }
    });
  }

  async function scanSameOriginLinkedCode() {
    const out = [];
    const candidates = qs('script[src], link[rel="stylesheet"][href]');
    for (const el of candidates) {
      const attr = el.tagName.toLowerCase() === 'script' ? 'src' : 'href';
      const url = el.getAttribute(attr);
      if (!url) continue;
      try {
        const absolute = new URL(url, location.href);
        if (absolute.origin !== location.origin) continue;
        const res = await fetch(absolute.href);
        const text = await res.text();
        const scanned = detectTextSignals(text.slice(0, state.config.limits.maxTextBytes), 'code');
        scanned.signals.add('same-origin-linked-code');
        out.push(makeFinding({
          source: absolute.pathname.split('/').pop() || absolute.href,
          kind: 'code',
          labelHash: hash(absolute.href),
          extension: extOf(absolute.pathname),
          mime: res.headers.get('content-type') || null,
          sizeBytes: byteLength(text),
          metrics: scanned.metrics,
          signals: scanned.signals,
          element: el,
          transient: { text }
        }));
      } catch (error) {
        out.push(makeFinding({ source: url, kind: 'code', labelHash: hash(url), signals: ['same-origin-fetch-failed'], metrics: { errorHash: hash(error.message) }, element: el }));
      }
    }
    return out;
  }

  async function scanUploadedFile(file) {
    const extension = extOf(file.name);
    const mime = file.type || extension;
    const source = file.webkitRelativePath || file.name;
    const base = { source, labelHash: hash(source), extension, mime, sizeBytes: file.size };
    if (isImageFile(file)) {
      const img = await loadImageFromFile(file);
      if (img) {
        const finding = scanImageElement(img, source);
        URL.revokeObjectURL(img.src);
        finding.source = source;
        finding.extension = extension;
        finding.mime = mime;
        finding.sizeBytes = file.size;
        finding.signals = uniqueSignals([...finding.signals, 'image-file']);
        finding.matchedRules = matchRules(finding);
        finding.actionsQueued = Array.from(new Set(finding.matchedRules.flatMap(rule => rule.actions || [])));
        return [finding];
      }
      return [makeFinding({ ...base, kind: 'image', signals: ['image-file', 'image-load-failed'] })];
    }
    if (extension === 'docx') {
      const buffer = await readFileAsArrayBuffer(file);
      const text = extractDocxTextLite(buffer);
      const scanned = detectTextSignals(text, 'text');
      scanned.signals.add('docx-file');
      if (!text) scanned.signals.add('docx-limited-scan');
      return [makeFinding({ ...base, kind: 'text', metrics: scanned.metrics, signals: scanned.signals, transient: { text } })];
    }
    if (extension === 'pdf') {
      const text = await readFileAsText(file, state.config.limits.maxTextBytes);
      const extracted = extractPdfTextLite(text);
      const scanned = detectTextSignals(extracted, 'text');
      scanned.signals.add('pdf-file');
      scanned.signals.add('pdf-limited-scan');
      return [makeFinding({ ...base, kind: 'text', metrics: scanned.metrics, signals: scanned.signals, transient: { text: extracted } })];
    }
    const text = await readFileAsText(file, state.config.limits.maxTextBytes);
    const scanned = detectTextSignals(text, isCodeExtension(extension) ? 'code' : 'text');
    if (isCodeExtension(extension)) scanned.signals.add('uploaded-code');
    if (extension === 'json') scanned.signals.add('json-file');
    if (['html', 'htm', 'svg', 'xml'].includes(extension)) scanned.signals.add('markup-file');
    return [makeFinding({ ...base, kind: isCodeExtension(extension) ? 'code' : 'text', metrics: scanned.metrics, signals: scanned.signals, transient: { text } })];
  }

  function isImageFile(file) {
    const extension = extOf(file.name);
    return /^image\//.test(file.type || '') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'].includes(extension);
  }

  function isCodeExtension(extension) {
    return ['js', 'mjs', 'cjs', 'css', 'html', 'htm', 'svg', 'xml'].includes(extension);
  }

  function extractPdfTextLite(raw) {
    return String(raw || '')
      .replace(/\r/g, '\n')
      .replace(/\\\)/g, ')')
      .replace(/\\\(/g, '(')
      .replace(/[^\x09\x0A\x0D\x20-\x7E]+/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, state.config.limits.maxTextBytes);
  }

  function extractDocxTextLite(buffer) {
    if (!buffer) return '';
    const bytes = new Uint8Array(buffer);
    let latin = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      latin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    const fragments = [];
    const re = /<w:t[^>]*>([\s\S]*?)<\/w:t>/g;
    let match;
    while ((match = re.exec(latin)) && fragments.length < 5000) {
      fragments.push(match[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&'));
    }
    return fragments.join(' ').slice(0, state.config.limits.maxTextBytes);
  }

  function scanHostDocument() {
    const findings = [];
    const profile = state.config.scanProfiles || DEFAULT_CONFIG.scanProfiles;
    const fieldSelectors = (profile.field?.selectors || []).join(',');
    const imageSelectors = (profile.image?.selectors || []).join(',');
    const codeSelectors = (profile.code?.selectors || []).join(',');
    const isHostTarget = el => !el.closest('#scannerApp') || el.closest('[data-scan-root]');
    const allFields = new Set(qs(fieldSelectors).filter(el => !el.closest('#ruleTemplate') && isHostTarget(el)));
    for (const el of allFields) findings.push(scanFieldElement(el, labelForElement(el, 'field')));
    const allImages = new Set(qs(imageSelectors).filter(isHostTarget));
    for (const el of allImages) {
      if (el instanceof HTMLImageElement && el.complete && el.naturalWidth) findings.push(scanImageElement(el, labelForElement(el, 'image')));
      else if (el instanceof HTMLCanvasElement) findings.push(scanCanvasElement(el));
      else if (el instanceof SVGElement) findings.push(scanSvgElement(el));
    }
    for (const el of qs(codeSelectors).filter(el => !el.closest('#scannerApp') || el.tagName.toLowerCase() === 'script' || el.tagName.toLowerCase() === 'style')) {
      if (el.src && new URL(el.src, location.href).pathname.endsWith('/scanner.js')) continue;
      findings.push(scanCodeElement(el));
    }
    return findings;
  }

  function labelForElement(el, fallback) {
    return el.getAttribute('data-scan-label') || el.getAttribute('alt') || el.getAttribute('aria-label') || el.getAttribute('name') || el.id || fallback;
  }

  function scanCanvasElement(canvas) {
    const signals = new Set(['image-element', 'canvas-element']);
    const metrics = { width: canvas.width, height: canvas.height };
    if (canvas.width && canvas.height) signals.add('image-sized');
    return makeFinding({ source: labelForElement(canvas, 'canvas'), kind: 'image', labelHash: hash(labelForElement(canvas, 'canvas')), locator: locatorFor(canvas), metrics, signals, element: canvas });
  }

  function scanSvgElement(svg) {
    const signals = new Set(['image-element', 'svg-element']);
    const markup = svg.outerHTML || '';
    const scanned = detectTextSignals(markup, 'svg-markup');
    addSignals(signals, scanned.signals);
    return makeFinding({ source: labelForElement(svg, 'svg'), kind: 'image', labelHash: hash(labelForElement(svg, 'svg')), locator: locatorFor(svg), metrics: { ...scanned.metrics, width: svg.clientWidth || 0, height: svg.clientHeight || 0 }, signals, element: svg, transient: { text: markup } });
  }

  async function scanNow() {
    state.scanId += 1;
    state.findings = [];
    state.actions = [];
    state.staged = { json: [], markup: [], images: [] };
    setStatus('Scanning...');
    const typed = $('typedScanArea');
    if (typed && typed.value.trim()) state.findings.push(scanFieldElement(typed, 'typed-area'));
    if ($('scanHostDocument')?.checked) state.findings.push(...scanHostDocument());
    for (let i = 0; i < state.files.length; i++) {
      setStatus(`Scanning file ${i + 1}/${state.files.length}...`);
      const fileFindings = await scanUploadedFile(state.files[i]);
      state.findings.push(...fileFindings);
    }
    if ($('scanSameOriginCode')?.checked) {
      setStatus('Scanning same-origin linked CSS/JS...');
      state.findings.push(...await scanSameOriginLinkedCode());
    }
    setStatus(`Scan complete. ${state.findings.length} finding(s), ${state.findings.reduce((sum, f) => sum + f.actionsQueued.length, 0)} queued action(s).`);
    renderAll();
    if ($('autoRunSafeActions')?.checked) await runActions({ safeOnly: true });
  }

  async function runActions(options = {}) {
    const safeOnly = Boolean(options.safeOnly);
    let count = 0;
    for (const finding of state.findings) {
      for (const rule of finding.matchedRules) {
        if (safeOnly && !rule.safeAutoRun) continue;
        for (const actionId of rule.actions || []) {
          const action = builtInActions.get(actionId);
          if (!action) {
            logAction(actionId, finding, `No registered action named ${actionId}.`, 'warn');
            continue;
          }
          try {
            await action(finding, rule);
            count++;
          } catch (error) {
            logAction(actionId, finding, `Action failed: ${error.message}`, 'risk');
          }
        }
      }
    }
    setStatus(`Actions complete. Ran ${count} action call(s).`);
    renderAll();
  }

  builtInActions.set('repairOverflow', async finding => {
    if (finding.element && finding.kind === 'field') {
      finding.element.classList.add('scan-overflow-repaired');
      logAction('repairOverflow', finding, `Applied overflow repair to ${finding.locator || finding.source}.`);
    } else {
      logAction('repairOverflow', finding, 'No live element available; manifest notes repair recommendation.', 'info');
    }
  });

  builtInActions.set('addScrollContainment', async finding => {
    if (finding.element && finding.kind === 'field') {
      finding.element.classList.add('scan-scroll-contained');
      logAction('addScrollContainment', finding, `Added scroll containment to ${finding.locator || finding.source}.`);
    } else {
      logAction('addScrollContainment', finding, 'No live element available; manifest notes containment recommendation.', 'info');
    }
  });

  builtInActions.set('stageJsonPayload', async finding => {
    if (finding.transient?.text) {
      try {
        const parsed = JSON.parse(finding.transient.text);
        state.staged.json.push({ findingId: finding.id, source: finding.source, keyHashes: collectJsonKeyHashes(parsed).slice(0, 80), kind: Array.isArray(parsed) ? 'array' : typeof parsed });
        window.DocumentScannerRuntime = window.DocumentScannerRuntime || {};
        window.DocumentScannerRuntime.lastJson = parsed;
        logAction('stageJsonPayload', finding, `Staged parsed JSON from ${finding.source} for local import handlers.`);
      } catch {
        logAction('stageJsonPayload', finding, `JSON from ${finding.source} could not be parsed.`, 'warn');
      }
    } else {
      logAction('stageJsonPayload', finding, `No raw text retained for ${finding.source}; enable transient handler during current scan only.`, 'info');
    }
  });

  builtInActions.set('indexMarkup', async finding => {
    state.staged.markup.push({ findingId: finding.id, source: finding.source, metrics: finding.metrics, signals: finding.signals });
    logAction('indexMarkup', finding, `Indexed markup structure from ${finding.source}.`);
  });

  builtInActions.set('indexImage', async finding => {
    state.staged.images.push({ findingId: finding.id, source: finding.source, metrics: finding.metrics, signals: finding.signals });
    logAction('indexImage', finding, `Indexed image metrics from ${finding.source}.`);
  });

  builtInActions.set('flagCodeReview', async finding => {
    if (finding.element) finding.element.classList.add('scan-review-needed');
    logAction('flagCodeReview', finding, `Flagged ${finding.source} for code review before routing.`, 'warn');
  });

  builtInActions.set('emitScanEvent', async finding => {
    const detail = publicFinding(finding);
    root.dispatchEvent(new CustomEvent('document-scanner:finding', { detail }));
    logAction('emitScanEvent', finding, `Emitted scanner event for ${finding.source}.`);
  });

  builtInActions.set('routeToRegisteredHandlers', async finding => {
    const handlers = Array.from(state.customHandlers.values());
    if (!handlers.length) {
      logAction('routeToRegisteredHandlers', finding, 'No custom handlers registered.', 'info');
      return;
    }
    for (const handler of handlers) {
      await handler({ finding: publicFinding(finding), transient: finding.transient, manifest: state.lastManifest });
    }
    logAction('routeToRegisteredHandlers', finding, `Routed ${finding.source} to ${handlers.length} custom handler(s).`);
  });

  function wireEvents() {
    const fileInput = $('scannerFileInput');
    if (fileInput) {
      fileInput.onchange = () => {
        state.files = Array.from(fileInput.files || []);
        setStatus(`Queued ${state.files.length} file(s).`);
        renderSummary();
      };
    }
    const drop = $('dropZone');
    if (drop) {
      drop.addEventListener('dragover', event => { event.preventDefault(); drop.classList.add('scan-drag-over'); });
      drop.addEventListener('dragleave', () => drop.classList.remove('scan-drag-over'));
      drop.addEventListener('drop', event => {
        event.preventDefault();
        drop.classList.remove('scan-drag-over');
        state.files = Array.from(event.dataTransfer?.files || []);
        if (fileInput) fileInput.value = '';
        setStatus(`Queued ${state.files.length} dropped file(s).`);
        renderSummary();
      });
    }
    $('scanNowBtn')?.addEventListener('click', () => scanNow());
    $('runActionsBtn')?.addEventListener('click', () => runActions({ safeOnly: false }));
    $('exportManifestBtn')?.addEventListener('click', () => {
      const manifest = buildManifest();
      download('document-scan-action-manifest.json', JSON.stringify(manifest, null, 2), 'application/json');
    });
    $('clearScanBtn')?.addEventListener('click', () => {
      state.files = [];
      state.findings = [];
      state.actions = [];
      state.staged = { json: [], markup: [], images: [] };
      if (fileInput) fileInput.value = '';
      setStatus('Cleared.');
      renderAll();
    });
  }

  async function loadConfig() {
    const configUrl = root.getAttribute('data-config');
    if (!configUrl) return DEFAULT_CONFIG;
    try {
      const res = await fetch(configUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const loaded = await res.json();
      return mergeConfig(DEFAULT_CONFIG, loaded);
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  function mergeConfig(base, loaded) {
    const out = typeof structuredClone === 'function' ? structuredClone(base) : JSON.parse(JSON.stringify(base));
    deepMerge(out, loaded || {});
    return out;
  }

  function deepMerge(target, source) {
    for (const [key, value] of Object.entries(source || {})) {
      if (value && typeof value === 'object' && !Array.isArray(value) && target[key] && typeof target[key] === 'object' && !Array.isArray(target[key])) deepMerge(target[key], value);
      else target[key] = value;
    }
    return target;
  }

  function registerAction(id, fn) {
    if (!id || typeof fn !== 'function') throw new Error('registerAction requires an id and function.');
    state.customHandlers.set(id, fn);
    return () => state.customHandlers.delete(id);
  }

  async function init() {
    state.config = await loadConfig();
    state.enabledRules = new Set((state.config.rules || []).map(r => r.id));
    updateUiText();
    renderRules();
    wireEvents();
    setStatus('Ready.');
    renderAll();
  }

  window.DocumentScanner = {
    scan: scanNow,
    runActions,
    getManifest: buildManifest,
    exportManifest: () => download('document-scan-action-manifest.json', JSON.stringify(buildManifest(), null, 2), 'application/json'),
    registerAction,
    addFiles: files => { state.files = Array.from(files || []); renderSummary(); },
    getFindings: () => state.findings.map(publicFinding),
    getStaged: () => JSON.parse(JSON.stringify(state.staged))
  };

  init();
})();
