export async function loadJson(path, fallback) {
  try {
    const response = await fetch(path);
    if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
    return await response.json();
  } catch (error) {
    console.warn('Could not load', path, error);
    return fallback;
  }
}

export function groupRaces(flatRaces) {
  const groups = new Map();
  for (const item of flatRaces || []) {
    if (!groups.has(item.categoryId)) groups.set(item.categoryId, { id: item.categoryId, name: item.category, races: [] });
    groups.get(item.categoryId).races.push(item);
  }
  return [...groups.values()];
}

export function chooseDefaultVoiceSource(manifest, terms) {
  const q = (terms || []).join(' ').toLowerCase();
  const scored = (manifest || []).map((item, idx) => {
    const hay = [item.source, item.speaker, item.file, item.kind].join(' ').toLowerCase();
    let score = 0;
    for (const term of q.split(/\s+/).filter(Boolean)) if (hay.includes(term)) score += 1;
    if (/greeting|confirmation|hello|ready/.test(hay)) score += 1;
    if (/wav|mp3|flac/.test(hay)) score += .5;
    return { item, score, idx };
  }).sort((a,b)=>b.score-a.score || a.idx-b.idx);
  return scored[0]?.item || null;
}

export function debounce(fn, ms=200) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
