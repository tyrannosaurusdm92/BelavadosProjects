import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import './styles.css';

const $ = (selector) => document.querySelector(selector);
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const TAU = Math.PI * 2;

const PRESETS = {
  earth: {
    name: 'Pacific Sanctuary', seed: 73192, radius: 6371, dayLength: 24,
    depth: 220, relief: 62, trenches: 48, seamounts: 56, terrain: 'tectonic',
    water: '#087b9a', visibility: 74, current: 14, life: 68,
    fish: true, whales: true, sharks: true, biolume: false,
    sky: '#9bd4e6', floor: ['#061e2d', '#0a3d50', '#376f69', '#988b68'],
  },
  pelagia: {
    name: 'Pelagia IX', seed: 907117, radius: 8240, dayLength: 31.5,
    depth: 285, relief: 79, trenches: 66, seamounts: 71, terrain: 'volcanic',
    water: '#205ea8', visibility: 105, current: 22, life: 92,
    fish: true, whales: true, sharks: true, biolume: true,
    sky: '#c28bdf', floor: ['#090f2c', '#132f55', '#315974', '#6a5b81'],
  },
  europa: {
    name: 'Cryona', seed: 161803, radius: 1561, dayLength: 85.2,
    depth: 330, relief: 45, trenches: 24, seamounts: 34, terrain: 'cratered',
    water: '#345c78', visibility: 48, current: 7, life: 42,
    fish: true, whales: false, sharks: false, biolume: true,
    sky: '#d9e7ee', floor: ['#060e18', '#142536', '#3d5260', '#82949b'],
  },
  abyssum: {
    name: 'Abyssum', seed: 404013, radius: 10420, dayLength: 18,
    depth: 390, relief: 90, trenches: 86, seamounts: 65, terrain: 'canyon',
    water: '#291d48', visibility: 30, current: 31, life: 58,
    fish: true, whales: true, sharks: true, biolume: true,
    sky: '#3f1d59', floor: ['#050410', '#180b29', '#392454', '#73446c'],
  },
};

const state = {
  preset: 'earth',
  config: { ...PRESETS.earth },
  timeScale: 1440,
  paused: false,
  simDate: new Date('2026-07-10T12:00:00Z'),
  view: 'dive',
  showCurrents: true,
  pilotDrift: true,
  keys: new Set(),
  pointerLocked: false,
  selectedEntity: null,
  heightmap: null,
  heightmapName: null,
  rideProgress: 0.08,
  followEntity: null,
  rebuildToken: 0,
};

const runtime = {
  scene: null,
  camera: null,
  renderer: null,
  controls: null,
  clock: new THREE.Clock(),
  world: new THREE.Group(),
  globe: new THREE.Group(),
  terrain: null,
  water: null,
  waterMaterial: null,
  floorMaterial: null,
  lifeGroup: new THREE.Group(),
  decorGroup: new THREE.Group(),
  currentGroup: new THREE.Group(),
  currents: [],
  currentParticles: [],
  entities: [],
  pickables: [],
  sun: null,
  ambient: null,
  keyLight: null,
  plankton: null,
  cameraEuler: new THREE.Euler(0, 0, 0, 'YXZ'),
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
  lookDummy: new THREE.Object3D(),
  elapsed: 0,
  hudAccumulator: 0,
};

class SeededRandom {
  constructor(seed) { this.seed = Math.abs(Math.trunc(seed)) % 2147483647 || 1; }
  next() { this.seed = (this.seed * 16807) % 2147483647; return (this.seed - 1) / 2147483646; }
  range(min, max) { return min + (max - min) * this.next(); }
  pick(list) { return list[Math.floor(this.next() * list.length)]; }
}

function hashNoise(x, y, seed) {
  let n = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 69069);
  n = Math.imul(n ^ (n >>> 13), 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
}

function valueNoise(x, y, seed) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = x - x0;
  const ty = y - y0;
  const sx = tx * tx * (3 - 2 * tx);
  const sy = ty * ty * (3 - 2 * ty);
  const a = hashNoise(x0, y0, seed);
  const b = hashNoise(x0 + 1, y0, seed);
  const c = hashNoise(x0, y0 + 1, seed);
  const d = hashNoise(x0 + 1, y0 + 1, seed);
  return lerp(lerp(a, b, sx), lerp(c, d, sx), sy) * 2 - 1;
}

function fbm(x, y, seed, octaves = 5) {
  let value = 0;
  let amplitude = .54;
  let frequency = 1;
  let total = 0;
  for (let i = 0; i < octaves; i += 1) {
    value += valueNoise(x * frequency, y * frequency, seed + i * 941) * amplitude;
    total += amplitude;
    amplitude *= .5;
    frequency *= 2.03;
  }
  return value / total;
}

function hexToRgb(hex) {
  const c = new THREE.Color(hex);
  return [c.r, c.g, c.b];
}

function mixColor(a, b, t) {
  return new THREE.Color(a).lerp(new THREE.Color(b), clamp(t, 0, 1));
}

function configSnapshot() {
  return {
    format: 'abyssal-atelier-world',
    version: 1,
    exportedAt: new Date().toISOString(),
    preset: state.preset,
    config: { ...state.config },
    simulation: { date: state.simDate.toISOString(), timeScale: state.timeScale },
    sourceHeightmap: state.heightmapName,
  };
}

function showToast(message, error = false) {
  const toast = $('#toast');
  toast.textContent = message;
  toast.classList.toggle('error', error);
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2600);
}

function disposeObject(object) {
  object.traverse((child) => {
    if (child.geometry) child.geometry.dispose();
    if (child.material) {
      const materials = Array.isArray(child.material) ? child.material : [child.material];
      materials.forEach((material) => {
        Object.values(material).forEach((value) => value?.isTexture && value.dispose());
        material.dispose();
      });
    }
  });
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children.pop();
    disposeObject(child);
  }
}

function initScene() {
  runtime.scene = new THREE.Scene();
  runtime.scene.background = new THREE.Color('#062333');
  runtime.scene.fog = new THREE.FogExp2('#07394a', 0.0095);

  runtime.camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, .1, 4000);
  runtime.camera.position.set(42, -38, 112);

  runtime.renderer = new THREE.WebGLRenderer({ canvas: $('#ocean-canvas'), antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  runtime.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  runtime.renderer.setSize(innerWidth, innerHeight);
  runtime.renderer.outputColorSpace = THREE.SRGBColorSpace;
  runtime.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  runtime.renderer.toneMappingExposure = 1.05;
  runtime.renderer.shadowMap.enabled = true;
  runtime.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  runtime.controls = new OrbitControls(runtime.camera, runtime.renderer.domElement);
  runtime.controls.enableDamping = true;
  runtime.controls.dampingFactor = .055;
  runtime.controls.minDistance = 4;
  runtime.controls.maxDistance = 900;
  runtime.controls.target.set(0, -90, 0);

  runtime.ambient = new THREE.HemisphereLight('#a9f2ff', '#071119', 1.3);
  runtime.scene.add(runtime.ambient);
  runtime.keyLight = new THREE.DirectionalLight('#d7fbff', 2.8);
  runtime.keyLight.position.set(-120, 220, 80);
  runtime.keyLight.castShadow = true;
  runtime.keyLight.shadow.mapSize.set(2048, 2048);
  runtime.keyLight.shadow.camera.left = -350;
  runtime.keyLight.shadow.camera.right = 350;
  runtime.keyLight.shadow.camera.top = 350;
  runtime.keyLight.shadow.camera.bottom = -350;
  runtime.scene.add(runtime.keyLight);

  runtime.scene.add(runtime.world);
  runtime.scene.add(runtime.globe);
  runtime.world.add(runtime.lifeGroup, runtime.decorGroup, runtime.currentGroup);

  const glow = new THREE.PointLight('#5de6ff', 8, 260, 1.4);
  glow.position.set(0, -85, 0);
  runtime.world.add(glow);

  buildWorld();
  bindUI();
  setView('dive', true);
  updateUIFromConfig();
  animate();
}

function sampleImportedHeightmap(x, z) {
  if (!state.heightmap) return null;
  const { data, width, height } = state.heightmap;
  const u = clamp((x + 450) / 900, 0, .9999);
  const v = clamp((z + 450) / 900, 0, .9999);
  const px = Math.floor(u * width);
  const py = Math.floor(v * height);
  return data[py * width + px];
}

function terrainDepthAt(x, z) {
  const cfg = state.config;
  const seed = Number(cfg.seed) || 1;
  const relief = cfg.relief / 100;
  const baseNoise = fbm(x / 230, z / 230, seed, 6);
  const detail = fbm(x / 54, z / 54, seed + 1051, 4);
  let variation = baseNoise * 90 * relief + detail * 24 * relief;

  const imported = sampleImportedHeightmap(x, z);
  if (imported !== null) variation += (0.5 - imported) * 210 * relief;

  if (cfg.terrain === 'tectonic') {
    const ridgeCenter = Math.sin(z * .011 + seed) * 75 + Math.sin(z * .026) * 22;
    const ridge = Math.exp(-Math.pow((x - ridgeCenter) / 46, 2));
    variation -= ridge * (112 + cfg.seamounts * .7) * relief;
    variation += Math.abs(valueNoise(x / 44, z / 44, seed + 90)) * 15;
  } else if (cfg.terrain === 'volcanic') {
    const rng = new SeededRandom(seed + 55);
    for (let i = 0; i < 10; i += 1) {
      const cx = -380 + i * 82 + rng.range(-28, 28);
      const cz = Math.sin(i * 1.35) * 145 + rng.range(-60, 60);
      const radius = rng.range(28, 68);
      variation -= Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (radius ** 2)) * rng.range(90, 210) * relief;
    }
  } else if (cfg.terrain === 'canyon') {
    const canyonCenter = Math.sin(x * .009 + 1.7) * 88 + Math.sin(x * .025) * 28;
    const canyon = Math.exp(-Math.pow((z - canyonCenter) / 34, 2));
    variation += canyon * (145 + cfg.trenches) * relief;
    variation += Math.max(0, Math.sin((z - canyonCenter) * .085)) * canyon * 22;
  } else if (cfg.terrain === 'cratered') {
    const rng = new SeededRandom(seed + 777);
    for (let i = 0; i < 13; i += 1) {
      const cx = rng.range(-390, 390);
      const cz = rng.range(-390, 390);
      const radius = rng.range(24, 105);
      const dist = Math.hypot(x - cx, z - cz) / radius;
      const bowl = Math.exp(-dist * dist * 1.8);
      const rim = Math.exp(-Math.pow((dist - .95) / .18, 2));
      variation += bowl * 78 * relief - rim * 32 * relief;
    }
  } else if (cfg.terrain === 'smooth') {
    variation *= .35;
  }

  if (cfg.trenches > 0) {
    const trenchCenter = -205 + Math.sin(z * .007 + seed * .01) * 65;
    const trench = Math.exp(-Math.pow((x - trenchCenter) / (21 + (100 - cfg.trenches) * .16), 2));
    variation += trench * cfg.trenches * 1.55 * relief;
  }

  if (cfg.seamounts > 0 && cfg.terrain !== 'volcanic') {
    const rng = new SeededRandom(seed + 2609);
    const count = Math.floor(2 + cfg.seamounts / 13);
    for (let i = 0; i < count; i += 1) {
      const cx = rng.range(-390, 390);
      const cz = rng.range(-390, 390);
      const radius = rng.range(24, 58);
      variation -= Math.exp(-((x - cx) ** 2 + (z - cz) ** 2) / (radius ** 2)) * rng.range(60, 155) * relief;
    }
  }

  return clamp(cfg.depth + variation, 14, 510);
}

function makeTerrain() {
  const size = 900;
  const segments = 160;
  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  const position = geometry.attributes.position;
  const colors = new Float32Array(position.count * 3);
  const palette = state.config.floor;

  for (let i = 0; i < position.count; i += 1) {
    const x = position.getX(i);
    const z = -position.getY(i);
    const depth = terrainDepthAt(x, z);
    position.setZ(i, -depth);
    const normalized = clamp((depth - 20) / 470, 0, 1);
    const shelfMix = smoothPalette(palette, 1 - normalized);
    const grain = valueNoise(x / 18, z / 18, state.config.seed + 800) * .06;
    colors[i * 3] = clamp(shelfMix.r + grain, 0, 1);
    colors[i * 3 + 1] = clamp(shelfMix.g + grain, 0, 1);
    colors[i * 3 + 2] = clamp(shelfMix.b + grain, 0, 1);
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  geometry.rotateX(-Math.PI / 2);
  runtime.floorMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: .96,
    metalness: state.preset === 'pelagia' ? .14 : .03,
  });
  const mesh = new THREE.Mesh(geometry, runtime.floorMaterial);
  mesh.receiveShadow = true;
  mesh.castShadow = false;
  mesh.name = 'Living bathymetry';
  return mesh;
}

function smoothPalette(palette, t) {
  const scaled = clamp(t, 0, .9999) * (palette.length - 1);
  const index = Math.floor(scaled);
  return mixColor(palette[index], palette[index + 1] || palette[index], scaled - index);
}

function makeWaterSurface() {
  const geometry = new THREE.PlaneGeometry(1200, 1200, 96, 96);
  geometry.rotateX(-Math.PI / 2);
  const rgb = hexToRgb(state.config.water);
  runtime.waterMaterial = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uWater: { value: new THREE.Vector3(...rgb) },
      uOpacity: { value: state.view === 'orbital' ? .72 : .32 },
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec3 p = position;
        float wave = sin(p.x * .028 + uTime * .8) * 1.25 + cos(p.z * .021 - uTime * .62) * .85;
        wave += sin((p.x + p.z) * .052 + uTime * 1.15) * .32;
        p.y += wave;
        vec4 world = modelMatrix * vec4(p, 1.0);
        vWorld = world.xyz;
        vWave = wave;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: `
      uniform vec3 uWater;
      uniform float uOpacity;
      varying vec3 vWorld;
      varying float vWave;
      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorld);
        float fresnel = pow(1.0 - abs(viewDir.y), 2.2);
        vec3 color = uWater * (.72 + vWave * .025) + vec3(.18, .42, .46) * fresnel;
        gl_FragColor = vec4(color, uOpacity + fresnel * .22);
      }
    `,
  });
  const mesh = new THREE.Mesh(geometry, runtime.waterMaterial);
  mesh.position.y = 0;
  mesh.renderOrder = 5;
  return mesh;
}

function makePlankton() {
  const count = Math.floor(900 + state.config.life * 13);
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const rng = new SeededRandom(state.config.seed + 99);
  for (let i = 0; i < count; i += 1) {
    positions[i * 3] = rng.range(-460, 460);
    positions[i * 3 + 1] = rng.range(-360, -4);
    positions[i * 3 + 2] = rng.range(-460, 460);
    sizes[i] = rng.range(.5, 1.8);
  }
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.PointsMaterial({
    color: state.config.biolume ? '#82fff2' : '#b9e5df',
    size: state.config.biolume ? 1.2 : .62,
    transparent: true,
    opacity: state.config.biolume ? .72 : .32,
    sizeAttenuation: true,
    blending: state.config.biolume ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: false,
  });
  return new THREE.Points(geometry, material);
}

function createWorldTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 768;
  canvas.height = 384;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(canvas.width, canvas.height);
  const water = new THREE.Color(state.config.water);
  const seed = state.config.seed;
  for (let y = 0; y < canvas.height; y += 1) {
    const lat = (y / canvas.height - .5) * Math.PI;
    for (let x = 0; x < canvas.width; x += 1) {
      const lon = x / canvas.width * TAU;
      const nx = Math.cos(lat) * Math.cos(lon);
      const nz = Math.cos(lat) * Math.sin(lon);
      let land = fbm(nx * 1.7 + 3, nz * 1.7 + Math.sin(lat) * 1.4, seed, 6);
      land += Math.cos(lat * 2.2) * .08;
      const ice = Math.pow(Math.abs(Math.sin(lat)), 9);
      let color;
      if (state.preset === 'europa') {
        color = mixColor('#5b7284', '#eaf6f7', .62 + land * .26 + ice * .3);
      } else if (land > .12) {
        color = state.preset === 'pelagia'
          ? mixColor('#315858', '#8b75aa', clamp((land - .12) * 2.7, 0, 1))
          : state.preset === 'abyssum'
            ? mixColor('#281336', '#603858', clamp((land - .12) * 2.7, 0, 1))
            : mixColor('#2e6652', '#b49b72', clamp((land - .12) * 2.7, 0, 1));
      } else {
        const depth = clamp((-land + .1) * 1.2, 0, 1);
        color = water.clone().multiplyScalar(.72 + (1 - depth) * .35);
      }
      color.lerp(new THREE.Color('#ecfbff'), ice * .7);
      const idx = (y * canvas.width + x) * 4;
      image.data[idx] = color.r * 255;
      image.data[idx + 1] = color.g * 255;
      image.data[idx + 2] = color.b * 255;
      image.data[idx + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  return texture;
}

function buildGlobe() {
  clearGroup(runtime.globe);
  const texture = createWorldTexture();
  const planet = new THREE.Mesh(
    new THREE.SphereGeometry(70, 96, 64),
    new THREE.MeshPhysicalMaterial({ map: texture, roughness: .62, metalness: .02, clearcoat: .34, clearcoatRoughness: .45 }),
  );
  runtime.globe.add(planet);

  const atmosphereColor = state.preset === 'pelagia' ? '#bd77ff' : state.preset === 'abyssum' ? '#7d3faa' : '#78deff';
  const atmosphere = new THREE.Mesh(
    new THREE.SphereGeometry(72.8, 64, 48),
    new THREE.MeshBasicMaterial({ color: atmosphereColor, transparent: true, opacity: .11, side: THREE.BackSide, blending: THREE.AdditiveBlending }),
  );
  runtime.globe.add(atmosphere);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(77, .18, 8, 128),
    new THREE.MeshBasicMaterial({ color: atmosphereColor, transparent: true, opacity: .24 }),
  );
  ring.rotation.x = Math.PI / 2.55;
  runtime.globe.add(ring);

  const marker = new THREE.Mesh(new THREE.SphereGeometry(1.1, 12, 8), new THREE.MeshBasicMaterial({ color: '#fff3b0' }));
  marker.position.set(-50, 33, 38);
  runtime.globe.add(marker);
}

function buildWorld() {
  const token = ++state.rebuildToken;
  if (runtime.terrain) {
    runtime.world.remove(runtime.terrain, runtime.water, runtime.plankton);
    disposeObject(runtime.terrain);
    disposeObject(runtime.water);
    disposeObject(runtime.plankton);
  }
  runtime.terrain = makeTerrain();
  runtime.water = makeWaterSurface();
  runtime.plankton = makePlankton();
  runtime.world.add(runtime.terrain, runtime.water, runtime.plankton);
  buildGlobe();
  buildCurrents();
  buildDecor();
  buildLife();
  applyEnvironment();
  if (token === state.rebuildToken) showToast('Ocean world regenerated');
}

function buildCurrents() {
  clearGroup(runtime.currentGroup);
  runtime.currents = [];
  runtime.currentParticles = [];
  const cfg = state.config;
  const rng = new SeededRandom(cfg.seed + 404);
  const colors = state.preset === 'pelagia' ? ['#78fff2', '#b58cff', '#4edfff'] : state.preset === 'abyssum' ? ['#cf72ff', '#4e8cff', '#ff739f'] : ['#69f5e9', '#61b9ff', '#a6e8ff'];

  for (let c = 0; c < 3; c += 1) {
    const yBase = -38 - c * 72 - rng.range(0, 35);
    const points = [];
    for (let i = 0; i < 7; i += 1) {
      const z = -430 + i * 143;
      const x = Math.sin(i * .92 + c * 1.7) * (155 + c * 35) + rng.range(-45, 45);
      const floor = terrainDepthAt(x, z);
      points.push(new THREE.Vector3(x, Math.max(-floor + 15, yBase + Math.sin(i + c) * 28), z));
    }
    const curve = new THREE.CatmullRomCurve3(points, true, 'catmullrom', .45);
    curve.userData = { strength: cfg.current / 10 * (1 - c * .12), radius: 55 + c * 12, name: ['Pelagic gyre', 'Thermocline stream', 'Abyssal return'][c] };
    runtime.currents.push(curve);

    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 220, .38 + c * .11, 6, true),
      new THREE.MeshBasicMaterial({ color: colors[c], transparent: true, opacity: .22, blending: THREE.AdditiveBlending, depthWrite: false }),
    );
    tube.userData.currentRibbon = true;
    runtime.currentGroup.add(tube);

    const count = 120;
    const positions = new Float32Array(count * 3);
    const offsets = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      offsets[i] = rng.next();
      const p = curve.getPointAt(offsets[i]);
      positions.set([p.x, p.y, p.z], i * 3);
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(geometry, new THREE.PointsMaterial({
      color: colors[c], size: 1.35, transparent: true, opacity: .74,
      blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
    }));
    particles.userData = { curve, offsets, speed: .012 + c * .004 };
    runtime.currentParticles.push(particles);
    runtime.currentGroup.add(particles);
  }
  runtime.currentGroup.visible = state.showCurrents;
}

function currentVelocityAt(position) {
  const velocity = new THREE.Vector3();
  if (!runtime.currents.length || state.config.current <= 0) return velocity;
  runtime.currents.forEach((curve) => {
    let closestT = 0;
    let closestDist = Infinity;
    for (let i = 0; i <= 30; i += 1) {
      const t = i / 30;
      const distance = curve.getPointAt(t).distanceToSquared(position);
      if (distance < closestDist) { closestDist = distance; closestT = t; }
    }
    const distance = Math.sqrt(closestDist);
    const influence = Math.max(0, 1 - distance / curve.userData.radius);
    if (influence > 0) velocity.add(curve.getTangentAt(closestT).multiplyScalar(curve.userData.strength * influence));
  });
  return velocity;
}

function makeRock(rng, color = '#203c42') {
  const geometry = new THREE.DodecahedronGeometry(rng.range(1.2, 5.2), rng.next() > .7 ? 1 : 0);
  const material = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: .03 });
  const rock = new THREE.Mesh(geometry, material);
  rock.scale.set(rng.range(.7, 2.2), rng.range(.5, 1.5), rng.range(.7, 2));
  rock.rotation.set(rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU));
  rock.castShadow = true;
  return rock;
}

function makeKelp(rng, alien = false) {
  const group = new THREE.Group();
  const height = rng.range(8, 23);
  const color = alien ? rng.pick(['#7d5cff', '#13ffbc', '#ff4fd8']) : rng.pick(['#34794f', '#518b55', '#806b36']);
  const stem = new THREE.Mesh(
    new THREE.CylinderGeometry(.12, .26, height, 6, 5),
    new THREE.MeshStandardMaterial({ color, roughness: .8, emissive: alien ? color : '#000000', emissiveIntensity: alien ? .24 : 0 }),
  );
  stem.position.y = height / 2;
  group.add(stem);
  for (let i = 1; i < 5; i += 1) {
    const leaf = new THREE.Mesh(
      new THREE.SphereGeometry(1, 8, 5),
      new THREE.MeshStandardMaterial({ color, roughness: .7, side: THREE.DoubleSide, emissive: alien ? color : '#000000', emissiveIntensity: alien ? .2 : 0 }),
    );
    leaf.scale.set(rng.range(1.1, 2.6), .08, rng.range(3.2, 6));
    leaf.position.set(0, height * i / 5, 0);
    leaf.rotation.set(rng.range(-.3, .3), rng.range(0, TAU), rng.range(-.35, .35));
    group.add(leaf);
  }
  group.userData.kelp = { phase: rng.range(0, TAU), strength: rng.range(.04, .12) };
  return group;
}

function makeVent(rng, alien = false) {
  const group = new THREE.Group();
  const rockMaterial = new THREE.MeshStandardMaterial({ color: alien ? '#291746' : '#20292c', roughness: .9, metalness: .14 });
  for (let i = 0; i < 4; i += 1) {
    const h = rng.range(5, 16);
    const spire = new THREE.Mesh(new THREE.CylinderGeometry(rng.range(.4, 1), rng.range(1, 2.4), h, 7), rockMaterial);
    spire.position.set(rng.range(-3, 3), h / 2, rng.range(-3, 3));
    spire.rotation.z = rng.range(-.12, .12);
    group.add(spire);
  }
  const smokeGeometry = new THREE.BufferGeometry();
  const count = 42;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i += 1) positions.set([rng.range(-1.5, 1.5), rng.range(7, 38), rng.range(-1.5, 1.5)], i * 3);
  smokeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const smoke = new THREE.Points(smokeGeometry, new THREE.PointsMaterial({
    color: alien ? '#c65dff' : '#92b9ad', size: alien ? 1.6 : 1.1, transparent: true, opacity: .33,
    depthWrite: false, blending: alien ? THREE.AdditiveBlending : THREE.NormalBlending,
  }));
  smoke.userData.ventSmoke = { phase: rng.range(0, TAU) };
  group.add(smoke);
  return group;
}

function makeCoral(rng, alien = false) {
  const group = new THREE.Group();
  const color = alien ? rng.pick(['#76fff0', '#d461ff', '#ff557f']) : rng.pick(['#e56a54', '#d08a54', '#8f5c75', '#d0bc77']);
  const material = new THREE.MeshStandardMaterial({ color, roughness: .72, emissive: alien ? color : '#000000', emissiveIntensity: alien ? .32 : 0 });
  const branches = 4 + Math.floor(rng.next() * 5);
  for (let i = 0; i < branches; i += 1) {
    const h = rng.range(2, 8);
    const branch = new THREE.Mesh(new THREE.CylinderGeometry(.14, .45, h, 6), material);
    branch.position.set(rng.range(-2.5, 2.5), h / 2, rng.range(-2.5, 2.5));
    branch.rotation.z = rng.range(-.42, .42);
    group.add(branch);
  }
  return group;
}

function buildDecor() {
  clearGroup(runtime.decorGroup);
  const cfg = state.config;
  const rng = new SeededRandom(cfg.seed + 3030);
  const alien = state.preset !== 'earth';
  const total = Math.floor(65 + cfg.life * .9);
  for (let i = 0; i < total; i += 1) {
    const x = rng.range(-420, 420);
    const z = rng.range(-420, 420);
    const floorY = -terrainDepthAt(x, z);
    let object;
    const roll = rng.next();
    if (roll < .43) object = makeRock(rng, alien ? '#26304a' : '#203c42');
    else if (roll < .68 && cfg.life > 15) object = makeKelp(rng, alien && cfg.biolume);
    else if (roll < .9 && cfg.life > 30) object = makeCoral(rng, alien && cfg.biolume);
    else object = makeRock(rng);
    object.position.set(x, floorY, z);
    runtime.decorGroup.add(object);
  }

  const ventCount = 2 + Math.floor(cfg.seamounts / 24);
  for (let i = 0; i < ventCount; i += 1) {
    const x = rng.range(-350, 350);
    const z = rng.range(-350, 350);
    const vent = makeVent(rng, alien && cfg.biolume);
    vent.position.set(x, -terrainDepthAt(x, z), z);
    runtime.decorGroup.add(vent);
  }
}

function tagEntity(group, entity) {
  group.traverse((child) => {
    if (child.isMesh) {
      child.userData.entity = entity;
      runtime.pickables.push(child);
    }
  });
}

function finGeometry(width = 1, length = 1) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, width, 0, -length, -width, 0, -length,
  ], 3));
  geometry.computeVertexNormals();
  return geometry;
}

function createFish(rng, alien = false) {
  const group = new THREE.Group();
  const color = alien ? rng.pick(['#6fffe6', '#8d72ff', '#ff65c6', '#54bfff']) : rng.pick(['#4bb4b6', '#d6b35c', '#6ea0d8', '#b05e62', '#87aa78']);
  const material = new THREE.MeshStandardMaterial({ color, roughness: .48, metalness: .11, emissive: alien ? color : '#000000', emissiveIntensity: alien ? .34 : 0 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), material);
  body.scale.set(.62, .42, 1.55);
  group.add(body);
  const tail = new THREE.Mesh(finGeometry(.8, 1.25), material);
  tail.position.z = -1.32;
  tail.rotation.x = Math.PI / 2;
  tail.name = 'tail';
  group.add(tail);
  const fin = new THREE.Mesh(finGeometry(.38, .72), material);
  fin.position.set(0, .25, -.2);
  fin.rotation.x = Math.PI / 2;
  group.add(fin);
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: alien ? '#f7ffff' : '#07151c' });
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.07, 6, 4), eyeMaterial);
    eye.position.set(side * .5, .15, 1.08);
    group.add(eye);
  });
  group.scale.setScalar(rng.range(.55, 1.3));
  return group;
}

function createShark(rng, alien = false) {
  const group = new THREE.Group();
  const color = alien ? '#714f98' : '#5f7780';
  const material = new THREE.MeshStandardMaterial({ color, roughness: .58, metalness: .04, emissive: alien ? '#4d1d6d' : '#000000', emissiveIntensity: alien ? .25 : 0 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), material);
  body.scale.set(1.35, .83, 4.4);
  group.add(body);
  const snout = new THREE.Mesh(new THREE.ConeGeometry(1.25, 1.8, 14), material);
  snout.rotation.x = Math.PI / 2;
  snout.position.z = 4.65;
  group.add(snout);
  const tail = new THREE.Mesh(finGeometry(2.15, 2.6), material);
  tail.position.z = -4.2;
  tail.rotation.x = Math.PI / 2;
  tail.name = 'tail';
  group.add(tail);
  const dorsal = new THREE.Mesh(finGeometry(1.35, 2.5), material);
  dorsal.position.set(0, .72, -.3);
  dorsal.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  group.add(dorsal);
  const sideFin = new THREE.Mesh(finGeometry(2.7, 2.3), material);
  sideFin.position.set(0, -.25, .2);
  sideFin.rotation.x = Math.PI / 2;
  group.add(sideFin);
  group.scale.setScalar(rng.range(.75, 1.18));
  return group;
}

function createWhale(rng, alien = false) {
  const group = new THREE.Group();
  const color = alien ? '#4651a5' : '#274d62';
  const material = new THREE.MeshStandardMaterial({ color, roughness: .68, emissive: alien ? '#1b3c87' : '#000000', emissiveIntensity: alien ? .2 : 0 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 14), material);
  body.scale.set(3.25, 2.1, 9.4);
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 10), material);
  head.scale.set(3.15, 1.85, 3.2);
  head.position.z = 7.2;
  group.add(head);
  const flukeMat = material;
  [-1, 1].forEach((side) => {
    const fluke = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 5), flukeMat);
    fluke.scale.set(3.4, .22, 1.3);
    fluke.position.set(side * 2.8, 0, -9.4);
    fluke.rotation.y = side * .25;
    fluke.name = 'fluke';
    group.add(fluke);
    const pectoral = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 5), flukeMat);
    pectoral.scale.set(3.5, .2, .78);
    pectoral.position.set(side * 3.25, -.75, 2.1);
    pectoral.rotation.y = side * .35;
    group.add(pectoral);
  });
  const eyeMat = new THREE.MeshBasicMaterial({ color: '#071016' });
  [-1, 1].forEach((side) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(.18, 8, 6), eyeMat);
    eye.position.set(side * 2.65, .35, 8.8);
    group.add(eye);
  });
  group.scale.setScalar(rng.range(.82, 1.14));
  return group;
}

function createRay(rng, alien = false) {
  const group = new THREE.Group();
  const color = alien ? '#8c4dd3' : '#5f766f';
  const material = new THREE.MeshStandardMaterial({ color, roughness: .62, side: THREE.DoubleSide, emissive: alien ? '#662c9d' : '#000000', emissiveIntensity: alien ? .28 : 0 });
  const body = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 8), material);
  body.scale.set(4.5, .35, 3.2);
  group.add(body);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(.05, .18, 8, 7), material);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = -6;
  group.add(tail);
  group.scale.setScalar(rng.range(.5, 1.05));
  return group;
}

function createJelly(rng, alien = false) {
  const group = new THREE.Group();
  const color = alien ? rng.pick(['#7dfff2', '#d96dff', '#ff71ad']) : '#9ad7dc';
  const material = new THREE.MeshPhysicalMaterial({ color, transparent: true, opacity: .58, roughness: .15, transmission: .32, emissive: alien ? color : '#000000', emissiveIntensity: alien ? .48 : 0 });
  const bell = new THREE.Mesh(new THREE.SphereGeometry(1.3, 16, 9, 0, TAU, 0, Math.PI * .56), material);
  bell.scale.y = .72;
  group.add(bell);
  for (let i = 0; i < 7; i += 1) {
    const tentacle = new THREE.Mesh(new THREE.CylinderGeometry(.035, .07, rng.range(2, 5), 5), material);
    tentacle.position.set(rng.range(-.65, .65), -rng.range(1.2, 2.5), rng.range(-.65, .65));
    group.add(tentacle);
  }
  group.scale.setScalar(rng.range(.65, 1.4));
  return group;
}

function addLifeEntity(kind, index, rng, alien) {
  let group;
  let commonName;
  let description;
  let speed;
  if (kind === 'fish') {
    group = createFish(rng, alien);
    commonName = alien ? 'Luminous ribbonfish' : rng.pick(['Pacific jack', 'Blue rockfish', 'Silver anchovy', 'Lanternfish']);
    description = 'A schooling swimmer that turns with nearby neighbors and feeds along the current edge.';
    speed = rng.range(4.2, 7.8);
  } else if (kind === 'shark') {
    group = createShark(rng, alien);
    commonName = alien ? 'Violet abyss hunter' : rng.pick(['Blue shark', 'Sixgill shark', 'Oceanic whitetip']);
    description = 'A wide-ranging predator using slow turns and bursts to patrol the thermocline.';
    speed = rng.range(2.4, 4.2);
  } else if (kind === 'whale') {
    group = createWhale(rng, alien);
    commonName = alien ? 'Pelagian sail-whale' : rng.pick(['Pacific blue whale', 'Humpback whale', 'Sperm whale']);
    description = 'A large migratory animal following productive water and periodically changing depth to feed or surface.';
    speed = rng.range(1.3, 2.4);
  } else if (kind === 'ray') {
    group = createRay(rng, alien);
    commonName = alien ? 'Aether manta' : 'Oceanic manta ray';
    description = 'A plankton-feeding ray gliding across upwelling water with slow, efficient wingbeats.';
    speed = rng.range(1.2, 2.2);
  } else {
    group = createJelly(rng, alien);
    commonName = alien ? 'Prism medusa' : 'Moon jelly';
    description = 'A drifting gelatinous animal pulsing through the water column and following local flow.';
    speed = rng.range(.3, .8);
  }

  const entity = {
    kind, index, group, commonName, description, speed,
    phase: rng.range(0, TAU),
    radius: rng.range(kind === 'fish' ? 28 : 100, kind === 'fish' ? 78 : 310),
    centerX: rng.range(-220, 220),
    centerZ: rng.range(-220, 220),
    depth: rng.range(kind === 'whale' ? 30 : 18, kind === 'jelly' ? 270 : 210),
    verticalPhase: rng.range(0, TAU),
    tailPhase: rng.range(0, TAU),
    selectedSpeed: speed,
  };
  group.userData.entity = entity;
  tagEntity(group, entity);
  runtime.entities.push(entity);
  runtime.lifeGroup.add(group);
  return entity;
}

function buildLife() {
  state.selectedEntity = null;
  $('#species-card')?.classList.add('hidden');
  clearGroup(runtime.lifeGroup);
  runtime.entities = [];
  runtime.pickables = [];
  const cfg = state.config;
  const rng = new SeededRandom(cfg.seed + 1212);
  const alien = state.preset !== 'earth' && cfg.biolume;
  if (cfg.fish && cfg.life > 0) {
    const count = Math.floor(18 + cfg.life * .68);
    for (let i = 0; i < count; i += 1) addLifeEntity('fish', i, rng, alien);
  }
  if (cfg.sharks && cfg.life > 12) {
    const count = Math.floor(1 + cfg.life / 22);
    for (let i = 0; i < count; i += 1) addLifeEntity('shark', i, rng, alien);
  }
  if (cfg.whales && cfg.life > 18) {
    const count = Math.max(1, Math.floor(cfg.life / 28));
    for (let i = 0; i < count; i += 1) addLifeEntity('whale', i, rng, alien);
  }
  if (cfg.life > 28) {
    const count = Math.max(2, Math.floor(cfg.life / 20));
    for (let i = 0; i < count; i += 1) addLifeEntity('ray', i, rng, alien);
  }
  const jellyCount = Math.floor(cfg.life / 8);
  for (let i = 0; i < jellyCount; i += 1) addLifeEntity('jelly', i, rng, alien || cfg.biolume);
  state.followEntity = runtime.entities.find((entity) => entity.kind === 'whale') || runtime.entities[0] || null;
}

function updateLife(elapsed, dt) {
  const activity = 1 + Math.log10(Math.max(1, state.timeScale)) * .18;
  const hour = state.simDate.getUTCHours() + state.simDate.getUTCMinutes() / 60;
  const nightFactor = .5 + .5 * Math.cos((hour - 1) / 24 * TAU);
  runtime.entities.forEach((entity) => {
    const t = elapsed * entity.speed * .012 * activity + entity.phase;
    let x;
    let z;
    let depth;
    if (entity.kind === 'fish') {
      const school = Math.floor(entity.index / 12);
      const slot = entity.index % 12;
      const schoolPhase = t + school * 2.1;
      x = entity.centerX + Math.cos(schoolPhase) * entity.radius + Math.cos(slot * 1.9 + t * 2.3) * 8;
      z = entity.centerZ + Math.sin(schoolPhase * .83) * entity.radius + Math.sin(slot * 1.4 + t * 1.7) * 7;
      depth = entity.depth + Math.sin(t * 1.3 + entity.verticalPhase) * 18 + nightFactor * 22;
    } else if (entity.kind === 'jelly') {
      const drift = runtime.currents[entity.index % Math.max(1, runtime.currents.length)];
      const p = drift ? drift.getPointAt((t * .012 + entity.phase / TAU) % 1) : new THREE.Vector3();
      x = p.x + Math.cos(t) * 12;
      z = p.z + Math.sin(t * .8) * 12;
      depth = Math.max(18, -p.y + Math.sin(t * 1.5) * 8);
    } else {
      x = entity.centerX + Math.cos(t * .33) * entity.radius;
      z = entity.centerZ + Math.sin(t * .27) * entity.radius;
      depth = entity.depth + Math.sin(t * .45 + entity.verticalPhase) * (entity.kind === 'whale' ? 42 : 24);
      if (entity.kind === 'whale') depth = Math.max(12, depth - Math.max(0, Math.sin(t * .18)) * 45);
    }
    x = THREE.MathUtils.euclideanModulo(x + 440, 880) - 440;
    z = THREE.MathUtils.euclideanModulo(z + 440, 880) - 440;
    const floorDepth = terrainDepthAt(x, z);
    depth = clamp(depth, 8, floorDepth - (entity.kind === 'whale' ? 16 : 5));
    const target = new THREE.Vector3(x, -depth, z);
    const old = entity.group.position.clone();
    if (old.lengthSq() === 0) old.copy(target).add(new THREE.Vector3(0, 0, -1));
    entity.group.position.lerp(target, clamp(dt * 2.8, 0, 1));
    const direction = target.clone().sub(old);
    if (direction.lengthSq() > .001 && entity.kind !== 'jelly') {
      const lookTarget = entity.group.position.clone().add(direction.normalize());
      runtime.lookDummy.position.copy(entity.group.position);
      runtime.lookDummy.lookAt(lookTarget);
      entity.group.quaternion.slerp(runtime.lookDummy.quaternion, clamp(dt * 3.2, 0, 1));
    }
    const tails = [];
    entity.group.traverse((child) => { if (child.name === 'tail' || child.name === 'fluke') tails.push(child); });
    tails.forEach((tail, i) => {
      if (entity.kind === 'whale') tail.rotation.z = Math.sin(elapsed * 2.1 + entity.tailPhase + i) * .13;
      else tail.rotation.y = Math.sin(elapsed * 7.5 + entity.tailPhase) * .38;
    });
    if (entity.kind === 'ray') entity.group.scale.y = 1 + Math.sin(elapsed * 2 + entity.phase) * .08;
    if (entity.kind === 'jelly') entity.group.scale.y = .9 + Math.sin(elapsed * 2.3 + entity.phase) * .12;
    entity.selectedSpeed = entity.speed * (1 + Math.sin(t) * .12);
  });
}

function applyEnvironment() {
  const cfg = state.config;
  const waterColor = new THREE.Color(cfg.water);
  const fogColor = waterColor.clone().multiplyScalar(state.preset === 'abyssum' ? .18 : .32);
  runtime.scene.fog.color.copy(fogColor);
  runtime.scene.fog.density = .66 / Math.max(18, cfg.visibility);
  runtime.scene.background.copy(state.view === 'orbital' ? new THREE.Color('#020915') : fogColor);
  runtime.ambient.color.set(state.preset === 'pelagia' ? '#c5c1ff' : '#a9f2ff');
  runtime.ambient.groundColor.set(state.preset === 'abyssum' ? '#120819' : '#071119');
  runtime.ambient.intensity = state.preset === 'abyssum' ? .68 : 1.25;
  runtime.keyLight.color.set(state.preset === 'pelagia' ? '#dcd0ff' : '#d7fbff');
  runtime.keyLight.intensity = state.preset === 'abyssum' ? 1.25 : 2.8;
  if (runtime.waterMaterial) {
    runtime.waterMaterial.uniforms.uWater.value.set(...hexToRgb(cfg.water));
    runtime.waterMaterial.uniforms.uOpacity.value = state.view === 'surface' ? .52 : .32;
  }
}

function setView(mode, immediate = false) {
  state.view = mode;
  $('#view-mode').value = mode;
  const orbital = mode === 'orbital';
  runtime.globe.visible = orbital;
  runtime.world.visible = !orbital;
  runtime.controls.enabled = !['pilot', 'current', 'whale'].includes(mode);
  $('#pilot-hint').classList.toggle('hidden', mode !== 'pilot');
  $('#crosshair').classList.toggle('hidden', mode !== 'pilot');
  if (mode !== 'pilot' && document.pointerLockElement) document.exitPointerLock();

  let position;
  let target;
  if (mode === 'orbital') {
    position = new THREE.Vector3(0, 24, 210);
    target = new THREE.Vector3(0, 0, 0);
  } else if (mode === 'surface') {
    position = new THREE.Vector3(175, 78, 225);
    target = new THREE.Vector3(0, -80, 0);
  } else if (mode === 'abyss') {
    const depth = Math.min(state.config.depth - 12, terrainDepthAt(20, 48) - 12);
    position = new THREE.Vector3(25, -depth, 85);
    target = new THREE.Vector3(0, -Math.min(depth + 24, terrainDepthAt(0, 0) - 4), 0);
  } else if (mode === 'pilot') {
    position = runtime.camera.position.y < -4 && runtime.camera.position.y > -500
      ? runtime.camera.position.clone()
      : new THREE.Vector3(12, -46, 118);
    target = position.clone().add(new THREE.Vector3(0, -.1, -1));
    runtime.cameraEuler.setFromQuaternion(runtime.camera.quaternion);
  } else if (mode === 'current') {
    const curve = runtime.currents[0];
    position = curve?.getPointAt(state.rideProgress).clone() || new THREE.Vector3(0, -80, 100);
    target = curve?.getPointAt((state.rideProgress + .015) % 1).clone() || new THREE.Vector3();
  } else if (mode === 'whale') {
    const whale = runtime.entities.find((entity) => entity.kind === 'whale') || runtime.entities[0];
    state.followEntity = whale;
    position = whale ? whale.group.position.clone().add(new THREE.Vector3(18, 8, -32)) : new THREE.Vector3(0, -45, 100);
    target = whale?.group.position.clone() || new THREE.Vector3(0, -60, 0);
  } else {
    position = new THREE.Vector3(48, -42, 126);
    target = new THREE.Vector3(0, -102, 0);
  }

  runtime.camera.position.copy(position);
  runtime.controls.target.copy(target);
  runtime.camera.lookAt(target);
  if (immediate) runtime.controls.update();
  applyEnvironment();
}

function updatePilot(dt) {
  if (state.view !== 'pilot' || !state.pointerLocked) return;
  const speed = (state.keys.has('ShiftLeft') || state.keys.has('ShiftRight')) ? 68 : 26;
  const direction = new THREE.Vector3();
  runtime.camera.getWorldDirection(direction);
  const forward = direction.clone().setY(0).normalize();
  const right = new THREE.Vector3().crossVectors(forward, runtime.camera.up).normalize().negate();
  const movement = new THREE.Vector3();
  if (state.keys.has('KeyW')) movement.add(forward);
  if (state.keys.has('KeyS')) movement.sub(forward);
  if (state.keys.has('KeyA')) movement.sub(right);
  if (state.keys.has('KeyD')) movement.add(right);
  if (state.keys.has('KeyQ')) movement.y -= 1;
  if (state.keys.has('KeyE')) movement.y += 1;
  if (movement.lengthSq() > 0) movement.normalize().multiplyScalar(speed * dt);
  if (state.pilotDrift) movement.add(currentVelocityAt(runtime.camera.position).multiplyScalar(dt * 2.4));
  runtime.camera.position.add(movement);
  runtime.camera.position.x = clamp(runtime.camera.position.x, -438, 438);
  runtime.camera.position.z = clamp(runtime.camera.position.z, -438, 438);
  const floorY = -terrainDepthAt(runtime.camera.position.x, runtime.camera.position.z);
  runtime.camera.position.y = clamp(runtime.camera.position.y, floorY + 3, -2.5);
}

function updateCinematicCamera(dt) {
  if (state.view === 'current' && runtime.currents.length) {
    const curve = runtime.currents[0];
    state.rideProgress = (state.rideProgress + dt * (.012 + state.config.current * .00035)) % 1;
    const position = curve.getPointAt(state.rideProgress);
    const ahead = curve.getPointAt((state.rideProgress + .015) % 1);
    runtime.camera.position.lerp(position.clone().add(new THREE.Vector3(0, 2.2, 0)), clamp(dt * 2.5, 0, 1));
    runtime.camera.lookAt(ahead);
  }
  if (state.view === 'whale' && state.followEntity) {
    const whale = state.followEntity;
    const offset = new THREE.Vector3(17, 8, -31).applyQuaternion(whale.group.quaternion);
    const desired = whale.group.position.clone().add(offset);
    runtime.camera.position.lerp(desired, clamp(dt * 1.8, 0, 1));
    runtime.camera.lookAt(whale.group.position.clone().add(new THREE.Vector3(0, 1.5, 0)));
  }
}

function updateCurrentParticles(elapsed, dt) {
  runtime.currentParticles.forEach((particles) => {
    const { curve, offsets, speed } = particles.userData;
    const positions = particles.geometry.attributes.position;
    for (let i = 0; i < offsets.length; i += 1) {
      offsets[i] = (offsets[i] + dt * speed * (1 + state.config.current / 25)) % 1;
      const p = curve.getPointAt(offsets[i]);
      const swirl = Math.sin(elapsed * 1.7 + i * 2.399) * 2.1;
      positions.setXYZ(i, p.x + Math.cos(i) * swirl, p.y + Math.sin(i * .7) * swirl, p.z + Math.sin(i) * swirl);
    }
    positions.needsUpdate = true;
  });
}

function updateDecor(elapsed, dt) {
  runtime.decorGroup.traverse((child) => {
    if (child.userData.kelp) {
      const { phase, strength } = child.userData.kelp;
      child.rotation.z = Math.sin(elapsed * .7 + phase) * strength * (1 + state.config.current / 24);
      child.rotation.x = Math.cos(elapsed * .42 + phase) * strength * .45;
    }
    if (child.userData.ventSmoke) {
      const positions = child.geometry.attributes.position;
      for (let i = 0; i < positions.count; i += 1) {
        let y = positions.getY(i) + dt * (1.6 + (i % 5) * .15);
        if (y > 38) y = 7;
        positions.setXYZ(i, positions.getX(i) + Math.sin(elapsed + i) * dt * .12, y, positions.getZ(i) + Math.cos(elapsed * .8 + i) * dt * .12);
      }
      positions.needsUpdate = true;
    }
  });
}

function updatePlankton(elapsed, dt) {
  if (!runtime.plankton) return;
  const positions = runtime.plankton.geometry.attributes.position;
  const drift = state.config.current * .006 * dt;
  for (let i = 0; i < positions.count; i += 1) {
    let x = positions.getX(i) + Math.sin(elapsed * .2 + i) * drift;
    let y = positions.getY(i) + Math.sin(elapsed * .28 + i * 1.7) * dt * .025;
    let z = positions.getZ(i) + drift * (1 + (i % 7) * .08);
    if (z > 460) z = -460;
    if (x > 460) x = -460;
    if (y > -2) y = -360;
    positions.setXYZ(i, x, y, z);
  }
  positions.needsUpdate = true;
}

function updateLighting() {
  const hour = state.simDate.getUTCHours() + state.simDate.getUTCMinutes() / 60;
  const solar = clamp(Math.sin((hour - 6) / 24 * TAU), -.12, 1);
  const depth = Math.max(0, -runtime.camera.position.y);
  const penetration = Math.exp(-depth / Math.max(28, state.config.visibility * 1.25));
  runtime.keyLight.intensity = (state.preset === 'abyssum' ? .65 : 1.5) + Math.max(0, solar) * 2.4 * penetration;
  runtime.ambient.intensity = .35 + Math.max(.08, solar) * .82 + (state.config.biolume ? .18 : 0);
  runtime.keyLight.position.set(Math.cos(hour / 24 * TAU) * 240, Math.sin((hour - 6) / 24 * TAU) * 260, 110);
}

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(runtime.clock.getDelta(), .05);
  runtime.elapsed += dt;
  if (!state.paused) state.simDate = new Date(state.simDate.getTime() + dt * state.timeScale * 1000);
  if (runtime.waterMaterial) runtime.waterMaterial.uniforms.uTime.value = runtime.elapsed;
  runtime.globe.rotation.y += dt * .026;
  if (!state.paused) updateLife(runtime.elapsed, dt);
  updateCurrentParticles(runtime.elapsed, dt);
  updateDecor(runtime.elapsed, dt);
  updatePlankton(runtime.elapsed, dt);
  updatePilot(dt);
  updateCinematicCamera(dt);
  updateLighting();
  if (runtime.controls.enabled) runtime.controls.update();
  runtime.hudAccumulator += dt;
  if (runtime.hudAccumulator > .12) {
    runtime.hudAccumulator = 0;
    updateTelemetry();
    updateClockUI();
    if (state.selectedEntity) updateSpeciesCard(state.selectedEntity);
  }
  runtime.renderer.render(runtime.scene, runtime.camera);
}

function updateTelemetry() {
  const orbital = state.view === 'orbital';
  const depth = orbital ? 0 : clamp(-runtime.camera.position.y, 0, 510);
  const pressure = 1 + depth / 10.06;
  const surfaceTemp = state.preset === 'europa' ? -1.4 : state.preset === 'pelagia' ? 28 : state.preset === 'abyssum' ? 11 : 22;
  const temperature = Math.max(state.preset === 'europa' ? -3.2 : 1.6, surfaceTemp - depth * .054);
  const velocity = orbital ? 0 : currentVelocityAt(runtime.camera.position).length();
  const lat = 18.42 - runtime.camera.position.z / 900 * 19;
  const lon = -147.06 + runtime.camera.position.x / 900 * 28;
  let zone = 'Sunlit zone';
  if (depth > 55) zone = 'Mesopelagic';
  if (depth > 200) zone = 'Bathypelagic';
  if (depth > 390) zone = 'Abyssal';
  if (orbital) zone = 'Orbital survey';
  $('#hud-depth').textContent = orbital ? 'Orbit' : `${depth.toFixed(0)} m`;
  $('#hud-pressure').textContent = orbital ? '—' : `${pressure.toFixed(1)} atm`;
  $('#hud-temp').textContent = orbital ? '—' : `${temperature.toFixed(1)} °C`;
  $('#hud-current').textContent = orbital ? '—' : `${velocity.toFixed(1)} m/s`;
  $('#hud-coordinates').textContent = `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lon).toFixed(2)}° ${lon >= 0 ? 'E' : 'W'}`;
  $('#hud-zone').textContent = zone;
}

function updateClockUI() {
  const date = state.simDate;
  const parts = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  $('#sim-datetime').textContent = `${map.day} ${map.month} ${map.year} · ${map.hour}:${map.minute}`;
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const day = Math.floor((date.getTime() - start) / 86400000);
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const fraction = hour / 24;
  $('#day-progress').style.left = `${fraction * 100}%`;
  $('#sun-indicator').style.transform = `rotate(${fraction * 360}deg)`;
  let season = 'Northern winter';
  if (day >= 80 && day < 172) season = 'Northern spring';
  else if (day >= 172 && day < 266) season = 'Northern summer';
  else if (day >= 266 && day < 355) season = 'Northern autumn';
  $('#season-label').textContent = `${season} · Day ${day}`;
}

function updateSpeciesCard(entity) {
  if (!entity) return;
  $('#species-name').textContent = entity.commonName;
  $('#species-description').textContent = entity.description;
  $('#species-depth').textContent = `Depth ${Math.max(0, -entity.group.position.y).toFixed(0)} m`;
  $('#species-speed').textContent = `Speed ${entity.selectedSpeed.toFixed(1)} m/s`;
}

function selectEntity(entity) {
  if (state.selectedEntity?.group) state.selectedEntity.group.scale.multiplyScalar(1 / 1.08);
  state.selectedEntity = entity;
  if (!entity) {
    $('#species-card').classList.add('hidden');
    return;
  }
  entity.group.scale.multiplyScalar(1.08);
  updateSpeciesCard(entity);
  $('#species-card').classList.remove('hidden');
}

function setRangeFill(input) {
  const min = Number(input.min) || 0;
  const max = Number(input.max) || 100;
  const fill = (Number(input.value) - min) / (max - min) * 100;
  input.style.setProperty('--range-fill', `${fill}%`);
}

function readConfigFromUI() {
  const cfg = state.config;
  cfg.name = $('#world-name').value.trim() || 'Untitled Ocean';
  cfg.seed = Number($('#world-seed').value) || Math.floor(Math.random() * 999999);
  cfg.radius = Number($('#planet-radius').value);
  cfg.dayLength = Number($('#day-length').value);
  cfg.depth = Number($('#ocean-depth').value);
  cfg.relief = Number($('#terrain-relief').value);
  cfg.trenches = Number($('#trench-density').value);
  cfg.seamounts = Number($('#seamount-density').value);
  cfg.terrain = $('#terrain-style').value;
  cfg.water = $('#water-color').value;
  cfg.visibility = Number($('#visibility').value);
  cfg.current = Number($('#current-strength').value);
  cfg.life = Number($('#life-abundance').value);
}

function updateUIFromConfig() {
  const cfg = state.config;
  $('#world-preset').value = PRESETS[state.preset] ? state.preset : 'custom';
  $('#world-name').value = cfg.name;
  $('#world-seed').value = cfg.seed;
  $('#planet-radius').value = cfg.radius;
  $('#day-length').value = cfg.dayLength;
  $('#ocean-depth').value = cfg.depth;
  $('#terrain-relief').value = cfg.relief;
  $('#trench-density').value = cfg.trenches;
  $('#seamount-density').value = cfg.seamounts;
  $('#terrain-style').value = cfg.terrain;
  $('#water-color').value = cfg.water;
  $('#visibility').value = cfg.visibility;
  $('#current-strength').value = cfg.current;
  $('#life-abundance').value = cfg.life;
  $('#radius-output').textContent = `${Number(cfg.radius).toLocaleString()} km`;
  $('#day-output').textContent = `${Number(cfg.dayLength).toFixed(1)} hours`;
  $('#depth-output').textContent = `${cfg.depth} m`;
  $('#relief-output').textContent = `${cfg.relief}%`;
  $('#visibility-output').textContent = `${cfg.visibility} m`;
  $('#current-output').textContent = `${(cfg.current / 10).toFixed(1)} m/s`;
  $('#life-output').textContent = `${cfg.life}%`;
  const prefix = state.preset === 'earth' ? 'Earth' : state.preset === 'custom' ? 'Custom world' : state.preset === 'europa' ? 'Ice-moon' : 'Exoplanet';
  $('#world-title').textContent = `${prefix} · ${cfg.name}`;
  syncSwitch('#toggle-fish', cfg.fish);
  syncSwitch('#toggle-whales', cfg.whales);
  syncSwitch('#toggle-sharks', cfg.sharks);
  syncSwitch('#toggle-biolume', cfg.biolume);
  syncSwitch('#toggle-currents', state.showCurrents);
  syncSwitch('#toggle-drift', state.pilotDrift);
  document.querySelectorAll("input[type='range']").forEach(setRangeFill);
}

function syncSwitch(selector, on) {
  const button = $(selector);
  button.classList.toggle('on', Boolean(on));
  button.setAttribute('aria-checked', String(Boolean(on)));
}

function toggleSwitch(button, callback) {
  const on = !button.classList.contains('on');
  syncSwitch(`#${button.id}`, on);
  callback(on);
}

function applyPreset(key) {
  if (key === 'custom') {
    state.preset = 'custom';
    state.config.name = state.config.name === PRESETS.earth.name ? 'Untitled Ocean' : state.config.name;
  } else {
    state.preset = key;
    state.config = { ...PRESETS[key] };
    state.heightmap = null;
    state.heightmapName = null;
  }
  updateUIFromConfig();
  buildWorld();
  setView(state.view, true);
}

function markCustom() {
  if (state.preset !== 'custom') {
    state.preset = 'custom';
    $('#world-preset').value = 'custom';
  }
  readConfigFromUI();
  updateUIFromConfig();
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function importWorldFile(file) {
  if (!file) return;
  if (file.type.includes('json') || file.name.toLowerCase().endsWith('.json')) {
    try {
      const parsed = JSON.parse(await file.text());
      const imported = parsed.config || parsed;
      if (!imported || typeof imported !== 'object' || !('depth' in imported)) throw new Error('This JSON does not contain an Abyssal Atelier world configuration.');
      state.preset = PRESETS[parsed.preset] ? parsed.preset : 'custom';
      state.config = { ...PRESETS.earth, ...imported };
      if (parsed.simulation?.date) state.simDate = new Date(parsed.simulation.date);
      if (parsed.simulation?.timeScale) state.timeScale = Number(parsed.simulation.timeScale);
      state.heightmap = null;
      state.heightmapName = parsed.sourceHeightmap || null;
      updateUIFromConfig();
      buildWorld();
      showToast(`Imported ${file.name}`);
    } catch (error) {
      showToast(error.message || 'Could not read that world file', true);
    }
    return;
  }
  if (file.type.startsWith('image/')) {
    const url = URL.createObjectURL(file);
    try {
      await loadHeightmapUrl(url, file.name);
    } catch (error) {
      showToast(error.message || 'Could not read that heightmap', true);
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }
  showToast('Use a PNG, JPG, or Abyssal Atelier JSON file', true);
}

function loadHeightmapUrl(url, name) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxSide = 256;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(2, Math.floor(image.naturalWidth * scale));
      const height = Math.max(2, Math.floor(image.naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      context.drawImage(image, 0, 0, width, height);
      try {
        const pixels = context.getImageData(0, 0, width, height).data;
        const data = new Float32Array(width * height);
        for (let i = 0; i < data.length; i += 1) {
          const p = i * 4;
          data[i] = (pixels[p] * .2126 + pixels[p + 1] * .7152 + pixels[p + 2] * .0722) / 255;
        }
        state.heightmap = { data, width, height };
        state.heightmapName = name;
        state.preset = 'custom';
        state.config.name = name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
        updateUIFromConfig();
        buildWorld();
        showToast(`Bathymetry loaded · ${width} × ${height} samples`);
        resolve();
      } catch (error) { reject(new Error('The browser blocked pixel access to that image. Import the file from your computer instead.')); }
    };
    image.onerror = () => reject(new Error('The heightmap image could not be loaded.'));
    image.src = url;
  });
}

function bindUI() {
  document.querySelectorAll('.section-toggle').forEach((button) => {
    button.addEventListener('click', () => {
      const section = button.closest('.control-section');
      const open = !section.classList.contains('open');
      section.classList.toggle('open', open);
      button.setAttribute('aria-expanded', String(open));
      button.querySelector('i').textContent = open ? '−' : '+';
    });
  });

  $('#collapse-panel').addEventListener('click', () => {
    $('#creator-panel').classList.add('collapsed');
    $('#expand-panel').classList.add('visible');
  });
  $('#expand-panel').addEventListener('click', () => {
    $('#creator-panel').classList.remove('collapsed');
    $('#expand-panel').classList.remove('visible');
  });

  $('#world-preset').addEventListener('change', (event) => applyPreset(event.target.value));
  $('#view-mode').addEventListener('change', (event) => setView(event.target.value, true));
  $('#time-scale').addEventListener('change', (event) => {
    state.timeScale = Number(event.target.value);
    showToast(event.target.selectedOptions[0].textContent);
  });
  $('#pause-time').addEventListener('click', () => {
    state.paused = !state.paused;
    $('#pause-time').textContent = state.paused ? '▶' : 'Ⅱ';
    $('#pause-time').title = state.paused ? 'Resume simulation' : 'Pause simulation';
    showToast(state.paused ? 'Simulation paused' : 'Simulation resumed');
  });

  const customInputs = [
    '#world-name', '#world-seed', '#planet-radius', '#day-length', '#ocean-depth', '#terrain-relief',
    '#trench-density', '#seamount-density', '#terrain-style', '#water-color', '#visibility',
    '#current-strength', '#life-abundance',
  ];
  customInputs.forEach((selector) => {
    $(selector).addEventListener('input', () => {
      markCustom();
      if (selector === '#water-color' || selector === '#visibility') applyEnvironment();
      if (selector === '#current-strength') buildCurrents();
    });
  });

  $('#regenerate-terrain').addEventListener('click', () => {
    readConfigFromUI();
    buildWorld();
    setView(state.view, true);
  });

  $('#toggle-currents').addEventListener('click', (event) => toggleSwitch(event.currentTarget, (on) => {
    state.showCurrents = on;
    runtime.currentGroup.visible = on;
  }));
  $('#toggle-drift').addEventListener('click', (event) => toggleSwitch(event.currentTarget, (on) => { state.pilotDrift = on; }));
  $('#toggle-fish').addEventListener('click', (event) => toggleSwitch(event.currentTarget, (on) => { state.config.fish = on; state.preset = 'custom'; buildLife(); }));
  $('#toggle-whales').addEventListener('click', (event) => toggleSwitch(event.currentTarget, (on) => { state.config.whales = on; state.preset = 'custom'; buildLife(); }));
  $('#toggle-sharks').addEventListener('click', (event) => toggleSwitch(event.currentTarget, (on) => { state.config.sharks = on; state.preset = 'custom'; buildLife(); }));
  $('#toggle-biolume').addEventListener('click', (event) => toggleSwitch(event.currentTarget, (on) => {
    state.config.biolume = on;
    state.preset = 'custom';
    buildWorld();
  }));

  const help = $('#help-modal');
  const openHelp = () => help.classList.remove('hidden');
  const closeHelp = () => help.classList.add('hidden');
  $('#help-button').addEventListener('click', openHelp);
  $('#close-help').addEventListener('click', closeHelp);
  $('#start-dive').addEventListener('click', () => { closeHelp(); setView('dive', true); });
  help.addEventListener('click', (event) => { if (event.target === help) closeHelp(); });
  $('#close-species').addEventListener('click', () => selectEntity(null));

  const fileInput = $('#file-input');
  $('#browse-file').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => importWorldFile(fileInput.files[0]));
  const dropZone = $('#drop-zone');
  ['dragenter', 'dragover'].forEach((type) => dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.add('dragging');
  }));
  ['dragleave', 'drop'].forEach((type) => dropZone.addEventListener(type, (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragging');
  }));
  dropZone.addEventListener('drop', (event) => importWorldFile(event.dataTransfer.files[0]));
  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') fileInput.click(); });

  $('#export-world').addEventListener('click', () => {
    readConfigFromUI();
    const blob = new Blob([JSON.stringify(configSnapshot(), null, 2)], { type: 'application/json' });
    const filename = `${state.config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ocean-world'}.json`;
    downloadBlob(blob, filename);
    showToast('World JSON exported');
  });

  $('#take-snapshot').addEventListener('click', () => {
    runtime.renderer.render(runtime.scene, runtime.camera);
    runtime.renderer.domElement.toBlob((blob) => {
      if (!blob) return showToast('Snapshot could not be created', true);
      downloadBlob(blob, `${state.config.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-ocean.png`);
      showToast('PNG snapshot saved');
    }, 'image/png');
  });

  $('#load-pescadero').addEventListener('click', async () => {
    try {
      await loadHeightmapUrl('./assets/pescadero-slope-reference.webp', 'Pescadero slope reference');
    } catch (error) {
      showToast('Use Import if your browser blocks local sample access', true);
    }
  });

  runtime.renderer.domElement.addEventListener('click', (event) => {
    if (state.view === 'pilot') {
      if (!document.pointerLockElement) runtime.renderer.domElement.requestPointerLock();
      return;
    }
    if (state.view === 'orbital') return;
    const rect = runtime.renderer.domElement.getBoundingClientRect();
    runtime.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    runtime.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    runtime.raycaster.setFromCamera(runtime.pointer, runtime.camera);
    const hit = runtime.raycaster.intersectObjects(runtime.pickables, false)[0];
    if (hit?.object.userData.entity) selectEntity(hit.object.userData.entity);
  });

  document.addEventListener('pointerlockchange', () => {
    state.pointerLocked = document.pointerLockElement === runtime.renderer.domElement;
    $('#pilot-hint').textContent = state.pointerLocked
      ? 'WASD move · Q/E dive/rise · Shift boost · currents affect your path · Esc release'
      : 'Click the ocean to capture the pointer · WASD move · Q/E dive/rise · Shift boost · Esc release';
  });
  document.addEventListener('mousemove', (event) => {
    if (!state.pointerLocked || state.view !== 'pilot') return;
    runtime.cameraEuler.setFromQuaternion(runtime.camera.quaternion);
    runtime.cameraEuler.y -= event.movementX * .0018;
    runtime.cameraEuler.x -= event.movementY * .0018;
    runtime.cameraEuler.x = clamp(runtime.cameraEuler.x, -Math.PI / 2 + .04, Math.PI / 2 - .04);
    runtime.camera.quaternion.setFromEuler(runtime.cameraEuler);
  });

  window.addEventListener('keydown', (event) => {
    state.keys.add(event.code);
    const editing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName);
    if (event.code === 'KeyR' && !editing) {
      event.preventDefault();
      readConfigFromUI();
      buildWorld();
    }
    if (event.code === 'Escape' && !help.classList.contains('hidden')) closeHelp();
  });
  window.addEventListener('keyup', (event) => state.keys.delete(event.code));
  window.addEventListener('blur', () => state.keys.clear());
  window.addEventListener('resize', () => {
    runtime.camera.aspect = innerWidth / innerHeight;
    runtime.camera.updateProjectionMatrix();
    runtime.renderer.setSize(innerWidth, innerHeight);
    runtime.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  });
}

initScene();
