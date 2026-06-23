(() => {
  'use strict';

  const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbxW28DzqosHIy7w5Y4iU0FW0RBRqrQEob_8sTHbWYyRC3zFqSacL1-gKqjdg56gSRvs/exec';
  const MAX_HISTORY = 24;
  const DEFAULT_W = 1600;
  const DEFAULT_H = 1200;
  const PALETTE = [
    '#E8FFFF','#D6FFFA','#C9FFF4','#FFE6C9','#FFF3D6',
    '#99FFFF','#7EFBEA','#65E9D2','#F7B36B','#EFA35C',
    '#00FFFF','#00D9D9','#2FBED8','#CA6309','#B85A08',
    '#008B8B','#007A78','#0B6E74','#7A3A07','#643006',
    '#003C42','#003A3A','#062D34','#2A1304','#1A0A02',
    '#FFFFFF','#ECFFFF','#FFF1E6','#F1FFF9','#E9F8FF',
    '#001E24','#220E02','#09292C','#061F27','#0A241F'
  ];

  const ICHOR_PALETTE = {
    mist: ['#E8FFFF', '#DFFFFF', '#D9FFFF', '#C8FFFF', '#C7FFFF'],
    flash: ['#BDEBFF', '#BDF7F1', '#A6E7FF', '#A6BEC5'],
    glow: ['#9EFFFF', '#9FEEDD', '#9EF2E4', '#91FFFF', '#8DE0DC'],
    arc: ['#7EFBEA', '#65E9D2', '#5EAAAA', '#4BC7B0', '#48BAA6', '#3D9FA0'],
    body: ['#2FBED8', '#1FD1C2', '#00FFFF', '#00D9D9', '#00BFAF'],
    deep: ['#008C96', '#008B8B', '#00848A', '#007E8A', '#007A78', '#0E716B', '#0B6E74'],
    shadow: ['#0B6070', '#0B3F43', '#062D34', '#052C2A', '#003C42', '#003A3A', '#002A30', '#00242B']
  };

  // Version 1 Thundercoil/skyship preset math retained and mapped into the v2 shell.
  const LEGACY_ICHOR_PRESETS = {
      "legacy-handgun": {
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
      "legacy-weapon-handgun": {
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
      "legacy-weapon-mini-thundercoil": {
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
      "legacy-rifle": {
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
      "legacy-weapon-rifle": {
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
      "legacy-shotgun": {
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
      "legacy-weapon-shotgun": {
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
      "legacy-grenade": {
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
      "legacy-weapon-grenade": {
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
      "legacy-weapon-shock-bomb": {
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
      "legacy-coil-array": {
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
      "legacy-weapon-coil-array": {
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
      "legacy-hammer": {
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
      "legacy-weapon-hammer": {
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
      "legacy-weapon-axe": {
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
      "legacy-sword": {
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
      "legacy-weapon-sword": {
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
      "legacy-dagger": {
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
      "legacy-weapon-dagger": {
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
      "legacy-weapon-bow": {
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
      "legacy-weapon-crossbow": {
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
      "legacy-skyship-harbor-whisper": {
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
      "legacy-skyship-stern-drive-lens": {
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
      "legacy-skyship-keel-lift-bell": {
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
      "legacy-skyship-mast-stabilizer-vent": {
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
      "legacy-skyship-storm-climb-bloom": {
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
      "legacy-skyship-sail-thread-current": {
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
  };

  const $ = (id) => document.getElementById(id);
  const els = {
    toolDrawer: $('toolDrawer'),
    toggleTools: $('toggleTools'),
    stage: $('stage'),
    viewport: $('canvasViewport'),
    layerStack: $('layerStack'),
    preview: $('previewCanvas'),
    liveFx: $('liveFxCanvas'),
    grid: $('gridOverlay'),
    status: $('statusBar'),
    brushCursor: $('brushCursor'),
    colorDisc: $('colorDisc'),
    colorInput: $('colorInput'),
    hexInput: $('hexInput'),
    swatches: $('swatches'),
    toolGrid: $('toolGrid'),
    layersList: $('layersList'),
    framesList: $('framesList'),
    animationPreview: $('animationPreview'),
    hotspotLayer: $('hotspotLayer'),
    shortcutsDialog: $('shortcutsDialog'),
    objectLayer: $('objectLayer'),
    objectCanvas: $('objectCanvas'),
    assetGrid: $('assetGrid'),
    assetCategory: $('assetCategory'),
    assetSearch: $('assetSearch'),
    emojiGrid: $('emojiGrid'),
    objectList: $('objectList'),
    audioList: $('audioList'),
  };

  const inputs = {
    size: $('sizeInput'), opacity: $('opacityInput'), softness: $('softnessInput'), smooth: $('smoothInput'),
    blend: $('blendInput'), shapeType: $('shapeType'), shapeFill: $('shapeFill'), rotation: $('rotationInput'),
    text: $('textInput'), font: $('fontInput'), link: $('linkInput'), zoom: $('zoomInput'), canvasPreset: $('canvasPreset'),
    layerOpacity: $('layerOpacityInput'), fps: $('fpsInput'), onion: $('onionSkinInput'), tolerance: $('toleranceInput'),
    imageImport: $('imageImport'), projectImport: $('projectImport'),
    overlayImport: $('overlayImport'), sprayPalette: $('sprayPaletteInput'), sprayDensity: $('sprayDensityInput'), dripChance: $('dripChanceInput'),
    gradientToggle: $('gradientToggle'), gradientA: $('gradientA'), gradientB: $('gradientB'), gradientAngle: $('gradientAngleInput'),
    textSize: $('textSizeInput'), letterSpacing: $('letterSpacingInput'), lineSpacing: $('lineSpacingInput'), bend: $('bendInput'),
    strokeColor: $('strokeColorInput'), strokeWidth: $('strokeWidthInput'), highlightColor: $('highlightColorInput'), shadowBlur: $('shadowBlurInput'),
    textAlign: $('textAlignInput'), objectMode: $('objectModeInput'), objectX: $('objectXInput'), objectY: $('objectYInput'),
    objectW: $('objectWInput'), objectH: $('objectHInput'), objectOpacity: $('objectOpacityInput'),
    effectPreset: $('effectPresetInput'), effectSize: $('effectSizeInput'), effectIntensity: $('effectIntensityInput'),
    effectForks: $('effectForksInput'), effectEscape: $('effectEscapeInput'), effectFluidity: $('effectFluidityInput'),
    effectPressure: $('effectPressureInput'), effectLighting: $('effectLightingInput'), effectMotes: $('effectMotesInput'),
    effectSpeed: $('effectSpeedInput'), effectBlur: $('effectBlurInput'), effectSharpness: $('effectSharpnessInput'),
    effectWaveAmp: $('effectWaveAmpInput'), effectVectorLength: $('effectVectorLengthInput'),
    shapeSides: $('shapeSidesInput'), edgeSoftness: $('edgeSoftnessInput'), removeStrength: $('removeStrengthInput'), previewTransparency: $('previewTransparencyInput'),
    backgroundMode: $('backgroundModeInput'), backgroundColor: $('backgroundColorInput'),
  };

  const state = {
    width: DEFAULT_W,
    height: DEFAULT_H,
    zoom: 1,
    pan: { x: 420, y: 80 },
    activeTool: 'pencil',
    color: '#00FFFF',
    pickedColor: '#FFFFFF',
    brush: { size: 18, opacity: 1, softness: 0.35, smoothing: 0.45, blend: 'source-over' },
    shape: { type: 'rect', fill: 'fillStroke', rotation: 0, sides: 6 },
    layers: [],
    activeLayerId: null,
    frames: [],
    annotations: [],
    objects: [],
    activeObjectId: null,
    assetLibrary: [],
    spray: { colors: ['#00FFFF','#7EFBEA','#CA6309'], density: 0.55, drip: 0.22 },
    effect: { preset: 'balanced', size: 28, intensity: 1, forks: 0.55, escape: 0.45, fluidity: 0.7, pressure: 0.7, lighting: 1.2, motes: 80, speed: 1, blur: 4, sharpness: 1, waveAmp: 28, vectorLength: 44 },
    textStyle: { bold: false, italic: false, underline: false, strike: false, size: 72, letterSpacing: 0, lineSpacing: 1.1, bend: 0, stroke: '#001E24', strokeWidth: 4, highlight: '#FFF3D6', shadowBlur: 10, align: 'left' },
    gradient: { enabled: true, a: '#00FFFF', b: '#CA6309', angle: 45 },
    background: { mode: 'transparent', color: '#FFFFFF' },
    liveEffects: [],
    currentLiveEffect: null,
    liveFxAnimationFrame: null,
    objectMode: true,
    pinBackground: false,
    history: [],
    redo: [],
    pointer: null,
    lastPoint: null,
    points: [],
    mirror: false,
    grid: true,
    animationTimer: null,
    animationIndex: 0,
    beforeTransparentSnapshot: null,
    transparentColor: null,
    transparentSeed: null,
    repairSourceDataUrl: null,
    repairSourceCanvas: null,
    zoomBoxRect: null,
    deferredInstallPrompt: null,
  };

  function uid(prefix = 'id') {
    return `${prefix}_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
  }

  function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }
  function degToRad(deg) { return deg * Math.PI / 180; }
  function hex(n) { return n.toString(16).padStart(2, '0').toUpperCase(); }
  function rgbToHex(r, g, b) { return `#${hex(r)}${hex(g)}${hex(b)}`; }
  function parseHex(value) {
    if (!value) return [0, 255, 255, 255];
    let v = String(value).trim().replace('#', '');
    if (v.length === 3) v = v.split('').map((c) => c + c).join('');
    if (v.length === 6) v += 'FF';
    if (!/^[0-9a-fA-F]{8}$/.test(v)) return [0, 255, 255, 255];
    return [parseInt(v.slice(0,2),16), parseInt(v.slice(2,4),16), parseInt(v.slice(4,6),16), parseInt(v.slice(6,8),16)];
  }

  function canvasToBlob(canvas, type = 'image/png', quality = 0.95) {
    return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  }

  function download(filename, data, mime = 'application/octet-stream') {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function status(message) {
    els.status.textContent = message;
  }

  function createCanvas(width = state.width, height = state.height, className = '') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.className = className;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    return canvas;
  }

  function getActiveLayer() {
    return state.layers.find((layer) => layer.id === state.activeLayerId) || state.layers[state.layers.length - 1];
  }

  function updateStageSize() {
    els.stage.style.width = `${state.width}px`;
    els.stage.style.height = `${state.height}px`;
    els.preview.width = state.width;
    els.preview.height = state.height;
    if (els.liveFx) { els.liveFx.width = state.width; els.liveFx.height = state.height; els.liveFx.style.width = `${state.width}px`; els.liveFx.style.height = `${state.height}px`; }
    if (els.objectCanvas) { els.objectCanvas.width = state.width; els.objectCanvas.height = state.height; els.objectCanvas.style.width = `${state.width}px`; els.objectCanvas.style.height = `${state.height}px`; }
    els.preview.style.width = `${state.width}px`;
    els.preview.style.height = `${state.height}px`;
    applyCanvasBackground();
    renderLiveEffects();
    for (const layer of state.layers) {
      if (layer.canvas.width !== state.width || layer.canvas.height !== state.height) {
        const old = layer.canvas;
        const replacement = createCanvas(state.width, state.height, 'art-layer');
        replacement.getContext('2d').drawImage(old, 0, 0);
        layer.canvas.replaceWith(replacement);
        layer.canvas = replacement;
        layer.ctx = replacement.getContext('2d', { willReadFrequently: true });
      }
    }
    applyView();
    renderHotspots();
  }

  function addLayer(name = `Layer ${state.layers.length + 1}`, dataUrl = null) {
    const canvas = createCanvas(state.width, state.height, 'art-layer');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const layer = { id: uid('layer'), name, canvas, ctx, visible: true, opacity: 1, blend: 'source-over' };
    state.layers.push(layer);
    els.layerStack.appendChild(canvas);
    state.activeLayerId = layer.id;
    if (dataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, state.width, state.height);
      img.src = dataUrl;
    }
    renderLayers();
    return layer;
  }

  function removeLayer(id) {
    if (state.layers.length <= 1) {
      status('Keep at least one layer.');
      return;
    }
    const idx = state.layers.findIndex((l) => l.id === id);
    if (idx < 0) return;
    pushHistory('delete layer');
    state.layers[idx].canvas.remove();
    state.layers.splice(idx, 1);
    state.activeLayerId = state.layers[Math.max(0, idx - 1)].id;
    renderLayers();
    status('Layer deleted.');
  }

  function reorderLayers() {
    els.layerStack.innerHTML = '';
    for (const layer of state.layers) els.layerStack.appendChild(layer.canvas);
    renderLayers();
  }

  function renderLayers() {
    els.layersList.innerHTML = '';
    for (let i = state.layers.length - 1; i >= 0; i--) {
      const layer = state.layers[i];
      layer.canvas.style.display = layer.visible ? 'block' : 'none';
      layer.canvas.style.opacity = layer.opacity;
      layer.canvas.style.mixBlendMode = cssBlend(layer.blend);
      const row = document.createElement('div');
      row.className = `layer-item${layer.id === state.activeLayerId ? ' active' : ''}`;
      const img = document.createElement('img');
      img.className = 'layer-thumb';
      img.alt = '';
      img.src = layer.canvas.toDataURL('image/png');
      const name = document.createElement('span');
      name.textContent = layer.name;
      const actions = document.createElement('div');
      actions.className = 'button-row';
      const select = document.createElement('button');
      select.type = 'button';
      select.textContent = 'Use';
      select.addEventListener('click', () => { state.activeObjectId = null; state.activeLayerId = layer.id; inputs.layerOpacity.value = Math.round(layer.opacity * 100); $('layerOpacityOut').textContent = String(Math.round(layer.opacity * 100)); renderLayers(); renderObjects(); });
      const visible = document.createElement('button');
      visible.type = 'button';
      visible.textContent = layer.visible ? 'Hide' : 'Show';
      visible.addEventListener('click', () => { layer.visible = !layer.visible; renderLayers(); });
      actions.append(select, visible);
      row.append(img, name, actions);
      els.layersList.appendChild(row);
    }
    renderObjectList();
  }

  function cssBlend(blend) {
    const allowed = new Set(['multiply','screen','overlay','soft-light','color-dodge','lighter','darken','lighten']);
    return allowed.has(blend) ? blend : 'normal';
  }

  function serializeProject(options = {}) {
    const includeFrames = options.includeFrames !== false;
    return {
      app: 'Belavados Effect Studio',
      version: '2026.06.mobile-first-assets-and-overlays',
      savedAt: new Date().toISOString(),
      backendAction: 'saveEffectStudioProject',
      width: state.width,
      height: state.height,
      zoom: state.zoom,
      pan: state.pan,
      activeTool: state.activeTool,
      color: state.color,
      brush: state.brush,
      shape: state.shape,
      mirror: state.mirror,
      annotations: state.annotations,
      objects: state.objects,
      spray: state.spray,
      effect: state.effect,
      textStyle: state.textStyle,
      gradient: state.gradient,
      background: state.background,
      transparentColor: state.transparentColor,
      transparentSeed: state.transparentSeed,
      repairSourceDataUrl: state.repairSourceDataUrl,
      liveEffects: state.liveEffects,
      layers: state.layers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        visible: layer.visible,
        opacity: layer.opacity,
        blend: layer.blend,
        dataUrl: layer.canvas.toDataURL('image/png')
      })),
      frames: includeFrames ? state.frames : [],
    };
  }

  async function loadProject(project) {
    if (!project || !Array.isArray(project.layers)) throw new Error('Invalid project JSON.');
    state.width = Number(project.width) || DEFAULT_W;
    state.height = Number(project.height) || DEFAULT_H;
    state.pan = project.pan || { x: 80, y: 80 };
    state.zoom = Number(project.zoom) || 1;
    state.color = project.color || '#00FFFF';
    state.brush = { ...state.brush, ...(project.brush || {}) };
    state.shape = { ...state.shape, ...(project.shape || {}) };
    state.mirror = !!project.mirror;
    state.annotations = Array.isArray(project.annotations) ? project.annotations : [];
    state.objects = Array.isArray(project.objects) ? project.objects : [];
    state.spray = { ...state.spray, ...(project.spray || {}) };
    state.effect = { ...state.effect, ...(project.effect || {}) };
    state.textStyle = { ...state.textStyle, ...(project.textStyle || {}) };
    state.gradient = { ...state.gradient, ...(project.gradient || {}) };
    state.background = { ...state.background, ...(project.background || {}) };
    state.transparentColor = project.transparentColor || null;
    state.transparentSeed = project.transparentSeed || null;
    state.repairSourceDataUrl = project.repairSourceDataUrl || null;
    if (state.repairSourceDataUrl) hydrateRepairSourceCanvas(state.repairSourceDataUrl);
    state.liveEffects = Array.isArray(project.liveEffects) ? sanitizeLiveEffects(project.liveEffects) : [];
    state.activeObjectId = null;
    state.frames = Array.isArray(project.frames) ? project.frames : [];
    els.layerStack.innerHTML = '';
    state.layers = [];
    for (const layerData of project.layers) {
      const layer = addLayer(layerData.name || 'Layer', null);
      layer.id = layerData.id || layer.id;
      layer.visible = layerData.visible !== false;
      layer.opacity = Number.isFinite(layerData.opacity) ? layerData.opacity : 1;
      layer.blend = layerData.blend || 'source-over';
      if (layerData.dataUrl) {
        await drawDataUrl(layer.ctx, layerData.dataUrl, state.width, state.height);
      }
    }
    state.activeLayerId = state.layers[state.layers.length - 1]?.id || null;
    setColor(state.color);
    inputs.size.value = String(state.brush.size);
    inputs.opacity.value = String(Math.round(state.brush.opacity * 100));
    inputs.softness.value = String(Math.round(state.brush.softness * 100));
    inputs.smooth.value = String(Math.round(state.brush.smoothing * 100));
    inputs.blend.value = state.brush.blend;
    inputs.zoom.value = String(Math.round(state.zoom * 100));
    updateOutputLabels();
    updateStageSize();
    renderLayers();
    renderFrames();
    renderHotspots();
    renderObjects();
    syncExtraInputsFromState();
    applyCanvasBackground();
    renderLiveEffects();
    applyView();
    status('Project loaded.');
  }

  function drawDataUrl(ctx, dataUrl, width, height) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { ctx.clearRect(0, 0, width, height); ctx.drawImage(img, 0, 0, width, height); resolve(); };
      img.onerror = reject;
      img.src = dataUrl;
    });
  }

  function pushHistory(reason = 'edit') {
    try {
      state.history.push(serializeProject({ includeFrames: false }));
      if (state.history.length > MAX_HISTORY) state.history.shift();
      state.redo.length = 0;
      status(`Saved undo point: ${reason}.`);
    } catch (err) {
      console.warn('History skipped:', err);
    }
  }

  async function undo() {
    const snapshot = state.history.pop();
    if (!snapshot) { status('Nothing to undo.'); return; }
    state.redo.push(serializeProject({ includeFrames: false }));
    await loadProject({ ...snapshot, frames: state.frames });
    status('Undo complete.');
  }

  async function redo() {
    const snapshot = state.redo.pop();
    if (!snapshot) { status('Nothing to redo.'); return; }
    state.history.push(serializeProject({ includeFrames: false }));
    await loadProject({ ...snapshot, frames: state.frames });
    status('Redo complete.');
  }

  function fitCanvas() {
    const rect = els.viewport.getBoundingClientRect();
    const sidePad = window.innerWidth >= 980 ? 48 : 24;
    const z = Math.min((rect.width - sidePad) / state.width, (rect.height - 120) / state.height);
    state.zoom = clamp(z, 0.05, 8);
    state.pan.x = (rect.width - state.width * state.zoom) / 2;
    state.pan.y = (rect.height - state.height * state.zoom) / 2;
    inputs.zoom.value = String(Math.round(state.zoom * 100));
    applyView();
  }

  function applyView() {
    els.stage.style.transform = `translate(${state.pan.x}px, ${state.pan.y}px) scale(${state.zoom})`;
    $('zoomOut').textContent = String(Math.round(state.zoom * 100));
    inputs.zoom.value = String(Math.round(state.zoom * 100));
    renderHotspots();
    status(`${titleCase(state.activeTool)} · ${state.width}×${state.height} · ${Math.round(state.zoom * 100)}%`);
  }

  function titleCase(str) { return str ? str.charAt(0).toUpperCase() + str.slice(1) : ''; }

  function setTool(tool) {
    state.activeTool = tool;
    document.querySelectorAll('[data-tool]').forEach((btn) => btn.classList.toggle('active', btn.dataset.tool === tool));
    els.viewport.style.cursor = tool === 'pan' ? 'grab' : 'crosshair';
    updateBrushCursor();
    status(`${titleCase(tool)} ready.`);
  }

  function setColor(value) {
    const [r, g, b] = parseHex(value);
    state.color = rgbToHex(r, g, b);
    els.colorInput.value = state.color;
    els.hexInput.value = state.color;
    updateBrushCursor();
  }

  function updateOutputLabels() {
    state.brush.size = Number(inputs.size.value);
    state.brush.opacity = Number(inputs.opacity.value) / 100;
    state.brush.softness = Number(inputs.softness.value) / 100;
    state.brush.smoothing = Number(inputs.smooth.value) / 100;
    state.brush.blend = inputs.blend.value;
    state.shape.type = inputs.shapeType.value;
    state.shape.fill = inputs.shapeFill.value;
    state.shape.rotation = Number(inputs.rotation.value);
    if (inputs.shapeSides) state.shape.sides = Number(inputs.shapeSides.value || 6);
    state.zoom = Number(inputs.zoom.value) / 100;
    if (inputs.sprayPalette) state.spray.colors = parseColorList(inputs.sprayPalette.value);
    if (inputs.sprayDensity) state.spray.density = Number(inputs.sprayDensity.value) / 100;
    if (inputs.dripChance) state.spray.drip = Number(inputs.dripChance.value) / 100;
    if (inputs.gradientToggle) state.gradient.enabled = inputs.gradientToggle.checked;
    if (inputs.gradientA) state.gradient.a = inputs.gradientA.value;
    if (inputs.gradientB) state.gradient.b = inputs.gradientB.value;
    if (inputs.gradientAngle) state.gradient.angle = Number(inputs.gradientAngle.value);
    if (inputs.backgroundMode) state.background.mode = inputs.backgroundMode.value;
    if (inputs.backgroundColor) state.background.color = rgbToHex(...parseHex(inputs.backgroundColor.value));
    applyCanvasBackground();
    if (state.liveEffects.length || state.currentLiveEffect) renderLiveEffects();
    if (state.frames.length) updateAnimationPreview(state.frames[0]?.dataUrl);
    if (inputs.textSize) state.textStyle.size = Number(inputs.textSize.value);
    if (inputs.letterSpacing) state.textStyle.letterSpacing = Number(inputs.letterSpacing.value);
    if (inputs.lineSpacing) state.textStyle.lineSpacing = Number(inputs.lineSpacing.value) / 100;
    if (inputs.bend) state.textStyle.bend = Number(inputs.bend.value) / 100;
    if (inputs.strokeColor) state.textStyle.stroke = inputs.strokeColor.value;
    if (inputs.strokeWidth) state.textStyle.strokeWidth = Number(inputs.strokeWidth.value);
    if (inputs.highlightColor) state.textStyle.highlight = inputs.highlightColor.value;
    if (inputs.shadowBlur) state.textStyle.shadowBlur = Number(inputs.shadowBlur.value);
    if (inputs.textAlign) state.textStyle.align = inputs.textAlign.value;
    if (inputs.objectMode) state.objectMode = inputs.objectMode.checked;
    if (inputs.effectPreset) state.effect.preset = inputs.effectPreset.value;
    if (inputs.effectSize) state.effect.size = Number(inputs.effectSize.value);
    if (inputs.effectIntensity) state.effect.intensity = Number(inputs.effectIntensity.value) / 100;
    if (inputs.effectForks) state.effect.forks = Number(inputs.effectForks.value) / 100;
    if (inputs.effectEscape) state.effect.escape = Number(inputs.effectEscape.value) / 100;
    if (inputs.effectFluidity) state.effect.fluidity = Number(inputs.effectFluidity.value) / 100;
    if (inputs.effectPressure) state.effect.pressure = Number(inputs.effectPressure.value) / 100;
    if (inputs.effectLighting) state.effect.lighting = Number(inputs.effectLighting.value) / 100;
    if (inputs.effectMotes) state.effect.motes = Number(inputs.effectMotes.value);
    if (inputs.effectSpeed) state.effect.speed = Number(inputs.effectSpeed.value) / 100;
    if (inputs.effectBlur) state.effect.blur = Number(inputs.effectBlur.value);
    if (inputs.effectSharpness) state.effect.sharpness = Number(inputs.effectSharpness.value) / 100;
    if (inputs.effectWaveAmp) state.effect.waveAmp = Number(inputs.effectWaveAmp.value);
    if (inputs.effectVectorLength) state.effect.vectorLength = Number(inputs.effectVectorLength.value);
    $('sizeOut').textContent = String(state.brush.size);
    $('opacityOut').textContent = String(Math.round(state.brush.opacity * 100));
    $('softnessOut').textContent = String(Math.round(state.brush.softness * 100));
    $('smoothOut').textContent = String(Math.round(state.brush.smoothing * 100));
    $('rotationOut').textContent = String(state.shape.rotation);
    if ($('shapeSidesOut')) $('shapeSidesOut').textContent = String(state.shape.sides || 6);
    if ($('sprayDensityOut')) $('sprayDensityOut').textContent = String(Math.round(state.spray.density * 100));
    if ($('dripChanceOut')) $('dripChanceOut').textContent = String(Math.round(state.spray.drip * 100));
    if ($('gradientAngleOut')) $('gradientAngleOut').textContent = String(state.gradient.angle);
    if ($('textSizeOut')) $('textSizeOut').textContent = String(state.textStyle.size);
    if ($('letterSpacingOut')) $('letterSpacingOut').textContent = String(state.textStyle.letterSpacing);
    if ($('lineSpacingOut')) $('lineSpacingOut').textContent = String(state.textStyle.lineSpacing.toFixed(1));
    if ($('bendOut')) $('bendOut').textContent = String(Math.round(state.textStyle.bend * 100));
    if ($('strokeWidthOut')) $('strokeWidthOut').textContent = String(state.textStyle.strokeWidth);
    if ($('shadowBlurOut')) $('shadowBlurOut').textContent = String(state.textStyle.shadowBlur);
    updateSelectedObjectFromInputs(false);
    $('fpsOut').textContent = String(inputs.fps.value);
    $('toleranceOut').textContent = String(inputs.tolerance.value);
    $('zoomOut').textContent = String(Math.round(state.zoom * 100));
    $('layerOpacityOut').textContent = String(inputs.layerOpacity.value);
    if ($('effectSizeOut')) $('effectSizeOut').textContent = String(state.effect.size);
    if ($('effectIntensityOut')) $('effectIntensityOut').textContent = String(Math.round(state.effect.intensity * 100));
    if ($('effectForksOut')) $('effectForksOut').textContent = String(Math.round(state.effect.forks * 100));
    if ($('effectEscapeOut')) $('effectEscapeOut').textContent = String(Math.round(state.effect.escape * 100));
    if ($('effectFluidityOut')) $('effectFluidityOut').textContent = String(Math.round(state.effect.fluidity * 100));
    if ($('effectPressureOut')) $('effectPressureOut').textContent = String(Math.round(state.effect.pressure * 100));
    if ($('effectLightingOut')) $('effectLightingOut').textContent = String(Math.round(state.effect.lighting * 100));
    if ($('effectMotesOut')) $('effectMotesOut').textContent = String(Math.round(state.effect.motes));
    if ($('effectSpeedOut')) $('effectSpeedOut').textContent = String(Math.round((state.effect.speed || 1) * 100));
    if ($('effectBlurOut')) $('effectBlurOut').textContent = String(Math.round(state.effect.blur || 0));
    if ($('effectSharpnessOut')) $('effectSharpnessOut').textContent = String(Math.round((state.effect.sharpness || 1) * 100));
    if ($('effectWaveAmpOut')) $('effectWaveAmpOut').textContent = String(Math.round(state.effect.waveAmp || 0));
    if ($('effectVectorLengthOut')) $('effectVectorLengthOut').textContent = String(Math.round(state.effect.vectorLength || 0));
    if ($('edgeSoftnessOut') && inputs.edgeSoftness) $('edgeSoftnessOut').textContent = String(inputs.edgeSoftness.value);
    if ($('removeStrengthOut') && inputs.removeStrength) $('removeStrengthOut').textContent = String(inputs.removeStrength.value);
    updateBrushCursor();
  }

  function clientToCanvas(clientX, clientY) {
    const rect = els.viewport.getBoundingClientRect();
    const x = (clientX - rect.left - state.pan.x) / state.zoom;
    const y = (clientY - rect.top - state.pan.y) / state.zoom;
    return { x: clamp(x, -5000, state.width + 5000), y: clamp(y, -5000, state.height + 5000) };
  }

  function configureCtx(ctx, options = {}) {
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = options.color || state.color;
    ctx.fillStyle = options.color || state.color;
    ctx.lineWidth = options.size || state.brush.size;
    ctx.globalAlpha = options.opacity ?? state.brush.opacity;
    ctx.globalCompositeOperation = options.blend || state.brush.blend || 'source-over';
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
  }

  function drawLine(ctx, from, to, tool = state.activeTool) {
    const size = state.brush.size;
    configureCtx(ctx);
    if (tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
    if (tool === 'repair') ctx.globalCompositeOperation = 'source-over';
    if (tool === 'marker') { ctx.globalAlpha *= 0.38; ctx.lineWidth = size * 1.15; }
    if (tool === 'crayon') { ctx.globalAlpha *= 0.52; ctx.lineWidth = size; }
    if (tool === 'charcoal') { ctx.globalAlpha *= 0.48; ctx.lineWidth = size * 1.25; }
    if (tool === 'paint') { ctx.globalAlpha *= 0.9; ctx.lineWidth = size * 1.35; }
    if (tool === 'ink') { ctx.lineWidth = Math.max(1, size * 0.55); }
    if (tool === 'pixel') {
      const grid = Math.max(2, Math.round(size));
      ctx.globalAlpha = state.brush.opacity;
      ctx.fillRect(Math.floor(to.x / grid) * grid, Math.floor(to.y / grid) * grid, grid, grid);
      return;
    }
    if (tool === 'repair' && state.repairSourceCanvas) {
      const radius = Math.max(1, size / 2);
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = state.brush.opacity;
      ctx.beginPath();
      ctx.arc(to.x, to.y, radius, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(state.repairSourceCanvas, to.x - radius, to.y - radius, radius * 2, radius * 2, to.x - radius, to.y - radius, radius * 2, radius * 2);
      ctx.restore();
      return;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    if (state.brush.smoothing > 0.02) {
      const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
      ctx.quadraticCurveTo(from.x, from.y, mid.x, mid.y);
    } else {
      ctx.lineTo(to.x, to.y);
    }
    ctx.stroke();
    if (tool === 'crayon' || tool === 'charcoal') addTexture(ctx, to, size, tool);
  }

  function addTexture(ctx, point, size, tool) {
    const count = tool === 'charcoal' ? 10 : 6;
    const [r,g,b] = parseHex(state.color);
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = Math.random() * size * 0.9;
      const dot = Math.max(1, size * (Math.random() * 0.11));
      ctx.fillStyle = `rgba(${r},${g},${b},${0.06 + Math.random() * 0.12})`;
      ctx.beginPath();
      ctx.arc(point.x + Math.cos(a) * rad, point.y + Math.sin(a) * rad, dot, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawSpray(ctx, point, graffiti = false) {
    const size = state.brush.size;
    const softness = state.brush.softness;
    const density = Math.round(((graffiti ? 28 : 18) + size * (0.7 + softness)) * (0.35 + state.spray.density));
    const radius = size * (0.65 + softness * 1.5);
    const palette = state.spray.colors && state.spray.colors.length ? state.spray.colors : [state.color];
    ctx.globalCompositeOperation = state.brush.blend;
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.pow(Math.random(), 0.72) * radius;
      const x = point.x + Math.cos(angle) * dist;
      const y = point.y + Math.sin(angle) * dist;
      const chosen = palette[Math.floor(Math.random() * palette.length)];
      const [r, g, b] = parseHex(chosen);
      const alpha = state.brush.opacity * (graffiti ? 0.16 : 0.10) * (1 - dist / (radius + 1));
      ctx.fillStyle = `rgba(${r},${g},${b},${clamp(alpha, 0.015, 0.7)})`;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.7, Math.random() * size * 0.07), 0, Math.PI * 2);
      ctx.fill();
    }
    if (graffiti && Math.random() < state.spray.drip) {
      const [r,g,b] = parseHex(palette[Math.floor(Math.random() * palette.length)] || state.color);
      ctx.strokeStyle = `rgba(${r},${g},${b},${0.22 * state.brush.opacity})`;
      ctx.lineWidth = Math.max(1, size * 0.07);
      ctx.beginPath();
      ctx.moveTo(point.x + (Math.random() - .5) * size, point.y);
      ctx.lineTo(point.x + (Math.random() - .5) * size, point.y + Math.random() * size * 2.5);
      ctx.stroke();
    }
  }


  function ichorRandomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  function ichorJitter(amount) {
    return (Math.random() - 0.5) * amount * 2;
  }

  function paletteColor(group, fallback = '#00FFFF') {
    const colors = ICHOR_PALETTE[group] || ICHOR_PALETTE.body;
    return colors && colors.length ? colors[Math.floor(Math.random() * colors.length)] : fallback;
  }

  function rgbaFromHex(color, alpha = 1) {
    const [r, g, b] = parseHex(color || '#00FFFF');
    return `rgba(${r},${g},${b},${clamp(alpha, 0, 1)})`;
  }

  function tangentAt(points, index) {
    const a = points[Math.max(0, index - 1)] || points[index] || { x: 0, y: 0 };
    const b = points[Math.min(points.length - 1, index + 1)] || points[index] || a;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    return { x: dx / len, y: dy / len, angle: Math.atan2(dy, dx) };
  }

  function makeJaggedLine(from, to, segments = 6, jitter = 4) {
    const pts = [];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const fade = Math.sin(t * Math.PI);
      pts.push({
        x: from.x + dx * t + nx * ichorJitter(jitter) * fade,
        y: from.y + dy * t + ny * ichorJitter(jitter) * fade
      });
    }
    pts[0] = { ...from };
    pts[pts.length - 1] = { ...to };
    return pts;
  }

  function simplifyPoints(points, minDist = 4) {
    const out = [];
    for (const p of points || []) {
      const prev = out[out.length - 1];
      if (!prev || Math.hypot(p.x - prev.x, p.y - prev.y) >= minDist) out.push(p);
    }
    return out.length > 1 ? out : (points || []);
  }

  function effectSettings() {
    const bodyColor = ICHOR_PALETTE.body.includes(state.color) || ICHOR_PALETTE.glow.includes(state.color) || ICHOR_PALETTE.arc.includes(state.color)
      ? state.color
      : '#00FFFF';
    return {
      size: Math.max(1, state.effect.size || state.brush.size || 28),
      intensity: Math.max(0.05, state.effect.intensity || 1),
      forks: Math.max(0, state.effect.forks || 0),
      escape: Math.max(0, state.effect.escape || 0),
      fluidity: Math.max(0, state.effect.fluidity || 0),
      pressure: Math.max(0, state.effect.pressure || 0),
      lighting: Math.max(0, state.effect.lighting || 1),
      motes: Math.max(0, state.effect.motes || 0),
      speed: Math.max(0, state.effect.speed || 1),
      blur: Math.max(0, state.effect.blur || 0),
      sharpness: Math.max(0.05, state.effect.sharpness || 1),
      waveAmp: Math.max(0, state.effect.waveAmp || 28),
      vectorLength: Math.max(0, state.effect.vectorLength || 44),
      opacity: Math.max(0.01, state.brush.opacity || 1),
      palette: ICHOR_PALETTE,
      main: bodyColor,
      mist: '#E8FFFF',
      glow: '#9EFFFF',
      deep: '#008B8B',
      shadow: '#003A3A'
    };
  }

  function drawGlowLine(ctx, points, color, width, alpha, glow = 0, blend = 'lighter') {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.globalCompositeOperation = blend;
    ctx.strokeStyle = color;
    ctx.globalAlpha = clamp(alpha, 0, 1);
    ctx.lineWidth = Math.max(0.45, width);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowColor = color;
    ctx.shadowBlur = Math.max(0, glow);
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    ctx.restore();
  }

  function drawMoteSpray(ctx, point, settings = effectSettings(), densityMultiplier = 1) {
    const size = Math.max(3, settings.size || state.brush.size || 28);
    const count = Math.max(2, Math.round((settings.motes || size) * densityMultiplier * (0.18 + state.brush.softness * 0.34)));
    const radius = size * (0.65 + settings.escape * 1.25 + state.brush.softness * 1.1);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < count; i++) {
      const dist = Math.sqrt(Math.random()) * radius;
      const angle = Math.random() * Math.PI * 2;
      const x = point.x + Math.cos(angle) * dist;
      const y = point.y + Math.sin(angle) * dist;
      const color = Math.random() < 0.72 ? paletteColor('mist') : paletteColor('glow');
      const dot = Math.max(0.5, ichorRandomBetween(0.8, Math.max(1.4, size * 0.12)));
      const alpha = settings.opacity * ichorRandomBetween(0.055, 0.34) * (1 - dist / (radius + 1));
      ctx.shadowColor = color;
      ctx.shadowBlur = size * (0.14 + settings.lighting * 0.34);
      const grad = ctx.createRadialGradient(x, y, 0, x, y, dot * (1.8 + Math.random() * 1.6));
      grad.addColorStop(0, rgbaFromHex(color, alpha));
      grad.addColorStop(1, rgbaFromHex(color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, dot * (1.8 + Math.random()), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawIchorForks(ctx, path, angle, settings, electricOnly = false) {
    const size = settings.size;
    const baseCount = electricOnly ? 1 + settings.forks * 5 : 1 + settings.forks * 4 + settings.escape * 2;
    const forkCount = Math.max(1, Math.min(12, Math.round(baseCount * Math.max(0.35, size / 22))));
    for (let i = 0; i < forkCount; i++) {
      const anchorIndex = Math.max(1, Math.min(path.length - 2, Math.floor(ichorRandomBetween(1, path.length - 1))));
      const anchor = path[anchorIndex] || path[Math.floor(path.length / 2)] || path[0];
      const side = Math.random() < 0.5 ? -1 : 1;
      const forkAngle = angle + side * ichorRandomBetween(0.55, 1.45 + settings.escape * 0.55) + ichorJitter(settings.fluidity * 0.35);
      const forkLen = size * ichorRandomBetween(0.72, electricOnly ? 2.85 : 2.2 + settings.escape * 0.85);
      const end = { x: anchor.x + Math.cos(forkAngle) * forkLen, y: anchor.y + Math.sin(forkAngle) * forkLen };
      const fork = makeJaggedLine(anchor, end, 3 + Math.floor(Math.random() * 4), size * (0.12 + settings.fluidity * 0.16));
      const color = Math.random() < 0.42 ? paletteColor('flash') : paletteColor('arc');
      drawGlowLine(ctx, fork, color, Math.max(0.7, size * ichorRandomBetween(0.035, 0.12)), settings.opacity * ichorRandomBetween(0.38, 0.88) * settings.intensity, size * settings.lighting * 0.7, 'lighter');
      drawGlowLine(ctx, fork, paletteColor('mist'), Math.max(0.45, size * 0.018), settings.opacity * 0.74, size * settings.lighting * 0.26, 'source-over');
      if (settings.escape > 0.55 && Math.random() < settings.escape * 0.42) {
        const tip = fork[fork.length - 1];
        const secondAngle = forkAngle + side * ichorRandomBetween(0.35, 0.9);
        const secondEnd = { x: tip.x + Math.cos(secondAngle) * forkLen * ichorRandomBetween(0.28, 0.65), y: tip.y + Math.sin(secondAngle) * forkLen * ichorRandomBetween(0.28, 0.65) };
        drawGlowLine(ctx, makeJaggedLine(tip, secondEnd, 3, size * 0.08), paletteColor('mist'), Math.max(0.4, size * 0.022), settings.opacity * 0.56, size * settings.lighting * 0.35, 'lighter');
      }
    }
  }

  function drawIchorBrushSegment(ctx, from, to, settings = effectSettings()) {
    if (!from || !to) return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) return;
    const size = settings.size;
    const angle = Math.atan2(dy, dx);
    const segments = Math.max(3, Math.min(18, Math.round(len / Math.max(6, size * 0.38))));
    const path = makeJaggedLine(from, to, segments, size * (0.12 + settings.fluidity * 0.24 + settings.pressure * 0.05));
    const width = size * ichorRandomBetween(0.18, 0.36) * (0.88 + settings.pressure * 0.28);

    drawGlowLine(ctx, path, settings.mist, size * (1.15 + settings.fluidity * 0.62), settings.opacity * 0.11 * settings.intensity, size * settings.lighting * 1.65, 'lighter');
    drawGlowLine(ctx, path, settings.shadow, width * 1.8, settings.opacity * 0.22, 0, 'source-over');
    drawGlowLine(ctx, path, settings.deep, width * 1.55, settings.opacity * 0.42 * settings.intensity, size * settings.lighting * 0.5, 'lighter');
    drawGlowLine(ctx, path, settings.main, width, settings.opacity * 0.66 * settings.intensity, size * settings.lighting * 1.15, 'lighter');
    drawGlowLine(ctx, path, paletteColor('arc'), width * 0.42, settings.opacity * 0.74, size * settings.lighting * 0.65, 'lighter');
    drawGlowLine(ctx, path, settings.mist, Math.max(0.8, width * 0.22), settings.opacity * 0.92, size * 0.22, 'source-over');
    drawIchorForks(ctx, path, angle, settings, false);
    if (Math.random() < 0.72) drawMoteSpray(ctx, to, { ...settings, size: size * 0.75, motes: Math.max(6, settings.motes * 0.18) }, 0.5);
  }

  function drawElectricBrushSegment(ctx, from, to, settings = effectSettings()) {
    if (!from || !to) return;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy);
    if (len < 0.5) return;
    const angle = Math.atan2(dy, dx);
    const size = settings.size;
    const path = makeJaggedLine(from, to, Math.max(3, Math.min(20, Math.round(len / 10))), size * (0.07 + settings.fluidity * 0.24));
    drawGlowLine(ctx, path, settings.mist, size * 0.82, settings.opacity * 0.14 * settings.intensity, size * settings.lighting * 1.55, 'lighter');
    drawGlowLine(ctx, path, paletteColor('arc'), size * 0.18, settings.opacity * 0.74 * settings.intensity, size * settings.lighting * 0.9, 'lighter');
    drawGlowLine(ctx, path, '#FFFFFF', Math.max(0.7, size * 0.045), settings.opacity * 0.94, size * 0.2, 'source-over');
    drawIchorForks(ctx, path, angle, { ...settings, forks: Math.max(settings.forks, 0.65), escape: settings.escape + 0.2 }, true);
  }

  function drawIchorDab(ctx, point, settings = effectSettings(), electricOnly = false) {
    const size = Math.max(3, settings.size || 28);
    const arms = Math.max(3, Math.min(10, Math.round(size / 10)));
    for (let i = 0; i < arms; i++) {
      const a = (Math.PI * 2 / arms) * i + ichorJitter(0.32);
      const end = { x: point.x + Math.cos(a) * size * ichorRandomBetween(0.16, 0.52), y: point.y + Math.sin(a) * size * ichorRandomBetween(0.16, 0.52) };
      if (electricOnly) drawElectricBrushSegment(ctx, point, end, settings);
      else drawIchorBrushSegment(ctx, point, end, settings);
    }
  }


  function drawLegacyBlink(ctx, points, settings) {
    const step = Math.max(2, Math.round(34 / Math.max(0.2, settings.intensity || 1)));
    const [r,g,b] = parseHex(state.color);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < points.length; i += step) {
      const p = points[i];
      const blink = 0.24 + 0.76 * Math.max(0, Math.sin(performance.now() * 0.006 * (settings.speed || 1) + i * 0.7));
      ctx.globalAlpha = settings.opacity * blink;
      ctx.fillStyle = `rgba(${r},${g},${b},1)`;
      ctx.shadowColor = state.color;
      ctx.shadowBlur = settings.size * 1.2 + (settings.blur || 0);
      ctx.beginPath();
      ctx.arc(p.x, p.y, settings.size * (0.18 + blink * 0.16), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = settings.opacity * blink * 0.85;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x, p.y, settings.size * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLegacyShimmer(ctx, points, settings) {
    drawGlowLine(ctx, points, state.color, settings.size * 0.7, settings.opacity * 0.42, settings.blur + settings.size * 0.35, 'lighter');
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = state.color;
    ctx.shadowColor = state.color;
    ctx.shadowBlur = settings.size * 0.9 + (settings.blur || 0);
    const count = Math.min(90, Math.max(8, Math.floor(points.length / 4)));
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * points.length);
      const p = points[idx] || points[0];
      const shine = Math.max(0, Math.sin(performance.now() * 0.005 * (settings.speed || 1) + i * 1.9));
      if (shine < 0.42) continue;
      const r = settings.size * (0.08 + shine * 0.18);
      ctx.globalAlpha = settings.opacity * shine;
      ctx.beginPath();
      ctx.moveTo(p.x - r, p.y); ctx.lineTo(p.x + r, p.y);
      ctx.moveTo(p.x, p.y - r); ctx.lineTo(p.x, p.y + r);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawLegacyHoverMotes(ctx, points, settings) {
    const pts = simplifyPoints(points, Math.max(2, settings.size * 0.45));
    const palette = [...ICHOR_PALETTE.mist, ...ICHOR_PALETTE.glow, state.color];
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const t = performance.now() * 0.001 * (settings.speed || 1);
    const count = Math.min(260, Math.max(8, Math.round((settings.motes || 80) * 0.8)));
    for (let i = 0; i < count; i++) {
      const base = pts[i % pts.length] || points[0];
      const angle = i * 2.399 + t * (0.65 + settings.fluidity);
      const drift = settings.size * (0.25 + settings.escape) * (0.3 + ((i * 37) % 100) / 100);
      const x = base.x + Math.cos(angle) * drift + Math.sin(t + i) * settings.waveAmp * 0.08;
      const y = base.y + Math.sin(angle) * drift + Math.cos(t * 0.7 + i) * settings.waveAmp * 0.08;
      const color = palette[i % palette.length];
      const [r,g,b] = parseHex(color);
      ctx.fillStyle = `rgba(${r},${g},${b},${0.08 + settings.opacity * 0.28})`;
      ctx.shadowColor = color;
      ctx.shadowBlur = settings.blur + settings.size * 0.28;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, settings.size * (0.018 + ((i * 11) % 9) / 220)), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawLegacyVectors(ctx, points, settings) {
    const pts = simplifyPoints(points, Math.max(2, settings.size * 0.3));
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = state.color;
    ctx.shadowColor = state.color;
    ctx.shadowBlur = settings.blur + settings.size * 0.4;
    ctx.lineCap = 'round';
    const step = Math.max(2, Math.round(16 / Math.max(0.3, settings.intensity || 1)));
    for (let i = 1; i < pts.length; i += step) {
      const p = pts[i];
      const tan = tangentAt(pts, i);
      const len = (settings.vectorLength || 44) * (0.35 + ((i * 17) % 100) / 100) * Math.max(0.2, settings.pressure || 1);
      const side = i % 2 ? 1 : -1;
      const a = tan.angle + side * (0.58 + settings.escape * 0.62);
      ctx.globalAlpha = settings.opacity * (0.25 + settings.intensity * 0.25);
      ctx.lineWidth = Math.max(1, settings.size * 0.08 * (settings.sharpness || 1));
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(a) * len, p.y + Math.sin(a) * len);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawEffectStroke(ctx, points, tool = state.activeTool, preview = false) {
    if (!points || !points.length) return;
    const settings = effectSettings();
    if (preview) settings.opacity *= 0.7;
    ctx.save();
    if (tool === 'motes') {
      const pts = simplifyPoints(points, Math.max(1, settings.size * 0.18));
      pts.forEach((p) => drawMoteSpray(ctx, p, settings, 0.32));
    } else if (tool === 'blink') drawLegacyBlink(ctx, points, settings);
    else if (tool === 'shimmer') drawLegacyShimmer(ctx, points, settings);
    else if (tool === 'hoverMotes') drawLegacyHoverMotes(ctx, points, settings);
    else if (tool === 'vectors') drawLegacyVectors(ctx, points, settings);
    else if (points.length < 2) {
      drawIchorDab(ctx, points[0], settings, tool === 'electric');
    } else {
      const pts = simplifyPoints(points, Math.max(1, settings.size * 0.08));
      for (let i = 1; i < pts.length; i++) {
        if (tool === 'electric') drawElectricBrushSegment(ctx, pts[i - 1], pts[i], settings);
        else drawIchorBrushSegment(ctx, pts[i - 1], pts[i], settings);
      }
    }
    ctx.restore();
  }

  function drawEffectPreview(points, tool = state.activeTool) {
    clearPreview();
    const ctx = els.preview.getContext('2d');
    drawEffectStroke(ctx, points, tool, true);
  }

  function drawMirrorIfNeeded(drawFn) {
    drawFn(false);
    if (state.mirror) drawFn(true);
  }

  function mirrorPoint(point) {
    return { x: state.width - point.x, y: point.y };
  }

  function pointerDown(ev) {
    if (ev.button !== undefined && ev.button !== 0 && ev.pointerType !== 'touch') return;
    ev.preventDefault();
    els.viewport.setPointerCapture?.(ev.pointerId);
    const p = clientToCanvas(ev.clientX, ev.clientY);
    state.pointer = { id: ev.pointerId, start: p, clientStart: { x: ev.clientX, y: ev.clientY }, panStart: { ...state.pan }, moved: false, spacePan: ev.altKey || ev.shiftKey || state.activeTool === 'pan' };
    state.lastPoint = p;
    state.points = [p];
    if (state.pointer.spacePan) { els.viewport.style.cursor = 'grabbing'; return; }
    if (state.activeTool === 'zoomBox') { drawZoomBoxPreview(state.pointer.start, p); return; }

    const layer = getActiveLayer();
    if (!layer) return;
    if (['pencil','ink','paint','marker','crayon','charcoal','spray','graffiti','pixel','eraser','repair'].includes(state.activeTool)) {
      pushHistory(state.activeTool);
      drawMirrorIfNeeded((mirrored) => {
        const point = mirrored ? mirrorPoint(p) : p;
        if (state.activeTool === 'spray' || state.activeTool === 'graffiti') drawSpray(layer.ctx, point, state.activeTool === 'graffiti');
        else drawLine(layer.ctx, point, { x: point.x + 0.1, y: point.y + 0.1 }, state.activeTool);
      });
      renderLayersSoon();
    } else if (['electric','ichor','motes','blink','shimmer','hoverMotes','vectors'].includes(state.activeTool)) {
      pushHistory(`animated ${state.activeTool}`);
      state.currentLiveEffect = { id: uid('fx'), tool: state.activeTool, points: [p], mirror: state.mirror, createdAt: Date.now() };
      renderLiveEffects();
    } else if (state.activeTool === 'fill') {
      pushHistory('fill');
      floodFill(layer.ctx, Math.round(p.x), Math.round(p.y), state.color, Number(inputs.tolerance.value) / 100, false);
      if (state.mirror) floodFill(layer.ctx, Math.round(state.width - p.x), Math.round(p.y), state.color, Number(inputs.tolerance.value) / 100, false);
      renderLayers();
    } else if (state.activeTool === 'eyedropper') {
      pickColorAt(p);
    } else if (state.activeTool === 'text') {
      pushHistory('text object');
      addTextObject(p);
    }
  }

  function pointerMove(ev) {
    updateCursorPosition(ev);
    if (!state.pointer || state.pointer.id !== ev.pointerId) return;
    ev.preventDefault();
    const p = clientToCanvas(ev.clientX, ev.clientY);
    state.pointer.moved = true;
    if (state.pointer.spacePan) {
      state.pan.x = state.pointer.panStart.x + (ev.clientX - state.pointer.clientStart.x);
      state.pan.y = state.pointer.panStart.y + (ev.clientY - state.pointer.clientStart.y);
      applyView();
      return;
    }
    const layer = getActiveLayer();
    if (!layer) return;
    if (['pencil','ink','paint','marker','crayon','charcoal','pixel','eraser','repair'].includes(state.activeTool)) {
      const last = state.lastPoint || p;
      drawMirrorIfNeeded((mirrored) => {
        const from = mirrored ? mirrorPoint(last) : last;
        const to = mirrored ? mirrorPoint(p) : p;
        drawLine(layer.ctx, from, to, state.activeTool);
      });
      state.lastPoint = p;
      renderLayersSoon();
    } else if (state.activeTool === 'spray' || state.activeTool === 'graffiti') {
      drawMirrorIfNeeded((mirrored) => drawSpray(layer.ctx, mirrored ? mirrorPoint(p) : p, state.activeTool === 'graffiti'));
      renderLayersSoon();
    } else if (['electric','ichor','motes','blink','shimmer','hoverMotes','vectors'].includes(state.activeTool)) {
      if (!state.currentLiveEffect) state.currentLiveEffect = { id: uid('fx'), tool: state.activeTool, points: [], mirror: state.mirror, createdAt: Date.now() };
      const lastSaved = state.currentLiveEffect.points[state.currentLiveEffect.points.length - 1];
      if (!lastSaved || Math.hypot(p.x - lastSaved.x, p.y - lastSaved.y) >= Math.max(2, (state.effect.size || state.brush.size || 24) * 0.08)) {
        state.currentLiveEffect.points.push(p);
        if (state.currentLiveEffect.points.length > 2400) state.currentLiveEffect.points.shift();
      }
      state.lastPoint = p;
      renderLiveEffects();
    } else if (state.activeTool === 'shape') {
      drawShapePreview(state.pointer.start, p);
    } else if (state.activeTool === 'zoomBox') {
      drawZoomBoxPreview(state.pointer.start, p);
    }
    state.points.push(p);
  }

  function pointerUp(ev) {
    if (!state.pointer || state.pointer.id !== ev.pointerId) return;
    ev.preventDefault();
    const end = clientToCanvas(ev.clientX, ev.clientY);
    const layer = getActiveLayer();
    if (state.pointer.spacePan) {
      els.viewport.style.cursor = state.activeTool === 'pan' ? 'grab' : 'crosshair';
    } else if (['electric','ichor','motes','blink','shimmer','hoverMotes','vectors'].includes(state.activeTool)) {
      if (state.currentLiveEffect) {
        state.currentLiveEffect.points.push(end);
        state.liveEffects.push(state.currentLiveEffect);
        state.currentLiveEffect = null;
        renderLiveEffects();
      }
      clearPreview();
      status(`${titleCase(state.activeTool)} animated effect added. Sliders update it live.`);
    } else if (state.activeTool === 'zoomBox') {
      clearPreview();
      zoomToBox(state.pointer.start, end);
    } else if (state.activeTool === 'shape' && layer) {
      pushHistory('shape');
      clearPreview();
      if (state.objectMode) { addShapeObjectFromPoints(state.pointer.start, end); }
      else { drawMirrorIfNeeded((mirrored) => drawShape(layer.ctx, mirrored ? mirrorPoint(state.pointer.start) : state.pointer.start, mirrored ? mirrorPoint(end) : end, mirrored)); renderLayers(); }
    }
    state.pointer = null;
    state.lastPoint = null;
    state.points = [];
  }


  function drawZoomBoxPreview(start, end) {
    clearPreview();
    const ctx = els.preview.getContext('2d');
    const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x), h = Math.abs(end.y - start.y);
    ctx.save();
    ctx.strokeStyle = '#00FFFF';
    ctx.fillStyle = 'rgba(0,255,255,0.08)';
    ctx.lineWidth = Math.max(1, 2 / state.zoom);
    ctx.setLineDash([10 / state.zoom, 6 / state.zoom]);
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
    ctx.restore();
  }

  function zoomToBox(start, end) {
    const rect = els.viewport.getBoundingClientRect();
    const x = Math.min(start.x, end.x), y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x), h = Math.abs(end.y - start.y);
    if (w < 8 || h < 8) { fitCanvas(); return; }
    const z = clamp(Math.min((rect.width - 36) / w, (rect.height - 36) / h), 0.05, 8);
    state.zoom = z;
    state.pan.x = (rect.width - w * z) / 2 - x * z;
    state.pan.y = (rect.height - h * z) / 2 - y * z;
    inputs.zoom.value = String(Math.round(state.zoom * 100));
    applyView();
    status(`Zoomed to ${Math.round(w)}×${Math.round(h)} selection.`);
  }

  function clearPreview() {
    els.preview.getContext('2d').clearRect(0, 0, state.width, state.height);
  }

  function drawShapePreview(start, end) {
    const ctx = els.preview.getContext('2d');
    ctx.clearRect(0, 0, state.width, state.height);
    ctx.save();
    ctx.setLineDash([10, 8]);
    drawShape(ctx, start, end, false, true);
    ctx.restore();
  }

  function rotatedRectData(start, end) {
    const x = Math.min(start.x, end.x);
    const y = Math.min(start.y, end.y);
    const w = Math.abs(end.x - start.x);
    const h = Math.abs(end.y - start.y);
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  }

  function drawShape(ctx, start, end, mirrored = false, preview = false) {
    const type = state.shape.type;
    const mode = state.shape.fill;
    const { x, y, w, h, cx, cy } = rotatedRectData(start, end);
    const color = state.color;
    configureCtx(ctx, { opacity: preview ? Math.min(.7, state.brush.opacity) : state.brush.opacity });
    ctx.lineWidth = Math.max(1, state.brush.size * 0.12);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(degToRad(state.shape.rotation * (mirrored ? -1 : 1)));
    ctx.translate(-cx, -cy);
    ctx.beginPath();
    if (type === 'rect') ctx.rect(x, y, w, h);
    else if (type === 'roundrect') roundRectPath(ctx, x, y, w, h, Math.min(w, h) * .12);
    else if (type === 'circle') ellipsePath(ctx, cx, cy, w / 2, h / 2);
    else if (type === 'line') { ctx.moveTo(start.x, start.y); ctx.lineTo(end.x, end.y); }
    else if (type === 'triangle') polygonPath(ctx, [[cx, y], [x + w, y + h], [x, y + h]]);
    else if (type === 'diamond') polygonPath(ctx, [[cx, y], [x + w, cy], [cx, y + h], [x, cy]]);
    else if (type === 'star') starPath(ctx, cx, cy, Math.max(w, h) / 2, Math.max(w, h) / 4, Math.max(3, state.shape.sides || 5));
    else if (type === 'polygon') starPath(ctx, cx, cy, Math.max(w, h) / 2, Math.max(w, h) / 2, Math.max(3, state.shape.sides || 6));
    else if (type === 'cloud') cloudPath(ctx, x, y, w, h);
    else if (type === 'burst') burstPath(ctx, cx, cy, Math.max(w, h) / 2, 14);
    else if (type === 'moon') moonPath(ctx, cx, cy, w / 2, h / 2);
    else if (type === 'plant') plantPath(ctx, x, y, w, h);
    else if (type === 'cube') cubePath(ctx, x, y, w, h);
    if (mode === 'fill' || mode === 'fillStroke') ctx.fill();
    if (mode === 'stroke' || mode === 'fillStroke' || type === 'line' || type === 'cube' || type === 'plant') ctx.stroke();
    ctx.restore();
    if (!preview) maybeAddAnnotation(x, y, w, h);
  }

  function roundRectPath(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
  }
  function ellipsePath(ctx, cx, cy, rx, ry) { ctx.ellipse(cx, cy, Math.abs(rx), Math.abs(ry), 0, 0, Math.PI * 2); }
  function polygonPath(ctx, points) { ctx.moveTo(points[0][0], points[0][1]); for (const p of points.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); }
  function starPath(ctx, cx, cy, outer, inner, points) {
    const step = Math.PI / points;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = -Math.PI / 2 + i * step;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function cloudPath(ctx, x, y, w, h) {
    const bumps = 8;
    ctx.moveTo(x + w * .14, y + h * .58);
    for (let i = 0; i <= bumps; i++) {
      const t = i / bumps;
      const px = x + t * w;
      const py = y + h * (.5 + Math.sin(t * Math.PI * 4) * .12);
      ctx.quadraticCurveTo(px - w / bumps / 2, y + h * (.18 + Math.random() * .12), px, py);
    }
    ctx.quadraticCurveTo(x + w * .9, y + h * .9, x + w * .2, y + h * .82);
    ctx.quadraticCurveTo(x, y + h * .74, x + w * .14, y + h * .58);
  }
  function burstPath(ctx, cx, cy, radius, points) {
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? radius : radius * 0.58;
      const a = -Math.PI / 2 + i * Math.PI / points;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }
  function moonPath(ctx, cx, cy, rx, ry) {
    ctx.moveTo(cx + rx * .45, cy - ry);
    ctx.bezierCurveTo(cx - rx, cy - ry, cx - rx, cy + ry, cx + rx * .45, cy + ry);
    ctx.bezierCurveTo(cx - rx * .25, cy + ry * .35, cx - rx * .25, cy - ry * .35, cx + rx * .45, cy - ry);
  }
  function plantPath(ctx, x, y, w, h) {
    const cx = x + w / 2;
    ctx.moveTo(cx, y + h); ctx.bezierCurveTo(cx - w * .08, y + h * .65, cx + w * .08, y + h * .35, cx, y);
    ctx.moveTo(cx, y + h * .55); ctx.bezierCurveTo(cx - w * .55, y + h * .35, cx - w * .3, y + h * .15, cx, y + h * .42);
    ctx.moveTo(cx, y + h * .45); ctx.bezierCurveTo(cx + w * .55, y + h * .25, cx + w * .32, y + h * .05, cx, y + h * .35);
    ctx.moveTo(cx, y + h * .72); ctx.bezierCurveTo(cx + w * .45, y + h * .62, cx + w * .42, y + h * .42, cx, y + h * .62);
  }
  function cubePath(ctx, x, y, w, h) {
    const d = Math.min(w, h) * .22;
    ctx.rect(x, y + d, w - d, h - d);
    ctx.moveTo(x, y + d); ctx.lineTo(x + d, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w - d, y + d);
    ctx.moveTo(x + w - d, y + h); ctx.lineTo(x + w, y + h - d); ctx.lineTo(x + w, y);
  }

  function maybeAddAnnotation(x, y, w, h) {
    const link = inputs.link.value.trim();
    if (!link || w < 4 || h < 4) return;
    state.annotations.push({ id: uid('hotspot'), x, y, w, h, href: link, label: inputs.text.value || 'Link' });
    renderHotspots();
  }

  function drawText(ctx, point) {
    const text = inputs.text.value || 'Belavadös';
    configureCtx(ctx);
    ctx.font = `${Math.max(12, state.brush.size * 2.4)}px ${inputs.font.value}`;
    ctx.textBaseline = 'top';
    ctx.lineWidth = Math.max(2, state.brush.size * 0.16);
    ctx.strokeStyle = '#001E24';
    ctx.strokeText(text, point.x, point.y);
    ctx.fillStyle = state.color;
    ctx.fillText(text, point.x, point.y);
    const metrics = ctx.measureText(text);
    maybeAddAnnotation(point.x, point.y, metrics.width, state.brush.size * 2.6);
  }

  function pickColorAt(point) {
    const sample = makeCompositeCanvas();
    const ctx = sample.getContext('2d', { willReadFrequently: true });
    const data = ctx.getImageData(Math.round(point.x), Math.round(point.y), 1, 1).data;
    const picked = rgbToHex(data[0], data[1], data[2]);
    state.pickedColor = picked;
    state.transparentColor = picked;
    state.transparentSeed = { x: Math.round(point.x), y: Math.round(point.y) };
    setColor(picked);
    updateTransparencyPreview();
    status(`Picked ${picked}; transparency seed stored at ${state.transparentSeed.x}, ${state.transparentSeed.y}.`);
  }

  function floodFill(ctx, x, y, fillColor, tolerance, erase) {
    if (x < 0 || y < 0 || x >= state.width || y >= state.height) return;
    const img = ctx.getImageData(0, 0, state.width, state.height);
    const data = img.data;
    const idx = (y * state.width + x) * 4;
    const target = [data[idx], data[idx+1], data[idx+2], data[idx+3]];
    const fill = parseHex(fillColor);
    fill[3] = Math.round(state.brush.opacity * 255);
    const gradA = parseHex(state.gradient.a || fillColor);
    const gradB = parseHex(state.gradient.b || fillColor);
    const gradAngle = degToRad(state.gradient.angle || 0);
    const gx = Math.cos(gradAngle);
    const gy = Math.sin(gradAngle);
    const span = Math.max(1, Math.abs(state.width * gx) + Math.abs(state.height * gy));
    const maxDiff = tolerance * 442;
    const stack = [[x, y]];
    const seen = new Uint8Array(state.width * state.height);
    let count = 0;
    while (stack.length && count < state.width * state.height) {
      const [cx, cy] = stack.pop();
      if (cx < 0 || cy < 0 || cx >= state.width || cy >= state.height) continue;
      const pos = cy * state.width + cx;
      if (seen[pos]) continue;
      seen[pos] = 1;
      const i = pos * 4;
      const diff = Math.hypot(data[i] - target[0], data[i+1] - target[1], data[i+2] - target[2], data[i+3] - target[3]);
      if (diff > maxDiff) continue;
      if (erase) data[i+3] = 0;
      else {
        if (state.gradient.enabled) {
          const t = clamp(((cx - state.width / 2) * gx + (cy - state.height / 2) * gy) / span + 0.5, 0, 1);
          data[i] = Math.round(gradA[0] + (gradB[0] - gradA[0]) * t);
          data[i+1] = Math.round(gradA[1] + (gradB[1] - gradA[1]) * t);
          data[i+2] = Math.round(gradA[2] + (gradB[2] - gradA[2]) * t);
          data[i+3] = fill[3];
        } else { data[i] = fill[0]; data[i+1] = fill[1]; data[i+2] = fill[2]; data[i+3] = fill[3]; }
      }
      count++;
      stack.push([cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]);
    }
    ctx.putImageData(img, 0, 0);
    status(erase ? `Removed connected color area (${count} px).` : `Filled connected area (${count} px).`);
  }


  function hydrateRepairSourceCanvas(dataUrl) {
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      const canvas = createCanvas(state.width, state.height);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, state.width, state.height);
      state.repairSourceCanvas = canvas;
    };
    img.src = dataUrl;
  }

  function refreshRepairSource() {
    const composite = makeCompositeCanvas(false);
    state.repairSourceCanvas = composite;
    state.repairSourceDataUrl = composite.toDataURL('image/png');
    status('Repair source refreshed from current visible artwork.');
  }

  function colorDistance(data, i, target) {
    return Math.hypot(data[i] - target[0], data[i+1] - target[1], data[i+2] - target[2], data[i+3] - (target[3] ?? 255));
  }

  function connectedMaskFromLayer(layer, seed, target, maxDiff) {
    const image = layer.ctx.getImageData(0, 0, state.width, state.height);
    const sx = clamp(Math.round(seed?.x ?? 0), 0, state.width - 1);
    const sy = clamp(Math.round(seed?.y ?? 0), 0, state.height - 1);
    const mask = new Uint8Array(state.width * state.height);
    const start = (sy * state.width + sx) * 4;
    if (image.data[start + 3] === 0 || colorDistance(image.data, start, target) > maxDiff) return { mask, image };
    const stack = [sy * state.width + sx];
    mask[sy * state.width + sx] = 1;
    while (stack.length) {
      const idx = stack.pop();
      const x = idx % state.width;
      const y = Math.floor(idx / state.width);
      const neigh = [];
      if (x > 0) neigh.push(idx - 1);
      if (x < state.width - 1) neigh.push(idx + 1);
      if (y > 0) neigh.push(idx - state.width);
      if (y < state.height - 1) neigh.push(idx + state.width);
      for (const ni of neigh) {
        if (mask[ni]) continue;
        const di = ni * 4;
        if (image.data[di + 3] > 0 && colorDistance(image.data, di, target) <= maxDiff) {
          mask[ni] = 1;
          stack.push(ni);
        }
      }
    }
    return { mask, image };
  }

  function updateTransparencyPreview() {
    if (!inputs.previewTransparency?.checked || !state.transparentColor || !state.transparentSeed) return;
    const layer = getActiveLayer();
    if (!layer) return;
    clearPreview();
    const target = parseHex(state.transparentColor);
    const tol = Number(inputs.tolerance?.value || 18) / 100;
    const maxDiff = Math.max(1, 442 * tol);
    const { mask, image } = connectedMaskFromLayer(layer, state.transparentSeed, target, maxDiff);
    const ctx = els.preview.getContext('2d');
    const out = ctx.createImageData(state.width, state.height);
    let hits = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const di = i * 4;
      const dist = colorDistance(image.data, di, target);
      const hit = 1 - dist / maxDiff;
      out.data[di] = 255; out.data[di+1] = 205; out.data[di+2] = 110; out.data[di+3] = Math.round(45 + hit * 145);
      hits++;
    }
    ctx.putImageData(out, 0, 0);
    status(`Previewing ${hits.toLocaleString()} connected pixels for transparency.`);
  }

  function applyConnectedTransparency() {
    const layer = getActiveLayer();
    if (!layer || !state.transparentColor || !state.transparentSeed) { status('Use Pick on the color/area first.'); return; }
    pushHistory('bounded transparency');
    if (!state.repairSourceCanvas) refreshRepairSource();
    const target = parseHex(state.transparentColor);
    const tol = Number(inputs.tolerance?.value || 18) / 100;
    const maxDiff = Math.max(1, 442 * tol);
    const softness = Number(inputs.edgeSoftness?.value || 8);
    const strength = Number(inputs.removeStrength?.value || 100) / 100;
    const { mask, image } = connectedMaskFromLayer(layer, state.transparentSeed, target, maxDiff);
    let changed = 0;
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i]) continue;
      const di = i * 4;
      const edge = clamp(colorDistance(image.data, di, target) / maxDiff, 0, 1);
      const softened = softness > 0 ? Math.pow(edge, 1 + softness / 8) : edge;
      const removal = strength * (1 - softened);
      image.data[di + 3] = Math.round(image.data[di + 3] * (1 - removal));
      changed++;
    }
    layer.ctx.putImageData(image, 0, 0);
    clearPreview();
    renderLayers();
    status(`Bounded transparency applied to ${changed.toLocaleString()} connected pixels.`);
  }

  function trimTransparentEdges() {
    const composite = makeCompositeCanvas(false);
    const image = composite.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, state.width, state.height);
    let minX = state.width, minY = state.height, maxX = -1, maxY = -1;
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        if (image.data[(y * state.width + x) * 4 + 3] > 4) {
          if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) { status('Nothing visible to trim.'); return; }
    pushHistory('trim transparent edges');
    const nw = maxX - minX + 1, nh = maxY - minY + 1;
    for (const layer of state.layers) {
      const old = layer.canvas;
      const replacement = createCanvas(nw, nh, 'art-layer');
      replacement.getContext('2d').drawImage(old, minX, minY, nw, nh, 0, 0, nw, nh);
      old.replaceWith(replacement);
      layer.canvas = replacement;
      layer.ctx = replacement.getContext('2d', { willReadFrequently: true });
    }
    state.objects.forEach((o) => { o.x -= minX; o.y -= minY; });
    state.annotations.forEach((a) => { a.x -= minX; a.y -= minY; });
    state.liveEffects.forEach((fx) => (fx.points || []).forEach((p) => { p.x -= minX; p.y -= minY; }));
    state.width = nw; state.height = nh;
    updateStageSize(); fitCanvas(); renderLayers(); renderObjects(); renderLiveEffects();
    status(`Trimmed empty transparent edges to ${nw}×${nh}.`);
  }

  function newTransparentProject() {
    pushHistory('new transparent canvas');
    state.layers.forEach((l) => l.canvas.remove());
    state.layers = []; state.objects = []; state.annotations = []; state.frames = []; state.liveEffects = []; state.currentLiveEffect = null;
    state.background = { mode: 'transparent', color: '#FFFFFF' };
    addLayer('Sketch Layer'); addLayer('Effects Layer'); state.activeLayerId = state.layers[1].id;
    syncExtraInputsFromState(); updateStageSize(); fitCanvas(); renderLayers(); renderObjects(); renderLiveEffects();
    refreshRepairSource();
    status('New transparent project created.');
  }

  async function loadBrowserProject() {
    const loaded = await restoreFromBrowser();
    status(loaded ? 'Browser save loaded.' : 'No browser save found.');
  }

  function clearBrowserProject() {
    localStorage.removeItem('belavadosEffectStudioProject');
    status('Browser save cleared.');
  }

  function removePickedColor() {
    const layer = getActiveLayer();
    if (!layer) return;
    pushHistory('remove picked color');
    state.beforeTransparentSnapshot = layer.canvas.toDataURL('image/png');
    const tol = Number(inputs.tolerance.value) / 100;
    const [pr, pg, pb] = parseHex(state.pickedColor || state.color);
    const img = layer.ctx.getImageData(0, 0, state.width, state.height);
    const d = img.data;
    const max = 442 * tol;
    let removed = 0;
    for (let i = 0; i < d.length; i += 4) {
      const diff = Math.hypot(d[i] - pr, d[i+1] - pg, d[i+2] - pb);
      if (diff <= max) { d[i+3] = 0; removed++; }
    }
    layer.ctx.putImageData(img, 0, 0);
    renderLayers();
    status(`Removed ${removed.toLocaleString()} pixels near ${state.pickedColor || state.color}.`);
  }

  function applyKernel(kernel, divisor, bias = 0) {
    const layer = getActiveLayer();
    if (!layer) return;
    pushHistory('filter');
    const src = layer.ctx.getImageData(0, 0, state.width, state.height);
    const out = layer.ctx.createImageData(state.width, state.height);
    const side = Math.sqrt(kernel.length);
    const half = Math.floor(side / 2);
    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const dstOff = (y * state.width + x) * 4;
        let r=0,g=0,b=0,a=0;
        for (let ky = 0; ky < side; ky++) {
          for (let kx = 0; kx < side; kx++) {
            const px = clamp(x + kx - half, 0, state.width - 1);
            const py = clamp(y + ky - half, 0, state.height - 1);
            const srcOff = (py * state.width + px) * 4;
            const wt = kernel[ky * side + kx];
            r += src.data[srcOff] * wt; g += src.data[srcOff+1] * wt; b += src.data[srcOff+2] * wt; a += src.data[srcOff+3] * wt;
          }
        }
        out.data[dstOff] = clamp(r / divisor + bias, 0, 255);
        out.data[dstOff+1] = clamp(g / divisor + bias, 0, 255);
        out.data[dstOff+2] = clamp(b / divisor + bias, 0, 255);
        out.data[dstOff+3] = clamp(a / divisor, 0, 255);
      }
    }
    layer.ctx.putImageData(out, 0, 0);
    renderLayers();
  }

  function makeCompositeCanvas(includeBackground = true) {
    const out = createCanvas(state.width, state.height);
    const ctx = out.getContext('2d');
    if (includeBackground) drawCanvasBackground(ctx, state.width, state.height);
    for (const layer of state.layers) {
      if (!layer.visible) continue;
      ctx.save();
      ctx.globalAlpha = layer.opacity;
      ctx.globalCompositeOperation = layer.blend || 'source-over';
      ctx.drawImage(layer.canvas, 0, 0);
      ctx.restore();
    }
    if (els.objectCanvas) ctx.drawImage(els.objectCanvas, 0, 0);
    if (els.liveFx) {
      renderLiveEffects();
      ctx.drawImage(els.liveFx, 0, 0);
    } else {
      drawLiveEffectsToContext(ctx);
    }
    return out;
  }

  async function exportPNG() {
    const canvas = makeCompositeCanvas(true);
    const blob = await canvasToBlob(canvas, 'image/png');
    download(`belavados-effect-studio-${Date.now()}.png`, blob);
  }

  function exportSVG() {
    const png = makeCompositeCanvas(true).toDataURL('image/png');
    const linkObjects = state.objects.filter((o) => o.href).map((o) => ({ x:o.x, y:o.y, w:o.w, h:o.h, href:o.href, label:o.name || o.href }));
    const hotspots = [...state.annotations, ...linkObjects].map((a) => `<a href="${escapeXml(a.href)}" target="_blank"><rect x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" fill="transparent" stroke="#00FFFF" stroke-dasharray="8 6"><title>${escapeXml(a.label || a.href)}</title></rect></a>`).join('\n');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${state.width}" height="${state.height}" viewBox="0 0 ${state.width} ${state.height}">\n<image href="${png}" width="${state.width}" height="${state.height}"/>\n${hotspots}\n</svg>`;
    download(`belavados-effect-studio-${Date.now()}.svg`, svg, 'image/svg+xml');
  }

  function escapeXml(str) {
    return String(str).replace(/[<>&"']/g, (ch) => ({ '<':'&lt;', '>':'&gt;', '&':'&amp;', '"':'&quot;', "'":'&apos;' }[ch]));
  }

  function exportJSON() {
    download(`belavados-effect-studio-project-${Date.now()}.json`, JSON.stringify(serializeProject(), null, 2), 'application/json');
  }

  function exportHTML() {
    const image = makeCompositeCanvas(true).toDataURL('image/png');
    const linkObjects = state.objects.filter((o) => o.href).map((o) => ({ x:o.x, y:o.y, w:o.w, h:o.h, href:o.href, label:o.name || o.href }));
    const links = [...state.annotations, ...linkObjects].map((a) => `<a href="${escapeXml(a.href)}" target="_blank" title="${escapeXml(a.label || a.href)}" style="left:${(a.x/state.width)*100}%;top:${(a.y/state.height)*100}%;width:${(a.w/state.width)*100}%;height:${(a.h/state.height)*100}%"></a>`).join('\n');
    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Belavadös Export</title><style>body{margin:0;background:#000305;display:grid;min-height:100dvh;place-items:center}.art{position:relative;width:min(100vw,${state.width}px)}img{width:100%;display:block}a{position:absolute;border:2px dashed #00ffff;background:rgba(0,255,255,.08)}</style></head><body><main class="art"><img src="${image}" alt="Belavadös Effect Studio export">${links}</main></body></html>`;
    download(`belavados-effect-studio-export-${Date.now()}.html`, html, 'text/html');
  }

  function renderHotspots() {
    els.hotspotLayer.innerHTML = '';
    const rect = els.viewport.getBoundingClientRect();
    for (const a of state.annotations) {
      const link = document.createElement('a');
      link.href = a.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.title = a.label || a.href;
      link.style.left = `${state.pan.x + a.x * state.zoom}px`;
      link.style.top = `${state.pan.y + a.y * state.zoom}px`;
      link.style.width = `${a.w * state.zoom}px`;
      link.style.height = `${a.h * state.zoom}px`;
      els.hotspotLayer.appendChild(link);
    }
  }

  function captureFrame() {
    const dataUrl = makeCompositeCanvas(true).toDataURL('image/png');
    state.frames.push({ id: uid('frame'), dataUrl, delay: Math.round(1000 / Number(inputs.fps.value)), note: `Frame ${state.frames.length + 1}` });
    renderFrames();
    status(`Captured frame ${state.frames.length}.`);
  }

  function renderFrames() {
    els.framesList.innerHTML = '';
    state.frames.forEach((frame, index) => {
      const row = document.createElement('div');
      row.className = 'frame-item';
      const img = document.createElement('img');
      img.className = 'frame-thumb';
      img.src = frame.dataUrl;
      img.alt = '';
      const label = document.createElement('span');
      label.textContent = `${index + 1}. ${frame.note || 'Frame'}`;
      const del = document.createElement('button');
      del.type = 'button';
      del.textContent = 'Delete';
      del.addEventListener('click', () => { state.frames.splice(index, 1); renderFrames(); });
      row.append(img, label, del);
      els.framesList.appendChild(row);
    });
    updateAnimationPreview(state.frames[0]?.dataUrl);
  }

  function updateAnimationPreview(dataUrl) {
    const canvas = els.animationPreview;
    const ctx = canvas.getContext('2d');
    drawPreviewBackground(ctx, canvas.width, canvas.height);
    if (!dataUrl) return;
    const img = new Image();
    img.onload = () => {
      drawPreviewBackground(ctx, canvas.width, canvas.height);
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
    };
    img.src = dataUrl;
  }

  function playAnimation() {
    if (!state.frames.length) { status('Capture frames first.'); return; }
    stopAnimation();
    const frameMs = Math.round(1000 / Number(inputs.fps.value));
    state.animationIndex = 0;
    state.animationTimer = setInterval(() => {
      const frame = state.frames[state.animationIndex % state.frames.length];
      updateAnimationPreview(frame.dataUrl);
      if (inputs.onion.checked && state.frames.length > 1) drawOnionSkin();
      state.animationIndex++;
    }, frameMs);
    status('Animation playing.');
  }

  function stopAnimation() {
    if (state.animationTimer) clearInterval(state.animationTimer);
    state.animationTimer = null;
    status('Animation stopped.');
  }

  function drawOnionSkin() {
    const frame = state.frames[(state.animationIndex - 1 + state.frames.length) % state.frames.length];
    if (!frame) return;
    const ctx = els.preview.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.save(); ctx.globalAlpha = 0.2; ctx.drawImage(img, 0, 0, state.width, state.height); ctx.restore();
      setTimeout(clearPreview, 260);
    };
    img.src = frame.dataUrl;
  }

  function renderLayersSoon() {
    clearTimeout(renderLayersSoon.timer);
    renderLayersSoon.timer = setTimeout(renderLayers, 160);
  }

  function drawColorDisc() {
    const canvas = els.colorDisc;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const image = ctx.createImageData(w, h);
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(cx, cy) - 2;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx*dx + dy*dy);
        const idx = (y*w+x)*4;
        if (dist <= radius) {
          const hue = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
          const sat = dist / radius;
          const [r,g,b] = hslToRgb(hue / 360, sat, 0.5);
          image.data[idx] = r; image.data[idx+1] = g; image.data[idx+2] = b; image.data[idx+3] = 255;
        } else {
          image.data[idx+3] = 0;
        }
      }
    }
    ctx.putImageData(image, 0, 0);
    ctx.beginPath(); ctx.arc(cx, cy, radius - 30, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.36)'; ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
  }

  function hslToRgb(h, s, l) {
    let r, g, b;
    if (s === 0) r = g = b = l;
    else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3); g = hue2rgb(p, q, h); b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
  }

  function pickFromDisc(ev) {
    const rect = els.colorDisc.getBoundingClientRect();
    const x = Math.round((ev.clientX - rect.left) * (els.colorDisc.width / rect.width));
    const y = Math.round((ev.clientY - rect.top) * (els.colorDisc.height / rect.height));
    const data = els.colorDisc.getContext('2d').getImageData(x, y, 1, 1).data;
    if (data[3]) setColor(rgbToHex(data[0], data[1], data[2]));
  }

  function renderSwatches() {
    els.swatches.innerHTML = '';
    for (const color of PALETTE) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.title = color;
      b.style.background = color;
      b.addEventListener('click', () => setColor(color));
      els.swatches.appendChild(b);
    }
  }

  function updateBrushCursor() {
    const c = els.brushCursor;
    const isIchorTool = ['electric','ichor','motes','blink','shimmer','hoverMotes','vectors'].includes(state.activeTool);
    const cursorSize = isIchorTool ? (state.effect.size || state.brush.size) : state.brush.size;
    const diameter = clamp(cursorSize * state.zoom, 6, 280);
    const cursorColor = state.activeTool === 'motes' ? '#E8FFFF' : (isIchorTool ? '#00FFFF' : state.color);
    c.style.width = `${diameter}px`;
    c.style.height = `${diameter}px`;
    c.style.background = colorWithAlpha(cursorColor, state.activeTool === 'eraser' ? 0.05 : (isIchorTool ? 0.16 : 0.24));
    c.style.borderColor = state.activeTool === 'eraser' ? '#FFFFFF' : cursorColor;
    c.classList.toggle('ichor-cursor', isIchorTool);
    c.classList.toggle('mote-cursor', state.activeTool === 'motes');
  }

  function colorWithAlpha(color, alpha) {
    const [r,g,b] = parseHex(color);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function sanitizeLiveEffects(effects) {
    return (effects || []).map((fx) => ({
      id: fx.id || uid('fx'),
      tool: ['electric','ichor','motes'].includes(fx.tool) ? fx.tool : 'ichor',
      mirror: !!fx.mirror,
      createdAt: Number(fx.createdAt) || Date.now(),
      points: (fx.points || []).map((p) => ({ x: Number(p.x) || 0, y: Number(p.y) || 0 })).slice(0, 2400)
    })).filter((fx) => fx.points.length);
  }

  function applyCanvasBackground() {
    if (!els.stage) return;
    const mode = ['transparent','white','color'].includes(state.background?.mode) ? state.background.mode : 'transparent';
    const color = rgbToHex(...parseHex(state.background?.color || '#FFFFFF'));
    state.background = { mode, color };
    els.stage.dataset.backgroundMode = mode;
    els.stage.style.setProperty('--canvas-bg-color', color);
    if (inputs.backgroundMode) inputs.backgroundMode.value = mode;
    if (inputs.backgroundColor) inputs.backgroundColor.value = color;
  }

  function drawCanvasBackground(ctx, width, height) {
    const mode = state.background?.mode || 'transparent';
    if (mode === 'transparent') return;
    ctx.save();
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = mode === 'color' ? (state.background.color || '#FFFFFF') : '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  function drawPreviewBackground(ctx, width, height) {
    ctx.save();
    if ((state.background?.mode || 'transparent') === 'transparent') {
      const tile = 16;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#D8EEEE';
      for (let y = 0; y < height; y += tile) {
        for (let x = 0; x < width; x += tile) {
          if (((x / tile) + (y / tile)) % 2 === 0) ctx.fillRect(x, y, tile, tile);
        }
      }
    } else {
      ctx.fillStyle = state.background.mode === 'color' ? state.background.color : '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  }

  function startLiveFxLoop() {
    if (state.liveFxAnimationFrame) cancelAnimationFrame(state.liveFxAnimationFrame);
    const tick = (now) => {
      renderLiveEffects(now);
      state.liveFxAnimationFrame = requestAnimationFrame(tick);
    };
    state.liveFxAnimationFrame = requestAnimationFrame(tick);
  }

  function drawLiveEffectsToContext(ctx, now = performance.now()) {
    const effects = state.currentLiveEffect ? [...state.liveEffects, state.currentLiveEffect] : state.liveEffects;
    if (!effects.length) return;
    const previousTool = state.activeTool;
    for (const fx of effects) {
      if (!fx.points || !fx.points.length) continue;
      const groups = [fx.points];
      if (fx.mirror) groups.push(fx.points.map((p) => mirrorPoint(p)));
      for (const points of groups) {
        ctx.save();
        const pulse = 0.78 + Math.sin((now / 140) + (fx.createdAt || 0) * 0.001) * 0.22;
        ctx.globalAlpha = clamp(pulse, 0.42, 1);
        drawEffectStroke(ctx, points, fx.tool, false);
        drawTravelingLiveSparks(ctx, points, fx.tool, now);
        ctx.restore();
      }
    }
    state.activeTool = previousTool;
  }

  function drawTravelingLiveSparks(ctx, points, tool, now = performance.now()) {
    if (!points || points.length < 2) return;
    const settings = effectSettings();
    const sparkCount = tool === 'motes' || tool === 'hoverMotes' ? 3 : Math.max(2, Math.min(9, Math.round(settings.forks * 6 + settings.escape * 4 + 2)));
    for (let i = 0; i < sparkCount; i++) {
      const t = ((now * (0.00018 + settings.pressure * 0.00012)) + i / sparkCount) % 1;
      const idx = Math.max(0, Math.min(points.length - 1, Math.floor(t * (points.length - 1))));
      const p = points[idx];
      if (!p) continue;
      const tangent = tangentAt(points, idx);
      const drift = Math.sin(now * 0.006 + i * 1.7) * settings.size * (0.08 + settings.escape * 0.18);
      const livePoint = { x: p.x - tangent.y * drift, y: p.y + tangent.x * drift };
      if (tool === 'motes' || tool === 'hoverMotes') drawMoteSpray(ctx, livePoint, { ...settings, size: settings.size * 0.62, motes: Math.max(8, settings.motes * 0.055), opacity: settings.opacity * 0.72 }, 0.18);
      else drawIchorDab(ctx, livePoint, { ...settings, size: settings.size * 0.34, motes: Math.max(4, settings.motes * 0.035), opacity: settings.opacity * 0.5 }, tool === 'electric');
    }
  }

  function renderLiveEffects(now = performance.now()) {
    if (!els.liveFx) return;
    const ctx = els.liveFx.getContext('2d');
    ctx.clearRect(0, 0, state.width, state.height);
    drawLiveEffectsToContext(ctx, now);
  }

  function clearLiveEffects() {
    pushHistory('clear animated effects');
    state.liveEffects = [];
    state.currentLiveEffect = null;
    renderLiveEffects();
    status('Animated effect layer cleared.');
  }

  function updateCursorPosition(ev) {
    els.brushCursor.classList.add('visible');
    els.brushCursor.style.left = `${ev.clientX}px`;
    els.brushCursor.style.top = `${ev.clientY}px`;
  }

  async function saveToBrowser() {
    try {
      localStorage.setItem('belavadosEffectStudioProject', JSON.stringify(serializeProject()));
      status('Saved to this browser.');
    } catch (err) {
      console.error(err);
      status('Browser save ran out of space; export JSON instead.');
    }
  }

  async function restoreFromBrowser() {
    const raw = localStorage.getItem('belavadosEffectStudioProject');
    if (!raw) return false;
    try { await loadProject(JSON.parse(raw)); return true; }
    catch (err) { console.warn('Stored project could not load:', err); return false; }
  }

  async function syncBackend() {
    const project = serializeProject();
    const payload = { action: 'saveEffectStudioProject', source: 'Belavados Effect Studio', project };
    status('Syncing to backend…');
    try {
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
        redirect: 'follow'
      });
      const text = await response.text().catch(() => '');
      if (!response.ok) throw new Error(text || `HTTP ${response.status}`);
      status('Backend sync request completed.');
    } catch (err) {
      console.warn('Backend sync failed:', err);
      status('Backend sync failed; project saved locally and JSON export is available.');
      await saveToBrowser();
    }
  }

  function attachEvents() {
    els.toggleTools.addEventListener('click', () => {
      const collapsed = els.toolDrawer.classList.toggle('collapsed');
      els.toggleTools.setAttribute('aria-expanded', String(!collapsed));
    });
    document.querySelectorAll('[data-tool]').forEach((btn) => btn.addEventListener('click', () => setTool(btn.dataset.tool)));
    for (const input of [inputs.size, inputs.opacity, inputs.softness, inputs.smooth, inputs.blend, inputs.shapeType, inputs.shapeFill, inputs.rotation, inputs.zoom, inputs.fps, inputs.tolerance, inputs.sprayPalette, inputs.sprayDensity, inputs.dripChance, inputs.gradientToggle, inputs.gradientA, inputs.gradientB, inputs.gradientAngle, inputs.textSize, inputs.letterSpacing, inputs.lineSpacing, inputs.bend, inputs.strokeColor, inputs.strokeWidth, inputs.highlightColor, inputs.shadowBlur, inputs.textAlign, inputs.objectMode, inputs.objectX, inputs.objectY, inputs.objectW, inputs.objectH, inputs.objectOpacity, inputs.effectPreset, inputs.effectSize, inputs.effectIntensity, inputs.effectForks, inputs.effectEscape, inputs.effectFluidity, inputs.effectPressure, inputs.effectLighting, inputs.effectMotes, inputs.effectSpeed, inputs.effectBlur, inputs.effectSharpness, inputs.effectWaveAmp, inputs.effectVectorLength, inputs.shapeSides, inputs.edgeSoftness, inputs.removeStrength, inputs.previewTransparency, inputs.backgroundMode, inputs.backgroundColor].filter(Boolean)) {
      input.addEventListener('input', () => { updateOutputLabels(); if (input === inputs.zoom) applyView(); });
      input.addEventListener('change', () => { updateOutputLabels(); if (input === inputs.zoom) applyView(); });
    }
    inputs.layerOpacity.addEventListener('input', () => {
      const layer = getActiveLayer();
      if (!layer) return;
      layer.opacity = Number(inputs.layerOpacity.value) / 100;
      $('layerOpacityOut').textContent = inputs.layerOpacity.value;
      renderLayers();
    });
    els.colorInput.addEventListener('input', () => setColor(els.colorInput.value));
    els.hexInput.addEventListener('change', () => setColor(els.hexInput.value));
    els.colorDisc.addEventListener('pointerdown', pickFromDisc);
    els.colorDisc.addEventListener('pointermove', (ev) => { if (ev.buttons) pickFromDisc(ev); });
    els.viewport.addEventListener('pointerdown', pointerDown);
    els.viewport.addEventListener('pointermove', pointerMove);
    els.viewport.addEventListener('pointerup', pointerUp);
    els.viewport.addEventListener('pointercancel', pointerUp);
    els.viewport.addEventListener('pointerleave', () => els.brushCursor.classList.remove('visible'));
    els.viewport.addEventListener('wheel', (ev) => {
      ev.preventDefault();
      const oldZoom = state.zoom;
      const factor = ev.deltaY < 0 ? 1.08 : 0.92;
      state.zoom = clamp(state.zoom * factor, 0.1, 8);
      const rect = els.viewport.getBoundingClientRect();
      const cx = ev.clientX - rect.left;
      const cy = ev.clientY - rect.top;
      state.pan.x = cx - ((cx - state.pan.x) / oldZoom) * state.zoom;
      state.pan.y = cy - ((cy - state.pan.y) / oldZoom) * state.zoom;
      inputs.zoom.value = String(Math.round(state.zoom * 100));
      applyView();
    }, { passive: false });

    $('undoBtn').addEventListener('click', undo); $('quickUndo').addEventListener('click', undo);
    $('redoBtn').addEventListener('click', redo); $('quickRedo').addEventListener('click', redo);
    $('clearBtn').addEventListener('click', () => { const l = getActiveLayer(); if (l) { pushHistory('clear layer'); l.ctx.clearRect(0,0,state.width,state.height); renderLayers(); } });
    $('newTransparentBtn')?.addEventListener('click', newTransparentProject);
    $('loadBrowserBtn')?.addEventListener('click', loadBrowserProject);
    $('clearBrowserBtn')?.addEventListener('click', clearBrowserProject);
    $('fitBtn').addEventListener('click', fitCanvas);
    $('zoomOutBtn').addEventListener('click', () => { state.zoom = clamp(state.zoom * .85, .1, 8); applyView(); });
    $('zoomInBtn').addEventListener('click', () => { state.zoom = clamp(state.zoom * 1.15, .1, 8); applyView(); });
    $('resetViewBtn').addEventListener('click', () => { state.pan = { x: 80, y: 80 }; state.zoom = 1; applyView(); });
    $('toggleGridBtn').addEventListener('click', () => { state.grid = !state.grid; els.grid.classList.toggle('hidden', !state.grid); $('toggleGridBtn').setAttribute('aria-pressed', String(state.grid)); });
    $('toggleMirrorBtn').addEventListener('click', () => { state.mirror = !state.mirror; $('toggleMirrorBtn').setAttribute('aria-pressed', String(state.mirror)); status(`Mirror ${state.mirror ? 'on' : 'off'}.`); });
    $('applyCurrentColorBgBtn')?.addEventListener('click', () => { state.background.mode = 'color'; state.background.color = state.color; syncExtraInputsFromState(); applyCanvasBackground(); renderLiveEffects(); status(`Background set to ${state.color}.`); });
    $('resizeCanvasBtn').addEventListener('click', () => {
      const [w,h] = inputs.canvasPreset.value.split('x').map(Number);
      pushHistory('resize canvas');
      state.width = w; state.height = h; updateStageSize(); fitCanvas(); renderLayers();
    });

    $('addLayerBtn').addEventListener('click', () => { pushHistory('add layer'); addLayer(); });
    $('duplicateLayerBtn').addEventListener('click', () => {
      const l = getActiveLayer(); if (!l) return; pushHistory('duplicate layer'); const nl = addLayer(`${l.name} copy`); nl.ctx.drawImage(l.canvas, 0, 0); renderLayers();
    });
    $('deleteLayerBtn').addEventListener('click', () => removeLayer(state.activeLayerId));
    $('layerUpBtn').addEventListener('click', () => moveLayer(1));
    $('layerDownBtn').addEventListener('click', () => moveLayer(-1));
    $('mergeDownBtn').addEventListener('click', mergeDown);

    $('captureFrameBtn').addEventListener('click', captureFrame);
    $('playAnimBtn').addEventListener('click', playAnimation);
    $('stopAnimBtn').addEventListener('click', stopAnimation);
    $('removeColorBtn').addEventListener('click', removePickedColor);
    $('applyConnectedTransparencyBtn')?.addEventListener('click', applyConnectedTransparency);
    $('trimTransparentBtn')?.addEventListener('click', trimTransparentEdges);
    $('refreshRepairSourceBtn')?.addEventListener('click', refreshRepairSource);
    $('loadBrowserProjectBtn')?.addEventListener('click', loadBrowserProject);
    $('clearBrowserProjectBtn')?.addEventListener('click', clearBrowserProject);
    inputs.previewTransparency?.addEventListener('change', () => { clearPreview(); updateTransparencyPreview(); });
    $('softenBtn').addEventListener('click', () => applyKernel([1,1,1,1,1,1,1,1,1], 9));
    $('sharpenBtn').addEventListener('click', () => applyKernel([0,-1,0,-1,5,-1,0,-1,0], 1));
    $('exportPngBtn').addEventListener('click', exportPNG);
    $('exportSvgBtn').addEventListener('click', exportSVG);
    $('exportJsonBtn').addEventListener('click', exportJSON);
    $('exportHtmlBtn').addEventListener('click', exportHTML);
    $('saveBrowserBtn').addEventListener('click', saveToBrowser);
    $('backendSaveBtn').addEventListener('click', syncBackend);
    $('showShortcutsBtn').addEventListener('click', () => els.shortcutsDialog.showModal());
    inputs.imageImport.addEventListener('change', importImage);
    inputs.projectImport.addEventListener('change', importProjectFile);
    window.addEventListener('resize', () => { applyView(); renderHotspots(); renderObjects(); });
    document.addEventListener('keydown', keydown);
    window.addEventListener('beforeinstallprompt', (ev) => {
      ev.preventDefault();
      state.deferredInstallPrompt = ev;
      const btn = $('installBtn');
      btn.hidden = false;
      btn.addEventListener('click', async () => {
        if (!state.deferredInstallPrompt) return;
        state.deferredInstallPrompt.prompt();
        await state.deferredInstallPrompt.userChoice;
        state.deferredInstallPrompt = null;
        btn.hidden = true;
      }, { once: true });
    });
  }

  function moveLayer(dir) {
    const idx = state.layers.findIndex((l) => l.id === state.activeLayerId);
    const next = idx + dir;
    if (idx < 0 || next < 0 || next >= state.layers.length) return;
    pushHistory('move layer');
    [state.layers[idx], state.layers[next]] = [state.layers[next], state.layers[idx]];
    reorderLayers();
  }

  function mergeDown() {
    const idx = state.layers.findIndex((l) => l.id === state.activeLayerId);
    if (idx <= 0) { status('No lower layer to merge into.'); return; }
    pushHistory('merge layer down');
    const top = state.layers[idx];
    const below = state.layers[idx - 1];
    below.ctx.save();
    below.ctx.globalAlpha = top.opacity;
    below.ctx.globalCompositeOperation = top.blend || 'source-over';
    below.ctx.drawImage(top.canvas, 0, 0);
    below.ctx.restore();
    top.canvas.remove();
    state.layers.splice(idx, 1);
    state.activeLayerId = below.id;
    renderLayers();
  }


  function parseColorList(value) {
    const found = String(value || '').match(/#[0-9a-fA-F]{3,8}/g) || [];
    return found.map((c) => rgbToHex(...parseHex(c))).slice(0, 12);
  }

  function syncExtraInputsFromState() {
    if (inputs.sprayPalette) inputs.sprayPalette.value = state.spray.colors.join(', ');
    if (inputs.sprayDensity) inputs.sprayDensity.value = Math.round(state.spray.density * 100);
    if (inputs.dripChance) inputs.dripChance.value = Math.round(state.spray.drip * 100);
    if (inputs.gradientToggle) inputs.gradientToggle.checked = !!state.gradient.enabled;
    if (inputs.gradientA) inputs.gradientA.value = state.gradient.a;
    if (inputs.gradientB) inputs.gradientB.value = state.gradient.b;
    if (inputs.gradientAngle) inputs.gradientAngle.value = state.gradient.angle;
    if (inputs.textSize) inputs.textSize.value = state.textStyle.size;
    if (inputs.letterSpacing) inputs.letterSpacing.value = state.textStyle.letterSpacing;
    if (inputs.lineSpacing) inputs.lineSpacing.value = Math.round(state.textStyle.lineSpacing * 100);
    if (inputs.bend) inputs.bend.value = Math.round(state.textStyle.bend * 100);
    if (inputs.strokeColor) inputs.strokeColor.value = state.textStyle.stroke;
    if (inputs.strokeWidth) inputs.strokeWidth.value = state.textStyle.strokeWidth;
    if (inputs.highlightColor) inputs.highlightColor.value = state.textStyle.highlight;
    if (inputs.shadowBlur) inputs.shadowBlur.value = state.textStyle.shadowBlur;
    if (inputs.textAlign) inputs.textAlign.value = state.textStyle.align;
    if (inputs.objectMode) inputs.objectMode.checked = !!state.objectMode;
    if (inputs.effectPreset) inputs.effectPreset.value = state.effect.preset || 'balanced';
    if (inputs.effectSize) inputs.effectSize.value = Math.round(state.effect.size || 28);
    if (inputs.effectIntensity) inputs.effectIntensity.value = Math.round((state.effect.intensity || 1) * 100);
    if (inputs.effectForks) inputs.effectForks.value = Math.round((state.effect.forks || 0) * 100);
    if (inputs.effectEscape) inputs.effectEscape.value = Math.round((state.effect.escape || 0) * 100);
    if (inputs.effectFluidity) inputs.effectFluidity.value = Math.round((state.effect.fluidity || 0) * 100);
    if (inputs.effectPressure) inputs.effectPressure.value = Math.round((state.effect.pressure || 0) * 100);
    if (inputs.effectLighting) inputs.effectLighting.value = Math.round((state.effect.lighting || 0) * 100);
    if (inputs.effectMotes) inputs.effectMotes.value = Math.round(state.effect.motes || 0);
    if (inputs.effectSpeed) inputs.effectSpeed.value = Math.round((state.effect.speed || 1) * 100);
    if (inputs.effectBlur) inputs.effectBlur.value = Math.round(state.effect.blur || 0);
    if (inputs.effectSharpness) inputs.effectSharpness.value = Math.round((state.effect.sharpness || 1) * 100);
    if (inputs.effectWaveAmp) inputs.effectWaveAmp.value = Math.round(state.effect.waveAmp || 0);
    if (inputs.effectVectorLength) inputs.effectVectorLength.value = Math.round(state.effect.vectorLength || 0);
    if (inputs.shapeSides) inputs.shapeSides.value = Math.round(state.shape.sides || 6);
    if (inputs.backgroundMode) inputs.backgroundMode.value = state.background?.mode || 'transparent';
    if (inputs.backgroundColor) inputs.backgroundColor.value = state.background?.color || '#FFFFFF';
  }


  function applyEffectPreset(name = state.effect.preset || 'balanced') {
    const presets = {
      balanced: { size: 28, intensity: 1, forks: 0.62, escape: 0.48, fluidity: 0.74, pressure: 0.72, lighting: 1.25, motes: 90, speed: 1, blur: 4, sharpness: 1, waveAmp: 28, vectorLength: 44 },
      'weapon-shotgun': { size: 42, intensity: 1.42, forks: 0.86, escape: 0.92, fluidity: 1.02, pressure: 1.12, lighting: 1.82, motes: 145, speed: 1.18, blur: 12, sharpness: 1.12, waveAmp: 42, vectorLength: 62 },
      'harbor-puffer': { size: 18, intensity: 0.72, forks: 0.28, escape: 0.2, fluidity: 0.38, pressure: 0.42, lighting: 0.92, motes: 42, speed: .75, blur: 4, sharpness: .8, waveAmp: 16, vectorLength: 24 },
      'storm-climb': { size: 58, intensity: 1.88, forks: 1, escape: 1.18, fluidity: 1.25, pressure: 1.28, lighting: 2.22, motes: 260, speed: 1.4, blur: 26, sharpness: 1.18, waveAmp: 72, vectorLength: 98 },
      'thin-arc': { size: 12, intensity: 1.18, forks: 1, escape: 0.72, fluidity: 0.34, pressure: 0.72, lighting: 1.58, motes: 20, speed: 1.35, blur: 5, sharpness: 1.7, waveAmp: 18, vectorLength: 50 },
      'mote-bloom': { size: 36, intensity: 1.08, forks: 0.24, escape: 0.98, fluidity: 1.3, pressure: 0.62, lighting: 1.94, motes: 340, speed: .9, blur: 18, sharpness: .82, waveAmp: 54, vectorLength: 38 },
    };
    if (LEGACY_ICHOR_PRESETS[name]) {
      const p = LEGACY_ICHOR_PRESETS[name];
      presets[name] = {
        size: Math.round(18 + (p.pressure || 1) * 14),
        intensity: p.power || 1,
        forks: clamp((p.escape || 1) / 1.55, 0, 1.25),
        escape: clamp((p.escape || 1) / 1.35, 0, 1.4),
        fluidity: clamp((p.fluidity || 1) / 1.55, 0, 1.6),
        pressure: clamp((p.pressure || 1) / 1.45, 0, 1.8),
        lighting: clamp(p.lighting || 1, 0, 3),
        motes: Math.round(p.dust || 80),
        speed: clamp(p.velocity || 1, 0.15, 3),
        blur: Math.round(4 + (p.lighting || 1) * 7),
        sharpness: clamp((p.pressure || 1), 0.25, 3),
        waveAmp: Math.round(18 + (p.escape || 1) * 22),
        vectorLength: Math.round(24 + (p.thrust || 1) * 38),
        legacyNote: p.note || p.name
      };
    }
    state.effect = { ...state.effect, ...(presets[name] || presets.balanced), preset: name };
    syncExtraInputsFromState();
    updateOutputLabels();
    status(`Effect preset applied: ${name.replace(/-/g, ' ')}${state.effect.legacyNote ? ' · ' + state.effect.legacyNote : ''}`);
  }

  function resetPalettePosition() {
    if (!els.toolDrawer) return;
    els.toolDrawer.classList.remove('is-floating');
    els.toolDrawer.style.left = '';
    els.toolDrawer.style.top = '';
    els.toolDrawer.style.right = '';
    els.toolDrawer.style.bottom = '';
    els.toolDrawer.style.width = '';
    els.toolDrawer.style.height = '';
  }

  function setupMovablePalette() {
    const drawer = els.toolDrawer;
    if (!drawer) return;
    const handles = [document.getElementById('paletteDragHandle'), ...drawer.querySelectorAll('.tool-panel > h2, .always-panel > h2')].filter(Boolean);
    const reset = document.getElementById('paletteResetBtn');
    reset?.addEventListener('click', resetPalettePosition);
    const startDrag = (ev) => {
      if (ev.target.closest('button,input,select,textarea,a,label')) return;
      ev.preventDefault();
      const rect = drawer.getBoundingClientRect();
      drawer.classList.add('is-floating');
      drawer.classList.remove('collapsed');
      els.toggleTools?.setAttribute('aria-expanded', 'true');
      drawer.style.width = `${Math.min(rect.width, window.innerWidth - 16)}px`;
      drawer.style.height = `${Math.min(rect.height, window.innerHeight - 16)}px`;
      drawer.style.left = `${rect.left}px`;
      drawer.style.top = `${rect.top}px`;
      drawer.style.right = 'auto';
      drawer.style.bottom = 'auto';
      const start = { x: ev.clientX, y: ev.clientY, left: rect.left, top: rect.top };
      const move = (mev) => {
        const w = drawer.offsetWidth || rect.width;
        const h = drawer.offsetHeight || rect.height;
        const left = clamp(start.left + (mev.clientX - start.x), 4, Math.max(4, window.innerWidth - w - 4));
        const top = clamp(start.top + (mev.clientY - start.y), 4, Math.max(4, window.innerHeight - h - 4));
        drawer.style.left = `${left}px`;
        drawer.style.top = `${top}px`;
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up, { once: true });
    };
    handles.forEach((handle) => handle.addEventListener('pointerdown', startDrag));
  }

  function setupSimplePanels() {
    const showPanel = (id) => {
      document.querySelectorAll('.tool-panel').forEach((p) => p.classList.toggle('active-panel', p.id === id));
      document.querySelectorAll('[data-panel]').forEach((b) => b.classList.toggle('active', b.dataset.panel === id));
      if (window.matchMedia('(max-width: 979px)').matches) {
        els.toolDrawer.classList.remove('collapsed');
        els.toggleTools?.setAttribute('aria-expanded', 'true');
      }
    };
    document.querySelectorAll('[data-panel]').forEach((btn) => btn.addEventListener('click', () => showPanel(btn.dataset.panel)));
  }

  function currentGradient(ctx, x, y, w, h) {
    if (!state.gradient.enabled) return state.color;
    const angle = degToRad(state.gradient.angle);
    const cx = x + w / 2, cy = y + h / 2;
    const len = Math.max(w, h) || 1;
    const x1 = cx - Math.cos(angle) * len / 2;
    const y1 = cy - Math.sin(angle) * len / 2;
    const x2 = cx + Math.cos(angle) * len / 2;
    const y2 = cy + Math.sin(angle) * len / 2;
    const g = ctx.createLinearGradient(x1, y1, x2, y2);
    g.addColorStop(0, state.gradient.a || state.color);
    g.addColorStop(1, state.gradient.b || state.color);
    return g;
  }

  function createObject(base) {
    const obj = {
      id: uid('obj'), type: 'shape', name: 'Object', x: 120, y: 120, w: 420, h: 220, rotation: 0,
      opacity: 1, flipX: false, flipY: false, blend: 'source-over', href: inputs.link?.value?.trim() || '',
      ...base
    };
    state.objects.push(obj);
    state.activeObjectId = obj.id;
    renderObjects();
    renderLayers();
    setObjectInputs(obj);
    status(`${obj.name || obj.type} added.`);
    return obj;
  }

  function getActiveObject() { return state.objects.find((o) => o.id === state.activeObjectId) || null; }

  function addTextObject(point = null) {
    const p = point || { x: Math.max(40, (state.width - 520) / 2), y: Math.max(40, state.height * .18) };
    createObject({
      type: 'text', name: 'Text overlay', x: p.x, y: p.y, w: Math.min(680, state.width - p.x), h: Math.max(90, state.textStyle.size * 1.45),
      text: inputs.text?.value || 'Belavadös', color: state.color, font: inputs.font?.value || 'Impact, fantasy', style: { ...state.textStyle }, gradient: { ...state.gradient }
    });
  }

  function addShapeObjectFromPoints(start, end) {
    const r = rotatedRectData(start, end);
    if (r.w < 8 || r.h < 8) { r.w = 320; r.h = 180; }
    createObject({ type: 'shape', name: `${titleCase(state.shape.type)} object`, x: r.x, y: r.y, w: r.w, h: r.h, shapeType: state.shape.type, shapeFill: state.shape.fill, sides: state.shape.sides || 6, color: state.color, stroke: state.textStyle.stroke, strokeWidth: Math.max(2, state.brush.size * 0.12), gradient: { ...state.gradient } });
  }

  function addShapeObject() {
    createObject({ type: 'shape', name: `${titleCase(state.shape.type)} object`, x: Math.max(40, state.width * .18), y: Math.max(40, state.height * .18), w: Math.min(520, state.width * .5), h: Math.min(320, state.height * .35), shapeType: state.shape.type, shapeFill: state.shape.fill, sides: state.shape.sides || 6, color: state.color, stroke: state.textStyle.stroke, strokeWidth: Math.max(2, state.brush.size * 0.12), gradient: { ...state.gradient } });
  }

  function addImageObject(src, label = 'Image overlay') {
    createObject({ type: 'image', name: label, x: Math.max(40, state.width * .18), y: Math.max(40, state.height * .18), w: Math.min(520, state.width * .5), h: Math.min(420, state.height * .45), src, preserveAspect: true });
  }

  function updateSelectedObjectFromInputs(render = true) {
    const obj = getActiveObject();
    if (!obj || !inputs.objectX) return;
    obj.x = Number(inputs.objectX.value);
    obj.y = Number(inputs.objectY.value);
    obj.w = Number(inputs.objectW.value);
    obj.h = Number(inputs.objectH.value);
    obj.rotation = Number(inputs.rotation.value || 0);
    obj.opacity = Number(inputs.objectOpacity?.value || 100) / 100;
    if (obj.type === 'text') {
      obj.text = inputs.text?.value || obj.text;
      obj.color = state.color;
      obj.font = inputs.font?.value || obj.font;
      obj.style = { ...state.textStyle };
      obj.gradient = { ...state.gradient };
    } else if (obj.type === 'shape') {
      obj.shapeType = inputs.shapeType?.value || obj.shapeType;
      obj.shapeFill = inputs.shapeFill?.value || obj.shapeFill;
      obj.sides = Number(inputs.shapeSides?.value || obj.sides || state.shape.sides || 6);
      obj.color = state.color;
      obj.stroke = state.textStyle.stroke;
      obj.strokeWidth = Math.max(1, state.textStyle.strokeWidth || obj.strokeWidth || 3);
      obj.gradient = { ...state.gradient };
    }
    obj.href = inputs.link?.value?.trim() || obj.href || '';
    if (render) renderObjects();
  }

  function setObjectInputs(obj) {
    if (!obj || !inputs.objectX) return;
    const rangeSet = (input, value) => { if (!input) return; input.max = String(Math.max(Number(input.max) || 3000, Math.ceil(value + 500), state.width + 1200, state.height + 1200)); input.value = String(Math.round(value)); };
    rangeSet(inputs.objectX, obj.x); rangeSet(inputs.objectY, obj.y); rangeSet(inputs.objectW, obj.w); rangeSet(inputs.objectH, obj.h);
    if (inputs.objectOpacity) inputs.objectOpacity.value = Math.round((obj.opacity ?? 1) * 100);
    inputs.rotation.value = Math.round(obj.rotation || 0);
    if (obj.type === 'text') {
      if (inputs.text) inputs.text.value = obj.text || '';
      if (inputs.font && obj.font) inputs.font.value = obj.font;
    }
    if (obj.type === 'shape') {
      if (inputs.shapeType && obj.shapeType) inputs.shapeType.value = obj.shapeType;
      if (inputs.shapeFill && obj.shapeFill) inputs.shapeFill.value = obj.shapeFill;
      if (inputs.shapeSides) inputs.shapeSides.value = Math.round(obj.sides || state.shape.sides || 6);
    }
    $('objectXOut').textContent = String(Math.round(obj.x)); $('objectYOut').textContent = String(Math.round(obj.y));
    $('objectWOut').textContent = String(Math.round(obj.w)); $('objectHOut').textContent = String(Math.round(obj.h));
    if ($('objectOpacityOut')) $('objectOpacityOut').textContent = String(Math.round((obj.opacity ?? 1) * 100));
    $('rotationOut').textContent = String(Math.round(obj.rotation || 0));
  }

  function renderObjects() {
    if (!els.objectLayer || !els.objectCanvas) return;
    els.objectLayer.innerHTML = '';
    for (const obj of state.objects) {
      const box = document.createElement(obj.href ? 'a' : 'button');
      box.className = `object-box${obj.id === state.activeObjectId ? ' active' : ''}`;
      box.dataset.objectId = obj.id;
      if (obj.href) { box.href = obj.href; box.target = '_blank'; box.rel = 'noopener noreferrer'; box.title = obj.name || obj.href; }
      else { box.type = 'button'; box.title = obj.name || obj.type; }
      box.style.left = `${obj.x}px`; box.style.top = `${obj.y}px`; box.style.width = `${obj.w}px`; box.style.height = `${obj.h}px`;
      box.style.transform = `rotate(${obj.rotation || 0}deg) scale(${obj.flipX ? -1 : 1}, ${obj.flipY ? -1 : 1})`;
      box.addEventListener('pointerdown', objectPointerDown);
      box.addEventListener('click', (ev) => { ev.preventDefault(); selectObject(obj.id); });
      els.objectLayer.appendChild(box);
    }
    renderObjectCanvas();
    renderObjectList();
  }

  function selectObject(id) {
    state.activeObjectId = id;
    const obj = getActiveObject();
    if (obj) { setObjectInputs(obj); status(`Selected ${obj.name || obj.type}.`); }
    renderObjects();
  }

  function objectPointerDown(ev) {
    const id = ev.currentTarget.dataset.objectId;
    selectObject(id);
    const obj = getActiveObject();
    if (!obj) return;
    ev.preventDefault(); ev.stopPropagation();
    ev.currentTarget.setPointerCapture?.(ev.pointerId);
    const start = { x: ev.clientX, y: ev.clientY, ox: obj.x, oy: obj.y };
    const move = (mev) => {
      const dx = (mev.clientX - start.x) / state.zoom;
      const dy = (mev.clientY - start.y) / state.zoom;
      obj.x = start.ox + dx; obj.y = start.oy + dy;
      setObjectInputs(obj); renderObjects();
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); pushHistory('move object'); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
  }

  function renderObjectList() {
    if (!els.objectList) return;
    els.objectList.innerHTML = '';
    for (let i = state.objects.length - 1; i >= 0; i--) {
      const obj = state.objects[i];
      const row = document.createElement('div'); row.className = `layer-item object-row${obj.id === state.activeObjectId ? ' active' : ''}`;
      const thumb = document.createElement('div'); thumb.className = 'layer-thumb object-thumb'; thumb.textContent = obj.type === 'text' ? 'T' : obj.type === 'image' ? '★' : '◇';
      const name = document.createElement('span'); name.textContent = obj.name || obj.type;
      const actions = document.createElement('div'); actions.className = 'button-row';
      const use = document.createElement('button'); use.type = 'button'; use.textContent = 'Use'; use.addEventListener('click', () => selectObject(obj.id));
      const del = document.createElement('button'); del.type = 'button'; del.textContent = 'Del'; del.addEventListener('click', () => deleteObject(obj.id));
      actions.append(use, del); row.append(thumb, name, actions); els.objectList.appendChild(row);
    }
  }

  function renderObjectCanvas() {
    if (!els.objectCanvas) return;
    const ctx = els.objectCanvas.getContext('2d');
    ctx.clearRect(0, 0, state.width, state.height);
    for (const obj of state.objects) drawObjectToCanvas(ctx, obj);
    renderHotspots();
  }

  function drawObjectToCanvas(ctx, obj) {
    ctx.save();
    ctx.globalAlpha = obj.opacity ?? 1;
    ctx.globalCompositeOperation = obj.blend || 'source-over';
    ctx.translate(obj.x + obj.w / 2, obj.y + obj.h / 2);
    ctx.rotate(degToRad(obj.rotation || 0));
    ctx.scale(obj.flipX ? -1 : 1, obj.flipY ? -1 : 1);
    ctx.translate(-obj.w / 2, -obj.h / 2);
    if (obj.type === 'image' && obj.src) drawImageObject(ctx, obj);
    else if (obj.type === 'text') drawTextObject(ctx, obj);
    else drawShapeObject(ctx, obj);
    ctx.restore();
  }

  function drawImageObject(ctx, obj) {
    let img = drawImageObject.cache?.get(obj.src);
    if (!drawImageObject.cache) drawImageObject.cache = new Map();
    img = drawImageObject.cache.get(obj.src);
    if (!img) {
      img = new Image(); img.onload = renderObjectCanvas; img.src = obj.src;
      drawImageObject.cache.set(obj.src, img); return;
    }
    if (!img.complete) return;
    ctx.drawImage(img, 0, 0, obj.w, obj.h);
  }

  function drawTextObject(ctx, obj) {
    const style = { ...state.textStyle, ...(obj.style || {}) };
    const lines = String(obj.text || '').split(/\n/);
    const fontBits = `${style.italic ? 'italic ' : ''}${style.bold ? '800 ' : '500 '}${style.size || 72}px ${obj.font || inputs.font?.value || 'Impact, fantasy'}`;
    ctx.font = fontBits; ctx.textBaseline = 'top'; ctx.textAlign = style.align || 'left';
    ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = style.shadowBlur || 0; ctx.shadowOffsetX = style.shadowBlur ? 4 : 0; ctx.shadowOffsetY = style.shadowBlur ? 4 : 0;
    const lh = (style.size || 72) * (style.lineSpacing || 1.1);
    const fill = (obj.gradient?.enabled ?? state.gradient.enabled) ? currentGradient(ctx, 0, 0, obj.w, obj.h) : (obj.color || state.color);
    ctx.fillStyle = colorWithAlpha(style.highlight || '#FFF3D6', 0.42); ctx.fillRect(0, 0, obj.w, Math.min(obj.h, lines.length * lh + 8));
    ctx.shadowBlur = style.shadowBlur || 0;
    let x = style.align === 'center' ? obj.w / 2 : style.align === 'right' ? obj.w : 0;
    for (let i=0;i<lines.length;i++) {
      const y = i * lh + 4;
      if (Math.abs(style.bend || 0) > 0.02) drawBentLine(ctx, lines[i], x, y, obj.w, fill, style, obj);
      else drawSpacedLine(ctx, lines[i], x, y, fill, style, obj);
    }
  }

  function drawSpacedLine(ctx, text, x, y, fill, style, obj) {
    ctx.fillStyle = fill; ctx.strokeStyle = style.stroke || '#001E24'; ctx.lineWidth = style.strokeWidth || 0;
    const chars = [...text];
    if (!style.letterSpacing) {
      if (style.strokeWidth > 0) ctx.strokeText(text, x, y); ctx.fillText(text, x, y); decorateText(ctx, text, x, y, style); return;
    }
    const widths = chars.map((ch) => ctx.measureText(ch).width + style.letterSpacing);
    const total = widths.reduce((a,b)=>a+b,0);
    let start = style.align === 'center' ? x - total / 2 : style.align === 'right' ? x - total : x;
    for (let i=0;i<chars.length;i++) { if (style.strokeWidth > 0) ctx.strokeText(chars[i], start, y); ctx.fillText(chars[i], start, y); start += widths[i]; }
    decorateText(ctx, text, x, y, style, total);
  }

  function drawBentLine(ctx, text, x, y, w, fill, style) {
    const chars = [...text]; const total = ctx.measureText(text).width + chars.length * (style.letterSpacing || 0);
    let start = style.align === 'center' ? (w - total) / 2 : style.align === 'right' ? w - total : 0;
    for (const ch of chars) {
      const cw = ctx.measureText(ch).width + (style.letterSpacing || 0);
      const t = (start + cw / 2) / Math.max(1, w);
      const cy = y + Math.sin((t - .5) * Math.PI) * (style.bend * 80);
      ctx.save(); ctx.translate(start, cy); ctx.rotate((t - .5) * style.bend * .45); ctx.fillStyle = fill; ctx.strokeStyle = style.stroke; ctx.lineWidth = style.strokeWidth || 0; if (style.strokeWidth > 0) ctx.strokeText(ch, 0, 0); ctx.fillText(ch, 0, 0); ctx.restore();
      start += cw;
    }
  }

  function decorateText(ctx, text, x, y, style, width=null) {
    const w = width || ctx.measureText(text).width; const fs = style.size || 72;
    const start = style.align === 'center' ? x - w / 2 : style.align === 'right' ? x - w : x;
    ctx.save(); ctx.shadowBlur = 0; ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = Math.max(2, fs * .035);
    if (style.underline) { ctx.beginPath(); ctx.moveTo(start, y + fs * 1.05); ctx.lineTo(start + w, y + fs * 1.05); ctx.stroke(); }
    if (style.strike) { ctx.beginPath(); ctx.moveTo(start, y + fs * .58); ctx.lineTo(start + w, y + fs * .58); ctx.stroke(); }
    ctx.restore();
  }

  function drawShapeObject(ctx, obj) {
    const oldShape = { ...state.shape };
    state.shape.type = obj.shapeType || 'rect'; state.shape.fill = obj.shapeFill || 'fillStroke'; state.shape.rotation = 0;
    ctx.fillStyle = (obj.gradient?.enabled ?? state.gradient.enabled) ? currentGradient(ctx, 0, 0, obj.w, obj.h) : (obj.color || state.color);
    ctx.strokeStyle = obj.stroke || '#001E24'; ctx.lineWidth = obj.strokeWidth || 4;
    ctx.beginPath();
    const start = {x:0,y:0}, end = {x:obj.w,y:obj.h};
    const type = state.shape.type;
    const { x, y, w, h, cx, cy } = rotatedRectData(start, end);
    if (type === 'heart') heartPath(ctx, cx, cy, w, h);
    else if (type === 'arrow') arrowPath(ctx, x, y, w, h);
    else if (type === 'speech') speechPath(ctx, x, y, w, h);
    else if (type === 'rect') ctx.rect(x, y, w, h);
    else if (type === 'roundrect') roundRectPath(ctx, x, y, w, h, Math.min(w, h) * .12);
    else if (type === 'circle') ellipsePath(ctx, cx, cy, w / 2, h / 2);
    else if (type === 'line') { ctx.moveTo(0, 0); ctx.lineTo(w, h); }
    else if (type === 'triangle') polygonPath(ctx, [[cx, y], [x + w, y + h], [x, y + h]]);
    else if (type === 'diamond') polygonPath(ctx, [[cx, y], [x + w, cy], [cx, y + h], [x, cy]]);
    else if (type === 'star') starPath(ctx, cx, cy, Math.max(w, h) / 2, Math.max(w, h) / 4, Math.max(3, state.shape.sides || 5));
    else if (type === 'polygon') starPath(ctx, cx, cy, Math.max(w, h) / 2, Math.max(w, h) / 2, Math.max(3, state.shape.sides || 6));
    else if (type === 'cloud') cloudPath(ctx, x, y, w, h);
    else if (type === 'burst') burstPath(ctx, cx, cy, Math.max(w, h) / 2, 14);
    else if (type === 'moon') moonPath(ctx, cx, cy, w / 2, h / 2);
    else if (type === 'plant') plantPath(ctx, x, y, w, h);
    else if (type === 'cube') cubePath(ctx, x, y, w, h);
    if (state.shape.fill === 'fill' || state.shape.fill === 'fillStroke') ctx.fill();
    if (state.shape.fill === 'stroke' || state.shape.fill === 'fillStroke' || type === 'line' || type === 'cube' || type === 'plant') ctx.stroke();
    state.shape = oldShape;
  }

  function heartPath(ctx, cx, cy, w, h) {
    ctx.moveTo(cx, cy + h*.32); ctx.bezierCurveTo(cx - w*.52, cy - h*.05, cx - w*.22, cy - h*.55, cx, cy - h*.18); ctx.bezierCurveTo(cx + w*.22, cy - h*.55, cx + w*.52, cy - h*.05, cx, cy + h*.32); ctx.closePath();
  }
  function arrowPath(ctx, x, y, w, h) { polygonPath(ctx, [[x,y+h*.35],[x+w*.62,y+h*.35],[x+w*.62,y+h*.12],[x+w,y+h*.5],[x+w*.62,y+h*.88],[x+w*.62,y+h*.65],[x,y+h*.65]]); }
  function speechPath(ctx, x, y, w, h) { roundRectPath(ctx,x,y,w,h*.78,Math.min(w,h)*.14); ctx.moveTo(x+w*.22,y+h*.78); ctx.lineTo(x+w*.18,y+h); ctx.lineTo(x+w*.42,y+h*.78); }

  function deleteObject(id = state.activeObjectId) {
    const idx = state.objects.findIndex((o) => o.id === id); if (idx < 0) return;
    pushHistory('delete object'); state.objects.splice(idx,1); state.activeObjectId = state.objects[Math.min(idx, state.objects.length - 1)]?.id || null; renderObjects(); renderLayers();
  }
  function duplicateObject() { const obj = getActiveObject(); if (!obj) return; pushHistory('duplicate object'); createObject({ ...JSON.parse(JSON.stringify(obj)), id: uid('obj'), x: obj.x + 28, y: obj.y + 28, name: `${obj.name || obj.type} copy` }); }
  function moveObject(dir) { const idx = state.objects.findIndex((o) => o.id === state.activeObjectId); const next = idx + dir; if (idx < 0 || next < 0 || next >= state.objects.length) return; pushHistory('move object layer'); [state.objects[idx], state.objects[next]] = [state.objects[next], state.objects[idx]]; renderObjects(); }
  function flipObject(axis) { const obj = getActiveObject(); if (!obj) return; pushHistory('flip object'); if (axis === 'x') obj.flipX = !obj.flipX; else obj.flipY = !obj.flipY; renderObjects(); }

  function rasterizeSelectedObject() {
    const obj = getActiveObject(); const layer = getActiveLayer(); if (!obj || !layer) { status('Select an object and a raster layer first.'); return; }
    pushHistory('rasterize object'); drawObjectToCanvas(layer.ctx, obj); deleteObject(obj.id); renderLayers(); status('Object rasterized to active layer.');
  }

  function transformActiveLayer(kind) {
    const layer = getActiveLayer(); if (!layer) return; pushHistory(kind);
    const tmp = createCanvas(state.width, state.height); const tctx = tmp.getContext('2d');
    if (kind === 'rotate') { tctx.translate(state.width/2, state.height/2); tctx.rotate(Math.PI/2); tctx.drawImage(layer.canvas, -state.width/2, -state.height/2); }
    else if (kind === 'flipH') { tctx.translate(state.width, 0); tctx.scale(-1, 1); tctx.drawImage(layer.canvas, 0, 0); }
    else if (kind === 'flipV') { tctx.translate(0, state.height); tctx.scale(1, -1); tctx.drawImage(layer.canvas, 0, 0); }
    layer.ctx.clearRect(0,0,state.width,state.height); layer.ctx.drawImage(tmp,0,0); renderLayers();
  }

  async function loadAssetLibrary() {
    if (!els.assetGrid) return;
    try {
      const response = await fetch('assets/library/asset-library-manifest.json');
      const data = await response.json();
      state.assetLibrary = Array.isArray(data.assets) ? data.assets : [];
      renderAssetCategoryOptions(); renderAssetGrid(); renderAudioList();
      status(`Loaded ${state.assetLibrary.length} bundled assets.`);
    } catch (err) { console.warn('Asset library not loaded:', err); status('Asset library is optional and did not load from file:// in this browser.'); }
  }

  function renderAssetCategoryOptions() {
    if (!els.assetCategory) return;
    const cats = [...new Set(state.assetLibrary.map((a) => a.category))].sort();
    els.assetCategory.innerHTML = '<option value="all">All assets</option>' + cats.map((c) => `<option value="${escapeXml(c)}">${escapeXml(titleCase(c))}</option>`).join('');
  }

  function renderAssetGrid() {
    if (!els.assetGrid) return;
    const cat = els.assetCategory?.value || 'all'; const q = (els.assetSearch?.value || '').toLowerCase();
    els.assetGrid.innerHTML = '';
    state.assetLibrary.filter((a) => a.type === 'image').filter((a) => (cat === 'all' || a.category === cat) && (!q || `${a.label} ${a.category} ${a.source}`.toLowerCase().includes(q))).slice(0, 180).forEach((a) => {
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'asset-tile'; btn.title = `${a.label} · ${a.category}`;
      const img = document.createElement('img'); img.src = a.src; img.alt = '';
      const span = document.createElement('span'); span.textContent = a.label;
      btn.append(img, span); btn.addEventListener('click', () => addImageObject(a.src, a.label)); els.assetGrid.appendChild(btn);
    });
  }

  function renderAudioList() {
    if (!els.audioList) return; els.audioList.innerHTML = '';
    state.assetLibrary.filter((a) => a.type === 'audio').forEach((a) => {
      const wrap = document.createElement('div'); wrap.className = 'audio-row';
      const label = document.createElement('span'); label.textContent = a.label;
      const audio = document.createElement('audio'); audio.controls = true; audio.src = a.src; audio.preload = 'none';
      wrap.append(label, audio); els.audioList.appendChild(wrap);
    });
  }

  function renderEmojiGrid() {
    if (!els.emojiGrid) return;
    const emojis = '😀 😎 🤩 🦖 🐉 🐈‍⬛ ⭐ ✨ ⚡ 🔥 💧 🌊 🌙 ☀️ 🌈 ❤️ 🧡 💛 💚 💙 💜 🖤 🤍 💬 💭 ❗ ❓ 🎨 🖌️ 🖍️ 🧪 🛸 🏰 🌲 🍄 🌸'.split(' ');
    els.emojiGrid.innerHTML = '';
    emojis.forEach((emoji) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = emoji; b.addEventListener('click', () => createObject({ type: 'text', name: `Emoji ${emoji}`, text: emoji, x: state.width*.25, y: state.height*.25, w: 160, h: 160, color: state.color, font: 'system-ui, sans-serif', style: { ...state.textStyle, size: 110, strokeWidth: 0, highlight: 'rgba(255,255,255,0)' }, gradient: { enabled: false } })); els.emojiGrid.appendChild(b); });
  }

  function setupObjectEvents() {
    const bind = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
    bind('addTextObjectBtn', () => { pushHistory('add text object'); addTextObject(); });
    bind('addShapeObjectBtn', () => { pushHistory('add shape object'); addShapeObject(); });
    bind('duplicateObjectBtn', duplicateObject); bind('deleteObjectBtn', () => deleteObject());
    bind('objectUpBtn', () => moveObject(1)); bind('objectDownBtn', () => moveObject(-1));
    bind('flipObjectHBtn', () => flipObject('x')); bind('flipObjectVBtn', () => flipObject('y'));
    bind('rasterizeObjectBtn', rasterizeSelectedObject);
    bind('rotateLayerBtn', () => transformActiveLayer('rotate')); bind('flipLayerHBtn', () => transformActiveLayer('flipH')); bind('flipLayerVBtn', () => transformActiveLayer('flipV'));
    bind('pinBackgroundBtn', () => { state.pinBackground = !state.pinBackground; $('pinBackgroundBtn').setAttribute('aria-pressed', String(state.pinBackground)); status(`Background pin ${state.pinBackground ? 'on' : 'off'}.`); });
    ['boldBtn','italicBtn','underlineBtn','strikeBtn'].forEach((id) => { const el = $(id); if (!el) return; el.addEventListener('click', () => { const map = { boldBtn:'bold', italicBtn:'italic', underlineBtn:'underline', strikeBtn:'strike' }; const key = map[id]; state.textStyle[key] = !state.textStyle[key]; el.setAttribute('aria-pressed', String(state.textStyle[key])); updateSelectedObjectFromInputs(); }); });
    if (els.assetCategory) els.assetCategory.addEventListener('change', renderAssetGrid);
    if (els.assetSearch) els.assetSearch.addEventListener('input', renderAssetGrid);
    if (inputs.overlayImport) inputs.overlayImport.addEventListener('change', importOverlayImage);
  }

  function importOverlayImage(ev) {
    const file = ev.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => addImageObject(reader.result, `Overlay ${file.name.slice(0, 24)}`); reader.readAsDataURL(file); ev.target.value = '';
  }

  function importImage(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        pushHistory('import image');
        const layer = addLayer(`Imported ${file.name.slice(0, 22)}`);
        const scale = Math.min(state.width / img.width, state.height / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        layer.ctx.drawImage(img, (state.width - w) / 2, (state.height - h) / 2, w, h);
        renderLayers();
        status(`Imported ${file.name}.`);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
    ev.target.value = '';
  }

  function importProjectFile(ev) {
    const file = ev.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try { await loadProject(JSON.parse(reader.result)); }
      catch (err) { status(`Project import failed: ${err.message}`); }
    };
    reader.readAsText(file);
    ev.target.value = '';
  }

  function keydown(ev) {
    const tag = document.activeElement?.tagName?.toLowerCase();
    if (['input','select','textarea'].includes(tag)) return;
    const mod = ev.ctrlKey || ev.metaKey;
    if (mod && ev.key.toLowerCase() === 'z') { ev.preventDefault(); ev.shiftKey ? redo() : undo(); }
    else if (ev.key === '[') { inputs.size.value = String(clamp(Number(inputs.size.value) - 2, 1, 240)); updateOutputLabels(); }
    else if (ev.key === ']') { inputs.size.value = String(clamp(Number(inputs.size.value) + 2, 1, 240)); updateOutputLabels(); }
    else if (ev.key.toLowerCase() === 'g') setTool('graffiti');
    else if (ev.key.toLowerCase() === 's') setTool('spray');
    else if (ev.key.toLowerCase() === 'i') setTool('ichor');
    else if (ev.key.toLowerCase() === 'l') setTool('electric');
    else if (ev.key.toLowerCase() === 'e') setTool('eraser');
    else if (ev.key.toLowerCase() === 'v') setTool('shape');
  }

  async function initServiceWorker() {
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      try { await navigator.serviceWorker.register('sw.js'); }
      catch (err) { console.warn('Service worker not registered:', err); }
    }
  }

  async function init() {
    drawColorDisc();
    renderSwatches();
    setupSimplePanels();
    setupMovablePalette();
    document.getElementById('applyIchorPresetBtn')?.addEventListener('click', () => applyEffectPreset(inputs.effectPreset?.value || state.effect.preset));
    inputs.effectPreset?.addEventListener('change', () => applyEffectPreset(inputs.effectPreset.value));
    document.getElementById('clearPreviewBtn')?.addEventListener('click', clearPreview);
    document.getElementById('clearLiveFxBtn')?.addEventListener('click', clearLiveEffects);
    setupObjectEvents();
    loadAssetLibrary();
    renderEmojiGrid();
    attachEvents();
    setColor('#00FFFF');
    addLayer('Sketch Layer');
    addLayer('Effects Layer');
    updateStageSize();
    const restored = await restoreFromBrowser();
    if (!restored) {
      state.background = { mode: 'transparent', color: '#FFFFFF' };
      state.activeLayerId = state.layers[1].id;
      renderLayers();
      setTimeout(fitCanvas, 80);
    }
    syncExtraInputsFromState();
    applyCanvasBackground();
    updateOutputLabels();
    renderObjects();
    renderLiveEffects();
    startLiveFxLoop();
    initServiceWorker();
  }

  init();
})();
