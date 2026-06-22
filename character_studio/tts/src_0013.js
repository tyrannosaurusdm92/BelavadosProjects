// Auto-generated for Belavadös Fantasy Voice Simulation JS.
// Source uploaded by user; generated package contains JS-only runtime plus docs.


export function clamp(value, min = 0, max = 10) {
  const n = Number(value);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

export function round(value, places = 3) {
  const f = 10 ** places;
  return Math.round(value * f) / f;
}

export function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toLowerCase();
}

export function seededUnit(seed = 'belavados') {
  let h = 2166136261;
  for (const ch of String(seed)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000000) / 1000000;
}

export function blendSliders(base, overlay, weight = 0.5) {
  const result = { ...base };
  for (const [key, value] of Object.entries(overlay || {})) {
    if (typeof value !== 'number') continue;
    const current = typeof result[key] === 'number' ? result[key] : 5;
    result[key] = clamp(current * (1 - weight) + value * 10 * weight);
  }
  return result;
}
