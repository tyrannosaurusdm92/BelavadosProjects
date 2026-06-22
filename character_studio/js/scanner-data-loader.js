(() => {
  'use strict';
  const S = window.BelavadosScanner;
  async function fetchJson(path){ const res = await fetch(path, {cache:'no-store'}); if(!res.ok) throw new Error(`${path} returned ${res.status}`); return res.json(); }
  async function readBundledJson(name){
    if(window.BELAVADOS_SCANNER_JSON_DATA && window.BELAVADOS_SCANNER_JSON_DATA[name]) return window.BELAVADOS_SCANNER_JSON_DATA[name];
    return fetchJson('json/'+name);
  }
  function setStatus(msg){ const el=S.$('resourceStatus'); if(el) el.textContent=msg; }
  function normalizeBundle(bundle, from){
    S.state.resources.biomes = bundle.biome?.biomeProfiles || bundle.biome?.biomes || [];
    S.state.resources.races = bundle.race?.raceOverlays || bundle.race?.races || [];
    S.state.resources.classes = bundle.class?.classes || [];
    S.state.resources.genders = bundle.gender?.genderIdentities || [];
    S.state.resources.emotions = bundle.emotion?.emotions || [];
    S.state.resources.math = bundle.math || null;
    S.state.loadedFrom = from;
    S.populateDatalists?.();
    S.renderResourceCounts?.();
    setStatus(`Loaded ${S.state.resources.biomes.length} biome accents, ${S.state.resources.races.length} race overlays, ${S.state.resources.classes.length} classes, ${S.countSubclasses()} subclasses, ${S.state.resources.genders.length} gender layers, and ${S.state.resources.emotions.length} emotions from ${from}.`);
  }
  S.countSubclasses = function(){ return S.state.resources.classes.reduce((n,c)=>n+(c.subclasses?.length||0),0); };
  S.loadBundledResources = async function(){
    setStatus('Loading embedded scanner JSON, deep math, and local asset indexes…');
    try{
      const [biome,race,cls,gender,emotion,math] = await Promise.all([
        readBundledJson(S.JSON_FILES.biome), readBundledJson(S.JSON_FILES.race), readBundledJson(S.JSON_FILES.class), readBundledJson(S.JSON_FILES.gender), readBundledJson(S.JSON_FILES.emotion), readBundledJson(S.JSON_FILES.math)
      ]);
      normalizeBundle({biome,race,class:cls,gender,emotion,math}, window.BELAVADOS_SCANNER_JSON_DATA ? 'embedded JS data + json/ folder' : 'json/ folder');
      await S.loadDeepVoiceMath?.();
      await S.loadMergedAssets?.();
      S.populateDatalists?.();
      S.renderResourceCounts?.();
    }catch(err){ setStatus(`Bundled data could not auto-load. Select the included json/ folder. Details: ${err.message}`); }
  };
  S.handleJsonFolder = async function(evt){
    const files=[...evt.target.files].filter(f => f.name.endsWith('.json'));
    const byName=new Map(files.map(f => [f.name,f]));
    const read=async(name)=>{ const f=byName.get(name); if(!f) throw new Error(`Missing ${name}`); return JSON.parse(await f.text()); };
    try{
      const bundle={biome:await read(S.JSON_FILES.biome),race:await read(S.JSON_FILES.race),class:await read(S.JSON_FILES.class),gender:await read(S.JSON_FILES.gender),emotion:await read(S.JSON_FILES.emotion),math:byName.has(S.JSON_FILES.math) ? await read(S.JSON_FILES.math) : null};
      normalizeBundle(bundle, 'manual json folder import');
      await S.loadDeepVoiceMath?.();
      await S.loadMergedAssets?.();
      S.renderResourceCounts?.();
    }catch(err){ setStatus(`JSON folder import failed: ${err.message}`); }
  };
  S.loadSamples = async function(){
    try{
      const samples = await readBundledJson(S.JSON_FILES.samples);
      const lines = ['Name | Biome | Race | Class | Subclass | Gender | Personality'];
      for(const n of samples) lines.push([n.name,n.biome,n.race,n.className,n.subclass,n.genderIdentity,n.personality].join(' | '));
      S.$('pastedInput').value = lines.join('\n');
      S.state.profiles = samples.map(S.buildVoiceProfile);
      S.state.selectedIndex = 0;
      S.renderProfiles();
    }catch(err){ setStatus(`Sample load failed: ${err.message}`); }
  };
})();
