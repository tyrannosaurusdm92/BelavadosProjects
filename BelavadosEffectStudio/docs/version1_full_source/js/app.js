(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const baseCanvas = $('baseCanvas');
  const baseCtx = baseCanvas.getContext('2d', { willReadFrequently: true });
  const overlayCanvas = $('overlayCanvas');
  const overlayCtx = overlayCanvas.getContext('2d', { willReadFrequently: true });
  const stage = $('stage');
  const viewport = $('viewport');
  const layerHost = $('layerHost');
  const brushCursor = $('brushCursor');

  const els = {
    status: $('statusText'),
    fileInput: $('fileInput'),
    toolGrid: $('toolGrid'),
    canvasW: $('canvasW'),
    canvasH: $('canvasH'),
    zoomRange: $('zoomRange'),
    zoomReadout: $('zoomReadout'),
    brushColor: $('brushColor'),
    brushHex: $('brushHex'),
    brushKind: $('brushKind'),
    brushSize: $('brushSize'),
    brushAlpha: $('brushAlpha'),
    brushAngle: $('brushAngle'),
    effectType: $('effectType'),
    intensity: $('intensity'),
    transparency: $('transparency'),
    speed: $('speed'),
    blur: $('blur'),
    sharpness: $('sharpness'),
    waveAmp: $('waveAmp'),
    moteCount: $('moteCount'),
    vectorLength: $('vectorLength'),
    ichorPreset: $('ichorPreset'),
    ichorVelocity: $('ichorVelocity'),
    ichorPower: $('ichorPower'),
    ichorThrust: $('ichorThrust'),
    ichorDust: $('ichorDust'),
    ichorLighting: $('ichorLighting'),
    ichorEscape: $('ichorEscape'),
    ichorFluidity: $('ichorFluidity'),
    ichorPressure: $('ichorPressure'),
    ichorSettingsPanel: $('ichorSettingsPanel'),
    ichorPresetNote: $('ichorPresetNote'),
    layerList: $('layerList'),
    pickedColorChip: $('pickedColorChip'),
    pickedColorText: $('pickedColorText'),
    tolerance: $('tolerance'),
    edgeSoftness: $('edgeSoftness'),
    removeStrength: $('removeStrength'),
    previewTransparency: $('previewTransparency'),
    shapeType: $('shapeType'),
    shapeWidth: $('shapeWidth'),
    shapeHeight: $('shapeHeight'),
    shapeRotation: $('shapeRotation'),
    shapeSides: $('shapeSides'),
    shapeAlpha: $('shapeAlpha'),
    shapeFill: $('shapeFill'),
    shapeBorder: $('shapeBorder'),
    shapeBorderWidth: $('shapeBorderWidth'),
    shapeLink: $('shapeLink'),
    shapeStatus: $('shapeStatus')
  };

  const state = {
    w: 1280,
    h: 720,
    zoom: 1,
    tool: 'brush',
    activeLayerId: null,
    layers: [],
    drawing: false,
    panning: false,
    spaceDown: false,
    dragStart: null,
    panStart: null,
    selectedRect: null,
    transparentColor: null,
    history: [],
    redoHistory: [],
    maxHistory: 60,
    transparencySeed: null,
    activeShapeId: null,
    repairCanvas: null,
    lastRender: 0,
    dirty: true,
    activePointers: new Map(),
    pinchStart: null
  };

  const storageKey = 'belavados-effect-layer-studio-v2';

  const ICHOR_PALETTE = {
    mist: ['#E8FFFF', '#DFFFFF', '#D9FFFF', '#C8FFFF', '#C7FFFF'],
    ion: ['#BDEBFF', '#BDF7F1', '#A6E7FF', '#A6BEC5'],
    glow: ['#9EFFFF', '#9FEEDD', '#9EF2E4', '#91FFFF', '#8DE0DC'],
    arc: ['#7EFBEA', '#65E9D2', '#5EAAAA', '#4BC7B0', '#48BAA6', '#3D9FA0'],
    core: ['#2FBED8', '#1FD1C2', '#00FFFF', '#00D9D9', '#00BFAF'],
    deep: ['#008C96', '#008B8B', '#00848A', '#007E8A', '#007A78', '#0E716B', '#0B6E74'],
    shadow: ['#0B6070', '#0B3F43', '#062D34', '#052C2A'],
    residue: ['#003C42', '#003A3A', '#002A30', '#00242B']
  };

  function ichorPick(group, seed = 1) {
    const list = ICHOR_PALETTE[group] || ICHOR_PALETTE.core;
    return list[Math.floor(seededNoise(seed) * list.length) % list.length];
  }

  const ICHOR_PRESETS = [
    {
      "id": "weapon:Handgun",
      "kind": "weapon",
      "name": "Thundercoil Handgun",
      "velocity": 1.09,
      "power": 1.0,
      "thrust": 1.0,
      "dust": 65,
      "lighting": 0.76,
      "escape": 0.72,
      "fluidity": 0.74,
      "pressure": 1.17,
      "note": "ranged sidearm; E=2000J, duration=0.080s, pressure=7.0MPa, jet\u224878.3m/s."
    },
    {
      "id": "weapon:Mini_Thundercoil",
      "kind": "weapon",
      "name": "Mini Thundercoil",
      "velocity": 0.88,
      "power": 0.87,
      "thrust": 0.66,
      "dust": 39,
      "lighting": 0.45,
      "escape": 0.9,
      "fluidity": 0.45,
      "pressure": 0.77,
      "note": "concealed ranged; E=1200J, duration=0.055s, pressure=4.6MPa, jet\u224863.5m/s."
    },
    {
      "id": "weapon:Rifle",
      "kind": "weapon",
      "name": "Thundercoil Rifle",
      "velocity": 1.48,
      "power": 1.5,
      "thrust": 1.86,
      "dust": 146,
      "lighting": 1.71,
      "escape": 0.47,
      "fluidity": 1.27,
      "pressure": 2.17,
      "note": "long-range coil rail; E=4500J, duration=0.120s, pressure=13.0MPa, jet\u2248106.7m/s."
    },
    {
      "id": "weapon:Shotgun",
      "kind": "weapon",
      "name": "Thundercoil Shotgun",
      "velocity": 1.18,
      "power": 1.52,
      "thrust": 1.17,
      "dust": 123,
      "lighting": 1.44,
      "escape": 1.37,
      "fluidity": 1.64,
      "pressure": 1.37,
      "note": "scatter discharge; E=3800J, duration=0.100s, pressure=8.2MPa, jet\u224884.8m/s."
    },
    {
      "id": "weapon:Grenade",
      "kind": "weapon",
      "name": "Thundercoil Grenade",
      "velocity": 0.96,
      "power": 1.33,
      "thrust": 0.79,
      "dust": 195,
      "lighting": 2.27,
      "escape": 1.19,
      "fluidity": 1.94,
      "pressure": 0.92,
      "note": "sealed burst device; E=6000J, duration=0.180s, pressure=5.5MPa, jet\u224869.4m/s."
    },
    {
      "id": "weapon:Shock_Bomb",
      "kind": "weapon",
      "name": "Thundercoil Shock-Bomb",
      "velocity": 1.01,
      "power": 1.27,
      "thrust": 0.86,
      "dust": 227,
      "lighting": 2.65,
      "escape": 1.19,
      "fluidity": 2.32,
      "pressure": 1.0,
      "note": "anchored burst device; E=7000J, duration=0.220s, pressure=6.0MPa, jet\u224872.5m/s."
    },
    {
      "id": "weapon:Coil_Array",
      "kind": "weapon",
      "name": "Thundercoil Coil Array",
      "velocity": 1.42,
      "power": 1.14,
      "thrust": 1.71,
      "dust": 230,
      "lighting": 4.5,
      "escape": 0.9,
      "fluidity": 3,
      "pressure": 2.0,
      "note": "deployed heavy array; E=12000J, duration=0.420s, pressure=12.0MPa, jet\u2248102.5m/s."
    },
    {
      "id": "weapon:Hammer",
      "kind": "weapon",
      "name": "Thundercoil Hammer",
      "velocity": 0.9,
      "power": 0.83,
      "thrust": 0.46,
      "dust": 81,
      "lighting": 0.95,
      "escape": 1.04,
      "fluidity": 0.61,
      "pressure": 0.53,
      "note": "impact melee coil; E=2500J, duration=0.120s, pressure=3.2MPa, jet\u224864.6m/s."
    },
    {
      "id": "weapon:Axe",
      "kind": "weapon",
      "name": "Thundercoil Axe",
      "velocity": 0.91,
      "power": 0.96,
      "thrust": 0.5,
      "dust": 78,
      "lighting": 0.91,
      "escape": 1.04,
      "fluidity": 0.61,
      "pressure": 0.58,
      "note": "cleaving melee coil; E=2400J, duration=0.100s, pressure=3.5MPa, jet\u224865.5m/s."
    },
    {
      "id": "weapon:Sword",
      "kind": "weapon",
      "name": "Thundercoil Sword",
      "velocity": 0.89,
      "power": 1.04,
      "thrust": 0.43,
      "dust": 71,
      "lighting": 0.83,
      "escape": 0.72,
      "fluidity": 0.61,
      "pressure": 0.5,
      "note": "focused edge coil; E=2200J, duration=0.085s, pressure=3.0MPa, jet\u224864.0m/s."
    },
    {
      "id": "weapon:Dagger",
      "kind": "weapon",
      "name": "Thundercoil Dagger",
      "velocity": 0.86,
      "power": 0.98,
      "thrust": 0.31,
      "dust": 35,
      "lighting": 0.42,
      "escape": 0.4,
      "fluidity": 0.61,
      "pressure": 0.37,
      "note": "micro contact coil; E=1100J, duration=0.045s, pressure=2.2MPa, jet\u224861.6m/s."
    },
    {
      "id": "weapon:Bow",
      "kind": "weapon",
      "name": "Thundercoil Bow",
      "velocity": 0.77,
      "power": 0.87,
      "thrust": 0.5,
      "dust": 78,
      "lighting": 0.91,
      "escape": 0.72,
      "fluidity": 0.45,
      "pressure": 0.58,
      "note": "conductive projectile arc; E=2400J, duration=0.110s, pressure=3.5MPa, jet\u224855.4m/s."
    },
    {
      "id": "weapon:Crossbow",
      "kind": "weapon",
      "name": "Thundercoil Crossbow",
      "velocity": 0.82,
      "power": 0.86,
      "thrust": 0.57,
      "dust": 97,
      "lighting": 1.14,
      "escape": 0.47,
      "fluidity": 0.45,
      "pressure": 0.67,
      "note": "pinning projectile arc; E=3000J, duration=0.140s, pressure=4.0MPa, jet\u224859.2m/s."
    },
    {
      "id": "skyship:harbor_whisper",
      "kind": "skyship",
      "name": "Skyship Harbor Whisper Puffer",
      "velocity": 0.55,
      "power": 0.7,
      "thrust": 0.55,
      "dust": 45,
      "lighting": 0.8,
      "escape": 0.35,
      "fluidity": 1.1,
      "pressure": 0.45,
      "note": "Low-output docking puffer: precise teal harbor-mode current with minimal escape."
    },
    {
      "id": "skyship:stern_drive_lens",
      "kind": "skyship",
      "name": "Skyship Stern Drive Lens",
      "velocity": 1.35,
      "power": 1.45,
      "thrust": 1.6,
      "dust": 105,
      "lighting": 1.65,
      "escape": 0.85,
      "fluidity": 1.45,
      "pressure": 1.3,
      "note": "Cruise rope phase: braided stern discharge lens with a coherent cyan thrust stream."
    },
    {
      "id": "skyship:keel_lift_bell",
      "kind": "skyship",
      "name": "Skyship Keel Lift Bell",
      "velocity": 1.05,
      "power": 2.35,
      "thrust": 2.65,
      "dust": 155,
      "lighting": 2.3,
      "escape": 1.15,
      "fluidity": 1.75,
      "pressure": 2.25,
      "note": "Belly/keel lift: wide pressure column, luminous mist, strong field-coupled upward force."
    },
    {
      "id": "skyship:mast_stabilizer_vent",
      "kind": "skyship",
      "name": "Skyship Mast Stabilizer Vent",
      "velocity": 1.8,
      "power": 0.95,
      "thrust": 0.85,
      "dust": 70,
      "lighting": 1.3,
      "escape": 1.45,
      "fluidity": 1.25,
      "pressure": 0.8,
      "note": "Stabilizer choir vent: nimble roll-trim arcs that crawl off rigging and sail seams."
    },
    {
      "id": "skyship:storm_climb_bloom",
      "kind": "skyship",
      "name": "Skyship Storm-Climb Bloom",
      "velocity": 2.2,
      "power": 3.1,
      "thrust": 3.3,
      "dust": 220,
      "lighting": 3.2,
      "escape": 2.35,
      "fluidity": 2.2,
      "pressure": 2.85,
      "note": "Emergency climb/bloom: over-rich catalyst look, aggressive liquid lightning escape, heavy motes."
    },
    {
      "id": "skyship:sail_thread_current",
      "kind": "skyship",
      "name": "Skyship Ichor-Thread Sail Current",
      "velocity": 0.95,
      "power": 1.05,
      "thrust": 0.7,
      "dust": 95,
      "lighting": 1.8,
      "escape": 1.75,
      "fluidity": 2.55,
      "pressure": 0.65,
      "note": "Sail-field current: flowing seam-light, soft cyan runic crawling, many off-stroke tendrils."
    }
  ];

  function setStatus(message) {
    els.status.textContent = message;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function safeNumber(value, fallback = 0) {
    const n = Number(value);
    return Number.isFinite(n) ? n : fallback;
  }

  function normalizeHex(value, fallback = '#00ffff') {
    const raw = String(value || fallback).trim();
    const m = raw.match(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    if (!m) return fallback;
    const h = m[1];
    return '#' + (h.length === 3 ? h.split('').map((c) => c + c).join('') : h).toLowerCase();
  }

  function hexToRgb(hex) {
    const clean = normalizeHex(hex).replace('#', '').trim();
    const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean.padEnd(6, '0').slice(0, 6);
    const n = parseInt(full, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }

  function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
  }

  function rgba(color, alpha = 1) {
    const c = typeof color === 'string' ? hexToRgb(color) : color;
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
  }

  function uid(prefix = 'layer') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function seededNoise(seed) {
    let x = Math.sin(seed * 12.9898) * 43758.5453123;
    return x - Math.floor(x);
  }

  function getUiSettings() {
    return {
      color: els.brushColor.value,
      brushKind: els.brushKind?.value || 'regular',
      size: safeNumber(els.brushSize.value, 28),
      alpha: safeNumber(els.brushAlpha.value, 0.95),
      angle: safeNumber(els.brushAngle.value, 0),
      intensity: safeNumber(els.intensity.value, 1.2),
      transparency: safeNumber(els.transparency.value, 1),
      speed: safeNumber(els.speed.value, 1),
      blur: safeNumber(els.blur.value, 4),
      sharpness: safeNumber(els.sharpness.value, 1),
      waveAmp: safeNumber(els.waveAmp.value, 28),
      moteCount: safeNumber(els.moteCount.value, 60),
      vectorLength: safeNumber(els.vectorLength.value, 44),
      shapeType: els.shapeType?.value || 'circle',
      shapeWidth: safeNumber(els.shapeWidth?.value, 160),
      shapeHeight: safeNumber(els.shapeHeight?.value, 110),
      shapeRotation: safeNumber(els.shapeRotation?.value, 0),
      shapeSides: safeNumber(els.shapeSides?.value, 6),
      shapeAlpha: safeNumber(els.shapeAlpha?.value, 0.85),
      shapeFill: els.shapeFill?.value || els.brushColor.value,
      shapeBorder: els.shapeBorder?.value || '#e8ffff',
      shapeBorderWidth: safeNumber(els.shapeBorderWidth?.value, 4),
      shapeLink: els.shapeLink?.value || '',
      ichorPreset: els.ichorPreset?.value || 'weapon:Shotgun',
      ichorVelocity: safeNumber(els.ichorVelocity?.value, 1.15),
      ichorPower: safeNumber(els.ichorPower?.value, 1.25),
      ichorThrust: safeNumber(els.ichorThrust?.value, 1),
      ichorDust: safeNumber(els.ichorDust?.value, 80),
      ichorLighting: safeNumber(els.ichorLighting?.value, 1.75),
      ichorEscape: safeNumber(els.ichorEscape?.value, 1.05),
      ichorFluidity: safeNumber(els.ichorFluidity?.value, 1.35),
      ichorPressure: safeNumber(els.ichorPressure?.value, 1)
    };
  }

  function applySettingsToUi(settings) {
    if (!settings) return;
    els.brushColor.value = settings.color || '#00ffff';
    if (els.brushHex) els.brushHex.value = normalizeHex(els.brushColor.value);
    if (els.brushKind) els.brushKind.value = settings.brushKind || 'regular';
    els.brushSize.value = settings.size ?? 28;
    els.brushAlpha.value = settings.alpha ?? 0.95;
    els.brushAngle.value = settings.angle ?? 0;
    els.intensity.value = settings.intensity ?? 1.2;
    els.transparency.value = settings.transparency ?? 1;
    els.speed.value = settings.speed ?? 1;
    els.blur.value = settings.blur ?? 4;
    els.sharpness.value = settings.sharpness ?? 1;
    els.waveAmp.value = settings.waveAmp ?? 28;
    els.moteCount.value = settings.moteCount ?? 60;
    els.vectorLength.value = settings.vectorLength ?? 44;
    if (els.shapeType) els.shapeType.value = settings.shapeType || 'circle';
    if (els.shapeWidth) els.shapeWidth.value = settings.shapeWidth ?? 160;
    if (els.shapeHeight) els.shapeHeight.value = settings.shapeHeight ?? 110;
    if (els.shapeRotation) els.shapeRotation.value = settings.shapeRotation ?? 0;
    if (els.shapeSides) els.shapeSides.value = settings.shapeSides ?? 6;
    if (els.shapeAlpha) els.shapeAlpha.value = settings.shapeAlpha ?? 0.85;
    if (els.shapeFill) els.shapeFill.value = settings.shapeFill || settings.color || '#00ffff';
    if (els.shapeBorder) els.shapeBorder.value = settings.shapeBorder || '#e8ffff';
    if (els.shapeBorderWidth) els.shapeBorderWidth.value = settings.shapeBorderWidth ?? 4;
    if (els.shapeLink) els.shapeLink.value = settings.shapeLink || '';
    if (els.ichorPreset) els.ichorPreset.value = settings.ichorPreset || els.ichorPreset.value || 'weapon:Shotgun';
    if (els.ichorVelocity) els.ichorVelocity.value = settings.ichorVelocity ?? 1.15;
    if (els.ichorPower) els.ichorPower.value = settings.ichorPower ?? 1.25;
    if (els.ichorThrust) els.ichorThrust.value = settings.ichorThrust ?? 1;
    if (els.ichorDust) els.ichorDust.value = settings.ichorDust ?? 80;
    if (els.ichorLighting) els.ichorLighting.value = settings.ichorLighting ?? 1.75;
    if (els.ichorEscape) els.ichorEscape.value = settings.ichorEscape ?? 1.05;
    if (els.ichorFluidity) els.ichorFluidity.value = settings.ichorFluidity ?? 1.35;
    if (els.ichorPressure) els.ichorPressure.value = settings.ichorPressure ?? 1;
    updateIchorPresetNote();
  }

  function makeLayerCanvas(id) {
    const canvas = document.createElement('canvas');
    canvas.className = 'effect-canvas';
    canvas.dataset.layerId = id;
    canvas.width = state.w;
    canvas.height = state.h;
    canvas.style.zIndex = String(10 + state.layers.length);
    layerHost.appendChild(canvas);
    return canvas;
  }

  function createLayer(type = els.effectType.value, name) {
    const id = uid('fx');
    const layer = {
      id,
      name: name || `${labelForType(type)} ${state.layers.length + 1}`,
      type,
      visible: true,
      seed: Math.floor(Math.random() * 1000000),
      settings: getUiSettings(),
      strokes: [],
      shapes: []
    };
    layer.canvas = makeLayerCanvas(id);
    layer.ctx = layer.canvas.getContext('2d');
    state.layers.push(layer);
    state.activeLayerId = id;
    state.activeShapeId = null;
    syncLayerZ();
    renderLayerList();
    markDirty();
    setStatus(`Added ${layer.name}.`);
    return layer;
  }

  function labelForType(type) {
    const labels = {
      electric: 'Thunder',
      ichor: 'Ichor Discharge',
      pulse: 'Pulse',
      blink: 'Blinking Lights',
      wave: 'Wave',
      hover: 'Hover',
      shimmer: 'Shimmer',
      motes: 'Motes',
      vectors: 'Vectors',
      paint: 'Paint',
      shape: 'Shape Layer'
    };
    return labels[type] || 'Effect';
  }

  function getActiveLayer() {
    return state.layers.find((layer) => layer.id === state.activeLayerId) || null;
  }

  function selectLayer(id) {
    const layer = state.layers.find((item) => item.id === id);
    if (!layer) return;
    state.activeLayerId = id;
    state.activeShapeId = null;
    els.effectType.value = layer.type;
    applySettingsToUi(layer.settings);
    setIchorPanelOpen(layer.type === 'ichor');
    renderLayerList();
    markDirty();
    setStatus(`Selected ${layer.name}.`);
  }

  function syncLayerZ() {
    state.layers.forEach((layer, index) => {
      if (layer.canvas) {
        layer.canvas.style.zIndex = String(10 + index);
        layer.canvas.width = state.w;
        layer.canvas.height = state.h;
      }
    });
  }

  function renderLayerList() {
    els.layerList.innerHTML = '';
    if (!state.layers.length) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'No effect layers yet. Press Add Layer or draw with the brush to create one.';
      els.layerList.appendChild(empty);
      return;
    }
    [...state.layers].reverse().forEach((layer) => {
      const row = document.createElement('div');
      row.className = 'layer-item' + (layer.id === state.activeLayerId ? ' active' : '');
      row.dataset.layerId = layer.id;

      const visible = document.createElement('input');
      visible.type = 'checkbox';
      visible.checked = layer.visible;
      visible.title = 'Toggle layer visibility';
      visible.addEventListener('change', () => {
        layer.visible = visible.checked;
        markDirty();
      });

      const label = document.createElement('button');
      label.type = 'button';
      label.className = 'layer-label-button';
      label.innerHTML = `<span class="layer-name">${escapeHtml(layer.name)}</span><span class="layer-meta">${escapeHtml(labelForType(layer.type))} · ${layer.strokes.length} stroke(s) · ${(layer.shapes || []).length} shape(s)</span>`;
      label.addEventListener('click', () => selectLayer(layer.id));

      const rename = document.createElement('button');
      rename.type = 'button';
      rename.textContent = '✎';
      rename.title = 'Rename layer';
      rename.addEventListener('click', () => {
        const next = prompt('Layer name:', layer.name);
        if (next && next.trim()) {
          layer.name = next.trim();
          renderLayerList();
          markDirty();
        }
      });

      row.append(visible, label, rename);
      els.layerList.appendChild(row);
    });
  }

  function escapeHtml(text) {
    return String(text).replace(/[&<>'"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[ch]));
  }

  function resizeAll(w, h, preserve = true) {
    const prevBase = preserve ? cloneCanvas(baseCanvas) : null;
    state.w = clamp(Math.round(w), 64, 8192);
    state.h = clamp(Math.round(h), 64, 8192);
    [baseCanvas, overlayCanvas].forEach((canvas) => {
      canvas.width = state.w;
      canvas.height = state.h;
    });
    if (prevBase) baseCtx.drawImage(prevBase, 0, 0, Math.min(prevBase.width, state.w), Math.min(prevBase.height, state.h));
    state.layers.forEach((layer) => {
      if (layer.canvas) layer.canvas.remove();
      layer.canvas = makeLayerCanvas(layer.id);
      layer.ctx = layer.canvas.getContext('2d');
    });
    els.canvasW.value = state.w;
    els.canvasH.value = state.h;
    updateStageSize();
    syncLayerZ();
    markDirty();
  }

  function cloneCanvas(source) {
    const c = document.createElement('canvas');
    c.width = source.width;
    c.height = source.height;
    c.getContext('2d').drawImage(source, 0, 0);
    return c;
  }

  function refreshRepairSource(label = 'repair source refreshed') {
    state.repairCanvas = cloneCanvas(baseCanvas);
    setStatus(label);
  }

  function updateStageSize() {
    stage.style.width = `${state.w * state.zoom}px`;
    stage.style.height = `${state.h * state.zoom}px`;
    [baseCanvas, overlayCanvas, layerHost].forEach((el) => {
      el.style.width = '100%';
      el.style.height = '100%';
    });
    els.zoomRange.value = String(state.zoom);
    els.zoomReadout.textContent = `${Math.round(state.zoom * 100)}%`;
  }

  function setZoom(nextZoom, anchor) {
    const oldZoom = state.zoom;
    const target = clamp(Number(nextZoom), 0.05, 8);
    if (!Number.isFinite(target) || target === oldZoom) return;

    let canvasX = state.w / 2;
    let canvasY = state.h / 2;
    let anchorX = viewport.clientWidth / 2;
    let anchorY = viewport.clientHeight / 2;
    const viewRect = viewport.getBoundingClientRect();
    if (anchor) {
      anchorX = anchor.clientX - viewRect.left;
      anchorY = anchor.clientY - viewRect.top;
      const stageRect = stage.getBoundingClientRect();
      canvasX = (anchor.clientX - stageRect.left) / oldZoom;
      canvasY = (anchor.clientY - stageRect.top) / oldZoom;
    } else {
      canvasX = (viewport.scrollLeft + anchorX - 36) / oldZoom;
      canvasY = (viewport.scrollTop + anchorY - 36) / oldZoom;
    }

    state.zoom = target;
    updateStageSize();
    viewport.scrollLeft = canvasX * target - anchorX + 36;
    viewport.scrollTop = canvasY * target - anchorY + 36;
  }

  function fitView() {
    const pad = 92;
    const z = Math.min((viewport.clientWidth - pad) / state.w, (viewport.clientHeight - pad) / state.h);
    setZoom(clamp(z, 0.05, 8));
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }

  function pointerToCanvas(evt) {
    const rect = stage.getBoundingClientRect();
    return {
      x: clamp((evt.clientX - rect.left) / state.zoom, 0, state.w),
      y: clamp((evt.clientY - rect.top) / state.zoom, 0, state.h)
    };
  }

  function drawOverlayRect(rect) {
    overlayCtx.clearRect(0, 0, state.w, state.h);
    if (!rect || rect.w < 2 || rect.h < 2) return;
    overlayCtx.save();
    overlayCtx.strokeStyle = 'rgba(0, 255, 255, 0.95)';
    overlayCtx.lineWidth = 2 / state.zoom;
    overlayCtx.setLineDash([10 / state.zoom, 6 / state.zoom]);
    overlayCtx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    overlayCtx.fillStyle = 'rgba(0, 255, 255, 0.10)';
    overlayCtx.fillRect(rect.x, rect.y, rect.w, rect.h);
    overlayCtx.restore();
  }

  function normalRect(a, b) {
    return {
      x: Math.min(a.x, b.x),
      y: Math.min(a.y, b.y),
      w: Math.abs(a.x - b.x),
      h: Math.abs(a.y - b.y)
    };
  }

  function sampleBaseColor(p) {
    const data = baseCtx.getImageData(Math.floor(p.x), Math.floor(p.y), 1, 1).data;
    return { r: data[0], g: data[1], b: data[2], a: data[3] };
  }

  function setPickedColor(color) {
    state.transparentColor = { r: color.r, g: color.g, b: color.b };
    const hex = rgbToHex(color.r, color.g, color.b);
    els.pickedColorChip.style.background = hex;
    els.pickedColorText.textContent = hex;
    updateTransparencyPreview();
  }

  function pushHistory(label = 'change', clearRedo = true) {
    try {
      const entry = serializeProject(false);
      state.history.push(entry);
      if (state.history.length > state.maxHistory) state.history.shift();
      if (clearRedo) state.redoHistory = [];
      setStatus(`Saved undo point: ${label}.`);
    } catch (err) {
      console.warn('History skipped:', err);
    }
  }

  function markDirty() {
    state.dirty = true;
  }

  function currentLayerSettingsToActive() {
    const layer = getActiveLayer();
    if (!layer) return;
    layer.type = els.effectType.value;
    layer.settings = getUiSettings();
    setIchorPanelOpen(layer.type === 'ichor');
    renderLayerList();
    updateIchorPresetNote();
    markDirty();
  }


  function paintRepairAt(p) {
    if (!state.repairCanvas) return setStatus('No repair source yet. Load an image or press Refresh Repair Source first.');
    const size = Math.max(1, safeNumber(els.brushSize.value, 28));
    const alpha = clamp(safeNumber(els.brushAlpha.value, 0.95), 0.01, 1);
    const ctx = baseCtx;
    ctx.save();
    ctx.beginPath();
    ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.globalAlpha = alpha;
    ctx.drawImage(state.repairCanvas, 0, 0);
    ctx.restore();
    markDirty();
  }

  function beginRepair(evt) {
    pushHistory('repair brush');
    state.drawing = true;
    state.dragStart = { repair: true };
    paintRepairAt(pointerToCanvas(evt));
  }

  function addRepairPoint(evt) {
    if (!state.drawing || !state.dragStart?.repair) return;
    paintRepairAt(pointerToCanvas(evt));
  }

  function applyFillAt(p) {
    pushHistory('fill tool');
    const image = baseCtx.getImageData(0, 0, state.w, state.h);
    const start = (Math.floor(p.y) * state.w + Math.floor(p.x)) * 4;
    const startColor = { r: image.data[start], g: image.data[start + 1], b: image.data[start + 2], a: image.data[start + 3] };
    const fill = hexToRgb(els.brushColor.value);
    const alpha = Math.round(clamp(safeNumber(els.brushAlpha.value, 0.95), 0, 1) * 255);
    const tol = 18;
    const mask = connectedColorMask(image, p, startColor, tol);
    let changed = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const di = i * 4;
      image.data[di] = fill.r;
      image.data[di + 1] = fill.g;
      image.data[di + 2] = fill.b;
      image.data[di + 3] = alpha;
      changed++;
    }
    baseCtx.putImageData(image, 0, 0);
    setStatus(`Fill tool recolored ${changed.toLocaleString()} connected pixels.`);
    markDirty();
  }

  function updateBrushCursor(evt) {
    if (!brushCursor) return;
    const active = ['brush', 'eraser', 'repair', 'fill', 'shape'].includes(state.tool);
    brushCursor.style.display = active ? 'block' : 'none';
    if (!active || !evt) return;
    const size = state.tool === 'shape' ? 34 : clamp(safeNumber(els.brushSize.value, 28) * state.zoom, 8, 180);
    const color = state.tool === 'repair' ? '#ffd56e' : state.tool === 'eraser' ? '#ffffff' : els.brushColor.value;
    brushCursor.style.left = `${evt.clientX}px`;
    brushCursor.style.top = `${evt.clientY}px`;
    brushCursor.style.width = `${size}px`;
    brushCursor.style.height = `${size}px`;
    brushCursor.style.color = color;
    brushCursor.style.background = rgba(hexToRgb(color), state.tool === 'repair' ? 0.18 : safeNumber(els.brushAlpha.value, 0.95) * 0.22);
    brushCursor.className = `brush-cursor ${state.tool}`;
  }

  function beginStroke(evt) {
    pushHistory(state.tool === 'eraser' ? 'layer eraser stroke' : 'brush stroke');
    let layer = getActiveLayer();
    if (!layer) layer = createLayer(els.effectType.value);
    layer.type = els.effectType.value;
    layer.settings = getUiSettings();
    const p = pointerToCanvas(evt);
    const stroke = {
      erase: state.tool === 'eraser',
      points: [p]
    };
    layer.strokes.push(stroke);
    state.drawing = true;
    state.dragStart = { layerId: layer.id, strokeIndex: layer.strokes.length - 1 };
    markDirty();
  }

  function addStrokePoint(evt) {
    if (!state.drawing || !state.dragStart) return;
    const layer = state.layers.find((item) => item.id === state.dragStart.layerId);
    if (!layer) return;
    const stroke = layer.strokes[state.dragStart.strokeIndex];
    const p = pointerToCanvas(evt);
    const last = stroke.points[stroke.points.length - 1];
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (Math.hypot(dx, dy) >= 1.5) {
      stroke.points.push(p);
      markDirty();
    }
  }

  function endStroke() {
    if (state.drawing) {
      state.drawing = false;
      state.dragStart = null;
      renderLayerList();
      markDirty();
    }
  }

  function beginPan(evt) {
    state.panning = true;
    viewport.classList.add('panning');
    state.panStart = { x: evt.clientX, y: evt.clientY, sx: viewport.scrollLeft, sy: viewport.scrollTop };
  }

  function movePan(evt) {
    if (!state.panning || !state.panStart) return;
    viewport.scrollLeft = state.panStart.sx - (evt.clientX - state.panStart.x);
    viewport.scrollTop = state.panStart.sy - (evt.clientY - state.panStart.y);
  }

  function endPan() {
    state.panning = false;
    state.panStart = null;
    viewport.classList.remove('panning');
  }

  function renderLayers(time) {
    state.layers.forEach((layer) => renderLayer(layer, time));
    state.dirty = false;
  }

  function renderLayer(layer, time) {
    const ctx = layer.ctx;
    if (!ctx) return;
    ctx.clearRect(0, 0, state.w, state.h);
    if (!layer.visible) return;
    const settings = layer.settings || getUiSettings();
    ctx.save();
    const blur = Math.max(0, safeNumber(settings.blur, 0));
    if (blur) ctx.filter = `blur(${blur}px)`;
    for (const stroke of (layer.strokes || [])) {
      drawStroke(ctx, stroke, layer.type, settings, time, layer.seed);
    }
    for (const shape of (layer.shapes || [])) {
      drawShape(ctx, shape, time, layer.seed);
    }
    ctx.restore();
  }

  function drawStroke(ctx, stroke, type, settings, time, seed) {
    if (!stroke.points || !stroke.points.length) return;
    if (stroke.erase) {
      drawBasicLine(ctx, stroke.points, {
        color: '#000000',
        width: settings.size,
        alpha: 1,
        composite: 'destination-out',
        shadowBlur: 0,
        sharpness: 0
      });
      return;
    }

    const t = (time / 1000) * safeNumber(settings.speed, 1);
    const alpha = safeNumber(settings.alpha, 1) * safeNumber(settings.transparency, 1);
    const baseWidth = Math.max(1, safeNumber(settings.size, 20));
    const intensity = safeNumber(settings.intensity, 1);
    const waveAmp = safeNumber(settings.waveAmp, 0);
    const color = settings.color || '#00ffff';

    if (type === 'electric') drawElectric(ctx, stroke.points, settings, t, seed);
    else if (type === 'ichor') drawIchor(ctx, stroke.points, settings, t, seed);
    else if (type === 'blink') drawBlinkingLights(ctx, stroke.points, settings, t, seed);
    else if (type === 'wave') drawBasicLine(ctx, wavePoints(stroke.points, settings, t), { color, width: baseWidth, alpha, shadowBlur: 12 * intensity, sharpness: settings.sharpness });
    else if (type === 'hover') drawBasicLine(ctx, hoverPoints(stroke.points, waveAmp, t), { color, width: baseWidth, alpha, shadowBlur: 12 * intensity, sharpness: settings.sharpness });
    else if (type === 'shimmer') drawShimmer(ctx, stroke.points, settings, t, seed);
    else if (type === 'motes') drawMotes(ctx, stroke.points, settings, t, seed);
    else if (type === 'vectors') drawVectors(ctx, stroke.points, settings, t);
    else if (type === 'pulse') {
      const pulsedWidth = baseWidth * (1 + Math.sin(t * Math.PI * 2) * 0.22 * intensity);
      const pulsedAlpha = alpha * (0.72 + 0.28 * Math.sin(t * Math.PI * 2 + 1.2));
      drawBasicLine(ctx, stroke.points, { color, width: pulsedWidth, alpha: pulsedAlpha, shadowBlur: 18 * intensity, sharpness: settings.sharpness });
    } else {
      drawStyledBrush(ctx, stroke.points, settings, t, seed);
    }
  }

  function drawStyledBrush(ctx, points, settings, t, seed) {
    const color = settings.color || '#00ffff';
    const alpha = safeNumber(settings.alpha, 1) * safeNumber(settings.transparency, 1);
    const width = Math.max(1, safeNumber(settings.size, 20));
    const kind = settings.brushKind || 'regular';
    const intensity = safeNumber(settings.intensity, 1);
    if (kind === 'pencil') {
      drawBasicLine(ctx, jitterPoints(points, seed, width * .08), { color, width: width * .36, alpha: alpha * .78, shadowBlur: 0, sharpness: .2 });
      drawBasicLine(ctx, jitterPoints(points, seed + 33, width * .05), { color, width: width * .12, alpha: alpha * .38, shadowBlur: 0, sharpness: 0 });
    } else if (kind === 'marker') {
      drawBasicLine(ctx, points, { color, width: width * 1.08, alpha: alpha * .42, shadowBlur: width * .12, sharpness: 0 });
      drawBasicLine(ctx, points, { color, width: width * .74, alpha: alpha * .35, shadowBlur: 0, sharpness: 0 });
    } else if (kind === 'crayon') {
      for (let i = 0; i < 5; i++) drawBasicLine(ctx, jitterPoints(points, seed + i * 19 + Math.floor(t * 4), width * .18), { color, width: width * (0.22 + i * .035), alpha: alpha * .18, shadowBlur: 0, sharpness: 0 });
    } else if (kind === 'spraypaint') {
      ctx.save();
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = width * .28;
      const count = Math.max(8, Math.round(points.length * width * .08));
      for (let i = 0; i < count; i++) {
        const p = points[Math.floor(seededNoise(seed + i * 13) * points.length)] || points[0];
        const a = seededNoise(seed + i * 17) * Math.PI * 2;
        const r = Math.pow(seededNoise(seed + i * 23), .55) * width * .72;
        ctx.globalAlpha = alpha * (.05 + seededNoise(seed + i * 29) * .18);
        ctx.beginPath();
        ctx.arc(p.x + Math.cos(a) * r, p.y + Math.sin(a) * r, Math.max(.5, width * (.012 + seededNoise(seed + i * 31) * .028)), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (kind === 'charcoal') {
      drawBasicLine(ctx, jitterPoints(points, seed, width * .22), { color, width: width * .9, alpha: alpha * .25, shadowBlur: width * .25, sharpness: 0 });
      for (let i = 0; i < 4; i++) drawBasicLine(ctx, jitterPoints(points, seed + 71 * i, width * .28), { color, width: width * (.18 + i*.05), alpha: alpha * .22, shadowBlur: 0, sharpness: 0 });
    } else {
      drawBasicLine(ctx, points, { color, width, alpha, shadowBlur: 8 * intensity, sharpness: settings.sharpness });
    }
  }

  function jitterPoints(points, seed, amount) {
    return points.map((p, i) => ({
      x: p.x + (seededNoise(seed + i * 41) - .5) * amount,
      y: p.y + (seededNoise(seed + i * 59) - .5) * amount
    }));
  }

  function drawBasicLine(ctx, points, opts) {
    if (!points.length) return;
    ctx.save();
    ctx.globalCompositeOperation = opts.composite || 'source-over';
    ctx.globalAlpha = clamp(opts.alpha ?? 1, 0, 1);
    ctx.strokeStyle = opts.color;
    ctx.lineWidth = Math.max(0.5, opts.width || 1);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = opts.color;
    ctx.shadowBlur = opts.shadowBlur || 0;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      const mid = midpoint(points[i - 1], points[i]);
      ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, mid.x, mid.y);
    }
    const last = points[points.length - 1];
    ctx.lineTo(last.x, last.y);
    ctx.stroke();
    if ((opts.sharpness || 0) > 0.05 && opts.composite !== 'destination-out') {
      ctx.globalAlpha = clamp((opts.alpha ?? 1) * 0.88, 0, 1);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(235,255,255,0.92)';
      ctx.lineWidth = Math.max(0.5, (opts.width || 1) * 0.16 * opts.sharpness);
      ctx.stroke();
    }
    ctx.restore();
  }

  function midpoint(a, b) {
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  }

  function wavePoints(points, settings, t) {
    const amp = safeNumber(settings.waveAmp, 0);
    const angle = (safeNumber(settings.angle, 0) + 90) * Math.PI / 180;
    const nx = Math.cos(angle);
    const ny = Math.sin(angle);
    return points.map((p, i) => {
      const offset = Math.sin(i * 0.42 + t * Math.PI * 2) * amp;
      return { x: p.x + nx * offset, y: p.y + ny * offset };
    });
  }

  function hoverPoints(points, amp, t) {
    const offset = Math.sin(t * Math.PI * 2) * amp;
    return points.map((p) => ({ x: p.x, y: p.y + offset }));
  }

  function getIchorPreset(id) {
    return ICHOR_PRESETS.find((preset) => preset.id === id) || ICHOR_PRESETS.find((preset) => preset.id === 'weapon:Shotgun') || ICHOR_PRESETS[0];
  }

  function setIchorPanelOpen(open) {
    if (!els.ichorSettingsPanel) return;
    els.ichorSettingsPanel.classList.toggle('is-closed', !open);
  }

  function updateIchorPresetNote() {
    if (!els.ichorPresetNote || !els.ichorPreset) return;
    const preset = getIchorPreset(els.ichorPreset.value);
    if (!preset) return;
    els.ichorPresetNote.textContent = `${preset.name}: ${preset.note} External discharge only; no internal battery/core is drawn.`;
  }

  function populateIchorPresets() {
    if (!els.ichorPreset) return;
    els.ichorPreset.innerHTML = '';
    const groups = [
      ['weapon', 'Thundercoil Weapons'],
      ['skyship', 'Skyship Engines / Sails']
    ];
    groups.forEach(([kind, label]) => {
      const group = document.createElement('optgroup');
      group.label = label;
      ICHOR_PRESETS.filter((preset) => preset.kind === kind).forEach((preset) => {
        const option = document.createElement('option');
        option.value = preset.id;
        option.textContent = preset.name;
        group.appendChild(option);
      });
      els.ichorPreset.appendChild(group);
    });
    els.ichorPreset.value = 'weapon:Shotgun';
    updateIchorPresetNote();
  }

  function applyIchorPresetToControls(preset, keepUserScale = false) {
    if (!preset) return;
    const scale = keepUserScale ? {
      velocity: safeNumber(els.ichorVelocity?.value, preset.velocity),
      power: safeNumber(els.ichorPower?.value, preset.power),
      thrust: safeNumber(els.ichorThrust?.value, preset.thrust),
      dust: safeNumber(els.ichorDust?.value, preset.dust),
      lighting: safeNumber(els.ichorLighting?.value, preset.lighting),
      escape: safeNumber(els.ichorEscape?.value, preset.escape),
      fluidity: safeNumber(els.ichorFluidity?.value, preset.fluidity),
      pressure: safeNumber(els.ichorPressure?.value, preset.pressure)
    } : preset;
    if (els.ichorVelocity) els.ichorVelocity.value = scale.velocity;
    if (els.ichorPower) els.ichorPower.value = scale.power;
    if (els.ichorThrust) els.ichorThrust.value = scale.thrust;
    if (els.ichorDust) els.ichorDust.value = scale.dust;
    if (els.ichorLighting) els.ichorLighting.value = scale.lighting;
    if (els.ichorEscape) els.ichorEscape.value = scale.escape;
    if (els.ichorFluidity) els.ichorFluidity.value = scale.fluidity;
    if (els.ichorPressure) els.ichorPressure.value = scale.pressure;
    updateIchorPresetNote();
  }

  function convertActiveLayerToIchor() {
    let layer = getActiveLayer();
    if (!layer) layer = createLayer('ichor', 'Ichor Discharge 1');
    if (!layer.strokes.length) {
      setStatus('Draw rough guide strokes first, then press Ichor Convert.');
      setIchorPanelOpen(true);
      return;
    }
    pushHistory('ichor convert');
    const preset = getIchorPreset(els.ichorPreset?.value || layer.settings?.ichorPreset || 'weapon:Shotgun');
    applyIchorPresetToControls(preset);
    layer.type = 'ichor';
    layer.name = /ichor/i.test(layer.name) ? layer.name : `Ichor ${layer.name}`;
    els.effectType.value = 'ichor';
    const settings = getUiSettings();
    settings.color = settings.color || '#00ffff';
    settings.ichorPreset = preset.id;
    layer.settings = settings;
    setIchorPanelOpen(true);
    renderLayerList();
    markDirty();
    setStatus(`Ichor Convert applied: ${preset.name}. Sliders now reshape live liquid-electric currents without adding a core.`);
  }

  function tangentAt(points, i) {
    const a = points[Math.max(0, i - 1)] || points[i];
    const b = points[Math.min(points.length - 1, i + 1)] || points[i];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len, angle: Math.atan2(dy, dx) };
  }

  function ichorWarpPoints(points, settings, t, seed, pass = 0) {
    const velocity = safeNumber(settings.ichorVelocity, 1.15);
    const power = safeNumber(settings.ichorPower, 1.25);
    const fluidity = safeNumber(settings.ichorFluidity, 1.35);
    const pressure = safeNumber(settings.ichorPressure, 1);
    const thrust = safeNumber(settings.ichorThrust, 1);
    const angleBias = safeNumber(settings.angle, 0) * Math.PI / 180;
    const baseAmp = (safeNumber(settings.waveAmp, 28) * 0.16 + safeNumber(settings.size, 28) * 0.18) * (0.45 + fluidity * 0.55) * (0.7 + pressure * 0.35);
    return points.map((p, i) => {
      const tan = tangentAt(points, i);
      const nx = -tan.y;
      const ny = tan.x;
      const phase = i * (0.34 + pass * 0.07) - t * (2.2 + velocity * 3.5) + seed * 0.013;
      const pulse = Math.sin(phase) + Math.sin(phase * 0.47 + pass * 2.1) * 0.55;
      const crawlingNoise = seededNoise(seed + i * (19 + pass * 11) + Math.floor(t * (12 + velocity * 18)));
      const side = (pulse * 0.5 + (crawlingNoise - 0.5) * 1.25) * baseAmp * (0.5 + power * 0.22);
      const forward = Math.sin(phase * 0.73) * thrust * 2.6 + Math.cos(angleBias - tan.angle) * thrust * 1.4;
      return { x: p.x + nx * side + tan.x * forward, y: p.y + ny * side + tan.y * forward };
    });
  }

  function drawSegmentLine(ctx, a, b, opts) {
    drawBasicLine(ctx, [a, b], opts);
  }

  function drawIchor(ctx, points, settings, t, seed) {
    const alpha = safeNumber(settings.alpha, 1) * safeNumber(settings.transparency, 1);
    const width = Math.max(1, safeNumber(settings.size, 28));
    const intensity = safeNumber(settings.intensity, 1) * safeNumber(settings.ichorPower, 1.25);
    const velocity = safeNumber(settings.ichorVelocity, 1.15);
    const thrust = safeNumber(settings.ichorThrust, 1);
    const dust = Math.floor(safeNumber(settings.ichorDust, 80));
    const lighting = safeNumber(settings.ichorLighting, 1.75);
    const escape = safeNumber(settings.ichorEscape, 1.05);
    const fluidity = safeNumber(settings.ichorFluidity, 1.35);
    const pressure = safeNumber(settings.ichorPressure, 1);
    const sharpness = safeNumber(settings.sharpness, 1);
    const bias = safeNumber(settings.angle, 0) * Math.PI / 180;
    const primary = ichorWarpPoints(points, settings, t, seed, 0);
    const secondary = ichorWarpPoints(points, settings, t + 0.17, seed + 101, 1);
    const tertiary = ichorWarpPoints(points, settings, t + 0.31, seed + 303, 2);
    const mist = ichorPick('mist', seed + 1);
    const ion = ichorPick('ion', seed + 2);
    const glow = ichorPick('glow', seed + 3);
    const arc = ichorPick('arc', seed + 4);
    const core = ichorPick('core', seed + 5);
    const deep = ichorPick('deep', seed + 6);
    const shadow = ichorPick('shadow', seed + 7);
    const residue = ichorPick('residue', seed + 8);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    drawBasicLine(ctx, primary, { color: mist, width: width * (2.15 + fluidity * 0.42 + pressure * 0.28), alpha: alpha * 0.13, shadowBlur: width * (1.4 + lighting * 1.1), sharpness: 0 });
    drawBasicLine(ctx, secondary, { color: glow, width: width * (1.35 + fluidity * 0.22), alpha: alpha * 0.28, shadowBlur: width * (0.9 + lighting * 0.65), sharpness: 0 });
    drawBasicLine(ctx, primary, { color: deep, width: width * (0.94 + pressure * 0.18), alpha: alpha * 0.38, shadowBlur: 12 * lighting, sharpness: 0 });
    drawBasicLine(ctx, primary, { color: core, width: width * 0.58, alpha: alpha * 0.74, shadowBlur: 18 * lighting, sharpness });
    drawBasicLine(ctx, tertiary, { color: ion, width: width * (0.11 + sharpness * 0.05), alpha: alpha * 0.96, shadowBlur: 7 * lighting, sharpness });

    const flowRepeats = 3 + Math.round(pressure * 2 + fluidity);
    for (let i = 1; i < primary.length; i++) {
      const phase = (i / Math.max(1, primary.length - 1) * flowRepeats - t * (0.65 + velocity * 0.58) + seededNoise(seed + i) * 0.18) % 1;
      const glowGate = 0.18 + 0.82 * Math.max(0, Math.sin((phase < 0 ? phase + 1 : phase) * Math.PI));
      if (glowGate < 0.36) continue;
      drawSegmentLine(ctx, primary[i - 1], primary[i], { color: ion, width: width * (0.08 + glowGate * 0.12), alpha: alpha * glowGate, shadowBlur: 10 * lighting, sharpness });
      drawSegmentLine(ctx, primary[i - 1], primary[i], { color: arc, width: width * (0.18 + glowGate * 0.08), alpha: alpha * glowGate * 0.36, shadowBlur: 14 * lighting, sharpness: 0 });
    }

    const branchStep = Math.max(3, Math.round(18 / Math.max(0.35, escape + pressure * 0.24)));
    const branchShift = Math.floor((t * (8 + velocity * 7) + seed) % branchStep);
    for (let i = 2 + branchShift; i < primary.length - 1; i += branchStep) {
      const trigger = seededNoise(seed + i * 37 + Math.floor(t * (5 + velocity * 5)));
      if (trigger > clamp(0.26 + escape * 0.22 + lighting * 0.08, 0.18, 0.92)) continue;
      const root = primary[i];
      const tan = tangentAt(primary, i);
      const side = seededNoise(seed + i * 11) > 0.5 ? 1 : -1;
      const branchAngle = tan.angle + side * (0.42 + escape * 0.32 + seededNoise(seed + i * 17) * 0.55) + Math.sin(t * 2 + i) * 0.18 + Math.cos(bias - tan.angle) * 0.18;
      const len = width * (0.8 + escape * 1.25 + thrust * 0.8 + pressure * 0.55) * (0.6 + seededNoise(seed + i * 23) * 1.2);
      const mid = { x: root.x + Math.cos(branchAngle) * len * 0.45 + Math.cos(branchAngle + Math.PI / 2) * len * 0.14 * Math.sin(t * 3 + i), y: root.y + Math.sin(branchAngle) * len * 0.45 + Math.sin(branchAngle + Math.PI / 2) * len * 0.14 * Math.sin(t * 3 + i) };
      const tip = { x: root.x + Math.cos(branchAngle) * len, y: root.y + Math.sin(branchAngle) * len };
      drawBasicLine(ctx, [root, mid, tip], { color: arc, width: width * (0.07 + trigger * 0.08), alpha: alpha * (0.38 + trigger * 0.34), shadowBlur: 14 * lighting, sharpness });
      if (escape > 1.25 && seededNoise(seed + i * 29 + Math.floor(t * 9)) > 0.55) {
        const forkAngle = branchAngle + side * (0.42 + seededNoise(seed + i * 31) * 0.45);
        const forkTip = { x: tip.x + Math.cos(forkAngle) * len * 0.46, y: tip.y + Math.sin(forkAngle) * len * 0.46 };
        drawBasicLine(ctx, [tip, forkTip], { color: mist, width: width * 0.045, alpha: alpha * 0.48, shadowBlur: 10 * lighting, sharpness });
      }
    }

    ctx.fillStyle = mist;
    ctx.shadowColor = glow;
    ctx.shadowBlur = width * (0.4 + lighting * 0.36);
    const moteCount = Math.min(320, Math.max(0, dust));
    for (let i = 0; i < moteCount; i++) {
      const idx = Math.floor(seededNoise(seed + i * 13) * primary.length);
      const p = primary[idx] || primary[0];
      const tan = tangentAt(primary, idx);
      const age = (t * (0.18 + velocity * 0.08) + seededNoise(seed + i * 19)) % 1;
      const side = seededNoise(seed + i * 41) > 0.5 ? 1 : -1;
      const normalPush = (age * age) * width * (0.25 + escape * 0.95) * side;
      const flowPush = (age - 0.2) * (safeNumber(settings.vectorLength, 44) * 0.35 + thrust * width * 1.4);
      const wobble = Math.sin(t * 5 + i) * width * 0.12 * fluidity;
      const x = p.x + tan.x * flowPush - tan.y * normalPush + Math.cos(bias) * thrust * age * 5 + wobble;
      const y = p.y + tan.y * flowPush + tan.x * normalPush + Math.sin(bias) * thrust * age * 5 - wobble;
      const fade = Math.sin(age * Math.PI);
      ctx.globalAlpha = alpha * fade * (0.12 + lighting * 0.13);
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.8, width * (0.025 + seededNoise(seed + i * 29) * 0.05) * (0.7 + pressure * 0.25)), 0, Math.PI * 2);
      ctx.fill();
      if (seededNoise(seed + i * 43) > .82) {
        ctx.fillStyle = residue;
        ctx.globalAlpha *= .45;
        ctx.beginPath();
        ctx.arc(x + width*.08, y + width*.08, Math.max(.5, width*.018), 0, Math.PI*2);
        ctx.fill();
        ctx.fillStyle = mist;
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    drawBasicLine(ctx, primary, { color: shadow, width: width * (0.22 + pressure * 0.06), alpha: alpha * .16, shadowBlur: 0, sharpness: 0 });
    ctx.restore();
  }

  function drawElectric(ctx, points, settings, t, seed) {
    const color = settings.color || '#00ffff';
    const alpha = safeNumber(settings.alpha, 1) * safeNumber(settings.transparency, 1);
    const width = Math.max(1, safeNumber(settings.size, 20));
    const intensity = safeNumber(settings.intensity, 1);
    const amp = safeNumber(settings.waveAmp, 18) * 0.38 * intensity;
    const jagged = points.map((p, i) => {
      const n = seededNoise(seed + i * 17 + Math.floor(t * 24));
      const n2 = seededNoise(seed + i * 31 + Math.floor(t * 19));
      return { x: p.x + (n - 0.5) * amp, y: p.y + (n2 - 0.5) * amp };
    });
    drawBasicLine(ctx, jagged, { color, width: width * 0.96, alpha: alpha * 0.72, shadowBlur: 22 * intensity, sharpness: settings.sharpness });
    drawBasicLine(ctx, jagged, { color: 'rgba(232,255,255,1)', width: width * 0.22, alpha: alpha, shadowBlur: 4, sharpness: settings.sharpness });
    for (let i = 2; i < jagged.length; i += 8) {
      const p = jagged[i];
      const branchAngle = ((settings.angle || 0) + (seededNoise(seed + i) > 0.5 ? 65 : -65)) * Math.PI / 180;
      const len = width * (0.8 + seededNoise(seed + i * 7) * 2.4) * intensity;
      drawBasicLine(ctx, [p, { x: p.x + Math.cos(branchAngle) * len, y: p.y + Math.sin(branchAngle) * len }], {
        color,
        width: width * 0.18,
        alpha: alpha * 0.55,
        shadowBlur: 10 * intensity,
        sharpness: settings.sharpness
      });
    }
  }

  function drawBlinkingLights(ctx, points, settings, t, seed) {
    const color = settings.color || '#00ffff';
    const size = Math.max(2, safeNumber(settings.size, 20));
    const alphaBase = safeNumber(settings.alpha, 1) * safeNumber(settings.transparency, 1);
    const step = Math.max(2, Math.round(34 / Math.max(0.2, safeNumber(settings.intensity, 1))));
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < points.length; i += step) {
      const p = points[i];
      const blink = 0.2 + 0.8 * Math.max(0, Math.sin(t * 6 + i * 0.7 + seed));
      ctx.globalAlpha = alphaBase * blink;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = size * 1.2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * (0.22 + blink * 0.18), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = alphaBase * blink * 0.9;
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(p.x, p.y, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShimmer(ctx, points, settings, t, seed) {
    const color = settings.color || '#00ffff';
    const alpha = safeNumber(settings.alpha, 1) * safeNumber(settings.transparency, 1);
    const width = Math.max(1, safeNumber(settings.size, 20));
    drawBasicLine(ctx, points, { color, width, alpha: alpha * 0.48, shadowBlur: 10 * settings.intensity, sharpness: settings.sharpness });
    ctx.save();
    ctx.fillStyle = 'white';
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = width;
    const count = Math.min(80, Math.max(8, Math.floor(points.length / 6)));
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(seededNoise(seed + i * 41) * points.length);
      const p = points[idx] || points[0];
      const shine = Math.max(0, Math.sin(t * 5 + i * 1.9));
      if (shine < 0.55) continue;
      const r = width * (0.08 + shine * 0.16);
      ctx.globalAlpha = alpha * shine;
      ctx.beginPath();
      ctx.moveTo(p.x - r * 2.2, p.y);
      ctx.lineTo(p.x + r * 2.2, p.y);
      ctx.moveTo(p.x, p.y - r * 2.2);
      ctx.lineTo(p.x, p.y + r * 2.2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawMotes(ctx, points, settings, t, seed) {
    const color = settings.color || '#00ffff';
    const alpha = safeNumber(settings.alpha, 1) * safeNumber(settings.transparency, 1);
    const width = Math.max(1, safeNumber(settings.size, 20));
    const count = Math.floor(safeNumber(settings.moteCount, 60));
    const angle = safeNumber(settings.angle, 0) * Math.PI / 180;
    drawBasicLine(ctx, points, { color, width: width * 0.34, alpha: alpha * 0.33, shadowBlur: 14 * settings.intensity, sharpness: settings.sharpness });
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = width * 0.8;
    for (let i = 0; i < count; i++) {
      const p = points[Math.floor(seededNoise(seed + i * 13) * points.length)] || points[0];
      const age = (t * 0.22 + seededNoise(seed + i * 19)) % 1;
      const drift = (age - 0.5) * safeNumber(settings.vectorLength, 44) * 1.8;
      const wobble = (seededNoise(seed + i * 23 + Math.floor(t * 20)) - 0.5) * safeNumber(settings.waveAmp, 28);
      const x = p.x + Math.cos(angle) * drift - Math.sin(angle) * wobble;
      const y = p.y + Math.sin(angle) * drift + Math.cos(angle) * wobble;
      const fade = Math.sin(age * Math.PI);
      ctx.globalAlpha = alpha * fade * 0.85;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(1, width * (0.045 + seededNoise(seed + i * 29) * 0.09)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawVectors(ctx, points, settings, t) {
    const color = settings.color || '#00ffff';
    const alpha = safeNumber(settings.alpha, 1) * safeNumber(settings.transparency, 1);
    const width = Math.max(1, safeNumber(settings.size, 20));
    const len = safeNumber(settings.vectorLength, 44);
    drawBasicLine(ctx, points, { color, width: width * 0.3, alpha: alpha * 0.45, shadowBlur: 10 * settings.intensity, sharpness: settings.sharpness });
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = Math.max(1, width * 0.12);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = width * 0.6;
    const step = Math.max(8, Math.round(34 - settings.intensity * 6));
    for (let i = 1; i < points.length; i += step) {
      const a = points[i - 1];
      const b = points[i];
      const ang = Math.atan2(b.y - a.y, b.x - a.x) + Math.sin(t * 2 + i) * 0.14;
      const p = b;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(ang) * len, p.y + Math.sin(ang) * len);
      ctx.stroke();
      const tip = { x: p.x + Math.cos(ang) * len, y: p.y + Math.sin(ang) * len };
      ctx.beginPath();
      ctx.moveTo(tip.x, tip.y);
      ctx.lineTo(tip.x - Math.cos(ang - 0.55) * len * 0.28, tip.y - Math.sin(ang - 0.55) * len * 0.28);
      ctx.lineTo(tip.x - Math.cos(ang + 0.55) * len * 0.28, tip.y - Math.sin(ang + 0.55) * len * 0.28);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }


  function withShapeTransform(ctx, shape, fn) {
    ctx.save();
    ctx.translate(shape.x, shape.y);
    ctx.rotate((safeNumber(shape.rotation, 0) * Math.PI) / 180);
    fn();
    ctx.restore();
  }

  function regularPolygonPath(ctx, sides, radiusX, radiusY, pointOffset = -Math.PI / 2) {
    sides = clamp(Math.round(sides || 6), 3, 64);
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const a = pointOffset + (i / sides) * Math.PI * 2;
      const x = Math.cos(a) * radiusX;
      const y = Math.sin(a) * radiusY;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function roundedRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function applyShapePaint(ctx, shape, fillOverride) {
    ctx.globalAlpha = clamp(safeNumber(shape.alpha, 0.85), 0.01, 1);
    ctx.fillStyle = fillOverride || shape.fill || '#00ffff';
    ctx.strokeStyle = shape.border || '#e8ffff';
    ctx.lineWidth = Math.max(0, safeNumber(shape.borderWidth, 4));
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowColor = shape.fill || '#00ffff';
    ctx.shadowBlur = Math.max(0, safeNumber(shape.borderWidth, 4) * 1.5);
    if ((shape.fill || fillOverride) !== 'transparent') ctx.fill();
    if (ctx.lineWidth > 0) ctx.stroke();
  }

  function drawShape(ctx, shape) {
    const w = Math.max(2, safeNumber(shape.w, 160));
    const h = Math.max(2, safeNumber(shape.h, 110));
    const type = shape.type || 'circle';
    withShapeTransform(ctx, shape, () => {
      ctx.save();
      if (type === 'circle' || type === 'ellipse' || type === 'sphere') {
        ctx.beginPath();
        ctx.ellipse(0, 0, w / 2, (type === 'circle' ? w : h) / 2, 0, 0, Math.PI * 2);
        if (type === 'sphere') {
          const grad = ctx.createRadialGradient(-w * .18, -h * .22, 2, 0, 0, Math.max(w, h) * .55);
          grad.addColorStop(0, '#e8ffff');
          grad.addColorStop(.45, shape.fill || '#00ffff');
          grad.addColorStop(1, '#003a3a');
          applyShapePaint(ctx, shape, grad);
        } else applyShapePaint(ctx, shape);
      } else if (type === 'square' || type === 'rectangle') {
        roundedRectPath(ctx, -w / 2, -h / 2, type === 'square' ? w : w, type === 'square' ? w : h, Math.min(w, h) * .06);
        applyShapePaint(ctx, shape);
      } else if (type === 'triangle') {
        regularPolygonPath(ctx, 3, w / 2, h / 2);
        applyShapePaint(ctx, shape);
      } else if (type === 'diamond') {
        regularPolygonPath(ctx, 4, w / 2, h / 2, 0);
        applyShapePaint(ctx, shape);
      } else if (type === 'pentagon') {
        regularPolygonPath(ctx, 5, w / 2, h / 2);
        applyShapePaint(ctx, shape);
      } else if (type === 'hexagon') {
        regularPolygonPath(ctx, 6, w / 2, h / 2);
        applyShapePaint(ctx, shape);
      } else if (type === 'octagon') {
        regularPolygonPath(ctx, 8, w / 2, h / 2);
        applyShapePaint(ctx, shape);
      } else if (type === 'polygon') {
        regularPolygonPath(ctx, safeNumber(shape.sides, 6), w / 2, h / 2);
        applyShapePaint(ctx, shape);
      } else if (type === 'star' || type === 'gear') {
        const points = type === 'gear' ? 18 : 10;
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
          const a = -Math.PI / 2 + (i / points) * Math.PI * 2;
          const rr = i % 2 ? (type === 'gear' ? .72 : .42) : 1;
          const x = Math.cos(a) * w * .5 * rr;
          const y = Math.sin(a) * h * .5 * rr;
          if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        applyShapePaint(ctx, shape);
      } else if (type === 'heart') {
        ctx.beginPath();
        ctx.moveTo(0, h * .32);
        ctx.bezierCurveTo(-w * .55, -h * .05, -w * .38, -h * .52, 0, -h * .22);
        ctx.bezierCurveTo(w * .38, -h * .52, w * .55, -h * .05, 0, h * .32);
        ctx.closePath();
        applyShapePaint(ctx, shape);
      } else if (type === 'arrow') {
        ctx.beginPath();
        ctx.moveTo(-w * .5, -h * .14); ctx.lineTo(w * .14, -h * .14); ctx.lineTo(w * .14, -h * .38);
        ctx.lineTo(w * .5, 0); ctx.lineTo(w * .14, h * .38); ctx.lineTo(w * .14, h * .14); ctx.lineTo(-w * .5, h * .14);
        ctx.closePath(); applyShapePaint(ctx, shape);
      } else if (type === 'thought' || type === 'cloud') {
        ctx.beginPath();
        const bubbles = type === 'cloud' ? [[-.28,.05,.26],[-.08,-.12,.31],[.18,-.06,.27],[.34,.08,.22],[0,.12,.36]] : [[-.27,-.05,.28],[.03,-.15,.34],[.31,-.02,.25],[.03,.12,.38],[-.41,.31,.10],[-.56,.48,.055]];
        bubbles.forEach(([x,y,r], i) => { ctx.moveTo(x*w + r*w, y*h); ctx.ellipse(x*w, y*h, r*w, r*h, 0, 0, Math.PI*2); });
        applyShapePaint(ctx, shape);
      } else if (type === 'shout') {
        const spikes = 18; ctx.beginPath();
        for (let i=0;i<spikes;i++){const a=-Math.PI/2+i/spikes*Math.PI*2; const rr=i%2?0.78:1; const x=Math.cos(a)*w*.5*rr, y=Math.sin(a)*h*.5*rr; if(!i)ctx.moveTo(x,y); else ctx.lineTo(x,y);} ctx.closePath(); applyShapePaint(ctx, shape);
      } else if (type === 'cube') {
        const dx=w*.18, dy=-h*.18;
        roundedRectPath(ctx,-w*.38,-h*.28,w*.58,h*.56,6); applyShapePaint(ctx, shape);
        ctx.beginPath(); ctx.moveTo(w*.20,-h*.28); ctx.lineTo(w*.20+dx,-h*.28+dy); ctx.lineTo(-w*.38+dx,-h*.28+dy); ctx.lineTo(-w*.38,-h*.28); ctx.closePath(); applyShapePaint(ctx, shape, 'rgba(232,255,255,.45)');
        ctx.beginPath(); ctx.moveTo(w*.20,-h*.28); ctx.lineTo(w*.20+dx,-h*.28+dy); ctx.lineTo(w*.20+dx,h*.28+dy); ctx.lineTo(w*.20,h*.28); ctx.closePath(); applyShapePaint(ctx, shape, 'rgba(0,139,139,.55)');
      } else if (type === 'cylinder') {
        ctx.beginPath(); ctx.ellipse(0,-h*.32,w*.42,h*.14,0,0,Math.PI*2); ctx.rect(-w*.42,-h*.32,w*.84,h*.64); ctx.ellipse(0,h*.32,w*.42,h*.14,0,0,Math.PI*2); applyShapePaint(ctx, shape);
      } else if (type === 'cone') {
        ctx.beginPath(); ctx.moveTo(0,-h*.5); ctx.lineTo(w*.42,h*.32); ctx.ellipse(0,h*.32,w*.42,h*.14,0,0,Math.PI); ctx.closePath(); applyShapePaint(ctx, shape);
      } else if (type === 'pyramid') {
        ctx.beginPath(); ctx.moveTo(0,-h*.48); ctx.lineTo(w*.45,h*.38); ctx.lineTo(-w*.45,h*.38); ctx.closePath(); applyShapePaint(ctx, shape);
        ctx.beginPath(); ctx.moveTo(0,-h*.48); ctx.lineTo(0,h*.38); ctx.stroke();
      } else if (type === 'moonFull') {
        ctx.beginPath(); ctx.arc(0,0,Math.min(w,h)*.45,0,Math.PI*2); applyShapePaint(ctx, shape);
      } else if (type === 'moonCrescent') {
        ctx.beginPath(); ctx.arc(0,0,Math.min(w,h)*.45,Math.PI*.18,Math.PI*1.82); ctx.arc(w*.18,0,Math.min(w,h)*.38,Math.PI*1.78,Math.PI*.22,true); ctx.closePath(); applyShapePaint(ctx, shape);
      } else if (type === 'planet') {
        ctx.beginPath(); ctx.ellipse(0,0,w*.32,h*.32,0,0,Math.PI*2); applyShapePaint(ctx, shape);
        ctx.beginPath(); ctx.ellipse(0,0,w*.55,h*.18,-.28,0,Math.PI*2); ctx.stroke();
      } else if (type === 'plant' || type === 'tree' || type === 'leaf' || type === 'flower') {
        ctx.strokeStyle = shape.border || '#e8ffff'; ctx.lineWidth = Math.max(2, safeNumber(shape.borderWidth,4)); ctx.globalAlpha = clamp(safeNumber(shape.alpha,.85),.01,1); ctx.fillStyle = shape.fill || '#00ffff';
        if(type==='tree'){ ctx.fillRect(-w*.06, -h*.05, w*.12, h*.45); for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse((i-2)*w*.09,-h*.18-Math.abs(i-2)*h*.06,w*.18,h*.22,0,0,Math.PI*2);ctx.fill();ctx.stroke();} }
        else if(type==='flower'){ for(let i=0;i<8;i++){const a=i*Math.PI/4; ctx.beginPath();ctx.ellipse(Math.cos(a)*w*.18,Math.sin(a)*h*.18,w*.13,h*.22,a,0,Math.PI*2);ctx.fill();ctx.stroke();} ctx.beginPath();ctx.arc(0,0,Math.min(w,h)*.10,0,Math.PI*2);ctx.fillStyle='#ffd56e';ctx.fill();ctx.stroke(); }
        else { ctx.beginPath(); ctx.moveTo(0,h*.4); ctx.quadraticCurveTo(-w*.12,0,0,-h*.42); ctx.quadraticCurveTo(w*.38,-h*.12,0,h*.4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0,h*.4); ctx.lineTo(0,-h*.25); ctx.stroke(); }
      } else {
        regularPolygonPath(ctx, safeNumber(shape.sides, 6), w / 2, h / 2);
        applyShapePaint(ctx, shape);
      }
      if (shape.id === state.activeShapeId) {
        ctx.globalAlpha = 1; ctx.shadowBlur = 0; ctx.strokeStyle = '#ffd56e'; ctx.lineWidth = 2 / Math.max(.2, state.zoom); ctx.setLineDash([8, 5]); ctx.strokeRect(-w/2, -h/2, w, h);
      }
      ctx.restore();
    });
  }

  function makeShapeAt(p) {
    const settings = getUiSettings();
    return {
      id: uid('shape'),
      type: settings.shapeType,
      x: p.x,
      y: p.y,
      w: settings.shapeWidth,
      h: settings.shapeHeight,
      rotation: settings.shapeRotation,
      sides: settings.shapeSides,
      alpha: settings.shapeAlpha,
      fill: settings.shapeFill,
      border: settings.shapeBorder,
      borderWidth: settings.shapeBorderWidth,
      link: settings.shapeLink
    };
  }

  function shapeHitTest(p, shape) {
    const rot = -safeNumber(shape.rotation, 0) * Math.PI / 180;
    const dx = p.x - shape.x;
    const dy = p.y - shape.y;
    const x = dx * Math.cos(rot) - dy * Math.sin(rot);
    const y = dx * Math.sin(rot) + dy * Math.cos(rot);
    return Math.abs(x) <= safeNumber(shape.w, 0) / 2 && Math.abs(y) <= safeNumber(shape.h, 0) / 2;
  }

  function selectShapeAt(p) {
    for (let li = state.layers.length - 1; li >= 0; li--) {
      const layer = state.layers[li];
      const shapes = layer.shapes || [];
      for (let si = shapes.length - 1; si >= 0; si--) {
        if (shapeHitTest(p, shapes[si])) {
          state.activeLayerId = layer.id;
          state.activeShapeId = shapes[si].id;
          applyShapeToUi(shapes[si]);
          renderLayerList();
          if (els.shapeStatus) els.shapeStatus.textContent = `Selected ${shapes[si].type} shape${shapes[si].link ? ' with link' : ''}.`;
          markDirty();
          return shapes[si];
        }
      }
    }
    return null;
  }

  function applyShapeToUi(shape) {
    if (!shape) return;
    if (els.shapeType) els.shapeType.value = shape.type || 'circle';
    if (els.shapeWidth) els.shapeWidth.value = shape.w ?? 160;
    if (els.shapeHeight) els.shapeHeight.value = shape.h ?? 110;
    if (els.shapeRotation) els.shapeRotation.value = shape.rotation ?? 0;
    if (els.shapeSides) els.shapeSides.value = shape.sides ?? 6;
    if (els.shapeAlpha) els.shapeAlpha.value = shape.alpha ?? 0.85;
    if (els.shapeFill) els.shapeFill.value = normalizeHex(shape.fill || '#00ffff');
    if (els.shapeBorder) els.shapeBorder.value = normalizeHex(shape.border || '#e8ffff');
    if (els.shapeBorderWidth) els.shapeBorderWidth.value = shape.borderWidth ?? 4;
    if (els.shapeLink) els.shapeLink.value = shape.link || '';
  }

  function updateSelectedShapeFromUi() {
    if (!state.activeShapeId) return;
    const layer = getActiveLayer();
    const shape = layer?.shapes?.find((item) => item.id === state.activeShapeId);
    if (!shape) return;
    shape.type = els.shapeType?.value || shape.type;
    shape.w = safeNumber(els.shapeWidth?.value, shape.w);
    shape.h = safeNumber(els.shapeHeight?.value, shape.h);
    shape.rotation = safeNumber(els.shapeRotation?.value, shape.rotation);
    shape.sides = safeNumber(els.shapeSides?.value, shape.sides);
    shape.alpha = safeNumber(els.shapeAlpha?.value, shape.alpha);
    shape.fill = els.shapeFill?.value || shape.fill;
    shape.border = els.shapeBorder?.value || shape.border;
    shape.borderWidth = safeNumber(els.shapeBorderWidth?.value, shape.borderWidth);
    shape.link = els.shapeLink?.value || '';
    if (els.shapeStatus) els.shapeStatus.textContent = `Editing ${shape.type}${shape.link ? ' · link saved' : ''}.`;
    markDirty();
  }

  function addShapeAt(p) {
    let layer = getActiveLayer();
    if (!layer) layer = createLayer('shape', 'Shapes 1');
    if (!layer.shapes) layer.shapes = [];
    pushHistory('add shape');
    const shape = makeShapeAt(p);
    layer.shapes.push(shape);
    state.activeShapeId = shape.id;
    layer.type = layer.type === 'paint' ? 'shape' : layer.type;
    renderLayerList();
    if (els.shapeStatus) els.shapeStatus.textContent = `Added ${shape.type}${shape.link ? ' with clickable link' : ''}.`;
    markDirty();
  }

  function addShapeCenter() {
    addShapeAt({ x: state.w / 2, y: state.h / 2 });
  }

  function deleteSelectedShape() {
    const layer = getActiveLayer();
    if (!layer || !state.activeShapeId) return setStatus('No shape selected.');
    const idx = (layer.shapes || []).findIndex((shape) => shape.id === state.activeShapeId);
    if (idx < 0) return setStatus('No shape selected.');
    pushHistory('delete shape');
    layer.shapes.splice(idx, 1);
    state.activeShapeId = null;
    if (els.shapeStatus) els.shapeStatus.textContent = 'No shape selected.';
    renderLayerList();
    markDirty();
  }

  function colorDistanceAt(data, idx, color) {
    const dr = data[idx] - color.r;
    const dg = data[idx + 1] - color.g;
    const db = data[idx + 2] - color.b;
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function connectedColorMask(image, startPoint, color, maxDist) {
    const w = state.w;
    const h = state.h;
    const sx = clamp(Math.floor(startPoint?.x ?? 0), 0, w - 1);
    const sy = clamp(Math.floor(startPoint?.y ?? 0), 0, h - 1);
    const startIndex = (sy * w + sx) * 4;
    const mask = new Uint8Array(w * h);
    if (!color || image.data[startIndex + 3] === 0 || colorDistanceAt(image.data, startIndex, color) > maxDist) return mask;
    const stack = [sy * w + sx];
    mask[sy * w + sx] = 1;
    while (stack.length) {
      const idx = stack.pop();
      const x = idx % w;
      const y = Math.floor(idx / w);
      const neighbors = [];
      if (x > 0) neighbors.push(idx - 1);
      if (x < w - 1) neighbors.push(idx + 1);
      if (y > 0) neighbors.push(idx - w);
      if (y < h - 1) neighbors.push(idx + w);
      for (const ni of neighbors) {
        if (mask[ni]) continue;
        const di = ni * 4;
        if (image.data[di + 3] > 0 && colorDistanceAt(image.data, di, color) <= maxDist) {
          mask[ni] = 1;
          stack.push(ni);
        }
      }
    }
    return mask;
  }

  function updateTransparencyPreview() {
    overlayCtx.clearRect(0, 0, state.w, state.h);
    if (!els.previewTransparency.checked || !state.transparentColor || !state.transparencySeed) return;
    try {
      const image = baseCtx.getImageData(0, 0, state.w, state.h);
      const out = overlayCtx.createImageData(state.w, state.h);
      const tol = safeNumber(els.tolerance.value, 18) / 100;
      const maxDist = Math.max(1, tol * 441.67295593);
      const mask = connectedColorMask(image, state.transparencySeed, state.transparentColor, maxDist);
      for (let i = 0; i < mask.length; i++) {
        if (!mask[i]) continue;
        const di = i * 4;
        const dist = colorDistanceAt(image.data, di, state.transparentColor);
        const hit = 1 - dist / maxDist;
        out.data[di] = 255;       // butter/coral preview, not pink
        out.data[di + 1] = 205;
        out.data[di + 2] = 110;
        out.data[di + 3] = Math.floor(45 + hit * 135);
      }
      overlayCtx.putImageData(out, 0, 0);
    } catch (err) {
      console.warn(err);
    }
  }

  function applyTransparency() {
    if (!state.transparentColor || !state.transparencySeed) {
      setStatus('Pick a reachable transparency color first.');
      return;
    }
    pushHistory('bounded transparency apply');
    if (!state.repairCanvas) refreshRepairSource('Repair source captured before transparency.');
    const image = baseCtx.getImageData(0, 0, state.w, state.h);
    const tol = safeNumber(els.tolerance.value, 18) / 100;
    const maxDist = Math.max(1, tol * 441.67295593);
    const softness = safeNumber(els.edgeSoftness.value, 8);
    const strength = safeNumber(els.removeStrength.value, 1);
    const mask = connectedColorMask(image, state.transparencySeed, state.transparentColor, maxDist);
    let changed = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const di = i * 4;
      const dist = colorDistanceAt(image.data, di, state.transparentColor);
      const edge = clamp(dist / maxDist, 0, 1);
      const softened = softness > 0 ? Math.pow(edge, 1 + softness / 8) : edge > 0 ? 1 : 0;
      const removal = strength * (1 - softened);
      image.data[di + 3] = Math.round(image.data[di + 3] * (1 - removal));
      changed++;
    }
    baseCtx.putImageData(image, 0, 0);
    overlayCtx.clearRect(0, 0, state.w, state.h);
    setStatus(`Bounded transparency applied to ${changed.toLocaleString()} connected pixels.`);
  }

  function trimTransparent() {
    const image = baseCtx.getImageData(0, 0, state.w, state.h);
    let minX = state.w, minY = state.h, maxX = 0, maxY = 0;
    for (let y = 0; y < state.h; y++) {
      for (let x = 0; x < state.w; x++) {
        const a = image.data[(y * state.w + x) * 4 + 3];
        if (a > 4) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (minX > maxX || minY > maxY) return setStatus('Nothing visible to trim.');
    pushHistory('trim transparent edges');
    const nw = maxX - minX + 1;
    const nh = maxY - minY + 1;
    const c = document.createElement('canvas');
    c.width = nw;
    c.height = nh;
    c.getContext('2d').drawImage(baseCanvas, minX, minY, nw, nh, 0, 0, nw, nh);
    let repairCrop = null;
    if (state.repairCanvas) {
      repairCrop = document.createElement('canvas');
      repairCrop.width = nw;
      repairCrop.height = nh;
      repairCrop.getContext('2d').drawImage(state.repairCanvas, minX, minY, nw, nh, 0, 0, nw, nh);
    }
    state.layers.forEach((layer) => {
      (layer.strokes || []).forEach((stroke) => {
        stroke.points.forEach((p) => {
          p.x -= minX;
          p.y -= minY;
        });
      });
      (layer.shapes || []).forEach((shape) => {
        shape.x -= minX;
        shape.y -= minY;
      });
    });
    resizeAll(nw, nh, false);
    baseCtx.drawImage(c, 0, 0);
    if (repairCrop) state.repairCanvas = repairCrop;
    setStatus(`Trimmed to ${nw}×${nh}.`);
  }

  function loadImageFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        pushHistory('image upload');
        resizeAll(img.naturalWidth || img.width, img.naturalHeight || img.height, false);
        baseCtx.clearRect(0, 0, state.w, state.h);
        baseCtx.drawImage(img, 0, 0, state.w, state.h);
        refreshRepairSource('Loaded image and captured repair source.');
        fitView();
        setStatus(`Loaded image ${state.w}×${state.h}.`);
      };
      img.onerror = () => setStatus('Image load failed.');
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function loadProjectFile(file) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const project = JSON.parse(String(reader.result));
        await hydrateProject(project);
        fitView();
        setStatus(`Loaded project: ${project.name || file.name}.`);
      } catch (err) {
        console.error(err);
        setStatus('Project import failed.');
      }
    };
    reader.readAsText(file);
  }

  function serializeProject(includeRuntime = false) {
    return {
      version: 1,
      name: 'Belavados Effect Layer Studio Project',
      width: state.w,
      height: state.h,
      baseImage: baseCanvas.toDataURL('image/png'),
      transparentColor: state.transparentColor,
      repairImage: state.repairCanvas ? state.repairCanvas.toDataURL('image/png') : baseCanvas.toDataURL('image/png'),
      layers: state.layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        type: layer.type,
        visible: layer.visible,
        seed: layer.seed,
        settings: layer.settings,
        strokes: layer.strokes || [],
        shapes: layer.shapes || []
      })),
      exportedAt: new Date().toISOString(),
      runtime: includeRuntime ? { note: 'Runtime canvases are rebuilt by js/app.js when the project is loaded.' } : undefined
    };
  }

  async function hydrateProject(project, options = {}) {
    if (!project || !project.width || !project.height || !project.baseImage) throw new Error('Invalid project');
    clearLayers();
    resizeAll(project.width, project.height, false);
    await drawImageUrlToBase(project.baseImage);
    state.repairCanvas = document.createElement('canvas');
    state.repairCanvas.width = state.w;
    state.repairCanvas.height = state.h;
    if (project.repairImage) {
      await drawImageUrlToCanvas(project.repairImage, state.repairCanvas);
    } else {
      state.repairCanvas.getContext('2d').drawImage(baseCanvas, 0, 0);
    }
    state.transparentColor = project.transparentColor || null;
    if (state.transparentColor) setPickedColor(state.transparentColor);
    (project.layers || []).forEach((plain) => {
      const layer = {
        id: plain.id || uid('fx'),
        name: plain.name || labelForType(plain.type),
        type: plain.type || 'paint',
        visible: plain.visible !== false,
        seed: plain.seed || Math.floor(Math.random() * 1000000),
        settings: plain.settings || getUiSettings(),
        strokes: plain.strokes || [],
        shapes: plain.shapes || []
      };
      layer.canvas = makeLayerCanvas(layer.id);
      layer.ctx = layer.canvas.getContext('2d');
      state.layers.push(layer);
    });
    state.activeLayerId = state.layers[0]?.id || null;
    if (state.activeLayerId) applySettingsToUi(getActiveLayer().settings);
    syncLayerZ();
    renderLayerList();
    markDirty();
  }

  function drawImageUrlToBase(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        baseCtx.clearRect(0, 0, state.w, state.h);
        baseCtx.drawImage(img, 0, 0, state.w, state.h);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function drawImageUrlToCanvas(src, canvas) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function clearLayers() {
    state.layers.forEach((layer) => layer.canvas?.remove());
    state.layers = [];
    state.activeLayerId = null;
    layerHost.innerHTML = '';
    renderLayerList();
  }

  function downloadText(filename, text, type = 'text/plain') {
    const blob = new Blob([text], { type });
    downloadBlob(filename, blob);
  }

  function downloadBlob(filename, blob) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 0);
  }

  function safeFileStamp() {
    return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  function exportPng() {
    const out = document.createElement('canvas');
    out.width = state.w;
    out.height = state.h;
    const ctx = out.getContext('2d');
    ctx.drawImage(baseCanvas, 0, 0);
    state.layers.forEach((layer) => {
      if (layer.visible && layer.canvas) ctx.drawImage(layer.canvas, 0, 0);
    });
    out.toBlob((blob) => downloadBlob(`belavados-effect-frame-${safeFileStamp()}.png`, blob), 'image/png');
    setStatus('PNG frame exported.');
  }

  function exportProject() {
    downloadText(`belavados-effect-project-${safeFileStamp()}.belfx`, JSON.stringify(serializeProject(true), null, 2), 'application/json');
    setStatus('Project JSON exported.');
  }

  function exportHtml() {
    const html = makeStandaloneHtml(serializeProject(false));
    downloadText(`belavados-interactive-effects-${safeFileStamp()}.html`, html, 'text/html');
    setStatus('Interactive HTML exported.');
  }

  function makeStandaloneHtml(project) {
    const projectJson = JSON.stringify(project).replace(/</g, '\\u003c');
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Belavadös Interactive Effects Export</title>
<style>
html,body{margin:0;min-height:100%;background:#020608;color:#e8ffff;font-family:Georgia,'Times New Roman',serif;}
body{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:12px;padding:12px;}
.viewer{overflow:auto;border:2px ridge #00ffff;border-radius:14px;background:#111;min-height:70vh;padding:24px;}
.stage{position:relative;background-image:linear-gradient(45deg,rgba(255,255,255,.16) 25%,transparent 25%),linear-gradient(-45deg,rgba(255,255,255,.16) 25%,transparent 25%),linear-gradient(45deg,transparent 75%,rgba(255,255,255,.16) 75%),linear-gradient(-45deg,transparent 75%,rgba(255,255,255,.16) 75%);background-size:24px 24px;background-position:0 0,0 12px,12px -12px,-12px 0;background-color:#18262a;box-shadow:0 18px 45px rgba(0,0,0,.6);}
canvas{position:absolute;left:0;top:0;width:100%;height:100%;}
.shape-hotspot{position:absolute;display:block;border:2px solid rgba(255,213,110,.18);background:rgba(255,213,110,.01);z-index:9000;border-radius:10px;}
.shape-hotspot:hover{background:rgba(255,213,110,.16);border-color:#ffd56e;}
.panel{border:2px ridge #00ffff;border-radius:14px;background:linear-gradient(180deg,#091017,#000305);padding:12px;height:max-content;position:sticky;top:12px;}
button,label{display:grid;gap:6px;width:100%;margin:8px 0;font:inherit;} button{display:block;background:#fff;color:#001e24;border:2px solid #00ffff;border-radius:10px;padding:10px;font-weight:900;cursor:pointer;} input{width:100%;accent-color:#00ffff;} .layer{border:1px solid rgba(0,255,255,.42);border-radius:10px;padding:8px;margin:8px 0;background:rgba(0,0,0,.25);} small{color:#a6bec5;} @media(max-width:820px){body{grid-template-columns:1fr}.panel{position:static}}
</style>
</head>
<body>
<div class="viewer" id="viewer"><div id="stage" class="stage"></div></div>
<aside class="panel"><h1>Interactive Effects</h1><button id="fit">Fit View</button><label>Global Speed <input id="globalSpeed" type="range" min="0" max="3" step="0.01" value="1"></label><label>Global Opacity <input id="globalOpacity" type="range" min="0" max="1" step="0.01" value="1"></label><div id="layers"></div><small>Exported from Belavadös Effect Layer Studio. Effects remain animated and layer visibility is interactive.</small></aside>
<script>
const PROJECT = ${projectJson};
const stage = document.getElementById('stage'); const viewer = document.getElementById('viewer'); const layerPanel = document.getElementById('layers');
let zoom = 1; const canvases = []; const global = { speed: 1, opacity: 1 };
stage.style.width = PROJECT.width + 'px'; stage.style.height = PROJECT.height + 'px';
function addCanvas(z){ const c=document.createElement('canvas'); c.width=PROJECT.width; c.height=PROJECT.height; c.style.zIndex=z; stage.appendChild(c); return c; }
const base = addCanvas(1); const bctx = base.getContext('2d'); const img = new Image(); img.onload=()=>bctx.drawImage(img,0,0,PROJECT.width,PROJECT.height); img.src=PROJECT.baseImage;
PROJECT.layers.forEach((layer,i)=>{ layer.canvas=addCanvas(10+i); layer.ctx=layer.canvas.getContext('2d'); layerPanel.insertAdjacentHTML('beforeend','<div class="layer"><label><input type="checkbox" data-id="'+layer.id+'" checked> '+escapeHtml(layer.name || layer.type)+'</label><small>'+escapeHtml(layer.type)+' · '+(layer.strokes||[]).length+' stroke(s) · '+(layer.shapes||[]).length+' shape(s)</small></div>'); });
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
layerPanel.addEventListener('change', e=>{ const layer=PROJECT.layers.find(l=>l.id===e.target.dataset.id); if(layer) layer.visible=e.target.checked; });
function buildShapeLinks(){ PROJECT.layers.forEach(function(layer){ (layer.shapes||[]).forEach(function(shape){ if(!shape.link)return; var a=document.createElement('a'); a.className='shape-hotspot'; a.href=shape.link; a.target='_blank'; a.rel='noopener noreferrer'; a.title=shape.link; a.style.left=((shape.x-shape.w/2)/PROJECT.width*100)+'%'; a.style.top=((shape.y-shape.h/2)/PROJECT.height*100)+'%'; a.style.width=(shape.w/PROJECT.width*100)+'%'; a.style.height=(shape.h/PROJECT.height*100)+'%'; a.style.transform='rotate('+(shape.rotation||0)+'deg)'; stage.appendChild(a); }); }); } buildShapeLinks();
document.getElementById('globalSpeed').addEventListener('input',e=>global.speed=Number(e.target.value)); document.getElementById('globalOpacity').addEventListener('input',e=>global.opacity=Number(e.target.value)); document.getElementById('fit').addEventListener('click',fit);
viewer.addEventListener('wheel', e=>{e.preventDefault(); setZoom(zoom*(e.deltaY<0?1.12:.89));},{passive:false});
function setZoom(z){ zoom=Math.min(8,Math.max(.05,z)); stage.style.width=(PROJECT.width*zoom)+'px'; stage.style.height=(PROJECT.height*zoom)+'px'; }
function fit(){setZoom(Math.min((viewer.clientWidth-64)/PROJECT.width,(viewer.clientHeight-64)/PROJECT.height));}
function rgba(color,a){ const h=(color||'#00ffff').replace('#',''); const n=parseInt(h.length===3?h.split('').map(c=>c+c).join(''):h,16); return 'rgba('+((n>>16)&255)+','+((n>>8)&255)+','+(n&255)+','+a+')'; }
function noise(seed){let x=Math.sin(seed*12.9898)*43758.5453123;return x-Math.floor(x)} function mid(a,b){return{x:(a.x+b.x)/2,y:(a.y+b.y)/2}}
function line(ctx,pts,o){ if(!pts.length)return; ctx.save(); ctx.globalCompositeOperation=o.comp||'source-over'; ctx.globalAlpha=Math.max(0,Math.min(1,o.alpha||1)); ctx.strokeStyle=o.color; ctx.lineWidth=Math.max(.5,o.width||1); ctx.lineCap='round'; ctx.lineJoin='round'; ctx.shadowColor=o.color; ctx.shadowBlur=o.shadow||0; ctx.beginPath(); ctx.moveTo(pts[0].x,pts[0].y); for(let i=1;i<pts.length;i++){const m=mid(pts[i-1],pts[i]); ctx.quadraticCurveTo(pts[i-1].x,pts[i-1].y,m.x,m.y);} const last=pts[pts.length-1]; ctx.lineTo(last.x,last.y); ctx.stroke(); if((o.sharp||0)>0){ctx.globalAlpha*=.85;ctx.shadowBlur=0;ctx.strokeStyle='rgba(235,255,255,.92)';ctx.lineWidth=Math.max(.5,(o.width||1)*.16*o.sharp);ctx.stroke();} ctx.restore(); }
function tanAt(pts,i){const a=pts[Math.max(0,i-1)]||pts[i],b=pts[Math.min(pts.length-1,i+1)]||pts[i];const dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;return{x:dx/l,y:dy/l,angle:Math.atan2(dy,dx)}}
function clampv(v,min,max){return Math.max(min,Math.min(max,Number(v)||0))}
function warpIchor(pts,s,t,seed,pass){const vel=Number(s.ichorVelocity||1.15),pow=Number(s.ichorPower||1.25),fluid=Number(s.ichorFluidity||1.35),press=Number(s.ichorPressure||1),thr=Number(s.ichorThrust||1),ang=(Number(s.angle||0))*Math.PI/180,base=((Number(s.waveAmp||28))*.16+(Number(s.size||28))*.18)*(.45+fluid*.55)*(.7+press*.35);return pts.map((p,i)=>{const q=tanAt(pts,i),nx=-q.y,ny=q.x,ph=i*(.34+pass*.07)-t*(2.2+vel*3.5)+seed*.013,pulse=Math.sin(ph)+Math.sin(ph*.47+pass*2.1)*.55,n=noise(seed+i*(19+pass*11)+Math.floor(t*(12+vel*18))),side=(pulse*.5+(n-.5)*1.25)*base*(.5+pow*.22),fw=Math.sin(ph*.73)*thr*2.6+Math.cos(ang-q.angle)*thr*1.4;return{x:p.x+nx*side+q.x*fw,y:p.y+ny*side+q.y*fw}})}
function pick(list,seed){return list[Math.floor(noise(seed)*list.length)%list.length]}
function drawIchor(ctx,pts,s,t,seed,alpha,w,inten,color){var pal={mist:['#E8FFFF','#DFFFFF','#D9FFFF','#C8FFFF','#C7FFFF'],ion:['#BDEBFF','#BDF7F1','#A6E7FF','#A6BEC5'],glow:['#9EFFFF','#9FEEDD','#9EF2E4','#91FFFF','#8DE0DC'],arc:['#7EFBEA','#65E9D2','#5EAAAA','#4BC7B0','#48BAA6','#3D9FA0'],core:['#2FBED8','#1FD1C2','#00FFFF','#00D9D9','#00BFAF'],deep:['#008C96','#008B8B','#00848A','#007E8A','#007A78','#0E716B','#0B6E74'],shadow:['#0B6070','#0B3F43','#062D34','#052C2A'],residue:['#003C42','#003A3A','#002A30','#00242B']};var vel=Number(s.ichorVelocity||1.15),thr=Number(s.ichorThrust||1),dust=Math.min(320,Math.max(0,Number(s.ichorDust||80))),light=Number(s.ichorLighting||1.75),esc=Number(s.ichorEscape||1.05),fluid=Number(s.ichorFluidity||1.35),press=Number(s.ichorPressure||1),sharp=Number(s.sharpness||1),bias=Number(s.angle||0)*Math.PI/180,p1=warpIchor(pts,s,t,seed,0),p2=warpIchor(pts,s,t+.17,seed+101,1),p3=warpIchor(pts,s,t+.31,seed+303,2),mist=pick(pal.mist,seed+1),ion=pick(pal.ion,seed+2),glow=pick(pal.glow,seed+3),arc=pick(pal.arc,seed+4),core=pick(pal.core,seed+5),deep=pick(pal.deep,seed+6),shadow=pick(pal.shadow,seed+7),residue=pick(pal.residue,seed+8);ctx.save();ctx.globalCompositeOperation='lighter';line(ctx,p1,{color:mist,width:w*(2.15+fluid*.42+press*.28),alpha:alpha*.13,shadow:w*(1.4+light*1.1),sharp:0});line(ctx,p2,{color:glow,width:w*(1.35+fluid*.22),alpha:alpha*.28,shadow:w*(.9+light*.65),sharp:0});line(ctx,p1,{color:deep,width:w*(.94+press*.18),alpha:alpha*.38,shadow:12*light,sharp:0});line(ctx,p1,{color:core,width:w*.58,alpha:alpha*.74,shadow:18*light,sharp:sharp});line(ctx,p3,{color:ion,width:w*(.11+sharp*.05),alpha:alpha*.96,shadow:7*light,sharp:sharp});var reps=3+Math.round(press*2+fluid);for(var i=1;i<p1.length;i++){var ph=(i/Math.max(1,p1.length-1)*reps-t*(.65+vel*.58)+noise(seed+i)*.18)%1;if(ph<0)ph+=1;var g=.18+.82*Math.max(0,Math.sin(ph*Math.PI));if(g<.36)continue;line(ctx,[p1[i-1],p1[i]],{color:ion,width:w*(.08+g*.12),alpha:alpha*g,shadow:10*light,sharp:sharp});line(ctx,[p1[i-1],p1[i]],{color:arc,width:w*(.18+g*.08),alpha:alpha*g*.36,shadow:14*light,sharp:0})}var step=Math.max(3,Math.round(18/Math.max(.35,esc+press*.24))),shift=Math.floor((t*(8+vel*7)+seed)%step);for(var i=2+shift;i<p1.length-1;i+=step){var trig=noise(seed+i*37+Math.floor(t*(5+vel*5)));if(trig>clampv(.26+esc*.22+light*.08,.18,.92))continue;var root=p1[i],q=tanAt(p1,i),side=noise(seed+i*11)>.5?1:-1,ba=q.angle+side*(.42+esc*.32+noise(seed+i*17)*.55)+Math.sin(t*2+i)*.18+Math.cos(bias-q.angle)*.18,len=w*(.8+esc*1.25+thr*.8+press*.55)*(.6+noise(seed+i*23)*1.2),m={x:root.x+Math.cos(ba)*len*.45+Math.cos(ba+Math.PI/2)*len*.14*Math.sin(t*3+i),y:root.y+Math.sin(ba)*len*.45+Math.sin(ba+Math.PI/2)*len*.14*Math.sin(t*3+i)},tip={x:root.x+Math.cos(ba)*len,y:root.y+Math.sin(ba)*len};line(ctx,[root,m,tip],{color:arc,width:w*(.07+trig*.08),alpha:alpha*(.38+trig*.34),shadow:14*light,sharp:sharp});if(esc>1.25&&noise(seed+i*29+Math.floor(t*9))>.55){var fa=ba+side*(.42+noise(seed+i*31)*.45),ft={x:tip.x+Math.cos(fa)*len*.46,y:tip.y+Math.sin(fa)*len*.46};line(ctx,[tip,ft],{color:mist,width:w*.045,alpha:alpha*.48,shadow:10*light,sharp:sharp})}}ctx.fillStyle=mist;ctx.shadowColor=glow;ctx.shadowBlur=w*(.4+light*.36);for(var i=0;i<dust;i++){var idx=Math.floor(noise(seed+i*13)*p1.length),p=p1[idx]||p1[0],q=tanAt(p1,idx),age=(t*(.18+vel*.08)+noise(seed+i*19))%1,side=noise(seed+i*41)>.5?1:-1,np=(age*age)*w*(.25+esc*.95)*side,fp=(age-.2)*((Number(s.vectorLength||44))*.35+thr*w*1.4),wb=Math.sin(t*5+i)*w*.12*fluid,x=p.x+q.x*fp-q.y*np+Math.cos(bias)*thr*age*5+wb,y=p.y+q.y*fp+q.x*np+Math.sin(bias)*thr*age*5-wb,fade=Math.sin(age*Math.PI);ctx.globalAlpha=alpha*fade*(.12+light*.13);ctx.beginPath();ctx.arc(x,y,Math.max(.8,w*(.025+noise(seed+i*29)*.05)*(.7+press*.25)),0,Math.PI*2);ctx.fill();if(noise(seed+i*43)>.82){ctx.fillStyle=residue;ctx.globalAlpha*=.45;ctx.beginPath();ctx.arc(x+w*.08,y+w*.08,Math.max(.5,w*.018),0,Math.PI*2);ctx.fill();ctx.fillStyle=mist}}ctx.globalCompositeOperation='source-over';line(ctx,p1,{color:shadow,width:w*(.22+press*.06),alpha:alpha*.16,shadow:0,sharp:0});ctx.restore()}
function shapePoly(ctx,sides,rx,ry,off){sides=Math.max(3,Math.round(sides||6));off=off==null?-Math.PI/2:off;ctx.beginPath();for(var i=0;i<sides;i++){var a=off+i/sides*Math.PI*2,x=Math.cos(a)*rx,y=Math.sin(a)*ry;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath()}function paintShape(ctx,shape){ctx.globalAlpha=Math.max(.01,Math.min(1,Number(shape.alpha||.85)));ctx.fillStyle=shape.fill||'#00ffff';ctx.strokeStyle=shape.border||'#e8ffff';ctx.lineWidth=Math.max(0,Number(shape.borderWidth||4));ctx.shadowColor=shape.fill||'#00ffff';ctx.shadowBlur=ctx.lineWidth*1.4;ctx.fill();if(ctx.lineWidth>0)ctx.stroke()}function drawShape(ctx,shape){var w=Number(shape.w||160),h=Number(shape.h||110),type=shape.type||'circle';ctx.save();ctx.translate(shape.x||0,shape.y||0);ctx.rotate((Number(shape.rotation||0))*Math.PI/180);if(type==='circle'||type==='ellipse'||type==='sphere'||type==='moonFull'){ctx.beginPath();ctx.ellipse(0,0,w/2,(type==='circle'?w:h)/2,0,0,Math.PI*2);paintShape(ctx,shape)}else if(type==='square'||type==='rectangle'){ctx.beginPath();ctx.rect(-w/2,-h/2,type==='square'?w:w,type==='square'?w:h);paintShape(ctx,shape)}else if(type==='triangle'){shapePoly(ctx,3,w/2,h/2);paintShape(ctx,shape)}else if(type==='diamond'){shapePoly(ctx,4,w/2,h/2,0);paintShape(ctx,shape)}else if(type==='pentagon'){shapePoly(ctx,5,w/2,h/2);paintShape(ctx,shape)}else if(type==='hexagon'){shapePoly(ctx,6,w/2,h/2);paintShape(ctx,shape)}else if(type==='octagon'){shapePoly(ctx,8,w/2,h/2);paintShape(ctx,shape)}else if(type==='polygon'){shapePoly(ctx,shape.sides||6,w/2,h/2);paintShape(ctx,shape)}else if(type==='star'||type==='gear'||type==='shout'){var pts=type==='gear'?18:(type==='shout'?18:10);ctx.beginPath();for(var i=0;i<pts;i++){var a=-Math.PI/2+i/pts*Math.PI*2,rr=i%2?(type==='gear'?.72:type==='shout'?.78:.42):1,x=Math.cos(a)*w*.5*rr,y=Math.sin(a)*h*.5*rr;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.closePath();paintShape(ctx,shape)}else if(type==='heart'){ctx.beginPath();ctx.moveTo(0,h*.32);ctx.bezierCurveTo(-w*.55,-h*.05,-w*.38,-h*.52,0,-h*.22);ctx.bezierCurveTo(w*.38,-h*.52,w*.55,-h*.05,0,h*.32);ctx.closePath();paintShape(ctx,shape)}else if(type==='arrow'){ctx.beginPath();ctx.moveTo(-w*.5,-h*.14);ctx.lineTo(w*.14,-h*.14);ctx.lineTo(w*.14,-h*.38);ctx.lineTo(w*.5,0);ctx.lineTo(w*.14,h*.38);ctx.lineTo(w*.14,h*.14);ctx.lineTo(-w*.5,h*.14);ctx.closePath();paintShape(ctx,shape)}else if(type==='moonCrescent'){ctx.beginPath();ctx.arc(0,0,Math.min(w,h)*.45,Math.PI*.18,Math.PI*1.82);ctx.arc(w*.18,0,Math.min(w,h)*.38,Math.PI*1.78,Math.PI*.22,true);ctx.closePath();paintShape(ctx,shape)}else{shapePoly(ctx,6,w/2,h/2);paintShape(ctx,shape)}ctx.restore()}
function renderStroke(ctx,stroke,type,s,time,seed){ const pts=stroke.points||[]; if(!pts.length)return; if(stroke.erase){line(ctx,pts,{color:'#000',width:s.size,alpha:1,comp:'destination-out'});return;} const t=time/1000*(s.speed||1)*global.speed, alpha=(s.alpha||1)*(s.transparency??1)*global.opacity, w=s.size||20, inten=s.intensity||1, color=s.color||'#00ffff'; if(type==='ichor'){drawIchor(ctx,pts,s,t,seed,alpha,w,inten,color);} else if(type==='electric'){ const amp=(s.waveAmp||20)*.38*inten; const jag=pts.map((p,i)=>({x:p.x+(noise(seed+i*17+Math.floor(t*24))-.5)*amp,y:p.y+(noise(seed+i*31+Math.floor(t*19))-.5)*amp})); line(ctx,jag,{color,width:w*.96,alpha:alpha*.72,shadow:22*inten,sharp:s.sharpness}); line(ctx,jag,{color:'rgba(232,255,255,1)',width:w*.22,alpha,shadow:4,sharp:s.sharpness}); } else if(type==='blink'){ctx.save(); for(let i=0;i<pts.length;i+=Math.max(2,Math.round(34/Math.max(.2,inten)))){const p=pts[i],b=.2+.8*Math.max(0,Math.sin(t*6+i*.7+seed)); ctx.globalAlpha=alpha*b; ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=w*1.2; ctx.beginPath(); ctx.arc(p.x,p.y,w*(.22+b*.18),0,Math.PI*2); ctx.fill();} ctx.restore();} else if(type==='wave'){ const a=((s.angle||0)+90)*Math.PI/180; const amp=s.waveAmp||0; line(ctx,pts.map((p,i)=>({x:p.x+Math.cos(a)*Math.sin(i*.42+t*Math.PI*2)*amp,y:p.y+Math.sin(a)*Math.sin(i*.42+t*Math.PI*2)*amp})),{color,width:w,alpha,shadow:12*inten,sharp:s.sharpness}); } else if(type==='hover'){ const off=Math.sin(t*Math.PI*2)*(s.waveAmp||0); line(ctx,pts.map(p=>({x:p.x,y:p.y+off})),{color,width:w,alpha,shadow:12*inten,sharp:s.sharpness}); } else if(type==='motes'){line(ctx,pts,{color,width:w*.34,alpha:alpha*.33,shadow:14*inten,sharp:s.sharpness}); ctx.save(); const ang=(s.angle||0)*Math.PI/180; for(let i=0;i<(s.moteCount||60);i++){const p=pts[Math.floor(noise(seed+i*13)*pts.length)]||pts[0]; const age=(t*.22+noise(seed+i*19))%1, drift=(age-.5)*(s.vectorLength||44)*1.8, wob=(noise(seed+i*23+Math.floor(t*20))-.5)*(s.waveAmp||28), fade=Math.sin(age*Math.PI); ctx.globalAlpha=alpha*fade*.85; ctx.fillStyle=color; ctx.shadowColor=color; ctx.shadowBlur=w*.8; ctx.beginPath(); ctx.arc(p.x+Math.cos(ang)*drift-Math.sin(ang)*wob,p.y+Math.sin(ang)*drift+Math.cos(ang)*wob,Math.max(1,w*(.045+noise(seed+i*29)*.09)),0,Math.PI*2); ctx.fill();} ctx.restore(); } else { const pul=type==='pulse'?1+Math.sin(t*Math.PI*2)*.22*inten:1; line(ctx,pts,{color,width:w*pul,alpha,shadow:12*inten,sharp:s.sharpness}); }}
function frame(time){ PROJECT.layers.forEach((layer)=>{const ctx=layer.ctx; ctx.clearRect(0,0,PROJECT.width,PROJECT.height); if(layer.visible===false)return; const s=layer.settings||{}; if(s.blur)ctx.filter='blur('+s.blur+'px)'; (layer.strokes||[]).forEach(st=>renderStroke(ctx,st,layer.type,s,time,layer.seed||1)); (layer.shapes||[]).forEach(sh=>drawShape(ctx,sh)); ctx.filter='none';}); requestAnimationFrame(frame);} requestAnimationFrame(frame); fit();
</script>
</body>
</html>`;
  }

  function saveBrowser() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(serializeProject(false)));
      setStatus('Saved project to this browser.');
    } catch (err) {
      console.error(err);
      setStatus('Browser save failed.');
    }
  }

  async function loadBrowser() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return setStatus('No browser save found.');
    try {
      await hydrateProject(JSON.parse(raw));
      setStatus('Loaded browser save.');
    } catch (err) {
      console.error(err);
      setStatus('Browser save could not be loaded.');
    }
  }

  function clearBrowser() {
    localStorage.removeItem(storageKey);
    setStatus('Browser save cleared.');
  }

  function moveActiveLayer(delta) {
    const idx = state.layers.findIndex((layer) => layer.id === state.activeLayerId);
    if (idx < 0) return;
    const next = clamp(idx + delta, 0, state.layers.length - 1);
    if (next === idx) return;
    const [layer] = state.layers.splice(idx, 1);
    state.layers.splice(next, 0, layer);
    syncLayerZ();
    renderLayerList();
    markDirty();
  }

  function duplicateActiveLayer() {
    const layer = getActiveLayer();
    if (!layer) return setStatus('No layer selected.');
    const copy = JSON.parse(JSON.stringify({ ...layer, canvas: undefined, ctx: undefined }));
    copy.id = uid('fx');
    copy.name = `${layer.name} Copy`;
    copy.canvas = makeLayerCanvas(copy.id);
    copy.ctx = copy.canvas.getContext('2d');
    state.layers.push(copy);
    state.activeLayerId = copy.id;
    syncLayerZ();
    renderLayerList();
    markDirty();
  }

  function deleteActiveLayer() {
    const idx = state.layers.findIndex((layer) => layer.id === state.activeLayerId);
    if (idx < 0) return;
    const [removed] = state.layers.splice(idx, 1);
    removed.canvas?.remove();
    state.activeLayerId = state.layers[Math.max(0, idx - 1)]?.id || state.layers[0]?.id || null;
    syncLayerZ();
    renderLayerList();
    markDirty();
    setStatus('Layer deleted.');
  }

  function clearActiveLayer() {
    const layer = getActiveLayer();
    if (!layer) return;
    layer.strokes = [];
    renderLayerList();
    markDirty();
    setStatus(`${layer.name} cleared.`);
  }

  function zoomToSelectedBox() {
    const r = state.selectedRect;
    if (!r || r.w < 5 || r.h < 5) return setStatus('Drag a zoom box first.');
    const next = clamp(Math.min((viewport.clientWidth - 90) / r.w, (viewport.clientHeight - 90) / r.h), 0.05, 8);
    state.zoom = next;
    updateStageSize();
    viewport.scrollLeft = r.x * next - 40;
    viewport.scrollTop = r.y * next - 40;
    setStatus(`Zoomed to selected box at ${Math.round(next * 100)}%.`);
  }

  function syncMobileToolDock() {
    document.querySelectorAll('[data-mobile-tool]').forEach((button) => {
      button.classList.toggle('active', button.dataset.mobileTool === state.tool);
    });
  }

  function selectTool(tool) {
    const button = els.toolGrid?.querySelector(`button[data-tool="${tool}"]`);
    if (!button) return;
    state.tool = tool;
    els.toolGrid.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === button));
    syncMobileToolDock();
    overlayCtx.clearRect(0, 0, state.w, state.h);
    setStatus(`Tool: ${button.textContent.trim()}.`);
  }

  function pointerBrief(evt) {
    return { id: evt.pointerId, clientX: evt.clientX, clientY: evt.clientY };
  }

  function currentTouchPoints() {
    return Array.from(state.activePointers.values()).slice(0, 2);
  }

  function touchDistance(a, b) {
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  }

  function touchCenter(a, b) {
    return { clientX: (a.clientX + b.clientX) / 2, clientY: (a.clientY + b.clientY) / 2 };
  }

  function beginPinchZoom() {
    const points = currentTouchPoints();
    if (points.length < 2) return;
    endPan();
    endStroke();
    state.dragStart = null;
    overlayCtx.clearRect(0, 0, state.w, state.h);
    state.pinchStart = {
      distance: Math.max(1, touchDistance(points[0], points[1])),
      zoom: state.zoom
    };
    setStatus('Two-finger pinch zoom active. Lift one finger to return to the selected tool.');
  }

  function movePinchZoom() {
    if (!state.pinchStart) return false;
    const points = currentTouchPoints();
    if (points.length < 2) return false;
    const dist = Math.max(1, touchDistance(points[0], points[1]));
    const center = touchCenter(points[0], points[1]);
    setZoom(state.pinchStart.zoom * (dist / state.pinchStart.distance), center);
    return true;
  }

  function endPinchZoom() {
    if (state.activePointers.size < 2) state.pinchStart = null;
  }

  function installPwaSupport() {
    const installBtn = $('installAppBtn');
    let deferredPrompt = null;

    if ('serviceWorker' in navigator && window.isSecureContext) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('service-worker.js').catch((err) => console.warn('Service worker registration failed:', err));
      });
    }

    window.addEventListener('beforeinstallprompt', (evt) => {
      evt.preventDefault();
      deferredPrompt = evt;
      if (installBtn) installBtn.disabled = false;
      setStatus('App icon install is ready. Tap Add App Icon.');
    });

    installBtn?.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        try {
          await deferredPrompt.userChoice;
        } catch (err) {
          console.warn('Install prompt closed:', err);
        }
        deferredPrompt = null;
        setStatus('If the icon was not added, use browser menu → Add to Home screen / Install app.');
      } else {
        setStatus('Use your mobile browser menu → Add to Home screen / Install app. On GitHub Pages, refresh once after upload if the button is not available yet.');
      }
    });

    window.addEventListener('appinstalled', () => {
      deferredPrompt = null;
      setStatus('Belavadös FX Studio app icon installed.');
    });
  }

  function installEvents() {
    els.toolGrid.addEventListener('click', (evt) => {
      const button = evt.target.closest('button[data-tool]');
      if (!button) return;
      selectTool(button.dataset.tool);
    });

    document.querySelectorAll('[data-mobile-tool]').forEach((button) => {
      button.addEventListener('click', () => selectTool(button.dataset.mobileTool));
    });
    document.querySelector('[data-mobile-action="fit"]')?.addEventListener('click', fitView);
    syncMobileToolDock();

    els.fileInput.addEventListener('change', () => {
      const file = els.fileInput.files && els.fileInput.files[0];
      if (!file) return;
      if (/json|belfx/i.test(file.name) || /json/i.test(file.type)) loadProjectFile(file);
      else loadImageFile(file);
      els.fileInput.value = '';
    });

    viewport.addEventListener('wheel', (evt) => {
      evt.preventDefault();
      setZoom(state.zoom * (evt.deltaY < 0 ? 1.12 : 0.89), evt);
    }, { passive: false });

    viewport.addEventListener('pointerdown', (evt) => {
      if (evt.pointerType === 'touch') {
        evt.preventDefault();
        state.activePointers.set(evt.pointerId, pointerBrief(evt));
        if (state.activePointers.size === 2) {
          beginPinchZoom();
          return;
        }
      }
      try { viewport.setPointerCapture(evt.pointerId); } catch (err) { /* pointer capture is best-effort on older mobile browsers */ }
      viewport.focus({ preventScroll: true });
      if (evt.button === 1 || state.spaceDown || state.tool === 'pan') {
        beginPan(evt);
        return;
      }
      if (state.pinchStart) return;
      const p = pointerToCanvas(evt);
      if (state.tool === 'selectzoom') {
        state.dragStart = p;
        state.selectedRect = null;
        drawOverlayRect(null);
      } else if (state.tool === 'transparent') {
        state.transparencySeed = p;
        setPickedColor(sampleBaseColor(p));
        setStatus(`Picked reachable transparent color ${els.pickedColorText.textContent}.`);
      } else if (state.tool === 'fill') {
        applyFillAt(p);
      } else if (state.tool === 'shape') {
        if (!selectShapeAt(p)) addShapeAt(p);
      } else if (state.tool === 'eyedropper') {
        const c = sampleBaseColor(p);
        const hex = rgbToHex(c.r, c.g, c.b);
        els.brushColor.value = hex;
        if (els.brushHex) els.brushHex.value = hex;
        currentLayerSettingsToActive();
        setStatus(`Matched color ${hex}.`);
      } else if (state.tool === 'repair') {
        beginRepair(evt);
      } else if (state.tool === 'brush' || state.tool === 'eraser') {
        beginStroke(evt);
      }
    }, { passive: false });

    viewport.addEventListener('pointermove', (evt) => {
      if (evt.pointerType === 'touch') {
        evt.preventDefault();
        if (state.activePointers.has(evt.pointerId)) state.activePointers.set(evt.pointerId, pointerBrief(evt));
        if (movePinchZoom()) return;
      }
      updateBrushCursor(evt);
      if (state.panning) {
        movePan(evt);
        return;
      }
      if (state.tool === 'selectzoom' && state.dragStart) {
        state.selectedRect = normalRect(state.dragStart, pointerToCanvas(evt));
        drawOverlayRect(state.selectedRect);
      } else if (state.drawing && state.dragStart?.repair) {
        addRepairPoint(evt);
      } else if (state.drawing) {
        addStrokePoint(evt);
      }
    }, { passive: false });

    viewport.addEventListener('touchmove', (evt) => evt.preventDefault(), { passive: false });
    viewport.addEventListener('contextmenu', (evt) => evt.preventDefault());

    viewport.addEventListener('pointerleave', () => { if (brushCursor) brushCursor.style.display = 'none'; });

    viewport.addEventListener('pointerup', (evt) => {
      if (evt.pointerType === 'touch') {
        evt.preventDefault();
        state.activePointers.delete(evt.pointerId);
        endPinchZoom();
      }
      endPan();
      endStroke();
      if (state.tool === 'selectzoom' && state.selectedRect) drawOverlayRect(state.selectedRect);
      if (state.tool === 'selectzoom') state.dragStart = null;
    }, { passive: false });
    viewport.addEventListener('pointercancel', (evt) => {
      if (evt.pointerType === 'touch') {
        state.activePointers.delete(evt.pointerId);
        endPinchZoom();
      }
      endPan();
      endStroke();
      state.dragStart = null;
    });

    window.addEventListener('keydown', (evt) => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || '');
      if (evt.code === 'Space' && !typing) { evt.preventDefault(); state.spaceDown = true; }
      if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'z' && !evt.shiftKey) {
        evt.preventDefault();
        restoreLastHistory();
      }
      if (((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === 'y') || ((evt.ctrlKey || evt.metaKey) && evt.shiftKey && evt.key.toLowerCase() === 'z')) {
        evt.preventDefault();
        restoreNextHistory();
      }
    });
    window.addEventListener('keyup', (evt) => {
      if (evt.code === 'Space') state.spaceDown = false;
    });

    els.zoomRange.addEventListener('input', () => setZoom(els.zoomRange.value));
    $('zoomInBtn').addEventListener('click', () => setZoom(state.zoom * 1.2));
    $('zoomOutBtn').addEventListener('click', () => setZoom(state.zoom / 1.2));
    $('zoomToBoxBtn').addEventListener('click', zoomToSelectedBox);
    $('fitImageBtn').addEventListener('click', fitView);
    $('resetViewBtn').addEventListener('click', () => setZoom(1));
    $('undoBtn')?.addEventListener('click', restoreLastHistory);
    $('redoBtn')?.addEventListener('click', restoreNextHistory);
    $('quickSaveBrowserBtn')?.addEventListener('click', saveBrowser);

    $('newCanvasBtn').addEventListener('click', () => {
      pushHistory('new canvas');
      clearLayers();
      resizeAll(safeNumber(els.canvasW.value, 1280), safeNumber(els.canvasH.value, 720), false);
      baseCtx.clearRect(0, 0, state.w, state.h);
      refreshRepairSource('Blank canvas captured as repair source.');
      createLayer('electric', 'Thunder 1');
      fitView();
      setStatus('New transparent canvas ready.');
    });

    $('addLayerBtn').addEventListener('click', () => createLayer(els.effectType.value));
    $('clearLayerBtn').addEventListener('click', clearActiveLayer);
    $('duplicateLayerBtn').addEventListener('click', duplicateActiveLayer);
    $('ichorConvertBtn').addEventListener('click', convertActiveLayerToIchor);
    $('ichorConvertBtn2').addEventListener('click', convertActiveLayerToIchor);
    $('deleteLayerBtn').addEventListener('click', deleteActiveLayer);
    $('moveLayerUpBtn').addEventListener('click', () => moveActiveLayer(1));
    $('moveLayerDownBtn').addEventListener('click', () => moveActiveLayer(-1));

    [els.brushColor, els.brushKind, els.brushSize, els.brushAlpha, els.brushAngle, els.effectType, els.intensity, els.transparency, els.speed, els.blur, els.sharpness, els.waveAmp, els.moteCount, els.vectorLength, els.ichorPreset, els.ichorVelocity, els.ichorPower, els.ichorThrust, els.ichorDust, els.ichorLighting, els.ichorEscape, els.ichorFluidity, els.ichorPressure].filter(Boolean).forEach((input) => {
      input.addEventListener('input', currentLayerSettingsToActive);
      input.addEventListener('change', currentLayerSettingsToActive);
    });
    els.brushColor?.addEventListener('input', () => { if (els.brushHex) els.brushHex.value = normalizeHex(els.brushColor.value); });
    els.brushHex?.addEventListener('change', () => { const next = normalizeHex(els.brushHex.value, els.brushColor.value); els.brushColor.value = next; els.brushHex.value = next; currentLayerSettingsToActive(); });
    [els.shapeType, els.shapeWidth, els.shapeHeight, els.shapeRotation, els.shapeSides, els.shapeAlpha, els.shapeFill, els.shapeBorder, els.shapeBorderWidth, els.shapeLink].filter(Boolean).forEach((input) => {
      input.addEventListener('input', updateSelectedShapeFromUi);
      input.addEventListener('change', updateSelectedShapeFromUi);
    });

    els.ichorPreset?.addEventListener('change', () => {
      applyIchorPresetToControls(getIchorPreset(els.ichorPreset.value));
      currentLayerSettingsToActive();
    });

    [els.tolerance, els.edgeSoftness, els.removeStrength, els.previewTransparency].forEach((input) => {
      input.addEventListener('input', updateTransparencyPreview);
      input.addEventListener('change', updateTransparencyPreview);
    });
    $('applyTransparencyBtn').addEventListener('click', applyTransparency);
    $('trimTransparentBtn').addEventListener('click', trimTransparent);
    $('repairSourceBtn')?.addEventListener('click', () => refreshRepairSource('Current image captured as the repair brush source.'));
    $('addShapeBtn')?.addEventListener('click', addShapeCenter);
    $('deleteShapeBtn')?.addEventListener('click', deleteSelectedShape);

    $('exportPngBtn').addEventListener('click', exportPng);
    $('exportProjectBtn').addEventListener('click', exportProject);
    $('exportHtmlBtn').addEventListener('click', exportHtml);
    $('saveBrowserBtn').addEventListener('click', saveBrowser);
    $('loadBrowserBtn').addEventListener('click', loadBrowser);
    $('clearBrowserBtn').addEventListener('click', clearBrowser);
  }

  async function restoreLastHistory() {
    const entry = state.history.pop();
    if (!entry) return setStatus('Nothing to undo.');
    try {
      state.redoHistory.push(serializeProject(false));
      await hydrateProject(entry, { preserveHistory: true });
      setStatus('Undo restored last saved base/layer state.');
    } catch (err) {
      console.error(err);
      setStatus('Undo failed.');
    }
  }

  async function restoreNextHistory() {
    const entry = state.redoHistory.pop();
    if (!entry) return setStatus('Nothing to redo.');
    try {
      state.history.push(serializeProject(false));
      if (state.history.length > state.maxHistory) state.history.shift();
      await hydrateProject(entry, { preserveHistory: true });
      setStatus('Redo restored the next saved state.');
    } catch (err) {
      console.error(err);
      setStatus('Redo failed.');
    }
  }

  function animate(time) {
    if (state.dirty || time - state.lastRender > 16) {
      renderLayers(time);
      state.lastRender = time;
    }
    requestAnimationFrame(animate);
  }

  function bootstrap() {
    installPwaSupport();
    populateIchorPresets();
    setIchorPanelOpen(false);
    resizeAll(1280, 720, false);
    const gradient = baseCtx.createLinearGradient(0, 0, state.w, state.h);
    gradient.addColorStop(0, 'rgba(0,255,255,0.08)');
    gradient.addColorStop(1, 'rgba(255,213,110,0.04)');
    baseCtx.fillStyle = gradient;
    baseCtx.fillRect(0, 0, state.w, state.h);
    refreshRepairSource('Startup canvas captured as repair source.');
    createLayer('electric', 'Thunder 1');
    installEvents();
    updateStageSize();
    setTimeout(fitView, 50);
    requestAnimationFrame(animate);
    setStatus('Ready. Upload an image, add effect layers, then paint animated strokes.');
  }

  bootstrap();
})();
