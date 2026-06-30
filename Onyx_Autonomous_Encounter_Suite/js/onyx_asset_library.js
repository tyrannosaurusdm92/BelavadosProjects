"use strict";
/**
 * Onyx external asset library bridge.
 * Real assets are NOT bundled with this package. They are expected to remain in
 * the existing GitHub/local assets/ folder at the paths listed in JSON manifests.
 */
(function(){
  const DEFAULT_INDEX_URL = "assets/asset_manifest_index.json";
  const DEFAULT_RULES_URL = "assets/rules.json";
  const state = {
    baseUrl: "assets/",
    indexUrl: DEFAULT_INDEX_URL,
    rulesUrl: DEFAULT_RULES_URL,
    index: null,
    rules: null,
    files: [],
    folders: [],
    loaded: false,
    error: null
  };

  function cleanSlash(value){ return String(value || "").replace(/\\/g,"/").replace(/\/+$/,"/"); }
  function normalize(value){ return String(value || "").toLowerCase().replace(/[_\-]+/g," ").replace(/[^a-z0-9]+/g," ").trim(); }
  function assetUrl(path){
    const p = String(path || "").replace(/\\/g,"/").replace(/^\.\//,"");
    if(/^https?:\/\//i.test(p) || /^data:/i.test(p) || /^blob:/i.test(p)) return p;
    if(p.startsWith("assets/")) return p;
    return cleanSlash(state.baseUrl || "assets/") + p.replace(/^assets\//,"");
  }
  function folderMatch(file, folders){
    if(!folders || !folders.length) return true;
    const folder = String(file.folder || file.relative_path || "").toLowerCase();
    return folders.some(f => folder.includes(String(f).toLowerCase()));
  }
  function typeMatch(file, types){
    if(!types || !types.length) return true;
    const t = String(file.type || "").toLowerCase();
    return types.some(type => t === String(type).toLowerCase() || t.includes(String(type).toLowerCase()));
  }
  function score(file, terms){
    if(!terms.length) return 1;
    const hay = normalize([file.name, file.stem, file.folder, file.type, file.relative_path, (file.search_terms || []).join(" ")].join(" "));
    let s = 0;
    for(const term of terms){
      if(!term) continue;
      if(hay.includes(term)) s += 5;
      const pieces = term.split(/\s+/).filter(Boolean);
      for(const piece of pieces){ if(piece && hay.includes(piece)) s += 1; }
    }
    return s;
  }
  async function fetchJson(url){
    const response = await fetch(url, {cache:"no-cache"});
    if(!response.ok) throw new Error(`${url} returned ${response.status}`);
    return response.json();
  }
  function summarize(limit=12){
    const typeCounts = state.index?.type_counts || {};
    const topFolders = (state.folders || []).filter(f => f.folder !== "assets").sort((a,b)=>(b.recursive_file_count||0)-(a.recursive_file_count||0)).slice(0, limit);
    return {
      loaded: state.loaded,
      error: state.error ? String(state.error.message || state.error) : null,
      asset_root: state.index?.asset_root || "assets",
      total_file_count: state.files.length || state.index?.total_file_count || 0,
      total_size_bytes: state.index?.total_size_bytes || 0,
      type_counts: typeCounts,
      top_folders: topFolders.map(f => ({folder:f.folder, files:f.recursive_file_count, bytes:f.recursive_total_bytes, types:f.type_counts_recursive}))
    };
  }
  function search(query="", options={}){
    const terms = Array.isArray(query) ? query.map(normalize).filter(Boolean) : normalize(query).split(/\s+/).filter(Boolean);
    const folders = options.folders || options.folder ? [].concat(options.folders || options.folder) : null;
    const types = options.types || options.type ? [].concat(options.types || options.type) : null;
    const limit = Math.max(1, Math.min(Number(options.limit || 50), 500));
    return (state.files || [])
      .filter(file => folderMatch(file, folders) && typeMatch(file, types))
      .map(file => ({file, _score: score(file, terms)}))
      .filter(item => item._score > 0)
      .sort((a,b) => b._score - a._score || String(a.file.relative_path).localeCompare(String(b.file.relative_path)))
      .slice(0, limit)
      .map(item => Object.assign({}, item.file, {resolved_url: assetUrl(item.file.relative_path || item.file.url), match_score: item._score}));
  }
  function pick(query="", options={}){
    const results = search(query, Object.assign({}, options, {limit: options.limit || 25}));
    if(!results.length) return null;
    const seed = normalize(options.seed || query || "onyx");
    let n = 0;
    for(let i=0; i<seed.length; i++) n = (n + seed.charCodeAt(i) * (i + 1)) % 2147483647;
    return results[n % results.length];
  }
  function contextForPrompt(prompt="", limit=25){
    const text = normalize(prompt);
    const searches = [];
    const push = (label, q, opts) => searches.push({label, results: search(q, Object.assign({limit: Math.ceil(limit/4)}, opts || {}))});
    if(/map|terrain|scene|background|grid|floor|battlefield/.test(text)) push("maps_and_grids", prompt, {folders:["maps","grids"]});
    if(/hostile|monster|npc|token|creature|mob|boss|enemy/.test(text)) push("tokens", prompt, {folders:["tokens","dice_tokens"]});
    if(/trap|lock|door|chest|object|item|treasure|prop/.test(text)) push("items_and_objects", prompt, {folders:["items","tokens"]});
    if(/spell|aoe|effect|fire|ice|lightning|death|mood|aura|blast/.test(text)) push("effects", prompt, {folders:["aoe","fx","death_effects","onyx_moods"]});
    if(/sound|audio|dice|music/.test(text)) push("sounds", prompt, {folders:["sounds","dice_audio"]});
    if(!searches.length) {
      push("general_tokens", "hostile creature monster npc", {folders:["tokens"], limit:8});
      push("general_maps", "battle map terrain grid", {folders:["maps","grids"], limit:8});
      push("general_effects", "spell effect trap aura", {folders:["aoe","fx"], limit:8});
    }
    const flattened = [];
    const seen = new Set();
    for(const group of searches){
      group.results = group.results.filter(r => {
        const key = r.relative_path;
        if(seen.has(key)) return false;
        seen.add(key); flattened.push(r); return true;
      });
    }
    return {summary: summarize(8), groups: searches, selected_asset_paths: flattened.slice(0, limit).map(r => r.relative_path)};
  }
  async function load(options={}){
    state.baseUrl = cleanSlash(options.baseUrl || state.baseUrl || "assets/");
    state.indexUrl = options.indexUrl || DEFAULT_INDEX_URL;
    state.rulesUrl = options.rulesUrl || DEFAULT_RULES_URL;
    try{
      const [rules, index] = await Promise.all([fetchJson(state.rulesUrl).catch(err => ({load_error:String(err.message || err)})), fetchJson(state.indexUrl)]);
      state.rules = rules;
      state.index = index;
      state.files = Array.isArray(index.files) ? index.files : [];
      state.folders = Array.isArray(index.folders) ? index.folders : [];
      state.loaded = true;
      state.error = null;
      window.dispatchEvent(new CustomEvent("onyx-assets-ready", {detail:summarize()}));
      return state;
    }catch(error){
      state.loaded = false;
      state.error = error;
      window.dispatchEvent(new CustomEvent("onyx-assets-error", {detail:{message:String(error.message || error)}}));
      return state;
    }
  }
  const api = {
    state,
    load,
    ready: null,
    search,
    pick,
    url: assetUrl,
    summarize,
    contextForPrompt,
    get files(){ return state.files; },
    get folders(){ return state.folders; },
    get loaded(){ return state.loaded; },
    get error(){ return state.error; }
  };
  window.OnyxAssetLibrary = api;
  api.ready = load();
})();
